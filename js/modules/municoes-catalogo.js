// Catálogo e instâncias de munição. Quantidade é contada em projéteis;
// peso e preço do catálogo representam um pacote completo.
const estadoCatalogoMunicoes = { itens: null, promessa: null };

function validarCatalogoMunicoes(dados) {
  if (dados?.versaoSchema !== 1 || dados.sistema !== "dnd5e-2014" || dados.unidadePeso !== "kg" || !Array.isArray(dados.itens)) throw new Error("Catálogo de munições incompatível.");
  const ids = new Set();
  for (const item of dados.itens) {
    if (!item.id || ids.has(item.id) || item.tipo !== "municao" || item.raridade !== "comum" || !item.nome || !item.nomeCard || !item.nomeUnidade || !Array.isArray(item.compatibilidade) || !Number.isInteger(item.quantidadePacote) || item.quantidadePacote < 1 || !Number.isFinite(item.pesoPacoteKg) || item.pesoPacoteKg < 0 || !Number.isFinite(item.custo?.valor) || !["po", "pp", "pc"].includes(item.custo.moeda) || typeof item.descricao !== "string") throw new Error("Entrada inválida no catálogo de munições.");
    ids.add(item.id);
  }
  return dados;
}

async function carregarCatalogoMunicoes() {
  if (estadoCatalogoMunicoes.itens) return estadoCatalogoMunicoes.itens;
  if (!estadoCatalogoMunicoes.promessa) estadoCatalogoMunicoes.promessa = fetch("../assets/data/itens/municoes.json").then(r => { if (!r.ok) throw new Error("Catálogo de munições indisponível."); return r.json(); }).then(validarCatalogoMunicoes).then(d => (estadoCatalogoMunicoes.itens = d.itens)).finally(() => { estadoCatalogoMunicoes.promessa = null; });
  return estadoCatalogoMunicoes.promessa;
}

