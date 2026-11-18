const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const raiz = path.resolve(__dirname, "..");
const ler = (arquivo) => fs.readFileSync(path.join(raiz, arquivo), "utf8");

function carregarIcones() {
  const window = {};
  vm.runInNewContext(ler("js/modules/combate-icons.js"), { window });
  return window.FichaDnDCombateIcons;
}

class ElementoSimulado {
  constructor(tag, ownerDocument) {
    this.tagName = tag;
    this.ownerDocument = ownerDocument;
    this.listeners = {};
    this.dataset = {};
    this.attributes = {};
    this.children = [];
    this.removed = false;
  }
  setAttribute(nome, valor) { this.attributes[nome] = valor; }
  addEventListener(nome, callback) { this.listeners[nome] = callback; }
  replaceChildren(...children) { this.children = children; }
  remove() { this.removed = true; }
}

function documentoSimulado() {
  return {
    createElement(tag) { return new ElementoSimulado(tag, this); },
    createTextNode(text) { return { textContent: text }; },
  };
}

test("manifest visual associa somente o ID oficial da Espada Longa", () => {
  const icons = carregarIcones();
  assert.equal(icons.obterIdCatalogo({ id: "espada-longa" }), "espada-longa");
  assert.equal(icons.obterFonteArma("espada-longa"), "../assets/icons/armas/two-handed-sword.svg");
  assert.equal(icons.obterFonteArma("espada-curta"), icons.caminhos.maoOcupada);
  assert.equal(icons.obterFonteArma("Espada Longa"), icons.caminhos.maoOcupada);
});

test("mãos livres, ocupadas, arma e escudo recebem apresentação apropriada", () => {
  const icons = carregarIcones();
  const documento = documentoSimulado();
  const botao = new ElementoSimulado("button", documento);

  icons.atualizarIconeMao(botao, "livre");
  assert.equal(botao.children[0].src, icons.caminhos.maoVazia);
  icons.atualizarIconeMao(botao, "arma", "espada-longa");
  assert.equal(botao.children[0].src, "../assets/icons/armas/two-handed-sword.svg");
  icons.atualizarIconeMao(botao, "arma", "arma-sem-mapeamento");
  assert.equal(botao.children[0].src, icons.caminhos.maoOcupada);
  icons.atualizarIconeMao(botao, "escudo");
  assert.equal(botao.children[0].textContent, "🛡️");
});

test("falha ao carregar o SVG específico cai para mão ocupada", () => {
  const icons = carregarIcones();
  const documento = documentoSimulado();
  const botao = new ElementoSimulado("button", documento);
  icons.atualizarIconeMao(botao, "arma", "espada-longa");
  const imagem = botao.children[0];
  imagem.listeners.error();
  assert.equal(imagem.src, icons.caminhos.maoOcupada);
  assert.equal(imagem.dataset.fallback, "usado");
  imagem.listeners.error();
  assert.equal(imagem.removed, true, "fallback inválido é removido em vez de deixar imagem quebrada");
});

test("ícone do card de ataque remove imagem se o recurso de fallback também falhar", () => {
  const icons = carregarIcones();
  const documento = documentoSimulado();
  const imagem = icons.criarIconeArma(documento, { id: "espada-longa" });
  imagem.listeners.error();
  assert.equal(imagem.src, icons.caminhos.maoOcupada);
  imagem.listeners.error();
  assert.equal(imagem.removed, true);
});

test("ícone dos cards de ataque segue o mesmo mapeamento central", () => {
  const icons = carregarIcones();
  const documento = documentoSimulado();
  assert.equal(icons.criarIconeArma(documento, { id: "espada-longa" }).src, "../assets/icons/armas/two-handed-sword.svg");
  assert.equal(icons.criarIconeArma(documento, { nome: "Espada Longa" }).src, icons.caminhos.maoOcupada);
});

test("ícones de mão usam glifo preto sobre fundo transparente", () => {
  for (const arquivo of [
    "assets/icons/interface/maos/mao-vazia.svg",
    "assets/icons/interface/maos/mao-ocupada.svg",
  ]) {
    const svg = ler(arquivo);
    assert.match(svg, /fill="#000"/, `${arquivo} mantém o glifo preto`);
    assert.doesNotMatch(svg, /fill="#fff"|M0 0h512v512H0z/, `${arquivo} não inclui fundo sólido branco ou preto`);
  }
});

