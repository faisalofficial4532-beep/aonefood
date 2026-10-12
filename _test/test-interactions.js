const puppeteer = require('puppeteer-core');
const path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'D:/aonefood';
const url = f => 'file:///' + path.join(BASE, f).replace(/\\/g, '/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files'],
  });
  const tab = await browser.newPage();
  let failures = 0;
  const check = (name, ok, extra) => { if (!ok) failures++; console.log((ok ? 'PASS' : 'FAIL'), name, extra || ''); };

  await tab.setViewport({ width: 375, height: 720 });
  await tab.goto(url('home.html'), { waitUntil: 'networkidle2' });
  await sleep(1000);

  // 1. open mobile menu
  await tab.click('#mobileNavToggle');
  await sleep(300);
  let state = await tab.evaluate(() => ({
    hidden: document.getElementById('mobileNavMenu').classList.contains('hidden'),
    expanded: document.getElementById('mobileNavToggle').getAttribute('aria-expanded'),
    icon: document.getElementById('mobileNavIcon').textContent,
  }));
  check('mobile menu opens', !state.hidden && state.expanded === 'true' && state.icon === 'close', JSON.stringify(state));

  // 2. Escape closes and refocuses toggle
  await tab.keyboard.press('Escape');
  await sleep(300);
  state = await tab.evaluate(() => ({
    hidden: document.getElementById('mobileNavMenu').classList.contains('hidden'),
    expanded: document.getElementById('mobileNavToggle').getAttribute('aria-expanded'),
    focused: document.activeElement && document.activeElement.id,
  }));
  check('Escape closes + refocuses toggle', state.hidden && state.expanded === 'false' && state.focused === 'mobileNavToggle', JSON.stringify(state));

  // 3. click-outside closes
  await tab.click('#mobileNavToggle');
  await sleep(200);
  await tab.mouse.click(187, 500);
  await sleep(300);
  state = await tab.evaluate(() => document.getElementById('mobileNavMenu').classList.contains('hidden'));
  check('click outside closes menu', state === true);

  // 4. mobile link navigates and sets active
  await tab.click('#mobileNavToggle');
  await sleep(200);
  await Promise.all([
    tab.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
    tab.evaluate(() => {
      [...document.querySelectorAll('#mobileNavMenu a')].find(l => l.textContent.trim() === 'About').click();
    }),
  ]);
  await sleep(600);
  nav = await tab.evaluate(() => ({
    url: location.pathname,
    active: document.querySelector('nav[aria-label="Primary"] a[aria-current="page"]')?.textContent,
    menuHidden: document.getElementById('mobileNavMenu')?.classList.contains('hidden'),
  }));
  check('mobile About link -> about.html, About active', nav.url.endsWith('about.html') && nav.active === 'About', JSON.stringify(nav));


  // 5. desktop nav: Menu -> fullmenu.html
  await tab.setViewport({ width: 1440, height: 900 });
  await sleep(400);
  await Promise.all([
    tab.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
    tab.evaluate(() => document.querySelector('nav[aria-label="Primary"] a[data-path="menu"]').click()),
  ]);
  await sleep(600);
  nav = await tab.evaluate(() => ({
    url: location.pathname,
    activeHref: document.querySelector('nav[aria-label="Primary"] a[aria-current="page"]')?.getAttribute('href'),
  }));
  check('desktop Menu -> fullmenu.html', nav.url.endsWith('fullmenu.html') && nav.activeHref === 'fullmenu.html', JSON.stringify(nav));

  // 6. anchor target + scroll-margin on fullmenu
  const anchor = await tab.evaluate(() => {
    const sec = document.getElementById('section-cakes-sweets');
    return sec ? { exists: true, sm: getComputedStyle(sec).scrollMarginTop } : { exists: false };
  });
  check('#section-cakes-sweets exists w/ scroll-margin', anchor.exists && anchor.sm !== 'auto', JSON.stringify(anchor));

  // 7. fullmenu cart still works (regression)
  const cart = await tab.evaluate(() => {
    document.querySelector('.add-order-btn').click();
    return {
      barVisible: !document.getElementById('cartBar').classList.contains('opacity-0'),
      items: document.getElementById('cartItemsList').children.length,
    };
  });
  check('fullmenu addToCart regression', cart.items >= 1 && cart.barVisible, JSON.stringify(cart));

  // 8. logo -> home
  await tab.evaluate(() => document.querySelector('header a[href="home.html"]').click());
  await tab.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
  await sleep(500);
  nav = await tab.evaluate(() => ({ url: location.pathname, active: document.querySelector('nav[aria-label="Primary"] a[aria-current="page"]')?.textContent }));
  check('logo -> home.html, Home active', nav.url.endsWith('home.html') && nav.active === 'Home', JSON.stringify(nav));

  // 9. footer quick links wired
  const footerLinks = await tab.evaluate(() => {
    const want = ["Chef's Signature Menu", 'Exclusive Family Deals', 'Artisan Cakes & Sweets', 'Our Heritage & Craft', 'Direct Support & Inquiries'];
    return [...document.querySelectorAll('footer a')]
      .map(a => ({ t: a.textContent.trim(), h: a.getAttribute('href') }))
      .filter(l => want.includes(l.t));
  });
  check('footer quick links wired (5)', footerLinks.length === 5 && footerLinks.every(l => l.h && l.h !== '#'), JSON.stringify(footerLinks.map(l => l.h)));

  // 10. contact FAQ + form regression
  await tab.goto(url('contact.html'), { waitUntil: 'networkidle2' });
  await sleep(800);
  const contact = await tab.evaluate(() => {
    const btn = document.querySelector('#faqAccordion button');
    btn.click();
    const f = document.getElementById('orderForm');
    return { faqOpened: !btn.nextElementSibling.classList.contains('hidden'), formExists: !!f, hasHandler: typeof window.handleOrderSubmit === 'function' };
  });
  check('contact FAQ + form regression', contact.faqOpened && contact.formExists && contact.hasHandler, JSON.stringify(contact));

  // 11. home carousel + toast regression
  await tab.goto(url('home.html'), { waitUntil: 'networkidle2' });
  await sleep(800);
  const home = await tab.evaluate(() => {
    document.querySelector('.add-to-cart-btn').click();
    const toast = document.getElementById('cartToast');
    return {
      toastVisible: toast && !toast.classList.contains('opacity-0'),
      carousel: !!document.getElementById('carouselTrack'),
      scrollBtns: !!document.getElementById('scrollLeftBtn') && !!document.getElementById('scrollRightBtn'),
    };
  });
  check('home toast + carousel regression', home.toastVisible && home.carousel && home.scrollBtns, JSON.stringify(home));

  await browser.close();
  console.log('\n=== INTERACTION SUMMARY ===');
  console.log('Failures:', failures);
  process.exit(failures > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
