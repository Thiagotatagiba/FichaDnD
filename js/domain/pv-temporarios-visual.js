(function (root) {
  function calcularCoberturaCamadaPvTemporario(pvTemporarios, pvMaximo, faixa, coracao, quantidadeCoracoes = 5) {
    if (![pvTemporarios, pvMaximo, faixa, coracao, quantidadeCoracoes].every(Number.isFinite) ||
        pvTemporarios <= 0 || pvMaximo <= 0 || quantidadeCoracoes <= 0 || coracao < 0 ||
        coracao >= quantidadeCoracoes || faixa < 0 || faixa > 2) return 0;
    const porCoracao = pvMaximo / quantidadeCoracoes;
    const valorNaFaixa = Math.max(0, Math.min(pvMaximo, pvTemporarios - faixa * pvMaximo));
    const valorNesteCoracao = Math.max(0, Math.min(porCoracao, valorNaFaixa - coracao * porCoracao));
    return valorNesteCoracao / porCoracao;
  }

  const api = { calcularCoberturaCamadaPvTemporario };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PvTemporariosVisual = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
