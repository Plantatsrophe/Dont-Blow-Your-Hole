import os
from PIL import Image

# 1. Palette Setup
def hex_to_rgb(hex_str):
    if not hex_str: return None
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

raw_pal = {
    1: '#f1c27d', 2: '#ff2222', 3: '#f1c40f', 4: '#5c4033',
    5: '#050505', 6: '#444444', 7: '#ffffff', 8: '#ffffff', 9: '#00ffff',
    10: '#C0C0C0', 11: '#00cccc', 12: '#8b4513', 13: '#222222', 14: '#3ee855', 15: '#1e90ff', 16: '#5e4533',
    17: '#ff00ff', 18: '#0066ff', 19: '#2ecc71'
}

palette_items = [(id_val, hex_to_rgb(hex_val)) for id_val, hex_val in raw_pal.items()]

def find_closest_id(rgb, bg_color=None):
    if rgb == bg_color: return 0
    best_id = 0
    min_dist = float('inf')
    for p_id, p_rgb in palette_items:
        dist = sum((a - b) ** 2 for a, b in zip(rgb, p_rgb))
        if dist < min_dist:
            min_dist = dist
            best_id = p_id
    if min_dist > 5000 and sum(rgb) < 30: return 0 
    return best_id

# 2. Process GIF
GIF_FILE = 'glitch_boss.gif'
with Image.open(GIF_FILE) as img:
    frames = []
    for i in range(img.n_frames):
        img.seek(i)
        frame_rgba = img.convert('RGBA')
        width, height = frame_rgba.size
        bg_rgba = frame_rgba.getpixel((0, 0))
        bg_rgb = (bg_rgba[0], bg_rgba[1], bg_rgba[2])
        flat_array = []
        for y in range(height):
            for x in range(width):
                r, g, b, a = frame_rgba.getpixel((x, y))
                if a < 128:
                    flat_array.append(0)
                    continue
                color = (r, g, b)
                flat_array.append(find_closest_id(color, bg_rgb if bg_rgba[3] > 128 else None))
        frames.append(flat_array)

# 3. Generate TypeScript Code
output = []
output.append("/**\n * GLITCH BOSS ASSETS (SMART-REVERSE IMPORT)\n * ----------------------------------------\n * Mapping: Background -> 0, Colors -> Closest Palette ID.\n * Frames: " + str(len(frames)) + "\n */\n")

for i, frame in enumerate(frames):
    name = f"sprGlitch{i+1}"
    output.append(f"export const {name} = [")
    for row in range(64):
        line_slice = frame[row*64 : (row+1)*64]
        line_str = ",".join(map(str, line_slice))
        output.append(f"  {line_str},")
    output.append("];\n")

print("\n".join(output))
