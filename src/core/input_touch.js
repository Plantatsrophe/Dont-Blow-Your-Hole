import { G, player, keys } from './globals.js?v=127';
import { initAudio, startBackgroundMusic } from '../assets/audio.js?v=127';
import { handleUIAccept } from './game.js?v=127';
import { processDownInput, handleJump } from './input_utils.js?v=127';

let isTouchMode = false;

function handleTouch(e) {
    if (isTouchMode && !e.touches) return;
    keys.ArrowLeft = false; keys.ArrowRight = false; keys.ArrowUp = false; keys.ArrowDown = false;
    let currentlyPressingSpace = false;
    document.getElementById('btn-left').classList.remove('active');
    document.getElementById('btn-right').classList.remove('active');
    document.getElementById('btn-up').classList.remove('active');
    document.getElementById('btn-down').classList.remove('active');
    document.getElementById('btn-jump').classList.remove('active');

    if (e.touches) {
        for (let i = 0; i < e.touches.length; i++) {
            let touch = e.touches[i];
            let el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!el) continue;
            if (el.id === 'btn-left') { keys.ArrowLeft = true; el.classList.add('active'); }
            else if (el.id === 'btn-right') { keys.ArrowRight = true; el.classList.add('active'); }
            else if (el.id === 'btn-up') { keys.ArrowUp = true; el.classList.add('active'); }
            else if (el.id === 'btn-down') { processDownInput(el); }
            else if (el.id === 'btn-jump') { currentlyPressingSpace = true; el.classList.add('active'); }
        }
    } else if (e.clientX !== undefined) {
        if (e.buttons > 0 || e.type === 'mousedown') {
            let el = document.elementFromPoint(e.clientX, e.clientY);
            if (el) {
                if (el.id === 'btn-left') { keys.ArrowLeft = true; el.classList.add('active'); }
                else if (el.id === 'btn-right') { keys.ArrowRight = true; el.classList.add('active'); }
                else if (el.id === 'btn-up') { keys.ArrowUp = true; el.classList.add('active'); }
                else if (el.id === 'btn-down') { processDownInput(el); }
                else if (el.id === 'btn-jump') { currentlyPressingSpace = true; el.classList.add('active'); }
            }
        }
    }
    if (currentlyPressingSpace) {
        if (!G.spacePressed) { handleJump(); G.spacePressed = true; }
    } else { G.spacePressed = false; }
}

function executeTouchStart(e) {
    if (e.type === 'touchstart') e.preventDefault();
    if (!isTouchMode) {
        isTouchMode = true;
        document.getElementById('touch-controls').style.display = 'flex';
        if (document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen().catch(() => { }); }
    }
    if (!G.audioCtx) initAudio();
    if (G.gameState === 'START' && !G.isMusicPlaying) startBackgroundMusic();
    if (G.gameState === 'WIN' || G.gameState === 'GAMEOVER' || G.gameState === 'ENTER_INITIALS') {
        let cX = e.touches ? e.touches[0].clientX : e.clientX, cY = e.touches ? e.touches[0].clientY : e.clientY;
        let canvas = document.getElementById('gameCanvas'), rect = canvas.getBoundingClientRect();
        let cx = (cX - rect.left) * (canvas.width / rect.width), cy = (cY - rect.top) * (canvas.height / rect.height);
        if (cx >= canvas.width / 2 - 120 && cx <= canvas.width / 2 + 120 && cy >= canvas.height - 80 && cy <= canvas.height - 40) {
            try {
                let dataUrl = canvas.toDataURL('image/png'), a = document.createElement('a');
                a.href = dataUrl; a.download = 'highscore_' + player.score + '.png'; a.style.display = 'none';
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                setTimeout(() => alert('Highscore Screenshot Saved!'), 100);
            } catch (e) { console.error("Clipboard export failed", e); }
            return;
        }
    }
    if (G.gameState === 'WIN' || G.gameState === 'GAMEOVER' || G.gameState === 'START' || G.gameState === 'INTRO' || G.gameState === 'INSTRUCTIONS' || G.gameState === 'ENTER_INITIALS' || G.gameState === 'CREDITS') {
        handleUIAccept(); return;
    }
    handleTouch(e);
}

export function initTouchControls() {
    document.addEventListener('touchstart', executeTouchStart, { passive: false });
    document.addEventListener('mousedown', executeTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouch, { passive: false });
    document.addEventListener('mousemove', handleTouch, { passive: false });
    document.addEventListener('touchend', handleTouch, { passive: false });
    document.addEventListener('touchcancel', handleTouch, { passive: false });
    document.addEventListener('mouseup', handleTouch, { passive: false });
}
