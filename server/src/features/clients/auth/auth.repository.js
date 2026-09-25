const prisma = require("../../../config/database");

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
  return prisma.otpCode.create({ data: { userId, code, expiresAt } });
}

async function findValidOtp(userId, code) {
  return prisma.otpCode.findFirst({
    where: { userId, code, used: false, expiresAt: { gt: new Date() } },
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

module.exports = {
  findRoleByName,
  findUserByEmail,
  findUserById,
  createUser,
  createOtpCode,
  findValidOtp,
  markOtpUsed,
  invalidateUserOtps,
};
