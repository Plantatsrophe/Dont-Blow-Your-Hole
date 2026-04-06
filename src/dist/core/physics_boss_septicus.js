import { G, player, TILE_SIZE, getNextParticle } from './globals.js';
import { playSound } from '../assets/audio.js';
import { playerDeath } from './physics_utils.js';
/**
 * Executes physics and AI for the Septicus boss (Sewer Level 39).
 * Septicus is a flying, acid-themed boss with a 4-phase cyclic AI:
 * Phase 0: Hovering & Tracking player horizontally.
 * Phase 1: Winding up for attack.
 * Phase 2: Melee sweeping near player.
 * Phase 3: Projectile shooting (vomiting acid).
 *
 * @param boss The generic boss entity
 * @param dt Delta time
 * @param bDyn Dynamic binding reference to the boss for mutating special state strings
 */
export function updateSepticus(boss, dt, bDyn) {
    // --- DEATH / DESTRUCTION SEQUENCE ---
    if (bDyn.isDying) {
        boss.timer += dt;
        // Vibrate violently with increasing intensity
        let shake = Math.min((boss.timer / 3.0) * 15, 15);
        boss.vibrateX = (Math.random() - 0.5) * shake * 2;
        // Spew random green/white volatile particles while dying
        if (Math.random() < 30 * dt) {
            let p = getNextParticle();
            p.active = true;
            p.type = 'normal';
            p.size = Math.random() * 6 + 4;
            p.x = boss.x + Math.random() * boss.width;
            p.y = boss.y + Math.random() * boss.height;
            p.vx = (Math.random() - 0.5) * 400;
            p.vy = (Math.random() - 0.5) * 400;
            p.color = (Math.random() > 0.5 ? '#3ee855' : '#ffffff');
            p.life = 0;
            p.maxLife = 0.6 + Math.random() * 0.4;
        }
        // After 3 seconds of shaking, trigger the final sink out of the level
        if (boss.timer > 3.0) {
            bDyn.isDying = false;
            boss.isSinking = true;
            boss.timer = 0;
            playSound('gameOver');
            boss.vibrateX = 0;
            // Grand explosion burst of particles
            for (let i = 0; i < 40; i++) {
                let p = getNextParticle();
                p.active = true;
                p.type = 'explosion';
                p.size = 15;
                p.x = boss.x + Math.random() * boss.width;
                p.y = boss.y + Math.random() * boss.height;
                p.vx = (Math.random() - 0.5) * 600;
                p.vy = (Math.random() - 0.5) * 600;
                p.life = 1.0;
                p.maxLife = 1.0;
            }
            if (G.camera)
                G.camera.vibrate = 20; // Massive screen shake
        }
        return; // Skip normal AI during death
    }
    // Sink out of the map over 10 seconds and deactivate entirely to win level
    if (boss.isSinking) {
        boss.y += 18 * dt;
        if (boss.timer > 10.0) {
            boss.isSinking = false;
            boss.active = false;
        }
        return;
    }
    // --- AWAKENING TRIGGER ---
    // Boss sits idly until player walks past column 12
    else if (!bDyn.triggered) {
        if (player.x > TILE_SIZE * 12) {
            bDyn.triggered = true;
            boss.x = player.x - boss.width / 2; // Snap strictly above player upon trigger
            playSound('powerup');
        }
        boss.vx = 0;
        boss.vy = 0;
        return;
    }
    // Maintain vertical float line (buoyancy effect)
    if (boss.y > (boss.startY || 0)) {
        boss.y -= 350 * dt;
        if (boss.y < (boss.startY || 0))
            boss.y = (boss.startY || 0);
        return;
    }
    // Reset to idle tracking if player retreats out of the arena
    if (player.x < TILE_SIZE * 11) {
        boss.vx = 0;
        boss.phase = 0;
        boss.timer = 0;
        boss.y += boss.vy * dt;
        if (boss.y > (boss.startY || 0)) {
            boss.y = (boss.startY || 0);
            boss.vy = 0;
        }
        else
            boss.vy += 800 * dt;
        return;
    }
    // General Gravity/Hovering mechanics
    if (!boss.vy)
        boss.vy = 0;
    boss.y += boss.vy * dt;
    if (boss.y > (boss.startY || 0)) {
        boss.y = (boss.startY || 0);
        boss.vy = 0;
    }
    else
        boss.vy += 800 * dt;
    // AI Variables
    let reach = 140, dist = Math.abs(player.x - (boss.x + boss.width / 2));
    // --- STATE MACHINE ---
    if (boss.phase === 0) {
        // Phase 0: Float and track player horizontally
        let spd = (boss.hp < 3) ? 220 : 180; // Speed up based on damage missing
        boss.vx = (player.x < boss.x + boss.width / 2) ? -spd : spd;
        boss.x += boss.vx * dt;
        // Confine movement to the boss room walls
        boss.x = Math.max(TILE_SIZE * 10, Math.min(TILE_SIZE * 90, boss.x));
        // Random slam attack if health is low
        if (boss.hp <= 2 && boss.y >= (boss.startY || 0) && player.y < boss.y - 120 && Math.random() < 0.02)
            boss.vy = -600;
        // Change logic based on health and time tracked:
        // Transition to projectile attacks (Phase 3) if highly damaged.
        if (boss.hp === 1 && boss.timer > ((boss.projs?.length || 0) > 0 ? 0 : 3.0)) {
            boss.phase = 3;
            boss.timer = 0;
            bDyn.throwsLeft = 3;
        }
        // Transition to swoop attack (Phase 1 Windup) if close enough
        else if (dist < reach && boss.timer > 2) {
            boss.phase = 1;
            boss.timer = 0;
            boss.vx = 0;
        }
    }
    else if (boss.phase === 1) {
        // Phase 1: Hold steady and play wind-up sound
        if (boss.timer > 0.8) {
            boss.phase = 2;
            boss.timer = 0;
            playSound('shoot');
        }
    }
    else if (boss.phase === 2) {
        // Phase 2: Perform sweeping melee attack
        if (boss.timer > 1.0) {
            boss.phase = 0;
            boss.timer = 0;
        } // Return to tracking
        // Circular sweep math around the player trajectory
        let sa = boss.timer * Math.PI;
        let sx = (boss.x + boss.width / 2) + Math.cos(sa) * reach * (player.x < boss.x ? -1 : 1);
        let sy = (boss.y + boss.height / 2) - Math.sin(sa) * reach;
        // Calculate player collision distance from the sweep point
        let dx2 = player.x + player.width / 2 - sx, dy2 = player.y + player.height / 2 - sy;
        if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < 22)
            playerDeath();
    }
    else if (boss.phase === 3) {
        // Phase 3: Ranged Attack (Spitting Acid)
        if (!boss.projs)
            boss.projs = [];
        let spd2 = 140;
        boss.vx = (player.x < boss.x + boss.width / 2) ? -spd2 : spd2;
        boss.x += boss.vx * dt;
        boss.x = Math.max(TILE_SIZE * 10, Math.min(TILE_SIZE * 90, boss.x));
        // Fire bursts rhythmically
        if (boss.timer > 0.6 && bDyn.throwsLeft > 0) {
            boss.timer = 0;
            bDyn.throwsLeft--;
            // Target player vector math
            let tx = player.x + player.width / 2, ty = player.y + player.height / 2;
            let bx = boss.x + boss.width / 2, by = boss.y + boss.height / 2;
            let ddx = tx - bx, ddy = ty - by, dst = Math.sqrt(ddx * ddx + ddy * ddy), spd3 = 500;
            boss.projs.push({ x: bx, y: by, vx: (ddx / dst) * spd3, vy: (ddy / dst) * spd3, timer: 0, linear: true });
            playSound('shoot');
        }
        // Once ammunition is spent, resume hovering tracking
        if (bDyn.throwsLeft <= 0 && boss.timer > 1.5) {
            boss.phase = 0;
            boss.timer = 0;
        }
    }
    // Update individual projectiles within the map array
    if (boss.projs) {
        for (let i = boss.projs.length - 1; i >= 0; i--) {
            let p = boss.projs[i];
            if (!p)
                break;
            p.timer += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            // Add arc gravity if not linear
            if (!p.linear)
                p.vy += 600 * dt;
            // Verify collision with player
            let pdx = player.x + player.width / 2 - p.x, pdy = player.y + player.height / 2 - p.y;
            if (Math.sqrt(pdx * pdx + pdy * pdy) < 25)
                playerDeath();
            // Evaporate projectile if it misses and hits floor/wall limits
            if (p.y > (boss.startY || 0) + 400 || p.x < 0 || p.x > G.mapCols * TILE_SIZE)
                boss.projs.splice(i, 1);
        }
    }
    // Produce constant visual green acid slime drops from its body regardless of phase
    if (Math.random() < 30 * dt) {
        let p = getNextParticle();
        p.active = true;
        p.type = 'normal';
        p.size = Math.random() * 3 + 2;
        p.x = boss.x + Math.random() * boss.width;
        p.y = boss.y + boss.height;
        p.vx = (Math.random() - 0.5) * 15;
        p.vy = 40 + Math.random() * 80;
        p.color = '#3ee855';
        p.life = 0;
        p.maxLife = 1.0 + Math.random();
    }
    // High-velocity spray when tracking quickly
    if (boss.vx !== 0 && Math.random() < 50 * dt) {
        let p = getNextParticle();
        p.active = true;
        p.type = 'normal';
        p.size = Math.random() * 4 + 3;
        p.x = boss.x + (boss.vx > 0 ? boss.width : 0) + (Math.random() - 0.5) * 30;
        p.y = 13 * TILE_SIZE;
        p.vx = boss.vx * 0.4 + (Math.random() - 0.5) * 80;
        p.vy = -180 - Math.random() * 150;
        p.color = '#3ee855';
        p.life = 0;
        p.maxLife = 0.5 + Math.random() * 0.5;
    }
}
