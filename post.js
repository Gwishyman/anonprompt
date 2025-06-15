import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, collection, addDoc, onSnapshot, setDoc, getDocs, deleteDoc
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

const alertBox = document.getElementById("alert");
function showAlert(msg) {
  alertBox.innerText = msg;
  alertBox.style.display = "block";
  setTimeout(() => alertBox.style.display = "none", 3000);
}

const params = new URLSearchParams(location.search);
const postId = params.get("post");

if (!postId) location.href = "404.html";

const postRef = doc(db, "prompts", postId);
const commentInput = document.getElementById("commentInput");
const commentList = document.getElementById("commentList");
const postTextEl = document.getElementById("postText");
const likeBtn = document.getElementById("likeBtn");
const likeCountEl = document.getElementById("likeCount");

let liked = false;
let likeCount = 0;
const likeKey = `like_${postId}`;

async function loadPost() {
  const snap = await getDoc(postRef);
  if (!snap.exists()) return location.href = "404.html";

  const data = snap.data();
  postTextEl.innerText = data.text || "[No content]";
}

async function toggleLike() {
  liked = !liked;
  likeBtn.innerText = liked ? "favorite" : "favorite_border";
  likeCount += liked ? 1 : -1;
  likeCount = Math.max(likeCount, 0);
  likeCountEl.innerText = likeCount;
  localStorage.setItem(likeKey, liked ? "1" : "0");

  const votesRef = collection(postRef, "votes");
  const ip = localStorage.getItem("user_ip") || Math.random().toString(36).slice(2);
  localStorage.setItem("user_ip", ip);
  const voteDoc = doc(votesRef, ip);

  if (liked) {
    await setDoc(voteDoc, { liked: true });
  } else {
    await deleteDoc(voteDoc);
  }
}

async function loadLikes() {
  const votesRef = collection(postRef, "votes");
  const votesSnap = await getDocs(votesRef);
  likeCount = votesSnap.size;
  likeCountEl.innerText = likeCount;

  liked = localStorage.getItem(likeKey) === "1";
  likeBtn.innerText = liked ? "favorite" : "favorite_border";
}

async function submitComment() {
  const text = commentInput.value.trim();
  if (!text) return showAlert("Comment cannot be empty");
  commentInput.value = "";
  try {
    await addDoc(collection(postRef, "comments"), {
      text,
      created: Date.now()
    });
  } catch (e) {
    showAlert("Failed to comment.");
  }
}

function loadComments() {
  const commentsRef = collection(postRef, "comments");
  onSnapshot(commentsRef, snap => {
    const comments = [];
    snap.forEach(doc => comments.push(doc.data()));
    comments.sort((a, b) => b.created - a.created);
    commentList.innerHTML = comments.map(c => `
      <div class="comment">${c.text}</div>
    `).join("");
  });
}

async function openReport() {
  const last = localStorage.getItem(`report_${postId}`);
  const now = Date.now();
  if (last && now - parseInt(last) < 5 * 60 * 1000) {
    return showAlert("You already reported this post recently.");
  }

  const confirm = window.confirm("Report this post?");
  if (!confirm) return;

  const webhook = atob("aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTM4MzQzNjkyMzAzMjMwOTc2MC9CZWllbjEtOVg3X0szZVlGYUl0QWZSYTFwb3NSQnRDWGZQYW9GWDBnQlFfVDMzdTgtb1BIXzU1aXJfS0s5OTI5NzBwVQ==");

  fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `@everyone Report received for post: https://gwishyman.github.io/anonprompt/post.html?post=${postId}`
    })
  });

  localStorage.setItem(`report_${postId}`, now.toString());
  showAlert("Reported.");
}

// Init
loadPost();
loadLikes();
loadComments();
