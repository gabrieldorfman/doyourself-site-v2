/* Do Yourself v2 — páginas de internet
   1. Streaming por plano: abas 600 / 800 / 1.000 Mega, com o preço do estado escolhido (evento dy:planos)
   2. Faixa de aplicativos: botão de pausa
   3. Como a fibra chega: a seção fica na tela e a linha de luz se desenha com a rolagem */
(function () {
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const brl = (v) => (window.DY ? DY.brl(Math.round(v * 100)) : 'R$ ' + v.toFixed(2).replace('.', ','));

  /* 1. abas do streaming */
  const esc = document.querySelector('[data-esc]');
  if (esc) {
    const abas = [...esc.querySelectorAll('[role="tab"]')];
    const ind = esc.querySelector('.esc__ind');
    const escolhe = (i, foco) => {
      abas.forEach((a, k) => {
        const on = k === i;
        a.setAttribute('aria-selected', on); a.tabIndex = on ? 0 : -1;
        document.getElementById(a.getAttribute('aria-controls')).hidden = !on;
      });
      if (ind) ind.style.transform = `translateX(${i * 100}%)`;
      if (foco) abas[i].focus();
    };
    abas.forEach((a, i) => {
      a.addEventListener('click', () => escolhe(i));
      a.addEventListener('keydown', (e) => {
        const n = abas.length; let k = null;
        if (e.key === 'ArrowRight') k = (i + 1) % n; else if (e.key === 'ArrowLeft') k = (i - 1 + n) % n;
        else if (e.key === 'Home') k = 0; else if (e.key === 'End') k = n - 1;
        if (k !== null) { e.preventDefault(); escolhe(k, true); }
      });
    });
    escolhe(abas.findIndex((a) => a.getAttribute('aria-selected') === 'true'));

    const precos = () => {
      if (!window.DY || !DY.catalogo) return;
      const lista = DY.catalogo.casa[DY.blocoInternet(DY.uf)] || [];
      esc.querySelectorAll('[data-esc-preco]').forEach((el) => {
        const p = lista.find((x) => x.id === el.dataset.escPreco); if (!p) return;
        el.textContent = brl(Math.min(...p.opcoes.map((o) => o.preco)));
      });
    };
    precos(); document.addEventListener('dy:planos', precos);
  }

  /* 2. faixa de aplicativos */
  const fita = document.querySelector('[data-fita]');
  if (fita) {
    const bt = fita.querySelector('.fita__pausa');
    bt && bt.addEventListener('click', () => {
      const parada = fita.classList.toggle('is-parada');
      bt.setAttribute('aria-pressed', parada);
      bt.setAttribute('aria-label', parada ? 'Continuar a faixa de aplicativos' : 'Pausar a faixa de aplicativos');
    });
  }

  /* 3. o caminho da fibra */
  const fio = document.querySelector('[data-fio]');
  if (fio) {
    const pista = fio.querySelector('.fio__pista');
    const palco = fio.querySelector('.fio__palco');
    const luz = fio.querySelector('.fio__luz');
    const ponta = fio.querySelector('.fio__ponta');
    const passos = [...fio.querySelectorAll('.fio__p')];
    const nos = [fio.querySelector('.fio__no--1'), fio.querySelector('.fio__no--2'), fio.querySelector('.fio__casa'), fio.querySelector('.fio__modem')];
    const total = luz.getTotalLength();
    let ultimo = -1;
    const desenha = (p) => {
      const d = Math.min(1, Math.max(0, p * 1.08));
      luz.style.strokeDashoffset = String(1 - d);
      const pt = luz.getPointAtLength(total * d);
      ponta.setAttribute('cx', pt.x); ponta.setAttribute('cy', pt.y);
      ponta.style.opacity = d > 0.002 && d < 0.998 ? 1 : 0;
      const marcos = [0, 0.3, 0.62, 0.97];
      nos.forEach((n, k) => n && n.classList.toggle('is-on', d >= marcos[k]));
      palco.classList.toggle('is-fim', d >= 0.97);
      const i = Math.min(passos.length - 1, Math.floor(p * passos.length * 0.999));
      if (i !== ultimo) {
        passos.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-feito', k < i); });
        ultimo = i;
      }
    };
    if (calmo) { desenha(1); passos.forEach((s) => s.classList.add('is-on')); }
    else {
      let pedido = false;
      const noScroll = () => {
        if (pedido) return; pedido = true;
        requestAnimationFrame(() => {
          pedido = false;
          const r = pista.getBoundingClientRect(); const curso = r.height - innerHeight;
          desenha(Math.min(1, Math.max(0, -r.top / Math.max(1, curso))));
        });
      };
      addEventListener('scroll', noScroll, { passive: true }); addEventListener('resize', noScroll); noScroll();
    }
  }
})();
