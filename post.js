import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, updateDoc, arrayUnion, collection, addDoc, onSnapshot, increment
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
if (!postId) location.href = "404.html";

const postRef = doc(db, "prompts", postId);

getDoc(postRef).then(docSnap => {
  if (!docSnap.exists()) {
    location.href = "404.html";
    return;
  }
  const data = docSnap.data();
  renderPost(data);
}).catch(() => location.href = "404.html");

function renderPost(data) {
  const postBox = document.getElementById("postBox");
  const liked = localStorage.getItem("liked_" + postId);
  postBox.innerHTML = `
    <p>${data.text}</p>
    <div class="interaction">
      <span>
        <span class="material-icons" id="likeBtn" style="color:${liked ? 'red' : 'white'}">favorite</span>
        <span id="likeCount">${data.likes || 0}</span>
      </span>
      <span>${new Date(data.timestamp?.seconds * 1000).toLocaleString()}</span>
    </div>
  `;
  document.getElementById("likeBtn").onclick = likePost;
}

function likePost() {
  const likedKey = "liked_" + postId;
  if (localStorage.getItem(likedKey)) return;
  updateDoc(postRef, { likes: increment(1) });
  localStorage.setItem(likedKey, "true");
  const countEl = document.getElementById("likeCount");
  countEl.textContent = parseInt(countEl.textContent) + 1;
  document.getElementById("likeBtn").style.color = "red";
}

// Load comments
const commentsRef = collection(db, "prompts", postId, "comments");
onSnapshot(commentsRef, snapshot => {
  const container = document.getElementById("comments");
  container.innerHTML = "";
  snapshot.forEach(doc => {
    const comment = doc.data();
    const div = document.createElement("div");
    div.className = "comment";
    div.textContent = comment.text;
    container.appendChild(div);
  });
});

// Post a comment
window.submitComment = async () => {
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;
  await addDoc(commentsRef, {
    text,
    timestamp: new Date()
  });
  input.value = "";
};
