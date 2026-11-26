const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const source = (file) =>
  fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
const rulesInContext = () => {
  const context = {};
  vm.runInNewContext(
    `${source("js/domain/regras-combate.js")}\nglobalThis.__rules = RegrasCombate;`,
    context,
  );
  return context.__rules;
};

function extractFunction(text, signature, nextSignature) {
  const start = text.indexOf(signature);
  const end = text.indexOf(nextSignature, start);
  assert.ok(start >= 0 && end > start, `função esperada: ${signature}`);
  return text.slice(start, end);
}

function criarPainelDescansoCurto({ classe = "", nivel = "1", restantes = "3", totalDados = "3", pv = "4", pvTotal = "20", modificador = 1 } = {}) {
  const campo = (value = "") => ({ value: String(value), textContent: "", innerHTML: "", disabled: false, min: "", max: "", dataset: {}, listeners: {}, focus() {}, setCustomValidity() {}, addEventListener(tipo, callback) { this.listeners[tipo] = callback; } });
  const dialogo = campo();
  dialogo.listeners = {};
  dialogo.addEventListener = (tipo, callback) => { dialogo.listeners[tipo] = callback; };
  dialogo.open = false;
  dialogo.showModal = () => { dialogo.open = true; };
  dialogo.close = (valor) => { dialogo.returnValue = valor; dialogo.open = false; dialogo.listeners.close?.(); };
  const recursosElegiveis = { ...campo(), hidden: true };
  const fields = {
    dadosVidaRestantes: campo(restantes), dadosVidaTotal: campo(totalDados), dadosVidaTipo: campo("d8"),
    pvAtual: campo(pv), pvTotal: campo(pvTotal), classeNomeID: campo(classe),
    descansoCurtoDialogo: dialogo, descansoCurtoRolar: campo(),
    descansoCurtoConfirmar: campo(), descansoCurtoPrevia: campo(),
    descansoCurtoPVResumo: campo(), descansoCurtoDadosDisponiveis: campo(), descansoCurtoRecursosResumo: { ...campo(), parentElement: recursosElegiveis }, descansoCurtoTipoResumo: campo(),
    descansoCurtoDadosEscolhidos: campo(), descansoCurtoResultadosManuais: campo(), descansoCurtoUsarDado: campo(), descansoCurtoDadoAtual: campo(), descansoCurtoDadoTotal: campo(), descansoCurtoDadoConta: campo(), descansoCurtoHistorico: campo(),
    descansoCurtoCuraResumo: campo(), descansoCurtoPVDepois: campo(), descansoCurtoFormula: campo(), descansoCurtoBonusConstituicao: campo(),
    descansoCurtoDetalhesRolagem: { hidden: true },
    descansoCurtoResultadosIndividuais: { itens: [], replaceChildren() { this.itens = []; }, append(item) { this.itens.push(item); } },
    magia1Rest: campo("0"), magia1Total: campo("2"), magia2Rest: campo("0"), magia2Total: campo("2"),
  };
  const history = [];
  const notifications = [];
  const confirmacoes = [];
  let confirmarDescarte = true;
  const context = {
    document: { getElementById: (id) => fields[id] || null, querySelector: () => ({ value: nivel }), createElement: () => ({ textContent: "" }) },
    window: { notificarFichaFlutuante: (message, type) => notifications.push({ message, type }), confirm: (message) => { confirmacoes.push(message); return confirmarDescarte; } }, Math: Object.assign(Object.create(Math), { random: () => 0.5 }), RegrasCombate: rulesInContext(), criarBotaoHistoricoDado: (valor, sufixo = "") => `<button data-valor-rolagem="${valor}">${valor}${sufixo}</button>`,
    estadoCombateIniciativa: { caracteristicasAtivas: [] }, getModificadorBaseAtributo: () => modificador,
    normalizarDadosVida() {}, normalizarPontosDeVida() {}, recuperarUsosCaracteristicas: () => 1,
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
  };
  vm.createContext(context);
  const combat = source("js/modules/combate.js");
  vm.runInContext(extractFunction(combat, "function definirStatusDescansoCurto(mensagem) {", "document.addEventListener(\"DOMContentLoaded\", inicializarModalDescansoCurto);"), context);
  vm.runInContext(extractFunction(combat, "function inicializarModalDescansoCurto() {", "function verificarStatusMorte() {"), context);
  context.inicializarModalDescansoCurto();
  return { context, fields, history, notifications, confirmacoes, definirConfirmarDescarte: (valor) => { confirmarDescarte = valor; } };
}

test("E2.1: total d20 é operação pura e valida entradas", () => {
  const rules = rulesInContext();
  assert.equal(rules.calcularTotalD20(15, [3, -1, 2]), 19);
  assert.equal(rules.calcularTotalD20(1, [-5]), -4);
  assert.equal(rules.calcularTotalD20(20, [0]), 20);
  assert.equal(rules.calcularTotalD20(0, [2]), null);
  assert.equal(rules.calcularTotalD20(21, [2]), null);
  assert.equal(rules.calcularTotalD20(12, [Number.NaN]), null);
});

test("E4.3: classifica ataques sem inferir modo pelo rótulo do botão", () => {
  const rules = rulesInContext();
  const plain = (value) => JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(rules.classificarModosAtaqueArma({ modo: "corpo-a-corpo", propriedades: ["arremesso"] })), ["corpo-a-corpo", "arremesso"]);
  assert.deepEqual(plain(rules.classificarModosAtaqueArma({ modo: "distancia", propriedades: ["arremesso", "acuidade"] })), ["arremesso"]);
  assert.deepEqual(plain(rules.classificarModosAtaqueArma({ modo: "À distância", propriedades: ["municao"] })), ["distancia"]);
  assert.deepEqual(plain(rules.classificarModosAtaqueArma({ modo: "corpo a corpo", propriedades: [] })), ["corpo-a-corpo"]);
  assert.deepEqual(plain(rules.classificarModosAtaqueArma({ modo: "desconhecido" })), []);
});

test("E2.1: recursos de turno consomem ação, bônus qualificador, reação e movimento", () => {
  const rules = rulesInContext();
  assert.equal(rules.converterDeslocamentoParaPes("7,5m"), 25);
  assert.equal(rules.converterDeslocamentoParaPes("30 ft"), 30);
  const inicial = rules.criarRecursosTurno({ rodada: 2, movimentoTotal: 30, ataquesAcaoRestantes: 2 });
  assert.deepEqual(JSON.parse(JSON.stringify(inicial)), {
    rodada: 2, acaoUsada: false, acaoBonusUsada: false, reacaoUsada: false,
    gastos: { acao: 0, acaoBonus: 0, reacao: 0 },
    limites: { acao: 1, acaoBonus: 1, reacao: 1, ataquesPorAcao: 1 },
    ajustesTemporarios: { acao: 0, acaoBonus: 0, reacao: 0, ataquesPorAcao: 0 },
    movimentoTotal: 30, movimentoGasto: 0, ataqueDuasArmasElegivel: false, maoAtaqueQualificador: null,
    maosAtaqueQualificadoras: [],
    ataqueAcaoIniciado: false, ataquesAcaoRestantes: 2,
  });
  assert.equal(rules.consumirAcaoTurno(inicial, "Ação bônus", { ataqueQualificadorDuasArmas: true }), null);
  const ataque = rules.consumirAcaoTurno(inicial, "Ação", { ataqueQualificadorDuasArmas: true, maoAtaqueQualificador: 1, ataqueDeArma: true });
  assert.equal(ataque.ataqueDuasArmasElegivel, true);
  assert.equal(ataque.maoAtaqueQualificador, 1);
  const extra1 = rules.consumirAcaoTurno(ataque, "Ação", { ataqueDeArma: true, ataqueAdicional: true });
  const extra2 = rules.consumirAcaoTurno(extra1, "Ação", { ataqueDeArma: true, ataqueAdicional: true });
  assert.equal(extra2.ataquesAcaoRestantes, 0);
  assert.equal(rules.consumirAcaoTurno(extra2, "Ação", { ataqueDeArma: true, ataqueAdicional: true }), null);
  assert.equal(rules.consumirAcaoTurno(ataque, "Ação"), null, "nova ação não é confundida com ataque extra");
  const bonus = rules.consumirAcaoTurno(ataque, "Ação bônus", { ataqueQualificadorDuasArmas: true });
  assert.equal(bonus.acaoBonusUsada, true);
  assert.equal(rules.consumirAcaoTurno(bonus, "Ação bônus"), null);
  const reacao = rules.consumirAcaoTurno(bonus, "Reação");
  assert.equal(reacao.reacaoUsada, true);
  assert.equal(rules.consumirMovimentoTurno(reacao, 20).movimentoGasto, 20);
  assert.equal(rules.consumirMovimentoTurno({ ...reacao, movimentoGasto: 20 }, 11), null);
  assert.equal(rules.consumirMovimentoTurno(reacao, -1), null);
});

test("E2.1: uma ação comum como Esquivar não qualifica ataque bônus de duas armas", () => {
  const rules = rulesInContext();
  const inicial = rules.criarRecursosTurno({ rodada: 1 });
  const esquivar = rules.consumirAcaoTurno(inicial, "Ação");

  assert.equal(esquivar.acaoUsada, true);
  assert.equal(esquivar.ataqueAcaoIniciado, false);
  assert.equal(esquivar.ataqueDuasArmasElegivel, false);
  assert.equal(
    rules.consumirAcaoTurno(esquivar, "Ação bônus", { ataqueQualificadorDuasArmas: true, maoAtaqueBonus: 2 }),
    null,
    "o ataque bônus de duas armas exige ação Ataque qualificadora, não apenas uma ação consumida",
  );
});

test("E2.1: limites padrão começam em 1 e ajustes temporários ampliam somente o turno atual", () => {
  const rules = rulesInContext();
  const inicial = rules.criarRecursosTurno({ rodada: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(inicial.limites)), { acao: 1, acaoBonus: 1, reacao: 1, ataquesPorAcao: 1 });
  const comAjuste = rules.criarRecursosTurno({
    rodada: 1,
    limites: { acao: 2, acaoBonus: 2, reacao: 1, ataquesPorAcao: 1 },
    ajustesTemporarios: { acao: 1 },
  });
  const primeira = rules.consumirAcaoTurno(comAjuste, "Ação");
  const segunda = rules.consumirAcaoTurno(primeira, "Ação");
  const terceira = rules.consumirAcaoTurno(segunda, "Ação");
  assert.equal(terceira.gastos.acao, 3);
  assert.equal(rules.consumirAcaoTurno(terceira, "Ação"), null);
  const bonus = rules.consumirAcaoTurno(terceira, "Ação bônus");
  assert.equal(rules.consumirAcaoTurno(bonus, "Ação bônus").gastos.acaoBonus, 2);
  const proximo = rules.criarRecursosTurno({ rodada: 2, limites: comAjuste.limites });
  assert.deepEqual(JSON.parse(JSON.stringify(proximo.ajustesTemporarios)), { acao: 0, acaoBonus: 0, reacao: 0, ataquesPorAcao: 0 });
  assert.deepEqual(JSON.parse(JSON.stringify(proximo.gastos)), { acao: 0, acaoBonus: 0, reacao: 0 });
});

test("E3.6: descanso longo recupera no máximo metade dos dados de vida e no mínimo um", () => {
  const rules = rulesInContext();
  assert.equal(rules.calcularRecuperacaoDadosVidaDescansoLongo(1, 0), 1);
  assert.equal(rules.calcularRecuperacaoDadosVidaDescansoLongo(5, 0), 2);
  assert.equal(rules.calcularRecuperacaoDadosVidaDescansoLongo(6, 2), 3);
  assert.equal(rules.calcularRecuperacaoDadosVidaDescansoLongo(8, 6), 2);
  assert.equal(rules.calcularRecuperacaoDadosVidaDescansoLongo(8, 8), 0);
  assert.equal(rules.calcularRecuperacaoDadosVidaDescansoLongo(8, 9), null);
});

test("E3.6: espaços de Pacto seguem nível e quantidade de Bruxo em D&D 2014", () => {
  const rules = rulesInContext();
  assert.deepEqual(JSON.parse(JSON.stringify(rules.calcularEspacosPactoBruxo(1))), { nivelEspaco: 1, quantidade: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(rules.calcularEspacosPactoBruxo(3))), { nivelEspaco: 2, quantidade: 2 });
  assert.deepEqual(JSON.parse(JSON.stringify(rules.calcularEspacosPactoBruxo(11))), { nivelEspaco: 5, quantidade: 3 });
  assert.deepEqual(JSON.parse(JSON.stringify(rules.calcularEspacosPactoBruxo(17))), { nivelEspaco: 5, quantidade: 4 });
  assert.equal(rules.calcularEspacosPactoBruxo(0), null);
});

