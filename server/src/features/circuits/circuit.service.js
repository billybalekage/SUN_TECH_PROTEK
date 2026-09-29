const defaultCircuitRepository = require("./circuit.repository");
const defaultElectricRules = require("../../core/electric-rules");
const defaultNormService = require("../../core/norms/norm");
const {
  NotFoundError,
  BadRequestError,
} = require("../../common/errors/AppErrors");
async function createCircuit(
  userId,
  data,
  circuitRepository = defaultCircuitRepository,
) {
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

async function getCircuit(
  userId,
  circuitId,
  circuitRepository = defaultCircuitRepository,
) {
  const circuit = await circuitRepository.findCircuitById(circuitId);
  if (!circuit || circuit.installation?.project?.ownerId !== userId) {
    throw new NotFoundError(`Circuit introuvable : ${circuitId}`);
  }

  return circuit;
}

async function listCircuitsByInstallation(
  userId,
  installationId,
  circuitRepository = defaultCircuitRepository,
) {
  const installation =
    await circuitRepository.findInstallationById(installationId);
  if (!installation || installation.project.ownerId !== userId) {
    throw new NotFoundError(`Installation introuvable : ${installationId}`);
  }

  return circuitRepository.findCircuitsByInstallation(installationId);
}

async function updateCircuit(
  userId,
  circuitId,
  data,
  circuitRepository = defaultCircuitRepository,
) {
  await getCircuit(userId, circuitId, circuitRepository);
  return circuitRepository.updateCircuit(circuitId, data);
}

async function deleteCircuit(
  userId,
  circuitId,
  circuitRepository = defaultCircuitRepository,
) {
  await getCircuit(userId, circuitId, circuitRepository);
  return circuitRepository.deleteCircuit(circuitId);
}

async function validateCircuitCalculation(
  userId,
  circuitId,
  circuitRepository = defaultCircuitRepository,
) {
  const circuit = await getCircuit(userId, circuitId, circuitRepository);
  if (!circuit.calculationResult) {
    throw new BadRequestError(
      "Le circuit doit être calculé avant de valider son résultat",
    );
  }

  return circuitRepository.markCircuitValidated(circuitId);
}

async function getCircuitValidationStatus(
  userId,
  circuitId,
  circuitRepository = defaultCircuitRepository,
) {
  const circuit = await getCircuit(userId, circuitId, circuitRepository);

  return {
    circuitId: circuit.id,
    canValidate: Boolean(circuit.calculationResult),
    isCompliant: circuit.calculationResult?.isCompliant ?? null,
    validatedAt: circuit.validatedAt ?? null,
  };
}

/**
 * Dimensionne un circuit accessible à l'utilisateur et enregistre son résultat.
 * Déduit le calibre de protection, la section et l'intensité admissible des
 * tables normatives ; la conformité inclut la coordination et la chute de tension.
 * @param {string} userId - Identifiant du propriétaire du projet.
 * @param {string} circuitId - Identifiant du circuit à calculer.
 * @param {object} [options={}] - Paramètres complémentaires du calcul.
 * @param {number} [options.izCurrent] - Intensité admissible corrigée en A; sinon déduite des tables.
 * @param {number} [options.sectionByAmpacity] - Section minimale personnalisée en mm²; sinon déduite des tables.
 * @param {number} [options.maxDeltaUPercent] - Seuil personnalisé; sinon récupéré selon l'usage.
 * @param {number} [options.minimumIcc] - Seuil de déclenchement en A pour le contrôle de Lmax.
 * @param {number} [options.maximumIcc] - Icc,max réseau en A.
 * @param {number} [options.rho] - Résistivité explicite en Ω·mm²/m.
 * @param {number} [options.k1=1] - Facteur complémentaire; l'installation est déjà intégrée à la table d'ampacité.
 * @param {number} [options.k2] - Override facultatif du facteur de groupement normatif.
 * @param {number} [options.k3] - Override facultatif du facteur de température normatif.
 * @param {number} [options.ambientTempCelsius=30] - Température utilisée pour la table K3.
 * @param {string} [options.conductorMaterial=CU] - Matériau du conducteur.
 * @param {string} [options.usageType] - Usage normatif; déduit de circuitType si absent.
 * @param {number} [options.m=1] - Rapport de section phase/neutre pour le calcul de court-circuit.
 * @param {object} [dependencies] - Dépôt et services injectables pour les tests.
 * @returns {Promise<{ib: number, deltaUPercent: number, sectionMm2: number, inCurrent: number, izCurrent: number, icc: number, isCompliant: boolean, reasons: string[]}>} Résultat enregistré et motifs de non-coordination.
 * @throws {NotFoundError} Si le circuit est absent ou inaccessible à l'utilisateur.
 * @throws {BadRequestError} Si les données requises pour sélectionner une ampacité normative manquent.
 * @throws {Error} Si une formule rejette ses paramètres.
 */
async function runCircuitCalculation(
  userId,
  circuitId,
  options = {},
  dependencies = {},
) {
  const circuitRepository =
    dependencies.circuitRepository ?? defaultCircuitRepository;
  const normService = dependencies.normService ?? defaultNormService;
  const electricRules = dependencies.electricRules ?? defaultElectricRules;
  const {
    calculateIb,
    calculateCorrectedCurrent,
    selectProtectionRating,
    calculateDeltaUPercent,
    calculateMinSectionByVoltageDrop,
    roundToStandardSection,
    selectFinalSection,
    RESISTIVITY,
    calculateIccMin,
    calculateMaxLengthForIccMin,
    calculateRequiredIccForTripCurve,
    checkCoordination,
    checkDifferentialSensitivity,
  } = electricRules;
  const coordinationService =
    dependencies.coordinationService ??
    require("../installations/coordination.service");
  const {
    izCurrent: providedIzCurrent,
    sectionByAmpacity,
    maxDeltaUPercent: providedMaxDeltaUPercent,
    minimumIcc,
    maximumIcc,
    rho: providedRho,
    k1 = 1,
    k2: providedK2,
    k3: providedK3,
    m = 1,
    ambientTempCelsius = 30,
    conductorMaterial = "CU",
    usageType: providedUsageType,
  } = options;

  const circuit = await getCircuit(userId, circuitId, circuitRepository);

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

  const normalizedCircuitType = circuit.circuitType
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const normalizedUsageType =
    providedUsageType ??
    (normalizedCircuitType.includes("ECLAIRAGE")
      ? "ECLAIRAGE"
      : "AUTRES_USAGES");
  const rho =
    providedRho ??
    (conductorMaterial === "AL" ? RESISTIVITY.ALUMINUM : RESISTIVITY.COPPER);
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
  const sectionByVoltageDrop = calculateMinSectionByVoltageDrop(
    rho,
    circuit.farthestLoadDistance,
    ib,
    circuit.cosPhi,
    installation.nominalVoltage,
    maxDeltaUPercent,
    installation.phaseType,
  );

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
  const reasons = [];
  const warnings = [];
  const requiredMinimumIcc =
    minimumIcc ??
    (circuit.breakerTripCurve
      ? calculateRequiredIccForTripCurve({
          ratedCurrent: inCurrent,
          tripCurve: circuit.breakerTripCurve,
        })
      : undefined);
  if (requiredMinimumIcc === undefined) {
    warnings.push(
      "Courbe de déclenchement du disjoncteur non renseignée : la longueur maximale n'est pas vérifiée",
    );
  } else {
    const maximumLength = calculateMaxLengthForIccMin({
      voltage: installation.nominalVoltage,
      section,
      rho,
      minimumIcc: requiredMinimumIcc,
      m,
      phaseType: installation.phaseType,
    });
    if (circuit.farthestLoadDistance > maximumLength) {
      reasons.push(
        `La longueur du circuit (${circuit.farthestLoadDistance}m) dépasse Lmax (${maximumLength.toFixed(2)}m) pour Icc,min`,
      );
    }
  }

  const protectionComponents = (circuit.circuitComponents ?? [])
    .filter(({ role }) => role === "PROTECTION")
    .map(({ component }) => component);
  if (maximumIcc === undefined) {
    warnings.push(
      "Icc,max réseau non fourni : le pouvoir de coupure n'est pas vérifié",
    );
  } else if (
    !protectionComponents.some((component) => {
      const capacity = Number(component.breakingCapacity);
      const unit = component.technicalSpecs?.breakingCapacityUnit;
      const capacityAmps =
        unit === "A" ? capacity : unit === "kA" ? capacity * 1000 : null;
      return capacityAmps !== null && capacityAmps >= maximumIcc;
    })
  ) {
    reasons.push(
      `Aucune protection liée avec une unité de pouvoir de coupure connue ne couvre Icc,max (${maximumIcc}A)`,
    );
  }
  let differentialDevice = null;
  let differentialDeviceRating = null;
  if (circuit.differentialDeviceId) {
    try {
      const calculatedDevice = await coordinationService.calculateDeviceRating(
        userId,
        circuit.differentialDeviceId,
      );
      differentialDeviceRating = {
        id: calculatedDevice.deviceId,
        ...calculatedDevice.rating,
      };
      differentialDevice = {
        id: calculatedDevice.deviceId,
        ...calculatedDevice.rating,
      };
      const differentialCheck = checkDifferentialSensitivity({
        usageLocation: circuit.usageLocation,
        chosenSensitivityMa: differentialDevice.sensitivityMa,
      });
      reasons.push(...differentialCheck.reasons);
    } catch (error) {
      if (error.statusCode !== 400) throw error;
      reasons.push(error.message);
    }
  } else {
    reasons.push("Aucun dispositif différentiel n'est lié à ce circuit");
  }

  // 6. Intensité admissible corrigée et coordination des protections
  const baseIz = await normService.getBaseAmpacity({
    installMethod: installation.installMode,
    insulation: installation.insulationType,
    conductorMaterial,
    section,
  });
  const izCurrent = providedIzCurrent ?? baseIz * k1 * k2 * k3;
  const coordination = checkCoordination({ ib, inCurrent, iz: izCurrent });
  reasons.push(...coordination.reasons);
  if (deltaUPercent > maxDeltaUPercent) {
    reasons.push(
      `La chute de tension (${deltaUPercent.toFixed(2)}%) dépasse la limite (${maxDeltaUPercent}%)`,
    );
  }

  const installationCircuits =
    await circuitRepository.findCircuitsByInstallation(installation.id);
  const generalProtectionIb = installationCircuits.reduce(
    (total, installationCircuit) =>
      total +
      calculateIb(
        Number(installationCircuit.totalPower),
        Number(installation.nominalVoltage),
        Number(installationCircuit.cosPhi),
        installation.phaseType,
      ),
    0,
  );
  const generalProtectionRating =
    generalProtectionIb > 0
      ? selectProtectionRating(generalProtectionIb)
      : null;
  if (generalProtectionRating === null) {
    warnings.push(
      "Aucun calibre normalisé ne couvre le courant total de l’installation",
    );
  }

  const result = {
    ib,
    deltaUPercent,
    sectionMm2: section,
    inCurrent,
    izCurrent,
    icc,
    isCompliant: reasons.length === 0,
    reasons,
    warnings,
  };

  await circuitRepository.saveCalculationResult(
    circuitId,
    result,
    installation.id,
    installation.version,
    generalProtectionRating,
    differentialDeviceRating,
  );

  return {
    ...result,
    baseIz,
    deratingFactors: { k1, k2, k3 },
    generalProtectionRating,
    differentialDevice,
  };
}

function createCircuitService({
  circuitRepository = defaultCircuitRepository,
  normService = defaultNormService,
  electricRules = defaultElectricRules,
  coordinationService,
} = {}) {
  return {
    createCircuit: (userId, data) =>
      createCircuit(userId, data, circuitRepository),
    getCircuit: (userId, circuitId) =>
      getCircuit(userId, circuitId, circuitRepository),
    listCircuitsByInstallation: (userId, installationId) =>
      listCircuitsByInstallation(userId, installationId, circuitRepository),
    updateCircuit: (userId, circuitId, data) =>
      updateCircuit(userId, circuitId, data, circuitRepository),
    deleteCircuit: (userId, circuitId) =>
      deleteCircuit(userId, circuitId, circuitRepository),
    validateCircuitCalculation: (userId, circuitId) =>
      validateCircuitCalculation(userId, circuitId, circuitRepository),
    getCircuitValidationStatus: (userId, circuitId) =>
      getCircuitValidationStatus(userId, circuitId, circuitRepository),
    runCircuitCalculation: (userId, circuitId, options) =>
      runCircuitCalculation(userId, circuitId, options, {
        circuitRepository,
        normService,
        electricRules,
        coordinationService,
      }),
  };
}

module.exports = { ...createCircuitService(), createCircuitService };
