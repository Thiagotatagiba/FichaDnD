const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.join(__dirname, '..', 'ficha', 'Codigos testes', 'Combate 2.0 - referencia fiel.html');
const html = fs.readFileSync(htmlPath, 'utf8');

test('protótipo mostra cinco corações de PV e um coração temporário, sem barra horizontal', () => {
  const hpCard = html.match(/<div class="hp-hearts pv-hearts"[\s\S]*?<\/div><div class="hp-foot">/)?.[0];
  assert.ok(hpCard, 'cartão de PV deve existir');
  assert.equal((hpCard.match(/class="pv-heart"/g) || []).length, 5);
  assert.match(hpCard, /id="combatPvTempHeart"/);
  assert.doesNotMatch(hpCard, /id="hpTrack"|id="hpBar"/);
  assert.match(html, /id="damage"/);
  assert.match(html, /id="heal"/);
  assert.match(html, /id="temp"/);
});

test('corações representam PV atuais, máximos e temporários sem substituir dados da ficha', () => {
  assert.match(html, /function renderHealthHearts\(hp = \{\}\)/);
  assert.match(html, /Math\.min\(current, maximum\)/);
  assert.match(html, /Math\.max\(0, current - maximum\) \/ temporary/);
  assert.match(html, /renderHealthHearts\(hp\)/);
  assert.match(html, /atualizarCoracoesVida\(\).*?js\/core\/events\.js/s);
});

