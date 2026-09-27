import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProject, getDashboard, getProject } from "../model";
import { projectsQueryKey } from "@/features/projects/viewmodel";

export const dashboardQueryKey = ["client-dashboard"];

export function useDashboard() {
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: getDashboard,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
      ]),
  });
}

export function useProjectDetails(projectId) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(projectId),
    enabled: Boolean(projectId),
  });
}
