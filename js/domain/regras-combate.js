// Regras puras de combate D&D 5e (2014). Este módulo não lê nem altera DOM,
// armazenamento, histórico ou estado persistente da ficha.
const RegrasCombate = Object.freeze({
  normalizarContextoAcao(contexto) {
    const mapa = { action: "action", bonusAction: "bonusAction", reaction: "reaction", "Ação": "action", "Ação bônus": "bonusAction", "Reação": "reaction" };
    return mapa[contexto] || null;
  },
  converterDeslocamentoParaPes(texto) {
    if (typeof texto !== "string" && typeof texto !== "number") return null;
    const valorMatch = String(texto).trim().match(/\d+(?:[.,]\d+)?/);
    if (!valorMatch) return null;
    const valor = Number(valorMatch[0].replace(",", "."));
    if (!Number.isFinite(valor) || valor < 0) return null;
    const unidadePes = /(?:ft|feet|pé|pes)\b/i.test(String(texto));
    const pes = unidadePes ? valor : valor * 3.280839895;
    return Math.round(pes);
  },

  criarRecursosTurno({ rodada = 1, movimentoTotal = 30, limites = {}, ajustesTemporarios = {}, ataquesAcaoRestantes = 0 } = {}) {
    const validar = (valor, minimo = 0) => Number.isInteger(valor) && valor >= minimo && valor <= 20;
    const limitesNormalizados = {
      acao: limites.acao ?? 1,
      acaoBonus: limites.acaoBonus ?? 1,
      reacao: limites.reacao ?? 1,
      ataquesPorAcao: limites.ataquesPorAcao ?? 1,
    };
    const ajustesNormalizados = {
      acao: ajustesTemporarios.acao ?? 0,
      acaoBonus: ajustesTemporarios.acaoBonus ?? 0,
      reacao: ajustesTemporarios.reacao ?? 0,
      ataquesPorAcao: ajustesTemporarios.ataquesPorAcao ?? 0,
    };
    if (!Number.isInteger(rodada) || rodada < 1 || !Number.isInteger(movimentoTotal) || movimentoTotal < 0 || !Number.isInteger(ataquesAcaoRestantes) || ataquesAcaoRestantes < 0 ||
        !validar(limitesNormalizados.acao, 1) || !validar(limitesNormalizados.acaoBonus, 1) || !validar(limitesNormalizados.reacao, 1) || !validar(limitesNormalizados.ataquesPorAcao, 1) ||
        !Object.values(ajustesNormalizados).every((valor) => validar(valor, -20))) return null;
    return { rodada, acaoUsada: false, acaoBonusUsada: false, reacaoUsada: false, gastos: { acao: 0, acaoBonus: 0, reacao: 0 }, limites: limitesNormalizados, ajustesTemporarios: ajustesNormalizados, movimentoTotal, movimentoGasto: 0, ataqueDuasArmasElegivel: false, maoAtaqueQualificador: null, maosAtaqueQualificadoras: [], ataqueAcaoIniciado: false, ataquesAcaoRestantes };
  },

  calcularRecuperacaoDadosVidaDescansoLongo(total, restantes) {
    if (!Number.isInteger(total) || !Number.isInteger(restantes) || total < 0 || restantes < 0 || restantes > total) return null;
    return Math.min(total - restantes, Math.max(1, Math.floor(total / 2)));
  },

  calcularEspacosPactoBruxo(nivel) {
    if (!Number.isInteger(nivel) || nivel < 1 || nivel > 20) return null;
    return {
      nivelEspaco: Math.min(5, Math.floor((nivel + 1) / 2)),
      quantidade: nivel === 1 ? 1 : nivel <= 10 ? 2 : nivel <= 16 ? 3 : 4,
    };
  },

  calcularCuraDescansoCurto({ resultados, faces, modificadorConstituicao, pvAtuais, pvMaximos }) {
    if (!Array.isArray(resultados) || !Number.isInteger(faces) || faces < 4 || faces > 20 ||
        !Number.isInteger(modificadorConstituicao) || !Number.isInteger(pvAtuais) ||
        !Number.isInteger(pvMaximos) || pvAtuais < 0 || pvMaximos < pvAtuais ||
        resultados.some((valor) => !Number.isInteger(valor) || valor < 1 || valor > faces)) return null;
    // A errata do PHB 2014 limita a zero o total recuperado no descanso,
    // depois de somar cada dado e o modificador de Constituição.
    const curaBruta = Math.max(0, resultados.reduce((soma, valor) => soma + valor + modificadorConstituicao, 0));
    return { curaBruta, curaAplicada: Math.min(curaBruta, pvMaximos - pvAtuais), pvDepois: Math.min(pvMaximos, pvAtuais + curaBruta) };
  },

  consumirAcaoTurno(recursos, contextoAcao, { ataqueQualificadorDuasArmas = false, maoAtaqueQualificador = null, maoAtaqueBonus = null, ataqueDeArma = false, ataqueAdicional = false } = {}) {
    const contexto = this.normalizarContextoAcao(contextoAcao);
    if (!recursos || !contexto ||
        !["acaoUsada", "acaoBonusUsada", "reacaoUsada", "ataqueDuasArmasElegivel", "ataqueAcaoIniciado"].every((chave) => typeof recursos[chave] === "boolean") ||
        ![null, 1, 2].includes(recursos.maoAtaqueQualificador) || !Number.isInteger(recursos.ataquesAcaoRestantes) || recursos.ataquesAcaoRestantes < 0) return null;
    const maosQualificadoras = Array.isArray(recursos.maosAtaqueQualificadoras)
      ? recursos.maosAtaqueQualificadoras
      : recursos.maoAtaqueQualificador === null ? [] : [recursos.maoAtaqueQualificador];
    if (!maosQualificadoras.every((mao) => mao === 1 || mao === 2) || new Set(maosQualificadoras).size !== maosQualificadoras.length) return null;
    const atualizarQualificadoras = (mao) => {
      const maos = ataqueQualificadorDuasArmas && (mao === 1 || mao === 2) && !maosQualificadoras.includes(mao)
        ? [...maosQualificadoras, mao]
        : maosQualificadoras;
      return { ataqueDuasArmasElegivel: maos.length > 0, maoAtaqueQualificador: maos[0] ?? null, maosAtaqueQualificadoras: maos };
    };
    const chave = contexto === "action" ? "acaoUsada" : contexto === "bonusAction" ? "acaoBonusUsada" : "reacaoUsada";
    if (contexto === "action" && ataqueAdicional && ataqueDeArma && recursos.ataqueAcaoIniciado && recursos.ataquesAcaoRestantes > 0) {
      return { ...recursos, ataquesAcaoRestantes: recursos.ataquesAcaoRestantes - 1, ...atualizarQualificadoras(maoAtaqueQualificador) };
    }
    const tipoSaldo = contexto === "action" ? "acao" : contexto === "bonusAction" ? "acaoBonus" : "reacao";
    const limite = (recursos.limites?.[tipoSaldo] ?? 1) + (recursos.ajustesTemporarios?.[tipoSaldo] ?? 0);
    const gastos = { acao: recursos.acaoUsada ? 1 : 0, acaoBonus: recursos.acaoBonusUsada ? 1 : 0, reacao: recursos.reacaoUsada ? 1 : 0, ...(recursos.gastos || {}) };
    if (gastos[tipoSaldo] >= Math.max(0, limite) || (contexto === "bonusAction" && ataqueQualificadorDuasArmas && (!recursos.acaoUsada || !recursos.ataqueDuasArmasElegivel || !maosQualificadoras.some((mao) => mao !== maoAtaqueBonus)))) return null;
    if (contexto === "action" && ataqueQualificadorDuasArmas && ![1, 2].includes(maoAtaqueQualificador)) return null;
    gastos[tipoSaldo] += 1;
    const ataquesPorAcao = Math.max(1, (recursos.limites?.ataquesPorAcao ?? 1) + (recursos.ajustesTemporarios?.ataquesPorAcao ?? 0));
    const ataquesAcaoRestantes = contexto === "action" && ataqueDeArma
      ? Math.max(ataquesPorAcao - 1, recursos.ataquesAcaoRestantes)
      : contexto === "action" ? 0 : recursos.ataquesAcaoRestantes;
    return { ...recursos, gastos, [chave]: true, ataqueAcaoIniciado: recursos.ataqueAcaoIniciado || (contexto === "action" && ataqueDeArma), ataquesAcaoRestantes, ...atualizarQualificadoras(contexto === "action" ? maoAtaqueQualificador : null) };
  },

  consumirMovimentoTurno(recursos, distancia) {
    if (!recursos || !Number.isInteger(recursos.movimentoTotal) || !Number.isInteger(recursos.movimentoGasto) || !Number.isInteger(distancia) || distancia < 0 || recursos.movimentoGasto + distancia > recursos.movimentoTotal) return null;
    return { ...recursos, movimentoGasto: recursos.movimentoGasto + distancia };
  },

  calcularTotalD20(dado, modificadores = []) {
    if (!Number.isInteger(dado) || dado < 1 || dado > 20) return null;
    const valores = Array.isArray(modificadores) ? modificadores : [modificadores];
    if (!valores.every(Number.isFinite)) return null;
    return dado + valores.reduce((soma, valor) => soma + valor, 0);
  },

  classificarModosAtaqueArma({ modo, propriedades = [] } = {}) {
    const normalizar = (valor) => String(valor || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const modoNormalizado = normalizar(modo).replace(/[_\s]+/g, "-");
    const ehDistancia = modoNormalizado.includes("distancia");
    const ehCorpoACorpo = modoNormalizado.includes("corpo-a-corpo");
    const lista = Array.isArray(propriedades) ? propriedades : Object.entries(propriedades || {}).filter(([, ativo]) => !!ativo).map(([nome]) => nome);
    const temArremesso = lista.some((item) => normalizar(item) === "arremesso");
    if (ehDistancia) return temArremesso ? ["arremesso"] : ["distancia"];
    if (ehCorpoACorpo) return temArremesso ? ["corpo-a-corpo", "arremesso"] : ["corpo-a-corpo"];
    return [];
  },

  calcularBonusDanoEfetivo({ modificador, origem = "arma", tipoAcao = "Ação", contextoAcao = null, ataqueSecundarioDuasArmas = false, permiteModificadorPositivo = false }) {
    const contexto = this.normalizarContextoAcao(contextoAcao || tipoAcao);
    if (!Number.isFinite(modificador) || typeof origem !== "string" || !contexto) return null;
    if (origem === "magia") return modificador;
    if (contexto === "bonusAction") {
      // A exceção vale apenas para o ataque bônus de Two-Weapon Fighting.
      // Outras ações bônus e ataques de reação na offHand preservam o dano normal.
      return ataqueSecundarioDuasArmas && !permiteModificadorPositivo
        ? Math.min(0, modificador)
        : modificador;
    }
    return modificador;
  },

  avaliarEquipamentoMaoSecundaria({ armaPrincipal = null, modoMaoPrincipal = "uma_mao", equipamentoSecundario = null } = {}) {
    if (!equipamentoSecundario) return { valido: true, motivo: "" };
    const principal = armaPrincipal?.item || armaPrincipal;
    const secundaria = equipamentoSecundario?.item || equipamentoSecundario;
    const tipoSecundario = String(equipamentoSecundario?.tipo || equipamentoSecundario?.equipamentoTipo || secundaria?.tipo || "arma").toLowerCase();
    const ehEscudo = tipoSecundario === "escudo";
    const propsPrincipal = principal?.propriedades || {};
    const propsSecundaria = secundaria?.propriedades || {};
    const chavePrincipal = armaPrincipal?.chaveItem || armaPrincipal?.id || principal?.id;
    const chaveSecundaria = equipamentoSecundario?.chaveItem || equipamentoSecundario?.id || secundaria?.id;
    const descricaoSecundaria = String(secundaria?.descricaoEspecial || secundaria?.descricao_especial || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const exigeDuasMaos = !!propsSecundaria.duas_maos || /(?:precisa|deve|requer).{0,70}(?:empunhar|usar).{0,45}duas maos/.test(descricaoSecundaria);
    if (chavePrincipal && chaveSecundaria && chavePrincipal === chaveSecundaria) {
      return { valido: false, motivo: "O mesmo item não pode ocupar as duas mãos." };
    }
    const descricaoPrincipal = String(principal?.descricaoEspecial || principal?.descricao_especial || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const principalExigeDuasMaos = /(?:precisa|deve|requer).{0,70}(?:empunhar|usar).{0,45}duas maos/.test(descricaoPrincipal);
    if (modoMaoPrincipal === "duas_maos" || !!propsPrincipal.duas_maos || principalExigeDuasMaos) {
      return { valido: false, motivo: "A arma principal ocupa as duas mãos." };
    }
    if (!ehEscudo && exigeDuasMaos) {
      return { valido: false, motivo: "Esta arma exige as duas mãos." };
    }
    // Dual Wielder altera a elegibilidade do ataque com duas armas, não permite
    // empunhar uma arma de duas mãos com apenas uma mão.
    return { valido: true, motivo: "" };
  },

  avaliarAtaqueBonusDuasArmas({ recursosTurno, armaPrincipal, armaSecundaria, escudoNaSecundaria = false, armaSecundariaEquipavel = true, permiteArmasNaoLeves = false } = {}) {
    const gastos = { acao: recursosTurno?.acaoUsada ? 1 : 0, acaoBonus: recursosTurno?.acaoBonusUsada ? 1 : 0, ...(recursosTurno?.gastos || {}) };
    const limiteBonus = Math.max(0, (recursosTurno?.limites?.acaoBonus ?? 1) + (recursosTurno?.ajustesTemporarios?.acaoBonus ?? 0));
    if (gastos.acaoBonus >= limiteBonus) return { estado: "utilizado", motivo: "Ação bônus já utilizada." };
    if (!armaSecundariaEquipavel) return { estado: "bloqueado", motivo: "Arma secundária incompatível com a mão principal." };
    if (escudoNaSecundaria) return { estado: "bloqueado", motivo: "Há um escudo na mão secundária." };
    if (!recursosTurno?.ataqueDuasArmasElegivel || !recursosTurno?.ataqueAcaoIniciado) {
      return { estado: "bloqueado", motivo: "Falta realizar a ação Atacar qualificante." };
    }
    if (!armaSecundaria) return { estado: "bloqueado", motivo: "Nenhuma arma elegível na mão secundária." };
    const modoSecundaria = String(armaSecundaria.modo || armaSecundaria.arma_modo || armaSecundaria.arma_tipo || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (modoSecundaria.includes("distancia")) return { estado: "bloqueado", motivo: "A arma secundária precisa ser corpo a corpo." };
    if (!this.ehArmaElegivelDuasArmas({ armaPrincipal, armaSecundaria, permiteArmasNaoLeves })) {
      return { estado: "bloqueado", motivo: "As armas não atendem aos requisitos de Two-Weapon Fighting." };
    }
    const maos = Array.isArray(recursosTurno.maosAtaqueQualificadoras) ? recursosTurno.maosAtaqueQualificadoras : [recursosTurno.maoAtaqueQualificador].filter(Boolean);
    const slotSecundario = armaSecundaria.slot;
    if (!maos.some((mao) => mao !== slotSecundario)) return { estado: "bloqueado", motivo: "O ataque bônus deve usar a arma da outra mão." };
    return { estado: "disponivel", motivo: "" };
  },

  ehArmaElegivelDuasArmas({ armaPrincipal, armaSecundaria, permiteArmasNaoLeves = false } = {}) {
    const propriedades = (arma) => arma?.propriedades || {};
    const modo = (arma) => String(arma?.modo || arma?.arma_modo || arma?.arma_tipo || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const ehCorpoACorpo = (arma) => modo(arma).includes("corpo a corpo") || modo(arma).includes("corpo-a-corpo");
    const ehUmaMao = (arma) => !propriedades(arma).duas_maos;
    const especialExigeDuasMaos = (arma) => {
      const descricao = String(arma?.descricaoEspecial || arma?.descricao_especial || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return /(?:precisa|deve|requer).{0,70}(?:empunhar|usar).{0,45}duas maos/.test(descricao);
    };
    if (!armaPrincipal || !armaSecundaria || !ehCorpoACorpo(armaPrincipal) || !ehCorpoACorpo(armaSecundaria)) return false;
    if (!ehUmaMao(armaPrincipal) || !ehUmaMao(armaSecundaria) || especialExigeDuasMaos(armaPrincipal) || especialExigeDuasMaos(armaSecundaria)) return false;
    return permiteArmasNaoLeves || (!!propriedades(armaPrincipal).leve && !!propriedades(armaSecundaria).leve);
  },

  calcularPVDepoisDeDano({ pvAtuais, pvTemporarios, dano }) {
    if (![pvAtuais, pvTemporarios, dano].every(Number.isInteger) ||
        pvAtuais < 0 || pvTemporarios < 0 || dano < 0) return null;
    const danoEmTemporarios = Math.min(pvTemporarios, dano);
    const excedente = dano - danoEmTemporarios;
    return {
      pvAtuais: Math.max(0, pvAtuais - excedente),
      pvTemporarios: pvTemporarios - danoEmTemporarios,
      danoEmTemporarios,
      danoEmPV: Math.min(pvAtuais, excedente),
      danoExcedente: Math.max(0, excedente - pvAtuais),
    };
  },

  calcularPVDepoisDeCura({ pvAtuais, pvMaximos, cura }) {
    if (![pvAtuais, pvMaximos, cura].every(Number.isInteger) ||
        pvAtuais < 0 || pvMaximos < 0 || cura < 0) return null;
    return {
      pvAtuais: Math.min(pvMaximos, pvAtuais + cura),
      curaAplicada: Math.max(0, Math.min(cura, pvMaximos - pvAtuais)),
    };
  },

  resolverDanoTipado({ quantidade, tipo, origem, imunidades = [], resistencias = [], vulnerabilidades = [] }) {
    if (!Number.isInteger(quantidade) || quantidade < 0 || typeof tipo !== "string" || !tipo.trim() || typeof origem !== "string" || !origem.trim()) return null;
    const tipoNormalizado = tipo.trim().toLowerCase();
    const normalizarTipo = (valor) => String(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/\s*\(force\)\s*$/, "")
      .replace(/^congelante$/, "frio");
    const chaveTipo = normalizarTipo(tipoNormalizado);
    const tem = (lista) => Array.isArray(lista) && lista.some((item) => normalizarTipo(item) === chaveTipo);
    if (tem(imunidades)) return { bruto: quantidade, tipo: tipoNormalizado, origem, resistido: false, vulneravel: false, imune: true, cancelado: false, final: 0 };
    const resistido = tem(resistencias);
    const vulneravel = tem(vulnerabilidades);
    if (resistido && vulneravel) return { bruto: quantidade, tipo: tipoNormalizado, origem, resistido: false, vulneravel: false, imune: false, cancelado: true, final: quantidade };
    return {
      bruto: quantidade,
      tipo: tipoNormalizado,
      origem,
      resistido,
      vulneravel,
      imune: false,
      cancelado: false,
      final: vulneravel ? quantidade * 2 : resistido ? Math.floor(quantidade / 2) : quantidade,
    };
  },
});
