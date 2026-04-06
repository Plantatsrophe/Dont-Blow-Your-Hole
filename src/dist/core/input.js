import { G, keys } from './globals.js';
import { initAudio, startBackgroundMusic } from '../assets/audio.js';
import { handleUIAccept } from './game.js';
import { processDownInput, handleJump } from './input_utils.js';
import { initTouchControls } from './input_touch.js';
/**
 * Global application Keyboard Listener - Keydown
 * Captures user input directly from the browser window.
 * Translates specific KeyCodes into abstract boolean keys used by the game ticker,
 * overriding touch-control layouts if actual hardware inputs are detected.
 */
window.addEventListener('keydown', (e) => {
    // If user types on a physical keyboard, instantly hide any virtual mobile joysticks
    const tc = document.getElementById('touch-controls');
    if (tc)
        tc.style.display = 'none';
    // Lazy-load the intricate browser AudioContext explicitly upon first user interaction
    // to bypass typical Chrome/Firefox auto-play security blockades.
    if (!G.audioCtx)
        initAudio();
    if (G.gameState === 'START' && !G.isMusicPlaying)
        startBackgroundMusic();
    // Standard WASD + Arrow Keys unified into abstract intents
    if (e.code === 'ArrowLeft' || e.code === 'KeyA')
        keys.ArrowLeft = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD')
        keys.ArrowRight = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW')
        keys.ArrowUp = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS')
        processDownInput(null);
    // Hard-cap the jump mechanics to only trigger once per physical "press", avoiding auto-bouncing
    if (e.code === 'Space') {
        if (!G.spacePressed) {
            handleJump();
            G.spacePressed = true;
        }
    }
    // UI Navigation routing
    if (G.gameState === 'ENTER_INITIALS') {
        if (e.code === 'ArrowLeft')
            G.initialIndex = Math.max(0, G.initialIndex - 1);
        if (e.code === 'ArrowRight')
            G.initialIndex = Math.min(2, G.initialIndex + 1);
        if (e.code === 'ArrowUp') {
            let code = G.initials[G.initialIndex].charCodeAt(0) + 1;
            if (code > 90)
                code = 65;
            G.initials[G.initialIndex] = String.fromCharCode(code);
        }
        if (e.code === 'ArrowDown') {
            let code = G.initials[G.initialIndex].charCodeAt(0) - 1;
            if (code < 65)
                code = 90;
            G.initials[G.initialIndex] = String.fromCharCode(code);
        }
        if (e.code === 'Enter')
            handleUIAccept();
    }
    else if (['START', 'INTRO', 'GAMEOVER', 'WIN', 'INSTRUCTIONS', 'CREDITS'].includes(G.gameState)) {
        if (e.code === 'Enter')
            handleUIAccept();
    }
});
/**
 * Global application Keyboard Listener - Keyup
 * Deactivates standard boolean input states when hardware keys are released.
 */
window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA')
        keys.ArrowLeft = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD')
        keys.ArrowRight = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW')
        keys.ArrowUp = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS')
        keys.ArrowDown = false;
    if (e.code === 'Space')
        G.spacePressed = false;
});
// Boot the virtual joystick system dynamically if the browser supports mobile touch APIs
initTouchControls();
