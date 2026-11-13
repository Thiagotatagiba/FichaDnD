const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

// Regression contract for E1.4. This suite intentionally exercises the real
// import pipeline/applier in a deterministic VM, with DOM operations and
// application callbacks instrumented for fault injection.
const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const storageSource = read('js/core/storage.js');
const importSource = read('js/modules/importacao.js');
const mainSource = read('js/main.js');
const talentsSource = read('js/modules/magias.js');
const historySource = read('js/modules/historico.js');
const equipmentSource = read('js/modules/equipamentos.js');
const classSource = read('js/modules/classe.js');
const classCardSource = read('js/modules/card-classe.js');
const classFeatureSource = read('js/data/racas-subclasses.js');
const diceSource = read('js/core/dice-core.js');
const ammoCatalogSource = read('js/modules/municoes-catalogo.js');
const combatSource = read('js/modules/combate.js');
const otherCatalogSource = read('js/modules/outros-catalogo.js');

function extractFunction(source, signature, nextSignature) {
  const start = source.indexOf(signature);
  const end = source.indexOf(nextSignature, start);
  if (start < 0 || end < 0) throw new Error(`Não foi possível extrair ${signature}`);
  return source.slice(start, end);
}

const equipmentFunctions = [
  extractFunction(equipmentSource, 'function coletarOutros() {', '\n      function toggleArma'),
  extractFunction(equipmentSource, 'function coletarArmas() {', 'function atualizarProficienciaCardArmadura'),
  extractFunction(equipmentSource, 'function coletarArmaduras() {', 'function atualizarProficienciaCardEscudo'),
  extractFunction(equipmentSource, 'function coletarEscudos() {', '// O card de "outros"'),
];

let restorationFailureArmed = false;

function fakeElement(id = '', type = 'text', initialValue = '') {
  const fakeTextNode = (data) => ({
    nodeType: 3,
    data: String(data ?? ''),
    parentNode: null,
    get childNodes() { return []; },
    get textContent() { return this.data; },
    set textContent(value) { this.data = String(value ?? ''); },
  });
  const attributes = {};
  Object.defineProperty(attributes, Symbol.iterator, {
    enumerable: false,
    value: function* iterateAttributes() {
      for (const [name, value] of Object.entries(attributes)) {
        if (name !== Symbol.iterator) yield { name, value };
      }
    },
  });
  const listeners = new Map();
  const classes = new Set();
  const dataAttributeName = (name) => `data-${String(name).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
  const dataPropertyName = (name) => name.replace(/^data-/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const dataset = new Proxy({}, {
    get(_target, name) { return attributes[dataAttributeName(name)]; },
    set(_target, name, value) { attributes[dataAttributeName(name)] = String(value); return true; },
    deleteProperty(_target, name) { delete attributes[dataAttributeName(name)]; return true; },
    ownKeys() { return Object.keys(attributes).filter((name) => name.startsWith('data-')).map(dataPropertyName); },
    getOwnPropertyDescriptor(_target, name) {
      const key = dataAttributeName(name);
      return Object.prototype.hasOwnProperty.call(attributes, key)
        ? { enumerable: true, configurable: true, value: attributes[key] }
        : undefined;
    },
  });
  function syncClasses() {
    if (classes.size) attributes.class = [...classes].join(' ');
    else delete attributes.class;
  }
  const classList = {
    add(...names) { names.forEach((name) => classes.add(name)); syncClasses(); },
    remove(...names) { names.forEach((name) => classes.delete(name)); syncClasses(); },
    contains(name) { return classes.has(name); },
    toggle(name, force) {
      if (force === undefined) force = !classes.has(name);
      if (force) classes.add(name); else classes.delete(name);
      syncClasses();
      return force;
    },
  };
  const element = {
    nodeType: 1,
    _id: '', type, tagName: type === 'container' ? 'DIV' : type.toUpperCase(),
    get id() { return this._id; },
    set id(value) {
      this._id = String(value ?? '');
      if (this._id) attributes.id = this._id;
      else delete attributes.id;
    },
    _value: initialValue, defaultValue: initialValue,
    checked: false, defaultChecked: false, selected: false, defaultSelected: false,
    disabled: false, hidden: false, dataset, style: {},
    _className: '', classList, attributes, listeners, children: [], options: [],
    get className() { return this._className; },
    set className(value) {
      this._className = String(value ?? '');
      classes.clear();
      this._className.split(/\s+/).filter(Boolean).forEach((name) => classes.add(name));
      syncClasses();
    },
    get childNodes() { return this.children; },
    get isConnected() {
      let ancestor = this;
      while (ancestor) {
        if (ancestor.id === 'body') return true;
        ancestor = ancestor.parentNode;
      }
      return false;
    },
    parentNode: null, _textContent: '', _innerHTML: '', title: '',
    get textContent() {
      if (this.nodeType === 3) return this.data;
      return this.children.length
        ? this.children.map((child) => child.textContent || '').join('')
        : this._textContent;
    },
    set textContent(value) {
      this.replaceChildren();
      const text = String(value ?? '');
      this._textContent = '';
      if (text) this.appendChild(fakeTextNode(text));
    },
    get innerHTML() { return this._innerHTML; },
    set innerHTML(value) {
      this._innerHTML = String(value ?? '');
      if (this._innerHTML === '') this.replaceChildren();
    },
    get value() { return this._value; },
    set value(value) {
      if (restorationFailureArmed) throw new Error('injected restore DOM setter failure');
      this._value = String(value ?? '');
    },
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(callback);
    },
    removeEventListener(name, callback) {
      if (!listeners.has(name)) return;
      listeners.set(name, listeners.get(name).filter((registered) => registered !== callback));
    },
    dispatchEvent(event) {
      if (this._throwOnDispatch) throw new Error('injected dispatch failure');
      for (const callback of listeners.get(event.type) || []) callback(event);
      return true;
    },
    closest() { return null; },
    setAttribute(name, value) {
      attributes[name] = String(value);
      if (name === 'class') {
        this._className = String(value);
        classes.clear();
        this._className.split(/\s+/).filter(Boolean).forEach((item) => classes.add(item));
      }
      if (name === 'id') this._id = String(value);
    },
    removeAttribute(name) {
      delete attributes[name];
      if (name === 'class') { this._className = ''; classes.clear(); }
      if (name === 'id') this._id = '';
    },
    getAttribute(name) { return attributes[name] ?? null; },
    replaceChildren(...children) {
      if (restorationFailureArmed) throw new Error('injected restore DOM replace failure');
      this.children.forEach((child) => { child.parentNode = null; });
      this.children = [];
      children.forEach((child) => this.appendChild(child));
    },
    appendChild(child) {
      if (restorationFailureArmed) throw new Error('injected restore DOM append failure');
      if (child.parentNode) {
        const siblings = child.parentNode.children;
        const currentIndex = siblings.indexOf(child);
        if (currentIndex >= 0) siblings.splice(currentIndex, 1);
      }
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    remove() {
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter((item) => item !== this);
        this.parentNode = null;
      }
    },
    contains(node) {
      let current = node;
      while (current) {
        if (current === this) return true;
        current = current.parentNode;
      }
      return false;
    },
    querySelectorAll(selector) {
      if (selector === '[data-campo]') return this.fields || [];
      if (selector === 'input[type="checkbox"]') return this.checkboxes || [];
      return this.children;
    },
    querySelector(selector) {
      if (selector === '[data-campo="arma_municao_id"]') return this.munitionSelect || null;
      return null;
    },
    focus() {},
    select() {},
  };
  element.id = id;
  return element;
}

function createHarness() {
  restorationFailureArmed = false;
  const fields = new Map();
  const lists = new Map();
  const errors = [];
  const eventLog = [];
  const windowListeners = new Map();
  const body = fakeElement('body', 'container');
  const listIds = new Set([
    'listaMunicoes', 'listaOutros', 'listaArmas', 'listaArmaduras', 'listaEscudos',
    'talentoClasseLista', 'talentoArquetipoLista', 'talentoRacaLista',
    'talentoAntecedenteLista', 'talentoOutroLista', 'historiaDiarioLista',
  ]);
  const getElement = (id) => {
    const xpElementIds = new Set([
      'xpBar', 'xpBarCurrent', 'xpBarNext', 'xpProgressMarker', 'xpLevelLabel',
      'xpCurrentValue', 'xpThresholdValue', 'xpTexto',
    ]);
    if (xpElementIds.has(id)) {
      if (!fields.has(id)) {
        const bar = fakeElement(id, 'container');
        fields.set(id, bar);
        body.appendChild(bar);
      }
      return fields.get(id);
    }
    if (listIds.has(id)) {
      if (!lists.has(id)) {
        const list = fakeElement(id, 'container');
        lists.set(id, list);
        body.appendChild(list);
      }
      return lists.get(id);
    }
    if (fields.has(id) && !fields.get(id).isConnected) fields.delete(id);
    if (!fields.has(id)) {
      const numberFields = new Set(['classeNivelID', 'atrib_for', 'atrib_des', 'atrib_con', 'atrib_int', 'atrib_sab', 'atrib_car']);
      const initial = id === 'classeNivelID' ? '4' : id.startsWith('atrib_') ? '16' : `antes:${id}`;
      const field = fakeElement(id, numberFields.has(id) ? 'number' : 'text', initial);
      fields.set(id, field);
      body.appendChild(field);
    }
    return fields.get(id);
  };
  const document = {
    readyState: 'loading', body, activeElement: null,
    addEventListener() {}, removeEventListener() {},
    getElementById(id) { return getElement(id); },
    querySelectorAll(selector) {
      if (selector === 'input, select, textarea') return [...fields.values()].filter((field) => field.isConnected && field.id !== 'exportacaoStatus');
      if (selector === '.pericia-linha') return [];
      if (selector.includes('.item-card[data-tipo="arma"]')) return lists.get('listaArmas')?.children || [];
      if (selector.includes('.item-card[data-tipo="armadura"]')) return lists.get('listaArmaduras')?.children || [];
      if (selector.includes('.item-card[data-tipo="escudo"]')) return lists.get('listaEscudos')?.children || [];
      if (selector.includes('#listaOutros .item-card')) return lists.get('listaOutros')?.children || [];
      if (selector.includes('#lista')) return [...lists.values()].flatMap((list) => list.children);
      if (selector.includes('[data-tema]')) return [];
      return [];
    },
    querySelector() { return null; },
    createElement(tag) { return fakeElement('', tag); },
  };
  // O HTML real já possui o painel XP antes de qualquer transação. O harness
  // declara esses nós no baseline para não confundir reconciliação visual com
  // criação tardia causada pela própria simulação de modais.
  ['xpBar', 'xpBarCurrent', 'xpBarNext', 'xpProgressMarker', 'xpLevelLabel',
    'xpCurrentValue', 'xpThresholdValue', 'xpTexto'].forEach(getElement);
  const rollButton = fakeElement('btnRolarDado', 'button');
  fields.set('btnRolarDado', rollButton);
  body.appendChild(rollButton);
  const original = {
    nomePersonagem: 'Personagem base', jogador: 'Jogadora base', classeNivelID: '4',
    armas: [{ id: 'arma-base', arma_nome: 'Lança', arma_municao_id: 'mun-base', custom: { keep: true } }],
    municoes: [{ id: 'mun-base', nome: 'Dardo', customAmmo: { untouched: true } }],
    armaduras: [{ instanciaId: 'armor-base', armadura_nome: 'Couro' }],
    escudos: [{ escudo_nome: 'Escudo base', meta: { keep: true } }],
    outros: [{ id: 'other-base', outro_nome: 'Item base', meta: { keep: true } }],
    historiaDiarioAventura: [{ id: 'diary-base', titulo: 'Entrada base', texto: 'Texto base', extra: { keep: true } }],
  };
  const window = {
    document, personagem: JSON.parse(JSON.stringify(original)), confirm() { return true; },
    addEventListener(name, callback) {
      if (!windowListeners.has(name)) windowListeners.set(name, []);
      windowListeners.get(name).push(callback);
    },
  };
  const context = vm.createContext({
    document,
    window,
    personagem: JSON.parse(JSON.stringify(original)),
    configFicha: { custom: { classe: 'Base' }, plugin: { untouched: true } },
    estadoCombateIniciativa: { ativo: true, rodada: 5, posicao: 1, iniciativa: 17 },
    armaduraEquipadaIndice: 0,
    talentosEstruturados: { classe: [{ nome: 'Talento base', metadata: { keep: true } }] },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    obterSelecaoArmaEquipada() { return { indice: '', nome: '' }; },
    console: {
      error(...args) { errors.push(args.map((arg) => arg?.message || String(arg)).join(' ')); },
      warn(...args) { errors.push(args.map((arg) => arg?.message || String(arg)).join(' ')); },
      log() {},
    },
    Date, Promise, Map, Set, WeakSet, structuredClone,
    Event: class { constructor(type) { this.type = type; } },
    setTimeout, clearTimeout, requestAnimationFrame(callback) { callback(); },
    confirm() { return true; }, alert() {},
    armRestoreFailure() { restorationFailureArmed = true; },
    markAsyncEntered() {},
  });
  context.run = (source) => vm.runInContext(source, context);
  context.run(`
    window.__cancelarOperacoesModaisXPLevelUp = async () => ({ ok: true, cancelled: [], focusTarget: null });
    window.__cancelarModalSalvaguardaMorteParaImportacao = () => ({ ok: true, estavaAberto: false });
    window.__reconciliarModaisXPLevelUp = () => ({ ok: true });
  `);
  context.dispatchWindowEvent = (name, data) => {
    for (const callback of windowListeners.get(name) || []) callback({ data, source: {}, origin: 'https://untrusted.invalid' });
  };
  context.windowListenerCount = (name) => (windowListeners.get(name) || []).length;
  vm.runInContext(storageSource, context, { filename: 'js/core/storage.js' });
  vm.runInContext(talentsSource, context, { filename: 'js/modules/magias.js' });
  vm.runInContext(importSource, context, { filename: 'js/modules/importacao.js' });
  vm.runInContext(historySource, context, { filename: 'js/modules/historico.js' });
  equipmentFunctions.forEach((source, index) => vm.runInContext(source, context, { filename: `equipment-collector-${index}` }));
  context.run(`
    var lastSnapshotError = null;
    var lastCapturedOther = null;
    const captureSnapshotOriginal = capturarSnapshotImportacao;
    capturarSnapshotImportacao = () => {
      try {
        const captured = captureSnapshotOriginal();
        const find = (node, id) => node.no.id === id ? node : node.filhos.map((child) => find(child, id)).find(Boolean);
        const other = find(captured.arvoreDOM, 'listaOutros');
        lastCapturedOther = other?.filhos.map((child) => ({ id: child.no.id, dataId: child.no.dataset?.id }));
        return captured;
      }
      catch (error) { lastSnapshotError = error; throw error; }
    };
  `);
  context.markAsyncEntered = null;
  context.run(`
    var bloqueandoLevelUp = false;
    var generatedIdCounter = 0;
    gerarId = () => 'test-id-' + (++generatedIdCounter);
    normalizarConfigFicha = (config) => config ?? { custom: {} };
    normalizarIndiceEquipamento = (value) => value ?? null;
    aplicarTema = (tema) => { document.body.className = tema; eventLog.push('theme:' + tema); };
    atualizarInterfaceCombate = () => eventLog.push('combat-ui');
    garantirCampoSubclasseComoSelect = () => document.getElementById('subclasse');
    atualizarSubclasses = () => {};
    obterCampoRaca = () => document.getElementById('racaID');
    garantirOpcaoSelect = () => {};
    obterCampoSubraca = () => document.getElementById('subraca');
    atualizarSubracas = () => {};
    avisarCaracteristicaClasse = () => {};
    sincronizarArquivoCaracteristicaComClasse = () => {};
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
    atualizarFicha = () => eventLog.push('update-sheet');
    marcarFichaComoSalva = () => { ultimoEstadoSalvo = JSON.stringify(coletarDadosFicha()); eventLog.push('mark-clean'); };
    setXP = () => {};
    mostrarResultadoImportacao = (tipo, mensagem) => { lastUiResult = { tipo, mensagem }; };
    aguardarRenderizacaoModalImportacao = async () => {};
    aguardarTempoMinimoModalImportacao = async () => {};
    inicioModalImportacao = Date.now() - 1000;
    var lastUiResult = null;
    var asyncFinished = 0;
    var failAt = '';
    const makeCard = (listId, kind) => {
      const card = document.createElement('article');
      card.dataset.tipo = kind;
      if (kind === 'arma') {
        card.munitionSelect = document.createElement('select');
        card.munitionSelect.dataset.campo = 'arma_municao_id';
      }
      document.getElementById(listId).appendChild(card);
      return card;
    };
    adicionarNovoOutro = () => { const card = makeCard('listaOutros','outro'); card.dataset.id = gerarId(); return card; };
    adicionarNovaArma = () => { const card = makeCard('listaArmas','arma'); if (failAt === 'middle-card') throw new Error('injected mid-apply'); return card; };
    adicionarNovaArmadura = () => { const card = makeCard('listaArmaduras','armadura'); card.dataset.instanciaId = gerarId(); return card; };
    adicionarNovoEscudo = () => makeCard('listaEscudos','escudo');
    carregarCaracteristicasClasse = async () => { await Promise.resolve(); asyncFinished++; if (failAt === 'async-class') throw new Error('injected async class failure'); };
  `);
  context.eventLog = eventLog;
  context.fields = fields;
  context.lists = lists;
  context.errors = errors;
  context.body = body;
  for (const id of listIds) getElement(id);
  for (const id of ['nomePersonagem', 'jogador', 'classeNivelID', 'atrib_for', 'tema', 'caracteristicaClasseArquivo']) getElement(id);
  for (const [id, kind] of [['listaMunicoes','municao'], ['listaOutros','outro'], ['listaArmas','arma'], ['listaArmaduras','armadura'], ['listaEscudos','escudo']]) {
    const card = fakeElement(`old-${kind}`, 'container');
    card.dataset.tipo = kind;
    card.dataset.id = `old-${kind}-id`;
    lists.get(id).appendChild(card);
  }
  getElement('nomePersonagem').value = 'Personagem base';
  getElement('jogador').value = 'Jogadora base';
  getElement('classeNivelID').value = '4';
  context.run('marcarFichaComoSalva()');
  return context;
}

// Install the actual message-listener registrations from production modules
// when present. The callback behavior is exercised through dispatchWindowEvent
// below; this is intentionally not a textual assertion about source contents.
function optionalListenerRegistration(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start < 0) return '';
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Fim do registro do listener não encontrado após ${startMarker}`);
  return source.slice(start, end);
}

