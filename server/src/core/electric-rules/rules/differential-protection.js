const REQUIRED_SENSITIVITY_BY_USAGE = {
  SALLE_DE_BAIN_VOLUME_0_1_2: 30,
  EXTERIEUR: 30,
  CUISINE_PRISES: 30,
  PRISES_COURANT_GENERAL: 30,
  CIRCUITS_SPECIALISES: 30,
  ECLAIRAGE: 30,
  AUTRES: 300,
};

const MAX_SENSITIVITY_BY_USAGE_LOCATION = REQUIRED_SENSITIVITY_BY_USAGE;
const STANDARD_SENSITIVITIES_MA = [10, 30, 100, 300, 500, 1000];

// Cette liste indicative doit être confirmée selon la norme et les charges installées.
const CIRCUIT_TYPES_REQUIRING_TYPE_A = [
  "PLAQUE_INDUCTION",
  "LAVE_LINGE",
  "LAVE_VAISSELLE",
  "VMC",
  "POMPE_A_CHALEUR",
  "BORNE_RECHARGE_VE",
];

function getRequiredSensitivity(usageLocation) {
  const sensitivityMa = REQUIRED_SENSITIVITY_BY_USAGE[usageLocation];
  if (sensitivityMa === undefined) {
    throw new Error(`Usage/emplacement inconnu : ${usageLocation}`);
  }
  return sensitivityMa;
}

function getRequiredDifferentialType(circuitType) {
  const normalizedCircuitType = circuitType
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return CIRCUIT_TYPES_REQUIRING_TYPE_A.some((type) =>
    normalizedCircuitType.includes(type),
  )
    ? "A"
    : "AC";
}

function checkDifferentialSensitivity({ usageLocation, chosenSensitivityMa }) {
  const maximumSensitivityMa = REQUIRED_SENSITIVITY_BY_USAGE[usageLocation];
  const reasons = [];

  if (maximumSensitivityMa === undefined) {
    reasons.push("L'emplacement d'usage du circuit doit être renseigné");
  } else if (
    !Number.isFinite(chosenSensitivityMa) ||
    chosenSensitivityMa <= 0
  ) {
    reasons.push("La sensibilité différentielle doit être positive");
  } else if (chosenSensitivityMa > maximumSensitivityMa) {
    reasons.push(
      `La sensibilité choisie (${chosenSensitivityMa} mA) dépasse le maximum de ${maximumSensitivityMa} mA pour cet usage`,
    );
  }

  return {
    isCompliant: reasons.length === 0,
    maximumSensitivityMa: maximumSensitivityMa ?? null,
    reasons,
  };
}

function checkSelectivity({
  upstreamSensitivityMa,
  downstreamSensitivityMa,
  upstreamIsSelectiveType,
}) {
  const reasons = [];

  if (
    !Number.isFinite(upstreamSensitivityMa) ||
    !Number.isFinite(downstreamSensitivityMa) ||
    upstreamSensitivityMa <= 0 ||
    downstreamSensitivityMa <= 0
  ) {
    reasons.push("Les sensibilités différentielles doivent être positives");
  } else if (upstreamSensitivityMa < downstreamSensitivityMa * 3) {
    reasons.push(
      "La sensibilité amont doit être au moins trois fois supérieure à la sensibilité aval",
    );
  }

  if (!upstreamIsSelectiveType) {
    reasons.push("Le dispositif différentiel amont doit être de type sélectif");
  }

  return { isCompliant: reasons.length === 0, reasons };
}

module.exports = {
  REQUIRED_SENSITIVITY_BY_USAGE,
  MAX_SENSITIVITY_BY_USAGE_LOCATION,
  STANDARD_SENSITIVITIES_MA,
  CIRCUIT_TYPES_REQUIRING_TYPE_A,
  getRequiredSensitivity,
  getRequiredDifferentialType,
  checkDifferentialSensitivity,
  checkSelectivity,
};
