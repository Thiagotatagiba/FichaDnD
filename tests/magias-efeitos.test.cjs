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
          value: '', checked: false, style: {}, classList: { toggle() {} },
        });
        return fields.get(id);
      },
    },
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

test('todas as magias de nível 1 preservam seus efeitos ao salvar sem alterações', () => {
  const spells = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/magias-nivel-1.json'), 'utf8'));
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
  assert.equal(vm.runInContext('efeitosMagicosPendentes.size', e.context), 1);
  // A mesma chamada usada pelo botão de aplicar recebe o espaço original.
  vm.runInContext(`
    const pendente = [...efeitosMagicosPendentes.values()][0];
    abrirModalDanoMagia(pendente.magia, { mostrarCD: false, nivelSlot: pendente.nivelSlot });
  `, e.context);
  assert.equal(vm.runInContext('gastos', e.context), 1);
  assert.equal(vm.runInContext('ultimoSlot', e.context), 2);
});

test('efeitos de concentração são removidos sem remover os demais', () => {
  const e = editor(complexSpell());
  vm.runInContext(`
    atualizarSubAbaMagiasCombate = () => {};
    registrarEfeitoMagicoPendente({ id: 'a', nome: 'Hex', nivel: 1, momento_dano: 'posterior', propriedades: { dano: true, concentracao: true } }, 1);
    registrarEfeitoMagicoPendente({ id: 'b', nome: 'Agathys', nivel: 1, momento_dano: 'posterior', propriedades: { dano: true } }, 1);
    removerEfeitosDaConcentracao(obterChaveConcentracaoMagia({nome: 'Hex', nivel: 1}));
  `, e.context);
  assert.deepEqual(plain(vm.runInContext('[...efeitosMagicosPendentes.keys()]', e.context)), ['b']);
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

test('conjuração registra o tipo de ação real das magias do catálogo', () => {
  const e = editor(complexSpell());
  const spells = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/magias-nivel-1.json'), 'utf8'));
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
  vm.runInContext(combat.slice(combat.indexOf('function marcarTipoAcaoModalAtaque('), combat.indexOf('function aplicarHistoricoDadoNoInput(')), e.context);
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

test('barra de condições acompanha início, troca e fim da concentração', () => {
  const e = editor(complexSpell());
  vm.runInContext(`
    atualizarSubAbaMagiasCombate = () => {};
    document.getElementById('ataqueCondicao').value = 'Envenenado, Condição personalizada';
    iniciarConcentracaoMagia({nome:'Orientação (Guidance)', nivel:0, propriedades:{concentracao:true}});
  `, e.context);
  const condition = e.field('ataqueCondicao');
  assert.equal(condition.value, 'Envenenado, Condição personalizada, Concentrado [Orientação (Guidance)]');
  vm.runInContext(`
    iniciarConcentracaoMagia({nome:'Bênção (Bless)', nivel:1, propriedades:{concentracao:true}});
    sincronizarCondicaoConcentracao();
  `, e.context);
  assert.equal(condition.value, 'Envenenado, Condição personalizada, Concentrado [Bênção (Bless)]');
  vm.runInContext("encerrarConcentracao('perdida', {registrarHistorico:false})", e.context);
  assert.equal(condition.value, 'Envenenado, Condição personalizada');
});

test('alterar ou limpar condições manuais não remove concentração ativa', () => {
  const e = editor(complexSpell());
  vm.runInContext(`
    atualizarSubAbaMagiasCombate = () => {};
    iniciarConcentracaoMagia({nome:'Orientação (Guidance)', nivel:0, propriedades:{concentracao:true}});
    document.getElementById('ataqueCondicao').value = '';
    sincronizarCondicaoConcentracao();
  `, e.context);
  assert.equal(e.field('ataqueCondicao').value, 'Concentrado [Orientação (Guidance)]');
  vm.runInContext('encerrarConcentracao("encerrada", {registrarHistorico:false})', e.context);
  assert.equal(e.field('ataqueCondicao').value, '');
});
