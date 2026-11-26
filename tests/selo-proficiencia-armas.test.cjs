const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const raiz = path.resolve(__dirname, "..");
const ler = (arquivo) => fs.readFileSync(path.join(raiz, arquivo), "utf8");

function carregarRegraProficiencia({ simples = false, marciais = false, individual = false } = {}) {
  const campos = {
    profArmaSimples: { checked: simples },
    profArmaMarciais: { checked: marciais },
  };
  const contexto = {
    document: { getElementById: (id) => campos[id] || null },
    window: { __temProficienciaArmaIndividual: () => individual },
  };
  vm.runInNewContext(
    `${ler("js/modules/equipamentos.js").match(/function getTemProficienciaArma\([\s\S]*?\n\}/)[0]}\n${ler("js/modules/equipamentos.js").match(/function personagemEhProficienteComArma\([\s\S]*?\n\}/)[0]}`,
    contexto,
  );
  return contexto.personagemEhProficienteComArma;
}

test("o selo usa proficiência de categoria ou individual, nunca a flag do item", () => {
  assert.equal(carregarRegraProficiencia({ simples: true })({ arma_tipo: "Simples", proficiente: false }), true);
  assert.equal(carregarRegraProficiencia({ marciais: true })({ arma_tipo: "Marcial" }), true);
  assert.equal(carregarRegraProficiencia({ individual: true })({ arma_tipo: "Personalizada", catalogoId: "maca" }), true);
  assert.equal(carregarRegraProficiencia()({ arma_tipo: "Marcial", proficiente: true }), false);
});

test("armas proficientes mantêm o selo oficial e as demais recebem alerta acessível", () => {
  const equipamentos = ler("js/modules/equipamentos.js");
  let bonus = 2;
  class Elemento {
    constructor(tag) {
      this.tagName = tag;
      this.children = [];
      this.attributes = {};
      this.listeners = {};
      this.textContent = "";
    }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); }
    setAttribute(nome, valor) { this.attributes[nome] = String(valor); }
    getAttribute(nome) { return this.attributes[nome] ?? null; }
    addEventListener(nome, callback) { this.listeners[nome] = callback; }
    focus() { this.focused = true; }
  }
  const contexto = {
    document: { createElement: (tag) => new Elemento(tag) },
    window: {},
    personagemEhProficienteComArma: (arma) => !!arma.proficiente,
    getBonusProf: () => bonus,
  };
  const helper = equipamentos.match(/function criarIndicadorProficienciaArma\([\s\S]*?\n\}/)[0];
  vm.runInNewContext(`let sequenciaAlertasProficienciaArmas = 0;\n${helper}`, contexto);
  const criar = contexto.criarIndicadorProficienciaArma;
  const selo = criar({ proficiente: true });
  assert.equal(selo.children[0].children[0].src, "../assets/icons/interface/proficiencia/seal-proficiency-color.svg");
  assert.equal(selo.children[1].children[0].textContent, "Proficiente com esta arma");
  const indicador = criar({ proficiente: false });
  const [botao, tooltip] = indicador.children;
  assert.equal(botao.textContent, "⚠️");
  assert.equal(botao.title, undefined, "não deve haver tooltip nativo duplicado");
  assert.equal(botao.getAttribute("aria-expanded"), "false");
  assert.equal(botao.getAttribute("aria-describedby"), tooltip.id);
  assert.equal(tooltip.getAttribute("role"), "tooltip");
  assert.equal(tooltip.children[0].textContent, "Sem proficiência!");
  assert.equal(tooltip.children[1].textContent, "Você não recebe o bônus de proficiência de +2 na jogada de ataque com esta arma.");
  botao.listeners.click();
  assert.equal(botao.getAttribute("aria-expanded"), "true");
  botao.listeners.keydown({ key: "Escape" });
  assert.equal(botao.getAttribute("aria-expanded"), "false");
  assert.equal(botao.focused, true);
  bonus = 4;
  assert.match(criar({ proficiente: false }).children[1].children[1].textContent, /de \+4/);
});

test("as mãos e os ataques usam o indicador compartilhado; o seletor marca apenas armas sem proficiência", () => {
  const combate = ler("js/modules/combate.js");
  const layout = ler("js/modules/combate-layout-v2.js");
  const equipamentos = ler("js/modules/equipamentos.js");
  const css = ler("css/combate-2.0.css");
  const cssBase = ler("css/base.css");
  assert.match(combate, /criarIndicadorProficienciaArma\?\.\(armaOriginal\)/);
  assert.match(equipamentos, /personagemEhProficienteComArma\(arma = \{\}\)[\s\S]*if \(arma\.origemDesarmada\) return true/);
  assert.match(layout, /criarIndicadorProficienciaArma\?\.\(arma\)/);
  assert.match(layout, /!handSelect\.value[\s\S]*selectedNameRow\.replaceChildren\(selectedName\)/);
  assert.match(equipamentos, /const naoProficiente = !personagemEhProficienteComArma\(arma\)/);
  assert.match(equipamentos, /nomeComProf = naoProficiente \? `⚠️ \$\{nome\}`/);
  assert.match(equipamentos, /campoNivelProficienciaCombate\.addEventListener\(evento/);
  assert.match(css, /\.combate-proficiencia-indicador-wrapper[\s\S]*?width:\s*24px[\s\S]*?height:\s*24px/);
  assert.match(css, /\.combate-proficiencia-indicador \{[\s\S]*?font:\s*15px/);
  assert.match(css, /\.combate-proficiencia-indicador img[\s\S]*?width:\s*15px[\s\S]*?height:\s*15px/);
  assert.match(cssBase, /\.descanso-curto-info:hover \+ \.descanso-curto-info-texto/);
  assert.match(cssBase, /\.descanso-curto-info:focus-visible \+ \.descanso-curto-info-texto/);
  assert.match(cssBase, /\.descanso-curto-info\[aria-expanded="true"\] \+ \.descanso-curto-info-texto/);
  assert.match(css, /\.combat-v2-hand-name-row[\s\S]*?gap:\s*3px/);
  assert.match(css, /\.arma-resumo-nome \+ \.combate-proficiencia-indicador-wrapper[\s\S]*?margin-left:\s*-10\.5px/);
  assert.match(css, /\.combate-proficiencia-indicador \+ \.combate-proficiencia-indicador-tooltip/);
});

test("mudanças de proficiência sincronizam mãos e ataques sem incluir escudos", () => {
  const equipamentos = ler("js/modules/equipamentos.js");
  const layout = ler("js/modules/combate-layout-v2.js");
  assert.match(equipamentos, /sincronizarEquipamentosCombate\(\);\s*atualizarSubAbaArmas\(\);/);
  assert.match(layout, /const arma = armas\[Number\.parseInt\(handSelect\.value, 10\)\]/);
  assert.match(layout, /criarIndicadorProficienciaArma\?\.\(arma\)/);
  assert.match(layout, /!handSelect\.value/);
});
