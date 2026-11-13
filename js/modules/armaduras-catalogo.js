// Catálogo estático e seleção de armaduras; os exemplares mantêm o formato legado.
const TIPOS_ARMADURA_CATALOGO = { leve: "Leve", media: "Media", pesada: "Pesada" };
const RARIDADES_ARMADURA_CATALOGO = new Set(["comum", "incomum", "raro", "muito raro", "lendário", "artefato"]);
const estadoCatalogoArmaduras = { dados: null, promessa: null, selecionada: null, foco: null };

function validarCatalogoArmaduras(dados) {
  if (dados?.versaoSchema !== 1 || dados.sistema !== "dnd5e-2014" ||
      dados.unidadePeso !== "kg" || !Number.isInteger(dados.versaoCatalogo) ||
      dados.versaoCatalogo < 1 || !Array.isArray(dados.itens) || !dados.itens.length) throw new Error("Catálogo de armaduras incompatível.");
  const ids = new Set();
  for (const item of dados.itens) {
    const leve = item.categoria === "leve";
    const media = item.categoria === "media";
    if (!item.id || typeof item.id !== "string" || ids.has(item.id) ||
        item.tipo !== "armadura" || !RARIDADES_ARMADURA_CATALOGO.has(item.raridade) ||
        !Object.hasOwn(TIPOS_ARMADURA_CATALOGO, item.categoria) ||
        typeof item.nome !== "string" || !item.nome.trim() || typeof item.nomeOriginal !== "string" ||
        typeof item.descricao !== "string" || !item.descricao.trim() ||
        !Number.isFinite(item.pesoKg) || item.pesoKg < 0 ||
        !Number.isFinite(item.custo?.valor) || item.custo.valor < 0 || item.custo.moeda !== "po" ||
        !Number.isInteger(item.ca?.base) || item.ca.base < 0 ||
        item.ca.adicionaDestreza !== (leve || media) ||
        item.ca.limiteBonusDestreza !== (leve ? null : media ? 2 : 0) ||
        !(item.forcaMinima === null || (Number.isInteger(item.forcaMinima) && item.forcaMinima > 0)) ||
        typeof item.desvantagemFurtividade !== "boolean" ||
        !Number.isFinite(item.vestirMinutos) || item.vestirMinutos <= 0 ||
        !Number.isFinite(item.retirarMinutos) || item.retirarMinutos <= 0) {
      throw new Error("Entrada inválida no catálogo de armaduras.");
    }
    ids.add(item.id);
  }
  return dados;
}

async function carregarCatalogoArmaduras() {
  if (estadoCatalogoArmaduras.dados) return estadoCatalogoArmaduras.dados;
  if (!estadoCatalogoArmaduras.promessa) {
    estadoCatalogoArmaduras.promessa = (async () => {
      const resposta = await fetch("../assets/data/itens/armaduras.json");
      if (!resposta.ok) throw new Error("Catálogo indisponível.");
      const dados = validarCatalogoArmaduras(await resposta.json());
      estadoCatalogoArmaduras.dados = dados;
      return dados;
    })().finally(() => { estadoCatalogoArmaduras.promessa = null; });
  }
  return estadoCatalogoArmaduras.promessa;
}

function camposArmaduraDoCatalogo(item) {
  return {
    armadura_nome: item.nome,
    armadura_raridade: item.raridade,
    armadura_tipo: TIPOS_ARMADURA_CATALOGO[item.categoria],
    armadura_ca: String(item.ca.base),
    armadura_bonus: !item.ca.adicionaDestreza ? "0" : item.ca.limiteBonusDestreza === 2 ? "DES Max 2" : "DES",
    armadura_forca: item.forcaMinima === null ? "" : String(item.forcaMinima),
    armadura_furtividade: item.desvantagemFurtividade ? "Desvantagem" : "Normal",
    armadura_peso: String(item.pesoKg),
    armadura_preco: String(item.custo.valor),
  };
}

function textoBuscaArmadura(texto) {
  return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filtrarCatalogoArmaduras(itens, busca, categoria, apenasProficientes) {
  const termo = textoBuscaArmadura(busca).trim();
  return itens.filter(item =>
    (categoria === "todas" || item.categoria === categoria) &&
    (!apenasProficientes || getTemProficienciaArmadura(TIPOS_ARMADURA_CATALOGO[item.categoria])) &&
    textoBuscaArmadura(item.nome + " " + item.nomeOriginal).includes(termo));
}

function obterModDestrezaArmaduras() {
  const valor = Number(document.getElementById("atrib_des")?.value ?? document.getElementById("des")?.value ?? 10);
  return Math.floor(((Number.isFinite(valor) ? valor : 10) - 10) / 2);
}

function formatarKgArmadura(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 }) + " kg";
}

function formulaCAArmadura(item) {
  return String(item.ca.base) + (!item.ca.adicionaDestreza ? "" :
    item.ca.limiteBonusDestreza === 2 ? " + DES (máx. +2)" : " + DES");
}

function criarElementoArmadura(tag, texto, classe) {
  const elemento = document.createElement(tag);
  if (texto !== undefined) elemento.textContent = texto;
  if (classe) elemento.className = classe;
  return elemento;
}

