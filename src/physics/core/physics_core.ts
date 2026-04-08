import { G, player, keys, TILE_SIZE, addScore } from '../../core/globals.js';
import { playSound } from '../../assets/audio.js';
import { getCollidingTiles, playerDeath, checkRectCollision } from './physics_utils.js';
import { updateBoss } from '../bosses/physics_boss.js';
import { updateBombs } from '../hazards/physics_bombs.js';
import { handleJump } from '../../core/input/input_utils.js';
import { updateDeathState, updateLevelClearState, updateValveCutsceneState } from '../states/physics_states.js';
import { updateVirtualHazards } from '../hazards/physics_virtual_hazards.js';
import { updateCrumblingBlocks } from '../hazards/physics_crumbling.js';
import { updateGeysers } from '../hazards/physics_geysers.js';
import { updatePortals, updateImps } from '../hazards/physics_imps.js';
import { updateDynamicRifts } from '../hazards/physics_h311_rifts.js';

/**
 * The master physics loop executed every frame.
 * Handles the player movement state machine, environment collisions, moving platforms,
 * and delegates special updates to weapon or boss modules.
 * 
 * @param dt Delta time for framerate independent momentum
 */
export function updatePhysics(dt: number) {
    // --- ASH BLOCKS (CRUMBLING TERRAIN) ---
    // Processed first to maintain grounded state during transition
    updateCrumblingBlocks(dt);

    // --- TICK JUMP STATE TIMERS ---
    if (player.isOnGround) player.coyoteTimer = 0.05;
    else if (player.coyoteTimer > 0) player.coyoteTimer -= dt;
    if (player.jumpBufferTimer > 0) player.jumpBufferTimer -= dt;

    // --- MOVING PLATFORMS (LATCHING LOGIC) ---
    if (player.riding) {
        if (keys.Space || player.isClimbing || player.x + player.width < player.riding.x || player.x > player.riding.x + player.riding.width) {
            player.riding = null;
        }
    }
    if (player.riding) {
        player.x = player.riding.x + player.rideOffsetX;
        player.y = player.riding.y - player.height;
        player.vy = 0; player.isOnGround = true;
    }
    
    for (let plat of G.platforms) {
        if (plat.vx !== 0) {
            plat.x += plat.vx * dt;
            if (plat.x >= plat.maxX) { plat.x = plat.maxX; plat.vx *= -1; }
            else if (plat.x <= plat.minX) { plat.x = plat.minX; plat.vx *= -1; }
        }
        if (plat.vy !== 0) {
            plat.y += plat.vy * dt;
            if (plat.y >= plat.maxY) { plat.y = plat.maxY; plat.vy *= -1; }
            else if (plat.y <= plat.minY) { plat.y = plat.minY; plat.vy *= -1; }
        }
    }

    // --- GAME STATE RESOLVERS ---
    if (G.gameState === 'DYING') { updateDeathState(dt); return; }
    if (G.gameState === 'LEVEL_CLEAR') { updateLevelClearState(dt); return; }
    if (G.gameState === 'VALVE_CUTSCENE') { updateValveCutsceneState(dt); return; }
    
    // --- NATIVE PLAYER PHYSICS ---
    player.vx = 0;
    if (keys.ArrowLeft) player.vx = -player.speed;
    if (keys.ArrowRight) player.vx = player.speed;

    let clashing = getCollidingTiles(player);
    let onLadder = false, hitSpike = false, hitGoal = false;
    
    // Scan underfoot for climbables
    let ladderCheckRect = {x: player.x, y: player.y, width: player.width, height: player.height + 1};
    for (let t of getCollidingTiles(ladderCheckRect)) { if(t.type === 2 || t.type === 6 || t.type === 9) onLadder = true; }
    
    // Scan inner body for hazards and portals
    for (let t of clashing) {
        if(t.type === 3 && checkRectCollision(player, {x: t.rect.x+8, y: t.rect.y+20, width: 24, height: 20})) hitSpike = true;
        // Lava (Tile 15) Hitbox: 10px safe zone at top, 4px inset on sides
        if(t.type === 15 && checkRectCollision(player, {x: t.rect.x+4, y: t.rect.y+10, width: 24, height: 22})) hitSpike = true; 
        if(t.type === 5) { hitGoal = true; player.portalX = t.rect.x + 16; player.portalY = t.rect.y + 16; }
    }
    
    if (hitSpike) { 
        playerDeath(); 
        // Only return if player actually died (prevents freeze in God Mode)
        if ((G.gameState as any) === 'DYING') return; 
    }
    if (hitGoal && (G.gameState as any) !== 'LEVEL_CLEAR') { 
        G.gameState = 'LEVEL_CLEAR'; G.winTimer = 0; playSound('win'); addScore(G.timer * 100); return; 
    }
    
    if (onLadder && (keys.ArrowUp || keys.ArrowDown)) { player.isClimbing = true; player.doubleJump = false; }
    else if (!onLadder) player.isClimbing = false;
    
    if (player.isClimbing) {
        player.vy = 0; if(keys.ArrowUp) player.vy = -player.speed * 0.6; if(keys.ArrowDown) player.vy = player.speed * 0.6;
    } else {
        player.vy += player.gravity * dt; if(player.vy > 800) player.vy = 800;
    }
    
    if (player.riding) { player.rideOffsetX += player.vx * dt; player.x = player.riding.x + player.rideOffsetX; }
    else { player.x += player.vx * dt; }
    
    for (let t of getCollidingTiles(player)) {
        if(t.type === 1 || t.type === 16) {
            let isOneWay = (t.type === 1) && t.col > 0 && t.col < G.mapCols-1 && t.row > 0 && t.row < G.mapRows-1;
            if(!isOneWay) {
                if(player.vx > 0) player.x = t.rect.x - player.width;
                else if(player.vx < 0) player.x = t.rect.x + t.rect.width;
                player.vx = 0;
            }
        }
    }
    
    player.y += player.vy * dt; player.isOnGround = false;
    for (let plat of G.platforms) {
        if (player.vy >= 0 && player.x + player.width > plat.x && player.x < plat.x + plat.width && 
            player.y + player.height >= plat.y && (player.y + player.height - (player.vy * dt * 2)) <= plat.y + 10) 
        {
            if (!player.riding) { player.riding = plat; player.rideOffsetX = player.x - plat.x; }
            player.y = plat.y - player.height; player.isOnGround = true; player.doubleJump = false; player.vy = 0; break;
        }
    }
    
    for(let t of getCollidingTiles(player)) {
        if(t.type === 1 || t.type === 16) {
            let isOneWay = (t.type === 1) && t.col > 0 && t.col < G.mapCols-1 && t.row > 0 && t.row < G.mapRows-1;
            if(isOneWay) {
                if(player.vy > 0 && !player.droppingThrough && player.y - player.vy*dt + player.height <= t.rect.y + 0.1) {
                    player.y = t.rect.y - player.height; player.isOnGround = true; player.doubleJump = false; player.vy = 0;
                }
            } else {
                if(player.vy > 0) { player.y = t.rect.y - player.height; player.isOnGround = true; player.doubleJump = false; player.vy = 0; }
                else if(player.vy < 0) { player.y = t.rect.y + t.rect.height; player.vy = 0; }
            }
        } else if(t.type === 8) { // Ash Block (Crumbling)
            if(player.vy >= 0 && player.y - player.vy*dt + player.height <= t.rect.y + 0.1) {
                // Remove tile and replace with dynamic entity
                G.map[t.row][t.col] = 0;
                G.isMapCached = false;
                G.crumblingBlocks.push({
                    x: t.rect.x,
                    y: t.rect.y,
                    timer: 0.4,
                    active: true,
                    row: t.row,
                    col: t.col
                });
                
                // Set grounded state for current frame
                player.y = t.rect.y - player.height;
                player.isOnGround = true;
                player.doubleJump = false;
                player.vy = 0;
            }
        } else if(t.type === 6 || t.type === 2 || t.type === 9) {
             if((!player.isClimbing || t.type === 6) && !keys.ArrowDown && player.vy >= 0 && player.y - player.vy*dt + player.height <= t.rect.y + 0.1) {
                player.y = t.rect.y - player.height; player.isOnGround = true; player.doubleJump = false; player.vy = 0;
            }
        }
    }
    
    if(player.isOnGround && player.vx !== 0 && !player.isClimbing) {
        player.walkTimer += dt; if(player.walkTimer > 0.15) { playSound('playerMove'); player.walkTimer = 0; }
    } else player.walkTimer = 0;
    
    if(player.y > G.mapRows * TILE_SIZE) playerDeath();
    if(player.x < 0) player.x = 0;
    if(player.x + player.width > G.mapCols * TILE_SIZE) player.x = G.mapCols * TILE_SIZE - player.width;
    
    updateBoss(dt); updateBombs(dt); updateVirtualHazards(dt); updateGeysers(dt); updatePortals(dt); updateImps(dt);
    updateDynamicRifts(dt);
    if ((player.isOnGround || player.riding) && player.jumpBufferTimer > 0) handleJump();
}
