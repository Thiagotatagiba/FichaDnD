const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/core/storage.js'), 'utf8');

function storageContext(options = {}) {
  const serializedDownloads = [];
  let downloadClickCount = 0;
  const scheduledTimers = [];
  const scheduledIntervals = [];
  const windowListeners = new Map();
  const revokedObjectUrls = [];
  const elements = new Map();
  const fields = [];
  const document = {
    readyState: 'loading',
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll() { return fields; },
    getElementById(id) {
      if (!elements.has(id)) {
        const element = { id, value: '', checked: false, textContent: '' };
        if (id === 'exportacaoStatus' && options.statusError) {
          Object.defineProperty(element, 'textContent', {
            get() { return ''; },
            set() { throw options.statusError; },
          });
        }
        elements.set(id, element);
      }
      return elements.get(id);
    },
    querySelector() { return null; },
    createElement(tag) {
      if (tag === 'a') {
        return {
          set href(value) { this._href = value; },
          set download(value) { this._download = value; },
          click() {
            if (options.clickError) throw options.clickError;
            downloadClickCount += 1;
          },
        };
      }
      return { style: {}, click() {} };
    },
  };
  class CapturedBlob {
    constructor(parts) {
      if (options.blobError) throw options.blobError;
      serializedDownloads.push(String(parts[0]));
    }
  }
  const context = vm.createContext({
    document,
    window: {
      addEventListener(type, handler) {
        const handlers = windowListeners.get(type) || [];
        handlers.push(handler);
        windowListeners.set(type, handlers);
      },
    },
    personagem: {},
    armaduraEquipadaIndice: null,
    talentosEstruturados: {},
    configFicha: {},
    obterSelecaoArmaEquipada() { return { nome: '', indice: null }; },
    console: { error() {} },
    Blob: CapturedBlob,
    URL: {
      createObjectURL() {
        if (options.urlError) throw options.urlError;
        return 'blob:test';
      },
      revokeObjectURL(url) { revokedObjectUrls.push(url); },
    },
    setTimeout(callback, delay) {
      const timer = { callback, delay };
      if (delay === 5000) {
        scheduledTimers.push(timer);
      } else {
        callback();
      }
      return timer;
    },
    setInterval(callback, delay) {
      const timer = { callback, delay };
      scheduledIntervals.push(timer);
      return timer;
    },
    clearTimeout(timer) {
      const index = scheduledTimers.indexOf(timer);
      if (index >= 0) scheduledTimers.splice(index, 1);
    },
    Date,
    JSON,
    confirm: () => true,
    alert() {},
  });
  vm.runInContext(source, context, { filename: 'js/core/storage.js' });
  return {
    context,
    elements,
    downloaded: () => serializedDownloads.map((json) => JSON.parse(json)),
    downloadClickCount: () => downloadClickCount,
    fields,
    elements,
    status: () => elements.get('exportacaoStatus')?.textContent || '',
    scheduledTimers,
    scheduledIntervals,
    windowListeners,
    revokedObjectUrls,
    flushTimers() {
      while (scheduledTimers.length) scheduledTimers.shift().callback();
    },
    run: (expression) => vm.runInContext(expression, context),
  };
}

function migrate(context, data) {
  context.inputData = JSON.parse(JSON.stringify(data));
  return JSON.parse(vm.runInContext('JSON.stringify(migrarDadosFicha(inputData))', context));
}

test('migra ficha v0 sem marcador para v2 e mantém aliases e metadados legados intactos', () => {
  const { context } = storageContext();
  const legacy = {
    nomePlayer: 'Jogadora legada',
    classeNome: 'Barda',
    schema_version: '1.0',
    schema_notes: { importedBy: 'legacy-tool', flags: ['preserve'] },
    customRoot: { nested: [{ key: 'value', enabled: true }] },
    armas: [{ customWeaponField: { range: [1, 2] } }],
    municoes: [{ customAmmoField: 'opaque-value' }],
    pocoes: [{ customPotionField: 12 }],
  };
  const migrated = migrate(context, legacy);

  assert.equal(migrated.fichaSchemaVersion, 2);
  assert.equal(migrated.nomePlayer, legacy.nomePlayer);
  assert.equal(migrated.classeNome, legacy.classeNome);
  assert.deepEqual(migrated.schema_version, legacy.schema_version);
  assert.deepEqual(migrated.schema_notes, legacy.schema_notes);
  assert.deepEqual(migrated.customRoot, legacy.customRoot);
  assert.deepEqual(migrated.armas, legacy.armas);
  assert.deepEqual(migrated.municoes, legacy.municoes);
  assert.deepEqual(migrated.pocoes, legacy.pocoes);
  assert.equal(Object.hasOwn(legacy, 'fichaSchemaVersion'), false, 'a migração não muta a entrada');
});

