import { G, TILE_SIZE, player } from '../../core/globals.js';

/**
 * Manages the dynamic spawning of Demon Portals in the H311 biome.
 * Rifts appear and disappear randomly near the player at unreachable heights.
 */
export function updateDynamicRifts(dt: number) {
    // Only active in H311 biome (ID 4)
    if (G.biomeId !== 4) return;

    G.nextRiftTimer -= dt;

    if (G.nextRiftTimer <= 0 && G.gameState === 'PLAYING') {
        // Attempt to spawn up to 10 times to find a valid location 
        // avoiding safety zones and ceilings.
        let spawned = false;
        for (let attempt = 0; attempt < 10; attempt++) {
            if (spawnNewRift()) {
                spawned = true;
                break;
            }
        }

        // Only reset timer if we actually successfully added a portal
        if (spawned) {
            // Reset: Random interval between 3 and 8 seconds
            G.nextRiftTimer = 3.0 + Math.random() * 5.0;
        } else {
            // Failed to find spot? Check again very soon
            G.nextRiftTimer = 0.5;
        }
    }
}

function spawnNewRift(): boolean {
    if (Number.isNaN(player.x)) return false;

    // Determine target column near player (shifted forward into path)
    const playerCol = Math.floor(player.x / TILE_SIZE);
    // Random span ahead of player
    const targetCol = playerCol + Math.floor(Math.random() * 18) + 2;

    // --- SAFETY CONSTRAINTS ---
    // 1. Level Boundaries (Relaxed to 5 tiles)
    if (targetCol <= 5 || targetCol >= G.mapCols - 5) return false;

    // 2. Checkpoint Safety (H311 checkpoint approx at Col 100)
    // Avoid spawning directly on top of checkpoints.
    if (G.currentLevel < 99 && Math.abs(targetCol - 100) < 8) return false;

    // 3. Find highest point of ground at this column to ensure clearance
    // BUG FIX: Scan from the middle downwards to avoid mistaking the ceiling border for ground.
    let floorRow = G.mapRows;
    for (let r = Math.floor(G.mapRows / 2); r < G.mapRows; r++) {
        const rowData = G.map[r];
        if (rowData && rowData[targetCol] !== undefined && rowData[targetCol] !== 0) {
            floorRow = r;
            break;
        }
    }

    // 4. Vertical Positioning
    // Prefer row 1 or 2 as Row 0 is often a solid ceiling border in H311.
    const targetRow = 1 + Math.floor(Math.random() * 2); 
    
    // 5. Unreachable Check: Must be at least 4 tiles above ground
    if (floorRow - targetRow < 4) return false;

    // 6. Air Check: Ensure spawn point is currently empty
    const targetRowData = G.map[targetRow];
    if (!targetRowData || targetRowData[targetCol] === undefined || targetRowData[targetCol] !== 0) return false;

    // --- INITIALIZE PORTAL ---
    console.log(`[H311] Spawning Demon Portal at Col:${targetCol} Row:${targetRow}`);
    G.demonPortals.push({
        x: targetCol * TILE_SIZE,
        y: targetRow * TILE_SIZE,
        width: 32,
        height: 32,
        active: true,
        timer: 1.0 + Math.random(), // Random startup for imp spawning
        activeImp: null,
        spawnLimit: 3 + Math.floor(Math.random() * 3), 
        spawnsSoFar: 0,
        type: 'demonPortal'
    });

    return true;
}
