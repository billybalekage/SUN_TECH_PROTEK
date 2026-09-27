const {
  getGroupingFactor,
  getTemperatureFactor,
} = require("../src/core/norms/norm.service");

async function main() {
  console.log("K2 pour 3 circuits groupés :", await getGroupingFactor(3));
  console.log("K2 pour 15 circuits groupés :", await getGroupingFactor(15));
  console.log(
    "K3 pour 35°C, PVC :",
    await getTemperatureFactor({ ambientTempCelsius: 35, insulation: "PVC" }),
  );
  console.log(
    "K3 pour 30°C, PR :",
    await getTemperatureFactor({ ambientTempCelsius: 30, insulation: "PR" }),
  );
}

main();
