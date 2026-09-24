const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("./env");

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function checkDatabaseConnection(timeoutMs = 3000) {
  const startedAt = Date.now();
  let timeoutHandle;

  try {
    const timeout = new Promise((_resolve, reject) => {
      timeoutHandle = setTimeout(
        () =>
          reject(new Error(`Database check timed out after ${timeoutMs} ms`)),
        timeoutMs,
      );
    });

    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);

    return {
      connected: true,
      latencyMs: Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    console.error("[prisma] Database health check failed:", error.message);
    return {
      connected: false,
      latencyMs: null,
      error: error.message,
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

prisma.checkDatabaseConnection = checkDatabaseConnection;

module.exports = prisma;
