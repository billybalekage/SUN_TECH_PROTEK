/**
 * Currently returns no voltage drop; only voltage and cosPhi are validated.
 * @param {number} resistivity - Resistivity in ohm-meters (currently unused).
 * @param {number} length - Conductor length in meters (currently unused).
 * @param {number} voltage - Supply voltage in volts; must be greater than zero.
 * @param {number} section - Conductor cross-section in mm² (currently unused).
 * @param {number} Ib - Operating current in amperes (currently unused).
 * @param {number} cosPhi - Power factor from 0 to 1, inclusive.
 * @param {"1N"|"3N"} phaseType - Phase type (currently unused).
 * @returns {undefined} No voltage drop is computed.
 * @throws {Error} If voltage is non-positive or cosPhi is outside 0 to 1.
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

/**
 * Placeholder for percentage voltage drop; ignores all arguments and returns undefined.
 * @returns {undefined} No percentage is computed.
 */
function calculateChuteTensionPercent(
  resistivity,
  length,
  voltage,
  section,
  Ib,
  cosPhi,
  phaseType,
) {}
