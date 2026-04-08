import { G, TILE_SIZE } from '../../core/globals.js';
import type { IPlatform, IBoss } from '../../types.js';

/**
 * Procedurally configures a moving platform based on map character triggers.
 * Implements scanning logic to automatically find movement boundaries (minX/maxX or minY/maxY)
 * by looking for wall tiles in the map data.
 * 
 * @param char 'U' for Vertical, 'P' for Horizontal, '6' for Small Vertical
 * @param row The spawn grid row
 * @param col The spawn grid column
 * @param currentMapData The raw string map for boundary scanning
 */
export function spawnMovingPlatform(char: string, row: number, col: number, currentMapData: string[]) {
    const isVert = (char === 'U');
    const pWidth = 64, pHeight = 16;
    // High-precision speed variance to prevent perfectly synced platforms
    const spd = 40 + Math.random() * 27; 
    const dir = Math.random() > 0.5 ? 1 : -1;
    const rangeTiles = (char === 'U') ? 5 : (char === 'P' ? 7 : 3);

    let plat: IPlatform = { 
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
    
    // --- BOUNDARY SCANNING LOGIC ---
    // Platforms automatically detect 'Wall' tiles in their path to set turn-around points.
    
    if (isVert) {
        let scanMinR = row;
        let c2 = Math.min(G.mapCols - 1, col + 1);
        
        // Scan Up
        while(scanMinR > 0) {
            if (currentMapData[scanMinR - 1][col] === '1' || currentMapData[scanMinR - 1][c2] === '1') break;
            scanMinR--;
        }
        
        // Scan Down
        let scanMaxR = row;
        while(scanMaxR < G.mapRows - 1) {
            if (currentMapData[scanMaxR + 1][col] === '1' || currentMapData[scanMaxR + 1][c2] === '1') break;
            scanMaxR++;
        }
        
        // Clamp to restricted rangeTiles to maintain level difficulty
        let targetMinY = (row - rangeTiles/2) * TILE_SIZE;
        let targetMaxY = (row + rangeTiles/2) * TILE_SIZE;
        plat.minY = Math.max(scanMinR * TILE_SIZE, targetMinY);
        plat.maxY = Math.min(scanMaxR * TILE_SIZE + TILE_SIZE - pHeight, targetMaxY);
        if (plat.maxY < plat.minY) plat.maxY = plat.minY;
        
        // Randomize initial position to break synchronization
        plat.y = plat.minY + Math.random() * (plat.maxY - plat.minY);
    } else {
        let scanMinC = col;
        let rL = row, rH = row;

        // Scan Left
        while(scanMinC > 0) {
            let blocked = false;
            for (let r = rL; r <= rH; r++) {
                if (currentMapData[r][scanMinC - 1] === '1') { blocked = true; break; }
            }
            if (blocked) break;
            scanMinC--;
        }
        // Scan Right
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

/**
 * Initializes a boss encounter based on the current level biome.
 * Biomes: 0=Slums, 1=Sewer, 2=Mine, 3=Virtual, 4=H311
 * 
 * @param col Spawn column (X)
 * @param row Spawn row (Y)
 */
export function spawnBoss(col: number, row: number) {
    let biome = Math.floor(G.currentLevel / 20) % 5;
    let bType = ['masticator','septicus','auh-gr','glitch','baphometron'][biome] as any;
    
    // Masticator spawns exactly on the tile; others spawn dropped slightly
    let sY = (bType === 'masticator') ? row * TILE_SIZE + 1 : row * TILE_SIZE - 40;
    
    G.boss = { 
        // Auh-Gr is a unique chase boss that starts inactive until a trigger depth is met
        active: (bType !== 'auh-gr'), 
        type: bType, 
        startX: (bType === 'auh-gr' ? 16 : col * TILE_SIZE), 
        startY: sY, 
        x: (bType === 'auh-gr' ? 16 : col * TILE_SIZE), 
        y: (bType === 'masticator' ? sY : row * TILE_SIZE + 200),
        
        // Large-scale bosses require expanded collision bounds
        width: (bType === 'septicus' ? 128 : bType === 'auh-gr' ? 768 : TILE_SIZE * 2), 
        height: (bType === 'septicus' ? 128 : bType === 'auh-gr' ? 256 : TILE_SIZE * 2),
        
        hp: (bType === 'masticator' ? 4 : 3), 
        maxHp: (bType === 'masticator' ? 4 : 3), 
        phase: 0, 
        timer: 0, 
        vx: 0, 
        vy: 0, 
        hurtTimer: 0, 
        
        // Specific trigger logic: Septicus and Auh-Gr require proximity to activate
        triggered: (bType !== 'septicus' && bType !== 'auh-gr'),
        vibrateX: 0,
        hasSeenPlayer: false,
        squash: 1.0,
        squashTimer: 0,
        hairTrail1: [],
        hairTrail2: [],
        maneTrail: [],
        tailTrail: []
    };
}

