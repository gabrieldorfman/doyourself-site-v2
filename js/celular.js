/* Do Yourself v2 — página de celular (CNPJ e MEI)
   1. O que gasta a internet: o cliente toca numa ação e vê se ela usa a franquia
   2. Monte as linhas da equipe: soma as linhas, o total por mês e o Cashback
   3. Portabilidade: onde o número está hoje
   4. Como ativar o 5G, por marca */
(function () {
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const brl = (cent) => DY.brl(cent);

  /* grupo de botões em que só um fica marcado, com as setas do teclado */
  const grupo = (bts, aoEscolher) => {
    const marca = (b, foco) => { bts.forEach((x) => { const on = x === b; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; }); if (foco) b.focus(); aoEscolher(b); };
    bts.forEach((b, i) => {
      b.addEventListener('click', () => marca(b));
      b.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (d) { e.preventDefault(); marca(bts[(i + d + bts.length) % bts.length], true); } });
    });
    marca(bts[0]);
  };

  /* 1. o que gasta a internet */
  const gasta = $('[data-gasta]');
  if (gasta) {
    const REDES = ['instagram', 'facebook', 'x'];
    const ACOES = {
      audio: { app: 'whatsapp', msg: 'Áudio enviado', ok: 'Texto, foto, vídeo e áudio no WhatsApp não gastam a sua internet.' },
      zapv: { app: 'whatsapp', msg: 'Chamada de vídeo', uso: 'Chamadas de voz e de vídeo no WhatsApp usam a internet do plano.' },
      feed: { app: 'instagram', msg: 'Vendo o Instagram', ok: 'Ver e publicar no Instagram não gasta a sua internet.' },
      live: { app: 'instagram', msg: 'Ao vivo', uso: 'Transmissões ao vivo usam a internet do plano.' },
      rota: { app: 'waze', msg: 'Rota até o cliente', ok: 'Navegar com o Waze não gasta a sua internet.' },
      link: { app: 'whatsapp', msg: 'Link aberto', uso: 'Links que abrem fora do aplicativo usam a internet do plano.' },
    };
    let pac = '7', acao = 'audio';
    const pinta = () => {
      const a = ACOES[acao], fora = pac === '4' && REDES.includes(a.app), usa = !!a.uso || fora;
      gasta.dataset.usa = usa ? 'sim' : 'nao';
      $$('[data-gasta-app]', gasta).forEach((li) => li.classList.toggle('is-fora', pac === '4' && REDES.includes(li.dataset.gastaApp)));
      $('[data-gasta-img]', gasta).src = `/img/apps/${a.app}.svg`;
      $('[data-gasta-msg]', gasta).textContent = a.msg;
      $('[data-gasta-sel]', gasta).textContent = usa ? 'Usa a internet do plano' : 'Não gasta a internet';
      $('[data-gasta-txt]', gasta).textContent = a.uso || (fora ? 'Nos planos de 6 e 12 GB, o Instagram usa a internet do plano.' : a.ok);
    };
    grupo($$('[data-pac]', gasta), (b) => { pac = b.dataset.pac; pinta(); });
    grupo($$('[data-acao]', gasta), (b) => { acao = b.dataset.acao; pinta(); });
  }

  /* 2. monte as linhas da equipe */
  const eq = $('[data-equipe]');
  if (eq && window.DY) {
    const q = { 12: 1, 40: 1, 80: 1 }, linhas = $$('[data-eq]', eq), MAX = DY.linhasMax, ESP = DY.linhasEspecial;
    const total = () => Object.values(q).reduce((a, b) => a + b, 0);
    const pinta = () => {
      let soma = 0; const partes = [];
      linhas.forEach((l) => {
        const id = l.dataset.eq, p = DY.planosCnpj.find((x) => x.id === id); if (!p) { l.hidden = true; return; }
        l.hidden = false;
        const c = Math.round(p.preco * 100) * q[id]; soma += c;
        $('[data-eq-preco]', l).textContent = brl(Math.round(p.preco * 100));
        const i = $('input', l); if (document.activeElement !== i) i.value = q[id];
        $('[data-menos]', l).disabled = q[id] <= 0; $('[data-mais]', l).disabled = total() >= MAX;
        if (q[id]) partes.push(`${q[id]} ${q[id] === 1 ? 'linha' : 'linhas'} de ${p.gb} GB`);
      });
      const n = total(), esp = n > ESP, bt = $('[data-eq-ir]', eq);
      $('[data-eq-n]', eq).textContent = `${n} ${n === 1 ? 'linha' : 'linhas'}`;
      $('[data-eq-total]', eq).textContent = brl(soma);
      $('[data-eq-cb]', eq).textContent = brl(DY.cashbackCentavos(soma, 100));
      $('[data-eq-esp]', eq).hidden = !esp; $('[data-eq-soma]', eq).hidden = esp;
      bt.href = DY.linkWhatsApp(`Olá! Quero contratar celular para a minha empresa: ${partes.join(', ')}.`);
      bt.classList.toggle('is-off', !n); bt.setAttribute('aria-disabled', !n);
    };
    const poe = (id, v) => { const resto = total() - q[id]; q[id] = Math.max(0, Math.min(MAX - resto, Math.round(+v) || 0)); pinta(); };
    linhas.forEach((l) => {
      const id = l.dataset.eq, i = $('input', l);
      $('[data-menos]', l).addEventListener('click', () => poe(id, q[id] - 1));
      $('[data-mais]', l).addEventListener('click', () => poe(id, q[id] + 1));
      i.addEventListener('input', () => { i.value = i.value.replace(/\D/g, ''); poe(id, i.value); });
      i.addEventListener('blur', () => { i.value = q[id]; });
    });
    $('[data-eq-ir]', eq).addEventListener('click', (e) => { if (!total()) e.preventDefault(); });
    pinta(); document.addEventListener('dy:planos', pinta);
    document.addEventListener('change', (e) => { if (e.target.closest('select')) setTimeout(pinta, 0); });
  }

  /* valores das cenas de contratação: 3 linhas da oferta do mês */
  const cenas = $('[data-cel-jo]');
  if (cenas.length) {
    const valores = () => { const p = DY.planosCnpj.find((x) => x.selo === 'OFERTA DO MÊS'); if (!p) return; const t = Math.round(p.preco * 100) * 3; cenas.forEach((e) => (e.textContent = brl(e.dataset.celJo === 'cb' ? DY.cashbackCentavos(t, 100) : t))); };
    valores(); document.addEventListener('dy:planos', valores);
  }

  /* 3 e 4. botões que trocam o painel ao lado */
  $$('[data-troca]').forEach((sec) => {
    const paineis = $$('[data-painel]', sec);
    grupo($$('[data-abre]', sec), (b) => paineis.forEach((p) => (p.hidden = p.dataset.painel !== b.dataset.abre)));
  });
})();