function aplicarCatalogoAoCardArmadura(card, item) {
  for (const [campo, valor] of Object.entries(camposArmaduraDoCatalogo(item))) {
    const controle = card.querySelector('[data-campo="' + campo + '"]');
    if (controle) controle.value = valor;
  }
  card.dataset.catalogoId = item.id;
  card.dataset.catalogoVersao = String(estadoCatalogoArmaduras.dados.versaoCatalogo);
  card.dataset.vestirMinutos = String(item.vestirMinutos);
  card.dataset.retirarMinutos = String(item.retirarMinutos);
  atualizarProficienciaCardArmadura(card);
  atualizarPesoAtualInventario();
  atualizarListaArmasEquipamento();
}

function adicionarArmaduraDoCatalogo(item) {
  fecharModalSelecaoArmadura();
  const card = adicionarNovaArmadura();
  aplicarCatalogoAoCardArmadura(card, item);
  card.querySelector('[data-campo="armadura_descricao"]').value = item.descricao;
  fecharItemCard(card);
  card.querySelector(".armadura-abrir")?.focus();
  return card;
}

function montarModalSelecaoArmadura() {
  if (document.getElementById("armaduraSelecaoOverlay")) return;
  const overlay = criarElementoArmadura("div", undefined, "magia-slot-modal-overlay oculto");
  overlay.id = "armaduraSelecaoOverlay";
  overlay.innerHTML = `
    <div class="magia-slot-modal magia-selecao-modal armadura-selecao-modal" role="dialog" aria-modal="true" aria-labelledby="armaduraSelecaoTitulo" tabindex="-1">
      <div class="magia-selecao-cabecalho">
        <button type="button" class="magia-selecao-criar" data-acao="criar">Criar armadura</button>
        <h2 id="armaduraSelecaoTitulo" class="magia-slot-modal-titulo">Adicionar armadura</h2>
        <button type="button" class="magia-selecao-fechar" data-acao="fechar" aria-label="Fechar janela">×</button>
      </div>
      <div class="magia-selecao-filtros">
        <div><label class="magia-selecao-classe" for="armaduraSelecaoCategoria">Categoria</label>
          <select id="armaduraSelecaoCategoria" class="magia-selecao-classe-select">
            <option value="todas">Todas</option><option value="leve">Leves</option><option value="media">Médias</option><option value="pesada">Pesadas</option>
          </select>
        </div>
        <div><label class="magia-selecao-classe" for="armaduraSelecaoBusca">Pesquisar armadura</label>
          <input type="search" id="armaduraSelecaoBusca" class="magia-selecao-busca" placeholder="Nome em português ou inglês" autocomplete="off">
        </div>
      </div>
      <label class="armadura-filtro-proficiencia"><input type="checkbox" id="armaduraSelecaoProficiencia"> Somente com proficiência</label>
      <p id="armaduraSelecaoStatus" role="status"></p>
      <div class="magia-selecao-conteudo">
        <div id="armaduraSelecaoLista" class="magia-selecao-lista" aria-label="Armaduras disponíveis"></div>
        <div id="armaduraSelecaoDetalhes" class="magia-selecao-detalhes" aria-label="Detalhes da armadura"></div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('[data-acao="fechar"]').onclick = fecharModalSelecaoArmadura;
  overlay.querySelector('[data-acao="criar"]').onclick = evento => {
    evento.stopPropagation();
    fecharModalSelecaoArmadura();
    const card = adicionarNovaArmadura();
    abrirModalArmadura(card, true);
  };
  overlay.querySelectorAll("select, input").forEach(campo => campo.addEventListener(
    campo.type === "search" ? "input" : "change", renderizarCatalogoArmaduras));
  overlay.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
      evento.preventDefault();
      evento.stopPropagation();
      fecharModalSelecaoArmadura();
    }
    if (evento.key !== "Tab") return;
    const focaveis = [...overlay.querySelectorAll('button, input, select, [tabindex="0"]')]
      .filter(elemento => !elemento.disabled && elemento.getClientRects().length);
    const primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault(); ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault(); primeiro.focus();
    }
  });
}

async function abrirModalSelecaoArmadura() {
  montarModalSelecaoArmadura();
  const overlay = document.getElementById("armaduraSelecaoOverlay");
  if (!overlay.classList.contains("ativo")) estadoCatalogoArmaduras.foco = document.activeElement;
  estadoCatalogoArmaduras.selecionada = null;
  document.getElementById("armaduraSelecaoBusca").value = "";
  document.getElementById("armaduraSelecaoCategoria").value = "todas";
  document.getElementById("armaduraSelecaoProficiencia").checked = false;
  overlay.classList.remove("oculto");
  overlay.classList.add("ativo");
  overlay.setAttribute("aria-hidden", "false");
  document.getElementById("armaduraSelecaoStatus").textContent = "Carregando armaduras…";
  document.getElementById("armaduraSelecaoBusca").focus();
  try {
    await carregarCatalogoArmaduras();
    renderizarCatalogoArmaduras();
    atualizarResumosArmaduras();
  } catch {
    document.getElementById("armaduraSelecaoLista").replaceChildren();
    document.getElementById("armaduraSelecaoDetalhes").replaceChildren();
    const status = document.getElementById("armaduraSelecaoStatus");
    status.textContent = "Não foi possível carregar o catálogo. Você pode criar uma armadura manualmente. ";
    const tentar = criarElementoArmadura("button", "Tentar novamente");
    tentar.type = "button";
    tentar.onclick = abrirModalSelecaoArmadura;
    status.appendChild(tentar);
  }
}

function fecharModalSelecaoArmadura() {
  const overlay = document.getElementById("armaduraSelecaoOverlay");
  if (!overlay) return;
  overlay.classList.remove("ativo");
  overlay.classList.add("oculto");
  overlay.setAttribute("aria-hidden", "true");
  if (estadoCatalogoArmaduras.foco?.isConnected) estadoCatalogoArmaduras.foco.focus();
}

function renderizarCatalogoArmaduras() {
  const lista = document.getElementById("armaduraSelecaoLista");
  if (!lista || !estadoCatalogoArmaduras.dados) return;
  const detalhes = document.getElementById("armaduraSelecaoDetalhes");
  const itens = filtrarCatalogoArmaduras(estadoCatalogoArmaduras.dados.itens,
    document.getElementById("armaduraSelecaoBusca").value,
    document.getElementById("armaduraSelecaoCategoria").value,
    document.getElementById("armaduraSelecaoProficiencia").checked);
  lista.replaceChildren();
  detalhes.replaceChildren();
  if (!itens.includes(estadoCatalogoArmaduras.selecionada)) estadoCatalogoArmaduras.selecionada = itens[0] || null;
  document.getElementById("armaduraSelecaoStatus").textContent =
    itens.length ? itens.length + (itens.length === 1 ? " armadura disponível" : " armaduras disponíveis") + " · pesos em kg" : "Nenhuma armadura encontrada com esses filtros.";
  itens.forEach(item => {
    const botao = criarElementoArmadura("button", undefined, "magia-selecao-item");
    botao.type = "button";
    botao.classList.toggle("selecionado", item === estadoCatalogoArmaduras.selecionada);
    botao.setAttribute("aria-pressed", String(item === estadoCatalogoArmaduras.selecionada));
    botao.append(criarElementoArmadura("strong", item.nome),
      criarElementoArmadura("span", TIPOS_ARMADURA_CATALOGO[item.categoria].replace("Media", "Média") + " · " + formulaCAArmadura(item) + " · " + formatarKgArmadura(item.pesoKg)));
    botao.onclick = () => {
      estadoCatalogoArmaduras.selecionada = item;
      renderizarCatalogoArmaduras();
      [...lista.children].find(el => el.getAttribute("aria-pressed") === "true")?.focus();
    };
    lista.appendChild(botao);
  });
  const item = estadoCatalogoArmaduras.selecionada;
  if (!item) return;
  detalhes.appendChild(renderizarDetalhesArmadura(item, () => adicionarArmaduraDoCatalogo(item)));
}


function renderizarDetalhesArmadura(item, aoAdicionar = null, proficiente = null) {
  const container = criarElementoArmadura("article", undefined, "magia-card-detalhe armadura-detalhe" + (aoAdicionar ? " armadura-previa-catalogo" : ""));
  const header = criarElementoArmadura("header", undefined, "magia-card-detalhe-header");
  const titulo = criarElementoArmadura("div", undefined, "armadura-detalhe-titulo");
  if (aoAdicionar) titulo.append(criarElementoArmadura("span", "👕", "armadura-modal-icone"));
  titulo.append(criarElementoArmadura("h3", item.nome || "Nova armadura", "magia-card-detalhe-nome"));
  if (item.nomeOriginal) titulo.append(criarElementoArmadura("div", item.nomeOriginal, "armadura-nome-original"));
  if (aoAdicionar) {
    const categoriaTitulo = criarElementoArmadura("span", TIPOS_ARMADURA_CATALOGO[item.categoria]?.replace("Media", "Média") || item.tipoExibicao || "Categoria não definida", "magia-modal-nivel armadura-previa-categoria");
    titulo.append(categoriaTitulo);
  }
  header.append(titulo);
  if (aoAdicionar) {
    const adicionar = criarElementoArmadura("button", "Adicionar ao inventário", "magia-card-detalhe-adicionar");
    adicionar.type = "button";
    adicionar.onclick = aoAdicionar;
    header.append(adicionar);
  }
  const tags = criarElementoArmadura("div", undefined, "magia-card-detalhe-propriedades");
  if (item.equipada && aoAdicionar) tags.append(criarElementoArmadura("span", "Equipada", "magia-card-detalhe-tag"));
  const base = Number(item.ca.base) || 0;
  const mod = obterModDestrezaArmaduras();
  const total = base + (item.ca.adicionaDestreza ? item.ca.limiteBonusDestreza === 2 ? Math.min(mod, 2) : mod : 0);
  const grade = criarElementoArmadura("div", undefined, "armadura-propriedades");
  const resumoSuperior = criarElementoArmadura("div", undefined, "armadura-resumo-superior");
  const resumoCA = criarElementoArmadura("div", undefined, "armadura-propriedade-destaque armadura-ca-resumo");
  resumoCA.append(criarElementoArmadura("span", "Classe de armadura", "armadura-resumo-rotulo"),
    criarElementoArmadura("strong", String(total) + " CA", "armadura-resumo-ca"),
    criarElementoArmadura("small", formulaCAArmadura(item), "armadura-ca-calculo"));
  const tempos = criarElementoArmadura("div", undefined, "armadura-tempos-resumo");
  [["Vestir", item.vestirMinutos], ["Retirar", item.retirarMinutos]]
    .filter(([, minutos]) => Number(minutos) > 0)
    .forEach(([rotulo, minutos]) => {
      const caixa = criarElementoArmadura("div", undefined, "armadura-tempo-caixa");
      caixa.append(criarElementoArmadura("span", rotulo, "armadura-tempo-rotulo"),
        criarElementoArmadura("strong", minutos + " min", "armadura-tempo-valor"));
      tempos.append(caixa);
    });
  const caTempos = criarElementoArmadura("div", undefined, "armadura-ca-com-tempos");
  caTempos.append(resumoCA);
  if (tempos.childElementCount) caTempos.append(tempos);
  resumoSuperior.append(caTempos);
  const resumoValores = criarElementoArmadura("div", undefined, "armadura-valores-resumo");
  [["🪙 Peso", formatarKgArmadura(item.pesoKg)], ["⚖️ Valor", Number(item.custo.valor || 0).toLocaleString("pt-BR") + " po"]]
    .forEach(([rotulo, valor]) => {
      const caixa = criarElementoArmadura("div", undefined, "armadura-valor-caixa");
      caixa.append(criarElementoArmadura("span", rotulo, "armadura-valor-rotulo"),
        criarElementoArmadura("strong", valor, "armadura-valor-numero"));
      resumoValores.append(caixa);
    });
  resumoSuperior.append(resumoValores);
  const condicoes = criarElementoArmadura("div", undefined, "armadura-condicoes");
  [["Força mínima", item.forcaMinima || "Nenhuma"],
    ["Furtividade", item.furtividade || (item.desvantagemFurtividade ? "Desvantagem" : "Normal")]]
    .forEach(([rotulo, valor]) => {
      const condicao = criarElementoArmadura("div", undefined, "armadura-condicao");
      condicao.append(criarElementoArmadura("span", rotulo, "armadura-condicao-rotulo"),
        criarElementoArmadura("strong", valor, "armadura-condicao-valor"));
      condicoes.append(condicao);
    });
  grade.append(condicoes);
  const descricao = criarElementoArmadura("section", undefined, "armadura-descricao");
  descricao.append(criarElementoArmadura("h4", "Descrição"),
    criarElementoArmadura("p", item.descricao || "Nenhuma descrição cadastrada."));
  container.append(header, resumoSuperior, tags, grade, descricao);
  const temProficiencia = proficiente ?? getTemProficienciaArmadura(TIPOS_ARMADURA_CATALOGO[item.categoria]);
  if (!temProficiencia || item.forcaMinima) {
    const regras = criarElementoArmadura("details", undefined, "armadura-regras");
    if (!temProficiencia) regras.open = true;
    regras.append(criarElementoArmadura("summary", !temProficiencia ? "⚠️ Atenção: uso sem proficiência" : "Requisito de Força"));
    if (!temProficiencia) regras.append(criarElementoArmadura("p",
      "Enquanto vestir sem proficiência, você tem desvantagem em testes, salvaguardas e ataques que envolvam Força ou Destreza e não pode conjurar magias."));
    if (item.forcaMinima) regras.append(criarElementoArmadura("p",
      "Força abaixo de " + item.forcaMinima + " pode reduzir o deslocamento em 3 m. Confira as exceções da sua raça e características."));
    container.append(regras);
  }
  return container;
}

function lerDetalhesCardArmadura(card) {
  const campo = nome => card.querySelector('[data-campo="armadura_' + nome + '"]')?.value || "";
  const origem = estadoCatalogoArmaduras.dados?.itens.find(item => item.id === card.dataset.catalogoId);
  const bonus = campo("bonus");
  return {
    nome: campo("nome"), nomeOriginal: origem?.nomeOriginal,
    categoria: Object.keys(TIPOS_ARMADURA_CATALOGO).find(tipo => TIPOS_ARMADURA_CATALOGO[tipo] === campo("tipo")),
    tipoExibicao: campo("tipo"), ca: { base: Number(campo("ca")), adicionaDestreza: bonus === "DES" || bonus === "DES Max 2", limiteBonusDestreza: bonus === "DES Max 2" ? 2 : bonus === "DES" ? null : 0 },
    pesoKg: Number(campo("peso")), custo: { valor: Number(campo("preco")), moeda: "po" },
    forcaMinima: campo("forca") && campo("forca") !== "0" ? campo("forca") : null,
    furtividade: campo("furtividade"), descricao: campo("descricao") || origem?.descricao || "",
    vestirMinutos: Number(card.dataset.vestirMinutos), retirarMinutos: Number(card.dataset.retirarMinutos),
    equipada: [...document.querySelectorAll('#listaArmaduras .item-card[data-tipo="armadura"]')].indexOf(card) === normalizarIndiceEquipamento(armaduraEquipadaIndice),
    magico: !!card.querySelector(".item-flag-magico")?.checked,
    sintonizado: !!card.querySelector(".item-flag-sintonizado")?.checked,
  };
}

function inicializarResumoArmadura(card) {
  if (card.querySelector(".armadura-resumo")) return;
  const resumo = criarElementoArmadura("div", undefined, "armadura-resumo");
  const abrir = criarElementoArmadura("button", undefined, "magia-item armadura-abrir");
  abrir.type = "button";
  const info = criarElementoArmadura("span", undefined, "armadura-cartao-info");
  const topo = criarElementoArmadura("span", undefined, "armadura-cartao-topo");
  topo.append(criarElementoArmadura("strong", "", "magia-item-nome"),
    criarElementoArmadura("span", "", "armadura-cartao-estado"));
  const linhaDados = criarElementoArmadura("span", undefined, "armadura-cartao-dados");
  linhaDados.append(criarElementoArmadura("span", "", "armadura-cartao-ca"),
    criarElementoArmadura("span", "", "armadura-cartao-categoria"),
    criarElementoArmadura("span", "", "armadura-cartao-furtividade"));
  const rodape = criarElementoArmadura("span", undefined, "armadura-cartao-rodape");
  rodape.append(criarElementoArmadura("span", "", "armadura-cartao-proficiencia"),
    criarElementoArmadura("span", "", "armadura-cartao-meta"));
  info.append(topo, linhaDados, rodape);
  abrir.append(info);
  abrir.onclick = evento => { evento.stopPropagation(); abrirModalArmadura(card); };
  resumo.append(abrir);
  card.querySelector(".item-header").after(resumo);
}

function atualizarResumosArmaduras(armaduras = null) {
  const cards = [...document.querySelectorAll('#listaArmaduras .item-card[data-tipo="armadura"]')];
  const itens = armaduras || coletarArmaduras();
  cards.forEach((card, indice) => {
    inicializarResumoArmadura(card);
    const item = itens[indice];
    if (!item) return;
    const equipada = normalizarIndiceEquipamento(armaduraEquipadaIndice) === indice;
    const ca = calcularCATotal(item.armadura_ca, item.armadura_bonus, obterModDestrezaArmaduras());
    const abrir = card.querySelector(".armadura-abrir");
    abrir.querySelector(".magia-item-nome").textContent = item.armadura_nome?.trim() || "Nova armadura";
    abrir.querySelector(".armadura-cartao-categoria").textContent = (item.armadura_tipo || "Sem categoria").replace("Media", "Média");
    abrir.querySelector(".armadura-cartao-ca").textContent = "CA " + ca;
    const furtividade = abrir.querySelector(".armadura-cartao-furtividade");
    const efeitoFurtividade = item.armadura_furtividade || "Normal";
    furtividade.textContent = efeitoFurtividade === "Desvantagem" ? "↓ Furtividade" : efeitoFurtividade === "Vantagem" ? "↑ Furtividade" : "";
    furtividade.hidden = efeitoFurtividade !== "Desvantagem" && efeitoFurtividade !== "Vantagem";
    furtividade.title = efeitoFurtividade === "Desvantagem" ? "⚠️ Desvantagem em Furtividade" : efeitoFurtividade === "Vantagem" ? "✅ Vantagem em Furtividade" : "";
    furtividade.setAttribute("aria-label", furtividade.title);
    furtividade.classList.toggle("armadura-furtividade-vantagem", efeitoFurtividade === "Vantagem");
    abrir.querySelector(".armadura-cartao-meta").textContent =
      "🪙 " + (Number(item.armadura_preco) || 0) + " PO   ⚖️ " + formatarKgArmadura(item.armadura_peso);
    const proficiencia = abrir.querySelector(".armadura-cartao-proficiencia");
    const proficiente = item.proficiente !== false;
    proficiencia.textContent = proficiente ? "" : "⚠️ Sem proficiência";
    proficiencia.hidden = proficiente;
    proficiencia.title = proficiente ? "" : "⚠️ Sem proficiência";
    abrir.classList.toggle("armadura-sem-proficiencia", !proficiente);
    abrir.querySelector(".armadura-cartao-estado").textContent = equipada ? "Equipada" : "";
    abrir.classList.toggle("armadura-equipada", equipada);
    abrir.setAttribute("aria-label", (item.armadura_nome?.trim() || "Nova armadura") + ", CA " + ca + (proficiente ? "" : ", sem proficiência") + (equipada ? ", equipada" : "") + ". Abrir detalhes");
  });
}

const estadoModalArmadura = { card: null, foco: null, editando: false, original: "", invalidada: false, sessao: 0 };

function cardArmaduraNaListaAtiva(card) {
  const lista = document.getElementById("listaArmaduras");
  return Boolean(
    card && card.isConnected && lista?.contains(card) &&
    card.matches('.item-card[data-tipo="armadura"]') && card.id !== "armaduraModelo",
  );
}

function editorArmaduraPodeAgir() {
  const card = estadoModalArmadura.card;
  if (window.__fichaImportacaoTransacaoAtiva) return false;
  if (!card || estadoModalArmadura.invalidada || !cardArmaduraNaListaAtiva(card)) {
    if (card) {
      estadoModalArmadura.invalidada = true;
      fecharModalArmadura(true);
    }
    return false;
  }
  return true;
}

globalThis.__reconciliarEditorArmaduraImportacao = function () {
  try {
    const card = estadoModalArmadura.card;
    const overlay = document.getElementById("armaduraModalOverlay");
    if (!card) {
      // O snapshot DOM pode reabrir visualmente um overlay já invalidado. Sem
      // uma referência privada válida, esse modal é órfão e deve ficar fechado.
      if (overlay?.classList.contains("ativo")) fecharModalArmadura(true);
      return { ok: true, closed: Boolean(overlay?.classList.contains("oculto")) };
    }
    if (!estadoModalArmadura.invalidada && cardArmaduraNaListaAtiva(card)) {
      return { ok: true, closed: false };
    }
    estadoModalArmadura.invalidada = true;
    fecharModalArmadura(true);
    if (estadoModalArmadura.card || overlay?.classList.contains("ativo")) {
      throw new Error("O editor de armadura obsoleto não foi encerrado.");
    }
    return { ok: true, closed: true };
  } catch (error) {
    return { ok: false, error };
  }
};

function focarModalArmadura(overlay, evento) {
  if (evento.key !== "Tab") return;
  const campos = [...overlay.querySelectorAll("button, input, select, textarea, summary")]
    .filter(campo => !campo.disabled && campo.getClientRects().length);
  const primeiro = campos[0], ultimo = campos.at(-1);
  if (evento.shiftKey && document.activeElement === primeiro) {
    evento.preventDefault(); ultimo?.focus();
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault(); primeiro?.focus();
  }
}

function montarModalArmadura() {
  if (document.getElementById("armaduraModalOverlay")) return;
  const overlay = criarElementoArmadura("div", undefined, "magia-modal-overlay modal-overlay-base oculto");
  overlay.id = "armaduraModalOverlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="magia-modal modal-base armadura-modal" role="dialog" aria-modal="true" aria-labelledby="armaduraModalTitulo">
      <div class="magia-modal-topo modal-header-base">
      <div class="magia-modal-topo-info">
        <div class="armadura-modal-titulo-linha">
          <span class="armadura-modal-icone" aria-hidden="true">👕</span>
          <h2 id="armaduraModalTitulo" class="magia-modal-titulo">Armadura</h2>
          <button type="button" class="magia-modal-botao armadura-modal-equipar" data-acao="equipar">Equipar</button>
        </div>
        <div id="armaduraModalCategoria" class="armadura-modal-categorias"></div>
      </div>
        <div class="magia-modal-acoes">
          <button type="button" class="magia-modal-botao modal-close-base" data-acao="editar">✏️ Editar</button>
          <button type="button" class="magia-modal-botao modal-close-base" data-acao="fechar">Fechar</button>
        </div>
      </div>
      <div id="armaduraModalVisualizacao"></div>
      <form id="armaduraModalFormulario" class="armadura-editor" hidden style="display:none">
        <div class="armadura-editor-campos"></div>
        <div class="armadura-editor-flags"></div>
        <div class="armadura-editor-acoes">
          <button type="button" class="magia-modal-botao" data-acao="restaurar">Restaurar padrão</button>
          <button type="button" class="magia-modal-botao perigo" data-acao="excluir">Excluir armadura</button>
          <button type="button" class="magia-modal-botao" data-acao="cancelar">Cancelar</button>
          <button type="submit" class="magia-modal-botao primario">Salvar</button>
        </div>
      </form>
    </div>`;
  document.body.append(overlay);
  overlay.querySelector('[data-acao="fechar"]').onclick = fecharModalArmadura;
  overlay.querySelector('[data-acao="editar"]').onclick = editarModalArmadura;
  overlay.querySelector('[data-acao="equipar"]').onclick = () => {
    if (!editorArmaduraPodeAgir()) return;
    const card = estadoModalArmadura.card;
    const indice = [...document.querySelectorAll('#listaArmaduras .item-card[data-tipo="armadura"]')].indexOf(card);
    equiparArmadura(normalizarIndiceEquipamento(armaduraEquipadaIndice) === indice ? null : indice);
    atualizarListaArmasEquipamento();
    renderizarModalArmadura();
  };
  overlay.querySelector('[data-acao="cancelar"]').onclick = () => {
    if (confirmarDescarteModalArmadura()) {
      renderizarModalArmadura();
      overlay.querySelector('[data-acao="editar"]').focus();
    }
  };
  overlay.querySelector('[data-acao="restaurar"]').onclick = restaurarPadraoModalArmadura;
  overlay.querySelector('[data-acao="excluir"]').onclick = () => {
    if (!editorArmaduraPodeAgir()) return;
    const card = estadoModalArmadura.card;
    card.querySelector(".btn-remover-item").click();
    if (!card.isConnected) fecharModalArmadura(true);
  };
  overlay.querySelector("form").onsubmit = evento => {
    evento.preventDefault();
    salvarModalArmadura();
  };
  overlay.addEventListener("keydown", evento => {
    if (evento.key === "Escape") { evento.preventDefault(); evento.stopPropagation(); fecharModalArmadura(); }
    focarModalArmadura(overlay, evento);
  });
}

