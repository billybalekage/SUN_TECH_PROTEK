const normRepository = require("./norm.repository");
const {
  NotFoundError,
  BadRequestError,
} = require("../../common/errors/AppErrors");

/**
 * Retourne le seuil de chute de tension maximale admissible (%),
 * selon le type d'usage du circuit.
 *
 * @param {"ECLAIRAGE"|"AUTRES_USAGES"} usageType
 * @returns {Promise<number>} Seuil configuré en pourcentage.
 * @throws {NotFoundError} Si la règle ou le seuil pour cet usage est absent.
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
 * Retourne l'intensité admissible de base (Iz0) d'une section.
 *
 * @param {object} params
 * @param {string} params.installMethod Méthode de référence.
 * @param {string} params.insulation Type d'isolation.
 * @param {string} params.conductorMaterial Matériau du conducteur.
 * @param {number} params.section Section du câble en mm².
 * @returns {Promise<number>} Intensité admissible en ampères.
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
 * Recherche la plus petite section dont l'intensité admissible couvre le
 * courant requis.
 *
 * @param {object} params
 * @param {string} params.installMethod Méthode de référence.
 * @param {string} params.insulation Type d'isolation.
 * @param {string} params.conductorMaterial Matériau du conducteur.
 * @param {number} params.requiredCurrent Courant requis en ampères.
 * @returns {Promise<number|null>} Section en mm², ou null si aucune ne suffit.
 * @throws {NotFoundError} Si la règle AMPACITY_TABLE est absente.
 * @throws {BadRequestError} Si la combinaison n'existe pas dans la table.
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

/**
 * Retourne le facteur de correction K2 (groupement de circuits).
 * @param {number} numberOfCircuits - Nombre de circuits groupés ensemble
 * @returns {Promise<number>}
 */
async function getGroupingFactor(numberOfCircuits) {
  if (numberOfCircuits <= 0) {
    throw new BadRequestError("Le nombre de circuits doit être positif");
  }

  const rule = await normRepository.findByCode("K2_GROUPING");
  if (!rule) {
    throw new NotFoundError(
      "Règle normative K2_GROUPING introuvable — avez-vous lancé le seed ?",
    );
  }

  const key = numberOfCircuits <= 9 ? String(numberOfCircuits) : "10+";
  const value = rule.parameters?.[key];
  if (value === undefined) {
    throw new NotFoundError(
      `Aucune valeur K2 définie pour ${numberOfCircuits} circuits`,
    );
  }

  return value;
}

/**
 * Retourne le facteur de correction K3 (température ambiante).
 * @param {object} params
 * @param {number} params.ambientTempCelsius - Température ambiante (°C), doit correspondre à une valeur normalisée du tableau
 * @param {"PVC"|"PR"} params.insulation
 * @returns {Promise<number>}
 */
async function getTemperatureFactor({ ambientTempCelsius, insulation }) {
  const rule = await normRepository.findByCode("K3_TEMPERATURE");
  if (!rule) {
    throw new NotFoundError(
      "Règle normative K3_TEMPERATURE introuvable — avez-vous lancé le seed ?",
    );
  }

  const table = rule.parameters?.[insulation];
  if (!table) {
    throw new BadRequestError(
      `Aucune table K3 pour l'isolation "${insulation}"`,
    );
  }

  const value = table[String(ambientTempCelsius)];
  if (value === undefined) {
    throw new BadRequestError(
      `Température ${ambientTempCelsius}°C non répertoriée pour "${insulation}" — valeurs disponibles : ${Object.keys(table).join(", ")}`,
    );
  }

  return value;
}

module.exports = {
  getMaxDeltaUPercent,
  getBaseAmpacity,
  findMinSectionForAmpacity,
  getGroupingFactor,
  getTemperatureFactor,
};
