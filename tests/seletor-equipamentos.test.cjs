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
    personagemEhProficienteComArma: () => true,
    criarValorSlotEscudo: (index) => `__escudo__${index}`,
  };
  vm.createContext(context);
  vm.runInContext(extract('function ehEscudoEmpunhavel(', '\nfunction possuiTalentoAmbidestro'), context);
  vm.runInContext(
    extract('function atualizarSelectNomeArmaEquipada(', '\nfunction getNomeArmaSeguro'),
    context,
  );
  vm.runInContext(extract('function obterContextoMaoPrincipalSelecionada(', '\nfunction atualizarSelectNomeArmaEquipada'), context);
  vm.runInContext(extract('function podeEquiparNaSecundaria(', '\nfunction avaliarSelecaoSecundaria'), context);

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

test('Mão secundária exibe ícone da arma ou escudo quando a mão principal está livre', () => {
  const casos = [
    { valor: '1', estadoTipo: 'uma_mao', tipoIcone: 'arma', item: { nome: 'Maça', catalogoId: 'mace' } },
    { valor: '__escudo__0', estadoTipo: 'escudo', tipoIcone: 'escudo', item: { escudo_nome: 'Escudo', catalogoId: 'shield' } },
  ];

  casos.forEach(({ valor, estadoTipo, tipoIcone, item }) => {
    const chamadasIcone = [];
    const botaoPrincipal = { dataset: {}, classList: { toggle() {} } };
    const botaoSecundario = { dataset: {}, classList: { toggle() {} } };
    const selectSecundario = {
      value: valor,
      options: [{ value: '' }, { value: valor }],
      closest: () => null,
    };
    const ataqueSecundario = { disabled: false };
    const elementos = {
      arma1Nome: { value: '' },
      arma2Nome: selectSecundario,
      arma1Empunhadura: botaoPrincipal,
      arma2Empunhadura: botaoSecundario,
      arma2Ataque: ataqueSecundario,
    };
    const contexto = {
      document: {
        getElementById: (id) => elementos[id] || null,
        querySelectorAll: () => [],
      },
      window: {
        FichaDnDCombateIcons: {
          atualizarIconeMao: (...args) => chamadasIcone.push(args),
          obterIdCatalogo: (equipamento) => equipamento?.catalogoId || '',
        },
        FichaDnDCombateLayoutV2: { atualizar() {} },
      },
      estadoCombate: {
        maoPrincipal: { item: null, modo: 'vazio' },
        maoSecundaria: { item: null, ativa: true },
      },
      extrairIndiceSlotEscudo: (slot) => slot.startsWith('__escudo__') ? Number(slot.slice(10)) : null,
      obterEscudoEquipadoPorValor: (_slot, escudos) => escudos[0] || null,
      criarItemCombatePrincipal: () => null,
      obterTipoItemSecundarioArma: () => 'uma_mao',
      valorSecundarioEhValido: () => true,
      reposicionarMenuEmpunhadura() {},
    };
    vm.createContext(contexto);
    vm.runInContext(
      extract('function atualizarEstadoCombate(', '\nfunction atualizarUIEmpunhadura'),
      contexto,
    );
    vm.runInContext(
      extract('function atualizarUIEmpunhadura(', '\nfunction obterMenuEmpunhadura'),
      contexto,
    );

    contexto.atualizarUIEmpunhadura([{}, item], estadoTipo === 'escudo' ? [item] : []);

    assert.equal(contexto.estadoCombate.maoSecundaria.item.tipo, estadoTipo);
    assert.equal(contexto.estadoCombate.maoSecundaria.ativa, true);
    const chamadaSecundaria = chamadasIcone.find(([botao]) => botao === botaoSecundario);
    assert.ok(chamadaSecundaria);
    assert.equal(chamadaSecundaria[1], tipoIcone);
    assert.equal(botaoSecundario.title, 'Ações da mão secundária');
  });
});

