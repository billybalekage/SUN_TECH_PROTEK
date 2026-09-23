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
    return (2 * rho * length * ib * 100) / (section * voltage);
  }
  if (phaseType === "3N") {
    return;
  }
}

function calculateChuteTensionPercent(
  resistivity,
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
