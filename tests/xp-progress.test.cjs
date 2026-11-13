const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/data/racas-subclasses.js'), 'utf8');
const storageSource = fs.readFileSync(path.join(root, 'js/core/storage.js'), 'utf8');
const preparationTests = fs.readFileSync(path.join(__dirname, 'importacao-preparacao.test.cjs'), 'utf8');

const EXPECTED_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
const EXPECTED_PALETTE = ['#18324A', '#F2C14E', '#542E6F', '#72DDF7', '#5B2333', '#E8F1F2',
  '#243B1E', '#F4A259', '#3D405B', '#F2CC8F', '#6D213C', '#B8F2E6', '#284B63', '#F4D35E',
  '#4C2A85', '#A8DADC', '#3A2618', '#D7E3FC', '#5F0F40', '#FAA916'];
const ALTERNATIVE_PALETTES = [
  ['#171717', '#F5F5F5', '#303030', '#E8E8E8', '#484848', '#DBDBDB', '#202020', '#F0F0F0',
    '#393939', '#E2E2E2', '#111111', '#FAFAFA', '#454545', '#D8D8D8', '#272727', '#EEEEEE',
    '#3A3A3A', '#E0E0E0', '#1D1D1D', '#F7F7F7'],
  ['#123B5D', '#F3C969', '#3A2559', '#9FE7F5', '#6A2634', '#E9F4CE', '#1B4B3E', '#F7B267',
    '#293241', '#D6E2F0', '#5B1E3B', '#B7E4C7', '#17324D', '#FFE08A', '#4B2E83', '#CDE7F0',
    '#4A2C1D', '#E4C1F9', '#7A1F4D', '#FFF0A6'],
];

const VISION_MATRICES = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};

function rgb(hex) { return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255); }
function encodeRGB(values) {
  return `#${values.map((value) => Math.round(Math.max(0, Math.min(1, value)) * 255)
    .toString(16).padStart(2, '0')).join('')}`;
}
function linearChannel(value) { return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }
function luminance(hex) {
  const [red, green, blue] = rgb(hex).map(linearChannel);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
function contrastRatio(first, second) {
  const [bright, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (bright + 0.05) / (dark + 0.05);
}
function simulateVision(hex, matrix) {
  const channels = rgb(hex);
  return encodeRGB(matrix.map((row) => row.reduce((sum, coefficient, index) =>
    sum + coefficient * channels[index], 0)));
}
function simulateGrayscale(hex) {
  const [red, green, blue] = rgb(hex);
  const gray = (0.2126 * red + 0.7152 * green + 0.0722 * blue) * 255;
  const channel = Math.round(gray).toString(16).padStart(2, '0');
  return `#${channel}${channel}${channel}`;
}

function sliceBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `Não foi possível localizar ${startMarker}`);
  return text.slice(start, end);
}

function createProgressHarness() {
  const elements = new Map();
  const make = (id) => ({
    id, value: '', textContent: '', style: {}, attributes: {},
    dataset: {},
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    setCustomValidity(value) { this.validationMessage = value; },
    querySelector() { return null; },
  });
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, make(id));
    return elements.get(id);
  } };
  document.getElementById('xpBar').setAttribute('aria-describedby', 'xpTooltip');
  const window = { __fichaImportacaoEpoch: 0, __fichaImportacaoTransacaoAtiva: null };
  const context = vm.createContext({ document, window, Intl, console, Number, Math, String });
  const table = sliceBetween(source, 'const tabelaXP = [', '\n];') + '\n];';
  const palette = sliceBetween(source, 'const PALETA_XP_NIVEIS = [', '\n];') + '\n];';
  const renderer = sliceBetween(source, 'function atualizarXPENivel(', '\ndocument.getElementById("xp").addEventListener');
  const setter = sliceBetween(source, 'function setXP(', '\ndocument.addEventListener("change"');
  vm.runInContext(`${palette}\n${table}\nglobalThis.tabelaXP = tabelaXP;\n${setter}\n${renderer}`, context);
  vm.runInContext(`
    atualizarDadosVidaTotal = () => {};
    processarLevelUp = () => Promise.resolve();
    const xp = document.getElementById('xp');
    const level = document.getElementById('classeNivelID');
    level.value = '1';
  `, context);
  return { context, get: (id) => elements.get(id), setXP: (value) => {
    context.valueForXP = value;
    return vm.runInContext('setXP(valueForXP)', context);
  }, update: (value, options = { apenasVisual: true }) => {
    context.valueForXP = String(value);
    context.optionsForXP = options;
    return vm.runInContext("document.getElementById('xp').value = valueForXP; atualizarXPENivel(optionsForXP)", context);
  } };
}

