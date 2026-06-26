import urllib.request
import re
import os

ua = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request('https://kwtservice.com/php/item_details.php?id=55', headers=ua)
html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='replace')

print('=== PRICES ===')
for m in re.finditer(r'(\d[\d\s]*)\s*Br', html):
    print(m.group(0))

print('=== IMAGES ===')
for m in re.finditer(r'<img[^>]+>', html):
    print(m.group(0)[:250])

print('=== TEXT ===')
text = re.sub(r'<script[\s\S]*?</script>', '', html)
text = re.sub(r'<[^>]+>', '\n', text)
for line in text.split('\n'):
    line = line.strip()
    if line and len(line) > 2:
        print(line)
