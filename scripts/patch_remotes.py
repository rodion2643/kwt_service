"""Add remote image URLs to data.js from kwt-full.json for GitHub fallback."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'js' / 'data.js'
KWT = ROOT / 'scripts' / 'kwt-full.json'

data = json.loads(KWT.read_text(encoding='utf-8'))
remotes = {}
for item in data.get('new', []):
    remotes[f"sale-{item['id']}"] = item.get('img', '')
for item in data.get('used', []):
    remotes[f"used-{item['id']}"] = item.get('img', '')

text = DATA.read_text(encoding='utf-8')

for pid, remote in remotes.items():
    if not remote:
        continue
    pattern = rf"(id:\s*'{re.escape(pid)}'[^}}]*?image:\s*(?:\"[^\"]+\"|'[^']+'))"
    repl = rf"\1,\n      remote: {json.dumps(remote, ensure_ascii=False)}"
    new_text, n = re.subn(pattern, repl, text, count=1, flags=re.DOTALL)
    if n:
        text = new_text

DATA.write_text(text, encoding='utf-8')
print('patched', len(remotes), 'remote urls')
