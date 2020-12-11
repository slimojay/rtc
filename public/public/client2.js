var divSelectRoom = document.getElementById('selectRoom');
var ParticipantName = document.getElementById('username');
var divConsultingRoom = document.getElementById('consultingRoom');
//var inputRoomNumber = document.getElementById('roomNumber');
var btnGoRoom = document.getElementById('goRoom');
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');
var remoteVideoDiv = document.getElementById('remoteVideoDiv');
var sndBtn = document.getElementById('sndBtn');
var sndMsg = document.getElementById('sndMsg');
var sndMsgDiv = document.getElementById('msgDiv');
var end = document.getElementById('endBtn');
var leave = document.getElementById('leave');
var roomNumber;
var localStream;
var remoteStream;
var userName;
var rtcPeerConnection = [];
var rtcPeerConnection_l;
var obj;
var usersInRoom = [];
var recordedBlobs;
var mediaRecorder;
var downloadBtn
var recordBtn = document.querySelector('#record');
var winStr
var chunks = [];
var strmChunks = []
var senders = [];
var shareBtn = document.getElementById('shareBtn');
var displayMediaStream;
var Listt;
var arrOfStrms;
var list = [];
var tracks = [];
var isRoomCreator;
var peer_id
var initial_id;
var remotePeer_id;
    /*
    var hark =
        import ('../hark.js')
    */
function showBtn() {
    var inpField = document.querySelector('#msgfield')
        /*
    if (inpField.value.length < 0) {
        document.querySelector('#sndBtn').style.visibility = 'visible';
    } else {
        document.querySelector('#sndBtn').style.visibility = 'hidden';
    }*/
}
// these are the STUN servers

var iceServers = {
        'iceServers': [
            { 'urls': 'stun:stun.services.mozilla.com' },
            { 'urls': 'stun:stun.I.google.com:19302' }
        ]
    }

var streamConstraints = { audio: true, video: true };
var mediaConstraints = { audio: true, video: true };
var isCaller;

var socket = io.connect('https://lagossstate.remote-court.com');
var urlstring = window.location.search

var searchParams = new URLSearchParams(urlstring);
if (!searchParams.has('username')){
   window.location.replace('index.html')
   console.log('no name')
}else{
    userName = searchParams.get('username')
}

if (!searchParams.has('room')){
   window.location.replace('index.html')
   console.log('no room')
}else{
   roomNumber = searchParams.get('room') 
}

 socket.on('connect', () => {
    console.log(socket.id); 
    initial_id = socket.id
 });
 
 socket.emit('create or join', {room: roomNumber, user: userName });
        console.log('create or join emitted')

socket.on('room_created', async(data) => {
    console.log('Socket event callback: room_created', data.room, 'by', data.user)
    await setLocalStream(mediaConstraints)
    peer_id = initial_id
    console.log(peer_id, 'is assigned')
    // socket.emit('start_call', {caller : userName, caller_id : peer_id})
    isRoomCreator = true
})

socket.on('room_joined', async(obj) => {
    await setLocalStream(mediaConstraints)
    peer_id = initial_id;
    socket.emit('start_call', {caller : userName, caller_id : peer_id})
})

socket.on('start_call', async function(event){
    rtcPeerConnection[peer_id] = new RTCPeerConnection(iceServers)
        addLocalTracks(rtcPeerConnection[peer_id])
        rtcPeerConnection[peer_id].ontrack = setRemoteStream
        rtcPeerConnection[peer_id].onicecandidate = sendIceCandidate
        await createOffer(rtcPeerConnection[peer_id], event.caller_id)
        console.log(peer_id, ' is assigned', event.caller_id);

})

socket.on('full', (data) => {
    console.log('Socket event callback: full_room')

    alert('The room ' + data.room + ' is full, please try another one ' + data.num)
})
socket.on('empty', function(e){
    console.log(e.msg, 'reported')
})

socket.on('webrtc_offer', async(event) => {
   console.log('Socket event callback: webrtc_offer', event.sdp)
    rtcPeerConnection[peer_id] = new RTCPeerConnection(iceServers)
    addLocalTracks(rtcPeerConnection[peer_id])
    rtcPeerConnection[peer_id].ontrack = setRemoteStream
    rtcPeerConnection[peer_id].onicecandidate = sendIceCandidate
    await rtcPeerConnection[peer_id].setRemoteDescription(event)
    await createAnswer(rtcPeerConnection[peer_id], roomNumber)
         
})

socket.on('webrtc_answer', async(event) => {
    console.log('Socket event callback: webrtc_answer', event)
    await rtcPeerConnection[peer_id].setRemoteDescription(event)
})

