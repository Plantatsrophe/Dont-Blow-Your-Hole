import { G } from '../core/globals.js?v=126';

export { startBackgroundMusic, stopBackgroundMusic } from './audio_music.js?v=126';
export { playSound } from './audio_sfx.js?v=126';

export function initAudio() {
    if (!G.audioCtx) {
        let AC = window.AudioContext || window.webkitAudioContext;
        if (AC) G.audioCtx = new AC();
    }
}
