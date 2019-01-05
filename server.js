const express = require('express');
const app = express(); //because of correct css path
const http = require('http').Server(app);
const ip = require('ip');
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

http.listen(port, () => {
	console.log(`listening on ${ip.address()}:${port}`);
});

app.use(express.static(__dirname + '/src')); //because of correct css path

app.get('/', (req, res) => {
	res.sendFile(`index.html`);
});

/*
const express = require('express');
const app = express();

app.listen(3000, function() {
  console.log('ok')
})

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://test123:test123@ds115094.mlab.com:15094/mongotest';

app.get('/', (req, res) => {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db('mongotest');
    var query = { };
    dbo.collection('kolekcja').find(query).toArray(function(err, result) {
      if (err) throw err;
      db.close();
      console.log('API: all documents readed');
      res.send(result);
    });
  });
});
*/

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
let messages = [];

ioChat.on('connection', (socket) => {
	const id = socket.id.substr(socket.id.indexOf('#') + 1);

	// existing rooms into namespace
	socket.emit('existing rooms', Object.getOwnPropertyNames(ioChat.adapter.rooms).filter(v => v[0] != '/').map(v => `${v}(${ioChat.adapter.rooms[v].length})`));

	// existing my rooms
	socket.emit('my rooms', users.find(v => v.id == id).rooms);

	//show nickname into placeholder by emit to sender-client only
	socket.emit('nick changed or not', users.find(v => v.id == id).name, true);

	//show previous messages
	socket.emit('previous messages', messages);

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
			messages.push({
				name: name,
				date: date,
				msg: msg
			});
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