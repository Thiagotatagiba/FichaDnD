// ===== Persistencia da ficha =====
const FICHA_SCHEMA_VERSION_ATUAL = 1;

/**
 * Valida e migra somente o envelope de versão da ficha.
 * A migração v0 → v1 não interpreta os dados: ela preserva aliases, coleções,
 * metadados legados e propriedades desconhecidas, acrescentando a versão atual.
 */
function migrarDadosFicha(dadosOriginais) {
  if (
    !dadosOriginais ||
    typeof dadosOriginais !== "object" ||
    Array.isArray(dadosOriginais)
  ) {
    const erro = new Error(
      "O JSON selecionado não contém um objeto de ficha no nível principal.",
    );
    erro.code = "INVALID_CHARACTER_SHEET_ROOT";
    throw erro;
  }

  let versao = Object.prototype.hasOwnProperty.call(
    dadosOriginais,
    "fichaSchemaVersion",
  )
    ? dadosOriginais.fichaSchemaVersion
    : 0;

  if (
    !Number.isSafeInteger(versao) ||
    versao < 0 ||
    (versao === 0 &&
      Object.prototype.hasOwnProperty.call(
        dadosOriginais,
        "fichaSchemaVersion",
      ))
  ) {
    const erro = new Error(
      'O campo "fichaSchemaVersion" deve ser um inteiro positivo quando presente.',
    );
    erro.code = "INVALID_CHARACTER_SHEET_VERSION";
    throw erro;
  }

  if (versao > FICHA_SCHEMA_VERSION_ATUAL) {
    const erro = new Error(
      `A ficha usa a versão de esquema ${versao}, que não é compatível com esta versão do aplicativo.`,
    );
    erro.code = "UNSUPPORTED_CHARACTER_SHEET_VERSION";
    throw erro;
  }

  let dados = { ...dadosOriginais };
  const migracoes = {
    0: (origem) => ({ ...origem, fichaSchemaVersion: 1 }),
  };

  while (versao < FICHA_SCHEMA_VERSION_ATUAL) {
    const migrar = migracoes[versao];
    if (typeof migrar !== "function") {
      const erro = new Error(
        `Não existe migração para a versão ${versao} da ficha.`,
      );
      erro.code = "UNSUPPORTED_CHARACTER_SHEET_VERSION";
      throw erro;
    }
    dados = migrar(dados);
    versao += 1;
  }

  return dados;
}

function erroValidacaoImportacao(mensagem, codigo) {
  const erro = new Error(mensagem);
  erro.code = codigo;
  return erro;
}

function clonarDadosJsonSeguro(valor, caminho = "$", vistos = new WeakSet()) {
  if (valor === null || typeof valor === "string" || typeof valor === "boolean") {
    return valor;
  }
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;

  if (Array.isArray(valor)) {
    if (vistos.has(valor)) {
      throw erroValidacaoImportacao(
        `A estrutura JSON contém uma referência circular em ${caminho}.`,
        "INVALID_CHARACTER_SHEET_JSON",
      );
    }
    vistos.add(valor);
    const copia = valor.map((item, indice) =>
      clonarDadosJsonSeguro(item, `${caminho}[${indice}]`, vistos),
    );
    vistos.delete(valor);
    return copia;
  }

  if (typeof valor === "object") {
    const prototipo = Object.getPrototypeOf(valor);
    if (prototipo !== Object.prototype && prototipo !== null) {
      throw erroValidacaoImportacao(
        `A estrutura em ${caminho} não é um objeto JSON simples.`,
        "INVALID_CHARACTER_SHEET_JSON",
      );
    }
    if (vistos.has(valor)) {
      throw erroValidacaoImportacao(
        `A estrutura JSON contém uma referência circular em ${caminho}.`,
        "INVALID_CHARACTER_SHEET_JSON",
      );
    }
    vistos.add(valor);
    const copia = {};
    Object.keys(valor).forEach((chave) => {
      const descriptor = Object.getOwnPropertyDescriptor(valor, chave);
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, "value")) {
        throw erroValidacaoImportacao(
          `A propriedade ${caminho}.${chave} não é um valor JSON simples.`,
          "INVALID_CHARACTER_SHEET_JSON",
        );
      }
      Object.defineProperty(copia, chave, {
        value: clonarDadosJsonSeguro(
          descriptor.value,
          `${caminho}.${chave}`,
          vistos,
        ),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    });
    vistos.delete(valor);
    return copia;
  }

  throw erroValidacaoImportacao(
    `O valor em ${caminho} não pode ser representado como JSON.`,
    "INVALID_CHARACTER_SHEET_JSON",
  );
}

