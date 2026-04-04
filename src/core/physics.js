import { G, player, keys, canvas, TILE_SIZE, addScore } from './globals.js?v=127';
import { playSound, stopBackgroundMusic } from '../assets/audio.js?v=127';
import { parseMap, resetPlayerPosition } from '../logic/spawner.js?v=127';
import { getCollidingTiles, playerDeath, checkRectCollision } from './physics_utils.js?v=127';
import { updateBoss, updateBombs } from './physics_boss.js?v=127';

export function updatePhysics(dt) {
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
    if(hitGoal&&G.gameState!=='LEVEL_CLEAR'){G.gameState='LEVEL_CLEAR';G.winTimer=0;playSound('win');addScore(G.timer*100);return;}
    if(onLadder){if(keys.ArrowUp||keys.ArrowDown){player.isClimbing=true;player.doubleJump=false;}}else player.isClimbing=false;
    if(player.isClimbing){player.vy=0;if(keys.ArrowUp)player.vy=-player.speed*0.6;if(keys.ArrowDown)player.vy=player.speed*0.6;}
    else{player.vy+=player.gravity*dt;if(player.vy>800)player.vy=800;}
    
    if (player.riding) { player.rideOffsetX += player.vx * dt; player.x = player.riding.x + player.rideOffsetX; }
    else { player.x += player.vx * dt; }
    for(let t of getCollidingTiles(player)){if(t.type===1){let fl=t.col>0&&t.col<G.mapCols-1&&((G.mapRows===15&&t.row>0&&t.row<13)||(G.mapRows===60&&t.row>0&&t.row<59));if(!fl){if(player.vx>0)player.x=t.rect.x-player.width;else if(player.vx<0)player.x=t.rect.x+t.rect.width;player.vx=0;}}}
    player.y += player.vy * dt;
    player.isOnGround = false;
    for (let plat of G.platforms) {
        if (player.vy >= 0 && player.x + player.width > plat.x && player.x < plat.x + plat.width && player.y + player.height >= plat.y && (player.y + player.height - (player.vy * dt * 2)) <= plat.y + 10) {
            if (!player.riding) { player.riding = plat; player.rideOffsetX = player.x - plat.x; }
            player.y = plat.y - player.height; player.isOnGround = true; player.doubleJump = false; player.vy = 0; break;
        }
    }
    if (player.riding && (player.x + player.width < player.riding.x || player.x > player.riding.x + player.riding.width)) { player.riding = null; }
    else if (player.riding) { player.isOnGround = true; player.doubleJump = false; }

    for(let t of getCollidingTiles(player)){
        if(t.type===1){let fl=t.col>0&&t.col<G.mapCols-1&&((G.mapRows===15&&t.row>0&&t.row<13)||(G.mapRows===60&&t.row>0&&t.row<59));if(fl){if(player.vy>0&&!player.droppingThrough&&player.y-player.vy*dt+player.height <= t.rect.y+0.1){player.y=t.rect.y-player.height;player.isOnGround=true;player.doubleJump=false;player.vy=0;}}else{if(player.vy>0){player.y=t.rect.y-player.height;player.isOnGround=true;player.doubleJump=false;player.vy=0;}else if(player.vy<0){player.y=t.rect.y+t.rect.height;player.vy=0;}}}
        else if(t.type===6){if(player.vy>0&&!keys.ArrowDown&&player.y-player.vy*dt+player.height <= t.rect.y+0.1){player.y=t.rect.y-player.height;player.isOnGround=true;player.doubleJump=false;player.vy=0;}}
    }
    if(player.isOnGround&&player.vx!==0&&!player.isClimbing){player.walkTimer+=dt;if(player.walkTimer>0.15){playSound('playerMove');player.walkTimer=0;}}else player.walkTimer=0;
    if(player.y>G.mapRows*TILE_SIZE) playerDeath();
    if(player.x<0) player.x=0;
    if(player.x+player.width>G.mapCols*TILE_SIZE) player.x=G.mapCols*TILE_SIZE-player.width;
    updateBoss(dt); updateBombs(dt);
}
