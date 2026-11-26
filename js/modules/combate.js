// ===== Classe de armadura e resumo de combate =====
const CONDICOES_DND = RegrasCondicoesCombate.condicoesOficiais;

function agendarFocoModalCombate(campo) {
  const epochInicial = window.__fichaImportacaoEpoch || 0;
  setTimeout(() => {
    if (
      (window.__fichaImportacaoEpoch || 0) !== epochInicial ||
      window.__fichaImportacaoTransacaoAtiva ||
      !campo?.isConnected
    )
      return;
    campo.focus();
  }, 0);
}

function gerarIdCondicaoAtiva() {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid || `condicao-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function migrarCondicoesLegadas(texto) {
  return RegrasCondicoesCombate.migrarTextoLegado(texto, gerarIdCondicaoAtiva);
}

function projetarCondicoesAtivasParaCampo() {
  const campo = document.getElementById("ataqueCondicao");
  if (!campo) return;
  const condicoes = Array.isArray(estadoCombateIniciativa.condicoesAtivas)
    ? estadoCombateIniciativa.condicoesAtivas
    : [];
  campo.value = condicoes.filter((condicao) => condicao?.estado === "ativa")
    .map((condicao) => String(condicao.nome || "").trim()).filter(Boolean).join(", ");
  if (campo.style) {
    campo.style.height = "20px";
    campo.style.height = `${Math.min(campo.scrollHeight || 20, 120)}px`;
  }
  if (typeof window !== "undefined") window.FichaDnDCombateLayoutV2?.atualizar();
}

function atualizarCondicoesEstruturadas(selecionadas, personalizadas, nivelExaustao) {
  const anteriores = Array.isArray(estadoCombateIniciativa.condicoesAtivas)
    ? estadoCombateIniciativa.condicoesAtivas
    : [];
  const atuais = [...selecionadas, ...personalizadas]
    .map((nome) => String(nome || "").trim())
    .filter(Boolean)
    .filter((nome, indice, lista) => lista.findIndex((item) => item.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR")) === indice);
  estadoCombateIniciativa.condicoesAtivas = RegrasCondicoesCombate.reconciliar(anteriores, atuais, nivelExaustao, gerarIdCondicaoAtiva);
  projetarCondicoesAtivasParaCampo();
}

function inicializarSeletorCondicoes() {
  const campo = document.getElementById("ataqueCondicao");
  const overlay = document.getElementById("condicoesModalOverlay");
  const checklist = document.getElementById("condicoesChecklist");
  const personalizada = document.getElementById("condicaoPersonalizada");
  const nivelExaustao = document.getElementById("condicaoExaustaoNivel");
  const controleExaustao = document.getElementById("condicaoExaustaoControle");
  if (!campo || !overlay || !checklist || !personalizada) return;

  checklist.innerHTML = CONDICOES_DND.map(
    (condicao) => `
      <label class="condicao-checkitem">
        <input type="checkbox" value="${condicao}" />
        <span>${condicao}</span>
      </label>`,
  ).join("");

  const ajustarAlturaCampo = () => {
    if (!campo.style) return;
    campo.style.height = "20px";
    campo.style.height = `${Math.min(campo.scrollHeight || 20, 120)}px`;
  };

  const atualizarCampo = () => {
    const selecionadas = Array.from(
      checklist.querySelectorAll("input:checked"),
    ).map((input) => input.value);
    const customizada = personalizada.value.trim();
    const customizadas = customizada.split(",").map((nome) => nome.trim()).filter(Boolean);
    atualizarCondicoesEstruturadas(selecionadas, customizadas, nivelExaustao?.value);
    ajustarAlturaCampo();
  };

  const atualizarControleExaustao = () => {
    if (controleExaustao) {
      const visivel = !!checklist.querySelector('input[value="Exausto"]')?.checked;
      controleExaustao.hidden = !visivel;
      controleExaustao.style.display = visivel ? "flex" : "none";
    }
  };

  const abrir = () => {
    if (!Array.isArray(estadoCombateIniciativa.condicoesAtivas) || !estadoCombateIniciativa.condicoesAtivas.length) {
      estadoCombateIniciativa.condicoesAtivas = migrarCondicoesLegadas(campo.value);
    }
    const atuais = estadoCombateIniciativa.condicoesAtivas.filter((condicao) => condicao.estado === "ativa");
    checklist.querySelectorAll("input").forEach((input) => {
      input.checked = atuais.some((condicao) => condicao.nome.toLocaleLowerCase("pt-BR") === input.value.toLocaleLowerCase("pt-BR"));
    });
    personalizada.value = atuais.filter((condicao) => condicao.tipo === "personalizada").map((condicao) => condicao.nome).join(", ");
    if (nivelExaustao) nivelExaustao.value = String(atuais.find((condicao) => condicao.nome === "Exausto")?.nivelExaustao || 1);
    atualizarControleExaustao();
    ajustarAlturaCampo();
    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");
    personalizada.focus();
  };

  const fechar = () => {
    atualizarCampo();
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
    campo.focus();
  };

  campo.addEventListener("click", abrir);
  campo.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      abrir();
    }
  });
  checklist.addEventListener("change", atualizarCampo);
  checklist.addEventListener("change", atualizarControleExaustao);
  personalizada.addEventListener("input", atualizarCampo);
  nivelExaustao?.addEventListener("input", atualizarCampo);
  document
    .getElementById("condicoesModalFechar")
    ?.addEventListener("click", fechar);
  document
    .getElementById("condicoesModalConcluir")
    ?.addEventListener("click", fechar);
  document
    .getElementById("condicoesLimparTodas")
    ?.addEventListener("click", () => {
      checklist
        .querySelectorAll("input")
        .forEach((input) => (input.checked = false));
      personalizada.value = "";
      atualizarCampo();
    });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && overlay.style.display === "flex") fechar();
  });
  ajustarAlturaCampo();
}

document.addEventListener("DOMContentLoaded", inicializarSeletorCondicoes);

function atualizarClasseArmaduraEquipada() {
  const armaduraCA =
    parseInt(document.getElementById("armaduraCA")?.value) || 0;
  const outrosCA =
    parseInt(document.getElementById("outroEquipadoCA")?.value) || 0;
  const escudoCA = parseInt(document.getElementById("escudoCA")?.value) || 0;

  const campoCA = document.getElementById("ca_valor");
  const emojiEscudo = document.getElementById("ca_escudo_emoji");

  if (campoCA) campoCA.value = armaduraCA + outrosCA + escudoCA;
  if (emojiEscudo) emojiEscudo.classList.toggle("ativo", escudoCA > 0);

  const indiceArmadura =
    typeof normalizarIndiceEquipamento === "function"
      ? normalizarIndiceEquipamento(armaduraEquipadaIndice)
      : null;
  const cardsArmadura = [
    ...document.querySelectorAll(
      '#listaArmaduras .item-card[data-tipo="armadura"]',
    ),
  ];
  const cardArmadura =
    indiceArmadura !== null ? cardsArmadura[indiceArmadura] : null;
  let iconeArmadura = cardArmadura?.dataset.catalogoIcone?.trim() || "";
  const catalogoIdArmadura = cardArmadura?.dataset.catalogoId?.trim() || "";

  if (!iconeArmadura && catalogoIdArmadura) {
    const catalogoArmaduras =
      typeof estadoCatalogoArmaduras === "object"
        ? estadoCatalogoArmaduras.dados
        : null;
    const origemArmadura = catalogoArmaduras?.itens?.find(
      (item) =>
        item.id === catalogoIdArmadura || item.idLegado === catalogoIdArmadura,
    );
    iconeArmadura =
      typeof origemArmadura?.icone === "string"
        ? origemArmadura.icone.trim()
        : "";

    if (iconeArmadura) {
      cardArmadura.dataset.catalogoIcone = iconeArmadura;
    } else if (typeof carregarCatalogoArmaduras === "function") {
      carregarCatalogoArmaduras()
        .then((dados) => {
          const itemCatalogado = dados?.itens?.find(
            (item) =>
              item.id === catalogoIdArmadura ||
              item.idLegado === catalogoIdArmadura,
          );
          if (
            typeof itemCatalogado?.icone === "string" &&
            itemCatalogado.icone.trim()
          ) {
            cardArmadura.dataset.catalogoIcone = itemCatalogado.icone;
            atualizarClasseArmaduraEquipada();
          }
        })
        .catch(() => {});
    }
  }

  const imagemArmadura = document.getElementById("ataqueCaArmaduraArt");
  const desenhoEscudo = document.querySelector(
    "#combate .combat-v2-ac-shield-art",
  );
  const moldeEscudo = imagemArmadura?.closest(".shield");
  if (imagemArmadura) {
    if (iconeArmadura) {
      imagemArmadura.hidden = false;
      imagemArmadura.src = iconeArmadura;
      if (desenhoEscudo) desenhoEscudo.hidden = true;
      moldeEscudo?.classList.add("input-armadura");
      imagemArmadura.onerror = () => {
        imagemArmadura.hidden = true;
        if (desenhoEscudo) desenhoEscudo.hidden = false;
        moldeEscudo?.classList.remove("input-armadura");
      };
    } else {
      imagemArmadura.hidden = true;
      imagemArmadura.removeAttribute("src");
      if (desenhoEscudo) desenhoEscudo.hidden = false;
      moldeEscudo?.classList.remove("input-armadura");
    }
  }

  atualizarResumoAtaquesConjuracao();
}

function formatarCA(valor) {
  const numero = parseInt(valor) || 0;
  return "+" + numero;
}

function aplicarFormatoCA(id) {
  const campo = document.getElementById(id);
  if (!campo) return;

  const valor = parseInt(campo.value) || 0;

  if (id === "escudoCA") {
    campo.value = formatarCA(valor);
    return;
  }

  campo.value = valor;
}

function atualizarResumoAtaquesConjuracao() {
  const caBase = parseInt(document.getElementById("ca_valor")?.value) || 0;
  const caEscudo = parseInt(document.getElementById("escudoCA")?.value) || 0;
  const pvAtual = parseInt(document.getElementById("pvAtual")?.value) || 0;

  const campoAtaqueCA = document.getElementById("ataqueCaTotal");
  const campoAtaqueEscudo = document.getElementById("ataqueCaEscudo");
  const emojiAtaqueEscudo = document.getElementById("ataqueCaEscudoEmoji");
  const campoAtaquePV = document.getElementById("ataquePvAtual");

  if (campoAtaqueCA) campoAtaqueCA.value = caBase;
  if (campoAtaqueEscudo) campoAtaqueEscudo.value = formatarCA(caEscudo);
  if (emojiAtaqueEscudo) {
    emojiAtaqueEscudo.classList.toggle("ativo", caEscudo > 0);

    let iconeEscudo = "";
    const cardsEscudo = [
      ...document.querySelectorAll(
        '#listaEscudosItens > .item-card[data-tipo="escudo"]:not(#escudoModelo)',
      ),
    ];
    const checkboxAtivo = document.querySelector(
      "#lista-escudos-equipamento input:checked",
    );
    const indiceCheckbox = Number(checkboxAtivo?.dataset.index);
    const valorSlotSecundario =
      document.getElementById("arma2Nome")?.value || "";
    const indiceSlot =
      typeof extrairIndiceSlotEscudo === "function"
        ? extrairIndiceSlotEscudo(valorSlotSecundario)
        : null;
    const indiceEscudo =
      indiceSlot !== null
        ? indiceSlot
        : Number.isInteger(indiceCheckbox)
          ? indiceCheckbox
          : null;
    const cardEscudo = indiceEscudo !== null ? cardsEscudo[indiceEscudo] : null;

    if (cardEscudo) {
      iconeEscudo = cardEscudo.dataset.catalogoEscudoIcone?.trim() || "";
      if (!iconeEscudo) {
        iconeEscudo =
          cardEscudo
            .querySelector('[data-campo="escudo_icone"]')
            ?.value?.trim() || "";
      }

      if (!iconeEscudo) {
        const catalogoId = cardEscudo.dataset.catalogoEscudoId?.trim() || "";
        if (catalogoId && typeof estadoCatalogoEscudos === "object") {
          const origem = estadoCatalogoEscudos.dados?.itens?.find(
            (item) => item.id === catalogoId || item.idLegado === catalogoId,
          );
          iconeEscudo = origem?.icone?.trim() || "";
        }
        if (
          !iconeEscudo &&
          catalogoId &&
          typeof carregarCatalogoEscudos === "function"
        ) {
          carregarCatalogoEscudos()
            .then((dados) => {
              const origem = dados?.itens?.find(
                (item) =>
                  item.id === catalogoId || item.idLegado === catalogoId,
              );
              if (origem?.icone) {
                cardEscudo.dataset.catalogoEscudoIcone = origem.icone;
                atualizarResumoAtaquesConjuracao();
              }
            })
            .catch(() => {});
        }
      }
    }

    const imagemEscudo = emojiAtaqueEscudo.querySelector("img");
    if (iconeEscudo) {
      if (imagemEscudo) {
        imagemEscudo.src = iconeEscudo;
      } else {
        const novaImagem = document.createElement("img");
        novaImagem.className = "bonus-escudo-icone-svg";
        novaImagem.alt = "";
        novaImagem.setAttribute("aria-hidden", "true");
        novaImagem.src = iconeEscudo;
        novaImagem.onerror = () => {
          emojiAtaqueEscudo.replaceChildren("🛡️");
        };
        emojiAtaqueEscudo.replaceChildren(novaImagem);
      }
      emojiAtaqueEscudo.classList.remove("glifo-escudo");
      emojiAtaqueEscudo.classList.add("icone-escudo-catalogado");
    } else {
      emojiAtaqueEscudo.replaceChildren("🛡️");
      emojiAtaqueEscudo.classList.remove("icone-escudo-catalogado");
      emojiAtaqueEscudo.classList.add("glifo-escudo");
    }
  }
  if (campoAtaquePV) {
    const textoPV = campoAtaquePV.querySelector("span");
    if (textoPV) textoPV.textContent = "PV " + pvAtual;
    else campoAtaquePV.textContent = "PV " + pvAtual;
  }
  window.FichaDnDCombateLayoutV2?.atualizar();
}

const estadoAtaqueArma = {
  arma: null,
  dado: null,
  resolucaoD20: null,
  totalAtaque: 0,
  modBase: 0,
  bonusProf: 0,
  rotuloAtributo: "",
  textoResumo: "",
  tipoAcao: "Ação",
  contextoAcao: "action",
  historicoRolagens: [],
  historicoRolagensDano: [],
  danoQtd: 1,
  danoFaces: 0,
  danoFormula: "",
  danoModBase: 0,
  ultimaRolagemDano: null,
  origem: "arma",
  modoAtaque: null,
  magia: null,
  nivelSlot: null,
  danoTipo: "",
  infoCD: "",
  aplicacaoEfeito: false,
  acaoTurnoConsumida: false,
};

const estadoCombateIniciativa = {
  ativo: false,
  rodada: 0,
  posicao: null,
  iniciativa: null,
  armasArremessadas: [],
  fontesVantagemDesvantagem: [],
  efeitosAtivos: [],
  concentracaoAtiva: null,
  condicoesAtivas: [],
  caracteristicasAtivas: [],
  historicoEventos: [],
  configuracaoRecursosTurno: { acao: 1, acaoBonus: 1, reacao: 1, ataquesPorAcao: 1 },
};

function normalizarContextoAcaoAtaque(contexto) {
  if (typeof RegrasCombate !== "undefined" && typeof RegrasCombate.normalizarContextoAcao === "function") {
    return RegrasCombate.normalizarContextoAcao(contexto);
  }
  return ({ action: "action", bonusAction: "bonusAction", reaction: "reaction", "Ação": "action", "Ação bônus": "bonusAction", "Reação": "reaction" })[contexto] || null;
}

function obterMovimentoTotalTurno() {
  return RegrasCombate.converterDeslocamentoParaPes(document.getElementById("deslocamento")?.value || "30m") ?? 30;
}

function obterAtaquesAdicionaisAcao() {
  const nivel = Number.parseInt(document.getElementById("classeNivelID")?.value, 10) || 1;
  const classe = typeof dadosClasse === "undefined" ? null : dadosClasse;
  const linhas = (classe?.niveis || []).filter((item) => Number.parseInt(item.nivel, 10) <= nivel);
  const linha = linhas.filter((item) => /Ataque Extra/i.test(String(item.caracteristicas || ""))).at(-1);
  const extra = String(linha?.caracteristicas || "").match(/Ataque Extra(?:\s*\((\d+)\))?/i);
  const classeNormalizada = String(classe?.nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (classeNormalizada === "guerreiro" && nivel >= 20) return 3;
  return extra ? Math.max(1, Number.parseInt(extra[1] || "1", 10)) : 0;
}

function criarRecursosTurnoCombate(rodada) {
  const limites = { ...estadoCombateIniciativa.configuracaoRecursosTurno };
  limites.ataquesPorAcao = Math.max(limites.ataquesPorAcao, 1 + obterAtaquesAdicionaisAcao());
  return RegrasCombate.criarRecursosTurno({ rodada, movimentoTotal: obterMovimentoTotalTurno(), limites, ataquesAcaoRestantes: limites.ataquesPorAcao - 1 });
}

function recursosTurnoCombateValidos(recursos, rodada) {
  return !!recursos && recursos.rodada === rodada &&
    ["acaoUsada", "acaoBonusUsada", "reacaoUsada", "ataqueDuasArmasElegivel", "ataqueAcaoIniciado"].every((chave) => typeof recursos[chave] === "boolean") &&
    [null, 1, 2].includes(recursos.maoAtaqueQualificador) && recursos.ataqueDuasArmasElegivel === (recursos.maoAtaqueQualificador !== null) &&
    (recursos.maosAtaqueQualificadoras === undefined || (Array.isArray(recursos.maosAtaqueQualificadoras) && recursos.maosAtaqueQualificadoras.every((mao) => mao === 1 || mao === 2) && new Set(recursos.maosAtaqueQualificadoras).size === recursos.maosAtaqueQualificadoras.length && recursos.maoAtaqueQualificador === (recursos.maosAtaqueQualificadoras[0] ?? null) && recursos.ataqueDuasArmasElegivel === (recursos.maosAtaqueQualificadoras.length > 0))) &&
    (!recursos.ataqueDuasArmasElegivel || (recursos.acaoUsada && recursos.ataqueAcaoIniciado)) &&
    Number.isInteger(recursos.ataquesAcaoRestantes) && recursos.ataquesAcaoRestantes >= 0 &&
    Number.isInteger(recursos.movimentoTotal) && recursos.movimentoTotal >= 0 &&
    Number.isInteger(recursos.movimentoGasto) && recursos.movimentoGasto >= 0 && recursos.movimentoGasto <= recursos.movimentoTotal &&
    (!recursos.limites || ["acao", "acaoBonus", "reacao", "ataquesPorAcao"].every((tipo) => Number.isInteger(recursos.limites[tipo]) && recursos.limites[tipo] >= 1 && recursos.limites[tipo] <= 20)) &&
    (!recursos.ajustesTemporarios || ["acao", "acaoBonus", "reacao", "ataquesPorAcao"].every((tipo) => Number.isInteger(recursos.ajustesTemporarios[tipo]) && recursos.ajustesTemporarios[tipo] >= -20 && recursos.ajustesTemporarios[tipo] <= 20)) &&
    (!recursos.gastos || ["acao", "acaoBonus", "reacao"].every((tipo) => Number.isInteger(recursos.gastos[tipo]) && recursos.gastos[tipo] >= 0 && recursos.gastos[tipo] <= 40));
}

function consumirAcaoTurnoCombate(tipoAcao, ataqueQualificadorDuasArmas = false, maoAtaqueQualificador = null, ataqueDeArma = false) {
  if (!estadoCombateIniciativa.ativo) return true;
  const contextoAcao = RegrasCombate.normalizarContextoAcao(tipoAcao);
  const rotuloAcao = contextoAcao === "action" ? "Ação" : contextoAcao === "bonusAction" ? "Ação bônus" : "Reação";
  const atual = estadoCombateIniciativa.recursosTurno;
  const ataqueAdicional = contextoAcao === "action" && atual?.ataqueAcaoIniciado && atual?.ataquesAcaoRestantes > 0;
  const proximo = RegrasCombate.consumirAcaoTurno(atual, contextoAcao, { ataqueQualificadorDuasArmas, maoAtaqueQualificador, maoAtaqueBonus: estadoAtaqueArma?.arma?.slot ?? null, ataqueDeArma, ataqueAdicional });
  if (!proximo) {
    const status = document.getElementById("combateRecursosTurnoStatus");
    if (status) status.textContent = contextoAcao === "bonusAction" && ataqueQualificadorDuasArmas && (!atual?.acaoUsada || !atual?.ataqueDuasArmasElegivel)
      ? "A ação Ataque com arma elegível precisa ocorrer antes da ação bônus de duas armas."
      : `${rotuloAcao} já foi usada neste turno.`;
    return false;
  }
  estadoCombateIniciativa.recursosTurno = proximo;
  atualizarInterfaceRecursosTurno();
  const status = document.getElementById("combateRecursosTurnoStatus");
  if (status) status.textContent = `${rotuloAcao} registrada.`;
  return true;
}

function consumirAcaoManualTurno(tipoAcao) {
  if (window.__fichaImportacaoTransacaoAtiva) return false;
  return consumirAcaoTurnoCombate(tipoAcao);
}

function abrirEditorRecursosTurno() {
  if (!estadoCombateIniciativa.ativo) return;
  const dialogo = document.getElementById("editarRecursosTurnoDialogo");
  if (!dialogo || dialogo.open) return;
  const limites = estadoCombateIniciativa.configuracaoRecursosTurno || { acao: 1, acaoBonus: 1, reacao: 1, ataquesPorAcao: 1 };
  const ajustes = estadoCombateIniciativa.recursosTurno?.ajustesTemporarios || { acao: 0, acaoBonus: 0, reacao: 0, ataquesPorAcao: 0 };
  [
    ["limiteAcaoTurno", limites.acao], ["limiteAcaoBonusTurno", limites.acaoBonus],
    ["limiteReacaoTurno", limites.reacao], ["limiteAtaquesPorAcaoTurno", limites.ataquesPorAcao],
    ["ajusteAcaoTurno", ajustes.acao], ["ajusteAcaoBonusTurno", ajustes.acaoBonus],
    ["ajusteReacaoTurno", ajustes.reacao], ["ajusteAtaquesPorAcaoTurno", ajustes.ataquesPorAcao],
  ].forEach(([id, value]) => { const campo = document.getElementById(id); if (campo) campo.value = String(value); });
  dialogo.showModal();
  dialogo.querySelector("input")?.focus();
}

function salvarConfiguracaoRecursosTurno() {
  if (!estadoCombateIniciativa.ativo || window.__fichaImportacaoTransacaoAtiva) return false;
  const ler = (id, minimo, maximo) => {
    const campo = document.getElementById(id);
    const valor = campo?.valueAsNumber;
    if (!Number.isInteger(valor) || valor < minimo || valor > maximo) { campo?.focus(); return null; }
    return valor;
  };
  const limites = {
    acao: ler("limiteAcaoTurno", 1, 20), acaoBonus: ler("limiteAcaoBonusTurno", 1, 20),
    reacao: ler("limiteReacaoTurno", 1, 20), ataquesPorAcao: ler("limiteAtaquesPorAcaoTurno", 1, 20),
  };
  const ajustes = {
    acao: ler("ajusteAcaoTurno", -20, 20), acaoBonus: ler("ajusteAcaoBonusTurno", -20, 20),
    reacao: ler("ajusteReacaoTurno", -20, 20), ataquesPorAcao: ler("ajusteAtaquesPorAcaoTurno", -20, 20),
  };
  if (Object.values(limites).some((valor) => valor === null) || Object.values(ajustes).some((valor) => valor === null)) return false;
  const recursos = estadoCombateIniciativa.recursosTurno;
  const limitesAtuais = recursos.limites || estadoCombateIniciativa.configuracaoRecursosTurno;
  const gastos = { acao: recursos.acaoUsada ? 1 : 0, acaoBonus: recursos.acaoBonusUsada ? 1 : 0, reacao: recursos.reacaoUsada ? 1 : 0, ...(recursos.gastos || {}) };
  const ataquesGastOs = Math.max(0, limitesAtuais.ataquesPorAcao + (recursos.ajustesTemporarios?.ataquesPorAcao || 0) - recursos.ataquesAcaoRestantes - 1);
  estadoCombateIniciativa.configuracaoRecursosTurno = limites;
  recursos.limites = { ...limites, ataquesPorAcao: Math.max(limites.ataquesPorAcao, 1 + obterAtaquesAdicionaisAcao()) };
  recursos.ajustesTemporarios = ajustes;
  recursos.gastos = gastos;
  const ataquesRestantesCalculados = Math.max(0, recursos.limites.ataquesPorAcao + ajustes.ataquesPorAcao - 1 - ataquesGastOs);
  recursos.ataquesAcaoRestantes = recursos.ataqueAcaoIniciado
    ? Math.min(recursos.ataquesAcaoRestantes, ataquesRestantesCalculados)
    : ataquesRestantesCalculados;
  atualizarInterfaceRecursosTurno();
  const status = document.getElementById("combateRecursosTurnoStatus");
  if (status) status.textContent = "Limites aplicados. Ajustes temporários terminam ao iniciar o próximo turno.";
  const dialogo = document.getElementById("editarRecursosTurnoDialogo");
  if (dialogo?.open) dialogo.close("salvo");
  return true;
}

function cancelarEditorRecursosTurno() {
  document.getElementById("editarRecursosTurnoDialogo")?.close("cancelado");
}

function atualizarInterfaceRecursosTurno() {
  const recursos = estadoCombateIniciativa.recursosTurno;
  const status = document.getElementById("combateRecursosTurnoStatus");
  const bloco = document.getElementById("combateRecursosTurno");
  bloco?.classList.toggle("oculto-combate", !estadoCombateIniciativa.ativo);
  atualizarIndicadorAtaquesRestantesTurno();
  if (!recursos || !status) return;
  const gastos = { acao: recursos.acaoUsada ? 1 : 0, acaoBonus: recursos.acaoBonusUsada ? 1 : 0, reacao: recursos.reacaoUsada ? 1 : 0, ...(recursos.gastos || {}) };
  const limites = recursos.limites || estadoCombateIniciativa.configuracaoRecursosTurno || { acao: 1, acaoBonus: 1, reacao: 1 };
  const ajustes = recursos.ajustesTemporarios || {};
  [
    ["combateAcaoSaldo", "acao", "acao"],
    ["combateAcaoBonusSaldo", "acaoBonus", "acaoBonus"],
    ["combateReacaoSaldo", "reacao", "reacao"],
  ].forEach(([id, tipo, limiteTipo]) => {
    const saldo = document.getElementById(id);
    const valor = saldo?.querySelector("strong");
    const limite = Math.max(0, (limites[limiteTipo] ?? 1) + (ajustes[limiteTipo] ?? 0));
    const restante = Math.max(0, limite - gastos[tipo]);
    if (valor) valor.textContent = `${restante}/${limite}`;
    if (saldo) saldo.dataset.disponibilidade = restante > 0 ? "disponivel" : "usada";
  });
  if (typeof atualizarStatusAtaqueBonusDuasArmas === "function") atualizarStatusAtaqueBonusDuasArmas();
}

const estadoModalIniciativa = {
  dado: null,
  bonus: 0,
  total: null,
  historicoRolagens: [],
};

let geracaoRolagemContextual = 0;
window.FichaDnDFontesVantagemDesvantagem = Object.freeze({
  // Compatibilidade temporária: dados antigos são mantidos, mas não aplicados.
  listar: () => [],
  sincronizar: () => {},
});

function obterResolucaoRolagemD20(prefixo, _escopo, resultados) {
  if (!Array.isArray(resultados) || !resultados.length) return null;
  const escolhido = resultados.at(-1);
  if (!Number.isInteger(escolhido) || escolhido < 1 || escolhido > 20) return null;
  return { modo: "normal", quantidadeD20: 1, vantagens: [], desvantagens: [], fontesAplicaveis: [], escolhido, resultados: [escolhido] };
}

function obterResolucaoManualD20Atual(prefixo, escopo, dado) {
  return obterResolucaoRolagemD20(prefixo, escopo, [dado]);
}

function obterEstadoCombateParaSalvar() {
  return JSON.parse(JSON.stringify(estadoCombateIniciativa));
}

const ATRIBUTOS_TESTE_RESISTENCIA = ["for", "des", "con", "int", "sab", "car"];
const estadoTesteResistencia = {
  atributo: "for",
  contextoPericia: null,
  dadoSistema: null,
  resolucaoD20: null,
  contextoConcentracao: null,
  filaConcentracao: [],
};
const tokenFechamentoResolvidoTesteResistencia = Symbol(
  "resistencia-resolvida",
);

function obterBonusTesteResistencia(chaveAtributo) {
  if (estadoTesteResistencia.contextoPericia) {
    const base = Number(String(estadoTesteResistencia.contextoPericia.campo?.value || "0").replace(/\+/g, ""));
    const situacional = Number(document.getElementById("modalTesteResistenciaBonusSituacional")?.value || "0");
    return Number.isInteger(base) && Number.isInteger(situacional) ? base + situacional : null;
  }
  const chave = String(chaveAtributo || "").toLowerCase();
  const campoSalvaguarda = document.getElementById("salv_" + chave);
  const bonusSalvaguarda = parseInt(
    String(campoSalvaguarda?.value || "").replace(/\+/g, ""),
    10,
  );
  if (Number.isInteger(bonusSalvaguarda)) return bonusSalvaguarda;

  return getModificadorBaseAtributo(chave) || 0;
}

function obterRotuloAtributoTesteResistencia(chaveAtributo) {
  return String(chaveAtributo || "").toUpperCase();
}

function garantirSistemaDadoTesteResistencia() {
  if (estadoTesteResistencia.dadoSistema)
    return estadoTesteResistencia.dadoSistema;

  const container = document.getElementById(
    "modalTesteResistenciaDadoContainer",
  );
  if (!container || typeof criarSistemaDado !== "function") return null;

  estadoTesteResistencia.dadoSistema = criarSistemaDado(container, {
    titulo: "Rolagem D20",
    nota: "1d20",
    quantidade: 1,
    faces: 20,
    bonus: 0,
    rotuloDado: "Dado",
    rotuloBonus: "(FOR)",
    textoBotao: "Rolar",
    onChange: atualizarBotaoConfirmarTesteResistencia,
  });

  const campoDado = container.querySelector("[data-dice-value]");
  if (campoDado) {
    campoDado.id = "modalTesteResistenciaDado";
    campoDado.min = "1";
    campoDado.max = "20";
    campoDado.inputMode = "numeric";
    campoDado.setAttribute("aria-label", "Dado tirado no teste de resistência");
    if (!campoDado.dataset.d20InputListener) {
      campoDado.dataset.d20InputListener = "true";
      campoDado.addEventListener("input", () => {
        estadoTesteResistencia.resolucaoD20 = null;
      });
    }
  }

  return estadoTesteResistencia.dadoSistema;
}

function atualizarAtributosTesteResistencia() {
  ATRIBUTOS_TESTE_RESISTENCIA.forEach((chave) => {
    const bonus = obterBonusTesteResistencia(chave);
    const campoModificador = document.querySelector(
      `[data-modificador-teste="${chave}"]`,
    );
    if (campoModificador)
      campoModificador.textContent = `(${formatarBonusAtaqueModal(bonus)})`;
  });

  selecionarAtributoTesteResistencia(estadoTesteResistencia.atributo || "for");
}

function selecionarAtributoTesteResistencia(chaveAtributo) {
  const chaveForcada = estadoTesteResistencia.contextoConcentracao
    ? "con"
    : chaveAtributo;
  const chave = ATRIBUTOS_TESTE_RESISTENCIA.includes(chaveForcada)
    ? chaveForcada
    : "for";
  estadoTesteResistencia.atributo = chave;

  document.querySelectorAll("[data-atributo-teste]").forEach((botao) => {
    const ativo = botao.dataset.atributoTeste === chave;
    botao.classList.toggle("ativo", ativo);
    botao.setAttribute("aria-pressed", ativo ? "true" : "false");
    botao.disabled =
      !!estadoTesteResistencia.contextoConcentracao &&
      botao.dataset.atributoTeste !== "con";
  });

  const bonus = obterBonusTesteResistencia(chave);
  const sistema = garantirSistemaDadoTesteResistencia();
  sistema?.setBonus(bonus);

  const detalheBonus = document.querySelector(
    "#modalTesteResistenciaDadoContainer .dado-modal-bonus-detalhe",
  );
  if (detalheBonus)
    detalheBonus.textContent = `(${obterRotuloAtributoTesteResistencia(chave)})`;

  atualizarBotaoConfirmarTesteResistencia();
}

function obterDadoTesteResistencia() {
  const sistema = estadoTesteResistencia.dadoSistema;
  const dado = sistema?.getValor();
  return Number.isInteger(dado) && dado >= 1 && dado <= 20 ? dado : null;
}

function obterTotalTesteResistencia() {
  const dado = obterDadoTesteResistencia();
  if (dado === null) return null;
  return RegrasCombate.calcularTotalD20(dado, [
    obterBonusTesteResistencia(estadoTesteResistencia.atributo),
  ]);
}

function atualizarBotaoConfirmarTesteResistencia() {
  const botao = document.getElementById("modalTesteResistenciaConfirmar");
  if (!botao) return;

  const total = obterTotalTesteResistencia();
  botao.textContent = Number.isInteger(total)
    ? `Confirmar (${total})`
    : "Confirmar";

  const campoTotal = document.querySelector(
    "#modalTesteResistenciaDadoContainer [data-dice-total]",
  );
  if (campoTotal) {
    campoTotal.innerHTML = `Total: <strong>${Number.isInteger(total) ? total : "-"}</strong>`;
  }
  const bonusVisual = document.querySelector("#modalTesteResistenciaDadoContainer [data-dice-bonus]");
  const detalheVisual = document.querySelector("#modalTesteResistenciaDadoContainer .dado-modal-bonus-detalhe");
  if (estadoTesteResistencia.contextoPericia) {
    const bonus = obterBonusTesteResistencia(estadoTesteResistencia.atributo);
    if (bonusVisual) bonusVisual.textContent = `${bonus >= 0 ? "+" : ""}${bonus}`;
    if (detalheVisual) detalheVisual.textContent = `(${estadoTesteResistencia.contextoPericia.nome})`;
  } else if (detalheVisual) {
    detalheVisual.textContent = `(${obterRotuloAtributoTesteResistencia(estadoTesteResistencia.atributo)})`;
  }
}

function abrirModalTesteResistencia(opcoes = {}) {
  const overlay = document.getElementById("modalTesteResistenciaOverlay");
  const sistema = garantirSistemaDadoTesteResistencia();
  if (!overlay || !sistema) return;

  const novoContexto = opcoes.contextoConcentracao || null;
  if (estadoTesteResistencia.contextoConcentracao) {
    if (novoContexto)
      estadoTesteResistencia.filaConcentracao.push(novoContexto);
    return false;
  }

  estadoTesteResistencia.contextoConcentracao = novoContexto;
  estadoTesteResistencia.contextoPericia = opcoes.contextoPericia || null;
  estadoTesteResistencia.resolucaoD20 = null;
  estadoTesteResistencia.atributo =
    opcoes.atributo || estadoTesteResistencia.atributo || "for";

  const titulo = document.getElementById("modalTesteResistenciaTitulo");
  if (titulo) titulo.textContent = opcoes.titulo || (estadoTesteResistencia.contextoPericia
    ? `Teste de ${estadoTesteResistencia.contextoPericia.nome}`
    : "Teste de Resistência");
  const seletorAtributos = document.querySelector?.(".teste-resistencia-atributos");
  if (seletorAtributos) {
    seletorAtributos.hidden = !!estadoTesteResistencia.contextoPericia;
    seletorAtributos.style.display = estadoTesteResistencia.contextoPericia ? "none" : "";
  }
  const bonusLabel = document.getElementById("modalTesteResistenciaBonusLabel");
  const bonusInput = document.getElementById("modalTesteResistenciaBonusSituacional");
  if (bonusLabel) {
    bonusLabel.hidden = !estadoTesteResistencia.contextoPericia;
    bonusLabel.style.display = estadoTesteResistencia.contextoPericia ? "" : "none";
  }
  if (bonusInput) {
    bonusInput.hidden = !estadoTesteResistencia.contextoPericia;
    bonusInput.style.display = estadoTesteResistencia.contextoPericia ? "" : "none";
    bonusInput.value = "0";
  }

  atualizarAtributosTesteResistencia();
  selecionarAtributoTesteResistencia(estadoTesteResistencia.atributo);
  sistema.setValor("");
  atualizarBotaoConfirmarTesteResistencia();

  overlay.classList.remove("oculto");
  overlay.classList.add("ativo");
  overlay.setAttribute("aria-hidden", "false");

  const botaoAbandonar = document.getElementById(
    "modalTesteResistenciaAbandonar",
  );
  const botaoVoltar = document.getElementById("modalTesteResistenciaCancelar");
  const concentracaoPendente = !!estadoTesteResistencia.contextoConcentracao;
  if (botaoAbandonar) {
    botaoAbandonar.hidden = !concentracaoPendente;
    botaoAbandonar.classList.toggle("oculto", !concentracaoPendente);
  }
  if (botaoVoltar) {
    botaoVoltar.textContent = concentracaoPendente
      ? "Continuar teste"
      : "Cancelar";
  }

  document.getElementById("modalTesteResistenciaDado")?.focus();
}

function abrirTestePericia(linha) {
  if (!linha || window.__fichaImportacaoTransacaoAtiva) return false;
  const campo = linha.querySelector(".pericia-valor");
  const id = campo?.id?.replace(/^pericia/i, "").replace(/Valor$/, "").toLowerCase();
  const rotulo = linha.querySelector(".pericia-nome")?.textContent?.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (!campo || !id || !rotulo) return false;
  return abrirModalTesteResistencia({
    contextoPericia: { id, nome: rotulo, campo },
    titulo: `Teste de ${rotulo}`,
  });
}

function fecharModalTesteResistencia(opcoes = {}) {
  const overlay = document.getElementById("modalTesteResistenciaOverlay");
  if (!overlay) return;

  if (
    estadoTesteResistencia.contextoConcentracao &&
    opcoes.tokenResolucao !== tokenFechamentoResolvidoTesteResistencia
  ) {
    document.getElementById("modalTesteResistenciaDado")?.focus();
    return false;
  }

  overlay.classList.remove("ativo");
  overlay.classList.add("oculto");
  overlay.setAttribute("aria-hidden", "true");
  estadoTesteResistencia.contextoConcentracao = null;
  estadoTesteResistencia.resolucaoD20 = null;
  estadoTesteResistencia.filaConcentracao.length = 0;

  const botaoAbandonar = document.getElementById(
    "modalTesteResistenciaAbandonar",
  );
  const botaoVoltar = document.getElementById("modalTesteResistenciaCancelar");
  if (botaoAbandonar) {
    botaoAbandonar.hidden = true;
    botaoAbandonar.classList.add("oculto");
  }
  if (botaoVoltar) botaoVoltar.textContent = "Cancelar";

  const titulo = document.getElementById("modalTesteResistenciaTitulo");
  if (titulo) titulo.textContent = "Teste de Resistência";
  const seletorAtributos = document.querySelector?.(".teste-resistencia-atributos");
  if (seletorAtributos) {
    seletorAtributos.hidden = false;
    seletorAtributos.style.display = "";
  }
  const bonusLabel = document.getElementById("modalTesteResistenciaBonusLabel");
  const bonusInput = document.getElementById("modalTesteResistenciaBonusSituacional");
  if (bonusLabel) bonusLabel.hidden = true;
  if (bonusLabel) bonusLabel.style.display = "none";
  if (bonusInput) {
    bonusInput.hidden = true;
    bonusInput.style.display = "none";
    bonusInput.value = "0";
  }
  estadoTesteResistencia.contextoPericia = null;
  return true;
}

function abandonarConcentracaoPendente() {
  const contexto = estadoTesteResistencia.contextoConcentracao;
  if (!contexto) return;

  const concentracaoCorrespondente =
    concentracaoAtiva?.chave === contexto.chave &&
    concentracaoAtiva?.instanciaId === contexto.instanciaId;
  const nome = obterNomeConcentracao(contexto.magia);
  adicionarRegistroHistoricoCombate(
    "Concentração",
    concentracaoCorrespondente
      ? `abandonada voluntariamente: ${nome} (teste de resistência pendente)`
      : `teste pendente descartado: ${nome} já não está em concentração ativa`,
    concentracaoCorrespondente ? "❌" : "ℹ️",
    "",
    {
      timeline: {
        simples: true,
        exibirBadge: false,
        texto: concentracaoCorrespondente
          ? `❌ Concentração abandonada: ${nome}`
          : `ℹ️ Teste obsoleto descartado: ${nome}`,
      },
    },
  );
  if (concentracaoCorrespondente) {
    encerrarConcentracao("abandonada", { registrarHistorico: false });
  } else if (avancarTesteConcentracaoNaFila()) {
    return;
  }
  fecharModalTesteResistencia({
    tokenResolucao: tokenFechamentoResolvidoTesteResistencia,
  });
}

function avancarTesteConcentracaoNaFila() {
  let proximo = null;
  while (estadoTesteResistencia.filaConcentracao.length) {
    const candidato = estadoTesteResistencia.filaConcentracao.shift();
    if (
      concentracaoAtiva?.chave === candidato.chave &&
      concentracaoAtiva?.instanciaId === candidato.instanciaId
    ) {
      proximo = candidato;
      break;
    }
    adicionarRegistroHistoricoCombate(
      "Concentração",
      `teste pendente descartado: ${obterNomeConcentracao(candidato.magia)} já não está em concentração ativa`,
      "ℹ️",
    );
  }
  if (!proximo) {
    fecharModalTesteResistencia({
      tokenResolucao: tokenFechamentoResolvidoTesteResistencia,
    });
    return true;
  }

  estadoTesteResistencia.contextoConcentracao = proximo;
  estadoTesteResistencia.resolucaoD20 = null;
  estadoTesteResistencia.atributo = "con";
  const nome = obterNomeConcentracao(proximo.magia);
  const titulo = document.getElementById("modalTesteResistenciaTitulo");
  if (titulo) titulo.textContent = `Teste para manter concentração em ${nome}`;
  selecionarAtributoTesteResistencia("con");
  estadoTesteResistencia.dadoSistema?.setValor("");
  atualizarBotaoConfirmarTesteResistencia();
  document.getElementById("modalTesteResistenciaDado")?.focus();
  return true;
}

function confirmarTesteResistencia() {
  if (typeof window !== "undefined" && window.__fichaImportacaoTransacaoAtiva) return;
  const dadoInformado = obterDadoTesteResistencia();
  const campoDado = document.getElementById("modalTesteResistenciaDado");
  if (dadoInformado === null) {
    campoDado?.focus();
    return;
  }

  const resolucaoD20 = obterResolucaoManualD20Atual(
    "modalTesteResistencia",
    estadoTesteResistencia.contextoPericia
      ? `pericia:${estadoTesteResistencia.contextoPericia.id}`
      : "salvaguarda",
    dadoInformado,
    estadoTesteResistencia.resolucaoD20,
  );
  if (!resolucaoD20) {
    document.querySelector("#modalTesteResistenciaDadoContainer [data-dice-roll]")?.focus();
    return;
  }
  estadoTesteResistencia.resolucaoD20 = resolucaoD20;
  const dado = resolucaoD20.escolhido;

  const atributo = estadoTesteResistencia.contextoPericia
    ? estadoTesteResistencia.contextoPericia.nome
    : obterRotuloAtributoTesteResistencia(estadoTesteResistencia.atributo);
  const bonus = obterBonusTesteResistencia(estadoTesteResistencia.atributo);
  if (!Number.isInteger(bonus)) {
    const campoBonus = document.getElementById("modalTesteResistenciaBonusSituacional");
    campoBonus?.setCustomValidity?.("Informe um bônus situacional inteiro.");
    campoBonus?.reportValidity?.();
    campoBonus?.focus();
    return;
  }
  document.getElementById("modalTesteResistenciaBonusSituacional")?.setCustomValidity?.("");
  const total = RegrasCombate.calcularTotalD20(dado, [bonus]);
  const sinal = bonus >= 0 ? "+" : "-";
  const valor = `${dado} ${sinal} ${Math.abs(bonus)} = ${total}`;
  const contextoConcentracao = estadoTesteResistencia.contextoConcentracao;

  if (contextoConcentracao) {
    if (
      concentracaoAtiva?.chave !== contextoConcentracao.chave ||
      concentracaoAtiva?.instanciaId !== contextoConcentracao.instanciaId
    ) {
      adicionarRegistroHistoricoCombate(
        "Concentração",
        `teste pendente descartado: ${obterNomeConcentracao(contextoConcentracao.magia)} já não está em concentração ativa`,
        "ℹ️",
      );
      avancarTesteConcentracaoNaFila();
      return;
    }

    const sucesso = total >= contextoConcentracao.cd;
    const magia = contextoConcentracao.magia;
    const nome = obterNomeConcentracao(magia);

    adicionarRegistroHistoricoCombate(
      "Concentração",
      `${sucesso ? "mantida" : "perdida"}: ${nome} (CD ${contextoConcentracao.cd}, ${valor})`,
      sucesso ? "✔" : "❌",
      "",
      {
        timeline: {
          simples: true,
          exibirBadge: false,
          texto: `${sucesso ? "✔" : "❌"} Concentração ${sucesso ? "Mantida" : "Perdida"}`,
        },
      },
    );

    if (sucesso) {
      ultimoResultadoConcentracao = "sucesso";
      atualizarSubAbaMagiasCombate();
      if (avancarTesteConcentracaoNaFila()) return;
    } else {
      encerrarConcentracao("perdida", { registrarHistorico: false });
      estadoTesteResistencia.filaConcentracao.length = 0;
    }

    fecharModalTesteResistencia({
      tokenResolucao: tokenFechamentoResolvidoTesteResistencia,
    });
    return;
  }

  adicionarRegistroHistoricoCombate(
    estadoTesteResistencia.contextoPericia ? "Teste de Perícia" : "Teste de Resistência",
    `(${atributo}): ${valor}`,
    obterIconeAtributoAtaque(atributo),
    "",
    {
      timeline: {
        simples: true,
        exibirBadge: false,
        texto: `${estadoTesteResistencia.contextoPericia ? "🎲 Teste de Perícia" : `${obterIconeAtributoAtaque(atributo)} Teste de Resistência ${atributo}`}: ${valor}`,
      },
    },
  );

  fecharModalTesteResistencia({
    tokenResolucao: tokenFechamentoResolvidoTesteResistencia,
  });
}

function abrirItemCard(card) {
  if (!card) return;
  card.classList.remove("fechado", "oculto");
  const icon = card.querySelector(".item-toggle");
  if (icon) icon.textContent = "🔼";
}

function fecharItemCard(card) {
  if (
    !card ||
    card.id === "armaModelo" ||
    card.id === "armaduraModelo" ||
    card.id === "escudoModelo" ||
    card.id === "outroModelo"
  )
    return;
  card.classList.add("fechado");
  const icon = card.querySelector(".item-toggle");
  if (icon) icon.textContent = "🔽";
}

function atualizarTitulosInventario() {
  const contarItensPreenchidos = (seletor, campoNome, incluir = () => true) =>
    Array.from(document.querySelectorAll(seletor)).filter(
      (card) => card.querySelector(campoNome)?.value?.trim() && incluir(card),
    ).length;

  const contagens = {
    inventarioTituloArmas: {
      emoji: "⚔️",
      nome: "Armas",
      total: contarItensPreenchidos(
        '#listaArmas .item-card[data-tipo="arma"]',
        '[data-campo="nome"]',
      ),
    },
    inventarioTituloArmaduras: {
      emoji: "👕",
      nome: "Armaduras",
      total: contarItensPreenchidos(
        '#listaArmaduras .item-card[data-tipo="armadura"]',
        '[data-campo="armadura_nome"]',
      ),
    },
    inventarioTituloEscudos: {
      emoji: "🛡️",
      nome: "Escudos",
      total: contarItensPreenchidos(
        '#listaEscudosItens > .item-card[data-tipo="escudo"]:not(#escudoModelo)',
        '[data-campo="escudo_nome"]',
        (card) =>
          (card.querySelector('[data-campo="escudo_tipo"]')?.value ||
            "Escudo") === "Escudo",
      ),
    },
    inventarioTituloVestimentas: {
      emoji: "💍",
      nome: "Vestimentas e acessórios",
      total: contarItensPreenchidos(
        '#listaVestimentas > .item-card[data-tipo="escudo"]',
        '[data-campo="escudo_nome"]',
        (card) =>
          (card.querySelector('[data-campo="escudo_tipo"]')?.value ||
            "Escudo") !== "Escudo",
      ),
    },
    inventarioTituloOutros: {
      emoji: "📦",
      nome: "Outros",
      total: contarItensPreenchidos(
        '#listaOutros .item-card[data-tipo="outro"]',
        '[data-campo="outro_nome"]',
      ),
    },
  };

  Object.entries(contagens).forEach(([id, info]) => {
    const titulo = document.getElementById(id);
    if (!titulo) return;
    const nome = titulo.querySelector(".armadura-titulo-nome");
    const contador = titulo.querySelector(".armadura-titulo-contagem");
    if (nome && contador) {
      contador.textContent = String(info.total);
      contador.setAttribute(
        "aria-label",
        `Quantidade de ${info.nome.toLowerCase()}: ${info.total}`,
      );
      return;
    }
    titulo.textContent = `${info.emoji} ${info.nome} ${info.total}`;
  });
}

function atualizarCamposMagicosItem(card) {
  if (!card) return;

  const checkboxMagico = card.querySelector(".item-flag-magico");
  const containerSintonizado = card.querySelector(
    ".item-sintonizado-container",
  );
  const checkboxSintonizado = card.querySelector(".item-flag-sintonizado");

  if (!checkboxMagico || !containerSintonizado || !checkboxSintonizado) return;

  const exibirSintonizado = checkboxMagico.checked;
  card.classList.toggle("item-magico-ativo", exibirSintonizado);
  containerSintonizado.classList.toggle("oculto", !exibirSintonizado);
  if (!exibirSintonizado) checkboxSintonizado.checked = false;
}

function inicializarCamposCompartilhadosItem(card, prefixo) {
  if (!card) return;

  const checkboxMagico = card.querySelector(".item-flag-magico");
  const checkboxSintonizado = card.querySelector(".item-flag-sintonizado");

  if (checkboxMagico && checkboxMagico.dataset.listenerItemMagico !== "true") {
    checkboxMagico.addEventListener("change", () => {
      atualizarCamposMagicosItem(card);
      atualizarListaArmasEquipamento();
    });
    checkboxMagico.dataset.listenerItemMagico = "true";
  }

  if (
    checkboxSintonizado &&
    checkboxSintonizado.dataset.listenerItemSintonizado !== "true"
  ) {
    checkboxSintonizado.addEventListener(
      "change",
      atualizarListaArmasEquipamento,
    );
    checkboxSintonizado.dataset.listenerItemSintonizado = "true";
  }

  atualizarCamposMagicosItem(card);
}

function coletarFlagsCompartilhadasItem(card, destino, prefixo) {
  destino[`${prefixo}_item_magico`] =
    !!card.querySelector(".item-flag-magico")?.checked;
  destino[`${prefixo}_sintonizado`] = !!card.querySelector(
    ".item-flag-sintonizado",
  )?.checked;
}

function aplicarFlagsCompartilhadasItem(card, dadosItem, prefixo) {
  if (!card || !dadosItem) return;
  const checkboxMagico = card.querySelector(".item-flag-magico");
  const checkboxSintonizado = card.querySelector(".item-flag-sintonizado");

  if (checkboxMagico)
    checkboxMagico.checked = !!dadosItem[`${prefixo}_item_magico`];
  if (checkboxSintonizado)
    checkboxSintonizado.checked = !!dadosItem[`${prefixo}_sintonizado`];
  atualizarCamposMagicosItem(card);
}

function obterResumoBonusAtaqueArma(arma) {
  if (arma?.tipo === "magia" && arma.calculoMagia) {
    return arma.calculoMagia;
  }
  return getResumoCalculoAtaque(arma, arma?.ataque);
}

function obterSubtituloModalAtaque(arma) {
  return (
    limparPrefixoPropriedade(arma?.propriedade || "") || "Sem propriedades"
  );
}

function obterDefinicaoCatalogoAtaque(arma) {
  const origem = arma?.bruto || arma || {};
  const id = arma?.catalogoId || origem.catalogoId || origem.arma_catalogo_id || "";
  return (typeof estadoCatalogoArmas !== "undefined" ? estadoCatalogoArmas : null)?.dados?.itens?.find((item) => item.id === id || item.idLegado === id) || null;
}

function obterDadosModoAtaqueArma(arma) {
  const origem = arma?.bruto || arma || {};
  const definicao = obterDefinicaoCatalogoAtaque(arma);
  const propriedades = origem.propriedades || arma?.propriedades || {};
  const nomesPropriedades = Array.isArray(propriedades)
    ? propriedades
    : Object.entries(propriedades).filter(([, ativo]) => !!ativo).map(([nome]) => nome);
  let modo = definicao?.modo || origem.modo || origem.arma_modo || arma?.modo || "";
  if (!modo && /dist[aâ]ncia/i.test(arma?.propriedade || "")) modo = "distancia";
  if (!modo) modo = "corpo-a-corpo";
  const modos = RegrasCombate.classificarModosAtaqueArma({ modo, propriedades: nomesPropriedades });
  let alcance = definicao?.alcance || origem.alcance || arma?.alcance || null;
  if (!alcance) {
    const valores = String(arma?.propriedade || "").match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/);
    if (valores) alcance = { normalM: Number(valores[1].replace(",", ".")), longoM: Number(valores[2].replace(",", ".")) };
  }
  const inicial = Number(alcance?.normalM);
  const final = Number(alcance?.longoM);
  const alcanceMetros = Number.isFinite(inicial) && Number.isFinite(final)
    ? { inicial, final }
    : Number.isFinite(Number(alcance?.normalFt)) && Number.isFinite(Number(alcance?.longoFt))
      ? { inicial: Number((Number(alcance.normalFt) * 0.3048).toFixed(2)), final: Number((Number(alcance.longoFt) * 0.3048).toFixed(2)) }
      : null;
  return { modo, modos, alcance: alcanceMetros };
}

function formatarAlcanceBotaoAtaque(alcance) {
  if (!alcance) return "";
  const fmt = (valor) => Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return ` (${fmt(alcance.inicial)}/${fmt(alcance.final)} m)`;
}

function renderizarArmasArremessadas(container) {
  const armas = estadoCombateIniciativa.armasArremessadas || [];
  if (!armas.length) return;
  const linha = document.createElement("section");
  linha.className = "combate-armas-arremessadas";
  const titulo = document.createElement("strong");
  titulo.textContent = "Armas arremessadas:";
  const tags = document.createElement("div");
  tags.className = "combate-armas-arremessadas-tags";
  armas.forEach((arma) => {
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = "combate-arma-arremessada-tag";
    const icone = document.createElement("img");
    icone.alt = "";
    icone.setAttribute("aria-hidden", "true");
    icone.src = arma.icone || "../assets/icons/armas/dagger.svg";
    icone.width = 20;
    icone.height = 20;
    const nome = document.createElement("span");
    nome.textContent = arma.nome || "Arma";
    tag.append(icone, nome);
    tag.addEventListener("click", (evento) => { evento.stopPropagation(); abrirModalRecuperarArma(arma); });
    tags.appendChild(tag);
  });
  linha.append(titulo, tags);
  container.appendChild(linha);
}

function abrirModalRecuperarArma(arma) {
  let dialog = document.getElementById("modalRecuperarArmaArremessada");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "modalRecuperarArmaArremessada";
    dialog.className = "combate-modal-recuperar-arma";
    const titulo = document.createElement("h2");
    titulo.id = "modalRecuperarArmaTitulo";
    titulo.textContent = "Recuperar arma arremessada";
    dialog.setAttribute("aria-labelledby", titulo.id);
    const texto = document.createElement("p");
    texto.id = "modalRecuperarArmaTexto";
    dialog.setAttribute("aria-describedby", texto.id);
    const acoes = document.createElement("div");
    acoes.className = "combate-modal-recuperar-acoes";
    const recuperar = document.createElement("button");
    recuperar.type = "button";
    recuperar.textContent = "Recuperar arma";
    recuperar.addEventListener("click", () => {
      const id = dialog.dataset.instanciaId;
      const registro = (estadoCombateIniciativa.armasArremessadas || []).find((item) => item.instanciaId === id);
      if (!registro) { dialog.close(); return; }
      estadoCombateIniciativa.armasArremessadas = estadoCombateIniciativa.armasArremessadas.filter((item) => item.instanciaId !== id);
      adicionarRegistroHistoricoCombate("Recuperação de arma", `${registro.nome} recuperada.`, "🗡️", "arma", {
        evento: "recuperacao_arma", origem: { tipo: "arma", id: registro.catalogoId || null, instanciaId: id, nome: registro.nome || "Arma" },
      });
      dialog.close();
      sincronizarMarcacaoArmasPorSlots();
      sincronizarEquipamentosCombate();
      atualizarListaArmasEquipamento();
      atualizarSubAbaArmas();
    });
    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.textContent = "Cancelar";
    cancelar.addEventListener("click", () => dialog.close());
    acoes.append(recuperar, cancelar);
    dialog.append(titulo, texto, acoes);
    (document.getElementById("combate") || document.body).appendChild(dialog);
  }
  dialog.dataset.instanciaId = arma.instanciaId;
  const texto = dialog.querySelector("#modalRecuperarArmaTexto");
  texto.textContent = `${arma.nome || "A arma"} foi arremessada e está fora do seu equipamento. Deseja recuperá-la?`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector("button")?.focus();
}

function finalizarArremessoArma(arma) {
  const instanciaId = arma?.instanciaId;
  if (!instanciaId) return;
  const registro = {
    instanciaId,
    nome: arma.nome || "Arma",
    icone: arma.icone || arma.bruto?.icone || "../assets/icons/armas/dagger.svg",
    catalogoId: arma.catalogoId || arma.bruto?.arma_catalogo_id || null,
  };
  if (!(estadoCombateIniciativa.armasArremessadas || []).some((item) => item.instanciaId === instanciaId)) {
    estadoCombateIniciativa.armasArremessadas.push(registro);
  }
  const indice = coletarArmas().findIndex((item) => item.instanciaId === instanciaId);
  if (indice >= 0) {
    if (String(document.getElementById("arma1Nome")?.value || "") === String(indice)) document.getElementById("arma1Nome").value = "";
    if (String(document.getElementById("arma2Nome")?.value || "") === String(indice)) document.getElementById("arma2Nome").value = "";
  }
  sincronizarMarcacaoArmasPorSlots();
  sincronizarEquipamentosCombate();
  atualizarListaArmasEquipamento();
  atualizarSubAbaArmas();
}

function obterIconeAtributoAtaque(rotuloAtributo) {
  if (rotuloAtributo === "FOR") return "💪";
  if (rotuloAtributo === "DES") return "🏹";
  if (rotuloAtributo === "CON") return "❤️";
  if (rotuloAtributo === "INT") return "🧠";
  if (rotuloAtributo === "SAB") return "👁️";
  if (rotuloAtributo === "CAR") return "🗣️";
  return "✨";
}

function obterTooltipAtributoAtaque(rotuloAtributo) {
  const mapa = {
    FOR: "Modificador de Força",
    DES: "Modificador de Destreza",
    CON: "Modificador de Constituição",
    INT: "Modificador de Inteligência",
    SAB: "Modificador de Sabedoria",
    CAR: "Modificador de Carisma",
  };
  return mapa[rotuloAtributo] || "Modificador de atributo";
}

function formatarBonusAtaqueModal(valor) {
  const numero = parseInt(valor, 10) || 0;
  return (numero >= 0 ? "+" : "") + numero;
}

function atualizarDetalheDadoAtaqueModal() {
  const campoDetalhe = document.getElementById("modalAtaqueDadoDetalhe");
  if (!campoDetalhe) return;

  campoDetalhe.textContent = "1d20";
}

function atualizarDetalheBonusAtaqueModal() {
  const campoBonus = document.getElementById("modalAtaqueBonus");
  const campoDetalhe = document.getElementById("modalAtaqueBonusDetalhe");
  if (!campoBonus || !campoDetalhe) return;

  const modBase = estadoAtaqueArma.modBase || 0;
  const bonusProf = estadoAtaqueArma.bonusProf || 0;
  const iconeAtributo = obterIconeAtributoAtaque(
    estadoAtaqueArma.rotuloAtributo,
  );

  campoBonus.textContent = formatarBonusAtaqueModal(modBase + bonusProf);
  campoDetalhe.textContent = `(${modBase}${iconeAtributo} + ${bonusProf}🅿️)`;
}

function atualizarDetalheDadoDanoModal() {
  const campoDetalhe = document.getElementById("modalAtaqueResultadosDano");
  if (!campoDetalhe) return;

  const resultados = estadoAtaqueArma.ultimaRolagemDano;
  if (Array.isArray(resultados) && resultados.length) {
    campoDetalhe.textContent = "[" + resultados.join(", ") + "]";
    return;
  }

  campoDetalhe.textContent = estadoAtaqueArma.danoFormula || "dano";
}

function obterArmaSelecionadaParaDuasArmas(slot) {
  const valor = document.getElementById(`arma${slot}Nome`)?.value ?? "";
  if (!/^\d+$/.test(valor)) return null;
  const arma = coletarArmas?.()[Number(valor)];
  if (!arma) return null;
  const catalogoId = arma.catalogoId || "";
  const definicao =
    typeof estadoCatalogoArmas !== "undefined" &&
    Array.isArray(estadoCatalogoArmas?.dados?.itens)
      ? estadoCatalogoArmas.dados.itens.find(
          (item) => item.id === catalogoId || item.idLegado === catalogoId,
        )
      : null;
  return {
    ...arma,
    slot,
    modo: arma.modo || arma.arma_modo || definicao?.modo || "",
    descricaoEspecial:
      arma.descricaoEspecial ||
      arma.descricao_especial ||
      definicao?.descricaoEspecial ||
      "",
  };
}

function obterNomesCaracteristicasDuasArmas() {
  const nomes = [];
  const categorias =
    typeof talentosEstruturados === "object" && talentosEstruturados
      ? Object.values(talentosEstruturados)
      : [];
  categorias.forEach((itens) => {
    if (!Array.isArray(itens)) return;
    itens.forEach((item) => {
      if (typeof item === "string") nomes.push(item);
      else if (typeof item?.nome === "string") nomes.push(item.nome);
    });
  });
  ["talentoClasse", "talentoOutro"].forEach((id) => {
    const texto = document.getElementById(id)?.value || "";
    nomes.push(...texto.split(","));
  });
  return nomes
    .map((nome) =>
      String(nome)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
}

function possuiCaracteristicaDuasArmas(tipo) {
  const nomes = obterNomesCaracteristicasDuasArmas();
  const categorias = typeof talentosEstruturados === "object" && talentosEstruturados ? Object.values(talentosEstruturados) : [];
  const aliases =
    tipo === "ambidestro"
      ? ["ambidestro", "dual wielder", "dualwielderfeat"]
      : [
          "ataque com duas armas",
          "ataque duas armas",
          "luta com duas armas",
          "estilo de luta com duas armas",
          "combate com duas armas",
          "two-weapon fighting",
          "two-weapon fighting style",
          "twoweaponfightingstyle",
        ];
  const chavesBooleanas = tipo === "ambidestro" ? ["dualWielderFeat"] : ["twoWeaponFightingStyle"];
  const possuiFlag = categorias.some((itens) => Array.isArray(itens) && itens.some((item) =>
    item && typeof item === "object" && chavesBooleanas.some((chave) => item[chave] === true),
  ));
  return possuiFlag || nomes.some((nome) => aliases.includes(nome));
}

function ehAtaqueSecundarioComDuasArmas() {
  if (normalizarContextoAcaoAtaque(estadoAtaqueArma.contextoAcao || estadoAtaqueArma.tipoAcao) !== "bonusAction") return false;
  const slotAtual = estadoAtaqueArma.arma?.slot;
  if (estadoAtaqueArma.origem !== "arma" || ![1, 2].includes(slotAtual))
    return false;
  const recursosTurno = typeof estadoCombateIniciativa !== "undefined" && estadoCombateIniciativa.ativo
    ? estadoCombateIniciativa.recursosTurno
    : null;
  const maosQualificadoras = recursosTurno?.maosAtaqueQualificadoras?.length ? recursosTurno.maosAtaqueQualificadoras : (recursosTurno?.maoAtaqueQualificador ? [recursosTurno.maoAtaqueQualificador] : []);
  if (maosQualificadoras.length ? !maosQualificadoras.some((mao) => mao !== slotAtual) : slotAtual !== 2) return false;
  const valorPrincipal = document.getElementById("arma1Nome")?.value ?? "";
  const valorSecundario = document.getElementById("arma2Nome")?.value ?? "";
  if (
    !/^\d+$/.test(valorPrincipal) ||
    !/^\d+$/.test(valorSecundario) ||
    valorPrincipal === valorSecundario
  )
    return false;
  return RegrasCombate.ehArmaElegivelDuasArmas({
    armaPrincipal: obterArmaSelecionadaParaDuasArmas(1),
    armaSecundaria: obterArmaSelecionadaParaDuasArmas(2),
    permiteArmasNaoLeves: possuiCaracteristicaDuasArmas("ambidestro"),
  });
}

function parArmasElegivelDuasArmas() {
  return RegrasCombate.ehArmaElegivelDuasArmas({
    armaPrincipal: obterArmaSelecionadaParaDuasArmas(1),
    armaSecundaria: obterArmaSelecionadaParaDuasArmas(2),
    permiteArmasNaoLeves: possuiCaracteristicaDuasArmas("ambidestro"),
  });
}

function permiteModificadorPositivoAtaqueSecundario() {
  return (
    ehAtaqueSecundarioComDuasArmas() && possuiCaracteristicaDuasArmas("estilo")
  );
}

function obterBonusDanoEfetivoModalAtaque() {
  if (typeof RegrasCombate === "undefined") return 0;
  return (
    RegrasCombate.calcularBonusDanoEfetivo({
      modificador: estadoAtaqueArma.danoModBase || 0,
      origem: estadoAtaqueArma.origem,
      tipoAcao: estadoAtaqueArma.tipoAcao,
      contextoAcao: estadoAtaqueArma.contextoAcao || normalizarContextoAcaoAtaque(estadoAtaqueArma.tipoAcao),
      ataqueSecundarioDuasArmas: ehAtaqueSecundarioComDuasArmas(),
      permiteModificadorPositivo: permiteModificadorPositivoAtaqueSecundario(),
    }) ?? 0
  );
}

function atualizarStatusAtaqueBonusDuasArmas() {
  const output = document.getElementById("combateAtaqueBonusDuasArmas");
  if (!output) return;
  output.hidden = !estadoCombateIniciativa.ativo;
  if (!estadoCombateIniciativa.ativo) return;
  const armaPrincipal = obterArmaSelecionadaParaDuasArmas(1);
  const armaSecundaria = obterArmaSelecionadaParaDuasArmas(2);
  const valorSecundario = document.getElementById("arma2Nome")?.value || "";
  const escudoNaSecundaria = typeof extrairIndiceSlotEscudo === "function" && extrairIndiceSlotEscudo(valorSecundario) !== null;
  const estadoMaoPrincipal = typeof estadoCombate !== "undefined" ? estadoCombate.maoPrincipal : null;
  const avaliacaoEquipamento = typeof avaliarSelecaoSecundaria === "function"
    ? avaliarSelecaoSecundaria(valorSecundario, estadoMaoPrincipal?.item || null, estadoMaoPrincipal?.modo || "uma_mao")
    : { valido: true };
  const resultado = RegrasCombate.avaliarAtaqueBonusDuasArmas({
    recursosTurno: estadoCombateIniciativa.recursosTurno,
    armaPrincipal,
    armaSecundaria,
    escudoNaSecundaria,
    armaSecundariaEquipavel: avaliacaoEquipamento.valido,
    permiteArmasNaoLeves: possuiCaracteristicaDuasArmas("ambidestro"),
  });
  output.dataset.estado = resultado.estado;
  output.textContent = resultado.estado === "disponivel"
    ? "Ataque bônus com a arma secundária: disponível."
    : resultado.estado === "utilizado"
      ? "Ataque bônus com a arma secundária: utilizado."
      : `Ataque bônus com a arma secundária: bloqueado. ${resultado.motivo}`;
}

function atualizarDetalheBonusDanoModal() {
  const campoBonus = document.getElementById("modalAtaqueBonusDano");
  const campoDetalhe = document.getElementById("modalAtaqueBonusDanoDetalhe");
  if (!campoBonus || !campoDetalhe) return;

  const modBase = obterBonusDanoEfetivoModalAtaque();
  const iconeAtributo = obterIconeAtributoAtaque(
    estadoAtaqueArma.rotuloAtributo,
  );

  campoBonus.textContent = formatarBonusAtaqueModal(modBase);
  campoDetalhe.textContent =
    estadoAtaqueArma.origem === "magia"
      ? `(${estadoAtaqueArma.arma?.danoBonusRotuloMagia || "magia"})`
      : modBase === 0
        ? "(sem MOD)"
        : `(${modBase}${iconeAtributo})`;
}

function parsearFormulaDano(formula) {
  if (!formula || typeof formula !== "string") return { qtd: 1, faces: 0 };
  const match = formula.trim().match(/(\d+)d(\d+)/i);
  if (!match) return { qtd: 1, faces: 0 };
  return { qtd: parseInt(match[1], 10), faces: parseInt(match[2], 10) };
}

function extrairFormulaDadoDano(formula) {
  if (!formula || typeof formula !== "string") return "";
  const match = formula.trim().match(/\d+d\d+/i);
  return match ? match[0] : formula.trim();
}

function obterFormulaDanoAtual(arma) {
  if (!arma) return "";
  const formula = arma.danoFormula || arma.dano || arma.arma_dano || "";
  if (typeof formula === "string") return extrairFormulaDadoDano(formula);
  return "";
}

function preencherCampoComRolagem(campo, quantidade, faces) {
  if (!campo) return null;
  const rolagem = rolarDado(quantidade, faces);
  if (!rolagem.resultados.length) return null;

  campo.value = rolagem.soma;
  campo.dispatchEvent(new Event("input"));
  campo.dispatchEvent(new Event("change"));
  return rolagem;
}

function atualizarTotalModalAtaque() {
  const campoTotal = document.getElementById("modalAtaqueTotal");
  const campoDado = document.getElementById("modalAtaqueDado");
  if (!campoTotal || !campoDado) return;

  const dado = parseInt(campoDado.value, 10);
  if (!Number.isInteger(dado) || dado < 1 || dado > 20) {
    campoTotal.innerHTML = "Total: <strong>-</strong>";
    return;
  }

  const total =
    dado + (estadoAtaqueArma.modBase || 0) + (estadoAtaqueArma.bonusProf || 0);
  campoTotal.innerHTML = `Total: <strong>${total}</strong>`;
}

function atualizarHistoricoRolagensModalAtaque() {
  const campoHistorico = document.getElementById("modalAtaqueHistoricoLista");
  if (!campoHistorico) return;

  const historicoOriginal = Array.isArray(estadoAtaqueArma.historicoRolagens)
    ? estadoAtaqueArma.historicoRolagens
    : [];

  const historico = [...historicoOriginal].reverse();
  if (!historico.length) {
    campoHistorico.textContent = "-";
    return;
  }

  const maior = Math.max(...historicoOriginal);
  const menor = Math.min(...historicoOriginal);

  campoHistorico.innerHTML = historico
    .map((valor) => {
      const ehMaior = valor === maior;
      const ehMenor = valor === menor;
      const sufixo = ehMaior ? "⇧" : ehMenor ? "⇩" : "";
      return criarBotaoHistoricoDado(valor, sufixo, ehMaior || ehMenor);
    })
    .join(", ");
}

function atualizarTotalModalDano() {
  const campoTotal = document.getElementById("modalAtaqueTotalDano");
  const campoDano = document.getElementById("modalAtaqueDano");
  if (!campoTotal || !campoDano) return;

  const danoRolado = parseInt(campoDano.value, 10);
  if (!Number.isInteger(danoRolado) || danoRolado < 0) {
    campoTotal.innerHTML = "Total: <strong>-</strong>";
    return;
  }

  const total = danoRolado + obterBonusDanoEfetivoModalAtaque();
  campoTotal.innerHTML = "Total: <strong>" + total + "</strong>";
}

function atualizarHistoricoRolagensModalDano() {
  const campoHistorico = document.getElementById("modalAtaqueHistoricoDano");
  if (!campoHistorico) return;

  const historicoOriginal = Array.isArray(
    estadoAtaqueArma.historicoRolagensDano,
  )
    ? estadoAtaqueArma.historicoRolagensDano
    : [];

  const historico = [...historicoOriginal].reverse();
  if (!historico.length) {
    campoHistorico.textContent = "-";
    return;
  }

  const maior = Math.max(...historicoOriginal);
  const menor = Math.min(...historicoOriginal);

  campoHistorico.innerHTML = historico
    .map((valor) => {
      const ehMaior = valor === maior;
      const ehMenor = valor === menor;
      const sufixo = ehMaior ? "⇧" : ehMenor ? "⇩" : "";
      return criarBotaoHistoricoDado(valor, sufixo, ehMaior || ehMenor);
    })
    .join(", ");
}

function registrarRolagemModalDano(rolagem) {
  if (!rolagem?.resultados?.length) return;
  const valor = rolagem.soma;
  estadoAtaqueArma.historicoRolagensDano = Array.isArray(
    estadoAtaqueArma.historicoRolagensDano,
  )
    ? [...estadoAtaqueArma.historicoRolagensDano, valor]
    : [valor];
  estadoAtaqueArma.ultimaRolagemDano = rolagem.resultados;
  atualizarResultadosDano();
  atualizarHistoricoRolagensModalDano();
}

function atualizarResultadosDano() {
  const campoResultados = document.getElementById("modalAtaqueResultadosDano");
  if (!campoResultados) return;

  const resultados = estadoAtaqueArma.ultimaRolagemDano;
  if (!Array.isArray(resultados) || !resultados.length) {
    campoResultados.textContent = "";
    atualizarDetalheDadoDanoModal();
    return;
  }

  campoResultados.textContent = "[" + resultados.join(", ") + "]";
}

function registrarRolagemModalAtaque(rolagem) {
  if (!rolagem?.resultados?.length) return;
  estadoAtaqueArma.historicoRolagens = Array.isArray(
    estadoAtaqueArma.historicoRolagens,
  )
    ? [...estadoAtaqueArma.historicoRolagens, ...rolagem.resultados]
    : [...rolagem.resultados];
  atualizarDetalheDadoAtaqueModal();
  atualizarHistoricoRolagensModalAtaque();
}

function atualizarEstadoCriticoModalAtaque() {
  const campoDado = document.getElementById("modalAtaqueDado");
  const botaoSucesso = document.getElementById("modalAtaqueSucesso");
  const botaoFracasso = document.getElementById("modalAtaqueFracasso");
  if (!campoDado || !botaoSucesso || !botaoFracasso) return;

  const dado = parseInt(campoDado.value, 10);
  botaoSucesso.classList.toggle("ataque-botao-critico", dado === 20);
  botaoFracasso.classList.toggle("ataque-botao-fracasso-critico", dado === 1);
  atualizarTotalModalAtaque();
}

function obterBonusIniciativaAtual() {
  const valor = document.getElementById("iniciativa")?.value ?? "";
  const bonus = parseInt(String(valor).replace(/[^\d-]/g, ""), 10);
  return Number.isInteger(bonus) ? bonus : 0;
}

function atualizarTotalModalIniciativa() {
  const campoDado = document.getElementById("modalIniciativaDado");
  const campoBonus = document.getElementById("modalIniciativaBonus");
  const campoTotal = document.querySelector("#modalIniciativaTotal strong");
  const campoFormula = document.getElementById("modalIniciativaFormula");
  const campoSubtitulo = document.getElementById("modalIniciativaSubtitulo");
  const bonus = obterBonusIniciativaAtual();
  const dado = parseInt(campoDado?.value, 10);
  const total = Number.isInteger(dado)
    ? RegrasCombate.calcularTotalD20(dado, [bonus])
    : null;
  const textoBonus = `${bonus >= 0 ? "+" : ""}${bonus}`;

  estadoModalIniciativa.dado = Number.isInteger(dado) ? dado : null;
  estadoModalIniciativa.bonus = bonus;
  estadoModalIniciativa.total = total;

  if (campoBonus) campoBonus.textContent = textoBonus;
  if (campoTotal) campoTotal.textContent = total === null ? "-" : total;
  if (campoFormula) campoFormula.textContent = `1d20 ${textoBonus}`;
  if (campoSubtitulo) {
    campoSubtitulo.textContent = `1d20 ${textoBonus}`;
  }
}

function atualizarHistoricoRolagensModalIniciativa() {
  const campoHistorico = document.getElementById(
    "modalIniciativaHistoricoLista",
  );
  if (!campoHistorico) return;

  const historico = Array.isArray(estadoModalIniciativa.historicoRolagens)
    ? [...estadoModalIniciativa.historicoRolagens]
    : [];

  if (!historico.length) {
    campoHistorico.textContent = "-";
    return;
  }

  const maior = Math.max(...historico);
  const menor = Math.min(...historico);
  campoHistorico.innerHTML = [...historico]
    .reverse()
    .map((valor) =>
      criarBotaoHistoricoDado(
        valor,
        "",
        historico.length > 1 && (valor === maior || valor === menor),
      ),
    )
    .join(" ");
}

function registrarRolagemModalIniciativa(rolagem) {
  const valor = rolagem?.soma;
  if (!Number.isInteger(valor)) return;

  estadoModalIniciativa.historicoRolagens = Array.isArray(
    estadoModalIniciativa.historicoRolagens,
  )
    ? [...estadoModalIniciativa.historicoRolagens, valor]
    : [valor];
  atualizarHistoricoRolagensModalIniciativa();
}

function atualizarInterfaceCombate() {
  const ativo = !!estadoCombateIniciativa.ativo;
  const rodada = ativo
    ? Math.max(1, parseInt(estadoCombateIniciativa.rodada, 10) || 1)
    : 0;
  const posicao = ativo
    ? parseInt(estadoCombateIniciativa.posicao, 10) || 1
    : 0;

  document
    .getElementById("combateInicioControle")
    ?.classList.toggle("oculto-combate", ativo);
  document
    .getElementById("combateHud")
    ?.classList.toggle("combate-ativo", ativo);
  document
    .getElementById("combatePosicaoCaixa")
    ?.classList.toggle("oculto-combate", !ativo);
  document
    .getElementById("combateRodadaCaixa")
    ?.classList.toggle("oculto-combate", !ativo);
  document
    .getElementById("btnEncerrarCombate")
    ?.classList.toggle("oculto-combate", !ativo);

  const campoRodada = document.getElementById("combateRodada");
  const campoPosicao = document.getElementById("ataquePosicao");

  if (campoRodada) campoRodada.value = ativo ? rodada : 0;
  if (campoPosicao) campoPosicao.value = ativo ? posicao : 0;

  atualizarRodadaModalAtaque();
  atualizarInterfaceRecursosTurno();
  window.FichaDnDCombateLayoutV2?.atualizar();
}

function abrirModalIniciativa() {
  const overlay = document.getElementById("modalIniciativaOverlay");
  const tituloCabecalho = document.getElementById("modalIniciativaCabecalhoTitulo");
  const campoDado = document.getElementById("modalIniciativaDado");
  const campoPosicao = document.getElementById("modalPosicaoIniciativa");
  if (!overlay || !campoDado || !campoPosicao) return;

  if (overlay.dataset.salvaguarda !== "true" && tituloCabecalho) {
    tituloCabecalho.textContent = "Rolar Iniciativa";
  }

  estadoModalIniciativa.dado = null;
  estadoModalIniciativa.total = null;
  estadoModalIniciativa.historicoRolagens = [];
  campoDado.value = "";
  campoPosicao.value = estadoCombateIniciativa.posicao || "";
  atualizarTotalModalIniciativa();
  atualizarHistoricoRolagensModalIniciativa();

  overlay.classList.remove("oculto");
  overlay.classList.add("ativo");
  overlay.removeAttribute("aria-hidden");
  campoDado.focus();
}

function fecharModalIniciativa() {
  const overlay = document.getElementById("modalIniciativaOverlay");
  if (!overlay) return;
  overlay.classList.remove("ativo");
  overlay.classList.add("oculto");
  overlay.setAttribute("aria-hidden", "true");
}

function confirmarIniciativa() {
  if (window.__fichaImportacaoTransacaoAtiva) return;
  const campoDado = document.getElementById("modalIniciativaDado");
  const campoPosicao = document.getElementById("modalPosicaoIniciativa");
  const dado = parseInt(campoDado?.value, 10);
  const posicao = parseInt(campoPosicao?.value, 10);

  if (!Number.isInteger(dado) || dado < 1 || dado > 20) {
    campoDado?.focus();
    return;
  }

  if (!Number.isInteger(posicao) || posicao < 1) {
    campoPosicao?.focus();
    return;
  }

  const total = RegrasCombate.calcularTotalD20(dado, [
    obterBonusIniciativaAtual(),
  ]);
  estadoCombateIniciativa.ativo = true;
  estadoCombateIniciativa.rodada = 1;
  estadoCombateIniciativa.posicao = posicao;
  estadoCombateIniciativa.iniciativa = total;
  estadoCombateIniciativa.recursosTurno = criarRecursosTurnoCombate(1);

  atualizarInterfaceCombate();
  adicionarRegistroHistoricoCombate("Iniciativa", total, "🎲");
  fecharModalIniciativa();
}

function avancarRodadaCombate() {
  if (!estadoCombateIniciativa.ativo) return;
  estadoCombateIniciativa.rodada =
    Math.max(1, parseInt(estadoCombateIniciativa.rodada, 10) || 1) + 1;
  estadoCombateIniciativa.recursosTurno = criarRecursosTurnoCombate(estadoCombateIniciativa.rodada);
  atualizarInterfaceCombate();
}

function encerrarCombate(opcoes = {}) {
  estadoCombateIniciativa.ativo = false;
  estadoCombateIniciativa.rodada = 0;
  estadoCombateIniciativa.posicao = null;
  estadoCombateIniciativa.iniciativa = null;
  delete estadoCombateIniciativa.recursosTurno;
  atualizarInterfaceCombate();

  if (opcoes.limparHistorico) {
    limparHistorico();
  }
}

function finalizarCombateLimparHistorico() {
  encerrarCombate({ limparHistorico: true });
}

function confirmarEncerrarCombate() {
  if (!confirm("Deseja realmente encerrar a batalha?")) return;
  encerrarCombate();
}

function obterRodadaAtualHistorico() {
  return estadoCombateIniciativa.ativo ? estadoCombateIniciativa.rodada : 0;
}

function obterRodadaCombateAtual() {
  return obterRodadaAtualHistorico();
}

function atualizarRodadaModalAtaque() {
  const campo = document.getElementById("modalAtaqueRodada");
  if (!campo) return;
  campo.innerHTML = `Rodada <strong>${obterRodadaCombateAtual()}</strong>`;
}

function tipoAcaoAtaqueDisponivel(tipoAcao) {
  if (!estadoCombateIniciativa.ativo || estadoAtaqueArma.acaoTurnoConsumida) return true;
  const parametros = obterParametrosConsumoTentativaAtaque(tipoAcao, true);
  if (!parametros) return false;
  if (tipoAcao === "Ação bônus" && estadoAtaqueArma.origem === "arma" && !parametros.ataqueQualificadorDuasArmas) return false;
  const atual = estadoCombateIniciativa.recursosTurno;
  const ataqueAdicional = parametros.tipoAcao === "Ação" && atual?.ataqueAcaoIniciado && atual?.ataquesAcaoRestantes > 0;
  return !!RegrasCombate.consumirAcaoTurno(atual, parametros.contextoAcao || normalizarContextoAcaoAtaque(tipoAcao), {
    ataqueQualificadorDuasArmas: parametros.ataqueQualificadorDuasArmas,
    maoAtaqueQualificador: parametros.maoAtaqueQualificador,
    maoAtaqueBonus: estadoAtaqueArma?.arma?.slot ?? null,
    ataqueDeArma: parametros.ataqueDeArma,
    ataqueAdicional,
  });
}

function marcarTipoAcaoModalAtaque(tipoSelecionado = "Ação") {
  const ehMagia = estadoAtaqueArma.origem === "magia";
  if (ehMagia)
    tipoSelecionado = obterTipoAcaoMagia(
      estadoAtaqueArma.magia,
      estadoAtaqueArma.aplicacaoEfeito,
    );
  const checkboxes = document.querySelectorAll(
    "#modalAtaqueEtapaDado input[data-tipo-acao]",
  );
  const tiposDisponiveis = [];
  checkboxes.forEach((checkbox) => {
    const disponivel = !ehMagia && tipoAcaoAtaqueDisponivel(checkbox.dataset.tipoAcao);
    checkbox.disabled = ehMagia || !disponivel;
    if (disponivel) tiposDisponiveis.push(checkbox.dataset.tipoAcao);
  });
  if (!ehMagia && !tiposDisponiveis.includes(tipoSelecionado)) {
    tipoSelecionado = ["Ação", "Ação bônus"].find((tipo) => tiposDisponiveis.includes(tipo)) || "Ação";
  }
  let encontrou = false;

  checkboxes.forEach((checkbox) => {
    const ativo = checkbox.dataset.tipoAcao === tipoSelecionado;
    checkbox.checked = ativo;
    if (ativo) encontrou = true;
  });

  if (!encontrou && checkboxes[0] && !ehMagia) checkboxes[0].checked = true;
  estadoAtaqueArma.tipoAcao = obterTipoAcaoSelecionadoModalAtaque();
  estadoAtaqueArma.contextoAcao = normalizarContextoAcaoAtaque(estadoAtaqueArma.tipoAcao) || "action";
  const campoGatilhoReacao = document.getElementById("modalAtaqueGatilhoReacaoCampo");
  if (campoGatilhoReacao) campoGatilhoReacao.hidden = estadoAtaqueArma.tipoAcao !== "Reação";
  atualizarIndicadorAtaquesRestantesTurno();
  atualizarDetalheBonusDanoModal();
  atualizarTotalModalDano();
}

function atualizarIndicadorAtaquesRestantesTurno() {
  const indicador = document.getElementById("combateAtaquesRestantesAcao");
  const recursos = estadoCombateIniciativa.recursosTurno;
  const mostrar = estadoCombateIniciativa.ativo && recursos?.ataqueAcaoIniciado &&
    Number.isInteger(recursos.ataquesAcaoRestantes) && recursos.ataquesAcaoRestantes > 0;
  if (!indicador) return;
  indicador.textContent = mostrar ? `Ataques restantes nesta ação: ${recursos.ataquesAcaoRestantes}` : "";
  indicador.hidden = !mostrar;
}

function obterTipoAcaoSelecionadoModalAtaque() {
  if (estadoAtaqueArma.origem === "magia") {
    return obterTipoAcaoMagia(
      estadoAtaqueArma.magia,
      estadoAtaqueArma.aplicacaoEfeito,
    );
  }
  const selecionado = document.querySelector(
    "#modalAtaqueEtapaDado input[data-tipo-acao]:checked",
  );
  return selecionado?.dataset.tipoAcao || "Ação";
}

function aplicarHistoricoDadoNoInput(inputId, valor) {
  const campo = document.getElementById(inputId);
  const numero = parseInt(valor, 10);
  if (!campo || !Number.isInteger(numero)) return;

  campo.value = numero;
  campo.dispatchEvent(new Event("input"));
  campo.dispatchEvent(new Event("change"));
  campo.focus();
  campo.select?.();
}

function alternarEtapaModalAtaque(exibirDano) {
  const etapaDado = document.getElementById("modalAtaqueEtapaDado");
  const etapaDano = document.getElementById("modalAtaqueEtapaDano");
  if (!etapaDado || !etapaDano) return;

  etapaDado.classList.toggle("oculto", exibirDano);
  etapaDano.classList.toggle("oculto", !exibirDano);
}

function obterTipoDanoAtaque(arma) {
  return String(
    arma?.danoTipo ||
      arma?.arma_tipo_dano ||
      arma?.tipo_dano ||
      arma?.bruto?.arma_tipo_dano ||
      arma?.bruto?.tipo_dano ||
      "",
  ).trim();
}

function obterParametrosConsumoTentativaAtaque(tipoAcao = obterTipoAcaoSelecionadoModalAtaque(), silencioso = false) {
  if (tipoAcao === "Reação" && estadoCombateIniciativa.ativo && !silencioso) {
    const gatilho = document.getElementById("modalAtaqueGatilhoReacao");
    if (!String(gatilho?.value || "").trim()) {
      const status = document.getElementById("combateRecursosTurnoStatus");
      if (status) status.textContent = "Descreva o gatilho que permite esta reação antes de confirmar.";
      gatilho?.focus();
      return null;
    }
  }
  const parElegivel = estadoAtaqueArma.origem === "arma" && parArmasElegivelDuasArmas();
  const qualificaAtaquePrincipal = tipoAcao === "Ação" && parElegivel;
  const tentativaBonusDuasArmas = tipoAcao === "Ação bônus" && estadoAtaqueArma.origem === "arma" && ehAtaqueSecundarioComDuasArmas();
  if (estadoCombateIniciativa.ativo && tentativaBonusDuasArmas) {
    const recursos = estadoCombateIniciativa.recursosTurno;
    const maosQualificadoras = recursos?.maosAtaqueQualificadoras?.length ? recursos.maosAtaqueQualificadoras : (recursos?.maoAtaqueQualificador ? [recursos.maoAtaqueQualificador] : []);
    if (!maosQualificadoras.some((mao) => mao !== estadoAtaqueArma.arma?.slot)) {
      if (!silencioso) {
        const status = document.getElementById("combateRecursosTurnoStatus");
        if (status) status.textContent = "A ação Ataque qualificadora deve ocorrer primeiro e usar a outra mão.";
      }
      return null;
    }
  }
  if (estadoAtaqueArma.origem === "arma" && Number(estadoAtaqueArma.arma?.slot) === 2) {
    const estadoMaoPrincipal = typeof estadoCombate !== "undefined" ? estadoCombate.maoPrincipal : null;
    const avaliacao = avaliarSelecaoSecundaria(
      document.getElementById("arma2Nome")?.value || "",
      estadoMaoPrincipal?.item || null,
      estadoMaoPrincipal?.modo || "uma_mao",
    );
    if (!avaliacao.valido) {
      if (!silencioso) {
        const status = document.getElementById("combateRecursosTurnoStatus");
        if (status) status.textContent = `Ataque bloqueado: ${avaliacao.motivo}`;
      }
      return null;
    }
  }
  return {
    tipoAcao,
    contextoAcao: normalizarContextoAcaoAtaque(tipoAcao),
    ataqueQualificadorDuasArmas: tentativaBonusDuasArmas,
    maoAtaqueQualificador: qualificaAtaquePrincipal ? estadoAtaqueArma.arma?.slot : null,
    ataqueDeArma: estadoAtaqueArma.origem === "arma",
  };
}

function validarRecursosTentativaAtaque() {
  if (estadoAtaqueArma.acaoTurnoConsumida || !estadoCombateIniciativa.ativo || estadoAtaqueArma.aplicacaoEfeito) return true;
  if (typeof window !== "undefined" && window.__fichaImportacaoTransacaoAtiva) return false;
  const parametros = obterParametrosConsumoTentativaAtaque();
  if (!parametros) return false;
  const atual = estadoCombateIniciativa.recursosTurno;
  const ataqueAdicional = parametros.tipoAcao === "Ação" && atual?.ataqueAcaoIniciado && atual?.ataquesAcaoRestantes > 0;
  const possivel = RegrasCombate.consumirAcaoTurno(atual, parametros.contextoAcao, {
    ataqueQualificadorDuasArmas: parametros.ataqueQualificadorDuasArmas,
    maoAtaqueQualificador: parametros.maoAtaqueQualificador,
    maoAtaqueBonus: estadoAtaqueArma?.arma?.slot ?? null,
    ataqueDeArma: parametros.ataqueDeArma,
    ataqueAdicional,
  });
  if (!possivel) {
    const status = document.getElementById("combateRecursosTurnoStatus");
    if (status) status.textContent = parametros.tipoAcao === "Ação bônus" && parametros.ataqueQualificadorDuasArmas && (!atual?.acaoUsada || !atual?.ataqueDuasArmasElegivel)
      ? "A ação Ataque com arma elegível precisa ocorrer antes da ação bônus de duas armas."
      : `${parametros.tipoAcao} já foi usada neste turno.`;
    return false;
  }
  return true;
}

function consumirRecursosTentativaAtaque() {
  if (estadoAtaqueArma.acaoTurnoConsumida) return true;
  if (typeof window !== "undefined" && window.__fichaImportacaoTransacaoAtiva) return false;
  if (estadoAtaqueArma.aplicacaoEfeito) {
    estadoAtaqueArma.acaoTurnoConsumida = true;
    return true;
  }
  const parametros = obterParametrosConsumoTentativaAtaque();
  if (!parametros || !validarRecursosTentativaAtaque()) return false;
  if (!consumirAcaoTurnoCombate(parametros.contextoAcao, parametros.ataqueQualificadorDuasArmas, parametros.maoAtaqueQualificador, parametros.ataqueDeArma)) return false;
  if (estadoAtaqueArma.origem === "arma") consumirMunicao(1, estadoAtaqueArma.arma);
  estadoAtaqueArma.acaoTurnoConsumida = true;
  return true;
}

function fecharModalAtaqueArma() {
  const overlay = document.getElementById("modalAtaqueOverlay");
  const campoDado = document.getElementById("modalAtaqueDado");
  const campoDano = document.getElementById("modalAtaqueDano");
  const campoGatilhoReacao = document.getElementById("modalAtaqueGatilhoReacao");
  const botaoSucesso = document.getElementById("modalAtaqueSucesso");
  const botaoFracasso = document.getElementById("modalAtaqueFracasso");
  const modalAtaqueResultadosDano = document.getElementById(
    "modalAtaqueResultadosDano",
  );

  estadoAtaqueArma.arma = null;
  estadoAtaqueArma.dado = null;
  estadoAtaqueArma.resolucaoD20 = null;
  estadoAtaqueArma.acaoTurnoConsumida = false;
  estadoAtaqueArma.totalAtaque = 0;
  estadoAtaqueArma.modBase = 0;
  estadoAtaqueArma.bonusProf = 0;
  estadoAtaqueArma.rotuloAtributo = "";
  estadoAtaqueArma.textoResumo = "";
  estadoAtaqueArma.tipoAcao = "Ação";
  estadoAtaqueArma.historicoRolagens = [];
  estadoAtaqueArma.historicoRolagensDano = [];
  estadoAtaqueArma.danoQtd = 1;
  estadoAtaqueArma.danoFaces = 0;
  estadoAtaqueArma.danoFormula = "";
  estadoAtaqueArma.danoModBase = 0;
  estadoAtaqueArma.ultimaRolagemDano = null;
  estadoAtaqueArma.origem = "arma";
  estadoAtaqueArma.modoAtaque = null;
  estadoAtaqueArma.magia = null;
  estadoAtaqueArma.nivelSlot = null;
  estadoAtaqueArma.danoTipo = "";
  estadoAtaqueArma.infoCD = "";
  estadoAtaqueArma.aplicacaoEfeito = false;
  estadoAtaqueArma.acaoTurnoConsumida = false;


  if (campoDado) campoDado.value = "";
  if (campoDano) campoDano.value = "";
  if (campoGatilhoReacao) campoGatilhoReacao.value = "";
  if (modalAtaqueResultadosDano) modalAtaqueResultadosDano.innerHTML = "";
  if (botaoSucesso) botaoSucesso.classList.remove("ataque-botao-critico");
  if (botaoFracasso)
    botaoFracasso.classList.remove("ataque-botao-fracasso-critico");
  alternarEtapaModalAtaque(false);
  marcarTipoAcaoModalAtaque("Ação");
  atualizarTotalModalAtaque();
  atualizarDetalheDadoAtaqueModal();
  atualizarDetalheBonusAtaqueModal();
  atualizarHistoricoRolagensModalAtaque();
  atualizarTotalModalDano();
  atualizarDetalheDadoDanoModal();
  atualizarDetalheBonusDanoModal();
  atualizarHistoricoRolagensModalDano();

  if (overlay) {
    overlay.classList.remove("ativo");
    overlay.classList.add("oculto");
    overlay.setAttribute("aria-hidden", "true");
  }
}

function abrirModalAtaqueArma(arma, contextoAtaque = {}) {
  if (Number(arma?.slot) === 2) {
    const estadoMaoPrincipal = typeof estadoCombate !== "undefined" ? estadoCombate.maoPrincipal : null;
    const avaliacao = avaliarSelecaoSecundaria(
      document.getElementById("arma2Nome")?.value || "",
      estadoMaoPrincipal?.item || null,
      estadoMaoPrincipal?.modo || "uma_mao",
    );
    if (!avaliacao.valido) {
      const status = document.getElementById("combateRecursosTurnoStatus");
      if (status) status.textContent = `Ataque bloqueado: ${avaliacao.motivo}`;
      return;
    }
  }
  if (arma?.usaMunicao || arma?.propriedades?.municao) {
    const municao =
      typeof buscarDadosMunicao === "function"
        ? buscarDadosMunicao(arma.arma_municao_id)
        : null;
    if (!municao || Number(municao.municao_quantidade) <= 0) {
      alert(
        !municao
          ? "Selecione uma munição no equipamento de combate antes de atacar."
          : `Sem munição: ${municao.municao_nome} está com quantidade zero.`,
      );
      return;
    }
  }
  const overlay = document.getElementById("modalAtaqueOverlay");
  const titulo = document.getElementById("modalAtaqueTitulo");
  const subtitulo = document.getElementById("modalAtaqueSubtitulo");
  const bonus = document.getElementById("modalAtaqueBonus");
  const resumo = document.getElementById("modalAtaqueResumo");
  const campoDado = document.getElementById("modalAtaqueDado");
  const campoDano = document.getElementById("modalAtaqueDano");
  const campoGatilhoReacao = document.getElementById("modalAtaqueGatilhoReacao");

  if (
    !overlay ||
    !titulo ||
    !subtitulo ||
    !bonus ||
    !resumo ||
    !campoDado ||
    !campoDano
  )
    return;


  const { rotuloAtributo, totalAtaque, textoResumo, modBase, bonusProf } =
    obterResumoBonusAtaqueArma(arma);

  estadoAtaqueArma.arma = arma;
  estadoAtaqueArma.origem = arma?.tipo === "magia" ? "magia" : "arma";
  estadoAtaqueArma.modoAtaque = contextoAtaque.modoAtaque || null;
  estadoAtaqueArma.magia = arma?.magiaOriginal || null;
  estadoAtaqueArma.nivelSlot = Number.isInteger(arma?.nivelSlot)
    ? arma.nivelSlot
    : null;
  estadoAtaqueArma.danoTipo = obterTipoDanoAtaque(arma);
  estadoAtaqueArma.infoCD = "";
  estadoAtaqueArma.aplicacaoEfeito = false;
  estadoAtaqueArma.dado = null;
  estadoAtaqueArma.resolucaoD20 = null;
  estadoAtaqueArma.totalAtaque = totalAtaque;
  estadoAtaqueArma.modBase = modBase || 0;
  estadoAtaqueArma.bonusProf = bonusProf || 0;
  estadoAtaqueArma.rotuloAtributo = rotuloAtributo;
  estadoAtaqueArma.textoResumo = textoResumo;
  const formulaDano = obterFormulaDanoAtual(arma);
  const infoDano = parsearFormulaDano(formulaDano);
  estadoAtaqueArma.danoQtd = infoDano.qtd;
  estadoAtaqueArma.danoFaces = infoDano.faces;
  estadoAtaqueArma.danoFormula = formulaDano;
  estadoAtaqueArma.danoModBase =
    estadoAtaqueArma.origem === "magia"
      ? arma?.danoBonusMagia || 0
      : modBase || 0;
  estadoAtaqueArma.tipoAcao = "Ação";
  estadoAtaqueArma.historicoRolagens = [];
  estadoAtaqueArma.historicoRolagensDano = [];
  estadoAtaqueArma.ultimaRolagemDano = null;

  titulo.innerHTML =
    estadoAtaqueArma.origem === "magia"
      ? `Ataque mágico com <span class="ataque-modal-titulo-arma">${arma?.nome || "magia"}</span>`
      : `Ataque com <span class="ataque-modal-titulo-arma">${arma?.nome || "arma"}</span>`;
  subtitulo.textContent = obterSubtituloModalAtaque(arma);
  resumo.textContent = "";
  campoDado.value = "";
  campoDano.value = arma?.origemDesarmada ? "1" : "";
  if (campoGatilhoReacao) campoGatilhoReacao.value = "";
  atualizarRodadaModalAtaque();
  marcarTipoAcaoModalAtaque("Ação");
  alternarEtapaModalAtaque(false);
  atualizarDetalheBonusAtaqueModal();
  atualizarDetalheDadoAtaqueModal();
  atualizarDetalheBonusDanoModal();
  atualizarDetalheDadoDanoModal();
  atualizarEstadoCriticoModalAtaque();
  atualizarTotalModalDano();
  atualizarHistoricoRolagensModalAtaque();
  atualizarHistoricoRolagensModalDano();
  overlay.classList.add("ativo");
  overlay.classList.remove("oculto");
  overlay.setAttribute("aria-hidden", "false");

  agendarFocoModalCombate(campoDado);
}

function abrirModalAtaqueMagia(magia, nivelSlot = null) {
  const arma = criarArmaVirtualMagia(magia);
  arma.nivelSlot = Number.isInteger(nivelSlot) ? nivelSlot : null;
  abrirModalAtaqueArma(arma);
}

function obterDadoModalAtaque() {
  const campoDado = document.getElementById("modalAtaqueDado");
  if (!campoDado) return null;

  const dado = parseInt(campoDado.value, 10);
  if (!Number.isInteger(dado) || dado < 1 || dado > 20) {
    campoDado.focus();
    return null;
  }

  return dado;
}

function abrirEtapaDanoAtaque() {
  if (typeof window !== "undefined" && window.__fichaImportacaoTransacaoAtiva) return;
  const dadoInformado = obterDadoModalAtaque();
  const resumo = document.getElementById("modalAtaqueResumo");
  const subtitulo = document.getElementById("modalAtaqueSubtitulo");
  const campoDano = document.getElementById("modalAtaqueDano");
  if (dadoInformado === null || !resumo || !subtitulo || !campoDano) return;

  const resolucao = obterResolucaoManualD20Atual(
    "modalAtaque",
    "ataque",
    dadoInformado,
    estadoAtaqueArma.resolucaoD20,
  );
  if (!resolucao) {
    document.getElementById("modalAtaqueRolarDado")?.focus();
    return;
  }
  const dado = resolucao.escolhido;
  estadoAtaqueArma.resolucaoD20 = resolucao;

  estadoAtaqueArma.dado = dado;
  if (!validarRecursosTentativaAtaque()) {
    estadoAtaqueArma.dado = null;
    estadoAtaqueArma.resolucaoD20 = null;
    return;
  }
  subtitulo.textContent = obterSubtituloModalAtaque(estadoAtaqueArma.arma);
  const totalAtaque = RegrasCombate.calcularTotalD20(dado, [
    estadoAtaqueArma.modBase || 0,
    estadoAtaqueArma.bonusProf || 0,
  ]);
  const iconeAtributo = obterIconeAtributoAtaque(
    estadoAtaqueArma.rotuloAtributo,
  );
  const tooltipAtributo = obterTooltipAtributoAtaque(
    estadoAtaqueArma.rotuloAtributo,
  );
  const iconeDano = obterIconeAtributoAtaque(estadoAtaqueArma.rotuloAtributo);
  const tooltipDano = obterTooltipAtributoAtaque(
    estadoAtaqueArma.rotuloAtributo,
  );
  const formulaDanoTexto = estadoAtaqueArma.danoFormula || "?";
  const bonusDanoEfetivo = obterBonusDanoEfetivoModalAtaque();
  const detalheDano =
    estadoAtaqueArma.origem === "magia"
      ? estadoAtaqueArma.arma?.danoBonusRotuloMagia || "bônus da magia"
      : estadoAtaqueArma.tipoAcao === "Ação bônus"
        ? bonusDanoEfetivo < 0 && ehAtaqueSecundarioComDuasArmas()
          ? "modificador negativo mantido no ataque secundário com duas armas"
          : "sem modificador em ação bônus"
        : tooltipDano;
  const rotuloDano =
    estadoAtaqueArma.origem === "magia" ? "Dano da magia" : "Dano da arma";
  resumo.innerHTML = `Ataque: <span class="ataque-modal-resumo-destaque">${totalAtaque}</span> (<span class="ataque-modal-resumo-destaque${dado === 20 ? " ataque-modal-resumo-dado-critico" : ""}"><span class="calc-item" title="Valor do dado"><span class="numero">${dado}</span><span class="emoji">🎲</span></span></span> + <span class="ataque-modal-resumo-destaque"><span class="calc-item" title="${tooltipAtributo}"><span class="numero">${estadoAtaqueArma.modBase || 0}</span><span class="emoji">${iconeAtributo}</span></span></span> + <span class="ataque-modal-resumo-destaque"><span class="calc-item" title="Bônus de ataque"><span class="numero">${estadoAtaqueArma.bonusProf || 0}</span><span class="emoji">🅿️</span></span></span>)<br>${rotuloDano}: <span class="ataque-modal-resumo-destaque">${formulaDanoTexto} + <span class="calc-item" title="${detalheDano}"><span class="numero">${bonusDanoEfetivo}</span><span class="emoji">${bonusDanoEfetivo === 0 && estadoAtaqueArma.tipoAcao === "Ação bônus" ? "" : iconeDano}</span></span></span>`;
  const botaoRolarDano = document.getElementById("modalAtaqueRolarDano");
  if (botaoRolarDano) {
    const formulaBtn =
      estadoAtaqueArma.danoFaces > 0
        ? estadoAtaqueArma.danoQtd + "d" + estadoAtaqueArma.danoFaces
        : "dano";
    const textoRolar = "Rolar " + formulaBtn;
    botaoRolarDano.setAttribute("aria-label", textoRolar);
    botaoRolarDano.setAttribute("title", textoRolar);
  }
  const campoResultadosDano = document.getElementById(
    "modalAtaqueResultadosDano",
  );
  if (campoResultadosDano && estadoAtaqueArma.danoFaces > 0) {
    campoResultadosDano.textContent =
      estadoAtaqueArma.danoQtd + "d" + estadoAtaqueArma.danoFaces;
  }
  atualizarDetalheBonusDanoModal();
  atualizarDetalheDadoDanoModal();
  atualizarTotalModalDano();

  atualizarHistoricoRolagensModalDano();
  alternarEtapaModalAtaque(true);
  agendarFocoModalCombate(campoDano);
}

function configurarBotaoRolarDanoModal() {
  const botaoRolarDano = document.getElementById("modalAtaqueRolarDano");
  if (!botaoRolarDano) return;

  const formulaBtn =
    estadoAtaqueArma.danoFaces > 0
      ? estadoAtaqueArma.danoQtd + "d" + estadoAtaqueArma.danoFaces
      : "dano";
  const textoRolar = "Rolar " + formulaBtn;
  botaoRolarDano.setAttribute("aria-label", textoRolar);
  botaoRolarDano.setAttribute("title", textoRolar);
}

function abrirModalDanoMagia(magia, opcoes = {}) {
  const overlay = document.getElementById("modalAtaqueOverlay");
  const titulo = document.getElementById("modalAtaqueTitulo");
  const subtitulo = document.getElementById("modalAtaqueSubtitulo");
  const resumo = document.getElementById("modalAtaqueResumo");
  const campoDado = document.getElementById("modalAtaqueDado");
  const campoDano = document.getElementById("modalAtaqueDano");
  const arma = criarArmaVirtualMagia(magia);
  const infoDano = parsearFormulaDano(arma.danoFormula || "");
  if (!overlay || !titulo || !subtitulo || !resumo || !campoDano) return;


  estadoAtaqueArma.arma = arma;
  estadoAtaqueArma.origem = "magia";
  estadoAtaqueArma.aplicacaoEfeito = !!opcoes.aplicacaoEfeito;
  estadoAtaqueArma.magia = arma.magiaOriginal || null;
  estadoAtaqueArma.nivelSlot = Number.isInteger(opcoes.nivelSlot)
    ? opcoes.nivelSlot
    : null;
  estadoAtaqueArma.dado = null;
  estadoAtaqueArma.totalAtaque = 0;
  estadoAtaqueArma.modBase = arma.calculoMagia?.modBase || 0;
  estadoAtaqueArma.bonusProf = arma.calculoMagia?.bonusProf || 0;
  estadoAtaqueArma.rotuloAtributo = arma.calculoMagia?.rotuloAtributo || "";
  estadoAtaqueArma.textoResumo = "";
  estadoAtaqueArma.tipoAcao = "Ação";
  estadoAtaqueArma.historicoRolagens = [];
  estadoAtaqueArma.historicoRolagensDano = [];
  estadoAtaqueArma.danoQtd = infoDano.qtd;
  estadoAtaqueArma.danoFaces = infoDano.faces;
  estadoAtaqueArma.danoFormula = arma.danoFormula || "";
  estadoAtaqueArma.danoModBase = arma.danoBonusMagia || 0;
  estadoAtaqueArma.ultimaRolagemDano = null;
  estadoAtaqueArma.danoTipo = arma.danoTipo || arma?.arma_tipo_dano || "";
  estadoAtaqueArma.infoCD = opcoes.mostrarCD
    ? `CD para Evitar suas Magias: ${String(document.getElementById("magiaCD")?.value || "-").trim() || "-"}`
    : "";

  titulo.innerHTML = `Dano de <span class="ataque-modal-titulo-arma">${arma.nome}</span>`;
  subtitulo.textContent = opcoes.mostrarCD
    ? magia?.teste_resistencia
      ? `Teste de Resistência: ${magia.teste_resistencia}`
      : "Teste de Resistência"
    : "Dano automático";
  if (campoDado) campoDado.value = "";
  campoDano.value = "";

  const linhaCD = estadoAtaqueArma.infoCD
    ? `<div>${estadoAtaqueArma.infoCD}</div>`
    : "";
  resumo.innerHTML = `${linhaCD}<div>Dano da magia: <span class="ataque-modal-resumo-destaque">${estadoAtaqueArma.danoFormula || "dano"} + ${formatarBonusAtaqueModal(estadoAtaqueArma.danoModBase || 0)}</span></div>`;

  atualizarRodadaModalAtaque();
  marcarTipoAcaoModalAtaque("Ação");
  configurarBotaoRolarDanoModal();
  atualizarDetalheBonusDanoModal();
  atualizarDetalheDadoDanoModal();
  atualizarTotalModalDano();
  atualizarHistoricoRolagensModalDano();
  alternarEtapaModalAtaque(true);
  overlay.classList.add("ativo");
  overlay.classList.remove("oculto");
  overlay.setAttribute("aria-hidden", "false");
  agendarFocoModalCombate(campoDano);
}

function atualizarSubAbaArmas() {
  const container = document.getElementById("subabaCombateArma");
  if (!container) return;

  const armas = obterArmasEquipadasAtivas();

  if (!armas.length) {
    armas.push({
      nome: "Ataque desarmado",
      chaveAtributo: "for",
      ataque: "for",
      dano: "1 concussão",
      danoFormula: "1",
      arma_tipo_dano: "concussão",
      propriedade: "Sem propriedades",
      proficiente: true,
      catalogoId: "punch",
      icone: "../assets/icons/armas/punch.svg",
      origemDesarmada: true,
    });
  }

  container.replaceChildren();

  const lista = document.createElement("div");
  lista.className = "arma-resumo-lista";

  armas.forEach((arma) => {
    if (!arma?.nome) return;

    const item = document.createElement("div");
    item.className = "arma-resumo-item";

    const topo = document.createElement("div");
    topo.className = "arma-resumo-topo";

    const nome = (arma.nome || "").trim();

    const usaMunicao = arma.propriedade?.toLowerCase().includes("munição");

    let municaoTitulo = "";

    if (usaMunicao) {
      const idMunicao = arma.arma_municao_id;

      if (idMunicao) {
        const itemMunicao =
          typeof buscarDadosMunicao === "function"
            ? buscarDadosMunicao(idMunicao)
            : null;
        const nomeMunicao = itemMunicao?.municao_nome;
        const qtdAtual = itemMunicao?.municao_quantidade;

        if (nomeMunicao) {
          municaoTitulo = `${qtdAtual || "-"} ${nomeMunicao}`;
        }
      }
    }

    const iconesCombate = window.FichaDnDCombateIcons;
    if (iconesCombate) {
      topo.appendChild(iconesCombate.criarIconeArma(document, arma));
    } else {
      const iconeFallback = document.createElement("span");
      iconeFallback.className = "arma-resumo-icone-fallback";
      iconeFallback.setAttribute("aria-hidden", "true");
      iconeFallback.textContent = "⚔️";
      topo.appendChild(iconeFallback);
    }
    const nomeElemento = document.createElement("span");
    nomeElemento.className = "arma-resumo-nome";
    nomeElemento.textContent = nome;
    topo.appendChild(nomeElemento);
    const armaOriginal = arma.bruto || arma;
    const indicadorProficiencia = window.criarIndicadorProficienciaArma?.(armaOriginal);
    if (indicadorProficiencia) topo.appendChild(indicadorProficiencia);
    if (municaoTitulo) {
      const municao = document.createElement("span");
      municao.className = "arma-resumo-municao";
      municao.textContent = `🏹 ${municaoTitulo}`;
      topo.appendChild(municao);
    }

    const detalhes = document.createElement("div");
    detalhes.className = "arma-resumo-detalhes";

    // 🔥 CORREÇÃO PRINCIPAL
    const resumo = getResumoCalculoAtaque(arma);
    const textoAtaque = resumo?.textoResumo || "-";

    detalhes.innerHTML =
      `<strong>Ataque: ${textoAtaque} | Dano: ${arma.dano || "-"}</strong>` +
      `<br>Propriedade: ${arma.propriedade || "-"}`;

    item.appendChild(topo);
    item.appendChild(detalhes);

    const controles = document.createElement("div");
    controles.className = "arma-resumo-controles";
    const atributoAtaque =
      window.FichaDnDCombateLayoutV2?.atributosAtaque?.[arma.slot];
    if (atributoAtaque && !atributoAtaque.disabled) {
      const controle = document.createElement("label");
      controle.className = "arma-resumo-atributo";
      const rotulo = document.createElement("span");
      rotulo.textContent = "Atributo de ataque";
      controle.append(rotulo, atributoAtaque);
      atributoAtaque.addEventListener("click", (evento) =>
        evento.stopPropagation(),
      );
      controles.appendChild(controle);
    }

    const dadosModo = arma.origemDesarmada
      ? { modos: ["corpo-a-corpo"], alcance: null }
      : obterDadosModoAtaqueArma(arma);
    const acoes = document.createElement("div");
    acoes.className = "arma-resumo-acoes";
    dadosModo.modos.forEach((modoAtaque) => {
      const atacar = document.createElement("button");
      atacar.type = "button";
      atacar.className = "arma-resumo-acao";
      const texto = modoAtaque === "corpo-a-corpo"
        ? "Atacar: Corpo a Corpo"
        : modoAtaque === "distancia"
          ? `Atacar: Distância${formatarAlcanceBotaoAtaque(dadosModo.alcance)}`
          : `Arremessar${formatarAlcanceBotaoAtaque(dadosModo.alcance)}`;
      atacar.textContent = texto;
      atacar.setAttribute("aria-label", texto);
      atacar.addEventListener("click", (evento) => { evento.stopPropagation(); abrirModalAtaqueArma(arma, { modoAtaque }); });
      acoes.appendChild(atacar);
    });
    controles.appendChild(acoes);
    item.appendChild(controles);
    lista.appendChild(item);
  });

  container.appendChild(lista);
  renderizarArmasArremessadas(container);
  window.FichaDnDCombateLayoutV2?.atualizar();
}

// ===== Combate, historico e contra a morte =====
function aplicarDanoNoPV(valorInformado = null) {
  const eventoFornecido =
    valorInformado && typeof valorInformado === "object" && !Array.isArray(valorInformado)
      ? valorInformado
      : null;
  const entrada = eventoFornecido
    ? eventoFornecido.quantidade
    : valorInformado === null
      ? prompt("Quanto de dano o personagem tomou?")
      : String(valorInformado);

  if (entrada === null || entrada === undefined) return;

  const danoBruto = eventoFornecido
    ? entrada
    : parseInt(entrada, 10);
  if (!Number.isInteger(danoBruto) || danoBruto < 0) return;

  let resolucaoTipada = null;
  if (eventoFornecido?.tipo) {
    resolucaoTipada = RegrasCombate.resolverDanoTipado({
      quantidade: danoBruto,
      tipo: eventoFornecido.tipo,
      origem: eventoFornecido.origem || "Dano recebido",
      imunidades: eventoFornecido.imunidades || [],
      resistencias: eventoFornecido.resistencias || [],
      vulnerabilidades: eventoFornecido.vulnerabilidades || [],
    });
    if (!resolucaoTipada) return;
  }
  const dano = resolucaoTipada?.final ?? danoBruto;

  const campoPV = document.getElementById("pvAtual");
  const campoPVTemporario = document.getElementById("pvTemporario");
  if (!campoPV || typeof RegrasCombate === "undefined") return;

  const resultado = RegrasCombate.calcularPVDepoisDeDano({
    pvAtuais: parseInt(campoPV.value, 10) || 0,
    pvTemporarios: parseInt(campoPVTemporario?.value, 10) || 0,
    dano,
  });
  if (!resultado) return;
  campoPV.value = String(resultado.pvAtuais);
  if (campoPVTemporario) {
    campoPVTemporario.value = String(resultado.pvTemporarios);
  }
  if (resolucaoTipada) {
    const normalizarTipoDano = (valor) => String(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/\s*\(force\)\s*$/, "")
      .replace(/^congelante$/, "frio");
    const temTipo = (lista) =>
      Array.isArray(lista) &&
      lista.some((item) => normalizarTipoDano(item) === normalizarTipoDano(resolucaoTipada.tipo));
    const resistido = temTipo(eventoFornecido.resistencias);
    const vulneravel = temTipo(eventoFornecido.vulnerabilidades);
    const ajuste = resolucaoTipada.imune
      ? "imunidade aplicada"
      : resistido && vulneravel
        ? "resistência e vulnerabilidade se cancelam"
        : resolucaoTipada.resistido
          ? "resistência aplicada"
          : resolucaoTipada.vulneravel
            ? "vulnerabilidade aplicada"
            : "sem ajuste defensivo";
    const origem = String(eventoFornecido.origem || "Dano recebido");
    const ajusteVisivel = ajuste === "sem ajuste defensivo" ? "" : `; ${ajuste}`;
    const texto = resolucaoTipada.imune
      ? `Dano ${resolucaoTipada.tipo}: ${danoBruto} bruto${ajusteVisivel}; 0 final (${origem}).`
      : `Dano ${resolucaoTipada.tipo}: ${danoBruto} bruto${ajusteVisivel}; ${dano} final (${origem}).`;
    adicionarRegistroHistoricoCombate("Dano", dano, "💥", "", {
      timeline: { simples: true, exibirBadge: false, texto },
    });
  } else {
    registrarHistoricoComandoCombate("Dano", dano);
  }
  normalizarPontosDeVida();
  if (dano > 0) abrirTesteConcentracaoPorDano(dano);
}

function curarPV(valorInformado = null) {
  const entrada =
    valorInformado === null
      ? prompt("Quanto o personagem recuperou?")
      : String(valorInformado);

  if (entrada === null || entrada === undefined) return;

  const cura = parseInt(entrada, 10);
  if (!Number.isFinite(cura) || cura < 0) return;

  const campoPV = document.getElementById("pvAtual");
  const campoPVTotal = document.getElementById("pvTotal");
  if (!campoPV || !campoPVTotal || typeof RegrasCombate === "undefined") return;

  const resultado = RegrasCombate.calcularPVDepoisDeCura({
    pvAtuais: parseInt(campoPV.value, 10) || 0,
    pvMaximos: parseInt(campoPVTotal.value, 10) || 0,
    cura,
  });
  if (!resultado) return;
  campoPV.value = String(resultado.pvAtuais);
  registrarHistoricoComandoCombate("Cura", cura);
  normalizarPontosDeVida();
}

function abrirModalVida(tipo = "dano") {
  const overlay = document.getElementById("modalVidaAtualizarOverlay");
  const titulo = document.getElementById("modalVidaTitulo");
  const subtitulo = document.getElementById("modalVidaSubtitulo");
  const input = document.getElementById("modalVidaInput");
  const confirmar = document.getElementById("modalVidaConfirmar");

  if (!overlay || !titulo || !subtitulo || !input || !confirmar) return;

  const ehDano = tipo === "dano";
  titulo.textContent = ehDano ? "Tomar dano" : "Curar dano";
  subtitulo.textContent = ehDano
    ? "Informe a quantidade de dano sofrida."
    : "Informe a quantidade de vida recuperada.";
  confirmar.textContent = ehDano ? "Aplicar dano" : "Aplicar cura";
  confirmar.dataset.tipo = ehDano ? "dano" : "cura";
  const tipoDano = document.getElementById("modalDanoTipo");
  const tipoDanoContainer = document.getElementById("modalDanoTipoContainer");
  if (tipoDanoContainer) tipoDanoContainer.hidden = !ehDano;
  if (tipoDano) tipoDano.value = "";
  input.value = "";
  input.placeholder = ehDano ? "Ex: 8" : "Ex: 5";
  input.min = "0";
  input.step = "1";
  input.focus();

  overlay.classList.add("ativo");
  overlay.style.display = "flex";
  overlay.setAttribute("aria-hidden", "false");
}

function fecharModalVida() {
  const overlay = document.getElementById("modalVidaAtualizarOverlay");
  const input = document.getElementById("modalVidaInput");

  if (overlay) {
    overlay.classList.remove("ativo");
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
  }

  if (input) input.value = "";
}

function confirmarModalVida() {
  const input = document.getElementById("modalVidaInput");
  const confirmar = document.getElementById("modalVidaConfirmar");
  if (!input || !confirmar) return;

  const valor = parseInt(input.value, 10);
  if (!Number.isFinite(valor) || valor < 0) {
    input.focus();
    return;
  }

  const tipo = confirmar.dataset.tipo === "cura" ? "cura" : "dano";
  if (tipo === "dano") {
    const tipoDano = document.getElementById("modalDanoTipo")?.value || "";
    if (tipoDano) {
      aplicarDanoNoPV({
        quantidade: valor,
        tipo: tipoDano,
        origem: "Dano manual",
      });
    } else {
      aplicarDanoNoPV(valor);
    }
  } else {
    curarPV(valor);
  }

  fecharModalVida();
}

window.aplicarDanoNoPV = aplicarDanoNoPV;
window.curarPV = curarPV;
window.abrirModalVida = abrirModalVida;
window.fecharModalVida = fecharModalVida;
window.confirmarModalVida = confirmarModalVida;
window.normalizarPontosDeVida = normalizarPontosDeVida;

function escaparHtmlHistorico(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizarTipoAcaoHistorico(tipoAcao = "Ação") {
  const texto = String(tipoAcao || "Ação").toLowerCase();
  if (texto === "efeito") return { texto: "EFEITO", classe: "efeito" };
  if (texto === "conjuração" || texto === "conjuracao") {
    return { texto: "CONJURAÇÃO", classe: "conjuracao" };
  }
  if (texto.includes("reação") || texto.includes("reacao")) {
    return { texto: "REAÇÃO", classe: "reacao" };
  }
  if (texto.includes("bônus") || texto.includes("bonus")) {
    return { texto: "BÔNUS", classe: "bonus" };
  }
  return { texto: "AÇÃO", classe: "acao" };
}

function obterTituloMagiaHistorico(nivelSlot) {
  return Number.isInteger(nivelSlot) && nivelSlot > 0
    ? `Magia NV ${nivelSlot}`
    : "Truque";
}

function criarDivisorRodadaHistorico(rodada) {
  const divisor = document.createElement("div");
  divisor.className = "historico-rodada-divisor";
  divisor.dataset.rodadaDivisor = String(rodada);
  divisor.textContent = `Rodada ${rodada}`;
  return divisor;
}

function garantirDivisorRodadaHistorico(container, rodada) {
  if (!rodada) return;
  const primeiro = container.firstElementChild;
  if (primeiro?.dataset?.rodadaDivisor === String(rodada)) return;
  if (primeiro?.dataset?.rodada === String(rodada)) {
    const segundo = primeiro.nextElementSibling;
    if (segundo?.dataset?.rodadaDivisor === String(rodada)) {
      container.insertBefore(segundo, primeiro);
      return;
    }
    container.insertBefore(criarDivisorRodadaHistorico(rodada), primeiro);
    return;
  }
  container.prepend(criarDivisorRodadaHistorico(rodada));
}

function restaurarHistoricoEventosEstruturados(eventos) {
  const container = document.getElementById("historicoRegistros");
  if (!container || !Array.isArray(eventos)) return;
  container.replaceChildren();
  [...eventos].sort((a, b) => String(a.criadoEm || "").localeCompare(String(b.criadoEm || ""))).forEach((evento) => {
    const dados = evento?.efeito?.dados;
    if (!dados || typeof dados !== "object") return;
    const registro = montarRegistroTimelineHistorico(dados);
    registro.dataset.rodada = String(evento.rodada || "");
    container.prepend(registro);
    garantirDivisorRodadaHistorico(container, evento.rodada);
  });
}

function montarRegistroTimelineHistorico(dados) {
  const registro = document.createElement("div");
  registro.className = "historico-registro";
  if (dados.classe) registro.classList.add(dados.classe);
  if (dados.simples) registro.classList.add("simples");
  if (dados.dado === 20) registro.classList.add("critico");
  if (dados.dado === 1) registro.classList.add("falha-critica");

  const tipoAcao = normalizarTipoAcaoHistorico(dados.tipoAcao);
  const titulo = escaparHtmlHistorico(dados.titulo || dados.tipo || "Ação");
  const nome = escaparHtmlHistorico(dados.nome || dados.valor || "");
  const iconeNome = dados.iconeNome || dados.icone || "";
  const danoTipo = escaparHtmlHistorico(dados.danoTipo || "");
  const partesResultado = [];

  if (dados.simples) {
    const textoSimples = escaparHtmlHistorico(dados.texto || nome || titulo);
    registro.innerHTML = `<div class="historico-evento-simples">${textoSimples}</div>`;
    return registro;
  }

  if (Number.isInteger(dados.dado)) {
    const bonusAtaque = Number.isFinite(dados.bonusAtaque)
      ? dados.bonusAtaque
      : null;
    const totalAtaque = Number.isFinite(dados.totalAtaque)
      ? dados.totalAtaque
      : bonusAtaque === null
        ? dados.dado
        : dados.dado + bonusAtaque;
    const detalheAtaque =
      bonusAtaque === null
        ? ""
        : ` (${dados.dado}${bonusAtaque >= 0 ? "+" : ""}${bonusAtaque})`;
    if (dados.dado === 20) {
      partesResultado.push(
        `<span class="historico-evento-critico">🎲 ${totalAtaque}${detalheAtaque} ✦</span>`,
      );
    } else if (dados.dado === 1) {
      partesResultado.push(
        `<span class="historico-evento-falha">🎲 ${totalAtaque}${detalheAtaque} ✖ Falha Crítica</span>`,
      );
    } else if (dados.sucesso === false) {
      partesResultado.push(`🎲 ${totalAtaque}${detalheAtaque} ✖`);
    } else {
      partesResultado.push(`🎲 ${totalAtaque}${detalheAtaque} ✔`);
    }
  }

  if (Number.isFinite(dados.danoBruto)) {
    const danoFinal = Number.isFinite(dados.dano) ? dados.dano : 0;
    const ajuste = typeof dados.ajusteDano === "string" && dados.ajusteDano !== "sem ajuste defensivo"
      ? escaparHtmlHistorico(dados.ajusteDano)
      : "";
    partesResultado.push(
      `💥${danoFinal}${danoTipo ? ` ${danoTipo}` : ""}${ajuste ? ` (${dados.danoBruto} bruto; ${ajuste})` : ""}`,
    );
  } else if (Number.isFinite(dados.dano) && dados.dano > 0) {
    partesResultado.push(`💥${dados.dano}${danoTipo ? ` ${danoTipo}` : ""}`);
  }

  if (Number.isFinite(dados.cura) && dados.cura > 0) {
    partesResultado.push(`💚 ${dados.cura} Cura`);
  }

  registro.innerHTML = `
          <div class="historico-evento-topo">
            ${dados.exibirBadge === false ? "" : `<span class="historico-acao-badge ${tipoAcao.classe}">${tipoAcao.texto}</span>`}
            <span class="historico-evento-tipo">${titulo}</span>
            ${dados.concentrando ? '<span class="historico-concentracao">🌀Concentração Iniciada</span>' : ""}
          </div>
          ${nome ? `<div class="historico-evento-nome">${iconeNome ? `${iconeNome} ` : ""}${nome}</div>` : ""}
          ${partesResultado.length ? `<div class="historico-evento-resultado">${partesResultado.join(" • ")}</div>` : ""}
        `;

  return registro;
}

function adicionarRegistroHistoricoCombate(
  tipo,
  valor,
  iconePersonalizado = "",
  detalheRodada = "",
  opcoes = {},
) {
  const rodada = obterRodadaAtualHistorico();
  const registrosContainer = document.getElementById("historicoRegistros");
  if (!Array.isArray(estadoCombateIniciativa.historicoEventos)) estadoCombateIniciativa.historicoEventos = [];

  // 🔥 Mapa de emojis
  const icones = {
    Cura: "❤️",
    Fracasso: "💀",
    Dano: "💥",
    Sucesso: "🍀",
    "Ataque falhou!": "❌",
    "Ataque!": "⚔️",
    "Dano Mágico": "✨",
  };
  icones["Ataque"] = "⚔️";

  const icone = iconePersonalizado || icones[tipo] || "";
  const dadosEvento = opcoes.timeline
    ? { tipo, valor, icone, tipoAcao: detalheRodada || opcoes.tipoAcao || "Ação", ...opcoes.timeline }
    : { tipo, valor, icone, tipoAcao: detalheRodada || opcoes.tipoAcao || "Ação" };
  const geradorId = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  const idEvento = geradorId ? geradorId() : `evento-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  estadoCombateIniciativa.historicoEventos.push({
    id: idEvento,
    criadoEm: new Date().toISOString(),
    rodada: Number.isInteger(rodada) && rodada > 0 ? rodada : null,
    tipo: String(tipo || "Ação"),
    subtipo: String(dadosEvento.tipoAcao || "Ação"),
    origem: opcoes.origem || null,
    alvo: opcoes.alvo || null,
    rolagem: opcoes.rolagem || null,
    modificadores: Array.isArray(opcoes.modificadores) ? [...opcoes.modificadores] : [],
    efeito: { evento: opcoes.evento || (dadosEvento.tipoAcao === "Efeito" ? "aplicacao" : "acao"), dados: dadosEvento },
    consumo: opcoes.consumo || null,
  });
  if (!registrosContainer) return;

  if (tipo === "Iniciativa") {
    const registroIniciativa = document.createElement("div");
    registroIniciativa.className = "historico-registro iniciativa";
    const posicao = estadoCombateIniciativa.posicao || "-";
    registroIniciativa.innerHTML = `Batalha Iniciada: 🎲 Inic. ${escaparHtmlHistorico(valor)} | Pos: ${escaparHtmlHistorico(posicao)}º`;
    registrosContainer.prepend(registroIniciativa);
    return;
  }

  const dadosTimeline = opcoes.timeline
    ? {
        tipo,
        valor,
        icone,
        tipoAcao: detalheRodada || opcoes.tipoAcao || "Ação",
        ...opcoes.timeline,
      }
    : {
        tipo,
        valor:
          tipo === "Dano" ? `${valor}` : tipo === "Cura" ? `${valor}` : valor,
        icone,
        tipoAcao: detalheRodada || opcoes.tipoAcao || "Ação",
        titulo: tipo,
        nome:
          tipo === "Dano"
            ? "Dano recebido"
            : tipo === "Cura"
              ? "Cura recebida"
              : valor,
        dano: tipo === "Dano" ? Number(valor) : null,
        cura: tipo === "Cura" ? Number(valor) : null,
        iconeNome: tipo === "Cura" ? "💚" : icone,
        simples: true,
        exibirBadge: false,
        texto:
          tipo === "Dano"
            ? `💥 Dano ${valor}`
            : tipo === "Cura"
              ? `💚 Cura ${valor}`
              : `${icone ? `${icone} ` : ""}${tipo}${valor ? ` ${valor}` : ""}`,
      };

  const registro = montarRegistroTimelineHistorico(dadosTimeline);
  registro.dataset.rodada = String(rodada);

  registrosContainer.prepend(registro);
  garantirDivisorRodadaHistorico(registrosContainer, rodada);
}

