const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const raiz = path.resolve(__dirname, "..");
const ler = (arquivo) => fs.readFileSync(path.join(raiz, arquivo), "utf8");

function normalizarEspacosCss(valor) {
  return valor.replace(/\s+/g, " ").trim();
}

function separarSeletoresCss(valor) {
  const seletores = [];
  let inicio = 0;
  let parenteses = 0;
  let colchetes = 0;
  for (let indice = 0; indice < valor.length; indice += 1) {
    if (valor[indice] === "(") parenteses += 1;
    else if (valor[indice] === ")") parenteses -= 1;
    else if (valor[indice] === "[") colchetes += 1;
    else if (valor[indice] === "]") colchetes -= 1;
    else if (valor[indice] === "," && parenteses === 0 && colchetes === 0) {
      seletores.push(normalizarEspacosCss(valor.slice(inicio, indice)));
      inicio = indice + 1;
    }
  }
  seletores.push(normalizarEspacosCss(valor.slice(inicio)));
  return seletores.filter(Boolean);
}

// Lê blocos CSS sem depender de uma declaração por linha. Também conserva
// regras internas de @media, para conferir o escopo de cada seletor real.
function obterRegrasCss(css) {
  const fonte = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const regras = [];
  const pilha = [];
  let inicio = 0;

  for (let indice = 0; indice < fonte.length; indice += 1) {
    if (fonte[indice] === "{") {
      const cabecalho = fonte.slice(inicio, indice).trim();
      const bloco = cabecalho.startsWith("@")
        ? { tipo: "at-rule", inicio: indice + 1 }
        : {
            tipo: "regra",
            seletores: separarSeletoresCss(cabecalho),
            inicio: indice + 1,
          };
      pilha.push(bloco);
      inicio = indice + 1;
    } else if (fonte[indice] === "}") {
      const bloco = pilha.pop();
      if (bloco?.tipo === "regra") {
        const declaracoes = Object.fromEntries(
          fonte
            .slice(bloco.inicio, indice)
            .split(";")
            .map((declaracao) => declaracao.trim())
            .filter(Boolean)
            .map((declaracao) => {
              const separador = declaracao.indexOf(":");
              return [
                normalizarEspacosCss(declaracao.slice(0, separador)),
                normalizarEspacosCss(declaracao.slice(separador + 1)),
              ];
            }),
        );
        regras.push({ seletores: bloco.seletores, declaracoes });
      }
      inicio = indice + 1;
    }
  }
  return regras;
}

function declaracaoCss(css, seletorFinal, propriedade) {
  const regras = obterRegrasCss(css);
  for (let indice = regras.length - 1; indice >= 0; indice -= 1) {
    const regra = regras[indice];
    if (
      regra.seletores.some((seletor) => seletor.endsWith(seletorFinal)) &&
      regra.declaracoes[propriedade]
    ) {
      return regra.declaracoes[propriedade];
    }
  }
  return "";
}

function declaracoesCss(css, seletorFinal, propriedade) {
  return obterRegrasCss(css)
    .filter((regra) =>
      regra.seletores.some((seletor) => seletor.endsWith(seletorFinal)),
    )
    .map((regra) => regra.declaracoes[propriedade])
    .filter(Boolean);
}

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
  setAttribute(nome, valor) {
    this.attributes[nome] = valor;
  }
  addEventListener(nome, callback) {
    this.listeners[nome] = callback;
  }
  replaceChildren(...children) {
    this.children = children;
  }
  remove() {
    this.removed = true;
  }
}

function documentoSimulado() {
  return {
    createElement(tag) {
      return new ElementoSimulado(tag, this);
    },
    createTextNode(text) {
      return { textContent: text };
    },
  };
}

