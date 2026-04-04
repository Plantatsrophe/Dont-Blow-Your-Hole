import { G, player, keys, canvas } from './globals.js';
import { initAudio, startBackgroundMusic, playSound } from '../assets/audio.js';
import { parseMap, resetPlayerPosition, resetFullGame } from '../logic/spawner.js';
import { handleUIAccept } from './game.js';


let lastDownPressTime = 0;

function processDownInput(el) {
    if (!keys.ArrowDown) {
        let now = Date.now();
        if (now - lastDownPressTime < 300) { player.droppingThrough = true; setTimeout(() => { player.droppingThrough = false; }, 200); }
        lastDownPressTime = now;
    }
    keys.ArrowDown = true;
    if (el) el.classList.add('active');
}

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

// --- TOUCH CONTROLS ---
let isTouchMode = false;

function executeTouchStart(e) {
    if (e.type === 'touchstart') e.preventDefault();
    if (!isTouchMode) {
        isTouchMode = true;
        document.getElementById('touch-controls').style.display = 'flex';
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => { });
        }
    }

    if (!G.audioCtx) initAudio();
    if (G.gameState === 'START' && !G.isMusicPlaying) startBackgroundMusic();
    if (G.gameState === 'WIN' || G.gameState === 'GAMEOVER' || G.gameState === 'ENTER_INITIALS') {
        let cX = e.touches ? e.touches[0].clientX : e.clientX;
        let cY = e.touches ? e.touches[0].clientY : e.clientY;
        let canvas = document.getElementById('gameCanvas');
        let rect = canvas.getBoundingClientRect();
        let cx = (cX - rect.left) * (canvas.width / rect.width);
        let cy = (cY - rect.top) * (canvas.height / rect.height);
        
        if (cx >= canvas.width / 2 - 120 && cx <= canvas.width / 2 + 120 && cy >= canvas.height - 80 && cy <= canvas.height - 40) {
            try {
                let dataUrl = canvas.toDataURL('image/png');
                let a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'highscore_' + player.score + '.png';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Fallback alert natively seamlessly!
                setTimeout(() => alert('Highscore Screenshot Saved!'), 100);
            } catch (e) {
                console.error("Clipboard export failed", e);
            }
            return; // Explicitly halt state transition organically
        }
    }

    if (G.gameState === 'WIN' || G.gameState === 'GAMEOVER' || G.gameState === 'START' || G.gameState === 'INTRO' || G.gameState === 'INSTRUCTIONS' || G.gameState === 'ENTER_INITIALS' || G.gameState === 'CREDITS') {
        handleUIAccept();
        return;
    }

    handleTouch(e);
}

document.addEventListener('touchstart', executeTouchStart, { passive: false });
document.addEventListener('mousedown', executeTouchStart, { passive: false });

document.addEventListener('touchmove', handleTouch, { passive: false });
document.addEventListener('mousemove', handleTouch, { passive: false });
document.addEventListener('touchend', handleTouch, { passive: false });
document.addEventListener('touchcancel', handleTouch, { passive: false });
document.addEventListener('mouseup', handleTouch, { passive: false });

function handleTouch(e) {
    // Securely bypass and ignore legacy synthesized MouseEvents natively on mobile devices to prevent key resets!
    if (isTouchMode && !e.touches) return;

    // Reset inputs structurally iterating all active touches elegantly
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
    keys.ArrowDown = false;
    let currentlyPressingSpace = false;

    document.getElementById('btn-left').classList.remove('active');
    document.getElementById('btn-right').classList.remove('active');
    document.getElementById('btn-up').classList.remove('active');
    document.getElementById('btn-down').classList.remove('active');
    document.getElementById('btn-jump').classList.remove('active');

    // Handle Native Multi-touch inputs structurally
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
    } 
    // Handle fallback generic Desktop Mouse Tracking seamlessly!
    else if (e.clientX !== undefined) {
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

function handleJump() {
    if (G.gameState !== 'PLAYING') return;
    if (player.isOnGround || player.isClimbing) {
        player.riding = null; // Explicitly detach before jump processing
        player.vy = player.jumpPower; 
        player.isOnGround = false; 
        player.isClimbing = false; 
        player.doubleJump = true; 
        playSound('jump'); 
    }
    else if (player.doubleJump) { 
        player.riding = null; // Detach on double jump as well
        player.vy = player.jumpPower * 0.9; 
        player.doubleJump = false; 
        playSound('jump'); 
    }
}
