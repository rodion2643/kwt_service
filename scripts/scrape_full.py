import urllib.request
import re
import json
import os
from html import unescape

ua = {'User-Agent': 'Mozilla/5.0'}
BASE = 'https://kwtservice.com/php/'
IMG_DIR = os.path.join(os.path.dirname(__file__), '..', 'img', 'products')
os.makedirs(IMG_DIR, exist_ok=True)


def fetch(url):
    req = urllib.request.Request(url, headers=ua)
    return urllib.request.urlopen(req, timeout=30).read().decode('utf-8', errors='replace')


def clean(text):
    return unescape(re.sub(r'\s+', ' ', text or '')).strip()


def parse_cards(html):
    cards = []
    for block in re.findall(r'<article class="item-card">([\s\S]*?)</article>', html):
        id_m = re.search(r'item_details\.php\?id=(\d+)', block)
        if not id_m:
            continue
        pid = id_m.group(1)
        title_m = re.search(r'class="item-title"[\s\S]*?<a[^>]*>([\s\S]*?)</a>', block)
        title = clean(re.sub(r'<[^>]+>', '', title_m.group(1))) if title_m else ''
        cat_m = re.search(r'class="item-category">([\s\S]*?)<', block)
        category = clean(cat_m.group(1)) if cat_m else 'продажа'
        img_m = re.search(r'<img src="(uploads/[^"]+)"', block)
        img = img_m.group(1) if img_m else ''
        price_m = re.search(r'class="price-bel">([\s\S]*?)<', block)
        price = clean(price_m.group(1)) if price_m else ''
        desc_m = re.search(r'class="item-description">([\s\S]*?)</p>', block)
        specs = []
        if desc_m:
            for part in re.split(r'<br\s*/?>', desc_m.group(1)):
                line = clean(re.sub(r'<[^>]+>', '', part))
                if line:
                    specs.append(line)
        cards.append({'id': pid, 'title': title, 'category': category, 'price': price, 'img': img, 'specs': specs})
    return cards


def parse_detail(pid):
    page = fetch(BASE + f'item_details.php?id={pid}')
    title = clean(re.search(r'<title>([^<|]+)', page).group(1))
    img_m = re.search(r'<img src="(uploads/[^"]+)"', page)
    img = img_m.group(1) if img_m else ''
    price_m = re.search(r'class="price-bel">([\s\S]*?)<', page)
    price = clean(price_m.group(1)) if price_m else ''
    cat_m = re.search(r'class="item-category[^"]*">([\s\S]*?)<', page)
    category = clean(cat_m.group(1)) if cat_m else 'продажа б/у'
    specs = []
    desc_m = re.search(r'class="item-description"[^>]*>([\s\S]*?)</(?:p|div)>', page)
    if desc_m:
        for part in re.split(r'<br\s*/?>', desc_m.group(1)):
            line = clean(re.sub(r'<[^>]+>', '', part))
            if line:
                specs.append(line)
    if not specs:
        body = re.sub(r'<[^>]+>', '\n', page)
        for line in body.split('\n'):
            line = clean(line)
            if any(k in line.lower() for k in ['мощ', 'скор', 'дальн', 'нагруз', 'аккуm', 'аккум', 'емкост', 'напряж', 'пробег', 'тормоз', 'шины', 'привод', 'вес', 'диаметр', 'кол-', 'запас', 'заряд']):
                if 'Br' not in line and len(line) < 100 and line not in specs:
                    specs.append(line)
    return {'id': pid, 'title': title, 'category': category, 'price': price, 'img': img, 'specs': specs}


def download_img(rel_path, dest_name):
    if not rel_path:
        return ''
    url = BASE + rel_path
    ext = os.path.splitext(rel_path)[1].lower() or '.jpg'
    if ext == '.webp':
        ext = '.webp'
    dest = os.path.join(IMG_DIR, dest_name + ext)
    try:
        data = urllib.request.urlopen(urllib.request.Request(url, headers=ua), timeout=30).read()
        with open(dest, 'wb') as f:
            f.write(data)
        return 'img/products/' + dest_name + ext
    except Exception as e:
        print('IMG FAIL', url, e)
        return ''


def fmt_price(p):
    p = clean(str(p))
    if not p:
        return ''
    # normalize: 2100 -> 2 100 Br
    digits = re.sub(r'\D', '', p)
    if not digits:
        return p + ' Br'
    n = int(digits)
    s = f'{n:,}'.replace(',', ' ')
    return f'{s} Br'


sale_items = parse_cards(fetch(BASE + 'sale.php'))
used_items = [parse_detail('55')]

print('sale count', len(sale_items))
for item in sale_items:
    item['localImage'] = download_img(item['img'], f"sale-{item['id']}")
    item['priceFormatted'] = fmt_price(item['price'])
    print(item['id'], item['title'][:50], item['priceFormatted'])

for item in used_items:
    item['localImage'] = download_img(item['img'], f"used-{item['id']}")
    item['priceFormatted'] = fmt_price(item['price'])
    print('USED', item['id'], item['title'], item['priceFormatted'], item['specs'])

result = {'new': sale_items, 'used': used_items}
out = os.path.join(os.path.dirname(__file__), 'kwt-full.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print('saved', out)
