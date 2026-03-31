const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 40;
let mapRows = 15;
let mapCols = 40;


// Audio Context globally managed
let audioCtx = null;

let map = [];
let items = [];
let enemies = [];
let lasers = []; // Legacy mapping organically gracefully superseded contextually
let particles = [];
let platforms = [];
let camera = { x: 0, y: 0 };

// Hardware-Accelerated Cache Pipeline natively efficiently mapping strictly gracefully
let offscreenMapCanvas = document.createElement('canvas');
let offscreenMapCtx = offscreenMapCanvas.getContext('2d');
let isMapCached = false;

// O(1) Object Pooling intrinsically avoiding GC stutter intelligently 
const MAX_LASERS = 50;
const laserPool = Array.from({length: MAX_LASERS}, () => ({ active: false, x: 0, y: 0, vx: 0, width: 16, height: 8 }));

const MAX_PARTICLES = 150;
const particlePool = Array.from({length: MAX_PARTICLES}, () => ({ active: false, type: '', x: 0, y: 0, vx: 0, vy: 0, size: 0, life: 0, maxLife: 0 }));

let gameState = 'START'; // START, INTRO, INSTRUCTIONS, PLAYING, DYING, LEVEL_CLEAR, GAMEOVER, WIN, ENTER_INITIALS
let introY = 0;
const introText = `A Great Computer War rages across the planet.

The battle has gone on for so long that no one remembers who started it. So many generations have passed, knowing only war and violence, that the idea of peace is an unknown concept. Man and bot are at each other's throats and circuit boards over the future of the planet. Neither side knows what they will do if they win, only that they must come out victorious.

In the midst of the chaos, a bold operation is being planned. An operation so important, almost no one knows of its existence. If successful, this mission could turn the tide of the war and bring an end to the violence. It’s a prospect so potent, and yet so fragile, that it can be trusted with only the very best operatives. An extensive search has been ongoing, scouring the entire planet itself for such a candidate.

This most important operation was given a code name, such that hearing it would never lead one to suspect its magnitude and importance. A code name that was chosen for its common familiarity, continued use, and recognition. Fate, it would seem, is not without a sense of irony, as Hot Dog Henley races to complete Operation Hot Dog and save the universe as we know it`;

let timer = 60;
let timerAcc = 0;
let winTimer = 0;
let enemyWalkTimer = 0;
let currentLevel = 0;

let initials = ['A', 'A', 'A'];
let initialIndex = 0;

let gameStartTime = 0; // Tracks play duration for security validation natively!

// Synchronous default state preventing UI crashing natively during backend payload lag
let highScores = Array(10).fill({ name: 'LOADING...', score: 0 });

// Securely binds to the DB module asynchronously purely when available gracefully
window.refreshLeaderboard = async function() {
    if (window.fetchHighScores) {
        let scores = await window.fetchHighScores();
        highScores = scores.map(s => ({ name: s.initials, score: s.score }));
    }
};

// Safe wrapper natively migrating from localStorage completely to Firebase APIs elegantly
window.saveScore = async function() {
    let name = initials.join('');
    let playtimeMs = new Date().getTime() - gameStartTime;
    
    // Immediate visual update locally sequentially avoiding UI freeze natively!
    highScores.push({ name: name, score: player.score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);

    // Blast payload directly to the Firebase engine dynamically securely!
    if (window.submitHighScore) {
        await window.submitHighScore(name, player.score, playtimeMs);
        window.refreshLeaderboard(); // Resync true global states securely
    }
};

let player = {
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    width: 32,
    height: 40,
    vx: 0,
    vy: 0,
    speed: 250,
    jumpPower: -450,
    gravity: 1200,
    walkTimer: 0,
    isOnGround: false,
    doubleJump: false,
    isClimbing: false,
    lives: 3,
    score: 0,
    color: '#3498db'
};

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Space: false
};
let spacePressed = false;

