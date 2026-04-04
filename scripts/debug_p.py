import json
with open('src/data/levels.js', 'r') as f:
    text = f.read()

parts = text.split('map: [')
target = parts[40].split(']')[0]
lines = target.split('"')
grid = [l for l in lines if len(l) > 10]

import math

def trace_p(r, c):
    rangeTiles = 15
    TILE_SIZE = 32
    pWidth = 64

    # target min max
    targetMinX = (c - rangeTiles/2.0) * TILE_SIZE
    targetMaxX = (c + rangeTiles/2.0) * TILE_SIZE

    # scan left
    scanMinC = c
    rL = max(0, r - 4)
    rH = min(14, r + 4)

    while scanMinC > 0:
        blocked = False
        for rr in range(rL, rH+1):
            if grid[rr][scanMinC - 1] == '1':
                blocked = True
                break
        if blocked: break
        scanMinC -= 1

    scanMaxC = c
    while scanMaxC < 99:
        blocked = False
        for rr in range(rL, rH+1):
            if grid[rr][scanMaxC + 1] == '1':
                blocked = True
                break
        if blocked: break
        scanMaxC += 1

    minX = max(scanMinC * TILE_SIZE, targetMinX)
    maxX = min((scanMaxC + 1) * TILE_SIZE - pWidth, targetMaxX)
    
    print(f'P at {r},{c} -> scanMinC={scanMinC}, targetMin={targetMinX}, scanMaxC={scanMaxC}, targetMax={targetMaxX}')
    print(f'   Bounds: X: [{minX}, {maxX}] -> Moving {maxX - minX} pixels')

for r in range(15):
    for c in range(100):
        if grid[r][c] == 'P':
            trace_p(r, c)
