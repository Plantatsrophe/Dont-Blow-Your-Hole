import random

def generate_slums(i, tier):
    level = [["0"] * 100 for _ in range(15)]
    for c in range(100):
        level[0][c] = "1"
        level[13][c] = "1"
        level[14][c] = "1"
        
    level[12][98] = "5" 
    if i == 0 or (i + 1) % 5 == 0: level[12][3] = "H"
    level[12][50] = "C"

    c = 5
    while c < 94:
        c += random.randint(2, 4)
        if c >= 94: break
        choice = random.random()
        
        # Determine explicit scalable probabilities correctly!
        spike_prob = min(0.3 + (tier * 0.03), 0.55)
        plat_prob = spike_prob + 0.25
        enemy_prob = plat_prob + 0.15

        if choice < spike_prob:
            w = random.randint(1, min(3, 94 - c))
            for dx in range(w): level[13][c+dx] = "3"
            c += w
        elif choice < plat_prob:
            h = random.randint(7, 10)
            w = random.randint(2, 4)
            for dx in range(w):
                level[h][c+dx] = "1"
                level[13][c+dx] = "3"
            c += w
        elif choice < enemy_prob:
            level[12][c] = "L" if (i >= 9 and random.random() < 0.3) else "8"
    return level

def generate_acid(i, tier):
    level = [["0"] * 100 for _ in range(15)]
    for c in range(100):
        level[0][c] = "1"
        level[14][c] = "1"
        level[13][c] = "A" # ACID!
        
    for c in range(0, 4): level[13][c] = "1"
    for c in range(96, 100): level[13][c] = "1"
    level[12][98] = "5"
    
    level[12][50] = "C"
    level[13][50] = "1" 
    
    c = 4
    while c < 94:
        c += random.randint(2, 4)
        if c >= 94: break
        ptype = random.random()
        if ptype < 0.4:
            w = random.randint(2, 3)
            h = random.randint(9, 12)
            for dx in range(w):
                if c+dx < 96: level[h][c+dx] = "1"
            c += w
        elif ptype < 0.8:
            h = random.randint(9, 11)
            level[h][c+1] = "P"
            c += 4
        else:
            h = random.randint(5, 8)
            level[h][c+1] = "6"
            level[h][c+2] = "1"
            for r in range(h+1, 13): level[r][c+1] = "2"
            level[13][c+1] = "1"
            c += 3
    return level

def generate_shaft(i, tier):
    level = [["0"] * 15 for _ in range(60)]
    for r in range(60):
        level[r][0] = "1"
        level[r][14] = "1"
    for c in range(15):
        level[0][c] = "1"
        level[59][c] = "1"
        
    level[58][2] = "7" 
    level[30][7] = "C"
    level[31][7] = "1"
    
    level[2][12] = "5"
    level[3][12] = "1"
    level[3][11] = "1"
    level[3][13] = "1"
    
    # Establish First Platform and Ladder Bridge smoothly safely!
    level[54][4] = "1"
    level[54][5] = "1"
    level[54][6] = "1"
    level[54][4] = "6"
    for lr in range(55, 60):
        level[lr][4] = "2"
    
    y = 54
    while y > 5:
        y -= random.randint(3, 4)
        side = random.choice([1, 2, 3])
        if side == 1:
            level[y][1] = "1"
            level[y][2] = "1"
            level[y][3] = "1"
        elif side == 2:
            level[y][6] = "1"
            level[y][7] = "1"
            level[y][8] = "1"
        else:
            level[y][11] = "1"
            level[y][12] = "1"
            level[y][13] = "1"
            
        if random.random() < 0.3 and y < 50:
            cx = random.randint(4, 10)
            level[y][cx] = "6"
            for lr in range(y+1, y+5):
                level[lr][cx] = "2"
                
    return level

def generate_laser_factory(i, tier):
    level = [["0"] * 100 for _ in range(15)]
    for c in range(100):
        level[0][c] = "1"
        level[13][c] = "1"
        level[14][c] = "1"
    level[12][98] = "5"
    level[12][50] = "C"
    
    c = 5
    while c < 94:
        c += random.randint(3, 5)
        if c >= 94: break
        if random.random() < 0.6:
            level[12][c] = "1"
            level[11][c] = "1"
            level[10][c] = "L"
        else:
            for dx in range(4):
                if c+dx < 96: level[13][c+dx] = "3"
            level[9][c+1] = "P"
            c += 3
    return level

def generate_goliath(i, tier):
    level = [["0"] * 200 for _ in range(15)]
    for c in range(200):
        level[0][c] = "1"
        level[13][c] = "1"
        level[14][c] = "1"
    level[12][198] = "5"
    level[12][80] = "C"
    level[12][140] = "C"
    
    c = 5
    while c < 190:
        c += random.randint(2, 5)
        if c >= 190: break
        choice = random.random()
        if choice < 0.4:
            w = random.randint(2, 5)
            for dx in range(w):
                if c+dx < 196: level[13][c+dx] = "3"
            c += w
        elif choice < 0.7:
            h = random.randint(8, 11)
            level[h][c] = "1"
            level[h][c+1] = "1"
            c += 2
        else:
            level[12][c] = "L" if random.random() < 0.5 else "8"
    return level

with open("levels.js", "w") as f:
    f.write("const staticLevels = [\n")
    for i in range(100):
        biome = (i // 10) % 5
        tier = i // 10
        if biome == 0:
            level = generate_slums(i, tier)
        elif biome == 1:
            level = generate_acid(i, tier)
        elif biome == 2:
            level = generate_shaft(i, tier)
        elif biome == 3:
            level = generate_laser_factory(i, tier)
        else:
            level = generate_goliath(i, tier)
            
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
