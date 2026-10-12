const fs = require('fs');
function headerOf(f) {
  const s = fs.readFileSync('D:/aonefood/' + f, 'utf8');
  return s.slice(s.indexOf('<header'), s.indexOf('</header>') + 9);
}
const h = headerOf('home.html');
const c = headerOf('contact.html');
const hm = h.split('\n');
const cm = c.split('\n');
console.log('home lines:', hm.length, 'contact lines:', cm.length);
let diffs = 0;
for (let i = 0; i < Math.max(hm.length, cm.length); i++) {
  if (hm[i] !== cm[i]) {
    diffs++;
    console.log('\n--- line ' + (i + 1) + ' differs ---');
    console.log('home   :', hm[i]);
    console.log('contact:', cm[i]);
  }
}
console.log('\nTotal differing lines:', diffs);
