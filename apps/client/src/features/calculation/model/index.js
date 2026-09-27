import { api } from "@/lib/api";

export function createCircuit(circuit) {
  return api.post("circuits", circuit).then((response) => response.data);
}

export function calculateCircuit(circuitId) {
  return api
    .post(`circuits/${circuitId}/calculate`, {})
    .then((response) => response.data);
}
