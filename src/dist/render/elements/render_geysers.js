import { G, ctx, TILE_SIZE } from '../../core/globals.js';
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
        // --- DRAW BASE ---
        ctx.fillStyle = '#333333';
        ctx.fillRect(geyser.x, geyser.y, TILE_SIZE, TILE_SIZE);
        // Base rim glow (H311 theme)
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.strokeRect(geyser.x + 2, geyser.y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        // --- DRAW ERUPTION ---
        if (geyser.state === 'erupting') {
            const pillarHeight = TILE_SIZE * 5;
            const flicker = Math.random() > 0.5;
            // Outer glow of the fire pillar
            ctx.fillStyle = flicker ? '#ff2200' : '#ffaa00';
            ctx.globalAlpha = 0.7;
            ctx.fillRect(geyser.x + 5, geyser.y - (pillarHeight - TILE_SIZE), TILE_SIZE - 10, pillarHeight - TILE_SIZE);
            // Inner core (brighter)
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.9;
            ctx.fillRect(geyser.x + 15, geyser.y - (pillarHeight - TILE_SIZE), TILE_SIZE - 30, pillarHeight - TILE_SIZE);
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
            // Subtle pulse in the vent during warning
            const pulse = 0.5 + Math.sin(Date.now() / 50) * 0.5;
            ctx.fillStyle = `rgba(255, 34, 0, ${pulse * 0.4})`;
            ctx.fillRect(geyser.x + 5, geyser.y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
        }
    }
}
