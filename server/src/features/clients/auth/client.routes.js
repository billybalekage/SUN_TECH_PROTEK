const express = require("express");

const authController = require("./client.controller");
const verifyToken = require("../../../common/middlewares/auth");
const { validate } = require("../../../common/middlewares/validator");
const {
  authLimiter,
  authMeLimiter,
} = require("../../../common/middlewares/reteLimiter");
const {
  signupSchema,
  loginPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  changePasswordSchema,
  emptyRequestSchema,
} = require("./client.validator");

const client = express.Router();

client.get(
  "/auth/me",
  authMeLimiter,
  verifyToken,
  validate(emptyRequestSchema),
  authController.getCurrentUser,
);
client.post(
  "/auth/logout",
  authLimiter,
  validate(emptyRequestSchema),
  authController.logout,
);
client.post(
  "/auth/signup",
  authLimiter,
  validate(signupSchema),
  authController.signup,
);
client.post(
  "/auth/login/password",
  authLimiter,
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
client.post(
  "/auth/password/reset/request",
  authLimiter,
  validate(requestPasswordResetSchema),
  authController.requestPasswordReset,
);
client.post(
  "/auth/password/reset",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);
client.post(
  "/auth/password/change",
  authLimiter,
  verifyToken,
  validate(changePasswordSchema),
  authController.changePassword,
);
client.post("/auth/refresh", authLimiter, authController.refresh);

module.exports = client;