function getImportPreparationHelpers() {
  const firstTest = preparationTests.indexOf('\ntest(');
  assert.ok(firstTest > 0, 'helpers de preparação precisam estar antes dos testes');
  const helpers = preparationTests.slice(0, firstTest);
  const sandbox = { require, __dirname: path.join(root, 'tests'), console, setTimeout, clearTimeout,
    Date, Promise, structuredClone };
  vm.runInNewContext(`${helpers}\nglobalThis.__xpPreparation = { createHarness, prepare };`, sandbox,
    { filename: 'tests/importacao-preparacao.test.cjs#helpers' });
  return sandbox.__xpPreparation;
}

test('tabela oficial cobre os 20 limites e cada fronteira usa a faixa de XP correta', () => {
  const harness = createProgressHarness();
  assert.deepEqual(Array.from(harness.context.tabelaXP, (entry) => entry.xp), EXPECTED_THRESHOLDS);
  for (let index = 0; index < EXPECTED_THRESHOLDS.length; index += 1) {
    const start = EXPECTED_THRESHOLDS[index];
    const next = EXPECTED_THRESHOLDS[index + 1];
    for (const xp of [Math.max(0, start - 1), start, start + 1]) {
      harness.update(xp);
      const expectedLevel = EXPECTED_THRESHOLDS.filter((threshold) => threshold <= xp).length;
      const currentStart = EXPECTED_THRESHOLDS[Math.max(0, expectedLevel - 1)];
      const currentNext = EXPECTED_THRESHOLDS[expectedLevel] ?? currentStart;
      const expectedPercent = expectedLevel === 20 ? 100 :
        ((xp - currentStart) / (currentNext - currentStart)) * 100;
      const active = expectedLevel === 1 ? harness.get('xpBarCurrent') : harness.get('xpBarNext');
      assert.equal(Number.parseFloat(active.style.width), Math.max(0, Math.min(100, expectedPercent)),
        `XP ${xp}, nível ${expectedLevel}`);
    }
  }
});

test('marcador e largura acompanham 5%, 25%, 50%, 75% e 95% em todas as faixas', () => {
  const harness = createProgressHarness();
  for (let levelIndex = 0; levelIndex < 19; levelIndex += 1) {
    const start = EXPECTED_THRESHOLDS[levelIndex];
    const span = EXPECTED_THRESHOLDS[levelIndex + 1] - start;
    for (const target of [5, 25, 50, 75, 95]) {
      const xp = Math.round(start + span * (target / 100));
      const actual = ((xp - start) / span) * 100;
      harness.update(xp);
      const active = levelIndex === 0 ? harness.get('xpBarCurrent') : harness.get('xpBarNext');
      assert.equal(Number.parseFloat(active.style.width), actual, `nível ${levelIndex + 1}, XP ${xp}`);
      assert.equal(harness.get('xpProgressMarker').style.left, `${Math.round(actual * 10) / 10}%`);
    }
  }
  harness.update(355000);
  assert.equal(harness.get('xpProgressMarker').style.left, '100%');
  harness.update(355999);
  assert.equal(harness.get('xp').value, '355999', 'XP acima do limiar de nível 20 continua acumulado');
  assert.equal(harness.get('xpProgressMarker').style.left, '100%');
});

test('20 faixas expõem a paleta selecionada e pares consecutivos contrastam também em simulações', () => {
  const harness = createProgressHarness();
  const actual = [];
  for (let level = 1; level <= 20; level += 1) {
    harness.update(EXPECTED_THRESHOLDS[level - 1]);
    const fill = level === 1 ? harness.get('xpBarCurrent') : harness.get('xpBarNext');
    actual.push(fill.style.background);
    assert.equal(harness.get('xpBarCurrent').style.background,
      level === 1 ? EXPECTED_PALETTE[0] : EXPECTED_PALETTE[level - 2]);
    assert.equal(harness.get('xpBarNext').style.background, EXPECTED_PALETTE[level - 1]);
  }
  assert.deepEqual(actual, EXPECTED_PALETTE);
  assert.equal(harness.get('xpBarCurrent').style.opacity, '1');
  assert.equal(harness.get('xpBarNext').style.opacity, '1');
  for (const [index, palette] of [EXPECTED_PALETTE, ...ALTERNATIVE_PALETTES].entries()) {
    const minimum = Math.min(...palette.slice(1).map((color, pairIndex) =>
      contrastRatio(color, palette[pairIndex])));
    assert.ok(minimum >= 4.5, `paleta ${index + 1}: contraste mínimo normal ${minimum}`);
    for (const [kind, matrix] of Object.entries(VISION_MATRICES)) {
      const simulatedMinimum = Math.min(...palette.slice(1).map((color, pairIndex) =>
        contrastRatio(simulateVision(color, matrix), simulateVision(palette[pairIndex], matrix))));
      assert.ok(simulatedMinimum >= 4, `paleta ${index + 1}, ${kind}: ${simulatedMinimum}`);
    }
    const grayscaleMinimum = Math.min(...palette.slice(1).map((color, pairIndex) =>
      contrastRatio(simulateGrayscale(color), simulateGrayscale(palette[pairIndex]))));
    assert.ok(grayscaleMinimum >= 4.5,
      `paleta ${index + 1}: contraste mínimo em escala de cinza ${grayscaleMinimum}`);
  }
  assert.ok(contrastRatio(EXPECTED_PALETTE[0], '#E6E8EB') >= 4.5,
    'a cor inicial se distingue do trilho neutro do nível 1');
});

