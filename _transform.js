// Transform script: connect navigation + fix responsiveness across all 4 pages.
const fs = require('fs');
const DIR = 'D:/aonefood/';
const FILES = ['home.html', 'about.html', 'contact.html', 'fullmenu.html'];
const ACTIVE = { 'home.html': 'home', 'about.html': 'about', 'contact.html': 'contact', 'fullmenu.html': 'menu' };

function read(f) { return fs.readFileSync(DIR + f, 'utf8'); }
function write(f, s) { fs.writeFileSync(DIR + f, s, 'utf8'); }
function replaceOnce(s, oldStr, newStr, label) {
  const idx = s.indexOf(oldStr);
  if (idx < 0) throw new Error('NOT FOUND: ' + label);
  if (s.indexOf(oldStr, idx + 1) >= 0) throw new Error('NOT UNIQUE: ' + label);
  return s.slice(0, idx) + newStr + s.slice(idx + oldStr.length);
}

// ---- 1. Verify the 4 headers are identical, capture emblem image tag ----
// Headers differ only in each page's active-link highlighting; capture each per file.
const headerMap = {};
const emblemCandidates = [];
for (const f of FILES) {
  const s = read(f);
  const a = s.indexOf('<header');
  const b = s.indexOf('</header>') + '</header>'.length;
  if (a < 0 || b < 8) throw new Error('header missing in ' + f);
  headerMap[f] = s.slice(a, b);
  const m = headerMap[f].match(/<img alt="A-One Foods Chicken Emblem\.png"[^>]*>/);
  if (m) emblemCandidates.push(m[0]);
}
if (!emblemCandidates.every(x => x === emblemCandidates[0])) throw new Error('emblem img differs between files');
const emblemImg = emblemCandidates[0];

const NAV_ITEMS = [
  ['Home', 'home.html', 'home'],
  ['Menu', 'fullmenu.html', 'menu'],
  ['Deals', 'fullmenu.html', 'deals'],
  ['Cakes &amp; Sweets', 'fullmenu.html#section-cakes-sweets', 'cakes-sweets'],
  ['About', 'about.html', 'about'],
  ['Contact', 'contact.html', 'contact'],
];

function desktopLinks(active) {
  return NAV_ITEMS.map(([label, href, key]) => {
    if (key === active) {
      return `<a class="transition-colors text-primary font-bold" aria-current="page" data-path="${key}" href="${href}">${label}</a>`;
    }
    return `<a class="font-title-md text-title-md text-on-surface-variant hover:text-on-surface transition-colors" data-path="${key}" href="${href}">${label}</a>`;
  }).join('\n');
}
function mobileLinks(active) {
  const base = 'font-title-md text-title-md px-space-sm py-2.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container';
  return NAV_ITEMS.map(([label, href, key]) => {
    if (key === active) {
      return `<a aria-current="page" class="${base} text-primary font-bold bg-surface-container-high/60" href="${href}">${label}</a>`;
    }
    return `<a class="${base} text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high" href="${href}">${label}</a>`;
  }).join('\n');
}

