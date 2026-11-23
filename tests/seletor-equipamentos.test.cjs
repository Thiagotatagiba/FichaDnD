const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'js/modules/equipamentos.js'),
  'utf8',
).replace(/\r\n/g, '\n');

function extract(signature, nextSignature) {
  const start = source.indexOf(signature);
  const end = source.indexOf(nextSignature, start);
  assert.ok(start >= 0 && end > start, `função esperada: ${signature}`);
  return source.slice(start, end);
}

function createSelect() {
  const options = [];
  return {
    options,
    value: '',
    set innerHTML(_value) { options.length = 0; this.value = ''; },
    appendChild(option) { options.push(option); return option; },
  };
}

function createOption() {
  return { value: '', textContent: '', dataset: {} };
}

test('Mão secundária: lista somente registros categorizados como escudo e mantém índice original', () => {
  const select = createSelect();
  const context = {
    document: { getElementById: () => select, createElement: createOption },
    criarValorSlotEscudo: (index) => `__escudo__${index}`,
  };
  vm.createContext(context);
  vm.runInContext(extract('function ehEscudoEmpunhavel(', '\nfunction possuiTalentoAmbidestro'), context);
  vm.runInContext(
    extract('function atualizarSelectNomeArmaEquipada(', '\nfunction getNomeArmaSeguro'),
    context,
  );

  const equipamentos = [
    { escudo_tipo: 'Vestuario', escudo_nome: 'Roupas Finas', escudo_ca: '+1' },
    { escudo_tipo: 'Vestuario', escudo_nome: 'Anel de Sinete', escudo_ca: '+0' },
    { escudo_tipo: 'Escudo', escudo_nome: 'Escudo +2', escudo_ca: '+2' },
  ];
  context.atualizarSelectNomeArmaEquipada(2, [], '', equipamentos);

  assert.deepEqual(
    select.options.filter((option) => option.value.startsWith('__escudo__')).map((option) => option.value),
    ['__escudo__2'],
  );
  assert.equal(select.options.find((option) => option.value === '__escudo__2').textContent, '🛡️ Escudo +2 +2');
});

test('atualizar inventário preenche os seletores de combate em ficha sem armas marcadas', () => {
  const principal = createSelect();
  const secundaria = createSelect();
  const arma = { nome: 'Maça', propriedades: {} };
  const context = {
    document: {
      getElementById: (id) => ({ arma1Nome: principal, arma2Nome: secundaria })[id] || null,
      querySelector: () => null,
      createElement: createOption,
    },
    coletarArmas: () => [arma],
    coletarEscudos: () => [],
    coletarArmaduras: () => [],
    coletarOutros: () => [],
    renderizarArmasEquipamento() {},
    renderizarArmadurasEquipamento() {},
    renderizarEscudosEquipamento() {},
    renderizarOutrosEquipamento() {},
    atualizarTodasMunicoesArmas() {},
    atualizarSelectNomeArmaduraEquipada() {},
    atualizarTitulosInventario() {},
    armaduraEquipadaIndice: null,
    criarValorSlotEscudo: (index) => `__escudo__${index}`,
  };
  vm.createContext(context);
  vm.runInContext(
    extract(
      'function ehEscudoEmpunhavel(',
      '\nfunction podeEquiparNaSecundaria',
    ),
    context,
  );
  vm.runInContext(
    extract(
      'function atualizarSelectNomeArmaEquipada(',
      '\nfunction getNomeArmaSeguro',
    ),
    context,
  );
  vm.runInContext(
    extract(
      'function atualizarListaArmasEquipamento()',
      '\nfunction obterTextoDanoArma',
    ),
    context,
  );

  context.atualizarListaArmasEquipamento();

  assert.deepEqual(principal.options.map((option) => option.textContent), [
    'Mão Principal',
    '⚔️ Maça',
  ]);
  assert.equal(principal.value, '');
  assert.equal(
    secundaria.options.some((option) => option.textContent.includes('Maça')),
    true,
  );
  assert.equal(secundaria.value, '');
});

