const express = require("express");

const authController = require("./client.controller");
const { validate } = require("../../../common/middlewares/validator");
const {
  signupSchema,
  loginPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
} = require("./client.validator");

const client = express.Router();

client.post("/auth/signup", validate(signupSchema), authController.signup);
client.post(
  "/auth/login",
  validate(loginPasswordSchema),
  authController.loginWithPassword,
);
client.post(
  "/auth/otp/request",
  validate(requestOtpSchema),
  authController.requestOtp,
);
client.post(
  "/auth/otp/verify",
  validate(verifyOtpSchema),
  authController.verifyOtp,
);

module.exports = client;
