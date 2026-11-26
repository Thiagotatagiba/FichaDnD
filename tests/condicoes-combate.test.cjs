const test = require('node:test');
const assert = require('node:assert/strict');
const regras = require('../js/domain/condicoes-combate.js');

let sequencia = 0;
const id = () => `cond-${++sequencia}`;

test('E3.2 migra condições oficiais, personalizadas e concentração separadamente', () => {
  const resultado = regras.migrarTextoLegado('Cego, Condição de campanha, Concentrado [Bless], Exausto', id);
  assert.deepEqual(resultado.map(({ tipo, nome }) => [tipo, nome]), [
    ['oficial', 'Cego'], ['personalizada', 'Condição de campanha'], ['oficial', 'Exausto'],
  ]);
  assert.equal(resultado[2].nivelExaustao, 1);
  assert.ok(resultado.every((item) => item.origem.tipo === 'legado' && item.duracao.tipo === 'indefinida'));
});

test('E3.2 remoção individual encerra somente a condição removida e mantém as outras', () => {
  const anteriores = regras.migrarTextoLegado('Cego, Envenenado, Condição de campanha', id);
  const preservado = anteriores.find((item) => item.nome === 'Cego');
  const resultado = regras.reconciliar(anteriores, ['Cego', 'Condição de campanha'], 1, id, () => '2026-11-24T12:00:00.000Z');
  assert.equal(resultado.find((item) => item.nome === 'Cego').id, preservado.id);
  assert.equal(resultado.find((item) => item.nome === 'Envenenado').estado, 'encerrada');
  assert.equal(resultado.find((item) => item.nome === 'Envenenado').encerradaEm, '2026-11-24T12:00:00.000Z');
  assert.equal(resultado.find((item) => item.nome === 'Condição de campanha').estado, 'ativa');
});

test('E3.2 exaustão registra nível limitado a 1–6 e condições simultâneas não duplicam nomes', () => {
  const resultado = regras.reconciliar([], ['Exausto', 'Exausto', 'Imobilizado'], 99, id);
  assert.equal(resultado.length, 2);
  assert.equal(resultado.find((item) => item.nome === 'Exausto').nivelExaustao, 6);
});
