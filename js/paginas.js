/* Do Yourself v2 — peças comuns das páginas internas
   1. Preço e Cashback dos planos de internet ([data-preco-plano] e [data-cb-plano]) pelo estado escolhido
   2. Página sem o CEP no topo: o botão "Ver ofertas do meu CEP" leva até o CEP do rodapé */
(function () {
  const precos = () => {
    if (!window.DY || !DY.catalogo) return;
    const lista = DY.catalogo.casa[DY.blocoInternet(DY.uf)] || [];
    const menor = (id) => { const p = lista.find((x) => x.id === id); return p ? Math.min(...p.opcoes.map((o) => o.preco)) : null; };
    document.querySelectorAll('[data-preco-plano]').forEach((el) => {
      const v = menor(el.dataset.precoPlano);
      const tag = el.closest('.tag'); if (tag) tag.hidden = v === null;
      if (v !== null) el.textContent = DY.brl(Math.round(v * 100));
    });
    document.querySelectorAll('[data-cb-plano]').forEach((el) => {
      const v = menor(el.dataset.cbPlano);
      const tag = el.closest('.tag'); if (tag) tag.hidden = v === null;
      if (v !== null) el.textContent = DY.brl(DY.cashbackCentavos(Math.round(v * 100), 50));
    });
  };
  precos(); document.addEventListener('dy:planos', precos);

  if (!document.getElementById('cep-topo')) {
    const alvo = document.querySelector('.rod__cta');
    if (alvo) alvo.id = 'cep-topo';
  }
})();
