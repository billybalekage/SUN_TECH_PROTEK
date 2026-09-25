const { z } = require("zod");

const uuidSchema = z.string().uuid();
const positiveNumberSchema = z.coerce.number().positive();

const idParamSchema = z.object({
  id: uuidSchema,
});

const installationIdParamSchema = z.object({
  installationId: uuidSchema,
});

const createCircuitSchema = z.object({
  installationId: uuidSchema,
  circuitType: z.string().trim().min(2).max(100),
  totalPower: positiveNumberSchema,
  farthestLoadDistance: positiveNumberSchema,
  cosPhi: z.coerce.number().gt(0).max(1).default(0.8),
  numberOfCircuits: z.coerce.number().int().min(1).default(1),
});

const updateCircuitSchema = z
  .object({
    installationId: uuidSchema.optional(),
    circuitType: z.string().trim().min(2).max(100).optional(),
    totalPower: positiveNumberSchema.optional(),
    farthestLoadDistance: positiveNumberSchema.optional(),
    cosPhi: z.coerce.number().gt(0).max(1).optional(),
    numberOfCircuits: z.coerce.number().int().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour",
  });

const runCalculationSchema = z.object({
  inCurrent: positiveNumberSchema,
  izCurrent: positiveNumberSchema,
  sectionByAmpacity: positiveNumberSchema.optional(),
  maxDeltaUPercent: positiveNumberSchema.default(5),
  rho: positiveNumberSchema.optional(),
  k1: positiveNumberSchema.default(1),
  k2: positiveNumberSchema.default(1),
  k3: positiveNumberSchema.default(1),
  m: positiveNumberSchema.default(1),
});

module.exports = {
  idParamSchema,
  installationIdParamSchema,
  createCircuitSchema,
  updateCircuitSchema,
  runCalculationSchema,
};
