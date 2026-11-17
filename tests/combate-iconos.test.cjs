const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function loadManifest() {
  const source = fs.readFileSync(path.join(root, "ficha/Codigos testes/Combate 2.0 - referencia fiel.html"), "utf8");
  const start = source.indexOf('<script type="application/json" id="combatIconManifest">');
  const contentStart = source.indexOf(">", start) + 1;
  const end = source.indexOf("</script>", contentStart);
  assert.ok(start >= 0 && contentStart > 0 && end > contentStart, "manifesto JSON embutido deve existir");
  return JSON.parse(source.slice(contentStart, end));
}

test("ícone da Espada Longa usa o ID do catálogo e não modifica suas regras", () => {
  const manifest = loadManifest();
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "assets/data/itens/armas.json"), "utf8"));
  const sword = catalog.itens.find(item => item.id === "espada-longa");

  assert.equal(manifest.weapons["espada-longa"].path, "assets/icons/armas/two-handed-sword.svg");
  assert.deepEqual(Object.keys(manifest.weapons), ["espada-longa"]);
  assert.equal(sword.nome, "Espada Longa");
  assert.equal(sword.dano.base, "1d8");
  assert.equal(sword.dano.versatil, "1d10");
  assert.ok(sword.propriedades.includes("versatil"));
  assert.ok(!sword.propriedades.includes("duas_maos"));
  assert.equal(manifest.fallback.weapon, "assets/icons/interface/maos/mao-ocupada.svg");
  assert.equal(manifest.fallback.weaponGlyph, "dagger");
});

test("armas sem SVG próprio usam mao-ocupada sem substituir a mão vazia nem ícones específicos", () => {
  const source = fs.readFileSync(path.join(root, "ficha/Codigos testes/Combate 2.0 - referencia fiel.html"), "utf8");
  const manifest = loadManifest();

  assert.equal(manifest.interface.hands.empty, "assets/icons/interface/maos/mao-vazia.svg");
  assert.match(source, /function showWeaponFallbackIcon\(container\)/);
  assert.match(source, /className = 'weapon-item-icon generic-weapon-fallback'/);
  assert.match(source, /else if \(main\.tipo === 'arma'\) showWeaponFallbackIcon/);
  assert.match(source, /else if \(off\.tipo === 'arma'\) showWeaponFallbackIcon/);
  assert.match(source, /row\.tipo === 'arma' \|\| row\.categoria === 'arma'/);
  assert.match(source, /container\.replaceChildren\(svgIcon\('shield'\)\)/);
  assert.match(source, /\.weapons\?\.?\[catalogId\]/);
  assert.ok(fs.existsSync(path.join(root, manifest.fallback.weapon)), "SVG de fallback deve existir");
});

test("SVG preserva viewBox, transparência do fundo e adaptação bronze", () => {
  const svg = fs.readFileSync(path.join(root, "assets/icons/armas/two-handed-sword.svg"), "utf8");

  assert.match(svg, /viewBox="0 0 512 512"/);
  assert.match(svg, /fill="#956332"/);
  assert.match(svg, /<title>Two Handed Sword<\/title>/);
  assert.ok(!svg.includes("M0 0h512v512H0z"), "o fundo opaco original deve permanecer removido");
  assert.ok(!svg.includes("<script"));
  assert.ok(!svg.includes("<foreignObject"));
  assert.ok(!svg.includes("href=\"http"));
});

test("atribuição registra Delapouite, Game-icons, CC BY 3.0 e as alterações", () => {
  const attribution = fs.readFileSync(path.join(root, "assets/icons/ATTRIBUTION.md"), "utf8");

  assert.match(attribution, /Delapouite/);
  assert.match(attribution, /game-icons\.net\/1x1\/delapouite\/two-handed-sword\.html/);
  assert.match(attribution, /CC BY 3\.0/);
  assert.match(attribution, /removido o fundo quadrado opaco/);
  assert.match(attribution, /ajustada a cor/);
});
