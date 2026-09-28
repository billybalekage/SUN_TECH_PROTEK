const prisma = require("../../config/database");

async function findProjectById(projectId) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });
}

async function findInstallationByProjectId(projectId) {
  return prisma.installation.findUnique({
    where: { projectId },
    include: { circuits: { include: { calculationResult: true } } },
  });
}

async function createInstallation(data) {
  return prisma.installation.create({
    data,
    include: { circuits: { include: { calculationResult: true } } },
  });
}

async function updateInstallation(projectId, data) {
  return prisma.$transaction(async (transaction) => {
    const installation = await transaction.installation.update({
      where: { projectId },
      data: { ...data, version: { increment: 1 } },
    });
    await transaction.calculationResult.deleteMany({
      where: { circuit: { installationId: installation.id } },
    });
    return transaction.installation.findUnique({
      where: { id: installation.id },
      include: { circuits: { include: { calculationResult: true } } },
    });
  });
}

module.exports = {
  findProjectById,
  findInstallationByProjectId,
  createInstallation,
  updateInstallation,
};
