import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast";
import { signup } from "../api/auth";

export function useSignup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data.user);
      toast.add({ title: "Compte créé avec succès", type: "success" });
      navigate("/login");
    },
  });
}
