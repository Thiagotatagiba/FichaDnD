function restaurarEstadosPericiaImportados(dados) {
  const linhas = [...document.querySelectorAll(".pericia-linha")];
  const possuiExpertiseSalva = Object.keys(dados).some((chave) =>
    /^pericia[A-Za-z]+Expertise$/.test(chave),
  );
  const proficienciasLegadasCompletas =
    linhas.length > 0 &&
    linhas.every((linha) => {
      const checkboxProf = linha.querySelector(
        '.pericia-prof input[type="checkbox"]',
      );
      return checkboxProf?.id &&
        Object.prototype.hasOwnProperty.call(dados, checkboxProf.id);
    });

  linhas.forEach((linha) => {
    const checkboxProf = linha.querySelector(
      '.pericia-prof input[type="checkbox"]',
    );
    const checkboxExpertise = linha.querySelector(".pericia-expertise");
    const campoEstado = linha.querySelector(".pericia-estado");
    if (!checkboxProf || !checkboxExpertise || !campoEstado) return;

    const possuiEstado = Object.prototype.hasOwnProperty.call(
      dados,
      campoEstado.id,
    );
    const possuiProf = Object.prototype.hasOwnProperty.call(
      dados,
      checkboxProf.id,
    );
    const possuiExpertise = Object.prototype.hasOwnProperty.call(
      dados,
      checkboxExpertise.id,
    );

    if (possuiEstado) {
      sincronizarControlesPericia(linha, Number(dados[campoEstado.id]));
      return;
    }

    if (
      !possuiProf &&
      !possuiExpertise &&
      !(proficienciasLegadasCompletas && !possuiExpertiseSalva)
    ) {
      return;
    }

    // Um JSON legado completo tem todos os campos Prof, mas não Expertise.
    // Nesse caso, limpar Expertise preserva a interpretação histórica.
    if (proficienciasLegadasCompletas && !possuiExpertiseSalva) {
      checkboxExpertise.checked = false;
    }
    const estado = checkboxExpertise.checked
      ? 3
      : checkboxProf.checked
        ? 1
        : 0;
    sincronizarControlesPericia(linha, estado);
  });
}

function redefinirCampoParaPadraoDaFicha(campo) {
  if (campo.type === "checkbox" || campo.type === "radio") {
    campo.checked = campo.defaultChecked;
    return;
  }

  if (campo.tagName === "SELECT") {
    const opcoes = [...campo.options];
    if (campo.multiple) {
      opcoes.forEach((opcao) => {
        opcao.selected = opcao.defaultSelected;
      });
      return;
    }
    const opcaoPadrao = opcoes.find((opcao) => opcao.defaultSelected);
    if (opcaoPadrao) {
      campo.value = opcaoPadrao.value;
      return;
    }
    const opcaoNeutra = opcoes.find((opcao) => opcao.value === "");
    if (opcaoNeutra) {
      campo.value = "";
      return;
    }
    campo.selectedIndex = -1;
    return;
  }

  campo.value = campo.defaultValue ?? "";
}

function aplicarDefaultsNeutrosCamposAusentes(dados) {
  document.querySelectorAll("input, select, textarea").forEach((campo) => {
    if (!campoEhPersistenteDaFicha(campo)) return;
    if (Object.prototype.hasOwnProperty.call(dados, campo.id)) return;
    redefinirCampoParaPadraoDaFicha(campo);
  });
}

function reconciliarEditoresInventarioImportacao() {
  const editores = [
    ["__reconciliarEditorArmaduraImportacao", "armaduraModalOverlay"],
    ["__reconciliarEditorEscudoImportacao", "escudoModalOverlay"],
  ];
  for (const [nome, overlayId] of editores) {
    const reconciliar = window[nome];
    if (typeof reconciliar !== "function") {
      // `querySelector` não materializa um elemento inexistente em harnesses e,
      // no navegador, detecta apenas um overlay ativo realmente presente.
      if (typeof document.querySelector === "function" &&
          document.querySelector(`#${overlayId}.ativo`)) {
        throw new Error(`Reconciliação do editor ${overlayId} indisponível.`);
      }
      continue;
    }
    const resultado = reconciliar();
    if (!resultado?.ok) {
      throw resultado?.error || new Error(`Reconciliação do editor ${overlayId} falhou.`);
    }
  }
}

