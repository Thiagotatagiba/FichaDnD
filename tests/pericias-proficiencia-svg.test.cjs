const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

class Element {
  constructor(tagName) {
    this.tagName = tagName;
    this.attributes = {};
    this.children = [];
    this.textContent = "";
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  querySelector(selector) {
    return selector === "img" ? this.children[0] || null : null;
  }
  replaceChildren(...children) {
    this.children = children;
  }
}

test("indicador das perícias usa o SVG correspondente aos quatro estados", () => {
  const source = read("js/modules/magias.js");
  const functionSource = source.match(
    /function atualizarIndicadorEstadoProficiencia\(periciaLinha\) \{[\s\S]*?\n\}/,
  )?.[0];
  assert.ok(functionSource, "função de atualização do indicador encontrada");

  const indicator = new Element("span");
  const label = { attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } };
  const name = { textContent: "Furtividade" };
  const row = {
    dataset: { proficiencia: "0" },
    querySelector(selector) {
      if (selector === ".pericia-prof-indicador") return indicator;
      if (selector === ".pericia-prof") return label;
      if (selector === ".pericia-nome") return name;
      return null;
    },
  };
  const context = {
    document: { createElement: (tag) => new Element(tag) },
  };
  vm.runInNewContext(functionSource, context);

  const states = [
    [0, "proficiency-none.svg", "Sem proficiência em Furtividade"],
    [1, "proficiency-proficient.svg", "Proficiente em Furtividade"],
    [2, "proficiency-half.svg", "Meia proficiência em Furtividade"],
    [3, "proficiency-expertise.svg", "Excelência em Furtividade"],
  ];
  let image;
  for (const [state, file, accessibleName] of states) {
    row.dataset.proficiencia = String(state);
    context.atualizarIndicadorEstadoProficiencia(row);
    image = indicator.children[0];
    assert.equal(image.tagName, "img");
    assert.equal(
      image.src,
      `../assets/icons/interface/proficiencia/${file}`,
    );
    assert.equal(image.alt, "");
    assert.equal(image.attributes["aria-hidden"], "true");
    assert.equal(label.attributes["aria-label"], accessibleName);
    assert.equal(indicator.children.length, 1);
    assert.ok(fs.existsSync(path.join(root, "assets/icons/interface/proficiencia", file)));
  }
  assert.equal(indicator.children[0], image, "reutiliza o mesmo elemento de imagem ao alternar");
});

test("o indicador continua clicável e mantém alvo visual de 28 px", () => {
  const css = read("css/base.css");
  const habilidades = read("js/modules/habilidades.js");
  assert.match(css, /\.pericia-prof-indicador[\s\S]*?width:\s*28px[\s\S]*?height:\s*28px/);
  assert.match(css, /\.pericia-prof-indicador img[\s\S]*?width:\s*24px[\s\S]*?height:\s*24px/);
  assert.match(habilidades, /label\.addEventListener\("click"/);
  assert.match(habilidades, /label\.addEventListener\("keydown"/);
});
