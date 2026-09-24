/**
 * Rejects zero or negative inputs, naming the rejected quantity in the error.
 * @throws {Error} If value is zero or negative.
 */
function validatePositive(value, label) {
  if (value <= 0) throw new Error(`${label} doit être positif`);
}

/**
 * Checks whether operating current (Ib), protection rating (In), and cable
 * capacity (Iz) satisfy Ib ≤ In ≤ Iz, including equality at either limit.
 *
 * @param {object} params
 * @param {number} params.ib - Operating current in amperes.
 * @param {number} params.inCurrent - Protection device rating in amperes.
 * @param {number} params.iz - Cable current capacity in amperes.
 * @returns {{ isCompliant: boolean, reasons: string[] }} Compliance and a
 *   reason for each violated inequality; reasons is empty when compliant.
 * @throws {Error} If any current is zero or negative.
 */
function checkCoordination({ ib, inCurrent, iz }) {
  validatePositive(ib, "Ib");
  validatePositive(inCurrent, "In");
  validatePositive(iz, "Iz");

  const reasons = [];

  if (!(ib <= inCurrent)) {
    reasons.push(
      `Ib (${ib}A) dépasse In (${inCurrent}A) : la protection ne couvre pas le courant d'emploi`,
    );
  }

  if (!(inCurrent <= iz)) {
    reasons.push(
      `In (${inCurrent}A) dépasse Iz (${iz}A) : la canalisation ne supporterait pas le calibre choisi`,
    );
  }

  return {
    isCompliant: reasons.length === 0,
    reasons,
  };
}

module.exports = { checkCoordination };
