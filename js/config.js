/* ============================================================
   Do Yourself — configuração e dados de vitrine
   Preços e textos espelham o Figma (cards 23:2961, 23:3078,
   23:3204, 23:3339 · 23:4396, 23:4526, 23:4657, 23:15915, 23:4932)
   e a wiki (componente-cards-de-plano §5).
   No futuro estes dados vêm do Supabase por praça (CEP).
   ============================================================ */
window.DY = window.DY || {};

DY.config = {
  // [A DEFINIR] Número oficial da Do Yourself. Hoje é o que aparece no Figma.
  whatsapp: '5541995701636',
  whatsappExibicao: '(41) 99570-1636',
  // Página de conversão (passo a passo até o WhatsApp)
  paginaConversao: '/contratar.html',
  // Supabase — URL do projeto + chave PUBLICÁVEL (anon). Nunca a service_role aqui.
  // Vazio = modo demonstração: o fluxo funciona, o pedido fica só no navegador e a fibra aparece "a confirmar".
  supabaseUrl: '',
  supabaseChave: '',
};

/* ---------- Energia: estimativa da simulação (sem citar parceira) ----------
   Faixas internas (modelo-cashback-doyourself): abaixo de R$ 500 não elegível (decisão de 23/11/2026) ·
   R$ 500 a R$ 2.999,99 → 20% · R$ 3.000 a R$ 7.999,99 → 25% · R$ 8.000 ou mais → 30% (decisão de 23/11/2026). É ESTIMATIVA: o valor final sai da fatura. */
DY.energia = {
  minimo: 500,
  descontoPct: (conta) => (conta >= 8000 ? 30 : conta >= 3000 ? 25 : 20),
  // Estados atendidos pela energia por assinatura. Vazio = Brasil todo (decisão de 23/11/2026): a disponibilidade é confirmada no WhatsApp.
  ufsAtendidas: [],
  atende(uf) { return !this.ufsAtendidas.length || this.ufsAtendidas.includes(String(uf || '').toUpperCase()); },
  simular(contaReais) {
    const conta = DY.centavos(contaReais);
    if (contaReais < this.minimo) return { elegivel: false, conta };
    const pct = this.descontoPct(contaReais);
    const comDesconto = conta - Math.floor((conta * pct) / 100);
    return { elegivel: true, conta, pct, comDesconto, economiaMes: conta - comDesconto, cashback: DY.cashbackCentavos(comDesconto, 10) };
  },
};

/* Bancos aceitos no débito automático, em ordem alfabética.
   Só os que cadastram sem erro no sistema da operadora (Caixa e os demais ficam de fora). */
DY.bancosDebito = [
  ['001', 'Banco do Brasil', 'BB'], ['237', 'Bradesco', 'BR'], ['336', 'C6 Bank', 'C6'], ['077', 'Inter', 'IN'],
  ['341', 'Itaú', 'IT'], ['260', 'Nubank', 'NU'], ['033', 'Santander', 'SA'],
]

/* ---------- Rotas do site (Mapa de Páginas do Figma 23:14786) ----------
   pronta: true  → o link vai para a página.
   pronta: false → vai para o "alt" (uma seção da home ou a contratação) ou aparece como "em breve".
   Para publicar uma página nova: criar o arquivo e trocar pronta para true. */