async function aplicarDadosFicha(dados, opcoes = {}) {
  if (!dados || typeof dados !== "object") return false;

  if (!opcoes.transacional) {
    return aplicarDadosFichaSemTransacao(dados, opcoes);
  }

  if (importacaoTransacionalAtiva) {
    const erro = new Error(
      "Já existe uma importação transacional em andamento.",
    );
    erro.code = "CHARACTER_SHEET_IMPORT_BUSY";
    throw erro;
  }

  let snapshot;
  try {
    snapshot = capturarSnapshotImportacao();
  } catch (erroSnapshot) {
    const erro = new Error(
      "Não foi possível preparar a recuperação da ficha. A ficha atual não foi alterada.",
    );
    erro.code = "CHARACTER_SHEET_SNAPSHOT_FAILED";
    erro.cause = erroSnapshot;
    throw erro;
  }

  snapshot.estadoTimerAvisoClasse =
    typeof window.__suspenderTimerAvisoCaracteristicaClasse === "function"
      ? window.__suspenderTimerAvisoCaracteristicaClasse()
      : null;

  const transacao = { id: ++geracaoImportacaoTransacional };
  let cancelamentoModaisIniciado = false;
  let cancelamentoModaisVerificado = false;
  let focusTargetModais = null;
  importacaoTransacionalAtiva = transacao;
  iniciarSinalConclusaoImportacaoFicha();
  window.__fichaImportacaoTransacaoAtiva = transacao.id;
  window.__fichaImportacaoEpoch =
    (window.__fichaImportacaoEpoch || 0) + 1;
  try {
    if (typeof window.__invalidarCarregamentosClasseExternos === "function") {
      window.__invalidarCarregamentosClasseExternos();
    } else {
      window.__geracaoCarregamentoCaracteristicasClasse =
        (window.__geracaoCarregamentoCaracteristicasClasse || 0) + 1;
      window.__geracaoCarregamentoCardClasse =
        (window.__geracaoCarregamentoCardClasse || 0) + 1;
    }
    cancelamentoModaisIniciado = true;
    if (typeof window.__cancelarOperacoesModaisXPLevelUp !== "function") {
      const erroCancelamento = new Error(
        "Não foi possível cancelar com segurança as operações pendentes de XP e Level Up.",
      );
      erroCancelamento.code = "CHARACTER_SHEET_MODAL_CANCELLATION_UNAVAILABLE";
      throw erroCancelamento;
    }
    const resultadoCancelamento = await window.__cancelarOperacoesModaisXPLevelUp();
    if (!resultadoCancelamento?.ok) {
      const erroCancelamento = new Error(
        "Não foi possível confirmar o encerramento das operações pendentes de XP e Level Up.",
      );
      erroCancelamento.code = "CHARACTER_SHEET_MODAL_CANCELLATION_FAILED";
      throw erroCancelamento;
    }
    cancelamentoModaisVerificado = true;
    focusTargetModais = resultadoCancelamento.focusTarget || null;
    if (typeof window.__cancelarModalSalvaguardaMorteParaImportacao !== "function") {
      const erroModalSalvaguarda = new Error(
        "Não foi possível invalidar o modal de salvaguarda contra a morte durante a importação.",
      );
      erroModalSalvaguarda.code = "CHARACTER_SHEET_DEATH_SAVE_MODAL_CANCELLATION_UNAVAILABLE";
      throw erroModalSalvaguarda;
    }
    const resultadoCancelamentoSalvaguarda = window.__cancelarModalSalvaguardaMorteParaImportacao();
    if (!resultadoCancelamentoSalvaguarda?.ok) {
      const erroModalSalvaguarda = new Error(
        "Não foi possível confirmar o fechamento do modal de salvaguarda contra a morte.",
      );
      erroModalSalvaguarda.code = "CHARACTER_SHEET_DEATH_SAVE_MODAL_CANCELLATION_FAILED";
      throw erroModalSalvaguarda;
    }
    const aplicado = await aplicarDadosFichaSemTransacao(dados, {
      ...opcoes,
      transacao,
    });
    if (aplicado !== true) {
      throw new Error("A aplicação transacional não foi concluída.");
    }
    if (!transacaoImportacaoAtiva(transacao)) {
      throw new Error("A importação perdeu sua geração ativa.");
    }
    // Os catálogos recriam os cards durante a aplicação. Feche somente os
    // editores cuja referência deixou de pertencer à lista ativa.
    reconciliarEditoresInventarioImportacao();
    if (typeof window.__reconciliarModaisXPLevelUp !== "function") {
      throw new Error("Reconciliação dos modais XP/Level Up indisponível no commit.");
    }
    const reconciliacaoPosAplicacao = window.__reconciliarModaisXPLevelUp({
      focusTarget: focusTargetModais,
    });
    if (!reconciliacaoPosAplicacao?.ok) {
      throw reconciliacaoPosAplicacao?.error || new Error("Reconciliação dos modais falhou no commit.");
    }
    await drenarObservadoresImportacao();
    window.__fichaImportacaoEpoch =
      (window.__fichaImportacaoEpoch || 0) + 1;
    importacaoTransacionalAtiva = null;
    window.__fichaImportacaoTransacaoAtiva = null;
    concluirSinalImportacaoFicha({ sucesso: true, restaurado: false });
    if (typeof window.__retomarTimerAvisoCaracteristicaClasse === "function") {
      window.__retomarTimerAvisoCaracteristicaClasse(
        snapshot.estadoTimerAvisoClasse,
      );
    }
    if (typeof window.__limparStatusExportacaoAposImportacaoValida === "function") {
      window.__limparStatusExportacaoAposImportacaoValida();
    }
    return aplicado;
  } catch (erroAplicacao) {
    window.__fichaImportacaoEpoch =
      (window.__fichaImportacaoEpoch || 0) + 1;
    if (importacaoTransacionalAtiva === transacao) {
      geracaoImportacaoTransacional += 1;
    }
    // Invalida também tarefas internas iniciadas durante esta tentativa. O
    // spinner é limpo porque callbacks antigos não podem mais executar finally.
    if (typeof window.__invalidarCarregamentosClasseExternos === "function") {
      window.__invalidarCarregamentosClasseExternos();
    } else {
      window.__geracaoCarregamentoCaracteristicasClasse =
        (window.__geracaoCarregamentoCaracteristicasClasse || 0) + 1;
      window.__geracaoCarregamentoCardClasse =
        (window.__geracaoCarregamentoCardClasse || 0) + 1;
    }

    let errosRestauracao = [];
    let verificacaoSnapshot = { valido: false, divergencias: ["Snapshot ainda não verificado."] };
    let verificacaoPosReconciliacao = {
      valido: false,
      classificacao: "nao_verificavel",
      divergencias: ["Verificação pós-reconciliação ainda não executada."],
      janelaEstabilidadeObservada: false,
      sentinelasDeListaConfirmados: false,
      estadosNaoVerificaveis: [],
    };
    try {
      // Detecta e invalida referências aos cards removidos antes que o snapshot
      // os reinsira. Assim o rollback não reativa um editor obsoleto.
      reconciliarEditoresInventarioImportacao();
    } catch (erroReconciliacaoEditor) {
      errosRestauracao.push(erroReconciliacaoEditor);
    }
    try {
      const errosSnapshot = restaurarSnapshotImportacao(snapshot);
      if (Array.isArray(errosSnapshot)) errosRestauracao.push(...errosSnapshot);
    } catch (erroRestauracao) {
      errosRestauracao.push(erroRestauracao);
    }
    try {
      verificacaoSnapshot = verificarSnapshotImportacao(snapshot);
      if (!verificacaoSnapshot.valido) {
        errosRestauracao.push(
          new Error(
            `A restauração divergiu do snapshot: ${verificacaoSnapshot.divergencias.join("; ")}`,
          ),
        );
      }
    } catch (erroVerificacao) {
      verificacaoSnapshot = {
        valido: false,
        divergencias: [erroVerificacao?.message || String(erroVerificacao)],
      };
      errosRestauracao.push(erroVerificacao);
    }
    try {
      // O snapshot inclui o DOM dos overlays. Se ele trouxer de volta a camada
      // visual de um editor já invalidado, remova-a sem restaurar a referência.
      reconciliarEditoresInventarioImportacao();
    } catch (erroReconciliacaoEditor) {
      errosRestauracao.push(erroReconciliacaoEditor);
    }
    if (cancelamentoModaisIniciado) {
      try {
        if (typeof window.__reconciliarModaisXPLevelUp !== "function") {
          throw new Error("Reconciliação dos modais XP/Level Up indisponível.");
        }
        const resultadoReconciliacao = window.__reconciliarModaisXPLevelUp({
          focusTarget: focusTargetModais,
          reconciliarXP: true,
        });
        if (!resultadoReconciliacao?.ok) {
          throw resultadoReconciliacao?.error || new Error("Reconciliação dos modais falhou.");
        }
      } catch (erroReconciliacao) {
        errosRestauracao.push(erroReconciliacao);
      }
    }
    // restaurarSnapshotImportacao repõe as propriedades vivas do DOM, inclusive
    // o spinner prévio. A geração anterior foi invalidada, então normalize o
    // indicador para não exibir uma carga que já não pode mais escrever/finalizar.
    if (typeof window.__limparCarregamentoClasseObsoleto === "function") {
      window.__limparCarregamentoClasseObsoleto();
    }
    if (typeof window.__retomarTimerAvisoCaracteristicaClasse === "function") {
      window.__retomarTimerAvisoCaracteristicaClasse(
        snapshot.estadoTimerAvisoClasse,
        true,
      );
    }
    try {
      // MutationObservers entregam mudanças síncronas da restauração como
      // microtasks. Dois limites de tarefa entregam também mutações que um
      // callback tenha enfileirado antes de verificar o estado durável.
      const primeiraJanela = await drenarObservadoresImportacao();
      const primeiraVerificacao = verificarSnapshotPosReconciliacaoImportacao(snapshot, {
        ...primeiraJanela,
      });
      const segundaJanela = await drenarObservadoresImportacao();
      const segundaVerificacao = verificarSnapshotPosReconciliacaoImportacao(snapshot, {
        ...segundaJanela,
      });
      verificacaoPosReconciliacao = segundaVerificacao;
      if (!primeiraVerificacao.valido || !segundaVerificacao.valido) {
        errosRestauracao.push(new Error(
          `A verificação pós-reconciliação encontrou divergência persistente: ${[
            ...primeiraVerificacao.divergencias,
            ...segundaVerificacao.divergencias,
          ].join("; ")}`,
        ));
      } else if (JSON.stringify(primeiraVerificacao.estadoVerificado) !==
                 JSON.stringify(segundaVerificacao.estadoVerificado)) {
        verificacaoPosReconciliacao = {
          ...segundaVerificacao,
          valido: false,
          classificacao: "alteracao_entre_checkpoints",
          divergencias: ["O estado persistente mudou entre os dois checkpoints pós-reconciliação."],
        };
        errosRestauracao.push(new Error(verificacaoPosReconciliacao.divergencias[0]));
      }
    } catch (erroVerificacaoFinal) {
      verificacaoPosReconciliacao = {
        valido: false,
        classificacao: "nao_verificavel",
        divergencias: [erroVerificacaoFinal?.message || String(erroVerificacaoFinal)],
      janelaEstabilidadeObservada: false,
      sentinelasDeListaConfirmados: false,
        estadosNaoVerificaveis: ["Não foi possível completar os checkpoints de observers e campos persistentes."],
      };
      errosRestauracao.push(erroVerificacaoFinal);
    }
    if (importacaoTransacionalAtiva === transacao) importacaoTransacionalAtiva = null;
    if (window.__fichaImportacaoTransacaoAtiva === transacao.id) {
      window.__fichaImportacaoTransacaoAtiva = null;
    }
    concluirSinalImportacaoFicha({
      sucesso: false,
      restaurado: verificacaoSnapshot.valido && verificacaoPosReconciliacao.valido && errosRestauracao.length === 0,
    });
    if (errosRestauracao.length) {
      const erro = new Error(
        "A aplicação da ficha falhou e a recuperação do estado anterior ficou incompleta.",
      );
      erro.code = "CHARACTER_SHEET_ROLLBACK_FAILED";
      erro.applicationError = erroAplicacao;
      erro.restorationErrors = errosRestauracao;
      erro.snapshotRestored = verificacaoSnapshot.valido;
      erro.snapshotVerification = verificacaoSnapshot;
      erro.postReconciliationVerification = verificacaoPosReconciliacao;
      erro.rollbackComplete = false;
      throw erro;
    }

    const erro = new Error(
      "O snapshot coincidiu no checkpoint de verificação, mas a estabilidade da apresentação após reconciliações e observadores assíncronos ainda não foi comprovada.",
    );
    erro.code = "CHARACTER_SHEET_ROLLBACK_UNVERIFIED";
    erro.applicationError = erroAplicacao;
    erro.snapshotRestored = verificacaoSnapshot.valido;
    erro.snapshotVerification = verificacaoSnapshot;
    erro.postReconciliationVerification = verificacaoPosReconciliacao;
    erro.rollbackComplete = false;
    erro.unfencedAsyncWriters = [
      ...(verificacaoPosReconciliacao.sentinelasDeListaConfirmados
        ? []
        : ["Os sentinelas de lista não foram confirmados"]),
      "escritores fora do processo (por exemplo, automação/extensões) não são enumeráveis nem cercados pela ficha",
      ...(cancelamentoModaisVerificado
        ? []
        : ["cancelamento ou drenagem de operações XP/Level Up não comprovado"]),
    ];
    throw erro;
  }
}

