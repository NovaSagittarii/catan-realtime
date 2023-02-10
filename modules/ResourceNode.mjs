import { ResourceType } from './Resources.mjs';

class ResourceNode {
	static ResourceType = ResourceType;
	constructor(){
		this.trigger = null;
		this.resourceType = null;
		this.robberExpire = -1;
	}
}

export { ResourceNode };