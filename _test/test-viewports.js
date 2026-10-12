const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'D:/aonefood';
const PAGES = ['home.html', 'about.html', 'contact.html', 'fullmenu.html'];
const WIDTHS = [
  [320, 700], [375, 720], [414, 740], [480, 850],
  [640, 900], [768, 1024], [1024, 800], [1280, 900],
  [1366, 900], [1440, 900], [1920, 1080], [2560, 1200],
];
const OUT = path.join(BASE, '_test', 'shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files'],
  });

  let failures = 0;

  for (const page of PAGES) {
    const pageUrl = 'file:///' + path.join(BASE, page).replace(/\\/g, '/');
    for (const [w, h] of WIDTHS) {
      const tab = await browser.newPage();
      await tab.setViewport({ width: w, height: h });
      const consoleErrors = [];
      tab.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200)); });
      tab.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + String(err).slice(0, 200)));
      try {
        await tab.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        await new Promise(r => setTimeout(r, 1200));

        const metrics = await tab.evaluate(() => {
          const de = document.documentElement;
          const overflowX = de.scrollWidth - de.clientWidth;
          let offenders = [];
          if (overflowX > 1) {
            const vw = de.clientWidth;
            document.querySelectorAll('body *').forEach(el => {
              const r = el.getBoundingClientRect();
              if (r.right > vw + 1 && r.width > 0 && getComputedStyle(el).position !== 'fixed') {
                if (offenders.length < 5) {
                  offenders.push(el.tagName + '.' + String(el.className).slice(0, 80) + ' right=' + Math.round(r.right));
                }
              }
            });
          }
          const toggle = document.getElementById('mobileNavToggle');
          const menu = document.getElementById('mobileNavMenu');
          const activeLink = document.querySelector('nav[aria-label="Primary"] a[aria-current="page"]');
          let brokenImgs = [];
          document.querySelectorAll('img').forEach(img => {
            if (img.complete && img.naturalWidth === 0 && img.src.startsWith('http')) {
              brokenImgs.push(img.src.slice(0, 80));
            }
          });
          return {
            scrollWidth: de.scrollWidth,
            clientWidth: de.clientWidth,
            overflowX,
            offenders,
            hasHeader: !!document.querySelector('header'),
            toggleVisible: toggle ? toggle.offsetParent !== null : false,
            menuExists: !!menu,
            menuHiddenByDefault: menu ? menu.classList.contains('hidden') : null,
            activeHref: activeLink ? activeLink.getAttribute('href') : null,
            activeText: activeLink ? activeLink.textContent : null,
            brokenImgs: brokenImgs.slice(0, 3),
          };
        });

        const tag = `${page.replace('.html', '')}@${w}`;
        const issues = [];
        if (metrics.overflowX > 1) issues.push(`H-OVERFLOW ${metrics.overflowX}px: ${metrics.offenders.join(' | ')}`);
        if (!metrics.hasHeader) issues.push('NO HEADER');
        if (!metrics.menuExists) issues.push('NO MOBILE MENU');
        if (w < 1024 && !metrics.toggleVisible) issues.push('TOGGLE NOT VISIBLE on mobile');
        if (w >= 1024 && metrics.toggleVisible) issues.push('TOGGLE VISIBLE on desktop');
        if (metrics.menuHiddenByDefault !== true) issues.push('MOBILE MENU NOT HIDDEN BY DEFAULT');
        const realErrors = consoleErrors.filter(e => !/net::ERR|Failed to load resource|fonts.googleapis|gstatic|tailwindcss/i.test(e));
        if (realErrors.length) issues.push('CONSOLE: ' + realErrors.slice(0, 2).join(' || '));

        if ([320, 375, 768, 1024, 1440, 2560].includes(w)) {
          await tab.screenshot({ path: path.join(OUT, tag + '.png'), fullPage: false });
        }

        if (issues.length) { failures++; console.log('FAIL', tag, JSON.stringify(issues, null, 1)); }
        else console.log('PASS', tag, `active=${metrics.activeText}(${metrics.activeHref}) scrollW=${metrics.scrollWidth} clientW=${metrics.clientWidth}` + (metrics.brokenImgs.length ? ` brokenImgs=${metrics.brokenImgs.length}` : ''));
      } catch (err) {
        failures++;
        console.log('ERROR', page, w, String(err).slice(0, 300));
      }
      await tab.close();
    }
  }

  console.log('\n=== VIEWPORT SUMMARY ===');
  console.log('Failures:', failures);
  await browser.close();
  process.exit(failures > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
