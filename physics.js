function checkRectCollision(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

function getCollidingTiles(rect) {
    let tiles = [];
    let startCol = Math.floor((rect.x + 0.0001) / TILE_SIZE);
    let endCol = Math.floor((rect.x + rect.width - 0.0001) / TILE_SIZE);
    let startRow = Math.floor((rect.y + 0.0001) / TILE_SIZE);
    let endRow = Math.floor((rect.y + rect.height - 0.0001) / TILE_SIZE);

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            if (row >= 0 && row < mapRows && col >= 0 && col < mapCols) {
                tiles.push({
                    row: row, col: col,
                    type: map[row][col],
                    rect: {
                        x: col * TILE_SIZE,
                        y: row * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    }
                });
            }
        }
    }
    return tiles;
}

function playerDeath() {
    if (gameState === 'DYING') return;
    playSound('die');
    gameState = 'DYING';
    player.dyingTimer = 0;

    // Flush active hazard beams seamlessly logically intuitively explicitly securely!
    for (let l of laserPool) {
        l.active = false;
    }
    
    // Stop Masticator immediately upon player death correctly smoothly gracefully!
    if (boss && boss.active && boss.type === 'masticator') {
        boss.phase = 0;
        boss.vx = 0;
        boss.hasSeenPlayer = false;
    }

    // 4 Quadrant Fragmentation Matrix! dynamically allocated via strict pooling seamlessly!
    for (let i = 0; i < 4; i++) {
        let qx = (i % 2 === 0) ? 0 : 0.5;
        let qy = (i < 2) ? 0 : 0.5;
        let p = particlePool.find(pp => !pp.active);
        if (p) {
            p.active = true;
            p.type = 'playerQuad';
            p.qx = qx;
            p.qy = qy;
            p.x = player.x + (qx * player.width) + (player.width / 4);
            p.y = player.y + (qy * player.height) + (player.height / 4);
            p.vx = (qx === 0 ? -1 : 1) * (150 + Math.random() * 50);
            p.vy = (qy === 0 ? -1 : 1) * (150 + Math.random() * 50) - 100;
            p.size = Math.max(player.width, player.height) / 2;
            p.life = 1.5;
            p.maxLife = 2.0;
            p.flip = player.lastDir === -1;
        }
    }

    player.vx = 0;
    player.vy = 0;
    player.isOnGround = false;
    player.isClimbing = false;
}

