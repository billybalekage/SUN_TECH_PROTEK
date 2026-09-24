const { roundToStandardSection } = require("./chute-tension");
/**
 * @param {object} params
 * @param {number} params.sectionByVoltageDrop
 * @param {number} params.sectionByAmpacity
 * @param {number|null}
 */

function selectFinalSection({ sectionByVoltageDrop, sectionByAmpacity }) {
  if (sectionByVoltageDrop <= 0)
    throw new Error("sectionByVoltageDrop doit etre  positf");
  if (sectionByAmpacity <= 0)
    throw new Error("sectionByAmpacity doit etre  positf");

  const requiredSection = Math.max(sectionByVoltageDrop, sectionByAmpacity);
  return roundToStandardSection(requiredSection);
}

module.exports = { selectFinalSection };
