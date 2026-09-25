import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../api/auth";

export const authMeQueryKey = ["auth", "me"];

export function useAuthSession() {
  return useQuery({
    queryKey: authMeQueryKey,
    queryFn: getCurrentUser,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401) {
        return false;
      }

      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
