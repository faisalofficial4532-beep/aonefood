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
  const fontReqs = [];
  tab.on('response', async r => {
    if (/fonts\.(googleapis|gstatic)/.test(r.url())) fontReqs.push({ status: r.status(), url: r.url().slice(0, 140) });
  });
  await tab.goto(url('home.html'), { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2500);
  console.log('=== Google Fonts responses ===');
  fontReqs.forEach(r => console.log(r.status, r.url));
  const sheets = await tab.evaluate(() => {
    return [...document.styleSheets].map(s => {
      try {
        const rules = [...s.cssRules].filter(r => r.cssText.includes('Material Symbols')).map(r => r.cssText.slice(0, 300));
        return { href: s.href ? s.href.slice(0, 100) : 'inline', materialRules: rules.slice(0, 2), ruleCount: s.cssRules.length };
      } catch (e) { return { href: s.href ? s.href.slice(0, 100) : 'inline', error: String(e).slice(0, 80) }; }
    }).filter(s => s.materialRules && s.materialRules.length);
  });
  console.log('\n=== Stylesheets containing Material Symbols rules ===');
  console.log(JSON.stringify(sheets, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
