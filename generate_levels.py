import random

def generate_slums(i, difficulty):
    if (i + 1) % 20 == 0:
        level = [["0"] * 100 for _ in range(15)]
        for c in range(100):
            level[0][c] = "1"
            level[13][c] = "1"
            level[14][c] = "1"
        level[12][98] = "0"
        level[11][50] = "B" # Masticator 
        
        # Safe Hover Spawn
        for sc in range(1, 5):
            level[8][sc] = "1"
        level[7][2] = "7" # Player Spawn
        level[7][3] = "C" # Checkpoint
        level[7][4] = "H" # Hotdog

        for px in [15, 35, 65, 85]:
            for y in range(8, 13):
                level[y][px] = "1"
            level[7][px] = "M" # Bomb
        return level

    level = [["0"] * 100 for _ in range(15)]
    for c in range(100):
        level[0][c] = "1"
        level[13][c] = "1"
        level[14][c] = "1"
        
    level[12][98] = "5" 
    if i == 0 or (i + 1) % 5 == 0: level[12][3] = "H"
    level[12][50] = "C" # Strictly locked to the solid floor mathematically safe implicitly

    c = 5
    while c < 94:
        c += random.randint(2, 4)
        if c >= 94: break
        choice = random.random()
        
        # Determine explicit scalable probabilities
        spike_prob = min(0.3 + (difficulty * 0.03), 0.55)
        plat_prob = spike_prob + 0.25
        enemy_prob = plat_prob + 0.15

        if choice < spike_prob:
            w = random.randint(1, min(3, 94 - c))
            for dx in range(w): 
                # Never override Checkpoint or Portal floor tiles natively structurally safely!
                if c+dx != 50 and c+dx != 98:
                    level[13][c+dx] = "3"
            c += w
        elif choice < plat_prob:
            h = random.randint(9, 11) # Cap max reach strictly organically
            w = random.randint(2, 4)
            for dx in range(w):
                level[h][c+dx] = "1"
                level[13][c+dx] = "3"
            if random.random() < 0.3:
                level[h-1][c+1] = "4" # Cash Item dynamically over the spike pit
            c += w
        elif choice < enemy_prob:
            level[12][c] = "L" if (i >= 9 and random.random() < 0.3) else "8"
    return level

def generate_acid(i, difficulty):
    if (i + 1) % 20 == 0:
        level = [["0"] * 100 for _ in range(15)]
        for c in range(100):
            level[0][c] = "1"
            level[13][c] = "A" 
            level[14][c] = "1"
        for c in range(0, 15): level[13][c] = "1"
        for c in range(85, 100): level[13][c] = "1"
        level[12][98] = "0"
        level[12][50] = "B" # Sludge Queen
        
        # Safe Hover Spawn
        for sc in range(1, 5):
            level[8][sc] = "1"
        level[7][2] = "7" # Player Spawn
        level[7][3] = "C" # Checkpoint
        level[7][4] = "H" # Hotdog
        for c in range(40, 60): level[10][c] = "1"
        level[8][25] = "V"
        level[8][75] = "V"
        return level

    level = [["0"] * 100 for _ in range(15)]
    for c in range(100):
        level[0][c] = "1"
        level[14][c] = "1"
        level[13][c] = "A" # ACID!
        
    for c in range(0, 4): level[13][c] = "1"
    for c in range(96, 100): level[13][c] = "1"
    level[12][98] = "5"
    if i == 0 or (i + 1) % 5 == 0: level[12][3] = "H"
    
    c = 4
    last_h = 13
    placed_cp = False
    while c < 94:
        c += random.randint(2, 3) # Constrict max horizontal gap naturally
        if c >= 94: break
        ptype = random.random()
        if ptype < 0.4:
            w = random.randint(2, 3)
            # Bound height tightly to limit verticality jumps
            h = min(12, max(8, last_h + random.randint(-1, 1))) 
            for dx in range(w):
                if c+dx < 96: level[h][c+dx] = "1"
                
            # Randomly place Cash floating securely above the gap
            if c >= 6 and random.random() < 0.4:
                level[min(h, last_h) - 2][c - 1] = "4"
                
            # Shaft logic relies strictly on climbing mechanics so tiering injects more drones
            if random.random() < 0.15 + (difficulty * 0.05) and h < 13:             level[h-1][c+1] = "8"
                
            if c >= 45 and not placed_cp:
                level[h-1][c] = "C"
                placed_cp = True
            last_h = h
            c += w
        elif ptype < 0.8:
            h = min(12, max(8, last_h + random.randint(-1, 1)))
            level[h][c+1] = "P"
            last_h = h
            c += 4
        else:
            h = random.randint(5, 8)
            level[h][c+1] = "6"
            level[h][c+2] = "1"
            for r in range(h+1, 13): level[r][c+1] = "2"
            level[13][c+1] = "1" # Solid landing block perfectly implicitly mapped
            last_h = h
            c += 3
    return level

