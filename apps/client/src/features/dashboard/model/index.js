import { api } from "@/lib/api";

export function getDashboard() {
  return api.get("clients/dashboard").then((response) => response.data);
}

export function createProject({ clientName, address, contact }) {
  return api
    .post("projects", { clientName, address, contact })
    .then((response) => response.data);
}

export function getProject(projectId) {
  return api.get(`projects/${projectId}`).then((response) => response.data);
}
