import { G, player, TILE_SIZE, getNextParticle, getNextLaser } from './globals.js';
import { playSound } from '../assets/audio.js';
import { checkRectCollision, playerDeath } from './physics_utils.js';
import { updateAuhGr } from './physics_boss_auhgr.js';
import { updateMasticator } from './physics_boss_masticator.js';
import { updateSepticus } from './physics_boss_septicus.js';
/**
 * Inverse Kinematics (IK) physics chain for highly procedural fiber optics.
 * Allows strings to float like "living snakes" and prevents positional wrapping when turning.
 */
function updateLivingChain(chain, targetLength, headX, headY, idealDist, waveOffset, windX = 0, windY = 0, wiggle = 0.5) {
    if (chain.length < targetLength) {
        chain.length = 0; // reset
        for (let i = 0; i < targetLength; i++)
            chain.push({ x: headX, y: headY });
    }
    // Attach head
    chain[0].x = headX;
    chain[0].y = headY;
    // Ambient breathing / living force
    const time = Date.now() * 0.005;
    // Resolve IK Constraints (forward kinematic pass)
    for (let i = 1; i < chain.length; i++) {
        let p0 = chain[i - 1];
        let p1 = chain[i];
        // TIP-SCALING: Movement becomes exponentially stronger towards the tips of the hair
        const tipFactor = (i / chain.length) * wiggle;
        p1.x += Math.sin(time + i * 0.5 + waveOffset) * tipFactor + windX;
        p1.y += Math.cos(time * 0.8 + i * 0.4 + waveOffset) * tipFactor + windY;
        // Autonomous life (wriggle and float like snakes, plus directional environmental wind)
        let dx = (p0.x - p1.x);
        let dy = (p0.y - p1.y);
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > idealDist) {
            let angle = Math.atan2(dy, dx);
            p1.x = p0.x - Math.cos(angle) * idealDist;
            p1.y = p0.y - Math.sin(angle) * idealDist;
        }
        // Apply environmental Forces (Gravity, wind, and horizontal wiggle)
        p1.y += (windY + Math.sin(time + waveOffset + i * 0.5) * wiggle);
        p1.x += (windX + Math.cos(time + waveOffset + i * 0.4) * wiggle);
    }
}
/**
 * Finds the X and Y peaks of the rider's hat (ID 10) in a 64x64 glitch sprite frame.
 * Identifies two distinct "blobs" (Left and Right Ear) and returns their precise tips.
 */
function findGlitchHatPeaks(frame) {
    let left = { minX: 99, maxX: -1, minY: 99, bestX: 25, bestY: 10 };
    let right = { minX: 99, maxX: -1, minY: 99, bestX: 31, bestY: 10 };
    // Scan top half specifically for Rider Hat (ID 10)
    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 64; x++) {
            if (frame[y * 64 + x] === 10) {
                if (x < 32) {
                    if (y < left.minY) {
                        left.minY = y;
                        left.minX = x;
                        left.maxX = x;
                    }
                    else if (y === left.minY) {
                        left.minX = Math.min(left.minX, x);
                        left.maxX = Math.max(left.maxX, x);
                    }
                }
                else {
                    if (y < right.minY) {
                        right.minY = y;
                        right.minX = x;
                        right.maxX = x;
                    }
                    else if (y === right.minY) {
                        right.minX = Math.min(right.minX, x);
                        right.maxX = Math.max(right.maxX, x);
                    }
                }
            }
        }
    }
    // Finalize coordinates (average X if tip is multiple pixels wide)
    if (left.minY !== 99) {
        left.bestX = (left.minX + left.maxX) / 2;
        left.bestY = left.minY;
    }
    if (right.minY !== 99) {
        right.bestX = (right.minX + right.maxX) / 2;
        right.bestY = right.minY;
    }
    return { x1: left.bestX, y1: left.bestY, x2: right.bestX, y2: right.bestY };
}
/**
 * Finds the Mane (Neck) and Tail (Rear) anchors on the horse's body.
 */
