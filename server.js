const express = require('express');
const app = express();
const http = require('http').Server(app);
const ip = require('ip');
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://livechat10:livechat10@ds149754.mlab.com:49754/livechat';

http.listen(port, () => {
	console.log(`listening on ${ip.address()}:${port}`);
});

app.use(express.static(__dirname + '/src'));

app.get('/', (req, res) => {
	res.sendFile(`index.html`);
});

let users = [];

io.on('connection', (socket) => {
	users.push({
		id: socket.id,
		name: `guest${new Date().getTime()}`,
		typing: false,
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
	socket.emit('existing rooms', Object.getOwnPropertyNames(ioChat.adapter.rooms).filter(v => v[0] != '/').map(v => `${v}(${ioChat.adapter.rooms[v].length})`));

	// existing my rooms
	socket.emit('my rooms', users.find(v => v.id == id).rooms);

	//show nickname into placeholder by emit to sender-client only
	socket.emit('nick changed or not', users.find(v => v.id == id).name, true);

	//show previous messages
	MongoClient.connect(url, {
		useNewUrlParser: true,
	}, (err, db) => {
		if (err) throw err;
		var dbo = db.db('livechat');
		var query = {};
		dbo.collection('messages').find(query).toArray((err, result) => {
			if (err) throw err;
			db.close();
			socket.emit('previous messages', result);
		});
	});

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
			MongoClient.connect(url, {
				useNewUrlParser: true,
			}, (err, db) => {
				if (err) throw err;
				var dbo = db.db('livechat');
				var query = {
					name: name,
					date: date,
					msg: msg
				};
				try {
					dbo.collection('messages').insertOne(query);
					db.close();
				} catch (e) {
					console.log(e);
				};
			});
			ioChat.emit('message sent', name, date, msg);
		}
	});

	//room join
	socket.on('room join', (room) => {
		if (room != '') {
			socket.join(room);
			if (users.find(v => v.id == id).rooms.filter(v => v == room).length == 0) {
				users.find(v => v.id == id).rooms.push(room);
			}
			socket.emit('my rooms', users.find(v => v.id == id).rooms);
			// existing rooms into namespace
			ioChat.emit('existing rooms', Object.getOwnPropertyNames(ioChat.adapter.rooms).filter(v => v[0] != '/').map(v => `${v}(${ioChat.adapter.rooms[v].length})`));
		}
	});

	//leave room
	socket.on('leave room', (room) => {
		if (room != '') {
			socket.leave(room);
			users.find(v => v.id == id).rooms = users.find(v => v.id == id).rooms.filter(v => v != room);
			socket.emit('my rooms', users.find(v => v.id == id).rooms);
			// existing rooms into namespace
			ioChat.emit('existing rooms', Object.getOwnPropertyNames(ioChat.adapter.rooms).filter(v => v[0] != '/').map(v => `${v}(${ioChat.adapter.rooms[v].length})`));
		}
	});

	//message to room
	socket.on('message to room', (to, msg) => {
		if (msg != '' && msg != null && users.find(v => v.id == id).rooms.filter(v => v == to).length == 1) {
			let name = users.find(v => v.id == id).name;
			let date = new Date().toLocaleString('pl-PL');
			socket.broadcast.to(to).emit('message to room', name, date, msg, to);
		}
	});
});