test("todos os SVGs do catálogo usam glifos pretos e fundo transparente", () => {
  const raizIcones = path.join(raiz, "assets/icons");
  const listar = (diretorio) => fs.readdirSync(diretorio, { withFileTypes: true }).flatMap((item) => {
    const caminho = path.join(diretorio, item.name);
    return item.isDirectory() ? listar(caminho) : item.name.toLowerCase().endsWith(".svg") ? [caminho] : [];
  });
  const arquivos = listar(raizIcones);
  assert.ok(arquivos.length >= 2, "há SVGs catalogados para validar");
  for (const arquivo of arquivos) {
    const svg = fs.readFileSync(arquivo, "utf8");
    const relativo = path.relative(raiz, arquivo);
    assert.doesNotMatch(svg, /<path\s+d="M0\s+0h\d+v\d+H0z"[^>]*fill="#000"/i, `${relativo} não possui fundo preto opaco`);
    const fills = [...svg.matchAll(/\bfill\s*=\s*(["'])(.*?)\1/gi)].map((match) => match[2]);
    for (const fill of fills) assert.match(fill, /^(?:#000(?:000)?|black|none|transparent|currentcolor)$/i, `${relativo} contém fill não preto: ${fill}`);
    const strokes = [...svg.matchAll(/\bstroke\s*=\s*(["'])(.*?)\1/gi)].map((match) => match[2]);
    for (const stroke of strokes) assert.match(stroke, /^(?:#000(?:000)?|black|none|transparent|currentcolor)$/i, `${relativo} contém stroke não preto: ${stroke}`);
    assert.doesNotMatch(svg, /(?:^|[;"'])\s*fill\s*:\s*(?!#000(?:000)?\b|black\b|none\b|transparent\b|currentcolor\b)[^;"']+/i, `${relativo} contém fill de estilo não preto`);
  }
});

test("histórico permanece fora das subabas e existe a aba Outras ações sem mecânicas inventadas", () => {
  const layout = ler("js/modules/combate-layout-v2.js");
  const combat = ler("js/modules/combate.js");
  const magic = ler("js/modules/magias.js");
  assert.match(layout, /criar\("button", "subaba-botao", "Outras ações"\)/);
  for (const action of ["Esquivar", "Desengajar", "Disparada", "Ajudar", "Esconder", "Preparar"]) {
    assert.match(layout, new RegExp(`\\["${action}", "[^"]+"\\]`), `ação ${action} ausente da aba Outras ações`);
  }
  assert.match(layout, /Priorizar sua defesa/);
  assert.match(layout, /Mover sem provocar ataques/);
  assert.match(layout, /Movimento adicional/);
  assert.match(layout, /Apoiar um aliado/);
  assert.match(layout, /Buscar cobertura/);
  assert.match(layout, /Definir um gatilho/);
  assert.match(layout, /registrarAcaoVisual\(label, icon\)/);
  assert.match(layout, /\[\["Esquivar", "◇"\], \["Desengajar", "↗"\]\]/);
  assert.match(layout, /Fazer teste de resistência/);
  assert.match(layout, /Ação", `\$\{label\} — registrada; sem resolução automática`, icon/);
  assert.match(layout, /historyButton\?\.remove\(\)/);
  assert.match(layout, /history\.classList\.remove\("subaba-combate", "ativa"\)/);
  assert.doesNotMatch(combat, /abrirHistoricoAposFinalizar/);
  assert.doesNotMatch(magic, /trocarSubAbaCombate\("historico"/);
  assert.match(combat, /if \(tipo === "historico" \|\| !botao\) return/);
  assert.match(combat, /tipo === "outras"[\s\S]*subabaCombateOutras/);
});

test("escudo de CA usa arte decorativa vetorial com moldura dupla e valor oficial sobreposto", () => {
  const html = ler("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const css = ler("css/combate-2.0.css");
  const combat = html.slice(html.indexOf('id="combate"'));
  assert.match(combat, /class="combat-v2-ac-shield-art"[^>]*aria-hidden="true"/);
  assert.match(combat, /id="ataqueCaTotal"[\s\S]*?aria-label="Classe de armadura no painel de ataque"/);
  assert.match(css, /combat-v2-shield \.combat-v2-ac-shield-art/);
  assert.match(css, /combat-v2-shield \.shield input \{[^}]*z-index:1/);
  assert.match(css, /combat-v2-defense-value \{[^}]*grid-template-columns:minmax\(0,1fr\)[^}]*justify-items:center/);
  assert.match(css, /combat-v2-armor-controls \{[^}]*width:100%/);
  assert.doesNotMatch(css, /combat-v2-shield \.shield \{[^}]*clip-path:polygon/);
});

test("ícone da mão secundária é espelhado no slot, sem espelhar o ícone do ataque", () => {
  const layout = ler("js/modules/combate-layout-v2.js");
  const css = ler("css/combate-2.0.css");
  assert.match(layout, /slot === 2\) icon\.classList\.add\("combat-v2-hand-icon--secondary"\)/);
  assert.match(layout, /selectedName\.textContent = handSelect\.value[\s\S]*?"—"/);
  assert.match(layout, /emptyOption\.textContent = "Selecionar equipamento"/);
  assert.match(css, /combat-v2-hand-icon--secondary \.equipados-mao-emoji img \{ transform:scaleX\(-1\); \}/);
  assert.doesNotMatch(css, /combat-v2-attack[^}]*scaleX\(-1\)/);
});

test("PV destaca o valor atual, reduz o máximo e só mostra temporários quando positivos", () => {
  const layout = ler("js/modules/combate-layout-v2.js");
  const css = ler("css/combate-2.0.css");
  const html = ler("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  assert.match(layout, /hpText\.textContent = `PV \$\{current\}`/);
  assert.match(layout, /hpTotal\.textContent = `\/ \$\{maximum\} PV`/);
  assert.match(layout, /temporaryValue > 0 \? `\+\$\{temporaryValue\}` : ""/);
  assert.match(layout, /hpValue\.append\(hpTemporary, hpTotal\)/);
  assert.match(html, /id="ataquePvAtual">[\s\S]*?<span>PV 0<\/span>[\s\S]*?id="ataquePvHearts"/);
  assert.match(css, /combat-v2-hp-total \{[^}]*font:12px/);
  assert.match(css, /ataque-pv-coracoes \{ display:flex; order:1; flex:0 0 100%/);
  assert.match(css, /combat-v2-summary \{ grid-template-columns:minmax\(0,1\.5fr\) minmax\(0,1\.05fr\)/);
});

test("card de iniciativa usa controles oficiais em cabeçalho e linha compacta sem resumo duplicado", () => {
  const layout = ler("js/modules/combate-layout-v2.js");
  const html = ler("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const css = ler("css/combate-2.0.css");
  assert.match(layout, /initiativeHeaderValue\.append\(initiativeResultBlock\)/);
  assert.doesNotMatch(layout, /"Resultado"/);
  assert.match(layout, /initiativeResultBlock\.append\(initiativeResult\)/);
  assert.match(layout, /initiativeSummary\.append\(initiativeBonus\)/);
  assert.match(layout, /turnHead\?\.append\(initiativeHeaderValue\)/);
  assert.match(layout, /Posição/);
  assert.match(layout, /Rolar iniciativa/);
  assert.match(layout, /roundLabel\) roundLabel\.textContent = "Rodada"/);
  assert.match(layout, /positionLabel\.textContent = "Posição:"/);
  assert.match(layout, /roundValue\.append\(roundLabel, roundInput\)/);
  assert.match(layout, /nextTurnRow\.append\(nextRound\)/);
  assert.match(layout, /nextRound\.textContent = "Próximo turno"/);
  assert.match(layout, /setAttribute\("aria-label", "Próximo turno"\)/);
  assert.match(layout, /turnControlRow\.append\(control\)/);
  assert.match(layout, /turnFooter\.append\(endCombat\)/);
  assert.match(layout, /initiativeResult\.textContent = total == null \? "" : String\(total\)/);
  assert.match(layout, /initiativeBonus\.textContent = `Bônus/);
  assert.match(layout, /initiativeBonus\.hidden = active/);
  assert.match(layout, /initiativeSummary\.hidden = active/);
  assert.match(layout, /turnPanel\.classList\.toggle\("combat-v2-in-combat", active\)/);
  assert.doesNotMatch(layout, /Combate não iniciado/);
  assert.doesNotMatch(layout, /Posição \$\{document\.getElementById\("ataquePosicao"\)[\s\S]*Rodada/);
  assert.match(html, /id="ataquePosicao"/);
  assert.match(html, /id="combateRodada"/);
  assert.match(html, /id="btnProximaRodada"/);
  assert.match(html, /id="btnEncerrarCombate"/);
  assert.match(css, /combat-v2-turn-controls \{ display:flex;[^}]*flex-wrap:wrap/);
  assert.match(css, /combat-v2-initiative-result \{ color:var\(--v2-muted\); font:400 15px/);
  assert.match(css, /#combateRodadaCaixa > label \{ color:var\(--v2-ink\); font:600 14px/);
  assert.match(css, /#combateRodada \{ width:46px;[^}]*font:600 18px/);
  assert.match(css, /#btnProximaRodada \{ width:auto; min-width:max-content;[^}]*font:600 12px/);
  assert.match(css, /combat-v2-turn\.combat-v2-in-combat \.combat-v2-panel-head \{ justify-content:flex-start/);
  assert.match(css, /combat-v2-turn\.combat-v2-in-combat \.combat-v2-turn-controls \{ display:grid; grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /#combatePosicaoCaixa,[\s\S]*#combateRodadaCaixa \{ grid-column:1\/-1; width:100%/);
  assert.match(css, /combat-v2-round-value \{ display:flex; align-items:center; justify-content:flex-start; gap:6px/);
  assert.match(css, /combat-v2-next-turn-row \{ display:flex; justify-content:center/);
  assert.match(css, /combat-v2-turn:not\(\.combat-v2-in-combat\) \.combat-v2-turn-controls \{ justify-content:center;[^}]*border-top:1px solid var\(--v2-line\)/);
  assert.match(css, /combat-v2-turn:not\(\.combat-v2-in-combat\) \.combat-v2-turn-footer \{ display:none/);
  assert.match(css, /combat-v2-initiative-summary \{ display:flex; flex:1 1 auto; align-items:center; justify-content:center/);
  assert.match(css, /combat-v2-finalize-history \{ display:inline-flex;[^}]*width:auto/);
  assert.match(css, /combat-v2-turn-footer \{ display:flex; justify-content:flex-end/);
  assert.match(css, /combat-v2-hud \.ataque-status-caixa \{ display:flex;[^}]*border:0/);
  assert.match(css, /combat-v2-hud \.ataque-status-caixa > label \{[^}]*text-transform:none/);
});

test("integração reutiliza controles canônicos no interior de #combate", () => {
  const html = ler("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const inicio = html.indexOf('<div id="combate"');
  const fim = html.indexOf('<div id="magia"', inicio);
  assert.ok(inicio >= 0 && fim > inicio, "aba #combate delimitada no HTML oficial");
  const combate = html.slice(inicio, fim);
  for (const id of [
    "arma1Nome", "arma2Nome", "arma1Ataque", "arma2Ataque", "armaduraNome",
    "escudoCA", "ataqueCaTotal", "ataquePvAtual", "ataqueCondicao",
    "btnRolarIniciativa", "btnProximaRodada", "btnEncerrarCombate",
    "subabaCombateArma", "subabaCombateMagia", "historicoRegistros",
  ]) {
    assert.match(combate, new RegExp(`id="${id}"`), `mantém controle #${id}`);
    assert.equal((html.match(new RegExp(`id="${id}"`, "g")) || []).length, 1, `ID #${id} não duplicado`);
  }
  assert.match(combate, /class="aba combate-v2"/);
  assert.match(combate, /id="ataqueCondicao"/);
  assert.match(html, /id="condicoesModalOverlay"/);
  assert.match(combate, /abrirModalVida\('dano'\)/);
  assert.match(combate, /abrirModalVida\('cura'\)/);
});

test("estilos novos ficam limitados à aba Combate", () => {
  const css = ler("css/combate-2.0.css");
  const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const seletores = semComentarios.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.endsWith("{") && !line.startsWith("@"))
    .map((line) => line.slice(0, -1).trim());
  assert.ok(seletores.length > 0);
  for (const seletor of seletores) {
    assert.ok(seletor.startsWith("#combate"), `seletor fora do escopo: ${seletor}`);
  }
  assert.doesNotMatch(css, /display\s*:\s*contents/i, "a nova hierarquia não depende de flattening dos cartões antigos");
  assert.match(css, /combat-v2-summary\s*\{[^}]*minmax\(250px,1\.4fr\)/, "o cartão da CA recebe largura mínima suficiente para seus controles");
  assert.match(css, /combat-v2-condition-body\s*\{[^}]*grid-template-columns:auto minmax\(0,1fr\)/, "o botão de condição mantém seu texto e a área ocupa o espaço restante");
  assert.match(css, /combat-v2-armor-details\s*\{[^}]*grid-template-columns:minmax\(0,1fr\)/, "os campos de armadura não são comprimidos lado a lado");
  assert.match(css, /equipados-municao-linha\.oculto\s*\{\s*display:none/, "linhas de munição ocultas continuam ocultas dentro da aba");
  assert.match(css, /combat-v2-actions \.subaba-vazia\s*\{[^}]*min-height:0/, "estados sem itens não reservam altura extra");
});

test("adaptador reorganiza os controles oficiais em painéis de combate 2.0", () => {
  const layout = ler("js/modules/combate-layout-v2.js");
  for (const marker of [
    "combat-v2-summary", "combat-v2-hands-panel", "combat-v2-actions",
    "combat-v2-log", "combat-v2-inventory-grid", "ataque-pv-bloco",
    "ataque-mini-escudo", "ataqueCondicao", "lista-armas-equipamento",
    "lista-armaduras-equipamento", "lista-escudos-equipamento",
    "lista-outros-equipamento", "gridOriginal.replaceChildren(shell)",
  ]) assert.ok(layout.includes(marker), `layout usa o componente oficial ${marker}`);
  assert.match(layout, /combat-v2-add-condition[\s\S]*ataqueCondicao[\s\S]*\.click\(\)/);
  assert.match(layout, /combate\.dataset\.combateV2Montado/);
  assert.match(layout, /combat-v2-compat/);
  assert.match(layout, /armaduraCA/);
  assert.match(layout, /armaduraFurtividade/);
  assert.match(layout, /arma1Dano/);
  assert.match(layout, /combat-v2-condition-chips/);
  assert.match(layout, /combat-v2-concentration/);
  assert.match(layout, /combat-v2-initiative-result/);
  assert.match(layout, /historicoRegistros/);
});

test("campos canônicos removidos visualmente permanecem ocultos e atributos seguem os ataques", () => {
  const layout = ler("js/modules/combate-layout-v2.js");
  const css = ler("css/combate-2.0.css");
  const combat = ler("js/modules/combate.js");
  assert.match(layout, /compat\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(layout, /field\.tabIndex = -1/);
  assert.match(css, /\.combat-v2-compat\s*\{\s*display:none !important/);
  assert.match(combat, /atributosAtaque\?\.\[arma\.slot\]/);
  assert.match(combat, /arma-resumo-atributo/);
  assert.match(combat, /arma-resumo-acao/);
  assert.doesNotMatch(layout, /armorCaField|stealthField/);
});

test("manifest visual carrega antes dos módulos que atualizam mãos e ataques", () => {
  const html = ler("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const posIcones = html.indexOf("js/modules/combate-icons.js");
  assert.ok(posIcones > 0);
  assert.ok(posIcones < html.indexOf("js/modules/equipamentos.js"));
  assert.ok(posIcones < html.indexOf("js/modules/combate.js"));
  assert.ok(html.indexOf("js/modules/combate-layout-v2.js") > html.indexOf("js/modules/combate.js"));
  assert.match(html, /css\/combate-2\.0\.css\?v=combate-v2-27/);
  assert.match(html, /js\/modules\/combate-armas\.js\?v=combate-v2-1/);
  assert.match(html, /js\/modules\/equipamentos\.js\?v=outros-catalogo-2&combate-v2-1/);
  assert.match(html, /js\/modules\/combate\.js\?v=municoes-3&combate-v2-2/);
  assert.match(html, /js\/modules\/combate-layout-v2\.js\?v=combate-v2-12/);
});
