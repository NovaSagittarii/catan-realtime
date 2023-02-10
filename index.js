const express = require('express');
const app = express();
const http = require('http');
const fs = require('fs');
const reservedCharacters = new RegExp('^[\u0000-\u001F]*$', 'g');

app.use(express.static('./public'));

const server = http.createServer(app);
const io = require('socket.io')(server);
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

io.on('connection', function (socket) {
	var address = socket.handshake.address;

	console.log(' > new connection < ' + address + ' cID: ' + socket.id);
	socket.on('ping', () => {
		console.log('pinged');
	});
	socket.on('disconnect', function (reason) {
		console.log(` < disconnection! [ ${reason} ] cID: ${socket.id}`);
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