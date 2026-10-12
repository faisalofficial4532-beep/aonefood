const fs = require('fs');
const files = ['home.html', 'about.html', 'contact.html', 'fullmenu.html'];
const headers = {};
for (const f of files) {
  const s = fs.readFileSync('D:/aonefood/' + f, 'utf8');
  headers[f] = s.slice(s.indexOf('<header'), s.indexOf('</header>') + 9);
}
// normalize active-link differences for comparison
const norm = h => h
  .replace(/aria-current="page" /g, '')
  .replace(/text-primary font-bold /g, '')
  .replace(/text-on-surface-variant hover:text-on-surface /g, '')
  .replace(/bg-surface-container-high\/60 /g, '');
const nh = {};
for (const f of files) nh[f] = norm(headers[f]);
const base = nh['contact.html'];
for (const f of files) {
  console.log(f, 'matches contact.html structure:', nh[f] === base, 'len:', nh[f].length);
}
console.log('---');
const cs = fs.readFileSync('D:/aonefood/contact.html', 'utf8');
const hdr = cs.slice(cs.indexOf('<header'), cs.indexOf('</header>') + 9);
const divIdx = hdr.indexOf('<div class="flex items-center gap-space-md">');
const after = hdr.slice(divIdx);
const end = after.indexOf('id="mobileNavToggle"');
console.log(after.slice(0, end + 200));
