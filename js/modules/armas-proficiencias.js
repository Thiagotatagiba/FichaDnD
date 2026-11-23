const ARMAS_PROFICIENCIA_CATALOGO_URL =
  "../assets/data/itens/armas.json?v=armas-proficiencias-1";
const ARMAS_CATEGORIAS_PROFICIENCIA = [
  {
    id: "profArmaSimples",
    modalId: "profArmaSimplesModal",
    label: "Armas simples",
  },
  {
    id: "profArmaMarciais",
    modalId: "profArmaMarciaisModal",
    label: "Armas marciais",
  },
];

function normalizarArmaProficiencia(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function separarProficienciasArmas(valor) {
  const candidatos = Array.isArray(valor)
    ? valor
    : String(valor ?? "").split(/[\n,;]+/);
  const proficiencias = [];
  const vistas = new Set();

  candidatos.forEach((candidato) => {
    const proficiencia = String(candidato ?? "").trim();
    const chave = normalizarArmaProficiencia(proficiencia);
    if (!proficiencia || !chave || vistas.has(chave)) return;
    vistas.add(chave);
    proficiencias.push(proficiencia);
  });

  return proficiencias;
}

function temProficienciaArmaIndividual(valorSalvo, armaId, nomeArma) {
  const salvas = new Set(
    separarProficienciasArmas(valorSalvo).map(normalizarArmaProficiencia),
  );
  return [armaId, nomeArma].some((valor) => {
    const chave = normalizarArmaProficiencia(valor);
    return !!chave && salvas.has(chave);
  });
}

function filtrarArmasComIdentificador(itens) {
  if (!Array.isArray(itens)) return [];
  return itens.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      item.id.trim() &&
      typeof item.nome === "string" &&
      item.nome.trim() &&
      ["simples", "marcial"].includes(item.categoriaProficiencia),
  );
}

