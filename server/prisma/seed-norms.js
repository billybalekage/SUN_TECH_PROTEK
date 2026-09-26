require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Crée ou actualise les seuils de chute de tension et journalise le succès.
 * @returns {Promise<void>} Résout après les opérations et leur affichage.
 */
async function main() {
  await prisma.normRule.upsert({
    where: { code: "DELTA_U_MAX" },
    create: {
      code: "DELTA_U_MAX",
      description:
        "Chute de tension maximale admissible (NF C 15-100, tableau 52J)",
      parameters: {
        ECLAIRAGE: 3,
        AUTRES_USAGES: 5,
      },
      effectiveDate: new Date("2015-06-01"),
    },
    update: {
      parameters: { ECLAIRAGE: 3, AUTRES_USAGES: 5 },
    },
  });

  console.log("✅ Règle DELTA_U_MAX créée/à jour.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
