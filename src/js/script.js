$(() => {
    $('#modalMessage, #my-nick, #message, #my-room').characterCounter();
    $('.modal').modal();

    vueAppMain = new Vue({
        el: '#vue-app-main',
        data: {
            onlineUsers: ``,
        }
    })
});