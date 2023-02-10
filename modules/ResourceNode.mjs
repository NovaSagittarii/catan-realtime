import { ResourceType } from './Resources.mjs';

class ResourceNode {
	static ResourceType = ResourceType;
	constructor() {
		this.initialize();
	}
	initialize() {
		this.trigger = ~~(Math.random() * 5 + 2) + ~~(Math.random() * 2) * 6;
		this.resourceType =
			Object.values(ResourceType)[
				~~(Math.random() * Object.values(ResourceType).length)
			];
		this.robberExpire = -1;
	}
}

export { ResourceNode };
