const projectService = require("../service/project.service");
const { asyncHandler } = require("../../../common/utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);
  res.status(201).json(project);
});

const getById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id, req.user);
  res.json(project);
});

const listMine = asyncHandler(async (req, res) => {
  const projects = await projectService.listMyProjects(req.user.id);
  res.json(projects);
});

const update = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(
    req.params.id,
    req.user,
    req.body,
  );
  res.json(project);
});

const remove = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.user);
  res.status(204).send();
});

module.exports = { create, getById, listMine, update, remove };
