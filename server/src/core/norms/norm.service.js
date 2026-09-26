const normRepository = require("./repository");
const {
  NotFoundError,
  BadRequestError,
} = require("../../common/errors/AppErrors");

/**
 * Retourne le seuil de chute de tension maximale admissible (%),
 * selon le type d'usage du circuit.
 *
 * @param {"ECLAIRAGE"|"AUTRES_USAGES"} usageType
 * @returns {Promise<number>}
 * 
 * @param {object} params
 * @param {string} params.installMethod - Méthode de référence ("B1", "C", ...)
 * @param {string} params.insulation - "PVC" ou "PR"
 * @param {string} params.conductorMaterial - "CU" ou "AL"
 * @param {number} params.section - Section du câble (mm²)
 * @returns {Promise<number>}
 * @param {object} params
 * @param {string} params.installMethod
 * @param {string} params.insulation
 * @param {string} params.conductorMaterial
 * @param {number} params.requiredCurrent - Courant corrigé (Iz') en A
 * @returns {Promise<number|null>} Section (mm²), ou null si aucune ne suffit

 */
async function getMaxDeltaUPercent(usageType) {
  const rule = await normRepository.findByCode("DELTA_U_MAX");
  if (!rule) {
    throw new NotFoundError(
      "Règle normative DELTA_U_MAX introuvable — avez-vous lancé le seed ?",
    );
  }

  const value = rule.parameters?.[usageType];
  if (value === undefined) {
    throw new NotFoundError(
      `Aucun seuil DELTA_U_MAX défini pour l'usage "${usageType}"`,
    );
  }

  return value;
}

async function getBaseAmpacity({
  installMethod,
  insulation,
  conductorMaterial,
  section,
}) {
  const rule = await normRepository.findByCode("AMPACITY_TABLE");
  if (!rule) {
    throw new NotFoundError(
      "Règle normative AMPACITY_TABLE introuvable — avez-vous lancé le seed ?",
    );
  }

  const table =
    rule.parameters?.[installMethod]?.[insulation]?.[conductorMaterial];
  if (!table) {
    throw new BadRequestError(
      `Aucune table d'intensité admissible pour la combinaison ${installMethod}/${insulation}/${conductorMaterial}`,
    );
  }

  const value = table[section];
  if (value === undefined) {
    throw new BadRequestError(
      `Section ${section}mm² absente de la table ${installMethod}/${insulation}/${conductorMaterial}`,
    );
  }

  return value;
}

async function findMinSectionForAmpacity({
  installMethod,
  insulation,
  conductorMaterial,
  requiredCurrent,
}) {
  const rule = await normRepository.findByCode("AMPACITY_TABLE");
  if (!rule) {
    throw new NotFoundError(
      "Règle normative AMPACITY_TABLE introuvable — avez-vous lancé le seed ?",
    );
  }

  const table =
    rule.parameters?.[installMethod]?.[insulation]?.[conductorMaterial];
  if (!table) {
    throw new BadRequestError(
      `Aucune table d'intensité admissible pour la combinaison ${installMethod}/${insulation}/${conductorMaterial}`,
    );
  }

  const sortedSections = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);

  const match = sortedSections.find(
    (section) => table[section] >= requiredCurrent,
  );
  return match ?? null;
}

module.exports = {
  getMaxDeltaUPercent,
  getBaseAmpacity,
  findMinSectionForAmpacity,
};
