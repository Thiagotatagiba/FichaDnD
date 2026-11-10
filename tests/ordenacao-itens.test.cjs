const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const fonte = fs.readFileSync(path.join(root, "js/modules/ordenacao-itens.js"), "utf8");
const ficha = fs.readFileSync(path.join(root, "ficha/Ficha_DnD_-_Tatagiba_1.0.html"), "utf8");
const equipamentos = fs.readFileSync(path.join(root, "js/modules/equipamentos.js"), "utf8");
const municoes = fs.readFileSync(path.join(root, "js/modules/municoes-catalogo.js"), "utf8");

test("ordenação por arraste cobre cada lista e restringe o movimento à categoria", () => {
  for (const seletor of ["#listaArmas", "#listaMunicoes", "#listaArmaduras", "#listaEscudosItens", "#listaVestimentas", "#listaOutros"]) {
    assert.ok(fonte.includes(`seletor: "${seletor}"`), `lista sem suporte: ${seletor}`);
  }
  assert.match(fonte, /listaAtiva !== lista/);
  assert.match(fonte, /alvo\.parentElement === lista/);
});

test("reordenar preserva equipamento selecionado e a ordem é coletada do DOM", () => {
  assert.match(fonte, /snapshot\.armasMarcadas\.has\(item\)/);
  assert.match(fonte, /snapshot\.escudosMarcados\.has\(item\)/);
  assert.match(fonte, /armaduraEquipadaIndice = novoIndice/);
  assert.match(equipamentos, /querySelectorAll\([\s\S]*?\.item-card\[data-tipo="arma"\]/);
  assert.match(equipamentos, /querySelectorAll\([\s\S]*?#listaOutros \.item-card\[data-tipo="outro"\]/);
  assert.match(municoes, /querySelectorAll\("#listaMunicoes \.item-card\[data-tipo='municao'\]"\)/);
  assert.match(ficha, /modules\/ordenacao-itens\.js/);
});
