$(() => {

    let socket = io();
    let ioChat = io('/chat');

    vueAppMain = new Vue({
        el: '#vue-app-main',
        data: {
            myNick: ``,
            notify: true,
            sound: true,
            autoscroll: true,
            message: ``,
            messageSendDisabled: false,
            onlineUsers: ``,
            myRoom: ``,
            myRooms: ``,
            existingRoomsLength: 0,
            existingRooms: ``,
            typers: ``,
            messages: ``,
        },
        methods: {
            changeNick: function (e) {
                e.preventDefault();
                if (/^[a-ząćęłńóśźż0-9_-]{1,20}$/i.test(this.myNick)) {
                    ioChat.emit('nick change', this.myNick);
                } else {
                    if (this.notify) M.toast({
                        html: `Nickname can't be empty, <br>but can contain (max 10 chars): <br>a-z, ą, ć, ę, ł, ń, ó, ś, ź, ż, 0-9, _, -`,
                        displayLength: 2000
                    });
                    $('#my-nick').focus();
                }
                return false;
            },
            messageSend: function (e) {
                e.preventDefault();
                if (/^[^[\]<>]{1,120}$/i.test(this.message)) {
                    ioChat.emit('message send', this.message);
                    this.message = ``;
                } else {
                    if (this.notify) M.toast({
                        html: `The message can't be empty, <br>may have max 120 chars <br>and can't contain: [ ] < >`,
                        displayLength: 4000,
                    });
                }
                $('#message').focus();
                this.messageSendDisabled = true;
                setTimeout(() => {
                    this.messageSendDisabled = false;
                }, 2000);
                return false;
            },
            imTyping: function (bool) {
                ioChat.emit('im typing', bool);
            },
            joinRoom: function (e) {
                e.preventDefault();
                if (/^[a-ząćęłńóśźż0-9_-]{1,10}$/i.test(this.myRoom)) {
                    ioChat.emit('room join', this.myRoom);
                    if (this.notify) M.toast({
                        html: `You joined to room ${this.myRoom}`,
                        displayLength: 2000,
                    });
                    this.myRoom = ``;
                    $('#my-room').val(this.myRoom).focus().blur();
                } else {
                    if (this.notify) M.toast({
                        html: `Room name can't be empty, <br>but can contain (max 10 chars): <br>a-z, ą, ć, ę, ł, ń, ó, ś, ź, ż, 0-9, _, -`,
                        displayLength: 2000,
                        inDuration: 100,
                        outDuration: 100,
                    });
                }
                return false;
            }
        }
    });

    vueAppFooter = new Vue({
        el: '#footer',
        data: {
            copyYear: new Date().getFullYear(),
        }
    });

    vueAppModalMessage = new Vue({
        el: '#modal-message',
        data: {
            label: ``,
            message: ``,
            to: ``,
            room: false,
        },
        methods: {
            modalMessageSend: function (e) {
                e.preventDefault();
                if (/^[^[\]<>]{1,120}$/i.test(this.message)) {
                    if (this.room) ioChat.emit('message to room', this.to, this.message);
                    else socket.emit('priv message', this.to, this.message);
                } else {
                    if (vueAppMain.notify) M.toast({
                        html: `The message can't be empty, <br>may have max 120 chars <br>and can't contain: [ ] < >`,
                        displayLength: 4000,
                    });
                }
                $('#modal-message').modal('close');
            }
        }
    });

    vueAppModalConfirm = new Vue({
        el: '#modal-confirm',
        data: {
            content: ``,
            delRoom: ``,
        },
        methods: {
            confirmed: function () {
                ioChat.emit('leave room', this.delRoom);
                $('#modal-confirm').modal('close');
                if (vueAppMain.notify) M.toast({
                    html: `You leaved room ${this.delRoom}`,
                    displayLength: 2000,
                });
            }
        }
    });


    $('#my-nick, #message-send #message, #my-room, #modal-message #message').characterCounter();
    $('.modal').modal();


    modalMessage = (to, room = false) => {
        vueAppModalMessage.label = `Write Your private message to ${to}`;
        vueAppModalMessage.message = ``;
        vueAppModalMessage.to = to;
        vueAppModalMessage.room = room;
        if (room) vueAppModalMessage.label = `Write Your message to room ${to}`;
        $('#modal-message').modal({
            onOpenEnd: (modal) => {
                $(modal).find('#message').val(vueAppModalMessage.message).focus();
            }
        }).modal('open');
    }

    modalConfirm = (room) => {
        vueAppModalConfirm.content = `Do you want to leave room ${room}?`;
        vueAppModalConfirm.delRoom = room;
        $('#modal-confirm').modal('open');
    }

    quickJoinToRoom = (room) => {
        vueAppMain.myRoom = room.split('(')[0];
        $('#my-room').focus();
        $('#my-room ~ .character-counter').text(`${vueAppMain.myRoom.length}/10`);
    }


    socket.on('online users', (users) => {
        vueAppMain.onlineUsers = users.map(v => `${v}<i class="material-icons orange-text" onclick="modalMessage('${v}')">chat</i>`).join(', ');
    });

    socket.on('priv message', (name, date, msg, to, feedback = false) => {
        if (!feedback) {
            feedback = 'New private message';
            vueAppMain.messages += `<li><i class="tiny material-icons orange-text">mail</i> <small>(${new Date(date).toLocaleString('pl-PL')})</small> ${name} <i class="tiny material-icons orange-text">trending_flat</i> ${to} : <em>${msg}</em> <i class="reply tiny material-icons orange-text" onclick="modalMessage('${name}')">reply</i></li>`;
            if (vueAppMain.autoscroll) $('#messages').animate({
                scrollTop: $('#messages')[0].scrollHeight
            }, 600);
        } else {
            if (feedback == 'yourself') feedback = 'You tried to send message yourself';
            if (feedback == 'regex') feedback = 'Message validation error';
        }
        if (vueAppMain.notify) M.toast({
            html: feedback,
            displayLength: 2000,
        });
        if (vueAppMain.sound) playSound(40, 1000, 'square', 0.3, false);
    });

    ioChat.on('do i know you', () => {
        ioChat.emit('nick change', (localStorage.myNick)?localStorage.myNick:false);
    });

    ioChat.on('do you have any rooms?', () => {
        ioChat.emit('i have rooms', (localStorage.myRooms)?localStorage.myRooms:false);
    });

    ioChat.on('existing rooms', (rooms) => {
        vueAppMain.existingRoomsLength = rooms.length;
        vueAppMain.existingRooms = rooms.map(v => `<span onclick="quickJoinToRoom('${v}')">${v}</span>`).join(', ');
    });

    ioChat.on('my rooms', (rooms) => {
        vueAppMain.myRooms = rooms.map(v => `${v}<span onclick="modalMessage('${v}', true)"><i class="material-icons green-text">chat</i></span> <span onclick="modalConfirm('${v}')"><i class="material-icons red-text">delete_forever</i></span>`).join(', ');
        localStorage.myRooms = rooms;
    });

    ioChat.on('nick changed or not', (nick, changed) => {
        if (changed) feedback = `Welcome ${nick}`;
        else feedback = `Nickname can't be empty, <br>but can contain (max 10 chars): <br>a-z, ą, ć, ę, ł, ń, ó, ś, ź, ż, 0-9, _, -`;
        if (vueAppMain.notify) M.toast({
            html: feedback,
            displayLength: 2000,
        });
        vueAppMain.myNick = nick;
        localStorage.myNick = nick;
        $('#my-nick ~ .character-counter').text(`${nick.length}/20`);
    });

    ioChat.on('previous messages', (messages) => {
        if (messages.length) {
            vueAppMain.messages = messages.map(v => `<li><i class="tiny material-icons grey-text">mail</i> <small>(${new Date(v.date).toLocaleString('pl-PL')})</small> ${v.name} : <em>${v.msg}</em></li>`).join('');
            setTimeout(()=>{
                if (vueAppMain.autoscroll) $('#messages').animate({
                    scrollTop: $('#messages')[0].scrollHeight
                }, 600);
            }, 10);
        }
    });

    ioChat.on('who is typing', (typers) => {
        vueAppMain.typers = (typers.length)?`${typers.join(', ')} ${(typers.length > 1) ? 'are' : 'is'} typing...`:``;
    });

    ioChat.on('message sent', (name, date, msg, feedback = true) => {
        if (feedback) {
            vueAppMain.messages += `<li><i class="tiny material-icons grey-text">mail</i> <small>(${new Date(date).toLocaleString('pl-PL')})</small> ${name} : <em>${msg}</em></li>`;
            if (vueAppMain.autoscroll) $('#messages').animate({
                scrollTop: $('#messages')[0].scrollHeight
            }, 600);
            $('#message').blur().focus();
            feedback = `New message`;
            if (vueAppMain.sound) playSound(); //time, freq, type, volume
        } else {
            feedback = `The message can't be empty, <br>may have max 120 chars <br>and can't contain: [ ] < >`;
            $('#message').focus();
        }
        if (vueAppMain.notify) M.toast({
            html: feedback,
            displayLength: 2000,
        });
    });

    ioChat.on('message to room', (name, date, msg, to) => {
        vueAppMain.messages += `<li><i class="tiny material-icons green-text">mail</i> <small>(${new Date(date).toLocaleString('pl-PL')})</small> ${name} <i class="tiny material-icons green-text">trending_flat</i> ${to} : <em>${msg}</em> <i class="reply tiny material-icons green-text" onclick="modalMessage('${to}', true)">reply_all</i></li>`;
        if (vueAppMain.autoscroll) $('#messages').animate({
            scrollTop: $('#messages')[0].scrollHeight
        }, 600);
        if (vueAppMain.notify) M.toast({
            html: `New message to ${to} room`,
            displayLength: 2000,
        });
        if (vueAppMain.sound) playSound(1000, 3000, 'sawtooth', 0.3, true);
    });

    ioChat.on('somebody connected to room', (somebody, room) => {
        if (vueAppMain.notify) M.toast({
            html: `${somebody} connected to room ${room}`,
            displayLength: 2000,
        });
    });

    ioChat.on('somebody disconnected from room', (somebody, room) => {
        if (vueAppMain.notify) M.toast({
            html: `${somebody} disconnected from room ${room}`,
            displayLength: 2000,
        });
    });
});