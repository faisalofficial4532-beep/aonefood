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
  await tab.goto(url('home.html'), { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2000);
  const r = await tab.evaluate(() => {
    const sp = document.querySelector('header .material-symbols-outlined');
    const cs = sp ? getComputedStyle(sp) : null;
    return {
      spanText: sp?.textContent,
      computedFontFamily: cs?.fontFamily,
      featureSettings: cs?.fontFeatureSettings || cs?.webkitFontFeatureSettings,
      poppinsLoaded: document.fonts.check('16px "Poppins"'),
      materialLoaded: document.fonts.check('24px "Material Symbols Outlined"'),
    };
  });
  console.log(JSON.stringify(r, null, 1));

  // Now test with an override applied (simulate the fix)
  const tab2 = await browser.newPage();
  await tab2.setViewport({ width: 1440, height: 900 });
  await tab2.evaluateOnNewDocument(() => {
    const style = document.createElement('style');
    style.textContent = ".material-symbols-outlined{font-family:'Material Symbols Outlined' !important;font-feature-settings:'liga';-webkit-font-feature-settings:'liga';}";
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
  });
  await tab2.goto(url('home.html'), { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2500);
  const r2 = await tab2.evaluate(() => {
    const sp = document.querySelector('header .material-symbols-outlined');
    return {
      spanText: sp?.textContent,
      computedFontFamily: getComputedStyle(sp).fontFamily,
      materialLoaded: document.fonts.check('24px "Material Symbols Outlined"'),
    };
  });
  console.log('\nwith override:', JSON.stringify(r2, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
