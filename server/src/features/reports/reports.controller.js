const reportsService = require("./reports.service");
const { asyncHandler } = require("../../common/utils/asyncHandler");

const downloadProjectReport = asyncHandler(async (req, res) => {
  const pdf = await reportsService.generateProjectReport(
    req.params.id,
    req.user.id,
  );
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="rapport-${req.params.id}.pdf"`,
    "Content-Length": pdf.length,
  });
  res.send(pdf);
});

module.exports = { downloadProjectReport };
