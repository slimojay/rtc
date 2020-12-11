const express = require('express');
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const path = require('path');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var flash = require('express-flash');
const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;
// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 
//form-urlencoded

// for parsing multipart/form-data
app.use(upload.array()); 


app.use(express.static(__dirname + "/public"));
app.set('view engine', 'jade');
app.set('views', './views');
var cookieParser = require('cookie-parser');
var session = require('express-session');
//app.use(express-validator());
const body = require('express-validator');
app.use(session({ 
    secret: '123456cat11klhhkl',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 12000 }
}))
app.use(flash())

/*app.get('/', function(req, res){
    const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
   res.sendFile(path.join(__dirname + '/public/index.html'));
 
});
//*/

var rooM;
var you;
var numberOfClients;
var users ;
var usersjson
var usersjson2
var pushname = [];
var numVal;
var division = 1;

var con = mysql.createConnection({
  host: "localhost",
  user: "remotecourt_user",
  password: "TraceCourt@@",
  database : "remotecourt_court"
});

 app.get('/:session_id?', function(req, res){
	 var val;
	 if (req.params.session_id){
		 val = req.params.session_id;
	 }else{
		 val = 'empty'
	 }
   res.render('index', {session_id : val})
});

app.post('/', function(req, res){
	    var room_no = req.body.room;
    var password = req.body.password;
   var name = req.body.name;
			var room = req.body.room;
			var interest = req.body.interest;
			req.session.name = name; 
	req.session.room = room;
	req.session.interest = interest;
        con.query('SELECT * FROM sessions WHERE session_id = ? AND session_pw = ?', [room_no, password], function(err, rows, fields) {
			
            if(err) {
				
				throw err
			}
             
            // if user not found
            if (rows.length <= 0) {
				req.flash('error', 'unrecognized session credentials')
                res.redirect(301, '/')
            }else{
				con.query("INSERT INTO waiting_room (name, room, status, interest) VALUES (?, ?, ?, ?)", [name, room, 'waiting', interest] , function (err, result){
					if (err) throw err;
	//res.redirect('/waiting_room', {name : req.body.name, password : req.body.password, interest : req.body.interest, room : req.body.room})
	
	res.redirect(307, '/waiting_room');
	console.log(result, ' gotten')

				})
			}
})
})

app.post('/waiting_room', function(req, res){
	if(!req.session.room || !req.session.name || !req.session.interest){
		res.redirect(301, '/');
	}
	res.render('waiting_room', {name : req.session.name, room : req.session.room, interest : req.session.interest});
})


app.get('/auth', function(req, res){
	con.query("SELECT * FROM waiting_room WHERE division = ?", [division], function(err, rows){
		if (err){
			throw err;
		}
		if (rows.length < 1){
            res.render('auth', {msg : 'no one in the waiting room'});	
		}else{
			console.log('fields are : ',  rows);
			res.render('auth', {data : rows});
		}
	})
})

/********************/

