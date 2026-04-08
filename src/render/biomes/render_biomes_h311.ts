import { canvas, ctx } from '../../core/globals.js';

/**
 * H311 Core: Hellish red glow and shifting heavy metal plates.
 * @param px Camera parallax offset
 */
export function drawH311Parallax(px: number) {
    // Random screen flicker for tension
    if (Math.random() > 0.95) { ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    
    // The "Sun" / Heat Core
    let mX = (canvas.width * 0.75 - px) % (canvas.width + 400);
    if (mX < -250) mX += canvas.width + 600;
    ctx.fillStyle = '#db2323'; ctx.beginPath(); ctx.arc(mX, 180, 120, 0, Math.PI * 2); ctx.fill();
    
    // Shifting structural shadows
    ctx.fillStyle = 'rgba(43, 2, 2, 0.85)';
    for (let i = 0; i < 7; i++) {
        let cX = ((i * 180) - px * 8 - (Date.now()/12 % canvas.width)) % (canvas.width + 300);
        if (cX < -200) cX += canvas.width + 500;
        ctx.fillRect(cX, 70 + i * 60, 160 + (i%4)*60, 25);
    }
}
