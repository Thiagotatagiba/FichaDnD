const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const storageSource = fs.readFileSync(path.join(root, 'js/core/storage.js'), 'utf8');
const magiasSource = fs.readFileSync(path.join(root, 'js/modules/magias.js'), 'utf8');
const importSource = fs.readFileSync(path.join(root, 'js/modules/importacao.js'), 'utf8');
const historySource = fs.readFileSync(path.join(root, 'js/modules/historico.js'), 'utf8');
const equipmentSource = fs.readFileSync(path.join(root, 'js/modules/equipamentos.js'), 'utf8');
function extractFunction(source, signature, nextSignature) {
  const start = source.indexOf(signature);
  const end = source.indexOf(nextSignature, start);
  if (start < 0 || end < 0) throw new Error(`Não foi possível extrair ${signature}`);
  return source.slice(start, end);
}
const collectorStart = equipmentSource.indexOf('function coletarOutros() {');
const collectorEnd = equipmentSource.indexOf('\n      function toggleArma', collectorStart);
const coletarOutrosSource = equipmentSource.slice(collectorStart, collectorEnd);
const coletarArmasSource = extractFunction(
  equipmentSource, 'function coletarArmas() {', 'function atualizarProficienciaCardArmadura',
);
const coletarArmadurasSource = extractFunction(
  equipmentSource, 'function coletarArmaduras() {', 'function atualizarProficienciaCardEscudo',
);
const coletarEscudosSource = extractFunction(
  equipmentSource, 'function coletarEscudos() {', '// O card de "outros"',
);

function createHarness() {
  const writes = [];
  const elements = new Map();
  const document = {
    readyState: 'loading',
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll() { writes.push('document.querySelectorAll'); return []; },
    getElementById(id) {
      writes.push(`document.getElementById:${id}`);
      if (!elements.has(id)) elements.set(id, { value: 'current-value', checked: true });
      return elements.get(id);
    },
    querySelector() { writes.push('document.querySelector'); return null; },
    createElement() { writes.push('document.createElement'); return { style: {}, click() {} }; },
  };
  const context = vm.createContext({
    document,
    window: { addEventListener() {} },
    personagem: { nome: 'Personagem atual', sentinel: { unchanged: true } },
    configFicha: { custom: 'current' },
    estadoCombateIniciativa: { ativo: true, rodada: 7, posicao: 2, iniciativa: 5 },
    armaduraEquipadaIndice: 3,
    talentosEstruturados: { current: ['kept'] },
    localStorage: {
      getItem() { writes.push('localStorage.getItem'); return 'sentinel'; },
      setItem() { writes.push('localStorage.setItem'); },
      removeItem() { writes.push('localStorage.removeItem'); },
    },
    console: { error() {}, log() {} },
    Date,
    Promise,
    setTimeout,
    clearTimeout,
    setInterval() { return 0; },
    requestAnimationFrame(callback) { callback(); },
    obterSelecaoArmaEquipada() { return { nome: '', indice: null }; },
    confirm() { return true; },
    alert() {},
  });
  context.run = (code) => vm.runInContext(code, context);
  vm.runInContext(storageSource, context, { filename: 'js/core/storage.js' });
  vm.runInContext(magiasSource, context, { filename: 'js/modules/magias.js' });
  writes.length = 0; // Ignore the legacy dirty-state bootstrap performed at script load.
  context.inicioModalImportacao = Date.now() - 1000;
  context.run = (code) => vm.runInContext(code, context);
  context.writes = writes;
  return context;
}

function fakeElement(id = '', type = 'text', initialValue = '') {
  const attributes = {};
  Object.defineProperty(attributes, Symbol.iterator, {
    enumerable: false,
    value: function* iterateAttributes() {
      for (const [name, value] of Object.entries(attributes)) yield { name, value };
    },
  });
  const element = {
    nodeType: 1,
    id,
    type,
    tagName: type === 'container' ? 'DIV' : type.toUpperCase(),
    attributes,
    value: initialValue,
    defaultValue: initialValue,
    checked: false,
    defaultChecked: false,
    defaultSelected: false,
    selected: false,
    dataset: new Proxy({}, {
      set(target, chave, valor) { target[chave] = String(valor); return true; },
    }),
    children: [],
    get childNodes() { return this.children; },
    style: {},
    className: '',
    textContent: '',
    title: '',
    parentNode: null,
    addEventListener() {},
    dispatchEvent() {},
    closest() { return null; },
    setAttribute(name, value) { attributes[name] = String(value); },
    removeAttribute(name) { delete attributes[name]; },
    replaceChildren(...children) {
      this.children.forEach((child) => { child.parentNode = null; });
      this.children = [];
      children.forEach((child) => this.appendChild(child));
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    querySelectorAll() { return this.children; },
    querySelector() { return null; },
    remove() {
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
        this.parentNode = null;
      }
    },
    classList: { add() {}, remove() {}, toggle() {} },
  };
  return element;
}

