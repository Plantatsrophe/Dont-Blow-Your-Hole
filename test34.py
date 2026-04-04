import json, re, sys
s=open('src/data/levels.js', 'r', encoding='utf-8').read()
m=re.findall(r'{ map: \[\s*(.*?)\s*\]}', s, re.DOTALL)
l = [x.strip().strip('"') for x in m[33].replace('\r', '').split(',\n')]
for r, row in enumerate(l):
    print(f"{r:2}: {row}")
sys.stdout.flush()
