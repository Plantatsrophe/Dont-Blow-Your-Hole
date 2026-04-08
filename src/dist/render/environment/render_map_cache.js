import { G, offscreenMapCanvas, offscreenMapCtx, TILE_SIZE } from '../../core/globals.js';
import { drawGlow } from '../utils/render_utils.js';
/**
 * Map Caching Logic (Pre-Renderer).
 * Draws the entire level's static tiles onto an offscreen canvas once per level load.
 */
export function preRenderMap() {
    if (G.isMapCached)
        return;
    const { map, mapRows, mapCols, currentLevel } = G;
    const bId = Math.floor(currentLevel / 20) % 5;
    offscreenMapCanvas.width = mapCols * TILE_SIZE;
    offscreenMapCanvas.height = mapRows * TILE_SIZE;
    offscreenMapCtx.clearRect(0, 0, offscreenMapCanvas.width, offscreenMapCanvas.height);
    for (let row = 0; row < mapRows; row++) {
        for (let col = 0; col < mapCols; col++) {
            let tile = map[row][col], tx = col * TILE_SIZE, ty = row * TILE_SIZE;
            if (tile === 1 || tile === 6) {
                if (bId === 2) { // MINE
                    const leftSame = col > 0 && map[row][col - 1] === 1;
                    const rightSame = col < mapCols - 1 && map[row][col + 1] === 1;
                    offscreenMapCtx.fillStyle = '#1a120b';
                    offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    offscreenMapCtx.fillStyle = '#2b1d12';
                    offscreenMapCtx.beginPath();
                    if (!leftSame)
                        offscreenMapCtx.moveTo(tx, ty + 20);
                    else
                        offscreenMapCtx.moveTo(tx, ty + 15);
                    offscreenMapCtx.lineTo(tx + 20, ty + 10);
                    offscreenMapCtx.lineTo(tx + 40, ty + 25);
                    offscreenMapCtx.lineTo(tx + 40, ty + 40);
                    offscreenMapCtx.lineTo(tx, ty + 40);
                    offscreenMapCtx.fill();
                    offscreenMapCtx.fillStyle = '#3d2b1f';
                    offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 6);
                    offscreenMapCtx.fillStyle = '#1a120b';
                    offscreenMapCtx.fillRect(tx, ty + 6, TILE_SIZE, 2);
                    if (!leftSame) {
                        offscreenMapCtx.fillStyle = 'rgba(0,0,0,0.3)';
                        offscreenMapCtx.fillRect(tx, ty, 2, TILE_SIZE);
                    }
                    if (!rightSame) {
                        offscreenMapCtx.fillStyle = 'rgba(0,0,0,0.5)';
                        offscreenMapCtx.fillRect(tx + TILE_SIZE - 2, ty, 2, TILE_SIZE);
                    }
                    if ((row * 7 + col * 3) % 11 < 3) {
                        offscreenMapCtx.fillStyle = (col % 2 === 0) ? '#ffd700' : '#ff8c00';
                        offscreenMapCtx.fillRect(tx + 12 + (row % 4) * 4, ty + 12 + (col % 4) * 4, 2, 2);
                    }
                }
                else if (bId === 4) { // H311 - ROCKY LAVA TERRAIN
                    let seed = (row * 131 + col * 17) % 1000;
                    // --- TRUE JAGGED SILHOUETTE ---
                    // Subdivides each edge into multiple segments with random jitter 
                    // to create a truly irregular, crumbly rock profile.
                    offscreenMapCtx.beginPath();
                    let jit = 4; // Max jitter in pixels
                    let segs = 4; // Number of subdivisions per edge
                    // Start at jittered Top-Left
                    offscreenMapCtx.moveTo(tx + (seed % jit) - jit / 2, ty + ((seed * 3) % jit) - jit / 2);
                    // Top Edge (Left -> Right)
                    for (let i = 1; i <= segs; i++) {
                        let t = i / segs;
                        let ox = i < segs ? ((seed * (i + 5)) % jit) - jit / 2 : 0;
                        let oy = i < segs ? ((seed * (i + 7)) % jit) - jit / 2 : 0;
                        offscreenMapCtx.lineTo(tx + TILE_SIZE * t + ox, ty + oy);
                    }
                    // Right Edge (Top -> Bottom)
                    for (let i = 1; i <= segs; i++) {
                        let t = i / segs;
                        let ox = i < segs ? ((seed * (i + 11)) % jit) - jit / 2 : 0;
                        let oy = i < segs ? ((seed * (i + 13)) % jit) - jit / 2 : 0;
                        offscreenMapCtx.lineTo(tx + TILE_SIZE + ox, ty + TILE_SIZE * t + oy);
                    }
                    // Bottom Edge (Right -> Left)
                    for (let i = 1; i <= segs; i++) {
                        let t = i / segs;
                        let ox = i < segs ? ((seed * (i + 17)) % jit) - jit / 2 : 0;
                        let oy = i < segs ? ((seed * (i + 19)) % jit) - jit / 2 : 0;
                        offscreenMapCtx.lineTo(tx + TILE_SIZE * (1 - t) + ox, ty + TILE_SIZE + oy);
                    }
                    // Left Edge (Bottom -> Top)
                    for (let i = 1; i <= segs; i++) {
                        let t = i / segs;
                        let ox = i < segs ? ((seed * (i + 23)) % jit) - jit / 2 : 0;
                        let oy = i < segs ? ((seed * (i + 29)) % jit) - jit / 2 : 0;
                        offscreenMapCtx.lineTo(tx + ox, ty + TILE_SIZE * (1 - t) + oy);
                    }
                    offscreenMapCtx.closePath();
                    // Dark volcanic rock base
                    offscreenMapCtx.fillStyle = '#1a1a1a';
                    offscreenMapCtx.fill();
                    // Crumbly Texture: Add procedural stone noise
                    for (let n = 0; n < 8; n++) {
                        let nx = (seed * (n + 13)) % TILE_SIZE;
                        let ny = (seed * (n + 19)) % TILE_SIZE;
                        let size = (seed + n) % 3 + 1;
                        offscreenMapCtx.fillStyle = n % 2 === 0 ? '#121212' : '#222222';
                        offscreenMapCtx.fillRect(tx + nx, ty + ny, size, size);
                    }
                    // Procedural Lava Fissures (within jagged bounds)
                    offscreenMapCtx.strokeStyle = '#ff4400';
                    offscreenMapCtx.lineWidth = 1;
                    for (let i = 0; i < 2; i++) {
                        let fX1 = (seed * (i + 1)) % TILE_SIZE;
                        let fY1 = (seed * (i + 3)) % TILE_SIZE;
                        let fX2 = (seed * (i + 5)) % TILE_SIZE;
                        let fY2 = (seed * (i + 7)) % TILE_SIZE;
                        offscreenMapCtx.beginPath();
                        offscreenMapCtx.moveTo(tx + fX1, ty + fY1);
                        offscreenMapCtx.lineTo(tx + fX2, ty + fY2);
                        offscreenMapCtx.stroke();
                        offscreenMapCtx.shadowBlur = 4;
                        offscreenMapCtx.shadowColor = '#ffaa00';
                        offscreenMapCtx.stroke();
                        offscreenMapCtx.shadowBlur = 0;
                    }
                    // Final beveling pass (jagged edge highlights)
                    offscreenMapCtx.strokeStyle = '#222222';
                    offscreenMapCtx.lineWidth = 1;
                    offscreenMapCtx.stroke();
                }
                else { // INDUSTRIAL
                    offscreenMapCtx.fillStyle = '#2f2c2b';
                    offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    offscreenMapCtx.fillStyle = '#6e3c15';
                    offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 4);
                    offscreenMapCtx.fillStyle = '#110d0c';
                    offscreenMapCtx.fillRect(tx, ty + 4, TILE_SIZE, 2);
                    offscreenMapCtx.strokeStyle = '#1a1818';
                    offscreenMapCtx.lineWidth = 2;
                    offscreenMapCtx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
                if (row < mapRows - 1 && (map[row + 1][col] === 2 || map[row + 1][col] === 9)) {
                    offscreenMapCtx.fillStyle = '#4a3d38';
                    offscreenMapCtx.fillRect(tx + 10, ty, 5, TILE_SIZE);
                    offscreenMapCtx.fillRect(tx + 25, ty, 5, TILE_SIZE);
                    for (let i = 0; i < 4; i++) {
                        offscreenMapCtx.fillStyle = '#78432a';
                        offscreenMapCtx.fillRect(tx + 10, ty + i * 10 + 5, 20, 3);
                    }
                }
            }
            else if (tile === 2 || tile === 9) {
                if (tile === 9) {
                    if (bId === 2) {
                        offscreenMapCtx.fillStyle = '#1a120b';
                        offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                        offscreenMapCtx.fillStyle = '#2b1d12';
                        offscreenMapCtx.beginPath();
                        offscreenMapCtx.moveTo(tx, ty + 20);
                        offscreenMapCtx.lineTo(tx + 20, ty + 10);
                        offscreenMapCtx.lineTo(tx + 40, ty + 25);
                        offscreenMapCtx.lineTo(tx + 40, ty + 40);
                        offscreenMapCtx.lineTo(tx, ty + 40);
                        offscreenMapCtx.fill();
                        offscreenMapCtx.fillStyle = '#3d2b1f';
                        offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 6);
                        offscreenMapCtx.fillStyle = '#1a120b';
                        offscreenMapCtx.fillRect(tx, ty + 6, TILE_SIZE, 2);
                    }
                    else {
                        offscreenMapCtx.fillStyle = '#2f2c2b';
                        offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                        offscreenMapCtx.fillStyle = '#6e3c15';
                        offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 4);
                        offscreenMapCtx.fillStyle = '#110d0c';
                        offscreenMapCtx.fillRect(tx, ty + 4, TILE_SIZE, 2);
                    }
                }
                offscreenMapCtx.fillStyle = '#4a3d38';
                offscreenMapCtx.fillRect(tx + 10, ty, 5, TILE_SIZE);
                offscreenMapCtx.fillRect(tx + 25, ty, 5, TILE_SIZE);
                for (let i = 0; i < 4; i++) {
                    offscreenMapCtx.fillStyle = '#78432a';
                    offscreenMapCtx.fillRect(tx + 10, ty + i * 10 + 5, 20, 3);
                }
            }
            else if (tile === 3) {
                let spikeGrad = offscreenMapCtx.createLinearGradient(0, ty + TILE_SIZE, 0, ty);
                spikeGrad.addColorStop(0, '#332a22');
                spikeGrad.addColorStop(1, '#ff3300');
                offscreenMapCtx.fillStyle = spikeGrad;
                offscreenMapCtx.beginPath();
                let spikesCount = 4, w = TILE_SIZE / spikesCount;
                for (let s = 0; s < spikesCount; s++) {
                    offscreenMapCtx.moveTo(tx + s * w + w / 2, ty + TILE_SIZE / 2);
                    offscreenMapCtx.lineTo(tx + (s + 1) * w, ty + TILE_SIZE);
                    offscreenMapCtx.lineTo(tx + s * w, ty + TILE_SIZE);
                }
                offscreenMapCtx.fill();
                drawGlow(offscreenMapCtx, tx + TILE_SIZE / 2, ty + TILE_SIZE / 2 + 4, 30, 'rgba(255, 30, 0, 0.3)');
            }
            else if (tile === 15) {
                offscreenMapCtx.fillStyle = G.acidPurified ? '#003366' : '#0a210f';
                offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, TILE_SIZE - 12);
                offscreenMapCtx.fillStyle = G.acidPurified ? '#1e90ff' : '#1b5c21';
                offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, 4);
                drawGlow(offscreenMapCtx, tx + TILE_SIZE / 2, ty + 16, 20, G.acidPurified ? 'rgba(0, 187, 255, 0.4)' : 'rgba(62, 232, 85, 0.4)');
            }
            else if (tile === 16) {
                if (bId === 0) {
                    offscreenMapCtx.fillStyle = '#1a1818';
                    offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    offscreenMapCtx.strokeStyle = '#333333';
                    offscreenMapCtx.lineWidth = 2;
                    offscreenMapCtx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
                else if (bId === 1) {
                    offscreenMapCtx.fillStyle = '#0a1a0d';
                    offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                }
                else if (bId === 2) {
                    offscreenMapCtx.fillStyle = '#0d0a08';
                    offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    offscreenMapCtx.fillStyle = '#2b1d12';
                    if (row === 0 || row === mapRows - 1)
                        offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, 16);
                    if (col === 0 || col === mapCols - 1)
                        offscreenMapCtx.fillRect(tx + 12, ty, 16, TILE_SIZE);
                }
                else if (bId === 3) { // VIRTUAL
                    offscreenMapCtx.fillStyle = '#0a000a';
                    offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    offscreenMapCtx.strokeStyle = '#ff00ff';
                    offscreenMapCtx.lineWidth = 1;
                    offscreenMapCtx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
                else { // H311 - OBSIDIAN BOUNDARY
                    // Screens edge tiles (non-interactable) are deep obsidian
                    offscreenMapCtx.fillStyle = '#050510';
                    offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    // Procedural Glass Cracks
                    offscreenMapCtx.strokeStyle = '#1a1a2e';
                    offscreenMapCtx.lineWidth = 1;
                    let seed = (row * 131 + col * 17) % 1000;
                    for (let i = 0; i < 2; i++) {
                        let x1 = (seed * (i + 2)) % TILE_SIZE;
                        let y1 = (seed * (i + 4)) % TILE_SIZE;
                        let x2 = (seed * (i + 6)) % TILE_SIZE;
                        let y2 = (seed * (i + 8)) % TILE_SIZE;
                        offscreenMapCtx.beginPath();
                        offscreenMapCtx.moveTo(tx + x1, ty + y1);
                        offscreenMapCtx.lineTo(tx + x2, ty + y2);
                        offscreenMapCtx.stroke();
                    }
                    // Glassy bevel
                    offscreenMapCtx.strokeStyle = '#222233';
                    offscreenMapCtx.lineWidth = 2;
                    offscreenMapCtx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
            }
        }
    }
    if (bId === 3) {
        offscreenMapCtx.save();
        offscreenMapCtx.strokeStyle = '#00ffff';
        offscreenMapCtx.lineWidth = 2;
        offscreenMapCtx.shadowBlur = 8;
        offscreenMapCtx.shadowColor = '#00ffff';
        offscreenMapCtx.globalCompositeOperation = 'lighter';
        for (let row = 0; row < mapRows; row++) {
            for (let col = 0; col < mapCols; col++) {
                let tile = map[row][col], tx = col * TILE_SIZE, ty = row * TILE_SIZE;
                if (ty >= 40 && (tile === 1 || tile === 6 || tile === 16))
                    offscreenMapCtx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            }
        }
        offscreenMapCtx.restore();
    }
    else if (bId === 4) {
        // H311 Edge Highlights: Sharp obsidian glimmers move to boundary tiles
        offscreenMapCtx.save();
        offscreenMapCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        offscreenMapCtx.lineWidth = 1;
        for (let row = 0; row < mapRows; row++) {
            for (let col = 0; col < mapCols; col++) {
                let tile = map[row][col], tx = col * TILE_SIZE, ty = row * TILE_SIZE;
                if (tile === 16) { // Now glimmers appear on the obsidian boundaries
                    offscreenMapCtx.beginPath();
                    offscreenMapCtx.moveTo(tx + 4, ty + 4);
                    offscreenMapCtx.lineTo(tx + 12, ty + 4);
                    offscreenMapCtx.moveTo(tx + 4, ty + 4);
                    offscreenMapCtx.lineTo(tx + 4, ty + 12);
                    offscreenMapCtx.stroke();
                }
            }
        }
        offscreenMapCtx.restore();
    }
    G.isMapCached = true;
}