DY.rotas = {
  inicio:            { r: 'Início', href: '/', pronta: true },
  combo:             { r: 'Combo', href: '/combo', pronta: true },
  energia:           { r: 'Energia por assinatura', href: '/energia', pronta: true },
  'energia-sim':     { r: 'Simulador de economia', href: '/energia/simulador', pronta: true },
  'energia-cond':    { r: 'Para Condomínios', href: '/energia/condominio', pronta: true },
  'energia-com':     { r: 'Para Comércios', href: '/energia/comercio', pronta: true },
  'energia-emp':     { r: 'Para Empresas', href: '/energia/empresas', pronta: true },
  internet:          { r: 'Internet Fibra', href: '/internet', pronta: true },
  'internet-casa':   { r: 'Internet para Casa', href: '/internet/casa', pronta: true },
  'internet-emp':    { r: 'Internet para Empresa', href: '/internet/empresa', pronta: true },
  'internet-wttx':   { r: 'WTTx', href: '/internet/wttx', pronta: true },
  'internet-home':   { r: 'Internet para Home Office', href: '/internet/home-office', pronta: true },
  'internet-gamer':  { r: 'Internet Gamer', href: '/internet/gamer', pronta: true },
  'internet-stream': { r: 'Internet com Streaming', href: '/internet/streaming', pronta: true },
  'internet-wifi':   { r: 'Wi-Fi 5, 6 e 7', href: '/internet/wi-fi', pronta: true },
  celular:           { r: 'Planos para CNPJ', href: '/celular', pronta: true },
  'celular-mei':     { r: 'Celular para MEI', href: '/celular/mei', pronta: true },
  'celular-port':    { r: 'Portabilidade grátis', href: '/celular/portabilidade', pronta: true },
  apps:              { r: 'Aplicativos inclusos', href: '/aplicativos', pronta: true },
  'app-entrar':      { r: 'Como entrar nos aplicativos', href: '/aplicativos/como-entrar', pronta: true },
  'app-globoplay':   { r: 'Globoplay', href: '/aplicativos/globoplay', pronta: true },
  'app-hbo':         { r: 'HBO Max', href: '/aplicativos/hbo-max', pronta: true },
  'app-paramount':   { r: 'Paramount+', href: '/aplicativos/paramount', pronta: true },
  'app-youtube':     { r: 'YouTube Premium', href: '/aplicativos/youtube', pronta: true },
  'app-noping':      { r: 'NoPing', href: '/aplicativos/noping', pronta: true },
  ajuda:             { r: 'Central de ajuda', href: '/ajuda', pronta: true },
  suporte:           { r: 'Suporte 24 horas', href: '/ajuda/suporte', pronta: true },
  biometria:         { r: 'Como fazer a biometria', href: '/ajuda/biometria', pronta: true },
  'ajuda-internet':  { r: 'Ajuda com a internet', href: '/ajuda/internet', pronta: true },
  'ajuda-celular':   { r: 'Ajuda com o celular', href: '/ajuda/celular', pronta: true },
  'ajuda-energia':   { r: 'Ajuda com a energia', href: '/ajuda/energia', pronta: true },
  sobre:             { r: 'Sobre a Do Yourself', href: '/sobre', pronta: true },
  cashback:          { r: 'Como funciona o Cashback', href: '/cashback', pronta: true },
  contato:           { r: 'Contato', href: '/contato', pronta: false, alt: 'whatsapp' },
  duvidas:           { r: 'Dúvidas frequentes', href: '/#duvidas', pronta: true },
  privacidade:       { r: 'Política de Privacidade', href: '/privacidade', pronta: true },
  termos:            { r: 'Termos de uso', href: '/termos', pronta: true },
};
/* Menu principal (mapa do site v2). Ordem: Combo → Energia → Internet → Celular */
DY.menu = [
  ['inicio'], ['combo'],
  // [rótulo, subitens, página principal (clique no rótulo leva para ela)]
  ['Energia', ['energia', 'energia-sim', 'energia-cond', 'energia-com', 'energia-emp'], 'energia'],
  ['Internet', ['internet', 'internet-casa', 'internet-emp', 'internet-wttx', 'internet-wifi'], 'internet'],
  ['Celular', ['celular', 'celular-mei', 'celular-port'], 'celular'],
  ['Aplicativos', ['apps', 'app-entrar', 'app-globoplay', 'app-paramount', 'app-hbo', 'app-youtube', 'app-noping'], 'apps'],
  ['Ajuda', ['ajuda', 'suporte', 'biometria', 'ajuda-internet', 'ajuda-celular', 'ajuda-energia'], 'ajuda'],
  ['Sobre', ['sobre', 'cashback'], 'sobre'],
];
/* Endereço de uma rota: a página, o atalho ou null (= em breve) */
DY.linkRota = (k) => {
  const x = DY.rotas[k]; if (!x) return null;
  if (x.pronta) return x.href;
  if (x.alt === 'whatsapp') return DY.linkWhatsApp('Olá! Vim pelo site da Do Yourself e preciso de ajuda.');
  return x.alt || null;
};

