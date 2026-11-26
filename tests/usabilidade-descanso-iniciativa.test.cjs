const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");

test("Descanso Curto reutiliza a barra e o padrão de rolagem com histórico e uso individual de dados", () => {
  const html = read("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const js = read("js/modules/combate.js");
  const css = read("css/base.css");
  assert.match(html, /<dialog id="descansoCurtoDialogo"[^>]*aria-labelledby="descansoCurtoTitulo"/);
  assert.match(html, /class="modal-base descanso-curto-modal"/);
  assert.match(html, /class="ataque-modal-topo descanso-curto-topo"/);
  assert.match(html, /class="ataque-modal-rodada salva-guarda-modal-rodada"[^>]*>[\s\S]*?DESCANSO CURTO[\s\S]*?id="descansoCurtoFechar"[^>]*class="modal-close-base modal-fechar-xp"[\s\S]*?>\s*×\s*<\/button>/);
  assert.match(html, /class="dado-modal descanso-curto-rolagem"[^>]*id="descansoCurtoRolagem"/);
  assert.match(html, /id="descansoCurtoResultadosManuais"[^>]*aria-describedby="descansoCurtoInfoTexto"/);
  assert.match(html, /id="descansoCurtoHistorico"[^>]*class="dado-modal-historico-lista"/);
  assert.match(html, /id="descansoCurtoUsarDado"[^>]*>Usar dado<\/button>/);
  assert.match(html, /<h2 id="descansoCurtoTitulo"[^>]*>Recuperação de pontos de vida<\/h2>/);
  assert.match(html, /id="descansoCurtoDescricao" class="xp-visually-hidden"/);
  assert.match(html, /id="descansoCurtoTipoResumo" class="xp-visually-hidden"/);
  assert.match(html, /id="descansoCurtoInfo"[^>]*aria-controls="descansoCurtoInfoTexto"[^>]*>[\s\S]*?<svg class="descanso-curto-icone-info"/);
  assert.doesNotMatch(html, /id="descansoCurtoInfo"[^>]*>\s*\(i\)/);
  assert.match(html, /id="descansoCurtoInfoTexto"[^>]*role="tooltip"[^>]*>Role ou informe um resultado e use o dado para adicioná-lo ao descanso\.<\/span>/);
  assert.match(html, /class="descanso-curto-resumo"[^>]*>[\s\S]*?Pontos de vida[\s\S]*?Dados de Vida[\s\S]*?<\/section>/);
  assert.match(html, /class="descanso-curto-total-rolagem"[^>]*>[\s\S]*?Dados usados:[\s\S]*?Cura total:[\s\S]*?PV após descanso:/);
  assert.match(html, /id="descansoCurtoDadoAtual"><span id="descansoCurtoDadoTotal">[\s\S]*?<small id="descansoCurtoDadoConta" class="descanso-curto-conta"/);
  assert.match(html, /class="descanso-curto-usar-linha"[^>]*>\s*<button id="descansoCurtoUsarDado"/);
  assert.match(html, /<\/section>\s*<div class="descanso-curto-total-rolagem"[^>]*>[\s\S]*?Cura total[\s\S]*?PV após descanso/);
  assert.doesNotMatch(html, /descansoCurtoManualAjuda|Dados restantes após confirmar/);
  assert.doesNotMatch(html, /class="descanso-curto-rolagem"[\s\S]*?Cura total/);
  assert.doesNotMatch(html, /id="descansoCurtoQuantidade"/);
  assert.match(html, /class="descanso-curto-recursos"[^>]*hidden/);
  assert.match(html, /id="descansoCurtoRolar"[^>]*onclick="rolarDadosDescansoCurto\(\)"/);
  assert.match(html, /id="descansoCurtoConfirmar"[^>]*onclick="confirmarDescansoCurto\(\)"/);
  assert.match(html, /id="descansoCurtoCancelar"[^>]*onclick="cancelarDescansoCurto\(\)"/);
  assert.doesNotMatch(html, /As alterações só serão aplicadas ao confirmar/);
  assert.doesNotMatch(css, /\.descanso-curto-aviso-rodape/);
  assert.match(css, /button\.modal-fechar-xp,[\s\S]*?button\.magia-selecao-fechar\s*\{[^}]*width:\s*26px[^}]*height:\s*22px[^}]*linear-gradient/);
  assert.match(css, /button\.modal-fechar-xp:focus-visible,[\s\S]*?button\.magia-selecao-fechar:focus-visible\s*\{[^}]*outline:\s*2px solid #1769aa/);
  assert.doesNotMatch(css, /button\.modal-fechar-xp:active[\s\S]*?transform:/);
  assert.ok(html.indexOf('id="modalVidaSubtitulo"') < html.indexOf('id="modalVidaInput"'));
  assert.match(html, /id="modalVidaSubtitulo"[^>]*>[\s\S]*?Informe a quantidade de dano sofrida\./);
  assert.match(css, /\.modal-vida-subtitulo\s*\{[^}]*text-align:\s*center/);
  for (const id of ["condicoesModalFechar", "modalIniciativaFechar", "xpAddModalClose", "configFecharBtn", "descansoCurtoFechar", "btnFecharIdiomasModal", "btnFecharArmadurasModal", "btnFecharFerramentasModal", "btnFecharArmasProficienciasModal"]) {
    assert.match(html, new RegExp(`<button(?=[^>]*id="${id}")(?=[^>]*class="[^"]*modal-fechar-xp")[^>]*>`), `fechamento de ${id} deve usar o padrão compartilhado`);
  }
  assert.match(html, /id="descansoCurtoPrevia"[^>]*aria-live="polite"/);
  assert.doesNotMatch(js.slice(js.indexOf("function descansoCurto()"), js.indexOf("function verificarStatusMorte()")), /\bprompt\s*\(/);
  assert.match(js, /pendente\.resultadosDados\.length >= pendente\.estado\.restantes/);
  assert.match(js, /function lerResultadoManualDescansoCurto\(/);
  assert.match(js, /function usarDadoDescansoCurto\(/);
  assert.match(js, /Você já lançou Dados de Vida para este descanso\.[\s\S]*?resultados e a prévia serão descartados/);
  assert.match(js, /if \(temDadosPendentes && !window\.confirm\(/);
  assert.match(js, /atualizarHistoricoDescansoCurto\(/);
  assert.match(js, /Math\.max\(0, dado \+ estado\.modificadorConstituicao\)/);
  assert.match(js, /function atualizarHistoricoDescansoCurto\(/);
  assert.match(js, /dialogo\.addEventListener\("cancel", \(evento\) => \{[\s\S]*?evento\.preventDefault\(\);[\s\S]*?cancelarDescansoCurto\(\)/);
  assert.match(js, /if \(!dialogo\?\.open \|\| !pendente \|\| pendente\.aplicando/);
  assert.doesNotMatch(html, /id="descansoCurtoStatus"/);
  assert.match(js, /Descanso curto cancelado;\|Descanso curto aplicado:/);
});

test("fechamentos dos cabeçalhos de modal usam o controle XP compartilhado", () => {
  const files = [
    "js/modules/armas-catalogo.js",
    "js/modules/armaduras-catalogo.js",
    "js/modules/escudos-catalogo.js",
    "js/modules/outros-catalogo.js",
    "js/modules/vestimentas-catalogo.js",
    "js/modules/magias.js",
    "js/modules/municoes-catalogo.js",
  ];
  const markup = files.map(read).join("\n");
  assert.match(markup, /class="magia-modal-botao modal-fechar-xp" data-acao="fechar" aria-label="Fechar janela">×<\/button>/);
  assert.match(markup, /className="magia-modal-botao modal-fechar-xp"; close\.setAttribute\("aria-label","Fechar janela"\); close\.textContent="×"/);
  assert.doesNotMatch(markup, /data-acao="fechar">Fechar<\/button>/);
  assert.match(markup, /id="magiaModalFechar" aria-label="Fechar magia">×<\/button>/);
  assert.match(markup, /id="talentoModalFechar" aria-label="Fechar talento">×<\/button>/);
});

test("tipo de dano aparece apenas no modo de dano do modal de vida", () => {
  const html = read("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const js = read("js/modules/combate.js");
  assert.match(html, /id="modalDanoTipoContainer" class="modal-dano-tipo" hidden/);
  assert.match(js, /if \(tipoDanoContainer\) tipoDanoContainer\.hidden = !ehDano/);
});

test("notificações importantes usam apresentação flutuante fora da ficha", () => {
  const storage = read("js/core/storage.js");
  const backup = read("js/core/backup-local.js");
  const css = read("css/base.css");
  assert.match(storage, /function notificarFichaFlutuante\(/);
  assert.match(storage, /window\.notificarFichaFlutuante = notificarFichaFlutuante/);
  assert.match(storage, /position:\s*fixed/);
  assert.match(css, /\.ficha-notificacao-flutuante\s*\{[^}]*position:\s*fixed/);
  assert.match(backup, /if \(erro && mensagem\) window\.notificarFichaFlutuante/);
});

test("modal padrão cobre as camadas das abas e dos modificadores da ficha", () => {
  const css = read("css/base.css");
  const regra = css.match(/\.modal-overlay-base\s*\{([^}]*)\}/);
  assert.ok(regra, "a camada padrão dos modais deve existir");
  assert.match(regra[1], /z-index:\s*13000\s*;/);
  assert.match(css, /\.tabs\s*\{[^}]*z-index:\s*2\s*;/);
  assert.match(css, /\.modificador-orbe\s*\{[^}]*z-index:\s*1\s*;/);
});

test("Dados de Vida e Descanso ficam em duas colunas com título e botões agrupados", () => {
  const html = read("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const css = read("css/base.css");
  const js = read("js/modules/combate.js");
  const trecho = html.slice(html.indexOf('<div class="dados-vida-container">'), html.indexOf('<div class="caixa-salvaguarda">', html.indexOf('<div class="dados-vida-container">')));
  assert.match(trecho, /<div class="dados-vida">/);
  assert.match(trecho, /<div class="descanso-acoes">[\s\S]*?DESCANSO[\s\S]*?CURTO[\s\S]*?LONGO[\s\S]*?<\/div>/);
  assert.equal((trecho.match(/class="descanso-longo-botao"/g) || []).length, 2);
  assert.match(css, /\.dados-vida-container\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.dados-vida-container\s*\{[^}]*align-items:\s*stretch/);
  assert.match(css, /\.dados-vida-container \.dados-vida\s*\{[^}]*align-items:\s*stretch/);
  assert.match(css, /\.dados-vida-container \.dv-container-principal\s*\{[^}]*height:\s*54px/);
  assert.match(css, /\.descanso-acoes\s*\{[^}]*justify-items:\s*center/);
  assert.match(css, /\.descanso-acoes > \.campo-titulo\s*\{[^}]*text-align:\s*center/);
  assert.match(css, /\.descanso-acoes-botoes\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.descanso-acoes \.descanso-longo-botao\s*\{[^}]*text-transform:\s*uppercase/);
  assert.match(css, /@media \(max-width:\s*520px\)[\s\S]*?#descansoCurtoDialogo/);
  assert.match(css, /#descansoCurtoDialogo::backdrop\s*\{[^}]*var\(--modal-overlay-bg\)/);
  assert.match(html, /class="dado-modal-campo dado-modal-campo-com-dado dado-modal-grupo-dado"[\s\S]*?id="descansoCurtoRolar"[\s\S]*?id="descansoCurtoResultadosManuais"/);
  assert.match(html, /class="dado-modal-historico ataque-modal-historico"/);
  assert.match(js, /formula\.textContent = `1d\$\{estado\.faces\}`/);
  assert.match(css, /#descansoCurtoDialogo\s*\{[^}]*width:\s*min\(94vw,\s*500px\)/);
  assert.match(css, /\.descanso-curto-resumo\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)[^}]*text-align:\s*center/);
  assert.match(css, /\.descanso-curto-total-rolagem\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.descanso-curto-conta\s*\{[^}]*font-size:\s*\.72em/);
  assert.match(css, /\.descanso-curto-etiqueta\s*\{[^}]*font-size:\s*13px[^}]*font-weight:\s*700/);
  assert.match(css, /\.descanso-curto-usar-linha\s*\{[^}]*justify-content:\s*center/);
  assert.match(css, /\.descanso-curto-info:hover[\s\S]*\.descanso-curto-info:focus-visible/);
  assert.match(js, /info\?\.addEventListener\("click"/);
  assert.match(js, /info\?\.getAttribute\("aria-expanded"\) === "true"/);
  assert.match(js, /descansoCurtoInfo"\)\?\.setAttribute\("aria-expanded", "false"\)/);
});

test("Recursos do turno aparecem em uma linha na faixa Turno e movimento fica fora do escopo visual", () => {
  const html = read("ficha/Ficha_DnD_-_Tatagiba_1.0.html");
  const combate = read("css/combate-2.0.css");
  const layout = read("js/modules/combate-layout-v2.js");
  const js = read("js/modules/combate.js");
  for (const [id, label] of [["combateAcaoSaldo", "Ação"], ["combateAcaoBonusSaldo", "Ação bônus"], ["combateReacaoSaldo", "Reação"]]) {
    assert.match(html, new RegExp(`<span[^>]*id="${id}"[^>]*>${label}\\s*<strong>1/1</strong>`));
  }
  assert.match(html, /id="btnEditarRecursosTurno"[^>]*aria-label="Editar recursos do turno"[^>]*>✎<\/button>/);
  assert.match(html, /id="combateAtaquesRestantesAcao"[^>]*aria-live="polite"[^>]*hidden/);
  assert.match(html, /id="modalAtaqueGatilhoReacaoCampo"[^>]*for="modalAtaqueGatilhoReacao"[^>]*hidden/);
  assert.match(html, /id="modalAtaqueGatilhoReacao" type="text" maxlength="180"/);
  assert.match(html, /<dialog id="editarRecursosTurnoDialogo"[^>]*aria-labelledby="editarRecursosTurnoTitulo"/);
  for (const id of ["limiteAcaoTurno", "limiteAcaoBonusTurno", "limiteReacaoTurno", "limiteAtaquesPorAcaoTurno", "ajusteAcaoTurno", "ajusteAcaoBonusTurno", "ajusteReacaoTurno", "ajusteAtaquesPorAcaoTurno"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /onclick="salvarConfiguracaoRecursosTurno\(\)"/);
  assert.match(html, /onclick="cancelarEditorRecursosTurno\(\)"/);
  assert.doesNotMatch(html, /id="combateMovimentoGasto"|id="combateMovimentoResumo"|id="btnConsumirMovimentoTurno"/);
  assert.match(layout, /turnStatus\.append\(criar\("span", "combat-v2-eyebrow", "TURNO"\)\)/);
  assert.match(layout, /if \(turnResources\) turnStatus\.append\(turnResources\)/);
  assert.match(combate, /\.combat-v2-turn-resource-line\s*\{[^}]*display:\s*flex/);
  assert.match(combate, /@media \(max-width:\s*480px\)[\s\S]*?\.combat-v2-turn-resource-line/);
  assert.match(js, /combateAcaoSaldo/);
  assert.match(js, /function tipoAcaoAtaqueDisponivel\(tipoAcao\)/);
  assert.match(js, /ataqueQualificadorDuasArmas\) return false/);
  assert.match(js, /Descreva o gatilho que permite esta reação/);
  assert.match(js, /Gatilho: \$\{gatilhoReacao\}/);
  assert.match(js, /bloco\?\.classList\.toggle\("oculto-combate", !estadoCombateIniciativa\.ativo\)/);
});
