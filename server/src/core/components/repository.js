const prisma = require("../../config/database");

/**
 * Liste les composants d'un type avec leur fabricant, triés par fabricant puis référence.
 * @param {string} type - Type de composant du catalogue.
 * @returns {Promise<object[]>} Composants avec leur relation manufacturer.
 */
async function findByType(type) {
	return prisma.component.findMany({
		where: { type },
		include: { manufacturer: true },
		orderBy: [{ manufacturer: { name: "asc" } }, { reference: "asc" }],
	});
}

module.exports = { findByType };
