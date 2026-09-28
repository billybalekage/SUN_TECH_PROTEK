const Joi = require("joi");
const { z } = require("zod");

const projectIdParamsSchema = z.object({
  projectId: z
    .string()
    .uuid("L'identifiant du projet doit être un UUID valide"),
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

const updateInstallationSchema = z
  .object({
    nominalVoltage: z.coerce.number().positive().optional(),
    phaseType: z.enum(["1N", "3N"]).optional(),
    neutralRegime: z.enum(["TT", "TN", "IT"]).optional(),
    networkToTgdDistance: z
      .union([z.coerce.number().positive(), z.null()])
      .optional(),
    installMode: z.enum(["B1", "C"]).optional(),
    insulationType: z.enum(["PVC", "PR"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour",
  });

module.exports = {
  projectIdParamsSchema,
  createInstallationSchema,
  updateInstallationSchema,
};
