const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/modules/magias.js'), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

// Exercita o ciclo real de preenchimento/leitura; apenas os elementos DOM são simulados.
function editor(spell) {
  const fields = new Map();
  const context = vm.createContext({
    gerarId: () => 'teste',
    document: {
      getElementById(id) {
        if (!fields.has(id)) fields.set(id, {
          value: '', checked: false, hidden: false, style: {}, classList: { toggle() {} }, focus() {},
        });
        return fields.get(id);
      },
    },
    estadoCombateIniciativa: { efeitosAtivos: [], concentracaoAtiva: null },
    spell: plain(spell),
  });
  vm.runInContext(source, context);
  vm.runInContext(`
    estadoModalMagia.nivel = 1;
    estadoModalMagia.indice = 0;
    document.getElementById('magia1Texto').value = JSON.stringify([spell]);
    preencherFormularioMagia(obterMagiaDoEstadoModal());
  `, context);
  return {
    context,
    field: id => fields.get(id),
    original: plain(vm.runInContext('obterMagiaDoEstadoModal()', context)),
    save: () => plain(vm.runInContext('lerFormularioMagia()', context)),
  };
}

function complexSpell() {
  return {
    nome: 'Magia com efeitos múltiplos', propriedades: { dano: true, cura: true },
    efeitos: [
      { tipo: 'dano', formula: '1d10', dano_tipo: 'Perfurante', regra: 'Ao acertar.', gatilho: 'acerto' },
      { tipo: 'dano', formula: '2d6', dano_tipo: 'Frio', regra: 'Explosão.', teste: { atributo: 'DES' } },
      { tipo: 'cura', formula: '1d8', regra: '', alvo: 'aliado' },
      { tipo: 'cura', regra: 'Cura no próximo turno.' },
      { tipo: 'condicao', regra: 'Alvo impedido.', duracao: 1 },
    ],
  };
}

test('alterar apenas o nome preserva efeitos, regras, ordem e metadados', () => {
  const e = editor(complexSpell());
  e.field('magiaModalNome').value = 'Novo nome';
  const saved = e.save();
  assert.equal(saved.nome, 'Novo nome');
  assert.deepEqual(saved.efeitos, e.original.efeitos);
  assert.equal(complexSpell().efeitos[0].gatilho, saved.efeitos[0].gatilho);
  assert.deepEqual(saved.efeitos[1].teste, { atributo: 'DES' });
});

test('editar o primeiro dano preserva sua regra e todos os demais efeitos', () => {
  const e = editor(complexSpell());
  e.field('magiaModalDanoFormula').value = '2d10';
  e.field('magiaModalDanoTipo').value = 'Fogo';
  const expected = plain(e.original.efeitos);
  expected[0].formula = '2d10';
  expected[0].dano_tipo = 'Fogo';
  assert.deepEqual(e.save().efeitos, expected);
});

test('editar cura preserva sua origem, metadados e efeitos adicionais', () => {
  const e = editor(complexSpell());
  e.field('magiaModalCuraRegra').value = '2d8';
  const expected = plain(e.original.efeitos);
  expected[2].formula = '2d8';
  assert.deepEqual(e.save().efeitos, expected);
});

test('desmarcar Dano remove somente os efeitos de dano', () => {
  const e = editor(complexSpell());
  e.field('magiaModalPropDano').checked = false;
  assert.deepEqual(e.save().efeitos, e.original.efeitos.filter(x => x.tipo !== 'dano'));
});

test('habilitar dano em magia sem efeitos cria o primeiro efeito', () => {
  const e = editor({ nome: 'Nova', efeitos: [] });
  e.field('magiaModalPropDano').checked = true;
  e.field('magiaModalResolucao').value = 'Automático';
  e.field('magiaModalDanoFormula').value = '1d6';
  e.field('magiaModalDanoTipo').value = 'Fogo';
  assert.deepEqual(e.save().efeitos, [{ tipo: 'dano', formula: '1d6', dano_tipo: 'Fogo', regra: '' }]);
});

test('normalizar efeito mágico preserva alias camelCase de tipo de dano', () => {
  const context = vm.createContext({ gerarId: () => 'teste' });
  vm.runInContext(source, context);
  const normalized = plain(vm.runInContext(
    `normalizarMagiaRegistro({ nome: 'Raio de Fogo', efeitos: [{ tipo: 'dano', formula: '1d10', danoTipo: 'Fogo', regra: '' }] }, 1)`,
    context,
  ));
  assert.equal(normalized.efeitos[0].dano_tipo, 'Fogo');
});

