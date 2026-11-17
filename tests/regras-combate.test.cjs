const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const rulesInContext = () => {
  const context = {};
  vm.runInNewContext(`${source('js/domain/regras-combate.js')}\nglobalThis.__rules = RegrasCombate;`, context);
  return context.__rules;
};

function extractFunction(text, signature, nextSignature) {
  const start = text.indexOf(signature);
  const end = text.indexOf(nextSignature, start);
  assert.ok(start >= 0 && end > start, `função esperada: ${signature}`);
  return text.slice(start, end);
}

test('E2.1: total d20 é operação pura e valida entradas', () => {
  const rules = rulesInContext();
  assert.equal(rules.calcularTotalD20(15, [3, -1, 2]), 19);
  assert.equal(rules.calcularTotalD20(1, [-5]), -4);
  assert.equal(rules.calcularTotalD20(20, [0]), 20);
  assert.equal(rules.calcularTotalD20(0, [2]), null);
  assert.equal(rules.calcularTotalD20(21, [2]), null);
  assert.equal(rules.calcularTotalD20(12, [Number.NaN]), null);
});

test('E2.1: adaptador real de salvaguarda usa a regra pura para total d20', () => {
  const combat = source('js/modules/combate.js');
  const rules = rulesInContext();
  const context = {
    RegrasCombate: rules,
    obterDadoTesteResistencia: () => 14,
    obterBonusTesteResistencia: (atributo) => atributo === 'con' ? -2 : 0,
    estadoTesteResistencia: { atributo: 'con' },
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, 'function obterTotalTesteResistencia()', '\nfunction atualizarBotaoConfirmarTesteResistencia'), context);
  assert.equal(context.obterTotalTesteResistencia(), 12);
});

test('E2.5: vantagem e desvantagem cancelam; fontes múltiplas não acumulam', () => {
  const resolve = rulesInContext().resolverVantagemDesvantagem;
  assert.deepEqual(JSON.parse(JSON.stringify(resolve({ resultados: [4, 17], vantagens: [{}], desvantagens: [] }))), {
    modo: 'vantagem', escolhido: 17, resultados: [4, 17], vantagens: [{}], desvantagens: [],
  });
  assert.equal(resolve({ resultados: [4, 17], vantagens: [{}, {}] }).escolhido, 17);
  assert.deepEqual(JSON.parse(JSON.stringify(resolve({
    resultados: [3], vantagens: [{}], desvantagens: [{}],
  }))), { modo: 'normal', escolhido: 3, resultados: [3], vantagens: [{}], desvantagens: [{}] });
  assert.equal(resolve({ resultados: [4], desvantagens: [{}] }), null);
  assert.equal(resolve({ resultados: [4, 17, 19], vantagens: [{}] }), null);
  assert.equal(resolve({ resultados: [4], vantagens: null }), null);
  assert.deepEqual(JSON.parse(JSON.stringify(resolve({ resultados: [12] }))), {
    modo: 'normal', escolhido: 12, resultados: [12], vantagens: [], desvantagens: [],
  });
});

test('E2.2: cálculo isolado consome PV temporários antes do PV regular', () => {
  const resolve = rulesInContext().calcularPVDepoisDeDano;
  assert.deepEqual(JSON.parse(JSON.stringify(resolve({ pvAtuais: 10, pvTemporarios: 5, dano: 3 }))), {
    pvAtuais: 10, pvTemporarios: 2, danoEmTemporarios: 3, danoEmPV: 0, danoExcedente: 0,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(resolve({ pvAtuais: 10, pvTemporarios: 5, dano: 8 }))), {
    pvAtuais: 7, pvTemporarios: 0, danoEmTemporarios: 5, danoEmPV: 3, danoExcedente: 0,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(resolve({ pvAtuais: 0, pvTemporarios: 0, dano: 4 }))), {
    pvAtuais: 0, pvTemporarios: 0, danoEmTemporarios: 0, danoEmPV: 0, danoExcedente: 4,
  });
  assert.equal(resolve({ pvAtuais: -1, pvTemporarios: 0, dano: 2 }), null);
});

