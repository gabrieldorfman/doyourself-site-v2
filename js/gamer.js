/* Do Yourself v2 — internet gamer
   1. Preço e Cashback dos planos (js/config.js), pelo estado   2. Tempo para baixar   3. Brincadeira do atraso */
(function () {
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const radios = (bts, fn) => bts.forEach((b, i) => {
    const vai = (x) => { bts.forEach((y) => { y.setAttribute('aria-checked', y === x); y.tabIndex = y === x ? 0 : -1; }); fn(x); };
    b.addEventListener('click', () => vai(b));
    b.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (d) { e.preventDefault(); const x = bts[(i + d + bts.length) % bts.length]; vai(x); x.focus(); } });
  });

  /* 1. preços */
  const precos = () => {
    const uf = DY.uf || 'PR', lista = DY.catalogo.casa[DY.blocoInternet(uf)] || [];
    $$('[data-gm-plano]').forEach((el) => {
      const p = lista.find((x) => x.id === el.dataset.gmPlano); el.hidden = !p; if (!p) return;
      const o = p.opcoes[0], c = DY.centavos(o.preco);
      const mil = lista.find((x) => x.id === '1000'); if (+p.id < 800 && mil && mil.opcoes[0].preco <= o.preco) { el.hidden = true; return; } // não vale indicar um plano menor pelo mesmo preço
      $$('[data-gm-v]', el).forEach((x) => (x.textContent = DY.brl(c)));
      $$('[data-gm-cb]', el).forEach((x) => (x.textContent = DY.brl(DY.cashbackCentavos(c, 50))));
      $$('[data-gm-de]', el).forEach((x) => (x.textContent = o.de ? 'de ' + DY.brl(DY.centavos(o.de)) : ''));
    });
    $$('[data-gm-uf]').forEach((x) => (x.textContent = DY.UFS[uf] || uf));
  };
  if (window.DY) { precos(); document.addEventListener('dy:planos', precos); }

  /* 2. tempo para baixar */
  const bx = $('[data-gm-bx]');
  if (bx) {
    const ls = $$('li', bx), roda = (g) => {
      const s = ls.map((l) => (g * 8000) / l.dataset.d), m = Math.max(...s);
      ls.forEach((l, i) => { const t = Math.round(s[i]); l.style.setProperty('--w', (s[i] / m) * 100 + '%'); $('b', l).textContent = Math.floor(t / 60) + ' min' + (t % 60 ? ' ' + (t % 60) + ' s' : ''); });
    };
    radios($$('[data-g]', bx), (b) => roda(+b.dataset.g)); roda(+$('[aria-checked=true]', bx).dataset.g);
  }

  /* 3. a bolinha que pula: o comando só vale depois do atraso escolhido */
  const jg = $('[data-gm-jg]'); if (!jg) return;
  const cv = $('canvas', jg), ctx = cv.getContext('2d'), bt = $('[data-gm-b]', jg), txt = $('[data-gm-r]', jg), placar = $('[data-gm-t]', jg);
  const TOTAL = 8, PULO = .66, tmp = [];
  let ms = 20, W = 0, H = 0, on = false, ant = 0, t = 0, pulo = -1, bl = [], ok = 0, erro = 0, pisca = 0, feito = {};
  const mede = () => { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); if (!on) pinta(); };
  const chao = () => H - 46, X = () => Math.min(W * .24, 190), R = () => (W < 520 ? 20 : 26), vel = () => Math.max(215, Math.min(W * .4, 380));
  const alt = () => (pulo < 0 ? 0 : 4 * (R() * 3.9) * (pulo / PULO) * (1 - pulo / PULO));
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); };
  const pinta = () => {
    ctx.clearRect(0, 0, W, H);
    const c = chao(), r = R();
    ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.lineWidth = 2;
    for (let x = -((t * vel() * .4) % 90); x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 50, c); ctx.stroke(); }
    ctx.fillStyle = '#3b86d1'; rr(-20, c, W + 40, 10, 5);
    bl.forEach((b) => { ctx.fillStyle = b.bateu ? '#ff7d6b' : b.foi ? '#8fe3b8' : '#ffb45c'; rr(b.x, c - b.h, b.w, b.h, 8); });
    const y = c - r - alt(), g = ctx.createRadialGradient(X() - r * .4, y - r * .4, 2, X(), y, r * 1.1);
    g.addColorStop(0, '#fff'); g.addColorStop(.35, pisca > 0 ? '#ff9c8d' : '#a9d3fb'); g.addColorStop(1, pisca > 0 ? '#d8432f' : '#4f9be6');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X(), y, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#0f2238'; [-.05, .45].forEach((d) => { ctx.beginPath(); ctx.arc(X() + r * d, y - r * .12, r * .12, 0, 7); ctx.fill(); });
  };
  const quadro = (agora) => {
    if (!on) return;
    const dt = Math.min((agora - ant) / 1000, .04); ant = agora; t += dt; pisca -= dt;
    if (pulo >= 0) { pulo += dt; if (pulo >= PULO) pulo = -1; }
    const v = vel(), x = X(), r = R();
    bl.forEach((b) => {
      b.x -= v * dt;
      if (!b.foi && !b.bateu && b.x < x + r * .7 && b.x + b.w > x - r * .7 && alt() < b.h - r * .25) { b.bateu = true; erro++; pisca = .35; }
      if (!b.foi && !b.bateu && b.x + b.w < x - r) { b.foi = true; ok++; }
    });
    placar.textContent = `Passou ${ok} de ${TOTAL}`;
    pinta();
    if (ok + erro >= TOTAL && bl[TOTAL - 1].x < x - r * 3) return fim();
    requestAnimationFrame(quadro);
  };
  const comeca = () => {
    const v = vel(); on = true; t = ok = erro = 0; pulo = -1; pisca = 0;
    bl = Array.from({ length: TOTAL }, (_, i) => ({ x: W + 60 + i * v * 1.35 + ((i * 37) % 5) * v * .06, w: R() * .95, h: R() * (i % 3 === 1 ? 1.75 : 1.4) }));
    bt.textContent = 'Pular'; txt.textContent = ms > 100 ? 'O comando vai chegar atrasado. Tente acertar o tempo.' : 'O comando chega na hora.'; ant = performance.now(); requestAnimationFrame(quadro);
  };
  const para = () => { on = false; tmp.splice(0).forEach(clearTimeout); bl = []; pulo = -1; pisca = 0; bt.textContent = 'Começar'; placar.textContent = `Pule os ${TOTAL} blocos`; };
  const fim = () => {
    feito[ms] = ok; para(); pinta(); bt.textContent = 'Jogar de novo'; placar.textContent = `Passou ${feito[ms]} de ${TOTAL}`;
    const a = feito[20], b = feito[400];
    txt.textContent = a != null && b != null ? `Ping baixo: ${a} de ${TOTAL}. Ping alto: ${b} de ${TOTAL}.` : `Você passou ${feito[ms]} de ${TOTAL}. Agora tente com o ping ${ms > 100 ? 'baixo' : 'alto'}.`;
    trava = performance.now();
  };
  let trava = -1e9;
  const acao = () => { if (!on) { if (performance.now() - trava > 700) comeca(); return; } tmp.push(setTimeout(() => { if (on && pulo < 0) pulo = 0; }, ms)); };
  bt.addEventListener('pointerdown', (e) => { if (e.button) return; e.preventDefault(); bt.focus({ preventScroll: true }); acao(); });
  bt.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); acao(); } });
  bt.addEventListener('keyup', (e) => { if (e.key === ' ') e.preventDefault(); });
  bt.addEventListener('click', (e) => { if (e.detail === 0 && !e.pointerType) acao(); }); // leitor de tela
  cv.addEventListener('pointerdown', (e) => { if (!e.button && on) { e.preventDefault(); acao(); } });
  radios($$('[data-ms]', jg), (b) => { ms = +b.dataset.ms; para(); pinta(); txt.textContent = 'Toque no botão para começar.'; });
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { if (on && !es[es.length - 1].isIntersecting) { para(); pinta(); } }).observe(cv);
  let larg = 0; addEventListener('resize', () => { if (innerWidth === larg) return; larg = innerWidth; if (on) para(); mede(); }); larg = innerWidth; mede();
})();
