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

app.use(express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
	res.sendFile(`index.html`);
});

app.get('/del', (req, res) => {
	MongoClient.connect(url, {
		useNewUrlParser: true,
	}, (err, db) => {
		if (err) throw err;
		let minutes = parseFloat(req._parsedUrl.query);
		let dbo = db.db('livechat');
		let query = {
			date: {
				$lt: new Date().getTime() - minutes * 60 * 1000,
			}
		};
		dbo.collection('messages').find(query).toArray((err, result) => {
			if (err) throw err;
			db.close();
			console.log(`Documents to delete...`);
			console.log(result);
		});
		try {
			dbo.collection('messages').deleteMany(query).then(result => {
				res.send(`<!doctype html><html><head><title>live chat</title><meta charset="utf-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="img/favicon.png"></head><body>Deleted ${result.deletedCount} documents older than ${minutes} minute(s).</body></html>`);
			});
		} catch (e) {
			console.log(e);
		}
	});
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
		if (/^[^[\]<>]{1,120}$/i.test(msg)) {
			let toId = users.find(v => v.name == to).id;
			if (toId != socket.id) {
				let name = users.find(v => v.id == socket.id).name;
				let date = new Date().getTime();
				socket.broadcast.to(toId).emit('priv message', name, date, msg, to);
				socket.emit('priv message', name, date, msg, to);
			} else {
				socket.emit('priv message', '', '', '', '', 'yourself');
			}
		} else {
			socket.emit('priv message', '', '', '', '', 'regex');
		}
	});
});


let ioChat = io.of('/chat');

ioChat.on('connection', (socket) => {
	const id = socket.id.substr(socket.id.indexOf('#') + 1);

	socket.emit('do i know you');

	socket.emit('do you have any rooms?');

	socket.on('i have rooms', (clientRooms) => {
		if(clientRooms){
			clientRooms.split(',').map(room=>{
				if (/^[a-ząćęłńóśźż0-9_-]{1,10}$/i.test(room)) {
					socket.join(room);
					if (users.find(v => v.id == id).rooms.filter(v => v == room).length == 0) {
						users.find(v => v.id == id).rooms.push(room);
					}
				}
			});
			socket.emit('my rooms', users.find(v => v.id == id).rooms);
			ioChat.emit('existing rooms', Object.getOwnPropertyNames(ioChat.adapter.rooms).filter(v => v[0] != '/').map(v => `${v}(${ioChat.adapter.rooms[v].length})`));
		}		
	});

	MongoClient.connect(url, {
		useNewUrlParser: true,
	}, (err, db) => {
		if (err) throw err;
		let dbo = db.db('livechat');
		let query = {};
		dbo.collection('messages').find(query).toArray((err, result) => {
			if (err) throw err;
			db.close();
			socket.emit('previous messages', result);
		});
	});

	socket.on('nick change', (nick) => {
		if(!nick){
			socket.emit('nick changed or not', users.find(v => v.id == id).name, true);
		}else{
			if (/^[a-ząćęłńóśźż0-9_-]{1,20}$/i.test(nick)) {
				users.find(v => v.id == id).name = nick;
				io.emit('online users', users.map(v => v.name));
				socket.emit('nick changed or not', nick, true);
			} else {
				socket.emit('nick changed or not', users.find(v => v.id == id).name, false);
			}
		}
	});

	socket.on('im typing', (typing) => {
		users.find(v => v.id == id).typing = typing;
		ioChat.emit('who is typing', users.filter(v => v.typing).map(v => v.name));
	});

	socket.on('message send', (msg) => {
		if (/^[^[\]<>]{1,120}$/i.test(msg)) {
			let name = users.find(v => v.id == id).name;
			let date = new Date().getTime();
			MongoClient.connect(url, {
				useNewUrlParser: true,
			}, (err, db) => {
				if (err) throw err;
				let dbo = db.db('livechat');
				let query = {
					date: date,
					name: name,
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
		} else {
			ioChat.emit('message sent', '', '', '', false);
		}
	});

	socket.on('message to room', (to, msg) => {
		if (/^[^[\]<>]{1,120}$/i.test(msg) && users.find(v => v.id == id).rooms.filter(v => v == to).length == 1) {
			let name = users.find(v => v.id == id).name;
			let date = new Date().getTime();
			socket.broadcast.to(to).emit('message to room', name, date, msg, to);
			socket.emit('message to room', name, date, msg, to);
		}
	});

	socket.on('room join', (room) => {
		if (/^[a-ząćęłńóśźż0-9_-]{1,10}$/i.test(room)) {
			socket.join(room);
			if (users.find(v => v.id == id).rooms.filter(v => v == room).length == 0) {
				users.find(v => v.id == id).rooms.push(room);
			}
			socket.emit('my rooms', users.find(v => v.id == id).rooms);
			ioChat.emit('existing rooms', Object.getOwnPropertyNames(ioChat.adapter.rooms).filter(v => v[0] != '/').map(v => `${v}(${ioChat.adapter.rooms[v].length})`));
			socket.broadcast.to(room).emit('somebody connected to room', users.find(v => v.id == id).name, room);
		}
	});

	socket.on('leave room', (room) => {
		if (/^[a-ząćęłńóśźż0-9_-]{1,10}$/i.test(room)) {
			socket.leave(room);
			users.find(v => v.id == id).rooms = users.find(v => v.id == id).rooms.filter(v => v != room);
			socket.emit('my rooms', users.find(v => v.id == id).rooms);
			ioChat.emit('existing rooms', Object.getOwnPropertyNames(ioChat.adapter.rooms).filter(v => v[0] != '/').map(v => `${v}(${ioChat.adapter.rooms[v].length})`));
			socket.broadcast.to(room).emit('somebody disconnected from room', users.find(v => v.id == id).name, room);
		}
	});
});