DY.img = (p) => '/img/' + p;
/* Domínio oficial do site (os links internos são relativos e funcionam em qualquer endereço) */
DY.dominio = 'https://doyourself.digital';

/* ============================================================
   PLANOS — outubro 2026 (ULTRABOOK até 03/11 · BOOK TBP até 05/11)
   Fonte: wiki tabela-cashback-outubro-2026 e planos-tim-ultrafibra.
   Os preços de internet mudam por bloco de estados; o celular muda só no PR/SC.
   ============================================================ */
const icNet = (premium) => (n) => (premium ? 'premium-' : '') + n + '.svg';
const detNet = (down, up, wifi, premium) => {
  const i = icNet(premium);
  return [[i('download'), 'Download', down], [i('upload'), 'Upload', up], [i('modem'), 'Modem', `Wi-Fi ${wifi} incluso`], [i('instalacao'), 'Instalação:', 'Gratuita']];
};
const SO = (preco, de, resumo) => ({ nome: 'Somente Internet', preco, de, resumo });
const PARA = (preco, de, resumo, logo = 'paramount') => ({ nome: 'Paramount+', logo, preco, de, resumo });
const GLOBO = (preco, de, resumo) => ({ nome: 'GloboPlay', logo: 'globoplay', preco, de, resumo });
const HBO = (preco, de, resumo) => ({ nome: 'HBO Max', logo: 'hbo-max', preco, de, resumo });

// Peças reaproveitadas entre os blocos de estados (base: ofertas de NOVEMBRO/2026, válidas até 01/12/2026)
// Valores no débito em conta; no boleto ou PIX, R$ 10,00 a mais por mês.
const W56 = '5', W67 = '6'; // 300 a 800 Mega: Wi-Fi 5 · 1.000 Mega: Wi-Fi 6 · 2.000 Mega: Wi-Fi 7
const net800 = { id: '800', variante: 'soft', selo: 'COM YOUTUBE PREMIUM', num: '800', unidade: 'MEGA',
  detalhes: detNet('800 Mega', '400 Mega', W56), apps: ['aya-books', 'youtube-premium'], tituloAcao: 'Já vem incluso no seu plano',
  opcoes: [{ nome: 'YouTube Premium', logo: 'youtube-premium', preco: 129.99, de: 169.99, incluso: 'sem custo extra', resumo: '800 Mega + YouTube Premium' }], opcaoPadrao: 0, de: 169.99, tarja: { streaming: ['youtube-premium'] } };
const net1000 = { id: '1000', variante: 'premium', selo: 'OFERTA DO MÊS', num: '1000', unidade: 'MEGA',
  detalhes: detNet('1.000 Mega', '500 Mega', W67, true), apps: ['aya-books', 'aya-bancah', 'paramount-44'], tituloAcao: 'Personalize o seu plano',
  opcoes: [{ ...SO(99.99, 189.99, '1.000 Mega + NoPing'), nome: 'Somente Internet' }, PARA(149.99, 199.99, '1.000 Mega + Paramount+', 'paramount-44'), HBO(159.99, 219.99, '1.000 Mega + HBO Max')], opcaoPadrao: 0, de: 189.99, tarja: { streaming: ['paramount', 'hbo-max'] } };
const net600 = { id: '600', variante: 'tint', selo: 'ESSENCIAL', num: '600', unidade: 'MEGA',
  detalhes: detNet('600 Mega', '300 Mega', W56), apps: ['aya-books', 'aya-bancah', 'paramount'], tituloAcao: 'Personalize o seu plano',
  opcoes: [SO(109.99, 149.99, '600 Mega'), PARA(109.99, 149.99, '600 Mega + Paramount+'), GLOBO(119.99, 159.99, '600 Mega + GloboPlay')], opcaoPadrao: 0, de: 149.99, tarja: { streaming: ['paramount', 'globoplay'] } };
