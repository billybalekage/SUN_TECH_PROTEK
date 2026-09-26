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
 * @throws {NotFoundError} Si la règle ou le seuil de cet usage est absent.
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

/**
 * Lit l'intensité admissible de base pour une section et une combinaison enregistrées.
 * @param {object} params - Critères de lecture de la table.
 * @param {string} params.installMethod - Méthode de référence ("B1", "C", ...).
 * @param {string} params.insulation - Isolation présente dans la table, par exemple "PVC".
 * @param {string} params.conductorMaterial - Matériau présent dans la table, par exemple "CU".
 * @param {number} params.section - Section du câble en mm².
 * @returns {Promise<number>} Intensité admissible de base (Iz0) en A.
 * @throws {NotFoundError} Si la règle AMPACITY_TABLE est absente.
 * @throws {BadRequestError} Si la combinaison ou la section est absente de la table.
 */
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

/**
 * Recherche la plus petite section enregistrée supportant le courant demandé.
 * @param {object} params - Critères de recherche dans la table.
 * @param {string} params.installMethod - Méthode de référence enregistrée.
 * @param {string} params.insulation - Isolation enregistrée.
 * @param {string} params.conductorMaterial - Matériau du conducteur enregistré.
 * @param {number} params.requiredCurrent - Courant corrigé (Iz') en A.
 * @returns {Promise<number|null>} Section en mm², ou null si aucune ne suffit.
 * @throws {NotFoundError} Si la règle AMPACITY_TABLE est absente.
 * @throws {BadRequestError} Si la combinaison est absente de la table.
 */
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
