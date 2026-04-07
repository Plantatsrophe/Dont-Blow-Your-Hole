/**
 * WORLD RENDERING ENGINE
 * ----------------------
 * Handles the static and semi-static geometry of the game world.
 * Includes tile-map rendering, conduit/pipe systems, and map caching logic.
 */

import { G, canvas, ctx, offscreenMapCanvas, offscreenMapCtx, TILE_SIZE } from '../core/globals.js';
import { sprPortal, sprPipe } from '../assets/assets.js';
import { drawSprite, drawGlow } from './render_utils.js';

/**
 * Renders the vertical pipe infrastructure for the Septicus boss fight.
 * Includes dynamic "water flow" animations once valves are purified.
 */
export function renderConduits() {
    const { items, purifiedValves, activeValvePos, valveCutsceneTimer, mapRows } = G;
    
    // Conduits are unique to the Sewer (Septicus) encounter
    if (G.boss && G.boss.type === 'septicus') {
        for (let i of items) {
            if (i.type === 'valve' || i.type === 'detonator') {
                let px = i.x, py = (Math.floor(i.y / TILE_SIZE) + 3) * TILE_SIZE; 
                
                // Static Pipe Stem
                ctx.fillStyle = '#5e4533'; ctx.fillRect(i.x, 0, TILE_SIZE, py - TILE_SIZE);
                ctx.fillStyle = '#6d5241'; ctx.fillRect(i.x + 12, 0, 8, py - TILE_SIZE);
                drawSprite(ctx, sprPipe, px, py - TILE_SIZE, 40, 40, false);
                
                // Flow Animation (Blue water pouring out of bottom)
                let pv = purifiedValves.find(v => v.x === i.x && v.y === i.y);
                if (pv) {
                    let isActive = (activeValvePos && activeValvePos.x === pv.x && activeValvePos.y === pv.y);
                    ctx.save(); 
                    ctx.globalAlpha = isActive ? 1.0 : 0.7; 
                    ctx.fillStyle = '#1e90ff'; 
                    let flowOffset = Math.sin(Date.now() * 0.01) * 3, startY = py - 10, endY = mapRows * TILE_SIZE; 
                    ctx.fillRect(px + 10 + flowOffset, startY, isActive ? 22 : 11, endY - startY);
                    drawGlow(ctx, px + 20, endY - 5, isActive ? 70 : 35, 'rgba(0, 187, 255, 0.5)');
                    ctx.restore();
                }
            }
        }
    }
}

/**
 * Map Caching Logic (Pre-Renderer).
 * Draws the entire level's static tiles onto an offscreen canvas once per level load.
 * This significantly improves performance by reducing per-frame draw calls for static geometry.
 */
