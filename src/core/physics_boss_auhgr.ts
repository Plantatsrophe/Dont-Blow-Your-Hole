import { G, player, TILE_SIZE, particlePool, getNextParticle } from './globals.js';
import { playerDeath } from './physics_utils.js';

/**
 * Executes the entire physics routine for the Auh-Gr boss encounter (Level 59).
 * Auh-Gr is a massive, screen-wide mechanical drill boss that relentlessly climbs
 * upwards from the bottom of the level, instantly shredding the map, enemies, and items.
 * 
 * @param boss The current generic boss object representing Auh-Gr
 * @param dt Delta time for framerate independent movement
 */
export function updateAuhGr(boss: any, dt: number) {
    // Relentless vertical climb
    boss.vy = -70; 
    boss.y += boss.vy * dt;

    // Hard-locked X-coordinate: Anchored 16px to the right to naturally align
    // with the visual grid while slightly favoring visual centering.
    boss.x = 16; 

    // Calculate player collision against tight hitboxes mapped physically to his drills
    let pB = player.y + player.height;
    let cx = player.x + player.width/2;
    let dead = false;

    // ----- HITBOX DEFINITIONS (Sprite Base Width = 768px, 48 columns total) -----
    // Center Drill Hitbox: Extends over columns 15 to 31.
    // X-Span: +240px to +512px. The drill points cleanly to his head (+10 Y padding).
    if (cx > boss.x + 240 && cx < boss.x + 512 && pB > boss.y + 10) dead = true;
    
    // Left Drill Hitbox: Extends over columns 0 to 11.
    // X-Span: 0px to +192px. The drill tip stars 4 rows down the sprite (y + 64).
    if (cx <= boss.x + 192 && pB > boss.y + 64) dead = true;
    
    // Right Drill Hitbox: Extends over columns 36 to 48.
    // X-Span: +576px to +768px. Same downward offset as the left drill.
    if (cx >= boss.x + 576 && pB > boss.y + 64) dead = true;
    
    // Main Chassis / Shoulder Hitbox: The massive flat metal body
    // Y-span: Begins roughly 7 rows deep into the sprite matrix (y + 112).
    if (pB > boss.y + 112) dead = true;

    // Any collision yields immediate death
    if (dead) playerDeath();

    // ----- DESTRUCTION ENGINE -----
    
    // 1. Map Destruction: To prevent processing lag, only eviscerate map tiles that 
    // are actively within the 6 rows his drills are chewing through.
    let topRow = Math.floor(boss.y / TILE_SIZE);
    for (let r = topRow; r < Math.min(G.mapRows, topRow + 6); r++) {
        for (let c = 1; c < G.mapCols - 1; c++) {
            if (G.map[r] && G.map[r][c] !== 0) {
                G.map[r][c] = 0; // Destroy the tile
                G.isMapCached = false; // Invalidate background canvas
                
                // Fire off 12 grey visual shrapnel particles per tile to simulate chewing
                for (let j = 0; j < 12; j++) {
                    let p = getNextParticle(); p.active = true; p.type = 'normal'; p.size = Math.random() * 4 + 2;
                    p.x = c * TILE_SIZE + Math.random() * TILE_SIZE; 
                    p.y = boss.y + Math.random() * 40; 
                    p.vx = (Math.random() - 0.5) * 350; // Violent horizontal spray
                    p.vy = -100 - Math.random() * 250; // Upward burst
                    p.color = ['#555','#777','#444','#888','#333'][Math.floor(Math.random()*5)]; 
                    p.maxLife = 0.4 + Math.random() * 0.6; p.life = p.maxLife;
                }
            }
        }
    }

    // 2. Enemy Evisceration: If the boss overtakes an enemy, shred them into gore
    for (let i = G.enemies.length - 1; i >= 0; i--) { 
        let e = G.enemies[i];
        if (e.y > boss.y) { 
            // Trigger 30 deep red particles simulating robot guts/oil
            for(let k=0;k<30;k++){
                let p=getNextParticle(); p.active=true; p.type='normal'; p.x=e.x+Math.random()*24; p.y=e.y+Math.random()*24; 
                p.vx=(Math.random()-0.5)*500; p.vy=-150-Math.random()*300; 
                p.color=['#f00','#900','#c00','#ff4444'][Math.floor(Math.random()*4)]; 
                p.size=2+Math.random()*4; p.maxLife=0.7; p.life=p.maxLife;
            }
            G.enemies.splice(i, 1); // Permanently delete enemy
        } 
    }

    // 3. Item Evisceration: Destroy uncollected gears/hotdogs so they aren't floating in space
    for (let i = G.items.length - 1; i >= 0; i--) { 
        let it = G.items[i];
        // Note: we strictly ignore already 'collected' items so they successfully jump the checkpoint
        if (!it.collected && it.y > boss.y) { 
            // Trigger 20 yellow/wood shards simulating broken loot
            for(let k=0;k<20;k++){
                let p=getNextParticle(); p.active=true; p.type='normal'; p.x=it.x+Math.random()*32; p.y=it.y+Math.random()*32; 
                p.vx=(Math.random()-0.5)*400; p.vy=-100-Math.random()*200; 
                p.color=['#ff0','#dda15e','#fefae0','#bc6c25'][Math.floor(Math.random()*4)]; 
                p.size=2+Math.random()*3; p.maxLife=0.6; p.life=p.maxLife;
            }
            G.items.splice(i, 1); // Permanently delete uncollected item
        } 
    }
}
