const TEMA_PADRAO = "tema-padrao";
const TEMAS_INTERFACE = [TEMA_PADRAO, "tema-classico", "tema-escuro"];

function normalizarTema(tema) {
  return TEMAS_INTERFACE.includes(tema) ? tema : TEMA_PADRAO;
}

function obterTemaAtual() {
  const temaAtual = TEMAS_INTERFACE.find((tema) =>
    document.body?.classList.contains(tema),
  );

  return normalizarTema(temaAtual);
}

function atualizarSeletorTema(tema) {
  const temaNormalizado = normalizarTema(tema);

  document
    .querySelectorAll("[data-tema]")
    .forEach((botao) => {
      const selecionado = botao.dataset.tema === temaNormalizado;
      botao.classList.toggle("selecionado", selecionado);
      botao.setAttribute("aria-pressed", String(selecionado));
    });
}

function aplicarTema(tema) {
  const temaNormalizado = normalizarTema(tema);

  document.body.classList.remove(...TEMAS_INTERFACE);
  document.body.classList.add(temaNormalizado);
  atualizarSeletorTema(temaNormalizado);
}

function inicializarTemaInterface() {
  aplicarTema(obterTemaAtual());

  document
    .querySelectorAll("[data-tema]")
    .forEach((botao) => {
      botao.addEventListener("click", () => {
        aplicarTema(botao.dataset.tema);
      });
    });
}

document.addEventListener("DOMContentLoaded", inicializarTemaInterface);
