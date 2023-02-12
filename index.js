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
	kitchen: new GameRoom(io),
};

const players = {};

io.on('connection', function (socket) {
	var address = socket.handshake.address;

	console.log(' > new connection < ' + address + ' cID: ' + socket.id);
	socket.on('join', ({ id, name }) => {
		const room = rooms[id];
		name = name.replace(reservedCharacters, '');
		if (!players[socket.id] && room && name) {
			players[socket.id] = rooms[id];
			room.join(socket, name);
		}
	});
	socket.on('leave', () => {
		const room = players[socket.id];
		if (room) {
			room.leave(socket);
			delete players[socket.id];
		}
	});
	socket.on('start', () => {
		if (players[socket.id]) players[socket.id].start(socket);
	});
	socket.on('rooms', () => {
		socket.emit('rooms', Object.keys(rooms));
	});
	['build', 'roll', 'robber', 'act'].forEach((action) => {
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