test('Mão secundária: descarta seleção antiga de vestimenta e preserva regras atuais de ocupação', () => {
  const context = {
    extrairIndiceSlotEscudo: (value) => {
      const match = /^__escudo__(\d+)$/.exec(value || '');
      return match ? Number(match[1]) : null;
    },
    possuiTalentoAmbidestro: () => false,
  };
  vm.createContext(context);
  vm.runInContext(extract('function obterTipoItemSecundarioArma(', '\nfunction ehEscudoEmpunhavel'), context);
  vm.runInContext(extract('function ehEscudoEmpunhavel(', '\nfunction possuiTalentoAmbidestro'), context);
  vm.runInContext(extract('function obterEscudoEquipadoPorValor(', '\nfunction possuiTalentoAmbidestro'), context);
  vm.runInContext(extract('function podeEquiparNaSecundaria(', '\nfunction limparSelecaoSecundariaEquipamento'), context);

  const escudos = [
    { escudo_tipo: 'Vestuario', escudo_nome: 'Roupas Finas', escudo_ca: '+1' },
    { escudo_tipo: 'Escudo', escudo_nome: 'Escudo +2', escudo_ca: '+2' },
  ];
  const armas = [
    { propriedades: { leve: true } },
    { propriedades: { duas_maos: true } },
  ];
  assert.equal(context.obterTipoItemSecundarioPorValor('__escudo__0', armas, escudos), null);
  assert.equal(context.obterTipoItemSecundarioPorValor('__escudo__1', armas, escudos), 'escudo');
  assert.equal(context.obterEscudoEquipadoPorValor('__escudo__0', escudos), null);
  assert.equal(context.obterEscudoEquipadoPorValor('__escudo__1', escudos), escudos[1]);
  assert.equal(context.obterEscudoEquipadoPorValor('__escudo__7', escudos), null);
  assert.equal(context.obterTipoItemSecundarioPorValor('0', armas, escudos), 'leve');
  assert.equal(context.obterTipoItemSecundarioPorValor('1', armas, escudos), 'duas_maos');
  const armaUmaMao = { tipo: 'uma_mao' };
  assert.equal(context.valorSecundarioEhValido('__escudo__0', armaUmaMao, 'uma_mao', armas, escudos), false);
  assert.equal(context.valorSecundarioEhValido('__escudo__1', armaUmaMao, 'uma_mao', armas, escudos), true);
  assert.equal(context.valorSecundarioEhValido('0', { tipo: 'leve' }, 'uma_mao', armas, escudos), true);
  assert.equal(context.valorSecundarioEhValido('1', { tipo: 'leve' }, 'uma_mao', armas, escudos), false);
  assert.equal(context.valorSecundarioEhValido('__escudo__1', { tipo: 'duas_maos' }, 'duas_maos', armas, escudos), false);
});

test('Mão secundária: Ambidestro permite arma corpo a corpo de uma mão sem remover restrições de empunhadura', () => {
  const context = { possuiTalentoAmbidestro: () => true };
  vm.createContext(context);
  vm.runInContext(extract('function podeEquiparNaSecundaria(', '\nfunction limparSelecaoSecundariaEquipamento'), context);

  assert.deepEqual(
    Array.from(context.podeEquiparNaSecundaria({ tipo: 'uma_mao' }, 'uma_mao')),
    ['leve', 'uma_mao', 'versatil', 'escudo'],
  );
  assert.deepEqual(
    Array.from(context.podeEquiparNaSecundaria({ tipo: 'duas_maos' }, 'duas_maos')),
    [],
  );
});

test('Ambidestro é reconhecido somente como talento nomeado explicitamente', () => {
  const fields = { talentoOutro: { value: '' }, talentoClasse: { value: '' } };
  const context = {
    document: { getElementById: (id) => fields[id] || null },
    talentosEstruturados: { classe: [], outros: [] },
  };
  vm.createContext(context);
  vm.runInContext(extract('function possuiTalentoAmbidestro(', '\nfunction podeEquiparNaSecundaria'), context);
  assert.equal(context.possuiTalentoAmbidestro(), false);
  fields.talentoOutro.value = 'Ambidestro';
  assert.equal(context.possuiTalentoAmbidestro(), true);
  fields.talentoOutro.value = 'Usuário ambidestro em treinamento';
  assert.equal(context.possuiTalentoAmbidestro(), false);
  context.talentosEstruturados.outros.push({ nome: 'Dual Wielder' });
  assert.equal(context.possuiTalentoAmbidestro(), true);
});
