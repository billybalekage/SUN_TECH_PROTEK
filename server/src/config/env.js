const Joi = require("joi");

const isProductionEnvironment = process.env.NODE_ENV === "production";
const FALLBACK_JWT_ACCESS_SECRET =
  "dev-access-secret-key-change-me-please-123456";
const FALLBACK_JWT_REFRESH_SECRET =
  "dev-refresh-secret-key-change-me-please-987654";
const accessSecret =
  process.env.JWT_ACCESS_SECRET ||
  (isProductionEnvironment ? "" : FALLBACK_JWT_ACCESS_SECRET);
const refreshSecret =
  process.env.JWT_REFRESH_SECRET ||
  (isProductionEnvironment ? "" : FALLBACK_JWT_REFRESH_SECRET);

if (!process.env.DB_URL && process.env.DATABASE_URL) {
  process.env.DB_URL = process.env.DATABASE_URL;
}

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().integer().min(1).max(65535).default(8800),
  DATABASE_URL: Joi.string(),
  CLIENT_URL: Joi.string().uri().default("http://localhost:5173"),
  CORS_ORIGINS: Joi.string().allow("", null).default(""),

  RATE_LIMIT_MAX_PUBLIC: Joi.number().integer().default(100),
  RATE_LIMIT_MAX_PRIVATE: Joi.number().integer().default(300),
  RATE_LIMIT_MAX_AUTH: Joi.number().integer().default(20),
  RATE_LIMIT_MAX_UPLOAD: Joi.number().integer().default(10),
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .default(15 * 60 * 1000),

  KEEP_ALIVE_TIMEOUT: Joi.number().integer().default(61000),
  HEADERS_TIMEOUT: Joi.number().integer().default(65000),
  REQUEST_TIMEOUT: Joi.number().integer().default(120000),

  COOKIE_MAX_AGE_MS: Joi.number()
    .integer()
    .default(24 * 60 * 60 * 1000),

  LOG_LEVEL: Joi.string()
    .valid("fatal", "error", "warn", "info", "debug", "trace")
    .default("info"),

  jwt: Joi.object({
    accessSecret: Joi.string().allow("").default(FALLBACK_JWT_ACCESS_SECRET),
    refreshSecret: Joi.string().allow("").default(FALLBACK_JWT_REFRESH_SECRET),
    accessExpiresInMinutes: Joi.number().default(
      Number(process.env.JWT_ACCESS_EXPIRES_IN_MINUTES) || 15,
    ),
    refreshExpiresInDays: Joi.number().default(
      Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) || 30,
    ),
  }).default({}),

  smtp: Joi.object({
    host: Joi.string()
      .allow("", null)
      .default(process.env.SMTP_HOST || ""),
    port: Joi.number().default(Number(process.env.SMTP_PORT) || 587),
    user: Joi.string()
      .allow("", null)
      .default(process.env.SMTP_USER || ""),
    pass: Joi.string()
      .allow("", null)
      .default(process.env.SMTP_PASS || ""),
    fromName: Joi.string().default(process.env.SMTP_FROM_NAME || "No Reply"),
    fromEmail: Joi.string().default(
      process.env.SMTP_FROM_EMAIL || "no-reply@example.com",
    ),
  }).default({}),
}).unknown(true);

const normalizedEnv = {
  ...process.env,
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiresInMinutes:
      Number(process.env.JWT_ACCESS_EXPIRES_IN_MINUTES) || 15,
    refreshExpiresInDays: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) || 30,
  },

  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromName: process.env.SMTP_FROM_NAME || "No Reply",
    fromEmail: process.env.SMTP_FROM_EMAIL || "no-reply@example.com",
  },
};

const { value: env, error } = envSchema.validate(normalizedEnv, {
  abortEarly: false,
  convert: true,
});

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

const corsOrigins = (env.CORS_ORIGINS || env.CLIENT_URL)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: env.COOKIE_MAX_AGE_MS,
};

const isProduction = env.NODE_ENV === "production";

module.exports = {
  env,
  corsOrigins,
  cookieOptions,
  isProduction,
};
