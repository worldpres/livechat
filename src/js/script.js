$(() => {
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
        }
    });

    vueAppMain = new Vue({
        el: '#vue-app-main',
        data: {
            onlineUsers: ``,
            notify: true,
            sound: true,
            autoscroll: true,
        },
        // methods: {
        //     switchSound: (s) => {
        //         this.sound = s;
        //         console.log(s);
        //     }
        // }
    });

    $('#modal-message #message, #my-nick, #message-send #message, #my-room').characterCounter();
    $('.modal').modal();
});