function registrarHistoricoAtaqueArma(sucesso, dano, resolucaoDano = null) {
  const arma = estadoAtaqueArma.arma;
  const dado = estadoAtaqueArma.dado;
  if (!arma || (dado === null && estadoAtaqueArma.origem !== "magia")) return;

  const tipoAcao = obterTipoAcaoSelecionadoModalAtaque();
  if (!consumirRecursosTentativaAtaque()) return false;

  const ehMagia = estadoAtaqueArma.origem === "magia";
  const ehEfeito = ehMagia && estadoAtaqueArma.aplicacaoEfeito;
  const nivelMagia = Number.isInteger(estadoAtaqueArma.nivelSlot)
    ? estadoAtaqueArma.nivelSlot
    : Number(estadoAtaqueArma.magia?.nivel) || 0;
  const tipoDano =
    estadoAtaqueArma.danoTipo ||
    arma?.arma_tipo_dano ||
    arma?.tipo_dano ||
    arma?.bruto?.arma_tipo_dano ||
    arma?.bruto?.tipo_dano ||
    "";
  const ajusteDano = resolucaoDano
    ? resolucaoDano.imune
      ? "imunidade aplicada"
      : resolucaoDano.cancelado
        ? "resistência e vulnerabilidade se cancelam"
      : resolucaoDano.resistido
        ? "resistência aplicada"
        : resolucaoDano.vulneravel
          ? "vulnerabilidade aplicada"
          : "sem ajuste defensivo"
    : "";
  const detalheDano = resolucaoDano
    ? `Dano ${resolucaoDano.tipo}: ${resolucaoDano.bruto} bruto; ${ajusteDano}; ${resolucaoDano.final} final`
    : `Dano: ${dano}`;
  const bonusAtaque =
    Number(estadoAtaqueArma.modBase || 0) +
    Number(estadoAtaqueArma.bonusProf || 0);
  const totalAtaque = Number.isInteger(dado)
    ? RegrasCombate.calcularTotalD20(dado, [bonusAtaque])
    : null;
  const resolucaoD20 = estadoAtaqueArma.resolucaoD20;
  const detalheD20 = resolucaoD20 ? `D20: ${resolucaoD20.escolhido}` : "";
  const gatilhoReacao = tipoAcao === "Reação"
    ? String(document.getElementById("modalAtaqueGatilhoReacao")?.value || "").trim()
    : "";
  const detalheGatilhoReacao = gatilhoReacao ? `Gatilho: ${gatilhoReacao}` : "";
  const valor = ehMagia
    ? [
        arma.nome || "Magia",
        ehEfeito ? "Aplicação de efeito" : "",
        dado === null ? "" : `Dado: ${dado}`,
        detalheD20,
        sucesso ? "Sucesso" : "Fracasso",
        detalheDano,
        tipoDano,
        estadoAtaqueArma.infoCD || "",
        detalheGatilhoReacao,
      ]
        .filter(Boolean)
        .join(" | ")
    : [
        arma.nome || "Arma",
        `Dado: ${dado}`,
        detalheD20,
        detalheGatilhoReacao,
        sucesso ? "Sucesso" : "Fracasso",
        detalheDano,
      ].join(" | ");

  adicionarRegistroHistoricoCombate(
    ehMagia && dado === null ? "Dano Mágico" : "Ataque",
    valor,
    ehMagia ? "✨" : arma.usaMunicao ? "🏹" : "⚔️",
    tipoAcao.toLowerCase(),
    {
      evento: ehEfeito ? "aplicacao" : ehMagia ? "ativacao" : "ataque",
      origem: { tipo: ehMagia ? "magia" : "arma", id: arma.id || null, nome: arma.nome || "" },
      ...(estadoAtaqueArma.modoAtaque ? { modoAtaque: estadoAtaqueArma.modoAtaque } : {}),
      rolagem: resolucaoD20 ? { modo: resolucaoD20.modo, resultados: [...resolucaoD20.resultados], escolhido: resolucaoD20.escolhido } : null,
      consumo: ehEfeito ? null : { tipo: tipoAcao, municao: arma.usaMunicao ? 1 : 0, nivelSlot: nivelMagia },
      ...(gatilhoReacao ? { gatilhoReacao } : {}),
      timeline: {
        titulo: ehMagia
          ? `${obterTituloMagiaHistorico(nivelMagia)}${ehEfeito ? " · Efeito" : ""}`
          : "Ataque com arma",
        nome: [arma.nome || (ehMagia ? "Magia" : "Arma"), detalheD20].filter(Boolean).join(" · "),
        iconeNome: ehMagia ? "🪄" : "🗡️",
        dado,
        bonusAtaque,
        totalAtaque,
        sucesso,
        dano,
        danoTipo: tipoDano,
        ...(resolucaoDano
          ? { danoBruto: resolucaoDano.bruto, ajusteDano }
          : {}),
        concentrando: ehMagia && magiaExigeConcentracao(estadoAtaqueArma.magia),
      },
    },
  );
  if (!ehMagia && estadoAtaqueArma.modoAtaque === "arremesso") finalizarArremessoArma(arma);
  return true;
}

