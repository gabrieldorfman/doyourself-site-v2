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
    // página geral de internet: "a partir de" de cada serviço no estado escolhido
    if (document.querySelector('[data-int-min]')) {
      const fibra = (l) => Math.min(...l.map((x) => x.opcoes[0].preco));
      const min = { casa: fibra(lista), empresa: fibra(DY.catalogo.empresa[DY.blocoInternet(DY.uf)]), wttx: Math.min(...DY.wttx.map((x) => x.preco)) };
      document.querySelectorAll('[data-int-min]').forEach((el) => { el.textContent = DY.brl(Math.round(min[el.dataset.intMin] * 100)); });
      document.querySelectorAll('[data-int-cb]').forEach((el) => { el.textContent = DY.brl(DY.cashbackCentavos(Math.round(min[el.dataset.intCb] * 100), 50)); });
      document.querySelectorAll('[data-int-vel]').forEach((el) => { el.textContent = Math.min(...lista.map((x) => +x.id)); });
    }
  };
  precos(); document.addEventListener('dy:planos', precos);

  if (!document.getElementById('cep-topo')) {
    const alvo = document.querySelector('.rod__cta');
    if (alvo) alvo.id = 'cep-topo';
  }
})();
