import { G, canvas, ctx, offscreenMapCanvas, offscreenMapCtx, TILE_SIZE } from '../core/globals.js?v=127';
import { sprPortal, sprPipe } from '../assets/assets.js?v=127';
import { drawSprite, drawGlow } from './render_utils.js?v=127';

export function renderConduits() {
    const { items, purifiedValves, activeValvePos, valveCutsceneTimer, mapRows } = G;
    if (G.boss && G.boss.type === 'septicus') {
        for (let i of items) {
            if (i.type === 'valve' || i.type === 'detonator') {
                let px = i.x, py = (Math.floor(i.y / TILE_SIZE) + 3) * TILE_SIZE; 
                ctx.fillStyle = '#5e4533'; ctx.fillRect(i.x, 0, TILE_SIZE, py - TILE_SIZE);
                ctx.fillStyle = '#6d5241'; ctx.fillRect(i.x + 12, 0, 8, py - TILE_SIZE);
                drawSprite(ctx, sprPipe, px, py - TILE_SIZE, 40, 40, false);
                let pv = purifiedValves.find(v => v.x === i.x && v.y === i.y);
                if (pv) {
                    let isActive = (activeValvePos && activeValvePos.x === pv.x && activeValvePos.y === pv.y);
                    ctx.save(); ctx.globalAlpha = isActive ? 1.0 : 0.7; ctx.fillStyle = '#1e90ff'; 
                    let flowOffset = Math.sin(Date.now() * 0.01) * 3, startY = py - 10, endY = mapRows * TILE_SIZE; 
                    ctx.fillRect(px + 10 + flowOffset, startY, isActive ? 22 : 11, endY - startY);
                    drawGlow(ctx, px + 20, endY - 5, isActive ? 70 : 35, 'rgba(0, 187, 255, 0.5)');
                    ctx.restore();
                }
            }
        }
    }
}

export function preRenderMap() {
    if (G.isMapCached) return;
    const { map, mapRows, mapCols } = G;
    offscreenMapCanvas.width = mapCols * TILE_SIZE; offscreenMapCanvas.height = mapRows * TILE_SIZE;
    offscreenMapCtx.clearRect(0, 0, offscreenMapCanvas.width, offscreenMapCanvas.height);
    for (let row = 0; row < mapRows; row++) {
        for (let col = 0; col < mapCols; col++) {
            let tile = map[row][col], tx = col * TILE_SIZE, ty = row * TILE_SIZE;
            if (tile === 1 || tile === 6) {
                offscreenMapCtx.fillStyle = '#2f2c2b'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                offscreenMapCtx.fillStyle = '#6e3c15'; offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 4);
                offscreenMapCtx.fillStyle = '#110d0c'; offscreenMapCtx.fillRect(tx, ty + 4, TILE_SIZE, 2);
                offscreenMapCtx.strokeStyle = '#1a1818'; offscreenMapCtx.lineWidth = 2; offscreenMapCtx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else if (tile === 2) {
                offscreenMapCtx.fillStyle = '#4a3d38'; offscreenMapCtx.fillRect(tx + 10, ty, 5, TILE_SIZE); offscreenMapCtx.fillRect(tx + 25, ty, 5, TILE_SIZE);
                for (let i = 0; i < 4; i++) { offscreenMapCtx.fillStyle = '#78432a'; offscreenMapCtx.fillRect(tx + 10, ty + i * 10 + 5, 20, 3); }
            } else if (tile === 3) {
                let spikeGrad = offscreenMapCtx.createLinearGradient(0, ty + TILE_SIZE, 0, ty); spikeGrad.addColorStop(0, '#332a22'); spikeGrad.addColorStop(1, '#ff3300');
                offscreenMapCtx.fillStyle = spikeGrad; offscreenMapCtx.beginPath(); let spikesCount = 4, w = TILE_SIZE / spikesCount;
                for (let s = 0; s < spikesCount; s++) { offscreenMapCtx.moveTo(tx + s * w + w/2, ty + TILE_SIZE/2); offscreenMapCtx.lineTo(tx + (s+1) * w, ty + TILE_SIZE); offscreenMapCtx.lineTo(tx + s * w, ty + TILE_SIZE); }
                offscreenMapCtx.fill(); drawGlow(offscreenMapCtx, tx + TILE_SIZE/2, ty + TILE_SIZE/2 + 4, 30, 'rgba(255, 30, 0, 0.3)');
            } else if (tile === 15) {
                if (G.acidPurified) {
                    offscreenMapCtx.fillStyle = '#003366'; offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, TILE_SIZE - 12);
                    offscreenMapCtx.fillStyle = '#1e90ff'; offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, 4);
                    drawGlow(offscreenMapCtx, tx + TILE_SIZE/2, ty + 16, 20, 'rgba(0, 187, 255, 0.4)');
                } else {
                    offscreenMapCtx.fillStyle = '#0a210f'; offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, TILE_SIZE - 12);
                    offscreenMapCtx.fillStyle = '#1b5c21'; offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, 4);
                    drawGlow(offscreenMapCtx, tx + TILE_SIZE/2, ty + 16, 20, 'rgba(62, 232, 85, 0.4)');
                }
            }
        }
    }
    G.isMapCached = true;
}

export function renderAnimatedTiles() {
    const { map, mapRows, mapCols, camera } = G;
    let startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE)), endCol = Math.min(mapCols - 1, Math.floor((camera.x + canvas.width) / TILE_SIZE));
    let startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE)), endRow = Math.min(mapRows - 1, Math.floor((camera.y + canvas.height) / TILE_SIZE));
    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            if (map[row][col] === 5) {
                let tx = col * TILE_SIZE, ty = row * TILE_SIZE, pulse = 1 + Math.sin(Date.now() / 150) * 0.1, undulate = 1 + Math.cos(Date.now() / 120) * 0.1;
                let pW = TILE_SIZE * pulse, pH = TILE_SIZE * undulate;
                drawGlow(ctx, tx + TILE_SIZE/2, ty + TILE_SIZE/2, 40, 'rgba(0, 255, 255, 0.5)');
                drawSprite(ctx, sprPortal, tx + (TILE_SIZE - pW)/2, ty + (TILE_SIZE - pH)/2, pW, pH, false);
            }
        }
    }
}
