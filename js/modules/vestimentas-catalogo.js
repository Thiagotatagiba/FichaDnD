// Cadastro e catálogo de vestimentas e acessórios. Os dados persistem no formato legado escudos[].
const estadoVestimentas = { itens: null, card: null, selecionada: null, nova: false, editando: false, retrato: null, foco: null };
const PERICIAS_VESTIMENTAS = ["Acrobacia", "Adestrar Animais", "Arcanismo", "Atletismo", "Atuação", "Enganação", "Furtividade", "História", "Intimidação", "Intuição", "Investigação", "Lidar com Animais", "Medicina", "Natureza", "Percepção", "Persuasão", "Prestidigitação", "Religião", "Sobrevivência"];
const CATEGORIAS_VESTIMENTAS = ["Vestuário", "Anel", "Calçado", "Chapéu ou capacete", "Colar", "Outro acessório"];
const RARIDADES_VESTIMENTAS = new Set(["comum", "incomum", "raro", "muito raro", "lendário", "artefato"]);

function criarElementoVestimenta(tag, texto, classe) {
  const el = document.createElement(tag);
  if (texto !== undefined) el.textContent = texto;
  if (classe) el.className = classe;
  return el;
}

function validarCatalogoVestimentas(dados) {
  if (dados?.versaoSchema !== 1 || dados.sistema !== "dnd5e-2014" ||
      !Number.isInteger(dados.versaoCatalogo) || dados.unidadePeso !== "kg" ||
      !Array.isArray(dados.itens) || !dados.itens.length) throw new Error("Catálogo de vestimentas inválido.");
  const ids = new Set();
  for (const item of dados.itens) {
    if (!item || typeof item.id !== "string" || !item.id.trim() || ids.has(item.id) ||
        typeof item.nome !== "string" || !item.nome.trim() || !CATEGORIAS_VESTIMENTAS.includes(item.categoria) ||
        !RARIDADES_VESTIMENTAS.has(item.raridade) || typeof item.descricao !== "string" ||
        !Number.isFinite(item.caBonus) || item.caBonus < 0 ||
        !Number.isFinite(item.valorPO) || item.valorPO < 0 ||
        !Number.isFinite(item.pesoKg) || item.pesoKg < 0 ||
        !Array.isArray(item.vantagensPericias) || item.vantagensPericias.some(pericia => !PERICIAS_VESTIMENTAS.includes(pericia))) {
      throw new Error("Entrada inválida no catálogo de vestimentas.");
    }
    ids.add(item.id);
  }
  return dados;
}

function lerVantagensVestimenta(valor) {
  try {
    const vantagens = Array.isArray(valor) ? valor : JSON.parse(valor || "[]");
    return Array.isArray(vantagens) ? vantagens.filter(pericia => PERICIAS_VESTIMENTAS.includes(pericia)) : [];
  } catch { return []; }
}

function normalizarPesoVestimenta(valor) {
  const peso = Number(String(valor ?? "0").replace(",", "."));
  return Number.isFinite(peso) && peso > 0 ? Math.round((peso + Number.EPSILON) * 10) / 10 : 0;
}

