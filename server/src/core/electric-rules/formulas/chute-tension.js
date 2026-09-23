const RESISTIVITY = {
  COPPER: 0.0225,
  ALUMINUM: 0.036,
};

const STANDARD_SECTIONS = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240,
];

function validateCommonParams({ rho, length, ib, cosPhi, voltage, phaseType }) {
  if (rho <= 0) throw new Error("La résistivité (rho) doit être positive");
  if (length <= 0) throw new Error("La longueur (L) doit être positive");
  if (ib <= 0) throw new Error("Le courant d'emploi (Ib) doit être positif");
  if (cosPhi <= 0 || cosPhi > 1)
    throw new Error("cosPhi doit être entre 0 (exclu) et 1");
  if (voltage <= 0) throw new Error("La tension (U) doit être positive");
  if (phaseType !== "1N" && phaseType !== "3N") {
    throw new Error(`Type de phase inconnu : ${phaseType}`);
  }
}

/**
 * Calcule la chute de tension en pourcentage, pour une section donnée.
 * Sert à VÉRIFIER une section déjà choisie (pas à la dimensionner).
 *
 * @param {object} params
 * @param {number} params.rho - Résistivité du conducteur (Ω·mm²/m)
 * @param {number} params.length - Longueur du câble en m
 * @param {number} params.ib - Courant d'emploi Ib en A
 * @param {number} params.cosPhi - Facteur de puissance (0 à 1)
 * @param {number} params.section - Section du câble en mm²
 * @param {number} params.voltage - Tension nominale U en V
 * @param {"1N"|"3N"} params.phaseType - Type de phase
 * @returns {number} ΔU en pourcentage
 */
function calculateDeltaUPercent({
  rho,
  length,
  ib,
  cosPhi,
  section,
  voltage,
  phaseType,
}) {
  validateCommonParams({ rho, length, ib, cosPhi, voltage, phaseType });
  if (section <= 0) throw new Error("La section (S) doit être positive");

  if (phaseType === "1N") {
    return (2 * rho * length * ib * 100) / (section * voltage);
  }

  return (
    (Math.sqrt(3) * rho * length * ib * cosPhi * 100) / (section * voltage)
  );
}

/**
 * Calcule la section minimale de câble nécessaire pour respecter
 * un seuil de chute de tension maximal admissible (dimensionnement).
 *
 * @param {object} params
 * @param {number} params.rho - Résistivité du conducteur (Ω·mm²/m)
 * @param {number} params.length - Longueur du câble en m
 * @param {number} params.ib - Courant d'emploi Ib en A
 * @param {number} params.cosPhi - Facteur de puissance (0 à 1)
 * @param {number} params.voltage - Tension nominale U en V
 * @param {number} params.maxDeltaUPercent - Chute de tension maximale admissible (%)
 * @param {"1N"|"3N"} params.phaseType - Type de phase
 * @returns {number} Section minimale S en mm² (valeur brute, non normalisée)
 */
function calculateMinSectionByVoltageDrop({
  rho,
  length,
  ib,
  cosPhi,
  voltage,
  maxDeltaUPercent,
  phaseType,
}) {
  validateCommonParams({ rho, length, ib, cosPhi, voltage, phaseType });
  if (maxDeltaUPercent <= 0) {
    throw new Error("Le seuil de chute de tension maximal doit être positif");
  }

  if (phaseType === "1N") {
    return (2 * rho * length * ib * 100) / (maxDeltaUPercent * voltage);
  }
  // '3N'
  return (
    (Math.sqrt(3) * rho * length * ib * cosPhi * 100) /
    (maxDeltaUPercent * voltage)
  );
}

/**
 * Arrondit une section brute à la section normalisée immédiatement supérieure.
 *
 * @param {number} value - Section brute calculée (mm²)
 * @returns {number|null} Section normalisée (mm²), ou null si aucune section
 *   du catalogue standard n'est suffisante.
 */
function roundToStandardSection(value) {
  if (value <= 0) throw new Error("La section à arrondir doit être positive");
  return STANDARD_SECTIONS.find((s) => s >= value) ?? null;
}

module.exports = {
  RESISTIVITY,
  STANDARD_SECTIONS,
  calculateDeltaUPercent,
  calculateMinSectionByVoltageDrop,
  roundToStandardSection,
};
