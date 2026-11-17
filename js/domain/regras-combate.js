// Regras puras de combate D&D 5e (2014). Este módulo não lê nem altera DOM,
// armazenamento, histórico ou estado persistente da ficha.
const RegrasCombate = Object.freeze({
  calcularTotalD20(dado, modificadores = []) {
    if (!Number.isInteger(dado) || dado < 1 || dado > 20) return null;
    const valores = Array.isArray(modificadores) ? modificadores : [modificadores];
    if (!valores.every(Number.isFinite)) return null;
    return dado + valores.reduce((soma, valor) => soma + valor, 0);
  },

  resolverVantagemDesvantagem({ resultados, vantagens = [], desvantagens = [] }) {
    if (!Array.isArray(vantagens) || !Array.isArray(desvantagens)) return null;
    if (!Array.isArray(resultados) || resultados.length < 1 ||
        !resultados.every((valor) => Number.isInteger(valor) && valor >= 1 && valor <= 20)) {
      return null;
    }
    const temVantagem = vantagens.length > 0;
    const temDesvantagem = desvantagens.length > 0;
    const modo = temVantagem === temDesvantagem
      ? "normal"
      : temVantagem ? "vantagem" : "desvantagem";
    if (modo === "normal" && resultados.length !== 1) return null;
    if (modo !== "normal" && resultados.length !== 2) return null;
    const escolhido = modo === "normal"
      ? resultados[0]
      : modo === "vantagem"
        ? Math.max(...resultados)
        : Math.min(...resultados);
    return {
      modo,
      escolhido,
      resultados: [...resultados],
      vantagens: [...vantagens],
      desvantagens: [...desvantagens],
    };
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
    const tem = (lista) => Array.isArray(lista) && lista.some((item) => String(item).trim().toLowerCase() === tipoNormalizado);
    if (tem(imunidades)) return { bruto: quantidade, tipo: tipoNormalizado, origem, resistido: false, vulneravel: false, imune: true, final: 0 };
    const resistido = tem(resistencias);
    const vulneravel = tem(vulnerabilidades);
    if (resistido && vulneravel) return { bruto: quantidade, tipo: tipoNormalizado, origem, resistido: false, vulneravel: false, imune: false, final: quantidade };
    return {
      bruto: quantidade,
      tipo: tipoNormalizado,
      origem,
      resistido,
      vulneravel,
      imune: false,
      final: vulneravel ? quantidade * 2 : resistido ? Math.floor(quantidade / 2) : quantidade,
    };
  },
});
