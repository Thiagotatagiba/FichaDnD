const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const catalogo = JSON.parse(fs.readFileSync(path.join(root, "assets/data/itens/escudos.json"), "utf8"));
const source = fs.readFileSync(path.join(root, "js/modules/escudos-catalogo.js"), "utf8");
const contexto = (extras = {}) => {
  const ctx = vm.createContext({ ...extras });
  vm.runInContext(source, ctx);
  return ctx;
};

test("catálogo de escudos contém o Escudo Comum com bônus, custo e peso em kg", () => {
  const ctx = contexto({ catalogo });
  assert.equal(vm.runInContext("validarCatalogoEscudos(catalogo).itens.length", ctx), 1);
  const item = catalogo.itens[0];
  assert.equal(item.id, "escudo-comum");
  assert.equal(item.nome, "Escudo Comum");
  assert.equal(item.ca.bonus, 2);
  assert.equal(item.pesoKg, 3);
  assert.equal(item.custo.valor, 10);
  assert.equal(item.raridade, "comum");
  ctx.item = item;
  assert.equal(vm.runInContext("camposEscudoDoCatalogo(item).escudo_raridade", ctx), "comum");
  assert.ok(item.descricao.length > 30);
});

test("busca encontra nome em português e inglês sem diferenciar acentos", () => {
  const ctx = contexto({ getTemProficienciaEscudo: () => true });
  ctx.itens = catalogo.itens;
  assert.equal(vm.runInContext('filtrarCatalogoEscudos(itens, "comum").length', ctx), 1);
  assert.equal(vm.runInContext('filtrarCatalogoEscudos(itens, "SHIELD").length', ctx), 1);
  assert.equal(vm.runInContext('filtrarCatalogoEscudos(itens, "inexistente").length', ctx), 0);
});

test("validação rejeita bônus, peso e unidade inválidos", () => {
  for (const alterar of [
    item => item.ca.bonus = -1,
    item => item.pesoKg = "3",
    item => item.custo.moeda = "pp",
    item => item.id = "",
    item => item.raridade = "épico",
  ]) {
    const dados = structuredClone(catalogo);
    alterar(dados.itens[0]);
    const ctx = contexto({ dados });
    assert.throws(() => vm.runInContext("validarCatalogoEscudos(dados)", ctx));
  }
});
