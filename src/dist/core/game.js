import { G, player, canvas, keys, TILE_SIZE, laserPool, particlePool, addScore } from './globals.js';
import { playSound } from '../assets/audio.js';
import { parseMap, resetPlayerPosition, resetFullGame } from '../logic/spawner.js';
import { updatePhysics } from './physics.js';
import { checkRectCollision, playerDeath } from './physics_utils.js';
import { bossExplode } from './physics_boss.js';
import { render } from '../render/render.js';
import { updateSpatialGrid, queryGrid } from './spatial_grid.js';
/**
 * Utility function to find colliding tiles for local logic.
 * Note: Core physics uses physics_utils.ts version; this is used for localized enemy/UI checks.
 */
function getCollidingTiles(rect) {
    let tiles = [];
    let sc = Math.floor((rect.x + 0.0001) / TILE_SIZE), ec = Math.floor((rect.x + rect.width - 0.0001) / TILE_SIZE);
    let sr = Math.floor((rect.y + 0.0001) / TILE_SIZE), er = Math.floor((rect.y + rect.height - 0.0001) / TILE_SIZE);
    for (let row = sr; row <= er; row++) {
        for (let col = sc; col <= ec; col++) {
            if (row >= 0 && row < G.mapRows && col >= 0 && col < G.mapCols)
                tiles.push({ row, col, type: G.map[row][col], rect: { x: col * TILE_SIZE, y: row * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE } });
        }
    }
    return tiles;
}
/**
 * Central UI State Machine.
 * Handles the "Enter" or "Accept" button logic across all game screens
 * (Start, Instructions, Win, Game Over, High Scores).
 */
export function handleUIAccept() {
    if (G.gameState === 'ENTER_INITIALS') {
        window.saveScore();
        resetFullGame();
        G.gameState = 'START';
    }
    else if (G.gameState === 'WIN') {
        G.currentLevel++;
        if (G.currentLevel >= 99)
            G.currentLevel = 0;
        G.timer = 60;
        parseMap();
        resetPlayerPosition();
        G.gameState = 'PLAYING';
    }
    else if (G.gameState === 'GAMEOVER' || G.gameState === 'CREDITS') {
        G.gameState = 'ENTER_INITIALS';
    }
    else if (G.gameState === 'START') {
        G.introY = canvas.height * 0.66;
        G.gameState = 'INTRO';
    }
    else if (G.gameState === 'INTRO') {
        G.gameState = 'INSTRUCTIONS';
    }
    else if (G.gameState === 'INSTRUCTIONS') {
        G.currentLevel = 0;
        resetFullGame();
        G.gameState = 'PLAYING';
    }
}
/**
 * Retrieves the next available particle from the pre-allocated circular buffer.
 */
function getNextParticle() {
    const p = particlePool[G.nextParticleIndex];
    G.nextParticleIndex = (G.nextParticleIndex + 1) % particlePool.length;
    return p;
}
/**
 * Retrieves the next available laser from the pre-allocated circular buffer.
 */
function getNextLaser() {
    const l = laserPool[G.nextLaserIndex];
    G.nextLaserIndex = (G.nextLaserIndex + 1) % laserPool.length;
    return l;
}
/**
 * Internal logic step for moving entities, AI, and entity-specific collisions.
 * This is decoupled from basic physics to allow for fixed-time stepping.
 *
 * @param dt Delta time for movement
 */
