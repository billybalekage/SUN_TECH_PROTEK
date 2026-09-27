import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInstallation, createProject } from "../model";
import { projectsQueryKey } from "@/features/projects/viewmodel";
import { dashboardQueryKey } from "@/features/dashboard/viewmodel";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
      ]),
  });
}

export function useCreateInstallation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInstallation,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
      ]),
  });
}
