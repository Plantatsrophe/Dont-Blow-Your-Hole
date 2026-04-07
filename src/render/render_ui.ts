/**
 * UI & HUD RENDERING ENGINE
 * -------------------------
 * Handles all screen-space overlays that remain static relative to the camera.
 * This includes the HUD (Score/HP), Game Over/Win screens, score-entry 
 * menus, and the final credits sequence.
 */

import { G, player, canvas, ctx } from '../core/globals.js';

/**
 * Renders the persistent Heads-Up Display (Score, Level, Time, Lives).
 * Also displays the dynamic boss health bar during active boss encounters.
 */
export function renderHUD() {
    ctx.save();
    
    // 1. Hybrid HUD Background Band
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, 40);
    
    // 2. Hybrid Outlined Text Style
    ctx.font = '14px "Press Start 2P"'; 
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'white';
    
    const stats = [
        { label: 'SCORE: ' + player.score, x: 20 },
        { label: 'LEVEL: ' + (G.currentLevel + 1), x: 250 },
        { label: 'TIME: ' + G.timer, x: 450 },
        { label: 'LIVES: ' + player.lives, x: 650 }
    ];

    stats.forEach(s => {
        ctx.strokeText(s.label, s.x, 12);
        ctx.fillText(s.label, s.x, 12);
    });
    
    // Boss Health Bar: Rendered at the bottom center when a boss is active.
    if (G.boss && G.boss.active && G.boss.hp > 0 && G.gameState !== 'CREDITS_CUTSCENE' && G.gameState !== 'CREDITS') {
        const maxHp = G.boss.maxHp || 10;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(canvas.width/2 - 200, canvas.height - 40, 400, 20);
        ctx.fillStyle = 'red'; 
        ctx.fillRect(canvas.width/2 - 198, canvas.height - 38, Math.max(0, (G.boss.hp / maxHp)) * 396, 16);
        
        ctx.font = '10px "Press Start 2P"'; 
        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'middle'; // Reset for boss bar center
        const bossName = G.boss.type.toUpperCase();

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(bossName, canvas.width/2, canvas.height - 29);
        ctx.fillStyle = 'white';
        ctx.fillText(bossName, canvas.width/2, canvas.height - 29);
    }
    
    ctx.restore(); // Critical Reset
}

/**
 * Handles full-screen state overlays for Game Over, Win, and Initial Entry.
 */
export function renderOverlays() {
    const { gameState, initials, initialIndex } = G;

    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red'; ctx.font = '30px "Press Start 2P"'; ctx.textAlign = 'center'; 
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = 'white'; ctx.font = '15px "Press Start 2P"'; 
        ctx.fillText('PRESS ENTER TO CONTINUE', canvas.width / 2, canvas.height / 2 + 40);
    } else if (gameState === 'WIN') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00'; ctx.font = '30px "Press Start 2P"'; ctx.textAlign = 'center'; 
        ctx.fillText('LEVEL ' + (G.currentLevel + 1) + ' CLEARED!', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = 'white'; ctx.font = '15px "Press Start 2P"'; 
        ctx.fillText('TIME BONUS: ' + (G.timer * 100), canvas.width / 2, canvas.height / 2 + 35);
        ctx.fillText('FINAL SCORE: ' + player.score, canvas.width / 2, canvas.height / 2 + 70); 
        ctx.fillText('PRESS ENTER TO CONTINUE', canvas.width / 2, canvas.height / 2 + 110);
    } else if (gameState === 'ENTER_INITIALS') {
        // High Score Entry Menu
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f1c40f'; ctx.font = '20px "Press Start 2P"'; ctx.textAlign = 'center'; 
        ctx.fillText('NEW HIGH SCORE!', canvas.width/2, 100);
        ctx.fillStyle = 'white'; ctx.fillText('SCORE: ' + player.score, canvas.width/2, 150);
        
        ctx.font = '40px "Press Start 2P"';
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = (i === initialIndex) ? '#ff2222' : '#fff'; // Highlight active slot
            ctx.fillText(initials[i], canvas.width/2 - 60 + (i * 60), 250);
            if (i === initialIndex) ctx.fillRect(canvas.width/2 - 80 + (i * 60), 260, 40, 5); 
        }
        ctx.font = '15px "Press Start 2P"'; ctx.fillStyle = '#fff'; 
        ctx.fillText('USE ARROWS. PRESS ENTER TO SAVE', canvas.width/2, 350);
    }
}

/**
 * Renders the scrolling credits upward from the bottom of the screen.
 */
export function renderCredits() {
    if (G.gameState !== 'CREDITS') return;
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f1c40f'; ctx.font = '30px "Press Start 2P"'; ctx.textAlign = 'center';
    
    // Y-Offset calculation based on the shared cutscene timer
    const timer = player.cutsceneTimer || 0;
    let cY = canvas.height - (timer - 4.0) * 50;
    
    ctx.fillText("CREDITS", canvas.width/2, cY); 
    ctx.fillStyle = '#b75c32'; ctx.font = '15px "Press Start 2P"'; ctx.fillText("CREATED BY:", canvas.width/2, cY + 100);
    ctx.fillStyle = 'white'; ctx.font = '20px "Press Start 2P"'; ctx.fillText("BARRY THE RING DADDY", canvas.width/2, cY + 140);
    ctx.fillStyle = '#b75c32'; ctx.fillText("SCRIPT WRITTEN BY:", canvas.width/2, cY + 240);
    ctx.fillStyle = 'white'; ctx.fillText("HOTDOG THE HISTORIAN", canvas.width/2, cY + 280);
    ctx.fillStyle = '#f1c40f'; ctx.fillText("THANK YOU FOR PLAYING!", canvas.width/2, cY + 650);
}

/**
 * Draws the social/save button prompt on end-game screens.
 */
export function renderShareButton() {
    const { gameState } = G;
    if (gameState === 'GAMEOVER' || gameState === 'WIN' || gameState === 'ENTER_INITIALS') {
        ctx.fillStyle = '#b75c32'; ctx.fillRect(canvas.width / 2 - 120, canvas.height - 80, 240, 40);
        ctx.fillStyle = 'white'; ctx.font = '12px "Press Start 2P"'; ctx.textAlign = 'center'; 
        ctx.fillText('[ SAVE HIGHSCORE! ]', canvas.width / 2, canvas.height - 55);
    }
}

