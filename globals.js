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

let defaultScores = [
    { name: 'Hotdog', score: 9999999 },
    { name: 'Fudge', score: 919919 },
    { name: 'Barry', score: 80085 },
    { name: 'Jill9000', score: 9000 },
    { name: 'Darby', score: 1337 }
];

let highScores = JSON.parse(localStorage.getItem('8bitScores_v2') || '[]');
highScores = highScores.filter(hs => hs.name !== 'CAZ' && hs.score !== 9191191 && hs.score !== 919919919);
localStorage.setItem('8bitScores_v2', JSON.stringify(highScores));

defaultScores.forEach(ds => {
    if (!highScores.some(hs => hs.name === ds.name && hs.score === ds.score)) {
        highScores.push(ds);
    }
});
highScores.sort((a, b) => b.score - a.score);

while (highScores.length < 10) {
    highScores.push({ name: '---', score: 0 });
}
highScores = highScores.slice(0, 10);

function saveScore() {
    let name = initials.join('');
    highScores.push({ name: name, score: player.score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    localStorage.setItem('8bitScores_v2', JSON.stringify(highScores));
}

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

