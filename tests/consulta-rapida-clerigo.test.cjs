const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/modules/card-classe.js'), 'utf8');
const catalogo = JSON.parse(fs.readFileSync(
  path.join(root, 'ficha/Classes/caracteristica_clerigo.json'), 'utf8',
));

const niveisDeDominio = [1, 2, 6, 8, 17];
const caracteristicasEsperadas = {
  'Domínio da Vida': [
    ['Discípulo da Vida', 'Proficiência com Armaduras Pesadas'],
    ['Preservar Vida'], ['Curandeiro Abençoado'], ['Golpe Divino (Vida)'], ['Cura Suprema'],
  ],
  'Domínio da Guerra': [
    ['Sacerdote de Guerra', 'Proficiência com Armas Marciais', 'Proficiência com Armaduras Pesadas'],
    ['Golpe Guiado'], ['Bênção do Deus da Guerra'], ['Golpe Divino (Guerra)'], ['Avatar da Batalha'],
  ],
  'Domínio da Enganação': [
    ['Bênção do Trapaceiro'], ['Invocar Duplicidade'], ['Manto de Sombras'],
    ['Golpe Divino (Enganação)'], ['Duplicidade Aprimorada'],
  ],
  'Domínio do Conhecimento': [
    ['Bênçãos do Conhecimento'], ['Canalizar Divindade: Conhecimento das Eras'],
    ['Ler Pensamentos'], ['Conjuração Potente'], ['Visões do Passado'],
  ],
};

function listaDeClasses() {
  const names = new Set();
  return {
    add: (name) => names.add(name),
    remove: (name) => names.delete(name),
    contains: (name) => names.has(name),
    values: () => [...names],
  };
}

function linhaTabela() {
  return {
    classList: listaDeClasses(),
    children: [],
    set innerHTML(html) {
      this.children = [...html.matchAll(/<td>([\s\S]*?)<\/td>/g)]
        .map((match) => ({ innerHTML: match[1] }));
    },
    cloneNode() {
      const copia = linhaTabela();
      copia.children = this.children.map((cell) => ({ ...cell }));
      this.classList.values().forEach((name) => copia.classList.add(name));
      return copia;
    },
  };
}

