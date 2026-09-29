const prisma = require("../../../config/database");

async function createProject(data) {
  return prisma.project.create({ data });
}

async function findProjectById(id) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      installation: {
        include: {
          differentialDevices: { include: { circuits: true } },
          circuits: {
            include: { calculationResult: true, differentialDevice: true },
          },
        },
      },
      owner: { select: { id: true, fullName: true, email: true } },
    },
  });
}

async function findProjectsByOwner(ownerId) {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
  });
}

async function updateProject(id, data, prismaClient = prisma) {
  return prismaClient.$transaction(async (transaction) => {
    const currentProject = await transaction.project.findUnique({
      where: { id },
      select: { status: true, validatedAt: true },
    });
    const updateData = { ...data };

    if (data.status === "COMPLETED" && currentProject.status !== "COMPLETED") {
      updateData.validatedAt = new Date();
    } else if (data.status && data.status !== "COMPLETED") {
      updateData.validatedAt = null;
    } else if (data.status === "COMPLETED") {
      updateData.validatedAt = currentProject.validatedAt;
    }

    return transaction.project.update({ where: { id }, data: updateData });
  });
}

async function deleteProject(id) {
  return prisma.project.delete({ where: { id } });
}

module.exports = {
  createProject,
  findProjectById,
  findProjectsByOwner,
  updateProject,
  deleteProject,
};
