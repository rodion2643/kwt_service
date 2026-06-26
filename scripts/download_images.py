import urllib.request
import os

ua = {'User-Agent': 'Mozilla/5.0'}
base = 'https://kwtservice.com/php/'
items = {
    'ninebot-g30p.jpg': 'uploads/ad_1778282169_75949c8e.jpg',
}
# fetch id 37 image too
import re
for pid, out in [('55', 'ninebot-g30p.jpg'), ('37', 'sale-smartbalance-x11.jpg')]:
    req = urllib.request.Request(f'{base}item_details.php?id={pid}', headers=ua)
    html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='replace')
    m = re.search(r'<img src="(uploads/[^"]+)"', html)
    if m:
        img_url = base + m.group(1)
        print('downloading', img_url)
        data = urllib.request.urlopen(urllib.request.Request(img_url, headers=ua), timeout=15).read()
        path = os.path.join(r'C:\Users\PODPIVAS\Projects\kwt-service\img', out)
        open(path, 'wb').write(data)
        print('saved', path, len(data))
