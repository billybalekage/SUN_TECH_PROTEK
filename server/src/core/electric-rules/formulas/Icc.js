// Coefficient de la méthode conventionnelle (UTE C15-105)
const CONVENTIONAL_COEFFICIENT = 0.8;

/**
 * Rejects zero or negative inputs, naming the rejected quantity in the error.
 * @throws {Error} If value is zero or negative.
 */
function validatePositive(value, label) {
  if (value <= 0) throw new Error(`${label} doit être positif`);
}

/**
 * Calculates minimum short-circuit current at the end of a conductor using
 * the conventional UTE C15-105 method, not maximum short-circuit current.
 *
 * @param {object} params
 * @param {number} params.voltage - Voltage in V (phase-to-neutral for "1N", line-to-line for "3N").
 * @param {number} params.section - Phase conductor cross-sectional area in mm².
 * @param {number} params.length - Cable length in m.
 * @param {number} params.rho - Conductor resistivity in Ω·mm²/m.
 * @param {number} [params.m=1] - Phase-to-neutral conductor area ratio; affects only "1N".
 * @param {"1N"|"3N"} params.phaseType - Single-phase or three-phase circuit.
 * @returns {number} Minimum short-circuit current in amperes.
 * @throws {Error} If voltage, section, length, rho, or m is zero or negative,
 *   or phaseType is not "1N" or "3N".
 */
function calculateIccMin({ voltage, section, length, rho, m = 1, phaseType }) {
  validatePositive(voltage, "U");
  validatePositive(section, "S");
  validatePositive(length, "L");
  validatePositive(rho, "rho");
  validatePositive(m, "m");

  if (phaseType === "1N") {
    return (
      (CONVENTIONAL_COEFFICIENT * voltage * section) / (rho * length * (1 + m))
    );
  }
  if (phaseType === "3N") {
    return (
      (CONVENTIONAL_COEFFICIENT * voltage * section) /
      (rho * length * Math.sqrt(3))
    );
  }
  throw new Error(`Type de phase inconnu : ${phaseType}`);
}

module.exports = { CONVENTIONAL_COEFFICIENT, calculateIccMin };
