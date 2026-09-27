const prisma = require("../../../config/database");

async function getDashboardData(ownerId) {
  const [totalProjects, nonCompliantCircuits, recentProjects] =
    await prisma.$transaction([
      prisma.project.count({ where: { ownerId } }),
      prisma.calculationResult.count({
        where: {
          isCompliant: false,
          circuit: {
            installation: {
              project: { ownerId },
            },
          },
        },
      }),
      prisma.project.findMany({
        where: { ownerId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          clientName: true,
          status: true,
          updatedAt: true,
        },
      }),
    ]);

  return { totalProjects, nonCompliantCircuits, recentProjects };
}

module.exports = { getDashboardData };