function criarCampoMunicao(nome, valor) { const input = document.createElement("input"); input.type = "hidden"; input.dataset.campo = nome; input.value = valor ?? ""; return input; }
function obterCamposMunicao(card) {
  if (!card) return null;
  const obj = { id: card.dataset.id };
  card.querySelectorAll("[data-campo^='municao_']").forEach(c => obj[c.dataset.campo] = c.value);
  return obj;
}
function coletarMunicoes() { return [...document.querySelectorAll("#listaMunicoes .item-card[data-tipo='municao']")].map(obterCamposMunicao); }
function localizarMunicao(id) { return [...document.querySelectorAll("#listaMunicoes .item-card[data-tipo='municao']")].find(c => c.dataset.id === String(id)); }
function buscarDadosMunicao(id) { const atual = localizarMunicao(id); if (atual) return obterCamposMunicao(atual); const legado = [...document.querySelectorAll('#listaOutros .item-card[data-tipo="outro"]')].find(c => c.dataset.id === String(id) && String(c.querySelector('[data-campo="outro_tipo"]')?.value || "").toLowerCase() === "municao"); if (!legado) return null; return { id:legado.dataset.id, municao_nome:legado.querySelector('[data-campo="outro_nome"]')?.value || "", municao_quantidade:legado.querySelector('[data-campo="outro_quantidade"]')?.value || "0" }; }
function formatoPesoMunicao(peso) { return `${Number(peso || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`; }
function obterApresentacaoPacoteMunicao(dados = {}) {
  const itemCatalogo = estadoCatalogoMunicoes.itens?.find(item => item.id === dados.municao_catalogo_id);
  const nome = dados.municao_nome || "Munição";
  const nomePacote = itemCatalogo?.nomeCard || (dados.municao_catalogo_id === "virotes" ? "Estojo de Virotes" : dados.municao_catalogo_id === "flechas" ? "Aljava de Flechas" : `Pacote de ${nome}`);
  const nomeUnidade = itemCatalogo?.nomeUnidade || nome;
  const quantidadePacote = Math.max(1, Number(dados.municao_quantidade_pacote) || itemCatalogo?.quantidadePacote || 1);
  return { nomePacote, nomeUnidade, quantidadePacote, etiquetaPacote: `Pacote de ${quantidadePacote} ${nomeUnidade}` };
}
function criarCardMunicao(dados = {}) {
  const card = document.createElement("article"); card.className = "item-card fechado municao-card"; card.dataset.tipo = "municao"; card.dataset.id = String(dados.id || (typeof gerarId === "function" ? gerarId() : `mun_${Date.now()}_${Math.random().toString(36).slice(2,7)}`));
  const valores = { municao_nome: dados.municao_nome || dados.outro_nome || "", municao_quantidade: dados.municao_quantidade ?? dados.outro_quantidade ?? 0, municao_descricao: dados.municao_descricao || dados.outro_descricao || "", municao_catalogo_id: dados.municao_catalogo_id || "", municao_quantidade_pacote: dados.municao_quantidade_pacote || 1, municao_peso_pacote: dados.municao_peso_pacote ?? 0, municao_preco_pacote: dados.municao_preco_pacote ?? dados.outro_preco ?? 0, municao_moeda: dados.municao_moeda || "po", municao_raridade: dados.municao_raridade || "comum", municao_magica: dados.municao_magica || "false", municao_bonus_ataque: dados.municao_bonus_ataque ?? 0, municao_bonus_dano: dados.municao_bonus_dano || "" };
  Object.entries(valores).forEach(([k,v]) => card.appendChild(criarCampoMunicao(k,v)));
  const resumo = document.createElement("div"); resumo.className = "arma-resumo municao-resumo";
  const head = document.createElement("button"); head.type = "button"; head.className = "magia-item armadura-abrir municao-card-head"; head.setAttribute("aria-label", `Exibir ${valores.municao_nome || "munição"}`);
  const topo = document.createElement("span"); topo.className = "armadura-cartao-topo municao-card-topo";
  const title = document.createElement("strong"); title.className = "magia-item-nome municao-card-nome"; title.textContent = valores.municao_nome || "Pacote de munição";
  const chevron = document.createElement("span"); chevron.className = "municao-card-chevron"; chevron.textContent = "›"; topo.append(title, chevron); head.append(topo); resumo.append(head);
  const content = document.createElement("div"); content.className = "municao-card-conteudo";
  const controls = document.createElement("div"); controls.className = "municao-card-controls";
  const quantityLabel = document.createElement("span"); quantityLabel.className = "municao-card-quantidade-rotulo"; quantityLabel.textContent = "Quantidade atual";
  const quantityLine = document.createElement("div"); quantityLine.className = "municao-card-quantidade-linha";
  const qty = document.createElement("input"); qty.type = "number"; qty.min = "0"; qty.step = "1"; qty.value = valores.municao_quantidade; qty.className = "municao-quantidade"; qty.setAttribute("aria-label", `Quantidade de ${valores.municao_nome}`); qty.addEventListener("click", e => e.stopPropagation());
  const sincronizarQuantidade = (permitirVazio = false) => {
    if (!permitirVazio && qty.value.trim() === "") return;
    const field = card.querySelector('[data-campo="municao_quantidade"]');
    const max = Number(qty.max) || 1;
    field.value = String(Math.min(max, Math.max(0, Math.floor(Number(qty.value) || 0))));
    qty.value = field.value;
    atualizarCardMunicao(card);
    if (typeof atualizarResumosArmas === "function") atualizarResumosArmas();
    else if (typeof atualizarListaArmasEquipamento === "function") atualizarListaArmasEquipamento();
    else if (typeof atualizarTodasMunicoesArmas === "function") atualizarTodasMunicoesArmas();
    if (typeof atualizarSeletoresAtaqueEquipados === "function") atualizarSeletoresAtaqueEquipados();
    if (typeof atualizarPesoAtualInventario === "function") atualizarPesoAtualInventario();
  };
  qty.addEventListener("input", () => sincronizarQuantidade());
  qty.addEventListener("change", () => sincronizarQuantidade(true));
  const unit = document.createElement("span"); unit.className = "municao-card-unidade";
  const tags = document.createElement("span"); tags.className = "municao-card-tags"; quantityLine.append(qty, unit, tags); controls.append(quantityLabel, quantityLine);
  const capacity = document.createElement("span"); capacity.className = "municao-card-capacidade arma-cartao-tag";
  const meta = document.createElement("span"); meta.className = "armadura-cartao-meta municao-card-meta";
  const footer = document.createElement("div"); footer.className = "municao-card-rodape"; footer.append(capacity, meta);
  content.append(controls, footer); resumo.append(content); card.append(resumo);
  head.addEventListener("click", () => abrirDetalhesMunicao(card));
  document.getElementById("listaMunicoes")?.appendChild(card); atualizarCardMunicao(card); return card;
}
function atualizarCardMunicao(card) { if (!card) return; const d = obterCamposMunicao(card); const pacote = obterApresentacaoPacoteMunicao(d); const max = pacote.quantidadePacote; const qty = Math.min(max, Math.max(0, Math.floor(Number(d.municao_quantidade) || 0))); const quantityField = card.querySelector('[data-campo="municao_quantidade"]'); const clamped = Number(d.municao_quantidade) !== qty; if (clamped) quantityField.value = String(qty); card.querySelector(".municao-card-nome").textContent = pacote.nomePacote; card.querySelector(".municao-card-head").setAttribute("aria-label", `Exibir ${pacote.nomePacote}`); card.querySelector(".municao-card-unidade").textContent = pacote.nomeUnidade; card.querySelector(".municao-card-capacidade").textContent = `Máx. ${max} ${pacote.nomeUnidade}`; const input = card.querySelector(".municao-quantidade"); input.max = String(max); input.value = qty; const peso = qty / max * (Number(d.municao_peso_pacote) || 0); card.querySelector(".municao-card-meta").textContent = `🪙 ${Number(d.municao_preco_pacote || 0).toLocaleString("pt-BR")} ${String(d.municao_moeda || "po").toUpperCase()}   ⚖️ ${formatoPesoMunicao(peso)}`; const tags = card.querySelector(".municao-card-tags"); tags.replaceChildren(); [d.municao_raridade || "comum", ...(d.municao_magica === "true" ? ["Mágico"] : [])].forEach(text => {const tag = document.createElement("span"); tag.className = "arma-cartao-tag"; tag.textContent = text; tags.appendChild(tag);}); if (clamped) { if (typeof atualizarTodasMunicoesArmas === "function") atualizarTodasMunicoesArmas(); if (typeof atualizarPesoAtualInventario === "function") atualizarPesoAtualInventario(); } atualizarResumoMunicoes(); }
function atualizarResumoMunicoes() { const cards = [...document.querySelectorAll("#listaMunicoes .item-card[data-tipo='municao']")]; const count = document.getElementById("inventarioContagemMunicoes"); if (count) count.textContent = String(cards.length); }
function adicionarMunicao(dados) { const card = criarCardMunicao(dados); if (typeof atualizarTodasMunicoesArmas === "function") atualizarTodasMunicoesArmas(); if (typeof atualizarSeletoresAtaqueEquipados === "function") atualizarSeletoresAtaqueEquipados(); if (typeof atualizarPesoAtualInventario === "function") atualizarPesoAtualInventario(); return card; }
function removerCardMunicao(card) {
  if (!card || !confirm(`Excluir ${card.querySelector('[data-campo="municao_nome"]')?.value || "esta munição"}?`)) return false;
  const removedId = card.dataset.id; card.remove();
  document.querySelectorAll('#listaArmas [data-campo="arma_municao_id"]').forEach(select => { if (select.value === removedId) { select.value = ""; select.dispatchEvent(new Event("change", { bubbles: true })); } });
  atualizarResumoMunicoes();
  if (typeof atualizarTodasMunicoesArmas === "function") atualizarTodasMunicoesArmas();
  if (typeof atualizarSeletoresAtaqueEquipados === "function") atualizarSeletoresAtaqueEquipados();
  if (typeof atualizarPesoAtualInventario === "function") atualizarPesoAtualInventario();
  return true;
}

