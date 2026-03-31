window.addEventListener('keydown', (e) => {
    if (!audioCtx) initAudio();
    
    if (gameState === 'START' && !isMusicPlaying) {
        startBackgroundMusic();
    }
    
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.ArrowRight = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.ArrowUp = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.ArrowDown = true;
    if (e.code === 'Space') {
        if (!spacePressed) {
            handleJump();
            spacePressed = true;
        }
    }
    
    if (gameState === 'ENTER_INITIALS') {
        if (e.code === 'ArrowLeft') initialIndex = Math.max(0, initialIndex - 1);
        if (e.code === 'ArrowRight') initialIndex = Math.min(2, initialIndex + 1);
        if (e.code === 'ArrowUp') {
            let code = initials[initialIndex].charCodeAt(0);
            code++; if(code>90) code=65;
            initials[initialIndex] = String.fromCharCode(code);
        }
        if (e.code === 'ArrowDown') {
            let code = initials[initialIndex].charCodeAt(0);
            code--; if(code<65) code=90;
            initials[initialIndex] = String.fromCharCode(code);
        }
        if (e.code === 'Enter') {
            saveScore();
            resetFullGame();
            gameState = 'START';
        }
    } else if (gameState === 'START' || gameState === 'GAMEOVER' || gameState === 'WIN' || gameState === 'INSTRUCTIONS') {
        if (e.code === 'Enter') {
            if (gameState === 'WIN') {
                currentLevel++;
                if (currentLevel >= staticLevels.length) {
                    currentLevel = 0; // Loop successfully explicitly!
                }
                timer = 60;
                parseMap();
                resetPlayerPosition();
                gameState = 'PLAYING';
            } else if (gameState === 'GAMEOVER') {
                gameState = 'ENTER_INITIALS';
            } else if (gameState === 'START') {
                gameState = 'INSTRUCTIONS';
            } else if (gameState === 'INSTRUCTIONS') {
                currentLevel = 0;
                resetFullGame();
                initAudio();
                startBackgroundMusic();
                gameState = 'PLAYING';
            }
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.ArrowRight = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.ArrowUp = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.ArrowDown = false;
    if (e.code === 'Space') spacePressed = false;
});

function handleJump() {
    if (gameState !== 'PLAYING') return;
    
    if (player.isOnGround || player.isClimbing) {
        player.vy = player.jumpPower;
        player.isOnGround = false;
        player.isClimbing = false;
        player.doubleJump = true;
        playSound('jump');
    } else if (player.doubleJump) {
        player.vy = player.jumpPower * 0.9;
        player.doubleJump = false;
        playSound('jump');
    }
}

function parseMap(resetEntities = true) {
    let currentMapData = staticLevels[currentLevel].map;
    mapRows = currentMapData.length;
    mapCols = currentMapData[0].length;

    map = [];
    if (resetEntities) {
        items = [];
        enemies = [];
        lasers = [];
    }
    particles = [];
    
    for (let row = 0; row < mapRows; row++) {
        let rowData = [];
        for (let col = 0; col < mapCols; col++) {
            let char = currentMapData[row][col];
            let tile = parseInt(char, 10);
            if (char === 'H') tile = 11;

            if (tile === 4) {
                if (resetEntities) {
                    items.push({ x: col * TILE_SIZE + 8, y: row * TILE_SIZE + 8, width: 24, height: 24, collected: false, type: 'cash' });
                }
                rowData.push(0); 
            } else if (tile === 11) {
                if (resetEntities) {
                    items.push({ x: col * TILE_SIZE + 8, y: row * TILE_SIZE + 8, width: 24, height: 24, collected: false, type: 'hotdog' });
                }
                rowData.push(0); 
            // Spawn logically defaults locally in strings!
            } else if (char === '7' || (row === 12 && col === 1)) {
                player.startX = col * TILE_SIZE + 6;
                player.startY = (row + 1) * TILE_SIZE - player.height;
                rowData.push(0);
            } else if (tile === 8) {
                if (resetEntities) {
                    enemies.push({
                        type: 'bot',
                        x: col * TILE_SIZE + 8,
                        y: (row + 1) * TILE_SIZE - 24,
                        width: 24, height: 24,
                        vx: 50, dir: 1, color: '#ff2222'
                    });
                }
                rowData.push(0);
            } else if (char === 'L') {
                if (resetEntities) {
                    enemies.push({
                        type: 'laserBot',
                        x: col * TILE_SIZE + 8,
                        y: (row + 1) * TILE_SIZE - 24,
                        width: 24, height: 24,
                        vx: 0, dir: -1, cooldown: 1.0 
                    });
                }
                rowData.push(0);
            } else {
                rowData.push(tile);
            }
        }
        map.push(rowData);
    }
}

function resetPlayerPosition() {
    player.x = player.startX;
    player.y = player.startY;
    player.vx = 0;
    player.vy = 0;
}

function resetFullGame() {
    player.lives = 3;
    player.score = 0;
    timer = 60;
    parseMap();
    resetPlayerPosition();
}

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
                    lasers.push({
                        x: e.dir === 1 ? e.x + e.width : e.x - 16,
                        y: e.y + 4,
                        width: 16, height: 4,
                        vx: 350 * e.dir
                    });
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
                
                // Smoke Particles
                for (let pCounter = 0; pCounter < 15; pCounter++) {
                    particles.push({
                        x: e.x + e.width / 2,
                        y: e.y + e.height / 2,
                        vx: (Math.random() - 0.5) * 150,
                        vy: (Math.random() - 0.5) * 150 - 50,
                        size: Math.random() * 8 + 4,
                        life: 0.3 + Math.random() * 0.3,
                        maxLife: 0.6
                    });
                }
                
                enemies.splice(i, 1);
            } else {
                playerDeath();
                return;
            }
        }
    }
    
    // Laser Physics Engine natively decoupled 
    for (let i = lasers.length - 1; i >= 0; i--) {
        let l = lasers[i];
        l.x += l.vx * dt;
        
        let lTiles = getCollidingTiles(l);
        let hitWall = false;
        for (let t of lTiles) {
            if (t.type === 1) hitWall = true;
        }
        
        if (hitWall || l.x < 0 || l.x > mapCols * TILE_SIZE) {
            lasers.splice(i, 1);
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

    // Particle update
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.size *= 0.95; // Shrink slightly
        if (p.life <= 0) particles.splice(i, 1);
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
    }

    render();
    requestAnimationFrame(gameLoop);
}

// Init
parseMap();
resetPlayerPosition();
requestAnimationFrame(gameLoop);