function validarEstruturaImportacao(dados) {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    throw erroValidacaoImportacao(
      "O JSON selecionado não contém um objeto de ficha no nível principal.",
      "INVALID_CHARACTER_SHEET_ROOT",
    );
  }

  // XP é um total inteiro acumulado. Fichas legadas exportam esse valor como
  // número ou texto numérico; ambos são aceitos sem converter o payload. Um
  // valor explicitamente inválido é recusado antes de qualquer mutação.
  if (Object.prototype.hasOwnProperty.call(dados, "xp")) {
    const valorXP = dados.xp;
    const textoXP = typeof valorXP === "string" ? valorXP.trim() : "";
    const numeroXP = typeof valorXP === "number" ? valorXP : Number(textoXP);
    // Número JSON pode chegar em notação exponencial (ex.: 1e21) mesmo sendo
    // um inteiro. Não impor teto de jogo; a representação numérica JS segue a
    // precisão nativa de Number.
    const formatoXP =
      typeof valorXP === "number" || /^\+?\d+(?:e[+-]?\d+)?$/i.test(textoXP);
    if (
      !formatoXP ||
      !Number.isFinite(numeroXP) ||
      !Number.isInteger(numeroXP) ||
      numeroXP < 0
    ) {
      throw erroValidacaoImportacao(
        'O campo "xp" deve ser um total inteiro não negativo.',
        "INVALID_XP_VALUE",
      );
    }
  }

  ["armas", "armaduras", "escudos", "outros"].forEach((campo) => {
    if (
      Object.prototype.hasOwnProperty.call(dados, campo) &&
      !Array.isArray(dados[campo])
    ) {
      throw erroValidacaoImportacao(
        `O campo "${campo}" é incompatível: era esperada uma lista de equipamentos.`,
        "INVALID_CHARACTER_SHEET_COLLECTION",
      );
    }

    if (!Array.isArray(dados[campo])) return;
    dados[campo].forEach((item, indice) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw erroValidacaoImportacao(
          `O item ${indice + 1} do campo "${campo}" não é um objeto de equipamento válido.`,
          "INVALID_CHARACTER_SHEET_COLLECTION_ITEM",
        );
      }
      if (
        campo === "escudos" &&
        Object.prototype.hasOwnProperty.call(item, "escudo_nome") &&
        item.escudo_nome !== null &&
        typeof item.escudo_nome !== "string"
      ) {
        throw erroValidacaoImportacao(
          `O campo "escudos[${indice}].escudo_nome" deve ser texto ou null.`,
          "INVALID_CHARACTER_SHEET_COLLECTION_FIELD",
        );
      }
    });
  });

  // O aplicador cria um mapa por `item.id`; rejeitar envelope/item malformado
  // evita que uma entrada ruim seja tratada como coleção vazia e apague cards.
  // Nenhum campo ou contrato de munições é interpretado ou normalizado.
  if (
    Object.prototype.hasOwnProperty.call(dados, "municoes") &&
    !Array.isArray(dados.municoes)
  ) {
    throw erroValidacaoImportacao(
      'O campo "municoes" deve ser uma lista para ser aplicado com segurança.',
      "INVALID_CHARACTER_SHEET_COLLECTION",
    );
  }
  if (Array.isArray(dados.municoes)) {
    dados.municoes.forEach((item, indice) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw erroValidacaoImportacao(
          `O item ${indice + 1} do campo "municoes" não pode ser processado pela ficha.`,
          "INVALID_CHARACTER_SHEET_COLLECTION_ITEM",
        );
      }
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, "historiaDiarioAventura") &&
    !Array.isArray(dados.historiaDiarioAventura)
  ) {
    throw erroValidacaoImportacao(
      'O campo "historiaDiarioAventura" deve ser uma lista de eventos.',
      "INVALID_CHARACTER_SHEET_COLLECTION",
    );
  }
  if (Array.isArray(dados.historiaDiarioAventura)) {
    dados.historiaDiarioAventura.forEach((evento, indice) => {
      if (
        !evento ||
        typeof evento !== "object" ||
        Array.isArray(evento) ||
        (Object.getPrototypeOf(evento) !== Object.prototype &&
          Object.getPrototypeOf(evento) !== null)
      ) {
        throw erroValidacaoImportacao(
          `O evento ${indice + 1} de "historiaDiarioAventura" deve ser um objeto simples.`,
          "INVALID_CHARACTER_SHEET_COLLECTION_ITEM",
        );
      }
      // O consumidor existente converte titulo/texto com String(...). Manter
      // essa coerção preserva compatibilidade com os formatos legados.
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, "estadoCombate") &&
    dados.estadoCombate !== null &&
    (typeof dados.estadoCombate !== "object" || Array.isArray(dados.estadoCombate))
  ) {
    throw erroValidacaoImportacao(
      'O campo "estadoCombate" deve ser um objeto ou null.',
      "INVALID_CHARACTER_SHEET_FIELD",
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, "configFicha") &&
    dados.configFicha !== null &&
    (typeof dados.configFicha !== "object" || Array.isArray(dados.configFicha))
  ) {
    throw erroValidacaoImportacao(
      'O campo "configFicha" deve ser um objeto ou null.',
      "INVALID_CHARACTER_SHEET_FIELD",
    );
  }
  if (
    dados.configFicha &&
    Object.prototype.hasOwnProperty.call(dados.configFicha, "custom") &&
    dados.configFicha.custom !== null &&
    (typeof dados.configFicha.custom !== "object" || Array.isArray(dados.configFicha.custom))
  ) {
    throw erroValidacaoImportacao(
      'O campo "configFicha.custom" deve ser um objeto ou null.',
      "INVALID_CHARACTER_SHEET_FIELD",
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, "talentosEstruturados") &&
    dados.talentosEstruturados !== null &&
    (typeof dados.talentosEstruturados !== "object" || Array.isArray(dados.talentosEstruturados))
  ) {
    throw erroValidacaoImportacao(
      'O campo "talentosEstruturados" deve ser um objeto ou null.',
      "INVALID_CHARACTER_SHEET_FIELD",
    );
  }
  if (dados.talentosEstruturados && typeof TALENTOS_CONFIG === "object") {
    Object.entries(TALENTOS_CONFIG).forEach(([categoria]) => {
      const chave = `talentosEstruturados.${categoria}`;
      const valor = dados.talentosEstruturados[categoria];
      validarColecaoTalentosImportacao(valor, chave);
    });
  }
  if (typeof TALENTOS_CONFIG === "object") {
    Object.entries(TALENTOS_CONFIG).forEach(([categoria, config]) => {
      if (!Object.prototype.hasOwnProperty.call(dados, config.campoId)) return;
      validarColecaoTalentosImportacao(dados[config.campoId], config.campoId);
    });
  }
}

