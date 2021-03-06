// Common Variables
var preview_flag = true;
var stream_var;
var isParticipantView = false;
var recorder=null;
var session_part = 1;
var last_start_time = 0;

const consts = {
    connector: "_"
};

// Picking subject facing camera and setting video resolution to 1080p for best video recording quality
const videoConstraints = {
    facingMode: 'environment',
    width: { ideal: 1920 },
    height: { ideal: 1080 }
};

const audioConstraints = {
    echoCancellation: true,
    echoCancellationType: 'system'
};

const audioConstraints_env = {
    facingMode: 'environment',
    echoCancellation: true,
    echoCancellationType: 'system'
}
var SessionTest = {
    isAudioTestSubjectReq: false,
    isAudioTestTechnicianReq: true,
    isVideoTestSubjectReq: true,
    urlVideo: null
}

var isSessionActive = false;

function bindEventListener(){

    document.getElementById("id-sidebar-trigger").addEventListener('click', function() {
        if (!isParticipantView) {
            $('.ui.sidebar').sidebar('toggle');
        }
    });

    document.getElementById('id-input-toggle-display').addEventListener('click', function() {
        // if isParticipantView is true - toggling should make the second screen vanish
        // console.log("toggling check");
        let screen_config = "";
        if(isParticipantView) {
            screen_config = "internal";
        }
        // else if it false - we need to duplicate the screen 
        else if (!isParticipantView) {    
            $('.ui.sidebar').sidebar('hide');
            screen_config = "clone";
        }
        isParticipantView = !isParticipantView;
        fetch('/togglescreen', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body:JSON.stringify({ screen : screen_config })
            });
    });

    document.onkeyup = function(e) {
        if (e.altKey && e.keyCode === 'L'.charCodeAt(0)) {
            e.preventDefault();
            document.getElementById("id-sidebar-trigger").click();
        }
    }
}

function initUI(){
    $('.ui.sidebar').sidebar({
        context: $('.bottom.segment')
      })
      .sidebar('setting', 'transition', 'overlay')
      .sidebar('show');

    $('.menu .item').tab();

    $('.ui.accordion').accordion();

    $('.ui.form')
      .form({
        fields: {
          "id-input-technician-id" : 'empty',
          "id-input-participant-id"   : 'empty',
          "id-input-session-id" : 'empty'
        }
      })
    ;

    bindEventListener();
}

// ===================== Test module ==========================================

// start a video stream for 10 seconds
async function TestSubjectVideo() {
     if (navigator.mediaDevices.getUserMedia) {
        new Promise(async resolve => {
            await navigator.mediaDevices.getUserMedia({video: videoConstraints}).then(stream => {
                document.getElementById("videoElement").srcObject = stream;
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();

                const videoChunks = [];

                mediaRecorder.addEventListener("stop", () => {
                  const videoBlob = new Blob(videoChunks);
                  SessionTest.urlVideo = URL.createObjectURL(videoBlob);
                  stopStreams(stream);                  
                });

                mediaRecorder.addEventListener("dataavailable", event => {
                    videoChunks.push(event.data);
                });

                setTimeout(() => {
                  mediaRecorder.stop();
                }, 10000);
            });
        });
    }
}

// play the test video for 10 seconds
function PlaySubjectTestVideo() {
    document.getElementById("videoElement").srcObject = null;
    document.getElementById("videoElement").src = SessionTest.urlVideo;
    setTimeout(() => {
      document.getElementById("videoElement").src = "";
    }, 10000);
}

// make the test variable true depending on the test type
// if all three variable are true - make the start button enable
function TestConfirm(strTestType){
    if(strTestType == 'TestSubjectVideo'){
        document.getElementById('subject_video_active').click();
        document.getElementById('subject_video_okay').disabled=true;
        SessionTest.isVideoTestSubjectReq = false;
    }
    if(strTestType== 'TestSubjectAudio'){
        document.getElementById('technician_audio_active').click();
        document.getElementById('subject_audio_okay').disabled = true;
        SessionTest.isAudioTestSubjectReq = false;
    }
    if(strTestType == 'TestTechnicianAudio'){
        document.getElementById('technician_audio_active').click();
        document.getElementById('technician_audio_okay').disabled = true;
        SessionTest.isAudioTestTechnicianReq = false;
    }
    if(!SessionTest.isVideoTestSubjectReq && !SessionTest.isAudioTestSubjectReq && !SessionTest.isAudioTestTechnicianReq) {
        $("#id-test-require-label").hide();
        document.getElementById("id-btn-start-session").removeAttribute("disabled");
        document.getElementById('session_section').click();
    }
}

// ===================== Test module ==========================================

