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
        el: '#modal',
        data: {
            label: ``,
            message: ``,
            to: ``,
        }
    });

    $('#modalMessage, #my-nick, #message, #my-room').characterCounter();
    $('.modal').modal();
});