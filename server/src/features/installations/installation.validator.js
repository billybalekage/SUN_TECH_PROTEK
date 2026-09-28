const Joi = require("joi");

const projectIdParamsSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
});

const createInstallationSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  nominalVoltage: Joi.number().positive().required(),
  phaseType: Joi.string().valid("1N", "3N").required(),
  neutralRegime: Joi.string().valid("TT", "TN", "IT").required(),
  networkToTgdDistance: Joi.number().positive().optional(),
  installMode: Joi.string().valid("B1", "C").required(),
  insulationType: Joi.string().valid("PVC", "PR").required(),
});

const updateInstallationSchema = Joi.object({
  nominalVoltage: Joi.number().positive(),
  phaseType: Joi.string().valid("1N", "3N"),
  neutralRegime: Joi.string().valid("TT", "TN", "IT"),
  networkToTgdDistance: Joi.number().positive().allow(null),
  installMode: Joi.string().valid("B1", "C"),
  insulationType: Joi.string().valid("PVC", "PR"),
})
  .min(1)
  .messages({
    "object.min": "Au moins un champ doit être fourni pour la mise à jour",
  });

module.exports = {
  projectIdParamsSchema,
  createInstallationSchema,
  updateInstallationSchema,
};
