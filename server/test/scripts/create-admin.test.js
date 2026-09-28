import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { createAdmin } from "../../scripts/create-admin.js";

const prisma = {
  role: { upsert: vi.fn() },
  user: { findUnique: vi.fn(), create: vi.fn() },
};

const input = {
  email: " ADMIN@EXAMPLE.COM ",
  password: "a-strong-admin-password",
  fullName: "Admin Test",
};

beforeEach(() => {
  vi.clearAllMocks();
  prisma.role.upsert.mockResolvedValue({ id: "role-admin", name: "ADMIN" });
  prisma.user.findUnique.mockResolvedValue(null);
  prisma.user.create.mockImplementation(async ({ data, include }) => ({
    id: "user-admin",
    ...data,
    ...(include.role ? { role: { id: data.roleId, name: "ADMIN" } } : {}),
  }));
});

describe("createAdmin", () => {
  it("creates an ADMIN account with a normalized email and hashed password", async () => {
    const result = await createAdmin({ prisma, ...input });

    expect(prisma.role.upsert).toHaveBeenCalledWith({
      where: { name: "ADMIN" },
      update: {},
      create: { name: "ADMIN", permissions: [] },
    });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "admin@example.com",
          fullName: "Admin Test",
          roleId: "role-admin",
        }),
        include: { role: true },
      }),
    );
    const savedPassword = prisma.user.create.mock.calls[0][0].data.passwordHash;
    expect(await bcrypt.compare(input.password, savedPassword)).toBe(true);
    expect(result.created).toBe(true);
    expect(result.user.passwordHash).toBeUndefined();
  });

  it("does not replace an existing administrator or its password", async () => {
    const existingUser = {
      id: "existing-admin",
      email: "admin@example.com",
      passwordHash: "existing-hash",
      role: { name: "ADMIN" },
    };
    prisma.user.findUnique.mockResolvedValue(existingUser);

    const result = await createAdmin({ prisma, ...input });

    expect(result.created).toBe(false);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(result.user.passwordHash).toBeUndefined();
  });

  it("treats a P2002 race as repeat-safe when the raced account is an admin", async () => {
    const uniqueError = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
    });
    const racedAdmin = {
      id: "raced-admin",
      email: "admin@example.com",
      passwordHash: "existing-hash",
      role: { name: "ADMIN" },
    };
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(racedAdmin);
    prisma.user.create.mockRejectedValueOnce(uniqueError);

    const result = await createAdmin({ prisma, ...input });

    expect(result).toEqual({
      created: false,
      user: {
        id: "raced-admin",
        email: "admin@example.com",
        role: { name: "ADMIN" },
      },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
  });

  it("propagates unexpected account-creation errors without looking up a duplicate", async () => {
    const databaseError = new Error("Database unavailable");
    prisma.user.create.mockRejectedValueOnce(databaseError);

    await expect(createAdmin({ prisma, ...input })).rejects.toBe(databaseError);

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it("refuses to promote an existing non-administrator account", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "existing-user",
      email: "admin@example.com",
      role: { name: "ELECTRICIEN" },
    });

    await expect(createAdmin({ prisma, ...input })).rejects.toThrow(
      "compte non-administrateur",
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("requires a strong password before touching Prisma", async () => {
    await expect(
      createAdmin({ prisma, ...input, password: "short" }),
    ).rejects.toThrow("au moins 12 caractères");
    expect(prisma.role.upsert).not.toHaveBeenCalled();
  });
});
