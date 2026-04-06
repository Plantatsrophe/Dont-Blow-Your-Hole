import { G, player, keys } from './globals.js';
import { playSound } from '../assets/audio.js';
/**
 * Timestamp of the last 'Down' input press.
 * Used to detect double-tap gestures for dropping through one-way platforms.
 */
let lastDownPressTime = 0;
/**
 * Processes a 'Down' input event.
 * If the user double-taps 'Down' within 300ms, it sets the 'droppingThrough'
 * flag which allows the physics engine to ignore one-way floor collisions for a brief window.
 *
 * @param el Optional UI element to highlight (useful for touch controls)
 */
export function processDownInput(el) {
    if (!keys.ArrowDown) {
        let now = Date.now();
        // Check for double-tap within 300ms window
        if (now - lastDownPressTime < 300) {
            player.droppingThrough = true;
            // Reset flag after 200ms to avoid falling through multiple floors indefinitely
            setTimeout(() => { player.droppingThrough = false; }, 200);
        }
        lastDownPressTime = now;
    }
    keys.ArrowDown = true;
    if (el)
        el.classList.add('active');
}
/**
 * Central jump logic used by keyboard, touch, and bot stomp events.
 * Manages the transition between grounded, climbing, and double-jump states.
 */
export function handleJump() {
    if (G.gameState !== 'PLAYING')
        return;
    // Normal Jump (Grounded or Climbing)
    if (player.isOnGround || player.isClimbing) {
        player.riding = null; // Instantly detach from any moving platform
        player.vy = player.jumpPower;
        player.isOnGround = false;
        player.isClimbing = false;
        player.doubleJump = true; // Empower the second jump
        playSound('jump');
    }
    // Mid-air Double Jump
    else if (player.doubleJump) {
        player.riding = null;
        player.vy = player.jumpPower * 0.9; // Second jump is slightly less powerful (90%)
        player.doubleJump = false;
        playSound('jump');
    }
}
