var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');
var remoteVideoDiv = document.getElementById('remoteVideoDiv');
var sndBtn = document.getElementById('sndBtn');
var sndMsg = document.getElementById('sndMsg');
var sndMsgDiv = document.getElementById('msgDiv');
var end = document.getElementById('endBtn');
var leave = document.getElementById('leave');
var rv = document.getElementById('remoteVideo');
var alt =  document.getElementById('altimg');
var roomNumber;
var localStream;
var remoteStream;
var userName;
var rtcPeerConnection = [];
var rtcPeerConnectionl = [];
var obj;
var usersInRoom = [];
var recordedBlobs;
var mediaRecorder;
var downloadBtn;
var shouldIMute = true;
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
var server_peer_id;
var mediaStreamSource;
var meter;
var canvasContext = null;
var WIDTH=500;
var HEIGHT=50;
var rafID = null
var active_speaker;
canvasContext = document.getElementById( "meter" ).getContext("2d");
//var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
//var gainNode = audioCtx.createGain();
// these are the STUN servers

  // monkeypatch Web Audio
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
	
    // grab an audio context
    audioContext = new AudioContext();

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
    console.log(userName)
}

if (!searchParams.has('room')){
   window.location.replace('index.html')
   console.log('no room')
}else{
   roomNumber = searchParams.get('room') 
   console.log(roomNumber)
}


 socket.on('connect', () => {
    console.log(socket.id); 
    initial_id = socket.id
    rtcPeerConnection[initial_id] = new RTCPeerConnection(iceServers);
    rtcPeerConnectionl[initial_id] = new RTCPeerConnection(iceServers);
 })
 
  socket.on('reconnect', () => {
    console.log(socket.id); 
    initial_id = socket.id
 })
 
 
 socket.emit('create or join', {room : roomNumber, user : userName});
console.log('create or join emitted', {room : roomNumber, user : userName})
socket.on('new user', function(e){
    console.log(e.welcome)
})
socket.on('error', function(e){
    console.log('error picked ', e)
   // location.reload();
})

socket.on('room_created', async function(data){
    console.log('Socket event callback: room_created', data.msg, data.total);
     setLocalStream(mediaConstraints);
     insertUser('host', roomNumber, userName, initial_id)
    isRoomCreator = true;
})



socket.on('room_joined', async  function(data){
    console.log('socket event callback: room_joined', data.msg, data.total)
    setLocalStream(mediaConstraints)
    peer_id = initial_id;
    console.log(peer_id, 'is assigned');
    insertUser('participant', roomNumber, userName, initial_id)
    //socket.emit('start_call', {room : roomNumber})
});

socket.on('participants', function(e){
    var data = e.data; var i ;
    var text = ''
    var clients = document.querySelector('#clientsinroom');
    for(i = 0; i < data.length; i++){
        text += '<tr><td>' + data[i].name + "</td>\t &nbsp &nbsp <td><button class='mute-un' id='mute_" + data[i].name + "' onclick='muteUn(this.id)'>mute</button></td> &nbsp &nbsp <td><button id='vid_" + userName + "' onclick='vidIn(this.id)' class='vid-in'>Stage</button></td> &nbsp &nbsp <td><button id='" + userName + "' onclick='throwOut(this.id)'><i class='far fa-times-circle text-danger medium'></i></button></td></tr>";
        //text += "<tr class='actions' style='clear:both'><span class='alignLeft'><td style='margin-right:30px'>" + data[i].name + "</td></span> &nbsp &nbsp <span class='alignRight'><td style='margin-right:14px'><button><i class='fas fa-microphone-alt text-success medium'></i></button></td> &nbsp &nbsp <td style='margin-right:14px'><button><i class='fas fa-video text-success medium'></i></button> </td> &nbsp &nbsp <td style='margin-right:14px'><button><i class='far fa-times-circle text-danger medium'></i> </button></td></span></tr>";
    }
    clients.innerHTML ='<span class="text-danger">'+ data.length + '</span> participants <br> <table>' +  text  + '</table>';
    clients.style.fontFamily = 'times new roman';
})

