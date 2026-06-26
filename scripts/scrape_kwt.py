import urllib.request
import re
import json
import os

ua = {'User-Agent': 'Mozilla/5.0'}
base = 'https://kwtservice.com/php/'

def fetch(url):
    req = urllib.request.Request(url, headers=ua)
    return urllib.request.urlopen(req, timeout=30).read().decode('utf-8', errors='replace')

# Parse sale.php listing
html = fetch(base + 'sale.php')
# Find item links and cards - look for item_details.php?id=
ids = sorted(set(re.findall(r'item_details\.php\?id=(\d+)', html)))
print('sale ids', len(ids), ids[:20])

products = []
for pid in ids:
    try:
        page = fetch(f'{base}item_details.php?id={pid}')
        title_m = re.search(r'<title>([^<|]+)', page)
        title = title_m.group(1).strip() if title_m else ''
        img_m = re.search(r'<img src="(uploads/[^"]+)"', page)
        img = img_m.group(1) if img_m else ''
        # price near Br
        price_m = re.search(r'(\d[\d\s]*)\s*Br', page)
        price = price_m.group(1).replace(' ', ' ').strip() if price_m else ''
        # category badge
        cat = 'продажа'
        if 'б/у' in page.lower() or 'б&#47;у' in page.lower() or 'sale_bu' in page.lower():
            cat = 'bu'
        # description block
        text = re.sub(r'<script[\s\S]*?</script>', '', page)
        text = re.sub(r'<style[\s\S]*?</style>', '', text)
        # get main content specs - lines with bullet or list
        body = re.sub(r'<[^>]+>', '\n', text)
        lines = [l.strip() for l in body.split('\n') if l.strip() and len(l.strip()) > 3]
        specs = []
        desc = ''
        for i, line in enumerate(lines):
            if title.split('|')[0].strip().lower() in line.lower() and len(line) < 80:
                continue
            if any(k in line.lower() for k in ['макс', 'пробег', 'мощность', 'заряд', 'нагруз', 'емкост', 'аккум', 'тормоз', 'шины', 'привод', 'вес', 'диаметр', 'кол-', 'дальн', 'напряж', 'снаряж']):
                specs.append(line)
            elif 'Br' in line or 'KWT' in line or '©' in line:
                break
        # bu detection from title
        if 'б/у' in title.lower() or 'б&#47;у' in title.lower():
            cat = 'bu'
        products.append({
            'id': pid, 'title': title.split('|')[0].strip(), 'price': price,
            'img': img, 'cat': cat, 'specs': specs[:12]
        })
        print(pid, cat, price, title[:50], img)
    except Exception as e:
        print('ERR', pid, e)

out = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'kwt-products.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)
print('saved', out, len(products))
