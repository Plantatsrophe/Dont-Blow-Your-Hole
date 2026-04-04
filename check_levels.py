import json, re
import sys
s = open('src/data/levels.js', 'r', encoding='utf-8').read()
m = re.findall(r'{ level: (\d+), map: \[\s*(.*?)\s*\]}', s, re.DOTALL)
res = []
for lvl, mp in m:
    lvl = int(lvl)
    if 21 <= lvl <= 40:
        l = [x.strip().strip('"') for x in mp.replace('\r', '').split(',\n')]
        print(f'Level {lvl}: {len(l)} rows by {len(l[0]) if l else 0} cols. Contains H: {any("H" in r for r in l)}')
sys.stdout.flush()
