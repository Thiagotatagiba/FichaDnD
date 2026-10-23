// ===== Persistencia da ficha =====
function normalizarDadosImportacao(dadosOriginais) {
  if (!dadosOriginais || typeof dadosOriginais !== "object") return {};

  const dados = { ...dadosOriginais };
  const aliases = {
    nomePlayer: "jogador",
    classeNome: "classeNomeID",
    classeNivel: "classeNivelID",
    raca: "racaID",
    antecedente: "antecedenteID",
    alinhamento: "alinhamentoID",
    bonusProficiencia: "bonusProf",
    forBase: "for",
    desBase: "des",
    conBase: "con",
    intBase: "int",
    sabBase: "sab",
    carBase: "car",
    // compatibilidade: salv_* antigo → atrib_*
    salv_for: "atrib_for",
    salv_des: "atrib_des",
    salv_con: "atrib_con",
    salv_int: "atrib_int",
    salv_sab: "atrib_sab",
    salv_car: "atrib_car",
    // compatibilidade: prof_* antigo → prof_salv_*
    prof_for: "prof_salv_for",
    prof_des: "prof_salv_des",
    prof_con: "prof_salv_con",
    prof_int: "prof_salv_int",
    prof_sab: "prof_salv_sab",
    prof_car: "prof_salv_car",
  };

  Object.entries(aliases).forEach(([origem, destino]) => {
    if (
      (dados[destino] === undefined || dados[destino] === "") &&
      dados[origem] !== undefined
    ) {
      dados[destino] = dados[origem];
    }
  });

  const parseContadorEspacoMagia = (valor) => {
    if (typeof valor === "number") {
      return Number.isSafeInteger(valor) && valor >= 0 ? valor : null;
    }
    if (typeof valor !== "string") return null;

    const decimal = valor.trim();
    if (!/^\d+$/.test(decimal)) return null;

    const numero = Number(decimal);
    return Number.isSafeInteger(numero) ? numero : null;
  };

  for (let nivel = 1; nivel <= 9; nivel++) {
    const campoRest = `magia${nivel}Rest`;
    const campoTotal = `magia${nivel}Total`;
    const campoUsado = `magia${nivel}Usado`;
    const possuiRest = Object.prototype.hasOwnProperty.call(dados, campoRest);
    const possuiTotal = Object.prototype.hasOwnProperty.call(dados, campoTotal);
    const possuiUsado = Object.prototype.hasOwnProperty.call(dados, campoUsado);

    if (possuiRest || (!possuiTotal && !possuiUsado)) continue;

    const total = parseContadorEspacoMagia(dados[campoTotal]);
    const usado = parseContadorEspacoMagia(dados[campoUsado]);
    let motivoInvalido = "";

    if (!possuiTotal || !possuiUsado) {
      motivoInvalido = "os campos Total e Usado precisam estar presentes";
    } else if (total === null || usado === null) {
      motivoInvalido =
        "os contadores devem ser inteiros decimais não negativos";
    } else if (usado > total) {
      motivoInvalido = "Usado não pode exceder Total";
    }

    if (motivoInvalido) {
      const erro = new Error(
        `Espaços de magia do nível ${nivel} inválidos: ${motivoInvalido}. A importação foi cancelada.`,
      );
      erro.code = "INVALID_LEGACY_MAGIC_SLOTS";
      throw erro;
    }

    dados[campoRest] = String(total - usado);
  }

  const magiasPorNivel = dados.magiasPorNivel || dados.magias;
  if (magiasPorNivel && typeof magiasPorNivel === "object") {
    Object.entries(magiasPorNivel).forEach(([nivel, magias]) => {
      const nivelNumerico = parseInt(String(nivel).replace(/\D/g, ""), 10);
      if (!Number.isInteger(nivelNumerico) || !Array.isArray(magias)) return;

      const campoId = `magia${nivelNumerico}Texto`;
      if (dados[campoId] === undefined) {
        dados[campoId] = JSON.stringify(magias);
      }
    });
  }

  ["bonusProf", "bonusProficiencia"].forEach((chave) => {
    if (
      dados[chave] !== undefined &&
      dados[chave] !== null &&
      dados[chave] !== ""
    ) {
      const valorNormalizado = parseInt(
        String(dados[chave]).replace(/[^\d-]/g, ""),
        10,
      );
      if (!Number.isNaN(valorNormalizado)) {
        dados[chave] = Math.abs(valorNormalizado);
      }
    }
  });

  if (
    !dados.talentosEstruturados ||
    typeof dados.talentosEstruturados !== "object"
  ) {
    dados.talentosEstruturados = montarTalentosEstruturados(dados);
  }

  dados.configFicha = normalizarConfigFicha(dados.configFicha);

  return dados;
}