test("E3.6: cura de descanso curto limita a zero o total dos dados após Constituição e respeita o máximo de PV", () => {
  const rules = rulesInContext();
  assert.deepEqual(JSON.parse(JSON.stringify(rules.calcularCuraDescansoCurto({
    resultados: [2, 5], faces: 8, modificadorConstituicao: -3, pvAtuais: 4, pvMaximos: 20,
  }))), { curaBruta: 1, curaAplicada: 1, pvDepois: 5 });
  assert.deepEqual(JSON.parse(JSON.stringify(rules.calcularCuraDescansoCurto({
    resultados: [1, 4], faces: 4, modificadorConstituicao: -2, pvAtuais: 0, pvMaximos: 20,
  }))), { curaBruta: 1, curaAplicada: 1, pvDepois: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(rules.calcularCuraDescansoCurto({
    resultados: [1, 6], faces: 8, modificadorConstituicao: -2, pvAtuais: 0, pvMaximos: 20,
  }))), { curaBruta: 3, curaAplicada: 3, pvDepois: 3 });
  assert.deepEqual(JSON.parse(JSON.stringify(rules.calcularCuraDescansoCurto({
    resultados: [1], faces: 4, modificadorConstituicao: -2, pvAtuais: 0, pvMaximos: 20,
  }))), { curaBruta: 0, curaAplicada: 0, pvDepois: 0 });
  assert.deepEqual(JSON.parse(JSON.stringify(rules.calcularCuraDescansoCurto({
    resultados: [8, 8], faces: 8, modificadorConstituicao: 2, pvAtuais: 18, pvMaximos: 20,
  }))), { curaBruta: 20, curaAplicada: 2, pvDepois: 20 });
  assert.equal(rules.calcularCuraDescansoCurto({ resultados: [9], faces: 8, modificadorConstituicao: 0, pvAtuais: 0, pvMaximos: 20 }), null);
});

test("descanso curto usa um Dado de Vida por vez; cancelar protege resultados pendentes e confirmar registra os dados usados", async () => {
  const { context, fields, history, notifications, confirmacoes } = criarPainelDescansoCurto();
  assert.equal(context.descansoCurto(), true);
  assert.equal(fields.descansoCurtoDialogo.open, true);
  assert.equal(fields.descansoCurtoPVResumo.textContent, "4/20");
  assert.equal(fields.descansoCurtoDadosDisponiveis.textContent, "3/3 · d8");
  assert.equal(fields.descansoCurtoDadosEscolhidos.textContent, "0/3");
  assert.equal(fields.descansoCurtoRecursosResumo.parentElement.hidden, true, "recursos elegíveis vazios não ocupam espaço no modal");
  assert.equal(fields.pvAtual.value, "4", "abrir a prévia não altera PV");
  assert.equal(fields.dadosVidaRestantes.value, "3", "abrir a prévia não consome dados");

  assert.equal(fields.descansoCurtoConfirmar.disabled, false, "descanso sem Dados de Vida continua permitido");
  assert.equal(context.confirmarDescansoCurto(), true);
  assert.equal(fields.dadosVidaRestantes.value, "3", "confirmar sem Dados de Vida não consome nenhum");
  assert.equal(fields.pvAtual.value, "4");

  context.descansoCurto();
  await context.rolarDadosDescansoCurto();
  assert.equal(fields.descansoCurtoDadoTotal.textContent, 6);
  assert.equal(fields.descansoCurtoDadoConta.textContent, "(5+1)");
  assert.match(fields.descansoCurtoHistorico.innerHTML, /data-valor-rolagem="5"/);
  assert.equal(context.usarDadoDescansoCurto(), true);
  assert.equal(fields.descansoCurtoDadosEscolhidos.textContent, "1/3");
  assert.equal(fields.descansoCurtoPrevia.textContent, "");
  assert.equal(fields.descansoCurtoPrevia.hidden, true);
  assert.equal(fields.descansoCurtoUsarDado.disabled, true, "cada resultado só pode ser usado uma vez");
  await context.rolarDadosDescansoCurto();
  assert.equal(context.usarDadoDescansoCurto(), true);
  assert.equal(fields.descansoCurtoDadosEscolhidos.textContent, "2/3");
  assert.equal(fields.descansoCurtoCuraResumo.textContent, "12 PV");
  assert.equal(fields.descansoCurtoPVDepois.textContent, "4 → 16");

  const historicoAntesDoCancelamento = history.length;
  assert.equal(context.cancelarDescansoCurto(), true);
  assert.match(confirmacoes[0], /Calma lá, aventureiro!/i);
  assert.match(confirmacoes[0], /resultados e a prévia serão descartados/i);
  assert.match(confirmacoes[0], /Nenhum Dado de Vida será gasto/i);
  assert.equal(fields.dadosVidaRestantes.value, "3");
  assert.equal(fields.pvAtual.value, "4");
  assert.equal(history.length, historicoAntesDoCancelamento);
  assert.deepEqual(notifications, [], "cancelar descanso não exibe notificação");

  context.descansoCurto();
  await context.rolarDadosDescansoCurto();
  context.usarDadoDescansoCurto();
  await context.rolarDadosDescansoCurto();
  context.usarDadoDescansoCurto();
  assert.equal(context.confirmarDescansoCurto(), true);
  assert.equal(fields.dadosVidaRestantes.value, "1");
  assert.equal(fields.pvAtual.value, "16");
  assert.deepEqual(JSON.parse(JSON.stringify(history[1][4].consumo.resultadosDados)), [5, 5]);
  assert.equal(history[1][4].consumo.curaPV, 12);
  assert.equal(context.confirmarDescansoCurto(), false, "uma segunda confirmação não reaplica o descanso");
  assert.equal(history.length, 2);
  assert.deepEqual(notifications, [], "a recuperação fica registrada na própria ficha sem notificação extra");
});

test("cancelar descanso curto permite permanecer quando o jogador recusa descartar Dados de Vida", async () => {
  const { context, fields, definirConfirmarDescarte, confirmacoes } = criarPainelDescansoCurto({ pv: "6", pvTotal: "20" });
  context.descansoCurto();
  await context.rolarDadosDescansoCurto();
  context.usarDadoDescansoCurto();

  definirConfirmarDescarte(false);
  assert.equal(context.cancelarDescansoCurto(), false);
  assert.equal(fields.descansoCurtoDialogo.open, true, "o descanso continua aberto após recusar o descarte");
  assert.equal(fields.dadosVidaRestantes.value, "3", "nenhum Dado de Vida é consumido pela tentativa de cancelar");
  assert.equal(fields.pvAtual.value, "6", "PV não mudam antes da confirmação do descanso");
  assert.equal(confirmacoes.length, 1);

  definirConfirmarDescarte(true);
  assert.equal(context.cancelarDescansoCurto(), true);
  assert.equal(fields.descansoCurtoDialogo.open, false);
});

test("cancelar descanso curto sem rolagens não pede confirmação", () => {
  const { context, fields, confirmacoes } = criarPainelDescansoCurto();
  context.descansoCurto();
  assert.equal(context.cancelarDescansoCurto(), true);
  assert.equal(fields.descansoCurtoDialogo.open, false);
  assert.equal(confirmacoes.length, 0);
});

test("descanso curto permite confirmar com PV cheios e sem Dados de Vida disponíveis", () => {
  const { context, fields, history } = criarPainelDescansoCurto({ restantes: "0", totalDados: "3", pv: "20", pvTotal: "20" });
  assert.equal(context.descansoCurto(), true);
  assert.equal(fields.descansoCurtoRolar.disabled, true);
  assert.equal(fields.descansoCurtoUsarDado.disabled, true);
  assert.equal(fields.descansoCurtoConfirmar.disabled, false);
  assert.equal(context.confirmarDescansoCurto(), true);
  assert.equal(fields.dadosVidaRestantes.value, "0");
  assert.equal(fields.pvAtual.value, "20");
  assert.equal(history.length, 1);
  assert.equal(history[0][4].consumo.dadosVidaGastos, 0);
});

test("Escape cancela o descanso curto sem alterar PV, Dados de Vida ou histórico", async () => {
  const { context, fields, history } = criarPainelDescansoCurto({ pv: "6", pvTotal: "20" });
  context.descansoCurto();
  await context.rolarDadosDescansoCurto();
  context.usarDadoDescansoCurto();
  let prevenido = false;
  fields.descansoCurtoDialogo.listeners.keydown({
    key: "Escape",
    preventDefault() { prevenido = true; },
    stopPropagation() {},
  });
  assert.equal(prevenido, true);
  assert.equal(fields.descansoCurtoDialogo.open, false);
  assert.equal(fields.pvAtual.value, "6");
  assert.equal(fields.dadosVidaRestantes.value, "3");
  assert.equal(history.length, 0);
});

test("E3.6: descanso curto de Bruxo restaura espaços de Pacto; classe sem recarga não altera slots", () => {
  const { context, fields, history } = criarPainelDescansoCurto({ classe: "bruxo", nivel: "3", restantes: "1", totalDados: "3", pv: "10", pvTotal: "10", modificador: 0 });
  context.descansoCurto();
  assert.match(fields.descansoCurtoRecursosResumo.textContent, /2 espaço\(s\) de Pacto/);
  assert.equal(context.confirmarDescansoCurto(), true, "pode confirmar sem gastar Dados de Vida");
  assert.equal(fields.magia1Rest.value, "0", "Bruxo nível 3 não recupera slots de nível 1 como Pact Magic");
  assert.equal(fields.magia2Rest.value, "2");
  assert.equal(history[0][4].consumo.espacosPactoRecuperados, 2);

  fields.classeNomeID.value = "mago";
  fields.magia2Rest.value = "0";
  context.descansoCurto();
  assert.equal(fields.descansoCurtoRecursosResumo.parentElement.hidden, true, "não exibe recurso quando não há nada elegível para recuperar");
  context.confirmarDescansoCurto();
  assert.equal(fields.magia2Rest.value, "0");
});

test("descanso curto aceita resultados manuais individuais com histórico e aplica Constituição em cada dado", () => {
  const { context, fields } = criarPainelDescansoCurto({ restantes: "3", pv: "8", pvTotal: "20", modificador: 3 });
  context.descansoCurto();
  fields.descansoCurtoResultadosManuais.value = "5";
  context.atualizarPreviaDescansoCurto();
  assert.equal(fields.descansoCurtoUsarDado.disabled, false);
  assert.equal(context.usarDadoDescansoCurto(), true);
  assert.equal(fields.descansoCurtoDadoTotal.textContent, 8);
  assert.equal(fields.descansoCurtoDadoConta.textContent, "(5+3)");
  fields.descansoCurtoResultadosManuais.value = "2";
  context.atualizarPreviaDescansoCurto();
  assert.equal(context.usarDadoDescansoCurto(), true);
  assert.equal(fields.descansoCurtoCuraResumo.textContent, "12 PV");
  assert.equal(fields.descansoCurtoPVDepois.textContent, "8 → 20");
  assert.match(fields.descansoCurtoHistorico.innerHTML, /data-valor-rolagem="5"/);
  assert.match(fields.descansoCurtoHistorico.innerHTML, /data-valor-rolagem="2"/);
  assert.equal(context.confirmarDescansoCurto(), true);
  assert.equal(fields.pvAtual.value, "20");
  assert.equal(fields.dadosVidaRestantes.value, "1");
});

test("rolagem do Descanso Curto anima um dado por vez e permite recuperar um resultado no histórico", async () => {
  const { context, fields } = criarPainelDescansoCurto({ restantes: "2", totalDados: "2", modificador: 3 });
  context.descansoCurto();
  let concluirAnimacao;
  let argumentoRolagem;
  context.animarRolagemNoCampo = (campo, quantidade, faces) => {
    argumentoRolagem = { campo, quantidade, faces };
    return new Promise((resolve) => { concluirAnimacao = resolve; });
  };
  const emAndamento = context.rolarDadosDescansoCurto();
  assert.deepEqual({ quantidade: argumentoRolagem.quantidade, faces: argumentoRolagem.faces }, { quantidade: 1, faces: 8 });
  assert.equal(fields.descansoCurtoConfirmar.disabled, true, "não confirma enquanto a rolagem está em andamento");
  concluirAnimacao({ resultados: [5], soma: 5 });
  assert.equal(await emAndamento, true);
  assert.equal(fields.descansoCurtoDadoTotal.textContent, 8);
  assert.equal(fields.descansoCurtoDadoConta.textContent, "(5+3)");
  assert.equal(context.usarDadoDescansoCurto(), true);

  fields.descansoCurtoHistorico.listeners.click({
    target: { closest: () => ({ dataset: { valorRolagem: "5" } }) },
  });
  assert.equal(fields.descansoCurtoResultadosManuais.value, "5");
  assert.equal(fields.descansoCurtoUsarDado.disabled, false);
  assert.equal(context.usarDadoDescansoCurto(), true, "o histórico repõe o resultado selecionado no próximo Dado de Vida");
  assert.equal(fields.descansoCurtoDadosEscolhidos.textContent, "2/2");
});

test("descanso curto rejeita resultado manual acima das faces e não consome Dados de Vida", () => {
  const { context, fields } = criarPainelDescansoCurto({ restantes: "2", totalDados: "2" });
  context.descansoCurto();
  fields.descansoCurtoResultadosManuais.value = "9";
  context.atualizarPreviaDescansoCurto();
  assert.equal(fields.descansoCurtoUsarDado.disabled, true);
  assert.equal(context.usarDadoDescansoCurto(), false);
  assert.equal(fields.dadosVidaRestantes.value, "2");
});