socket.on('full', (data) => {
console.log('Socket event callback: full_room')
alert(data.msg)
window.location = 'index.html'
})
socket.on('empty', function(e){
    console.log(e.msg)
})

socket.on('mute-un', function(e){
    console.log('new mic event received', e, initial_id);
    var id_mute = 'mute_' + e.to;
    if (e.name == userName){
    if (e.text === 'mute'){
      document.getElementById(id_mute).textContent = "un-mute";
      document.getElementById(id_mute).setAttribute('class', 'btn btn-danger')
      document.getElementById(id_mute).style.padding = '3px'
      shouldIMute = false;
      console.log('new mic event handled', shouldIMute);
    }
    else{
       document.getElementById(id_mute).textContent = "mute";
       document.getElementById(id_mute).setAttribute('class', 'btn btn-success')
       document.getElementById(id_mute).style.padding = '3px 6px 3px 6px'
       shouldIMute = true;
       console.log('new mic event handled', shouldIMute);
       
    }
    }
})

socket.on('error picked', function(d){
    alert(d.msg);
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


socket.on('webrtc_offer', async(eventt) => {
    console.log('Socket event callback: webrtc_offer received')
   // addLocalTracks(rtcPeerConnection)
    rtcPeerConnection.ontrack = setRemoteStream
    rtcPeerConnection.onicecandidate = sendIceCandidate;
    await rtcPeerConnection.setRemoteDescription(eventt.sdp)
    await createAnswer(rtcPeerConnection, roomNumber);
})





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

/*socket.on('disconnect', function(){
    alert('disconnection triggered');
    socket.emit('disconnect-reconnect', {id : initial_id, room : roomNumber})
    window.location = 'session.html?username=' + userName + '&room=' + roomNumber +''
})*/
/*
socket.on('reconnect', function(){
   // alert('console.log')
    socket.emit('disconnect-reconnect', {id : initial_id, room : roomNumber})
    window.location = 'session.html?username=' + userName + '&room=' + roomNumber +''
})
*/

socket.on('objection_in', function(e){
    console.log('objection in');
          swal({   
            title: e.name + " raised an objection",
            text: "role : " + e.role,
            type: "warning",   
            showCancelButton: true,   
            confirmButtonColor: "#fff",
            cancelButtonColor: "#000",   
            confirmButtonText: "Sustain",   
            cancelButtonText: "Overrule",   
            closeOnConfirm: true,   
            closeOnCancel: true,
            showCloseButton: true
        }).then(function(isConfirm){   
            if (isConfirm) {     
                console.log('granted');
                
            } else {     
               console.log('denied');
            }
        });
        
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

socket.on('leave', (e) => {
    window.location = 'index.html';
})





 function setLocalStream(mediaConstraints) {
        
        /*********************************************/
        
        
        
        
        
        (function(e){if("function"==typeof bootstrap)bootstrap("hark",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeHark=e}else"undefined"!=typeof window?window.hark=e():global.hark=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var WildEmitter = require('wildemitter');
//var hark = require('node_modules/hark.js');
function getMaxVolume (analyser, fftBins) {
  var maxVolume = -Infinity;
  analyser.getFloatFrequencyData(fftBins);

  for(var i=4, ii=fftBins.length; i < ii; i++) {
    if (fftBins[i] > maxVolume && fftBins[i] < 0) {
      maxVolume = fftBins[i];
    }
  };

  return maxVolume;
}


var audioContextType;
if (typeof window !== 'undefined') {
  audioContextType = window.AudioContext || window.webkitAudioContext;
}
// use a single audio context due to hardware limits
var audioContext = null;
module.exports = function(stream, options) {
  var harker = new WildEmitter();

  // make it not break in non-supported browsers
  if (!audioContextType) return harker;

  //Config
  var options = options || {},
      smoothing = (options.smoothing || 0.1),
      interval = (options.interval || 300),
      threshold = options.threshold,
      play = options.play,
      history = options.history || 10,
      running = true;

  // Ensure that just a single AudioContext is internally created
  audioContext = options.audioContext || audioContext || new audioContextType();

  var sourceNode, fftBins, analyser;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = smoothing;
  fftBins = new Float32Array(analyser.frequencyBinCount);

  if (stream.jquery) stream = stream[0];
  if (stream instanceof HTMLAudioElement || stream instanceof HTMLVideoElement) {
    //Audio Tag
    sourceNode = audioContext.createMediaElementSource(stream);
    if (typeof play === 'undefined') play = true;
    threshold = threshold || -50;
  } else {
    //WebRTC Stream
    sourceNode = audioContext.createMediaStreamSource(stream);
    threshold = threshold || -50;
  }

  sourceNode.connect(analyser);
  if (play) analyser.connect(audioContext.destination);

  harker.speaking = false;

  harker.suspend = function() {
    return audioContext.suspend();
  }
  harker.resume = function() {
    return audioContext.resume();
  }
  Object.defineProperty(harker, 'state', { get: function() {
    return audioContext.state;
  }});
  audioContext.onstatechange = function() {
    harker.emit('state_change', audioContext.state);
  }

  harker.setThreshold = function(t) {
    threshold = t;
  };

  harker.setInterval = function(i) {
    interval = i;
  };

  harker.stop = function() {
    running = false;
    harker.emit('volume_change', -1, threshold);
    if (harker.speaking) {
      harker.speaking = false;
      harker.emit('stopped_speaking');
    }
    analyser.disconnect();
    sourceNode.disconnect();
  };
  harker.speakingHistory = [];
  for (var i = 0; i < history; i++) {
      harker.speakingHistory.push(0);
  }

  // Poll the analyser node to determine if speaking
  // and emit events if changed
  var looper = function() {
    setTimeout(function() {

      //check if stop has been called
      if(!running) {
        return;
      }

      var currentVolume = getMaxVolume(analyser, fftBins);

      harker.emit('volume_change', currentVolume, threshold);

      var history = 0;
      if (currentVolume > threshold && !harker.speaking) {
        // trigger quickly, short history
        for (var i = harker.speakingHistory.length - 3; i < harker.speakingHistory.length; i++) {
          history += harker.speakingHistory[i];
        }
        if (history >= 2) {
          harker.speaking = true;
          harker.emit('speaking');
        }
      } else if (currentVolume < threshold && harker.speaking) {
        for (var i = 0; i < harker.speakingHistory.length; i++) {
          history += harker.speakingHistory[i];
        }
        if (history == 0) {
          harker.speaking = false;
          harker.emit('stopped_speaking');
        }
      }
      harker.speakingHistory.shift();
      harker.speakingHistory.push(0 + (currentVolume > threshold));

      looper();
    }, interval);
  };
  looper();

  return harker;
}

},{"wildemitter":2}],2:[function(require,module,exports){





module.exports = WildEmitter;

function WildEmitter() { }

WildEmitter.mixin = async function (constructor) {
    var prototype = constructor.prototype || constructor;

    prototype.isWildEmitter= true;

    // Listen on the given `event` with `fn`. Store a group name if present.
    prototype.on = function (event, groupName, fn) {
        this.callbacks = this.callbacks || {};
        var hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        func._groupName = group;
        (this.callbacks[event] = this.callbacks[event] || []).push(func);
        return this;
    };

    // Adds an `event` listener that will be invoked a single
    // time then automatically removed.
    prototype.once = function (event, groupName, fn) {
        var self = this,
            hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        function on() {
            self.off(event, on);
            func.apply(this, arguments);
        }
        this.on(event, group, on);
        return this;
    };

    // Unbinds an entire group
    prototype.releaseGroup = function (groupName) {
        this.callbacks = this.callbacks || {};
        var item, i, len, handlers;
        for (item in this.callbacks) {
            handlers = this.callbacks[item];
            for (i = 0, len = handlers.length; i < len; i++) {
                if (handlers[i]._groupName === groupName) {
                    //console.log('removing');
                    // remove it and shorten the array we're looping through
                    handlers.splice(i, 1);
                    i--;
                    len--;
                }
            }
        }
        return this;
    };

    // Remove the given callback for `event` or all
    // registered callbacks.
    prototype.off = function (event, fn) {
        this.callbacks = this.callbacks || {};
        var callbacks = this.callbacks[event],
            i;

        if (!callbacks) return this;

        // remove all handlers
        if (arguments.length === 1) {
            delete this.callbacks[event];
            return this;
        }

        // remove specific handler
        i = callbacks.indexOf(fn);
        callbacks.splice(i, 1);
        if (callbacks.length === 0) {
            delete this.callbacks[event];
        }
        return this;
    };

    /// Emit `event` with the given args.
    // also calls any `*` handlers
    prototype.emit = function (event) {
        this.callbacks = this.callbacks || {};
        var args = [].slice.call(arguments, 1),
            callbacks = this.callbacks[event],
            specialCallbacks = this.getWildcardCallbacks(event),
            i,
            len,
            item,
            listeners;

        if (callbacks) {
            listeners = callbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, args);
            }
        }

        if (specialCallbacks) {
            len = specialCallbacks.length;
            listeners = specialCallbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, [event].concat(args));
            }
        }

        return this;
    };

    // Helper for for finding special wildcard event handlers that match the event
    prototype.getWildcardCallbacks = function (eventName) {
        this.callbacks = this.callbacks || {};
        var item,
            split,
            result = [];

        for (item in this.callbacks) {
            split = item.split('*');
            if (item === '*' || (split.length === 2 && eventName.slice(0, split[0].length) === split[0])) {
                result = result.concat(this.callbacks[item]);
            }
        }
        return result;
   };

};


  navigator.mediaDevices.getUserMedia(mediaConstraints).then(function(stream) {

    localStream = stream

console.log('stream is ', localStream)
localVideo.srcObject = stream
    //localStream = stream;
    var options = {};
    var speechEvents = hark(stream, options);
//})
    speechEvents.on('speaking', async function() {
        var source;
        console.log('speech detected')
    rtcPeerConnection[initial_id] = new RTCPeerConnection(iceServers);
     localStream.getTracks().forEach((track) => {
       //  source = audioCtx.createMediaStreamSource(stream);
         //source.connect(gainNode);
         //gainNode.connect(audioCtx.destination);
         
         localStream.getVideoTracks().forEach((trackk) => {
         if (shouldIMute == false){
             trackk.enabled = false;
             //gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
             console.log('track muted');
             //shouldIMute = true;
         }else{
             trackk.enabled = true;
          // gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
             console.log('track has been un-muted---');
        rtcPeerConnection[initial_id].addTrack(track, localStream)
        console.log('track successfully added to stream');
         }
         })
    })
  
        rtcPeerConnection.ontrack = function(e){
            console.log('track received', e)
        }

        rtcPeerConnection[initial_id].onicecandidate = function(event) {
    if (event.candidate) {
        console.log('candidate in', event)
        console.log('event on rtc candidate ****', event)
        socket.emit('webrtc_ice_candidate_from_speaker', {
            room: roomNumber,
            from : initial_id,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
        })
    }else{
        console.log('no candidate found')
    }
}
        if(shouldIMute !== false) await createOffer(rtcPeerConnection[initial_id], roomNumber);
    });
    
    
   socket.on('active_speaker_in', async function(evt){

       if (evt.id == initial_id){
              console.log('active speaker in from you ', evt.id)
           rv.style.display = 'block';
          alt.style.display = 'none';
          rv.srcObject = stream;
       }else{
           console.log('offer is in ', evt.sdp)
           console.log('active Speaker in from someone else ', evt.id);
           rtcPeerConnection[initial_id] = new RTCPeerConnection(iceServers);
    //rtcPeerConnectionl[initial_id] = new RTCPeerConnection(iceServers);   
      localStream.getTracks().forEach(track => {
    rtcPeerConnection[initial_id].addTrack(track, localStream);
    console.log('track added');
});
    
    var speaker_id = evt.id
    rtcPeerConnection[initial_id].ontrack = setRemoteStream
    rtcPeerConnection[initial_id].onicecandidate = function(event) {
    if (event.candidate) {
        console.log('event on rtc candidate ', event)
        socket.emit('webrtc_ice_candidate_from_listeners', {
            room: roomNumber,
            from : speaker_id,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
        })
    }else{
        console.log('no ice candidate received');
    }
}
    await rtcPeerConnection[initial_id].setRemoteDescription(evt.sdp);
    await createAnswer(rtcPeerConnection[initial_id], roomNumber, speaker_id);
       }
})


socket.on('webrtc_answer', async(event) => {
    console.log('Socket event callback: webrtc_answer', event)
    await rtcPeerConnection[initial_id].setRemoteDescription(event.sdp)
})



socket.on('webrtc_ice_candidate_from_speaker', (event) => {
        console.log('Socket event callback: webrtc_ice_candidate 1')

        // ICE candidate configuration.
        var candidate = {
            sdpMLineIndex: event.label,
            candidate: event.candidate,
        }

            rtcPeerConnection[initial_id].addIceCandidate(candidate).then(e => {
                console.log('ice added');
            });

    })
    
    socket.on('webrtc_ice_candidate_from_listeners', (event) => {
        console.log('Socket event callback: webrtc_ice_candidate 2')

        // ICE candidate configuration.
        var candidate = {
            sdpMLineIndex: event.label,
            candidate: event.candidate,
        }
            rtcPeerConnection[initial_id].addIceCandidate(candidate).then(e => {
                console.log('ice added');
            });
    })
   
    speechEvents.on('stopped_speaking', function() {
     // console.log('stopped_speaking');
	  //document.getElementById('output').style.display = 'none';
    });
    
     mediaStreamSource = audioContext.createMediaStreamSource(localStream);

    // Create a new volume meter and connect it.
    meter = createAudioMeter(audioContext);
    mediaStreamSource.connect(meter);
     
       // console.log(meter.volume)
    //onLevelChange();
     drawLoop();
    localStream.getTracks().forEach(track => senders.push(rtcPeerConnection2.addTrack(track, localStream))); 
    mediaRecorder = new MediaRecorder(stream);
 // });
})
//}
//}





WildEmitter.mixin(WildEmitter);

},{}]},{},[1])(1)
});
;
        
    
        /*********************************************/
        
        
    
    
        

       
        
        
    rtcPeerConnection2 = new RTCPeerConnection({
        iceServers: [{ 'urls': 'stun:stun.services.mozilla.com' },
            { 'urls': 'stun:stun.I.google.com:19302' }
        ]
    });

    


    shareBtn.addEventListener('click', async() => {
        if (shareBtn.textContent == 'Share Screen') {
            if (!displayMediaStream) {

                displayMediaStream = await navigator.mediaDevices.getDisplayMedia();
            }
            senders.find(sender => sender.track.kind === 'video').replaceTrack(displayMediaStream.getTracks()[0]);

            //show what you are showing in your "self-view" video.
            document.getElementById('localVideo').srcObject = displayMediaStream;
            //localStream = displayMediaStream
            shareBtn.textContent = 'Stop Sharing';

            shareBtn.setAttribute('class', 'btn btn-alert')
        } else {
            senders.find(sender => sender.track.kind === 'video')
                .replaceTrack(localStream.getTracks().find(track => track.kind === 'video'));
            document.getElementById('localVideo').srcObject = stream;
            shareBtn.textContent = 'Share Screen'
            shareBtn.setAttribute('class', 'btn btn-success')
        }
    })


