/* Do Yourself v2 — Wi-Fi
   1. Preço por modem (js/config.js)   2. Vans: entregas do Wi-Fi 5 e do 6   3. Andar pela casa (2,4 e 5 GHz)   4. Lugar do modem
   A planta vem de js/fibra.js */
(function () {
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const radios = (bts, fn) => bts.forEach((b, i) => {
    const vai = (x) => { bts.forEach((y) => { y.setAttribute('aria-checked', y === x); y.tabIndex = y === x ? 0 : -1; }); fn(x); };
    b.addEventListener('click', () => vai(b));
    b.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (d) { e.preventDefault(); const x = bts[(i + d + bts.length) % bts.length]; vai(x); x.focus(); } });
  });

  /* 1. preços */
  const precos = () => {
    const uf = DY.uf || 'PR', l = DY.catalogo.casa[DY.blocoInternet(uf)] || [], men = (p) => Math.min(...p.opcoes.map((o) => DY.centavos(o.preco)));
    const p6 = l.find((p) => p.id === '1000'), p5 = l.filter((p) => +p.id < 1000), por = (s, c) => { $(`[data-wf-v${s}]`).textContent = DY.brl(c); $(`[data-wf-c${s}]`).textContent = DY.brl(DY.cashbackCentavos(c, 50)); };
    if (p6) por(6, men(p6)); if (p5.length) por(5, Math.min(...p5.map(men)));
    $('[data-wf-p5]').textContent = p5.map((p) => p.num).join(', ').replace(/, ([^,]*)$/, ' e $1') + ' Mega';
    $$('[data-gm-uf]').forEach((x) => (x.textContent = DY.UFS[uf] || uf));
  };
  precos(); document.addEventListener('dy:planos', precos);

  /* 2. vans */
  const box = $('[data-wf-vans]'), pistas = $$('.wf-p', box).map((el) => ({ el, van: $('.wf-van', el), cx: $('.wf-van em', el), d: $('.wf-p__d', el), st: $('[data-st]', el), cabe: el.dataset.p === '6' ? 4 : 1 }));
  const IDA = 620; let n = 8, rodada = 0;
  const cxs = (p, k) => { p.cx.innerHTML = '<i></i>'.repeat(k); };
  const larg = (p) => { const r = $('.wf-p__r', p.el), dr = p.d.getBoundingClientRect().left - r.getBoundingClientRect().left; return Math.max(10, dr - p.van.offsetLeft - p.van.offsetWidth - 8); };
  const corre = async (p, id) => {
    const apar = [...p.d.children]; let feito = 0, viagens = 0;
    const move = (de, para) => p.van.animate([{ transform: `translateX(${de}px)` }, { transform: `translateX(${para}px)` }], { duration: IDA, easing: 'ease-in-out', fill: 'forwards' }).finished;
    while (feito < n) {
      if (id !== rodada) return; const k = Math.min(p.cabe, n - feito), w = larg(p); viagens++;
      cxs(p, k); p.st.textContent = `Viagem ${viagens}`; await move(0, w); if (id !== rodada) return;
      for (let i = 0; i < k; i++) apar[feito + i].classList.add('is-on'); feito += k; cxs(p, 0);
      if (feito < n) await move(w, 0);
    }
    if (id !== rodada) return; p.el.classList.add('is-fim'); p.st.textContent = `Pronto em ${viagens} ${viagens === 1 ? 'viagem' : 'viagens'}`;
  };
  const prepara = () => pistas.forEach((p) => { p.van.getAnimations().forEach((a) => a.cancel()); p.el.classList.remove('is-fim'); p.d.innerHTML = '<i></i>'.repeat(n); p.st.textContent = 'Pronto para sair'; cxs(p, Math.min(p.cabe, n)); });
  const larga = () => {
    const id = ++rodada; prepara();
    $('[data-wf-t]', box).textContent = n === 8 ? 'Quanto mais aparelhos, mais a diferença aparece.' : n === 4 ? 'O Wi-Fi 6 atende os quatro na mesma viagem.' : 'Com poucos aparelhos, a diferença é pequena.';
    if (calmo) { pistas.forEach((p) => { [...p.d.children].forEach((x) => x.classList.add('is-on')); const v = Math.ceil(n / p.cabe); p.el.classList.add('is-fim'); p.st.textContent = `Pronto em ${v} ${v === 1 ? 'viagem' : 'viagens'}`; }); return; }
    pistas.forEach((p) => corre(p, id).catch(() => {}));
  };
  radios($$('[data-n]', box), (b) => { n = +b.dataset.n; larga(); }); $('[data-wf-de]', box).addEventListener('click', larga);
  prepara();
  if ('IntersectionObserver' in window) new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { ob.disconnect(); larga(); } }, { threshold: .5 }).observe(box); else larga();
  let lw = innerWidth; addEventListener('resize', () => { if (innerWidth !== lw) { lw = innerWidth; larga(); } });

  /* 3. andar */
  const an = $('[data-wf-and]'), r = $('input', an);
  const anda = () => {
    const d = +r.value, v5 = Math.max(5, 100 - d * 1.25), v2 = 36 - d * .18, cinco = v5 > v2, nome = (v) => (v > 70 ? 'muito rápida' : v > 45 ? 'rápida' : v > 22 ? 'boa' : v > 12 ? 'mais lenta' : 'quase não chega');
    const lugar = d < 36 ? 'perto do modem' : d < 74 ? 'no cômodo ao lado' : 'do outro lado da casa';
    an.style.setProperty('--d', d); $('[data-wf-l]', an).textContent = lugar; r.setAttribute('aria-valuetext', lugar);
    [['5', v5, cinco], ['2', v2, !cinco]].forEach(([k, v, on]) => { const l = $(`[data-r="${k}"]`, an); l.style.setProperty('--w', v + '%'); l.classList.toggle('is-on', on); $('b', l).textContent = nome(v); });
    const t = cinco ? 'Use a rede 5 GHz. É a melhor para TV, reunião e jogo.' : 'Use a rede 2,4 GHz. Ela passa melhor pelas paredes e vai mais longe.', q = $('[data-wf-q]', an); if (q.textContent !== t) q.textContent = t;
  };
  r.addEventListener('input', anda); anda();

  /* 4. lugar */
  const lg = $('[data-wf-lug]'), poe = (b) => { lg.dataset.l = b.dataset.l; lg.dataset.f = b.dataset.f; $('[data-wf-s]', lg).textContent = b.dataset.s + '.'; $('[data-wf-x]', lg).textContent = b.dataset.t; };
  const lb = $$('button[data-l]', lg); radios(lb, poe); poe(lb[0]);
})();