function abrirDetalhesMunicao(card) {
  const item = obterCamposMunicao(card); if (!item) return;
  document.querySelector(".municao-modal-overlay")?.remove();
  const overlay=document.createElement("div"); overlay.className="magia-modal-overlay modal-overlay-base municao-modal-overlay ativo";
  const dialog=document.createElement("section"); dialog.className="magia-modal modal-base armadura-modal municao-detalhe-modal"; dialog.setAttribute("role","dialog"); dialog.setAttribute("aria-modal","true"); dialog.setAttribute("aria-labelledby","municaoDetalheTitulo");
  const header=document.createElement("header"); header.className="magia-modal-topo modal-header-base";
  const headerInfo=document.createElement("div"); headerInfo.className="magia-modal-topo-info";
  const titleLine=document.createElement("div"); titleLine.className="armadura-modal-titulo-linha";
  const icon=document.createElement("span"); icon.className="armadura-modal-icone"; icon.textContent="🏹";
  const pacote = obterApresentacaoPacoteMunicao(item);
  const title=document.createElement("h2"); title.id="municaoDetalheTitulo"; title.className="magia-modal-titulo"; title.textContent=pacote.nomePacote;
  const close=document.createElement("button"); close.type="button"; close.className="magia-modal-botao modal-close-base"; close.textContent="Fechar"; close.addEventListener("click",()=>overlay.remove());
  const edit=document.createElement("button"); edit.type="button"; edit.className="magia-modal-botao"; edit.textContent="✏️ Editar"; edit.addEventListener("click",()=>{overlay.remove();abrirEditorMunicao(card)});
  const remove=document.createElement("button"); remove.type="button"; remove.className="magia-modal-botao perigo"; remove.textContent="🗑️ Remover"; remove.addEventListener("click",()=>{if(removerCardMunicao(card))overlay.remove();});
  titleLine.append(icon,title); headerInfo.append(titleLine); const chips=document.createElement("div"); chips.className="armadura-modal-categorias"; [item.municao_raridade || "comum","Munição",...(item.municao_magica === "true" ? ["Item mágico"] : [])].forEach(t=>{const tag=document.createElement("span");tag.className="magia-modal-nivel";tag.textContent=t;chips.append(tag)}); headerInfo.append(chips);
  const actions=document.createElement("div"); actions.className="magia-modal-acoes"; actions.append(edit,close); header.append(headerInfo,actions);
  const detail=document.createElement("article"); detail.className="magia-card-detalhe armadura-detalhe arma-detalhe municao-detalhes-conteudo";
  const summary=document.createElement("div"); summary.className="arma-detalhe-resumo";
  const qtyBox=document.createElement("div"); qtyBox.className="arma-detalhe-destaque"; const qtyLabel=document.createElement("span"); qtyLabel.className="armadura-resumo-rotulo"; qtyLabel.textContent="Quantidade atual"; const qty=document.createElement("strong"); qty.className="arma-detalhe-dano"; qty.textContent=`${item.municao_quantidade || 0} ${pacote.nomeUnidade}`; qtyBox.append(qtyLabel,qty);
  const facts=document.createElement("div");facts.className="arma-detalhe-valores"; const totalWeight=(Number(item.municao_quantidade)||0)/Math.max(1,Number(item.municao_quantidade_pacote)||1)*(Number(item.municao_peso_pacote)||0); [["🪙 Valor",`${Number(item.municao_preco_pacote || 0).toLocaleString("pt-BR")} ${String(item.municao_moeda||"po").toUpperCase()} / pacote`],["⚖️ Peso",`${formatoPesoMunicao(totalWeight)} no inventário`]].forEach(([label,value])=>{const box=document.createElement("div");box.className="arma-detalhe-valor";const l=document.createElement("span");l.textContent=label;const v=document.createElement("strong");v.textContent=value;box.append(l,v);facts.append(box)}); summary.append(qtyBox,facts);
  const tags=document.createElement("div"); tags.className="magia-card-detalhe-propriedades arma-detalhe-propriedades"; [pacote.etiquetaPacote,...(item.municao_magica === "true" ? ["Item mágico",...(item.municao_sintonizado === "true" ? ["Sintonizado"] : [])] : [])].forEach(t=>{const tag=document.createElement("span");tag.className="magia-card-detalhe-tag";tag.textContent=t;tags.append(tag)});
  const desc=document.createElement("section");desc.className="armadura-descricao"; const label=document.createElement("h4");label.textContent="Descrição";const body=document.createElement("p");body.textContent=item.municao_descricao || "Nenhuma descrição cadastrada.";desc.append(label,body);const detailActions=document.createElement("div");detailActions.className="municao-detalhe-acoes";detailActions.append(remove);detail.append(summary,tags,desc,detailActions);dialog.append(header,detail);overlay.appendChild(dialog);overlay.addEventListener("click",e=>{if(e.target===overlay)e.preventDefault()});document.body.appendChild(overlay);close.focus();
}

