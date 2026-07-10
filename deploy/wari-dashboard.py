#!/usr/bin/env python3
# आरोग्य संपन्न वारी — usage dashboard generator (self-contained HTML, no external libraries).
# Usage:  python3 wari-dashboard.py [LOGFILE ...] [-o OUTPUT.html]
#   default log:  /var/log/nginx/wari-hits.log   (also reads rotated *.gz if you pass a glob)
#   default out:  ./wari-dashboard.html
# Filters out bots/monitoring. Shows opens, unique users, DAU trend, device/OS/browser,
# hourly usage, coarse LOCATION (nearest mukkam), and the CALL funnel (108/112/102/contact).
import sys, re, gzip, glob, html
from collections import Counter, defaultdict

args = sys.argv[1:]
out = 'wari-dashboard.html'
if '-o' in args:
    i = args.index('-o'); out = args[i+1]; del args[i:i+2]
paths = args or ['/var/log/nginx/wari-hits.log']
files = []
for p in paths:
    g = glob.glob(p)
    files += g if g else [p]

BOT = re.compile(r'bot|crawl|spider|slurp|monitor|headless|scan|python|curl|wget|go-http|libwww|http-client|httpclient|facebookexternalhit|whatsapp|telegram|bytespider|semrush|ahrefs|preview|uptime|pingdom', re.I)
KV = re.compile(r'(\w+)=([^\s"]*)')
UA = re.compile(r'ua="([^"]*)"')

def lines():
    for f in files:
        op = gzip.open if f.endswith('.gz') else open
        try:
            with op(f, 'rt', errors='replace') as fh:
                for ln in fh:
                    yield ln
        except FileNotFoundError:
            sys.stderr.write('skip (not found): %s\n' % f)

rows = []
for ln in lines():
    if 'uid=' not in ln:
        continue
    d = dict(KV.findall(ln))
    m = UA.search(ln); d['ua'] = m.group(1) if m else ''
    d['date'] = ln[:10]
    hm = re.search(r'T(\d{2}):', ln); d['hour'] = hm.group(1) if hm else '??'
    rows.append(d)

def is_bot(d):
    if BOT.search(d.get('ua', '')):
        return True
    if not d.get('ver'):   # every real beacon sends ver=
        return True
    return False

good = [r for r in rows if not is_bot(r)]
bot_n = len(rows) - len(good)
opens = [r for r in good if not r.get('e')]
calls = [r for r in good if r.get('e') == 'call']
locs  = [r for r in good if r.get('e') == 'loc']

def uniq(rs): return len(set(r.get('uid', '') for r in rs))

def os_of(ua):
    if re.search(r'Android', ua): return 'Android'
    if re.search(r'iPhone|iPad|iPod', ua): return 'iOS'
    if re.search(r'Windows', ua): return 'Windows'
    if re.search(r'Macintosh|Mac OS', ua): return 'Mac'
    if re.search(r'Linux', ua): return 'Linux'
    return 'Other'

def br_of(ua):
    if 'Edg/' in ua: return 'Edge'
    if 'SamsungBrowser' in ua: return 'Samsung'
    if 'Firefox' in ua: return 'Firefox'
    if 'CriOS' in ua or 'Chrome' in ua: return 'Chrome'
    if 'Safari' in ua: return 'Safari'
    return 'Other'

dau = defaultdict(set)
for r in opens: dau[r['date']].add(r.get('uid'))
by_hour = Counter(r['hour'] for r in opens)
by_os = Counter(os_of(r['ua']) for r in opens)
by_br = Counter(br_of(r['ua']) for r in opens)
pwa_n = sum(1 for r in opens if r.get('pwa') == '1')
by_call = Counter(r.get('k', 'contact') for r in calls)
by_area = Counter(r.get('near', '') for r in locs if r.get('near'))
callers = set(r.get('uid') for r in calls)
users = set(r.get('uid') for r in opens)
call_rate = (len(callers) / len(users) * 100) if users else 0

def esc(x): return html.escape(str(x))

def bars(counter, order=None, limit=None, unit=''):
    items = list(counter.items())
    items = sorted(items, key=lambda kv: order.index(kv[0]) if (order and kv[0] in order) else 999) if order else sorted(items, key=lambda kv: -kv[1])
    if limit: items = items[:limit]
    mx = max([v for _, v in items], default=1) or 1
    out = ['<div class="bars">']
    for k, v in items:
        pct = v / mx * 100
        out.append('<div class="bar"><div class="bl">%s</div><div class="bt"><div class="bf" style="width:%.1f%%"></div></div><div class="bv">%s%s</div></div>' % (esc(k or '—'), pct, v, unit))
    out.append('</div>')
    return ''.join(out)

