# Live Chat

**Live Chat** for quick sending messages

## How to run?

1. Get in directory
2. Install Node.js
3. Type `npm i` to install packages
4. Type `nodemon` or `node server.js` to run
5. Open `http://localhost:3000`
6. Ready to use

## FRONTEND

- *HTML*,
- *CSS*,
- *Javascript/jQuery*,
- *MaterializeCSS*,
- *Vue.js*,
- *Web Audio API*

## BACKEND

- *NodeJS*,
- *Express.js*,
- *Socket.IO*,
- *MongoDB*

### About app

Aplikacja pod adresem https://presu.herokuapp.com/ pozwala na wymianę informacji w czasie rzeczywistym. Każdemu użytkownikowi zostaje przydzielona nazwa (nick), który może być przez niego zmieniony. W aplikacji poza wysyłaniem wiadomości widzianych przez wszystkich użytkowników można też wysyłać wiadomości prywatne skierowane do konkretnego użytkownika. Ponadto istnieje możliwość tworzenia własnych pokoi rozmów lub dołączania do już istniejących. W łatwy sposób możemy kontrolować czy chcemy otrzymywać powiadomienia o akcjach podejmowanych w aplikacji. Kontrolki obejmują sterowanie dźwiękami, powiadomieniami oraz automatycznym przewijaniem do najnowszych wiadomości.

#### About Node.js

Środowisko uruchomieniowe zaprojektowane do tworzenia wysoce skalowalnych aplikacji internetowych, szczególnie serwerów www napisanych w języku JavaScript. Umożliwia tworzenie aplikacji sterowanych zdarzeniami wykorzystujących asynchroniczny system wejścia-wyjścia.

#### About Express

Express.js, or simply Express, is a web application framework for Node.js, released as free and open-source software under the MIT License. It is designed for building web applications and APIs. It has been called the de facto standard server framework for Node.js.

#### About Socket.IO

Socket.IO is a library that enables real-time, bidirectional and event-based communication between the browser and the server. It consists of:
- a Node.js server,
- a Javascript client library for the browser (which can be also run from Node.js).

#### MongoDB

MongoDB – otwarty, nierelacyjny system zarządzania bazą danych napisany w języku C++. Charakteryzuje się dużą skalowalnością, wydajnością oraz brakiem ściśle zdefiniowanej struktury obsługiwanych baz danych. Zamiast tego dane składowane są jako dokumenty w stylu JSON, co umożliwia aplikacjom bardziej naturalne ich przetwarzanie, przy zachowaniu możliwości tworzenia hierarchii oraz indeksowania.

#### About HTML

HTML (ang. HyperText Markup Language) – hipertekstowy język znaczników, wykorzystywany do tworzenia dokumentów hipertekstowych.

#### About CSS

Kaskadowe arkusze stylów (ang. Cascading Style Sheets, w skrócie CSS) – język służący do opisu formy prezentacji (wyświetlania) stron WWW.

#### About Javascript/jQuery

JavaScript (krócej JS) – skryptowy język programowania, stworzony przez firmę Netscape, najczęściej stosowany na stronach internetowych.

jQuery – lekka biblioteka programistyczna dla języka JavaScript, ułatwiająca korzystanie z JavaScriptu (w tym manipulację drzewem DOM). Kosztem niewielkiego spadku wydajności w stosunku do profesjonalnie napisanego kodu w niewspomaganym JavaScripcie pozwala osiągnąć interesujące efekty animacji, dodać dynamiczne zmiany strony, wykonać zapytania AJAX. Większość wtyczek i skryptów opartych na jQuery działa na stronach nie wymagając zmian w kodzie HTML.

#### About MaterializeCSS

A modern responsive front-end framework based on Material Design.

#### About Vue.js

Vue.js is an open-source JavaScript framework for building user interfaces and single-page applications.

#### About Web Audio API

Web Audio API lets us make sound right in the browser. It makes your sites, apps, and games more fun and engaging.

------------

##### Cheat sheet

```javascript
socket.emit('message', "this is a test"); // sending to sender-client only
io.emit('message', "this is a test"); // sending to all clients, include sender
socket.broadcast.emit('message', "this is a test"); // sending to all clients except sender
socket.broadcast.to('game').emit('message', 'nice game'); // sending to all clients in 'game' room(channel) except sender
io.in('game').emit('message', 'cool game'); // sending to all clients in 'game' room(channel), include sender
socket.to('game').emit('message', 'enjoy the game'); // sending to sender client, only if they are in 'game' room(channel)
io.of('myNamespace').emit('message', 'gg'); // sending to all clients in namespace 'myNamespace', include sender
socket.broadcast.to(socketid).emit('message', 'for your eyes only'); // sending to individual socketid
```
