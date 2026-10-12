// Remove the static navbar shopping-cart control from all four pages.
// Scope guard: the block is matched with its exact navbar context so the
// functional fullmenu floating-cart icon (cartCountBadge) and the home-page
// "Order Deal" buttons are left untouched.
const fs = require('fs');
const DIR = 'D:/aonefood/';
const FILES = ['home.html', 'about.html', 'contact.html', 'fullmenu.html'];

// Exact navbar cart button: opening tag + ligature span + badge span + closing tag (+ trailing newline)
const CART_BUTTON = [
  '<button aria-label="Open cart" class="relative p-space-xs text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center" type="button">',
  '<span class="material-symbols-outlined text-[24px]">shopping_bag</span>',
  '<span class="absolute -top-1 -right-1 bg-primary-container text-on-primary-container font-label-sm text-label-sm rounded-full w-5 h-5 flex items-center justify-center font-bold">3</span>',
  '</button>',
].join('\n');

let ok = true;
for (const f of FILES) {
  let s = fs.readFileSync(DIR + f, 'utf8');
  const count = s.split(CART_BUTTON).length - 1;
  if (count !== 1) {
    console.log('ERROR', f, 'navbar cart button occurrences =', count, '(expected 1)');
    ok = false;
    continue;
  }
  // sanity: block must sit inside the header (before </header>)
  const headerEnd = s.indexOf('</header>');
  const blockIdx = s.indexOf(CART_BUTTON);
  if (blockIdx === -1 || blockIdx > headerEnd) {
    console.log('ERROR', f, 'cart button not inside header');
    ok = false;
    continue;
  }
  s = s.replace(CART_BUTTON + '\n', ''); // remove block + its trailing newline
  fs.writeFileSync(DIR + f, s, 'utf8');
  console.log('removed navbar cart control:', f);
}

// Verify: no "shopping_bag" text left anywhere inside any <header>, and the
// functional fullmenu cart icon + home deal buttons still exist where expected.
const checks = [];
for (const f of FILES) {
  const s = fs.readFileSync(DIR + f, 'utf8');
  const header = s.slice(0, s.indexOf('</header>') + 9);
  const inHeader = header.includes('shopping_bag') || header.includes('>3<');
  checks.push([f + ': header clean of shopping_bag/badge', !inHeader]);
}
const fm = fs.readFileSync(DIR + 'fullmenu.html', 'utf8');
checks.push(['fullmenu floating-cart icon preserved', fm.includes('id="cartCountBadge"') && fm.includes('shopping_bag')]);
const hm = fs.readFileSync(DIR + 'home.html', 'utf8');
checks.push(['home deal buttons preserved', (hm.match(/Order Deal/g) || []).length === 3]);
for (const [name, pass] of checks) {
  console.log(pass ? 'PASS' : 'FAIL', name);
  if (!pass) ok = false;
}
console.log(ok ? 'DONE' : 'DONE WITH FAILURES');
process.exit(ok ? 0 : 1);
