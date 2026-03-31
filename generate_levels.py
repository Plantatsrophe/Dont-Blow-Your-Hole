import random

with open("levels.js", "w") as f:
    f.write("const staticLevels = [\n")
    for i in range(100):
        # Map: 15 rows x 100 cols
        level = [["0"] * 100 for _ in range(15)]
        
        # Ceiling & Base Floor
        for c in range(100):
            level[0][c] = "1"
            level[13][c] = "1"
            level[14][c] = "1"
            
        # Spawn point implicitly at (r=12, c=1)
        # Goal implicitly at (r=12, c=98)
        level[12][98] = "5" # Time Portal
        
        # Hotdog Insertion Logic (First level & every 5th)
        if i == 0 or (i + 1) % 5 == 0:
            level[12][3] = "H" # Placed intuitively immediately near the spawn!

        # Dynamic Difficulty Curve (Scales aggressively every 5th level linearly mapping bounds!)
        tier = i // 5 
        spike_prob = min(0.30 + (tier * 0.05), 0.85)
        plat_prob = min(0.55 + (tier * 0.03), 0.90) 
        ladder_prob = min(0.10 + (tier * 0.02), 0.50)
        enemy_prob = min(0.10 + (tier * 0.03), 0.60)
        step_size = max(4 - (tier // 3), 2)
        
        # Scramble middle safely organically mapped mapping scaling density natively!
        for c in range(5, 94, step_size):
            
            # Floor Spike sequence (Longer pits map logically proportional to tier organically)
            if random.random() < spike_prob:
                level[13][c] = "3"
                if c+1 < 99: level[13][c+1] = "3"
                if c+2 < 99 and random.random() < (0.2 + tier * 0.04): level[13][c+2] = "3"
                
            # Floating Platform sequence (Steady explicitly bridging paths safely)
            if random.random() < plat_prob:
                hR = random.randint(7, 10)
                level[hR][c] = "1"
                if c+1 < 99: level[hR][c+1] = "1"
                if c+2 < 99 and random.random() < (0.6 - (tier*0.02)): level[hR][c+2] = "1"
                if random.random() < 0.3:
                    level[hR-1][c+1] = "4" # Cash
                    
            # Moving Platform Sequence 
            if random.random() < 0.25 + (tier * 0.02):
                hP = random.randint(8, 11)
                level[hP][c] = "P"
                if random.random() < 0.3:
                    level[hP-1][c] = "4" 
                    
                    
            # Vertical Ladder Sequence 
            if random.random() < ladder_prob:
                hR = random.randint(5, 8)
                level[hR][c] = "6" # Ladder Platform Top
                if c+1 < 99: level[hR][c+1] = "1"
                if c+2 < 99: level[hR][c+2] = "1"
                # Drop ladder rails linearly to the floor safely
                for l_r in range(hR+1, 13):
                    level[l_r][c] = "2"
                # Force a safe landing zone exactly beneath the ladder definitively
                level[13][c] = "1"
                # Reward high climbs organically
                if random.random() < 0.5:
                    level[hR-1][c+1] = "4" # Cash
            
            # Enemy placement (Contextually scaling dynamically structurally mapped!)
            if random.random() < enemy_prob and level[13][c] == "1":
                if i >= 9 and random.random() < 0.15:
                    level[12][c] = "L" # Laser Bot natively introduced!
                else:
                    level[12][c] = "8" # Standard Bot
        
        # Enforce Minimum Clearance mechanically for the strings
        for c in range(1, 99):
            for r in range(13, 2, -1):
                if level[r][c] == "1" or level[r][c] == "6" or level[r][c] == "3":
                    above = level[r-1][c]
                    if above != "1" and above != "3":
                        ceiling = level[r-2][c]
                        if ceiling == "1" or ceiling == "3":
                            level[r-2][c] = "0"
        
        # Format explicitly
        f.write("    {\n        map: [\n")
        for r in range(15):
            row_str = "".join(level[r])
            if r < 14:
                f.write(f'            "{row_str}",\n')
            else:
                f.write(f'            "{row_str}"\n')
        f.write("        ]\n    }")
        
        if i < 99:
            f.write(",\n")
        else:
            f.write("\n")
            
    f.write("];\n")
