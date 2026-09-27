const express = require("express");
const verifyToken = require("../../../common/middlewares/auth");
const { requireRole } = require("../../../common/middlewares/roles");
const dashboardController = require("./dashboard.controller");

const dashboard = express.Router();

dashboard.use(verifyToken);
dashboard.use(requireRole("ELECTRICIEN"));
dashboard.get("/", dashboardController.getDashboard);

module.exports = dashboard;