test('todas as magias de nível 1 preservam seus efeitos ao salvar sem alterações', () => {
  const spells = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/magias/magias-nivel-1.json'), 'utf8'));
  for (const spell of spells) {
    const e = editor(spell);
    assert.deepEqual(e.save().efeitos, e.original.efeitos, spell.nome);
  }
});

test('dano posterior registra conjuração e permite dano sem novo gasto de espaço', () => {
  const spell = complexSpell();
  spell.id = 'hex-teste';
  spell.momento_dano = 'posterior';
  const e = editor(spell);
  vm.runInContext(`
    var gastos = 0, registros = 0, modais = 0;
    var ultimoSlot = null;
    consumirEspacoMagia = () => { gastos++; return true; };
    obterSlotSelecionadoModalMagia = () => 2;
    registrarHistoricoMagia = () => registros++;
    abrirHistoricoCombateMagia = () => {};
    atualizarSubAbaMagiasCombate = atualizarMagias = () => {};
    fecharModalUsarMagia = fecharModalMagia = () => {};
    abrirModalDanoMagia = (magia, opcoes) => { modais++; ultimoSlot = opcoes.nivelSlot; };
    estadoModalUsoMagia.magia = obterMagiaDoEstadoModal();
    estadoModalUsoMagia.nivelMinimo = 1;
    estadoModalUsoMagia.origemCombate = true;
    confirmarUsoMagia();
  `, e.context);
  assert.equal(vm.runInContext('gastos', e.context), 1);
  assert.equal(vm.runInContext('registros', e.context), 1);
  assert.equal(vm.runInContext('modais', e.context), 0);
  assert.equal(vm.runInContext('listarEfeitosMagicosPendentes().length', e.context), 1);
  // A mesma chamada usada pelo botão de aplicar recebe o espaço original.
  vm.runInContext(`
    const pendente = listarEfeitosMagicosPendentes()[0];
    abrirModalDanoMagia(pendente.magia, { mostrarCD: false, nivelSlot: pendente.nivelSlot });
  `, e.context);
  assert.equal(vm.runInContext('gastos', e.context), 1);
  assert.equal(vm.runInContext('ultimoSlot', e.context), 2);
});

function prepararConfirmacaoDeMagia({ tempo = '1 ação', combate = true, saldoDisponivel = true, gatilho = null } = {}) {
  const spell = { id: 'teste-custo', nome: 'Magia de teste', nivel: 1, tempo_conjuracao: tempo };
  const e = editor(spell);
  vm.runInContext(`
    estadoCombateIniciativa.ativo = ${combate};
    estadoCombateIniciativa.recursosTurno = { acaoUsada: false, acaoBonusUsada: false, reacaoUsada: false };
    estadoModalUsoMagia.magia = obterMagiaDoEstadoModal();
    estadoModalUsoMagia.nivelMinimo = 1;
    estadoModalUsoMagia.origemCombate = true;
    document.getElementById('magiaSlotGatilhoReacao').value = ${JSON.stringify(gatilho || '')};
    var slotsConsumidos = 0, acoesConsumidas = [], registrosMagia = 0;
    RegrasCombate = { consumirAcaoTurno: (recursos, tipo) => ${saldoDisponivel} && !recursos[({ 'Ação': 'acaoUsada', 'Ação bônus': 'acaoBonusUsada', 'Reação': 'reacaoUsada' })[tipo]] };
    obterSlotSelecionadoModalMagia = () => 1;
    consumirEspacoMagia = () => { slotsConsumidos++; return true; };
    consumirAcaoTurnoCombate = tipo => { acoesConsumidas.push(tipo); return true; };
    registrarHistoricoMagia = (...args) => { registrosMagia++; ultimoRegistroMagia = args; };
    iniciarConcentracaoMagia = registrarEfeitoMagicoPendente = atualizarMagias = atualizarSubAbaMagiasCombate = fecharModalUsarMagia = fecharModalMagia = abrirHistoricoCombateMagia = () => {};
    magiaPossuiDano = () => false;
    confirmarUsoMagia();
  `, e.context);
  return e.context;
}

test('magia de ação bônus em combate consome somente o saldo bônus e o espaço', () => {
  const c = prepararConfirmacaoDeMagia({ tempo: '1 ação bônus' });
  assert.equal(vm.runInContext('slotsConsumidos', c), 1);
  assert.deepEqual(plain(vm.runInContext('acoesConsumidas', c)), ['Ação bônus']);
  assert.equal(vm.runInContext('registrosMagia', c), 1);
});

