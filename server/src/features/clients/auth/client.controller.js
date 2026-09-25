const authService = require("./client.service");
const { asyncHandler } = require("../../../common/utils/asyncHandler");
const {
  accessCookieOptions,
  refreshCookieOptions,
} = require("../../../config/env");

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

function sendAuthenticatedResponse(res, statusCode, authentication) {
  const { token, refreshToken, user } = authentication;

  res.cookie(ACCESS_TOKEN_COOKIE, token, { ...accessCookieOptions, path: "/" });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...refreshCookieOptions,
    path: "/api/v1/clients/auth",
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
const refresh = asyncHandler(async (req, res) => {
  return sendAuthenticatedResponse(
    res,
    200,
    await authService.refreshSession(req.cookies?.[REFRESH_TOKEN_COOKIE]),
  );
});
const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...accessCookieOptions, path: "/" });
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...refreshCookieOptions,
    path: "/api/v1/clients/auth",
  });
  return res.status(204).send();
});

module.exports = {
  signup,
  loginWithPassword,
  requestOtp,
  verifyOtp,
  refresh,
  logout,
};
