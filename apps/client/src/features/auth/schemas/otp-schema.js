import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'email est requis")
    .email("Adresse email invalide"),
});

export const verifyOtpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code doit contenir exactement 6 chiffres"),
});