function installClassMessageListeners(harness) {
  const classListener = optionalListenerRegistration(
    classSource,
    'window.addEventListener("message", function (event) {',
    'window.carregarFicha = async function (personagem) {',
  );
  const cardListener = optionalListenerRegistration(
    classCardSource,
    'window.addEventListener("message", function (event) {',
    'function importarJSON() {',
  );
  harness.run(`
    var messageEffects = [];
    var dadosClasse = { nome: 'Classe anterior', marker: 'estado-anterior' };
    var aplicarDadosClasseNoCard = (data, classe) => {
      messageEffects.push({ kind: 'loadClassCardData', classe, data });
      dadosClasse = data;
      document.getElementById('classeCardTitle').textContent = data.nome || '';
    };
    var atualizarStatusCargaClasse = (message, type) => {
      messageEffects.push({ kind: 'status', message, type });
      document.getElementById('statusCargaClasse').textContent = message;
    };
    window.carregarCaracteristicasClasse = (classe, nivel, subclasse) => {
      messageEffects.push({ kind: 'applyClassFeatures', classe, nivel, subclasse });
      return Promise.resolve();
    };
  `);
  if (classListener) harness.run(classListener);
  if (cardListener) harness.run(cardListener);
  return { classListenerRegistered: !!classListener, cardListenerRegistered: !!cardListener };
}

function sendLegacyClassMessages(harness, suffix = 'atrasada') {
  harness.dispatchWindowEvent('message', {
    action: 'applyClassFeatures', classe: `mensagem-${suffix}`, nivel: 19,
    subclasse: `subclasse-${suffix}`, jsonData: { nome: `Classe apply ${suffix}` },
  });
  harness.dispatchWindowEvent('message', {
    action: 'loadClassCardData', classe: `mensagem-${suffix}`,
    jsonData: { nome: `Classe card ${suffix}`, marker: suffix },
  });
}

function installRealXPModes(harness) {
  harness.run(`
    class ElementForModalHarness {
      setAttribute(name, value) { this.attributes ??= {}; this.attributes[name] = String(value); }
      contains(node) { return this === node; }
    }
    var Element = ElementForModalHarness;
    window.DND_PERSONAGEM_OPTIONS = { subclasses: {}, regrasSubclasse: {}, subracas: {} };
    var modalDocumentListeners = new Map();
    document.addEventListener = (name, callback) => {
      if (!modalDocumentListeners.has(name)) modalDocumentListeners.set(name, []);
      modalDocumentListeners.get(name).push(callback);
    };
    document.removeEventListener = (name, callback) => {
      modalDocumentListeners.set(name, (modalDocumentListeners.get(name) || []).filter(item => item !== callback));
    };
    var modalTimerRecords = [];
    var modalTimerSequence = 0;
    const setTimeoutNativeForModalHarness = setTimeout;
    const clearTimeoutNativeForModalHarness = clearTimeout;
    setTimeout = (callback, delay = 0) => {
      const record = { id: ++modalTimerSequence, callback, delay, cleared: false, fired: false, nativeId: null };
      modalTimerRecords.push(record);
      if (delay === 0) {
        record.nativeId = setTimeoutNativeForModalHarness(() => {
          if (record.cleared) return;
          record.fired = true;
          callback();
        }, 0);
        return record.nativeId;
      }
      return record.id;
    };
    clearTimeout = id => {
      const record = modalTimerRecords.find(item => item.id === id || item.nativeId === id);
      if (record) {
        record.cleared = true;
        if (record.nativeId !== null) clearTimeoutNativeForModalHarness(record.nativeId);
      } else clearTimeoutNativeForModalHarness(id);
    };
    var fireUnclearedModalTimers = () => {
      for (const record of modalTimerRecords) {
        if (record.cleared || record.fired || record.delay === 0) continue;
        record.fired = true;
        record.callback();
      }
    };
    var activeModalTimerCount = () => modalTimerRecords.filter(item => !item.cleared && !item.fired).length;
    var keydownHandlerCount = () => (modalDocumentListeners.get('keydown') || []).length;
  `);
  harness.run(`
    const tabelaXP = [{ xp: 0, nivel: 1 }, { xp: 300, nivel: 2 }, { xp: 900, nivel: 3 }];
    const frasesXP = ['XP test'];
    const frasesLevelUP = ['Level Up test'];
    function calcularModCon() { const value = Number(document.getElementById('con').value) || 10; return Math.floor((value - 10) / 2); }
    function obterMaxDadoVidaFromString(dado) { return Number(String(dado || '').replace(/\\D/g, '')) || 8; }
    function criarBotaoHistoricoDado() { return ''; }
    function aplicarHistoricoDadoNoInput() {}
    pegarFraseXP = () => 'XP test';
    pegarFraseLevelUP = () => 'Level Up test';
    animarRolagemNoCampo = () => Promise.resolve({ resultados: [4] });
    window.__fichaImportacaoEpoch = 0;
    window.__fichaImportacaoTransacaoAtiva = null;
    document.getElementById('xp').value = '100';
    document.getElementById('dadosVidaTipo').value = 'd8';
    document.getElementById('con').value = '14';
    document.activeElement = document.getElementById('classeNivelID');
  `);
  harness.run(extractFunction(classFeatureSource, 'const operacoesModaisXPLevelUp = new Set();', '\n// Animação visual simples'));
  harness.run(extractFunction(classFeatureSource, 'function abrirModalAdicionarXP()', '\nfunction abrirModalLevelUp('));
  harness.run(extractFunction(classFeatureSource, 'function abrirModalLevelUp(', '\n// ===== Lógica de Cálculo de Vida e Dado de Vida ====='));
}

function ensureModalElements(harness) {
  const ids = [
    'xpAddModal', 'xpAddModalEpicPhrase', 'xpAddModalInput', 'xpAddModalConfirm',
    'xpAddModalCancel', 'xpAddModalClose', 'xpAddModalProgressBar', 'xpAddModalProgressFill',
    'xpAddModalProgressText', 'xpAddModalCurrent', 'xpAddModalTotal', 'xpAddModalMissing',
    'levelUpModal', 'levelUpFrase', 'levelUpInfo', 'inputVidaLevelUp', 'btnRolarDado',
    'modConTexto', 'levelUpBonusDetalhe', 'levelUpDadoDetalhe', 'levelUpTotalVida',
    'levelUpHistoricoVida', 'btnConfirmarLevelUp', 'classeNivelID', 'xp', 'dadosVidaTipo', 'con',
  ];
  for (const id of ids) harness.run(`document.getElementById(${JSON.stringify(id)})`);
}

function openRealXPAndLevelUpModals(harness) {
  ensureModalElements(harness);
  installRealXPModes(harness);
  const xpPromise = harness.run('abrirModalAdicionarXP()');
  const levelUpPromise = harness.run('abrirModalLevelUp({ nivelAnterior: 3, nivelAtual: 4, bonusProf: 2, dadoVida: "d8" })');
  let xpResolveCount = 0;
  let levelUpResolveCount = 0;
  const observedXp = xpPromise.then((value) => { xpResolveCount += 1; return value; });
  const observedLevelUp = levelUpPromise.then((value) => { levelUpResolveCount += 1; return value; });
  return { xpPromise, levelUpPromise, observedXp, observedLevelUp, getResolveCounts: () => [xpResolveCount, levelUpResolveCount] };
}

async function assertRealModalsCancelled(harness, operations, alreadyCancelled = false) {
  const result = await modalApiAccessors(harness).cancel();
  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.cancelled), alreadyCancelled ? [] : ['xp', 'levelUp']);
  assert.equal(await operations.observedXp, null);
  assert.equal(await operations.observedLevelUp, null);
  await Promise.resolve();
  assert.deepEqual(operations.getResolveCounts(), [1, 1]);
  const second = await modalApiAccessors(harness).cancel();
  assert.equal(second.ok, true);
  assert.deepEqual(Array.from(second.cancelled), []);
  assert.deepEqual(operations.getResolveCounts(), [1, 1]);
  assert.equal(harness.run("document.getElementById('xpAddModal').style.display"), 'none');
  assert.equal(harness.run("document.getElementById('levelUpModal').style.display"), 'none');
}

