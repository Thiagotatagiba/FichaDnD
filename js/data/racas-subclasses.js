if (!window.DND_PERSONAGEM_OPTIONS) {
  const avisoOpcoes = document.createElement("div");
  avisoOpcoes.id = "erroOpcoesPersonagem";
  avisoOpcoes.setAttribute("role", "alert");
  avisoOpcoes.style.cssText =
    "position:fixed;z-index:20000;inset:12px 12px auto;padding:14px;border:2px solid #8b1e1e;background:#fff;color:#651010;font:16px sans-serif";
  avisoOpcoes.textContent =
    "Não foi possível carregar as opções de raça e classe. Recarregue a ficha; as opções compartilhadas são necessárias para inicializar esta página.";
  document.body.prepend(avisoOpcoes);
  throw new Error("Fonte obrigatória DND_PERSONAGEM_OPTIONS indisponível.");
}

const mapaDadoVida = {
  barbaro: "d12",

  guerreiro: "d10",
  paladino: "d10",
  patrulheiro: "d10", // ranger

  clerigo: "d8",
  druida: "d8",
  monge: "d8",
  ladino: "d8",
  bruxo: "d8",
  bardo: "d8",

  mago: "d6",
  feiticeiro: "d6",
};

// Accessibility helper: avoid setting aria-hidden='true' on an element that still contains focus.
(function preventAriaHiddenFocusIssue() {
  const origSet = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    try {
      if (
        String(name).toLowerCase() === "aria-hidden" &&
        String(value) === "true" &&
        this.contains(document.activeElement)
      ) {
        try {
          // move focus to body or blur the active element first to avoid the a11y issue
          document.activeElement.blur && document.activeElement.blur();
          if (document.body && typeof document.body.focus === "function") {
            document.body.focus();
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      // defensive: don't break page
    }

    return origSet.call(this, name, value);
  };
})();

const SUBCLASSES = window.DND_PERSONAGEM_OPTIONS.subclasses;

const REGRAS_SUBCLASSE = window.DND_PERSONAGEM_OPTIONS.regrasSubclasse;

const SUBRACAS = window.DND_PERSONAGEM_OPTIONS.subracas;

function normalizarChaveSubclasseClasse(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obterCampoSubclasse() {
  return document.getElementById("subclasse");
}

function obterCampoRaca() {
  return document.getElementById("racaID");
}

function normalizarConfigFicha(config, opcoes = {}) {
  const preservarDesconhecidos = opcoes.preservarDesconhecidos === true;
  const configObjeto =
    preservarDesconhecidos &&
    config &&
    typeof config === "object" &&
    !Array.isArray(config)
      ? config
      : {};
  const custom =
    config &&
    typeof config === "object" &&
    config.custom &&
    typeof config.custom === "object"
      ? config.custom
      : {};

  return {
    ...(preservarDesconhecidos ? configObjeto : {}),
    custom: {
      ...(preservarDesconhecidos &&
      custom &&
      typeof custom === "object" &&
      !Array.isArray(custom)
        ? custom
        : {}),
      classe: String(custom.classe || "").trim(),
      subclasse: String(custom.subclasse || "").trim(),
      raca: String(custom.raca || "").trim(),
      subraca: String(custom.subraca || "").trim(),
    },
  };
}

function obterCustomizacaoFicha(chave) {
  return String(configFicha?.custom?.[chave] || "").trim();
}

function normalizarChaveSubraca(valor) {
  const texto = String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const aliases = {
    anao: "anao",
    anão: "anao",
    elfo: "elfo",
    draconato: "draconato",
    gnomo: "gnomo",
    halfling: "halfling",
    humano: "humano",
    "meio elfo": "meio_elfo",
    "meio-elfo": "meio_elfo",
    meio_elfo: "meio_elfo",
    "meio orc": "meio_orc",
    "meio-orc": "meio_orc",
    meio_orc: "meio_orc",
    tiefling: "tiefling",
  };

  return aliases[texto] || texto.replace(/[\s-]+/g, "_");
}

function garantirCampoSubclasseComoSelect() {
  const campoAtual = obterCampoSubclasse();
  if (!campoAtual || campoAtual.tagName === "SELECT") return campoAtual;

  const select = document.createElement("select");
  select.id = campoAtual.id;
  select.className = campoAtual.className;
  select.setAttribute("aria-label", "Subclasse");
  select.setAttribute(
    "placeholder",
    campoAtual.getAttribute("placeholder") || "Selecione a subclasse",
  );
  select.value = campoAtual.value || "";

  while (campoAtual.attributes.length > 0) {
    const atributo = campoAtual.attributes[0];
    if (!["type", "value", "placeholder"].includes(atributo.name)) {
      select.setAttribute(atributo.name, atributo.value);
    }
    campoAtual.removeAttribute(atributo.name);
  }

  campoAtual.replaceWith(select);
  return select;
}

function obterRegraSubclasse(classeSelecionada) {
  const campoClasse = document.getElementById("classeNomeID");
  const valorDireto = normalizarChaveSubclasseClasse(classeSelecionada);
  const valorSelect = normalizarChaveSubclasseClasse(campoClasse?.value);
  const textoSelect = normalizarChaveSubclasseClasse(
    campoClasse?.options?.[campoClasse.selectedIndex]?.text,
  );
  return (
    REGRAS_SUBCLASSE[valorDireto] ||
    REGRAS_SUBCLASSE[valorSelect] ||
    REGRAS_SUBCLASSE[textoSelect] ||
    null
  );
}

function adicionarOpcaoSubclasse(select, valor, selecionada = false) {
  if (!select || valor === undefined || valor === null) return;

  const opcao = document.createElement("option");
  opcao.value = valor;
  opcao.textContent = valor;
  if (selecionada) opcao.selected = true;
  select.appendChild(opcao);
}

function obterCampoSubraca() {
  return document.getElementById("subraca");
}

function garantirPlaceholderSelect(select, textoPlaceholder) {
  if (!select) return;

  let primeiraOpcao = select.options[0];
  if (!primeiraOpcao || primeiraOpcao.value !== "") {
    primeiraOpcao = document.createElement("option");
    primeiraOpcao.value = "";
    select.insertBefore(primeiraOpcao, select.firstChild);
  }

  primeiraOpcao.textContent = textoPlaceholder;

  const valorAtual = String(select.value ?? "").trim();
  const valorExiste =
    valorAtual !== "" &&
    Array.from(select.options).some((opcao) => opcao.value === valorAtual);
  if (!valorAtual || !valorExiste) {
    select.value = "";
  }
}

function normalizarPlaceholdersCamposBase() {
  garantirPlaceholderSelect(
    document.getElementById("classeNomeID"),
    "Selecione uma classe",
  );
  garantirPlaceholderSelect(obterCampoRaca(), "Selecione uma raça");
}

function garantirOpcaoSelect(select, valor, texto = valor) {
  if (!select || !valor) return;

  const jaExiste = Array.from(select.options).some(
    (opcao) => opcao.value === valor,
  );
  if (jaExiste) return;

  const opcao = document.createElement("option");
  opcao.value = valor;
  opcao.textContent = texto;
  select.appendChild(opcao);
}

function removerOpcaoCustomizada(select, escopo) {
  if (!select) return;
  select
    .querySelectorAll(`option[data-config-custom="${escopo}"]`)
    .forEach((opcao) => opcao.remove());
}

function garantirOpcaoCustomizada(select, escopo, valor, rotulo) {
  if (!select || !valor) return;

  removerOpcaoCustomizada(select, escopo);
  const opcao = document.createElement("option");
  opcao.value = valor;
  opcao.textContent = rotulo || valor;
  opcao.dataset.configCustom = escopo;
  select.appendChild(opcao);
}

function adicionarOpcaoSubraca(select, valor, selecionada = false) {
  if (!select || valor === undefined || valor === null) return;

  const opcao = document.createElement("option");
  opcao.value = valor;
  opcao.textContent = valor;
  if (selecionada) opcao.selected = true;
  select.appendChild(opcao);
}

function atualizarSubclasses(classeSelecionada) {
  const container = document.getElementById("containerSubclasse");
  const select = garantirCampoSubclasseComoSelect();
  const nivelCampo =
    document.getElementById("classeNivelID") ||
    document.getElementById("nivel");

  if (!container || !select || !nivelCampo) return;

  const classeNormalizada = normalizarChaveSubclasseClasse(
    classeSelecionada || document.getElementById("classeNomeID")?.value,
  );
  const subclasses = Array.isArray(SUBCLASSES[classeNormalizada])
    ? SUBCLASSES[classeNormalizada]
    : [];
  const regra = obterRegraSubclasse(classeNormalizada);
  const nivel = parseInt(nivelCampo.value, 10) || 1;
  const possuiValorPendente = Object.prototype.hasOwnProperty.call(
    select.dataset,
    "pendingValue",
  );
  const valorAtual = String(
    select.dataset.pendingValue ?? select.value ?? "",
  ).trim();
  const customSubclasse = obterCustomizacaoFicha("subclasse");
  delete select.dataset.pendingValue;

  select.innerHTML = "";
  adicionarOpcaoSubclasse(select, "", true);
  select.options[0].textContent = "Selecione a subclasse";

  const deveExibir =
    (!!classeNormalizada &&
      subclasses.length > 0 &&
      (!regra || nivel >= regra.nivel)) ||
    !!customSubclasse;
  if (!deveExibir) {
    container.classList.add("hidden");
    if (possuiValorPendente && valorAtual) {
      adicionarOpcaoSubclasse(select, valorAtual, true);
    } else {
      select.value = "";
    }
    sincronizarResumoCaracteristicas(true);
    return;
  }

  subclasses.forEach((subclasse) => adicionarOpcaoSubclasse(select, subclasse));

  if (customSubclasse && !subclasses.includes(customSubclasse)) {
    adicionarOpcaoSubclasse(select, customSubclasse);
  }

  // Compatibilidade com saves antigos/customizados: preserva o valor salvo se ele não estiver na lista.
  if (possuiValorPendente && valorAtual && !subclasses.includes(valorAtual)) {
    adicionarOpcaoSubclasse(select, valorAtual);
  }

  select.value =
    valorAtual &&
    Array.from(select.options).some((opcao) => opcao.value === valorAtual)
      ? valorAtual
      : customSubclasse &&
          Array.from(select.options).some(
            (opcao) => opcao.value === customSubclasse,
          )
        ? customSubclasse
        : "";
  container.classList.remove("hidden");
  sincronizarResumoCaracteristicas(true);
}

function atualizarSubclasse() {
  atualizarSubclasses(document.getElementById("classeNomeID")?.value);
}

function atualizarSubracas(racaSelecionada) {
  const container = document.getElementById("containerSubraca");
  const select = obterCampoSubraca();

  if (!container || !select) return;

  const racaNormalizada = normalizarChaveSubraca(
    racaSelecionada || document.getElementById("racaID")?.value,
  );
  const subracas = Array.isArray(SUBRACAS[racaNormalizada])
    ? SUBRACAS[racaNormalizada]
    : [];
  const possuiValorPendente = Object.prototype.hasOwnProperty.call(
    select.dataset,
    "pendingValue",
  );
  const valorAtual = String(
    select.dataset.pendingValue ?? select.value ?? "",
  ).trim();
  const customSubraca = obterCustomizacaoFicha("subraca");
  delete select.dataset.pendingValue;

  select.innerHTML = "";
  adicionarOpcaoSubraca(select, "", true);
  select.options[0].textContent = "Sub-raça";

  const deveExibir =
    (!!racaNormalizada && subracas.length > 0) || !!customSubraca;
  if (!deveExibir) {
    container.classList.add("hidden");
    if (possuiValorPendente && valorAtual) {
      adicionarOpcaoSubraca(select, valorAtual, true);
    } else {
      select.value = "";
    }
    sincronizarResumoCaracteristicas(true);
    return;
  }

  subracas.forEach((subraca) => adicionarOpcaoSubraca(select, subraca));

  if (customSubraca && !subracas.includes(customSubraca)) {
    adicionarOpcaoSubraca(select, customSubraca);
  }

  // Compatibilidade com saves antigos/customizados: preserva o valor salvo ao recarregar.
  if (possuiValorPendente && valorAtual && !subracas.includes(valorAtual)) {
    adicionarOpcaoSubraca(select, valorAtual);
  }

  select.value =
    valorAtual &&
    Array.from(select.options).some((opcao) => opcao.value === valorAtual)
      ? valorAtual
      : customSubraca &&
          Array.from(select.options).some(
            (opcao) => opcao.value === customSubraca,
          )
        ? customSubraca
        : "";
  container.classList.remove("hidden");
  sincronizarResumoCaracteristicas(true);
}

function obterResumoRacaCompleto() {
  const raca = String(obterCampoRaca()?.value || "").trim();
  const containerSubraca = document.getElementById("containerSubraca");
  const subracaDisponivel =
    !!containerSubraca && !containerSubraca.classList.contains("hidden");
  const subraca = String(
    document.getElementById("subraca")?.value || "",
  ).trim();

  if (raca && subracaDisponivel && subraca) {
    return `${raca} - ${subraca}`;
  }

  return raca;
}

function aplicarConfigCustomizacaoNaFicha(forcarSelecao = false) {
  const campoClasse = document.getElementById("classeNomeID");
  const campoRaca = obterCampoRaca();
  const customClasse = obterCustomizacaoFicha("classe");
  const customRaca = obterCustomizacaoFicha("raca");
  const customSubclasse = obterCustomizacaoFicha("subclasse");
  const customSubraca = obterCustomizacaoFicha("subraca");

  if (campoClasse) {
    removerOpcaoCustomizada(campoClasse, "classe");
    if (customClasse) {
      garantirOpcaoCustomizada(
        campoClasse,
        "classe",
        customClasse,
        `${customClasse} (Custom)`,
      );
      if (forcarSelecao || !campoClasse.value) campoClasse.value = customClasse;
    }
  }

  if (campoRaca) {
    removerOpcaoCustomizada(campoRaca, "raca");
    if (customRaca) {
      garantirOpcaoCustomizada(
        campoRaca,
        "raca",
        customRaca,
        `${customRaca} (Custom)`,
      );
      if (forcarSelecao || !campoRaca.value) campoRaca.value = customRaca;
    }
  }

  atualizarSubclasses(campoClasse?.value);
  if (customSubclasse && forcarSelecao) {
    const campoSubclasse = garantirCampoSubclasseComoSelect();
    if (campoSubclasse) campoSubclasse.value = customSubclasse;
  }

  atualizarSubracas(campoRaca?.value);
  if (customSubraca && forcarSelecao) {
    const campoSubraca = obterCampoSubraca();
    if (campoSubraca) campoSubraca.value = customSubraca;
  }

  sincronizarClasseNivel();
  sincronizarResumoCaracteristicas(true);
}

function preencherFormularioConfigFicha() {
  document.getElementById("customClasse").value =
    obterCustomizacaoFicha("classe");
  document.getElementById("customSubclasse").value =
    obterCustomizacaoFicha("subclasse");
  document.getElementById("customRaca").value = obterCustomizacaoFicha("raca");
  document.getElementById("customSubraca").value =
    obterCustomizacaoFicha("subraca");
}

function salvarCustomizacaoFicha() {
  configFicha.custom.classe = String(
    document.getElementById("customClasse")?.value || "",
  ).trim();
  configFicha.custom.subclasse = String(
    document.getElementById("customSubclasse")?.value || "",
  ).trim();
  configFicha.custom.raca = String(
    document.getElementById("customRaca")?.value || "",
  ).trim();
  configFicha.custom.subraca = String(
    document.getElementById("customSubraca")?.value || "",
  ).trim();

  aplicarConfigCustomizacaoNaFicha(true);
}

function abrirConfigModal() {
  preencherFormularioConfigFicha();
  ativarAbaConfig("geral");
  const overlay = document.getElementById("configModalOverlay");
  if (!overlay) return;
  overlay.classList.add("ativo");
  overlay.setAttribute("aria-hidden", "false");
}

function fecharConfigModal() {
  const overlay = document.getElementById("configModalOverlay");
  if (!overlay) return;
  overlay.classList.remove("ativo");
  overlay.setAttribute("aria-hidden", "true");
}

function ativarAbaConfig(tab) {
  const chave = String(tab || "geral")
    .trim()
    .toLowerCase();
  document.querySelectorAll(".config-tab").forEach((botao) => {
    botao.classList.toggle("active", botao.dataset.tab === chave);
  });
  document.querySelectorAll(".config-aba").forEach((aba) => {
    aba.classList.toggle("ativa", aba.id === `aba-${chave}`);
  });
}

function atualizarDadoVida() {
  const classe = document.getElementById("classeNomeID").value;
  const selectDV = document.getElementById("dadosVidaTipo");

  if (!classe || !mapaDadoVida[classe]) {
    selectDV.classList.remove("bloqueado");
    return;
  }

  selectDV.value = mapaDadoVida[classe];
  selectDV.classList.add("bloqueado");
}
document
  .getElementById("classeNomeID")
  .addEventListener("change", atualizarDadoVida);

// ===== Lógica de Nível e XP =====
function atualizarDadosVidaTotal() {
  const nivelInput = document.getElementById("classeNivelID");
  const dadosVidaTotalInput = document.getElementById("dadosVidaTotal");

  const nivel = Number(nivelInput.value) || 1;

  dadosVidaTotalInput.value = nivel;
}
function normalizarIndiceEquipamento(indice) {
  if (indice === null || indice === undefined || indice === "") return null;
  const numero = Number(indice);
  return Number.isInteger(numero) && numero >= 0 ? numero : null;
}

function obterArmadurasParaEquipamento(armaduras = null) {
  if (Array.isArray(armaduras)) return armaduras;
  if (typeof coletarArmaduras === "function") return coletarArmaduras();
  return Array.isArray(personagem?.armaduras) ? personagem.armaduras : [];
}

function marcarArmaduraEquipadaNoInventario(indice) {
  document
    .querySelectorAll("#lista-armaduras-equipamento input")
    .forEach((input) => {
      input.checked = indice !== null && input.dataset.index === String(indice);
    });
}

function equiparArmadura(indice, opcoes = {}) {
  const armaduras = obterArmadurasParaEquipamento(opcoes.armaduras);
  const indiceNormalizado = normalizarIndiceEquipamento(indice);
  const armaduraSelecionada =
    indiceNormalizado !== null ? armaduras[indiceNormalizado] || null : null;
  const indiceFinal = armaduraSelecionada ? indiceNormalizado : null;

  armaduraSelecionadaAtual = armaduraSelecionada;
  armaduraEquipadaIndice = indiceFinal;

  if (
    opcoes.atualizarSelect !== false &&
    typeof atualizarSelectNomeArmaduraEquipada === "function"
  ) {
    atualizarSelectNomeArmaduraEquipada(armaduras, indiceFinal);
  }

  const select = document.getElementById("armaduraNome");
  if (select)
    select.value =
      indiceFinal !== null && indiceFinal !== undefined
        ? String(indiceFinal)
        : "";

  marcarArmaduraEquipadaNoInventario(indiceFinal);
  atualizarCamposArmaduraSelecionada(armaduraSelecionada);
  if (typeof atualizarResumosArmaduras === "function") atualizarResumosArmaduras(armaduras);

  return armaduraSelecionada;
}

// ===== Lógica de Level Up e Modal =====
function obterMaxDadoVida() {
  const select = document.querySelector('[id="dadosVidaTipo"]');
  const valor = select?.value;

  const numero = Number(valor.replace("d", ""));

  return numero;
}

/// ===== Frases épicas para o level up =====
const frasesLevelUP = [
  "Seu poder ecoa pelos reinos!",
  "Uma nova lenda começa a ser escrita!",
  "Os deuses observam seu crescimento!",
  "Seu nome será lembrado nas eras!",
  "A batalha te fortaleceu!",
  "Seu destino se revela mais grandioso!",
  "Você transcende seus limites!",
  "O mundo sente sua evolução!",
  "Uma nova força desperta em você!",
  "Seu poder acaba de subir de nível!",
];

const frasesXP = [
  "O tesouro de XP chega como recompensa por seu heroísmo!",
  "O mestre da guilda anota sua vitória com orgulho.",
  "O curso da aventura se inclina a seu favor com esta experiência.",
  "A batalha trouxe não apenas ouro, mas novos aprendizados.",
  "Os ancestrais sorriem ao ver seu progresso.",
  "Este XP acende a chama de seu legado.",
  "As histórias de tavernas agora incluem o seu nome.",
  "A magia do combate transforma feridas em sabedoria.",
  "Seu caminho de herói avança um passo brilhante.",
  "O universo reconhece seu esforço com experiência verdadeira.",
];

function pegarFraseLevelUP() {
  return frasesLevelUP[Math.floor(Math.random() * frasesLevelUP.length)];
}

function pegarFraseXP() {
  return frasesXP[Math.floor(Math.random() * frasesXP.length)];
}

const operacoesModaisXPLevelUp = new Set();

window.__cancelarOperacoesModaisXPLevelUp = async function () {
  const operacoes = [...operacoesModaisXPLevelUp];
  const modais = ["xpAddModal", "levelUpModal"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const focoAtivo = document.activeElement;
  const focusTarget = operacoes
    .map((operacao) => operacao.focusTarget?.())
    .find((alvo) => alvo?.isConnected && !modais.some((modal) => modal.contains(alvo))) ||
    (focoAtivo?.isConnected && !modais.some((modal) => modal.contains(focoAtivo))
      ? focoAtivo
      : null);
  const cancelled = [];
  const completions = [];
  let ok = true;
  for (const operacao of operacoes) {
    if (operacao.settled) continue;
    try {
      const completion = operacao.cancel();
      if (completion && typeof completion.then === "function") {
        completions.push(completion);
      }
      cancelled.push(operacao.kind);
    } catch (erro) {
      ok = false;
    }
  }
  // Give Promise continuations (which are epoch fenced) a chance to settle
  // before the character applicator starts mutating state.
  const results = await Promise.allSettled(completions);
  if (results.some((result) => result.status === "rejected")) ok = false;
  await Promise.resolve();
  return { ok: ok && operacoes.every((op) => op.settled), cancelled, focusTarget };
};

window.__reconciliarModaisXPLevelUp = function ({ focusTarget, reconciliarXP = false } = {}) {
  try {
    for (const id of ["xpAddModal", "levelUpModal"]) {
      const modal = document.getElementById(id);
      if (!modal) continue;
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
      modal.classList.remove("ativo");
    }
    document.getElementById("xpAddModalProgressFill")?.classList.remove("xp-glow");
    const progressoXP = document.getElementById("xpAddModalProgressFill");
    if (progressoXP) progressoXP.style.transition = "";
    document.getElementById("btnRolarDado")?.classList.remove("rolando");
    for (const id of ["xpBar", "xpBarCurrent", "xpBarNext"]) {
      const barra = document.getElementById(id);
      if (barra) barra.style.transition = "";
    }
    // O snapshot pode capturar a largura-alvo de uma animação antes de o XP
    // persistente mudar. No rollback, refaça a representação visual a partir
    // do campo XP já restaurado, sem recalcular nível, vida ou Level Up.
    if (reconciliarXP && typeof atualizarXPENivel === "function") {
      atualizarXPENivel({ apenasVisual: true });
    }
    const modais = ["xpAddModal", "levelUpModal"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (modais.some((modal) => modal.contains(document.activeElement))) {
      if (focusTarget?.isConnected && !modais.some((modal) => modal.contains(focusTarget))) {
        focusTarget.focus();
      } else {
        document.activeElement?.blur?.();
      }
    }
    return { ok: true };
  } catch (erro) {
    return { ok: false, error: erro };
  }
};

// Animação visual simples para celebrar Level Up.
// (celebração visual removida por solicitação — sem efeitos extras)

function abrirModalAdicionarXP() {
  const epochImportacao = window.__fichaImportacaoEpoch || 0;
  const geracaoModalXP = (window.__geracaoModalAdicionarXP || 0) + 1;
  window.__geracaoModalAdicionarXP = geracaoModalXP;
  const operacaoContinuaAtual = () =>
    (window.__fichaImportacaoEpoch || 0) === epochImportacao &&
    !window.__fichaImportacaoTransacaoAtiva;
  return new Promise((resolve) => {
    let resolvida = false;
    const timers = new Set();
    const resolverUmaVez = (valor) => {
      if (resolvida) return;
      resolvida = true;
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      operacoesModaisXPLevelUp.delete(operacao);
      resolve(valor);
    };
    const agendar = (callback, atraso) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!resolvida) callback();
      }, atraso);
      timers.add(timer);
      return timer;
    };
    let cancelamento;
    const operacao = {
      kind: "xp",
      settled: false,
      focusTarget: () => elementoAnteriorFocado,
      cancel: () => cancelamento?.(),
    };
    Object.defineProperty(operacao, "settled", { get: () => resolvida });
    const modal = document.getElementById("xpAddModal");
    const frase = document.getElementById("xpAddModalEpicPhrase");
    const input = document.getElementById("xpAddModalInput");
    const btnConfirm = document.getElementById("xpAddModalConfirm");
    const btnCancel = document.getElementById("xpAddModalCancel");
    const btnClose = document.getElementById("xpAddModalClose");
    const progressBar = document.getElementById("xpAddModalProgressBar");
    const progressFill = document.getElementById("xpAddModalProgressFill");
    const progressText = document.getElementById("xpAddModalProgressText");
    const currentEl = document.getElementById("xpAddModalCurrent");
    const totalEl = document.getElementById("xpAddModalTotal");
    const missingEl = document.getElementById("xpAddModalMissing");

    if (!modal || !input || !btnConfirm || !btnCancel || !btnClose || !frase) {
      resolverUmaVez(null);
      return;
    }
    if (!operacaoContinuaAtual()) {
      resolverUmaVez(null);
      return;
    }

    const xpInputGlobal = document.getElementById("xp");
    const xpAtual = Number(xpInputGlobal?.value) || 0;

    // Determina limites do nível atual
    let xpNivelAtual = 0;
    let xpProximoNivel = tabelaXP[tabelaXP.length - 1].xp;
    for (let i = 0; i < tabelaXP.length; i++) {
      if (xpAtual >= tabelaXP[i].xp) {
        xpNivelAtual = tabelaXP[i].xp;
        if (tabelaXP[i + 1]) xpProximoNivel = tabelaXP[i + 1].xp;
      }
    }

    const denom = Math.max(1, xpProximoNivel - xpNivelAtual);

    // Inicializa UI
    frase.textContent = pegarFraseXP();
    input.value = "";
    input.classList.remove("invalido");
    input.disabled = false;
    btnConfirm.disabled = true;
    btnCancel.disabled = false;
    btnClose.disabled = false;
    currentEl.textContent = xpAtual;
    totalEl.textContent = xpAtual;
    progressText.textContent = `${xpAtual}/${xpProximoNivel} XP`;
    const progressoAtual = Math.max(
      0,
      Math.min(1, (xpAtual - xpNivelAtual) / denom),
    );
    progressFill.style.width = `${progressoAtual * 100}%`;
    missingEl.textContent = `Faltam ${Math.max(0, xpProximoNivel - xpAtual)} XP para o próximo nível.`;
    btnConfirm.textContent = `Adicionar 0 XP`;

    let elementoAnteriorFocado = null;

    function keydownHandler(e) {
      if (!modal.classList.contains("ativo") && modal.style.display !== "flex")
        return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (typeof fecharModal === "function") fecharModal();
        return;
      }

      if (e.key === "Tab") {
        const focusaveis = Array.from(
          modal.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null);

        if (!focusaveis.length) return;

        const idx = focusaveis.indexOf(document.activeElement);
        let nextIndex = 0;
        if (e.shiftKey) {
          nextIndex = idx <= 0 ? focusaveis.length - 1 : idx - 1;
        } else {
          nextIndex = idx === -1 || idx === focusaveis.length - 1 ? 0 : idx + 1;
        }

        focusaveis[nextIndex].focus();
        e.preventDefault();
      }
    }

    let btnConfirmHandler;
    let fecharModal;

    const abrir = () => {
      elementoAnteriorFocado = document.activeElement;
      btnConfirm.disabled = true;
      input.disabled = false;
      input.removeAttribute("disabled");
      btnCancel.disabled = false;
      btnCancel.removeAttribute("disabled");
      btnClose.disabled = false;
      btnClose.removeAttribute("disabled");
      modal.setAttribute("aria-hidden", "false");
      modal.style.display = "flex";
      // small delay to ensure display applied before focusing
      agendar(() => {
        if (!operacaoContinuaAtual()) return;
        input.focus();
        input.select();
      }, 0);
      document.addEventListener("keydown", keydownHandler);
    };

    const limpar = (restaurarFoco = true) => {
      input.oninput = null;
      if (btnConfirmHandler) {
        btnConfirm.removeEventListener("click", btnConfirmHandler);
        btnConfirmHandler = null;
      }
      btnCancel.removeEventListener("click", fecharModal);
      btnClose.removeEventListener("click", fecharModal);
      document.removeEventListener("keydown", keydownHandler);

      if (restaurarFoco) {
        try {
          if (
            elementoAnteriorFocado &&
            typeof elementoAnteriorFocado.focus === "function"
          ) {
            elementoAnteriorFocado.focus();
          }
        } catch (err) {
          // ignore
        }
      }
    };

    const finalizarOperacaoObsoleta = async () => {
      while (window.__fichaImportacaoTransacaoAtiva) {
        await window.__aguardarFimImportacaoFicha?.();
      }
      if (resolvida) return;
      if (window.__geracaoModalAdicionarXP !== geracaoModalXP) {
        resolverUmaVez(null);
        return;
      }
      limpar(false);
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
      progressFill?.classList.remove("xp-glow");
      resolverUmaVez(null);
    };

    function atualizarPreview() {
      const valor = Number(input.value) || 0;
      const novo = xpAtual + valor;
      totalEl.textContent = novo;
      btnConfirm.textContent = `Adicionar ${valor} XP`;
      btnConfirm.disabled = !(Number.isInteger(valor) && valor > 0);

      if (novo >= xpProximoNivel) {
        missingEl.textContent = `Você alcançará o próximo nível!`;
      } else {
        missingEl.textContent = `Faltam ${xpProximoNivel - novo} XP para o próximo nível.`;
      }

      const progressoNovo = Math.max(
        0,
        Math.min(1, (novo - xpNivelAtual) / denom),
      );
      progressFill.style.transition = "width 220ms linear";
      progressFill.style.width = `${progressoNovo * 100}%`;
      progressText.textContent = `${novo}/${xpProximoNivel} XP`;
    }

    fecharModal = () => {
      limpar();
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
      resolverUmaVez(null);
    };

    cancelamento = () => {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      limpar(false);
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
      progressFill?.classList.remove("xp-glow");
      resolverUmaVez(null);
    };

    btnCancel.addEventListener("click", fecharModal);
    btnClose.addEventListener("click", fecharModal);

    btnConfirmHandler = () => {
      if (!operacaoContinuaAtual()) return;
      const valor = Number(input.value) || 0;
      if (!Number.isInteger(valor) || valor <= 0) return;

      // Desabilita controles durante animação
      btnConfirm.disabled = true;
      input.disabled = true;
      btnCancel.disabled = true;
      btnClose.disabled = true;

      const novo = xpAtual + valor;
      const progressoNovo = Math.max(
        0,
        Math.min(1, (novo - xpNivelAtual) / denom),
      );

      if (novo >= xpProximoNivel) {
        // animação de level up: preencher até 100% com brilho
        progressFill.style.transition = "width 800ms ease";
        progressFill.style.width = "100%";
        progressFill.classList.add("xp-glow");

        agendar(() => {
          if (!operacaoContinuaAtual()) {
            void finalizarOperacaoObsoleta();
            return;
          }
          limpar();
          // mantém o glow por pouco tempo e fecha o modal
          agendar(() => {
            if (operacaoContinuaAtual()) progressFill.classList.remove("xp-glow");
          }, 600);
          modal.style.display = "none";
          modal.setAttribute("aria-hidden", "true");
          resolverUmaVez(valor);
        }, 850);
      } else {
        // animação simples até novo progresso
        progressFill.style.transition = "width 600ms ease";
        progressFill.style.width = `${progressoNovo * 100}%`;

        agendar(() => {
          if (!operacaoContinuaAtual()) {
            void finalizarOperacaoObsoleta();
            return;
          }
          limpar();
          modal.style.display = "none";
          modal.setAttribute("aria-hidden", "true");
          resolverUmaVez(valor);
        }, 650);
      }
    };

    btnConfirm.addEventListener("click", btnConfirmHandler);

    input.oninput = atualizarPreview;
    operacoesModaisXPLevelUp.add(operacao);
    abrir();
  });
}

