import { G } from '../core/globals.js?v=127';

let nextNoteTime = 0;
let currentNoteIndex = 0;
const tempo = 125;
const secondsPerBeat = 60.0 / tempo;
const stepTime = secondsPerBeat / 4;

const notes = {
    'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, '-1': 0
};

const bassPattern = [
    'A2','A2','C3','A2', 'D3','A2','E3','A2',  'A2','A2','C3','A2', 'G3','A2','E3','C3',
    'F2','F2','A2','F2', 'C3','F2','A2','F2',  'F2','F2','A2','F2', 'C3','F2','A2','C3',
    'G2','G2','B2','G2', 'D3','G2','B2','G2',  'G2','G2','B2','G2', 'D3','G2','B2','D3',
    'E2','E2','G#2','E2', 'B2','E2','G#2','E2',  'G#2','G#2','B2','G#2', 'E3','G#2','B2','G#2'
];

const melodyPattern = [
    '-1','A3','-1','C4', '-1','E4','-1','A4',  '-1','G4','-1','E4', '-1','C4','-1','A3',
    '-1','C4','-1','F4', '-1','A4','-1','G4',  '-1','F4','-1','E4', '-1','C4','-1','A3',
    '-1','G3','-1','B3', '-1','D4','-1','G4',  '-1','B4','-1','A4', '-1','G4','-1','D4',
    '-1','E4','-1','G#4', '-1','B4','-1','E5',  '-1','D5','-1','C5', '-1','B4','-1','G#4'
];

function scheduleNote(beatNumber, time) {
    let bass = bassPattern[beatNumber % bassPattern.length];
    if (bass !== '-1') {
        let osc = G.audioCtx.createOscillator(); let gain = G.audioCtx.createGain();
        osc.connect(gain); gain.connect(G.audioCtx.destination);
        osc.type = 'square'; osc.frequency.setValueAtTime(notes[bass], time);
        gain.gain.setValueAtTime(0.025, time); gain.gain.exponentialRampToValueAtTime(0.001, time + (stepTime * 0.8));
        osc.start(time); osc.stop(time + stepTime);
    }
    let mel = melodyPattern[beatNumber % melodyPattern.length];
    if (mel !== '-1') {
        let osc = G.audioCtx.createOscillator(); let gain = G.audioCtx.createGain();
        osc.connect(gain); gain.connect(G.audioCtx.destination);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(notes[mel], time);
        gain.gain.setValueAtTime(0.04, time); gain.gain.linearRampToValueAtTime(0, time + (stepTime * 1.5));
        osc.start(time); osc.stop(time + (stepTime * 1.5));
    }
}

function musicScheduler() {
    if (!G.isMusicPlaying || !G.audioCtx) return;
    while (nextNoteTime < G.audioCtx.currentTime + 0.1) {
        scheduleNote(currentNoteIndex, nextNoteTime);
        nextNoteTime += stepTime; currentNoteIndex++;
    }
    setTimeout(musicScheduler, 25);
}

export function startBackgroundMusic() {
    if (!G.audioCtx || G.isMusicPlaying) return;
    G.isMusicPlaying = true; nextNoteTime = G.audioCtx.currentTime + 0.05;
    musicScheduler();
}

export function stopBackgroundMusic() {
    G.isMusicPlaying = false;
}
