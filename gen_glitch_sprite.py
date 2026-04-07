"""
GLITCH BOSS SPRITE GENERATOR
Generates 4 frames of a 64x64 pixel array for the 'Glitch' boss.
Output: src/assets/sprites_glitch.ts
"""

def generate_frame(frame_idx):
    size = 64
    grid = [[0 for _ in range(size)] for _ in range(size)]
    
    # Offsets based on frame
    y_off = 0
    if frame_idx == 1: y_off = -2 # Frame 2: Shifted up 2
    if frame_idx == 3: y_off = 1  # Frame 4: Shifted down 1
    
    # 1. DEFINE STEED BODY (Metallic Blue + Black plating)
    # Body main block (approx y 30-50, x 10-50)
    for r in range(32, 48):
        for c in range(10, 52):
            tr = r + y_off
            if 0 <= tr < size:
                # Plating pattern
                if (c + r) % 8 < 2:
                    grid[tr][c] = 10 # Black Plate
                else:
                    grid[tr][c] = 11 # Metallic Blue
                    
    # Steed Neck / Head
    for r in range(25, 35):
        for c in range(48, 60):
            tr = r + y_off
            # Angular neck
            if c - 48 >= (r - 25):
                if 0 <= tr < size and c < size:
                    grid[tr][c] = 11
                    
    # Muzzle Energy Core (Turquoise)
    for r in range(28, 33):
        for c in range(56, 62):
            tr = r + y_off
            if 0 <= tr < size and c < size:
                grid[tr][c] = 18

    # Steed Legs (Gallop Animation)
    leg_pos = [
        # Front Left, Front Right, Back Left, Back Right
        [ (50, 48), (55, 48), (15, 48), (20, 48) ], # Frame 1: Standard
        [ (52, 48), (57, 48), (17, 48), (22, 48) ], # Frame 2: Moving
        [ (60, 44), (63, 44), (5, 44), (8, 44) ],   # Frame 3: Extended
        [ (50, 48), (55, 48), (15, 48), (20, 48) ], # Frame 4: Returning
    ]
    
    for lx, ly in leg_pos[frame_idx]:
        for dr in range(0, 14):
            for dc in range(-2, 3):
                tr = ly + dr + y_off
                tc = lx + dc
                if 0 <= tr < size and 0 <= tc < size:
                    grid[tr][tc] = 11
                    # White Joint Highlights
                    if dr % 6 == 0:
                        grid[tr][tc] = 8

    # 2. RIDER (GLITCH) - Silver + Black Circuitry
    # Torso
    rider_y_base = 15
    rider_x_base = 25
    torso_width = 16
    torso_height = 20
    
    if frame_idx == 2: # Frame 3: Torso low
        rider_y_base += 4
        
    for r in range(rider_y_base, rider_y_base + torso_height):
        for c in range(rider_x_base - torso_width//2, rider_x_base + torso_width//2):
            tr = r + y_off
            if 0 <= tr < size and 0 <= c < size:
                # Circuitry Pattern
                is_pattern = (c * r) % 7 == 0 or (c + r) % 5 == 0
                
                # Frame 2: Patterns flicker with Cyan
                if frame_idx == 1 and is_pattern:
                    grid[tr][c] = 9 if (r + c + frame_idx) % 2 == 0 else 10
                elif is_pattern:
                    grid[tr][c] = 10 # Black
                else:
                    grid[tr][c] = 5  # Silver
                    
    # Jester Hat (Two horns)
    for r in range(rider_y_base - 12, rider_y_base):
        for c in range(rider_x_base - 10, rider_x_base + 11):
            tr = r + y_off
            if 0 <= tr < size and 0 <= c < size:
                # Horn logic
                dx = abs(c - rider_x_base)
                if dx > 4 and r - (rider_y_base - 12) > (dx - 5):
                    # alternating colors
                    grid[tr][c] = 10 if c < rider_x_base else 5
                    # Bells (Metallic Blue)
                    if r == rider_y_base - 12:
                        grid[tr][c] = 11

    # 3. EMPTY ZONES (MANDATORY)
    # Hair: (20, 15) to (44, 25)
    for r in range(15, 26):
        for c in range(20, 45):
            tr = r + y_off
            if 0 <= tr < size:
                grid[tr][c] = 0
                
    # Tail Anchor: Back of steed (approx x 5-15, y 35-45)
    for r in range(35, 46):
        for c in range(5, 16):
            tr = r + y_off
            if 0 <= tr < size:
                grid[tr][c] = 0

    return grid

def save_sprites():
    with open('src/assets/sprites_glitch.ts', 'w') as f:
        f.write("/**\n")
        f.write(" * GLITCH BOSS ASSETS\n")
        f.write(" * Rider on Virtual Steed (64x64)\n")
        f.write(" */\n\n")
        for i in range(4):
            grid = generate_frame(i)
            # Flatten grid
            flat = [pixel for row in grid for pixel in row]
            f.write(f"export const sprGlitch{i+1} = [\n")
            # Write in chunks of 64 for readability
            for row in range(64):
                f.write("  " + ",".join(map(str, flat[row*64:(row+1)*64])) + ",\n")
            f.write("];\n\n")

if __name__ == "__main__":
    save_sprites()
    print("Generated src/assets/sprites_glitch.ts")
