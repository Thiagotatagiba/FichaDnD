const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const eventsSource = fs.readFileSync(path.join(root, "js/core/events.js"), "utf8");

function criarAba(id) {
  const classes = new Set();
  return {
    id,
    classList: {
      add: (value) => classes.add(value),
      remove: (value) => classes.delete(value),
      contains: (value) => classes.has(value),
    },
  };
}

function criarBotao(id) {
  const classes = new Set(["tab"]);
  return {
    id,
    classList: {
      add: (value) => classes.add(value),
      remove: (value) => classes.delete(value),
      contains: (value) => classes.has(value),
    },
    getAttribute: (nome) => nome === "onclick" ? `trocarAba('${id}', this)` : null,
  };
}

function criarHarness(hash = "") {
  const abas = ["status", "combate", "magia", "historia", "itens"].map(criarAba);
  const botoes = ["status", "combate", "magia", "historia", "itens"].map(criarBotao);
  const listeners = new Map();
  const location = { pathname: "/ficha.html", search: "", hash };
  const history = {
    state: null,
    pushState(_state, _title, url) { location.hash = url.slice(url.indexOf("#")); },
    replaceState(_state, _title, url) { location.hash = url.slice(url.indexOf("#")); },
  };
  const document = {
    readyState: "complete",
    querySelectorAll(selector) { return selector === ".aba" ? abas : botoes; },
    getElementById(id) { return abas.find((aba) => aba.id === id); },
    addEventListener() {},
  };
  const window = {
    location,
    history,
    addEventListener(tipo, callback) { listeners.set(tipo, callback); },
  };
  const context = vm.createContext({ document, window });
  vm.runInContext(eventsSource, context);
  return { abas, botoes, listeners, location, context };
}

test("a aba indicada pelo hash é ativada e a seleção atualiza o link", () => {
  const h = criarHarness("#combate");
  assert.equal(h.abas.find((aba) => aba.id === "combate").classList.contains("ativa"), true);
  assert.equal(h.botoes.find((botao) => botao.id === "combate").classList.contains("active"), true);

  vm.runInContext("trocarAba('historia', null)", h.context);
  assert.equal(h.location.hash, "#historia");
  assert.equal(h.abas.find((aba) => aba.id === "historia").classList.contains("ativa"), true);
});

test("hash inválido volta para Status e navegação do histórico troca a aba", () => {
  const h = criarHarness("#aba-inexistente");
  assert.equal(h.location.hash, "#status");
  h.location.hash = "#itens";
  h.listeners.get("hashchange")();
  assert.equal(h.abas.find((aba) => aba.id === "itens").classList.contains("ativa"), true);
});

test("modo de ficha em branco é consumido uma vez e grava um novo rascunho", () => {
  const entradaSource = fs.readFileSync(path.join(root, "js/modules/entrada-criacao.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "ficha/Ficha_DnD_-_Tatagiba_1.0.html"), "utf8");
  assert.match(entradaSource, /function consumirModoEntradaCriacao\(parametros\)[\s\S]*?parametros\.delete\("modo"\)/);
  assert.match(entradaSource, /window\.__salvarRascunhoAtivoFichaAgora\?\.\(\)/);
  assert.match(html, /if \(!textoImportado\) \{\s*await window\.__restaurarRascunhoAtivoFicha\?\.\(\)/);
});

test("barra de ações prioriza backup, limpeza, importação e salvamento", () => {
  const html = fs.readFileSync(path.join(root, "ficha/Ficha_DnD_-_Tatagiba_1.0.html"), "utf8");
  const barra = html.match(/<div class="acoes">([\s\S]*?)<\/div>/)?.[1] || "";
  const botoes = ["backupLocalAbrir", "btnLimparFicha", "btnImportarFicha"];
  const posicoes = botoes.map((id) => barra.indexOf(`id="${id}"`));
  assert.ok(posicoes.every((posicao) => posicao >= 0));
  assert.deepEqual([...posicoes].sort((a, b) => a - b), posicoes);
  assert.ok(barra.indexOf('onclick="salvarFicha()"') > posicoes[2]);
  assert.match(barra, /id="backupLocalAbrir"[^>]*>Backup<\/button>/);
  assert.match(barra, /id="btnLimparFicha"[^>]*onclick="limparFichaAtual\(\)"/);

  const storage = fs.readFileSync(path.join(root, "js/core/storage.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "css/base.css"), "utf8");
  assert.match(storage, /Ficha importada: dados importantes\./);
  assert.match(storage, /const importacaoConcluidaComSucesso = estadoModalImportacao === "sucesso"/);
  assert.match(storage, /async function limparFichaAtual\(\)[\s\S]*?prepararImportacaoFicha\(\{\}\)[\s\S]*?transacional: true/);
  assert.match(css, /\.ficha-notificacao-flutuante\s*\{[^}]*right:\s*16px[^}]*bottom:\s*16px/);
});
