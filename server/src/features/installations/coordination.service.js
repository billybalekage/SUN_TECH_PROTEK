const {
  calculateIb,
  selectProtectionRating,
  checkDifferentialSensitivity,
  checkSelectivity,
  getRequiredSensitivity,
  getRequiredDifferentialType,
} = require("../../core/electric-rules");
const {
  NotFoundError,
  BadRequestError,
} = require("../../common/errors/AppErrors");

function getDefaultRepository() {
  return require("./differential-device.repository");
}

function assertInstallationOwnership(installation, userId, installationId) {
  if (!installation || installation.project.ownerId !== userId) {
    throw new NotFoundError(`Installation introuvable : ${installationId}`);
  }
}

function isDeviceRated(device) {
  return (
    Number.isInteger(device.sensitivityMa) &&
    typeof device.type === "string" &&
    Number.isInteger(device.ratedCurrent)
  );
}

async function listDevicesByInstallation(
  userId,
  installationId,
  repository = getDefaultRepository(),
) {
  const installation = await repository.findInstallationById(installationId);
  assertInstallationOwnership(installation, userId, installationId);
  return repository.findDevicesByInstallation(installationId);
}
async function createDevice(userId, data, repository = getDefaultRepository()) {
  const installation = await repository.findInstallationById(
    data.installationId,
  );
  assertInstallationOwnership(installation, userId, data.installationId);
  return repository.createDevice(data);
}

async function assignCircuit(
  userId,
  { circuitId, differentialDeviceId },
  repository = getDefaultRepository(),
) {
  const circuit = await repository.findCircuitWithOwnership(circuitId);
  const device = await repository.findDeviceById(differentialDeviceId);

  if (!circuit || circuit.installation.project.ownerId !== userId) {
    throw new NotFoundError(`Circuit introuvable : ${circuitId}`);
  }
  if (!device || device.installation.project.ownerId !== userId) {
    throw new NotFoundError(`DDR introuvable : ${differentialDeviceId}`);
  }
  if (circuit.installationId !== device.installationId) {
    throw new BadRequestError(
      "Le circuit et le DDR doivent appartenir à la même installation",
    );
  }

  return repository.assignCircuitToDevice(circuitId, differentialDeviceId);
}

/**
 * Vérifie, pour un DDR donné, que sa sensibilité couvre le besoin le
 * plus strict parmi tous les circuits qu'il protège.
 */
async function checkDeviceCoverage(
  userId,
  differentialDeviceId,
  repository = getDefaultRepository(),
) {
  const device = await repository.findDeviceById(differentialDeviceId);
  if (!device || device.installation.project.ownerId !== userId) {
    throw new NotFoundError(`DDR introuvable : ${differentialDeviceId}`);
  }

  const perCircuit = device.circuits.map((circuit) => ({
    circuitId: circuit.id,
    name: circuit.name,
    usageLocation: circuit.usageLocation,
    ...checkDifferentialSensitivity({
      usageLocation: circuit.usageLocation,
      chosenSensitivityMa: device.sensitivityMa,
    }),
  }));

  return {
    isRated: isDeviceRated(device),
    isCompliant:
      isDeviceRated(device) &&
      perCircuit.length > 0 &&
      perCircuit.every((result) => result.isCompliant),
    perCircuit,
  };
}

async function calculateDeviceRating(
  userId,
  differentialDeviceId,
  repository = getDefaultRepository(),
) {
  const device = await repository.findDeviceById(differentialDeviceId);
  if (!device || device.installation.project.ownerId !== userId) {
    throw new NotFoundError(`DDR introuvable : ${differentialDeviceId}`);
  }
  if (device.circuits.length === 0) {
    throw new BadRequestError(
      "Aucun circuit assigné à ce DDR — impossible de le dimensionner",
    );
  }

  const uncategorizedCircuits = device.circuits.filter(
    (circuit) => !circuit.usageLocation,
  );
  if (uncategorizedCircuits.length > 0) {
    throw new BadRequestError(
      `${uncategorizedCircuits.length} circuit(s) sans emplacement d’usage — à classer avant calcul`,
    );
  }

  let sensitivityMa;
  try {
    sensitivityMa = Math.min(
      ...device.circuits.map((circuit) =>
        getRequiredSensitivity(circuit.usageLocation),
      ),
    );
  } catch (error) {
    throw new BadRequestError(error.message);
  }

  const type = device.circuits.some(
    (circuit) => getRequiredDifferentialType(circuit.circuitType) === "A",
  )
    ? "A"
    : "AC";
  const { nominalVoltage, phaseType } = device.installation;
  const totalIb = device.circuits.reduce(
    (total, circuit) =>
      total +
      calculateIb(
        Number(circuit.totalPower),
        Number(nominalVoltage),
        Number(circuit.cosPhi),
        phaseType,
      ),
    0,
  );
  const ratedCurrent = selectProtectionRating(totalIb);
  if (ratedCurrent === null) {
    throw new BadRequestError(
      "Aucun calibre normalisé ne convient pour le courant total des circuits de ce DDR",
    );
  }

  return {
    deviceId: differentialDeviceId,
    installationId: device.installationId ?? device.installation.id,
    expectedVersion: device.installation.version,
    rating: { sensitivityMa, type, ratedCurrent },
  };
}

async function computeDeviceRating(
  userId,
  differentialDeviceId,
  repository = getDefaultRepository(),
) {
  const calculated = await calculateDeviceRating(
    userId,
    differentialDeviceId,
    repository,
  );
  return repository.saveDeviceRating(
    calculated.deviceId,
    calculated.installationId,
    calculated.expectedVersion,
    calculated.rating,
  );
}

/**
 * Vérifie la sélectivité entre la protection générale et chaque DDR
 * (sélectivité verticale, niveau 1 → 2 de votre schéma).
 */
function checkGeneralToDeviceSelectivity({ device }) {
  return checkSelectivity({
    upstreamSensitivityMa: 500,
    downstreamSensitivityMa: device.sensitivityMa,
    upstreamIsSelectiveType: true,
  });
}

async function checkInstallationSelectivity(
  userId,
  installationId,
  repository = getDefaultRepository(),
) {
  const installation = await repository.findInstallationById(installationId);
  assertInstallationOwnership(installation, userId, installationId);
  const devices = await repository.findDevicesByInstallation(installationId);
  const perDevice = devices.map((device) => ({
    differentialDeviceId: device.id,
    sensitivityMa: device.sensitivityMa,
    isRated: isDeviceRated(device),
    ...checkGeneralToDeviceSelectivity({
      generalProtectionRating: installation.generalProtectionRating,
      device,
    }),
  }));

  return {
    isCompliant: perDevice.every(
      (result) => result.isRated && result.isCompliant,
    ),
    assumption: {
      upstreamSensitivityMa: 500,
      upstreamIsSelectiveType: true,
    },
    perDevice,
  };
}

module.exports = {
  createDevice,
  listDevicesByInstallation,
  assignCircuit,
  calculateDeviceRating,
  computeDeviceRating,
  checkDeviceCoverage,
  checkGeneralToDeviceSelectivity,
  checkInstallationSelectivity,
};
