const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const { UnauthorizedError } = require("../errors/AppErrors");

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return next(new UnauthorizedError("Token manquant"));
  }

  try {
    req.user = jwt.verify(token, env.JWT_SECRET); // { id, email, roleId, roleName }
    next();
  } catch {
    next(new UnauthorizedError("Token invalide ou expiré"));
  }
}

module.exports = verifyToken;
