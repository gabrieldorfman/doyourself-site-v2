// Copia as peças compartilhadas (_partes/*.html) para dentro de cada página, entre <!--#nome--> e <!--/nome-->.
// Rodar antes de cada commit: node tools/montar.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const raiz = fileURLToPath(new URL('..', import.meta.url));
const partes = Object.fromEntries(readdirSync(join(raiz, '_partes')).filter((f) => f.endsWith('.html')).map((f) => [f.replace('.html', ''), readFileSync(join(raiz, '_partes', f), 'utf8').trim()]));
const paginas = [];
const andar = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (['node_modules', '.git', '_partes', 'kit', 'tools', 'img', 'js', 'css'].includes(f)) continue; if (statSync(p).isDirectory()) andar(p); else if (f.endsWith('.html')) paginas.push(p); } };
andar(raiz);
let mudou = 0;
for (const p of paginas) {
  const antes = readFileSync(p, 'utf8'); let s = antes;
  for (const [nome, html] of Object.entries(partes)) s = s.replace(new RegExp(`<!--#${nome}-->[\\s\\S]*?<!--/${nome}-->`, 'g'), `<!--#${nome}-->\n${html}\n<!--/${nome}-->`);
  if (s !== antes) { writeFileSync(p, s); mudou++; console.log('montada:', p.replace(raiz, '')); }
}
console.log(`${paginas.length} páginas, ${mudou} atualizadas`);
