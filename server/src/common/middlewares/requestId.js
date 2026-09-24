const { randomUUID } = require("crypto");

function requestId(req, res, next) {
  if (!req.id) {
    req.id =
      req.get("x-request-id") ||
      `req-${Date.now()}-${randomUUID?.() ?? Math.random().toString(16).slice(2)}`;
  }

  res.setHeader("X-Request-ID", req.id);
  next();
}

module.exports = requestId;
