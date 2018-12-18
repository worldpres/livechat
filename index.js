var app = require('express')();
var http = require('http').Server(app);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});



var io = require('socket.io')(http);

io.on('connection', function (socket) {
  console.log(`user connected: ${socket.id}`);
  io.emit('user connected', socket.id);
  socket.on('disconnect', function(){
    console.log(`user disconnected:  ${socket.id}`);
    io.emit('user disconnected', socket.id);
  });
  socket.on('chat message', function(msg){
    console.log(`sent message by ${socket.id} : ${msg}`);
    io.emit('chat message', msg);
  });
});


var nsp = io.of('/my-namespace');
nsp.on('connection', function(socket){
  console.log('someone connected to namespace');
  nsp.emit('hi', 'everyone!');
});
