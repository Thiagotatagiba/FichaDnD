const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const catalogo = JSON.parse(
  fs.readFileSync(path.join(root, "assets/data/itens/escudos.json"), "utf8"),
);
const source = fs.readFileSync(
  path.join(root, "js/modules/escudos-catalogo.js"),
  "utf8",
);
const contexto = (extras = {}) => {
  const ctx = vm.createContext({ ...extras });
  vm.runInContext(source, ctx);
  return ctx;
};

test("catálogo de escudos contém o Escudo Comum com bônus, custo e peso em kg", () => {
  const ctx = contexto({ catalogo });
  assert.equal(
    vm.runInContext("validarCatalogoEscudos(catalogo).itens.length", ctx),
    1,
  );
  const item = catalogo.itens[0];
  assert.equal(item.id, "shield");
  assert.equal(item.nome, "Escudo Comum");
  assert.equal(item.ca.bonus, 2);
  assert.equal(item.pesoKg, 3);
  assert.equal(item.custo.valor, 10);
  assert.equal(item.raridade, "comum");
  assert.equal(item.icone, "../assets/icons/escudos/viking-shield.svg");
  ctx.item = item;
  assert.equal(
    vm.runInContext("camposEscudoDoCatalogo(item).escudo_raridade", ctx),
    "comum",
  );
  assert.equal(
    vm.runInContext("camposEscudoDoCatalogo(item).escudo_icone", ctx),
    "../assets/icons/escudos/viking-shield.svg",
  );
  assert.match(source, /criarIconeEscudo\(icone\)/);
  assert.match(source, /imagem\.addEventListener\("error"/);
  assert.match(source, /escudo-modal-icone-com-svg/);
  assert.ok(item.descricao.length > 30);
});

test("importação restaura identificador e ícone dos escudos catalogados", () => {
  const importSource = fs.readFileSync(
    path.join(root, "js/modules/importacao.js"),
    "utf8",
  );
  assert.match(
    importSource,
    /novoCard\.dataset\.catalogoEscudoId = catalogoEscudoId/,
  );
  assert.match(
    importSource,
    /novoCard\.dataset\.catalogoEscudoIcone = catalogoEscudoIcone/,
  );
  assert.match(importSource, /origemEscudo\?\.icone/);
  assert.match(source, /arma-cartao-nome-linha/);
  assert.match(source, /nomeLinha\.prepend\(imagem\)/);
});

test("vestimentas catalogadas preservam e restauram o ID do catálogo", () => {
  const vestimentaSource = fs.readFileSync(
    path.join(root, "js/modules/vestimentas-catalogo.js"),
    "utf8",
  );
  const equipamentosSource = fs.readFileSync(
    path.join(root, "js/modules/equipamentos.js"),
    "utf8",
  );
  const importSource = fs.readFileSync(
    path.join(root, "js/modules/importacao.js"),
    "utf8",
  );
  assert.match(vestimentaSource, /catalogoVestimentaId = item\.id/);
  assert.match(equipamentosSource, /listaVestimentas/);
  assert.match(equipamentosSource, /catalogoVestimentaId/);
  assert.match(
    importSource,
    /novoCard\.dataset\.catalogoVestimentaId = catalogoEscudoId/,
  );
});

test("resumo e editor de escudo usam apenas o card da lista de Escudos", () => {
  const nodes = () => ({
    classList: { add() {}, toggle() {}, contains() { return false; } },
    replaceChildren() {},
    setAttribute() {},
  });
  function criarCard(id, tipo, catalogoId, nome, ca) {
    const elementos = new Map();
    const obter = selector => {
      if (!elementos.has(selector)) elementos.set(selector, nodes());
      return elementos.get(selector);
    };
    const abrir = obter(".escudo-abrir");
    obter(".escudo-resumo").querySelector = () => abrir;
    abrir.querySelector = selector => selector === ".arma-cartao-nome-linha" ? null : obter(selector);
    obter('[data-campo="escudo_tipo"]').value = tipo;
    obter('[data-campo="escudo_nome"]').value = nome;
    obter('[data-campo="escudo_ca"]').value = ca;
    return {
      id,
      ...nodes(),
      dataset: { catalogoEscudoId: catalogoId },
      isConnected: true,
      matches: () => true,
      querySelector: obter,
      abrir,
    };
  }
  const modelo = criarCard("escudoModelo", "Escudo");
  const escudo = criarCard("", "Escudo", "shield", "Escudo da guarda", "+2");
  const vestimenta = criarCard("", "Vestuario", undefined, "Escudo da guarda", "+1");
  vestimenta.querySelector(".escudo-resumo").remove = () => {};
  const ctx = contexto({
    document: {
      getElementById(id) {
        if (id === "listaEscudos") return { contains: () => true };
        if (id === "listaEscudosItens") return { contains: card => card === escudo };
        if (id === "arma2Nome") return { value: "escudo-0" };
        return null;
      },
      querySelectorAll(selector) {
        if (selector.startsWith("#listaEscudosItens ")) return [escudo];
        if (selector.includes(":not(#escudoModelo)")) return [escudo, vestimenta];
        return [modelo, escudo, vestimenta];
      },
    },
    coletarEscudos: () => [
      { catalogoId: "shield", escudo_nome: "Escudo da guarda", escudo_ca: "+2" },
      { catalogoId: "fine-clothes", escudo_nome: "Escudo da guarda", escudo_ca: "+1" },
    ],
    extrairIndiceSlotEscudo: value => value === "escudo-0" ? 0 : null,
  });
  ctx.atualizarResumosEscudos();
  assert.equal(escudo.abrir.querySelector(".armadura-cartao-ca").textContent, "+2");
  assert.equal(escudo.abrir.querySelector(".armadura-cartao-estado").textContent, "Equipado");
  assert.equal(modelo.abrir.querySelector(".magia-item-nome").textContent, undefined);
  assert.equal(vestimenta.abrir.querySelector(".magia-item-nome").textContent, undefined);
  assert.equal(ctx.cardEscudoNaListaAtiva(escudo), true);
  assert.equal(ctx.cardEscudoNaListaAtiva(vestimenta), false);
});

test("busca encontra nome em português e inglês sem diferenciar acentos", () => {
  const ctx = contexto({ getTemProficienciaEscudo: () => true });
  ctx.itens = catalogo.itens;
  assert.equal(
    vm.runInContext('filtrarCatalogoEscudos(itens, "comum").length', ctx),
    1,
  );
  assert.equal(
    vm.runInContext('filtrarCatalogoEscudos(itens, "SHIELD").length', ctx),
    1,
  );
  assert.equal(
    vm.runInContext('filtrarCatalogoEscudos(itens, "inexistente").length', ctx),
    0,
  );
});

test("validação rejeita bônus, peso e unidade inválidos", () => {
  for (const alterar of [
    (item) => (item.ca.bonus = -1),
    (item) => (item.pesoKg = "3"),
    (item) => (item.custo.moeda = "pp"),
    (item) => (item.id = ""),
    (item) => (item.raridade = "épico"),
  ]) {
    const dados = structuredClone(catalogo);
    alterar(dados.itens[0]);
    const ctx = contexto({ dados });
    assert.throws(() => vm.runInContext("validarCatalogoEscudos(dados)", ctx));
  }
});