const net2000 = { id: '2000', variante: 'premium', selo: 'WI-FI 7', num: '2000', unidade: 'MEGA',
  detalhes: detNet('2.000 Mega', '1.000 Mega', 7, true), apps: ['aya-books', 'aya-bancah', 'hbo-max', 'paramount', 'globoplay'], tituloAcao: 'Já vem incluso no seu plano',
  opcoes: [{ nome: 'HBO Max, Paramount+, GloboPlay e Looke', logo: 'hbo-max', preco: 369.99, de: 419.99, incluso: 'quatro streamings', resumo: '2.000 Mega + 4 streamings' }], opcaoPadrao: 0, de: 419.99, tarja: { streaming: ['hbo-max', 'paramount', 'globoplay'] } };
// velocidade escrita com ponto de milhar: 1.000 Mega, 2.000 Mega
const mega = (n) => String(n).replace(/^(\d)(\d{3})$/, '$1.$2') + ' Mega';
const netSimples = (id, preco, de, up, wifi, selo, variante, extra) => ({ id, variante, selo, num: id.replace(/^e/, ''), unidade: 'MEGA',
  ...(extra ? { nota: extra } : {}),
  detalhes: detNet(mega(id.replace(/^e/, '')), up, wifi, variante === 'premium'), apps: ['aya-books', 'aya-bancah'],
  tituloAcao: 'Este plano inclui', opcoes: [SO(preco, de, mega(id.replace(/^e/, '')))], opcaoPadrao: 0, de, tarja: { streaming: null } });

DY.catalogo = {
  // Internet para a sua casa (CPF)
  casa: {
    tbr: [netSimples('500', 89.99, 129.99, '250 Mega', W56, 'BÁSICO', 'branco'), net600, net800, net1000, net2000],
    norte: [netSimples('500', 79.99, 129.99, '250 Mega', W56, 'BÁSICO', 'branco'), net600, net800, net1000, net2000],
    ce: [netSimples('300', 49.99, 99.99, '150 Mega', W56, 'SÓ NO CEARÁ', 'branco'), netSimples('500', 79.99, 129.99, '250 Mega', W56, 'BÁSICO', 'branco'), net600, net800, net1000, net2000],
    sp: [netSimples('400', 79.99, 119.99, '200 Mega', W56, 'BÁSICO', 'branco'), netSimples('500', 99.99, 129.99, '250 Mega', W56, 'BÁSICO', 'branco'), net600, net800, net1000, net2000],
  },
  // Internet para a sua empresa (CNPJ) — sem streaming e sem bônus no celular
  empresa: {
    tbr: [netSimples('e500', 89.99, 129.99, '250 Mega', W56, 'BÁSICO', 'branco'), netSimples('e600', 109.99, 149.99, '300 Mega', W56, 'ESSENCIAL', 'tint'), netSimples('e1000', 99.99, 189.99, '500 Mega', W67, 'OFERTA DO MÊS', 'premium')],
    norte: [netSimples('e500', 79.99, 129.99, '250 Mega', W56, 'BÁSICO', 'branco'), netSimples('e600', 109.99, 149.99, '300 Mega', W56, 'ESSENCIAL', 'tint'), netSimples('e1000', 99.99, 189.99, '500 Mega', W67, 'OFERTA DO MÊS', 'premium')],
    ce: [netSimples('e300', 49.99, 99.99, '150 Mega', W56, 'SÓ NO CEARÁ', 'branco'), netSimples('e500', 79.99, 129.99, '250 Mega', W56, 'BÁSICO', 'branco'), netSimples('e600', 109.99, 149.99, '300 Mega', W56, 'ESSENCIAL', 'tint'), netSimples('e1000', 99.99, 189.99, '500 Mega', W67, 'OFERTA DO MÊS', 'premium')],
    sp: [netSimples('e400', 79.99, 119.99, '200 Mega', W56, 'BÁSICO', 'branco'), netSimples('e500', 99.99, 129.99, '250 Mega', W56, 'BÁSICO', 'branco'), netSimples('e600', 109.99, 149.99, '300 Mega', W56, 'ESSENCIAL', 'tint'), netSimples('e1000', 99.99, 189.99, '500 Mega', W67, 'OFERTA DO MÊS', 'premium')],
  },
};
// Plano que abre em destaque em cada lista (a oferta foco)
/* Página de cada plano de internet para casa (id do catálogo → endereço) */
DY.paginaPlano = { 500: '/internet/casa/500-mega', 600: '/internet/casa/600-mega', 800: '/internet/casa/800-mega', 1000: '/internet/casa/1000-mega', 2000: '/internet/casa/2000-mega' };
DY.validadeOferta = '01/12/2026'; // ofertas de novembro/2026
DY.boletoPix = 10; // boleto ou PIX: R$ 10,00 a mais por mês
DY.padraoInternet = (lista) => Math.max(0, lista.findIndex((p) => p.selo === 'OFERTA DO MÊS'));

