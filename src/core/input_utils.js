import { G, player, keys } from './globals.js?v=126';
import { playSound } from '../assets/audio.js?v=126';

let lastDownPressTime = 0;

export function processDownInput(el) {
    if (!keys.ArrowDown) {
        let now = Date.now();
        if (now - lastDownPressTime < 300) { player.droppingThrough = true; setTimeout(() => { player.droppingThrough = false; }, 200); }
        lastDownPressTime = now;
    }
    keys.ArrowDown = true;
    if (el) el.classList.add('active');
}

export function handleJump() {
    if (G.gameState !== 'PLAYING') return;
    if (player.isOnGround || player.isClimbing) {
        player.riding = null; 
        player.vy = player.jumpPower; 
        player.isOnGround = false; 
        player.isClimbing = false; 
        player.doubleJump = true; 
        playSound('jump'); 
    }
    else if (player.doubleJump) { 
        player.riding = null; 
        player.vy = player.jumpPower * 0.9; 
        player.doubleJump = false; 
        playSound('jump'); 
    }
}