function validarColecaoTalentosImportacao(valor, caminho) {
  if (valor === undefined || valor === null || typeof valor === "string") return;
  if (!Array.isArray(valor)) {
    throw erroValidacaoImportacao(
      `O campo "${caminho}" deve ser texto, lista ou null.`,
      "INVALID_CHARACTER_SHEET_FIELD",
    );
  }
  valor.forEach((item, indice) => {
    if (
      item === null ||
      (typeof item !== "string" &&
        (typeof item !== "object" || Array.isArray(item)))
    ) {
      throw erroValidacaoImportacao(
        `O item ${indice + 1} de "${caminho}" deve ser texto ou objeto.`,
        "INVALID_CHARACTER_SHEET_FIELD",
      );
    }
  });
}

function prepararImportacaoFicha(entrada) {
  try {
    let objeto;
    if (typeof entrada === "string") {
      try {
        objeto = JSON.parse(entrada);
      } catch (erro) {
        throw erroValidacaoImportacao(
          "O arquivo selecionado não contém JSON válido. Confira o arquivo e tente novamente.",
          "INVALID_CHARACTER_SHEET_JSON",
        );
      }
    } else {
      objeto = entrada;
    }

    if (!objeto || typeof objeto !== "object" || Array.isArray(objeto)) {
      throw erroValidacaoImportacao(
        "O JSON selecionado não contém um objeto de ficha no nível principal.",
        "INVALID_CHARACTER_SHEET_ROOT",
      );
    }

    const dadosIsolados = clonarDadosJsonSeguro(objeto);
    validarEstruturaImportacao(dadosIsolados);
    const dadosPreparados = normalizarDadosImportacao(dadosIsolados, {
      preparacaoPura: true,
    });
    validarEstruturaImportacao(dadosPreparados);
    return dadosPreparados;
  } catch (erro) {
    if (erro && typeof erro === "object") erro.stage = "preparacao";
    throw erro;
  }
}