test('saldo de ação esgotado bloqueia magia e preserva o espaço', () => {
  const c = prepararConfirmacaoDeMagia({ saldoDisponivel: false });
  assert.equal(vm.runInContext('slotsConsumidos', c), 0);
  assert.deepEqual(plain(vm.runInContext('acoesConsumidas', c)), []);
  assert.equal(vm.runInContext('registrosMagia', c), 0);
});

test('magia fora de combate não consome contador de turno', () => {
  const c = prepararConfirmacaoDeMagia({ combate: false });
  assert.equal(vm.runInContext('slotsConsumidos', c), 1);
  assert.deepEqual(plain(vm.runInContext('acoesConsumidas', c)), []);
  assert.equal(vm.runInContext('registrosMagia', c), 1);
});

test('magia de reação requer e registra o gatilho antes de consumir espaço ou reação', () => {
  const semGatilho = prepararConfirmacaoDeMagia({ tempo: '1 reação' });
  assert.equal(vm.runInContext('slotsConsumidos', semGatilho), 0);
  assert.deepEqual(plain(vm.runInContext('acoesConsumidas', semGatilho)), []);
  assert.match(semGatilho.document.getElementById('combateRecursosTurnoStatus').textContent, /gatilho/i);

  const comGatilho = prepararConfirmacaoDeMagia({ tempo: '1 reação', gatilho: 'Quando sou atingido por um ataque' });
  assert.equal(vm.runInContext('slotsConsumidos', comGatilho), 1);
  assert.deepEqual(plain(vm.runInContext('acoesConsumidas', comGatilho)), ['Reação']);
  assert.equal(vm.runInContext('ultimoRegistroMagia[2]', comGatilho), 'Quando sou atingido por um ataque');
});

test('efeitos vinculados à concentração encerrada são removidos sem remover os demais', () => {
  const e = editor(complexSpell());
  vm.runInContext(`
    atualizarSubAbaMagiasCombate = () => {};
    registrarEfeitoMagicoPendente({ id: 'a', nome: 'Hex', nivel: 1, momento_dano: 'posterior', propriedades: { dano: true, concentracao: true } }, 1);
    registrarEfeitoMagicoPendente({ id: 'b', nome: 'Agathys', nivel: 1, momento_dano: 'posterior', propriedades: { dano: true } }, 1);
    removerEfeitosDaConcentracao(obterChaveConcentracaoMagia({nome: 'Hex', nivel: 1}));
  `, e.context);
  assert.deepEqual(plain(vm.runInContext('listarEfeitosMagicosPendentes().map(x => x.magia.id)', e.context)), ['b']);
  const encerrados = plain(vm.runInContext('estadoCombateIniciativa.efeitosAtivos.filter(x => x.estado === "encerrada")', e.context));
  assert.equal(encerrados.length, 1);
  assert.equal(encerrados[0].dadosAplicacao.magia.id, 'a');
  assert.equal(encerrados[0].motivoEncerramento, 'Concentração encerrada');
});

test('E3.1: ativações da mesma magia coexistem e sobrevivem à restauração serializada', () => {
  const spell = { id: 'hex', nome: 'Hex', nivel: 1, duracao: '1 hora', momento_dano: 'posterior', propriedades: { dano: true } };
  const e = editor(spell);
  vm.runInContext(`
    atualizarSubAbaMagiasCombate = () => {};
    registrarEfeitoMagicoPendente(spell, 1);
    registrarEfeitoMagicoPendente(spell, 2);
  `, e.context);
  const ativos = plain(vm.runInContext('listarEfeitosMagicosPendentes()', e.context));
  assert.equal(ativos.length, 2);
  assert.notEqual(ativos[0].id, ativos[1].id);
  assert.deepEqual(ativos.map(x => x.nivelSlot), [1, 2]);
  assert.equal(ativos[0].instancia.origem.id, 'hex');
  assert.equal(ativos[0].instancia.duracao.valor, '1 hora');
  const snapshot = JSON.parse(JSON.stringify(e.context.estadoCombateIniciativa));
  e.context.estadoCombateIniciativa.efeitosAtivos = [];
  vm.runInContext('restaurarInstanciasAtivasMagia(snapshotTeste)', Object.assign(e.context, { snapshotTeste: snapshot }));
  assert.equal(vm.runInContext('listarEfeitosMagicosPendentes().length', e.context), 2);
});

