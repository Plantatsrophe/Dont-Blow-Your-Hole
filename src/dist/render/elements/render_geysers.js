import { G, ctx, TILE_SIZE } from '../../core/globals.js';
import { drawGlow } from '../utils/render_utils.js';
/**
 * Renders all active Brimstone Geysers.
 *
 * Draws:
 * 1. A static glowing vent base.
 * 2. A flickering pillar of fire if in the 'erupting' state.
 */
export function renderGeysers() {
    if (!G.geysers)
        return;
    for (const geyser of G.geysers) {
        // --- DRAW MOLTEN LAVA BASE ---
        // Matches the Tile 15 aesthetic in H311
        ctx.fillStyle = '#441100'; // Deep magma base
        ctx.fillRect(geyser.x, geyser.y + 10, TILE_SIZE, TILE_SIZE - 10);
        ctx.fillStyle = '#ff4400'; // Hot molten surface
        ctx.fillRect(geyser.x, geyser.y + 10, TILE_SIZE, 4);
        // Dynamic molten glow sync
        drawGlow(ctx, geyser.x + TILE_SIZE / 2, geyser.y + 12, 30, 'rgba(255, 68, 0, 0.4)');
        // --- DRAW ERUPTION ---
        if (geyser.state === 'erupting') {
            // Base rim glow (only during eruption)
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 1;
            ctx.strokeRect(geyser.x, geyser.y + 10, TILE_SIZE, 4);
            const pillarHeight = TILE_SIZE * 5;
            const flicker = Math.random() > 0.5;
            // Outer glow of the fire pillar
            ctx.fillStyle = flicker ? '#ff2200' : '#ffaa00';
            ctx.globalAlpha = 0.7;
            ctx.fillRect(geyser.x + 5, (geyser.y + 10) - (pillarHeight - TILE_SIZE), TILE_SIZE - 10, pillarHeight - TILE_SIZE);
            // Inner core (brighter)
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.9;
            ctx.fillRect(geyser.x + 15, (geyser.y + 10) - (pillarHeight - TILE_SIZE), TILE_SIZE - 30, pillarHeight - TILE_SIZE);
            ctx.globalAlpha = 1.0;
            // Random sparks at top of pillar
            if (Math.random() > 0.3) {
                ctx.fillStyle = '#ffff00';
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(geyser.x + Math.random() * TILE_SIZE, geyser.y - (pillarHeight - TILE_SIZE) - Math.random() * 20, 4, 4);
                }
            }
        }
        else if (geyser.state === 'warning') {
            // Roiling Bubbles: Replace the red square pulse with tiny magma bubbles
            const time = Date.now() / 150;
            ctx.fillStyle = '#ffaa00';
            for (let i = 0; i < 3; i++) {
                // Procedural jittered bubble positions
                const bx = geyser.x + 8 + ((i * 13) % (TILE_SIZE - 16));
                const by = geyser.y + 10 - Math.abs(Math.sin(time + i) * 6);
                const size = 2 + (Math.sin(time * 2 + i) + 1);
                ctx.fillRect(bx, by, size, size);
            }
        }
    }
}