function createApplyHarness() {
  const fields = new Map();
  const lists = new Map();
  const body = fakeElement('body', 'container');
  const domAccesses = [];
  const errors = [];
  const listIds = new Set([
    'listaMunicoes', 'listaOutros', 'listaArmas', 'listaArmaduras', 'listaEscudos',
    'talentoClasseLista', 'talentoArquetipoLista', 'talentoRacaLista',
    'talentoAntecedenteLista', 'talentoOutroLista',
  ]);
  const getElement = (id) => {
    if (listIds.has(id)) {
      if (!lists.has(id)) {
        const element = fakeElement(id, 'container');
        lists.set(id, element);
        body.appendChild(element);
      }
      return lists.get(id);
    }
    if (!fields.has(id)) {
      const value = id === 'classeNivelID' ? '1' : '';
      const type = id === 'classeNivelID' ? 'number' : 'text';
      const element = fakeElement(id, type, value);
      fields.set(id, element);
      body.appendChild(element);
    }
    return fields.get(id);
  };
  const document = {
    readyState: 'loading',
    body,
    addEventListener() {},
    removeEventListener() {},
    getElementById(id) { domAccesses.push(`get:${id}`); return getElement(id); },
    querySelectorAll(selector) {
      domAccesses.push(`query:${selector}`);
      if (selector === 'input, select, textarea') return [...fields.values()];
      if (selector === '.pericia-linha') return [];
      if (selector.includes('.item-card[data-tipo="arma"]')) return lists.get('listaArmas')?.children || [];
      if (selector.includes('.item-card[data-tipo="armadura"]')) return lists.get('listaArmaduras')?.children || [];
      if (selector.includes('.item-card[data-tipo="escudo"]')) return lists.get('listaEscudos')?.children || [];
      if (selector.includes('#listaOutros .item-card')) {
        return lists.get('listaOutros')?.children || [];
      }
      if (selector.includes('#lista')) {
        return [...lists.values()].flatMap((list) => list.children);
      }
      return [];
    },
    createElement(tag) { return fakeElement('', tag === 'button' ? 'button' : 'text'); },
  };
  const context = vm.createContext({
    document,
    window: { document, confirm() { return true; }, addEventListener() {} },
    personagem: {},
    configFicha: { custom: {} },
    estadoCombateIniciativa: { ativo: false, rodada: 0, posicao: null, iniciativa: null },
    armaduraEquipadaIndice: null,
    talentosEstruturados: {},
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    console: { error(...args) { errors.push(args.map((arg) => arg?.message || String(arg)).join(' ')); }, log() {} },
    Date,
    Promise,
    structuredClone,
    Map,
    Set,
    WeakSet,
    Event: class { constructor(type) { this.type = type; } },
    setTimeout,
    clearTimeout,
    setInterval() { return 0; },
    requestAnimationFrame(callback) { callback(); },
    obterSelecaoArmaEquipada() { return { nome: '', indice: null }; },
    confirm() { return true; },
    alert() {},
  });
  context.run = (code) => vm.runInContext(code, context);
  vm.runInContext(storageSource, context, { filename: 'js/core/storage.js' });
  vm.runInContext(magiasSource, context, { filename: 'js/modules/magias.js' });
  vm.runInContext(importSource, context, { filename: 'js/modules/importacao.js' });
  vm.runInContext(historySource, context, { filename: 'js/modules/historico.js' });
  vm.runInContext(coletarOutrosSource, context, { filename: 'coletarOutros from equipamentos.js' });
  vm.runInContext(coletarArmasSource, context, { filename: 'coletarArmas from equipamentos.js' });
  vm.runInContext(coletarArmadurasSource, context, { filename: 'coletarArmaduras from equipamentos.js' });
  vm.runInContext(coletarEscudosSource, context, { filename: 'coletarEscudos from equipamentos.js' });
  context.run(`
    var generatedIdCounter = 0;
    var bloqueandoLevelUp = false;
    gerarId = () => 'generated-' + (++generatedIdCounter);
    normalizarConfigFicha = (config) => config ?? { custom: {} };
    normalizarIndiceEquipamento = () => null;
    aplicarTema = () => {};
    atualizarInterfaceCombate = () => {};
    garantirCampoSubclasseComoSelect = () => document.getElementById('subclasse');
    atualizarSubclasses = () => {};
    obterCampoRaca = () => document.getElementById('racaID');
    garantirOpcaoSelect = () => {};
    obterCampoSubraca = () => document.getElementById('subraca');
    atualizarSubracas = () => {};
    normalizarPlaceholdersCamposBase = () => {};
    preencherFormularioConfigFicha = () => {};
    aplicarConfigCustomizacaoNaFicha = () => {};
    aplicarFlagsCompartilhadasItem = () => {};
    coletarFlagsCompartilhadasItem = () => {};
    atualizarOpcoesMunicao = () => {};
    fecharItemCard = () => {};
    atualizarListaArmasEquipamento = () => {};
    getTemProficienciaArma = () => false;
    getTemProficienciaArmadura = () => false;
    getTemProficienciaEscudo = () => false;
    resolverIndiceArmaSalva = () => null;
    atualizarSelectNomeArmaEquipada = () => {};
    sincronizarMarcacaoArmasPorSlots = () => {};
    sincronizarEquipamentosCombate = () => {};
    sincronizarSalvaguardasComAtributosBase = () => {};
    atualizarAtributos = () => {};
    desenharRadar = () => {};
    atualizarModificadoresSalvaguarda = () => {};
    atualizarPericias = () => {};
    atualizarPassivas = () => {};
    atualizarClasseArmaduraEquipada = () => {};
    atualizarSubAbaArmas = () => {};
    sincronizarClasseNivel = () => {};
    sincronizarResumoCaracteristicas = () => {};
    sincronizarCamposMagia = () => {};
    atualizarMagias = () => {};
    atualizarVidaMaxNivelUm = () => {};
    normalizarPontosDeVida = () => {};
    normalizarDadosVida = () => {};
    atualizarPesoAtualInventario = () => {};
    atualizarDadosVidaTotal = () => {};
    atualizarDadoVida = () => {};
    atualizarSelectNomeArmaduraEquipada = () => {};
    equiparArmadura = () => {};
    atualizarFicha = () => {};
    marcarFichaComoSalva = () => {};
    mostrarResultadoImportacao = () => {};
    window.__cancelarOperacoesModaisXPLevelUp = async () => ({ ok: true, cancelled: [], focusTarget: null });
    window.__cancelarModalSalvaguardaMorteParaImportacao = () => ({ ok: true, estavaAberto: false });
    window.__reconciliarModaisXPLevelUp = () => ({ ok: true });
    aguardarRenderizacaoModalImportacao = async () => {};
    aguardarTempoMinimoModalImportacao = async () => {};
    inicioModalImportacao = Date.now() - 1000;
    const makeCard = (listId) => {
      const card = document.createElement('article');
      card.dataset.tipo = listId === 'listaOutros' ? 'outro' :
        listId === 'listaArmas' ? 'arma' :
        listId === 'listaArmaduras' ? 'armadura' : 'escudo';
      document.getElementById(listId).appendChild(card);
      return card;
    };
    adicionarNovoOutro = () => {
      const card = makeCard('listaOutros');
      card.dataset.id = gerarId();
      return card;
    };
    adicionarNovaArma = () => makeCard('listaArmas');
    adicionarNovaArmadura = () => {
      const card = makeCard('listaArmaduras');
      card.dataset.instanciaId = gerarId();
      return card;
    };
    adicionarNovoEscudo = () => makeCard('listaEscudos');
  `);
  context.fakeLists = lists;
  context.fakeFields = fields;
  context.domAccesses = domAccesses;
  context.errors = errors;
  return context;
}

function observeRealApplier(harness) {
  harness.run(`
    var originalApplier = aplicarDadosFicha;
    var applierCallCount = 0;
    var lastPreparedPayload;
    var lastImportResult;
    aplicarDadosFicha = async (dados, opcoes) => {
      applierCallCount += 1;
      lastPreparedPayload = dados;
      return originalApplier(dados, opcoes);
    };
  `);
}

async function importThroughRealApplier(harness, json) {
  harness.inputForImport = JSON.stringify(json);
  await harness.run(`processarImportacao(inputForImport, (result) => { lastImportResult = result; })`);
}

function readContextJson(harness, expression) {
  return JSON.parse(harness.run(`JSON.stringify(${expression})`));
}

function prepare(harness, input) {
  harness.inputText = JSON.stringify(input);
  return JSON.parse(harness.run(
    'JSON.stringify(prepararImportacaoFicha(JSON.parse(inputText)))',
  ));
}

function preparationErrorCode(harness, input) {
  harness.inputText = JSON.stringify(input);
  return harness.run(`(() => {
    try { prepararImportacaoFicha(JSON.parse(inputText)); return null; }
    catch (error) { return error.code || 'UNCLASSIFIED'; }
  })()`);
}

function prepareRawJson(harness, json) {
  harness.inputText = json;
  return JSON.parse(harness.run(
    'JSON.stringify(prepararImportacaoFicha(inputText))',
  ));
}

function snapshot(harness) {
  return harness.run(`JSON.stringify({
    personagem, configFicha, estadoCombateIniciativa, armaduraEquipadaIndice,
    talentosEstruturados,
    dom: [...document.getElementById('snapshot-marker').value, document.getElementById('snapshot-marker').checked]
  })`);
}

test('preparação rejeita JSON inválido e raízes incompatíveis sem invocar o aplicador', async (t) => {
  const inputs = ['{broken', 'null', '[]', '"texto"', '42'];
  for (const input of inputs) {
    await t.test(JSON.stringify(input), async () => {
      const harness = createHarness();
      harness.run(`var applyCount = 0;
        aplicarDadosFicha = async () => { applyCount += 1; return true; };
        mostrarResultadoImportacao = () => {};
        aguardarRenderizacaoModalImportacao = async () => {};
        aguardarTempoMinimoModalImportacao = async () => {};`);
      const before = snapshot(harness);
      harness.writes.length = 0;
      await harness.run(`processarImportacao(${JSON.stringify(input)})`);
      assert.equal(harness.run('applyCount'), 0);
      assert.deepEqual(harness.writes, [], 'rejeição prévia não acessa DOM nem armazenamento');
      assert.equal(snapshot(harness), before, 'estado atual permanece igual após rejeição');
    });
  }
});

