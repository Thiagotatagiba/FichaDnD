const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const catalogo = JSON.parse(
  fs.readFileSync(path.join(root, "assets/data/itens/armas.json"), "utf8"),
);
const source = fs.readFileSync(
  path.join(root, "js/modules/armas-catalogo.js"),
  "utf8",
);
const importSource = fs.readFileSync(
  path.join(root, "js/modules/importacao.js"),
  "utf8",
);
function contexto(extras = {}) {
  const ctx = vm.createContext({ ...extras });
  vm.runInContext(source, ctx);
  return ctx;
}

test("catálogo contém as 37 armas comuns oficiais com categorias e modos esperados", () => {
  const ctx = contexto();
  ctx.catalogo = catalogo;
  assert.equal(
    vm.runInContext("validarCatalogoArmas(catalogo).itens.length", ctx),
    37,
  );
  assert.ok(
    catalogo.itens.every(
      (item) => item.raridade === "comum" && item.pesoKg >= 0,
    ),
  );
  assert.deepEqual(
    catalogo.itens.reduce((contagem, item) => {
      const chave = `${item.categoriaProficiencia}/${item.modo}`;
      contagem[chave] = (contagem[chave] || 0) + 1;
      return contagem;
    }, {}),
    {
      "simples/corpo-a-corpo": 10,
      "simples/distancia": 4,
      "marcial/corpo-a-corpo": 18,
      "marcial/distancia": 5,
    },
  );
});

test("catálogo associa os SVGs sugeridos às 37 armas", () => {
  const comIcone = catalogo.itens.filter((item) => item.icone);
  assert.equal(comIcone.length, 37);
  assert.equal(
    catalogo.itens.find((item) => item.id === "dagger").icone,
    "../assets/icons/armas/broad-dagger.svg",
  );
  assert.equal(
    catalogo.itens.find((item) => item.id === "longsword").icone,
    "../assets/icons/armas/two-handed-sword.svg",
  );
  assert.equal(
    catalogo.itens.find((item) => item.id === "pike").icone,
    "../assets/icons/armas/pike.svg",
  );
  assert.equal(
    catalogo.itens.find((item) => item.id === "blowgun").icone,
    "../assets/icons/armas/blowgun.svg",
  );
  assert.match(source, /arma-cartao-nome-linha/);
  assert.match(
    source,
    /nomeLinha\?\.querySelector\("\.arma-cartao-icone"\)\?\.remove/,
  );
  assert.match(source, /nomeLinha\.prepend\(imagem\)/);
  for (const item of comIcone) {
    const relativo = item.icone.replace(/^\.\.\//, "");
    assert.ok(
      fs.existsSync(path.join(root, relativo)),
      `${item.nome} deve apontar para um SVG existente`,
    );
  }
});

test("importação restaura os dados visuais das armas catalogadas", () => {
  assert.match(
    importSource,
    /novoCard\.dataset\.catalogoArmaId = catalogoArmaId/,
  );
  assert.match(
    importSource,
    /novoCard\.dataset\.catalogoArmaIcone = catalogoArmaIcone/,
  );
  assert.match(importSource, /origemArma\?\.icone/);
});

test("a Besta Leve tem dano perfurante e as armas de distância declaram munição", () => {
  const besta = catalogo.itens.find((item) => item.id === "light-crossbow");
  assert.equal(besta.dano.tipo, "perfurante");
  assert.equal(besta.dano.base, "1d8");
  assert.equal(besta.municao, "virotes");
  assert.ok(besta.propriedades.includes("municao"));
  assert.equal(catalogo.itens.filter((item) => item.municao).length, 7);
  assert.ok(
    catalogo.itens.every(
      (item) => item.propriedades.includes("municao") === Boolean(item.municao),
    ),
  );
});

test("ficha de referência Waldo corrige o tipo da Besta Leve e preserva o vínculo com Virotes", () => {
  const ficha = JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        "ficha/Personagens Ficha/Waldo_Malaphael_Tatagiba_20261105.json",
      ),
      "utf8",
    ),
  );
  const besta = ficha.armas.find((item) => item.nome === "Besta Leve");
  const virotes = ficha.municoes.find(
    (item) => item.id === besta.arma_municao_id,
  );
  assert.equal(besta.arma_tipo_dano, "Perfurante");
  assert.equal(virotes?.municao_nome, "Virotes");
  assert.equal(virotes?.municao_catalogo_id, "virotes");
});

test("dados do catálogo mapeiam para os campos legados e preservam Versátil", () => {
  const ctx = contexto();
  ctx.item = catalogo.itens.find((item) => item.id === "longsword");
  const campos = vm.runInContext("camposArmaDoCatalogo(item)", ctx);
  assert.equal(campos.nome, "Espada Longa");
  assert.equal(campos.arma_tipo, "Marcial");
  assert.equal(campos.arma_dano, "1d8");
  assert.equal(campos.arma_tipo_dano, "Cortante");
  assert.equal(campos.arma_moeda, "po");
  assert.equal(campos.arma_peso, "1.5");
  assert.equal(campos.arma_municao_id, "");
  assert.equal(campos.arma_alcance_m, "");
  assert.equal(
    catalogo.itens.find((item) => item.id === "longsword").dano.versatil,
    "1d10",
  );
});

test("armas com propriedade Alcance mantêm distância corpo a corpo separada do alcance à distância", () => {
  const ids = ["glaive", "halberd", "lance", "pike", "whip"];
  for (const id of ids) {
    const item = catalogo.itens.find((arma) => arma.id === id);
    assert.ok(item.propriedades.includes("alcance"));
    assert.equal(item.alcancePropriedadeM, 3);
    assert.equal(item.alcance, null);
    const ctx = contexto();
    ctx.item = item;
    assert.equal(
      vm.runInContext("camposArmaDoCatalogo(item).arma_alcance_m", ctx),
      "3",
    );
  }
});

test("busca ignora acentos e filtros respeitam categoria, modo e proficiência", () => {
  const ctx = contexto({
    getTemProficienciaArma: (tipo) => tipo === "Simples",
  });
  ctx.itens = catalogo.itens;
  assert.equal(
    vm.runInContext('filtrarCatalogoArmas(itens, "besta leve")[0].id', ctx),
    "light-crossbow",
  );
  assert.equal(
    vm.runInContext('filtrarCatalogoArmas(itens, "longbow")[0].nome', ctx),
    "Arco Longo",
  );
  assert.equal(
    vm.runInContext(
      'filtrarCatalogoArmas(itens, "", "marcial", "distancia").length',
      ctx,
    ),
    5,
  );
  assert.equal(
    vm.runInContext(
      'filtrarCatalogoArmas(itens, "", "todas", "todos", true).length',
      ctx,
    ),
    14,
  );
});

test("validador rejeita IDs duplicados, campos inconsistentes e propriedade sem munição", () => {
  for (const alterar of [
    (c) => (c.itens[1].id = c.itens[0].id),
    (c) => (c.unidadePeso = "lb"),
    (c) => (c.itens[0].pesoKg = "1"),
    (c) => (c.itens[0].raridade = "épico"),
    (c) =>
      (c.itens.find((item) => item.id === "light-crossbow").municao = null),
    (c) => (c.itens[0].custo.valor = -1),
  ]) {
    const ctx = contexto();
    ctx.catalogo = structuredClone(catalogo);
    alterar(ctx.catalogo);
    assert.throws(() => vm.runInContext("validarCatalogoArmas(catalogo)", ctx));
  }
});
