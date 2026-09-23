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

function calculateChuteTension(
  resistivity,
  length,
  voltage,
  section,
  Ib,
  cosPhi,
  phaseType,
) {
  if (voltage <= 0) {
    throw new Error("La tension doit être positive.");
  }
  if (cosPhi < 0 || cosPhi > 1) {
    throw new Error("Le facteur de puissance doit être compris entre 0 et 1.");
  }
  if (phaseType === "1N") {
    return;
  }
  if (phaseType === "3N") {
    return;
  }
}

function calculateChuteTensionPercent(
  resistivity,
  length,
  voltage,
  section,
  Ib,
  cosPhi,
  phaseType,
) {}
