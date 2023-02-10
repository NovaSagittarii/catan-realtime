const Resources = {
	brick: 0,
	lumber: 0,
	wool: 0,
	grain: 0,
	ore: 0,
};

const ResourceName = Object.keys(Resources);
const ResourceType = {};
ResourceName.forEach((x, i) => (ResourceType[x.toUpperCase()] = i));
const ResourceCount = ResourceName.length;
const InitialResource = Object.values(Resources);

export { ResourceName, ResourceType, ResourceCount, InitialResource };
