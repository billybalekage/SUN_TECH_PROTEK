const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const { env } = require("../../config/env");

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs, // durée de la fenêtre de temps en millisecondes
    max, // nombre maximum de requêtes autorisées dans la fenêtre de temps
    message, // message d'erreur renvoyé lorsque la limite est atteinte
    standardHeaders: true, // renvoie les informations de limite dans les en-têtes RateLimit-*
    legacyHeaders: false, //  désactive les en-têtes X-RateLimit-*
    skipFailedRequests: false, // ne pas compter les requêtes échouées dans le calcul de la limite
    skipSuccessfulRequests: false, // ne pas compter les requêtes réussies dans le calcul de la limite
  });
}

const publicLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_PUBLIC,
  message: "Too many requests from this client, please try again later.",
});

const privateLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_PRIVATE,
  message: "Too many private requests, please slow down.",
});

const authLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_AUTH,
  message: "Too many authentication attempts, please try again later.",
});

const uploadLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_UPLOAD,
  message: "Too many upload requests, please try again later.",
});

const globalSlowDown = slowDown({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  delayAfter: env.SLOW_DOWN_DELAY_AFTER,
  delayMs: env.SLOW_DOWN_DELAY_MS,
  maxDelayMs: env.SLOW_DOWN_MAX_DELAY_MS,
});

module.exports = {
  authLimiter,
  privateLimiter,
  publicLimiter,
  uploadLimiter,
  globalSlowDown,
};
