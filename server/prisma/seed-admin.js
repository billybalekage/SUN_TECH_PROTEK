require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { createAdmin } = require("../scripts/create-admin");

async function main() {
  const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME } =
    process.env;
  if (!DATABASE_URL) throw new Error("DATABASE_URL est requis");
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_FULL_NAME) {
    throw new Error(
      "Définissez ADMIN_EMAIL, ADMIN_PASSWORD et ADMIN_FULL_NAME dans l'environnement",
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: DATABASE_URL }),
  });
  try {
    const result = await createAdmin({
      prisma,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      fullName: ADMIN_FULL_NAME,
      company: process.env.ADMIN_COMPANY,
      phone: process.env.ADMIN_PHONE,
    });
    console.log(
      result.created
        ? `Administrateur créé : ${result.user.email}`
        : `Compte administrateur déjà présent : ${result.user.email}`,
    );
    return result;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Échec du seed administrateur : ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { main };
