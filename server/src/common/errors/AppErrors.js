class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details = null,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found", details = null) {
    super(message, 404, "NOT_FOUND", details);
  }
}

class BadRequestError extends AppError {
  constructor(message = "Bad request.", details = null) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed.", details = null) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

class ConflictError extends AppError {
  constructor(message = "This conflicts with existing data.", details = null) {
    super(message, 409, "CONFLICT", details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Authentication required.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access forbidden.") {
    super(message, 403, "FORBIDDEN");
  }
}

module.exports = AppError;
module.exports.AppErrors = AppError;
module.exports.ConflictError = ConflictError;
module.exports.ValidationError = ValidationError;
module.exports.NotFoundError = NotFoundError;
module.exports.BadRequestError = BadRequestError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
