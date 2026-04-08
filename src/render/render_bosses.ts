/**
 * BOSS RENDERING MODULE
 * ---------------------
 * Specialized drawing routines for the game's major encounters.
 * Handles procedural limb animations, clipping effects, and dynamic scaling.
 */

import { G, ctx, TILE_SIZE, particlePool, player } from '../core/globals.js';
import { sprSepticus1, sprSepticus2, sprSepticus3, sprSepticus4, sprSepticus5, sprManhole, sprAuhGr1, sprAuhGr2, sprAuhGr3, sprGlitch1, sprGlitch2, sprGlitch3, sprGlitch4, sprGlitch5 } from '../assets/assets.js';
import { drawSprite, drawGlow } from './render_utils.js';
import type { IBoss } from '../types.js';

/**
 * Masticator: A massive robot with dynamic swinging swords and walking legs.
 * @param boss The mechanical boss entity
 */
export function drawMasticator(boss: IBoss) {
    let cx = boss.x, cy = boss.y - 15, bw = boss.width, bh = boss.height, dir = G.boss.vx < 0 ? -1 : 1; 
    let walkParam = (G.boss.vx !== 0) ? Date.now() / 100 : 0;
    
    // Procedural leg segments
    let leg1 = (walkParam > 0) ? Math.sin(walkParam) * 12 : 0, leg2 = (walkParam > 0) ? Math.sin(walkParam + Math.PI) * 12 : 0;
    ctx.fillStyle = '#888'; let leg1X = cx + 10 + leg1, leg2X = cx + bw - 25 + leg2;
    ctx.fillRect(leg1X, cy + bh, 15, 15); ctx.fillRect(leg2X, cy + bh, 15, 15);
    ctx.fillStyle = '#555'; let footStartOffset = (dir === 1) ? -5 : -15;
    ctx.fillRect(leg1X + footStartOffset, cy + bh + 10, 25, 5); ctx.fillRect(leg2X + footStartOffset, cy + bh + 10, 25, 5);
    
    // Sword rendering with swing physics
    let drawSword = (innerCtx: CanvasRenderingContext2D) => {
        innerCtx.save(); innerCtx.translate(0, 40); let swordAngle = (walkParam > 0) ? Math.sin(walkParam) * (Math.PI / 8) * dir : 0;
        innerCtx.rotate(swordAngle); innerCtx.fillStyle = '#EaEaEa'; innerCtx.beginPath();
        innerCtx.moveTo(-10, -10); innerCtx.lineTo(-10, -80); innerCtx.lineTo(0, -100); innerCtx.lineTo(10, -80); innerCtx.lineTo(10, -10); innerCtx.fill();
        innerCtx.fillStyle = '#111'; innerCtx.fillRect(-6, -10, 12, 24); innerCtx.restore();
    };
    
    ctx.fillStyle = '#888';
    // Arm 1 (Swinging)
    ctx.save(); ctx.translate(cx - 7.5, cy + 30); ctx.rotate((walkParam > 0) ? Math.sin(walkParam) * 0.3 : 0); ctx.fillRect(-7.5, 0, 15, 30); if (dir === -1) drawSword(ctx); ctx.restore();
    // Arm 2 (Swinging)
    ctx.save(); ctx.translate(cx + bw + 7.5, cy + 30); ctx.rotate((walkParam > 0) ? Math.sin(walkParam + Math.PI) * 0.3 : 0); ctx.fillRect(-7.5, 0, 15, 30); if (dir === 1) drawSword(ctx); ctx.restore();
    
    // Main Body Chassis
    ctx.fillStyle = '#C0C0C0'; ctx.fillRect(cx, cy, bw, bh); 
    // Eyes & Glowing core
    ctx.fillStyle = '#FF0000'; ctx.fillRect(cx + 15, cy + 15, 18, 10); ctx.fillRect(cx + bw - 33, cy + 15, 18, 10);
    drawGlow(ctx, cx + 24, cy + 20, 20, 'rgba(255, 0, 0, 0.6)'); drawGlow(ctx, cx + bw - 24, cy + 20, 20, 'rgba(255, 0, 0, 0.6)');
    
    // Mouth/Teeth area
    ctx.fillStyle = '#111'; ctx.fillRect(cx + 10, cy + 45, bw - 20, (boss.phase === 2) ? 35 : 20);
    ctx.fillStyle = '#fff'; for (let i=0; i<4; i++) {
        let tx = cx + 15 + i * (bw-30)/4, ty = cy + 45 + ((boss.phase === 2) ? 35 : 20);
        ctx.beginPath(); ctx.moveTo(tx, cy + 45); ctx.lineTo(tx + 5, cy + 45 + 10); ctx.lineTo(tx + 10, cy + 45); ctx.fill();
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 5, ty - 10); ctx.lineTo(tx + 10, ty); ctx.fill();
    }
    
    // Damage feedback overlay
    if (boss.hurtTimer > 0) { ctx.fillStyle = 'white'; ctx.globalAlpha = 0.5; ctx.fillRect(cx, cy, bw, bh); ctx.globalAlpha = 1; }
}

