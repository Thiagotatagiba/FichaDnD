// Refatorar .ataque-topo layout
document.addEventListener('DOMContentLoaded', function() {
  const containers = document.querySelectorAll('.ataque-topo');
  containers.forEach(container => {
    // Collect existing elements (first matches only) - NO clones
    const escudo = container.querySelector('.ataque-mini-escudo');
    const pvBloco = container.querySelector('.ataque-pv-bloco');
    const statusLinha = container.querySelector('.ataque-status-linha');
    let acoes = container.querySelector('.ataque-acoes, .linha-acoes'); // First one only

    if (!escudo || !pvBloco || !statusLinha) {
      console.warn('Missing elements in .ataque-topo:', container);
      return;
    }

    // CRITICAL: Dedupe - remove ALL other acoes elements (keep first)
    const allAcoes = container.querySelectorAll('.ataque-acoes, .linha-acoes');
    allAcoes.forEach((extra, i) => {
      if (i > 0) extra.remove(); // Keep first only
    });
    acoes = allAcoes[0] || null;

    // Step 1: Row1 - wrap statusLinha (move, no clone)
    const linhaStatus = document.createElement('div');
    linhaStatus.className = 'linha-status';
    container.removeChild(statusLinha);
    linhaStatus.appendChild(statusLinha);
    container.insertBefore(linhaStatus, container.firstChild);

    // Reorder status internals: POS → COND → ROD (safe inner reorder)
    const statusKids = Array.from(statusLinha.querySelectorAll('.ataque-status-caixa'));
    if (statusKids.length >= 3) {
      statusLinha.innerHTML = ''; // Safe: only children of statusLinha
      ['posicao', 'condicao', 'rodada'].forEach(className => {
        const kid = statusKids.find(el => el.classList.contains(className));
        if (kid) statusLinha.appendChild(kid);
      });
    }

    // Step 2: Row2 - CRITICAL aligned wrapper (move escudo + pvBloco)
    const linhaPv = document.createElement('div');
    linhaPv.className = 'linha-pv-alinhada';
    container.removeChild(escudo);
    container.removeChild(pvBloco);
    linhaPv.appendChild(escudo);
    linhaPv.appendChild(pvBloco);
    container.appendChild(linhaPv);

    // Step 3: Row3 - wrap single acoes
    if (acoes) {
      const linhaAcoes = document.createElement('div');
      linhaAcoes.className = 'linha-acoes';
      container.removeChild(acoes);
      linhaAcoes.appendChild(acoes);
      container.appendChild(linhaAcoes);
    }

    // Final cleanup: remove any remaining loose elements
    Array.from(container.children).forEach(child => {
      if (!['linha-status', 'linha-pv-alinhada', 'linha-acoes'].includes(child.className)) {
        child.remove();
      }
    });

    console.log('✅ .ataque-topo reorganized (3 rows exact):', {
      children: container.children.length,
      status: !!container.querySelector('.linha-status'),
      pvAligned: !!container.querySelector('.linha-pv-alinhada .ataque-mini-escudo'),
      acoes: !!container.querySelector('.linha-acoes')
    });
  });
});
