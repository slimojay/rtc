var divSelectRoom = document.getElementById('selectRoom');
var divConsultingRoom = document.getElementById('consultingRoom');
var inputRoomNumber = document.getElementById('roomNumber');
var btnGoRoom = document.getElementById('goRoom');
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');
var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;
// these are the STUN servers
var iceServers = {
    'iceServers': [
        { 'url': 'stun:stun.services.mozilla.com' },
        { 'url': 'stun:stun.I.google.com:19302' }
    ]
}
var streamConstraints = { audio: true, video: true };
var isCaller;

var socket = io.connect('localhost:3000');
btnGoRoom.onclick = function() {




    if (inputRoomNumber.value === '') {
        alert('please type in a room number');
    } else {
        roomNumber = inputRoomNumber.value;
        socket.emit('create or join', roomNumber);
        divSelectRoom.style.display = 'none';
        divConsultingRoom.style.visibility = 'visible'
    }
}


socket.on('created', function(room) {
        navigator.mediaDevices.getUserMedia(streamConstraints).then(function(stream) {
            localStream = stream;
            localVideo.srcObject = localStream;
            isCaller = true;
        })

    })
    //when a join is triggered
socket.on('joined', function(room) {
        navigator.mediaDevices.getUserMedia(streamConstraints).then(function(stream) {
            localStream = stream;
            localVideo.srcObject = stream;
        })
    })
    //ready
socket.on('ready', function() {
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;
        //add local stream to media object
        rtcPeerConnection.addStream(localStream);
        rtcPeerConnection.createOffer(setLocalAndOffer, function(e) {
            console.log(e);

        })
    }
})

socket.on('offer', function(e) {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;
        rtcPeerConnection.addStream(localStream);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(e));
        rtcPeerConnection.createAnswer(setLocalAndAnswer, function(e) {
            console.log(e);

        })
    }
})

socket.on('answer', function(evt) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(evt));
});

socket.on('candidate', function(e) {
    var candidate = new RTCIceCandidate({
        SdpMLineIndex: e.label,
        candidate: e.candidate

    })
    rtcPeerConnection.addIceCandidate(candidate);
})

function onAddStream(evt) {
    remoteVideo.srcObject = evt.stream;
    remoteStream = evt.stream;
}

function onIceCandidate(evt) {
    if (evt.candidate) {
        console.log('sending ice');
        socket.emit('candidate', {
            type: 'candidate',
            label: evt.candidate.SdpMLineIndex,
            id: evt.candidate.candidate,
            room: roomNumber
        })
    }
}

function setLocalAndOffer(sessDesc) {
    rtcPeerConnection.setLocalDescription(sessDesc);
    socket.emit('offer', {
        type: 'offer',
        sdp: sessDesc,
        room: roomNumber
    })
}

function setLocalAndAnswer(sessDesc) {
    rtcPeerConnection.setLocalDescription(sessDesc);
    socket.emit('answer', {
        type: 'answer',
        sdp: sessDesc,
        room: roomNumber
    })
}