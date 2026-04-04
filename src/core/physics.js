import { G, player, keys, canvas, TILE_SIZE, laserPool, particlePool } from './globals.js';
import { staticLevels } from '../data/levels.js?v=105';
import { playSound, stopBackgroundMusic } from '../assets/audio.js';
import { parseMap, resetPlayerPosition } from '../logic/spawner.js';

export function checkRectCollision(r1, r2) {
    return r1.x < r2.x+r2.width && r1.x+r1.width > r2.x && r1.y < r2.y+r2.height && r1.y+r1.height > r2.y;
}
function getCollidingTiles(rect) {
    let tiles = [];
    let sc = Math.floor((rect.x+0.0001)/TILE_SIZE), ec = Math.floor((rect.x+rect.width-0.0001)/TILE_SIZE);
    let sr = Math.floor((rect.y+0.0001)/TILE_SIZE), er = Math.floor((rect.y+rect.height-0.0001)/TILE_SIZE);
    for (let row=sr; row<=er; row++) for (let col=sc; col<=ec; col++) {
        if (row>=0 && row<G.mapRows && col>=0 && col<G.mapCols)
            tiles.push({row,col,type:G.map[row][col],rect:{x:col*TILE_SIZE,y:row*TILE_SIZE,width:TILE_SIZE,height:TILE_SIZE}});
    }
    return tiles;
}
export function playerDeath() {
    if (G.gameState==='DYING') return;
    playSound('die'); G.gameState='DYING'; player.dyingTimer=0;
    keys.ArrowLeft=false; keys.ArrowRight=false; keys.ArrowUp=false; keys.ArrowDown=false; keys.Space=false;
    for (let l of laserPool) l.active=false;
    if (G.boss&&G.boss.active) { if (G.boss.type==='masticator'){G.boss.phase=0;G.boss.vx=0;G.boss.hasSeenPlayer=false;} if (G.boss.projs) G.boss.projs=[]; }
    for (let i=0; i<4; i++) {
        let qx=(i%2===0)?0:0.5, qy=(i<2)?0:0.5, p=particlePool.find(pp=>!pp.active);
        if (p) { p.active=true; p.type='playerQuad'; p.qx=qx; p.qy=qy; p.x=player.x+(qx*player.width)+(player.width/4); p.y=player.y+(qy*player.height)+(player.height/4); p.vx=(qx===0?-1:1)*(150+Math.random()*50); p.vy=(qy===0?-1:1)*(150+Math.random()*50)-100; p.size=Math.max(player.width,player.height)/2; p.life=1.5; p.maxLife=2.0; p.flip=player.lastDir===-1; }
    }
    player.vx=0; player.vy=0; player.isOnGround=false; player.isClimbing=false; player.riding = null;
}
export function bossExplode() {
    const boss = G.boss;
    if (boss.type==='septicus'&&!boss.isSinking&&!boss.isDying&&boss.hp<=0) {
        boss.isDying=true; boss.timer=0; boss.vx=0; boss.vy=0; boss.vibrateX=0;
        G.acidPurified=true; G.isMapCached=false;
        if (boss.projs) boss.projs=[]; playSound('explosion');
    } else if (boss.isDying||boss.isSinking) { return; } else { boss.active=false; playSound('gameOver'); }
    for (let i=0;i<40;i++) { let p=particlePool.find(pp=>!pp.active); if(p){p.active=true;p.type='normal';p.size=15;p.x=boss.x+Math.random()*boss.width;p.y=boss.y+Math.random()*boss.height;p.vx=(Math.random()-0.5)*500;p.vy=(Math.random()-0.5)*500;p.life=1.0;p.maxLife=1.0;} }
    for (let it of G.items) { if (it.type==='valve'||it.type==='detonator') it.collected=true; }
    if (boss.type!=='goliath') {
        let pCol=Math.floor((boss.x+boss.width/2)/TILE_SIZE), pRow=Math.floor((boss.y+boss.height)/TILE_SIZE);
        if (boss.type==='septicus') { pCol=98; pRow=11; for(let i=0;i<6;i++){let br=5+i,bc=82+i*2;if(G.map[br]){G.map[br][bc]=1;G.map[br][bc+1]=1;}} }
        G.map[Math.max(0,pRow-1)][pCol]=5; G.isMapCached=false;
    }
}
function updateBombs(dt) {
    const boss=G.boss;
    for (let b of G.bombs) {
        if (!b.active) continue;
        b.vy+=800*dt;
        if (boss&&boss.active) { let targetX=boss.x+boss.width/2-b.width/2; b.x+=(targetX-b.x)*10*dt; b.vx=0; }
        b.y+=b.vy*dt;
        if (boss&&boss.active&&checkRectCollision(b,boss)) {
            b.active=false; b.y=-9999; playSound('explosion');
            for(let i=0;i<20;i++){let p=particlePool.find(pp=>!pp.active);if(p){p.active=true;p.type='explosion';p.size=12;p.x=b.x+16;p.y=b.y+16;p.vx=(Math.random()-0.5)*400;p.vy=(Math.random()-0.5)*400;p.life=0.8;p.maxLife=0.8;}}
            boss.hp--; boss.hurtTimer=0.5; if(boss.hp<=0) bossExplode();
        }
    }
}
function updateBoss(dt) {
    const boss=G.boss;
    if (!boss||!boss.active||(boss.hp<=0&&!boss.isSinking&&!boss.isDying)) return;
    if (boss.hurtTimer>0) boss.hurtTimer-=dt;
    let bRect={x:boss.x+20,y:boss.y+20,width:boss.width-40,height:boss.height-40};
    if (checkRectCollision(player,bRect)) playerDeath();
    boss.timer+=dt;
    if (boss.type==='masticator') {
        if (boss.phase===0) { boss.vx=0; if(boss.hasSeenPlayer||(boss.x>G.camera.x&&boss.x<G.camera.x+800)){boss.hasSeenPlayer=true;boss.phase=1;boss.vx=(player.x<boss.x)?-300:300;playSound('shoot');} }
        else if (boss.phase===1) {
            boss.x+=boss.vx*dt;
            let sc2=Math.floor(boss.x/TILE_SIZE),ec2=Math.floor((boss.x+boss.width)/TILE_SIZE),sr2=Math.floor(boss.y/TILE_SIZE),er2=Math.floor((boss.y+boss.height)/TILE_SIZE);
            let hitPillar=false,hitCol=-1;
            for(let r=sr2;r<=er2;r++) for(let c=sc2;c<=ec2;c++) { if(G.map[r]&&G.map[r][c]!==0&&G.map[r][c]!==undefined&&r<13){let p2=particlePool.find(pp=>!pp.active);if(p2){p2.active=true;p2.type='normal';p2.size=12;p2.x=c*TILE_SIZE+20;p2.y=r*TILE_SIZE+20;p2.vx=(Math.random()-0.5)*500;p2.vy=-300-Math.random()*300;p2.color='#B0B0B0';p2.life=1.0;p2.maxLife=1.0;}if(G.map[r][c]===1){hitPillar=true;hitCol=c;}G.map[r][c]=0;G.isMapCached=false;} }
            if (hitPillar) {
                for(let pr=12;pr>=0;pr--){let rs=staticLevels[G.currentLevel].map[pr];if(rs&&rs[hitCol]==='1'){G.map[pr][hitCol]=0;staticLevels[G.currentLevel].map[pr]=rs.substring(0,hitCol)+"0"+rs.substring(hitCol+1);let p2=particlePool.find(pp=>!pp.active);if(p2){p2.active=true;p2.type='normal';p2.size=12;p2.x=hitCol*TILE_SIZE+20;p2.y=pr*TILE_SIZE+20;p2.vx=(Math.random()-0.5)*500;p2.vy=-300-Math.random()*300;p2.color='#B0B0B0';p2.life=1.0;p2.maxLife=1.0;}}}
                G.isMapCached=false; boss.phase=2; boss.vx=0; boss.timer=0;
                for(let b of G.bombs){if(!b.active&&Math.abs(b.col-hitCol)<=3){b.active=true;b.vx=(boss.x+boss.width/2>b.x)?50:-50;}}
            } else { if((boss.vx>0&&player.x+player.width<boss.x)||(boss.vx<0&&player.x>boss.x+boss.width)){boss.phase=3;boss.timer=0;} }
        } else if (boss.phase===3) { boss.vx*=0.9; boss.x+=boss.vx*dt; if(boss.timer>0.4){boss.phase=1;boss.vx=(player.x<boss.x)?-300:300;playSound('shoot');} }
        else if (boss.phase===2) { if(boss.timer>3.0){boss.phase=0;boss.timer=0;} }
    } else if (boss.type==='septicus') {
        if (boss.isDying) {
            boss.timer+=dt;
            let shake = Math.min((boss.timer / 3.0) * 15, 15);
            boss.vibrateX = (Math.random()-0.5)*shake*2;
            if (Math.random() < 30 * dt) {
                let p = particlePool.find(pp=>!pp.active);
                if(p){ p.active=true; p.type='normal'; p.size=Math.random()*6+4; p.x=boss.x+Math.random()*boss.width; p.y=boss.y+Math.random()*boss.height; p.vx=(Math.random()-0.5)*400; p.vy=(Math.random()-0.5)*400; p.color=(Math.random()>0.5?'#3ee855':'#ffffff'); p.life=0; p.maxLife=0.6+Math.random()*0.4; }
            }
            if (boss.timer > 3.0) {
                boss.isDying = false; boss.isSinking = true; boss.timer = 0; playSound('gameOver'); boss.vibrateX = 0;
                for(let i=0; i<40; i++){ let p=particlePool.find(pp=>!pp.active); if(p){p.active=true;p.type='explosion';p.size=15;p.x=boss.x+Math.random()*boss.width;p.y=boss.y+Math.random()*boss.height;p.vx=(Math.random()-0.5)*600;p.vy=(Math.random()-0.5)*600;p.life=1.0;p.maxLife=1.0;} }
                G.camera.vibrate = 20;
            }
            return;
        }
        if (boss.isSinking) { boss.y+=18*dt; if(boss.timer>10.0){boss.isSinking=false;boss.active=false;} return; }
        else if (!boss.triggered) { if(player.x>TILE_SIZE*12){boss.triggered=true;boss.x=player.x-boss.width/2;playSound('powerup');} boss.vx=0;boss.vy=0; return; }
        if (boss.y>boss.startY) { boss.y-=350*dt; if(boss.y<boss.startY)boss.y=boss.startY; return; }
        if (player.x<TILE_SIZE*11) { boss.vx=0;boss.phase=0;boss.timer=0;boss.y+=boss.vy*dt;if(boss.y>boss.startY){boss.y=boss.startY;boss.vy=0;}else boss.vy+=800*dt; return; }
        if (!boss.vy) boss.vy=0; boss.y+=boss.vy*dt;
        if (boss.y>boss.startY){boss.y=boss.startY;boss.vy=0;} else boss.vy+=800*dt;
        let reach=140, dist=Math.abs(player.x-(boss.x+boss.width/2));
        if (boss.phase===0) {
            let spd=(boss.hp<3)?220:180; boss.vx=(player.x<boss.x+boss.width/2)?-spd:spd; boss.x+=boss.vx*dt;
            boss.x=Math.max(TILE_SIZE*10,Math.min(TILE_SIZE*90,boss.x));
            if(boss.hp<=2&&boss.y>=boss.startY&&player.y<boss.y-120&&Math.random()<0.02) boss.vy=-600;
            if(boss.hp===1&&boss.timer>(boss.projs?.length>0?0:3.0)){boss.phase=3;boss.timer=0;boss.throwsLeft=3;}
            else if(dist<reach&&boss.timer>2){boss.phase=1;boss.timer=0;boss.vx=0;}
        } else if (boss.phase===1) { if(boss.timer>0.8){boss.phase=2;boss.timer=0;playSound('shoot');} }
        else if (boss.phase===2) {
            if(boss.timer>1.0){boss.phase=0;boss.timer=0;}
            let sa=boss.timer*Math.PI,sx=(boss.x+boss.width/2)+Math.cos(sa)*reach*(player.x<boss.x?-1:1),sy=(boss.y+boss.height/2)-Math.sin(sa)*reach;
            let dx2=player.x+player.width/2-sx,dy2=player.y+player.height/2-sy;
            if(Math.sqrt(dx2*dx2+dy2*dy2)<22) playerDeath();
        } else if (boss.phase===3) {
            if(!boss.projs) boss.projs=[]; let spd2=140; boss.vx=(player.x<boss.x+boss.width/2)?-spd2:spd2; boss.x+=boss.vx*dt; boss.x=Math.max(TILE_SIZE*10,Math.min(TILE_SIZE*90,boss.x));
            if(boss.timer>0.6&&boss.throwsLeft>0){boss.timer=0;boss.throwsLeft--;let tx=player.x+player.width/2,ty=player.y+player.height/2,bx=boss.x+boss.width/2,by=boss.y+boss.height/2,ddx=tx-bx,ddy=ty-by,dst=Math.sqrt(ddx*ddx+ddy*ddy),spd3=500;boss.projs.push({x:bx,y:by,vx:(ddx/dst)*spd3,vy:(ddy/dst)*spd3,timer:0,linear:true});playSound('shoot');}
            if(boss.throwsLeft<=0&&boss.timer>1.5){boss.phase=0;boss.timer=0;}
        }
        if (boss.projs) {
            for(let i=boss.projs.length-1;i>=0;i--){let p=boss.projs[i];if(!p)break;p.timer+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.linear)p.vy+=600*dt;let pdx=player.x+player.width/2-p.x,pdy=player.y+player.height/2-p.y;if(Math.sqrt(pdx*pdx+pdy*pdy)<25)playerDeath();if(p.y>G.boss.startY+400||p.x<0||p.x>G.mapCols*TILE_SIZE)boss.projs.splice(i,1);}
        }
        if (Math.random() < 30 * dt) {
            let p = particlePool.find(pp=>!pp.active);
            if (p) {
                p.active = true; p.type = 'normal'; p.size = Math.random()*3 + 2; 
                p.x = boss.x + Math.random()*boss.width; p.y = boss.y + boss.height; 
                p.vx = (Math.random()-0.5)*15; p.vy = 40 + Math.random()*80; 
                p.color = '#3ee855'; p.life = 0; p.maxLife = 1.0 + Math.random();
            }
        }
        // Horizontal Wading Splashes
        if (boss.vx !== 0 && Math.random() < 50 * dt) {
            let p = particlePool.find(pp=>!pp.active);
            if (p) {
                p.active = true; p.type = 'normal'; p.size = Math.random()*4 + 3; 
                p.x = boss.x + (boss.vx > 0 ? boss.width : 0) + (Math.random()-0.5)*30; p.y = 13 * TILE_SIZE; 
                p.vx = boss.vx * 0.4 + (Math.random()-0.5)*80; p.vy = -180 - Math.random()*150; 
                p.color = '#3ee855'; p.life = 0; p.maxLife = 0.5 + Math.random()*0.5;
            }
        }
    } else if (boss.type==='warden') {
        if(player.y<boss.y) boss.y-=70*dt; boss.x+=Math.cos(boss.timer*4)*80*dt;
    } else if (boss.type==='core') {
        if(boss.timer>1.5){boss.timer=0;let l=laserPool.find(lp=>!lp.active);if(l){l.active=true;l.width=16;l.height=8;l.x=boss.x+boss.width/2;l.y=player.y+player.height/2;l.vx=(Math.random()>0.5?-250:250);playSound('shoot');}}
    } else if (boss.type==='goliath') {
        boss.x=Math.max(boss.x,G.camera.x-30);
        if(boss.timer>2.0&&G.gameState!=='CREDITS_CUTSCENE'&&G.gameState!=='CREDITS'){boss.timer=0;for(let i=0;i<3;i++){let l=laserPool.find(lp=>!lp.active);if(l){l.active=true;l.width=30;l.height=15;l.x=boss.x+boss.width;l.y=boss.y+40+(i*40);l.vx=400+Math.random()*100;}}playSound('shoot');}
    }
}

