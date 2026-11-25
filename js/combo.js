/* Do Yourself v2 — página do combo
   1. Montador: perfil (casa, casa e MEI, empresa), serviços e Cashback somado
   2. Combos prontos, que preenchem o montador
   3. O que a economia da luz cobre no mês
   Preços e regras vêm de js/config.js; muda sozinho quando o estado muda (dy:planos). */
(function () {
  const box = document.querySelector('[data-cm-mo]'); if (!window.DY || !box) return;
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const brl = DY.brl, E = DY.energia, KS = ['luz', 'net', 'cel'];
  const mil = (n) => Number(n).toLocaleString('pt-BR');
  const uf = () => DY.uf || 'PR';
  const planosNet = (pf) => DY.catalogo[pf === 'empresa' ? 'empresa' : 'casa'][DY.blocoInternet(uf())].filter((p) => p.id !== '2000');
  const planosCel = () => DY.celularCnpj(['PR', 'SC'].includes(uf())).filter((p) => ['40', '80', '150'].includes(p.id));
  const oferta = (l) => l.find((p) => p.selo === 'OFERTA DO MÊS') || l[0];
  const precoNet = (p) => DY.centavos(p.opcoes[0].preco);
  const linhasTxt = (n) => `${n} ${n === 1 ? 'linha' : 'linhas'}`;
  const limite = (pf) => (pf === 'mei' ? 3 : DY.linhasEspecial);

  /* estado: perfil, o que está ligado e cada escolha */
  const PRONTO = { casa: { luz: 700, on: ['luz', 'net'], n: 1 }, mei: { luz: 700, on: KS, n: 1 }, empresa: { luz: 3000, on: KS, n: 4 } };
  const st = { pf: 'casa', luz: 700, net: '', cel: '', n: 1, on: { luz: true, net: true, cel: false } };
  const conta = (s) => {
    const ns = planosNet(s.pf), cs = planosCel();
    const pn = ns.find((p) => p.id === s.net) || oferta(ns), pc = cs.find((p) => p.id === s.cel) || oferta(cs);
    const e = E.simular(s.luz), v = {
      luz: s.on.luz && e.elegivel ? e.cashback : 0,
      net: s.on.net ? DY.cashbackCentavos(precoNet(pn), 50) : 0,
      cel: s.on.cel ? DY.cashbackCentavos(DY.centavos(pc.preco) * s.n, 100) : 0,
    };
    return { ns, cs, pn, pc, e, v, total: v.luz + v.net + v.cel };
  };

  const opcao = (id, t, sub, on, tag) => `<button type="button" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-v="${id}">${tag ? `<em>${tag}</em>` : ''}<b>${t}</b><small>${sub}</small></button>`;
  const desenhaOps = () => {
    const k = conta(st);
    $('[data-cm-net]', box).innerHTML = k.ns.map((p) => opcao(p.id, mil(p.num) + ' Mega', brl(precoNet(p)) + '/mês', p === k.pn, p.selo === 'OFERTA DO MÊS' ? 'Oferta do mês' : '')).join('');
    $('[data-cm-cel]', box).innerHTML = k.cs.map((p) => opcao(p.id, `${p.gb} GB`, brl(DY.centavos(p.preco)) + '/linha', p === k.pc, p.selo === 'OFERTA DO MÊS' ? 'Oferta do mês' : '')).join('');
    $('[data-cm-uf]', box).textContent = `Preços ${DY.prepUF(uf())} ${DY.UFS[uf()] || uf()}, no débito em conta. A fibra é confirmada pelo seu CEP.`;
  };
  let antes = 0, anim = 0;
  const conta1 = (el, de, para) => {
    cancelAnimationFrame(anim);
    if (de === para || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = brl(para); return; }
    const t0 = performance.now();
    const passo = (t) => { const x = Math.min(1, (t - t0) / 500), y = 1 - Math.pow(1 - x, 3); el.textContent = brl(Math.round(de + (para - de) * y)); if (x < 1) anim = requestAnimationFrame(passo); };
    anim = requestAnimationFrame(passo); setTimeout(() => (el.textContent = brl(para)), 560);
  };
  const pinta = () => {
    const k = conta(st), max = limite(st.pf), semCel = st.pf === 'casa';
    $$('[data-cm-pf]', box).forEach((b) => { const on = b.dataset.cmPf === st.pf; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
    KS.forEach((x) => {
      $(`[data-cm-s="${x}"]`, box).classList.toggle('is-on', st.on[x]);
      $(`[data-cm-on="${x}"]`, box).checked = st.on[x];
      $(`[data-cm-l-r="${x}"]`, box).hidden = !k.v[x];
      $(`[data-cm-v="${x}"]`, box).textContent = brl(k.v[x]);
      const b = $(`[data-cm-b="${x}"]`, box); b.style.flexGrow = k.total ? k.v[x] / k.total : 0; b.classList.toggle('is-off', !k.v[x]);
    });
    $('[data-cm-sub="luz"]', box).textContent = st.pf === 'empresa' ? 'Desconto na conta da empresa' : 'Desconto na conta de casa';
    $('[data-cm-sub="net"]', box).textContent = st.pf === 'empresa' ? 'Para a sua empresa, no CNPJ' : 'Para a sua casa, no CPF';
    $('[data-cm-sub="cel"]', box).textContent = semCel ? 'Para CNPJ e MEI. Tem MEI? Ligue aqui' : st.pf === 'mei' ? 'No CNPJ do seu MEI' : 'No CNPJ da empresa';
    $('[data-cm-luz-d]', box).textContent = k.e.elegivel ? `Desconto estimado de ${k.e.pct}%` : `Vale para contas a partir de R$ ${E.minimo}.`;
    $('[data-cm-luz-d]', box).classList.toggle('is-erro', !k.e.elegivel);
    $('[data-cm-n]', box).textContent = st.n;
    const [menos, mais] = $$('[data-cm-l]', box); menos.disabled = st.n <= 1; mais.disabled = st.n >= max;
    $('[data-cm-cel-d]', box).textContent = st.pf === 'mei' ? 'MEI: até 3 linhas, de até R$ 100 cada.' : `Mais de ${DY.linhasEspecial} linhas? A condição é especial, pelo WhatsApp.`;
    $('[data-cm-nome="net"]', box).textContent = `Internet ${mil(k.pn.num)} Mega`;
    $('[data-cm-nome="cel"]', box).textContent = `Celular ${k.pc.gb} GB, ${linhasTxt(st.n)}`;
    const el = $('[data-cm-v="total"]', box); conta1(el, antes, k.total); antes = k.total;
    $('[data-cm-eco]', box).hidden = !(st.on.luz && k.e.elegivel); $('[data-cm-v="eco"]', box).textContent = brl(k.e.economiaMes || 0);

    const luz = st.on.luz && k.e.elegivel, ir = $('[data-cm-ir]', box), zap = $('[data-cm-zap]', box);
    const sv = [luz && 'energia', st.on.net && 'internet', st.on.cel && 'celular'].filter(Boolean);
    ir.href = '/contratar?origem=combo' + (sv.length ? '&servicos=' + sv.join(',') : '') + (st.on.net ? `&para=${st.pf === 'empresa' ? 'empresa' : 'casa'}&plano=${k.pn.id}` : '') + (luz ? '&conta=' + st.luz : '') + (st.on.cel ? `&cel=${k.pc.id}&linhas=${st.n}` : '');
    const nomes = [luz && `energia solar (conta de ${brl(k.e.conta)})`, st.on.net && `internet de ${mil(k.pn.num)} Mega`, st.on.cel && `${linhasTxt(st.n)} de celular de ${k.pc.gb} GB`].filter(Boolean);
    zap.href = DY.linkWhatsApp(nomes.length ? `Olá! Montei um combo no site: ${nomes.join(', ').replace(/, ([^,]*)$/, ' e $1')}.` : 'Olá! Quero montar um combo com a Do Yourself.');
    zap.target = '_blank'; zap.rel = 'noopener';
    ir.classList.toggle('is-off', !sv.length); ir.setAttribute('aria-disabled', !sv.length); if (sv.length) ir.removeAttribute('tabindex'); else ir.tabIndex = -1;
  };
  const inLuz = $('[data-cm-luz]', box);
  const perfil = (pf, ligar) => {
    st.pf = pf; st.net = ''; st.cel = '';
    st.on.cel = pf !== 'casa' && (ligar === undefined ? true : ligar);
    st.n = Math.min(st.n, limite(pf)); desenhaOps(); pinta();
  };
  /* setas do teclado em qualquer grupo de escolhas */
  box.addEventListener('keydown', (e) => {
    const b = e.target.closest('[role=radio]'), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!b || !d) return;
    e.preventDefault(); const g = b.parentElement, l = $$('[role=radio]', g), i = (l.indexOf(b) + d + l.length) % l.length;
    l[i].click(); $$('[role=radio]', g)[i].focus();
  });
  box.addEventListener('click', (e) => {
    const pf = e.target.closest('[data-cm-pf]'), v = e.target.closest('[data-v]'), l = e.target.closest('[data-cm-l]'), ir = e.target.closest('[data-cm-ir]');
    if (ir && ir.classList.contains('is-off')) { e.preventDefault(); return; }
    if (pf) perfil(pf.dataset.cmPf);
    else if (v) {
      st[v.parentElement.matches('[data-cm-net]') ? 'net' : 'cel'] = v.dataset.v;
      $$('[data-v]', v.parentElement).forEach((x) => { x.setAttribute('aria-checked', x === v); x.tabIndex = x === v ? 0 : -1; }); pinta();
    } else if (l) { st.n = Math.max(1, Math.min(limite(st.pf), st.n + +l.dataset.cmL)); pinta(); }
  });
  box.addEventListener('change', (e) => { const k = e.target.dataset.cmOn; if (!k) return; if (k === 'cel' && st.pf === 'casa') return perfil('mei'); st.on[k] = e.target.checked; pinta(); });
  inLuz.addEventListener('input', () => {
    const resto = inLuz.value.length - inLuz.selectionStart; inLuz.value = DY.formatarReais(inLuz.value);
    const p = Math.max(0, inLuz.value.length - resto); inLuz.setSelectionRange(p, p);
    st.luz = DY.lerReais(inLuz.value); pinta();
  });

  /* 2. combos prontos */
  const prontos = () => Object.entries(PRONTO).forEach(([k, x]) => {
    const s = { pf: k, luz: x.luz, n: x.n, on: Object.fromEntries(KS.map((y) => [y, x.on.includes(y)])) }, c = conta(s);
    $(`[data-cm-pronto="${k}"]`).textContent = brl(c.total);
    $(`[data-cm-lista="${k}"]`).innerHTML = [`Conta de luz de R$ ${mil(x.luz)}`, `Internet ${mil(c.pn.num)} Mega`, s.on.cel && `${linhasTxt(x.n)} de ${c.pc.gb} GB`].filter(Boolean).map((t) => `<li>${t}</li>`).join('');
  });
  $$('[data-cm-usar]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.cmUsar, x = PRONTO[k];
    st.luz = x.luz; st.n = x.n; st.on.luz = st.on.net = true; inLuz.value = DY.formatarReais(String(x.luz));
    perfil(k, x.on.includes('cel'));
    $('#montar').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    $(`[data-cm-pf="${k}"]`, box).focus({ preventScroll: true });
  }));

  /* 3. o que a economia da luz cobre */
  const pg = $('[data-cm-pg]'), r = $('input', pg);
  const paga = () => {
    const s = E.simular(+r.value), net = oferta(planosNet('casa')), cel = oferta(planosCel());
    const val = { net: precoNet(net), cel: DY.centavos(cel.preco) };
    let resto = s.economiaMes;
    ['net', 'cel'].forEach((k) => {
      const li = $(`[data-cm-i="${k}"]`, pg), pct = Math.min(100, Math.floor((resto * 100) / val[k]));
      li.style.setProperty('--f', pct + '%'); li.classList.toggle('is-ok', pct === 100);
      $('em', li).textContent = pct === 100 ? 'Coberto' : pct ? `${pct}% coberto` : 'Ainda não';
      resto = Math.max(0, resto - val[k]);
    });
    const t = { de: brl(s.conta), eco: brl(s.economiaMes), netn: `Internet ${mil(net.num)} Mega`, netv: brl(val.net) + ' por mês', celn: `1 linha de ${cel.gb} GB`, celv: brl(val.cel) + ' por mês', sobra: brl(resto) + ' por mês' };
    Object.entries(t).forEach(([k, v]) => ($(`[data-cm-p="${k}"]`, pg).textContent = v));
    $('[data-cm-i="sobra"]', pg).classList.toggle('is-ok', resto > 0);
    r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100 + '%'); r.setAttribute('aria-valuetext', brl(s.conta));
  };
  r.addEventListener('input', paga);

  $$('[data-cm-boleto]').forEach((x) => (x.textContent = brl(DY.boletoPix * 100)));
  const tudo = () => {
    desenhaOps(); pinta(); prontos(); paga();
    const c = conta({ pf: 'casa', luz: 700, n: 1, on: { luz: true, net: true } });
    $$('[data-cm-jo]').forEach((x) => (x.textContent = brl(c.v[x.dataset.cmJo])));
  };
  document.addEventListener('dy:planos', tudo); tudo();
})();