function findGlitchBodyAnchors(frame) {
    let neck = { x: 38, y: 24, minY: 99 };
    let rear = { left: 10, right: 54, y: 50 };
    let minX = 99, maxX = -1;
    // IDs 11, 18, 17 are horse body/mane/tail colors
    for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
            const p = frame[y * 64 + x];
            if (p === 18 || p === 11 || p === 17) {
                // Track bounding box for tail
                if (x < minX)
                    minX = x;
                if (x > maxX)
                    maxX = x;
                // Track neck top (X=20 to X=45 range is safe for neck)
                if (x > 20 && x < 45 && y > 15 && y < 35 && y < neck.minY) {
                    neck.minY = y;
                    neck.x = x;
                    neck.y = y;
                }
            }
        }
    }
    if (minX !== 99) {
        rear.left = minX;
        rear.right = maxX;
    }
    return { neck, rear };
}
/**
 * Triggers the spectacular destruction sequence for any defeated boss.
 * Cleans up entity state, unlocks exits/valves, and mutates the current map
 * layout to permit the player to progress.
 */
export function bossExplode() {
    const boss = G.boss;
    if (!boss)
        return;
    const bDyn = boss;
    // Custom death transition logic for Septicus
    if (boss.type === 'septicus' && !boss.isSinking && !bDyn.isDying && boss.hp <= 0) {
        bDyn.isDying = true;
        boss.timer = 0;
        boss.vx = 0;
        boss.vy = 0;
        boss.vibrateX = 0;
        G.acidPurified = true;
        G.isMapCached = false; // Purify acid globally
        if (boss.projs)
            boss.projs = [];
        playSound('explosion');
    }
    else if (bDyn.isDying || boss.isSinking) {
        return; // Prevent double-triggering
    }
    else {
        // Standard boss death
        boss.active = false;
        playSound('gameOver');
    }
    // High-density explosion particles emitted from the boss's center
    for (let i = 0; i < 40; i++) {
        let p = getNextParticle();
        p.active = true;
        p.type = 'normal';
        p.size = 15;
        p.x = boss.x + Math.random() * boss.width;
        p.y = boss.y + Math.random() * boss.height;
        p.vx = (Math.random() - 0.5) * 500;
        p.vy = (Math.random() - 0.5) * 500;
        p.life = 1.0;
        p.maxLife = 1.0;
    }
    // Auto-collect all level-ending triggers (e.g. Acid Purifier Valve)
    for (let it of G.items) {
        if (it.type === 'valve' || it.type === 'detonator')
            it.collected = true;
    }
    // General map mutation unlocking the pathway strictly upwards
    if (boss.type !== 'goliath') {
        let pCol = Math.floor((boss.x + boss.width / 2) / TILE_SIZE);
        let pRow = Math.floor((boss.y + boss.height) / TILE_SIZE);
        // For Septicus, we punch open a specialized hole in the ceiling (Row 5 - 10)
        if (boss.type === 'septicus') {
            pCol = 98;
            pRow = 11;
            for (let i = 0; i < 6; i++) {
                let br = 5 + i, bc = 82 + i * 2;
                if (G.map[br]) {
                    G.map[br][bc] = 1;
                    G.map[br][bc + 1] = 1;
                }
            }
        }
        // Generate an exit portal above the dead boss location
        if (G.map[Math.max(0, pRow - 1)])
            G.map[Math.max(0, pRow - 1)][pCol] = 5;
        G.isMapCached = false;
    }
}
/**
 * The master physics router for all boss logic.
 * Checks generic collision data, then pipes execution off to the
 * specific boss's individual physics module.
 *
 * @param dt Delta time for framerate independent momentum calculations
 */
