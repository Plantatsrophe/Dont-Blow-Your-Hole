import { G } from '../core/globals.js?v=126';

export function playSound(type) {
    if (!G.audioCtx) return;
    const t = G.audioCtx.currentTime;
    const osc = G.audioCtx.createOscillator();
    const gain = G.audioCtx.createGain();
    osc.connect(gain); gain.connect(G.audioCtx.destination);
    
    if (type === 'jump') {
        osc.type = 'square'; osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
        gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'stomp') {
        osc.type = 'square'; osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'collect') {
        osc.type = 'square'; osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1200, t + 0.05);
        gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'die') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.8);
        gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
        osc.start(t); osc.stop(t + 0.8);
    } else if (type === 'gameOver') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 2.0);
        const osc2 = G.audioCtx.createOscillator(); osc2.type = 'square';
        osc2.frequency.setValueAtTime(215, t); osc2.frequency.exponentialRampToValueAtTime(35, t + 2.0);
        osc2.connect(gain); osc2.start(t); osc2.stop(t + 2.0);
        gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
        osc.start(t); osc.stop(t + 2.0);
    } else if (type === 'win') {
        osc.type = 'square'; osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, t + 0.3); // C6
        osc.frequency.setValueAtTime(1318.51, t + 0.45); // E6
        osc.frequency.setValueAtTime(1567.98, t + 0.6); // G6 (held)
        const oscChime = G.audioCtx.createOscillator(); oscChime.type = 'triangle';
        oscChime.frequency.setValueAtTime(1046.50, t); oscChime.frequency.setValueAtTime(1318.51, t + 0.1);
        oscChime.frequency.setValueAtTime(1567.98, t + 0.2); oscChime.frequency.setValueAtTime(2093.00, t + 0.3);
        oscChime.frequency.setValueAtTime(2637.02, t + 0.45); oscChime.frequency.setValueAtTime(3135.96, t + 0.6);
        oscChime.connect(gain); oscChime.start(t); oscChime.stop(t + 1.2);
        gain.gain.setValueAtTime(0.08, t); gain.gain.setValueAtTime(0.08, t + 0.6); gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc.start(t); osc.stop(t + 1.2);
    } else if (type === 'playerMove') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(200, t);
        gain.gain.setValueAtTime(0.02, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
        osc.start(t); osc.stop(t + 0.02);
    } else if (type === 'powerup') {
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
        const bS = G.audioCtx.sampleRate * 0.04, buf = G.audioCtx.createBuffer(1, bS, G.audioCtx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < bS; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
        const n = G.audioCtx.createBufferSource(); n.buffer = buf;
        const f = G.audioCtx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4000;
        n.connect(f); f.connect(gain); gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); n.start(t); return;
    } else if (type === 'laser') {
        osc.type = 'square'; osc.frequency.setValueAtTime(1500, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);
        gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.start(t); osc.stop(t + 0.12);
    }
}
