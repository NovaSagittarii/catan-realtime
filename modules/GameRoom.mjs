import { Game } from './Game.mjs';
import { Player } from './Player.mjs';
import { ResourceType } from './Resources.mjs';
import { StructureType, StructureCost } from './Structures.mjs';
import { CardType, CardCost } from './Cards.mjs';

function GameRoomConfiguration() {
	const second = 60; // 1 second = x frames
	this.ROBBER_DURATION = 25 * second;
	this.PLENTY_BONUS = 1;

	this.TICKER_INTERVAL = 20;
}

class GameRoom {
	static RoomState = {
		OPEN: Symbol('RoomState::open'),
		CLOSED: Symbol('RoomState::closed'),
		IN_PROGRESS: Symbol('RoomState::inProgress'),
	};
	constructor(io) {
		this.name = 'ROOM';
		this.state = GameRoom.RoomState.OPEN;
		this.configuration = new GameRoomConfiguration();
		this.players = {};
		this.host = null;
		this.game = new Game();
		this.io = io;
	}
	start(socket) {
		if (this.host !== this.players[socket.id])
			return this.protocolViolation(
				socket,
				'start game fail - client is not host',
			);
		if (this.state === GameRoom.RoomState.IN_PROGRESS)
			return this.protocolViolation(
				socket,
				'start game fail - game already in progress',
			);
		this.startGame();
	}
	startGame() {
		if (this.state !== GameRoom.RoomState.IN_PROGRESS) {
			this.state = GameRoom.RoomState.IN_PROGRESS;
			this.game.startTicker(this.configuration.TICKER_INTERVAL);
		}
	}
	join(socket) {
		if (this.state !== GameRoom.RoomState.OPEN)
			return this.protocolViolation(socket, 'join fail - room is not open');
		this.players[socket.id] = new Player(socket);
		if (Object.keys(this.players).length <= 1) this.reassignHost();
	}
	leave(socket) {
		const needsNewHost = this.players[socket.id] === this.host;
		delete this.players[socket.id];
		if (needsNewHost) this.reassignHost();
	}
	handleEvent(socket, event, data) {
		if (this.state !== GameRoom.RoomState.IN_PROGRESS)
			return this.protocolViolation(
				socket,
				'event fail - game has not started',
			);
		const player = this.players[socket.id];
		switch (event) {
			case 'build': {
				const { x, y, z, building } = data;
				const side = z & 7;
				// const node = z & 16;
				const edge = !!(z & 8);
				let location = null;

				// check build conditions
				if (!(building in StructureCost) || isNaN(building))
					return this.protocolViolation(
						socket,
						'Build fail - invalid structure',
					);
				if (edge !== !!(building & 8))
					return this.protocolViolation(
						socket,
						'Build fail - wrong structure subtype (edge-vertex mismatch)',
					);

				const sufficientResources = StructureCost[building]
					.map((x, i) => x <= player.resources[i])
					.reduce((a, b) => a && b, true);
				if (
					sufficientResources &&
					building !== StructureType.ROAD &&
					building !== StructureType.CITY_SMALL
				)
					return this.protocolViolation(
						socket,
						'Build fail - insufficient resources',
					);

				console.log(player.queued, player.resources);
				switch (building) {
					case StructureType.ROAD: {
						location = this.game.getEdge(x, y, side);
						if (!location)
							return this.protocolViolation(
								socket,
								'Build fail (road) - edge does not exist',
							);
						if (location.getStructure())
							return this.protocolViolation(
								socket,
								'Build fail (road) - not empty',
							);
						// TODO: a road is already connected
						if (!sufficientResources && player.queued.road > 0)
							player.queued.road--;
						else
							return this.protocolViolation(
								socket,
								'Build fail - insufficient resources',
							);
						break;
					}
					case StructureType.CITY_SMALL: {
						location = this.game.getVertex(x, y, side);
						if (!location)
							return this.protocolViolation(
								socket,
								'Build fail (city_small) - vertex does not exist',
							);
						if (location.getStructure())
							return this.protocolViolation(
								socket,
								'Build fail (city_small) - not empty',
							);
						// TODO: a road is already connected and there are no nearby cities
						// console.log(player.queued.city_small);
						if (!sufficientResources && player.queued.city_small > 0)
							player.queued.city_small--;
						else
							return this.protocolViolation(
								socket,
								'Build fail - insufficient resources',
							);
						break;
					}
					case StructureType.CITY_LARGE: {
						location = this.game.getVertex(x, y, side);
						if (!location)
							return this.protocolViolation(
								socket,
								'Build fail (city_large) - vertex does not exist',
							);
						if (location.getStructure() !== StructureType.CITY_SMALL)
							return this.protocolViolation(
								socket,
								'Build fail (city_large) - not city_small',
							);
						if (location.getOwner() !== player)
							return this.protocolViolation(
								socket,
								'Build fail (city_large) - does not own',
							);
						break;
					}
				}
				// take cost and update grid
				if (sufficientResources)
					StructureCost[building].forEach((x, i) => (player.resources[i] -= x));
				this.build(location, player, building);
				break;
			}
			case 'roll': {
				player.requestRoll();
				break;
			}
			case 'robber': {
				if (player.queued.robber <= 0)
					return this.protocolViolation(
						socket,
						'Robber fail - no robber actions queued',
					);
				const { x1, y1, x2, y2 } = data;
				const robberAdd = this.game.getNode(x1, y1);
				const robberRemove = this.game.getNode(x2, y2);
				if (!robberAdd)
					return this.protocolViolation(
						socket,
						'Robber fail - invalid robberAdd position',
					);

				player.queued.robber -= 1;
				robberAdd.setRobber(
					this.game.getTime() + this.configuration.ROBBER_DURATION,
				);
				if (robberRemove) robberRemove.clearRobber();
				break;
			}
			case 'act': {
				const { card, resource } = data;
				if (player.cards[card] <= 0)
					return this.protocolViolation(socket, 'Act fail - insufficient card');
				switch (card) {
					case CardType.KNIGHT:
						player.queued.robber += 1;
						break;
					case CardType.POINT:
						player.points += 1;
						break;
					case CardType.MONOPOLY:
						if (!(resource in ResourceType))
							return this.protocolViolation(
								socket,
								'Act fail (monopoly) - invalid resource',
							);
						let resourceYield = 0;
						for (const player of this.players) {
							const amt = player.resources[resource];
							player.resources[resource] -= amt; // take from everyone (including self)
							resourceYield += amt;
						}
						player.resources[resource] = resourceYield; // and then just transfer as a batch
						break;
					case CardType.RESOURCES:
						for (let i = 0; i < ResourceType.length; i++)
							player.resources[i] += this.configuration.PLENTY_BONUS;
						break;
					case CardType.ROAD:
						player.queued.road += 2;
						break;
				}
				player.cards[card] -= 1;
				break;
			}
		}
	}
	processRolls() {
		for (const player of this.players) {
			if (player.canRoll(this.game.getTime()) && player.requestedRoll()) {
				player.clearRollRequest();
				const rollResult = [...new Array(2)]
					.map((x) => ~~(1 + 6 * Math.random()))
					.reduce((a, b) => a + b);
				console.log('processing roll result %i', rollResult);
				this.game.processRoll(rollResult, this.game.getTime());
			}
		}
	}
	build(where, who, what) {
		where.build(who, what);
	}
	protocolViolation(who, msg) {
		console.log('PROTOCOL VIOLATION by <%s> :: %s', who.id, msg);
		// normally u just dc them :^)
	}
	reassignHost(to) {
		this.host = to || Object.values(this.players)[0] || null;
		console.log(
			'new host for room <%s> -- <%s>',
			this.name,
			this.host.socket.id,
		);
	}
}

export { GameRoom };