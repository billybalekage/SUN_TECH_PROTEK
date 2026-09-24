const pino = require("pino");
const pinoHttp = require("pino-http");
const path = require("path");
const fs = require("fs");

const { env } = require("../../config/env");

const logFile = path.join(__dirname, "../../../logs/app.log");

// creation du logger
const logger = pino(
  {
    level: env.LOG_LEVEL, // nouveau log, le niveau est lu dans le .env
    timestamp: pino.stdTimeFunctions.isoTime, // chaque log a une date iso
    base: { pid: false },
  },
  pino.transport({
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  }),
);

const loggerMiddleware = pinoHttp({
  logger,

  genReqId: (req) =>
    req.id ||
    req.headers["x-request-id"] ||
    `req-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  customProps: (req) => ({
    requestId: req.id,
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  }),

  // concerve uniquement les information utiles
  serializers: {
    req: pino.stdSerializers.req,
    err: pino.stdSerializers.err,
  },
});

module.exports = {
  logger,
  loggerMiddleware,
};
