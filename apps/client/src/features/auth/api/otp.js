import { api } from "@/lib/api";

export function requestLoginOtp({ email }) {
  return api
    .post("clients/auth/otp/request", { email })
    .then((res) => res.data);
}

export function verifyLoginOtp({ email, code }) {
  return api
    .post("clients/auth/otp/verify", { email, code })
    .then((res) => res.data);
}