async function togglePreview() {
    if (preview_flag) {
        if (navigator.mediaDevices.getUserMedia) {
            new Promise(async resolve => {
                const stream = await navigator.mediaDevices.getUserMedia({video: videoConstraints, audio: audioConstraints});
                stream_var = stream;
                document.getElementById("videoElement").srcObject = stream;
            });
            preview_flag = false;
        } else {
            stopStreams();
        }
    }
}

function stopStreams(stream){
    if (stream==null){
        stream_var.getTracks().forEach(track => track.stop());
    }
    else{
        stream.getTracks().forEach(track=>track.stop());
    }
    preview_flag=true;
}

const recordAudio = () =>
    new Promise(async resolve => {
        const stream = await navigator.mediaDevices.getUserMedia({audio: audioConstraints});
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
        });

        const start = () => mediaRecorder.start();

        const stop = (record_start) => {

            mediaRecorder.addEventListener("stop", () => {
                const audioBlob = new Blob(audioChunks);
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                //audio.play();
                downloadMedia(audioBlob,record_start,'audio');                
            });

            mediaRecorder.stop();
        }
            
        resolve({start, stop});
    });

function resetStartTimer(){
    last_start_time = 0;
}

function updateSessionTimer(){
    // no need to do anythings
    let current_start_time = new Date().getTime();

    // Update the count down every 1 second
    let x = setInterval(function() {

      let now = new Date().getTime();
      let distanceMain = now - current_start_time;

      // Time calculations for hours, minutes and seconds for current timer
      let chours = ("0" + Math.floor((distanceMain % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).slice(-2);
      let cminutes = ("0" + Math.floor((distanceMain % (1000 * 60 * 60)) / (1000 * 60))).slice(-2);
      let cseconds = ("0" + Math.floor((distanceMain % (1000 * 60)) / 1000)).slice(-2);

      // Time calculations for hours, minutes and seconds for main timer
      let hours = chours;
      let minutes = cminutes;
      let seconds = cseconds;

      if(session_part > 1) {
          let dmain = last_start_time + distanceMain;
          hours = ("0" + Math.floor((dmain % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).slice(-2);
          minutes = ("0" + Math.floor((dmain % (1000 * 60 * 60)) / (1000 * 60))).slice(-2);
          seconds = ("0" + Math.floor((dmain % (1000 * 60)) / 1000)).slice(-2);
      }

      if(isSessionActive){
        document.getElementById("id-label-session-length").innerHTML = hours + ":" + minutes + ":" + seconds;
        document.getElementById("id-label-session-part-length").innerHTML = chours + ":" + cminutes + ":" + cseconds;
      }

      if (!isSessionActive) {
        last_start_time += distanceMain;
        clearInterval(x);
      }
    }, 500);
}

// start session
// main function that starts recording the media
async function recordVideo(start_record_button) {
    if( $('.ui.form').form('is valid')) {
        // start video preview
        let record_start=Date();
        isSessionActive = true;

        // start audio capture
        const recorder = await recordAudio();
        recorder.start();
        const stop_record_button = document.getElementById("id-btn-stop-session");
        const pause_record_button = document.getElementById("id-btn-pause-session");
        const session_length_label = document.getElementById("id-label-session-length");
        const session_part_length_label = document.getElementById("id-label-session-part-length");
        start_record_button.setAttribute("disabled","disabled");
        stop_record_button.removeAttribute("disabled");
        pause_record_button.removeAttribute("disabled");

        new Promise(async resolve => {
            const stream = await navigator.mediaDevices.getUserMedia({audio: audioConstraints, video: videoConstraints});
            const displaystream = await navigator.mediaDevices.getUserMedia({video: videoConstraints});
            const mediaRecorder = new MediaRecorder(stream);
            const videoChunks = [];
            document.getElementById("videoElement").srcObject = displaystream;
            mediaRecorder.ondataavailable = e => videoChunks.push(e.data);
            mediaRecorder.onstop = e => downloadMedia(new Blob(videoChunks),record_start,'video');
            mediaRecorder.start();
            if (session_part == 1) {
                let PID = (document.getElementById('id-input-participant-id').value!='')?document.getElementById('id-input-participant-id').value:'PID';
                let SID = (document.getElementById('id-input-session-id').value!='')?document.getElementById('id-input-session-id').value:"SID";
                fetch('/startsession',
                {
                    method: 'post',
                    body: JSON.stringify({ sid: SID, pid: PID }),
                    headers: {
                      'Content-Type': 'application/json'
                    }
                }); 
                resetStartTimer();
            }
            updateSessionTimer();
            stop_record_button.addEventListener("click", function () {   
                if(isSessionActive){
                    mediaRecorder.stop();
                    // stop and download the audio
                    recorder.stop(record_start);  
                    stopStreams(stream);
                    stopStreams(displaystream);
                }                
                isSessionActive = false;
                resetStartTimer();
                stop_record_button.setAttribute("disabled","disabled");
                pause_record_button.setAttribute("disabled","disabled");
                start_record_button.removeAttribute("disabled");
                setTimeout(function() {
                    session_part = 1; 
                    $("form").find("input[type='text']").val("");
                });                
                session_length_label.innerHTML = "00:00:00";
                session_part_length_label.innerHTML = "00:00:00";
            });
            pause_record_button.addEventListener("click", function () {
                mediaRecorder.stop();
                isSessionActive = false;
                recorder.stop(record_start);
                pause_record_button.setAttribute("disabled","disabled");
                start_record_button.removeAttribute("disabled");
                stopStreams(stream);
                session_part_length_label.innerHTML = "00:00:00";
                setTimeout(function() {
                    session_part += 1;
                });  
            });
        });
    }    
}

// function downloadMedia(blob,record_start,type){
//     let record_end=Date();
//     let a = document.createElement('a');
//     a.href = URL.createObjectURL(blob);
//     let PID = (document.getElementById('id-input-participant-id').value!='')?document.getElementById('id-input-participant-id').value:'PID';
//     let SID = (document.getElementById('id-input-session-id').value!='')?document.getElementById('id-input-session-id').value:"SID";
//     let file_name = PID+consts.connector+SID+consts.connector+'part-'+session_part+consts.connector+type+consts.connector+ record_start.slice(4,-33)+consts.connector+record_end.slice(16,-33)+".webm";
//     file_name=file_name.split(" ").join("_");
//     file_name=file_name.split(":").join(".");
//     a.download = file_name;
//     document.body.appendChild(a);
//     a.click();
//     URL.revokeObjectURL(a.href);
// }

// this function saves the media in the localhost server folder instead of downloading it in downloads folder
function downloadMedia(blob,record_start,type){
    let record_end=Date();
    let PID = (document.getElementById('id-input-participant-id').value!='')?document.getElementById('id-input-participant-id').value:'PID';
    let SID = (document.getElementById('id-input-session-id').value!='')?document.getElementById('id-input-session-id').value:"SID";
    let format = ".mp4";
    if(type=="audio") format = ".wav";
    let file_name = PID+consts.connector+SID+consts.connector+'part-'+session_part+consts.connector+type+consts.connector+ record_start.slice(4,-33)+consts.connector+record_end.slice(16,-33)+format;
    file_name=file_name.split(" ").join("_");
    file_name=file_name.split(":").join(".");

    var fd = new FormData();

    fd.append('sessionBlob', blob,  file_name);

    fetch('/postMedia',
    {
        method: 'post',
        body: fd
    });
}


// Auxiliary function : Call via console to get list of Cameras Connected
function getConnectDevices(){
    navigator.mediaDevices.enumerateDevices()
        .then(function(devices) {
            devices.forEach(function(device) {
                if(device.kind=="videoinput"){
                    console.log(device.kind + ": " + device.label +
                        " id = " + device.deviceId);
                }
            });
        })
}

function recordTestAudio(mode) {
    return new Promise(async resolve => {
        let stream = null;
        let audio;
        if(mode=='subject') {
            let subject_status_div = document.getElementById('recording_status_subject');
            let content=subject_status_div.innerHTML;
            content=content.concat(`<p id="recording_progress" style="text-align: center"><i class="icon microphone"></i> </p>`);
            subject_status_div.innerHTML=content;
            stream = await navigator.mediaDevices.getUserMedia({audio:audioConstraints_env});
        }
        else{
            let subject_status_div = document.getElementById('recording_status_technician');
            let content=subject_status_div.innerHTML;
            content=content.concat(`<p id="recording_progress" style="text-align: center"><i class="icon microphone"></i> </p>`);
            subject_status_div.innerHTML=content;
            stream = await navigator.mediaDevices.getUserMedia({audio:audioConstraints});
        }
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
        });

        const stop = () => {
            mediaRecorder.addEventListener("stop", () => {
                const audioBlob = new Blob(audioChunks);
                const audioUrl = URL.createObjectURL(audioBlob);
                audio = new Audio(audioUrl);
            });

            mediaRecorder.stop();
        }
        const start = () => mediaRecorder.start();
        const playAudio = () =>{
            audio.play();
        }
        resolve({start, stop,playAudio});
    });
}

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

async function testAudio(mode){
    recorder = await recordTestAudio(mode);
    recorder.start();
    await sleep(10000);
    removeStatus();
    await recorder.stop();
};

function playTestAudio(){
    if(recorder!=null){
        recorder.playAudio();
    }
}

function removeStatus() {
    let recording_progress = document.getElementById('recording_progress');
    recording_progress.parentNode.removeChild(recording_progress);
}

// initial function to be called when the script loads
initUI();