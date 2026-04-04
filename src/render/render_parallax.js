import { G, canvas, ctx } from '../core/globals.js?v=126';
import { 
    drawSlumsParallax, drawSewerParallax, drawShaftParallax, 
    drawFactoryParallax, drawGoliathParallax, drawSlumsLayer2 
} from './render_biomes.js?v=126';

export function renderParallax() {
    const { currentLevel, camera } = G;
    const bId = Math.floor(currentLevel / 20) % 5;
    
    let boss = G.boss;
    let hpRatio = 1.0;
    if (currentLevel === 39) {
        if (!boss || !boss.active || boss.hp <= 0 || boss.isSinking) hpRatio = 0.0;
        else hpRatio = boss.hp / boss.maxHp;
    }

    // Sky Gradients
    let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (bId === 1) { // Acid/Sewer
        let cMurk = hpRatio > 0.5 ? '#0a210f' : (hpRatio > 0.1 ? '#0a161f' : '#0a0f1a');
        let cDeep = hpRatio > 0.5 ? '#1b5c21' : (hpRatio > 0.1 ? '#1b4a5c' : '#1b3a5c');
        skyGradient.addColorStop(0, '#020502'); 
        skyGradient.addColorStop(0.5, cMurk);
        skyGradient.addColorStop(1, cDeep);
    } else if (bId === 2) { // Shaft
        skyGradient.addColorStop(0, '#030014'); skyGradient.addColorStop(1, '#2c0c4a');
    } else if (bId === 3) { // Factory
        skyGradient.addColorStop(0, '#050f14'); skyGradient.addColorStop(1, '#1a4159');
    } else if (bId === 4) { // Goliath
        skyGradient.addColorStop(0, '#2b0202'); skyGradient.addColorStop(1, '#7a0505');
    } else { // Slums
        skyGradient.addColorStop(0, '#0a0a1a'); skyGradient.addColorStop(1, '#a34110');
    }
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Biome Specific Parallax Layers
    if (bId === 0) drawSlumsParallax(camera.x * 0.2);
    else if (bId === 1) drawSewerParallax(camera.x * 0.3, hpRatio);
    else if (bId === 2) drawShaftParallax(camera.y * 0.4);
    else if (bId === 3) drawFactoryParallax(camera.x * 0.15);
    else if (bId === 4) drawGoliathParallax(camera.x * 0.05);
}

export function renderParallaxLayer2() {
    const { currentLevel } = G;
    const bId = Math.floor(currentLevel / 20) % 5;
    if (bId === 0) drawSlumsLayer2();
}
