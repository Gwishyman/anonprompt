import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, setDoc, deleteDoc, getDocs
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
const contentEl = document.getElementById("postContent");
const likeBtn = document.getElementById("likeBtn");
const likeCount = document.getElementById("likeCount");
const commentInput = document.getElementById("commentInput");
const commentBtn = document.getElementById("commentBtn");
const commentsContainer = document.getElementById("comments");
const reportBtn = document.getElementById("reportBtn");

// Show error and redirect if post is invalid
getDoc(postRef).then(docSnap => {
  if (!docSnap.exists()) {
    window.location.href = "404.html";
    return;
  }
  const data = docSnap.data();
  contentEl.textContent = data.text || "(No content)";
}).catch(() => {
  window.location.href = "404.html";
});

// Load comments (newest first)
const commentsRef = collection(db, "prompts", postId, "comments");
const q = query(commentsRef, orderBy("timestamp", "desc"));
onSnapshot(q, snapshot => {
  commentsContainer.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.className = "comment";
    div.style.marginBottom = "10px";
    div.style.background = "#1c1c1c";
    div.style.padding = "10px";
    div.style.borderRadius = "5px";
    div.textContent = data.text;
    commentsContainer.appendChild(div);
  });
});

// Submit comment
commentBtn.onclick = async () => {
  const text = commentInput.value.trim();
  if (!text) return;
  commentInput.value = "";
  try {
    await addDoc(commentsRef, {
      text,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    showAlert("Failed to comment", true);
  }
};

// Likes (per-IP via localStorage)
const voteRef = doc(db, "prompts", postId, "votes", localStorage.getItem("anonprompt_vote_id") || generateId());
localStorage.setItem("anonprompt_vote_id", voteRef.id);

function updateLikeStatus() {
  getDocs(collection(db, "prompts", postId, "votes")).then(snapshot => {
    likeCount.textContent = snapshot.size;
  });
  getDoc(voteRef).then(doc => {
    if (doc.exists()) {
      likeBtn.style.color = "red";
    } else {
      likeBtn.style.color = "white";
    }
  });
}

likeBtn.onclick = async () => {
  const docSnap = await getDoc(voteRef);
  if (docSnap.exists()) {
    await deleteDoc(voteRef);
  } else {
    await setDoc(voteRef, { liked: true });
  }
  updateLikeStatus();
};

updateLikeStatus();

// Report system
reportBtn.onclick = () => {
  if (document.getElementById("reportPopup")) return;

  const lastReport = JSON.parse(localStorage.getItem("lastReport") || "{}");
  if (lastReport[postId] && Date.now() - lastReport[postId] < 5 * 60 * 1000) {
    showAlert("You can only report this post once every 5 minutes.", true);
    return;
  }

  const popup = document.createElement("div");
  popup.id = "reportPopup";
  popup.style.position = "fixed";
  popup.style.top = "0"; popup.style.left = "0";
  popup.style.width = "100%"; popup.style.height = "100%";
  popup.style.background = "rgba(0,0,0,0.8)";
  popup.style.display = "flex"; popup.style.alignItems = "center";
  popup.style.justifyContent = "center"; popup.style.zIndex = "1000";

  popup.innerHTML = `
    <div style="background:#1e1e1e;padding:20px;border-radius:10px;text-align:center;width:90%;max-width:300px">
      <h3>Report this post?</h3>
      <p>This action will notify the moderators.</p>
      <button id="yesReport" style="margin:5px;background:#f44336;color:white;padding:10px;border:none;border-radius:5px">Yes</button>
      <button id="noReport" style="margin:5px;background:#444;color:white;padding:10px;border:none;border-radius:5px">No</button>
    </div>
  `;
  document.body.appendChild(popup);

  document.getElementById("yesReport").onclick = async () => {
    popup.remove();
    localStorage.setItem("lastReport", JSON.stringify({ ...lastReport, [postId]: Date.now() }));

    const webhook = atob("aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTM4MzQzNjkyMzAzMjMwOTc2MC9CZWllbjEtOVg3X0szZVlGYUl0QWZSYTFwb3NSQnRDWGZQYW9GWDBnQlFfVDMzdTgtb1BIXzU1aXJfS0s5OTI5NzBwVQ==");
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `@everyone Report received for post: https://gwishyman.github.io/anonprompt/post.html?post=${postId}`
      })
    });

    showAlert("Report sent successfully.");
  };

  document.getElementById("noReport").onclick = () => popup.remove();
};

// Generate random ID for voting
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Show banner alert
function showAlert(msg, isError = false) {
  const banner = document.getElementById("alertBanner");
  banner.textContent = msg;
  banner.style.background = isError ? "#f44336" : "#4caf50";
  banner.style.color = "white";
  banner.style.display = "block";
  setTimeout(() => {
    banner.style.display = "none";
  }, 4000);
    }
