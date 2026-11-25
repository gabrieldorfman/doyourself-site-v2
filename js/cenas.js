/* Do Yourself v2 — cenas isométricas: troca de cena no topo e cena interativa das áreas comuns */
(function () {
  const $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const liga = (bts, fn) => { const vai = (i) => { bts.forEach((b, k) => b.setAttribute('aria-pressed', k === i)); fn(i); }; bts.forEach((b, i) => b.addEventListener('click', () => vai(i))); return vai; };

  /* topo: troca sozinha enquanto ninguém toca */
  $$('[data-iso]').forEach((el) => {
    const imgs = $$('.iso__p img', el), bts = $$('.iso__b button', el); if (bts.length < 2) return;
    let i = 0, vis = false, t = 0;
    const mostra = (k) => { i = k; imgs.forEach((m, n) => { m.loading = 'eager'; m.classList.toggle('is-on', n === k); if (n === k) m.removeAttribute('aria-hidden'); else m.setAttribute('aria-hidden', 'true'); }); };
    const vai = liga(bts, mostra), parar = () => clearInterval(t);
    imgs.forEach((m, n) => n && m.setAttribute('aria-hidden', 'true'));
    el.addEventListener('pointerdown', parar); el.addEventListener('focusin', parar);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    new IntersectionObserver((es) => (vis = es[es.length - 1].isIntersecting)).observe(el);
    t = setInterval(() => vis && !document.hidden && vai((i + 1) % imgs.length), 8000);
  });

  /* tipo de comércio: a fachada acompanha os botões (js/energia.js cuida dos textos) */
  $$('[data-iso-aba]').forEach((el) => {
    const imgs = $$('img', el), bts = $$('[data-en-aba]', el.parentElement);
    const ve = () => bts.forEach((b, n) => imgs[n].classList.toggle('is-on', b.getAttribute('aria-checked') === 'true'));
    bts.forEach((b) => new MutationObserver(ve).observe(b, { attributes: true, attributeFilter: ['aria-checked'] }));
  });

  /* áreas comuns: prédio ou casas */
  $$('[data-iso-tr]').forEach((el) => { const ps = $$('.en-pr', el); liga($$('.iso__b button', el), (k) => ps.forEach((p, n) => (p.hidden = n !== k))); });
  $$('[data-hs]').forEach((el) => { const ps = $$('.hs__p', el); liga($$('.iso__b button', el), (k) => ps.forEach((p, n) => (p.hidden = n !== k))); });

  /* /energia: o caminho da energia, passo a passo e em loop */
  $$('[data-iso-passos]').forEach((el) => {
    const bts = $$('.iso__d button', el), tx = el.querySelector('.iso__t'), poe = () => { const s = el.querySelector('svg'); if (s) s.dataset.e = i + 1; };
    let i = 0, vis = true, t = 0;
    const vai = liga(bts, (k) => { i = k; tx.innerHTML = `<b>${k + 1}</b><span>${bts[k].dataset.t}</span>`; poe(); });
    el.addEventListener('iso:ok', poe);
    const parar = () => { clearInterval(t); el.classList.add('is-parado'); };
    bts.forEach((b) => b.addEventListener('click', parar));
    $$('[data-iso-v]', el).forEach((b) => b.addEventListener('click', () => { parar(); vai((i + +b.dataset.isoV + bts.length) % bts.length); }));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return el.classList.add('is-parado');
    new IntersectionObserver((es) => (vis = es[es.length - 1].isIntersecting)).observe(el);
    t = setInterval(() => vis && !document.hidden && el.querySelector('svg') && vai((i + 1) % bts.length), 5000);
  });

  const carrega = (el) => fetch(`/img/cenas/${el.dataset.isoSvg}.svg`).then((r) => (r.ok ? r.text() : Promise.reject())).then((s) => { el.innerHTML = s; el.dispatchEvent(new CustomEvent('iso:ok', { bubbles: true })); }).catch(() => { el.innerHTML = `<img alt="" src="/img/cenas/${el.dataset.isoSvg}.svg">`; });
  $$('[data-iso-svg]').forEach((el) => {
    if (!('IntersectionObserver' in window)) return carrega(el);
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); carrega(el); } }, { rootMargin: '300px' }); io.observe(el);
  });
})();
