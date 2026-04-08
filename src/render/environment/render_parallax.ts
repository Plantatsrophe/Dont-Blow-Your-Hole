/**
 * PARALLAX MOTION ENGINE
 * ----------------------
 * Orchestrates the multi-layered background scrolling system.
 * This module calculates the depth gradients and background offsets 
 * relative to the camera to create a 3D sense of scale in a 2D world.
 */

import { G, canvas, ctx } from '../../core/globals.js';
import { 
    drawSlumsParallax, drawSewerParallax, drawMineParallax, 
    renderVirtualBackground, drawH311Parallax, drawSlumsLayer2 
} from './render_biomes.js';

/**
 * Renders the primary background layers (Sky & Far Parallax).
 * Switches logic based on the current Biome ID.
 */
export function renderParallax() {
    const { currentLevel, camera } = G;
    const bId = Math.floor(currentLevel / 20) % 5;
    
    // Boss-specific state for dynamic background effects (e.g., Sewer purification)
    let boss = G.boss;
    let hpRatio = 1.0;
    if (currentLevel === 39) { // Septicus Boss Fight
        if (!boss || !boss.active || boss.hp <= 0 || boss.isSinking || !boss.maxHp) hpRatio = 0.0;
        else hpRatio = boss.hp / boss.maxHp;
    }

    // --- PHASE 1: ATMOSPHERIC GRADIENTS ---
    // Background sky colors change per biome to set the mood.
    let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (bId === 1) { // Sewer: Murky greens/blues that shift as boss health drops
        let cMurk = hpRatio > 0.5 ? '#0a210f' : (hpRatio > 0.1 ? '#0a161f' : '#0a0f1a');
        let cDeep = hpRatio > 0.5 ? '#1b5c21' : (hpRatio > 0.1 ? '#1b4a5c' : '#1b3a5c');
        skyGradient.addColorStop(0, '#020502'); 
        skyGradient.addColorStop(0.5, cMurk);
        skyGradient.addColorStop(1, cDeep);
    } else if (bId === 2) { // Mine: Earthy browns
        skyGradient.addColorStop(0, '#0a0805'); skyGradient.addColorStop(1, '#261a12');
    } else if (bId === 3) { // Virtual: Glitchy digital mainframe
        skyGradient.addColorStop(0, '#0a0a1a'); skyGradient.addColorStop(1, '#0a0a1a');
    } else if (bId === 4) { // H311: Hellish reds
        skyGradient.addColorStop(0, '#2b0202'); skyGradient.addColorStop(1, '#7a0505');
    } else { // Slums: Sunset urban oranges
        skyGradient.addColorStop(0, '#0a0a1a'); skyGradient.addColorStop(1, '#a34110');
    }
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- PHASE 2: BIOME-SPECIFIC OBJECTS ---
    // Draw the procedural geometry (buildings, pipes, beams) with varied parallax multipliers.
    if (bId === 0) drawSlumsParallax(camera.x * 0.2);
    else if (bId === 1) drawSewerParallax(camera.x * 0.3, hpRatio);
    else if (bId === 2) drawMineParallax(camera.y * 0.4); // Mines use vertical parallax
    else if (bId === 3) renderVirtualBackground(camera.x, camera.y);
    else if (bId === 4) drawH311Parallax(camera.x * 0.05);
}

/**
 * Renders secondary, closer background layers for added depth.
 */
export function renderParallaxLayer2() {
    const { currentLevel } = G;
    const bId = Math.floor(currentLevel / 20) % 5;
    if (bId === 0) drawSlumsLayer2(G.camera.x); // Distant mountains/cityscape for Slums
}

