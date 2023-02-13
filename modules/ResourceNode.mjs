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
	setRobber(until) {
		this.robberExpire = until;
	}
	clearRobber() {
		this.robberExpire = -1;
	}
	isActive(time) {
		return this.robberExpire < time;
	}
	export() {
		const t = this.trigger;
		const r = this.resourceType;
		return { t, r };
	}
}

export { ResourceNode };
