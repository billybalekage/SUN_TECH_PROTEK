const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const prisma = require("../config/database");
const { env, corsOrigins } = require("../config/env");
const requestId = require("../common/middlewares/requestId");
const secureHeaders = require("../common/middlewares/header");
const { loggerMiddleware } = require("../common/utils/logger");
const { globalSlowDown } = require("../common/middlewares/reteLimiter");
const notFound = require("../common/middlewares/notFound");
const errorHandler = require("../common/errors/errorHandler");

const circuitRoutes = require("./features/circuits/routes/circuit.routes");
const clientRoutes = require("../features/clients/auth/client.routes");

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Protek API",
        version: "1.0.0",
        description: "Documentation automatique de l'API Express",
      },
    },
    apis: ["./src/features/**/*.js", "./src/**/*.js"],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      hsts: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      frameguard: { action: "deny" },
      crossOriginEmbedderPolicy: true,
      crossOriginResourcePolicy: { policy: "same-origin" },
      dnsPrefetchControl: { allow: false },
      originAgentCluster: true,
      hidePoweredBy: true,
    }),
  );

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Request-ID",
      ],
    }),
  );

  app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(globalSlowDown);
  app.use(compression({ threshold: 1024 }));
  app.use(express.json({ limit: env.REQUEST_SIZE_LIMIT || "1mb" }));
  app.use(cookieParser());

  if (env.NODE_ENV !== "production") {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get("/docs.json", (_req, res) => res.json(swaggerSpec));
  }

  app.use(requestId);
  app.use(loggerMiddleware);
  app.use(secureHeaders);

  app.get("/api/health", async (_req, res) => {
    const db = await prisma.checkDatabaseConnection(3000);
    const health = db.connected;

    res.status(health ? 200 : 503).json({
      status: health ? "ok" : "degraded",
      database: db,
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  app.use((req, res, next) => {
    res.locals.cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: env.COOKIE_MAX_AGE_MS,
    };
    next();
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "electrique-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/circuits", circuitRoutes);
  app.use("/api/clients", clientRoutes);

  return app;
};

module.exports = createApp;
