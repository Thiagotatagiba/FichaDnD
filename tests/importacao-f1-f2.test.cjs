const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

// Reuse the existing deterministic import harness without changing its file.
// This evaluates only helper declarations and intentionally excludes tests.
function loadRollbackHarnessHelpers() {
  const source = read('tests/importacao-rollback.test.cjs');
  const marker = 'for (const [phase, prepare] of [';
  const end = source.indexOf(marker);
  const failureStart = source.indexOf('function armFailure(harness, point) {');
  const failureEnd = source.indexOf('\nfor (const point of [', failureStart);
  assert.notEqual(end, -1, 'marcador do bloco de testes do harness existente');
  assert.ok(failureStart >= 0 && failureEnd > failureStart, 'helper de falha injetada');
  const sandbox = {
    require,
    __dirname: path.join(root, 'tests'),
    console,
    setTimeout,
    clearTimeout,
    setImmediate,
    structuredClone,
  };
  vm.runInNewContext(
    `${source.slice(0, end)}\n${source.slice(failureStart, failureEnd)}\nglobalThis.__e14f = { createHarness, importPayload, armFailure, extractFunction };`,
    sandbox,
    { filename: 'tests/importacao-rollback.test.cjs#helpers' },
  );
  return sandbox.__e14f;
}

function installRealXPDisplayFunctions(harness) {
  const source = read('js/data/racas-subclasses.js');
  const updater = source.slice(
    source.indexOf('function atualizarXPENivel('),
    source.indexOf('\ndocument.getElementById("xp").addEventListener("input", atualizarXPENivel);'),
  );
  const reconciler = source.slice(
    source.indexOf('window.__reconciliarModaisXPLevelUp = function'),
    source.indexOf('\n// Animação visual simples para celebrar Level Up.'),
  );
  assert.ok(updater.startsWith('function atualizarXPENivel('));
  assert.ok(reconciler.startsWith('window.__reconciliarModaisXPLevelUp = function'));
  const paletteStart = source.indexOf('const PALETA_XP_NIVEIS = [');
  const paletteEnd = source.indexOf('\n];', paletteStart) + 3;
  assert.ok(paletteStart >= 0 && paletteEnd > paletteStart, 'paleta por nível');
  harness.run(source.slice(paletteStart, paletteEnd));

  harness.run(`
    var tabelaXP = [
      { xp: 0, nivel: 1 }, { xp: 300, nivel: 2 }, { xp: 900, nivel: 3 },
      { xp: 2700, nivel: 4 }, { xp: 6500, nivel: 5 },
    ];
    document.getElementById('xp').value = '1200';
    document.getElementById('classeNivelID').value = '3';
    document.getElementById('xpBarNext');
    document.getElementById('xpBarCurrent');
    document.getElementById('xpTexto');
    atualizarDadosVidaTotal = () => {};
    processarLevelUp = () => Promise.resolve();
    setXP = valor => {
      document.getElementById('xp').value = Number(valor) || 0;
      atualizarXPENivel();
    };
  `);
  harness.run(updater);
  harness.run(reconciler);
  harness.run(`setXP(1200);`);
  return harness;
}

