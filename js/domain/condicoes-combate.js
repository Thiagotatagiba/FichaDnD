const RegrasCondicoesCombate = (() => {
  const condicoesOficiais = Object.freeze([
    "Amedrontado", "Agarrado", "Atordoado", "Caído", "Cego", "Contido",
    "Encantado", "Ensurdecido", "Envenenado", "Exausto", "Imobilizado",
    "Incapacitado", "Invisível", "Paralisado", "Petrificado",
  ]);
  const oficial = (nome) => condicoesOficiais.some((item) =>
    item.toLocaleLowerCase("pt-BR") === String(nome).toLocaleLowerCase("pt-BR"));

  function migrarTextoLegado(texto, gerarId = () => `condicao-${Date.now()}-${Math.random()}`) {
    return String(texto || "")
      .replace(/(?:^|,\s*)Concentrado\s*\[[^\]]*\]/g, "")
      .replace(/^\s*,\s*|,\s*$/g, "")
      .split(",").map((nome) => nome.trim()).filter(Boolean).map((nome) => ({
        id: gerarId(),
        tipo: oficial(nome) ? "oficial" : "personalizada",
        nome,
        origem: { tipo: "legado" },
        estado: "ativa",
        duracao: { tipo: "indefinida" },
        ...(nome.toLocaleLowerCase("pt-BR") === "exausto" ? { nivelExaustao: 1 } : {}),
      }));
  }

  function reconciliar(anteriores, selecionadas, nivelExaustao, gerarId, agora = () => new Date().toISOString()) {
    const ativas = (anteriores || []).filter((item) => item?.estado === "ativa");
    const nomes = (selecionadas || []).map((nome) => String(nome || "").trim()).filter(Boolean)
      .filter((nome, indice, lista) => lista.findIndex((item) => item.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR")) === indice);
    const novas = nomes.map((nome) => {
      const tipo = oficial(nome) ? "oficial" : "personalizada";
      const anterior = ativas.find((item) => item.tipo === tipo && item.nome.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"));
      return {
        ...(anterior || {}), id: anterior?.id || gerarId(), tipo, nome,
        origem: anterior?.origem || { tipo: "manual" }, estado: "ativa",
        duracao: anterior?.duracao || { tipo: "indefinida" },
        ...(nome.toLocaleLowerCase("pt-BR") === "exausto" ? { nivelExaustao: Math.min(6, Math.max(1, Number.parseInt(nivelExaustao, 10) || 1)) } : {}),
      };
    });
    const encerradas = ativas.filter((item) => !nomes.some((nome) => item.nome.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR")))
      .map((item) => ({ ...item, estado: "encerrada", encerradaEm: agora(), motivoEncerramento: "Removida manualmente" }));
    return [...(anteriores || []).filter((item) => item?.estado === "encerrada"), ...encerradas, ...novas];
  }

  return Object.freeze({ condicoesOficiais, migrarTextoLegado, reconciliar });
})();

if (typeof module !== "undefined" && module.exports) module.exports = RegrasCondicoesCombate;
