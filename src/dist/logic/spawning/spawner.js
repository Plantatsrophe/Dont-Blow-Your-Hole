import { G, player, TILE_SIZE, offscreenMapCanvas, reflectorPool, laserPool, particlePool } from '../../core/globals.js';
import { staticLevels } from '../../data/levels.js';
import { buildGlitchArena } from './spawner_glitch_arena.js';
import { spawnEntityAt } from './spawner_entities.js';
import { setupCheatHooks } from './spawner_utils.js';
let lastLevel = -1;
/**
 * The Master Map Parser.
 * Iterates through the raw ASCII map and populates the physics grid and entities.
 */
export function parseMap(resetEntities = true) {
    if (G.currentLevel !== lastLevel) {
        G.cleanedPipes = [];
        G.checkpointPos = null;
        lastLevel = G.currentLevel;
    }
    G.timer = staticLevels[G.currentLevel].timer ?? 60;
    G.corruptedSectors = [];
    G.malwareNodes = [];
    G.geysers = [];
    G.demonPortals = [];
    reflectorPool.length = 0;
    let currentMapData = staticLevels[G.currentLevel].map;
    G.mapRows = currentMapData.length;
    G.mapCols = currentMapData[0].length;
    G.map = [];
    if (resetEntities) {
        G.items = [];
        G.enemies = [];
        G.platforms = [];
        G.bombs = [];
        for (let l of laserPool)
            l.active = false;
        G.boss = { active: false, timer: 0, hp: 0, phase: 0, hurtTimer: 0, vibrateX: 0, vx: 0, vy: 0, hasSeenPlayer: false, x: 0, y: 0, width: 0, height: 0, type: 'boss', squash: 1, squashTimer: 0 };
        G.purifiedValves = [];
    }
    for (let p of particlePool)
        p.active = false;
    G.isMapCached = false;
    G.acidPurified = false;
    offscreenMapCanvas.width = G.mapCols * TILE_SIZE;
    offscreenMapCanvas.height = G.mapRows * TILE_SIZE;
    let spawnFound = false;
    for (let row = 0; row < G.mapRows; row++) {
        let rowData = [];
        for (let col = 0; col < G.mapCols; col++) {
            let char = currentMapData[row][col];
            if (row === 0 || row === G.mapRows - 1 || col === 0 || col === G.mapCols - 1)
                char = 'W';
            let tile = parseInt(char, 10);
            let biomeId = Math.floor(G.currentLevel / 20) % 5;
            if (char === 'H')
                tile = 11;
            else if (char === 'C')
                tile = 14;
            else if (char === 'A')
                tile = 15;
            else if (char === 'W')
                tile = 16;
            if (biomeId === 3 && (tile === 3 || tile === 15)) {
                if (tile === 3)
                    G.corruptedSectors.push({ x: col * TILE_SIZE, y: row * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, isActive: false, timer: 1.5, toggleInterval: 1.5, type: 'sector' });
                else
                    G.malwareNodes.push({ x: col * TILE_SIZE + 20, y: row * TILE_SIZE + 20, width: 0, height: 0, radius: 8, maxRadius: 64, state: 'IDLE', triggerDistance: 96, cooldownTimer: 0, type: 'node' });
                rowData.push(0);
            }
            else if (char === '7' || (row === 8 && col === 1 && !spawnFound)) {
                if (!G.checkpointPos) {
                    player.startX = col * TILE_SIZE + 6;
                    player.startY = (row + 1) * TILE_SIZE - player.height;
                }
                spawnFound = true;
                rowData.push(0);
            }
            else if (spawnEntityAt(char, tile, row, col, resetEntities, biomeId, currentMapData)) {
                rowData.push(0);
            }
            else {
                rowData.push(isNaN(tile) ? 0 : tile);
            }
        }
        G.map.push(rowData);
    }
    buildGlitchArena();
}
export { resetPlayerPosition, resetFullGame, setupCheatHooks } from './spawner_utils.js';
// Initialize hacks
setupCheatHooks();
