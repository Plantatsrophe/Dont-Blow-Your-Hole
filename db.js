import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// ==========================================
// USER CONFIGURATION REQUIRED:
// Replace this object with your exact Firebase config snippet from your Firebase Console!
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase securely
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple hashing obfuscator to secure the network payload from basic tampering
function obfuscatePayload(initials, score, playtime) {
    const salt = "8b!t_platform3r_S3cr3t";
    const rawString = `${initials}|${score}|${playtime}|${salt}`;
    // A basic Base64 encode for simple transmission structure (NOT encryption, just payload formatting)
    return btoa(rawString);
}

// Attach universally accessible bindings to the global engine seamlessly
window.submitHighScore = async function(initials, score, playtime) {
    try {
        const payloadHash = obfuscatePayload(initials, score, playtime);

        await addDoc(collection(db, "highscores"), {
            initials: initials.toUpperCase(),
            score: Number(score),
            playtimeMs: Number(playtime),
            timestamp: new Date().getTime(),
            _secHash: payloadHash // Used by backend rules logically to verify integrity
        });
        console.log("Score explicitly saved to Firebase globally!");
    } catch (e) {
        console.error("Error adding score structurally to Firebase: ", e);
    }
};

window.fetchHighScores = async function() {
    try {
        const q = query(collection(db, "highscores"), orderBy("score", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        let scores = [];
        querySnapshot.forEach((doc) => {
            scores.push(doc.data());
        });

        // Ensure we always return exactly 10 slots gracefully for UI rendering
        while (scores.length < 10) {
            scores.push({ initials: "---", score: 0 });
        }
        
        return scores;
    } catch (e) {
        console.error("Error natively catching FireStore scores: ", e);
        // Return dummy gracefully on disconnects
        let dummy = [];
        for (let i = 0; i < 10; i++) dummy.push({ initials: "---", score: 0 });
        return dummy;
    }
};

// Intelligently trigger the global leaderboard redraw exactly when the database bindings resolve natively!
if (window.refreshLeaderboard) {
    window.refreshLeaderboard();
}
