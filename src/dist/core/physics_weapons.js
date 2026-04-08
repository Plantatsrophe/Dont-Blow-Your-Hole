import { G, player, getNextParticle, TILE_SIZE, reflectorPool } from './globals.js';
import { checkRectCollision, getCollidingTiles, playerDeath } from './physics_utils.js';
import { playSound } from '../assets/audio.js';
import { bossExplode } from './physics_boss.js';
/**
 * Handles physics updates for environmental weapons (like Bombs).
 * Bombs are typically dropped conditionally when a boss performs an action
 * (e.g. Masticator destroying a specific structural pillar).
 *
 * @param dt Delta time for framerate independent momentum
 */
export function updateBombs(dt) {
    const boss = G.boss;
    // Iterate over the global pool of initialized bombs
    for (let b of G.bombs) {
        if (!b.active)
            continue; // Skip bombs waiting in the pool
        const bPhys = b;
        if (bPhys.vy === undefined)
            bPhys.vy = 0;
        // Basic gravity acceleration
        bPhys.vy += 800 * dt;
        // If the boss is active, mathematically guide the bombs to fall towards 
        // the boss's center mass using simple interpolation logic.
        if (boss && boss.active) {
            let targetX = boss.x + boss.width / 2 - b.width / 2;
            b.x += (targetX - b.x) * 10 * dt; // Ease X position towards target
            bPhys.vx = 0; // Nullify lateral momentum
        }
        b.y += bPhys.vy * dt;
        // Boss Collision Check
        if (boss && boss.active && checkRectCollision(b, boss)) {
            // Deactivate and hide bomb upon successful strike
            b.active = false;
            b.y = -9999;
            playSound('explosion');
            // Visual feedback: Emit 20 explosion particles upon impact
            for (let i = 0; i < 20; i++) {
                let p = getNextParticle();
                p.active = true;
                p.type = 'explosion';
                p.size = 12;
                p.x = b.x + 16;
                p.y = b.y + 16;
                p.vx = (Math.random() - 0.5) * 400;
                p.vy = (Math.random() - 0.5) * 400;
                p.life = 0.8;
                p.maxLife = 0.8;
            }
            // Apply damage and grant boss temporary invincibility flash
            boss.hp--;
            boss.hurtTimer = 0.5;
            // Trigger phase shift if boss health hits zero
            if (boss.hp <= 0)
                bossExplode();
        }
    }
}
/**
 * Handles physics updates for projectile weapons (lasers).
 * Supports full 360-degree motion by applying horizontal (vx) and vertical (vy) momentum.
 *
 * @param dt Delta time for movement and lifespan tracking
 */
export function updateLasers(dt) {
    const { lasers, mapCols, mapRows, boss } = G;
    // Reverse iterate to safely deactivate lasers from the global pool
    for (let i = lasers.length - 1; i >= 0; i--) {
        let l = lasers[i];
        if (!l.active)
            continue;
        // --- 1. REFLECTION SEQUENCING ---
        if (l.reflectionPhase === 'ABSORBING') {
            l.beamTimer = (l.beamTimer || 0) - dt;
            // Visual Detail: Inward pulling "vacuum" particles
            if (Math.random() > 0.4) {
                let p = getNextParticle();
                p.active = true;
                p.type = 'normal';
                p.size = 2;
                let ang = Math.random() * Math.PI * 2;
                let dist = 15 + Math.random() * 15;
                p.x = l.x + Math.cos(ang) * dist;
                p.y = l.y + Math.sin(ang) * dist;
                p.vx = -Math.cos(ang) * 150;
                p.vy = -Math.sin(ang) * 150;
                p.life = 0.15;
                p.maxLife = 0.15;
                p.color = '#00ffff';
            }
            if (l.beamTimer <= 0) {
                l.reflectionPhase = 'FIRING';
                l.beamTimer = 0.4;
                l.targetX = boss.x + boss.width / 2;
                l.targetY = boss.y + boss.height / 2;
                // --- INSTANT DAMAGE TRIGGER ---
                // We apply damage exactly when the beam "fires" for perfect sync
                if (boss.active && boss.type === 'glitch') {
                    boss.hp -= (boss.maxHp || 6) / 6;
                    boss.hurtTimer = 0.5;
                    playSound('explosion');
                    // Massive impact particles at boss site
                    for (let i = 0; i < 15; i++) {
                        let p = getNextParticle();
                        p.active = true;
                        p.type = 'normal';
                        p.size = 6;
                        p.x = l.targetX + (Math.random() - 0.5) * 40;
                        p.y = l.targetY + (Math.random() - 0.5) * 40;
                        p.vx = (Math.random() - 0.5) * 400;
                        p.vy = (Math.random() - 0.5) * 400;
                        p.life = 0.6;
                        p.maxLife = 0.6;
                        p.color = '#ffffff';
                    }
                    if (boss.hp <= 0)
                        bossExplode();
                }
            }
            continue; // Skip standard movement while locked in reflection state
        }
        else if (l.reflectionPhase === 'FIRING') {
            l.beamTimer = (l.beamTimer || 0) - dt;
            if (l.beamTimer <= 0)
                l.active = false;
            continue; // Projectile remains frozen at the mirror during beam fire
        }
        // Apply 2D vector momentum
        l.x += l.vx * dt;
        l.y += (l.vy || 0) * dt;
        // Dynamic Color Rotation: Rapidly cycle hue for a "rainbow glitch" effect
        l.hue = ((l.hue || 0) + 600 * dt) % 360;
        // --- 2. TILE COLLISION (With Phasing Logic) ---
        let hitWall = false;
        if (!l.passThroughTiles) {
            for (let t of getCollidingTiles(l)) {
                if (t.type === 1) {
                    hitWall = true;
                    break;
                }
            }
        }
        // Deactivate if hitting a wall, or leaving the world map
        if (hitWall || l.x < 0 || l.x > mapCols * TILE_SIZE || l.y < 0 || l.y > mapRows * TILE_SIZE) {
            l.active = false;
            continue;
        }
        // --- 3. PLAYER CONTACT ---
        if (checkRectCollision(player, l)) {
            playerDeath();
            return;
        }
        // --- 4. REFLECTOR COLLISION (GLITCH EXEMPT) ---
        // We check this AFTER player check but BEFORE ending the frame.
        // Importantly, this happens REGARDLESS of passThroughTiles.
        if (!l.reflected) {
            for (let r of reflectorPool) {
                if (r.active && r.isUsable && checkRectCollision(l, r)) {
                    l.vx = 0;
                    l.vy = 0; // Stop the projectile
                    l.reflected = true;
                    l.reflectionPhase = 'ABSORBING';
                    l.beamTimer = 0.2; // Absorption duration
                    // --- COOLDOWN TOGGLE LOGIC ---
                    for (let other of reflectorPool) {
                        other.isUsable = (other !== r);
                    }
                    // Snap position to reflector center
                    l.x = r.x + r.width / 2;
                    l.y = r.y + r.height / 2;
                    playSound('shoot');
                    break;
                }
            }
        }
    }
}
