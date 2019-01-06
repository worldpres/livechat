$(() => {
    let socket = io();
    let ioChat = io('/chat');

    socket.on('online users', (users) => {
        $('#online-users').html(users.map(v => `${v}<i class="material-icons orange-text" onclick="modalPrivMessage('${v}')">chat</i>`).join(', '));
    });

    modalPrivMessage = (to) => {
        $('#modal-message-priv label').html(`Write Your private message to <span>${to}</span>`);
        $('#modal-message-priv').modal({
            onCloseStart: (modal, trigger) => {
                $('#modal-message-priv #modalMessage').val('').focus().blur();
            }
        });
        $('#modal-message-priv').modal('open');
        $('#modal-message-priv #modalMessage').focus();
    }

    $('#modal-message-priv').on('submit', (e) => {
        e.preventDefault();
        let msg = $('#modal-message-priv #modalMessage').val();
        if (/^[^[\]<>]{1,120}$/i.test(msg)) {
            socket.emit('priv message', $('#modal-message-priv label span').text(), msg);
        } else {
            M.toast({
                html: `The message can't be empty, <br>may have max 120 chars <br>and can't contain: [ ] < >`,
                displayLength: 4000,
                inDuration: 100,
                outDuration: 100,
            });
        }
        $('#modal-message-priv').modal('close');
    })

    socket.on('priv message', (name, date, msg, from, feedback = false) => {
        if (!feedback) {
            feedback = 'New private message';
            $('#messages').append($('<li>').html(`<i class="tiny material-icons orange-text">mail</i>${name} <i class="tiny material-icons orange-text">trending_flat</i> ${from} (${date}) : ${msg}`));
            if ($('#autoscroll')[0].checked) $('#messages').animate({
                scrollTop: $('#messages')[0].scrollHeight
            }, 600);
        } else {
            if (feedback == 'yourself') feedback = 'You tried to send message yourself';
            if (feedback == 'regex') feedback = 'Message validation error';
        }
        M.toast({
            html: feedback,
            displayLength: 2000,
            inDuration: 100,
            outDuration: 100,
        });
        playSound(40, 1000, 'square', 0.3, false);
    });

    ioChat.on('existing rooms', (rooms) => {
        $('#existing-rooms-length').text(rooms.length);
        $('#existing-rooms').html(rooms.map(v => `<span onclick="joinToRoom('${v}')">${v}</span>`).join(', '));
    });

    joinToRoom = (room) => {
        $('#my-room').val(room.split('(')[0]).focus();
    }

    ioChat.on('my rooms', (rooms) => {
        $('#my-rooms').html(rooms.map(v => `${v}<span onclick="modalRoomMessage('${v}')"><i class="material-icons green-text">chat</i></span> <span onclick="confirmModal('${v}')"><i class="material-icons red-text">delete_forever</i></span>`).join(', '));
    });

    ioChat.on('nick changed or not', (nick, changed) => {
        if (!changed) {
            M.toast({
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
            $('#messages').html(messages.map(v => `<li><i class="tiny material-icons grey-text">mail</i>${v.name} (${v.date}) : ${v.msg}</li>`).join(''));
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
            M.toast({
                html: `Nickname can't be empty, <br>but can contain (max 10 chars): <br>a-z, ą, ć, ę, ł, ń, ó, ś, ź, ż, 0-9, _, -`,
                displayLength: 2000,
                inDuration: 100,
                outDuration: 100,
            });
        }
        return false;
    });

    $('#message').keyup(() => {
        ioChat.emit('im typing', true);
    });
    $('#message').blur(() => {
        ioChat.emit('im typing', false);
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
            M.toast({
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
            $('#messages').append($('<li>').html(`<i class="tiny material-icons grey-text">mail</i>${name} (${date}) : ${msg}`));
            if ($('#autoscroll')[0].checked) $('#messages').animate({
                scrollTop: $('#messages')[0].scrollHeight
            }, 600);
            $('#message').blur().focus();
            M.toast({
                html: 'New message',
                displayLength: 1000,
                inDuration: 100,
                outDuration: 100,
            });
            playSound(); //time, freq, type, volume
        } else {
            M.toast({
                html: `The message can't be empty, <br>may have max 120 chars <br>and can't contain: [ ] < >`,
                displayLength: 4000,
                inDuration: 100,
                outDuration: 100,
            });
            $('#message').focus();
        }
    });

    $('#join-room').submit((e) => {
        e.preventDefault();
        let room = $('#my-room').val();
        if (/^[a-ząćęłńóśźż0-9_-]{1,10}$/i.test(room)) {
            ioChat.emit('room join', room);
            $('#my-room').val('').focus().blur();
            M.toast({
                html: `You joined to room ${room}`,
                displayLength: 2000,
                inDuration: 100,
                outDuration: 100,
            });
        } else {
            M.toast({
                html: `Room name can't be empty, <br>but can contain (max 10 chars): <br>a-z, ą, ć, ę, ł, ń, ó, ś, ź, ż, 0-9, _, -`,
                displayLength: 2000,
                inDuration: 100,
                outDuration: 100,
            });
        }
        return false;
    });

    confirmModal = (room) => {
        $('#modal-confirm .modal-content').html(`Do you want to leave room <span>${room}</span>?`);
        $('#modal-confirm').modal('open');
    }
    $('#modal-confirm #confirmModal').on('click', () => {
        let room = $('#modal-confirm .modal-content span').text();
        ioChat.emit('leave room', room);
        $('#modal-confirm').modal('close');
        M.toast({
            html: `You leaved room ${room}`,
            displayLength: 2000,
            inDuration: 100,
            outDuration: 100,
        });
    });

    modalRoomMessage = (to) => {
        $('#modal-message-room label').html(`Write Your message to room <span>${to}</span>`);
        $('#modal-message-room').modal({
            onCloseStart: (modal, trigger) => {
                $('#modal-message-room #modalMessage').val('').focus().blur();
            }
        });
        $('#modal-message-room').modal('open');
        $('#modal-message-room #modalMessage').focus();
    }
    $('#modal-message-room').on('submit', (e) => {
        e.preventDefault();
        let msg = $('#modal-message-room #modalMessage').val();
        if (/^[^[\]<>]{1,120}$/i.test(msg)) {
            ioChat.emit('message to room', $('#modal-message-room label span').text(), msg);
        } else {
            M.toast({
                html: `The message can't be empty, <br>may have max 120 chars <br>and can't contain: [ ] < >`,
                displayLength: 4000,
                inDuration: 100,
                outDuration: 100,
            });
        }
        $('#modal-message-room').modal('close');
    })

    ioChat.on('message to room', (name, date, msg, to) => {
        $('#messages').append($('<li>').html(`<i class="tiny material-icons green-text">mail</i>${name} <i class="tiny material-icons green-text">trending_flat</i> ${to} (${date}) : ${msg}`));
        if ($('#autoscroll')[0].checked) $('#messages').animate({
            scrollTop: $('#messages')[0].scrollHeight
        }, 600);
        M.toast({
            html: `New message to ${to} room`,
            displayLength: 2000,
            inDuration: 100,
            outDuration: 100,
        });
        playSound(1000, 3000, 'sawtooth', 0.3, true);
    });
});