test('CA é centralizada no escudo e seletor compacto permanece no cartão de defesa', () => {
  const defense = html.match(/<div class="stat center defense-card">([\s\S]*?)<\/div>\s*<div class="stat"><div class="stat-label"><span>Iniciativa/)?.[1];
  assert.ok(defense, 'cartão de defesa deve existir');
  assert.match(defense, /class="ac-shield-display"/);
  assert.match(defense, /id="acValue"/);
  assert.match(defense, /class="ac-layout">[\s\S]*class="ac-shield-display"[\s\S]*class="ac-details"><small id="acDetail"[\s\S]*id="armor"/);
  assert.match(defense, /id="armor"/);
  assert.match(defense, /aria-label="Armadura vestida"/);
  assert.doesNotMatch(defense, /armorName|Armadura equipada|Selecionar armadura/);
  assert.doesNotMatch(html, /armor-picker|armorName/);
  assert.match(html, /optionList\(\$\('#armor'\), data\?\.armadura\?\.opcoes, data\?\.armadura\?\.id/);
  assert.match(html, /type: 'equipamento:armadura'/);
  assert.doesNotMatch(defense, /M50 17v20|M50 77v14|<circle cx="50" cy="48"/);
});

test('renderização da CA permanece somente uma projeção da ficha oficial', () => {
  assert.match(html, /text\('#acValue', data\?\.ca\?\.total\)/);
  assert.match(html, /optionList\(\$\('#armor'\), data\?\.armadura\?\.opcoes, data\?\.armadura\?\.id/);
  assert.doesNotMatch(html, /function (?:calcular|recalcular)CA\b|data\.ca\.total\s*=/);
});

test('mãos livres usam o SVG dedicado com fallback e sem alterar o ícone de armas', () => {
  assert.match(html, /"interface":\{"hands":\{"empty":"assets\/icons\/interface\/maos\/mao-vazia\.svg"\}\}/);
  assert.match(html, /function showEmptyHandIcon\(container\)/);
  assert.match(html, /new URL\(`\.\.\/\.\.\/\$\{path\}`, document\.baseURI\)/);
  assert.match(html, /image\.addEventListener\('error', \(\) => container\.replaceChildren\(svgIcon\('free'\)\)/);
  assert.match(html, /else if \(\(main\.icone \|\| 'free'\) === 'free'\) showEmptyHandIcon\(\$\('#mainIcon'\)\)/);
  assert.match(html, /if \(offIcon === 'free'\) showEmptyHandIcon\(\$\('#offIcon'\)\)/);
  assert.match(html, /img\.empty-hand-icon \{[^}]*object-fit:\s*contain[^}]*mix-blend-mode:\s*multiply/);
  assert.match(html, /#offIcon img\.empty-hand-icon \{ transform:scaleX\(-1\); \}/);
  assert.match(html, /image\.alt = ''; image\.setAttribute\('aria-hidden', 'true'\)/);
});

test('ataque desarmado e atalhos da referência aparecem sem bônus ou dano demonstrativos', () => {
  assert.match(html, /const quickActionDefaults = \[[\s\S]*id:'esquivar'[\s\S]*id:'desengajar'[\s\S]*id:'salvaguarda'/);
  assert.match(html, /const unarmedAttackDefault = \{[\s\S]*id:'ataque-desarmado', nome:'Ataque desarmado'[\s\S]*bônus e dano calculados pela ficha oficial/);
  assert.match(html, /if \(!hasUnarmed\) attacks\.push\(unarmedAttackDefault\)/);
  assert.match(html, /\['unarmed', 'unarmed-strike', 'ataque-desarmado'\]/);
  assert.match(html, /Array\.isArray\(data\?\.acoesRapidas\) && data\.acoesRapidas\.length \? data\.acoesRapidas : quickActionDefaults/);
  assert.doesNotMatch(html, /unarmedAttackDefault[\s\S]{0,300}\+3|unarmedAttackDefault[\s\S]{0,300}2 concussão/);
});

test('condições oferecem modal múltiplo e “Outros” recebe termos separados por vírgula', () => {
  const modal = html.match(/<dialog id="conditionDialog"[\s\S]*?<\/dialog>/)?.[0];
  assert.ok(modal, 'modal de condições deve existir');
  assert.match(html, /id="openConditionDialog"[^>]*aria-haspopup="dialog"/);
  assert.equal((modal.match(/class="condition-choice"><input type="checkbox" value=/g) || []).length, 15);
  assert.match(modal, /value="other"> Outros/);
  assert.match(modal, /id="otherConditionNames"/);
  assert.match(modal, /Separado por vírgula/);
  assert.match(modal, /id="applyConditions"[^>]*disabled/);
  assert.match(html, /type: 'condicao:adicionar'/);
  assert.match(html, /\.split\(','\)/);
});

test('concentração fica no cartão de condições e projeção ativa múltiplas tags sem persistência local', () => {
  const conditionCard = html.match(/<div class="stat condition-card">([^\r\n]*)/)?.[1];
  assert.ok(conditionCard);
  assert.match(conditionCard, /id="concentration"/);
  assert.match(conditionCard, /id="concentrationTitle"/);
  assert.match(conditionCard, /id="activeConditions"/);
  assert.match(html, /function renderActiveConditions\(data\)/);
  assert.match(html, /data\?\.condicoes\?\.ativas/);
  assert.match(html, /container\.append\(chip\)/);
  assert.match(conditionCard, /class="concentration-inline"/);
  assert.equal((html.match(/id="concentration"/g) || []).length, 1);
  assert.doesNotMatch(html, /data\.condicoes\.ativas\s*=|localStorage|indexedDB/);
});

test('painel de PV perde proporção e cartão de CA ganha largura no layout amplo', () => {
  assert.match(html, /\.stats\s*\{\s*grid-template-columns:1\.4fr 1\.2fr 1\.1fr 1\.25fr;/);
  assert.match(html, /@media \(max-width:1050px\) \{ \.stats \{ grid-template-columns:1\.15fr 1fr 1fr;/);
  assert.match(html, /\.ac-layout\s*\{[^}]*grid-template-columns:minmax\(76px,88px\) minmax\(0,1fr\)/);
  assert.match(html, /@media \(max-width:420px\) \{ \.ac-layout \{ grid-template-columns:1fr;/);
  assert.match(html, /@media \(min-width:761px\) and \(max-width:820px\) \{ \.defense-card \{ grid-column:span 2;/);
});