function normalizarDadosImportacao(dadosOriginais, opcoes = {}) {
  if (!dadosOriginais || typeof dadosOriginais !== "object") return {};

  const dados = migrarDadosFicha(dadosOriginais);
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

  // Os seis atributos de salvaguarda são entradas numéricas com mínimo 0 no
  // formulário. Aceitamos o formato numérico em texto já exportado pela ficha,
  // sem converter o valor nem estabelecer um máximo que o controle não define.
  const validarAtributoImportado = (chave) => {
    if (!Object.prototype.hasOwnProperty.call(dados, chave)) return;
    const valor = dados[chave];
    if (valor === null || valor === "") return;

    const texto = typeof valor === "string" ? valor.trim() : String(valor);
    // Os inputs numéricos usam o step padrão inteiro; decimais e expoentes
    // seriam reinterpretados incorretamente por preencherCampo(parseInt).
    const formatoNumerico = /^[+-]?\d+$/;
    const numero = typeof valor === "number" ? valor : Number(texto);
    if (
      (typeof valor !== "number" && typeof valor !== "string") ||
      !formatoNumerico.test(texto) ||
      !Number.isFinite(numero) ||
      numero < 0
    ) {
      const erro = new Error(
        `O campo "${chave}" deve ser um valor numérico não negativo.`,
      );
      erro.code = "INVALID_NUMERIC_FIELD";
      throw erro;
    }
  };

  ["atrib_for", "atrib_des", "atrib_con", "atrib_int", "atrib_sab", "atrib_car"]
    .forEach(validarAtributoImportado);

  Object.keys(dados)
    .filter((chave) => /^pericia[A-Za-z]+Estado$/.test(chave))
    .forEach((chave) => {
      const valor = dados[chave];
      const texto = typeof valor === "string" ? valor.trim() : String(valor);
      if (!/^[0-3]$/.test(texto)) {
        const erro = new Error(
          `O campo "${chave}" deve ser um estado inteiro entre 0 e 3.`,
        );
        erro.code = "INVALID_SKILL_PROFICIENCY_STATE";
        throw erro;
      }
      dados[chave] = Number(texto);
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

    if (possuiRest && dados[campoRest] !== null && dados[campoRest] !== "") {
      const atual = parseContadorEspacoMagia(dados[campoRest]);
      if (atual === null) {
        const erro = new Error(
          `O campo "${campoRest}" deve ser um inteiro não negativo.`,
        );
        erro.code = "INVALID_MAGIC_SLOTS";
        throw erro;
      }
    }

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

  if (opcoes.preparacaoPura) {
    if (
      dados.talentosEstruturados &&
      typeof prepararTalentosImportacao === "function"
    ) {
      dados.talentosEstruturados = prepararTalentosImportacao(dados);
    } else if (
      !Object.prototype.hasOwnProperty.call(dados, "talentosEstruturados") &&
      typeof TALENTOS_CONFIG === "object" &&
      Object.values(TALENTOS_CONFIG).some((config) =>
        Object.prototype.hasOwnProperty.call(dados, config.campoId),
      ) &&
      typeof prepararTalentosImportacao === "function"
    ) {
      dados.talentosEstruturados = prepararTalentosImportacao(dados);
    }
  } else if (
    !dados.talentosEstruturados ||
    typeof dados.talentosEstruturados !== "object"
  ) {
    dados.talentosEstruturados = montarTalentosEstruturados(dados);
  }

  if (!opcoes.preparacaoPura) {
    dados.configFicha = normalizarConfigFicha(dados.configFicha);
  }

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

function campoEhPersistenteDaFicha(campo) {
  if (!campo || !campo.id) return false;
  if (campo.type === "file" || campo.id === "importarFichaInput") return false;
  if (["modalIniciativaDado", "modalPosicaoIniciativa"].includes(campo.id)) {
    return false;
  }
  if (
    campo.closest(
      "#armaduraSelecaoOverlay, #armaduraModalOverlay, .modal-overlay-base, [role='dialog']",
    )
  ) {
    return false;
  }
  return true;
}

function carregarFicha(personagem) {
  return aplicarDadosFicha(personagem);
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
    if (!campoEhPersistenteDaFicha(campo)) return;
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
// O baseline de alterações pendentes é independente de backups e exportações.
// E1.6 implementará o backup local; até lá, null significa que não há backup local.
let ultimoBackupLocalFicha = null;
let ultimaExportacaoSolicitadaFicha = null;

function registrarUltimoBackupLocalFicha(backup) {
  ultimoBackupLocalFicha = backup && typeof backup === "object"
    ? { ...backup }
    : null;
}
window.__registrarUltimoBackupLocalFicha = registrarUltimoBackupLocalFicha;

function capturarBaselineImportacaoFicha() {
  return ultimoEstadoSalvo;
}

function restaurarBaselineImportacaoFicha(baseline) {
  if (typeof baseline !== "string") {
    throw new TypeError("O baseline da ficha não pode ser restaurado.");
  }
  ultimoEstadoSalvo = baseline;
}

function marcarFichaComoSalva() {
  // Atualiza o baseline conhecido da sessão. Isto não confirma download nem cria backup.
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
  const epochInicializacao = window.__fichaImportacaoEpoch || 0;
  const atualizarReferenciaInicial = () => {
    const inicializacaoAindaAtual =
      (window.__fichaImportacaoEpoch || 0) === epochInicializacao &&
      !window.__fichaImportacaoTransacaoAtiva;
    if (!houveInteracaoDuranteInicializacaoFicha && inicializacaoAindaAtual) {
      marcarFichaComoSalva();
    }
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

function obterEstadoPersistenciaFicha() {
  return {
    alteracoesPendentes: fichaFoiAlterada(),
    ultimoBackupLocal: ultimoBackupLocalFicha
      ? { ...ultimoBackupLocalFicha }
      : null,
    ultimaExportacaoSolicitada: ultimaExportacaoSolicitadaFicha
      ? { ...ultimaExportacaoSolicitadaFicha }
      : null,
  };
}
window.obterEstadoPersistenciaFicha = obterEstadoPersistenciaFicha;

function atualizarStatusExportacao(mensagem) {
  const status = document.getElementById("exportacaoStatus");
  if (status) {
    status.textContent = mensagem;
    status.hidden = false;
  }
}

function limparStatusExportacaoAposImportacaoValida() {
  // A solicitação anterior pertencia ao personagem substituído. Só chamar após
  // o commit da importação; rollback mantém a mensagem e seu estado intactos.
  ultimaExportacaoSolicitadaFicha = null;
  try {
    const status = document.getElementById("exportacaoStatus");
    if (status) {
      status.textContent = "";
      status.hidden = true;
    }
    return true;
  } catch (erro) {
    console.warn("Não foi possível limpar o aviso da exportação anterior:", erro);
    return false;
  }
}
window.__limparStatusExportacaoAposImportacaoValida =
  limparStatusExportacaoAposImportacaoValida;

function coletarSnapshotPersistenteFicha() {
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
  dados.municoes = typeof coletarMunicoes === "function" ? coletarMunicoes() : [];
  dados.outros = coletarOutros().filter(outro => String(outro.outro_tipo || "").toLowerCase() !== "municao");
  if (typeof sincronizarMunicoesNaFicha === "function") dados.outros.push(...sincronizarMunicoesNaFicha(dados.municoes));
  dados.armaduraEquipadaIndice = armaduraEquipadaIndice;
  // Marca somente os dados atuais coletados; não reexecuta migrações legadas.
  dados.fichaSchemaVersion = FICHA_SCHEMA_VERSION_ATUAL;
  return dados;
}
window.coletarSnapshotPersistenteFicha = coletarSnapshotPersistenteFicha;

/* SALVAR Ficha*/
function salvarFicha() {
  let urlTemporaria = null;
  let timerRevogacaoUrl = null;
  let cliqueExecutado = false;
  let nomeArquivoSolicitado = null;
  try {
    // Preparar uma única captura: mudanças após esta captura continuam pendentes.
    const dados = coletarSnapshotPersistenteFicha();
    const nome = document.getElementById("nomePersonagem").value || "Personagem";
    const jogador = document.getElementById("jogador").value || "Jogador";
    const hoje = new Date();
    const data =
      hoje.getFullYear().toString() +
      String(hoje.getMonth() + 1).padStart(2, "0") +
      String(hoje.getDate()).padStart(2, "0");
    const nomeArquivo = `${nome}_${jogador}_${data}.json`.replace(/\s+/g, "_");
    nomeArquivoSolicitado = nomeArquivo;
    const conteudo = JSON.stringify(dados, null, 2);
    const blob = new Blob([conteudo], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    urlTemporaria = url;
    // A revogação é deliberadamente adiada para tolerar o início assíncrono do download.
    // Isso não confirma que o usuário salvou o arquivo.
    timerRevogacaoUrl = setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch (erroLiberacao) {
        console.error("Não foi possível liberar a URL temporária da exportação:", erroLiberacao);
      }
    }, 5000);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    cliqueExecutado = true;

    // O navegador não fornece confirmação confiável de gravação/cancelamento.
    // Registrar somente que a solicitação foi iniciada; não limpar o baseline.
    ultimaExportacaoSolicitadaFicha = {
      solicitadaEm: new Date().toISOString(),
      nomeArquivo,
    };
    atualizarStatusExportacao(
      "Exportação solicitada ao navegador. Confirme se o arquivo foi salvo.",
    );
    return { ok: true, estado: "solicitada", nomeArquivo };
  } catch (erro) {
    if (cliqueExecutado) {
      // O navegador pode já ter iniciado a solicitação; não a descreva como cancelada
      // nem invalide o Blob por uma falha posterior de interface/registro.
      ultimaExportacaoSolicitadaFicha = {
        solicitadaEm: new Date().toISOString(),
        nomeArquivo: nomeArquivoSolicitado,
      };
      try {
        atualizarStatusExportacao(
          "A exportação pode ter sido solicitada ao navegador. Confirme se o arquivo foi salvo.",
        );
      } catch (erroStatus) {
        console.error("Não foi possível atualizar o status após solicitar a exportação:", erroStatus);
      }
      console.error("Falha após iniciar a solicitação de exportação da ficha:", erro);
      return { ok: true, estado: "solicitacao_iniciada_com_erro", nomeArquivo: nomeArquivoSolicitado };
    }
    if (timerRevogacaoUrl !== null) clearTimeout(timerRevogacaoUrl);
    if (urlTemporaria) {
      try {
        URL.revokeObjectURL(urlTemporaria);
      } catch (erroLiberacao) {
        console.error("Não foi possível liberar a URL temporária da exportação:", erroLiberacao);
      }
    }
    console.error("Não foi possível preparar ou solicitar a exportação da ficha:", erro);
    atualizarStatusExportacao(
      "Não foi possível iniciar a exportação. As alterações pendentes foram preservadas.",
    );
    return { ok: false, estado: "falhou", erro };
  }
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

async function processarImportacao(conteudo, aoFinalizar) {
  let resultado;
  try {
    await aguardarRenderizacaoModalImportacao();

    const dados = prepararImportacaoFicha(conteudo);
    if (typeof aplicarDadosFicha !== "function") {
      const erro = new Error("A função de aplicação da ficha não está disponível.");
      erro.code = "CHARACTER_SHEET_APPLIER_UNAVAILABLE";
      throw erro;
    }

    // Toda preparação/validação termina antes do aplicador. Falhas posteriores
    // pertencem ao rollback transacional planejado para E1.4.
    const aplicado = await aplicarDadosFicha(dados, {
      preparado: true,
      transacional: true,
    });
    if (aplicado !== true) {
      const erro = new Error("A ficha não foi aplicada.");
      erro.code = "CHARACTER_SHEET_APPLY_NOT_COMPLETED";
      throw erro;
    }
    resultado = {
      tipo: "sucesso",
      mensagem: "Ficha importada com sucesso!",
    };
  } catch (erro) {
    console.error("Erro durante a importação da ficha:", erro);
    let mensagem = erro?.message || "Ocorreu um erro ao importar a ficha.";
    const rollbackAplicacaoVerificado =
      erro?.code === "CHARACTER_SHEET_APPLY_FAILED_ROLLED_BACK" &&
      erro?.snapshotRestored === true &&
      erro?.snapshotVerification?.valido === true &&
      erro?.rollbackComplete === true;
    if (
      erro?.stage === "preparacao" ||
      erro?.code === "CHARACTER_SHEET_APPLIER_UNAVAILABLE" ||
      erro?.code === "CHARACTER_SHEET_SNAPSHOT_FAILED" ||
      erro?.code === "CHARACTER_SHEET_IMPORT_BUSY"
    ) {
      // Essas rejeições ocorrem antes de a ficha ser aplicada.
    } else if (rollbackAplicacaoVerificado) {
      mensagem =
        "A importação falhou, mas a ficha anterior e seu estado de alterações foram restaurados.";
    } else if (erro?.code === "CHARACTER_SHEET_ROLLBACK_FAILED") {
      mensagem =
        "A importação falhou e a recuperação da ficha ficou incompleta. O estado pode estar parcialmente alterado; confira os dados antes de continuar.";
    } else if (erro?.code === "CHARACTER_SHEET_ROLLBACK_UNVERIFIED") {
      mensagem = erro?.postReconciliationVerification?.valido === true &&
        erro?.postReconciliationVerification?.sentinelasDeListaConfirmados === true
        ? "A importação falhou; os dados persistentes coincidiram após a verificação e os sentinelas das listas-alvo executaram (isso não comprova que todos os observers ou writers estejam registrados ou drenados). Timers, integrações externas ou estados privados ainda impedem confirmar recuperação integral. Confira os dados antes de continuar."
        : erro?.postReconciliationVerification?.valido === true &&
          erro?.postReconciliationVerification?.janelaEstabilidadeObservada === true
          ? "A importação falhou; os dados persistentes coincidiram durante a janela observada, mas os observers conhecidos não foram confirmados. Confira os dados antes de continuar."
          : "A importação falhou e a restauração pós-reconciliação não foi comprovada. Confira os dados antes de continuar.";
    } else {
      mensagem =
        "Ocorreu uma falha durante a aplicação da ficha. A atualização pode ter sido parcial; confira os dados antes de continuar.";
    }
    resultado = {
      tipo: "erro",
      mensagem,
      codigo: erro?.code || null,
      recuperacao:
        rollbackAplicacaoVerificado
          ? "restaurada"
          : erro?.code === "CHARACTER_SHEET_ROLLBACK_FAILED"
            ? "incompleta"
            : erro?.code === "CHARACTER_SHEET_ROLLBACK_UNVERIFIED"
              ? "snapshot_restaurado_com_limite_async"
            : erro?.code === "CHARACTER_SHEET_SNAPSHOT_FAILED"
              ? "nao_iniciada"
              : "nao_confirmada",
      rollbackComplete:
        rollbackAplicacaoVerificado
          ? true
          : erro?.code === "CHARACTER_SHEET_ROLLBACK_FAILED"
            ? false
            : erro?.code === "CHARACTER_SHEET_ROLLBACK_UNVERIFIED"
              ? false
            : null,
      snapshotRestored: erro?.snapshotRestored === true,
      verificacaoSnapshot: erro?.snapshotVerification || null,
      verificacaoPosReconciliacao: erro?.postReconciliationVerification || null,
      tarefasAssincronasNaoCercadas: erro?.unfencedAsyncWriters || [],
      erroAplicacao: erro?.applicationError?.message || null,
      errosRestauracao: Array.isArray(erro?.restorationErrors)
        ? erro.restorationErrors.map((erroRestauracao) =>
            String(erroRestauracao?.message || erroRestauracao),
          )
        : [],
    };
  } finally {
    await aguardarTempoMinimoModalImportacao();
    if (resultado) mostrarResultadoImportacao(resultado.tipo, resultado.mensagem);
    if (typeof aoFinalizar === "function") {
      try {
        aoFinalizar(resultado);
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
