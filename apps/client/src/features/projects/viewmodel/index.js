import { useQuery } from "@tanstack/react-query";
import { getProject, getProjects } from "../model";

export const projectsQueryKey = ["projects"];

export function useProjects() {
  return useQuery({ queryKey: projectsQueryKey, queryFn: getProjects });
}

export function useProject(projectId) {
  return useQuery({
    queryKey: [...projectsQueryKey, projectId],
    queryFn: () => getProject(projectId),
    enabled: Boolean(projectId),
  });
}
