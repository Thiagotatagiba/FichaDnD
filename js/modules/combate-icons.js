/* Recursos puramente visuais da aba de combate; nenhum dado do personagem é alterado. */
(function registrarIconesCombate(global) {
  const POR_ID_CATALOGO = Object.freeze({
    longsword: "../assets/icons/armas/two-handed-sword.svg",
    "espada-longa": "../assets/icons/armas/two-handed-sword.svg",
    dagger: "../assets/icons/armas/broad-dagger.svg",
    punch: "../assets/icons/armas/punch.svg",
    club: "../assets/icons/armas/spiked-bat.svg",
    greatclub: "../assets/icons/armas/wood-club.svg",
    sickle: "../assets/icons/armas/sickle.svg",
    spear: "../assets/icons/armas/barbed-spear.svg",
    mace: "../assets/icons/armas/mace.svg",
    handaxe: "../assets/icons/armas/hatchet.svg",
    "light-hammer": "../assets/icons/armas/claw-hammer.svg",
    quarterstaff: "../assets/icons/armas/bo.svg",
    javelin: "../assets/icons/armas/spear-feather.svg",
    shortbow: "../assets/icons/armas/pocket-bow.svg",
    "light-crossbow": "../assets/icons/armas/crossbow.svg",
    dart: "../assets/icons/armas/dart.svg",
    sling: "../assets/icons/armas/sling.svg",
    halberd: "../assets/icons/armas/halberd.svg",
    whip: "../assets/icons/armas/whip.svg",
    scimitar: "../assets/icons/armas/croc-sword.svg",
    shortsword: "../assets/icons/armas/gladius.svg",
    greatsword: "../assets/icons/armas/pointy-sword.svg",
    glaive: "../assets/icons/armas/glaive.svg",
    lance: "../assets/icons/armas/lance.svg",
    morningstar: "../assets/icons/armas/spiked-ball.svg",
    battleaxe: "../assets/icons/armas/battle-axe.svg",
    greataxe: "../assets/icons/armas/war-axe.svg",
    maul: "../assets/icons/armas/warhammer.svg",
    flail: "../assets/icons/armas/spiked-ball.svg",
    warhammer: "../assets/icons/armas/warhammer.svg",
    "war-pick": "../assets/icons/armas/war-pick.svg",
    rapier: "../assets/icons/armas/rapier.svg",
    trident: "../assets/icons/armas/trident.svg",
    longbow: "../assets/icons/armas/high-shot.svg",
    "hand-crossbow": "../assets/icons/armas/crossbow.svg",
    "heavy-crossbow": "../assets/icons/armas/crossbow.svg",
    net: "../assets/icons/armas/fishing-net.svg",
    shield: "../assets/icons/escudos/viking-shield.svg",
  });
  const MAO_OCUPADA = "../assets/icons/interface/maos/mao-ocupada.svg";
  const MAO_VAZIA = "../assets/icons/interface/maos/mao-vazia.svg";

  function obterIdCatalogo(item) {
    if (typeof item?.catalogoId === "string") return item.catalogoId;
    return typeof item?.id === "string" ? item.id : "";
  }

  function obterIconeCatalogado(item) {
    if (typeof item?.icone === "string" && item.icone.trim())
      return item.icone.trim();
    if (
      typeof item?.catalogoArmaIcone === "string" &&
      item.catalogoArmaIcone.trim()
    )
      return item.catalogoArmaIcone.trim();
    return "";
  }

  function obterFonteArma(idCatalogo, item = null) {
    const iconeCatalogado = obterIconeCatalogado(item);
    if (iconeCatalogado) return iconeCatalogado;

    const catalogo =
      typeof estadoCatalogoArmas !== "undefined"
        ? estadoCatalogoArmas?.dados?.itens
        : null;
    const origem = Array.isArray(catalogo)
      ? catalogo.find(
          (entrada) =>
            entrada.id === idCatalogo || entrada.idLegado === idCatalogo,
        )
      : null;
    if (typeof origem?.icone === "string" && origem.icone.trim())
      return origem.icone.trim();

    return POR_ID_CATALOGO[idCatalogo] || MAO_OCUPADA;
  }

  function obterFonteEscudo(idCatalogo) {
    return (
      POR_ID_CATALOGO[idCatalogo] || "../assets/icons/escudos/viking-shield.svg"
    );
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

  function obterFallbackArma(idCatalogo, fonteAtual) {
    const catalogada = POR_ID_CATALOGO[idCatalogo];
    if (catalogada && catalogada !== fonteAtual) return catalogada;
    const fonteDoCatalogo = obterFonteArma(idCatalogo, null);
    if (fonteDoCatalogo !== MAO_OCUPADA && fonteDoCatalogo !== fonteAtual)
      return fonteDoCatalogo;
    return MAO_OCUPADA;
  }

  function atualizarIconeMao(botao, tipo, idCatalogo = "", item = null) {
    if (!botao) return;
    if (tipo === "escudo") {
      const fonte = obterFonteEscudo(idCatalogo);
      substituirPorImagem(botao, fonte, "combate-icone-escudo", null);
      return;
    }
    const fonte =
      tipo === "livre"
        ? MAO_VAZIA
        : tipo === "arma"
          ? obterFonteArma(idCatalogo, item)
          : MAO_OCUPADA;
    substituirPorImagem(botao, fonte, "combate-icone-mao", fonte === MAO_OCUPADA ? null : obterFallbackArma(idCatalogo, fonte));
  }

  function criarIconeArma(documento, item) {
    const id = obterIdCatalogo(item);
    const fonte = obterFonteArma(id, item);
    const imagem = criarImagem(documento, fonte, "combate-icone-arma");
    imagem.addEventListener("error", () => {
      const fallback = obterFallbackArma(id, imagem.src);
      if (fallback !== MAO_OCUPADA && imagem.dataset.fallback !== "catalogo") {
        imagem.dataset.fallback = "catalogo";
        imagem.src = fallback;
      } else if (imagem.src !== MAO_OCUPADA && imagem.dataset.fallback !== "mao") {
        imagem.dataset.fallback = "mao";
        imagem.src = MAO_OCUPADA;
      } else {
        imagem.remove();
      }
    });
    return imagem;
  }

  global.FichaDnDCombateIcons = Object.freeze({
    obterIdCatalogo,
    obterIconeCatalogado,
    obterFonteArma,
    obterFonteEscudo,
    atualizarIconeMao,
    criarIconeArma,
    caminhos: Object.freeze({ maoOcupada: MAO_OCUPADA, maoVazia: MAO_VAZIA }),
  });
})(window);