test('migração v0 é idempotente e round-trip JSON conserva campos desconhecidos', () => {
  const { context } = storageContext();
  const original = {
    schema_version: 6,
    schema_notes: 'opaque',
    forBase: 13,
    pluginData: { arbitrary: [null, { key: 'value' }] },
    colecaoNaoInterpretada: [{ id: 'x', extra: { nested: true } }],
  };
  const once = migrate(context, original);
  const twice = migrate(context, once);
  const roundTrip = migrate(context, JSON.parse(JSON.stringify(once)));

  assert.deepEqual(twice, once);
  assert.deepEqual(roundTrip, once);
  assert.equal(once.fichaSchemaVersion, 2);
  assert.equal(once.forBase, original.forBase);
  assert.deepEqual(once.pluginData, original.pluginData);
  assert.deepEqual(once.colecaoNaoInterpretada, original.colecaoNaoInterpretada);
  assert.equal(once.schema_version, original.schema_version);
  assert.equal(once.schema_notes, original.schema_notes);
});

test('migração v1 → v2 preserva os campos desconhecidos', () => {
  const { context } = storageContext();
  const current = {
    fichaSchemaVersion: 1,
    magia1Total: '4',
    magia1Usado: '2',
    magia1Rest: 'manual-current-value',
    schema_version: 'legacy-marker',
  };

  assert.deepEqual(migrate(context, current), { ...current, fichaSchemaVersion: 2 });
});

test('migra PV legados para pools separados pela vida efetiva preservada', () => {
  const { context } = storageContext();
  const legacyWithTemporary = {
    fichaSchemaVersion: 1,
    pvAtual: '13',
    pvTotal: '10',
    pvTemporario: '5',
    customPvMetadata: { source: 'old-sheet' },
  };
  const migratedWithTemporary = migrate(context, legacyWithTemporary);

  assert.equal(migratedWithTemporary.fichaSchemaVersion, 2);
  assert.equal(migratedWithTemporary.pvAtual, '10');
  assert.equal(migratedWithTemporary.pvTemporario, '3');
  assert.deepEqual(migratedWithTemporary.customPvMetadata, { source: 'old-sheet' });
  assert.deepEqual(legacyWithTemporary, {
    fichaSchemaVersion: 1,
    pvAtual: '13',
    pvTotal: '10',
    pvTemporario: '5',
    customPvMetadata: { source: 'old-sheet' },
  });

  const migratedBelowMaximum = migrate(context, {
    fichaSchemaVersion: 1,
    pvAtual: '8',
    pvTotal: '10',
    pvTemporario: '5',
  });
  assert.equal(migratedBelowMaximum.pvAtual, '8');
  assert.equal(migratedBelowMaximum.pvTemporario, '0');
});

test('erros de versão usam códigos distintos e estáveis', () => {
  const { context } = storageContext();
  const errorCode = (data) => {
    context.inputData = data;
    return vm.runInContext(`
      (() => {
        try { migrarDadosFicha(inputData); return null; }
        catch (erro) { return erro.code; }
      })()
    `, context);
  };

  assert.equal(errorCode({ fichaSchemaVersion: 3 }), 'UNSUPPORTED_CHARACTER_SHEET_VERSION');
  assert.equal(errorCode({ fichaSchemaVersion: 0 }), 'INVALID_CHARACTER_SHEET_VERSION');
  assert.equal(errorCode({ fichaSchemaVersion: '1' }), 'INVALID_CHARACTER_SHEET_VERSION');
  assert.equal(errorCode({ fichaSchemaVersion: 1.5 }), 'INVALID_CHARACTER_SHEET_VERSION');
});

test('ficha incompleta continua aceita e aliases legados permanecem disponíveis', () => {
  const { context } = storageContext();
  const incomplete = { nomePlayer: 'Somente nome', forBase: 12 };
  vm.runInContext(`
    montarTalentosEstruturados = (dados) => dados.talentosEstruturados || {};
    normalizarConfigFicha = (config) => config || {};
  `, context);
  context.inputData = incomplete;
  const normalized = JSON.parse(
    vm.runInContext('JSON.stringify(normalizarDadosImportacao(inputData))', context),
  );

  assert.equal(normalized.fichaSchemaVersion, 2);
  assert.equal(normalized.nomePlayer, 'Somente nome');
  assert.equal(normalized.jogador, 'Somente nome');
  assert.equal(normalized.forBase, 12);
  assert.equal(normalized.for, 12);
  assert.equal(normalized.classeNomeID, undefined);
});

