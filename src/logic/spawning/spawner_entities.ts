import { G, player, TILE_SIZE } from '../../core/globals.js';
import { spawnMovingPlatform, spawnBoss } from './entity_spawner.js';

/**
 * Handles the spawning of entities (Items, Enemies, Bosses) for a specific tile.
 * Returns true if an entity was spawned and the tile should be empty in the physics grid.
 */
export function spawnEntityAt(char: string, tile: number, row: number, col: number, resetEntities: boolean, biomeId: number, map: string[]): boolean {
    if (tile === 4) { // Gear
        if (resetEntities) G.items.push({ x: col*TILE_SIZE+8, y: row*TILE_SIZE+8, width: 24, height: 24, collected: false, type: 'gear' });
        return true;
    } else if (tile === 11) { // Hotdog
        if (resetEntities) G.items.push({ x: col*TILE_SIZE+8, y: row*TILE_SIZE+8, width: 24, height: 24, collected: false, type: 'hotdog' });
        return true;
    } else if (tile === 14) { // Checkpoint
        let targetCol = col;
        let targetRow = row;

        // --- H311 BIOME OVERRIDE ---
        // Relocate checkpoints to map center (Col 100) to ensure balanced progression pacing
        if (biomeId === 4) {
            targetCol = Math.floor(map[0].length / 2);
            // Height Correction Tool: Search for the nearest solid ground at the midpoint
            // to ensure the checkpoint isn't floating above magma.
            for (let r = 0; r < map.length; r++) {
                if (map[r][targetCol] === '1') {
                    targetRow = r - 1; 
                    break;
                }
            }
        }

        if (resetEntities) G.items.push({ x: targetCol*TILE_SIZE, y: targetRow*TILE_SIZE, width: 32, height: 32, collected: false, type: 'checkpoint' });
        return true;
    } else if (char === 'U' || char === 'P' || tile === 6) { // Moving Platforms
        if (resetEntities) spawnMovingPlatform(char, row, col, map);
        return true;
    } else if (tile === 8) { // Bot
        if (resetEntities) G.enemies.push({ type:'bot', x:col*TILE_SIZE+8, y:(row+1)*TILE_SIZE-24, width:24, height:24, vx:50, vy:0, dir:1, cooldown:0 });
        return true;
    } else if (char === 'L') { // Laser Bot
        if (resetEntities) G.enemies.push({ type:'laserBot', x:col*TILE_SIZE+8, y:(row+1)*TILE_SIZE-24, width:24, height:24, vx:0, vy:0, dir:-1, cooldown:1.0 });
        return true;
    } else if (char === 'B') { // Boss
        if (resetEntities) spawnBoss(col, row);
        return true;
    } else if (char === 'V') { // Valve
        if (resetEntities && biomeId === 1) G.items.push({ x:col*TILE_SIZE, y:row*TILE_SIZE, width:32, height:32, collected:false, type:'valve' });
        return true;
    } else if (char === 'D') { // Detonator
        if (resetEntities && biomeId === 4) G.items.push({ x:col*TILE_SIZE, y:row*TILE_SIZE, width:32, height:32, collected:false, type:'detonator' });
        return true;
    } else if (char === 'M') { // Bomb
        if (resetEntities) G.bombs.push({ active:false, x:col*TILE_SIZE+4, y:row*TILE_SIZE, width:32, height:32, vx:0, vy:0, col, row, type:'bomb' });
        return true;
    } else if (char === 'Y') { // Geyser
        if (resetEntities) G.geysers.push({ x: col * TILE_SIZE, y: row * TILE_SIZE, state: 'dormant', timer: 2.0 });
        return true;
    } else if (char === 'O') { // Demon Portal
        if (resetEntities) G.demonPortals.push({ x: col * TILE_SIZE, y: row * TILE_SIZE, width: 32, height: 32, timer: 3.0, activeImp: null, type: 'portal', active: true });
        return true;
    }
    return false;
}
