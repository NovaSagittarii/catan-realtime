// brick, lumber, wool, grain, ore

const EdgeStructures = {
	road: {
		initial: 15,
		cost: [1, 1, 0, 0, 0],
	},
};
const VertexStructures = {
	city_small: {
		initial: 5,
		cost: [1, 1, 1, 1, 0],
	},
	city_large: {
		initial: 4,
		cost: [0, 0, 0, 2, 3],
	},
};

const Structures = { ...EdgeStructures, ...VertexStructures };
const StructureName = Object.keys(Structures);
const StructureType = {};
StructureName.forEach(
	(x, i) =>
		(StructureType[x.toUpperCase()] = i | (x in EdgeStructures ? 8 : 0)),
);
const StructureCount = StructureName.length;
const InitialStructure = Object.values(Structures).map(
	({ initial }) => initial,
);
const StructureCost = {};
Object.entries(Structures).map(
	([name, { cost }]) =>
		(StructureCost[name.toUpperCase()] = StructureCost[
			StructureType[name.toUpperCase()]
		] =
			cost),
);

export {
	StructureName,
	StructureType,
	StructureCount,
	InitialStructure,
	StructureCost,
};