function updatePhysics(dt) {
    if (gameState === 'DYING') {
        player.dyingTimer += dt;
        
        // Wait till shatter explicitly dissipates
        if (player.dyingTimer > 1.8) {
            player.lives--;
            if (player.lives <= 0) {
                stopBackgroundMusic();
                playSound('gameOver');
                gameState = 'GAMEOVER';
            } else {
                timer = 60;
                parseMap(false); // Preserve collected items across deaths
                resetPlayerPosition();
                gameState = 'PLAYING';
            }
        }
        return; // Halt ALL normal physics processing!
    }

    if (gameState === 'LEVEL_CLEAR') {
        player.vx = player.speed * 0.5; // Auto walk right
        player.vy += player.gravity * dt;
        player.x += player.vx * dt;
        player.y += player.vy * dt;
        
        // Retain Floor Collisions to glide over goal reliably
        let tilesAfterY = getCollidingTiles(player);
        for (let t of tilesAfterY) {
            if (t.type === 1 || t.type === 6) {
                if (player.vy > 0) {
                    player.y = t.rect.y - player.height;
                    player.isOnGround = true;
                    player.vy = 0;
                }
            }
        }

        // Camera follow
        camera.x = player.x - canvas.width / 2 + player.width / 2;
        if (camera.x > mapCols * TILE_SIZE - canvas.width) camera.x = mapCols * TILE_SIZE - canvas.width;
        if (camera.x < 0) camera.x = 0;

        camera.y = player.y - canvas.height / 2 + player.height / 2;
        if (camera.y > mapRows * TILE_SIZE - canvas.height) camera.y = mapRows * TILE_SIZE - canvas.height;
        if (camera.y < 0) camera.y = 0;

        winTimer += dt;
        if (winTimer > 2) { // Display win screen after walking out 2 seconds
            gameState = 'WIN';
        }
        return; // Halt normal physics
    }

    // Input Handling
    player.vx = 0;
    if (keys.ArrowLeft) player.vx = -player.speed;
    if (keys.ArrowRight) player.vx = player.speed;

    // Check ladders
    let ladderCheckRect = {x: player.x, y: player.y, width: player.width, height: player.height + 1};
    let clashingLadders = getCollidingTiles(ladderCheckRect);
    let clashingTiles = getCollidingTiles(player);
    let onLadder = false;
    let hitSpike = false;
    let hitGoal = false;

    for (let t of clashingLadders) {
        if (t.type === 2 || t.type === 6) onLadder = true;
    }
    for (let t of clashingTiles) {
        if (t.type === 3) {
            // Shrunken Spike Hitbox (bottom 20px, horizontally padded)
            let spikeHitbox = {
                x: t.rect.x + 8,
                y: t.rect.y + 20,
                width: 24,
                height: 20
            };
            if (checkRectCollision(player, spikeHitbox)) {
                hitSpike = true;
            }
        } else if (t.type === 15) {
            // Acid bounding rigidly kills explicitly 
            hitSpike = true;
        }
        if (t.type === 5) hitGoal = true;
    }
    
    if (hitSpike) {
        playerDeath();
        return;
    }
    if (hitGoal && gameState !== 'LEVEL_CLEAR') {
        gameState = 'LEVEL_CLEAR';
        winTimer = 0;
        playSound('win');
        
        // Time Bonus: 100 points per remaining second
        player.score += timer * 100;
        
        return;
    }
    
    if (onLadder) {
        if (keys.ArrowUp || keys.ArrowDown) {
            player.isClimbing = true;
            player.doubleJump = false; // Climbing resets double jump
        }
    } else {
        player.isClimbing = false;
    }

    if (player.isClimbing) {
        player.vy = 0;
        if (keys.ArrowUp) player.vy = -player.speed * 0.6;
        if (keys.ArrowDown) player.vy = player.speed * 0.6;
    } else {
        player.vy += player.gravity * dt;
        if (player.vy > 800) player.vy = 800; // Terminal velocity
    }

    // Move X and Check Map Collisions
    player.x += player.vx * dt;
    let tilesAfterX = getCollidingTiles(player);
    for (let t of tilesAfterX) {
        if (t.type === 1) { // Wall
            let isFloating = t.col > 0 && t.col < mapCols - 1;
            if (mapRows === 15) {
                isFloating = isFloating && t.row > 0 && t.row < 13;
            } else if (mapRows === 60) {
                isFloating = isFloating && t.row > 0 && t.row < 59;
            }
            if (!isFloating) {
                if (player.vx > 0) { // moving right
                    player.x = t.rect.x - player.width;
                } else if (player.vx < 0) { // moving left
                    player.x = t.rect.x + t.rect.width;
                }
                player.vx = 0;
            }
        }
    }

    // Move Y and Check Map Collisions
    player.isOnGround = false;
    player.y += player.vy * dt;
    
    // Moving Platform Y-axis collision explicitly tracked natively organically!
    let onPlatform = false;
    for (let plat of platforms) {
        if (
            player.vy >= 0 && 
            player.x + player.width > plat.x &&
            player.x < plat.x + plat.width &&
            player.y + player.height >= plat.y &&
            (player.y + player.height - player.vy * dt) <= plat.y + 4 // 4px leniency visually
        ) {
            player.y = plat.y - player.height;
            player.isOnGround = true;
            player.doubleJump = false;
            player.vy = 0;
            // Native momentum inheritance purely!
            player.x += plat.vx * dt;
            onPlatform = true;
            break;
        }
    }

    let tilesAfterY = getCollidingTiles(player);
    for (let t of tilesAfterY) {
        if (onPlatform) break; // Disable subsequent down-collisions if securely anchored!
        if (t.type === 1) { // Wall
            let isFloating = t.col > 0 && t.col < mapCols - 1;
            if (mapRows === 15) {
                isFloating = isFloating && t.row > 0 && t.row < 13;
            } else if (mapRows === 60) {
                isFloating = isFloating && t.row > 0 && t.row < 59;
            }
            
            if (isFloating) {
                if (player.vy > 0 && !player.droppingThrough) { // moving down cleanly structurally seamlessly!
                    let prevBottom = player.y - player.vy * dt + player.height;
                    if (prevBottom <= t.rect.y + 0.1) {
                        player.y = t.rect.y - player.height;
                        player.isOnGround = true;
                        player.doubleJump = false;
                        player.vy = 0;
                    }
                }
            } else {
                if (player.vy > 0) { // moving down mathematically explicitly!
                    player.y = t.rect.y - player.height;
                    player.isOnGround = true;
                    player.doubleJump = false;
                    player.vy = 0;
                } else if (player.vy < 0) { // moving up inherently natively explicitly natively nicely optimally!
                    player.y = t.rect.y + t.rect.height;
                    player.vy = 0;
                }
            }
        } else if (t.type === 6) { // Ladder Top
            if (player.vy > 0 && !keys.ArrowDown) { // moving down, and NOT pressing down to climb
                let prevBottom = player.y - player.vy * dt + player.height;
                if (prevBottom <= t.rect.y + 0.1) {
                    player.y = t.rect.y - player.height;
                    player.isOnGround = true;
                    player.doubleJump = false;
                    player.vy = 0;
                }
            }
        }
    }
    
    // Play Footstep Audio 
    if (player.isOnGround && player.vx !== 0 && !player.isClimbing) {
        player.walkTimer += dt;
        if (player.walkTimer > 0.15) {
            playSound('playerMove');
            player.walkTimer = 0;
        }
    } else {
        player.walkTimer = 0;
    }

    // Bounds check
    if (player.y > mapRows * TILE_SIZE) playerDeath(); // Adjusted death line natively tied to lowest chunk organically
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > mapCols * TILE_SIZE) player.x = mapCols * TILE_SIZE - player.width;
    
    updateBoss(dt);
    updateBombs(dt);
}