function installActualXPAnimation(harness) {
  const source = read('js/data/racas-subclasses.js');
  const cancelStart = source.indexOf('window.__cancelarOperacoesModaisXPLevelUp = async function');
  const reconcileStart = source.indexOf('window.__reconciliarModaisXPLevelUp = function', cancelStart);
  const animationStart = source.indexOf('const animateBar = (toPercent, duration) =>');
  const animationEnd = source.indexOf('if (novo >= xpProximoNivel)', animationStart);
  const reconcileEnd = source.indexOf('\n// Animação visual simples para celebrar Level Up.', reconcileStart);
  assert.ok(cancelStart >= 0 && reconcileStart > cancelStart);
  assert.ok(animationStart >= 0 && animationEnd > animationStart);
  assert.ok(reconcileEnd > reconcileStart);
  const cancel = source.slice(cancelStart, reconcileStart).trim();
  const reconcileCode = source.slice(reconcileStart, reconcileEnd).trim();
  const animation = source.slice(animationStart, animationEnd).trim();
  harness.run(`
    const operacoesModaisXPLevelUp = new Set();
    var timersXPTeste = [];
    var timerXPSequence = 0;
    var setTimeoutNativoXP = setTimeout;
    var clearTimeoutNativoXP = clearTimeout;
    setTimeout = (callback, delay = 0) => {
      if (delay < 500) return setTimeoutNativoXP(callback, delay);
      const timer = { id: ++timerXPSequence, callback, delay, cleared: false };
      timersXPTeste.push(timer);
      return timer.id;
    };
    clearTimeout = id => {
      const timer = timersXPTeste.find(item => item.id === id);
      if (timer) { timer.cleared = true; return; }
      clearTimeoutNativoXP(id);
    };
    window.__fichaImportacaoEpoch = 0;
    window.__fichaImportacaoTransacaoAtiva = null;
    var epochAnimacaoXP = 0;
    var operacaoContinuaAtual = () =>
      window.__fichaImportacaoEpoch === epochAnimacaoXP && !window.__fichaImportacaoTransacaoAtiva;
    var xpBar = document.getElementById('xpBar');
    var xpBarNext = document.getElementById('xpBarNext');
    var xpBarCurrent = document.getElementById('xpBarCurrent');
    var novo = 2000;
    var xpAtual = 1200;
    var xpProximoNivel = 2700;
    var tabelaXPAnimacao = [
      { xp: 0, nivel: 1 }, { xp: 300, nivel: 2 },
      { xp: 900, nivel: 3 }, { xp: 2700, nivel: 4 },
    ];
    var tabelaXP = tabelaXPAnimacao;
    var animateBar = null;
  `);
  harness.run(cancel);
  harness.run(reconcileCode);
  harness.run(animation.replace(/^const animateBar/, 'animateBar'));
  harness.timersXP = {
    latest() { return harness.run('timersXPTeste[timersXPTeste.length - 1]'); },
    all() { return Array.from(harness.run('timersXPTeste')); },
    fire(timer) { timer.callback(); },
    beginNextGeneration() {
      harness.run('epochAnimacaoXP = window.__fichaImportacaoEpoch;');
    },
    start(percent, duration = 600) {
      harness.run(`novo = 1200 + (${percent}/100) * 1800; xpAtual = 1200;`);
      return harness.run(`animateBar(${percent}, ${duration})`);
    },
  };
  return harness;
}

const ARMOR_SAVE = read('js/modules/armaduras-catalogo.js').slice(
  read('js/modules/armaduras-catalogo.js').indexOf('function salvarModalArmadura('),
  read('js/modules/armaduras-catalogo.js').indexOf('\nasync function restaurarPadraoModalArmadura()', read('js/modules/armaduras-catalogo.js').indexOf('function salvarModalArmadura(')),
);
const SHIELD_SAVE = read('js/modules/escudos-catalogo.js').slice(
  read('js/modules/escudos-catalogo.js').indexOf('function salvarModalEscudo('),
  read('js/modules/escudos-catalogo.js').indexOf('\nasync function restaurarPadraoModalEscudo()', read('js/modules/escudos-catalogo.js').indexOf('function salvarModalEscudo(')),
);

