/* Do Yourself v2 — páginas de cada plano de internet para casa
   1. O plano: opção, forma de pagamento, preço e Cashback (js/config.js)
   2. Quanto sobra da velocidade   3. Tempo para baixar ou enviar   4. Planos vizinhos
   Muda sozinha quando o estado muda (dy:planos). */
(function () {
  const box = document.querySelector('[data-pn]'); if (!window.DY || !box) return;
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const c = DY.centavos, uf = () => DY.uf || 'PR', id = box.dataset.pn, mega = (n) => Number(n).toLocaleString('pt-BR') + ' Mega';
  const lista = () => DY.catalogo.casa[DY.blocoInternet(uf())] || [];
  const LOGO = { 'Paramount+': ['paramount', 'paramount-44.svg'], GloboPlay: ['globoplay', 'globoplay.png'], 'HBO Max': ['hbo', 'hbo-max.png'], 'YouTube Premium': ['youtube', 'youtube-premium-logo.svg'] };
  let op = id === '600' ? 1 : 0, bol = false; // no 600, o Paramount+ custa o mesmo que só internet
  const nome = (o) => (o.nome === 'Somente Internet' ? (id === '1000' ? 'NoPing' : 'Só internet') : o.nome === 'GloboPlay' ? 'Globoplay' : o.nome);
  const lg = (o) => { const l = o.nome === 'Somente Internet' ? (id === '1000' ? ['noping', 'noping.svg'] : null) : LOGO[o.nome]; return l ? `<span class="pn-lg pn-lg--${l[0]}"><img src="/img/apps/${l[1]}" alt=""></span>` : '<span class="pn-lg pn-lg--net"><img src="/img/icones/download.svg" alt=""></span>'; };
  const marca = (b) => $$('[role=radio]', b.parentElement).forEach((x) => { x.setAttribute('aria-checked', x === b); x.tabIndex = x === b ? 0 : -1; });

  const desenha = () => {
    const p = lista().find((x) => x.id === id); if (!p) return;
    if (!p.opcoes[op]) op = 0;
    const g = $('[data-pn-op]', box);
    if (p.opcoes.length > 1) g.innerHTML = p.opcoes.map((o, i) => `<button type="button" role="radio" aria-checked="${i === op}" tabindex="${i === op ? 0 : -1}" data-i="${i}">${lg(o)}<b>${nome(o)}${nome(o) === 'NoPing' ? '<small>Grátis por 6 meses</small>' : ''}</b><small>${DY.brl(c(o.preco))}</small></button>`).join('');
    else { g.removeAttribute('role'); g.removeAttribute('aria-label'); g.innerHTML = id === '500' ? '' : id === '2000' ? [['Paramount+'], ['GloboPlay'], ['HBO Max']].map(([n]) => lg({ nome: n })).join('') : `<div>${lg(p.opcoes[0])}${nome(p.opcoes[0])} incluso</div>`; if (id === '2000') g.innerHTML = `<div class="pn__qt">${g.innerHTML}<span>e Looke</span></div>`; }
    pinta(p);
  };
  const pinta = (p) => {
    const o = p.opcoes[op], v = c(o.preco), mais = DY.boletoPix * 100, t = $('[data-pn-v]', box);
    t.textContent = DY.brl(v + (bol ? mais : 0)); $('[data-pn-de]', box).textContent = o.de && !bol ? 'de ' + DY.brl(c(o.de)) + ' por' : '';
    $('[data-pn-o]', box).textContent = bol ? `${DY.brl(mais)} a mais por mês no boleto ou PIX` : 'no débito em conta';
    $('[data-pn-cb]', box).textContent = DY.brl(DY.cashbackCentavos(v, 50));
    $('[data-pn-uf]', box).textContent = DY.UFS[uf()] || uf();
    $('[data-pn-ir]', box).href = `/contratar?origem=internet&para=casa&plano=${id}&opcao=${encodeURIComponent(o.nome)}`;
    if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(t, { scale: .94 }, { scale: 1, duration: .4, ease: 'back.out(2.4)' });
  };
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]'), f = e.target.closest('[data-pn-f]');
    if (b) { op = +b.dataset.i; marca(b); } else if (f) { bol = f.dataset.pnF === 'bol'; marca(f); } else return;
    pinta(lista().find((x) => x.id === id));
  });
  document.addEventListener('keydown', (e) => {
    const b = e.target.closest('.pg-plano [role=radio]'), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!b || !d) return;
    e.preventDefault(); const l = $$('[role=radio]', b.parentElement), x = l[(l.indexOf(b) + d + l.length) % l.length]; x.click(); x.focus();
  });

  /* 2. quanto sobra */
  const us = $('[data-pn-us]');
  if (us) {
    const soma = () => {
      const tot = +us.dataset.pnUs; let u = 0;
      $$('li', us).forEach((l) => { const q = +$('output', l).textContent, [a, b] = $$('button', l); u += q * l.dataset.m; a.disabled = q <= 0; b.disabled = q >= 10; });
      u = Math.min(u, tot); us.style.setProperty('--u', (u / tot) * 100 + '%'); $('[data-us-u]', us).textContent = mega(u); $('[data-us-s]', us).textContent = mega(tot - u);
    };
    us.addEventListener('click', (e) => { const b = e.target.closest('[data-u]'); if (!b) return; const o = $('output', b.parentElement); o.textContent = Math.max(0, Math.min(10, +o.textContent + +b.dataset.u)); soma(); });
    soma();
  }

  /* 3. tempo */
  const tp = $('[data-pn-tp]');
  if (tp) {
    const txt = (s) => (s < 60 ? Math.round(s) + ' s' : Math.floor(Math.round(s) / 60) + ' min' + (Math.round(s) % 60 ? ' ' + (Math.round(s) % 60) + ' s' : ''));
    const roda = () => {
      const b = $('[aria-checked=true]', tp), ls = $$('li', tp), s = ls.map((l) => (b.dataset.g * 8000) / l.dataset[b.dataset.d]), m = Math.max(...s);
      ls.forEach((l, i) => { l.style.setProperty('--w', (s[i] / m) * 100 + '%'); $('b', l).textContent = txt(s[i]); });
    };
    tp.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) { marca(b); roda(); } });
    roda();
  }

  /* 4. vizinhos e validade */
  const viz = () => $$('[data-pn-viz]').forEach((el) => { const p = lista().find((x) => x.id === el.dataset.pnViz); el.closest('a').hidden = !p; if (p) el.textContent = DY.brl(c(Math.min(...p.opcoes.map((o) => o.preco)))); });
  const tudo = () => { desenha(); viz(); };
  document.addEventListener('dy:planos', tudo); tudo();
  const val = $('[data-pn-val]'); if (val && /^\d{4}-\d\d-\d\d/.test(DY.validadeOferta || '')) val.textContent = DY.validadeOferta.slice(0, 10).split('-').reverse().join('/'); else if (val && DY.validadeOferta) val.textContent = DY.validadeOferta;
})();