test("descanso curto bloqueia uso acima dos Dados de Vida disponíveis", async () => {
  const { context, fields, history } = criarPainelDescansoCurto({ restantes: "1", totalDados: "1" });
  context.descansoCurto();
  await context.rolarDadosDescansoCurto();
  assert.equal(context.usarDadoDescansoCurto(), true);
  await context.rolarDadosDescansoCurto();
  assert.equal(fields.descansoCurtoRolar.disabled, true);
  assert.equal(fields.descansoCurtoUsarDado.disabled, true);
  assert.equal(fields.descansoCurtoConfirmar.disabled, false);
  assert.equal(context.usarDadoDescansoCurto(), false);
  assert.equal(fields.dadosVidaRestantes.value, "1");
  assert.equal(fields.pvAtual.value, "4");
  assert.equal(context.confirmarDescansoCurto(), true);
  assert.equal(fields.dadosVidaRestantes.value, "0");
  assert.equal(history.length, 1);
});

test("interface de iniciativa projeta saldos restantes das três ações e atualiza os controles de edição", () => {
  const combat = source("js/modules/combate.js");
  const balances = Object.fromEntries(["Acao", "Bonus", "Reacao"].map((name) => [name, {
    dataset: {}, value: { textContent: "1/1" }, querySelector() { return this.value; },
  }]));
  const status = { textContent: "" };
  const bloco = { classList: { toggle() {} } };
  const ids = {
    combateAcaoSaldo: balances.Acao, combateAcaoBonusSaldo: balances.Bonus,
    combateReacaoSaldo: balances.Reacao,
    combateRecursosTurnoStatus: status, combateRecursosTurno: bloco,
  };
  const context = {
    estadoCombateIniciativa: {
      ativo: true,
      recursosTurno: {
        acaoUsada: true, acaoBonusUsada: false, reacaoUsada: true,
        gastos: { acao: 1, acaoBonus: 0, reacao: 1 },
        limites: { acao: 2, acaoBonus: 1, reacao: 1 },
        ajustesTemporarios: { acao: 1, acaoBonus: 0, reacao: 0 },
      },
    },
    document: { getElementById: (id) => ids[id] || null },
    atualizarIndicadorAtaquesRestantesTurno() {},
  };
  vm.runInNewContext(extractFunction(combat, "function atualizarInterfaceRecursosTurno() {", "const estadoModalIniciativa = {"), context);
  context.atualizarInterfaceRecursosTurno();
  assert.equal(balances.Acao.value.textContent, "2/3");
  assert.equal(balances.Acao.dataset.disponibilidade, "disponivel");
  assert.equal(balances.Bonus.value.textContent, "1/1");
  assert.equal(balances.Bonus.dataset.disponibilidade, "disponivel");
  assert.equal(balances.Reacao.value.textContent, "0/1");
});

