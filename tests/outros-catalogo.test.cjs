const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const dir = path.join(root, "assets/data/itens/outros");
const registro = JSON.parse(fs.readFileSync(path.join(dir, "registro.json"), "utf8"));
const catalogos = registro.catalogos.map(entrada => ({ entrada, dados: JSON.parse(fs.readFileSync(path.join(dir, entrada.arquivo), "utf8")) }));

test("registro de Outros carrega catálogos separados e cada item pertence ao tipo declarado", () => {
  assert.equal(registro.versaoSchema, 1);
  assert.equal(registro.sistema, "dnd5e-2014");
  assert.equal(new Set(registro.catalogos.map(c => c.tipo)).size, registro.catalogos.length);
  for (const { entrada, dados } of catalogos) {
    assert.equal(dados.versaoSchema, 1, entrada.arquivo);
    assert.equal(dados.sistema, "dnd5e-2014", entrada.arquivo);
    assert.ok(Array.isArray(dados.itens), entrada.arquivo);
    for (const item of dados.itens) assert.equal(item.tipo, entrada.tipo, `${entrada.arquivo}: ${item.id}`);
  }
});

test("catálogos têm IDs únicos, valores rastreáveis e somente itens comuns", () => {
  const ids = new Set();
  for (const { entrada, dados } of catalogos) for (const item of dados.itens) {
    assert.ok(item.id && item.nome, `${entrada.arquivo} contém item sem ID/nome`);
    assert.ok(!ids.has(item.id), `ID duplicado: ${item.id}`);
    ids.add(item.id);
    assert.equal(item.raridade, "comum", `${item.id} não deveria ser mágico nesta entrega`);
    assert.ok(item.custo && (item.custo.valor === null || (Number.isFinite(item.custo.valor) && item.custo.valor >= 0)));
    assert.ok(item.pesoKg === null || (Number.isFinite(item.pesoKg) && item.pesoKg >= 0));
  }
  assert.equal(catalogos.find(c => c.entrada.tipo === "pocoes").dados.itens.length, 0);
});

test("instrumentos têm proficiência individual e opção de foco arcano sem automatizar regras", () => {
  const instrumentos = catalogos.find(c => c.entrada.tipo === "instrumentos-musicais").dados.itens;
  assert.ok(instrumentos.length > 0);
  assert.equal(new Set(instrumentos.map(item => item.proficienciaId)).size, instrumentos.length);
  assert.ok(instrumentos.every(item => item.podeSerFocoArcano === true));
  assert.doesNotMatch(fs.readFileSync(path.join(root, "js/modules/outros-catalogo.js"), "utf8"), /proficienciaId.*(?:somar|bonus|bônus)/i);
});

test("criação personalizada pede um tipo e limita proficiência a ferramentas/kits e instrumentos", () => {
  const fonte = fs.readFileSync(path.join(root, "js/modules/outros-catalogo.js"), "utf8");
  assert.match(fonte, /data-acao="criar"\]\'\)\.onclick = abrirEscolhaTipoOutro/);
  assert.match(fonte, /function tipoAceitaProficienciaOutro\(tipo\)\s*\{\s*return tipo === "ferramentas-kits" \|\| tipo === "instrumentos-musicais";/);
  assert.match(fonte, /outro-campo-proficiencia/);
  assert.match(fonte, /tipoAceitaProficienciaOutro\(tipo\) \? valorNoModalOutro\("proficiencia"\)\.value : ""/);
});
