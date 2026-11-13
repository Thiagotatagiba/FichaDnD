/* Backup local automático E1.6.
 * Armazenamento isolado em IndexedDB: resetarFicha() limpa localStorage.
 * Cada captura é append-only; nenhuma falha de quota apaga backups anteriores.
 */
(() => {
  "use strict";

  const DB_NAME = "fichadnd-backups";
  const DB_VERSION = 1;
  const STORE = "snapshots";
  const BACKUP_VERSION = 1;
  const DEBOUNCE_MS = 10000;
  let databasePromise = null;
  let timerBackup = null;
  let generationBackup = 0;
  let backupSuspenso = false;
  let dialogoRecuperacaoAberto = false;
  let listenersFechamentoRecuperacaoInstalados = false;

  function obterIdentidade(dados) {
    const idExistente = dados?.personagemId ?? dados?.characterId ?? dados?.id;
    const nome = String(dados?.nomePersonagem || dados?.nome || "").trim();
    const jogador = String(dados?.jogador || dados?.nomePlayer || "").trim();
    const raca = String(dados?.racaID || dados?.raca || "").trim();
    if (!nome && (idExistente === undefined || idExistente === null || idExistente === "")) {
      return null;
    }
    const identidadeId = idExistente !== undefined && idExistente !== null && idExistente !== ""
      ? `id:${String(idExistente)}`
      : `campos:${JSON.stringify([nome.toLocaleLowerCase(), jogador.toLocaleLowerCase(), raca.toLocaleLowerCase()])}`;
    return { personagemId: identidadeId, nome, jogador, raca };
  }

  function checksum(texto) {
    // Sinalizador determinístico de corrupção acidental, não é assinatura criptográfica.
    let hash = 2166136261;
    for (let indice = 0; indice < texto.length; indice += 1) {
      hash ^= texto.charCodeAt(indice);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function criarIdBackup() {
    try {
      if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    } catch (_erro) {
      // file:// e runtimes restritos podem não expor randomUUID.
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  function abrirBanco() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      let request;
      try {
        if (!globalThis.indexedDB) throw new Error("IndexedDB indisponível nesta origem.");
        request = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (erro) {
        reject(erro);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "backupId" });
          store.createIndex("personagemId", "personagemId", { unique: false });
          store.createIndex("criadoEm", "criadoEm", { unique: false });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => reject(request.error || new Error("Falha ao abrir IndexedDB."));
      request.onblocked = () => reject(new Error("A abertura do armazenamento local está bloqueada por outra aba."));
    }).catch((erro) => {
      databasePromise = null;
      throw erro;
    });
    return databasePromise;
  }

  function executarTransacao(modo, executar) {
    return abrirBanco().then((db) => new Promise((resolve, reject) => {
      let tx;
      let resultado;
      try {
        tx = db.transaction(STORE, modo);
        const store = tx.objectStore(STORE);
        resultado = executar(store, tx);
      } catch (erro) {
        reject(erro);
        return;
      }
      tx.oncomplete = () => resolve(resultado?.result);
      tx.onerror = () => reject(tx.error || new Error("Transação IndexedDB falhou."));
      tx.onabort = () => reject(tx.error || new Error("Transação IndexedDB foi cancelada."));
    }));
  }

  function lerTodosBackups() {
    return executarTransacao("readonly", (store) => store.getAll()).then((registros) =>
      Array.isArray(registros) ? registros : [],
    );
  }

  function salvarRegistro(registro) {
    return executarTransacao("readwrite", (store) => store.add(registro));
  }

  function obterRegistro(id) {
    return executarTransacao("readonly", (store) => store.get(id));
  }

  function atualizarStatus(mensagem, erro = false) {
    const status = document.getElementById("backupLocalStatus");
    if (!status) return;
    status.textContent = mensagem;
    status.hidden = !mensagem;
    status.dataset.estado = erro ? "erro" : "info";
  }

  function atualizarStatusRecuperacao(mensagem, erro = false) {
    const status = document.getElementById("backupRecuperacaoStatus");
    if (!status) return;
    status.textContent = mensagem;
    status.hidden = !mensagem;
    status.dataset.estado = erro ? "erro" : "info";
  }

  function definirRecuperacaoDisponivel(disponivel) {
    const botao = document.getElementById("backupLocalAbrir");
    if (botao) botao.hidden = !disponivel;
  }

  function validarRegistro(registro) {
    if (!registro || registro.versaoBackup !== BACKUP_VERSION ||
        typeof registro.backupId !== "string" ||
        typeof registro.personagemId !== "string" ||
        typeof registro.criadoEm !== "string" ||
        typeof registro.payloadJson !== "string" ||
        registro.checksum !== checksum(registro.payloadJson)) {
      return { ok: false, motivo: "Envelope ou checksum inválido." };
    }
    let dados;
    try {
      dados = JSON.parse(registro.payloadJson);
    } catch (_erro) {
      return { ok: false, motivo: "JSON do backup inválido." };
    }
    if (!dados || typeof dados !== "object" || Array.isArray(dados) ||
        dados.fichaSchemaVersion !== 1 ||
        obterIdentidade(dados)?.personagemId !== registro.personagemId) {
      return { ok: false, motivo: "Dados ou identidade do backup inválidos." };
    }
    return { ok: true, dados };
  }

  function criarRegistro(dados) {
    const identidade = obterIdentidade(dados);
    if (!identidade) throw new Error("Informe o nome do personagem antes de criar um backup local.");
    const payloadJson = JSON.stringify(dados);
    if (typeof payloadJson !== "string") throw new Error("Não foi possível serializar os dados do backup.");
    return {
      versaoBackup: BACKUP_VERSION,
      backupId: criarIdBackup(),
      personagemId: identidade.personagemId,
      identidade: {
        nome: identidade.nome,
        jogador: identidade.jogador,
        raca: identidade.raca,
        classe: String(dados.classeNomeID || dados.classeNome || "").trim(),
        nivel: String(dados.classeNivelID || dados.nivel || "").trim(),
      },
      criadoEm: new Date().toISOString(),
      fichaSchemaVersion: dados.fichaSchemaVersion,
      payloadJson,
      checksum: checksum(payloadJson),
    };
  }

  async function gravarBackupAtual(geracaoEsperada = generationBackup) {
    if (backupSuspenso || window.__fichaImportacaoTransacaoAtiva) return { ok: false, ignorado: true };
    let registro;
    try {
      const dados = coletarSnapshotPersistenteFicha();
      if (!obterIdentidade(dados)) {
        return { ok: false, ignorado: true, motivo: "identidade-insuficiente" };
      }
      registro = criarRegistro(dados);
      const anteriores = await lerTodosBackups();
      if (backupSuspenso || window.__fichaImportacaoTransacaoAtiva || geracaoEsperada !== generationBackup) {
        return { ok: false, ignorado: true };
      }
      const repetido = anteriores.find((item) => item.personagemId === registro.personagemId &&
        item.payloadJson === registro.payloadJson && validarRegistro(item).ok);
      if (repetido) {
        definirRecuperacaoDisponivel(true);
        if (typeof window.__registrarUltimoBackupLocalFicha === "function") {
          window.__registrarUltimoBackupLocalFicha({
            personagemId: repetido.personagemId,
            criadoEm: repetido.criadoEm,
            backupId: repetido.backupId,
          });
        }
        return { ok: true, duplicado: true, backup: repetido };
      }
      await salvarRegistro(registro);
      if (backupSuspenso || window.__fichaImportacaoTransacaoAtiva || geracaoEsperada !== generationBackup) {
        // A gravação é atômica e contém um snapshot completo; não há remoção em rollback.
        return { ok: true, backup: registro, gravadoDuranteMudancaDeGeracao: true };
      }
      if (typeof window.__registrarUltimoBackupLocalFicha === "function") {
        window.__registrarUltimoBackupLocalFicha({
          personagemId: registro.personagemId,
          criadoEm: registro.criadoEm,
          backupId: registro.backupId,
        });
      }
      definirRecuperacaoDisponivel(true);
      atualizarStatus(`Backup local atualizado: ${new Date(registro.criadoEm).toLocaleString("pt-BR")} — ${identificacaoVisivel(registro)}`);
      return { ok: true, backup: registro };
    } catch (erro) {
      console.error("Falha ao criar backup local da ficha:", erro);
      atualizarStatus(
        erro?.name === "QuotaExceededError"
          ? "Armazenamento local cheio. Os backups anteriores foram preservados; nenhum foi apagado."
          : `Backup local indisponível. Os dados da ficha foram preservados${erro?.message ? ` (${erro.message})` : ""}.`,
        true,
      );
      return { ok: false, erro };
    }
  }

  function identificacaoVisivel(registro) {
    const id = registro?.identidade || {};
    const titulo = id.nome || "Personagem sem nome";
    const jogador = id.jogador ? ` — ${id.jogador}` : "";
    const raca = id.raca ? ` · ${id.raca}` : "";
    const classeNivel = [id.classe, id.nivel ? `Nv. ${id.nivel}` : ""].filter(Boolean).join(" ");
    return [titulo + jogador + raca, classeNivel].filter(Boolean).join(" · ");
  }

  function identificadorCurto(registro) {
    return String(registro?.backupId || "").slice(-8);
  }

  function rotuloBackup(registro) {
    return `${identificacaoVisivel(registro)} — ${new Date(registro.criadoEm).toLocaleString("pt-BR")} · cópia ${identificadorCurto(registro)}`;
  }

  function agendarBackup(opcoes = {}) {
    generationBackup += 1;
    if (timerBackup !== null) clearTimeout(timerBackup);
    timerBackup = null;
    if (backupSuspenso || window.__fichaImportacaoTransacaoAtiva) return false;
    if (!opcoes.forcar && typeof fichaFoiAlterada === "function" && !fichaFoiAlterada()) return false;
    const geracao = generationBackup;
    timerBackup = setTimeout(() => {
      timerBackup = null;
      void gravarBackupAtual(geracao);
    }, DEBOUNCE_MS);
    return true;
  }

  function suspenderBackup() {
    backupSuspenso = true;
    generationBackup += 1;
    if (timerBackup !== null) clearTimeout(timerBackup);
    timerBackup = null;
    return { ok: true };
  }

  function retomarBackup(opcoes = {}) {
    backupSuspenso = false;
    if (opcoes.persistir === true) agendarBackup({ forcar: true });
    return { ok: true };
  }

  function campoPersistenteAlvo(evento) {
    const alvo = evento?.target;
    if (!alvo || typeof alvo !== "object") return true;
    if (typeof campoEhPersistenteDaFicha === "function" &&
        ["INPUT", "SELECT", "TEXTAREA"].includes(String(alvo.tagName || "").toUpperCase())) {
      return campoEhPersistenteDaFicha(alvo);
    }
    return true;
  }

  ["input", "change", "click"].forEach((tipo) => {
    document.addEventListener(tipo, (evento) => {
      if (backupSuspenso || window.__fichaImportacaoTransacaoAtiva || !campoPersistenteAlvo(evento)) return;
      try {
        if (typeof fichaFoiAlterada === "function" && fichaFoiAlterada()) agendarBackup();
      } catch (erro) {
        console.warn("Não foi possível avaliar alteração para backup local:", erro);
      }
    });
  });

  async function obterBackupsRecuperaveis() {
    const registros = await lerTodosBackups();
    const recuperaveis = [];
    for (const registro of registros) {
      const validacao = validarRegistro(registro);
      if (!validacao.ok) continue;
      try {
        if (typeof prepararImportacaoFicha === "function") prepararImportacaoFicha(registro.payloadJson);
      } catch (_erro) {
        continue;
      }
      recuperaveis.push(registro);
    }
    return recuperaveis.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  async function carregarUltimoBackupDaFichaAtual() {
    const identidadeAtual = obterIdentidade(coletarSnapshotPersistenteFicha());
    if (!identidadeAtual) return null;
    const backups = await obterBackupsRecuperaveis();
    const ultimo = backups.find((item) => item.personagemId === identidadeAtual.personagemId);
    if (!ultimo) return null;
    const metadata = {
      personagemId: ultimo.personagemId,
      criadoEm: ultimo.criadoEm,
      backupId: ultimo.backupId,
    };
    window.__registrarUltimoBackupLocalFicha?.(metadata);
    return metadata;
  }

  function preencherSeletor(backups) {
    const seletor = document.getElementById("backupLocalSelecionado");
    const detalhes = document.getElementById("backupLocalDetalhes");
    if (!seletor || !detalhes) return false;
    seletor.replaceChildren();
    backups.forEach((backup) => {
      const opcao = document.createElement("option");
      opcao.value = backup.backupId;
      opcao.textContent = rotuloBackup(backup);
      seletor.appendChild(opcao);
    });
    const atualizarDetalhes = () => {
      const backup = backups.find((item) => item.backupId === seletor.value);
      detalhes.textContent = backup
        ? `Backup selecionado: ${rotuloBackup(backup)}. Restaurar substituirá o estado atual após confirmação.`
        : "Nenhum backup válido selecionado.";
    };
    seletor.addEventListener("change", atualizarDetalhes);
    atualizarDetalhes();
    return true;
  }

  async function abrirDialogoRecuperacao({ informarAusencia = false } = {}) {
    if (dialogoRecuperacaoAberto) return;
    let tentativas = 0;
    while (tentativas < 20) {
      if (!window.__fichaImportacaoTransacaoAtiva &&
          !document.querySelector("dialog[open]")) break;
      tentativas += 1;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (window.__fichaImportacaoTransacaoAtiva || tentativas >= 20) return;
    try {
      const backups = await obterBackupsRecuperaveis();
      if (!backups.length) {
        definirRecuperacaoDisponivel(false);
        if (informarAusencia) atualizarStatus("Nenhum backup local recuperável foi encontrado.");
        return;
      }
      definirRecuperacaoDisponivel(true);
      const identidadeAtual = obterIdentidade(coletarSnapshotPersistenteFicha());
      const ultimoDaFicha = identidadeAtual && backups.find(
        (item) => item.personagemId === identidadeAtual.personagemId,
      );
      if (ultimoDaFicha) {
        window.__registrarUltimoBackupLocalFicha?.({
          personagemId: ultimoDaFicha.personagemId,
          criadoEm: ultimoDaFicha.criadoEm,
          backupId: ultimoDaFicha.backupId,
        });
      }
      const seletor = document.getElementById("backupLocalSelecionado");
      const dialogo = document.getElementById("backupLocalDialogo");
      if (!seletor || !dialogo || !preencherSeletor(backups)) return;
      if (identidadeAtual) {
        const exato = backups.find((item) => item.personagemId === identidadeAtual.personagemId);
        if (exato) seletor.value = exato.backupId;
      }
      const eventos = document.getElementById("backupLocalEventos");
      if (eventos) {
        eventos.onclick = async (evento) => {
          const acao = evento.target?.dataset?.acao;
          if (acao === "manter") {
            dialogo.close();
            dialogoRecuperacaoAberto = false;
            return;
          }
          if (acao !== "restaurar") return;
          const backup = backups.find((item) => item.backupId === seletor.value);
          if (!backup) return;
          await restaurarBackupConfirmado(backup, dialogo);
        };
      }
      dialogoRecuperacaoAberto = true;
      if (!listenersFechamentoRecuperacaoInstalados) {
        dialogo.addEventListener("close", () => { dialogoRecuperacaoAberto = false; });
        dialogo.addEventListener("cancel", () => { dialogoRecuperacaoAberto = false; });
        listenersFechamentoRecuperacaoInstalados = true;
      }
      dialogo.showModal();
    } catch (erro) {
      console.warn("Não foi possível verificar backups locais:", erro);
      atualizarStatus("Não foi possível consultar backups locais. A ficha atual não foi alterada.", true);
    }
  }

  async function restaurarBackupConfirmado(referencia, dialogo) {
    try {
      const registro = await obterRegistro(referencia.backupId);
      const validacao = validarRegistro(registro);
      if (!validacao.ok) throw new Error("Este backup está inválido e não pode ser restaurado.");
      if (typeof prepararImportacaoFicha !== "function" || typeof aplicarDadosFicha !== "function") {
        throw new Error("O fluxo transacional de recuperação não está disponível.");
      }
      const descricao = identificacaoVisivel(registro);
      const data = new Date(registro.criadoEm).toLocaleString("pt-BR");
      if (!confirm(`Restaurar ${descricao}, cópia ${identificadorCurto(registro)}, criada em ${data}? A ficha atual será substituída após confirmação.`)) return;
      if (fichaFoiAlterada() &&
          !confirm("A ficha atual tem alterações pendentes. Substituí-las pelo backup confirmado?")) return;
      const preparado = prepararImportacaoFicha(registro.payloadJson);
      const sucesso = await aplicarDadosFicha(preparado, { preparado: true, transacional: true });
      if (sucesso !== true) throw new Error("A restauração não foi concluída.");
      dialogo.close();
      dialogoRecuperacaoAberto = false;
      atualizarStatusRecuperacao("");
      atualizarStatus(`Backup local restaurado: ${descricao} — ${data}`);
    } catch (erro) {
      console.error("Falha na recuperação do backup local:", erro);
      const mensagemRollback = erro?.code === "CHARACTER_SHEET_ROLLBACK_FAILED"
        ? "O rollback da recuperação apresentou divergências; o estado atual pode estar parcial. Confira a ficha antes de continuar."
        : erro?.code === "CHARACTER_SHEET_ROLLBACK_UNVERIFIED"
          ? "O snapshot foi restaurado no checkpoint, mas a estabilidade após reconciliação não foi comprovada. Confira a ficha antes de continuar."
          : "A recuperação não foi concluída. Confira o estado atual da ficha antes de continuar.";
      atualizarStatusRecuperacao(`${mensagemRollback} ${erro?.message || ""}`, true);
    }
  }

  window.__agendarBackupLocalFicha = agendarBackup;
  window.__suspenderBackupLocalAutomatico = suspenderBackup;
  window.__retomarBackupLocalAutomatico = retomarBackup;
  window.__obterBackupsLocaisRecuperaveis = obterBackupsRecuperaveis;
  window.__carregarUltimoBackupLocalFicha = carregarUltimoBackupDaFichaAtual;
  window.__abrirRecuperacaoBackupLocal = () => abrirDialogoRecuperacao({ informarAusencia: true });

  const botaoRecuperacao = document.getElementById("backupLocalAbrir");
  if (botaoRecuperacao) {
    botaoRecuperacao.addEventListener("click", () => {
      void abrirDialogoRecuperacao({ informarAusencia: true });
    });
  }
  window.__gravarBackupLocalFichaAgora = () => gravarBackupAtual(generationBackup);

  window.addEventListener("pagehide", () => {
    if (timerBackup === null || backupSuspenso || window.__fichaImportacaoTransacaoAtiva) return;
    clearTimeout(timerBackup);
    timerBackup = null;
    generationBackup += 1;
    // Tentativa best-effort: o navegador ainda pode encerrar antes de o IDB concluir.
    void gravarBackupAtual(generationBackup);
  });

  function iniciar() {
    setTimeout(() => { void abrirDialogoRecuperacao(); }, 1000);
  }
  if (document.readyState === "complete") iniciar();
  else window.addEventListener("load", iniciar, { once: true });
})();