function confirmarFracassoAtaque() {
  if (typeof window !== "undefined" && window.__fichaImportacaoTransacaoAtiva) return;
  const dadoInformado = obterDadoModalAtaque();
  if (dadoInformado === null) return;
  const resolucao = obterResolucaoManualD20Atual(
    "modalAtaque", "ataque", dadoInformado, estadoAtaqueArma.resolucaoD20,
  );
  if (!resolucao) {
    document.getElementById("modalAtaqueRolarDado")?.focus();
    return;
  }

  estadoAtaqueArma.resolucaoD20 = resolucao;
  estadoAtaqueArma.dado = resolucao.escolhido;
  if (registrarHistoricoAtaqueArma(false, 0)) fecharModalAtaqueArma();
}

function confirmarDanoAtaque() {
  if (typeof window !== "undefined" && window.__fichaImportacaoTransacaoAtiva) return;
  const campoDano = document.getElementById("modalAtaqueDano");
  if (!campoDano) return;

  const danoRolado = parseInt(campoDano.value, 10);
  if (!Number.isInteger(danoRolado) || danoRolado < 0) {
    campoDano.focus();
    return;
  }

  const danoBruto = Math.max(
    0,
    danoRolado + obterBonusDanoEfetivoModalAtaque(),
  );
  const tipo = estadoAtaqueArma.danoTipo ||
    obterTipoDanoAtaque(estadoAtaqueArma.arma);
  const resolucaoDano = tipo
    ? RegrasCombate.resolverDanoTipado({
        quantidade: danoBruto,
        tipo,
        origem: estadoAtaqueArma.arma?.nome || "Ataque",
      })
    : null;
  if (tipo && !resolucaoDano) return;
  if (registrarHistoricoAtaqueArma(
    true,
    resolucaoDano?.final ?? danoBruto,
    resolucaoDano,
  )) fecharModalAtaqueArma();
}