/**
 * Generic Procedural Fiber Rendering
 * Draws multiple glow-strands for a given trail of points.
 */
function drawFiberStrands(points: {x:number, y:number}[] | undefined, strandCount: number, colorHue: number, isFlipped: boolean, alpha: number = 0.8, boss?: IBoss, isMedusa: boolean = false, broadness: number = 1.0, tallness: number = 0.0, baseSpread: number = 0.0, isVertical: boolean = false) {
    if (!points || points.length < 2) return;
    
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.2;
    
    const time = Date.now();
    const dragDir = isFlipped ? 1.2 : -1.2; // Trail pulls opposite of facing
    
    // Atmospheric Pulse Logic: Orbs now maintain a permanent 13px footprint
    // and have a faint, slow 'breathing' sine wave even when idle.
    let orbRadius = 0;
    let orbAlpha = 0;
    let tipX = 0, tipY = 0;
    if (isMedusa && boss) {
        orbRadius = 15; // ZERO SNAPPING: Footprint is now physically locked
        
        // Base Breathing Pulse (Oscillates between 0.1 and 0.25 alpha)
        const idleAlpha = 0.15 + Math.sin(Date.now() * 0.004) * 0.1;
        
        // CHARGE UP: 0.8s leading up to firing (0.7 to 1.5s)
        if (boss.timer >= 0.7) {
            const charge = (boss.timer - 0.7) / 0.8;
            // Sine-based easing (ease-in-out) for much smoother swelling
            const swell = Math.sin(charge * Math.PI / 2);
            orbAlpha = idleAlpha + (0.85 - idleAlpha) * swell;
        }
        // FADE OUT: 0.4s immediately after firing (0.0 to 0.4s)
        else if (boss.timer <= 0.4) {
            const fade = boss.timer / 0.4;
            // Sine-based easing (ease-out) for smooth dissipation
            const dissipate = 1.0 - Math.sin(fade * Math.PI / 2);
            orbAlpha = idleAlpha + (0.85 - idleAlpha) * dissipate;
        }
        else {
            orbAlpha = idleAlpha; // Maintain breathing state during the middle of the cycle
        }
        
        // Tip dynamically tracks the physical end of the chain
        tipX = points[points.length - 1].x;
        tipY = points[points.length - 1].y;
    }
    
    for (let i = 0; i < strandCount; i++) {
        // Performance optimization: bloom only on primary strands
        ctx.shadowBlur = (i < 2) ? 6 : 0;
        ctx.shadowColor = `hsl(${(colorHue + i * 20) % 360}, 100%, 50%)`;
        ctx.strokeStyle = `hsl(${(colorHue + i * 20) % 360}, 100%, 75%)`;
        
        ctx.beginPath();
        for (let j = 0; j < points.length; j++) {
            const p = points[j];
            // Broadness scales rendering spread across strands
            // baseSpread creates a flat offset even at j=0 so strands root from multiple distinct points
            const spread = (i - strandCount/2) * (baseSpread + broadness * (j * 0.5));
            let drawX = p.x + (isVertical ? 0 : spread); 
            let drawY = p.y - (j * tallness) + (isVertical ? spread : 0); 
            
            if (j === 0) ctx.moveTo(drawX, drawY);
            else ctx.lineTo(drawX, drawY);
        }
        ctx.stroke();
        
        // Draw bright laser nodes at the tips for Medusa mode
        if (isMedusa && orbAlpha > 0) {
            ctx.save();
            // Stable Radius Fade: Pass opaque color to keep gradient footprint and use second parameter for alpha
            drawGlow(ctx, tipX, tipY, orbRadius, `rgba(255, 255, 255, 1.0)`, orbAlpha);
            ctx.restore(); 
        } 
    }
    ctx.restore();
}

/**
 * Orchestrates the rendering logic for the current level's active boss.
 * Determines the specific drawing style based on the boss type (Septicus, Auh-Gr, etc.).
 */
