const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const catalogo = JSON.parse(fs.readFileSync(path.join(root, "assets/data/itens/municoes.json"), "utf8"));
const source = fs.readFileSync(path.join(root, "js/modules/municoes-catalogo.js"), "utf8");
const contexto = () => {
  const ctx = vm.createContext({ document: { addEventListener() {} } });
  vm.runInContext(source, ctx);
  ctx.dados = structuredClone(catalogo);
  vm.runInContext("validarCatalogoMunicoes(dados); estadoCatalogoMunicoes.itens = dados.itens", ctx);
  return ctx;
};

test("munições têm nome de card, unidade e capacidade do pacote", () => {
  const ctx = contexto();
  const apresentacoes = vm.runInContext("estadoCatalogoMunicoes.itens.map(item => obterApresentacaoPacoteMunicao({ municao_nome:item.nome, municao_catalogo_id:item.id, municao_quantidade_pacote:item.quantidadePacote }))", ctx);
  assert.deepEqual(apresentacoes.map(p => p.nomePacote), ["Aljava de Flechas", "Pacote de Agulhas de Zarabatana", "Estojo de Virotes", "Pacote de Balas de Funda"]);
  assert.deepEqual(apresentacoes.map(p => p.etiquetaPacote), ["Pacote de 20 Flechas", "Pacote de 50 Agulhas", "Pacote de 20 Virotes", "Pacote de 20 Balas de funda"]);
  assert.equal(apresentacoes[2].nomeUnidade, "Virotes");
});

test("validador exige metadados de apresentação e rejeita capacidade inválida", () => {
  for (const alterar of [
    item => { delete item.nomeCard; },
    item => { item.nomeUnidade = ""; },
    item => { item.quantidadePacote = 0; },
  ]) {
    const ctx = vm.createContext({});
    vm.runInContext(source.slice(0, source.indexOf("async function carregarCatalogoMunicoes")), ctx);
    ctx.dados = structuredClone(catalogo);
    alterar(ctx.dados.itens[0]);
    assert.throws(() => vm.runInContext("validarCatalogoMunicoes(dados)", ctx));
  }
});
