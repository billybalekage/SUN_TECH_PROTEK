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
 * Intended to calculate single-phase voltage drop as a percentage of supply
 * voltage; the three-phase branch has no result. This module currently fails
 * to parse, so the function cannot be called.
 * @param {object} params
 * @param {number} params.rho - Conductor resistivity in Ω·mm²/m.
 * @param {number} params.length - Cable length in m.
 * @param {number} params.ib - Operating current in amperes.
 * @param {number} params.cosPhi - Power factor; unused in the single-phase expression.
 * @param {number} params.section - Conductor cross-sectional area in mm².
 * @param {number} params.voltage - Supply voltage in V.
 * @param {"1N"|"3N"} params.phaseType - Single-phase or three-phase circuit.
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
 * Intended to select the smallest standard area at least as large as the
 * requested area. This module cannot currently be parsed, and its
 * standard-section list is undefined.
 *
 * @param {number} value - Conductor cross-sectional area in mm²; must be positive.
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
