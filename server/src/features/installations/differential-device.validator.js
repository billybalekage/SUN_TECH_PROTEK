const { z } = require("zod");

const createDifferentialDeviceSchema = z.object({
  installationId: z.string().uuid(),
  label: z.string().trim().max(100).optional(),
  isSelectiveType: z.preprocess((value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }, z.boolean().default(false)),
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