async function drenarObservadoresImportacao() {
  // Um observer sentinela é registrado depois dos observers de inventário já
  // instalados. A mutação transitória de comentário entrega os callbacks
  // anteriores desse mesmo alvo antes do sentinela, sem mudar os dados/cards.
  const idsLista = [
    "listaArmas", "listaMunicoes", "listaArmaduras", "listaEscudosItens",
    "listaVestimentas", "listaOutros",
  ];
  let sentinelasConfirmados = 0;
  let alvos = 0;
  let sentinelasDisponiveis = typeof MutationObserver === "function" &&
    typeof document.createComment === "function";
  if (sentinelasDisponiveis) {
    for (const id of idsLista) {
      const lista = document.getElementById(id);
      if (!lista) continue;
      alvos += 1;
      const confirmado = await new Promise((resolve) => {
        let timeoutId;
        const observer = new MutationObserver(() => {
          if (timeoutId) clearTimeout(timeoutId);
          observer.disconnect();
          resolve(true);
        });
        try {
          observer.observe(lista, { childList: true });
          const marcador = document.createComment("rollback-observer-checkpoint");
          lista.appendChild(marcador);
          marcador.remove();
          timeoutId = setTimeout(() => {
            observer.disconnect();
            resolve(false);
          }, 250);
        } catch {
          observer.disconnect();
          resolve(false);
        }
      });
      if (confirmado) sentinelasConfirmados += 1;
    }
  }
  // Limites adicionais entregam microtasks eventualmente enfileiradas pelos
  // callbacks atuais, mas não são apresentados como prova de timers externos.
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  return {
    janelaEstabilidadeObservada: true,
    sentinelasDeListaConfirmados: sentinelasDisponiveis && alvos > 0 && sentinelasConfirmados === alvos,
    listasObservadas: alvos,
    sentinelasConfirmados,
  };
}

// A integração Electron é uma segunda entrada de fichas. Passe-a pelo mesmo
// preparo e transação da importação manual; se outra aplicação já estiver em
// andamento, rejeite sem mutar a ficha para não intercalar dois escritores.
window.__aplicarFichaIntegracao = async function (entrada) {
  if (importacaoTransacionalAtiva) {
    const erro = new Error(
      "Já existe uma importação transacional em andamento. A ficha recebida pela integração não foi aplicada.",
    );
    erro.code = "CHARACTER_SHEET_IMPORT_BUSY";
    throw erro;
  }

  const dadosPreparados = prepararImportacaoFicha(entrada);
  return aplicarDadosFicha(dadosPreparados, {
    preparado: true,
    transacional: true,
    origemIntegracao: true,
  });
};
window.__drenarFichasIntegracaoPendentes?.();

let geracaoImportacaoTransacional = 0;
let importacaoTransacionalAtiva = null;
let resolverConclusaoImportacaoFicha = null;
let conclusaoImportacaoFichaAtiva = null;

function iniciarSinalConclusaoImportacaoFicha() {
  conclusaoImportacaoFichaAtiva = new Promise((resolver) => {
    resolverConclusaoImportacaoFicha = resolver;
  });
}

function concluirSinalImportacaoFicha(resultado) {
  const resolver = resolverConclusaoImportacaoFicha;
  resolverConclusaoImportacaoFicha = null;
  conclusaoImportacaoFichaAtiva = null;
  if (resolver) resolver(resultado);
}

window.__aguardarFimImportacaoFicha = () =>
  importacaoTransacionalAtiva && conclusaoImportacaoFichaAtiva
    ? conclusaoImportacaoFichaAtiva
    : Promise.resolve(null);

function transacaoImportacaoAtiva(transacao) {
  return (
    !!transacao &&
    importacaoTransacionalAtiva === transacao &&
    transacao.id === geracaoImportacaoTransacional
  );
}

function clonarEstadoSnapshot(valor) {
  if (valor === undefined) return undefined;
  if (valor === null) return null;
  if (typeof structuredClone === "function") return structuredClone(valor);
  return clonarDadosJsonSeguro(valor);
}

function capturarPropriedadesNoDOM(no) {
  const propriedades = {};
  [
    "value",
    "checked",
    "selected",
    "selectedIndex",
    "indeterminate",
    "disabled",
    "multiple",
    "open",
    "hidden",
    "inert",
    "scrollTop",
    "scrollLeft",
  ].forEach((nome) => {
    if (!(nome in no)) return;
    if (nome === "value" && no.tagName === "INPUT" && no.type === "file") {
      return;
    }
    try {
      propriedades[nome] = no[nome];
    } catch (erro) {
      // Alguns controles expõem propriedades legíveis que podem lançar.
    }
  });
  try {
    if (typeof no.selectionStart === "number") {
      propriedades.selectionStart = no.selectionStart;
      propriedades.selectionEnd = no.selectionEnd;
      propriedades.selectionDirection = no.selectionDirection;
    }
  } catch (erro) {
    // Controles numéricos e alguns tipos de input não suportam seleção textual.
  }
  return propriedades;
}

function capturarNoDOM(no) {
  return {
    no,
    tipo: no.nodeType,
    dados: no.nodeType === 3 || no.nodeType === 8
      ? no.data
      : undefined,
    atributos:
      no.nodeType === 1
        ? [...no.attributes].map((atributo) => [atributo.name, atributo.value])
        : null,
    propriedades:
      no.nodeType === 1 ? capturarPropriedadesNoDOM(no) : null,
    filhos: [...no.childNodes].map(capturarNoDOM),
  };
}

function capturarSnapshotImportacao() {
  if (typeof document === "undefined" || !document.body) {
    throw new Error("O DOM da ficha não está disponível para snapshot.");
  }

  return {
    arvoreDOM: capturarNoDOM(document.body),
    elementoComFoco: document.activeElement,
    personagem: {
      referencia: personagem,
      dados: clonarEstadoSnapshot(personagem),
      referenciaWindow: window.personagem,
      dadosWindow: clonarEstadoSnapshot(window.personagem),
    },
    configFicha: {
      referencia: configFicha,
      dados: clonarEstadoSnapshot(configFicha),
    },
    talentosEstruturados: {
      referencia: talentosEstruturados,
      dados: clonarEstadoSnapshot(talentosEstruturados),
    },
    armaduraEquipadaIndice,
    armaduraSelecionadaAtual:
      typeof armaduraSelecionadaAtual === "undefined"
        ? undefined
        : armaduraSelecionadaAtual,
    idsPocoesDesequipadasManualmente:
      typeof idsPocoesDesequipadasManualmente === "undefined"
        ? null
        : {
            referencia: idsPocoesDesequipadasManualmente,
            valores: [...idsPocoesDesequipadasManualmente],
          },
    estadoCombateIniciativa: clonarEstadoSnapshot(estadoCombateIniciativa),
    eventosDiarioAventura: {
      referencia: eventosDiarioAventura,
      dados: clonarEstadoSnapshot(eventosDiarioAventura),
    },
    indiceEventoDiarioAberto,
    salvarDiarioOrigemAnotacoes,
    dadosClasse: {
      bindingDisponivel: typeof dadosClasse !== "undefined",
      referencia:
        typeof dadosClasse === "undefined" ? undefined : dadosClasse,
      dados:
        typeof dadosClasse === "undefined"
          ? undefined
          : clonarEstadoSnapshot(dadosClasse),
    },
    bloqueandoLevelUp,
    baseline:
      typeof capturarBaselineImportacaoFicha === "function"
        ? capturarBaselineImportacaoFicha()
        : null,
  };
}