function buildHeader(active) {
  return `<header class="fixed top-0 w-full z-50 bg-surface-container-lowest/85 backdrop-blur-md border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
<div class="h-20 max-w-[1360px] mx-auto px-margin-mobile md:px-margin flex items-center justify-between gap-gutter">
<a class="flex items-center gap-space-sm rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container" href="home.html" aria-label="A-One Foods — Go to Home page">
${emblemImg}
<div class="flex flex-col min-w-0">
<span class="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-wide leading-none">A-One Foods</span>
<span class="hidden sm:block font-label-sm text-label-sm text-secondary uppercase tracking-widest mt-0.5">When You Want To Eat</span>
</div>
</a>
<nav aria-label="Primary" class="hidden lg:flex items-center gap-space-lg">
${desktopLinks(active)}
</nav>
<div class="flex items-center gap-space-md">
<button aria-label="Open cart" class="relative p-space-xs text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center" type="button">
<span class="material-symbols-outlined text-[24px]">shopping_bag</span>
<span class="absolute -top-1 -right-1 bg-primary-container text-on-primary-container font-label-sm text-label-sm rounded-full w-5 h-5 flex items-center justify-center font-bold">3</span>
</button>
<a class="hidden sm:inline-flex items-center gap-space-xs bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim hover:text-on-primary-fixed font-title-md text-title-md px-space-md py-space-xs rounded-full shadow-[0_4px_16px_rgba(242,106,15,0.35)] transition-all" href="https://wa.me/" rel="noopener noreferrer" target="_blank">
<span class="material-symbols-outlined text-[20px]">chat</span>
<span class="">Order on WhatsApp</span>
</a>
<div class="hidden sm:flex w-8 h-8 rounded-full bg-primary items-center justify-center" aria-hidden="true">
<span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
</div>
<button id="mobileNavToggle" class="lg:hidden inline-flex items-center justify-center p-space-xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobileNavMenu" aria-haspopup="true">
<span class="material-symbols-outlined text-[26px]" id="mobileNavIcon" aria-hidden="true">menu</span>
</button>
</div>
</div>
<div class="hidden lg:hidden border-t border-outline-variant/30 bg-surface-container-lowest/95 backdrop-blur-md" id="mobileNavMenu">
<nav aria-label="Mobile" class="max-w-[1360px] mx-auto px-margin-mobile md:px-margin py-space-sm flex flex-col gap-1">
${mobileLinks(active)}
<a class="mt-1 mb-1 inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim hover:text-on-primary-fixed font-title-md text-title-md px-space-md py-space-sm rounded-full shadow-[0_4px_16px_rgba(242,106,15,0.35)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container" href="https://wa.me/" rel="noopener noreferrer" target="_blank">
<span class="material-symbols-outlined text-[20px]">chat</span>
<span class="">Order on WhatsApp</span>
</a>
</nav>
</div>
</header>`;
}

const SHARED_STYLE = `<style>
/* Shared responsive helpers - identical on every page */
section[id], [id^="section-"], #quick-menu, #catering-section, #heritage-story, #quick-inquiry, #faqAccordion { scroll-margin-top: SCROLL_MARGIN; }
</style>`;

const SHARED_SCRIPT = `<script>
// Mobile navigation toggle - identical on every page
(function () {
  var toggle = document.getElementById('mobileNavToggle');
  var menu = document.getElementById('mobileNavMenu');
  var icon = document.getElementById('mobileNavIcon');
  if (!toggle || !menu) return;
  function setMenuOpen(open) {
    menu.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    if (icon) icon.textContent = open ? 'close' : 'menu';
  }
  toggle.addEventListener('click', function () {
    setMenuOpen(menu.classList.contains('hidden'));
  });
  menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setMenuOpen(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
      setMenuOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', function (e) {
    if (menu.classList.contains('hidden')) return;
    if (e.target && e.target.closest && !e.target.closest('header')) setMenuOpen(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024) setMenuOpen(false);
  });
})();
</script>`;


