const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('ficha/Ficha_DnD_-_Tatagiba_1.0.html', 'utf8');
const combate = fs.readFileSync('js/modules/combate.js', 'utf8');
const habilidades = fs.readFileSync('js/modules/habilidades.js', 'utf8');
const css = fs.readFileSync('css/base.css', 'utf8');
const regras = fs.readFileSync('js/domain/regras-combate.js', 'utf8');
const magias = fs.readFileSync('js/modules/magias.js', 'utf8');

function extrairFuncao(nome, proximaAssinatura) {
  const inicio = combate.indexOf('function ' + nome + '(');
  const fim = combate.indexOf(proximaAssinatura, inicio);
  assert.ok(inicio >= 0 && fim > inicio, 'função ' + nome + ' existe');
  return combate.slice(inicio, fim);
}

test('modais de ataque e salvaguarda não exibem controles de vantagem/desvantagem', () => {
  assert.doesNotMatch(html, /id="modalAtaqueFontesD20"/);
  assert.doesNotMatch(html, /id="modalTesteResistenciaFontesD20"/);
  assert.doesNotMatch(html, /id="fontePersistenteAdicionar"/);
  assert.doesNotMatch(html, /for="modalAtaqueDado" class="oculto-acessivel"/);
});

test('rolagens mantêm um único d20 e fontes antigas não são reaplicadas', () => {
  const contexto = vm.createContext({
    document: { getElementById: () => null },
  });
  vm.runInContext(extrairFuncao('obterResolucaoRolagemD20', 'function obterResolucaoManualD20Atual'), contexto);
  vm.runInContext(extrairFuncao('obterResolucaoManualD20Atual', 'function obterEstadoCombateParaSalvar'), contexto);
  assert.deepEqual(JSON.parse(JSON.stringify(contexto.obterResolucaoManualD20Atual('modalAtaque', 'ataque', 18, { modo: 'vantagem', resultados: [3, 18] }))), {
    modo: 'normal', quantidadeD20: 1, vantagens: [], desvantagens: [], fontesAplicaveis: [], escolhido: 18, resultados: [18],
  });
  assert.match(combate, /listar: \(\) => \[\]/, 'API de compatibilidade não reaplica fontes importadas');
  assert.match(habilidades, /animarRolagemNoCampo\(campoDado, 1, 20/);
  assert.doesNotMatch(combate, /modalAtaqueHostilAdjacente|modalAtaqueDadoSecundario|modalAtaqueDistanciaAlvo|Distância até o alvo|Informe a distância|2d20|desvantagem aplicada/i);
  assert.doesNotMatch(habilidades, /contexto\.quantidadeD20/);
  assert.match(combate, /campoDetalhe\.textContent = .*"1d20"/);
  assert.doesNotMatch(regras, /resolverFontesVantagemDesvantagem|resolverD20ComFontes|aplicarAjustePassiva/);
  assert.doesNotMatch(magias, /FichaDnDFontesVantagemDesvantagem|aplicarAjustePassiva/);
});

test('resultado do d20 fica no campo numérico, sem duplicação no rótulo do dado', () => {
  const campo = { textContent: '' };
  const contexto = vm.createContext({ document: { getElementById: id => id === 'modalAtaqueDadoDetalhe' ? campo : null } });
  vm.runInContext(extrairFuncao('atualizarDetalheDadoAtaqueModal', 'function atualizarDetalheBonusAtaqueModal'), contexto);
  contexto.atualizarDetalheDadoAtaqueModal();
  assert.equal(campo.textContent, '1d20');
});

test('modal de ataque mantém alinhamento de conteúdo, cálculo e ações em largura integral', () => {
  assert.match(html, /id="modalAtaqueEtapaDado">\s*<div class="dado-modal">\s*<div class="dado-modal-cabecalho">\s*<span class="dado-modal-titulo">Rolagem de ataque<\/span>/);
  assert.doesNotMatch(combate, /`1d20: \$\{resolucao\.escolhido\}`/);
  assert.match(css, /\.ataque-modal-corpo:has\(#modalAtaqueEtapaDado\)\s*\{\s*align-items:\s*stretch;/);
  assert.match(css, /#modalAtaqueEtapaDado\s*\{\s*width:\s*100%;/);
  assert.match(css, /#modalAtaqueEtapaDado \.ataque-modal-checklist,\s*#modalAtaqueEtapaDado \.ataque-modal-acoes,\s*#modalAtaqueEtapaDado \.ataque-modal-historico\s*\{\s*width:\s*100%;/);
});

test('defesas manuais do alvo ficam fora do modal até aprovação de uma nova interface', () => {
  for (const id of [
    'modalAtaqueDefesasAlvo',
    'modalAtaqueResistenciasAlvo',
    'modalAtaqueVulnerabilidadesAlvo',
    'modalAtaqueImunidadesAlvo',
  ]) assert.doesNotMatch(html, new RegExp(`id="${id}"`));
  assert.doesNotMatch(combate, /obterDefesasManuaisAlvoAtaque|limparDefesasManuaisAlvoAtaque/);
  assert.match(combate, /RegrasCombate\.resolverDanoTipado\(\{\s*quantidade: danoBruto,\s*tipo,\s*origem:/);
});
