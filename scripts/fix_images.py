"""Fix product images: Ninebot with full handlebars, sale without background artifacts."""
import io
import json
import re
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


def rembg_file(src: Path, dest: Path, *, pad_ratio=0.04):
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
    img.save(dest, 'PNG', optimize=True)
    return img


def fix_ninebot():
    """Crop shop photo tightly, then rembg. Fall back to cropped JPG if handlebars lost."""
    src = IMG / 'used-55.jpg'
    dest_png = IMG / 'used-55.png'
    dest_jpg = IMG / 'used-55-full.jpg'

    orig = Image.open(src).convert('RGB')
    w, h = orig.size  # 576x768
    # Самокат целиком: руль сверху слева, колёса снизу
    crop = orig.crop((int(w * 0.02), int(h * 0.0), int(w * 0.88), int(h * 0.98)))
    buf = io.BytesIO()
    crop.save(buf, format='JPEG', quality=95)
    crop.save(dest_jpg, 'JPEG', quality=92)

    result = remove(buf.getvalue(), session=get_session())
    img = Image.open(io.BytesIO(result)).convert('RGBA')
    bbox = img.getbbox()
    if not bbox:
        print('ninebot: no bbox, using JPG')
        return dest_jpg

    x0, y0, x1, y1 = bbox
    crop_h = crop.height
    subject_h = y1 - y0
    # Если rembg съел верхнюю часть (руль) — высота < 75% кадра
    if subject_h < crop_h * 0.72:
        print(f'ninebot: rembg ate handlebars ({subject_h}/{crop_h}), using cropped JPG')
        return dest_jpg

    pad = int(max(x1 - x0, y1 - y0) * 0.03)
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    img = img.crop((x0, y0, x1, y1))
    img.save(dest_png, 'PNG', optimize=True)
    print('ninebot: PNG ok', img.size)
    return dest_png


def fix_sale():
    count = 0
    for jpg in sorted(IMG.glob('sale-*.jpg')):
        png = jpg.with_suffix('.png')
        try:
            rembg_file(jpg, png)
            count += 1
            print('sale', png.name)
        except Exception as e:
            print('FAIL', jpg.name, e)
    webp = IMG / 'sale-52.webp'
    if webp.exists():
        rembg_file(webp, IMG / 'sale-52.png')
        count += 1
        print('sale sale-52.png from webp')
    return count


def update_data_js(ninebot_path: Path):
    data_js = ROOT / 'js' / 'data.js'
    text = data_js.read_text(encoding='utf-8')
    rel = ninebot_path.relative_to(ROOT).as_posix()
    text = re.sub(
        r"(id:\s*'used-55'[^}]*image:\s*)\"[^\"]+\"",
        rf'\1"{rel}"',
        text,
        count=1,
    )
    for jpg in IMG.glob('sale-*.jpg'):
        png_path = f"img/products/{jpg.stem}.png"
        jpg_path = f"img/products/{jpg.name}"
        text = text.replace(jpg_path, png_path)
    text = text.replace('img/products/sale-52.webp', 'img/products/sale-52.png')
    data_js.write_text(text, encoding='utf-8')
    print('data.js updated, ninebot ->', rel)


def main():
    ninebot = fix_ninebot()
    n = fix_sale()
    update_data_js(ninebot)
    print('done', n, 'sale pngs')


if __name__ == '__main__':
    main()
