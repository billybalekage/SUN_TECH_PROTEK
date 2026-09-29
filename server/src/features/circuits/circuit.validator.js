const { z } = require("zod");

const idParamSchema = z.object({
  id: z.string().uuid(),
});
const installationIdParamSchema = z.object({
  installationId: z.string().uuid(),
});

const USAGE_LOCATIONS = [
  "SALLE_DE_BAIN_VOLUME_0_1_2",
  "EXTERIEUR",
  "CUISINE_PRISES",
  "PRISES_COURANT_GENERAL",
  "CIRCUITS_SPECIALISES",
  "ECLAIRAGE",
  "AUTRES",
];

const circuitFields = {
  installationId: z
    .string()
    .uuid("L'identifiant de l'installation doit être un UUID valide"),
  name: z
    .string()
    .trim()
    .min(1, "Le nom du circuit est requis")
    .max(100, "Le nom du circuit ne peut pas dépasser 100 caractères"),
  circuitType: z
    .string()
    .trim()
    .min(2, "Le type de circuit doit contenir au moins 2 caractères")
    .max(100),
  totalPower: z.coerce
    .number()
    .positive("La puissance totale doit être positive"),
  farthestLoadDistance: z.coerce
    .number()
    .positive("La distance de la charge la plus éloignée doit être positive"),
  cosPhi: z.coerce
    .number()
    .gt(0, "cosPhi doit être strictement supérieur à 0")
    .max(1, "cosPhi ne peut pas dépasser 1"),
  numberOfCircuits: z.coerce.number().int().min(1),
  usageLocation: z.enum(USAGE_LOCATIONS).optional(),
  breakerTripCurve: z.enum(["B", "C", "D"]).nullable().optional(),
};

const createCircuitSchema = z.object({
  ...circuitFields,
  cosPhi: circuitFields.cosPhi.default(0.8),
  numberOfCircuits: circuitFields.numberOfCircuits.default(1),
});

const updateCircuitSchema = z
  .object(
    Object.fromEntries(
      Object.entries(circuitFields).map(([key, schema]) => [
        key,
        schema.optional(),
      ]),
    ),
  )
  .refine((value) => Object.keys(value).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour",
  });

const runCalculationSchema = z.object({
  izCurrent: z.coerce.number().positive().optional(),
  sectionByAmpacity: z.coerce.number().positive().optional(),
  maxDeltaUPercent: z.coerce.number().positive().optional(),
  rho: z.coerce.number().positive().optional(),
  minimumIcc: z.coerce.number().positive().optional(),
  maximumIcc: z.coerce.number().positive().optional(),
  k1: z.coerce.number().positive().default(1),
  k2: z.coerce.number().positive().optional(),
  k3: z.coerce.number().positive().optional(),
  m: z.coerce.number().positive().default(1),
  ambientTempCelsius: z.coerce.number().positive().default(30),
  conductorMaterial: z
    .string()
    .trim()
    .uppercase()
    .pipe(z.enum(["CU", "AL"]))
    .default("CU"),
  usageType: z.enum(["ECLAIRAGE", "AUTRES_USAGES"]).optional(),
});

module.exports = {
  idParamSchema,
  installationIdParamSchema,
  createCircuitSchema,
  updateCircuitSchema,
  runCalculationSchema,
  USAGE_LOCATIONS,
};