function abrirModalLevelUp({ nivelAnterior, nivelAtual, bonusProf, dadoVida }) {
  if (window.__fichaImportacaoTransacaoAtiva) return Promise.resolve(null);
  const epochImportacao = window.__fichaImportacaoEpoch || 0;
  let operacao;
  let resolvida = false;
  const timers = new Set();
  const resolverUmaVez = (resolve, valor) => {
    if (resolvida) return;
    resolvida = true;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    operacoesModaisXPLevelUp.delete(operacao);
    resolve(valor);
  };
  const agendar = (callback, atraso) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!resolvida) callback();
    }, atraso);
    timers.add(timer);
    return timer;
  };
  const operacaoContinuaAtual = () =>
    !resolvida && (window.__fichaImportacaoEpoch || 0) === epochImportacao &&
    !window.__fichaImportacaoTransacaoAtiva;
  return new Promise((resolve) => {
    operacao = {
      kind: "levelUp",
      get settled() { return resolvida; },
      focusTarget: () => elementoAnteriorFocadoLevelUp,
      cancel: () => cancelar?.(),
    };
    const modal = document.getElementById("levelUpModal");
    const frase = document.getElementById("levelUpFrase");
    const info = document.getElementById("levelUpInfo");
    const input = document.getElementById("inputVidaLevelUp");
    const btnDado = document.getElementById("btnRolarDado");
    const modTexto = document.getElementById("modConTexto");
    const bonusDetalhe = document.getElementById("levelUpBonusDetalhe");
    const dadoDetalhe = document.getElementById("levelUpDadoDetalhe");
    const totalVida = document.getElementById("levelUpTotalVida");
    const historicoVida = document.getElementById("levelUpHistoricoVida");

    const modCon = calcularModCon();
    const dadoBase = dadoVida; // ex: d10
    const dadoQuantidade = `${nivelAtual}${dadoBase}`;
    const max = obterMaxDadoVidaFromString(dadoVida);
    const historicoRolagensVida = [];
    const pendingRolls = new Set();

    frase.textContent = pegarFraseLevelUP();

    info.innerHTML = `
<strong>Você subiu do nível ${nivelAnterior} para o nível ${nivelAtual}!</strong><br><br>

Dados de Vida: ${dadoQuantidade} <br>
Bônus de Proficiência: +${bonusProf}
`;

    modTexto.textContent = modCon >= 0 ? `+${modCon}` : modCon;
    if (bonusDetalhe) bonusDetalhe.textContent = `(${modCon}❤️)`;
    if (dadoDetalhe) dadoDetalhe.textContent = dadoVida || `d${max}`;
    if (totalVida) totalVida.innerHTML = "Total: <strong>-</strong>";
    if (historicoVida) historicoVida.textContent = "-";

    input.value = "";
    if (input) {
      input.setAttribute("min", "1");
      input.setAttribute("max", String(max));
      input.setAttribute("step", "1");
    }

    let elementoAnteriorFocadoLevelUp = null;

    function keydownHandlerLevelUp(e) {
      if (
        !modal ||
        (modal.style.display !== "flex" && !modal.classList.contains("ativo"))
      )
        return;
      if (e.key === "Escape") {
        e.preventDefault();
        // Cancelar a rolagem não equivale a um resultado numérico.
        limparLevelUp();
        modal.style.display = "none";
        finalizar(null);
        return;
      }

      if (e.key === "Tab") {
        const focusaveis = Array.from(
          modal.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null);

        if (!focusaveis.length) return;
        const idx = focusaveis.indexOf(document.activeElement);
        let nextIndex = 0;
        if (e.shiftKey) {
          nextIndex = idx <= 0 ? focusaveis.length - 1 : idx - 1;
        } else {
          nextIndex = idx === -1 || idx === focusaveis.length - 1 ? 0 : idx + 1;
        }

        focusaveis[nextIndex].focus();
        e.preventDefault();
      }
    }

    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "flex";

    const botao = document.getElementById("btnConfirmarLevelUp");
    const handlers = { dado: null, input: null, historico: null, confirmar: null };

    function limparLevelUp(restaurarFoco = true) {
      document.removeEventListener("keydown", keydownHandlerLevelUp);
      if (input.oninput === handlers.input) input.oninput = null;
      if (historicoVida && historicoVida.onclick === handlers.historico) historicoVida.onclick = null;
      if (btnDado && btnDado.onclick === handlers.dado) btnDado.onclick = null;
      if (botao && botao.onclick === handlers.confirmar) botao.onclick = null;
      if (!restaurarFoco) return;
      try {
        if (
          elementoAnteriorFocadoLevelUp &&
          typeof elementoAnteriorFocadoLevelUp.focus === "function"
        )
          elementoAnteriorFocadoLevelUp.focus();
      } catch (err) {
        // ignore
      }
    }

    elementoAnteriorFocadoLevelUp = document.activeElement;
    // small delay to ensure visible
    agendar(() => {
      if (!operacaoContinuaAtual()) return;
      if (input) input.focus();
      else if (botao) botao.focus();
    }, 0);
    document.addEventListener("keydown", keydownHandlerLevelUp);

    function validarInput() {
      const valor = Number(input.value);
      const max = obterMaxDadoVidaFromString(dadoVida);

      const valido = !isNaN(valor) && valor >= 1 && valor <= max;

      botao.disabled = !valido;

      if (valido) {
        input.classList.remove("invalido");
      } else {
        input.classList.add("invalido");
      }

      if (totalVida) {
        totalVida.innerHTML = valido
          ? `Total: <strong>${valor + modCon}</strong>`
          : "Total: <strong>-</strong>";
      }

      return valido;
    }

    function atualizarHistoricoVidaLevelUp() {
      if (!historicoVida) return;

      const historico = [...historicoRolagensVida].reverse();
      if (!historico.length) {
        historicoVida.textContent = "-";
        return;
      }

      const maior = Math.max(...historicoRolagensVida);
      const menor = Math.min(...historicoRolagensVida);

      historicoVida.innerHTML = historico
        .map((valor) => {
          const ehMaior = valor === maior;
          const ehMenor = valor === menor;
          const sufixo = ehMaior ? "⇧" : ehMenor ? "⇩" : "";
          return criarBotaoHistoricoDado(valor, sufixo, ehMaior || ehMenor);
        })
        .join(", ");
    }

    handlers.dado = () => {
      if (!input || !btnDado) return;
      if (!operacaoContinuaAtual()) return;

      btnDado.classList.add("rolando");

      const pendingRoll = animarRolagemNoCampo(input, 1, max, 1000, 60);
      pendingRolls.add(pendingRoll);
      pendingRoll.then((rolagem) => {
        if (!operacaoContinuaAtual() || !rolagem) return;
        btnDado.classList.remove("rolando");
        const resultado = rolagem?.resultados?.[0];

        if (dadoDetalhe) {
          dadoDetalhe.textContent = Number.isInteger(resultado)
            ? `[${resultado}]`
            : dadoVida || `d${max}`;
        }

        if (rolagem?.resultados?.length) {
          historicoRolagensVida.push(resultado);
          atualizarHistoricoVidaLevelUp();
          btnDado.title = `${dadoVida}: ${rolagem.resultados.join(", ")}`;
          btnDado.setAttribute(
            "aria-label",
            `Rolar ${dadoVida}. Último resultado ${rolagem.resultados.join(", ")}`,
          );
        }

        validarInput();
      }).finally(() => { pendingRolls.delete(pendingRoll); });
    };
    btnDado.onclick = handlers.dado;

    // valida enquanto digita
    handlers.input = validarInput;
    input.oninput = handlers.input;
    if (historicoVida) {
      handlers.historico = (evento) => {
        const botaoHistorico = evento.target.closest("[data-valor-rolagem]");
        if (!botaoHistorico) return;

        aplicarHistoricoDadoNoInput(
          "inputVidaLevelUp",
          botaoHistorico.dataset.valorRolagem,
        );
      };
      historicoVida.onclick = handlers.historico;
    }

    // inicia bloqueado
    botao.disabled = true;
    input.classList.add("invalido");

    // botão confirmar
    handlers.confirmar = () => {
      if (!operacaoContinuaAtual()) return;
      if (!validarInput()) return;

      const valor = Number(input.value);

      limparLevelUp();
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");

      finalizar(valor);
    };
    botao.onclick = handlers.confirmar;
    let cancelar;
    function finalizar(valor) {
      limparLevelUp(false);
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
      btnDado?.classList.remove("rolando");
      resolverUmaVez(resolve, valor);
    }
    cancelar = async () => {
      finalizar(null);
      if (pendingRolls.size) await Promise.allSettled([...pendingRolls]);
    };
    operacao.cancel = cancelar;
    operacoesModaisXPLevelUp.add(operacao);
    atualizarFicha();
  });
}
// ===== Lógica de Cálculo de Vida e Dado de Vida =====
function calcularModCon() {
  const conInput = document.getElementById("con");
  const con = Number(conInput.value) || 10;

  return Math.floor((con - 10) / 2);
}

