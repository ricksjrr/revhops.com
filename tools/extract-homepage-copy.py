import re, csv, html
from html.parser import HTMLParser

ROOT = '/sessions/compassionate-admiring-shannon/mnt/revhops.com'
rows = []          # (id, where, current)
seen = {}

DECORATIVE = {'/', '\u2192', '\u2190', '\u201c', '\u201d', '|', '\u2009'}

def add(where, text, kind='text'):
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\s*\u2192$', '', text).strip()   # trailing arrow
    if not text or text in DECORATIVE:
        return
    n = len(rows) + 1
    rows.append([f'{n:03d}', where, text])

# ---------------------------------------------------------------- the markup
BLOCK = {'h1','h2','h3','h4','h5','p','li','cite','blockquote','button','a','span','dt','dd','label','figcaption'}
SKIP  = {'script','style','svg','path','circle','noscript'}

class Grab(HTMLParser):
    """Collect the text of each innermost block element, in document order.

    A services row is <a><h3>..</h3><span>..</span><p>..</p><span>..</span></a>.
    Treating the <a> as one block merged four separate strings into a single
    cell, so a nested block flushes whatever its parent had collected so far
    and then collects on its own. That gives one row per editable string.

    An inline <span class="hl"> becomes ** markers, so the emphasis survives a
    rewrite: whatever sits between a pair of ** is the phrase that gets bold.
    """
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []       # [(tag, [text parts])], innermost last
        self.spans = []       # 'hl' | 'inline' per open <span>
        self.skip = 0
        self.section = 'Page'
        self.sec_n = 0

    # -- helpers ---------------------------------------------------------
    def flush(self):
        if self.stack:
            add(self.section, ''.join(self.stack[-1][1]))
            self.stack[-1][1].clear()

    # -- parser ----------------------------------------------------------
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in SKIP:
            self.skip += 1; return
        if self.skip: return

        cls = a.get('class', '')
        if tag == 'section':
            self.sec_n += 1
            named = None
            for key, label in SECTIONS:
                if key in cls.split():
                    named = label; break
            self.section = named or ORDER.get(self.sec_n, 'Page')
        if tag == 'header' and 'nav' in cls.split(): self.section = 'Navigation'
        if tag == 'footer' and 'footer' in cls.split(): self.section = 'Footer'

        if tag == 'span':
            if 'hl' in cls.split() and self.stack:
                self.spans.append('hl'); self.stack[-1][1].append('**'); return
            if self.stack and 'sep' in cls.split():
                self.spans.append('inline'); return
            # a bare span with no open block is a block of its own
            if not self.stack:
                self.spans.append('block'); self.stack.append((tag, [])); return
            self.spans.append('block'); self.flush(); self.stack.append((tag, [])); return

        if tag in BLOCK:
            self.flush()                 # whatever the parent had so far
            self.stack.append((tag, []))

    def handle_endtag(self, tag):
        if tag in SKIP:
            self.skip = max(0, self.skip - 1); return
        if self.skip: return

        if tag == 'span':
            kind = self.spans.pop() if self.spans else 'inline'
            if kind == 'hl':
                if self.stack: self.stack[-1][1].append('**')
                return
            if kind == 'inline':
                return

        if self.stack and self.stack[-1][0] == tag:
            self.flush()
            self.stack.pop()

    def handle_data(self, data):
        if self.skip or not self.stack: return
        self.stack[-1][1].append(data)

SECTIONS = [
    ('hero-pin',      'Hero'),
    ('logo-band',     'Client logo rail'),
    ('case-section',  'Case studies'),
    ('to-white-1',    'About us'),
    ('to-white-2',    'Tool logos'),
    ('testi-section', 'Testimonials'),
    ('start-section', 'Next steps'),
]
# the services section carries only the generic "section" class, so it is
# identified by being the third <section> on the page
ORDER = {3: 'Services list'}

src = open(f'{ROOT}/index.html', encoding='utf-8').read()
body = src[src.index('<body>'):]
g = Grab(); g.feed(body)

# ------------------------------------------------- the hero, from the slider
js = open(f'{ROOT}/assets/js/maturity-slider.js', encoding='utf-8').read()
hero = []

def js_str(pattern):
    m = re.search(pattern, js, re.S)
    return m.group(1).replace("\\'", "'") if m else None