function editorSaveHarness(kind, connected = false) {
  const armor = kind === 'armadura';
  const prefix = armor ? 'armadura' : 'escudo';
  const overlayId = armor ? 'armaduraModalOverlay' : 'escudoModalOverlay';
  const fieldName = `${prefix}_nome`;
  const list = { children: [], contains(node) { return this.children.includes(node); } };
  const oldValue = { value: 'Nome antigo' };
  const target = {
    value: 'Nome novo', dataset: { editorCampo: fieldName },
  };
  const flags = {
    checked: false,
    classList: { toggle() {} },
  };
  const indicator = { classList: { toggle() {} } };
  const detachedCard = {
    isConnected: connected,
    parentElement: connected ? list : null,
    matches(selector) { return selector.includes(`data-tipo="${prefix}"`); },
    querySelector(selector) {
      if (selector.includes(`data-campo="${fieldName}"`)) return oldValue;
      if (selector === '.item-flag-magico' || selector === '.item-flag-sintonizado') return flags;
      if (selector === '.item-proficiencia') return indicator;
      return null;
    },
  };
  const form = {
    reportValidity() { return true; },
    querySelectorAll() { return [target]; },
  };
  if (connected) list.children.push(detachedCard);
  const overlay = {
    classList: { contains() { return true; }, remove() {}, add() {} },
    setAttribute() {},
  };
  const editButton = { focus() {} };
  const overlayFlags = {
    checked: true,
  };
  let sideEffects = 0;
  const document = {
    getElementById(id) {
      if (id === `${prefix}ModalFormulario`) return form;
      if (id === (armor ? 'listaArmaduras' : 'listaEscudos')) return list;
      if (id === overlayId) return overlay;
      if (id === `${armor ? 'escudo' : 'armadura'}ModalOverlay`) return null;
      return null;
    },
    querySelector(selector) {
      if (selector.includes(`${overlayId} [data-editor-flag="magico"]`)) return overlayFlags;
      if (selector.includes(`${overlayId} [data-editor-flag="sintonizado"]`)) return overlayFlags;
      if (selector.includes(`${overlayId} [data-editor-flag="proficiente"]`)) return overlayFlags;
      if (selector.includes(`${overlayId} [data-acao="editar"]`)) return editButton;
      return null;
    },
    querySelectorAll() { return []; },
  };
  const context = vm.createContext({
    document,
    estadoModalArmadura: { card: detachedCard, foco: null, editando: true, original: '', invalidada: false, sessao: 4 },
    estadoModalEscudo: { card: detachedCard, foco: null, editando: true, retrato: null, invalidada: false, sessao: 4 },
    window: { __fichaImportacaoTransacaoAtiva: null },
    armaduraEquipadaIndice: 0,
    atualizarCamposMagicosItem() { sideEffects += 1; },
    atualizarPesoAtualInventario() { sideEffects += 1; },
    atualizarListaArmasEquipamento() { sideEffects += 1; },
    equiparArmadura() { sideEffects += 1; },
    renderizarModalArmadura() {},
    renderizarModalEscudo() {},
    confirmarDescarteModalArmadura() { return true; },
    confirmarDescarteEdicaoEscudo() { return true; },
    fecharModalArmadura(forcar) {
      if (forcar !== true) return;
      const state = context.estadoModalArmadura;
      overlay.classList.remove('ativo'); overlay.classList.add('oculto');
      state.card = null; state.editando = false; state.invalidada = true; state.sessao += 1;
    },
    fecharModalEscudo(forcar) {
      if (forcar !== true) return;
      const state = context.estadoModalEscudo;
      overlay.classList.remove('ativo'); overlay.classList.add('oculto');
      state.card = null; state.editando = false; state.invalidada = true; state.sessao += 1;
    },
  });
  const moduleSource = read(armor ? 'js/modules/armaduras-catalogo.js' : 'js/modules/escudos-catalogo.js');
  const guardStart = moduleSource.indexOf(armor ? 'function cardArmaduraNaListaAtiva(' : 'function cardEscudoNaListaAtiva(');
  const canActStart = moduleSource.indexOf(armor ? 'function editorArmaduraPodeAgir()' : 'function editorEscudoPodeAgir()', guardStart);
  const saveStart = moduleSource.indexOf(armor ? 'function salvarModalArmadura(' : 'function salvarModalEscudo(');
  const saveEnd = moduleSource.indexOf(armor ? '\nasync function restaurarPadraoModalArmadura()' : '\nasync function restaurarPadraoModalEscudo()', saveStart);
  assert.ok(guardStart >= 0 && canActStart > guardStart && saveStart > canActStart && saveEnd > saveStart);
  const hookStart = moduleSource.indexOf(
    armor ? 'globalThis.__reconciliarEditorArmaduraImportacao = function' : 'globalThis.__reconciliarEditorEscudoImportacao = function',
    canActStart,
  );
  assert.ok(guardStart >= 0 && canActStart > guardStart && hookStart > canActStart);
  vm.runInContext(moduleSource.slice(guardStart, hookStart), context);
  vm.runInContext(armor ? ARMOR_SAVE : SHIELD_SAVE, context);
  const hookEnd = moduleSource.indexOf(armor ? 'function focarModalArmadura(' : 'function criarElementoEscudo(', hookStart);
  if (hookStart >= 0 && hookEnd > hookStart) vm.runInContext(moduleSource.slice(hookStart, hookEnd), context);
  return {
    context,
    detachedCard,
    oldValue,
    list,
    get sideEffects() { return sideEffects; },
  };
}

