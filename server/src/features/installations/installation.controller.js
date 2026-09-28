const installationService = require("./installation.service");
const { asyncHandler } = require("../../common/utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const installation = await installationService.createInstallation(
    req.user.id,
    req.body,
  );
  return res.status(201).json(installation);
});

const getByProject = asyncHandler(async (req, res) => {
  const installation = await installationService.getInstallationByProject(
    req.user.id,
    req.params.projectId,
  );
  return res.status(200).json(installation);
});

const updateByProject = asyncHandler(async (req, res) => {
  const installation = await installationService.updateInstallation(
    req.user.id,
    req.params.projectId,
    req.body,
  );
  return res.status(200).json(installation);
});

module.exports = { create, getByProject, updateByProject };
