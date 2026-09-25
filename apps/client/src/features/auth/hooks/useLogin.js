import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast";
import { loginWithPassword } from "../api/auth";

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginWithPassword,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data.user);
      toast.add({ title: "Connexion réussie", type: "success" });
      navigate("/dashboard");
    },
  });
}
