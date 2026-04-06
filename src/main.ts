/**
 * MAIN ENTRY POINT (Don't Die)
 * ----------------------------
 * This file serves as the kernel of the application. It orchestrates the 
 * initial boot sequence, coordinates cross-module dependencies, and 
 * starts the master requestAnimationFrame loop.
 * 
 * DESIGN NOTE: Some modules (like input.js) are imported solely for their 
 * top-level side effects (e.g., adding global event listeners).
 */

import { parseMap, resetPlayerPosition } from './logic/spawner.js';
import { gameLoop } from './core/game.js';
import './core/input.js'; 

/**
 * INITIAL BOOT SEQUENCE
 * ---------------------
 * 1. Parse the current map data (defaults to Level 0).
 * 2. Position the player at the designated spawn point.
 */
parseMap();
resetPlayerPosition();

/**
 * GLOBAL DEBUG INTERFACE
 * ----------------------
 * Exposes core state manipulation functions to the browser console.
 * Usage: window.skipLevel(40) // Jumps to Mine Biome
 */
window.parseMap = parseMap;
window.resetPlayerPosition = resetPlayerPosition;
window.skipLevel = (n: number) => {
    import('./core/globals.js').then(({ G }) => {
        G.currentLevel = n;
        parseMap();
        resetPlayerPosition();
        console.log(`Skipped to level ${n + 1} (Index ${n})`);
    });
};

/**
 * START THE ENGINE
 * ----------------
 * Hooks the central game loop into the browser's refresh cycle (~60fps).
 */
requestAnimationFrame(gameLoop);