test('rejeita versões futuras e malformadas antes de aplicar dados', async (t) => {
  const invalidVersions = [
    { fichaSchemaVersion: 3 },
    { fichaSchemaVersion: 0 },
    { fichaSchemaVersion: '1' },
    { fichaSchemaVersion: 1.5 },
    { fichaSchemaVersion: null },
    { fichaSchemaVersion: -1 },
  ];

  for (const data of invalidVersions) {
    await t.test(JSON.stringify(data), async () => {
      const harness = storageContext();
      harness.run(`
        var applyCount = 0;
        aplicarDadosFicha = async () => { applyCount += 1; return true; };
        inicioModalImportacao = Date.now() - 1000;
        mostrarResultadoImportacao = (tipo, mensagem) => { resultadoCapturado = { tipo, mensagem }; };
      `);
      await harness.run(`processarImportacao(${JSON.stringify(JSON.stringify(data))})`);
      const result = harness.run('resultadoCapturado');
      assert.equal(harness.run('applyCount'), 0);
      assert.equal(result.tipo, 'erro');
      assert.doesNotMatch(result.mensagem, /parcial/i);
    });
  }
});

test('exportação grava dados coletados atuais e não reexecuta migração de alias legado', () => {
  const harness = storageContext();
  harness.run(`
    document.getElementById('classeData').value = '';
    document.getElementById('subclasseData').value = '';
    document.getElementById('nomePersonagem').value = 'Atual';
    document.getElementById('jogador').value = 'Jogador';
  `);
  harness.run(`
    var talentosEstruturados = {};
    var armaduraEquipadaIndice = null;
    coletarDadosFicha = () => adicionarAliasesLegacyAoSave({
      bonusProf: 4,
      bonusProficiencia: 1,
      magia1Total: '4',
      magia1Usado: '2',
      magia1Rest: 'valor-atual',
    });
    coletarArmas = () => [];
    coletarArmaduras = () => [];
    coletarEscudos = () => [];
    coletarMunicoes = () => [];
    coletarOutros = () => [];
  `);

  const outcome = harness.run('salvarFicha()');
  const [exported] = harness.downloaded();

  assert.equal(outcome.ok, true);
  assert.equal(harness.downloadClickCount(), 1);
  assert.equal(exported.fichaSchemaVersion, 2);
  assert.equal(exported.bonusProf, 4);
  assert.equal(exported.bonusProficiencia, 4, 'alias exportado reflete o valor canônico atual');
  assert.equal(exported.magia1Rest, 'valor-atual', 'valor atual não é recalculado a partir dos aliases legados');
  assert.equal(exported.magia1Total, '4');
  assert.equal(exported.magia1Usado, '2');
  assert.match(harness.status(), /Exportação solicitada/);
  assert.match(harness.status(), /Confirme se o arquivo foi salvo/);
});

test('coleta de exportação repassa metadados raiz opacos sem sobrescrever campos coletados', () => {
  const harness = storageContext();
  const extras = {
    pluginData: { nested: [null, { preserve: true }] },
    schema_notes: { source: 'custom', flags: ['keep'] },
    customNull: null,
  };
  harness.run(`personagem = ${JSON.stringify(extras)};`);

  const collected = JSON.parse(harness.run('JSON.stringify(coletarDadosFicha())'));

  assert.deepEqual(collected.pluginData, extras.pluginData);
  assert.deepEqual(collected.schema_notes, extras.schema_notes);
  assert.equal(collected.customNull, null);
});

