let lastDownPressTime = 0;

function processDownInput(el) {
    if (!keys.ArrowDown) {
        let now = Date.now();
        if (now - lastDownPressTime < 300) {
            player.droppingThrough = true;
            setTimeout(() => { player.droppingThrough = false; }, 200);
        }
        lastDownPressTime = now;
    }
    keys.ArrowDown = true;
    if (el) el.classList.add('active');
}

window.addEventListener('keydown', (e) => {
    document.getElementById('touch-controls').style.display = 'none'; // Auto-hide on Desktop

    if (!audioCtx) initAudio();

    if (gameState === 'START' && !isMusicPlaying) {
        startBackgroundMusic();
    }

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.ArrowRight = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.ArrowUp = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') processDownInput(null);
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
            code++; if (code > 90) code = 65;
            initials[initialIndex] = String.fromCharCode(code);
        }
        if (e.code === 'ArrowDown') {
            let code = initials[initialIndex].charCodeAt(0);
            code--; if (code < 65) code = 90;
            initials[initialIndex] = String.fromCharCode(code);
        }
        if (e.code === 'Enter') handleUIAccept();
    } else if (gameState === 'START' || gameState === 'INTRO' || gameState === 'GAMEOVER' || gameState === 'WIN' || gameState === 'INSTRUCTIONS') {
        if (e.code === 'Enter') handleUIAccept();
    }
});

function handleUIAccept() {
    if (gameState === 'ENTER_INITIALS') {
        saveScore();
        resetFullGame();
        gameState = 'START';
    } else if (gameState === 'WIN') {
        currentLevel++;
        if (currentLevel >= staticLevels.length) currentLevel = 0;
        timer = 60;
        parseMap();
        resetPlayerPosition();
        gameState = 'PLAYING';
    } else if (gameState === 'GAMEOVER') {
        gameState = 'ENTER_INITIALS';
    } else if (gameState === 'START') {
        introY = document.getElementById('gameCanvas').height * 0.66;
        gameState = 'INTRO';
    } else if (gameState === 'INTRO') {
        gameState = 'INSTRUCTIONS';
    } else if (gameState === 'INSTRUCTIONS') {
        currentLevel = 0;
        resetFullGame();
        initAudio();
        startBackgroundMusic();
        gameState = 'PLAYING';
    }
}

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.ArrowRight = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.ArrowUp = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.ArrowDown = false;
    if (e.code === 'Space') spacePressed = false;
});

// --- TOUCH CONTROLS ---
let isTouchMode = false;

function executeTouchStart(e) {
    if (e.type === 'touchstart') e.preventDefault();
    if (!isTouchMode) {
        isTouchMode = true;
        document.getElementById('touch-controls').style.display = 'flex';
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => { });
        }
    }

    if (!audioCtx) initAudio();
    if (gameState === 'START' && !isMusicPlaying) startBackgroundMusic();

    if (gameState === 'WIN' || gameState === 'GAMEOVER' || gameState === 'ENTER_INITIALS') {
        let cX = e.touches ? e.touches[0].clientX : e.clientX;
        let cY = e.touches ? e.touches[0].clientY : e.clientY;
        let canvas = document.getElementById('gameCanvas');
        let rect = canvas.getBoundingClientRect();
        let cx = (cX - rect.left) * (canvas.width / rect.width);
        let cy = (cY - rect.top) * (canvas.height / rect.height);
        
        if (cx >= canvas.width / 2 - 120 && cx <= canvas.width / 2 + 120 && cy >= canvas.height - 80 && cy <= canvas.height - 40) {
            let encodedStr = encodeURIComponent(`I just scored ${player.score} in Don't Die! Can you out-survive me?`);
            window.open('https://twitter.com/intent/tweet?text=' + encodedStr, '_blank');
            return; // Explicitly halt state transition organically
        }
    }

    if (gameState === 'WIN' || gameState === 'GAMEOVER' || gameState === 'START' || gameState === 'INTRO' || gameState === 'INSTRUCTIONS' || gameState === 'ENTER_INITIALS') {
        handleUIAccept();
        return;
    }

    handleTouch(e);
}

document.addEventListener('touchstart', executeTouchStart, { passive: false });
document.addEventListener('mousedown', executeTouchStart, { passive: false });