function retratoEditorArmadura() {
  return JSON.stringify([...document.querySelectorAll("#armaduraModalFormulario [data-editor-campo], #armaduraModalOverlay [data-editor-flag]")]
    .map(campo => campo.type === "checkbox" ? campo.checked : campo.value));
}

function confirmarDescarteModalArmadura() {
  return !estadoModalArmadura.editando || retratoEditorArmadura() === estadoModalArmadura.original ||
    confirm("Descartar as alterações não salvas desta armadura?");
}

function abrirModalArmadura(card, editar = false) {
  if (window.__fichaImportacaoTransacaoAtiva || !cardArmaduraNaListaAtiva(card)) return;
  if (estadoModalArmadura.card && !confirmarDescarteModalArmadura()) return;
  montarModalArmadura();
  estadoModalArmadura.sessao += 1;
  estadoModalArmadura.card = card;
  estadoModalArmadura.invalidada = false;
  estadoModalArmadura.foco = document.activeElement;
  const overlay = document.getElementById("armaduraModalOverlay");
  overlay.classList.remove("oculto");
  overlay.classList.add("ativo");
  overlay.setAttribute("aria-hidden", "false");
  renderizarModalArmadura();
  if (editar) editarModalArmadura();
  else overlay.querySelector('[data-acao="editar"]').focus();
  if (card.dataset.catalogoId && !estadoCatalogoArmaduras.dados) {
    carregarCatalogoArmaduras().then(() => {
      if (estadoModalArmadura.card === card && !estadoModalArmadura.editando) renderizarModalArmadura();
    }).catch(() => {});
  }
}

