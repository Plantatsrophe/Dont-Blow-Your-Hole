import { G, ctx, TILE_SIZE, particlePool } from '../core/globals.js?v=127';
import { sprSepticus1, sprSepticus2, sprSepticus3, sprSepticus4, sprSepticus5, sprManhole } from '../assets/assets.js?v=127';
import { drawSprite, drawGlow } from './render_utils.js?v=127';

export function drawMasticator(boss) {
    let cx = boss.x, cy = boss.y - 15, bw = boss.width, bh = boss.height, dir = G.boss.vx < 0 ? -1 : 1; 
    let walkParam = (G.boss.vx !== 0) ? Date.now() / 100 : 0;
    let leg1 = (walkParam > 0) ? Math.sin(walkParam) * 12 : 0, leg2 = (walkParam > 0) ? Math.sin(walkParam + Math.PI) * 12 : 0;
    ctx.fillStyle = '#888'; let leg1X = cx + 10 + leg1, leg2X = cx + bw - 25 + leg2;
    ctx.fillRect(leg1X, cy + bh, 15, 15); ctx.fillRect(leg2X, cy + bh, 15, 15);
    ctx.fillStyle = '#555'; let footStartOffset = (dir === 1) ? -5 : -15;
    ctx.fillRect(leg1X + footStartOffset, cy + bh + 10, 25, 5); ctx.fillRect(leg2X + footStartOffset, cy + bh + 10, 25, 5);
    let drawSword = (innerCtx) => {
        innerCtx.save(); innerCtx.translate(0, 40); let swordAngle = (walkParam > 0) ? Math.sin(walkParam) * (Math.PI / 8) * dir : 0;
        innerCtx.rotate(swordAngle); innerCtx.fillStyle = '#EaEaEa'; innerCtx.beginPath();
        innerCtx.moveTo(-10, -10); innerCtx.lineTo(-10, -80); innerCtx.lineTo(0, -100); innerCtx.lineTo(10, -80); innerCtx.lineTo(10, -10); innerCtx.fill();
        innerCtx.fillStyle = '#111'; innerCtx.fillRect(-6, -10, 12, 24); innerCtx.restore();
    };
    ctx.fillStyle = '#888';
    ctx.save(); ctx.translate(cx - 7.5, cy + 30); ctx.rotate((walkParam > 0) ? Math.sin(walkParam) * 0.3 : 0); ctx.fillRect(-7.5, 0, 15, 30); if (dir === -1) drawSword(ctx); ctx.restore();
    ctx.save(); ctx.translate(cx + bw + 7.5, cy + 30); ctx.rotate((walkParam > 0) ? Math.sin(walkParam + Math.PI) * 0.3 : 0); ctx.fillRect(-7.5, 0, 15, 30); if (dir === 1) drawSword(ctx); ctx.restore();
    ctx.fillStyle = '#C0C0C0'; ctx.fillRect(cx, cy, bw, bh); ctx.fillStyle = '#FF0000'; ctx.fillRect(cx + 15, cy + 15, 18, 10); ctx.fillRect(cx + bw - 33, cy + 15, 18, 10);
    drawGlow(ctx, cx + 24, cy + 20, 20, 'rgba(255, 0, 0, 0.6)'); drawGlow(ctx, cx + bw - 24, cy + 20, 20, 'rgba(255, 0, 0, 0.6)');
    ctx.fillStyle = '#111'; ctx.fillRect(cx + 10, cy + 45, bw - 20, (boss.phase === 2) ? 35 : 20);
    ctx.fillStyle = '#fff'; for (let i=0; i<4; i++) {
        let tx = cx + 15 + i * (bw-30)/4, ty = cy + 45 + ((boss.phase === 2) ? 35 : 20);
        ctx.beginPath(); ctx.moveTo(tx, cy + 45); ctx.lineTo(tx + 5, cy + 45 + 10); ctx.lineTo(tx + 10, cy + 45); ctx.fill();
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 5, ty - 10); ctx.lineTo(tx + 10, ty); ctx.fill();
    }
    if (boss.hurtTimer > 0) { ctx.fillStyle = 'white'; ctx.globalAlpha = 0.5; ctx.fillRect(cx, cy, bw, bh); ctx.globalAlpha = 1; }
}

export function renderBoss() {
    const boss = G.boss; if (!boss || !boss.active) return;
    if (boss.type === 'masticator') drawMasticator(boss);
    else if (boss.type === 'septicus') {
        let dir = boss.vx < 0 ? -1 : 1, vx = boss.vibrateX || 0;
        
        let scaleOffset = Math.sin(Date.now() * 0.005) * 4;
        let waterY = 13 * TILE_SIZE + 12; // Precise pixel height where acid water visually begins
        
        ctx.save();
        // Clip rendering bounds so Septicus only draws above the water surface line
        ctx.beginPath();
        ctx.rect(boss.x - 50 + vx, boss.y - 100, boss.width + 100, (waterY) - (boss.y - 100));
        ctx.clip();
        
        let frames = [sprSepticus1, sprSepticus2, sprSepticus3, sprSepticus4, sprSepticus5];
        let frameIdx = Math.floor(G.timerAcc * 8) % frames.length;
        
        drawSprite(ctx, frames[frameIdx], boss.x - scaleOffset/2 + vx, boss.y - scaleOffset, boss.width + scaleOffset, boss.height + scaleOffset, dir < 0);
        
        ctx.restore();

        // Dynamically draw SEPT so it never inverts when he turns around
        if (boss.hp > 0 && !boss.isSinking) {
            ctx.save();
            ctx.fillStyle = '#8B4513';
            ctx.font = `bold ${Math.floor((boss.height + scaleOffset) * 0.11)}px monospace`;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 2;
            ctx.fillText("SEPT", boss.x + boss.width/2 + vx, boss.y + boss.height * 0.45 - scaleOffset);
            ctx.restore();
        }

        // Projectiles still Barrage separately
        if (boss.projs) { for (let p of boss.projs) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.timer * 12); drawSprite(ctx, sprManhole, -20, -20, 40, 40, false); ctx.restore(); } }
    } else if (boss.type === 'warden') {
        ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(boss.x + boss.width/2, boss.y + boss.height/2, boss.width/2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(boss.x + boss.width/2, boss.y + boss.height/2, 20, 0, Math.PI*2); ctx.fill();
    } else if (boss.type === 'core') {
        ctx.fillStyle = '#111'; ctx.fillRect(boss.x, boss.y, boss.width, boss.height); ctx.fillStyle = '#0ff';
        drawGlow(ctx, boss.x + boss.width/2, boss.y + boss.height/2, 100, 'rgba(0, 255, 255, 0.5)'); ctx.fillRect(boss.x + 20, boss.y + 20, boss.width - 40, boss.height - 40);
    } else if (boss.type === 'goliath') {
        ctx.fillStyle = '#550000'; ctx.fillRect(boss.x, boss.y, boss.width, boss.height); ctx.fillStyle = '#ffaa00'; ctx.fillRect(boss.x + boss.width - 40, boss.y + 40, 20, 20);
    }
}
