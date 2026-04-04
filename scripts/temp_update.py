import re

with open('scripts/generate_levels.py', 'r') as f:
    lines = f.readlines()

start = -1
end = -1
for i, l in enumerate(lines):
    if 'def generate_acid' in l:
        start = i
        break
for i, l in enumerate(lines[start+1:]):
    if 'return level' in l:
        end = start + 1 + i
        break

new_block = """    if (i + 1) % 20 == 0:
        level = [["0"] * 100 for _ in range(15)]
        for c in range(100):
            level[0][c] = "1"
            level[13][c] = "A" 
            level[14][c] = "1"
        
        # Safe Start
        for c in range(0, 8): level[12][c] = "1"
        level[11][2] = "7"; level[11][3] = "C"; level[11][4] = "H"
        
        # Valve 1 (Low)
        for c in range(21, 25): level[10][c] = "1"
        level[9][22] = "V"
        
        # Start -> P -> U -> Valve 1
        level[11][13] = "P" 
        level[11][7] = "1" # L Bound (Safe Start ends at 7 so this seamlessly connects)
        level[11][18] = "1" # R Bound

        level[10][19] = "U" 
        level[6][19] = "1" # T Bound (Huge vertical sweep)
        level[12][19] = "1" # B Bound
        
        level[10][32] = "P" 
        level[10][24] = "1" # L Bound (Connects to V1 platform)
        level[10][40] = "1" 

        # Valve 2 (Mid)
        for c in range(46, 50): level[7][c] = "1"
        level[6][47] = "V"
        
        level[8][36] = "P" # P under Valve 2 area
        level[8][28] = "1"
        level[8][43] = "1"
        
        level[9][44] = "U" 
        level[5][44] = "1"
        level[12][44] = "1"
        
        # Valve 3 (High)
        for c in range(75, 80): level[4][c] = "1"
        level[3][77] = "V"
        
        level[6][55] = "P" 
        level[6][48] = "1"
        level[6][62] = "1"
        
        level[6][63] = "U" 
        level[2][63] = "1"
        level[10][63] = "1"

        level[5][69] = "P"
        level[5][64] = "1"
        level[5][74] = "1"
        
        # Boss in the middle
        level[12][50] = "B"
        
        # Exit/Safe End
        for c in range(88, 100): level[12][c] = "1"
        level[11][95] = "0"
        
        return level\n"""

lines[start+1:end+1] = [new_block]
with open('scripts/generate_levels.py', 'w') as f:
    f.writelines(lines)
print('Patched successfully!')
