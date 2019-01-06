$(() => {
    vueAppFooter = new Vue({
        el: '#footer',
        data: {
            copyYear: new Date().getFullYear(),
        }
    });

    vueAppMain = new Vue({
        el: '#vue-app-main',
        data: {
            onlineUsers: ``,
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

    $('#modalMessage, #my-nick, #message, #my-room').characterCounter();
    $('.modal').modal();
});