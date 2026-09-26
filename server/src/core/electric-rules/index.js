const { CONVENTIONAL_COEFFICIENT, calculateIccMin } = require("./formulas/Icc");
const {
  RESISTIVITY,
  STANDARD_SECTIONS,
  calculateDeltaUPercent,
  calculateMinSectionByVoltageDrop,
  roundToStandardSection,
} = require("./formulas/chute-tension");
const { selectFinalSection } = require("./formulas/section-selection");
const { calculateIb } = require("./formulas/Ib");
const {
  STANDARD_PROTECTION_RATINGS,
  selectProtectionRating,
} = require("./formulas/protection-rating");
const { checkCoordination } = require("./rules/coordination");

module.exports = {
  // Courant d'emploi
  calculateIb,
  STANDARD_PROTECTION_RATINGS,
  selectProtectionRating,

  // Chute de tension et section de câble
  RESISTIVITY,
  STANDARD_SECTIONS,
  calculateDeltaUPercent,
  calculateMinSectionByVoltageDrop,
  roundToStandardSection,
  selectFinalSection,

  // Courant de court-circuit (Icc min, méthode conventionnelle)
  CONVENTIONAL_COEFFICIENT,
  calculateIccMin,

  // Coordination des protections (Ib ≤ In ≤ Iz)
  checkCoordination,
};
