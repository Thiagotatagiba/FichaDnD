const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/core/backup-local.js'), 'utf8');

function criarIndexedDB(options = {}) {
  const snapshots = new Map();
  let sequence = 0;
  const objectStoreNames = {
    contains: (nome) => nome === 'snapshots',
  };
  const store = {
    createIndex() {},
    add(registro) {
      const request = { result: registro.backupId, error: null };
      queueMicrotask(() => {
        if (options.quotaError) {
          request.error = Object.assign(new Error('quota exceeded'), { name: 'QuotaExceededError' });
          transaction.error = request.error;
          request.onerror?.();
          transaction.onerror?.();
          transaction.onabort?.();
          return;
        }
        if (snapshots.has(registro.backupId)) {
          request.error = new Error('duplicate key');
          transaction.error = request.error;
          request.onerror?.();
          transaction.onerror?.();
          transaction.onabort?.();
          return;
        }
        snapshots.set(registro.backupId, structuredClone(registro));
        request.onsuccess?.();
        transaction.oncomplete?.();
      });
      return request;
    },
    getAll() {
      const request = { result: null, error: null };
      queueMicrotask(() => {
        request.result = [...snapshots.values()].map((registro) => structuredClone(registro));
        request.onsuccess?.();
        transaction.oncomplete?.();
      });
      return request;
    },
    get(id) {
      const request = { result: null, error: null };
      queueMicrotask(() => {
        request.result = snapshots.has(id) ? structuredClone(snapshots.get(id)) : undefined;
        request.onsuccess?.();
        transaction.oncomplete?.();
      });
      return request;
    },
  };
  let transaction;
  const database = {
    objectStoreNames,
    createObjectStore() { return store; },
    transaction() {
      transaction = { objectStore: () => store };
      return transaction;
    },
    close() {},
  };
  const indexedDB = {
    open() {
      const request = { result: null, error: null };
      queueMicrotask(() => {
        if (options.openError) {
          request.error = options.openError;
          request.onerror?.();
          return;
        }
        sequence += 1;
        request.result = database;
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
  return {
    indexedDB,
    snapshots,
    setQuotaError(value) { options.quotaError = value; },
  };
}

function criarHarness(options = {}) {
  const db = options.db || criarIndexedDB(options);
  const timers = new Map();
  const listeners = new Map();
  const status = { textContent: '', hidden: true, dataset: {} };
  const recoveryStatus = { textContent: '', hidden: true, dataset: {} };
  const detalhes = { textContent: '' };
  const seletor = {
    options: [],
    value: '',
    replaceChildren() { this.options = []; this.value = ''; },
    appendChild(opcao) { this.options.push(opcao); if (!this.value) this.value = opcao.value; },
    addEventListener(nome, callback) { this[`on${nome}`] = callback; },
  };
  const dialogo = {
    open: false,
    listeners: new Map(),
    showModal() { this.open = true; },
    close() {
      this.open = false;
      for (const callback of this.listeners.get('close') || []) callback();
    },
    addEventListener(nome, callback, opts) {
      if (!this.listeners.has(nome)) this.listeners.set(nome, []);
      this.listeners.get(nome).push(callback);
      if (opts?.once) callback.__once = true;
    },
  };
  const eventos = { onclick: null };
  const botaoRecuperacao = {
    hidden: true,
    callbacks: [],
    addEventListener(_nome, callback) { this.callbacks.push(callback); },
    click() { for (const callback of this.callbacks) callback(); },
  };
  const elements = new Map([
    ['backupLocalStatus', status], ['backupRecuperacaoStatus', recoveryStatus],
    ['backupLocalSelecionado', seletor],
    ['backupLocalDetalhes', detalhes], ['backupLocalDialogo', dialogo],
    ['backupLocalEventos', eventos], ['backupLocalAbrir', botaoRecuperacao],
  ]);
  const document = {
    readyState: 'complete',
    addEventListener(nome, callback) {
      if (!listeners.has(nome)) listeners.set(nome, []);
      listeners.get(nome).push(callback);
    },
    getElementById(id) { return elements.get(id) || null; },
    createElement(tag) { return tag === 'option' ? { value: '', textContent: '' } : {}; },
    querySelector() { return dialogo.open ? dialogo : null; },
  };
  const window = {
    __registrarUltimoBackupLocalFicha(value) { window.lastBackup = value; },
    addEventListener(nome, callback) {
      if (!listeners.has(`window:${nome}`)) listeners.set(`window:${nome}`, []);
      listeners.get(`window:${nome}`).push(callback);
    },
    __fichaImportacaoTransacaoAtiva: null,
  };
  let payload = {
    fichaSchemaVersion: 1,
    nomePersonagem: 'Personagem A',
    jogador: 'Jogadora',
    racaID: 'Humana',
    classeNomeID: 'Guerreira',
    classeNivelID: '3',
    marcador: 1,
  };
  const context = vm.createContext({
    indexedDB: options.storageUnavailable ? undefined : db.indexedDB,
    document,
    window,
    console: { error() {}, warn() {} },
    Date,
    Math,
    JSON,
    Promise,
    Map,
    Set,
    globalThis: null,
    clearTimeout(id) { timers.delete(id); },
    setTimeout(callback, delay) {
      const id = ++timerId;
      timers.set(id, { callback, delay });
      return id;
    },
    confirm: () => options.confirmResult ?? true,
    coletarSnapshotPersistenteFicha: () => structuredClone(payload),
    fichaFoiAlterada: () => options.dirty === true,
    campoEhPersistenteDaFicha: () => true,
    prepararImportacaoFicha(json) { return JSON.parse(json); },
    aplicarDadosFicha: async (dados) => {
      if (options.applyError) throw options.applyError;
      if (options.applyResult === false) return false;
      payload = structuredClone(dados);
      return true;
    },
  });
  let timerId = 0;
  context.globalThis = context;
  context.setPayload = (value) => { payload = structuredClone(value); };
  context.getPayload = () => structuredClone(payload);
  context.dispatch = (name, target = {}) => {
    for (const callback of listeners.get(name) || []) callback({ type: name, target });
  };
  context.fireWindow = (name) => {
    for (const callback of listeners.get(`window:${name}`) || []) callback();
  };
  context.runTimer = (delay) => {
    const entry = [...timers.entries()].find(([, item]) => item.delay === delay);
    if (!entry) return false;
    timers.delete(entry[0]);
    entry[1].callback();
    return true;
  };
  context.timerCount = (delay) => [...timers.values()].filter((item) => item.delay === delay).length;
  context.clickRecovery = async (acao) => eventos.onclick?.({ target: { dataset: { acao } } });
  vm.runInContext(source, context, { filename: 'js/core/backup-local.js' });
  return { context, db, status, recoveryStatus, seletor, detalhes, dialogo, botaoRecuperacao, timers, get payload() { return payload; } };
}

test('cria cópia IndexedDB versionada e mantém o indicador de alterações pendentes', async () => {
  const harness = criarHarness({ dirty: true });
  const result = await harness.context.window.__gravarBackupLocalFichaAgora();
  const [record] = harness.db.snapshots.values();

  assert.equal(result.ok, true);
  assert.equal(record.versaoBackup, 1);
  assert.equal(record.fichaSchemaVersion, 1);
  assert.equal(JSON.parse(record.payloadJson).marcador, 1);
  assert.equal(harness.context.window.lastBackup.backupId, record.backupId);
  assert.equal(harness.botaoRecuperacao.hidden, false);
  assert.equal(harness.context.fichaFoiAlterada(), true);
  assert.match(harness.status.textContent, /Backup local atualizado/);
});

test('estado repetido não cria backups redundantes; estados distintos ficam separados e recuperáveis', async () => {
  const harness = criarHarness();
  const first = await harness.context.window.__gravarBackupLocalFichaAgora();
  const duplicate = await harness.context.window.__gravarBackupLocalFichaAgora();
  assert.equal(first.ok, true);
  assert.equal(duplicate.duplicado, true);
  assert.equal(harness.db.snapshots.size, 1);

  harness.context.setPayload({ ...harness.context.getPayload(), nomePersonagem: 'Personagem B', marcador: 2 });
  const second = await harness.context.window.__gravarBackupLocalFichaAgora();
  assert.equal(second.ok, true);
  assert.equal(harness.db.snapshots.size, 2);
  assert.equal(new Set([...harness.db.snapshots.values()].map((item) => item.personagemId)).size, 2);
});

test('personagens com o mesmo nome ficam distinguíveis por raça e referência da cópia', async () => {
  const harness = criarHarness();
  await harness.context.window.__gravarBackupLocalFichaAgora();
  harness.context.setPayload({ ...harness.context.getPayload(), racaID: 'Élfica', marcador: 2 });
  await harness.context.window.__gravarBackupLocalFichaAgora();

  assert.equal(harness.db.snapshots.size, 2);
  assert.equal(new Set([...harness.db.snapshots.values()].map((item) => item.personagemId)).size, 2);
  assert.equal(harness.context.runTimer(1000), true);
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  const labels = harness.seletor.options.map((option) => option.textContent);
  assert.equal(labels.length, 2);
  assert.ok(labels.some((label) => label.includes('Humana')));
  assert.ok(labels.some((label) => label.includes('Élfica')));
  assert.ok(labels.every((label) => /cópia [a-z0-9]{8}$/i.test(label)));
});

test('debounce aguarda 10 segundos e reinicia após nova edição persistente', async () => {
  const harness = criarHarness({ dirty: true });
  harness.context.dispatch('input', { tagName: 'INPUT' });
  assert.equal(harness.context.timerCount(10000), 1);
  harness.context.dispatch('change', { tagName: 'SELECT' });
  assert.equal(harness.context.timerCount(10000), 1);
  assert.equal(harness.context.runTimer(10000), true);
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(harness.db.snapshots.size, 1);
});

test('importação suspende timer e só agenda snapshot final depois do sucesso', async () => {
  const harness = criarHarness({ dirty: true });
  harness.context.dispatch('input', { tagName: 'INPUT' });
  harness.context.window.__suspenderBackupLocalAutomatico();
  assert.equal(harness.context.timerCount(10000), 0);
  harness.context.dispatch('input', { tagName: 'INPUT' });
  assert.equal(harness.context.timerCount(10000), 0);
  harness.context.window.__retomarBackupLocalAutomatico({ persistir: true });
  assert.equal(harness.context.timerCount(10000), 1);
  assert.equal(harness.db.snapshots.size, 0);
});

test('quota preserva registros anteriores e informa que nenhum backup foi apagado', async () => {
  const harness = criarHarness();
  const first = await harness.context.window.__gravarBackupLocalFichaAgora();
  const previous = [...harness.db.snapshots.keys()];
  harness.context.setPayload({ ...harness.context.getPayload(), marcador: 9 });
  harness.db.setQuotaError(true);
  const failed = await harness.context.window.__gravarBackupLocalFichaAgora();
  assert.equal(first.ok, true);
  assert.equal(failed.ok, false);
  assert.deepEqual([...harness.db.snapshots.keys()], previous);
  assert.equal(harness.context.window.lastBackup.backupId, previous[0]);
  assert.match(harness.status.textContent, /backups anteriores foram preservados/);
  assert.equal(harness.context.fichaFoiAlterada(), false, 'a falha não altera o indicador de pendências');
});

test('armazenamento indisponível não altera personagem nem marca backup como concluído', async () => {
  const payload = {
    fichaSchemaVersion: 1,
    nomePersonagem: 'Personagem A',
    jogador: 'Jogadora',
    racaID: 'Humana',
    marcador: 4,
  };
  const harness = criarHarness({
    dirty: true,
    storageUnavailable: true,
  });
  const antes = harness.context.getPayload();
  const result = await harness.context.window.__gravarBackupLocalFichaAgora();

  assert.equal(result.ok, false);
  assert.deepEqual(harness.context.getPayload(), antes);
  assert.equal(harness.context.window.lastBackup, undefined);
  assert.match(harness.status.textContent, /Backup local indisponível/);
  assert.equal(harness.context.fichaFoiAlterada(), true);
});

test('falha ao abrir o banco não altera a ficha nem registra backup', async () => {
  const harness = criarHarness({
    dirty: true,
    openError: new Error('IndexedDB blocked'),
  });
  const antes = harness.context.getPayload();
  const result = await harness.context.window.__gravarBackupLocalFichaAgora();

  assert.equal(result.ok, false);
  assert.deepEqual(harness.context.getPayload(), antes);
  assert.equal(harness.context.window.lastBackup, undefined);
  assert.match(harness.status.textContent, /Backup local indisponível/);
  assert.equal(harness.context.fichaFoiAlterada(), true);
});

test('backup corrompido não é oferecido para recuperação', async () => {
  const harness = criarHarness();
  await harness.context.window.__gravarBackupLocalFichaAgora();
  const record = [...harness.db.snapshots.values()][0];
  record.payloadJson = '{malformado';
  harness.db.snapshots.set(record.backupId, record);
  const recoverable = await harness.context.window.__obterBackupsLocaisRecuperaveis();
  assert.equal(recoverable.length, 0);
});

test('recuperação exibe identidade/data e exige confirmação antes de aplicar', async () => {
  const harness = criarHarness({ confirmResult: false });
  await harness.context.window.__gravarBackupLocalFichaAgora();
  assert.equal(harness.context.runTimer(1000), true);
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(harness.dialogo.open, true);
  assert.equal(harness.seletor.options.length, 1);
  assert.match(harness.detalhes.textContent, /Personagem A/);
  assert.match(harness.detalhes.textContent, /Backup selecionado/);
  assert.match(harness.detalhes.textContent, /cópia/);
  const before = harness.context.getPayload();
  await harness.context.clickRecovery('restaurar');
  assert.deepEqual(harness.context.getPayload(), before);
  assert.equal(harness.dialogo.open, true);
  await harness.context.clickRecovery('manter');
  assert.equal(harness.dialogo.open, false);
  harness.botaoRecuperacao.click();
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(harness.dialogo.open, true, 'recuperação pode ser reaberta sem recarregar a ficha atual');
});

test('recuperação confirmada aplica somente o backup selecionado', async () => {
  const writer = criarHarness();
  await writer.context.window.__gravarBackupLocalFichaAgora();
  const reader = criarHarness({ db: writer.db });
  reader.context.setPayload({ ...reader.context.getPayload(), nomePersonagem: 'Ficha atual', marcador: 77 });
  assert.equal(reader.context.runTimer(1000), true);
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reader.dialogo.open, true);

  await reader.context.clickRecovery('restaurar');

  assert.equal(reader.context.getPayload().nomePersonagem, 'Personagem A');
  assert.equal(reader.context.getPayload().marcador, 1);
  assert.equal(reader.dialogo.open, false);
  assert.match(reader.status.textContent, /Backup local restaurado/);
});

test('falha no aplicador durante recuperação não substitui a ficha atual', async () => {
  const writer = criarHarness();
  await writer.context.window.__gravarBackupLocalFichaAgora();
  const current = { ...writer.context.getPayload(), nomePersonagem: 'Ficha atual', marcador: 88 };
  const reader = criarHarness({ db: writer.db, applyResult: false });
  reader.context.setPayload(current);
  assert.equal(reader.context.runTimer(1000), true);
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  await reader.context.clickRecovery('restaurar');

  assert.deepEqual(reader.context.getPayload(), current);
  assert.equal(reader.dialogo.open, true);
  assert.match(reader.recoveryStatus.textContent, /A recuperação não foi concluída/);
  assert.match(reader.recoveryStatus.textContent, /Confira o estado atual/);
});

for (const [code, expected] of [
  ['CHARACTER_SHEET_ROLLBACK_UNVERIFIED', /estabilidade após reconciliação não foi comprovada/],
  ['CHARACTER_SHEET_ROLLBACK_FAILED', /rollback da recuperação apresentou divergências/],
]) {
  test(`recuperação expõe diagnóstico específico de ${code} sem substituir o backup íntegro`, async () => {
    const writer = criarHarness();
    await writer.context.window.__gravarBackupLocalFichaAgora();
    const initialBackupIds = [...writer.db.snapshots.keys()];
    const current = { ...writer.context.getPayload(), nomePersonagem: 'Ficha B', marcador: 55 };
    const applyError = Object.assign(new Error(`injetada ${code}`), { code });
    const reader = criarHarness({ db: writer.db, applyError });
    reader.context.setPayload(current);
    assert.equal(reader.context.runTimer(1000), true);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    await reader.context.clickRecovery('restaurar');

    assert.deepEqual(reader.context.getPayload(), current);
    assert.equal(reader.dialogo.open, true);
    assert.match(reader.recoveryStatus.textContent, expected);
    assert.deepEqual([...writer.db.snapshots.keys()], initialBackupIds);
  });
}

test('não cria nem anuncia backup sem identificação suficiente do personagem', async () => {
  const harness = criarHarness();
  harness.context.setPayload({ fichaSchemaVersion: 1, jogador: 'Jogadora', marcador: 1 });
  const result = await harness.context.window.__gravarBackupLocalFichaAgora();
  assert.equal(result.ok, false);
  assert.equal(result.ignorado, true);
  assert.equal(harness.db.snapshots.size, 0);
  assert.equal(harness.status.textContent, '');
});
