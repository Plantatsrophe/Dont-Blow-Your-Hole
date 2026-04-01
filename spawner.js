function parseMap(resetEntities = true) {
    let currentMapData = staticLevels[currentLevel].map;
    mapRows = currentMapData.length;
    mapCols = currentMapData[0].length;

    map = [];
    if (resetEntities) {
        items = [];
        enemies = [];
        lasers = [];
        platforms = [];
        bombs = [];
        boss = { active: false };
    }
    particles = [];
    isMapCached = false;
    offscreenMapCanvas.width = mapCols * TILE_SIZE;
    offscreenMapCanvas.height = mapRows * TILE_SIZE;

    let spawnFound = false;
    for (let row = 0; row < mapRows; row++) {
        let rowData = [];
        for (let col = 0; col < mapCols; col++) {
            let char = currentMapData[row][col];
            let tile = parseInt(char, 10);
            if (char === 'H') tile = 11;
            else if (char === 'C') tile = 14;
            else if (char === 'A') tile = 15;

            if (tile === 4) {
                if (resetEntities) {
                    items.push({ x: col * TILE_SIZE + 8, y: row * TILE_SIZE + 8, width: 24, height: 24, collected: false, type: 'cash' });
                }
                rowData.push(0);
            } else if (tile === 11) {
                if (resetEntities) {
                    items.push({ x: col * TILE_SIZE + 8, y: row * TILE_SIZE + 8, width: 24, height: 24, collected: false, type: 'hotdog' });
                }
                rowData.push(0);
            } else if (tile === 14) {
                if (resetEntities) {
                    items.push({ x: col * TILE_SIZE, y: row * TILE_SIZE, width: 32, height: 32, collected: false, type: 'checkpoint' });
                }
                rowData.push(0);
            } else if (char === 'P') {
                if (resetEntities) {
                    platforms.push({
                        x: col * TILE_SIZE,
                        y: row * TILE_SIZE + 8,
                        width: TILE_SIZE * 1.5,
                        height: 16,
                        vx: 60,
                        minX: (col - 3) * TILE_SIZE,
                        maxX: (col + 3) * TILE_SIZE
                    });
                }
                rowData.push(0);
                // Spawn logically defaults locally in strings!
            } else if (char === '7' || (row === 12 && col === 1 && !spawnFound)) {
                if (resetEntities) {
                    player.startX = col * TILE_SIZE + 6;
                    player.startY = (row + 1) * TILE_SIZE - player.height;
                    spawnFound = true;
                }
                rowData.push(0);
            } else if (tile === 8) {
                if (resetEntities) {
                    enemies.push({
                        type: 'bot',
                        x: col * TILE_SIZE + 8,
                        y: (row + 1) * TILE_SIZE - 24,
                        width: 24, height: 24,
                        vx: 50, dir: 1, color: '#ff2222'
                    });
                }
                rowData.push(0);
            } else if (char === 'L') {
                if (resetEntities) {
                    enemies.push({
                        type: 'laserBot',
                        x: col * TILE_SIZE + 8,
                        y: (row + 1) * TILE_SIZE - 24,
                        width: 24, height: 24,
                        vx: 0, dir: -1, cooldown: 1.0
                    });
                }
                rowData.push(0);
            } else if (char === 'B') {
                if (resetEntities) {
                    let biome = Math.floor(currentLevel / 20) % 5;
                    let bType = ['masticator', 'sludge', 'warden', 'core', 'goliath'][biome];
                    boss = {
                        active: true, type: bType,
                        startX: col * TILE_SIZE, startY: row * TILE_SIZE,
                        x: col * TILE_SIZE, y: row * TILE_SIZE,
                        width: TILE_SIZE * 2, height: TILE_SIZE * 2,
                        hp: (bType === 'masticator' ? 4 : 3), maxHp: (bType === 'masticator' ? 4 : 3), 
                        phase: 0, timer: 0,
                        vx: 0, vy: 0, hurtTimer: 0
                    };
                }
                rowData.push(0);
            } else if (char === 'V') {
                if (resetEntities) {
                    items.push({ x: col * TILE_SIZE, y: row * TILE_SIZE, width: 32, height: 32, collected: false, type: 'valve' });
                }
                rowData.push(0);
            } else if (char === 'D') {
                if (resetEntities) {
                    items.push({ x: col * TILE_SIZE, y: row * TILE_SIZE, width: 32, height: 32, collected: false, type: 'detonator' });
                }
                rowData.push(0);
            } else if (char === 'M') {
                if (resetEntities) {
                    bombs.push({
                        active: false,
                        x: col * TILE_SIZE + 4,
                        y: row * TILE_SIZE,
                        width: 32, height: 32,
                        vx: 0, vy: 0,
                        col: col, row: row // Track native grid coordinates explicitly natively!
                    });
                }
                rowData.push(0);
            } else {
                rowData.push(tile);
            }
        }
        map.push(rowData);
    }
}

function resetPlayerPosition() {
    player.x = player.startX;
    player.y = player.startY;
    player.vx = 0;
    player.vy = 0;
    player.droppingThrough = false;
    player.isOnGround = false;
    player.isClimbing = false;
}

function resetFullGame() {
    player.lives = 3;
    player.score = 0;
    timer = 60;
    parseMap();
    resetPlayerPosition();
    gameStartTime = new Date().getTime(); // Anchor runtime securely
}

