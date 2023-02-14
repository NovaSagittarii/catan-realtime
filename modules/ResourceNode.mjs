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
		this.robberActive = false;
	}
	setRobber(until) {
		this.robberExpire = until;
		this.robberActive = true;
	}
	clearRobber() {
		this.robberExpire = -1;
		this.robberActive = false;
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
