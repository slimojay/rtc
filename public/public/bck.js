function startRecording() {
    recordedBlobs = [];

    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.error(`${options.mimeType} is not supported`);
            options = { mimeType: 'video/webm' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not supported`);
                options = { mimeType: '' };
            }
        }
    }
    try {
        //window.stream = localStream;
        mediaRecorder = new MediaRecorder(localStream, options);
    } catch (e) {
        console.error('Exception while creating MediaRecorder:', e);
        // errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
        return;
    }
    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    document.querySelector('#record').textContent = 'Stop Recording';
    document.querySelector('#download').disabled = true;
    mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
        console.log('Recorded Blobs: ', recordedBlobs);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
    mediaRecorder.stop();
    downloadRecording();
}


function downloadRecording() {
    const blob = new Blob(recordedBlobs, { type: 'video/webm' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'test.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

function handleDataAvailable(event) {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

downloadBtn = document.querySelector('#download')
downloadBtn.onclick = downloadRecording

recordBtn = document.querySelector('#record');
recordBtn.onclick = function() {
    if (recordBtn.textContent == 'Record') {
        startRecording();
        //recordBtn.textContent = 'Stop'
    } else {
        stopRecording();
        recordBtn.textContent = 'Record'
    }
}


userMediaStream.getTracks()
    .forEach(track => senders.push(peerConnection.addTrack(track, userMediaStream)));


document.getElementById('share-button').addEventListener('click', async() => {
    if (!displayMediaStream) {
        displayMediaStream = await navigator.mediaDevices.getDisplayMedia();
    }
    senders.find(sender => sender.track.kind === 'video').replaceTrack(displayMediaStream.getTracks()[0]);

    //show what you are showing in your "self-view" video.
    document.getElementById('self-view').srcObject = displayMediaStream;

    //hide the share button and display the "stop-sharing" one
    document.getElementById('share-button').style.display = 'none';
    document.getElementById('stop-share-button').style.display = 'inline';
});