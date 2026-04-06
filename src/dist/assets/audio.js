/**
 * AUDIO ENGINE CONTROLLER
 * -----------------------
 * Main orchestrator for the Web Audio API.
 * Manages the global AudioContext and coordinates music vs sound-effect triggering.
 */
import { G } from '../core/globals.js';
export { startBackgroundMusic, stopBackgroundMusic } from './audio_music.js';
export { playSound } from './audio_sfx.js';
/**
 * Initializes the global Web Audio context.
 * Must be triggered by a user interaction (click/keydown) to comply with browser autoplay policies.
 */
export function initAudio() {
    if (!G.audioCtx) {
        let AC = window.AudioContext || window.webkitAudioContext;
        if (AC)
            G.audioCtx = new AC();
    }
}
