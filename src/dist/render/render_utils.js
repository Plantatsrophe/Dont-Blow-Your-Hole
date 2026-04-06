/**
 * CORE RENDERING UTILITIES
 * ------------------------
 * Low-level drawing functions used across the engine to handle:
 * - Pixel-art sprite rendering from numerical arrays.
 * - Radial glow/bloom effects with intensive caching.
 * - Procedural UI elements (Keyboard keycaps).
 */
/**
 * GLOBAL PALETTE DEFINITION
 * Map of numerical IDs to CSS color strings.
 */
const pal = {
    0: null, 1: '#f1c27d', 2: '#ff2222', 3: '#f1c40f', 4: '#5c4033',
    5: '#888888', 6: '#444444', 7: '#2ecc71', 8: '#ffffff', 9: '#00ffff',
    10: '#000000', 11: '#3366cc', 12: '#8b4513', 13: '#222222', 14: '#3ee855', 15: '#1e90ff', 16: '#5e4533'
};
/**
 * GLOW CACHE
 * Off-screen canvases indexed by radius and color to avoid redundant gradient creation.
 */
const GLOW_CACHE = new Map();
/**
 * Renders a sprite from a flat numerical array onto the destination context.
 * Supports horizontal flipping and custom grid dimensions.
 */
export function drawSprite(ctx, spr, x, y, w, h, flipX, gridWidth) {
    let gW = gridWidth || Math.sqrt(spr.length);
    let gH = spr.length / gW;
    let pxW = w / gW;
    let pxH = h / gH;
    for (let r = 0; r < gH; r++) {
        for (let c = 0; c < gW; c++) {
            let colIndex = flipX ? (gW - 1 - c) : c;
            let val = spr[r * gW + colIndex];
            if (val !== 0 && pal[val]) {
                ctx.fillStyle = pal[val];
                // Draw slightly oversized to prevent sub-pixel seams
                ctx.fillRect(x + c * pxW, y + r * pxH, pxW + 0.5, pxH + 0.5);
            }
        }
    }
}
/**
 * Optimized Bloom Effect.
 * Draws a radial gradient glow from the cache to improve performance during busy scenes.
 */
export function drawGlow(ctx, x, y, radius, colorStr) {
    const key = `${Math.floor(radius)}_${colorStr}`;
    let cached = GLOW_CACHE.get(key);
    if (!cached) {
        // Create new radial gradient on a temporary canvas
        cached = document.createElement('canvas');
        const size = Math.ceil(radius * 2);
        cached.width = size;
        cached.height = size;
        const cctx = cached.getContext('2d');
        let grad = cctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
        grad.addColorStop(0, colorStr);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        cctx.fillStyle = grad;
        cctx.fillRect(0, 0, size, size);
        GLOW_CACHE.set(key, cached);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; // Additive blending for "glow" look
    ctx.drawImage(cached, x - radius, y - radius);
    ctx.restore();
}
/**
 * Draws a shaded 3D keyboard keycap button.
 * Used primarily in the tutorials and instruction screens.
 */
export function drawKey(ctx, x, y, w, h, label) {
    // 3D Beveling logic
    ctx.fillStyle = '#555';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#888';
    ctx.fillRect(x, y, w, 3);
    ctx.fillRect(x, y, 3, h);
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y + h - 4, w, 4);
    ctx.fillRect(x + w - 4, y, 4, h);
    ctx.fillStyle = '#444';
    ctx.fillRect(x + 3, y + 3, w - 7, h - 7);
    ctx.fillStyle = 'white';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    // Icon Overrides
    if (label === 'UP') {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h / 2 - 4);
        ctx.lineTo(x + w / 2 - 6, y + h / 2 + 4);
        ctx.lineTo(x + w / 2 + 6, y + h / 2 + 4);
        ctx.fill();
    }
    else if (label === 'DOWN') {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h / 2 + 4);
        ctx.lineTo(x + w / 2 - 6, y + h / 2 - 4);
        ctx.lineTo(x + w / 2 + 6, y + h / 2 - 4);
        ctx.fill();
    }
    else if (label === 'LEFT') {
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 4, y + h / 2);
        ctx.lineTo(x + w / 2 + 4, y + h / 2 - 6);
        ctx.lineTo(x + w / 2 + 4, y + h / 2 + 6);
        ctx.fill();
    }
    else if (label === 'RIGHT') {
        ctx.beginPath();
        ctx.moveTo(x + w / 2 + 4, y + h / 2);
        ctx.lineTo(x + w / 2 - 4, y + h / 2 - 6);
        ctx.lineTo(x + w / 2 - 4, y + h / 2 + 6);
        ctx.fill();
    }
    else {
        ctx.fillText(label, x + w / 2, y + h / 2 + 4);
    }
}