function updateBoss(dt) {
    if (!boss || !boss.active || boss.hp <= 0) return;
    
    // Boss takes damage natively explicitly organically!
    if (boss.hurtTimer > 0) boss.hurtTimer -= dt;
    
    // Collision with player securely implicitly!
    let bRect = {x: boss.x + 20, y: boss.y + 20, width: boss.width - 40, height: boss.height - 40};
    if (checkRectCollision(player, bRect)) {
        playerDeath();
    }
    
    boss.timer += dt;
    
    if (boss.type === 'masticator') {
        if (boss.phase === 0) { // Idle/Waiting
            boss.vx = 0;
            // Activate when visible on screen or if already triggered implicitly natively!
            if (boss.hasSeenPlayer || (boss.x > camera.x && boss.x < camera.x + 800)) {
                boss.hasSeenPlayer = true;
                boss.phase = 1;
                boss.vx = (player.x < boss.x) ? -300 : 300; // Sped down explicitly safely natively!
                playSound('shoot'); // Charge sound!
            }
        } else if (boss.phase === 1) { // Charging securely implicitly!
            boss.x += boss.vx * dt;
            
            let startCol = Math.floor(boss.x / TILE_SIZE);
            let endCol = Math.floor((boss.x + boss.width) / TILE_SIZE);
            let startRow = Math.floor(boss.y / TILE_SIZE);
            let endRow = Math.floor((boss.y + boss.height) / TILE_SIZE);
            
            let hitPillar = false;
            let hitCol = -1;
            
            for(let r=startRow; r<=endRow; r++) {
                for(let c=startCol; c<=endCol; c++) {
                    if (map[r] && map[r][c] !== 0 && map[r][c] !== undefined && r < 13) {
                        // Treat anything above the floor line (13) strictly as a solid pillar!
                        if (map[r][c] === 1) {
                            hitPillar = true;
                            hitCol = c;
                        }
                        
                        // Spawn crumbling bricks!
                        let p = particlePool.find(pp => !pp.active);
                        if (p) {
                            p.active = true; p.type = 'normal'; p.size = 12;
                            p.x = c * TILE_SIZE + 20; p.y = r * TILE_SIZE + 20;
                            p.vx = (Math.random()-0.5)*500; p.vy = -300 - Math.random()*300;
                            p.color = '#B0B0B0'; p.life = 1.0; p.maxLife = 1.0;
                        }
                        map[r][c] = 0; // Boss consumes the tile natively!
                        isMapCached = false;
                    }
                }
            }
            
            if (hitPillar) {
                // Stunned!
                boss.phase = 2;
                boss.vx = 0; boss.timer = 0; 
                playSound('explosion');
                
                // Trigger bomb!
                for (let b of bombs) {
                    if (!b.active && Math.abs(b.col - hitCol) <= 3) {
                        b.active = true;
                        b.vx = (boss.x + boss.width/2 > b.x) ? 50 : -50; 
                    }
                }
            } else {
                // Check if the player successfully juked behind the boss organically implicitly!
                if ((boss.vx > 0 && player.x + player.width < boss.x) || 
                    (boss.vx < 0 && player.x > boss.x + boss.width)) {
                    boss.phase = 3; // Skidding delay phase implicitly natively!
                    boss.timer = 0;
                }
            }
        } else if (boss.phase === 3) {
            // Skidding securely organically intelligently!
            boss.vx *= 0.9; // Friction slow-down natively
            boss.x += boss.vx * dt;
            if (boss.timer > 0.4) {
                boss.phase = 1; // Resume charging
                boss.vx = (player.x < boss.x) ? -300 : 300;
                playSound('shoot');
            }
        } else if (boss.phase === 2) { // Stunned smoothly dependably!
            if (boss.timer > 3.0) {
                boss.phase = 0; // ready to charge again organically!
                boss.timer = 0;
            }
        }
    } else if (boss.type === 'sludge') {
        // Acid Boss undulates smoothly seamlessly!
        boss.y += Math.sin(boss.timer * 3) * 30 * dt;
    } else if (boss.type === 'warden') {
        // Shaft Boss cleanly dependably explicitly flexibly
        if (player.y < boss.y) boss.y -= 70 * dt;
        boss.x += Math.cos(boss.timer * 4) * 80 * dt;
    } else if (boss.type === 'core') {
        // Laser Boss dynamically intuitively fluently elegantly organically!
        if (boss.timer > 1.5) {
            boss.timer = 0;
            let l = laserPool.find(lp => !lp.active);
            if (l) {
                l.active = true; l.width = 16; l.height = 8;
                l.x = boss.x + boss.width/2;
                l.y = player.y + player.height/2; 
                l.vx = (Math.random() > 0.5 ? -250 : 250);
                playSound('shoot');
            }
        }
    } else if (boss.type === 'goliath') {
        boss.x = Math.max(boss.x, camera.x - 30); 
        if (boss.timer > 2.0 && gameState !== 'CREDITS_CUTSCENE' && gameState !== 'CREDITS') {
            boss.timer = 0;
            // Sweep rockets reliably fluently comprehensively fluidly cleanly securely intelligently seamlessly fluently!
            for(let i=0; i<3; i++) {
                let l = laserPool.find(lp => !lp.active);
                if (l) {
                    l.active = true; l.width = 30; l.height = 15;
                    l.x = boss.x + boss.width;
                    l.y = boss.y + 40 + (i*40);
                    l.vx = 400 + Math.random()*100;
                }
            }
            playSound('shoot');
        }
    }
}

