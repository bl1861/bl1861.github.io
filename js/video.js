// const variables 
const VIDEO_LIST_NAME = "video-list";
const FIGCAPTION = "figcaption";

//Create a new Skylink object and subscribe events using the on() function.
var skylink = new Skylink();

 /* Configures the Skylink console log level that would determine the type of 
  * console logs that would be printed in the Web console.
  */
skylink.setLogLevel(4);

// var to record if anyone is fullscreen
var existFullscreen = false;
// var to record who is fullscreen now
var fullscreenId = null;
// var to record peer ids
var peerIds = [];
// var to recor peer streams
var streams = [];




/* peerJoined: informs you that a peer has joined the room and 
 * shares their peerID and peerInfo a with you.
 */
skylink.on('peerJoined', function(peerId, peerInfo, isSelf) {
  console.log("peerJoined peerId:", peerId);
  if(isSelf){
    console.log("peerJoined isSelf");
  } 
  if(!existFullscreen){
    fullscreenId = peerId;
    existFullscreen = true;
  }
  addSmallscreenVideo(peerId);
});


/* incomingStream: This event is fired after peerJoined or stop
 * when SkylinkJS starts receiving the audio and video streams from that peer.
 * peerId: the id of joined peer 
 * stream: the stream of joiined peer
 * isSelf: the boolean parameter to tell if the stream is self.
 */
skylink.on('incomingStream', function(peerId, stream, isSelf) {
  console.log("incomingStream peerId: ", peerId);
  if(isSelf){
    console.log('incomingStream: isSelf');
  }
  // look for the index of peerId in peerIds
  var index = peerIds.indexOf(peerId);
  // store streams according to peerId
  streams[index] = stream;
  // search for video tag of id === peerId
  var v = document.getElementById(peerId);
  // attach stream to video tag
  attachMediaStream(v, stream);

  /* There are two cases:
   * 1.There is no exsited fullscreen. Ex: user just starts video 
   * 2.When a peer shared screen, skylink will send the current fullscreen peer's
   *   sharescreen stream. We should put it in the fullscreen
   */
  if(fullscreenId === peerId){
    projectFullscreenVideo(peerId);
  }

});



/* peerLeft: informs you that a peer has left the room. Ee look in the DOM
 * for the video element with the events peerId and remove it.
 */
skylink.on('peerLeft', function(peerId) {
  /* remove small screen when peer left */
  removeSmallscreenVideo(peerId);

  /* if the peer is in the fullscreen, remove fullscreen as well */
  if(peerId === fullscreenId){
    removeFullscreenVideo(peerId)
  }
});




/* mediaAccessSuccess: The user needs to authorize his browser to 
 * allow your website access to their camera, microphone or both.
 */
skylink.on('mediaAccessSuccess', function(stream) {
  console.log("in mediaAccessSuccess");
});

// Initialize and joinRoom
skylink.init({
  apiKey: '6000d611-eb29-495a-89f5-3c54b323e674',//'52a88d04-cc43-4e3d-b911-ead23a5fa0c8', // Get your own key at developer.temasys.com.sg
  defaultRoom: 'GogabE'//getffRoomId()
}, function (error, success) {
  if (error) {
    console.log('skylink.init => Error msg:', error);
  } else {
    console.log('skylink.init => success msg', success);
  }
});




// start join room
function start(event) {
  skylink.joinRoom({
    audio: true,
    video: true
  }, function (error, success) {
    if (error) {
  'Error: ' + (error.error.message || error.error);
    } else {
      // hide 'start' button after video created
      event.target.style.visibility = 'hidden';
      document.getElementById("stop-btn").style.visibility = "";
    }
  });
}



// stop the video meeting
function stop(event) {
  // hide the stop button
  event.target.style.visibility = 'hidden';
  skylink.leaveRoom(function(error, success){
    if(error){
      console.log("stop function error");
    }else{
      console.log("stop function success");
      document.getElementById("start-btn").style.visibility = "";
    }
  });
  console.log("stop function finish");
}



/* get Room ID */
function getRoomId() {
  var roomId = document.cookie.match(/roomId=([a-z0-9-]{36})/);
  if(roomId) {
    return roomId[1];
  }
  else {
    roomId = skylink.generateUUID();
    var date = new Date();
    date.setTime(date.getTime() + (30*24*60*60*1000));
    document.cookie = 'roomId=' + roomId + '; expires=' + date.toGMTString() + '; path=/';
    return roomId;
  }
};