test("E2.1: seletor de ataque bloqueia saldo gasto e ação bônus sem elegibilidade", () => {
  const combat = source("js/modules/combate.js");
  const rules = rulesInContext();
  const params = {
    "Ação": { tipoAcao: "Ação", ataqueQualificadorDuasArmas: false, maoAtaqueQualificador: null, ataqueDeArma: true },
    "Ação bônus": { tipoAcao: "Ação bônus", ataqueQualificadorDuasArmas: false, maoAtaqueQualificador: null, ataqueDeArma: true },
  };
  const context = {
    RegrasCombate: rules,
    estadoCombateIniciativa: { ativo: true, recursosTurno: rules.criarRecursosTurno() },
    estadoAtaqueArma: { origem: "arma", acaoTurnoConsumida: false, arma: { slot: 2 } },
    obterParametrosConsumoTentativaAtaque: (tipo) => params[tipo] || null,
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function normalizarContextoAcaoAtaque(contexto) {", "function obterMovimentoTotalTurno() {") + extractFunction(combat, "function tipoAcaoAtaqueDisponivel(tipoAcao) {", "function marcarTipoAcaoModalAtaque("), context);
  assert.equal(context.tipoAcaoAtaqueDisponivel("Ação"), true);
  assert.equal(context.tipoAcaoAtaqueDisponivel("Ação bônus"), false, "arma sem qualificador não recebe custo bônus arbitrário");
  context.estadoCombateIniciativa.recursosTurno = rules.consumirAcaoTurno(context.estadoCombateIniciativa.recursosTurno, "Ação");
  assert.equal(context.tipoAcaoAtaqueDisponivel("Ação"), false, "ação usada sem ataques adicionais não pode ser selecionada");
  context.estadoCombateIniciativa.recursosTurno = rules.criarRecursosTurno();
  params["Ação bônus"].ataqueQualificadorDuasArmas = true;
  params["Ação bônus"].maoAtaqueQualificador = 1;
  context.estadoCombateIniciativa.recursosTurno = rules.consumirAcaoTurno(context.estadoCombateIniciativa.recursosTurno, "Ação", { ataqueQualificadorDuasArmas: true, maoAtaqueQualificador: 1, ataqueDeArma: true });
  assert.equal(context.tipoAcaoAtaqueDisponivel("Ação bônus"), true, "a outra mão pode usar ação bônus após ataque qualificador");
  context.estadoCombateIniciativa.recursosTurno = rules.consumirAcaoTurno(context.estadoCombateIniciativa.recursosTurno, "Ação bônus", { ataqueQualificadorDuasArmas: true, maoAtaqueBonus: 2 });
  assert.equal(context.tipoAcaoAtaqueDisponivel("Ação bônus"), false, "ação bônus gasta fica indisponível");
});

test("E2.1: ataque comum não seleciona reação automaticamente quando a ação acabou", () => {
  const combat = source("js/modules/combate.js");
  const boxes = ["Ação", "Ação bônus", "Reação"].map(tipoAcao => ({ dataset: { tipoAcao }, checked: false, disabled: false }));
  const context = {
    estadoCombateIniciativa: { ativo: true, recursosTurno: {} },
    estadoAtaqueArma: { origem: "arma", arma: { slot: 1 } },
    document: { querySelectorAll: () => boxes, getElementById: () => ({ hidden: false }) },
    tipoAcaoAtaqueDisponivel: tipo => tipo === "Reação",
    atualizarIndicadorAtaquesRestantesTurno() {}, atualizarDetalheBonusDanoModal() {}, atualizarTotalModalDano() {},
    obterTipoAcaoSelecionadoModalAtaque: () => boxes.find(box => box.checked)?.dataset.tipoAcao || "Ação",
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function normalizarContextoAcaoAtaque(contexto) {", "function obterMovimentoTotalTurno() {") + extractFunction(combat, "function marcarTipoAcaoModalAtaque(tipoSelecionado =", "function atualizarIndicadorAtaquesRestantesTurno() {"), context);
  context.marcarTipoAcaoModalAtaque("Ação");
  assert.equal(boxes[0].checked, true);
  assert.equal(boxes[0].disabled, true);
  assert.equal(boxes[2].checked, false, "a interface não converte silenciosamente o ataque em reação");
});

test("E2.1: tentativa de reação de ataque exige gatilho antes de consumir saldo", () => {
  const combat = source("js/modules/combate.js");
  const gatilho = { value: "", focus() { this.focused = true; } };
  const status = { textContent: "" };
  const context = {
    estadoCombateIniciativa: { ativo: true, recursosTurno: rulesInContext().criarRecursosTurno() },
    estadoAtaqueArma: { origem: "arma", arma: { slot: 1 } },
    document: { getElementById: id => id === "modalAtaqueGatilhoReacao" ? gatilho : status },
    obterTipoAcaoSelecionadoModalAtaque: () => "Reação",
    parArmasElegivelDuasArmas: () => false,
    ehAtaqueSecundarioComDuasArmas: () => false,
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function normalizarContextoAcaoAtaque(contexto) {", "function obterMovimentoTotalTurno() {") + extractFunction(combat, "function obterParametrosConsumoTentativaAtaque(tipoAcao =", "function validarRecursosTentativaAtaque() {"), context);
  assert.equal(context.obterParametrosConsumoTentativaAtaque(), null);
  assert.equal(gatilho.focused, true);
  assert.match(status.textContent, /gatilho/i);
  assert.equal(context.estadoCombateIniciativa.recursosTurno.reacaoUsada, false);
  gatilho.value = "A criatura sai do meu alcance";
  assert.equal(context.obterParametrosConsumoTentativaAtaque().tipoAcao, "Reação");
});

test("E2.1: indicador anuncia ataques restantes e some ao encerrar a ação/combate", () => {
  const combat = source("js/modules/combate.js");
  const indicador = { textContent: "", hidden: true };
  const context = {
    estadoCombateIniciativa: { ativo: true, recursosTurno: { ataqueAcaoIniciado: true, ataquesAcaoRestantes: 1 } },
    document: { getElementById: id => id === "combateAtaquesRestantesAcao" ? indicador : null },
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function atualizarIndicadorAtaquesRestantesTurno() {", "function obterTipoAcaoSelecionadoModalAtaque() {"), context);
  context.atualizarIndicadorAtaquesRestantesTurno();
  assert.equal(indicador.hidden, false);
  assert.equal(indicador.textContent, "Ataques restantes nesta ação: 1");
  context.estadoCombateIniciativa.recursosTurno.ataquesAcaoRestantes = 0;
  context.atualizarIndicadorAtaquesRestantesTurno();
  assert.equal(indicador.hidden, true);
  context.estadoCombateIniciativa.ativo = false;
  context.estadoCombateIniciativa.recursosTurno.ataquesAcaoRestantes = 2;
  context.atualizarIndicadorAtaquesRestantesTurno();
  assert.equal(indicador.hidden, true);
});

test("E2.1: Próximo turno restaura ação, bônus e reação e encerra ajustes temporários", () => {
  const combat = source("js/modules/combate.js");
  const rules = rulesInContext();
  const state = {
    ativo: true, rodada: 3, posicao: 2, iniciativa: 14,
    configuracaoRecursosTurno: { acao: 1, acaoBonus: 1, reacao: 1, ataquesPorAcao: 1 },
    recursosTurno: { ...rules.criarRecursosTurno({ rodada: 3 }), acaoUsada: true, acaoBonusUsada: true, reacaoUsada: true,
      gastos: { acao: 1, acaoBonus: 1, reacao: 1 }, ajustesTemporarios: { acao: 1, acaoBonus: 0, reacao: 0, ataquesPorAcao: 0 } },
  };
  const context = {
    estadoCombateIniciativa: state,
    criarRecursosTurnoCombate: rodada => rules.criarRecursosTurno({ rodada, limites: state.configuracaoRecursosTurno }),
    atualizarInterfaceCombate() {},
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function avancarRodadaCombate() {", "function encerrarCombate("), context);
  context.avancarRodadaCombate();
  assert.equal(state.rodada, 4);
  assert.equal(state.recursosTurno.acaoUsada, false);
  assert.equal(state.recursosTurno.acaoBonusUsada, false);
  assert.equal(state.recursosTurno.reacaoUsada, false);
  assert.deepEqual(JSON.parse(JSON.stringify(state.recursosTurno.ajustesTemporarios)), { acao: 0, acaoBonus: 0, reacao: 0, ataquesPorAcao: 0 });
});

test("Editar abre configuração com limites padrão e ajustes apenas do turno atual", () => {
  const combat = source("js/modules/combate.js");
  let shown = 0;
  let focused = 0;
  const fields = Object.fromEntries([
    "limiteAcaoTurno", "limiteAcaoBonusTurno", "limiteReacaoTurno", "limiteAtaquesPorAcaoTurno",
    "ajusteAcaoTurno", "ajusteAcaoBonusTurno", "ajusteReacaoTurno", "ajusteAtaquesPorAcaoTurno",
  ].map((id) => [id, { value: "", get valueAsNumber() { return Number(this.value); }, focus() { focused += 1; } }]));
  const dialog = {
    open: false,
    showModal() { this.open = true; shown += 1; },
    close() { this.open = false; },
    querySelector() { return fields.limiteAcaoTurno; },
  };
  const context = {
    estadoCombateIniciativa: {
      ativo: true,
      configuracaoRecursosTurno: { acao: 2, acaoBonus: 1, reacao: 1, ataquesPorAcao: 3 },
      recursosTurno: {
        acaoUsada: true, acaoBonusUsada: false, reacaoUsada: false,
        gastos: { acao: 1, acaoBonus: 0, reacao: 0 },
        limites: { acao: 2, acaoBonus: 1, reacao: 1, ataquesPorAcao: 3 },
        ataquesAcaoRestantes: 2, ataqueAcaoIniciado: false,
        ajustesTemporarios: { acao: 1, acaoBonus: 0, reacao: -1, ataquesPorAcao: 0 },
      },
    },
    document: { getElementById: (id) => id === "editarRecursosTurnoDialogo" ? dialog : fields[id] || null },
    window: { __fichaImportacaoTransacaoAtiva: false },
    obterAtaquesAdicionaisAcao: () => 0,
    atualizarInterfaceRecursosTurno() {},
  };
  vm.runInNewContext(extractFunction(combat, "function abrirEditorRecursosTurno() {", "function salvarConfiguracaoRecursosTurno() {"), context);
  context.abrirEditorRecursosTurno();
  assert.equal(shown, 1);
  assert.equal(focused, 1);
  assert.deepEqual(Object.fromEntries(Object.entries(fields).map(([id, field]) => [id, field.value])), {
    limiteAcaoTurno: "2", limiteAcaoBonusTurno: "1", limiteReacaoTurno: "1", limiteAtaquesPorAcaoTurno: "3",
    ajusteAcaoTurno: "1", ajusteAcaoBonusTurno: "0", ajusteReacaoTurno: "-1", ajusteAtaquesPorAcaoTurno: "0",
  });
  fields.limiteAcaoTurno.value = "3";
  fields.ajusteAcaoTurno.value = "2";
  vm.runInNewContext(extractFunction(combat, "function salvarConfiguracaoRecursosTurno() {", "function cancelarEditorRecursosTurno() {"), context);
  assert.equal(context.salvarConfiguracaoRecursosTurno(), true);
  assert.equal(context.estadoCombateIniciativa.recursosTurno.gastos.acao, 1, "o ajuste não devolve o uso gasto");
  assert.equal(context.estadoCombateIniciativa.recursosTurno.ajustesTemporarios.acao, 2);
  assert.equal(context.estadoCombateIniciativa.recursosTurno.limites.acao, 3);
});

test("E3.5: eventos estruturados distinguem ativação e aplicação e são serializáveis", () => {
  const combat = source("js/modules/combate.js");
  const container = { prepend() {}, get firstElementChild() { return null; } };
  const context = {
    document: { getElementById: (id) => id === "historicoRegistros" ? container : null },
    estadoCombateIniciativa: { rodada: 2, historicoEventos: [] },
    obterRodadaAtualHistorico: () => 2,
    montarRegistroTimelineHistorico: (dados) => ({ dados, dataset: {} }),
    garantirDivisorRodadaHistorico() {},
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function adicionarRegistroHistoricoCombate(", "function registrarHistoricoAtaqueArma("), context);
  context.adicionarRegistroHistoricoCombate("Magia NV 1", "Hex", "", "Ação", {
    evento: "ativacao", origem: { tipo: "magia", id: "hex" }, consumo: { nivelSlot: 1 },
    timeline: { titulo: "Magia NV 1", nome: "Hex" },
  });
  context.adicionarRegistroHistoricoCombate("Dano Mágico", "Hex", "", "Efeito", {
    evento: "aplicacao", origem: { tipo: "magia", id: "hex" }, consumo: null,
    timeline: { titulo: "Hex · Efeito", nome: "Hex" },
  });
  const eventos = JSON.parse(vm.runInContext("JSON.stringify(estadoCombateIniciativa.historicoEventos)", context));
  assert.equal(eventos.length, 2);
  assert.deepEqual(eventos.map((evento) => evento.efeito.evento), ["ativacao", "aplicacao"]);
  assert.notEqual(eventos[0].id, eventos[1].id);
  assert.equal(eventos[0].origem.id, "hex");
});

test("E3.3: aplicação posterior confirmada não consome novamente ação ou munição", () => {
  const combat = source("js/modules/combate.js");
  const state = { acaoTurnoConsumida: false, aplicacaoEfeito: true, origem: "magia", arma: null };
  let consumos = 0;
  const context = {
    estadoAtaqueArma: state,
    window: {},
    obterTipoAcaoSelecionadoModalAtaque() { consumos += 1; return "Ação"; },
    estadoCombateIniciativa: { ativo: true },
    parArmasElegivelDuasArmas() { consumos += 1; return true; },
    consumirAcaoTurnoCombate() { consumos += 1; return true; },
    consumirMunicao() { consumos += 1; },
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function consumirRecursosTentativaAtaque() {", "function fecharModalAtaqueArma() {"), context);
  assert.equal(context.consumirRecursosTentativaAtaque(), true);
  assert.equal(state.acaoTurnoConsumida, true);
  assert.equal(consumos, 0);
});

test("E3.6: descanso longo mostra a recuperação antes de confirmar e registra o resultado", () => {
  const combat = source("js/modules/combate.js");
  const fields = {
    dadosVidaTotal: { value: "6" }, dadosVidaRestantes: { value: "2" },
    pvAtual: { value: "7" }, pvTotal: { value: "20" }, pvTemporario: { value: "3" },
    magia1Rest: { value: "1" }, magia1Total: { value: "3" },
  };
  const prompts = [];
  const history = [];
  let recuperacaoChamadas = 0;
  const context = {
    document: { getElementById: (id) => fields[id] || null },
    RegrasCombate: rulesInContext(),
    confirm: (message) => { prompts.push(message); return true; },
    normalizarDadosVida() {}, normalizarPontosDeVida() {},
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
    estadoCombateIniciativa: { historicoEventos: [], caracteristicasAtivas: [{ id: 'surto', usosMaximos: 2, usosRestantes: 1, recarga: 'descanso_longo' }] },
    recuperarUsosCaracteristicas(tipo) { assert.equal(tipo, 'descanso_longo'); recuperacaoChamadas += 1; return 1; },
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function descansoLongo() {", "function verificarStatusMorte() {"), context);
  context.descansoLongo();
  assert.match(prompts[0], /2 → 5/);
  assert.match(prompts[0], /7 → 20/);
  assert.match(prompts[0], /Usos de características com recarga longa: 1/);
  assert.match(prompts[0], /Espaços de magia recuperados: 2/);
  assert.equal(fields.dadosVidaRestantes.value, "5");
  assert.equal(fields.pvAtual.value, "20");
  assert.equal(fields.pvTemporario.value, "0");
  assert.equal(fields.magia1Rest.value, "3");
  assert.equal(history[0][0], "Descanso longo");
  assert.equal(history[0][4].consumo.dadosVidaRecuperados, 3);
  assert.equal(history[0][4].consumo.usosCaracteristicasRecuperados, 1);
  assert.equal(recuperacaoChamadas, 1);
});

test("E3.6: descanso longo não concede benefícios quando a ficha começa com 0 PV", () => {
  const combat = source("js/modules/combate.js");
  const fields = { dadosVidaTotal: { value: "4" }, dadosVidaRestantes: { value: "1" }, pvAtual: { value: "0" }, pvTotal: { value: "12" } };
  let confirms = 0;
  const alerts = [];
  const history = [];
  const context = {
    document: { getElementById: (id) => fields[id] || null },
    RegrasCombate: rulesInContext(), estadoCombateIniciativa: { caracteristicasAtivas: [], condicoesAtivas: [] },
    confirm: () => { confirms += 1; return true; }, alert: (message) => alerts.push(message),
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function descansoLongo() {", "function verificarStatusMorte() {"), context);
  context.descansoLongo();
  assert.equal(confirms, 0);
  assert.equal(fields.pvAtual.value, "0");
  assert.equal(fields.dadosVidaRestantes.value, "1");
  assert.equal(history.length, 0);
  assert.match(alerts[0], /pelo menos 1 PV/);
});

test("E3.6: exaustão só diminui após descanso longo com confirmação de comida e bebida", () => {
  const combat = source("js/modules/combate.js");
  const fields = { dadosVidaTotal: { value: "2" }, dadosVidaRestantes: { value: "1" }, pvAtual: { value: "4" }, pvTotal: { value: "10" } };
  const condition = { id: "exaustao", tipo: "oficial", nome: "Exausto", estado: "ativa", nivelExaustao: 2 };
  const confirmations = [];
  const history = [];
  const context = {
    document: { getElementById: (id) => fields[id] || null },
    RegrasCombate: rulesInContext(), estadoCombateIniciativa: { caracteristicasAtivas: [], condicoesAtivas: [condition] },
    confirm: (message) => { confirmations.push(message); return true; },
    normalizarDadosVida() {}, normalizarPontosDeVida() {}, projetarCondicoesAtivasParaCampo() {},
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function descansoLongo() {", "function verificarStatusMorte() {"), context);
  context.descansoLongo();
  assert.equal(confirmations.length, 2);
  assert.match(confirmations[1], /comida e bebida/);
  assert.equal(condition.nivelExaustao, 1);
  assert.equal(history[0][4].consumo.nivelExaustaoReduzido, 1);
});

test("E2.1: ataques adicionais ficam limitados à mesma ação Ataque", () => {
  const rules = rulesInContext();
  const inicial = rules.criarRecursosTurno({ ataquesAcaoRestantes: 1 });
  const primeira = rules.consumirAcaoTurno(inicial, "Ação", { ataqueDeArma: true });
  const extra = rules.consumirAcaoTurno(primeira, "Ação", { ataqueDeArma: true, ataqueAdicional: true });
  assert.equal(extra.ataquesAcaoRestantes, 0);
  assert.equal(rules.consumirAcaoTurno(extra, "Ação", { ataqueDeArma: true, ataqueAdicional: true }), null);
  const acaoManual = rules.consumirAcaoTurno(inicial, "Ação");
  assert.equal(rules.consumirAcaoTurno(acaoManual, "Ação", { ataqueDeArma: true, ataqueAdicional: true }), null,
    "ação genérica não libera ataques extras");
});

test("E2.1: ataques bônus podem usar a outra mão depois de ataques qualificadores com ambas as mãos", () => {
  const rules = rulesInContext();
  const inicial = rules.criarRecursosTurno({ ataquesAcaoRestantes: 1 });
  const primeiraMao = rules.consumirAcaoTurno(inicial, "Ação", {
    ataqueQualificadorDuasArmas: true, maoAtaqueQualificador: 1, ataqueDeArma: true,
  });
  const segundaMao = rules.consumirAcaoTurno(primeiraMao, "Ação", {
    ataqueQualificadorDuasArmas: true, maoAtaqueQualificador: 2, ataqueDeArma: true, ataqueAdicional: true,
  });
  assert.deepEqual(Array.from(segundaMao.maosAtaqueQualificadoras), [1, 2]);
  const ataqueBonusMaoPrincipal = rules.consumirAcaoTurno(segundaMao, "Ação bônus", {
    ataqueQualificadorDuasArmas: true, maoAtaqueBonus: 1,
  });
  assert.equal(ataqueBonusMaoPrincipal.acaoBonusUsada, true);
  const ataqueBonusSegundaMao = rules.consumirAcaoTurno(segundaMao, "Ação bônus", {
    ataqueQualificadorDuasArmas: true, maoAtaqueBonus: 2,
  });
  assert.equal(ataqueBonusSegundaMao.acaoBonusUsada, true, "cada mão foi oposta a um ataque qualificante da ação");
  const somenteMaoDois = rules.consumirAcaoTurno(inicial, "Ação", {
    ataqueQualificadorDuasArmas: true, maoAtaqueQualificador: 2, ataqueDeArma: true,
  });
  assert.equal(rules.consumirAcaoTurno(somenteMaoDois, "Ação bônus", {
    ataqueQualificadorDuasArmas: true, maoAtaqueBonus: 2,
  }), null, "sem ataque qualificante com a mão oposta, a ação bônus fica bloqueada");
});

test("E2.1: cancelar na etapa de dano após Sucesso descarta sem gastar ação ou munição", () => {
  const rules = rulesInContext();
  const combat = source("js/modules/combate.js");
  const controles = new Map();
  const controle = (id) => {
    if (!controles.has(id)) controles.set(id, {
      value: id === "modalAtaqueDado" ? "17" : "",
      innerHTML: "",
      classList: { add() {}, remove() {} },
      setAttribute() {},
    });
    return controles.get(id);
  };
  const resources = rules.criarRecursosTurno({});
  const state = { arma: { nome: "Adaga", slot: 1 }, origem: "arma", tipoAcao: "Ação", acaoTurnoConsumida: false, modBase: 0, bonusProf: 0, danoFormula: "1d4", danoFaces: 4, danoQtd: 1 };
  const context = {
    RegrasCombate: rules,
    estadoAtaqueArma: state,
    estadoCombateIniciativa: { ativo: true, recursosTurno: resources },
    document: { getElementById: controle },
    window: {},
    obterTipoAcaoSelecionadoModalAtaque: () => state.tipoAcao,
    parArmasElegivelDuasArmas: () => false,
    ehAtaqueSecundarioComDuasArmas: () => false,
    obterDadoModalAtaque: () => 17,
    obterResolucaoManualD20Atual: (_id, _escopo, dado) => ({ modo: "normal", escolhido: dado, resultados: [dado], fontesAplicaveis: [] }),
    atualizarResumoFontesRolagem() {},
    obterSubtituloModalAtaque: () => "Ataque com Adaga",
    obterIconeAtributoAtaque: () => "",
    obterTooltipAtributoAtaque: () => "Modificador",
    obterBonusDanoEfetivoModalAtaque: () => 0,
    atualizarDetalheBonusDanoModal() {},
    atualizarDetalheDadoDanoModal() {},
    atualizarTotalModalDano() {},
    atualizarHistoricoRolagensModalDano() {},
    alternarEtapaModalAtaque() {},
    agendarFocoModalCombate() {},
    atualizarTotalModalAtaque() {},
    atualizarDetalheDadoAtaqueModal() {},
    atualizarDetalheBonusAtaqueModal() {},
    atualizarHistoricoRolagensModalAtaque() {},
    RegrasCombate: { ...rules, calcularTotalD20: () => 17 },
    consumirAcaoTurnoCombate(tipo, qualificador, mao, ataque) {
      const proximo = rules.consumirAcaoTurno(context.estadoCombateIniciativa.recursosTurno, tipo, {
        ataqueQualificadorDuasArmas: qualificador,
        maoAtaqueQualificador: mao,
        maoAtaqueBonus: state.arma?.slot,
        ataqueDeArma: ataque,
      });
      if (!proximo) return false;
      context.estadoCombateIniciativa.recursosTurno = proximo;
      return true;
    },
    consumirMunicao() { context.municaoConsumida = (context.municaoConsumida || 0) + 1; },
    adicionarRegistroHistoricoCombate(...args) { context.registroCancelamento = args; },
    alternarEtapaModalAtaque() {},
    marcarTipoAcaoModalAtaque() {},
    atualizarTotalModalAtaque() {},
    atualizarDetalheDadoAtaqueModal() {},
    atualizarDetalheBonusAtaqueModal() {},
    atualizarHistoricoRolagensModalAtaque() {},
    atualizarTotalModalDano() {},
    atualizarDetalheDadoDanoModal() {},
    atualizarDetalheBonusDanoModal() {},
    atualizarHistoricoRolagensModalDano() {},
  };
  vm.createContext(context);
  vm.runInContext(
      extractFunction(combat, "function normalizarContextoAcaoAtaque(contexto) {", "function obterMovimentoTotalTurno() {") +
      extractFunction(combat, "function obterParametrosConsumoTentativaAtaque(tipoAcao = obterTipoAcaoSelecionadoModalAtaque(), silencioso = false) {", "function fecharModalAtaqueArma()") +
      extractFunction(combat, "function fecharModalAtaqueArma() {", "\nfunction abrirModalAtaqueArma(arma, contextoAtaque = {}) {") +
      extractFunction(combat, "function abrirEtapaDanoAtaque() {", "\nfunction configurarBotaoRolarDanoModal() {") +
      "\nglobalThis.fecharModalAtaqueArma = fecharModalAtaqueArma;",
    context,
  );
  context.abrirEtapaDanoAtaque();
  assert.equal(state.dado, 17, "o resultado de Sucesso permanece disponível na prévia de dano");
  assert.equal(state.acaoTurnoConsumida, false, "Sucesso ainda não confirma o gasto");
  assert.equal(context.estadoCombateIniciativa.recursosTurno.acaoUsada, false);
  assert.equal(context.municaoConsumida, undefined);
  context.fecharModalAtaqueArma();
  assert.equal(context.estadoCombateIniciativa.recursosTurno.acaoUsada, false);
  assert.equal(context.municaoConsumida, undefined);
  assert.equal(context.registroCancelamento, undefined);
});

test("E2.1: elegibilidade de duas armas exige armas corpo a corpo leves e de uma mão", () => {
  const rules = rulesInContext();
  const leve = { modo: "corpo-a-corpo", propriedades: { leve: true } };
  const versatil = { modo: "corpo-a-corpo", propriedades: { versatil: true } };
  const duasMaos = { modo: "corpo-a-corpo", propriedades: { leve: true, duas_maos: true } };
  const distanciaLeve = { modo: "distancia", propriedades: { leve: true } };
  const naoLeve = { modo: "corpo-a-corpo", propriedades: {} };
  const lancas = { modo: "corpo-a-corpo", propriedades: { especial: true }, descricaoEspecial: "Enquanto não estiver montado, precisa empunhar a lança com as duas mãos." };

  assert.equal(rules.ehArmaElegivelDuasArmas({ armaPrincipal: leve, armaSecundaria: leve }), true);
  assert.equal(rules.ehArmaElegivelDuasArmas({ armaPrincipal: versatil, armaSecundaria: leve }), false);
  assert.equal(rules.ehArmaElegivelDuasArmas({ armaPrincipal: duasMaos, armaSecundaria: leve }), false);
  assert.equal(rules.ehArmaElegivelDuasArmas({ armaPrincipal: distanciaLeve, armaSecundaria: leve }), false);
  assert.equal(rules.ehArmaElegivelDuasArmas({ armaPrincipal: naoLeve, armaSecundaria: leve, permiteArmasNaoLeves: true }), true);
  assert.equal(rules.ehArmaElegivelDuasArmas({ armaPrincipal: duasMaos, armaSecundaria: leve, permiteArmasNaoLeves: true }), false);
  assert.equal(rules.ehArmaElegivelDuasArmas({ armaPrincipal: lancas, armaSecundaria: leve, permiteArmasNaoLeves: true }), false, "regra especial que exige duas mãos continua prevalecendo sobre o talento");
});

test("equipabilidade da offHand é independente da elegibilidade de Two-Weapon Fighting", () => {
  const rules = rulesInContext();
  const mainHand = { id: "main", modo: "corpo-a-corpo", propriedades: { leve: true } };
  const rapier = { id: "rapier", modo: "corpo-a-corpo", proficiente: false, propriedades: { finesse: true } };
  const crossbow = { id: "crossbow", modo: "distancia", propriedades: { duas_maos: true } };
  const shield = { id: "shield", escudo_nome: "Escudo", escudo_tipo: "Escudo" };
  const avaliar = (item, modo = "uma_mao") => rules.avaliarEquipamentoMaoSecundaria({
    armaPrincipal: mainHand,
    modoMaoPrincipal: modo,
    equipamentoSecundario: item ? { tipo: item === shield ? "escudo" : "arma", item } : null,
    dualWielderFeat: false,
  });

  assert.equal(avaliar(rapier).valido, true, "arma de uma mão não leve continua equipável sem o talento");
  assert.equal(rapier.proficiente, false, "a arma de teste permanece sem proficiência, que não bloqueia equipar");
  assert.equal(avaliar(rapier).valido, rules.avaliarEquipamentoMaoSecundaria({
    armaPrincipal: mainHand, equipamentoSecundario: { tipo: "arma", item: rapier },
  }).valido, "flag do talento não altera equipabilidade geral");
  assert.equal(avaliar(crossbow).valido, false, "arma que exige duas mãos não ocupa offHand");
  assert.equal(avaliar(shield).valido, true, "escudo é compatível com arma principal de uma mão");
  assert.equal(avaliar(rapier, "duas_maos").valido, false, "empunhadura principal a duas mãos bloqueia a secundária");
  assert.equal(rules.avaliarEquipamentoMaoSecundaria({ armaPrincipal: mainHand, equipamentoSecundario: null }).valido, true, "mão vazia sempre é válida");
});

test("ataque qualificante de duas armas não depende de acertar o alvo", () => {
  const rules = rulesInContext();
  const aposAtaqueQueErrou = rules.consumirAcaoTurno(rules.criarRecursosTurno(), "action", {
    ataqueQualificadorDuasArmas: true,
    maoAtaqueQualificador: 1,
    ataqueDeArma: true,
  });
  assert.equal(aposAtaqueQueErrou.ataqueDuasArmasElegivel, true, "o resultado do d20 não altera a qualificação registrada ao confirmar o ataque");
  assert.equal(rules.avaliarAtaqueBonusDuasArmas({
    recursosTurno: aposAtaqueQueErrou,
    armaPrincipal: { modo: "corpo-a-corpo", slot: 1, propriedades: { leve: true } },
    armaSecundaria: { modo: "corpo-a-corpo", slot: 2, propriedades: { leve: true } },
  }).estado, "disponivel");
});

test("estado do ataque bônus consulta recursos, sequência, escudo e elegibilidade do par", () => {
  const rules = rulesInContext();
  const dagger = { modo: "corpo-a-corpo", propriedades: { leve: true } };
  const resources = rules.consumirAcaoTurno(rules.criarRecursosTurno(), "action", {
    ataqueQualificadorDuasArmas: true, maoAtaqueQualificador: 1, ataqueDeArma: true,
  });
  const avaliar = (overrides = {}) => rules.avaliarAtaqueBonusDuasArmas({
    recursosTurno: resources,
    armaPrincipal: { ...dagger, slot: 1 },
    armaSecundaria: { ...dagger, slot: 2 },
    ...overrides,
  });
  assert.equal(avaliar().estado, "disponivel");
  assert.match(avaliar({ escudoNaSecundaria: true }).motivo, /escudo/i);
  assert.equal(avaliar({ armaSecundaria: { modo: "corpo-a-corpo", propriedades: {}, slot: 2 } }).estado, "bloqueado");
  assert.match(rules.avaliarAtaqueBonusDuasArmas({ armaPrincipal: dagger, armaSecundaria: dagger, recursosTurno: rules.criarRecursosTurno() }).motivo, /Atacar qualificante/);
  const usado = { ...resources, acaoBonusUsada: true, gastos: { ...resources.gastos, acaoBonus: 1 } };
  assert.equal(avaliar({ recursosTurno: usado }).estado, "utilizado");
});

test("E2.1: estilo de luta de duas armas restaura o modificador positivo do dano secundário", () => {
  const rules = rulesInContext();
  assert.equal(rules.calcularBonusDanoEfetivo({ modificador: 3, contextoAcao: "bonusAction", ataqueSecundarioDuasArmas: true }), 0);
  assert.equal(rules.calcularBonusDanoEfetivo({ modificador: 3, contextoAcao: "bonusAction", ataqueSecundarioDuasArmas: true, permiteModificadorPositivo: true }), 3);
  assert.equal(rules.calcularBonusDanoEfetivo({ modificador: -2, contextoAcao: "bonusAction", ataqueSecundarioDuasArmas: true, permiteModificadorPositivo: true }), -2);
  assert.equal(rules.calcularBonusDanoEfetivo({ modificador: 3, contextoAcao: "bonusAction", ataqueSecundarioDuasArmas: false }), 3, "outra ação bônus mantém seu modificador normal");
  assert.equal(rules.calcularBonusDanoEfetivo({ modificador: 3, contextoAcao: "reaction", ataqueSecundarioDuasArmas: true }), 3, "reação com arma na offHand mantém seu modificador normal");
  assert.equal(rules.consumirAcaoTurno(rules.criarRecursosTurno(), "reaction").reacaoUsada, true);
});

test("E2.1: dano da mão secundária em duas armas omite bônus positivo e mantém negativo", () => {
  const rules = rulesInContext();
  const combat = source("js/modules/combate.js");
  const equipment = { arma1Nome: { value: "0" }, arma2Nome: { value: "1" } };
  const arms = [
    { nome: "Clava", catalogoId: "club", propriedades: { leve: true } },
    { nome: "Adaga", catalogoId: "dagger", propriedades: { leve: true } },
    { nome: "Maça", catalogoId: "mace", propriedades: {} },
    { nome: "Besta Leve", catalogoId: "light-crossbow", propriedades: { leve: true, duas_maos: true } },
  ];
  const context = {
    RegrasCombate: rules,
    document: { getElementById: (id) => equipment[id] || null },
    coletarArmas: () => arms,
    estadoCatalogoArmas: { dados: { itens: [
      { id: "club", modo: "corpo-a-corpo" },
      { id: "dagger", modo: "corpo-a-corpo" },
      { id: "mace", modo: "corpo-a-corpo" },
      { id: "light-crossbow", modo: "distancia" },
    ] } },
    talentosEstruturados: { classe: [], outros: [] },
    estadoAtaqueArma: {
      arma: { slot: 2 },
      origem: "arma",
      tipoAcao: "Ação bônus",
      danoModBase: -2,
    },
    estadoCombateIniciativa: { ativo: true, recursosTurno: rules.criarRecursosTurno({}) },
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(combat, "function normalizarContextoAcaoAtaque(contexto) {", "function obterMovimentoTotalTurno() {") + extractFunction(
      combat,
      "function obterArmaSelecionadaParaDuasArmas(slot)",
      "\nfunction obterBonusDanoEfetivoModalAtaque",
    ) + extractFunction(
      combat,
      "function obterBonusDanoEfetivoModalAtaque()",
      "\nfunction atualizarDetalheBonusDanoModal",
    ) + "\nglobalThis.obterBonusDanoEfetivoModalAtaque = obterBonusDanoEfetivoModalAtaque;",
    context,
  );

  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), -2);
  context.estadoAtaqueArma.danoModBase = 3;
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), 0);
  equipment.arma1Nome.value = "";
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), 3, "sem par elegível, a ação bônus mantém o modificador normal");
  equipment.arma1Nome.value = "0";
  equipment.arma2Nome.value = "__escudo__1";
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), 3, "escudo impede TWF, sem retirar o bônus de um ataque bônus comum");
  equipment.arma2Nome.value = "2";
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), 3, "armas não leves sem talento preservam o bônus fora de TWF");
  equipment.arma2Nome.value = "3";
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), 3, "arma incompatível com TWF não altera o dano de outro ataque bônus");
  context.talentosEstruturados.outros.push({ nome: "Ambidestro" });
  equipment.arma2Nome.value = "2";
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), 0, "talento Ambidestro permite a exceção de elegibilidade, sem estilo não soma modificador positivo");
  context.talentosEstruturados.classe.push({ nome: "Ataque com Duas Armas" });
  context.estadoAtaqueArma.danoModBase = 3;
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), 3, "estilo de luta permite somar modificador positivo quando o ataque é elegível");
  context.estadoAtaqueArma.danoModBase = -2;
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), -2, "estilo de luta também preserva o modificador negativo");
  context.talentosEstruturados.outros.length = 0;
  context.talentosEstruturados.classe.length = 0;
  equipment.arma2Nome.value = "1";
  context.estadoAtaqueArma.arma.slot = 1;
  context.estadoAtaqueArma.danoModBase = -2;
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), -2, "mantém modificador negativo no ataque bônus");
  context.estadoCombateIniciativa.recursosTurno = { ...rules.criarRecursosTurno({}), acaoUsada: true, ataqueAcaoIniciado: true, ataqueDuasArmasElegivel: true, maoAtaqueQualificador: 2 };
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), -2, "a mão principal passa a ser a mão oposta quando a ação Ataque qualificadora ocorreu na secundária");
  context.estadoAtaqueArma.arma.slot = 2;
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), -2, "a mão que fez o ataque qualificante mantém o modificador negativo");
  context.estadoAtaqueArma.tipoAcao = "Ação";
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), -2);
  context.estadoAtaqueArma.origem = "magia";
  context.estadoAtaqueArma.danoModBase = 4;
  assert.equal(context.obterBonusDanoEfetivoModalAtaque(), 4);
});

test("resumo equipado preserva Acuidade da arma", () => {
  const armas = source("js/modules/combate-armas.js");
  const adaga = {
    nome: "Adaga",
    dano: "1d4",
    arma_tipo_dano: "Perfurante",
    proficiente: true,
    propriedades: { acuidade: true, municao: false },
  };
  const nodes = {
    arma1Nome: { value: "0" },
    arma2Nome: { value: "" },
  };
  const context = {
    coletarArmas: () => [adaga],
    extrairIndiceSlotEscudo: () => null,
    obterAtributoAtaqueSelecionado: () => "des",
    obterTextoDanoArmaPorEmpunhadura: () => "1d4 Perfurante",
    montarTextoPropriedadeArma: () => "Acuidade",
    resumirMunicaoNoTexto: (texto) => texto,
    obterResumoPropriedadesArma: () => "Acuidade",
    document: {
      getElementById: (id) => nodes[id] || null,
      querySelectorAll: () => [{ dataset: { catalogoArmaId: "dagger" } }],
    },
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      armas,
      "function obterArmasEquipadasAtivas()",
      "\nfunction atualizarSelectAtaqueArma",
    ),
    context,
  );

  const equipadas = context.obterArmasEquipadasAtivas();
  assert.equal(equipadas.length, 1);
  assert.equal(equipadas[0].chaveAtributo, "des");
  assert.equal(equipadas[0].propriedades.acuidade, true);
  assert.equal(equipadas[0].bruto, adaga);
});

test("Acuidade permite escolher FOR/DES e usa o maior como padrão com desempate em FOR", () => {
  const armas = source("js/modules/combate-armas.js");
  const context = {
    getModificadorBaseAtributo: (atributo) => (atributo === "des" ? 4 : 1),
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      armas,
      "function obterMaiorAtributoAtaque()",
      "\nfunction normalizarArma",
    ),
    context,
  );

  assert.equal(context.obterMaiorAtributoAtaque(), "des");
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        context.obterConfiguracaoAtributoAtaqueArma({
          propriedades: { acuidade: true, municao: true },
        }),
      ),
    ),
    { valorPadrao: "des", podeEscolher: true },
  );

  context.getModificadorBaseAtributo = (atributo) =>
    atributo === "for" ? 3 : 3;
  assert.equal(context.obterMaiorAtributoAtaque(), "for");
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        context.obterConfiguracaoAtributoAtaqueArma({
          propriedades: { acuidade: true, municao: true },
        }),
      ),
    ),
    { valorPadrao: "for", podeEscolher: true },
  );

  context.getModificadorBaseAtributo = () => 0;
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        context.obterConfiguracaoAtributoAtaqueArma({
          propriedades: { municao: true },
        }),
      ),
    ),
    { valorPadrao: "des", podeEscolher: false },
  );
});

