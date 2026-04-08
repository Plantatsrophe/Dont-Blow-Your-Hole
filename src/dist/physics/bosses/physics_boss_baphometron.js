import { G, getNextLaser } from '../../core/globals.js';
import { playSound } from '../../assets/audio.js';
/**
 * Executes physics and AI for the Baphometron boss (Level 99 Final Encounter).
 * Baphometron is a colossal tank that chases the player and fires triple-laser spreads.
 *
 * @param boss The generic boss entity
 * @param dt Delta time
 */
export function updateBaphometron(boss, dt) {
    // A colossal super-tank that chases the player from the left.
    // It stays locked to the left side of the camera's viewport.
    boss.x = Math.max(boss.x, G.camera.x - 30);
    // Every 2 seconds it fires a 3-spread of massive lasers
    if (boss.timer > 2.0 && G.gameState !== 'CREDITS_CUTSCENE' && G.gameState !== 'CREDITS') {
        boss.timer = 0;
        for (let i = 0; i < 3; i++) {
            let l = getNextLaser();
            l.active = true;
            l.width = 30;
            l.height = 15;
            l.x = boss.x + boss.width;
            l.y = boss.y + 40 + (i * 40);
            l.vx = 400 + Math.random() * 100; // Fire forwards (right) rapidly
        }
        playSound('shoot');
    }
}