test('solicitações repetidas de exportação são separadas e não limpam alterações pendentes', () => {
  const harness = storageContext();
  harness.run(`
    let exportName = 'Personagem';
    document.getElementById('nomePersonagem').value = 'Personagem';
    document.getElementById('jogador').value = 'Jogador';
    document.getElementById('classeData').value = '';
    document.getElementById('subclasseData').value = '';
    coletarDadosFicha = () => ({ nomePersonagem: exportName });
    coletarArmas = coletarArmaduras = coletarEscudos = coletarMunicoes = coletarOutros = () => [];
    marcarFichaComoSalva();
    exportName = 'Personagem editado';
  `);

  const first = harness.run('salvarFicha()');
  harness.run(`exportName = 'Personagem novamente editado'; document.getElementById('nomePersonagem').value = 'Personagem novamente editado';`);
  const second = harness.run('salvarFicha()');
  const state = JSON.parse(harness.run('JSON.stringify(obterEstadoPersistenciaFicha())'));
  const downloads = harness.downloaded();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(harness.downloadClickCount(), 2);
  assert.equal(downloads[0].nomePersonagem, 'Personagem editado');
  assert.equal(downloads[1].nomePersonagem, 'Personagem novamente editado');
  assert.equal(state.alteracoesPendentes, true, 'o clique não confirma gravação nem avança o baseline');
  assert.equal(state.ultimoBackupLocal, null, 'backup local só será implementado em E1.6');
  assert.ok(state.ultimaExportacaoSolicitada.solicitadaEm);
  assert.equal(typeof state.ultimaExportacaoSolicitada.nomeArquivo, 'string');
  assert.equal(harness.scheduledTimers.length, 2);
  assert.ok(harness.scheduledTimers.every((timer) => timer.delay === 5000));
  assert.equal(harness.revokedObjectUrls.length, 0, 'a URL só é revogada depois de iniciar a solicitação');
  harness.flushTimers();
  assert.deepEqual(harness.revokedObjectUrls, ['blob:test', 'blob:test']);
});

test('falha de interface depois do clique não classifica uma solicitação iniciada como falha total', () => {
  const harness = storageContext({ statusError: new Error('status indisponível') });
  harness.run(`
    document.getElementById('nomePersonagem').value = 'Personagem';
    document.getElementById('jogador').value = 'Jogador';
    document.getElementById('classeData').value = '';
    document.getElementById('subclasseData').value = '';
    coletarDadosFicha = () => ({ nomePersonagem: 'Personagem' });
    coletarArmas = coletarArmaduras = coletarEscudos = coletarMunicoes = coletarOutros = () => [];
  `);

  const result = harness.run('salvarFicha()');
  const state = JSON.parse(harness.run('JSON.stringify(obterEstadoPersistenciaFicha())'));

  assert.equal(result.ok, true);
  assert.equal(result.estado, 'solicitacao_iniciada_com_erro');
  assert.equal(harness.downloadClickCount(), 1);
  assert.ok(state.ultimaExportacaoSolicitada);
  assert.equal(harness.revokedObjectUrls.length, 0, 'a URL permanece válida até a limpeza adiada');
  harness.flushTimers();
  assert.deepEqual(harness.revokedObjectUrls, ['blob:test']);
});

test('falha ao criar Blob ou URL não registra exportação e preserva alterações pendentes', () => {
  for (const options of [
    { blobError: new Error('blob indisponível') },
    { urlError: new Error('URL indisponível') },
    { clickError: new Error('clique indisponível') },
  ]) {
    const harness = storageContext(options);
    harness.run(`
      document.getElementById('nomePersonagem').value = 'Personagem';
      document.getElementById('jogador').value = 'Jogador';
      document.getElementById('classeData').value = '';
      document.getElementById('subclasseData').value = '';
      coletarDadosFicha = () => ({ nomePersonagem: document.getElementById('nomePersonagem').value });
      coletarArmas = coletarArmaduras = coletarEscudos = coletarMunicoes = coletarOutros = () => [];
      marcarFichaComoSalva();
      document.getElementById('nomePersonagem').value = 'Alterado';
    `);

    const result = harness.run('salvarFicha()');
    const state = JSON.parse(harness.run('JSON.stringify(obterEstadoPersistenciaFicha())'));

    assert.equal(result.ok, false);
    assert.equal(state.alteracoesPendentes, true);
    assert.equal(state.ultimaExportacaoSolicitada, null);
    assert.equal(harness.downloadClickCount(), 0);
    if (options.clickError) {
      assert.deepEqual(harness.revokedObjectUrls, ['blob:test'], 'falha no clique libera a URL criada');
    }
    assert.match(harness.status(), /não foi possível iniciar a exportação/i);
    assert.match(harness.status(), /alterações pendentes foram preservadas/i);
  }
});

