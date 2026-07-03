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
    .querySelectorAll('input[name="temaFicha"]')
    .forEach((radio) => {
      const selecionado = radio.value === temaNormalizado;
      radio.checked = selecionado;
      radio.closest(".tema-opcao")?.classList.toggle("selecionado", selecionado);
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
    .querySelectorAll('input[name="temaFicha"]')
    .forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) aplicarTema(radio.value);
      });
    });
}

document.addEventListener("DOMContentLoaded", inicializarTemaInterface);

