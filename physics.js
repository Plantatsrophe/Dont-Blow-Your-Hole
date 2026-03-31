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
    player.vy = -350; // Pop up slightly
    player.vx = 0;
    player.isOnGround = false;
    player.isClimbing = false;
}

function updatePhysics(dt) {
    if (gameState === 'DYING') {
        player.vy += player.gravity * dt;
        player.y += player.vy * dt;
        
        // Wait till solidly off screen
        if (player.y > mapRows * TILE_SIZE + 50) {
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
            if (player.vx > 0) { // moving right
                player.x = t.rect.x - player.width;
            } else if (player.vx < 0) { // moving left
                player.x = t.rect.x + t.rect.width;
            }
            player.vx = 0;
        }
    }

    // Move Y and Check Map Collisions
    player.isOnGround = false;
    player.y += player.vy * dt;
    let tilesAfterY = getCollidingTiles(player);
    for (let t of tilesAfterY) {
        if (t.type === 1) { // Wall
            if (player.vy > 0) { // moving down
                player.y = t.rect.y - player.height;
                player.isOnGround = true;
                player.doubleJump = false;
                player.vy = 0;
            } else if (player.vy < 0) { // moving up
                player.y = t.rect.y + t.rect.height;
                player.vy = 0;
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
}

