const fs = require('fs');
const files = ['home.html', 'about.html', 'contact.html', 'fullmenu.html'];
for (const f of files) {
  fs.copyFileSync('D:/aonefood/' + f, 'D:/aonefood/' + f + '.bak');
}
console.log('backups created');

// Diff footers home vs fullmenu
const h = fs.readFileSync('D:/aonefood/home.html', 'utf8');
const fm = fs.readFileSync('D:/aonefood/fullmenu.html', 'utf8');
const hf = h.slice(h.indexOf('<footer'));
const ff = fm.slice(fm.indexOf('<footer'));
for (let i = 0; i < Math.min(hf.length, ff.length); i++) {
  if (hf[i] !== ff[i]) {
    console.log('first diff at', i);
    console.log('home:    ' + JSON.stringify(hf.slice(Math.max(0, i - 60), i + 160)));
    console.log('fullmenu:' + JSON.stringify(ff.slice(Math.max(0, i - 60), i + 160)));
    break;
  }
}
console.log('home footer len', hf.length, 'fullmenu footer len', ff.length);
