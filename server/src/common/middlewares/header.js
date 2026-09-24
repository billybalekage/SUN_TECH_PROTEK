function secureHeaders(req, res, next) {
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Origin-Agent-Cluster", "?1");
  next();
}

module.exports = secureHeaders;