test('E2.2: cura pura não ultrapassa o máximo regular', () => {
  const rules = rulesInContext();
  assert.deepEqual(JSON.parse(JSON.stringify(rules.calcularPVDepoisDeCura({
    pvAtuais: 8, pvMaximos: 10, cura: 5,
  }))), { pvAtuais: 10, curaAplicada: 2 });
  assert.deepEqual(JSON.parse(JSON.stringify(rules.calcularPVDepoisDeCura({
    pvAtuais: 10, pvMaximos: 10, cura: 3,
  }))), { pvAtuais: 10, curaAplicada: 0 });
});

test('E2.3: dano tipado aplica imunidade, resistência, vulnerabilidade e cancelamento', () => {
  const resolve = rulesInContext().resolverDanoTipado;
  assert.equal(resolve({ quantidade: 9, tipo: 'fogo', origem: 'Sopro', resistencias: ['Fogo'] }).final, 4);
  assert.equal(resolve({ quantidade: 9, tipo: 'frio', origem: 'Arma', vulnerabilidades: ['frio'] }).final, 18);
  assert.equal(resolve({ quantidade: 9, tipo: 'ácido', origem: 'Magia', resistencias: ['ácido'], vulnerabilidades: ['ácido'] }).final, 9);
  assert.equal(resolve({ quantidade: 9, tipo: 'necrótico', origem: 'Efeito', imunidades: ['necrótico'], vulnerabilidades: ['necrótico'] }).final, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(resolve({ quantidade: 5, tipo: 'fogo', origem: 'Bola de Fogo' }))), {
    bruto: 5, tipo: 'fogo', origem: 'Bola de Fogo', resistido: false,
    vulneravel: false, imune: false, final: 5,
  });
  assert.equal(resolve({ quantidade: -1, tipo: 'fogo', origem: 'Teste' }), null);
  assert.equal(resolve({ quantidade: 1, tipo: 'fogo' }), null);
});

test('E2.4: fechar ou pressionar Escape não descarta salvaguarda pendente', () => {
  const combat = source('js/modules/combate.js');
  const skills = source('js/modules/habilidades.js');
  const classes = new Set(['ativo']);
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
    modalTesteResistenciaDado: { focus() { focusCount += 1; } },
    modalTesteResistenciaAbandonar: {
      hidden: false,
      classList: { add() {} },
    },
    modalTesteResistenciaCancelar: { textContent: 'Voltar ao teste' },
    modalTesteResistenciaTitulo: { textContent: 'Concentração' },
  };
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol('internal-resolution'),
    document: { getElementById: (id) => nodes[id] || null },
    estadoTesteResistencia: { contextoConcentracao: { chave: 'spell-1', magia: {} } },
    fecharModalTesteResistencia: undefined,
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, 'function fecharModalTesteResistencia(', '\nfunction abandonarConcentracaoPendente'), context);
  vm.runInContext(extractFunction(skills, 'function tratarEscapeTesteResistencia(', '\n\ndocument\n  .getElementById("modalAtaqueSucesso")'), context);
  assert.equal(context.fecharModalTesteResistencia(), false);
  assert.equal(context.tratarEscapeTesteResistencia(), true);
  assert.ok(classes.has('ativo'));
  assert.equal(context.estadoTesteResistencia.contextoConcentracao.chave, 'spell-1');
  assert.equal(focusCount, 2);
});

test('E2.4: flag pública resolvido não contorna a proteção do modal', () => {
  const combat = source('js/modules/combate.js');
  let focusCount = 0;
  const classes = new Set(['ativo']);
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol('private-test-token'),
    estadoTesteResistencia: {
      contextoConcentracao: { chave: 'spell-1', instanciaId: 1 },
      filaConcentracao: [],
    },
    document: {
      getElementById: (id) => id === 'modalTesteResistenciaOverlay'
        ? { classList: { remove: (name) => classes.delete(name), add: (name) => classes.add(name) }, setAttribute() {} }
        : { focus() { focusCount += 1; } },
    },
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, 'function fecharModalTesteResistencia(', '\nfunction abandonarConcentracaoPendente'), context);
  assert.equal(context.fecharModalTesteResistencia({ resolvido: true }), false);
  assert.ok(classes.has('ativo'));
  assert.equal(context.estadoTesteResistencia.contextoConcentracao.chave, 'spell-1');
  assert.equal(focusCount, 1);
});

