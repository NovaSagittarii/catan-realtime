import { HexagonGrid } from './HexagonGrid.mjs';
import { PlayerDisplay } from './PlayerDisplay.mjs';
import { RollAnimator } from './RollAnimator.mjs';
import {
	Button,
	ButtonKeybind,
	SelectModal,
	InputModal,
} from './HTMLElements.mjs';
import { ResourceNames } from './GraphicalConstants.mjs';

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
	choices: ResourceNames,
});
const selectModalCard = new SelectModal({
	title: 'Select a card to use',
	choices: ['Knight', 'Point', 'Monopoly', 'Resources', 'Road construction'],
});
document.body.append(
	new ButtonKeybind(88, 'Play card (x)', ['useCard'], async () => {
		selectModalCard
			.prompt()
			.then((x) => {
				console.log('action', x);
				if (x === 2) {
					selectModalResource
						.prompt()
						.then((y) => {
							socket.emit('act', { card: 2, resource: y });
						})
						.catch(() => console.log('cancelled choose resource'));
				} else {
					socket.emit('act', { card: x });
				}
			})
			.catch(() => console.log('cancelled choose card'));
	}).getElement(),
);
document.body.append(
	new ButtonKeybind(67, 'Trade (c)', ['trade'], async () => {
		try {
			const from = await selectModalResource.prompt({
				title: 'Select a resource to trade',
				choices: ResourceNames.map((x) => '4 ' + x),
			});
			const to = await selectModalResource.prompt({
				title: 'Select a resource to get for 4 ' + ResourceNames[from],
				choices: ResourceNames.map((x) => '1 ' + x),
			});
			console.log('trade %s for %s', from, to);
			socket.emit('trade', { a: from, b: to });
		} catch (e) {
			// console.error(e);
			console.log('trade aborted');
		}
	}).getElement(),
);

const inputModal = new InputModal();

document.body.append(
	selectModalCard.getElement(),
	selectModalResource.getElement(),
	inputModal.getElement(),
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
socket.on('rooms', async (rooms) => {
	console.log('rooms', rooms);
	socket.emit('join', {
		id: rooms[0],
		name: await inputModal.prompt('enter username'),
	});
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
