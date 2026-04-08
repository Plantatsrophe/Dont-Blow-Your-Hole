import { G, player, keys, TILE_SIZE, offscreenMapCanvas, reflectorPool, laserPool, particlePool } from '../core/globals.js';
import { staticLevels } from '../data/levels.js';
import { spawnMovingPlatform, spawnBoss } from './entity_spawner.js';
/**
 * Tracks the previously loaded level to detect level transitions.
 * Used to reset per-level state like cleaned pipes or checkpoints.
 */
let lastLevel = -1;
/**
 * The Master Map Parser.
 * Iterates through the raw ASCII/Char map from staticLevels and:
 * 1. Populates the global physics grid (G.map).
 * 2. Spawns entities (Enemies, Items, Platforms, Bosses).
 * 3. Configures the camera and offscreen canvas boundaries.
 *
 * @param resetEntities If true, flushes all existing entities before spawning new ones.
 */
export function parseMap(resetEntities = true) {
    // Detect new level entry
    if (G.currentLevel !== lastLevel) {
        G.cleanedPipes = [];
        G.checkpointPos = null;
        lastLevel = G.currentLevel;
    }
    // Initialize Level Timer from metadata or default to 60s
    G.timer = staticLevels[G.currentLevel].timer ?? 60;
    // Clear dynamic Virtual biome hazards
    G.corruptedSectors = [];
    G.malwareNodes = [];
    reflectorPool.length = 0; // Clear mirror nodes from previous maps
    let currentMapData = staticLevels[G.currentLevel].map;
    G.mapRows = currentMapData.length;
    G.mapCols = currentMapData[0].length;
    G.map = [];
    if (resetEntities) {
        G.items = [];
        G.enemies = [];
        G.platforms = [];
        G.bombs = [];
        for (let l of laserPool)
            l.active = false;
        // Default Boss State
        G.boss = { active: false, timer: 0, hp: 0, phase: 0, hurtTimer: 0, vibrateX: 0, vx: 0, vy: 0, hasSeenPlayer: false, x: 0, y: 0, width: 0, height: 0, type: 'boss', squash: 1, squashTimer: 0 };
        G.purifiedValves = [];
    }
    for (let p of particlePool)
        p.active = false;
    G.isMapCached = false; // Trigger offscreen re-render
    G.acidPurified = false;
    // Resize offscreen drawing buffer to match map dimensions
    offscreenMapCanvas.width = G.mapCols * TILE_SIZE;
    offscreenMapCanvas.height = G.mapRows * TILE_SIZE;
    let spawnFound = false;
    for (let row = 0; row < G.mapRows; row++) {
        let rowData = [];
        for (let col = 0; col < G.mapCols; col++) {
            let char = currentMapData[row][col];
            // --- SECURITY & BOUNDARIES ---
            // Force Biome Border ('W') on the extreme edges to prevent player from falling out of world
            if (row === 0 || row === G.mapRows - 1 || col === 0 || col === G.mapCols - 1)
                char = 'W';
            // --- TILE MAPPING ---
            let tile = parseInt(char, 10);
            let biomeId = Math.floor(G.currentLevel / 20) % 5;
            if (char === 'H')
                tile = 11; // Hotdog (Life)
            else if (char === 'C')
                tile = 14; // Checkpoint
            else if (char === 'A')
                tile = 15; // Acid/Hazards
            else if (char === 'W')
                tile = 16; // Wall / Border
            // --- VIRTUAL BIOME DYNAMIC HAZARDS ---
            // If in the Virtual biome, Tile 3 (Spike) and 15 (Acid) are dynamic hazards, not static.
            if (biomeId === 3 && (tile === 3 || tile === 15)) {
                if (tile === 3) {
                    G.corruptedSectors.push({ x: col * TILE_SIZE, y: row * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, isActive: false, timer: 1.5, toggleInterval: 1.5, type: 'sector' });
                }
                else {
                    G.malwareNodes.push({ x: col * TILE_SIZE + 20, y: row * TILE_SIZE + 20, width: 0, height: 0, radius: 8, maxRadius: 64, state: 'IDLE', triggerDistance: 96, cooldownTimer: 0, type: 'node' });
                }
                rowData.push(0);
            }
            // --- ENTITY SPAWNING ---
            else if (tile === 4) { // Gear (Loot)
                if (resetEntities)
                    G.items.push({ x: col * TILE_SIZE + 8, y: row * TILE_SIZE + 8, width: 24, height: 24, collected: false, type: 'gear' });
                rowData.push(0); // Empty space in physics grid
            }
            else if (tile === 11) { // Hotdog
                if (resetEntities)
                    G.items.push({ x: col * TILE_SIZE + 8, y: row * TILE_SIZE + 8, width: 24, height: 24, collected: false, type: 'hotdog' });
                rowData.push(0);
            }
            else if (tile === 14) { // Checkpoint Flag
                if (resetEntities)
                    G.items.push({ x: col * TILE_SIZE, y: row * TILE_SIZE, width: 32, height: 32, collected: false, type: 'checkpoint' });
                rowData.push(0);
            }
            else if (char === 'U' || char === 'P' || tile === 6) { // Moving Platforms
                if (resetEntities)
                    spawnMovingPlatform(char, row, col, currentMapData);
                rowData.push(0);
            }
            else if (char === '7' || (row === 8 && col === 1 && !spawnFound)) { // Player Spawn
                // If a checkpoint was hit, we ignore the local map spawn point
                if (!G.checkpointPos) {
                    player.startX = col * TILE_SIZE + 6;
                    player.startY = (row + 1) * TILE_SIZE - player.height;
                }
                spawnFound = true;
                rowData.push(0);
            }
            else if (tile === 8) { // Patrolling Bot
                if (resetEntities)
                    G.enemies.push({ type: 'bot', x: col * TILE_SIZE + 8, y: (row + 1) * TILE_SIZE - 24, width: 24, height: 24, vx: 50, vy: 0, dir: 1, cooldown: 0 });
                rowData.push(0);
            }
            else if (char === 'L') { // Laser-shooting Sniper Bot
                if (resetEntities)
                    G.enemies.push({ type: 'laserBot', x: col * TILE_SIZE + 8, y: (row + 1) * TILE_SIZE - 24, width: 24, height: 24, vx: 0, vy: 0, dir: -1, cooldown: 1.0 });
                rowData.push(0);
            }
            else if (char === 'B') { // Major Boss
                if (resetEntities) {
                    spawnBoss(col, row);
                }
                rowData.push(0);
            }
            else if (char === 'V') { // Septicus Valve
                if (resetEntities && biomeId === 1)
                    G.items.push({ x: col * TILE_SIZE, y: row * TILE_SIZE, width: 32, height: 32, collected: false, type: 'valve' });
                rowData.push(0);
            }
            else if (char === 'D') { // Final Game Detonator
                if (resetEntities && biomeId === 4)
                    G.items.push({ x: col * TILE_SIZE, y: row * TILE_SIZE, width: 32, height: 32, collected: false, type: 'detonator' });
                rowData.push(0);
            }
            else if (char === 'M') { // Masticator Destruction Bomb
                if (resetEntities)
                    G.bombs.push({ active: false, x: col * TILE_SIZE + 4, y: row * TILE_SIZE, width: 32, height: 32, vx: 0, vy: 0, col, row, type: 'bomb' });
                rowData.push(0);
            }
            else {
                // Static Tile (Brick, Metal, Ladder, etc)
                rowData.push(isNaN(tile) ? 0 : tile);
            }
        }
        G.map.push(rowData);
    }
    // --- POST-PARSE SPECIALS: LEVEL 79 (GLITCH) PROCEDURAL ARENA ---
    // We execute this AFTER G.map is fully built to guarantee every tile placement succeeds.
    if (G.currentLevel === 79) {
        // 1. Spawning Reflectors (World Coordinates)
        reflectorPool.length = 0;
        reflectorPool.push({ x: 800, y: 200, width: 40, height: 40, active: true, isUsable: true }, { x: 2000, y: 100, width: 40, height: 40, active: true, isUsable: true }, { x: 3200, y: 200, width: 40, height: 40, active: true, isUsable: true });
        let curX = 100; // Starting position (Spawn)
        let curRow = 7;
        // --- RESCUE PATH: Guaranteed route from floor back to Start Platform ---
        if (G.map[12])
            G.map[12][4] = 1; // Low step
        if (G.map[10])
            G.map[10][6] = 1; // Mid step
        // Define anchor targets for the procedural path
        const targets = [
            { x: 800, row: 7 }, // Bottom-Left Reflector area
            { x: 2000, row: 4 }, // Top-Center Reflector area
            { x: 3200, row: 7 }, // Bottom-Right Reflector area
            { x: 3800, row: 10 } // Exit area
        ];
        for (let target of targets) {
            // "Walk" from current position to the target anchor
            while (curX < target.x - 60) {
                // Short, safe steps for higher platform density (110-150px)
                curX += 110 + Math.random() * 40;
                // Gradually steer Row towards target height
                let rowDiff = target.row - curRow;
                let move = (rowDiff === 0) ? (Math.floor(Math.random() * 3) - 1) : Math.sign(rowDiff);
                curRow = Math.max(4, Math.min(12, curRow + move));
                let col = Math.floor(curX / TILE_SIZE);
                if (G.map[curRow] && G.map[curRow][col] !== undefined) {
                    G.map[curRow][col] = 1; // 1-tile stepping stone
                }
            }
            // At the target anchor, if it's a reflector, build the wide combat platform
            let col = Math.floor(target.x / TILE_SIZE);
            if (G.map[target.row]) {
                for (let i = -1; i <= 2; i++) {
                    if (G.map[target.row][col + i] !== undefined)
                        G.map[target.row][col + i] = 1;
                }
            }
            // Advance walk state to the anchor point for the next leg
            curX = target.x;
            curRow = target.row;
        }
    }
}
/**
 * Resets the player location to the latest checkpoint or level start.
 * Clears velocity and active physics flags.
 */