export function updateBoss(dt) {
    const boss = G.boss;
    if (!boss)
        return;
    const bDyn = boss;
    // --- TRIGGER LOGIC FOR AUH-GR ---
    // Auh-Gr natively starts inactive and invisible, waiting far below the map.
    // The player triggers the climb upon reaching a Y-threshold.
    if (boss.type === 'auh-gr' && !boss.triggered) {
        const firstPlatformRow = 114;
        const triggerY = firstPlatformRow * 40; // 40 = nominal Y scaling
        // If player descends far enough into the cavern, trigger the boss
        if (player.y < triggerY && player.y > triggerY - 200) {
            boss.triggered = true;
            boss.active = true; // Ignite boss logic
            playSound('powerup');
        }
        if (!boss.active)
            return; // Keep Auh-Gr dormant to avoid memory waste
    }
    // Skip processing if totally dead or inactive
    if (!boss.active || (boss.hp <= 0 && !boss.isSinking && !bDyn.isDying))
        return;
    // Decrement damage cooldown frame delay
    if (boss.hurtTimer > 0)
        boss.hurtTimer -= dt;
    // Global player collision detection for any normal damage-type boss.
    // Notice Auh-Gr is physically exempt because he uses complex math hitboxes instead.
    if (boss.type !== 'auh-gr') {
        let bRect = { x: boss.x + 5, y: boss.y + 5, width: boss.width - 10, height: boss.height - 10 };
        // --- GLITCH SPECIAL: Tight Body-Only Hitbox ---
        if (boss.type === 'glitch') {
            // Focus on the horse/rider torso, excluding procedural trails and empty fringe
            bRect = {
                x: boss.x + 20,
                y: boss.y + 15,
                width: boss.width - 40,
                height: boss.height - 25
            };
        }
        if (checkRectCollision(player, bRect))
            playerDeath();
    }
    // Universal internal clock increment for phase-shifting
    boss.timer += dt;
    // --- ROUTE TO SPECIFIC HANDLERS ---
    if (boss.type === 'masticator') {
        updateMasticator(boss, dt);
    }
    else if (boss.type === 'septicus') {
        updateSepticus(boss, dt, bDyn);
    }
    else if (boss.type === 'auh-gr') {
        updateAuhGr(boss, dt);
    }
    else if (boss.type === 'glitch') {
        // Glitch Boss (Level 79) - Shoots rapid-fire straight lasers directly at the player
        if (!boss.hairTrail1)
            boss.hairTrail1 = [];
        if (!boss.hairTrail2)
            boss.hairTrail2 = [];
        if (!boss.maneTrail)
            boss.maneTrail = [];
        if (!boss.tailTrail)
            boss.tailTrail = [];
        // --- 1. STATE MACHINE INITIALIZATION ---
        if (!boss.state) {
            boss.state = 'IDLE';
            boss.timer = 0;
            boss.facingDir = 1;
        }
        // Lock facing direction during dashes, otherwise track player
        if (boss.state !== 'DASH' && boss.state !== 'RECOVER') {
            boss.facingDir = player.x < boss.x ? -1 : 1;
        }
        const isFlipped = boss.facingDir === -1;
        // --- 2. COMBAT LOGIC ---
        switch (boss.state) {
            case 'IDLE':
                boss.vx = 0;
                boss.timer += dt;
                if (boss.timer > 2.0) {
                    boss.timer = 0;
                    // --- BOSS CONSTRAINT: POLARIZED COMBAT ZONES ---
                    const isPlayerOnStartPlatform = (player.x < 500 && player.y < 400);
                    const isPlayerOnFloor = (player.y > (8 * TILE_SIZE) + 10);
                    if (isPlayerOnStartPlatform) {
                        // PEACE ZONE: Do not attack while player prepares
                        boss.timer = 0;
                    }
                    else if (isPlayerOnFloor) {
                        boss.state = 'TELEGRAPH_DASH'; // Dash only when player is below
                    }
                    else {
                        boss.state = 'TELEGRAPH_LASER'; // Lasers only when player is above
                    }
                }
                break;
            case 'TELEGRAPH_DASH':
                boss.timer += dt;
                boss.vibrateX = Math.sin(Date.now() * 0.1) * 8; // Revving up
                if (boss.timer > 1.0) {
                    boss.timer = 0;
                    boss.vibrateX = 0;
                    boss.state = 'DASH';
                    boss.vx = boss.facingDir === 1 ? 900 : -900;
                    playSound('shoot'); // Digital dash sound
                }
                break;
            case 'DASH':
                boss.x += boss.vx * dt;
                // Camera-Relative Boundaries (800px Viewport + 20px Padding)
                const leftBound = G.camera.x + 20;
                const rightBound = G.camera.x + 800 - boss.width - 20;
                if (boss.x < leftBound || boss.x > rightBound) {
                    boss.x = Math.max(leftBound, Math.min(boss.x, rightBound));
                    boss.state = 'RECOVER';
                    boss.vx = 0;
                    playSound('explosion'); // Slamming into the camera boundary
                }
                break;
            case 'RECOVER':
                boss.timer += dt;
                if (boss.timer > 1.0) {
                    boss.timer = 0;
                    boss.state = 'IDLE';
                }
                break;
            case 'TELEGRAPH_LASER':
                boss.vx = 0;
                boss.timer += dt;
                // The hair IK will automatically reach for the player via pull forces below
                if (boss.timer > 1.2) {
                    boss.timer = 0;
                    boss.state = 'LASER_ATTACK';
                    // --- FIRE 360-DEGREE MEDUSA LASERS ---
                    const trails = [boss.hairTrail1, boss.hairTrail2];
                    for (let trail of trails) {
                        if (!trail || trail.length === 0)
                            continue;
                        let l = getNextLaser();
                        l.active = true;
                        l.width = 16;
                        l.height = 8;
                        // Fire from the physical tip of the hair
                        const tipNode = trail[trail.length - 1];
                        l.x = tipNode.x;
                        l.y = tipNode.y;
                        // Aim at player center
                        const ldx = (player.x + player.width / 2) - tipNode.x;
                        const ldy = (player.y + player.height / 2) - tipNode.y;
                        const ldist = Math.sqrt(ldx * ldx + ldy * ldy) || 1;
                        l.vx = (ldx / ldist) * 450;
                        l.vy = (ldy / ldist) * 450;
                        l.hue = (Date.now() * 0.2 + (Math.random() * 40)) % 360; // Rainbow Hue
                        l.passThroughTiles = true; // GLITCH SPECIAL: Lasers phase through solid geometry
                    }
                    playSound('shoot');
                }
                break;
            case 'LASER_ATTACK':
                boss.timer += dt;
                if (boss.timer > 0.5) {
                    boss.timer = 0;
                    boss.state = 'IDLE';
                }
                break;
        }
        // --- Viewport Locking: Always stay visible in the 800px screen ---
        const vMin = G.camera.x + 20;
        const vMax = G.camera.x + 800 - boss.width - 20;
        if (boss.x < vMin || boss.x > vMax) {
            boss.x = Math.max(vMin, Math.min(boss.x, vMax));
        }
        // --- 3. COORDINATE MAPPING (Scaled Rigid Anchors) ---
        // Ponytails (Line 14), Mane (Line 29), Tail (Line 89)
        const lx1 = 20, lx2 = 33, ly = 5;
        const lmx = 41, lmy = 20;
        const ltx = 5, lty = 36;
        const sX = boss.width / 64, sY = boss.height / 64;
        // Calculate Directional Targets
        const targetX1 = isFlipped ? (63 - lx2) : lx1;
        const targetX2 = isFlipped ? (63 - lx1) : lx2;
        const targetMX = isFlipped ? (63 - lmx) : lmx;
        const targetTX = isFlipped ? (63 - ltx) : ltx;
        // Rigid Snapping
        boss.hairX1 = targetX1;
        boss.hairY1 = ly;
        boss.hairX2 = targetX2;
        boss.hairY2 = ly;
        boss.maneX = targetMX;
        boss.maneY = lmy;
        boss.tailX = targetTX;
        boss.tailY = lty;
        // Scaled World-Space Anchors
        const hX1 = boss.x + (boss.hairX1 * sX), hY1 = boss.y + (boss.hairY1 * sY);
        const hX2 = boss.x + (boss.hairX2 * sX), hY2 = boss.y + (boss.hairY2 * sY);
        const mX = boss.x + (boss.maneX * sX), mY = boss.y + (boss.maneY * sY);
        const tX = boss.x + (boss.tailX * sX), tY = boss.y + (boss.tailY * sY);
        // --- 4. THE MIRROR EVENT ---
        if (boss.lastFlipped !== undefined && boss.lastFlipped !== isFlipped) {
            const mirrorTrail = (trail, anchorX) => {
                for (let i = 1; i < trail.length; i++)
                    trail[i].x = 2 * anchorX - trail[i].x;
            };
            mirrorTrail(boss.hairTrail1, hX1);
            mirrorTrail(boss.hairTrail2, hX2);
            mirrorTrail(boss.maneTrail, mX);
            mirrorTrail(boss.tailTrail, tX);
        }
        boss.lastFlipped = isFlipped;
        // --- 5. UPDATE LIVING CHAINS (Natural Trail Physics) ---
        let pullX1 = -1.5, pullX2 = 1.5;
        let pullY1 = -2.0, pullY2 = -2.0;
        if (Math.abs(boss.vx) > 0.5) {
            // High-speed dash drag
            const drag = isFlipped ? 1.5 : -1.5;
            pullX1 = drag;
            pullX2 = drag;
        }
        updateLivingChain(boss.hairTrail1, 20, hX1, hY1, 2.0, 0, pullX1, pullY1, 3.5);
        updateLivingChain(boss.hairTrail2, 20, hX2, hY2, 2.0, 100, pullX2, pullY2, 3.5);
        updateLivingChain(boss.maneTrail, 8, mX, mY, 2.5, 50, 0, 0, 0.8);
        updateLivingChain(boss.tailTrail, 20, tX, tY, 2.5, 50, (isFlipped ? 1.5 : -1.5), 0, 2.0);
    }
    else if (boss.type === 'goliath') {
        // Goliath Boss (Level 99 Final Encounter)
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
}
