const { NotFoundError } = require("../errors/AppErrors");

function notFound(req, _res, next) {
  const error = new NotFoundError(
    `Route not found: ${req.method} ${req.originalUrl}`,
  );
  next(error);
}

module.exports = notFound;