function atualizarVidaMaxNivelUm() {
  const campoNivel = document.getElementById("classeNivelID");
  const campoPvTotal = document.getElementById("pvTotal");
  const campoPvAtual = document.getElementById("pvAtual");
  if (!campoNivel || !campoPvTotal || !campoPvAtual) return;

  const nivel = parseInt(campoNivel.value, 10) || 1;
  if (nivel !== 1) return;

  const dadoVida = obterMaxDadoVida();
  const modCon = calcularModCon();
  const novoPvMax = Math.max(1, dadoVida + modCon);

  campoPvTotal.value = novoPvMax;
  campoPvAtual.value = novoPvMax;
}

function obterDadoDeVida() {
  const dado = document.getElementById("dadosVidaTipo")?.value || "1d8";
  return dado;
}

function formatarDadoVidaTexto() {
  const dado = obterDadoDeVida();
  const mod = calcularModCon();

  if (mod >= 0) {
    return `${dado} +${mod}`;
  } else {
    return `${dado} ${mod}`; // já vem negativo
  }
}

// ===== Lógica de Level Up =====
async function processarLevelUp(nivelAntigo, nivelNovo) {
  if (bloqueandoLevelUp || window.__fichaImportacaoTransacaoAtiva) return;
  const epochImportacao = window.__fichaImportacaoEpoch || 0;
  const nivelContinuaAtual = () =>
    (window.__fichaImportacaoEpoch || 0) === epochImportacao;

  for (let nivel = nivelAntigo + 1; nivel <= nivelNovo; nivel++) {
    if (window.__fichaImportacaoTransacaoAtiva) break;
    const bonusProf = calcularBonusProf(nivel);

    const ganhoHP = await abrirModalLevelUp({
      nivelAnterior: nivel - 1,
      nivelAtual: nivel,
      bonusProf,
      dadoVida: document.getElementById("dadosVidaTipo")?.value,
    });

    if (!nivelContinuaAtual()) break;
    if (ganhoHP === null) break;

    const hpMaxInput = document.getElementById("pvTotal");
    let hpAtual = Number(hpMaxInput.value) || 0;

    const modCon = calcularModCon();
    hpMaxInput.value = hpAtual + ganhoHP + modCon;
    hpMaxInput.dispatchEvent(new Event("input"));
  }
}

