// Coefficient de la méthode conventionnelle (UTE C15-105)
const CONVENTIONAL_COEFFICIENT = 0.8;

function validatePositive(value, label) {
  if (value <= 0) throw new Error(`${label} doit être positif`);
}

/**
 * Calcule le courant de court-circuit minimal (Icc min) en bout de
 * canalisation, via la méthode conventionnelle (UTE C15-105).
 *
 * Sert à vérifier que la protection déclenchera dans le temps requis
 * en cas de défaut en bout de ligne. Ne remplace PAS le calcul du
 * courant de court-circuit maximal (Icc max, à l'origine de
 * l'installation), qui sert à vérifier le pouvoir de coupure et
 * nécessite la puissance de court-circuit du réseau amont.
 *
 * @param {object} params
 * @param {number} params.voltage - Tension U en V (phase-neutre en mono, composée en triphasé)
 * @param {number} params.section - Section du conducteur de phase S en mm²
 * @param {number} params.length - Longueur du câble L en m
 * @param {number} params.rho - Résistivité du conducteur (Ω·mm²/m)
 * @param {number} [params.m=1] - Rapport Sph/Sn (section phase / section neutre)
 * @param {"1N"|"3N"} params.phaseType - Type de phase
 * @returns {number} Icc min en ampères
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
