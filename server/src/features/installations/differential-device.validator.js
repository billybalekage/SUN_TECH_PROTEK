const Joi = require("joi");

const createDifferentialDeviceSchema = Joi.object({
  installationId: Joi.string().uuid().required(),
  sensitivityMa: Joi.number().valid(10, 30, 100, 300, 500, 1000).required(),
  type: Joi.string().valid("A", "AC", "F").required(),
  isSelectiveType: Joi.boolean().default(false),
  ratedCurrent: Joi.number().integer().positive().required(),
});

const assignCircuitSchema = Joi.object({
  circuitId: Joi.string().uuid().required(),
  differentialDeviceId: Joi.string().uuid().required(),
});

const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const installationIdParamSchema = Joi.object({
  installationId: Joi.string().uuid().required(),
});

module.exports = {
  createDifferentialDeviceSchema,
  assignCircuitSchema,
  idParamSchema,
  installationIdParamSchema,
};
