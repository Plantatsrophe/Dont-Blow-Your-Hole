function drawSprite(ctx, spr, x, y, w, h, flipX) {
    let gridSize = Math.sqrt(spr.length);
    let pxW = w / gridSize;
    let pxH = h / gridSize;
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            let colIndex = flipX ? (gridSize - 1 - c) : c;
            let val = spr[r * gridSize + colIndex];
            if (val !== 0 && pal[val]) {
                ctx.fillStyle = pal[val];
                ctx.fillRect(x + c * pxW, y + r * pxH, pxW + 0.5, pxH + 0.5);
            }
        }
    }
}

function drawKey(ctx, x, y, w, h, label) {
    ctx.fillStyle = '#555'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#888'; ctx.fillRect(x, y, w, 3); ctx.fillRect(x, y, 3, h);
    ctx.fillStyle = '#222'; ctx.fillRect(x, y + h - 4, w, 4); ctx.fillRect(x + w - 4, y, 4, h);
    ctx.fillStyle = '#444'; ctx.fillRect(x + 3, y + 3, w - 7, h - 7);
    ctx.fillStyle = 'white';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    if (label === 'UP') { ctx.beginPath(); ctx.moveTo(x + w/2, y + h/2 - 4); ctx.lineTo(x + w/2 - 6, y + h/2 + 4); ctx.lineTo(x + w/2 + 6, y + h/2 + 4); ctx.fill(); }
    else if (label === 'DOWN') { ctx.beginPath(); ctx.moveTo(x + w/2, y + h/2 + 4); ctx.lineTo(x + w/2 - 6, y + h/2 - 4); ctx.lineTo(x + w/2 + 6, y + h/2 - 4); ctx.fill(); }
    else if (label === 'LEFT') { ctx.beginPath(); ctx.moveTo(x + w/2 - 4, y + h/2); ctx.lineTo(x + w/2 + 4, y + h/2 - 6); ctx.lineTo(x + w/2 + 4, y + h/2 + 6); ctx.fill(); }
    else if (label === 'RIGHT') { ctx.beginPath(); ctx.moveTo(x + w/2 + 4, y + h/2); ctx.lineTo(x + w/2 - 4, y + h/2 - 6); ctx.lineTo(x + w/2 - 4, y + h/2 + 6); ctx.fill(); }
    else { ctx.fillText(label, x + w/2, y + h/2 + 4); }
}

function drawGlow(ctx, x, y, radius, colorStr) {
    let grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, colorStr);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
}

function drawMasticator(ctx, boss) {
    let cx = boss.x;
    let cy = boss.y;
    let bw = boss.width;
    let bh = boss.height;

    let dir = boss.vx < 0 ? -1 : 1; 

    // Short Legs
    ctx.fillStyle = '#888';
    ctx.fillRect(cx + 10, cy + bh, 15, 15);
    ctx.fillRect(cx + bw - 25, cy + bh, 15, 15);
    // Feet
    ctx.fillStyle = '#555';
    ctx.fillRect(cx + 5, cy + bh + 10, 20, 5);
    ctx.fillRect(cx + bw - 30, cy + bh + 10, 20, 5);

    // Short Arms
    ctx.fillStyle = '#888';
    ctx.fillRect(cx - 15, cy + 30, 15, 30);
    ctx.fillRect(cx + bw, cy + 30, 15, 30);

    // Giant Metallic Sword (held in leading hand)
    let sHx = (dir === -1) ? (cx - 30) : (cx + bw + 15);
    let sHy = cy + 50; 

    // Sword Blade
    ctx.fillStyle = '#EaEaEa';
    ctx.beginPath();
    ctx.moveTo(sHx - 10, sHy);
    ctx.lineTo(sHx - 10, sHy - 70);
    ctx.lineTo(sHx, sHy - 90);       // Tip
    ctx.lineTo(sHx + 10, sHy - 70);
    ctx.lineTo(sHx + 10, sHy);
    ctx.fill();
    // Sword Edge Highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(sHx, sHy);
    ctx.lineTo(sHx, sHy - 90);
    ctx.lineTo(sHx + 10, sHy - 70);
    ctx.lineTo(sHx + 10, sHy);
    ctx.fill();
    // Sword Handle
    ctx.fillStyle = '#111';
    ctx.fillRect(sHx - 6, sHy, 12, 24); // Solid black seamless handle
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(sHx - 4, sHy + 20, 8, 8); // Pommel gem

    // Chassis
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(cx, cy, bw, bh);
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(cx + bw - 20, cy, 20, bh); 

    // Eyes
    let eyeY = cy + 15;
    let eyeW = 18;
    let eyeH = 10;
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(cx + 15, eyeY, eyeW, eyeH);
    ctx.fillRect(cx + bw - 15 - eyeW, eyeY, eyeW, eyeH);
    drawGlow(ctx, cx + 15 + eyeW/2, eyeY + eyeH/2, 20, 'rgba(255, 0, 0, 0.6)');
    drawGlow(ctx, cx + bw - 15 - eyeW/2, eyeY + eyeH/2, 20, 'rgba(255, 0, 0, 0.6)');

    // Mouth
    let mouthY = cy + 45;
    let mouthH = (boss.phase === 2) ? 35 : 20; 
    ctx.fillStyle = '#111';
    ctx.fillRect(cx + 10, mouthY, bw - 20, mouthH);
    
    // Teeth
    ctx.fillStyle = '#FFF';
    for (let tx = 15; tx < bw - 20; tx += 15) {
        ctx.beginPath(); ctx.moveTo(cx + tx, mouthY); ctx.lineTo(cx + tx + 10, mouthY + 8); ctx.lineTo(cx + tx + 20, mouthY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + tx, mouthY + mouthH); ctx.lineTo(cx + tx + 10, mouthY + mouthH - 8); ctx.lineTo(cx + tx + 20, mouthY + mouthH); ctx.fill();
    }

    // Stunned Sparks
    if (boss.phase === 2 && Math.random() > 0.5) {
        ctx.fillStyle = '#FFFF00'; 
        ctx.fillRect(cx + Math.random()*bw, cy + Math.random()*bh, 4, 4);
    }
    
    // Damage Flash
    if (boss.hurtTimer > 0) { 
        ctx.fillStyle = 'white'; ctx.globalAlpha = 0.5; ctx.fillRect(cx, cy, bw, bh); ctx.globalAlpha = 1; 
    }
}

