const io = require('socket.io-client');

const socket = io('http://192.168.0.37:3000');

socket.on('connect', () => {
    console.log('Conectado');
});

socket.on('disconnect', () => {
    console.log('Desconectado');
});

socket.on('error' , (err) => {
    console.log(`Erro ==> : ${err}`);
});
