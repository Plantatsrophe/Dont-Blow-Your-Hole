import { G, player, keys, TILE_SIZE, offscreenMapCanvas } from '../core/globals.js?v=127';
import { staticLevels } from '../data/levels.js?v=127';
import { spawnMovingPlatform, spawnBoss } from './entity_spawner.js?v=127';

let lastLevel = -1;
export function parseMap(resetEntities = true) {
    if (G.currentLevel !== lastLevel) { G.cleanedPipes = []; lastLevel = G.currentLevel; }
    let currentMapData = staticLevels[G.currentLevel].map;
    G.mapRows = currentMapData.length; G.mapCols = currentMapData[0].length;
    G.map = [];
    if (resetEntities) {
        G.items = []; G.enemies = []; G.lasers = []; G.platforms = []; G.bombs = [];
        G.boss = { active: false }; G.purifiedValves = [];
    }
    G.particles = []; G.isMapCached = false; G.acidPurified = false;
    offscreenMapCanvas.width = G.mapCols * TILE_SIZE; offscreenMapCanvas.height = G.mapRows * TILE_SIZE;

    let spawnFound = false;
    for (let row = 0; row < G.mapRows; row++) {
        let rowData = [];
        for (let col = 0; col < G.mapCols; col++) {
            let char = currentMapData[row][col], tile = parseInt(char, 10);
            if (char === 'H') tile = 11; else if (char === 'C') tile = 14; else if (char === 'A') tile = 15;

            if (tile === 4) {
                if (resetEntities) G.items.push({ x: col*TILE_SIZE+8, y: row*TILE_SIZE+8, width: 24, height: 24, collected: false, type: 'gears' });
                rowData.push(0);
            } else if (tile === 11) {
                if (resetEntities) G.items.push({ x: col*TILE_SIZE+8, y: row*TILE_SIZE+8, width: 24, height: 24, collected: false, type: 'hotdog' });
                rowData.push(0);
            } else if (tile === 14) {
                if (resetEntities) G.items.push({ x: col*TILE_SIZE, y: row*TILE_SIZE, width: 32, height: 32, collected: false, type: 'checkpoint' });
                rowData.push(0);
            } else if (char === 'U' || char === 'P' || tile === 6) {
                if (resetEntities) spawnMovingPlatform(char, row, col, currentMapData);
                rowData.push(0);
            } else if (char === '7' || (row === 8 && col === 1 && !spawnFound)) {
                player.startX = col*TILE_SIZE+6; player.startY = (row+1)*TILE_SIZE - player.height; spawnFound = true;
                rowData.push(0);
            } else if (tile === 8) {
                if (resetEntities) G.enemies.push({ type:'bot', x:col*TILE_SIZE+8, y:(row+1)*TILE_SIZE-24, width:24, height:24, vx:50, dir:1, color:'#ff2222' });
                rowData.push(0);
            } else if (char === 'L') {
                if (resetEntities) G.enemies.push({ type:'laserBot', x:col*TILE_SIZE+8, y:(row+1)*TILE_SIZE-24, width:24, height:24, vx:0, dir:-1, cooldown:1.0 });
                rowData.push(0);
            } else if (char === 'B') {
                if (resetEntities) spawnBoss(col, row);
                rowData.push(0);
            } else if (char === 'V') {
                if (resetEntities) G.items.push({ x:col*TILE_SIZE, y:row*TILE_SIZE, width:32, height:32, collected:false, type:'valve' });
                rowData.push(0);
            } else if (char === 'D') {
                if (resetEntities) G.items.push({ x:col*TILE_SIZE, y:row*TILE_SIZE, width:32, height:32, collected:false, type:'detonator' });
                rowData.push(0);
            } else if (char === 'M') {
                if (resetEntities) G.bombs.push({ active:false, x:col*TILE_SIZE+4, y:row*TILE_SIZE, width:32, height:32, vx:0, vy:0, col, row });
                rowData.push(0);
            } else {
                rowData.push(isNaN(tile) ? 0 : tile);
            }
        }
        G.map.push(rowData);
    }
}

export function resetPlayerPosition() {
    player.x = player.startX; player.y = player.startY;
    player.vx = 0; player.vy = 0;
    player.droppingThrough = false; player.isOnGround = false; player.isClimbing = false;
}

export function resetFullGame() {
    player.lives = 3; player.score = 0; G.timer = 60;
    parseMap(); resetPlayerPosition();
    keys.ArrowLeft = false; keys.ArrowRight = false; keys.ArrowUp = false; keys.ArrowDown = false; keys.Space = false;
    G.gameStartTime = new Date().getTime();
}

// Expose to window for console access (Cheats/Debugging)
window.parseMap = parseMap;
window.resetPlayerPosition = resetPlayerPosition;
window.skipLevel = function(lvl) {
    if (lvl !== undefined) G.currentLevel = lvl;
    parseMap();
    resetPlayerPosition();
    return `Skipped to Level ${G.currentLevel}`;
};
window.goToLevel = window.skipLevel;
window.nextLevel = function() {
    return window.skipLevel(G.currentLevel + 1);
};
Object.defineProperty(window, 'currentLevel', {
    get: function() { return G.currentLevel; },
    set: function(val) { window.skipLevel(val); },
    configurable: true
});