function modalApiAccessors(harness) {
  return {
    cancel() { return harness.run('window.__cancelarOperacoesModaisXPLevelUp()'); },
    reconcile() { return harness.run('window.__reconciliarModaisXPLevelUp({ focusTarget: document.activeElement })'); },
  };
}

function assertLegacyMessagesDidNotMutate(harness, before, effectsBefore = 0) {
  assert.equal(
    harness.run('messageEffects.length'), effectsBefore,
    'nenhum receptor legado deve executar efeitos durante o dispatch',
  );
  assert.equal(snapshot(harness), before, 'mensagens antigas não devem alterar DOM, dadosClasse, globals ou estado visual');
}

function snapshot(harness) {
  const snapshotElement = (element) => ({
    nodeType: element.nodeType,
    data: element.nodeType === 3 ? element.data : undefined,
    id: element.id, type: element.type, value: element.value,
    checked: element.checked, selected: element.selected, disabled: element.disabled,
    hidden: element.hidden, className: element.className,
    textContent: element.textContent, innerHTML: element.innerHTML,
    dataset: { ...element.dataset }, attributes: { ...element.attributes },
    children: element.nodeType === 3 ? [] : element.children.map(snapshotElement),
  });
  const globals = JSON.parse(harness.run(`JSON.stringify({
    personagem, windowPersonagem: window.personagem, configFicha,
    combate: estadoCombateIniciativa, armaduraEquipadaIndice,
    talentos: talentosEstruturados, diario: obterEventosDiarioAventuraParaSalvar(),
    diarioIndice: indiceEventoDiarioAberto, bloqueandoLevelUp,
    ultimoEstadoSalvo, houveInteracaoDuranteInicializacaoFicha,
    dirty: fichaFoiAlterada(),
    dadosClasse: typeof dadosClasse === 'undefined' ? '__ausente__' : dadosClasse,
    subclasseAtual: typeof subclasseAtual === 'undefined' ? '__ausente__' : subclasseAtual
  })`));
  return JSON.stringify({
    globals,
    fields: [...harness.fields.values()].filter((field) => field.isConnected).map(snapshotElement),
    lists: [...harness.lists.entries()].map(([id, list]) => [id, snapshotElement(list)]),
    theme: harness.body.className,
  });
}

function firstSnapshotDifference(before, after, pathName = '$') {
  if (before === after) return null;
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') {
    return `${pathName}: ${JSON.stringify(before)} !== ${JSON.stringify(after)}`;
  }
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(before, key) || !Object.prototype.hasOwnProperty.call(after, key)) {
      return `${pathName}.${key}: missing ${Object.prototype.hasOwnProperty.call(before, key) ? 'after' : 'before'}`;
    }
    const difference = firstSnapshotDifference(before[key], after[key], `${pathName}.${key}`);
    if (difference) return difference;
  }
  return null;
}