io.on('connection', function(socket) {
    socket.emit('connect', {id : socket.id})
    socket.on('create or join', function(data) {
        var num = io.sockets.adapter.rooms[data.room] || {length : 0};
        var clients = num.length;
        if (clients === 0){
            socket.join(data.room);
            socket.emit('room_created', {msg : 'welcome to room ' + data.room, total : clients})
        }else if (clients >= 1 && clients < 26){
        socket.join(data.room);
socket.emit('room_joined', {msg : 'welcome to room ' + data.room, total : clients})
socket.to(data.room).emit('new user', {welcome : data.user + ' has joined the session with id ' + socket.id})
}
else{
    socket.emit('full', { msg : 'room ' + data.room + ' has reached it\'s full capacity'})
}
})


    socket.on('start_call', (e) => {
        socket.to(e.room).emit('start_call', {from : e.from, room : e.room})
       // socket.emit('start_call', {from : e.peer })
    })
    
    socket.on('view in', function(e){
        io.in(e.room).emit('view in', {data : e.data, id : e.from})
    })
    
    socket.on('active_speaker_offer', function(event){
        io.in(event.room).emit('active_speaker_in', {id : event.id, room : event.room, sdp : event.sdp})
    })

    socket.on('webrtc_offer', (event) => {
        console.log('Broadcasting webrtc_offer event to peers in room ${event.room}')
        socket.broadcast.to(event.room).emit('webrtc_offer', {sdp : event.sdp, from : event.from, room : event.room})
    });
    socket.on('webrtc_answer', (event) => {
        console.log('Broadcasting webrtc_answer event to peers in room ${event.room}')
        socket.to(event.from).emit('webrtc_answer', {sdp : event.sdp})
    });
    
    socket.on('webrtc_ice_candidate', (event) => {
        console.log('Broadcasting webrtc_ice_candidate event to peers in room ${event.room}')
        io.in(event.room).emit('webrtc_ice_candidate', event)
    })
    
    socket.on('webrtc_ice_candidate_from_speaker', (event) => {
        console.log('Broadcasting webrtc_ice_candidate event to peers in room ${event.room}')
        socket.to(event.room).emit('webrtc_ice_candidate_from_speaker', event)
    })
    
       socket.on('webrtc_ice_candidate_from_listeners', (event) => {
        console.log('Broadcasting webrtc_ice_candidate event to peers in room ${event.room}')
        socket.to(event.from).emit('webrtc_ice_candidate_from_listeners', event)
    })
     
     socket.on('mute-un', function(e){
        io.in(e.room).emit('mute-un', {text : e.content, to : e.to, name : e.name});
    })
    
    socket.on('objection', function(e){
        io.in(e.room).emit('objection_in', e);
   // }
    })
     
    socket.on('chat in room', function(data) {
        var msg = data.msg;
        var from = data.from;
        var room = data.roomz
            //io.to('some room').emit('some event');

        socket.broadcast.to(room).emit('msg received', { message: msg, roomZ: room, sent_from: from })
        socket.emit('msg received', { message: msg, roomZ: room, sent_from: from })
            //io.sockets.in(rooM).broadcast.to('msg received', { message: msg, sent_from: from })
        console.log('sent to room', data.room)
            //socket.broadcast.to('msg received', { message: msg, sent_from: from })
    })
    
    socket.on('insert user', function(e){
        console.log('inserting user data into ongoing_session table')
        var user_role = e.user_role; 
        var room_no = e.room_no;
        var username = e.username;
        var user_id = e.user_id;
        con.query("SELECT * FROM ongoing_session WHERE room_no = ? AND name = ?", [room_no, username], function(err, ress, fields){
            if (ress.length > 0){
                console.log('no duplicate entry allowed');
                 con.query("SELECT * FROM ongoing_session WHERE room_no = ?", [room_no], function(err, rows){
                    if (err) throw err;
                    io.in(e.room_no).emit('participants', {data : rows})
                 })
            }else{
        
        con.query("INSERT INTO ongoing_session (role, room_no, name, socket_id) VALUES (?, ?, ?, ?)", [user_role, room_no, username, user_id], function(err, result){
            if(err){
                socket.emit('error picked', {msg : 'error while inserting ' + err})
                throw err;
            }
           else{
                con.query("SELECT * FROM ongoing_session WHERE room_no = ?", [room_no], function(err, rows){
                    if (err) throw err;
                    io.in(e.room_no).emit('participants', {data : rows})
                })
            }
        })
            }
       });
    })

    socket.on('main-speaker', function(data) {
        //var parse = JSON.parse(data.keystrm);
        console.log('main-speaker recv');
        io.sockets.to(rooM).emit('main-speaker-rcvd', { strm: data.keystrm });
        console.log('stream sent', data.keystrm)
    })
    socket.on('usersInRoom', function(evt) {
        pushname.push(evt.name)
        usersjson = JSON.stringify(pushname);
        io.sockets.in(rooM).emit('clients in room', { data: usersjson, clients: numberOfClients })
            // socket.broadcast.to('clients in room', {data : usersjson, clients: clientsInRoom})
    })
    socket.on('stream from lc', function(e) {
        console.log('media stream is : ', e.streaM)
        socket.emit('video_added', { strm: e.streaM });
    })
    socket.on('remote video', function(data) {
        console.log('remote vid in is', data.data);
        socket.broadcast.to(rooM).emit('video_added', { strm: data.data })
    })
 /*   socket.on('disconnect', function(e) {
        console.log('disconnecting ', you);
        pushname.pop(you)
    })*/
      
    
    socket.on('leave_room', function(e){
        var del_room = e.room; var del_id = e.id; var del_user = e.name;
     con.query("DELETE FROM ongoing_session WHERE room_no = ? AND name = ?", [del_room, del_user], function(err, result){
           if (err){
               throw err;
           }else{
            socket.emit('leave', {name : e.name, id : e.id});
            socket.leave(e.room);
              con.query("SELECT * FROM ongoing_session WHERE room_no = ?", [del_room], function(err, rows){
                    if (err) throw err;
                    io.in(del_room).emit('participants', {data : rows})
           })
           }
       })
        
    })
    
    socket.on('disconnect-reconnect', function(e){
       con.query("DELETE FROM ongoing_session WHERE socket_id = ? AND room = ?", [e.id, e.room], function(err, result){
           if (err){
               throw err;
           }else{
             socket.emit('disconnect')  
           }
       })
        
    
    })
    
 

})
/*

function insertUser(caseid, role, roomno, name, socket_id){
    con.connect(function(err) {
  if (err) throw err;
  var sql = "INSERT INTO ongoing_session (case_id, role, room_no, name, socket_id) VALUES (caseid, role, roomno, name, socket_id)";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted ", result);
  });
});
}

function initializeSession(caseid, sessionid, sessionpw, status){
    con.connect(function(err) {
  if (err) throw err;
    var sql = "INSERT INTO sessions (case_id, session_id, session_pw, room_no, status) VALUES (caseid, sessionid, sessionpw, status)";
    con.query(sql, function (err, result){
        if (err) throw err;
        console.log('record inserted', result);
    })
  })
}

function deleteUSer(socket_id){
     con.connect(function(err) {
  if (err) throw err;
  con.query("DELETE FROM ongoing_session WHERE socket_id = ?", [socket_id], function(error, results) {
  if (error) throw error;
  console.log(name, ' has been deleted');      
  })
})
}

function listUsers(roomno, role){
    con.connect(function(err){
        if (err) throw err;
    con.query("SELECT FROM ongoing_session WHERE roomno = ? AND role = ?", [roomno, role], function(error, result){
        if (error) throw error;
        socket.emit('users_in_room', {list : result});
        console.log('session users sent to client side', result);
    })
    })
}
function countUsers(room, role){}
 */
 /*
app.get('/list', function(req, res){
    if (req.type == 'listroommembers'){
        con.connect(function(err){
            if (err) throw err;
            con.query('SELECT COUNT(id) FROM ongoing_session WHERE room_no = ? ', [rooM], function(error, result){
                if(error) throw error;
                res.send(result);
            })
        })
    }
    
}) 
 */
    

http.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});