const installationRepository = require("./installation.repository");
const {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} = require("../../common/errors/AppErrors");

async function assertProjectAccess(projectId, userId) {
  const project = await installationRepository.findProjectById(projectId);
  if (!project) {
    throw new NotFoundError(`Projet introuvable : ${projectId}`);
  }
  if (project.ownerId !== userId) {
    throw new ForbiddenError("Vous n'avez pas accès à ce projet");
  }
}

async function createInstallation(userId, data) {
  await assertProjectAccess(data.projectId, userId);

  const existing = await installationRepository.findInstallationByProjectId(
    data.projectId,
  );
  if (existing) {
    throw new ConflictError("Ce projet possède déjà une installation");
  }

  return installationRepository.createInstallation(data);
}

async function getInstallationByProject(userId, projectId) {
  await assertProjectAccess(projectId, userId);
  const installation =
    await installationRepository.findInstallationByProjectId(projectId);
  if (!installation) {
    throw new NotFoundError("Aucune installation pour ce projet");
  }
  return installation;
}

module.exports = { createInstallation, getInstallationByProject };