export function preRenderMap() {
    if (G.isMapCached) return;
    const { map, mapRows, mapCols, currentLevel } = G;
    const bId = Math.floor(currentLevel / 20) % 5;

    // Initialize or resize the cache canvas
    offscreenMapCanvas.width = mapCols * TILE_SIZE; offscreenMapCanvas.height = mapRows * TILE_SIZE;
    offscreenMapCtx.clearRect(0, 0, offscreenMapCanvas.width, offscreenMapCanvas.height);
    
    for (let row = 0; row < mapRows; row++) {
        for (let col = 0; col < mapCols; col++) {
            let tile = map[row][col], tx = col * TILE_SIZE, ty = row * TILE_SIZE;
            
            // --- 1. SOLID BLOCKS (Tile 1 & 6) ---
            if (tile === 1 || tile === 6) {
                if (bId === 2) { // MINE BIOME: Jagged rock aesthetic
                    const leftSame = col > 0 && map[row][col-1] === 1;
                    const rightSame = col < mapCols-1 && map[row][col+1] === 1;

                    offscreenMapCtx.fillStyle = '#1a120b'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    offscreenMapCtx.fillStyle = '#2b1d12'; 
                    // Draw irregular rock geometry
                    offscreenMapCtx.beginPath();
                    if (!leftSame) offscreenMapCtx.moveTo(tx, ty + 20); else offscreenMapCtx.moveTo(tx, ty + 15);
                    offscreenMapCtx.lineTo(tx + 20, ty + 10); offscreenMapCtx.lineTo(tx + 40, ty + 25); offscreenMapCtx.lineTo(tx + 40, ty + 40); offscreenMapCtx.lineTo(tx, ty + 40);
                    offscreenMapCtx.fill();
                    
                    // Top Surface (Wood/Soil)
                    offscreenMapCtx.fillStyle = '#3d2b1f'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 6);
                    offscreenMapCtx.fillStyle = '#1a120b'; offscreenMapCtx.fillRect(tx, ty + 6, TILE_SIZE, 2);
                    
                    if (!leftSame) { offscreenMapCtx.fillStyle = 'rgba(0,0,0,0.3)'; offscreenMapCtx.fillRect(tx, ty, 2, TILE_SIZE); }
                    if (!rightSame) { offscreenMapCtx.fillStyle = 'rgba(0,0,0,0.5)'; offscreenMapCtx.fillRect(tx + TILE_SIZE - 2, ty, 2, TILE_SIZE); }

                    // Decorative Ore Flecks (Gold/Silver)
                    if ((row * 7 + col * 3) % 11 < 3) {
                        offscreenMapCtx.fillStyle = (col % 2 === 0) ? '#ffd700' : '#ff8c00';
                        offscreenMapCtx.fillRect(tx + 12 + (row%4)*4, ty + 12 + (col%4)*4, 2, 2);
                    }
                    offscreenMapCtx.fillStyle = 'rgba(255, 255, 255, 0.05)'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 1);
                } else {
                    // INDUSTRIAL / SLUMS: Blocky metal plate aesthetic
                    offscreenMapCtx.fillStyle = '#2f2c2b'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    offscreenMapCtx.fillStyle = '#6e3c15'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 4);
                    offscreenMapCtx.fillStyle = '#110d0c'; offscreenMapCtx.fillRect(tx, ty + 4, TILE_SIZE, 2);
                    offscreenMapCtx.strokeStyle = '#1a1818'; offscreenMapCtx.lineWidth = 2; offscreenMapCtx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
                
                // Adaptive Cleanup: If a ladder ends on this block, draw the ladder mount point.
                if (row < mapRows - 1 && (map[row+1][col] === 2 || map[row+1][col] === 9)) {
                    offscreenMapCtx.fillStyle = '#4a3d38'; offscreenMapCtx.fillRect(tx + 10, ty, 5, TILE_SIZE); offscreenMapCtx.fillRect(tx + 25, ty, 5, TILE_SIZE);
                    for (let i = 0; i < 4; i++) { offscreenMapCtx.fillStyle = '#78432a'; offscreenMapCtx.fillRect(tx + 10, ty + i * 10 + 5, 20, 3); }
                }
            // --- 2. LADDERS (Tile 2 & 9=Ghost Pillar) ---
            } else if (tile === 2 || tile === 9) {
                if (tile === 9) { // Ghost Pillars (Pass-through tiles that LOOK like solids)
                    if (bId === 2) { 
                        offscreenMapCtx.fillStyle = '#1a120b'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                        offscreenMapCtx.fillStyle = '#2b1d12'; offscreenMapCtx.beginPath(); offscreenMapCtx.moveTo(tx, ty + 20); offscreenMapCtx.lineTo(tx + 20, ty + 10); offscreenMapCtx.lineTo(tx + 40, ty + 25); offscreenMapCtx.lineTo(tx + 40, ty + 40); offscreenMapCtx.lineTo(tx, ty + 40); offscreenMapCtx.fill();
                        offscreenMapCtx.strokeStyle = '#0a0805'; offscreenMapCtx.lineWidth = 1; offscreenMapCtx.beginPath(); offscreenMapCtx.moveTo(tx + 5, ty + 15); offscreenMapCtx.lineTo(tx + 15, ty + 25); offscreenMapCtx.stroke();
                        offscreenMapCtx.fillStyle = '#3d2b1f'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 6); offscreenMapCtx.fillStyle = '#1a120b'; offscreenMapCtx.fillRect(tx, ty + 6, TILE_SIZE, 2);
                        if ((row * 7 + col * 3) % 11 < 3) { offscreenMapCtx.fillStyle = (col % 2 === 0) ? '#ffd700' : '#ff8c00'; offscreenMapCtx.fillRect(tx + 12 + (row%4)*4, ty + 12 + (col%4)*4, 2, 2); }
                        offscreenMapCtx.fillStyle = 'rgba(255, 255, 255, 0.05)'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 1);
                    } else {
                        offscreenMapCtx.fillStyle = '#2f2c2b'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                        offscreenMapCtx.fillStyle = '#6e3c15'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 4);
                        offscreenMapCtx.fillStyle = '#110d0c'; offscreenMapCtx.fillRect(tx, ty + 4, TILE_SIZE, 2);
                        offscreenMapCtx.strokeStyle = '#1a1818'; offscreenMapCtx.lineWidth = 2; offscreenMapCtx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    }
                }
                // Draw Ladder Rungs
                offscreenMapCtx.fillStyle = '#4a3d38'; offscreenMapCtx.fillRect(tx + 10, ty, 5, TILE_SIZE); offscreenMapCtx.fillRect(tx + 25, ty, 5, TILE_SIZE);
                for (let i = 0; i < 4; i++) { offscreenMapCtx.fillStyle = '#78432a'; offscreenMapCtx.fillRect(tx + 10, ty + i * 10 + 5, 20, 3); }
            // --- 3. HAZARDS (Tile 3=Spikes) ---
            } else if (tile === 3) {
                let spikeGrad = offscreenMapCtx.createLinearGradient(0, ty + TILE_SIZE, 0, ty); spikeGrad.addColorStop(0, '#332a22'); spikeGrad.addColorStop(1, '#ff3300');
                offscreenMapCtx.fillStyle = spikeGrad; offscreenMapCtx.beginPath(); let spikesCount = 4, w = TILE_SIZE / spikesCount;
                for (let s = 0; s < spikesCount; s++) { offscreenMapCtx.moveTo(tx + s * w + w/2, ty + TILE_SIZE/2); offscreenMapCtx.lineTo(tx + (s+1) * w, ty + TILE_SIZE); offscreenMapCtx.lineTo(tx + s * w, ty + TILE_SIZE); }
                offscreenMapCtx.fill(); drawGlow(offscreenMapCtx, tx + TILE_SIZE/2, ty + TILE_SIZE/2 + 4, 30, 'rgba(255, 30, 0, 0.3)');
            // --- 4. WATER/ACID (Tile 15) ---
            } else if (tile === 15) {
                if (G.acidPurified) { // Blue Water
                    offscreenMapCtx.fillStyle = '#003366'; offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, TILE_SIZE - 12);
                    offscreenMapCtx.fillStyle = '#1e90ff'; offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, 4);
                    drawGlow(offscreenMapCtx, tx + TILE_SIZE/2, ty + 16, 20, 'rgba(0, 187, 255, 0.4)');
                } else { // Green Sludge
                    offscreenMapCtx.fillStyle = '#0a210f'; offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, TILE_SIZE - 12);
                    offscreenMapCtx.fillStyle = '#1b5c21'; offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, 4);
                    drawGlow(offscreenMapCtx, tx + TILE_SIZE/2, ty + 16, 20, 'rgba(62, 232, 85, 0.4)');
                }
            // --- 5. WORLD BORDER (Tile 16) ---
            } else if (tile === 16) {
                if (bId === 0) { // Slums: Metal fence
                    offscreenMapCtx.fillStyle = '#1a1818'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    offscreenMapCtx.strokeStyle = '#333333'; offscreenMapCtx.lineWidth = 2; offscreenMapCtx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    offscreenMapCtx.fillStyle = '#4d4d4d'; offscreenMapCtx.fillRect(tx + 4, ty + 4, 4, 4); offscreenMapCtx.fillRect(tx + TILE_SIZE - 8, ty + 4, 4, 4);
                    offscreenMapCtx.fillRect(tx + 4, ty + TILE_SIZE - 8, 4, 4); offscreenMapCtx.fillRect(tx + TILE_SIZE - 8, ty + TILE_SIZE - 8, 4, 4);
                } else if (bId === 1) { // Sewer: Bio-metal
                    offscreenMapCtx.fillStyle = '#0a1a0d'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    offscreenMapCtx.fillStyle = '#1b5c21'; offscreenMapCtx.globalAlpha = 0.3; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE); offscreenMapCtx.globalAlpha = 1.0;
                    offscreenMapCtx.strokeStyle = '#051107'; offscreenMapCtx.lineWidth = 3; offscreenMapCtx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                } else if (bId === 2) { // Mine: Heavy timber
                    offscreenMapCtx.fillStyle = '#0d0a08'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    offscreenMapCtx.fillStyle = '#2b1d12'; 
                    if (row === 0 || row === mapRows - 1) offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, 16); 
                    if (col === 0 || col === mapCols - 1) offscreenMapCtx.fillRect(tx + 12, ty, 16, TILE_SIZE);
                    offscreenMapCtx.strokeStyle = '#1a120b'; offscreenMapCtx.lineWidth = 2; offscreenMapCtx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    // Static geometry for Virtual biome handled in two-pass logic below the loop
                    // We only fill the background for non-HUD tiles to allow parallax transparency
                    if (ty >= 40) {
                        offscreenMapCtx.fillStyle = '#0a0a1a';
                        offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    }
                } else { // Goliath/Void: Abstract cyber-hell
                    offscreenMapCtx.fillStyle = '#0a000a'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    offscreenMapCtx.strokeStyle = '#ff00ff'; offscreenMapCtx.lineWidth = 1; offscreenMapCtx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    offscreenMapCtx.fillStyle = 'rgba(255, 0, 255, 0.1)'; offscreenMapCtx.fillRect(tx + 5, ty + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                }
            }
        }
    }

    // --- PASS 2: VIRTUAL BIOME NEON BORDERS ---
    // Specifically for bId 3 (Virtual), we apply a glowing neon border pass over the solid backgrounds
    if (bId === 3) {
        offscreenMapCtx.save();
        offscreenMapCtx.strokeStyle = '#00ffff';
        offscreenMapCtx.lineWidth = 2;
        offscreenMapCtx.shadowBlur = 8;
        offscreenMapCtx.shadowColor = '#00ffff';
        offscreenMapCtx.globalCompositeOperation = 'lighter';
        
        for (let row = 0; row < mapRows; row++) {
            for (let col = 0; col < mapCols; col++) {
                let tile = map[row][col], tx = col * TILE_SIZE, ty = row * TILE_SIZE;
                // HUD Zone Cleanup: Do not draw glowing borders in the top HUD area
                if (ty < 40) continue;
                if (tile === 1 || tile === 6 || tile === 16) {
                    offscreenMapCtx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                }
            }
        }
        offscreenMapCtx.restore(); // Critical: Reset shadowBlur and compositeOperation
    }

    G.isMapCached = true;
}

