const express = require('express');
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
//var socket = require('socket.io')(http);
//app.use

app.use(express.static(__dirname + "/public"));
io.on('connection', function(socket) {
        console.log('new participants');
        socket.on('create or join', function(room) {
            console.log('create or join ' + room);
            //total participants
            // var myRoom = io.socket.adapter.rooms[room] || { length: 0 }
            //var numParticipants = myRoom.length

            io.of('/').in(room).clients(function(error, clients) {
                var numClients = clients.length;
                var numParticipants = numClients;
                for (var i = 0; i < clients.count; i++) {
                    console.log(clients[i] + '\n')
                }

                console.log(room + ' has a total of ' + numParticipants + ' participants');
                if (numParticipants < 3) {
                    socket.join(room);
                    socket.emit('created', room);
                } else {
                    socket.emit('full', room);
                    console.log('room has reached maximum capacity');
                }

            })
        });


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