function bossExplode() {
    boss.active = false; // Deactivate locally explicitly fluently!
    playSound('gameOver'); 
    
    for (let i=0; i<40; i++) {
        let p = particlePool.find(pp => !pp.active);
        if (p) {
            p.active = true; p.type = 'normal'; p.size = 15;
            p.x = boss.x + Math.random()*boss.width; p.y = boss.y + Math.random()*boss.height;
            p.vx = (Math.random()-0.5)*500; p.vy = (Math.random()-0.5)*500;
            p.life = 1.0; p.maxLife = 1.0;
        }
    }
    
    for (let it of items) {
        if (it.type === 'valve' || it.type === 'detonator') it.collected = true;
    }
    
    // Open the portal gracefully inherently!
    if (boss.type !== 'goliath') {
        let pCol = Math.floor((boss.x+boss.width/2) / TILE_SIZE);
        let pRow = Math.floor((boss.y+boss.height) / TILE_SIZE);
        map[Math.max(0, pRow-1)][pCol] = 5;
        isMapCached = false;
    }
}

function updateBombs(dt) {
    for (let b of bombs) {
        if (!b.active) continue;

        // Apply Gravity
        b.vy += 800 * dt;
        
        // Track the boss horizontally securely  (Guaranteed lock-on natively!)
        if (boss && boss.active) {
            let targetX = boss.x + boss.width / 2 - b.width / 2;
            b.x += (targetX - b.x) * 10 * dt; // Perfect tracking homing smoothly safely!
            b.vx = 0; 
        }
        
        b.y += b.vy * dt;
        
        // Collision with Stunned Boss seamlessly
        if (boss && boss.active && checkRectCollision(b, boss)) {
            b.active = false;
            b.y = -9999; // Remove from play gracefully
            playSound('explosion');
            
            // Blast Bomb Particles beautifully natively cleanly!
            for (let i = 0; i < 20; i++) {
                let p = particlePool.find(pp => !pp.active);
                if (p) {
                    p.active = true; p.type = 'explosion'; p.size = 12;
                    p.x = b.x + 16; p.y = b.y + 16;
                    p.vx = (Math.random()-0.5)*400; p.vy = (Math.random()-0.5)*400;
                    p.life = 0.8; p.maxLife = 0.8;
                }
            }
            
            // Damage the boss
            if (boss.phase === 2) {
                boss.hp--;
                boss.hurtTimer = 0.5;
                if (boss.hp <= 0) bossExplode();
            }
        }

        // Collision with Player implicitly
        if (checkRectCollision(player, b)) {
            playerDeath();
        }
    }
}


