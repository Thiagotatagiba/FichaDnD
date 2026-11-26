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

test("ícones de projétil e recipiente são opcionais na apresentação e resolvidos por IDs atuais e legados", () => {
  const ctx = contexto();
  const recipientes = {
    arrows: "arrows-quiver",
    "crossbow-bolts": "crossbow-bolts-case",
    "sling-bullets": "sling-bullets-pack",
  };
  const caminho = nome => `../assets/icons/municoes/${nome}.svg`;

  for (const { id, idLegado } of catalogo.itens) {
    for (const catalogoId of [id, idLegado]) {
      ctx.catalogoId = catalogoId;
      const { icone, iconeRecipiente } = vm.runInContext(
        "obterApresentacaoPacoteMunicao({ municao_catalogo_id: catalogoId })",
        ctx,
      );
      assert.equal(icone, caminho(id));
      assert.equal(iconeRecipiente, recipientes[id] ? caminho(recipientes[id]) : undefined);
      for (const svg of [icone, iconeRecipiente].filter(Boolean)) {
        assert.ok(fs.existsSync(path.resolve(root, "ficha", svg)), svg);
      }
    }
  }

  const personalizada = vm.runInContext("obterApresentacaoPacoteMunicao({ municao_nome: 'Personalizada' })", ctx);
  assert.equal(personalizada.icone, undefined);
  assert.equal(personalizada.iconeRecipiente, undefined);
});

test("adicionar munição atualiza o seletor visível da Funda e preserva o ID da pilha selecionada", () => {
  const ctx = contexto();
  const criarOpcao = () => ({
    cloneNode() {
      return { value: this.value, textContent: this.textContent };
    },
  });
  const campo = {
    options: [],
    get value() {
      return this.options.find(option => option.selected)?.value || "";
    },
    set innerHTML(_) {
      this.options = [Object.assign(criarOpcao(), { value: "", selected: true })];
    },
    appendChild(option) {
      this.options.push(option);
    },
  };
  const seletorVisivel = {
    options: [],
    replaceChildren(...options) {
      this.options = options;
    },
  };
  const funda = {
    dataset: { catalogoArmaId: "sling" },
    querySelector(selector) {
      if (selector === '[data-campo="arma_municao_id"]') return campo;
      if (selector === ".arma-cartao-municao-select") return seletorVisivel;
      return null;
    },
  };
  const pilhas = [];
  ctx.document.querySelectorAll = selector => {
    if (selector.startsWith("#listaArmas")) return [funda];
    if (selector.startsWith("#listaMunicoes")) return pilhas;
    return [];
  };
  ctx.document.createElement = criarOpcao;
  ctx.estadoCatalogoArmas = {
    dados: JSON.parse(fs.readFileSync(path.join(root, "assets/data/itens/armas.json"), "utf8")),
  };
  const equipamentos = fs.readFileSync(path.join(root, "js/modules/equipamentos.js"), "utf8");
  vm.runInContext(equipamentos.slice(0, equipamentos.indexOf("function consumirMunicao(")), ctx);

  ctx.criarCardMunicao = dados => {
    const campos = Object.entries(dados).map(([chave, value]) => ({ dataset: { campo: chave }, value }));
    const card = {
      dataset: { id: dados.id },
      querySelector: selector => campos.find(c => selector === `[data-campo="${c.dataset.campo}"]`),
      querySelectorAll: () => campos,
    };
    pilhas.push(card);
    return card;
  };
  ctx.balas = { id: "pilha-1", municao_catalogo_id: "sling-bullets", municao_nome: "Projéteis", municao_quantidade: "20" };
  ctx.adicionarMunicao({ ...ctx.balas, id: "pilha-virotes", municao_catalogo_id: "crossbow-bolts" });
  ctx.adicionarMunicao(ctx.balas);
  assert.deepEqual(campo.options.map(option => option.value), ["", "pilha-1"]);
  assert.deepEqual(seletorVisivel.options.map(option => option.value), ["", "pilha-1"]);
  assert.equal(seletorVisivel.value, "");

  campo.options[0].selected = false;
  campo.options[1].selected = true;
  funda.dataset.catalogoArmaId = "funda";
  ctx.adicionarMunicao({ ...ctx.balas, id: "pilha-2", municao_catalogo_id: "balas-de-funda" });
  assert.deepEqual(seletorVisivel.options.map(option => option.value), ["", "pilha-1", "pilha-2"]);
  assert.equal(seletorVisivel.value, "pilha-1");
});
