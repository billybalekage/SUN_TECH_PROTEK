const { z } = require("zod");

const projectIdParamsSchema = z.object({
  projectId: z
    .string()
    .uuid("L'identifiant du projet doit être un UUID valide"),
});

const createInstallationSchema = z.object({
  projectId: z.string().uuid(),
  nominalVoltage: z.coerce.number().positive(),
  phaseType: z.enum(["1N", "3N"]),
  neutralRegime: z.enum(["TT", "TN", "IT"]),
  networkToTgdDistance: z.coerce.number().positive().optional(),
  maximumIcc: z.coerce.number().positive().optional(),
  installMode: z.enum(["B1", "C"]),
  insulationType: z.enum(["PVC", "PR"]),
  generalProtectionRating: z.never().optional(),
  generalProtectionType: z.enum(["A", "AC", "F"]).optional(),
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
    generalProtectionRating: z.never().optional(),
    generalProtectionType: z.enum(["A", "AC", "F"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour",
  });

module.exports = {
  projectIdParamsSchema,
  createInstallationSchema,
  updateInstallationSchema,
};
