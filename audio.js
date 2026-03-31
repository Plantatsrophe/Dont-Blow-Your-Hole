let isMusicPlaying = false;
let nextNoteTime = 0;
let currentNoteIndex = 0;
let tempo = 125; 
let secondsPerBeat = 60.0 / tempo;
let stepTime = secondsPerBeat / 4; // 16th notes natively

const notes = {
    'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, '-1': 0
};

// Driving 16th-note Mega Man / Castlevania style Action Bassline natively
const bassPattern = [
    // A minor
    'A2','A2','C3','A2', 'D3','A2','E3','A2',  'A2','A2','C3','A2', 'G3','A2','E3','C3',
    // F major
    'F2','F2','A2','F2', 'C3','F2','A2','F2',  'F2','F2','A2','F2', 'C3','F2','A2','C3',
    // G major
    'G2','G2','B2','G2', 'D3','G2','B2','G2',  'G2','G2','B2','G2', 'D3','G2','B2','D3',
    // E major hook
    'E2','E2','G#2','E2', 'B2','E2','G#2','E2',  'G#2','G#2','B2','G#2', 'E3','G#2','B2','G#2'
];

const melodyPattern = [
    // Syncopated Counter-Melody internally driving forward mathematically
    '-1','A3','-1','C4', '-1','E4','-1','A4',  '-1','G4','-1','E4', '-1','C4','-1','A3',
    '-1','C4','-1','F4', '-1','A4','-1','G4',  '-1','F4','-1','E4', '-1','C4','-1','A3',
    '-1','G3','-1','B3', '-1','D4','-1','G4',  '-1','B4','-1','A4', '-1','G4','-1','D4',
    '-1','E4','-1','G#4', '-1','B4','-1','E5',  '-1','D5','-1','C5', '-1','B4','-1','G#4'
];

function scheduleNote(beatNumber, time) {
    let bass = bassPattern[beatNumber % bassPattern.length];
    if (bass !== '-1') {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(notes[bass], time);
        gain.gain.setValueAtTime(0.025, time); // Aggressive but balanced organically
        gain.gain.exponentialRampToValueAtTime(0.001, time + (stepTime * 0.8));
        osc.start(time);
        osc.stop(time + stepTime);
    }

    let mel = melodyPattern[beatNumber % melodyPattern.length];
    if (mel !== '-1') {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle'; // Softer lead cleanly cutting through the mix natively
        osc.frequency.setValueAtTime(notes[mel], time);
        gain.gain.setValueAtTime(0.04, time); 
        gain.gain.linearRampToValueAtTime(0, time + (stepTime * 1.5));
        osc.start(time);
        osc.stop(time + (stepTime * 1.5));
    }
}

function musicScheduler() {
    if (!isMusicPlaying || !audioCtx) return;
    
    // Look-ahead natively buffering 100ms
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
        scheduleNote(currentNoteIndex, nextNoteTime);
        nextNoteTime += stepTime;
        currentNoteIndex++;
    }
    setTimeout(musicScheduler, 25);
}

function startBackgroundMusic() {
    if (!audioCtx) return;
    if (isMusicPlaying) return;
    isMusicPlaying = true;
    nextNoteTime = audioCtx.currentTime + 0.05;
    musicScheduler();
}

function stopBackgroundMusic() {
    isMusicPlaying = false;
}

function initAudio() {
    if (!audioCtx) {
        let AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'stomp') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'collect') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1200, t + 0.05);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.8);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
        osc.start(t); osc.stop(t + 0.8);
    } else if (type === 'gameOver') {
        // Tense, distressful shut down
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 2.0);
        
        // Add a second oscillator for dissonance
        const osc2 = audioCtx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(215, t); // Slightly out of tune
        osc2.frequency.exponentialRampToValueAtTime(35, t + 2.0);
        osc2.connect(gain);
        osc2.start(t);
        osc2.stop(t + 2.0);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
        osc.start(t); osc.stop(t + 2.0);
    } else if (type === 'win') {
        // Rewarding, exciting arpeggio
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, t + 0.3); // C6
        osc.frequency.setValueAtTime(1318.51, t + 0.45); // E6
        osc.frequency.setValueAtTime(1567.98, t + 0.6); // G6 (held)
        
        // Support layer
        const oscChime = audioCtx.createOscillator();
        oscChime.type = 'triangle';
        oscChime.frequency.setValueAtTime(1046.50, t);
        oscChime.frequency.setValueAtTime(1318.51, t + 0.1);
        oscChime.frequency.setValueAtTime(1567.98, t + 0.2);
        oscChime.frequency.setValueAtTime(2093.00, t + 0.3);
        oscChime.frequency.setValueAtTime(2637.02, t + 0.45);
        oscChime.frequency.setValueAtTime(3135.96, t + 0.6);
        oscChime.connect(gain);
        oscChime.start(t);
        oscChime.stop(t + 1.2);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.setValueAtTime(0.08, t + 0.6); // hold max
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc.start(t); osc.stop(t + 1.2);
    } else if (type === 'playerMove') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
        osc.start(t); osc.stop(t + 0.02);
    } else if (type === 'powerup') {
        // Comical Chomp "Nom Nom"
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        let osc2 = audioCtx.createOscillator();
        let gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(700, t + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(100, t + 0.3);
        gain2.gain.setValueAtTime(0.15, t + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        
        osc.start(t); osc.stop(t + 0.15);
        osc2.start(t + 0.15); osc2.stop(t + 0.3);
    } else if (type === 'enemyMove') {
        // Scratchy critters scurrying - Highpass filtered White Noise
        const bufferSize = audioCtx.sampleRate * 0.04; // 40ms burst
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 4000; // emphasize the scratchiness
        
        noise.connect(filter);
        filter.connect(gain);
        
        gain.gain.setValueAtTime(0.08, t); // Significantly louder scratch
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        noise.start(t);
        return; // Prevents the unused base oscillator from doing anything
    } else if (type === 'laser') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(1500, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.start(t); osc.stop(t + 0.12);
    }
}