function renderizarModalArmadura() {
  const card = estadoModalArmadura.card;
  if (!editorArmaduraPodeAgir()) return;
  estadoModalArmadura.editando = false;
  const dados = lerDetalhesCardArmadura(card);
  document.getElementById("armaduraModalTitulo").textContent = dados.nome || "Nova armadura";
  const categorias = document.getElementById("armaduraModalCategoria");
  categorias.replaceChildren(criarElementoArmadura("span", (dados.tipoExibicao || "Armadura").replace("Media", "Média"), "magia-modal-nivel"));
  if (dados.equipada) categorias.append(criarElementoArmadura("span", "Equipada", "magia-modal-nivel"));
  if (dados.magico) categorias.append(criarElementoArmadura("span", "Item mágico", "magia-modal-nivel"));
  if (dados.sintonizado) categorias.append(criarElementoArmadura("span", "Sintonizada", "magia-modal-nivel"));
  const visualizacao = document.getElementById("armaduraModalVisualizacao");
  visualizacao.replaceChildren(renderizarDetalhesArmadura(dados, null, !card.querySelector(".item-proficiencia").classList.contains("nao")));
  const acoesRemocao=criarElementoArmadura("div",undefined,"inventario-modal-acoes-inferior");const remover=criarElementoArmadura("button","🗑️ Remover","magia-modal-botao perigo");remover.type="button";remover.setAttribute("aria-label","Remover armadura");remover.addEventListener("click",()=>document.querySelector('#armaduraModalFormulario [data-acao="excluir"]').click());acoesRemocao.append(remover);visualizacao.append(acoesRemocao);
  visualizacao.hidden = false;
  const form = document.getElementById("armaduraModalFormulario");
  const flags = document.querySelector("#armaduraModalOverlay .armadura-editor-flags");
  if (flags && flags.parentElement !== form) form.append(flags);
  form.hidden = true; form.style.display = "none";
  const overlay = document.getElementById("armaduraModalOverlay");
  overlay.querySelector('[data-acao="fechar"]').hidden = false;
  overlay.querySelector('[data-acao="editar"]').hidden = false;
  const equipar = overlay.querySelector('[data-acao="equipar"]');
  equipar.hidden = false; equipar.textContent = dados.equipada ? "Desequipar" : "Equipar";
  equipar.disabled = !dados.nome.trim();
}