test("E2.1: adaptador real de salvaguarda usa a regra pura para total d20", () => {
  const combat = source("js/modules/combate.js");
  const rules = rulesInContext();
  const context = {
    RegrasCombate: rules,
    obterDadoTesteResistencia: () => 14,
    obterBonusTesteResistencia: (atributo) => (atributo === "con" ? -2 : 0),
    estadoTesteResistencia: { atributo: "con" },
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      combat,
      "function obterTotalTesteResistencia()",
      "\nfunction atualizarBotaoConfirmarTesteResistencia",
    ),
    context,
  );
  assert.equal(context.obterTotalTesteResistencia(), 12);
});

test("Ações rápidas passam pelo consumidor do turno e recusam mutação durante importação", () => {
  const combat = source("js/modules/combate.js");
  const consumidas = [];
  const context = {
    window: { __fichaImportacaoTransacaoAtiva: false },
    consumirAcaoTurnoCombate(tipo) { consumidas.push(tipo); return tipo === "Ação"; },
  };
  vm.runInNewContext(extractFunction(combat, "function consumirAcaoManualTurno(tipoAcao) {", "function abrirEditorRecursosTurno() {"), context);
  assert.equal(context.consumirAcaoManualTurno("Ação"), true);
  assert.equal(context.consumirAcaoManualTurno("Ação bônus"), false);
  context.window.__fichaImportacaoTransacaoAtiva = true;
  assert.equal(context.consumirAcaoManualTurno("Ação"), false);
  assert.deepEqual(consumidas, ["Ação", "Ação bônus"]);
});

