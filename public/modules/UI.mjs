import { Hexagon } from './Hexagon.mjs';
import { HexagonGrid } from './HexagonGrid.mjs';

const hexagonGrid = new HexagonGrid({
	minWidth: 3,
	maxWidth: 5,
});
document.body.append(hexagonGrid.getElement());

socket = io({ transports: ['websocket'] });
hexgrid = hexagonGrid;

socket.on('sound', (file) => console.log('playsound', file));
socket.on('notify', (message) => console.log('alert', message));
socket.on('rooms', (rooms) => {
	console.log('rooms', rooms);
	socket.emit('join', rooms[0]);
	
	setTimeout(() => {
		socket.emit('start');
		for(let i = 0; i < 3; i ++) socket.emit('build', {
			x:2,
			y:2,
			z:i,
			building:1
		});
	}, 100);
});
// socket.on('room')
socket.on('configuration', ({ g }) => {
	hexgrid.applyConfiguration(g);
});

socket.emit('rooms');

// export { Hexagon, HexagonGrid };
