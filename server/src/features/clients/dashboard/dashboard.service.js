const dashboardRepository = require("./dashboard.repository");

async function getDashboard(ownerId) {
  return dashboardRepository.getDashboardData(ownerId);
}

module.exports = { getDashboard };
