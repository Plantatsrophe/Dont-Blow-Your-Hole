import { G, player, keys, canvas, TILE_SIZE, addScore } from './globals.js';
import { playSound, stopBackgroundMusic } from '../assets/audio.js';
import { parseMap, resetPlayerPosition } from '../logic/spawner.js';
import { getCollidingTiles, playerDeath, checkRectCollision } from './physics_utils.js';
import { updateBoss } from './physics_boss.js';
import { updateBombs } from './physics_weapons.js';
import { handleJump } from './input_utils.js';

/**
 * The master physics loop executed every frame.
 * Handles the player movement state machine, environment collisions, moving platforms,
 * and delegates special updates to weapon or boss modules.
 * 
 * @param dt Delta time for framerate independent momentum
 */
export function updatePhysics(dt: number) {
    // --- TICK JUMP STATE TIMERS ---
    // If the player is on solid ground, refresh the 0.05s Coyote Time grace period.
    // This allows them to jump briefly (roughly 3 frames) after walking off a ledge.
    if (player.isOnGround) {
        player.coyoteTimer = 0.05;
    } else if (player.coyoteTimer > 0) {
        player.coyoteTimer -= dt;
    }
    
    // Always wind down the Jump Buffer. If this stays above 0, the player 
    // recently tried to jump but was in mid-air.
    if (player.jumpBufferTimer > 0) {
        player.jumpBufferTimer -= dt;
    }

    // --- MOVING PLATFORMS (LATCHING LOGIC) ---
    // If the player jumps, climbs, or walks off the edge of their currently latched platform, detach them.
    if (player.riding) {
        if (keys.Space || player.isClimbing || player.x + player.width < player.riding.x || player.x > player.riding.x + player.riding.width) {
            player.riding = null;
        }
    }
    // If still latched, heavily enforce physical position relative to the platform
    if (player.riding) {
        player.x = player.riding.x + player.rideOffsetX;
        player.y = player.riding.y - player.height;
        player.vy = 0;
        player.isOnGround = true;
    }
    
    // Globally update the position of all moving platforms on the map
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
    
    // DEATH STATE RESOLUTION
    if (G.gameState === 'DYING') {
        if (player.dyingTimer === undefined) player.dyingTimer = 0;
        player.dyingTimer += dt;
        
        // Let the player's gore particles fly for 1.8 seconds before triggering the actual state reset
        if (player.dyingTimer > 1.8) {
            player.lives--;
            if (player.lives <= 0) {
                stopBackgroundMusic();
                playSound('gameOver');
                G.gameState = 'GAMEOVER';
            } else {
                // Time limit resets on death
                G.timer = 60;
                
                // Special Item Stashing logic for continuous boss encounters (e.g. Level 59)
                // Ensures perfectly persistent item states across deaths
                let stash = new Set<string>();
                if (G.currentLevel === 59) {
                    for (let i of G.items) { if (i.collected) stash.add(`${Math.floor(i.x)},${Math.floor(i.y)}`); }
                }
                
                // Reparse the map to heal any destroyed tiles or regenerate procedural arena
                parseMap((G.currentLevel === 59 || G.currentLevel === 79) ? true : false);
                
                if (G.currentLevel === 59) {
                    for (let i of G.items) { if (stash.has(`${Math.floor(i.x)},${Math.floor(i.y)}`)) i.collected = true; }
                }
                
                // Reset player and fully restart the boss encounter smoothly 
                resetPlayerPosition();
                if(G.boss) {
                    if(G.currentLevel === 59 && G.checkpointPos) {
                        G.boss.y = G.checkpointPos.y + (5 * TILE_SIZE);
                        G.boss.active = true;
                        G.boss.triggered = true;
                        G.boss.vx = 0; G.boss.vy = 0; G.boss.phase = 0; G.boss.timer = 0;
                        G.boss.hasSeenPlayer = true;
                    } else if(G.boss.active) { // Default boss reset
                        G.boss.x = G.boss.startX ?? G.boss.x;
                        G.boss.y = G.boss.startY ?? G.boss.y;
                        G.boss.vx = 0; G.boss.vy = 0; G.boss.phase = 0; G.boss.hasSeenPlayer = false;
                    }
                }
                G.gameState='PLAYING';
            }
        }
        return; // Halt core physics updates during death sequence
    }
    
    // LEVEL CLEAR / PORTAL STATE RESOLUTION
    if (G.gameState === 'LEVEL_CLEAR') {
        // Siphon the player into the exact geometric center of the portal
        if(player.portalX !== undefined && player.portalY !== undefined) {
            player.x += (player.portalX - player.width/2 - player.x) * 4 * dt;
            player.y += (player.portalY - player.height/2 + 16 - player.y) * 4 * dt;
        }
        player.vx = 0; player.vy = 0;
        
        // Auto-center camera onto the portal during absorption sequence
        G.camera.x = Math.max(0, Math.min(G.mapCols*TILE_SIZE - canvas.width, player.x - canvas.width/2 + player.width/2));
        G.camera.y = Math.max(0, Math.min(G.mapRows*TILE_SIZE - canvas.height, player.y - canvas.height/2 + player.height/2));
        
        G.winTimer += dt; 
        if(G.winTimer > 2) G.gameState = 'WIN'; 
        return;
    }
    
    // CINEMATIC PAN RESOLUTION
    if (G.gameState === 'VALVE_CUTSCENE') {
        G.valveCutsceneTimer += dt;
        
        // Release lock back to player after 5 seconds
        if(G.valveCutsceneTimer > 5.0) { G.gameState='PLAYING'; G.activeValvePos = null; if(G.boss) G.boss.vibrateX = 0; }
        
        // Smoothly interpolate camera from player to the triggered valve objective
        if(G.activeValvePos) {
            let tx = G.activeValvePos.x - canvas.width/2 + 16;
            let ty = (G.activeValvePos.y + 40) - canvas.height/2 + 16;
            G.camera.x += (tx - G.camera.x) * 3 * dt; 
            G.camera.y += (ty - G.camera.y) * 3 * dt;
            
            // Hard clamp so camera cannot expose out-of-bounds void
            G.camera.x = Math.max(0, Math.min(G.mapCols*TILE_SIZE - canvas.width, G.camera.x));
            G.camera.y = Math.max(0, Math.min(G.mapRows*TILE_SIZE - canvas.height, G.camera.y));
        }
        if(G.boss && G.boss.active) G.boss.vibrateX = Math.sin(Date.now() * 0.05) * 8;
        return;
    }
    
    // --- NATIVE PLAYER PHYSICS ---

    // 1. Calculate Intent Vector
    player.vx = 0;
    if (keys.ArrowLeft) player.vx = -player.speed;
    if (keys.ArrowRight) player.vx = player.speed;

    // 2. Pre-evaluate spatial tile triggers
    let lcrect = {x: player.x, y: player.y, width: player.width, height: player.height + 1};
    let ladderTiles = getCollidingTiles(lcrect), clashing = getCollidingTiles(player);
    let onLadder = false, hitSpike = false, hitGoal = false;
    
    // Scan underfoot for climbables
    for (let t of ladderTiles) { if(t.type === 2 || t.type === 6 || t.type === 9) onLadder = true; }
    
    // Scan inner body for hazards and portals
    for (let t of clashing) {
        // Tighten the hitbox for normal spikes (type 3) significantly
        if(t.type === 3 && checkRectCollision(player, {x: t.rect.x+8, y: t.rect.y+20, width: 24, height: 20})) hitSpike = true;
        if(t.type === 15) hitSpike = true; // Alien Acid spikes
        if(t.type === 5) { hitGoal = true; player.portalX = t.rect.x + 16; player.portalY = t.rect.y + 16; } // Portal center pivot
    }
    
    if (hitSpike) { playerDeath(); return; }
    if (hitGoal && (G.gameState as any) !== 'LEVEL_CLEAR') { 
        G.gameState = 'LEVEL_CLEAR'; G.winTimer = 0; 
        playSound('win'); addScore(G.timer * 100); 
        return; 
    }
    
    
    // 3. Apply Vertical Forces (Gravity / Climbing)
    if (onLadder) {
        if(keys.ArrowUp || keys.ArrowDown) { player.isClimbing = true; player.doubleJump = false; }
    } else player.isClimbing = false;
    
    if (player.isClimbing) {
        player.vy = 0; // Nullify gravity
        if(keys.ArrowUp) player.vy = -player.speed * 0.6;
        if(keys.ArrowDown) player.vy = player.speed * 0.6;
    } else {
        player.vy += player.gravity * dt;
        if(player.vy > 800) player.vy = 800; // Terminal velocity
    }
    
    // 4. Resolve Horizontal Geometry Collision
    if (player.riding) { 
        player.rideOffsetX += player.vx * dt; 
        player.x = player.riding.x + player.rideOffsetX; 
    } else { 
        player.x += player.vx * dt; 
    }
    
    for (let t of getCollidingTiles(player)) {
        if(t.type === 1 || t.type === 16) {
            let isOneWay = (t.type === 1) && t.col > 0 && t.col < G.mapCols-1 && t.row > 0 && t.row < G.mapRows-1;
            if(!isOneWay) {
                // Hard bump-back based on momentum direction
                if(player.vx > 0) player.x = t.rect.x - player.width;
                else if(player.vx < 0) player.x = t.rect.x + t.rect.width;
                player.vx = 0;
            }
        }
    }
    
    // 5. Compute vertical vector
    player.y += player.vy * dt;
    player.isOnGround = false;
    
    // Evaluate sweeping platform latch collision first
    for (let plat of G.platforms) {
        if (player.vy >= 0 && player.x + player.width > plat.x && player.x < plat.x + plat.width && 
            player.y + player.height >= plat.y && 
            (player.y + player.height - (player.vy * dt * 2)) <= plat.y + 10) 
        {
            if (!player.riding) { player.riding = plat; player.rideOffsetX = player.x - plat.x; }
            player.y = plat.y - player.height; 
            player.isOnGround = true; 
            player.doubleJump = false; 
            player.vy = 0; 
            break;
        }
    }
    
    if (player.riding && (player.x + player.width < player.riding.x || player.x > player.riding.x + player.riding.width)) { 
        player.riding = null; 
    } else if (player.riding) { 
        player.isOnGround = true; 
        player.doubleJump = false; 
    }

    // 6. Resolve Vertical Geometry Collision
    for(let t of getCollidingTiles(player)) {
        if(t.type === 1 || t.type === 16) {
            let isOneWay = (t.type === 1) && t.col > 0 && t.col < G.mapCols-1 && t.row > 0 && t.row < G.mapRows-1;
            if(isOneWay) {
                // Drop-through mechanic evaluation
                if(player.vy > 0 && !player.droppingThrough && player.y - player.vy*dt + player.height <= t.rect.y + 0.1) {
                    player.y = t.rect.y - player.height; player.isOnGround = true; player.doubleJump = false; player.vy = 0;
                }
            } else {
                if(player.vy > 0) { player.y = t.rect.y - player.height; player.isOnGround = true; player.doubleJump = false; player.vy = 0; }
                else if(player.vy < 0) { player.y = t.rect.y + t.rect.height; player.vy = 0; }
            }
        }
        else if(t.type === 6) { // Top of ladder
            if(player.vy > 0 && !player.droppingThrough && player.y - player.vy*dt + player.height <= t.rect.y + 0.1) {
                player.y = t.rect.y - player.height; player.isOnGround = true; player.doubleJump = false; player.vy = 0;
            }
        }
        else if(t.type === 2 || t.type === 9) { // Ladder shafts
            if(!player.isClimbing && !keys.ArrowDown && player.vy >= 0 && player.y - player.vy*dt + player.height <= t.rect.y + 0.1) {
                player.y = t.rect.y - player.height; player.isOnGround = true; player.doubleJump = false; player.vy = 0;
            }
        }
    }
    
    // Generate walking animation dust/sfx timing
    if(player.isOnGround && player.vx !== 0 && !player.isClimbing) {
        player.walkTimer += dt;
        if(player.walkTimer > 0.15) { playSound('playerMove'); player.walkTimer = 0; }
    } else player.walkTimer = 0;
    
    // Bounds limit checking
    if(player.y > G.mapRows * TILE_SIZE) playerDeath(); // Fall off bottom of map
    if(player.x < 0) player.x = 0; // Hard clamp left map border
    if(player.x + player.width > G.mapCols * TILE_SIZE) player.x = G.mapCols * TILE_SIZE - player.width; // Hard clamp right border
    
    // Broadcast generic component calls
    updateBoss(dt); 
    updateBombs(dt);
    updateVirtualHazards(dt);

    // --- JUMP BUFFER EXECUTION ---
     if ((player.isOnGround || player.riding) && player.jumpBufferTimer > 0) {
         handleJump();
     }
 }

