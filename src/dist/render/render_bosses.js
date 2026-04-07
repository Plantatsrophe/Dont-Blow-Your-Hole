/**
 * BOSS RENDERING MODULE
 * ---------------------
 * Specialized drawing routines for the game's major encounters.
 * Handles procedural limb animations, clipping effects, and dynamic scaling.
 */
import { G, ctx, TILE_SIZE } from '../core/globals.js';
import { sprSepticus1, sprSepticus2, sprSepticus3, sprSepticus4, sprSepticus5, sprManhole, sprAuhGr1, sprAuhGr2, sprAuhGr3, sprGlitch1, sprGlitch2, sprGlitch3, sprGlitch4 } from '../assets/assets.js';
import { drawSprite, drawGlow } from './render_utils.js';
/**
 * Masticator: A massive robot with dynamic swinging swords and walking legs.
 * @param boss The mechanical boss entity
 */
export function drawMasticator(boss) {
    let cx = boss.x, cy = boss.y - 15, bw = boss.width, bh = boss.height, dir = G.boss.vx < 0 ? -1 : 1;
    let walkParam = (G.boss.vx !== 0) ? Date.now() / 100 : 0;
    // Procedural leg segments
    let leg1 = (walkParam > 0) ? Math.sin(walkParam) * 12 : 0, leg2 = (walkParam > 0) ? Math.sin(walkParam + Math.PI) * 12 : 0;
    ctx.fillStyle = '#888';
    let leg1X = cx + 10 + leg1, leg2X = cx + bw - 25 + leg2;
    ctx.fillRect(leg1X, cy + bh, 15, 15);
    ctx.fillRect(leg2X, cy + bh, 15, 15);
    ctx.fillStyle = '#555';
    let footStartOffset = (dir === 1) ? -5 : -15;
    ctx.fillRect(leg1X + footStartOffset, cy + bh + 10, 25, 5);
    ctx.fillRect(leg2X + footStartOffset, cy + bh + 10, 25, 5);
    // Sword rendering with swing physics
    let drawSword = (innerCtx) => {
        innerCtx.save();
        innerCtx.translate(0, 40);
        let swordAngle = (walkParam > 0) ? Math.sin(walkParam) * (Math.PI / 8) * dir : 0;
        innerCtx.rotate(swordAngle);
        innerCtx.fillStyle = '#EaEaEa';
        innerCtx.beginPath();
        innerCtx.moveTo(-10, -10);
        innerCtx.lineTo(-10, -80);
        innerCtx.lineTo(0, -100);
        innerCtx.lineTo(10, -80);
        innerCtx.lineTo(10, -10);
        innerCtx.fill();
        innerCtx.fillStyle = '#111';
        innerCtx.fillRect(-6, -10, 12, 24);
        innerCtx.restore();
    };
    ctx.fillStyle = '#888';
    // Arm 1 (Swinging)
    ctx.save();
    ctx.translate(cx - 7.5, cy + 30);
    ctx.rotate((walkParam > 0) ? Math.sin(walkParam) * 0.3 : 0);
    ctx.fillRect(-7.5, 0, 15, 30);
    if (dir === -1)
        drawSword(ctx);
    ctx.restore();
    // Arm 2 (Swinging)
    ctx.save();
    ctx.translate(cx + bw + 7.5, cy + 30);
    ctx.rotate((walkParam > 0) ? Math.sin(walkParam + Math.PI) * 0.3 : 0);
    ctx.fillRect(-7.5, 0, 15, 30);
    if (dir === 1)
        drawSword(ctx);
    ctx.restore();
    // Main Body Chassis
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(cx, cy, bw, bh);
    // Eyes & Glowing core
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(cx + 15, cy + 15, 18, 10);
    ctx.fillRect(cx + bw - 33, cy + 15, 18, 10);
    drawGlow(ctx, cx + 24, cy + 20, 20, 'rgba(255, 0, 0, 0.6)');
    drawGlow(ctx, cx + bw - 24, cy + 20, 20, 'rgba(255, 0, 0, 0.6)');
    // Mouth/Teeth area
    ctx.fillStyle = '#111';
    ctx.fillRect(cx + 10, cy + 45, bw - 20, (boss.phase === 2) ? 35 : 20);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) {
        let tx = cx + 15 + i * (bw - 30) / 4, ty = cy + 45 + ((boss.phase === 2) ? 35 : 20);
        ctx.beginPath();
        ctx.moveTo(tx, cy + 45);
        ctx.lineTo(tx + 5, cy + 45 + 10);
        ctx.lineTo(tx + 10, cy + 45);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + 5, ty - 10);
        ctx.lineTo(tx + 10, ty);
        ctx.fill();
    }
    // Damage feedback overlay
    if (boss.hurtTimer > 0) {
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(cx, cy, bw, bh);
        ctx.globalAlpha = 1;
    }
}
/**
 * Orchestrates the rendering logic for the current level's active boss.
 * Determines the specific drawing style based on the boss type (Septicus, Auh-Gr, etc.).
 */
