import { Div } from './HTMLElements.mjs';
import { Player } from './Player.mjs';

// UI for showing everyone's stats/resources (maybe a better name?)
class PlayerDisplay extends Div {
	constructor() {
		super('playerDisplay');
		this.players = {};
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
}

export { PlayerDisplay };
