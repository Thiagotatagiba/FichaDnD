(() => {
  const dados = window.DND_PERSONAGEM_OPTIONS;
  const ficha = "ficha/Ficha_DnD_-_Tatagiba_1.0.html";
  const chaveCriacaoLegada = "fichaCriacaoPendente";
  const prefixoTransporte = "DND_CREATE:";
  const form = document.getElementById("formCriarPersonagem");
  const raca = document.getElementById("racaID");
  const subraca = document.getElementById("subraca");
  const classe = document.getElementById("classeNomeID");
  const subclasse = document.getElementById("subclasse");
  const status = document.getElementById("statusCriacao");

  if (!dados) {
    status.textContent = "Não foi possível carregar as opções de personagem. Recarregue esta página para tentar novamente.";
    form.querySelectorAll("input, select, button").forEach((campo) => {
      campo.disabled = true;
    });
    document.getElementById("btnFichaEmBranco").disabled = true;
    console.error("Fonte obrigatória DND_PERSONAGEM_OPTIONS indisponível.");
    return;
  }

  function adicionar(select, valor, rotulo) {
    const option = document.createElement("option");
    option.value = valor;
    option.textContent = rotulo;
    select.appendChild(option);
  }

  function carregarLista(select, valores, placeholder) {
    select.replaceChildren();
    adicionar(select, "", placeholder);
    valores.forEach((valor) => adicionar(select, valor, valor));
  }

  function atualizarSubracas() {
    const selecionada = dados.races.find(([valor]) => valor === raca.value);
    const opcoes = selecionada ? (dados.subracas[selecionada[2]] || []) : [];
    carregarLista(subraca, opcoes, "Selecione uma sub-raça");
    subraca.disabled = opcoes.length === 0;
  }

  function atualizarSubclasses() {
    const opcoes = dados.subclasses[classe.value];
    const regra = dados.regrasSubclasse[classe.value];
    let liberadas = [];
    if (classe.value && !Array.isArray(opcoes)) {
      console.error("Fonte compartilhada sem lista de subclasses para a classe:", classe.value);
    } else if (classe.value && !regra) {
      console.error("Fonte compartilhada sem requisito de nível para a classe:", classe.value);
    } else if (Array.isArray(opcoes) && regra && regra.nivel <= 1) {
      liberadas = opcoes;
    }
    carregarLista(subclasse, liberadas, "Selecione uma subclasse");
    subclasse.disabled = liberadas.length === 0;
  }

  dados.races.forEach(([valor, rotulo]) => adicionar(raca, valor, rotulo));
  dados.classes.forEach(([valor, rotulo]) => adicionar(classe, valor, rotulo));
  dados.alignments.forEach((valor) => adicionar(document.getElementById("alinhamentoID"), valor, valor));
  ["for", "des", "con", "int", "sab", "car"].forEach((id) => {
    const select = document.getElementById(id);
    for (let valor = 3; valor <= 20; valor += 1) adicionar(select, String(valor), String(valor));
    select.value = "10";
  });
  raca.addEventListener("change", atualizarSubracas);
  classe.addEventListener("change", atualizarSubclasses);

  function restaurarNomeAnterior() {
    if (!window.name.startsWith(prefixoTransporte)) return;
    try {
      const transporte = JSON.parse(window.name.slice(prefixoTransporte.length));
      if (typeof transporte.previousName === "string") window.name = transporte.previousName;
    } catch (erro) {
      console.error("Não foi possível restaurar o nome anterior desta aba.", erro);
    }
  }

  function obterImportacaoPendente() {
    try { return localStorage.getItem("fichaImportarPendente"); }
    catch (erro) {
      status.textContent = "Não foi possível verificar se há uma importação JSON pendente. A ficha em branco continuará sem carregar dados importados.";
      console.warn("Não foi possível consultar a importação pendente.", erro);
      return null;
    }
  }

  document.getElementById("btnFichaEmBranco").addEventListener("click", () => {
    const importacaoPendente = obterImportacaoPendente();
    if (importacaoPendente) {
      const confirmou = window.confirm("Existe um personagem JSON aguardando importação. Iniciar uma ficha em branco vai descartar essa cópia temporária. Deseja continuar?");
      if (!confirmou) return;
      try { localStorage.removeItem("fichaImportarPendente"); }
      catch (erro) {
        status.textContent = "Não foi possível limpar a importação pendente. A ficha não foi aberta para evitar que ela seja carregada por engano.";
        console.error("Falha ao limpar a importação pendente.", erro);
        return;
      }
    }
    try { sessionStorage.removeItem(chaveCriacaoLegada); } catch (erro) {}
    restaurarNomeAnterior();
    window.location.href = ficha + "?modo=branco";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "";
    const importacaoPendente = obterImportacaoPendente();
    if (importacaoPendente && !window.confirm("Existe um personagem JSON aguardando importação. A criação atual não vai usar nem apagar esse JSON; ele continuará pendente e será carregado numa futura abertura normal da ficha. Deseja continuar?")) return;

    const personagem = {};
    ["nomePersonagem", "jogador", "antecedenteID"].forEach((id) => {
      const valor = document.getElementById(id).value.trim();
      if (valor) personagem[id] = valor;
    });
    const racaValida = dados.races.some(([valor]) => valor === raca.value);
    const classeValida = dados.classes.some(([valor]) => valor === classe.value);
    if (racaValida) personagem.racaID = raca.value;
    if (racaValida && [...subraca.options].some((option) => option.value && option.value === subraca.value)) personagem.subraca = subraca.value;
    if (classeValida) personagem.classeNomeID = classe.value;
    const regraSubclasse = dados.regrasSubclasse[classe.value];
    if (classeValida && regraSubclasse && regraSubclasse.nivel <= 1 && [...subclasse.options].some((option) => option.value && option.value === subclasse.value)) personagem.subclasse = subclasse.value;
    const alinhamento = document.getElementById("alinhamentoID").value;
    if (dados.alignments.includes(alinhamento)) personagem.alinhamentoID = alinhamento;
    ["for", "des", "con", "int", "sab", "car"].forEach((id) => {
      const valor = Number(document.getElementById(id).value);
      personagem[id] = Number.isInteger(valor) && valor >= 3 && valor <= 20 ? valor : 10;
    });

    try {
      try { sessionStorage.removeItem(chaveCriacaoLegada); } catch (erro) {}
      const previousName = window.name.startsWith(prefixoTransporte) ? (() => {
        try { return JSON.parse(window.name.slice(prefixoTransporte.length)).previousName || ""; }
        catch (erro) { return window.name; }
      })() : window.name;
      const token = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
      window.name = prefixoTransporte + JSON.stringify({ token, previousName, payload: personagem });
      window.location.href = ficha + "?modo=criacao&token=" + encodeURIComponent(token);
    } catch (erro) {
      status.textContent = "Não foi possível preparar os dados desta criação. Eles continuam no formulário; tente novamente.";
      console.error("Falha ao preparar a criação do personagem.", erro);
    }
  });
})();
