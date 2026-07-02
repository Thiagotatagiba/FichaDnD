
      window.CARACTERISTICA_CLASSE_ARQUIVOS =
        window.CARACTERISTICA_CLASSE_ARQUIVOS || [
          "caracteristica_barbaro.json",
          "caracteristica_bardo.json",
          "caracteristica_bruxo.json",
          "caracteristica_clerigo.json",
          "caracteristica_druida.json",
          "caracteristica_feiticeiro.json",
          "caracteristica_guerreiro.json",
          "caracteristica_ladino.json",
          "caracteristica_mago.json",
          "caracteristica_monge.json",
          "caracteristica_paladino.json",
          "caracteristica_patrulheiro.json",
        ];

      function normalizarTextoClasse(valor) {
        return String(valor || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim()
          .replace(/ç/g, "c")
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
      }

      function obterSlugArquivoCaracteristica(arquivo) {
        return normalizarTextoClasse(
          String(arquivo || "")
            .replace(/^caracteristica_/i, "")
            .replace(/\.(json|js)$/i, ""),
        );
      }

      function obterArquivoCaracteristicaPorClasse(classe) {
        const slugClasse = normalizarTextoClasse(classe);
        if (!slugClasse) return "";

        return (
          window.CARACTERISTICA_CLASSE_ARQUIVOS.find(
            (arquivo) => obterSlugArquivoCaracteristica(arquivo) === slugClasse,
          ) || ""
        );
      }

      function avisarCaracteristicaClasse(mensagem, tipo = "info") {
        if (typeof atualizarStatusCargaClasse === "function") {
          atualizarStatusCargaClasse(mensagem, tipo);
        } else {
          console[tipo === "erro" ? "warn" : "log"](
            "[CaracteristicaClasse]",
            mensagem,
          );
        }

        let aviso = document.getElementById("caracteristicaClasseAviso");
        if (!aviso) {
          aviso = document.createElement("div");
          aviso.id = "caracteristicaClasseAviso";
          aviso.className = "caracteristica-classe-aviso";
          aviso.setAttribute("role", "status");
          document.body.appendChild(aviso);
        }

        aviso.textContent = mensagem;
        aviso.className = `caracteristica-classe-aviso ${tipo}`;
        clearTimeout(window.caracteristicaClasseAvisoTimer);
        window.caracteristicaClasseAvisoTimer = setTimeout(() => {
          aviso.remove();
        }, tipo === "erro" ? 9000 : 5200);
      }

      function mensagemImportacaoManualCaracteristica() {
        return "Você pode importar manualmente escolhendo um arquivo no select da aba Característica de Classe e clicando em Importar.";
      }

      function caminhoArquivoCaracteristica(arquivo) {
        const nomeArquivo = String(arquivo || "").trim();
        if (!nomeArquivo) return "";
        if (/^(?:\.\/|\/|https?:)/i.test(nomeArquivo)) return nomeArquivo;
        return `./Classes/${nomeArquivo}`;
      }

      function preencherSelectArquivosCaracteristica() {
        const select = document.getElementById("caracteristicaClasseArquivo");
        if (!select) return;

        const valorAtual = select.value;
        select.innerHTML = '<option value="">Selecione um arquivo</option>';

        window.CARACTERISTICA_CLASSE_ARQUIVOS.forEach((arquivo) => {
          const option = document.createElement("option");
          option.value = arquivo;
          option.textContent = arquivo;
          select.appendChild(option);
        });

        if (valorAtual) {
          if (!window.CARACTERISTICA_CLASSE_ARQUIVOS.includes(valorAtual)) {
            const option = document.createElement("option");
            option.value = valorAtual;
            option.textContent = valorAtual;
            select.appendChild(option);
          }
          select.value = valorAtual;
        }
      }

      function sincronizarArquivoCaracteristicaComClasse(forcar = false) {
        const select = document.getElementById("caracteristicaClasseArquivo");
        const campoClasse = document.getElementById("classeNomeID");
        if (!select || !campoClasse) return "";

        const arquivoClasse = obterArquivoCaracteristicaPorClasse(
          campoClasse.value,
        );
        if (arquivoClasse && (forcar || !select.value)) {
          select.value = arquivoClasse;
        } else if (forcar && !arquivoClasse) {
          select.value = "";
        }

        return select.value || arquivoClasse || "";
      }

      function obterSubclassesCaracteristica(classeData) {
        if (!classeData?.subclasses || typeof classeData.subclasses !== "object")
          return [];
        return Object.keys(classeData.subclasses);
      }

      function encontrarSubclasseCaracteristica(classeData, subclasse) {
        const subclasseNormalizada = normalizarTextoClasse(subclasse);
        if (!subclasseNormalizada) return "";

        return (
          obterSubclassesCaracteristica(classeData).find(
            (nome) => normalizarTextoClasse(nome) === subclasseNormalizada,
          ) || ""
        );
      }

      function definirSubclasseCaracteristica(valor) {
        const subclasse = String(valor || "");
        const campo = document.getElementById("caracteristicaClasseSubclasse");
        if (campo) campo.value = subclasse;

        const select = document.getElementById("selectSubclasse");
        if (select && subclasse) {
          select.value = subclasse;
        }

        if (typeof subclasseAtual !== "undefined") {
          subclasseAtual = subclasse;
        }
      }

      function nivelCaracteristicaValor(valor) {
        const numero = parseInt(String(valor ?? "").replace(/[^\d-]/g, ""), 10);
        return Number.isNaN(numero) ? 1 : numero;
      }

      function criarFeatureCaracteristica(nome, classeData, nivel) {
        const nomeLimpo = String(nome || "").trim();
        if (!nomeLimpo) return null;
        return {
          name: nomeLimpo,
          desc: classeData?.descricoes?.[nomeLimpo] || "",
          level: nivel,
        };
      }

      function extrairFeaturesClasse(classeData, nivel) {
        if (Array.isArray(classeData?.features)) {
          return classeData.features.filter((f) => (f.level || 1) <= nivel);
        }

        if (!Array.isArray(classeData?.niveis)) return [];

        return classeData.niveis
          .filter((linha) => nivelCaracteristicaValor(linha.nivel) <= nivel)
          .flatMap((linha) =>
            String(linha.caracteristicas || "")
              .split(",")
              .map((nome) =>
                criarFeatureCaracteristica(
                  nome,
                  classeData,
                  nivelCaracteristicaValor(linha.nivel),
                ),
              )
              .filter(Boolean),
          );
      }

      function extrairFeaturesSubclasse(classeData, subclasse, nivel) {
        const dadosSubclasse = classeData?.subclasses?.[subclasse];
        if (!dadosSubclasse) return [];

        if (Array.isArray(dadosSubclasse)) {
          return dadosSubclasse.filter((f) => (f.level || 1) <= nivel);
        }

        return Object.entries(dadosSubclasse)
          .filter(([nivelRegra]) => nivelCaracteristicaValor(nivelRegra) <= nivel)
          .flatMap(([nivelRegra, regra]) => {
            const nomes = [];
            if (Array.isArray(regra?.add)) nomes.push(...regra.add);
            if (regra?.value) nomes.push(regra.value);
            return nomes
              .map((nome) =>
                criarFeatureCaracteristica(
                  nome,
                  classeData,
                  nivelCaracteristicaValor(nivelRegra),
                ),
              )
              .filter(Boolean);
          });
      }

      document.addEventListener("DOMContentLoaded", function () {
        preencherSelectArquivosCaracteristica();
        document
          .getElementById("caracteristicaClasseArquivo")
          ?.addEventListener("change", function () {
            const classeNome =
              document.getElementById("classeNomeID")?.value ||
              obterSlugArquivoCaracteristica(this.value);
            const classeNivel =
              parseInt(document.getElementById("classeNivelID")?.value) || 1;
            const sub = document.getElementById("subclasse")?.value || "";
            carregarCaracteristicasClasse(classeNome, classeNivel, sub);
          });
        document
          .getElementById("caracteristicaClasseImportar")
          ?.addEventListener("click", function () {
            const classeNome =
              document.getElementById("classeNomeID")?.value ||
              obterSlugArquivoCaracteristica(
                document.getElementById("caracteristicaClasseArquivo")?.value,
              );
            const classeNivel =
              parseInt(document.getElementById("classeNivelID")?.value) || 1;
            const sub = document.getElementById("subclasse")?.value || "";
            carregarCaracteristicasClasse(classeNome, classeNivel, sub);
          });
        const classeSelect = document.getElementById("classeNomeID");

        if (classeSelect) {
          // Auto-load quando classe muda
          classeSelect.addEventListener("change", function (e) {
            const classe = e.target.value;
            sincronizarArquivoCaracteristicaComClasse(true);
            definirSubclasseCaracteristica("");
            const cardContainer = document.getElementById(
              "cardClasseContainer",
            );

            if (classe && cardContainer) {
              const urlParams = new URL(
                window.location,
                window.location.origin,
              );
              urlParams.searchParams.set("classe", classe);

              console.log("[Ficha] Carregando classe no card:", classe);

              // Carrega o JSON da classe e exibe no card integrado
              const arquivo = sincronizarArquivoCaracteristicaComClasse(true);
              const caminhoJson =
                caminhoArquivoCaracteristica(arquivo) ||
                `Classes/caracteristica_${normalizarTextoClasse(classe)}.json`;
              if (typeof carregarJSONClasse === "function") {
                carregarJSONClasse(caminhoJson, classe)
                  .then((data) => {
                    if (typeof aplicarDadosClasseNoCard === "function") {
                      aplicarDadosClasseNoCard(data, classe);
                    }
                  })
                  .catch((error) => {
                    console.warn("[Ficha] Erro ao carregar classe:", error);
                  });
              }

              // Scroll suave para o card se necessário
              cardContainer.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }
          });

          // Load inicial se já tem classe selecionada
          if (classeSelect.value) {
            classeSelect.dispatchEvent(new Event("change"));
          }
        }
      });

      // ===== ETAPA 3: AUTO-CARREGAMENTO CARACTERÍSTICAS CLASSE =====
      function mostrarCarregando(show = true) {
        let spinner = document.getElementById("classeSpinner");
        if (!spinner) {
          spinner = document.createElement("div");
          spinner.id = "classeSpinner";
          spinner.innerHTML = "⏳ Carregando...";
          // Evita cssText inline (reduz parsing overhead do editor)
          // mantendo o mesmo layout visual
          spinner.classList.add("classe-spinner");
          document.body.appendChild(spinner);
        }
        spinner.style.display = show ? "block" : "none";
      }

      // Compat: reduz warnings de parse/linters em editores e melhora performance do carregamento.
      // Não altera comportamento.
      function ensureCssLoaded() {
        // noop intencional
        return true;
      }

      function limparListasTalentos() {
        Object.values(TALENTOS_CONFIG).forEach((config) => {
          const lista = document.getElementById(config.listaId);
          if (lista)
            lista.innerHTML =
              '<div class="talento-lista-vazia">Nenhuma característica carregada</div>';
          const resumo = document.getElementById(config.resumoId);
          if (resumo) resumo.textContent = "";
        });
      }

      function enviarClasseParaCard(classe, classeData) {
        // Agora integrado no card - não precisa mais de iframe
        // Apenas dispara o loading do novo sistema
        console.log("[Ficha] Carregando classe no card integrado:", classe);
        console.log("[Ficha] Dados recebidos:", classeData);

        // Remove o texto descritivo "Selecione sua classe..."
        const descritivo = document.querySelector(
          '#aba-caracteristica-classe > .config-bloco > div[style*="text-align: center"], #aba-caracteristica-classe > .config-bloco > div[style*="text-align:center"]',
        );

        if (descritivo) {
          console.log("[Ficha] Ocultando texto descritivo");
          descritivo.style.display = "none";
        } else {
          console.warn("[Ficha] Elemento descritivo não encontrado");
        }

        if (typeof aplicarDadosClasseNoCard === "function") {
          console.log("[Ficha] Chamando aplicarDadosClasseNoCard");
          aplicarDadosClasseNoCard(classeData, classe);
        } else {
          console.error(
            "[Ficha] Função aplicarDadosClasseNoCard não encontrada!",
          );
        }
      }

      // Helper para carregar JSON com múltiplos fallbacks
      // Tenta: 1) Dados embutidos, 2) Fetch, 3) XMLHttpRequest
      async function carregarJSONClasse(caminho, classe = "") {
        console.log("[CardLoad] Tentando carregar classe:", {
          caminho,
          classe,
        });

        // Primeiro: tenta dados embutidos em CLASSES_EMBUTIDAS
        if (classe && window.CLASSES_EMBUTIDAS) {
          const classeNormalizada = classe
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
          if (window.CLASSES_EMBUTIDAS[classeNormalizada]) {
            console.log("[CardLoad] Usando dados embutidos para:", classe);
            return window.CLASSES_EMBUTIDAS[classeNormalizada];
          }
        }

        // Segundo: tenta Fetch (melhor handling de erro que XHR)
        try {
          console.log("[CardLoad] Tentando Fetch para:", caminho);
          const response = await fetch(caminho);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const data = await response.json();
          console.log("[CardLoad] Fetch sucesso!");
          return data;
        } catch (fetchError) {
          console.warn("[CardLoad] Fetch falhou:", fetchError.message);
        }

        // Terceiro: tenta XMLHttpRequest
        try {
          console.log("[CardLoad] Tentando XMLHttpRequest para:", caminho);
          return await carregarJSONViaXHR(caminho);
        } catch (xhrError) {
          console.warn("[CardLoad] XMLHttpRequest falhou:", xhrError.message);
        }

        // Se tudo falhou, lança erro informativo
        throw new Error(
          `Não foi possível carregar ${classe}. Tente: 1) Usar servidor HTTP, 2) Abrir em Electron, ou 3) Verificar arquivo ${caminho}`,
        );
      }

      // Helper para carregar JSON via XMLHttpRequest (fallback)
      function carregarJSONViaXHR(caminho) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", caminho, true);
          xhr.onload = function () {
            try {
              // Status 0 é válido para file:// protocol, status 200+ para http/https
              const statusValido =
                (xhr.status >= 200 && xhr.status < 300) ||
                (xhr.status === 0 && xhr.responseText);
              if (statusValido) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                reject(new Error(`HTTP ${xhr.status}`));
              }
            } catch (error) {
              reject(new Error(`JSON parse error: ${error.message}`));
            }
          };
          xhr.onerror = () => reject(new Error(`XHR network error`));
          xhr.send();
        });
      }

      async function carregarCaracteristicasClasse(
        classe = "",
        nivel = 1,
        subclasse = "",
        opcoes = {},
      ) {
        console.log("[CardLoad] carregarCaracteristicasClasse chamada com:", {
          classe,
          nivel,
          subclasse,
        });

        if (!classe) {
          console.log("[CardLoad] Classe vazia, limpando");
          document.getElementById("classeData").value = "";
          document.getElementById("subclasseData").value = "";
          definirSubclasseCaracteristica("");
          dadosClasse = null;
          atualizarAtalhoConsultaCaracteristicaClasse();
          return;
        }

        mostrarCarregando(true);
        try {
          // Carrega classe principal - usa múltiplos métodos de carregamento
          const arquivoSelecionado =
            sincronizarArquivoCaracteristicaComClasse(false) ||
            obterArquivoCaracteristicaPorClasse(classe);
          const classePath =
            caminhoArquivoCaracteristica(arquivoSelecionado) ||
            `./Classes/caracteristica_${normalizarTextoClasse(classe)}.json`;
          const classeReferencia =
            obterSlugArquivoCaracteristica(arquivoSelecionado) ||
            normalizarTextoClasse(classe);
          console.log("[CardLoad] Carregando JSON de:", classePath);

          const classeData = await carregarJSONClasse(
            classePath,
            classeReferencia || classe,
          );
          console.log("[CardLoad] JSON carregado com sucesso:", classeData);

          const selectArquivo = document.getElementById(
            "caracteristicaClasseArquivo",
          );
          if (selectArquivo && arquivoSelecionado) {
            selectArquivo.value = arquivoSelecionado;
          }

          document.getElementById("classeData").value =
            JSON.stringify(classeData);
          enviarClasseParaCard(classeReferencia || classe, classeData);

          avisarCaracteristicaClasse(
            `Característica de classe importada: ${arquivoSelecionado || classePath}.`,
            "sucesso",
          );

          const subclasseSalva =
            opcoes.subclasseCaracteristicaSalva ||
            document.getElementById("caracteristicaClasseSubclasse")?.value ||
            "";
          const subclasseEncontrada =
            encontrarSubclasseCaracteristica(classeData, subclasseSalva) ||
            encontrarSubclasseCaracteristica(classeData, subclasse);
          if (subclasseEncontrada) {
            definirSubclasseCaracteristica(subclasseEncontrada);
            if (typeof aplicarSubclasse === "function") aplicarSubclasse();
            avisarCaracteristicaClasse(
              `Subclasse importada na característica: ${subclasseEncontrada}.`,
              "sucesso",
            );
          } else {
            definirSubclasseCaracteristica("");
            if (subclasse || subclasseSalva) {
              avisarCaracteristicaClasse(
                `Não encontrei a subclasse "${subclasse || subclasseSalva}" neste arquivo. ${mensagemImportacaoManualCaracteristica()}`,
                "erro",
              );
            }
          }

          const featuresSub = extrairFeaturesSubclasse(
            classeData,
            subclasseEncontrada,
            nivel,
          );
          if (subclasseEncontrada && featuresSub.length) {
            document.getElementById("subclasseData").value =
              JSON.stringify(featuresSub);
          } else {
            document.getElementById("subclasseData").value = "";
          }
        } catch (error) {
          console.error("[CardError] Erro carregando características:", error);
          console.error("[CardError] Stack:", error.stack);
          avisarCaracteristicaClasse(
            `Não encontrei característica para "${classe}". ${mensagemImportacaoManualCaracteristica()}`,
            "erro",
          );
          document.getElementById("classeData").value = "";
          document.getElementById("subclasseData").value = "";
          definirSubclasseCaracteristica("");
          dadosClasse = null;
          atualizarAtalhoConsultaCaracteristicaClasse();
        } finally {
          mostrarCarregando(false);
        }
      }

      function popularTalentoLista(categoria, features) {
        const config = TALENTOS_CONFIG[categoria];
        if (!config || !features?.length) return;

        const lista = document.getElementById(config.listaId);
        if (!lista) return;

        lista.innerHTML = features
          .map(
            (item) =>
              `<div class="talento-item" tabindex="0" title="${item.desc || ""}">${item.name}</div>`,
          )
          .join("");
      }

      function handleClasseChange() {
        const classeNomeInput = document.getElementById("classeNomeID");
        const classeNivelInput = document.getElementById("classeNivelID");
        const subInput = document.getElementById("subclasse");

        if (!classeNomeInput || !classeNivelInput) return;

        const classeNome = classeNomeInput.value;
        const classeNivel = parseInt(classeNivelInput.value) || 1;
        const sub = subInput?.value || "";
        sincronizarArquivoCaracteristicaComClasse(false);
        carregarCaracteristicasClasse(classeNome, classeNivel, sub);
      }

      // Adiciona event listeners (Etapa 3)
      const classeNomeInput = document.getElementById("classeNomeID");
      const classeNivelInput = document.getElementById("classeNivelID");
      const subInput = document.getElementById("subclasse");

      if (classeNomeInput)
        classeNomeInput.addEventListener("change", handleClasseChange);
      if (classeNivelInput)
        classeNivelInput.addEventListener("input", () => {
          handleClasseChange();
          if (typeof montarTabela === "function") montarTabela();
        });
      if (classeNivelInput)
        classeNivelInput.addEventListener("change", () => {
          handleClasseChange();
          if (typeof montarTabela === "function") montarTabela();
        });
      if (subInput) {
        subInput.addEventListener("input", handleClasseChange);
        subInput.addEventListener("change", handleClasseChange);
      }

      // Integra com load (chama após carregarFicha)
      const originalCarregarFicha = window.carregarFicha;
      window.addEventListener("message", function (event) {
        if (event.data.action === "applyClassFeatures") {
          const { classe, nivel, subclasse, jsonData } = event.data;
          if (typeof window.carregarCaracteristicasClasse === "function") {
            window.carregarCaracteristicasClasse(classe, nivel, subclasse);
          }
          console.log("✅ Features aplicadas via iframe:", {
            classe,
            nivel,
            subclasse,
          });
        }
      });

      window.carregarFicha = function (personagem) {
        if (originalCarregarFicha) originalCarregarFicha(personagem);
        // Trigger reload após load
        setTimeout(handleClasseChange, 100);
      };

      // Inicial load
      handleClasseChange();
    
