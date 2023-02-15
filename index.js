import { GameRoom } from './modules/GameRoom.mjs';

import express from 'express';
import http from 'http';
import fs from 'fs';
import { Server } from 'socket.io';

const app = express();
const reservedCharacters = new RegExp('^[\u0000-\u001F]*$', 'g');

app.use(express.static('./public'));

const server = http.createServer(app);
const io = new Server(server);
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const rooms = {
	kitchen: new GameRoom(io, { name: 'kitchen', persistent: true }),
};

const players = {};

io.on('connection', function (socket) {
	function randomString() {
		return Math.random().toString(36).substring(2);
	}
	var address = socket.handshake.address;

	console.log(' > new connection < ' + address + ' cID: ' + socket.id);
	socket.on('join', ({ id, name }) => {
		if (!players[socket.id]) {
			let room;
			if (id !== '') {
				room = rooms[id];
			} else {
				let x = randomString().substring(0, 4);
				while (x in rooms) x = randomString();
				room = rooms[x] = new GameRoom(io, { name: x });
			}
			name = String(name).replace(reservedCharacters, '') || 'a person';
			players[socket.id] = room;
			room.join(socket, name);
		}
	});
	socket.on('leave', () => {
		const room = players[socket.id];
		if (room) {
			room.leave(socket);
			delete players[socket.id];
		}
		if (room.isEmpty() && !room.persistent) {
			console.log('removing non persistent room <%s>', room.name);
			delete rooms[room.name];
		}
	});
	socket.on('start', () => {
		if (players[socket.id]) players[socket.id].start(socket);
	});
	socket.on('rooms', () => {
		socket.emit('rooms', Object.keys(rooms));
	});
	['ask', 'build', 'roll', 'robber', 'act', 'trade'].forEach((action) => {
		socket.on(action, (data) => {
			if (players[socket.id]) {
				players[socket.id].handleEvent(socket, action, data);
				console.log('EVENT', socket.id, action, data);
			}
		});
	});
	socket.on('disconnect', function (reason) {
		console.log(` < disconnection! [ ${reason} ] cID: ${socket.id}`);
		const room = players[socket.id];
		if (room) {
			room.leave(socket);
			delete players[socket.id];
			if (room.isEmpty() && !room.persistent) {
				console.log('removing non persistent room <%s>', room.name);
				delete rooms[room.name];
			}
		}
	});
});

server.listen(process.env.PORT || 3000, '0.0.0.0', function () {
	console.log(
		'Express server listening on port %d in %s mode',
		this.address().port,
		app.settings.env,
	);
	console.log(
		`Running at ${(1e3 / Math.round(1e3 / config.targetFrameRate)).toFixed(
			2,
		)}FPS`,
	);
});
