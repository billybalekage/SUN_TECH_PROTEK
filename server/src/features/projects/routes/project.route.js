const express = require("express");
const project = express.Router();

const projectController = require("../controller/project.controller");
const { validate } = require("../../../common/middlewares/validator");
const {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamsSchema,
  listProjectsQuerySchema,
} = require("../validator/project.validator");
const verifyToken = require("../../../common/middlewares/auth");
const { requireRole } = require("../../../common/middlewares/roles");

project.use(verifyToken);
project.use(requireRole("ELECTRICIEN", "ADMIN"));

project.post("/", validate(createProjectSchema), projectController.create);
project.get(
  "/",
  validate(listProjectsQuerySchema, "query"),
  projectController.listMine,
);
project.get(
  "/:id",
  validate(projectIdParamsSchema, "params"),
  projectController.getById,
);
project.patch(
  "/:id",
  validate(projectIdParamsSchema, "params"),
  validate(updateProjectSchema),
  projectController.update,
);
project.delete(
  "/:id",
  validate(projectIdParamsSchema, "params"),
  projectController.remove,
);

module.exports = project;