function observeResult(harness) {
  harness.run(`var completionResult;`);
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

async function aguardarAte(condicao, descricao) {
  for (let tentativa = 0; tentativa < 100; tentativa += 1) {
    if (condicao()) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  throw new Error(`Timeout aguardando ${descricao}`);
}

function iniciarImportacao(harness, payload, nomeResultado) {
  harness.payloadText = JSON.stringify(payload);
  return harness.run(`
    var ${nomeResultado};
    processarImportacao(payloadText, resultado => { ${nomeResultado} = resultado; });
  `);
}

function installClassLoaderFromProduction(harness, pendingLoads, timerSink = null) {
  harness.pendingLoads = pendingLoads;
  harness.run(`
    window.CARACTERISTICA_CLASSE_ARQUIVOS = ['caracteristica_mago.json'];
    var dadosClasse = null;
    var subclasseAtual = '';
    var normalizarTextoClasse = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    var obterSlugArquivoCaracteristica = value => normalizarTextoClasse(String(value || '').replace(/^caracteristica_/i, '').replace(/\\.(json|js)$/i, ''));
    var obterArquivoCaracteristicaPorClasse = () => 'caracteristica_mago.json';
    var sincronizarArquivoCaracteristicaComClasse = () => 'caracteristica_mago.json';
    var caminhoArquivoCaracteristica = value => './Classes/' + value;
    var mostrarCarregando = show => {
      const spinner = document.getElementById('classeSpinner');
      spinner.style.display = show ? 'block' : 'none';
    };
    var carregarJSONClasse = () => nextDeferredClasse();
    var definirCampoCaracteristicaAutomatico = (id, value) => { const field = document.getElementById(id); if (field) field.value = value; };
    var enviarClasseParaCard = (_classe, data) => {
      dadosClasse = data;
      document.getElementById('classeCardTitle').textContent = data.nome || '';
      eventLog.push('class-applied:' + (data.nome || ''));
    };
    var atualizarAtalhoConsultaCaracteristicaClasse = () => {};
    var mensagemImportacaoManualCaracteristica = () => 'Importar manualmente';
    var obterSubclassesCaracteristica = data => Object.keys(data?.subclasses || {});
    var encontrarSubclasseCaracteristica = () => '';
    var definirSubclasseCaracteristica = value => { subclasseAtual = String(value || ''); };
    var aplicarSubclasse = () => {};
    var extrairFeaturesSubclasse = () => [];
    var nextDeferredClasse = () => nextClassLoadFromHost();
  `);
  harness.nextClassLoadFromHost = () => {
    const next = pendingLoads.shift();
    if (!next) throw new Error('O teste não preparou uma carga deferred para a chamada de classe.');
    return next.promise;
  };
  if (timerSink) {
    harness.timerSink = timerSink;
    harness.run(`
      const setTimeoutRealForAsyncFenceTest = setTimeout;
      const clearTimeoutRealForAsyncFenceTest = clearTimeout;
      var timeoutIdAsyncFenceTest = 0;
      setTimeout = (callback, delay = 0) => {
        if (delay >= 5000) return captureAsyncFenceTimer(++timeoutIdAsyncFenceTest, callback, delay);
        return setTimeoutRealForAsyncFenceTest(callback, delay);
      };
      clearTimeout = id => {
        if (markAsyncFenceTimerCleared(id)) return;
        clearTimeoutRealForAsyncFenceTest(id);
      };
    `);
    harness.captureAsyncFenceTimer = (id, callback, delay) => {
      timerSink.push({ id, callback, delay, cleared: false });
      return id;
    };
    harness.markAsyncFenceTimerCleared = (id) => {
      const timer = timerSink.find(item => item.id === id);
      if (timer) timer.cleared = true;
      return !!timer;
    };
  }
  const helpers = extractFunction(
    classSource,
    'function novaGeracaoAvisoCaracteristicaClasse()',
    'function mensagemImportacaoManualCaracteristica()',
  );
  const importedDataValidator = extractFunction(
    classSource,
    'function validarDadosImportadosCaracteristica(',
    'function nivelCaracteristicaValor(',
  );
  const loader = extractFunction(
    classSource,
    'async function carregarCaracteristicasClasse(',
    'function popularTalentoLista(',
  );
  harness.run(helpers);
  harness.run(importedDataValidator);
  harness.run(loader);
}

async function importPayload(harness, payload) {
  harness.payloadText = JSON.stringify(payload);
  await harness.run(`processarImportacao(payloadText, result => { completionResult = result; })`);
}

function seedExportRequestForCharacterA(harness) {
  harness.run(`
    ultimaExportacaoSolicitadaFicha = {
      solicitadaEm: '2026-11-13T12:00:00.000Z',
      nomeArquivo: 'Personagem_A_Jogador_20261113.json',
    };
    atualizarStatusExportacao('Exportação solicitada ao navegador. Confirme se o arquivo foi salvo.');
  `);
}

test('importação válida limpa aviso e solicitação de exportação do personagem substituído', async () => {
  const harness = createHarness();
  seedExportRequestForCharacterA(harness);
  const dirtyBefore = harness.run('obterEstadoPersistenciaFicha().alteracoesPendentes');

  await importPayload(harness, {
    nomePersonagem: 'Personagem B',
    jogador: 'Jogador B',
    armas: [],
    municoes: [],
  });

  const persistence = JSON.parse(harness.run('JSON.stringify(obterEstadoPersistenciaFicha())'));
  const status = harness.run(`({ text: document.getElementById('exportacaoStatus').textContent, hidden: document.getElementById('exportacaoStatus').hidden })`);
  assert.equal(harness.run('completionResult.tipo'), 'sucesso');
  assert.equal(persistence.ultimaExportacaoSolicitada, null);
  assert.equal(persistence.ultimoBackupLocal, null);
  assert.equal(persistence.alteracoesPendentes, false);
  assert.notEqual(dirtyBefore, null);
  assert.equal(status.text, '');
  assert.equal(status.hidden, true);
});

test('rollback de importação falha preserva aviso e solicitação do personagem restaurado', async () => {
  const harness = createHarness();
  seedExportRequestForCharacterA(harness);
  const before = JSON.parse(harness.run('JSON.stringify(obterEstadoPersistenciaFicha())'));
  armFailure(harness, 'end-sync');

  await importPayload(harness, {
    nomePersonagem: 'Personagem B inválido na aplicação',
    jogador: 'Jogador B',
    armas: [],
    municoes: [],
  });

  const after = JSON.parse(harness.run('JSON.stringify(obterEstadoPersistenciaFicha())'));
  const status = harness.run(`({ text: document.getElementById('exportacaoStatus').textContent, hidden: document.getElementById('exportacaoStatus').hidden })`);
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(after.ultimaExportacaoSolicitada.nomeArquivo, before.ultimaExportacaoSolicitada.nomeArquivo);
  assert.equal(after.ultimaExportacaoSolicitada.solicitadaEm, before.ultimaExportacaoSolicitada.solicitadaEm);
  assert.equal(after.ultimoBackupLocal, before.ultimoBackupLocal);
  assert.equal(after.alteracoesPendentes, before.alteracoesPendentes);
  assert.match(status.text, /Exportação solicitada ao navegador/);
  assert.equal(status.hidden, false);
  assert.doesNotMatch(status.text, /importada com sucesso/i);
});

test('transação de importação suspende o debounce e agenda somente o snapshot final no sucesso', async () => {
  const harness = createHarness();
  harness.run(`
    window.__backupEvents = [];
    window.__suspenderBackupLocalAutomatico = () => window.__backupEvents.push('suspender');
    window.__retomarBackupLocalAutomatico = options => window.__backupEvents.push('retomar:' + options.persistir);
  `);

  await importPayload(harness, { nomePersonagem: 'Personagem B', jogador: 'Jogador B', armas: [], municoes: [] });

  assert.equal(harness.run('JSON.stringify(window.__backupEvents)'), '["suspender","retomar:true"]');
});

test('rollback retoma backup somente quando a restauração foi verificada', async () => {
  const harness = createHarness();
  harness.run(`
    window.__backupEvents = [];
    window.__suspenderBackupLocalAutomatico = () => window.__backupEvents.push('suspender');
    window.__retomarBackupLocalAutomatico = options => window.__backupEvents.push('retomar:' + options.persistir);
  `);
  armFailure(harness, 'end-sync');

  await importPayload(harness, { nomePersonagem: 'Personagem B', jogador: 'Jogador B', armas: [], municoes: [] });

  const events = JSON.parse(harness.run('JSON.stringify(window.__backupEvents)'));
  assert.equal(events[0], 'suspender');
  assert.match(events[1], /^retomar:(true|false)$/);
  if (harness.run('completionResult.rollbackComplete') === true) {
    assert.equal(events[1], 'retomar:true');
  }
});

for (const [phase, prepare] of [
  ['antes da importação', async () => ({ harness: createHarness() })],
  ['depois do rollback', async () => {
    const harness = createHarness();
    armFailure(harness, 'end-sync');
    await importPayload(harness, { nomePersonagem: 'Falha injetada', armas: [], municoes: [] });
    assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_UNVERIFIED');
    return { harness };
  }],
  ['depois de uma nova importação', async () => {
    const harness = createHarness();
    await importPayload(harness, { nomePersonagem: 'Ficha nova', armas: [], municoes: [] });
    assert.equal(harness.run('completionResult.tipo'), 'sucesso');
    return { harness };
  }],
]) {
  test(`E1.4-L: mensagens legadas não alteram ficha ${phase}`, async () => {
    const { harness } = await prepare();
    installClassMessageListeners(harness);
    const before = snapshot(harness);
    sendLegacyClassMessages(harness, phase);
    assertLegacyMessagesDidNotMutate(harness, before);
  });
}

test('E1.4-L: mensagens legadas durante importação pendente não alteram a ficha', async () => {
  const harness = createHarness();
  installClassMessageListeners(harness);
  const load = deferred();
  installClassLoaderFromProduction(harness, [load]);
  const importacao = iniciarImportacao(harness, {
    nomePersonagem: 'Importação em andamento', classeNomeID: 'mago', classeNivelID: 3,
    armas: [], municoes: [],
  }, 'resultadoDuranteMensagem');
  await aguardarAte(() => harness.run('window.__fichaImportacaoTransacaoAtiva') !== null, 'transação ativa');
  const before = snapshot(harness);
  const effectsBefore = harness.run('messageEffects.length');
  sendLegacyClassMessages(harness, 'durante');
  assertLegacyMessagesDidNotMutate(harness, before, effectsBefore);
  load.resolve({ nome: 'Mago', niveis: [], subclasses: {} });
  await importacao;
  assert.equal(harness.run('resultadoDuranteMensagem.tipo'), 'sucesso');
});

test('E1.4-L: mensagens repetidas e fora de ordem não alteram a ficha', () => {
  const harness = createHarness();
  installClassMessageListeners(harness);
  const before = snapshot(harness);
  harness.dispatchWindowEvent('message', {
    action: 'loadClassCardData', classe: 'subclasse tardia',
    jsonData: { nome: 'Resposta antiga', marcador: 'antiga' },
  });
  harness.dispatchWindowEvent('message', {
    action: 'applyClassFeatures', classe: 'mago', nivel: 20, subclasse: 'abjuracao',
  });
  sendLegacyClassMessages(harness, 'duplicada');
  assertLegacyMessagesDidNotMutate(harness, before);
});

test('E1.4-L: o caminho direto do carregador continua aplicando o card integrado', async () => {
  const harness = createHarness();
  const load = deferred();
  installClassLoaderFromProduction(harness, [load]);
  const operation = harness.run(`carregarCaracteristicasClasse('mago', 3, 'abjuracao')`);
  load.resolve({ nome: 'Mago direto', niveis: [], subclasses: { abjuracao: {} } });
  await operation;
  assert.equal(harness.run('dadosClasse.nome'), 'Mago direto');
  assert.equal(harness.run("document.getElementById('classeCardTitle').textContent"), 'Mago direto');
  assert.equal(harness.run("document.getElementById('classeData').value"), JSON.stringify({ nome: 'Mago direto', niveis: [], subclasses: { abjuracao: {} } }));
});

test('seleção e mudanças diretas de classe, nível e subclasse continuam chamando o carregador integrado', () => {
  const harness = createHarness();
  harness.run(`
    var directClassCalls = [];
    var sincronizarArquivoCaracteristicaComClasse = () => {};
    var carregarCaracteristicasClasse = (...args) => { directClassCalls.push(args); return Promise.resolve(); };
  `);
  const handler = extractFunction(
    classSource,
    'function handleClasseChange() {',
    '\n      // Adiciona event listeners',
  );
  harness.run(handler);
  const classe = harness.run("document.getElementById('classeNomeID')");
  const nivel = harness.run("document.getElementById('classeNivelID')");
  const subclasse = harness.run("document.getElementById('subclasse')");

  classe.value = 'mago';
  nivel.value = '3';
  subclasse.value = 'abjuracao';
  harness.run('handleClasseChange()');
  assert.deepEqual(JSON.parse(harness.run('JSON.stringify(directClassCalls[0])')), ['mago', 3, 'abjuracao']);

  classe.value = 'clerigo';
  nivel.value = '5';
  subclasse.value = 'vida';
  harness.run('handleClasseChange()');
  assert.deepEqual(JSON.parse(harness.run('JSON.stringify(directClassCalls[1])')), ['clerigo', 5, 'vida']);

  nivel.value = '6';
  subclasse.value = 'luz';
  harness.run('handleClasseChange()');
  assert.deepEqual(JSON.parse(harness.run('JSON.stringify(directClassCalls[2])')), ['clerigo', 6, 'luz']);
});

test('ação direta de aplicar no card chama carregarCaracteristicasClasse sem postMessage', () => {
  const harness = createHarness();
  harness.run(`
    var dadosClasse = { nome: 'Mago' };
    var directApplyCalls = [];
    var carregarCaracteristicasClasse = (...args) => { directApplyCalls.push(args); };
    document.getElementById('tituloClasse').textContent = 'Mago';
    document.getElementById('selectSubclasse').value = 'abjuracao';
    document.getElementById('classeNivelID').value = '4';
  `);
  harness.run(extractFunction(
    classCardSource,
    'function aplicarNaFicha() {',
    '\nfunction atualizarStatusCargaClasse',
  ));
  harness.run('aplicarNaFicha()');
  assert.deepEqual(JSON.parse(harness.run('JSON.stringify(directApplyCalls[0])')), ['mago', 4, 'abjuracao']);
});

test('importação manual por arquivo atualiza o card integrado pela função do módulo', () => {
  const harness = createHarness();
  harness.FileReader = class FakeFileReader {
    readAsText(file) {
      this.onload({ target: { result: file.contents } });
    }
  };
  harness.run(`
    var dadosClasse = null;
    var subclasseAtual = '';
    var montarTabela = () => {};
    var carregarSubclasses = () => {};
    var encontrarSubclasseCaracteristica = () => '';
    var definirSubclasseCaracteristica = value => { subclasseAtual = value; };
    var aplicarSubclasse = () => {};
    var atualizarStatusCargaClasse = (message, type) => {
      document.getElementById('statusCargaClasse').textContent = message + ':' + type;
    };
    var atualizarAtalhoConsultaCaracteristicaClasse = () => {};
    var mensagemImportacaoManualCaracteristica = () => 'Importar manualmente';
    window.__iniciarCarregamentoCardClasse = () => 1;
    window.__carregamentoCardClasseAtual = token => token === 1;
  `);
  for (const [start, end] of [
    ['function iniciarGeracaoCarregamentoCardClasse()', 'function carregamentoCardClasseContinuaAtual('],
    ['function carregamentoCardClasseContinuaAtual(', 'function inicializarCardClasse()'],
    ['function configurarImportacaoManualCard()', 'function aplicarNaFicha()'],
    ['function importarJSONNoCard(', 'function aplicarDadosClasseNoCard('],
  ]) harness.run(extractFunction(classCardSource, start, end));

  const fileInput = harness.run("document.getElementById('classeFileInput')");
  const selectArquivo = harness.run("document.getElementById('caracteristicaClasseArquivo')");
  harness.run(`
    document.getElementById('subclasse').value = '';
    document.getElementById('caracteristicaClasseSubclasse').value = '';
  `);
  harness.run('configurarImportacaoManualCard()');
  const data = { nome: 'Bardo manual', niveis: [{ nivel: 1, caracteristicas: 'Inspiração' }], subclasses: {} };
  fileInput.dispatchEvent({
    type: 'change',
    target: { files: [{ name: 'caracteristica_bardo.json', contents: JSON.stringify(data) }] },
  });
  assert.equal(harness.run('dadosClasse.nome'), 'Bardo manual');
  assert.equal(harness.run("document.getElementById('tituloClasse').textContent"), 'Bardo manual');
  assert.equal(selectArquivo.value, 'caracteristica_bardo.json');
  assert.equal(fileInput.value, '');
  assert.match(harness.run("document.getElementById('statusCargaClasse').textContent"), /Bardo manual.*sucesso/);
});

for (const incluirAuxiliares of [true, false]) {
  test(`importação de classe ${incluirAuxiliares ? 'com' : 'sem'} dados auxiliares preserva o comportamento direto`, async () => {
    const harness = createHarness();
    const load = deferred();
    installClassLoaderFromProduction(harness, [load]);
    const payload = {
      nomePersonagem: 'Importação com classe', classeNomeID: 'mago', classeNivelID: 3,
      armas: [], municoes: [],
    };
    if (incluirAuxiliares) {
      payload.classeData = JSON.stringify({ nome: 'mago', features: [{ name: 'Característica importada' }] });
      payload.subclasseData = JSON.stringify([{ name: 'Subclasse importada' }]);
    }
    const importacao = iniciarImportacao(harness, payload, `resultadoClasse${incluirAuxiliares}`);
    await aguardarAte(() => harness.run('window.__fichaImportacaoTransacaoAtiva') !== null, 'importação de classe');
    await aguardarAte(() => harness.pendingLoads.length === 0, 'início da carga de classe');
    load.reject(Object.assign(new Error('arquivo de classe indisponível'), { code: 'CARACTERISTICAS_CLASSE_INDISPONIVEIS' }));
    await importacao;
    assert.equal(harness.run(`resultadoClasse${incluirAuxiliares}.tipo`), 'sucesso');
    assert.equal(
      harness.run("document.getElementById('classeData').value"),
      incluirAuxiliares ? payload.classeData : '',
    );
    assert.equal(
      harness.run("document.getElementById('subclasseData').value"),
      incluirAuxiliares ? payload.subclasseData : '',
    );
  });
}

function armFailure(harness, point) {
  harness.run(`failAt = ${JSON.stringify(point)};`);
  if (point === 'start-theme') {
    harness.run(`aplicarTema = (tema) => { document.body.className = tema; throw new Error('injected start failure'); };`);
  } else if (point === 'middle-combat') {
    harness.run(`atualizarInterfaceCombate = () => { estadoCombateIniciativa.rodada = 999; throw new Error('injected middle failure'); };`);
  } else if (point === 'middle-card') {
    // The card constructor already inserts a new node before throwing.
  } else if (point === 'end-sync') {
    harness.run(`atualizarFicha = () => { document.getElementById('resumoTeste').value = 'imported'; throw new Error('injected end sync failure'); };`);
  } else if (point === 'async-class') {
    // The class loader stub rejects after an await, after the synchronous phase.
  } else if (point === 'async-weapon') {
    harness.run(`
      const baseAddWeapon = adicionarNovaArma;
      adicionarNovaArma = () => {
        const card = baseAddWeapon();
        card.munitionSelect.dispatchEvent = () => { throw new Error('injected weapon callback failure'); };
        return card;
      };
    `);
  }
}

for (const point of ['start-theme', 'middle-combat', 'middle-card', 'end-sync', 'async-class', 'async-weapon']) {
  test(`falha ${point} restaura estado completo e baseline dirty`, async () => {
    const harness = createHarness();
    observeResult(harness);
    harness.run(`document.getElementById('jogador').value = 'edição ainda não salva';`);
    armFailure(harness, point);
    const before = snapshot(harness);
    await importPayload(harness, {
      tema: 'tema-escuro', nomePersonagem: 'Personagem importado', jogador: 'Importada',
      estadoCombate: { ativo: false },
      armas: [{ id: 'arma-nova', arma_nome: 'Besta', arma_municao_id: 'mun-nova' }],
      municoes: [{ id: 'mun-nova', nome: 'Virote', extra: { preserved: true } }],
      armaduras: [{ instanciaId: 'armor-new', armadura_nome: 'Cota' }],
      escudos: [{ escudo_nome: 'Escudo novo' }],
      outros: [{ id: 'other-new', outro_nome: 'Item novo' }],
      historiaDiarioAventura: [{ id: 'diary-new', titulo: 'Novo diário', texto: 'x', meta: { keep: true } }],
      talentosEstruturados: { classe: [{ nome: 'Nova característica', custom: { keep: true } }] },
      configFicha: { custom: { classe: 'Nova' }, plugin: { keep: true } },
    });
    restorationFailureArmed = false;
    assert.equal(harness.run('completionResult.tipo'), 'erro');
    const after = snapshot(harness);
    const difference = firstSnapshotDifference(JSON.parse(before), JSON.parse(after));
    assert.equal(difference, null, `${point}: ${difference}; resultado=${JSON.stringify(harness.run('completionResult'))}; capturedOther=${JSON.stringify(harness.run('lastCapturedOther'))}; restoredOther=${JSON.stringify({ id: harness.lists.get('listaOutros').children[0]?.id, attributes: harness.lists.get('listaOutros').children[0]?.attributes })}`);
    assert.equal(harness.run('bloqueandoLevelUp'), false);
  });
}

test('importações bem-sucedidas consecutivas não deixam snapshot anterior preso', async () => {
  const harness = createHarness();
  observeResult(harness);
  await importPayload(harness, { nomePersonagem: 'Primeira', jogador: 'A', armas: [], municoes: [] });
  assert.equal(harness.run('completionResult.tipo'), 'sucesso', JSON.stringify(harness.run('completionResult')));
  await importPayload(harness, { nomePersonagem: 'Segunda', jogador: 'B', armas: [], municoes: [] });
  assert.equal(harness.run('completionResult.tipo'), 'sucesso', JSON.stringify(harness.run('completionResult')));
  assert.equal(harness.run('personagem.nomePersonagem'), 'Segunda');
  assert.equal(harness.run('window.personagem.nomePersonagem'), 'Segunda');
  assert.equal(harness.run('fichaFoiAlterada()'), false);
});

test('falha em ficha inicialmente limpa restaura também o estado limpo', async () => {
  const harness = createHarness();
  observeResult(harness);
  assert.equal(harness.run('fichaFoiAlterada()'), false);
  armFailure(harness, 'middle-combat');
  const before = snapshot(harness);
  await importPayload(harness, {
    nomePersonagem: 'Não deve ficar',
    estadoCombate: { ativo: false, rodada: 0, posicao: null, iniciativa: null },
  });
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(snapshot(harness), before);
  assert.equal(harness.run('fichaFoiAlterada()'), false);
});

test('falha após uma importação bem-sucedida restaura a última ficha aplicada', async () => {
  const harness = createHarness();
  observeResult(harness);
  await importPayload(harness, { nomePersonagem: 'Última válida', jogador: 'Base', armas: [], municoes: [] });
  assert.equal(harness.run('completionResult.tipo'), 'sucesso', JSON.stringify(harness.run('completionResult')));
  const before = snapshot(harness);
  armFailure(harness, 'end-sync');
  await importPayload(harness, { nomePersonagem: 'Tentativa com falha', jogador: 'Outra', armas: [] });
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  const after = snapshot(harness);
  assert.equal(after, before, firstSnapshotDifference(JSON.parse(before), JSON.parse(after)));
});

test('falha após importar ficha legada incompleta restaura estado prévio e metadados', async () => {
  const harness = createHarness();
  observeResult(harness);
  armFailure(harness, 'end-sync');
  const before = snapshot(harness);
  await importPayload(harness, { nomePlayer: 'Legada parcial', plugin: { custom: [null, 'x'] } });
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(snapshot(harness), before);
});

test('rollback restaura dadosClasse explicitamente null após callback assíncrono falhar', async () => {
  const harness = createHarness();
  observeResult(harness);
  harness.run(`
    dadosClasse = null;
    carregarCaracteristicasClasse = async () => {
      dadosClasse = { parcialmenteCarregada: true };
      throw new Error('falha no callback irmão');
    };
  `);

  await importPayload(harness, { classeNomeID: 'mago', classeNivelID: 3 });

  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(harness.run('typeof dadosClasse'), 'object');
  assert.equal(harness.run('dadosClasse'), null);
});

test('rollback de falha assíncrona aguarda tarefas pendentes e preserva vínculos arma-munição', async () => {
  const harness = createHarness();
  observeResult(harness);
  let releaseFirst;
  let markEntered;
  const entered = new Promise((resolve) => { markEntered = resolve; });
  const pending = new Promise((resolve) => { releaseFirst = resolve; });
  harness.pendingFirst = pending;
  harness.markAsyncEntered = markEntered;
  harness.run(`
    failAt = 'async-class';
    carregarCaracteristicasClasse = async () => { markAsyncEntered(); await pendingFirst; asyncFinished++; throw new Error('late async failure'); };
  `);
  const before = snapshot(harness);
  const running = importPayload(harness, {
    armas: [{ id: 'new-weapon', arma_nome: 'Besta', arma_municao_id: 'new-ammo' }],
    municoes: [{ id: 'new-ammo', nome: 'Virote' }],
  });
  await entered;
  assert.notEqual(snapshot(harness), before, 'o teste alcança estado parcialmente aplicado enquanto aguarda');
  releaseFirst();
  await running;
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(snapshot(harness), before);
  assert.equal(harness.run('personagem.armas[0].arma_municao_id'), 'mun-base');
  assert.equal(harness.run('personagem.municoes[0].id'), 'mun-base');
});

test('falha durante o rollback é reportada como recuperação incompleta', async () => {
  const harness = createHarness();
  observeResult(harness);
  harness.run(`
    failAt = 'end-sync';
    atualizarFicha = () => { armRestoreFailure(); throw new Error('apply failure before rollback'); };
  `);
  await importPayload(harness, { nomePersonagem: 'Importada parcialmente' });
  restorationFailureArmed = false;
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_FAILED');
  assert.equal(harness.run('completionResult.rollbackComplete'), false);
  assert.match(harness.run('completionResult.mensagem'), /recuper|restaur|parcial/i);
});

test('callback de classe iniciado fora da transação não grava após rollback e libera o spinner obsoleto', async () => {
  const harness = createHarness();
  const cargaExterna = deferred();
  installClassLoaderFromProduction(harness, [cargaExterna]);

  const callbackAntigo = harness.run(`carregarCaracteristicasClasse('mago', 3, '')`);
  await Promise.resolve();
  assert.equal(harness.run("document.getElementById('classeSpinner').style.display"), 'block');
  armFailure(harness, 'middle-combat');
  await importPayload(harness, { nomePersonagem: 'Import parcial rejeitada', estadoCombate: { ativo: false } });
  assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_UNVERIFIED', `DIAG ${harness.errors.join(' | ')}`);
  assert.equal(harness.run('completionResult.rollbackComplete'), false);
  assert.equal(harness.run('completionResult.verificacaoPosReconciliacao.valido'), true,
    'o spinner deve estar oculto no checkpoint pós-reconciliação');

  cargaExterna.resolve({ nome: 'Classe obsoleta', niveis: [] });
  await callbackAntigo;
  assert.equal(harness.run('dadosClasse'), null);
  assert.equal(harness.run("document.getElementById('classeCardTitle').textContent"), '');
  assert.equal(harness.run("document.getElementById('classeSpinner').style.display"), 'none');
});

test('callback de classe antigo concluído após nova importação não sobrescreve a ficha importada', async () => {
  const harness = createHarness();
  const cargaAntiga = deferred();
  const cargaImportada = deferred();
  const cargas = [cargaAntiga, cargaImportada];
  installClassLoaderFromProduction(harness, cargas);

  const callbackAntigo = harness.run(`carregarCaracteristicasClasse('mago', 2, '')`);
  await Promise.resolve();
  const importacaoNova = iniciarImportacao(harness, {
    nomePersonagem: 'Ficha nova', classeNomeID: 'mago', classeNivelID: 3,
    armas: [], municoes: [],
  }, 'resultadoNova');
  await aguardarAte(() => cargas.length === 0, 'início da carga da classe importada');
  cargaImportada.resolve({ nome: 'Classe da ficha nova', niveis: [] });
  await importacaoNova;
  assert.equal(harness.run('resultadoNova.tipo'), 'sucesso', JSON.stringify(harness.run('resultadoNova')));
  const estadoNovo = snapshot(harness);

  cargaAntiga.resolve({ nome: 'Classe antiga atrasada', niveis: [] });
  await callbackAntigo;
  assert.equal(snapshot(harness), estadoNovo, 'o callback anterior não deve tocar no DOM ou nos dados da nova ficha');
  assert.equal(harness.run('dadosClasse.nome'), 'Classe da ficha nova');
  assert.equal(harness.run("document.getElementById('classeCardTitle').textContent"), 'Classe da ficha nova');
});

test('duas importações assíncronas concorrentes não intercalam aplicação', async () => {
  const harness = createHarness();
  const cargaPrimeira = deferred();
  installClassLoaderFromProduction(harness, [cargaPrimeira]);

  const primeira = iniciarImportacao(harness, {
    nomePersonagem: 'Primeira', classeNomeID: 'mago', classeNivelID: 2,
    armas: [], municoes: [],
  }, 'resultadoPrimeira');
  await aguardarAte(() => harness.run('window.__fichaImportacaoTransacaoAtiva') !== null, 'ativação da primeira importação');
  const segunda = iniciarImportacao(harness, {
    nomePersonagem: 'Segunda', armas: [], municoes: [],
  }, 'resultadoSegunda');
  await segunda;
  assert.equal(harness.run('resultadoSegunda.codigo'), 'CHARACTER_SHEET_IMPORT_BUSY');
  assert.equal(harness.run('personagem.nomePersonagem'), 'Primeira');
  cargaPrimeira.resolve({ nome: 'Classe primeira', niveis: [] });
  await primeira;
  assert.equal(harness.run('resultadoPrimeira.tipo'), 'sucesso', JSON.stringify(harness.run('resultadoPrimeira')));
  assert.equal(harness.run('personagem.nomePersonagem'), 'Primeira');
  assert.equal(harness.run('fichaFoiAlterada()'), false);
});

test('importação não informa sucesso antes de concluir a tarefa assíncrona rastreável', async () => {
  const harness = createHarness();
  const cargaClasse = deferred();
  installClassLoaderFromProduction(harness, [cargaClasse]);
  const cleanBefore = harness.eventLog.filter((entry) => entry === 'mark-clean').length;

  const importacao = iniciarImportacao(harness, {
    nomePersonagem: 'Ficha com carga pendente', classeNomeID: 'mago', classeNivelID: 2,
    armas: [], municoes: [],
  }, 'resultadoRastreavel');
  await aguardarAte(() => harness.run('window.__fichaImportacaoTransacaoAtiva') !== null, 'tarefa rastreável da classe');
  assert.equal(harness.run('typeof resultadoRastreavel'), 'undefined');
  assert.equal(harness.eventLog.filter((entry) => entry === 'mark-clean').length, cleanBefore);

  cargaClasse.resolve({ nome: 'Classe concluída', niveis: [] });
  await importacao;
  assert.equal(harness.run('resultadoRastreavel.tipo'), 'sucesso');
  assert.equal(harness.run('dadosClasse.nome'), 'Classe concluída');
  assert.ok(harness.eventLog.indexOf('class-applied:Classe concluída') < harness.eventLog.lastIndexOf('mark-clean'));
  assert.equal(await harness.run('window.__aguardarFimImportacaoFicha()'), null);
});

test('timer de aviso antigo disparado depois do rollback não remove o aviso restaurado', async () => {
  const harness = createHarness();
  const timers = [];
  installClassLoaderFromProduction(harness, [], timers);
  harness.run(`avisarCaracteristicaClasse('Aviso anterior preservado', 'info');`);
  const timerAntigo = timers.at(-1);
  const aviso = harness.run("document.getElementById('caracteristicaClasseAviso')");
  assert.ok(timerAntigo);

  armFailure(harness, 'end-sync');
  await importPayload(harness, { nomePersonagem: 'Falha após aviso' });
  assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_UNVERIFIED');
  assert.equal(harness.run("document.getElementById('caracteristicaClasseAviso').textContent"), 'Aviso anterior preservado');
  assert.equal(harness.run("document.getElementById('caracteristicaClasseAviso')"), aviso);

  timerAntigo.callback();
  assert.equal(harness.run("document.getElementById('caracteristicaClasseAviso')"), aviso);
  assert.equal(aviso.isConnected, true);
  assert.equal(aviso.textContent, 'Aviso anterior preservado');
});

test('Level Up aguardando confirmação não altera HP depois de uma importação', async () => {
  const harness = createHarness();
  const modal = deferred();
  harness.run(`
    var calcularBonusProf = () => 2;
    var calcularModCon = () => 3;
    var abrirModalLevelUp = () => pendingLevelUpModal;
  `);
  harness.pendingLevelUpModal = modal.promise;
  harness.run(extractFunction(classFeatureSource, 'async function processarLevelUp(', '\n// 🔥 para testes rápidos'));
  harness.fields.get('pvTotal') || harness.run("document.getElementById('pvTotal')");
  harness.run("document.getElementById('pvTotal').value = '44';");
  const levelUp = harness.run('processarLevelUp(1, 2)');
  await Promise.resolve();

  await importPayload(harness, { nomePersonagem: 'Importou durante Level Up', pvTotal: 91, armas: [], municoes: [] });
  assert.equal(harness.run("document.getElementById('pvTotal').value"), '91');
  modal.resolve(8);
  await levelUp;
  assert.equal(harness.run("document.getElementById('pvTotal').value"), '91');
});

test('modal de XP aguardando confirmação não altera XP depois da importação', async () => {
  const harness = createHarness();
  const modal = deferred();
  const marker = 'document.getElementById("btnAddXP").addEventListener("click", async () => {';
  const bodyStart = classFeatureSource.indexOf(marker);
  const nextHandler = classFeatureSource.indexOf('document.getElementById("xp").addEventListener', bodyStart);
  const bodyEnd = classFeatureSource.lastIndexOf('  });', nextHandler);
  assert.notEqual(bodyStart, -1, 'handler do botão XP precisa existir');
  assert.notEqual(bodyEnd, -1, 'fim do handler XP precisa ser localizável');
  const handlerBody = classFeatureSource.slice(bodyStart + marker.length, bodyEnd);
  harness.run(`
    var tabelaXP = [{ xp: 0, nivel: 1 }, { xp: 100, nivel: 2 }];
    var abrirModalAdicionarXP = () => pendingXpModal;
    var atualizarXPENivel = () => {};
    var xpSetCalls = 0;
    var setXP = value => { xpSetCalls++; document.getElementById('xp').value = String(value); };
    var xpClickHandler = async () => { ${handlerBody} };
  `);
  harness.pendingXpModal = modal.promise;
  harness.run("document.getElementById('xp').value = '10';");
  const pendingXPAction = harness.run('xpClickHandler()');
  await Promise.resolve();

  await importPayload(harness, { nomePersonagem: 'Import durante modal XP', xp: 50, armas: [], municoes: [] });
  assert.equal(harness.run("document.getElementById('xp').value"), '50');
  const chamadasDepoisDaImportacao = harness.run('xpSetCalls');
  modal.resolve(25);
  await pendingXPAction;
  assert.equal(harness.run('xpSetCalls'), chamadasDepoisDaImportacao);
  assert.equal(harness.run("document.getElementById('xp').value"), '50');
});

test('E1.4-M: cancelamento real resolve XP e Level Up uma vez e remove handlers e timers', async () => {
  const harness = createHarness();
  const operations = openRealXPAndLevelUpModals(harness);
  assert.equal(harness.run("document.getElementById('xpAddModal').style.display"), 'flex');
  assert.equal(harness.run("document.getElementById('levelUpModal').style.display"), 'flex');
  assert.ok(harness.run('keydownHandlerCount()') >= 1);
  await assertRealModalsCancelled(harness, operations);
  assert.equal(harness.run('keydownHandlerCount()'), 0);
  assert.equal(harness.run('activeModalTimerCount()'), 0);
  assert.equal(harness.run("document.getElementById('xpAddModalConfirm').listeners.get('click').length"), 0);
  assert.equal(harness.run("document.getElementById('xpAddModalCancel').listeners.get('click').length"), 0);
  assert.equal(harness.run("document.getElementById('xpAddModalClose').listeners.get('click').length"), 0);
  assert.equal(harness.run("document.getElementById('btnConfirmarLevelUp').onclick"), null);
  assert.equal(harness.run("document.getElementById('btnRolarDado').onclick"), null);
  assert.equal(harness.run("document.getElementById('inputVidaLevelUp').oninput"), null);
});

test('E1.4-M: callback de animação XP já capturado não altera estado após cancelamento', async () => {
  const harness = createHarness();
  const operations = openRealXPAndLevelUpModals(harness);
  harness.run(`
    document.getElementById('xpAddModalInput').value = '10';
    document.getElementById('xpAddModalConfirm').listeners.get('click')[0]();
    var capturedOldXpTimer = modalTimerRecords.find(record => record.delay === 650).callback;
  `);
  await assertRealModalsCancelled(harness, operations);
  const before = snapshot(harness);
  harness.run('capturedOldXpTimer()');
  assert.equal(snapshot(harness), before);
  assert.equal(harness.run("document.getElementById('xpAddModal').style.display"), 'none');
  assert.equal(harness.run('activeModalTimerCount()'), 0);
});

test('E1.4-M: JSON inválido não cancela operações XP ou Level Up pendentes', async () => {
  const harness = createHarness();
  const operations = openRealXPAndLevelUpModals(harness);
  harness.run(`
    var modalCancelCalls = 0;
    const actualModalCancel = window.__cancelarOperacoesModaisXPLevelUp;
    window.__cancelarOperacoesModaisXPLevelUp = async () => {
      modalCancelCalls++;
      return actualModalCancel();
    };
  `);
  harness.payloadText = '{ JSON inválido';
  await harness.run(`processarImportacao(payloadText, result => { invalidImportResult = result; });`);
  assert.equal(harness.run('modalCancelCalls'), 0);
  assert.equal(harness.run('invalidImportResult.tipo'), 'erro');
  assert.equal(harness.run("document.getElementById('xpAddModal').style.display"), 'flex');
  assert.equal(harness.run("document.getElementById('levelUpModal').style.display"), 'flex');
  // Cleanup is explicit so the fake modal operations do not leak into later test activity.
  await assertRealModalsCancelled(harness, operations);
});

test('E1.4-M: transação cancela modais após snapshot e antes da aplicação', async () => {
  const harness = createHarness();
  const operations = openRealXPAndLevelUpModals(harness);
  harness.run(`
    var modalTransactionOrder = [];
    const snapshotForModalOrder = capturarSnapshotImportacao;
    capturarSnapshotImportacao = (...args) => { modalTransactionOrder.push('snapshot'); return snapshotForModalOrder(...args); };
    const cancelForModalOrder = window.__cancelarOperacoesModaisXPLevelUp;
    window.__cancelarOperacoesModaisXPLevelUp = async (...args) => { modalTransactionOrder.push('cancel'); return cancelForModalOrder(...args); };
    window.__cancelarModalSalvaguardaMorteParaImportacao = () => { modalTransactionOrder.push('cancel-death-save'); return { ok: true, estavaAberto: true }; };
    const applyForModalOrder = aplicarDadosFichaSemTransacao;
    aplicarDadosFichaSemTransacao = async (...args) => { modalTransactionOrder.push('apply'); return applyForModalOrder(...args); };
  `);
  await importPayload(harness, {
    nomePersonagem: 'Importação com modais', tema: 'tema-claro',
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('completionResult.tipo'), 'sucesso', JSON.stringify(harness.run('completionResult')));
  const order = Array.from(harness.run('modalTransactionOrder'));
  assert.ok(order.indexOf('snapshot') >= 0);
  assert.ok(order.indexOf('cancel') > order.indexOf('snapshot'));
  assert.ok(order.indexOf('cancel-death-save') > order.indexOf('cancel'));
  assert.ok(order.indexOf('apply') > order.indexOf('cancel-death-save'));
  await assertRealModalsCancelled(harness, operations, true);
});

test('E1.4-J: falha ao cancelar salvaguarda aborta a aplicação sem confirmar sucesso', async () => {
  const harness = createHarness();
  harness.run(`
    var applyCallsBeforeDeathSaveCancel = 0;
    window.__cancelarModalSalvaguardaMorteParaImportacao = () => ({ ok: false, estavaAberto: true });
    const originalApplyForDeathSaveCancel = aplicarDadosFichaSemTransacao;
    aplicarDadosFichaSemTransacao = async (...args) => { applyCallsBeforeDeathSaveCancel++; return originalApplyForDeathSaveCancel(...args); };
  `);
  await importPayload(harness, {
    nomePersonagem: 'Não deve aplicar', armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.match(harness.run('completionResult.erroAplicacao'), /modal de salvaguarda contra a morte/i);
  assert.equal(harness.run('applyCallsBeforeDeathSaveCancel'), 0);
  assert.notEqual(harness.run('completionResult.rollbackComplete'), true);
});

test('E1.4-M: uma continuação XP que tenta abrir Level Up durante o drain é rejeitada sem mutação', async () => {
  const harness = createHarness();
  ensureModalElements(harness);
  installRealXPModes(harness);
  const xpPromise = harness.run('abrirModalAdicionarXP()');
  let lateLevelUpPromise;
  xpPromise.then(() => {
    lateLevelUpPromise = harness.run('abrirModalLevelUp({ nivelAnterior: 3, nivelAtual: 4, bonusProf: 2, dadoVida: "d8" })');
  });
  await importPayload(harness, {
    nomePersonagem: 'Importação durante fechamento XP', tema: 'tema-claro',
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('completionResult.tipo'), 'sucesso', JSON.stringify(harness.run('completionResult')));
  assert.ok(lateLevelUpPromise, 'a continuação XP tentou abrir Level Up durante o fechamento');
  assert.equal(await lateLevelUpPromise, null);
  assert.equal(harness.run("document.getElementById('levelUpModal').style.display"), 'none');
  assert.equal(harness.run("document.getElementById('btnConfirmarLevelUp').onclick"), undefined);
  assert.equal(harness.run('keydownHandlerCount()'), 0);
});

test('E1.4-M: rollback reconcilia XP e Level Up fechados e mantém diagnóstico conservador', async () => {
  const harness = createHarness();
  harness.run("document.getElementById('xpBar')");
  const operations = openRealXPAndLevelUpModals(harness);
  harness.run(`
    document.getElementById('xpAddModalProgressFill').classList.add('xp-glow');
    document.getElementById('xpAddModalProgressFill').style.transition = 'width 800ms ease';
    document.getElementById('xpBarCurrent').style.transition = 'width 600ms ease';
    document.getElementById('xpBarNext').style.transition = 'width 800ms ease';
    document.getElementById('btnRolarDado').classList.add('rolando');
  `);
  armFailure(harness, 'end-sync');
  await importPayload(harness, {
    nomePersonagem: 'Importação que falha', tema: 'tema-escuro',
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_UNVERIFIED');
  assert.equal(harness.run('completionResult.snapshotRestored'), true);
  assert.equal(harness.run('completionResult.verificacaoSnapshot.valido'), true);
  assert.equal(harness.run('completionResult.verificacaoPosReconciliacao.classificacao'), 'restaurado_em_janela_observada');
  assert.equal(harness.run('completionResult.verificacaoPosReconciliacao.sentinelasDeListaConfirmados'), false);
  assert.ok(harness.run('completionResult.verificacaoPosReconciliacao.estadosNaoVerificaveis.length') > 0);
  assert.equal(harness.run('completionResult.rollbackComplete'), false);
  const residualWriters = Array.from(harness.run('completionResult.tarefasAssincronasNaoCercadas'));
  assert.ok(residualWriters.length > 0, 'o diagnóstico deve preservar os writers residuais não comprovadamente drenados');
  assert.equal(residualWriters.some((writer) => /postmessage|applyclassfeatures|loadclasscarddata/i.test(writer)), false);
  await assertRealModalsCancelled(harness, operations, true);
  assert.equal(harness.run("document.getElementById('xpAddModal').getAttribute('aria-hidden')"), 'true');
  assert.equal(harness.run("document.getElementById('levelUpModal').getAttribute('aria-hidden')"), 'true');
  assert.equal(harness.run("document.getElementById('xpAddModalProgressFill').classList.contains('xp-glow')"), false);
  assert.equal(harness.run("document.getElementById('xpAddModalProgressFill').style.transition"), '');
  assert.equal(harness.run("document.getElementById('xpBarCurrent').style.transition"), '');
  assert.equal(harness.run("document.getElementById('xpBarNext').style.transition"), '');
  assert.equal(harness.run("document.getElementById('btnRolarDado').classList.contains('rolando')"), false);
});

test('E1.4-M: reabertura manual após importação é permitida e reconciliação não fecha outros modais', async () => {
  const harness = createHarness();
  const operations = openRealXPAndLevelUpModals(harness);
  await importPayload(harness, {
    nomePersonagem: 'Importação seguida de reabertura', tema: 'tema-claro',
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  await assertRealModalsCancelled(harness, operations, true);
  const reopened = harness.run('abrirModalAdicionarXP()');
  assert.equal(harness.run("document.getElementById('xpAddModal').style.display"), 'flex');
  const unrelated = harness.run("document.getElementById('externalUnrelatedModal')");
  unrelated.style.display = 'flex';
  const reconciled = modalApiAccessors(harness).reconcile();
  assert.equal(reconciled.ok, true);
  assert.equal(harness.run("document.getElementById('xpAddModal').style.display"), 'none');
  assert.equal(harness.run("document.getElementById('externalUnrelatedModal').style.display"), 'flex');
  const cleanup = await modalApiAccessors(harness).cancel();
  assert.equal(cleanup.ok, true);
  assert.deepEqual(Array.from(cleanup.cancelled), ['xp']);
  assert.equal(await reopened, null);
});

test('E1.4-M: cancelamento não comprovado impede aplicação e não declara rollback completo', async () => {
  const harness = createHarness();
  const operations = openRealXPAndLevelUpModals(harness);
  harness.run(`
    var modalApplyCalls = 0;
    const applyBeforeCancelFailure = aplicarDadosFichaSemTransacao;
    aplicarDadosFichaSemTransacao = async (...args) => { modalApplyCalls++; return applyBeforeCancelFailure(...args); };
    const cancelBeforeFailure = window.__cancelarOperacoesModaisXPLevelUp;
    window.__cancelarOperacoesModaisXPLevelUp = async () => {
      await cancelBeforeFailure();
      return { ok: false, cancelled: ['xp', 'levelUp'], focusTarget: null };
    };
  `);
  await importPayload(harness, {
    nomePersonagem: 'Cancelamento não comprovado', tema: 'tema-claro',
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('modalApplyCalls'), 0);
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_UNVERIFIED');
  assert.equal(harness.run('completionResult.snapshotRestored'), true);
  assert.equal(harness.run('completionResult.rollbackComplete'), false);
  assert.ok(Array.from(harness.run('completionResult.tarefasAssincronasNaoCercadas'))
    .some((writer) => /cancelamento.*XP\/Level Up/i.test(writer)));
  harness.run('window.__cancelarOperacoesModaisXPLevelUp = cancelBeforeFailure');
  await assertRealModalsCancelled(harness, operations, true);
});

test('E1.4-M: rejeição do cancelador impede a aplicação e mantém resultado conservador', async () => {
  const harness = createHarness();
  const operations = openRealXPAndLevelUpModals(harness);
  harness.run(`
    var modalApplyCalls = 0;
    aplicarDadosFichaSemTransacao = async (...args) => { modalApplyCalls++; return args; };
    const cancelBeforeRejection = window.__cancelarOperacoesModaisXPLevelUp;
    window.__cancelarOperacoesModaisXPLevelUp = async () => { throw new Error('drain rejeitado'); };
  `);
  await importPayload(harness, {
    nomePersonagem: 'Cancelador rejeitado', tema: 'tema-claro',
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('modalApplyCalls'), 0);
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_UNVERIFIED');
  assert.equal(harness.run('completionResult.snapshotRestored'), true);
  assert.equal(harness.run('completionResult.rollbackComplete'), false);
  harness.run('window.__cancelarOperacoesModaisXPLevelUp = cancelBeforeRejection');
  await assertRealModalsCancelled(harness, operations);
});

test('E1.4-M: falha na reconciliação visual não informa sucesso e tenta recuperação', async () => {
  const harness = createHarness();
  const operations = openRealXPAndLevelUpModals(harness);
  harness.run(`
    var reconcileAttempts = 0;
    const reconcileBeforeInjectedFailure = window.__reconciliarModaisXPLevelUp;
    window.__reconciliarModaisXPLevelUp = (...args) => {
      reconcileAttempts++;
      if (reconcileAttempts === 1) return { ok: false, error: new Error('falha visual injetada') };
      return reconcileBeforeInjectedFailure(...args);
    };
  `);
  await importPayload(harness, {
    nomePersonagem: 'Reconciliação visual falha', tema: 'tema-claro',
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_UNVERIFIED');
  assert.equal(harness.run('completionResult.snapshotRestored'), true);
  assert.equal(harness.run('completionResult.rollbackComplete'), false);
  assert.equal(harness.run('reconcileAttempts'), 2, 'o rollback tenta reconciliar novamente após restaurar o snapshot');
  await assertRealModalsCancelled(harness, operations, true);
});

test('E1.4-M: falha persistente na reconciliação classifica a restauração como incompleta', async () => {
  const harness = createHarness();
  const operations = openRealXPAndLevelUpModals(harness);
  harness.run(`
    window.__reconciliarModaisXPLevelUp = () => ({ ok: false, error: new Error('falha visual persistente') });
  `);
  await importPayload(harness, {
    nomePersonagem: 'Reconciliação persistente', tema: 'tema-claro',
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_FAILED');
  assert.equal(harness.run('completionResult.snapshotRestored'), true, 'o estado do snapshot foi restaurado, embora a reconciliação visual tenha falhado');
  assert.equal(harness.run('completionResult.rollbackComplete'), false);
  assert.match(harness.run('completionResult.erroAplicacao'), /falha visual persistente/i);
  await assertRealModalsCancelled(harness, operations, true);
});

test('refresh assíncrono do catálogo de munições aguarda a importação e atualiza a ficha atual', async () => {
  const harness = createHarness();
  const cargaClasse = deferred();
  const cargaCatalogo = deferred();
  const cargas = [cargaClasse];
  installClassLoaderFromProduction(harness, cargas);
  harness.run(`
    var documentReadyHandler = null;
    document.addEventListener = (tipo, handler) => { if (tipo === 'DOMContentLoaded') documentReadyHandler = handler; };
    var carregarCatalogoMunicoes = () => pendingAmmoCatalog;
    var atualizarResumoMunicoes = () => {};
    var atualizarCardMunicao = () => eventLog.push('ammo-card-refresh');
    var atualizarTodasMunicoesArmas = () => eventLog.push('ammo-all-refresh:' + (personagem.armas?.[0]?.arma_municao_id || ''));
  `);
  harness.pendingAmmoCatalog = cargaCatalogo.promise;
  const listenerStart = ammoCatalogSource.lastIndexOf('document.addEventListener("DOMContentLoaded", () => {');
  assert.notEqual(listenerStart, -1, 'o listener atual de refresh precisa estar presente');
  harness.run(ammoCatalogSource.slice(listenerStart));

  const importacao = iniciarImportacao(harness, {
    nomePersonagem: 'Personagem com munição nova', classeNomeID: 'mago', classeNivelID: 2,
    armas: [{ id: 'arma-ref', arma_nome: 'Besta', arma_municao_id: 'mun-ref' }],
    municoes: [{ id: 'mun-ref', municao_nome: 'Virote', municao_quantidade: 4 }],
  }, 'resultadoAmmo');
  await aguardarAte(() => harness.run('window.__fichaImportacaoTransacaoAtiva') !== null, 'importação pendente antes do refresh');
  harness.run('documentReadyHandler()');
  cargaCatalogo.resolve([]);
  await Promise.resolve();
  assert.equal(harness.eventLog.some((entry) => entry.startsWith('ammo-all-refresh:')), false);

  cargaClasse.resolve({ nome: 'Classe munição', niveis: [] });
  await importacao;
  await aguardarAte(() => harness.eventLog.some((entry) => entry === 'ammo-all-refresh:mun-ref'), 'refresh sobre ficha atual');
  assert.equal(harness.run('personagem.armas[0].arma_municao_id'), 'mun-ref');
  assert.ok(harness.eventLog.includes('ammo-card-refresh'));
});

test('rollback não declara snapshot restaurado quando a restauração deixa divergência silenciosa', async () => {
  const harness = createHarness();
  harness.run(`
    document.getElementById('nomePersonagem').value = 'Valor anterior';
    const restoreBeforeSilentCorruption = restaurarSnapshotImportacao;
    restaurarSnapshotImportacao = (snapshot) => {
      const errors = restoreBeforeSilentCorruption(snapshot);
      document.getElementById('nomePersonagem').value = 'Divergência silenciosa';
      return errors;
    };
  `);
  armFailure(harness, 'end-sync');
  await importPayload(harness, {
    nomePersonagem: 'Importação que falha', tema: 'tema-escuro',
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_FAILED');
  assert.equal(harness.run('completionResult.snapshotRestored'), false);
  assert.equal(harness.run("document.getElementById('nomePersonagem').value"), 'Divergência silenciosa');
  assert.ok(Array.from(harness.run('completionResult.errosRestauracao'))
    .some((entry) => /DOM|nomePersonagem|diverg/i.test(String(entry))));
});

test('falha do verificador durante rollback é classificada como restauração incompleta', async () => {
  const harness = createHarness();
  harness.run(`
    verificarSnapshotImportacao = () => { throw new Error('injected snapshot verifier failure'); };
  `);
  armFailure(harness, 'end-sync');
  await importPayload(harness, {
    nomePersonagem: 'Importação com verificador falho', armas: [], municoes: [],
  });
  assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_FAILED');
  assert.equal(harness.run('completionResult.snapshotRestored'), false);
  assert.equal(harness.run('completionResult.rollbackComplete'), false);
  assert.match(harness.run('completionResult.errosRestauracao[0]'), /injected snapshot verifier failure/);
});

test('callback de inicialização não redefine o baseline após uma importação', () => {
  const initializationFunction = extractFunction(
    storageSource,
    'function finalizarInicializacaoEstadoFicha() {',
    '\nif (document.readyState === "loading")',
  );
  let scheduledFrame = null;
  let savedBaselineCalls = 0;
  const context = vm.createContext({
    window: { __fichaImportacaoEpoch: 0, __fichaImportacaoTransacaoAtiva: null },
    document: { removeEventListener() {} },
    requestAnimationFrame(callback) { scheduledFrame = callback; },
    setTimeout(callback) { scheduledFrame = callback; },
    marcarFichaComoSalva() { savedBaselineCalls += 1; },
  });
  vm.runInContext(`
    let houveInteracaoDuranteInicializacaoFicha = false;
    const registrarInteracaoDuranteInicializacaoFicha = () => {
      houveInteracaoDuranteInicializacaoFicha = true;
    };
    ${initializationFunction}
    finalizarInicializacaoEstadoFicha();
  `, context);
  assert.equal(typeof scheduledFrame, 'function');
  context.window.__fichaImportacaoEpoch += 1;
  scheduledFrame();
  assert.equal(savedBaselineCalls, 0, 'uma tarefa de inicialização antiga não deve marcar a ficha importada/restaurada como salva');
});

test('callback de inicialização mantém o baseline normal quando não houve importação', () => {
  const initializationFunction = extractFunction(
    storageSource,
    'function finalizarInicializacaoEstadoFicha() {',
    '\nif (document.readyState === "loading")',
  );
  let scheduledFrame = null;
  let savedBaselineCalls = 0;
  const context = vm.createContext({
    window: { __fichaImportacaoEpoch: 0, __fichaImportacaoTransacaoAtiva: null },
    document: { removeEventListener() {} },
    requestAnimationFrame(callback) { scheduledFrame = callback; },
    setTimeout(callback) { scheduledFrame = callback; },
    marcarFichaComoSalva() { savedBaselineCalls += 1; },
  });
  vm.runInContext(`
    let houveInteracaoDuranteInicializacaoFicha = false;
    const registrarInteracaoDuranteInicializacaoFicha = () => {
      houveInteracaoDuranteInicializacaoFicha = true;
    };
    ${initializationFunction}
    finalizarInicializacaoEstadoFicha();
  `, context);
  scheduledFrame();
  assert.equal(savedBaselineCalls, 1, 'a inicialização sem interação ou importação continua marcando a ficha limpa');
});

test('foco de modal de combate agendado antes da importação não executa depois', () => {
  const focusFunction = extractFunction(
    combatSource,
    'function agendarFocoModalCombate(campo) {',
    '\nfunction inicializarSeletorCondicoes()',
  );
  let scheduledTimer = null;
  let focusCalls = 0;
  const context = vm.createContext({
    window: { __fichaImportacaoEpoch: 0, __fichaImportacaoTransacaoAtiva: null },
    setTimeout(callback) { scheduledTimer = callback; },
  });
  vm.runInContext(`${focusFunction};`, context);
  const field = { isConnected: true, focus() { focusCalls += 1; } };
  context.agendarFocoModalCombate(field);
  context.window.__fichaImportacaoEpoch += 1;
  scheduledTimer();
  assert.equal(focusCalls, 0, 'timer de uma etapa/modal anterior não pode roubar foco após importação');
});

test('callback de salvaguarda antigo não remove o indicador de uma rolagem mais nova', async () => {
  const inicio = combatSource.indexOf('rolar?.addEventListener("click", (evento) => {', combatSource.indexOf('function inicializarModalSalvaguardaMorte'));
  const fim = combatSource.indexOf('\n  confirmar?.addEventListener("click",', inicio);
  assert.ok(inicio >= 0 && fim > inicio, 'registro de rolagem de salvaguarda encontrado');
  const handlerSource = combatSource.slice(inicio, fim);
  const classNames = new Set();
  const listeners = new Map();
  const promises = [];
  const rolar = {
    classList: {
      add(name) { classNames.add(name); },
      remove(name) { classNames.delete(name); },
    },
    addEventListener(name, callback) { listeners.set(name, callback); },
  };
  const context = vm.createContext({
    rolar,
    overlay: { dataset: { salvaguarda: 'true' } },
    campoDado: {},
    window: { __fichaImportacaoEpoch: 1, __fichaImportacaoTransacaoAtiva: null },
    animarRolagemNoCampo() { return new Promise((resolve) => promises.push(resolve)); },
  });
  vm.runInContext(handlerSource, context);
  const handler = listeners.get('click');
  handler({ stopImmediatePropagation() {} });
  handler({ stopImmediatePropagation() {} });
  promises[0]();
  await Promise.resolve();
  assert.equal(classNames.has('rolando'), true, 'o callback obsoleto não remove o estado visual da nova rolagem');
  promises[1]();
  await Promise.resolve();
  assert.equal(classNames.has('rolando'), false, 'o callback atual encerra seu próprio estado visual');
});

test('confirmação de salvaguarda não grava resultados durante importação transacional', () => {
  const inicio = combatSource.indexOf('  confirmar?.addEventListener("click", (evento) => {', combatSource.indexOf('function inicializarModalSalvaguardaMorte'));
  const fim = combatSource.indexOf('\n  abrirBotao.addEventListener("click",', inicio);
  assert.ok(inicio >= 0 && fim > inicio, 'listeners de confirmação do modal de salvaguarda encontrados');
  const listenersSource = combatSource.slice(inicio, fim);
  const callbacks = new Map();
  const calls = { sucesso: 0, fracasso: 0, fechar: 0 };
  const button = () => ({ addEventListener(type, callback) { callbacks.set(`${this.name}:${type}`, callback); } });
  const confirmar = button();
  confirmar.name = 'confirmar';
  const cancelar = button();
  cancelar.name = 'cancelar';
  const context = vm.createContext({
    overlay: { dataset: { salvaguarda: 'true' } }, confirmar, cancelar,
    window: { __fichaImportacaoTransacaoAtiva: 41 },
    adicionarSucesso() { calls.sucesso += 1; },
    adicionarFracasso() { calls.fracasso += 1; },
    fechar() { calls.fechar += 1; },
  });
  vm.runInContext(listenersSource, context);
  for (const name of ['confirmar', 'cancelar']) {
    callbacks.get(`${name}:click`)({ stopImmediatePropagation() {} });
  }
  assert.deepEqual(calls, { sucesso: 0, fracasso: 0, fechar: 0 }, 'ações do modal não devem registrar estado enquanto a transação está ativa');
});

test('funções de gravação de salvaguarda também rejeitam chamadas diretas durante importação', () => {
  const successSource = extractFunction(combatSource, 'function adicionarSucesso() {', '\nfunction adicionarFracasso() {');
  const failureSource = extractFunction(combatSource, 'function adicionarFracasso() {', '\nfunction verificarVitoriaDeathSave()');
  const activeDots = new Set();
  const sideEffects = [];
  const context = vm.createContext({
    window: { __fichaImportacaoTransacaoAtiva: 42 },
    document: { getElementById(id) { return { classList: { contains(name) { return activeDots.has(id + ':' + name); }, add(name) { activeDots.add(id + ':' + name); } } }; } },
    registrarHistoricoComandoCombate(...args) { sideEffects.push(['history', ...args]); },
    verificarVitoriaDeathSave() { sideEffects.push(['victory']); },
    verificarDerrotaDeathSave() { sideEffects.push(['defeat']); },
  });
  vm.runInContext(`${successSource}; ${failureSource};`, context);
  context.adicionarSucesso();
  context.adicionarFracasso();
  assert.deepEqual([...activeDots], []);
  assert.deepEqual(sideEffects, []);
});

test('código legado de rollback não é suficiente para declarar rollbackComplete', async () => {
  const harness = createHarness();
  harness.run(`
    aplicarDadosFicha = async () => {
      const error = new Error('resultado legado sem evidência de restauração');
      error.code = 'CHARACTER_SHEET_APPLY_FAILED_ROLLED_BACK';
      throw error;
    };
  `);
  await importPayload(harness, {
    nomePersonagem: 'Payload de diagnóstico', tema: 'tema-claro',
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('completionResult.tipo'), 'erro');
  assert.notEqual(harness.run('completionResult.rollbackComplete'), true);
  assert.notEqual(harness.run('completionResult.recuperacao'), 'restaurada');
});

test('falha de importação não persiste dados em armazenamento local', async () => {
  const harness = createHarness();
  harness.run(`
    var writesDuringImport = 0;
    localStorage.setItem = () => { writesDuringImport++; };
    localStorage.removeItem = () => { writesDuringImport++; };
  `);
  armFailure(harness, 'end-sync');
  await importPayload(harness, {
    nomePersonagem: 'Falha sem persistência', tema: 'tema-escuro',
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('writesDuringImport'), 0);
  assert.equal(harness.run('completionResult.rollbackComplete'), false);
});

test('renderer de Outros reconcilia o resumo sem normalizar campos persistidos', () => {
  const updater = extractFunction(
    otherCatalogSource,
    'function atualizarResumosOutros() {',
    '\nfunction capturarOutro() {',
  );
  const fields = {
    nome: { value: 'Poção antiga' }, tipo: { value: 'pocao' }, categoria: { value: '' },
    raridade: { value: 'comum' }, quantidade: { value: '1' }, quantidade_maxima: { value: '' },
    consumivel: { value: 'true' }, moeda: { value: 'po' }, preco: { value: '' }, peso: { value: '' },
    peso_definido: { value: 'true' }, descricao: { value: '' }, proficiencia_id: { value: '' },
    pode_ser_foco_arcano: { value: '' }, catalogo_tipo: { value: '' },
  };
  const visualNode = () => ({ textContent: '', hidden: false, setAttribute() {}, replaceChildren() {}, append() {} });
  const visualNodes = new Map();
  const summary = { querySelector(selector) { if (!visualNodes.has(selector)) visualNodes.set(selector, visualNode()); return visualNodes.get(selector); } };
  const card = {
    classList: { add() {} },
    querySelector(selector) { return selector === '.outro-resumo' ? summary : null; },
  };
  const context = vm.createContext({
    document: { querySelectorAll() { return [card]; }, getElementById() { return { value: '' }; }, createElement() { return visualNode(); } },
    camposOutro() { return { get: (name) => fields[name]?.value ?? '', set: (name, value) => { if (fields[name]) fields[name].value = String(value ?? ''); }, flag() { return null; } }; },
    itemLegadoOutro() { return { nome: 'Poção antiga', tipo: 'pocoes', categoria: '', raridade: 'comum', quantidade: 1, quantidadeMaxima: null, consumivel: true, moeda: 'po', preco: '', peso: '', proficienciaId: '' }; },
    outroProficienciaAtiva() { return false; }, rotuloCategoriaOutro() { return 'Poção'; },
    formatarMoedaOutro() { return 'Valor não informado'; }, formatarPesoOutro() { return 'Peso não informado'; },
    elOutro() { return visualNode(); },
  });
  vm.runInContext(updater, context, { filename: 'js/modules/outros-catalogo.js::atualizarResumosOutros' });
  vm.runInContext('atualizarResumosOutros()', context);
  assert.equal(fields.catalogo_tipo.value, '', 'um renderer não deve gravar normalização em campo que é coletado/exportado');
  assert.equal(visualNodes.get('.outro-cartao-nome').textContent, 'Poção antiga');
});

test('verificação pós-reconciliação identifica divergência em controle persistente e permite projeções visuais', () => {
  const harness = createHarness();
  const card = fakeElement('legacy-other', 'container');
  card.className = 'item-card';
  card.dataset.tipo = 'outro';
  const input = fakeElement('', 'input', '');
  input.setAttribute('data-campo', 'outro_catalogo_tipo');
  card.appendChild(input);
  harness.lists.get('listaOutros').appendChild(card);
  const snapshot = harness.run('capturarSnapshotImportacao()');
  harness.rollbackSnapshot = snapshot;

  card.className = 'item-card outro-catalogo-card';
  card.setAttribute('aria-roledescription', 'item arrastável para reorganizar');
  card.setAttribute('draggable', 'true');
  card.title = 'Arraste para reorganizar dentro desta categoria';
  card.draggable = true;
  const projectionResult = JSON.parse(harness.run('JSON.stringify(verificarSnapshotPosReconciliacaoImportacao(rollbackSnapshot))'));
  assert.equal(projectionResult.valido, true, JSON.stringify(projectionResult.divergencias));
  assert.equal(projectionResult.classificacao, 'restaurado_sem_confirmacao_assincrona');
  assert.ok(projectionResult.estadosNaoVerificaveis.length > 0);

  input.value = 'pocoes';
  const result = JSON.parse(harness.run('JSON.stringify(verificarSnapshotPosReconciliacaoImportacao(rollbackSnapshot))'));
  assert.equal(result.classificacao, 'divergencia_persistente');
  assert.ok(result.divergencias.some((entry) => entry.includes('outro_catalogo_tipo')));
  assert.equal(result.sentinelasDeListaConfirmados, false);
});

test('verificação pós-reconciliação detecta controle persistente movido para outro pai', () => {
  const harness = createHarness();
  const card = fakeElement('legacy-other', 'container');
  card.className = 'item-card';
  card.dataset.tipo = 'outro';
  const input = fakeElement('', 'input', '2');
  input.setAttribute('data-campo', 'outro_quantidade');
  card.appendChild(input);
  harness.lists.get('listaOutros').appendChild(card);
  const otherParent = fakeElement('different-parent', 'container');
  harness.body.appendChild(otherParent);
  const snapshot = harness.run('capturarSnapshotImportacao()');
  harness.rollbackSnapshot = snapshot;

  otherParent.appendChild(input);
  const result = JSON.parse(harness.run('JSON.stringify(verificarSnapshotPosReconciliacaoImportacao(rollbackSnapshot))'));
  assert.equal(result.valido, false);
  assert.ok(result.divergencias.some((entry) => entry.includes('relação pai-filho persistente diferente')));
});

test('verificação pós-reconciliação rejeita spinner transitório que permanece visível', () => {
  const harness = createHarness();
  harness.run(`
    window.__snapshotSpinner = capturarSnapshotImportacao();
    const spinnerVisivel = document.createElement('div');
    spinnerVisivel.id = 'classeSpinner';
    spinnerVisivel.style.display = 'block';
    document.body.appendChild(spinnerVisivel);
    window.__verificacaoSpinner = verificarSnapshotPosReconciliacaoImportacao(window.__snapshotSpinner);
  `);
  assert.equal(harness.run('window.__verificacaoSpinner.valido'), false);
  assert.ok(Array.from(harness.run('window.__verificacaoSpinner.divergencias'))
    .some((divergencia) => /classeSpinner.*ainda visível/i.test(divergencia)));
});

test('sentinelas de lista confirmam a entrega em alvos observados e aguardam mutação reencadeada', async () => {
  const source = extractFunction(importSource, 'async function drenarObservadoresImportacao()', '\n// A integração Electron');
  const lists = new Map();
  const observersByTarget = new Map();
  let callbacksAnteriores = 0;
  let callbacksAnterioresAntesDoSentinela = 0;
  let reencadeou = false;
  const agendarEntrega = (alvo) => {
    const observadores = [...(observersByTarget.get(alvo) || [])];
    queueMicrotask(() => observadores.forEach((observer) => observer.callback()));
  };
  const makeList = (id) => ({
    id,
    children: [],
    appendChild(node) { this.children.push(node); node.parentNode = this; agendarEntrega(this); return node; },
  });
  for (const id of ['listaArmas', 'listaMunicoes', 'listaArmaduras', 'listaEscudosItens', 'listaVestimentas', 'listaOutros']) {
    const list = makeList(id);
    lists.set(id, list);
    observersByTarget.set(list, []);
    const knownObserver = {
      observe(target) { observersByTarget.get(target).push(this); this.target = target; },
      disconnect() {},
      callback() {
        callbacksAnteriores += 1;
        if (!reencadeou) {
          reencadeou = true;
          callbacksAnterioresAntesDoSentinela = callbacksAnteriores;
          this.target.appendChild({ parentNode: null });
        }
      },
    };
    knownObserver.observe(list);
  }
  class FakeMutationObserver {
    constructor(callback) { this.callback = callback; }
    observe(target) { observersByTarget.get(target).push(this); this.target = target; }
    disconnect() { observersByTarget.set(this.target, observersByTarget.get(this.target).filter((entry) => entry !== this)); }
  }
  const context = vm.createContext({
    MutationObserver: FakeMutationObserver,
    document: {
      getElementById(id) { return lists.get(id) || null; },
      createComment() { return { parentNode: null, remove() { this.parentNode = null; } }; },
    },
    Promise, setTimeout, clearTimeout,
  });
  vm.runInContext(source, context);
  const result = await vm.runInContext('drenarObservadoresImportacao()', context);
  assert.equal(result.sentinelasDeListaConfirmados, true);
  assert.equal(result.listasObservadas, 6);
  assert.equal(callbacksAnterioresAntesDoSentinela > 0, true);
  assert.equal(callbacksAnteriores > 1, true, 'callbacks conhecidos receberam entrega da mutação reencadeada');
  assert.equal(result.janelaEstabilidadeObservada, true);
});

test('limpeza de carga de classe não cria spinner oculto sem uma carga prévia', () => {
  const source = extractFunction(classSource, 'function mostrarCarregando(show = true)', '\n      // Compat: reduz warnings');
  let spinner = null;
  let created = 0;
  const context = vm.createContext({
    document: {
      getElementById(id) { return id === 'classeSpinner' ? spinner : null; },
      createElement() {
        created += 1;
        spinner = { id: '', style: { display: '' }, classList: { add() {} }, innerHTML: '' };
        return spinner;
      },
      body: { appendChild(node) { spinner = node; } },
    },
  });
  vm.runInContext(source, context);
  vm.runInContext('mostrarCarregando(false)', context);
  assert.equal(created, 0);
  assert.equal(spinner, null);
  vm.runInContext('mostrarCarregando(true)', context);
  assert.equal(created, 1);
  assert.equal(spinner.style.display, 'block');
  vm.runInContext('mostrarCarregando(false)', context);
  assert.equal(spinner.style.display, 'none');
});

test('bridge Electron ativa usa o aplicador transacional e rejeita concorrência sem mutar a ficha', async () => {
  const harness = createHarness();
  harness.run(`
    var callbackReceberPersonagem = null;
    window.api = { receberPersonagem(callback) { callbackReceberPersonagem = callback; } };
    var liberarCancelamentoModal = null;
    window.__cancelarOperacoesModaisXPLevelUp = () => new Promise(resolve => {
      liberarCancelamentoModal = resolve;
    });
  `);
  harness.run(mainSource);

  const importacaoAtiva = harness.run(`aplicarDadosFicha({
    nomePersonagem: 'Importação transacional', armas: [], municoes: []
  }, { preparado: true, transacional: true })`);
  await aguardarAte(
    () => harness.run('typeof liberarCancelamentoModal') === 'function',
    'transação aguardando cancelamento cooperativo',
  );

  harness.run(`callbackReceberPersonagem(JSON.stringify({
    nomePersonagem: 'Escrita concorrente Electron', armas: [], municoes: []
  }))`);
  await Promise.resolve();
  await Promise.resolve();
  harness.run(`liberarCancelamentoModal({ ok: true, cancelled: [], focusTarget: null })`);
  assert.equal(await importacaoAtiva, true);
  await aguardarAte(
    () => harness.errors.some((entry) => /CHARACTER_SHEET_IMPORT_BUSY|importação transacional em andamento/i.test(entry)),
    'bridge rejeitada por conflito de transação',
  );

  assert.equal(harness.run('personagem.nomePersonagem'), 'Importação transacional');
  assert.equal(harness.run('window.personagem.nomePersonagem'), 'Importação transacional');
  assert.equal(harness.run('document.getElementById("nomePersonagem").value'), 'Importação transacional');
  assert.equal(harness.run('window.__fichaImportacaoTransacaoAtiva'), null);

});

test('bridge Electron aplica ficha válida em uma transação quando não há concorrência', async () => {
  const harness = createHarness();
  harness.run(`
    var callbackReceberPersonagem = null;
    window.api = { receberPersonagem(callback) { callbackReceberPersonagem = callback; } };
  `);
  harness.run(mainSource);
  harness.run(`callbackReceberPersonagem(JSON.stringify({
    nomePersonagem: 'Ficha recebida sem concorrência', armas: [], municoes: []
  }))`);
  await aguardarAte(
    () => harness.run('personagem.nomePersonagem') === 'Ficha recebida sem concorrência' &&
      harness.run('window.__fichaImportacaoTransacaoAtiva') === null,
    'bridge aplicada por transação própria',
  );
  assert.equal(harness.run('window.personagem.nomePersonagem'), 'Ficha recebida sem concorrência');
  assert.equal(harness.run('document.getElementById("nomePersonagem").value'), 'Ficha recebida sem concorrência');
  assert.equal(harness.run('window.__fichaImportacaoTransacaoAtiva'), null);
  assert.deepEqual(harness.errors, [], 'a aplicação externa válida não deve gerar erro no console do harness');
});

test('bridge Electron mantém entrega antecipada até o carregador transacional estar disponível', async () => {
  const harness = createHarness();
  harness.run(`
    var callbackReceberPersonagem = null;
    window.api = { receberPersonagem(callback) { callbackReceberPersonagem = callback; } };
    var aplicarFichaTransacionalOriginal = window.__aplicarFichaIntegracao;
    window.__aplicarFichaIntegracao = undefined;
  `);
  harness.run(mainSource);
  harness.run(`callbackReceberPersonagem(JSON.stringify({
    nomePersonagem: 'Entrega antes da inicialização', armas: [], municoes: []
  }))`);
  await Promise.resolve();
  assert.equal(harness.run('fichasIntegracaoPendentes.length'), 1);
  assert.deepEqual(harness.errors, [], 'a ausência temporária do helper não deve descartar nem reportar a ficha');

  harness.run(`window.__aplicarFichaIntegracao = aplicarFichaTransacionalOriginal; window.__drenarFichasIntegracaoPendentes()`);
  await aguardarAte(
    () => harness.run('personagem.nomePersonagem') === 'Entrega antes da inicialização' &&
      harness.run('window.__fichaImportacaoTransacaoAtiva') === null,
    'ficha antecipada aplicada pela transação após o helper ficar disponível',
  );
  assert.equal(harness.run('document.getElementById("nomePersonagem").value'), 'Entrega antes da inicialização');
  assert.equal(harness.run('fichasIntegracaoPendentes.length'), 0);
  assert.deepEqual(harness.errors, []);
});
