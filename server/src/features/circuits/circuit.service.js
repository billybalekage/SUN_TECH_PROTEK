const circuitRepository = require("./circuit.repository");
const {
  NotFoundError,
  BadRequestError,
} = require("../../common/errors/AppErrors");
const {
  calculateIb,
  calculateCorrectedCurrent,
  selectProtectionRating,
  RESISTIVITY,
  calculateDeltaUPercent,
  calculateMinSectionByVoltageDrop,
  roundToStandardSection,
  selectFinalSection,
  calculateIccMin,
  checkCoordination,
} = require("../../core/electric-rules");
const normService = require("../../core/norms/norm");

async function createCircuit(userId, data) {
  const installation = await circuitRepository.findInstallationById(
    data.installationId,
  );
  if (!installation || installation.project.ownerId !== userId) {
    throw new NotFoundError(
      `Installation introuvable : ${data.installationId}`,
    );
  }

  return circuitRepository.createCircuit(data);
}

async function getCircuit(userId, circuitId) {
  const circuit = await circuitRepository.findCircuitById(circuitId);
  if (!circuit || circuit.installation?.project?.ownerId !== userId) {
    throw new NotFoundError(`Circuit introuvable : ${circuitId}`);
  }

  return circuit;
}

async function listCircuitsByInstallation(userId, installationId) {
  const installation =
    await circuitRepository.findInstallationById(installationId);
  if (!installation || installation.project.ownerId !== userId) {
    throw new NotFoundError(`Installation introuvable : ${installationId}`);
  }

  return circuitRepository.findCircuitsByInstallation(installationId);
}

async function updateCircuit(userId, circuitId, data) {
  await getCircuit(userId, circuitId);
  return circuitRepository.updateCircuit(circuitId, data);
}

async function deleteCircuit(userId, circuitId) {
  await getCircuit(userId, circuitId);
  return circuitRepository.deleteCircuit(circuitId);
}

/**
 * Dimensionne un circuit accessible à l'utilisateur et enregistre son résultat.
 * Déduit le calibre de protection, la section et l'intensité admissible des
 * tables normatives ; isCompliant et reasons reflètent Ib ≤ In ≤ Iz corrigé.
 * @param {string} userId - Identifiant du propriétaire du projet.
 * @param {string} circuitId - Identifiant du circuit à calculer.
 * @param {object} [options={}] - Paramètres complémentaires du calcul.
 * @param {number} [options.izCurrent] - Intensité admissible corrigée en A; sinon déduite des tables.
 * @param {number} [options.sectionByAmpacity] - Section minimale personnalisée en mm²; sinon déduite des tables.
 * @param {number} [options.maxDeltaUPercent] - Seuil personnalisé; sinon récupéré selon l'usage.
 * @param {number} [options.rho=RESISTIVITY.COPPER] - Résistivité en Ω·mm²/m.
 * @param {number} [options.k1=1] - Facteur complémentaire; l'installation est déjà intégrée à la table d'ampacité.
 * @param {number} [options.k2] - Override facultatif du facteur de groupement normatif.
 * @param {number} [options.k3] - Override facultatif du facteur de température normatif.
 * @param {number} [options.ambientTempCelsius=30] - Température utilisée pour la table K3.
 * @param {string} [options.conductorMaterial=CU] - Matériau du conducteur.
 * @param {string} [options.usageType] - Usage normatif; déduit de circuitType si absent.
 * @param {number} [options.m=1] - Rapport de section phase/neutre pour le calcul de court-circuit.
 * @returns {Promise<{ib: number, deltaUPercent: number, sectionMm2: number, inCurrent: number, izCurrent: number, icc: number, isCompliant: boolean, reasons: string[]}>} Résultat enregistré et motifs de non-coordination.
 * @throws {NotFoundError} Si le circuit est absent ou inaccessible à l'utilisateur.
 * @throws {BadRequestError} Si les données requises pour sélectionner une ampacité normative manquent.
 * @throws {Error} Si une formule rejette ses paramètres.
 */
