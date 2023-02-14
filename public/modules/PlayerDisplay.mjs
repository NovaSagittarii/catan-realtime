import { Div } from './HTMLElements.mjs';
import { Player } from './Player.mjs';

// UI for showing everyone's stats/resources (maybe a better name?)
class PlayerDisplay extends Div {
	constructor() {
		super('playerDisplay');
		this.players = {};
		this.host = null;
		this.self = null;
	}
	addPlayer(id) {
		const player = new Player(id, name);
		this.players[id] = player;
		this.htmlElement.append(player.getElement());
	}
	sync(properties) {
		const {
			points,
			id,
			name,
			nextRoll,
			roll,
			robber,
			road,
			city_small,
			resources,
			blueprints,
			cards,
		} = properties;
		if (!(id in this.players)) this.addPlayer(id, name);
		const player = this.players[id];
		for (const k in properties) player.sync(k, properties[k]);
	}
	setHost(id) {
		this.host = id;
		if (this.players[id])
			this.players[id].getElement().classList.add('playerHost');
		else setTimeout(() => this.setHost(id), 1000);
	}
	setSelf(id) {
		this.self = id;
		if (this.players[id])
			this.players[id].getElement().classList.add('playerSelf');
		else setTimeout(() => this.setSelf(id), 1000);
	}
	updateTime(newTime) {
		for (const player of Object.values(this.players)) {
			player.setTime(newTime);
		}
	}
	setResourceCostPreview(resources) {
		this.players[this.self].attributes.resources.syncPreview(
			resources
				.map((x) => -x)
				.map((x) => (x ? `(${x > 0 ? '+' : ''}${x})` : '')),
		);
	}
}

export { PlayerDisplay };
