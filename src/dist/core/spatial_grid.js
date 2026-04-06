import { G } from './globals.js';
/**
 * The size of each grid cell in pixels.
 * A larger cell reduces the number of bucket lookups but increases entities per bucket.
 * 200px is optimized for the typical player/item density.
 */
const CELL_SIZE = 200;
/**
 * Internal hash-map representing the 2D spatial grid.
 * Key: "X_Y" coordinate string.
 * Value: Array of entities overlapping that specific cell.
 */
const grid = new Map();
/**
 * Fully reconstructs the spatial grid from the current global entity state.
 * This is called every frame to ensure collisions are processed against up-to-date positions.
 */
export function updateSpatialGrid() {
    grid.clear();
    // Insert all active combatants
    for (const e of G.enemies) {
        insertToGrid(e);
    }
    // Insert all available loot/triggers
    for (const i of G.items) {
        if (!i.collected)
            insertToGrid(i);
    }
    // Insert moving environmental hazards/platforms
    for (const p of G.platforms) {
        insertToGrid(p);
    }
}
/**
 * Determines which grid cells a specific entity overlaps and pushes the reference
 * into the corresponding buckets.
 *
 * @param entity The object to index
 */
function insertToGrid(entity) {
    const xStart = Math.floor(entity.x / CELL_SIZE);
    const xEnd = Math.floor((entity.x + entity.width) / CELL_SIZE);
    const yStart = Math.floor(entity.y / CELL_SIZE);
    const yEnd = Math.floor((entity.y + entity.height) / CELL_SIZE);
    for (let x = xStart; x <= xEnd; x++) {
        for (let y = yStart; y <= yEnd; y++) {
            const key = `${x}_${y}`;
            let cell = grid.get(key);
            if (!cell) {
                cell = [];
                grid.set(key, cell);
            }
            cell.push(entity);
        }
    }
}
// Optimization: Reusable results array to minimize memory allocation per query
const QUERY_RESULTS = [];
/**
 * Retrieves all entities within a specific rectangular screen region.
 * Uses a 'Seen' Set to ensure that entities spanning multiple cells are only
 * returned once in the final result set.
 *
 * @param x Top-left X
 * @param y Top-left Y
 * @param w Width of search area
 * @param h Height of search area
 * @returns A deduplicated array of entities in the specified volume
 */
export function queryGrid(x, y, w, h) {
    QUERY_RESULTS.length = 0;
    const xStart = Math.floor(x / CELL_SIZE);
    const xEnd = Math.floor((x + w) / CELL_SIZE);
    const yStart = Math.floor(y / CELL_SIZE);
    const yEnd = Math.floor((y + h) / CELL_SIZE);
    const seen = new Set();
    for (let gx = xStart; gx <= xEnd; gx++) {
        for (let gy = yStart; gy <= yEnd; gy++) {
            const key = `${gx}_${gy}`;
            const cell = grid.get(key);
            if (cell) {
                for (const ent of cell) {
                    if (!seen.has(ent)) {
                        seen.add(ent);
                        QUERY_RESULTS.push(ent);
                    }
                }
            }
        }
    }
    return QUERY_RESULTS;
}
