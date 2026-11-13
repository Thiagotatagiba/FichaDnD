const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/modules/magias.js'), 'utf8');

function characteristicEditor(item) {
  const fields = new Map([
    ['talentoModalNomeInput', { value: item.nome }],
    ['talentoModalDescricaoInput', { value: item.descricao }],
  ]);
  const context = vm.createContext({
    document: {
      getElementById(id) {
        if (!fields.has(id)) fields.set(id, null);
        return fields.get(id);
      },
    },
  });
  vm.runInContext(source, context);
  context.originalItem = JSON.parse(JSON.stringify(item));
  vm.runInContext(`
    var talentosEstruturados = { raca: [originalItem] };
    estadoModalTalento.categoria = 'raca';
    estadoModalTalento.indice = 0;
    estadoModalTalento.itemOriginal = originalItem;
    estadoModalTalento.modo = 'editar';
    renderTalentos = () => {};
    fecharModalTalento = () => {};
  `, context);
  return {
    fields,
    context,
    serialize: () => JSON.parse(vm.runInContext('JSON.stringify(talentosEstruturados)', context)),
    save: () => vm.runInContext('salvarModalTalento()', context),
  };
}

test('editar característica preserva metadados desconhecidos e round-trip JSON', () => {
  const original = {
    id: 'caracteristica-personalizada-17',
    nome: 'Visão antiga',
    descricao: 'Descrição antes da edição',
    tipo: 'Traço ancestral',
    origem: 'Casa de campanha',
    custom: { source: 'mesa', flags: ['raro', 'validado'], rules: { edition: 2014 } },
    desconhecidoDoEditor: { nested: [{ key: 'value' }] },
  };
  const editor = characteristicEditor(original);
  editor.fields.get('talentoModalNomeInput').value = 'Visão atualizada';
  editor.fields.get('talentoModalDescricaoInput').value = 'Descrição revisada';

  editor.save();

  const serializedItem = editor.serialize().raca[0];
  assert.equal(serializedItem.nome, 'Visão atualizada');
  assert.equal(serializedItem.descricao, 'Descrição revisada');
  assert.equal(serializedItem.tipo, original.tipo);
  assert.equal(serializedItem.origem, original.origem);
  assert.equal(serializedItem.id, original.id);
  assert.deepEqual(serializedItem.custom, original.custom);
  assert.deepEqual(serializedItem.desconhecidoDoEditor, original.desconhecidoDoEditor);
});

test('editar característica sem mudanças não remove propriedades após serialização', () => {
  const original = {
    nome: 'Resistência peculiar',
    descricao: 'Mantém uma regra personalizada.',
    tipo: 'Dom',
    origem: 'Histórico',
    metadataExtra: { enabled: true, tags: ['personalizado'] },
  };
  const editor = characteristicEditor(original);

  editor.save();

  assert.deepEqual(editor.serialize().raca[0], original);
});

test('característica nova recebe defaults da categoria sem inventar metadados', () => {
  const context = vm.createContext({ document: { getElementById: () => null } });
  vm.runInContext(source, context);
  const item = JSON.parse(vm.runInContext("JSON.stringify(normalizarItemTalento(null, 'raca'))", context));

  assert.deepEqual(item, {
    nome: '',
    descricao: '',
    tipo: 'Raça',
    origem: 'Raça',
  });
});
