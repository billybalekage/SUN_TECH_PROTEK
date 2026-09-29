import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardQueryKey } from "@/features/dashboard/viewmodel";
import {
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from "../model";

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

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (project) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
        queryClient.invalidateQueries({
          queryKey: [...projectsQueryKey, project.id],
        }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
      ]),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_result, projectId) => {
      queryClient.removeQueries({
        queryKey: [...projectsQueryKey, projectId],
      });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
      ]);
    },
  });
}