function installInventoryEditorHookSpies(harness) {
  harness.run(`
    var editorHookCalls = [];
    var editorArmadura = { card: document.getElementById('listaArmaduras').children[0], open: true };
    var editorEscudo = { card: document.getElementById('listaEscudos').children[0], open: true };
    window.__reconciliarEditorArmaduraImportacao = () => {
      const closed = !!editorArmadura.open && !editorArmadura.card?.isConnected;
      editorHookCalls.push({ kind: 'armadura', connected: !!editorArmadura.card?.isConnected, closed });
      if (closed) { editorArmadura.card = null; editorArmadura.open = false; }
      return { ok: true, closed };
    };
    window.__reconciliarEditorEscudoImportacao = () => {
      const closed = !!editorEscudo.open && !editorEscudo.card?.isConnected;
      editorHookCalls.push({ kind: 'escudo', connected: !!editorEscudo.card?.isConnected, closed });
      if (closed) { editorEscudo.card = null; editorEscudo.open = false; }
      return { ok: true, closed };
    };
  `);
}

test('E1.4-F1: rollback reconcilia barra XP ao valor restaurado', async () => {
  const helpers = loadRollbackHarnessHelpers();
  const harness = installActualXPAnimation(installRealXPDisplayFunctions(helpers.createHarness()));

  // Use a função de animação do fluxo de XP: o estado ainda guarda 1200,
  // enquanto a camada recebe imediatamente o destino visual de 61,11%.
  const oldAnimation = harness.timersXP.start(61.111111111111114);
  const oldTimer = harness.timersXP.latest();
  assert.equal(harness.run("document.getElementById('xpBarNext').style.width"), '61.111111111111114%');
  helpers.armFailure(harness, 'end-sync');
  await helpers.importPayload(harness, {
    nomePersonagem: 'Importação com falha', xp: 2000,
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });

  assert.equal(harness.run('completionResult.codigo'), 'CHARACTER_SHEET_ROLLBACK_UNVERIFIED');
  assert.equal(harness.run("document.getElementById('xp').value"), '1200');
  assert.equal(harness.run("document.getElementById('xpLevelLabel').textContent"), 'NÍVEL 3');
  assert.equal(harness.run("document.getElementById('xpCurrentValue').textContent"), '1.200');
  assert.equal(harness.run("document.getElementById('xpThresholdValue').textContent"), '/ 2.700 XP');
  assert.equal(harness.run("document.getElementById('xpTooltip').textContent"),
    'Faltam 1.500 XP para o nível 4');
  assert.equal(harness.run("document.getElementById('xpTexto').textContent"),
    '1.200 / 2.700 XP · Nível 3 · 16,7% até o nível 4');
  assert.equal(harness.run("document.getElementById('xpBarNext').style.width"), '16.666666666666664%');
  assert.equal(harness.run("document.getElementById('xpBarCurrent').style.background"), '#F2C14E');
  assert.equal(harness.run("document.getElementById('xpBarNext').style.background"), '#542E6F');
  assert.equal(harness.run("document.getElementById('xpProgressMarker').style.left"), '16.7%');
  assert.equal(harness.run("document.getElementById('xpBar').getAttribute('aria-valuenow')"), '16.7');
  assert.equal(harness.run("document.getElementById('xpBarNext').style.transition"), 'none',
    'a reconciliação não anima a correção para o estado restaurado');

  const restored = harness.run(`JSON.stringify([
    document.getElementById('xp').value,
    document.getElementById('xpTexto').textContent,
    document.getElementById('xpBarCurrent').style.background,
    document.getElementById('xpBarNext').style.background,
    document.getElementById('xpBarNext').style.width,
    document.getElementById('xpProgressMarker').style.left,
    document.getElementById('xpBar').getAttribute('aria-valuenow'),
    document.getElementById('xpBar').getAttribute('aria-valuetext'),
    document.getElementById('xpLevelLabel').textContent,
    document.getElementById('xpCurrentValue').textContent,
    document.getElementById('xpThresholdValue').textContent,
    document.getElementById('xpTooltip').textContent,
  ])`);
  harness.timersXP.fire(oldTimer); // callback já enfileirado apesar de clearTimeout.
  await oldAnimation;
  assert.equal(
    harness.run(`JSON.stringify([
      document.getElementById('xp').value,
      document.getElementById('xpTexto').textContent,
      document.getElementById('xpBarCurrent').style.background,
      document.getElementById('xpBarNext').style.background,
      document.getElementById('xpBarNext').style.width,
      document.getElementById('xpProgressMarker').style.left,
      document.getElementById('xpBar').getAttribute('aria-valuenow'),
      document.getElementById('xpBar').getAttribute('aria-valuetext'),
      document.getElementById('xpLevelLabel').textContent,
      document.getElementById('xpCurrentValue').textContent,
      document.getElementById('xpThresholdValue').textContent,
      document.getElementById('xpTooltip').textContent,
    ])`),
    restored,
    'callback de animação antiga não pode alterar o estado visual restaurado',
  );

  harness.timersXP.beginNextGeneration();
  const newAnimation = harness.timersXP.start(33.33333333333333);
  const newTimer = harness.timersXP.latest();
  harness.timersXP.fire(newTimer);
  await newAnimation;
  harness.run('setXP(1500)');
  assert.equal(harness.run("document.getElementById('xpTexto').textContent"),
    '1.500 / 2.700 XP · Nível 3 · 33,3% até o nível 4');
  assert.equal(harness.run("document.getElementById('xpBarNext').style.width"), '33.33333333333333%');

  harness.run(`failAt = ''; atualizarFicha = () => {};`);
  await helpers.importPayload(harness, {
    nomePersonagem: 'Importação bem-sucedida XP', xp: 1800,
    armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
  });
  assert.equal(harness.run('completionResult.tipo'), 'sucesso', JSON.stringify(harness.run('completionResult')));
  assert.equal(harness.run("document.getElementById('xpTexto').textContent"),
    '1.800 / 2.700 XP · Nível 3 · 50% até o nível 4');
  assert.equal(harness.run("document.getElementById('xpTooltip').textContent"),
    'Faltam 900 XP para o nível 4');
  assert.equal(harness.run("document.getElementById('xpBarNext').style.width"), '50%');
  assert.equal(harness.run("document.getElementById('xpBarCurrent').style.background"), '#F2C14E');
  assert.equal(harness.run("document.getElementById('xpBarNext').style.background"), '#542E6F');
});

