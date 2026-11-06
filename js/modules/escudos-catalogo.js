// Catálogo, seleção e detalhes de escudos; os cartões continuam no formato legado.
const estadoCatalogoEscudos = { dados: null, promessa: null, selecionada: null, foco: null };
const RARIDADES_ESCUDO_CATALOGO = new Set(["comum", "incomum", "raro", "muito raro", "lendário", "artefato"]);
const estadoModalEscudo = { card: null, foco: null, editando: false, retrato: null };

function criarElementoEscudo(tag, texto, classe) {
  const elemento = document.createElement(tag);
  if (texto !== undefined) elemento.textContent = texto;
  if (classe) elemento.className = classe;
  return elemento;
}

function validarCatalogoEscudos(dados) {
  if (dados?.versaoSchema !== 1 || dados.sistema !== "dnd5e-2014" ||
      dados.unidadePeso !== "kg" || !Number.isInteger(dados.versaoCatalogo) ||
      !Array.isArray(dados.itens) || !dados.itens.length) {
    throw new Error("Catálogo de escudos incompatível.");
  }
  const ids = new Set();
  for (const item of dados.itens) {
    if (!item.id || typeof item.id !== "string" || ids.has(item.id) ||
        item.tipo !== "escudo" || !RARIDADES_ESCUDO_CATALOGO.has(item.raridade) ||
        typeof item.nome !== "string" || !item.nome.trim() ||
        typeof item.nomeOriginal !== "string" || typeof item.descricao !== "string" || !item.descricao.trim() ||
        !Number.isFinite(item.pesoKg) || item.pesoKg < 0 ||
        !Number.isFinite(item.custo?.valor) || item.custo.valor < 0 || item.custo.moeda !== "po" ||
        !Number.isFinite(item.ca?.bonus) || item.ca.bonus < 0 ||
        typeof item.desvantagemFurtividade !== "boolean" ||
        typeof item.requerProficiencia !== "boolean" ||
        !Number.isInteger(item.vestirAcoes) || item.vestirAcoes < 1 ||
        !Number.isInteger(item.retirarAcoes) || item.retirarAcoes < 1) {
      throw new Error("Entrada inválida no catálogo de escudos.");
    }
    ids.add(item.id);
  }
  return dados;
}

async function carregarCatalogoEscudos() {
  if (estadoCatalogoEscudos.dados) return estadoCatalogoEscudos.dados;
  if (!estadoCatalogoEscudos.promessa) {
    estadoCatalogoEscudos.promessa = (async () => {
      const resposta = await fetch("../assets/data/itens/escudos.json");
      if (!resposta.ok) throw new Error("Catálogo indisponível.");
      estadoCatalogoEscudos.dados = validarCatalogoEscudos(await resposta.json());
      return estadoCatalogoEscudos.dados;
    })().finally(() => { estadoCatalogoEscudos.promessa = null; });
  }
  return estadoCatalogoEscudos.promessa;
}

function textoBuscaEscudo(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filtrarCatalogoEscudos(itens, busca, apenasProficientes = false) {
  const termo = textoBuscaEscudo(busca).trim();
  return itens.filter(item =>
    (!apenasProficientes || getTemProficienciaEscudo("Escudo")) &&
    textoBuscaEscudo(item.nome + " " + item.nomeOriginal).includes(termo));
}

function formatarKgEscudo(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 }) + " kg";
}

function formatarAcoesEscudo(valor) {
  const quantidade = Number(valor) || 1;
  return quantidade + (quantidade === 1 ? " ação" : " ações");
}

function camposEscudoDoCatalogo(item) {
  return {
    escudo_nome: item.nome,
    escudo_raridade: item.raridade,
    escudo_ca: "+" + item.ca.bonus,
    escudo_tipo: "Escudo",
    escudo_peso: String(item.pesoKg),
    escudo_preco: String(item.custo.valor),
  };
}

function aplicarCatalogoAoCardEscudo(card, item, preservarDescricao = false) {
  for (const [campo, valor] of Object.entries(camposEscudoDoCatalogo(item))) {
    const controle = card.querySelector('[data-campo="' + campo + '"]');
    if (controle) controle.value = valor;
  }
  const descricao = card.querySelector('[data-campo="escudo_descricao"]');
  if (descricao && !preservarDescricao) descricao.value = item.descricao;
  card.dataset.catalogoEscudoId = item.id;
  card.dataset.catalogoEscudoVersao = String(estadoCatalogoEscudos.dados.versaoCatalogo);
  card.dataset.vestirAcoes = String(item.vestirAcoes);
  card.dataset.retirarAcoes = String(item.retirarAcoes);
  atualizarProficienciaCardEscudo(card);
  atualizarPesoAtualInventario();
  atualizarListaArmasEquipamento();
}

