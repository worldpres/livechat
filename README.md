# Live Chat

**FRONT**: *HTML* + *CSS* + *Javascript/jQuery*
**BACK**: *NodeJS* + *Socket.IO* + *AudioContext*

## TODO
- ikony wyslania priv/simple message
- wychodzenie z pokoju,
- szybkie wbicie do pokoju,
- liczebnosc w pokojach
- sprawdzenie czy wyslamy do dobrego pokoju - właściwosc rooms usera

### About WebSocket

WebSocket jest technologią zapewniającą dwukierunkowy kanał komunikacji za pośrednictwem jednego gniazda TCP. Stworzono ją do komunikacji przeglądarki internetowej z serwerem internetowym, ale równie dobrze może zostać użyta w innych aplikacjach typu klient lub serwer. Specyfikacja WebSocket definiuje dwa nowe URI, ws: i wss:, dla nieszyfrowanych i szyfrowanych połączeń.

------------

#### Cheat sheet

```javascript
// sending to sender-client only
socket.emit('message', "this is a test");

// sending to all clients, include sender
io.emit('message', "this is a test");

// sending to all clients except sender
socket.broadcast.emit('message', "this is a test");

// sending to all clients in 'game' room(channel) except sender
socket.broadcast.to('game').emit('message', 'nice game');

// sending to all clients in 'game' room(channel), include sender
io.in('game').emit('message', 'cool game');

// sending to sender client, only if they are in 'game' room(channel)
socket.to('game').emit('message', 'enjoy the game');

// sending to all clients in namespace 'myNamespace', include sender
io.of('myNamespace').emit('message', 'gg');

// sending to individual socketid
socket.broadcast.to(socketid).emit('message', 'for your eyes only');
```