def generate_shaft(i, difficulty):
    if (i + 1) % 20 == 0:
        level = [["0"] * 15 for _ in range(60)]
        for r in range(60):
            level[r][0] = "1"
            level[r][14] = "1"
        for c in range(15):
            level[0][c] = "1"
            level[59][c] = "1"
        level[58][7] = "0" # Old Hotdog
        level[58][6] = "B" # Warden Drone
        level[2][12] = "0"
        
        # Safe Side Tunnel Spawn (Enclosed at the bottom left)
        for r in range(54, 60):
            level[r][4] = "1" # Wall shielding from Boss
        level[58][2] = "7" # Player
        level[58][3] = "C" # Checkpoint
        level[57][3] = "H" # Hotdog
        
        y = 54
        side = 1
        while y > 5:
            if side == 1:
                level[y][1] = "1"; level[y][2] = "1"; level[y][3] = "1"
                side = 2
            elif side == 2:
                level[y][6] = "1"; level[y][7] = "1"; level[y][8] = "1"
                side = 3
            else:
                level[y][11] = "1"; level[y][12] = "1"; level[y][13] = "1"
                side = 1
            y -= 4
        level[4][7] = "V"
        return level

    level = [["0"] * 15 for _ in range(60)]
    for r in range(60):
        level[r][0] = "1"
        level[r][14] = "1"
    for c in range(15):
        level[0][c] = "1"
        level[59][c] = "1"
        
    level[58][2] = "7" 
    if i == 0 or (i + 1) % 5 == 0: level[57][3] = "H"
    
    level[2][12] = "5"
    level[3][12] = "1"
    level[3][11] = "1"
    level[3][13] = "1"
    
    # Establish First Platform and Ladder Bridge
    level[54][4] = "1"
    level[54][5] = "1"
    level[54][6] = "1"
    level[54][4] = "6"
    for lr in range(55, 60):
        level[lr][4] = "2"
    
    y = 54
    placed_cp = False
    side = 2 # Start in the middle
    while y > 5:
        # Cap vertical jump demands 
        y -= random.randint(2, 3)
        # Lock side shifting to mathematically adjacent jumps
        side = max(1, min(3, side + random.randint(-1, 1)))
        
        if side == 1:
            level[y][1] = "1"
            level[y][2] = "1"
            level[y][3] = "1"
            if random.random() < 0.2 + (difficulty*0.05): level[y-1][2] = "4"
            if random.random() < 0.15 + (difficulty*0.05): level[y-1][1] = "8"
        elif side == 2:
            level[y][6] = "1"
            level[y][7] = "1"
            level[y][8] = "1"
            if random.random() < 0.2 + (difficulty*0.05): level[y-1][7] = "4"
            if random.random() < 0.15 + (difficulty*0.05): level[y-1][6] = "8"
        else:
            level[y][11] = "1"
            level[y][12] = "1"
            level[y][13] = "1"
            if random.random() < 0.2 + (difficulty*0.05): level[y-1][12] = "4"
            if random.random() < 0.15 + (difficulty*0.05): level[y-1][13] = "8"
            
        if y <= 30 and not placed_cp:
            level[y-1][(side * 5) - 3] = "C" # Automatically anchor sequentially
            placed_cp = True
            
        if random.random() < 0.3 and y < 50:
            cx = random.randint(4, 10)
            level[y][cx] = "6"
            for lr in range(y+1, y+5):
                level[lr][cx] = "2"
                
    return level

