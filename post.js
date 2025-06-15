import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, collection, addDoc,
  onSnapshot, updateDoc, increment, setDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDz7JexQoEnbx16lVUMbN5RzyOGKEbetWI",
  authDomain: "anonprompt-4f636.firebaseapp.com",
  projectId: "anonprompt-4f636",
  storageBucket: "anonprompt-4f636.appspot.com",
  messagingSenderId: "907184769134",
  appId: "1:907184769134:web:905a3ea89f1090442afe7f"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const postId = new URLSearchParams(location.search).get("post");
const postRef = doc(db, "prompts", postId);
const postContainer = document.getElementById("postContainer");
const likeBtn = document.getElementById("likeBtn");
const likeCount = document.getElementById("likeCount");
const commentsContainer = document.getElementById("commentsContainer");
const alertBanner = document.getElementById("alertBanner");

if (!postId) location.href = "404.html";

function showBanner(msg, color = "#f44336") {
  alertBanner.innerText = msg;
  alertBanner.style.background = color;
  alertBanner.style.display = "block";
  setTimeout(() => alertBanner.style.display = "none", 3000);
}

// Load post
getDoc(postRef).then(snap => {
  if (!snap.exists()) return location.href = "404.html";
  postContainer.textContent = snap.data().text || "[No content]";
}).catch(() => location.href = "404.html");

// Likes
const ip = await (await fetch("https://api.ipify.org?format=json")).json().then(res => res.ip).catch(() => "unknown");
const voteRef = doc(db, "prompts", postId, "votes", ip);
let liked = false;

getDoc(voteRef).then(snap => {
  liked = snap.exists();
  likeBtn.innerText = liked ? "favorite" : "favorite_border";
});

onSnapshot(collection(db, "prompts", postId, "votes"), snap => {
  likeCount.textContent = snap.size;
});

likeBtn.onclick = async () => {
  if (!liked) {
    await setDoc(voteRef, { liked: true });
    liked = true;
    likeBtn.innerText = "favorite";
  } else {
    await setDoc(voteRef, {}, { merge: true });
    await updateDoc(voteRef, { liked: false });
    await voteRef.delete();
    liked = false;
    likeBtn.innerText = "favorite_border";
  }
};

// Comments
onSnapshot(collection(db, "prompts", postId, "comments"), snap => {
  commentsContainer.innerHTML = "";
  snap.forEach(doc => {
    const div = document.createElement("div");
    div.className = "comment";
    div.textContent = doc.data().text;
    commentsContainer.appendChild(div);
  });
});

window.submitComment = async () => {
  const text = document.getElementById("commentInput").value.trim();
  if (!text) return showBanner("Comment cannot be empty");
  try {
    await addDoc(collection(db, "prompts", postId, "comments"), {
      text,
      timestamp: Date.now()
    });
    document.getElementById("commentInput").value = "";
  } catch {
    showBanner("Failed to comment");
  }
};

// Report
const reportBtn = document.getElementById("reportBtn");
const reportedMap = new Map();

reportBtn.onclick = () => {
  if (reportedMap.get(postId) && Date.now() - reportedMap.get(postId) < 5 * 60 * 1000) {
    return showBanner("Already reported this post recently");
  }

  const confirmBox = confirm("Report this post?");
  if (!confirmBox) return;

  const webhook = atob("aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTM4MzQzNjkyMzAzMjMwOTc2MC9CZWllbjEtOVg3X0szZVlGYUl0QWZSYTFwb3NSQnRDWGZQYW9GWDBnQlFfVDMzdTgtb1BIXzU1aXJfS0s5OTI5NzBwVQ==");

  fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `@everyone Report received for post: https://gwishyman.github.io/anonprompt/post.html?post=${postId}`
    })
  }).then(() => {
    showBanner("Reported successfully", "#4caf50");
    reportedMap.set(postId, Date.now());
  }).catch(() => {
    showBanner("Failed to report");
  });
};
