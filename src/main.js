// main.js — Single entry point for the Don't Die game
// Imports trigger all module side-effects (event listeners in input.js, etc.)
import { parseMap, resetPlayerPosition } from './logic/spawner.js?v=127';
import { gameLoop } from './core/game.js?v=127';
import './core/input.js?v=127'; 

// Boot sequence
parseMap();
resetPlayerPosition();

// Expose to window for console access (Cheats/Debugging)
window.parseMap = parseMap;
window.resetPlayerPosition = resetPlayerPosition;
window.skipLevel = (n) => {
    import('./core/globals.js?v=127').then(({ G }) => {
        G.currentLevel = n;
        parseMap();
        resetPlayerPosition();
        console.log(`Skipped to level ${n + 1} (Index ${n})`);
    });
};

requestAnimationFrame(gameLoop);
