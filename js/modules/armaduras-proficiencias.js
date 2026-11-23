const ARMADURA_OUTROS = "__outros__";
const ARMADURAS_PROFICIENCIAS = [
  { id: "profArmaduraLeves", label: "Armaduras leves" },
  { id: "profArmaduraMedias", label: "Armaduras médias" },
  { id: "profArmaduraPesadas", label: "Armaduras pesadas" },
  { id: "profEscudos", label: "Escudos" },
];

function separarProficienciasArmadura(valor) {
  const candidatos = Array.isArray(valor)
    ? valor
    : String(valor ?? "").split(/[\n,]+/);
  const proficiencias = [];
  const vistas = new Set();

  candidatos.forEach((candidato) => {
    const proficiencia = String(candidato ?? "").trim();
    const chave = proficiencia.toLowerCase();
    if (!proficiencia || vistas.has(chave)) return;
    vistas.add(chave);
    proficiencias.push(proficiencia);
  });

  return proficiencias;
}

function iniciarSeletorProficienciasArmadura() {
  const campo = document.getElementById("proficienciaArmaduras");
  const tags = document.getElementById("armadurasTags");
  const botaoAbrir = document.getElementById(
    "btnAdicionarProficienciaArmadura",
  );
  const modal = document.getElementById("armadurasModal");
  const opcoes = document.getElementById("armadurasOpcoes");
  const outrosWrap = document.getElementById("armadurasPersonalizadasWrap");
  const outrosCampo = document.getElementById("armadurasPersonalizadas");
  const botaoConfirmar = document.getElementById("btnConfirmarArmaduras");
  const botaoCancelar = document.getElementById("btnCancelarArmaduras");
  const botaoFechar = document.getElementById("btnFecharArmadurasModal");

  if (
    !campo ||
    !tags ||
    !botaoAbrir ||
    !modal ||
    !opcoes ||
    !outrosWrap ||
    !outrosCampo ||
    !botaoConfirmar ||
    !botaoCancelar ||
    !botaoFechar
  ) {
    return;
  }

  let elementoFocoAnterior = null;
  let proximoIdOpcao = 0;

  function obterCheckboxes() {
    return Array.from(opcoes.querySelectorAll('input[type="checkbox"]'));
  }

  function criarOpcao(valor, rotulo, marcado = false, ehOutros = false) {
    const label = document.createElement("label");
    label.className = ehOutros
      ? "armaduras-seletor-opcao armaduras-seletor-opcao-outros"
      : "armaduras-seletor-opcao";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `armaduraOpcao${++proximoIdOpcao}`;
    checkbox.name = "proficienciasArmadurasDisponiveis";
    checkbox.value = valor;
    checkbox.checked = marcado;
    checkbox.addEventListener("change", sincronizarCampoOutros);

    label.htmlFor = checkbox.id;
    label.append(checkbox, document.createTextNode(rotulo));
    opcoes.append(label);
    return checkbox;
  }

  function obterProficienciasSelecionadas() {
    const selecionadas = ARMADURAS_PROFICIENCIAS.filter(
      ({ id }) => document.getElementById(id)?.checked,
    ).map(({ label }) => label);
    return separarProficienciasArmadura([
      ...selecionadas,
      ...separarProficienciasArmadura(campo.value),
    ]);
  }

  function renderizarTags() {
    const proficiencias = obterProficienciasSelecionadas();
    tags.replaceChildren();

    if (proficiencias.length === 0) {
      const vazio = document.createElement("span");
      vazio.className = "armaduras-vazio";
      vazio.textContent = "Nenhuma proficiência selecionada";
      tags.append(vazio);
      return;
    }

    proficiencias.forEach((proficiencia) => {
      const tag = document.createElement("span");
      tag.className = "armaduras-tag";
      tag.textContent = proficiencia;
      tags.append(tag);
    });
  }

  function sincronizarCampoOutros() {
    outrosWrap.hidden = !obterCheckboxes().some(
      (checkbox) => checkbox.value === ARMADURA_OUTROS && checkbox.checked,
    );
  }

  function abrirModal() {
    elementoFocoAnterior = document.activeElement;
    const categoriasSelecionadas = new Set(
      ARMADURAS_PROFICIENCIAS.filter(
        ({ id }) => document.getElementById(id)?.checked,
      ).map(({ id }) => id),
    );
    const proficienciasPersonalizadas = separarProficienciasArmadura(
      campo.value,
    );

    opcoes.replaceChildren();
    ARMADURAS_PROFICIENCIAS.forEach(({ id, label }) => {
      criarOpcao(id, label, categoriasSelecionadas.has(id));
    });
    criarOpcao(
      ARMADURA_OUTROS,
      "Outros",
      proficienciasPersonalizadas.length > 0,
      true,
    );
    outrosCampo.value = proficienciasPersonalizadas.join(", ");
    sincronizarCampoOutros();
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    obterCheckboxes()[0]?.focus();
  }

  function fecharModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    if (elementoFocoAnterior?.isConnected) elementoFocoAnterior.focus();
  }

  function confirmarSelecao() {
    const selecionados = obterCheckboxes().filter(
      (checkbox) => checkbox.checked,
    );
    const categorias = new Set(
      selecionados
        .filter((checkbox) => checkbox.value !== ARMADURA_OUTROS)
        .map((checkbox) => checkbox.value),
    );
    ARMADURAS_PROFICIENCIAS.forEach(({ id }) => {
      const checkbox = document.getElementById(id);
      if (!checkbox) return;
      checkbox.checked = categorias.has(id);
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const possuiOutros = selecionados.some(
      (checkbox) => checkbox.value === ARMADURA_OUTROS,
    );
    campo.value = possuiOutros
      ? separarProficienciasArmadura(outrosCampo.value).join(", ")
      : "";
    campo.dispatchEvent(new Event("input", { bubbles: true }));
    campo.dispatchEvent(new Event("change", { bubbles: true }));
    renderizarTags();
    fecharModal();
  }

  botaoAbrir.addEventListener("click", abrirModal);
  botaoConfirmar.addEventListener("click", confirmarSelecao);
  botaoCancelar.addEventListener("click", fecharModal);
  botaoFechar.addEventListener("click", fecharModal);
  ARMADURAS_PROFICIENCIAS.forEach(({ id }) => {
    document.getElementById(id)?.addEventListener("change", renderizarTags);
  });
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

  window.__atualizarTagsArmaduras = renderizarTags;
  renderizarTags();
}

if (typeof document !== "undefined") iniciarSeletorProficienciasArmadura();
