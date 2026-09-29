import { useMutation } from "@tanstack/react-query";
import { downloadProjectReport } from "../model";

export function useGenerateProjectReport() {
  return useMutation({ mutationFn: downloadProjectReport });
}
