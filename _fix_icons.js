// Restore the Material Symbols icon font, which is broken by the page-wide
// `font-family: 'Poppins' !important` inline style (icon ligatures such as
// shopping_bag / chat / menu otherwise render as literal text).
const fs = require('fs');
const DIR = 'D:/aonefood/';
const FILES = ['home.html', 'about.html', 'contact.html', 'fullmenu.html'];

const OLD_RULE = ".material-symbols-outlined { display: inline-block; width: 1em; overflow: hidden; }";
const NEW_RULE = ".material-symbols-outlined { font-family: 'Material Symbols Outlined' !important; font-weight: normal; font-style: normal; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-feature-settings: 'liga'; font-feature-settings: 'liga'; width: 1em; overflow: hidden; }";

let ok = true;
for (const f of FILES) {
  let s = fs.readFileSync(DIR + f, 'utf8');
  if (s.includes("font-family: 'Material Symbols Outlined' !important")) { console.log('already fixed:', f); continue; }
  const count = s.split(OLD_RULE).length - 1;
  if (count !== 1) { console.log('ERROR', f, 'icon rule occurrences =', count); ok = false; continue; }
  s = s.replace(OLD_RULE, NEW_RULE);
  fs.writeFileSync(DIR + f, s, 'utf8');
  console.log('icon font restored:', f);
}
console.log(ok ? 'DONE' : 'DONE WITH FAILURES');
process.exit(ok ? 0 : 1);