/**
 * Handles the logic for dynamic hazards in the Virtual biome (bId 3).
 * Includes toggling Corrupted Memory Sectors and expanding Malware Nodes.
 */
function updateVirtualHazards(dt: number) {
    if (Math.floor(G.currentLevel / 20) % 5 !== 3) return;

    // 1. Corrupted Memory Sectors (Flickering deadly zones)
    for (let s of G.corruptedSectors) {
        s.timer -= dt;
        if (s.timer <= 0) {
            s.isActive = !s.isActive;
            s.timer = s.toggleInterval;
        }
        if (s.isActive && checkRectCollision(player, s)) { playerDeath(); return; }
    }

    // 2. Malware Nodes (Triggered proximity mines)
    for (let n of G.malwareNodes) {
        let dx = (player.x + player.width/2) - n.x;
        let dy = (player.y + player.height/2) - n.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if (n.state === 'IDLE') {
            if (dist < n.triggerDistance) n.state = 'EXPANDING';
        } else if (n.state === 'EXPANDING') {
            n.radius += 300 * dt;
            if (dist < n.radius) { playerDeath(); return; }
            if (n.radius >= n.maxRadius) { n.state = 'COOLDOWN'; n.cooldownTimer = 1.0; }
        } else if (n.state === 'COOLDOWN') {
            n.cooldownTimer -= dt;
            n.radius = Math.max(8, n.radius - 200 * dt); // Visual shrink
            if (n.cooldownTimer <= 0) { n.state = 'IDLE'; n.radius = 8; }
        }
    }
}
