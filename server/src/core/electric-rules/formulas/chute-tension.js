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
    return (2 * rho * length * ib * 100) / (section * voltage);
  }
  if (phaseType === "3N") {
    return;
  }
}

/**
 * Intended to derive a conductor cross-sectional area from a maximum voltage
 * drop, but the module cannot currently be parsed. The expression also uses
 * an undefined rho instead of the resistivity argument.
 * @param {number} resistivity - Conductor resistivity input (currently unused).
 * @param {number} length - Cable length in m.
 * @param {number} ib - Operating current in amperes.
 * @param {number} cosPhi - Power factor in the three-phase expression.
 * @param {number} voltage - Supply voltage in V.
 * @param {number} maxDeltaUPercent - Maximum allowed voltage drop in percent.
 * @param {"1N"|"3N"} phaseType - Single-phase or three-phase circuit.
 */
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
