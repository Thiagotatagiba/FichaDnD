// Refatorar .ataque-topo layout
document.addEventListener("DOMContentLoaded", function () {
  const containers = document.querySelectorAll(".ataque-topo");
  containers.forEach((container) => {
    const escudo = container.querySelector(".ataque-mini-escudo");
    const pvBloco = container.querySelector(".ataque-pv-bloco");
    const statusLinha = container.querySelector(".ataque-status-linha");
    const allAcoes = container.querySelectorAll(".ataque-acoes, .linha-acoes");
    const acoes = allAcoes[0] || null;

    if (!escudo || !pvBloco || !statusLinha) {
      console.warn("Missing elements in .ataque-topo:", container);
      return;
    }

    if (allAcoes.length > 1) {
      allAcoes.forEach((extra, i) => {
        if (i > 0 && extra.parentNode) extra.parentNode.removeChild(extra);
      });
    }

    const linhaStatus = document.createElement("div");
    linhaStatus.className = "linha-status";
    statusLinha.remove();
    linhaStatus.appendChild(statusLinha);
    container.insertBefore(linhaStatus, container.firstChild);

    const statusKids = Array.from(
      linhaStatus.querySelectorAll(".ataque-status-caixa"),
    );
    if (statusKids.length > 0) {
      linhaStatus.replaceChildren();
      ["posicao", "condicao", "rodada"].forEach((className) => {
        const kid = statusKids.find((el) => el.classList.contains(className));
        if (kid) linhaStatus.appendChild(kid);
      });
    }

    const linhaPv = document.createElement("div");
    linhaPv.className = "linha-pv-alinhada";
    escudo.remove();
    pvBloco.remove();
    linhaPv.appendChild(escudo);
    linhaPv.appendChild(pvBloco);
    container.appendChild(linhaPv);

    if (acoes && acoes.parentNode) {
      const linhaAcoes = document.createElement("div");
      linhaAcoes.className = "linha-acoes";
      acoes.remove();
      linhaAcoes.appendChild(acoes);
      container.appendChild(linhaAcoes);
    }

    Array.from(container.children).forEach((child) => {
      if (
        !["linha-status", "linha-pv-alinhada", "linha-acoes"].includes(
          child.className,
        )
      ) {
        child.remove();
      }
    });

    console.log("✅ .ataque-topo reorganized (3 rows exact):", {
      children: container.children.length,
      status: !!container.querySelector(".linha-status"),
      pvAligned: !!container.querySelector(
        ".linha-pv-alinhada .ataque-mini-escudo",
      ),
      acoes: !!container.querySelector(".linha-acoes"),
    });
  });
});
