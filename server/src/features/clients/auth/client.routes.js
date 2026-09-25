const express = require("express");

const authController = require("./client.controller");
const verifyToken = require("../../../common/middlewares/auth");
const { validate } = require("../../../common/middlewares/validator");
const { authLimiter } = require("../../../common/middlewares/reteLimiter");
const {
  signupSchema,
  loginPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
  emptyRequestSchema,
} = require("./client.validator");

const client = express.Router();

client.get("/auth/me", verifyToken, authController.getCurrentUser);
client.post(
  "/auth/logout",
  validate(emptyRequestSchema),
  authController.logout,
);
client.post("/auth/signup", validate(signupSchema), authController.signup);
client.post(
  "/auth/login/password",
  validate(loginPasswordSchema),
  authController.loginWithPassword,
);
client.post(
  "/auth/otp/request",
  authLimiter,
  validate(requestOtpSchema),
  authController.requestOtp,
);
client.post(
  "/auth/otp/verify",
  authLimiter,
  validate(verifyOtpSchema),
  authController.verifyOtp,
);
client.post("/auth/refresh", authLimiter, authController.refresh);

module.exports = client;
