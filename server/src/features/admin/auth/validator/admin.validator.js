const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.email": "L'adresse email doit être valide",
    "any.required": "L'adresse email est requise",
  }),
  password: Joi.string().required().messages({
    "any.required": "Le mot de passe est requis",
  }),
});

const createAdminSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(150).required().messages({
    "string.min": "Le nom complet doit contenir au moins 2 caractères",
    "any.required": "Le nom complet est requis",
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.email": "L'adresse email doit être valide",
    "any.required": "L'adresse email est requise",
  }),
  password: Joi.string().min(12).required().messages({
    "string.min": "Le mot de passe doit contenir au moins 12 caractères",
    "any.required": "Le mot de passe est requis",
  }),
  company: Joi.string().trim().max(150).allow(null).optional(),
  phone: Joi.string().trim().max(30).allow(null).optional(),
});

module.exports = { loginSchema, createAdminSchema };
