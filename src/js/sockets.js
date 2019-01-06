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
        },
        methods: {
            changeNick: function (e) {
                e.preventDefault();
                if (/^[a-ząćęłńóśźż0-9_-]{1,10}$/i.test(this.myNick)) {
                    ioChat.emit('nick change', this.myNick);
                } else {
                    if (this.notify) M.toast({
                        html: `Nickname can't be empty, <br>but can contain (max 10 chars): <br>a-z, ą, ć, ę, ł, ń, ó, ś, ź, ż, 0-9, _, -`,
                        displayLength: 2000
                    });
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

    joinToRoom = (room) => {
        vueAppMain.myRoom = room.split('(')[0];
        $('#my-room').focus();
    }

    confirmModal = (room) => {
        vueAppModalConfirm.content = `Do you want to leave room ${room}?`;
        vueAppModalConfirm.delRoom = room;
        $('#modal-confirm').modal('open');
    }


    socket.on('online users', (users) => {
        vueAppMain.onlineUsers = users.map(v => `${v}<i class="material-icons orange-text" onclick="modalMessage('${v}')">chat</i>`).join(', ');
    });

    socket.on('priv message', (name, date, msg, from, feedback = false) => {
        if (!feedback) {
            feedback = 'New private message';
            $('#messages').append($('<li>').html(`<i class="tiny material-icons orange-text">mail</i> <small>(${date})</small> ${name} <i class="tiny material-icons orange-text">trending_flat</i> ${from} : <em>${msg}</em> <i class="reply tiny material-icons orange-text" onclick="modalMessage('${name}')">reply</i>`));
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
            inDuration: 100,
            outDuration: 100,
        });
        if (vueAppMain.sound) playSound(40, 1000, 'square', 0.3, false);
    });

    ioChat.on('existing rooms', (rooms) => {
        vueAppMain.existingRoomsLength = rooms.length;
        vueAppMain.existingRooms = rooms.map(v => `<span onclick="joinToRoom('${v}')">${v}</span>`).join(', ');
    });

    ioChat.on('my rooms', (rooms) => {
        vueAppMain.myRooms = rooms.map(v => `${v}<span onclick="modalMessage('${v}', true)"><i class="material-icons green-text">chat</i></span> <span onclick="confirmModal('${v}')"><i class="material-icons red-text">delete_forever</i></span>`).join(', ');
    });

    ioChat.on('nick changed or not', (nick, changed) => {
        if (!changed) {
            if (vueAppMain.notify) M.toast({
                html: `Nickname can't be empty, <br>but can contain (max 10 chars): <br>a-z, ą, ć, ę, ł, ń, ó, ś, ź, ż, 0-9, _, -`,
                displayLength: 2000,
                inDuration: 100,
                outDuration: 100,
            });
        }
        $('#my-nick').attr('placeholder', nick).val('').focus().blur();
    });

    ioChat.on('previous messages', (messages) => {
        if (messages.length) {
            $('#messages').html(messages.map(v => `<li><i class="tiny material-icons grey-text">mail</i> <small>(${new Date(v.date).toLocaleString('pl-PL')})</small> ${v.name} : <em>${v.msg}</em></li>`).join(''));
            $('#messages').animate({
                scrollTop: $('#messages')[0].scrollHeight
            }, 600);
        }
    });

    ioChat.on('who is typing', (typers) => {
        if (typers.length) $('#typers').text(`${typers.join(', ')} ${(typers.length > 1) ? 'are' : 'is'} typing...`);
        else $('#typers').text(``);
    });

    ioChat.on('message sent', (name, date, msg, feedback = true) => {
        if (feedback) {
            $('#messages').append($('<li>').html(`<i class="tiny material-icons grey-text">mail</i> <small>(${new Date(date).toLocaleString('pl-PL')})</small> ${name} : <em>${msg}</em>`));
            if (vueAppMain.autoscroll) $('#messages').animate({
                scrollTop: $('#messages')[0].scrollHeight
            }, 600);
            $('#message').blur().focus();
            if (vueAppMain.notify) M.toast({
                html: 'New message',
                displayLength: 1000,
                inDuration: 100,
                outDuration: 100,
            });
            if (vueAppMain.sound) playSound(); //time, freq, type, volume
        } else {
            if (vueAppMain.notify) M.toast({
                html: `The message can't be empty, <br>may have max 120 chars <br>and can't contain: [ ] < >`,
                displayLength: 4000,
                inDuration: 100,
                outDuration: 100,
            });
            $('#message').focus();
        }
    });

    ioChat.on('message to room', (name, date, msg, to) => {
        $('#messages').append($('<li>').html(`<i class="tiny material-icons green-text">mail</i> <small>(${date})</small> ${name} <i class="tiny material-icons green-text">trending_flat</i> ${to} : <em>${msg}</em> <i class="reply tiny material-icons green-text" onclick="modalMessage('${to}', true)">reply_all</i>`));
        if (vueAppMain.autoscroll) $('#messages').animate({
            scrollTop: $('#messages')[0].scrollHeight
        }, 600);
        if (vueAppMain.notify) M.toast({
            html: `New message to ${to} room`,
            displayLength: 2000,
            inDuration: 100,
            outDuration: 100,
        });
        if (vueAppMain.sound) playSound(1000, 3000, 'sawtooth', 0.3, true);
    });
});