function abrirEditorMunicao(card = null, catalogItem = null) {
  document.querySelector(".municao-modal-overlay")?.remove();
  const atual = card ? obterCamposMunicao(card) : {};
  const overlay = document.createElement("div"); overlay.className = "magia-modal-overlay modal-overlay-base municao-modal-overlay ativo"; overlay.setAttribute("role", "presentation");
  const dialog = document.createElement("section"); dialog.className = "magia-modal modal-base armadura-modal municao-editor-modal"; dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("aria-labelledby", "municaoEditorTitulo");
  const title = document.createElement("h2"); title.id = "municaoEditorTitulo"; title.textContent = card ? `Editar ${atual.municao_nome}` : catalogItem ? catalogItem.nome : "Nova munição";
  const form = document.createElement("form"); form.className = "armadura-editor municao-form";
  const field = (labelText, name, value, type = "text", attrs = {}) => { const label = document.createElement("label"); label.textContent = labelText; const input = document.createElement("input"); input.name = name; input.type = type; input.value = value ?? ""; Object.entries(attrs).forEach(([k,v]) => input.setAttribute(k,v)); label.appendChild(input); form.appendChild(label); return input; };
  const source = catalogItem || atual; const name = field("Nome", "nome", source.municao_nome || source.nome || "", "text", { required:"", maxlength:"100" });
  const qty = field("Quantidade em unidades", "quantidade", source.municao_quantidade ?? 0, "number", { min:"0", step:"1", required:"" });
  const descLabel = document.createElement("label"); descLabel.textContent = "Descrição"; const desc = document.createElement("textarea"); desc.name = "descricao"; desc.value = source.municao_descricao || source.descricao || ""; descLabel.appendChild(desc); form.appendChild(descLabel);
  const pacote = field("Unidades por pacote", "pacote", source.municao_quantidade_pacote || source.quantidadePacote || 1, "number", { min:"1", step:"1" });
  const peso = field("Peso do pacote (kg)", "peso", source.municao_peso_pacote ?? source.pesoPacoteKg ?? 0, "number", { min:"0", step:"0.001" });
  const preco = field("Preço do pacote", "preco", source.municao_preco_pacote ?? source.custo?.valor ?? 0, "number", { min:"0", step:"0.01" });
  const moedaLabel = document.createElement("label"); moedaLabel.textContent = "Moeda"; const moeda = document.createElement("select"); moeda.name = "moeda"; [["pc","PC"],["pp","PP"],["po","PO"]].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;moeda.appendChild(o)}); moeda.value = source.municao_moeda || source.custo?.moeda || "po"; moedaLabel.appendChild(moeda); form.appendChild(moedaLabel);
  const actions = document.createElement("div"); actions.className = "armadura-editor-acoes municao-modal-acoes";
  if (card) { const remove = document.createElement("button"); remove.type = "button"; remove.className = "magia-modal-botao perigo"; remove.textContent = "Excluir munição"; remove.addEventListener("click", () => { if (removerCardMunicao(card)) overlay.remove(); }); actions.appendChild(remove); }
  const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "magia-modal-botao"; cancel.textContent = "Cancelar"; cancel.addEventListener("click",()=>overlay.remove()); const save = document.createElement("button"); save.type = "submit"; save.className = "magia-modal-botao primario"; save.textContent = "Salvar"; actions.append(cancel,save); form.appendChild(actions);
  form.addEventListener("submit", event => { event.preventDefault(); const data = { id: card?.dataset.id, municao_nome:name.value.trim(), municao_quantidade:String(Math.max(0,Math.floor(Number(qty.value)||0))), municao_descricao:desc.value, municao_catalogo_id:source.municao_catalogo_id || (catalogItem ? catalogItem.id : ""), municao_quantidade_pacote:String(Math.max(1,Math.floor(Number(pacote.value)||1))), municao_peso_pacote:String(Number(peso.value)||0), municao_preco_pacote:String(Number(preco.value)||0), municao_moeda:moeda.value, municao_raridade:"comum", municao_magica:atual.municao_magica || "false", municao_bonus_ataque:atual.municao_bonus_ataque || "0", municao_bonus_dano:atual.municao_bonus_dano || "" };
    if (card) { data.municao_catalogo_id = catalogItem?.id || atual.municao_catalogo_id || ""; Object.entries(data).forEach(([k,v])=>{const input=card.querySelector(`[data-campo="${k}"]`);if(input)input.value=v;}); atualizarCardMunicao(card); if (typeof atualizarTodasMunicoesArmas === "function") atualizarTodasMunicoesArmas(); if (typeof atualizarSeletoresAtaqueEquipados === "function") atualizarSeletoresAtaqueEquipados(); } else adicionarMunicao(data);
    overlay.remove(); if (typeof atualizarPesoAtualInventario === "function") atualizarPesoAtualInventario(); });
  dialog.append(title,form); overlay.appendChild(dialog); overlay.addEventListener("click", e=>{ if(e.target === overlay) e.preventDefault(); }); document.body.appendChild(overlay); name.focus();
}