/* Bloco de preço de internet pelo estado: CE, RN e SC · SP · demais (inclui PR) */
DY.blocoInternet = (uf) => (uf === 'CE' ? 'ce' : ['RN', 'SC'].includes(uf) ? 'norte' : uf === 'SP' ? 'sp' : 'tbr');
DY.prepUF = (uf) => (/^(BA|PB)$/.test(uf) ? 'da' : /^(AL|GO|MT|MS|MG|PE|RO|RR|SC|SP|SE)$/.test(uf) ? 'de' : 'do'); // do Paraná, da Bahia, de Goiás
DY.UFS = { AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins' };

/* ============================================================
   PLANOS DE CELULAR
   CPF  → planos controle (preço e internet mudam: portabilidade × número novo).
          Preços de referência da Do Yourself (decisão de 06/11/2026).
   CNPJ → planos empresariais (tabela própria no PR e em SC) + ofertas só de portabilidade.
   Fonte: wiki Regras Do Yourself, partes 5 e 6. Cashback = 100% da mensalidade.
   ============================================================ */
// Apps que não descontam da franquia (base de celular, nov/2026): 6 e 12 GB têm 4; do 30 GB para cima, os 7
const ZERO_BASICO = ['whatsapp', 'whatsapp-business', 'messenger', 'waze'];
const ZERO_COMPLETO = ['whatsapp', 'whatsapp-business', 'instagram', 'facebook', 'messenger', 'waze', 'x'];
const detCel = (p, prem) => {
  const x = prem ? 'premium-' : '';
  return [
    [(prem ? 'premium-dados' : 'dados-moveis') + '.svg', 'Internet', `${p.gb} GB por mês${p.plano ? ` (${p.plano} GB do plano + ${p.bonus} GB de bônus)` : ''}`],
    [x + 'ligacoes.svg', 'Ligações', p.minutos ? `${p.minutos} minutos para todo o Brasil` : 'Ilimitadas para qualquer operadora do Brasil'],
    [x + 'sms.svg', 'SMS', p.tipo === 'cpf' ? 'Ilimitados' : '800 por mês'],
    [x + 'tecnologias.svg', 'Em outro estado', p.tipo === 'cpf' ? 'Use em todo o Brasil sem custo extra' : 'Receba ligações sem custo extra'],
    [x + 'portabilidade.svg', 'Portabilidade', p.tipo === 'cpf' ? 'Traga seu número, sem custo' : 'Traga o número que já está no CNPJ, sem custo'],
  ];
};
const cel = (o) => { const p = { unidade: 'GB', num: String(o.gb), ...o }; p.detalhes = detCel(p, p.variante === 'premium'); return p; };

// CPF — planos controle. gb/preco = portabilidade · gbNova/precoNova = número novo ou migração
DY.celularCpf = [
  cel({ tipo: 'cpf', id: 'aplus', nome: 'Controle A Plus', slug: 'a-plus', selo: 'ENTRADA', variante: 'branco', gb: 27, gbNova: 19, preco: 46.99, precoNova: 46.99, minutos: 550, apps: ['messenger'],
    extras: ['550 minutos de ligação', 'Roaming no Chile sem custo', 'Messenger sem gastar a internet', 'Cartão de TODOS'] }),
  cel({ tipo: 'cpf', id: 'controle', nome: 'Controle', slug: 'controle', selo: 'OFERTA DO MÊS', variante: 'soft', gb: 45, gbNova: 35, preco: 49.99, precoNova: 58.99, apps: [],
    extras: ['Deezer Premium grátis por 3 meses', 'Ligações e SMS ilimitados', 'Audiolivros, estudos e revistas', 'Cartão de TODOS'] }),
  cel({ tipo: 'cpf', id: 'redes', nome: 'Controle Redes Sociais', slug: 'redes-sociais', selo: 'REDES SOCIAIS', variante: 'tint', gb: 46, gbNova: 26, preco: 59.99, precoNova: 64.99, apps: ['facebook', 'instagram', 'messenger'],
    extras: ['Facebook, Instagram, X e Messenger sem gastar a internet', 'Ligações e SMS ilimitados', 'Jornais e revistas', 'Cartão de TODOS'] }),
  cel({ tipo: 'cpf', id: 'premium', nome: 'Controle Premium', slug: 'premium', selo: 'MAIS INTERNET', variante: 'premium', gb: 55, gbNova: 45, preco: 74.99, precoNova: 84.99, apps: ['facebook', 'instagram', 'messenger'],
    extras: ['5 GB só para redes sociais', 'Roaming no Chile sem custo', 'Ligações e SMS ilimitados', 'Cartão de TODOS'] }),
];
DY.celularCpf.forEach((p) => (p.cashback = 100));

// CNPJ — planos empresariais, preço por linha (Book de NOVEMBRO/2026, válido até 01/12/2026).
// [id, GB do plano, GB de bônus, preço PR/SC, preço demais UFs, selo, variante, apps, preço "de"]
// 80 GB: oferta relâmpago de novembro, todas as UFs (de R$ 79,99 por R$ 53,99). 40 e 150 GB: preço especial de novembro.
const EMP = [
  ['6', 1, 5, 39.99, 29.99, 'ENTRADA', 'branco', ZERO_BASICO],
  ['12', 2, 10, 44.99, 39.99, 'BÁSICO', 'branco', ZERO_BASICO],
  ['30', 10, 20, 52.99, 52.99, 'ESSENCIAL', 'tint', ZERO_COMPLETO],
  ['40', 20, 20, 39.99, 39.99, 'PREÇO ESPECIAL', 'tint', ZERO_COMPLETO, 64.99],
  ['50', 30, 20, 69.99, 69.99, 'MAIS INTERNET', 'tint', ZERO_COMPLETO],
  ['80', 30, 50, 53.99, 53.99, 'OFERTA DO MÊS', 'soft', ZERO_COMPLETO, 79.99],
  ['100', 50, 50, 99.99, 99.99, 'PREMIUM', 'premium', ZERO_COMPLETO],
  ['150', 100, 50, 99.99, 99.99, 'PREÇO ESPECIAL', 'premium', ZERO_COMPLETO, 149.99],
];
// Só para quem traz o número (portabilidade, no mesmo CNPJ)
const PORTA = [
  ['p21', 21, 1, 20, 39.99, 'SÓ PORTABILIDADE', 'branco'],
  ['p40', 40, 20, 20, 50.99, 'SÓ PORTABILIDADE', 'tint'],
  ['p70', 70, 20, 50, 59.99, 'SÓ PORTABILIDADE', 'soft'],
];
DY.celularCnpj = (prsc) => EMP.map(([id, plano, bonus, a, b, selo, variante, apps, de]) => cel({ tipo: 'cnpj', id, nome: `Empresa ${id} GB`, gb: plano + bonus, plano, bonus, preco: prsc ? a : b, ...(de ? { de } : {}), selo, variante, apps, cashback: 100 }));
DY.celularPorta = PORTA.map(([id, gb, plano, bonus, preco, selo, variante]) => cel({ tipo: 'cnpj', id, nome: `Portabilidade ${gb} GB`, gb, plano, bonus, preco, selo, variante, apps: ZERO_COMPLETO, soPorta: true, cashback: 100 }));
// Linhas: o site aceita de 1 a 5.000; acima de 15 linhas a condição é personalizada (atendimento). MEI: até 3 linhas de até R$ 100 cada.
DY.linhasMax = 5000; DY.linhasEspecial = 15;
/* Preço e internet de um plano de celular (CPF: depende de trazer o número ou não) */
DY.celPreco = (p, porta = true) => (!porta && p.precoNova ? p.precoNova : p.preco);
DY.celGB = (p, porta = true) => (!porta && p.gbNova ? p.gbNova : p.gb);
// Vitrine da home (acordeão): 4 planos por tipo
const VITRINE_CNPJ = ['40', '80', '150'];

/* ---------- Estado atual dos planos (muda pelo estado do cliente e pela aba casa/empresa) ----------
   UF: a escolhida pelo cliente > a do CEP > a detectada pela conexão > PR. */
DY.definirPlanos = ({ uf, tipo, celular } = {}) => {
  if (uf && DY.UFS[uf]) DY.uf = uf;
  if (tipo) DY.tipoInternet = tipo === 'empresa' ? 'empresa' : 'casa';
  if (celular) DY.tipoCelular = celular === 'cpf' ? 'cpf' : 'cnpj';
  DY.planosInternet = DY.catalogo[DY.tipoInternet][DY.blocoInternet(DY.uf)];
  DY.internetPadrao = DY.padraoInternet(DY.planosInternet);
  DY.planosCnpj = DY.celularCnpj(['PR', 'SC'].includes(DY.uf));
  // Lista completa (contratação) e vitrine de 4 (acordeão da home)
  DY.planosCelular = DY.tipoCelular === 'cpf' ? DY.celularCpf : [...DY.planosCnpj, ...DY.celularPorta];
  DY.vitrineCelular = DY.tipoCelular === 'cpf' ? DY.celularCpf : VITRINE_CNPJ.map((id) => DY.planosCnpj.find((p) => p.id === id));
  DY.celularPadrao = Math.max(0, DY.vitrineCelular.findIndex((p) => p.selo === 'OFERTA DO MÊS'));
  if (document.readyState !== 'loading') document.dispatchEvent(new CustomEvent('dy:planos'));
};
DY.uf = 'PR'; DY.cidade = ''; DY.tipoInternet = 'casa'; DY.tipoCelular = 'cnpj';
/* Onde o cliente está: 1) o endereço que ele já consultou na contratação; 2) a conexão (/api/uf); 3) Paraná */
try { const l = JSON.parse(localStorage.getItem('dy_local') || 'null'); if (l && DY.UFS[l.uf]) { DY.uf = l.uf; DY.cidade = l.cidade || ''; DY.localDoCep = true; } } catch (e) { /* sem storage */ }
DY.definirPlanos({});
DY.detectarUF = async () => {
  if (DY.localDoCep) return;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch('/api/uf', { cache: 'no-store', signal: ctl.signal }); clearTimeout(t);
    const { uf, cidade } = await r.json();
    if (uf && DY.UFS[uf]) { DY.cidade = cidade || ''; DY.definirPlanos({ uf }); }
  } catch (e) { /* fica no Paraná */ }
};
/* Guardado quando o cliente consulta o endereço: a home passa a mostrar as ofertas da cidade dele */
DY.salvarLocal = (uf, cidade) => { try { localStorage.setItem('dy_local', JSON.stringify({ uf, cidade })); } catch (e) { /* */ } };
DY.textoLocal = () => (DY.cidade ? `${DY.cidade} - ${DY.uf}` : DY.UFS[DY.uf]);