test('importação com XP inválido não chama o aplicador nem altera estado/DOM atuais', async () => {
  const harness = createHarness();
  harness.run(`var applyCount = 0;
    aplicarDadosFicha = async () => { applyCount += 1; return true; };
    mostrarResultadoImportacao = () => {};
    aguardarRenderizacaoModalImportacao = async () => {};
    aguardarTempoMinimoModalImportacao = async () => {};`);
  harness.run(`document.getElementById('snapshot-marker').value = 'before-xp-import';`);
  const before = snapshot(harness);
  harness.writes.length = 0;

  await harness.run(`processarImportacao('{"xp":-1}', (result) => { xpInvalidResult = result; })`);

  assert.equal(harness.run('applyCount'), 0);
  assert.deepEqual(harness.writes, [], 'XP inválido é rejeitado antes de ler/escrever DOM ou armazenamento');
  assert.equal(snapshot(harness), before);
  assert.equal(harness.run('xpInvalidResult.codigo'), 'INVALID_XP_VALUE');
  assert.equal(harness.run('xpInvalidResult.tipo'), 'erro');
});

test('coleções ou itens malformados são recusados antes do aplicador', async (t) => {
  const inputs = [
    { armas: {} },
    { armas: null },
    { armaduras: [null] },
    { escudos: ['not-an-object'] },
    { outros: [false] },
    { escudos: [{ escudo_nome: 17 }] },
    { municoes: [null] },
    { municoes: null },
    { municoes: { id: 'not-a-list' } },
    { municoes: 'not-a-list' },
    { historiaDiarioAventura: {} },
    { historiaDiarioAventura: null },
    { historiaDiarioAventura: [null] },
    { historiaDiarioAventura: ['evento primitivo'] },
    { atrib_for: -1 },
    { atrib_des: 'texto' },
    { atrib_con: {} },
    { atrib_sab: -0.5 },
    { atrib_car: 'NaN' },
    { atrib_for: 10.5 },
    { atrib_des: '10.5' },
    { atrib_int: '1e2' },
    { atrib_sab: 1e-1 },
    { magia1Rest: -1 },
    { magia2Rest: 1.5 },
    { magia3Rest: 'dois' },
  ];
  for (const input of inputs) {
    await t.test(JSON.stringify(input), async () => {
      const harness = createHarness();
      harness.run(`var applyCount = 0;
        aplicarDadosFicha = async () => { applyCount += 1; return true; };
        mostrarResultadoImportacao = () => {};
        aguardarRenderizacaoModalImportacao = async () => {};
        aguardarTempoMinimoModalImportacao = async () => {};`);
      const before = snapshot(harness);
      harness.writes.length = 0;
      await harness.run(`processarImportacao(${JSON.stringify(JSON.stringify(input))})`);
      assert.equal(harness.run('applyCount'), 0);
      assert.deepEqual(harness.writes, [], 'rejeição prévia não acessa DOM nem armazenamento');
      assert.equal(snapshot(harness), before, 'estado atual permanece igual após rejeição');
    });
  }
});

test('versões futuras e malformadas são rejeitadas antes do aplicador', async (t) => {
  const inputs = [
    { fichaSchemaVersion: 3 },
    { fichaSchemaVersion: 0 },
    { fichaSchemaVersion: '1' },
    { fichaSchemaVersion: 1.25 },
    { fichaSchemaVersion: null },
  ];
  for (const input of inputs) {
    await t.test(JSON.stringify(input), async () => {
      const harness = createHarness();
      harness.run(`var applyCount = 0;
        aplicarDadosFicha = async () => { applyCount += 1; return true; };
        mostrarResultadoImportacao = () => {};
        aguardarRenderizacaoModalImportacao = async () => {};
        aguardarTempoMinimoModalImportacao = async () => {};`);
      const before = snapshot(harness);
      harness.writes.length = 0;
      await harness.run(`processarImportacao(${JSON.stringify(JSON.stringify(input))})`);
      assert.equal(harness.run('applyCount'), 0);
      assert.deepEqual(harness.writes, [], 'rejeição prévia não acessa DOM nem armazenamento');
      assert.equal(snapshot(harness), before, 'estado atual permanece igual após rejeição');
    });
  }
});

test('preparação classifica campos de coleção inválidos com código estável', () => {
  const harness = createHarness();
  assert.equal(
    preparationErrorCode(harness, { escudos: [{ escudo_nome: 17 }] }),
    'INVALID_CHARACTER_SHEET_COLLECTION_FIELD',
  );
});

test('E2.5: estadoCombate preserva fontes persistentes válidas e rejeita fontes incompletas', () => {
  const harness = createHarness();
  const fonte = {
    id: 'condicao-cego', escopo: 'ataque', origem: 'condicao', duracao: 'persistente',
    tipo: 'desvantagem', motivo: 'Atacante cego', metadado: { regra: '2014' },
  };
  const preparada = prepareRawJson(harness, JSON.stringify({
    estadoCombate: { ativo: false, rodada: 0, posicao: null, iniciativa: null, fontesVantagemDesvantagem: [fonte] },
  }));
  assert.deepEqual(preparada.estadoCombate.fontesVantagemDesvantagem, [fonte]);
  assert.equal(preparationErrorCode(harness, {
    estadoCombate: { fontesVantagemDesvantagem: [{ ...fonte, motivo: '' }] },
  }), 'INVALID_CHARACTER_SHEET_FIELD');
  assert.equal(preparationErrorCode(harness, {
    estadoCombate: { fontesVantagemDesvantagem: [fonte, { ...fonte, motivo: 'Duplicada' }] },
  }), 'INVALID_CHARACTER_SHEET_FIELD');
  for (const invalida of [
    { ...fonte, duracao: 'uma_rolagem' },
    { ...fonte, duracao: 'turno' },
    { ...fonte, ativo: 'false' },
  ]) {
    assert.equal(preparationErrorCode(harness, { estadoCombate: { fontesVantagemDesvantagem: [invalida] } }), 'INVALID_CHARACTER_SHEET_FIELD');
  }
  assert.equal(preparationErrorCode(harness, { estadoCombate: { fontesVantagemDesvantagem: [{ ...fonte, ativo: false }] } }), null);
});

test('E2.1: estado de recursos do turno opcional é preservado e validado na importação', () => {
  const harness = createHarness();
  const recursosTurno = { rodada: 3, acaoUsada: true, acaoBonusUsada: false, reacaoUsada: true, movimentoTotal: 30, movimentoGasto: 10, ataqueDuasArmasElegivel: true, maoAtaqueQualificador: 1, maosAtaqueQualificadoras: [1, 2], ataqueAcaoIniciado: true, ataquesAcaoRestantes: 1 };
  const preparada = prepare(harness, { estadoCombate: { ativo: true, rodada: 3, recursosTurno } });
  assert.deepEqual(preparada.estadoCombate.recursosTurno, recursosTurno);
  assert.equal(preparationErrorCode(harness, { estadoCombate: { recursosTurno: { ...recursosTurno, movimentoGasto: 31 } } }), 'INVALID_CHARACTER_SHEET_FIELD');
  assert.equal(preparationErrorCode(harness, { estadoCombate: { recursosTurno: { ...recursosTurno, acaoUsada: 1 } } }), 'INVALID_CHARACTER_SHEET_FIELD');
  assert.equal(preparationErrorCode(harness, { estadoCombate: { recursosTurno: { ...recursosTurno, acaoUsada: false } } }), 'INVALID_CHARACTER_SHEET_FIELD');
  assert.equal(preparationErrorCode(harness, { estadoCombate: { recursosTurno: { ...recursosTurno, ataqueAcaoIniciado: false } } }), 'INVALID_CHARACTER_SHEET_FIELD');
  assert.equal(preparationErrorCode(harness, { estadoCombate: { configuracaoRecursosTurno: { acao: 0, acaoBonus: 1, reacao: 1, ataquesPorAcao: 1 } } }), 'INVALID_CHARACTER_SHEET_FIELD');
  const legado = prepare(harness, { estadoCombate: { ativo: true, rodada: 3 } });
  assert.equal(legado.estadoCombate.recursosTurno, undefined, 'preparação deixa a decisão de default ao aplicador sem reescrever JSON legado');
});

