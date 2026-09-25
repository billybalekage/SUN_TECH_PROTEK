import { z } from "zod";

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Le nom complet doit contenir au moins 2 caractères")
      .max(150, "Le nom complet est trop long"),
    email: z
      .string()
      .trim()
      .min(1, "L'email est requis")
      .email("Adresse email invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Confirmez votre mot de passe"),
    company: z.string().trim().max(150, "Le nom de l'entreprise est trop long"),
    phone: z.string().trim().max(30, "Le numéro de téléphone est trop long"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });
