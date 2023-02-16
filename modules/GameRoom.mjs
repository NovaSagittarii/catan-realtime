import { Game } from './Game.mjs';
import { Player } from './Player.mjs';
import { ResourceType, ResourceName } from './Resources.mjs';
import { StructureType, StructureCost } from './Structures.mjs';
import { CardType, CardCost } from './Cards.mjs';
import { weightedSelect } from './Util.mjs';

function GameRoomConfiguration() {
	// units are in ticks (1000/TICKER_INTERVAL = 1 tick)
	this.TICKER_INTERVAL = 20;
	const tps = 1000 / this.TICKER_INTERVAL;

	this.ROLL_COOLDOWN = 3 * tps;
	this.ROBBER_DURATION = 45 * tps;
	this.PLENTY_BONUS = 1;

	this.TRADE_COST = 4;
	this.CARD_COST = [0, 0, 1, 1, 1];
	this.POINT_THRESHOLD = 10;
}

class GameRoom {
	static RoomState = {
		OPEN: Symbol('RoomState::open'),
		CLOSED: Symbol('RoomState::closed'),
		IN_PROGRESS: Symbol('RoomState::inProgress'),
		FINISHED: Symbol('RoomState::finished'),
	};
	constructor(io, { name, persistent } = {}) {
		this.name = name;
		this.state = GameRoom.RoomState.OPEN;
		this.configuration = new GameRoomConfiguration();
		this.players = {};
		this.playersJoined = 0;
		this.host = null;
		this.game = new Game();
		this.io = io;
		this.persistent = persistent || false;
	}
	initialize() {
		this.state = GameRoom.RoomState.OPEN;
		this.game.initialize();
		for (const player of Object.values(this.players)) player.initialize();
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
			this.initialize();
			this.state = GameRoom.RoomState.IN_PROGRESS;
			this.game.startTicker(this.configuration.TICKER_INTERVAL, (time) => {
				if (time % Math.floor(100 / this.configuration.TICKER_INTERVAL) === 0) {
					this.broadcast('time', time);
					this.processRolls(); // TODO: move this to timeout isntead of interval :^)
				}
			});
			const grid = this.game.getResourceConfiguration();
			// console.log(grid);
			const configuration = {
				g: grid,
				h: this.host?.id,
			};
			const playerData = Object.values(this.players).map((x) => x.export());
			this.broadcast('configuration', configuration);
			this.broadcast('playerData', playerData);
			// for(const p in this.players){
			// 	const { socket, id } = this.players[p];
			// 	socket.emit('id', id);
			// }
		}
	}
	broadcast(event, data) {
		for (const { socket } of Object.values(this.players))
			socket.emit(event, data);
	}
	join(socket, name) {
		if (this.state !== GameRoom.RoomState.OPEN)
			return this.protocolViolation(socket, 'join fail - room is not open');
		this.players[socket.id] = new Player(socket, name);
		this.players[socket.id].setId(this.playersJoined++);
		if (this.isEmpty()) this.reassignHost();
		const configuration = {
			h: this.host?.id,
			n: this.name,
		};
		this.broadcast('configuration', configuration);

		const playerData = Object.values(this.players).map((x) => x.export());
		socket.emit('id', this.players[socket.id].id);
		this.broadcast('playerData', playerData);
	}
	leave(socket) {
		// console.log('gameroom.leave', socket.id);
		const needsNewHost = this.players[socket.id] === this.host;
		const playerId = this.players[socket.id]?.id;
		if (playerId !== undefined) delete this.players[socket.id];
		if (needsNewHost) this.reassignHost();
		// console.log(this.players);
		if (Object.keys(this.players).length === 0) {
			console.log('>> room <%s> is empty -- game reset', this.name);
			this.initialize();
		} else {
			this.broadcast('left', playerId);
		}
	}
	handleEvent(socket, event, data) {
		if (this.state !== GameRoom.RoomState.IN_PROGRESS)
			return this.protocolViolation(
				socket,
				'event fail - game has not started',
			);
		const player = this.players[socket.id];
		if (!player)
			return this.protocolViolation(
				socket,
				'event fail - player is not in game',
			);
		switch (event) {
			case 'ask': {
				console.log(data);
				const { x, y, z } = data;
				const side = z & 7;
				const node = !!(z & 16);
				const edge = !!(z & 8);
				if (node) socket.emit('ans', this.game.getNode(x, y).export());
				else if (edge)
					socket.emit('ans', this.game.getEdge(x, y, side).export());
				else socket.emit('ans', this.game.getVertex(x, y, side).export());
				break;
			}
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

				let sufficientResources = StructureCost[building]
					.map((x, i) => x <= player.resources[i])
					.reduce((a, b) => a && b, true); // may be override by using vouchers
				// TODO: if adding more buildings, fixing building->playerBlueprint mapping will need to be fixed
				sufficientResources &&= player.blueprints[building & 7];
				const useVoucher =
					(building === StructureType.ROAD && player.queued.road > 0) ||
					(building === StructureType.CITY_SMALL &&
						player.queued.city_small > 0);

				// console.log(StructureCost, building);
				// console.log(StructureCost[building]);
				// console.log(sufficientResources);
				if (!sufficientResources && !useVoucher)
					return this.protocolViolation(
						socket,
						'Build fail - insufficient resources',
					);

				// console.log(player.queued, player.resources);
				const directions = [
					// +1 is clockwise
					[1, -1], // 0 (lower right)
					[0, -1], // 1 (lower left)
					[-1, 0], // 2 (middle left)
					[-1, 1], // 3 (upper left)
					[0, 1], // 4 (upper right)
					[1, 0], // 5 (middle right)
				];
				switch (building) {
					case StructureType.ROAD: {
						location = this.game.getEdge(x, y, side);
						if (!location)
							return this.protocolViolation(
								socket,
								'Build fail (road) - edge does not exist',
							);
						if (location.exists())
							return this.protocolViolation(
								socket,
								'Build fail (road) - not empty',
							);
						// assert a road is already connected
						const connectedRoads = directions.map(([dx, dy]) => [
							[0, 0, -1],
							[0, 0, 1],
							[dx, dy, 2],
							[dx, dy, -2],
						]);
						// [
						// 	[[0,0,-1],[0,0,1],[1,-1,2],[1,-2,-2]],
						// 	[[0,0,-1],[0,0,1],[0,-1,2],[0,-1,-2]],
						// 	[[0,0,-1],[0,0,1],[-1,0,2],[-1,0,-2]],
						// 	[[0,0,-1],[0,0,1],[-1,1,2],[-1,1,-2]],
						// 	[[0,0,-1],[0,0,1],[0,1,2],[0,1,-2]],
						// 	[[0,0,-1],[0,0,1],[1,0,2],[1,0,-2]],
						// ];
						const connectsToCity =
							this.game.getVertex(x, y, side).getOwner() === player ||
							this.game.getVertex(x, y, (side + 1) % 6).getOwner() === player;
						const connectsToRoad =
							connectedRoads[side].filter(
								([dx, dy, dz]) =>
									this.game
										.getEdge(x + dx, y + dy, (side + dz + 6) % 6)
										?.getOwner() === player,
							).length > 0;
						if (!connectsToCity && !connectsToRoad)
							return this.protocolViolation(
								socket,
								'Build fail (road) - road is not connected to city or road',
							);
						if (!sufficientResources || useVoucher) {
							if (player.queued.road > 0) {
								player.queued.road--;
								sufficientResources = false;
							} else
								return this.protocolViolation(
									socket,
									'Build fail - insufficient resources',
								);
						}
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
						const nearbyCities = directions.map(([dx, dy]) => [
							[0, 0, -1],
							[0, 0, 1],
							[dx, dy, -1],
						]);
						const nearbyCity =
							nearbyCities[side].filter(([dx, dy, dz]) =>
								this.game
									.getVertex(x + dx, y + dy, (side + dz + 6) % 6)
									?.exists(),
							).length > 0;
						if (nearbyCity)
							return this.protocolViolation(
								socket,
								'Build fail (city_small) - nearby city',
							);
						const nearbyRoads = directions.map(([dx, dy]) => [
							[0, 0, 0],
							[0, 0, -1],
							[dx, dy, -2],
						]);
						const nearbyRoad =
							nearbyRoads[side].filter(([dx, dy, dz]) => {
								return (
									this.game
										.getEdge(x + dx, y + dy, (side + dz + 6) % 6)
										?.getOwner() === player
								);
							}).length > 0;
						// console.log({ nearbyRoad, useVoucher });
						if (!nearbyRoad && !useVoucher)
							return this.protocolViolation(
								socket,
								'Build fail (city_small) - missing nearby road',
							);
						// allow building without road if its the beginning of the game
						// console.log(player.queued.city_small);
						if (!sufficientResources || useVoucher) {
							if (player.queued.city_small > 0) {
								player.queued.city_small--;
								sufficientResources = false;
							} else
								return this.protocolViolation(
									socket,
									'Build fail - insufficient resources',
								);
						}
						player.points += 1; // award 1 VP for building settlement (city_small)
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
						player.points += 1; // award 1 net VP for upgrading settlement (city_small) to city (city_large)
						break;
					}
				}
				// take cost and update grid
				if (sufficientResources) {
					StructureCost[building].forEach((x, i) => (player.resources[i] -= x));
				}
				// always take blueprint
				// TODO: if adding more buildings, fixing building->playerBlueprint mapping will need to be fixed
				player.blueprints[building & 7]--;
				// refund city_small when building city_large
				if (building === StructureType.CITY_LARGE)
					player.blueprints[StructureType.CITY_SMALL]++;

				this.build(location, player, building);
				// update everyone something new is built
				this.broadcast('gridData', [
					{
						x,
						y,
						z,
						b: building,
						i: player.id,
					},
				]);
				break;
			}
			case 'roll': {
				const alreadyQueued = player.requestedRoll();
				player.requestRoll();
				if (player.canRoll(this.game.getTime())) this.processRoll(player);
				// else if (!alreadyQueued)
				// 	setTimeout(
				// 		() => this.processRoll(player),
				// 		this.configuration.TICKER_INTERVAL *
				// 			(2 + player.nextRoll - this.game.getTime()),
				// 	); // somehow broken... no idea

				// else
				// 	socket.emit(
				// 		'notify',
				// 		'ay chill for ' + (player.nextRoll - this.game.getTime()),
				// 	);
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

				player.queued.robber -= 1;
				if (robberAdd) {
					const robberExistsUntil =
						this.game.getTime() + this.configuration.ROBBER_DURATION;
					robberAdd.setRobber(robberExistsUntil);
					this.broadcast('gridStatus', { x: x1, y: y1, r: robberExistsUntil });
				} else if (!robberRemove) {
					return this.protocolViolation(
						socket,
						'Robber fail - invalid robberAdd position',
					);
				}
				if (robberRemove) {
					robberRemove.clearRobber();
					this.broadcast('gridStatus', { x: x2, y: y2, r: -1 });
				}
				break;
			}
			case 'act': {
				const { card, resource } = data;
				if (card !== CardType.PURCHASE_CARD && player.cards[card] <= 0)
					return this.protocolViolation(socket, 'Act fail - insufficient card');
				switch (card) {
					case CardType.PURCHASE_CARD:
						// weighted random selection
						let sufficientResources = this.configuration.CARD_COST.map(
							(x, i) => x <= player.resources[i],
						).reduce((a, b) => a && b, true);
						if (!sufficientResources)
							return this.protocolViolation(
								socket,
								'Act fail - insufficient resources',
							);
						const cardId = weightedSelect(this.game.cards);
						// TODO : dev card scarcity?
						player.cards[cardId]++;
						this.configuration.CARD_COST.forEach(
							(x, i) => (player.resources[i] -= x),
						);
						break;
					case CardType.KNIGHT:
						player.queued.robber += 1;
						break;
					case CardType.POINT:
						player.points += 1;
						break;
					case CardType.MONOPOLY:
						if (!(resource in ResourceName))
							return this.protocolViolation(
								socket,
								'Act fail (monopoly) - invalid resource',
							);
						let resourceYield = 0;
						for (const player of Object.values(this.players)) {
							const amt = player.resources[resource];
							player.resources[resource] -= amt; // take from everyone (including self)
							resourceYield += amt;
						}
						player.resources[resource] = resourceYield; // and then just transfer as a batch
						this.broadcast(
							'playerData',
							Object.values(this.players).map((player) => player.export()),
						);
						break;
					case CardType.RESOURCES:
						for (let i = 0; i < ResourceName.length; i++)
							player.resources[i] += this.configuration.PLENTY_BONUS;
						break;
					case CardType.ROAD:
						player.queued.road += 2;
						break;
				}
				player.cards[card] -= 1;
				break;
			}
			case 'trade': {
				const { a, b } = data;
				if (!(a in ResourceName) || !(b in ResourceName))
					return this.protocolViolation(
						socket,
						'Trade fail - invalid resource',
					);
				if (player.resources[a] < this.configuration.TRADE_COST)
					return this.protocolViolation(
						socket,
						'Trade fail - insufficient resource',
					);
				player.resources[a] -= this.configuration.TRADE_COST;
				player.resources[b] += 1;
				break;
			}
		}
		// sync player who initiated the event (TODO: update things affected by action)
		this.broadcast('playerData', [player.export()]);
		if (player.points >= this.configuration.POINT_THRESHOLD) {
			this.state = GameRoom.RoomState.FINISHED;
			this.game.endTicker();
			this.broadcast('end', { w: player.id });
		}
	}
	processRoll(player) {
		// console.log("processing roll for player %s", player.nextRoll, this.game.getTime());
		if (player.requestedRoll() && player.canRoll(this.game.getTime())) {
			player.clearRollRequest(
				this.game.getTime() + this.configuration.ROLL_COOLDOWN,
			);
			const rollResult = [...new Array(2)]
				.map((x) => ~~(1 + 6 * Math.random()))
				.reduce((a, b) => a + b);
			// console.log('processing roll result %i', rollResult);
			if (rollResult === 7) {
				player.queued.robber += 1;
				// TODO : return n resources
			} else this.game.processRoll(rollResult, this.game.getTime());

			// TODO : implement queue?
			for (const [i, j, node] of this.game.getNodes()) {
				if (node.robberActive && node.isActive(this.game.getTime())) {
					node.clearRobber();
					this.broadcast('gridStatus', { x: j, y: i, r: -1 });
				}
			}
			this.broadcast('roll', { x: rollResult, i: player.id });
			this.broadcast('playerData', [player.export()]);
		}
	}
	processRolls() {
		for (const player of Object.values(this.players)) {
			this.processRoll(player);
		}
	}
	build(where, who, what) {
		where.build(who, what);
	}
	protocolViolation(who, msg) {
		console.log('PROTOCOL VIOLATION by <%s> :: %s', who.id, msg);
		// normally u just dc them :^)
		who.emit('notify', msg);
	}
	reassignHost(to) {
		this.host = to || Object.values(this.players)[0] || null;
		console.log(
			'new host for room <%s> -- <%s>',
			this.name,
			this.host?.socket.id,
		);
		if (this.host) {
			const configuration = {
				h: this.host?.id,
			};
			this.broadcast('configuration', configuration);
		}
	}
	isEmpty() {
		return Object.keys(this.players).length <= 1;
	}
}

export { GameRoom };
