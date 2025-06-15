import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js"; import { getFirestore, doc, getDoc, updateDoc, increment, setDoc, getDocs, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyDz7JexQoEnbx16lVUMbN5RzyOGKEbetWI", authDomain: "anonprompt-4f636.firebaseapp.com", projectId: "anonprompt-4f636", storageBucket: "anonprompt-4f636.appspot.com", messagingSenderId: "907184769134", appId: "1:907184769134:web:905a3ea89f1090442afe7f" };

const app = initializeApp(firebaseConfig); const db = getFirestore(app);

const alertBanner = document.getElementById("alertBanner"); const postContainer = document.getElementById("postContainer"); const commentInput = document.getElementById("commentInput"); const sendComment = document.getElementById("sendComment"); const comments = document.getElementById("comments"); const likeBtn = document.getElementById("likeBtn"); const likeCount = document.getElementById("likeCount"); const reportPopup = document.getElementById("reportPopup"); const reportYesBtn = document.getElementById("reportYesBtn"); const reportNoBtn = document.getElementById("reportNoBtn");

let postId = null;

const webhookBase64 = "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTM4MzQzNjkyMzAzMjMwOTc2MC9CZWllbjEtOVg3X0szZVlGYUl0QWZSYTFwb3NSQnRDWGZQYW9GWDBnQlFfVDMzdTgtb1BIXzU1aXJfS0s5OTI5NzBwVQ=="; const webhookUrl = atob(webhookBase64);

function showAlert(msg, type = "success") { alertBanner.textContent = msg; alertBanner.className = type === "error" ? "error" : "success"; alertBanner.style.display = "block"; setTimeout(() => alertBanner.style.display = "none", 3000); }

function escapeHTML(text) { return text.replace(/[&<>"]'/g, m => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' }[m])); }

function getPostIdFromURL() { const urlParams = new URLSearchParams(window.location.search); return urlParams.get("post"); }

async function loadPost() { const docRef = doc(db, "prompts", postId); const snap = await getDoc(docRef); if (!snap.exists()) { window.location.href = "404.html"; return; }

const data = snap.data(); likeCount.textContent = data.likes || 0;

postContainer.innerHTML = <div class="prompt-content"> <p>${escapeHTML(data.text)}</p> <span id="reportBtn" class="material-icons" style="position:absolute;top:10px;right:10px;">flag</span> </div>;

document.getElementById("reportBtn").onclick = () => { reportPopup.style.display = "flex"; }; }

async function loadComments() { comments.innerHTML = ""; const snap = await getDocs(collection(db, "prompts", postId, "comments")); snap.forEach(doc => { const c = doc.data(); const el = document.createElement("div"); el.className = "comment"; el.textContent = c.text; comments.appendChild(el); }); }

sendComment.onclick = async () => { const text = commentInput.value.trim(); if (!text) return showAlert("Comment is empty", "error");

await addDoc(collection(db, "prompts", postId, "comments"), { text, time: Date.now() });

commentInput.value = ""; loadComments(); };

likeBtn.onclick = async () => { const key = liked_${postId}; const liked = localStorage.getItem(key); const docRef = doc(db, "prompts", postId); await updateDoc(docRef, { likes: increment(liked ? -1 : 1) });

if (liked) { localStorage.removeItem(key); likeBtn.textContent = "favorite_border"; likeCount.textContent = parseInt(likeCount.textContent) - 1; } else { localStorage.setItem(key, "1"); likeBtn.textContent = "favorite"; likeCount.textContent = parseInt(likeCount.textContent) + 1; } };

reportYesBtn.onclick = async () => { const lastReportKey = report_${postId}; const lastReportTime = localStorage.getItem(lastReportKey); const now = Date.now();

if (lastReportTime && now - parseInt(lastReportTime) < 5 * 60 * 1000) { showAlert("You already reported this post recently", "error"); reportPopup.style.display = "none"; return; }

await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: @everyone Report received for post: https://github.com/Gwishyman/anonprompt/post.html?post=${postId} }) }); localStorage.setItem(lastReportKey, now.toString()); showAlert("Reported successfully."); reportPopup.style.display = "none"; };

reportNoBtn.onclick = () => { reportPopup.style.display = "none"; };

window.onload = async () => { postId = getPostIdFromURL(); if (!postId) { window.location.href = "404.html"; return; }

await loadPost(); await loadComments();

if (localStorage.getItem(liked_${postId})) { likeBtn.textContent = "favorite"; } };
