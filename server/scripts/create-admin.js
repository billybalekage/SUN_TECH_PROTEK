const bcrypt = require("bcryptjs");

const ADMIN_ROLE = "ADMIN";
const PASSWORD_MIN_LENGTH = 12;

function validateAdminInput({ email, password, fullName }) {
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw new Error("ADMIN_EMAIL doit contenir une adresse email valide");
  }
  if (typeof fullName !== "string" || fullName.trim().length < 2) {
    throw new Error("ADMIN_FULL_NAME doit contenir au moins 2 caractères");
  }
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`,
    );
  }
}

async function createAdmin({
  prisma,
  email,
  password,
  fullName,
  company = null,
  phone = null,
}) {
  validateAdminInput({ email, password, fullName });
  if (
    !prisma?.role?.upsert ||
    !prisma?.user?.findUnique ||
    !prisma?.user?.create
  ) {
    throw new TypeError("Un client Prisma valide est requis");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const role = await prisma.role.upsert({
    where: { name: ADMIN_ROLE },
    update: {},
    create: { name: ADMIN_ROLE, permissions: [] },
  });

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { role: true },
  });
  if (existingUser) {
    if (existingUser.role?.name !== ADMIN_ROLE) {
      throw new Error(
        `L'adresse ${normalizedEmail} est déjà utilisée par un compte non-administrateur`,
      );
    }
    return { created: false, user: sanitizeUser(existingUser) };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        company,
        phone,
        roleId: role.id,
      },
      include: { role: true },
    });
    return { created: true, user: sanitizeUser(user) };
  } catch (error) {
    if (error.code !== "P2002") throw error;

    const racedUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: true },
    });
    if (racedUser?.role?.name === ADMIN_ROLE) {
      return { created: false, user: sanitizeUser(racedUser) };
    }
    throw error;
  }
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = { ADMIN_ROLE, createAdmin };