function definirPropriedadesSnapshot(referencia, dados) {
  if (!referencia || typeof referencia !== "object" || !dados || typeof dados !== "object") {
    return;
  }
  Object.keys(referencia).forEach((chave) => {
    if (!Object.prototype.hasOwnProperty.call(dados, chave)) delete referencia[chave];
  });
  Object.keys(dados).forEach((chave) => {
    Object.defineProperty(referencia, chave, {
      value: clonarEstadoSnapshot(dados[chave]),
      enumerable: true,
      configurable: true,
      writable: true,
    });
  });
}

function restaurarPropriedadesNoDOM(snapshot, erros) {
  const no = snapshot.no;
  try {
    if (snapshot.tipo === 3 || snapshot.tipo === 8) {
      no.data = snapshot.dados;
      return;
    }

    if (snapshot.tipo === 1) {
      const nomesOriginais = new Set(snapshot.atributos.map(([nome]) => nome));
      [...no.attributes].forEach((atributo) => {
        if (!nomesOriginais.has(atributo.name)) no.removeAttribute(atributo.name);
      });
      snapshot.atributos.forEach(([nome, valor]) => no.setAttribute(nome, valor));
    }

    no.replaceChildren(...snapshot.filhos.map((filho) => filho.no));
    snapshot.filhos.forEach((filho) => restaurarPropriedadesNoDOM(filho, erros));

    if (snapshot.propriedades) {
      const props = snapshot.propriedades;
      [
        "value",
        "checked",
        "selected",
        "selectedIndex",
        "indeterminate",
        "disabled",
        "multiple",
        "open",
        "hidden",
        "inert",
        "scrollTop",
        "scrollLeft",
        "selectionStart",
        "selectionEnd",
        "selectionDirection",
      ].forEach((nome) => {
        if (!Object.prototype.hasOwnProperty.call(props, nome)) return;
        try {
          no[nome] = props[nome];
        } catch (erro) {
          erros.push(erro);
        }
      });
    }

    // Alguns setters refletem propriedades em atributos (por exemplo,
    // HTMLButtonElement.value). Reaplique o conjunto original por último para
    // não deixar atributos introduzidos pela própria restauração.
    if (snapshot.tipo === 1) {
      const nomesOriginais = new Set(snapshot.atributos.map(([nome]) => nome));
      [...no.attributes].forEach((atributo) => {
        if (!nomesOriginais.has(atributo.name)) no.removeAttribute(atributo.name);
      });
      snapshot.atributos.forEach(([nome, valor]) => {
        if (no.getAttribute(nome) !== valor) no.setAttribute(nome, valor);
      });
    }
  } catch (erro) {
    erros.push(erro);
  }
}

function verificarNoDOMRestaurado(snapshot, caminho, divergencias) {
  const no = snapshot.no;
  if (!no || no.nodeType !== snapshot.tipo) {
    divergencias.push(`${caminho}: nó ausente ou tipo diferente`);
    return;
  }
  if ((snapshot.tipo === 3 || snapshot.tipo === 8) && no.data !== snapshot.dados) {
    divergencias.push(`${caminho}: conteúdo de texto/comentário diferente`);
  }
  if (snapshot.tipo === 1) {
    const atributosAtuais = [...no.attributes]
      .map((atributo) => [atributo.name, atributo.value])
      .sort(([a], [b]) => a.localeCompare(b));
    const atributosSnapshot = [...(snapshot.atributos || [])]
      .map(([nome, valor]) => [nome, valor])
      .sort(([a], [b]) => a.localeCompare(b));
    if (JSON.stringify(atributosAtuais) !== JSON.stringify(atributosSnapshot)) {
      divergencias.push(`${caminho}: atributos diferentes`);
    }
    for (const [nome, valor] of Object.entries(snapshot.propriedades || {})) {
      let valorAtual;
      try {
        valorAtual = no[nome];
      } catch (erro) {
        divergencias.push(`${caminho}.${nome}: propriedade não pôde ser lida`);
        continue;
      }
      if (!Object.is(valorAtual, valor)) {
        divergencias.push(`${caminho}.${nome}: propriedade diferente`);
      }
    }
  }
  const filhosAtuais = [...no.childNodes];
  if (filhosAtuais.length !== snapshot.filhos.length) {
    divergencias.push(`${caminho}: quantidade de nós filhos diferente`);
  }
  snapshot.filhos.forEach((filho, indice) => {
    if (filhosAtuais[indice] !== filho.no) {
      divergencias.push(`${caminho}[${indice}]: identidade/ordem do nó filho diferente`);
      return;
    }
    verificarNoDOMRestaurado(filho, `${caminho}[${indice}]`, divergencias);
  });
}

function atributosPosReconciliacao(snapshot) {
  return Object.fromEntries(snapshot.atributos || []);
}

function noTransitorioPosReconciliacao(snapshot) {
  if (snapshot.tipo !== 1) return false;
  const atributos = atributosPosReconciliacao(snapshot);
  const classes = new Set(String(atributos.class || "").split(/\s+/).filter(Boolean));
  const idsTransient = new Set([
    "armaduraModalOverlay", "escudoModalOverlay", "xpAddModal", "levelUpModal",
    "classeSpinner",
  ]);
  const id = String(atributos.id || "");
  return idsTransient.has(id) || id.startsWith("xpAddModal") || id.startsWith("levelUp");
}

function atributosDomPersistente(snapshot) {
  const atributos = atributosPosReconciliacao(snapshot);
  const classes = new Set(String(atributos.class || "").split(/\s+/).filter(Boolean));
  if (atributos.id === "btnRolarDado") classes.delete("rolando");
  if (classes.has("item-card")) {
    delete atributos.draggable;
    delete atributos["aria-roledescription"];
    delete atributos.title;
    classes.delete("outro-catalogo-card");
  }
  if (classes.size) atributos.class = [...classes].sort().join(" ");
  else delete atributos.class;
  return atributos;
}

function normalizarAtributosDomPersistente(atributos, id) {
  const normalizados = { ...atributos };
  if (typeof normalizados.style === "string") {
    const estilos = Object.fromEntries(normalizados.style.split(";")
      .map((declaracao) => declaracao.trim())
      .filter(Boolean)
      .map((declaracao) => {
        const separador = declaracao.indexOf(":");
        return separador < 0 ? [declaracao, ""] : [declaracao.slice(0, separador).trim(), declaracao.slice(separador + 1).trim()];
      }));
    if (id === "xpBarCurrent" || id === "xpBarNext") delete estilos.transition;
    normalizados.style = Object.entries(estilos).sort(([a], [b]) => a.localeCompare(b));
  }
  return Object.entries(normalizados).sort(([a], [b]) => a.localeCompare(b));
}

function elementoXPReconstruidoVisualmente(no) {
  let atual = no?.nodeType === 1 ? no : no?.parentNode;
  const ids = new Set([
    "xpBar", "xpBarCurrent", "xpBarNext", "xpProgressMarker", "xpTooltip",
    "xpLevelLabel", "xpCurrentValue", "xpThresholdValue", "xpTexto",
  ]);
  while (atual) {
    if (ids.has(atual.id)) return true;
    atual = atual.parentNode;
  }
  return false;
}

function filhosDomPersistente(snapshot) {
  return (snapshot.filhos || []).filter((filho) => !noTransitorioPosReconciliacao(filho));
}

function noOverlayReconhecidoPosReconciliacao(no) {
  const idsTransient = new Set([
    "armaduraModalOverlay", "escudoModalOverlay", "xpAddModal", "levelUpModal",
    "classeSpinner",
  ]);
  const id = String(no?.id || "");
  return idsTransient.has(id) || id.startsWith("xpAddModal") || id.startsWith("levelUp");
}

