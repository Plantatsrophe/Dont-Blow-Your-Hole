import base64

with open('images/Grfc white.png', 'rb') as f:
    encoded = base64.b64encode(f.read()).decode('utf-8')
    data = f'const logoBase64 = "data:image/png;base64,{encoded}";\n'
    
with open('logo.js', 'w') as out:
    out.write(data)
