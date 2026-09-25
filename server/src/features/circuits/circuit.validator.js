const Joi = require("joi");

const idParamSchema = Joi.string().uuid().required();
const installationIdParamSchema = Joi.string().uuid().required();

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

const runCalculationSchema = Joi.object({
  inCurrent: Joi.number().positive().required().messages({
    "any.required": "Le calibre de la protection (inCurrent) est requis",
  }),
  izCurrent: Joi.number().positive().required().messages({
    "any.required": "L'intensité admissible retenue (izCurrent) est requise",
  }),
  sectionByAmpacity: Joi.number().positive().optional(),
  maxDeltaUPercent: Joi.number().positive().default(5),
  rho: Joi.number().positive().optional(),
  k1: Joi.number().positive().default(1),
  k2: Joi.number().positive().default(1),
  k3: Joi.number().positive().default(1),
  m: Joi.number().positive().default(1),
});

module.exports = {
  idParamSchema,
  installationIdParamSchema,
  createCircuitSchema,
  updateCircuitSchema,
  runCalculationSchema,
};
