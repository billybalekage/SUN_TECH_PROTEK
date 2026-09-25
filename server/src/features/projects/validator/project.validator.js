const Joi = require("joi");

const createProjectSchema = Joi.object({
  clientName: Joi.string().trim().min(2).max(150).required().messages({
    "any.required": "Le nom du client est requis",
  }),
  address: Joi.string().trim().max(255).allow("").optional(),
  contact: Joi.string().trim().max(150).allow("").optional(),
});

const updateProjectSchema = Joi.object({
  clientName: Joi.string().trim().min(2).max(150).optional(),
  address: Joi.string().trim().max(255).allow("").optional(),
  contact: Joi.string().trim().max(150).allow("").optional(),
  status: Joi.string()
    .valid("DRAFT", "IN_PROGRESS", "COMPLETED", "ARCHIVED")
    .optional(),
})
  .min(1)
  .messages({
    "object.min": "Au moins un champ doit être fourni pour la mise à jour",
  });

module.exports = { createProjectSchema, updateProjectSchema };
