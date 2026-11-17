/* Do Yourself v2 — página inicial: menu, campo de CEP, simulador de energia, cards de planos, combo e animações (GSAP) */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const temGsap = !!window.gsap && !reduz;
  const c = (v) => Math.round(v * 100);
  const brl = (v) => DY.brl(c(v));
  const partes = (v) => { const [i, d] = v.toFixed(2).split('.'); return { i: i.replace(/\B(?=(\d{3})+(?!\d))/g, '.'), d }; };
  const cb = (v, pct) => DY.cashbackCentavos(c(v), pct);

  /* ---------- WhatsApp com mensagem pronta ---------- */
  $$('[data-zap]').forEach((a) => { a.href = DY.linkWhatsApp(a.dataset.zap); a.target = '_blank'; a.rel = 'noopener'; });

  /* ---------- Menu do celular: "Menu" e "Fechar" escritos ---------- */
  const nav = $('.nav'), tg = $('.nav__toggle');
  const bars = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const cross = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const rotulo = () => { if (!tg) return; const ab = nav.classList.contains('is-open'); const html = (ab ? cross : bars) + '<span>' + (ab ? 'Fechar' : 'Menu') + '</span>'; if (tg.innerHTML !== html) tg.innerHTML = html; tg.setAttribute('aria-label', ab ? 'Fechar o menu' : 'Abrir o menu'); };
  if (nav) { new MutationObserver(rotulo).observe(nav, { attributes: true, attributeFilter: ['class'] }); new MutationObserver(() => setTimeout(rotulo)).observe(tg, { childList: true }); rotulo(); }

  /* ---------- Rodapé: colunas abrem no celular ---------- */
  const cols = $$('.rod__col');
  const ajustaCols = () => { const pc = matchMedia('(min-width: 768px)').matches; cols.forEach((d) => { if (pc) d.open = true; }); };
  if (!matchMedia('(min-width: 768px)').matches) cols.forEach((d) => (d.open = false));
  addEventListener('resize', ajustaCols);

  /* ---------- Campo de CEP (com "Não sei meu CEP": estado, cidade e rua) ---------- */
  const mascara = (v) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  $$('[data-cep]').forEach((f) => {
    const inCep = $('[name=cep]', f), inNum = $('[name=numero]', f), erro = $('.cep__erro', f);
    const busca = $('.cep__busca', f), selUf = $('[data-uf]', f), inCid = $('[data-cidade]', f), lista = $(`#${inCid.getAttribute('list')}`), inRua = $('[data-rua]', f), res = $('.cep__res', f);
    inCep.addEventListener('input', () => { inCep.value = mascara(inCep.value); });
    Object.entries(DY.UFS).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR')).forEach(([uf, n]) => selUf.add(new Option(n, uf)));
    selUf.value = DY.uf;
    $('.cep__nao', f).addEventListener('click', () => { busca.hidden = !busca.hidden; if (!busca.hidden) { carregaCidades(); inCid.focus(); } });
    let cidadesUf = '';
    async function carregaCidades() {
      if (cidadesUf === selUf.value) return; cidadesUf = selUf.value; lista.innerHTML = '';
      try { const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selUf.value}/municipios?orderBy=nome`); (await r.json()).forEach((m) => lista.append(new Option(m.nome))); } catch (e) { /* sem rede: digita livre */ }
    }
    selUf.addEventListener('change', () => { inCid.value = ''; carregaCidades(); });
    $('[data-buscar]', f).addEventListener('click', async () => {
      erro.textContent = ''; res.innerHTML = '';
      const cid = inCid.value.trim(), rua = inRua.value.trim();
      if (!cid || rua.length < 3) { erro.textContent = 'Escreva a cidade e pelo menos 3 letras do nome da rua.'; return; }
      res.innerHTML = '<li><small>Procurando…</small></li>';
      try {
        const l = await (await fetch(`https://viacep.com.br/ws/${selUf.value}/${encodeURIComponent(cid)}/${encodeURIComponent(rua)}/json/`)).json();
        if (!Array.isArray(l) || !l.length) { res.innerHTML = ''; erro.textContent = 'Não achamos essa rua. Confira a cidade e o nome da rua.'; return; }
        res.innerHTML = '';
        l.slice(0, 12).forEach((e) => { const li = document.createElement('li'); const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `${e.logradouro}<small>${[e.complemento, e.bairro].filter(Boolean).join(' · ')} · CEP ${e.cep}</small>`;
          b.addEventListener('click', () => { inCep.value = e.cep; busca.hidden = true; res.innerHTML = ''; inNum.focus(); }); li.append(b); res.append(li); });
      } catch (e) { res.innerHTML = ''; erro.textContent = 'Não foi possível buscar agora. Tente de novo ou fale no WhatsApp.'; }
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault(); erro.textContent = '';
      const cep = inCep.value.replace(/\D/g, ''), num = inNum.value.trim();
      if (cep.length !== 8) { erro.textContent = 'Escreva o CEP com 8 números, por exemplo 80000-000.'; inCep.focus(); return; }
      if (!num) { erro.textContent = 'Escreva o número do imóvel (ou S/N se não tiver).'; inNum.focus(); return; }
      location.href = `/contratar?origem=${f.dataset.cep || 'home'}&cep=${cep.replace(/^(\d{5})/, '$1-')}&numero=${encodeURIComponent(num)}`;
    });
  });

  /* ---------- Simulador de energia ---------- */
  const sim = $('[data-sim]');
  if (sim) {
    const rng = $('input[type=range]', sim), val = $('[data-sim-valor]', sim), chips = $$('[data-v]', sim);
    const out = { mes: $('[data-out=mes]', sim), ano: $('[data-out=ano]', sim), cb: $('[data-out=cb]', sim) };
    const btn = $('[data-sim-ir]', sim);
    const conta = { v: 500 };
    function pinta(v) {
      const s = DY.energia.simular(v);
      val.textContent = partes(v).i;
      if (!s.elegivel) { out.mes.textContent = '—'; out.ano.textContent = '—'; out.cb.textContent = 'a partir de R$ 150'; return; }
      out.mes.textContent = DY.brl(s.economiaMes); out.ano.textContent = DY.brl(s.economiaMes * 12); out.cb.textContent = DY.brl(s.cashback);
      chips.forEach((b) => b.classList.toggle('is-on', +b.dataset.v === v));
      btn.href = `/contratar?origem=energia&conta=${v}`;
    }
    rng.addEventListener('input', () => pinta(+rng.value));
    chips.forEach((b) => b.addEventListener('click', () => {
      const ate = +b.dataset.v;
      if (!temGsap) { rng.value = ate; pinta(ate); return; }
      conta.v = +rng.value; gsap.to(conta, { v: ate, duration: .6, ease: 'power3.out', onUpdate: () => { const r = Math.round(conta.v / 10) * 10; rng.value = r; pinta(r); }, onComplete: () => { rng.value = ate; pinta(ate); } });
    }));
    pinta(+rng.value);
  }

  /* ---------- Cards de plano ---------- */
  const APPS = { 'youtube-premium': '/img/apps/youtube-premium-logo.svg', paramount: '/img/apps/paramount-44.svg', 'hbo-max': '/img/apps/hbo-max.png', globoplay: '/img/apps/globoplay.png', whatsapp: '/img/apps/whatsapp.svg' };
  const precoHtml = (v, id) => { const { i, d } = partes(v); return `<p class="pc__preco"><small>R$</small><b data-num data-v="${v}" data-id="${id}">${i}</b><i>,${d}</i><em>/mês</em></p>`; };
  function cardCel(p) {
    const dest = p.selo === 'OFERTA DO MÊS';
    const link = `/contratar?origem=celular&para=cnpj&plano=${encodeURIComponent(p.id)}&linhas=1`;
    const zero = (p.apps || []).length > 3 ? 'WhatsApp, Waze, Facebook e Instagram sem gastar a internet' : 'WhatsApp e Waze sem gastar a internet';
    return `<article class="pc pc--cel${dest ? ' is-dest' : ''}" data-id="${p.id}">
      <span class="pc__selo">${p.selo}</span>
      <p class="pc__vel"><b>${p.gb}</b><span>GB</span></p>
      <p class="pc__sub">${p.plano} GB do plano + ${p.bonus} GB de bônus</p>
      <p class="pc__hook"><img src="/img/apps/whatsapp.svg" alt=""><span>${zero}</span></p>
      <div class="pc__pe">${precoHtml(p.preco, 'c' + p.id)}
      <p class="pc__cb">${DY.brl(cb(p.preco, 100))} de volta no PIX</p>
      <a class="pc__btn" href="${link}">Quero este plano</a></div></article>`;
  }

  // trilho: setas no desktop quando sobra card, pontos e dica no celular
  function trilho(el) {
    const cards = $('.cards', el), pontos = $('.pontos', el), dica = $('.dica', el);
    const [ant, prox] = $$('.trilho__setas button', el);
    const passo = () => (cards.querySelector('.pc')?.offsetWidth || 280) + 20;
    ant && ant.addEventListener('click', () => cards.scrollBy({ left: -passo(), behavior: 'smooth' }));
    prox && prox.addEventListener('click', () => cards.scrollBy({ left: passo(), behavior: 'smooth' }));
    let t;
    const estado = () => {
      const max = cards.scrollWidth - cards.clientWidth - 2;
      el.classList.toggle('tem-mais', max > 4);
      if (ant) { ant.disabled = cards.scrollLeft <= 2; prox.disabled = cards.scrollLeft >= max; }
      const meio = cards.scrollLeft + cards.clientWidth / 2; let k = 0, dist = 1e9;
      $$('.pc', cards).forEach((p, i) => { const d = Math.abs(p.offsetLeft + p.offsetWidth / 2 - meio); if (d < dist) { dist = d; k = i; } });
      if (max > 4 && cards.scrollLeft >= max - 2) k = $$('.pc', cards).length - 1; // no fim do trilho, o último ponto acende
      $$('button', pontos).forEach((b, i) => b.classList.toggle('is-on', i === k));
    };
    cards.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(estado, 60); if (dica && cards.scrollLeft > 30) dica.style.visibility = 'hidden'; }, { passive: true });
    pontos.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const p = $$('.pc', cards)[+b.dataset.i]; cards.scrollTo({ left: p.offsetLeft - (cards.clientWidth - p.offsetWidth) / 2, behavior: 'smooth' }); });
    addEventListener('resize', estado);
    return {
      desenhou() {
        pontos.innerHTML = $$('.pc', cards).map((_, i) => `<button type="button" data-i="${i}" aria-label="Plano ${i + 1}"></button>`).join('');
        // no celular e no tablet, o plano em destaque começa no meio da tela
        requestAnimationFrame(() => { const d = $('.pc.is-dest', cards); if (d && matchMedia('(max-width: 1123px)').matches) cards.scrollLeft = d.offsetLeft - (cards.clientWidth - d.offsetWidth) / 2; else cards.scrollLeft = 0; estado(); });
      },
    };
  }

  // contagem do preço antigo até o novo
  function contar(raiz, antigos) {
    $$('[data-num]', raiz).forEach((el) => {
      const de = antigos[el.dataset.id], ate = +el.dataset.v; if (de == null || de === ate) return;
      (el.closest('.pc__preco') || el.parentElement).classList.add('is-mudou');
      if (!temGsap) return;
      const o = { v: de }; gsap.to(o, { v: ate, duration: .7, ease: 'power3.out', onUpdate: () => (el.textContent = (el.closest('.ep') ? 'R$ ' : '') + partes(o.v).i + (el.closest('.ep') ? ',' + partes(o.v).d : '')), onComplete: () => (el.textContent = el.closest('.ep') ? brl(ate) : partes(ate).i) });
    });
  }
  const aviso = $('.aviso'); let tAviso;
  const avisar = (m) => { aviso.textContent = m; aviso.classList.add('is-on'); clearTimeout(tAviso); tAviso = setTimeout(() => aviso.classList.remove('is-on'), 2800); };

  /* internet: cards de casa (sem o 1000 e o 2000), o 1000 Mega em destaque e a lista para empresas */
  const V1 = 'https://doyourself-site.vercel.app';
  const DET = { '500': '/internet-fibra/casa/500-mega', '600': '/internet-fibra/casa/600-mega', '800': '/internet-fibra/casa/800-mega', '1000': '/internet-fibra/casa/1-giga' };
  const LOGO = { 'GloboPlay': ['/img/apps/globoplay.png', 'Globoplay'], 'Paramount+': ['/img/apps/paramount-44.svg', 'Paramount+'], 'HBO Max': ['/img/apps/hbo-max.png', 'HBO Max'], 'YouTube Premium': ['/img/apps/youtube-premium-logo.svg', 'YouTube Premium'], 'Somente Internet': ['/img/3d/controle.webp', 'Internet + NoPing'] };
  const escolha = {}; // plano -> índice da opção
  const net = $('[data-net]');
  const tNet = trilho(net);
  const casa = () => DY.catalogo.casa[DY.blocoInternet(DY.uf)];
  const emp = () => DY.catalogo.empresa[DY.blocoInternet(DY.uf)];
  const opIdx = (p) => {
    if (escolha[p.id] != null && p.opcoes[escolha[p.id]]) return escolha[p.id];
    if (p.id === '600') { const k = p.opcoes.findIndex((o) => o.nome === 'Paramount+'); return k < 0 ? 0 : k; }
    return 0;
  };
  // ordem dos streamings no card do 600: Globoplay primeiro
  const opsVisiveis = (p) => {
    // streamings em ordem crescente de preço; no 600, só os streamings (o 'somente internet' tem o mesmo preço do Paramount+)
    let ks = p.opcoes.map((_, k) => k);
    if (p.id === '600') ks = ks.filter((k) => p.opcoes[k].nome !== 'Somente Internet');
    return ks.sort((a, b) => p.opcoes[a].preco - p.opcoes[b].preco);
  };
  const linkContratar = (p, tipo) => `/contratar?origem=internet&para=${tipo}&plano=${encodeURIComponent(p.id)}&opcao=${encodeURIComponent(p.opcoes[opIdx(p)].nome)}`;
  const tile = (p, k, fixo) => {
    const o = p.opcoes[k]; const [src, nome] = LOGO[o.nome] || ['', o.nome]; const on = opIdx(p) === k;
    return `<button type="button" class="op${on ? ' is-on' : ''}${fixo ? ' op--fixo' : ''}" role="radio" aria-checked="${on}" data-op="${k}" data-id="${p.id}" ${fixo ? 'tabindex="-1"' : ''}>
      <span class="op__ic"><img src="${src}" alt=""></span><span class="op__n">${nome}</span>${fixo ? '' : `<small>${brl(o.preco)}</small>`}<i class="op__ok" aria-hidden="true"></i></button>`;
  };
  function areaOpcoes(p) {
    if (p.id === '800') return `<div class="pc__op"><p class="pc__op-t">Aplicativo incluso</p><div class="ops ops--1">${tile(p, 0, true)}</div></div>`;
    if (p.opcoes.length > 1) return `<div class="pc__op"><p class="pc__op-t">Selecione seu streaming</p><div class="ops" role="radiogroup" aria-label="Streaming do plano de ${p.num} Mega">${opsVisiveis(p).map((k) => tile(p, k)).join('')}</div></div>`;
    return `<div class="pc__op"><p class="pc__op-t">Somente internet</p><p class="pc__op-vazio">Modem Wi-Fi e instalação grátis inclusos. Sem streaming.</p></div>`;
  }
  function cardNet(p) {
    const o = p.opcoes[opIdx(p)];
    const up = (p.detalhes.find((d) => d[1] === 'Upload') || [])[2];
    return `<article class="pc" data-id="${p.id}">
      <span class="pc__selo">${p.selo}</span>
      <p class="pc__vel"><b>${p.num}</b><span>Mega</span></p>
      <p class="pc__sub">Upload de ${up}</p>
      ${areaOpcoes(p)}
      <div class="pc__pe"><p class="pc__de">De ${brl(o.de || p.de)}</p>${precoHtml(o.preco, p.id)}
      <p class="pc__cb" data-cb-id="${p.id}">${DY.brl(cb(o.preco, 50))} de volta no PIX</p>
      <a class="pc__btn" data-ir="${p.id}" href="${linkContratar(p, 'casa')}">Quero este plano</a>
      ${DET[p.id] ? `<a class="pc__det" href="${V1 + DET[p.id]}">Ver detalhes do plano</a>` : '<span class="pc__det pc__det--vazio"></span>'}</div></article>`;
  }
  function blocoMil(p) {
    const box = $('[data-mil]'); if (!p) { box.hidden = true; return; }
    const o = p.opcoes[opIdx(p)];
    $('[data-mil-ops]', box).innerHTML = opsVisiveis(p).map((k) => tile(p, k)).join('');
    $('[data-mil-preco]', box).innerHTML = precoHtml(o.preco, p.id).replace('pc__preco', 'pc__preco pc__preco--g');
    $('[data-mil-cb]', box).textContent = `${DY.brl(cb(o.preco, 50))} de volta no PIX`;
    $('[data-mil-de]', box).textContent = 'De ' + brl(o.de || p.de);
    $('[data-mil-ir]', box).href = linkContratar(p, 'casa');
    $('[data-mil-nome]', box).textContent = o.nome === 'Somente Internet' ? 'Internet + NoPing grátis por 6 meses' : `Com ${LOGO[o.nome][1]} incluso`;
  }
  // empresa: o mesmo card da casa, com o que vem no plano no lugar do streaming
  const emp_ = $('[data-emp]'); const tEmp = trilho(emp_);
  const INCLUI = {
    e1000: ['Gestão de equipe externa, 4 licenças', 'Antivírus incluso', 'Modem Wi-Fi 6'],
    e600: ['Antivírus incluso', 'Audiolivros e cursos', 'Modem Wi-Fi 5'],
    e500: ['Audiolivros e cursos', 'Instalação em até 48 horas', 'Modem Wi-Fi 5'],
    e400: ['Antivírus incluso', 'Instalação em até 48 horas', 'Modem Wi-Fi 5'],
    e300: ['Antivírus incluso', 'Instalação em até 48 horas', 'Modem Wi-Fi 5'],
  };
  function cardEmp(p) {
    const o = p.opcoes[0]; const up = (p.detalhes.find((d) => d[1] === 'Upload') || [])[2];
    const dest = p.selo === 'OFERTA DO MÊS';
    return `<article class="pc pc--emp${dest ? ' is-dest' : ''}" data-id="${p.id}">
      <span class="pc__selo">${p.selo}</span>
      <p class="pc__vel"><b>${p.num}</b><span>Mega</span></p>
      <p class="pc__sub">Upload de ${up}</p>
      <div class="pc__op"><p class="pc__op-t">O plano inclui</p><ul class="pc__inc">${(INCLUI[p.id] || []).map((t) => `<li>${t}</li>`).join('')}</ul></div>
      <div class="pc__pe"><p class="pc__de">De ${brl(o.de || p.de)}</p>${precoHtml(o.preco, p.id)}
      <p class="pc__cb">${DY.brl(cb(o.preco, 50))} de volta no PIX</p>
      <a class="pc__btn" href="${linkContratar(p, 'empresa')}">Quero este plano</a></div></article>`;
  }
  function blocoEmp() {
    const lista = emp(); const cards = $('.cards', emp_);
    cards.style.setProperty('--n', lista.length);
    cards.innerHTML = lista.map(cardEmp).join('');
    tEmp.desenhou();
  }
  const precosNet = () => Object.fromEntries([...casa(), ...emp()].map((p) => [p.id, p.opcoes[opIdx(p)].preco]));
  function desenhaNet(anim, antigos) {
    const todos = casa();
    const lista = todos.filter((p) => !['1000', '2000'].includes(p.id));
    const cards = $('.cards', net);
    cards.style.setProperty('--n', lista.length);
    cards.innerHTML = lista.map(cardNet).join('');
    blocoMil(todos.find((p) => p.id === '1000'));
    blocoEmp();
    $$('[data-uf-nome]').forEach((n) => (n.textContent = DY.UFS[DY.uf]));
    $$('[data-uf-sel]').forEach((s) => (s.value = DY.uf));
    tNet.desenhou();
    if (anim) { contar(document, antigos || {}); if (temGsap) gsap.from([...$$('.pc', net), $('[data-mil]'), ...$$('.pc', emp_)], { y: 20, autoAlpha: 0, duration: .5, stagger: .05, ease: 'power3.out', clearProps: 'all' }); }
    const p2 = (todos.find((p) => p.id === '2000') || {}).opcoes;
    if (p2) { $$('[data-2000]').forEach((e) => (e.textContent = brl(p2[0].preco))); }
    const min = Math.min(...todos.map((p) => p.opcoes[0].preco));
    $$('[data-net-min]').forEach((e) => (e.textContent = brl(min)));
  }
  // escolher o streaming: muda o preço, o cashback e o link, com animação
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.op:not(.op--fixo)'); if (!b) return;
    const id = b.dataset.id, k = +b.dataset.op;
    const p = casa().find((x) => x.id === id); if (!p || opIdx(p) === k) return;
    const antes = p.opcoes[opIdx(p)].preco; escolha[id] = k; const o = p.opcoes[k];
    const grupo = b.parentElement;
    $$('.op', grupo).forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', String(on)); });
    if (temGsap) gsap.fromTo(b, { scale: .94 }, { scale: 1, duration: .45, ease: 'back.out(3)' });
    const raiz = id === '1000' ? $('[data-mil]') : b.closest('.pc');
    if (id === '1000') blocoMil(p);
    else {
      raiz.querySelector('.pc__de').textContent = 'De ' + brl(o.de || p.de);
      raiz.querySelector('.pc__cb').textContent = `${DY.brl(cb(o.preco, 50))} de volta no PIX`;
      raiz.querySelector('[data-ir]').href = linkContratar(p, 'casa');
      const num = raiz.querySelector('[data-num]'); num.dataset.v = o.preco;
    }
    contar(raiz, { [id]: antes });
  });
  function trocaNet(fn, msg) {
    const antes = precosNet();
    const sai = () => { fn(); desenhaNet(true, antes); avisar(msg); const ok = $('.regiao__ok'); if (ok) { ok.hidden = false; clearTimeout(ok._t); ok._t = setTimeout(() => (ok.hidden = true), 2600); } };
    if (temGsap) gsap.to([...$$('.pc', net), $('[data-mil]'), ...$$('.pc', emp_)], { y: 14, autoAlpha: 0, duration: .2, stagger: .02, ease: 'power2.in', onComplete: sai }); else sai();
  }
  $$('[data-uf-sel]').forEach((s) => {
    Object.entries(DY.UFS).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR')).forEach(([uf, n]) => s.add(new Option(n, uf)));
    s.addEventListener('change', () => {
      const uf = s.value; try { localStorage.setItem('dy_local', JSON.stringify({ uf, cidade: '' })); } catch (e) { /* sem storage */ }
      trocaNet(() => DY.definirPlanos({ uf }), 'Preços atualizados para ' + DY.UFS[uf]);
      desenhaCel(true);
    });
  });

  /* celular (CNPJ) */
  const cel = $('[data-cel]'); const tCel = trilho(cel);
  const VIT = ['12', '30', '50', '100'];
  let precosCel = {};
  function desenhaCel(anim) {
    const lista = VIT.map((id) => DY.planosCnpj.find((p) => p.id === id)).filter(Boolean);
    const antes = precosCel; precosCel = Object.fromEntries(lista.map((p) => ['c' + p.id, p.preco]));
    $('.cards', cel).innerHTML = lista.map(cardCel).join('');
    tCel.desenhou();
    if (anim) contar(cel, antes);
    const min = Math.min(...DY.planosCnpj.map((p) => p.preco));
    $$('[data-cel-min]').forEach((e) => (e.textContent = brl(min)));
    combo();
  }

  /* combo: luz + internet 1000 + uma linha de 30 GB */
  function combo() {
    const box = $('[data-combo]'); if (!box) return;
    const s = DY.energia.simular(700);
    const n = DY.catalogo.casa[DY.blocoInternet(DY.uf)].find((p) => p.id === '1000').opcoes[0].preco; // 1000 Mega + NoPing
    const l = (DY.planosCnpj.find((p) => p.id === '30') || DY.planosCnpj[0]).preco;
    const cbN = cb(n, 50), cbL = cb(l, 100);
    $('[data-cb=luz]', box).textContent = DY.brl(s.cashback);
    $('[data-cb=net]', box).textContent = DY.brl(cbN);
    $('[data-cb=cel]', box).textContent = DY.brl(cbL);
    $('[data-cb=total]', box).textContent = DY.brl(s.cashback + cbN + cbL);
    $('[data-eco]', box).textContent = DY.brl(s.economiaMes);
    $('[data-net-1000]', box).textContent = brl(n);
  }

  document.addEventListener('dy:planos', () => { desenhaNet(false); desenhaCel(false); });
  desenhaNet(false); desenhaCel(false);

  /* ---------- Animações (GSAP + ScrollTrigger) ---------- */
  if (temGsap) {
    document.documentElement.classList.add('gs');
    gsap.registerPlugin(ScrollTrigger);
    // os objetos 3D flutuam devagar
    $$('.obj').forEach((o, i) => gsap.to(o, { y: i % 2 ? 14 : -14, rotation: i % 2 ? 2 : -2, duration: 3.2 + (i % 3) * .5, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    // entrada do topo
    gsap.from('.topo__cena .obj', { y: 60, scale: .85, autoAlpha: 0, duration: 1, stagger: .14, ease: 'back.out(1.6)', delay: .15 });
    gsap.from('.topo__cena .tag', { y: 16, autoAlpha: 0, duration: .6, stagger: .12, ease: 'power3.out', delay: .7 });
    gsap.from('.topo__cep', { y: 30, autoAlpha: 0, duration: .8, ease: 'power3.out', delay: .35 });
    // ao chegar em cada bloco
    $$('[data-sobe]').forEach((el) => gsap.to(el, { y: 0, autoAlpha: 1, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%', once: true } }));
    // o objeto da abertura de cada serviço sobe um pouco com a rolagem
    $$('.abre').forEach((a) => { const o = $$('.abre__obj .obj', a); if (o.length) gsap.fromTo(o, { yPercent: 12 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: a, start: 'top bottom', end: 'bottom top', scrub: 1 } }); });
    // cards entram em sequência
    $$('.cards').forEach((cs) => ScrollTrigger.create({ trigger: cs, start: 'top 85%', once: true, onEnter: () => gsap.from($$('.pc', cs), { y: 40, autoAlpha: 0, duration: .7, stagger: .08, ease: 'power3.out', clearProps: 'all' }) }));
    addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
/* atalhos para o campo de CEP do topo */
document.querySelectorAll('a[href="#cep-topo"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const f = document.querySelector('#cep-topo'); f.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => f.querySelector('input[name=cep]').focus({ preventScroll: true }), 500); }));
/* carrossel de destaques no menu */
document.querySelectorAll('[data-slides]').forEach((m) => {
  const sl = [...m.querySelectorAll('.ms__sl')], pt = m.querySelector('.ms__pontos'); let k = 0, t;
  pt.innerHTML = sl.map(() => '<i></i>').join('');
  const vai = (i) => { k = (i + sl.length) % sl.length; sl.forEach((s, j) => s.classList.toggle('is-on', j === k)); [...pt.children].forEach((p, j) => p.classList.toggle('is-on', j === k)); };
  vai(0);
  const item = m.closest('.nav__item');
  const roda = () => { clearInterval(t); t = setInterval(() => vai(k + 1), 2400); };
  item.addEventListener('mouseenter', () => { vai(0); roda(); }); item.addEventListener('mouseleave', () => clearInterval(t));
  item.addEventListener('focusin', roda);
});