async function abrirCatalogoMunicoes() {
  try {
    const itens = await carregarCatalogoMunicoes(); document.querySelector(".municao-modal-overlay")?.remove();
    const overlay = document.createElement("div"); overlay.className = "magia-slot-modal-overlay municao-modal-overlay ativo";
    const dialog = document.createElement("section"); dialog.className = "magia-slot-modal magia-selecao-modal armadura-selecao-modal municao-catalogo-modal"; dialog.setAttribute("role","dialog"); dialog.setAttribute("aria-modal","true"); dialog.setAttribute("aria-labelledby","municaoSelecaoTitulo");
    const header = document.createElement("div"); header.className="magia-selecao-cabecalho"; const title = document.createElement("h2"); title.id="municaoSelecaoTitulo"; title.className="magia-slot-modal-titulo"; title.textContent = "Adicionar munição"; const create = document.createElement("button"); create.type="button"; create.className="magia-selecao-criar"; create.textContent="Criar munição"; create.addEventListener("click",()=>{overlay.remove();abrirEditorMunicao()}); const close = document.createElement("button"); close.type="button"; close.className="magia-selecao-fechar"; close.setAttribute("aria-label","Fechar janela"); close.textContent="×"; close.addEventListener("click",()=>overlay.remove()); header.append(create,title,close);
    const search = document.createElement("input"); search.type="search"; search.placeholder="Pesquisar munição"; search.setAttribute("aria-label","Pesquisar munição");
    const filters = document.createElement("div"); filters.className="magia-selecao-filtros municao-catalogo-filtros"; const categoryWrap=document.createElement("div"); const categoryLabel=document.createElement("label"); categoryLabel.className="magia-selecao-classe"; categoryLabel.textContent="Compatibilidade"; const category=document.createElement("select"); category.className="magia-selecao-classe-select"; category.setAttribute("aria-label","Filtrar munição por compatibilidade"); [["todas","Todas"],["arco","Arcos"],["besta","Bestas"],["zarabatana","Zarabatana"],["funda","Funda"]].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;category.appendChild(o)});categoryWrap.append(categoryLabel,category); search.className="magia-selecao-busca"; search.placeholder="Nome em português ou inglês"; filters.append(categoryWrap,search);
    const status=document.createElement("p"); status.className="armadura-selecao-status"; status.setAttribute("role","status");
    const content=document.createElement("div");content.className="magia-selecao-conteudo municao-catalogo-conteudo";const list=document.createElement("div");list.className="magia-selecao-lista municao-catalogo-lista";const detail=document.createElement("div");detail.className="magia-selecao-detalhes municao-catalogo-detalhe";
    const render = () => { list.replaceChildren(); const term=search.value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); const filter=category.value; const filtered=itens.filter(i=>{const text=`${i.nome} ${i.nomeOriginal}`.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();return (!term||text.includes(term))&&(filter==="todas"||i.compatibilidade.some(c=>filter==="arco"?c.startsWith("arco"):filter==="besta"?c.startsWith("besta"):c===filter));}); status.textContent=filtered.length?`${filtered.length} ${filtered.length===1?"tipo de munição disponível":"tipos de munição disponíveis"} · pesos em kg`:"Nenhuma munição encontrada com esses filtros."; if(!filtered.some(i=>i.id===detail.dataset.itemId)) detail.dataset.itemId=filtered[0]?.id||""; filtered.forEach(item=>{const row=document.createElement("button");row.type="button";row.className="magia-selecao-item";row.setAttribute("aria-pressed",String(item.id===detail.dataset.itemId));row.classList.toggle("selecionado",item.id===detail.dataset.itemId);const name=document.createElement("strong");name.textContent=item.nome;const meta=document.createElement("span");meta.textContent=`${item.quantidadePacote} un. · ${formatoPesoMunicao(item.pesoPacoteKg)}`;row.append(name,meta);row.addEventListener("click",()=>{detail.dataset.itemId=item.id;render();});list.appendChild(row);});
      const selected=filtered.find(i=>i.id===detail.dataset.itemId);detail.replaceChildren();if(selected){const preview=document.createElement("article");preview.className="magia-card-detalhe armadura-detalhe arma-detalhe municao-previa-catalogo";const previewHead=document.createElement("header");previewHead.className="magia-card-detalhe-header arma-detalhe-header";const titleWrap=document.createElement("div");titleWrap.className="armadura-detalhe-titulo";const icon=document.createElement("span");icon.className="armadura-modal-icone";icon.textContent="🏹";const h=document.createElement("h3");h.className="magia-card-detalhe-nome";h.textContent=selected.nome;titleWrap.append(icon,h);const add=document.createElement("button");add.type="button";add.className="magia-card-detalhe-adicionar";add.textContent="Adicionar ao inventário";add.addEventListener("click",()=>{adicionarMunicao({municao_nome:selected.nome,municao_quantidade:selected.quantidadePacote,municao_descricao:selected.descricao,municao_catalogo_id:selected.id,municao_quantidade_pacote:selected.quantidadePacote,municao_peso_pacote:selected.pesoPacoteKg,municao_preco_pacote:selected.custo.valor,municao_moeda:selected.custo.moeda});overlay.remove();});previewHead.append(titleWrap,add);const tags=document.createElement("div");tags.className="magia-card-detalhe-propriedades arma-detalhe-propriedades";["Comum","Munição",...selected.compatibilidade.map(c=>c.startsWith("arco")?"Arcos":c.startsWith("besta")?"Bestas":c==="funda"?"Funda":"Zarabatana")].filter((v,i,a)=>a.indexOf(v)===i).forEach(t=>{const s=document.createElement("span");s.className="magia-card-detalhe-tag";s.textContent=t;tags.appendChild(s)});const facts=document.createElement("div");facts.className="arma-detalhe-valores";[["🪙 Valor",`${selected.custo.valor} ${selected.custo.moeda.toUpperCase()} / pacote`],["⚖️ Peso",`${formatoPesoMunicao(selected.pesoPacoteKg)} / ${selected.quantidadePacote} unidades`]].forEach(([label,value])=>{const box=document.createElement("div");box.className="arma-detalhe-valor";const l=document.createElement("span");l.textContent=label;const v=document.createElement("strong");v.textContent=value;box.append(l,v);facts.append(box)});const desc=document.createElement("section");desc.className="armadura-descricao";const dh=document.createElement("h4");dh.textContent="Descrição";const dp=document.createElement("p");dp.textContent=selected.descricao;desc.append(dh,dp);preview.append(previewHead,tags,facts,desc);detail.append(preview);}else{detail.textContent="Nenhuma munição encontrada.";}};
    search.addEventListener("input",render);category.addEventListener("change",render);content.append(list,detail);dialog.append(header,filters,status,content);overlay.appendChild(dialog);overlay.addEventListener("click",e=>{if(e.target===overlay)e.preventDefault();});document.body.appendChild(overlay);render();search.focus();
  } catch (erro) { console.error(erro); alert("Não foi possível carregar o catálogo de munições."); }
}