function adicionarEscudoDoCatalogo(item) {
  fecharModalSelecaoEscudo();
  const card = adicionarNovoEscudo("Escudo");
  aplicarCatalogoAoCardEscudo(card, item);
  fecharItemCard(card);
  card.querySelector(".escudo-abrir")?.focus();
  return card;
}

function montarModalSelecaoEscudo() {
  if (document.getElementById("escudoSelecaoOverlay")) return;
  const overlay = criarElementoEscudo("div", undefined, "magia-slot-modal-overlay oculto");
  overlay.id = "escudoSelecaoOverlay";
  overlay.innerHTML = `
    <div class="magia-slot-modal magia-selecao-modal armadura-selecao-modal escudo-selecao-modal" role="dialog" aria-modal="true" aria-labelledby="escudoSelecaoTitulo" tabindex="-1">
      <div class="magia-selecao-cabecalho">
        <button type="button" class="magia-selecao-criar" data-acao="criar">Criar escudo</button>
        <h2 id="escudoSelecaoTitulo" class="magia-slot-modal-titulo">Adicionar escudo</h2>
        <button type="button" class="magia-selecao-fechar" data-acao="fechar" aria-label="Fechar janela">×</button>
      </div>
      <div class="magia-selecao-filtros">
        <div><label class="magia-selecao-classe" for="escudoSelecaoBusca">Pesquisar escudo</label>
          <input type="search" id="escudoSelecaoBusca" class="magia-selecao-busca" placeholder="Nome em português ou inglês" autocomplete="off">
        </div>
      </div>
      <label class="armadura-filtro-proficiencia"><input type="checkbox" id="escudoSelecaoProficiencia"> Somente com proficiência</label>
      <p id="escudoSelecaoStatus" role="status"></p>
      <div class="magia-selecao-conteudo">
        <div id="escudoSelecaoLista" class="magia-selecao-lista" aria-label="Escudos disponíveis"></div>
        <div id="escudoSelecaoDetalhes" class="magia-selecao-detalhes" aria-label="Detalhes do escudo"></div>
      </div>
    </div>`;
  document.body.append(overlay);
  overlay.querySelector('[data-acao="fechar"]').onclick = fecharModalSelecaoEscudo;
  overlay.querySelector('[data-acao="criar"]').onclick = () => {
    fecharModalSelecaoEscudo();
    abrirModalEscudo(adicionarNovoEscudo("Escudo"), true);
  };
  overlay.addEventListener("click", evento => {
    if (evento.target === overlay) fecharModalSelecaoEscudo();
  });
  overlay.querySelector("input[type=search]").addEventListener("input", renderizarCatalogoEscudos);
  overlay.querySelector("#escudoSelecaoProficiencia").addEventListener("change", renderizarCatalogoEscudos);
  overlay.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
      evento.preventDefault(); evento.stopPropagation(); fecharModalSelecaoEscudo();
    }
    if (evento.key !== "Tab") return;
    const focaveis = [...overlay.querySelectorAll('button, input, [tabindex="0"]')]
      .filter(elemento => !elemento.disabled && elemento.getClientRects().length);
    const primeiro = focaveis[0], ultimo = focaveis.at(-1);
    if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo?.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro?.focus(); }
  });
}

async function abrirModalSelecaoEscudo() {
  montarModalSelecaoEscudo();
  const overlay = document.getElementById("escudoSelecaoOverlay");
  if (!overlay.classList.contains("ativo")) estadoCatalogoEscudos.foco = document.activeElement;
  estadoCatalogoEscudos.selecionada = null;
  document.getElementById("escudoSelecaoBusca").value = "";
  document.getElementById("escudoSelecaoProficiencia").checked = false;
  overlay.classList.remove("oculto"); overlay.classList.add("ativo");
  overlay.setAttribute("aria-hidden", "false");
  document.getElementById("escudoSelecaoStatus").textContent = "Carregando escudos…";
  document.getElementById("escudoSelecaoBusca").focus();
  try {
    await carregarCatalogoEscudos();
    renderizarCatalogoEscudos();
  } catch {
    document.getElementById("escudoSelecaoLista").replaceChildren();
    document.getElementById("escudoSelecaoDetalhes").replaceChildren();
    const status = document.getElementById("escudoSelecaoStatus");
    status.textContent = "Não foi possível carregar o catálogo. Você pode criar um escudo manualmente. ";
    const tentar = criarElementoEscudo("button", "Tentar novamente");
    tentar.type = "button"; tentar.onclick = abrirModalSelecaoEscudo; status.append(tentar);
  }
}

