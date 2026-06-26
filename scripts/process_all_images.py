"""Remove backgrounds from product photos."""
import io
import json
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / 'img' / 'products'
SESSION = None


def get_session():
    global SESSION
    if SESSION is None:
        SESSION = new_session('isnet-general-use')
    return SESSION


def rembg_image(src: Path, dest: Path, pad_ratio=0.03):
    result = remove(src.read_bytes(), session=get_session())
    img = Image.open(io.BytesIO(result)).convert('RGBA')
    bbox = img.getbbox()
    if bbox:
        x0, y0, x1, y1 = bbox
        w, h = x1 - x0, y1 - y0
        pad = int(max(w, h) * pad_ratio)
        x0 = max(0, x0 - pad)
        y0 = max(0, y0 - pad)
        x1 = min(img.width, x1 + pad)
        y1 = min(img.height, y1 + pad)
        img = img.crop((x0, y0, x1, y1))
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, 'PNG')
    return dest


def ninebot_image():
    """Shop photo — rembg срезает руль; используем обрезанный JPG."""
    src = IMG / 'used-55.jpg'
    dest = IMG / 'used-55-full.jpg'
    if not src.exists():
        return
    orig = Image.open(src).convert('RGB')
    w, h = orig.size
    crop = orig.crop((int(w * 0.02), 0, int(w * 0.88), int(h * 0.98)))
    crop.save(dest, 'JPEG', quality=92)
    print('ninebot ->', dest.name)


def main():
    ninebot_image()

    sale_pngs = []
    for jpg in sorted(IMG.glob('sale-*.jpg')):
        png = jpg.with_suffix('.png')
        try:
            rembg_image(jpg, png)
            sale_pngs.append(png.name)
            print('sale', png.name)
        except Exception as e:
            print('FAIL', jpg.name, e)

    webp = IMG / 'sale-52.webp'
    if webp.exists():
        rembg_image(webp, IMG / 'sale-52.png')
        sale_pngs.append('sale-52.png')

    data_js = ROOT / 'js' / 'data.js'
    text = data_js.read_text(encoding='utf-8')
    for jpg in IMG.glob('sale-*.jpg'):
        text = text.replace(f"img/products/{jpg.name}", f"img/products/{jpg.stem}.png")
    text = text.replace('img/products/sale-52.webp', 'img/products/sale-52.png')
    text = text.replace('img/products/used-55.png', 'img/products/used-55-full.jpg')
    data_js.write_text(text, encoding='utf-8')
    print('done', len(sale_pngs), 'sale pngs')


if __name__ == '__main__':
    main()
