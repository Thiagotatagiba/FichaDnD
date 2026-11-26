const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('catálogos de magias e classes ficam organizados em assets/data', () => {
  const magiasDir = path.join(root, 'assets/data/magias');
  const classesDir = path.join(root, 'assets/data/classes');
  const magias = fs.readdirSync(magiasDir).filter((nome) => /^magias-nivel-\d\.json$/.test(nome));
  const classes = fs.readdirSync(classesDir).filter((nome) => /^caracteristica_.+\.json$/.test(nome));

  assert.deepEqual(magias.sort(), Array.from({ length: 10 }, (_, nivel) => `magias-nivel-${nivel}.json`));
  assert.equal(classes.length, 12);
  for (const nome of [...magias, ...classes]) {
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(nome.startsWith('magias-') ? magiasDir : classesDir, nome), 'utf8')));
  }

  assert.equal(fs.existsSync(path.join(root, 'ficha/Classes')), false);
  assert.equal(fs.existsSync(path.join(root, 'assets/data/magias-nivel-0.json')), false);
});