function adicionarAliasesLegacyAoSave(dados) {
  if (!dados || typeof dados !== "object") return dados;

  dados.nomePlayer = dados.jogador ?? "";
  dados.classeNome = dados.classeNomeID ?? "";
  dados.classeNivel = dados.classeNivelID ?? "";
  dados.raca = dados.racaID ?? "";
  dados.antecedente = dados.antecedenteID ?? "";
  dados.alinhamento = dados.alinhamentoID ?? "";
  dados.bonusProficiencia = dados.bonusProf ?? "";
  dados.forBase = dados.for ?? "";
  dados.desBase = dados.des ?? "";
  dados.conBase = dados.con ?? "";
  dados.intBase = dados.int ?? "";
  dados.sabBase = dados.sab ?? "";
  dados.carBase = dados.car ?? "";
  // aliases legados para atrib_* e prof_salv_*
  dados.salv_for = dados.atrib_for ?? "";
  dados.salv_des = dados.atrib_des ?? "";
  dados.salv_con = dados.atrib_con ?? "";
  dados.salv_int = dados.atrib_int ?? "";
  dados.salv_sab = dados.atrib_sab ?? "";
  dados.salv_car = dados.atrib_car ?? "";
  dados.prof_for = dados.prof_salv_for ?? false;
  dados.prof_des = dados.prof_salv_des ?? false;
  dados.prof_con = dados.prof_salv_con ?? false;
  dados.prof_int = dados.prof_salv_int ?? false;
  dados.prof_sab = dados.prof_salv_sab ?? false;
  dados.prof_car = dados.prof_salv_car ?? false;
  dados.talentosEstruturados = JSON.parse(JSON.stringify(talentosEstruturados));

  return dados;
}

function normalizarValorAlinhamento(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";

  const mapa = {
    "Leal e Bom": "Leal e Bom (LB)",
    "Neutro e Bom": "Neutro e Bom (NB)",
    "Caótico e Bom": "Caótico e Bom (CB)",
    "Leal e Neutro": "Leal e Neutro (LN)",
    Neutro: "Neutro (N)",
    "Caótico e Neutro": "Caótico e Neutro (CN)",
    "Leal e Mau": "Leal e Mau (LM)",
    "Neutro e Mau": "Neutro e Mau (NM)",
    "Caótico e Mau": "Caótico e Mau (CM)",
  };

  return mapa[texto] || texto;
}

// Uso: obterArmaduraSeguro(0)
function obterArmaduraSeguro(indice = 0) {
  const p = window.personagem;
  if (!p || !Array.isArray(p.armaduras)) return null;
  return p.armaduras[indice] || null;
}
window.obterArmaduraSeguro = window.obterArmaduraSeguro || obterArmaduraSeguro;

function carregarFicha(personagem) {
  aplicarDadosFicha(personagem);
}

function obterNivelSalvoFicha(dados = {}) {
  const candidatos = [
    dados.classeNivelID,
    dados.classeNivel,
    String(dados.classeID || "").match(/NV\s*(\d+)/i)?.[1],
  ];

  for (const valor of candidatos) {
    const nivel = parseInt(String(valor ?? "").replace(/[^\d-]/g, ""), 10);
    if (Number.isInteger(nivel) && nivel > 0) return nivel;
  }

  return null;
}

