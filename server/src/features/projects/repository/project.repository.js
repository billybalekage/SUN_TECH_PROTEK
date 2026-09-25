const prisma = require("../../../config/database");

async function createProject(data) {
  return prisma.project.create({ data });
}

async function findProjectById(id) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      installation: {
        include: { circuits: { include: { calculationResult: true } } },
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

async function updateProject(id, data) {
  return prisma.project.update({ where: { id }, data });
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
