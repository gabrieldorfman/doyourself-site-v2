/* Do Yourself v2 — fluxo de contratação (/contratar)
   endereço → consulta → serviços → um produto por vez → resumo → contato → dados → pagamento (só com internet) → pedido
   Preços e regras: js/config.js. Máscaras, validações e envio do pedido: js/pedido.js.
   O pedido recomeça se a página for atualizada. Nenhum dado pessoal vai para a URL nem fica salvo no navegador. */
(function () {
  const { brl, centavos: c, cashbackCentavos: cbk, mascara, validar, so } = DY, E = DY.energia;
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches, gs = !calmo && window.gsap;
  const espera = (ms) => new Promise((r) => setTimeout(r, calmo ? Math.min(ms, 150) : ms));
  const mil = (n) => Number(n).toLocaleString('pt-BR'), limita = (n, a, b) => Math.max(a, Math.min(b, n));
  const esc = (t) => String(t || '').replace(/[&<>"']/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const q = new URLSearchParams(location.search);
  const ORDEM = ['energia', 'internet', 'celular'];
  const S = {
    energia: { k: 'luz', t: 'Desconto na conta de luz', curto: 'Energia', art: 'a energia', ok: 'Energia adicionada!', de: 'da energia', img: '/img/3d-g/lampada.webp', cb: '10% da nova conta de luz', marco: 'depois da biometria do contrato' },
    internet: { k: 'net', t: 'Internet fibra', curto: 'Internet', art: 'a internet', ok: 'Internet adicionada!', de: 'da internet', img: '/img/3d-g/modem6.webp', cb: '50% de uma mensalidade', marco: 'depois da instalação' },
    celular: { k: 'cel', t: 'Plano de celular', curto: 'Celular', art: 'o celular', ok: 'Celular adicionado!', de: 'do celular', img: '/img/3d-g/celular.webp', cb: '100% de uma mensalidade por linha', marco: 'depois do chip ativado' },
  };
  const LOGO = { 'GloboPlay': ['/img/apps/globoplay.png', 'Globoplay'], 'Paramount+': ['/img/apps/paramount-44.svg', 'Paramount+'], 'HBO Max': ['/img/apps/hbo-max.png', 'HBO Max'], 'YouTube Premium': ['/img/apps/youtube-premium-logo.svg', 'YouTube Premium'] };
  const nb = (t) => String(t).replace(/(\d) (Mega|GB)/g, '$1\u00a0$2').replace(/R\$ /g, 'R$\u00a0'), junta = (l) => l.join(', ').replace(/, ([^,]*)$/, ' e $1');
  const nomeOp = (o) => (o.nome === 'Somente Internet' ? 'Só internet' : (LOGO[o.nome] || [0, o.nome])[1]);

  /* ---------- estado ---------- */
  const st = {
    id: DY.novoIdPedido(), origem: ['internet', 'celular', 'energia', 'combo', 'home'].includes(q.get('origem')) ? q.get('origem') : 'home',
    pagina: (q.get('pagina') || (() => { try { const u = new URL(document.referrer); return u.host === location.host ? u.pathname : ''; } catch (e) { return ''; } })()).replace(/[^a-z0-9/-]/gi, '').replace(/^\/|\/$/g, '').slice(0, 60), botao: (q.get('botao') || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40),
    end: { cep: '', logradouro: '', bairro: '', cidade: '', uf: '', numero: '', comp: '' }, modo: location.hash === '#buscar-cep' ? 'rua' : 'cep', achou: false,
    rua: { uf: DY.uf, cidade: '', nome: '', num: '' }, fibra: 'talvez', disp: {}, sel: [], idx: 0, editando: false, todosNet: false,
    luz: { conta: 0, tit: '' }, net: { id: '', op: 0, para: '' }, cel: { id: '', n: 1, tipo: '', porta: null }, ok: {},
    nome: '', tel: '', email: '', cpf: '', cnpj: '', aceite: false, pag: { tipo: 'debito', banco: '' },
  };
  (function daUrl() {
    const para = q.get('para'), conta = parseFloat(q.get('conta')), n = parseInt(q.get('linhas'), 10), plano = q.get('plano') || '', cel = q.get('cel') || (st.origem === 'celular' ? plano : '');
    if (conta >= E.minimo) st.luz.conta = conta;
    if (st.origem !== 'celular') { if (['casa', 'empresa'].includes(para)) st.net.para = para; else if (/^e\d/.test(plano)) st.net.para = 'empresa'; else if (plano) st.net.para = 'casa'; st.net.id = plano; if (plano === '2000') st.todosNet = true; }
    st.opcaoUrl = q.get('opcao');
    if ([...DY.planosCnpj, ...DY.celularPorta].some((p) => p.id === cel)) st.cel.id = cel;
    if (n > 0) st.cel.n = Math.min(n, DY.linhasEspecial);
    // o que a página de origem já diz: condomínio e empresas no CNPJ, MEI e portabilidade
    if (/^energia\/(condominio|empresas)$/.test(st.pagina)) st.luz.tit = 'cnpj';
    if (st.pagina === 'celular/mei') { st.cel.tipo = 'mei'; st.cel.n = Math.min(st.cel.n, 3); }
    if (st.pagina === 'celular/portabilidade' || DY.celularPorta.some((p) => p.id === st.cel.id)) st.cel.porta = true;
    const sv = (q.get('servicos') || '').split(',').filter((x) => ORDEM.includes(x));
    if (st.origem === 'combo') st.sel = sv.length ? sv : conta || plano || n ? [conta && 'energia', plano && 'internet', n && 'celular'].filter(Boolean) : ['energia', 'internet'];
    else if (ORDEM.includes(st.origem)) st.sel = [st.origem];
    let salvo = null; try { salvo = JSON.parse(sessionStorage.getItem('dy_endereco') || 'null'); } catch (e) { /* */ }
    const cep = so(q.get('cep') || (salvo && salvo.cep)); if (cep.length === 8) { st.end.cep = cep; st.end.numero = (q.get('numero') || (salvo && salvo.numero) || '').slice(0, 6); st.modo = 'cep'; }
  })();

  /* ---------- planos ---------- */
  const planosNet = () => DY.catalogo[st.net.para || 'casa'][DY.blocoInternet(st.end.uf || DY.uf)];
  const planosCel = () => DY.celularCnpj(['PR', 'SC'].includes(st.end.uf || DY.uf));
  const oferta = (l) => l.find((p) => p.selo === 'OFERTA DO MÊS') || l[0];
  const pNet = () => { const l = planosNet(); return l.find((p) => p.id === st.net.id) || l.find((p) => so(p.id) === so(st.net.id)) || oferta(l); };
  const pCel = () => { const l = [...planosCel(), ...(st.cel.porta === false ? [] : DY.celularPorta)]; return l.find((p) => p.id === st.cel.id) || oferta(l); };
  const opNet = (p) => { const i = p.opcoes[st.net.op] ? st.net.op : 0, o = p.opcoes[i]; if (p.id === '600' && o.nome === 'Somente Internet') { const k = p.opcoes.findIndex((x) => x.nome === 'Paramount+' && x.preco === o.preco); if (k >= 0) return k; } return i; };
  const maxLinhas = () => (st.cel.tipo === 'mei' ? 3 : DY.linhasEspecial);
  const pronto = { energia: () => !!st.luz.tit && st.luz.conta >= E.minimo, internet: () => !!st.net.para && !!st.net.id, celular: () => !!st.cel.tipo && st.cel.porta !== null && !!st.cel.id };

  /* itens do pedido: só o que já foi confirmado */
  function itens() {
    return ORDEM.filter(tem).map((s) => {
      if (s === 'energia') { const e = E.simular(st.luz.conta), t = st.luz.tit.toUpperCase(); return { produto: s, titulo: S[s].t, sub: `No ${t} · estimativa com ${e.pct}% de desconto`, antes: e.conta, mensal: e.comDesconto, cashback: e.cashback, conta_luz: e.conta, estimativa_desconto_pct: e.pct, titular: st.luz.tit, linhaZap: `Desconto na conta de luz, para uma conta de ${brl(e.conta)} (${t})` }; }
      if (s === 'internet') { const p = pNet(), o = p.opcoes[opNet(p)], v = c(o.preco), doc = st.net.para === 'empresa' ? 'CNPJ' : 'CPF', mais = o.nome === 'Somente Internet' ? '' : ' com ' + nomeOp(o); return { produto: s, titulo: `Internet fibra de ${mil(p.num)} Mega${mais}`, sub: `No ${doc} · Wi-Fi e instalação inclusos`, mensal: v, cashback: cbk(v, 50), plano: p.id, opcao: o.nome, para: st.net.para, titular: doc.toLowerCase(), linhaZap: `Internet fibra de ${mil(p.num)} Mega${mais}, ${brl(v)} por mês no débito em conta (${doc})` }; }
      const p = pCel(), u = c(p.preco), t = u * st.cel.n, doc = st.cel.tipo === 'mei' ? 'MEI' : 'CNPJ', l = `${st.cel.n} ${st.cel.n > 1 ? 'linhas' : 'linha'}`, num = st.cel.porta ? 'com portabilidade' : 'com número novo';
      return { produto: s, titulo: `${l} de celular de ${p.gb} GB`, sub: `No ${doc} · ${num} · ${brl(u)} por linha`, mensal: t, cashback: cbk(t, 100), plano: p.id, linhas: st.cel.n, para: st.cel.tipo, portabilidade: st.cel.porta, titular: 'cnpj', linhaZap: `${l} de celular de ${p.gb} GB ${num}, ${brl(u)} cada, total de ${brl(t)} por mês (${doc})` };
    });
  }
  const tem = (s) => !!st.ok[s] && pronto[s](), boleto = () => st.pag.tipo === 'boleto' && tem('internet');
  const mes = (i) => i.mensal + (i.produto === 'internet' && boleto() ? DY.boletoPix * 100 : 0);
  const soma = (l, f) => l.reduce((a, i) => a + f(i), 0);
  const precisaCnpj = () => tem('celular') || (tem('internet') && st.net.para === 'empresa') || (tem('energia') && st.luz.tit === 'cnpj');

  /* ---------- resumo ---------- */
  function htmlResumo({ editar = true } = {}) {
    const l = itens(); if (!l.length) return '<p class="rs__vazio">Escolha um serviço para começar.</p>';
    const tel = l.filter((i) => i.produto !== 'energia'), net = tel.some((i) => i.produto === 'internet');
    return `<ul class="rs">${l.map((i) => `<li data-s="${S[i.produto].k}"><img src="${S[i.produto].img}" alt="" width="64" height="64"><div class="rs__tx"><b>${nb(i.titulo)}</b><small>${nb(i.sub)}</small></div>
      <p class="rs__v">${i.antes ? `<s>${brl(i.antes)}</s>` : ''}<span><b>${brl(mes(i))}</b><small>/mês</small></span></p>${chipCb(i.cashback)}
      ${editar ? `<p class="rs__a"><button type="button" data-editar="${i.produto}">Alterar</button><button type="button" data-remover="${i.produto}">Remover</button></p>` : ''}</li>`).join('')}</ul>
      <div class="rs__tot">${tel.length ? `<p class="rs__t"><span>${tel.length > 1 ? 'Internet e celular' : S[tel[0].produto].curto}<small>${net ? (boleto() ? 'Internet no boleto ou PIX' : `Internet no débito em conta${st.pag.banco ? ` (${st.pag.banco})` : ''}`) : 'Valor das linhas'}</small></span><b>${brl(soma(tel, mes))}<small>/mês</small></b></p>` : ''}
      ${tem('energia') ? `<p class="rs__t"><span>Conta de luz<small>Estimativa, depende da fatura</small></span><b>${brl(l.find((i) => i.produto === 'energia').mensal)}<small>/mês</small></b></p>` : ''}
      <div class="rs__cb"><img src="/img/3d-g/cashback.webp" alt=""><p><span>Cashback total</span><b data-cbt>${brl(soma(l, (i) => i.cashback))}</b></p><small>Pago uma vez, via PIX na sua conta bancária, em até 7 dias depois que cada contrato é concluído. <button type="button" data-cb>Como funciona</button></small></div></div>`;
  }
  function atualiza() {
    const l = itens(), lado = $('[data-lado]'), semLado = ['endereco', 'consulta', 'servicos', 'resumo', 'gerando', 'fim'].includes(tela);
    lado.hidden = semLado || tela === 'produto' || !l.length; document.body.classList.toggle('com-lado', !lado.hidden);
    if (!lado.hidden) lado.innerHTML = `<div class="lado__c"><h2>Seu pedido</h2><button class="link" type="button" data-alterar>Alterar</button></div>${htmlResumo({ editar: false })}<p class="lado__n">Nada é cobrado agora.</p>`;
    const r = $('[data-abrir-resumo]'); r.hidden = semLado || !l.length; const rv = $('[data-rod-v]'), nv = 'Cashback ' + brl(soma(l, (i) => i.cashback)); if (rv.textContent !== nv) { rv.textContent = nv; if (gs && !r.hidden) gs.fromTo(r, { scale: 1.08 }, { scale: 1, duration: .5, ease: 'back.out(3)', clearProps: 'all' }); }
    $('[data-jan-resumo]').innerHTML = htmlResumo();
  }

  /* ---------- navegação ---------- */
  let tela = 'endereco', T = {};
  const etapas = () => ['Endereço', 'Serviços', 'Seus dados', ...(st.sel.length && !st.sel.includes('internet') ? [] : ['Pagamento'])];
  const ETAPA = { endereco: 0, consulta: 0, servicos: 1, produto: 1, resumo: 1, contato: 2, dados: 2, pagamento: 3, gerando: 9, fim: 9 };
  function progresso() {
    const e = etapas(), n = ETAPA[tela], parte = { endereco: .4, consulta: .85, servicos: .2, produto: .3 + .5 * (st.idx / Math.max(1, st.sel.length)), resumo: .9, contato: .35, dados: .75, pagamento: .6 }[tela] || 1;
    $('[data-etapas]').innerHTML = e.map((t, i) => `<li class="${i < n ? 'is-feita' : i === n ? 'is-atual' : ''}"${i === n ? ' aria-current="step"' : ''}><i>${i < n ? '' : i + 1}</i>${t}</li>`).join('');
    $('[data-etapas]').hidden = n === 9; $('[data-barra]').style.width = n === 9 ? '100%' : ((Math.min(n, e.length - 1) + parte) / e.length) * 100 + '%';
  }
  function mostra(nome, { volta = false, empurra = true } = {}) {
    $$('dialog[open]').forEach((d) => d.close());
    if (nome === 'endereco' && volta) { st.ok = {}; st.idx = 0; st.editando = false; }
    tela = nome; document.body.dataset.t = nome; document.body.dataset.k = nome === 'produto' ? S[st.sel[st.idx]].k : '';
    const el = $('[data-tela]'); el.innerHTML = T[nome].html(); if (T[nome].liga) T[nome].liga(el);
    botao(); atualiza(); progresso();
    if (empurra) history.pushState({ t: nome, i: st.idx }, '', location.pathname + location.search);
    scrollTo({ top: 0, behavior: 'instant' });
    if (gs) { gs.fromTo([...el.children], { x: volta ? -60 : 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .55, stagger: .07, ease: 'power3.out', clearProps: 'all' }); const ob = $('.hd__o', el); if (ob) gs.from(ob, { scale: .3, rotate: 20, y: 40, duration: .8, delay: .2, ease: 'back.out(1.8)', clearProps: 'all' }); }
    const h = $('h1', el); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  function botao() {
    const t = T[tela], b = $('[data-ir]'), r = $('[data-rod]'); r.hidden = !t.bt; if (!t.bt) return;
    b.innerHTML = `${t.bt()}<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg>`; b.disabled = t.pode ? !t.pode() : false;
  }
  const acao = () => { const t = T[tela]; if (!t.ir || cortOn) return; if (t.pode && !t.pode()) return; t.ir(); };
  $('[data-ir]').addEventListener('click', acao);
  addEventListener('popstate', (e) => {
    if (cortOn) cortOn();
    const s = e.state || { t: 'endereco' };
    if (tela === 'fim' || tela === 'gerando') { history.pushState({ t: 'fim' }, ''); return; }
    if (s.t === 'produto' && !st.sel[s.i]) s.t = 'servicos';
    if (s.t === 'servicos' && !st.disp.celular) s.t = 'endereco';
    if (['resumo', 'contato', 'dados', 'pagamento', 'fim'].includes(s.t) && !itens().length) s.t = 'endereco';
    if (s.t === 'pagamento' && !tem('internet')) s.t = 'resumo';
    st.idx = s.i || 0; st.editando = false; mostra(s.t, { volta: true, empurra: false });
  });
  history.replaceState({ t: 'endereco' }, '', location.pathname + location.search);
  const cab = (t, s, { volta = true, img = '', s: k = 'marca', extra = '' } = {}) => `${volta ? '<button class="volta" type="button" data-volta><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H4M9 5l-5 5 5 5"/></svg>Voltar</button>' : ''}<header class="hd${img ? ' hd--o' : ''}" data-s="${k}"><div><h1>${t}</h1>${s ? `<p>${s}</p>` : ''}${extra}</div>${img ? `<img class="hd__o" src="${img}" alt="">` : ''}</header>`;
  const rola = (el, bloco = 'center') => { if (el) setTimeout(() => el.scrollIntoView({ block: bloco, behavior: calmo ? 'auto' : 'smooth' }), 120); };

  /* ---------- campos ---------- */
  const campo = (id, rot, at = '', v = '', dica = '') => `<div class="cp" data-cp="${id}"><label class="cp__c"><input id="f-${id}" name="${id}" placeholder=" " value="${esc(v)}" aria-describedby="m-${id}" ${at}><span>${rot}</span><i class="cp__ok" aria-hidden="true"></i></label><p class="cp__m" id="m-${id}" data-dica="${esc(dica)}">${dica}</p></div>`;
  function pinta(id, erro, mostra = true) {
    const w = $(`[data-cp="${id}"]`); if (!w) return; const m = $('.cp__m', w), x = erro && mostra;
    w.classList.toggle('is-ok', !erro); w.classList.toggle('is-erro', !!x); m.textContent = x ? erro : m.dataset.dica; m.setAttribute('role', x ? 'alert' : 'note'); $('input', w).setAttribute('aria-invalid', !!x);
  }
  function liga(id, { masc, val, guarda }) {
    const i = $('#f-' + id); let tocado = false; if (!i) return;
    const roda = () => { const e = val(i.value); pinta(id, e, tocado); guarda(i.value); botao(); };
    i.addEventListener('input', () => { if (masc) { const fim = i.value.length - i.selectionStart; i.value = masc(i.value); const p = Math.max(0, i.value.length - fim); try { i.setSelectionRange(p, p); } catch (er) { /* */ } } roda(); });
    i.addEventListener('blur', () => { if (i.value) tocado = true; roda(); });
    if (i.value) roda();
  }
  const opcoes = (nome, rot, lista, v, cls = '') => `<div class="ops ${cls}" role="radiogroup" aria-label="${rot}" data-ops="${nome}">${lista.map(([k, t, s, img], i) => `<button type="button" role="radio" aria-checked="${v === k}" tabindex="${v === k || (!lista.some((x) => x[0] === v) && !i) ? 0 : -1}" data-v="${k}">${img ? `<img src="${img}" alt="">` : ''}<span><b>${t}</b>${s ? `<small>${s}</small>` : ''}</span></button>`).join('')}</div>`;

  /* ========== 1. ENDEREÇO ========== */
  const UFS = Object.entries(DY.UFS).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  let listaRua = [], pedRua = 0, tRua, ultimo = '';
  const tiraTipo = (r) => r.replace(/^(rua|r\.|avenida|av\.?|travessa|tv\.?|alameda|al\.?|rodovia|rod\.?|estrada|praça|pça\.?)\s+/i, '').trim() || r.trim();
  const viacep = async (uf, cid, rua) => { try { const l = await (await fetch(`https://viacep.com.br/ws/${uf}/${encodeURIComponent(cid)}/${encodeURIComponent(rua)}/json/`)).json(); return Array.isArray(l) ? l : []; } catch (e) { return null; } };
  // faixa dos Correios: true = o número está nela, false = não está, null = rua sem faixa
  function naFaixa(comp, n) {
    const t = semAcento(comp); if (!/^(ate|de |lado)/.test(t)) return null;
    const par = /lado par/.test(t), imp = /lado impar/.test(t); if ((par && n % 2) || (imp && !(n % 2))) return false; let m;
    if ((m = t.match(/^ate\s+(\d+)(?:\/(\d+))?/))) return n <= +(m[2] || m[1]);
    if ((m = t.match(/^de\s+(\d+)(?:\/\d+)?\s+a\s+(\d+)(?:\/(\d+))?/))) return n >= +m[1] && n <= +(m[3] || m[2]);
    if ((m = t.match(/^de\s+(\d+)(?:\/\d+)?\s+ao fim/))) return n >= +m[1];
    return par || imp ? true : null;
  }
  const sn = () => /^s/i.test(st.end.numero);
  const endOk = () => st.achou && st.end.logradouro.trim().length >= 3 && !!st.end.numero.trim();
  // o que a pessoa já escolheu na página de onde veio
  function vindo() {
    const o = st.opcaoUrl, l = [];
    if (st.sel.includes('energia') && st.luz.conta) l.push(['energia', `Conta de luz de ${brl(c(st.luz.conta))}`]);
    if (st.sel.includes('internet') && q.get('plano') && st.origem !== 'celular') l.push(['internet', `Internet fibra de ${mil(pNet().num)} Mega${o && o !== 'Somente Internet' ? ' com ' + nomeOp({ nome: o }) : ''}`]);
    if (st.sel.includes('celular') && st.cel.id) l.push(['celular', `${st.cel.n} ${st.cel.n > 1 ? 'linhas' : 'linha'} de ${pCel().gb} GB`]);
    return l.length ? `<div class="vindo"><p>Você escolheu</p><ul>${l.map(([s, t]) => `<li data-s="${S[s].k}"><img src="${S[s].img}" alt=""><b>${nb(t)}</b></li>`).join('')}</ul></div>` : '';
  }
  T.endereco = {
    html: () => `<div class="end"><div class="end__a"><div class="end__m" aria-hidden="true">${MAPA}<i class="cons__on"></i><i class="cons__on"></i><img src="/img/3d-g/pino.webp" alt=""></div><header><h1>Qual é o seu endereço?</h1><p>Com ele, mostramos o que chega na sua rua e os preços do seu estado.</p>${vindo()}</header></div>
      <div class="end__f"><form class="cx-f" data-form novalidate>
        <div data-modo="cep"${st.modo === 'cep' ? '' : ' hidden'}>${campo('cep', 'CEP', 'inputmode="numeric" autocomplete="postal-code" maxlength="9"', mascara.cep(st.end.cep))}</div>
        <div class="dupla" data-modo="rua"${st.modo === 'rua' ? '' : ' hidden'}>
          <label class="cp__c cp__c--sel"><select id="f-uf">${UFS.map(([k, n]) => `<option value="${k}"${k === st.rua.uf ? ' selected' : ''}>${n}</option>`).join('')}</select><span>Estado</span></label>
          <label class="cp__c"><input id="f-cidade" placeholder=" " list="l-cid" autocomplete="off" value="${esc(st.rua.cidade)}"><span>Cidade</span></label><datalist id="l-cid"></datalist>
          <label class="cp__c"><input id="f-rua" placeholder=" " autocomplete="off" value="${esc(st.rua.nome)}"><span>Nome da rua</span></label>
          <label class="cp__c"><input id="f-ruan" placeholder=" " inputmode="numeric" maxlength="6" autocomplete="off" value="${esc(st.rua.num)}"><span>Número</span></label>
          <div class="sug" data-sug aria-live="polite"></div>
        </div>
        <button class="link" type="button" data-troca>${st.modo === 'cep' ? 'Não sei meu CEP' : 'Sei meu CEP'}</button>
        <div class="achado" data-achado hidden></div>
        <p class="aviso" data-aviso hidden></p>
      </form>
      <ul class="garante"><li>Nada é cobrado agora</li><li>Leva poucos minutos</li><li>Você termina no WhatsApp, com uma pessoa</li></ul></div></div>`,
    bt: () => 'Continuar', pode: endOk,
    ir() {
      st.end.logradouro = st.end.logradouro.trim();
      try { sessionStorage.setItem('dy_endereco', JSON.stringify({ cep: st.end.cep, numero: st.end.numero })); } catch (e) { /* */ }
      mostra('consulta', { empurra: false });
    },
    liga(el) {
      const iCep = $('#f-cep'), ach = $('[data-achado]'), av = $('[data-aviso]');
      $('[data-form]', el).addEventListener('submit', (e) => { e.preventDefault(); acao(); });
      const desenhaAchado = (foco) => {
        ach.hidden = !st.achou; av.hidden = true; if (!st.achou) { ach.innerHTML = ''; botao(); return; }
        const e = st.end, livre = !e.travado;
        ach.innerHTML = `<div class="achado__r"><i aria-hidden="true"></i><div>${livre ? '' : `<b>${esc(e.logradouro)}</b>`}<span>${esc([e.bairro, e.cidade && `${e.cidade}/${e.uf}`].filter(Boolean).join(' · '))}</span></div></div>
          ${livre ? campo('log', 'Rua ou avenida', 'autocomplete="address-line1" maxlength="80"', e.logradouro) : ''}
          <div class="dupla"><div class="cp cp--num" data-cp="num"><label class="cp__c"><input id="f-num" placeholder=" " inputmode="numeric" maxlength="6" autocomplete="off" value="${esc(e.numero)}"${sn() ? ' readonly' : ''} aria-describedby="m-num"><span>Número</span></label><label class="snum"><input type="checkbox" data-sn${sn() ? ' checked' : ''}><i aria-hidden="true"></i>Sem número</label><p class="cp__m" id="m-num" data-dica=""></p></div>
          ${campo('comp', 'Complemento (opcional)', 'maxlength="40" autocomplete="address-line2"', e.comp)}</div>`;
        liga('log', { val: (v) => (v.trim().length >= 3 ? '' : 'Escreva o nome da rua.'), guarda: (v) => (e.logradouro = v) });
        liga('num', { masc: (v) => v.replace(/[^\dsn/]/gi, '').toUpperCase(), val: validar.numero, guarda: (v) => { e.numero = v; clearTimeout(tRua); av.hidden = true; tRua = setTimeout(confere, 600); } });
        $('#f-comp').addEventListener('input', (x) => (e.comp = x.target.value.trim()));
        $('[data-sn]').addEventListener('change', (x) => { const i = $('#f-num'); i.value = x.target.checked ? 'S/N' : ''; i.readOnly = x.target.checked; i.dispatchEvent(new Event('input')); if (!x.target.checked) i.focus(); });
        if (foco) { const i = $(livre ? '#f-log' : '#f-num'); if (livre || !e.numero) i.focus(); rola(ach); }
        botao();
      };
      // rua com mais de um CEP: avisa quando o número é de outro CEP
      async function confere() {
        const e = st.end, n = parseInt(so(e.numero), 10); if (!n || !e.travado) return;
        const l = ((await viacep(e.uf, e.cidade, tiraTipo(e.logradouro))) || []).filter((d) => semAcento(d.logradouro) === semAcento(e.logradouro));
        if (tela !== 'endereco' || so(e.numero) !== String(n) || l.length < 2) return;
        const meu = l.find((d) => so(d.cep) === e.cep); if (!meu || naFaixa(meu.complemento, n) !== false) return;
        const bom = l.find((d) => naFaixa(d.complemento, n) === true); if (!bom) return;
        av.hidden = false; av.innerHTML = `O número <b>${n}</b> fica em outro CEP dessa rua: <b>${bom.cep}</b>, ${esc(bom.bairro)}. <button class="link" type="button" data-cep="${so(bom.cep)}">Usar este CEP</button>`;
      }
      const busca = async (foco) => {
        const n = so(iCep.value); if (n.length < 8) { ultimo = ''; st.achou = false; st.end.cep = n; desenhaAchado(); pinta('cep', 'x', false); return; }
        if (n === ultimo && st.achou) return; ultimo = n; st.achou = false; desenhaAchado();
        $('[data-cp=cep]').classList.add('is-busca'); const r = await DY.buscarCep(n);
        if (tela !== 'endereco' || !iCep.isConnected || so(iCep.value) !== n) return; $('[data-cp=cep]').classList.remove('is-busca');
        if (!r || !DY.UFS[r.uf]) { ultimo = ''; pinta('cep', 'Não encontramos esse CEP. Confira os números ou toque em "Não sei meu CEP".'); return; }
        pinta('cep', ''); Object.assign(st.end, { cep: n, ...r, travado: !!r.logradouro }); st.achou = true; desenhaAchado(foco); if (st.end.numero) confere();
      };
      iCep.addEventListener('input', () => { iCep.value = mascara.cep(iCep.value); busca(true); });
      iCep.addEventListener('blur', () => setTimeout(() => { if (iCep.isConnected && st.modo === 'cep' && iCep.value && so(iCep.value).length < 8) pinta('cep', validar.cep(iCep.value)); }, 250));
      const modo = (m) => { st.modo = m; $$('[data-modo]', el).forEach((x) => (x.hidden = x.dataset.modo !== m)); $('[data-troca]').textContent = m === 'cep' ? 'Não sei meu CEP' : 'Sei meu CEP'; if (m === 'rua') { st.achou = false; ultimo = ''; iCep.value = ''; pinta('cep', 'x', false); desenhaAchado(); cidades(); } };
      $('[data-troca]').addEventListener('click', () => { modo(st.modo === 'cep' ? 'rua' : 'cep'); $(st.modo === 'cep' ? '#f-cep' : '#f-cidade').focus(); });
      const usa = (cep, num) => { if (num) st.end.numero = num; iCep.value = mascara.cep(cep); modo('cep'); ultimo = ''; busca(true); };
      el.onclick = (e) => { const b = e.target.closest('button[data-cep]'); if (b) usa(b.dataset.cep, b.dataset.num); };
      // não sei meu CEP
      const uf = $('#f-uf'), cid = $('#f-cidade'), rua = $('#f-rua'), num = $('#f-ruan'), sug = $('[data-sug]');
      const cidades = async () => { try { const r = await (await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.value}/municipios?orderBy=nome`)).json(); $('#l-cid').innerHTML = r.map((x) => `<option value="${esc(x.nome)}">`).join(''); } catch (e) { /* campo livre */ } };
      const mostraSug = () => {
        const n = parseInt(so(num.value), 10), nomes = [...new Map(listaRua.map((d) => [semAcento(d.logradouro), d.logradouro])).entries()];
        let k = st.rua.k; if (!k && nomes.length === 1) k = nomes[0][0];
        if (!listaRua.length) return;
        if (!k) { sug.innerHTML = `<p>Qual é a sua rua?</p>${nomes.slice(0, 12).map(([x, t]) => `<button type="button" data-rua="${esc(x)}"><b>${esc(t)}</b></button>`).join('')}`; return; }
        if (!n) { sug.innerHTML = '<p>Agora digite o número do imóvel.</p>'; return; }
        const dela = listaRua.filter((d) => semAcento(d.logradouro) === k), cert = dela.filter((d) => naFaixa(d.complemento, n) === true), l = cert.length ? cert : dela.filter((d) => naFaixa(d.complemento, n) === null);
        sug.innerHTML = l.length ? `<p>Este é o seu endereço?</p>${l.slice(0, 5).map((d) => `<button type="button" data-cep="${so(d.cep)}" data-num="${n}"><b>${esc(d.logradouro)}, ${n}</b><span>${esc(d.bairro)} · CEP ${d.cep}</span></button>`).join('')}` : '<p>Não encontramos um CEP para esse número. Confira o número.</p>';
      };
      const buscaRua = () => { clearTimeout(tRua); tRua = setTimeout(async () => {
        const m = rua.value.match(/^(.*?\D)[\s,]+(\d{1,6})\s*$/); if (m && m[1].trim().length >= 3) { rua.value = st.rua.nome = m[1].replace(/[\s,]+$/, ''); num.value = st.rua.num = m[2]; }
        const t = tiraTipo(rua.value); if (cid.value.trim().length < 3 || t.length < 3) { sug.innerHTML = ''; return; }
        const meu = ++pedRua, l = await viacep(uf.value, cid.value.trim(), t); if (meu !== pedRua || !sug.isConnected) return;
        listaRua = l || []; if (listaRua.length) mostraSug(); else sug.innerHTML = `<p>${l ? 'Não achamos essa rua nessa cidade. Confira como se escreve.' : 'Não conseguimos buscar agora. Tente de novo ou chame no WhatsApp.'}</p>`;
      }, 400); };
      uf.addEventListener('change', () => { st.rua.uf = uf.value; cid.value = ''; sug.innerHTML = ''; st.rua.k = ''; listaRua = []; cidades(); });
      cid.addEventListener('input', () => { st.rua.cidade = cid.value; buscaRua(); }); rua.addEventListener('input', () => { st.rua.nome = rua.value; st.rua.k = ''; buscaRua(); });
      num.addEventListener('input', () => { num.value = st.rua.num = so(num.value); mostraSug(); });
      sug.addEventListener('click', (e) => { const b = e.target.closest('[data-rua]'); if (!b) return; st.rua.k = b.dataset.rua; rua.value = st.rua.nome = b.textContent; mostraSug(); if (!num.value) num.focus(); });
      if (st.modo === 'rua') cidades(); else if (st.achou) { pinta('cep', ''); desenhaAchado(); } else if (st.end.cep.length === 8) busca(true); else if (matchMedia('(min-width:1124px)').matches) setTimeout(() => iCep.isConnected && iCep.focus(), 500);
    },
  };

  /* ========== 2. CONSULTA ========== */
  const CHECK = '<svg class="ck" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30"/><path d="M19 33l9 9 18-19"/></svg>';
  const MAPA = `<svg class="mapa" viewBox="0 0 640 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="640" height="320" fill="#dfeee5"/><path d="M-20 250C120 200 180 300 320 262S540 190 680 236v110H-20z" fill="#bfe0ee"/><rect x="410" y="24" width="120" height="74" rx="18" fill="#b9dfc6"/><rect x="60" y="150" width="84" height="58" rx="16" fill="#b9dfc6"/><g fill="none" stroke="#fff" stroke-linecap="round"><path stroke-width="16" d="M-10 120H650M200-10V330M470-10 380 330"/><path stroke-width="9" d="M-10 50H650M-10 200C160 190 300 220 650 160M80-10v340M310-10v340M590-10v340"/></g><g fill="#f6faf7"><rect x="100" y="66" width="42" height="36" rx="8"/><rect x="150" y="66" width="34" height="36" rx="8"/><rect x="222" y="66" width="70" height="36" rx="8"/><rect x="226" y="140" width="66" height="40" rx="8"/><rect x="328" y="66" width="60" height="36" rx="8"/><rect x="328" y="140" width="54" height="34" rx="8"/><rect x="470" y="132" width="90" height="30" rx="8"/><rect x="12" y="66" width="52" height="36" rx="8"/><rect x="12" y="140" width="40" height="36" rx="8"/><rect x="222" y="10" width="70" height="28" rx="8"/><rect x="330" y="10" width="62" height="28" rx="8"/></g></svg>`;
  T.consulta = {
    html: () => `<div class="cons"><div class="cons__m" aria-hidden="true">${MAPA}<i class="cons__on"></i><i class="cons__on"></i><img class="cons__pino" src="/img/3d-g/pino.webp" alt=""><svg class="cons__lupa" viewBox="0 0 120 120"><circle cx="50" cy="50" r="36"/><path d="M78 78l28 28"/><path class="br" d="M30 46a22 22 0 0 1 16-18"/></svg><div class="cons__ok">${CHECK}</div></div>
      <div class="cons__t"><h1 data-ct>Procurando o seu endereço</h1><p>${esc(st.end.logradouro)}, ${esc(st.end.numero)} · ${esc(st.end.cidade)}/${esc(st.end.uf)}</p><ul aria-live="polite"><li>Achando a sua rua no mapa</li><li>Vendo os serviços que chegam até você</li><li>Separando os preços do seu estado</li></ul></div></div>`,
    async liga(el) {
      const li = $$('li', el), vale = () => tela === 'consulta' && li[0].isConnected, lupa = $('.cons__lupa', el), pino = $('.cons__pino', el);
      DY.definirPlanos({ uf: st.end.uf }); DY.salvarLocal(st.end.uf, st.end.cidade);
      const f = DY.consultarViabilidade(st.end.cep, st.end.numero); let tl;
      if (gs) {
        const w = $('.cons__m', el).offsetWidth, x = (p) => w * p;
        gs.set(pino, { autoAlpha: 0, y: -160 }); gs.set(lupa, { x: -x(.3), y: -30 });
        tl = gs.timeline({ defaults: { duration: .62, ease: 'power2.inOut' } }).to(lupa, { x: x(.24), y: -60 }).to(lupa, { x: x(.3), y: 56 }).to(lupa, { x: -x(.26), y: 62 }).to(lupa, { x: 0, y: 0, scale: 1.2 })
          .to(lupa, { autoAlpha: 0, scale: 1.8, duration: .3 }).to(pino, { autoAlpha: 1, y: 0, duration: .55, ease: 'bounce.out' }, '<.05');
      } else lupa.style.display = 'none';
      const bate = (n) => { if (li[n]) li[n].className = 'is-ok'; };
      li[0].className = 'is-ja'; await espera(1250); bate(0); li[1].className = 'is-ja'; st.fibra = await f; await espera(1000); bate(1); li[2].className = 'is-ja'; await espera(1000); bate(2);
      if (tl) await Promise.race([tl.then(), espera(1500)]); if (!vale()) return;
      $('.cons', el).classList.add('is-achou'); $('[data-ct]', el).textContent = 'Achamos o seu endereço!'; if (gs) { gs.to(pino, { y: -26, scale: .72, duration: .4 }); confete($('.cons__m', el)); }
      await espera(1500); if (!vale()) return;
      st.disp = { internet: st.fibra, celular: 'sim', energia: E.atende(st.end.uf) ? 'sim' : 'nao' };
      st.sel = ORDEM.filter((s) => st.sel.includes(s) && st.disp[s] !== 'nao');
      if (st.opcaoUrl) { const i = pNet().opcoes.findIndex((o) => o.nome === st.opcaoUrl); st.net.op = Math.max(0, i); st.opcaoUrl = ''; }
      mostra('servicos');
    },
  };
  // papelzinho colorido: só no "Achamos" e no pedido pronto
  function confete(el) {
    if (!gs) return; const cx = document.createElement('div'); cx.className = 'conf'; cx.setAttribute('aria-hidden', 'true'); el.appendChild(cx);
    const cor = ['#e2700f', '#2f6fad', '#188752', '#e7c66b', '#8fd9b0'];
    for (let i = 0; i < 26; i++) { const p = document.createElement('i'); p.style.background = cor[i % 5]; cx.appendChild(p); const a = Math.PI * 2 * Math.random(), d = 90 + Math.random() * 150; gs.fromTo(p, { x: 0, y: 0, scale: 0, rotate: 0 }, { x: Math.cos(a) * d * 1.3, y: Math.sin(a) * d - 30, scale: 1, rotate: 360 * Math.random(), duration: .8, ease: 'power3.out' }); gs.to(p, { y: '+=90', autoAlpha: 0, duration: .8, delay: .6, ease: 'power1.in' }); }
    setTimeout(() => cx.remove(), 1600);
  }

  /* ========== 3. SERVIÇOS ========== */
  T.servicos = {
    html() {
      const net = DY.catalogo[st.net.para || 'casa'][DY.blocoInternet(st.end.uf)], min = Math.min(...net.flatMap((p) => p.opcoes.map((o) => c(o.preco)))), celMin = Math.min(...planosCel().map((p) => c(p.preco)));
      const I = {
        energia: ['Até <b>30%</b> de desconto', `Contas a partir de R$ ${E.minimo}. Sem placas e sem obra.`],
        internet: [`A partir de <b>${brl(min)}</b>/mês`, 'Wi-Fi e instalação inclusos.'],
        celular: [`A partir de <b>${brl(celMin)}</b>/mês por linha`, 'Para quem tem CNPJ ou MEI.'],
      };
      return `${cab('O que você quer contratar?', 'Escolha um, dois ou os três. O Cashback de cada um se soma.', { img: '/img/3d-g/casa.webp', extra: `<p class="ondes"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 18s6-5.2 6-10a6 6 0 1 0-12 0c0 4.800 6 10 6 10z"/><circle cx="10" cy="8" r="2.200"/></svg>${esc(st.end.logradouro)}, ${esc(st.end.numero)} · ${esc(st.end.cidade)}/${esc(st.end.uf)}</p>` })}
      <div class="svs">${ORDEM.map((s) => (st.disp[s] === 'nao'
        ? `<div class="sv is-nao" data-s="${S[s].k}"><img src="${S[s].img}" alt=""><div class="sv__x"><h2>${S[s].t}</h2><p>${s === 'internet' ? 'Ainda não temos fibra no seu endereço. Tem CNPJ? Conheça a <a href="/internet/wttx" target="_blank" rel="noopener">internet sem fio</a>.' : 'Ainda não atende a sua região.'}</p></div></div>`
        : `<button type="button" class="sv" role="checkbox" aria-checked="${st.sel.includes(s)}" data-sv="${s}" data-s="${S[s].k}"><span class="sv__d">Disponível</span><img src="${S[s].img}" alt=""><span class="sv__x"><span class="sv__h">${S[s].t}</span><span class="sv__p">${I[s][0]}</span><span class="sv__i">${I[s][1]}</span><span class="sv__cb"><img src="/img/3d/cashback-p.webp" alt="">Cashback de ${S[s].cb}</span></span><span class="sv__b"><i aria-hidden="true"></i><em class="nao">Quero</em><em class="sim">Escolhido</em></span></button>`)).join('')}</div>
      ${st.disp.internet === 'talvez' ? '<p class="nota nota--c">A fibra no seu número é confirmada no WhatsApp, antes de qualquer contrato.</p>' : ''}`;
    },
    bt: () => (st.sel.length ? (st.sel.length > 1 ? `Continuar com ${st.sel.length} serviços` : 'Continuar') : 'Escolha um serviço'), pode: () => !!st.sel.length,
    ir() { ORDEM.forEach((s) => { if (!st.sel.includes(s)) delete st.ok[s]; }); st.idx = 0; st.editando = false; cortina(st.sel[0], '', () => mostra('produto')); },
    liga(el) {
      if (gs) gs.from($$('.sv', el), { scale: .82, y: 40, duration: .6, stagger: .13, delay: .15, ease: 'back.out(1.5)', clearProps: 'transform' });
      el.querySelector('.svs').addEventListener('click', (e) => { const b = e.target.closest('[data-sv]'); if (!b) return; const s = b.dataset.sv, on = !st.sel.includes(s); st.sel = ORDEM.filter((x) => (x === s ? on : st.sel.includes(x))); b.setAttribute('aria-checked', on); if (gs && on) { gs.fromTo($('img', b), { scale: .8, rotate: -8 }, { scale: 1, rotate: 0, duration: .6, ease: 'back.out(2.6)', clearProps: 'all' }); gs.fromTo($('.sv__b i', b), { scale: 0 }, { scale: 1, duration: .4, ease: 'back.out(3)', clearProps: 'all' }); } botao(); progresso(); });
    },
  };
  /* passagem entre serviços, um momento por vez: primeiro o que entrou no pedido, depois o que vem agora.
     Um toque na tela adianta. A próxima tela só é desenhada quando a passagem termina. */
  let cortOn = null;
  function cortina(prox, feito, troca) {
    if (cortOn) return; const x = $('[data-cort]'), m = $('main'), a = prox && S[prox], f = feito && S[feito], it = feito && itens().find((i) => i.produto === feito);
    const obj = (img, ok) => `<div class="cort__o"><img src="${img}" alt="">${ok ? CHECK : ''}</div>`, l = [];
    if (f) l.push([f.k, `${obj(f.img, true)}<b>${f.ok}</b>${chipCb(it.cashback)}${st.sel.length > 1 ? `<ul class="cort__p" aria-hidden="true">${st.sel.map((s) => `<li class="${st.ok[s] ? 'is-ok' : ''}" data-s="${S[s].k}"><img src="${S[s].img}" alt=""></li>`).join('')}</ul>` : ''}`]);
    l.push(a ? [a.k, `${obj(a.img)}<b>${f ? 'Agora, ' + a.art : st.sel.length > 1 ? 'Primeiro, ' + a.art : a.t}</b>`] : ['marca', `${obj('/img/3d-g/cashback.webp')}<b>Seu pedido está montado!</b>`]);
    x.innerHTML = l.map(([k, h]) => `<div class="cort__q" data-s="${k}"><div>${h}</div></div>`).join(''); x.hidden = false; m.inert = true;
    const qs = $$('.cort__q', x), DUR = f ? [1.9, 1.5] : [1.2]; let tl, tm, trocou = false;
    const some = () => { if (tl) tl.kill(); clearTimeout(tm); x.hidden = true; x.innerHTML = ''; m.inert = false; cortOn = x.onclick = null; };
    const passa = () => { if (!trocou) { trocou = true; m.inert = false; troca(); m.inert = true; } };
    const acaba = () => { passa(); some(); const h = $('h1', m); if (h) h.focus({ preventScroll: true }); };
    cortOn = some;
    if (!gs) { let k = 0; const vez = () => { if (k >= qs.length) return acaba(); qs.forEach((e, j) => (e.hidden = j !== k)); tm = setTimeout(vez, DUR[k++] * 1000); }; x.onclick = () => { clearTimeout(tm); vez(); }; return vez(); }
    gs.set(x, { clearProps: 'all' }); tl = gs.timeline({ onComplete: acaba }); let t = 0; const troco = [];
    qs.forEach((e, k) => {
      const im = $('.cort__o img', e), ck = $('.ck', e), tx = $$('b, .cbk, .cort__p', $('div', e)).filter((z) => z.parentElement === e.firstChild);
      tl.fromTo(e, { clipPath: 'circle(0% at 50% 100%)' }, { clipPath: 'circle(150% at 50% 100%)', duration: .45, ease: 'power2.in' }, t);
      tl.from(im, { scale: .4, rotate: -14, y: 40, autoAlpha: 0, duration: .55, ease: 'back.out(1.8)' }, t + .25);
      if (ck) { tl.from(ck, { scale: 0, duration: .45, ease: 'back.out(2.4)' }, t + .65); tl.to($('path', ck), { strokeDashoffset: 0, duration: .4, ease: 'power2.out' }, t + .8); }
      tl.from(tx, { y: 24, autoAlpha: 0, duration: .35, stagger: .1 }, t + (ck ? .6 : .4));
      t += DUR[k]; troco.push(t);
    });
    tl.call(passa, null, t - .1).to(x, { yPercent: -100, duration: .5, ease: 'power3.inOut' }, t);
    x.onclick = () => { const p = troco.find((v) => v > tl.time() + .05); if (p) tl.time(Math.min(p, t - .12), false); };
  }

  /* ========== 4. PRODUTO ========== */
  const sAtual = () => st.sel[st.idx], corNet = () => (st.net.para === 'empresa' ? 'emp' : 'net');
  const passos = () => (st.sel.length > 1 && !st.editando ? `<ol class="pas" aria-label="Serviços do pedido">${st.sel.map((s, i) => `<li data-s="${S[s].k}" class="${i === st.idx ? 'is-atual' : st.ok[s] ? 'is-ok' : ''}"><img src="${S[s].img}" alt="">${S[s].curto}</li>`).join('')}</ol>` : '');
  const duvida = (t, href, l) => `<a class="duv" href="${href}" target="_blank" rel="noopener"><i aria-hidden="true">?</i><span><b>${t}</b><small>${l} Abre em outra aba e o pedido continua aqui.</small></span></a>`;
  const preco = (v, per) => { const [i, d] = brl(v).replace(/^R\$\s*/, '').split(','); return `<span class="pr"><small>R$</small><b>${i}</b><i>,${d}</i><em>${per}</em></span>`; };
  const chipCb = (v) => `<span class="cbk"><img src="/img/3d/cashback-p.webp" alt="">Cashback de <b>${brl(v)}</b></span>`;
  // anima um valor em centavos até o novo número
  function contaAte(el, v) { if (!el) return; const de = +el.dataset.v || 0; el.dataset.v = v; if (!gs || de === v) { el.textContent = brl(v); return; } const o = { n: de }; gs.killTweensOf(el._o || {}); el._o = o; gs.to(o, { n: v, duration: .6, ease: 'power2.out', onUpdate: () => (el.textContent = brl(Math.round(o.n))), onComplete: () => (el.textContent = brl(v)) }); }
  const INCLUI = {
    e1000: ['Gestão de equipe externa, 4 licenças', 'Antivírus', 'Audiolivros e cursos'], e600: ['Antivírus', 'Audiolivros e cursos'], e500: ['Audiolivros e cursos'],
  };
  const APPC = { whatsapp: 'WhatsApp', 'whatsapp-business': 'WhatsApp Business', instagram: 'Instagram', facebook: 'Facebook', messenger: 'Messenger', waze: 'Waze', x: 'X' };
  const ICONE = { 'YouTube Premium': '/img/apps/youtube.png' };
  const logoOp = (p, o) => (o.nome === 'Somente Internet' ? (p.id === '1000' ? '/img/apps/noping.svg' : '') : (LOGO[o.nome] || [])[0] || '');
  const opVis = (p) => { const semNada = p.opcoes.find((o) => o.nome === 'Somente Internet'), gr = semNada && p.opcoes.find((o) => o.nome === 'Paramount+' && o.preco === semNada.preco); return p.opcoes.map((o, i) => [o, i]).filter(([o]) => !(p.id === '600' && gr && o === semNada)).sort((a, b) => a[0].preco - b[0].preco); };
  // o card do plano, no visual do site: o card inteiro é o botão
  const card = ({ id, s, of, selo, num, uni, sub, meio, de, v, per, cbv, on, foco, obj }) => `<button type="button" class="pc${of ? ' pc--of' : ''}" data-s="${s}" role="radio" aria-checked="${on}" tabindex="${foco ? 0 : -1}" data-plano="${id}">
    ${of && obj ? `<img class="pc__obj" src="${obj}" alt="">` : ''}<span class="pc__selo">${of ? 'Oferta do mês' : selo}</span><span class="pc__n"><b>${num}</b>${uni}</span><span class="pc__s">${sub}</span><span class="pc__m">${meio}</span>
    <span class="pc__f">${de ? `<s>De ${brl(de)}</s>` : ''}${preco(v, per)}${chipCb(cbv)}<span class="pc__b"><i aria-hidden="true"></i><em class="nao">Escolher</em><em class="sim">Escolhido</em></span></span></button>`;
  const trilho = (rot, cards) => `<div class="tr" data-tr><div class="tr__in" role="radiogroup" aria-label="${rot}" data-trilho>${cards}</div><div class="tr__s" aria-hidden="true"><button type="button" tabindex="-1" data-seta="-1"><svg viewBox="0 0 20 20"><path d="M12 5l-5 5 5 5"/></svg></button><button type="button" tabindex="-1" data-seta="1"><svg viewBox="0 0 20 20"><path d="M8 5l5 5-5 5"/></svg></button></div></div>`;
  const lista = (l) => `<span class="pc__l">${l.map((t) => `<span>${t}</span>`).join('')}</span>`;

  const painel = {
    internet() {
      if (!st.net.id) return ''; const p = pNet(), oi = opNet(p), o = p.opcoes[oi], v = c(o.preco), vis = opVis(p), emp = st.net.para === 'empresa';
      const ap = (x, i, unico) => `<${unico ? 'div' : `button type="button" role="radio" aria-checked="${i === oi}" tabindex="${i === oi ? 0 : -1}" data-op="${i}"`} class="ap${unico ? ' ap--1' : ''}">${logoOp(p, x) ? `<span class="ap__i${/noping/.test(logoOp(p, x)) ? ' ap__i--p' : ''}"><img src="${ICONE[x.nome] || logoOp(p, x)}" alt=""></span>` : '<span class="ap__i ap__i--w"></span>'}<b>${x.nome === 'Somente Internet' ? (p.id === '1000' ? 'Internet + NoPing' : 'Só internet') : nomeOp(x)}</b><small>${unico ? 'Incluso' : brl(c(x.preco))}</small></${unico ? 'div' : 'button'}>`;
      const inc = emp ? INCLUI[p.id] || [] : [], quatro = p.id === '2000';
      const meio = vis.length > 1 ? `<p class="pn__q">Qual aplicativo você quer junto?</p><div class="aps" role="radiogroup" aria-label="Aplicativo do plano">${vis.map(([x, i]) => ap(x, i)).join('')}</div>`
        : quatro ? '<p class="pn__q">Aplicativos inclusos</p><p>HBO Max, Paramount+, Globoplay e Looke.</p>' : o.nome !== 'Somente Internet' ? `<p class="pn__q">Aplicativo incluso</p><div class="aps">${ap(o, 0, true)}</div>` : inc.length ? `<p class="pn__q">O plano inclui</p><ul class="pn__inc">${inc.map((t) => `<li>${t}</li>`).join('')}</ul>` : '<p class="pn__q">Somente internet</p><p>Modem Wi-Fi e instalação grátis inclusos.</p>';
      return `<div class="pn" data-s="${corNet()}"><div class="pn__a"><h2>Seu plano de ${mil(p.num)} Mega</h2>${meio}${DY.paginaPlano && DY.paginaPlano[p.id] ? `<a class="link" href="${DY.paginaPlano[p.id]}" target="_blank" rel="noopener">Ver tudo sobre este plano</a>` : ''}</div>${tot(v, '/mês', cbk(v, 50), 'No débito em conta')}</div>`;
    },
    celular() {
      if (!st.cel.id) return ''; const p = pCel(), n = st.cel.n, v = c(p.preco) * n, apps = (p.apps || []).filter((k) => APPC[k]);
      return `<div class="pn" data-s="cel"><div class="pn__a"><h2>Seu plano de ${p.gb} GB</h2><div class="qtd"><p><b>Quantas linhas?</b><small>${st.cel.tipo === 'mei' ? 'No MEI, até 3 linhas' : `${nb(brl(c(p.preco)))} cada`}</small></p><div class="qtd__c"><button type="button" data-l="-1" aria-label="Tirar uma linha"${n <= 1 ? ' disabled' : ''}>−</button><output aria-live="polite">${n}</output><button type="button" data-l="1" aria-label="Adicionar uma linha"${n >= maxLinhas() ? ' disabled' : ''}>+</button></div></div>
        ${apps.length ? `<p class="pn__q">Usar estes aplicativos não gasta a sua internet</p><ul class="pn__ap">${apps.map((k) => `<li><img src="/img/apps/${k}.svg" alt="">${k === 'whatsapp-business' ? 'Business' : APPC[k]}</li>`).join('')}</ul>` : ''}
        ${st.cel.tipo === 'mei' ? '' : `<p class="nota">Mais de ${DY.linhasEspecial} linhas? <a class="link" target="_blank" rel="noopener" href="${esc(DY.linkWhatsApp(`Olá! Quero mais de ${DY.linhasEspecial} linhas de celular para a minha empresa.`))}">Peça a condição especial</a></p>`}</div>${tot(v, '/mês', cbk(v, 100), n > 1 ? `${n} linhas de ${brl(c(p.preco))}` : 'Valor de 1 linha')}</div>`;
    },
  };
  const tot = (v, per, cbv, txt) => `<div class="pn__t"><small>${txt}</small>${`<p class="pn__v"><b data-pv data-v="${v}">${brl(v)}</b>${per}</p>`}<p class="pn__cb"><img src="/img/3d/cashback-p.webp" alt=""><span>Cashback de <b data-pcb data-v="${cbv}">${brl(cbv)}</b></span></p><button class="link" type="button" data-cb>Como funciona o Cashback</button></div>`;
  const P = {
    energia: () => `${passos()}${cab('Quanto vem a sua conta de luz?', 'Digite o valor e veja o desconto na hora.', { s: 'luz', img: S.energia.img })}
      <section class="bl"><h2>A conta está em nome de quem?</h2>${opcoes('luz.tit', 'Titular da conta de luz', [['cpf', 'CPF', 'Casa ou apartamento', '/img/3d-g/casa.webp'], ['cnpj', 'CNPJ', 'Condomínio ou empresa', '/img/3d-g/predio.webp']], st.luz.tit, 'ops--2')}</section>
      <section class="bl" data-b2${st.luz.tit ? '' : ' hidden'}><div class="sm" data-sm><div class="sm__in"><h2><label for="sm-c">Valor da sua conta por mês</label></h2><p>Use o total de uma fatura recente.</p><label class="val"><span>R$</span><input id="sm-c" data-conta inputmode="decimal" autocomplete="off" placeholder="0" aria-describedby="sm-m" value="${st.luz.conta ? DY.formatarReais(String(st.luz.conta).replace('.', ',')) : ''}"></label><p class="sm__m" id="sm-m" role="status" data-sm-m></p><div class="chips">${[500, 800, 1500, 3000, 8000].map((v) => `<button type="button" data-chip="${v}">R$ ${mil(v)}</button>`).join('')}</div></div>
        <div class="sm__out" data-sim-out><p class="sm__p" role="status" data-o="p">Seu desconto aparece aqui</p><div class="sm__g" aria-hidden="true"><p><small>Hoje</small><i class="sm__h"></i><s data-o="de">R$ 0,00</s></p><p><small>Com desconto</small><i class="sm__n" data-o="bar"></i><b data-o="nova">R$ 0,00</b></p></div><dl><div><dt>Economia por mês</dt><dd data-o="mes">R$ 0,00</dd></div><div><dt>Economia em um ano</dt><dd data-o="ano">R$ 0,00</dd></div></dl><p class="pn__cb"><img src="/img/3d/cashback-p.webp" alt=""><span>Cashback de <b data-o="cb">R$ 0,00</b></span></p><p class="nota">Estimativa. O valor certo sai da sua fatura, e você aprova antes. A primeira fatura com desconto pode levar até 90 dias.</p></div></div></section>
      ${duvida('Dúvidas sobre a energia?', '/energia', 'Veja como o desconto funciona.')}`,
    internet() {
      const l = planosNet(), tem2 = st.todosNet || (st.net.id && pNet().id === '2000'), vis = l.filter((p) => p.id !== '2000' || tem2), sel = st.net.id ? pNet() : null, of = oferta(vis), ord = [of, ...vis.filter((p) => p !== of)], emp = st.net.para === 'empresa';
      const um = (p, i) => {
        const on = p === sel, vi = opVis(p), o = on ? p.opcoes[opNet(p)] : (vi.find(([x]) => x.nome === 'Paramount+' && p.id === '600') || vi[0])[0], v = c(o.preco), wifi = p.num >= 2000 ? 7 : p.num >= 1000 ? 6 : 5, up = (((p.detalhes || []).find((d) => d[1] === 'Upload') || [])[2] || mil(p.num / 2) + ' Mega');
        const logos = [...new Set(p.opcoes.map((x) => ICONE[x.nome] || logoOp(p, x)).filter(Boolean))];
        return card({ id: p.id, s: corNet(), of: p === of, selo: p.selo, num: mil(p.num), uni: 'Mega', sub: `Upload de ${up}`, meio: lista([`Modem Wi-Fi ${wifi}`, 'Instalação grátis', ...(emp ? (INCLUI[p.id] || []).slice(0, 1) : [])]) + (logos.length ? `<span class="pc__lg"><small>${logos.length > 1 ? 'Escolha o aplicativo' : 'Aplicativo incluso'}</small><span>${logos.map((x) => `<img${/noping/.test(x) ? ' class="pt"' : ''} src="${x}" alt="">`).join('')}</span></span>` : p.id === '2000' ? '<span class="pc__lg"><small>Com 4 aplicativos inclusos</small></span>' : ''), de: p === of ? c(o.de || p.de) : 0, v, per: '/mês', cbv: cbk(v, 50), on, foco: sel ? on : !i, obj: emp ? '/img/3d-g/predio.webp' : '/img/3d-g/controle.webp' });
      };
      return `${passos()}${cab('Escolha a sua internet', 'Fibra com Wi-Fi e instalação inclusos.', { s: corNet(), img: S.internet.img })}
      <section class="bl"><h2>A internet fica em nome de quem?</h2>${opcoes('net.para', 'Titular da internet', [['casa', 'CPF', 'Casa ou apartamento', '/img/3d-g/casa.webp'], ['empresa', 'CNPJ', 'Empresa ou comércio', '/img/3d-g/predio.webp']], st.net.para, 'ops--2')}</section>
      <section class="bl" data-b2${st.net.para ? '' : ' hidden'}><h2>Toque no plano que você quer</h2>${trilho('Planos de internet', ord.map(um).join(''))}<div data-painel aria-live="polite">${painel.internet()}</div>
        ${l.some((p) => p.id === '2000') && !tem2 ? '<button class="link link--c" type="button" data-todos>Ver também o plano de 2.000 Mega</button>' : ''}<p class="nota nota--c">Preços no débito em conta. No boleto ou PIX, ${brl(DY.boletoPix * 100)} a mais por mês.</p></section>
      ${duvida('Dúvidas sobre a internet?', emp ? '/internet/empresa' : '/internet/casa', 'Veja como a fibra chega até você.')}`;
    },
    celular() {
      const l = planosCel(), of = oferta(l), sel = st.cel.id ? pCel() : null, tud = [...l, ...(st.cel.porta ? DY.celularPorta : [])].sort((a, b) => c(a.preco) - c(b.preco)), ord = [of, ...tud.filter((p) => p.id !== of.id)];
      const um = (p, i) => { const on = !!sel && p.id === sel.id, v = c(p.preco), apps = (p.apps || []).filter((k) => APPC[k]); return card({ id: p.id, s: 'cel', of: p.id === of.id, selo: p.soPorta ? 'Para quem traz o número' : p.selo, num: p.gb, uni: 'GB', sub: `${p.plano} GB do plano + ${p.bonus} GB de bônus`, meio: lista(['Ligações ilimitadas']) + (apps.length ? `<span class="pc__lg"><small>Sem gastar a internet</small><span>${apps.map((k) => `<img src="/img/apps/${k}.svg" alt="">`).join('')}</span></span>` : ''), de: p.id === of.id && p.de ? c(p.de) : 0, v, per: '/linha', cbv: v, on, foco: sel ? on : !i, obj: '/img/3d-g/celular.webp' }); };
      return `${passos()}${cab('Escolha o plano de celular', 'Ligações ilimitadas para todo o Brasil.', { s: 'cel', img: S.celular.img })}
      <section class="bl"><h2>Qual é o tipo do seu CNPJ?</h2>${opcoes('cel.tipo', 'Tipo de CNPJ', [['cnpj', 'Empresa', 'LTDA, ME, EPP e outras', '/img/3d-g/predio.webp'], ['mei', 'MEI', 'Até 3 linhas', '/img/3d-g/casa.webp']], st.cel.tipo, 'ops--2')}${st.cel.tipo ? '' : '<p class="nota">O plano de celular é só para empresas e MEI.</p>'}</section>
      <section class="bl" data-b2${st.cel.tipo ? '' : ' hidden'}><h2>Vai trazer o seu número?</h2>${opcoes('cel.porta', 'Número', [['1', 'Sim, quero trazer', 'Grátis, se ele já está no mesmo CNPJ'], ['0', 'Não, número novo', 'Enviamos o chip para todo o Brasil']], st.cel.porta === null ? '' : st.cel.porta ? '1' : '0', 'ops--2')}</section>
      <section class="bl" data-b3${st.cel.tipo && st.cel.porta !== null ? '' : ' hidden'}><h2>Toque no plano que você quer</h2>${trilho('Planos de celular', ord.map(um).join(''))}<div data-painel aria-live="polite">${painel.celular()}</div></section>
      ${duvida('Dúvidas sobre o celular?', st.cel.tipo === 'mei' ? '/celular/mei' : '/celular', 'Veja como os planos funcionam.')}`;
    },
  };
  const falta = () => ({ energia: st.luz.tit ? 'Digite o valor da conta' : 'Escolha CPF ou CNPJ', internet: st.net.para ? 'Escolha um plano' : 'Escolha CPF ou CNPJ', celular: !st.cel.tipo ? 'Escolha Empresa ou MEI' : st.cel.porta === null ? 'Escolha o número' : 'Escolha um plano' }[sAtual()]);
  T.produto = {
    html: () => P[sAtual()]() + `<button class="link link--c pular-s" type="button" data-pular>${st.ok[sAtual()] ? 'Tirar ' + S[sAtual()].art + ' do pedido' : 'Continuar sem ' + S[sAtual()].art}</button>`,
    bt: () => (pronto[sAtual()]() ? (st.editando ? 'Salvar' : 'Adicionar e continuar') : falta()), pode: () => pronto[sAtual()](),
    ir() { const s = sAtual(); st.ok[s] = true; if (st.editando) return segue(); cortina(st.sel[st.idx + 1], s, segue); },
    liga(el) {
      const s = sAtual(), refaz = (foco) => { const y = scrollY; el.innerHTML = T.produto.html(); T.produto.liga(el); scrollTo({ top: y, behavior: 'instant' }); botao(); atualiza(); const f = foco && $(foco, el); if (f) f.focus({ preventScroll: true }); };
      const surge = (x) => { if (!x) return; if (gs) { gs.from(x, { y: 30, autoAlpha: 0, duration: .5, ease: 'power3.out', clearProps: 'all' }); const pcs = $$('.pc', x); if (pcs.length) gs.from(pcs, { y: 60, scale: .9, autoAlpha: 0, duration: .55, stagger: .09, ease: 'back.out(1.3)', clearProps: 'all' }); } rola(x, 'start'); };
      const tr = $('[data-trilho]', el), centra = (x, suave = true) => { if (tr && x) tr.scrollTo({ left: x.offsetLeft - (tr.clientWidth - x.offsetWidth) / 2, behavior: suave && !calmo ? 'smooth' : 'instant' }); };
      const setas = () => { if (!tr || !tr.isConnected) return; const w = $('[data-tr]', el); w.classList.toggle('tem', tr.scrollWidth > tr.clientWidth + 4); const [a, b] = $$('[data-seta]', w); a.disabled = tr.scrollLeft < 4; b.disabled = tr.scrollLeft > tr.scrollWidth - tr.clientWidth - 4; };
      if (tr) { tr.addEventListener('scroll', setas, { passive: true }); new ResizeObserver(setas).observe(tr); const on = $('[aria-checked=true]', tr); if (on) centra(on, false); setas(); }
      const pintaPainel = (novo) => { const w = $('[data-painel]', el), v0 = $('[data-pv]', w), k0 = $('[data-pcb]', w), a = v0 && v0.dataset.v, b = k0 && k0.dataset.v; w.innerHTML = painel[s](); const v1 = $('[data-pv]', w), k1 = $('[data-pcb]', w); [[v1, a], [k1, b]].forEach(([x, de]) => { if (!x) return; const v = +x.dataset.v; if (de != null && !novo) { x.dataset.v = de; contaAte(x, v); } });
        if (novo) { const pn = $('.pn', w); if (gs) { gs.from(pn, { y: -24, autoAlpha: 0, scale: .97, duration: .45, ease: 'power3.out', clearProps: 'all' }); gs.from($$('.ap,.pn__ap li,.pn__inc li,.qtd', pn), { y: 18, autoAlpha: 0, duration: .4, stagger: .06, delay: .15, ease: 'power2.out', clearProps: 'all' }); } rola(pn, 'nearest'); } };
      el.onclick = (e) => {
        if (tela !== 'produto') return;
        const o = e.target.closest('[data-ops] [data-v]'), p = e.target.closest('[data-plano]'), a = e.target.closest('[data-op]'), l = e.target.closest('[data-l]'), ch = e.target.closest('[data-chip]'), sx = e.target.closest('[data-seta]');
        if (o) {
          const nome = o.parentElement.dataset.ops, v = o.dataset.v, eraVazio = { 'luz.tit': !st.luz.tit, 'net.para': !st.net.para, 'cel.tipo': !st.cel.tipo, 'cel.porta': st.cel.porta === null }[nome];
          if (nome === 'luz.tit') st.luz.tit = v;
          if (nome === 'net.para') { if (st.net.para !== v) st.net.op = 0; const num = so(st.net.id); st.net.para = v; if (num) { const alvo = planosNet().find((x) => so(x.id) === num); st.net.id = alvo ? alvo.id : ''; } }
          if (nome === 'cel.tipo') { st.cel.tipo = v; st.cel.n = Math.min(st.cel.n, maxLinhas()); }
          if (nome === 'cel.porta') { st.cel.porta = v === '1'; if (!st.cel.porta && DY.celularPorta.some((x) => x.id === st.cel.id)) st.cel.id = ''; }
          refaz(`[data-ops="${nome}"] [data-v="${v}"]`);
          if (eraVazio || nome === 'net.para') { surge($(nome === 'cel.porta' || (nome === 'cel.tipo' && st.cel.porta !== null) ? '[data-b3]' : '[data-b2]', el)); if (nome === 'luz.tit') setTimeout(() => { const i = $('[data-conta]', el); if (i) i.focus({ preventScroll: true }); }, 350); }
        } else if (p) {
          const k = s === 'internet' ? st.net : st.cel, novo = k.id !== p.dataset.plano; if (novo && s === 'internet') st.net.op = 0; k.id = p.dataset.plano;
          $$('[data-plano]', tr).forEach((x) => { const on = x === p; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; }); centra(p);
          if (novo || !$('.pn', el)) { pintaPainel(true); if (gs) { gs.fromTo(p, { scale: .96 }, { scale: 1, duration: .5, ease: 'back.out(3)', clearProps: 'transform' }); gs.fromTo($('.pc__b i', p), { scale: 0 }, { scale: 1, duration: .45, ease: 'back.out(3)', clearProps: 'all' }); } }
          botao(); atualiza();
        } else if (a) { st.net.op = +a.dataset.op; pintaPainel(); const pp = pNet(), oo = pp.opcoes[opNet(pp)], cd = $('.pc[aria-checked=true]', tr); if (cd) { $('.pr', cd).outerHTML = preco(c(oo.preco), '/mês'); $('.cbk', cd).outerHTML = chipCb(cbk(c(oo.preco), 50)); const sx2 = $('.pc__f > s', cd); if (sx2) sx2.textContent = 'De ' + brl(c(oo.de || pp.de)); } const f = $(`[data-op="${st.net.op}"]`, el); f.focus({ preventScroll: true }); if (gs) gs.fromTo($('img,.ap__i', f), { scale: .7 }, { scale: 1, duration: .4, ease: 'back.out(3)', clearProps: 'all' }); botao(); atualiza(); }
        else if (l) { st.cel.n = limita(st.cel.n + +l.dataset.l, 1, maxLinhas()); pintaPainel(); const f = $(`[data-l="${l.dataset.l}"]`, el); (f.disabled ? $(`[data-l="${-l.dataset.l}"]`, el) : f).focus({ preventScroll: true }); if (gs) gs.fromTo($('.qtd output', el), { scale: 1.5 }, { scale: 1, duration: .35, ease: 'back.out(3)', clearProps: 'all' }); botao(); atualiza(); }
        else if (sx) tr.scrollBy({ left: +sx.dataset.seta * tr.clientWidth * .75, behavior: calmo ? 'instant' : 'smooth' });
        else if (e.target.closest('[data-todos]')) { st.todosNet = true; refaz(); centra($('[data-plano="2000"]', el)); $('[data-plano="2000"]', el).focus({ preventScroll: true }); }
        else if (ch) { const i = $('[data-conta]', el); i.value = DY.formatarReais(ch.dataset.chip); sim(); rola($('[data-sim-out]', el), 'nearest'); }
        else if (e.target.closest('[data-pular]')) { delete st.ok[s]; st.sel = st.sel.filter((x) => x !== s); if (!st.sel.length) { if (st.editando) { st.editando = false; mostra('resumo'); } else { st.idx = 0; mostra('servicos', { volta: true }); } return; } if (st.editando) return segue(); st.idx--; segue(); }
      };
      const i = $('[data-conta]', el); let tm;
      function sim() {
        st.luz.conta = DY.lerReais(i.value); const r = E.simular(st.luz.conta), ok = r.elegivel, w = $('[data-sm]', el), O = (k) => $(`[data-o="${k}"]`, w); $$('[data-chip]', el).forEach((x) => x.setAttribute('aria-pressed', +x.dataset.chip === st.luz.conta));
        w.classList.toggle('is-ok', ok); const t = ok ? `Seu desconto é de <b>${r.pct}%</b>` : 'Seu desconto aparece aqui'; if (O('p').innerHTML !== t) { O('p').innerHTML = t; if (gs && ok) gs.fromTo($('b', O('p')), { scale: .4 }, { scale: 1, duration: .5, ease: 'back.out(3)', clearProps: 'all' }); }
        contaAte(O('de'), ok ? r.conta : 0); contaAte(O('nova'), ok ? r.comDesconto : 0); contaAte(O('mes'), ok ? r.economiaMes : 0); contaAte(O('ano'), ok ? r.economiaMes * 12 : 0); contaAte(O('cb'), ok ? r.cashback : 0); O('bar').style.width = (ok ? 100 - r.pct : 100) + '%';
        clearTimeout(tm); const m = $('[data-sm-m]', w), baixa = st.luz.conta && !ok; m.textContent = ''; if (baixa) tm = setTimeout(() => (m.textContent = `O desconto vale para contas a partir de R$ ${E.minimo}.`), 700);
        botao(); atualiza();
      }
      if (i) { i.addEventListener('input', () => { const resto = i.value.length - i.selectionStart; i.value = DY.formatarReais(i.value); const x = Math.max(0, i.value.length - resto); i.setSelectionRange(x, x); sim(); }); i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { i.blur(); rola($('[data-sim-out]', el)); } }); if (st.luz.conta) sim(); }
    },
  };
  function segue() {
    if (st.editando) { st.editando = false; return mostra('resumo'); }
    if (st.idx < st.sel.length - 1) { st.idx++; mostra('produto'); } else mostra('resumo');
  }

  /* ========== 5. RESUMO ========== */
  T.resumo = {
    html() {
      const fora = ORDEM.filter((s) => !st.ok[s] && st.disp[s] !== 'nao');
      return `${cab('Confira o seu pedido', 'Se precisar, altere, adicione ou remova um serviço.', { img: '/img/3d-g/cashback.webp' })}<div class="cx-r">${htmlResumo()}</div>
      ${fora.length ? `<section class="mais"><h2>Quer incluir mais algum?</h2>${fora.map((s) => `<button type="button" data-editar="${s}" data-s="${S[s].k}"><img src="${S[s].img}" alt=""><span><b>${S[s].t}</b><small>Cashback de ${S[s].cb}${s === 'celular' ? ' · CNPJ e MEI' : ''}</small></span><i aria-hidden="true">+</i></button>`).join('')}</section>` : ''}
      <p class="nota">Nada é cobrado agora. A equipe tira as suas dúvidas no WhatsApp antes de qualquer contrato.</p>`;
    },
    bt: () => (itens().length ? 'Continuar' : 'Escolha um serviço'), pode: () => !!itens().length, ir: () => mostra('contato'),
  };

  /* ========== 6. CONTATO · 7. DADOS ========== */
  const MIN = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  const nomeProprio = (v) => { let k = 0; return v.replace(/^\s+/, '').replace(/\s{2,}/g, ' ').replace(/[^\s]+/g, (w) => { const l = w.toLocaleLowerCase('pt-BR'); return k++ && MIN.has(l) ? l : l.charAt(0).toLocaleUpperCase('pt-BR') + l.slice(1); }); };
  T.contato = {
    html: () => `${cab('Qual é o seu nome e WhatsApp?', 'É pelo WhatsApp que a gente finaliza o pedido com você.', { img: '/img/3d-g/conversa.webp' })}<form class="cx-f" data-form novalidate>${campo('nome', 'Nome completo', 'autocomplete="name" autocapitalize="words" maxlength="80"', st.nome)}${campo('tel', 'Celular com WhatsApp', 'type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="15"', mascara.telefone(st.tel))}<button hidden></button></form><p class="nota">Usamos o seu contato só para falar deste pedido.</p>`,
    bt: () => 'Continuar', pode: () => !validar.nome(st.nome) && !validar.telefone(st.tel),
    ir() { st.nome = st.nome.trim(); mostra('dados'); },
    liga(el) { liga('nome', { masc: nomeProprio, val: validar.nome, guarda: (v) => (st.nome = v) }); liga('tel', { masc: mascara.telefone, val: validar.telefone, guarda: (v) => (st.tel = v) }); $('[data-form]', el).addEventListener('submit', (e) => { e.preventDefault(); acao(); }); },
  };
  // em qual documento fica cada contrato
  const noDoc = (d) => itens().filter((i) => i.titular === d).map((i) => S[i.produto].de);
  T.dados = {
    html: () => `${cab('Dados para o contrato', 'Assim você não precisa repetir tudo no WhatsApp.', { img: '/img/3d-g/escudo.webp' })}<form class="cx-f" data-form novalidate>${campo('email', 'E-mail', 'type="email" inputmode="email" autocomplete="email" autocapitalize="none" maxlength="120"', st.email)}${campo('cpf', noDoc('cpf').length ? 'CPF do titular' : 'CPF do responsável', 'inputmode="numeric" autocomplete="off" maxlength="14"', mascara.cpf(st.cpf), noDoc('cpf').length ? `Para o contrato ${junta(noDoc('cpf'))}.` : 'De quem responde pela empresa.')}${precisaCnpj() ? campo('cnpj', 'CNPJ', 'inputmode="numeric" autocomplete="off" maxlength="18"', mascara.cnpj(st.cnpj), `Para o contrato ${junta(noDoc('cnpj'))}.`) : ''}
      <label class="aceite"><input type="checkbox" data-aceite${st.aceite ? ' checked' : ''}><i aria-hidden="true"></i><span>Autorizo o uso dos meus dados para este pedido. <a class="link" href="/privacidade" target="_blank" rel="noopener">Política de privacidade</a></span></label><button hidden></button></form><p class="nota">O CPF, o CNPJ e o e-mail não ficam salvos neste aparelho.</p>`,
    bt: () => (tem('internet') ? 'Continuar' : 'Gerar meu pedido'), pode: () => !validar.email(st.email) && !validar.cpf(st.cpf) && (!precisaCnpj() || !validar.cnpj(st.cnpj)) && st.aceite,
    ir: () => (tem('internet') ? mostra('pagamento') : gera()),
    liga(el) { liga('email', { val: validar.email, guarda: (v) => (st.email = v.trim().toLowerCase()) }); liga('cpf', { masc: mascara.cpf, val: validar.cpf, guarda: (v) => (st.cpf = so(v)) }); liga('cnpj', { masc: mascara.cnpj, val: validar.cnpj, guarda: (v) => (st.cnpj = so(v)) }); $('[data-aceite]', el).addEventListener('change', (e) => { st.aceite = e.target.checked; botao(); }); $('[data-form]', el).addEventListener('submit', (e) => { e.preventDefault(); acao(); }); },
  };

  /* ========== 8. PAGAMENTO (só internet fibra) ========== */
  T.pagamento = {
    html() {
      const i = itens().find((x) => x.produto === 'internet'), mais = DY.boletoPix * 100, n = st.nome.split(/\s+/)[0];
      return `${cab(`${esc(n)}, como prefere pagar a internet?`, 'Nada é cobrado agora.', { img: '/img/3d-g/calendario.webp' })}
      <section class="bl">${`<div class="ops ops--p" role="radiogroup" aria-label="Forma de pagamento" data-pag>${[['debito', 'Débito em conta', 'Sai da sua conta no vencimento', i.mensal, 'Melhor preço'], ['boleto', 'Boleto ou PIX', `${brl(mais)} a mais por mês`, i.mensal + mais, '']].map(([k, t, s, v, tag]) => `<button type="button" role="radio" aria-checked="${st.pag.tipo === k}" tabindex="${st.pag.tipo === k ? 0 : -1}" data-v="${k}"><span><b>${t}</b><small>${s}</small>${tag ? `<em>${tag}</em>` : ''}</span><strong>${brl(v)}<small>/mês</small></strong></button>`).join('')}</div>`}</section>
      <section class="bl" data-bancos${st.pag.tipo === 'debito' ? '' : ' hidden'}><h2>Qual é o seu banco?</h2><div class="bancos" role="radiogroup" aria-label="Banco">${DY.bancosDebito.map(([, b], k) => `<button type="button" role="radio" aria-checked="${st.pag.banco === b}" tabindex="${st.pag.banco === b || (!st.pag.banco && !k) ? 0 : -1}" data-banco="${b}">${b}</button>`).join('')}</div><p class="nota">Seu banco não está na lista? Escolha boleto ou PIX. A conta e a agência são combinadas no WhatsApp.</p></section>
      <p class="nota">A primeira fatura vem cerca de 30 dias depois da instalação. O Cashback é o mesmo nas duas formas.</p>`;
    },
    bt: () => (T.pagamento.pode() ? 'Gerar meu pedido' : 'Escolha o seu banco'), pode: () => st.pag.tipo === 'boleto' || !!st.pag.banco, ir: () => gera(),
    liga(el) {
      const marca = (b) => $$('[role=radio]', b.parentElement).forEach((x) => { x.setAttribute('aria-checked', x === b); x.tabIndex = x === b ? 0 : -1; });
      el.onclick = (e) => {
        if (tela !== 'pagamento') return; const p = e.target.closest('[data-pag] [data-v]'), b = e.target.closest('[data-banco]');
        if (p) { st.pag.tipo = p.dataset.v; marca(p); if (gs) gs.fromTo(p, { scale: .97 }, { scale: 1, duration: .4, ease: 'back.out(3)', clearProps: 'all' }); $('[data-bancos]', el).hidden = st.pag.tipo !== 'debito'; } else if (b) { st.pag.banco = b.dataset.banco; marca(b); } else return; botao(); atualiza();
      };
    },
  };

  /* ========== 9. PEDIDO ========== */
  function montaPedido() {
    const l = itens(), utm = {}; ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'fbclid'].forEach((k) => q.get(k) && (utm[k] = q.get(k)));
    const { travado, ...end } = st.end;
    return { id: st.id, etapa: 'pedido_criado', origem: st.origem, pagina: st.pagina, botao: st.botao, atualizado_em: new Date().toISOString(), endereco: end, fibra_viabilidade: st.fibra, itens: l.map(({ linhaZap, antes, ...r }) => r), cashback_total_centavos: soma(l, (i) => i.cashback), nome: st.nome, telefone: so(st.tel), email: st.email, cpf: st.cpf, cnpj: precisaCnpj() ? st.cnpj : '', consentimento: st.aceite, pagamento: tem('internet') ? { tipo: st.pag.tipo, banco: st.pag.tipo === 'debito' ? st.pag.banco : '', mensal_centavos: mes(l.find((i) => i.produto === 'internet')) } : null, utm };
  }
  // carregando → confirmação
  T.gerando = {
    html: () => `<div class="ger"><div class="ger__a" aria-hidden="true"><svg viewBox="0 0 160 160"><circle class="f" cx="80" cy="80" r="70"/><circle class="p" cx="80" cy="80" r="70"/><path d="M50 83l21 21 40-44"/></svg><div class="ger__i">${itens().map((i) => `<img src="${S[i.produto].img}" alt="">`).join('')}</div></div><h1 data-gt aria-live="polite">Juntando os seus serviços</h1><p>Só um instante.</p></div>`,
    async liga(el) {
      const w = $('.ger', el), p = $('.p', el), t = $('[data-gt]', el), im = $$('.ger__i img', el), fases = [[34, 'Juntando os seus serviços'], [70, 'Somando o seu Cashback'], [100, 'Gerando o número do pedido']];
      const salva = DY.salvarPedido(montaPedido());
      for (let k = 0; k < 3; k++) { p.style.strokeDashoffset = 440 * (1 - fases[k][0] / 100); t.textContent = fases[k][1]; im.forEach((x, j) => x.classList.toggle('on', j === k % im.length)); await espera(850); }
      await Promise.race([salva, espera(6000)]); if (tela !== 'gerando') return;
      w.classList.add('is-ok'); t.textContent = 'Pedido gerado!'; $('p', w).textContent = 'Pedido ' + st.id; confete($('.ger__a', el));
      await espera(1500); if (tela !== 'gerando') return;
      try { sessionStorage.removeItem('dy_endereco'); } catch (e) { /* */ }
      mostra('fim');
    },
  };
  function gera() { if (tela !== 'gerando' && tela !== 'fim') mostra('gerando', { empurra: false }); }
  const formaPg = () => (st.pag.tipo === 'boleto' ? 'Boleto ou PIX' : `Débito em conta (${st.pag.banco})`);
  T.fim = {
    html() {
      const l = itens(), msg = DY.mensagemPedido({ id: st.id, itens: l }).replace('Meu pedido é', (tem('internet') ? `Pagamento da internet: ${formaPg()}\n` : '') + 'Meu pedido é');
      T.fim.msg = msg; const zap = esc(DY.linkWhatsApp(msg)), bt = `<a class="bt bt--zap" href="${zap}" target="_blank" rel="noopener"><img src="/img/icones/whatsapp-branco.svg" alt="" width="24" height="24">Enviar no WhatsApp</a>`;
      const so1 = l.length === 1 && l[0].produto, passo = [
        ['Envie o pedido pelo WhatsApp', 'A mensagem já vai pronta, com o número do pedido.', 'conversa'], ['Tire as suas dúvidas', 'Um atendente responde tudo antes de qualquer contrato.', 'info'],
        ...(tem('internet') ? [['Agende a instalação', 'Enviamos as datas disponíveis para você escolher.', 'calendario']] : []),
        ...(tem('internet') || tem('energia') ? [['Confirme pelo link', `${so1 ? 'Você revisa e confirma' : 'Na internet e na energia, você revisa e confirma'} o contrato com biometria.`.replace('Na internet e na energia', tem('internet') && tem('energia') ? 'Na internet e na energia' : tem('internet') ? 'Na internet' : 'Na energia'), 'escudo']] : []),
        ...(tem('celular') ? [['Receba e ative o chip', 'Enviamos o chip para todo o Brasil.', 'celular']] : []),
        ['Receba o seu Cashback', `Via PIX na sua conta bancária, em até 7 dias ${l.length > 1 ? 'depois de cada etapa:' : S[l[0].produto].marco + '.'}</span>${l.length > 1 ? `<ul class="fim__m">${l.map((i) => `<li data-s="${S[i.produto].k}"><b>${S[i.produto].curto}</b>${{ energia: 'biometria do contrato', internet: 'instalação', celular: 'chip ativado' }[i.produto]}</li>`).join('')}</ul>` : ''}<span>`, 'cashback']];
      return `<div class="fim"><div class="fim__ck">${CHECK}</div><p class="fim__n">Pedido <b>${st.id}</b></p><h1>Pedido pronto! Falta enviar.</h1><p>Toque no botão e envie a mensagem. Um atendente continua com você.</p>${bt}
        <p class="fim__c"><button class="link" type="button" data-copia>Copiar a mensagem</button><span>Não abriu? Mande para ${DY.config.whatsappExibicao}</span></p></div>
        <div class="fim__g"><section class="cx-r fim__r"><h2>Resumo do pedido</h2>${htmlResumo({ editar: false })}</section>
        <section class="fim__s"><h2>Pedido feito. E agora?</h2><ol class="fim__p">${passo.map(([t, s, im], i) => `<li><i aria-hidden="true">${i + 1}</i><div><b>${t}</b><span>${s}</span>${i ? '' : bt}</div><img src="/img/3d-g/${im}.webp" alt=""></li>`).join('')}</ol></section></div><p class="fim__h"><a class="link" href="/">Voltar para o início</a></p>`;
    },
    liga(el) {
      $('[data-copia]', el).addEventListener('click', async (e) => { const b = e.currentTarget; try { await navigator.clipboard.writeText(T.fim.msg); b.textContent = 'Mensagem copiada'; } catch (x) { b.textContent = 'Não deu para copiar. Use o botão verde.'; } });
      contaAte($('[data-cbt]', el), soma(itens(), (i) => i.cashback));
      const li = $$('.fim__p li', el); if (gs && 'IntersectionObserver' in window) { gs.set(li, { x: 40, autoAlpha: 0 }); const ob = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { ob.unobserve(e.target); gs.to(e.target, { x: 0, autoAlpha: 1, duration: .5, ease: 'power3.out', clearProps: 'all' }); } }), { threshold: .2 }); li.forEach((x) => ob.observe(x)); }
    },
  };

  /* ---------- janelas e cliques gerais ---------- */
  const jan = (k) => $(`[data-jan="${k}"]`); let tirar = '';
  $('[data-jan-cb]').innerHTML = `<p>Uma parte do valor volta para você, uma única vez, via PIX na sua conta bancária.</p><ul class="cbl">${ORDEM.map((s) => `<li data-s="${S[s].k}"><img src="${S[s].img}" alt=""><span><b>${S[s].curto}</b>${S[s].cb}<small>Em até 7 dias ${S[s].marco}</small></span></li>`).join('')}</ul><p>A conta é feita sobre o preço no débito em conta. A chave PIX é pedida no WhatsApp.</p>`;
  const edita = (s) => { $$('dialog[open]').forEach((d) => d.close()); st.sel = ORDEM.filter((x) => x === s || st.sel.includes(x)); st.idx = st.sel.indexOf(s); st.editando = tela !== 'produto' || ORDEM.filter((x) => st.ok[x]).length === st.sel.length; mostra('produto'); };
  document.addEventListener('click', (e) => {
    const t = e.target, ed = t.closest('[data-editar]'), rm = t.closest('[data-remover]');
    if (t.closest('[data-volta]')) history.back();
    else if (ed) edita(ed.dataset.editar);
    else if (rm) { tirar = rm.dataset.remover; $('[data-jan-txt]').textContent = itens().find((i) => i.produto === tirar).titulo; jan('remover').showModal(); }
    else if (t.closest('[data-sim]') && t.closest('[data-jan]')) { delete st.ok[tirar]; st.sel = st.sel.filter((s) => s !== tirar); $$('dialog[open]').forEach((d) => d.close()); if (!itens().length) { st.idx = 0; st.editando = false; mostra('servicos'); } else if (tela === 'produto') { if (!st.sel.length || !st.sel[st.idx]) mostra('resumo'); else { st.idx = Math.min(st.idx, st.sel.length - 1); mostra('produto', { empurra: false }); } } else if (tela === 'resumo') mostra('resumo', { empurra: false }); else { if (tela === 'pagamento' && !tem('internet')) mostra('dados'); else mostra(tela, { empurra: false }); } }
    else if (t.closest('[data-alterar]')) mostra('resumo', { volta: true });
    else if (t.closest('[data-cb]')) jan('cashback').showModal();
    else if (t.closest('[data-abrir-resumo]')) jan('resumo').showModal();
    else if (t.closest('[data-fechar]') || t.tagName === 'DIALOG') t.closest('dialog').close();
  });
  document.addEventListener('keydown', (e) => {
    const b = e.target.closest('[role=radio]'), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!b || !d) return; e.preventDefault();
    const g = b.closest('[role=radiogroup]'), l = $$('[role=radio]', g).filter((x) => x.closest('[role=radiogroup]') === g); const n = l[(l.indexOf(b) + d + l.length) % l.length]; n.focus({ preventScroll: true }); n.click();
  });
  $('[data-zap]').href = DY.linkWhatsApp('Olá! Estou contratando pelo site da Do Yourself e fiquei com uma dúvida.');
  mostra('endereco', { empurra: false });
})();