test('E3.1: efeitos ativos e concentração são aditivos, validados e preservam metadados desconhecidos', () => {
  const harness = createHarness();
  const efeito = {
    id: 'efeito-ativacao-1', tipo: 'magia',
    origem: { tipo: 'magia', id: 'hex', nome: 'Hex' },
    referenciaDefinicao: { tipo: 'magia', id: 'hex', nivel: 1 },
    estado: 'ativa', duracao: { tipo: 'descricao', valor: '1 hora' },
    gatilho: { tipo: 'manual', descricao: 'Aplicação posterior' },
    dadosAplicacao: { magia: { id: 'hex', nome: 'Hex', metadataCustom: { keep: true } }, nivelSlot: 2 },
    concentracaoInstanciaId: null, criadaEm: '2026-11-24T12:00:00.000Z', plugin: { raw: null },
  };
  const concentracao = {
    instanciaId: 'concentracao-1', chave: '1::hex', iniciadaEm: '2026-11-24T12:00:00.000Z',
    magia: { id: 'hex', nome: 'Hex', propriedades: { concentracao: true } }, nivelSlot: 1,
  };
  const preparada = prepare(harness, { estadoCombate: { efeitosAtivos: [efeito], concentracaoAtiva: concentracao } });
  assert.deepEqual(preparada.estadoCombate.efeitosAtivos, [efeito]);
  assert.deepEqual(preparada.estadoCombate.concentracaoAtiva, concentracao);
  assert.equal(preparationErrorCode(harness, { estadoCombate: { efeitosAtivos: [efeito, efeito] } }), 'INVALID_CHARACTER_SHEET_FIELD');
  assert.equal(preparationErrorCode(harness, { estadoCombate: { efeitosAtivos: [{ ...efeito, duracao: null }] } }), 'INVALID_CHARACTER_SHEET_FIELD');
  assert.equal(preparationErrorCode(harness, { estadoCombate: { concentracaoAtiva: { ...concentracao, instanciaId: '' } } }), 'INVALID_CHARACTER_SHEET_FIELD');
  assert.equal(preparationErrorCode(harness, { estadoCombate: {} }), null, 'snapshot legado sem novos campos permanece válido');
});

test('preparação profunda preserva aliases, metadados, nulls e estruturas desconhecidas', () => {
  const harness = createHarness();
  const input = {
    nomePlayer: 'Legada',
    schema_version: '1.0',
    schema_notes: { source: 'legacy', flags: [null, 'custom'] },
    customRoot: null,
    plugin: { nested: [{ keep: true, nullable: null }] },
    configFicha: {
      custom: { classe: 'Bruxo', pluginSetting: { enabled: true, data: null } },
      integration: { untouched: ['a', null, { b: 2 }] },
    },
    talentosEstruturados: {
      categoriaDesconhecida: [{ nome: 'Extensão', metadata: { arbitrary: null } }],
      campoExtra: { preserve: true },
    },
    armas: [
      { id: 'arma-x', customWeapon: { array: [1, null] } },
      { propriedadeSemId: { keep: true } },
    ],
    municoes: [{ arbitraryAmmoContract: { raw: null, qty: 'opaque' } }],
    pocoes: { arbitraryPotionContract: ['opaque', null] },
  };
  const prepared = prepare(harness, input);

  assert.equal(prepared.fichaSchemaVersion, 2);
  assert.equal(prepared.nomePlayer, 'Legada');
  assert.equal(prepared.schema_version, '1.0');
  assert.deepEqual(prepared.schema_notes, input.schema_notes);
  assert.equal(prepared.customRoot, null);
  assert.deepEqual(prepared.plugin, input.plugin);
  assert.deepEqual(prepared.configFicha, input.configFicha);
  assert.deepEqual(prepared.talentosEstruturados, input.talentosEstruturados);
  assert.deepEqual(prepared.armas, input.armas);
  assert.deepEqual(prepared.municoes, input.municoes);
  assert.deepEqual(prepared.pocoes, input.pocoes);
  assert.notStrictEqual(prepared, input);
  assert.notStrictEqual(prepared.plugin, input.plugin);
  assert.notStrictEqual(prepared.plugin.nested, input.plugin.nested);
  assert.notStrictEqual(prepared.plugin.nested[0], input.plugin.nested[0]);
  assert.notStrictEqual(prepared.configFicha.custom.pluginSetting, input.configFicha.custom.pluginSetting);
  assert.notStrictEqual(prepared.talentosEstruturados.categoriaDesconhecida[0].metadata,
    input.talentosEstruturados.categoriaDesconhecida[0].metadata);
  assert.equal(input.fichaSchemaVersion, undefined, 'entrada original não sofre mutação');
  assert.equal(Object.hasOwn(prepared.armas[1], 'id'), false,
    'preparação não cria IDs automaticamente');
  assert.equal(Object.hasOwn(input.armas[1], 'id'), false,
    'preparação não altera o objeto original');
});

test('preparação de ficha incompleta mantém campos ausentes e não consulta DOM, globais ou armazenamento', () => {
  const harness = createHarness();
  const before = snapshot(harness);
  harness.writes.length = 0;
  const prepared = prepare(harness, { nomePlayer: 'Parcial', customNull: null });

  assert.equal(prepared.nomePlayer, 'Parcial');
  assert.equal(prepared.jogador, 'Parcial', 'alias legado continua disponível');
  assert.equal(prepared.customNull, null);
  assert.equal(Object.hasOwn(prepared, 'classeNivelID'), false);
  // Ausência de talentos: o comportamento de síntese está pendente de decisão,
  // pois o caminho legado atual consulta DOM; não congelar esse detalhe aqui.
  assert.deepEqual(harness.writes, [], 'preparação não acessa DOM nem armazenamento');
  assert.equal(snapshot(harness), before, 'globais e valores atuais permanecem intactos');
});

test('preparação aceita valores null e estruturas aninhadas em propriedades desconhecidas', () => {
  const harness = createHarness();
  const input = {
    fichaSchemaVersion: 1,
    campoOpcional: null,
    estrutura: { itens: [null, { meta: { vazio: null, valores: [1, 2] } }] },
    municoes: [{ id: 'opaque', custom: { nested: null } }],
    pocoes: [{ desconhecida: { aninhada: true } }],
    escudos: [{ escudo_nome: null, extensao: null }],
  };
  const prepared = prepare(harness, input);
  assert.equal(prepared.fichaSchemaVersion, 2);
  assert.equal(prepared.campoOpcional, null);
  assert.deepEqual(prepared.municoes, input.municoes);
  assert.deepEqual(prepared.escudos, input.escudos);
  assert.deepEqual(prepared.estrutura, input.estrutura);
  assert.deepEqual(prepared.pocoes, input.pocoes);
  assert.notStrictEqual(prepared.estrutura, input.estrutura);
});

