require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ⚠️ Valeurs indicatives issues de la NF C 15-100 (tableau 52C, 3 conducteurs
// chargés, cuivre, PVC) — À VÉRIFIER contre votre édition officielle de la
// norme avant tout usage en production. Seules les méthodes B1 (conduit
// encastré) et C (câble posé sur paroi) sont renseignées ci-dessous ; les
// autres (B2, D, E, F) suivent le même schéma et peuvent être ajoutées
// au besoin.
const AMPACITY_TABLE = {
  B1: {
    PVC: {
      CU: {
        1.5: 15.5,
        2.5: 21,
        4: 28,
        6: 36,
        10: 50,
        16: 68,
        25: 89,
        35: 110,
        50: 134,
        70: 171,
        95: 207,
        120: 239,
        150: 262,
        185: 296,
        240: 346,
      },
    },
  },
  C: {
    PVC: {
      CU: {
        1.5: 19.5,
        2.5: 27,
        4: 36,
        6: 46,
        10: 63,
        16: 85,
        25: 112,
        35: 138,
        50: 168,
        70: 213,
        95: 258,
        120: 299,
        150: 344,
        185: 392,
        240: 461,
      },
    },
  },
};

async function main() {
  await prisma.normRule.upsert({
    where: { code: "AMPACITY_TABLE" },
    create: {
      code: "AMPACITY_TABLE",
      description:
        "Intensités admissibles de base (Iz0) par méthode de référence, isolation et matériau — NF C 15-100 tableau 52C",
      parameters: AMPACITY_TABLE,
      effectiveDate: new Date("2015-06-01"),
    },
    update: { parameters: AMPACITY_TABLE },
  });
  console.log("✅ Règle AMPACITY_TABLE créée/à jour.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