test("E2.1: consumidor de ação não altera saldos fora de combate ativo", () => {
  const combat = source("js/modules/combate.js");
  const rules = rulesInContext();
  const recursos = rules.criarRecursosTurno({ rodada: 1 });
  const context = {
    estadoCombateIniciativa: { ativo: false, recursosTurno: recursos },
    estadoAtaqueArma: {},
    RegrasCombate: rules,
    document: { getElementById: () => null },
    atualizarInterfaceRecursosTurno() {},
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function consumirAcaoTurnoCombate(tipoAcao,", "function consumirAcaoManualTurno(tipoAcao) {"), context);

  assert.equal(context.consumirAcaoTurnoCombate("Ação"), true);
  assert.strictEqual(context.estadoCombateIniciativa.recursosTurno, recursos);
  assert.equal(recursos.acaoUsada, false);

  context.estadoCombateIniciativa.ativo = true;
  assert.equal(context.consumirAcaoTurnoCombate("Ação"), true);
  assert.equal(context.estadoCombateIniciativa.recursosTurno.acaoUsada, true);
  assert.equal(recursos.acaoUsada, false, "o consumidor usa estado imutável e o substitui ao gastar");
});

test("E2.5: confirmações de ataque e salvaguarda não mutam durante transação de importação", () => {
  const combat = source("js/modules/combate.js");
  for (const signature of [
    "function confirmarTesteResistencia() {",
    "function abrirEtapaDanoAtaque() {",
    "function confirmarFracassoAtaque() {",
    "function confirmarDanoAtaque() {",
  ]) {
    const inicio = combat.indexOf(signature);
    const guarda = combat.indexOf("window.__fichaImportacaoTransacaoAtiva) return;", inicio);
    const primeiraMutacao = combat.indexOf("registrarHistoricoAtaqueArma(", inicio);
    assert.ok(inicio >= 0 && guarda > inicio, `${signature} bloqueia a transação de importação`);
    if (primeiraMutacao > inicio) assert.ok(guarda < primeiraMutacao, `${signature} valida antes de mutar`);
  }
});

test("E2.5: snapshot persistente de combate inclui fontes e não compartilha referências", () => {
  const combat = source("js/modules/combate.js");
  const fonte = { id: "cegueira", escopo: "ataque", origem: "condicao", duracao: "persistente", tipo: "desvantagem", motivo: "Atacante cego" };
  const recursosTurno = { rodada: 1, acaoUsada: true, acaoBonusUsada: false, reacaoUsada: true, movimentoTotal: 30, movimentoGasto: 10, ataqueDuasArmasElegivel: false, maoAtaqueQualificador: null, ataqueAcaoIniciado: true, ataquesAcaoRestantes: 1 };
  const context = { estadoCombateIniciativa: { ativo: false, rodada: 0, posicao: null, iniciativa: null, fontesVantagemDesvantagem: [fonte], recursosTurno } };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, "function obterEstadoCombateParaSalvar() {", "const ATRIBUTOS_TESTE_RESISTENCIA"), context);
  const snapshot = context.obterEstadoCombateParaSalvar();
  assert.deepEqual(JSON.parse(JSON.stringify(snapshot.fontesVantagemDesvantagem)), [fonte]);
  assert.deepEqual(JSON.parse(JSON.stringify(snapshot.recursosTurno)), recursosTurno);
  snapshot.recursosTurno.movimentoGasto = 29;
  assert.equal(context.estadoCombateIniciativa.recursosTurno.movimentoGasto, 10);
  snapshot.fontesVantagemDesvantagem[0].motivo = "alterado no snapshot";
  assert.equal(context.estadoCombateIniciativa.fontesVantagemDesvantagem[0].motivo, "Atacante cego");
});

test("E2.6: bônus de perícia inclui expertise e bônus situacional negativo sem gravá-lo no atributo", () => {
  const magicSource = source("js/modules/magias.js");
  const context = {};
  vm.createContext(context);
  vm.runInContext(extractFunction(magicSource, "function getMultiplicadorProficiencia(estado) {", "function sincronizarControlesPericia"), context);
  vm.runInContext(extractFunction(magicSource, "function calcularBonusPorEstado(bonusProf, estado) {", "function sincronizarControlesPericia"), context);
  assert.equal(context.calcularBonusPorEstado(2, 3), 4, "expertise duplica o bônus de proficiência em 2014");
  assert.equal(rulesInContext().calcularTotalD20(5, [Math.floor((8 - 10) / 2) + 4 - 5]), 3);
});

test("E2.2: cálculo isolado consome PV temporários antes do PV regular", () => {
  const resolve = rulesInContext().calcularPVDepoisDeDano;
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(resolve({ pvAtuais: 10, pvTemporarios: 5, dano: 3 })),
    ),
    {
      pvAtuais: 10,
      pvTemporarios: 2,
      danoEmTemporarios: 3,
      danoEmPV: 0,
      danoExcedente: 0,
    },
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(resolve({ pvAtuais: 10, pvTemporarios: 5, dano: 8 })),
    ),
    {
      pvAtuais: 7,
      pvTemporarios: 0,
      danoEmTemporarios: 5,
      danoEmPV: 3,
      danoExcedente: 0,
    },
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(resolve({ pvAtuais: 0, pvTemporarios: 0, dano: 4 })),
    ),
    {
      pvAtuais: 0,
      pvTemporarios: 0,
      danoEmTemporarios: 0,
      danoEmPV: 0,
      danoExcedente: 4,
    },
  );
  assert.equal(resolve({ pvAtuais: -1, pvTemporarios: 0, dano: 2 }), null);
});

test("E2.2: cura pura não ultrapassa o máximo regular", () => {
  const rules = rulesInContext();
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        rules.calcularPVDepoisDeCura({
          pvAtuais: 8,
          pvMaximos: 10,
          cura: 5,
        }),
      ),
    ),
    { pvAtuais: 10, curaAplicada: 2 },
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        rules.calcularPVDepoisDeCura({
          pvAtuais: 10,
          pvMaximos: 10,
          cura: 3,
        }),
      ),
    ),
    { pvAtuais: 10, curaAplicada: 0 },
  );
});

test("E2.2 integra dano e cura sem restaurar PV temporários", () => {
  const combat = source("js/modules/combate.js");
  const events = source("js/core/events.js");
  const fields = {
    pvAtual: { value: "10" },
    pvTotal: { value: "10" },
    pvTemporario: { value: "5" },
  };
  const history = [];
  const concentrationChecks = [];
  const context = {
    document: {
      getElementById(id) { return fields[id] || null; },
      querySelectorAll() { return []; },
    },
    prompt() { return null; },
    registrarHistoricoComandoCombate(tipo, valor) { history.push([tipo, valor]); },
    atualizarResumoAtaquesConjuracao() {},
    verificarStatusMorte() {},
    abrirTesteConcentracaoPorDano(valor) { concentrationChecks.push(valor); },
  };
  vm.runInNewContext(
    [
      source("js/domain/regras-combate.js"),
      extractFunction(events, "function formatarPvTemporario() {", "function atualizarCoracoesVida()"),
      extractFunction(events, "function atualizarCoracoesVida() {", "function normalizarPontosDeVida() {"),
      extractFunction(events, "function normalizarPontosDeVida() {", "function normalizarDadosVida() {"),
      extractFunction(combat, "function aplicarDanoNoPV(valorInformado = null) {", "function curarPV("),
      extractFunction(combat, "function curarPV(valorInformado = null) {", "function abrirModalVida("),
      "globalThis.aplicarDanoNoPV = aplicarDanoNoPV; globalThis.curarPV = curarPV;",
    ].join("\n"),
    context,
  );

  context.aplicarDanoNoPV(3);
  assert.equal(Number(fields.pvAtual.value), 10);
  assert.equal(Number(fields.pvTemporario.value), 2);
  context.curarPV(2);
  assert.equal(Number(fields.pvAtual.value), 10);
  assert.equal(Number(fields.pvTemporario.value), 2, "cura não recupera temporários consumidos");

  context.aplicarDanoNoPV(4);
  assert.equal(Number(fields.pvAtual.value), 8);
  assert.equal(Number(fields.pvTemporario.value), 0);
  context.curarPV(4);
  assert.equal(Number(fields.pvAtual.value), 10);
  assert.equal(Number(fields.pvTemporario.value), 0);
  assert.deepEqual(history, [["Dano", 3], ["Cura", 2], ["Dano", 4], ["Cura", 4]]);
  assert.deepEqual(concentrationChecks, [3, 4]);
});

