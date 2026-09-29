import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { dashboardQueryKey } from "@/features/dashboard/viewmodel";
import { projectsQueryKey } from "@/features/projects/viewmodel";
import {
  assignCircuitToDifferentialDevice,
  createDifferentialDevice,
  differentialDevicesQueryKey,
  getDifferentialDeviceCoverage,
  getDifferentialDevices,
  getInstallationSelectivity,
} from "../model";

export function useDifferentialDevices(installationId) {
  return useQuery({
    queryKey: [...differentialDevicesQueryKey, installationId],
    queryFn: () => getDifferentialDevices(installationId),
    enabled: Boolean(installationId),
  });
}

export function useCreateDifferentialDevice(projectId, installationId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDifferentialDevice,
    onSuccess: (device) => {
      if (installationId) {
        queryClient.setQueryData(
          [...differentialDevicesQueryKey, installationId],
          (devices = []) => [
            ...devices.filter((item) => item.id !== device.id),
            device,
          ],
        );
      }
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...differentialDevicesQueryKey, installationId],
        }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
        projectId
          ? queryClient.invalidateQueries({
              queryKey: [...projectsQueryKey, projectId],
            })
          : Promise.resolve(),
      ]);
    },
  });
}

export function useAssignCircuitToDifferentialDevice(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignCircuitToDifferentialDevice,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: differentialDevicesQueryKey,
        }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
        projectId
          ? queryClient.invalidateQueries({
              queryKey: [...projectsQueryKey, projectId],
            })
          : Promise.resolve(),
      ]),
  });
}

export function useDifferentialDeviceCoverage(deviceId) {
  return useQuery({
    queryKey: [...differentialDevicesQueryKey, "coverage", deviceId],
    queryFn: () => getDifferentialDeviceCoverage(deviceId),
    enabled: Boolean(deviceId),
  });
}

export function useDeviceCoverageReports(devices = []) {
  return useQueries({
    queries: devices.map((device) => ({
      queryKey: [...differentialDevicesQueryKey, "coverage", device.id],
      queryFn: () => getDifferentialDeviceCoverage(device.id),
      enabled: Boolean(device.id),
    })),
  });
}

export function useInstallationSelectivity(installationId) {
  return useQuery({
    queryKey: [...differentialDevicesQueryKey, "selectivity", installationId],
    queryFn: () => getInstallationSelectivity(installationId),
    enabled: Boolean(installationId),
  });
}