test('coletor exclui o template oculto para manter índice legado do escudo equipado', () => {
  const cardModel = criarCardEscudo('', '');
  cardModel.id = 'escudoModelo';
  const cardReal = criarCardEscudo('Escudo de Aço', '+2');
  const select = createSelect();
  const context = {
    document: {
      querySelectorAll: (selector) =>
        selector.includes(':not(#escudoModelo)')
          ? [cardReal]
          : [cardModel, cardReal],
      getElementById: (id) => (id === 'arma2Nome' ? select : null),
      createElement: createOption,
    },
    coletarFlagsCompartilhadasItem() {},
    getTemProficienciaEscudo: () => true,
    criarValorSlotEscudo: (index) => `__escudo__${index}`,
    getNomeArmaSeguro: (arma) => arma?.nome || arma?.arma_nome || '',
    personagemEhProficienteComArma: () => true,
    extrairIndiceSlotEscudo: (value) => {
      const match = /^__escudo__(\d+)$/.exec(value || '');
      return match ? Number(match[1]) : null;
    },
  };
  vm.createContext(context);
  vm.runInContext(extract('function coletarEscudos() {', '// O card de "outros"'), context);
  vm.runInContext(extract('function ehEscudoEmpunhavel(', '\nfunction possuiTalentoAmbidestro'), context);
  vm.runInContext(extract('function obterEscudoEquipadoPorValor(', '\nfunction possuiTalentoAmbidestro'), context);
  vm.runInContext(extract('function atualizarSelectNomeArmaEquipada(', '\nfunction getNomeArmaSeguro'), context);
  vm.runInContext(extract('function obterContextoMaoPrincipalSelecionada(', '\nfunction atualizarSelectNomeArmaEquipada'), context);
  vm.runInContext(extract('function podeEquiparNaSecundaria(', '\nfunction avaliarSelecaoSecundaria'), context);
  vm.runInContext(extract('function normalizarNomeEquipadoSalvo(', '\nfunction resolverIndiceArmaSalva'), context);
  vm.runInContext(extract('function resolverIndiceArmaSalva(', '\nfunction atualizarProficienciaCardArmadura'), context);

  const escudos = context.coletarEscudos();
  assert.deepEqual(Array.from(escudos, (item) => item.escudo_nome), ['Escudo de Aço']);
  const valor = context.resolverIndiceArmaSalva(
    { arma2EquipadaIndice: '__escudo__0', arma2Nome: 'Escudo de Aço' },
    2,
    [],
    escudos,
  );
  assert.equal(valor, '__escudo__0');
  context.atualizarSelectNomeArmaEquipada(2, [], valor, escudos);
  assert.equal(select.value, '__escudo__0');
  assert.equal(context.obterEscudoEquipadoPorValor(select.value, escudos).escudo_ca, '+2');

  const vestimenta = { escudo_tipo: 'Vestuario', escudo_nome: 'Anel de Sinete' };
  const colecaoLegada = [...escudos, vestimenta];
  assert.equal(context.resolverIndiceArmaSalva(
    { arma2EquipadaIndice: '__escudo__1', arma2Nome: 'Escudo de Aço' },
    2, [], colecaoLegada,
  ), '__escudo__0', 'um índice legado que aponta para vestimenta recupera o escudo salvo pelo nome');
  assert.equal(context.resolverIndiceArmaSalva(
    { arma2EquipadaIndice: '__escudo__1', arma2Nome: 'Anel de Sinete' },
    2, [], colecaoLegada,
  ), null, 'nem o índice nem o nome podem equipar uma vestimenta como escudo');

  const armas = [
    { arma_nome: 'Espada Longa' },
    { arma_nome: 'Adaga' },
  ];
  const valorArmaLegada = context.resolverIndiceArmaSalva(
    { arma2EquipadaIndice: '1', arma2Nome: 'Adaga' },
    2,
    armas,
    escudos,
  );
  assert.equal(valorArmaLegada, 1, 'índice numérico legado de arma secundária permanece compatível');
  context.atualizarSelectNomeArmaEquipada(2, armas, valorArmaLegada, escudos);
  assert.equal(select.value, '1');

  const semEquipamento = context.resolverIndiceArmaSalva({}, 2, armas, escudos);
  assert.equal(semEquipamento, null);
  context.atualizarSelectNomeArmaEquipada(2, armas, semEquipamento, escudos);
  assert.equal(select.value, '', 'mão secundária vazia continua vazia sem valor salvo');
});

