// Reordenação manual dos cards do inventário. A ordem do DOM já é a ordem
// serializada pelos coletores e, portanto, fica preservada ao salvar/importar.
(() => {
  const listas = [
    { seletor: "#listaArmas", tipo: "arma", card: '.item-card[data-tipo="arma"]:not(#armaModelo)' },
    { seletor: "#listaMunicoes", tipo: "municao", card: '.item-card[data-tipo="municao"]' },
    { seletor: "#listaArmaduras", tipo: "armadura", card: '.item-card[data-tipo="armadura"]:not(#armaduraModelo)' },
    { seletor: "#listaEscudosItens", tipo: "escudo", card: '.item-card[data-tipo="escudo"]:not(#escudoModelo)' },
    { seletor: "#listaVestimentas", tipo: "vestimenta", card: '.item-card[data-tipo="escudo"]:not(#escudoModelo)' },
    { seletor: "#listaOutros", tipo: "outro", card: '.item-card[data-tipo="outro"]:not(#outroModelo)' },
  ];
  let arrastado = null;
  let estadoInicial = null;
  let estadoEquipamentoInicial = null;
  let listaAtiva = null;

  const obterLista = seletor => document.querySelector(seletor);
  const cardsDiretos = (lista, regra) => lista ? [...lista.querySelectorAll(`:scope > ${regra.card}`)] : [];
  const cartoesArmas = () => cardsDiretos(obterLista("#listaArmas"), listas[0]);
  const cartoesArmaduras = () => cardsDiretos(obterLista("#listaArmaduras"), listas[2]);
  const cartoesEscudosTodos = () => [...document.querySelectorAll('#listaEscudos .item-card[data-tipo="escudo"]:not(#escudoModelo)')];

  function capturarReferenciasEquipadas() {
    const armas = cartoesArmas();
    const escudos = cartoesEscudosTodos();
    const indiceEscudo = valor => typeof extrairIndiceSlotEscudo === "function" ? extrairIndiceSlotEscudo(valor) : null;
    const slots = [1, 2].map(numero => {
      const select = document.getElementById(`arma${numero}Nome`);
      const valor = select?.value || "";
      const idxEscudo = indiceEscudo(valor);
      if (Number.isInteger(idxEscudo)) return { select, item: escudos[idxEscudo], categoria: "escudo" };
      const idxArma = valor === "" ? null : Number.parseInt(valor, 10);
      return { select, item: Number.isInteger(idxArma) ? armas[idxArma] : null, categoria: "arma" };
    });
    const checkboxArmas = [...document.querySelectorAll("#lista-armas-equipamento input")].map(input => ({ input, item: armas[Number(input.dataset.index)] }));
    const checkboxEscudos = [...document.querySelectorAll("#lista-escudos-equipamento input")].map(input => ({ input, item: escudos[Number(input.dataset.index)] }));
    const idxArmadura = typeof normalizarIndiceEquipamento === "function" ? normalizarIndiceEquipamento(armaduraEquipadaIndice) : null;
    return {
      slots,
      checkboxArmas,
      checkboxEscudos,
      armasMarcadas: new Set(checkboxArmas.filter(({ input }) => input.checked).map(({ item }) => item).filter(Boolean)),
      escudosMarcados: new Set(checkboxEscudos.filter(({ input }) => input.checked).map(({ item }) => item).filter(Boolean)),
      armadura: Number.isInteger(idxArmadura) ? cartoesArmaduras()[idxArmadura] || null : null,
    };
  }

  function atualizarIndicesEquipamentos(snapshot) {
    const armas = cartoesArmas();
    const escudos = cartoesEscudosTodos();
    snapshot.checkboxArmas.forEach(({ input, item }) => {
      const novoIndice = armas.indexOf(item);
      input.dataset.index = String(novoIndice);
      input.checked = novoIndice >= 0 && snapshot.armasMarcadas.has(item);
    });
    snapshot.checkboxEscudos.forEach(({ input, item }) => {
      const novoIndice = escudos.indexOf(item);
      input.dataset.index = String(novoIndice);
      input.checked = novoIndice >= 0 && snapshot.escudosMarcados.has(item);
    });
    snapshot.slots.forEach(({ select, item, categoria }) => {
      if (!select || !item) return;
      const novoIndice = (categoria === "escudo" ? escudos : armas).indexOf(item);
      if (novoIndice < 0) return;
      select.value = categoria === "escudo" && typeof criarValorSlotEscudo === "function"
        ? criarValorSlotEscudo(novoIndice)
        : String(novoIndice);
    });
    if (snapshot.armadura) {
      const novoIndice = cartoesArmaduras().indexOf(snapshot.armadura);
      if (novoIndice >= 0) armaduraEquipadaIndice = novoIndice;
    }
  }

  function limparEstadoArraste() {
    document.querySelectorAll(".inventario-destino-arraste").forEach(card => card.classList.remove("inventario-destino-arraste"));
    document.querySelectorAll(".inventario-arrastando").forEach(card => card.classList.remove("inventario-arrastando"));
    document.querySelectorAll("[data-inventario-lista-arraste]").forEach(lista => lista.classList.remove("inventario-lista-arraste-ativa"));
    arrastado = null; estadoInicial = null; estadoEquipamentoInicial = null; listaAtiva = null;
  }

  function habilitarLista(regra) {
    const lista = obterLista(regra.seletor);
    if (!lista || lista.dataset.inventarioOrdemInicializada === "true") return;
    lista.dataset.inventarioOrdemInicializada = "true";
    lista.dataset.inventarioListaArraste = regra.tipo;
    lista.addEventListener("dragstart", evento => {
      if (evento.target.closest("input, select, textarea, [contenteditable='true']")) { evento.preventDefault(); return; }
      const card = evento.target.closest(regra.card);
      if (!card || card.parentElement !== lista) { evento.preventDefault(); return; }
      arrastado = card; listaAtiva = lista;
      estadoInicial = cardsDiretos(lista, regra);
      estadoEquipamentoInicial = capturarReferenciasEquipadas();
      arrastado.classList.add("inventario-arrastando");
      arrastado.setAttribute("aria-grabbed", "true");
      lista.classList.add("inventario-lista-arraste-ativa");
      evento.dataTransfer.effectAllowed = "move";
      evento.dataTransfer.setData("text/plain", `${regra.tipo}:${card.dataset.id || "item"}`);
    });
    lista.addEventListener("dragover", evento => {
      if (!arrastado || listaAtiva !== lista) return;
      evento.preventDefault(); evento.dataTransfer.dropEffect = "move";
      const alvo = evento.target.closest(regra.card);
      document.querySelectorAll(".inventario-destino-arraste").forEach(card => card.classList.remove("inventario-destino-arraste"));
      if (alvo && alvo !== arrastado && alvo.parentElement === lista) {
        alvo.classList.add("inventario-destino-arraste");
        const caixa = alvo.getBoundingClientRect();
        const depois = evento.clientY > caixa.top + caixa.height / 2;
        lista.insertBefore(arrastado, depois ? alvo.nextSibling : alvo);
      } else if (!alvo) {
        lista.appendChild(arrastado);
      }
    });
    lista.addEventListener("drop", evento => { if (arrastado && listaAtiva === lista) evento.preventDefault(); });
    lista.addEventListener("dragend", () => {
      const houveMudanca = !!estadoInicial && cardsDiretos(lista, regra).some((card, index) => card !== estadoInicial[index]);
      if (arrastado) arrastado.setAttribute("aria-grabbed", "false");
      if (houveMudanca) {
        atualizarIndicesEquipamentos(estadoEquipamentoInicial);
      }
      limparEstadoArraste();
      if (houveMudanca && typeof atualizarListaArmasEquipamento === "function") atualizarListaArmasEquipamento();
    });
    const marcarCards = () => cardsDiretos(lista, regra).forEach(card => {
      card.draggable = true;
      card.setAttribute("aria-roledescription", "item arrastável para reorganizar");
      card.title = card.title || "Arraste para reorganizar dentro desta categoria";
    });
    marcarCards();
    new MutationObserver(marcarCards).observe(lista, { childList: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    listas.forEach(habilitarLista);
  });
})();