export function renderBoss() {
    const boss = G.boss;
    if (!boss || !boss.active)
        return;
    if (boss.type === 'masticator') {
        drawMasticator(boss);
    }
    else if (boss.type === 'septicus') {
        let dir = boss.vx < 0 ? -1 : 1, vx = boss.vibrateX || 0;
        let scaleOffset = Math.sin(Date.now() * 0.005) * 4;
        let waterY = 13 * TILE_SIZE + 12; // Visual water surface boundary
        ctx.save();
        // Underwater Clipping: Septicus only draws the portion of his sprite ABOVE the acid level.
        ctx.beginPath();
        ctx.rect(boss.x - 50 + vx, boss.y - 100, boss.width + 100, (waterY) - (boss.y - 100));
        ctx.clip();
        const frames = [sprSepticus1, sprSepticus2, sprSepticus3, sprSepticus4, sprSepticus5];
        const frameIdx = Math.floor(G.timerAcc * 8) % frames.length;
        drawSprite(ctx, frames[frameIdx], boss.x - scaleOffset / 2 + vx, boss.y - scaleOffset, boss.width + scaleOffset, boss.height + scaleOffset, dir < 0);
        ctx.restore();
        // Labeling: The "SEPT" nameplate (Always oriented correctly)
        if (boss.hp > 0 && !boss.isSinking) {
            ctx.save();
            ctx.fillStyle = '#8B4513';
            ctx.font = `bold ${Math.floor((boss.height + scaleOffset) * 0.11)}px monospace`;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 2;
            ctx.fillText("SEPT", boss.x + boss.width / 2 + vx, boss.y + boss.height * 0.45 - scaleOffset);
            ctx.restore();
        }
        // Secondary Hazards: Falling Manhole Lids
        if (boss.projs) {
            for (let p of boss.projs) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.timer * 12);
                drawSprite(ctx, sprManhole, -20, -20, 40, 40, false);
                ctx.restore();
            }
        }
    }
    else if (boss.type === 'auh-gr') {
        // Auh-Gr: The giant chase machine (High-frequency animation)
        let frames = [sprAuhGr1, sprAuhGr2, sprAuhGr3];
        let frameIdx = Math.floor(G.timerAcc * 24) % frames.length;
        ctx.save();
        drawSprite(ctx, frames[frameIdx], boss.x, boss.y, boss.width, boss.height, false, 48); // Scaled from its 48-pixel source
        ctx.restore();
    }
    else if (boss.type === 'glitch') {
        // Glitch: Rider on Virtual Steed (64x64)
        const frames = [sprGlitch1, sprGlitch2, sprGlitch3, sprGlitch4];
        const frameIdx = Math.floor(G.timerAcc * 10) % frames.length; // 10 FPS gallop
        const dir = boss.vx < 0 ? -1 : 1;
        ctx.save();
        // Shift sprite slightly based on direction for lean
        const lean = dir === 1 ? 0 : 0;
        drawSprite(ctx, frames[frameIdx], boss.x + lean, boss.y, boss.width, boss.height, dir < 0, 64);
        // Atmospheric Cyan Glow around the core muzzle area (approx right side if facing right)
        const glowX = dir === 1 ? boss.x + boss.width - 8 : boss.x + 8;
        drawGlow(ctx, glowX, boss.y + boss.height * 0.6, 40, 'rgba(0, 255, 255, 0.4)');
        ctx.restore();
    }
    else if (boss.type === 'goliath') {
        // Goliath: Final fire/lava boss (Deep red)
        ctx.fillStyle = '#550000';
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(boss.x + boss.width - 40, boss.y + 40, 20, 20);
    }
}