test('sincronização de slots reconcilia as marcas de escudo para arma, escudo e mão vazia', () => {
  const arma1 = { value: '0' };
  const arma2 = { value: '1' };
  const weaponChecks = [0, 1].map((index) => ({ dataset: { index: String(index) }, checked: false }));
  const shieldChecks = [0, 1].map((index) => ({ dataset: { index: String(index) }, checked: index === 0 }));
  const context = {
    document: {
      getElementById: (id) => ({ arma1Nome: arma1, arma2Nome: arma2 })[id] || null,
      querySelectorAll: (selector) =>
        selector.includes('#lista-armas-equipamento') ? weaponChecks : shieldChecks,
    },
    extrairIndiceSlotEscudo: (value) => {
      const match = /^__escudo__(\d+)$/.exec(value || '');
      return match ? Number(match[1]) : null;
    },
  };
  vm.createContext(context);
  vm.runInContext(
    extract('function sincronizarMarcacaoArmasPorSlots()', '\nfunction atualizarBloqueioMaosEquipamento'),
    context,
  );

  context.sincronizarMarcacaoArmasPorSlots();
  assert.deepEqual(shieldChecks.map((input) => input.checked), [false, false],
    'arma secundária limpa a marca obsoleta de escudo');
  assert.deepEqual(weaponChecks.map((input) => input.checked), [true, true]);

  arma2.value = '__escudo__1';
  context.sincronizarMarcacaoArmasPorSlots();
  assert.deepEqual(shieldChecks.map((input) => input.checked), [false, true]);

  arma2.value = '';
  context.sincronizarMarcacaoArmasPorSlots();
  assert.deepEqual(shieldChecks.map((input) => input.checked), [false, false],
    'mão secundária vazia limpa as marcas de escudo');
});

test('coletor exclui o template oculto de armadura e mantém o índice legado equipado', () => {
  const cardModelo = criarCardArmadura('', '');
  cardModelo.id = 'armaduraModelo';
  const cardReal = criarCardArmadura('Armadura de Couro', '11');
  const context = {
    document: {
      querySelectorAll: (selector) =>
        selector.includes(':not(#armaduraModelo)')
          ? [cardReal]
          : [cardModelo, cardReal],
    },
    coletarFlagsCompartilhadasItem() {},
    getTemProficienciaArmadura: () => true,
  };
  vm.createContext(context);
  vm.runInContext(
    extract('function coletarArmaduras() {', '\nfunction atualizarProficienciaCardEscudo'),
    context,
  );

  const armaduras = context.coletarArmaduras();
  assert.deepEqual(Array.from(armaduras, (item) => item.armadura_nome), ['Armadura de Couro']);
  assert.equal(armaduras[0].armadura_ca, '11');
  assert.equal(armaduras[0].armadura_bonus, 'DES');
  assert.equal(armaduras[0].proficiente, true);
  assert.equal(armaduras[0].armadura_nome, 'Armadura de Couro',
    'o índice legado 0 deve resolver para a armadura real, não para o template');
});

function criarCardEscudo(nome, ca) {
  const campos = [
    { dataset: { campo: 'escudo_nome' }, value: nome },
    { dataset: { campo: 'escudo_ca' }, value: ca },
    { dataset: { campo: 'escudo_tipo' }, value: 'Escudo' },
  ];
  return {
    id: '',
    dataset: {},
    _dadosOriginais: {},
    querySelector: () => ({ classList: { contains: () => false } }),
    querySelectorAll: () => campos,
  };
}

function criarCardArmadura(nome, ca) {
  const campos = [
    { dataset: { campo: 'armadura_nome' }, value: nome },
    { dataset: { campo: 'armadura_ca' }, value: ca },
    { dataset: { campo: 'armadura_bonus' }, value: 'DES' },
    { dataset: { campo: 'armadura_tipo' }, value: 'Leve' },
  ];
  return {
    id: '',
    dataset: {},
    _dadosOriginais: {},
    querySelector: (selector) => selector === '.item-proficiencia'
      ? { classList: { contains: () => false } }
      : null,
    querySelectorAll: () => campos,
  };
}

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
    personagemEhProficienteComArma: () => true,
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
  vm.runInContext(extract('function podeEquiparNaSecundaria(', '\nfunction avaliarSelecaoSecundaria'), context);
  vm.runInContext(
    extract(
      'function atualizarSelectNomeArmaEquipada(',
      '\nfunction getNomeArmaSeguro',
    ),
    context,
  );
  vm.runInContext(extract('function obterContextoMaoPrincipalSelecionada(', '\nfunction atualizarSelectNomeArmaEquipada'), context);
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

