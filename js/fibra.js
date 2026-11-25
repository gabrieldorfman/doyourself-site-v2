/* Do Yourself v2 — peças didáticas da internet
   1. Caminho da fibra: a luz sai da central e vai até o modem, em 4 etapas (sozinha ou por toque)
   2. Preço do plano em que cada aplicativo vem (estado escolhido, evento dy:planos)
   4. Fibra e WTTx juntos: caso da padaria, do mercadinho e do escritório
   3. Planta da casa: o cliente arrasta o modem e vê o sinal do Wi-Fi 5 ou do Wi-Fi 6 */
(function () {
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const brl = (v) => DY.brl(Math.round(v * 100));

  /* 1. caminho da fibra */
  document.querySelectorAll('[data-fb]').forEach((sec) => {
    const luzes = [...sec.querySelectorAll('.fb__luz')];
    const passos = [...sec.querySelectorAll('.fb__p')];
    const fim = [.12, .46, .78, 1];
    let atual = -1, timer = null;
    const vai = (i, auto) => {
      atual = i;
      sec.dataset.etapa = i + 1;
      luzes.forEach((l) => (l.style.strokeDashoffset = String(1 - fim[i])));
      passos.forEach((p, k) => { p.classList.toggle('is-on', k === i); p.classList.toggle('is-feito', k < i); p.querySelector('button').setAttribute('aria-pressed', k === i); });
      clearTimeout(timer);
      if (auto && i < 3) timer = setTimeout(() => vai(i + 1, true), 2600);
    };
    passos.forEach((p, i) => p.querySelector('button').addEventListener('click', () => vai(i, false)));
    if (calmo || !('IntersectionObserver' in window)) { vai(3); return; }
    luzes.forEach((l) => (l.style.strokeDashoffset = '1'));
    new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { ob.disconnect(); vai(0, true); } }, { threshold: .3 }).observe(sec.querySelector('.fb__palco'));
  });

  /* 2. preços dos aplicativos */
  const apps = [...document.querySelectorAll('[data-app-plano]')];
  if (apps.length && window.DY) {
    const precos = () => {
      const lista = DY.catalogo.casa[DY.blocoInternet(DY.uf)] || [];
      apps.forEach((el) => {
        const [id, app] = el.dataset.appPlano.split(':');
        const p = lista.find((x) => x.id === id); if (!p) { el.hidden = true; return; }
        const re = new RegExp(app, 'i');
        const o = p.opcoes.find((x) => re.test([x.nome, x.resumo, x.logo].join(' '))) || p.opcoes[0];
        el.hidden = false; el.querySelector('b').textContent = brl(o.preco);
      });
    };
    precos(); document.addEventListener('dy:planos', precos);
  }

  /* 4. fibra e WTTx juntos: o dia de um negócio */
  const NEG = {
    padaria: { ap: ['Maquininha', 'Caixa', 'Pedidos no WhatsApp'], p: ['Fila do pão, cartão passando e pedidos chegando.', 'Na hora do movimento, a internet para.', 'A equipe liga os aparelhos no Wi-Fi do WTTx.'], fim: ['Padaria atendendo normalmente.', 'Cartão, caixa e pedidos parados.', 'A fila anda e o cartão volta a passar.'] },
    mercado: { ap: ['Maquininhas', 'Sistema do caixa', 'Entregas no WhatsApp'], p: ['Caixas abertos e entregas saindo.', 'O sistema e o cartão saem do ar.', 'Os caixas passam para o Wi-Fi do WTTx.'], fim: ['Mercadinho atendendo normalmente.', 'Caixas parados, com o carrinho cheio.', 'Os caixas voltam a registrar e a receber.'] },
    escritorio: { ap: ['Celulares da equipe', 'Notebooks', 'WhatsApp da empresa'], p: ['Equipe no sistema e clientes na conversa.', 'No meio do dia, tudo desconecta.', 'Os notebooks entram no Wi-Fi do WTTx.'], fim: ['Escritório trabalhando normalmente.', 'E-mails, sistema e conversas parados.', 'O trabalho continua até a fibra voltar.'] },
  };
  document.querySelectorAll('[data-caso]').forEach((sec) => {
    const abas = [...sec.querySelectorAll('[data-neg]')], passos = [...sec.querySelectorAll('.caso__passos li')];
    const aps = [...sec.querySelectorAll('.caso__ap')];
    let neg = 'padaria', i = 0, timer = null;
    const pinta = () => {
      const n = NEG[neg];
      sec.dataset.etapa = i + 1;
      sec.querySelectorAll('[data-caso-p]').forEach((p, k) => (p.textContent = n.p[k]));
      aps.forEach((a, k) => { a.querySelector('[data-caso-n]').textContent = n.ap[k]; a.querySelector('[data-caso-s]').textContent = ['Pela fibra', 'Sem internet', 'Pelo WTTx'][i]; });
      sec.querySelector('[data-caso-f]').textContent = ['Conectada', 'Fora do ar', 'Fora do ar'][i];
      sec.querySelector('[data-caso-w]').textContent = ['De reserva', 'Pronto para usar', 'Conectado'][i];
      sec.querySelector('[data-caso-fim]').textContent = n.fim[i];
      passos.forEach((p, k) => { p.classList.toggle('is-on', k === i); p.querySelector('button').setAttribute('aria-pressed', k === i); });
      abas.forEach((a) => { const on = a.dataset.neg === neg; a.setAttribute('aria-checked', on); a.tabIndex = on ? 0 : -1; });
    };
    const vai = (k, auto) => { i = k; pinta(); clearTimeout(timer); if (auto && k < 2) timer = setTimeout(() => vai(k + 1, true), 3000); };
    passos.forEach((p, k) => p.querySelector('button').addEventListener('click', () => vai(k, false)));
    abas.forEach((a, k) => {
      a.addEventListener('click', () => { neg = a.dataset.neg; vai(0, !calmo); });
      a.addEventListener('keydown', (ev) => { const d = { ArrowRight: 1, ArrowLeft: 2 }[ev.key]; if (d) { ev.preventDefault(); const z = abas[(k + d) % 3]; z.click(); z.focus(); } });
    });
    if (calmo || !('IntersectionObserver' in window)) { vai(2); return; }
    pinta();
    new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { ob.disconnect(); vai(0, true); } }, { threshold: .35 }).observe(sec.querySelector('.caso__dir'));
  });

  /* 3. planta da casa */
  const pl = document.querySelector('[data-planta]');
  if (!pl) return;
  const L = 720, A = 760;
  const COMODOS = [
    ['Quarto dos pais', 165, 140], ['Quarto do filho', 565, 125], ['Quarto da filha', 130, 470], ['Sala', 360, 430],
    ['Cozinha', 590, 395], ['Banheiro 1', 370, 95], ['Banheiro 2', 110, 320], ['Churrasco', 590, 660],
  ];
  // paredes [x1, y1, x2, y2, peso]: os vãos das portas ficam de fora
  const PAREDES = [
    [20, 20, 700, 20, 2], [20, 20, 20, 560, 2], [700, 20, 700, 560, 2], [20, 560, 300, 560, 5], [420, 560, 540, 560, 5], [630, 560, 700, 560, 2],
    [310, 20, 310, 185, 1], [310, 240, 310, 260, 1], [20, 260, 310, 260, 1], [430, 20, 430, 178, 1], [430, 222, 430, 230, 1],
    [310, 170, 345, 170, 1], [395, 170, 430, 170, 1], [430, 230, 700, 230, 1], [200, 260, 200, 296, 1], [200, 350, 200, 380, 1],
    [20, 380, 240, 380, 1], [240, 380, 240, 410, 1], [240, 465, 240, 560, 1], [480, 230, 480, 330, 1], [480, 480, 480, 560, 1],
  ];
  const TIPO = { 5: { kd: .12, kw: 5 }, 6: { kd: .037, kw: 1.4 } };
  let wifi = '6', mx = 360, my = 430;

  const cruza = (ax, ay, bx, by, [cx, cy, dx, dy]) => {
    const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (!d) return false;
    const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d, u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
    return t > 0 && t < 1 && u >= 0 && u <= 1;
  };
  const sinal = (x, y) => {
    const k = TIPO[wifi]; let s = 100 - Math.hypot(x - mx, y - my) * k.kd;
    for (const p of PAREDES) if (cruza(mx, my, x, y, p)) s -= k.kw * p[4];
    return s;
  };
  const nivel = (s) => (s >= 60 ? 3 : s >= 35 ? 2 : s >= 15 ? 1 : 0);
  const NOMES = ['mais baixo', 'mais baixo', 'bom', 'forte'];

  const tela = pl.querySelector('canvas'), ctx = tela.getContext('2d');
  const PASSO = 20, cols = L / PASSO, lins = A / PASSO;
  tela.width = cols; tela.height = lins;
  // vermelho não: do azul bem claro (fraco) ao verde (forte), sem assustar
  const CORES = [[0, [226, 232, 240]], [15, [250, 219, 150]], [38, [174, 220, 170]], [62, [92, 200, 140]], [100, [24, 160, 98]]];
  const cor = (s) => {
    const v = Math.max(0, Math.min(100, s));
    for (let i = 1; i < CORES.length; i++) if (v <= CORES[i][0]) {
      const [a, ca] = CORES[i - 1], [b, cb] = CORES[i], t = (v - a) / (b - a);
      return ca.map((c, k) => Math.round(c + (cb[k] - c) * t));
    }
    return CORES[4][1];
  };
  const etqs = COMODOS.map(([n]) => pl.querySelector(`[data-comodo="${n}"]`));
  const modem = pl.querySelector('.pl__modem'), ondas = pl.querySelector('.pl__ondas');
  const resumo = pl.querySelector('[data-pl-resumo]'), lista = pl.querySelector('[data-pl-lista]');
  const ondeEsta = () => COMODOS.reduce((m, c) => (Math.hypot(c[1] - mx, c[2] - my) < Math.hypot(m[1] - mx, m[2] - my) ? c : m))[0];
  const desenha = () => {
    const img = ctx.createImageData(cols, lins);
    for (let y = 0; y < lins; y++) for (let x = 0; x < cols; x++) {
      const c = cor(sinal((x + .5) * PASSO, (y + .5) * PASSO)), i = (y * cols + x) * 4;
      img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const n = COMODOS.map(([, x, y]) => nivel(sinal(x, y)));
    etqs.forEach((e, i) => { e.dataset.n = n[i]; });
    lista.innerHTML = COMODOS.map(([nome], i) => `<li data-n="${n[i]}"><span>${nome === 'Churrasco' ? 'Cantinho do churrasco' : nome}</span><b>${NOMES[n[i]]}</b></li>`).join('');
    const f = n.filter((x) => x === 3).length, b = n.filter((x) => x === 2).length, r = 8 - f - b;
    const parte = (q, t) => (q ? `<b>${t}</b> em ${q}` : '');
    const lugar = ondeEsta(); const art = { Sala: 'na sala', Cozinha: 'na cozinha', Churrasco: 'no cantinho do churrasco' }[lugar] || 'no ' + lugar.toLowerCase();
    resumo.innerHTML = `Com o <b class="nw">Wi-Fi ${wifi}</b> ${art}: ` + (f === 8 ? 'sinal <b>forte na casa toda</b>, inclusive lá fora.' : 'sinal ' + [parte(f, 'forte'), parte(b, 'bom'), parte(r, 'mais baixo')].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' e $1') + ((r || b || f) === 1 ? ' ambiente.' : ' ambientes.') + (r > 2 ? ' Experimente levar o modem para o centro da casa.' : ''));
    const px = (mx / L) * 100 + '%', py = (my / A) * 100 + '%';
    modem.style.left = px; modem.style.top = py; ondas.style.left = px; ondas.style.top = py;
    modem.setAttribute('aria-valuetext', `Modem ${art}`);
    pl.dataset.wifi = wifi;
  };
  let pedido = false;
  const redesenha = () => { if (pedido) return; pedido = true; requestAnimationFrame(() => { pedido = false; desenha(); }); };
  const poe = (x, y) => { mx = Math.max(40, Math.min(680, x)); my = Math.max(40, Math.min(730, y)); redesenha(); };

  const palco = pl.querySelector('.pl__casa');
  const ponto = (e) => { const r = palco.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * L, ((e.clientY - r.top) / r.height) * A]; };
  let arrasta = false;
  modem.addEventListener('pointerdown', (e) => { arrasta = true; modem.setPointerCapture(e.pointerId); pl.classList.add('is-arrasta', 'is-mexeu'); e.preventDefault(); });
  modem.addEventListener('pointermove', (e) => { if (arrasta) poe(...ponto(e)); });
  const solta = () => { arrasta = false; pl.classList.remove('is-arrasta'); };
  modem.addEventListener('pointerup', solta); modem.addEventListener('pointercancel', solta);
  modem.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] }[e.key];
    if (d) { e.preventDefault(); pl.classList.add('is-mexeu'); poe(mx + d[0], my + d[1]); }
  });
  // um toque no cômodo também leva o modem para lá
  palco.addEventListener('click', (e) => { if (e.target.closest('.pl__modem')) return; pl.classList.add('is-mexeu'); modem.classList.add('is-voa'); poe(...ponto(e)); setTimeout(() => modem.classList.remove('is-voa'), 450); });

  /* abas Wi-Fi 5 e Wi-Fi 6 e os planos de cada uma */
  const abas = [...pl.querySelectorAll('[role="radio"]')];
  const cta = pl.querySelector('[data-pl-cta]'), planos = pl.querySelector('[data-pl-planos]'), mdImg = modem.querySelector('img');
  const eWifi = (p) => (+p.id >= 2000 ? '7' : +p.id >= 1000 ? '6' : '5');
  const milhar = (n) => String(n).replace(/^(\d)(\d{3})$/, '$1.$2');
  const desenhaPlanos = () => {
    if (!planos) return; // planta sem a lista de planos (/internet/gamer)
    const ps = (DY.catalogo.casa[DY.blocoInternet(DY.uf)] || []).filter((p) => eWifi(p) === wifi);
    planos.querySelector('h3').innerHTML = ps.length > 1 ? `Planos com modem <span class="nw">Wi-Fi ${wifi}</span>` : `O plano com modem <span class="nw">Wi-Fi ${wifi}</span>`;
    planos.querySelector('ul').innerHTML = ps.map((p) => {
      const o = p.opcoes.reduce((m, x) => (x.preco < m.preco ? x : m), p.opcoes[0]);
      return `<li>${p.selo === 'OFERTA DO MÊS' ? '<span class="pl__selo">Oferta do mês</span>' : ''}<p class="pl__vel">${milhar(p.num)} <small>Mega</small></p><p class="pl__pr">${p.opcoes.length > 1 ? 'a partir de ' : ''}<b>${brl(o.preco)}</b>/mês</p><p class="pl__cb">Cashback de <b>${DY.brl(DY.cashbackCentavos(Math.round(o.preco * 100), 50))}</b></p><a class="bt bt--net" href="/contratar?origem=internet&para=casa&plano=${encodeURIComponent(p.id)}&opcao=${encodeURIComponent(o.nome)}">Quero este plano</a></li>`;
    }).join('');
    cta.textContent = `Quero ter o Wi-Fi ${wifi}`;
  };
  const escolhe = (w, foco) => {
    wifi = w;
    abas.forEach((a) => { const on = a.dataset.w === w; a.setAttribute('aria-checked', on); a.tabIndex = on ? 0 : -1; if (on && foco) a.focus(); });
    mdImg.src = `/img/3d-g/modem${w}.webp`;
    desenha(); desenhaPlanos();
  };
  abas.forEach((a) => {
    a.addEventListener('click', () => escolhe(a.dataset.w));
    a.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); escolhe(wifi === '5' ? '6' : '5', true); } });
  });
  if (cta) cta.addEventListener('click', () => {
    planos.hidden = false; cta.setAttribute('aria-expanded', 'true');
    planos.scrollIntoView({ behavior: calmo ? 'auto' : 'smooth', block: 'center' });
  });
  document.addEventListener('dy:planos', desenhaPlanos);
  escolhe(pl.dataset.so || '5');
})();