function verificarDomPersistentePosReconciliacao(snapshot, caminho, divergencias, estado, paiEsperado = null) {
  const no = snapshot.no;
  if (!no || no.nodeType !== snapshot.tipo) {
    divergencias.push(`${caminho}: nó persistente ausente ou tipo diferente`);
    return;
  }
  const textoXPReconstruido = (snapshot.tipo === 3 || snapshot.tipo === 8) &&
    elementoXPReconstruidoVisualmente(paiEsperado);
  if (paiEsperado && no.parentNode !== paiEsperado && !textoXPReconstruido) {
    divergencias.push(`${caminho}: relação pai-filho persistente diferente`);
  }
  if (snapshot.tipo === 3 || snapshot.tipo === 8) {
    if (no.data !== snapshot.dados) divergencias.push(`${caminho}: texto persistente diferente`);
    return;
  }
  if (snapshot.tipo !== 1 || noTransitorioPosReconciliacao(snapshot)) return;
  if (no.isConnected === false) divergencias.push(`${caminho}: nó persistente desconectado após reconciliação`);

  const atributosEsperados = atributosDomPersistente(snapshot);
  const cardInventario = String(atributosEsperados.class || "").split(/\s+/).includes("item-card");
  const atuaisMap = Object.fromEntries([...no.attributes].map((atributo) => [atributo.name, atributo.value]));
  const classesAtuais = new Set(String(atuaisMap.class || "").split(/\s+/).filter(Boolean));
  if (atributosEsperados.id === "btnRolarDado") classesAtuais.delete("rolando");
  if (cardInventario) {
    delete atuaisMap.draggable;
    delete atuaisMap["aria-roledescription"];
    delete atuaisMap.title;
    classesAtuais.delete("outro-catalogo-card");
  }
  if (classesAtuais.size) atuaisMap.class = [...classesAtuais].sort().join(" ");
  else delete atuaisMap.class;
  const atributosAtuais = Object.entries(atuaisMap).sort(([a], [b]) => a.localeCompare(b));
  const atributosEsperadosOrdenados = Object.entries(atributosEsperados)
    .map(([nome, valor]) => [nome, valor]).sort(([a], [b]) => a.localeCompare(b));
  if (JSON.stringify(normalizarAtributosDomPersistente(atuaisMap, atributosEsperados.id)) !==
      JSON.stringify(normalizarAtributosDomPersistente(atributosEsperados, atributosEsperados.id))) {
    divergencias.push(`${atributosEsperados.id || caminho}: atributos persistentes diferentes (${JSON.stringify(atributosAtuais)} != ${JSON.stringify(atributosEsperadosOrdenados)})`);
  }

  const propriedades = snapshot.propriedades || {};
  const controle = /^(INPUT|SELECT|TEXTAREA)$/.test(no.tagName || "");
  if (controle) {
    for (const nome of ["value", "checked", "selected", "selectedIndex", "disabled", "multiple"]) {
      if (!Object.prototype.hasOwnProperty.call(propriedades, nome)) continue;
      if (!Object.is(no[nome], propriedades[nome])) {
        const campo = atributosEsperados.id || atributosEsperados["data-campo"] || caminho;
        divergencias.push(`${campo}.${nome}: valor persistente diferente`);
        estado.push([campo, nome, no[nome]]);
      }
    }
  }

  const esperados = filhosDomPersistente(snapshot);
  const esperadosNos = new Set(esperados.map((filho) => filho.no));
  const filhosAtuais = [...(no.childNodes || no.children || [])].filter((filho) => {
    if (noOverlayReconhecidoPosReconciliacao(filho)) {
      if (filho.id === "classeSpinner" && filho.style?.display !== "none") {
        divergencias.push("classeSpinner: indicador transitório ainda visível após a reconciliação");
      }
      return false;
    }
    // O observer de Outros pode criar esta projeção visual após a restauração
    // quando o snapshot capturou um card legado sem resumo.
    if (filho.nodeType === 1 && filho.classList?.contains("outro-resumo") &&
        !esperadosNos.has(filho) &&
        String(atributosPosReconciliacao(snapshot).class || "").split(/\s+/).includes("item-card") &&
        snapshot.no?.dataset?.tipo === "outro") return false;
    return true;
  });
  const nosEsperados = esperados.map((filho) => filho.no);
  const identidadeVisualXPReconciliada = elementoXPReconstruidoVisualmente(no) &&
    filhosAtuais.length === nosEsperados.length &&
    filhosAtuais.every((filho, indice) => {
      const esperado = esperados[indice];
      return filho === esperado.no ||
        ((filho.nodeType === 3 || filho.nodeType === 8) && esperado.tipo === filho.nodeType && filho.data === esperado.dados);
    });
  if (!identidadeVisualXPReconciliada && (filhosAtuais.length !== nosEsperados.length ||
      filhosAtuais.some((filho, indice) => filho !== nosEsperados[indice]))) {
    const rotulo = (filho) => filho?.id || filho?.nodeName || filho?.tagName || `nodeType:${filho?.nodeType}`;
    divergencias.push(`${caminho}: identidade/ordem dos nós persistentes diferente após reconciliação (esperado: ${nosEsperados.map(rotulo).join(",")}; atual: ${filhosAtuais.map(rotulo).join(",")})`);
  }
  const cartoesEsperados = esperados.filter((filho) =>
    String(atributosPosReconciliacao(filho).class || "").split(/\s+/).includes("item-card"),
  ).map((filho) => filho.no);
  if (cartoesEsperados.length) {
    const cartoesAtuais = [...no.children].filter((filho) => filho.classList?.contains("item-card"));
    if (cartoesAtuais.length !== cartoesEsperados.length ||
        cartoesAtuais.some((filho, indice) => filho !== cartoesEsperados[indice])) {
      divergencias.push(`${caminho}: identidade/ordem dos cartões persistentes diferente`);
    }
  }
  esperados.forEach((filho, indice) =>
    verificarDomPersistentePosReconciliacao(filho, `${caminho}[${indice}]`, divergencias, estado, no),
  );
}

function verificarSnapshotPosReconciliacaoImportacao(snapshot, opcoes = {}) {
  const verificacao = verificarSnapshotImportacao(snapshot, { posReconciliacao: true });
  const estadoVerificado = [
    personagem, window.personagem, configFicha, talentosEstruturados,
    estadoCombateIniciativa, eventosDiarioAventura,
    typeof dadosClasse === "undefined" ? undefined : dadosClasse,
    typeof capturarBaselineImportacaoFicha === "function" ? capturarBaselineImportacaoFicha() : null,
  ].map((valor) => {
    try { return JSON.stringify(valor); } catch { return "[não serializável]"; }
  });
  const resultado = {
    ...verificacao,
    classificacao: verificacao.valido ? "restaurado_com_transitorios_esperados" : "divergencia_persistente",
    alteracoesTransitoriasEsperadas: [
      "fechamento/reconciliação de modais e editores em overlays conhecidos e spinner transitório de classe",
      "atributos draggable, aria-roledescription, title e classe de apresentação dos cards de inventário",
      "subtree .outro-resumo recriado pelo renderer a partir dos campos do item",
    ],
    janelaEstabilidadeObservada: opcoes.janelaEstabilidadeObservada === true,
    sentinelasDeListaConfirmados:
      opcoes.sentinelasDeListaConfirmados === true,
    listasObservadas: opcoes.listasObservadas || 0,
    sentinelasConfirmados: opcoes.sentinelasConfirmados || 0,
    estadosNaoVerificaveis: [
      "timers/promises sem registro de cancelamento ou drenagem central",
      "listeners e closures privados não expostos pelos módulos",
      "preload/processo Electron e escritores externos ao repositório",
      "extensões e automação externas ao renderer",
    ],
    tarefasAssincronasNaoCercadas: [
      ...(opcoes.sentinelasDeListaConfirmados === true
        ? []
        : ["Sentinelas de lista não confirmados"]),
      "timers/promises sem registro central podem executar depois da janela observada",
      "writers Electron/externos não são rastreados pelo renderer",
    ],
    estadoVerificado,
  };
  if (resultado.valido && resultado.sentinelasDeListaConfirmados) {
    resultado.classificacao = "restaurado_com_sentinelas_de_lista_confirmados";
  } else if (resultado.valido && resultado.janelaEstabilidadeObservada) {
    resultado.classificacao = "restaurado_em_janela_observada";
  } else if (resultado.valido) {
    resultado.classificacao = "restaurado_sem_confirmacao_assincrona";
  }
  return resultado;
}

