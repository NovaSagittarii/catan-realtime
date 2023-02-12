import { HexagonGrid } from './HexagonGrid.mjs';
import { PlayerDisplay } from './PlayerDisplay.mjs';

const hexagonGrid = new HexagonGrid({
	minWidth: 3,
	maxWidth: 5,
});

const playerDisplay = new PlayerDisplay();

document.body.append(hexagonGrid.getElement(), playerDisplay.getElement());

socket = io({ transports: ['websocket'] });
hexgrid = hexagonGrid;

socket.on('sound', (file) => console.log('playsound', file));
socket.on('notify', (message) => console.log('alert', message));
socket.on('rooms', (rooms) => {
	console.log('rooms', rooms);
	socket.emit('join', {
		id: rooms[0],
		name: 'test',
	});

	setTimeout(() => {
		socket.emit('start');
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
socket.on('configuration', ({ g }) => {
	hexgrid.applyConfiguration(g);
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

socket.emit('rooms');

// export { Hexagon, HexagonGrid };
