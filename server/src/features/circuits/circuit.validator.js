const Joi = require("joi");

const createCircuitSchema = Joi.object({
  installationId: Joi.string().uuid().required().messages({
    "string.uuid": "L'identifiant de l'installation doit être un UUID valide",
    "any.required": "L'identifiant de l'installation est requis",
  }),

  circuitType: Joi.string().trim().min(2).max(100).required().messages({
    "string.min": "Le type de circuit doit contenir au moins 2 caractères",
    "any.required": "Le type de circuit est requis",
  }),

  totalPower: Joi.number().positive().required().messages({
    "number.positive": "La puissance totale doit être positive",
    "any.required": "La puissance totale est requise",
  }),

  farthestLoadDistance: Joi.number().positive().required().messages({
    "number.positive":
      "La distance de la charge la plus éloignée doit être positive",
    "any.required": "La distance de la charge la plus éloignée est requise",
  }),

  cosPhi: Joi.number().greater(0).max(1).default(0.8).messages({
    "number.greater": "cosPhi doit être strictement supérieur à 0",
    "number.max": "cosPhi ne peut pas dépasser 1",
  }),

  numberOfCircuits: Joi.number().integer().min(1).default(1).messages({
    "number.min": "Le nombre de circuits doit être au moins 1",
  }),
});

// Pour une mise à jour partielle : tous les champs deviennent optionnels,
// mais au moins un doit être présent
const updateCircuitSchema = createCircuitSchema
  .fork(
    [
      "installationId",
      "circuitType",
      "totalPower",
      "farthestLoadDistance",
      "cosPhi",
      "numberOfCircuits",
    ],
    (schema) => schema.optional(),
  )
  .min(1)
  .messages({
    "object.min": "Au moins un champ doit être fourni pour la mise à jour",
  });

module.exports = { createCircuitSchema, updateCircuitSchema };
