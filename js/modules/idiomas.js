const IDIOMA_OUTROS = "__outros__";
const IDIOMAS_CATALOGO = [
  "Comum",
  "Anão",
  "Élfico",
  "Gigante",
  "Gnômico",
  "Goblin",
  "Halfling",
  "Orc",
  "Abissal",
  "Celestial",
  "Dracônico",
  "Discurso Profundo",
  "Infernal",
  "Primordial",
  "Silvestre",
  "Subcomum",
  "Druídico",
  "Gíria de Ladrões",
];

function separarIdiomas(valor) {
  const candidatos = Array.isArray(valor)
    ? valor
    : String(valor ?? "").split(",");
  const idiomas = [];
  const vistos = new Set();

  candidatos.forEach((candidato) => {
    const idioma = String(candidato ?? "").trim();
    const chave = idioma.toLowerCase();
    if (!idioma || vistos.has(chave)) return;
    vistos.add(chave);
    idiomas.push(idioma);
  });

  return idiomas;
}

function normalizarIdiomas(...valores) {
  return separarIdiomas(
    valores.flat(Infinity).flatMap((valor) => String(valor ?? "").split(",")),
  );
}

function iniciarSeletorIdiomas() {
  const campo = document.getElementById("proficienciaIdiomas");
  const tags = document.getElementById("idiomasTags");
  const botaoAbrir = document.getElementById("btnAdicionarIdioma");
  const modal = document.getElementById("idiomasModal");
  const opcoes = document.getElementById("idiomasOpcoes");
  const outrosWrap = document.getElementById("idiomasPersonalizadosWrap");
  const outrosCampo = document.getElementById("idiomasPersonalizados");
  const botaoConfirmar = document.getElementById("btnConfirmarIdiomas");
  const botaoCancelar = document.getElementById("btnCancelarIdiomas");
  const botaoFechar = document.getElementById("btnFecharIdiomasModal");

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

  function criarOpcao(idioma, marcado = false, ehOutros = false) {
    const label = document.createElement("label");
    label.className = ehOutros
      ? "idiomas-opcao idiomas-opcao-outros"
      : "idiomas-opcao";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `idiomaOpcao${++proximoIdOpcao}`;
    checkbox.name = "idiomasDisponiveis";
    checkbox.value = ehOutros ? IDIOMA_OUTROS : idioma;
    checkbox.checked = marcado;
    checkbox.addEventListener("change", sincronizarCampoOutros);

    label.htmlFor = checkbox.id;
    label.append(checkbox, document.createTextNode(idioma));
    opcoes.append(label);
    return checkbox;
  }

  function renderizarTags() {
    const idiomas = separarIdiomas(campo.value);
    tags.replaceChildren();

    if (idiomas.length === 0) {
      const vazio = document.createElement("span");
      vazio.className = "idiomas-vazio";
      vazio.textContent = "Nenhum idioma selecionado";
      tags.append(vazio);
      return;
    }

    idiomas.forEach((idioma) => {
      const tag = document.createElement("span");
      tag.className = "idiomas-tag";

      const nome = document.createElement("span");
      nome.textContent = idioma;
      tag.append(nome);
      tags.append(tag);
    });
  }

  function definirIdiomas(idiomas) {
    campo.value = normalizarIdiomas(idiomas).join(", ");
    campo.dispatchEvent(new Event("input", { bubbles: true }));
    campo.dispatchEvent(new Event("change", { bubbles: true }));
    renderizarTags();
  }

  function sincronizarCampoOutros() {
    outrosWrap.hidden = !obterCheckboxes().some(
      (checkbox) => checkbox.value === IDIOMA_OUTROS && checkbox.checked,
    );
  }

  function abrirModal() {
    elementoFocoAnterior = document.activeElement;
    const idiomasAtuais = separarIdiomas(campo.value);
    const idiomasAtuaisNormalizados = new Set(
      idiomasAtuais.map((idioma) => idioma.toLowerCase()),
    );
    const catalogoPorChave = new Set(
      IDIOMAS_CATALOGO.map((idioma) => idioma.toLowerCase()),
    );
    const idiomasPersonalizados = idiomasAtuais.filter(
      (idioma) => !catalogoPorChave.has(idioma.toLowerCase()),
    );

    opcoes.replaceChildren();
    IDIOMAS_CATALOGO.forEach((idioma) => {
      criarOpcao(idioma, idiomasAtuaisNormalizados.has(idioma.toLowerCase()));
    });
    criarOpcao("Outros", idiomasPersonalizados.length > 0, true);
    outrosCampo.value = idiomasPersonalizados.join(", ");
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
    const idiomasCatalogados = selecionados
      .filter((checkbox) => checkbox.value !== IDIOMA_OUTROS)
      .map((checkbox) => checkbox.value);
    const possuiOutros = selecionados.some(
      (checkbox) => checkbox.value === IDIOMA_OUTROS,
    );
    const idiomasPersonalizados = possuiOutros
      ? separarIdiomas(outrosCampo.value)
      : [];

    definirIdiomas([idiomasCatalogados, idiomasPersonalizados]);
    fecharModal();
  }

  botaoAbrir.addEventListener("click", abrirModal);
  botaoConfirmar.addEventListener("click", confirmarSelecao);
  botaoCancelar.addEventListener("click", fecharModal);
  botaoFechar.addEventListener("click", fecharModal);
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

  window.__atualizarTagsIdiomas = renderizarTags;
  renderizarTags();
}

if (typeof document !== "undefined") iniciarSeletorIdiomas();