/*
    
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
   
*/
}

/*
async function addLocalTracks(rtcPeerConnectionn) {
    localStream.getTracks().forEach((track) => {
        rtcPeerConnectionn.addTrack(track, localStream)
        
        //localStream.addTrack
    })
}
/*

function onLevelChange( time ) {
    // clear the background
    canvasContext.clearRect(0,0,WIDTH,HEIGHT);

    // check if we're currently clipping
    if (meter.checkClipping())
        canvasContext.fillStyle = "red";
    else
        canvasContext.fillStyle = "green";
    if(meter.volume > 0.03){
        
      createOffer(rtcPeerConnection, roomNumber)   
    }
    // draw a bar based on the current volume
    canvasContext.fillRect(0, 0, meter.volume * WIDTH * 1.4, HEIGHT);

    // set up the next visual callback
    rafID = window.requestAnimationFrame( onLevelChange );
}
*/
function createOffer(rtcPeerConnectionn, room) {
    try {
        rtcPeerConnection[initial_id].createOffer().then(function(offer) {
            console.log('offer to be sent is ', offer);
            return rtcPeerConnection[initial_id].setLocalDescription(offer);
        }).then(function() {
            console.log('rtcpeer con is ', rtcPeerConnection[initial_id].localDescription)
            socket.emit('active_speaker_offer', {
                type: 'webrtc_offer',
                sdp: rtcPeerConnection[initial_id].localDescription,
                room: roomNumber,
                id : initial_id,
            })

        })
    } catch (error) {
        console.error(error)
    }


}

