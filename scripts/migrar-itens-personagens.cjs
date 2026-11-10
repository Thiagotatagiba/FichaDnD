/* Migra inventários antigos para o formato consumido pela ficha atual.
 * Uso: node scripts/migrar-itens-personagens.cjs --apply
 * Sem --apply, apenas audita e informa o que seria alterado.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PERSONAGENS = path.join(ROOT, "ficha", "Personagens Ficha");
const CAT_OUTROS = path.join(ROOT, "assets", "data", "itens", "outros");
const aplicar = process.argv.includes("--apply");
const normalizar = valor => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const municoesCatalogo = JSON.parse(fs.readFileSync(path.join(ROOT, "assets", "data", "itens", "municoes.json"), "utf8")).itens;
const registro = JSON.parse(fs.readFileSync(path.join(CAT_OUTROS, "registro.json"), "utf8"));
const outrosCatalogo = registro.catalogos.flatMap(catalogo => JSON.parse(fs.readFileSync(path.join(CAT_OUTROS, catalogo.arquivo), "utf8")).itens);

function buscarItemCatalogo(nome) {
  const chave = normalizar(nome);
  return outrosCatalogo.find(item => normalizar(item.nome) === chave)
    || outrosCatalogo.find(item => chave.startsWith(normalizar(item.nome)) && normalizar(item.nome).length > 7);
}

function buscarMunicaoCatalogo(nome) {
  const chave = normalizar(nome);
  return municoesCatalogo.find(item => normalizar(item.nome) === chave || normalizar(item.nomeOriginal) === chave || chave.includes(normalizar(item.nome))) || null;
}

function tipoLegado(nome, catalogo, tipoAnterior) {
  const chave = normalizar(nome);
  if (catalogo?.tipo === "ferramentas-kits") return catalogo.grupo === "kits" ? "Kit" : "Ferramentas";
  if (catalogo?.tipo === "pacotes-equipamento") return "Kit";
  if (catalogo?.tipo === "consumivel") return "Comida";
  if (catalogo?.tipo === "pocoes") return "Pocao";
  if (catalogo?.tipo === "componentes-materiais") return "Ingrediente";
  if (chave.includes("roupas") || chave.includes("anel de sinete")) return "Vestuario";
  if (chave.startsWith("pocao")) return "Pocao";
  if (chave.startsWith("kit ")) return "Kit";
  if (chave.startsWith("pacote ")) return "Kit";
  if (chave.includes("racao") || chave.includes("comida")) return "Comida";
  const tiposExistentes = { kit: "Kit", ferramentas: "Ferramentas", comida: "Comida", pocao: "Pocao", ingrediente: "Ingrediente", vestuario: "Vestuario", outros: "Outros" };
  return tiposExistentes[normalizar(tipoAnterior)] || "Outros";
}

function converterOutro(origem, arquivo, indice) {
  const nome = String(origem.outro_nome || origem.nome || origem.escudo_nome || "Item sem nome").trim();
  const catalogo = buscarItemCatalogo(nome);
  const legado = tipoLegado(nome, catalogo, origem.outro_tipo || origem.tipo || origem.escudo_tipo);
  const chaveNome = normalizar(nome);
  const tipoFoco = chaveNome.includes("foco arcano") || chaveNome.includes("simbolo sagrado") ? "focos-conjuracao" : "";
  const tiposCatalogoLegados = { Ferramentas: "ferramentas-kits", Pocao: "pocoes", Comida: "consumivel", Ingrediente: "componentes-materiais", Vestuario: "equipamento-geral" };
  const catalogoTipo = catalogo?.tipo || origem.outro_catalogo_tipo || tipoFoco || (legado === "Kit" ? (chaveNome.startsWith("pacote ") ? "pacotes-equipamento" : "ferramentas-kits") : tiposCatalogoLegados[legado] || "equipamento-geral");
  let categoria = catalogo?.grupo || origem.outro_categoria || origem.escudo_categoria || catalogo?.categoria || "";
  if (!categoria) {
    const chave = normalizar(nome);
    categoria = chave.includes("roupas") ? "Vestuário" : chave.includes("anel") ? "Anel" : chave.includes("foco arcano") ? "Foco arcano" : chave.includes("simbolo sagrado") ? "Símbolo sagrado" : catalogoTipo === "equipamento-geral" ? "Equipamento" : catalogoTipo === "pacotes-equipamento" ? "Pacote" : legado === "Kit" ? "kits" : "";
  }
  const preco = origem.outro_preco ?? origem.preco ?? origem.escudo_preco ?? "";
  const peso = origem.outro_peso ?? origem.peso ?? origem.escudo_peso ?? "";
  const consumivelOriginal = origem.outro_consumivel;
  const consumivel = consumivelOriginal == null ? !!(catalogo?.consumivel || ["pocoes", "consumivel"].includes(catalogoTipo)) : consumivelOriginal === true || consumivelOriginal === "true";
  const id = origem.id || origem.instanciaId || `migrado_${normalizar(arquivo).replace(/ /g, "_")}_${normalizar(nome).replace(/ /g, "_")}_${indice}`;
  const item = {
    ...origem,
    id,
    outro_preco: String(preco),
    outro_peso: String(peso),
    outro_quantidade: String(origem.outro_quantidade ?? origem.quantidade ?? "1"),
    outro_nome: nome,
    outro_tipo: legado,
    outro_descricao: origem.outro_descricao ?? origem.descricao ?? origem.escudo_descricao ?? "",
    outro_item_magico: origem.outro_item_magico ?? origem.escudo_item_magico ?? false,
    outro_sintonizado: origem.outro_sintonizado ?? origem.escudo_sintonizado ?? false,
    outro_catalogo_tipo: catalogoTipo,
    outro_catalogo_id: catalogo?.id || origem.outro_catalogo_id || "",
    outro_categoria: categoria,
    outro_raridade: origem.outro_raridade || origem.escudo_raridade || catalogo?.raridade || "comum",
    outro_moeda: origem.outro_moeda || origem.moeda || catalogo?.custo?.moeda || "po",
    outro_consumivel: String(consumivel),
    outro_quantidade_maxima: origem.outro_quantidade_maxima ?? catalogo?.quantidadeMaxima ?? "",
    outro_proficiencia_id: origem.outro_proficiencia_id || catalogo?.proficienciaId || "",
    outro_pode_ser_foco_arcano: origem.outro_pode_ser_foco_arcano ?? (typeof catalogo?.podeSerFocoArcano === "boolean" ? String(catalogo.podeSerFocoArcano) : ""),
    outro_peso_definido: String(origem.outro_peso_definido ?? (peso !== "")),
    outro_preco_definido: String(origem.outro_preco_definido ?? (preco !== "")),
  };
  for (const chave of ["escudo_nome", "escudo_preco", "escudo_peso", "escudo_ca", "escudo_tipo", "escudo_descricao", "escudo_raridade", "escudo_categoria", "escudo_vantagens_pericias", "escudo_equipado", "escudo_item_magico", "escudo_sintonizado", "proficiente", "instanciaId", "nome", "quantidade", "peso", "descricao", "preco", "tipo", "moeda"]) delete item[chave];
  return item;
}

function ehVestimenta(origem) {
  const nome = normalizar(origem.outro_nome || origem.nome || origem.escudo_nome);
  const categoria = normalizar(origem.outro_categoria || origem.escudo_categoria);
  const categoriasVestimenta = new Set(["vestuario", "vestimenta", "anel", "colar", "outro acessorio", "chapeu ou capacete", "calcado"]);
  return normalizar(origem.escudo_tipo) === "vestuario"
    || categoriasVestimenta.has(categoria)
    || /\b(roupas|manto|capa|anel|colar|corrente|chapeu|capacete|coroa|sapato|bota|sandalia)\b/.test(nome);
}

function converterVestimenta(origem) {
  const nome = String(origem.escudo_nome || origem.outro_nome || origem.nome || "Vestimenta sem nome").trim();
  const nomeNormalizado = normalizar(nome);
  const categoriaOriginal = origem.escudo_categoria || origem.outro_categoria;
  const categoria = categoriaOriginal && normalizar(categoriaOriginal) !== "equipamento"
    ? categoriaOriginal
    : nomeNormalizado.includes("anel") ? "Anel"
      : nomeNormalizado.includes("colar") || nomeNormalizado.includes("corrente") ? "Colar"
        : /\b(chapeu|capacete|coroa)\b/.test(nomeNormalizado) ? "Chapéu ou capacete"
          : /\b(sapato|bota|sandalia)\b/.test(nomeNormalizado) ? "Calçado" : "Vestuário";
  return {
    escudo_preco: String(origem.escudo_preco ?? origem.outro_preco ?? origem.preco ?? ""),
    escudo_peso: String(origem.escudo_peso ?? origem.outro_peso ?? origem.peso ?? ""),
    escudo_nome: nome,
    escudo_raridade: origem.escudo_raridade || origem.outro_raridade || "comum",
    escudo_categoria: categoria,
    escudo_vantagens_pericias: origem.escudo_vantagens_pericias || origem.outro_vantagens_pericias || "[]",
    escudo_equipado: String(origem.escudo_equipado ?? origem.outro_equipado ?? "false"),
    escudo_ca: String(origem.escudo_ca ?? origem.outro_bonus_ca ?? "0"),
    escudo_tipo: "Vestuario",
    escudo_descricao: origem.escudo_descricao ?? origem.outro_descricao ?? origem.descricao ?? "",
    escudo_item_magico: origem.escudo_item_magico ?? origem.outro_item_magico ?? false,
    escudo_sintonizado: origem.escudo_sintonizado ?? origem.outro_sintonizado ?? false,
    proficiente: typeof origem.proficiente === "boolean" ? origem.proficiente : true,
  };
}

function converterMunicao(origem) {
  const nome = origem.outro_nome || origem.nome || origem.municao_nome || "Munição";
  const catalogo = buscarMunicaoCatalogo(nome);
  const quantidade = origem.outro_quantidade ?? origem.quantidade ?? origem.municao_quantidade ?? 0;
  return {
    id: origem.id || origem.municao_id || `mun_${normalizar(nome).replace(/ /g, "_")}`,
    municao_nome: origem.municao_nome || nome,
    municao_quantidade: String(quantidade),
    municao_descricao: origem.outro_descricao || origem.descricao || origem.municao_descricao || catalogo?.descricao || "",
    municao_catalogo_id: origem.municao_catalogo_id || catalogo?.id || "",
    municao_quantidade_pacote: String(origem.municao_quantidade_pacote || catalogo?.quantidadePacote || Math.max(1, Number(quantidade) || 1)),
    municao_peso_pacote: String(origem.municao_peso_pacote ?? catalogo?.pesoPacoteKg ?? origem.outro_peso ?? origem.peso ?? 0),
    municao_preco_pacote: String(origem.municao_preco_pacote ?? catalogo?.custo?.valor ?? origem.outro_preco ?? origem.preco ?? 0),
    municao_moeda: origem.municao_moeda || origem.outro_moeda || catalogo?.custo?.moeda || "po",
    municao_raridade: origem.municao_raridade || "comum",
    municao_magica: String(origem.municao_magica ?? origem.outro_item_magico ?? false),
    municao_sintonizado: String(origem.municao_sintonizado ?? origem.outro_sintonizado ?? false),
    municao_bonus_ataque: String(origem.municao_bonus_ataque ?? 0),
    municao_bonus_dano: String(origem.municao_bonus_dano ?? ""),
  };
}

function ehMunicao(item) {
  return normalizar(item.outro_tipo || item.tipo) === "municao" || !!buscarMunicaoCatalogo(item.outro_nome || item.nome);
}

const alteracoes = [];
for (const arquivo of fs.readdirSync(PERSONAGENS).filter(nome => nome.endsWith(".json") && !nome.includes("Em_Branco"))) {
  const caminho = path.join(PERSONAGENS, arquivo);
  const original = fs.readFileSync(caminho, "utf8");
  const ficha = JSON.parse(original);
  const notas = [];
  const escudosValidos = [];
  (ficha.escudos || []).forEach((escudo, indice) => {
    if (!String(escudo.escudo_nome || "").trim()) { notas.push("removido escudo vazio"); return; }
    escudosValidos.push(escudo);
  });

  const linhasOutras = [...(ficha.outros || [])];
  const linhasMunicao = linhasOutras.filter(ehMunicao);
  const linhasVestimenta = linhasOutras.filter(item => !ehMunicao(item) && ehVestimenta(item));
  const linhasItem = linhasOutras.filter(item => !ehMunicao(item) && !ehVestimenta(item));
  (ficha.itens || []).forEach((item, indice) => {
    const migrado = { ...item, id: item.id || `migrado_${normalizar(arquivo).replace(/ /g, "_")}_${normalizar(item.nome).replace(/ /g, "_")}_${indice}` };
    if (ehMunicao(migrado)) linhasMunicao.push(migrado);
    else if (ehVestimenta(migrado)) linhasVestimenta.push(migrado);
    else linhasItem.push(converterOutro(migrado, arquivo, indice));
  });

  const porIdMunicao = new Map((ficha.municoes || []).map(item => [String(item.id), item]));
  linhasMunicao.forEach(item => { const novo = converterMunicao(item); if (!porIdMunicao.has(String(novo.id))) porIdMunicao.set(String(novo.id), novo); });
  const porIdOutro = new Map();
  linhasItem.forEach((item, indice) => { const novo = converterOutro(item, arquivo, indice); porIdOutro.set(String(novo.id), novo); });
  const municoes = [...porIdMunicao.values()];
  const municaoPorId = new Map(municoes.map(item => [String(item.id), item]));
  for (const arma of ficha.armas || []) {
    const usaMunicao = !!arma.usaMunicao || !!arma.propriedades?.municao;
    if (!usaMunicao) {
      if (arma.arma_municao_id) { arma.arma_municao_id = ""; notas.push(`limpo vínculo de munição inválido em ${arma.nome}`); }
      continue;
    }
    if (arma.arma_municao_id && municaoPorId.has(String(arma.arma_municao_id))) continue;
    const nome = normalizar(arma.nome);
    const alvo = nome.includes("besta") ? "virotes" : nome.includes("arco") ? "flechas" : nome.includes("zarabatana") ? "agulhas-zarabatana" : nome.includes("funda") ? "balas-de-funda" : "";
    const municao = municoes.find(item => item.municao_catalogo_id === alvo);
    if (municao) { arma.arma_municao_id = municao.id; notas.push(`vinculada ${arma.nome} a ${municao.municao_nome}`); }
  }
  if (ficha.itens) { notas.push(`migrado inventário legado (${ficha.itens.length} itens)`); delete ficha.itens; }
  const vestimentasExistentes = new Set(escudosValidos.filter(item => normalizar(item.escudo_tipo) === "vestuario").map(item => normalizar(item.escudo_nome)));
  for (const item of linhasVestimenta) {
    const vestimenta = converterVestimenta(item);
    if (!vestimentasExistentes.has(normalizar(vestimenta.escudo_nome))) {
      escudosValidos.push(vestimenta);
      vestimentasExistentes.add(normalizar(vestimenta.escudo_nome));
      notas.push(`movido ${vestimenta.escudo_nome} para vestimentas`);
    }
  }
  if (ficha.escudos || escudosValidos.length) ficha.escudos = escudosValidos;
  ficha.outros = [...porIdOutro.values()];
  ficha.municoes = municoes;

  const serializado = JSON.stringify(ficha, null, 2).replace(/\n/g, original.includes("\r\n") ? "\r\n" : "\n") + (original.endsWith("\n") ? (original.includes("\r\n") ? "\r\n" : "\n") : "");
  if (serializado !== original) {
    alteracoes.push({ arquivo, notas, outros: ficha.outros.length, municoes: ficha.municoes.length, escudos: ficha.escudos?.length || 0 });
    if (aplicar) fs.writeFileSync(caminho, serializado, "utf8");
  }
}

console.log(`${aplicar ? "Atualizados" : "Precisariam de atualização"}: ${alteracoes.length} arquivos de personagens.`);
for (const item of alteracoes) console.log(`- ${item.arquivo}: ${item.outros} itens gerais, ${item.municoes} munições, ${item.escudos} escudos${item.notas.length ? `; ${item.notas.join("; ")}` : ""}`);
