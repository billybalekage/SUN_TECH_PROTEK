const circuitRepository = require("../repository/circuit.repository");
const {
  NotFoundError,
  BadRequestError,
} = require("../../../common/errors/AppErrors");
const {
  calculateIb,
  RESISTIVITY,
  calculateDeltaUPercent,
  calculateMinSectionByVoltageDrop,
  roundToStandardSection,
  selectFinalSection,
  calculateIccMin,
  checkCoordination,
} = require("../../../core/electric-rules");

async function runCircuitCalculation(circuitId, options = {}) {
  const {
    inCurrent,
    izCurrent,
    sectionByAmpacity,
    maxDeltaUPercent = 5,
    rho = RESISTIVITY.COPPER,
    k1 = 1,
    k2 = 1,
    k3 = 1,
    m = 1,
  } = options;

  const circuit = await circuitRepository.findCircuitById(circuitId);
  if (!circuit) {
    throw new NotFoundError(`Circuit introuvable : ${circuitId}`);
  }

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
  const section = sectionByAmpacity
    ? selectFinalSection({ sectionByVoltageDrop, sectionByAmpacity })
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

  // 6. Coordination des protections
  if (!inCurrent || !izCurrent) {
    throw new BadRequestError(
      "Le calibre de protection (inCurrent) et l'intensité admissible retenue (izCurrent) sont requis pour vérifier la coordination",
    );
  }
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

  return { ...result, reasons: coordination.reasons };
}

module.exports = { runCircuitCalculation };
