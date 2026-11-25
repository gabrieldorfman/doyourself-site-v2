/* Do Yourself v2 — páginas de internet
   1. Oferta do mês animada no topo
   2. Por que a Do Yourself: frase que acende e conversa em sequência */
(function () {
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js-net');
  const milhar = (n) => String(n).replace(/^(\d)(\d{3})$/, '$1.$2');
  const brl = (v) => (window.DY ? DY.brl(Math.round(v * 100)) : 'R$ ' + v.toFixed(2).replace('.', ','));

  /* 1. oferta do mês no topo: lê o plano em oferta do estado escolhido e anima o medidor */
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
      of.querySelector('.of__bt').setAttribute('href', '/contratar?origem=internet&para=casa&plano=' + p.id);
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

  /* 2. por que a Do Yourself: a frase acende palavra por palavra com a rolagem e a conversa aparece em sequência */
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
