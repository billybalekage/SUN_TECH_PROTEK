const componentRepository = require("./repository");
const { BadRequestError } = require("../../common/errors/AppErrors");

const COMPONENT_TYPES = Object.freeze({
	PROTECTION: "DISJONCTEUR",
	CABLE: "CABLE",
});

/**
 * Convertit une valeur de catalogue en nombre, en déléguant à toNumber si disponible.
 * @param {*} value - Valeur numérique, convertible ou de type Decimal.
 * @returns {number|null} Résultat de toNumber, sinon nombre fini ou null si absent/non fini.
 */
function toNumber(value) {
	if (value === null || value === undefined) return null;
	if (typeof value.toNumber === "function") return value.toNumber();
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

/**
 * Vérifie qu'une valeur est un nombre fini strictement positif.
 * @param {number} value - Valeur à vérifier.
 * @param {string} label - Nom du champ utilisé dans le message d'erreur.
 * @returns {void}
 * @throws {BadRequestError} Si la valeur n'est pas un nombre fini strictement positif.
 */
function validatePositive(value, label) {
	if (!Number.isFinite(value) || value <= 0) {
		throw new BadRequestError(`${label} doit être un nombre positif`);
	}
}

/**
 * Construit le service de sélection avec un dépôt de composants injectable.
 * @param {{findByType: function(string): Promise<object[]>}} [repository=componentRepository] - Dépôt à interroger.
 * @returns {{matchCommercialComponents: Function}} Opération de recherche de composants compatibles.
 */
function createComponentService(repository = componentRepository) {
	/**
	 * Sélectionne les protections de calibre exact et les câbles de section suffisante.
	 * Les spécifications demandées doivent correspondre exactement à celles du câble.
	 * @param {object} params - Critères issus du dimensionnement.
	 * @param {number} params.inCurrent - Calibre de protection recherché en A.
	 * @param {number} params.sectionMm2 - Section minimale du câble en mm².
	 * @param {number} [params.minimumBreakingCapacity] - Pouvoir de coupure minimal, dans l'unité du catalogue.
	 * @param {object} [params.cableSpecifications={}] - Propriétés attendues dans technicalSpecs.
	 * @returns {Promise<{protections: object[], cables: object[]}>} Composants compatibles.
	 * @throws {BadRequestError} Si un critère numérique est invalide ou les spécifications ne sont pas un objet.
	 */
	async function matchCommercialComponents({
		inCurrent,
		sectionMm2,
		minimumBreakingCapacity,
		cableSpecifications = {},
	}) {
		validatePositive(inCurrent, "In");
		validatePositive(sectionMm2, "La section minimale");
		if (minimumBreakingCapacity !== undefined) {
			validatePositive(
				minimumBreakingCapacity,
				"Le pouvoir de coupure minimal",
			);
		}
		if (
			cableSpecifications === null ||
			typeof cableSpecifications !== "object" ||
			Array.isArray(cableSpecifications)
		) {
			throw new BadRequestError(
				"Les spécifications du câble doivent être un objet",
			);
		}

		const [protections, cables] = await Promise.all([
			repository.findByType(COMPONENT_TYPES.PROTECTION),
			repository.findByType(COMPONENT_TYPES.CABLE),
		]);

		return {
			protections: protections.filter((component) => {
				const ratedCurrent = toNumber(component.ratedCurrent);
				const breakingCapacity = toNumber(component.breakingCapacity);
				return (
					ratedCurrent === inCurrent &&
					(minimumBreakingCapacity === undefined ||
						(breakingCapacity !== null &&
							breakingCapacity >= minimumBreakingCapacity))
				);
			}),
			cables: cables.filter((component) => {
				const specifications = component.technicalSpecs ?? {};
				const availableSection = toNumber(specifications.sectionMm2);
				return (
					availableSection !== null &&
					availableSection >= sectionMm2 &&
					Object.entries(cableSpecifications).every(
						([key, value]) => specifications[key] === value,
					)
				);
			}),
		};
	}

	return { matchCommercialComponents };
}

const { matchCommercialComponents } = createComponentService();

module.exports = {
	COMPONENT_TYPES,
	createComponentService,
	matchCommercialComponents,
};