function editarModalArmadura() {
  if (!editorArmaduraPodeAgir()) return;
  estadoModalArmadura.sessao += 1;
  const sessaoEditor = estadoModalArmadura.sessao;
  const card = estadoModalArmadura.card;
  const form = document.getElementById("armaduraModalFormulario");
  form.onsubmit = evento => {
    evento.preventDefault();
    salvarModalArmadura(sessaoEditor);
  };
  const campos = form.querySelector(".armadura-editor-campos");
  campos.replaceChildren();
  const rotulos = {
    armadura_nome: "Nome", armadura_raridade: "Raridade", armadura_tipo: "Categoria", armadura_ca: "CA base",
    armadura_bonus: "Destreza na CA", armadura_peso: "Peso (kg)", armadura_preco: "Valor (po)",
    armadura_forca: "Força mínima", armadura_furtividade: "Furtividade", armadura_descricao: "Descrição e anotações"
  };
  Object.entries(rotulos).forEach(([nome, rotulo]) => {
    const origem = card.querySelector('[data-campo="' + nome + '"]');
    if (!origem) return;
    const grupo = criarElementoArmadura("label", undefined, nome === "armadura_nome" || nome === "armadura_descricao" ? "armadura-editor-completo" : "");
    const campo = nome === "armadura_raridade" ? criarElementoArmadura("select") : origem.cloneNode(true);
    if (nome === "armadura_raridade") {
      [["comum", "Comum"], ["incomum", "Incomum"], ["raro", "Raro"],
        ["muito raro", "Muito raro"], ["lendário", "Lendário"], ["artefato", "Artefato"]]
        .forEach(([valor, texto]) => {
          const opcao = criarElementoArmadura("option", texto);
          opcao.value = valor;
          campo.append(opcao);
        });
    }
    campo.removeAttribute("data-campo");
    campo.removeAttribute("id");
    campo.className = "";
    campo.dataset.editorCampo = nome;
    campo.value = nome === "armadura_raridade" ? origem.value || "comum" : origem.value;
    if (nome === "armadura_nome") campo.required = true;
    grupo.append(criarElementoArmadura("span", rotulo), campo);
    campos.append(grupo);
  });
  const flags = form.querySelector(".armadura-editor-flags");
  flags.replaceChildren();
  [["magico", "Item mágico"], ["sintonizado", "Sintonizada"], ["proficiente", "Com proficiência"]].forEach(([nome, rotulo]) => {
    const label = criarElementoArmadura("label");
    const input = criarElementoArmadura("input");
    input.type = "checkbox";
    input.dataset.editorFlag = nome;
    input.checked = nome === "proficiente" ? !card.querySelector(".item-proficiencia").classList.contains("nao") :
      !!card.querySelector(nome === "magico" ? ".item-flag-magico" : ".item-flag-sintonizado")?.checked;
    label.append(input, criarElementoArmadura("span", rotulo));
    flags.append(label);
  });
  const magico = flags.querySelector('[data-editor-flag="magico"]');
  const sintonizado = flags.querySelector('[data-editor-flag="sintonizado"]');
  const atualizarSintonizacao = () => { sintonizado.disabled = !magico.checked; if (!magico.checked) sintonizado.checked = false; };
  magico.onchange = atualizarSintonizacao;
  atualizarSintonizacao();
  form.querySelector('[data-editor-campo="armadura_tipo"]').onchange = evento => {
    flags.querySelector('[data-editor-flag="proficiente"]').checked = getTemProficienciaArmadura(evento.target.value);
  };
  form.querySelector('[data-acao="restaurar"]').hidden = !card.dataset.catalogoId;
  form.hidden = false; form.style.display = "block";
  document.querySelector("#armaduraModalOverlay .magia-modal-topo").append(flags);
  document.getElementById("armaduraModalVisualizacao").hidden = true;
  document.querySelector('#armaduraModalOverlay [data-acao="editar"]').hidden = true;
  document.querySelector('#armaduraModalOverlay [data-acao="equipar"]').hidden = true;
  document.querySelector('#armaduraModalOverlay [data-acao="fechar"]').hidden = true;
  estadoModalArmadura.editando = true;
  estadoModalArmadura.original = retratoEditorArmadura();
  form.querySelector('[data-editor-campo="armadura_nome"]').focus();
}