test('E3.1: instância persistida referencia a ativação de concentração, não apenas a definição', () => {
  const e = editor(complexSpell());
  const spell = { id: 'bless', nome: 'Bless', nivel: 1, duracao: '1 minuto', momento_dano: 'posterior', propriedades: { dano: true, concentracao: true } };
  vm.runInContext(`atualizarSubAbaMagiasCombate = () => {}; iniciarConcentracaoMagia(spell, 1); registrarEfeitoMagicoPendente(spell, 1);`, Object.assign(e.context, { spell }));
  const state = plain(e.context.estadoCombateIniciativa);
  assert.equal(state.efeitosAtivos.length, 1);
  assert.equal(state.efeitosAtivos[0].concentracaoInstanciaId, state.concentracaoAtiva.instanciaId);
  assert.notEqual(state.concentracaoAtiva.instanciaId, spell.id);
});

test('dano imediato continua encaminhando ao modal e o momento persiste na edição', () => {
  const spell = complexSpell();
  spell.momento_dano = 'posterior';
  const e = editor(spell);
  assert.equal(e.save().momento_dano, 'posterior');
  e.field('magiaModalMomentoDano').value = 'imediato';
  assert.equal(e.save().momento_dano, 'imediato');
  vm.runInContext(`
    var abriu = false;
    estadoModalMagia.origemCombate = true;
    abrirModalDanoMagia = () => { abriu = true; };
    resolverCombateMagia({ nome: 'Mísseis', propriedades: {dano: true}, resolucao: 'Automático' }, 1);
  `, e.context);
  assert.equal(vm.runInContext('abriu', e.context), true);
});

test('E3.3: gatilho manual, por rodada, turno e condição sobrevive à edição da magia', () => {
  const spell = { ...complexSpell(), momento_dano: 'posterior', gatilho_aplicacao: { tipo: 'turno', descricao: 'Início do turno do alvo' } };
  const e = editor(spell);
  assert.equal(e.field('magiaModalGatilhoTipo').value, 'turno');
  assert.equal(e.field('magiaModalGatilhoDescricao').value, 'Início do turno do alvo');
  assert.deepEqual(e.save().gatilho_aplicacao, spell.gatilho_aplicacao);
  e.field('magiaModalGatilhoTipo').value = 'condicao';
  e.field('magiaModalGatilhoDescricao').value = 'Quando a criatura se mover';
  assert.deepEqual(e.save().gatilho_aplicacao, { tipo: 'condicao', descricao: 'Quando a criatura se mover' });
  e.field('magiaModalGatilhoTipo').value = '';
  assert.equal(e.save().gatilho_aplicacao, null);
});

test('conjuração registra o tipo de ação real das magias do catálogo', () => {
  const e = editor(complexSpell());
  const spells = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/magias/magias-nivel-1.json'), 'utf8'));
  vm.runInContext('var registros = []; adicionarRegistroHistoricoCombate = (...args) => registros.push(args);', e.context);
  for (const [name, expected] of [
    ['(Shield)', 'Reação'], ['(Hellish Rebuke)', 'Reação'],
    ['(Absorb Elements)', 'Reação'], ['(Hex)', 'Ação bônus'],
    ['(Healing Word)', 'Ação bônus'], ['(Magic Missile)', 'Ação'],
    ['(Alarm)', 'Conjuração'], ['(Ceremony)', 'Conjuração'],
  ]) {
    e.context.testSpell = spells.find(s => s.nome.includes(name));
    vm.runInContext('registrarHistoricoMagia(testSpell, 1)', e.context);
    assert.equal(vm.runInContext('registros.at(-1)[3]', e.context), expected, name);
  }
});

