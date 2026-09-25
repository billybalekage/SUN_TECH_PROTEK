require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const name of ["ELECTRICIEN", "ADMIN"]) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, permissions: [] },
    });
  }
  console.log("Rôles créés/à jour.");
}

main().finally(() => prisma.$disconnect());
