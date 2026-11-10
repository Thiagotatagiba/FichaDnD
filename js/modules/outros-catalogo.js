// Catálogos por família para a seção única "Outros". Instâncias continuam salvas em outros[].
const estadoCatalogoOutros = { registro: null, itens: [], selecionado: null, card: null, modo: "", retrato: "", nova: false };
const MOEDAS_OUTROS = { pc: "PC", pp: "PP", pe: "PE", po: "PO", pl: "PL" };

function elOutro(tag, texto, classe) {
  const node = document.createElement(tag);
  if (texto !== undefined && texto !== null) node.textContent = texto;
  if (classe) node.className = classe;
  return node;
}

function camposOutro(card = estadoCatalogoOutros.card) {
  const get = (nome) => card?.querySelector(`[data-campo="outro_${nome}"]`);
  return {
    get: (nome) => get(nome)?.value ?? "",
    set: (nome, value) => { const input = get(nome); if (input) input.value = value == null ? "" : String(value); },
    flag: (nome) => card?.querySelector(`[data-flag="${nome}"]`),
  };
}

function tipoCatalogoOutro(card) {
  const f = camposOutro(card);
  if (f.get("catalogo_tipo")) return f.get("catalogo_tipo");
  const tipoLegado = String(f.get("tipo")).toLowerCase();
  if (tipoLegado.includes("poc")) return "pocoes";
  if (tipoLegado.includes("ferrament") || tipoLegado === "kit") return "ferramentas-kits";
  if (tipoLegado.includes("comida")) return "consumivel";
  if (tipoLegado.includes("ingrediente")) return "componentes-materiais";
  return "outros";
}

function catalogoOutroNome(tipo) {
  return estadoCatalogoOutros.registro?.catalogos?.find(c => c.tipo === tipo)?.nome || "Outros";
}

function formatarMoedaOutro(valor, moeda = "po") {
  if (valor === "" || valor == null || !Number.isFinite(Number(valor))) return "Valor não informado";
  return `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${MOEDAS_OUTROS[moeda] || "PO"}`;
}

