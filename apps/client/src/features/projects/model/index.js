import { api } from "@/lib/api";

export const projectStatusLabels = {
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  ARCHIVED: "Archivé",
};

export function getProjects() {
  return api.get("projects").then((response) => response.data);
}

export function getProject(projectId) {
  return api.get(`projects/${projectId}`).then((response) => response.data);
}
