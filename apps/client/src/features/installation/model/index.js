import { api } from "@/lib/api";

export const differentialDevicesQueryKey = ["differential-devices"];

export const usageLocationLabels = {
  SALLE_DE_BAIN_VOLUME_0_1_2: "Salle de bain, volumes 0 à 2",
  EXTERIEUR: "Extérieur",
  CUISINE_PRISES: "Prises de cuisine",
  PRISES_COURANT_GENERAL: "Prises de courant générales",
  CIRCUITS_SPECIALISES: "Circuits spécialisés",
  ECLAIRAGE: "Éclairage",
  AUTRES: "Autres usages",
};

export const circuitTypeLabels = {
  ECLAIRAGE: "Éclairage",
  AUTRES_USAGES: "Autres usages",
  PLAQUE_INDUCTION: "Plaque à induction",
  LAVE_LINGE: "Lave-linge",
  LAVE_VAISSELLE: "Lave-vaisselle",
  VMC: "VMC",
  POMPE_A_CHALEUR: "Pompe à chaleur",
  BORNE_RECHARGE_VE: "Borne de recharge VE",
};

export function getDifferentialDevices(installationId) {
  return api
    .get(`differential-devices/installation/${installationId}`)
    .then((response) => response.data);
}

export function createDifferentialDevice(device) {
  return api
    .post("differential-devices", device)
    .then((response) => response.data);
}

export function computeDifferentialDeviceRating(deviceId) {
  return api
    .post(`differential-devices/${deviceId}/compute`)
    .then((response) => response.data);
}

export function assignCircuitToDifferentialDevice(assignment) {
  return api
    .post("differential-devices/assign-circuit", assignment)
    .then((response) => response.data);
}

export function getDifferentialDeviceCoverage(deviceId) {
  return api
    .get(`differential-devices/${deviceId}/coverage`)
    .then((response) => response.data);
}

export function getInstallationSelectivity(installationId) {
  return api
    .get(`differential-devices/installation/${installationId}/selectivity`)
    .then((response) => response.data);
}