/**
 * Animated Tiles Renderer.
 * Draws dynamic tiles (Portals) that require per-frame animation.
 * Culling is implemented to only render tiles currently visible in the camera view.
 */
export function renderAnimatedTiles() {
    const { map, mapRows, mapCols, camera } = G;
    
    // Viewport Culling
    let startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE)), endCol = Math.min(mapCols - 1, Math.floor((camera.x + canvas.width) / TILE_SIZE));
    let startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE)), endRow = Math.min(mapRows - 1, Math.floor((camera.y + canvas.height) / TILE_SIZE));
    
    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            if (map[row][col] === 5) { // Exit Portal
                let tx = col * TILE_SIZE, ty = row * TILE_SIZE;
                // Periodic breathing animation
                let pulse = 1 + Math.sin(Date.now() / 150) * 0.1, undulate = 1 + Math.cos(Date.now() / 120) * 0.1;
                let pW = TILE_SIZE * pulse, pH = TILE_SIZE * undulate;
                
                drawGlow(ctx, tx + TILE_SIZE/2, ty + TILE_SIZE/2, 40, 'rgba(0, 255, 255, 0.5)');
                drawSprite(ctx, sprPortal, tx + (TILE_SIZE - pW)/2, ty + (TILE_SIZE - pH)/2, pW, pH, false);
            }
        }
    }
    renderVirtualHazards(); // Call dynamic hazard renderer
}