test('a barra informa progresso acessível e mantém texto explícito no nível 20', () => {
  const harness = createProgressHarness();
  harness.update(1200);
  const bar = harness.get('xpBar');
  assert.equal(bar.attributes.role, 'progressbar');
  assert.equal(bar.attributes['aria-valuenow'], '16.7');
  assert.match(bar.attributes['aria-valuetext'], /1[.\u00a0]?200.*XP.*nível 3/i);
  assert.equal(harness.get('xpLevelLabel').textContent, 'NÍVEL 3');
  assert.equal(harness.get('xpCurrentValue').textContent, '1.200');
  assert.equal(harness.get('xpThresholdValue').textContent, '/ 2.700 XP');
  assert.equal(harness.get('xpTooltip').textContent, 'Faltam 1.500 XP para o nível 4');
  harness.update(355000);
  assert.match(bar.attributes['aria-valuetext'], /355[.\u00a0]?000.*XP.*nível 20/i);
  assert.match(harness.get('xpTexto').textContent, /355[.\u00a0]?000.*nível 20/i);
  assert.equal(harness.get('xpLevelLabel').textContent, 'NÍVEL 20');
  assert.equal(harness.get('xpThresholdValue').textContent, 'XP acumulados');
  assert.equal(harness.get('xpTooltip').textContent, 'Nível máximo alcançado');
});

test('tooltip e valores visuais acompanham faixa, limites e XP acima do limiar', () => {
  const harness = createProgressHarness();
  for (const [xp, level, threshold, tooltip] of [
    [0, 1, '/ 300 XP', 'Faltam 300 XP para o nível 2'],
    [523, 2, '/ 900 XP', 'Faltam 377 XP para o nível 3'],
    [900, 3, '/ 2.700 XP', 'Faltam 1.800 XP para o nível 4'],
    [999999, 20, 'XP acumulados', 'Nível máximo alcançado'],
  ]) {
    harness.update(xp);
    assert.equal(harness.get('xpLevelLabel').textContent, `NÍVEL ${level}`);
    assert.equal(harness.get('xpThresholdValue').textContent, threshold);
    assert.equal(harness.get('xpTooltip').textContent, tooltip);
    assert.equal(harness.get('xpBar').attributes['aria-describedby'], 'xpTooltip');
    assert.equal(harness.get('xpCurrentValue').textContent,
      new Intl.NumberFormat('pt-BR').format(xp));
  }
});

test('XP inválido não substitui o último valor válido na interface', () => {
  const harness = createProgressHarness();
  harness.setXP(1200);
  for (const invalid of [-1, '-1', '12abc', '1.5', 'NaN', '', ' ', null, true, Infinity, NaN]) {
    const before = harness.get('xp').value;
    const result = harness.setXP(invalid);
    assert.equal(result, false, `deve rejeitar ${String(invalid)}`);
    assert.equal(String(harness.get('xp').value), String(before));
    assert.equal(harness.get('xp').attributes['aria-invalid'], 'true');
  }
  assert.equal(harness.setXP('1201'), true, 'string inteira legada continua válida');
  assert.equal(String(harness.get('xp').value), '1201');
  harness.get('xp').value = '-5';
  harness.update(-5);
  assert.equal(String(harness.get('xp').value), '1201', 'edição inválida recupera o último XP válido');
  assert.equal(harness.get('xp').attributes['aria-invalid'], 'true');
  assert.equal(harness.get('xpTexto').textContent, '1.201 / 2.700 XP · Nível 3 · 16,7% até o nível 4');
});

test('XP inteiro serializado em notação exponencial pelo input continua consistente', () => {
  const harness = createProgressHarness();
  harness.get('xp').value = '1e+21';
  assert.equal(harness.update('1e+21'), true);
  assert.equal(harness.get('xp').dataset.xpValido, '1e+21');
  assert.equal(harness.get('xpBarNext').style.width, '100%');
  assert.match(harness.get('xpTexto').textContent, /acumulados.*nível 20/i);
});

test('preparação de importação rejeita XP negativo e malformado antes do aplicador', () => {
  const { createHarness, prepare } = getImportPreparationHelpers();
  const harness = createHarness();
  for (const xp of [-1, '-1', '12abc', 1.5, '1.5', '1e-1', 'NaN', '', ' ', null, true, Infinity, NaN, {}, []]) {
    assert.throws(() => prepare(harness, { xp }), /XP|xp|numérico/i, `XP ${JSON.stringify(xp)}`);
  }
  for (const xp of [0, 1200, 355000, 999999, '0', '1200', '1e3', '1e+21']) {
    assert.equal(prepare(harness, { xp }).xp, xp, `XP válido ${xp} permanece sem conversão`);
  }
});