function iniciarSeletorProficienciasArmas() {
  const campo = document.getElementById("proficienciaArmas");
  const tags = document.getElementById("armasProficienciasTags");
  const botaoAbrir = document.getElementById("btnAdicionarProficienciaArma");
  const modal = document.getElementById("armasProficienciasModal");
  const busca = document.getElementById("armasProficienciasBusca");
  const status = document.getElementById("armasProficienciasStatus");
  const opcoes = document.getElementById("armasProficienciasOpcoes");
  const outrasCampo = document.getElementById(
    "armasProficienciasPersonalizadas",
  );
  const botaoConfirmar = document.getElementById(
    "btnConfirmarArmasProficiencias",
  );
  const botaoCancelar = document.getElementById(
    "btnCancelarArmasProficiencias",
  );
  const botaoFechar = document.getElementById(
    "btnFecharArmasProficienciasModal",
  );
  const categoriasModal = ARMAS_CATEGORIAS_PROFICIENCIA.map(({ modalId }) =>
    document.getElementById(modalId),
  );

  if (
    !campo ||
    !tags ||
    !botaoAbrir ||
    !modal ||
    !busca ||
    !status ||
    !opcoes ||
    !outrasCampo ||
    !botaoConfirmar ||
    !botaoCancelar ||
    !botaoFechar ||
    categoriasModal.some((checkbox) => !checkbox)
  ) {
    return;
  }

  let catalogo = [];
  let carregamentoCatalogo = null;
  let elementoFocoAnterior = null;
  let idsSelecionados = new Set();

  function encontrarArma(token) {
    const chave = normalizarArmaProficiencia(token);
    if (!chave) return null;
    return catalogo.find((item) =>
      [item.id, item.nome, item.nomeOriginal].some(
        (valor) => normalizarArmaProficiencia(valor) === chave,
      ),
    );
  }

  function obterEstadoSalvo() {
    const ids = new Set();
    const personalizadas = [];
    separarProficienciasArmas(campo.value).forEach((token) => {
      const arma = encontrarArma(token);
      if (arma) ids.add(arma.id);
      else personalizadas.push(token);
    });
    return { ids, personalizadas };
  }

  function renderizarTags() {
    const categoriasSelecionadas = ARMAS_CATEGORIAS_PROFICIENCIA.filter(
      ({ id }) => document.getElementById(id)?.checked,
    ).map(({ label }) => label);
    const proficiencias = [
      ...categoriasSelecionadas,
      ...separarProficienciasArmas(campo.value).map(
        (token) => encontrarArma(token)?.nome || token,
      ),
    ];
    tags.replaceChildren();

    if (proficiencias.length === 0) {
      const vazio = document.createElement("span");
      vazio.className = "armas-individuais-vazio";
      vazio.textContent = "Nenhuma arma específica selecionada";
      tags.append(vazio);
      return;
    }

    proficiencias.forEach((proficiencia) => {
      const tag = document.createElement("span");
      tag.className = "armas-individuais-tag";
      tag.textContent = proficiencia;
      tags.append(tag);
    });
  }

  async function carregarCatalogo() {
    if (!carregamentoCatalogo) {
      carregamentoCatalogo = fetch(ARMAS_PROFICIENCIA_CATALOGO_URL)
        .then((resposta) => {
          if (!resposta.ok) throw new Error("Catálogo de armas indisponível.");
          return resposta.json();
        })
        .then((dados) => {
          if (
            dados.versaoSchema !== 1 ||
            dados.sistema !== "dnd5e-2014" ||
            !Array.isArray(dados.itens)
          ) {
            throw new Error("Catálogo de armas inválido.");
          }
          catalogo = filtrarArmasComIdentificador(dados.itens);
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
    const consulta = normalizarArmaProficiencia(busca.value);
    const resultados = catalogo.filter((item) =>
      normalizarArmaProficiencia(
        [
          item.nome,
          item.nomeOriginal,
          item.id,
          item.categoriaProficiencia,
          ...(item.propriedades || []),
        ].join(" "),
      ).includes(consulta),
    );
    opcoes.replaceChildren();
    status.textContent = consulta
      ? `${resultados.length} resultado${resultados.length === 1 ? "" : "s"}`
      : `${resultados.length} armas disponíveis`;

    if (resultados.length === 0) {
      const vazio = document.createElement("span");
      vazio.className = "armas-individuais-vazio";
      vazio.textContent = "Nenhuma arma encontrada";
      opcoes.append(vazio);
      return;
    }

    resultados.forEach((arma, indice) => {
      const label = document.createElement("label");
      label.className = "armas-proficiencias-opcao";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `armaProficiencia${indice}`;
      checkbox.value = arma.id;
      checkbox.checked = idsSelecionados.has(arma.id);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) idsSelecionados.add(arma.id);
        else idsSelecionados.delete(arma.id);
      });

      const imagem = document.createElement("img");
      imagem.className = "armas-proficiencias-icone";
      imagem.src = arma.icone || "";
      imagem.alt = "";
      imagem.setAttribute("aria-hidden", "true");

      const nome = document.createElement("span");
      nome.className = "armas-proficiencias-nome";
      nome.append(document.createTextNode(arma.nome));
      if (arma.nomeOriginal) {
        const original = document.createElement("span");
        original.className = "armas-proficiencias-original";
        original.textContent = arma.nomeOriginal;
        nome.append(original);
      }

      label.htmlFor = checkbox.id;
      label.append(checkbox, imagem, nome);
      opcoes.append(label);
    });
  }

  async function abrirModal() {
    elementoFocoAnterior = document.activeElement;
    ARMAS_CATEGORIAS_PROFICIENCIA.forEach(({ id, modalId }) => {
      const estadoSalvo = document.getElementById(id)?.checked;
      const checkboxModal = document.getElementById(modalId);
      if (checkboxModal) checkboxModal.checked = !!estadoSalvo;
    });
    busca.value = "";
    opcoes.replaceChildren();
    status.textContent = "Carregando armas...";
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");

    try {
      await carregarCatalogo();
      if (modal.getAttribute("aria-hidden") !== "false") return;
      const estadoSalvo = obterEstadoSalvo();
      idsSelecionados = estadoSalvo.ids;
      outrasCampo.value = estadoSalvo.personalizadas.join(", ");
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
    ARMAS_CATEGORIAS_PROFICIENCIA.forEach(({ id, modalId }) => {
      const campoPersistido = document.getElementById(id);
      const checkboxModal = document.getElementById(modalId);
      if (!campoPersistido || !checkboxModal) return;
      if (campoPersistido.checked === checkboxModal.checked) return;
      campoPersistido.checked = checkboxModal.checked;
      campoPersistido.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const idsOrdenados = catalogo
      .filter((arma) => idsSelecionados.has(arma.id))
      .map((arma) => arma.id);
    campo.value = separarProficienciasArmas([
      ...idsOrdenados,
      ...separarProficienciasArmas(outrasCampo.value),
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

  window.__atualizarTagsArmasEspecificas = () => {
    renderizarTags();
    if (typeof atualizarProficienciaCard === "function") {
      document
        .querySelectorAll('.item-card[data-tipo="arma"]:not(#armaModelo)')
        .forEach(atualizarProficienciaCard);
    }
    if (typeof atualizarListaArmasEquipamento === "function") {
      atualizarListaArmasEquipamento();
    }
  };
  window.__temProficienciaArmaIndividual = (armaId, nomeArma) =>
    temProficienciaArmaIndividual(campo.value, armaId, nomeArma);
  renderizarTags();
  carregarCatalogo().catch(() => {});
}

if (typeof document !== "undefined") iniciarSeletorProficienciasArmas();
