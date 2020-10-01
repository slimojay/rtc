const express = require('express');
const app = express();
var http = require('https').createServer(app);
var io = require('socket.io')(http);
//var socket = require('socket.io')(http);
//app.use
app.use(express.static("/"));

io.on('connection', function(socket) {
        console.log('new participant');
        socket.on('create or join', function(room) {
            console.log('create or join ' + room);
            //total participants
            // var myRoom = io.sockets.adapter.rooms[room] || { length: 0 }
            let socketsOfRoom1 = io.sockets.clients(room);
            let numParticipants = socketsOfRoom1.length;
            //var numParticipants = myRoom.length
            console.log(room + ' has a total of ' + numParticipants);
            if (numParticipants === 0) {
                socket.join(room);
                socket.emit('created', room);
            } else {
                socket.emit('full', room);
                console.log('room has reached maximum capacity');
            }

        })


        socket.on('ready', function(room) {
            socket.broadcast.to(room).emit('ready')
        })

        socket.on('candidate', function(evt) {
            socket.broadcast.to(evt.room).emit('candidate', evt);
        })

        socket.on('answer', function(evt) {
            socket.broadcast.to(evt.room).emit('answer', evt.sdp);
        })

    })
    /*
    app.get('', function(req, res) {
        res.sendFile('public/index.html');
    });

    */
http.listen(3000);