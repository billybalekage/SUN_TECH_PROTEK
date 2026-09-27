import { z } from "zod";

const newPassword = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères");

export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'email est requis")
    .email("Adresse email invalide"),
});

export const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Le code doit contenir exactement 6 chiffres"),
    newPassword,
    confirmPassword: z.string().min(1, "Confirmez votre mot de passe"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword,
    confirmPassword: z.string().min(1, "Confirmez votre mot de passe"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });