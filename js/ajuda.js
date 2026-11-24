/* Do Yourself v2 — central de ajuda: abas com painel ([data-aj-abas]) e busca ([data-aj-busca]) */
(function () {
  const $$ = (s, e = document) => [...e.querySelectorAll(s)];
  $$('[data-aj-abas]').forEach((g) => {
    const b = $$('.aj-ab__b > button', g), p = $$('.aj-ab__p > .aj-p', g);
    const vai = (i, foco) => { b.forEach((x, k) => { x.setAttribute('aria-checked', k === i); x.tabIndex = k === i ? 0 : -1; p[k].hidden = k !== i; }); if (foco) b[i].focus(); };
    b.forEach((x, i) => {
      x.addEventListener('click', () => vai(i));
      x.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (d) { e.preventDefault(); vai((i + d + b.length) % b.length, true); } });
    });
  });
  const bu = document.querySelector('[data-aj-busca]'); if (!bu) return;
  const idx = JSON.parse(bu.querySelector('script').textContent), inp = bu.querySelector('input'), ul = bu.querySelector('ul'), nada = bu.querySelector('.aj-bu__n');
  const limpa = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const PULA = new Set('a o e as os de da do das dos em no na um uma para por que com meu minha como eu e esta nao consigo tirar quero fazer'.split(' '));
  const SIN = { fatura: 'conta', boleto: 'conta', roteador: 'modem', velocidade: 'lenta', devagar: 'lenta', netflix: 'aplicativo', pix: 'cashback', selfie: 'biometria', trocar: 'mudar' };
  idx.forEach((x) => { x.kq = limpa(x.q); x.kt = limpa(x.t); x.ka = limpa(x.a); });
  const COR = { Energia: 'luz', Internet: 'net', Celular: 'cel', Aplicativos: 'net' }; // cor da etiqueta de cada serviço
  const busca = () => {
    const ps = limpa(inp.value).split(' ').filter((x) => x.length > 1 && !PULA.has(x));
    const r = !ps.length ? [] : idx.map((x) => ({ x, n: ps.reduce((s, w) => s + [w, SIN[w]].filter(Boolean).reduce((m, t) => { const k = t.length > 4 ? t.slice(0, -1) : t; return Math.max(m, x.kq.includes(k) ? 4 : x.kt.includes(k) ? 2 : x.ka.includes(k) ? 1 : 0); }, 0), 0) })).filter((y) => y.n).sort((a, b) => b.n - a.n).slice(0, 5);
    ul.replaceChildren(...r.map(({ x }) => { const li = document.createElement('li'), a = document.createElement('a'); a.href = x.l; [['small', x.t], ['b', x.q], ['span', x.a]].forEach(([t, v]) => { const e = document.createElement(t); e.textContent = v; if (t === 'small') e.className = 'is-' + (COR[v] || 'marca'); a.append(e); }); li.append(a); return li; }));
    nada.hidden = !ps.length || r.length > 0;
  };
  inp.addEventListener('input', busca);
  $$('.aj-bu__s button', bu).forEach((b) => b.addEventListener('click', () => { inp.value = b.textContent; busca(); }));
})();