for (const kind of ['armadura', 'escudo']) {
  for (const outcome of ['sucesso', 'rollback']) {
    test(`E1.4-F2: ${kind} antigo é invalidado após ${outcome} da importação`, async () => {
      const helpers = loadRollbackHarnessHelpers();
      const harness = helpers.createHarness();
      installInventoryEditorHookSpies(harness);
      if (outcome === 'rollback') helpers.armFailure(harness, 'end-sync');

      await helpers.importPayload(harness, {
        nomePersonagem: `Import ${outcome}`,
        armas: [], municoes: [], armaduras: [], escudos: [], outros: [],
      });

      const resultType = harness.run('completionResult.tipo');
      assert.equal(resultType, outcome === 'sucesso' ? 'sucesso' : 'erro');
      assert.equal(harness.run(`editor${kind === 'armadura' ? 'Armadura' : 'Escudo'}.card`), null);
      assert.equal(harness.run(`editor${kind === 'armadura' ? 'Armadura' : 'Escudo'}.open`), false);
      const calls = Array.from(harness.run('editorHookCalls'));
      const ownCalls = calls.filter(call => call.kind === kind);
      assert.equal(ownCalls.length, outcome === 'sucesso' ? 1 : 2,
        'sucesso consulta uma vez; rollback consulta antes e depois de restaurar os nós');
      assert.equal(ownCalls[0].connected, false, 'a referência antiga já não pertence à lista ativa');
      assert.equal(ownCalls[0].closed, true);
      if (outcome === 'rollback') {
        assert.equal(ownCalls[1].connected, false, 'a segunda consulta não recupera a referência descartada');
      }
      if (outcome === 'rollback') {
        assert.equal(harness.run('completionResult.snapshotRestored'), true);
        assert.equal(harness.run('document.getElementById("lista' + (kind === 'armadura' ? 'Armaduras' : 'Escudos') + '").children[0].isConnected'), true,
          'rollback restaura o nó, mas não ressuscita o editor antigo');
      }
    });
  }
}