test('sem confirmação do diálogo nativo, a exportação permanece apenas solicitada', () => {
  const harness = storageContext();
  harness.run(`
    document.getElementById('nomePersonagem').value = 'Personagem';
    document.getElementById('jogador').value = 'Jogador';
    document.getElementById('classeData').value = '';
    document.getElementById('subclasseData').value = '';
    coletarDadosFicha = () => ({ nomePersonagem: document.getElementById('nomePersonagem').value });
    coletarArmas = coletarArmaduras = coletarEscudos = coletarMunicoes = coletarOutros = () => [];
    marcarFichaComoSalva();
    document.getElementById('nomePersonagem').value = 'Alterado';
    salvarFicha();
  `);

  // O navegador não fornece ao código um evento portátil de arquivo salvo/cancelado.
  const state = JSON.parse(harness.run('JSON.stringify(obterEstadoPersistenciaFicha())'));
  assert.equal(state.alteracoesPendentes, true);
  assert.ok(state.ultimaExportacaoSolicitada);
  assert.equal(Object.hasOwn(state, 'exportacaoConfirmada'), false);
  assert.match(harness.status(), /Confirme se o arquivo foi salvo/);
});

test('lembrete periódico só aparece quando há alterações posteriores à exportação solicitada', () => {
  const harness = storageContext();
  harness.run(`
    document.getElementById('nomePersonagem').value = 'Personagem';
    document.getElementById('jogador').value = 'Jogador';
    document.getElementById('classeData').value = '';
    document.getElementById('subclasseData').value = '';
    coletarDadosFicha = () => ({ nomePersonagem: document.getElementById('nomePersonagem').value });
    coletarArmas = coletarArmaduras = coletarEscudos = coletarMunicoes = coletarOutros = () => [];
    marcarFichaComoSalva();
    document.getElementById('nomePersonagem').value = 'Alterado';
  `);

  assert.equal(harness.scheduledIntervals.length, 1, 'um único relógio periódico é instalado');
  assert.equal(harness.scheduledIntervals[0].delay, 30 * 60 * 1000);
  harness.scheduledIntervals[0].callback();
  assert.match(harness.status(), /lembrete.*exportação/i);
  assert.match(harness.status(), /solicite uma nova exportação/i);
  assert.equal(harness.run('fichaFoiAlterada()'), true, 'o lembrete não limpa alterações pendentes');

  harness.run('salvarFicha()');
  const statusApósSolicitação = harness.status();
  harness.scheduledIntervals[0].callback();
  assert.equal(harness.status(), statusApósSolicitação, 'não há lembrete sem alterações após a última solicitação');

  harness.run("document.getElementById('nomePersonagem').value = 'Nova edição';");
  harness.scheduledIntervals[0].callback();
  assert.match(harness.status(), /lembrete.*exportação/i);
  assert.equal(harness.run('fichaFoiAlterada()'), true);
});

test('proteção beforeunload única só solicita confirmação para alterações persistentes', () => {
  const harness = storageContext();
  harness.run(`
    coletarDadosFicha = () => ({ nome: document.getElementById('nomePersonagem').value });
    marcarFichaComoSalva();
  `);
  const handlers = harness.windowListeners.get('beforeunload') || [];

  assert.equal(handlers.length, 1, 'a proteção de saída é registrada uma única vez');
  const eventoLimpo = { preventDefault() { this.prevented = true; }, returnValue: undefined };
  handlers[0](eventoLimpo);
  assert.equal(eventoLimpo.prevented, undefined);
  assert.equal(eventoLimpo.returnValue, undefined);

  harness.run("document.getElementById('nomePersonagem').value = 'Alterado';");
  const eventoAlterado = { preventDefault() { this.prevented = true; }, returnValue: undefined };
  handlers[0](eventoAlterado);
  assert.equal(eventoAlterado.prevented, true);
  assert.equal(eventoAlterado.returnValue, '', 'o texto é deixado ao navegador conforme sua limitação');
});

test('interação apenas com campos transitórios de modal não marca a ficha como alterada', () => {
  const harness = storageContext();
  const persisted = {
    id: 'nomePersonagem', type: 'text', value: 'Personagem',
    closest: () => null,
  };
  const transient = {
    id: 'xpAddModalInput', type: 'number', value: '0',
    closest: () => ({ id: 'xpAddModal' }),
  };
  harness.fields.push(persisted, transient);
  harness.run('marcarFichaComoSalva()');

  transient.value = '250';
  assert.equal(harness.run('fichaFoiAlterada()'), false);
  persisted.value = 'Outro nome';
  assert.equal(harness.run('fichaFoiAlterada()'), true);
});
