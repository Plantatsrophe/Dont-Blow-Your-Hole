import re

with open('scripts/generate_levels.py', 'r') as f:
    text = f.read()

# Replace level[11][13] and level[10][32]
text = text.replace('level[11][13] = "P"', 'level[9][13] = "P"')
text = text.replace('level[11][7] = "1"', 'level[9][7] = "1"')
text = text.replace('level[11][18] = "1"', 'level[9][18] = "1"')

text = text.replace('level[10][32] = "P"', 'level[9][32] = "P"')
text = text.replace('level[10][24] = "1" # L Bound', 'level[9][24] = "1" # L Bound')
text = text.replace('level[10][40] = "1"', 'level[9][40] = "1"')

with open('scripts/generate_levels.py', 'w') as f:
    f.write(text)
print('Fixed floor collision!')
