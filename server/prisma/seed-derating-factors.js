// prisma/seed-derating-factors.js
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ⚠️ Valeurs indicatives issues de la NF C 15-100 (tableaux 52K et 52H) —
// À VÉRIFIER contre votre édition officielle avant usage en production.
// K2 simplifié à des paliers 1 à 9, puis un palier unique "10+" (la norme
// détaille davantage au-delà de 9 circuits groupés — à affiner si besoin).
const K2_GROUPING = {
  1: 1.0,
  2: 0.8,
  3: 0.7,
  4: 0.65,
  5: 0.6,
  6: 0.57,
  7: 0.54,
  8: 0.52,
  9: 0.5,
  "10+": 0.45,
};

// K3, câbles à l'air, température ambiante de référence 30°C = 1.00
const K3_TEMPERATURE = {
  PVC: {
    10: 1.29,
    15: 1.22,
    20: 1.15,
    25: 1.08,
    30: 1.0,
    35: 0.91,
    40: 0.82,
    45: 0.71,
    50: 0.58,
    55: 0.41,
  },
  PR: {
    10: 1.15,
    15: 1.12,
    20: 1.08,
    25: 1.04,
    30: 1.0,
    35: 0.96,
    40: 0.91,
    45: 0.87,
    50: 0.82,
    55: 0.76,
    60: 0.71,
  },
};

async function main() {
  await prisma.normRule.upsert({
    where: { code: "K2_GROUPING" },
    create: {
      code: "K2_GROUPING",
      description:
        "Facteur de correction pour groupement de circuits (NF C 15-100, tableau 52K)",
      parameters: K2_GROUPING,
      effectiveDate: new Date("2015-06-01"),
    },
    update: { parameters: K2_GROUPING },
  });

  await prisma.normRule.upsert({
    where: { code: "K3_TEMPERATURE" },
    create: {
      code: "K3_TEMPERATURE",
      description:
        "Facteur de correction pour température ambiante, câbles à l'air (NF C 15-100, tableau 52H)",
      parameters: K3_TEMPERATURE,
      effectiveDate: new Date("2015-06-01"),
    },
    update: { parameters: K3_TEMPERATURE },
  });

  console.log("✅ Règles K2_GROUPING et K3_TEMPERATURE créées/à jour.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
