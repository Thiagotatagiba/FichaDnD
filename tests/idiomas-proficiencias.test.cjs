const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const raiz = path.resolve(__dirname, "..");
const moduloIdiomas = fs.readFileSync(
  path.join(raiz, "js/modules/idiomas.js"),
  "utf8",
);
const htmlFicha = fs.readFileSync(
  path.join(raiz, "ficha/Ficha_DnD_-_Tatagiba_1.0.html"),
  "utf8",
);

function criarContexto() {
  const contexto = vm.createContext({
    document: { getElementById: () => null },
    window: {},
  });
  vm.runInContext(moduloIdiomas, contexto);
  return contexto;
}

test("idiomas antigos separados por vírgula viram valores únicos sem perda", () => {
  const contexto = criarContexto();
  const resultado = JSON.parse(
    vm.runInContext(
      'JSON.stringify(separarIdiomas("Comum, Élfico e um idioma adicional, Infernal"))',
      contexto,
    ),
  );

  assert.deepEqual(resultado, [
    "Comum",
    "Élfico e um idioma adicional",
    "Infernal",
  ]);
});

test("normalização remove espaços, vazios e duplicatas sem diferenciar caixa", () => {
  const contexto = criarContexto();
  const resultado = JSON.parse(
    vm.runInContext(
      'JSON.stringify(normalizarIdiomas(" Comum, élfico ", ["COMUM", "Idioma novo", "idioma NOVO"]))',
      contexto,
    ),
  );

  assert.deepEqual(resultado, ["Comum", "élfico", "Idioma novo"]);
});

test("normalização serializa corretamente listas aninhadas de idiomas", () => {
  const contexto = criarContexto();
  const resultado = JSON.parse(
    vm.runInContext(
      'JSON.stringify(normalizarIdiomas([["Comum"], ["Idioma A", "Idioma B"]]))',
      contexto,
    ),
  );

  assert.deepEqual(resultado, ["Comum", "Idioma A", "Idioma B"]);
});

test("campo persistido mantém o id antigo e Outros é o último checkbox", () => {
  assert.match(htmlFicha, /<textarea\s+id="proficienciaIdiomas"\s+hidden/);
  const linhaTitulo = htmlFicha.match(
    /<div class="idiomas-titulo-linha">[\s\S]*?<\/div>\s*<div\s+id="idiomasTags"/,
  )?.[0];
  assert.ok(linhaTitulo, "linha do título de idiomas presente");
  assert.ok(
    linhaTitulo.indexOf('id="btnAdicionarIdioma"') <
      linhaTitulo.indexOf('class="proficiencia-subtitulo"'),
    "botão fica antes do título Idiomas",
  );
  assert.match(htmlFicha, /id="idiomasOpcoes"[^>]*role="group"/);
  assert.doesNotMatch(htmlFicha, /<select[^>]*\bmultiple\b/);

  const contexto = criarContexto();
  assert.match(moduloIdiomas, /checkbox\.type = "checkbox"/);
  assert.match(
    moduloIdiomas,
    /criarOpcao\("Outros", idiomasPersonalizados\.length > 0, true\)/,
  );
  const valores = JSON.parse(
    vm.runInContext(
      "JSON.stringify([...IDIOMAS_CATALOGO, IDIOMA_OUTROS])",
      contexto,
    ),
  );
  assert.equal(valores.at(-1), "__outros__");
});

test("tags não têm botão X e permanecem editáveis pelo modal", () => {
  assert.doesNotMatch(moduloIdiomas, /idiomas-tag-remover/);
  assert.match(
    moduloIdiomas,
    /const selecionados = obterCheckboxes\(\)\.filter\(\s*\(checkbox\) => checkbox\.checked,\s*\)/,
  );
  assert.match(
    moduloIdiomas,
    /definirIdiomas\(\[idiomasCatalogados, idiomasPersonalizados\]\)/,
  );
});

test("importação sincroniza as tags depois de preencher os campos antigos", () => {
  const fonteImportacao = fs.readFileSync(
    path.join(raiz, "js/modules/importacao.js"),
    "utf8",
  );
  assert.match(fonteImportacao, /window\.__atualizarTagsIdiomas\(\)/);
});

test("armaduras e escudos usam seletor visual sem remover os campos legados", () => {
  assert.match(htmlFicha, /class="armaduras-titulo-linha"/);
  assert.match(htmlFicha, /id="btnAdicionarProficienciaArmadura"/);
  assert.match(
    htmlFicha,
    /<div class="proficiencia-subtitulo">Armaduras e Escudos<\/div>/,
  );
  [
    "profArmaduraLeves",
    "profArmaduraMedias",
    "profArmaduraPesadas",
    "profEscudos",
    "proficienciaArmaduras",
  ].forEach((id) => assert.match(htmlFicha, new RegExp(`id="${id}"`)));
});

test("armaduras preservam valores legados e importação atualiza as tags", () => {
  const moduloArmaduras = fs.readFileSync(
    path.join(raiz, "js/modules/armaduras-proficiencias.js"),
    "utf8",
  );
  const fonteImportacao = fs.readFileSync(
    path.join(raiz, "js/modules/importacao.js"),
    "utf8",
  );
  const contexto = vm.createContext({
    document: { getElementById: () => null },
    window: {},
  });
  vm.runInContext(moduloArmaduras, contexto);

  const resultado = JSON.parse(
    vm.runInContext(
      'JSON.stringify(separarProficienciasArmadura("Proficiência especial, outra" + String.fromCharCode(10) + "PROFICIÊNCIA ESPECIAL"))',
      contexto,
    ),
  );
  assert.deepEqual(resultado, ["Proficiência especial", "outra"]);
  assert.match(fonteImportacao, /window\.__atualizarTagsArmaduras\(\)/);
  assert.match(htmlFicha, /id="armadurasOpcoes"[^>]*role="group"/);
  assert.match(htmlFicha, /id="armadurasModal"[\s\S]*?aria-modal="true"/);
});
