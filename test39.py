import json, re, sys
s=open('levels.js', 'r', encoding='utf-8').read()
m=re.findall(r'{ map: \[\s*(.*?)\s*\]}', s, re.DOTALL)
l = [x.strip().strip('"') for x in m[39].replace('\r', '').split(',\n')]
print(f'Level 40: {len(l)} rows by {len(l[0])} cols. Contains U: {any("U" in r for r in l)}')
sys.stdout.flush()
