"""Remove background from Ninebot photo and crop slightly closer."""
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
src = os.path.join(ROOT, 'img', 'products', 'used-55.jpg')
out = os.path.join(ROOT, 'img', 'products', 'used-55.png')

try:
    from rembg import remove
    with open(src, 'rb') as f:
        result = remove(f.read())
    img = Image.open(__import__('io').BytesIO(result)).convert('RGBA')
except Exception as e:
    print('rembg failed, using PIL only:', e)
    img = Image.open(src).convert('RGBA')

# Trim transparent borders then zoom ~8%
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

w, h = img.size
pad = int(min(w, h) * 0.04)
img = img.crop((pad, pad, w - pad, h - pad))
w, h = img.size
scale = 1.08
nw, nh = int(w * scale), int(h * scale)
zoomed = Image.new('RGBA', (nw, nh), (0, 0, 0, 0))
zoomed.paste(img, ((nw - w) // 2, (nh - h) // 2))
img = zoomed

img.save(out, 'PNG')
print('saved', out, img.size)

# update path reference
import json
p = os.path.join(os.path.dirname(__file__), 'kwt-full.json')
data = json.load(open(p, encoding='utf-8'))
for item in data['used']:
    if item['id'] == '55':
        item['localImage'] = 'img/products/used-55.png'
json.dump(data, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('updated json')
