const prisma = require("../../config/database");

async function findByType(type) {
	return prisma.component.findMany({
		where: { type },
		include: { manufacturer: true },
		orderBy: [{ manufacturer: { name: "asc" } }, { reference: "asc" }],
	});
}

module.exports = { findByType };
