const { CONVENTIONAL_COEFFICIENT, calculateIccMin } = require("./formulas/Icc");
const {
  RESISTIVITY,
  STANDARD_SECTIONS,
  calculateDeltaUPercent,
  calculateMinSectionByVoltageDrop,
  roundToStandardSection,
} = require("./formulas/chute-tension");
const { calculateIb } = require("./formulas/Ib");
const { checkCoordination } = require("./rules/coordination");

module.exports = {
  // Courant d'emploi
  calculateIb,

  // Chute de tension et section de câble
  RESISTIVITY,
  STANDARD_SECTIONS,
  calculateDeltaUPercent,
  calculateMinSectionByVoltageDrop,
  roundToStandardSection,

  // Courant de court-circuit (Icc min, méthode conventionnelle)
  CONVENTIONAL_COEFFICIENT,
  calculateIccMin,

  // Coordination des protections (Ib ≤ In ≤ Iz)
  checkCoordination,
};
