import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyDz7JexQoEnbx16lVUMbN5RzyOGKEbetWI",
  authDomain: "anonprompt-4f636.firebaseapp.com",
  projectId: "anonprompt-4f636",
});

const db = getFirestore(app);
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("post");
const promptRef = doc(db, "prompts", postId);
const promptContainer = document.getElementById("promptContainer");
const likeBtn = document.getElementById("likeBtn");

async function loadPrompt() {
  const snap = await getDoc(promptRef);
  if (!snap.exists()) {
    promptContainer.textContent = "Post not found.";
    return;
  }
  const data = snap.data();
  promptContainer.innerHTML = `<p>${data.text}</p><small>${data.timestamp?.toDate().toLocaleString()}</small>`;
  likeBtn.innerText = `👍 ${data.upvotes || 0}`;
}

likeBtn.addEventListener("click", async () => {
  await updateDoc(promptRef, {
    upvotes: increment(1)
  });
  const updated = await getDoc(promptRef);
  likeBtn.innerText = `👍 ${updated.data().upvotes || 0}`;
});

async function loadComments() {
  const q = collection(db, `prompts/${postId}/comments`);
  const snap = await getDocs(q);
  const container = document.getElementById("comments");
  container.innerHTML = "";
  snap.forEach(doc => {
    const d = doc.data();
    const div = document.createElement("div");
    div.textContent = `${d.text} — ${d.timestamp?.toDate().toLocaleString()}`;
    container.appendChild(div);
  });
}

window.submitComment = async () => {
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;
  await addDoc(collection(db, `prompts/${postId}/comments`), {
    text,
    timestamp: serverTimestamp()
  });
  input.value = "";
  loadComments();
};

loadPrompt();
loadComments();