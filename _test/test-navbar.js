const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'D:/aonefood';
const url = f => 'file:///' + path.join(BASE, f).replace(/\\/g, '/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PAGES = ['home.html', 'about.html', 'contact.html', 'fullmenu.html'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });
  let failures = 0;
  const check = (name, ok, extra) => { if (!ok) failures++; console.log((ok ? 'PASS' : 'FAIL'), name, extra || ''); };

  // ---------- 1. Static check ----------
  console.log('=== STATIC NAVBAR CHECKS ===');
  for (const f of PAGES) {
    const s = fs.readFileSync(path.join(BASE, f), 'utf8');
    const header = s.slice(s.indexOf('<header'), s.indexOf('</header>') + 9);
    check(f + ': navbar has no shopping_bag text', !/shopping_bag/.test(header));
    check(f + ': navbar has no cart-count badge', !/<span[^>]*rounded-full[^>]*>\s*3\s*<\/span>/.test(header));
    check(f + ': navbar has no Open cart button', !/aria-label="Open cart"/.test(header));
  }

  // ---------- 2. Rendered check at 1440px ----------
  console.log('\n=== RENDERED NAVBAR CHECKS (1440px) ===');
  for (const f of PAGES) {
    const tab = await browser.newPage();
    await tab.setViewport({ width: 1440, height: 900 });
    await tab.goto(url(f), { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(1200);
    const nav = await tab.evaluate(() => {
      const header = document.querySelector('header');
      const links = [...document.querySelectorAll('nav[aria-label="Primary"] a')].map(a => a.textContent.trim());
      const active = document.querySelector('nav[aria-label="Primary"] a[aria-current="page"]')?.textContent.trim();
      const texts = [...header.querySelectorAll('*')].map(el => (el.textContent || '').trim());
      const bagVisible = texts.some(t => t.includes('shopping_bag'));
      const badgeVisible = [...header.querySelectorAll('span,div')].some(el => {
        const cs = getComputedStyle(el);
        return (el.textContent || '').trim() === '3' && cs.position === 'absolute' && el.offsetParent !== null;
      });
      const logo = header.querySelector('a[href="home.html"]');
      return { links, active, bagVisible, badgeVisible, logoText: logo ? logo.textContent.trim() : null };
    });
    check(f + ': nav links = [Home, Menu, Deals, Cakes & Sweets, About, Contact]',
      JSON.stringify(nav.links) === JSON.stringify(['Home', 'Menu', 'Deals', 'Cakes & Sweets', 'About', 'Contact']), JSON.stringify(nav.links));
    check(f + ': no visible shopping_bag text in navbar', !nav.bagVisible);
    check(f + ': no visible cart badge in navbar', !nav.badgeVisible);
    check(f + ': logo shows A-One Foods', !!nav.logoText && nav.logoText.startsWith('A-One Foods'), String(nav.logoText));
    console.log('   ', f, 'active:', nav.active);
    await tab.close();
  }


  // ---------- 3. Mobile navbar checks (375px) ----------
  console.log('\n=== MOBILE NAVBAR CHECKS (375px) ===');
  for (const f of PAGES) {
    const tab = await browser.newPage();
    await tab.setViewport({ width: 375, height: 720 });
    await tab.goto(url(f), { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(1000);
    const r = await tab.evaluate(() => {
      const header = document.querySelector('header');
      const toggle = document.getElementById('mobileNavToggle');
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const texts = [...header.querySelectorAll('*')].map(el => (el.textContent || '').trim());
      return {
        toggleVisible: toggle && toggle.offsetParent !== null,
        overflow,
        bagVisible: texts.some(t => t.includes('shopping_bag')),
      };
    });
    check(f + ': hamburger visible at 375px', r.toggleVisible);
    check(f + ': no horizontal overflow at 375px', r.overflow <= 1, 'overflow=' + r.overflow);
    check(f + ': no shopping_bag text in mobile navbar', !r.bagVisible);
    await tab.click('#mobileNavToggle');
    await sleep(250);
    const menu = await tab.evaluate(() => {
      const m = document.getElementById('mobileNavMenu');
      return { open: !m.classList.contains('hidden'), links: [...m.querySelectorAll('a')].map(a => a.textContent.trim()) };
    });
    check(f + ': mobile menu opens with 6 links + WhatsApp', menu.open && menu.links.length === 7, JSON.stringify(menu.links));
    await tab.close();
  }

  // ---------- 4. index.html redirect check ----------
  console.log('\n=== INDEX ENTRY POINT CHECK ===');
  {
    const idx = fs.readFileSync(path.join(BASE, 'index.html'), 'utf8');
    check('index.html redirects to home.html (meta + js)', /url=home\.html/.test(idx) && /location\.replace\('home\.html'\)/.test(idx));
    const tab = await browser.newPage();
    await tab.goto(url('index.html'), { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    const res = await tab.evaluate(() => ({
      finalUrl: location.pathname,
      onHome: !!document.querySelector('header a[href="home.html"]') && document.querySelector('nav[aria-label="Primary"] a[aria-current="page"]')?.textContent.trim() === 'Home',
    }));
    check('root index.html opens home.html content', res.finalUrl.endsWith('home.html') && res.onHome, 'final=' + res.finalUrl);
    await tab.close();
  }

  // ---------- 5. Regression: functional cart (fullmenu) still works ----------
  console.log('\n=== FUNCTIONAL CART REGRESSION ===');
  {
    const tab = await browser.newPage();
    await tab.setViewport({ width: 1440, height: 900 });
    await tab.goto(url('fullmenu.html'), { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(1000);
    const cart = await tab.evaluate(() => {
      document.querySelector('.add-order-btn').click();
      const bar = document.getElementById('cartBar');
      return {
        barVisible: !bar.classList.contains('opacity-0'),
        items: document.getElementById('cartItemsList').children.length,
        badgeWorks: !!document.getElementById('cartCountBadge'),
      };
    });
    check('fullmenu floating cart still works', cart.barVisible && cart.items >= 1, JSON.stringify(cart));
    check('fullmenu cart count badge element preserved', cart.badgeWorks);
    await tab.close();
  }

  // ---------- 6. Navbar consistency across pages ----------
  console.log('\n=== NAVBAR CONSISTENCY ===');
  const headerOf = f => { const s = fs.readFileSync(path.join(BASE, f), 'utf8'); return s.slice(s.indexOf('<header'), s.indexOf('</header>') + 9).split('\n'); };
  const base = headerOf('contact.html');
  for (const f of ['home.html', 'about.html', 'fullmenu.html']) {
    const h = headerOf(f);
    let sameExceptActive = h.length === base.length;
    if (sameExceptActive) {
      for (let i = 0; i < h.length; i++) {
        if (h[i] !== base[i] && !(h[i].includes('aria-current') || base[i].includes('aria-current'))) { sameExceptActive = false; break; }
      }
    }
    check(f + ': navbar identical to contact.html except active link', sameExceptActive);
  }

  await browser.close();
  console.log('\n=== SUMMARY ===');
  console.log('Failures:', failures);
  process.exit(failures > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });

