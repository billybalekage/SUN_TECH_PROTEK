import { beforeEach, describe, expect, it, vi } from "vitest";
import Module from "node:module";

const require = Module.createRequire(import.meta.url);

const mockAuthRepository = {
  findUserByEmail: vi.fn(),
  findRoleByName: vi.fn(),
  createUser: vi.fn(),
  findUserById: vi.fn(),
  createOtpCode: vi.fn(),
  findValidOtp: vi.fn(),
  markOtpUsed: vi.fn(),
  invalidateUserOtps: vi.fn(),
  updateUserPassword: vi.fn(),
  revokeAllUserRefreshTokens: vi.fn(),
  createRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  rotateRefreshToken: vi.fn(),
  revokeRefreshTokenFamily: vi.fn(),
};

const mockMailer = {
  sendOtpEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "./auth.repository" || request.endsWith("/auth.repository")) {
    return mockAuthRepository;
  }

  if (
    request === "../../../common/utils/mailer" ||
    request.endsWith("/common/utils/mailer.js")
  ) {
    return mockMailer;
  }

  if (
    request === "../../../config/database" ||
    request.endsWith("/config/database.js")
  ) {
    return {};
  }

  return originalLoad.apply(this, arguments);
};

const clientService = require("./client.service");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("client auth service", () => {
  it("hashes OTP codes before persisting them", async () => {
    mockAuthRepository.findUserByEmail.mockResolvedValue({
      id: "user-1",
      email: "client@example.com",
      isActive: true,
      role: { name: "ELECTRICIEN" },
    });
    mockAuthRepository.createOtpCode.mockImplementation(
      async (payload) => payload,
    );
    mockMailer.sendOtpEmail.mockResolvedValue(undefined);

    await clientService.requestOtp({ email: "client@example.com" });

    expect(mockAuthRepository.createOtpCode).toHaveBeenCalledTimes(1);
    const otpPayload = mockAuthRepository.createOtpCode.mock.calls[0][0];
    expect(otpPayload.code).not.toBe(mockMailer.sendOtpEmail.mock.calls[0][1]);
    expect(otpPayload.code).toMatch(/^[a-f0-9]{64}$/i);
    expect(mockAuthRepository.invalidateUserOtps).toHaveBeenCalledWith(
      "user-1",
      "LOGIN",
    );
    expect(otpPayload.purpose).toBe("LOGIN");
  });

  it("requests password reset without revealing unknown accounts", async () => {
    mockAuthRepository.findUserByEmail.mockResolvedValue(null);

    const result = await clientService.requestPasswordReset({
      email: "unknown@example.com",
    });

    expect(result.message).toContain("Si un compte correspond");
    expect(mockAuthRepository.createOtpCode).not.toHaveBeenCalled();
    expect(mockMailer.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("stores and emails a purpose-bound password reset code", async () => {
    mockAuthRepository.findUserByEmail.mockResolvedValue({
      id: "user-1",
      email: "client@example.com",
    });
    mockAuthRepository.createOtpCode.mockResolvedValue(undefined);
    mockMailer.sendPasswordResetEmail.mockResolvedValue(undefined);

    await clientService.requestPasswordReset({ email: "client@example.com" });

    const otpPayload = mockAuthRepository.createOtpCode.mock.calls[0][0];
    expect(otpPayload.purpose).toBe("PASSWORD_RESET");
    expect(mockAuthRepository.invalidateUserOtps).toHaveBeenCalledWith(
      "user-1",
      "PASSWORD_RESET",
    );
    expect(otpPayload.code).toMatch(/^[a-f0-9]{64}$/i);
    expect(otpPayload.code).not.toBe(
      mockMailer.sendPasswordResetEmail.mock.calls[0][1],
    );
  });

  it("resets the password and revokes existing refresh tokens", async () => {
    mockAuthRepository.findUserByEmail.mockResolvedValue({
      id: "user-1",
      isActive: true,
      role: { name: "ELECTRICIEN" },
    });
    mockAuthRepository.findValidOtp.mockResolvedValue({ id: "otp-1" });

    await clientService.resetPassword({
      email: "client@example.com",
      code: "123456",
      newPassword: "new-password",
    });

    expect(mockAuthRepository.findValidOtp).toHaveBeenCalledWith(
      "user-1",
      "123456",
      "PASSWORD_RESET",
    );
    expect(mockAuthRepository.updateUserPassword).toHaveBeenCalledWith(
      "user-1",
      expect.not.stringContaining("new-password"),
    );
    expect(mockAuthRepository.markOtpUsed).toHaveBeenCalledWith("otp-1");
    expect(mockAuthRepository.revokeAllUserRefreshTokens).toHaveBeenCalledWith(
      "user-1",
    );
  });

  it("requires the current password before changing it", async () => {
    mockAuthRepository.findUserById.mockResolvedValue({
      id: "user-1",
      isActive: true,
      passwordHash: "$2a$10$invalid-hash",
      role: { name: "ELECTRICIEN" },
    });

    await expect(
      clientService.changePassword("user-1", {
        currentPassword: "wrong-password",
        newPassword: "new-password",
      }),
    ).rejects.toThrow("Mot de passe actuel incorrect");

    expect(mockAuthRepository.updateUserPassword).not.toHaveBeenCalled();
  });

  it("rejects password changes for users outside the electrician role", async () => {
    mockAuthRepository.findUserById.mockResolvedValue({
      id: "user-1",
      isActive: true,
      passwordHash: "password-hash",
      role: { name: "ADMIN" },
    });

    await expect(
      clientService.changePassword("user-1", {
        currentPassword: "current-password",
        newPassword: "new-password",
      }),
    ).rejects.toThrow("Utilisateur non authentifié");

    expect(mockAuthRepository.updateUserPassword).not.toHaveBeenCalled();
  });

  it("returns a sanitized user from the current session", async () => {
    mockAuthRepository.findUserById.mockResolvedValue({
      id: "user-1",
      email: "client@example.com",
      fullName: "Client Test",
      company: "Sun Tech",
      phone: "0600000000",
      passwordHash: "super-secret",
      role: { name: "ELECTRICIEN" },
      isActive: true,
    });

    const user = await clientService.getCurrentUser("user-1");

    expect(user).toMatchObject({
      id: "user-1",
      email: "client@example.com",
      fullName: "Client Test",
      company: "Sun Tech",
      phone: "0600000000",
    });
    expect(user.passwordHash).toBeUndefined();
  });

  it("rejects a refresh when the token family was already rotated or revoked", async () => {
    const jwt = await import("jsonwebtoken");
    const { env } = await import("../../../config/env");

    const refreshToken = jwt.sign(
      { id: "user-1", jti: "token-jti", familyId: "family-1" },
      env.jwt.refreshSecret,
      { expiresIn: "30d" },
    );

    mockAuthRepository.findUserById.mockResolvedValue({
      id: "user-1",
      email: "client@example.com",
      isActive: true,
      role: { name: "ELECTRICIEN" },
    });
    mockAuthRepository.findRefreshToken.mockResolvedValue({
      id: "refresh-1",
      familyId: "family-1",
      expiresAt: new Date(Date.now() + 60_000),
    });
    mockAuthRepository.rotateRefreshToken.mockResolvedValue(false);

    await expect(clientService.refreshSession(refreshToken)).rejects.toThrow(
      "Session révoquée",
    );
  });
});