function fecharModalSelecaoEscudo() {
  const overlay = document.getElementById("escudoSelecaoOverlay");
  if (!overlay) return;
  overlay.classList.remove("ativo"); overlay.classList.add("oculto");
  overlay.setAttribute("aria-hidden", "true");
  if (estadoCatalogoEscudos.foco?.isConnected) estadoCatalogoEscudos.foco.focus();
}

function renderizarCatalogoEscudos() {
  const lista = document.getElementById("escudoSelecaoLista");
  if (!lista || !estadoCatalogoEscudos.dados) return;
  const detalhes = document.getElementById("escudoSelecaoDetalhes");
  const itens = filtrarCatalogoEscudos(estadoCatalogoEscudos.dados.itens,
    document.getElementById("escudoSelecaoBusca").value,
    document.getElementById("escudoSelecaoProficiencia").checked);
  lista.replaceChildren(); detalhes.replaceChildren();
  if (!itens.includes(estadoCatalogoEscudos.selecionada)) estadoCatalogoEscudos.selecionada = itens[0] || null;
  document.getElementById("escudoSelecaoStatus").textContent =
    itens.length ? itens.length + (itens.length === 1 ? " escudo disponível · peso em kg" : " escudos disponíveis · pesos em kg") : "Nenhum escudo encontrado com essa busca.";
  itens.forEach(item => {
    const botao = criarElementoEscudo("button", undefined, "magia-selecao-item");
    botao.type = "button";
    botao.classList.toggle("selecionado", item === estadoCatalogoEscudos.selecionada);
    botao.setAttribute("aria-pressed", String(item === estadoCatalogoEscudos.selecionada));
    botao.append(criarElementoEscudo("strong", item.nome),
      criarElementoEscudo("span", "Bônus de CA +" + item.ca.bonus + " · " + formatarKgEscudo(item.pesoKg)));
    botao.onclick = () => { estadoCatalogoEscudos.selecionada = item; renderizarCatalogoEscudos(); lista.querySelector('[aria-pressed="true"]')?.focus(); };
    lista.append(botao);
  });
  if (estadoCatalogoEscudos.selecionada) {
    detalhes.append(renderizarDetalhesEscudo(estadoCatalogoEscudos.selecionada,
      () => adicionarEscudoDoCatalogo(estadoCatalogoEscudos.selecionada)));
  }
}

