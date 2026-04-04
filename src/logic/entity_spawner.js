import { G, player, TILE_SIZE } from '../core/globals.js?v=126';

export function spawnMovingPlatform(char, row, col, currentMapData) {
    const isVert = (char === 'U');
    const pWidth = 64, pHeight = 16;
    const spd = 40 + Math.random() * 27; 
    const dir = Math.random() > 0.5 ? 1 : -1;
    const rangeTiles = (char === 'U') ? 14 : (char === 'P' ? 15 : 3);

    let plat = { 
        x: col * TILE_SIZE, 
        y: row * TILE_SIZE + 8, 
        width: pWidth, 
        height: pHeight,
        vx: isVert ? 0 : spd * dir, 
        vy: isVert ? spd * dir : 0,
        minX: col * TILE_SIZE, 
        maxX: col * TILE_SIZE,
        minY: row * TILE_SIZE + 8, 
        maxY: row * TILE_SIZE + 8,
        type: isVert ? 'v-grate' : 'h-grate'
    };

    if (isVert) {
        let scanMinR = row;
        let c2 = Math.min(G.mapCols - 1, col + 1);
        let cL = Math.max(0, col - 1);
        let cR = Math.min(G.mapCols - 1, col + 2);
        
        while(scanMinR > 0) {
            if (currentMapData[scanMinR - 1][col] === '1' || currentMapData[scanMinR - 1][c2] === '1') break;
            if (scanMinR < row && (currentMapData[scanMinR][cL] === '1' || currentMapData[scanMinR][cR] === '1')) break;
            scanMinR--;
        }
        
        let scanMaxR = row;
        while(scanMaxR < G.mapRows - 1) {
            if (currentMapData[scanMaxR + 1][col] === '1' || currentMapData[scanMaxR + 1][c2] === '1') break;
            if (scanMaxR > row && (currentMapData[scanMaxR][cL] === '1' || currentMapData[scanMaxR][cR] === '1')) break;
            scanMaxR++;
        }
        
        let targetMinY = (row - rangeTiles/2) * TILE_SIZE;
        let targetMaxY = (row + rangeTiles/2) * TILE_SIZE;
        plat.minY = Math.max(scanMinR * TILE_SIZE, targetMinY);
        plat.maxY = Math.min(scanMaxR * TILE_SIZE + TILE_SIZE - pHeight, targetMaxY);
        if (plat.maxY < plat.minY) plat.maxY = plat.minY;
        plat.y = plat.minY + Math.random() * (plat.maxY - plat.minY);
    } else {
        let scanMinC = col;
        let rL = Math.max(0, row - 4);
        let rH = Math.min(G.mapRows - 1, row + 4);

        while(scanMinC > 0) {
            let blocked = false;
            for (let r = rL; r <= rH; r++) {
                if (currentMapData[r][scanMinC - 1] === '1') { blocked = true; break; }
            }
            if (blocked) break;
            scanMinC--;
        }
        let scanMaxC = col;
        while(scanMaxC < G.mapCols - 1) {
            let blocked = false;
            for (let r = rL; r <= rH; r++) {
                if (currentMapData[r][scanMaxC + 1] === '1') { blocked = true; break; }
            }
            if (blocked) break;
            scanMaxC++;
        }
        
        let targetMinX = (col - rangeTiles/2) * TILE_SIZE;
        let targetMaxX = (col + rangeTiles/2) * TILE_SIZE;
        plat.minX = Math.max(scanMinC * TILE_SIZE, targetMinX);
        plat.maxX = Math.min((scanMaxC + 1) * TILE_SIZE - pWidth, targetMaxX);
        if (plat.maxX < plat.minX) plat.maxX = plat.minX;
        plat.x = plat.minX + Math.random() * (plat.maxX - plat.minX);
    }
    G.platforms.push(plat);
}

export function spawnBoss(col, row) {
    let biome = Math.floor(G.currentLevel / 20) % 5;
    let bType = ['masticator','septicus','warden','core','goliath'][biome];
    let sY = (bType === 'masticator') ? row * TILE_SIZE + 1 : row * TILE_SIZE - 40;
    G.boss = { 
        active:true, type:bType, startX:col*TILE_SIZE, startY:sY, 
        x:col*TILE_SIZE, y:(bType === 'masticator' ? sY : row*TILE_SIZE+200),
        width:(bType==='septicus'?128:TILE_SIZE*2), 
        height:(bType==='septicus'?128:TILE_SIZE*2),
        hp:(bType==='masticator'?4:3), 
        maxHp:(bType==='masticator'?4:3), 
        phase:0, timer:0, vx:0, vy:0, hurtTimer:0, 
        triggered:(bType!=='septicus') 
    };
}
