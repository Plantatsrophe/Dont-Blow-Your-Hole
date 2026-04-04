import { G, player, canvas, ctx } from '../core/globals.js?v=126';

export function renderHUD() {
    ctx.fillStyle = 'white'; ctx.font = '14px "Press Start 2P"'; ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + player.score, 20, 30); ctx.fillText('LEVEL: ' + (G.currentLevel + 1), 250, 30);
    ctx.fillText('TIME: ' + G.timer, 450, 30); ctx.fillText('LIVES: ' + player.lives, 650, 30);
    if (G.boss && G.boss.active && G.boss.hp > 0 && G.gameState !== 'CREDITS_CUTSCENE' && G.gameState !== 'CREDITS') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(canvas.width/2 - 200, canvas.height - 40, 400, 20);
        ctx.fillStyle = 'red'; ctx.fillRect(canvas.width/2 - 198, canvas.height - 38, Math.max(0, (G.boss.hp / G.boss.maxHp)) * 396, 16);
        ctx.fillStyle = 'white'; ctx.font = '10px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillText(G.boss.type.toUpperCase(), canvas.width/2, canvas.height - 25);
    }
}

export function renderOverlays() {
    const { gameState, initials, initialIndex } = G;
    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red'; ctx.font = '30px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = 'white'; ctx.font = '15px "Press Start 2P"'; ctx.fillText('PRESS ENTER TO CONTINUE', canvas.width / 2, canvas.height / 2 + 40);
    } else if (gameState === 'WIN') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00'; ctx.font = '30px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillText('LEVEL ' + (G.currentLevel + 1) + ' CLEARED!', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = 'white'; ctx.font = '15px "Press Start 2P"'; ctx.fillText('TIME BONUS: ' + (G.timer * 100), canvas.width / 2, canvas.height / 2 + 35);
        ctx.fillText('FINAL SCORE: ' + player.score, canvas.width / 2, canvas.height / 2 + 70); ctx.fillText('PRESS ENTER TO CONTINUE', canvas.width / 2, canvas.height / 2 + 110);
    } else if (gameState === 'ENTER_INITIALS') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f1c40f'; ctx.font = '20px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillText('NEW HIGH SCORE!', canvas.width/2, 100);
        ctx.fillStyle = 'white'; ctx.fillText('SCORE: ' + player.score, canvas.width/2, 150);
        ctx.font = '40px "Press Start 2P"';
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = (i === initialIndex) ? '#ff2222' : '#fff';
            ctx.fillText(initials[i], canvas.width/2 - 60 + (i * 60), 250);
            if (i === initialIndex) ctx.fillRect(canvas.width/2 - 80 + (i * 60), 260, 40, 5); 
        }
        ctx.font = '15px "Press Start 2P"'; ctx.fillStyle = '#fff'; ctx.fillText('USE ARROWS. PRESS ENTER TO SAVE', canvas.width/2, 350);
    }
}

export function renderCredits() {
    if (G.gameState !== 'CREDITS') return;
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f1c40f'; ctx.font = '30px "Press Start 2P"'; ctx.textAlign = 'center';
    let cY = canvas.height - (player.cutsceneTimer - 4.0) * 50;
    ctx.fillText("CREDITS", canvas.width/2, cY); ctx.fillStyle = '#b75c32'; ctx.font = '15px "Press Start 2P"'; ctx.fillText("CREATED BY:", canvas.width/2, cY + 100);
    ctx.fillStyle = 'white'; ctx.font = '20px "Press Start 2P"'; ctx.fillText("BARRY THE RING DADDY", canvas.width/2, cY + 140);
    ctx.fillStyle = '#b75c32'; ctx.fillText("SCRIPT WRITTEN BY:", canvas.width/2, cY + 240);
    ctx.fillStyle = 'white'; ctx.fillText("HOTDOG THE HISTORIAN", canvas.width/2, cY + 280);
    ctx.fillStyle = '#f1c40f'; ctx.fillText("THANK YOU FOR PLAYING!", canvas.width/2, cY + 650);
}

export function renderShareButton() {
    const { gameState } = G;
    if (gameState === 'GAMEOVER' || gameState === 'WIN' || gameState === 'ENTER_INITIALS') {
        ctx.fillStyle = '#b75c32'; ctx.fillRect(canvas.width / 2 - 120, canvas.height - 80, 240, 40);
        ctx.fillStyle = 'white'; ctx.font = '12px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillText('[ SAVE HIGHSCORE! ]', canvas.width / 2, canvas.height - 55);
    }
}