function salvarModalArmadura(sessaoEsperada = estadoModalArmadura.sessao) {
  if (sessaoEsperada !== estadoModalArmadura.sessao || !estadoModalArmadura.editando) return false;
  if (!editorArmaduraPodeAgir()) return false;
  const form = document.getElementById("armaduraModalFormulario");
  if (!form.reportValidity()) return;
  const card = estadoModalArmadura.card;
  form.querySelectorAll("[data-editor-campo]").forEach(campo => {
    card.querySelector('[data-campo="' + campo.dataset.editorCampo + '"]').value = campo.value;
  });
  card.querySelector(".item-flag-magico").checked = document.querySelector('#armaduraModalOverlay [data-editor-flag="magico"]').checked;
  card.querySelector(".item-flag-sintonizado").checked = document.querySelector('#armaduraModalOverlay [data-editor-flag="sintonizado"]').checked;
  const proficiente = document.querySelector('#armaduraModalOverlay [data-editor-flag="proficiente"]').checked;
  const indicador = card.querySelector(".item-proficiencia");
  indicador.classList.toggle("nao", !proficiente); indicador.classList.toggle("ativo", proficiente);
  atualizarCamposMagicosItem(card);
  atualizarPesoAtualInventario();
  atualizarListaArmasEquipamento();
  equiparArmadura(armaduraEquipadaIndice);
  renderizarModalArmadura();
  document.querySelector('#armaduraModalOverlay [data-acao="editar"]').focus();
}