function montarCard() {
  const linhas = [];
  const descricoesAbertas = new Set();
  function abrirNaConsulta(dialog) {
    descricoesAbertas.add(dialog);
  }
  function criarDialogo() {
    const texto = { h3: {}, p: {} };
    const listeners = new Map();
    return {
      localName: 'dialog',
      attributes: {},
      open: false,
      querySelector(selector) { return texto[selector] ?? null; },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, listener) { listeners.set(name, listener); },
      showModal() { this.open = true; },
      close() {
        this.open = false;
        listeners.get('close')?.();
      },
      remove() { descricoesAbertas.delete(this); },
    };
  }

  const tbody = {
    set innerHTML(value) { assert.equal(value, ''); linhas.length = 0; },
    appendChild: (child) => linhas.push(child),
    querySelectorAll(selector) { assert.equal(selector, 'tr'); return linhas; },
  };
  const tabela = {
    cloneNode(deep) {
      assert.equal(deep, true);
      const corpo = {
        id: 'tbodyClasse',
        removeAttribute(name) { delete this[name]; },
      };
      return {
        linhas: linhas.map((linha) => linha.cloneNode()),
        querySelector(selector) { assert.equal(selector, 'tbody'); return corpo; },
      };
    },
  };
  const consulta = {
    tabelas: [],
    set innerHTML(value) { assert.equal(value, ''); this.tabelas.length = 0; },
    appendChild(child) {
      if (child.localName === 'dialog') abrirNaConsulta(child);
      else this.tabelas.push(child);
    },
    replaceChildren(child) { this.tabelas = [child]; },
  };
  const overlay = {
    classList: listaDeClasses(),
    attributes: { 'aria-hidden': 'true' },
    setAttribute(name, value) { this.attributes[name] = value; },
    appendChild: abrirNaConsulta,
  };
  const escritasPersistentes = [];
  let valorPersistido = '';
  const campos = {
    tbodyClasse: tbody,
    tituloClasse: {},
    nivelClasseAtualCard: {},
    nomeSubclasse: {},
    classeNivelID: { value: '6' },
    selectSubclasse: { value: '' },
    subclasse: { value: 'Escolha original do personagem' },
    caracteristicaClasseSubclasse: {
      get value() { return valorPersistido; },
      set value(value) { escritasPersistentes.push(value); valorPersistido = value; },
    },
    consultaCaracteristicaClasseConteudo: consulta,
    consultaCaracteristicaClasseOverlay: overlay,
    modalTitulo: {},
    modalTexto: {},
    modal: { style: {} },
  };
  const personagem = { subclasse: campos.subclasse.value, xp: 15000, pvAtual: 24 };
  const context = vm.createContext({
    catalogo,
    window: { personagem },
    nivelCaracteristicaValor: (nivel) => parseInt(nivel, 10),
    document: {
      addEventListener() {},
      createElement(tag) {
        if (tag === 'dialog') return criarDialogo();
        assert.equal(tag, 'tr');
        return linhaTabela();
      },
      body: { appendChild: abrirNaConsulta },
      getElementById: (id) => campos[id] ?? null,
      querySelector(selector) {
        assert.equal(selector, '#cardClasseContainer table');
        return tabela;
      },
      querySelectorAll(selector) {
        assert.equal(selector, '#tbodyClasse tr');
        return linhas;
      },
    },
  });
  vm.runInContext(source, context);
  vm.runInContext('dadosClasse = catalogo; montarTabela();', context);

  function clicarCaracteristica(linha, titulo) {
    const acao = [...linha.children[2].innerHTML.matchAll(
      /<span class="tag" onclick="([^"]+)">([^<]+)<\/span>/g,
    )].find((match) => match[2] === titulo);
    assert.ok(acao, `A característica "${titulo}" deve abrir o modal`);
    vm.runInContext(acao[1], context);
  }

  return {
    consulta,
    campos,
    linhas,
    overlay,
    escritasPersistentes,
    pessoa: personagem,
    escolher(dominio) {
      campos.selectSubclasse.value = dominio;
      context.aplicarSubclasse();
    },
    abrir() {
      context.abrirConsultaCaracteristicaClasse();
      assert.equal(overlay.attributes['aria-hidden'], 'false');
      assert.equal(consulta.tabelas.length, 1);
      return consulta.tabelas[0].linhas;
    },
    fechar() { context.fecharConsultaCaracteristicaClasse(); },
    descrever(linha, titulo) {
      clicarCaracteristica(linha, titulo);
      assert.equal(descricoesAbertas.size, 1);
      const [dialogo] = descricoesAbertas;
      assert.equal(dialogo.open, true);
      assert.equal(dialogo.querySelector('h3').textContent, titulo);
      const descricao = dialogo.querySelector('p').textContent;
      dialogo.close();
      assert.equal(descricoesAbertas.size, 0);
      assert.equal(overlay.attributes['aria-hidden'], 'false');
      return descricao;
    },
    descreverNoCard(linha, titulo) {
      clicarCaracteristica(linha, titulo);
      assert.equal(descricoesAbertas.size, 0);
      assert.equal(campos.modal.style.display, 'flex');
      assert.equal(campos.modalTitulo.textContent, titulo);
      const descricao = campos.modalTexto.textContent;
      context.fecharModal();
      assert.equal(campos.modal.style.display, 'none');
      return descricao;
    },
  };
}

function nomesDaLinha(linha) {
  return [...linha.children[2].innerHTML.matchAll(/<span[^>]*>([^<]+)<\/span>/g)]
    .map((match) => match[1]);
}

function nomesDaTabela(linhas) {
  return linhas.map(nomesDaLinha);
}

