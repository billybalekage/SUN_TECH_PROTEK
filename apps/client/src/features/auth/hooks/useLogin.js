import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast";
import { loginWithPassword } from "../api/auth";

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginWithPassword,
    onSuccess: () => {
      toast.add({ title: "Connexion réussie", type: "success" });
      navigate("/dashboard");
    },
  });
}