function createAnswer(rtcPeerConnectionn, room, frm) {
    let sessionDescriptionn
    try {
        rtcPeerConnection[initial_id].createAnswer().then(function(answer) {
            sessionDescription = answer
            console.log('___ answer is', answer);
            return rtcPeerConnection[initial_id].setLocalDescription(answer)
        }).then(function() {
            console.log('data to be sent is', rtcPeerConnection[initial_id].localDescription)
            socket.emit('webrtc_answer', {
                type: 'webrtc_answer',
                sdp: rtcPeerConnection[initial_id].localDescription,
                room: room,
                from : frm
            })

        })
    } catch (error) {
        console.error(error)
    }


}

function exitSession(){
    socket.emit('leave_room', {id : initial_id, room : roomNumber, name : userName
    });
}

function setRemoteStream(event) {
    console.log('new track added');
     alt.style.display = 'none'
       rv.style.display = 'block'
         if (rv.srObject){
            rv.srcObject = ' ';
            rv.srcObject = event.streams[0];
         }else{
          rv.srcObject = event.streams[0];
         }
    /*
    alt.style.display = 'none'
   rv.style.display = 'block'
  // document.getElementById('remoteVideoDiv').innerHTML = rv
   rv.srcObject = event.stream;
   */
}

function sendOfferToView(){
    socket.emit('remote stream', {})
}


