import { G, canvas, ctx } from '../../core/globals.js';
import { sprHero, sprHotdog, sprBot, sprGear } from '../../assets/assets.js';
import { drawSprite } from '../utils/render_utils.js';

export { renderIntroScreen } from './render_menu_intro.js';
export { renderInstructions } from './render_menu_instructions.js';

/**
 * Main Start Screen: Logo, High Scores, and "Press Enter" prompt.
 */
export function renderStartScreen() {
    ctx.save();
    ctx.globalAlpha = 1.0; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    renderLogoBackground();

    ctx.fillStyle = '#f1c40f'; ctx.textAlign = 'center'; ctx.font = '25px "Press Start 2P", sans-serif'; 
    ctx.fillText("DON'T DIE", canvas.width / 2, canvas.height / 2 - 140);
    ctx.font = '15px "Press Start 2P", sans-serif'; 
    ctx.fillText("A GRFC™ GAME", canvas.width / 2, canvas.height / 2 - 110);
    
    if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText('PRESS ENTER TO START', canvas.width / 2, 540);
    
    renderLeaderboard();
    renderMenuDecorations();
    
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px "Press Start 2P", sans-serif';
    ctx.fillText('BETA VERSION', canvas.width / 2, canvas.height - 15);
    
    ctx.restore();
}

function renderLogoBackground() {
    if (!(window as any).logoImg) { (window as any).logoImg = new Image(); (window as any).logoImg.src = 'src/assets/images/logo.png'; }
    let logoImg = (window as any).logoImg;
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        if (!(window as any).logoOsc) {
            let nw = 160, ratio = logoImg.naturalWidth / logoImg.naturalHeight, nh = Math.round(160 / ratio);
            (window as any).logoOsc = document.createElement('canvas'); (window as any).logoOsc.width = nw; (window as any).logoOsc.height = nh;
            (window as any).logoOsc.getContext('2d').drawImage(logoImg, 0, 0, nw, nh);
        }
        ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 0.35;
        const osc = (window as any).logoOsc!;
        let scaleRatio = canvas.width / osc.width, displayH = osc.height * scaleRatio;
        ctx.drawImage(osc, 0, 0, osc.width, osc.height, 0, (canvas.height - displayH) / 2, canvas.width, displayH);
        ctx.globalAlpha = 1.0;
    }
}

function renderLeaderboard() {
    ctx.fillStyle = '#f1c40f'; ctx.font = '15px "Press Start 2P", sans-serif';
    ctx.fillText('TOP 10 SURVIVORS', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '10px "Press Start 2P", sans-serif';
    for (let i = 0; i < G.highScores.length; i++) {
        let hs = G.highScores[i];
        let rankStr = (i + 1).toString().padStart(2, ' ');
        let nameStr = hs.name.padEnd(8, ' ');
        let scoreStr = hs.score.toString().padStart(7, ' ');
        ctx.fillText(`${rankStr}. ${nameStr} ... ${scoreStr}`, canvas.width / 2, canvas.height / 2 + (i * 15));
    }
}

function renderMenuDecorations() {
    let sbY = canvas.height / 2 + 15, sprFlip = Math.floor(Date.now() / 600) % 2 === 0;
    drawSprite(ctx, sprHero, canvas.width/2 - 200, sbY, 32, 40, sprFlip);
    drawSprite(ctx, sprHotdog, canvas.width/2 - 196, sbY + 70, 24, 24, !sprFlip);
    drawSprite(ctx, sprBot, canvas.width/2 + 160, sbY, 38, 38, !sprFlip);
    ctx.save(); ctx.translate(canvas.width/2 + 167 + 12, sbY + 70 + 12); ctx.scale(Math.cos(Date.now() / 150), 1);
    drawSprite(ctx, sprGear, -12, -12, 24, 24, false); ctx.restore();
}
