/* Recursos puramente visuais da aba de combate; nenhum dado do personagem é alterado. */
(function registrarIconesCombate(global) {
  const POR_ID_CATALOGO = Object.freeze({
    "longsword": "../assets/icons/armas/two-handed-sword.svg",
    "espada-longa": "../assets/icons/armas/two-handed-sword.svg",
  });
  const MAO_OCUPADA = "../assets/icons/interface/maos/mao-ocupada.svg";
  const MAO_VAZIA = "../assets/icons/interface/maos/mao-vazia.svg";

  function obterIdCatalogo(item) {
    if (typeof item?.catalogoId === "string") return item.catalogoId;
    return typeof item?.id === "string" ? item.id : "";
  }

  function obterFonteArma(idCatalogo) {
    return POR_ID_CATALOGO[idCatalogo] || MAO_OCUPADA;
  }

  function criarImagem(documento, fonte, classe) {
    const imagem = documento.createElement("img");
    imagem.className = classe;
    imagem.alt = "";
    imagem.setAttribute("aria-hidden", "true");
    imagem.width = 32;
    imagem.height = 32;
    imagem.src = fonte;
    return imagem;
  }

  function substituirPorImagem(container, fonte, classe, fallback) {
    if (!container || !container.ownerDocument) return;
    const imagem = criarImagem(container.ownerDocument, fonte, classe);
    imagem.addEventListener("error", () => {
      if (fallback && imagem.dataset.fallback !== "usado") {
        imagem.dataset.fallback = "usado";
        imagem.src = fallback;
      } else {
        imagem.remove();
      }
    });
    container.replaceChildren(imagem);
  }

  function atualizarIconeMao(botao, tipo, idCatalogo = "") {
    if (!botao) return;
    if (tipo === "escudo") {
      botao.replaceChildren(botao.ownerDocument.createTextNode("🛡️"));
      return;
    }
    const fonte = tipo === "livre"
      ? MAO_VAZIA
      : tipo === "arma"
        ? obterFonteArma(idCatalogo)
        : MAO_OCUPADA;
    substituirPorImagem(botao, fonte, "combate-icone-mao", fonte === MAO_OCUPADA ? null : MAO_OCUPADA);
  }

  function criarIconeArma(documento, item) {
    const id = obterIdCatalogo(item);
    const fonte = obterFonteArma(id);
    const imagem = criarImagem(documento, fonte, "combate-icone-arma");
    imagem.addEventListener("error", () => {
      if (fonte !== MAO_OCUPADA && imagem.dataset.fallback !== "usado") {
        imagem.dataset.fallback = "usado";
        imagem.src = MAO_OCUPADA;
      } else {
        imagem.remove();
      }
    });
    return imagem;
  }

  global.FichaDnDCombateIcons = Object.freeze({
    obterIdCatalogo,
    obterFonteArma,
    atualizarIconeMao,
    criarIconeArma,
    caminhos: Object.freeze({ maoOcupada: MAO_OCUPADA, maoVazia: MAO_VAZIA }),
  });
})(window);
