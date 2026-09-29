import { api } from "@/lib/api";

export function createCircuit(circuit) {
  return api.post("circuits", circuit).then((response) => response.data);
}

export function calculateCircuit(circuitId) {
  return api
    .post(`circuits/${circuitId}/calculate`, {})
    .then((response) => response.data);
}

export function validateCircuit(circuitId) {
  return api
    .post(`circuits/${circuitId}/validate`, {})
    .then((response) => response.data);
}

export function updateCircuit({ circuitId, data }) {
  return api
    .patch(`circuits/${circuitId}`, data)
    .then((response) => response.data);
}

export function deleteCircuit(circuitId) {
  return api.delete(`circuits/${circuitId}`);
}
