import { app } from "./firebase-config.js";

import { getAuth, GoogleAuthProvider, signInWithPopup } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getFirestore, collection, addDoc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getStorage, ref, uploadBytes, getDownloadURL } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser = null;
let currentChat = null;

window.login = async function() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);

  currentUser = result.user;

  document.getElementById("login").style.display="none";
  document.getElementById("chat").style.display="block";
};

window.startChat = function(otherUserEmail){
  let emails = [currentUser.email, otherUserEmail].sort();
  currentChat = emails.join("_");
  loadMessages();
};

window.sendMessage = async function(){
  let msg = document.getElementById("msg").value;

  await addDoc(collection(db,"chats",currentChat,"messages"),{
    text:msg,
    sender:currentUser.email
  });
};

function loadMessages(){
  onSnapshot(collection(db,"chats",currentChat,"messages"),(snapshot)=>{
    let html="";
    snapshot.forEach(doc=>{
      let data=doc.data();

      if(data.image){
        html+=`<img src="${data.image}" width="100"/>`;
      }

      if(data.sender===currentUser.email){
        html+=`<div class="message sent">${data.text||""}</div>`;
      } else {
        html+=`<div class="message received">${data.text||""}</div>`;
      }
    });

    document.getElementById("messages").innerHTML=html;
  });
}

window.sendImage = async function(){
  let file=document.getElementById("file").files[0];
  let storageRef=ref(storage,file.name);

  await uploadBytes(storageRef,file);
  let url=await getDownloadURL(storageRef);

  await addDoc(collection(db,"chats",currentChat,"messages"),{
    image:url,
    sender:currentUser.email
  });
};

window.updateStatus = async function(){
  let text=document.getElementById("statusInput").value;
  await addDoc(collection(db,"status"),{text});
};

onSnapshot(collection(db,"status"),(snapshot)=>{
  let html="";
  snapshot.forEach(doc=>{
    html+=`<p>🟢 ${doc.data().text}</p>`;
  });
  document.getElementById("statusList").innerHTML=html;
});

window.generateCode = function(){
  let code=Math.random().toString(36).substring(2,8);
  document.getElementById("code").innerText=code;
};

let peerConnection;
let localStream;

window.startVideo = async function(){
  localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});

  document.getElementById("localVideo").srcObject = localStream;

  peerConnection = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  localStream.getTracks().forEach(track=>{
    peerConnection.addTrack(track,localStream);
  });

  peerConnection.ontrack = event=>{
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };
};