test('preparação preserva extensão de talento sem nome e coleções explicitamente vazias', () => {
  const harness = createHarness();
  const input = {
    talentosEstruturados: { categoriaFutura: [{ metadata: { origem: 'custom', flags: [null] } }] },
    armas: [],
    armaduras: [],
    escudos: [],
    outros: [],
    municoes: [],
  };
  const prepared = prepare(harness, input);
  assert.deepEqual(prepared.talentosEstruturados, input.talentosEstruturados);
  for (const key of ['armas', 'armaduras', 'escudos', 'outros', 'municoes']) {
    assert.deepEqual(prepared[key], [], `${key}: array vazio explícito não se confunde com ausência`);
  }
});

test('validação numérica aceita atributos inteiros no mínimo e slots numéricos em texto sem coerção', () => {
  const harness = createHarness();
  const input = {
    atrib_for: 0,
    atrib_des: '0',
    atrib_con: '0',
    atrib_int: 8,
    atrib_sab: '0',
    atrib_car: 1e2,
    magia1Rest: '0',
    magia2Rest: ' 4 ',
    magia3Rest: 2,
    magia4Rest: null,
    magia5Rest: '',
  };
  const prepared = prepare(harness, input);
  for (const key of Object.keys(input)) {
    assert.equal(prepared[key], input[key], `${key} preserva tipo e valor explícito`);
    assert.equal(typeof prepared[key], typeof input[key]);
  }
  for (const key of ['magia6Rest', 'magia9Rest']) {
    assert.equal(Object.hasOwn(prepared, key), false, `${key} ausente permanece ausente`);
  }
});

test('número JSON em notação exponencial mantém seu valor inteiro após o parse', () => {
  const harness = createHarness();
  harness.inputText = '{"atrib_for":1e2}';
  const prepared = JSON.parse(harness.run(
    'JSON.stringify(prepararImportacaoFicha(inputText))',
  ));
  assert.equal(prepared.atrib_for, 100);
  assert.equal(typeof prepared.atrib_for, 'number');
});

test('preparação preserva chave JSON __proto__ sem alterar protótipos', () => {
  const harness = createHarness();
  const prepared = prepareRawJson(harness,
    '{"__proto__":{"polluted":true},"nested":{"__proto__":{"alsoPolluted":true}}}');

  assert.equal(Object.hasOwn(prepared, '__proto__'), true);
  assert.equal(prepared.__proto__.polluted, true);
  assert.equal(Object.getPrototypeOf(prepared), Object.prototype);
  assert.equal(Object.getPrototypeOf(prepared.nested), Object.prototype);
  assert.equal(({}).polluted, undefined);
  assert.equal(({}).alsoPolluted, undefined);
});

test('perícia ou contadores de magia legados inválidos são rejeitados antes do aplicador', async (t) => {
  const inputs = [
    { periciaAcrobaciaEstado: 4 },
    { magia1Total: 2, magia1Usado: 3 },
  ];
  for (const input of inputs) {
    await t.test(JSON.stringify(input), async () => {
      const harness = createHarness();
      harness.run(`var applyCount = 0;
        aplicarDadosFicha = async () => { applyCount += 1; return true; };
        mostrarResultadoImportacao = () => {};
        aguardarRenderizacaoModalImportacao = async () => {};
        aguardarTempoMinimoModalImportacao = async () => {};`);
      const before = snapshot(harness);
      harness.writes.length = 0;
      await harness.run(`processarImportacao(${JSON.stringify(JSON.stringify(input))})`);
      assert.equal(harness.run('applyCount'), 0);
      assert.deepEqual(harness.writes, [], 'falha de preparação não acessa DOM nem armazenamento');
      assert.equal(snapshot(harness), before, 'estado atual permanece igual após rejeição');
    });
  }
});

test('ficha legada incompleta válida chega uma vez ao aplicador sem herdar valores da ficha aberta', async () => {
  const harness = createHarness();
  harness.run(`var applyCount = 0;
    var receivedByApplier;
    aplicarDadosFicha = async (dados) => {
      applyCount += 1;
      receivedByApplier = JSON.stringify(dados);
      return true;
    };
    mostrarResultadoImportacao = () => {};
    aguardarRenderizacaoModalImportacao = async () => {};
    aguardarTempoMinimoModalImportacao = async () => {};`);
  const legacy = { nomePlayer: 'Importada', equipamentoPersonalizado: { extra: true } };
  harness.writes.length = 0;
  await harness.run(`processarImportacao(${JSON.stringify(JSON.stringify(legacy))})`);

  const received = JSON.parse(harness.run('receivedByApplier'));
  assert.equal(harness.run('applyCount'), 1);
  assert.deepEqual(harness.writes, [], 'pipeline de preparação não consulta DOM nem armazenamento');
  assert.equal(received.fichaSchemaVersion, 2);
  assert.equal(received.nomePlayer, 'Importada');
  assert.equal(received.jogador, 'Importada');
  assert.equal(Object.hasOwn(received, 'classeNivelID'), false);
  assert.equal(Object.hasOwn(received, 'nome'), false,
    'o nome do personagem atualmente aberto não deve ser copiado para a ficha incompleta');
  assert.deepEqual(received.equipamentoPersonalizado, legacy.equipamentoPersonalizado);
});

test('importação real preenchida seguida de ficha incompleta limpa defaults visíveis, coleções e talentos exportáveis', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);

  await importThroughRealApplier(harness, {
    nomePersonagem: 'Personagem anterior',
    jogador: 'Jogadora anterior',
    classeNivelID: 8,
    armas: [{ arma_nome: 'Espada anterior', id: 'arma-anterior' }],
    armaduras: [{ armadura_nome: 'Cota anterior', instanciaId: 'armadura-anterior' }],
    escudos: [{ escudo_nome: 'Escudo anterior' }],
    outros: [{ outro_nome: 'Item anterior', id: 'outro-anterior' }],
    talentosEstruturados: {
      classe: [{ nome: 'Característica anterior', descricao: 'Metadado antigo', extra: { preservado: true } }],
    },
  });

  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  assert.equal(harness.fakeLists.get('listaArmas').children.length, 1, harness.errors.join('\n'));
  assert.equal(harness.fakeLists.get('listaArmaduras').children.length, 1);
  assert.equal(harness.fakeLists.get('listaEscudos').children.length, 1);
  assert.equal(harness.fakeLists.get('listaOutros').children.length, 1);
  assert.equal(harness.fakeFields.get('talentoClasse').value, 'Característica anterior');

  await importThroughRealApplier(harness, { jogador: 'Jogadora nova' });

  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  assert.equal(harness.run('applierCallCount'), 2);
  assert.equal(harness.fakeFields.get('nomePersonagem').value, '',
    'campo ausente volta ao default declarado no controle');
  assert.equal(harness.fakeFields.get('jogador').value, 'Jogadora nova',
    'valor explícito substitui o valor anterior');
  assert.equal(harness.fakeFields.get('classeNivelID').value, '1',
    'campo numérico ausente retorna ao default HTML');
  assert.equal(harness.fakeFields.get('talentoClasse').value, '');
  for (const id of ['listaArmas', 'listaArmaduras', 'listaEscudos', 'listaOutros']) {
    assert.equal(harness.fakeLists.get(id).children.length, 0, `${id} ausente limpa os cards anteriores`);
  }

  const personagemAtual = readContextJson(harness, 'personagem');
  for (const key of ['nomePersonagem', 'armas', 'armaduras', 'escudos', 'outros', 'talentosEstruturados']) {
    assert.equal(Object.hasOwn(personagemAtual, key), false, `${key} ausente não é inserido no payload`);
  }
  const exportado = readContextJson(harness, `({
    ...coletarDadosFicha(),
    armas: coletarArmas(), armaduras: coletarArmaduras(),
    escudos: coletarEscudos(), outros: coletarOutros()
  })`);
  assert.equal(exportado.nomePersonagem, '');
  assert.equal(exportado.classeNivelID, '1');
  assert.deepEqual(exportado.armas, []);
  assert.deepEqual(exportado.armaduras, []);
  assert.deepEqual(exportado.escudos, []);
  assert.deepEqual(exportado.outros, []);
  assert.equal(exportado.talentoClasse, '');
  assert.equal(Object.values(exportado.talentosEstruturados).flat().length, 0,
    'a coleta não reexporta características do personagem anterior');
});

