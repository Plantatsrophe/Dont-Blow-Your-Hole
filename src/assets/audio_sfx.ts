/**
 * PROCEDURAL SFX ENGINE
 * ---------------------
 * Generates all game sound effects using FM synthesis and white-noise buffers.
 * This avoids the need for external asset loading and ensures zero-latency playback.
 */

import { G } from '../core/globals.js';

/**
 * Triggers a specific sound effect using the Web Audio API. 
 * Orchestrates oscillators, gain envelopes, and biquad filters.
 */
export function playSound(type: 'jump' | 'stomp' | 'collect' | 'die' | 'gameOver' | 'win' | 'playerMove' | 'powerup' | 'enemyMove' | 'laser' | 'shoot' | 'explosion') {
    if (!G.audioCtx) return;
    
    // Shared Audio Node setup
    const t = G.audioCtx.currentTime;
    const osc = G.audioCtx.createOscillator();
    const gain = G.audioCtx.createGain();
    osc.connect(gain); gain.connect(G.audioCtx.destination);
    
    if (type === 'jump') {
        // Classic rising square-wave chirp
        osc.type = 'square'; osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
        gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'stomp') {
        // Impact "donk" sound
        osc.type = 'square'; osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'collect') {
        // Arpeggiated "ding"
        osc.type = 'square'; osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1200, t + 0.05);
        gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'die') {
        // Descending sawtooth tragedy
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.8);
        gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
        osc.start(t); osc.stop(t + 0.8);
    } else if (type === 'gameOver') {
        // Low discordance with two oscillators
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 2.0);
        const osc2 = G.audioCtx.createOscillator(); osc2.type = 'square';
        osc2.frequency.setValueAtTime(215, t); osc2.frequency.exponentialRampToValueAtTime(35, t + 2.0);
        osc2.connect(gain); osc2.start(t); osc2.stop(t + 2.0);
        gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
        osc.start(t); osc.stop(t + 2.0);
    } else if (type === 'win') {
        // Major scale arpeggio
        osc.type = 'square'; osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, t + 0.3); // C6
        osc.frequency.setValueAtTime(1318.51, t + 0.45); // E6
        osc.frequency.setValueAtTime(1567.98, t + 0.6); // G6
        const oscChime = G.audioCtx.createOscillator(); oscChime.type = 'triangle';
        oscChime.frequency.setValueAtTime(1046.50, t); oscChime.frequency.setValueAtTime(1318.51, t + 0.1);
        oscChime.frequency.setValueAtTime(1567.98, t + 0.2); oscChime.frequency.setValueAtTime(2093.00, t + 0.3);
        oscChime.frequency.setValueAtTime(2637.02, t + 0.45); oscChime.frequency.setValueAtTime(3135.96, t + 0.6);
        oscChime.connect(gain); oscChime.start(t); oscChime.stop(t + 1.2);
        gain.gain.setValueAtTime(0.08, t); gain.gain.setValueAtTime(0.08, t + 0.6); gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc.start(t); osc.stop(t + 1.2);
    } else if (type === 'playerMove') {
        // Soft thud for movement feedback
        osc.type = 'triangle'; osc.frequency.setValueAtTime(200, t);
        gain.gain.setValueAtTime(0.02, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
        osc.start(t); osc.stop(t + 0.02);
    } else if (type === 'powerup') {
        // Sci-fi rising sweep
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
        gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        let osc2 = G.audioCtx.createOscillator(); let gain2 = G.audioCtx.createGain();
        osc2.connect(gain2); gain2.connect(G.audioCtx.destination);
        osc2.type = 'sawtooth'; osc2.frequency.setValueAtTime(700, t + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(100, t + 0.3);
        gain2.gain.setValueAtTime(0.15, t + 0.15); gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.start(t); osc.stop(t + 0.15); osc2.start(t + 0.15); osc2.stop(t + 0.3);
    } else if (type === 'enemyMove') {
        // High-pass filtered noise (robotic hiss)
        const bS = G.audioCtx.sampleRate * 0.04, buf = G.audioCtx.createBuffer(1, bS, G.audioCtx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < bS; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
        const n = G.audioCtx.createBufferSource(); n.buffer = buf;
        const f = G.audioCtx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4000;
        n.connect(f); f.connect(gain); gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); n.start(t); return;
    } else if (type === 'laser' || type === 'shoot') {
        // Short concentrated burst
        osc.type = 'square'; osc.frequency.setValueAtTime(type === 'shoot' ? 800 : 1500, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);
        gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.start(t); osc.stop(t + 0.12);
    } else if (type === 'explosion') {
        // Low-pass filtered noise (boom)
        const bS = G.audioCtx.sampleRate * 0.3, buf = G.audioCtx.createBuffer(1, bS, G.audioCtx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < bS; i++) d[i] = (Math.random() * 2 - 1) * (1 - i/bS);
        const n = G.audioCtx.createBufferSource(); n.buffer = buf;
        const f = G.audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
        n.connect(f); f.connect(gain); gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3); n.start(t); return;
    }
}

