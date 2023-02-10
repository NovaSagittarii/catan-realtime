const Structures = {
	road: 15,
	city_small: 5,
	city_large: 4,
};

const StructureName = Object.keys(Structures);
const StructureType = {};
StructureName.forEach((x, i) => (StructureType[x.toUpperCase()] = i));
const StructureCount = StructureName.length;
const InitialStructure = Object.values(Structures);

export { StructureName, StructureType, StructureCount, InitialStructure };
