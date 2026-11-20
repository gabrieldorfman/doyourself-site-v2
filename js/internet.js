/* Do Yourself v2 — páginas de internet
   Tabela "Compare os planos": monta as colunas a partir do catálogo do estado escolhido
   e redesenha quando o estado muda (evento dy:planos). */
(function () {
  const tabela = document.querySelector('[data-cmp]');
  if (!tabela || !window.DY) return;

  const brl = (v) => DY.brl(Math.round(v * 100));
  const milhar = (n) => String(n).replace(/^(\d)(\d{3})$/, '$1.$2');
  const val = (p, k) => ((p.detalhes || []).find((d) => d[1].startsWith(k)) || [])[2] || '';

  // streaming de cada plano (o 1.000 Mega sem streaming vem com NoPing por 6 meses)
  const STREAM = {
    '600': ['Paramount+ ou Globoplay', 'você escolhe um'],
    '800': ['YouTube Premium', 'incluso'],
    '1000': ['NoPing, Paramount+ ou HBO Max', 'você escolhe um'],
    '2000': ['HBO Max, Paramount+, Globoplay e Looke', 'os quatro inclusos'],
  };
  // aplicativos de conteúdo (nomes genéricos), com a observação de quando muda conforme o streaming
  const APPS = {
    '300': ['Audiolivros, cursos, revistas digitais e antivírus'],
    '400': ['Audiolivros, cursos, revistas digitais e antivírus'],
    '500': ['Audiolivros, cursos e revistas digitais'],
    '600': ['Audiolivros, cursos, revistas digitais e antivírus', 'Com Globoplay: audiolivros e cursos'],
    '800': ['Audiolivros, cursos e antivírus'],
    '1000': ['Audiolivros, cursos, revistas digitais, idiomas e antivírus', 'Com Paramount+, sem o curso de idiomas'],
    '2000': ['Audiolivros, cursos, revistas digitais, idiomas e antivírus'],
  };
  const PAGINA = { '500': '/internet/casa/500-mega', '600': '/internet/casa/600-mega', '800': '/internet/casa/800-mega', '1000': '/internet/casa/1000-mega', '2000': '/internet/casa/2000-mega' };
  const PAGINAS_PRONTAS = new Set(); // as páginas de cada velocidade entram aqui quando estiverem no ar

  function desenha() {
    const lista = DY.catalogo.casa[DY.blocoInternet(DY.uf)].slice().sort((a, b) => a.num - b.num);
    const col = (p) => (p.selo === 'OFERTA DO MÊS' ? ' class="is-dest"' : '');
    const linha = (rot, fn, cls = '') => `<tr${cls ? ` class="${cls}"` : ''}><th scope="row">${rot}</th>${lista.map((p) => `<td${col(p)}>${fn(p)}</td>`).join('')}</tr>`;
    const menor = (p) => p.opcoes.reduce((m, o) => (o.preco < m.preco ? o : m), p.opcoes[0]);
    const cab = `<thead><tr><td class="cmp__canto">Plano</td>${lista.map((p) => `<th scope="col"${col(p)}><span class="cmp__selo">${p.selo === 'OFERTA DO MÊS' ? 'Oferta do mês' : p.id === '2000' ? 'O máximo' : '&nbsp;'}</span><span class="cmp__vel"><b>${milhar(p.num)}</b> Mega</span></th>`).join('')}</tr></thead>`;
    const corpo = [
      linha('Download', (p) => `${milhar(p.num)} Mega`),
      linha('Upload', (p) => val(p, 'Upload')),
      linha('Wi-Fi do modem', (p) => val(p, 'Modem').replace(' incluso', '')),
      linha('Streaming', (p) => (STREAM[p.id] ? `${STREAM[p.id][0]}<small>${STREAM[p.id][1]}</small>` : '<span class="cmp__nao">Sem streaming</span>')),
      linha('Aplicativos', (p) => { const a = APPS[p.id] || APPS['500']; return a[0] + (a[1] ? `<small>${a[1]}</small>` : ''); }),
      linha('Instalação', () => 'Grátis, em até 48 h'),
      linha('Preço por mês', (p) => { const o = menor(p); return `${p.opcoes.length > 1 ? '<small class="cmp__ap">a partir de</small>' : ''}<span class="cmp__preco">${brl(o.preco)}</span><small class="cmp__de">de ${brl(o.de || p.de)}</small>`; }, 'cmp__l-preco'),
      linha('Cashback no PIX', (p) => `<span class="cmp__cb">${DY.brl(DY.cashbackCentavos(Math.round(menor(p).preco * 100), 50))}</span><small>50% de uma mensalidade</small>`),
      linha('', (p) => `<a class="cmp__bt" href="/contratar?origem=internet&amp;para=casa&amp;plano=${encodeURIComponent(p.id)}">Quero o ${milhar(p.num)} Mega</a>${PAGINAS_PRONTAS.has(p.id) ? `<a class="cmp__pg" href="${PAGINA[p.id]}">Ver o plano</a>` : ''}`, 'cmp__l-bt'),
    ].join('');
    tabela.style.setProperty('--n', lista.length);
    tabela.innerHTML = cab + '<tbody>' + corpo + '</tbody>';
  }

  // a dica de arrastar some quando a tabela já cabe na tela ou depois do primeiro arraste
  const rola = tabela.closest('.cmp__rola'), caixa = tabela.closest('.cmp');
  const confere = () => caixa && caixa.classList.toggle('tem-mais', rola.scrollWidth > rola.clientWidth + 4);
  if (rola) {
    rola.addEventListener('scroll', () => { if (rola.scrollLeft > 20) caixa.classList.add('rolou'); rola.classList.toggle('is-rolado', rola.scrollLeft > 4); }, { passive: true });
    addEventListener('resize', confere);
  }

  desenha(); confere();
  document.addEventListener('dy:planos', () => { desenha(); confere(); });
})();