test('Mão secundária: valida ocupação compartilhada sem confundir leveza com equipabilidade', () => {
  const context = {
    extrairIndiceSlotEscudo: (value) => {
      const match = /^__escudo__(\d+)$/.exec(value || '');
      return match ? Number(match[1]) : null;
    },
    possuiTalentoAmbidestro: () => false,
  };
  vm.createContext(context);
  const rules = fs.readFileSync(path.join(__dirname, '..', 'js/domain/regras-combate.js'), 'utf8');
  vm.runInContext(`${rules}\nglobalThis.__rules = RegrasCombate;`, context);
  context.RegrasCombate = context.__rules;
  vm.runInContext(extract('function obterTipoItemSecundarioArma(', '\nfunction ehEscudoEmpunhavel'), context);
  vm.runInContext(extract('function obterTipoItemSecundarioPorValor(', '\nfunction valorSecundarioEhValido'), context);
  vm.runInContext(extract('function ehEscudoEmpunhavel(', '\nfunction possuiTalentoAmbidestro'), context);
  vm.runInContext(extract('function obterEscudoEquipadoPorValor(', '\nfunction possuiTalentoAmbidestro'), context);
  vm.runInContext(extract('function podeEquiparNaSecundaria(', '\nfunction avaliarSelecaoSecundaria'), context);
  vm.runInContext(extract('function avaliarSelecaoSecundaria(', '\nfunction atualizarAvisoIncompatibilidadeSecundaria'), context);
  vm.runInContext(extract('function valorSecundarioEhValido(', '\nfunction limparSelecaoSecundariaEquipamento'), context);

  const escudos = [
    { escudo_tipo: 'Vestuario', escudo_nome: 'Roupas Finas', escudo_ca: '+1' },
    { escudo_tipo: 'Escudo', escudo_nome: 'Escudo +2', escudo_ca: '+2' },
  ];
  const armas = [
    { modo: 'corpo-a-corpo', propriedades: { leve: true } },
    { modo: 'corpo-a-corpo', propriedades: { duas_maos: true } },
    { modo: 'corpo-a-corpo', propriedades: { finesse: true } },
  ];
  assert.equal(context.obterTipoItemSecundarioPorValor('__escudo__0', armas, escudos), null);
  assert.equal(context.obterTipoItemSecundarioPorValor('__escudo__1', armas, escudos), 'escudo');
  assert.equal(context.obterEscudoEquipadoPorValor('__escudo__0', escudos), null);
  assert.equal(context.obterEscudoEquipadoPorValor('__escudo__1', escudos), escudos[1]);
  assert.equal(context.obterEscudoEquipadoPorValor('__escudo__7', escudos), null);
  assert.equal(context.obterTipoItemSecundarioPorValor('0', armas, escudos), 'leve');
  assert.equal(context.obterTipoItemSecundarioPorValor('1', armas, escudos), 'duas_maos');
  const armaUmaMao = { tipo: 'uma_mao', propriedades: {} };
  assert.equal(context.valorSecundarioEhValido('__escudo__0', armaUmaMao, 'uma_mao', armas, escudos), false);
  assert.equal(context.valorSecundarioEhValido('__escudo__1', armaUmaMao, 'uma_mao', armas, escudos), true);
  assert.equal(context.valorSecundarioEhValido('0', armaUmaMao, 'uma_mao', armas, escudos), true);
  assert.equal(context.valorSecundarioEhValido('1', armaUmaMao, 'uma_mao', armas, escudos), false);
  assert.equal(context.valorSecundarioEhValido('2', armaUmaMao, 'uma_mao', armas, escudos), true, 'arma de uma mão não leve é equipável mesmo sem talento');
  assert.equal(context.valorSecundarioEhValido('__escudo__1', armaUmaMao, 'duas_maos', armas, escudos), false);
  assert.equal(context.valorSecundarioEhValido('', { tipo: 'duas_maos' }, 'duas_maos', armas, escudos), true, 'mão vazia continua válida');
});

