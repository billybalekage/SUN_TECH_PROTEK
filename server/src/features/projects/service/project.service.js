const projectRepository = require("../repository/project.repository");
const {
  NotFoundError,
  ForbiddenError,
} = require("../../../common/errors/AppErrors");

/**
 * Vérifie que l'utilisateur est bien propriétaire du projet.
 * Les admins passent toujours (accès de supervision).
 */
function assertOwnership(project, user) {
  if (user.roleName === "ADMIN") return;
  if (project.ownerId !== user.id) {
    throw new ForbiddenError("Vous n'avez pas accès à ce projet");
  }
}

async function createProject(ownerId, data) {
  return projectRepository.createProject({ ...data, ownerId });
}

async function getProjectById(id, user) {
  const project = await projectRepository.findProjectById(id);
  if (!project) {
    throw new NotFoundError(`Projet introuvable : ${id}`);
  }
  assertOwnership(project, user);
  return project;
}

async function listMyProjects(ownerId) {
  return projectRepository.findProjectsByOwner(ownerId);
}

async function updateProject(id, user, data) {
  const project = await projectRepository.findProjectById(id);
  if (!project) {
    throw new NotFoundError(`Projet introuvable : ${id}`);
  }
  assertOwnership(project, user);
  return projectRepository.updateProject(id, data);
}

async function deleteProject(id, user) {
  const project = await projectRepository.findProjectById(id);
  if (!project) {
    throw new NotFoundError(`Projet introuvable : ${id}`);
  }
  assertOwnership(project, user);
  return projectRepository.deleteProject(id);
}

module.exports = {
  createProject,
  getProjectById,
  listMyProjects,
  updateProject,
  deleteProject,
};