def generate_laser_factory(i, difficulty):
    if (i + 1) % 20 == 0:
        level = [["0"] * 100 for _ in range(15)]
        for c in range(100):
            level[0][c] = "1"
            level[13][c] = "1"
            level[14][c] = "1"
        level[12][3] = "0"
        level[12][98] = "0"
        level[6][50] = "B" # Core CPU
        
        # Safe Hover Spawn
        for sc in range(1, 5):
            level[8][sc] = "1"
        level[7][2] = "7" # Player Spawn
        level[7][3] = "C" # Checkpoint
        level[7][4] = "H" # Hotdog
        
        level[12][20] = "V"
        level[12][80] = "V"
        level[5][20] = "V"
        level[5][80] = "V"
        for dx in range(3):
            level[8][18+dx] = "1"
            level[8][78+dx] = "1"
        return level

    level = [["0"] * 100 for _ in range(15)]
    for c in range(100):
        level[0][c] = "1"
        level[13][c] = "1"
        level[14][c] = "1"
    level[12][98] = "5"
    if i == 0 or (i + 1) % 5 == 0: level[12][3] = "H"
    
    c = 5
    placed_cp = False
    while c < 94:
        # Cap horizontal leaps dynamically
        c += random.randint(3, 4)
        if c >= 94: break
        if random.random() < 0.6:
            level[12][c] = "1"
            level[11][c] = "1"
            level[10][c] = "L" if difficulty > 3 and random.random() < 0.1 else "1"
            if c >= 45 and not placed_cp:
                level[9][c] = "C"
                placed_cp = True
        else:
            if c >= 45 and not placed_cp:
                level[12][c] = "C"
                placed_cp = True
            else:
                l_prob = 0.1 + (difficulty * 0.05)
                level[12][c] = "L" if random.random() < l_prob else ("4" if random.random() < 0.4 else "0")
            for dx in range(4):
                if c+dx < 96: level[13][c+dx] = "3"
            level[9][c+1] = "P"
            if random.random() < 0.5: level[8][c+1] = "4"
            c += 3
    return level

def generate_goliath(i, difficulty):
    if (i + 1) % 20 == 0:
        level = [["0"] * 200 for _ in range(15)]
        for c in range(200):
            level[0][c] = "1"
            level[13][c] = "1"
            level[14][c] = "1"
        level[12][5] = "0"
        level[12][3] = "B" # Goliath Prime
        
        # Safe Hover Spawn
        for sc in range(8, 12):
            level[8][sc] = "1"
        level[7][9] = "7" # Player Spawn
        level[7][10] = "C" # Checkpoint
        level[7][11] = "H" # Hotdog
        
        if i >= 49: # Fix: Last level detonator correctly
            level[12][198] = "D" # Detonator!
        else:
            level[12][198] = "0"
            
        c = 20
        while c < 185:
            level[13][c] = "3"
            level[13][c+1] = "3"
            level[13][c+2] = "3"
            c += 15
        return level

    level = [["0"] * 200 for _ in range(15)]
    for c in range(200):
        level[0][c] = "1"
        level[13][c] = "1"
        level[14][c] = "1"
    level[12][198] = "5"
    if i == 0 or (i + 1) % 5 == 0: level[12][3] = "H"
    
    c = 5
    placed_cp_1 = False
    placed_cp_2 = False
    while c < 190:
        # Cap Goliath max gaps linearly
        c += random.randint(2, 4)
        if c >= 190: break
        choice = random.random()
        if choice < 0.4:
            w = random.randint(2, 5)
            for dx in range(w):
                if c+dx < 196: level[13][c+dx] = "3"
            c += w
        elif choice < 0.7:
            h = random.randint(9, 11) # Cap max reach strictly 
            level[h][c] = "1"
            level[h][c+1] = "1"
            if random.random() < 0.4: level[h-1][c] = "4"
            if c >= 60 and not placed_cp_1:
                level[h-1][c] = "C"
                placed_cp_1 = True
            elif c >= 130 and not placed_cp_2:
                level[h-1][c] = "C"
                placed_cp_2 = True
            c += 2
        else:
            obj_prob = random.random()
            if obj_prob < 0.15 + (difficulty * 0.05):
                level[12][c] = "L"
            elif obj_prob < 0.4 + (difficulty * 0.05):
                level[12][c] = "8"
            elif obj_prob < 0.7:
                level[12][c] = "4"
    return level

with open("levels.js", "w") as f:
    f.write("const staticLevels = [\n")
    for i in range(100):
        biome = i // 20
        local_level = i % 20
        difficulty = (biome * 2.0) + (local_level * 0.25)
        
        if biome == 0:
            level = generate_slums(i, difficulty)
        elif biome == 1:
            level = generate_acid(i, difficulty)
        elif biome == 2:
            level = generate_shaft(i, difficulty)
        elif biome == 3:
            level = generate_laser_factory(i, difficulty)
        else:
            level = generate_goliath(i, difficulty)
            
        f.write("    { map: [\n")
        for r_idx, row in enumerate(level):
            row_str = "".join(row)
            if r_idx == len(level) - 1:
                f.write(f"        \"{row_str}\"\n")
            else:
                f.write(f"        \"{row_str}\",\n")
        
        if i == 99:
            f.write("    ]}\n")
        else:
            f.write("    ]},\n")
    f.write("];\n")
