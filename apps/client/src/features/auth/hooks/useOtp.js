import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast";
import { requestLoginOtp, verifyLoginOtp } from "../api/otp";
import { authMeQueryKey } from "./useAuthSession";

export function useRequestOtp() {
  return useMutation({
    mutationFn: requestLoginOtp,
  });
}

export function useVerifyOtp() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyLoginOtp,
    onSuccess: (data) => {
      queryClient.setQueryData(authMeQueryKey, data.user);
      toast.add({ title: "Connexion réussie", type: "success" });
      navigate("/dashboard", { replace: true });
    },
  });
}
