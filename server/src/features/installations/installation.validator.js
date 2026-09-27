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

module.exports = { projectIdParamsSchema, createInstallationSchema };