function updateGame(dt) {
    if (G.gameState === 'PLAYING') {
        G.timerAcc += dt;
        if (G.timerAcc >= 1) {
            G.timer--;
            G.timerAcc -= 1;
            if (G.timer <= 0)
                playerDeath();
        }
    }
    // Refresh spatial grid for fast collision queries
    updateSpatialGrid();
    // Core Engine: Standard Platforming Physics
    updatePhysics(dt);
    // Visuals: Update life and size of all active particles
    for (let p of particlePool) {
        if (!p.active)
            continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.size *= 0.95;
        if (p.life <= 0)
            p.active = false;
    }
    if (G.gameState !== 'PLAYING')
        return;
    const boss = G.boss;
    // --- CAMERA ENGINE ---
    // Target defaults to player center
    let camTX = player.x + player.width / 2, camTY = player.y + player.height / 2;
    // Cinematic redirection: focus on a sinking boss if applicable
    if (boss && boss.active && boss.isSinking) {
        camTX = boss.x + boss.width / 2;
        camTY = boss.y + boss.height / 2;
    }
    // Smooth camera interpolation
    G.camera.x += (camTX - canvas.width / 2 - G.camera.x) * 0.05;
    G.camera.y += (camTY - canvas.height / 2 - G.camera.y) * 0.05;
    // Clamp to map boundaries
    G.camera.x = Math.max(0, Math.min(G.mapCols * TILE_SIZE - canvas.width, G.camera.x));
    G.camera.y = Math.max(0, Math.min(G.mapRows * TILE_SIZE - canvas.height, G.camera.y));
    // --- SPATIAL COLLISION QUERY ---
    // Efficiently find entities immediately surrounding the player
    const nearEntities = queryGrid(player.x - 50, player.y - 50, player.width + 100, player.height + 100);
    for (const ent of nearEntities) {
        // Collectible Items
        if (ent.type === 'hotdog' || ent.type === 'checkpoint' || ent.type === 'valve' || ent.type === 'detonator' || ent.type === 'gear') {
            const i = ent;
            if (!i.collected && checkRectCollision(player, i)) {
                i.collected = true;
                if (i.type === 'hotdog') {
                    player.lives++;
                    playSound('powerup');
                }
                else if (i.type === 'checkpoint') {
                    // Verify if this is a new checkpoint being activated
                    if (!G.checkpointPos || G.checkpointPos.x !== i.x + 8 || G.checkpointPos.y !== i.y - 2) {
                        G.checkpointPos = { x: i.x + 8, y: i.y - 2 };
                        playSound('powerup');
                        // Visual feedback for checkpoint touch
                        for (let pC = 0; pC < 20; pC++) {
                            let p = getNextParticle();
                            p.active = true;
                            p.type = 'checkpoint';
                            p.x = i.x + 16;
                            p.y = i.y + 16;
                            p.vx = (Math.random() - 0.5) * 100;
                            p.vy = -50 - Math.random() * 100;
                            p.size = 6;
                            p.life = 0.5 + Math.random() * 0.5;
                            p.maxLife = 1.0;
                        }
                    }
                }
                else if (i.type === 'valve') {
                    playSound('powerup');
                    if (boss && boss.active) {
                        G.gameState = 'VALVE_CUTSCENE';
                        G.valveCutsceneTimer = 0;
                        G.activeValvePos = { x: i.x, y: i.y };
                        G.purifiedValves.push({ x: i.x, y: i.y });
                        boss.hp--;
                        boss.hurtTimer = 0.5;
                        G.isMapCached = false;
                        playSound('explosion');
                        if (boss.hp <= 0)
                            bossExplode();
                    }
                }
                else if (i.type === 'detonator') {
                    playSound('powerup');
                    if (boss && boss.active) {
                        bossExplode();
                        player.cutsceneTimer = 0;
                        G.gameState = 'CREDITS_CUTSCENE';
                    }
                }
                else {
                    addScore(1000);
                    playSound('collect');
                }
            }
        }
        // Standard Moving Enemies
        else if (ent.type === 'bot' || ent.type === 'laserBot') {
            const e = ent;
            if (checkRectCollision(player, e)) {
                // Combat: Stomp mechanic (Mario-style)
                if (player.vy > 0 && player.y + player.height - player.vy * dt <= e.y + 15) {
                    playSound('stomp');
                    player.vy = keys.Space ? player.jumpPower * 0.9 : player.jumpPower * 0.6;
                    player.doubleJump = true;
                    addScore(200);
                    // Explode enemy into gears
                    for (let pC = 0; pC < 20; pC++) {
                        let rad = Math.random() * Math.PI * 2, spd = 50 + Math.random() * 150, p = getNextParticle();
                        p.active = true;
                        p.type = 'gear';
                        p.x = e.x + e.width / 2;
                        p.y = e.y + e.height / 2;
                        p.vx = Math.cos(rad) * spd;
                        p.vy = Math.sin(rad) * spd - 50;
                        p.size = 16;
                        p.life = 0.8 + Math.random() * 0.4;
                        p.maxLife = 1.2;
                    }
                    const idx = G.enemies.indexOf(e);
                    if (idx !== -1)
                        G.enemies.splice(idx, 1);
                }
                else {
                    playerDeath();
                    return;
                }
            }
        }
    }
    // --- AI COMPONENT UPDATES ---
    for (let i = G.enemies.length - 1; i >= 0; i--) {
        let e = G.enemies[i];
        if (e.type === 'bot') {
            // Patrol logic: reverse at walls or pits
            let ogX = e.x;
            e.x += e.vx * e.dir * dt;
            let hitWall = false;
            for (let t of getCollidingTiles(e)) {
                if (t.type === 1)
                    hitWall = true;
            }
            let pitCheck = { x: e.x + (e.dir === 1 ? e.width : -1), y: e.y + e.height + 1, width: 1, height: 1 };
            let overPit = true;
            for (let t of getCollidingTiles(pitCheck)) {
                if (t.type === 1 || t.type === 6)
                    overPit = false;
            }
            if (hitWall || overPit) {
                e.x = ogX;
                e.dir *= -1;
            }
        }
        else if (e.type === 'laserBot') {
            // Sniper logic: track player and shoot on cooldown
            e.dir = player.x < e.x ? -1 : 1;
            if (Math.abs(player.y - e.y) < 150 && Math.abs(player.x - e.x) < 500) {
                e.cooldown -= dt;
                if (e.cooldown <= 0) {
                    e.cooldown = 1.6;
                    let l = getNextLaser();
                    l.active = true;
                    l.x = e.dir === 1 ? e.x + e.width : e.x - 16;
                    l.y = e.y + 4;
                    l.width = 16;
                    l.height = 4;
                    l.vx = 350 * e.dir;
                    playSound('laser');
                }
            }
        }
    }
    // Hazards: Update active lasers
    for (let l of laserPool) {
        if (!l.active)
            continue;
        l.x += l.vx * dt;
        let hitWall = false;
        for (let t of getCollidingTiles(l)) {
            if (t.type === 1)
                hitWall = true;
        }
        if (hitWall || l.x < 0 || l.x > G.mapCols * TILE_SIZE) {
            l.active = false;
            continue;
        }
        if (checkRectCollision(player, l)) {
            playerDeath();
            return;
        }
    }
}
let lastTime = 0;
/**
 * Master RequestAnimationFrame hook.
 * Implements semi-fixed time-stepping to ensure stable physics regardless of
 * screen refresh rate (60Hz vs 144Hz).
 *
 * @param timestamp Current browser frame timestamp
 */
