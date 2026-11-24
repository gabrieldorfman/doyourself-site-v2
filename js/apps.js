/* Do Yourself v2 — páginas de aplicativos
   1. Preço e Cashback de cada plano com aplicativo
   2. Botões que trocam o painel (o que assistir, qual escolher, como entrar)
   3. Demonstração com e sem
   4. Passo a passo de ativação */
(function () {
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];

  /* 1. preços: data-ax-plano="id:aplicativo" */
  const precos = () => {
    const lista = DY.catalogo.casa[DY.blocoInternet(DY.uf)] || [];
    $$('[data-ax-plano]').forEach((el) => {
      const [id, app] = el.dataset.axPlano.split(':'), p = lista.find((x) => x.id === id);
      if (!p) { el.hidden = true; return; }
      const re = new RegExp(app, 'i');
      const o = p.opcoes.find((x) => re.test([x.nome, x.resumo, x.logo].join(' '))) || p.opcoes[0], c = Math.round(o.preco * 100);
      el.hidden = false;
      $$('[data-ax-preco]', el).forEach((x) => (x.textContent = DY.brl(c)));
      $$('[data-ax-cb]', el).forEach((x) => (x.textContent = DY.brl(DY.cashbackCentavos(c, 50))));
    });
  };
  if (window.DY) { precos(); document.addEventListener('dy:planos', precos); }

  const grupo = (bts, aoEscolher) => {
    const marca = (b, foco) => { bts.forEach((x) => { const on = x === b; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; }); if (foco) b.focus(); aoEscolher(b); };
    bts.forEach((b, i) => {
      b.addEventListener('click', () => marca(b));
      b.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (d) { e.preventDefault(); marca(bts[(i + d + bts.length) % bts.length], true); } });
    });
    return marca;
  };

  /* 2. botões e painéis */
  $$('[data-ax-abas]').forEach((sec) => {
    const bts = $$('[data-ax-aba]', sec), ps = $$('[data-ax-painel]', sec);
    const marca = grupo(bts, (b) => ps.forEach((p) => (p.hidden = p.dataset.axPainel !== b.dataset.axAba)));
    if (!('axHash' in sec.dataset)) return;
    const vai = () => {
      const b = bts.find((x) => '#' + x.dataset.axAba === location.hash); if (!b) return;
      marca(b); sec.scrollIntoView({ block: 'start' });
    };
    vai(); window.addEventListener('hashchange', vai);
    document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (a && a.getAttribute('href') === location.hash) vai(); });
  });

  /* 3. com e sem */
  $$('[data-ax-liga]').forEach((d) => {
    const t = $('.ax-demo__t', d);
    grupo($$('[data-ax-v]', d), (b) => { const v = b.dataset.axV; d.dataset.axLiga = v; t.textContent = t.dataset[v === 'sim' ? 'axSim' : 'axNao']; });
  });

  /* 4. passo a passo */
  $$('[data-ax-at]').forEach((at) => {
    const bts = $$('[data-ax-p]', at), ant = $('[data-ax-ant]', at), prox = $('[data-ax-prox]', at); let n = 0;
    const vai = (i) => {
      n = Math.max(0, Math.min(bts.length - 1, i));
      bts.forEach((b, k) => { if (k === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.classList.toggle('is-feito', k < n); });
      $$('[data-ax-t]', at).forEach((x) => (x.hidden = +x.dataset.axT !== n));
      $$('[data-ax-x]', at).forEach((x) => (x.hidden = +x.dataset.axX !== n));
      ant.disabled = !n; prox.textContent = n === bts.length - 1 ? 'Ver de novo' : 'Próximo passo';
    };
    bts.forEach((b, i) => b.addEventListener('click', () => vai(i)));
    ant.addEventListener('click', () => vai(n - 1));
    prox.addEventListener('click', () => vai(n === bts.length - 1 ? 0 : n + 1));
  });
})();