function formatarPesoOutro(valor) {
  if (valor === "" || valor == null || !Number.isFinite(Number(valor))) return "Peso não informado";
  return `${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
}

function itemLegadoOutro(card) {
  const f = camposOutro(card);
  return {
    nome: f.get("nome").trim() || "Item sem nome",
    tipo: tipoCatalogoOutro(card),
    categoria: f.get("categoria"),
    raridade: f.get("raridade") || "comum",
    quantidade: Math.max(0, parseInt(f.get("quantidade"), 10) || 0),
    quantidadeMaxima: f.get("quantidade_maxima") === "" ? null : Math.max(0, parseInt(f.get("quantidade_maxima"), 10) || 0),
    consumivel: f.get("consumivel") === "true" || ["pocoes", "consumivel"].includes(tipoCatalogoOutro(card)),
    moeda: f.get("moeda") || "po",
    preco: f.get("preco"),
    peso: f.get("peso_definido") === "false" ? "" : f.get("peso"),
    descricao: f.get("descricao"),
    proficienciaId: f.get("proficiencia_id"),
    foco: f.get("pode_ser_foco_arcano"),
    magico: !!f.flag("item_magico")?.checked,
    sintonizado: !!f.flag("sintonizado")?.checked,
  };
}

function rotuloCategoriaOutro(item) {
  const grupo = String(item.categoria || "").toLowerCase();
  const rotulos = { kits: "Kit", ferramentas: "Ferramenta", "ferramentas-artesao": "Ferramenta", jogos: "Jogo", "foco-arcano": "Foco arcano", "foco-druidico": "Foco druídico", "simbolo-sagrado": "Símbolo sagrado" };
  if (rotulos[grupo]) return rotulos[grupo];
  const tipo = { pocoes: "Poção", consumivel: "Consumível", "ferramentas-kits": "Ferramenta", "instrumentos-musicais": "Instrumento", "pacotes-equipamento": "Pacote", "focos-conjuracao": "Foco", "componentes-materiais": "Componente", "equipamento-geral": "Equipamento", "tesouros-valores": "Tesouro", outros: "Outro" }[item.tipo];
  return tipo || "Outro";
}

function outroProficienciaAtiva(item) {
  if (!item.proficienciaId) return false;
  const campo = document.getElementById("proficienciaFerramentas");
  const normalizar = texto => String(texto || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const salvo = normalizar(campo?.value);
  const id = normalizar(item.proficienciaId);
  const nome = normalizar(item.nome);
  return !!salvo && (salvo.includes(id) || salvo.includes(nome));
}

function atualizarProficienciaEditorOutro() {
  const modal = modalOutro();
  const item = {
    nome: modal?.querySelector('[data-editor="nome"]')?.value || "",
    proficienciaId: modal?.querySelector('[data-editor="proficiencia"]')?.value || "",
  };
  const indicador = modal?.querySelector('[data-editor="proficiente"]');
  if (indicador) indicador.checked = outroProficienciaAtiva(item);
}

function tipoAceitaProficienciaOutro(tipo) {
  return tipo === "ferramentas-kits" || tipo === "instrumentos-musicais";
}

function atualizarCampoProficienciaOutro({ limpar = false } = {}) {
  const modal = modalOutro();
  const campo = modal?.querySelector(".outro-campo-proficiencia");
  const tipo = modal?.querySelector('[data-editor="tipo"]')?.value;
  if (!campo) return;
  const permitido = tipoAceitaProficienciaOutro(tipo);
  campo.hidden = !permitido;
  if (!permitido && limpar) valorNoModalOutro("proficiencia").value = "";
  atualizarProficienciaEditorOutro();
}

async function carregarCatalogoOutros() {
  if (estadoCatalogoOutros.registro) return;
  const raiz = "../assets/data/itens/outros/";
  const regResp = await fetch(`${raiz}registro.json?v=1`);
  if (!regResp.ok) throw new Error("Registro de catálogos indisponível.");
  const registro = await regResp.json();
  if (registro.versaoSchema !== 1 || !Array.isArray(registro.catalogos)) throw new Error("Registro de catálogos inválido.");
  const colecoes = await Promise.all(registro.catalogos.map(async entrada => {
    const resposta = await fetch(`${raiz}${entrada.arquivo}?v=1`);
    if (!resposta.ok) throw new Error(`Não foi possível carregar ${entrada.nome}.`);
    const dados = await resposta.json();
    if (dados.versaoSchema !== 1 || dados.sistema !== "dnd5e-2014" || !Array.isArray(dados.itens)) throw new Error(`Catálogo inválido: ${entrada.nome}.`);
    return dados.itens.map(item => ({ ...item, tipo: item.tipo || entrada.tipo }));
  }));
  estadoCatalogoOutros.registro = registro;
  estadoCatalogoOutros.itens = colecoes.flat();
}

function atualizarResumosOutros() {
  document.querySelectorAll('#listaOutros .item-card[data-tipo="outro"]').forEach(card => {
    card.classList.add("outro-catalogo-card");
    let resumo = card.querySelector(".outro-resumo");
    if (!resumo) {
      resumo = elOutro("div", undefined, "outro-resumo arma-resumo");
      resumo.innerHTML = '<span class="armadura-cartao-info"><span class="armadura-cartao-topo outro-cartao-topo"><span class="outro-cartao-quantidade-slot"></span><button type="button" class="outro-cartao-nome"></button><span class="outro-cartao-proficiencia" hidden>Proficiente</span><span class="outro-cartao-quantidade"></span></span><span class="armadura-cartao-dados"><span class="outro-cartao-tags"></span><span class="outro-cartao-detalhes"></span></span><span class="armadura-cartao-rodape"><span class="armadura-cartao-meta"></span></span></span>';
      card.append(resumo);
      resumo.querySelector(".outro-cartao-nome").addEventListener("click", () => abrirModalOutro(card));
      resumo.addEventListener("click", event => { if (!event.target.closest("button,input")) abrirModalOutro(card); });
    }
    const item = itemLegadoOutro(card);
    const f = camposOutro(card);
    if (!f.get("catalogo_tipo")) f.set("catalogo_tipo", item.tipo);
    resumo.querySelector(".outro-cartao-nome").textContent = item.nome;
    const proficiencia = resumo.querySelector(".outro-cartao-proficiencia");
    proficiencia.hidden = !outroProficienciaAtiva(item);
    const titulo = resumo.querySelector(".outro-cartao-topo");
    let quantidade = resumo.querySelector(".outro-quantidade-inline");
    const editaInline = item.consumivel;
    if (editaInline && !quantidade) {
      quantidade = document.createElement("input");
      quantidade.type = "number"; quantidade.min = "0"; quantidade.step = "1";
      quantidade.className = "outro-quantidade-inline"; quantidade.setAttribute("aria-label", "Quantidade atual");
      quantidade.addEventListener("click", e => e.stopPropagation());
      quantidade.addEventListener("input", () => { const maximo = Number(quantidade.max); if (quantidade.value !== "" && quantidade.max !== "" && Number.isFinite(maximo) && Number(quantidade.value) > maximo) quantidade.value = String(maximo); f.set("quantidade", quantidade.value); atualizarPesoAtualInventario(); atualizarListaArmasEquipamento(); });
      quantidade.addEventListener("change", () => { let valor = Math.max(0, parseInt(quantidade.value, 10) || 0); const maximo = Number(quantidade.max); if (quantidade.max !== "" && Number.isFinite(maximo)) valor = Math.min(valor, maximo); f.set("quantidade", valor); quantidade.value = f.get("quantidade"); atualizarPesoAtualInventario(); atualizarListaArmasEquipamento(); });
      resumo.querySelector(".outro-cartao-quantidade-slot").append(quantidade);
    }
    if (!editaInline) quantidade?.remove();
    if (editaInline) {
      quantidade.max = item.quantidadeMaxima == null ? "" : String(item.quantidadeMaxima);
      quantidade.value = String(item.quantidade);
      resumo.querySelector(".outro-cartao-quantidade").textContent = "";
    } else {
      resumo.querySelector(".outro-cartao-quantidade").textContent = item.quantidade > 1 ? `× ${item.quantidade}` : "";
    }
    const tags = resumo.querySelector(".outro-cartao-tags"); tags.replaceChildren();
    tags.append(elOutro("span", rotuloCategoriaOutro(item), "armadura-cartao-tag"));
    tags.append(elOutro("span", item.raridade, "armadura-cartao-tag"));
    const detalhes = resumo.querySelector(".outro-cartao-detalhes");
    detalhes.textContent = "";
    resumo.querySelector(".armadura-cartao-meta").textContent = `🪙 ${formatarMoedaOutro(item.preco, item.moeda)}   ⚖️ ${formatarPesoOutro(item.peso)}`;
    resumo.querySelector(".outro-cartao-nome").setAttribute("aria-label", `Visualizar ${item.nome}`);
  });
}

function capturarOutro() {
  const editor = modalOutro();
  if (estadoCatalogoOutros.modo === "edicao" && editor && !editor.hidden) {
    return JSON.stringify({ campos: [...editor.querySelectorAll("[data-editor]")].map(x => x.type === "checkbox" ? x.checked : x.value) });
  }
  const f = camposOutro();
  return JSON.stringify({ campos: [...estadoCatalogoOutros.card.querySelectorAll("[data-campo]")].map(x => x.value), flags: [...estadoCatalogoOutros.card.querySelectorAll("[data-flag]")].map(x => x.checked) });
}

function modalOutro() { return document.getElementById("outroItemModal"); }
function fecharModalOutro(forcar = false) {
  const modal = modalOutro(); if (!modal) return;
  if (!forcar && estadoCatalogoOutros.modo === "edicao" && capturarOutro() !== estadoCatalogoOutros.retrato) {
    if (!confirm("Descartar as alterações feitas neste item?")) return;
  }
  if (!forcar && estadoCatalogoOutros.nova) { estadoCatalogoOutros.card?.remove(); atualizarPesoAtualInventario(); atualizarListaArmasEquipamento(); }
  modal.classList.add("oculto"); modal.classList.remove("ativo"); modal.setAttribute("aria-hidden", "true");
  estadoCatalogoOutros.modo = ""; estadoCatalogoOutros.nova = false;
  atualizarResumosOutros();
}

function valorNoModalOutro(nome) { return modalOutro().querySelector(`[data-editor="${nome}"]`); }
function preencherModalOutro() {
  const item = itemLegadoOutro(estadoCatalogoOutros.card), f = camposOutro();
  const overlay = modalOutro();
  overlay.querySelector("#outroItemModalTitulo").textContent = item.nome;
  overlay.querySelector('[data-local="outro-tags"]').replaceChildren(
    elOutro("span", catalogoOutroNome(item.tipo), "magia-modal-nivel"),
    elOutro("span", item.raridade, "magia-modal-nivel"),
    ...(item.magico ? [elOutro("span", "Item mágico", "magia-modal-nivel")] : []),
    ...(item.sintonizado ? [elOutro("span", "Sintonizado", "magia-modal-nivel")] : []),
  );
  const campos = { nome: item.nome, tipo: item.tipo, raridade: item.raridade, quantidade: item.quantidade, preco: item.preco, moeda: item.moeda, peso: item.peso, descricao: item.descricao, proficiencia: item.proficienciaId, foco: item.foco };
  Object.entries(campos).forEach(([key, value]) => { const input = valorNoModalOutro(key); if (input) input.value = value ?? ""; });
  atualizarCampoProficienciaOutro();
  overlay.querySelector('[data-editor="consumivel"]').checked = item.consumivel;
  overlay.querySelector('[data-editor="proficiente"]').checked = outroProficienciaAtiva(item);
  overlay.querySelector('[data-editor="magico"]').checked = item.magico;
  overlay.querySelector('[data-editor="sintonizado"]').checked = item.sintonizado;
  overlay.querySelector('[data-editor="sintonizado"]').disabled = !item.magico;
  const details = overlay.querySelector('[data-local="outro-detalhes"]'); details.replaceChildren();
  const valores = elOutro("div", undefined, "arma-detalhe-valores");
  [["Valor", formatarMoedaOutro(item.preco, item.moeda)], ["Peso", formatarPesoOutro(item.peso)]].forEach(([label, val]) => { const cell = elOutro("div", undefined, "arma-detalhe-valor"); cell.append(elOutro("span", label), elOutro("strong", val)); valores.append(cell); });
  details.append(valores);
  if (item.proficienciaId) details.append(elOutro("p", `Proficiência individual: ${item.nome}. Possuir o item não concede proficiência automaticamente.`, "outro-modal-nota"));
  if (item.foco === "true") details.append(elOutro("p", "Pode ser usado como foco arcano por um bardo.", "outro-modal-nota"));
  const descricao = elOutro("section", undefined, "armadura-descricao"); descricao.append(elOutro("h4", "Descrição"), elOutro("p", item.descricao || "Nenhuma descrição cadastrada.")); details.append(descricao);
}

function abrirModalOutro(card, nova = false) {
  estadoCatalogoOutros.card = card; estadoCatalogoOutros.nova = nova; estadoCatalogoOutros.modo = "visualizacao";
  const modal = modalOutro();
  modal.querySelector(".outro-editor").hidden = true; modal.querySelector(".outro-editor").style.display = "none";
  modal.querySelector(".outro-editor-flags").hidden = true;
  modal.querySelector('[data-local="outro-detalhes"]').hidden = false;
  modal.querySelector(".outro-modal-remover").hidden = false;
  modal.querySelector('[data-acao="editar"]').hidden = false;
  preencherModalOutro(); modal.classList.remove("oculto"); modal.classList.add("ativo"); modal.setAttribute("aria-hidden", "false");
  modal.querySelector('[data-acao="fechar"]').focus();
}

function iniciarEdicaoOutro() {
  const modal = modalOutro(), form = modal.querySelector(".outro-editor");
  preencherModalOutro(); estadoCatalogoOutros.modo = "edicao"; estadoCatalogoOutros.retrato = capturarOutro();
  modal.querySelector(".outro-editor-flags").hidden = false;
  modal.querySelector('[data-local="outro-detalhes"]').hidden = true; modal.querySelector('[data-acao="editar"]').hidden = true;
  modal.querySelector(".outro-modal-remover").hidden = true;
  form.hidden = false; form.style.display = "block"; valorNoModalOutro("nome").focus();
}

function salvarEdicaoOutro() {
  const f = camposOutro(), modal = modalOutro();
  f.set("nome", valorNoModalOutro("nome").value.trim()); f.set("catalogo_tipo", valorNoModalOutro("tipo").value);
  f.set("raridade", valorNoModalOutro("raridade").value); f.set("quantidade", Math.max(0, parseInt(valorNoModalOutro("quantidade").value, 10) || 0));
  f.set("preco", valorNoModalOutro("preco").value); f.set("moeda", valorNoModalOutro("moeda").value);
  f.set("peso", valorNoModalOutro("peso").value); f.set("peso_definido", valorNoModalOutro("peso").value === "" ? "false" : "true");
  f.set("preco_definido", valorNoModalOutro("preco").value === "" ? "false" : "true"); f.set("descricao", valorNoModalOutro("descricao").value);
  f.set("consumivel", modal.querySelector('[data-editor="consumivel"]').checked ? "true" : "false");
  const tipo = valorNoModalOutro("tipo").value;
  f.set("proficiencia_id", tipoAceitaProficienciaOutro(tipo) ? valorNoModalOutro("proficiencia").value : ""); f.set("pode_ser_foco_arcano", valorNoModalOutro("foco").value);
  f.set("categoria", catalogoOutroNome(tipo));
  f.set("tipo", tipoLegadoOutro(tipo));
  f.flag("item_magico").checked = modal.querySelector('[data-editor="magico"]').checked;
  f.flag("sintonizado").checked = f.flag("item_magico").checked && modal.querySelector('[data-editor="sintonizado"]').checked;
  estadoCatalogoOutros.nova = false; atualizarCamposMagicosItem(estadoCatalogoOutros.card);
  atualizarPesoAtualInventario(); atualizarListaArmasEquipamento(); atualizarResumosOutros();
  modal.querySelector(".outro-editor").hidden = true; modal.querySelector(".outro-editor").style.display = "none";
  modal.querySelector(".outro-editor-flags").hidden = true;
  estadoCatalogoOutros.modo = "visualizacao"; preencherModalOutro(); modal.querySelector('[data-local="outro-detalhes"]').hidden = false;
  modal.querySelector('[data-acao="editar"]').hidden = false; estadoCatalogoOutros.retrato = capturarOutro();
}

function tipoLegadoOutro(tipo) {
  return ({ "pocoes": "Pocao", "consumivel": "Comida", "ferramentas-kits": "Ferramentas", "instrumentos-musicais": "Outros", "pacotes-equipamento": "Kit", "focos-conjuracao": "Outros", "componentes-materiais": "Ingrediente", "equipamento-geral": "Outros", "tesouros-valores": "Outros", "outros": "Outros" })[tipo] || "Outros";
}

function aplicarItemCatalogoOutro(item) {
  const card = adicionarNovoOutro(); const f = camposOutro(card);
  f.set("nome", item.nome); f.set("tipo", tipoLegadoOutro(item.tipo)); f.set("catalogo_tipo", item.tipo); f.set("catalogo_id", item.id);
  const quantidadeInicial = item.quantidadeInicial ?? 1;
  const quantidade = item.quantidadeMaxima == null ? quantidadeInicial : Math.min(quantidadeInicial, item.quantidadeMaxima);
  f.set("categoria", item.grupo || catalogoOutroNome(item.tipo)); f.set("raridade", item.raridade || "comum"); f.set("quantidade", quantidade); f.set("quantidade_maxima", item.quantidadeMaxima ?? "");
  f.set("preco", item.custo?.valor ?? ""); f.set("moeda", item.custo?.moeda || "po"); f.set("preco_definido", item.custo?.valor == null ? "false" : "true");
  f.set("peso", item.pesoKg ?? ""); f.set("peso_definido", item.pesoKg == null ? "false" : "true");
  f.set("descricao", item.descricao || ""); f.set("consumivel", item.consumivel ? "true" : "false");
  f.set("proficiencia_id", item.proficienciaId || ""); f.set("pode_ser_foco_arcano", typeof item.podeSerFocoArcano === "boolean" ? String(item.podeSerFocoArcano) : "");
  fecharItemCard(card); atualizarResumosOutros(); atualizarPesoAtualInventario(); atualizarListaArmasEquipamento();
  fecharSelecaoOutros();
}

function fecharSelecaoOutros() { const overlay = document.getElementById("outroCatalogoOverlay"); overlay?.classList.add("oculto"); overlay?.classList.remove("ativo"); overlay?.setAttribute("aria-hidden", "true"); }

function renderizarSelecaoOutros() {
  const overlay = document.getElementById("outroCatalogoOverlay"), filtro = overlay.querySelector("[data-filtro-tipo]").value;
  const busca = overlay.querySelector("[data-busca]").value.trim().toLocaleLowerCase("pt-BR");
  const resultados = estadoCatalogoOutros.itens.filter(item => (filtro === "todos" || item.tipo === filtro) && `${item.nome} ${catalogoOutroNome(item.tipo)}`.toLocaleLowerCase("pt-BR").includes(busca));
  const lista = overlay.querySelector("[data-local=lista]"); lista.replaceChildren();
  resultados.forEach(item => {
    const button = elOutro("button", undefined, "magia-selecao-item outro-opcao"); button.type = "button";
    button.setAttribute("aria-pressed", String(estadoCatalogoOutros.selecionado?.id === item.id));
    button.append(elOutro("strong", item.nome), elOutro("span", `${catalogoOutroNome(item.tipo)} · ${item.raridade || "comum"}`));
    button.addEventListener("click", () => { estadoCatalogoOutros.selecionado = item; renderizarSelecaoOutros(); }); lista.append(button);
  });
  overlay.querySelector("[data-local=status]").textContent = `${resultados.length} ${resultados.length === 1 ? "item disponível" : "itens disponíveis"}`;
  const painel = overlay.querySelector("[data-local=detalhe]"); painel.replaceChildren();
  if (!resultados.length) { painel.append(elOutro("p", "Nenhum item encontrado.")); return; }
  if (!resultados.some(item => item.id === estadoCatalogoOutros.selecionado?.id)) estadoCatalogoOutros.selecionado = resultados[0];
  const item = estadoCatalogoOutros.selecionado;
  const article = elOutro("article", undefined, "magia-card-detalhe arma-detalhe outro-selecao-previa");
  const head = elOutro("header", undefined, "magia-card-detalhe-header arma-detalhe-header");
  const info = elOutro("div", undefined, "armadura-detalhe-titulo"); info.append(elOutro("span", "📦", "armadura-modal-icone"), elOutro("h3", item.nome, "magia-card-detalhe-nome"));
  const add = elOutro("button", "Adicionar ao inventário", "magia-card-detalhe-adicionar"); add.type = "button"; add.onclick = () => aplicarItemCatalogoOutro(item); head.append(info, add); article.append(head);
  const properties = elOutro("div", undefined, "magia-card-detalhe-propriedades arma-detalhe-propriedades"); properties.append(elOutro("span", catalogoOutroNome(item.tipo), "magia-card-detalhe-tag"), elOutro("span", item.raridade || "comum", "magia-card-detalhe-tag")); article.append(properties);
  const values = elOutro("div", undefined, "arma-detalhe-valores"); [["🪙 Valor", formatarMoedaOutro(item.custo?.valor, item.custo?.moeda)], ["⚖️ Peso", formatarPesoOutro(item.pesoKg)]].forEach(([label, value]) => { const cell = elOutro("div", undefined, "arma-detalhe-valor"); cell.append(elOutro("span", label), elOutro("strong", value)); values.append(cell); }); article.append(values);
  article.append(elOutro("p", item.descricao || "Nenhuma descrição cadastrada."));
  if (item.proficienciaId) article.append(elOutro("p", "A proficiência relacionada é individual e não é ativada automaticamente pela posse."));
  if (item.podeSerFocoArcano) article.append(elOutro("p", "Pode ser usado como foco arcano por um bardo."));
  painel.append(article);
}

function montarModalOutros() {
  if (modalOutro()) return;
  const modal = elOutro("div", undefined, "magia-modal-overlay modal-overlay-base oculto"); modal.id = "outroItemModal"; modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `<section class="magia-modal modal-base armadura-modal outro-item-modal" role="dialog" aria-modal="true" aria-labelledby="outroItemModalTitulo"><header class="magia-modal-topo modal-header-base"><div class="magia-modal-topo-info"><div class="armadura-modal-titulo-linha"><span class="armadura-modal-icone" aria-hidden="true">📦</span><h2 id="outroItemModalTitulo" class="magia-modal-titulo">Item</h2></div><div class="armadura-modal-categorias" data-local="outro-tags"></div></div><div class="armadura-editor-flags outro-editor-flags" hidden><label><input type="checkbox" data-editor="proficiente" disabled> Proficiente</label><label><input type="checkbox" data-editor="magico"> Item mágico</label><label><input type="checkbox" data-editor="sintonizado"> Sintonizado</label></div><div class="magia-modal-acoes"><button type="button" class="magia-modal-botao" data-acao="editar">✏️ Editar</button><button type="button" class="magia-modal-botao modal-close-base" data-acao="fechar">Fechar</button></div></header><div class="outro-item-detalhes" data-local="outro-detalhes"></div><form class="armadura-editor outro-editor" hidden><div class="armadura-editor-campos"><label class="armadura-editor-completo">Nome<input data-editor="nome" required></label><label>Tipo<select data-editor="tipo"></select></label><label>Raridade<select data-editor="raridade"><option value="comum">Comum</option><option value="incomum">Incomum</option><option value="raro">Raro</option><option value="muito raro">Muito raro</option><option value="lendário">Lendário</option><option value="artefato">Artefato</option></select></label><label>Quantidade<input type="number" min="0" step="1" data-editor="quantidade"></label><label>🪙 Valor<input type="number" min="0" step="0.01" data-editor="preco"></label><label>Moeda<select data-editor="moeda"><option value="pc">PC</option><option value="pp">PP</option><option value="pe">PE</option><option value="po">PO</option><option value="pl">PL</option></select></label><label>⚖️ Peso (kg)<input type="number" min="0" step="0.1" placeholder="Não informado" data-editor="peso"></label><label class="armadura-editor-completo">Descrição<textarea data-editor="descricao" rows="3"></textarea></label><label class="armadura-editor-completo outro-campo-proficiencia">Proficiência relacionada<input data-editor="proficiencia" placeholder="ID de proficiência, opcional"></label><label>Foco arcano<select data-editor="foco"><option value="">Não aplicável</option><option value="true">Pode ser usado como foco</option><option value="false">Não pode ser usado como foco</option></select></label></div><div class="armadura-editor-flags"><label><input type="checkbox" data-editor="consumivel"> Consumível</label></div><div class="armadura-editor-acoes"><button type="button" class="magia-modal-botao" data-acao="cancelar">Cancelar</button><button type="submit" class="magia-modal-botao primario">Salvar</button><span class="outro-editor-espacador"></span><button type="button" class="magia-modal-botao perigo" data-acao="remover-editor">🗑️ Remover</button></div></form><div class="inventario-modal-acoes-inferior outro-modal-remover"><button type="button" class="magia-modal-botao perigo" data-acao="remover">🗑️ Remover</button></div></section>`;
  document.body.append(modal);
  const tipo = modal.querySelector('[data-editor="tipo"]');
  estadoCatalogoOutrosTipos().forEach(([id, label]) => { const option = document.createElement("option"); option.value = id; option.textContent = label; tipo.append(option); });
  tipo.addEventListener("change", () => atualizarCampoProficienciaOutro({ limpar: true }));
  modal.querySelector('[data-acao="fechar"]').onclick = () => fecharModalOutro();
  modal.querySelector('[data-acao="editar"]').onclick = iniciarEdicaoOutro;
  modal.querySelector('[data-acao="cancelar"]').onclick = () => { if (estadoCatalogoOutros.modo !== "edicao" || capturarOutro() === estadoCatalogoOutros.retrato || confirm("Descartar as alterações feitas neste item?")) { if (estadoCatalogoOutros.nova) { estadoCatalogoOutros.card.remove(); atualizarPesoAtualInventario(); atualizarListaArmasEquipamento(); fecharModalOutro(true); } else { modal.querySelector(".outro-editor").hidden = true; modal.querySelector(".outro-editor").style.display = "none"; modal.querySelector(".outro-editor-flags").hidden = true; estadoCatalogoOutros.modo = "visualizacao"; preencherModalOutro(); modal.querySelector('[data-local="outro-detalhes"]').hidden = false; modal.querySelector('[data-acao="editar"]').hidden = false; modal.querySelector(".outro-modal-remover").hidden = false; } } };
  modal.querySelector("form").onsubmit = e => { e.preventDefault(); salvarEdicaoOutro(); };
  modal.querySelector('[data-acao="remover"]').onclick = modal.querySelector('[data-acao="remover-editor"]').onclick = () => { if (confirm("Deseja remover este item do inventário?")) { estadoCatalogoOutros.card.remove(); fecharModalOutro(true); atualizarPesoAtualInventario(); atualizarListaArmasEquipamento(); } };
  modal.querySelector('[data-editor="magico"]').addEventListener("change", e => { modal.querySelector('[data-editor="sintonizado"]').disabled = !e.target.checked; if (!e.target.checked) modal.querySelector('[data-editor="sintonizado"]').checked = false; });
  modal.querySelector('[data-editor="nome"]').addEventListener("input", atualizarProficienciaEditorOutro);
  modal.querySelector('[data-editor="proficiencia"]').addEventListener("input", atualizarProficienciaEditorOutro);
  modal.addEventListener("click", e => { if (e.target === modal) e.stopPropagation(); });
  modal.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); fecharModalOutro(); } });
}

function estadoCatalogoOutrosTipos() {
  const fallback = [["pocoes", "Poções"], ["consumivel", "Consumíveis"], ["ferramentas-kits", "Ferramentas e kits"], ["instrumentos-musicais", "Instrumentos musicais"], ["pacotes-equipamento", "Pacotes de equipamento"], ["focos-conjuracao", "Focos de conjuração"], ["componentes-materiais", "Componentes materiais"], ["equipamento-geral", "Equipamento geral"], ["tesouros-valores", "Tesouros e valores"], ["outros", "Outros"]];
  return estadoCatalogoOutros.registro?.catalogos?.map(item => [item.tipo, item.nome]) || fallback;
}

function montarSeletorOutros() {
  if (document.getElementById("outroCatalogoOverlay")) return;
  const overlay = elOutro("div", undefined, "magia-slot-modal-overlay oculto"); overlay.id = "outroCatalogoOverlay"; overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `<section class="magia-slot-modal magia-selecao-modal armadura-selecao-modal outro-selecao-modal" role="dialog" aria-modal="true" aria-labelledby="outroCatalogoTitulo"><header class="magia-selecao-cabecalho"><button type="button" class="magia-selecao-criar" data-acao="criar">Criar item</button><h2 id="outroCatalogoTitulo" class="magia-slot-modal-titulo">Adicionar item</h2><button type="button" class="magia-selecao-fechar" data-acao="fechar" aria-label="Fechar janela">×</button></header><div class="magia-selecao-filtros outro-selecao-filtros"><div><label class="magia-selecao-classe" for="outroCatalogoTipo">Tipo</label><select id="outroCatalogoTipo" class="magia-selecao-classe-select" data-filtro-tipo><option value="todos">Todos</option></select></div><div><label class="magia-selecao-classe" for="outroCatalogoBusca">Pesquisar item</label><input type="search" id="outroCatalogoBusca" class="magia-selecao-busca" data-busca placeholder="Nome do item" autocomplete="off"></div></div><p class="armadura-selecao-status" data-local="status" role="status"></p><div class="magia-selecao-conteudo"><div class="magia-selecao-lista" data-local="lista" aria-label="Itens disponíveis"></div><div class="magia-selecao-detalhes" data-local="detalhe" aria-label="Detalhes do item"></div></div></section>`;
  document.body.append(overlay);
  const select = overlay.querySelector("[data-filtro-tipo]"); estadoCatalogoOutrosTipos().forEach(([id, label]) => { const option = document.createElement("option"); option.value = id; option.textContent = label; select.append(option); });
  overlay.querySelector('[data-acao="fechar"]').onclick = fecharSelecaoOutros;
  overlay.querySelector('[data-acao="criar"]').onclick = abrirEscolhaTipoOutro;
  select.onchange = renderizarSelecaoOutros; overlay.querySelector("[data-busca]").oninput = renderizarSelecaoOutros;
  overlay.addEventListener("keydown", e => { if (e.key === "Escape") fecharSelecaoOutros(); });
}

function montarModalTipoOutro() {
  if (document.getElementById("outroTipoCriacaoOverlay")) return;
  const overlay = elOutro("div", undefined, "magia-slot-modal-overlay oculto");
  overlay.id = "outroTipoCriacaoOverlay"; overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `<section class="magia-slot-modal outro-tipo-criacao-modal" role="dialog" aria-modal="true" aria-labelledby="outroTipoCriacaoTitulo"><header class="magia-selecao-cabecalho"><h2 id="outroTipoCriacaoTitulo" class="magia-slot-modal-titulo">Criar item</h2></header><p class="outro-tipo-criacao-ajuda">Escolha o tipo do item para abrir um formulário com os campos adequados.</p><label class="magia-selecao-classe" for="outroTipoCriacaoSelect">Tipo de item</label><select id="outroTipoCriacaoSelect" class="magia-selecao-classe-select" data-tipo-criacao></select><div class="outro-tipo-criacao-acoes"><button type="button" class="magia-modal-botao" data-acao="cancelar-tipo">Cancelar</button><button type="button" class="magia-modal-botao primario" data-acao="continuar-tipo">Continuar</button></div></section>`;
  document.body.append(overlay);
  const select = overlay.querySelector("[data-tipo-criacao]");
  estadoCatalogoOutrosTipos().forEach(([id, label]) => { const option = document.createElement("option"); option.value = id; option.textContent = label; select.append(option); });
  overlay.querySelector('[data-acao="cancelar-tipo"]').onclick = fecharEscolhaTipoOutro;
  overlay.querySelector('[data-acao="continuar-tipo"]').onclick = () => {
    const tipo = select.value;
    fecharEscolhaTipoOutro(); fecharSelecaoOutros(); abrirNovoOutroManual(tipo);
  };
  overlay.addEventListener("click", event => { if (event.target === overlay) event.stopPropagation(); });
  overlay.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); fecharEscolhaTipoOutro(); } });
}

function abrirEscolhaTipoOutro() {
  montarModalTipoOutro();
  const overlay = document.getElementById("outroTipoCriacaoOverlay");
  const filtro = document.querySelector("#outroCatalogoOverlay [data-filtro-tipo]")?.value;
  const select = overlay.querySelector("[data-tipo-criacao]");
  select.value = filtro && filtro !== "todos" ? filtro : "outros";
  overlay.classList.remove("oculto"); overlay.classList.add("ativo"); overlay.setAttribute("aria-hidden", "false");
  select.focus();
}

function fecharEscolhaTipoOutro() {
  const overlay = document.getElementById("outroTipoCriacaoOverlay");
  overlay?.classList.add("oculto"); overlay?.classList.remove("ativo"); overlay?.setAttribute("aria-hidden", "true");
  document.querySelector('#outroCatalogoOverlay [data-acao="criar"]')?.focus();
}

async function abrirSelecaoOutros() {
  try { await carregarCatalogoOutros(); } catch (error) { console.error(error); montarModalOutros(); montarModalTipoOutro(); abrirEscolhaTipoOutro(); return; }
  montarModalOutros(); montarSeletorOutros(); montarModalTipoOutro();
  const overlay = document.getElementById("outroCatalogoOverlay"); estadoCatalogoOutros.selecionado = null;
  overlay.querySelector("[data-filtro-tipo]").value = "todos"; overlay.querySelector("[data-busca]").value = "";
  overlay.classList.remove("oculto"); overlay.classList.add("ativo"); overlay.setAttribute("aria-hidden", "false"); renderizarSelecaoOutros(); overlay.querySelector("[data-busca]").focus();
}

function abrirNovoOutroManual(tipo = "outros") {
  const card = adicionarNovoOutro(), f = camposOutro(card);
  f.set("catalogo_tipo", tipo); f.set("categoria", catalogoOutroNome(tipo)); f.set("tipo", tipoLegadoOutro(tipo)); f.set("nome", "");
  montarModalOutros(); abrirModalOutro(card, true); iniciarEdicaoOutro();
}

document.addEventListener("DOMContentLoaded", () => {
  montarModalOutros();
  document.addEventListener("input", event => { if (event.target.closest('#listaOutros .item-card[data-tipo="outro"]')) atualizarResumosOutros(); });
  document.addEventListener("change", event => { if (event.target.closest('#listaOutros .item-card[data-tipo="outro"]')) atualizarResumosOutros(); });
  document.getElementById("proficienciaFerramentas")?.addEventListener("input", atualizarResumosOutros);
  document.getElementById("proficienciaFerramentas")?.addEventListener("change", atualizarResumosOutros);
  new MutationObserver(() => atualizarResumosOutros()).observe(document.getElementById("listaOutros"), { childList: true });
  atualizarResumosOutros();
});
