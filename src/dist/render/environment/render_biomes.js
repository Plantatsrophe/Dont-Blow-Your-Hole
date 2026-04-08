/**
 * BIOME RENDERING ENGINE (Barrel)
 * ------------------------------
 * This file acts as a central hub for individual biome rendering modules.
 * Individual biome logic is split into dedicated files to ensure
 * maintainability and keep file sizes small.
 */
export { drawSlumsParallax, drawSlumsLayer2 } from '../biomes/render_biomes_slums.js';
export { drawSewerParallax } from '../biomes/render_biomes_sewer.js';
export { drawMineParallax } from '../biomes/render_biomes_mine.js';
export { renderVirtualBackground } from '../biomes/render_biomes_virtual.js';
export { drawH311Parallax } from '../biomes/render_biomes_h311.js';
