// Immutable constants
export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');
export const offscreenMapCanvas = document.createElement('canvas');
export const offscreenMapCtx = offscreenMapCanvas.getContext('2d');
export const TILE_SIZE = 40;

// Object pools
export const laserPool = Array.from({length: 50}, () => ({ active: false, x: 0, y: 0, vx: 0, width: 16, height: 8 }));
export const particlePool = Array.from({length: 150}, () => ({ active: false, type: '', x: 0, y: 0, vx: 0, vy: 0, size: 0, life: 0, maxLife: 0 }));

// Persistent object identities (mutate properties, never reassign)
export const player = {
    x: 0, y: 0, startX: 0, startY: 0, width: 32, height: 40,
    vx: 0, vy: 0, speed: 250, jumpPower: -450, gravity: 1200,
    walkTimer: 0, isOnGround: false, doubleJump: false,
    isClimbing: false,
    riding: null,
    rideOffsetX: 0,
    lives: 3,
    score: 0, color: '#3498db'
};
export const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, Space: false };

export const introText = `A Great Computer War rages across the planet...

The battle has gone on for so long that no one remembers who started it. So many generations have passed, knowing only war and violence, that the idea of peace is an unknown concept. Man and bot are at each other's throats and circuit boards over the future of the planet. Neither side knows what they will do if they win, only that they must come out victorious...

This is where HotDog and Fudge have ended up after a quick trip in the time rift went terribly wrong...

Now they must find their way back through time and make it to the show...

If there even is a show anymore...`;

// G = all mutable primitive/array/reference state
// Use G.x = val to mutate from any module (object properties are writable in ES modules)
export const G = {
    gameState: 'START',
    activeValvePos: null,
    purifiedValves: [],
    valveCutsceneTimer: 0,
    introY: 0,
    timer: 60,
    timerAcc: 0,
    winTimer: 0,
    enemyWalkTimer: 0,
    currentLevel: 0,
    initials: ['A', 'A', 'A'],
    initialIndex: 0,
    gameStartTime: 0,
    highScores: Array(10).fill({ name: 'LOADING...', score: 0 }),
    isMusicPlaying: false,
    spacePressed: false,
    mapRows: 15,
    mapCols: 40,
    map: [],
    items: [],
    enemies: [],
    lasers: [],
    particles: [],
    platforms: [],
    bombs: [],
    boss: { active: false, squash: 1.0, squashTimer: 0 },
    camera: { x: 0, y: 0 },
    isMapCached: false,
    acidPurified: false,
    cleanedPipes: [],
    audioCtx: null,
    _chk: 0x5f3759df // Initial checksum salt
};

const CHK_SALT = 0x5f3759df;
export function addScore(amt) {
    player.score += amt;
    G._chk = (player.score ^ CHK_SALT) * 2;
}

// Expose to window for console access (Cheats/Debugging)
window.G = G;
window.player = player;

// Bridge to db.js (already type="module", attaches functions to window)
window.refreshLeaderboard = async function() {
    if (window.fetchHighScores) {
        let scores = await window.fetchHighScores();
        G.highScores = scores.map(s => ({ name: s.initials, score: s.score }));
    }
};
window.saveScore = async function() {
    let name = G.initials.join('');
    let playtimeMs = new Date().getTime() - G.gameStartTime;

    // Integrity Check validation
    const expected = (player.score ^ CHK_SALT) * 2;
    if (player.score > 0 && G._chk !== expected) {
        console.error("High Score Integrity Check Failed. Submission discarded.");
        alert("CHEAT DETECTED: Score parity mismatch. Your score will not be saved.");
        return;
    }

    G.highScores.push({ name, score: player.score });
    G.highScores.sort((a, b) => b.score - a.score);
    G.highScores = G.highScores.slice(0, 10);
    if (window.submitHighScore) {
        await window.submitHighScore(name, player.score, playtimeMs);
        window.refreshLeaderboard();
    }
};
