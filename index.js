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
		namespace: `chat`,
		room: ``,
	});
	io.emit('online users', users.map(v => v.name));
	// console.log(`user connected: ${socket.id}`);
	// console.log(`users table:`, users);

	socket.on('disconnect', () => {
		users = users.filter(v => v.id != socket.id);
		io.emit('online users', users.map(v => v.name));
		// console.log(`user disconnected:  ${socket.id}`);
		// console.log(`users table:`, users);
	});
});


/*
socket.on('chat message', function (msg) {
  console.log(`sent message by ${socket.id} (${users[socket.id]}) : ${msg}`);
  let date = new Date().toLocaleString('pl-PL');
  io.emit('chat message', [users[socket.id], date, msg]);
});
//priv
socket.on('send priv', function (receive) {
  console.log('Odebrałem: ', receive);
  let id = socket.id.substr(socket.id.indexOf('#') + 1);
  console.log('Od: ', id);
  io.to(receive[0]).emit('receive priv', [id, receive[1]]);
});
*/

var writers = [];


let ioChat = io.of('/chat');

ioChat.on('connection', (socket) => {
	let id = socket.id.substr(socket.id.indexOf('#') + 1);

	function roomChange(roomName) {
		if (/^[a-zA-Z0-9_-]+$/.test(roomName) || roomName == '') {
			socket.join(roomName);
			users.find(v => v.id == id).room = roomName;
			ioChat.to(roomName).emit('welcome to chat', (roomName != '') ? `You are connected to chat: ${roomName}!` : `Bye!`);
			// console.log(`user ${id} changed /chat room: ${roomName}`);
		}
	}

	socket.on('chat join', (room) => {
		roomChange(room);
	});

	socket.on('nick change', function (nick) {
		if (/^[a-zA-Z0-9_-]+$/.test(nick)) {
			users.find(v => v.id == id).name = nick;
			io.emit('online users', users.map(v => v.name));
			io.to(id).emit('nick changed or not', users.find(v => v.id == id).name, true);
			// console.log(`user ${socket.id} changed nick to: ${nick}`);
			// console.log(`users table:`, users);
		}else{
			io.to(id).emit('nick changed or not', users.find(v => v.id == id).name, false);
		}
	});




	socket.on('im writing', function (write) {
		let id = socket.id.substr(socket.id.indexOf('#') + 1);
		if (write) {
			if (writers.indexOf(id) == -1) writers.push(id);
		}
		if (!write) {
			if (writers.indexOf(id) != -1) writers.splice(writers.indexOf(id), 1);
		}
		console.log(writers.map(v => users[v]));
		// console.log(`user ${socket.id} write something: ${write}`);
		ioChat.emit('writers', writers.map(v => users[v]));
	});

});
