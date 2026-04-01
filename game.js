function updateGame(dt) {
    if (gameState === 'PLAYING') {
        // Timer
        timerAcc += dt;
        if (timerAcc >= 1) {
            timer--;
            timerAcc -= 1;
            if (timer <= 0) {
                playerDeath();
            }
        }
    }

    updatePhysics(dt);
    
    // Global Particle update natively dynamically bounding to Object Pool natively!
    for (let i = 0; i < particlePool.length; i++) {
        let p = particlePool[i];
        if (!p.active) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.size *= 0.95; 
        if (p.life <= 0) p.active = false;
    }
    
    if (gameState !== 'PLAYING') return;

    // Camera follow player (clamped)
    camera.x = player.x - canvas.width / 2 + player.width / 2;
    if (camera.x < 0) camera.x = 0;
    let maxCamX = mapCols * TILE_SIZE - canvas.width;
    if (camera.x > maxCamX) camera.x = maxCamX;

    camera.y = player.y - canvas.height / 2 + player.height / 2;
    if (camera.y < 0) camera.y = 0;
    let maxCamY = mapRows * TILE_SIZE - canvas.height;
    if (camera.y > maxCamY) camera.y = maxCamY;

    // Items update
    for (let i of items) {
        if (!i.collected && checkRectCollision(player, i)) {
            i.collected = true;
            if (i.type === 'hotdog') {
                player.lives++;
                playSound('powerup');
            } else if (i.type === 'checkpoint') {
                if (player.startX !== i.x + 8 || player.startY !== i.y - 2) {
                    player.startX = i.x + 8;
                    player.startY = i.y - 2; // Spawn cleanly above and naturally drop on the platform
                    playSound('powerup');
                    
                    // Blast 20 particles explicitly visually denoting Checkpoint Grab
                    for (let pCounter = 0; pCounter < 20; pCounter++) {
                        let p = particlePool.find(pp => !pp.active);
                        if (p) {
                            p.active = true;
                            p.type = 'checkpoint';
                            p.x = i.x + 16;
                            p.y = i.y + 16;
                            p.vx = (Math.random() - 0.5) * 100;
                            p.vy = -50 - Math.random() * 100;
                            p.size = 6;
                            p.life = 0.5 + Math.random() * 0.5;
                            p.maxLife = 1.0;
                        }
                    }
                }
            } else if (i.type === 'valve') {
                playSound('powerup');
                if (boss && boss.active) {
                    boss.hp--;
                    boss.hurtTimer = 0.5;
                    playSound('explosion');
                    if (boss.hp <= 0) bossExplode();
                }
            } else if (i.type === 'detonator') {
                playSound('powerup');
                if (boss && boss.active) {
                    bossExplode();
                    player.cutsceneTimer = 0;
                    gameState = 'CREDITS_CUTSCENE';
                }
            } else {
                player.score += 1000;
                playSound('collect');
            }
        }
    }

    // Autonomous Enemies update
    let anyEnemyVisible = false;
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];

        // Track for audio
        if (e.x > camera.x && e.x < camera.x + canvas.width) {
            anyEnemyVisible = true;
        }

        if (e.type === 'bot') {
            let ogX = e.x;
            e.x += e.vx * e.dir * dt;

            let hitWall = false;
            let eTiles = getCollidingTiles(e);
            for (let t of eTiles) {
                if (t.type === 1) hitWall = true;
            }

            // Pit check natively
            let pitCheck = { x: e.x + (e.dir === 1 ? e.width : -1), y: e.y + e.height + 1, width: 1, height: 1 };
            let pitTiles = getCollidingTiles(pitCheck);
            let overPit = true;
            for (let t of pitTiles) {
                if (t.type === 1 || t.type === 6) overPit = false;
            }

            if (hitWall || overPit) {
                e.x = ogX; // reverse out of wall/pit gracefully
                e.dir *= -1;
            }
        } else if (e.type === 'laserBot') {
            e.dir = player.x < e.x ? -1 : 1; // Always identically geometric facing!

            // Line of Sight engagement tracking securely natively
            if (Math.abs(player.y - e.y) < 150 && Math.abs(player.x - e.x) < 500) {
                e.cooldown -= dt;
                if (e.cooldown <= 0) {
                    e.cooldown = 1.6; // Fire rhythm elegantly explicitly
                    let l = laserPool.find(lp => !lp.active);
                    if (l) {
                        l.active = true;
                        l.x = e.dir === 1 ? e.x + e.width : e.x - 16;
                        l.y = e.y + 4;
                        l.width = 16; 
                        l.height = 4;
                        l.vx = 350 * e.dir;
                    }
                    playSound('laser');
                }
            }
        }

        if (checkRectCollision(player, e)) {
            // Check Stomp
            let playerBottom = player.y + player.height;
            let playerPrevBottom = playerBottom - player.vy * dt;

            if (player.vy > 0 && playerPrevBottom <= e.y + 15) {
                // Stomped!
                playSound('stomp');
                player.vy = keys.Space ? player.jumpPower * 0.9 : player.jumpPower * 0.6;
                player.doubleJump = true;
                player.score += 200;

                // Scrap Gear Particles! Pool instantiated cleanly
                for (let pCounter = 0; pCounter < 20; pCounter++) {
                    let rad = Math.random() * Math.PI * 2;
                    let spd = 50 + Math.random() * 150;
                    let p = particlePool.find(pp => !pp.active);
                    if (p) {
                        p.active = true;
                        p.type = 'gear';
                        p.x = e.x + e.width / 2;
                        p.y = e.y + e.height / 2;
                        p.vx = Math.cos(rad) * spd;
                        p.vy = Math.sin(rad) * spd - 50;
                        p.size = 16;
                        p.life = 0.8 + Math.random() * 0.4;
                        p.maxLife = 1.2;
                    }
                }

                enemies.splice(i, 1);
            } else {
                playerDeath();
                return;
            }
        }
    }

    // Laser Physics Engine decoupled actively mapping memory pool intelligently
    for (let i = 0; i < laserPool.length; i++) {
        let l = laserPool[i];
        if (!l.active) continue;

        l.x += l.vx * dt;

        let lTiles = getCollidingTiles(l);
        let hitWall = false;
        for (let t of lTiles) {
            if (t.type === 1) hitWall = true;
        }

        if (hitWall || l.x < 0 || l.x > mapCols * TILE_SIZE) {
            l.active = false;
            continue;
        }

        if (checkRectCollision(player, l)) {
            playerDeath();
            return;
        }
    }

    if (anyEnemyVisible) {
        enemyWalkTimer += dt;
        if (enemyWalkTimer > 0.12) { // Quick scratching speed
            playSound('enemyMove');
            enemyWalkTimer = 0;
        }
    }

    // Platform structural oscillations naturally mapped seamlessly
    for (let plat of platforms) {
        plat.x += plat.vx * dt;
        if (plat.x >= plat.maxX) {
            plat.x = plat.maxX;
            plat.vx *= -1;
        } else if (plat.x <= plat.minX) {
            plat.x = plat.minX;
            plat.vx *= -1;
        }
    }
}

let lastTime = 0;
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1; // Cap extreme lag
    lastTime = timestamp;

    if (gameState === 'PLAYING' || gameState === 'DYING' || gameState === 'LEVEL_CLEAR') {
        const MAX_STEP = 0.016; // approx 60 FPS sub-steps
        while (dt > 0) {
            let step = Math.min(dt, MAX_STEP);
            updateGame(step);
            dt -= step;
            if (gameState === 'GAMEOVER' || gameState === 'WIN') break;
        }
    } else if (gameState === 'INTRO') {
        introY -= 30 * dt; // Cinematic Scroll velocity
        if (introY < -600) {
            handleUIAccept(); // Auto-advance logically securely naturally
        }
    } else if (gameState === 'CREDITS_CUTSCENE') {
        player.cutsceneTimer += dt;
        if (player.cutsceneTimer > 5.0) {
            gameState = 'CREDITS';
            player.cutsceneTimer = 0;
            playSound('win'); // Epic closing credits!
        }
    } else if (gameState === 'CREDITS') {
        player.cutsceneTimer += dt;
    }

    render();
    requestAnimationFrame(gameLoop);
}

// Init
parseMap();
resetPlayerPosition();
requestAnimationFrame(gameLoop);

