const FERRAMENTAS_CATALOGO_URL =
  "../assets/data/itens/outros/ferramentas-kits.json?v=ferramentas-proficiencias-1";

function filtrarFerramentasComProficiencia(itens) {
  if (!Array.isArray(itens)) return [];
  return itens.filter(
    (item) =>
      item &&
      typeof item.nome === "string" &&
      item.nome.trim() &&
      typeof item.proficienciaId === "string" &&
      item.proficienciaId.trim(),
  );
}

function normalizarChaveFerramenta(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function separarProficienciasFerramentas(valor) {
  const candidatos = Array.isArray(valor)
    ? valor
    : String(valor ?? "").split(/[\n,]+/);
  const proficiencias = [];
  const vistas = new Set();

  candidatos.forEach((candidato) => {
    const proficiencia = String(candidato ?? "").trim();
    const chave = normalizarChaveFerramenta(proficiencia);
    if (!proficiencia || !chave || vistas.has(chave)) return;
    vistas.add(chave);
    proficiencias.push(proficiencia);
  });

  return proficiencias;
}

function iniciarSeletorProficienciasFerramentas() {
  const campo = document.getElementById("proficienciaFerramentas");
  const tags = document.getElementById("ferramentasTags");
  const botaoAbrir = document.getElementById(
    "btnAdicionarProficienciaFerramenta",
  );
  const modal = document.getElementById("ferramentasModal");
  const busca = document.getElementById("ferramentasBusca");
  const status = document.getElementById("ferramentasStatus");
  const opcoes = document.getElementById("ferramentasOpcoes");
  const outrosCampo = document.getElementById("ferramentasPersonalizadas");
  const botaoConfirmar = document.getElementById("btnConfirmarFerramentas");
  const botaoCancelar = document.getElementById("btnCancelarFerramentas");
  const botaoFechar = document.getElementById("btnFecharFerramentasModal");

  if (
    !campo ||
    !tags ||
    !botaoAbrir ||
    !modal ||
    !busca ||
    !status ||
    !opcoes ||
    !outrosCampo ||
    !botaoConfirmar ||
    !botaoCancelar ||
    !botaoFechar
  ) {
    return;
  }

  let catalogo = [];
  let carregamentoCatalogo = null;
  let elementoFocoAnterior = null;
  let idsSelecionados = new Set();

  function encontrarItemPorToken(token) {
    const chave = normalizarChaveFerramenta(token);
    if (!chave) return null;
    return catalogo.find((item) =>
      [item.id, item.proficienciaId, item.nome, item.nomeOriginal].some(
        (valor) => normalizarChaveFerramenta(valor) === chave,
      ),
    );
  }

  function obterEstadoSalvo() {
    const ids = new Set();
    const personalizadas = [];
    separarProficienciasFerramentas(campo.value).forEach((token) => {
      const item = encontrarItemPorToken(token);
      if (item) ids.add(item.id);
      else personalizadas.push(token);
    });
    return { ids, personalizadas };
  }

  function renderizarTags() {
    const proficiencias = separarProficienciasFerramentas(campo.value).map(
      (token) => encontrarItemPorToken(token)?.nome || token,
    );
    tags.replaceChildren();

    if (proficiencias.length === 0) {
      const vazio = document.createElement("span");
      vazio.className = "ferramentas-vazio";
      vazio.textContent = "Nenhuma proficiência selecionada";
      tags.append(vazio);
      return;
    }

    const vistos = new Set();
    proficiencias.forEach((proficiencia) => {
      const chave = normalizarChaveFerramenta(proficiencia);
      if (vistos.has(chave)) return;
      vistos.add(chave);
      const tag = document.createElement("span");
      tag.className = "ferramentas-tag";
      tag.textContent = proficiencia;
      tags.append(tag);
    });
  }

  async function carregarCatalogo() {
    if (!carregamentoCatalogo) {
      carregamentoCatalogo = fetch(FERRAMENTAS_CATALOGO_URL)
        .then((resposta) => {
          if (!resposta.ok)
            throw new Error("Catálogo de ferramentas indisponível.");
          return resposta.json();
        })
        .then((dados) => {
          if (
            dados.versaoSchema !== 1 ||
            dados.sistema !== "dnd5e-2014" ||
            !Array.isArray(dados.itens)
          ) {
            throw new Error("Catálogo de ferramentas inválido.");
          }
          catalogo = filtrarFerramentasComProficiencia(dados.itens);
          renderizarTags();
          return catalogo;
        })
        .catch((erro) => {
          carregamentoCatalogo = null;
          throw erro;
        });
    }
    return carregamentoCatalogo;
  }

  function renderizarOpcoes() {
    const consulta = normalizarChaveFerramenta(busca.value);
    const resultados = catalogo.filter((item) =>
      normalizarChaveFerramenta(
        [item.nome, item.nomeOriginal, item.proficienciaId, item.grupo].join(
          " ",
        ),
      ).includes(consulta),
    );
    opcoes.replaceChildren();
    status.textContent = consulta
      ? `${resultados.length} resultado${resultados.length === 1 ? "" : "s"}`
      : `${resultados.length} ferramentas disponíveis`;

    if (resultados.length === 0) {
      const vazio = document.createElement("span");
      vazio.className = "ferramentas-vazio";
      vazio.textContent = "Nenhuma ferramenta encontrada";
      opcoes.append(vazio);
      return;
    }

    resultados.forEach((item, indice) => {
      const label = document.createElement("label");
      label.className = "ferramentas-opcao";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `ferramentaProficiencia${indice}`;
      checkbox.value = item.id;
      checkbox.checked = idsSelecionados.has(item.id);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) idsSelecionados.add(item.id);
        else idsSelecionados.delete(item.id);
      });

      const nome = document.createElement("span");
      nome.className = "ferramentas-opcao-nome";
      nome.append(document.createTextNode(item.nome));
      if (item.nomeOriginal) {
        const original = document.createElement("span");
        original.className = "ferramentas-opcao-original";
        original.textContent = item.nomeOriginal;
        nome.append(original);
      }
      label.htmlFor = checkbox.id;
      label.append(checkbox, nome);
      opcoes.append(label);
    });
  }

  async function abrirModal() {
    elementoFocoAnterior = document.activeElement;
    busca.value = "";
    opcoes.replaceChildren();
    status.textContent = "Carregando ferramentas...";
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");

    try {
      await carregarCatalogo();
      if (modal.getAttribute("aria-hidden") !== "false") return;
      const estadoSalvo = obterEstadoSalvo();
      idsSelecionados = estadoSalvo.ids;
      outrosCampo.value = estadoSalvo.personalizadas.join(", ");
      renderizarOpcoes();
      busca.focus();
    } catch (erro) {
      if (modal.getAttribute("aria-hidden") !== "false") return;
      status.textContent =
        "Não foi possível carregar o catálogo. Feche e tente novamente.";
      console.error(erro);
    }
  }

  function fecharModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    if (elementoFocoAnterior?.isConnected) elementoFocoAnterior.focus();
  }

  function confirmarSelecao() {
    const idsOrdenados = catalogo
      .filter((item) => idsSelecionados.has(item.id))
      .map((item) => item.id);
    campo.value = separarProficienciasFerramentas([
      ...idsOrdenados,
      ...separarProficienciasFerramentas(outrosCampo.value),
    ]).join(", ");
    campo.dispatchEvent(new Event("input", { bubbles: true }));
    campo.dispatchEvent(new Event("change", { bubbles: true }));
    renderizarTags();
    fecharModal();
  }

  botaoAbrir.addEventListener("click", abrirModal);
  botaoConfirmar.addEventListener("click", confirmarSelecao);
  botaoCancelar.addEventListener("click", fecharModal);
  botaoFechar.addEventListener("click", fecharModal);
  busca.addEventListener("input", renderizarOpcoes);
  campo.addEventListener("input", renderizarTags);
  campo.addEventListener("change", renderizarTags);
  modal.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      evento.preventDefault();
      fecharModal();
      return;
    }
    if (evento.key !== "Tab") return;

    const focaveis = Array.from(
      modal.querySelectorAll("button:not([disabled]), input:not([disabled])"),
    ).filter((elemento) => elemento.getClientRects().length > 0);
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (!primeiro || !ultimo) return;

    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  });

  window.__atualizarTagsFerramentas = renderizarTags;
  renderizarTags();
  carregarCatalogo().catch(() => {});
}

if (typeof document !== "undefined") iniciarSeletorProficienciasFerramentas();