test('E2.1: importação restaura recursos do turno persistidos e ficha legada ativa inicia turno limpo', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);
  const configuracao = { acao: 2, acaoBonus: 1, reacao: 2, ataquesPorAcao: 3 };
  const recursos = { rodada: 4, acaoUsada: true, acaoBonusUsada: true, reacaoUsada: true, gastos: { acao: 1, acaoBonus: 1, reacao: 1 }, limites: configuracao, ajustesTemporarios: { acao: 1, acaoBonus: 0, reacao: 0, ataquesPorAcao: 0 }, movimentoTotal: 30, movimentoGasto: 15, ataqueDuasArmasElegivel: true, maoAtaqueQualificador: 1, maosAtaqueQualificadoras: [1, 2], ataqueAcaoIniciado: true, ataquesAcaoRestantes: 1 };
  await importThroughRealApplier(harness, { estadoCombate: { ativo: true, rodada: 4, posicao: 1, iniciativa: 15, configuracaoRecursosTurno: configuracao, recursosTurno: recursos } });
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', `${harness.errors.join('\\n')} ${JSON.stringify(readContextJson(harness, 'lastImportResult'))}`);
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.recursosTurno'), recursos);
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.configuracaoRecursosTurno'), configuracao);
  const exportado = readContextJson(harness, 'coletarDadosFicha()');
  assert.deepEqual(exportado.estadoCombate.recursosTurno, recursos);
  assert.deepEqual(exportado.estadoCombate.configuracaoRecursosTurno, configuracao);
  await importThroughRealApplier(harness, exportado);
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\\n'));
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.recursosTurno'), recursos,
    'exportação e reimportação mantêm cada recurso consumido');
  await importThroughRealApplier(harness, { classeNivelID: 5, deslocamento: '7,5m', classeData: JSON.stringify({ nome: 'Guerreiro', niveis: [{ nivel: 5, caracteristicas: 'Ataque Extra' }] }), estadoCombate: { ativo: true, rodada: 2, posicao: 1, iniciativa: 12 } });
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\\n'));
  const legado = readContextJson(harness, 'estadoCombateIniciativa.recursosTurno');
  assert.equal(legado.rodada, 2);
  assert.equal(legado.acaoUsada, false);
  assert.equal(legado.ataqueDuasArmasElegivel, false);
  assert.equal(legado.movimentoTotal, 25, 'velocidade legada 7,5m é convertida para 25ft sem truncar frações');
  assert.equal(legado.ataquesAcaoRestantes, 1, 'dados da classe restauram Extra Attack 2014');
  const recursosAntigos = { rodada: 7, acaoUsada: true, acaoBonusUsada: false, reacaoUsada: false, movimentoTotal: 30, movimentoGasto: 0, ataqueDuasArmasElegivel: false, maoAtaqueQualificador: null, maosAtaqueQualificadoras: [], ataqueAcaoIniciado: false, ataquesAcaoRestantes: 0 };
  await importThroughRealApplier(harness, { estadoCombate: { ativo: true, rodada: 7, recursosTurno: recursosAntigos } });
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\\n'));
  const recursosRestaurados = readContextJson(harness, 'estadoCombateIniciativa.recursosTurno');
  assert.equal(recursosRestaurados.gastos.acao, 1, 'um uso legado booleano se converte em um gasto sem apagar o contador');
  assert.deepEqual(recursosRestaurados.limites, { acao: 1, acaoBonus: 1, reacao: 1, ataquesPorAcao: 1 });
  assert.deepEqual(recursosRestaurados.ajustesTemporarios, { acao: 0, acaoBonus: 0, reacao: 0, ataquesPorAcao: 0 });
});

test('E3.1: duas instâncias e concentração sobrevivem a importação, exportação e reimportação', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);
  const efeitosAtivos = [1, 2].map((nivelSlot) => ({
    id: `hex-${nivelSlot}`, tipo: 'magia', origem: { tipo: 'magia', id: 'hex', nome: 'Hex' },
    referenciaDefinicao: { tipo: 'magia', id: 'hex', nivel: 1 }, estado: 'ativa',
    duracao: { tipo: 'descricao', valor: '1 hora' },
    gatilho: { tipo: 'manual', descricao: 'Dano posterior confirmado' },
    dadosAplicacao: { magia: { id: 'hex', nome: 'Hex', efeitos: [{ tipo: 'dano', formula: '1d6' }] }, nivelSlot },
    concentracaoInstanciaId: 'conc-hex', criadaEm: `2026-11-24T12:0${nivelSlot}:00.000Z`,
  }));
  const concentracaoAtiva = {
    instanciaId: 'conc-hex', chave: '1::hex', iniciadaEm: '2026-11-24T12:00:00.000Z',
    magia: { id: 'hex', nome: 'Hex', nivel: 1, propriedades: { concentracao: true } }, nivelSlot: 1,
  };
  const ficha = { estadoCombate: { ativo: false, rodada: 0, posicao: null, iniciativa: null, efeitosAtivos, concentracaoAtiva } };
  await importThroughRealApplier(harness, ficha);
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.efeitosAtivos'), efeitosAtivos);
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.concentracaoAtiva'), concentracaoAtiva);
  const exportado = readContextJson(harness, 'coletarDadosFicha()');
  assert.deepEqual(exportado.estadoCombate.efeitosAtivos, efeitosAtivos);
  await importThroughRealApplier(harness, exportado);
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.efeitosAtivos'), efeitosAtivos);
  await importThroughRealApplier(harness, { nomePersonagem: 'Ficha legada', estadoCombate: { ativo: false } });
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.efeitosAtivos'), []);
  assert.equal(readContextJson(harness, 'estadoCombateIniciativa.concentracaoAtiva'), null);
});

