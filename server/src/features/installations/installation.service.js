const {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} = require("../../common/errors/AppErrors");

function getDefaultInstallationRepository() {
  return require("./installation.repository");
}

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
  installationRepository = getDefaultInstallationRepository(),
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
  installationRepository = getDefaultInstallationRepository(),
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
  installationRepository = getDefaultInstallationRepository(),
) {
  await assertProjectAccess(projectId, userId, installationRepository);
  const installation =
    await installationRepository.findInstallationByProjectId(projectId);
  if (!installation) {
    throw new NotFoundError("Aucune installation pour ce projet");
  }
  return installationRepository.updateInstallation(projectId, data);
}

function createInstallationService(installationRepository) {
  const repository = installationRepository;
  return {
    createInstallation: (userId, data) =>
      repository
        ? createInstallation(userId, data, repository)
        : createInstallation(userId, data),
    getInstallationByProject: (userId, projectId) =>
      repository
        ? getInstallationByProject(userId, projectId, repository)
        : getInstallationByProject(userId, projectId),
    updateInstallation: (userId, projectId, data) =>
      repository
        ? updateInstallation(userId, projectId, data, repository)
        : updateInstallation(userId, projectId, data),
  };
}

module.exports = { ...createInstallationService(), createInstallationService };
