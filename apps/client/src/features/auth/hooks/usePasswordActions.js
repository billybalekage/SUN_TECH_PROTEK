import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast";
import {
  changePassword,
  requestPasswordReset,
  resetPassword,
} from "../api/auth";
import { authMeQueryKey } from "./useAuthSession";

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.add({ title: "Mot de passe réinitialisé", type: "success" });
      navigate("/login", { replace: true });
    },
  });
}

export function useChangePassword() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authMeQueryKey });
      toast.add({
        title: "Mot de passe modifié. Reconnectez-vous.",
        type: "success",
      });
      navigate("/login", { replace: true });
    },
  });
}
