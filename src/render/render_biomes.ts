/**
 * BIOME RENDERING ENGINE
 * ----------------------
 * Handles the specialized, procedural background layers for each game zone.
 * Each biome uses a unique combination of parallax speeds, procedural shapes, 
 * and dynamic lighting (gradients/flickers) to create atmospheric depth.
 */

import { G, canvas, ctx, TILE_SIZE } from '../core/globals.js';
import { sprGear } from '../assets/assets.js';
import { drawSprite } from './render_utils.js';

/**
 * Slums: Urban silhouette with flickering windows.
 * @param px Camera parallax offset
 */
export function drawSlumsParallax(px: number) {
    for (let i = 0; i < 30; i++) {
        let h = 80 + (Math.sin(i * 999) * 40);
        let w = 40 + (Math.cos(i * 777) * 20);
        let x = ((i * 60) - px) % (canvas.width + 100);
        if (x < -100) x += canvas.width + 200;
        ctx.fillStyle = '#05050f';
        ctx.fillRect(x, canvas.height - h, w, h);
        
        // Flickering windows logic
        ctx.fillStyle = '#f1c40f';
        for (let wy = canvas.height - h + 10; wy < canvas.height - 10; wy += 15) {
            for (let wx = x + 5; wx < x + w - 5; wx += 10) {
                if (Math.sin(i * wx * wy) > 0.5) ctx.fillRect(wx, wy, Math.sin(wx)>0?2:1, Math.sin(wy)>0?2:1);
            }
        }
    }
}

/**
 * Sewer: Wet, brick-patterned tunnels with toxic drips and dynamic pipe-cleaning state.
 * @param px Camera parallax offset
 * @param hpRatio Current player health for color-shifting toxic drips
 */
export function drawSewerParallax(px: number, hpRatio: number) {
    // 1. Distant Brick Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
    for (let r = 0; r < canvas.height / 20 + 2; r++) {
        let ry = r * 20;
        ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(canvas.width, ry); ctx.stroke();
        let shift = (r % 2 === 0) ? 0 : 20;
        for (let c = -1; c < canvas.width / 40 + 2; c++) {
            let bx = (c * 40 + shift - (G.camera.x * 0.1) % 40);
            ctx.beginPath(); ctx.moveTo(bx, ry); ctx.lineTo(bx, ry + 20); ctx.stroke();
        }
    }

    // 2. Large Tunnel Arches
    for (let a = 0; a < 4; a++) {
        let ax = ((a * 400) - px * 0.5) % (canvas.width + 400);
        if (ax < -400) ax += canvas.width + 800;
        ctx.fillStyle = '#010401';
        ctx.beginPath(); ctx.ellipse(ax + 200, canvas.height, 180, 250, 0, Math.PI, Math.PI * 2); ctx.fill();
        let grad = ctx.createRadialGradient(ax+200, canvas.height, 50, ax+200, canvas.height, 200);
        grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = grad; ctx.fill();
    }

    // 3. Fast Foreground Toxic Drips
    for(let j = 0; j < 8; j++) {
        let hX = ((j * 150) - px * 1.5) % (canvas.width + 100);
        if (hX < -100) hX += canvas.width + 200;
        let hDripY = 40 + ((Date.now() / (12 + (j%3)*4)) % (canvas.height - 80));
        ctx.fillStyle = hpRatio > 0.5 ? '#3ee855' : (hpRatio > 0.1 ? '#3eb5e8' : '#00bbff'); 
        ctx.fillRect(hX, hDripY, 3, 15 + (j%2)*5);
    }

    // 4. Vertical Drainage Pipes with Dynamic "Cleaning" visual logic
    for(let i = 0; i < 6; i++) {
        let x = ((i * 200) - px) % (canvas.width + 200);
        if(x < -200) x += canvas.width + 400;
        
        // Base pipe geometry
        ctx.fillStyle = '#2a140b'; ctx.fillRect(x, 0, 40, canvas.height); 
        ctx.fillStyle = '#3a1f11'; ctx.fillRect(x + 10, 0, 20, canvas.height); 
        ctx.fillStyle = '#4d2a1a'; ctx.fillRect(x + 15, 0, 5, canvas.height);  
        ctx.fillStyle = '#1c0e07'; ctx.fillRect(x + 30, 0, 10, canvas.height); 

        // Concrete support brackets
        ctx.fillStyle = '#2a140b';
        for (let cp = 0; cp < 3; cp++) {
            let cpy = 100 + cp * 180;
            ctx.fillRect(x - 4, cpy, 48, 12);
            ctx.fillStyle = '#4d2a1a'; ctx.fillRect(x - 4, cpy + 2, 48, 3);
            ctx.fillStyle = '#2a140b';
        }

        const mColors = ['#1b5c21', '#1e5014', '#3ee855'];
        let currentV = G.purifiedValves.length - 1;
        
        // Tracking: Detect pipe purification triggered by the Septicus cutscene
        if (G.gameState === 'VALVE_CUTSCENE' && x > -50 && x < canvas.width + 50) {
            if (!G.cleanedPipes.some(p => p.id === i)) G.cleanedPipes.push({ id: i, vIdx: currentV });
        }

        let mAlpha = 1.0;
        let pRecord = G.cleanedPipes.find((p: any) => p.id === i);
        if (pRecord) {
            if (pRecord.vIdx < currentV) mAlpha = 0; // Already cleaned
            else if (pRecord.vIdx === currentV && G.gameState === 'VALVE_CUTSCENE') {
                mAlpha = Math.max(0, 1.0 - (G.valveCutsceneTimer / 5.0)); // Fading out moss/grime
            } else mAlpha = 0;
        }

        // Moss and Drip particles on the pipes
        if (mAlpha > 0 && (i % 2 === 0 || i % 3 === 0)) {
            ctx.save(); ctx.globalAlpha = mAlpha;
            let my = (i % 2 === 0) ? 200 : 400;
            for (let m = 0; m < 6; m++) {
                ctx.fillStyle = mColors[m % 3];
                let mx = x + (m % 2 === 0 ? -5 : 25) + Math.sin(m) * 5;
                let mry = my + (m * 4);
                let mSize = 6 + (m % 3) * 4;
                ctx.beginPath(); ctx.arc(mx, mry, mSize, 0, Math.PI * 2); ctx.fill();
                if (m === 2 || m === 4) { // Active drip animation
                    ctx.fillStyle = 'rgba(62, 232, 85, 0.4)';
                    ctx.fillRect(mx - 1, mry, 2, 20 + Math.sin(Date.now()*0.002 + m)*10);
                }
            }
            ctx.restore();
        }

        // General ambient pipe drips
        let dripY = 120 + (i%3)*50 + ((Date.now() / (10 + (i%2)*5)) % (canvas.height - 150));
        ctx.fillStyle = hpRatio > 0.5 ? '#3ee855' : (hpRatio > 0.1 ? '#3eb5e8' : '#00bbff'); 
        ctx.fillRect(x + 18, dripY, 3, 10 + (i%4)*5);
    }
    
    // Bottom fog/fluid layer
    ctx.fillStyle = hpRatio > 0.5 ? '#07170a' : (hpRatio > 0.1 ? '#071217' : '#040b1a');
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
}

