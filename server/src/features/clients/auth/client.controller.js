const authService = require("./client.service");
const { asyncHandler } = require("../../../common/utils/asyncHandler");
const { cookieOptions } = require("../../../config/env");

const ACCESS_TOKEN_COOKIE = "access_token";

function sendAuthenticatedResponse(res, statusCode, authentication) {
  const { token, user } = authentication;

  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    ...cookieOptions,
    path: "/",
  });

  return res.status(statusCode).json({ user });
}

const signup = asyncHandler(async (req, res) => {
  return sendAuthenticatedResponse(
    res,
    201,
    await authService.signup(req.body),
  );
});
const loginWithPassword = asyncHandler(async (req, res) => {
  return sendAuthenticatedResponse(
    res,
    200,
    await authService.loginWithPassword(req.body),
  );
});
const requestOtp = asyncHandler(async (req, res) => {
  res.status(200).json(await authService.requestOtp(req.body));
});
const verifyOtp = asyncHandler(async (req, res) => {
  return sendAuthenticatedResponse(
    res,
    200,
    await authService.verifyOtp(req.body),
  );
});
const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: "/",
  });
  return res.status(204).send();
});

module.exports = { signup, loginWithPassword, requestOtp, verifyOtp, logout };