for (const kind of ['armadura', 'escudo']) {
  test(`E1.4-F2: salvar editor de ${kind} não grava por card desconectado`, () => {
    const harness = editorSaveHarness(kind);
    const guardName = kind === 'armadura' ? 'editorArmaduraPodeAgir' : 'editorEscudoPodeAgir';
    const saveName = kind === 'armadura' ? 'salvarModalArmadura' : 'salvarModalEscudo';
    const oldSession = harness.context[kind === 'armadura' ? 'estadoModalArmadura' : 'estadoModalEscudo'].sessao;
    assert.equal(vm.runInContext(`${guardName}()`, harness.context), false, 'o guard detecta a referência removida');
    const saved = vm.runInContext(`${saveName}(${oldSession})`, harness.context);
    assert.equal(saved, false, 'submit capturado antes da invalidação não pode gravar depois dela');
    assert.equal(harness.oldValue.value, 'Nome antigo', 'o objeto importado/removido não pode ser alterado');
    assert.equal(harness.sideEffects, 0, 'não devem disparar recálculos a partir de card obsoleto');
  });

  test(`E1.4-F2: reconciliar editor de ${kind} mantém editor enquanto card continua ativo`, () => {
    const harness = editorSaveHarness(kind, true);
    const hookName = kind === 'armadura'
      ? 'globalThis.__reconciliarEditorArmaduraImportacao()'
      : 'globalThis.__reconciliarEditorEscudoImportacao()';
    const result = vm.runInContext(hookName, harness.context);
    assert.equal(result.ok, true);
    assert.equal(result.closed, false);
    assert.ok(harness.context[kind === 'armadura' ? 'estadoModalArmadura' : 'estadoModalEscudo'].card);
    assert.equal(harness.context[kind === 'armadura' ? 'estadoModalArmadura' : 'estadoModalEscudo'].editando, true);
  });

  test(`E1.4-F2: salvar editor de ${kind} continua funcionando para card ativo`, () => {
    const harness = editorSaveHarness(kind, true);
    vm.runInContext(kind === 'armadura' ? 'salvarModalArmadura()' : 'salvarModalEscudo()', harness.context);
    assert.equal(harness.oldValue.value, 'Nome novo');
    assert.ok(harness.sideEffects > 0, 'o caminho válido ainda atualiza os resumos relacionados');
  });
}