function coletarDadosFicha() {
  const dados = {};

  document.querySelectorAll("input, select, textarea").forEach((campo) => {
    if (!campo.id) return;
    if (campo.type === "file") return;
    if (campo.id === "importarFichaInput") return;
    if (["modalIniciativaDado", "modalPosicaoIniciativa"].includes(campo.id))
      return;
    dados[campo.id] = campo.type === "checkbox" ? campo.checked : campo.value;
  });

  ["equipamentoArmas", "equipamentoArmadura", "equipamentoOutros"].forEach(
    (campo) => {
      if (Object.prototype.hasOwnProperty.call(personagem, campo)) {
        dados[campo] = personagem[campo];
      }
    },
  );

  const arma1Equipada = obterSelecaoArmaEquipada(1);
  const arma2Equipada = obterSelecaoArmaEquipada(2);
  dados.arma1Nome = arma1Equipada.nome;
  dados.arma2Nome = arma2Equipada.nome;
  dados.arma1EquipadaIndice = arma1Equipada.indice;
  dados.arma2EquipadaIndice = arma2Equipada.indice;
  dados.armaduraEquipadaIndice = armaduraEquipadaIndice;
  dados.talentosEstruturados = JSON.parse(JSON.stringify(talentosEstruturados));
  dados.configFicha = JSON.parse(JSON.stringify(configFicha));
  dados.tema =
    typeof obterTemaAtual === "function" ? obterTemaAtual() : "tema-padrao";
  if (typeof obterEstadoCombateParaSalvar === "function") {
    dados.estadoCombate = obterEstadoCombateParaSalvar();
  }
  if (typeof obterEventosDiarioAventuraParaSalvar === "function") {
    dados.historiaDiarioAventura = obterEventosDiarioAventuraParaSalvar();
  }
  dados.caracteristicaClasseArquivo =
    document.getElementById("caracteristicaClasseArquivo")?.value || "";
  dados.caracteristicaClasseSubclasse =
    document.getElementById("caracteristicaClasseSubclasse")?.value ||
    document.getElementById("selectSubclasse")?.value ||
    "";
  dados.caracteristicaClasseSubdominio = dados.caracteristicaClasseSubclasse;

  return adicionarAliasesLegacyAoSave(dados);
}

let ultimoEstadoSalvo = JSON.stringify(coletarDadosFicha());

function marcarFichaComoSalva() {
  ultimoEstadoSalvo = JSON.stringify(coletarDadosFicha());
}

function atualizarCampoAutomaticoFicha(id, valor) {
  const campo = document.getElementById(id);
  if (!campo || typeof ultimoEstadoSalvo !== "string") return;

  let estadoSalvo;
  try {
    estadoSalvo = JSON.parse(ultimoEstadoSalvo);
  } catch (erro) {
    return;
  }

  const estadoAntes = coletarDadosFicha();
  if (
    Object.prototype.hasOwnProperty.call(estadoSalvo, id) &&
    JSON.stringify(estadoAntes[id]) !== JSON.stringify(estadoSalvo[id])
  ) {
    return;
  }

  campo.value = valor;
  const estadoDepois = coletarDadosFicha();
  const camposRelacionados = {
    caracteristicaClasseSubclasse: ["caracteristicaClasseSubdominio"],
    selectSubclasse: [
      "caracteristicaClasseSubclasse",
      "caracteristicaClasseSubdominio",
    ],
  };
  const camposAtualizados = new Set([
    id,
    ...(camposRelacionados[id] || []),
  ]);
  let referenciaAtualizada = false;

  Object.keys(estadoDepois).forEach((chave) => {
    if (
      camposAtualizados.has(chave) &&
      Object.prototype.hasOwnProperty.call(estadoSalvo, chave) &&
      JSON.stringify(estadoAntes[chave]) === JSON.stringify(estadoSalvo[chave]) &&
      JSON.stringify(estadoAntes[chave]) !== JSON.stringify(estadoDepois[chave])
    ) {
      estadoSalvo[chave] = estadoDepois[chave];
      referenciaAtualizada = true;
    }
  });

  if (referenciaAtualizada) ultimoEstadoSalvo = JSON.stringify(estadoSalvo);
}
window.atualizarCampoAutomaticoFicha = atualizarCampoAutomaticoFicha;

let houveInteracaoDuranteInicializacaoFicha = false;
const registrarInteracaoDuranteInicializacaoFicha = () => {
  houveInteracaoDuranteInicializacaoFicha = true;
};
["input", "change", "click"].forEach((tipoEvento) =>
  document.addEventListener(
    tipoEvento,
    registrarInteracaoDuranteInicializacaoFicha,
    true,
  ),
);

function finalizarInicializacaoEstadoFicha() {
  const atualizarReferenciaInicial = () => {
    if (!houveInteracaoDuranteInicializacaoFicha) marcarFichaComoSalva();
    ["input", "change", "click"].forEach((tipoEvento) =>
      document.removeEventListener(
        tipoEvento,
        registrarInteracaoDuranteInicializacaoFicha,
        true,
      ),
    );
  };

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(atualizarReferenciaInicial);
  } else {
    setTimeout(atualizarReferenciaInicial, 0);
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    finalizarInicializacaoEstadoFicha,
    { once: true },
  );
} else {
  finalizarInicializacaoEstadoFicha();
}

function fichaFoiAlterada() {
  return JSON.stringify(coletarDadosFicha()) !== ultimoEstadoSalvo;
}

