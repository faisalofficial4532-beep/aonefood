const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'D:/aonefood';
const url = f => 'file:///' + path.join(BASE, f).replace(/\\/g, '/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OUT = path.join(BASE, '_test', 'shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });
  const shots = [['home.html', 1440], ['home.html', 375], ['about.html', 1440], ['contact.html', 1440], ['fullmenu.html', 1440], ['fullmenu.html', 375], ['index.html', 1440]];
  for (const [f, w] of shots) {
    const tab = await browser.newPage();
    await tab.setViewport({ width: w, height: 900 });
    await tab.goto(url(f), { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(1300);
    // navbar-only clip for clarity
    const header = await tab.$('header');
    if (header) {
      await header.screenshot({ path: path.join(OUT, `navbar-${f.replace('.html', '')}-${w}.png`) });
    }
    await tab.close();
    console.log('shot:', f, w);
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