function renderizarDetalhesEscudo(item, aoAdicionar = null, proficiente = null, empunhado = false) {
  const container = criarElementoEscudo("article", undefined,
    "magia-card-detalhe armadura-detalhe escudo-detalhe" + (aoAdicionar ? " escudo-previa-catalogo" : ""));
  const header = criarElementoEscudo("header", undefined, "magia-card-detalhe-header");
  const titulo = criarElementoEscudo("div", undefined, "escudo-detalhe-titulo");
  if (aoAdicionar) titulo.append(criarElementoEscudo("span", "🛡️", "armadura-modal-icone"));
  titulo.append(criarElementoEscudo("h3", item.nome || "Novo escudo", "magia-card-detalhe-nome"));
  if (item.nomeOriginal) titulo.append(criarElementoEscudo("div", item.nomeOriginal, "armadura-nome-original"));
  header.append(titulo);
  if (aoAdicionar) {
    const adicionar = criarElementoEscudo("button", "Adicionar ao inventário", "magia-card-detalhe-adicionar");
    adicionar.type = "button"; adicionar.onclick = aoAdicionar; header.append(adicionar);
  }
  const tags = criarElementoEscudo("div", undefined, "magia-card-detalhe-propriedades escudo-tags");
  const base = Number(item.ca?.bonus) || 0;
  const resumoSuperior = criarElementoEscudo("div", undefined, "armadura-resumo-superior");
  const resumoCA = criarElementoEscudo("div", undefined, "armadura-ca-resumo escudo-ca-resumo");
  resumoCA.append(criarElementoEscudo("span", "Bônus de CA", "armadura-resumo-rotulo"),
    criarElementoEscudo("strong", "+" + base, "armadura-resumo-ca"));
  const tempos = criarElementoEscudo("div", undefined, "armadura-tempos-resumo escudo-tempos-resumo");
  [["Empunhar", item.vestirAcoes], ["Guardar", item.retirarAcoes]].forEach(([rotulo, acoes]) => {
    const caixa = criarElementoEscudo("div", undefined, "armadura-tempo-caixa");
    caixa.append(criarElementoEscudo("span", rotulo, "armadura-tempo-rotulo"),
      criarElementoEscudo("strong", formatarAcoesEscudo(acoes), "armadura-tempo-valor"));
    tempos.append(caixa);
  });
  const caTempos = criarElementoEscudo("div", undefined, "armadura-ca-com-tempos escudo-ca-com-tempos");
  caTempos.append(resumoCA, tempos); resumoSuperior.append(caTempos);
  const valores = criarElementoEscudo("div", undefined, "armadura-valores-resumo");
  [["🪙 Peso", formatarKgEscudo(item.pesoKg)], ["⚖️ Valor", Number(item.custo?.valor || 0).toLocaleString("pt-BR") + " po"]].forEach(([rotulo, valor]) => {
    const caixa = criarElementoEscudo("div", undefined, "armadura-valor-caixa");
    caixa.append(criarElementoEscudo("span", rotulo, "armadura-valor-rotulo"),
      criarElementoEscudo("strong", valor, "armadura-valor-numero")); valores.append(caixa);
  });
  resumoSuperior.append(valores);
  const condicoes = criarElementoEscudo("div", undefined, "armadura-condicoes escudo-condicoes");
  [["Força mínima", "Nenhuma"], ["Furtividade", item.desvantagemFurtividade ? "Desvantagem" : "Normal"]].forEach(([rotulo, valor]) => {
    const condicao = criarElementoEscudo("div", undefined, "armadura-condicao");
    condicao.append(criarElementoEscudo("span", rotulo, "armadura-condicao-rotulo"),
      criarElementoEscudo("strong", valor, "armadura-condicao-valor")); condicoes.append(condicao);
  });
  const grade = criarElementoEscudo("div", undefined, "armadura-propriedades"); grade.append(condicoes);
  const descricao = criarElementoEscudo("section", undefined, "armadura-descricao");
  descricao.append(criarElementoEscudo("h4", "Descrição"), criarElementoEscudo("p", item.descricao || "Nenhuma descrição cadastrada."));
  container.append(header, resumoSuperior, tags, grade, descricao);
  const temProficiencia = proficiente ?? getTemProficienciaEscudo("Escudo");
  if (!temProficiencia) {
    const regras = criarElementoEscudo("details", undefined, "armadura-regras"); regras.open = true;
    regras.append(criarElementoEscudo("summary", "⚠️ Atenção: uso sem proficiência"),
      criarElementoEscudo("p", "Enquanto empunhar um escudo sem proficiência, você tem desvantagem em testes, salvaguardas e ataques que envolvam Força ou Destreza e não pode conjurar magias."));
    container.append(regras);
  }
  if (item.magico && !item.sintonizado) {
    const sintonizacao = criarElementoEscudo("details", undefined, "armadura-regras escudo-aviso-sintonizacao"); sintonizacao.open = true;
    sintonizacao.append(criarElementoEscudo("summary", "⚠️ Atenção: item mágico sem sintonização"),
      criarElementoEscudo("p", "Este item mágico ainda não está sintonizado. Lembre-se de sintonizá-lo para usar as propriedades mágicas que exigem sintonização."));
    container.append(sintonizacao);
  }
  return container;
}

function dadosEscudoDoCatalogo(card) {
  const origem = estadoCatalogoEscudos.dados?.itens.find(item => item.id === card.dataset.catalogoEscudoId);
  const campo = nome => card.querySelector('[data-campo="escudo_' + nome + '"]')?.value || "";
  const parseBonus = texto => Math.max(0, Number(String(texto).replace(/[^\d.-]/g, "")) || 0);
  const indice = [...document.querySelectorAll('#listaEscudos .item-card[data-tipo="escudo"]')].indexOf(card);
  const selecionado = document.querySelector('#lista-escudos-equipamento input:checked');
  return {
    nome: campo("nome"), nomeOriginal: origem?.nomeOriginal, ca: { bonus: parseBonus(campo("ca")) },
    pesoKg: Number(campo("peso")), custo: { valor: Number(campo("preco")), moeda: "po" },
    descricao: campo("descricao") || origem?.descricao || "", vestirAcoes: Number(card.dataset.vestirAcoes) || 1,
    retirarAcoes: Number(card.dataset.retirarAcoes) || 1, desvantagemFurtividade: false,
    empunhado: Number(selecionado?.dataset.index) === indice,
    magico: !!card.querySelector(".item-flag-magico")?.checked,
    sintonizado: !!card.querySelector(".item-flag-sintonizado")?.checked,
  };
}

