// main.js — Single entry point for the Don't Die game
// Imports trigger all module side-effects (event listeners in input.js, etc.)
import { parseMap, resetPlayerPosition } from './logic/spawner.js?v=126';
import { gameLoop } from './core/game.js?v=126';
import './core/input.js?v=126'; 

// Boot sequence
parseMap();
resetPlayerPosition();

// Expose to window for console access (Cheats/Debugging)
window.parseMap = parseMap;
window.resetPlayerPosition = resetPlayerPosition;

requestAnimationFrame(gameLoop);
