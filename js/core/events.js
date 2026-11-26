const ABAS_FICHA = new Set(["status", "combate", "magia", "historia", "itens"]);

function selecionarAbaFicha(nome, el) {
  if (!ABAS_FICHA.has(nome)) return false;
  const aba = document.getElementById(nome);
  const botao = el || Array.from(document.querySelectorAll(".tab")).find((item) =>
    new RegExp(`trocarAba\\(['\"]${nome}['\"]`).test(item.getAttribute("onclick") || ""),
  );
  if (!aba || !botao) return false;
  document.querySelectorAll(".aba").forEach((a) => {
    a.classList.remove("ativa");
  });

  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.remove("active");
  });

  aba.classList.add("ativa");
  botao.classList.add("active");
  return true;
}

function trocarAba(nome, el) {
  if (!selecionarAbaFicha(nome, el)) return;
  const hashDesejado = `#${nome}`;
  if (window.location.hash !== hashDesejado) {
    window.history.pushState({ abaFicha: nome }, "", hashDesejado);
  }
}

function restaurarAbaDoHash() {
  const nome = window.location.hash.replace(/^#/, "").toLowerCase();
  const aba = ABAS_FICHA.has(nome) ? nome : "status";
  selecionarAbaFicha(aba);
  if (!ABAS_FICHA.has(nome)) {
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#${aba}`);
  }
}

window.addEventListener("hashchange", restaurarAbaDoHash);
window.addEventListener("popstate", restaurarAbaDoHash);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", restaurarAbaDoHash, { once: true });
} else {
  restaurarAbaDoHash();
}

function formatarBonusProf() {
  const valor = getBonusProficiencia();
  setBonusProficiencia(valor);
}

function formatarPvTemporario() {
  const input = document.getElementById("pvTemporario");
  if (!input) return 0;

  let valor = parseInt(String(input.value).replace(/[^\d-]/g, "")) || 0;
  if (valor < 0) valor = 0;

  input.value = valor;
  return valor;
}

function atualizarCoracoesVida() {
  const campoAtual = document.getElementById("pvAtual");
  const campoTotal = document.getElementById("pvTotal");
  const campoTemporario = document.getElementById("pvTemporario");
  if (!campoAtual || !campoTotal || !campoTemporario) return;

  const vidaAtual = Math.max(parseFloat(campoAtual.value) || 0, 0);
  const vidaMax = Math.max(parseFloat(campoTotal.value) || 0, 0);
  const vidaTemp = Math.max(parseFloat(campoTemporario.value) || 0, 0);

  const vidaNormal = vidaMax > 0 ? Math.min(vidaAtual, vidaMax) : 0;
  const valorPorCoracao = vidaMax > 0 ? vidaMax / 5 : 0;

  document.querySelectorAll(".pv-hearts").forEach((grupo) => {
    const coracoes = [...grupo.querySelectorAll(":scope > .pv-heart")].slice(0, 5);
    coracoes.forEach((coracao, i) => {
      const fill = coracao.querySelector(".pv-heart-fill-red");
      if (!fill) return;
      let preenchimento = 0;

      if (valorPorCoracao > 0) {
        const inicioCoracao = i * valorPorCoracao;
        preenchimento = (vidaNormal - inicioCoracao) / valorPorCoracao;
      }

      preenchimento = Math.max(0, Math.min(1, preenchimento));
      fill.style.clipPath = `inset(0 ${100 - preenchimento * 100}% 0 0)`;

      const svg = coracao.querySelector("svg");
      if (!svg) return;
      svg.querySelectorAll(".pv-heart-fill-temporary").forEach((layer) => layer.remove());
      const tiers = ["pv-temp-blue", "pv-temp-gold", "pv-temp-white"];
      tiers.forEach((className, faixa) => {
        const cobertura = window.PvTemporariosVisual?.calcularCoberturaCamadaPvTemporario(
          vidaTemp, vidaMax, faixa, i,
        ) || 0;
        if (cobertura <= 0) return;
        const layer = fill.cloneNode(false);
        layer.removeAttribute("style");
        layer.setAttribute("class", `pv-heart-fill-temporary ${className}`);
        layer.style.clipPath = `inset(0 ${100 - cobertura * 100}% 0 0)`;
        svg.appendChild(layer);
      });
    });
    const ultimoCoracao = coracoes[4];
    if (ultimoCoracao) {
      let excedente = ultimoCoracao.querySelector(".pv-heart-temp-overflow");
      if (vidaTemp > vidaMax * 3 && vidaMax > 0) {
        if (!excedente) {
          excedente = document.createElement("span");
          excedente.className = "pv-heart-temp-overflow";
          excedente.textContent = "+";
          excedente.setAttribute("aria-hidden", "true");
          ultimoCoracao.appendChild(excedente);
        }
      } else excedente?.remove();
    }
    grupo.setAttribute("aria-label", `PV atuais: ${vidaAtual} de ${vidaMax}; PV temporários: ${vidaTemp}`);
  });
}