function registrarHistoricoComandoCombate(tipo, valor) {
  adicionarRegistroHistoricoCombate(tipo, valor);
}

function limparHistorico() {
  const registrosContainer = document.getElementById("historicoRegistros");
  if (registrosContainer) registrosContainer.innerHTML = "";
  estadoCombateIniciativa.historicoEventos = [];
}

function descansoLongo() {
  const campoTotal = document.getElementById("dadosVidaTotal");
  const campoRestantes = document.getElementById("dadosVidaRestantes");
  const campoPV = document.getElementById("pvAtual");
  const campoPVTotal = document.getElementById("pvTotal");
  const pvAntes = Number.parseInt(campoPV?.value, 10);
  if (!Number.isInteger(pvAntes) || pvAntes < 1) {
    alert("Para obter os benefícios de um descanso longo, a ficha exige pelo menos 1 PV no início do descanso.");
    return;
  }
  const total = Number.parseInt(campoTotal?.value, 10);
  const restantes = Number.parseInt(campoRestantes?.value, 10);
  const recuperacao = RegrasCombate.calcularRecuperacaoDadosVidaDescansoLongo(total, restantes);
  if (recuperacao === null) return;
  const pvMaximo = Number.parseInt(campoPVTotal?.value, 10) || 0;
  const recursos = estadoCombateIniciativa.caracteristicasAtivas || [];
  const usosRecuperaveis = typeof contarUsosCaracteristicasRecuperaveis === "function"
    ? contarUsosCaracteristicasRecuperaveis("descanso_longo")
    : recursos.filter((item) => item.recarga === "descanso_longo" && Number.isInteger(item.usosMaximos)).reduce((soma, item) => soma + Math.max(0, item.usosMaximos - (Number.parseInt(item.usosRestantes, 10) || 0)), 0);
  const espacosRecuperaveis = Array.from({ length: 9 }, (_, indice) => indice + 1).flatMap((nivel) => {
    const restante = document.getElementById(`magia${nivel}Rest`);
    const totalEspacos = document.getElementById(`magia${nivel}Total`);
    const faltantes = Math.max(0, (Number.parseInt(totalEspacos?.value, 10) || 0) - (Number.parseInt(restante?.value, 10) || 0));
    return faltantes ? [{ restante, total: totalEspacos, faltantes }] : [];
  });
  const exaustao = (estadoCombateIniciativa.condicoesAtivas || []).find((item) => item?.estado === "ativa" && String(item.nome).toLocaleLowerCase("pt-BR") === "exausto");
  const preview = `Descanso longo (8 horas; o intervalo de 24 horas não é controlado pela ficha).\nDados de Vida: ${restantes} → ${restantes + recuperacao} (${recuperacao} recuperado(s)).\nPontos de Vida: ${pvAntes} → ${pvMaximo}.\nEspaços de magia recuperados: ${espacosRecuperaveis.reduce((soma, item) => soma + item.faltantes, 0)}.\nUsos de características com recarga longa: ${usosRecuperaveis}.${exaustao ? `\nExaustão nível ${exaustao.nivelExaustao || 1}: só reduz 1 se houver comida e bebida no descanso.` : ""}\nPV temporários serão removidos, conforme o comportamento atual.\nRecursos sem regra estruturada de recarga: sem alteração.\n\nConfirmar descanso longo?`;
  if (!confirm(preview)) return;
  const reduzirExaustao = !!exaustao && confirm("Você consumiu comida e bebida durante o descanso longo? Reduzir a exaustão em 1 nível?");

  if (campoTotal && campoRestantes) {
    campoRestantes.value = String(restantes + recuperacao);
    normalizarDadosVida();
  }

  if (campoPV && campoPVTotal) {
    campoPV.value = campoPVTotal.value;
    const campoPVTemporario = document.getElementById("pvTemporario");
    if (campoPVTemporario) campoPVTemporario.value = "0";
    normalizarPontosDeVida();
  }
  espacosRecuperaveis.forEach(({ restante, total: totalEspacos }) => { restante.value = totalEspacos.value; });
  if (reduzirExaustao && exaustao) {
    exaustao.nivelExaustao = Math.max(0, (Number.parseInt(exaustao.nivelExaustao, 10) || 1) - 1);
    if (exaustao.nivelExaustao === 0) {
      exaustao.estado = "encerrada";
      exaustao.encerradaEm = new Date().toISOString();
      exaustao.motivoEncerramento = "Descanso longo com comida e bebida";
    }
    if (typeof projetarCondicoesAtivasParaCampo === "function") projetarCondicoesAtivasParaCampo();
  }
  const caracteristicasRecuperadas = typeof recuperarUsosCaracteristicas === "function"
    ? recuperarUsosCaracteristicas("descanso_longo") : 0;
  adicionarRegistroHistoricoCombate("Descanso longo", `${recuperacao} dado(s) de vida recuperado(s); PV ${pvAntes} → ${pvMaximo}`, "🌙", "", {
    origem: { tipo: "descanso", id: "longo" },
    consumo: { dadosVidaRecuperados: recuperacao, espacosRecuperados: espacosRecuperaveis.reduce((soma, item) => soma + item.faltantes, 0), usosCaracteristicasRecuperados: caracteristicasRecuperadas, nivelExaustaoReduzido: reduzirExaustao ? 1 : 0 },
    timeline: { simples: true, exibirBadge: false, texto: `🌙 Descanso longo: ${recuperacao} dado(s) de vida, ${espacosRecuperaveis.reduce((soma, item) => soma + item.faltantes, 0)} espaço(s) e ${caracteristicasRecuperadas} uso(s) de característica recuperado(s); PV restaurados a ${pvMaximo}.${reduzirExaustao ? " Exaustão reduzida em 1." : ""}` },
  });
}

