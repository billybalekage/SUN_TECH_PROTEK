const componentRepository = require("./repository");
const { BadRequestError } = require("../../common/errors/AppErrors");

const COMPONENT_TYPES = Object.freeze({
	PROTECTION: "DISJONCTEUR",
	CABLE: "CABLE",
});

function toNumber(value) {
	if (value === null || value === undefined) return null;
	if (typeof value.toNumber === "function") return value.toNumber();
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function validatePositive(value, label) {
	if (!Number.isFinite(value) || value <= 0) {
		throw new BadRequestError(`${label} doit être un nombre positif`);
	}
}

function createComponentService(repository = componentRepository) {
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
