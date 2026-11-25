/* Do Yourself v2 — internet com streaming
   1. TV: aplicativo, plano, preço e Cashback (js/config.js)   2. Teste de gosto   3. Mesmo preço no 600   4. TVs em 4K */
(function () {
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const radios = (bts, fn) => bts.forEach((b, i) => {
    const vai = (x) => { bts.forEach((y) => { y.setAttribute('aria-checked', y === x); y.tabIndex = y === x ? 0 : -1; }); fn(x); };
    b.addEventListener('click', () => vai(b));
    b.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (d) { e.preventDefault(); const x = bts[(i + d + bts.length) % bts.length]; vai(x); x.focus(); } });
  });
  const APPS = {
    paramount: { n: 'Paramount+', art: 'o', re: /paramount/i, planos: ['600', '1000'], pg: 'paramount', h: 'Filmes, séries e futebol', p: 'Mais de 10 mil títulos, com os desenhos da Nickelodeon.', f: ['2 telas ao mesmo tempo', 'Baixe e veja sem internet'], t: ['Yellowstone', 'Top Gun: Maverick', 'South Park', 'Libertadores'] },
    globoplay: { n: 'Globoplay', art: 'o', re: /globo/i, planos: ['600'], pg: 'globoplay', h: 'A Globo na hora que você quiser', p: 'Novelas, séries, realities e 8 canais ao vivo. Com anúncios.', f: ['3 telas ao mesmo tempo', 'TV Globo ao vivo'], t: ['TV Globo ao vivo', 'BBB', 'Vale Tudo', 'Arcanjo Renegado'] },
    youtube: { n: 'YouTube Premium', art: 'o', re: /youtube/i, planos: ['800'], pg: 'youtube', h: 'YouTube sem anúncio', p: 'O som continua com a tela do celular bloqueada.', f: ['YouTube Music Premium junto', 'Baixe e veja sem internet'], t: ['Sem anúncios', 'YouTube Music', 'Segundo plano', 'Downloads'] },
    hbo: { n: 'HBO Max', art: 'a', re: /hbo/i, planos: ['1000'], pg: 'hbo-max', h: 'As séries que todo mundo comenta', p: 'HBO, Warner, DC e esporte ao vivo. Com anúncios.', f: ['2 telas e até 5 perfis', 'Até 30 downloads'], t: ['A Casa do Dragão', 'The Last of Us', 'Game of Thrones', 'Superman'] },
  };
  const nome = (id) => (id === '1000' ? '1.000' : id) + ' Mega';
  const op = (id, re) => { const p = (DY.catalogo.casa[DY.blocoInternet(DY.uf || 'PR')] || []).find((x) => x.id === id); return p && p.opcoes.find((o) => re.test([o.nome, o.resumo, o.logo].join(' '))); };
  const cb = (c) => DY.brl(DY.cashbackCentavos(c, 50));

  /* 1. a TV */
  const tv = $('[data-st-tv]'); let app = 'paramount', plano = '600';
  const preco = () => {
    const a = APPS[app], o = op(plano, a.re); if (!o) return;
    const c = DY.centavos(o.preco);
    $('[data-st-v]', tv).textContent = DY.brl(c); $('[data-st-cb]', tv).textContent = cb(c);
    $('[data-st-ir]', tv).href = `/contratar?origem=internet&para=casa&plano=${plano}&opcao=${encodeURIComponent(o.nome)}`;
  };
  const planos = () => {
    const a = APPS[app], box = $('[data-st-pl]', tv), l = a.planos.filter((id) => op(id, a.re));
    if (!l.includes(plano)) plano = l[0];
    box.innerHTML = l.map((id) => `<button type="button" role="radio" aria-checked="${id === plano}" tabindex="${id === plano ? 0 : -1}" data-p="${id}">${nome(id)}</button>`).join('');
    radios($$('button', box), (b) => { plano = b.dataset.p; preco(); }); preco();
  };
  const liga = (x) => {
    app = x; const a = APPS[x]; tv.dataset.app = x;
    const l = $('[data-st-l]', tv), n = l.cloneNode(false); n.append($(`button[data-app="${x}"] .st-lg`, tv).cloneNode(true)); l.replaceWith(n);
    $('[data-st-tit]', tv).innerHTML = a.t.map((t) => `<li>${t}</li>`).join('');
    $('[data-st-h]', tv).textContent = a.h; $('[data-st-p]', tv).textContent = a.p;
    $('[data-st-f]', tv).innerHTML = a.f.map((t) => `<li>${t}</li>`).join('');
    const m = $('[data-st-mais]', tv); m.href = '/aplicativos/' + a.pg; m.textContent = `Conhecer ${a.art} ${a.n}`;
    plano = a.planos[0]; planos();
  };
  const bts = $$('button[data-app]', tv);
  radios(bts, (b) => liga(b.dataset.app));

  /* 3. menor preço, mesmo preço no 600 */
  const resto = () => {
    const todos = Object.values(APPS).flatMap((a) => a.planos.map((id) => op(id, a.re))).filter(Boolean).map((o) => DY.centavos(o.preco)), min = Math.min(...todos);
    $('[data-st-min]').textContent = DY.brl(min); $('[data-st-mincb]').textContent = cb(min);
    const p = (DY.catalogo.casa[DY.blocoInternet(DY.uf || 'PR')] || []).find((x) => x.id === '600'), so = p && p.opcoes.find((o) => !Object.values(APPS).some((a) => a.re.test([o.nome, o.resumo, o.logo].join(' ')))), par = op('600', APPS.paramount.re), sec = $('[data-st-mp]');
    sec.hidden = !(so && par && so.preco === par.preco);
    if (!sec.hidden) { $('[data-st-a]').textContent = DY.brl(DY.centavos(so.preco)); $('[data-st-b]').textContent = DY.brl(DY.centavos(par.preco)); }
    $$('[data-gm-uf]').forEach((x) => (x.textContent = DY.UFS[DY.uf || 'PR'] || DY.uf));
  };
  liga('paramount'); resto();
  document.addEventListener('dy:planos', () => { planos(); resto(); });

  /* 2. gosto */
  const go = $('[data-st-go]'), chips = $$('button[data-de]', go), ver = $('[data-st-ver]', go); let melhor = null;
  const conta = () => {
    const n = { paramount: 0, globoplay: 0, youtube: 0, hbo: 0 }; chips.forEach((c) => { if (c.getAttribute('aria-pressed') === 'true') n[c.dataset.de]++; });
    const mx = Math.max(...Object.values(n)), top = Object.keys(n).filter((k) => n[k] === mx && mx);
    $$('[data-bar]', go).forEach((b) => { b.style.setProperty('--w', (n[b.dataset.bar] / 3) * 100 + '%'); b.classList.toggle('is-on', top.includes(b.dataset.bar)); });
    melhor = top[0] || null; ver.hidden = !melhor;
    const ns = top.map((k) => `${APPS[k].art} ${APPS[k].n}`);
    $('[data-st-rt]', go).textContent = !top.length ? 'Marque um gosto para ver a sugestão.' : top.length === 1 ? `Combina com ${APPS[melhor].art} ${APPS[melhor].n}.` : `Empate entre ${ns.slice(0, -1).join(', ')} e ${ns[ns.length - 1]}. Marque mais um.`;
    ver.hidden = top.length !== 1;
  };
  chips.forEach((c) => c.addEventListener('click', () => { c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true'); conta(); }));
  ver.addEventListener('click', () => { const b = bts.find((x) => x.dataset.app === melhor); if (b) b.click(); });

  /* 4. TVs em 4K */
  const k = $('[data-st-4k]'), r = $('input', k), ts = $$('.st-4k__t i', k);
  const telas = () => {
    const n = +r.value, u = n * 25;
    $('[data-st-n]', k).textContent = n; ts.forEach((t, i) => t.classList.toggle('is-on', i < n));
    $$('li[data-m]', k).forEach((l) => { const m = +l.dataset.m; l.style.setProperty('--w', (u / m) * 100 + '%'); $('b', l).textContent = `sobram ${m - u} Mega`; });
    $('[data-st-c]', k).textContent = `${n} ${n === 1 ? 'TV usa' : 'TVs usam'} perto de ${u} Mega. O resto fica para os celulares, o trabalho e os jogos.`;
  };
  r.addEventListener('input', telas); telas();
})();
