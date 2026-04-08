import { G, ctx } from '../../core/globals.js';
/**
 * Renders Demon Portals with a pulsing void effect.
 */
export function renderPortals() {
    if (!G.demonPortals)
        return;
    for (const portal of G.demonPortals) {
        if (!portal.active)
            continue;
        // Pulse effect
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
        const centerX = portal.x + portal.width / 2;
        const centerY = portal.y + portal.height / 2;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(pulse, pulse);
        // Corona
        ctx.fillStyle = '#aa00ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        // Inner Void
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.shadowBlur = 0;
    }
}
/**
 * Renders dive-bombing Blood Imps.
 */
export function renderImps() {
    for (const imp of G.enemies) {
        if (imp.type !== 'bloodImp' || !imp.active)
            continue;
        const centerX = imp.x + imp.width / 2;
        const centerY = imp.y + imp.height / 2;
        ctx.save();
        ctx.translate(centerX, centerY);
        // Body
        ctx.fillStyle = '#cc0000';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        // Wings (flickering triangles)
        const wingSize = 10 + Math.sin(Date.now() / 50) * 4;
        ctx.fillStyle = '#440000';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-10 - wingSize, -10);
        ctx.lineTo(-10 - wingSize, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(10 + wingSize, -10);
        ctx.lineTo(10 + wingSize, 10);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-5, -4, 3, 3);
        ctx.fillRect(2, -4, 3, 3);
        ctx.restore();
    }
}
