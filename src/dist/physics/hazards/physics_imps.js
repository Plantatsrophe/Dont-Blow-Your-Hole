import { G, player, TILE_SIZE, getNextParticle } from '../../core/globals.js';
import { checkRectCollision, getCollidingTiles, playerDeath } from '../core/physics_utils.js';
import { playSound } from '../../assets/audio.js';
/**
 * Updates Demon Portal logic (spawning and stomping).
 */
export function updatePortals(dt) {
    if (!G.demonPortals || G.gameState === 'DYING')
        return;
    for (let i = G.demonPortals.length - 1; i >= 0; i--) {
        const portal = G.demonPortals[i];
        if (!portal.active)
            continue;
        portal.timer -= dt;
        // Spawn logic: 1 Imp at a time per portal
        if (portal.timer <= 0) {
            if (!portal.activeImp || !portal.activeImp.active) {
                const imp = {
                    type: 'bloodImp',
                    x: portal.x + (portal.width / 2) - 12,
                    y: portal.y + 40, // Spawn offset below portal
                    width: 24,
                    height: 24,
                    vx: 0,
                    vy: 0,
                    dir: 1,
                    cooldown: 0,
                    state: 'hover',
                    active: true
                };
                G.enemies.push(imp);
                portal.activeImp = imp;
                portal.timer = 3.0; // Reset timer
            }
        }
        // --- COLLISION ---
        if (checkRectCollision(player, portal)) {
            // Generous stomp check (top 15 pixels)
            if (player.vy > 0 && player.y + player.height < portal.y + 15) {
                portal.active = false;
                player.y = portal.y - player.height;
                player.vy = -400;
                player.isOnGround = false;
                player.doubleJump = false;
                playSound('stomp');
                // Portal explosion
                for (let j = 0; j < 15; j++) {
                    const p = getNextParticle();
                    p.active = true;
                    p.type = 'normal';
                    p.size = 4 + Math.random() * 6;
                    p.x = portal.x + Math.random() * portal.width;
                    p.y = portal.y + Math.random() * portal.height;
                    p.vx = (Math.random() - 0.5) * 300;
                    p.vy = (Math.random() - 0.5) * 300;
                    p.life = 0.5 + Math.random() * 0.5;
                    p.maxLife = p.life;
                    p.color = '#aa00ff';
                }
                G.demonPortals.splice(i, 1);
            }
            else {
                playerDeath();
            }
        }
    }
}
/**
 * Updates Blood Imp logic (hovering and diving).
 */
export function updateImps(dt) {
    if (G.gameState === 'DYING')
        return;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
        const imp = G.enemies[i];
        if (imp.type !== 'bloodImp' || !imp.active)
            continue;
        const oldX = imp.x;
        const oldY = imp.y;
        if (imp.state === 'hover') {
            // Move toward player X
            const targetX = player.x + player.width / 2;
            const impCenterX = imp.x + imp.width / 2;
            const diffX = targetX - impCenterX;
            imp.vx = Math.sign(diffX) * 60;
            imp.x += imp.vx * dt;
            // Wall Collision
            const tiles = getCollidingTiles(imp);
            for (const t of tiles) {
                if (t.type === 1) { // Wall
                    imp.x = oldX;
                    imp.vx = 0;
                    break;
                }
            }
            // Dive Check: Proximity + Player is below
            if (Math.abs(diffX) < 120 && player.y > imp.y + 50) {
                imp.state = 'dive';
            }
        }
        else if (imp.state === 'dive') {
            imp.vx = 0;
            imp.vy = 700;
            imp.y += imp.vy * dt;
            // Floor Collision
            const tiles = getCollidingTiles(imp);
            for (const t of tiles) {
                if (t.type === 1) {
                    killImp(imp, i);
                    return;
                }
            }
        }
        // Boundary Check (Despawn if fell into pit)
        if (imp.y > G.mapRows * TILE_SIZE) {
            imp.active = false;
            G.enemies.splice(i, 1);
            continue;
        }
        // Player Collision
        if (checkRectCollision(player, imp)) {
            // Generous Stomp Check: 
            // 1. Player is falling
            // 2. Player was above imp last frame OR current overlap is top-heavy
            const playerOldY = player.y - player.vy * dt;
            const impOldY = oldY;
            if (player.vy > 0 && (playerOldY + player.height <= impOldY + 5 || player.y + player.height < imp.y + 10)) {
                imp.active = false;
                player.y = imp.y - player.height;
                player.vy = -600; // Massive bounce for magma pits
                player.isOnGround = false;
                player.doubleJump = false;
                playSound('stomp');
                killImp(imp, i);
            }
            else {
                playerDeath();
            }
        }
    }
}
function killImp(imp, index) {
    imp.active = false;
    // Imp death particles
    for (let j = 0; j < 8; j++) {
        const p = getNextParticle();
        p.active = true;
        p.type = 'normal';
        p.size = 3 + Math.random() * 4;
        p.x = imp.x + imp.width / 2;
        p.y = imp.y + imp.height / 2;
        p.vx = (Math.random() - 0.5) * 200;
        p.vy = (Math.random() - 0.5) * 200;
        p.life = 0.4 + Math.random() * 0.4;
        p.maxLife = p.life;
        p.color = '#cc0000';
    }
    G.enemies.splice(index, 1);
}