test("E2.3: dano tipado aplica imunidade, resistência, vulnerabilidade e cancelamento", () => {
  const resolve = rulesInContext().resolverDanoTipado;
  assert.equal(
    resolve({
      quantidade: 9,
      tipo: "fogo",
      origem: "Sopro",
      resistencias: ["Fogo"],
    }).final,
    4,
  );
  assert.equal(
    resolve({
      quantidade: 9,
      tipo: "frio",
      origem: "Arma",
      vulnerabilidades: ["frio"],
    }).final,
    18,
  );
  assert.equal(
    resolve({
      quantidade: 9,
      tipo: "ácido",
      origem: "Magia",
      resistencias: ["ácido"],
      vulnerabilidades: ["ácido"],
    }).final,
    9,
  );
  assert.equal(
    resolve({ quantidade: 9, tipo: "ácido", origem: "Magia", resistencias: ["ácido"], vulnerabilidades: ["ácido"] }).cancelado,
    true,
  );
  assert.equal(
    resolve({
      quantidade: 9,
      tipo: "necrótico",
      origem: "Efeito",
      imunidades: ["necrótico"],
      vulnerabilidades: ["necrótico"],
    }).final,
    0,
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        resolve({ quantidade: 5, tipo: "fogo", origem: "Bola de Fogo" }),
      ),
    ),
    {
      bruto: 5,
      tipo: "fogo",
      origem: "Bola de Fogo",
      resistido: false,
      vulneravel: false,
      imune: false,
      cancelado: false,
      final: 5,
    },
  );
  assert.equal(
    resolve({ quantidade: -1, tipo: "fogo", origem: "Teste" }),
    null,
  );
  assert.equal(
    resolve({ quantidade: 5, tipo: "Ácido", origem: "Arma", resistencias: ["acido"] }).final,
    2,
    "nomes de tipo com e sem acento devem corresponder",
  );
  assert.equal(
    resolve({ quantidade: 5, tipo: "energia", origem: "Magia", imunidades: ["Energia (Force)"] }).final,
    0,
    "o alias de energia do catálogo de armas deve continuar compatível",
  );
  assert.equal(
    resolve({ quantidade: 5, tipo: "congelante", origem: "Arma", resistencias: ["frio"] }).final,
    2,
    "o alias legado do catálogo deve corresponder ao tipo oficial Frio",
  );
  assert.equal(resolve({ quantidade: 1, tipo: "fogo" }), null);
});

test("E2.3: ataques registram dano tipado sem modificadores manuais do alvo", () => {
  const combat = source("js/modules/combate.js");
  const createContext = ({ tipo = "fogo", dano = "9", bonus = 0, arma = null } = {}) => {
    const fields = {
      modalAtaqueDano: { value: dano, focus() {} },
      pvAtual: { value: "17" },
      pvTemporario: { value: "4" },
    };
    let registro;
    let eventoDano;
    const regras = rulesInContext();
    const context = {
      document: { getElementById(id) { return fields[id] || null; } },
      window: {},
      estadoAtaqueArma: { arma: arma || { nome: "Espada", arma_tipo_dano: tipo }, danoTipo: tipo },
      RegrasCombate: {
        ...regras,
        resolverDanoTipado(evento) {
          eventoDano = evento;
          return regras.resolverDanoTipado(evento);
        },
      },
      obterBonusDanoEfetivoModalAtaque() { return bonus; },
      registrarHistoricoAtaqueArma(_sucesso, dano, resolucao) { registro = { dano, resolucao }; },
      fecharModalAtaqueArma() {},
    };
    vm.createContext(context);
    vm.runInContext(
      extractFunction(combat, "function obterTipoDanoAtaque(arma) {", "function fecharModalAtaqueArma()") +
      extractFunction(combat, "function confirmarDanoAtaque() {", "function registrarHistoricoComandoCombate("),
      context,
    );
    context.confirmarDanoAtaque();
    return { registro, fields, eventoDano };
  };

  const tipado = createContext();
  assert.equal(tipado.registro.dano, 9);
  assert.equal(tipado.registro.resolucao.bruto, 9);
  assert.equal(tipado.registro.resolucao.final, 9);
  assert.equal(tipado.eventoDano.tipo, "fogo");
  assert.equal("resistencias" in tipado.eventoDano, false);
  assert.equal("vulnerabilidades" in tipado.eventoDano, false);
  assert.equal("imunidades" in tipado.eventoDano, false);
  assert.equal(tipado.fields.pvAtual.value, "17");
  assert.equal(tipado.fields.pvTemporario.value, "4");

  assert.equal(createContext({ tipo: "" }).registro.dano, 9, "ataques sem tipo mantêm o dano legado");
  const magia = createContext({ arma: { nome: "Raio de Fogo", danoTipo: "fogo" }, tipo: "" });
  assert.equal(magia.registro.dano, 9, "magias preservam danoTipo camelCase");
  const modificadorNegativo = createContext({ dano: "1", bonus: -3 });
  assert.equal(modificadorNegativo.registro.dano, 0, "dano não pode ficar negativo");
  assert.equal(modificadorNegativo.registro.resolucao.bruto, 0);
});

test("E2.3: timeline mostra ajustes reais e omite detalhe defensivo quando não há ajuste", () => {
  const combat = source("js/modules/combate.js");
  const context = {
    document: {
      createElement() {
        return { className: "", classList: { add() {} }, dataset: {}, innerHTML: "" };
      },
    },
    escaparHtmlHistorico(value) { return String(value); },
    normalizarTipoAcaoHistorico() { return { classe: "", texto: "Ação" }; },
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(combat, "function montarRegistroTimelineHistorico(dados) {", "function adicionarRegistroHistoricoCombate("),
    context,
  );
  const html = context.montarRegistroTimelineHistorico({
    titulo: "Ataque",
    nome: "Espada",
    dano: 0,
    danoTipo: "fogo",
    danoBruto: 9,
    ajusteDano: "imunidade aplicada",
  }).innerHTML;
  assert.match(html, /💥0 fogo \(9 bruto; imunidade aplicada\)/);
  const semAjuste = context.montarRegistroTimelineHistorico({
    titulo: "Ataque",
    nome: "Maça",
    dano: 3,
    danoTipo: "concussão",
    danoBruto: 3,
    ajusteDano: "sem ajuste defensivo",
  }).innerHTML;
  assert.match(semAjuste, /💥3 concussão/);
  assert.doesNotMatch(semAjuste, /bruto|ajuste defensivo/);
});

test("E2.3: dano tipado integra PV e concentração pelo valor final e registra a resolução", () => {
  const combat = source("js/modules/combate.js");
  const fields = {
    pvAtual: { value: "20" },
    pvTotal: { value: "20" },
    pvTemporario: { value: "2" },
  };
  const history = [];
  const concentrationChecks = [];
  const context = {
    document: { getElementById(id) { return fields[id] || null; } },
    RegrasCombate: rulesInContext(),
    registrarHistoricoComandoCombate(...args) { history.push(args); },
    adicionarRegistroHistoricoCombate(...args) { history.push(args); },
    normalizarPontosDeVida() {},
    abrirTesteConcentracaoPorDano(dano) { concentrationChecks.push(dano); },
  };
  vm.runInNewContext(
    extractFunction(combat, "function aplicarDanoNoPV(valorInformado = null) {", "function curarPV("),
    context,
  );
  context.aplicarDanoNoPV({
    quantidade: 7,
    tipo: "fogo",
    origem: "Armadilha",
    resistencias: ["fogo"],
  });

  assert.equal(fields.pvTemporario.value, "0");
  assert.equal(fields.pvAtual.value, "19", "7 de fogo resistido causam 3 finais, após os 2 PV temporários");
  assert.deepEqual(concentrationChecks, [3], "a CD usa o dano efetivamente sofrido");
  const historicoTipado = history.find((args) => args[0] === "Dano");
  assert.ok(historicoTipado, "a resolução registra dano no histórico");
  const texto = historicoTipado[4].timeline.texto.toLocaleLowerCase();
  assert.match(texto, /7.*bruto|bruto.*7/);
  assert.match(texto, /fogo/);
  assert.match(texto, /resist/);
  assert.match(texto, /3/);
  assert.match(texto, /armadilha/);

  context.aplicarDanoNoPV({
    quantidade: 5,
    tipo: "veneno",
    origem: "Toxina",
    imunidades: ["veneno"],
  });
  assert.equal(fields.pvAtual.value, "19", "imunidade não reduz PV");
  assert.deepEqual(concentrationChecks, [3], "dano final zero não abre concentração");
});

test("E2.3: modal monta evento tipado sem persistir suas entradas temporárias", () => {
  const combat = source("js/modules/combate.js");
  const html = source("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  assert.match(html, /<option value="frio">Frio<\/option>/);
  const fields = {
    modalVidaInput: { value: "7", focus() {} },
    modalVidaConfirmar: { dataset: { tipo: "dano" } },
    modalDanoTipo: { value: "fogo" },
    modalDanoOrigem: { value: "Armadilha de fogo" },
    modalDanoResistencias: { value: "fogo, ácido" },
    modalDanoVulnerabilidades: { value: "" },
    modalDanoImunidades: { value: "veneno" },
  };
  let eventoCapturado = null;
  const context = {
    document: { getElementById(id) { return fields[id] || null; } },
    aplicarDanoNoPV(evento) { eventoCapturado = evento; },
    fecharModalVida() {},
  };
  vm.runInNewContext(
    extractFunction(combat, "function confirmarModalVida() {", "window.aplicarDanoNoPV"),
    context,
  );
  context.confirmarModalVida();

  assert.deepEqual(JSON.parse(JSON.stringify(eventoCapturado)), {
    quantidade: 7,
    tipo: "fogo",
    origem: "Armadilha de fogo",
    resistencias: ["fogo", "ácido"],
    vulnerabilidades: [],
    imunidades: ["veneno"],
  });
});

test("E2.4: fechar ou pressionar Escape não descarta salvaguarda pendente", () => {
  const combat = source("js/modules/combate.js");
  const skills = source("js/modules/habilidades.js");
  const classes = new Set(["ativo"]);
  let focusCount = 0;
  const nodes = {
    modalTesteResistenciaOverlay: {
      classList: {
        contains: (name) => classes.has(name),
        remove: (name) => classes.delete(name),
        add: (name) => classes.add(name),
      },
      setAttribute() {},
    },
    modalTesteResistenciaDado: {
      focus() {
        focusCount += 1;
      },
    },
    modalTesteResistenciaAbandonar: {
      hidden: false,
      classList: { add() {} },
    },
    modalTesteResistenciaCancelar: { textContent: "Voltar ao teste" },
    modalTesteResistenciaTitulo: { textContent: "Concentração" },
  };
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol("internal-resolution"),
    document: { getElementById: (id) => nodes[id] || null },
    estadoTesteResistencia: {
      contextoConcentracao: { chave: "spell-1", magia: {} },
    },
    fecharModalTesteResistencia: undefined,
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      combat,
      "function fecharModalTesteResistencia(",
      "\nfunction abandonarConcentracaoPendente",
    ),
    context,
  );
  vm.runInContext(
    extractFunction(
      skills,
      "function tratarEscapeTesteResistencia(",
      '\n\ndocument\n  .getElementById("modalAtaqueSucesso")',
    ),
    context,
  );
  assert.equal(context.fecharModalTesteResistencia(), false);
  assert.equal(context.tratarEscapeTesteResistencia(), true);
  assert.ok(classes.has("ativo"));
  assert.equal(
    context.estadoTesteResistencia.contextoConcentracao.chave,
    "spell-1",
  );
  assert.equal(focusCount, 2);
});

test("E2.4: flag pública resolvido não contorna a proteção do modal", () => {
  const combat = source("js/modules/combate.js");
  let focusCount = 0;
  const classes = new Set(["ativo"]);
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol("private-test-token"),
    estadoTesteResistencia: {
      contextoConcentracao: { chave: "spell-1", instanciaId: 1 },
      filaConcentracao: [],
    },
    document: {
      getElementById: (id) =>
        id === "modalTesteResistenciaOverlay"
          ? {
              classList: {
                remove: (name) => classes.delete(name),
                add: (name) => classes.add(name),
              },
              setAttribute() {},
            }
          : {
              focus() {
                focusCount += 1;
              },
            },
    },
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      combat,
      "function fecharModalTesteResistencia(",
      "\nfunction abandonarConcentracaoPendente",
    ),
    context,
  );
  assert.equal(context.fecharModalTesteResistencia({ resolvido: true }), false);
  assert.ok(classes.has("ativo"));
  assert.equal(
    context.estadoTesteResistencia.contextoConcentracao.chave,
    "spell-1",
  );
  assert.equal(focusCount, 1);
});

