import { G, player, keys, TILE_SIZE, laserPool, particlePool, getNextParticle } from './globals.js';
import { playSound } from '../assets/audio.js';
import type { IRect, IEntity, IParticle } from '../types.js';

/**
 * Standard AABB (Axis-Aligned Bounding Box) 2D collision check.
 * Evaluates whether two standard rectangular entities overlap in space.
 * 
 * @param r1 The first rectangle (e.g. Player)
 * @param r2 The second rectangle (e.g. Enemy or Item)
 * @returns True if intersecting, False otherwise
 */
export function checkRectCollision(r1: IRect, r2: IRect): boolean {
    return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
}

// Optimization: Pre-allocated reusable array for tile collisions.
// Prevents continuous array allocating/deallocating every frame, significantly reducing
// Garbage Collection (GC) pauses during intense gameplay.
const TILE_CACHE: any[] = [];

/**
 * Sweeps the level grid to find all static map tiles that currently
 * intersect with a given entity's bounding box.
 * 
 * @param rect The bounding box of the entity to check
 * @returns An array from the TILE_CACHE of intersecting tile data
 */
export function getCollidingTiles(rect: IRect) {
    TILE_CACHE.length = 0; // Clear cache without reallocating
    
    // Slight inner-padding (0.0001) avoids snagging on perfectly flush tile borders
    let sc = Math.floor((rect.x + 0.0001) / TILE_SIZE);
    let ec = Math.floor((rect.x + rect.width - 0.0001) / TILE_SIZE);
    let sr = Math.floor((rect.y + 0.0001) / TILE_SIZE);
    let er = Math.floor((rect.y + rect.height - 0.0001) / TILE_SIZE);
    
    for (let row = sr; row <= er; row++) {
        for (let col = sc; col <= ec; col++) {
            if (row >= 0 && row < G.mapRows && col >= 0 && col < G.mapCols) {
                // Return structured data for the physics engine to resolve
                TILE_CACHE.push({ row, col, type: G.map[row][col], rect: { x: col*TILE_SIZE, y: row*TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE } });
            }
        }
    }
    return TILE_CACHE;
}

/**
 * Immediately halts gameplay and executes the player death sequence.
 * This function is responsible for locking inputs, despawning hazards,
 * resetting boss mechanics, and spawning the gruesome death quad-particles.
 */
export function playerDeath() {
    if (G.gameState === 'DYING') return; // Prevent double execution
    
    playSound('die'); 
    G.gameState = 'DYING'; 
    player.dyingTimer = 0;
    
    // Hard-lock all user inputs instantly
    keys.ArrowLeft = false; keys.ArrowRight = false; keys.ArrowUp = false; keys.ArrowDown = false; keys.Space = false;
    
    // Clear the screen of immediate energy hazards
    for (let l of laserPool) l.active = false;
    
    // Reset Boss specific AI variables and tracking
    if (G.boss && G.boss.active) { 
        if (G.boss.type === 'masticator') { G.boss.phase = 0; G.boss.vx = 0; G.boss.hasSeenPlayer = false; } 
        if (G.boss.type === 'auh-gr') {
            G.boss.triggered = false;
            G.boss.active = false; // Completely despawn Auh-Gr until re-triggered
        }
        
        // Reset boss physical anchors
        G.boss.x = (G.boss.startX !== undefined) ? G.boss.startX : G.boss.x;
        // Auh-Gr specifically resets far below the map (-200 offset) to maintain the cinematic climb
        G.boss.y = (G.boss.type === 'auh-gr' && G.boss.startY !== undefined) ? (G.boss.startY + 200) : (G.boss.startY ?? G.boss.y);
        
        if (G.boss.projs) G.boss.projs = []; // Delete active boss projectiles
    }
    
    // Violent Death Particle Engine:
    // Slices the player's 32x32 bounding box into 4 perfect square quadrants (16x16)
    // and explodes them outward rapidly in all 4 diagonal directions.
    for (let i = 0; i < 4; i++) {
        let qx = (i % 2 === 0) ? 0 : 1; 
        let qy = (i < 2) ? 0 : 1; 
        let p = getNextParticle();
        
        p.active = true; 
        p.type = 'playerQuad'; 
        p.qx = qx; 
        p.qy = qy; 
        p.x = player.x + (qx * player.width/2); 
        p.y = player.y + (qy * player.height/2); 
        p.vx = (qx === 0 ? -1 : 1) * (150 + Math.random()*50); 
        p.vy = (qy === 0 ? -1 : 1) * (150 + Math.random()*50) - 100; // General upward bias
        p.size = Math.max(player.width, player.height) / 2; 
        p.life = 1.5; 
        p.maxLife = 2.0; 
        p.flip = player.lastDir === -1; // Maintain player's last facing direction for the chunks
    }
    
    // Completely nullify physics
    player.vx = 0; player.vy = 0; player.isOnGround = false; player.isClimbing = false; player.riding = null;
}
