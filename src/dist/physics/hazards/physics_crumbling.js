import { G, player, TILE_SIZE, getNextParticle } from '../../core/globals.js';
import { playSound } from '../../assets/audio.js';
/**
 * Updates all active crumbling blocks (Ash Blocks).
 * Handles the lifespan countdown, particle emission upon expiration,
 * and high-priority AABB top-edge collision to keep the player grounded.
 *
 * @param dt Delta time
 */
export function updateCrumblingBlocks(dt) {
    if (!G.crumblingBlocks)
        return;
    for (let i = G.crumblingBlocks.length - 1; i >= 0; i--) {
        const block = G.crumblingBlocks[i];
        if (!block.active)
            continue;
        block.timer -= dt;
        // --- COLLISION LOGIC ---
        // We handle this before the timer check so the player can stand on it 
        // during the final frame of its life.
        if (player.vy >= 0 &&
            player.x + player.width > block.x &&
            player.x < block.x + TILE_SIZE &&
            player.y + player.height >= block.y &&
            player.y + player.height - (player.vy * dt + 0.1) <= block.y + 10) {
            player.y = block.y - player.height;
            player.isOnGround = true;
            player.doubleJump = false;
            player.vy = 0;
        }
        if (block.timer <= 0) {
            block.active = false;
            // Explosion particles (Dark Gray)
            for (let j = 0; j < 10; j++) {
                let p = getNextParticle();
                p.active = true;
                p.type = 'normal';
                p.size = 5 + Math.random() * 5;
                p.x = block.x + Math.random() * TILE_SIZE;
                p.y = block.y + Math.random() * TILE_SIZE;
                p.vx = (Math.random() - 0.5) * 200;
                p.vy = (Math.random() - 0.5) * 200;
                p.life = 0.5 + Math.random() * 0.5;
                p.maxLife = p.life;
                p.color = '#333333';
            }
            playSound('stomp');
            // Remove from array to keep physics loop lean
            G.crumblingBlocks.splice(i, 1);
        }
    }
}
