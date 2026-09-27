import { api } from "@/lib/api";

export function createProject({ clientName, address, contact }) {
  return api
    .post("projects", { clientName, address, contact })
    .then((response) => response.data);
}

export function createInstallation(installation) {
  return api
    .post("installations", installation)
    .then((response) => response.data);
}
