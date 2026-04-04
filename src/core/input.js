import { G, keys } from './globals.js?v=126';
import { initAudio, startBackgroundMusic } from '../assets/audio.js?v=126';
import { handleUIAccept } from './game.js?v=126';
import { processDownInput, handleJump } from './input_utils.js?v=126';
import { initTouchControls } from './input_touch.js?v=126';

window.addEventListener('keydown', (e) => {
    document.getElementById('touch-controls').style.display = 'none';
    if (!G.audioCtx) initAudio();
    if (G.gameState === 'START' && !G.isMusicPlaying) startBackgroundMusic();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.ArrowRight = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.ArrowUp = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') processDownInput(null);
    if (e.code === 'Space') { if (!G.spacePressed) { handleJump(); G.spacePressed = true; } }
    if (G.gameState === 'ENTER_INITIALS') {
        if (e.code === 'ArrowLeft') G.initialIndex = Math.max(0, G.initialIndex - 1);
        if (e.code === 'ArrowRight') G.initialIndex = Math.min(2, G.initialIndex + 1);
        if (e.code === 'ArrowUp') { let code = G.initials[G.initialIndex].charCodeAt(0)+1; if(code>90)code=65; G.initials[G.initialIndex]=String.fromCharCode(code); }
        if (e.code === 'ArrowDown') { let code = G.initials[G.initialIndex].charCodeAt(0)-1; if(code<65)code=90; G.initials[G.initialIndex]=String.fromCharCode(code); }
        if (e.code === 'Enter') handleUIAccept();
    } else if (G.gameState === 'START' || G.gameState === 'INTRO' || G.gameState === 'GAMEOVER' || G.gameState === 'WIN' || G.gameState === 'INSTRUCTIONS' || G.gameState === 'CREDITS') {
        if (e.code === 'Enter') handleUIAccept();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.ArrowRight = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.ArrowUp = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.ArrowDown = false;
    if (e.code === 'Space') G.spacePressed = false;
});

initTouchControls();
