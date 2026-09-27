const dashboardService = require("./dashboard.service");
const { asyncHandler } = require("../../../common/utils/asyncHandler");

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.getDashboard(req.user.id);
  return res.status(200).json(dashboard);
});

module.exports = { getDashboard };
