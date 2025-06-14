import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  updateDoc,
  addDoc,
  increment
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

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("post");

if (!postId) {
  window.location.href = "404.html";
}

const postRef = doc(db, "prompts", postId);
const commentsRef = collection(db, "prompts", postId, "comments");

function renderPost(data) {
  const postBox = document.getElementById("postBox");
  const liked = localStorage.getItem("liked_" + postId);
  postBox.innerHTML = `
    <p>${data.text}</p>
    <div class="interaction">
      <span>
        <span class="material-icons" id="likeBtn" style="color:${liked ? "red" : "white"}; cursor:pointer;">favorite</span>
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
}

onSnapshot(postRef, (docSnap) => {
  if (!docSnap.exists()) {
    window.location.href = "404.html";
    return;
  }
  renderPost(docSnap.data());
});

onSnapshot(commentsRef, (snapshot) => {
  const container = document.getElementById("comments");
  container.innerHTML = "";
  snapshot.forEach((doc) => {
    const comment = doc.data();
    const div = document.createElement("div");
    div.className = "comment";
    div.textContent = comment.text;
    container.appendChild(div);
  });
});

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
