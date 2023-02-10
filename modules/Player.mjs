import { InitialResource } from './Resources.mjs'
import { InitialStructure } from './Structures.mjs';
import { InitialCard } from './Cards.mjs';

class Player {
	constructor(blueprints=InitialStructure){
		this.resources = InitialResource.map(() => 0);
		this.blueprints = new Array(...blueprints);
		this.cards = InitialCard.map(() => 0);
	}
}

export { Player };