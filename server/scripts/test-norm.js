// server/scripts/test-norms.js
const { getMaxDeltaUPercent } = require("../src/core/norms/norm.service");

/**
 * Affiche les seuils de chute de tension enregistrés pour les deux usages de circuit.
 * @returns {Promise<void>} Résout après les opérations et leur affichage.
 */
async function main() {
  console.log("Éclairage :", await getMaxDeltaUPercent("ECLAIRAGE"), "%");
  console.log(
    "Autres usages :",
    await getMaxDeltaUPercent("AUTRES_USAGES"),
    "%",
  );
}

main();
