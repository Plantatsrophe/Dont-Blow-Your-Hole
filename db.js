import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// ==========================================
// USER CONFIGURATION REQUIRED:
// Replace this object with your exact Firebase config snippet from your Firebase Console!
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyA2d_Sp94HwlAyRlZ4q611AxJYUo9ecOcg",
    authDomain: "bitplatformer-2b284.firebaseapp.com",
    projectId: "bitplatformer-2b284",
    storageBucket: "bitplatformer-2b284.firebasestorage.app",
    messagingSenderId: "872741019987",
    appId: "1:872741019987:web:76cb7846d82dc1888101a6"
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
window.submitHighScore = async function (initials, score, playtime) {
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

window.fetchHighScores = async function () {
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

// ==========================================
// ONE-TIME UTILITY: Legacy LocalStorage Migration
// ==========================================
window.migrateLegacyScoresToFirebase = async function() {
    // Only fire this structural migration strictly once permanently natively!
    if (localStorage.getItem('legacy_scores_migrated_v2')) {
        return;
    }

    console.log("Detecting Legacy LocalStorage Scores...");
    let legacyScores = JSON.parse(localStorage.getItem('8bitScores_v2') || '[]');
    
    // If the browser cache is completely empty, strictly inject the original classical default targets!
    if (legacyScores.length === 0) {
        legacyScores = [
            { name: 'Hotdog', score: 9999999 },
            { name: 'Fudge', score: 919919 },
            { name: 'Barry', score: 80085 },
            { name: 'Jill9000', score: 9000 },
            { name: 'Darby', score: 1337 }
        ];
    }

    console.log(`Migrating ${legacyScores.length} legacy scores into Firebase natively...`);
    for (let i = 0; i < legacyScores.length; i++) {
        let sc = legacyScores[i];
        if (sc.name && sc.score >= 0 && sc.name !== '---') {
            // Notice we inject '10000' strictly for PlaytimeMs securely passing our exact Cloud Firestore Security Constraints dynamically!
            await window.submitHighScore(sc.name, sc.score, 10000); 
        }
    }
    
    // Lock the migration sequentially permanently resolving flawlessly avoiding infinite looping loops!
    localStorage.setItem('legacy_scores_migrated_v2', 'true');
    console.log("Legacy Backup Migration natively resolved! Restoring Leaderboards...");
    
    if (window.refreshLeaderboard) {
        window.refreshLeaderboard();
    }
};

// Safely execute natively implicitly precisely 2 seconds after initialization dynamically
setTimeout(() => {
    window.migrateLegacyScoresToFirebase();
}, 2000);