function verificarSnapshotImportacao(snapshot, opcoes = {}) {
  const divergencias = [];
  const compararDados = (nome, atual, esperado) => {
    try {
      if (JSON.stringify(atual) !== JSON.stringify(esperado)) {
        divergencias.push(`${nome}: dados diferentes`);
      }
    } catch (erro) {
      divergencias.push(`${nome}: comparação falhou (${erro?.message || erro})`);
    }
  };
  const compararReferenciaEDados = (nome, atual, referencia, dados) => {
    if (atual !== referencia) divergencias.push(`${nome}: referência raiz diferente`);
    compararDados(nome, atual, dados);
  };

  const estadoDomPersistente = [];
  if (opcoes.posReconciliacao) {
    verificarDomPersistentePosReconciliacao(snapshot.arvoreDOM, "document.body", divergencias, estadoDomPersistente);
  } else {
    verificarNoDOMRestaurado(snapshot.arvoreDOM, "document.body", divergencias);
  }
  compararReferenciaEDados(
    "personagem", personagem, snapshot.personagem.referencia, snapshot.personagem.dados,
  );
  if (window.personagem !== snapshot.personagem.referenciaWindow) {
    divergencias.push("window.personagem: referência raiz diferente");
  }
  compararDados("window.personagem", window.personagem, snapshot.personagem.dadosWindow);
  compararReferenciaEDados("configFicha", configFicha, snapshot.configFicha.referencia, snapshot.configFicha.dados);
  compararReferenciaEDados(
    "talentosEstruturados", talentosEstruturados,
    snapshot.talentosEstruturados.referencia, snapshot.talentosEstruturados.dados,
  );
  if (armaduraEquipadaIndice !== snapshot.armaduraEquipadaIndice) {
    divergencias.push("armaduraEquipadaIndice: valor diferente");
  }
  if (snapshot.armaduraSelecionadaAtual !== undefined &&
      armaduraSelecionadaAtual !== snapshot.armaduraSelecionadaAtual) {
    divergencias.push("armaduraSelecionadaAtual: valor diferente");
  }
  if (snapshot.idsPocoesDesequipadasManualmente) {
    if (idsPocoesDesequipadasManualmente !== snapshot.idsPocoesDesequipadasManualmente.referencia ||
        JSON.stringify([...idsPocoesDesequipadasManualmente]) !==
        JSON.stringify(snapshot.idsPocoesDesequipadasManualmente.valores)) {
      divergencias.push("idsPocoesDesequipadasManualmente: referência ou valores diferentes");
    }
  }
  compararDados("estadoCombateIniciativa", estadoCombateIniciativa, snapshot.estadoCombateIniciativa);
  compararReferenciaEDados(
    "eventosDiarioAventura", eventosDiarioAventura,
    snapshot.eventosDiarioAventura.referencia, snapshot.eventosDiarioAventura.dados,
  );
  if (indiceEventoDiarioAberto !== snapshot.indiceEventoDiarioAberto) {
    divergencias.push("indiceEventoDiarioAberto: valor diferente");
  }
  if (salvarDiarioOrigemAnotacoes !== snapshot.salvarDiarioOrigemAnotacoes) {
    divergencias.push("salvarDiarioOrigemAnotacoes: valor diferente");
  }
  if (snapshot.dadosClasse.bindingDisponivel) {
    compararReferenciaEDados(
      "dadosClasse", dadosClasse, snapshot.dadosClasse.referencia, snapshot.dadosClasse.dados,
    );
  }
  if (bloqueandoLevelUp !== snapshot.bloqueandoLevelUp) {
    divergencias.push("bloqueandoLevelUp: valor diferente");
  }
  if (snapshot.baseline !== null && typeof capturarBaselineImportacaoFicha === "function") {
    compararDados("baseline salvo/alterado", capturarBaselineImportacaoFicha(), snapshot.baseline);
  }
  return { valido: divergencias.length === 0, divergencias, estadoDomPersistente };
}

function restaurarSnapshotImportacao(snapshot) {
  const erros = [];
  const tentar = (acao) => {
    try {
      acao();
    } catch (erro) {
      erros.push(erro);
    }
  };

  tentar(() => {
    personagem = snapshot.personagem.referencia;
    definirPropriedadesSnapshot(personagem, snapshot.personagem.dados);
    window.personagem = snapshot.personagem.referenciaWindow;
    if (window.personagem && snapshot.personagem.dadosWindow) {
      definirPropriedadesSnapshot(
        window.personagem,
        snapshot.personagem.dadosWindow,
      );
    }
  });
  tentar(() => {
    configFicha = snapshot.configFicha.referencia;
    definirPropriedadesSnapshot(configFicha, snapshot.configFicha.dados);
  });
  tentar(() => {
    talentosEstruturados = snapshot.talentosEstruturados.referencia;
    definirPropriedadesSnapshot(
      talentosEstruturados,
      snapshot.talentosEstruturados.dados,
    );
  });
  tentar(() => {
    armaduraEquipadaIndice = snapshot.armaduraEquipadaIndice;
  });
  if (snapshot.armaduraSelecionadaAtual !== undefined) {
    tentar(() => {
      armaduraSelecionadaAtual = snapshot.armaduraSelecionadaAtual;
    });
  }
  if (snapshot.idsPocoesDesequipadasManualmente) {
    tentar(() => {
      idsPocoesDesequipadasManualmente =
        snapshot.idsPocoesDesequipadasManualmente.referencia;
      idsPocoesDesequipadasManualmente.clear();
      snapshot.idsPocoesDesequipadasManualmente.valores.forEach((id) =>
        idsPocoesDesequipadasManualmente.add(id),
      );
    });
  }
  tentar(() => {
    Object.keys(estadoCombateIniciativa).forEach((chave) => {
      delete estadoCombateIniciativa[chave];
    });
    Object.assign(estadoCombateIniciativa, snapshot.estadoCombateIniciativa);
  });
  tentar(() => {
    eventosDiarioAventura = snapshot.eventosDiarioAventura.referencia;
    eventosDiarioAventura.splice(
      0,
      eventosDiarioAventura.length,
      ...snapshot.eventosDiarioAventura.dados.map(clonarEstadoSnapshot),
    );
    indiceEventoDiarioAberto = snapshot.indiceEventoDiarioAberto;
    salvarDiarioOrigemAnotacoes = snapshot.salvarDiarioOrigemAnotacoes;
  });
  if (snapshot.dadosClasse.bindingDisponivel) {
    tentar(() => {
      dadosClasse = snapshot.dadosClasse.referencia;
      definirPropriedadesSnapshot(dadosClasse, snapshot.dadosClasse.dados);
    });
  }
  tentar(() => {
    restaurarPropriedadesNoDOM(snapshot.arvoreDOM, erros);
    if (
      snapshot.elementoComFoco?.isConnected &&
      typeof snapshot.elementoComFoco.focus === "function"
    ) {
      snapshot.elementoComFoco.focus({ preventScroll: true });
    }
  });
  tentar(() => {
    bloqueandoLevelUp = snapshot.bloqueandoLevelUp;
  });
  if (snapshot.baseline !== null) {
    tentar(() => restaurarBaselineImportacaoFicha(snapshot.baseline));
  }

  return erros;
}

