const MAX_SENSITIVITY_BY_USAGE_LOCATION = {
  SALLE_DE_BAIN_VOLUME_0_1_2: 30,
  EXTERIEUR: 30,
  CUISINE_PRISES: 30,
  PRISES_COURANT_GENERAL: 30,
  CIRCUITS_SPECIALISES: 30,
  ECLAIRAGE: 30,
  AUTRES: 300,
};

function checkDifferentialSensitivity({ usageLocation, chosenSensitivityMa }) {
  const maximumSensitivityMa = MAX_SENSITIVITY_BY_USAGE_LOCATION[usageLocation];
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
  MAX_SENSITIVITY_BY_USAGE_LOCATION,
  checkDifferentialSensitivity,
  checkSelectivity,
};
