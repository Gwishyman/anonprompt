import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyDz7JexQoEnbx16lVUMbN5RzyOGKEbetWI",
  authDomain: "anonprompt-4f636.firebaseapp.com",
  projectId: "anonprompt-4f636",
});

const db = getFirestore(app);
const promptInput = document.getElementById("promptInput");
const promptsDiv = document.getElementById("prompts");
const alertBanner = document.getElementById("alertBanner");

function showAlert(message) {
  alertBanner.textContent = message;
  alertBanner.style.display = "block";
  setTimeout(() => {
    alertBanner.style.display = "none";
  }, 3000);
}

window.postPrompt = async () => {
  const text = promptInput.value.trim();
  if (!text) return showAlert("Please write something.");
  try {
    await addDoc(collection(db, "prompts"), {
      text,
      timestamp: serverTimestamp(),
      upvotes: 0
    });
    promptInput.value = "";
    showAlert("Prompt posted!");
  } catch (e) {
    showAlert("Failed to post.");
    console.error(e);
  }
};

onSnapshot(query(collection(db, "prompts"), orderBy("timestamp", "desc")), snap => {
  promptsDiv.innerHTML = "";
  snap.forEach(doc => {
    const d = doc.data();
    const div = document.createElement("div");
    div.className = "prompt";
    const a = document.createElement("a");
    a.href = `post.html?post=${doc.id}`;
    a.style.color = "inherit";
    a.style.textDecoration = "none";
    div.innerHTML = `
      <div>${d.text}</div>
      <div class="meta">${new Date(d.timestamp?.toDate()).toLocaleString()}</div>
    `;
    a.appendChild(div);
    promptsDiv.appendChild(a);
  });
});