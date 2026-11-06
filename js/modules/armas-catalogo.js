// Catálogo e detalhes de armas. Instâncias e campos de combate conservam o formato legado.
const RARIDADES_ARMA_CATALOGO = new Set(["comum", "incomum", "raro", "muito raro", "lendário", "artefato"]);
const PROPRIEDADES_ARMA_CATALOGO = new Set(["acuidade", "alcance", "arremesso", "carregamento", "duas_maos", "leve", "municao", "pesada", "versatil", "especial"]);
const ROTULOS_PROPRIEDADE_ARMA = { acuidade:"Acuidade", alcance:"Alcance", arremesso:"Arremesso", carregamento:"Carregamento", duas_maos:"Duas mãos", leve:"Leve", municao:"Munição", pesada:"Pesada", versatil:"Versátil", especial:"Especial" };
const DICAS_PROPRIEDADE_ARMA = {
  acuidade:"Você pode usar Força ou Destreza nas jogadas de ataque e dano com esta arma.",
  alcance:"Seus ataques corpo a corpo alcançam 1,5 m além do alcance normal.",
  arremesso:"Você pode arremessar a arma para fazer um ataque à distância; use o mesmo atributo do ataque corpo a corpo.",
  carregamento:"Você só pode disparar uma munição por ação, ação bônus ou reação, mesmo que normalmente pudesse fazer mais ataques.",
  duas_maos:"Você precisa empunhar a arma com as duas mãos para atacar.",
  leve:"A arma é pequena e fácil de manejar, sendo adequada para combate com duas armas.",
  municao:"A arma precisa de munição para atacar. Sacar a munição faz parte do ataque; ao fim do combate, metade da munição usada pode ser recuperada.",
  pesada:"Criaturas Pequenas fazem ataques com esta arma com desvantagem.",
  versatil:"Você pode usar uma ou duas mãos; o dano entre parênteses vale quando atacar com as duas mãos.",
  especial:"Esta arma possui uma regra própria; consulte a descrição ou a regra especial do item.",
};
const TIPOS_DANO_ARMA = { "concussão":"Concussão", "cortante":"Cortante", "perfurante":"Perfurante", "ácido":"Ácido", "congelante":"Congelante", "elétrico":"Elétrico", "fogo":"Fogo", "trovão":"Trovão", "veneno":"Veneno", "energia":"Energia (Force)", "necrótico":"Necrótico", "psíquico":"Psíquico", "radiante":"Radiante" };
const estadoCatalogoArmas = { dados:null, promessa:null, selecionada:null, foco:null };
const estadoModalArma = { card:null, foco:null, editando:false, retrato:"" };

function criarElementoArma(tag, texto, classe) {
  const el = document.createElement(tag);
  if (texto !== undefined) el.textContent = texto;
  if (classe) el.className = classe;
  return el;
}

function dicaCaracteristicaArma(tipo, valor = "") {
  if (tipo === "raridade") return `Raridade ${valor}: indica a categoria de raridade do item; por si só, não altera suas regras de uso.`;
  if (tipo === "categoria") return valor === "simples"
    ? "Arma simples: categoria de proficiência comum a armas fáceis de manejar."
    : "Arma marcial: categoria de proficiência de armas que exigem treinamento mais especializado.";
  if (tipo === "magico") return "Este item é mágico e pode interagir com efeitos que reconhecem itens mágicos.";
  if (tipo === "sintonizado") return "Seu personagem está sintonizado com este item mágico.";
  if (tipo === "equipada") return "Esta arma está selecionada como equipamento de combate.";
  if (tipo === "modo") return valor === "distancia" ? "Arma usada para fazer ataques à distância." : "Arma usada para fazer ataques corpo a corpo.";
  return DICAS_PROPRIEDADE_ARMA[tipo] || "Característica desta arma.";
}

function adicionarDicaArma(elemento, descricao) {
  if (!elemento || !descricao) return elemento;
  elemento.title = descricao;
  return elemento;
}

function dicaAlcanceArma(item) {
  if (!item.alcance) return "Esta arma não possui alcance à distância informado.";
  const normal = Number(item.alcance.normalM).toLocaleString("pt-BR");
  const longo = Number(item.alcance.longoM).toLocaleString("pt-BR");
  return `O primeiro valor (${normal} m) é o alcance normal. O segundo (${longo} m) é o alcance longo: atacar além do alcance normal impõe desvantagem, e não é possível atacar além do alcance longo.`;
}

function validarCatalogoArmas(dados) {
  if (dados?.versaoSchema !== 1 || dados.sistema !== "dnd5e-2014" || dados.unidadePeso !== "kg" ||
      !Number.isInteger(dados.versaoCatalogo) || !Array.isArray(dados.itens) || dados.itens.length !== 37) {
    throw new Error("Catálogo de armas incompatível.");
  }
  const ids = new Set();
  for (const item of dados.itens) {
    if (!item.id || ids.has(item.id) || item.tipo !== "arma" || item.raridade !== "comum" ||
        !item.nome?.trim() || !item.nomeOriginal?.trim() ||
        !["simples", "marcial"].includes(item.categoriaProficiencia) ||
        !["corpo-a-corpo", "distancia"].includes(item.modo) ||
        !Number.isFinite(item.pesoKg) || item.pesoKg < 0 ||
        !Number.isFinite(item.custo?.valor) || item.custo.valor < 0 || !["pc", "pp", "po"].includes(item.custo.moeda) ||
        typeof item.dano?.base !== "string" || typeof item.dano?.tipo !== "string" ||
        !Array.isArray(item.propriedades) || item.propriedades.some(p => !PROPRIEDADES_ARMA_CATALOGO.has(p)) ||
        item.propriedades.includes("versatil") !== Boolean(item.dano.versatil) ||
        (item.propriedades.includes("municao") !== Boolean(item.municao)) ||
        (item.alcance && (!["normalFt", "longoFt", "normalM", "longoM"].every(k => Number.isFinite(item.alcance[k])) || item.alcance.normalFt <= 0 || item.alcance.longoFt < item.alcance.normalFt)) ||
        typeof item.descricao !== "string" || !item.descricao.trim() ||
        (item.descricaoEspecial !== undefined && typeof item.descricaoEspecial !== "string")) {
      throw new Error("Entrada inválida no catálogo de armas: " + (item.id || "sem ID"));
    }
    ids.add(item.id);
  }
  return dados;
}

