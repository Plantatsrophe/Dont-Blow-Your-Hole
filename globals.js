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
let lasers = [];
let particles = [];
let camera = { x: 0, y: 0 };

let gameState = 'START'; // START, PLAYING, DYING, LEVEL_CLEAR, GAMEOVER, WIN, ENTER_INITIALS
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

