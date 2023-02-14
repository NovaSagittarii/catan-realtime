import { HexagonGrid } from './HexagonGrid.mjs';
import { PlayerDisplay } from './PlayerDisplay.mjs';
import { RollAnimator } from './RollAnimator.mjs';
import { Button, ButtonKeybind, SelectModal } from './HTMLElements.mjs';

const configuration = {
	host: null,
	id: null,
};

const hexagonGrid = new HexagonGrid({
	minWidth: 3,
	maxWidth: 5,
	callbacks: {
		node: (x, y, z) => processInput('node', x, y, z),
		vertex: (x, y, z) => processInput('vertex', x, y, z),
		edge: (x, y, z) => processInput('edge', x, y, z),
		nodeOver: () => {},
		vertexOver: (empty) =>
			playerDisplay.setResourceCostPreview(
				empty ? [1, 1, 1, 1, 0] : [0, 0, 0, 2, 3],
			),
		edgeOver: () => playerDisplay.setResourceCostPreview([1, 1, 0, 0, 0]),
		mouseOut: () => playerDisplay.setResourceCostPreview([0, 0, 0, 0, 0]),
	},
});

const playerDisplay = new PlayerDisplay();
const rollResults = new RollAnimator({
	body: document.body,
	nodes: Array.from(hexagonGrid.getNodes()),
});

document.body.append(hexagonGrid.getElement(), playerDisplay.getElement());

socket = io({ transports: ['websocket'] });
hexgrid = hexagonGrid;

const buttonStartGame = new ButtonKeybind(
	13,
	'Start Game (enter)',
	['startGame'],
	() => socket.emit('start'),
);
const buttonRoll = new ButtonKeybind(32, 'Roll (space)', ['rollDice'], () =>
	socket.emit('roll'),
);
const buttonDevelopmentCard = new ButtonKeybind(
	90,
	'Buy card (z)',
	['buyCard'],
	() => socket.emit('act', { card: -1 }),
);
buttonDevelopmentCard
	.getElement()
	.addEventListener('mouseover', () =>
		playerDisplay.setResourceCostPreview([0, 0, 1, 1, 1]),
	);
buttonDevelopmentCard
	.getElement()
	.addEventListener('mouseout', () =>
		playerDisplay.setResourceCostPreview([0, 0, 0, 0, 0]),
	);

document.body.append(buttonStartGame.getElement(), buttonRoll.getElement());
document.body.append(buttonDevelopmentCard.getElement());

const selectModalResource = new SelectModal({
	title: 'Select a resource',
	choices: ['Brick', 'Lumber', 'Wool', 'Grain', 'Ore'],
	callbacks: [...new Array(5)].map((_, i) => {
		return () => {
			console.log('take resource', i);
			socket.emit('act', { card: 2, resource: i });
		};
	}),
});
const selectModalCard = new SelectModal({
	title: 'Select a card to use',
	choices: ['Knight', 'Point', 'Monopoly', 'Resources', 'Road construction'],
	callbacks: [...new Array(5)].map((_, i) => {
		// the callbacks are very messy... maybe use promises instead
		if (i == 2) {
			return () => {
				// console.log('tryin to do an activate')
				// console.log(selectModalResource);
				selectModalResource.activate().a();
				// it does not work properly without .a()... for some reason (even though it returns nothing)
				// catching the error will also break it (.active method isn't called properly)
			};
		} else {
			return () => {
				console.log('play card', i);
				socket.emit('act', { card: i });
			};
		}
	}),
});
document.body.append(
	new ButtonKeybind(88, 'Play card (x)', ['useCard'], () =>
		selectModalCard.activate(),
	).getElement(),
);

document.body.append(
	selectModalCard.getElement(),
	selectModalResource.getElement(),
);

const STRUCTURE = {
	CITY_SMALL: 1,
	CITY_LARGE: 2,
	ROAD: 8,
};
let pastX, pastY;
function processInput(type, x, y, z) {
	console.log('processInput', { type, x, y, z });
	switch (type) {
		case 'node': {
			// TODO : robber
			console.log(pastX, pastY, hexgrid.getNode(x, y).active);
			const noChange = pastX === x && pastY === y;
			if (!hexgrid.getNode(x, y).active && !noChange) [pastX, pastY] = [x, y];
			else {
				socket.emit('robber', {
					x1: noChange ? NaN : x,
					y1: noChange ? NaN : y,
					x2: pastX,
					y2: pastY,
				});
				console.log({
					x1: noChange ? NaN : x,
					y1: noChange ? NaN : y,
					x2: pastX,
					y2: pastY,
				});
			}
			break;
		}
		case 'vertex': {
			socket.emit('build', {
				x,
				y,
				z,
				building: hexgrid
					.getNode(x, y)
					.getVertex(z)
					.classList.contains('citySmall')
					? STRUCTURE.CITY_LARGE
					: STRUCTURE.CITY_SMALL,
			});
			break;
		}
		case 'edge': {
			socket.emit('build', { x, y, z, building: STRUCTURE.ROAD });
			break;
		}
	}
}
function query(x, y, z) {
	socket.emit('ask', { x, y, z });
}

socket.on('ans', (data) => console.log('response', data));
socket.on('sound', (file) => console.log('playsound', file));
socket.on('notify', (message) => console.log('alert', message));
socket.on('rooms', (rooms) => {
	console.log('rooms', rooms);
	socket.emit('join', {
		id: rooms[0],
		name: 'test',
	});

	setTimeout(() => {
		// socket.emit('start');
		// for (let i = 0; i < 3; i++)
		// 	socket.emit('build', {
		// 		x: 2,
		// 		y: 2,
		// 		z: i,
		// 		building: 1,
		// 	});
	}, 100);
});
// socket.on('room')
socket.on('configuration', ({ g, h }) => {
	if (g !== undefined) {
		hexgrid.applyConfiguration(g);
		rollResults.updateLocations();
	}
	if (h !== undefined) {
		configuration.host = h;
		playerDisplay.setHost(h);
	}
});
socket.on('id', (id) => {
	configuration.id = id;
	playerDisplay.setSelf(id);
});
socket.on('playerData', (playerData) => {
	for (const player of playerData) {
		const { p, i, n, t, ql, qb, qa, qc, r, b, c } = player;
		// prettier-ignore
		const [ points, id, name, nextRoll, roll, robber, road, city_small, resources, blueprints, cards ] = [p, i, n, t, ql, qb, qa, qc, r, b, c];
		// prettier-ignore
		playerDisplay.sync({ points, id, name, nextRoll, roll, robber, road, city_small, resources, blueprints, cards });
	}
});
socket.on('left', (id) => playerDisplay.remove(id));
socket.on('gridData', (gridData) => {
	for (const { x, y, z, b, i } of gridData) {
		const [building, playerId] = [b, i];
		hexgrid.sync({ x, y, z, building, playerId });
	}
});
socket.on('gridStatus', ({ x, y, a }) => {
	console.log('gridStatus', { x, y, a });
	const active = a;
	hexgrid.applyStatus(x, y, active);
});
socket.on('roll', (value) => {
	// console.log(value);
	rollResults.processRoll(value);
});
socket.on('time', (time) => {
	playerDisplay.updateTime(time);
});

socket.emit('rooms');

// export { Hexagon, HexagonGrid };
