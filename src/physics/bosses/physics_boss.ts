import { G, player, TILE_SIZE, getNextParticle, getNextLaser } from '../../core/globals.js';
import { playSound } from '../../assets/audio.js';
import { checkRectCollision, playerDeath } from '../core/physics_utils.js';
import { updateAuhGr } from './physics_boss_auhgr.js';
import { updateMasticator } from './physics_boss_masticator.js';
import { updateSepticus } from './physics_boss_septicus.js';
import { updateGlitch } from './physics_boss_glitch.js';
import { updateBaphometron } from './physics_boss_baphometron.js';

/**
 * Triggers the spectacular destruction sequence for any defeated boss.
 * Cleans up entity state, unlocks exits/valves, and mutates the current map
 * layout to permit the player to progress.
 */
export function bossExplode() {
    const boss = G.boss;
    if (!boss) return;
    const bDyn = boss as any;

    // Custom death transition logic for Septicus
    if (boss.type === 'septicus' && !boss.isSinking && !bDyn.isDying && boss.hp <= 0) {
        bDyn.isDying = true; boss.timer = 0; boss.vx = 0; boss.vy = 0; boss.vibrateX = 0;
        G.acidPurified = true; G.isMapCached = false; // Purify acid globally
        if (boss.projs) boss.projs = []; playSound('explosion');
    } else if (bDyn.isDying || boss.isSinking) { 
        return; // Prevent double-triggering
    } else { 
        // Standard boss death
        boss.active = false; playSound('gameOver'); 
    }

    // High-density explosion particles emitted from the boss's center
    for (let i = 0; i < 40; i++) { 
        let p = getNextParticle(); 
        p.active = true; p.type = 'normal'; p.size = 15; 
        p.x = boss.x + Math.random() * boss.width; p.y = boss.y + Math.random() * boss.height; 
        p.vx = (Math.random() - 0.5) * 500; p.vy = (Math.random() - 0.5) * 500; 
        p.life = 1.0; p.maxLife = 1.0; 
    }

    // Auto-collect all level-ending triggers (e.g. Acid Purifier Valve)
    for (let it of G.items) { 
        if (it.type === 'valve' || it.type === 'detonator') it.collected = true; 
    }

    // General map mutation unlocking the pathway strictly upwards
    if (boss.type !== 'baphometron') {
        let pCol = Math.floor((boss.x + boss.width/2)/TILE_SIZE);
        let pRow = Math.floor((boss.y + boss.height)/TILE_SIZE);
        
        // For Septicus, we punch open a specialized hole in the ceiling (Row 5 - 10)
        if (boss.type === 'septicus') { 
            pCol = 98; pRow = 11; 
            for(let i=0; i<6; i++) {
                let br = 5+i, bc = 82+i*2;
                if(G.map[br]) { G.map[br][bc] = 1; G.map[br][bc+1] = 1; }
            } 
        }
        
        // Generate an exit portal above the dead boss location
        if (G.map[Math.max(0, pRow-1)]) G.map[Math.max(0, pRow-1)][pCol] = 5; 
        G.isMapCached = false;
    }
}

/**
 * The master physics router for all boss logic.
 * Checks generic collision data, then pipes execution off to the 
 * specific boss's individual physics module.
 * 
 * @param dt Delta time for framerate independent momentum calculations
 */
export function updateBoss(dt: number) {
    const boss = G.boss;
    if (!boss) return;
    const bDyn = boss as any;

    // --- TRIGGER LOGIC FOR AUH-GR ---
    // Auh-Gr natively starts inactive and invisible, waiting far below the map.
    if (boss.type === 'auh-gr' && !boss.triggered) {
        const firstPlatformRow = 114;
        const triggerY = firstPlatformRow * 40; 
        if (player.y < triggerY && player.y > triggerY - 200) {
            boss.triggered = true;
            boss.active = true; 
            playSound('powerup'); 
        }
        if (!boss.active) return; 
    }

    // Skip processing if totally dead or inactive
    if (!boss.active || (boss.hp <= 0 && !boss.isSinking && !bDyn.isDying)) return;
    
    // Decrement damage cooldown frame delay
    if (boss.hurtTimer > 0) boss.hurtTimer -= dt;

    // Global player collision detection
    if (boss.type !== 'auh-gr') {
        let bRect = { x: boss.x + 5, y: boss.y + 5, width: boss.width - 10, height: boss.height - 10 };
        
        // --- GLITCH SPECIAL: Tight Body-Only Hitbox ---
        if (boss.type === 'glitch') {
            bRect = { x: boss.x + 20, y: boss.y + 15, width: boss.width - 40, height: boss.height - 25 };
        }
        
        if (checkRectCollision(player, bRect)) playerDeath();
    }
    
    // Universal internal clock increment
    boss.timer += dt;

    // --- ROUTE TO SPECIFIC SPECIALISTS ---
    switch (boss.type) {
        case 'masticator': updateMasticator(boss, dt); break;
        case 'septicus':   updateSepticus(boss, dt, bDyn); break;
        case 'auh-gr':     updateAuhGr(boss, dt); break;
        case 'glitch':     updateGlitch(boss, dt); break;
        case 'baphometron': updateBaphometron(boss, dt); break;
    }
}