async function runCircuitCalculation(userId, circuitId, options = {}) {
  const {
    izCurrent: providedIzCurrent,
    sectionByAmpacity,
    maxDeltaUPercent: providedMaxDeltaUPercent,
    rho = RESISTIVITY.COPPER,
    k1 = 1,
    k2: providedK2,
    k3: providedK3,
    m = 1,
    ambientTempCelsius = 30,
    conductorMaterial = "CU",
    usageType: providedUsageType,
  } = options;

  const circuit = await getCircuit(userId, circuitId);

  const installation = circuit.installation;
  if (!installation) {
    throw new BadRequestError(
      "Ce circuit n'est rattaché à aucune installation",
    );
  }

  // 1. Courant d'emploi
  const ib = calculateIb(
    circuit.totalPower,
    installation.nominalVoltage,
    circuit.cosPhi,
    installation.phaseType,
  );

  const inCurrent = selectProtectionRating(ib);
  if (inCurrent === null) {
    throw new BadRequestError(
      "Aucun calibre de protection normalisé ne couvre le courant d'emploi de ce circuit",
    );
  }

  const normalizedUsageType =
    providedUsageType ??
    (circuit.circuitType.toUpperCase().includes("ECLAIRAGE")
      ? "ECLAIRAGE"
      : "AUTRES_USAGES");
  const maxDeltaUPercent =
    providedMaxDeltaUPercent ??
    (await normService.getMaxDeltaUPercent(normalizedUsageType));
  const k2 =
    providedK2 ??
    (await normService.getGroupingFactor(circuit.numberOfCircuits));
  const k3 =
    providedK3 ??
    (await normService.getTemperatureFactor({
      ambientTempCelsius,
      insulation: installation.insulationType,
    }));
  const requiredBaseAmpacity = calculateCorrectedCurrent({
    inCurrent,
    k1,
    k2,
    k3,
  });
  const requiredSectionByAmpacity =
    sectionByAmpacity ??
    (await normService.findMinSectionForAmpacity({
      installMethod: installation.installMode,
      insulation: installation.insulationType,
      conductorMaterial,
      requiredCurrent: requiredBaseAmpacity,
    }));

  if (requiredSectionByAmpacity === null) {
    throw new BadRequestError(
      "Aucune section du tableau normatif ne supporte le courant requis avec les facteurs de correction sélectionnés",
    );
  }

  // 2. Section minimale par critère de chute de tension
  const sectionByVoltageDrop = calculateMinSectionByVoltageDrop({
    rho,
    length: circuit.farthestLoadDistance,
    ib,
    cosPhi: circuit.cosPhi,
    voltage: installation.nominalVoltage,
    maxDeltaUPercent,
    phaseType: installation.phaseType,
  });

  // 3. Section finale retenue
  const section = requiredSectionByAmpacity
    ? selectFinalSection({
        sectionByVoltageDrop,
        sectionByAmpacity: requiredSectionByAmpacity,
      })
    : roundToStandardSection(sectionByVoltageDrop);

  if (section === null) {
    throw new BadRequestError(
      "Aucune section normalisée du catalogue ne suffit pour ce circuit — vérifier les paramètres saisis",
    );
  }

  // 4. Vérification de la chute de tension réelle avec la section retenue
  const deltaUPercent = calculateDeltaUPercent({
    rho,
    length: circuit.farthestLoadDistance,
    ib,
    cosPhi: circuit.cosPhi,
    section,
    voltage: installation.nominalVoltage,
    phaseType: installation.phaseType,
  });

  // 5. Courant de court-circuit minimal
  const icc = calculateIccMin({
    voltage: installation.nominalVoltage,
    section,
    length: circuit.farthestLoadDistance,
    rho,
    m,
    phaseType: installation.phaseType,
  });

  // 6. Intensité admissible corrigée et coordination des protections
  const baseIz = await normService.getBaseAmpacity({
    installMethod: installation.installMode,
    insulation: installation.insulationType,
    conductorMaterial,
    section,
  });
  const izCurrent = providedIzCurrent ?? baseIz * k1 * k2 * k3;
  const coordination = checkCoordination({ ib, inCurrent, iz: izCurrent });

  const result = {
    ib,
    deltaUPercent,
    sectionMm2: section,
    inCurrent,
    izCurrent,
    icc,
    isCompliant: coordination.isCompliant,
  };

  await circuitRepository.saveCalculationResult(circuitId, result);

  return {
    ...result,
    reasons: coordination.reasons,
    baseIz,
    deratingFactors: { k1, k2, k3 },
  };
}

module.exports = {
  createCircuit,
  getCircuit,
  listCircuitsByInstallation,
  updateCircuit,
  deleteCircuit,
  runCircuitCalculation,
};