/**
 * Mine: Vertical support infrastructure for the climbable biome.
 * @param py Camera Y scroll for vertical parallax
 */
export function drawMineParallax(py: number) {
    // 1. Dark Cavern Walls (Depth)
    ctx.fillStyle = '#0a0805';
    for (let i = 0; i < 5; i++) {
        let rx = ((i * 250) - py * 0.05) % (canvas.width + 300);
        if (rx < -300) rx += canvas.width + 600;
        ctx.fillRect(rx, 0, 60 + (i % 2) * 40, canvas.height);
    }

    // 2. Heavy Industrial Support Beams (Wooden Mining Infrastructure)
    for (let i = -2; i < 5; i++) {
        let by = (i * 350 + py * 0.6) % (canvas.height + 700);
        if (by < -350) by += canvas.height + 1050;

        // Vertical support posts
        ctx.fillStyle = '#2b1d12';
        ctx.fillRect(30, by, 30, 350);
        ctx.fillRect(canvas.width - 60, by, 30, 350);
        
        ctx.fillStyle = '#3d2b1f'; // Grain detail
        ctx.fillRect(40, by, 5, 350);
        ctx.fillRect(canvas.width - 50, by, 5, 350);

        // Horizontal cross-beams (Lintels)
        ctx.fillStyle = '#261a12';
        ctx.fillRect(10, by + 40, canvas.width - 20, 25);
        ctx.fillStyle = '#3d2b1f';
        ctx.fillRect(10, by + 45, canvas.width - 20, 5);
        
        // Iron brackets/bolts
        ctx.fillStyle = '#111';
        ctx.fillRect(25, by + 35, 40, 35);
        ctx.fillRect(canvas.width - 65, by + 35, 40, 35);
    }

    // 3. Rusted Chains and Pulleys (Distant background)
    ctx.strokeStyle = '#1a120b'; ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
        let cx = 100 + i * 300 + Math.sin(i) * 50;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();
        
        let gy = (i * 400 - py * 0.3) % (canvas.height + 400);
        if (gy < -200) gy += canvas.height + 800;
        
        ctx.save(); ctx.translate(cx, gy); ctx.rotate(Date.now() / (2000 + i * 500));
        ctx.globalAlpha = 0.25; ctx.scale(4, 4);
        drawSprite(ctx, sprGear, -12, -12, 24, 24, false);
        ctx.restore();
    }

    // 4. Muddy Water Drips (Damp cavern feel)
    ctx.fillStyle = 'rgba(166, 139, 119, 0.3)'; 
    for (let i = 0; i < 8; i++) {
        let dx = (i * 140 + Math.sin(Date.now() * 0.001 + i) * 20) % canvas.width;
        let dy = (Date.now() / (12 + (i % 4) * 4) + i * 200) % (canvas.height + 200);
        ctx.fillRect(dx, dy - 100, 2, 25);
    }
}