test('E3.2: condições estruturadas são canônicas no round-trip e legado migra sem concentração no campo', async () => {
  const harness = createApplyHarness();
  const combatSource = fs.readFileSync(path.join(root, 'js/modules/combate.js'), 'utf8');
  harness.run(fs.readFileSync(path.join(root, 'js/domain/condicoes-combate.js'), 'utf8'));
  harness.run('const CONDICOES_DND = RegrasCondicoesCombate.condicoesOficiais;');
  harness.run(extractFunction(combatSource, 'function projetarCondicoesAtivasParaCampo() {', 'function atualizarCondicoesEstruturadas('));
  harness.run(extractFunction(combatSource, 'function gerarIdCondicaoAtiva() {', 'function migrarCondicoesLegadas('));
  harness.run(extractFunction(combatSource, 'function migrarCondicoesLegadas(texto) {', 'function projetarCondicoesAtivasParaCampo('));
  observeRealApplier(harness);
  const condicoesAtivas = [
    { id: 'cond-1', tipo: 'oficial', nome: 'Cego', origem: { tipo: 'efeito', id: 'rede' }, estado: 'ativa', duracao: { tipo: 'rodadas', valor: 2 } },
    { id: 'cond-2', tipo: 'personalizada', nome: 'Marca da mesa', origem: { tipo: 'manual' }, estado: 'ativa', duracao: { tipo: 'indefinida' } },
  ];
  await importThroughRealApplier(harness, {
    ataqueCondicao: 'Paralisado',
    estadoCombate: { ativo: false, condicoesAtivas, concentracaoAtiva: { instanciaId: 'conc', chave: '1::bless', iniciadaEm: '2026-11-24T12:00:00.000Z', magia: { nome: 'Bless' } } },
  });
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.condicoesAtivas'), condicoesAtivas);
  assert.equal(harness.fakeFields.get('ataqueCondicao').value, 'Cego, Marca da mesa');
  const exportado = readContextJson(harness, 'coletarDadosFicha()');
  await importThroughRealApplier(harness, exportado);
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.condicoesAtivas'), condicoesAtivas);
  assert.equal(readContextJson(harness, 'estadoCombateIniciativa.concentracaoAtiva.instanciaId'), 'conc');

  await importThroughRealApplier(harness, { ataqueCondicao: 'Envenenado, Concentrado [Bless]' });
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.condicoesAtivas').map((item) => item.nome), ['Envenenado']);
  assert.equal(readContextJson(harness, 'estadoCombateIniciativa.concentracaoAtiva.magia.nome'), 'Bless');
  assert.equal(harness.fakeFields.get('ataqueCondicao').value, 'Envenenado');
});

test('E3.5: envelopes estruturados do histórico sobrevivem ao round-trip e rejeitam IDs duplicados', async () => {
  const harness = createApplyHarness();
  harness.run(`var historicoRenderizado = null; restaurarHistoricoEventosEstruturados = eventos => { historicoRenderizado = JSON.parse(JSON.stringify(eventos)); };`);
  observeRealApplier(harness);
  const historicoEventos = [{
    id: 'evento-1', criadoEm: '2026-11-24T12:00:00.000Z', rodada: 2,
    tipo: 'Magia NV 1', subtipo: 'Ação', origem: { tipo: 'magia', id: 'hex' }, alvo: null,
    rolagem: { modo: 'normal', resultados: [14], escolhido: 14 }, modificadores: [],
    efeito: { evento: 'ativacao', dados: { titulo: 'Magia NV 1', nome: 'Hex' } }, consumo: { nivelSlot: 1 },
  }];
  const payload = { estadoCombate: { ativo: false, historicoEventos } };
  await importThroughRealApplier(harness, payload);
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.historicoEventos'), historicoEventos);
  const exportado = readContextJson(harness, 'coletarDadosFicha()');
  assert.deepEqual(exportado.estadoCombate.historicoEventos, historicoEventos);
  const invalido = JSON.parse(JSON.stringify(payload));
  invalido.estadoCombate.historicoEventos.push({ ...historicoEventos[0] });
  assert.equal(preparationErrorCode(harness, invalido), 'INVALID_CHARACTER_SHEET_FIELD');

  await importThroughRealApplier(harness, { nomePersonagem: 'Ficha legada sem histórico', estadoCombate: { ativo: false } });
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.historicoEventos'), []);
  assert.deepEqual(readContextJson(harness, 'historicoRenderizado'), [], 'importação legada deve limpar eventos visuais da ficha anterior');
});

test('E3.4: estado de usos de características valida, importa e exporta separado da definição', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);
  const usos = [{ id: 'ativacao-surto', origem: { categoria: 'classe', nome: 'Surto' }, usosMaximos: 2, usosRestantes: 1, recarga: 'descanso_curto' }];
  const payload = {
    talentosEstruturados: { classe: [{ id: 'surto', nome: 'Surto', descricao: 'Texto preservado', ativacao: { habilitada: true, id: 'ativacao-surto', formula: '1d8', efeitos: 'Cura', usosMaximos: 2, recarga: 'descanso_curto' }, extra: { preservar: true } }] },
    estadoCombate: { ativo: false, caracteristicasAtivas: usos },
  };
  await importThroughRealApplier(harness, payload);
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  assert.deepEqual(readContextJson(harness, 'estadoCombateIniciativa.caracteristicasAtivas'), usos);
  const exportado = readContextJson(harness, 'coletarDadosFicha()');
  assert.deepEqual(exportado.estadoCombate.caracteristicasAtivas, usos);
  assert.deepEqual(exportado.talentosEstruturados.classe[0].extra, { preservar: true });
  assert.equal(preparationErrorCode(harness, { estadoCombate: { caracteristicasAtivas: [{ ...usos[0], usosRestantes: 3 }] } }), 'INVALID_CHARACTER_SHEET_FIELD');
});

test('E3.1: efeito ativo não pode apontar para concentração ausente ou diferente', () => {
  const harness = createHarness();
  const efeito = { id: 'e', tipo: 'magia', origem: { tipo: 'magia' }, referenciaDefinicao: {}, estado: 'ativa', duracao: { tipo: 'descricao' }, gatilho: { tipo: 'manual' }, dadosAplicacao: {}, concentracaoInstanciaId: 'conc-a', criadaEm: '2026-11-24T12:00:00.000Z' };
  assert.equal(preparationErrorCode(harness, { estadoCombate: { efeitosAtivos: [efeito], concentracaoAtiva: null } }), 'INVALID_CHARACTER_SHEET_FIELD');
  assert.equal(preparationErrorCode(harness, { estadoCombate: { efeitosAtivos: [efeito], concentracaoAtiva: { instanciaId: 'conc-b', chave: 'x', iniciadaEm: '2026-11-24T12:00:00.000Z', magia: {} } } }), 'INVALID_CHARACTER_SHEET_FIELD');
});

test('talentos null explícitos limpam a interface sem perder null no payload', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);
  await importThroughRealApplier(harness, {
    talentosEstruturados: { classe: [{ nome: 'Anterior', metadata: { source: 'custom' } }] },
  });
  assert.equal(harness.fakeLists.get('talentoClasseLista')?.children.some((item) => item.className === 'talento-item') || false, true, harness.errors.join('\n'));

  await importThroughRealApplier(harness, { talentosEstruturados: null });
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  const personagemAtual = readContextJson(harness, 'personagem');
  assert.equal(Object.hasOwn(personagemAtual, 'talentosEstruturados'), true);
  assert.equal(personagemAtual.talentosEstruturados, null,
    'null explícito continua distinto da ausência no payload');
  assert.equal(harness.fakeLists.get('talentoClasseLista')?.children.some((item) => item.className === 'talento-item') || false, false);
  assert.equal(harness.fakeFields.get('talentoClasse').value, '');
});

test('talentos presentes preservam metadados ao passar pela preparação e pelo aplicador real', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);
  const metadata = { featureId: 'custom-feature', extra: { notes: ['manual', null] } };
  await importThroughRealApplier(harness, {
    talentosEstruturados: {
      classe: [{ nome: 'Customizada', descricao: 'Descrição própria', tipo: 'Classe', origem: 'Mesa', metadata }],
      categoriaFutura: [{ raw: true, metadata: { preserve: null } }],
    },
  });

  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  const aplicado = readContextJson(harness, 'personagem.talentosEstruturados');
  assert.deepEqual(aplicado.classe[0].metadata, metadata);
  assert.deepEqual(aplicado.categoriaFutura, [{ raw: true, metadata: { preserve: null } }]);
  assert.equal(harness.fakeFields.get('talentoClasse').value, 'Customizada');
  assert.equal(harness.fakeLists.get('talentoClasseLista').children.some((item) => item.textContent === 'Customizada'), true);
});

