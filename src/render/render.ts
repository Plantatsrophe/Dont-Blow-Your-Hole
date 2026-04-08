/**
 * MASTER RENDERER (Don't Die)
 * ---------------------------
 * Coordinates the entire visual pipeline for each animation frame.
 * 
 * THE RENDER PIPELINE:
 * 1. Screen-Space Backgrounds (Parallax)
 * 2. Viewport-Transformed World (Tiles, Entities, Bosses, Player)
 * 3. Screen-Space Overlays (HUD, Menus, UI)
 */

import { G, canvas, ctx, offscreenMapCanvas } from '../core/globals.js';
import { renderParallax, renderParallaxLayer2 } from './environment/render_parallax.js';
import { renderStartScreen, renderIntroScreen, renderInstructions } from './screens/render_menus.js';
import { renderConduits, preRenderMap, renderAnimatedTiles, renderCrumblingBlocks } from './environment/render_world.js';
import { renderEntities } from './actors/render_entities.js';
import { renderBoss } from './bosses/render_bosses.js';
import { renderPlayer, renderPlayerCutscene } from './actors/render_player.js';
import { renderHUD, renderOverlays, renderCredits, renderShareButton } from './screens/render_ui.js';
import { renderGeysers } from './elements/render_geysers.js';
import { renderPortals, renderImps } from './elements/render_imps.js';

/**
 * Main render function called by the game loop.
 * Switches between menu-specific rendering and active world-rendering.
 */
export function render() {
    const { gameState, camera } = G;

    // --- PHASE 1: Menu & Static Screen Passthrough ---
    if (gameState === 'START') { renderStartScreen(); return; }
    if (gameState === 'INTRO') { renderIntroScreen(); return; }
    if (gameState === 'INSTRUCTIONS') { renderInstructions(); return; }

    // --- PHASE 2: Background Parallax Layers ---
    // These render in screen-space before the world camera is applied.
    renderParallax();
    renderParallaxLayer2();

    // --- PHASE 3: World-Space Rendering ---
    // Save current canvas state and translate the context based on the camera position.
    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    // Render world static geometry and animated tiles
    renderConduits();
    preRenderMap(); // Draws the static map from the offscreen canvas cache
    ctx.drawImage(offscreenMapCanvas, 0, 0);
    renderAnimatedTiles();
    renderCrumblingBlocks();
    renderGeysers(); // Z-Order: Behind entities and player
    renderPortals();
    renderImps();
    
    // Render all active dynamic entities
    renderEntities(); // Bots, Items, Projectiles, Particles
    renderBoss();
    renderPlayer();
    renderPlayerCutscene(); // Cinematic effects like level-clear warp

    // Restore the canvas to its original (screen-space) state.
    ctx.restore();

    // --- PHASE 4: HUD & UI Overlays ---
    // HUD elements are rendered in screen-space on top of the world.
    renderHUD();
    renderOverlays();
    renderCredits();
    renderShareButton();
}