function definirStatusDescansoCurto(mensagem) {
  const status = document.getElementById("descansoCurtoStatus");
  if (status) status.textContent = "";
  if (!mensagem || /^(Descanso curto cancelado;|Descanso curto aplicado:)/i.test(mensagem)) return;
  window.notificarFichaFlutuante?.(mensagem, "erro", "descanso");
}

function lerEstadoDescansoCurto() {
  const campoRestantes = document.getElementById("dadosVidaRestantes");
  const campoTotalDados = document.getElementById("dadosVidaTotal");
  const campoPV = document.getElementById("pvAtual");
  const campoPVTotal = document.getElementById("pvTotal");
  const facesMatch = String(document.getElementById("dadosVidaTipo")?.value || "").match(/^d(4|6|8|10|12)$/i);
  const inteiro = (valor) => /^\d+$/.test(String(valor ?? "").trim()) ? Number(valor) : NaN;
  const restantes = inteiro(campoRestantes?.value);
  const totalDados = inteiro(campoTotalDados?.value);
  const pvAtuais = inteiro(campoPV?.value);
  const pvMaximos = inteiro(campoPVTotal?.value);
  const faces = facesMatch ? Number(facesMatch[1]) : NaN;
  if (![restantes, totalDados, pvAtuais, pvMaximos, faces].every(Number.isInteger) ||
      totalDados < 0 || restantes < 0 || restantes > totalDados ||
      pvAtuais < 0 || pvMaximos < pvAtuais) return null;
  const classe = String(document.getElementById("classeNomeID")?.value || "").trim().toLowerCase();
  const nivelClasse = Number.parseInt(document.querySelector?.(".classe-nivel")?.value, 10);
  const tabelaPacto = classe === "bruxo" ? RegrasCombate.calcularEspacosPactoBruxo(nivelClasse) : null;
  const campoPacto = Number.isInteger(tabelaPacto?.nivelEspaco) ? document.getElementById(`magia${tabelaPacto.nivelEspaco}Rest`) : null;
  const campoPactoTotal = Number.isInteger(tabelaPacto?.nivelEspaco) ? document.getElementById(`magia${tabelaPacto.nivelEspaco}Total`) : null;
  const totalPacto = Math.min(tabelaPacto?.quantidade || 0, Math.max(0, inteiro(campoPactoTotal?.value) || 0));
  const atualPacto = Math.min(totalPacto, Math.max(0, inteiro(campoPacto?.value) || 0));
  const recursos = estadoCombateIniciativa.caracteristicasAtivas || [];
  const usosRecuperaveis = typeof contarUsosCaracteristicasRecuperaveis === "function"
    ? contarUsosCaracteristicasRecuperaveis("descanso_curto")
    : recursos.filter((item) => item.recarga === "descanso_curto" && Number.isInteger(item.usosMaximos)).reduce((soma, item) => soma + Math.max(0, item.usosMaximos - (Number.parseInt(item.usosRestantes, 10) || 0)), 0);
  return {
    campoRestantes, campoPV, campoPVTotal, faces, restantes, totalDados, pvAtuais, pvMaximos,
    modificadorConstituicao: typeof getModificadorBaseAtributo === "function" ? getModificadorBaseAtributo("con") || 0 : 0,
    usosRecuperaveis,
    classe,
    tabelaPacto,
    campoPacto,
    totalPacto,
    atualPacto,
    pactoFaltantes: Math.max(0, totalPacto - atualPacto),
  };
}