async function carregarCatalogoArmas() {
  if (estadoCatalogoArmas.dados) return estadoCatalogoArmas.dados;
  if (!estadoCatalogoArmas.promessa) {
    estadoCatalogoArmas.promessa = (async () => {
      const resposta = await fetch("../assets/data/itens/armas.json");
      if (!resposta.ok) throw new Error("Catálogo indisponível.");
      estadoCatalogoArmas.dados = validarCatalogoArmas(await resposta.json());
      return estadoCatalogoArmas.dados;
    })().finally(() => { estadoCatalogoArmas.promessa = null; });
  }
  return estadoCatalogoArmas.promessa;
}

function textoBuscaArma(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filtrarCatalogoArmas(itens, busca = "", categoria = "todas", modo = "todos", apenasProficientes = false) {
  const termo = textoBuscaArma(busca).trim();
  return itens.filter(item =>
    (categoria === "todas" || item.categoriaProficiencia === categoria) &&
    (modo === "todos" || item.modo === modo) &&
    (!apenasProficientes || getTemProficienciaArma(item.categoriaProficiencia === "simples" ? "Simples" : "Marcial")) &&
    textoBuscaArma(item.nome + " " + item.nomeOriginal + " " + item.propriedades.map(p => ROTULOS_PROPRIEDADE_ARMA[p]).join(" ")).includes(termo));
}

function converterMoedaArmaParaPo(valor, moeda = "po") {
  const fator = { po:1, pp:0.1, pc:0.01 }[moeda] ?? 1;
  return Number(valor || 0) * fator;
}

function formatarValorArma(valor, moeda = "po") {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " " + String(moeda || "po").toUpperCase();
}

function formatarKgArma(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 }) + " kg";
}

function camposArmaDoCatalogo(item) {
  return {
    nome:item.nome, arma_raridade:item.raridade, arma_preco:String(item.custo.valor), arma_moeda:item.custo.moeda,
    arma_peso:String(item.pesoKg), arma_dano:item.dano.base, arma_tipo_dano:TIPOS_DANO_ARMA[item.dano.tipo] || item.dano.tipo,
    arma_tipo:item.categoriaProficiencia === "simples" ? "Simples" : "Marcial",
    arma_dist_curto:item.alcance ? String(item.alcance.normalM) : "",
    arma_dist_longo:item.alcance ? String(item.alcance.longoM) : "",
    arma_municao_id:"", arma_descricao:item.descricao, arma_descricao_especial:item.descricaoEspecial || "",
  };
}

function obterPropriedadesArmaCard(card) {
  const props = {};
  card.querySelectorAll(".propriedade-checkbox").forEach(cb => { props[cb.dataset.propriedade] = cb.checked; });
  return props;
}

function atualizarMoedaArmaCard(card) {
  const moeda = card.querySelector('[data-campo="arma_moeda"]')?.value || "po";
  const sufixo = card.querySelector('[data-campo="arma_preco"]')?.parentElement?.querySelector(".sufixo");
  if (sufixo) sufixo.textContent = moeda.toUpperCase();
}

function encontrarMunicaoDoTipo(tipo) {
  const termos = { "virotes":["virote", "bolt"], "flechas":["flecha", "arrow"], "agulhas de zarabatana":["agulha", "needle"], "balas de funda":["bala", "pedra", "bullet"] }[tipo] || [tipo];
  const itens = [...document.querySelectorAll('#listaOutros .item-card[data-tipo="outro"]')].filter(card =>
    String(card.querySelector('[data-campo="outro_tipo"]')?.value || "").toLowerCase() === "municao" &&
    textoBuscaArma(card.querySelector('[data-campo="outro_nome"]')?.value).includes(textoBuscaArma(termos[0])));
  return itens.length === 1 ? itens[0].dataset.id || "" : "";
}

function aplicarCatalogoAoCardArma(card, item) {
  const campos = camposArmaDoCatalogo(item);
  for (const [nome, valor] of Object.entries(campos)) {
    const controle = card.querySelector('[data-campo="' + nome + '"]');
    if (controle) controle.value = valor;
  }
  card.querySelectorAll(".propriedade-checkbox").forEach(cb => {
    const checked = item.propriedades.includes(cb.dataset.propriedade);
    if (cb.checked !== checked) { cb.checked = checked; cb.dispatchEvent(new Event("change", { bubbles:true })); }
  });
  if (item.dano.versatil) {
    const uma = card.querySelector('[data-campo="dano_1"]');
    const duas = card.querySelector('[data-campo="dano_2"]');
    if (uma) uma.value = item.dano.base;
    if (duas) duas.value = item.dano.versatil;
  }
  const municao = card.querySelector('[data-campo="arma_municao_id"]');
  if (municao) {
    atualizarOpcoesMunicao(card);
    const id = encontrarMunicaoDoTipo(item.municao);
    if (id) municao.value = id;
  }
  card.dataset.catalogoArmaId = item.id;
  card.dataset.catalogoArmaVersao = String(estadoCatalogoArmas.dados?.versaoCatalogo || 1);
  atualizarMoedaArmaCard(card);
  atualizarProficienciaCard(card);
  atualizarResumosArmas(); atualizarListaArmasEquipamento(); atualizarSubAbaArmas?.();
}

function adicionarArmaDoCatalogo(item) {
  fecharModalSelecaoArma();
  const card = adicionarNovaArma();
  if (!card) return null;
  aplicarCatalogoAoCardArma(card, item);
  fecharItemCard(card);
  card.querySelector(".arma-abrir")?.focus();
  return card;
}

