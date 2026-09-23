function validatePositive(value, label) {
  if (value <= 0) throw new Error(`${label} doit être positif`);
}

/**
 * Vérifie la règle de coordination entre le courant d'emploi, le calibre
 * de la protection et le courant admissible de la canalisation :
 *
 *     Ib ≤ In ≤ Iz
 *
 * @param {object} params
 * @param {number} params.ib - Courant d'emploi (A)
 * @param {number} params.inCurrent - Courant nominal du dispositif de protection (A)
 * @param {number} params.iz - Courant admissible dans la canalisation (A)
 * @returns {{ isCompliant: boolean, reasons: string[] }}
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
