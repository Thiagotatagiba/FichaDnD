const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { calcularCoberturaCamadaPvTemporario: cobertura } = require("../js/domain/pv-temporarios-visual.js");
const html = fs.readFileSync(path.join(__dirname, "../ficha/Ficha_DnD_-_Tatagiba_1.0.html"), "utf8");
const eventos = fs.readFileSync(path.join(__dirname, "../js/core/events.js"), "utf8");
const layoutCombate = fs.readFileSync(path.join(__dirname, "../js/modules/combate-layout-v2.js"), "utf8");

test("camadas de PV temporários cobrem os cinco corações nas três faixas", () => {
  assert.deepEqual(Array.from({ length: 5 }, (_, i) => cobertura(10, 10, 0, i)), [1, 1, 1, 1, 1]);
  assert.deepEqual(Array.from({ length: 5 }, (_, i) => cobertura(12, 10, 1, i)), [1, 0, 0, 0, 0]);
  assert.deepEqual(Array.from({ length: 5 }, (_, i) => cobertura(22, 10, 2, i)), [1, 0, 0, 0, 0]);
  assert.deepEqual(Array.from({ length: 5 }, (_, i) => cobertura(30, 10, 2, i)), [1, 1, 1, 1, 1]);
  assert.equal(cobertura(31, 10, 2, 4), 1);
});

test("frações preservam a proporção com máximos não divisíveis por cinco", () => {
  assert.equal(cobertura(1.3, 13, 0, 0), 0.5);
  assert.equal(cobertura(2.6, 13, 0, 0), 1);
  assert.equal(cobertura(2.6, 13, 0, 1), 0);
});

test("HUD usa cinco corações, camadas sobrepostas e botão acessível para TEMP", () => {
  assert.match(html, /id="pvHearts"/);
  assert.match(html, /id="ataquePvHearts"/);
  assert.equal((html.match(/class="pv-heart"/g) || []).length, 10);
  assert.doesNotMatch(html, /pvTempHeart|ataquePvTempHeart|pv-heart-hidden/);
  assert.match(html, /id="btnGerenciarPvTemporarios"[^>]*aria-label="Gerenciar PV temporários"/);
  assert.match(html, /id="pvTemporarioDialogo"[\s\S]*?id="pvTemporariosRecebidos"[\s\S]*?id="btnRemoverPvTemporarios"[\s\S]*?id="btnCancelarPvTemporarios"[\s\S]*?id="btnConfirmarPvTemporarios"/);
  assert.match(eventos, /vidaTemp > vidaMax \* 3/);
  assert.match(eventos, /contadorTemporario\.textContent = String\(pvTemporario\)/);
  assert.match(layoutCombate, /btnGerenciarPvTemporariosCombate/);
  assert.match(layoutCombate, /ficha:gerenciar-pv-temporarios/);
  assert.match(eventos, /document\.addEventListener\("ficha:gerenciar-pv-temporarios", abrirDialogo\)/);
  assert.match(eventos, /if \(valor > atual\)/);
  assert.match(eventos, /saldo\.value = "0"/);
});
