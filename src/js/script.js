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
        el: '#modalMessage',
        data: {
            label: `123`,
        }
    });

    $('#modalMessage, #my-nick, #message, #my-room').characterCounter();
    $('.modal').modal();
});