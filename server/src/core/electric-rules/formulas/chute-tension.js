/**
 * Validate voltage and power factor for a voltage-drop calculation.
 * No drop is calculated yet; all other inputs are ignored.
 * @param {number} resistivity - Unused conductor resistivity.
 * @param {number} length - Unused conductor length.
 * @param {number} voltage - Nominal voltage in volts; must be greater than zero.
 * @param {number} section - Unused conductor cross-sectional area.
 * @param {number} Ib - Unused operating current.
 * @param {number} cosPhi - Power factor from 0 to 1, inclusive.
 * @param {"1N"|"3N"} phaseType - Phase type; neither branch calculates a drop yet.
 * @returns {undefined} No voltage drop is returned for any phase type.
 * @throws {Error} If voltage is at most zero or cosPhi is outside 0 to 1.
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
 * Placeholder for percentage voltage drop; ignores all inputs and returns undefined.
 * @returns {undefined} No percentage is calculated.
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