function montarModalSelecaoArma() {
  if (document.getElementById("armaSelecaoOverlay")) return;
  const overlay = criarElementoArma("div", undefined, "magia-slot-modal-overlay oculto");
  overlay.id = "armaSelecaoOverlay";
  overlay.innerHTML = `
    <div class="magia-slot-modal magia-selecao-modal armadura-selecao-modal arma-selecao-modal" role="dialog" aria-modal="true" aria-labelledby="armaSelecaoTitulo" tabindex="-1">
      <div class="magia-selecao-cabecalho"><button type="button" class="magia-selecao-criar" data-acao="criar">Criar arma</button><h2 id="armaSelecaoTitulo" class="magia-slot-modal-titulo">Adicionar arma</h2><button type="button" class="magia-selecao-fechar" data-acao="fechar" aria-label="Fechar janela">×</button></div>
      <div class="magia-selecao-filtros arma-selecao-filtros">
        <div><label class="magia-selecao-classe" for="armaSelecaoCategoria">Categoria</label><select id="armaSelecaoCategoria" class="magia-selecao-classe-select"><option value="todas">Todas</option><option value="simples">Simples</option><option value="marcial">Marciais</option></select></div>
        <div><label class="magia-selecao-classe" for="armaSelecaoModo">Tipo de ataque</label><select id="armaSelecaoModo" class="magia-selecao-classe-select"><option value="todos">Todos</option><option value="corpo-a-corpo">Corpo a corpo</option><option value="distancia">À distância</option></select></div>
        <div><label class="magia-selecao-classe" for="armaSelecaoBusca">Pesquisar arma</label><input type="search" id="armaSelecaoBusca" class="magia-selecao-busca" placeholder="Nome em português ou inglês" autocomplete="off"></div>
      </div>
      <label class="armadura-filtro-proficiencia"><input type="checkbox" id="armaSelecaoProficiencia"> Somente com proficiência</label>
      <p id="armaSelecaoStatus" role="status"></p>
      <div class="magia-selecao-conteudo"><div id="armaSelecaoLista" class="magia-selecao-lista" aria-label="Armas disponíveis"></div><div id="armaSelecaoDetalhes" class="magia-selecao-detalhes" aria-label="Detalhes da arma"></div></div>
    </div>`;
  document.body.append(overlay);
  overlay.querySelector('[data-acao="fechar"]').onclick = fecharModalSelecaoArma;
  overlay.querySelector('[data-acao="criar"]').onclick = () => {
    fecharModalSelecaoArma();
    abrirModalArma(adicionarNovaArma(), true);
  };
  overlay.addEventListener("click", e => { if (e.target === overlay) fecharModalSelecaoArma(); });
  overlay.querySelectorAll("select,input").forEach(campo => campo.addEventListener(campo.type === "search" ? "input" : "change", renderizarCatalogoArmas));
  overlay.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); fecharModalSelecaoArma(); }
    if (e.key !== "Tab") return;
    const f = [...overlay.querySelectorAll('button,input,select,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1)?.focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0]?.focus(); }
  });
}

async function abrirModalSelecaoArma() {
  montarModalSelecaoArma();
  const overlay = document.getElementById("armaSelecaoOverlay");
  if (!overlay.classList.contains("ativo")) estadoCatalogoArmas.foco = document.activeElement;
  estadoCatalogoArmas.selecionada = null;
  document.getElementById("armaSelecaoCategoria").value = "todas";
  document.getElementById("armaSelecaoModo").value = "todos";
  document.getElementById("armaSelecaoBusca").value = "";
  document.getElementById("armaSelecaoProficiencia").checked = false;
  overlay.classList.remove("oculto"); overlay.classList.add("ativo"); overlay.setAttribute("aria-hidden", "false");
  document.getElementById("armaSelecaoStatus").textContent = "Carregando armas…";
  document.getElementById("armaSelecaoBusca").focus();
  try { await carregarCatalogoArmas(); renderizarCatalogoArmas(); }
  catch {
    document.getElementById("armaSelecaoLista").replaceChildren(); document.getElementById("armaSelecaoDetalhes").replaceChildren();
    const status = document.getElementById("armaSelecaoStatus"); status.textContent = "Não foi possível carregar o catálogo. Você pode criar uma arma manualmente. ";
    const retry = criarElementoArma("button", "Tentar novamente"); retry.type = "button"; retry.onclick = abrirModalSelecaoArma; status.append(retry);
  }
}

function fecharModalSelecaoArma() {
  const overlay = document.getElementById("armaSelecaoOverlay"); if (!overlay) return;
  overlay.classList.remove("ativo"); overlay.classList.add("oculto"); overlay.setAttribute("aria-hidden", "true");
  if (estadoCatalogoArmas.foco?.isConnected) estadoCatalogoArmas.foco.focus();
}

function renderizarCatalogoArmas() {
  const lista = document.getElementById("armaSelecaoLista"); if (!lista || !estadoCatalogoArmas.dados) return;
  const detalhes = document.getElementById("armaSelecaoDetalhes");
  const itens = filtrarCatalogoArmas(estadoCatalogoArmas.dados.itens,
    document.getElementById("armaSelecaoBusca").value, document.getElementById("armaSelecaoCategoria").value,
    document.getElementById("armaSelecaoModo").value, document.getElementById("armaSelecaoProficiencia").checked);
  lista.replaceChildren(); detalhes.replaceChildren();
  if (!itens.includes(estadoCatalogoArmas.selecionada)) estadoCatalogoArmas.selecionada = itens[0] || null;
  document.getElementById("armaSelecaoStatus").textContent = itens.length
    ? itens.length + (itens.length === 1 ? " arma disponível · pesos em kg" : " armas disponíveis · pesos em kg")
    : "Nenhuma arma encontrada com esses filtros.";
  itens.forEach(item => {
    const btn = criarElementoArma("button", undefined, "magia-selecao-item"); btn.type = "button";
    btn.classList.toggle("selecionado", item === estadoCatalogoArmas.selecionada); btn.setAttribute("aria-pressed", String(item === estadoCatalogoArmas.selecionada));
    btn.append(criarElementoArma("strong", item.nome), criarElementoArma("span", (item.categoriaProficiencia === "simples" ? "Simples" : "Marcial") + " · " + (item.dano.base || "sem dano") + (item.dano.versatil ? "/" + item.dano.versatil : "") + " · " + formatarKgArma(item.pesoKg)));
    btn.onclick = () => { estadoCatalogoArmas.selecionada = item; renderizarCatalogoArmas(); lista.querySelector('[aria-pressed="true"]')?.focus(); };
    lista.append(btn);
  });
  if (estadoCatalogoArmas.selecionada) {
    const selecionada = estadoCatalogoArmas.selecionada;
    detalhes.append(renderizarDetalhesArma({ ...selecionada, proficiente:getTemProficienciaArma(selecionada.categoriaProficiencia === "simples" ? "Simples" : "Marcial") }, () => adicionarArmaDoCatalogo(selecionada)));
  }
}

