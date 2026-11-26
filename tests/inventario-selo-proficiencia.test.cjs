const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("selo do inventário é acessível por teclado, toque e leitor de tela", () => {
  class Element {
    constructor(tag) {
      this.tagName = tag;
      this.children = [];
      this.attributes = {};
      this.listeners = {};
    }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] ?? null; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    focus() { this.focused = true; }
  }
  const equipamentos = read("js/modules/equipamentos.js");
  const helper = equipamentos.match(
    /function criarSeloProficienciaInventario\([\s\S]*?\n\}/,
  )[0];
  const context = {
    document: { createElement: (tag) => new Element(tag) },
  };
  vm.runInNewContext(
    `let sequenciaSelosInventario = 0;\n${helper}`,
    context,
  );

  const wrapper = context.criarSeloProficienciaInventario();
  const [trigger, tooltip] = wrapper.children;
  assert.equal(wrapper.hidden, true);
  assert.equal(trigger.getAttribute("role"), "button");
  assert.equal(trigger.getAttribute("aria-label"), "Proficiente com este item.");
  assert.equal(trigger.getAttribute("title"), "");
  assert.equal(trigger.getAttribute("aria-describedby"), tooltip.id);
  assert.equal(trigger.children[0].src, "../assets/icons/interface/proficiencia/seal-proficiency-color.svg");
  assert.equal(tooltip.textContent, "Proficiente com este item.");
  assert.equal(tooltip.getAttribute("role"), "tooltip");

  let defaultPrevented = false;
  let propagationStopped = false;
  trigger.listeners.click({
    preventDefault() { defaultPrevented = true; },
    stopPropagation() { propagationStopped = true; },
  });
  assert.equal(defaultPrevented, true);
  assert.equal(propagationStopped, true);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  trigger.listeners.keydown({ key: "Enter", preventDefault() {}, stopPropagation() {} });
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  trigger.listeners.keydown({ key: " ", preventDefault() {}, stopPropagation() {} });
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  trigger.listeners.keydown({ key: "Escape", preventDefault() {}, stopPropagation() {} });
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  assert.equal(trigger.focused, true);
});

test("armas, armaduras e escudos usam seus estados atuais e preservam avisos", () => {
  const armas = read("js/modules/armas-catalogo.js");
  const armaduras = read("js/modules/armaduras-catalogo.js");
  const escudos = read("js/modules/escudos-catalogo.js");
  assert.match(armas, /seloProficiencia\.hidden = item\.proficiente !== true/);
  assert.match(armas, /aviso\.textContent = prof \? "" : "⚠️ Sem proficiência"/);
  assert.match(armaduras, /seloProficiencia\.hidden = item\.proficiente !== true/);
  assert.match(armaduras, /proficiencia\.textContent = proficiente \? "" : "⚠️ Sem proficiência"/);
  assert.match(escudos, /seloProficiencia\.hidden = !indicadorProficiencia \|\| !proficiente/);
  assert.match(escudos, /aviso\.textContent = proficiente \? "" : "⚠️ Sem proficiência"/);
  for (const source of [armas, armaduras, escudos])
    assert.match(source, /criarSeloProficienciaInventario\(\)/);
});

test("kits e ferramentas exibem selo somente quando a proficiência cadastrada está ativa", () => {
  const outros = read("js/modules/outros-catalogo.js");
  assert.match(outros, /proficiencia\.hidden = !outroProficienciaAtiva\(item\)/);
  assert.match(outros, /function outroProficienciaAtiva\(item\)/);
  assert.doesNotMatch(outros, /outro-cartao-proficiencia" hidden>Proficiente/);
  assert.match(outros, /selo\.classList\.add\("outro-cartao-proficiencia"\)/);
  assert.match(outros, /outro-cartao-nome-linha[\s\S]*outro-cartao-nome[\s\S]*outro-cartao-proficiencia/);
});

test("CSS mantém SVG em 15 px, alvo de 24 px e nomes responsivos", () => {
  const css = read("css/card-itens.css");
  const base = read("css/base.css");
  assert.match(css, /\.inventario-proficiencia-selo[\s\S]*?width:\s*24px[\s\S]*?height:\s*24px/);
  assert.match(css, /\.inventario-proficiencia-selo-trigger img[\s\S]*?width:\s*15px[\s\S]*?height:\s*15px/);
  assert.match(css, /\.armadura-cartao-nome-linha \.magia-item-nome[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.match(css, /\.outro-cartao-nome-linha[\s\S]*?gap:\s*3px/);
  assert.match(base, /\.descanso-curto-info:hover \+ \.descanso-curto-info-texto/);
  assert.match(base, /\.descanso-curto-info:focus-visible \+ \.descanso-curto-info-texto/);
  assert.match(base, /\.descanso-curto-info\[aria-expanded="true"\] \+ \.descanso-curto-info-texto/);
});
