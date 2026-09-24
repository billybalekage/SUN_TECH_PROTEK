const RESISTIVITY = 0.0225;
const STANDARD_SECTIONS = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240,
];

function validateCommonParams({ rho, length, ib, cosPhi, voltage, phaseType }) {
  if (rho <= 0) throw new Error("La résistivité doit être positive");
  if (length <= 0) throw new Error("La longueur doit être positive");
  if (ib <= 0) throw new Error("Le courant Ib doit être positif");
  if (voltage <= 0) throw new Error("La tension doit être positive");
  if (cosPhi < 0 || cosPhi > 1) {
    throw new Error("Le facteur de puissance doit être compris entre 0 et 1");
  }
  if (phaseType !== "1N" && phaseType !== "3N") {
    throw new Error("Le type de phase doit être 1N ou 3N");
  }
}

/**
 * Calcule le courant d'emploi Ib.
 * @param {number} resistivity - Résistivité en ohm-mètres
 * @param {number} length - Longueur du conducteur en mètres
 * @param {number} voltage - Tension nominale U en volts
 * @param {number} section - Section du conducteur en mm²
 * @param {number} Ib - Courant d'emploi en ampères
 * @param {number} cosPhi - Facteur de puissance (0 à 1)
 * @param {"1N"|"3N"} phaseType - Type de phase
 * @returns {number} chute de tension en volts
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
    return (2 * rho * length * ib * cosPhi * 100) / (section * voltage);
  }
  return (
    (Math.sqrt(3) * rho * length * ib * cosPhi * 100) / (section * voltage)
  );
}

function calculateMinSectionByVoltageDrop({
  rho = RESISTIVITY,
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
    return (
      (2 * rho * length * ib * cosPhi * 100) / (maxDeltaUPercent * voltage)
    );
  }
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