function nomePropriedadeArma(item, prop) {
  const alcance = item.alcance ? ` (${item.alcance.normalM}/${item.alcance.longoM} m)` : "";
  const versatil = prop === "versatil" && item.dano.versatil ? ` (${item.dano.versatil})` : "";
  return ROTULOS_PROPRIEDADE_ARMA[prop] + (prop === "arremesso" ? alcance : "") + versatil;
}

function renderizarDetalhesArma(item, aoAdicionar = null, card = null) {
  const container = criarElementoArma("article", undefined, "magia-card-detalhe armadura-detalhe arma-detalhe" + (aoAdicionar ? " arma-previa-catalogo" : ""));
  const header = criarElementoArma("header", undefined, "magia-card-detalhe-header arma-detalhe-header");
  const titulo = criarElementoArma("div", undefined, "armadura-detalhe-titulo");
  if (aoAdicionar) titulo.append(criarElementoArma("span", "⚔️", "armadura-modal-icone"));
  titulo.append(criarElementoArma("h3", item.nome, "magia-card-detalhe-nome"));
  if (item.nomeOriginal) titulo.append(criarElementoArma("div", item.nomeOriginal, "armadura-nome-original"));
  const categoria = criarElementoArma("span", (item.categoriaProficiencia === "simples" ? "Simples" : "Marcial") + " · " + (item.modo === "distancia" ? "À distância" : "Corpo a corpo"), "magia-modal-nivel armadura-previa-categoria");
  adicionarDicaArma(categoria, dicaCaracteristicaArma("categoria", item.categoriaProficiencia) + " " + dicaCaracteristicaArma("modo", item.modo));
  titulo.append(categoria); header.append(titulo);
  if (aoAdicionar) { const add = criarElementoArma("button", "Adicionar ao inventário", "magia-card-detalhe-adicionar"); add.type = "button"; add.onclick = aoAdicionar; header.append(add); }
  const resumo = criarElementoArma("div", undefined, "arma-detalhe-resumo");
  const dano = criarElementoArma("div", undefined, "arma-detalhe-destaque");
  dano.append(criarElementoArma("span", "Dano", "armadura-resumo-rotulo"), criarElementoArma("strong", (item.dano.base || "Sem dano") + (item.dano.versatil ? " / " + item.dano.versatil : "") + (item.dano.tipo ? " " + TIPOS_DANO_ARMA[item.dano.tipo] : ""), "arma-detalhe-dano"));
  resumo.append(dano);
  const valores = criarElementoArma("div", undefined, "arma-detalhe-valores");
  [["🪙 Valor", formatarValorArma(item.custo.valor, item.custo.moeda)], ["⚖️ Peso", formatarKgArma(item.pesoKg)], [item.propriedades.includes("arremesso") ? "Arremesso" : "Alcance", item.alcance ? item.alcance.normalM + "/" + item.alcance.longoM + " m" : "—"]].forEach(([label, val]) => {
    const box = criarElementoArma("div", undefined, "arma-detalhe-valor");
    if (label === "Alcance" || label === "Arremesso") adicionarDicaArma(box, dicaAlcanceArma(item));
    box.append(criarElementoArma("span", label), criarElementoArma("strong", val)); valores.append(box);
  });
  resumo.append(valores);
  const tags = criarElementoArma("div", undefined, "magia-card-detalhe-propriedades arma-detalhe-propriedades");
  item.propriedades.forEach(prop => tags.append(adicionarDicaArma(criarElementoArma("span", nomePropriedadeArma(item, prop), "magia-card-detalhe-tag"), dicaCaracteristicaArma(prop))));
  if (!item.propriedades.includes("versatil")) {
    const textoModo = item.modo === "distancia" ? "Distância" : "Corpo a corpo";
    tags.append(adicionarDicaArma(criarElementoArma("span", textoModo, "magia-card-detalhe-tag"), dicaCaracteristicaArma("modo", item.modo)));
  }
  if (item.magico) tags.append(adicionarDicaArma(criarElementoArma("span", "Item mágico", "magia-card-detalhe-tag"), dicaCaracteristicaArma("magico")));
  if (item.sintonizado) tags.append(adicionarDicaArma(criarElementoArma("span", "Sintonizada", "magia-card-detalhe-tag"), dicaCaracteristicaArma("sintonizado")));
  const desc = criarElementoArma("section", undefined, "armadura-descricao");
  desc.append(criarElementoArma("h4", "Descrição"), criarElementoArma("p", item.descricao || "Nenhuma descrição cadastrada."));
  container.append(header, resumo, tags);
  if (item.descricaoEspecial) {
    const especial = criarElementoArma("section", undefined, "arma-detalhe-especial"); especial.append(criarElementoArma("h4", "Regra especial"), criarElementoArma("p", item.descricaoEspecial)); container.append(especial);
  }
  container.append(desc);
  if (item.propriedades.includes("municao")) {
    const ammo = criarElementoArma("label", undefined, "arma-detalhe-municao" + (!item.municaoLigada ? " aviso" : ""));
    ammo.append(criarElementoArma("span", "Munição vinculada"));
    const select = criarElementoArma("select", undefined, "arma-detalhe-municao-select");
    select.setAttribute("aria-label", "Selecionar munição vinculada à arma");
    select.title = dicaCaracteristicaArma("municao");
    if (card) {
      const campo = card.querySelector('[data-campo="arma_municao_id"]');
      atualizarOpcoesMunicao(card);
      campo?.querySelectorAll("option").forEach(opcao => {
        const copia = criarElementoArma("option", opcao.textContent);
        copia.value = opcao.value;
        select.append(copia);
      });
      select.value = campo?.value || "";
      select.addEventListener("change", () => {
        if (!campo) return;
        campo.value = select.value;
        campo.dispatchEvent(new Event("change", { bubbles: true }));
        atualizarListaArmasEquipamento();
        atualizarSubAbaArmas?.();
        renderizarModalArma();
      });
    } else {
      const opcao = criarElementoArma("option", item.municao ? item.municao : "Adicione ao inventário para vincular");
      opcao.value = "";
      select.append(opcao);
      select.disabled = true;
    }
    ammo.append(select);
    container.append(ammo);
  }
  if (!item.proficiente) {
    const regras = criarElementoArma("details", undefined, "armadura-regras"); regras.open = true;
    regras.append(criarElementoArma("summary", "⚠️ Atenção: uso sem proficiência"), criarElementoArma("p", "Você não adiciona seu bônus de proficiência às jogadas de ataque feitas com esta arma.")); container.append(regras);
  }
  if (item.magico && !item.sintonizado) {
    const warning = criarElementoArma("details", undefined, "armadura-regras"); warning.open = true;
    warning.append(criarElementoArma("summary", "⚠️ Atenção: item mágico sem sintonização"), criarElementoArma("p", "Este item mágico ainda não está sintonizado. Lembre-se de sintonizá-lo para usar propriedades que exigem sintonização.")); container.append(warning);
  }
  return container;
}