function lerResultadoManualDescansoCurto(faces) {
  const texto = String(document.getElementById("descansoCurtoResultadosManuais")?.value || "").trim();
  if (!/^\d+$/.test(texto)) return null;
  const valor = Number(texto);
  return Number.isInteger(valor) && valor >= 1 && valor <= faces ? valor : null;
}

function atualizarHistoricoDescansoCurto(pendente) {
  const historico = document.getElementById("descansoCurtoHistorico");
  if (!historico) return;
  const valores = Array.isArray(pendente.historicoRolagens) ? pendente.historicoRolagens : [];
  if (!valores.length) {
    historico.textContent = "—";
    return;
  }
  const maior = Math.max(...valores);
  const menor = Math.min(...valores);
  historico.innerHTML = [...valores].reverse().map((valor) => {
    const destaque = valor === maior || valor === menor;
    const sufixo = valor === maior ? "⇧" : valor === menor ? "⇩" : "";
    return criarBotaoHistoricoDado(valor, sufixo, destaque);
  }).join(", ");
}

function atualizarPreviaDescansoCurto() {
  const pendente = window.__descansoCurtoPendente;
  const previa = document.getElementById("descansoCurtoPrevia");
  const botaoRolar = document.getElementById("descansoCurtoRolar");
  const botaoUsarDado = document.getElementById("descansoCurtoUsarDado");
  const entradaManual = document.getElementById("descansoCurtoResultadosManuais");
  const botaoConfirmar = document.getElementById("descansoCurtoConfirmar");
  if (!pendente || !previa || !botaoConfirmar) return;
  botaoConfirmar.disabled = !!pendente.rolando;

  const { estado } = pendente;
  const quantidade = pendente.resultadosDados.length;
  const restante = Math.max(0, estado.restantes - quantidade);
  const resultadoManual = lerResultadoManualDescansoCurto(estado.faces);
  pendente.resultadoAtual = resultadoManual;
  const resultadoAtualValido = Number.isInteger(pendente.resultadoAtual) && pendente.resultadoAtual >= 1 && pendente.resultadoAtual <= estado.faces;

  if (botaoRolar) botaoRolar.disabled = restante === 0;
  if (entradaManual) {
    entradaManual.max = String(estado.faces);
    entradaManual.disabled = restante === 0 || pendente.rolando;
  }
  if (botaoUsarDado) botaoUsarDado.disabled = restante === 0 || pendente.rolando || !resultadoAtualValido;

  const dadosEscolhidos = document.getElementById("descansoCurtoDadosEscolhidos");
  const dadoAtual = document.getElementById("descansoCurtoDadoAtual");
  const dadoAtualTotal = document.getElementById("descansoCurtoDadoTotal");
  const dadoAtualConta = document.getElementById("descansoCurtoDadoConta");
  const curaResumo = document.getElementById("descansoCurtoCuraResumo");
  const pvDepois = document.getElementById("descansoCurtoPVDepois");
  const formula = document.getElementById("descansoCurtoFormula");
  const bonus = document.getElementById("descansoCurtoBonusConstituicao");
  if (dadosEscolhidos) dadosEscolhidos.textContent = `${quantidade}/${estado.restantes}`;
  if (formula) formula.textContent = `1d${estado.faces}`;
  if (bonus) bonus.textContent = `${estado.modificadorConstituicao >= 0 ? "+" : ""}${estado.modificadorConstituicao}`;
  const formatarResultado = (dado) => ({
    total: Math.max(0, dado + estado.modificadorConstituicao),
    conta: `(${dado}${estado.modificadorConstituicao >= 0 ? "+" : "−"}${Math.abs(estado.modificadorConstituicao)})`,
  });
  const resultadoConfirmado = pendente.resultadosDados.at(-1);
  const resultadoAtualPartes = resultadoAtualValido
    ? formatarResultado(pendente.resultadoAtual)
    : Number.isInteger(resultadoConfirmado) ? formatarResultado(resultadoConfirmado) : null;
  if (dadoAtualTotal) dadoAtualTotal.textContent = resultadoAtualPartes?.total ?? "—";
  if (dadoAtualConta) dadoAtualConta.textContent = resultadoAtualPartes?.conta ?? "";
  if (dadoAtual && !dadoAtualTotal && !dadoAtualConta) {
    dadoAtual.textContent = resultadoAtualPartes ? `${resultadoAtualPartes.total} ${resultadoAtualPartes.conta}` : "—";
  }

  const cura = RegrasCombate.calcularCuraDescansoCurto({
    resultados: pendente.resultadosDados,
    faces: estado.faces,
    modificadorConstituicao: estado.modificadorConstituicao,
    pvAtuais: estado.pvAtuais,
    pvMaximos: estado.pvMaximos,
  });
  if (!cura) {
    previa.textContent = "Não foi possível calcular a prévia. Confira os PV e os Dados de Vida da ficha.";
    previa.hidden = false;
    botaoConfirmar.disabled = true;
    pendente.cura = null;
    return;
  }
  if (curaResumo) curaResumo.textContent = `${cura.curaAplicada} PV`;
  if (pvDepois) pvDepois.textContent = `${estado.pvAtuais} → ${cura.pvDepois}`;
  const temRecursosElegiveis = estado.usosRecuperaveis > 0 || estado.pactoFaltantes > 0;
  previa.textContent = temRecursosElegiveis ? "Os recursos elegíveis serão recuperados ao confirmar." : "";
  previa.hidden = !temRecursosElegiveis;
  pendente.cura = cura;
  botaoConfirmar.disabled = !!pendente.rolando;
}

