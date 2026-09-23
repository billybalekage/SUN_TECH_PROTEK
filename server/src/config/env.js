require("dotenv").config();
const { z } = require("zod");

// Schéma de validation : décrit CE QUE l'application attend comme variables d'environnement
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z
    .string()
    .url({ message: "DATABASE_URL doit être une URL PostgreSQL valide" }),

  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET doit contenir au moins 16 caractères"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
});

// Validation au démarrage : si une variable manque ou est invalide, l'app s'arrête immédiatement
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Variables d'environnement invalides :");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

// Objet exporté, propre et typé par la validation (utilisé partout ailleurs dans l'app)
const env = parsedEnv.data;

module.exports = env;