/* ---------- WTTx: internet sem fio 4G para empresas (base WTTx, nov/2026, todas as UFs) ----------
   Planos pela franquia, do menor para o maior. Modem incluso no plano (devolvido no cancelamento).
   Cashback: 50% de uma mensalidade. Não entra no combo por enquanto. */
DY.wttx = [
  { id: 'w40', gb: 40, mbps: 2, preco: 49.99, selo: 'ENTRADA' },
  { id: 'w80', gb: 80, mbps: 5, preco: 89.90, selo: 'ESSENCIAL' },
  { id: 'w100', gb: 100, mbps: 5, preco: 99.99, selo: 'MAIS FRANQUIA' },
  { id: 'w500', gb: 500, mbps: 5, preco: 149.99, selo: 'MÁXIMO' },
];

/* Logos de aplicativo (pasta img/apps) */
DY.logos = {
  'aya-books': { src: 'apps/aya-books.png', alt: 'AYA Books' },
  'aya-bancah': { src: 'apps/aya-bancah.png', alt: 'AYA Bancah' },
  'paramount': { src: 'apps/paramount-tile.svg', alt: 'Paramount+' },
  'paramount-44': { src: 'apps/paramount-44.svg', alt: 'Paramount+' },
  'globoplay': { src: 'apps/globoplay.png', alt: 'GloboPlay' },
  'hbo-max': { src: 'apps/hbo-max.png', alt: 'HBO Max' },
  'youtube-premium': { src: 'apps/youtube-premium-logo.svg', alt: 'YouTube Premium' },
  'whatsapp': { src: 'apps/whatsapp.svg', alt: 'WhatsApp' },
  'whatsapp-business': { src: 'apps/whatsapp-business.svg', alt: 'WhatsApp Business' },
  'x': { src: 'apps/x.svg', alt: 'X' },
  'messenger': { src: 'apps/messenger.svg', alt: 'Messenger' },
  'waze': { src: 'apps/waze.svg', alt: 'Waze' },
  'waze-premium': { src: 'apps/waze-premium.svg', alt: 'Waze' },
  'facebook': { src: 'apps/facebook.svg', alt: 'Facebook' },
  'instagram': { src: 'apps/instagram.svg', alt: 'Instagram' },
};