socket.on('webrtc_ice_candidate', (event) => {
        console.log('Socket event callback: webrtc_ice_candidate', event)
        // ICE candidate configuration.
        var candidate = {
            sdpMLineIndex: event.label,
            candidate: event.candidate,
        }
     
      
            rtcPeerConnection[peer_id].addIceCandidate(candidate).then(e => {
                console.log('ice added');
            });



    })
    
    
     document.getElementById('fm').onsubmit = function(e) {
     e.preventDefault()
     sndBtn.onclick = function(){
    var msgField = document.querySelector('#msgfield');
    // msgField.value.replace(/\s/g, '');
    if (!msgField.value.replace(/\s/g, '').length) {
        alert("you can not send an empty message");

    } else {
        //console.log(inputRoomNumber.value)
        socket.emit('chat in room', { msg: msgField.value, from: userName, roomz: roomNumber });
        msgField.value = ' '
    }
     }
}

socket.on('msg received', function(evt) {
    console.log('event for chat is : ', evt.roomZ, evt.message, evt)
    var p = document.createElement('p');
    var span = document.createElement('span')
    var span2 = document.createElement('span')
    span.setAttribute('class', 'text-primary');

    // var txt = document.createTextNode(evt.sent_from + ': ' + evt.message);
    var txt1 = document.createTextNode(evt.sent_from + ': ');
    var txt2 = document.createTextNode(evt.message);
    span.appendChild(txt1);
    span2.appendChild(txt2)
    p.appendChild(span);
    p.appendChild(span2);
    p.style.borderBottom = '0.3px solid lightgrey';
    p.style.padding = '5px'
    var msgDiv = document.querySelector('#msgdiv')


    msgDiv.appendChild(p);
})
socket.on('full2', function() {
    /*  btnGoRoom.textContent = 'room full';
      btnGoRoom.addClass = 'disabled';*/
    window.location = 'fullroom.html';
})

socket.on('disconnect', function(){
    //if a disconnect event is triggered, remove my video from the remote videos
   // var my_video = document.getElementById(peer_id);
    var remoteVids = document.querySelector('#remoteVideoDiv')
    //remoteVids.removeChild(my_video);
})

socket.on('clients in room', function(event) {
    list = JSON.parse(event.data);
    var toHoldNames = document.createElement('p');
    var textNd = ' ';
    var brln = document.createElement('br');
    for (var i = 0; i < list.length; i < i++) {
        textNd += list[i] + " <br>"
        console.log(list[i], list.length);
    }
    //toHoldNames.appendChild(textNd);
    document.getElementById('clientsinroom').innerHTML = textNd;
    var p = document.createElement('p');
    var numinroom = document.createTextNode(event.clients + 1 + ' Participant(s) are in this room ');
    p.appendChild(numinroom);
    p.setAttribute('class', 'text-success');
    document.getElementById('clientsinroom').appendChild(p)
    Listt = list;
})

socket.on('userleft', () => {
    socket.disconnect();
})
socket.on('youleft', () => {
    console.log('you are abt to quit this session');
    socket.leave(roomNumber);
})

socket.on('leave_room', (e) => {
    //socket.leave(e.room);
     var remoteVideoDiv = document.getElementById('remoteVideoDiv');
    var user_vid = document.getElementById(e.id)
    user_vid.style.display = 'none';
    remoteVideoDiv.removeChild(user_id);
    window.location.replace('index.html')
})
socket.on('member_left', (e) => {
    console.log('member left event received')
    remotePeer_id = e.id;
    var div_for_who_left = document.querySelector('#clientsinroom')
    var p = document.createElement('p');
    p.createTextNode('Notice :', e.name, ' left the session');
    p.setAttribute('id', 'to_hold_' + e.id);
    p.style.marginBottom = '5px'
    div_for_who_left.appendChild(p)
      var remoteVideoDiv = document.getElementById('remoteVideoDiv');
    var user_vid = document.getElementById(e.id)
     user_vid.style.display = 'none';
    remoteVideoDiv.removeChild(user_id);
    setTimeout(hideWhoLeft, 1200)
    
})

