/**
 * MENU & UI SCREEN RENDERING
 * --------------------------
 * Handles non-gameplay states such as the main menu, intro sequence, 
 * and survive-guide (instructions). Uses high-level canvas drawing 
 * for text effects and static sprite displays.
 */

import { G, canvas, ctx, introText, player } from '../core/globals.js';
import { sprHero, sprHotdog, sprBot, sprGear, sprRef } from '../assets/assets.js';
import { drawSprite, drawKey } from './render_utils.js';

/**
 * Main Start Screen: Logo, High Scores, and "Press Enter" prompt.
 * Uses an offscreen canvas to cache the logo image for pixel-perfect scaling.
 */
export function renderStartScreen() {
    ctx.save();
    ctx.globalAlpha = 1.0; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Logo Caching Logic
    if (!window.logoImg) { window.logoImg = new Image(); window.logoImg.src = 'src/assets/images/logo.png'; }
    let logoImg = window.logoImg;
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        if (!window.logoOsc) {
            let nw = 160, ratio = logoImg.naturalWidth / logoImg.naturalHeight, nh = Math.round(160 / ratio);
            window.logoOsc = document.createElement('canvas'); window.logoOsc.width = nw; window.logoOsc.height = nh;
            const logoCtx = window.logoOsc.getContext('2d');
            if (logoCtx) logoCtx.drawImage(logoImg, 0, 0, nw, nh);
        }
        ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 0.35;
        const osc = window.logoOsc!;
        let scaleRatio = canvas.width / osc.width, displayH = osc.height * scaleRatio;
        ctx.drawImage(osc, 0, 0, osc.width, osc.height, 0, (canvas.height - displayH) / 2, canvas.width, displayH);
        ctx.globalAlpha = 1.0;
    }

    // Title Text
    ctx.fillStyle = '#f1c40f'; ctx.textAlign = 'center'; ctx.font = '25px "Press Start 2P", sans-serif'; 
    ctx.fillText("DON'T DIE", canvas.width / 2, canvas.height / 2 - 140);
    
    ctx.font = '15px "Press Start 2P", sans-serif'; 
    ctx.fillText("A GRFC™ GAME", canvas.width / 2, canvas.height / 2 - 110);
    
    // Blink Effect for Start Prompt
    if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText('PRESS ENTER TO START', canvas.width / 2, 540);
    
    // Leaderboard Display
    ctx.fillText('TOP 10 SURVIVORS', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '10px "Press Start 2P", sans-serif';
    for (let i = 0; i < G.highScores.length; i++) {
        let hs = G.highScores[i];
        let rankStr = (i + 1).toString().padStart(2, ' ');
        let nameStr = hs.name.padEnd(8, ' ');
        let scoreStr = hs.score.toString().padStart(7, ' ');
        ctx.fillText(`${rankStr}. ${nameStr} ... ${scoreStr}`, canvas.width / 2, canvas.height / 2 + (i * 15));
    }
    
    // Flavor Decorations (Flanking Sprites)
    let sbY = canvas.height / 2 + 15;
    let sprFlip = Math.floor(Date.now() / 600) % 2 === 0;
    
    // Left flank (Player & Hotdog)
    drawSprite(ctx, sprHero, canvas.width/2 - 200, sbY, 32, 40, sprFlip);
    drawSprite(ctx, sprHotdog, canvas.width/2 - 196, sbY + 70, 24, 24, !sprFlip);
    
    // Right flank (Enemy & Gear)
    drawSprite(ctx, sprBot, canvas.width/2 + 160, sbY, 38, 38, !sprFlip);
    
    ctx.save();
    ctx.translate(canvas.width/2 + 167 + 12, sbY + 70 + 12);
    ctx.scale(Math.cos(Date.now() / 150), 1); // 3D Retro Coin-style axle spin
    drawSprite(ctx, sprGear, -12, -12, 24, 24, false);
    ctx.restore();
    
    ctx.restore();
}

/**
 * Intro Crawl: Scrolling text backstory.
 * Implements word-wrapping and manual Y-positioning.
 */