function iniciarGerenciadorPvTemporario() {
  const dialog = document.getElementById("pvTemporarioDialogo");
  const abrir = document.getElementById("btnGerenciarPvTemporarios");
  const campo = document.getElementById("pvTemporariosRecebidos");
  const saldo = document.getElementById("pvTemporario");
  const contador = document.getElementById("pvTemporarioContador");
  const saldoModal = document.getElementById("pvTemporarioSaldo");
  const remover = document.getElementById("btnRemoverPvTemporarios");
  const status = document.getElementById("pvTemporarioStatus");
  if (!dialog || !campo || !saldo) return;
  const sincronizar = () => {
    contador.textContent = saldo.value || "0";
    if (saldoModal) saldoModal.textContent = saldo.value || "0";
    remover.disabled = (parseInt(saldo.value, 10) || 0) <= 0;
    atualizarCoracoesVida();
  };
  const salvar = () => {
    saldo.dispatchEvent(new Event("input", { bubbles: true }));
    saldo.dispatchEvent(new Event("change", { bubbles: true }));
    sincronizar();
  };
  const abrirDialogo = () => {
    campo.value = "";
    status.textContent = "";
    sincronizar();
    dialog.showModal();
    campo.focus();
  };
  abrir?.addEventListener("click", abrirDialogo);
  document.addEventListener("ficha:gerenciar-pv-temporarios", abrirDialogo);
  document.getElementById("btnCancelarPvTemporarios")?.addEventListener("click", () => dialog.close());
  document.getElementById("btnConfirmarPvTemporarios")?.addEventListener("click", () => {
    const valor = campo.valueAsNumber;
    if (!Number.isInteger(valor) || valor <= 0) {
      campo.setCustomValidity("Informe um número inteiro positivo.");
      campo.reportValidity();
      return;
    }
    campo.setCustomValidity("");
    const atual = parseInt(saldo.value, 10) || 0;
    if (valor > atual) {
      saldo.value = String(valor);
      salvar();
      status.textContent = `PV temporários atualizados para ${valor}.`;
      dialog.close();
    } else {
      status.textContent = `O saldo foi mantido em ${atual} PV temporários.`;
    }
  });
  remover.addEventListener("click", () => {
    saldo.value = "0";
    salvar();
    status.textContent = "PV temporários removidos.";
    dialog.close();
  });
  campo.addEventListener("input", () => campo.setCustomValidity(""));
  saldo.addEventListener("input", sincronizar);
  saldo.addEventListener("change", sincronizar);
  sincronizar();
}

iniciarGerenciadorPvTemporario();

function normalizarPontosDeVida() {
  const campoAtual = document.getElementById("pvAtual");
  const campoTotal = document.getElementById("pvTotal");

  if (!campoAtual || !campoTotal) return;

  let pvAtual = parseInt(String(campoAtual.value).replace(/[^\d-]/g, "")) || 0;
  let pvTotal = parseInt(String(campoTotal.value).replace(/[^\d-]/g, "")) || 0;
  const pvTemporario = formatarPvTemporario();

  if (pvAtual < 0) pvAtual = 0;
  if (pvTotal < 0) pvTotal = 0;

  // PV temporários são um reservatório separado e não elevam o máximo normal.
  if (pvAtual > pvTotal) pvAtual = pvTotal;

  campoAtual.value = pvAtual;
  campoTotal.value = pvTotal;
  const contadorTemporario = document.getElementById("pvTemporarioContador");
  const saldoTemporarioModal = document.getElementById("pvTemporarioSaldo");
  const botaoRemoverTemporarios = document.getElementById("btnRemoverPvTemporarios");
  if (contadorTemporario) contadorTemporario.textContent = String(pvTemporario);
  if (saldoTemporarioModal) saldoTemporarioModal.textContent = String(pvTemporario);
  if (botaoRemoverTemporarios) botaoRemoverTemporarios.disabled = pvTemporario <= 0;

  atualizarCoracoesVida();
  atualizarResumoAtaquesConjuracao();
  verificarStatusMorte();
}

function normalizarDadosVida() {
  const campoRestantes = document.getElementById("dadosVidaRestantes");
  const campoTotal = document.getElementById("dadosVidaTotal");

  if (!campoRestantes || !campoTotal) return;

  let restantes =
    parseInt(String(campoRestantes.value).replace(/[^\d-]/g, "")) || 0;
  let total = parseInt(String(campoTotal.value).replace(/[^\d-]/g, "")) || 0;

  if (restantes < 0) restantes = 0;
  if (total < 0) total = 0;
  if (restantes > total) restantes = total;

  campoRestantes.value = restantes;
  campoTotal.value = total;
}

function normalizarTipoDadoVida(valor) {
  const textoNormalizado = String(valor || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  const mapa = {
    4: "d4",
    d4: "d4",
    6: "d6",
    d6: "d6",
    8: "d8",
    d8: "d8",
    10: "d10",
    d10: "d10",
    12: "d12",
    d12: "d12",
  };

  return mapa[textoNormalizado] || "d8";
}

function normalizarTextoComparacao(valor) {
  return (valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarChaveAtributo(valor) {
  const textoNormalizado = normalizarTextoComparacao(valor);

  const mapa = {
    for: "for",
    forca: "for",
    str: "for",
    des: "des",
    destreza: "des",
    dex: "des",
    con: "con",
    constituicao: "con",
    int: "int",
    inteligencia: "int",
    sab: "sab",
    sabedoria: "sab",
    wis: "sab",
    car: "car",
    carisma: "car",
    cha: "car",
  };

  return mapa[textoNormalizado] || "";
}
