import json
import re
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
JSON_PATH = os.path.join(os.path.dirname(__file__), 'kwt-full.json')

with open(JSON_PATH, encoding='utf-8') as f:
    data = json.load(f)


def normalize_spec(s):
    s = s.strip()
    if s.lower() in ('услуги', 'сборка аккумуляторов', 'главная', 'ремонт', 'продажа'):
        return None
    fixes = [
        ('Мощность двигателя, Вт ', 'Мощность двигателя: '),
        ('Макс. скорость, км/ч ', 'Макс. скорость: '),
        ('Дальность хода, км* ', 'Дальность хода: до '),
        ('Максимальная нагрузка, кг ', 'Максимальная нагрузка: '),
        ('Ёмкость аккумулятора, А·ч ', 'Ёмкость аккумулятора: '),
        ('Напряжение аккумулятора, В', 'Напряжение аккумулятора: '),
    ]
    for old, new in fixes:
        if s.startswith(old):
            s = new + s[len(old):]
            break
    if s.endswith(' Вт') or 'Вт ' in s:
        pass
    if 'км/ч' in s and not s.endswith('км/ч'):
        s = s.replace('км/ч ', '') + ' км/ч' if 'км/ч' not in s.split(':')[-1] else s
    if s.endswith('36') and 'Напряжение' in s:
        s = s + ' В'
    return s


def guess_type(title, category):
    t = (title + ' ' + category).lower()
    if 'б/у' in t:
        return 'Самокат' if 'самокат' in t else 'Б/У'
    if any(x in t for x in ['велосипед', 'velo', 'bicycle', 'ikingi s6']):
        return 'Велосипед'
    if any(x in t for x in ['трицикл', 'cargo', 'spartak', 'trike']):
        return 'Трицикл'
    if any(x in t for x in ['скутер', 'x11', 'x1', 'x7', 'x12', 'sport plus', 'mini trike']):
        return 'Скутер'
    return 'Самокат'


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


def item_to_js(item, kind):
    title = item['title']
    title = title.replace('Эдектросамокат', 'Электросамокат')
    if 'ninebot' in title.lower():
        title = 'Электросамокат Ninebot G30P Б/У'
    specs = []
    for s in item.get('specs', []):
        ns = normalize_spec(s)
        if ns:
            specs.append(ns)
    return f"""    {{
      id: '{kind}-{item["id"]}',
      name: {js_str(title)},
      type: {js_str(guess_type(title, item.get('category', '')))},
      badge: {js_str('Б/У' if kind == 'used' or 'б/у' in title.lower() else item.get('category', 'продажа'))},
      price: {js_str(item.get('priceFormatted', ''))},
      image: {js_str(item.get('localImage') or 'img/scooter-hero.png')},
      remote: {js_str(item.get('img', ''))},
      desc: {js_str(specs[0] if specs else title)},
      specs: [{', '.join(js_str(s) for s in specs)}]
    }}"""


sale_lines = [item_to_js(i, 'sale') for i in data['new']]
used_lines = [item_to_js(i, 'used') for i in data['used']]

# Read existing data.js header/footer
data_js = open(os.path.join(ROOT, 'js', 'data.js'), encoding='utf-8').read()
start = data_js.index('const KWT = {')
services_end = data_js.index('  saleCatalog:')

header = data_js[start:services_end]

footer_match = re.search(r'\n};?\s*$', data_js)
# keep everything before saleCatalog - already have header

new_data = header + f"""  saleCatalog: [
{',\n'.join(sale_lines)}
  ],

  catalog: [
{',\n'.join(used_lines)}
  ]
}};
"""

out_path = os.path.join(ROOT, 'js', 'data.js')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(new_data)

# Fix used service hero image
content = open(out_path, encoding='utf-8').read()
content = content.replace("image: 'img/ninebot-g30p.jpg'", "image: 'img/products/used-55.png'")
content = content.replace("image: 'img/scooter-catalog-2.png'", "image: 'img/products/used-55.png'")
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Wrote', out_path, len(sale_lines), 'sale,', len(used_lines), 'used')
