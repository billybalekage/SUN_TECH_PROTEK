const express = require("express");
const project = express.Router();

const projectController = require("../controller/project.controller");
const { validate } = require("../../../common/middlewares/validator");
const {
  createProjectSchema,
  updateProjectSchema,
} = require("../validator/project.validator");
const verifyToken = require("../../../common/middlewares/auth");
const { requireRole } = require("../../../common/middlewares/roles");

project.use(verifyToken);
project.use(requireRole("ELECTRICIEN", "ADMIN"));

project.post("/", validate(createProjectSchema), projectController.create);
project.get("/", projectController.listMine);
project.get("/:id", projectController.getById);
project.patch("/:id", validate(updateProjectSchema), projectController.update);
project.delete("/:id", projectController.remove);

module.exports = project;
