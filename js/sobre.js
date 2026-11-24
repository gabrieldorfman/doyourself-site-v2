/* Do Yourself v2 — página Sobre: a logo explicada. Passa sozinha até alguém tocar. */
(function () {
  const box = document.querySelector('[data-lg]'); if (!box) return;
  const bts = [...box.querySelectorAll('button')]; let k = 0, t = null, ob = null;
  const vai = (n) => { k = n; box.dataset.p = n; bts.forEach((b, i) => b.setAttribute('aria-pressed', i === n)); };
  const para = () => { clearInterval(t); t = null; };
  const solta = () => { para(); if (ob) ob.disconnect(); };
  bts.forEach((b, i) => { b.addEventListener('click', () => { solta(); vai(i); }); b.addEventListener('focus', solta); });
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ob = new IntersectionObserver((es) => { para(); if (es[es.length - 1].isIntersecting) t = setInterval(() => vai((k + 1) % bts.length), 4000); }, { threshold: .4 });
    ob.observe(box);
  }
})();