/* SALVAR Ficha*/
function salvarFicha() {
  // Salvar class/subclass data
  const classeData = document.getElementById("classeData").value;
  const subData = document.getElementById("subclasseData").value;

  const dados = coletarDadosFicha();
  dados.classeData = classeData;
  dados.subclasseData = subData;
  dados.caracteristicaClasseArquivo =
    document.getElementById("caracteristicaClasseArquivo")?.value || "";
  dados.caracteristicaClasseSubclasse =
    document.getElementById("caracteristicaClasseSubclasse")?.value ||
    document.getElementById("selectSubclasse")?.value ||
    "";
  dados.caracteristicaClasseSubdominio = dados.caracteristicaClasseSubclasse;
  dados.armas = coletarArmas();
  dados.armaduras = coletarArmaduras();
  dados.escudos = coletarEscudos();
  dados.outros = coletarOutros();
  dados.armaduraEquipadaIndice = armaduraEquipadaIndice;

  const nome = document.getElementById("nomePersonagem").value || "Personagem";
  const jogador = document.getElementById("jogador").value || "Jogador";

  const hoje = new Date();
  const data =
    hoje.getFullYear().toString() +
    String(hoje.getMonth() + 1).padStart(2, "0") +
    String(hoje.getDate()).padStart(2, "0");

  const nomeArquivo = `${nome}_${jogador}_${data}.json`.replace(/\s+/g, "_");

  const blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nomeArquivo;
  a.click();

  marcarFichaComoSalva();
}

/* IMPORTAR Ficha*/

let estadoModalImportacao = "fechado";
let focoAnteriorModalImportacao = null;
let fichaInerteAnteriorModalImportacao = false;
let valorAriaBusyAnteriorModalImportacao = null;
let inicioModalImportacao = 0;
const TEMPO_MINIMO_VISIVEL_MODAL_IMPORTACAO_MS = 350;

function obterElementosModalImportacao() {
  return {
    overlay: document.getElementById("importacaoModalOverlay"),
    titulo: document.getElementById("importacaoModalTitulo"),
    mensagem: document.getElementById("importacaoModalMensagem"),
    progresso: document.getElementById("importacaoModalProgresso"),
    botao: document.getElementById("importacaoModalContinuar"),
  };
}

function abrirModalImportacao() {
  const { overlay, titulo, mensagem, progresso, botao } =
    obterElementosModalImportacao();
  if (!overlay || !titulo || !mensagem || !progresso || !botao) {
    throw new Error("A interface do modal de importação não está disponível.");
  }

  focoAnteriorModalImportacao = document.activeElement;
  const areaFicha = document.querySelector(".ficha");
  fichaInerteAnteriorModalImportacao = areaFicha?.inert ?? false;
  valorAriaBusyAnteriorModalImportacao = areaFicha?.getAttribute("aria-busy");
  if (areaFicha) {
    areaFicha.inert = true;
    areaFicha.setAttribute("aria-busy", "true");
  }

  estadoModalImportacao = "processando";
  inicioModalImportacao = Date.now();
  mensagem.textContent = "Importando ficha...";
  mensagem.setAttribute("role", "status");
  mensagem.setAttribute("aria-live", "polite");
  progresso.hidden = false;
  botao.hidden = true;
  botao.textContent = "Continuar";
  overlay.dataset.estado = estadoModalImportacao;
  overlay.style.display = "flex";
  overlay.classList.add("ativo");
  overlay.setAttribute("aria-hidden", "false");
  botao.addEventListener("click", fecharModalImportacao);
  titulo.focus();
  document.addEventListener("keydown", tratarTeclasModalImportacao);
}

function tratarTeclasModalImportacao(evento) {
  if (estadoModalImportacao === "fechado") return;
  evento.stopImmediatePropagation();

  if (evento.key === "Escape") {
    evento.preventDefault();
    if (estadoModalImportacao !== "processando") fecharModalImportacao();
    return;
  }

  if (evento.key !== "Tab") return;
  const { overlay, titulo, botao } = obterElementosModalImportacao();
  if (!overlay) return;

  evento.preventDefault();
  if (estadoModalImportacao === "processando" || botao?.hidden) {
    titulo?.focus();
  } else {
    botao.focus();
  }
}

