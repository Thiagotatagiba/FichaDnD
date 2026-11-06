const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const catalogo = JSON.parse(fs.readFileSync(path.join(root, "assets/data/itens/armas.json"), "utf8"));
const source = fs.readFileSync(path.join(root, "js/modules/armas-catalogo.js"), "utf8");
function contexto(extras = {}) {
  const ctx = vm.createContext({ ...extras });
  vm.runInContext(source, ctx);
  return ctx;
}

test("catálogo contém as 37 armas comuns oficiais com categorias e modos esperados", () => {
  const ctx = contexto();
  ctx.catalogo = catalogo;
  assert.equal(vm.runInContext("validarCatalogoArmas(catalogo).itens.length", ctx), 37);
  assert.ok(catalogo.itens.every(item => item.raridade === "comum" && item.pesoKg >= 0));
  assert.deepEqual(catalogo.itens.reduce((contagem, item) => {
    const chave = `${item.categoriaProficiencia}/${item.modo}`;
    contagem[chave] = (contagem[chave] || 0) + 1;
    return contagem;
  }, {}), {
    "simples/corpo-a-corpo": 10,
    "simples/distancia": 4,
    "marcial/corpo-a-corpo": 18,
    "marcial/distancia": 5,
  });
});

test("a Besta Leve tem dano perfurante e as armas de distância declaram munição", () => {
  const besta = catalogo.itens.find(item => item.id === "besta-leve");
  assert.equal(besta.dano.tipo, "perfurante");
  assert.equal(besta.dano.base, "1d8");
  assert.equal(besta.municao, "virotes");
  assert.ok(besta.propriedades.includes("municao"));
  assert.equal(catalogo.itens.filter(item => item.municao).length, 7);
  assert.ok(catalogo.itens.every(item => item.propriedades.includes("municao") === Boolean(item.municao)));
});

test("ficha de referência Waldo corrige o tipo da Besta Leve e preserva o vínculo com Virotes", () => {
  const ficha = JSON.parse(fs.readFileSync(path.join(root, "ficha/Personagens Ficha/Waldo_Malaphael_Tatagiba_20261105.json"), "utf8"));
  const besta = ficha.armas.find(item => item.nome === "Besta Leve");
  const virotes = ficha.outros.find(item => item.id === besta.arma_municao_id);
  assert.equal(besta.arma_tipo_dano, "Perfurante");
  assert.equal(virotes?.outro_nome, "Virotes");
  assert.equal(virotes?.outro_tipo, "Municao");
});

test("dados do catálogo mapeiam para os campos legados e preservam Versátil", () => {
  const ctx = contexto();
  ctx.item = catalogo.itens.find(item => item.id === "espada-longa");
  const campos = vm.runInContext("camposArmaDoCatalogo(item)", ctx);
  assert.equal(campos.nome, "Espada Longa");
  assert.equal(campos.arma_tipo, "Marcial");
  assert.equal(campos.arma_dano, "1d8");
  assert.equal(campos.arma_tipo_dano, "Cortante");
  assert.equal(campos.arma_moeda, "po");
  assert.equal(campos.arma_peso, "1.5");
  assert.equal(campos.arma_municao_id, "");
  assert.equal(catalogo.itens.find(item => item.id === "espada-longa").dano.versatil, "1d10");
});

test("busca ignora acentos e filtros respeitam categoria, modo e proficiência", () => {
  const ctx = contexto({ getTemProficienciaArma: tipo => tipo === "Simples" });
  ctx.itens = catalogo.itens;
  assert.equal(vm.runInContext('filtrarCatalogoArmas(itens, "besta leve")[0].id', ctx), "besta-leve");
  assert.equal(vm.runInContext('filtrarCatalogoArmas(itens, "longbow")[0].nome', ctx), "Arco Longo");
  assert.equal(vm.runInContext('filtrarCatalogoArmas(itens, "", "marcial", "distancia").length', ctx), 5);
  assert.equal(vm.runInContext('filtrarCatalogoArmas(itens, "", "todas", "todos", true).length', ctx), 14);
});

test("validador rejeita IDs duplicados, campos inconsistentes e propriedade sem munição", () => {
  for (const alterar of [
    c => c.itens[1].id = c.itens[0].id,
    c => c.unidadePeso = "lb",
    c => c.itens[0].pesoKg = "1",
    c => c.itens[0].raridade = "épico",
    c => c.itens.find(item => item.id === "besta-leve").municao = null,
    c => c.itens[0].custo.valor = -1,
  ]) {
    const ctx = contexto();
    ctx.catalogo = structuredClone(catalogo);
    alterar(ctx.catalogo);
    assert.throws(() => vm.runInContext("validarCatalogoArmas(catalogo)", ctx));
  }
});
