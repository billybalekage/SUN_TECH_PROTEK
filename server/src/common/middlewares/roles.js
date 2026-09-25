const { ForbiddenError } = require("../errors/AppErrors");

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.roleName)) {
      return next(new ForbiddenError("Accès refusé pour ce rôle"));
    }
    next();
  };
}

module.exports = { requireRole };
