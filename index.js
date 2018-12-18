var app = require('express')();
var http = require('http').Server(app);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

let port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('listening on *:3000');
});


var nicknames = {};

var io = require('socket.io')(http);
io.on('connection', function (socket) {
  console.log(`user connected: ${socket.id}`);
  nicknames[socket.id] = socket.id;
  io.emit('user connected', socket.id);
  io.emit('who is online', nicknames);
  socket.on('disconnect', function(){
    console.log(`user disconnected:  ${socket.id}`);
    delete nicknames[socket.id];
    io.emit('user disconnected', socket.id);
    io.emit('who is online', nicknames);
  });
  socket.on('chat message', function(msg){
    console.log(`sent message by ${socket.id} (${nicknames[socket.id]}) : ${msg}`);
    io.emit('chat message', [nicknames[socket.id], msg]);
  });
});


var nsp = io.of('/chat');
nsp.on('connection', function(socket){
  console.log('someone connected to chat');
  nsp.emit('hi', 'You are connected to chat successfully!');
  socket.on('nick change', function(nick){
    let id = socket.id.substr(socket.id.indexOf('#')+1);
    nicknames[id] = nick;
    console.log(nicknames);
    console.log(`user ${socket.id} changed nick: ${nick}`);
    nsp.emit('who is online', nicknames);
  });
});