export function resetPlayerPosition() {
    if (G.checkpointPos) {
        player.x = G.checkpointPos.x;
        player.y = G.checkpointPos.y;
    }
    else {
        player.x = player.startX;
        player.y = player.startY;
    }
    player.vx = 0;
    player.vy = 0;
    player.droppingThrough = false;
    player.isOnGround = false;
    player.isClimbing = false;
}
/**
 * Full game state reset (New Game / Hard Reset).
 */
export function resetFullGame() {
    player.lives = 3;
    player.score = 0;
    G.timer = 60;
    parseMap();
    resetPlayerPosition();
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
    keys.ArrowDown = false;
    keys.Space = false;
    G.gameStartTime = new Date().getTime();
}
/**
 * --- CHEAT HOOKS & CONSOLE UI ---
 * The following are exposed to the window object to allow developers
 * to skip levels, toggle invincibility, or warp through the game.
 */
window.parseMap = parseMap;
window.resetPlayerPosition = resetPlayerPosition;
// Level Warp: window.goToLevel(40) to jump to the Mine biome
window.skipLevel = function (lvl) {
    if (lvl !== undefined) {
        G.currentLevel = Math.max(0, Math.min(lvl, staticLevels.length - 1));
    }
    parseMap();
    resetPlayerPosition();
    return `Skipped to Level ${G.currentLevel}`;
};
window.goToLevel = window.skipLevel;
window.nextLevel = function () {
    return window.skipLevel(G.currentLevel + 1);
};
window.addLives = function (n = 1) {
    player.lives += n;
    return `Added ${n} lives. Current lives: ${player.lives}`;
};
window.godMode = function (on) {
    if (on === undefined)
        player.isInvincible = !player.isInvincible;
    else
        player.isInvincible = on;
    if (player.isInvincible)
        player.lives = 999; // Purely cosmetic life pool
    return `God Mode ${player.isInvincible ? 'ENABLED (True Invincibility)' : 'DISABLED'}`;
};
// Convenience property proxy for index-based jumping
Object.defineProperty(window, 'currentLevel', {
    get: function () { return G.currentLevel; },
    set: function (val) { window.skipLevel(val); },
    configurable: true
});
