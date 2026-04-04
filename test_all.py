import json, re, sys
s=open('levels.js', 'r', encoding='utf-8').read()
m=re.findall(r'{ map: \[\s*(.*?)\s*\]}', s, re.DOTALL)
for i in range(20, 40):
    l = [x.strip().strip('"') for x in m[i].replace('\r', '').split(',\n')]
    if i == 39: continue
    if not any("U" in r for r in l):
        print(f"Level {i+1} is missing U!")
print("Checked 21-39. All good if no missing U prints above.")
sys.stdout.flush()