for (const [dominio, esperadas] of Object.entries(caracteristicasEsperadas)) {
  test(`consulta rápida mantém conteúdo do card com ${dominio}`, () => {
    const card = montarCard();
    const base = nomesDaTabela(card.linhas);
    card.escolher(dominio);
    const tabelaPrincipal = nomesDaTabela(card.linhas);
    const consulta = card.abrir();

    assert.equal(consulta.length, 20);
    for (const [index, nivel] of niveisDeDominio.entries()) {
      const nomes = nomesDaLinha(consulta[nivel - 1]);
      const preservadas = base[nivel - 1].filter(
        (nome) => nome !== catalogo.TP_Subclasse && nome !== catalogo.Car_Subclasse,
      );
      assert.deepEqual(nomes.sort(), [
        ...preservadas,
        ...(nivel === 1 ? [dominio] : []),
        ...esperadas[index],
      ].sort(), `características no nível ${nivel}`);
      for (const nome of esperadas[index]) {
        assert.equal(card.descrever(consulta[nivel - 1], nome), catalogo.descricoes[nome]);
      }
    }
    assert.deepEqual(nomesDaTabela(consulta), tabelaPrincipal);
    assert.deepEqual(nomesDaTabela(card.linhas), tabelaPrincipal);
    assert.equal(card.descrever(consulta[0], dominio), catalogo.descricoes[dominio]);
    assert.match(catalogo.descricoes[dominio], /\nNível 9 —/);
    assert.equal(card.consulta.tabelas[0].querySelector('tbody').id, undefined);
  });
}

test('consulta sem domínio conserva a tabela-base e não grava seleção', () => {
  const card = montarCard();
  const tabelaPrincipal = nomesDaTabela(card.linhas);
  const consulta = card.abrir();

  assert.deepEqual(nomesDaTabela(consulta), tabelaPrincipal);
  assert.deepEqual(nomesDaTabela(card.linhas), tabelaPrincipal);
  assert.deepEqual(nomesDaLinha(consulta[0]), ['Conjuração', 'Domínio Divino']);
  assert.ok(nomesDaLinha(consulta[1]).includes('Característica de Domínio'));
  assert.deepEqual(card.escritasPersistentes, []);
});

test('reabrir consulta após troca de domínio e nível conserva seleção e estado', () => {
  const card = montarCard();
  const estadoOriginal = { ...card.pessoa };
  card.escolher('Domínio da Vida');
  card.abrir();
  card.fechar();
  assert.equal(card.overlay.attributes['aria-hidden'], 'true');
  assert.equal(card.overlay.classList.contains('ativo'), false);

  const novoDominio = 'Domínio da Guerra';
  card.escolher(novoDominio);
  card.campos.classeNivelID.value = '17';
  const selecoesDoUsuario = [...card.escritasPersistentes];
  const recentes = card.abrir();
  const esperado = [
    'Incremento no Valor de Habilidade',
    'Destruir Mortos-Vivos (ND 1)',
    'Golpe Divino (Guerra)',
  ];

  assert.equal(card.campos.nivelClasseAtualCard.textContent, 'Nível 17');
  assert.deepEqual(recentes.map((linha) => linha.classList.values().at(0)),
    Array.from({ length: 20 }, (_, index) => index < 16 ? 'linha-passada'
      : index === 16 ? 'linha-atual' : 'linha-futura'),
  );
  assert.deepEqual(nomesDaLinha(recentes[7]), esperado);
  assert.deepEqual(nomesDaTabela(recentes), nomesDaTabela(card.linhas));
  card.fechar();
  assert.deepEqual(nomesDaLinha(card.abrir()[7]), esperado);
  assert.equal(card.campos.selectSubclasse.value, novoDominio);
  assert.equal(card.campos.nomeSubclasse.textContent, novoDominio);
  assert.equal(card.campos.caracteristicaClasseSubclasse.value, novoDominio);
  assert.equal(card.campos.subclasse.value, estadoOriginal.subclasse);
  assert.deepEqual(card.escritasPersistentes, selecoesDoUsuario);
  assert.deepEqual(card.pessoa, estadoOriginal);
});

test('fechar a consulta mantém acessível a descrição pelo modal do card principal', () => {
  const card = montarCard();
  const caracteristica = 'Visões do Passado';
  card.escolher('Domínio do Conhecimento');
  const consulta = card.abrir();
  const texto = card.descrever(consulta[16], caracteristica);
  card.fechar();

  assert.match(texto, /\n\nObjeto\./);
  assert.equal(card.descreverNoCard(card.linhas[16], caracteristica), texto);
});
