import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
const postContainer = document.getElementById("postContainer");
const reportPopup = document.getElementById("reportPopup");
const reportYesBtn = document.getElementById("reportYesBtn");
const reportNoBtn = document.getElementById("reportNoBtn");

let currentPostId = null;

// Base64 encoded webhook URL (your provided one)
const WEBHOOK_BASE64 = "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTM4MzQzNjkyMzAzMjMwOTc2MC9CZWllbjEtOVg3X0szZVlGYUl0QWZSYTFwb3NSQnRDWGZQYW9GWDBnQlFfVDMzdTgtb1BIXzU1aXJfS0s5OTI5NzBwVQ==";

// Decode base64 webhook URL
function decodeWebhookUrl(base64) {
  try {
    return atob(base64);
  } catch {
    return null;
  }
}

function showAlert(message, type = "success") {
  alertBanner.textContent = message;
  alertBanner.className = type === "error" ? "error" : "success";
  alertBanner.style.display = "block";
  setTimeout(() => {
    alertBanner.style.display = "none";
  }, 3000);
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (match) => {
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return escapeMap[match];
  });
}

function getPostIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("post");
}

async function loadPost(postId) {
  const postDoc = await getDoc(doc(db, "prompts", postId));
  if (!postDoc.exists()) {
    window.location.href = "404.html";
    return;
  }
  const postData = postDoc.data();

  postContainer.innerHTML = `
    <div class="prompt-content">
      <p>${escapeHtml(postData.text)}</p>
      <button id="reportBtn" class="icon-button" title="Report Post" aria-label="Report Post">
        <span class="material-icons">flag</span>
      </button>
    </div>
  `;

  document.getElementById("reportBtn").addEventListener("click", () => {
    reportPopup.style.display = "flex";
  });

  currentPostId = postId;
}

async function sendReport() {
  if (!currentPostId) return;

  const webhookUrl = decodeWebhookUrl(WEBHOOK_BASE64);
  if (!webhookUrl) {
    showAlert("Failed to decode webhook URL.", "error");
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `@everyone Report received for post: https://github.com/Gwishyman/anonprompt/post.html?post=${currentPostId}` }),
    });

    if (!res.ok) {
      throw new Error(`Webhook returned status ${res.status}`);
    }

    showAlert("Report sent successfully.", "success");
  } catch (error) {
    showAlert("Failed to send report.", "error");
    console.error(error);
  }
}

reportYesBtn.addEventListener("click", () => {
  sendReport();
  reportPopup.style.display = "none";
});

reportNoBtn.addEventListener("click", () => {
  reportPopup.style.display = "none";
});

window.addEventListener("load", () => {
  const postId = getPostIdFromURL();
  if (!postId) {
    window.location.href = "404.html";
    return;
  }
  loadPost(postId);
});
