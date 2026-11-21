/* Do Yourself v2 — páginas de internet
   1. Streaming por plano: abas 600 / 800 / 1.000 Mega, com o preço do estado escolhido (evento dy:planos)
   2. Faixa de aplicativos: botão de pausa
   3. Como a fibra chega: a seção fica na tela e a linha de luz se desenha com a rolagem
   4. Oferta do mês animada no topo
   5. Por que a Do Yourself: frase que acende e conversa em sequência */
(function () {
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js-net');
  const milhar = (n) => String(n).replace(/^(\d)(\d{3})$/, '$1.$2');
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

  /* 3. o caminho da fibra: a linha se desenha com a rolagem; ao chegar no modem, o sinal sai,
     aparece o "Internet conectada" e a rolagem pausa um instante, uma vez só */
  const fio = document.querySelector('[data-fio]');
  if (fio) {
    const pista = fio.querySelector('.fio__pista');
    const palco = fio.querySelector('.fio__palco');
    const luz = fio.querySelector('.fio__luz');
    const ponta = fio.querySelector('.fio__ponta');
    const passos = [...fio.querySelectorAll('.fio__p')];
    const nos = [fio.querySelector('.fio__no--1'), fio.querySelector('.fio__no--2'), fio.querySelector('.fio__casa'), fio.querySelector('.fio__modem')];
    const total = luz.getTotalLength();
    let ultimo = -1, travou = false;
    try { travou = sessionStorage.getItem('dy_fio_ok') === '1'; } catch (e) {}
    const trava = () => {
      travou = true; try { sessionStorage.setItem('dy_fio_ok', '1'); } catch (e) {}
      const raiz = document.documentElement;
      const teclas = (e) => { if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'End', 'Home'].includes(e.key)) e.preventDefault(); };
      raiz.classList.add('trava-rolagem'); addEventListener('keydown', teclas);
      setTimeout(() => { raiz.classList.remove('trava-rolagem'); removeEventListener('keydown', teclas); }, 1800);
    };
    let pAntes = 0;
    const desenha = (p, descendo) => {
      const d = Math.min(1, Math.max(0, p * 1.08));
      luz.style.strokeDashoffset = String(1 - d);
      const pt = luz.getPointAtLength(total * d);
      ponta.setAttribute('cx', pt.x); ponta.setAttribute('cy', pt.y);
      ponta.style.opacity = d > 0.002 && d < 0.998 ? 1 : 0;
      const marcos = [0, 0.3, 0.62, 0.97];
      nos.forEach((n, k) => n && n.classList.toggle('is-on', d >= marcos[k]));
      const fim = d >= 0.995;
      // só pausa se a pessoa veio rolando por dentro da seção (um salto por link não pausa)
      if (fim && !palco.classList.contains('is-fim')) { palco.classList.add('is-fim'); if (!travou && descendo && !calmo && pAntes > 0.7 && p < 1) trava(); }
      else if (!fim && d < 0.9) palco.classList.remove('is-fim');
      const i = Math.min(passos.length - 1, Math.floor(p * passos.length * 0.999));
      if (i !== ultimo) {
        passos.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-feito', k < i); });
        ultimo = i;
      }
      pAntes = p;
    };
    if (calmo) { desenha(1); passos.forEach((s) => s.classList.add('is-on')); }
    else {
      let pedido = false, antes = scrollY;
      const noScroll = () => {
        if (pedido) return; pedido = true;
        requestAnimationFrame(() => {
          pedido = false;
          const descendo = scrollY >= antes; antes = scrollY;
          const r = pista.getBoundingClientRect(); const curso = r.height - innerHeight;
          desenha(Math.min(1, Math.max(0, -r.top / Math.max(1, curso))), descendo);
        });
      };
      addEventListener('scroll', noScroll, { passive: true }); addEventListener('resize', noScroll); noScroll();
    }
  }

  /* 4. oferta do mês no topo: lê o plano em oferta do estado escolhido e anima o medidor */
  const of = document.querySelector('[data-oferta]');
  if (of && window.DY && DY.catalogo) {
    const LOGO = { 'paramount-44': 'paramount-44.svg', paramount: 'paramount-44.svg', 'hbo-max': 'hbo-max.png', globoplay: 'globoplay.png', 'youtube-premium': 'youtube-premium-logo.svg' };
    const num = of.querySelector('[data-of-num]'), arco = of.querySelector('.of__arco');
    let alvo = 1000;
    const preenche = () => {
      const lista = DY.catalogo.casa[DY.blocoInternet(DY.uf)] || [];
      const p = lista.find((x) => x.selo === 'OFERTA DO MÊS' && x.id !== '2000') || lista.find((x) => x.id === '1000'); if (!p) return;
      const o = p.opcoes.reduce((m, x) => (x.preco < m.preco ? x : m), p.opcoes[0]);
      alvo = +p.num; num.textContent = milhar(p.num);
      of.querySelector('[data-of-preco]').textContent = brl(o.preco);
      of.querySelector('[data-of-de]').textContent = 'De ' + brl(o.de || p.de);
      of.querySelector('[data-of-cb]').textContent = DY.brl(DY.cashbackCentavos(Math.round(o.preco * 100), 50));
      const wifi = ((p.detalhes || []).find((d) => d[1] === 'Modem') || [])[2]; if (wifi) of.querySelector('[data-of-wifi]').textContent = wifi;
      const apps = p.opcoes.map((x) => (/noping/i.test(x.resumo || '') ? { img: 'noping.svg', nome: 'NoPing', preto: true } : x.logo ? { img: LOGO[x.logo] || x.logo + '.png', nome: x.nome } : null)).filter(Boolean);
      const ul = of.querySelector('[data-of-apps]'); const rot = of.querySelector('[data-of-rot]');
      if (apps.length) { ul.innerHTML = apps.map((a) => `<li><span${a.preto ? ' class="is-preto"' : ''}><img src="/img/apps/${a.img}" alt=""></span>${a.nome}</li>`).join(''); rot.textContent = apps.length > 1 ? 'Escolha um' : 'Já vem incluso'; }
      of.querySelector('.of__bt').setAttribute('href', '#planos-internet');
    };
    preenche(); document.addEventListener('dy:planos', preenche);
    if (window.gsap && !calmo) {
      const cont = { v: 0 };
      const mede = (de, dur) => gsap.timeline()
        .fromTo(arco, { strokeDashoffset: 1 - de / alvo }, { strokeDashoffset: 0, duration: dur, ease: 'power2.out' }, 0)
        .fromTo(cont, { v: de }, { v: alvo, duration: dur, ease: 'power2.out', onUpdate: () => { num.textContent = milhar(Math.min(alvo, Math.round(cont.v))); } }, 0);
      const tl = gsap.timeline({ delay: .35 });
      tl.from(of.querySelector('.of__tela'), { y: 40, autoAlpha: 0, scale: .96, duration: .7, ease: 'power3.out' })
        .from(of.querySelectorAll('.of__topo > *'), { y: -10, autoAlpha: 0, stagger: .08, duration: .4 }, '-=.3')
        .add(mede(0, 1.6), '-=.1')
        .from(of.querySelectorAll('.of__apps li, .of__rot'), { y: 14, scale: .8, autoAlpha: 0, stagger: .09, duration: .45, ease: 'back.out(2)' }, '-=.7')
        .from(of.querySelector('.of__preco s'), { autoAlpha: 0, y: 8, duration: .3 }, '-=.2')
        .fromTo(of.querySelector('.of__preco p'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, ease: 'back.out(1.8)' })
        .from(of.querySelector('.of__cb'), { scale: .6, autoAlpha: 0, duration: .5, ease: 'back.out(2.4)' }, '-=.2')
        .from(of.querySelector('.of__bt'), { y: 12, autoAlpha: 0, duration: .4 }, '-=.2');
      // de tempos em tempos o medidor faz um "teste de velocidade" de novo
      let vivo = true;
      new IntersectionObserver((es) => { vivo = es[0].isIntersecting; }).observe(of);
      setInterval(() => { if (vivo && !document.hidden && !tl.isActive()) mede(Math.round(alvo * .35), 1.4); }, 8000);
    }
  }

  /* 5. por que a Do Yourself: a frase acende palavra por palavra com a rolagem e a conversa aparece em sequência */
  const frase = document.querySelector('[data-frase]');
  if (frase) {
    const quebra = (el) => [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => { if (!t) return; if (/^\s+$/.test(t)) f.append(t); else { const w = document.createElement('span'); w.className = 'w'; w.textContent = t; f.append(w); } });
        n.replaceWith(f);
      } else if (n.nodeType === 1) quebra(n);
    });
    if (!calmo) {
      quebra(frase);
      const ws = [...frase.querySelectorAll('.w')];
      const acende = () => {
        const r = frase.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (innerHeight * .78 - r.top) / (r.height + innerHeight * .3)));
        const n = Math.round(p * ws.length);
        ws.forEach((w, k) => w.classList.toggle('is-on', k < n));
      };
      addEventListener('scroll', acende, { passive: true }); acende();
    }
  }
  const conversa = document.querySelector('[data-conversa]');
  if (conversa) {
    const itens = [...conversa.children];
    if (calmo || !('IntersectionObserver' in window)) itens.forEach((i) => i.classList.add('is-on'));
    else new IntersectionObserver((es, ob) => {
      if (!es[0].isIntersecting) return; ob.disconnect();
      itens.forEach((i, k) => setTimeout(() => i.classList.add('is-on'), 250 + k * 420));
    }, { threshold: .35 }).observe(conversa);
  }
})();