export function renderBoss() {
    const boss = G.boss; if (!boss || !boss.active) return;
    
    if (boss.type === 'masticator') {
        drawMasticator(boss);
    } else if (boss.type === 'septicus') {
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
        drawSprite(ctx, frames[frameIdx], boss.x - scaleOffset/2 + vx, boss.y - scaleOffset, boss.width + scaleOffset, boss.height + scaleOffset, dir < 0);
        ctx.restore();

        // Labeling: The "SEPT" nameplate (Always oriented correctly)
        if (boss.hp > 0 && !boss.isSinking) {
            ctx.save();
            ctx.fillStyle = '#8B4513';
            ctx.font = `bold ${Math.floor((boss.height + scaleOffset) * 0.11)}px monospace`;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 2;
            ctx.fillText("SEPT", boss.x + boss.width/2 + vx, boss.y + boss.height * 0.45 - scaleOffset);
            ctx.restore();
        }

        // Secondary Hazards: Falling Manhole Lids
        if (boss.projs) { 
            for (let p of boss.projs) { 
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.timer * 12); 
                drawSprite(ctx, sprManhole, -20, -20, 40, 40, false); 
                ctx.restore(); 
            } 
        }
    } else if (boss.type === 'auh-gr') {
        // Auh-Gr: The giant chase machine (High-frequency animation)
        let frames = [sprAuhGr1, sprAuhGr2, sprAuhGr3];
        let frameIdx = Math.floor(G.timerAcc * 24) % frames.length;
        ctx.save();
        drawSprite(ctx, frames[frameIdx], boss.x, boss.y, boss.width, boss.height, false, 48); // Scaled from its 48-pixel source
        ctx.restore();
    } else if (boss.type === 'glitch') {
        // Glitch: Rider on Virtual Steed (64x64)
        const dir = player.x < boss.x ? -1 : 1;
        const isFlipped = dir < 0;
        
        // Render procedural fiber optics BEFORE the sprite (Rider hair, Steed mane, Steed tail)
        const time = Date.now() * 0.1;
        // Two Pony Tails for Rider
        drawFiberStrands(boss.hairTrail1, 5, time, isFlipped, 1.0, boss, true, 0.5); 
        drawFiberStrands(boss.hairTrail2, 5, time + 20, isFlipped, 0.9, boss, true, 0.5); 
        
        // Mane and Tail for Steed (Broad mane, long tail)
        // Mane: Narrower (0.2) and shorter height (tallness 1.0), with tightened base spread (0.5) stacked vertically (true)
        drawFiberStrands(boss.maneTrail, 8, 180, isFlipped, 0.8, undefined, false, 0.2, 1.0, 0.5, true);  
        drawFiberStrands(boss.tailTrail, 6, 260, isFlipped, 0.9, undefined, false, 1.2);      // Extended rump tail
        
        const frames = [sprGlitch1, sprGlitch2, sprGlitch3, sprGlitch4, sprGlitch5];
        const frameIdx = Math.floor(G.timerAcc * 10) % frames.length; // 10 FPS gallop
        
        ctx.save();
        // Shift sprite slightly based on direction for lean
        const lean = dir === 1 ? 0 : 0; 
        drawSprite(ctx, frames[frameIdx], boss.x + lean, boss.y, boss.width, boss.height, dir < 0, 64);
        
        // --- THE SINGULARITY: HIGH-INTENSITY DASH TELEGRAPH ---
        if (boss.state === 'TELEGRAPH_DASH') {
            const intensity = Math.min(1.0, boss.timer / 1.0); // Build over 1.0s
            const time = Date.now();
            
            ctx.save();
            ctx.translate(boss.x + boss.width/2, boss.y + boss.height/2);
            
            // 1. CHROMATIC ABERRATION CAPSULE
            // Overlapping layers of cyan and red to create a "splitting reality" look
            ctx.globalCompositeOperation = 'lighter';
            
            // Cyan Layer (Left shifted)
            drawGlow(ctx, -10 * intensity, 0, 80 * intensity, 'rgba(0, 255, 255, 0.4)', intensity);
            // Red Layer (Right shifted)
            drawGlow(ctx, 10 * intensity, 0, 80 * intensity, 'rgba(255, 0, 0, 0.4)', intensity);
            // White Core (Center)
            drawGlow(ctx, 0, 0, 50 * intensity, 'rgba(255, 255, 255, 0.8)', intensity);

            // 2. THE ACCELERATOR: Rotating Energy Ring
            // Faster rotation and thicker stroke as intensity builds
            const rotSpeed = time * 0.01 * (1 + intensity * 3);
            ctx.rotate(rotSpeed);
            
            ctx.setLineDash([10, 5]);
            ctx.lineDashOffset = -time * 0.1;
            ctx.strokeStyle = `hsl(${(time * 0.2) % 360}, 100%, 70%)`;
            ctx.lineWidth = 4 + intensity * 8;
            
            ctx.beginPath();
            ctx.arc(0, 0, 60 + intensity * 20, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner pulsing ring
            ctx.setLineDash([]);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = intensity * 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, 40 + Math.sin(time*0.1)*10, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        }

        // Atmospheric Cyan Glow around the core muzzle area (approx right side if facing right)
        const glowX = dir === 1 ? boss.x + boss.width - 8 : boss.x + 8;
        drawGlow(ctx, glowX, boss.y + boss.height * 0.6, 40, 'rgba(0, 255, 255, 0.4)');
        ctx.restore();
    } else if (boss.type === 'goliath') {
        // Goliath: Final fire/lava boss (Deep red)
        ctx.fillStyle = '#550000'; ctx.fillRect(boss.x, boss.y, boss.width, boss.height); 
        ctx.fillStyle = '#ffaa00'; ctx.fillRect(boss.x + boss.width - 40, boss.y + 40, 20, 20);
    }
}