test('modais e badges usam reação, bônus e efeito sem herdar seleção anterior', () => {
  const e = editor(complexSpell());
  const combat = fs.readFileSync(path.join(root, 'js/modules/combate.js'), 'utf8');
  e.context.normalizarContextoAcaoAtaque = contexto => ({ action: 'action', bonusAction: 'bonusAction', reaction: 'reaction', 'Ação': 'action', 'Ação bônus': 'bonusAction', 'Reação': 'reaction' })[contexto] || null;
  vm.runInContext(combat.slice(combat.indexOf('function tipoAcaoAtaqueDisponivel('), combat.indexOf('function aplicarHistoricoDadoNoInput(')), e.context);
  vm.runInContext(combat.slice(combat.indexOf('function normalizarTipoAcaoHistorico('), combat.indexOf('function obterTituloMagiaHistorico(')), e.context);
  e.context.boxes = ['Ação', 'Ação bônus', 'Reação'].map(tipoAcao => ({ dataset: { tipoAcao }, checked: false }));
  vm.runInContext(`
    var estadoAtaqueArma = { origem: 'magia', magia: {tempo_conjuracao: '1 reação'}, aplicacaoEfeito: false };
    document.querySelectorAll = () => boxes;
    document.querySelector = () => boxes.find(b => b.checked);
    atualizarDetalheBonusDanoModal = atualizarTotalModalDano = () => {};
    marcarTipoAcaoModalAtaque('Ação');
  `, e.context);
  assert.equal(vm.runInContext('estadoAtaqueArma.tipoAcao', e.context), 'Reação');
  assert(e.context.boxes[2].checked);
  assert(e.context.boxes.every(b => b.disabled));
  vm.runInContext("estadoAtaqueArma.magia.tempo_conjuracao = '1 ação bônus'; marcarTipoAcaoModalAtaque();", e.context);
  assert.equal(vm.runInContext('estadoAtaqueArma.tipoAcao', e.context), 'Ação bônus');
  vm.runInContext('estadoAtaqueArma.aplicacaoEfeito = true; marcarTipoAcaoModalAtaque();', e.context);
  assert.equal(vm.runInContext('estadoAtaqueArma.tipoAcao', e.context), 'Efeito');
  assert(e.context.boxes.every(b => !b.checked));
  assert.equal(vm.runInContext('normalizarTipoAcaoHistorico(obterTipoAcaoSelecionadoModalAtaque()).texto', e.context), 'EFEITO');
  vm.runInContext("estadoAtaqueArma.origem = 'arma'; marcarTipoAcaoModalAtaque('Ação bônus');", e.context);
  assert(e.context.boxes.every(b => !b.disabled));
  assert.equal(vm.runInContext('obterTipoAcaoSelecionadoModalAtaque()', e.context), 'Ação bônus');
});

test('E3.2: concentração mantém estado separado do campo textual de condições', () => {
  const e = editor(complexSpell());
  vm.runInContext(`
    atualizarSubAbaMagiasCombate = () => {};
    document.getElementById('ataqueCondicao').value = 'Envenenado, Condição personalizada';
    iniciarConcentracaoMagia({nome:'Orientação (Guidance)', nivel:0, propriedades:{concentracao:true}});
  `, e.context);
  const condition = e.field('ataqueCondicao');
  assert.equal(condition.value, 'Envenenado, Condição personalizada');
  assert.equal(vm.runInContext('estadoCombateIniciativa.concentracaoAtiva.magia.nome', e.context), 'Orientação (Guidance)');
  vm.runInContext(`
    iniciarConcentracaoMagia({nome:'Bênção (Bless)', nivel:1, propriedades:{concentracao:true}});
    sincronizarCondicaoConcentracao();
  `, e.context);
  assert.equal(condition.value, 'Envenenado, Condição personalizada');
  assert.equal(vm.runInContext('estadoCombateIniciativa.concentracaoAtiva.magia.nome', e.context), 'Bênção (Bless)');
  vm.runInContext("encerrarConcentracao('perdida', {registrarHistorico:false})", e.context);
  assert.equal(condition.value, 'Envenenado, Condição personalizada');
});

test('E3.2: limpar condições não encerra a concentração separada', () => {
  const e = editor(complexSpell());
  vm.runInContext(`
    atualizarSubAbaMagiasCombate = () => {};
    iniciarConcentracaoMagia({nome:'Orientação (Guidance)', nivel:0, propriedades:{concentracao:true}});
    document.getElementById('ataqueCondicao').value = '';
    sincronizarCondicaoConcentracao();
  `, e.context);
  assert.equal(e.field('ataqueCondicao').value, '');
  assert.equal(vm.runInContext('estadoCombateIniciativa.concentracaoAtiva.magia.nome', e.context), 'Orientação (Guidance)');
  vm.runInContext('encerrarConcentracao("encerrada", {registrarHistorico:false})', e.context);
  assert.equal(e.field('ataqueCondicao').value, '');
});

test('E3.2: marcador legado de concentração migra para estado próprio e não é condição', () => {
  const e = editor(complexSpell());
  vm.runInContext(`
    document.getElementById('ataqueCondicao').value = 'Cego, Concentrado [Bless]';
    migrarConcentracaoLegadaDoCampo();
  `, e.context);
  const estado = plain(e.context.estadoCombateIniciativa);
  assert.equal(estado.concentracaoAtiva.magia.nome, 'Bless');
  assert.equal(estado.concentracaoAtiva.magia.legadoSemDefinicao, true);
  assert.deepEqual(estado.efeitosAtivos, []);
});
