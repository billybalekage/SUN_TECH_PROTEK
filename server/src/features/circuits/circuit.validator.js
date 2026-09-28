const Joi = require("joi");

const idParamSchema = Joi.string().uuid().required();
const installationIdParamSchema = Joi.string().uuid().required();

const createCircuitSchema = Joi.object({
  installationId: Joi.string().uuid().required().messages({
    "string.uuid": "L'identifiant de l'installation doit être un UUID valide",
    "any.required": "L'identifiant de l'installation est requis",
  }),

  name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Le nom du circuit est requis",
    "string.max": "Le nom du circuit ne peut pas dépasser 100 caractères",
    "any.required": "Le nom du circuit est requis",
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
      "name",
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
  izCurrent: Joi.number().positive().optional(),
  sectionByAmpacity: Joi.number().positive().optional(),
  maxDeltaUPercent: Joi.number().positive().optional(),
  rho: Joi.number().positive().optional(),
  minimumIcc: Joi.number().positive().optional(),
  maximumIcc: Joi.number().positive().optional(),
  k1: Joi.number().positive().default(1),
  k2: Joi.number().positive().optional(),
  k3: Joi.number().positive().optional(),
  m: Joi.number().positive().default(1),
  ambientTempCelsius: Joi.number().positive().default(30),
  conductorMaterial: Joi.string()
    .trim()
    .uppercase()
    .valid("CU", "AL")
    .default("CU"),
  usageType: Joi.string().valid("ECLAIRAGE", "AUTRES_USAGES").optional(),
});

module.exports = {
  idParamSchema,
  installationIdParamSchema,
  createCircuitSchema,
  updateCircuitSchema,
  runCalculationSchema,
};
