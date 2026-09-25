const express = require("express");

const authController = require("./client.controller");
const { validate } = require("../../../common/middlewares/validator");
const { validateZod } = require("../../../common/middlewares/zodValidator");
const { authLimiter } = require("../../../common/middlewares/reteLimiter");
const {
  signupSchema,
  loginPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
  emptyRequestSchema,
} = require("./client.validator");

const client = express.Router();

client.post(
  "/auth/logout",
  validateZod(emptyRequestSchema),
  authController.logout,
);
client.post("/auth/signup", validate(signupSchema), authController.signup);
client.post(
  "/auth/login",
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

module.exports = client;