function mostrarResultadoImportacao(tipo, mensagemTexto) {
  const { overlay, mensagem, progresso, botao } =
    obterElementosModalImportacao();
  if (!overlay || !mensagem || !progresso || !botao) return;

  estadoModalImportacao = tipo;
  overlay.dataset.estado = tipo;
  mensagem.textContent = mensagemTexto;
  mensagem.setAttribute("role", tipo === "erro" ? "alert" : "status");
  mensagem.setAttribute("aria-live", tipo === "erro" ? "assertive" : "polite");
  progresso.hidden = true;
  botao.textContent = tipo === "sucesso" ? "Continuar" : "Fechar";
  botao.hidden = false;
  botao.focus();
}

function fecharModalImportacao() {
  if (estadoModalImportacao === "processando") return;

  const { overlay } = obterElementosModalImportacao();
  if (!overlay) return;

  overlay.classList.remove("ativo");
  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden", "true");
  delete overlay.dataset.estado;
  document.removeEventListener("keydown", tratarTeclasModalImportacao);
  obterElementosModalImportacao().botao?.removeEventListener(
    "click",
    fecharModalImportacao,
  );

  const areaFicha = document.querySelector(".ficha");
  if (areaFicha) {
    areaFicha.inert = fichaInerteAnteriorModalImportacao;
    if (valorAriaBusyAnteriorModalImportacao === null) {
      areaFicha.removeAttribute("aria-busy");
    } else {
      areaFicha.setAttribute("aria-busy", valorAriaBusyAnteriorModalImportacao);
    }
  }

  estadoModalImportacao = "fechado";
  const botaoImportar = document.getElementById("btnImportarFicha");
  if (botaoImportar?.isConnected && !botaoImportar.disabled) {
    botaoImportar.focus();
  } else if (focoAnteriorModalImportacao?.isConnected) {
    focoAnteriorModalImportacao.focus();
  }
  focoAnteriorModalImportacao = null;
}

function aguardarRenderizacaoModalImportacao() {
  return new Promise((resolver) => {
    if (typeof requestAnimationFrame !== "function") {
      setTimeout(resolver, 0);
      return;
    }

    requestAnimationFrame(() => requestAnimationFrame(resolver));
  });
}

function aguardarTempoMinimoModalImportacao() {
  const tempoDecorrido = Date.now() - inicioModalImportacao;
  const tempoRestante = Math.max(
    0,
    TEMPO_MINIMO_VISIVEL_MODAL_IMPORTACAO_MS - tempoDecorrido,
  );
  if (tempoRestante === 0) return Promise.resolve();
  return new Promise((resolver) => setTimeout(resolver, tempoRestante));
}

function validarEstruturaImportacao(dados) {
  // A importação mapeia propriedades de um objeto JSON para campos da ficha.
  if (
    !dados ||
    typeof dados !== "object" ||
    Array.isArray(dados)
  ) {
    const erro = new Error(
      "O JSON selecionado não contém um objeto de ficha no nível principal.",
    );
    erro.code = "INVALID_CHARACTER_SHEET_ROOT";
    throw erro;
  }

  // As coleções são opcionais em fichas antigas; quando presentes, o importador
  // remove os cards atuais e acessa propriedades de cada item antes de recriá-los.
  ["armas", "armaduras", "escudos", "outros"].forEach((campo) => {
    if (
      Object.prototype.hasOwnProperty.call(dados, campo) &&
      !Array.isArray(dados[campo])
    ) {
      const erro = new Error(
        `O campo "${campo}" é incompatível: era esperada uma lista de equipamentos.`,
      );
      erro.code = "INVALID_CHARACTER_SHEET_COLLECTION";
      throw erro;
    }

    if (Array.isArray(dados[campo])) {
      const indiceInvalido = dados[campo].findIndex(
        (item) => !item || typeof item !== "object" || Array.isArray(item),
      );
      if (indiceInvalido !== -1) {
        const erro = new Error(
          `O item ${indiceInvalido + 1} do campo "${campo}" não é um objeto de equipamento válido.`,
        );
        erro.code = "INVALID_CHARACTER_SHEET_COLLECTION_ITEM";
        throw erro;
      }
    }
  });
}