function dadosArmaDoCard(card) {
  const origem = estadoCatalogoArmas.dados?.itens.find(item => item.id === card.dataset.catalogoArmaId);
  const valor = nome => card.querySelector('[data-campo="' + nome + '"]')?.value || "";
  const props = obterPropriedadesArmaCard(card);
  const um = valor("dano_1"), dois = valor("dano_2");
  const selectAmmo = card.querySelector('[data-campo="arma_municao_id"]');
  const ammoName = [...document.querySelectorAll('#listaOutros .item-card[data-tipo="outro"]')].find(el => el.dataset.id === selectAmmo?.value)?.querySelector('[data-campo="outro_nome"]')?.value;
  const indice = [...document.querySelectorAll('#listaArmas .item-card[data-tipo="arma"]:not(#armaModelo)')].indexOf(card);
  const equipada = ["arma1Nome", "arma2Nome"].some(id => document.getElementById(id)?.value === String(indice));
  return {
    id:origem?.id, nome:valor("nome") || "Arma", nomeOriginal:origem?.nomeOriginal,
    categoriaProficiencia:valor("arma_tipo"), modo:origem?.modo || (props.municao || props.arremesso ? "distancia" : "corpo-a-corpo"),
    custo:{ valor:Number(valor("arma_preco")) || 0, moeda:valor("arma_moeda") || "po" }, pesoKg:Number(valor("arma_peso")) || 0,
    dano:{ base:um || valor("arma_dano") || "", tipo:Object.keys(TIPOS_DANO_ARMA).find(k => TIPOS_DANO_ARMA[k] === valor("arma_tipo_dano")) || valor("arma_tipo_dano"), versatil:dois || origem?.dano?.versatil },
    alcance:valor("arma_dist_curto") || valor("arma_dist_longo") ? {normalM:Number(valor("arma_dist_curto")) || 0,longoM:Number(valor("arma_dist_longo")) || 0} : origem?.alcance,
    municao:origem?.municao || null, municaoLigada:ammoName,
    propriedades:Object.keys(props).filter(p => props[p]), descricao:valor("arma_descricao") || origem?.descricao || "",
    descricaoEspecial:valor("arma_descricao_especial") || origem?.descricaoEspecial || "",
    raridade:valor("arma_raridade") || "comum", magico:!!card.querySelector(".item-flag-magico")?.checked,
    sintonizado:!!card.querySelector(".item-flag-sintonizado")?.checked,
    proficiente:!card.querySelector(".item-proficiencia")?.classList.contains("nao"), equipada,
  };
}

function inicializarResumoArma(card) {
  if (!card || card.querySelector(".arma-resumo")) return;
  const resumo = criarElementoArma("div", undefined, "arma-resumo");
  const botao = criarElementoArma("button", undefined, "magia-item armadura-abrir arma-abrir"); botao.type = "button";
  const info = criarElementoArma("span", undefined, "armadura-cartao-info");
  const topo = criarElementoArma("span", undefined, "armadura-cartao-topo");
  topo.append(criarElementoArma("strong", "", "magia-item-nome"), criarElementoArma("span", "", "armadura-cartao-estado"));
  const dados = criarElementoArma("span", undefined, "arma-cartao-dados");
  const danoLinha = criarElementoArma("span", undefined, "arma-cartao-dano-linha");
  danoLinha.append(criarElementoArma("strong", "", "arma-cartao-dano"), criarElementoArma("span", "", "arma-cartao-categoria"));
  dados.append(danoLinha, criarElementoArma("span", "", "arma-cartao-tags"));
  const rodape = criarElementoArma("span", undefined, "armadura-cartao-rodape");
  rodape.append(criarElementoArma("span", "", "armadura-cartao-proficiencia"), criarElementoArma("span", "", "armadura-cartao-meta"));
  info.append(topo,dados,rodape); botao.append(info); resumo.append(botao);
  botao.onclick = e => { e.stopPropagation(); abrirModalArma(card); };
  const municaoLinha = criarElementoArma("label", undefined, "arma-cartao-municao");
  municaoLinha.append(criarElementoArma("span", "Munição"));
  const municaoSelect = criarElementoArma("select", undefined, "arma-cartao-municao-select");
  municaoSelect.setAttribute("aria-label", "Munição vinculada à arma");
  municaoSelect.addEventListener("click", e => e.stopPropagation());
  municaoSelect.addEventListener("change", () => {
    const campo = card.querySelector('[data-campo="arma_municao_id"]');
    if (!campo) return;
    campo.value = municaoSelect.value;
    campo.dispatchEvent(new Event("change", { bubbles:true }));
    atualizarListaArmasEquipamento();
    atualizarSubAbaArmas?.();
  });
  municaoLinha.append(municaoSelect); resumo.append(municaoLinha);
  card.querySelector(".item-linha.item-header")?.after(resumo);
}