function render() {
    let bId = Math.floor(currentLevel / 20) % 5;

    // Parallax Layer 0: Sky dynamically maps bounds implicitly to active Biome gracefully!
    let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (bId === 1) { // Acid
        skyGradient.addColorStop(0, '#0a1a0f'); skyGradient.addColorStop(1, '#1b5c21');
    } else if (bId === 2) { // Shaft
        skyGradient.addColorStop(0, '#030014'); skyGradient.addColorStop(1, '#2c0c4a');
    } else if (bId === 3) { // Factory
        skyGradient.addColorStop(0, '#050f14'); skyGradient.addColorStop(1, '#1a4159');
    } else if (bId === 4) { // Goliath
        skyGradient.addColorStop(0, '#2b0202'); skyGradient.addColorStop(1, '#7a0505');
    } else { // Slums
        skyGradient.addColorStop(0, '#0a0a1a'); skyGradient.addColorStop(1, '#a34110');
    }
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Contextual Sub-Parallax Execution!
    if (bId === 0) {
        // Biome 0: Slums - City Skyline with Windows
        let px = camera.x * 0.2; // 20% parallax speed
        for (let i = 0; i < 30; i++) {
            let h = 80 + (Math.sin(i * 999) * 40);
            let w = 40 + (Math.cos(i * 777) * 20);
            let x = ((i * 60) - px) % (canvas.width + 100);
            if (x < -100) x += canvas.width + 200;
            ctx.fillStyle = '#05050f';
            ctx.fillRect(x, canvas.height - h, w, h);
            
            // Illuminated Windows
            ctx.fillStyle = '#f1c40f'; // Yellow window light
            for (let wy = canvas.height - h + 10; wy < canvas.height - 10; wy += 15) {
                for (let wx = x + 5; wx < x + w - 5; wx += 10) {
                    if (Math.sin(i * wx * wy) > 0.5) {
                        ctx.fillRect(wx, wy, Math.sin(wx)>0?2:1, Math.sin(wy)>0?2:1);
                    }
                }
            }
        }
        // Drones
        ctx.fillStyle = '#05050f';
        let d1 = (Date.now() / 40) % (canvas.width + 200) - 100;
        ctx.fillRect(canvas.width - d1, 60 + Math.sin(Date.now()/700)*15, 6, 2);
    } else if (bId === 1) {
        // Biome 1: Acid - Deep Sewer Tunnels (Rusted Dripping Pipes)
        let px = camera.x * 0.3;
        
        // Massive Horizontal Overhead Pipe
        ctx.fillStyle = '#2a140b';
        ctx.fillRect(0, 0, canvas.width, 40);
        ctx.fillStyle = '#170a05';
        ctx.fillRect(0, 30, canvas.width, 10);
        
        // Animated Acid Drips from the overhead pipe
        for(let j = 0; j < 8; j++) {
            let hX = ((j * 150) - px * 1.5) % (canvas.width + 100);
            if (hX < -100) hX += canvas.width + 200;
            
            let hDripY = 40 + ((Date.now() / (12 + (j%3)*4)) % (canvas.height - 80));
            ctx.fillStyle = '#3ee855'; // Glowy Acid Green
            ctx.fillRect(hX, hDripY, 3, 15 + (j%2)*5);
            ctx.fillStyle = '#1b5c21'; // Dark trail
            ctx.fillRect(hX, hDripY - 8, 3, 4);
        }

        // Background Vertical Rusty Pipes
        for(let i = 0; i < 6; i++) {
            let x = ((i * 200) - px) % (canvas.width + 200);
            if(x < -200) x += canvas.width + 400;
            
            // Vertical Pipe Cylinder
            ctx.fillStyle = '#3a1f11'; // Rusty brown body
            ctx.fillRect(x, 0, 40, canvas.height);
            ctx.fillStyle = '#1c0e07'; // Shadow
            ctx.fillRect(x + 25, 0, 15, canvas.height);
            
            // Rusty Joints / Collars
            ctx.fillStyle = '#4a2817';
            ctx.fillRect(x - 5, 100 + (i%3)*50, 50, 20);
            ctx.fillStyle = '#261209';
            ctx.fillRect(x - 5, 115 + (i%3)*50, 50, 5);
            
            // Drip slipping off the joint
            let dripY = 120 + (i%3)*50 + ((Date.now() / (10 + (i%2)*5)) % (canvas.height - 150));
            ctx.fillStyle = '#3ee855'; 
            ctx.fillRect(x + 10, dripY, 3, 10 + (i%4)*5); // Stretched leading edge
            ctx.fillRect(x + 10, dripY - 5, 3, 3); // Trailing dot
        }
        // Horizontal Base Sludge River
        ctx.fillStyle = '#07170a';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
        ctx.fillStyle = '#1b5c21';
        let sOff = (Date.now() / 30) % 30;
        for (let i = 0; i < canvas.width; i += 30) {
            ctx.fillRect(i - sOff, canvas.height - 35, 15, 3);
            ctx.fillRect(i - sOff + 10, canvas.height - 25, 20, 3);
        }
    } else if (bId === 2) {
        // Biome 2: Shaft - Diagonal Chain Mesh & Gears
        let py = camera.y * 0.4; // Vertical Parallax!
        ctx.strokeStyle = '#221333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = -10; i < 20; i++) {
            let offset = (i * 50 + py) % (canvas.height + 500);
            if (offset < -300) offset += canvas.height + 600;
            ctx.moveTo(0, offset); ctx.lineTo(canvas.width, offset + canvas.width);
            ctx.moveTo(canvas.width, offset); ctx.lineTo(0, offset + canvas.width);
        }
        ctx.stroke();
        
        for (let i = 0; i < 4; i++) {
            let gy = (-py * 0.6 + i * 250) % (canvas.height + 150);
            if (gy < -150) gy += canvas.height + 300;
            let gx = 80 + (i * 140) % canvas.width;
            ctx.save();
            ctx.translate(gx, gy);
            ctx.rotate(Date.now() / (800 + i*300));
            ctx.globalAlpha = 0.2;
            ctx.scale(3, 3); // Giant gears
            drawSprite(ctx, sprGear, -12, -12, 24, 24, false);
            ctx.restore();
        }
    } else if (bId === 3) {
        // Biome 3: Laser Factory - Angled Circuit Traces
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        let px = camera.x * 0.15;
        for (let i = 0; i < 9; i++) {
            let sY = 50 + i * 50;
            let sX = ((i * 140) - px) % (canvas.width + 300);
            if (sX < -150) sX += canvas.width + 400;
            
            ctx.beginPath();
            ctx.moveTo(sX, sY);
            ctx.lineTo(sX + 60, sY);
            ctx.lineTo(sX + 100, sY + (i%2===0?40:-40));
            ctx.lineTo(sX + 220, sY + (i%2===0?40:-40));
            ctx.stroke();
            
            let glow = 0.3 + Math.abs(Math.sin(Date.now() / 250 + i)) * 0.7;
            ctx.fillStyle = `rgba(0, 255, 255, ${glow})`;
            ctx.beginPath();
            ctx.arc(sX + 220, sY + (i%2===0?40:-40), 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#050f14';
            ctx.beginPath();
            ctx.arc(sX + 220, sY + (i%2===0?40:-40), 4, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (bId === 4) {
        // Biome 4: Goliath - Cracked Moon and Clouds
        if (Math.random() > 0.95) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'; // Lightning strike
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        let px = camera.x * 0.05; // Extreme distance
        let mX = (canvas.width * 0.75 - px) % (canvas.width + 400);
        if (mX < -250) mX += canvas.width + 600;
        
        ctx.fillStyle = '#db2323';
        ctx.beginPath(); ctx.arc(mX, 180, 120, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7a0505';
        ctx.beginPath(); ctx.arc(mX - 30, 130, 25, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(mX + 45, 220, 35, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(mX - 50, 240, 15, 0, Math.PI * 2); ctx.fill();
        
        // Fast horizontal jagged clouds
        ctx.fillStyle = 'rgba(43, 2, 2, 0.85)';
        let cx = camera.x * 0.4;
        for (let i = 0; i < 7; i++) {
            let cX = ((i * 180) - cx - (Date.now()/12 % canvas.width)) % (canvas.width + 300);
            if (cX < -200) cX += canvas.width + 500;
            let cY = 70 + i * 60;
            ctx.fillRect(cX, cY, 160 + (i%4)*60, 25);
            ctx.fillRect(cX + 30, cY - 10, 100, 10); // Jagged edge
        }
    }

    if (gameState === 'START') {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- Pixelated Background Logo ---
        if (!window.logoLoaded && typeof logoBase64 !== 'undefined') {
            window.logoLoaded = new Image();
            window.logoLoaded.src = logoBase64;
        }
        let logoImg = window.logoLoaded;
        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
            if (!window.logoOsc) {
                // Calculate native 8-bit downscaling ratio to accurately square pixels
                let ratio = logoImg.naturalWidth / logoImg.naturalHeight;
                let nw = 160;
                let nh = Math.round(160 / ratio);
                window.logoOsc = document.createElement('canvas');
                window.logoOsc.width = nw;
                window.logoOsc.height = nh;
                window.logoOsc.ctx = window.logoOsc.getContext('2d');
                window.logoOsc.ctx.drawImage(logoImg, 0, 0, nw, nh);
            }
            
            // Draw that tiny buffer natively scaled to canvas dimensions with smoothing disabled!
            ctx.imageSmoothingEnabled = false;
            ctx.globalAlpha = 0.35; // Distinct faded watermark
            // Center the image preserving aspect ratio perfectly mapping square clusters
            let scaleRatio = canvas.width / window.logoOsc.width;
            let displayH = window.logoOsc.height * scaleRatio;
            let yOffset = (canvas.height - displayH) / 2;
            
            ctx.drawImage(window.logoOsc, 0, 0, window.logoOsc.width, window.logoOsc.height, 0, yOffset, canvas.width, displayH);
            ctx.globalAlpha = 1.0;
        }
        // ---------------------------------

        ctx.fillStyle = '#f1c40f'; // Golden visual theme
        ctx.textAlign = 'center';
        ctx.font = '25px "Press Start 2P"';
        ctx.fillText("DON'T DIE", canvas.width / 2, canvas.height / 2 - 140);
        
        ctx.font = '15px "Press Start 2P"';
        ctx.fillStyle = '#f1c40f'; 
        ctx.fillText("A GRFC™ GAME", canvas.width / 2, canvas.height / 2 - 110);
        
        ctx.fillStyle = '#f1c40f';
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillText('PRESS ENTER TO START', canvas.width / 2, 540);
        }
        
        ctx.fillStyle = '#f1c40f';
        ctx.fillText('TOP 10 SURVIVORS', canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillStyle = '#f1c40f';
        ctx.font = '10px "Press Start 2P"';
        for (let i = 0; i < highScores.length; i++) {
            let hs = highScores[i];
            let rankStr = (i + 1).toString().padStart(2, ' ');
            let nameStr = hs.name.padEnd(8, ' ');
            let scoreStr = hs.score.toString().padStart(7, ' ');
            ctx.fillText(`${rankStr}. ${nameStr} ... ${scoreStr}`, canvas.width / 2, canvas.height / 2 + (i * 15));
        }
        
        // --- Scoreboard Framing Decorations ---
        let sbY = canvas.height / 2 + 15;
        let sprFlip = Math.floor(Date.now() / 600) % 2 === 0;
        
        // Left flank (Player & Hotdog)
        drawSprite(ctx, sprHero, canvas.width/2 - 200, sbY, 32, 40, sprFlip);
        drawSprite(ctx, sprHotdog, canvas.width/2 - 196, sbY + 70, 24, 24, !sprFlip);
        
        // Right flank (Enemy & Gear)
        drawSprite(ctx, sprBot, canvas.width/2 + 160, sbY, 38, 38, !sprFlip);
        
        ctx.save();
        ctx.translate(canvas.width/2 + 167 + 12, sbY + 70 + 12);
        ctx.scale(Math.cos(Date.now() / 150), 1); // 3D Retro Coin-style axle spin
        drawSprite(ctx, sprGear, -12, -12, 24, 24, false);
        ctx.restore();
        
        return;
    } else if (gameState === 'INTRO') {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '14px "Press Start 2P"';
        ctx.fillStyle = '#f1c40f'; // Cinematic Golden Retro Yellow
        ctx.textAlign = 'center';
        
        let paragraphs = introText.split('\n');
        let yCursor = introY;
        let lineHeight = 28;
        let maxWidth = canvas.width - 120; // Healthy padding visually
        
        for (let j = 0; j < paragraphs.length; j++) {
            let paragraph = paragraphs[j];
            if (paragraph.trim() === '') {
                // Instead of empty logic, we just bump cursor
                yCursor += lineHeight;
                continue;
            }
            
            let words = paragraph.split(' ');
            let line = '';
            for(let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    ctx.fillText(line, canvas.width / 2, yCursor);
                    line = words[n] + ' ';
                    yCursor += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, canvas.width / 2, yCursor);
            yCursor += lineHeight * 2; // Extra gap between paragraphs!
        }
        
        // Skip prompt natively securely tracked matching 'Star Wars' aesthetics!
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText('PRESS ENTER OR TOUCH TO SKIP', canvas.width / 2, canvas.height - 30);
        }
        return;
    } else if (gameState === 'INSTRUCTIONS') {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '25px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText("HOW TO SURVIVE", canvas.width / 2, 80);
        
        ctx.textAlign = 'center';
        ctx.font = '18px "Press Start 2P"';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText("MOVEMENT", 220, 140);
        
        // WASD
        drawKey(ctx, 110, 160, 36, 36, 'W');
        drawKey(ctx, 70, 200, 36, 36, 'A');
        drawKey(ctx, 110, 200, 36, 36, 'S');
        drawKey(ctx, 150, 200, 36, 36, 'D');

        ctx.fillStyle = 'white';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText("OR", 220, 200);

        // ARROWS
        drawKey(ctx, 290, 160, 36, 36, 'UP');
        drawKey(ctx, 250, 200, 36, 36, 'LEFT');
        drawKey(ctx, 290, 200, 36, 36, 'DOWN');
        drawKey(ctx, 330, 200, 36, 36, 'RIGHT');

        // ITEMS
        ctx.fillStyle = '#f1c40f';
        ctx.font = '18px "Press Start 2P"';
        ctx.fillText("ITEMS", 600, 140);
        
        drawSprite(ctx, sprGear, 480, 160, 24, 24, false);
        ctx.fillStyle = 'white';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillText("GEAR: +1000 POINTS", 520, 178);

        drawSprite(ctx, sprHotdog, 480, 200, 24, 24, false);
        ctx.fillText("HOTDOG: +1 LIFE", 520, 218);

        let whistle = Math.floor(Date.now() / 400) % 2 === 0;
        drawSprite(ctx, sprRef, 480, 240, 24, 24, whistle);
        ctx.fillText("FUDGE: CHECKPOINT", 520, 258);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#f1c40f';
        ctx.font = '18px "Press Start 2P"';
        ctx.fillText("JUMP", canvas.width / 2, 270);
        ctx.fillStyle = 'white';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText("(TAP TWICE FOR DOUBLE JUMP)", canvas.width / 2, 290);
        drawKey(ctx, canvas.width/2 - 120, 310, 240, 36, 'SPACEBAR');
        
        ctx.fillStyle = '#ff2222';
        ctx.font = '18px "Press Start 2P"';
        ctx.fillText("OBJECTIVE", canvas.width / 2, 380);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText("REACH THE TIME PORTAL ALIVE.", canvas.width / 2, 420);
        ctx.fillText("BEAT THE CLOCK FOR TIME BONUSES.", canvas.width / 2, 450);
        ctx.fillText("AVOID SPIKES AND STOMP ON BOTS.", canvas.width / 2, 480);

        ctx.font = '15px "Press Start 2P"';
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillText('PRESS ENTER TO DROP IN', canvas.width / 2, 540);
        }
        return;
    }

    if (bId === 0) {
        // Parallax Layer 1: Distant City at 0.2x speed
        let bgOffset1 = -(camera.x * 0.2) % 200;
        for (let i = -1; i < canvas.width / 200 + 2; i++) {
            let x = bgOffset1 + i * 200;
            ctx.fillStyle = '#1c0d14';
            ctx.fillRect(x + 20, 100, 60, canvas.height);
            ctx.fillRect(x + 80, 150, 40, canvas.height);
            ctx.fillRect(x + 150, 80, 50, canvas.height);
            
            // Random Flickering structural fires!
            let flicker = Math.sin(Date.now() / 150 + i * 42);
            if (flicker > 0) {
                // Top fire
                ctx.fillStyle = '#ff5500';
                ctx.fillRect(x + 35, 115, 3, 4 + flicker*4);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(x + 36, 116, 1, 2 + flicker*2);
                
                // Lower mid fire
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(x + 50, 240, 4, 5 + flicker*3);
                
                // Bottom dwelling fire
                ctx.fillStyle = '#ff5500';
                ctx.fillRect(x + 100, 310, 3, 4 + flicker*3);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(x + 101, 311, 1, 1 + flicker*2);
            }
            let f2 = Math.cos(Date.now() / 120 + i * 17);
            if (f2 > -0.2) {
                // Top fire
                ctx.fillStyle = '#ff4400';
                ctx.fillRect(x + 165, 95, 4, 3 + f2*5);
                
                // Middle building lower fire
                ctx.fillStyle = '#ff5500';
                ctx.fillRect(x + 180, 220, 3, 3 + f2*5);
                
                // Ground fire
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(x + 40, 400, 5, 4 + f2*4);
            }
            let f3 = Math.sin(Date.now() / 90 + i * 88);
            if (f3 > 0.3) {
                // Additional low structural fires
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(x + 175, 360, 2, 3 + f3*3);
                ctx.fillStyle = '#ff4400';
                ctx.fillRect(x + 95, 200, 3, 4 + f3*2);
            }
        }
        
        // Blowing Dust Parallax
        ctx.fillStyle = 'rgba(200, 100, 50, 0.4)';
        for(let d=0; d<30; d++) {
            let dx = (canvas.width - ((Date.now()/10 + d*40) % canvas.width) + (camera.x*0.4)) % canvas.width;
            let dy = (d * 53) % canvas.height;
            ctx.fillRect(dx, dy + Math.sin(Date.now()/300 + d)*10, 2, 2);
        }

        // Parallax Layer 2: Midground Scrap Piles at 0.5x speed
        let bgOffset2 = -(camera.x * 0.5) % 150;
        ctx.fillStyle = '#1c0707';
        for (let i = -1; i < canvas.width / 150 + 2; i++) {
            let x = bgOffset2 + i * 150;
            ctx.beginPath();
            ctx.moveTo(x, canvas.height);
            ctx.lineTo(x + 75, canvas.height - 150);
            ctx.lineTo(x + 150, canvas.height);
            ctx.fill();
        }
    }

    // -- Start World Space --
    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    // Hardware-Accelerated Static Map Pre-Rendering identically correctly!
    if (!isMapCached) {
        offscreenMapCtx.clearRect(0, 0, offscreenMapCanvas.width, offscreenMapCanvas.height);
        
        for (let row = 0; row < mapRows; row++) {
            for (let col = 0; col < mapCols; col++) {
                let tile = map[row][col];
                let tx = col * TILE_SIZE;
                let ty = row * TILE_SIZE;

                if (tile === 1 || tile === 6) {
                    offscreenMapCtx.fillStyle = '#2f2c2b'; 
                    offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    
                    // High-Contrast Bright Edge Trim implicitly defining walkable flooring intrinsically natively!
                    offscreenMapCtx.fillStyle = '#6e3c15'; // Bright rusty orange top plate 
                    offscreenMapCtx.fillRect(tx, ty, TILE_SIZE, 4);

                    // Underglow trim strictly elegantly cleanly mapped
                    offscreenMapCtx.fillStyle = '#110d0c';
                    offscreenMapCtx.fillRect(tx, ty + 4, TILE_SIZE, 2);
                    
                    offscreenMapCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    for(let g=4; g<TILE_SIZE-4; g+=4) {
                        offscreenMapCtx.fillRect(tx + 4, ty + g, TILE_SIZE - 8, 2);
                    }
                    if ((row * 13 + col * 7) % 5 === 0) {
                        offscreenMapCtx.fillStyle = 'rgba(139, 69, 19, 0.3)';
                        offscreenMapCtx.fillRect(tx + 2, ty + 2, TILE_SIZE/2, TILE_SIZE/2);
                        offscreenMapCtx.fillRect(tx + TILE_SIZE/2, ty + TILE_SIZE/2, TILE_SIZE/2 - 2, TILE_SIZE/2 - 2);
                    }

                    offscreenMapCtx.strokeStyle = '#1a1818';
                    offscreenMapCtx.lineWidth = 2;
                    offscreenMapCtx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    
                    offscreenMapCtx.fillStyle = '#0a0a0a'; 
                    offscreenMapCtx.fillRect(tx+4, ty+4, 2, 2);
                    offscreenMapCtx.fillRect(tx+TILE_SIZE-6, ty+4, 2, 2);
                    offscreenMapCtx.fillRect(tx+4, ty+TILE_SIZE-6, 2, 2);
                    offscreenMapCtx.fillRect(tx+TILE_SIZE-6, ty+TILE_SIZE-6, 2, 2);
                }
                
                if (tile === 2 || tile === 6) {
                    offscreenMapCtx.fillStyle = '#4a3d38';
                    offscreenMapCtx.fillRect(tx + 10, ty, 5, TILE_SIZE);
                    offscreenMapCtx.fillRect(tx + 25, ty, 5, TILE_SIZE);
                    for (let i = 0; i < 4; i++) {
                        offscreenMapCtx.fillStyle = '#78432a';
                        offscreenMapCtx.fillRect(tx + 10, ty + i * 10 + 5, 20, 3);
                        offscreenMapCtx.fillStyle = '#b75c32';
                        offscreenMapCtx.fillRect(tx + 12, ty + i * 10 + 5, 16, 1);
                    }
                } else if (tile === 3) {
                    let spikeGrad = offscreenMapCtx.createLinearGradient(0, ty + TILE_SIZE, 0, ty);
                    spikeGrad.addColorStop(0, '#332a22');
                    spikeGrad.addColorStop(1, '#ff3300');
                    offscreenMapCtx.fillStyle = spikeGrad;
                    
                    offscreenMapCtx.beginPath();
                    let spikesCount = 4;
                    let w = TILE_SIZE / spikesCount;
                    for (let s = 0; s < spikesCount; s++) {
                        offscreenMapCtx.moveTo(tx + s * w + w/2, ty + TILE_SIZE/2);
                        offscreenMapCtx.lineTo(tx + (s+1) * w, ty + TILE_SIZE);
                        offscreenMapCtx.lineTo(tx + s * w, ty + TILE_SIZE);
                    }
                    offscreenMapCtx.fill();

                    drawGlow(offscreenMapCtx, tx + TILE_SIZE/2, ty + TILE_SIZE/2 + 4, 30, 'rgba(255, 30, 0, 0.3)');
                } else if (tile === 15) {
                    // Toxic Acid Pool rendering statically explicitly natively
                    offscreenMapCtx.fillStyle = '#0a210f';
                    offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, TILE_SIZE - 12);
                    
                    offscreenMapCtx.fillStyle = '#1b5c21';
                    offscreenMapCtx.fillRect(tx, ty + 12, TILE_SIZE, 4);

                    for(let b=0; b<3; b++) {
                        if (Math.random() > 0.2) {
                            offscreenMapCtx.fillStyle = '#3ee855';
                            offscreenMapCtx.beginPath();
                            offscreenMapCtx.arc(tx + 4 + Math.random() * 30, ty + 18 + Math.random() * 14, 1 + Math.random()*3, 0, Math.PI*2);
                            offscreenMapCtx.fill();
                        }
                    }
                    drawGlow(offscreenMapCtx, tx + TILE_SIZE/2, ty + 16, 20, 'rgba(62, 232, 85, 0.4)');
                }
            }
        }
        isMapCached = true;
    }

    // Instantly blast the cached buffer to the active screen explicitly efficiently safely cleanly!
    ctx.drawImage(offscreenMapCanvas, 0, 0);

    // Draw Only Animated Entities natively accurately structurally!
    let startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    let endCol = Math.min(mapCols - 1, Math.floor((camera.x + canvas.width) / TILE_SIZE));
    let startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    let endRow = Math.min(mapRows - 1, Math.floor((camera.y + canvas.height) / TILE_SIZE));

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            let tile = map[row][col];
            let tx = col * TILE_SIZE;
            let ty = row * TILE_SIZE;

            if (tile === 5) {
                let pulse = 1 + Math.sin(Date.now() / 150) * 0.1;
                let undulate = 1 + Math.cos(Date.now() / 120) * 0.1;
                let pWidth = TILE_SIZE * pulse;
                let pHeight = TILE_SIZE * undulate;
                let pDx = tx + (TILE_SIZE - pWidth) / 2;
                let pDy = ty + (TILE_SIZE - pHeight) / 2;
                drawGlow(ctx, pDx + pWidth/2, pDy + pHeight/2, 40, 'rgba(0, 255, 255, 0.5)');
                drawSprite(ctx, sprPortal, pDx, pDy, pWidth, pHeight, false);
            }
        }
    }

    // Draw Moving Platforms
    for (let plat of platforms) {
        drawGlow(ctx, plat.x + plat.width/2, plat.y + 8, 30, 'rgba(255, 100, 0, 0.4)');
        drawSprite(ctx, sprRocketPad, plat.x, plat.y, plat.width, plat.height, false);
        
        // Render Rocket Thrusters
        if (Math.random() > 0.2) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ff2222' : '#f1c40f';
            ctx.fillRect(plat.x + 8 + Math.random() * 4, plat.y + plat.height, 2 + Math.random() * 2, 2 + Math.random() * 4);
            ctx.fillRect(plat.x + plat.width - 12 + Math.random() * 4, plat.y + plat.height, 2 + Math.random() * 2, 2 + Math.random() * 4);
        }
    }

    // Draw Items
    for (let i of items) {
        if (i.type === 'checkpoint') {
            let isActive = player.startX === i.x + 8 && player.startY === i.y - 2;
            let flip = isActive || (Math.floor(Date.now() / 400) % 2 === 0);
            drawSprite(ctx, sprRef, i.x, i.y + 7, i.width, i.height, flip); // Shifted down drastically to prevent floating visually
            if (isActive) {
                drawGlow(ctx, i.x + 16, i.y + 16, 40, 'rgba(10, 255, 100, 0.6)');
            } else {
                drawGlow(ctx, i.x + 16, i.y + 16, 20, 'rgba(255, 255, 255, 0.3)');
            }
        } else if (!i.collected) {
            if (i.type === 'hotdog') {
                drawSprite(ctx, sprHotdog, i.x, i.y, i.width, i.height, false);
            } else if (i.type === 'valve') {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(i.x + 4, i.y + 4, 24, 24);
                drawGlow(ctx, i.x + 16, i.y + 16, 30, 'red');
            } else if (i.type === 'detonator') {
                ctx.fillStyle = '#ff5500';
                ctx.fillRect(i.x, i.y + 16, 32, 16);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(i.x + 8, i.y + 8, 16, 8);
                drawGlow(ctx, i.x + 16, i.y + 16, 50, 'rgba(255, 0, 0, 0.8)');
            } else {
                drawSprite(ctx, sprGear, i.x, i.y, i.width, i.height, false);
            }
        }
    }

    // Draw Enemies
    for (let e of enemies) {
        if (e.type === 'bot') {
            let wobbleY = Math.floor(timerAcc * 8) % 2 === 0 ? 2 : 0; 
            drawSprite(ctx, sprBot, e.x - 7, e.y - 14 + wobbleY, 38, 38, e.dir < 0);
        } else if (e.type === 'laserBot') {
            drawSprite(ctx, sprLaserBot, e.x - 7, e.y - 14, 38, 38, e.dir < 0);
        }
    }

    // Draw Boss
    if (boss && boss.active) {
        if (boss.type === 'masticator') {
            drawMasticator(ctx, boss);
        } else if (boss.type === 'sludge') {
            ctx.fillStyle = '#00ff00';
            ctx.beginPath(); ctx.arc(boss.x + boss.width/2, boss.y + boss.height/2, boss.width/2 + Math.sin(Date.now()/200)*10, 0, Math.PI*2); ctx.fill();
            if (boss.hurtTimer > 0) { ctx.fillStyle = 'white'; ctx.globalAlpha=0.5; ctx.beginPath(); ctx.arc(boss.x + boss.width/2, boss.y + boss.height/2, boss.width/2, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
        } else if (boss.type === 'warden') {
            ctx.fillStyle = '#444';
            ctx.beginPath(); ctx.arc(boss.x + boss.width/2, boss.y + boss.height/2, boss.width/2, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#f00';
            ctx.beginPath(); ctx.arc(boss.x + boss.width/2, boss.y + boss.height/2, Math.max(5, 20 + Math.sin(Date.now()/100)*10), 0, Math.PI*2); ctx.fill();
            if (boss.hurtTimer > 0) { ctx.fillStyle = 'white'; ctx.globalAlpha=0.5; ctx.beginPath(); ctx.arc(boss.x+boss.width/2, boss.y+boss.height/2, boss.width/2, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
        } else if (boss.type === 'core') {
            ctx.fillStyle = '#111';
            ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
            ctx.fillStyle = '#0ff';
            let glow = Math.abs(Math.sin(Date.now()/200))*40;
            ctx.fillRect(boss.x + 20, boss.y + 20, boss.width - 40, boss.height - 40);
            drawGlow(ctx, boss.x + boss.width/2, boss.y + boss.height/2, 100 + glow, 'rgba(0, 255, 255, 0.5)');
            if (boss.hurtTimer > 0) { ctx.fillStyle = 'white'; ctx.globalAlpha=0.5; ctx.fillRect(boss.x, boss.y, boss.width, boss.height); ctx.globalAlpha=1; }
        } else if (boss.type === 'goliath') {
            ctx.fillStyle = '#550000';
            ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(boss.x + boss.width - 40, boss.y + 40, 20, 20);
        }
    }
    
    // Draw Lasers Pool 
    for (let l of laserPool) {
        if (!l.active) continue;
        drawGlow(ctx, l.x + 8, l.y + 2, 30, 'rgba(255, 0, 0, 0.6)');
        drawSprite(ctx, sprLaser, l.x - 4, l.y - 10, 24, 24, l.vx < 0);
    }

    // Draw Bombs (TNT Bundles)
    for (let b of bombs) {
        let bx = b.x;
        let by = b.y + 10; // Anchor TNT exactly 10 pixels downwards directly onto surface layer
        
        ctx.fillStyle = '#2b1a10';
        ctx.fillRect(bx + 6, by + 10, 20, 4);
        ctx.fillRect(bx + 6, by + 22, 20, 4);

        ctx.fillStyle = '#D32F2F';
        ctx.fillRect(bx + 6, by + 4, 6, 26);
        ctx.fillRect(bx + 13, by + 4, 6, 26);
        ctx.fillRect(bx + 20, by + 4, 6, 26);

        ctx.fillStyle = '#5D4037';
        ctx.fillRect(bx + 15, by - 4, 2, 8); 
        
        ctx.fillStyle = '#FFC107'; 
        ctx.beginPath(); ctx.arc(bx + 16 + (Math.random()-0.5)*4, by - 4 + (Math.random()-0.5)*4, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#FF5722'; 
        ctx.beginPath(); ctx.arc(bx + 16, by - 4, 2, 0, Math.PI*2); ctx.fill();
    }

    // Draw Particles Pool seamlessly securely efficiently!
    for (let p of particlePool) {
        if (!p.active) continue;
        let alpha = Math.max(0, p.life / p.maxLife);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (p.type === 'gear') {
            // Draw a tiny rotating 8-bit gear authentically strictly natively!
            ctx.translate(p.x, p.y);
            ctx.rotate(Date.now() / 150 + p.vx); // Spin dynamically explicitly natively!
            drawSprite(ctx, sprGear, -8, -8, 16, 16, false);
        } else if (p.type === 'playerQuad') {
            ctx.translate(p.x, p.y);
            ctx.rotate(Date.now() / 200 * (p.qx === 0 ? -1 : 1));
            
            let w = player.width;
            let h = player.height;
            
            ctx.beginPath();
            ctx.rect(-w/4, -h/4, w/2, h/2);
            ctx.clip();
            
            let sx = -(p.qx * w + w/4);
            let sy = -(p.qy * h + h/4);
            
            drawSprite(ctx, sprHeroDead, sx, sy, w, h, p.flip);
        } else {
            // Standard square shrapnel explicitly safely cleanly securely!
            ctx.fillStyle = p.color || `rgb(180, 180, 180)`;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }
        
        ctx.restore();
    }

    // Draw Player
    let playerFlip = (player.vx < 0 || keys.ArrowLeft) && !(player.vx > 0 || keys.ArrowRight);
    if (player.vx === 0 && !keys.ArrowLeft) playerFlip = false; 
    
    // Retain direction organically 
    if (player.vx < 0) player.lastDir = -1;
    if (player.vx > 0) player.lastDir = 1;
    if (player.vx === 0) playerFlip = player.lastDir === -1;

    if (gameState !== 'DYING' && gameState !== 'CREDITS' && gameState !== 'CREDITS_CUTSCENE') {
        let pSpr = sprHero;
        let wY = (player.isOnGround && player.vx !== 0 && Math.floor(timerAcc*10)%2===0) ? 2 : 0; // walk bob
        
        ctx.save();
        if (gameState === 'LEVEL_CLEAR') {
            let scale = Math.max(0, 1.0 - (winTimer / 2.0)); // shrinks over 2 seconds
            let rot = winTimer * 15; // vortex spin mathematically natively!
            ctx.translate(player.x + player.width/2, player.y + player.height/2 + wY);
            ctx.rotate(rot);
            ctx.scale(scale, scale);
            drawGlow(ctx, 0, 0, 40, 'rgba(255, 150, 0, 0.25)'); 
            drawSprite(ctx, pSpr, -player.width/2, -player.height/2, player.width, player.height, playerFlip);
        } else {
            drawGlow(ctx, player.x + 12, player.y + 16, 40, 'rgba(255, 150, 0, 0.25)'); // Organic warm player glow
            drawSprite(ctx, pSpr, player.x, player.y + wY, player.width, player.height, playerFlip);
        }
        ctx.restore();
    }
    
    // Draw Cinematic Overlays cleanly natively explicitly!
    if (gameState === 'CREDITS_CUTSCENE') {
        // Fudge picking up player intelligently flawlessly dynamically!
        let animT = Math.min(1.0, player.cutsceneTimer / 4.0); 
        let ptX = player.x;
        let ptY = player.y; // The spot where we died
        
        // Fudge animating natively!
        if (animT < 0.5) {
            let fX = ptX - 100 + (animT * 2 * 100);
            drawSprite(ctx, sprRef, fX, ptY, 24, 24, false);
            // Draw scattered player pieces
            for(let sx of [-15, -5, 10, 20]) {
                ctx.fillStyle = 'white';
                ctx.fillRect(ptX + sx, ptY + 20 + Math.random()*2, 4, 4);
            }
        } else if (animT < 0.8) {
            drawSprite(ctx, sprRef, ptX, ptY, 24, 24, false); // Standing
            // Player rebuilding
            ctx.fillStyle = 'rgba(255, 255, 255, ' + ((animT - 0.5)*3.3) + ')';
            drawSprite(ctx, sprHero, ptX + 24, ptY, player.width, player.height, true);
        } else {
            // Jump into Portal!
            drawSprite(ctx, sprRef, ptX, ptY - ((animT-0.8)*2 * 50), 24, 24, false); 
            drawSprite(ctx, sprHero, ptX + 24, ptY - ((animT-0.8)*2 * 50), player.width, player.height, true);
            let pWidth = 100;
            let pDx = ptX;
            drawGlow(ctx, pDx + pWidth/2, ptY - 80, 80, 'rgba(0, 255, 255, 0.8)');
            drawSprite(ctx, sprPortal, pDx, ptY - 100, pWidth, pWidth, false);
        }
    }
    
    // -- End World Space --
    ctx.restore();

    // Draw HUD fixed to screen
    ctx.fillStyle = 'white';
    ctx.font = '14px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + player.score, 20, 30);
    ctx.fillText('LEVEL: ' + (currentLevel + 1), 250, 30);
    ctx.fillText('TIME: ' + timer, 450, 30);
    ctx.fillText('LIVES: ' + player.lives, 650, 30);

    if (boss && boss.active && boss.hp > 0 && gameState !== 'CREDITS_CUTSCENE' && gameState !== 'CREDITS') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(canvas.width/2 - 200, canvas.height - 40, 400, 20);
        ctx.fillStyle = 'red';
        ctx.fillRect(canvas.width/2 - 198, canvas.height - 38, Math.max(0, (boss.hp / boss.maxHp)) * 396, 16);
        ctx.fillStyle = 'white';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(boss.type.toUpperCase(), canvas.width/2, canvas.height - 25);
    }

    // Overlay Game Over / Win / Initials
    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.font = '30px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = 'white';
        ctx.font = '15px "Press Start 2P"';
        ctx.fillText('PRESS ENTER TO CONTINUE', canvas.width / 2, canvas.height / 2 + 40);
    } else if (gameState === 'WIN') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00';
        ctx.font = '30px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE CLEAR!', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = 'white';
        ctx.font = '15px "Press Start 2P"';
        ctx.fillText('TIME BONUS: ' + (timer * 100), canvas.width / 2, canvas.height / 2 + 35);
        ctx.fillText('FINAL SCORE: ' + player.score, canvas.width / 2, canvas.height / 2 + 70);
        ctx.fillText('PRESS ENTER TO CONTINUE', canvas.width / 2, canvas.height / 2 + 110);
    } else if (gameState === 'ENTER_INITIALS') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f1c40f';
        ctx.font = '20px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('NEW HIGH SCORE!', canvas.width/2, 100);
        ctx.fillStyle = 'white';
        ctx.fillText('SCORE: ' + player.score, canvas.width/2, 150);
        
        ctx.font = '40px "Press Start 2P"';
        for (let i = 0; i < 3; i++) {
            if (i === initialIndex) {
                 ctx.fillStyle = '#ff2222'; 
                 ctx.fillText(initials[i], canvas.width/2 - 60 + (i * 60), 250);
                 ctx.fillRect(canvas.width/2 - 80 + (i * 60), 260, 40, 5); 
            } else {
                 ctx.fillStyle = '#fff';
                 ctx.fillText(initials[i], canvas.width/2 - 60 + (i * 60), 250);
            }
        }
        ctx.font = '15px "Press Start 2P"';
        ctx.fillStyle = '#fff';
        ctx.fillText('USE ARROWS. PRESS ENTER TO SAVE', canvas.width/2, 350);
    } else if (gameState === 'CREDITS') {
        ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#f1c40f';
        ctx.font = '30px "Press Start 2P"';
        ctx.textAlign = 'center';
        let cY = canvas.height - (player.cutsceneTimer - 4.0) * 50;
        
        ctx.fillText("DON'T DIE", canvas.width/2, cY);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px "Press Start 2P"';
        ctx.fillText("A STORY OF SACRIFICE", canvas.width/2, cY + 80);
        ctx.fillText("ART & CODE: THE CLOUD", canvas.width/2, cY + 160);
        
        ctx.fillStyle = '#ff2222';
        ctx.fillText("GOLIATH HAS FALLEN.", canvas.width/2, cY + 300);
        
        ctx.fillStyle = 'white';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText("AND SO HAS HEROIC HOTDOG HENLEY.", canvas.width/2, cY + 350);
        ctx.fillText("THE UNIVERSE IS SAVED.", canvas.width/2, cY + 380);
        ctx.fillText("THANK YOU FOR PLAYING.", canvas.width/2, cY + 500);
    }
    
    // Draw Global Share UX Button
    if (gameState === 'GAMEOVER' || gameState === 'WIN' || gameState === 'ENTER_INITIALS') {
        ctx.fillStyle = '#b75c32'; // Match the rusty orange aesthetic instead of twitter blue!
        ctx.fillRect(canvas.width / 2 - 120, canvas.height - 80, 240, 40);
        ctx.fillStyle = 'white';
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('[ SHARE HIGHSCORE! ]', canvas.width / 2, canvas.height - 55);
    }
}

