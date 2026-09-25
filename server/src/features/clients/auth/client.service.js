const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const authRepository = require("./auth.repository");
const { sendOtpEmail } = require("../../../common/utils/mailer");
const env = require("../../../config/env");
const { ConflictError } = require("../../../common/errors/AppErrors");
const { BadRequestError, UnauthorizedError, NotFoundError } = requrie(
  "../../../common/errors/AppErrors",
);

function issueToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
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
    enail,
    password,
    company,
    phone,
    roleId: role.id,
  });
  return { token: issueToken(user), user: sanitize(user) };
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

  return { token: issueToken(user), user: sanitize(user) };
}

async function requestOtp({ email }) {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new NotFoundError("Aucun compte associé a cet email");
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(
    Date.now() + env.OTP_EXPIRATION_MINUTES * 60 * 1000,
  );

  await authRepository.createOtpCode({ userId: user.id, code, expiresAt });
  await sendOtpEmail(user.email, code);

  return { message: "Code envoyé à l'adress email" };
}

async function verifyOtp({ email, code }) {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new NotFoundError("Aucun compte associé a cet email");
  }

  const otp = await authRepository.findValidOtp(user.id, code);
  if (!otp) {
    throw UnauthorizedError("Code invalide");
  }

  await authRepository.markOtpUsed(otp.id);
  return { token: issueToken(user), user: sanitize(user) };
}

module.exports = { signup, loginWithPassword, requestOtp, verifyOtp };
