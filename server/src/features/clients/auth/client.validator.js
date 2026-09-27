const Joi = require("joi");
const { z } = require("zod");

const signupSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required().messages({
    "string.min": "Le mot de passe doit contenir au moins 8 caractères",
  }),
  company: Joi.string().trim().max(150).optional(),
  phone: Joi.string().trim().max(30).optional(),
});

const loginPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const requestOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
});

const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  newPassword: Joi.string().min(8).required().messages({
    "string.min": "Le mot de passe doit contenir au moins 8 caractères",
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required().messages({
    "string.min": "Le mot de passe doit contenir au moins 8 caractères",
  }),
});

const emptyRequestSchema = z.object({}).strict().optional();

module.exports = {
  signupSchema,
  loginPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  changePasswordSchema,
  emptyRequestSchema,
};
