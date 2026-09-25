const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const { UnauthorizedError } = require("../errors/AppErrors");

function verifyToken(req, res, next) {
  const token = req.cookies?.access_token;

  if (!token) {
    return next(new UnauthorizedError("Token manquant"));
  }

  try {
    req.user = jwt.verify(token, env.jwt.accessSecret);
    next();
  } catch {
    next(new UnauthorizedError("Token invalide ou expiré"));
  }
}

module.exports = verifyToken;
