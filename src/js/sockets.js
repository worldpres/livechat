$(() => {

    let socket = io();
    let ioChat = io('/chat');

    vueAppMain = new Vue({
        el: '#vue-app-main',
        data: {
            onlineUsers: ``,
            notify: true,
            sound: true,
            autoscroll: true,
            existingRoomsLength: 0,
            existingRooms: ``,
            myRoom: ``,
            myRooms: ``,
        },
        methods: {
            joinRoom: function (e) {
                e.preventDefault();
                if (/^[a-ząćęłńóśźż0-9_-]{1,10}$/i.test(this.myRoom)) {
                    ioChat.emit('room join', this.myRoom);
                    this.myRoom = ``;
                    $('#my-room').val('').focus().blur();
                    if (this.notify) M.toast({
                        html: `You joined to room ${this.myRoom}`,
                        displayLength: 2000,
                        inDuration: 100,
                        outDuration: 100,
                    });
                } else {
                    if (this.notify) M.toast({
                        html: `Room name can't be empty, <br>but can contain (max 10 chars): <br>a-z, ą, ć, ę, ł, ń, ó, ś, ź, ż, 0-9, _, -`,
                        displayLength: 2000,
                        inDuration: 100,
                        outDuration: 100,
                    });
                }
                return false;
            },
            imTyping: function (bool) {
                ioChat.emit('im typing', bool);
            }
        }
    });

    vueAppFooter = new Vue({
        el: '#footer',
        data: {
            copyYear: new Date().getFullYear(),
        }
    });

    vueAppModal = new Vue({
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
                        inDuration: 100,
                        outDuration: 100,
                    });
                }
                $('#modal-message').modal('close');
            }
        }
    });

    vueAppConfirm = new Vue({
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
                    inDuration: 100,
                    outDuration: 100,
                });
            }
        }
    });


    $('#modal-message #message, #my-nick, #message-send #message, #my-room').characterCounter();
    $('.modal').modal();


    modalMessage = (to, room = false) => {
        vueAppModal.label = `Write Your private message to ${to}`;
        vueAppModal.message = ``;
        vueAppModal.to = to;
        vueAppModal.room = room;
        if (room) vueAppModal.label = `Write Your message to room ${to}`;
        $('#modal-message').modal({
            onOpenEnd: (modal) => {
                $(modal).find('#message').val(vueAppModal.message).focus();
            }
        }).modal('open');
    }

    joinToRoom = (room) => {
        vueAppMain.myRoom = room.split('(')[0];
        $('#my-room').focus();
    }

    confirmModal = (room) => {
        vueAppConfirm.content = `Do you want to leave room ${room}?`;
        vueAppConfirm.delRoom = room;
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

    $('#nick-change').submit((e) => {
        e.preventDefault();
        let nick = $('#my-nick').val();
        if (/^[a-ząćęłńóśźż0-9_-]{1,10}$/i.test(nick)) {
            ioChat.emit('nick change', nick);
        } else {
            if (vueAppMain.notify) M.toast({
                html: `Nickname can't be empty, <br>but can contain (max 10 chars): <br>a-z, ą, ć, ę, ł, ń, ó, ś, ź, ż, 0-9, _, -`,
                displayLength: 2000,
                inDuration: 100,
                outDuration: 100,
            });
        }
        return false;
    });

    ioChat.on('who is typing', (typers) => {
        if (typers.length) $('#typers').text(`${typers.join(', ')} ${(typers.length > 1) ? 'are' : 'is'} typing...`);
        else $('#typers').text(``);
    });

    $('#message-send').submit((e) => {
        e.preventDefault();
        let msg = $('#message').val();
        if (/^[^[\]<>]{1,120}$/i.test(msg)) {
            ioChat.emit('message send', msg);
            $('#message').val('');
        } else {
            if (vueAppMain.notify) M.toast({
                html: `The message can't be empty, <br>may have max 120 chars <br>and can't contain: [ ] < >`,
                displayLength: 4000,
                inDuration: 100,
                outDuration: 100,
            });
            $('#message').focus();
        }
        $('#message-send button').attr('disabled', 'disabled');
        setTimeout(() => {
            $('#message-send button').removeAttr('disabled');
        }, 2000);
        return false;
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