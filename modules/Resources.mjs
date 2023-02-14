const Resources = {
	brick: 0,
	lumber: 0,
	wool: 0,
	grain: 0,
	ore: 0,
};
const ResourceFrequency = {
	brick: 3,
	lumber: 4,
	wool: 4,
	grain: 4,
	ore: 3,
};

const ResourceName = Object.keys(Resources);
const ResourceType = {};
ResourceName.forEach((x, i) => (ResourceType[x.toUpperCase()] = i));
const ResourceCount = ResourceName.length;
const InitialResource = Object.values(Resources);
const ResourceAbundance = ResourceName.map((name) => ResourceFrequency[name]);

export {
	ResourceName,
	ResourceType,
	ResourceCount,
	InitialResource,
	ResourceAbundance,
};