/**
 * Renders the dynamic Virtual-biome hazards (Sectors and Nodes).
 * Applies magenta neon effects with additive blending.
 */
export function renderVirtualHazards() {
    if (Math.floor(G.currentLevel / 20) % 5 !== 3) return;

    const { corruptedSectors, malwareNodes, camera } = G;

    // 1. Corrupted Memory Sectors
    for (let s of corruptedSectors) {
        // Culling: Skip if far outside camera view
        if (s.x + s.width < camera.x || s.x > camera.x + canvas.width || s.y + s.height < camera.y || s.y > camera.y + canvas.height) continue;
        
        ctx.save();
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        if (s.isActive) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff00ff';
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
            ctx.fillRect(s.x, s.y, s.width, s.height);
        } else {
            ctx.globalAlpha = 0.3; // De-emphasize inactive sectors
        }
        ctx.strokeRect(s.x + 2, s.y + 2, s.width - 4, s.height - 4);
        
        // Draw internal "X" circuit pattern
        ctx.beginPath();
        ctx.moveTo(s.x + 4, s.y + 4); ctx.lineTo(s.x + s.width - 4, s.y + s.height - 4);
        ctx.moveTo(s.x + s.width - 4, s.y + 4); ctx.lineTo(s.x + 4, s.y + s.height - 4);
        ctx.stroke();
        
        ctx.restore(); // Safety: shadows and compositeOperation reset
    }

    // 2. Malware Nodes (Starbursts)
    for (let n of malwareNodes) {
        // Culling
        if (n.x + n.maxRadius < camera.x || n.x - n.maxRadius > camera.x + canvas.width || n.y + n.maxRadius < camera.y || n.y - n.maxRadius > camera.y + canvas.height) continue;

        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.strokeStyle = '#ff00ff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff00ff';
        ctx.globalCompositeOperation = 'lighter';
        
        // Dynamic Starburst Shape
        let spikes = 8;
        let rot = Date.now() * 0.004;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            let r = (i % 2 === 0) ? n.radius : n.radius * 0.4;
            let angle = (i / spikes) * Math.PI + rot;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.stroke();
        
        if (n.state === 'EXPANDING') {
            ctx.fillStyle = 'rgba(255, 0, 255, 0.4)';
            ctx.fill();
        }
        
        ctx.restore(); // Safety
    }
}