function inicializarResumoEscudo(card) {
  if (card.querySelector(".escudo-resumo")) return;
  const resumo = criarElementoEscudo("div", undefined, "armadura-resumo escudo-resumo");
  const abrir = criarElementoEscudo("button", undefined, "magia-item armadura-abrir escudo-abrir"); abrir.type = "button";
  const info = criarElementoEscudo("span", undefined, "armadura-cartao-info");
  const topo = criarElementoEscudo("span", undefined, "armadura-cartao-topo");
  topo.append(criarElementoEscudo("strong", "", "magia-item-nome"), criarElementoEscudo("span", "", "armadura-cartao-estado"));
  const dados = criarElementoEscudo("span", undefined, "armadura-cartao-dados");
  const ca = criarElementoEscudo("span", undefined, "escudo-cartao-ca");
  ca.append(criarElementoEscudo("span", "Bônus de CA", "escudo-cartao-ca-rotulo"),
    criarElementoEscudo("strong", "", "armadura-cartao-ca"));
  dados.append(ca, criarElementoEscudo("span", undefined, "escudo-cartao-tags"));
  const rodape = criarElementoEscudo("span", undefined, "armadura-cartao-rodape");
  rodape.append(criarElementoEscudo("span", "", "armadura-cartao-proficiencia"), criarElementoEscudo("span", "", "armadura-cartao-meta"));
  info.append(topo, dados, rodape); abrir.append(info);
  abrir.onclick = evento => { evento.stopPropagation(); abrirModalEscudo(card); };
  resumo.append(abrir); card.querySelector(".item-header").after(resumo);
}

function atualizarResumosEscudos(escudos = null) {
  const todosCards = [...document.querySelectorAll('#listaEscudos .item-card[data-tipo="escudo"]')];
  const todosItens = escudos || coletarEscudos();
  todosCards.forEach((card, indice) => {
    const tipo = card.querySelector('[data-campo="escudo_tipo"]')?.value || "Escudo";
    card.classList.toggle("escudo-catalogo", tipo === "Escudo");
    if (tipo !== "Escudo") { card.querySelector(".escudo-resumo")?.remove(); return; }
    inicializarResumoEscudo(card);
    const item = todosItens[indice]; if (!item) return;
    const abrir = card.querySelector(".escudo-abrir");
    const nome = item.escudo_nome?.trim() || "Novo escudo";
    const bonus = String(item.escudo_ca || "+0").trim();
    const proficiente = item.proficiente !== false;
    const empunhado = dadosEscudoDoCatalogo(card).empunhado;
    abrir.querySelector(".magia-item-nome").textContent = nome;
    abrir.querySelector(".armadura-cartao-ca").textContent = bonus.startsWith("+") ? bonus : "+" + bonus;
    const tags = abrir.querySelector(".escudo-cartao-tags"); tags.replaceChildren();
    if (card.querySelector(".item-flag-magico")?.checked) tags.append(criarElementoEscudo("span", "Mágico", "escudo-cartao-tag"));
    if (card.querySelector(".item-flag-sintonizado")?.checked) tags.append(criarElementoEscudo("span", "Sintonizado", "escudo-cartao-tag"));
    abrir.querySelector(".armadura-cartao-meta").textContent = "🪙 " + (Number(item.escudo_preco) || 0) + " PO   ⚖️ " + formatarKgEscudo(item.escudo_peso);
    const aviso = abrir.querySelector(".armadura-cartao-proficiencia");
    aviso.textContent = proficiente ? "" : "⚠️ Sem proficiência"; aviso.hidden = proficiente;
    aviso.title = proficiente ? "" : "⚠️ Sem proficiência";
    abrir.classList.toggle("armadura-sem-proficiencia", !proficiente);
    abrir.querySelector(".armadura-cartao-estado").textContent = empunhado ? "Equipado" : "";
    abrir.classList.toggle("armadura-equipada", empunhado);
    abrir.setAttribute("aria-label", nome + ", bônus de CA " + bonus + (proficiente ? "" : ", sem proficiência") + (empunhado ? ", empunhado" : "") + ". Abrir detalhes");
  });
}

function atualizarVisibilidadeResumoEscudo(card) {
  if ((card.querySelector('[data-campo="escudo_tipo"]')?.value || "Escudo") === "Escudo") {
    card.classList.add("escudo-catalogo"); inicializarResumoEscudo(card);
  } else {
    card.classList.remove("escudo-catalogo"); card.querySelector(".escudo-resumo")?.remove();
  }
}

