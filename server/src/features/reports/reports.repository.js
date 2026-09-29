const prisma = require("../../config/database");

async function findProjectReportData(projectId, ownerId) {
  return prisma.project.findFirst({
    where: { id: projectId, ownerId },
    include: {
      owner: {
        select: { fullName: true, company: true, phone: true, email: true },
      },
      installation: {
        include: {
          circuits: {
            orderBy: { createdAt: "asc" },
            include: {
              calculationResult: true,
              differentialDevice: true,
              circuitComponents: {
                include: {
                  component: { include: { manufacturer: true } },
                },
              },
            },
          },
          differentialDevices: {
            orderBy: { createdAt: "asc" },
            include: { circuits: { orderBy: { createdAt: "asc" } } },
          },
        },
      },
    },
  });
}

module.exports = { findProjectReportData };