document.addEventListener('touchmove', handleTouch, { passive: false });
document.addEventListener('mousemove', handleTouch, { passive: false });
document.addEventListener('touchend', handleTouch, { passive: false });
document.addEventListener('touchcancel', handleTouch, { passive: false });
document.addEventListener('mouseup', handleTouch, { passive: false });

function handleTouch(e) {
    if (gameState !== 'PLAYING') return;

    // Securely bypass and ignore legacy synthesized MouseEvents natively on mobile devices to prevent key resets!
    if (isTouchMode && !e.touches) return;

    // Reset inputs structurally iterating all active touches elegantly
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
    keys.ArrowDown = false;
    let currentlyPressingSpace = false;

    document.getElementById('btn-left').classList.remove('active');
    document.getElementById('btn-right').classList.remove('active');
    document.getElementById('btn-up').classList.remove('active');
    document.getElementById('btn-down').classList.remove('active');
    document.getElementById('btn-jump').classList.remove('active');

    // Handle Native Multi-touch inputs structurally
    if (e.touches) {
        for (let i = 0; i < e.touches.length; i++) {
            let touch = e.touches[i];
            let el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!el) continue;

            if (el.id === 'btn-left') { keys.ArrowLeft = true; el.classList.add('active'); }
            else if (el.id === 'btn-right') { keys.ArrowRight = true; el.classList.add('active'); }
            else if (el.id === 'btn-up') { keys.ArrowUp = true; el.classList.add('active'); }
            else if (el.id === 'btn-down') { processDownInput(el); }
            else if (el.id === 'btn-jump') { currentlyPressingSpace = true; el.classList.add('active'); }
        }
    } 
    // Handle fallback generic Desktop Mouse Tracking seamlessly!
    else if (e.clientX !== undefined) {
        if (e.buttons > 0 || e.type === 'mousedown') {
            let el = document.elementFromPoint(e.clientX, e.clientY);
            if (el) {
                if (el.id === 'btn-left') { keys.ArrowLeft = true; el.classList.add('active'); }
                else if (el.id === 'btn-right') { keys.ArrowRight = true; el.classList.add('active'); }
                else if (el.id === 'btn-up') { keys.ArrowUp = true; el.classList.add('active'); }
                else if (el.id === 'btn-down') { processDownInput(el); }
                else if (el.id === 'btn-jump') { currentlyPressingSpace = true; el.classList.add('active'); }
            }
        }
    }

    if (currentlyPressingSpace) {
        if (!spacePressed) {
            handleJump();
            spacePressed = true;
        }
    } else {
        spacePressed = false;
    }
}
// ----------------------

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
        platforms = [];
    }
    particles = [];
    isMapCached = false;
    offscreenMapCanvas.width = mapCols * TILE_SIZE;
    offscreenMapCanvas.height = mapRows * TILE_SIZE;

    for (let row = 0; row < mapRows; row++) {
        let rowData = [];
        for (let col = 0; col < mapCols; col++) {
            let char = currentMapData[row][col];
            let tile = parseInt(char, 10);
            if (char === 'H') tile = 11;
            else if (char === 'C') tile = 14;
            else if (char === 'A') tile = 15;

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
            } else if (tile === 14) {
                if (resetEntities) {
                    items.push({ x: col * TILE_SIZE, y: row * TILE_SIZE, width: 32, height: 32, collected: false, type: 'checkpoint' });
                }
                rowData.push(0);
            } else if (char === 'P') {
                if (resetEntities) {
                    platforms.push({
                        x: col * TILE_SIZE,
                        y: row * TILE_SIZE + 8,
                        width: TILE_SIZE * 1.5,
                        height: 16,
                        vx: 60,
                        minX: (col - 3) * TILE_SIZE,
                        maxX: (col + 3) * TILE_SIZE
                    });
                }
                rowData.push(0);
                // Spawn logically defaults locally in strings!
            } else if (char === '7' || (row === 12 && col === 1)) {
                if (resetEntities) {
                    player.startX = col * TILE_SIZE + 6;
                    player.startY = (row + 1) * TILE_SIZE - player.height;
                }
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
    gameStartTime = new Date().getTime(); // Anchor runtime securely
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
                if (player.startX !== i.x + 8 || player.startY !== i.y + 8) {
                    player.startX = i.x + 8;
                    player.startY = i.y + 8;
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
    }

    render();
    requestAnimationFrame(gameLoop);
}

// Init
parseMap();
resetPlayerPosition();
requestAnimationFrame(gameLoop);