// ---- 3. Per-file transformations ----
for (const f of FILES) {
  let s = read(f);

  // 3a. html tag cleanup (per file)
  if (f === 'home.html') {
    s = replaceOnce(s, '<html class="dark" lang="en" style="">', '<html class="dark" lang="en">', 'home html style');
  } else if (f === 'contact.html') {
    s = replaceOnce(
      s,
      '<html class="dark" lang="en" style="font-family: Poppins, sans-serif !important; opacity: 0; visibility: visible !important;" data-stitch-anim-opacity="true" data-stitch-orig-opacity="1">',
      '<html class="dark" lang="en">',
      'contact html style'
    );
  } else if (f === 'fullmenu.html') {
    s = replaceOnce(
      s,
      '<html class="dark" lang="en" style="width: 1280px; height: 7713px; overflow: hidden; position: relative;">',
      '<html class="dark" lang="en">',
      'fullmenu html style (export leftover forcing 1280px width)'
    );
  }

  // 3b. Replace dead header with connected, responsive header
  const activeKey = ACTIVE[f];
  const newHeader = buildHeader(activeKey);
  const curHeader = headerMap[f];
  if (s.indexOf(curHeader) < 0) throw new Error('header drifted in ' + f);
  s = s.replace(curHeader, newHeader);

  // 3c. Footer: logo -> home, quick links -> real pages (5 links, identical in all files)
  s = replaceOnce(
    s,
    '<div class="flex items-center gap-space-sm"><img alt="A-One Foods Chicken Emblem.png" class="h-8 w-auto object-contain" src="',
    '<div class="flex items-center gap-space-sm"><a href="home.html" aria-label="A-One Foods — Go to Home page" class="flex items-center gap-space-sm rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"><img alt="A-One Foods Chicken Emblem.png" class="h-8 w-auto object-contain" src="',
    f + ' footer logo open anchor'
  );
  s = replaceOnce(
    s,
    'font-semibold">A-One Foods</span></div>',
    'font-semibold">A-One Foods</span></a></div>',
    f + ' footer logo close anchor'
  );
  s = replaceOnce(s, 'href="#">Chef\'s Signature Menu', 'href="fullmenu.html">Chef\'s Signature Menu', f + ' footer link menu');
  s = replaceOnce(s, 'href="#">Exclusive Family Deals', 'href="fullmenu.html">Exclusive Family Deals', f + ' footer link deals');
  s = replaceOnce(s, 'href="#">Artisan Cakes &amp; Sweets', 'href="fullmenu.html#section-cakes-sweets">Artisan Cakes &amp; Sweets', f + ' footer link cakes');
  s = replaceOnce(s, 'href="#">Our Heritage &amp; Craft', 'href="about.html">Our Heritage &amp; Craft', f + ' footer link about');
  s = replaceOnce(s, 'href="#">Direct Support &amp; Inquiries', 'href="contact.html">Direct Support &amp; Inquiries', f + ' footer link contact');

  // 3d. Footer legal links row: allow wrapping on small screens
  s = replaceOnce(
    s,
    '<div class="flex items-center gap-space-md font-body-sm text-body-sm">',
    '<div class="flex flex-wrap items-center justify-center gap-x-space-md gap-y-1 font-body-sm text-body-sm">',
    f + ' footer legal row'
  );


  // 3e. Per-page first-section top padding so content clears the fixed 80px header
  if (f === 'home.html') {
    s = replaceOnce(
      s,
      'bg-surface-container-lowest pt-space-xl pb-space-xl md:py-space-xl',
      'bg-surface-container-lowest pt-24 pb-space-xl md:pt-28 md:pb-space-xl',
      'home hero top padding'
    );
    s = replaceOnce(
      s,
      'grid grid-cols-3 gap-gutter pt-space-md mt-space-xs border-t border-outline-variant/30 w-full max-w-lg',
      'grid grid-cols-3 gap-space-sm sm:gap-gutter pt-space-md mt-space-xs border-t border-outline-variant/30 w-full max-w-lg',
      'home hero metrics gap'
    );
  } else if (f === 'contact.html') {
    s = replaceOnce(
      s,
      'bg-surface-container-lowest py-space-xl lg:py-28',
      'bg-surface-container-lowest pt-24 pb-space-xl lg:pt-28 lg:pb-28',
      'contact hero top padding'
    );
  } else if (f === 'fullmenu.html') {
    s = replaceOnce(
      s,
      'relative w-full overflow-hidden bg-surface-container-lowest py-space-xl',
      'relative w-full overflow-hidden bg-surface-container-lowest pt-24 pb-space-xl',
      'fullmenu banner top padding'
    );
  }

  // 3f. Insert shared scroll-margin style before </head> (larger on fullmenu for sticky category bar)
  const scrollMargin = f === 'fullmenu.html' ? '9rem' : '6.5rem';
  s = replaceOnce(s, '</head>', SHARED_STYLE.replace('SCROLL_MARGIN', scrollMargin) + '</head>', f + ' shared style');

  // 3g. Insert shared mobile-nav script before </body>
  s = replaceOnce(s, '</body>', SHARED_SCRIPT + '</body>', f + ' shared script');

  write(f, s);
  console.log('transformed:', f);
}
console.log('DONE');