function formatarPesoVestimenta(valor) {
  return `${normalizarPesoVestimenta(valor).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
}

function retratoEditorVestimenta() {
  const overlay = document.getElementById("vestimentaModalOverlay");
  if (!overlay) return "";
  return JSON.stringify({
    campos: [...overlay.querySelectorAll("[data-campo]")].map(campo => campo.value),
    flags: [...overlay.querySelectorAll("[data-flag]")].map(flag => flag.checked),
    pericias: [...overlay.querySelectorAll('[data-local="pericias"] input')].map(input => input.checked),
  });
}

function confirmarDescarteEdicaoVestimenta() {
  if (!estadoVestimentas.editando || estadoVestimentas.retrato === retratoEditorVestimenta()) return true;
  return confirm("Descartar as alterações feitas nesta vestimenta ou acessório?");
}

async function carregarCatalogoVestimentas() {
  if (estadoVestimentas.itens) return estadoVestimentas.itens;
  const resposta = await fetch("../assets/data/itens/vestimentas-acessorios.json?v=3");
  if (!resposta.ok) throw new Error("Catálogo de vestimentas indisponível.");
  const dados = await resposta.json();
  estadoVestimentas.itens = validarCatalogoVestimentas(dados).itens;
  return dados.itens;
}

function atualizarResumosVestimentas() {
  document.querySelectorAll('#listaVestimentas .item-card[data-tipo="escudo"]').forEach(card => {
    card.classList.add("vestimenta-catalogo");
    let resumo = card.querySelector(".vestimenta-resumo");
    if (!resumo) {
      resumo = criarElementoVestimenta("div", undefined, "vestimenta-resumo");
      const abrir = criarElementoVestimenta("button", undefined, "magia-item armadura-abrir vestimenta-abrir");
      abrir.type = "button";
      abrir.innerHTML = '<span class="armadura-cartao-info"><span class="armadura-cartao-topo"><strong class="magia-item-nome"></strong><span class="armadura-cartao-estado"></span></span><span class="armadura-cartao-dados"><span class="escudo-cartao-ca"><span class="escudo-cartao-ca-rotulo">Bônus de CA</span><strong class="armadura-cartao-ca"></strong></span><span class="vestimenta-cartao-vantagens"></span></span><span class="armadura-cartao-rodape"><span class="vestimenta-cartao-tags"></span><span class="armadura-cartao-meta"></span></span></span>';
      abrir.addEventListener("click", () => abrirModalVestimenta(card));
      resumo.append(abrir);
      card.querySelector(".item-header")?.after(resumo);
    }
    const campo = nome => card.querySelector(`[data-campo="escudo_${nome}"]`);
    const nome = campo("nome")?.value.trim() || "Nova vestimenta";
    const equipada = campo("equipado")?.value === "true";
    const raridade = campo("raridade")?.value || "comum";
    const bonus = Number(campo("ca")?.value.replace("+", "")) || 0;
    const peso = normalizarPesoVestimenta(campo("peso")?.value);
    if (campo("peso") && String(peso) !== campo("peso").value) campo("peso").value = String(peso);
    const abrir = resumo.querySelector("button");
    abrir.querySelector(".magia-item-nome").textContent = nome;
    abrir.querySelector(".armadura-cartao-ca").textContent = `+${bonus}`;
    abrir.querySelector(".escudo-cartao-ca").hidden = bonus === 0;
    abrir.querySelector(".armadura-cartao-estado").textContent = equipada ? "Equipado" : "›";
    abrir.classList.toggle("armadura-equipada", equipada);
    const tags = abrir.querySelector(".vestimenta-cartao-tags"); tags.replaceChildren();
    tags.append(criarElementoVestimenta("span", campo("categoria")?.value || "Vestuário", "escudo-cartao-tag"));
    tags.append(criarElementoVestimenta("span", raridade, "escudo-cartao-tag"));
    if (card.querySelector(".item-flag-magico")?.checked) tags.append(criarElementoVestimenta("span", "Mágico", "escudo-cartao-tag"));
    if (card.querySelector(".item-flag-sintonizado")?.checked) tags.append(criarElementoVestimenta("span", "Sintonizado", "escudo-cartao-tag"));
    const pericias = lerVantagensVestimenta(campo("vantagens_pericias")?.value);
    const vantagens = abrir.querySelector(".vestimenta-cartao-vantagens");
    vantagens.textContent = pericias.length ? "Vantagem: " + pericias.join(", ") : "";
    abrir.querySelector(".armadura-cartao-meta").textContent = `🪙 ${Number(campo("preco")?.value) || 0} PO   ⚖️ ${formatarPesoVestimenta(peso)}`;
  });
}

function montarModalVestimenta() {
  if (document.getElementById("vestimentaModalOverlay")) return;
  const overlay = criarElementoVestimenta("div", undefined, "magia-modal-overlay modal-overlay-base oculto");
  overlay.id = "vestimentaModalOverlay";
  overlay.innerHTML = `<section class="magia-modal modal-base armadura-modal escudo-modal vestimenta-modal" role="dialog" aria-modal="true" aria-labelledby="vestimentaModalTitulo"><header class="magia-modal-topo modal-header-base"><div class="magia-modal-topo-info"><div class="armadura-modal-titulo-linha"><span class="armadura-modal-icone" aria-hidden="true">💍</span><h2 id="vestimentaModalTitulo" class="magia-modal-titulo">Vestimenta ou acessório</h2><button type="button" class="magia-modal-botao armadura-modal-equipar" data-acao="equipar">Equipar</button></div><div class="armadura-modal-categorias escudo-modal-categorias" data-local="tags"></div></div><div class="magia-modal-acoes"><button type="button" class="magia-modal-botao" data-acao="editar">✏️ Editar</button><button type="button" class="magia-modal-botao modal-close-base" data-acao="fechar">Fechar</button></div></header><div data-local="visualizacao"></div><form class="armadura-editor vestimenta-editor" hidden style="display:none"><input type="hidden" data-campo="equipado" value="false"><input type="hidden" data-campo="vantagens_pericias" value="[]"><div class="armadura-editor-campos"><label class="armadura-editor-completo">Nome<input data-campo="nome" required></label><label>Categoria<select data-campo="categoria"><option>Vestuário</option><option>Anel</option><option>Calçado</option><option>Chapéu ou capacete</option><option>Colar</option><option>Outro acessório</option></select></label><label>Raridade<select data-campo="raridade"><option value="comum">Comum</option><option value="incomum">Incomum</option><option value="raro">Raro</option><option value="muito raro">Muito raro</option><option value="lendário">Lendário</option><option value="artefato">Artefato</option></select></label><label>🪙 Valor (PO)<input type="number" min="0" step="0.1" data-campo="preco"></label><label>⚖️ Peso (kg)<input type="number" min="0" step="0.1" data-campo="peso"></label><label>Bônus de CA<input type="number" min="0" step="1" data-campo="ca" value="0"></label><details class="vestimenta-vantagens armadura-editor-completo"><summary>Vantagem em testes de perícia</summary><div data-local="pericias"></div></details><label class="armadura-editor-completo vestimenta-descricao">Descrição<textarea data-campo="descricao" rows="3"></textarea></label></div><div class="armadura-editor-flags vestimenta-flags"><label><input type="checkbox" data-flag="item_magico"><span>Item mágico</span></label><label class="vestimenta-sintonizado"><input type="checkbox" data-flag="sintonizado"><span>Sintonizado</span></label></div><div class="armadura-editor-acoes"><button type="button" class="magia-modal-botao perigo" data-acao="remover">Excluir item</button><button type="button" class="magia-modal-botao" data-acao="cancelar">Cancelar</button><button type="submit" class="magia-modal-botao primario">Salvar</button></div></form></section>`;
  document.body.append(overlay);
  const pericias = overlay.querySelector('[data-local="pericias"]');
  PERICIAS_VESTIMENTAS.forEach(nome => { const label = criarElementoVestimenta("label"); const input = document.createElement("input"); input.type = "checkbox"; input.value = nome; label.append(input, document.createTextNode(nome)); pericias.append(label); });
  overlay.addEventListener("click", e => { if (e.target.closest('[data-acao="fechar"]')) fecharModalVestimenta(); });
  overlay.querySelector('[data-acao="editar"]').addEventListener("click", editarModalVestimenta);
  overlay.querySelector('[data-acao="cancelar"]').addEventListener("click", () => cancelarEdicaoVestimenta());
  overlay.querySelector('[data-acao="equipar"]').addEventListener("click", () => {
    const f = nome => overlay.querySelector(`[data-campo="${nome}"]`);
    f("equipado").value = f("equipado").value === "true" ? "false" : "true";
    estadoVestimentas.card.querySelector('[data-campo="escudo_equipado"]').value = f("equipado").value;
    atualizarCabecalhoModalVestimenta();
    atualizarListaArmasEquipamento();
  });
  overlay.querySelector("form").addEventListener("submit", e => { e.preventDefault(); salvarModalVestimenta(); });
  overlay.querySelector('[data-flag="item_magico"]').addEventListener("change", e => {
    overlay.querySelector(".vestimenta-sintonizado").hidden = !e.target.checked;
    if (!e.target.checked) overlay.querySelector('[data-flag="sintonizado"]').checked = false;
    atualizarCabecalhoModalVestimenta();
  });
  overlay.querySelector('[data-campo="nome"]').addEventListener("input", atualizarCabecalhoModalVestimenta);
  overlay.querySelector('[data-campo="raridade"]').addEventListener("change", atualizarCabecalhoModalVestimenta);
  overlay.querySelector('[data-flag="sintonizado"]').addEventListener("change", atualizarCabecalhoModalVestimenta);
  overlay.querySelector('[data-acao="remover"]').addEventListener("click", () => { if (confirm("Deseja remover esta vestimenta ou acessório?")) { estadoVestimentas.card.remove(); fecharModalVestimenta(true); atualizarPesoAtualInventario(); atualizarListaArmasEquipamento(); atualizarResumosVestimentas(); } });
  overlay.addEventListener("keydown", evento => {
    if (evento.key === "Escape") { evento.preventDefault(); fecharModalVestimenta(); return; }
    if (evento.key !== "Tab") return;
    const focaveis = [...overlay.querySelectorAll("button, input, select, textarea, summary")].filter(el => !el.disabled && !el.hidden && el.getClientRects().length);
    const primeiro = focaveis[0], ultimo = focaveis.at(-1);
    if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo?.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro?.focus(); }
  });
}

function abrirModalVestimenta(card, nova = false) {
  estadoVestimentas.foco = document.activeElement;
  estadoVestimentas.nova = nova;
  estadoVestimentas.editando = false;
  estadoVestimentas.retrato = null;
  montarModalVestimenta(); estadoVestimentas.card = card;
  preencherEditorVestimenta(card);
  atualizarCabecalhoModalVestimenta();
  mostrarVisualizacaoVestimenta();
  const overlay = document.getElementById("vestimentaModalOverlay");
  overlay.classList.remove("oculto"); overlay.classList.add("ativo"); overlay.setAttribute("aria-hidden", "false");
}

function preencherEditorVestimenta(card) {
  const overlay = document.getElementById("vestimentaModalOverlay");
  const campos = { nome: "nome", categoria: "categoria", raridade: "raridade", ca: "ca", descricao: "descricao", preco: "preco", peso: "peso", equipado: "equipado", vantagens_pericias: "vantagens_pericias" };
  for (const [nome, chave] of Object.entries(campos)) { const el = overlay.querySelector(`[data-campo="${nome}"]`); if (el) el.value = card.querySelector(`[data-campo="escudo_${chave}"]`)?.value || (nome === "categoria" ? "Vestuário" : nome === "raridade" ? "comum" : nome === "ca" ? "0" : nome === "vantagens_pericias" ? "[]" : ""); }
  overlay.querySelectorAll('[data-local="pericias"] input').forEach(input => input.checked = lerVantagensVestimenta(overlay.querySelector('[data-campo="vantagens_pericias"]').value).includes(input.value));
  overlay.querySelector('[data-flag="item_magico"]').checked = !!card.querySelector('.item-flag-magico')?.checked;
  overlay.querySelector('[data-flag="sintonizado"]').checked = !!card.querySelector('.item-flag-sintonizado')?.checked;
  overlay.querySelector(".vestimenta-sintonizado").hidden = !overlay.querySelector('[data-flag="item_magico"]').checked;
}

function editarModalVestimenta() {
  preencherEditorVestimenta(estadoVestimentas.card);
  document.querySelector('#vestimentaModalOverlay [data-local="visualizacao"]').hidden = true;
  const form = document.querySelector("#vestimentaModalOverlay form");
  form.hidden = false; form.style.display = "";
  document.querySelector("#vestimentaModalOverlay .magia-modal-topo").append(document.querySelector("#vestimentaModalOverlay .vestimenta-flags"));
  document.querySelector('#vestimentaModalOverlay [data-acao="equipar"]').hidden = true;
  document.querySelector('#vestimentaModalOverlay [data-acao="editar"]').hidden = true;
  document.querySelector('#vestimentaModalOverlay [data-acao="fechar"]').hidden = true;
  estadoVestimentas.editando = true;
  estadoVestimentas.retrato = retratoEditorVestimenta();
  form.querySelector('[data-campo="nome"]').focus();
}

function mostrarVisualizacaoVestimenta() {
  const form = document.querySelector("#vestimentaModalOverlay form");
  const flags = document.querySelector("#vestimentaModalOverlay .vestimenta-flags");
  if (flags && flags.parentElement !== form) form.append(flags);
  form.hidden = true; form.style.display = "none";
  document.querySelector('#vestimentaModalOverlay [data-acao="equipar"]').hidden = false;
  document.querySelector('#vestimentaModalOverlay [data-acao="editar"]').hidden = false;
  document.querySelector('#vestimentaModalOverlay [data-acao="fechar"]').hidden = false;
  document.querySelector('#vestimentaModalOverlay [data-local="visualizacao"]').hidden = false;
  estadoVestimentas.editando = false;
  estadoVestimentas.retrato = null;
  renderizarModalVestimenta();
}

function cancelarEdicaoVestimenta() {
  if (!confirmarDescarteEdicaoVestimenta()) return;
  if (estadoVestimentas.nova) {
    estadoVestimentas.card?.remove();
    fecharModalVestimenta(true);
    atualizarPesoAtualInventario(); atualizarListaArmasEquipamento(); atualizarResumosVestimentas();
    return;
  }
  mostrarVisualizacaoVestimenta();
}

function renderizarModalVestimenta() {
  const overlay = document.getElementById("vestimentaModalOverlay"), card = estadoVestimentas.card;
  if (!overlay || !card) return;
  atualizarCabecalhoModalVestimenta();
  const valor = nome => card.querySelector(`[data-campo="escudo_${nome}"]`)?.value || "";
  const visual = overlay.querySelector('[data-local="visualizacao"]');
  const article = criarElementoVestimenta("article", undefined, "magia-card-detalhe armadura-detalhe vestimenta-detalhe");
  const valores = criarElementoVestimenta("div", undefined, "arma-detalhe-valores");
  [["🪙 Valor", `${Number(valor("preco")) || 0} PO`], ["⚖️ Peso", formatarPesoVestimenta(valor("peso"))]].forEach(([rotulo, texto]) => {
    const campo = criarElementoVestimenta("div", undefined, "arma-detalhe-valor");
    campo.append(criarElementoVestimenta("span", rotulo), criarElementoVestimenta("strong", texto)); valores.append(campo);
  });
  const caBonus = Number(valor("ca")) || 0;
  if (caBonus !== 0) { const ca = criarElementoVestimenta("div", undefined, "arma-detalhe-valor"); ca.append(criarElementoVestimenta("span", "Bônus de CA"), criarElementoVestimenta("strong", `+${caBonus}`)); valores.append(ca); }
  article.append(valores);
  const vantagens = lerVantagensVestimenta(valor("vantagens_pericias"));
  if (vantagens.length) article.append(criarElementoVestimenta("p", `Vantagem em testes de perícia: ${vantagens.join(", ")}`, "vestimenta-detalhe-vantagens"));
  const descricao = criarElementoVestimenta("section", undefined, "armadura-descricao");
  descricao.append(criarElementoVestimenta("h4", "Descrição"), criarElementoVestimenta("p", valor("descricao") || "Nenhuma descrição cadastrada."));
  article.append(descricao); visual.replaceChildren(article);
  const acoesRemocao=criarElementoVestimenta("div",undefined,"inventario-modal-acoes-inferior");const remover=criarElementoVestimenta("button","🗑️ Remover","magia-modal-botao perigo");remover.type="button";remover.setAttribute("aria-label","Remover vestimenta ou acessório");remover.addEventListener("click",()=>document.querySelector('#vestimentaModalOverlay [data-acao="remover"]').click());visual.append(acoesRemocao);acoesRemocao.append(remover);
  overlay.querySelector('[data-acao="equipar"]').textContent = valor("equipado") === "true" ? "Desequipar" : "Equipar";
}

function fecharModalVestimenta(forcar = false) {
  const overlay = document.getElementById("vestimentaModalOverlay");
  if (!overlay) return;
  if (!forcar && estadoVestimentas.editando) {
    if (!confirmarDescarteEdicaoVestimenta()) return;
    if (estadoVestimentas.nova) {
      estadoVestimentas.card?.remove();
      atualizarPesoAtualInventario(); atualizarListaArmasEquipamento(); atualizarResumosVestimentas();
    }
  }
  overlay.classList.add("oculto"); overlay.classList.remove("ativo"); overlay.setAttribute("aria-hidden", "true");
  estadoVestimentas.editando = false; estadoVestimentas.retrato = null; estadoVestimentas.nova = false;
  if (estadoVestimentas.foco?.isConnected) estadoVestimentas.foco.focus();
}

function atualizarCabecalhoModalVestimenta() {
  const overlay = document.getElementById("vestimentaModalOverlay");
  if (!overlay || !estadoVestimentas.card) return;
  const valor = nome => overlay.querySelector(`[data-campo="${nome}"]`)?.value || "";
  const nome = valor("nome").trim() || "Nova vestimenta";
  overlay.querySelector("#vestimentaModalTitulo").textContent = nome;
  const tags = overlay.querySelector('[data-local="tags"]'); tags.replaceChildren();
  const equipado = valor("equipado") === "true";
  if (equipado) tags.append(criarElementoVestimenta("span", "Equipado", "magia-modal-nivel escudo-modal-equipado"));
  tags.append(criarElementoVestimenta("span", valor("raridade") || "Comum", "magia-modal-nivel"));
  tags.append(criarElementoVestimenta("span", valor("categoria") || "Vestuário", "magia-modal-nivel"));
  if (overlay.querySelector('[data-flag="item_magico"]').checked) tags.append(criarElementoVestimenta("span", "Item mágico", "magia-modal-nivel"));
  if (overlay.querySelector('[data-flag="sintonizado"]').checked) tags.append(criarElementoVestimenta("span", "Sintonizado", "magia-modal-nivel"));
  overlay.querySelector('[data-acao="equipar"]').textContent = equipado ? "Desequipar" : "Equipar";
}

function salvarModalVestimenta() {
  const overlay = document.getElementById("vestimentaModalOverlay"), card = estadoVestimentas.card;
  const campos = { nome: "nome", categoria: "categoria", raridade: "raridade", ca: "ca", descricao: "descricao", preco: "preco", peso: "peso", equipado: "equipado" };
  for (const [chave, legado] of Object.entries(campos)) { const input = overlay.querySelector(`[data-campo="${chave}"]`), destino = card.querySelector(`[data-campo="escudo_${legado}"]`); if (input && destino) destino.value = input.value; }
  const campoPeso = card.querySelector('[data-campo="escudo_peso"]');
  if (campoPeso) campoPeso.value = String(normalizarPesoVestimenta(campoPeso.value));
  card.querySelector('[data-campo="escudo_vantagens_pericias"]').value = JSON.stringify([...overlay.querySelectorAll('[data-local="pericias"] input:checked')].map(x => x.value));
  card.querySelector('.item-flag-magico').checked = overlay.querySelector('[data-flag="item_magico"]').checked;
  card.querySelector('.item-flag-sintonizado').checked = overlay.querySelector('[data-flag="sintonizado"]').checked;
  estadoVestimentas.nova = false;
  atualizarCamposMagicosItem(card); atualizarPesoAtualInventario(); atualizarListaArmasEquipamento(); atualizarResumosVestimentas(); mostrarVisualizacaoVestimenta();
}

function fecharSelecaoVestimenta() {
  const overlay = document.getElementById("vestimentaSelecaoOverlay");
  overlay?.classList.add("oculto");
  overlay?.classList.remove("ativo");
  if (estadoVestimentas.foco?.isConnected) estadoVestimentas.foco.focus();
}

function adicionarVestimentaCatalogo(item) {
  fecharSelecaoVestimenta();
  const card = adicionarNovoEscudo("Vestuario");
  card.querySelector('[data-campo="escudo_nome"]').value = item.nome;
  card.querySelector('[data-campo="escudo_categoria"]').value = item.categoria;
  card.querySelector('[data-campo="escudo_raridade"]').value = item.raridade || "comum";
  card.querySelector('[data-campo="escudo_ca"]').value = String(item.caBonus || 0);
  card.querySelector('[data-campo="escudo_descricao"]').value = item.descricao || "";
  card.querySelector('[data-campo="escudo_preco"]').value = String(item.valorPO || 0);
  card.querySelector('[data-campo="escudo_peso"]').value = String(normalizarPesoVestimenta(item.pesoKg));
  card.querySelector('[data-campo="escudo_vantagens_pericias"]').value = JSON.stringify(item.vantagensPericias || []);
  fecharItemCard(card);
  atualizarResumosVestimentas();
  atualizarPesoAtualInventario();
  atualizarListaArmasEquipamento();
}

function formatarValorVestimenta(valor) {
  return `${(Number(valor) || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} PO`;
}

function renderizarSelecaoVestimenta(termo = "") {
  const overlay = document.getElementById("vestimentaSelecaoOverlay");
  const lista = overlay.querySelector(".magia-selecao-lista");
  const painel = overlay.querySelector(".magia-selecao-detalhes");
  const categoria = overlay.querySelector("#vestimentaSelecaoCategoria").value;
  const itens = estadoVestimentas.itens.filter(item =>
    (categoria === "todas" || item.categoria === categoria) &&
    textoBuscaEscudo(item.nome + " " + item.categoria).includes(textoBuscaEscudo(termo)));
  lista.replaceChildren(); painel.replaceChildren();
  itens.forEach(item => {
    const botao = criarElementoVestimenta("button", undefined, "magia-selecao-item vestimenta-opcao");
    botao.type = "button";
    botao.setAttribute("aria-pressed", String(estadoVestimentas.selecionada?.id === item.id));
    if (estadoVestimentas.selecionada?.id === item.id) botao.classList.add("selecionado");
    const valorPeso = `${formatarValorVestimenta(item.valorPO)} · ${formatarPesoVestimenta(item.pesoKg)}`;
    botao.append(criarElementoVestimenta("strong", item.nome), criarElementoVestimenta("span", `${item.categoria} · ${item.raridade || "comum"} · ${valorPeso}`));
    botao.addEventListener("click", () => { estadoVestimentas.selecionada = item; renderizarSelecaoVestimenta(overlay.querySelector("input[type=search]").value); });
    lista.append(botao);
  });
  overlay.querySelector(".armadura-selecao-status").textContent = itens.length
    ? `${itens.length} ${itens.length === 1 ? "item disponível" : "itens disponíveis"} · valores em PO · pesos em kg`
    : "Nenhum item encontrado com esses filtros.";
  if (!itens.length) { estadoVestimentas.selecionada = null; painel.append(criarElementoVestimenta("p", "Nenhum item encontrado.")); return; }
  if (!itens.some(item => item.id === estadoVestimentas.selecionada?.id)) estadoVestimentas.selecionada = itens[0];
  const item = estadoVestimentas.selecionada;
  const detalhe = criarElementoVestimenta("article", undefined, "magia-card-detalhe armadura-detalhe arma-detalhe arma-previa-catalogo vestimenta-selecao-previa");
  const header = criarElementoVestimenta("header", undefined, "magia-card-detalhe-header arma-detalhe-header");
  const titulo = criarElementoVestimenta("div", undefined, "armadura-detalhe-titulo");
  titulo.append(criarElementoVestimenta("span", "💍", "armadura-modal-icone"), criarElementoVestimenta("h3", item.nome, "magia-card-detalhe-nome"));
  const tag = criarElementoVestimenta("span", `${item.categoria} · ${item.raridade || "comum"}`, "magia-modal-nivel armadura-previa-categoria");
  titulo.append(tag);
  const adicionar = criarElementoVestimenta("button", "Adicionar ao inventário", "magia-card-detalhe-adicionar");
  adicionar.type = "button"; adicionar.addEventListener("click", () => adicionarVestimentaCatalogo(item));
  header.append(titulo, adicionar);
  const valores = criarElementoVestimenta("div", undefined, "arma-detalhe-valores vestimenta-selecao-valores");
  [["🪙 Valor", formatarValorVestimenta(item.valorPO)], ["⚖️ Peso", formatarPesoVestimenta(item.pesoKg)]].forEach(([rotulo, texto]) => {
    const campo = criarElementoVestimenta("div", undefined, "arma-detalhe-valor");
    campo.append(criarElementoVestimenta("span", rotulo), criarElementoVestimenta("strong", texto));
    valores.append(campo);
  });
  if (Number(item.caBonus) !== 0) {
    const ca = criarElementoVestimenta("div", undefined, "arma-detalhe-valor");
    ca.append(criarElementoVestimenta("span", "Bônus de CA"), criarElementoVestimenta("strong", `+${item.caBonus}`));
    valores.append(ca);
  }
  const tags = criarElementoVestimenta("div", undefined, "magia-card-detalhe-propriedades arma-detalhe-propriedades");
  tags.append(criarElementoVestimenta("span", item.categoria, "magia-card-detalhe-tag"));
  if ((item.raridade || "comum").toLowerCase() !== "comum") tags.append(criarElementoVestimenta("span", item.raridade, "magia-card-detalhe-tag"));
  const descricao = criarElementoVestimenta("section", undefined, "armadura-descricao");
  descricao.append(criarElementoVestimenta("h4", "Descrição"), criarElementoVestimenta("p", item.descricao || "Sem descrição."));
  detalhe.append(header, valores, tags, descricao);
  painel.append(detalhe);
}

async function abrirModalSelecaoVestimenta() {
  try { await carregarCatalogoVestimentas(); }
  catch { alert("Não foi possível carregar o catálogo de vestimentas e acessórios."); return; }
  let overlay = document.getElementById("vestimentaSelecaoOverlay");
  if (!overlay) {
    overlay = criarElementoVestimenta("div", undefined, "magia-slot-modal-overlay oculto");
    overlay.id = "vestimentaSelecaoOverlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `<section class="magia-slot-modal magia-selecao-modal armadura-selecao-modal vestimenta-selecao-modal" role="dialog" aria-modal="true" aria-labelledby="vestimentaSelecaoTitulo"><header class="magia-selecao-cabecalho"><button type="button" class="magia-selecao-criar" data-acao="criar">Criar vestimenta</button><h2 id="vestimentaSelecaoTitulo" class="magia-slot-modal-titulo">Adicionar vestimenta ou acessório</h2><button type="button" class="magia-selecao-fechar" data-acao="fechar" aria-label="Fechar janela">×</button></header><div class="magia-selecao-filtros vestimenta-selecao-filtros"><div><label class="magia-selecao-classe" for="vestimentaSelecaoCategoria">Categoria</label><select id="vestimentaSelecaoCategoria" class="magia-selecao-classe-select"><option value="todas">Todas</option><option>Vestuário</option><option>Anel</option><option>Calçado</option><option>Chapéu ou capacete</option><option>Colar</option><option>Outro acessório</option></select></div><div><label class="magia-selecao-classe" for="vestimentaBusca">Pesquisar item</label><input type="search" id="vestimentaBusca" class="magia-selecao-busca" placeholder="Nome do item" autocomplete="off"></div></div><p class="armadura-selecao-status" role="status"></p><div class="magia-selecao-conteudo"><div class="magia-selecao-lista" aria-label="Vestimentas disponíveis"></div><div class="magia-selecao-detalhes" aria-label="Detalhes da vestimenta"></div></div></section>`;
    document.body.append(overlay);
    overlay.querySelector('[data-acao="fechar"]').onclick = fecharSelecaoVestimenta;
    overlay.querySelector('[data-acao="criar"]').onclick = () => { fecharSelecaoVestimenta(); const card = adicionarNovoEscudo("Vestuario"); abrirModalVestimenta(card, true); editarModalVestimenta(); };
    overlay.querySelector("input[type=search]").addEventListener("input", e => renderizarSelecaoVestimenta(e.target.value));
    overlay.querySelector("#vestimentaSelecaoCategoria").addEventListener("change", () => renderizarSelecaoVestimenta(overlay.querySelector("input[type=search]").value));
    overlay.addEventListener("keydown", e => {
      if (e.key === "Escape") { e.preventDefault(); fecharSelecaoVestimenta(); return; }
      if (e.key !== "Tab") return;
      const focaveis = [...overlay.querySelectorAll("button, input, select")].filter(el => !el.disabled && el.getClientRects().length);
      const primeiro = focaveis[0], ultimo = focaveis.at(-1);
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo?.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro?.focus(); }
    });
  }
  estadoVestimentas.foco = document.activeElement;
  estadoVestimentas.selecionada = estadoVestimentas.itens[0] || null;
  overlay.querySelector("input[type=search]").value = "";
  overlay.querySelector("#vestimentaSelecaoCategoria").value = "todas";
  overlay.classList.remove("oculto"); overlay.classList.add("ativo"); overlay.setAttribute("aria-hidden", "false");
  renderizarSelecaoVestimenta();
  overlay.querySelector("input[type=search]").focus();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('#listaVestimentas .item-card[data-tipo="escudo"]').forEach(card => card.addEventListener("click", e => { if (e.target.closest(".item-header")) abrirModalVestimenta(card); }));
  document.querySelectorAll('#inventarioTituloVestimentas .armadura-titulo-icone, #listaVestimentas + .inventario-botao-add').forEach(btn => { btn.onclick = abrirModalSelecaoVestimenta; });
  atualizarResumosVestimentas();
});
