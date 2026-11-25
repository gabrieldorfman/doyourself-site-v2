/* Do Yourself v2 — páginas de energia
   1. Régua: arrasta o valor e a conta cai
   2. Caminho da energia, itens da fatura, áreas do prédio e tipos de comércio
   3. Faixas de desconto, lidas de DY.energia
   4. Soma das unidades (empresas) e lista do síndico */
(function () {
  if (!window.DY) return;
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const brl = (c) => DY.brl(c), E = DY.energia;
  const poe = (raiz, v) => $$('[data-en]', raiz).forEach((x) => { const t = v[x.dataset.en]; if (t !== undefined) x.textContent = brl(t); });
  const grupo = (bts, aoEscolher) => {
    const marca = (b, foco) => { bts.forEach((x) => { const on = x === b; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; }); if (foco) b.focus(); aoEscolher(b); };
    bts.forEach((b, i) => {
      b.addEventListener('click', () => marca(b));
      b.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (d) { e.preventDefault(); marca(bts[(i + d + bts.length) % bts.length], true); } });
    });
  };

  /* 1. régua */
  $$('[data-en-regua]').forEach((el) => {
    const r = $('input[type=range]', el), apt = $('[data-en-apt]', el), ir = $('[data-en-ir]', el), zap = $('[data-en-zap]', el);
    zap.target = '_blank'; zap.rel = 'noopener';
    const pinta = () => {
      const v = +r.value, s = E.simular(v), n = apt ? +apt.value || 0 : 0;
      poe(el, { de: s.conta, para: s.comDesconto, mes: s.economiaMes, ano: s.economiaMes * 12, cb: s.cashback });
      if (apt) $('[data-en="apt"]', el).textContent = n ? brl(Math.floor((s.economiaMes * 12) / n)) : '—';
      el.style.setProperty('--h', 100 - s.pct + '%');
      r.style.setProperty('--p', ((v - r.min) / (r.max - r.min)) * 100 + '%');
      r.setAttribute('aria-valuetext', brl(s.conta));
      ir.href = '/contratar?origem=energia&conta=' + v;
      zap.href = DY.linkWhatsApp(`Olá! Simulei no site: ${apt ? 'a conta das áreas comuns é' : 'minha conta de luz é'} de ${brl(s.conta)} e quero o desconto.`);
    };
    r.addEventListener('input', pinta);
    if (apt) apt.addEventListener('input', () => { apt.value = apt.value.replace(/\D/g, ''); pinta(); });
    pinta();
  });
  $$('[data-en-jo]').forEach((x) => { const s = E.simular(800); x.textContent = brl({ de: s.conta, para: s.comDesconto, mes: s.economiaMes, cb: s.cashback }[x.dataset.enJo]); });

  /* 2. escolhas */
  $$('[data-en-cam]').forEach((c) => {
    const T = ['O sol vira energia em uma usina solar, longe da sua casa. Você não instala nada.', 'Essa energia entra na rede de distribuição, a mesma que já chega até você.', 'A distribuidora transforma a sua parte em créditos, medidos em kWh.', 'Os créditos abatem o seu consumo e você paga menos. A luz chega como sempre chegou.'];
    grupo($$('[data-en-p]', c), (b) => { c.dataset.enCam = b.dataset.enP; $('[data-en-t]', c).textContent = T[b.dataset.enP]; });
  });
  $$('[data-en-fat], [data-en-pr]').forEach((c) => {
    const k = 'enFat' in c.dataset ? 'enFat' : 'enPr';
    const acende = (v) => { c.dataset[k] = v; $$('[data-x]', c).forEach((x) => x.classList.toggle('is-on', x.dataset.x === v)); };
    const bts = $$('[data-en-f]', c); grupo(bts, (b) => acende(b.dataset.enF)); acende(c.dataset[k]);
    c.addEventListener('click', (e) => { const x = e.target.closest('[data-x]'), b = x && bts.find((y) => y.dataset.enF === x.dataset.x); if (b) b.click(); });
    c.addEventListener('iso:ok', () => acende(c.dataset[k])); // cena carregada (js/cenas.js)
  });
  $$('[data-en-abas]').forEach((c) => grupo($$('[data-en-aba]', c), (b) => $$('[data-en-painel]', c).forEach((p) => (p.hidden = p.dataset.enPainel !== b.dataset.enAba))));

  /* 3. faixas */
  $$('[data-en-faixas]').forEach((ol) => {
    const f = []; let ant = 0;
    for (let v = E.minimo; v <= 20000; v += 50) { const p = E.simular(v).pct; if (p !== ant) { f.push([v, p]); ant = p; } }
    const int = (v) => 'R$ ' + v.toLocaleString('pt-BR');
    ol.innerHTML = f.map(([v, p], i) => `<li style="--f:${p}"><b>${p}%</b><span>${f[i + 1] ? `de ${int(v)} até ${brl(f[i + 1][0] * 100 - 1)}`.replace(/R\$ /g, 'R$ ') : `a partir de ${int(v)}`}</span></li>`).join('');
  });

  /* 4. unidades */
  $$('[data-en-un]').forEach((el) => {
    const ul = $('[data-en-ul]', el), zap = $('[data-en-zap]', el), add = $('[data-en-add]', el), MAX = 20, cena = $('[data-en-unc]'); let id = 0;
    zap.target = '_blank'; zap.rel = 'noopener';
    const pinta = () => {
      const t = { de: 0, para: 0, mes: 0, cb: 0 }, li = $$('li', ul); let n = 0;
      li.forEach((l, i) => {
        $('label', l).textContent = `Unidade ${i + 1}`; $('[data-x-un]', l).hidden = li.length < 2; $('[data-x-un]', l).setAttribute('aria-label', `Tirar a unidade ${i + 1}`);
        const v = DY.lerReais($('input', l).value), s = E.simular(v), ok = s.elegivel; n += !!v;
        $('small', l).textContent = ok ? `Desconto estimado de ${s.pct}%` : v ? `Vale para contas a partir de R$ ${E.minimo}` : 'Digite o valor da conta';
        if (v) { const c = Math.round(v * 100); t.de += c; t.para += ok ? s.comDesconto : c; if (ok) { t.mes += s.economiaMes; t.cb += s.cashback; } }
      });
      t.ano = t.mes * 12; poe(el, t); add.hidden = li.length >= MAX;
      if (cena) $$('[data-x-u]', cena).forEach((m) => { const l = li[m.dataset.xU]; m.classList.toggle('is-on', !!l && !!DY.lerReais($('input', l).value)); });
      zap.href = DY.linkWhatsApp(t.de ? `Olá! Minha empresa tem ${n} ${n === 1 ? 'unidade' : 'unidades'} e paga ${brl(t.de)} de luz por mês. Quero uma proposta.` : 'Olá! Quero uma proposta de energia para a minha empresa.');
    };
    const nova = (v, foco) => {
      const l = document.createElement('li'), k = 'en-u' + ++id;
      l.innerHTML = `<label for="${k}"></label><span class="en-un__c"><span aria-hidden="true">R$</span><input id="${k}" type="text" inputmode="decimal" autocomplete="off" placeholder="0" aria-describedby="${k}d"></span><small id="${k}d"></small><button type="button" data-x-un>×</button>`;
      const i = $('input', l); if (v) i.value = DY.formatarReais(v);
      i.addEventListener('input', () => { const resto = i.value.length - i.selectionStart; i.value = DY.formatarReais(i.value); const p = Math.max(0, i.value.length - resto); i.setSelectionRange(p, p); pinta(); });
      $('button', l).addEventListener('click', () => { l.remove(); pinta(); add.focus(); });
      ul.append(l); pinta(); if (foco) i.focus();
    };
    nova('8000'); nova('3500');
    add.addEventListener('click', () => nova('', true));
    if (cena) { // cena de matriz, filial e galpão: o número acende quando a unidade tem conta
      cena.addEventListener('iso:ok', pinta);
      cena.addEventListener('click', (e) => { const m = e.target.closest('[data-x-u]'); if (!m) return; const l = $$('li', ul)[m.dataset.xU]; if (l) $('input', l).focus(); else nova('', true); });
    }
  });
  $$('[data-en-lista]').forEach((el) => {
    const cx = $$('input', el);
    cx.forEach((x) => x.addEventListener('change', () => { const n = cx.filter((c) => c.checked).length; $('[data-en-lt]', el).textContent = n === cx.length ? 'Tudo pronto para a assembleia.' : `${n} de ${cx.length} prontos`; }));
  });
})();
