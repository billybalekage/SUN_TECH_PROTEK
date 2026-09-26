const {
  getBaseAmpacity,
  findMinSectionForAmpacity,
} = require("../src/core/norms/norm.service");

async function main() {
  console.log(
    "Iz0 pour 2.5mm² méthode C :",
    await getBaseAmpacity({
      installMethod: "C",
      insulation: "PVC",
      conductorMaterial: "CU",
      section: 2.5,
    }),
    "A",
  );

  console.log(
    "Section min pour 25A requis, méthode B1 :",
    await findMinSectionForAmpacity({
      installMethod: "B1",
      insulation: "PVC",
      conductorMaterial: "CU",
      requiredCurrent: 25,
    }),
    "mm²",
  );
}

main();
