import type { IGlobals, IPlayer, ILaser, IParticle, IReflector } from '../types.js';

/**
 * Immutable Graphics Constants
 * These represent the physical hardware / drawing surface dependencies.
 */
export const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
export const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

/**
 * Offscreen buffer used specifically for pre-rendering the static tilemap.
 * This dramatically improves performance on large levels (like Auh-Gr's 114 rows).
 */
export const offscreenMapCanvas = document.createElement('canvas');
export const offscreenMapCtx = offscreenMapCanvas.getContext('2d') as CanvasRenderingContext2D;

/**
 * Unified tile size for the world grid.
 * Most sprites are 32x32 to 64x64, but the physics grid is strictly 40px blocks.
 */
export const TILE_SIZE = 40;

/**
 * Object Pools (Circular Buffers)
 * Pre-allocating objects prevents memory fragmentation and reduces 
 * Garbage Collection (GC) overhead during high-action sequences.
 */
export const laserPool: ILaser[] = Array.from({length: 50}, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, timer: 0, width: 16, height: 8, type: 'laser' }));

/**
 * Global particle pool. Supporting up to 500 concurrent particles 
 * for dense destruction sequences.
 */
export const particlePool: IParticle[] = Array.from({length: 500}, () => ({ active: false, type: '', x: 0, y: 0, vx: 0, vy: 0, size: 0, life: 0, maxLife: 0, width: 0, height: 0 }));

/**
 * Environmental Reflector Pool
 * Populated by level loader for Level 79.
 */
export const reflectorPool: IReflector[] = [];

/**
 * Persistent Player Data
 * Mutate these properties directly; never reassign the 'player' variable 
 * to maintain module-level reference integrity throughout the engine.
 */
export const player: IPlayer = {
    x: 0, y: 0, startX: 0, startY: 0, width: 32, height: 40,
    vx: 0, vy: 0, speed: 250, 
    jumpPower: -489, 
    gravity: 1200, // Nominal downward acceleration
    walkTimer: 0, 
    isOnGround: false, 
    doubleJump: false,
    isClimbing: false,
    riding: null, // If attached to a moving platform
    rideOffsetX: 0,
    lives: 3,
    score: 0, 
    color: '#3498db',
    coyoteTimer: 0,
    jumpBufferTimer: 0
};

/**
 * Real-time hardware key state tracker.
 */
export const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, Space: false };

/**
 * Cinematic Intro Scroll Content
 */
export const introText = `A Great Computer War rages across the planet...

The battle has gone on for so long that no one remembers who started it. So many generations have passed, knowing only war and violence, that the idea of peace is an unknown concept. Man and bot are at each other's throats and circuit boards over the future of the planet. Neither side knows what they will do if they win, only that they must come out victorious...

This is where HotDog and Fudge have ended up after a quick trip in the time rift went terribly wrong...

Now they must find their way back through time and make it to the show...

If there even is a show anymore...`;

/**
 * THE GLOBAL STATE STORE (G)
 * Contains all mutable primitive and collection state for the game.
 * All logic modules mutate this object to maintain synchronized state 
 * without deep prop-drilling.
 */
export const G: IGlobals = {
    gameState: 'START',
    activeValvePos: null, // Target for the camera during Octo-Boss transitions
    purifiedValves: [],
    valveCutsceneTimer: 0,
    introY: 0,
    timer: 60, // Level countdown timer
    timerAcc: 0, // Micro-accumulator for sub-second timing
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
    map: [], // 2D grid of tile IDs
    items: [],
    enemies: [],
    lasers: laserPool,
    particles: [],
    platforms: [],
    bombs: [],
    // Complex Boss Object Placeholder
    boss: { active: false, timer: 0, squash: 1.0, squashTimer: 0, hp: 0, phase: 0, hurtTimer: 0, vibrateX: 0, vx: 0, vy: 0, hasSeenPlayer: false, x: 0, y: 0, width: 0, height: 0, type: 'boss' },
    camera: { x: 0, y: 0 },
    isMapCached: false, // Set false to force re-render of static tilemap
    acidPurified: false, // Toggle logic for Sewer acid levels
    cleanedPipes: [],
    audioCtx: null, // Shared AudioContext for the engine
    _chk: 0x5f3759df, // Shadow score checksum pivot
    nextLaserIndex: 0,
    nextParticleIndex: 0,
    checkpointPos: null,
    corruptedSectors: [],
    malwareNodes: [],
    reflectors: reflectorPool
};

/**
 * Score Integrity Salt
 * Used to detect simple 'console-injection' high score edits.
 */
const CHK_SALT = 0x5f3759df;

/**
 * Increments the player score and updates the shadow checksum 
 * to ensure integrity upon submission.
 * 
 * @param amt Points to award
 */
export function addScore(amt: number) {
    player.score += amt;
    G._chk = (player.score ^ CHK_SALT) * 2;
}

/**
 * Helper to pull the next particle from the circular buffer.
 */
export function getNextParticle(): IParticle {
    const p = particlePool[G.nextParticleIndex];
    G.nextParticleIndex = (G.nextParticleIndex + 1) % particlePool.length;
    return p;
}

/**
 * Helper to pull the next laser from the circular buffer.
 */
export function getNextLaser(): ILaser {
    const l = laserPool[G.nextLaserIndex];
    G.nextLaserIndex = (G.nextLaserIndex + 1) % laserPool.length;
    return l;
}

// Expose state to window object for easier console debugging / cheats
window.G = G;
window.player = player;

/**
 * Bridged Leaderboard Fetcher
 * Syncs the global G highscores list with the Firebase DB.
 */
window.refreshLeaderboard = async function() {
    if (window.fetchHighScores) {
        let scores = await window.fetchHighScores();
        G.highScores = scores.map(s => ({ name: s.initials, score: s.score }));
    }
};

/**
 * Final Score Submission Logic
 * Performs an integrity check on the score checksum before permitting 
 * the write to the database.
 */
window.saveScore = async function() {
    let name = G.initials.join('');
    let playtimeMs = new Date().getTime() - G.gameStartTime;

    // --- INTEGRITY CHECK ---
    // If the score was edited manually in the console without updating G._chk,
    // the submission will be rejected.
    const expected = (player.score ^ CHK_SALT) * 2;
    if (player.score > 0 && G._chk !== expected) {
        console.error("High Score Integrity Check Failed. Submission discarded.");
        alert("CHEAT DETECTED: Score parity mismatch. Your score will not be saved.");
        return;
    }

    // Update local list for immediate visual feedback
    G.highScores.push({ name, score: player.score });
    G.highScores.sort((a, b) => b.score - a.score);
    G.highScores = G.highScores.slice(0, 10);
    
    // Remote db write
    if (window.submitHighScore) {
        await window.submitHighScore(name, player.score, playtimeMs);
        window.refreshLeaderboard();
    }
};

// Auto-boot leaderboard sync upon module initialization
if (typeof window !== 'undefined') {
    window.refreshLeaderboard();
}