async function setLocalStream(mediaConstraints) {
    let stream
    try {
        console.log('stream gotten')
        stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
    } catch (error) {
        console.error('Could not get user media', error)
    }

    localStream = stream
    localVideo.srcObject = stream

    rtcPeerConnection2 = new RTCPeerConnection({
        iceServers: [{ 'urls': 'stun:stun.services.mozilla.com' },
            { 'urls': 'stun:stun.I.google.com:19302' },
            { 'urls': 'stun:stun3.l.google.com:19302' }
        ]
    });

    localStream.getTracks().forEach(track => senders.push(rtcPeerConnection2.addTrack(track, localStream)));


    shareBtn.addEventListener('click', async() => {
        if (shareBtn.textContent == 'Share Screen') {
            if (!displayMediaStream) {

                displayMediaStream = await navigator.mediaDevices.getDisplayMedia();
            }
            senders.find(sender => sender.track.kind === 'video').replaceTrack(displayMediaStream.getTracks()[0]);

            //show what you are showing in your "self-view" video.
            document.getElementById('localVideo').srcObject = displayMediaStream;
            shareBtn.textContent = 'Stop Sharing';

            shareBtn.setAttribute('class', 'btn btn-alert')
        } else {
            senders.find(sender => sender.track.kind === 'video')
                .replaceTrack(stream.getTracks().find(track => track.kind === 'video'));
            document.getElementById('localVideo').srcObject = stream;
            shareBtn.textContent = 'Share Screen'
            shareBtn.setAttribute('class', 'btn btn-success')
        }
    })



    mediaRecorder = new MediaRecorder(stream);
    //visualize(stream);
    recordBtn.onclick = () => {
        if (recordBtn.textContent == 'Record') {
            mediaRecorder.start();
            console.log(mediaRecorder.state);
            console.log('recorder started');
            recordBtn.textContent = 'Stop Recording ...'
            recordBtn.setAttribute('class', 'btn btn-danger')
            document.querySelector('#leave').style.display = 'none'
            document.querySelector('#end').style.display = 'none'

        } else {
            mediaRecorder.stop();
            console.log(mediaRecorder.state);
            console.log('recorder stopped');
            recordBtn.textContent = 'Record'
            recordBtn.setAttribute('class', 'btn btn-primary')
            document.querySelector('#leave').style.display = 'block'
            document.querySelector('#end').style.display = 'block'
        }

    }
    mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
        socket.emit('remote video in', { data: chunks[0] })
    }
    mediaRecorder.onstop = (e) => {
        console.log("data available after MediaRecorder.stop() called.");

        var clipName = prompt('Enter a name for your sound clip');
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        var date = new Date();
        if (clipName == ' ') {
            clipName = roomNumber + '_' + date.getMinutes() + '_' + date.getSeconds() + '.webm';
        } else {
            clipName += roomNumber + '_' + date.getMinutes() + '_' + date.getSeconds() + '.webm';
        }
        a.download = clipName;
        a.click();
        setTimeout(() => {
            document.querySelector('#body').removeChild(a);
            window.URL.revokeObjectURL(url);
            chunks = [];
        }, 100)
    }

}


function addLocalTracks(rtcPeerConnectionn) {
    localStream.getTracks().forEach((track) => {
        rtcPeerConnectionn.addTrack(track, localStream)
    })
}
///*
function createOffer(rtcPeerConnectionn, caller_id) {
    let sessionDescription
    try {
        rtcPeerConnectionn.createOffer().then(function(offer) {
            sessionDescription = offer;
            console.log('offer is', offer);
            return rtcPeerConnectionn.setLocalDescription(offer);
        }).then(function() {
            console.log('rtcpeer con is', rtcPeerConnectionn.localDescription)
            socket.emit('webrtc_offer', {
                type: 'webrtc_offer',
                sdp: rtcPeerConnectionn.localDescription,
                room: roomNumber,
                peer : caller_id
            })
            console.log('room is', roomNumber, 'peer is ', caller_id)

        })
    } catch (error) {
        console.error(error)
    }


}//*/

function createAnswer(rtcPeerConnectionn, to) {
    let sessionDescription
    try {
        rtcPeerConnectionn.createAnswer().then(function(answer) {
            sessionDescription = answer
            console.log('answer is', answer);
            return rtcPeerConnectionn.setLocalDescription(answer)
        }).then(function() {
            console.log('data to be sent is', rtcPeerConnectionn.localDescription)
            socket.emit('webrtc_answer', {
                type: 'webrtc_answer',
                sdp: rtcPeerConnectionn.localDescription,
                to : to
            })

        })
    } catch (error) {
        console.error(error)
    }


}

function exitSession(){
    console.log('exit button clicked', {id : peer_id, room : roomNumber, name : userName
    } );
    socket.emit('leave_room', {id : peer_id, room : roomNumber, name : userName
    });
     window.location.replace('index.html')
}

function setRemoteStream(event) {
    console.log('setting remote stream', event)
    var arrOFstrms = [];
    arrOFstrms.push(event);
    var i = arrOFstrms.length
    var remoteVideoDiv = document.getElementById('remoteVideoDiv');
    //for(var i = 0; i  < arrOFstrms.length; i++){
    var video = document.createElement('video');
    video.setAttribute('class', 'col-lg-6');
    video.setAttribute('class', 'col-sm-6');
    video.style.marginTop = '10px';
    video.style.marginLeft = '5px'
    video.style.border = '1px solid black';
    video.style.width = '320px'
    video.style.height = '260px'
    video.srcObject = arrOFstrms[i-1].streams[0];
    video.autoplay = true
    remoteVideoDiv.appendChild(video)
    remoteStream = event.streams
//}
remoteVideoDiv.appendChild(video)
}

function sendIceCandidate(event) {
    if (event.candidate) {
        console.log('event on rtc candidate ', event)
        socket.emit('webrtc_ice_candidate', {
            room: roomNumber,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
        })
    }
}

function hideWhoLeft(){
 var div_for_who_left = document.querySelector('#clientsinroom');
 var divv = document.getElementById(remotePeer_id)
 div_for_who_left.removeChild(divv);
 remotePeer_id = '';

}

function listUsersReq(){
    var obj = new XMLHttpRequest();
    obj.onreadystatechange = function(){
        if(obj.readyState == 4){
            document.getElementById('clientsinroom').innerHTML = obj.responseText
        }
    }
    obj.open('GET', '../list?room=' + roomNumber + '&type=listroommemebers' , true)
    obj.send();
}

