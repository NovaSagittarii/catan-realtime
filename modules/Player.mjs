import { InitialResource } from './Resources.mjs';
import { InitialStructure } from './Structures.mjs';
import { InitialCard } from './Cards.mjs';

class Player {
	constructor(socket, blueprints) {
		this.socket = socket;
		this.initialize(blueprints);
	}
	initialize(blueprints = InitialStructure) {
		this.points = 0;
		this.nextRoll = -1;
		this.queued = {
			roll: false,
			robber: 0,
			road: 2,
			city_small: 2,
		};
		this.resources = InitialResource.map(() => 0);
		this.blueprints = new Array(...blueprints);
		this.cards = InitialCard.map(() => 0);
	}
	requestRoll() {
		this.queued.roll = true;
	}
	clearRollRequest() {
		this.queued.roll = false;
	}
	requestedRoll() {
		return this.queued.roll;
	}
	canRoll(t) {
		const { robber, road, city_small } = this.queued;
		return robber <= 0 && road <= 0 && city_small <= 0 && this.nextRoll < t;
	}
}

export { Player };