async function restaurarPadraoModalArmadura() {
  if (!editorArmaduraPodeAgir()) return;
  const card = estadoModalArmadura.card;
  if (!confirm("Restaurar nome e propriedades do catálogo? Alterações não salvas serão descartadas; descrição e propriedades mágicas já salvas serão preservadas.")) return;
  const epochImportacao = window.__fichaImportacaoEpoch || 0;
  try {
    const catalogo = await carregarCatalogoArmaduras();
    if ((window.__fichaImportacaoEpoch || 0) !== epochImportacao || window.__fichaImportacaoTransacaoAtiva) return;
    if (!editorArmaduraPodeAgir() || estadoModalArmadura.card !== card || !cardArmaduraNaListaAtiva(card)) return;
    const item = catalogo.itens.find(entrada => entrada.id === card.dataset.catalogoId);
    if (!item) { alert("Esta armadura não está disponível no catálogo atual."); return; }
    aplicarCatalogoAoCardArmadura(card, item);
    equiparArmadura(armaduraEquipadaIndice);
    renderizarModalArmadura();
    document.querySelector('#armaduraModalOverlay [data-acao="editar"]').focus();
  } catch { alert("Não foi possível carregar o catálogo. Suas alterações foram preservadas."); }
}

function fecharModalArmadura(forcar = false) {
  // Handlers recebem Event; somente true explícito ignora a confirmação.
  if (forcar !== true && !confirmarDescarteModalArmadura()) return;
  const overlay = document.getElementById("armaduraModalOverlay");
  if (!overlay) return;
  overlay.classList.remove("ativo"); overlay.classList.add("oculto");
  overlay.setAttribute("aria-hidden", "true");
  estadoModalArmadura.card = null; estadoModalArmadura.editando = false;
  estadoModalArmadura.sessao += 1;
  estadoModalArmadura.invalidada = false;
  if (estadoModalArmadura.foco?.isConnected) estadoModalArmadura.foco.focus();
}