function converterMunicaoLegada(d) {
  const normalize = text => String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const nome = d.outro_nome || d.municao_nome || "Munição"; const key = normalize(nome);
  const presets = [
    { match:["virote","bolt"], id:"virotes", pack:20, weight:.75, price:1, coin:"po" },
    { match:["flecha","arrow"], id:"flechas", pack:20, weight:.5, price:1, coin:"po" },
    { match:["agulha","needle"], id:"agulhas-zarabatana", pack:50, weight:.5, price:1, coin:"po" },
    { match:["bala de funda","sling bullet"], id:"balas-de-funda", pack:20, weight:.75, price:4, coin:"pc" },
  ].find(p => p.match.some(term => key.includes(normalize(term))));
  return { id:d.id, municao_nome:nome, municao_quantidade:d.outro_quantidade ?? d.municao_quantidade ?? 0, municao_descricao:d.outro_descricao || d.municao_descricao || "", municao_catalogo_id:d.municao_catalogo_id || presets?.id || "", municao_quantidade_pacote:d.municao_quantidade_pacote || presets?.pack || 1, municao_peso_pacote:d.municao_peso_pacote ?? presets?.weight ?? d.outro_peso ?? 0, municao_preco_pacote:d.municao_preco_pacote ?? presets?.price ?? d.outro_preco ?? 0, municao_moeda:d.municao_moeda || presets?.coin || d.outro_moeda || "po", municao_raridade:d.municao_raridade || "comum", municao_magica:d.municao_magica || "false", municao_bonus_ataque:d.municao_bonus_ataque || 0, municao_bonus_dano:d.municao_bonus_dano || "" };
}
function sincronizarMunicoesNaFicha(lista = coletarMunicoes()) {
  // Espelho legado para manter compatibilidade com versões anteriores da ficha.
  const espelho = lista.map(m => ({ id:m.id, outro_tipo:"Municao", outro_nome:m.municao_nome, outro_quantidade:m.municao_quantidade, outro_descricao:m.municao_descricao, outro_preco:m.municao_preco_pacote, outro_moeda:m.municao_moeda, outro_peso:String((Number(m.municao_peso_pacote)||0)/Math.max(1,Number(m.municao_quantidade_pacote)||1)), municao_catalogo_id:m.municao_catalogo_id }));
  return espelho;
}

document.addEventListener("DOMContentLoaded", () => {
  atualizarResumoMunicoes();
  carregarCatalogoMunicoes().then(async () => {
    let resultadoImportacao = null;
    while (window.__fichaImportacaoTransacaoAtiva) {
      resultadoImportacao = await window.__aguardarFimImportacaoFicha?.();
    }
    if (resultadoImportacao && !resultadoImportacao.sucesso && !resultadoImportacao.restaurado) return;
    document.querySelectorAll("#listaMunicoes .municao-card").forEach(atualizarCardMunicao);
    if (typeof atualizarTodasMunicoesArmas === "function") atualizarTodasMunicoesArmas();
  }).catch(erro => console.error("Falha ao iniciar catálogo de munições", erro));
});
