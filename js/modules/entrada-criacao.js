const PREFIXO_TRANSPORTE_CRIACAO = "DND_CREATE:";
const CHAVE_CRIACAO_LEGADA = "fichaCriacaoPendente";

function avisarEntradaCriacao(mensagem) {
  let aviso = document.getElementById("avisoEntradaCriacao");
  if (!aviso) {
    aviso = document.createElement("div");
    aviso.id = "avisoEntradaCriacao";
    aviso.setAttribute("role", "alert");
    aviso.setAttribute("aria-live", "assertive");
    aviso.style.cssText = "position:fixed;z-index:10000;top:12px;left:50%;transform:translateX(-50%);max-width:min(680px,calc(100% - 24px));padding:12px 16px;border:2px solid #8b4513;border-radius:8px;background:#fff8e8;color:#5f2d0c;box-shadow:0 4px 16px #0003;font:16px sans-serif";
    document.body.prepend(aviso);
  }
  aviso.textContent = mensagem;
}

function restaurarNomeAnteriorCriacao(transporte) {
  if (typeof transporte?.previousName === "string") window.name = transporte.previousName;
}

function validarPayloadCriacao(personagem) {
  if (!personagem || typeof personagem !== "object" || Array.isArray(personagem)) return "O conteúdo temporário não tem o formato de personagem esperado.";
  const dados = window.DND_PERSONAGEM_OPTIONS;
  const textos = ["nomePersonagem", "jogador", "antecedenteID"];
  const chaves = [...textos, "racaID", "subraca", "classeNomeID", "subclasse", "alinhamentoID", "for", "des", "con", "int", "sab", "car"];
  if (Object.keys(personagem).some((chave) => !chaves.includes(chave))) return "O conteúdo temporário contém campos não reconhecidos.";
  for (const chave of textos) {
    if (Object.prototype.hasOwnProperty.call(personagem, chave) && (typeof personagem[chave] !== "string" || !personagem[chave].trim())) return "O campo " + chave + " está inválido.";
  }
  if (Object.prototype.hasOwnProperty.call(personagem, "racaID") && !dados.races.some(([valor]) => valor === personagem.racaID)) return "A raça escolhida não está mais disponível.";
  if (Object.prototype.hasOwnProperty.call(personagem, "subraca")) {
    const raca = dados.races.find(([valor]) => valor === personagem.racaID);
    if (!raca || !(dados.subracas[raca[2]] || []).includes(personagem.subraca)) return "A sub-raça não corresponde à raça escolhida.";
  }
  if (Object.prototype.hasOwnProperty.call(personagem, "classeNomeID") && !dados.classes.some(([valor]) => valor === personagem.classeNomeID)) return "A classe escolhida não está mais disponível.";
  if (Object.prototype.hasOwnProperty.call(personagem, "subclasse")) {
    const classe = personagem.classeNomeID;
    const regra = dados.regrasSubclasse[classe];
    if (!classe || !regra || regra.nivel > 1 || !Array.isArray(dados.subclasses[classe]) || !dados.subclasses[classe].includes(personagem.subclasse)) return "A subclasse não está disponível para a classe no nível inicial.";
  }
  if (Object.prototype.hasOwnProperty.call(personagem, "alinhamentoID") && !dados.alignments.includes(personagem.alinhamentoID)) return "O alinhamento escolhido não está disponível.";
  for (const chave of ["for", "des", "con", "int", "sab", "car"]) {
    if (!Object.prototype.hasOwnProperty.call(personagem, chave) || typeof personagem[chave] !== "number" || !Number.isInteger(personagem[chave]) || personagem[chave] < 3 || personagem[chave] > 20) return "O atributo " + chave + " precisa ser um número inteiro de 3 a 20.";
  }
  return "";
}

async function processarModoEntradaCriacao() {
  const parametros = new URLSearchParams(window.location.search);
  const modo = parametros.get("modo");
  if (modo !== "branco" && modo !== "criacao") return false;
  try { sessionStorage.removeItem(CHAVE_CRIACAO_LEGADA); } catch (erro) {}

  if (modo === "branco") {
    let importacaoPendente = null;
    try { importacaoPendente = localStorage.getItem("fichaImportarPendente"); }
    catch (erro) { avisarEntradaCriacao("A ficha abrirá em branco. Não foi possível verificar se há uma importação JSON pendente."); }
    if (importacaoPendente) {
      if (window.confirm("Existe um personagem JSON aguardando importação. Iniciar uma ficha em branco vai descartar essa cópia temporária. Deseja continuar?")) {
        try { localStorage.removeItem("fichaImportarPendente"); }
        catch (erro) { avisarEntradaCriacao("A importação pendente não pôde ser removida e foi preservada. Ela não foi aplicada nesta abertura em branco."); }
      } else {
        avisarEntradaCriacao("A ficha abriu em branco e a importação JSON foi preservada. Ela poderá ser aplicada na próxima abertura normal da ficha.");
      }
    }
    if (window.name.startsWith(PREFIXO_TRANSPORTE_CRIACAO)) {
      try { restaurarNomeAnteriorCriacao(JSON.parse(window.name.slice(PREFIXO_TRANSPORTE_CRIACAO.length))); }
      catch (erro) { console.error("Não foi possível restaurar o nome anterior desta aba.", erro); }
    }
    return true;
  }

  if (!window.DND_PERSONAGEM_OPTIONS) {
    avisarEntradaCriacao("As opções compartilhadas de personagem não foram carregadas. Nenhum dado de criação foi aplicado; recarregue a ficha para tentar novamente.");
    console.error("Fonte obrigatória DND_PERSONAGEM_OPTIONS indisponível.");
    return true;
  }

  if (!window.name.startsWith(PREFIXO_TRANSPORTE_CRIACAO)) {
    avisarEntradaCriacao("Os dados desta criação não estão disponíveis nesta aba. Nenhum personagem foi aplicado.");
    return true;
  }
  let transporte;
  try { transporte = JSON.parse(window.name.slice(PREFIXO_TRANSPORTE_CRIACAO.length)); }
  catch (erro) {
    avisarEntradaCriacao("Os dados temporários da criação estão inválidos e não foram aplicados.");
    console.error("Payload temporário da criação inválido.", erro);
    return true;
  }
  const tokenAtual = parametros.get("token");
  if (!tokenAtual || transporte.token !== tokenAtual) {
    avisarEntradaCriacao("Os dados temporários não correspondem a esta tentativa de criação. Nenhum personagem foi aplicado.");
    return true;
  }
  const erroValidacao = validarPayloadCriacao(transporte.payload);
  if (erroValidacao) {
    avisarEntradaCriacao(erroValidacao + " Os dados continuam preservados nesta aba.");
    return true;
  }
  try {
    if ((await aplicarDadosFicha(transporte.payload)) !== true) {
      throw new Error("A aplicação do personagem não foi concluída.");
    }
    restaurarNomeAnteriorCriacao(transporte);
    return true;
  } catch (erro) {
    avisarEntradaCriacao("A aplicação falhou e a ficha pode ter ficado parcialmente preenchida. Os dados continuam preservados nesta aba; recarregue para tentar novamente.");
    console.error("Falha ao aplicar payload de criação.", erro);
    return true;
  }
}
