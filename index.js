const app = require('express')();
const http = require('http').Server(app);
const ip = require('ip');
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

http.listen(port, () => {
	console.log(`listening on ${ip.address()}:${port}`);
});

app.get('/', (req, res) => {
	res.sendFile(__dirname + `/index.html`);
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
});

//chat
let ioChat = io.of('/chat');

ioChat.on('connection', (socket) => {
	const id = socket.id.substr(socket.id.indexOf('#') + 1);

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
});