function atualizarResumosArmas(armas = null) {
  const cards = [...document.querySelectorAll('#listaArmas .item-card[data-tipo="arma"]:not(#armaModelo)')];
  const itens = armas || coletarArmas();
  cards.forEach((card, i) => {
    inicializarResumoArma(card); const item = itens[i]; if (!item) return;
    const btn = card.querySelector(".arma-abrir"); if (!btn) return;
    const props = item.propriedades || {}; const dano = obterTextoDanoArma(item) || "—";
    const resumo = card.querySelector(".arma-resumo");
    btn.querySelector(".magia-item-nome").textContent = item.nome?.trim() || "Arma sem nome";
    btn.querySelector(".arma-cartao-dano").textContent = dano + (item.arma_tipo_dano ? " " + item.arma_tipo_dano : "");
    btn.querySelector(".arma-cartao-categoria").textContent = item.arma_tipo || "Sem categoria";
    const tags = btn.querySelector(".arma-cartao-tags"); tags.replaceChildren();
    Object.entries(ROTULOS_PROPRIEDADE_ARMA).filter(([k]) => props[k]).forEach(([k,v]) => tags.append(criarElementoArma("span",v,"arma-cartao-tag")));
    if (!props.versatil) {
      const origem = estadoCatalogoArmas.dados?.itens.find(arma => arma.id === card.dataset.catalogoArmaId);
      const modo = item.modo || origem?.modo || (props.municao || props.arremesso ? "distancia" : "corpo-a-corpo");
      const textoModo = modo === "distancia" ? "Distância" : "Corpo a corpo";
      tags.append(adicionarDicaArma(criarElementoArma("span",textoModo,"arma-cartao-tag"),dicaCaracteristicaArma("modo",modo)));
    }
    if (card.querySelector(".item-flag-magico")?.checked) tags.append(criarElementoArma("span","Mágico","arma-cartao-tag"));
    if (card.querySelector(".item-flag-sintonizado")?.checked) tags.append(criarElementoArma("span","Sintonizado","arma-cartao-tag"));
    const linhaMunicao = resumo.querySelector(".arma-cartao-municao");
    const selectMunicaoResumo = resumo.querySelector(".arma-cartao-municao-select");
    const campoMunicao = card.querySelector('[data-campo="arma_municao_id"]');
    const usaMunicao = Boolean(props.municao);
    linhaMunicao.hidden = !usaMunicao;
    if (usaMunicao && selectMunicaoResumo && campoMunicao) {
      atualizarOpcoesMunicao(card);
      const opcoes = [...campoMunicao.options].map(opcao => {
        const copia = criarElementoArma("option", opcao.textContent);
        copia.value = opcao.value;
        return copia;
      });
      selectMunicaoResumo.replaceChildren(...opcoes);
      selectMunicaoResumo.value = campoMunicao.value;
      selectMunicaoResumo.title = campoMunicao.value
        ? "Munição vinculada à arma"
        : "Escolha a pilha de munição usada por esta arma";
    }
    const prof = item.proficiente !== false; const aviso=btn.querySelector(".armadura-cartao-proficiencia"); aviso.textContent=prof?"":"⚠️ Sem proficiência"; aviso.hidden=prof; aviso.title=prof?"":"⚠️ Sem proficiência";
    btn.classList.remove("armadura-sem-proficiencia","armadura-equipada");
    resumo.classList.toggle("armadura-sem-proficiencia",!prof);
    btn.querySelector(".armadura-cartao-meta").textContent="🪙 "+formatarValorArma(item.arma_preco,item.arma_moeda)+"   ⚖️ "+formatarKgArma(item.arma_peso);
    const equipada=dadosArmaDoCard(card).equipada;
    btn.querySelector(".armadura-cartao-estado").textContent=equipada?"Equipado":"";
    resumo.classList.toggle("armadura-equipada",equipada);
    btn.setAttribute("aria-label",(item.nome||"Arma")+", "+dano+", "+(prof?"proficiente":"sem proficiência")+". Abrir detalhes");
  });
}

function itemParaModalArma(card) {
  const item=dadosArmaDoCard(card); item.proficiente=!card.querySelector(".item-proficiencia")?.classList.contains("nao"); return item;
}

function montarModalArma() {
  if (document.getElementById("armaModalOverlay")) return;
  const overlay=criarElementoArma("div",undefined,"magia-modal-overlay modal-overlay-base oculto"); overlay.id="armaModalOverlay"; overlay.setAttribute("aria-hidden","true");
  overlay.innerHTML=`<div class="magia-modal modal-base armadura-modal arma-modal" role="dialog" aria-modal="true" aria-labelledby="armaModalTitulo"><div class="magia-modal-topo modal-header-base"><div class="magia-modal-topo-info"><div class="armadura-modal-titulo-linha"><span class="armadura-modal-icone" aria-hidden="true">⚔️</span><h2 id="armaModalTitulo" class="magia-modal-titulo">Arma</h2><button type="button" class="magia-modal-botao armadura-modal-equipar" data-acao="equipar">Equipar</button></div><div id="armaModalTags" class="armadura-modal-categorias"></div></div><div class="magia-modal-acoes"><button type="button" class="magia-modal-botao" data-acao="editar">Editar</button><button type="button" class="magia-modal-botao" data-acao="fechar">Fechar</button></div></div><div id="armaModalVisualizacao"></div><form id="armaModalFormulario" class="armadura-editor" hidden style="display:none"><div class="arma-editor-campos"></div><fieldset class="arma-editor-propriedades"><legend>Propriedades da arma</legend><div class="arma-editor-propriedades-lista"></div></fieldset><div class="armadura-editor-flags"></div><div class="armadura-editor-acoes"><button type="button" class="magia-modal-botao perigo" data-acao="excluir">Excluir arma</button><button type="button" class="magia-modal-botao" data-acao="cancelar">Cancelar</button><button type="submit" class="magia-modal-botao primario">Salvar</button></div></form></div>`;
  document.body.append(overlay);
  overlay.querySelector('[data-acao="fechar"]').onclick=fecharModalArma;
  overlay.querySelector('[data-acao="editar"]').onclick=editarModalArma;
  overlay.querySelector('[data-acao="equipar"]').onclick=alternarEquipamentoArmaModal;
  overlay.querySelector('[data-acao="cancelar"]').onclick=()=>{if(!confirmarDescarteArma())return;renderizarModalArma();overlay.querySelector('[data-acao="editar"]').focus();};
  overlay.querySelector('[data-acao="excluir"]').onclick=()=>{const card=estadoModalArma.card;card.querySelector(".btn-remover-item")?.click();if(!card.isConnected)fecharModalArma(true);};
  overlay.querySelector("form").onsubmit=e=>{e.preventDefault();salvarModalArma();};
  overlay.addEventListener("click",e=>{e.stopPropagation();if(e.target===overlay)fecharModalArma();});
  overlay.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();fecharModalArma();}if(e.key!=="Tab")return;const f=[...overlay.querySelectorAll("button,input,select,textarea")].filter(el=>!el.disabled&&el.getClientRects().length);if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0]?.focus();}});
}

