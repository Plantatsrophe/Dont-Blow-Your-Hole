/**
 * FIREBASE DATA LAYER
 * Handles persistent high-score storage and retrieval via Google Cloud Firestore.
 * This module is integrated as an ES Module directly from the Firebase CDN.
 */

// @ts-ignore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
// @ts-ignore
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { staticLevels } from './levels.js';

// Expose static levels for global engine access
window.staticLevels = staticLevels;

/**
 * Firebase Project Configuration
 * Matches the 'bitplatformer-2b284' project environment.
 */
const firebaseConfig = {
    apiKey: "AIzaSyA2d_Sp94HwlAyRlZ4q611AxJYUo9ecOcg",
    authDomain: "bitplatformer-2b284.firebaseapp.com",
    projectId: "bitplatformer-2b284",
    storageBucket: "bitplatformer-2b284.firebasestorage.app",
    messagingSenderId: "872741019987",
    appId: "1:872741019987:web:76cb7846d82dc1888101a6"
};

// Initialize Firebase SDK
console.log("Firebase initializing for bitplatformer-2b284...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Firestore initialized successfully.");

/**
 * Simple payload obfuscator to deter casual network tampering.
 * Combines initials, score, and playtime with a server-side secret salt.
 * 
 * @param initials Player's name string
 * @param score Final numerical score
 * @param playtime Total time elapsed in ms
 * @returns A base64-encoded verification hash
 */
function obfuscatePayload(initials: string, score: number, playtime: number) {
    const salt = "8b!t_platform3r_S3cr3t";
    const rawString = `${initials}|${score}|${playtime}|${salt}`;
    return btoa(rawString);
}

/**
 * Submits a new high score to the global 'highscores' collection.
 * Includes a security hash for backend rule validation.
 * 
 * @param initials Player initials (MAX 3)
 * @param score The final game score
 * @param playtime Play duration for integrity checks
 */
window.submitHighScore = async function (initials: string, score: number, playtime: number) {
    try {
        const payloadHash = obfuscatePayload(initials, score, playtime);

        await addDoc(collection(db, "highscores"), {
            initials: initials.toUpperCase(),
            score: Number(score),
            playtimeMs: Number(playtime),
            timestamp: new Date().getTime(),
            _secHash: payloadHash // Used by Firestore Rules for logic-based verification
        });
        console.log("Score explicitly saved to Firebase globally!");
    } catch (e) {
        console.error("Error adding score structurally to Firebase: ", e);
    }
};

/**
 * Retrieves the Top 10 High Scores from the database.
 * Gracefully defaults to placeholder data if the fetch fails.
 * 
 * @returns Array of score objects {initials, score}
 */
window.fetchHighScores = async function(): Promise<{ initials: string, score: number }[]> {
    console.log("Fetching high scores from Firestore...");
    try {
        const q = query(collection(db, "highscores"), orderBy("score", "desc"), limit(10));
        const querySnapshot = await getDocs(q);

        let scores: any[] = [];
        querySnapshot.forEach((doc: any) => {
            scores.push(doc.data());
        });

        console.log(`Fetched ${scores.length} scores successfully.`);

        // Pad the list with empty slots to keep the UI layout consistent
        while (scores.length < 10) {
            scores.push({ initials: "---", score: 0 });
        }

        return scores;
    } catch (e) {
        console.error("Error natively catching FireStore scores: ", e);
        // Fallback for offline mode or network errors
        let dummy = [];
        for (let i = 0; i < 10; i++) dummy.push({ initials: "---", score: 0 });
        return dummy as any;
    }
};



