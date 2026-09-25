import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast";
import { loginWithPassword } from "../api/auth";
import { authMeQueryKey } from "./useAuthSession";

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginWithPassword,
    onSuccess: (data) => {
      queryClient.setQueryData(authMeQueryKey, data.user);
      toast.add({ title: "Connexion réussie", type: "success" });
      navigate("/dashboard", { replace: true });
    },
  });
}
