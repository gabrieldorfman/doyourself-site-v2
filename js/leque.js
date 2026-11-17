/* Do Yourself v2 — leque de planos de internet
   Desktop (1024+): o plano escolhido aberto e os outros como tarjas dos lados; clicar numa tarja abre o plano.
   Celular e tablet: os planos lado a lado, arrastando para os lados.
   Dados: DY.catalogo (js/config.js). Ao trocar o estado, os cartões saem e voltam e os preços contam até o valor novo. */
(function () {
  const APPS = {
    'aya-books': ['/img/apps/aya-books.png', 'Aya Books'],
    'aya-bancah': ['/img/apps/aya-bancah.png', 'Aya Bancah'],
    'paramount': ['/img/apps/paramount-44.svg', 'Paramount+'],
    'paramount-44': ['/img/apps/paramount-44.svg', 'Paramount+'],
    'youtube-premium': ['/img/apps/youtube-premium-logo.svg', 'YouTube Premium'],
    'hbo-max': ['/img/apps/hbo-max.png', 'HBO Max'],
    'globoplay': ['/img/apps/globoplay.png', 'Globoplay'],
  };
  const ICO = {
    down: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path d="M10 5v9M6.5 10.5 10 14l3.5-3.5"/></svg>',
    up: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path d="M10 15V6M6.5 9.5 10 6l3.5 3.5"/></svg>',
    wifi: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8a10 10 0 0 1 14 0M5.5 10.6a6.5 6.5 0 0 1 9 0M8 13.2a3 3 0 0 1 4 0"/><circle cx="10" cy="15.6" r="1"/></svg>',
    tool: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path d="M6 10.2 8.8 13 14 7.6"/></svg>',
  };
  const brl = (v) => DY.brl(Math.round(v * 100));
  const partes = (v) => { const [i, c] = v.toFixed(2).split('.'); return { i: i.replace(/\B(?=(\d{3})+(?!\d))/g, '.'), c }; };
  const cb = (v) => DY.brl(DY.cashbackCentavos(Math.round(v * 100), 50));
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(raiz) {
    const st = { tipo: 'casa', sel: null, op: {} };
    const palco = raiz.querySelector('[data-lq-palco]');
    const pontos = raiz.querySelector('[data-lq-pontos]');
    const aviso = raiz.querySelector('[data-lq-aviso]');
    const nomeUf = raiz.querySelectorAll('[data-lq-uf]');
    const selUf = raiz.querySelector('[data-lq-select]');
    let ultimoPreco = {};

    Object.entries(DY.UFS).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR')).forEach(([uf, n]) => selUf.add(new Option(n, uf)));

    const lista = () => DY.planosInternet;
    const opcao = (p) => p.opcoes[st.op[p.id] ?? p.opcaoPadrao ?? 0] || p.opcoes[0];
    const linkPlano = (p) => '/contratar?origem=internet&para=' + st.tipo + '&plano=' + encodeURIComponent(p.id) + '&opcao=' + encodeURIComponent(opcao(p).nome);
    const det = (p, rotulo) => (p.detalhes.find((d) => d[1].startsWith(rotulo)) || [])[2] || '';

    function preco(p, grande) {
      const o = opcao(p); const { i, c } = partes(o.preco);
      return `<p class="lq-preco${grande ? ' lq-preco--g' : ''}"><span class="lq-preco__rs">R$</span><span class="lq-preco__i" data-lq-num data-v="${o.preco}" data-id="${p.id}">${i}</span><span class="lq-preco__c">,${c}</span><span class="lq-preco__m">/mês</span></p>`;
    }
    function apps(p, max) {
      const ids = [...new Set((p.apps || []).map((a) => (a === 'paramount-44' ? 'paramount' : a)))];
      const st2 = (p.tarja && p.tarja.streaming) || [];
      const foco = max ? ids.filter((a) => st2.includes(a) || a === 'youtube-premium').slice(0, max) : ids;
      return foco.filter((a) => APPS[a]).map((a) => `<img src="${APPS[a][0]}" alt="${APPS[a][1]}" title="${APPS[a][1]}" loading="lazy">`).join('');
    }
    function opcoesHtml(p) {
      if (p.opcoes.length < 2) {
        const o = p.opcoes[0];
        return `<div class="lq-inclui"><span>${o.logo && APPS[o.logo] ? `<img src="${APPS[o.logo][0]}" alt="">` : ''}${o.nome === 'Somente Internet' ? 'Somente internet' : o.nome}</span><b>${o.incluso || 'incluso'}</b></div>`;
      }
      return `<div class="lq-ops" role="radiogroup" aria-label="Escolha o plano">` + p.opcoes.map((o, k) => {
        const on = opcao(p) === o;
        const nome = o.nome === 'Somente Internet' ? (p.id === '1000' ? 'Internet + NoPing' : 'Somente internet') : o.nome;
        return `<button type="button" role="radio" aria-checked="${on}" class="lq-op${on ? ' is-on' : ''}" data-lq-op="${k}" data-id="${p.id}">${o.logo && APPS[o.logo] ? `<img src="${APPS[o.logo][0]}" alt="">` : '<span class="lq-op__dot"></span>'}<span>${nome}</span><b>${brl(o.preco)}</b></button>`;
      }).join('') + `</div>`;
    }
    function aberto(p) {
      const o = opcao(p);
      const cnpj = st.tipo === 'empresa';
      return `
      <div class="lq-abre">
        <div class="lq-col">
          <span class="lq-selo">${p.selo}</span>
          <p class="lq-num"><b>${p.num}</b> Mega</p>
          <ul class="lq-det">
            <li>${ICO.down}<span>Download</span><b>${det(p, 'Download')}</b></li>
            <li>${ICO.up}<span>Upload</span><b>${det(p, 'Upload')}</b></li>
            <li>${ICO.wifi}<span>Modem</span><b>${det(p, 'Modem').replace(' incluso', '')}</b></li>
            <li>${ICO.tool}<span>Instalação</span><b>Grátis, em até 48 h</b></li>
          </ul>
          <p class="lq-rot">Apps inclusos neste plano</p>
          <div class="lq-apps">${apps(p)}</div>
        </div>
        <div class="lq-col lq-col--compra">
          <p class="lq-rot">${p.tituloAcao}</p>
          ${opcoesHtml(p)}
          <p class="lq-resumo">O seu plano: <b>${o.resumo}</b></p>
          <p class="lq-de">De ${brl(o.de || p.de)}</p>
          ${preco(p, true)}
          <p class="lq-pag">no débito em conta · ${brl(o.preco + 10)} no boleto ou PIX</p>
          ${p.nota ? `<p class="lq-nota">${p.nota}</p>` : ''}
          ${cnpj ? '<p class="lq-nota">Planos para CNPJ não têm streaming.</p>' : ''}
          <div class="lq-cb"><span>Cashback de 50%</span><b>Você recebe ${cb(o.preco)}</b></div>
          <a class="lq-btn" href="${linkPlano(p)}">Contratar este plano</a>
        </div>
      </div>`;
    }
    function tarja(p) {
      return `
      <div class="lq-tarja" aria-hidden="true">
        <span class="lq-selo">${p.selo}</span>
        <p class="lq-num lq-num--t"><b>${p.num}</b><small>Mega</small></p>
        <div class="lq-tarja__pe">
          <div class="lq-apps lq-apps--p">${apps(p, 3)}</div>
          ${preco(p)}
          <p class="lq-pag">no débito</p>
        </div>
      </div>`;
    }
    // cartão compacto do celular e do tablet
    function compacto(p) {
      const o = opcao(p);
      return `
      <div class="lq-mini">
        <span class="lq-selo">${p.selo}</span>
        <p class="lq-num"><b>${p.num}</b> Mega</p>
        <ul class="lq-det lq-det--p">
          <li>${ICO.down}<span>Download</span><b>${det(p, 'Download')}</b></li>
          <li>${ICO.up}<span>Upload</span><b>${det(p, 'Upload')}</b></li>
          <li>${ICO.wifi}<span>Modem</span><b>${det(p, 'Modem').replace(' incluso', '')}</b></li>
        </ul>
        <div class="lq-apps">${apps(p)}</div>
        ${opcoesHtml(p)}
        <div class="lq-mini__pe">
          <p class="lq-de">De ${brl(o.de || p.de)}</p>
          ${preco(p, true)}
          <p class="lq-pag">no débito em conta</p>
          ${p.nota ? `<p class="lq-nota">${p.nota}</p>` : ''}
          <div class="lq-cb"><span>Cashback de 50%</span><b>${cb(o.preco)}</b></div>
          <a class="lq-btn" href="${linkPlano(p)}">Contratar este plano</a>
        </div>
      </div>`;
    }

    function desenhar(animar) {
      const ps = lista();
      if (st.sel == null || !ps.find((p) => p.id === st.sel)) st.sel = ps[DY.padraoInternet(ps)].id;
      const iSel = ps.findIndex((p) => p.id === st.sel);
      palco.innerHTML = ps.map((p, i) => {
        const on = i === iSel;
        const z = 20 - Math.abs(i - iSel);
        return `<article class="lq-card lq--${p.variante}${on ? ' is-on' : ''}" data-id="${p.id}" style="--z:${z};--i:${i}" ${on ? '' : 'tabindex="0" role="button"'} aria-label="${p.num} Mega, ${brl(opcao(p).preco)} por mês${on ? '' : ', abrir'}">
          ${tarja(p)}${aberto(p)}${compacto(p)}
        </article>`;
      }).join('');
      pontos.innerHTML = ps.map((p, i) => `<button type="button" class="${i === iSel ? 'is-on' : ''}" data-lq-ponto="${p.id}" aria-label="${p.num} Mega"></button>`).join('');
      nomeUf.forEach((n) => (n.textContent = DY.UFS[DY.uf]));
      selUf.value = DY.uf;
      if (animar) contar();
      guardar();
      if (matchMedia('(max-width: 1199px)').matches) requestAnimationFrame(() => requestAnimationFrame(() => centrar(false)));
    }
    function guardar() { ultimoPreco = {}; lista().forEach((p) => (ultimoPreco[p.id] = opcao(p).preco)); }
    // os preços contam do valor antigo até o novo
    let antigos = {};
    function contar() {
      if (reduz) return;
      palco.querySelectorAll('[data-lq-num]').forEach((el) => {
        const de = antigos[el.dataset.id], ate = +el.dataset.v;
        if (de == null || de === ate) return;
        el.closest('.lq-preco').classList.add('is-mudou');
        const t0 = performance.now(), dur = 650;
        const passo = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = partes(de + (ate - de) * e).i; if (k < 1) requestAnimationFrame(passo); else el.textContent = partes(ate).i; };
        requestAnimationFrame(passo);
      });
    }
    function trocar(fn, msg) {
      antigos = { ...ultimoPreco };
      if (reduz) { fn(); desenhar(false); avisar(msg); return; }
      palco.classList.add('is-saindo');
      setTimeout(() => { fn(); desenhar(true); palco.classList.remove('is-saindo'); palco.classList.add('is-entrando'); setTimeout(() => palco.classList.remove('is-entrando'), 700); avisar(msg); }, 220);
    }
    let tAviso;
    function avisar(msg) {
      if (!msg) return;
      aviso.textContent = msg; aviso.classList.remove('is-on'); void aviso.offsetWidth; aviso.classList.add('is-on');
      clearTimeout(tAviso); tAviso = setTimeout(() => aviso.classList.remove('is-on'), 3200);
    }
    function abrir(id, rolar) {
      if (id === st.sel) return;
      antigos = {}; st.sel = id; desenhar(false);
      if (rolar) raiz.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
      if (matchMedia('(max-width: 1199px)').matches) centrar(true);
    }
    function centrar(suave) {
      const c = palco.querySelector('.lq-card.is-on'); if (!c) return;
      palco.scrollTo({ left: c.offsetLeft - (palco.clientWidth - c.offsetWidth) / 2, behavior: suave && !reduz ? 'smooth' : 'auto' });
    }

    palco.addEventListener('click', (e) => {
      const op = e.target.closest('[data-lq-op]');
      if (op) { st.op[op.dataset.id] = +op.dataset.lqOp; st.sel = op.dataset.id; const y = scrollY; antigos = { ...ultimoPreco }; desenhar(true); scrollTo(0, y); return; }
      if (e.target.closest('a')) return;
      const c = e.target.closest('.lq-card');
      if (c && !c.classList.contains('is-on') && matchMedia('(min-width: 1200px)').matches) abrir(c.dataset.id);
    });
    palco.addEventListener('keydown', (e) => { const c = e.target.closest('.lq-card:not(.is-on)'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrir(c.dataset.id); } });
    pontos.addEventListener('click', (e) => { const b = e.target.closest('[data-lq-ponto]'); if (b) abrir(b.dataset.lqPonto); });
    // no celular, o cartão no meio da tela vira o escolhido
    let tRol;
    palco.addEventListener('scroll', () => {
      if (!matchMedia('(max-width: 1199px)').matches) return;
      clearTimeout(tRol); tRol = setTimeout(() => {
        const meio = palco.scrollLeft + palco.clientWidth / 2; let melhor, dist = 1e9;
        palco.querySelectorAll('.lq-card').forEach((c) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - meio); if (d < dist) { dist = d; melhor = c; } });
        if (melhor && melhor.dataset.id !== st.sel) { st.sel = melhor.dataset.id; palco.querySelectorAll('.lq-card').forEach((c) => c.classList.toggle('is-on', c === melhor)); pontos.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b.dataset.lqPonto === st.sel)); }
      }, 90);
    }, { passive: true });

    raiz.querySelectorAll('[data-lq-tipo]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.lqTipo === st.tipo) return;
      raiz.querySelectorAll('[data-lq-tipo]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      trocar(() => { st.tipo = b.dataset.lqTipo; st.sel = null; DY.definirPlanos({ tipo: st.tipo }); }, b.dataset.lqTipo === 'empresa' ? 'Mostrando os planos para empresa (CNPJ)' : 'Mostrando os planos para casa (CPF)');
    }));
    selUf.addEventListener('change', () => {
      const uf = selUf.value;
      try { localStorage.setItem('dy_local', JSON.stringify({ uf, cidade: '' })); } catch (e) { /* sem storage */ }
      trocar(() => DY.definirPlanos({ uf }), 'Preços atualizados para ' + DY.UFS[uf]);
      document.dispatchEvent(new CustomEvent('dy:uf'));
    });
    document.addEventListener('dy:planos', () => desenhar(false));
    // atalhos de outras partes da página: <a data-lq-abrir="1000">
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-lq-abrir]'); if (!a) return;
      e.preventDefault();
      const [tipo, id] = a.dataset.lqAbrir.split(':');
      if (tipo !== st.tipo) { raiz.querySelector(`[data-lq-tipo="${tipo}"]`).click(); setTimeout(() => abrir(id, true), 260); } else abrir(id, true);
      setTimeout(() => raiz.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' }), 30);
    });
    let largo = matchMedia('(min-width: 1200px)').matches;
    addEventListener('resize', () => { const l = matchMedia('(min-width: 1200px)').matches; if (l !== largo) { largo = l; desenhar(false); } });
    desenhar(false);
  }
  document.querySelectorAll('[data-leque]').forEach(init);
})();
