import { G, player, keys } from './globals.js';
import { initAudio, startBackgroundMusic } from '../assets/audio.js';
import { handleUIAccept } from './game.js';
import { processDownInput, handleJump } from './input_utils.js';
/**
 * Flag indicating if the user has interacted via a touch-capable device.
 * Once true, the virtual on-screen controls are rendered and maintained.
 */
let isTouchMode = false;
/**
 * Universal touch/mouse event handler for the virtual joystick.
 * Maps coordinates to specific DOM elements representing buttons (Left, Right, Jump, etc.)
 * and updates the global 'keys' state accordingly.
 *
 * @param e The TouchEvent or MouseEvent to process
 */
function handleTouch(e) {
    // If in touch mode, ignore mouse events to prevent double-input jitter
    if (isTouchMode && !e.touches)
        return;
    // Reset all intent states before recalculating based on current active points
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
    keys.ArrowDown = false;
    let currentlyPressingSpace = false;
    // Clear visual "pushed" states from the UI
    document.getElementById('btn-left')?.classList.remove('active');
    document.getElementById('btn-right')?.classList.remove('active');
    document.getElementById('btn-up')?.classList.remove('active');
    document.getElementById('btn-down')?.classList.remove('active');
    document.getElementById('btn-jump')?.classList.remove('active');
    if (e.touches) {
        // Multi-touch support: Iterate through every finger currently on the screen
        for (let i = 0; i < e.touches.length; i++) {
            let touch = e.touches[i];
            let el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!el)
                continue;
            // Map the element under the finger to a game command
            if (el.id === 'btn-left') {
                keys.ArrowLeft = true;
                el.classList.add('active');
            }
            else if (el.id === 'btn-right') {
                keys.ArrowRight = true;
                el.classList.add('active');
            }
            else if (el.id === 'btn-up') {
                keys.ArrowUp = true;
                el.classList.add('active');
            }
            else if (el.id === 'btn-down') {
                processDownInput(el);
            }
            else if (el.id === 'btn-jump') {
                currentlyPressingSpace = true;
                el.classList.add('active');
            }
        }
    }
    else if (e.clientX !== undefined) {
        // Fallback for mouse-emulated touch or direct clicks on joystick buttons
        if (e.buttons > 0 || e.type === 'mousedown') {
            let el = document.elementFromPoint(e.clientX, e.clientY);
            if (el) {
                if (el.id === 'btn-left') {
                    keys.ArrowLeft = true;
                    el.classList.add('active');
                }
                else if (el.id === 'btn-right') {
                    keys.ArrowRight = true;
                    el.classList.add('active');
                }
                else if (el.id === 'btn-up') {
                    keys.ArrowUp = true;
                    el.classList.add('active');
                }
                else if (el.id === 'btn-down') {
                    processDownInput(el);
                }
                else if (el.id === 'btn-jump') {
                    currentlyPressingSpace = true;
                    el.classList.add('active');
                }
            }
        }
    }
    // Process jump with 'press-once' logic to mirror physical spacebar behavior
    if (currentlyPressingSpace) {
        if (!G.spacePressed) {
            handleJump();
            G.spacePressed = true;
        }
    }
    else {
        G.spacePressed = false;
    }
}
/**
 * Initial entry point for any screen tap/click.
 * Enables touch mode, activates audio, and handles UI navigation logic
 * for non-gameplay screens (Intro, Win, Game Over).
 */
function executeTouchStart(e) {
    if (e.type === 'touchstart')
        e.preventDefault(); // Prevent accidental double-taps zooming the page
    // Switch to touch mode UI if first interaction is a touch
    if (!isTouchMode) {
        isTouchMode = true;
        const tc = document.getElementById('touch-controls');
        if (tc)
            tc.style.display = 'flex';
        // Attempt to enter fullscreen for an immersive mobile experience
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => { });
        }
    }
    // Standard audio initialization block
    if (!G.audioCtx)
        initAudio();
    if (G.gameState === 'START' && !G.isMusicPlaying)
        startBackgroundMusic();
    // --- UI SCREEN NAVIGATION ---
    // High Score Screenshot Logic:
    // If the user taps a specific region on the Win/GameOver screens, capture the canvas
    // and trigger a PNG download for bragging rights.
    if (['WIN', 'GAMEOVER', 'ENTER_INITIALS'].includes(G.gameState)) {
        let cX = e.touches ? e.touches[0].clientX : e.clientX, cY = e.touches ? e.touches[0].clientY : e.clientY;
        let canvas = document.getElementById('gameCanvas');
        if (canvas) {
            let rect = canvas.getBoundingClientRect();
            let cx = (cX - rect.left) * (canvas.width / rect.width);
            let cy = (cY - rect.top) * (canvas.height / rect.height);
            // Check if coordinates correspond to the "Save Highscore" UI button
            if (cx >= canvas.width / 2 - 120 && cx <= canvas.width / 2 + 120 && cy >= canvas.height - 80 && cy <= canvas.height - 40) {
                try {
                    let dataUrl = canvas.toDataURL('image/png'), a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = 'highscore_' + player.score + '.png';
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => alert('Highscore Screenshot Saved!'), 100);
                }
                catch (e) {
                    console.error("Clipboard export failed", e);
                }
                return;
            }
        }
    }
    // Advance simple UI screens on any tap
    if (['WIN', 'GAMEOVER', 'START', 'INTRO', 'INSTRUCTIONS', 'ENTER_INITIALS', 'CREDITS'].includes(G.gameState)) {
        handleUIAccept();
        return;
    }
    // If in gameplay, delegate to the joypad handler
    handleTouch(e);
}
/**
 * Attaches global listeners to the document to capture touch interactions
 * before they can be consumed by browser defaults (scrolling/zooming).
 */
export function initTouchControls() {
    document.addEventListener('touchstart', executeTouchStart, { passive: false });
    document.addEventListener('mousedown', executeTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouch, { passive: false });
    document.addEventListener('mousemove', handleTouch, { passive: false });
    document.addEventListener('touchend', handleTouch, { passive: false });
    document.addEventListener('touchcancel', handleTouch, { passive: false });
    document.addEventListener('mouseup', handleTouch, { passive: false });
}
