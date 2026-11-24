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

  /* ---------- Campo de CEP ----------
     Modo CEP: CEP + número. Modo "Não sei meu CEP": estado, cidade, rua (com sugestões) e número;
     o CEP certo sai da faixa de numeração da rua ("até 1239/1240", "de 1241/1242 a 3519/3520", "lado par"...). */
  const mascara = (v) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  const semAcento = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const viacep = async (uf, cid, rua) => {
    const r = await fetch(`https://viacep.com.br/ws/${uf}/${encodeURIComponent(cid)}/${encodeURIComponent(rua)}/json/`);
    const l = await r.json(); return Array.isArray(l) ? l : [];
  };
  // a faixa de números de um CEP, a partir do complemento
  function faixa(comp) {
    const c = semAcento(comp || '').trim();
    const par = /lado par/.test(c) ? 0 : /lado impar/.test(c) ? 1 : null;
    const nums = (t) => (t.match(/\d+/g) || []).map(Number);
    let m;
    if (/^\d+$/.test(c)) return { exato: +c };
    if ((m = c.match(/^ate ([\d/]+)/))) return { de: 0, ate: Math.max(...nums(m[1])), par };
    if ((m = c.match(/^de ([\d/]+) a ([\d/]+)/))) return { de: Math.min(...nums(m[1])), ate: Math.max(...nums(m[2])), par };
    if ((m = c.match(/^de ([\d/]+) ao fim/))) return { de: Math.min(...nums(m[1])), ate: Infinity, par };
    return c ? null : { de: 0, ate: Infinity, par: null };
  }
  // dos CEPs da rua, os que valem para o número da casa
  function cepsDoNumero(lista, num) {
    const n = parseInt(String(num).replace(/\D/g, ''), 10);
    if (Number.isNaN(n)) { const r = lista.filter((e) => { const f = faixa(e.complemento); return f && f.exato == null && f.de === 0; }); return r.length ? r : lista.filter((e) => !(faixa(e.complemento) || {}).exato); }
    const exatos = lista.filter((e) => (faixa(e.complemento) || {}).exato === n);
    if (exatos.length) return exatos;
    return lista.filter((e) => { const f = faixa(e.complemento); return f && f.exato == null && n >= f.de && n <= f.ate && (f.par == null || n % 2 === f.par); });
  }
  const tiraTipo = (q) => q.replace(/^(rua|r\.|avenida|av\.?|travessa|tv\.|alameda|al\.|rodovia|estrada)\s+/i, '').trim() || q;
  const irContratar = (f, cep, num) => { location.href = `/contratar?origem=${f.dataset.cep || 'home'}${f.dataset.para ? '&para=' + f.dataset.para : ''}&cep=${cep.replace(/\D/g, '').replace(/^(\d{5})/, '$1-')}&numero=${encodeURIComponent(num)}`; };

  $$('[data-cep]').forEach((f) => {
    const inCep = $('[name=cep]', f), inNum = $('[name=numero]', f), erro = $('.cep__erro', f);
    const modoCep = $('[data-modo=cep]', f), modoRua = $('[data-modo=rua]', f), btNao = $('.cep__nao', f);
    const selUf = $('[data-uf]', f), inCid = $('[data-cidade]', f), lista = $(`#${inCid.getAttribute('list')}`);
    const inRua = $('[data-rua]', f), sug = $('.cep__sug', f), inNumRua = $('[data-num-rua]', f), res = $('.cep__res', f);
    const msg = (t) => { erro.textContent = t; };
    inCep.addEventListener('input', () => { inCep.value = mascara(inCep.value); });
    Object.entries(DY.UFS).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR')).forEach(([uf, n]) => selUf.add(new Option(n, uf)));
    selUf.value = DY.uf;

    // rótulo que sobe quando o campo tem foco ou valor (como um campo de app)
    const cheio = (el) => { const c = el.closest('.cep__f'); if (c) c.classList.toggle('is-cheio', !!el.value || el.tagName === 'SELECT'); };
    $$('.cep__f input:not([type=checkbox]), .cep__f select', f).forEach((el) => { cheio(el); ['input', 'change', 'blur'].forEach((ev) => el.addEventListener(ev, () => cheio(el))); });
    // "Sem número": preenche S/N e trava o campo
    $$('[data-sn]', f).forEach((cx) => cx.addEventListener('change', () => {
      const campo = cx.closest('.cep__f').querySelector('input:not([type=checkbox])');
      campo.value = cx.checked ? 'S/N' : ''; campo.readOnly = cx.checked; cheio(campo); if (!cx.checked) campo.focus();
    }));
    // CEP completo: confere e mostra a rua encontrada, com um check no campo
    const fCep = inCep.closest('.cep__f'), end = $('.cep__end', f); let ultimoCep = '';
    inCep.addEventListener('input', async () => {
      const n = inCep.value.replace(/\D/g, ''); fCep.classList.remove('is-ok', 'is-erro');
      if (n.length < 8) { end.hidden = true; ultimoCep = ''; return; }
      if (n === ultimoCep) return; ultimoCep = n;
      try {
        const r = await (await fetch(`https://viacep.com.br/ws/${n}/json/`)).json();
        if (n !== inCep.value.replace(/\D/g, '')) return;
        if (r.erro) { fCep.classList.add('is-erro'); end.hidden = false; end.className = 'cep__end is-erro'; end.textContent = 'Não encontramos esse CEP. Confira os números ou use "Não sei meu CEP".'; return; }
        fCep.classList.add('is-ok'); end.hidden = false; end.className = 'cep__end';
        end.textContent = [r.logradouro, r.bairro, `${r.localidade}/${r.uf}`].filter(Boolean).join(' · ');
        if (document.activeElement === inCep) inNum.focus();
      } catch (e) { end.hidden = true; }
    });
    // "Não sei meu CEP": estado e cidade aproximados pela conexão (a pessoa pode trocar)
    let jaLocalizou = false;
    async function localizar() {
      if (jaLocalizou || inCid.value) return; jaLocalizou = true;
      try {
        const g = await (await fetch('https://get.geojs.io/v1/ip/geo.json')).json();
        if (g.country_code !== 'BR' || inCid.value) return;
        const uf = Object.entries(DY.UFS).find(([, nome]) => semAcento(nome) === semAcento(g.region || ''));
        if (uf) { selUf.value = uf[0]; cidadesUf = ''; carregaCidades(); cheio(selUf); }
        if (g.city) { inCid.value = g.city; cheio(inCid); }
      } catch (e) { /* sem localização: a pessoa escolhe */ }
    }

    // troca de modo, com o número já digitado passando de um lado para o outro
    btNao.addEventListener('click', () => {
      const paraRua = modoRua.hidden; msg(''); res.innerHTML = '';
      modoCep.hidden = paraRua; modoRua.hidden = !paraRua;
      btNao.textContent = paraRua ? 'Sei meu CEP' : 'Não sei meu CEP'; btNao.setAttribute('aria-expanded', String(paraRua));
      if (paraRua) { inNumRua.value = inNum.value; localizar(); carregaCidades(); (inCid.value ? inRua : inCid).focus(); } else { inNum.value = inNumRua.value || inNum.value; inCep.focus(); }
      $$('.cep__f input, .cep__f select', f).forEach((el) => el.type !== 'checkbox' && cheio(el));
      [inNum, inNumRua].forEach((el) => { const sn = el.value === 'S/N'; el.readOnly = sn; const cx = el.closest('.cep__f').querySelector('[data-sn]'); if (cx) cx.checked = sn; cheio(el); });
      if (window.gsap) gsap.from(paraRua ? modoRua : modoCep, { autoAlpha: 0, y: 8, duration: .3, ease: 'power2.out' });
    });

    let cidadesUf = '';
    async function carregaCidades() {
      if (cidadesUf === selUf.value) return; cidadesUf = selUf.value; lista.innerHTML = '';
      try { const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selUf.value}/municipios?orderBy=nome`); (await r.json()).forEach((m) => lista.append(new Option(m.nome))); } catch (e) { /* sem rede: digita livre */ }
    }
    selUf.addEventListener('change', () => { inCid.value = ''; fechaSug(); carregaCidades(); });
    inCid.addEventListener('change', fechaSug);

    // sugestões de rua: nomes únicos, conforme digita
    let tempo, pedido = 0, opcoes = [], ativo = -1;
    function fechaSug() { sug.hidden = true; sug.innerHTML = ''; inRua.setAttribute('aria-expanded', 'false'); ativo = -1; }
    function marca(i) { ativo = i; $$('li', sug).forEach((li, k) => li.setAttribute('aria-selected', String(k === i))); }
    function escolhe(nome) { inRua.value = nome; fechaSug(); inNumRua.focus(); }
    inRua.addEventListener('input', () => {
      clearTimeout(tempo); const q = inRua.value.trim(); const cid = inCid.value.trim();
      if (q.length < 3 || !cid) { fechaSug(); return; }
      tempo = setTimeout(async () => {
        const meu = ++pedido;
        try {
          const l = await viacep(selUf.value, cid, tiraTipo(q));
          if (meu !== pedido) return;
          opcoes = [...new Set(l.map((e) => e.logradouro))].slice(0, 8);
          if (!opcoes.length) { fechaSug(); return; }
          sug.innerHTML = opcoes.map((n, k) => `<li role="option" id="${sug.id}-${k}" aria-selected="false" data-k="${k}">${n}</li>`).join('');
          sug.hidden = false; inRua.setAttribute('aria-expanded', 'true'); ativo = -1;
        } catch (e) { fechaSug(); }
      }, 280);
    });
    inRua.addEventListener('keydown', (e) => {
      if (sug.hidden) return; const n = opcoes.length;
      if (e.key === 'ArrowDown') { e.preventDefault(); marca((ativo + 1) % n); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marca((ativo - 1 + n) % n); }
      else if (e.key === 'Enter' && ativo >= 0) { e.preventDefault(); escolhe(opcoes[ativo]); }
      else if (e.key === 'Escape') fechaSug();
    });
    sug.addEventListener('mousedown', (e) => { const li = e.target.closest('li'); if (li) { e.preventDefault(); escolhe(opcoes[+li.dataset.k]); } });
    inRua.addEventListener('blur', () => setTimeout(fechaSug, 150));

    // ver ofertas pela rua: acha o CEP do número e segue para a contratação
    $('[data-buscar]', f).addEventListener('click', async () => {
      msg(''); res.innerHTML = '';
      const cid = inCid.value.trim(), rua = inRua.value.trim(), num = inNumRua.value.trim();
      if (!cid) { msg('Escreva a cidade.'); inCid.focus(); return; }
      if (rua.length < 3) { msg('Escreva pelo menos 3 letras do nome da rua.'); inRua.focus(); return; }
      if (!num) { msg('Escreva o número do imóvel (ou S/N se não tiver).'); inNumRua.focus(); return; }
      const bt = $('[data-buscar]', f); bt.disabled = true;
      try {
        let l = await viacep(selUf.value, cid, tiraTipo(rua));
        if (!l.length) { msg('Não achamos essa rua. Confira a cidade e o nome da rua.'); return; }
        const iguais = l.filter((e) => semAcento(e.logradouro) === semAcento(rua) || semAcento(tiraTipo(e.logradouro)) === semAcento(tiraTipo(rua))); if (iguais.length) l = iguais;
        const ceps = [...new Map(cepsDoNumero(l, num).map((e) => [e.cep, e])).values()];
        if (ceps.length === 1) { irContratar(f, ceps[0].cep, num); return; }
        const opc = ceps.length ? ceps : l;
        msg(ceps.length ? 'Essa rua passa por mais de um bairro. Escolha o seu:' : 'Não achamos a faixa desse número. Escolha o CEP do seu trecho:');
        opc.slice(0, 10).forEach((e) => { const li = document.createElement('li'); const b = document.createElement('button'); b.type = 'button';
          b.innerHTML = `${e.logradouro}<small>${[e.bairro, e.complemento].filter(Boolean).join(' · ')} · CEP ${e.cep}</small>`;
          b.addEventListener('click', () => irContratar(f, e.cep, num)); li.append(b); res.append(li); });
      } catch (e) { msg('Não foi possível buscar agora. Tente de novo ou fale no WhatsApp.'); } finally { bt.disabled = false; }
    });

    f.addEventListener('submit', (e) => {
      e.preventDefault(); msg('');
      if (!modoRua.hidden) { $('[data-buscar]', f).click(); return; }
      const cep = inCep.value.replace(/\D/g, ''), num = inNum.value.trim();
      if (cep.length !== 8) { msg('Escreva o CEP com 8 números, por exemplo 80000-000.'); inCep.focus(); return; }
      if (!num) { msg('Escreva o número do imóvel (ou S/N se não tiver).'); inNum.focus(); return; }
      irContratar(f, cep, num);
    });
  });

  /* ---------- Simulador de energia ----------
     O cliente digita o valor da conta; a faixa de desconto sai sozinha de DY.energia. Sem valor máximo.
     Peça única: _partes/simulador.html (home e /energia/simulador). */
  $$('[data-sim]').forEach((sim) => {
    const inp = $('[data-sim-conta]', sim), msg = $('[data-sim-msg]', sim), ir = $('[data-sim-ir]', sim), zap = $('[data-sim-zap]', sim);
    const out = {}; $$('[data-out]', sim).forEach((e) => (out[e.dataset.out] = e));
    const min = DY.energia.minimo, minTxt = 'R$ ' + partes(min).i, abaixo = `O desconto vale para contas a partir de ${minTxt}.`;
    $('[data-sim-min]', sim).textContent = minTxt;
    zap.target = '_blank'; zap.rel = 'noopener';
    let t, rot = '';
    const erro = (txt) => { msg.textContent = txt; sim.classList.toggle('is-erro', !!txt); if (txt) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); };
    const avisa = () => { const v = DY.lerReais(inp.value); erro(v && v < min ? abaixo : ''); };
    const pinta = () => {
      const v = DY.lerReais(inp.value), s = DY.energia.simular(v), ok = s.elegivel;
      sim.classList.toggle('is-ok', ok);
      const novo = ok ? `Seu desconto é de <b>${s.pct}%</b>` : 'Digite o valor da sua conta para ver o seu desconto';
      if (novo !== rot) { out.rot.innerHTML = novo; rot = novo; }
      out.antes.textContent = ok ? DY.brl(s.conta) : '';
      out.nova.textContent = DY.brl(ok ? s.comDesconto : 0); out.mes.textContent = DY.brl(ok ? s.economiaMes : 0);
      out.ano.textContent = DY.brl(ok ? s.economiaMes * 12 : 0); out.cb.textContent = DY.brl(ok ? s.cashback : 0);
      ir.href = '/contratar?origem=energia' + (ok ? '&conta=' + v : '');
      zap.href = DY.linkWhatsApp(ok ? `Olá! Simulei no site: minha conta de luz é de ${DY.brl(s.conta)} e quero o desconto de ${s.pct}%.` : 'Olá! Quero simular o desconto na minha conta de luz.');
    };
    inp.addEventListener('input', () => {
      // formata sem tirar o cursor do lugar
      const resto = inp.value.length - inp.selectionStart;
      inp.value = DY.formatarReais(inp.value);
      const pos = Math.max(0, inp.value.length - resto); inp.setSelectionRange(pos, pos);
      pinta(); clearTimeout(t); erro('');
      t = setTimeout(avisa, 1200);
    });
    inp.addEventListener('blur', avisa);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
    ir.addEventListener('click', (e) => { if (sim.classList.contains('is-ok')) return; e.preventDefault(); inp.focus(); erro(DY.lerReais(inp.value) ? abaixo : 'Digite o valor da sua conta de luz.'); });
    pinta();
  });

  /* ---------- Cards de plano ---------- */
  const APPS = { 'youtube-premium': '/img/apps/youtube-premium-logo.svg', paramount: '/img/apps/paramount-44.svg', 'hbo-max': '/img/apps/hbo-max.png', globoplay: '/img/apps/globoplay.png', whatsapp: '/img/apps/whatsapp.svg' };
  const precoHtml = (v, id) => { const { i, d } = partes(v); return `<p class="pc__preco"><small>R$</small><b data-num data-v="${v}" data-id="${id}">${i}</b><i>,${d}</i><em>/mês</em></p>`; };
  // cashback em destaque nos cards: o mesmo cifrão 3D do site, em miniatura
  // k = { plano, preco (centavos/mês), valor (centavos), linhas, tipo: net | emp | cel }
  const cbHtml = (k) => `<button type="button" class="cb" aria-haspopup="dialog" data-dica="Clique e entenda o cashback" data-cb-plano="${k.plano}" data-cb-preco="${k.preco}" data-cb-valor="${k.valor}" data-cb-linhas="${k.linhas || 0}" data-cb-tipo="${k.tipo}">
      <img src="/img/3d/cashback-p.webp" alt="" width="30" height="30"><span class="cb__t">Cashback de <b>${DY.brl(k.valor)}</b></span><span class="cb__q" aria-hidden="true">O que é?</span></button>`;
  const appNome = (p, o) => (o.nome === 'Somente Internet' ? (p.id === '1000' ? 'NoPing' : '') : p.opcoes.length === 1 && /,/.test(o.nome) ? '4 streamings' : ((LOGO[o.nome] || [0, o.nome])[1]));
  const cbNet = (p, o, tipo = 'net') => { const app = tipo === 'net' ? appNome(p, o) : ''; return cbHtml({ plano: `${String(p.num).replace(/^(\d)(\d{3})$/, '$1.$2')} Mega${app ? ' com ' + app : ''}`, preco: c(o.preco), valor: cb(o.preco, 50), tipo }); };
  const totCel = (p) => c(p.preco) * (linhas[p.id] || 1);
  const cbCel = (p) => cbHtml({ plano: `${p.gb} GB`, preco: totCel(p), valor: DY.cashbackCentavos(totCel(p), 100), linhas: linhas[p.id] || 1, tipo: 'cel' });
  const precoCel = (p, g) => { const h = precoHtml(totCel(p) / 100, 'c' + p.id); return g ? h.replace('pc__preco', 'pc__preco pc__preco--g') : h; };
  // celular: os apps que não gastam a internet viram ícones, e cada card escolhe quantas linhas
  const APP = { whatsapp: 'WhatsApp', 'whatsapp-business': 'WhatsApp Business', instagram: 'Instagram', facebook: 'Facebook', messenger: 'Messenger', waze: 'Waze', x: 'X' };
  const APP_CURTO = { 'whatsapp-business': 'Business' };
  const linhas = {}; const MAX_L = DY.linhasMax || 5000; const ESP = DY.linhasEspecial || 15;
  const zapCel = (p, n) => DY.linkWhatsApp(`Olá! Quero ${n} linhas do plano de celular de ${p.gb} GB para a minha empresa.`);
  const linkCel = (p) => { const n = linhas[p.id] || 1; return n > ESP ? zapCel(p, n) : `/contratar?origem=celular&para=cnpj&plano=${encodeURIComponent(p.id)}&linhas=${n}`; };
  // contador de linhas: botões e número que dá para digitar
  const qtdHtml = (p, pre = '') => { const n = linhas[p.id] || 1; return `<div class="qtd"><span class="qtd__l" id="ql-${pre}${p.id}">Linhas</span><div class="qtd__ctrl" role="group" aria-labelledby="ql-${pre}${p.id}"><button type="button" data-l="-1" aria-label="Tirar uma linha"${n <= 1 ? ' disabled' : ''}>−</button><input class="qtd__n" type="text" inputmode="numeric" maxlength="4" value="${n}" aria-label="Quantidade de linhas"><button type="button" data-l="1" aria-label="Adicionar uma linha"${n >= MAX_L ? ' disabled' : ''}>+</button></div></div>
      <p class="qtd__esp"${n > ESP ? '' : ' hidden'}>Acima de ${ESP} linhas a condição é especial, com valores e franquias negociados. Clique em <b>Quero este plano</b> e fale com a gente.</p>`; };
  const appsDet = (p) => (p.apps || []).filter((k) => APP[k]).map((k) => APP[k]).join(', ').replace(/, ([^,]*)$/, ' e $1');
  const detCelLista = (p) => [...(p.detalhes || []).map((d) => [d[1], d[2]]), ['Sem gastar a internet', appsDet(p)], ['MEI', 'Até 3 linhas no CNPJ, de até R$ 100 cada']];
  function totalCel(p) {
    const n = linhas[p.id] || 1;
    return n === 1 ? 'Valor de 1 linha' : `Valor de ${n} linhas · ${brl(p.preco)} cada`;
  }
  function cardCel(p) {
    const dest = p.selo === 'OFERTA DO MÊS';
    const apps = (p.apps || []).filter((k) => APP[k]);
    const det = (p.detalhes || []).map((d) => `<li><span>${d[1]}</span><b>${d[2]}</b></li>`).join('');
    return `<article class="pc pc--cel${dest ? ' is-dest' : ''}" data-id="${p.id}">
      <span class="pc__selo">${p.selo}</span>
      <p class="pc__vel"><b>${p.gb}</b><span>GB</span></p>
      <p class="pc__sub">${p.plano} GB do plano + ${p.bonus} GB de bônus</p>
      <div class="pc__op"><p class="pc__op-t">Sem gastar a internet</p><ul class="apps apps--${apps.length}">${apps.map((k) => `<li title="${APP[k]}"><img src="/img/apps/${k}.svg" alt="${APP[k]}"></li>`).join('')}</ul></div>
      <div class="pc__pe">${p.de ? `<p class="pc__de">De ${brl(p.de)}</p>` : ''}<div class="cel__preco">${precoCel(p)}</div>
      <p class="qtd__tot">${totalCel(p)}</p>
      <div class="cbw">${cbCel(p)}</div>
      ${qtdHtml(p)}
      <a class="pc__btn" data-ir-cel href="${linkCel(p)}">Quero este plano</a>
      ${btDet}</div>
      ${painelDet(`${p.gb} GB por mês`, detCelLista(p), '')}</article>`;
  }
  function mudaLinhas(card, valor) {
    const p = DY.planosCnpj.find((x) => x.id === card.dataset.id); if (!p) return;
    const n = Math.max(1, Math.min(MAX_L, Math.round(+valor) || 1)); const era = linhas[p.id] || 1; linhas[p.id] = n;
    const antes = { ['c' + p.id]: +$('[data-num]', card).dataset.v };
    $('.qtd__n', card).value = n; $('.qtd__tot', card).innerHTML = totalCel(p); $('[data-ir-cel]', card).href = linkCel(p);
    const ir = $('[data-ir-cel]', card); if (n > ESP) { ir.target = '_blank'; ir.rel = 'noopener'; } else ir.removeAttribute('target');
    $('.cel__preco', card).innerHTML = precoCel(p, card.matches('[data-cel-dest]')); $('.cbw', card).innerHTML = cbCel(p);
    $('.qtd__esp', card).hidden = n <= ESP;
    if (n > ESP && era <= ESP) avisar(`Acima de ${ESP} linhas: condição especial pelo WhatsApp.`);
    contar(card, antes);
    const [menos, mais] = $$('[data-l]', card); menos.disabled = n <= 1; mais.disabled = n >= MAX_L;
  }
  document.addEventListener('change', (e) => { const i = e.target.closest('.qtd__n'); if (i) mudaLinhas(i.closest('.pc, [data-cel-dest]'), i.value); });
  document.addEventListener('input', (e) => { const i = e.target.closest('.qtd__n'); if (i) i.value = i.value.replace(/\D/g, ''); });
  document.addEventListener('keydown', (e) => { const i = e.target.closest && e.target.closest('.qtd__n'); if (i && e.key === 'Enter') { e.preventDefault(); i.blur(); } });
  document.addEventListener('focusout', (e) => { const i = e.target.closest && e.target.closest('.qtd__n'); if (i && i.value === '') mudaLinhas(i.closest('.pc, [data-cel-dest]'), 1); });
  document.addEventListener('click', (e) => {
    const bt = e.target.closest('.pc--cel [data-l]'); if (bt) {
      const card = bt.closest('.pc, [data-cel-dest]');
      mudaLinhas(card, (linhas[card.dataset.id] || 1) + +bt.dataset.l);
      if (temGsap) gsap.fromTo($('.qtd__n', card), { scale: 1.3 }, { scale: 1, duration: .4, ease: 'back.out(3)' });
      return;
    }
    const ab = e.target.closest('[data-det]'), fe = e.target.closest('[data-det-fechar]');
    if (ab || fe) {
      const card = (ab || fe).closest('.pc, .mil'); const mais = $('.pc__mais', card); const abrir = !!ab;
      mais.hidden = !abrir; card.classList.toggle('is-det', abrir); $('[data-det]', card).setAttribute('aria-expanded', String(abrir));
      if (abrir && temGsap) gsap.from(mais, { autoAlpha: 0, y: 12, duration: .3, ease: 'power2.out' });
      if (abrir) mais.scrollTop = 0; (abrir ? mais : $('[data-det]', card)).focus({ preventScroll: true });
    }
  });


  // trilho: setas no desktop quando sobra card, pontos e dica no celular
  const SEM_TRILHO = { desenhou() {} };
  function trilho(el) {
    if (!el) return SEM_TRILHO;
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
  const V1 = ''; // páginas de cada plano agora estão na própria v2
  const DET = DY.paginaPlano || {};
  const LOGO = { 'GloboPlay': ['/img/apps/globoplay.png', 'Globoplay'], 'Paramount+': ['/img/apps/paramount-44.svg', 'Paramount+'], 'HBO Max': ['/img/apps/hbo-max.png', 'HBO Max'], 'YouTube Premium': ['/img/apps/youtube-premium-logo.svg', 'YouTube Premium'], 'Somente Internet': ['/img/apps/noping.svg', 'Internet + NoPing'] };
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
    if (p.opcoes.length > 1) return `<div class="pc__op"><p class="pc__op-t">Selecione seu streaming</p><div class="ops" role="radiogroup" aria-label="Streaming do plano de ${milhar(p.num)} Mega">${opsVisiveis(p).map((k) => tile(p, k)).join('')}</div></div>`;
    return `<div class="pc__op"><p class="pc__op-t">Somente internet</p><p class="pc__op-vazio">Modem Wi-Fi e instalação grátis inclusos. Sem streaming.</p></div>`;
  }
  const milhar = (n) => String(n).replace(/^(\d)(\d{3})$/, '$1.$2'); // 1000 → 1.000
  // detalhes rápidos: o card vira uma lista curta do que importa, com a página completa do plano e a volta
  const val = (p, k) => ((p.detalhes || []).find((d) => d[1].startsWith(k)) || [])[2] || '';
  function painelDet(titulo, linhas, pagina, extra = '') {
    return `<div class="pc__mais" hidden tabindex="-1"><p class="pc__mais-t">${titulo}</p>
      <ul class="pc__lista">${linhas.filter((l) => l[1]).map(([a, b]) => `<li><span>${a}</span><b>${b}</b></li>`).join('')}</ul>${extra}
      <div class="pc__mais-bts">${pagina ? `<a class="bt-mini bt-mini--cheio" href="${pagina}">Página do plano</a>` : ''}<button type="button" class="bt-mini" data-det-fechar>Voltar</button></div></div>`;
  }
  const btDet = '<button type="button" class="bt-mini pc__det" data-det aria-expanded="false">Ver detalhes do plano</button>';
  function appsNet(p) {
    const nomes = p.opcoes.map((o) => (o.nome === 'Somente Internet' ? (p.id === '1000' ? 'NoPing por 6 meses' : '') : (LOGO[o.nome] || [0, o.nome])[1])).filter(Boolean);
    if (!nomes.length) return 'Só internet, sem streaming';
    return nomes.length === 1 ? nomes[0] + ' incluso' : nomes.join(', ').replace(/, ([^,]*)$/, ' ou $1') + ', à sua escolha';
  }
  // aplicativos do plano em logos: um incluso, ou as opções para escolher
  const ICONE = { 'YouTube Premium': '/img/apps/youtube.png' };
  function appsLogos(p) {
    const it = p.opcoes.map((o) => (o.nome === 'Somente Internet' ? (p.id === '1000' ? ['/img/apps/noping.svg', 'NoPing'] : null) : [ICONE[o.nome] || (LOGO[o.nome] || [])[0], (LOGO[o.nome] || [0, o.nome])[1]])).filter((x) => x && x[0]);
    if (!it.length) return '';
    const t = it.length === 1 ? 'Aplicativo incluso' : 'Opções de aplicativo: você escolhe um';
    return `<div class="apl"><p class="apl__t">${t}</p><ul>${it.map(([src, n]) => `<li><span class="apl__ic${src.includes('noping') ? ' apl__ic--preto' : ''}"><img src="${src}" alt=""></span>${n}</li>`).join('')}</ul></div>`;
  }
  const detNet = (p) => painelDet(`${milhar(p.num)} Mega`, [['Download', val(p, 'Download')], ['Upload', val(p, 'Upload')], ['Modem', val(p, 'Modem')], ['Instalação', 'Grátis, em até 48 horas']], DET[p.id] ? V1 + DET[p.id] : '', appsLogos(p));
  function cardNet(p) {
    const o = p.opcoes[opIdx(p)];
    const up = (p.detalhes.find((d) => d[1] === 'Upload') || [])[2];
    return `<article class="pc" data-id="${p.id}">
      <span class="pc__selo">${p.selo}</span>
      <p class="pc__vel"><b>${milhar(p.num)}</b><span>Mega</span></p>
      <p class="pc__sub">Upload de ${up}</p>
      ${areaOpcoes(p)}
      <div class="pc__pe"><p class="pc__de">De ${brl(o.de || p.de)}</p>${precoHtml(o.preco, p.id)}
      <div class="cbw" data-cb-id="${p.id}">${cbNet(p, o)}</div>
      <a class="pc__btn" data-ir="${p.id}" href="${linkContratar(p, 'casa')}">Quero este plano</a>
      ${btDet}</div>${detNet(p)}</article>`;
  }
  // oferta do mês: o plano com esse selo aparece em destaque antes dos outros cards
  const DESTAQUE = {
    '1000': { obj: '/img/3d-g/controle.webp', nome: 'Internet + NoPing grátis por 6 meses',
      txt: 'A velocidade para a casa toda: jogos, chamadas de vídeo, séries em 4K e vários aparelhos ligados ao mesmo tempo.',
      info: [['1.000 Mega de download', 'Séries em 4K e jogos sem travar'], ['500 Mega de upload', 'Envie vídeos e faça lives sem fila'], ['Modem Wi-Fi 6', 'Mais alcance pela casa, sem custo'], ['Instalação em até 48 h', 'Grátis, com teste de velocidade']] },
  };
  const ofertaCasa = (todos) => todos.find((p) => p.selo === 'OFERTA DO MÊS' && p.id !== '2000') || todos.find((p) => p.id === '1000');

  function blocoMil(p) {
    const box = $('[data-mil]'); if (!box) return; if (!p) { box.hidden = true; return; }
    box.hidden = false; const d = DESTAQUE[p.id] || {};
    const info = d.info || (p.detalhes || []).slice(0, 4).map((x) => [x[2], x[1]]);
    const o = p.opcoes[opIdx(p)];
    $('[data-mil-num]', box).textContent = milhar(p.num);
    $('[data-mil-t]', box).textContent = `Escolha como quer o seu ${milhar(p.num)} Mega`;
    $('[data-mil-txt]', box).textContent = d.txt || '';
    $('[data-mil-txt]', box).hidden = !d.txt;
    $('[data-mil-info]', box).innerHTML = info.map(([b, t]) => `<li><b>${b}</b><span>${t}</span></li>`).join('');
    if (d.obj) $('[data-mil-obj]', box).src = d.obj;
    $('[data-mil-ops]', box).innerHTML = opsVisiveis(p).map((k) => tile(p, k)).join('');
    $('[data-mil-preco]', box).innerHTML = precoHtml(o.preco, p.id).replace('pc__preco', 'pc__preco pc__preco--g');
    $('[data-mil-cb]', box).innerHTML = cbNet(p, o);
    $('[data-mil-de]', box).textContent = 'De ' + brl(o.de || p.de);
    $('[data-mil-ir]', box).href = linkContratar(p, 'casa');
    if (DET[p.id]) $('[data-mil-det]', box).href = V1 + DET[p.id];
    $('[data-mil-nome]', box).textContent = o.nome === 'Somente Internet' ? (d.nome || 'Somente internet') : `Com ${LOGO[o.nome][1]} incluso`;
  }
  // empresa: o mesmo card da casa, com o que vem no plano no lugar do streaming
  const emp_ = $('[data-emp]'); const tEmp = trilho(emp_);
  const INCLUI = {
    e1000: ['Gestão de equipe externa, 4 licenças', 'Antivírus incluso', 'Audiolivros e cursos', 'Modem Wi-Fi 6'],
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
      <p class="pc__vel"><b>${milhar(p.num)}</b><span>Mega</span></p>
      <p class="pc__sub">Upload de ${up}</p>
      <div class="pc__op"><p class="pc__op-t">O plano inclui</p><ul class="pc__inc">${(INCLUI[p.id] || []).map((t) => `<li>${t}</li>`).join('')}</ul></div>
      <div class="pc__pe"><p class="pc__de">De ${brl(o.de || p.de)}</p>${precoHtml(o.preco, p.id)}
      <div class="cbw">${cbNet(p, o, 'emp')}</div>
      <a class="pc__btn" href="${linkContratar(p, 'empresa')}">Quero este plano</a>
      ${btDet}</div>${painelDet(`${milhar(p.num)} Mega`, [['Download', val(p, 'Download')], ['Upload', val(p, 'Upload')], ['Modem', val(p, 'Modem')], ['O plano inclui', (INCLUI[p.id] || []).filter((t) => !t.startsWith('Modem')).join(' · ')], ['Fidelidade', '24 meses']], '')}</article>`;
  }
  // oferta do mês para empresa: o mesmo card do 1.000 Mega da casa, no azul-acinzentado da empresa
  const INCLUI_DEST = {
    e1000: [['/img/3d-g/pino.webp', 'Gestão de equipe', '4 licenças'], ['/img/3d-g/escudo.webp', 'Antivírus', 'Incluso'], ['/img/3d-g/wifi.webp', 'Modem Wi-Fi 6', 'Incluso']],
  };
  function blocoEmpDest(p) {
    const box = $('[data-emp-dest]'); if (!box) return; if (!p) { box.hidden = true; return; }
    box.hidden = false; box.dataset.id = p.id; const o = p.opcoes[0]; const up = val(p, 'Upload'); const n = milhar(p.num);
    const inc = INCLUI_DEST[p.id] || [];
    box.innerHTML = `
      <div class="obj" aria-hidden="true"><img src="/img/3d-g/predio.webp" alt=""></div>
      <div class="mil__esq">
        <span class="mil__selo">${p.selo}</span>
        <p class="mil__vel"><b>${n}</b> Mega</p>
        <p class="mil__nome">Internet no CNPJ com Wi-Fi 6 e ferramentas para a equipe</p>
        <p class="mil__txt">Velocidade para o caixa, o sistema, as videochamadas e a equipe toda conectada ao mesmo tempo, sem a internet cair no meio do expediente.</p>
        <ul class="mil__info"><li><b>${n} Mega de download</b><span>Para a empresa toda</span></li><li><b>${up} de upload</b><span>Nuvem, backup e videochamadas</span></li><li><b>Modem Wi-Fi 6</b><span>Mais alcance, sem custo</span></li><li><b>Instalação em até 48 h</b><span>Grátis, no endereço da empresa</span></li></ul>
      </div>
      <div class="mil__dir">
        <p class="mil__t">Já vem no seu ${n} Mega</p>
        <div class="ops ops--3">${inc.map(([src, t, sub]) => `<span class="op op--fixo op--inc"><span class="op__ic"><img src="${src}" alt=""></span><span class="op__n">${t}</span><small>${sub}</small></span>`).join('')}</div>
        <div class="mil__val"><p class="mil__de">De ${brl(o.de || p.de)}</p>${precoHtml(o.preco, p.id).replace('pc__preco', 'pc__preco pc__preco--g')}
        <div class="cbw">${cbNet(p, o, 'emp')}</div></div>
        <div class="mil__bts"><a class="bt bt--ouro" href="${linkContratar(p, 'empresa')}">Quero este plano</a><button type="button" class="bt-mini bt-mini--claro mil__det pc__det" data-det aria-expanded="false">Ver detalhes do plano</button></div>
      </div>
      ${painelDet(`${n} Mega para empresa`, [['Download', val(p, 'Download')], ['Upload', up], ['Modem', val(p, 'Modem')], ['Instalação', 'Grátis, em até 48 horas'], ['O plano inclui', (INCLUI[p.id] || []).filter((t) => !t.startsWith('Modem')).join(' · ')], ['Fidelidade', '24 meses'], ['No boleto ou PIX', 'R$ 10 a mais por mês']], '')}`;
  }
  function blocoEmp() {
    const todos = emp(); const dest = todos.find((p) => p.selo === 'OFERTA DO MÊS');
    if (!emp_) return;
    const lista = todos.filter((p) => p !== dest); const cards = $('.cards', emp_);
    blocoEmpDest(dest);
    cards.style.setProperty('--n', lista.length);
    cards.innerHTML = lista.map(cardEmp).join('');
    tEmp.desenhou();
  }
  const precosNet = () => Object.fromEntries([...casa(), ...emp()].map((p) => [p.id, p.opcoes[opIdx(p)].preco]));
  function desenhaNet(anim, antigos) {
    if (!net) { blocoEmp(); return; }
    const todos = casa();
    const destaque = ofertaCasa(todos);
    const lista = todos.filter((p) => p !== destaque && p.id !== '2000');
    const cards = $('.cards', net);
    cards.style.setProperty('--n', lista.length);
    cards.innerHTML = lista.map(cardNet).join('');
    blocoMil(destaque);
    blocoEmp();
    $$('[data-uf-nome]').forEach((n) => (n.textContent = DY.UFS[DY.uf]));
    $$('[data-uf-sel]').forEach((s) => (s.value = DY.uf));
    tNet.desenhou();
    if (anim) { contar(document, antigos || {}); if (temGsap) gsap.fromTo([...(net ? $$('.pc', net) : []), $('[data-mil]'), ...(emp_ ? $$('.pc', emp_) : []), $('[data-emp-dest]')].filter(Boolean), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, stagger: .05, ease: 'power3.out', clearProps: 'transform' }); }
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
    const noDestaque = !!b.closest('[data-mil]'); const raiz = noDestaque ? $('[data-mil]') : b.closest('.pc');
    if (noDestaque) blocoMil(p);
    else {
      raiz.querySelector('.pc__de').textContent = 'De ' + brl(o.de || p.de);
      { const w = raiz.querySelector('.cbw'); if (w) w.innerHTML = cbNet(p, o); }
      raiz.querySelector('[data-ir]').href = linkContratar(p, 'casa');
      const num = raiz.querySelector('[data-num]'); num.dataset.v = o.preco;
    }
    contar(raiz, { [id]: antes });
  });
  function trocaNet(fn, msg) {
    const antes = precosNet();
    const sai = () => { fn(); desenhaNet(true, antes); avisar(msg); const ok = $('.regiao__ok'); if (ok) { ok.hidden = false; clearTimeout(ok._t); ok._t = setTimeout(() => (ok.hidden = true), 2600); } };
    if (temGsap) gsap.to([...(net ? $$('.pc', net) : []), $('[data-mil]'), ...(emp_ ? $$('.pc', emp_) : []), $('[data-emp-dest]')].filter(Boolean), { y: 14, autoAlpha: 0, duration: .2, stagger: .02, ease: 'power2.in', onComplete: sai }); else sai();
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
  let precosCel = {};

  // destaque do celular: o mesmo card da oferta do 1.000 Mega, em verde
  const tileApp = (k) => `<span class="op op--fixo op--app"><span class="op__ic"><img src="/img/apps/${k}.svg" alt=""></span><span class="op__n">${APP_CURTO[k] || APP[k]}</span></span>`;
  function blocoCelDest(p) {
    const box = $('[data-cel-dest]'); if (!box) return; if (!p) { box.hidden = true; return; }
    box.hidden = false; box.dataset.id = p.id;
    const apps = (p.apps || []).filter((k) => APP[k]);
    box.innerHTML = `
      <div class="obj" aria-hidden="true"><img src="/img/3d-g/celular.webp" alt=""></div>
      <div class="mil__esq">
        <span class="mil__selo">${p.selo}</span>
        <p class="mil__vel"><b>${p.gb}</b> GB</p>
        <p class="mil__nome">${p.plano} GB do plano + ${p.bonus} GB de bônus</p>
        <p class="mil__txt">Internet de sobra para a equipe trabalhar na rua, com ligações ilimitadas e os apps do dia a dia sem gastar a franquia.</p>
        <ul class="mil__info"><li><b>Ligações ilimitadas</b><span>Para qualquer operadora do Brasil</span></li><li><b>800 SMS por mês</b><span>Em cada linha</span></li><li><b>${apps.length} apps sem gastar a internet</b><span>WhatsApp, Instagram, Waze e mais</span></li><li><b>Portabilidade grátis</b><span>Traga o número do seu CNPJ</span></li></ul>
      </div>
      <div class="mil__dir">
        <p class="mil__t">Usar estes apps não gasta a sua internet</p>
        <div class="ops ops--apps">${apps.map(tileApp).join('')}</div>
        <div class="mil__val">${p.de ? `<p class="mil__de">De ${brl(p.de)}</p>` : ''}<div class="cel__preco">${precoCel(p, true)}</div>
        <p class="qtd__tot">${totalCel(p)}</p>
        <div class="cbw">${cbCel(p)}</div></div>
        ${qtdHtml(p, 'd')}
        <div class="mil__bts"><a class="bt bt--ouro" data-ir-cel href="${linkCel(p)}">Quero este plano</a><button type="button" class="bt-mini bt-mini--claro mil__det pc__det" data-det aria-expanded="false">Ver detalhes do plano</button></div>
      </div>
      ${painelDet(`${p.gb} GB por mês`, detCelLista(p), '')}`;
  }
  function desenhaCel(anim) {
    if (!cel) { combo(); return; }
    const lista = DY.vitrineCelular.filter(Boolean);
    const antes = precosCel; precosCel = Object.fromEntries(lista.map((p) => ['c' + p.id, p.preco]));
    const dest = lista.find((p) => p.selo === 'OFERTA DO MÊS') || lista[0];
    blocoCelDest(dest);
    const resto = lista.filter((p) => p !== dest);
    $('.cards', cel).style.setProperty('--n', resto.length);
    $('.cards', cel).innerHTML = resto.map(cardCel).join('');
    tCel.desenhou();
    if (anim) contar(cel, antes);
    const min = Math.min(...DY.planosCnpj.map((p) => p.preco));
    $$('[data-cel-min]').forEach((e) => (e.textContent = brl(min)));
    combo();
  }

  /* combo: o cliente liga/desliga cada serviço, escolhe a conta de luz, o plano de internet e as linhas; o Cashback soma */
  const cmb = { luz: 700, net: '1000', linhas: 1 };
  const CONTAS = [500, 700, 1000, 1500, 3000];
  function combo() {
    const box = $('[data-combo]'); if (!box) return;
    const on = (k) => $(`[data-cmb="${k}"] [data-cmb-on]`, box).checked;
    const planosNet = casa();
    if (!planosNet.find((p) => p.id === cmb.net)) cmb.net = (planosNet.find((p) => p.id === '1000') || planosNet[0]).id;
    const chip = (tipo, v, txt, ativo) => `<button type="button" role="radio" aria-checked="${ativo}" class="cmb__chip${ativo ? ' is-on' : ''}" data-cmb-${tipo}-v="${v}">${txt}</button>`;
    $('[data-cmb-luz]', box).innerHTML = CONTAS.map((v) => chip('luz', v, 'R$ ' + partes(v).i, v === cmb.luz)).join('');
    $('[data-cmb-net]', box).innerHTML = planosNet.map((p) => chip('net', p.id, milhar(p.num) + ' Mega', p.id === cmb.net)).join('');
    const pc = (DY.vitrineCelular || []).find((p) => p.selo === 'OFERTA DO MÊS') || DY.planosCnpj[0];
    const pn = planosNet.find((p) => p.id === cmb.net); const precoNet = pn.opcoes[0].preco;
    const s = DY.energia.simular(cmb.luz);
    const v = { luz: on('luz') && s.elegivel ? s.cashback : 0, net: on('net') ? cb(precoNet, 50) : 0, cel: on('cel') ? DY.cashbackCentavos(c(pc.preco) * cmb.linhas, 100) : 0 };
    ['luz', 'net', 'cel'].forEach((k) => { $(`[data-cmb="${k}"]`, box).classList.toggle('is-on', on(k)); $(`[data-cmb-l-${k}]`, box).classList.toggle('is-off', !on(k)); $(`[data-cb="${k}"]`, box).textContent = DY.brl(v[k]); });
    $('[data-cmb-net-nome]', box).textContent = `Internet ${milhar(pn.num)} Mega`;
    $('[data-cmb-cel-nome]', box).textContent = `Plano de ${pc.gb} GB, no CNPJ`;
    $('[data-cmb-cel-t]', box).textContent = `Celular ${pc.gb} GB, ${cmb.linhas} ${cmb.linhas > 1 ? 'linhas' : 'linha'}`;
    $('[data-cmb-linhas]', box).textContent = cmb.linhas;
    const [menos, mais] = $$('[data-cmb-l]', box); menos.disabled = cmb.linhas <= 1 || !on('cel'); mais.disabled = cmb.linhas >= ESP || !on('cel');
    const totalAntes = +($('[data-cb=total]', box).dataset.v || 0); const total = v.luz + v.net + v.cel;
    const el = $('[data-cb=total]', box); el.dataset.v = total;
    if (temGsap && totalAntes !== total) { const o = { v: totalAntes }; gsap.to(o, { v: total, duration: .6, ease: 'power3.out', onUpdate: () => (el.textContent = DY.brl(Math.round(o.v))) }); } else el.textContent = DY.brl(total);
    $('[data-eco]', box).textContent = DY.brl(s.economiaMes || 0); $('[data-cmb-eco]', box).hidden = !on('luz');
    const qtos = ['luz', 'net', 'cel'].filter(on).length;
    $('[data-cmb-ir]', box).href = `/contratar?origem=combo${on('luz') ? '&conta=' + cmb.luz : ''}${on('net') ? '&plano=' + cmb.net : ''}${on('cel') ? '&linhas=' + cmb.linhas : ''}`;
    const nomes = [on('luz') && `energia solar (conta de R$ ${partes(cmb.luz).i})`, on('net') && `internet de ${milhar(pn.num)} Mega`, on('cel') && `${cmb.linhas} ${cmb.linhas > 1 ? 'linhas' : 'linha'} de celular de ${pc.gb} GB`].filter(Boolean);
    const zap = $('[data-cmb-zap]', box); zap.href = DY.linkWhatsApp(`Olá! Quero montar um combo com ${nomes.join(', ').replace(/, ([^,]*)$/, ' e $1') || 'os serviços da Do Yourself'}.`); zap.target = '_blank'; zap.rel = 'noopener';
    box.classList.toggle('is-vazio', qtos === 0);
  }
  { const box = $('[data-combo]'); if (box) {
    box.addEventListener('change', (e) => { if (e.target.matches('[data-cmb-on]')) combo(); });
    box.addEventListener('click', (e) => {
      const l = e.target.closest('[data-cmb-luz-v]'), n = e.target.closest('[data-cmb-net-v]'), q = e.target.closest('[data-cmb-l]');
      if (l) cmb.luz = +l.dataset.cmbLuzV; else if (n) cmb.net = n.dataset.cmbNetV; else if (q) cmb.linhas = Math.max(1, Math.min(ESP, cmb.linhas + +q.dataset.cmbL)); else return;
      combo();
    });
  } }

  /* WTTx: internet sem fio 4G para empresas. Planos pela franquia, do menor para o maior */
  const wtx_ = $('[data-wtx]'); const tWtx = wtx_ ? trilho(wtx_) : null;
  const zapWtx = (p) => DY.linkWhatsApp(`Olá! Quero o WTTx ${p.gb}GB (internet sem fio) para a minha empresa.`);
  function cardWtx(p) {
    return `<article class="pc pc--wtx" data-id="${p.id}">
      <span class="pc__selo">${p.selo}</span>
      <p class="pc__vel"><b>${p.gb}</b><span>GB</span></p>
      <p class="pc__sub">Franquia mensal · ${p.mbps} Mbps de velocidade</p>
      <div class="pc__op"><p class="pc__op-t">O plano inclui</p><ul class="pc__inc"><li>Modem Wi-Fi com chip</li><li>Sem instalação: é só ligar na tomada</li><li>7 dias para testar a cobertura</li></ul></div>
      <div class="pc__pe">${precoHtml(p.preco, p.id)}
      <div class="cbw">${cbHtml({ plano: `WTTx ${p.gb} GB`, preco: c(p.preco), valor: cb(p.preco, 50), tipo: 'wtx' })}</div>
      <a class="pc__btn" href="${zapWtx(p)}" target="_blank" rel="noopener">Quero este plano</a>
      ${btDet}</div>
      ${painelDet(`WTTx ${p.gb} GB`, [['Franquia', `${p.gb} GB por mês`], ['Velocidade', `${p.mbps} Mbps`], ['Modem', 'Incluso no plano. Se cancelar, você devolve'], ['Instalação', 'Não precisa: ligue na tomada e navegue'], ['Ativação do chip', 'Em média 48 horas depois de receber'], ['Teste', '7 dias. Se a cobertura não agradar, você devolve sem custo'], ['Suporte', 'Pelo WhatsApp da Do Yourself']], '')}</article>`;
  }
  function desenhaWtx() {
    if (!wtx_) return; const cards = $('.cards', wtx_);
    const lista = [...DY.wttx].sort((a, b) => a.gb - b.gb);
    cards.style.setProperty('--n', lista.length);
    cards.innerHTML = lista.map(cardWtx).join('');
    tWtx.desenhou();
    $$('[data-wtx-min]').forEach((e) => (e.textContent = brl(Math.min(...lista.map((p) => p.preco)))));
  }

  document.addEventListener('dy:planos', () => { desenhaNet(false); desenhaCel(false); });
  desenhaNet(false); desenhaCel(false); desenhaWtx();

  /* ---------- Animações (GSAP + ScrollTrigger) ---------- */
  if (temGsap) {
    document.documentElement.classList.add('gs');
    gsap.registerPlugin(ScrollTrigger);
    // os objetos 3D flutuam devagar
    $$('.obj').forEach((o, i) => gsap.to(o, { y: i % 2 ? 14 : -14, rotation: i % 2 ? 2 : -2, duration: 3.2 + (i % 3) * .5, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    // entrada do topo
    if ($('.topo__cena')) {
    gsap.from('.topo__cena .obj', { y: 60, scale: .85, autoAlpha: 0, duration: 1, stagger: .14, ease: 'back.out(1.6)', delay: .15 });
    gsap.from('.topo__cena .tag', { y: 16, autoAlpha: 0, duration: .6, stagger: .12, ease: 'power3.out', delay: .7 });
    }
    if ($('.topo__cep')) gsap.from('.topo__cep', { y: 30, autoAlpha: 0, duration: .8, ease: 'power3.out', delay: .35 });
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

/* "Como funciona a contratação": a rolagem avança os 5 passos; clicar num passo leva até ele */
(() => {
  const raiz = document.querySelector('[data-jornada]'); if (!raiz) return;
  const pista = raiz.querySelector('.jo__pista');
  const passos = [...raiz.querySelectorAll('.jo__p')];
  const cenas = [...raiz.querySelectorAll('.jo__cena')];
  const selo = raiz.querySelector('[data-jo-selo]');
  const N = cenas.length; let atual = 0;
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gs = window.gsap && !calmo;
  function ir(i) {
    if (i === atual) return; const ant = cenas[atual]; const nova = cenas[i]; const desce = i > atual; atual = i;
    passos.forEach((p, k) => { p.classList.toggle('is-on', k === i); p.classList.toggle('is-feito', k < i); });
    selo.textContent = `Passo ${i + 1} de ${N}`;
    cenas.forEach((c) => c !== ant && c !== nova && c.classList.remove('is-on'));
    nova.classList.add('is-on');
    if (gs) {
      gsap.killTweensOf([ant, nova, ...nova.querySelectorAll('.jo__obj, .jo__trio, .jo__ui')]);
      gsap.to(ant, { autoAlpha: 0, scale: .97, duration: .35, ease: 'power2.in', onComplete: () => { if (ant !== cenas[atual]) ant.classList.remove('is-on'); gsap.set(ant, { clearProps: 'all' }); } });
      gsap.fromTo(nova, { autoAlpha: 0, scale: 1.02 }, { autoAlpha: 1, scale: 1, duration: .45, ease: 'power2.out' });
      gsap.fromTo(nova.querySelectorAll('.jo__obj, .jo__trio'), { y: desce ? 40 : -40, rotate: desce ? -8 : 8, autoAlpha: 0 }, { y: 0, rotate: 0, autoAlpha: 1, duration: .7, ease: 'back.out(1.6)', delay: .1 });
      gsap.fromTo(nova.querySelector('.jo__ui'), { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .55, ease: 'power3.out', delay: .18 });
      gsap.fromTo(selo, { scale: .85 }, { scale: 1, duration: .4, ease: 'back.out(3)' });
    } else ant.classList.remove('is-on');
  }
  function noScroll() {
    const r = pista.getBoundingClientRect(); const curso = r.height - innerHeight;
    const prog = Math.min(1, Math.max(0, -r.top / Math.max(1, curso)));
    ir(Math.min(N - 1, Math.floor(prog * N * 0.999)));
  }
  addEventListener('scroll', noScroll, { passive: true }); addEventListener('resize', noScroll); noScroll();
  passos.forEach((p, k) => p.querySelector('button').addEventListener('click', () => {
    const topo = pista.getBoundingClientRect().top + scrollY; const curso = pista.offsetHeight - innerHeight;
    scrollTo({ top: topo + curso * ((k + .5) / N), behavior: calmo ? 'auto' : 'smooth' });
  }));
})();

/* menu: some ao rolar para baixo e volta ao rolar para cima (fica sempre visível no topo da página) */
(() => {
  const nav = document.querySelector('header.nav'); if (!nav) return;
  let ultimo = scrollY, acumulado = 0;
  const mostra = (v) => { nav.classList.toggle('nav--some', !v); document.documentElement.classList.toggle('nav-oculto', !v); };
  // no alto da página a barra fica transparente e mostra a cor do topo; ao rolar, vira vidro translúcido
  const temTopo = !!document.querySelector('main > section.topo');
  const topo = () => nav.classList.toggle('nav--topo', temTopo && scrollY < 8);
  topo();
  addEventListener('scroll', () => {
    topo();
    const y = scrollY, d = y - ultimo; ultimo = y;
    if (nav.classList.contains('is-open') || nav.matches(':focus-within') && d > 0 && nav.querySelector('.nav__item:hover')) return;
    if (y < 140) { acumulado = 0; mostra(true); return; }
    acumulado = Math.sign(d) === Math.sign(acumulado) ? acumulado + d : d;
    if (acumulado > 12) mostra(false); else if (acumulado < -8) mostra(true);
  }, { passive: true });
})();

/* cashback: o selinho abre uma janela que explica, com o valor do plano escolhido */
(() => {
  const j = document.createElement('dialog'); j.className = 'cbm'; j.setAttribute('aria-labelledby', 'cbm-t');
  j.innerHTML = `<div class="cbm__caixa">
    <button type="button" class="cbm__x" aria-label="Fechar" data-cbm-fechar>×</button>
    <img class="cbm__obj" src="/img/3d-g/cashback.webp" alt="">
    <p class="cbm__eyebrow">Cashback, o que é isso?</p>
    <h3 id="cbm-t">Parte do que você paga volta para você no PIX</h3>
    <div class="cbm__txt" data-cbm-txt></div>
    <ol class="cbm__passos" data-cbm-passos></ol>
    <p class="cbm__nota" data-cbm-nota></p>
    <button type="button" class="cbm__ok" data-cbm-fechar>Entendi</button>
  </div>`;
  document.body.append(j);
  const $j = (s) => j.querySelector(s);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.cb'); if (b) {
      const nb = (t) => String(t).replace(/ /g, '\u00a0');
      const d = b.dataset, preco = nb(DY.brl(+d.cbPreco)), valor = nb(DY.brl(+d.cbValor)), n = +d.cbLinhas;
      const cel = d.cbTipo === 'cel', wtx = d.cbTipo === 'wtx';
      const plano = cel ? (n > 1 ? `${n} linhas do plano de ${nb(d.cbPlano)}` : `1 linha do plano de ${nb(d.cbPlano)}`) : `o plano de ${d.cbPlano.replace(/^(\S+) Mega/, (m) => nb(m))}`;
      $j('[data-cbm-txt]').innerHTML = `<p>Se você contratar <b>${plano}</b>, você paga <b class="nw">${preco} por mês</b>, que é o valor da mensalidade.</p>
        <p>${cel ? 'Com as linhas ativadas e o contrato concluído' : wtx ? 'Com o chip do modem ativado e o contrato concluído' : 'Depois da instalação, com o contrato concluído'}, você recebe <b class="cbm__v nw">${valor}</b> em forma de <b>Cashback</b>, direto na sua conta, via PIX.</p>`;
      $j('[data-cbm-passos]').innerHTML = `<li><b>Você contrata</b><span>Pelo site, em poucos minutos</span></li>
        ${cel ? `<li><b>${n > 1 ? 'Suas linhas são ativadas' : 'Sua linha é ativada'}</b><span>Com número novo ou com o seu, pela portabilidade</span></li>` : wtx ? '<li><b>Você recebe o modem</b><span>Liga na tomada e o chip é ativado</span></li>' : '<li><b>Sua internet é instalada</b><span>Em até 48 horas, sem custo</span></li>'}
        <li><b>Você recebe ${valor} no PIX</b><span>Em até 7 dias depois do contrato concluído</span></li>`;
      $j('[data-cbm-nota]').innerHTML = cel
        ? 'O <b>Cashback</b> é pago uma única vez: o valor de uma mensalidade inteira, por linha contratada.'
        : 'O <b>Cashback</b> é pago uma única vez: metade de uma mensalidade do plano escolhido.';
      j.showModal();
      if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo($j('.cbm__caixa'), { y: 30, scale: .96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: .45, ease: 'back.out(1.6)' });
        gsap.fromTo($j('.cbm__obj'), { y: 20, rotate: -12 }, { y: 0, rotate: 0, duration: .7, ease: 'back.out(2)', delay: .05 });
        gsap.from(j.querySelectorAll('.cbm__passos li'), { x: -14, autoAlpha: 0, duration: .35, stagger: .08, delay: .2 });
      }
      return;
    }
    if (e.target.closest('[data-cbm-fechar]') || e.target === j) j.close();
  });
})();