test('Mão secundária: Dual Wielder não permite arma que exige duas mãos', () => {
  const context = { possuiTalentoAmbidestro: () => true, RegrasCombate: { avaliarEquipamentoMaoSecundaria: (...args) => regras.avaliarEquipamentoMaoSecundaria(...args) } };
  const regras = (() => { const c = {}; vm.runInNewContext(`${fs.readFileSync(path.join(__dirname, '..', 'js/domain/regras-combate.js'), 'utf8')}\nglobalThis.__rules=RegrasCombate`, c); return c.__rules; })();
  vm.createContext(context);
  vm.runInContext(extract('function podeEquiparNaSecundaria(', '\nfunction avaliarSelecaoSecundaria'), context);
  assert.equal(context.podeEquiparNaSecundaria({ tipo: 'uma_mao', propriedades: {} }, 'uma_mao', { tipo: 'arma', item: { propriedades: {} } }).valido, true);
  assert.equal(context.podeEquiparNaSecundaria({ tipo: 'uma_mao', propriedades: {} }, 'uma_mao', { tipo: 'arma', item: { propriedades: { duas_maos: true } } }).valido, false);
  assert.equal(context.podeEquiparNaSecundaria({ tipo: 'uma_mao', propriedades: {} }, 'duas_maos', { tipo: 'arma', item: { propriedades: {} } }).valido, false);
});

test('offHand filtra apenas itens impossíveis de empunhar e preserva seleção antiga incompatível', () => {
  const principal = createSelect();
  const secundaria = createSelect();
  principal.value = '0';
  const armas = [
    { nome: 'Adaga', modo: 'corpo-a-corpo', propriedades: { leve: true } },
    { nome: 'Besta de mão', modo: 'distancia', propriedades: { leve: true } },
    { nome: 'Rapieira', modo: 'corpo-a-corpo', propriedades: { finesse: true } },
    { nome: 'Besta pesada', modo: 'distancia', propriedades: { duas_maos: true } },
  ];
  const context = {
    document: {
      getElementById: (id) => ({ arma1Nome: principal, arma2Nome: secundaria })[id] || null,
      createElement: createOption,
    },
    personagemEhProficienteComArma: () => true,
    estadoCombate: { maoPrincipal: { item: { chaveItem: '0' }, modo: 'uma_mao' } },
    RegrasCombate: (() => { const c = {}; vm.runInNewContext(`${fs.readFileSync(path.join(__dirname, '..', 'js/domain/regras-combate.js'), 'utf8')}\nglobalThis.__rules=RegrasCombate`, c); return c.__rules; })(),
    possuiTalentoAmbidestro: () => false,
    criarItemCombatePrincipal: (arma, chaveItem) => ({ ...arma, chaveItem }),
  };
  vm.createContext(context);
  vm.runInContext(extract('function obterContextoMaoPrincipalSelecionada(', '\nfunction atualizarSelectNomeArmaEquipada'), context);
  vm.runInContext(extract('function atualizarSelectNomeArmaEquipada(', '\nfunction getNomeArmaSeguro'), context);
  vm.runInContext(extract('function podeEquiparNaSecundaria(', '\nfunction avaliarSelecaoSecundaria'), context);

  context.atualizarSelectNomeArmaEquipada(2, armas, '', []);
  assert.deepEqual(secundaria.options.map((option) => option.value), ['', '1', '2']);
  assert.equal(secundaria.options[0].textContent, 'Mão Secundária / Escudo');

  context.atualizarSelectNomeArmaEquipada(2, armas, '3', []);
  const incompatibilidade = secundaria.options.find((option) => option.value === '3');
  assert.ok(incompatibilidade, 'seleção antiga segue visível para permitir correção explícita');
  assert.equal(incompatibilidade.dataset.incompativel, 'true');
  assert.match(incompatibilidade.dataset.motivo, /duas mãos/i);
  assert.equal(secundaria.value, '3');
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