test('E2.4: abandono é explícito, registrado e encerra a concentração associada', () => {
  const combat = source('js/modules/combate.js');
  const classes = new Set(['ativo']);
  const nodes = {
    modalTesteResistenciaOverlay: {
      classList: { remove: (n) => classes.delete(n), add: (n) => classes.add(n) },
      setAttribute() {},
    },
    modalTesteResistenciaAbandonar: { hidden: false, classList: { add() {} } },
    modalTesteResistenciaCancelar: { textContent: 'Voltar ao teste' },
    modalTesteResistenciaTitulo: { textContent: 'Teste para manter concentração' },
  };
  const history = [];
  const ended = [];
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol('internal-resolution'),
    document: { getElementById: (id) => nodes[id] || null },
    estadoTesteResistencia: { contextoConcentracao: { chave: 'spell-1', instanciaId: 1, magia: { nome: 'Escudo da Fé' } }, filaConcentracao: [] },
    concentracaoAtiva: { chave: 'spell-1', instanciaId: 1 },
    obterNomeConcentracao: () => 'Escudo da Fé',
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
    encerrarConcentracao: (...args) => ended.push(args),
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, 'function fecharModalTesteResistencia(', '\nfunction abandonarConcentracaoPendente'), context);
  vm.runInContext(extractFunction(combat, 'function abandonarConcentracaoPendente(', '\nfunction confirmarTesteResistencia'), context);
  context.abandonarConcentracaoPendente();
  assert.equal(history.length, 1);
  assert.match(history[0][1], /abandonada voluntariamente/);
  assert.deepEqual(JSON.parse(JSON.stringify(ended[0])), ['abandonada', { registrarHistorico: false }]);
  assert.ok(classes.has('oculto'));
  assert.equal(context.estadoTesteResistencia.contextoConcentracao, null);
});

test('E2.4: confirmação de teste obsoleto não altera a concentração mais nova', () => {
  const combat = source('js/modules/combate.js');
  const history = [];
  let closeCount = 0;
  let refreshCount = 0;
  let endCount = 0;
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol('internal-resolution'),
    RegrasCombate: rulesInContext(),
    estadoTesteResistencia: {
      atributo: 'con',
      contextoConcentracao: { chave: 'spell-old', instanciaId: 1, cd: 10, magia: { nome: 'Magia A' } },
      filaConcentracao: [],
    },
    concentracaoAtiva: { chave: 'spell-new', instanciaId: 2, magia: { nome: 'Magia B' } },
    obterDadoTesteResistencia: () => 20,
    obterRotuloAtributoTesteResistencia: () => 'CON',
    obterBonusTesteResistencia: () => 0,
    obterNomeConcentracao: (magic) => magic.nome,
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
    atualizarSubAbaMagiasCombate: () => { refreshCount += 1; },
    encerrarConcentracao: () => { endCount += 1; },
    fecharModalTesteResistencia: () => { closeCount += 1; },
    ultimoResultadoConcentracao: 'anterior',
    document: { getElementById: () => ({ focus() {} }) },
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, 'function avancarTesteConcentracaoNaFila()', '\nfunction confirmarTesteResistencia'), context);
  vm.runInContext(extractFunction(combat, 'function confirmarTesteResistencia()', '\nfunction abrirItemCard'), context);
  context.confirmarTesteResistencia();
  assert.equal(history.length, 1);
  assert.match(history[0][1], /teste pendente descartado/);
  assert.equal(context.ultimoResultadoConcentracao, 'anterior');
  assert.equal(refreshCount, 0);
  assert.equal(endCount, 0);
  assert.equal(closeCount, 1);
});