test('importação preserva PV persistidos em vez de recalcular PV máximos no nível 1', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);
  harness.run(`
    atualizarVidaMaxNivelUm = () => {
      document.getElementById('pvTotal').value = '9';
      document.getElementById('pvAtual').value = '9';
    };
    atualizarFicha = () => {
      atualizarVidaMaxNivelUm();
      normalizarPontosDeVida();
    };
  `);

  await importThroughRealApplier(harness, {
    fichaSchemaVersion: 2,
    nomePersonagem: 'PV sintéticos',
    classeNivelID: '1',
    pvTotal: '18',
    pvAtual: '16',
    pvTemporario: '4',
  });

  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  assert.equal(harness.fakeFields.get('pvTotal').value, '18');
  assert.equal(harness.fakeFields.get('pvAtual').value, '16');
  assert.equal(harness.fakeFields.get('pvTemporario').value, '4');
});

test('E2.2: pools de PV e metadados sobrevivem ao round-trip de importação e exportação', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);
  const original = {
    fichaSchemaVersion: 2,
    nomePersonagem: 'PV round-trip sintético',
    pvTotal: '18',
    pvAtual: '13',
    pvTemporario: '4',
    extensaoPV: { origem: 'mesa', observacao: 'preservar' },
  };

  await importThroughRealApplier(harness, original);
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  const exportado = readContextJson(harness, 'coletarDadosFicha()');

  assert.equal(exportado.pvTotal, '18');
  assert.equal(exportado.pvAtual, '13');
  assert.equal(exportado.pvTemporario, '4');
  assert.deepEqual(exportado.extensaoPV, original.extensaoPV);

  await importThroughRealApplier(harness, exportado);
  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  const reexportado = readContextJson(harness, 'coletarDadosFicha()');
  assert.deepEqual(
    [reexportado.pvTotal, reexportado.pvAtual, reexportado.pvTemporario],
    ['18', '13', '4'],
  );
  assert.deepEqual(reexportado.extensaoPV, original.extensaoPV);
});

test('eventos do diário sem id preservam ausência e metadados no round-trip; ids presentes mantêm valor', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);
  const entrada = {
    historiaDiarioAventura: [
      { titulo: 'Evento legado sem ID', texto: 'Texto preservado', criadoEm: 17,
        metadata: { source: 'custom', nested: { note: null, values: [1, 'x'] } } },
      { id: 73, titulo: 'Evento com ID', texto: 'Outro texto', criadoEm: 22,
        extensao: { futuro: true } },
    ],
  };
  await importThroughRealApplier(harness, entrada);

  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  const carregados = readContextJson(harness, 'obterEventosDiarioAventuraParaSalvar()');
  assert.equal(Object.hasOwn(carregados[0], 'id'), false,
    'a normalização do diário não deve inventar ID persistente');
  assert.deepEqual(carregados[0].metadata, entrada.historiaDiarioAventura[0].metadata);
  assert.equal(carregados[1].id, 73);
  assert.equal(typeof carregados[1].id, 'number');
  assert.deepEqual(carregados[1].extensao, entrada.historiaDiarioAventura[1].extensao);

  const exportado = readContextJson(harness, 'coletarDadosFicha().historiaDiarioAventura');
  assert.equal(Object.hasOwn(exportado[0], 'id'), false,
    'a coleta exportável mantém a ausência distinta de null/ID gerado');
  assert.deepEqual(exportado[0].metadata, entrada.historiaDiarioAventura[0].metadata);
  assert.equal(exportado[1].id, 73);
  assert.equal(typeof exportado[1].id, 'number');
  assert.deepEqual(exportado[1].extensao, entrada.historiaDiarioAventura[1].extensao);
  assert.equal(Object.hasOwn(entrada.historiaDiarioAventura[0], 'id'), false,
    'importação não muta o objeto de entrada');
});

test('evento válido sem título e texto mantém metadados durante preparação, carga e coleta', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);
  const metadata = { custom: true, nested: { note: null, list: [1, 'preservado'] } };
  await importThroughRealApplier(harness, {
    historiaDiarioAventura: [{ criadoEm: 0, metadata }],
  });

  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  const carregados = readContextJson(harness, 'obterEventosDiarioAventuraParaSalvar()');
  assert.equal(carregados.length, 1, 'evento válido sem campos textuais não é descartado');
  assert.equal(Object.hasOwn(carregados[0], 'id'), false);
  assert.deepEqual(carregados[0].metadata, metadata);

  const exportado = readContextJson(harness, 'coletarDadosFicha().historiaDiarioAventura');
  assert.equal(exportado.length, 1);
  assert.equal(Object.hasOwn(exportado[0], 'id'), false);
  assert.deepEqual(exportado[0].metadata, metadata);
});

test('IDs legados ausentes são transitórios na UI e não aparecem no payload coletado; IDs existentes permanecem iguais', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);
  const input = {
    armaduras: [
      { armadura_nome: 'Armadura sem instância' },
      { armadura_nome: 'Armadura identificada', instanciaId: 'instancia-persistente' },
    ],
    outros: [
      { outro_nome: 'Item sem ID' },
      { outro_nome: 'Item identificado', id: 42 },
    ],
  };
  await importThroughRealApplier(harness, input);

  assert.equal(harness.run('lastImportResult.tipo'), 'sucesso', harness.errors.join('\n'));
  const payload = readContextJson(harness, 'lastPreparedPayload');
  assert.equal(Object.hasOwn(payload.outros[0], 'id'), false);
  assert.equal(payload.outros[1].id, 42);
  assert.equal(typeof payload.outros[1].id, 'number');
  assert.equal(Object.hasOwn(payload.armaduras[0], 'instanciaId'), false);
  assert.equal(payload.armaduras[1].instanciaId, 'instancia-persistente');
  assert.equal(Object.hasOwn(input.outros[0], 'id'), false, 'preparação/aplicação não muta entrada externa');
  assert.equal(Object.hasOwn(input.armaduras[0], 'instanciaId'), false, 'IDs transitórios não vazam para a entrada');

  const otherCards = harness.fakeLists.get('listaOutros').children;
  const armorCards = harness.fakeLists.get('listaArmaduras').children;
  assert.notEqual(otherCards[0].dataset.id, '', 'a UI pode atribuir identidade transitória');
  assert.equal(otherCards[0].dataset.idTransitorio, 'true');
  assert.notEqual(armorCards[0].dataset.instanciaId, '', 'a UI pode atribuir instância transitória');
  assert.equal(armorCards[0].dataset.instanciaIdTransitorio, 'true');

  const coletado = readContextJson(harness, '({ outros: coletarOutros(), armaduras: coletarArmaduras() })');
  assert.equal(Object.hasOwn(coletado.outros[0], 'id'), false);
  assert.equal(coletado.outros[1].id, 42);
  assert.equal(typeof coletado.outros[1].id, 'number');
  assert.equal(Object.hasOwn(coletado.armaduras[0], 'instanciaId'), false);
  assert.equal(coletado.armaduras[1].instanciaId, 'instancia-persistente');
});

test('coleção de munições com item nulo consumido pelo aplicador é rejeitada antes da aplicação real', async () => {
  const harness = createApplyHarness();
  observeRealApplier(harness);
  const before = readContextJson(harness, '({ personagem, campos: [document.getElementById("nomePersonagem").value] })');

  await importThroughRealApplier(harness, { municoes: [null] });

  assert.equal(harness.run('lastImportResult.tipo'), 'erro');
  assert.equal(harness.run('applierCallCount'), 0);
  assert.deepEqual(
    readContextJson(harness, '({ personagem, campos: [document.getElementById("nomePersonagem").value] })'),
    before,
    'a rejeição estrutural ocorre sem mutação da ficha atual',
  );
});