function sendIceCandidate(event) {
    if (event.candidate) {
        console.log('event on rtc candidate ', event)
        socket.emit('webrtc_ice_candidate', {
            room: roomNumber,
            from : event.from,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
        })
    }
}

function insertUser(role, room, name, id){
    socket.emit('insert user', {user_role : role, room_no : room, username : name, user_id : id})
}

function hideWhoLeft(){
 var div_for_who_left = document.querySelector('#clientsinroom');
 var divv = document.getElementById(remotePeer_id)
 div_for_who_left.removeChild(divv);
 remotePeer_id = '';

}
/*
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
    var obj = new XMLHttpRequest();
    obj.onreadystatechange = function(){
        if(obj.readyState == 4){
            document.getElementById('clientsinroom').innerHTML = obj.responseText
        }
    }


*/

function muteUn(xx){
    var xxx = xx.split('_');
    var btnContent = document.getElementById(xx).textContent;
     console.log('mute event sent to ', xx, xxx[1], btnContent);
    socket.emit('mute-un', {to : xxx[1], content : btnContent, name : userName, room : roomNumber});
}

function drawLoop( time ) {
    // clear the background
    canvasContext.clearRect(0,0,WIDTH,HEIGHT);

    // check if we're currently clipping
    if (meter.checkClipping())
        canvasContext.fillStyle = "red";
    else
        canvasContext.fillStyle = "green";

    // draw a bar based on the current volume
    canvasContext.fillRect(0, 0, meter.volume*WIDTH*1.4, HEIGHT);

    // set up the next visual callback
    rafID = window.requestAnimationFrame( drawLoop );
  // rafID = window.requestAnimationFrame( onLevelChange );
}




function vidIn(){
    
}


function raiseObjection(){
    socket.emit('objection', {id : initial_id, name : userName, role  : 'server can\'t pick roles', room : roomNumber});
    console.log('you raised an objection');
}


document.getElementById('leave').addEventListener('click', exitSession);