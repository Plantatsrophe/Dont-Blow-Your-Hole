import { G, player, TILE_SIZE, getNextParticle } from './globals.js';
import { staticLevels } from '../data/levels.js';
import { playSound } from '../assets/audio.js';
/**
 * Executes the core physics and AI routine for the Masticator boss encounter.
 * Masticator is a horizontally moving bulldozer boss that relies on a 4-phase
 * state machine (Idle, Charging, Stunning, Recoiling) to interact with the player
 * and destroy map geometry (pillars).
 *
 * @param boss The generic boss entity
 * @param dt Delta time
 */
export function updateMasticator(boss, dt) {
    // Lock Y coordinate to the assigned track
    boss.y = boss.startY || 0;
    if (boss.phase === 0) {
        // --- PHASE 0: IDLE / WAITING ---
        boss.vx = 0;
        // Trigger charge if the player is within the camera viewport
        if (boss.hasSeenPlayer || (boss.x > G.camera.x && boss.x < G.camera.x + 800)) {
            boss.hasSeenPlayer = true;
            boss.phase = 1; // Transition to Charge
            // Charge in the direction of the player
            boss.vx = (player.x < boss.x) ? -300 : 300;
            playSound('shoot');
        }
    }
    else if (boss.phase === 1) {
        // --- PHASE 1: CHARGING ---
        boss.x += boss.vx * dt;
        // Calculate bounding box in terms of map grid coordinates to check for pillar collisions
        let sc2 = Math.floor(boss.x / TILE_SIZE), ec2 = Math.floor((boss.x + boss.width) / TILE_SIZE);
        let sr2 = Math.floor(boss.y / TILE_SIZE), er2 = Math.floor((boss.y + boss.height) / TILE_SIZE);
        let hitPillar = false, hitCol = -1;
        // Scan the grid underneath the boss's current physical boundaries
        for (let r = sr2; r <= er2; r++) {
            for (let c = sc2; c <= ec2; c++) {
                if (G.map[r] && G.map[r][c] !== 0 && G.map[r][c] !== undefined && r < 13) {
                    // Spawn debris particles dynamically for any block hit
                    let p2 = getNextParticle();
                    p2.active = true;
                    p2.type = 'normal';
                    p2.size = 12;
                    p2.x = c * TILE_SIZE + 20;
                    p2.y = r * TILE_SIZE + 20;
                    p2.vx = (Math.random() - 0.5) * 500;
                    p2.vy = -300 - Math.random() * 300;
                    p2.color = '#B0B0B0';
                    p2.life = 1.0;
                    p2.maxLife = 1.0;
                    if (G.map[r][c] === 1) {
                        hitPillar = true;
                        hitCol = c;
                    } // Mark collision if it's a solid pillar block
                    G.map[r][c] = 0; // Vaporize the block instantly
                    G.isMapCached = false; // Invalidate background canvas
                }
            }
        }
        if (hitPillar) {
            // --- PILLAR COLLISION HANDLING ---
            // If the boss struck a pillar, destroy the entire column of blocks vertically up to row 12
            for (let pr = 12; pr > 0; pr--) {
                let rs = staticLevels[G.currentLevel].map[pr];
                if (rs && rs[hitCol] === '1') {
                    G.map[pr][hitCol] = 0; // Wipe from mutable map
                    // Wipe from static map string to prevent checkpoint restore issues
                    staticLevels[G.currentLevel].map[pr] = rs.substring(0, hitCol) + "0" + rs.substring(hitCol + 1);
                    // Column debris effect
                    let p2 = getNextParticle();
                    p2.active = true;
                    p2.type = 'normal';
                    p2.size = 12;
                    p2.x = hitCol * TILE_SIZE + 20;
                    p2.y = pr * TILE_SIZE + 20;
                    p2.vx = (Math.random() - 0.5) * 500;
                    p2.vy = -300 - Math.random() * 300;
                    p2.color = '#B0B0B0';
                    p2.life = 1.0;
                    p2.maxLife = 1.0;
                }
            }
            G.isMapCached = false;
            boss.phase = 2; // Transition to Stunned Phase
            boss.vx = 0;
            boss.timer = 0;
            // Trigger any bombs hiding behind/inside the newly destroyed pillar column
            for (let bomb of G.bombs) {
                if (!bomb.active && Math.abs(bomb.col - hitCol) <= 3) {
                    bomb.active = true;
                    // Push bomb outwards based on the boss's current position
                    bomb.vx = (boss.x + boss.width / 2 > bomb.x) ? 50 : -50;
                }
            }
        }
        else {
            // If no pillar hit, check if the boss successfully passed the player (overshoot check)
            if ((boss.vx > 0 && player.x + player.width < boss.x) || (boss.vx < 0 && player.x > boss.x + boss.width)) {
                boss.phase = 3; // Transition to Braking/Recoil phase
                boss.timer = 0;
            }
        }
    }
    else if (boss.phase === 3) {
        // --- PHASE 3: RECOIL / BRAKING ---
        boss.vx *= 0.9; // Friction to slow down smoothly
        boss.x += boss.vx * dt;
        if (boss.timer > 0.4) {
            boss.phase = 1; // Instantly re-engage charge phase towards player
            boss.vx = (player.x < boss.x) ? -300 : 300;
            playSound('shoot');
        }
    }
    else if (boss.phase === 2) {
        // --- PHASE 2: STUNNED ---
        // Stunned for 3 seconds after hitting a pillar, vulnerable to bombs dropping
        if (boss.timer > 3.0) {
            boss.phase = 0; // Return to idle
            boss.timer = 0;
        }
    }
}
