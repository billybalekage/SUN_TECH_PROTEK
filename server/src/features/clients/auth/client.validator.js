const Joi = require("joi");
const { z } = require("zod");

const emptyRequestSchema = z.object({}).strict();

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

module.exports = {
  emptyRequestSchema,
  signupSchema,
  loginPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
};