function montarModalEscudo() {
  if (document.getElementById("escudoModalOverlay")) return;
  const overlay = criarElementoEscudo("div", undefined, "magia-modal-overlay modal-overlay-base oculto");
  overlay.id = "escudoModalOverlay"; overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="magia-modal modal-base armadura-modal escudo-modal" role="dialog" aria-modal="true" aria-labelledby="escudoModalTitulo">
      <div class="magia-modal-topo modal-header-base">
        <div class="magia-modal-topo-info">
          <div class="armadura-modal-titulo-linha">
            <span class="armadura-modal-icone" aria-hidden="true">🛡️</span>
            <h2 id="escudoModalTitulo" class="magia-modal-titulo">Escudo</h2>
            <button type="button" class="magia-modal-botao armadura-modal-equipar" data-acao="empunhar">Empunhar</button>
          </div>
          <div id="escudoModalCategoria" class="armadura-modal-categorias escudo-modal-categorias"></div>
        </div>
        <div class="magia-modal-acoes">
          <button type="button" class="magia-modal-botao modal-close-base" data-acao="editar">Editar</button>
          <button type="button" class="magia-modal-botao modal-close-base" data-acao="fechar">Fechar</button>
        </div>
      </div>
      <div id="escudoModalVisualizacao"></div>
      <form id="escudoModalFormulario" class="armadura-editor" hidden style="display:none">
        <div class="armadura-editor-campos"></div>
        <div class="armadura-editor-flags"></div>
        <div class="armadura-editor-acoes">
          <button type="button" class="magia-modal-botao" data-acao="restaurar">Restaurar padrão</button>
          <button type="button" class="magia-modal-botao perigo" data-acao="excluir">Excluir escudo</button>
          <button type="button" class="magia-modal-botao" data-acao="cancelar">Cancelar</button>
          <button type="submit" class="magia-modal-botao primario">Salvar</button>
        </div>
      </form>
    </div>`;
  document.body.append(overlay);
  overlay.querySelector('[data-acao="fechar"]').onclick = fecharModalEscudo;
  overlay.querySelector('[data-acao="editar"]').onclick = editarModalEscudo;
  overlay.querySelector('[data-acao="empunhar"]').onclick = alternarEmpunharEscudo;
  overlay.querySelector('[data-acao="cancelar"]').onclick = () => {
    if (!confirmarDescarteEdicaoEscudo()) return;
    renderizarModalEscudo(); overlay.querySelector('[data-acao="editar"]').focus();
  };
  overlay.querySelector('[data-acao="restaurar"]').onclick = restaurarPadraoModalEscudo;
  overlay.querySelector('[data-acao="excluir"]').onclick = () => {
    const card = estadoModalEscudo.card; card.querySelector(".btn-remover-item").click();
    if (!card.isConnected) fecharModalEscudo(true);
  };
  overlay.querySelector("form").onsubmit = evento => { evento.preventDefault(); salvarModalEscudo(); };
  overlay.addEventListener("click", evento => { evento.stopPropagation(); if (evento.target === overlay) fecharModalEscudo(); });
  overlay.addEventListener("keydown", evento => {
    if (evento.key === "Escape") { evento.preventDefault(); evento.stopPropagation(); fecharModalEscudo(); }
    if (evento.key !== "Tab") return;
    const focaveis = [...overlay.querySelectorAll("button, input, textarea, summary")].filter(el => !el.disabled && el.getClientRects().length);
    const primeiro = focaveis[0], ultimo = focaveis.at(-1);
    if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo?.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro?.focus(); }
  });
}

function abrirModalEscudo(card, editar = false) {
  montarModalEscudo(); estadoModalEscudo.card = card; estadoModalEscudo.foco = document.activeElement;
  const overlay = document.getElementById("escudoModalOverlay");
  overlay.classList.remove("oculto"); overlay.classList.add("ativo"); overlay.setAttribute("aria-hidden", "false");
  renderizarModalEscudo(); if (editar) editarModalEscudo(); else overlay.querySelector('[data-acao="editar"]').focus();
}

function renderizarModalEscudo() {
  const card = estadoModalEscudo.card; if (!card?.isConnected) return;
  estadoModalEscudo.editando = false; estadoModalEscudo.retrato = null;
  const item = dadosEscudoDoCatalogo(card);
  document.getElementById("escudoModalTitulo").textContent = item.nome || "Novo escudo";
  const categorias = document.getElementById("escudoModalCategoria"); categorias.replaceChildren();
  if (item.empunhado) categorias.append(criarElementoEscudo("span", "Equipado", "magia-modal-nivel escudo-modal-equipado"));
  const tags = criarElementoEscudo("span", undefined, "escudo-modal-tags");
  if (item.magico) tags.append(criarElementoEscudo("span", "Item mágico", "magia-modal-nivel"));
  if (item.sintonizado) tags.append(criarElementoEscudo("span", "Sintonizada", "magia-modal-nivel"));
  if (tags.childElementCount) categorias.append(tags);
  document.getElementById("escudoModalVisualizacao").replaceChildren(
    renderizarDetalhesEscudo(item, null, !card.querySelector(".item-proficiencia")?.classList.contains("nao"), item.empunhado));
  const formulario = document.getElementById("escudoModalFormulario"); formulario.hidden = true; formulario.style.display = "none";
  document.getElementById("escudoModalVisualizacao").hidden = false;
  const empunhar = document.querySelector('#escudoModalOverlay [data-acao="empunhar"]');
  empunhar.textContent = item.empunhado ? "Desequipar" : "Equipar";
  empunhar.hidden = false;
  document.querySelector('#escudoModalOverlay [data-acao="editar"]').hidden = false;
}

function alternarEmpunharEscudo() {
  const card = estadoModalEscudo.card;
  let checkbox = [...document.querySelectorAll("#lista-escudos-equipamento input")]
    .find(input => Number(input.dataset.index) === [...document.querySelectorAll('#listaEscudos .item-card[data-tipo="escudo"]')].indexOf(card));
  if (!checkbox) { atualizarListaArmasEquipamento(); checkbox = [...document.querySelectorAll("#lista-escudos-equipamento input")]
    .find(input => Number(input.dataset.index) === [...document.querySelectorAll('#listaEscudos .item-card[data-tipo="escudo"]')].indexOf(card)); }
  if (!checkbox) return;
  checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event("change", { bubbles: true }));
  atualizarListaArmasEquipamento(); renderizarModalEscudo();
}

function editarModalEscudo() {
  const card = estadoModalEscudo.card, form = document.getElementById("escudoModalFormulario");
  const campos = form.querySelector(".armadura-editor-campos"); campos.replaceChildren();
  const definicoes = [
    ["escudo_nome", "Nome", "text", "nome", true],
    ["escudo_raridade", "Raridade", "select", "raridade", false],
    ["escudo_ca", "Bônus de CA", "text", "ca", false],
    ["escudo_preco", "Valor (po)", "number", "preco", false],
    ["escudo_peso", "Peso (kg)", "number", "peso", false],
    ["escudo_descricao", "Descrição", "textarea", "descricao", false],
  ];
  for (const [nome, rotulo, tipo, coluna, completo] of definicoes) {
    const grupo = criarElementoEscudo("label", undefined, completo || tipo === "textarea" ? "armadura-editor-completo" : "");
    const campo = tipo === "textarea" ? criarElementoEscudo("textarea") : tipo === "select" ? criarElementoEscudo("select") : criarElementoEscudo("input");
    campo.dataset.editorCampo = nome;
    if (tipo === "select") {
      [["comum", "Comum"], ["incomum", "Incomum"], ["raro", "Raro"],
        ["muito raro", "Muito raro"], ["lendário", "Lendário"], ["artefato", "Artefato"]]
        .forEach(([valor, texto]) => {
          const opcao = criarElementoEscudo("option", texto); opcao.value = valor; campo.append(opcao);
        });
    } else if (tipo !== "textarea") campo.type = tipo;
    campo.value = card.querySelector('[data-campo="' + nome + '"]')?.value || (tipo === "select" ? "comum" : "");
    if (tipo === "number") { campo.min = "0"; campo.step = coluna === "peso" ? "0.1" : "1"; }
    if (nome === "escudo_nome") campo.required = true;
    grupo.append(criarElementoEscudo("span", rotulo), campo); campos.append(grupo);
  }
  const flags = form.querySelector(".armadura-editor-flags"); flags.replaceChildren();
  [["proficiente", "Proficiente"], ["magico", "Item mágico"], ["sintonizado", "Sintonizado"]].forEach(([nome, rotulo]) => {
    const label = criarElementoEscudo("label"), input = criarElementoEscudo("input");
    input.type = "checkbox"; input.dataset.editorFlag = nome;
    input.checked = nome === "proficiente" ? !card.querySelector(".item-proficiencia")?.classList.contains("nao") :
      !!card.querySelector(nome === "magico" ? ".item-flag-magico" : ".item-flag-sintonizado")?.checked;
    if (nome === "sintonizado" && !card.querySelector(".item-flag-magico")?.checked) input.disabled = true;
    label.append(input, criarElementoEscudo("span", rotulo)); flags.append(label);
  });
  const checkboxMagico = flags.querySelector('[data-editor-flag="magico"]');
  const checkboxSintonizado = flags.querySelector('[data-editor-flag="sintonizado"]');
  checkboxMagico.onchange = () => { checkboxSintonizado.disabled = !checkboxMagico.checked; if (!checkboxMagico.checked) checkboxSintonizado.checked = false; };
  form.querySelector('[data-acao="restaurar"]').hidden = !card.dataset.catalogoEscudoId;
  form.hidden = false; form.style.display = "block";
  document.getElementById("escudoModalVisualizacao").hidden = true;
  document.querySelector('#escudoModalOverlay [data-acao="editar"]').hidden = true;
  document.querySelector('#escudoModalOverlay [data-acao="empunhar"]').hidden = true;
  estadoModalEscudo.editando = true;
  estadoModalEscudo.retrato = retratoFormularioEscudo(form);
  form.querySelector('[data-editor-campo="escudo_nome"]').focus();
}

function retratoFormularioEscudo(form) {
  return JSON.stringify({
    campos: [...form.querySelectorAll("[data-editor-campo]")].map(campo => campo.value),
    flags: [...form.querySelectorAll("[data-editor-flag]")].map(campo => campo.checked),
  });
}

function confirmarDescarteEdicaoEscudo() {
  if (!estadoModalEscudo.editando) return true;
  const form = document.getElementById("escudoModalFormulario");
  if (estadoModalEscudo.retrato !== retratoFormularioEscudo(form) &&
      !confirm("Descartar as alterações feitas neste escudo?")) return false;
  estadoModalEscudo.retrato = null;
  return true;
}

function salvarModalEscudo() {
  const form = document.getElementById("escudoModalFormulario"); if (!form.reportValidity()) return;
  const card = estadoModalEscudo.card;
  form.querySelectorAll("[data-editor-campo]").forEach(campo => {
    const controle = card.querySelector('[data-campo="' + campo.dataset.editorCampo + '"]');
    if (controle) controle.value = campo.value;
  });
  card.querySelector(".item-flag-magico").checked = form.querySelector('[data-editor-flag="magico"]').checked;
  card.querySelector(".item-flag-sintonizado").checked = form.querySelector('[data-editor-flag="sintonizado"]').checked;
  const proficiente = form.querySelector('[data-editor-flag="proficiente"]').checked;
  card.querySelector(".item-proficiencia").classList.toggle("nao", !proficiente);
  card.querySelector(".item-proficiencia").classList.toggle("ativo", proficiente);
  atualizarCamposMagicosItem(card); atualizarPesoAtualInventario(); atualizarListaArmasEquipamento();
  estadoModalEscudo.retrato = null;
  renderizarModalEscudo(); document.querySelector('#escudoModalOverlay [data-acao="editar"]').focus();
}

async function restaurarPadraoModalEscudo() {
  const card = estadoModalEscudo.card;
  if (!confirm("Restaurar nome e propriedades do catálogo? A descrição personalizada será preservada.")) return;
  try {
    const catalogo = await carregarCatalogoEscudos();
    if (estadoModalEscudo.card !== card || !card.isConnected) return;
    const item = catalogo.itens.find(entrada => entrada.id === card.dataset.catalogoEscudoId);
    if (!item) { alert("Este escudo não está disponível no catálogo atual."); return; }
    aplicarCatalogoAoCardEscudo(card, item, true); renderizarModalEscudo();
    document.querySelector('#escudoModalOverlay [data-acao="editar"]').focus();
  } catch { alert("Não foi possível carregar o catálogo. Suas alterações foram preservadas."); }
}

function fecharModalEscudo(forcar = false) {
  if (forcar !== true && estadoModalEscudo.editando) {
    if (!confirmarDescarteEdicaoEscudo()) return;
    renderizarModalEscudo();
  }
  const overlay = document.getElementById("escudoModalOverlay"); if (!overlay) return;
  overlay.classList.remove("ativo"); overlay.classList.add("oculto"); overlay.setAttribute("aria-hidden", "true");
  estadoModalEscudo.card = null; estadoModalEscudo.editando = false; estadoModalEscudo.retrato = null;
  if (estadoModalEscudo.foco?.isConnected) estadoModalEscudo.foco.focus();
}
