const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/core/storage.js'), 'utf8');

function storageContext() {
  const serializedDownloads = [];
  let downloadClickCount = 0;
  const elements = new Map();
  const document = {
    readyState: 'loading',
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll() { return []; },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { value: '', checked: false });
      return elements.get(id);
    },
    querySelector() { return null; },
    createElement(tag) {
      if (tag === 'a') {
        return {
          set href(value) { this._href = value; },
          set download(value) { this._download = value; },
          click() { downloadClickCount += 1; },
        };
      }
      return { style: {}, click() {} };
    },
  };
  class CapturedBlob {
    constructor(parts) { serializedDownloads.push(String(parts[0])); }
  }
  const context = vm.createContext({
    document,
    window: {},
    personagem: {},
    armaduraEquipadaIndice: null,
    talentosEstruturados: {},
    configFicha: {},
    obterSelecaoArmaEquipada() { return { nome: '', indice: null }; },
    console: { error() {} },
    Blob: CapturedBlob,
    URL: { createObjectURL() { return 'blob:test'; } },
    setTimeout,
    clearTimeout,
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
    run: (expression) => vm.runInContext(expression, context),
  };
}

function migrate(context, data) {
  context.inputData = JSON.parse(JSON.stringify(data));
  return JSON.parse(vm.runInContext('JSON.stringify(migrarDadosFicha(inputData))', context));
}

test('migra ficha v0 sem marcador para v1 e mantém aliases e metadados legados intactos', () => {
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

  assert.equal(migrated.fichaSchemaVersion, 1);
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
  assert.equal(once.fichaSchemaVersion, 1);
  assert.equal(once.forBase, original.forBase);
  assert.deepEqual(once.pluginData, original.pluginData);
  assert.deepEqual(once.colecaoNaoInterpretada, original.colecaoNaoInterpretada);
  assert.equal(once.schema_version, original.schema_version);
  assert.equal(once.schema_notes, original.schema_notes);
});

test('versão v1 é um no-op nos dados existentes', () => {
  const { context } = storageContext();
  const current = {
    fichaSchemaVersion: 1,
    magia1Total: '4',
    magia1Usado: '2',
    magia1Rest: 'manual-current-value',
    schema_version: 'legacy-marker',
  };

  assert.deepEqual(migrate(context, current), current);
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

  assert.equal(errorCode({ fichaSchemaVersion: 2 }), 'UNSUPPORTED_CHARACTER_SHEET_VERSION');
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

  assert.equal(normalized.fichaSchemaVersion, 1);
  assert.equal(normalized.nomePlayer, 'Somente nome');
  assert.equal(normalized.jogador, 'Somente nome');
  assert.equal(normalized.forBase, 12);
  assert.equal(normalized.for, 12);
  assert.equal(normalized.classeNomeID, undefined);
});

test('rejeita versões futuras e malformadas antes de aplicar dados', async (t) => {
  const invalidVersions = [
    { fichaSchemaVersion: 2 },
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
    marcarFichaComoSalva = () => {};
  `);

  harness.run('salvarFicha()');
  const [exported] = harness.downloaded();

  assert.equal(harness.downloadClickCount(), 1);
  assert.equal(exported.fichaSchemaVersion, 1);
  assert.equal(exported.bonusProf, 4);
  assert.equal(exported.bonusProficiencia, 4, 'alias exportado reflete o valor canônico atual');
  assert.equal(exported.magia1Rest, 'valor-atual', 'valor atual não é recalculado a partir dos aliases legados');
  assert.equal(exported.magia1Total, '4');
  assert.equal(exported.magia1Usado, '2');
});