card = lambda title, body: '<section class="card"><h2>%s</h2>%s</section>' % (title, body)
stat = lambda label, val, sub='': '<div class="stat"><div class="n">%s</div><div class="l">%s</div>%s</div>' % (val, label, ('<div class="s">%s</div>' % sub if sub else ''))

total_opens = len(opens)
uniq_users = len(users)
last_date = max(dau) if dau else '—'

htmlout = """<!doctype html><html lang="mr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>आरोग्य संपन्न वारी — वापर डॅशबोर्ड</title>
<style>
:root{--o:#f27405;--g:#159653}*{box-sizing:border-box}
body{font-family:system-ui,'Noto Sans Devanagari',Arial,sans-serif;margin:0;background:#fff8e8;color:#23160d}
header{background:var(--o);color:#fff;padding:16px 20px}h1{margin:0;font-size:20px}
.sub{opacity:.9;font-size:12px;margin-top:2px}
.wrap{max-width:960px;margin:0 auto;padding:16px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
.stat{background:#fff;border:1px solid #eadfce;border-radius:14px;padding:14px 16px}
.stat .n{font-size:26px;font-weight:900;color:var(--o)}.stat .l{font-size:12px;color:#6b5238;font-weight:700}
.stat .s{font-size:11px;color:#9a8}.card{background:#fff;border:1px solid #eadfce;border-radius:14px;padding:14px 16px;margin-bottom:14px}
.card h2{font-size:15px;margin:0 0 10px;color:#9a3a00}
.bars{display:flex;flex-direction:column;gap:7px}
.bar{display:grid;grid-template-columns:150px 1fr 70px;align-items:center;gap:8px;font-size:13px}
.bl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bt{background:#f3ead6;border-radius:6px;height:16px;overflow:hidden}
.bf{background:var(--g);height:100%%;border-radius:6px}.bv{text-align:right;font-weight:800}
.note{font-size:11px;color:#8a7;margin-top:6px}
</style></head><body>
<header><h1>📊 आरोग्य संपन्न वारी — वापर डॅशबोर्ड</h1>
<div class="sub">Public Health Dept, Maharashtra · अखेरची नोंद %(last)s · bots वगळले: %(bots)s</div></header>
<div class="wrap">
<div class="stats">%(stats)s</div>
%(daubody)s
%(callbody)s
%(areabody)s
%(hourbody)s
%(osbody)s
%(brbody)s
</div></body></html>""" % dict(
    last=esc(last_date), bots=bot_n,
    stats=(stat('एकूण opens', f'{total_opens:,}') + stat('युनिक वापरकर्ते', f'{uniq_users:,}')
           + stat('फोन कॉल taps', f'{len(calls):,}', f'{len(callers):,} वापरकर्ते')
           + stat('कॉल दर', f'{call_rate:.0f}%', 'opens → call')
           + stat('इंस्टॉल (PWA) opens', f'{pwa_n:,}')),
    daubody=card('रोजचे सक्रिय वापरकर्ते · Daily active users', bars(Counter({d: len(u) for d, u in dau.items()}), order=sorted(dau))),
    callbody=card('📞 फोन कॉल — कशाला कॉल केले · Calls by type',
                  bars(by_call, order=['108', '112', '102', 'contact']) + '<div class="note">108/112/102 = आपत्कालीन · contact = केंद्र/अधिकारी थेट संपर्क</div>'),
    areabody=card('📍 भागानुसार वापर · Usage by area (nearest mukkam)',
                  (bars(by_area, limit=20) if by_area else '<div class="note">अजून location डेटा नाही (वापरकर्त्याने “जवळ” / मुक्काम वापरल्यावर नोंद होते).</div>')),
    hourbody=card('⏰ तासानुसार · Opens by hour (IST)', bars(by_hour, order=[f'{h:02d}' for h in range(24)])),
    osbody=card('📱 डिव्हाइस / OS', bars(by_os)),
    brbody=card('🌐 ब्राउझर', bars(by_br)),
)

with open(out, 'w', encoding='utf-8') as f:
    f.write(htmlout)
print('Wrote %s  (opens=%d, users=%d, calls=%d, bots filtered=%d)' % (out, total_opens, uniq_users, len(calls), bot_n))
