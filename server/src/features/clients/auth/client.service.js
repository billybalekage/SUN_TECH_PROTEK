const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const authRepository = require("./auth.repository");
const { sendOtpEmail } = require("../../../common/utils/mailer");
const { env } = require("../../../config/env");
const { ConflictError } = require("../../../common/errors/AppErrors");
const {
  BadRequestError,
  UnauthorizedError,
} = require("../../../common/errors/AppErrors");

function issueToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
    },
    env.jwt.accessSecret,
    { expiresIn: `${env.jwt.accessExpiresInMinutes}m` },
  );
}

function issueRefreshToken(user) {
  return jwt.sign({ id: user.id }, env.jwt.refreshSecret, {
    expiresIn: `${env.jwt.refreshExpiresInDays}d`,
  });
}

function sanitize(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function signup({ fullName, email, password, company, phone }) {
  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    throw new ConflictError("Un compte extiste deja avec cet email");
  }

  const role = await authRepository.findRoleByName("ELECTRICIEN");
  if (!role) {
    throw new BadRequestError("Ce role n'existe pas ");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await authRepository.createUser({
    fullName,
    email,
    passwordHash,
    company,
    phone,
    roleId: role.id,
  });
  return {
    token: issueToken(user),
    refreshToken: issueRefreshToken(user),
    user: sanitize(user),
  };
}

async function loginWithPassword({ email, password }) {
  const user = await authRepository.findUserByEmail(email);
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError("Email ou mot de passe incorrect");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Email ou mot de passe incorrect");
  }

  return {
    token: issueToken(user),
    refreshToken: issueRefreshToken(user),
    user: sanitize(user),
  };
}

async function requestOtp({ email }) {
  const genericResponse = {
    message:
      "Si un compte correspond à cette adresse e-mail, un code a été envoyé.",
  };

  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    return genericResponse;
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(
    Date.now() + env.OTP_EXPIRATION_MINUTES * 60 * 1000,
  );

  await authRepository.invalidateUserOtps(user.id);
  await authRepository.createOtpCode({ userId: user.id, code, expiresAt });
  await sendOtpEmail(user.email, code);

  return genericResponse;
}

async function verifyOtp({ email, code }) {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError("Code invalide");
  }

  const otp = await authRepository.findValidOtp(user.id, code);
  if (!otp) {
    throw new UnauthorizedError("Code invalide");
  }

  await authRepository.markOtpUsed(otp.id);
  return {
    token: issueToken(user),
    refreshToken: issueRefreshToken(user),
    user: sanitize(user),
  };
}

async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new UnauthorizedError("Refresh token manquant");
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    throw new UnauthorizedError("Refresh token invalide ou expiré");
  }

  if (!payload || typeof payload !== "object" || !payload.id) {
    throw new UnauthorizedError("Refresh token invalide ou expiré");
  }

  const user = await authRepository.findUserById(payload.id);
  if (!user || !user.isActive) {
    throw new UnauthorizedError("Session invalide");
  }

  return {
    token: issueToken(user),
    refreshToken: issueRefreshToken(user),
    user: sanitize(user),
  };
}

module.exports = {
  signup,
  loginWithPassword,
  requestOtp,
  verifyOtp,
  refreshSession,
};
