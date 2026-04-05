import { G, canvas, ctx } from '../core/globals.js';
import { sprGear } from '../assets/assets.js';
import { drawSprite } from './render_utils.js';
export function drawSlumsParallax(px) {
    for (let i = 0; i < 30; i++) {
        let h = 80 + (Math.sin(i * 999) * 40);
        let w = 40 + (Math.cos(i * 777) * 20);
        let x = ((i * 60) - px) % (canvas.width + 100);
        if (x < -100)
            x += canvas.width + 200;
        ctx.fillStyle = '#05050f';
        ctx.fillRect(x, canvas.height - h, w, h);
        ctx.fillStyle = '#f1c40f';
        for (let wy = canvas.height - h + 10; wy < canvas.height - 10; wy += 15) {
            for (let wx = x + 5; wx < x + w - 5; wx += 10) {
                if (Math.sin(i * wx * wy) > 0.5)
                    ctx.fillRect(wx, wy, Math.sin(wx) > 0 ? 2 : 1, Math.sin(wy) > 0 ? 2 : 1);
            }
        }
    }
}
export function drawSewerParallax(px, hpRatio) {
    // Faint Brick Pattern
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let r = 0; r < canvas.height / 20 + 2; r++) {
        let ry = r * 20;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.lineTo(canvas.width, ry);
        ctx.stroke();
        let shift = (r % 2 === 0) ? 0 : 20;
        for (let c = -1; c < canvas.width / 40 + 2; c++) {
            let bx = (c * 40 + shift - (G.camera.x * 0.1) % 40);
            ctx.beginPath();
            ctx.moveTo(bx, ry);
            ctx.lineTo(bx, ry + 20);
            ctx.stroke();
        }
    }
    // Dark Tunnel Openings
    for (let a = 0; a < 4; a++) {
        let ax = ((a * 400) - px * 0.5) % (canvas.width + 400);
        if (ax < -400)
            ax += canvas.width + 800;
        ctx.fillStyle = '#010401';
        ctx.beginPath();
        ctx.ellipse(ax + 200, canvas.height, 180, 250, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        let grad = ctx.createRadialGradient(ax + 200, canvas.height, 50, ax + 200, canvas.height, 200);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = grad;
        ctx.fill();
    }
    for (let j = 0; j < 8; j++) {
        let hX = ((j * 150) - px * 1.5) % (canvas.width + 100);
        if (hX < -100)
            hX += canvas.width + 200;
        let hDripY = 40 + ((Date.now() / (12 + (j % 3) * 4)) % (canvas.height - 80));
        ctx.fillStyle = hpRatio > 0.5 ? '#3ee855' : (hpRatio > 0.1 ? '#3eb5e8' : '#00bbff');
        ctx.fillRect(hX, hDripY, 3, 15 + (j % 2) * 5);
    }
    for (let i = 0; i < 6; i++) {
        let x = ((i * 200) - px) % (canvas.width + 200);
        if (x < -200)
            x += canvas.width + 400;
        ctx.fillStyle = '#2a140b';
        ctx.fillRect(x, 0, 40, canvas.height);
        ctx.fillStyle = '#3a1f11';
        ctx.fillRect(x + 10, 0, 20, canvas.height);
        ctx.fillStyle = '#4d2a1a';
        ctx.fillRect(x + 15, 0, 5, canvas.height);
        ctx.fillStyle = '#1c0e07';
        ctx.fillRect(x + 30, 0, 10, canvas.height);
        ctx.fillStyle = '#2a140b';
        for (let cp = 0; cp < 3; cp++) {
            let cpy = 100 + cp * 180;
            ctx.fillRect(x - 4, cpy, 48, 12);
            ctx.fillStyle = '#4d2a1a';
            ctx.fillRect(x - 4, cpy + 2, 48, 3);
            ctx.fillStyle = '#2a140b';
        }
        const mColors = ['#1b5c21', '#1e5014', '#3ee855'];
        let currentV = G.purifiedValves.length - 1;
        if (G.gameState === 'VALVE_CUTSCENE' && x > -50 && x < canvas.width + 50) {
            if (!G.cleanedPipes.some(p => p.id === i))
                G.cleanedPipes.push({ id: i, vIdx: currentV });
        }
        let mAlpha = 1.0;
        let pRecord = G.cleanedPipes.find((p) => p.id === i);
        if (pRecord) {
            if (pRecord.vIdx < currentV)
                mAlpha = 0;
            else if (pRecord.vIdx === currentV && G.gameState === 'VALVE_CUTSCENE') {
                mAlpha = Math.max(0, 1.0 - (G.valveCutsceneTimer / 5.0));
            }
            else
                mAlpha = 0;
        }
        if (mAlpha > 0 && (i % 2 === 0 || i % 3 === 0)) {
            ctx.save();
            ctx.globalAlpha = mAlpha;
            let my = (i % 2 === 0) ? 200 : 400;
            for (let m = 0; m < 6; m++) {
                ctx.fillStyle = mColors[m % 3];
                let mx = x + (m % 2 === 0 ? -5 : 25) + Math.sin(m) * 5;
                let mry = my + (m * 4);
                let mSize = 6 + (m % 3) * 4;
                ctx.beginPath();
                ctx.arc(mx, mry, mSize, 0, Math.PI * 2);
                ctx.fill();
                if (m === 2 || m === 4) {
                    ctx.fillStyle = 'rgba(62, 232, 85, 0.4)';
                    ctx.fillRect(mx - 1, mry, 2, 20 + Math.sin(Date.now() * 0.002 + m) * 10);
                }
            }
            ctx.restore();
        }
        let dripY = 120 + (i % 3) * 50 + ((Date.now() / (10 + (i % 2) * 5)) % (canvas.height - 150));
        ctx.fillStyle = hpRatio > 0.5 ? '#3ee855' : (hpRatio > 0.1 ? '#3eb5e8' : '#00bbff');
        ctx.fillRect(x + 18, dripY, 3, 10 + (i % 4) * 5);
    }
    ctx.fillStyle = hpRatio > 0.5 ? '#07170a' : (hpRatio > 0.1 ? '#071217' : '#040b1a');
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
}
export function drawMineParallax(py) {
    ctx.strokeStyle = '#221333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = -10; i < 20; i++) {
        let offset = (i * 50 + py) % (canvas.height + 500);
        if (offset < -300)
            offset += canvas.height + 600;
        ctx.moveTo(0, offset);
        ctx.lineTo(canvas.width, offset + canvas.width);
        ctx.moveTo(canvas.width, offset);
        ctx.lineTo(0, offset + canvas.width);
    }
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
        let gy = (-py * 0.6 + i * 250) % (canvas.height + 150);
        if (gy < -150)
            gy += canvas.height + 300;
        let gx = 80 + (i * 140) % canvas.width;
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(Date.now() / (800 + i * 300));
        ctx.globalAlpha = 0.2;
        ctx.scale(3, 3);
        drawSprite(ctx, sprGear, -12, -12, 24, 24, false);
        ctx.restore();
    }
}
export function drawFactoryParallax(px) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
        let sY = 50 + i * 50;
        let sX = ((i * 140) - px) % (canvas.width + 300);
        if (sX < -150)
            sX += canvas.width + 400;
        ctx.beginPath();
        ctx.moveTo(sX, sY);
        ctx.lineTo(sX + 60, sY);
        ctx.lineTo(sX + 100, sY + (i % 2 === 0 ? 40 : -40));
        ctx.lineTo(sX + 220, sY + (i % 2 === 0 ? 40 : -40));
        ctx.stroke();
        let glow = 0.3 + Math.abs(Math.sin(Date.now() / 250 + i)) * 0.7;
        ctx.fillStyle = `rgba(0, 255, 255, ${glow})`;
        ctx.beginPath();
        ctx.arc(sX + 220, sY + (i % 2 === 0 ? 40 : -40), 8, 0, Math.PI * 2);
        ctx.fill();
    }
}
export function drawGoliathParallax(px) {
    if (Math.random() > 0.95) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    let mX = (canvas.width * 0.75 - px) % (canvas.width + 400);
    if (mX < -250)
        mX += canvas.width + 600;
    ctx.fillStyle = '#db2323';
    ctx.beginPath();
    ctx.arc(mX, 180, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(43, 2, 2, 0.85)';
    for (let i = 0; i < 7; i++) {
        let cX = ((i * 180) - px * 8 - (Date.now() / 12 % canvas.width)) % (canvas.width + 300);
        if (cX < -200)
            cX += canvas.width + 500;
        ctx.fillRect(cX, 70 + i * 60, 160 + (i % 4) * 60, 25);
    }
}
export function drawSlumsLayer2() {
    let bgOffset1 = -(G.camera.x * 0.2) % 200;
    for (let i = -1; i < canvas.width / 200 + 2; i++) {
        let x = bgOffset1 + i * 200;
        ctx.fillStyle = '#1c0d14';
        ctx.fillRect(x + 20, 100, 60, canvas.height);
        ctx.fillRect(x + 80, 150, 40, canvas.height);
        ctx.fillRect(x + 150, 80, 50, canvas.height);
        let flicker = Math.sin(Date.now() / 150 + i * 42);
        if (flicker > 0) {
            ctx.fillStyle = '#ff5500';
            ctx.fillRect(x + 35, 115, 3, 4 + flicker * 4);
        }
    }
    let bgOffset2 = -(G.camera.x * 0.5) % 150;
    ctx.fillStyle = '#1c0707';
    for (let i = -1; i < canvas.width / 150 + 2; i++) {
        let x = bgOffset2 + i * 150;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.lineTo(x + 75, canvas.height - 150);
        ctx.lineTo(x + 150, canvas.height);
        ctx.fill();
    }
}
