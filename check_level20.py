import json, re, sys
s=open('src/data/levels.js', 'r', encoding='utf-8').read()
m=re.findall(r'{ level: (\d+), map: \[\s*(.*?)\s*\]}', s, re.DOTALL)
for lvl, mp in m:
    if int(lvl) == 20:
        l = [x.strip().strip('"') for x in mp.replace('\r', '').split(',\n')]
        print(f'Level 20: {len(l)} rows by {len(l[0])} cols.')
sys.stdout.flush()