test("E2.4: abandono é explícito, registrado e encerra a concentração associada", () => {
  const combat = source("js/modules/combate.js");
  const classes = new Set(["ativo"]);
  const nodes = {
    modalTesteResistenciaOverlay: {
      classList: {
        remove: (n) => classes.delete(n),
        add: (n) => classes.add(n),
      },
      setAttribute() {},
    },
    modalTesteResistenciaAbandonar: { hidden: false, classList: { add() {} } },
    modalTesteResistenciaCancelar: { textContent: "Voltar ao teste" },
    modalTesteResistenciaTitulo: {
      textContent: "Teste para manter concentração",
    },
  };
  const history = [];
  const ended = [];
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol("internal-resolution"),
    document: { getElementById: (id) => nodes[id] || null },
    estadoTesteResistencia: {
      contextoConcentracao: {
        chave: "spell-1",
        instanciaId: 1,
        magia: { nome: "Escudo da Fé" },
      },
      filaConcentracao: [],
    },
    concentracaoAtiva: { chave: "spell-1", instanciaId: 1 },
    obterNomeConcentracao: () => "Escudo da Fé",
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
    encerrarConcentracao: (...args) => ended.push(args),
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      combat,
      "function fecharModalTesteResistencia(",
      "\nfunction abandonarConcentracaoPendente",
    ),
    context,
  );
  vm.runInContext(
    extractFunction(
      combat,
      "function abandonarConcentracaoPendente(",
      "\nfunction confirmarTesteResistencia",
    ),
    context,
  );
  context.abandonarConcentracaoPendente();
  assert.equal(history.length, 1);
  assert.match(history[0][1], /abandonada voluntariamente/);
  assert.deepEqual(JSON.parse(JSON.stringify(ended[0])), [
    "abandonada",
    { registrarHistorico: false },
  ]);
  assert.ok(classes.has("oculto"));
  assert.equal(context.estadoTesteResistencia.contextoConcentracao, null);
});

test("E2.4: confirmação de teste obsoleto não altera a concentração mais nova", () => {
  const combat = source("js/modules/combate.js");
  const history = [];
  let closeCount = 0;
  let refreshCount = 0;
  let endCount = 0;
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol("internal-resolution"),
    RegrasCombate: rulesInContext(),
    estadoTesteResistencia: {
      atributo: "con",
      contextoConcentracao: {
        chave: "spell-old",
        instanciaId: 1,
        cd: 10,
        magia: { nome: "Magia A" },
      },
      filaConcentracao: [],
    },
    concentracaoAtiva: {
      chave: "spell-new",
      instanciaId: 2,
      magia: { nome: "Magia B" },
    },
    obterDadoTesteResistencia: () => 20,
    obterRotuloAtributoTesteResistencia: () => "CON",
    obterBonusTesteResistencia: () => 0,
    obterResolucaoManualD20Atual: (_prefixo, _escopo, dado) => ({ modo: "normal", escolhido: dado, resultados: [dado], fontesAplicaveis: [] }),
    atualizarResumoFontesRolagem() {},
    obterNomeConcentracao: (magic) => magic.nome,
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
    atualizarSubAbaMagiasCombate: () => {
      refreshCount += 1;
    },
    encerrarConcentracao: () => {
      endCount += 1;
    },
    fecharModalTesteResistencia: () => {
      closeCount += 1;
    },
    ultimoResultadoConcentracao: "anterior",
    document: { getElementById: () => ({ focus() {} }) },
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      combat,
      "function avancarTesteConcentracaoNaFila()",
      "\nfunction confirmarTesteResistencia",
    ),
    context,
  );
  vm.runInContext(
    extractFunction(
      combat,
      "function confirmarTesteResistencia()",
      "\nfunction abrirItemCard",
    ),
    context,
  );
  context.confirmarTesteResistencia();
  assert.equal(history.length, 1);
  assert.match(history[0][1], /teste pendente descartado/);
  assert.equal(context.ultimoResultadoConcentracao, "anterior");
  assert.equal(refreshCount, 0);
  assert.equal(endCount, 0);
  assert.equal(closeCount, 1);
});

test("E2.4: salvaguarda antiga não afeta nova ativação da mesma magia", () => {
  const combat = source("js/modules/combate.js");
  const history = [];
  let closeCount = 0;
  let endCount = 0;
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol("internal-resolution"),
    RegrasCombate: rulesInContext(),
    estadoTesteResistencia: {
      atributo: "con",
      contextoConcentracao: {
        chave: "2::escudo da fé",
        instanciaId: 10,
        cd: 10,
        magia: { nome: "Escudo da Fé", nivel: 2 },
      },
      filaConcentracao: [],
    },
    concentracaoAtiva: {
      chave: "2::escudo da fé",
      instanciaId: 11,
      magia: { nome: "Escudo da Fé", nivel: 2 },
    },
    obterDadoTesteResistencia: () => 20,
    obterRotuloAtributoTesteResistencia: () => "CON",
    obterBonusTesteResistencia: () => 0,
    obterResolucaoManualD20Atual: (_prefixo, _escopo, dado) => ({ modo: "normal", escolhido: dado, resultados: [dado], fontesAplicaveis: [] }),
    atualizarResumoFontesRolagem() {},
    obterNomeConcentracao: (magic) => magic.nome,
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
    atualizarSubAbaMagiasCombate: () =>
      assert.fail("resultado obsoleto não atualiza a magia"),
    encerrarConcentracao: () => {
      endCount += 1;
    },
    fecharModalTesteResistencia: () => {
      closeCount += 1;
    },
    document: { getElementById: () => ({ focus() {} }) },
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      combat,
      "function avancarTesteConcentracaoNaFila()",
      "\nfunction confirmarTesteResistencia",
    ),
    context,
  );
  vm.runInContext(
    extractFunction(
      combat,
      "function confirmarTesteResistencia()",
      "\nfunction abrirItemCard",
    ),
    context,
  );
  context.confirmarTesteResistencia();
  assert.equal(history.length, 1);
  assert.match(history[0][1], /teste pendente descartado/);
  assert.equal(endCount, 0);
  assert.equal(closeCount, 1);
});

test("E2.4: abandono antigo não encerra nova ativação da mesma magia", () => {
  const combat = source("js/modules/combate.js");
  let endCount = 0;
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol("internal-resolution"),
    document: { getElementById: () => null },
    estadoTesteResistencia: {
      contextoConcentracao: {
        chave: "1::nevoa",
        instanciaId: 20,
        magia: { nome: "Névoa", nivel: 1 },
      },
      filaConcentracao: [],
    },
    concentracaoAtiva: {
      chave: "1::nevoa",
      instanciaId: 21,
      magia: { nome: "Névoa", nivel: 1 },
    },
    obterNomeConcentracao: (magic) => magic.nome,
    adicionarRegistroHistoricoCombate() {},
    encerrarConcentracao: () => {
      endCount += 1;
    },
    avancarTesteConcentracaoNaFila: () => false,
    fecharModalTesteResistencia: () => {},
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      combat,
      "function abandonarConcentracaoPendente(",
      "\nfunction confirmarTesteResistencia",
    ),
    context,
  );
  context.abandonarConcentracaoPendente();
  assert.equal(endCount, 0);
});

test("E2.4: cada conjuração captura uma identidade efêmera distinta no contexto", () => {
  const spells = source("js/modules/magias.js");
  const combat = source("js/modules/combate.js");
  const opened = [];
  const context = {
    concentracaoAtiva: null,
    sequenciaInstanciaConcentracao: 0,
    criarIdInstanciaAtiva: (() => { let id = 0; return (prefixo) => `${prefixo}-${++id}`; })(),
    ultimoResultadoConcentracao: null,
    magiaExigeConcentracao: (spell) => !!spell.propriedades?.concentracao,
    obterChaveConcentracaoMagia: (spell) =>
      `${spell.nivel}::${spell.nome.toLowerCase()}`,
    removerEfeitosDaConcentracao() {},
    sincronizarCondicaoConcentracao() {},
    atualizarSubAbaMagiasCombate() {},
    abrirModalTesteResistencia: (options) => opened.push(options),
    obterNomeConcentracao: (spell = context.concentracaoAtiva?.magia) =>
      spell.nome,
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      spells,
      "function iniciarConcentracaoMagia(",
      "\nfunction encerrarConcentracao",
    ),
    context,
  );
  vm.runInContext(
    extractFunction(
      spells,
      "function abrirTesteConcentracaoPorDano(",
      "\nfunction renderizarTodasMagias",
    ),
    context,
  );
  const spell = {
    nome: "Escudo da Fé",
    nivel: 2,
    propriedades: { concentracao: true },
  };
  context.iniciarConcentracaoMagia(spell, 2);
  const idAntigo = context.concentracaoAtiva.instanciaId;
  context.abrirTesteConcentracaoPorDano(20);
  context.iniciarConcentracaoMagia(spell, 2);
  const idNovo = context.concentracaoAtiva.instanciaId;
  context.abrirTesteConcentracaoPorDano(24);

  assert.notEqual(idNovo, idAntigo);
  assert.equal(
    opened[0].contextoConcentracao.chave,
    opened[1].contextoConcentracao.chave,
  );
  assert.equal(opened[0].contextoConcentracao.instanciaId, idAntigo);
  assert.equal(opened[1].contextoConcentracao.instanciaId, idNovo);
});

test("E2.4: cada fonte de dano enfileirada mantém uma salvaguarda separada", () => {
  const combat = source("js/modules/combate.js");
  const title = { textContent: "" };
  let clearDie = null;
  let focusCount = 0;
  let selectAttribute = null;
  let refreshCount = 0;
  const context = {
    estadoTesteResistencia: {
      atributo: "con",
      contextoConcentracao: {
        chave: "spell-1",
        instanciaId: 1,
        magia: { nome: "Concentração" },
        cd: 12,
      },
      filaConcentracao: [
        {
          chave: "spell-1",
          instanciaId: 1,
          magia: { nome: "Concentração" },
          cd: 15,
        },
      ],
      dadoSistema: {
        setValor: (value) => {
          clearDie = value;
        },
      },
    },
    concentracaoAtiva: { chave: "spell-1", instanciaId: 1 },
    document: {
      getElementById: (id) =>
        id === "modalTesteResistenciaTitulo"
          ? title
          : id === "modalTesteResistenciaDado"
            ? {
                focus() {
                  focusCount += 1;
                },
              }
            : null,
    },
    obterNomeConcentracao: (magic) => magic.nome,
    selecionarAtributoTesteResistencia: (value) => {
      selectAttribute = value;
    },
    atualizarBotaoConfirmarTesteResistencia: () => {
      refreshCount += 1;
    },
    fecharModalTesteResistencia: () =>
      assert.fail("a segunda fonte não deve fechar o modal"),
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      combat,
      "function avancarTesteConcentracaoNaFila()",
      "\nfunction confirmarTesteResistencia",
    ),
    context,
  );
  assert.equal(context.avancarTesteConcentracaoNaFila(), true);
  assert.equal(context.estadoTesteResistencia.contextoConcentracao.cd, 15);
  assert.equal(context.estadoTesteResistencia.filaConcentracao.length, 0);
  assert.equal(context.estadoTesteResistencia.atributo, "con");
  assert.equal(
    title.textContent,
    "Teste para manter concentração em Concentração",
  );
  assert.equal(clearDie, "");
  assert.equal(selectAttribute, "con");
  assert.equal(refreshCount, 1);
  assert.equal(focusCount, 1);
});

test("E2.4: descartar entrada antiga da fila preserva próxima fonte da concentração ativa", () => {
  const combat = source("js/modules/combate.js");
  const history = [];
  const title = { textContent: "" };
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol("internal-resolution"),
    estadoTesteResistencia: {
      contextoConcentracao: {
        chave: "old",
        instanciaId: 1,
        magia: { nome: "Magia antiga" },
        cd: 10,
      },
      filaConcentracao: [
        {
          chave: "old",
          instanciaId: 1,
          magia: { nome: "Magia antiga" },
          cd: 12,
        },
        {
          chave: "new",
          instanciaId: 2,
          magia: { nome: "Magia atual" },
          cd: 15,
        },
      ],
      dadoSistema: { setValor() {} },
    },
    concentracaoAtiva: {
      chave: "new",
      instanciaId: 2,
      magia: { nome: "Magia atual" },
    },
    document: {
      getElementById: (id) =>
        id === "modalTesteResistenciaTitulo"
          ? title
          : id === "modalTesteResistenciaDado"
            ? { focus() {} }
            : null,
    },
    obterNomeConcentracao: (magic) => magic.nome,
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
    selecionarAtributoTesteResistencia() {},
    atualizarBotaoConfirmarTesteResistencia() {},
    fecharModalTesteResistencia: () =>
      assert.fail("o próximo contexto válido mantém o modal aberto"),
  };
  vm.createContext(context);
  vm.runInContext(
    extractFunction(
      combat,
      "function avancarTesteConcentracaoNaFila()",
      "\nfunction confirmarTesteResistencia",
    ),
    context,
  );
  assert.equal(context.avancarTesteConcentracaoNaFila(), true);
  assert.equal(history.length, 1);
  assert.match(history[0][1], /Magia antiga já não está em concentração ativa/);
  assert.equal(
    context.estadoTesteResistencia.contextoConcentracao.chave,
    "new",
  );
  assert.equal(
    context.estadoTesteResistencia.contextoConcentracao.instanciaId,
    2,
  );
  assert.equal(context.estadoTesteResistencia.contextoConcentracao.cd, 15);
  assert.equal(context.estadoTesteResistencia.filaConcentracao.length, 0);
  assert.equal(
    title.textContent,
    "Teste para manter concentração em Magia atual",
  );
});
