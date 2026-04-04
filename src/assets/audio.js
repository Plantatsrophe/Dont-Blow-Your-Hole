import { G } from '../core/globals.js?v=127';

export { startBackgroundMusic, stopBackgroundMusic } from './audio_music.js?v=127';
export { playSound } from './audio_sfx.js?v=127';

export function initAudio() {
    if (!G.audioCtx) {
        let AC = window.AudioContext || window.webkitAudioContext;
        if (AC) G.audioCtx = new AC();
    }
}