function usarDadoDescansoCurto() {
  const pendente = window.__descansoCurtoPendente;
  if (!pendente || pendente.resultadosDados.length >= pendente.estado.restantes) return false;
  const resultado = lerResultadoManualDescansoCurto(pendente.estado.faces) ?? pendente.resultadoAtual;
  if (!Number.isInteger(resultado) || resultado < 1 || resultado > pendente.estado.faces) return false;
  pendente.resultadosDados.push(resultado);
  if (!pendente.resultadoAtualJaNoHistorico) pendente.historicoRolagens.push(resultado);
  pendente.resultadoAtual = null;
  pendente.resultadoAtualJaNoHistorico = false;
  const entrada = document.getElementById("descansoCurtoResultadosManuais");
  if (entrada) entrada.value = "";
  atualizarHistoricoDescansoCurto(pendente);
  atualizarPreviaDescansoCurto();
  return true;
}

async function rolarDadosDescansoCurto() {
  const pendente = window.__descansoCurtoPendente;
  if (!pendente || pendente.resultadosDados.length >= pendente.estado.restantes) return false;
  if (pendente.rolando) return false;
  pendente.rolando = true;
  atualizarPreviaDescansoCurto();
  const entrada = document.getElementById("descansoCurtoResultadosManuais");
  const epochInicial = window.__fichaImportacaoEpoch || 0;
  let resultado = null;
  if (typeof animarRolagemNoCampo === "function") {
    const rolagem = await animarRolagemNoCampo(entrada, 1, pendente.estado.faces);
    resultado = rolagem?.resultados?.[0] ?? null;
  } else {
    resultado = Math.floor(Math.random() * pendente.estado.faces) + 1;
  }
  if (window.__descansoCurtoPendente !== pendente) return false;
  pendente.rolando = false;
  if ((window.__fichaImportacaoEpoch || 0) !== epochInicial || window.__fichaImportacaoTransacaoAtiva) return false;
  if (!Number.isInteger(resultado) || resultado < 1 || resultado > pendente.estado.faces) {
    if (entrada) entrada.value = "";
    atualizarPreviaDescansoCurto();
    return false;
  }
  pendente.resultadoAtual = resultado;
  pendente.resultadoAtualJaNoHistorico = true;
  pendente.historicoRolagens.push(resultado);
  if (entrada) entrada.value = String(resultado);
  atualizarHistoricoDescansoCurto(pendente);
  atualizarPreviaDescansoCurto();
  return true;
}

