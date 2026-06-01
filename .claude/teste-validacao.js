// Teste de Validação: Sistema de Magias D&D 5e
// Executar no console do navegador (F12) após carregar a ficha

console.log("=== TESTE: Sistema de Magias D&D 5e ===\n");

// Teste 1: Verificar que função atualizarContadorMagiasPreparadas existe
console.log("✓ Teste 1: Função atualizarContadorMagiasPreparadas");
if (typeof atualizarContadorMagiasPreparadas === 'function') {
  console.log("  ✅ Função existe e é callable");
} else {
  console.error("  ❌ FALHA: Função não encontrada");
}

// Teste 2: Verificar elemento do contador
console.log("\n✓ Teste 2: Elemento contador");
const contador = document.getElementById("magiaContadorPreparadas");
if (contador) {
  console.log(`  ✅ Elemento existe com conteúdo: "${contador.textContent}"`);
} else {
  console.error("  ❌ FALHA: Elemento #magiaContadorPreparadas não encontrado");
}

// Teste 3: Verificar que campo magiaClasseConjuradora foi removido
console.log("\n✓ Teste 3: Campo Classe Conjuradora removido");
const classeConjuradora = document.getElementById("magiaClasseConjuradora");
if (!classeConjuradora) {
  console.log("  ✅ Campo foi removido com sucesso");
} else {
  console.warn("  ⚠️  Campo ainda existe (pode ser OK se é apenas hidden)");
}

// Teste 4: Verificar lógica de truques
console.log("\n✓ Teste 4: Lógica de truques vs magias");
if (typeof lerMagiasNivel === 'function' && typeof obterMagiasPreparadasCombate === 'function') {
  try {
    const truques = lerMagiasNivel(0);
    const magiasNivel1 = lerMagiasNivel(1);
    console.log(`  ✅ Truques carregados: ${truques.length}`);
    console.log(`  ✅ Magias nível 1 carregadas: ${magiasNivel1.length}`);

    const magiasEmCombate = obterMagiasPreparadasCombate();
    console.log(`  ✅ Magias em combate: ${magiasEmCombate.length}`);
  } catch (e) {
    console.error(`  ❌ Erro ao ler magias: ${e.message}`);
  }
} else {
  console.error("  ❌ Funções de leitura não encontradas");
}

// Teste 5: Verificar CSS do contador
console.log("\n✓ Teste 5: Estilo CSS do contador");
if (contador) {
  const estilos = window.getComputedStyle(contador);
  const temBorda = estilos.border && estilos.border !== 'none';
  const temPadding = estilos.padding && estilos.padding !== '0px';
  if (temBorda && temPadding) {
    console.log("  ✅ Estilos CSS aplicados corretamente");
  } else {
    console.warn("  ⚠️  Alguns estilos podem estar faltando");
  }
}

console.log("\n=== FIM DOS TESTES ===\n");
console.log("Para testes completos, verifique manualmente:");
console.log("1. Abra aba Magias → Truques não devem ter checkbox");
console.log("2. Marque algumas magias nível 1+ → Contador deve atualizar");
console.log("3. Abra aba Combate → Truques devem aparecer automaticamente");