test('E2.4: salvaguarda antiga não afeta nova ativação da mesma magia', () => {
  const combat = source('js/modules/combate.js');
  const history = [];
  let closeCount = 0;
  let endCount = 0;
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol('internal-resolution'),
    RegrasCombate: rulesInContext(),
    estadoTesteResistencia: {
      atributo: 'con',
      contextoConcentracao: { chave: '2::escudo da fé', instanciaId: 10, cd: 10, magia: { nome: 'Escudo da Fé', nivel: 2 } },
      filaConcentracao: [],
    },
    concentracaoAtiva: { chave: '2::escudo da fé', instanciaId: 11, magia: { nome: 'Escudo da Fé', nivel: 2 } },
    obterDadoTesteResistencia: () => 20,
    obterRotuloAtributoTesteResistencia: () => 'CON',
    obterBonusTesteResistencia: () => 0,
    obterNomeConcentracao: (magic) => magic.nome,
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
    atualizarSubAbaMagiasCombate: () => assert.fail('resultado obsoleto não atualiza a magia'),
    encerrarConcentracao: () => { endCount += 1; },
    fecharModalTesteResistencia: () => { closeCount += 1; },
    document: { getElementById: () => ({ focus() {} }) },
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, 'function avancarTesteConcentracaoNaFila()', '\nfunction confirmarTesteResistencia'), context);
  vm.runInContext(extractFunction(combat, 'function confirmarTesteResistencia()', '\nfunction abrirItemCard'), context);
  context.confirmarTesteResistencia();
  assert.equal(history.length, 1);
  assert.match(history[0][1], /teste pendente descartado/);
  assert.equal(endCount, 0);
  assert.equal(closeCount, 1);
});

test('E2.4: abandono antigo não encerra nova ativação da mesma magia', () => {
  const combat = source('js/modules/combate.js');
  let endCount = 0;
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol('internal-resolution'),
    document: { getElementById: () => null },
    estadoTesteResistencia: {
      contextoConcentracao: { chave: '1::nevoa', instanciaId: 20, magia: { nome: 'Névoa', nivel: 1 } },
      filaConcentracao: [],
    },
    concentracaoAtiva: { chave: '1::nevoa', instanciaId: 21, magia: { nome: 'Névoa', nivel: 1 } },
    obterNomeConcentracao: (magic) => magic.nome,
    adicionarRegistroHistoricoCombate() {},
    encerrarConcentracao: () => { endCount += 1; },
    avancarTesteConcentracaoNaFila: () => false,
    fecharModalTesteResistencia: () => {},
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, 'function abandonarConcentracaoPendente(', '\nfunction confirmarTesteResistencia'), context);
  context.abandonarConcentracaoPendente();
  assert.equal(endCount, 0);
});

test('E2.4: cada conjuração captura uma identidade efêmera distinta no contexto', () => {
  const spells = source('js/modules/magias.js');
  const combat = source('js/modules/combate.js');
  const opened = [];
  const context = {
    concentracaoAtiva: null,
    sequenciaInstanciaConcentracao: 0,
    ultimoResultadoConcentracao: null,
    magiaExigeConcentracao: (spell) => !!spell.propriedades?.concentracao,
    obterChaveConcentracaoMagia: (spell) => `${spell.nivel}::${spell.nome.toLowerCase()}`,
    removerEfeitosDaConcentracao() {},
    sincronizarCondicaoConcentracao() {},
    atualizarSubAbaMagiasCombate() {},
    abrirModalTesteResistencia: (options) => opened.push(options),
    obterNomeConcentracao: (spell = context.concentracaoAtiva?.magia) => spell.nome,
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(spells, 'function iniciarConcentracaoMagia(', '\nfunction encerrarConcentracao'), context);
  vm.runInContext(extractFunction(spells, 'function abrirTesteConcentracaoPorDano(', '\nfunction renderizarTodasMagias'), context);
  const spell = { nome: 'Escudo da Fé', nivel: 2, propriedades: { concentracao: true } };
  context.iniciarConcentracaoMagia(spell, 2);
  const idAntigo = context.concentracaoAtiva.instanciaId;
  context.abrirTesteConcentracaoPorDano(20);
  context.iniciarConcentracaoMagia(spell, 2);
  const idNovo = context.concentracaoAtiva.instanciaId;
  context.abrirTesteConcentracaoPorDano(24);

  assert.notEqual(idNovo, idAntigo);
  assert.equal(opened[0].contextoConcentracao.chave, opened[1].contextoConcentracao.chave);
  assert.equal(opened[0].contextoConcentracao.instanciaId, idAntigo);
  assert.equal(opened[1].contextoConcentracao.instanciaId, idNovo);
});