// 🔥 para testes rápidos sem backend, descomente a linha abaixo e comente a linha acima
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("classeNivelID")
    .addEventListener("input", atualizarDadosVidaTotal);

  document.getElementById("btnAddXP").addEventListener("click", async () => {
    const epochImportacao = window.__fichaImportacaoEpoch || 0;
    const operacaoContinuaAtual = () =>
      (window.__fichaImportacaoEpoch || 0) === epochImportacao;
    const xpInput = document.getElementById("xp");
    const xpAtual = Number(xpInput.value);
    const valor = await abrirModalAdicionarXP();

    if (!operacaoContinuaAtual()) return;
    if (valor !== null && valor !== undefined) {
      const novo = xpAtual + valor;

      // calcula limites do nível atual (mesma lógica que usar em atualizarXPENivel)
      let xpNivelAtual = 0;
      let xpProximoNivel = tabelaXP[tabelaXP.length - 1].xp;
      for (let i = 0; i < tabelaXP.length; i++) {
        if (xpAtual >= tabelaXP[i].xp) {
          xpNivelAtual = tabelaXP[i].xp;
          if (tabelaXP[i + 1]) xpProximoNivel = tabelaXP[i + 1].xp;
        }
      }
      const denom = Math.max(1, xpProximoNivel - xpNivelAtual);

      const xpBar = document.getElementById("xpBar");
      const xpBarNext = document.getElementById("xpBarNext");
      const xpBarCurrent = document.getElementById("xpBarCurrent");

      const animateBar = (toPercent, duration) =>
        new Promise((res) => {
          // escolher elemento a animar: em NÍVEL 1 animamos a camada base (xpBarCurrent),
          // caso contrário animamos a camada overlay (xpBarNext). Isso evita que
          // ambas cresçam ao mesmo tempo no nível 1.
          let nivelAtualCalc = 1;
          for (let i = 0; i < tabelaXP.length; i++) {
            if (xpAtual >= tabelaXP[i].xp) {
              nivelAtualCalc = tabelaXP[i].nivel;
            } else {
              break;
            }
          }

          const target =
            (nivelAtualCalc === 1 ? xpBarCurrent : xpBarNext) ||
            xpBarNext ||
            xpBarCurrent ||
            xpBar;
          if (!target) {
            res();
            return;
          }
          let settled = false;
          let timer;
          let resolveDrain;
          const drain = new Promise((resolve) => { resolveDrain = resolve; });
          const finish = () => {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            operacoesModaisXPLevelUp.delete(operacaoVisualXP);
            res();
            resolveDrain();
          };
          const operacaoVisualXP = {
            kind: "xpAnimation",
            get settled() { return settled; },
            focusTarget: () => document.getElementById("btnAddXP"),
            cancel: () => {
              target.style.transition = "";
              finish();
              return drain;
            },
          };
          operacoesModaisXPLevelUp.add(operacaoVisualXP);
          target.style.transition = `width ${duration}ms ease`;
          target.style.width = `${toPercent}%`;
          timer = setTimeout(() => {
            if (!operacaoContinuaAtual()) {
              // A importação/cancelamento já reconcilia a barra. Um callback
              // antigo não deve tocar nela: pode haver uma animação legítima
              // mais nova no mesmo elemento.
              finish();
              return;
            }
            // se animamos até 100%, movemos a ponta para a esquerda (wrap)
            try {
              const tip =
                (target &&
                  target.querySelector &&
                  target.querySelector(".xp-bar-tip")) ||
                null;
              if (tip && toPercent >= 100) {
                tip.style.left = "0";
                tip.style.right = "auto";
                tip.style.transform = "translate(-50%, -50%)";
              }
            } catch (err) {}
            target.style.transition = "";
            finish();
          }, duration + 40);
        });

      if (novo >= xpProximoNivel) {
        // anima até 100% antes de aplicar o XP e disparar level-up
        await animateBar(100, 800);
        if (!operacaoContinuaAtual()) return;
        setXP(novo);
      } else {
        const progressoNovo = Math.max(
          0,
          Math.min(1, (novo - xpNivelAtual) / denom),
        );
        await animateBar(progressoNovo * 100, 600);
        if (!operacaoContinuaAtual()) return;
        setXP(novo);
      }
    }
  });

  document.getElementById("xp").addEventListener("input", () => {
    setXP(document.getElementById("xp").value);
  });

  atualizarXPENivel();
});
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.item-card[data-tipo="arma"]').forEach((card) => {
    atualizarOpcoesMunicao(card);
  });
});