test("manifest visual associa somente o ID oficial da Espada Longa", () => {
  const icons = carregarIcones();
  assert.equal(icons.obterIdCatalogo({ id: "espada-longa" }), "espada-longa");
  assert.equal(
    icons.obterFonteArma("espada-longa"),
    "../assets/icons/armas/two-handed-sword.svg",
  );
  assert.equal(icons.obterFonteArma("espada-curta"), icons.caminhos.maoOcupada);
  assert.equal(icons.obterFonteArma("Espada Longa"), icons.caminhos.maoOcupada);
  assert.equal(
    icons.obterFonteArma("mace", { icone: "../assets/icons/armas/mace.svg" }),
    "../assets/icons/armas/mace.svg",
  );
  assert.equal(icons.obterFonteArma("mace"), "../assets/icons/armas/mace.svg");
  assert.equal(
    icons.obterFonteEscudo("shield"),
    "../assets/icons/escudos/viking-shield.svg",
  );
});

test("mãos livres, ocupadas, arma e escudo recebem apresentação apropriada", () => {
  const icons = carregarIcones();
  const documento = documentoSimulado();
  const botao = new ElementoSimulado("button", documento);

  icons.atualizarIconeMao(botao, "livre");
  assert.equal(botao.children[0].src, icons.caminhos.maoVazia);
  icons.atualizarIconeMao(botao, "arma", "espada-longa");
  assert.equal(
    botao.children[0].src,
    "../assets/icons/armas/two-handed-sword.svg",
  );
  icons.atualizarIconeMao(botao, "arma", "arma-sem-mapeamento");
  assert.equal(botao.children[0].src, icons.caminhos.maoOcupada);
  icons.atualizarIconeMao(botao, "escudo", "shield");
  assert.equal(
    botao.children[0].src,
    "../assets/icons/escudos/viking-shield.svg",
  );
  assert.equal(
    icons.obterIdCatalogo({
      catalogoId: "shield",
      icone: "../assets/icons/escudos/viking-shield.svg",
    }),
    "shield",
  );
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
  assert.equal(
    imagem.removed,
    true,
    "fallback inválido é removido em vez de deixar imagem quebrada",
  );
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
  assert.equal(
    icons.criarIconeArma(documento, { id: "espada-longa" }).src,
    "../assets/icons/armas/two-handed-sword.svg",
  );
  assert.equal(
    icons.criarIconeArma(documento, { nome: "Espada Longa" }).src,
    icons.caminhos.maoOcupada,
  );
});

test("ícone do resumo de ataque usa o campo icone do objeto equipado", () => {
  const icons = carregarIcones();
  const documento = documentoSimulado();
  const fonte = icons.obterFonteArma("mace", {
    catalogoId: "mace",
    icone: "../assets/icons/armas/mace.svg",
  });

  assert.equal(fonte, "../assets/icons/armas/mace.svg");
  assert.equal(
    icons.criarIconeArma(documento, {
      catalogoId: "mace",
      icone: "../assets/icons/armas/mace.svg",
    }).src,
    "../assets/icons/armas/mace.svg",
  );
});

