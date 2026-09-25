const { z } = require("zod");

const createProjectSchema = z.object({
  clientName: z
    .string({ error: "Le nom du client est requis" })
    .trim()
    .min(2)
    .max(150),
  address: z.string().trim().max(255).or(z.literal("")).optional(),
  contact: z.string().trim().max(150).or(z.literal("")).optional(),
});

const updateProjectSchema = z
  .object({
    clientName: z.string().trim().min(2).max(150).optional(),
    address: z.string().trim().max(255).or(z.literal("")).optional(),
    contact: z.string().trim().max(150).or(z.literal("")).optional(),
    status: z
      .enum(["DRAFT", "IN_PROGRESS", "COMPLETED", "ARCHIVED"])
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour",
  });

const projectIdParamsSchema = z.object({
  id: z.string().uuid("L'identifiant du projet doit être un UUID valide"),
});

const listProjectsQuerySchema = z.object({}).strict();

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamsSchema,
  listProjectsQuerySchema,
};
