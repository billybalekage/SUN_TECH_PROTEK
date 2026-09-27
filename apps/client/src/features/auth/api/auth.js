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

export function requestPasswordReset({ email }) {
  return api
    .post("clients/auth/password/reset/request", { email })
    .then((res) => res.data);
}

export function resetPassword({ email, code, newPassword }) {
  return api
    .post("clients/auth/password/reset", { email, code, newPassword })
    .then((res) => res.data);
}

export function changePassword({ currentPassword, newPassword }) {
  return api
    .post("clients/auth/password/change", { currentPassword, newPassword })
    .then((res) => res.data);
}

export function getCurrentUser() {
  return api.get("clients/auth/me").then((res) => res.data.user);
}

export function logout() {
  return api.post("clients/auth/logout").then(() => undefined);
}
