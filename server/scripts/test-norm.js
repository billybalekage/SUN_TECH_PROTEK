// server/scripts/test-norms.js
const { getMaxDeltaUPercent } = require("../src/core/norms/norm.service");

async function main() {
  console.log("Éclairage :", await getMaxDeltaUPercent("ECLAIRAGE"), "%");
  console.log(
    "Autres usages :",
    await getMaxDeltaUPercent("AUTRES_USAGES"),
    "%",
  );
}

main();