function setXP(valor) {
  const xpInput = document.getElementById("xp");
  const texto = typeof valor === "string" ? valor.trim() : "";
  const numero = typeof valor === "number" ? valor : Number(texto);
  const formatoValido = typeof valor === "number" || /^\+?(?:\d+)(?:e[+-]?\d+)?$/i.test(texto);
  if (
    !formatoValido ||
    !Number.isFinite(numero) ||
    !Number.isInteger(numero) ||
    numero < 0
  ) {
    xpInput.setCustomValidity?.("Informe um total de XP inteiro e não negativo.");
    xpInput.setAttribute?.("aria-invalid", "true");
    const ultimoXPValido = xpInput.dataset?.xpValido;
    if (ultimoXPValido !== undefined) xpInput.value = ultimoXPValido;
    return false;
  }

  xpInput.setCustomValidity?.("");
  xpInput.removeAttribute?.("aria-invalid");
  xpInput.value = numero;
  atualizarXPENivel(); // sempre atualiza nível, vida e apresentação visual
  return true;
}

document.addEventListener("change", (e) => {
  if (e.target.matches('[data-campo="arma_tipo"]')) {
    const card = e.target.closest('.item-card[data-tipo="arma"]');
    if (card) {
      atualizarProficienciaCard(card);
    }
  }
});

function atualizarXPENivel(opcoes = {}) {
  const apenasVisual = opcoes?.apenasVisual === true;
  const xpInput = document.getElementById("xp");
  const nivelInput = document.getElementById("classeNivelID");
  const xpBarCurrent = document.getElementById("xpBarCurrent");
  const xpBarNext = document.getElementById("xpBarNext");
  const xpTexto = document.getElementById("xpTexto");
  const xpCurrentValue = document.getElementById("xpCurrentValue");
  const xpThresholdValue = document.getElementById("xpThresholdValue");
  const xpLevelLabel = document.getElementById("xpLevelLabel");
  const xpTooltip = document.getElementById("xpTooltip");

  const valorXP = xpInput.value;
  const textoXP = typeof valorXP === "string" ? valorXP.trim() : "";
  const xp = typeof valorXP === "number" ? valorXP : Number(textoXP);
  // Input type=number pode serializar inteiros grandes em notação exponencial.
  // Aceitamos essa forma apenas quando o valor numérico continua inteiro.
  const formatoXP = typeof valorXP === "number" || /^\+?(?:\d+)(?:e[+-]?\d+)?$/i.test(textoXP);
  if (
    !formatoXP ||
    !Number.isFinite(xp) ||
    !Number.isInteger(xp) ||
    xp < 0
  ) {
    xpInput.setCustomValidity?.("Informe um total de XP inteiro e não negativo.");
    xpInput.setAttribute?.("aria-invalid", "true");
    const ultimoXPValido = xpInput.dataset?.xpValido;
    if (ultimoXPValido !== undefined) xpInput.value = ultimoXPValido;
    return false;
  }
  xpInput.setCustomValidity?.("");
  xpInput.removeAttribute?.("aria-invalid");
  if (xpInput.dataset) xpInput.dataset.xpValido = String(xp);

  // 🔹 calcular nível
  let nivelAtual = 1;
  let xpNivelAtual = 0;
  let xpProximoNivel = tabelaXP[tabelaXP.length - 1].xp;

  for (let i = 0; i < tabelaXP.length; i++) {
    if (xp >= tabelaXP[i].xp) {
      nivelAtual = tabelaXP[i].nivel;
      xpNivelAtual = tabelaXP[i].xp;

      if (tabelaXP[i + 1]) {
        xpProximoNivel = tabelaXP[i + 1].xp;
      }
    }
  }

  if (!apenasVisual) {
    const nivelAnterior = Number(nivelInput.value) || 1;
    nivelInput.value = nivelAtual;
    atualizarDadosVidaTotal();

    // 🔥 DETECTAR LEVEL UP
    if (nivelAtual > nivelAnterior) {
      processarLevelUp(nivelAnterior, nivelAtual);
    }
  }

  // 🔹 calcular somente a faixa do nível atual; o XP acumulado não é zerado.
  let progresso = 1;

  if (nivelAtual < 20) {
    progresso = (xp - xpNivelAtual) / (xpProximoNivel - xpNivelAtual);
  }

  progresso = Math.max(0, Math.min(1, progresso));

  // Uma barra, duas camadas sobrepostas. A base representa a faixa anterior
  // (ou o trilho neutro no nível 1); a camada superior representa a faixa atual.
  if (xpBarCurrent && xpBarNext) {
    const corAnterior = PALETA_XP_NIVEIS[Math.max(0, nivelAtual - 2)];
    const corAtual = PALETA_XP_NIVEIS[nivelAtual - 1];
    xpBarCurrent.style.background = nivelAtual === 1 ? corAtual : corAnterior;
    xpBarNext.style.background = corAtual;

    // âncoras à esquerda (preenchimento left→right)
    xpBarCurrent.style.left = "0";
    xpBarNext.style.left = "0";
    xpBarCurrent.style.right = "auto";
    xpBarNext.style.right = "auto";

    if (nivelAtual > 1) {
      // se já existe um nível anterior, a camada base fica fixa e não sofre transição
      xpBarCurrent.style.transition = "none";
      xpBarCurrent.style.width = "100%";

      // camada ativa (overlay) cresce sobre a base
      xpBarNext.style.transition = apenasVisual ? "none" : "width 0.3s ease";
      xpBarNext.style.width = progresso * 100 + "%";
    } else {
      // nível 1: não há base fixa — usamos apenas a camada current para mostrar progresso
      xpBarCurrent.style.transition = apenasVisual ? "none" : "width 0.3s ease";
      xpBarCurrent.style.width = progresso * 100 + "%";
      xpBarNext.style.transition = "none";
      xpBarNext.style.width = "0%";
    }

    // As cores são opacas para manter contraste entre as faixas; o marcador
    // independente acompanha a largura e não depende da cor ou do gradiente.
    try {
      const tipCurrent = xpBarCurrent.querySelector(".xp-bar-tip");
      const tipNext = xpBarNext.querySelector(".xp-bar-tip");

      if (nivelAtual > 1) {
        xpBarCurrent.style.opacity = "1";
        xpBarNext.style.opacity = "1";

        if (tipNext) tipNext.style.opacity = "0";
        if (tipCurrent) tipCurrent.style.opacity = "0";
      } else {
        xpBarCurrent.style.opacity = "1";
        xpBarNext.style.opacity = "1";

        if (tipCurrent) tipCurrent.style.opacity = "0";
        if (tipNext) tipNext.style.opacity = "0";
      }
    } catch (err) {
      // ignorar se elementos não existirem
    }
  }

  const marcador = document.getElementById("xpProgressMarker");
  const percentual = Math.round(progresso * 1000) / 10;
  if (marcador) {
    marcador.style.left = `${percentual}%`;
    marcador.setAttribute("aria-hidden", "true");
  }
  const formatarXP = (valor) => new Intl.NumberFormat("pt-BR").format(valor);
  const percentualTexto = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(percentual);

  // O total e o limite ficam fora da barra; o nível e a faixa também são
  // anunciados por texto acessível e pelo tooltip associado à barra.
  const xpRestante = Math.max(0, xpProximoNivel - xp);
  if (xpLevelLabel) xpLevelLabel.textContent = `NÍVEL ${nivelAtual}`;
  if (xpCurrentValue) xpCurrentValue.textContent = formatarXP(xp);
  if (nivelAtual < 20) {
    if (xpThresholdValue) xpThresholdValue.textContent = `/ ${formatarXP(xpProximoNivel)} XP`;
    xpTexto.textContent =
      `${formatarXP(xp)} / ${formatarXP(xpProximoNivel)} XP · Nível ${nivelAtual} · ` +
      `${percentualTexto}% até o nível ${nivelAtual + 1}`;
    if (xpTooltip) xpTooltip.textContent =
      `Faltam ${formatarXP(xpRestante)} XP para o nível ${nivelAtual + 1}`;
  } else {
    if (xpThresholdValue) xpThresholdValue.textContent = "XP acumulados";
    xpTexto.textContent = `${formatarXP(xp)} XP acumulados · Nível 20 (máximo)`;
    if (xpTooltip) xpTooltip.textContent = "Nível máximo alcançado";
  }

  const xpBar = document.getElementById("xpBar");
  if (xpBar) {
    xpBar.setAttribute("role", "progressbar");
    xpBar.setAttribute("aria-label", "Progresso de XP na faixa do nível atual");
    xpBar.setAttribute("aria-valuemin", "0");
    xpBar.setAttribute("aria-valuemax", "100");
    xpBar.setAttribute("aria-valuenow", String(percentual));
    xpBar.setAttribute("aria-valuetext", xpTexto.textContent);
  }
  return true;
}

document.getElementById("xp").addEventListener("input", atualizarXPENivel);

const tabelaXP = [
  { xp: 0, nivel: 1 },
  { xp: 300, nivel: 2 },
  { xp: 900, nivel: 3 },
  { xp: 2700, nivel: 4 },
  { xp: 6500, nivel: 5 },
  { xp: 14000, nivel: 6 },
  { xp: 23000, nivel: 7 },
  { xp: 34000, nivel: 8 },
  { xp: 48000, nivel: 9 },
  { xp: 64000, nivel: 10 },
  { xp: 85000, nivel: 11 },
  { xp: 100000, nivel: 12 },
  { xp: 120000, nivel: 13 },
  { xp: 140000, nivel: 14 },
  { xp: 165000, nivel: 15 },
  { xp: 195000, nivel: 16 },
  { xp: 225000, nivel: 17 },
  { xp: 265000, nivel: 18 },
  { xp: 305000, nivel: 19 },
  { xp: 355000, nivel: 20 },
];

// Luminância alternada e matizes distintos mantêm as faixas separáveis em
// escala de cinza e sob simulações comuns de daltonismo. Os pares foram
// avaliados com a paleta efetiva, sem transparência entre as duas camadas.
const PALETA_XP_NIVEIS = [
  "#18324A", "#F2C14E", "#542E6F", "#72DDF7", "#5B2333",
  "#E8F1F2", "#243B1E", "#F4A259", "#3D405B", "#F2CC8F",
  "#6D213C", "#B8F2E6", "#284B63", "#F4D35E", "#4C2A85",
  "#A8DADC", "#3A2618", "#D7E3FC", "#5F0F40", "#FAA916",
];