async function aplicarDadosFichaSemTransacao(dados, opcoes = {}) {
  if (!dados || typeof dados !== "object") return false;

  if (!opcoes.preparado) dados = normalizarDadosImportacao(dados);
  const bloqueioAnteriorLevelUp = bloqueandoLevelUp;
  bloqueandoLevelUp = true;
  // O wrapper transacional restaura o snapshot se esta aplicação falhar.
  try {
  const tarefasAssincronasObrigatorias = [];
  function aguardarCallbackObrigatorio(callback) {
    return new Promise((resolver, rejeitar) => {
      setTimeout(() => {
        if (
          opcoes.transacao &&
          !transacaoImportacaoAtiva(opcoes.transacao)
        ) {
          rejeitar(new Error("A tarefa da importação ficou obsoleta."));
          return;
        }
        try {
          Promise.resolve(callback()).then(
            (valor) => {
              if (
                opcoes.transacao &&
                !transacaoImportacaoAtiva(opcoes.transacao)
              ) {
                rejeitar(new Error("A tarefa da importação ficou obsoleta."));
                return;
              }
              resolver(valor);
            },
            rejeitar,
          );
        } catch (erro) {
          rejeitar(erro);
        }
      }, 0);
    });
  }

  if (typeof aplicarTema === "function") {
    aplicarTema(
      Object.prototype.hasOwnProperty.call(dados, "tema")
        ? dados.tema
        : "tema-padrao",
    );
  }
  configFicha = normalizarConfigFicha(
    dados.configFicha,
    opcoes.preparado ? { preservarDesconhecidos: true } : undefined,
  );
  personagem = dados;
  armaduraEquipadaIndice = normalizarIndiceEquipamento(
    dados.armaduraEquipadaIndice,
  );
  if (opcoes.preparado) aplicarDefaultsNeutrosCamposAusentes(dados);
  console.log("OUTROS COM ID:", dados.outros);
  // Migra munições legadas de "Outros" para o catálogo dedicado, mantendo os IDs
  // usados pelas armas. Se o arquivo já contém a coleção nova, ela é prioritária.
  const antigosComoMunicao = (Array.isArray(dados.outros) ? dados.outros : []).filter(item => String(item.outro_tipo || "").trim().toLowerCase() === "municao");
  const novasMunicoesPorId = new Map((Array.isArray(dados.municoes) ? dados.municoes : []).map(item => [String(item.id || ""), item]));
  antigosComoMunicao.forEach(item => { if (!novasMunicoesPorId.has(String(item.id || ""))) novasMunicoesPorId.set(String(item.id || gerarId()), typeof converterMunicaoLegada === "function" ? converterMunicaoLegada(item) : item); });
  const containerMunicoes = document.getElementById("listaMunicoes");
  if (containerMunicoes && typeof criarCardMunicao === "function") {
    containerMunicoes.replaceChildren();
    novasMunicoesPorId.forEach(item => criarCardMunicao(item));
  }
  const outrosAplicados = (Array.isArray(dados.outros) ? dados.outros : []).filter(item => String(item.outro_tipo || "").trim().toLowerCase() !== "municao");
  if (Object.prototype.hasOwnProperty.call(dados, "outros")) {
    dados.outros = outrosAplicados;
  }
  // 🔥 CAMPOS ESPECIAIS
  const camposEspeciais = {
    xp: (valor) => setXP(valor ?? 0),
    magiaAtributoConjuracao: (valor, campo) =>
      (campo.value = normalizarChaveAtributo(valor)),
    alinhamentoID: (valor, campo) =>
      (campo.value = normalizarValorAlinhamento(valor)),
    dadosVidaTipo: (valor, campo) =>
      (campo.value = normalizarTipoDadoVida(valor)),
  };

  // 🔹 FUNÇÃO AUXILIAR
  function preencherCampo(campo, valor) {
    if (campo.type === "checkbox") {
      campo.checked = valor;
    } else if (campo.type === "number") {
      const num = parseInt(String(valor ?? "").replace(/[^\d-]/g, ""), 10);
      campo.value = Number.isNaN(num) ? "" : Math.abs(num);
    } else {
      campo.value = valor;
    }
  }

  // =========================
  // 🟢 1. CAMPOS SIMPLES + ESPECIAIS
  // =========================
  for (let key in dados) {
    const campo = document.getElementById(key);
    if (!campo) continue;

    // 🔥 CAMPOS ESPECIAIS
    if (camposEspeciais[key]) {
      camposEspeciais[key](dados[key], campo);
      continue;
    }

    // 🔹 IGNORAR CAMPOS ESPECÍFICOS
    if (
      [
        "arma1Nome",
        "arma2Nome",
        "arma1Dano",
        "arma2Dano",
        "armaduraNome",
      ].includes(key)
    ) {
      continue;
    }

    preencherCampo(campo, dados[key]);
  }

  restaurarEstadosPericiaImportados(dados);

  const nivelSalvoFicha = obterNivelSalvoFicha(dados);
  if (nivelSalvoFicha) {
    const campoNivelImportado = document.getElementById("classeNivelID");
    if (campoNivelImportado) {
      campoNivelImportado.value = String(nivelSalvoFicha);
    }
  }

  if (dados.estadoCombate && typeof dados.estadoCombate === "object") {
    estadoCombateIniciativa.ativo = !!dados.estadoCombate.ativo;
    estadoCombateIniciativa.rodada = estadoCombateIniciativa.ativo
      ? Math.max(1, parseInt(dados.estadoCombate.rodada, 10) || 1)
      : 0;
    estadoCombateIniciativa.posicao = estadoCombateIniciativa.ativo
      ? Math.max(1, parseInt(dados.estadoCombate.posicao, 10) || 1)
      : null;
    estadoCombateIniciativa.iniciativa = estadoCombateIniciativa.ativo
      ? parseInt(dados.estadoCombate.iniciativa, 10) || 0
      : null;
  } else {
    estadoCombateIniciativa.ativo = false;
    estadoCombateIniciativa.rodada = 0;
    estadoCombateIniciativa.posicao = null;
    estadoCombateIniciativa.iniciativa = null;
  }
  atualizarInterfaceCombate();

  const campoSubclasse = garantirCampoSubclasseComoSelect();
  if (campoSubclasse) {
    campoSubclasse.dataset.pendingValue = String(dados.subclasse ?? "");
    atualizarSubclasses(dados.classeNomeID ?? dados.classeNome ?? "");
  }

  const campoRaca = obterCampoRaca();
  const valorRacaSalvo = String(dados.racaID ?? dados.raca ?? "").trim();
  if (campoRaca && valorRacaSalvo) {
    garantirOpcaoSelect(campoRaca, valorRacaSalvo);
    campoRaca.value = valorRacaSalvo;
  }

  const campoSubraca = obterCampoSubraca();
  if (campoSubraca) {
    campoSubraca.dataset.pendingValue = String(dados.subraca ?? "");
    atualizarSubracas(dados.racaID ?? dados.raca ?? "");
  }

  normalizarPlaceholdersCamposBase();
  preencherFormularioConfigFicha();
  aplicarConfigCustomizacaoNaFicha(false);
  if (typeof carregarDiarioAventura === "function") {
    carregarDiarioAventura(dados.historiaDiarioAventura);
  }

  inicializarTalentos(dados, { preparado: opcoes.preparado === true });

  // =========================
  // 🟢 2. CARREGAR MUNIÇÕES (OUTROS)
  // =========================
  {
    const containerOutros = document.getElementById("listaOutros");

    if (containerOutros) {
      const outrosAtuais = containerOutros.querySelectorAll(
        '.item-card[data-tipo="outro"]',
      );
      outrosAtuais.forEach((o) => o.remove());

      outrosAplicados.forEach((dadosOutro) => {
        const novoCard = adicionarNovoOutro();
        if (!novoCard) return;

        const possuiId = Object.prototype.hasOwnProperty.call(dadosOutro, "id");
        const idUtilizavel = possuiId && dadosOutro.id !== null && dadosOutro.id !== "";
        if (idUtilizavel) novoCard.dataset.id = String(dadosOutro.id);
        else novoCard.dataset.idTransitorio = "true";
        novoCard._dadosOriginais = { ...dadosOutro };

        novoCard.querySelectorAll("[data-campo]").forEach((campo) => {
          const valor = dadosOutro[campo.dataset.campo];
          if (valor !== undefined) campo.value = valor;
        });
        aplicarFlagsCompartilhadasItem(novoCard, dadosOutro, "outro");
        atualizarOpcoesMunicao(novoCard);
      });
    }
  }

  // =========================
  // 🔫 3. ARMAS
  // =========================
  const armasAplicadas = Array.isArray(dados.armas) ? dados.armas : [];
  {
    const containerArmas = document.getElementById("listaArmas");

    if (containerArmas) {
      const armasAtuais = containerArmas.querySelectorAll(
        '.item-card[data-tipo="arma"]:not(#armaModelo)',
      );
      armasAtuais.forEach((a) => a.remove());

      armasAplicadas.forEach((dadosArma) => {
        const novoCard = adicionarNovaArma();
        if (!novoCard) return;
        novoCard._dadosOriginais = { ...dadosArma };

        if (dadosArma.propriedades) {
          novoCard
            .querySelectorAll('input[type="checkbox"]')
            .forEach((checkbox) => {
              const prop = checkbox.dataset.propriedade;
              if (prop && dadosArma.propriedades[prop] !== undefined) {
                checkbox.checked = dadosArma.propriedades[prop];
                checkbox.dispatchEvent(new Event("change"));
              }
            });
        }

        novoCard.querySelectorAll("[data-campo]").forEach((campo) => {
          const valor = dadosArma[campo.dataset.campo];
          if (valor !== undefined) campo.value = valor;
        });
        aplicarFlagsCompartilhadasItem(novoCard, dadosArma, "arma");
        atualizarOpcoesMunicao(novoCard);

        tarefasAssincronasObrigatorias.push(
          () =>
            aguardarCallbackObrigatorio(() => {
              const selectMunicao = novoCard.querySelector(
                '[data-campo="arma_municao_id"]',
              );

              if (selectMunicao && dadosArma.arma_municao_id) {
                selectMunicao.value = String(dadosArma.arma_municao_id);
                selectMunicao.dispatchEvent(new Event("change"));
              }
            }),
        );

        if (typeof dadosArma.proficiente === "boolean") {
          const indicador = novoCard.querySelector(".item-proficiencia");
          if (indicador) {
            indicador.classList.toggle("nao", !dadosArma.proficiente);
            indicador.classList.toggle("ativo", dadosArma.proficiente);
          }
        }
      });
    }
  }

  // =========================
  // 👕 4. ARMADURAS
  // =========================
  const armadurasAplicadas = Array.isArray(dados.armaduras) ? dados.armaduras : [];
  {
    const containerArmaduras = document.getElementById("listaArmaduras");

    if (containerArmaduras) {
      const atuais = containerArmaduras.querySelectorAll(
        '.item-card[data-tipo="armadura"]:not(#armaduraModelo)',
      );
      atuais.forEach((a) => a.remove());

      armadurasAplicadas.forEach((dadosArmadura) => {
        const novoCard = adicionarNovaArmadura();
        if (!novoCard) return;
        novoCard._dadosOriginais = { ...dadosArmadura };
        if (!Object.prototype.hasOwnProperty.call(dadosArmadura, "instanciaId")) {
          novoCard.dataset.instanciaIdTransitorio = "true";
        }
        if (typeof dadosArmadura.instanciaId === "string" && dadosArmadura.instanciaId) {
          novoCard.dataset.instanciaId = dadosArmadura.instanciaId;
        }
        if (typeof dadosArmadura.catalogoId === "string" && dadosArmadura.catalogoId) {
          novoCard.dataset.catalogoId = dadosArmadura.catalogoId;
          novoCard.dataset.catalogoVersao = String(
            Number.isInteger(dadosArmadura.catalogoVersao) && dadosArmadura.catalogoVersao > 0
              ? dadosArmadura.catalogoVersao : 1);
        }
        ["vestirMinutos", "retirarMinutos"].forEach(campo => {
          const minutos = dadosArmadura[campo];
          if (Number.isFinite(minutos) && minutos > 0) novoCard.dataset[campo] = String(minutos);
        });

        novoCard.querySelectorAll("[data-campo]").forEach((campo) => {
          const valor = dadosArmadura[campo.dataset.campo];

          if (valor !== undefined) {
            campo.value = valor;
            campo.dispatchEvent(new Event("change"));
          }
        });
        aplicarFlagsCompartilhadasItem(novoCard, dadosArmadura, "armadura");

        if (typeof dadosArmadura.proficiente === "boolean") {
          const indicador = novoCard.querySelector(".item-proficiencia");
          if (indicador) {
            indicador.classList.toggle("nao", !dadosArmadura.proficiente);
            indicador.classList.toggle("ativo", dadosArmadura.proficiente);
          }
        }
      });
    }
  }

  // =========================
  // 🛡️ 4.1 ESCUDOS
  // =========================
  const escudosAplicados = Array.isArray(dados.escudos) ? dados.escudos : [];
  {
    const containerEscudos = document.getElementById("listaEscudos");

    if (containerEscudos) {
      const atuais = containerEscudos.querySelectorAll(
        '.item-card[data-tipo="escudo"]:not(#escudoModelo)',
      );
      atuais.forEach((e) => e.remove());

      escudosAplicados.filter((dadosEscudo) => dadosEscudo?.escudo_nome?.trim()).forEach((dadosEscudo) => {
        const novoCard = adicionarNovoEscudo();
        if (!novoCard) return;
        novoCard._dadosOriginais = { ...dadosEscudo };

        novoCard.querySelectorAll("[data-campo]").forEach((campo) => {
          const valor = dadosEscudo[campo.dataset.campo];

          if (valor !== undefined) {
            campo.value = valor;
            campo.dispatchEvent(new Event("change"));
          }
        });
        aplicarFlagsCompartilhadasItem(novoCard, dadosEscudo, "escudo");

        if (typeof dadosEscudo.proficiente === "boolean") {
          const indicador = novoCard.querySelector(".item-proficiencia");
          if (indicador) {
            indicador.classList.toggle("nao", !dadosEscudo.proficiente);
            indicador.classList.toggle("ativo", dadosEscudo.proficiente);
          }
        }
      });
    }
  }

  // =========================
  // 🔄 5. PÓS-PROCESSAMENTO
  // =========================
  document
    .querySelectorAll(
      '#listaArmas .item-card[data-tipo="arma"], #listaArmaduras .item-card[data-tipo="armadura"], #listaEscudos .item-card[data-tipo="escudo"], #listaOutros .item-card[data-tipo="outro"], #listaMunicoes .item-card[data-tipo="municao"]',
    )
    .forEach(fecharItemCard);
  atualizarListaArmasEquipamento();

  const armasImportadas = coletarArmas();
  const escudosImportados = coletarEscudos();
  const indiceArma1 = resolverIndiceArmaSalva(
    dados,
    1,
    armasImportadas,
    escudosImportados,
  );
  const indiceArma2Base = resolverIndiceArmaSalva(
    dados,
    2,
    armasImportadas,
    escudosImportados,
  );
  const indiceArma2 = indiceArma2Base === indiceArma1 ? null : indiceArma2Base;

  atualizarSelectNomeArmaEquipada(
    1,
    armasImportadas,
    indiceArma1,
    escudosImportados,
  );
  atualizarSelectNomeArmaEquipada(
    2,
    armasImportadas,
    indiceArma2,
    escudosImportados,
  );

  sincronizarMarcacaoArmasPorSlots();
  sincronizarEquipamentosCombate();

  sincronizarSalvaguardasComAtributosBase();
  atualizarAtributos();
  desenharRadar();
  atualizarModificadoresSalvaguarda();
  atualizarPericias();
  atualizarPassivas();
  atualizarClasseArmaduraEquipada();
  atualizarSubAbaArmas();
  sincronizarClasseNivel(true);
  if (nivelSalvoFicha) {
    const campoNivelImportado = document.getElementById("classeNivelID");
    if (campoNivelImportado) {
      campoNivelImportado.value = String(nivelSalvoFicha);
      sincronizarClasseNivel(false);
    }
  }
  sincronizarResumoCaracteristicas(true);
  if (typeof preencherSelectArquivosCaracteristica === "function") {
    preencherSelectArquivosCaracteristica();
  }
  if (typeof carregarCaracteristicasClasse === "function") {
    // A carga auxilia o painel de características: falhas de rede/JSON são
    // tratadas pela própria função e exibidas ali. Exceções que escapem dela
    // ainda precisam impedir que a importação seja declarada concluída.
    const arquivoSalvo = document.getElementById(
      "caracteristicaClasseArquivo",
    )?.value;
    const subclasseCaracteristicaSalva =
      dados.caracteristicaClasseSubclasse ||
      dados.caracteristicaClasseSubdominio ||
      dados.selectSubclasse ||
      "";
    if (!arquivoSalvo) {
      sincronizarArquivoCaracteristicaComClasse(false);
      avisarCaracteristicaClasse(
        "A ficha importada não tinha arquivo de característica salvo. Vou tentar importar pela classe e subclasse da ficha.",
        "info",
      );
    } else {
      avisarCaracteristicaClasse(
        `A ficha importada trouxe a característica salva: ${arquivoSalvo}. Vou tentar recarregar esse arquivo.`,
        "info",
      );
    }
    tarefasAssincronasObrigatorias.push(
      () =>
        aguardarCallbackObrigatorio(() =>
          carregarCaracteristicasClasse(
            document.getElementById("classeNomeID")?.value ||
              obterSlugArquivoCaracteristica(
                document.getElementById("caracteristicaClasseArquivo")?.value,
              ),
            parseInt(document.getElementById("classeNivelID")?.value) || 1,
            document.getElementById("subclasse")?.value || "",
            {
              importacaoFichaToken: opcoes.transacao?.id,
              subclasseCaracteristicaSalva,
              dadosImportados: {
                classeData:
                  typeof dados.classeData === "string" ? dados.classeData : "",
                subclasseData:
                  typeof dados.subclasseData === "string"
                    ? dados.subclasseData
                    : "",
              },
            },
          ),
        ),
    );
  }
  sincronizarCamposMagia();
  atualizarMagias();
  atualizarVidaMaxNivelUm();
  normalizarPontosDeVida();
  normalizarDadosVida();
  atualizarPesoAtualInventario();
  atualizarDadosVidaTotal();
  atualizarDadoVida();

  window.personagem = dados;

  atualizarSelectNomeArmaduraEquipada(armadurasAplicadas, armaduraEquipadaIndice);

  equiparArmadura(armaduraEquipadaIndice, {
    armaduras: armadurasAplicadas,
  });

  atualizarFicha();
  // Inicia os callbacks já existentes somente depois da etapa síncrona. Assim,
  // uma exceção síncrona não deixa timers de importação rodando após o erro.
  const resultadosAssincronos = await Promise.allSettled(
    tarefasAssincronasObrigatorias.map((tarefa) => tarefa()),
  );
  const falhaAssincrona = resultadosAssincronos.find(
    (resultado) => resultado.status === "rejected",
  );
  if (falhaAssincrona) throw falhaAssincrona.reason;
  if (
    opcoes.transacao &&
    !transacaoImportacaoAtiva(opcoes.transacao)
  ) {
    throw new Error("A importação perdeu sua geração ativa antes do commit.");
  }
  marcarFichaComoSalva();
  return true;
  } finally {
    bloqueandoLevelUp = bloqueioAnteriorLevelUp;
  }
}