async function processarImportacao(conteudo, aoFinalizar) {
  let resultado;
  try {
    await aguardarRenderizacaoModalImportacao();

    let dados;
    try {
      dados = typeof conteudo === "string" ? JSON.parse(conteudo) : conteudo;
    } catch (erro) {
      const erroJson = new Error(
        "O arquivo selecionado não contém JSON válido. Confira o arquivo e tente novamente.",
      );
      erroJson.code = "INVALID_CHARACTER_SHEET_JSON";
      throw erroJson;
    }

    validarEstruturaImportacao(dados);
    if (typeof aplicarDadosFicha !== "function") {
      const erro = new Error("A função de aplicação da ficha não está disponível.");
      erro.code = "CHARACTER_SHEET_APPLIER_UNAVAILABLE";
      throw erro;
    }

    // aplicarDadosFicha normaliza e valida slots legados antes de tocar no estado/UI.
    aplicarDadosFicha(dados);
    resultado = {
      tipo: "sucesso",
      mensagem: "Ficha importada com sucesso!",
    };
  } catch (erro) {
    console.error("Erro durante a importação da ficha:", erro);
    let mensagem = erro?.message || "Ocorreu um erro ao importar a ficha.";
    if (
      erro?.code === "INVALID_LEGACY_MAGIC_SLOTS" ||
      erro?.code === "INVALID_CHARACTER_SHEET_ROOT" ||
      erro?.code === "INVALID_CHARACTER_SHEET_COLLECTION" ||
      erro?.code === "INVALID_CHARACTER_SHEET_COLLECTION_ITEM" ||
      erro?.code === "INVALID_CHARACTER_SHEET_JSON" ||
      erro?.code === "CHARACTER_SHEET_APPLIER_UNAVAILABLE"
    ) {
      // Essas rejeições ocorrem antes de a ficha ser aplicada.
    } else {
      mensagem =
        "Ocorreu uma falha durante a aplicação da ficha. A atualização pode ter sido parcial; confira os dados antes de continuar.";
    }
    resultado = { tipo: "erro", mensagem };
  } finally {
    await aguardarTempoMinimoModalImportacao();
    if (resultado) mostrarResultadoImportacao(resultado.tipo, resultado.mensagem);
    if (typeof aoFinalizar === "function") {
      try {
        aoFinalizar();
      } catch (erro) {
        console.error("Erro ao finalizar importação pendente:", erro);
      }
    }
  }
}

function confirmarAlteracoesAntesDeImportar() {
  if (!fichaFoiAlterada()) return true;

  return confirm(
    "Existem alterações não salva. As alterações atuais serão perdidas ao importar. Deseja continuar sem salvar? ",
  );
}

function importarFicha(json, opcoes = {}) {
  window.importarFicha = importarFicha;

  if (!opcoes.ignorarConfirmacao && !confirmarAlteracoesAntesDeImportar()) {
    return false;
  }

  // Se recebeu JSON diretamente, usa o mesmo fluxo visual e de validação.
  if (json !== undefined && json !== null) {
    try {
      abrirModalImportacao();
      processarImportacao(json, opcoes.aoFinalizar);
    } catch (err) {
      console.error("Não foi possível abrir o modal de importação:", err);
      alert("Não foi possível iniciar a importação da ficha.");
    }
    return true;
  }

  // Cria input e label ocultos se não existirem
  let fileInput = document.getElementById("importarFichaInput");
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.id = "importarFichaInput";
    fileInput.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;opacity:0;width:1px;height:1px;";

    const label = document.createElement("label");
    label.htmlFor = "importarFichaInput";
    label.id = "importarFichaLabel";
    label.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;";

    document.body.appendChild(fileInput);
    document.body.appendChild(label);

    fileInput.addEventListener("change", function (evt) {
      const file = evt.target.files && evt.target.files[0];
      if (!file) return;
      try {
        abrirModalImportacao();
        const reader = new FileReader();
        reader.onload = function (evento) {
          processarImportacao(evento.target.result, () => {
            fileInput.value = "";
          });
        };
        reader.onerror = function () {
          aguardarTempoMinimoModalImportacao().then(() =>
            mostrarResultadoImportacao(
              "erro",
              "Não foi possível ler o arquivo selecionado. Tente escolher o arquivo novamente.",
            ),
          );
          fileInput.value = "";
          if (typeof opcoes.aoFinalizar === "function") opcoes.aoFinalizar();
        };
        reader.readAsText(file, "utf-8");
      } catch (err) {
        console.error("Não foi possível ler o arquivo de ficha:", err);
        mostrarResultadoImportacao(
          "erro",
          "Não foi possível iniciar a leitura do arquivo selecionado.",
        );
        fileInput.value = "";
        if (typeof opcoes.aoFinalizar === "function") opcoes.aoFinalizar();
      }
    });

    fileInput.addEventListener("cancel", () => {
      fileInput.value = "";
    });
  }

  // Dispara via label (compatível com file://)
  const label = document.getElementById("importarFichaLabel");
  if (label) {
    label.click();
  } else {
    fileInput.click();
  }
  return true;
}
window.importarFicha = importarFicha;
