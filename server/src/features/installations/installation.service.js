const defaultInstallationRepository = require("./installation.repository");
const {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} = require("../../common/errors/AppErrors");

async function assertProjectAccess(projectId, userId, installationRepository) {
  const project = await installationRepository.findProjectById(projectId);
  if (!project) {
    throw new NotFoundError(`Projet introuvable : ${projectId}`);
  }
  if (project.ownerId !== userId) {
    throw new ForbiddenError("Vous n'avez pas accès à ce projet");
  }
}

async function createInstallation(
  userId,
  data,
  installationRepository = defaultInstallationRepository,
) {
  await assertProjectAccess(data.projectId, userId, installationRepository);

  const existing = await installationRepository.findInstallationByProjectId(
    data.projectId,
  );
  if (existing) {
    throw new ConflictError("Ce projet possède déjà une installation");
  }

  return installationRepository.createInstallation(data);
}

async function getInstallationByProject(
  userId,
  projectId,
  installationRepository = defaultInstallationRepository,
) {
  await assertProjectAccess(projectId, userId, installationRepository);
  const installation =
    await installationRepository.findInstallationByProjectId(projectId);
  if (!installation) {
    throw new NotFoundError("Aucune installation pour ce projet");
  }
  return installation;
}

async function updateInstallation(
  userId,
  projectId,
  data,
  installationRepository = defaultInstallationRepository,
) {
  await assertProjectAccess(projectId, userId, installationRepository);
  const installation =
    await installationRepository.findInstallationByProjectId(projectId);
  if (!installation) {
    throw new NotFoundError("Aucune installation pour ce projet");
  }
  return installationRepository.updateInstallation(projectId, data);
}

function createInstallationService(
  installationRepository = defaultInstallationRepository,
) {
  return {
    createInstallation: (userId, data) =>
      createInstallation(userId, data, installationRepository),
    getInstallationByProject: (userId, projectId) =>
      getInstallationByProject(userId, projectId, installationRepository),
    updateInstallation: (userId, projectId, data) =>
      updateInstallation(userId, projectId, data, installationRepository),
  };
}

module.exports = { ...createInstallationService(), createInstallationService };
