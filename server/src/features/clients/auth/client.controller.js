const authService = require("./client.service");
const { asyncHandler } = require("../../../common/utils/asyncHandler");

const signup = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.signup(req.body));
});
const loginWithPassword = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.loginWithPassword(req.body));
});
const requestOtp = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.requestOtp(req.body));
});
const verifyOtp = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.verifyOtp(req.body));
});

module.exports = { signup, loginWithPassword, requestOtp, verifyOtp };
