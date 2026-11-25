/* Do Yourself v2 — home office
   1. O 500 some onde custa o mesmo que o 1.000 ou mais, e o 800 entra no lugar   2. Videochamada   3. O dia
   Preços e tempo de envio vêm de js/gamer.js */
(function () {
  const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const radios = (bts, fn) => bts.forEach((b, i) => {
    const vai = (x) => { bts.forEach((y) => { y.setAttribute('aria-checked', y === x); y.tabIndex = y === x ? 0 : -1; }); fn(x); };
    b.addEventListener('click', () => vai(b));
    b.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (d) { e.preventDefault(); const x = bts[(i + d + bts.length) % bts.length]; vai(x); x.focus(); } });
  });

  /* 1. */
  const q = $('[data-ho-500]'), r = $('[data-ho-800]');
  const some = () => { const l = DY.catalogo.casa[DY.blocoInternet(DY.uf || 'PR')] || [], v = (id) => { const p = l.find((x) => x.id === id); return p ? DY.centavos(p.opcoes[0].preco) : Infinity; }; q.hidden = v('500') >= v('1000'); r.hidden = !q.hidden || v('800') === Infinity; };
  if (q && window.DY) { some(); document.addEventListener('dy:planos', some); }

  /* 2. a mesma foto, nítida ou quadriculada e travando */
  const rn = $('[data-ho-rn]');
  if (rn) {
    const cv = $('canvas', rn), ctx = cv.getContext('2d'), leg = $('[data-ho-leg]', rn), txt = $('[data-ho-t]', rn), peq = document.createElement('canvas'), pc = peq.getContext('2d'), im = new Image();
    const FALA = { bom: ['Bom dia, pessoal!', 'Vou mostrar o resultado do mês.', 'Alguma dúvida até aqui?'], ruim: ['Bom d… pess…', 'Vou most… o res… …ês.', 'Alg… dúv… … qui?'] };
    const TXT = { bom: 'Com folga no upload, sua imagem e sua voz chegam inteiras.', ruim: 'Com pouco upload, a imagem quadricula e a voz corta.' };
    let modo = 'ruim', ini = 0, visto = false, rod = 0, ultimo = -1;
    const desenha = (s, bloco) => {
      const W = cv.width, H = cv.height, z = 1.04 + Math.sin(s * .9) * .018, r = Math.max(W / im.naturalWidth, H / im.naturalHeight) * z, w = im.naturalWidth * r, h = im.naturalHeight * r, x = (W - w) * .5 + Math.sin(s * .7) * W * .006, y = (H - h) * .5 + Math.cos(s * 1.1) * H * .006;
      if (bloco < 2) { ctx.imageSmoothingEnabled = true; ctx.drawImage(im, x, y, w, h); return; }
      peq.width = Math.ceil(W / bloco); peq.height = Math.ceil(H / bloco); pc.drawImage(im, x / bloco, y / bloco, w / bloco, h / bloco);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(peq, 0, 0, peq.width * bloco, peq.height * bloco);
    };
    const tela = () => { const b = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); cv.width = Math.max(1, Math.round(b.width * d)); cv.height = Math.max(1, Math.round(b.height * d)); ultimo = -1; if (calmo || !visto) para(); };
    const para = () => { if (im.naturalWidth) desenha(0, modo === 'bom' ? 1 : cv.width / 46); leg.textContent = FALA[modo][1]; };
    const quadro = (ms) => {
      if (!visto) { rod = 0; return; }
      rod = requestAnimationFrame(quadro);
      const s = (ms - ini) / 1000, f = Math.floor(s / 2.6) % 3;
      if (leg.textContent !== FALA[modo][f]) leg.textContent = FALA[modo][f];
      if (modo === 'bom') { rn.classList.remove('is-presa'); desenha(s, 1); return; }
      const c = s % 5.2, presa = c > 2.4 && c < 4.2; rn.classList.toggle('is-presa', presa);
      const p = presa ? -9 : Math.floor(s * 4); // poucos quadros por segundo
      if (p !== ultimo) { if (!presa) desenha(p / 4, cv.width / [58, 40, 30, 46][p % 4]); else if (ultimo === -1) desenha(0, cv.width / 40); ultimo = p; }
    };
    const liga = () => { if (calmo) { para(); return; } if (visto && !rod) { ini = performance.now(); rod = requestAnimationFrame(quadro); } };
    const troca = (m) => { modo = m; rn.dataset.u = m; txt.textContent = TXT[m]; ini = performance.now(); ultimo = -1; rn.classList.remove('is-presa'); if (calmo) para(); };
    radios($$('button[data-u]', rn), (b) => troca(b.dataset.u)); troca('ruim');
    im.onload = () => { tela(); new IntersectionObserver((es) => { visto = es[es.length - 1].isIntersecting; liga(); }).observe(cv); new ResizeObserver(tela).observe(cv); };
    im.src = '/img/fotos/videochamada.webp';
  }

  /* 3. o sol anda com o horário */
  const dia = $('[data-ho-dia]');
  if (dia) {
    const it = $$('.ho-dia__i', dia), ve = (k) => { dia.dataset.k = k; dia.style.setProperty('--k', k); dia.style.setProperty('--a', Math.sin((k / 5) * Math.PI)); it.forEach((x, i) => x.classList.toggle('is-on', i === k)); };
    radios($$('button[data-k]', dia), (b) => ve(+b.dataset.k)); ve(0);
  }
})();
