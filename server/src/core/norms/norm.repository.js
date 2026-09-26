const prisma = require("../../config/database");

/**
 * Récupère une règle normative par son code unique.
 * @param {string} code - ex: "DELTA_U_MAX"
 */
async function findByCode(code) {
  return prisma.normRule.findUnique({ where: { code } });
}

async function listAll() {
  return prisma.normRule.findMany({ orderBy: { code: "asc" } });
}

/**
 * Crée ou met à jour une règle normative (utilisé par le seed, et
 * potentiellement plus tard par un écran d'administration des normes).
 */
async function upsertRule({ code, description, parameters, effectiveDate }) {
  return prisma.normRule.upsert({
    where: { code },
    create: { code, description, parameters, effectiveDate },
    update: { description, parameters, effectiveDate },
  });
}

module.exports = { findByCode, listAll, upsertRule };
