const { z } = require("zod");

const createDifferentialDeviceSchema = z.object({
  installationId: z.string().uuid(),
  sensitivityMa: z.coerce
    .number()
    .refine((value) => [10, 30, 100, 300, 500, 1000].includes(value)),
  type: z.enum(["A", "AC", "F"]),
  isSelectiveType: z.preprocess((value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }, z.boolean().default(false)),
  ratedCurrent: z.coerce.number().int().positive(),
});

const assignCircuitSchema = z.object({
  circuitId: z.string().uuid(),
  differentialDeviceId: z.string().uuid(),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

const installationIdParamSchema = z.object({
  installationId: z.string().uuid(),
});

module.exports = {
  createDifferentialDeviceSchema,
  assignCircuitSchema,
  idParamSchema,
  installationIdParamSchema,
};