function abrirModalArma(card, editar=false) {
  if(!card)return; montarModalArma(); estadoModalArma.card=card; estadoModalArma.foco=document.activeElement;
  const overlay=document.getElementById("armaModalOverlay");overlay.classList.remove("oculto");overlay.classList.add("ativo");overlay.setAttribute("aria-hidden","false");renderizarModalArma();if(editar)editarModalArma();else overlay.querySelector('[data-acao="editar"]').focus();
}

function renderizarModalArma() {
  const card=estadoModalArma.card;if(!card?.isConnected)return;
  const item=itemParaModalArma(card);document.getElementById("armaModalTitulo").textContent=item.nome;
  const tags=document.getElementById("armaModalTags");tags.replaceChildren();
  [["raridade",item.raridade], ["categoria",item.categoriaProficiencia], ["magico",item.magico?"Item mágico":""], ["sintonizado",item.sintonizado?"Sintonizada":""], ["equipada",item.equipada?"Equipado":""]].filter(([,valor])=>valor).forEach(([tipo,valor])=>{
    const texto = tipo === "categoria" ? (valor === "simples" ? "Simples" : "Marcial") : valor;
    tags.append(adicionarDicaArma(criarElementoArma("span",texto,"magia-modal-nivel"),dicaCaracteristicaArma(tipo,valor)));
  });
  document.getElementById("armaModalVisualizacao").replaceChildren(renderizarDetalhesArma(item,null,card));
  const form=document.getElementById("armaModalFormulario");form.hidden=true;form.style.display="none";document.getElementById("armaModalVisualizacao").hidden=false;
  const acao=document.querySelector('#armaModalOverlay [data-acao="equipar"]');acao.textContent=item.equipada?"Desequipar":"Equipar";acao.hidden=false;document.querySelector('#armaModalOverlay [data-acao="editar"]').hidden=false;
}

function alternarEquipamentoArmaModal() {
  const card=estadoModalArma.card;const cards=[...document.querySelectorAll('#listaArmas .item-card[data-tipo="arma"]:not(#armaModelo)')];const indice=cards.indexOf(card);if(indice<0)return;
  const nomes=[document.getElementById("arma1Nome"),document.getElementById("arma2Nome")];const slotAtual=nomes.findIndex(el=>el?.value===String(indice));
  if(slotAtual>=0){const sel=nomes[slotAtual];sel.value="";sel.dispatchEvent(new Event("change",{bubbles:true}));}
  else {let slot=nomes.findIndex(el=>el&&!el.value);if(slot<0){if(!confirm("Os dois espaços de ataque já estão ocupados. Substituir a arma da mão secundária?"))return;slot=1;}
    if(nomes[slot]){nomes[slot].value=String(indice);nomes[slot].dispatchEvent(new Event("change",{bubbles:true}));}}
  atualizarListaArmasEquipamento();renderizarModalArma();
}

function criarCampoEditorArma(parent,nome,rotulo,tag="input",tipo="text",completo=false) {
  const label=criarElementoArma("label",undefined,completo?"armadura-editor-completo":"");label.append(criarElementoArma("span",rotulo));
  const campo=criarElementoArma(tag);if(tag==="input")campo.type=tipo;campo.dataset.editorCampo=nome;label.append(campo);parent.append(label);return campo;
}

function editarModalArma() {
  const card=estadoModalArma.card,form=document.getElementById("armaModalFormulario");if(!card)return;
  const campos=form.querySelector(".arma-editor-campos");campos.replaceChildren();
  const defs=[["nome","Nome","text"],["arma_raridade","Raridade","select"],["arma_tipo","Categoria de proficiência","select"],["arma_dano","Dano base","text"],["arma_dano_tipo","Tipo de dano","select"],["arma_preco","Valor","number"],["arma_moeda","Moeda","select"],["arma_peso","Peso (kg)","number"],["arma_dist_curto","Alcance normal (m)","number"],["arma_dist_longo","Alcance longo (m)","number"],["arma_descricao","Descrição","textarea"],["arma_descricao_especial","Regra especial","textarea"]];
  for(const [nome,rotulo,tipo] of defs){const select=tipo==="select";const c=criarCampoEditorArma(campos,nome,rotulo,select?"select":tipo==="textarea"?"textarea":"input",tipo==="number"?"number":"text",tipo==="textarea");
    if(nome==="arma_raridade")[["comum","Comum"],["incomum","Incomum"],["raro","Raro"],["muito raro","Muito raro"],["lendário","Lendário"],["artefato","Artefato"]].forEach(([v,t])=>{const o=criarElementoArma("option",t);o.value=v;c.append(o);});
    if(nome==="arma_tipo")[["Simples","Simples"],["Marcial","Marcial"]].forEach(([v,t])=>{const o=criarElementoArma("option",t);o.value=v;c.append(o);});
    if(nome==="arma_dano_tipo")Object.entries(TIPOS_DANO_ARMA).forEach(([v,t])=>{const o=criarElementoArma("option",t);o.value=t;c.append(o);});
    if(nome==="arma_moeda")[["po","PO"],["pp","PP"],["pc","PC"]].forEach(([v,t])=>{const o=criarElementoArma("option",t);o.value=v;c.append(o);});
    if(tipo==="number"){c.min="0";c.step=nome==="arma_peso"?"0.001":"0.1";}
    const valor=nome==="arma_dano"?(card.querySelector('[data-campo="dano_1"]')?.value||card.querySelector('[data-campo="arma_dano"]')?.value||""):card.querySelector('[data-campo="'+(nome==="arma_dano_tipo"?"arma_tipo_dano":nome)+'"]')?.value||"";
    c.value=nome==="arma_raridade"?(valor||"comum"):valor;
  }
  const props=form.querySelector(".arma-editor-propriedades-lista");props.replaceChildren();
  Object.entries(ROTULOS_PROPRIEDADE_ARMA).forEach(([key,labelText])=>{const label=criarElementoArma("label");const cb=criarElementoArma("input");cb.type="checkbox";cb.dataset.editorProp=key;cb.checked=!!card.querySelector('[data-propriedade="'+key+'"]')?.checked;label.append(cb,criarElementoArma("span",labelText));props.append(label);});
  const versatile=form.querySelector('[data-editor-prop="versatil"]');
  const campoDano=form.querySelector('[data-editor-campo="arma_dano"]');
  const versatilBox=criarCampoEditorArma(campos,"arma_dano_versatil","Dano com duas mãos","input","text");versatilBox.value=card.querySelector('[data-campo="dano_2"]')?.value||"";versatilBox.closest("label").classList.add("arma-editor-versatil");versatilBox.closest("label").hidden=!versatile.checked;
  versatile.onchange=()=>{versatilBox.closest("label").hidden=!versatile.checked;};
  const ammoLabel=criarElementoArma("label",undefined,"armadura-editor-completo arma-editor-municao");ammoLabel.append(criarElementoArma("span","Pilha de munição vinculada"));const ammo=criarElementoArma("select");ammo.dataset.editorCampo="arma_municao_id";atualizarOpcoesMunicao(card);card.querySelector('[data-campo="arma_municao_id"]')?.querySelectorAll("option").forEach(o=>{const n=criarElementoArma("option",o.textContent);n.value=o.value;ammo.append(n);});ammo.value=card.querySelector('[data-campo="arma_municao_id"]')?.value||"";ammoLabel.append(ammo);campos.append(ammoLabel);
  const flags=form.querySelector(".armadura-editor-flags");flags.replaceChildren();
  [["proficiente","Proficiente",!card.querySelector(".item-proficiencia")?.classList.contains("nao")],["magico","Item mágico",!!card.querySelector(".item-flag-magico")?.checked],["sintonizado","Sintonizado",!!card.querySelector(".item-flag-sintonizado")?.checked]].forEach(([k,t,checked])=>{const l=criarElementoArma("label");const c=criarElementoArma("input");c.type="checkbox";c.dataset.editorFlag=k;c.checked=checked;l.append(c,criarElementoArma("span",t));flags.append(l);});
  form.querySelector('[data-acao="excluir"]').hidden=false;form.hidden=false;form.style.display="block";document.getElementById("armaModalVisualizacao").hidden=true;document.querySelector('#armaModalOverlay [data-acao="equipar"]').hidden=true;document.querySelector('#armaModalOverlay [data-acao="editar"]').hidden=true;
  estadoModalArma.editando=true;estadoModalArma.retrato=retratoEditorArma(form);form.querySelector('[data-editor-campo="nome"]').focus();
}