/* project video to fullscreen video */
function projectFullscreenVideo(peerId){
  console.log("in projectFullscreen");

  var vFullscreen = document.getElementById('vFullscreen');
  // set the current fullscreenId
  fullscreenId = peerId;
  // set these is fullscreen stream
  existFullscreen = true;

  // get the index of peerId in peerIds
  var index = peerIds.indexOf(peerId);
  // attach stream to full screem video tag
  attachMediaStream(vFullscreen, streams[index]);

  // call .load() to prevent video stuck
  vFullscreen.load();
}




/* new small screen video */
function addSmallscreenVideo(peerId){
  console.log("in add small screen");
  peerIds.push(peerId);
  var v = createVideoTag(peerId);
  var li = createLiTag(v, peerId);
  // figcaption tag is to have video hover effect
  var figcaption = createFigcaptionTag(peerId);
  var ul = document.getElementById(VIDEO_LIST_NAME);
  ul.appendChild(li);
  li.appendChild(v);
  li.appendChild(figcaption);
}


/* create video object */
function createVideoTag(peerId){
  /* create video tag: <video></video> */
  var v = document.createElement('video');
  /* set attributes of video tage */ 
  v.autoplay = true;
  v.muted = true; // Added to avoid feedback when testing locally
  v.id = peerId;
  v.classList.add('smallscreen');
  if(peerId === fullscreenId){
    v.classList.add("video-click");
  }
  return v;
}




/* create li object */
function createLiTag(v, peerId){
  var li = document.createElement('li');
  li.classList.add("imghvr-fade");
  // event that when video is clicked, it switches to fullscreen.
  li.addEventListener("click", function(){
    if(v.id !== fullscreenId){
      var vOld = document.getElementById(fullscreenId);
      vOld.classList.remove("video-click");

      var figcaptionOld = document.getElementById(FIGCAPTION + fullscreenId);
      figcaptionOld.style.visibility= "";

      var figcaptionNew = li.getElementsByTagName("figcaption")[0];
      figcaptionNew.style.visibility = "hidden";
      
      v.classList.add("video-click");
      projectFullscreenVideo(peerId);
    }
  });
  li.id = VIDEO_LIST_NAME + peerId;
  return li;
}




/* create figcaption object */
function createFigcaptionTag(peerId){
  var figcaption = document.createElement('figcaption');
  figcaption.id = FIGCAPTION + peerId;
  figcaption.classList.add('video-hover');
  figcaption.innerHTML = "Click to Fullscreen";
  if(peerId === fullscreenId){
    figcaption.style.visibility = "hidden";
  }
  return figcaption;
}




/* remove self screen video*/
function removeSelfscreen(peerId){
  var myVideo = document.getElementById("my-video");
  // reload the video
  myVideo.load();
}




/* remove smallscreen video*/
function removeSmallscreenVideo(peerId){
  var index = peerIds.indexOf(peerId);
  // remove element in peerIds
  peerIds.splice(index, 1);
  // remove element in streams
  streams.splice(index, 1);
  // remove li tag in the DOM
  removeVideosItem(peerId);
}



/* remove fullscreen video */
function removeFullscreenVideo(peerId){
  var firstVideoId = peerIds[0];
  projectFullscreenVideo(firstVideoId);
  if(peerIds.length === 0){
    existFullscreen = false;
  }
}



/* remove li tag from video list */
function removeVideosItem(peerId){
  var v = document.getElementById(VIDEO_LIST_NAME + peerId);
  v.parentNode.removeChild(v);
}



/* stop sharing screen */
function stopScreen(){
  console.log('stop share screen');
  skylink.stopScreen();
}



function shareScreen() {
  /* TODO: 
   * The following commented codes should be added when run on server
   */
  // if(location.protocol === 'http:') {
  //     if(window.confirm('To use screensharing you\'ll have to visit the secure HTTPS version of this site.\nWould you like to go there now?')) {
  //         location = 'https://' + location.host + location.pathname;
  //     }
  //     return;
  // }
  skylink.shareScreen(function (error, success) {
    console.log('shareScreen in');
    if (success) {
      console.log('shareScreen success', success);
      var v = document.getElementById('my-video');
      attachMediaStream(v, success);
    }else{
      console.log('shareScreen fail', success);
    }
  });
  console.log('shareScreen out');
}

function lock(){
  // TODO
}

function unlock(){
  // TODO
}

function microphone(){
  // TODO
}

function camera(){
  // TODO
}

