import { G, getNextParticle } from './globals.js';
import { checkRectCollision } from './physics_utils.js';
import { playSound } from '../assets/audio.js';
import { bossExplode } from './physics_boss.js';

/**
 * Handles physics updates for environmental weapons (like Bombs).
 * Bombs are typically dropped conditionally when a boss performs an action 
 * (e.g. Masticator destroying a specific structural pillar).
 * 
 * @param dt Delta time for framerate independent momentum
 */
export function updateBombs(dt: number) {
    const boss = G.boss;
    
    // Iterate over the global pool of initialized bombs
    for (let b of G.bombs) {
        if (!b.active) continue; // Skip bombs waiting in the pool
        
        const bPhys = b as any; 
        if (bPhys.vy === undefined) bPhys.vy = 0;
        
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
            for(let i=0; i<20; i++){
                let p = getNextParticle(); p.active = true; p.type = 'explosion'; p.size = 12;
                p.x = b.x + 16; p.y = b.y + 16;
                p.vx = (Math.random() - 0.5) * 400; p.vy = (Math.random() - 0.5) * 400;
                p.life = 0.8; p.maxLife = 0.8;
            }
            
            // Apply damage and grant boss temporary invincibility flash
            boss.hp--; 
            boss.hurtTimer = 0.5; 
            
            // Trigger phase shift if boss health hits zero
            if(boss.hp <= 0) bossExplode();
        }
    }
}
