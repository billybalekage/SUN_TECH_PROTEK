const crypto = require("crypto");
const prisma = require("../../../config/database");

function hashOtpCode(code) {
  return crypto.createHash("sha256").update(String(code).trim()).digest("hex");
}

function normalizeOtpCode(code) {
  const value = String(code).trim();

  if (/^[a-f0-9]{64}$/i.test(value)) {
    return value;
  }

  return hashOtpCode(value);
}

async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email }, include: { role: true } });
}

async function findUserById(id) {
  return prisma.user.findUnique({ where: { id }, include: { role: true } });
}

async function findRoleByName(name) {
  return prisma.role.findUnique({ where: { name } });
}

async function createUser({
  fullName,
  email,
  passwordHash,
  company,
  phone,
  roleId,
}) {
  return prisma.user.create({
    data: { fullName, email, passwordHash, company, phone, roleId },
    include: { role: true },
  });
}

async function createOtpCode({ userId, code, expiresAt }) {
  return prisma.otpCode.create({
    data: { userId, code: normalizeOtpCode(code), expiresAt },
  });
}

async function findValidOtp(userId, code) {
  const normalizedCode = normalizeOtpCode(code);
  const plainCode = String(code).trim();

  return prisma.otpCode.findFirst({
    where: {
      userId,
      used: false,
      expiresAt: { gt: new Date() },
      OR: [{ code: normalizedCode }, { code: plainCode }],
    },
    orderBy: { createdAt: "desc" },
  });
}

async function markOtpUsed(otpId) {
  return prisma.otpCode.update({ where: { id: otpId }, data: { used: true } });
}

async function invalidateUserOtps(userId) {
  return prisma.otpCode.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });
}

async function createRefreshToken(data) {
  return prisma.refreshToken.create({ data });
}

async function findRefreshToken({ jti, tokenHash }) {
  return prisma.refreshToken.findFirst({ where: { jti, tokenHash } });
}

async function rotateRefreshToken({ currentId, familyId, nextToken }) {
  return prisma.$transaction(async (transaction) => {
    const invalidated = await transaction.refreshToken.updateMany({
      where: { id: currentId, familyId, usedAt: null, revokedAt: null },
      data: { usedAt: new Date() },
    });

    if (invalidated.count !== 1) {
      await transaction.refreshToken.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return false;
    }

    await transaction.refreshToken.create({ data: nextToken });
    return true;
  });
}

async function revokeRefreshToken({ jti, tokenHash }) {
  return prisma.refreshToken.updateMany({
    where: { jti, tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function revokeRefreshTokenFamily(familyId) {
  return prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

module.exports = {
  findRoleByName,
  findUserByEmail,
  findUserById,
  createUser,
  createOtpCode,
  findValidOtp,
  markOtpUsed,
  invalidateUserOtps,
  createRefreshToken,
  findRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeRefreshTokenFamily,
};
