/* Do Yourself v2 — página do Cashback
   1. Calculadora por serviço (preços e regras de js/config.js)
   2. Débito x boleto ou PIX
   Muda sozinha quando o estado muda (dy:planos). */
(function () {
  const box = document.querySelector('[data-cs]'); if (!window.DY || !box) return;
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const brl = DY.brl, c = DY.centavos, E = DY.energia, mil = (n) => Number(n).toLocaleString('pt-BR'), uf = () => DY.uf || 'PR';
  const net = (para) => DY.catalogo[para][DY.blocoInternet(uf())].filter((p) => p.id !== '2000');
  const cels = () => DY.celularCnpj(['PR', 'SC'].includes(uf())).filter((p) => ['40', '80', '150'].includes(p.id));
  const oferta = (l) => l.find((p) => p.selo === 'OFERTA DO MÊS') || l[0];
  const acha = (l, id) => l.find((p) => p.id === id) || oferta(l);
  const st = { s: 'net', luz: 700, para: 'casa', net: '', app: 0, cel: '', n: 1, wtx: 'w100' };
  const bt = (v, b, s, on, tag) => `<button type="button" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-v="${v}">${tag ? `<em>${tag}</em>` : ''}<b>${b}</b>${s ? `<small>${s}</small>` : ''}</button>`;
  const of = (p) => (p.selo === 'OFERTA DO MÊS' ? 'Oferta do mês' : '');

  const desenha = () => {
    const ln = net(st.para), pn = acha(ln, st.net), lc = cels(), pc = acha(lc, st.cel);
    if (!pn.opcoes[st.app]) st.app = 0;
    $('[data-cs-op=net]', box).innerHTML = ln.map((p) => bt(p.id, mil(p.num) + ' Mega', brl(c(p.opcoes[0].preco)) + '/mês', p === pn, of(p))).join('');
    const ap = $('[data-cs-op=app]', box); ap.hidden = pn.opcoes.length < 2;
    ap.innerHTML = pn.opcoes.map((o, i) => bt(i, o.nome, '', i === st.app)).join('');
    $('[data-cs-op=cel]', box).innerHTML = lc.map((p) => bt(p.id, p.gb + ' GB', brl(c(p.preco)) + '/linha', p === pc, of(p))).join('');
    $('[data-cs-op=wtx]', box).innerHTML = DY.wttx.map((p) => bt(p.id, p.gb + ' GB', brl(c(p.preco)) + '/mês', p.id === st.wtx)).join('');
    pinta(pn, pc);
  };
  const pinta = (pn, pc) => {
    let paga, pct, volta, rot = 'Você paga por mês', conta, ir, msg, obs = `Preço ${DY.prepUF(uf())} ${DY.UFS[uf()] || uf()}, no débito em conta.`;
    if (st.s === 'luz') {
      const e = E.simular(st.luz); paga = e.elegivel ? e.comDesconto : 0; pct = 10; volta = e.elegivel ? e.cashback : 0; rot = 'Sua nova conta de luz';
      conta = e.elegivel ? `10% de ${brl(paga)}` : ''; ir = '/contratar?origem=energia' + (e.elegivel ? '&conta=' + st.luz : ''); msg = 'energia solar';
      $('[data-cs-luz-d]', box).textContent = e.elegivel ? `Desconto estimado de ${e.pct}%` : `Vale para contas a partir de R$ ${E.minimo}.`;
      $('[data-cs-luz-d]', box).classList.toggle('is-erro', !e.elegivel); obs = 'É uma estimativa. O valor certo sai da análise da sua fatura.';
    } else if (st.s === 'net') {
      const o = pn.opcoes[st.app]; paga = c(o.preco); pct = 50; conta = `50% de ${brl(paga)}`; msg = `internet de ${mil(pn.num)} Mega`;
      ir = `/contratar?origem=internet&para=${st.para}&plano=${encodeURIComponent(pn.id)}&opcao=${encodeURIComponent(o.nome)}`;
    } else if (st.s === 'cel') {
      paga = c(pc.preco) * st.n; pct = 100; conta = st.n > 1 ? `${st.n} linhas de ${brl(c(pc.preco))}` : `100% de ${brl(paga)}`; msg = `${st.n} ${st.n > 1 ? 'linhas' : 'linha'} de celular de ${pc.gb} GB`;
      ir = `/contratar?origem=celular&para=cnpj&plano=${pc.id}&linhas=${st.n}`; obs = `Preço ${DY.prepUF(uf())} ${DY.UFS[uf()] || uf()}. Mais de ${DY.linhasEspecial} linhas? Fale com a gente.`;
    } else {
      const p = DY.wttx.find((x) => x.id === st.wtx); paga = c(p.preco); pct = 50; conta = `50% de ${brl(paga)}`; msg = `WTTx de ${p.gb} GB`; obs = 'A cobertura é consultada pelo WhatsApp.';
    }
    if (volta === undefined) volta = DY.cashbackCentavos(paga, pct);
    box.dataset.s = st.s; box.style.setProperty('--pct', (volta ? pct : 0) + '%');
    const t = $('[data-cs-v=volta]', box); $('[data-cs-v=paga]', box).textContent = brl(paga); t.textContent = brl(volta);
    if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(t, { scale: .92 }, { scale: 1, duration: .4, ease: 'back.out(2.4)' });
    $('[data-cs-pct]', box).textContent = pct + '%'; $('[data-cs-rot]', box).textContent = rot; $('[data-cs-conta]', box).textContent = conta; $('[data-cs-obs]', box).textContent = obs;
    const n = $('[data-cs-n]', box), [a, b] = $$('[data-cs-l]', box); n.textContent = st.n; a.disabled = st.n <= 1; b.disabled = st.n >= DY.linhasEspecial;
    const zap = $('[data-cs-zap]', box), bIr = $('[data-cs-ir]', box);
    zap.href = DY.linkWhatsApp(`Olá! Vi o Cashback no site e quero contratar ${msg}.`); zap.target = '_blank'; zap.rel = 'noopener';
    bIr.hidden = st.s === 'wtx'; if (ir) bIr.href = ir;
  };
  /* setas do teclado nos grupos */
  document.addEventListener('keydown', (e) => {
    const b = e.target.closest('.pg-cash [role=radio]'), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!b || !d) return;
    e.preventDefault(); const g = b.parentElement, l = $$('[role=radio]', g), i = (l.indexOf(b) + d + l.length) % l.length; l[i].click(); $$('[role=radio]', g)[i].focus();
  });
  const marca = (b) => $$('[role=radio]', b.parentElement).forEach((x) => { x.setAttribute('aria-checked', x === b); x.tabIndex = x === b ? 0 : -1; });
  box.addEventListener('click', (e) => {
    const s = e.target.closest('[data-cs-s]'), v = e.target.closest('[data-v]'), l = e.target.closest('[data-cs-l]'), p = e.target.closest('[data-cs-para]');
    if (s) { st.s = s.dataset.csS; marca(s); $$('[data-cs-p]', box).forEach((x) => (x.hidden = x.dataset.csP !== st.s)); }
    else if (p) { st.para = p.dataset.csPara; st.net = ''; st.app = 0; marca(p); }
    else if (v) { const k = v.parentElement.dataset.csOp, f = v === document.activeElement; st[k] = k === 'app' ? +v.dataset.v : v.dataset.v; if (k === 'net') st.app = 0; desenha(); if (f) $(`[data-cs-op=${k}] [aria-checked=true]`, box).focus(); return; }
    else if (l) st.n = Math.max(1, Math.min(DY.linhasEspecial, st.n + +l.dataset.csL));
    else return;
    desenha();
  });
  const inp = $('[data-cs-luz]', box);
  inp.addEventListener('input', () => {
    const resto = inp.value.length - inp.selectionStart; inp.value = DY.formatarReais(inp.value);
    const q = Math.max(0, inp.value.length - resto); inp.setSelectionRange(q, q); st.luz = DY.lerReais(inp.value); desenha();
  });

  /* 2. forma de pagamento + exemplos da oferta do mês */
  const pg = $('[data-cs-pg]');
  const paga = () => {
    const p = oferta(net('casa')), v = c(p.opcoes[0].preco), bol = pg.dataset.csPg === 'bol', mais = DY.boletoPix * 100;
    $$('[data-cs-ex=nome]').forEach((x) => (x.textContent = mil(p.num) + ' Mega')); $$('[data-cs-ex=v]').forEach((x) => (x.textContent = brl(DY.cashbackCentavos(v, 50))));
    $('[data-cs-g=preco]', pg).textContent = brl(v + (bol ? mais : 0)); $('[data-cs-g=obs]', pg).textContent = bol ? `${brl(mais)} a mais por mês` : 'por mês, o melhor preço';
    $$('[data-cs-boleto]').forEach((x) => (x.textContent = brl(mais)));
  };
  pg.addEventListener('click', (e) => { const b = e.target.closest('[data-cs-f]'); if (b) { pg.dataset.csPg = b.dataset.csF; marca(b); paga(); } });
  const tudo = () => { desenha(); paga(); };
  document.addEventListener('dy:planos', tudo); tudo();
})();