export function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1)
        dt = 0.1; // Prevention of massive jumps in logic if backgrounded
    lastTime = timestamp;
    // Handle Active Gameplay States with sub-stepping
    if (['PLAYING', 'DYING', 'LEVEL_CLEAR', 'VALVE_CUTSCENE'].includes(G.gameState)) {
        const MAX_STEP = 0.016; // 60 FPS Target step
        let rem = dt;
        while (rem > 0) {
            let step = Math.min(rem, MAX_STEP);
            updateGame(step);
            rem -= step;
            // Interrupt sub-steps if state changed to a non-physics screen
            if (['GAMEOVER', 'WIN'].includes(G.gameState))
                break;
        }
    }
    // Cinematic: Intro scroll
    else if (G.gameState === 'INTRO') {
        G.introY -= 30 * dt;
        if (G.introY < -600)
            handleUIAccept();
    }
    // Cinematic: Final game completion sequence
    else if (G.gameState === 'CREDITS_CUTSCENE') {
        if (player.cutsceneTimer === undefined)
            player.cutsceneTimer = 0;
        player.cutsceneTimer += dt;
        if (player.cutsceneTimer > 5.0) {
            G.gameState = 'CREDITS';
            player.cutsceneTimer = 0;
            playSound('win');
        }
    }
    else if (G.gameState === 'CREDITS') {
        player.cutsceneTimer = (player.cutsceneTimer || 0) + dt;
    }
    // Draw everything to screen
    render();
    // Cycle
    requestAnimationFrame(gameLoop);
}
