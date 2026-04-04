import { G, player, ctx, keys } from '../core/globals.js?v=126';
import { sprHero, sprRef, sprPortal, sprHeroDead } from '../assets/assets.js?v=126';
import { drawSprite, drawGlow } from './render_utils.js?v=126';

export function renderPlayer() {
    const { gameState, timerAcc, winTimer } = G;
    if (gameState === 'DYING' || gameState === 'CREDITS' || gameState === 'CREDITS_CUTSCENE') return;

    let playerFlip = (player.vx < 0 || keys.ArrowLeft) && !(player.vx > 0 || keys.ArrowRight);
    if (player.vx === 0 && !keys.ArrowLeft) playerFlip = player.lastDir === -1;
    if (player.vx < 0) player.lastDir = -1;
    if (player.vx > 0) player.lastDir = 1;

    let wY = (player.isOnGround && player.vx !== 0 && Math.floor(timerAcc * 10) % 2 === 0) ? 2 : 0;
    ctx.save();
    if (gameState === 'LEVEL_CLEAR') {
        let scale = Math.max(0, 1.0 - (winTimer / 2.0));
        ctx.translate(player.x + player.width/2, player.y + player.height/2 + wY);
        ctx.rotate(winTimer * 15); ctx.scale(scale, scale);
        drawGlow(ctx, 0, 0, 40, 'rgba(255, 150, 0, 0.25)'); 
        drawSprite(ctx, sprHero, -player.width/2, -player.height/2, player.width, player.height, playerFlip);
    } else {
        drawGlow(ctx, player.x + 12, player.y + 16, 40, 'rgba(255, 150, 0, 0.25)');
        drawSprite(ctx, sprHero, player.x, player.y + wY, player.width, player.height, playerFlip);
    }
    ctx.restore();
}

export function renderPlayerCutscene() {
    const { gameState } = G;
    if (gameState !== 'CREDITS_CUTSCENE') return;
    let animT = Math.min(1.0, player.cutsceneTimer / 4.0), ptX = player.x, ptY = player.y;
    if (animT < 0.5) {
        drawSprite(ctx, sprRef, ptX - 100 + (animT * 2 * 100), ptY, 24, 24, false);
        ctx.fillStyle = 'white'; for(let sx of [-15, -5, 10, 20]) ctx.fillRect(ptX + sx, ptY + 20 + Math.random()*2, 4, 4);
    } else if (animT < 0.8) {
        drawSprite(ctx, sprRef, ptX, ptY, 24, 24, false);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + ((animT - 0.5)*3.3) + ')';
        drawSprite(ctx, sprHero, ptX + 24, ptY, player.width, player.height, true);
    } else {
        drawSprite(ctx, sprRef, ptX, ptY - ((animT-0.8)*2 * 50), 24, 24, false); 
        drawSprite(ctx, sprHero, ptX + 24, ptY - ((animT-0.8)*2 * 50), player.width, player.height, true);
        drawGlow(ctx, ptX + 50, ptY - 80, 80, 'rgba(0, 255, 255, 0.8)');
        drawSprite(ctx, sprPortal, ptX, ptY - 100, 100, 100, false);
    }
}
