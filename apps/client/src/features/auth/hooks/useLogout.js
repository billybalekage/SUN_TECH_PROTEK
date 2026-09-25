import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { authMeQueryKey } from "./useAuthSession";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authMeQueryKey });
      navigate("/login", { replace: true });
    },
    onError: () => {
      queryClient.removeQueries({ queryKey: authMeQueryKey });
      navigate("/login", { replace: true });
    },
  });
}