function calcularNivelPorXP(xp) {
  let nivel = 1;

  for (let i = 0; i < tabelaXP.length; i++) {
    if (xp >= tabelaXP[i].xp) {
      nivel = tabelaXP[i].nivel;
    } else {
      break;
    }
  }

  return nivel;
}

function atualizarNivel() {
  const xpInput = document.getElementById("xp");
  const nivelInput = document.getElementById("classeNivelID");

  const xp = parseInt(xpInput.value) || 0;
  const nivel = calcularNivelPorXP(xp);

  nivelInput.value = nivel;

  // 🔥 ESSENCIAL
  atualizarFicha();
}

// ===== Lógica de Bônus de Proficiência =====
function setBonusProficiencia(valor) {
  const input = document.getElementById("bonusProf");
  if (!input) return;

  input.dataset.valor = valor; // valor real
  input.value = valor >= 0 ? `+${valor}` : `${valor}`;
}
function getBonusProficiencia() {
  return getBonusProf();
}

document
  .getElementById("classeNivelID")
  .addEventListener("input", atualizarBonusProficiencia);

function atualizarBonusProficiencia() {
  const bonus = getBonusProficiencia();
  const campo = document.getElementById("bonusProf");

  if (!campo) return;

  const valorFormatado = `+${bonus}`;

  if (campo.value !== valorFormatado) {
    campo.value = valorFormatado;
    campo.setAttribute("value", valorFormatado);
    campo.dataset.valor = bonus;
  }
}