/**
 * renderVirtualBackground: High-dynamic "Blocky Circuitry" background.
 * Features an infinite parallax grid, glitching data artifacts, and screen-tear effects.
 * 
 * @param px Camera X parallax offset
 * @param py Camera Y parallax offset
 */
export function renderVirtualBackground(px: number, py: number) {
    ctx.save();
    
    // Layer 1: Infinite Parallax Grid
    const gridSize = 120;
    const offsetX = Math.floor(-(px * 0.5) % gridSize);
    const offsetY = Math.floor(-(py * 0.2) % gridSize);
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)'; // Increased from 0.2
    ctx.lineWidth = 3; // Increased from 2
    ctx.beginPath();
    // Infinite wrapping logic to prevent seams at level boundaries
    for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
    }
    for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // Layer 2: Moving Data Blocks (Glitch Artifacts)
    for (let i = 0; i < 12; i++) {
        // Lowered threshold from 0.8 to 0.6 for higher frequency
        let pulse = Math.sin(Date.now() * 0.006 + i * 1.7);
        if (pulse > 0.6) {
            let color = (i % 2 === 0) ? '#ff00ff' : '#00ffff';
            ctx.fillStyle = color;
            ctx.globalAlpha = Math.min(1.0, (pulse - 0.6) * 3.0);
            
            // Deterministic positions based on camera movement and index
            let bx = Math.floor((i * 213 + px * 0.7) % (canvas.width + 200)) - 100;
            let by = Math.floor((i * 77 + py * 0.3) % (canvas.height + 200)) - 100;
            let bw = (i % 4 === 0) ? 64 : 24; // Some blocks are horizontally stretched
            let bh = (i % 4 === 0) ? 16 : 24;
            
            ctx.fillRect(bx, by, bw, bh);
        }
    }
    ctx.globalAlpha = 1.0;

    // Layer 3: Macro-Block Displacement (The Screen Tear)
    // Runs at ~1% probability for rare, high-impact glitch feel
    if (Math.random() > 0.985) {
        const sourceX = Math.floor(Math.random() * (canvas.width - 200));
        const sourceY = Math.floor(Math.random() * (canvas.height - 100));
        const w = 200 + Math.floor(Math.random() * 200);
        const h = 50 + Math.floor(Math.random() * 100);
        const offset = (Math.random() > 0.5 ? 30 : -30);
        
        ctx.drawImage(ctx.canvas, sourceX, sourceY, w, h, Math.floor(sourceX + offset), Math.floor(sourceY + offset), w, h);
    }

    // DYNAMIC STATUS LABEL: "ONLINE" / "OFFLINE" Glitch Cycle
    const time = Date.now();
    const cycle = (time / 12000) % 1; // 12 second cycle (slower overall heartbeat)
    const isGlitching = cycle > 0.80; // Glitch for the last 20% (longer read time)
    
    let statusText = "ONLINE";
    let statusColor = "#00ffff";
    let textX = canvas.width / 2; // Keep horizontally centered
    let textY = 100; // Restored to previous height

    if (isGlitching) {
        // Slowed down flicker frequency from 0.05 to 0.01 for readability
        const flicker = Math.sin(time * 0.01) > 0;
        statusText = flicker ? "OFFLINE" : "ONLINE";
        statusColor = flicker ? "#ff00ff" : "#ffffff";
        // Reduced position jitter for better legibility
        textX += (Math.random() - 0.5) * 2;
        textY += (Math.random() - 0.5) * 2;
    }

    ctx.fillStyle = statusColor;
    ctx.font = "20px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText(`VIRTUAL SYSTEM ${statusText}`, textX, textY);
    
    // Reset alignment for subsequent font operations if any
    ctx.textAlign = "left";

    ctx.restore();
}

/**
 * Goliath Core: Hellish red glow and shifting heavy metal plates.
 * @param px Camera parallax offset
 */
export function drawGoliathParallax(px: number) {
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

/**
 * Slums Secondary Layer: Deep urban background.
 */
export function drawSlumsLayer2() {
    let bgOffset1 = -(G.camera.x * 0.2) % 200;
    for (let i = -1; i < canvas.width / 200 + 2; i++) {
        let x = bgOffset1 + i * 200;
        ctx.fillStyle = '#1c0d14'; ctx.fillRect(x + 20, 100, 60, canvas.height);
        ctx.fillRect(x + 80, 150, 40, canvas.height); ctx.fillRect(x + 150, 80, 50, canvas.height);
        let flicker = Math.sin(Date.now() / 150 + i * 42);
        if (flicker > 0) { ctx.fillStyle = '#ff5500'; ctx.fillRect(x + 35, 115, 3, 4 + flicker*4); }
    }
    let bgOffset2 = -(G.camera.x * 0.5) % 150;
    ctx.fillStyle = '#1c0707';
    for (let i = -1; i < canvas.width / 150 + 2; i++) {
        let x = bgOffset2 + i * 150;
        ctx.beginPath(); ctx.moveTo(x, canvas.height); ctx.lineTo(x + 75, canvas.height - 150); ctx.lineTo(x + 150, canvas.height); ctx.fill();
    }
}

