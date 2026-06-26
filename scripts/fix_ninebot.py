import io
from pathlib import Path
from PIL import Image
from rembg import remove

ROOT = Path(__file__).resolve().parent.parent
src = ROOT / 'img' / 'products' / 'used-55.jpg'
out_raw = ROOT / 'img' / 'products' / 'used-55-raw.png'
out_final = ROOT / 'img' / 'products' / 'used-55.png'

# Сначала слегка обрезаем оригинал — оставляем весь самокат с запасом сверху под руль
orig = Image.open(src).convert('RGB')
w, h = orig.size
# Самокат по центру: берём центральную часть с большим верхним полем
crop = orig.crop((int(w * 0.08), int(h * 0.02), int(w * 0.92), int(h * 0.98)))
buf = io.BytesIO()
crop.save(buf, format='JPEG', quality=95)

result = remove(buf.getvalue())
img = Image.open(io.BytesIO(result)).convert('RGBA')
img.save(out_raw, 'PNG')

# Только добавить прозрачные поля, не обрезать
bbox = img.getbbox()
if bbox:
    x0, y0, x1, y1 = bbox
    pad = 20
    canvas = Image.new('RGBA', (x1 - x0 + pad * 2, y1 - y0 + pad * 2), (0, 0, 0, 0))
    cropped = img.crop(bbox)
    canvas.paste(cropped, (pad, pad))
    img = canvas

img.save(out_final, 'PNG')
print('size', img.size, 'saved', out_final)
