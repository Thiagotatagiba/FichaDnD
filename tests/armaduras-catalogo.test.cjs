const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const root = path.resolve(__dirname, "..");
const catalogo = JSON.parse(fs.readFileSync(path.join(root, "assets/data/itens/armaduras.json"), "utf8"));
const source = fs.readFileSync(path.join(root, "js/modules/armaduras-catalogo.js"), "utf8");
const equipamentos = fs.readFileSync(path.join(root, "js/modules/equipamentos.js"), "utf8");
const contexto = (extras = {}) => {
  const ctx = vm.createContext({ ...extras });
  vm.runInContext(source, ctx);
  // Usa o cálculo real compartilhado com equipamento e combate.
  vm.runInContext(equipamentos.slice(equipamentos.indexOf("function calcularCATotal("),
    equipamentos.indexOf("function formatarArmaduraEquipamento(")), ctx);
  return ctx;
};
test("catálogo básico: 12 armaduras, preços, Força, furtividade e kg", () => {
  const ctx = contexto();
  ctx.catalogo = catalogo;
  assert.equal(vm.runInContext("validarCatalogoArmaduras(catalogo).itens.length", ctx), 12);
  assert.ok(catalogo.itens.every(item => typeof item.descricao === "string" && item.descricao.trim().length > 30));
  assert.ok(catalogo.itens.every(item => item.raridade === "comum"));
  assert.equal(new Set(catalogo.itens.map(item => item.descricao)).size, 12);
  assert.deepEqual(catalogo.itens.map(i => i.pesoKg), [4,5,6.5,6,10,22.5,10,20,20,27.5,30,32.5]);
  assert.deepEqual(catalogo.itens.map(i => i.custo.valor), [5,10,45,10,50,50,400,750,30,75,200,1500]);
  assert.deepEqual(catalogo.itens.map(i => i.forcaMinima), [null,null,null,null,null,null,null,null,null,13,15,15]);
  assert.deepEqual(catalogo.itens.filter(i => i.desvantagemFurtividade).map(i => i.id),
    ["armadura-acolchoada","armadura-brunea","armadura-meia-armadura","armadura-cota-de-aneis","armadura-cota-de-malha","armadura-cota-de-talas","armadura-placas"]);
});
test("validação rejeita IDs duplicados, unidades, números e regras incoerentes", () => {
  for (const alterar of [
    c => c.itens[1].id = c.itens[0].id,
    c => c.unidadePeso = "lb",
    c => c.itens[0].pesoKg = "4",
    c => c.itens[0].ca.adicionaDestreza = false,
    c => c.itens[3].ca.limiteBonusDestreza = 3,
    c => c.itens[0].forcaMinima = -1,
    c => c.itens[0].custo.valor = -5,
    c => c.itens[0].descricao = "",
    c => c.itens[0].raridade = "épico",
  ]) {
    const ctx = contexto();
    ctx.catalogo = structuredClone(catalogo);
    alterar(ctx.catalogo);
    assert.throws(() => vm.runInContext("validarCatalogoArmaduras(catalogo)", ctx));
  }
});
test("adaptador usa valores reais dos selects; CA preserva DES negativo e teto positivo", () => {
  const ctx = contexto();
  for (const [id, esperado] of [
    ["armadura-couro-batido", [11,12,16]],
    ["armadura-peitoral", [13,14,16]],
    ["armadura-placas", [18,18,18]],
  ]) {
    ctx.item = catalogo.itens.find(i => i.id === id);
    const campos = vm.runInContext("camposArmaduraDoCatalogo(item)", ctx);
    assert.equal(campos.armadura_raridade, "comum");
    assert.ok(["Leve","Media","Pesada"].includes(campos.armadura_tipo));
    assert.deepEqual([-1,0,4].map(mod => {
      ctx.mod = mod;
      return vm.runInContext("calcularCATotal(camposArmaduraDoCatalogo(item).armadura_ca, camposArmaduraDoCatalogo(item).armadura_bonus, mod)", ctx);
    }), esperado);
  }
});
test("busca em dois idiomas sem acentos e filtro de proficiência", () => {
  const ctx = contexto({ getTemProficienciaArmadura: tipo => tipo === "Media" });
  ctx.itens = catalogo.itens;
  assert.equal(vm.runInContext('filtrarCatalogoArmaduras(itens, "gibao", "todas", false)[0].nome', ctx), "Gibão de peles");
  assert.equal(vm.runInContext('filtrarCatalogoArmaduras(itens, "studded", "leve", false)[0].pesoKg', ctx), 6.5);
  assert.equal(vm.runInContext('filtrarCatalogoArmaduras(itens, "", "todas", true).length', ctx), 5);
  assert.equal(vm.runInContext('filtrarCatalogoArmaduras(itens, "plate", "leve", false).length', ctx), 0);
});
test("carregamento compartilha requisição, guarda cache e permite repetir após falha", async () => {
  let chamadas = 0;
  const ctx = contexto({ fetch: async () => {
    chamadas++;
    if (chamadas === 1) throw new Error("offline");
    return { ok: true, json: async () => structuredClone(catalogo) };
  }});
  await assert.rejects(vm.runInContext("carregarCatalogoArmaduras()", ctx), /offline/);
  await Promise.all([vm.runInContext("carregarCatalogoArmaduras()", ctx), vm.runInContext("carregarCatalogoArmaduras()", ctx)]);
  await vm.runInContext("carregarCatalogoArmaduras()", ctx);
  assert.equal(chamadas, 2);
});

