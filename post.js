import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  updateDoc,
  addDoc,
  increment,
  getDoc
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

const alertBanner = document.getElementById("alertBanner");
const postBox = document.getElementById("postBox");
const likeBtn = document.getElementById("likeBtn");
const reportBtn = document.getElementById("reportBtn");
const likeCount = document.getElementById("likeCount");
const timestampEl = document.getElementById("timestamp");
const commentsContainer = document.getElementById("comments");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("post");

if (!postId) {
  window.location.href = "404.html";
}

// Base64 decode function
function b64DecodeUnicode(str) {
  // atob to decode base64 then decodeURIComponent to handle UTF-8 characters
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str), c =>
        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
      )
      .join("")
  );
}

const encryptedWebhookBase64 = "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTM4MzQzNjkyMzAzMjMwOTc2MC9CZWllbjEtOVg3X0szZVlGYUl0QWZSYTFwb3NSQnRDWGZQYW9GWDBnQlFfVDMzdTgtb1BIXzU1aXJfS0s5OTI5NzBwVQ==";
const webhookUrl = b64DecodeUnicode(encryptedWebhookBase64);

const postRef = doc(db, "prompts", postId);
const commentsRef = collection(db, "prompts", postId, "comments");

function showBanner(msg, type = "info") {
  alertBanner.textContent = msg;
  alertBanner.style.backgroundColor = type === "error" ? "#d32f2f" : "#4caf50";
  alertBanner.style.display = "block";
  setTimeout(() => {
    alertBanner.style.display = "none";
  }, 3500);
}

function renderPost(data) {
  postBox.textContent = data.text || "(No content)";
  likeCount.textContent = data.likes || 0;
  timestampEl.textContent = data.timestamp
    ? new Date(data.timestamp.seconds * 1000).toLocaleString()
    : "";

  // Update like button color if already liked
  if (localStorage.getItem("liked_" + postId)) {
    likeBtn.classList.add("liked");
  } else {
    likeBtn.classList.remove("liked");
  }
}

async function likePost() {
  const likedKey = "liked_" + postId;
  if (localStorage.getItem(likedKey)) {
    showBanner("You already liked this post.", "error");
    return;
  }
  try {
    await updateDoc(postRef, { likes: increment(1) });
    localStorage.setItem(likedKey, "true");
    likeBtn.classList.add("liked");
    showBanner("Liked post!");
  } catch {
    showBanner("Failed to like post.", "error");
  }
}

async function reportPost() {
  const reason = prompt("Please enter reason to report this post:");
  if (!reason || !reason.trim()) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        reason: reason.trim(),
        timestamp: new Date().toISOString()
      })
    });
    showBanner("Report sent. Thank you.");
  } catch {
    showBanner("Failed to send report.", "error");
  }
}

function renderComments(snapshot) {
  commentsContainer.innerHTML = "";
  snapshot.forEach(doc => {
    const comment = doc.data();
    const div = document.createElement("div");
    div.className = "comment";
    div.textContent = comment.text || "";
    commentsContainer.appendChild(div);
  });
}

commentForm.addEventListener("submit", async e => {
  e.preventDefault();
  const text = commentInput.value.trim();
  if (!text) return;
  try {
    await addDoc(commentsRef, { text, timestamp: new Date() });
    commentInput.value = "";
    showBanner("Comment added.");
  } catch {
    showBanner("Failed to add comment.", "error");
  }
});

likeBtn.addEventListener("click", likePost);
reportBtn.addEventListener("click", reportPost);

onSnapshot(postRef, docSnap => {
  if (!docSnap.exists()) {
    window.location.href = "404.html";
    return;
  }
  renderPost(docSnap.data());
});

onSnapshot(commentsRef, renderComments);
