import { HexagonGrid } from './HexagonGrid.mjs';
import { PlayerDisplay } from './PlayerDisplay.mjs';
import { RollAnimator } from './RollAnimator.mjs';
import { Button } from './HTMLElements.mjs';

const configuration = {
	host: null,
};

const hexagonGrid = new HexagonGrid({
	minWidth: 3,
	maxWidth: 5,
	callbacks: {
		node: (x, y, z) => processInput('node', x, y, z),
		vertex: (x, y, z) => processInput('vertex', x, y, z),
		edge: (x, y, z) => processInput('edge', x, y, z),
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

const buttonStartGame = new Button('Start Game', ['startGame'], () =>
	socket.emit('start'),
);
const buttonRoll = new Button('Roll', ['rollDice'], () => socket.emit('roll'));
document.body.append(buttonStartGame.getElement(), buttonRoll.getElement());

const STRUCTURE = {
	CITY_SMALL: 1,
	CITY_LARGE: 2,
	ROAD: 8,
};
function processInput(type, x, y, z) {
	console.log('processInput', { type, x, y, z });
	switch (type) {
		case 'node': {
			// TODO : robber
			break;
		}
		case 'vertex': {
			socket.emit('build', { x, y, z, building: STRUCTURE.CITY_SMALL });
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
socket.on('gridData', (gridData) => {
	for (const { x, y, z, b, i } of gridData) {
		const [building, playerId] = [b, i];
		hexgrid.sync({ x, y, z, building, playerId });
	}
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