export function updatePhysics(dt) {
    // 1. Clear Riding if jumping/climbing or falling off bounds (DO THIS FIRST)
    if (player.riding) {
        if (keys.Space || player.isClimbing || player.x + player.width < player.riding.x || player.x > player.riding.x + player.riding.width) {
            player.riding = null;
        }
    }

    if (player.riding) {
        player.x = player.riding.x + player.rideOffsetX;
        player.y = player.riding.y - player.height;
        player.vy = 0;
        player.isOnGround = true;
    }

    // 3. Move Platforms
    for (let plat of G.platforms) {
        if (plat.vx !== 0) {
            plat.x += plat.vx * dt;
            if (plat.x >= plat.maxX) { plat.x = plat.maxX; plat.vx *= -1; }
            else if (plat.x <= plat.minX) { plat.x = plat.minX; plat.vx *= -1; }
        }
        if (plat.vy !== 0) {
            plat.y += plat.vy * dt;
            if (plat.y >= plat.maxY) { plat.y = plat.maxY; plat.vy *= -1; }
            else if (plat.y <= plat.minY) { plat.y = plat.minY; plat.vy *= -1; }
        }
    }
    if (G.gameState==='DYING') {
        player.dyingTimer+=dt;
        if (player.dyingTimer>1.8) {
            player.lives--;
            if (player.lives<=0){stopBackgroundMusic();playSound('gameOver');G.gameState='GAMEOVER';}
            else{G.timer=60;parseMap(false);resetPlayerPosition();if(G.boss&&G.boss.active){G.boss.x=G.boss.startX??G.boss.x;G.boss.y=G.boss.startY??G.boss.y;G.boss.vx=0;G.boss.vy=0;G.boss.phase=0;G.boss.hasSeenPlayer=false;}G.gameState='PLAYING';}
        }
        return;
    }
    if (G.gameState==='LEVEL_CLEAR') {
        if(player.portalX!==undefined){player.x+=(player.portalX-player.width/2-player.x)*4*dt;player.y+=(player.portalY-player.height/2+16-player.y)*4*dt;}
        player.vx=0;player.vy=0;
        G.camera.x=Math.max(0,Math.min(G.mapCols*TILE_SIZE-canvas.width,player.x-canvas.width/2+player.width/2));
        G.camera.y=Math.max(0,Math.min(G.mapRows*TILE_SIZE-canvas.height,player.y-canvas.height/2+player.height/2));
        G.winTimer+=dt; if(G.winTimer>2) G.gameState='WIN'; return;
    }
    if (G.gameState==='VALVE_CUTSCENE') {
        G.valveCutsceneTimer+=dt;
        if(G.valveCutsceneTimer>5.0){G.gameState='PLAYING';G.activeValvePos=null;if(G.boss)G.boss.vibrateX=0;}
        if(G.activeValvePos){
            let tx=G.activeValvePos.x-canvas.width/2+16,ty=(G.activeValvePos.y+40)-canvas.height/2+16;
            G.camera.x+=(tx-G.camera.x)*3*dt; G.camera.y+=(ty-G.camera.y)*3*dt;
            G.camera.x=Math.max(0,Math.min(G.mapCols*TILE_SIZE-canvas.width,G.camera.x));
            G.camera.y=Math.max(0,Math.min(G.mapRows*TILE_SIZE-canvas.height,G.camera.y));
        }
        if(G.boss&&G.boss.active) G.boss.vibrateX=Math.sin(Date.now()*0.05)*8;
        return;
    }
    player.vx = 0;
    if (keys.ArrowLeft) player.vx = -player.speed;
    if (keys.ArrowRight) player.vx = player.speed;

    let lcrect={x:player.x,y:player.y,width:player.width,height:player.height+1};
    let ladderTiles=getCollidingTiles(lcrect), clashing=getCollidingTiles(player);
    let onLadder=false,hitSpike=false,hitGoal=false;
    for(let t of ladderTiles) if(t.type===2||t.type===6) onLadder=true;
    for(let t of clashing) {
        if(t.type===3&&checkRectCollision(player,{x:t.rect.x+8,y:t.rect.y+20,width:24,height:20})) hitSpike=true;
        if(t.type===15) hitSpike=true;
        if(t.type===5){hitGoal=true;player.portalX=t.rect.x+16;player.portalY=t.rect.y+16;}
    }
    if(hitSpike){playerDeath();return;}
    if(hitGoal&&G.gameState!=='LEVEL_CLEAR'){G.gameState='LEVEL_CLEAR';G.winTimer=0;playSound('win');player.score+=G.timer*100;return;}
    if(onLadder){if(keys.ArrowUp||keys.ArrowDown){player.isClimbing=true;player.doubleJump=false;}}else player.isClimbing=false;
    if(player.isClimbing){player.vy=0;if(keys.ArrowUp)player.vy=-player.speed*0.6;if(keys.ArrowDown)player.vy=player.speed*0.6;}
    else{player.vy+=player.gravity*dt;if(player.vy>800)player.vy=800;}
    
    if (player.riding) {
        player.rideOffsetX += player.vx * dt;
        player.x = player.riding.x + player.rideOffsetX;
    } else {
        player.x += player.vx * dt;
    }
    for(let t of getCollidingTiles(player)){if(t.type===1){let fl=t.col>0&&t.col<G.mapCols-1&&((G.mapRows===15&&t.row>0&&t.row<13)||(G.mapRows===60&&t.row>0&&t.row<59));if(!fl){if(player.vx>0)player.x=t.rect.x-player.width;else if(player.vx<0)player.x=t.rect.x+t.rect.width;player.vx=0;}}}
    player.y += player.vy * dt;
    
    player.isOnGround = false;

    for (let plat of G.platforms) {
        if (player.vy >= 0 && 
            player.x + player.width > plat.x && 
            player.x < plat.x + plat.width && 
            player.y + player.height >= plat.y && 
            (player.y + player.height - (player.vy * dt * 2)) <= plat.y + 10) {
            
            if (!player.riding) {
                player.riding = plat;
                player.rideOffsetX = player.x - plat.x;
            }
            player.y = plat.y - player.height;
            player.isOnGround = true;
            player.doubleJump = false;
            player.vy = 0;
            break;
        }
    }
    
    // Check if we lost footing (e.g. platform moved under us and we aren't colliding)
    if (player.riding && (player.x + player.width < player.riding.x || player.x > player.riding.x + player.riding.width)) {
        player.riding = null;
    } else if (player.riding) {
        player.isOnGround = true;
        player.doubleJump = false;
    }

    for(let t of getCollidingTiles(player)){
        if(t.type===1){let fl=t.col>0&&t.col<G.mapCols-1&&((G.mapRows===15&&t.row>0&&t.row<13)||(G.mapRows===60&&t.row>0&&t.row<59));if(fl){if(player.vy>0&&!player.droppingThrough&&player.y-player.vy*dt+player.height <= t.rect.y+0.1){player.y=t.rect.y-player.height;player.isOnGround=true;player.doubleJump=false;player.vy=0;}}else{if(player.vy>0){player.y=t.rect.y-player.height;player.isOnGround=true;player.doubleJump=false;player.vy=0;}else if(player.vy<0){player.y=t.rect.y+t.rect.height;player.vy=0;}}}
        else if(t.type===6){if(player.vy>0&&!keys.ArrowDown&&player.y-player.vy*dt+player.height <= t.rect.y+0.1){player.y=t.rect.y-player.height;player.isOnGround=true;player.doubleJump=false;player.vy=0;}}
    }

    if(player.isOnGround&&player.vx!==0&&!player.isClimbing){player.walkTimer+=dt;if(player.walkTimer>0.15){playSound('playerMove');player.walkTimer=0;}}else player.walkTimer=0;
    if(player.y>G.mapRows*TILE_SIZE) playerDeath();
    if(player.x<0) player.x=0;
    if(player.x+player.width>G.mapCols*TILE_SIZE) player.x=G.mapCols*TILE_SIZE-player.width;
    updateBoss(dt);
    updateBombs(dt);
}