function retratoEditorArma(form) { return JSON.stringify({campos:[...form.querySelectorAll("[data-editor-campo]")].map(c=>c.value),props:[...form.querySelectorAll("[data-editor-prop]")].map(c=>c.checked),flags:[...form.querySelectorAll("[data-editor-flag]")].map(c=>c.checked)}); }
function confirmarDescarteArma(){if(!estadoModalArma.editando)return true;const form=document.getElementById("armaModalFormulario");if(estadoModalArma.retrato!==retratoEditorArma(form)&&!confirm("Descartar as alterações feitas nesta arma?"))return false;return true;}

function salvarModalArma() {
  const card=estadoModalArma.card,form=document.getElementById("armaModalFormulario");if(!form.querySelector('[data-editor-campo="nome"]').value.trim()){form.querySelector('[data-editor-campo="nome"]').focus();return;}
  const fields=[...form.querySelectorAll("[data-editor-campo]")];
  const versatile=form.querySelector('[data-editor-prop="versatil"]').checked;
  const checkVers=card.querySelector('[data-propriedade="versatil"]');if(checkVers.checked!==versatile){checkVers.checked=versatile;checkVers.dispatchEvent(new Event("change",{bubbles:true}));}
  const propMap={};form.querySelectorAll("[data-editor-prop]").forEach(c=>propMap[c.dataset.editorProp]=c.checked);
  card.querySelectorAll(".propriedade-checkbox").forEach(c=>{const v=!!propMap[c.dataset.propriedade];if(c.checked!==v){c.checked=v;c.dispatchEvent(new Event("change",{bubbles:true}));}});
  for(const field of fields){const key=field.dataset.editorCampo;if(key==="arma_dano_versatil")continue;if(key==="arma_dano"){
      if(versatile){const one=card.querySelector('[data-campo="dano_1"]'),two=card.querySelector('[data-campo="dano_2"]');if(one)one.value=field.value;if(two)two.value=form.querySelector('[data-editor-campo="arma_dano_versatil"]').value;}
      else {const target=card.querySelector('[data-campo="arma_dano"]');if(target)target.value=field.value;}continue;}
    const target=card.querySelector('[data-campo="'+(key==="arma_dano_tipo"?"arma_tipo_dano":key)+'"]');if(target)target.value=field.value;
  }
  const ammo=card.querySelector('[data-campo="arma_municao_id"]');ammo.value=form.querySelector('[data-editor-campo="arma_municao_id"]').value;ammo.dispatchEvent(new Event("change",{bubbles:true}));
  for(const [k,selector] of [["magico",".item-flag-magico"],["sintonizado",".item-flag-sintonizado"]])card.querySelector(selector).checked=form.querySelector('[data-editor-flag="'+k+'"]').checked;
  const prof=form.querySelector('[data-editor-flag="proficiente"]').checked;card.querySelector(".item-proficiencia").classList.toggle("nao",!prof);card.querySelector(".item-proficiencia").classList.toggle("ativo",prof);
  atualizarMoedaArmaCard(card);atualizarCamposMagicosItem(card);atualizarPesoAtualInventario();atualizarListaArmasEquipamento();estadoModalArma.editando=false;renderizarModalArma();document.querySelector('#armaModalOverlay [data-acao="editar"]').focus();
}

function fecharModalArma(forcar=false){if(forcar!==true&&!confirmarDescarteArma())return;const overlay=document.getElementById("armaModalOverlay");if(!overlay)return;overlay.classList.remove("ativo");overlay.classList.add("oculto");overlay.setAttribute("aria-hidden","true");estadoModalArma.card=null;estadoModalArma.editando=false;estadoModalArma.retrato="";if(estadoModalArma.foco?.isConnected)estadoModalArma.foco.focus();}
