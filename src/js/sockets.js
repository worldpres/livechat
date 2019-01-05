$(() => {
    let socket = io();
    let ioChat = io('/chat');

    socket.on('online users', (users) => {
        $('#online-users').html(users.map(v => `${v}<i class="material-icons red-text" onclick="openModal('${v}')">chat</i>`).join(', '));
    });

    openModal = (to) => {
        $('#modal label').html(`Write Your private message to <span>${to}</span>`);
        $('#modal').modal({
            onCloseStart: (modal, trigger) => {
                $('#modal #modalMessage').val('').focus().blur();
            }
        });
        $('#modal').modal('open');
    }

    $('#modal #sendModalMessage').on('click', () => {
        let msg = $('#modal #modalMessage').val();
        if (/^[^[\]<>]{1,120}$/i.test(msg)) {
            socket.emit('priv message', $('#modal label span').text(), msg);
        } else {
            M.toast({
                html: `The message can't be empty, <br>may have max 120 chars <br>and can't contain: [ ] < >`,
                displayLength: 4000,
                inDuration: 100,
                outDuration: 100,
            });
        }
        $('#modal').modal('close');
    })

    socket.on('priv message', (name, date, msg, from, feedback = false) => {
        if (!feedback) {
            $('#messages').append($('<li>').html(`<i class="tiny material-icons red-text">mail</i>${name} <i class="tiny material-icons red-text">trending_flat</i> ${from} (${date}) : ${msg}`));
            if ($('#autoscroll')[0].checked) $('#messages').animate({
                scrollTop: $('#messages')[0].scrollHeight
            }, 600);
        } else {
            if (feedback == 'yourself') feedback = 'You tried to send message yourself';
            if (feedback == 'regex') feedback = 'Message validation error';
            M.toast({
                html: feedback,
                displayLength: 4000,
                inDuration: 100,
                outDuration: 100,
            });
        }
    });

    ioChat.on('existing rooms', (rooms) => {
        $('#existing-rooms-length').text(rooms.length);
        $('#existing-rooms').html(rooms.map(v => `<span onclick="joinToRoom('${v}')">${v}</span>`).join(', '));
    });

    ioChat.on('my rooms', (rooms) => {
        $('#my-rooms').html(rooms.map(v => `${v}<span onclick="messageToRoom('${v}')"><i class="material-icons green-text">chat</i></span> <span onclick="leaveRoom('${v}')"><i class="material-icons red-text">delete_forever</i></span>`).join(', '));
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
            $('#messages').html(messages.map(v => `<li>${v.name} (${v.date}) : ${v.msg}</li>`).join(''));
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
        }else{
            M.toast({
                html: `Nickname can't be empty, <br>but can contain (max 10 chars): <br>a-z, ą, ć, ę, ł, ń, ó, ś, ź, ż, 0-9, _, -`,
                displayLength: 2000,
                inDuration: 100,
                outDuration: 100,
            });
        }
        return false;
    });













    //join room
    joinToRoom = (room) => {
        $('#my-room').val(room.split('(')[0]).focus();
    }

    $('form#join-room').submit(() => {
        ioChat.emit('room join', $('#my-room').val());
        $('#my-room').val('').focus().blur();
        return false;
    });
    messageToRoom = (to) => {
        ioChat.emit('message to room', to, prompt(`Your message to ${to}...`));
    }
    leaveRoom = (room) => {
        if (confirm(`Do you want to leave room ${room}?`)) ioChat.emit('leave room', room);
    }
    //message to room
    ioChat.on('message to room', (name, date, msg, to) => {
        playSound(1000, 3000, 'sawtooth', 0.3, true);
        $('#modal h4').text(`New message`);
        $('#modal h5').text(`From ${name} (room: ${to})`);
        $('#modal h6').text(`Date: ${date}`);
        $('#modal p').text(`Message: ${msg}`);
        M.Modal.getInstance($('#modal')).open();
    });























    //who is typing
    $('#message').keyup(() => {
        ioChat.emit('im typing', true);
    });
    $('#message').blur(() => {
        ioChat.emit('im typing', false);
    });
    ioChat.on('typers', (typers) => {
        if (typers.length) $('#typers').text(`${typers.join(', ')} ${(typers.length > 1) ? 'are' : 'is'} typing...`);
        else $('#typers').text(``);
    });

    //message send
    $('form#message-send').submit(() => {
        ioChat.emit('message send', $('#message').val());
        $('#message').val('');
        $('form#message-send button').attr('disabled', 'disabled');
        setTimeout(() => {
            $('form#message-send button').removeAttr('disabled');
        }, 2000);
        return false;
    });
    ioChat.on('message sent', (name, date, msg) => {
        $('#messages').append($('<li>').text(`${name} (${date}) : ${msg}`));
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
    });

});