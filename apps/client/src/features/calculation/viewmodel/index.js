import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  calculateCircuit,
  createCircuit,
  deleteCircuit,
  updateCircuit,
  validateCircuit,
} from "../model";
import { projectsQueryKey } from "@/features/projects/viewmodel";
import { dashboardQueryKey } from "@/features/dashboard/viewmodel";
import { differentialDevicesQueryKey } from "@/features/installation/model";

export function useCreateCircuit(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCircuit,
    onSuccess: () => invalidateCircuitQueries(queryClient, projectId),
  });
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

function invalidateCircuitQueries(queryClient, projectId) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: [...projectsQueryKey, projectId],
    }),
    queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
    queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
    queryClient.invalidateQueries({ queryKey: differentialDevicesQueryKey }),
  ]);
}

export function useUpdateCircuit(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCircuit,
    onSuccess: () => invalidateCircuitQueries(queryClient, projectId),
  });
}

export function useDeleteCircuit(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCircuit,
    onSuccess: () => invalidateCircuitQueries(queryClient, projectId),
  });
}

export function useValidateCircuit(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: validateCircuit,
    onSuccess: () => invalidateCircuitQueries(queryClient, projectId),
  });
}