test("painel de CA pode substituir o escudo pelo ícone da armadura equipada", () => {
  const html = ler("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const css = ler("css/combate-2.0.css");
  const combate = ler("js/modules/combate.js");
  const catalogo = JSON.parse(ler("assets/data/itens/armaduras.json"));

  assert.match(html, /id="ataqueCaArmaduraArt"/);
  assert.match(combate, /catalogoIcone/);
  assert.match(combate, /catalogoId/);
  assert.match(combate, /ataqueCaArmaduraArt/);
  assert.match(css, /\.combat-v2-ac-armor-art/);
  assert.match(css, /text-shadow:/);
  assert.equal(catalogo.itens.length, 12);
  assert.equal(new Set(catalogo.itens.map((item) => item.icone)).size, 12);
  assert.ok(
    catalogo.itens.every(
      (item) => typeof item.icone === "string" && item.icone.trim(),
    ),
  );
});

test("escudo equipado pode substituir o emoji pelo ícone catalogado", () => {
  const html = ler("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const css = ler("css/base.css") + ler("css/combate-2.0.css");
  const combate = ler("js/modules/combate.js");
  const escudos = JSON.parse(ler("assets/data/itens/escudos.json"));

  assert.match(html, /ataqueCaEscudoEmoji/);
  assert.match(combate, /catalogoEscudoIcone/);
  assert.match(combate, /iconeEscudo/);
  assert.match(css, /\.bonus-escudo-icone/);
  assert.match(css, /#fffaf0|#ffffff/);
  assert.ok(
    escudos.itens.every(
      (item) => typeof item.icone === "string" && item.icone.trim(),
    ),
  );
});

test("ícones de mão usam glifo preto sobre fundo transparente", () => {
  for (const arquivo of [
    "assets/icons/interface/maos/mao-vazia.svg",
    "assets/icons/interface/maos/mao-ocupada.svg",
  ]) {
    const svg = ler(arquivo);
    assert.match(svg, /fill="#000"/, `${arquivo} mantém o glifo preto`);
    assert.doesNotMatch(
      svg,
      /fill="#fff"|M0 0h512v512H0z/,
      `${arquivo} não inclui fundo sólido branco ou preto`,
    );
  }
});

test("todos os SVGs do catálogo usam glifos pretos e fundo transparente", () => {
  const raizIcones = path.join(raiz, "assets/icons");
  const listar = (diretorio) =>
    fs.readdirSync(diretorio, { withFileTypes: true }).flatMap((item) => {
      const caminho = path.join(diretorio, item.name);
      return item.isDirectory()
        ? listar(caminho)
        : item.name.toLowerCase().endsWith(".svg")
          ? [caminho]
          : [];
    });
  const arquivos = listar(raizIcones);
  assert.ok(arquivos.length >= 2, "há SVGs catalogados para validar");
  for (const arquivo of arquivos) {
    const svg = fs.readFileSync(arquivo, "utf8");
    const relativo = path.relative(raiz, arquivo);
    assert.doesNotMatch(
      svg,
      /<path\s+d="M0\s+0h\d+v\d+H0z"[^>]*fill="#000"/i,
      `${relativo} não possui fundo preto opaco`,
    );
    const fills = [...svg.matchAll(/\bfill\s*=\s*(["'])(.*?)\1/gi)].map(
      (match) => match[2],
    );
    for (const fill of fills)
      assert.match(
        fill,
        /^(?:#000(?:000)?|black|none|transparent|currentcolor)$/i,
        `${relativo} contém fill não preto: ${fill}`,
      );
    const strokes = [...svg.matchAll(/\bstroke\s*=\s*(["'])(.*?)\1/gi)].map(
      (match) => match[2],
    );
    for (const stroke of strokes)
      assert.match(
        stroke,
        /^(?:#000(?:000)?|black|none|transparent|currentcolor)$/i,
        `${relativo} contém stroke não preto: ${stroke}`,
      );
    assert.doesNotMatch(
      svg,
      /(?:^|[;"'])\s*fill\s*:\s*(?!#000(?:000)?\b|black\b|none\b|transparent\b|currentcolor\b)[^;"']+/i,
      `${relativo} contém fill de estilo não preto`,
    );
  }
});

test("histórico permanece fora das subabas e existe a aba Outras ações sem mecânicas inventadas", () => {
  const layout = ler("js/modules/combate-layout-v2.js");
  const combat = ler("js/modules/combate.js");
  const magic = ler("js/modules/magias.js");
  assert.match(layout, /criar\("button", "subaba-botao", "Outras ações"\)/);
  for (const action of [
    "Esquivar",
    "Desengajar",
    "Disparada",
    "Ajudar",
    "Esconder",
    "Preparar",
  ]) {
    assert.match(
      layout,
      new RegExp(`\\["${action}", "[^"]+"\\]`),
      `ação ${action} ausente da aba Outras ações`,
    );
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
  assert.match(
    layout,
    /Ação", `\$\{label\} — registrada; sem resolução automática`, icon/,
  );
  assert.match(layout, /historyButton\?\.remove\(\)/);
  assert.match(
    layout,
    /history\.classList\.remove\("subaba-combate", "ativa"\)/,
  );
  assert.doesNotMatch(combat, /abrirHistoricoAposFinalizar/);
  assert.doesNotMatch(magic, /trocarSubAbaCombate\("historico"/);
  assert.match(combat, /if \(tipo === "historico" \|\| !botao\) return/);
  assert.match(combat, /tipo === "outras"[\s\S]*subabaCombateOutras/);
});

test("escudo de CA usa arte decorativa vetorial com moldura dupla e valor oficial sobreposto", () => {
  const html = ler("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const css = ler("css/combate-2.0.css");
  const combat = html.slice(html.indexOf('id="combate"'));
  assert.match(
    combat,
    /class="combat-v2-ac-shield-art"[^>]*aria-hidden="true"/,
  );
  assert.match(
    combat,
    /id="ataqueCaTotal"[\s\S]*?aria-label="Classe de armadura no painel de ataque"/,
  );
  assert.match(css, /combat-v2-shield \.combat-v2-ac-shield-art/);
  assert.equal(
    declaracaoCss(
      css,
      ".combat-v2-shield .shield:not(.input-armadura) input",
      "z-index",
    ),
    "2",
    "o valor oficial fica acima da arte decorativa",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-defense-value", "grid-template-columns"),
    "minmax(0, 1fr)",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-defense-value", "justify-items"),
    "center",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-armor-controls", "width"),
    "100%",
  );
  assert.doesNotMatch(
    css,
    /combat-v2-shield \.shield \{[^}]*clip-path:polygon/,
  );
});

test("ícone da mão secundária é espelhado no slot, sem espelhar o ícone do ataque", () => {
  const layout = ler("js/modules/combate-layout-v2.js");
  const equipment = ler("js/modules/equipamentos.js");
  const css = ler("css/combate-2.0.css");
  assert.match(
    layout,
    /slot === 2\) icon\.classList\.add\("combat-v2-hand-icon--secondary"\)/,
  );
  assert.match(
    layout,
    /selectedName\.textContent = slot === 2 && duasMaos \? "Duas mãos" : "Mão Livre"/,
  );
  assert.match(layout, /"Mão Principal" : "Mão Secundária"/);
  assert.match(layout, /estadoCombate\?\.maoPrincipal\?\.modo === "duas_maos"/);
  assert.match(layout, /slot === 2 && duasMaos \? "Duas mãos" : "Mão Livre"/);
  assert.match(layout, /slot === 1 && duasMaos \? "Duas mãos" : ""/);
  assert.match(
    layout,
    /slotControl\.replaceChildren\(label, icon, selectedName, state, handSelect\)/,
  );
  const handUiStart = equipment.indexOf("function atualizarUIEmpunhadura(");
  const handUiEnd = equipment.indexOf(
    "\nfunction obterMenuEmpunhadura(",
    handUiStart,
  );
  assert.ok(handUiStart >= 0 && handUiEnd > handUiStart);
  assert.match(
    equipment.slice(handUiStart, handUiEnd),
    /FichaDnDCombateLayoutV2\?\.atualizar\(\)/,
  );
  assert.match(layout, /emptyOption\.textContent = "Selecionar equipamento"/);
  assert.match(
    declaracaoCss(
      css,
      ".combat-v2-hand-icon--secondary .equipados-mao-emoji img",
      "transform",
    ),
    /scaleX\(-1\)/,
  );
  assert.doesNotMatch(css, /combat-v2-attack[^}]*scaleX\(-1\)/);
});

test("cards de mãos mantêm nome centralizado e seletor compacto", () => {
  const css = ler("css/combate-2.0.css");
  assert.equal(
    declaracaoCss(css, ".combat-v2-hand-name", "text-align"),
    "center",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-hand-state:empty", "display"),
    "none",
  );
  assert.equal(
    declaracaoCss(
      css,
      ".combat-v2-hands-panel .equipados-slot-com-emoji select",
      "margin-top",
    ),
    "2px",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-hand-icon", "min-height"),
    "53px",
  );
});

test("PV destaca o valor atual, reduz o máximo e só mostra temporários quando positivos", () => {
  const layout = ler("js/modules/combate-layout-v2.js");
  const css = ler("css/combate-2.0.css");
  const html = ler("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  assert.match(layout, /hpText\.textContent = `PV \$\{current\}`/);
  assert.match(layout, /hpTotal\.textContent = `\/ \$\{maximum\} PV`/);
  assert.match(layout, /temporaryValue > 0 \? `\+\$\{temporaryValue\}` : ""/);
  assert.match(layout, /hpValue\.append\(hpTemporary, hpTotal\)/);
  assert.match(
    html,
    /id="ataquePvAtual">[\s\S]*?<span>PV 0<\/span>[\s\S]*?id="ataquePvHearts"/,
  );
  assert.match(
    declaracaoCss(css, ".combat-v2-hp-total", "font"),
    /12px\/1\.2/,
  );
  assert.equal(
    declaracaoCss(
      css,
      ".combat-v2-hp .ataque-pv-coracoes",
      "display",
    ),
    "flex",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-hp .ataque-pv-coracoes", "order"),
    "1",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-hp .ataque-pv-coracoes", "flex"),
    "0 0 100%",
  );
  assert.ok(
    declaracoesCss(css, ".combat-v2-summary", "grid-template-columns").some(
      (colunas) => /minmax\(0, 1\.5fr\) minmax\(0, 1\.05fr\)/.test(colunas),
    ),
    "o grid base mantém a proporção aprovada do resumo",
  );
});

test("card de iniciativa usa controles oficiais em cabeçalho e linha compacta sem resumo duplicado", () => {
  const layout = ler("js/modules/combate-layout-v2.js");
  const html = ler("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const css = ler("css/combate-2.0.css");
  assert.match(
    layout,
    /initiativeHeaderValue\.append\(initiativeResultBlock\)/,
  );
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
  assert.match(
    layout,
    /initiativeResult\.textContent = total == null \? "" : String\(total\)/,
  );
  assert.match(layout, /initiativeBonus\.textContent = `Bônus/);
  assert.match(layout, /initiativeBonus\.hidden = active/);
  assert.match(layout, /initiativeSummary\.hidden = active/);
  assert.match(
    layout,
    /turnPanel\.classList\.toggle\("combat-v2-in-combat", active\)/,
  );
  assert.doesNotMatch(layout, /Combate não iniciado/);
  assert.doesNotMatch(
    layout,
    /Posição \$\{document\.getElementById\("ataquePosicao"\)[\s\S]*Rodada/,
  );
  assert.match(html, /id="ataquePosicao"/);
  assert.match(html, /id="combateRodada"/);
  assert.match(html, /id="btnProximaRodada"/);
  assert.match(html, /id="btnEncerrarCombate"/);
  const turnControlRules = obterRegrasCss(css);
  const idleTurnControls = turnControlRules.find((rule) =>
    rule.seletores.includes(
      "#combate.combate-v2 .combat-v2-turn-controls",
    ),
  );
  const activeTurnControls = turnControlRules.find((rule) =>
    rule.seletores.includes(
      "#combate.combate-v2 .combat-v2-turn.combat-v2-in-combat .combat-v2-turn-controls",
    ),
  );
  assert.equal(idleTurnControls?.declaracoes.display, "flex");
  assert.equal(idleTurnControls?.declaracoes["flex-wrap"], "wrap");
  assert.equal(activeTurnControls?.declaracoes.display, "grid");
  assert.match(
    declaracaoCss(css, ".combat-v2-initiative-result", "font"),
    /400 15px\/1\.2/,
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-hud #combateRodadaCaixa > label", "color"),
    "var(--v2-ink)",
  );
  assert.match(
    declaracaoCss(
      css,
      ".combat-v2-hud #combateRodadaCaixa > label",
      "font",
    ),
    /600 14px/,
  );
  assert.equal(declaracaoCss(css, "#combateRodada", "width"), "46px");
  assert.match(declaracaoCss(css, "#combateRodada", "font"), /600 18px/);
  assert.equal(
    declaracaoCss(css, "#btnProximaRodada", "width"),
    "auto",
  );
  assert.equal(
    declaracaoCss(css, "#btnProximaRodada", "min-width"),
    "max-content",
  );
  assert.match(declaracaoCss(css, "#btnProximaRodada", "font"), /600 12px/);
  assert.equal(
    declaracaoCss(
      css,
      ".combat-v2-turn.combat-v2-in-combat .combat-v2-panel-head",
      "justify-content",
    ),
    "flex-start",
  );
  assert.equal(
    activeTurnControls.declaracoes["grid-template-columns"],
    "minmax(0, 1fr)",
  );
  for (const id of ["#combatePosicaoCaixa", "#combateRodadaCaixa"]) {
    assert.equal(
      declaracaoCss(
        css,
        `.combat-v2-turn.combat-v2-in-combat ${id}`,
        "grid-column",
      ),
      "1/-1",
    );
    assert.equal(
      declaracaoCss(
        css,
        `.combat-v2-turn.combat-v2-in-combat ${id}`,
        "width",
      ),
      "100%",
    );
  }
  assert.equal(declaracaoCss(css, ".combat-v2-round-value", "display"), "flex");
  assert.equal(
    declaracaoCss(css, ".combat-v2-round-value", "gap"),
    "6px",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-next-turn-row", "justify-content"),
    "center",
  );
  assert.equal(
    declaracaoCss(
      css,
      ".combat-v2-turn:not(.combat-v2-in-combat) .combat-v2-turn-controls",
      "justify-content",
    ),
    "center",
  );
  assert.equal(
    declaracaoCss(
      css,
      ".combat-v2-turn:not(.combat-v2-in-combat) .combat-v2-turn-footer",
      "display",
    ),
    "none",
  );
  assert.equal(
    turnControlRules.find((rule) =>
      rule.seletores.includes(
        "#combate.combate-v2 .combat-v2-initiative-summary",
      ),
    )?.declaracoes.display,
    "flex",
  );
  assert.equal(
    declaracaoCss(
      css,
      ".combat-v2-turn.combat-v2-in-combat .combat-v2-initiative-summary",
      "display",
    ),
    "none",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-finalize-history", "display"),
    "inline-flex",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-turn-footer", "display"),
    "flex",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-hud .ataque-status-caixa", "display"),
    "flex",
  );
  assert.equal(
    declaracaoCss(
      css,
      ".combat-v2-hud .ataque-status-caixa > label",
      "text-transform",
    ),
    "none",
  );
});

test("integração reutiliza controles canônicos no interior de #combate", () => {
  const html = ler("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const inicio = html.indexOf('<div id="combate"');
  const fim = html.indexOf('<div id="magia"', inicio);
  assert.ok(
    inicio >= 0 && fim > inicio,
    "aba #combate delimitada no HTML oficial",
  );
  const combate = html.slice(inicio, fim);
  for (const id of [
    "arma1Nome",
    "arma2Nome",
    "arma1Ataque",
    "arma2Ataque",
    "armaduraNome",
    "escudoCA",
    "ataqueCaTotal",
    "ataquePvAtual",
    "ataqueCondicao",
    "btnRolarIniciativa",
    "btnProximaRodada",
    "btnEncerrarCombate",
    "subabaCombateArma",
    "subabaCombateMagia",
    "historicoRegistros",
  ]) {
    assert.match(combate, new RegExp(`id="${id}"`), `mantém controle #${id}`);
    assert.equal(
      (html.match(new RegExp(`id="${id}"`, "g")) || []).length,
      1,
      `ID #${id} não duplicado`,
    );
  }
  assert.match(combate, /class="aba combate-v2"/);
  assert.match(combate, /id="ataqueCondicao"/);
  assert.match(html, /id="condicoesModalOverlay"/);
  assert.match(combate, /abrirModalVida\('dano'\)/);
  assert.match(combate, /abrirModalVida\('cura'\)/);
});

test("estilos novos ficam limitados à aba Combate", () => {
  const css = ler("css/combate-2.0.css");
  const seletores = obterRegrasCss(css).flatMap((regra) => regra.seletores);
  assert.ok(seletores.length > 0);
  for (const seletor of seletores) {
    assert.ok(
      seletor.startsWith("#combate"),
      `seletor fora do escopo: ${seletor}`,
    );
  }
  assert.doesNotMatch(
    css,
    /display\s*:\s*contents/i,
    "a nova hierarquia não depende de flattening dos cartões antigos",
  );
  assert.ok(
    declaracoesCss(css, ".combat-v2-summary", "grid-template-columns").some(
      (colunas) => /minmax\(250px, 1\.4fr\)/.test(colunas),
    ),
    "o cartão da CA recebe largura mínima suficiente para seus controles",
  );
  assert.ok(
    declaracoesCss(
      css,
      ".combat-v2-condition-body",
      "grid-template-columns",
    ).some((colunas) => /auto minmax\(0, 1fr\)/.test(colunas)),
    "o botão de condição mantém seu texto e a área ocupa o espaço restante",
  );
  assert.equal(
    declaracaoCss(
      css,
      ".combat-v2-armor-details",
      "grid-template-columns",
    ),
    "minmax(0, 1fr)",
    "os campos de armadura não são comprimidos lado a lado",
  );
  assert.equal(
    declaracaoCss(css, ".equipados-municao-linha.oculto", "display"),
    "none",
    "linhas de munição ocultas continuam ocultas dentro da aba",
  );
  assert.equal(
    declaracaoCss(css, ".combat-v2-actions .subaba-vazia", "min-height"),
    "0",
    "estados sem itens não reservam altura extra",
  );
});

test("adaptador reorganiza os controles oficiais em painéis de combate 2.0", () => {
  const layout = ler("js/modules/combate-layout-v2.js");
  for (const marker of [
    "combat-v2-summary",
    "combat-v2-hands-panel",
    "combat-v2-actions",
    "combat-v2-log",
    "combat-v2-inventory-grid",
    "ataque-pv-bloco",
    "ataque-mini-escudo",
    "ataqueCondicao",
    "lista-armas-equipamento",
    "lista-armaduras-equipamento",
    "lista-escudos-equipamento",
    "lista-outros-equipamento",
    "gridOriginal.replaceChildren(shell)",
  ])
    assert.ok(
      layout.includes(marker),
      `layout usa o componente oficial ${marker}`,
    );
  assert.match(
    layout,
    /combat-v2-add-condition[\s\S]*ataqueCondicao[\s\S]*\.click\(\)/,
  );
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
  assert.equal(
    declaracaoCss(css, ".combat-v2-compat", "display"),
    "none !important",
  );
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
  assert.ok(
    html.indexOf("js/modules/combate-layout-v2.js") >
      html.indexOf("js/modules/combate.js"),
  );
  assert.match(html, /css\/combate-2\.0\.css\?v=combate-v2-[\w.-]+/);
  assert.match(html, /js\/modules\/combate-armas\.js\?v=icone-json-20261119/);
  assert.match(
    html,
    /js\/modules\/equipamentos\.js\?v=outros-catalogo-2&combate-v2-3/,
  );
  assert.match(html, /js\/modules\/combate\.js\?v=municoes-3&combate-v2-2/);
  assert.match(html, /js\/modules\/combate-layout-v2\.js\?v=combate-v2-13/);
});
