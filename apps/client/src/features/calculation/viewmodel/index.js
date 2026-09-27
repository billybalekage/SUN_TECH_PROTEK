import { useMutation, useQueryClient } from "@tanstack/react-query";
import { calculateCircuit, createCircuit } from "../model";
import { projectsQueryKey } from "@/features/projects/viewmodel";
import { dashboardQueryKey } from "@/features/dashboard/viewmodel";

export function useCreateCircuit() {
  return useMutation({ mutationFn: createCircuit });
}

export function useCalculateCircuit(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: calculateCircuit,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...projectsQueryKey, projectId],
        }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
      ]),
  });
}
