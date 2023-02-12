import { InitialResource } from './Resources.mjs';
import { InitialStructure } from './Structures.mjs';
import { InitialCard } from './Cards.mjs';

class Player {
	constructor(socket, name, blueprints) {
		this.socket = socket;
		this.name = name;
		this.initialize(blueprints);
		this.id = null;
	}
	initialize(blueprints = InitialStructure) {
		this.points = 0;
		this.nextRoll = -1;
		this.queued = {
			roll: false,
			robber: 0,
			road: 2 && 2000,
			city_small: 2 && 2000,
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
	setId(id) {
		this.id = id;
	}
	export() {
		return {
			p: this.points,
			i: this.id,
			n: this.name,
			t: this.nextRoll,
			ql: this.queued.roll,
			qb: this.queued.robber,
			qa: this.queued.road,
			qc: this.queued.city_small,
			r: this.resources,
			b: this.blueprints,
			c: this.cards,
		};
	}
}

export { Player };
