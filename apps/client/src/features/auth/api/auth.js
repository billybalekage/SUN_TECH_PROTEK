import { api } from "@/lib/api";

export function signup({ fullName, email, password, company, phone }) {
  return api
    .post("clients/auth/signup", { fullName, email, password, company, phone })
    .then((res) => res.data);
}

export function loginWithPassword({ email, password }) {
  return api
    .post("clients/auth/login/password", { email, password })
    .then((res) => res.data);
}

export function logout() {
  return api.post("clients/auth/logout").then((res) => res.data.data);
}

//fonction pour login avec code otp