test('E2.4: cada fonte de dano enfileirada mantém uma salvaguarda separada', () => {
  const combat = source('js/modules/combate.js');
  const title = { textContent: '' };
  let clearDie = null;
  let focusCount = 0;
  let selectAttribute = null;
  let refreshCount = 0;
  const context = {
    estadoTesteResistencia: {
      atributo: 'con',
      contextoConcentracao: { chave: 'spell-1', instanciaId: 1, magia: { nome: 'Concentração' }, cd: 12 },
      filaConcentracao: [{ chave: 'spell-1', instanciaId: 1, magia: { nome: 'Concentração' }, cd: 15 }],
      dadoSistema: { setValor: (value) => { clearDie = value; } },
    },
    concentracaoAtiva: { chave: 'spell-1', instanciaId: 1 },
    document: {
      getElementById: (id) => id === 'modalTesteResistenciaTitulo'
        ? title
        : id === 'modalTesteResistenciaDado'
          ? { focus() { focusCount += 1; } }
          : null,
    },
    obterNomeConcentracao: (magic) => magic.nome,
    selecionarAtributoTesteResistencia: (value) => { selectAttribute = value; },
    atualizarBotaoConfirmarTesteResistencia: () => { refreshCount += 1; },
    fecharModalTesteResistencia: () => assert.fail('a segunda fonte não deve fechar o modal'),
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, 'function avancarTesteConcentracaoNaFila()', '\nfunction confirmarTesteResistencia'), context);
  assert.equal(context.avancarTesteConcentracaoNaFila(), true);
  assert.equal(context.estadoTesteResistencia.contextoConcentracao.cd, 15);
  assert.equal(context.estadoTesteResistencia.filaConcentracao.length, 0);
  assert.equal(context.estadoTesteResistencia.atributo, 'con');
  assert.equal(title.textContent, 'Teste para manter concentração em Concentração');
  assert.equal(clearDie, '');
  assert.equal(selectAttribute, 'con');
  assert.equal(refreshCount, 1);
  assert.equal(focusCount, 1);
});

test('E2.4: descartar entrada antiga da fila preserva próxima fonte da concentração ativa', () => {
  const combat = source('js/modules/combate.js');
  const history = [];
  const title = { textContent: '' };
  const context = {
    tokenFechamentoResolvidoTesteResistencia: Symbol('internal-resolution'),
    estadoTesteResistencia: {
      contextoConcentracao: { chave: 'old', instanciaId: 1, magia: { nome: 'Magia antiga' }, cd: 10 },
      filaConcentracao: [
        { chave: 'old', instanciaId: 1, magia: { nome: 'Magia antiga' }, cd: 12 },
        { chave: 'new', instanciaId: 2, magia: { nome: 'Magia atual' }, cd: 15 },
      ],
      dadoSistema: { setValor() {} },
    },
    concentracaoAtiva: { chave: 'new', instanciaId: 2, magia: { nome: 'Magia atual' } },
    document: {
      getElementById: (id) => id === 'modalTesteResistenciaTitulo'
        ? title
        : id === 'modalTesteResistenciaDado'
          ? { focus() {} }
          : null,
    },
    obterNomeConcentracao: (magic) => magic.nome,
    adicionarRegistroHistoricoCombate: (...args) => history.push(args),
    selecionarAtributoTesteResistencia() {},
    atualizarBotaoConfirmarTesteResistencia() {},
    fecharModalTesteResistencia: () => assert.fail('o próximo contexto válido mantém o modal aberto'),
  };
  vm.createContext(context);
  vm.runInContext(extractFunction(combat, 'function avancarTesteConcentracaoNaFila()', '\nfunction confirmarTesteResistencia'), context);
  assert.equal(context.avancarTesteConcentracaoNaFila(), true);
  assert.equal(history.length, 1);
  assert.match(history[0][1], /Magia antiga já não está em concentração ativa/);
  assert.equal(context.estadoTesteResistencia.contextoConcentracao.chave, 'new');
  assert.equal(context.estadoTesteResistencia.contextoConcentracao.instanciaId, 2);
  assert.equal(context.estadoTesteResistencia.contextoConcentracao.cd, 15);
  assert.equal(context.estadoTesteResistencia.filaConcentracao.length, 0);
  assert.equal(title.textContent, 'Teste para manter concentração em Magia atual');
});
