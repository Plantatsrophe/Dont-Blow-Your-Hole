import { G, player, TILE_SIZE, getNextParticle } from '../../core/globals.js';
import { checkRectCollision, playerDeath } from '../core/physics_utils.js';

/**
 * Updates the state machine and collision logic for Brimstone Geysers.
 * 
 * Cycles through:
 * 1. Dormant: No hazard, waiting for next cycle.
 * 2. Warning: Emits warning particles to alert the player.
 * 3. Erupting: Active hazardous hitbox that kills the player on contact.
 * 
 * @param dt Delta time
 */
export function updateGeysers(dt: number) {
    if (!G.geysers) return;

    for (const geyser of G.geysers) {
        geyser.timer -= dt;

        if (geyser.state === 'dormant') {
            if (geyser.timer <= 0) {
                geyser.state = 'warning';
                geyser.timer = 1.0; // Increased from 0.5s to 1.0s for better reaction time
            }
        } else if (geyser.state === 'warning') {
            // Continuous particle emission for warning feedback
            if (Math.random() < 30 * dt) {
                const p = getNextParticle();
                p.active = true;
                p.type = 'normal';
                p.size = 2 + Math.random() * 4;
                p.x = geyser.x + Math.random() * TILE_SIZE;
                p.y = geyser.y + TILE_SIZE - 5;
                p.vx = (Math.random() - 0.5) * 40;
                p.vy = -30 - Math.random() * 100;
                p.life = 0.3 + Math.random() * 0.3;
                p.maxLife = p.life;
                p.color = Math.random() > 0.5 ? '#ff2200' : '#ffaa00';
            }

            if (geyser.timer <= 0) {
                geyser.state = 'erupting';
                geyser.timer = 1.5;
            }
        } else if (geyser.state === 'erupting') {
            // Create deadly AABB extending 5 tiles high (Base + 4 tiles up)
            // Math: y coordinate is base Y minus 4 tiles to push it 'up' the screen
            const hitbox = { 
                x: geyser.x + 10, 
                y: geyser.y - (TILE_SIZE * 4) + 15, 
                width: TILE_SIZE - 20, 
                height: (TILE_SIZE * 4) - 5 // Ends at the lava surface (y + 10)
            };

            if (checkRectCollision(player, hitbox)) {
                playerDeath();
            }

            if (geyser.timer <= 0) {
                geyser.state = 'dormant';
                geyser.timer = 2.0;
            }
        }
    }
}