def js_list(block):
    return [x.replace("\\'", "'") for x in re.findall(r"'([^']*)'", block)]

hero.append(("Hero (slider)", js_str(r"var HEAD_LEAD\s*=\s*'([^']*)'") + ' ' + js_str(r"var HEAD_TAIL\s*=\s*'([^']*)'")))
lede = re.search(r"<p class=\\\"lede\\\">'?\s*\+?\s*'([^;]*?)</p>", js, re.S)
m = re.search(r"'<p class=\"lede\">(.*?)</p>'", js, re.S)
if m:
    hero.append(("Hero (slider)", re.sub(r"'\s*\+\s*'", '', m.group(1))))

for t in re.findall(r"var CARD_TITLES = \[(.*?)\]", js, re.S):
    for title in js_list(t):
        hero.append(("Hero card titles (slider)", title))

ps = re.search(r"var PROBLEM_SPLIT = \{(.*?)\n  \};", js, re.S).group(1)
hero.append(("Hero — Problems card (slider)", js_str(r"head:\s*'([^']*)'")))
PROBLEM_LABEL = 'Hero \u2014 Problems card (slider)'
# body became a list of paragraphs on 12 September, when James's rewrite of it
# had a blank line in the middle. One row per paragraph now.
body_m = re.search(r"body:\s*\[(.*?)\]", ps, re.S)
if body_m:
    for para in js_list(body_m.group(1)):
        hero.append((PROBLEM_LABEL, para))
else:
    hero.append((PROBLEM_LABEL, re.sub(r"'\s*\+\s*'", '',
        re.search(r"body:\s*'(.*?)'\s*\n\s*\};", ps + '\n  };', re.S).group(1))))

stages = re.search(r"var STAGES = \[(.*?)\n  \];", js, re.S).group(1)
for blk in re.findall(r"\{\s*\n\s*name: '(.*?)',(.*?)caseStudy: \{(.*?)\}\s*\n\s*\}", stages, re.S):
    name, mid, cs = blk
    hero.append((f"Hero — {name} stage (slider)", name))
    for field, label in [('situation','Your situation'), ('have','Stack you have'),
                         ('missing','Stack you are missing'), ('problems','Problems')]:
        mm = re.search(field + r":\s*\[(.*?)\]", mid, re.S)
        if mm:
            for item in js_list(mm.group(1)):
                hero.append((f"Hero — {name}: {label} (slider)", item))
    for f2 in ['who', 'line']:
        mm = re.search(f2 + r":\s*'([^']*)'", cs)
        if mm: hero.append((f"Hero — {name}: case study (slider)", mm.group(1)))

# Read these out of the render rather than repeating them here. They were
# literals to begin with, which meant the extractor kept reporting the old
# label after the JS had been changed - it was verifying itself, not the file.
def between(after, before):
    m = re.search(re.escape(after) + r"(.*?)" + re.escape(before), js, re.S)
    return m.group(1).strip() if m else None

CARD_LINK = "Hero \u2014 card links (slider)"
CAPTURE   = "Hero \u2014 capture card (slider)"
hero.append((CAPTURE, between('stage-form-title">', '</h2>')))
hero.append((CAPTURE, between('placeholder="', '"')))
m = re.search(r"'([^']+) <span class=\"arrow\">&rarr;</span></button>'", js)
hero.append((CAPTURE, m.group(1) if m else None))
for m in re.finditer(r"'([A-Z][^'<]{4,60}?) <span class=\"arrow\">&rarr;</span></a>'", js):
    hero.append((CARD_LINK, m.group(1)))



# hero first, then the rest of the page
out = []
n = 1
for where, txt in hero:
    if not txt: continue
    txt = re.sub(r'\s+', ' ', html.unescape(txt)).strip()
    out.append([f'{n:03d}', where, txt, '']); n += 1
for _id, where, txt in rows:
    out.append([f'{n:03d}', where, html.unescape(txt), '']); n += 1

# drop exact duplicates that are navigation/footer repeats of the same word
with open(f'{ROOT}/Claude outputs/homepage-copy.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['ID', 'Where it appears', 'Current text', 'New text'])
    w.writerows(out)
print(len(out), 'rows')
