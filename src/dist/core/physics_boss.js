import { G, player, TILE_SIZE, getNextParticle, getNextLaser } from './globals.js';
import { staticLevels } from '../data/levels.js';
import { playSound } from '../assets/audio.js';
import { checkRectCollision, playerDeath } from './physics_utils.js';
export function bossExplode() {
    const boss = G.boss;
    if (boss.type === 'septicus' && !boss.isSinking && !boss.isDying && boss.hp <= 0) {
        boss.isDying = true;
        boss.timer = 0;
        boss.vx = 0;
        boss.vy = 0;
        boss.vibrateX = 0;
        G.acidPurified = true;
        G.isMapCached = false;
        if (boss.projs)
            boss.projs = [];
        playSound('explosion');
    }
    else if (boss.isDying || boss.isSinking) {
        return;
    }
    else {
        boss.active = false;
        playSound('gameOver');
    }
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
    for (let it of G.items) {
        if (it.type === 'valve' || it.type === 'detonator')
            it.collected = true;
    }
    if (boss.type !== 'goliath') {
        let pCol = Math.floor((boss.x + boss.width / 2) / TILE_SIZE), pRow = Math.floor((boss.y + boss.height) / TILE_SIZE);
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
        G.map[Math.max(0, pRow - 1)][pCol] = 5;
        G.isMapCached = false;
    }
}
export function updateBombs(dt) {
    const boss = G.boss;
    for (let b of G.bombs) {
        if (!b.active)
            continue;
        const bPhys = b; // Cast to access velocity
        if (bPhys.vy === undefined)
            bPhys.vy = 0;
        bPhys.vy += 800 * dt;
        if (boss && boss.active) {
            let targetX = boss.x + boss.width / 2 - b.width / 2;
            b.x += (targetX - b.x) * 10 * dt;
            bPhys.vx = 0;
        }
        b.y += bPhys.vy * dt;
        if (boss && boss.active && checkRectCollision(b, boss)) {
            b.active = false;
            b.y = -9999;
            playSound('explosion');
            for (let i = 0; i < 20; i++) {
                let p = getNextParticle();
                p.active = true;
                p.type = 'explosion';
                p.size = 12;
                p.x = b.x + 16;
                p.y = b.y + 16;
                p.vx = (Math.random() - 0.5) * 400;
                p.vy = (Math.random() - 0.5) * 400;
                p.life = 0.8;
                p.maxLife = 0.8;
            }
            boss.hp--;
            boss.hurtTimer = 0.5;
            if (boss.hp <= 0)
                bossExplode();
        }
    }
}
export function updateBoss(dt) {
    const boss = G.boss;
    const bDyn = boss;
    if (!boss || !boss.active || (boss.hp <= 0 && !boss.isSinking && !bDyn.isDying))
        return;
    if (boss.hurtTimer > 0)
        boss.hurtTimer -= dt;
    let bRect = { x: boss.x + 5, y: boss.y + 5, width: boss.width - 10, height: boss.height - 10 };
    if (checkRectCollision(player, bRect))
        playerDeath();
    boss.timer += dt;
    if (boss.type === 'masticator') {
        boss.y = boss.startY || 0;
        if (boss.phase === 0) {
            boss.vx = 0;
            if (boss.hasSeenPlayer || (boss.x > G.camera.x && boss.x < G.camera.x + 800)) {
                boss.hasSeenPlayer = true;
                boss.phase = 1;
                boss.vx = (player.x < boss.x) ? -300 : 300;
                playSound('shoot');
            }
        }
        else if (boss.phase === 1) {
            boss.x += boss.vx * dt;
            let sc2 = Math.floor(boss.x / TILE_SIZE), ec2 = Math.floor((boss.x + boss.width) / TILE_SIZE), sr2 = Math.floor(boss.y / TILE_SIZE), er2 = Math.floor((boss.y + boss.height) / TILE_SIZE);
            let hitPillar = false, hitCol = -1;
            for (let r = sr2; r <= er2; r++)
                for (let c = sc2; c <= ec2; c++) {
                    if (G.map[r] && G.map[r][c] !== 0 && G.map[r][c] !== undefined && r < 13) {
                        let p2 = getNextParticle();
                        p2.active = true;
                        p2.type = 'normal';
                        p2.size = 12;
                        p2.x = c * TILE_SIZE + 20;
                        p2.y = r * TILE_SIZE + 20;
                        p2.vx = (Math.random() - 0.5) * 500;
                        p2.vy = -300 - Math.random() * 300;
                        p2.color = '#B0B0B0';
                        p2.life = 1.0;
                        p2.maxLife = 1.0;
                        if (G.map[r][c] === 1) {
                            hitPillar = true;
                            hitCol = c;
                        }
                        G.map[r][c] = 0;
                        G.isMapCached = false;
                    }
                }
            if (hitPillar) {
                for (let pr = 12; pr > 0; pr--) {
                    let rs = staticLevels[G.currentLevel].map[pr];
                    if (rs && rs[hitCol] === '1') {
                        G.map[pr][hitCol] = 0;
                        staticLevels[G.currentLevel].map[pr] = rs.substring(0, hitCol) + "0" + rs.substring(hitCol + 1);
                        let p2 = getNextParticle();
                        p2.active = true;
                        p2.type = 'normal';
                        p2.size = 12;
                        p2.x = hitCol * TILE_SIZE + 20;
                        p2.y = pr * TILE_SIZE + 20;
                        p2.vx = (Math.random() - 0.5) * 500;
                        p2.vy = -300 - Math.random() * 300;
                        p2.color = '#B0B0B0';
                        p2.life = 1.0;
                        p2.maxLife = 1.0;
                    }
                }
                G.isMapCached = false;
                boss.phase = 2;
                boss.vx = 0;
                boss.timer = 0;
                for (let bomb of G.bombs) {
                    if (!bomb.active && Math.abs(bomb.col - hitCol) <= 3) {
                        bomb.active = true;
                        bomb.vx = (boss.x + boss.width / 2 > bomb.x) ? 50 : -50;
                    }
                }
            }
            else {
                if ((boss.vx > 0 && player.x + player.width < boss.x) || (boss.vx < 0 && player.x > boss.x + boss.width)) {
                    boss.phase = 3;
                    boss.timer = 0;
                }
            }
        }
        else if (boss.phase === 3) {
            boss.vx *= 0.9;
            boss.x += boss.vx * dt;
            if (boss.timer > 0.4) {
                boss.phase = 1;
                boss.vx = (player.x < boss.x) ? -300 : 300;
                playSound('shoot');
            }
        }
        else if (boss.phase === 2) {
            if (boss.timer > 3.0) {
                boss.phase = 0;
                boss.timer = 0;
            }
        }
    }
    else if (boss.type === 'septicus') {
        if (bDyn.isDying) {
            boss.timer += dt;
            let shake = Math.min((boss.timer / 3.0) * 15, 15);
            boss.vibrateX = (Math.random() - 0.5) * shake * 2;
            if (Math.random() < 30 * dt) {
                let p = getNextParticle();
                p.active = true;
                p.type = 'normal';
                p.size = Math.random() * 6 + 4;
                p.x = boss.x + Math.random() * boss.width;
                p.y = boss.y + Math.random() * boss.height;
                p.vx = (Math.random() - 0.5) * 400;
                p.vy = (Math.random() - 0.5) * 400;
                p.color = (Math.random() > 0.5 ? '#3ee855' : '#ffffff');
                p.life = 0;
                p.maxLife = 0.6 + Math.random() * 0.4;
            }
            if (boss.timer > 3.0) {
                bDyn.isDying = false;
                boss.isSinking = true;
                boss.timer = 0;
                playSound('gameOver');
                boss.vibrateX = 0;
                for (let i = 0; i < 40; i++) {
                    let p = getNextParticle();
                    p.active = true;
                    p.type = 'explosion';
                    p.size = 15;
                    p.x = boss.x + Math.random() * boss.width;
                    p.y = boss.y + Math.random() * boss.height;
                    p.vx = (Math.random() - 0.5) * 600;
                    p.vy = (Math.random() - 0.5) * 600;
                    p.life = 1.0;
                    p.maxLife = 1.0;
                }
                G.camera.vibrate = 20;
            }
            return;
        }
        if (boss.isSinking) {
            boss.y += 18 * dt;
            if (boss.timer > 10.0) {
                boss.isSinking = false;
                boss.active = false;
            }
            return;
        }
        else if (!bDyn.triggered) {
            if (player.x > TILE_SIZE * 12) {
                bDyn.triggered = true;
                boss.x = player.x - boss.width / 2;
                playSound('powerup');
            }
            boss.vx = 0;
            boss.vy = 0;
            return;
        }
        if (boss.y > (boss.startY || 0)) {
            boss.y -= 350 * dt;
            if (boss.y < (boss.startY || 0))
                boss.y = (boss.startY || 0);
            return;
        }
        if (player.x < TILE_SIZE * 11) {
            boss.vx = 0;
            boss.phase = 0;
            boss.timer = 0;
            boss.y += boss.vy * dt;
            if (boss.y > (boss.startY || 0)) {
                boss.y = (boss.startY || 0);
                boss.vy = 0;
            }
            else
                boss.vy += 800 * dt;
            return;
        }
        if (!boss.vy)
            boss.vy = 0;
        boss.y += boss.vy * dt;
        if (boss.y > (boss.startY || 0)) {
            boss.y = (boss.startY || 0);
            boss.vy = 0;
        }
        else
            boss.vy += 800 * dt;
        let reach = 140, dist = Math.abs(player.x - (boss.x + boss.width / 2));
        if (boss.phase === 0) {
            let spd = (boss.hp < 3) ? 220 : 180;
            boss.vx = (player.x < boss.x + boss.width / 2) ? -spd : spd;
            boss.x += boss.vx * dt;
            boss.x = Math.max(TILE_SIZE * 10, Math.min(TILE_SIZE * 90, boss.x));
            if (boss.hp <= 2 && boss.y >= (boss.startY || 0) && player.y < boss.y - 120 && Math.random() < 0.02)
                boss.vy = -600;
            if (boss.hp === 1 && boss.timer > ((boss.projs?.length || 0) > 0 ? 0 : 3.0)) {
                boss.phase = 3;
                boss.timer = 0;
                bDyn.throwsLeft = 3;
            }
            else if (dist < reach && boss.timer > 2) {
                boss.phase = 1;
                boss.timer = 0;
                boss.vx = 0;
            }
        }
        else if (boss.phase === 1) {
            if (boss.timer > 0.8) {
                boss.phase = 2;
                boss.timer = 0;
                playSound('shoot');
            }
        }
        else if (boss.phase === 2) {
            if (boss.timer > 1.0) {
                boss.phase = 0;
                boss.timer = 0;
            }
            let sa = boss.timer * Math.PI, sx = (boss.x + boss.width / 2) + Math.cos(sa) * reach * (player.x < boss.x ? -1 : 1), sy = (boss.y + boss.height / 2) - Math.sin(sa) * reach;
            let dx2 = player.x + player.width / 2 - sx, dy2 = player.y + player.height / 2 - sy;
            if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < 22)
                playerDeath();
        }
        else if (boss.phase === 3) {
            if (!boss.projs)
                boss.projs = [];
            let spd2 = 140;
            boss.vx = (player.x < boss.x + boss.width / 2) ? -spd2 : spd2;
            boss.x += boss.vx * dt;
            boss.x = Math.max(TILE_SIZE * 10, Math.min(TILE_SIZE * 90, boss.x));
            if (boss.timer > 0.6 && bDyn.throwsLeft > 0) {
                boss.timer = 0;
                bDyn.throwsLeft--;
                let tx = player.x + player.width / 2, ty = player.y + player.height / 2, bx = boss.x + boss.width / 2, by = boss.y + boss.height / 2, ddx = tx - bx, ddy = ty - by, dst = Math.sqrt(ddx * ddx + ddy * ddy), spd3 = 500;
                boss.projs.push({ x: bx, y: by, vx: (ddx / dst) * spd3, vy: (ddy / dst) * spd3, timer: 0, linear: true });
                playSound('shoot');
            }
            if (bDyn.throwsLeft <= 0 && boss.timer > 1.5) {
                boss.phase = 0;
                boss.timer = 0;
            }
        }
        if (boss.projs) {
            for (let i = boss.projs.length - 1; i >= 0; i--) {
                let p = boss.projs[i];
                if (!p)
                    break;
                p.timer += dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                if (!p.linear)
                    p.vy += 600 * dt;
                let pdx = player.x + player.width / 2 - p.x, pdy = player.y + player.height / 2 - p.y;
                if (Math.sqrt(pdx * pdx + pdy * pdy) < 25)
                    playerDeath();
                if (p.y > (G.boss.startY || 0) + 400 || p.x < 0 || p.x > G.mapCols * TILE_SIZE)
                    boss.projs.splice(i, 1);
            }
        }
        if (Math.random() < 30 * dt) {
            let p = getNextParticle();
            p.active = true;
            p.type = 'normal';
            p.size = Math.random() * 3 + 2;
            p.x = boss.x + Math.random() * boss.width;
            p.y = boss.y + boss.height;
            p.vx = (Math.random() - 0.5) * 15;
            p.vy = 40 + Math.random() * 80;
            p.color = '#3ee855';
            p.life = 0;
            p.maxLife = 1.0 + Math.random();
        }
        if (boss.vx !== 0 && Math.random() < 50 * dt) {
            let p = getNextParticle();
            p.active = true;
            p.type = 'normal';
            p.size = Math.random() * 4 + 3;
            p.x = boss.x + (boss.vx > 0 ? boss.width : 0) + (Math.random() - 0.5) * 30;
            p.y = 13 * TILE_SIZE;
            p.vx = boss.vx * 0.4 + (Math.random() - 0.5) * 80;
            p.vy = -180 - Math.random() * 150;
            p.color = '#3ee855';
            p.life = 0;
            p.maxLife = 0.5 + Math.random() * 0.5;
        }
    }
    else if (boss.type === 'auh-gr') {
        if (player.y < boss.y)
            boss.y -= 70 * dt;
        boss.x += Math.cos(boss.timer * 4) * 80 * dt;
    }
    else if (boss.type === 'core') {
        if (boss.timer > 1.5) {
            boss.timer = 0;
            let l = getNextLaser();
            l.active = true;
            l.width = 16;
            l.height = 8;
            l.x = boss.x + boss.width / 2;
            l.y = player.y + player.height / 2;
            l.vx = (Math.random() > 0.5 ? -250 : 250);
            playSound('shoot');
        }
    }
    else if (boss.type === 'goliath') {
        boss.x = Math.max(boss.x, G.camera.x - 30);
        if (boss.timer > 2.0 && G.gameState !== 'CREDITS_CUTSCENE' && G.gameState !== 'CREDITS') {
            boss.timer = 0;
            for (let i = 0; i < 3; i++) {
                let l = getNextLaser();
                l.active = true;
                l.width = 30;
                l.height = 15;
                l.x = boss.x + boss.width;
                l.y = boss.y + 40 + (i * 40);
                l.vx = 400 + Math.random() * 100;
            }
            playSound('shoot');
        }
    }
}
