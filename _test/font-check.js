const puppeteer = require('puppeteer-core');
const path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'D:/aonefood';
const url = f => 'file:///' + path.join(BASE, f).replace(/\\/g, '/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });
  const tab = await browser.newPage();
  await tab.setViewport({ width: 1440, height: 900 });
  const failed = [];
  tab.on('requestfailed', r => failed.push(r.url().slice(0, 120)));
  await tab.goto(url('home.html'), { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(1500);
  const r1 = await tab.evaluate(async () => {
    await document.fonts.ready;
    return {
      fontsStatus: document.fonts.status,
      loadedFamilies: [...document.fonts].map(f => f.family + ':' + f.status).slice(0, 12),
      materialCheck: document.fonts.check('24px "Material Symbols Outlined"'),
      poppinsCheck: document.fonts.check('16px "Poppins"'),
    };
  });
  console.log('after fonts.ready:', JSON.stringify(r1, null, 1));
  // measure an icon span width to see if glyph rendered (glyph ~= 1em; text would be wider or clipped)
  const w = await tab.evaluate(() => {
    const sp = document.querySelector('header .material-symbols-outlined');
    return sp ? { text: sp.textContent, width: sp.getBoundingClientRect().width, fontSize: getComputedStyle(sp).fontSize } : null;
  });
  console.log('header icon span:', JSON.stringify(w));
  console.log('failed requests:', JSON.stringify(failed, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
