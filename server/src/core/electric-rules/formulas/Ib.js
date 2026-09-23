/**
 * Calcule le courant d'emploi Ib.
 * @param {number} power - Puissance P en watts
 * @param {number} voltage - Tension U en volts
 * @param {number} cosPhi - Facteur de puissance (0 à 1)
 * @param {"1N"|"3N"} phaseType - Type de phase
 * @returns {number} Ib en ampères
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