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
    window: {},
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
    window: { document, confirm() { return true; } },
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
    { fichaSchemaVersion: 2 },
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

  assert.equal(prepared.fichaSchemaVersion, 1);
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
  assert.equal(prepared.fichaSchemaVersion, 1);
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
  assert.equal(received.fichaSchemaVersion, 1);
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
