#!/usr/bin/env python3
"""Basic static-site check: local media/CSS/JS and anchor references."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import sys
root=Path(__file__).resolve().parents[1]
class Parser(HTMLParser):
    def __init__(self):
        super().__init__();self.refs=[];self.ids=set()
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if d.get('id'):self.ids.add(d['id'])
        for key in ('src','href','poster'):
            if d.get(key):self.refs.append((tag,key,d[key]))
p=Parser();p.feed((root/'index.html').read_text(encoding='utf-8'))
errors=[]
for tag,key,ref in p.refs:
    parsed=urlsplit(ref)
    if parsed.scheme or parsed.netloc or ref.startswith(('mailto:','tel:','data:','javascript:')):continue
    if parsed.path.startswith('/'):continue # root-relative paths need live-site check
    if parsed.path:
        path=(root/unquote(parsed.path)).resolve()
        if not path.is_relative_to(root.resolve()) or not path.exists():errors.append(f'Missing local file: {ref}')
    elif parsed.fragment and parsed.fragment not in p.ids:errors.append(f'Missing anchor: #{parsed.fragment}')
for e in errors:print('ERROR:',e)
print(f'Checked {len(p.refs)} references; {len(errors)} problem(s).')
sys.exit(bool(errors))