function descansoCurto() {
  const dialogo = document.getElementById("descansoCurtoDialogo");
  const estado = lerEstadoDescansoCurto();
  if (!dialogo || !estado) {
    definirStatusDescansoCurto("Não foi possível iniciar o descanso. Confira PV, tipo e quantidade total/restante de Dados de Vida.");
    return false;
  }
  if (dialogo.open) return false;
  const rolar = document.getElementById("descansoCurtoRolar");
  const confirmar = document.getElementById("descansoCurtoConfirmar");
  const pvResumo = document.getElementById("descansoCurtoPVResumo");
  const dadosDisponiveis = document.getElementById("descansoCurtoDadosDisponiveis");
  const recursosResumo = document.getElementById("descansoCurtoRecursosResumo");
  const tipoResumo = document.getElementById("descansoCurtoTipoResumo");
  const resultadosManuais = document.getElementById("descansoCurtoResultadosManuais");
  const usarDado = document.getElementById("descansoCurtoUsarDado");
  const usados = document.getElementById("descansoCurtoDadosEscolhidos");
  if (!rolar || !confirmar || !pvResumo || !dadosDisponiveis || !recursosResumo || !tipoResumo || !resultadosManuais || !usarDado || !usados) {
    definirStatusDescansoCurto("O painel de descanso curto não está disponível nesta versão da ficha.");
    return false;
  }
  document.getElementById("descansoCurtoInfo")?.setAttribute("aria-expanded", "false");
  window.__descansoCurtoPendente = { estado, resultadosDados: [], historicoRolagens: [], resultadoAtual: null, resultadoAtualJaNoHistorico: false, aplicando: false };
  resultadosManuais.value = "";
  rolar.disabled = true;
  usarDado.disabled = true;
  confirmar.disabled = false;
  pvResumo.textContent = `${estado.pvAtuais}/${estado.pvMaximos}`;
  dadosDisponiveis.textContent = `${estado.restantes}/${estado.totalDados} · d${estado.faces}`;
  const recursosElegiveis = [];
  if (estado.usosRecuperaveis > 0) recursosElegiveis.push(`${estado.usosRecuperaveis} uso(s) de característica`);
  if (estado.pactoFaltantes > 0) recursosElegiveis.push(`${estado.pactoFaltantes} espaço(s) de Pacto`);
  recursosResumo.parentElement.hidden = recursosElegiveis.length === 0;
  recursosResumo.textContent = recursosElegiveis.join(" · ");
  tipoResumo.textContent = `d${estado.faces}`;
  usados.textContent = `0/${estado.restantes}`;
  document.getElementById("descansoCurtoFormula").textContent = `1d${estado.faces}`;
  document.getElementById("descansoCurtoResultadosManuais").max = String(estado.faces);
  document.getElementById("descansoCurtoBonusConstituicao").textContent = `${estado.modificadorConstituicao >= 0 ? "+" : ""}${estado.modificadorConstituicao}`;
  document.getElementById("descansoCurtoHistorico").textContent = "—";
  definirStatusDescansoCurto("");
  dialogo.returnValue = "";
  try {
    dialogo.showModal();
    atualizarPreviaDescansoCurto();
    (resultadosManuais.disabled ? confirmar : resultadosManuais).focus();
    return true;
  } catch (erro) {
    window.__descansoCurtoPendente = null;
    definirStatusDescansoCurto("Não foi possível abrir o painel de descanso curto. Recarregue a ficha e tente novamente.");
    return false;
  }
}

function cancelarDescansoCurto() {
  const dialogo = document.getElementById("descansoCurtoDialogo");
  const pendente = window.__descansoCurtoPendente;
  if (!dialogo?.open || !pendente) return false;
  const entradaManual = document.getElementById("descansoCurtoResultadosManuais");
  const temDadosPendentes = pendente.resultadosDados.length > 0
    || Number.isInteger(pendente.resultadoAtual)
    || !!entradaManual?.value.trim();
  if (temDadosPendentes && !window.confirm(
    "Calma lá, aventureiro!\n\nVocê já lançou Dados de Vida para este descanso. Se sair agora, os resultados e a prévia serão descartados. Nenhum Dado de Vida será gasto.\n\nDeseja mesmo abandonar o descanso?",
  )) return false;
  window.__descansoCurtoPendente = null;
  dialogo.close("cancel");
  definirStatusDescansoCurto("Descanso curto cancelado; nenhum recurso foi gasto.");
  return true;
}

function confirmarDescansoCurto() {
  const dialogo = document.getElementById("descansoCurtoDialogo");
  const pendente = window.__descansoCurtoPendente;
  if (!dialogo?.open || !pendente || pendente.aplicando || pendente.resultadosDados.length > pendente.estado.restantes) return false;
  atualizarPreviaDescansoCurto();
  if (document.getElementById("descansoCurtoConfirmar")?.disabled) return false;
  const estadoAtual = lerEstadoDescansoCurto();
  if (!estadoAtual || estadoAtual.restantes !== pendente.estado.restantes || estadoAtual.pvAtuais !== pendente.estado.pvAtuais || estadoAtual.pvMaximos !== pendente.estado.pvMaximos || estadoAtual.faces !== pendente.estado.faces) {
    const previa = document.getElementById("descansoCurtoPrevia");
    if (previa) {
      previa.textContent = "Os PV ou os Dados de Vida mudaram. Feche e abra o descanso novamente para atualizar a prévia.";
      previa.hidden = false;
    }
    return false;
  }
  const cura = pendente.cura;
  if (!cura) return false;
  pendente.aplicando = true;
  const { estado } = pendente;
  const quantidade = pendente.resultadosDados.length;
  estado.campoRestantes.value = String(estado.restantes - quantidade);
  estado.campoPV.value = String(cura.pvDepois);
  if (estado.pactoFaltantes && estado.campoPacto) estado.campoPacto.value = String(estado.atualPacto + estado.pactoFaltantes);
  if (typeof normalizarDadosVida === "function") normalizarDadosVida();
  if (typeof normalizarPontosDeVida === "function") normalizarPontosDeVida();
  const recuperados = typeof recuperarUsosCaracteristicas === "function" ? recuperarUsosCaracteristicas("descanso_curto") : 0;
  const resultadosDados = pendente.resultadosDados.slice();
  const textoResumo = `Descanso curto aplicado: ${cura.curaAplicada} PV recuperado(s), ${quantidade} Dado(s) de Vida gasto(s), ${recuperados} uso(s) de característica e ${estado.pactoFaltantes} espaço(s) de Pacto.`;
  adicionarRegistroHistoricoCombate("Descanso curto", `${quantidade} dado(s) gasto(s), ${cura.curaAplicada} PV recuperado(s); ${recuperados} uso(s) de característica`, "☀️", "", {
    origem: { tipo: "descanso", id: "curto" }, consumo: { dadosVidaGastos: quantidade, resultadosDados, curaPV: cura.curaAplicada, espacosPactoRecuperados: estado.pactoFaltantes, usosCaracteristicasRecuperados: recuperados },
    timeline: { simples: true, exibirBadge: false, texto: `☀️ ${textoResumo}` },
  });
  window.__descansoCurtoPendente = null;
  dialogo.close("confirm");
  definirStatusDescansoCurto(textoResumo);
  return true;
}

function inicializarModalDescansoCurto() {
  const dialogo = document.getElementById("descansoCurtoDialogo");
  const entradaManual = document.getElementById("descansoCurtoResultadosManuais");
  const info = document.getElementById("descansoCurtoInfo");
  if (!dialogo || !entradaManual || dialogo.dataset.inicializado === "true") return;
  dialogo.dataset.inicializado = "true";
  info?.addEventListener("click", () => {
    info.setAttribute("aria-expanded", info.getAttribute("aria-expanded") !== "true" ? "true" : "false");
  });
  entradaManual.addEventListener("input", () => {
    const pendente = window.__descansoCurtoPendente;
    if (pendente) {
      pendente.resultadoAtual = lerResultadoManualDescansoCurto(pendente.estado.faces);
      pendente.resultadoAtualJaNoHistorico = false;
    }
    atualizarPreviaDescansoCurto();
  });
  document.getElementById("descansoCurtoHistorico")?.addEventListener("click", (evento) => {
    const botao = evento.target?.closest?.("[data-valor-rolagem]");
    const pendente = window.__descansoCurtoPendente;
    if (!botao || !pendente || pendente.resultadosDados.length >= pendente.estado.restantes) return;
    const valor = Number(botao.dataset.valorRolagem);
    if (!Number.isInteger(valor) || valor < 1 || valor > pendente.estado.faces) return;
    entradaManual.value = String(valor);
    pendente.resultadoAtual = valor;
    pendente.resultadoAtualJaNoHistorico = true;
    atualizarPreviaDescansoCurto();
  });
  dialogo.addEventListener("cancel", (evento) => {
    if (!window.__descansoCurtoPendente) return;
    evento.preventDefault();
    cancelarDescansoCurto();
  });
  dialogo.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape" || !window.__descansoCurtoPendente) return;
    evento.preventDefault();
    evento.stopPropagation();
    if (info?.getAttribute("aria-expanded") === "true") {
      info.setAttribute("aria-expanded", "false");
      info.focus();
      return;
    }
    cancelarDescansoCurto();
  });
  dialogo.addEventListener("close", () => {
    const pendente = window.__descansoCurtoPendente;
    window.__descansoCurtoPendente = null;
    info?.setAttribute("aria-expanded", "false");
    if (pendente && dialogo.returnValue !== "confirm") definirStatusDescansoCurto("Descanso curto cancelado; nenhum recurso foi gasto.");
  });
}

function verificarStatusMorte() {
  const campoPV = document.getElementById("pvAtual");
  const campoPVTotal = document.getElementById("pvTotal");
  const campoContraMorte = document.getElementById("ataqueContraMorte");
  const campoPVDisplay = document.getElementById("ataquePvAtual");

  if (!campoPV || !campoContraMorte || !campoPVDisplay || !campoPVTotal) return;

  const pvAtual = parseInt(campoPV.value) || 0;
  const pvTotal = parseInt(campoPVTotal.value) || 0;

  // Se PV total é zero, a ficha não foi montada, então não abre contra morte
  if (pvTotal === 0) {
    campoPVDisplay.style.display = "flex";
    campoContraMorte.style.display = "none";
    limparContraMorte();
    return;
  }

  if (pvAtual <= 0) {
    campoPVDisplay.style.display = "none";
    campoContraMorte.style.display = "flex";
  } else {
    campoPVDisplay.style.display = "flex";
    campoContraMorte.style.display = "none";
    limparContraMorte();
  }
}

document.addEventListener("DOMContentLoaded", inicializarModalDescansoCurto);

function inicializarModalSalvaguardaMorte() {
  const abrirBotao = document.getElementById("abrirSalvaGuardaModal");
  const overlay = document.getElementById("modalIniciativaOverlay");
  const campoDado = document.getElementById("modalIniciativaDado");
  const tituloCabecalho = document.getElementById("modalIniciativaCabecalhoTitulo");
  const subtitulo = document.getElementById("modalIniciativaSubtitulo");
  const formula = document.getElementById("modalIniciativaFormula");
  const cabecalho = document.querySelector(
    "#modalIniciativaOverlay .dado-modal-titulo",
  );
  const bonus = document.getElementById("modalIniciativaBonus")?.parentElement;
  const posicao = document.querySelector(".modal-iniciativa-posicao");
  const confirmar = document.getElementById("modalIniciativaConfirmar");
  const cancelar = document.getElementById("modalIniciativaCancelar");
  const rolar = document.getElementById("modalIniciativaRolarDado");
  if (!abrirBotao || !overlay || !campoDado || !subtitulo) return;

  const fechar = () => {
    fecharModalIniciativa();
    delete overlay.dataset.salvaguarda;
    if (tituloCabecalho) tituloCabecalho.textContent = "Rolar Iniciativa";
    subtitulo.textContent = "1d20 + 0";
    if (cabecalho) cabecalho.textContent = "Rolagem de iniciativa";
    if (confirmar) confirmar.textContent = "Confirmar";
    if (cancelar) cancelar.textContent = "Cancelar";
    if (bonus) bonus.style.display = "";
    if (posicao) posicao.style.display = "";
  };

  window.__cancelarModalSalvaguardaMorteParaImportacao = function () {
    const estavaAberto = !overlay.classList.contains("oculto");
    if (estavaAberto) {
      if (rolar) {
        rolar.__geracaoRolagemSalvaguarda = Symbol(
          "importacao-invalida-rolagem",
        );
        rolar.classList.remove("rolando");
      }
      fechar();
    }
    return {
      ok: !estavaAberto || overlay.classList.contains("oculto"),
      estavaAberto,
    };
  };

  abrirBotao.addEventListener("click", () => {
    abrirModalIniciativa();
    if (tituloCabecalho) tituloCabecalho.textContent = "Teste contra a Morte";
    subtitulo.textContent = "1d20";
    if (cabecalho) cabecalho.textContent = "Rolagem de salvaguarda";
    if (formula) formula.textContent = "1d20";
    if (bonus) bonus.style.display = "none";
    if (posicao) posicao.style.display = "none";
    if (confirmar) confirmar.textContent = "Sucesso";
    if (cancelar) cancelar.textContent = "Fracasso";
  });

  document
    .getElementById("modalIniciativaFechar")
    ?.addEventListener("click", fechar);
  rolar?.addEventListener("click", (evento) => {
    if (overlay.dataset.salvaguarda !== "true") return;
    evento.stopImmediatePropagation();
    const epochImportacao = window.__fichaImportacaoEpoch || 0;
    const geracaoRolagem = Symbol("rolagem-salvaguarda");
    rolar.__geracaoRolagemSalvaguarda = geracaoRolagem;
    rolar.classList.add("rolando");
    animarRolagemNoCampo(campoDado, 1, 20, 1000, 60).then(() => {
      if (rolar.__geracaoRolagemSalvaguarda !== geracaoRolagem) return;
      rolar.classList.remove("rolando");
      if (
        (window.__fichaImportacaoEpoch || 0) !== epochImportacao ||
        window.__fichaImportacaoTransacaoAtiva
      )
        return;
    });
  });
  confirmar?.addEventListener("click", (evento) => {
    if (overlay.dataset.salvaguarda !== "true") return;
    evento.stopImmediatePropagation();
    if (window.__fichaImportacaoTransacaoAtiva) return;
    adicionarSucesso();
    fechar();
  });
  cancelar?.addEventListener("click", (evento) => {
    if (overlay.dataset.salvaguarda !== "true") return;
    evento.stopImmediatePropagation();
    if (window.__fichaImportacaoTransacaoAtiva) return;
    adicionarFracasso();
    fechar();
  });
  abrirBotao.addEventListener("click", () => {
    overlay.dataset.salvaguarda = "true";
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && overlay.dataset.salvaguarda === "true")
      fechar();
  });
}

document.addEventListener("DOMContentLoaded", inicializarModalSalvaguardaMorte);

function adicionarSucesso() {
  if (window.__fichaImportacaoTransacaoAtiva) return;
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById("sucesso" + i);

    if (dot && !dot.classList.contains("ativo")) {
      dot.classList.add("ativo");
      registrarHistoricoComandoCombate("Sucesso", `${i}º`);

      verificarVitoriaDeathSave();
      return;
    }
  }
}

function adicionarFracasso() {
  if (window.__fichaImportacaoTransacaoAtiva) return;
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById("fracasso" + i);

    if (dot && !dot.classList.contains("ativo")) {
      dot.classList.add("ativo");

      // 🔥 Registrar só aqui (depois de confirmar)
      registrarHistoricoComandoCombate("Fracasso", `${i}º`);

      verificarDerrotaDeathSave();
      return;
    }
  }
}

function verificarVitoriaDeathSave() {
  let sucessos = 0;

  for (let i = 1; i <= 3; i++) {
    if (document.getElementById("sucesso" + i)?.classList.contains("ativo")) {
      sucessos++;
    }
  }

  if (sucessos >= 3) {
    const frases = [
      "Contra todas as probabilidades, você se agarra à vida.",
      "Seu peito volta a respirar. A morte terá que esperar.",
      "A chama da sua alma se recusa a se apagar.",
      "Você resiste. Ainda não é o seu fim.",
      "O destino te dá mais uma chance.",
      "Seu corpo responde — você está de volta.",
      "A vida pulsa novamente em suas veias.",
      "Nem hoje a morte te leva.",
      "Você abre os olhos mais uma vez.",
      "Os deuses ainda não terminaram com você.",
      "A morte tentou te abraçar, mas seu espírito se provou mais forte.",
      "O fio da sua vida se tencionou, mas não rompeu. Você está de volta.",
      "A luz retorna aos seus olhos. O mundo ainda precisa de você.",
      "Você respira fundo enquanto o abismo recua. A luta continua!",
      "A balança se inclinou a seu favor. Você estabilizou.",
      "O Ceifador terá que esperar. Hoje não é o seu dia.",
      "Sua determinação forçou o destino a te conceder uma segunda chance.",
      "Três batidas firmes no coração. O perigo imediato passou.",
    ];

    const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];

    alert(fraseAleatoria + "\n\nVocê recupera 1 PV e está estável!");

    const campoPV = document.getElementById("pvAtual");
    if (campoPV) {
      registrarHistoricoComandoCombate("Cura", 1);
      campoPV.value = 1;
      normalizarPontosDeVida();
    }
  }
}

function verificarDerrotaDeathSave() {
  let fracassos = 0;

  for (let i = 1; i <= 3; i++) {
    if (document.getElementById("fracasso" + i)?.classList.contains("ativo")) {
      fracassos++;
    }
  }

  if (fracassos >= 3) {
    const frases = [
      "Sua canção termina aqui, mas o eco de suas façanhas perdurará pelas eras.",
      "A luz em seus olhos se apaga, cedendo lugar ao descanso eterno dos heróis.",
      "As estrelas brilham um pouco menos hoje. Sua alma agora pertence ao cosmos.",
      "O frio do abismo finalmente te alcançou.",
      "Seu sangue mancha a terra; o silêncio é sua única companhia agora.",
      "O destino foi cruel. Seu corpo tomba, desprovido de vida.",
      "A escuridão te envolveu. Não há mais volta.",
      "O último capítulo da sua história foi escrito.",
      "Os dados pararam de rolar para você. Que sua próxima encarnação seja mais afortunada.",
      "Sua ficha repousa agora no panteão das lendas esquecidas.",
      "O mestre das almas recolheu sua ficha. Fim de jogo.",
    ];

    const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
    document.getElementById("nomePersonagem").value =
      "☠️ " + document.getElementById("nomePersonagem").value;

    alert(
      fraseAleatoria +
        "\n\nGAME OVER!\n" +
        document.getElementById("nomePersonagem").value,
    );
  }
}

function limparContraMorte() {
  for (let i = 1; i <= 3; i++) {
    document.getElementById("sucesso" + i)?.classList.remove("ativo");
    document.getElementById("fracasso" + i)?.classList.remove("ativo");
  }
}

function normalizarPosicaoAtaque() {
  const campo = document.getElementById("ataquePosicao");
  if (!campo) return;

  const numero = parseInt(campo.value) || 0;
  campo.value = numero;
  if (estadoCombateIniciativa.ativo) {
    estadoCombateIniciativa.posicao = Math.max(1, numero);
  }
}

function normalizarRodadaCombate() {
  const campo = document.getElementById("combateRodada");
  if (!campo) return;

  const numero = Math.max(1, parseInt(campo.value, 10) || 1);
  campo.value = numero;
  if (estadoCombateIniciativa.ativo) {
    estadoCombateIniciativa.rodada = numero;
    if (estadoCombateIniciativa.recursosTurno?.rodada !== numero) {
      estadoCombateIniciativa.recursosTurno = criarRecursosTurnoCombate(numero);
      atualizarInterfaceRecursosTurno();
    }
  }
  atualizarRodadaModalAtaque();
}

function trocarSubAbaCombate(tipo, botao) {
  if (tipo === "historico" || !botao) return;
  document
    .querySelectorAll(".subaba-botao")
    .forEach((el) => el.classList.remove("ativa"));
  document
    .querySelectorAll(".subaba-combate")
    .forEach((el) => el.classList.remove("ativa"));

  botao.classList.add("ativa");

  let alvo;
  if (tipo === "magia") {
    alvo = document.getElementById("subabaCombateMagia");
  } else if (tipo === "outras") {
    alvo = document.getElementById("subabaCombateOutras");
  } else {
    alvo = document.getElementById("subabaCombateArma");
  }

  if (alvo) alvo.classList.add("ativa");
}

function atualizarModificadoresSalvaguarda() {
  const bonusProf = getBonusProf();

  document.querySelectorAll(".salvaguarda-caixa").forEach((caixa) => {
    const atributo = caixa.querySelector(".prof-checkbox").dataset.atributo;
    const valor =
      parseInt(document.getElementById("atrib_" + atributo)?.value) || 0;
    const prof = caixa.querySelector(".prof-checkbox").checked ? bonusProf : 0;
    const mod = Math.floor((valor - 10) / 2);
    const salvMod = mod + prof;

    caixa.querySelector(".modificador-orbe").innerText =
      (mod >= 0 ? "+" : "") + mod;

    const campoSalv = document.getElementById("salv_" + atributo);
    if (campoSalv) campoSalv.value = formatarBonusCalculado(salvMod);

    if (caixa.querySelector(".prof-checkbox").checked) {
      caixa.classList.add("proficiente");
    } else {
      caixa.classList.remove("proficiente");
    }
  });

  atualizarProficienciaNoRadar();
}
