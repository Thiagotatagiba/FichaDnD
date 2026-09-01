// Diario de aventura da aba Historia.
let eventosDiarioAventura = [];
let indiceEventoDiarioAberto = null;
let salvarDiarioOrigemAnotacoes = false;

function gerarIdDiarioAventura() {
  if (typeof gerarId === "function") return gerarId();
  return `diario_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizarEventosDiarioAventura(eventos) {
  if (!Array.isArray(eventos)) return [];

  return eventos
    .filter((evento) => evento && typeof evento === "object")
    .map((evento, indice) => ({
      id: String(evento.id || gerarIdDiarioAventura()),
      titulo: String(evento.titulo || "").trim(),
      texto: String(evento.texto || ""),
      criadoEm: Number.isFinite(Number(evento.criadoEm))
        ? Number(evento.criadoEm)
        : indice,
    }))
    .filter((evento) => evento.titulo || evento.texto);
}

function ordenarEventosDiarioAventura(eventos) {
  return eventos
    .map((evento, indiceOriginal) => ({ evento, indiceOriginal }))
    .sort((a, b) => (b.evento.criadoEm || 0) - (a.evento.criadoEm || 0));
}

function obterEventosDiarioAventuraParaSalvar() {
  return normalizarEventosDiarioAventura(eventosDiarioAventura);
}

function renderizarDiarioAventura() {
  const lista = document.getElementById("historiaDiarioLista");
  if (!lista) return;

  lista.innerHTML = "";

  if (!eventosDiarioAventura.length) {
    const vazio = document.createElement("div");
    vazio.className = "historia-diario-vazio";
    vazio.textContent = "Nenhum evento registrado.";
    lista.appendChild(vazio);
    return;
  }

  ordenarEventosDiarioAventura(eventosDiarioAventura).forEach(
    ({ evento, indiceOriginal }) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "historia-diario-evento";
      item.addEventListener("click", () =>
        abrirModalDiarioAventura(indiceOriginal),
      );

      const titulo = document.createElement("strong");
      titulo.textContent = evento.titulo || `Evento ${indiceOriginal + 1}`;

      item.appendChild(titulo);
      lista.appendChild(item);
    },
  );
}

function carregarDiarioAventura(eventos) {
  eventosDiarioAventura = normalizarEventosDiarioAventura(eventos);
  indiceEventoDiarioAberto = null;
  renderizarDiarioAventura();
}

function obterModalDiarioAventura() {
  return document.getElementById("historiaDiarioModalOverlay");
}

function preencherModalDiarioAventura(evento = {}) {
  const overlay = obterModalDiarioAventura();
  if (!overlay) return;

  const campoTitulo = overlay.querySelector('[data-diario-campo="titulo"]');
  const campoTexto = overlay.querySelector('[data-diario-campo="texto"]');
  const botaoRemover = overlay.querySelector(".historia-diario-botao-perigo");

  if (campoTitulo) campoTitulo.value = evento.titulo || "";
  if (campoTexto) campoTexto.value = evento.texto || "";
  if (botaoRemover) {
    botaoRemover.hidden = indiceEventoDiarioAberto === null;
  }
}

function abrirModalDiarioAventura(indice = null) {
  const overlay = obterModalDiarioAventura();
  if (!overlay) return;
  salvarDiarioOrigemAnotacoes = false;

  const indiceNumerico = Number.isInteger(indice) ? indice : null;
  indiceEventoDiarioAberto =
    indiceNumerico !== null && eventosDiarioAventura[indiceNumerico]
      ? indiceNumerico
      : null;

  preencherModalDiarioAventura(
    indiceEventoDiarioAberto === null
      ? {}
      : eventosDiarioAventura[indiceEventoDiarioAberto],
  );

  overlay.classList.add("ativo");
  overlay.style.display = "flex";
  overlay.querySelector('[data-diario-campo="titulo"]')?.focus();
}

function salvarAnotacoesNoDiario() {
  const campoAnotacoes = document.getElementById("anotacoes");
  const textoAnotacoes = String(campoAnotacoes?.value || "").trim();

  if (!textoAnotacoes) {
    campoAnotacoes?.focus();
    return;
  }

  abrirModalDiarioAventura();

  const overlay = obterModalDiarioAventura();
  if (!overlay) return;

  const campoTexto = overlay.querySelector('[data-diario-campo="texto"]');
  if (campoTexto) campoTexto.value = textoAnotacoes;

  salvarDiarioOrigemAnotacoes = true;
  overlay.querySelector('[data-diario-campo="titulo"]')?.focus();
}

function fecharModalDiarioAventura() {
  const overlay = obterModalDiarioAventura();
  if (!overlay) return;

  overlay.classList.remove("ativo");
  overlay.style.display = "";
  indiceEventoDiarioAberto = null;
  salvarDiarioOrigemAnotacoes = false;
}

function salvarEventoDiarioAventura() {
  const overlay = obterModalDiarioAventura();
  if (!overlay) return;

  const campoTitulo = overlay.querySelector('[data-diario-campo="titulo"]');
  const campoTexto = overlay.querySelector('[data-diario-campo="texto"]');
  const titulo = String(campoTitulo?.value || "").trim();
  const texto = String(campoTexto?.value || "").trim();

  if (!titulo && !texto) {
    campoTitulo?.focus();
    return;
  }

  const evento = {
    id:
      indiceEventoDiarioAberto === null
        ? gerarIdDiarioAventura()
        : eventosDiarioAventura[indiceEventoDiarioAberto]?.id ||
          gerarIdDiarioAventura(),
    titulo: titulo || `Evento ${eventosDiarioAventura.length + 1}`,
    texto,
    criadoEm:
      indiceEventoDiarioAberto === null
        ? Date.now()
        : eventosDiarioAventura[indiceEventoDiarioAberto]?.criadoEm ||
          Date.now(),
  };

  if (indiceEventoDiarioAberto === null) {
    eventosDiarioAventura.unshift(evento);
  } else {
    eventosDiarioAventura[indiceEventoDiarioAberto] = evento;
  }

  if (salvarDiarioOrigemAnotacoes) {
    const campoAnotacoes = document.getElementById("anotacoes");
    if (campoAnotacoes) campoAnotacoes.value = "";
  }

  renderizarDiarioAventura();
  fecharModalDiarioAventura();
}

function removerEventoDiarioAventura() {
  if (indiceEventoDiarioAberto === null) return;

  eventosDiarioAventura.splice(indiceEventoDiarioAberto, 1);
  renderizarDiarioAventura();
  fecharModalDiarioAventura();
}

function configurarDiarioAventura() {
  renderizarDiarioAventura();

  const overlay = obterModalDiarioAventura();
  if (!overlay || overlay.dataset.configurado === "true") return;

  overlay.dataset.configurado = "true";
  overlay.addEventListener("click", (evento) => {
    if (evento.target === overlay) fecharModalDiarioAventura();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape") return;
    if (!overlay.classList.contains("ativo")) return;
    fecharModalDiarioAventura();
  });
}

document.addEventListener("DOMContentLoaded", configurarDiarioAventura);

window.abrirModalDiarioAventura = abrirModalDiarioAventura;
window.fecharModalDiarioAventura = fecharModalDiarioAventura;
window.salvarEventoDiarioAventura = salvarEventoDiarioAventura;
window.removerEventoDiarioAventura = removerEventoDiarioAventura;
window.salvarAnotacoesNoDiario = salvarAnotacoesNoDiario;
window.carregarDiarioAventura = carregarDiarioAventura;
window.obterEventosDiarioAventuraParaSalvar =
  obterEventosDiarioAventuraParaSalvar;
