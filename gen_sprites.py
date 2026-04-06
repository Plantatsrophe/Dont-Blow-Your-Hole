"""
DONT DIE - PROCEDURAL SPRITE GENERATOR
--------------------------------------
This utility script generates numerical sprite arrays for high-complexity 
bosses (specifically Auh-Gr). It uses mathematical functions to define 
geometry, symmetry, and animation offsets, then exports them as 
TypeScript constants for the engine to consume.
"""

import math
def generate_frame(offset):
    width_cols = 48
    height_cols = 16
    grid = [[0 for _ in range(width_cols)] for _ in range(height_cols)]

    center_left = 23
    center_right = 24
    
    for r in range(height_cols):
        for c in range(width_cols):
            dist = center_left - c if c <= center_left else c - center_right
            
            # Body block (spans 14 columns left from 23 -> c=10. 14 right from 24 -> c=38)
            if 7 <= r <= 15 and dist <= 14:
                # Symmetrical V-shaped stripes
                if (dist - r + offset) % 4 <= 1:
                    grid[r][c] = 10 # Black
                else:
                    grid[r][c] = 3  # Yellow
            
            # Central Drill (r 0-6)
            if 0 <= r <= 6:
                drill_radius = int((r + 1) * 1.5)
                if dist <= drill_radius - 0.5:
                    grid[r][c] = 5 if (r - offset) % 3 == 0 else 8
            
            # Side Drills (r 4-12)
            if 4 <= r <= 12:
                # Center around dist=18 (c=5 and c=42)
                if abs(dist - 18) <= (r - 2) * 0.8:
                    grid[r][c] = 5 if (r - offset) % 3 == 0 else 8

    return grid

with open('src/assets/sprites_auhgr.ts', 'w') as f:
    for i in range(3):
        grid = generate_frame(i)
        f.write(f'export const sprAuhGr{i+1} = [\n')
        for r in grid:
            f.write('  ' + ','.join(str(x) for x in r) + ',\n')
        f.write('];\n')
