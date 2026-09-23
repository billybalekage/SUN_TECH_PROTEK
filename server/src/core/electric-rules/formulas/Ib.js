/**
 * Calculate operating current for single-phase or three-phase power.
 * @param {number} power - Power in watts; must be greater than zero.
 * @param {number} voltage - Voltage in volts; must be greater than zero.
 * @param {number} cosPhi - Power factor from 0 to 1; zero is accepted and can yield Infinity.
 * @param {"1N"|"3N"} phaseType - "1N" for single-phase or "3N" for three-phase.
 * @returns {number|undefined} Current in amperes, or undefined for an unrecognized phase type.
 * @throws {Error} If power or voltage is at most zero, or cosPhi is outside 0 to 1.
 */

function calculateIb(power, voltage, cosPhi, phaseType) {
  if (power <= 0) {
    throw new Error("La puissance doit être positive.");
  }
  if (voltage <= 0) {
    throw new Error("La tension doit être positive.");
  }
  if (cosPhi < 0 || cosPhi > 1) {
    throw new Error("Le facteur de puissance doit être compris entre 0 et 1.");
  }

  if (phaseType === "1N") {
    return power / (voltage * cosPhi);
  }
  if (phaseType === "3N") {
    return power / (Math.sqrt(3) * voltage * cosPhi);
  }
}


module.exports = {
  calculateIb,
};