/* ---------- Utilidades de dinheiro ----------
   Tudo em centavos inteiros para não errar no ponto flutuante.
   Cashback TRUNCA no centavo (regras-de-cashback §2.3). */
DY.centavos = (reais) => Math.round(reais * 100);
// Cashback TRUNCADO no centavo (Regras Do Yourself 1.x: 50% de R$ 129,99 = R$ 64,99) — a mesma regra em todo o site
DY.cashbackCentavos = (baseCentavos, pct) => Math.floor((baseCentavos * pct) / 100 + 1e-9);
DY.brl = (centavos) => 'R$ ' + (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Valor em reais, como a pessoa digita: "800" → 800 · "1500" → 1.500 · "1500,5" → 1.500,5 */
DY.formatarReais = (v) => {
  const t = String(v).replace(/[^\d,]/g, ''); const i = t.indexOf(',');
  let int = (i < 0 ? t : t.slice(0, i)).replace(/^0+(?=\d)/, '').slice(0, 7);
  const dec = i < 0 ? null : t.slice(i + 1).replace(/,/g, '').slice(0, 2);
  if (!int && dec === null) return '';
  int = (int || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec === null ? int : int + ',' + dec;
};
DY.lerReais = (v) => Number(String(v || '').replace(/\./g, '').replace(',', '.')) || 0;

// origem do pedido: o serviço (e o plano) que a página mostra, o endereço dela e o lugar do clique
DY.servicoDaPagina = function () {
  const p = location.pathname.replace(/\.html$/, '').replace(/^\/|\/$/g, ''), m = p.match(/^internet\/casa\/(\d+)-mega/);
  if (m) return { origem: 'internet', para: 'casa', plano: m[1] };
  if (p === 'internet/empresa') return { origem: 'internet', para: 'empresa' };
  if (p === 'internet') return { origem: 'internet' };
  if (p === 'internet/wttx') return {};
  if (/^(internet\/|aplicativos)/.test(p)) return { origem: 'internet', para: 'casa' };
  const s = p.split('/')[0];
  return ['energia', 'celular', 'combo'].includes(s) ? { origem: s } : {};
};
DY.linkContratar = function (dados, lugar) {
  const d = Object.assign({}, dados && dados.origem ? {} : DY.servicoDaPagina(), dados || {});
  const q = new URLSearchParams({ origem: d.origem || 'home' });
  Object.keys(d).forEach((k) => { if (k !== 'origem' && d[k] != null && d[k] !== '') q.set(k, d[k]); });
  q.set('pagina', location.pathname.replace(/\.html$/, '').replace(/^\/|\/$/g, '') || 'inicio');
  if (lugar) q.set('botao', lugar);
  return '/contratar?' + q.toString().replace(/%2F/g, '/').replace(/%2C/g, ',');
};
DY.linkWhatsApp = (texto) => 'https://wa.me/' + DY.config.whatsapp + (texto ? '?text=' + encodeURIComponent(texto) : '');
