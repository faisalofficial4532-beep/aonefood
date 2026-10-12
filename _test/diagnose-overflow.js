const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'D:/aonefood';
const url = f => 'file:///' + path.join(BASE, f).replace(/\\/g, '/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });
  const targets = fs.existsSync(path.join(__dirname, 'diag-targets.json'))
    ? JSON.parse(fs.readFileSync(path.join(__dirname, 'diag-targets.json'), 'utf8'))
    : [
    ['home.html', 320], ['home.html', 375], ['home.html', 640], ['home.html', 768],
    ['home.html', 1024], ['home.html', 1280], ['home.html', 1366],
  ];
  for (const [page, w] of targets) {
    const tab = await browser.newPage();
    await tab.setViewport({ width: w, height: 900 });
    await tab.goto(url(page), { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(1200);
    const out = await tab.evaluate(() => {
      const de = document.documentElement;
      const vw = de.clientWidth;
      const overflow = de.scrollWidth - vw;
      const results = [];
      const isClipped = el => {
        let p = el.parentElement;
        while (p && p !== document.documentElement) {
          const cs = getComputedStyle(p);
          if (cs.overflowX !== 'visible') return p.tagName + '.' + String(p.className).split(' ').slice(0, 3).join('.');
          if (cs.position === 'fixed') return 'FIXED-ANCESTOR';
          p = p.parentElement;
        }
        // fixed elements themselves don't contribute to document scroll
        let q = el;
        while (q) { if (getComputedStyle(q).position === 'fixed') return 'FIXED'; q = q.parentElement; }
        return null;
      };
      document.querySelectorAll('body *').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 && r.width > 0) {
          const clip = isClipped(el);
          if (!clip) {
            // walk ancestors and record their widths/rights
            const chain = [];
            let p = el;
            for (let d = 0; p && d < 8; d++) {
              const pr = p.getBoundingClientRect();
              const pcs = getComputedStyle(p);
              chain.push(`${p.tagName}[${String(p.className).split(' ').slice(0, 4).join('.')}]{w=${Math.round(pr.width)} right=${Math.round(pr.right)} ovx=${pcs.overflowX} display=${pcs.display} flex=${pcs.flexGrow}/${pcs.flexShrink}/${pcs.flexBasis}}`);
              p = p.parentElement;
            }
            results.push({
              tag: el.tagName,
              cls: String(el.className).slice(0, 100),
              right: Math.round(r.right),
              text: (el.textContent || '').trim().slice(0, 40),
              chain,
            });
          }
        }
      });
      return { vw, scrollW: de.scrollWidth, overflow, trueOffenders: results.slice(0, 12) };
    });
    console.log('\n=== ' + page + ' @' + w + ' === overflow=' + out.overflow + ' scrollW=' + out.scrollW);
    out.trueOffenders.forEach(o => console.log('  ', o.tag, '| right=' + o.right, '|', o.cls, '|', JSON.stringify(o.text), '\n     chain: ' + (o.chain || []).join('\n           ')));
    if (!out.trueOffenders.length && out.overflow > 1) console.log('   (no unclipped offender found — overflow may come from fixed-header descendants)');
    await tab.close();
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