export function renderIntroScreen() {
    ctx.save();
    ctx.globalAlpha = 1.0; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px "Press Start 2P", sans-serif'; ctx.fillStyle = '#f1c40f'; ctx.textAlign = 'center';
    
    let paragraphs = introText.split('\n'), yCursor = G.introY, lineHeight = 28, maxWidth = canvas.width - 120;
    for (let j = 0; j < paragraphs.length; j++) {
        let line = '', words = paragraphs[j].split(' ');
        for(let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            if (ctx.measureText(testLine).width > maxWidth && n > 0) { 
                ctx.fillText(line, canvas.width / 2, yCursor); 
                line = words[n] + ' '; 
                yCursor += lineHeight; 
            }
            else line = testLine;
        }
        ctx.fillText(line, canvas.width / 2, yCursor); yCursor += lineHeight * 2;
    }
    
    // Skip hint
    if (Math.floor(Date.now() / 500) % 2 === 0) { 
        ctx.fillStyle = '#ffffff'; 
        ctx.font = '10px "Press Start 2P", sans-serif'; 
        ctx.fillText('PRESS ENTER OR TOUCH TO SKIP', canvas.width / 2, canvas.height - 30); 
    }
    ctx.restore();
}

/**
 * Instructions Screen: Visual guide to controls and items.
 */
export function renderInstructions() {
    ctx.save();
    ctx.globalAlpha = 1.0; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '25px "Press Start 2P", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("HOW TO SURVIVE", canvas.width / 2, 80);
    
    // MOVEMENT GUIDES
    ctx.textAlign = 'center';
    ctx.font = '18px "Press Start 2P", sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText("MOVEMENT", 220, 140);
    
    // Draw WASD Keys
    drawKey(ctx, 110, 160, 36, 36, 'W');
    drawKey(ctx, 70, 200, 36, 36, 'A');
    drawKey(ctx, 110, 200, 36, 36, 'S');
    drawKey(ctx, 150, 200, 36, 36, 'D');

    ctx.fillStyle = 'white';
    ctx.font = '12px "Press Start 2P", sans-serif';
    ctx.fillText("OR", 220, 200);

    // Draw Arrow Keys
    drawKey(ctx, 290, 160, 36, 36, 'UP');
    drawKey(ctx, 250, 200, 36, 36, 'LEFT');
    drawKey(ctx, 290, 200, 36, 36, 'DOWN');
    drawKey(ctx, 330, 200, 36, 36, 'RIGHT');

    // ITEM LEGEND
    ctx.fillStyle = '#f1c40f';
    ctx.font = '18px "Press Start 2P", sans-serif';
    ctx.fillText("ITEMS", 600, 140);
    
    drawSprite(ctx, sprGear, 480, 160, 24, 24, false);
    ctx.fillStyle = 'white';
    ctx.font = '10px "Press Start 2P", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("GEAR: +1000 POINTS", 520, 178);

    drawSprite(ctx, sprHotdog, 480, 200, 24, 24, false);
    ctx.fillStyle = 'white';
    ctx.fillText("HOTDOG: +1 LIFE", 520, 218);

    let whistle = Math.floor(Date.now() / 400) % 2 === 0;
    drawSprite(ctx, sprRef, 480, 240, 24, 24, whistle);
    ctx.fillStyle = 'white';
    ctx.fillText("FUDGE: CHECKPOINT", 520, 258);

    // JUMP MECHANICS
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1c40f';
    ctx.font = '18px "Press Start 2P", sans-serif';
    ctx.fillText("JUMP", 220, 270);
    ctx.fillStyle = 'white';
    ctx.font = '12px "Press Start 2P", sans-serif';
    ctx.fillText("(TAP TWICE FOR DOUBLE JUMP)", 220, 290);
    drawKey(ctx, 220 - 120, 310, 240, 36, 'SPACEBAR');
    
    // LORE / GOAL
    ctx.fillStyle = '#ff2222';
    ctx.font = '18px "Press Start 2P", sans-serif';
    ctx.fillText("OBJECTIVE", canvas.width / 2, 400);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px "Press Start 2P", sans-serif';
    ctx.fillText("GET BACK IN TIME FOR THE SHOW.", canvas.width / 2, 440);
    ctx.fillText("STOMP SOME BOTS.", canvas.width / 2, 470);
    ctx.fillText("DON'T DIE...", canvas.width / 2, 500);

    // ACTION PROMPT
    ctx.font = '15px "Press Start 2P", sans-serif';
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillText('PRESS ENTER TO DROP IN', canvas.width / 2, 560);
    }
    ctx.restore();
}
