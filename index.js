const express = require('express');
const app = express(); //because of correct css path
const http = require('http').Server(app);
const ip = require('ip');
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

http.listen(port, () => {
	console.log(`listening on ${ip.address()}:${port}`);
});

app.use(express.static(__dirname + '/')); //because of correct css path

app.get('/', (req, res) => {
	res.sendFile(`index.html`);
});

let users = [];

io.on('connection', (socket) => {
	users.push({
		id: socket.id,
		name: `guest${new Date().getTime()}`,
		typing: false,
		waiting: false,
		rooms: [],
	});
	io.emit('online users', users.map(v => v.name));

	socket.on('disconnect', () => {
		users = users.filter(v => v.id != socket.id);
		io.emit('online users', users.map(v => v.name));
	});

	socket.on('priv message', (to, msg) => {
		if (msg != '' && msg != null) {
			let toId = users.find(v => v.name == to).id;
			let name = users.find(v => v.id == socket.id).name;
			let date = new Date().toLocaleString('pl-PL');
			socket.broadcast.to(toId).emit('priv message', name, date, msg);
		}
	});
});

//chat
let ioChat = io.of('/chat');

ioChat.on('connection', (socket) => {
	const id = socket.id.substr(socket.id.indexOf('#') + 1);

	// existing rooms into namespace
	socket.emit('existing rooms', Object.getOwnPropertyNames(ioChat.adapter.rooms).filter(v => v[0] != '/'));

	//show nickname into placeholder by emit to sender-client only
	socket.emit('nick changed or not', users.find(v => v.id == id).name, true);

	//change my nick
	socket.on('nick change', (nick) => {
		if (/^[a-zA-Z0-9_-]+$/.test(nick)) {
			users.find(v => v.id == id).name = nick;
			io.emit('online users', users.map(v => v.name));
			socket.emit('nick changed or not', nick, true);
		} else {
			//show nickname into placeholder by emit to sender-client only
			socket.emit('nick changed or not', users.find(v => v.id == id).name, false);
		}
	});

	//who is typing
	socket.on('im typing', (typing) => {
		users.find(v => v.id == id).typing = typing;
		ioChat.emit('typers', users.filter(v => v.typing).map(v => v.name));
	});

	//send message
	socket.on('message send', (msg) => {
		if (msg != '') {
			let name = users.find(v => v.id == id).name;
			let date = new Date().toLocaleString('pl-PL');
			ioChat.emit('message sent', name, date, msg);
		}
	});

	//room join
	socket.on('room join', (room) => {
		if (room != '') {
			socket.join(room);
			users.find(v => v.id == id).rooms.push(room);
			socket.emit('my rooms', users.find(v => v.id == id).rooms);
			// existing rooms into namespace
			ioChat.emit('existing rooms', Object.getOwnPropertyNames(ioChat.adapter.rooms).filter(v => v[0] != '/'));
		}
	});

	//simple message
	socket.on('simple message', (to, msg) => {
		if (msg != '' && msg != null) {
			let name = users.find(v => v.id == id).name;
			let date = new Date().toLocaleString('pl-PL');
			socket.broadcast.to(to).emit('simple message', name, date, msg, to);
		}
	});
});