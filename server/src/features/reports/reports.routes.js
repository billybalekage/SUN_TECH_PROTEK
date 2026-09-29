const express = require("express");
const reportsController = require("./reports.controller");
const { validate } = require("../../common/middlewares/validator");
const {
  projectIdParamsSchema,
} = require("../projects/validator/project.validator");
const verifyToken = require("../../common/middlewares/auth");
const { requireRole } = require("../../common/middlewares/roles");

const reports = express.Router();
reports.use(verifyToken);
reports.use(requireRole("ELECTRICIEN", "ADMIN"));
reports.get(
  "/projects/:id",
  validate(projectIdParamsSchema, "params"),
  reportsController.downloadProjectReport,
);

module.exports = reports;
