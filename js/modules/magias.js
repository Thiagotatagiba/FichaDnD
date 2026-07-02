
      // ===== Classe, caracteristicas e magia =====
      function inferirAtributoConjuracaoPorClasse(nomeClasse) {
        const nomeNormalizado = normalizarTextoComparacao(nomeClasse);

        const mapa = {
          artifice: "int",
          artificeiro: "int",
          artificer: "int",
          bardo: "car",
          bard: "car",
          bruxo: "car",
          warlock: "car",
          clerigo: "sab",
          cleric: "sab",
          druida: "sab",
          druid: "sab",
          feiticeiro: "car",
          sorcerer: "car",
          mago: "int",
          wizard: "int",
          paladino: "car",
          paladin: "car",
          patrulheiro: "sab",
          ranger: "sab",
        };

        return mapa[nomeNormalizado] || "";
      }

      function sincronizarCamposMagia(
        forcarClasse = false,
        forcarAtributo = false,
      ) {
        const campoClasseBase = document.getElementById("classeNomeID");
        const campoClasseMagia = document.getElementById(
          "magiaClasseConjuradora",
        );
        const campoAtributoMagia = document.getElementById(
          "magiaAtributoConjuracao",
        );

        if (
          campoClasseBase &&
          campoClasseMagia &&
          (forcarClasse || !campoClasseMagia.value.trim())
        ) {
          const optionSelecionada =
            campoClasseBase.selectedOptions?.[0] ||
            campoClasseBase.options[campoClasseBase.selectedIndex];

          const textoClasse = optionSelecionada?.text?.trim() || "";

          campoClasseMagia.value = textoClasse;
        }

        const classeReferencia =
          campoClasseMagia?.value.trim() || campoClasseBase?.value.trim() || "";

        if (
          campoAtributoMagia &&
          (forcarAtributo || !campoAtributoMagia.value)
        ) {
          campoAtributoMagia.value =
            inferirAtributoConjuracaoPorClasse(classeReferencia);
        }
      }

      function formatarRotuloAtributo(chaveAtributo) {
        const chaveNormalizada = normalizarChaveAtributo(chaveAtributo);

        // ===== Conjuração por classe (sincronização automática) =====
        // Mapeamento: classe selecionada -> atributo de conjuração
        // Classes sem atributo retornam vazio "" (sem usar "-")
        const ATRIBUTO_CONJURACAO_POR_CLASSE = {
          barbaro: "",
          guerreiro: "",
          ladino: "",
          monge: "",
          paladino: "",
          patrulheiro: "",
          bardo: "car",
          bruxo: "car",
          feiticeiro: "car",
          mago: "int",
          druida: "sab",
          clerigo: "sab",
        };

        // Garante readonly por automação (caso algo tenha removido)
        const campoClasseMagia = document.getElementById(
          "magiaClasseConjuradora",
        );
        if (campoClasseMagia)
          campoClasseMagia.setAttribute("readonly", "readonly");

        // Listener: change de classe
        const campoClasseBase = document.getElementById("classeNomeID");

        // Initial sync (sem depender do estado anterior)
        atualizarConjuracaoPorClasse();

        const mapa = {
          for: "FOR",
          des: "DES",
          con: "CON",
          int: "INT",
          sab: "SAB",
          car: "CAR",
        };

        return mapa[chaveNormalizada] || "";
      }

      const NIVEIS_MAGIA = Array.from({ length: 10 }, (_, indice) => indice);
      const OPCOES_ESCOLA_MAGIA = [
        "Abjuração",
        "Adivinhação",
        "Conjuração",
        "Encantamento",
        "Evocação",
        "Ilusão",
        "Necromancia",
        "Transmutação",
      ];
      const OPCOES_TIPO_DANO_MAGIA = [
        "Ácido",
        "Concussão",
        "Cortante",
        "Elétrico",
        "Fogo",
        "Força",
        "Frio",
        "Necrótico",
        "Perfurante",
        "Psíquico",
        "Radiante",
        "Trovejante",
        "Veneno",
      ];
      const OPCOES_RESOLUCAO_MAGIA = ["Ataque", "Teste de Resistência"];
      const OPCOES_TESTE_RESISTENCIA_MAGIA = [
        "FOR",
        "DES",
        "CON",
        "INT",
        "SAB",
        "CAR",
      ];
      const PREFIXO_SLOT_ESCUDO = "__escudo__";
      const estadoModalMagia = {
        nivel: 0,
        indice: null,
        modo: "visualizar",
        origemCombate: false,
      };
      const estadoModalUsoMagia = {
        magia: null,
        nivelMinimo: 1,
        ultimoFoco: null,
        origemCombate: false,
      };
      let concentracaoAtiva = null;
      let ultimoResultadoConcentracao = null;
      let ultimoFocoModalConcentracao = null;
      const TALENTOS_CONFIG = {
        classe: {
          campoId: "talentoClasse",
          listaId: "talentoClasseLista",
          rotulo: "Classe",
          resumoId: "talentoClasseResumo",
        },
        arquetipo: {
          campoId: "talentoArquetipo",
          listaId: "talentoArquetipoLista",
          rotulo: "Subclasse",
          resumoId: "talentoArquetipoResumo",
        },
        raca: {
          campoId: "talentoRaca",
          listaId: "talentoRacaLista",
          rotulo: "Raça",
          resumoId: "talentoRacaResumo",
        },
        antecedente: {
          campoId: "talentoAntecedente",
          listaId: "talentoAntecedenteLista",
          rotulo: "Antecedente",
          resumoId: "talentoAntecedenteResumo",
        },
        outros: {
          campoId: "talentoOutro",
          listaId: "talentoOutroLista",
          rotulo: "Outros Talentos",
          resumoId: null,
        },
      };
      const estadoModalTalento = {
        categoria: null,
        indice: null,
        modo: "visualizar",
        itemOriginal: null,
        novoItem: false,
      };
      let ultimoFocoModalMagia = null;
      let ultimoFocoModalTalento = null;
      let estadoCombate = {
        maoPrincipal: {
          item: null,
          modo: "vazio",
        },
        maoSecundaria: {
          item: null,
          ativa: true,
        },
      };
      let estadoMenuEmpunhadura = {
        slot: null,
        ancoraId: null,
      };

      function obterTextoCampoTalento(id) {
        return String(document.getElementById(id)?.value || "").trim();
      }

      function obterOrigemTalento(categoria) {
        const config = TALENTOS_CONFIG[categoria];
        if (!config) return "";

        if (config.resumoId) {
          const campoResumo = document.getElementById(config.resumoId);
          if (campoResumo) {
            const valor = (
              "value" in campoResumo
                ? campoResumo.value
                : campoResumo.textContent || ""
            ).trim();
            if (valor) return valor;
          }
        }

        return config.rotulo;
      }

      function obterSubtituloTalento(categoria, talento) {
        const config = TALENTOS_CONFIG[categoria];
        const tipoPadrao =
          categoria === "outros" ? "Talento" : "Característica";
        const tipo = talento?.tipo?.trim() || config?.rotulo || tipoPadrao;
        const origem = obterOrigemTalento(categoria) || talento?.origem?.trim();
        return origem ? `${tipo}: ${origem}` : tipo;
      }

      function normalizarItemTalento(item, categoria) {
        if (!item) {
          return {
            nome: "",
            descricao: "",
            tipo:
              TALENTOS_CONFIG[categoria]?.rotulo ||
              (categoria === "outros" ? "Talento" : "Característica"),
            origem: obterOrigemTalento(categoria),
          };
        }

        if (typeof item === "string") {
          return {
            nome: item.trim(),
            descricao: "",
            tipo:
              TALENTOS_CONFIG[categoria]?.rotulo ||
              (categoria === "outros" ? "Talento" : "Característica"),
            origem: obterOrigemTalento(categoria),
          };
        }

        return {
          ...item,
          nome: String(item.nome || item.titulo || "").trim(),
          descricao: String(item.descricao || "").trim(),
          tipo: String(
            item.tipo ||
              TALENTOS_CONFIG[categoria]?.rotulo ||
              (categoria === "outros" ? "Talento" : "Característica"),
          ).trim(),
          origem: String(item.origem || obterOrigemTalento(categoria)).trim(),
        };
      }

      function converterTextoParaTalentos(texto, categoria) {
        return String(texto || "")
          .split(/\r?\n|;|,/)
          .map((parte) => parte.trim())
          .filter(Boolean)
          .map((nome) =>
            normalizarItemTalento({ nome, descricao: "" }, categoria),
          );
      }

      function normalizarListaTalentos(valor, categoria) {
        if (Array.isArray(valor)) {
          return valor
            .map((item) => normalizarItemTalento(item, categoria))
            .filter((item) => item.nome);
        }

        if (typeof valor === "string") {
          return converterTextoParaTalentos(valor, categoria);
        }

        return [];
      }

      function montarTalentosEstruturados(dados = {}) {
        const base =
          dados &&
          typeof dados.talentosEstruturados === "object" &&
          dados.talentosEstruturados
            ? dados.talentosEstruturados
            : {};

        const estrutura = {};
        Object.keys(TALENTOS_CONFIG).forEach((categoria) => {
          const config = TALENTOS_CONFIG[categoria];
          const valorEstruturado = base[categoria];
          const valorLegado =
            dados[config.campoId] ?? obterTextoCampoTalento(config.campoId);
          estrutura[categoria] = normalizarListaTalentos(
            valorEstruturado !== undefined ? valorEstruturado : valorLegado,
            categoria,
          );
        });

        return estrutura;
      }

      function sincronizarCamposTalentos() {
        Object.entries(TALENTOS_CONFIG).forEach(([categoria, config]) => {
          const campo = document.getElementById(config.campoId);
          if (!campo) return;

          campo.value = (talentosEstruturados[categoria] || [])
            .map((item) => item.nome)
            .filter(Boolean)
            .join(", ");
        });
      }

      function montarModalTalento() {
        if (document.getElementById("talentoModalOverlay")) return;

        const overlay = document.createElement("div");
        overlay.id = "talentoModalOverlay";
        overlay.className = "talento-modal-overlay modal-overlay-base";
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = `
                <div class="talento-modal modal-base" role="dialog" aria-modal="true" aria-labelledby="talentoModalTitulo">
                    <div class="talento-modal-header modal-header-base">
                        <div>
                            <div id="talentoModalTitulo" class="talento-modal-titulo">Talento</div>
                            <div id="talentoModalSubtitulo" class="talento-modal-subtitulo"></div>
                        </div>
                        <div class="talento-modal-acoes">
                            <button type="button" class="talento-modal-fechar modal-close-base talento-modal-acao-icone" id="talentoModalEditar" title="Editar">✏️</button>
                            <button type="button" class="talento-modal-fechar modal-close-base talento-modal-acao-icone" id="talentoModalExcluir" title="Excluir">🗑️</button>
                            <button type="button" class="talento-modal-fechar modal-close-base" id="talentoModalSalvar">💾 Salvar</button>
                            <button type="button" class="talento-modal-fechar modal-close-base" id="talentoModalFechar">Fechar</button>
                        </div>
                    </div>
                    <div id="talentoModalCorpo" class="talento-modal-corpo modal-body-base"></div>
                </div>
            `;

        document.body.appendChild(overlay);
      }

      function renderTalentos() {
        if (!window.document) return;
        sincronizarCamposTalentos();

        Object.entries(TALENTOS_CONFIG).forEach(([categoria, config]) => {
          const lista = document.getElementById(config.listaId);
          if (!lista) return;

          lista.replaceChildren();
          const itens = talentosEstruturados[categoria] || [];

          itens.forEach((talento, indice) => {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "talento-item";
            botao.textContent = talento.nome;
            botao.title =
              String(talento?.descricao || "").trim() ||
              "Sem descrição cadastrada.";
            botao.addEventListener("click", () =>
              abrirModalTalento(talento, categoria, indice),
            );
            lista.appendChild(botao);
          });

          const botaoNovo = document.createElement("button");
          botaoNovo.type = "button";
          botaoNovo.className = "talento-botao-add";
          botaoNovo.textContent =
            categoria === "outros" ? "+ novo talento" : "+ nova característica";
          botaoNovo.addEventListener("click", () =>
            adicionarNovaCaracteristica(categoria),
          );
          lista.appendChild(botaoNovo);
        });
      }

      function renderizarVisualizacaoTalento(talento) {
        const corpo = document.getElementById("talentoModalCorpo");
        if (!corpo) return;

        corpo.innerHTML = `
                <div class="talento-modal-conteudo">
                    <div class="talento-modal-bloco">
                        <div id="talentoModalDescricaoTexto"></div>
                    </div>
                </div>
            `;

        const descricao = corpo.querySelector("#talentoModalDescricaoTexto");
        if (!descricao) return;
        if (talento?.descricao) {
          descricao.textContent = talento.descricao;
        } else {
          descricao.className = "talento-modal-sem-descricao";
          descricao.textContent = "Sem descrição cadastrada.";
        }
      }

      function renderizarFormularioTalento(talento) {
        const corpo = document.getElementById("talentoModalCorpo");
        if (!corpo) return;

        corpo.innerHTML = `
                <div class="talento-modal-formulario">
                    <label for="talentoModalNomeInput">Titulo
                        <input id="talentoModalNomeInput" type="text">
                    </label>
                    <label for="talentoModalDescricaoInput">Descricao
                        <textarea id="talentoModalDescricaoInput"></textarea>
                    </label>
                </div>
            `;
        document.getElementById("talentoModalNomeInput").value = String(
          talento?.nome || "",
        );
        document.getElementById("talentoModalDescricaoInput").value = String(
          talento?.descricao || "",
        );
      }

      function abrirModalTalento(
        talento,
        categoria,
        indice = null,
        modo = "visualizar",
      ) {
        const overlay = document.getElementById("talentoModalOverlay");
        if (!overlay) return;

        ultimoFocoModalTalento =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        estadoModalTalento.categoria = categoria;
        estadoModalTalento.indice = indice;
        estadoModalTalento.modo = modo;
        estadoModalTalento.itemOriginal = normalizarItemTalento(
          talento,
          categoria,
        );
        estadoModalTalento.novoItem = indice === null;

        const titulo = document.getElementById("talentoModalTitulo");
        const subtitulo = document.getElementById("talentoModalSubtitulo");
        const botaoSalvar = document.getElementById("talentoModalSalvar");
        const botaoEditar = document.getElementById("talentoModalEditar");
        const botaoExcluir = document.getElementById("talentoModalExcluir");

        if (titulo)
          titulo.textContent =
            talento?.nome ||
            (categoria === "outros" ? "Talento" : "Característica");
        if (subtitulo)
          subtitulo.textContent = obterSubtituloTalento(categoria, talento);
        if (botaoSalvar)
          botaoSalvar.style.display =
            modo === "editar" ? "inline-flex" : "none";
        if (botaoEditar)
          botaoEditar.style.display =
            modo === "visualizar" ? "inline-flex" : "none";
        if (botaoExcluir)
          botaoExcluir.style.display =
            modo === "visualizar" ? "inline-flex" : "none";
        if (modo === "editar") renderizarFormularioTalento(talento);
        else renderizarVisualizacaoTalento(talento);

        overlay.classList.add("ativo");
        overlay.setAttribute("aria-hidden", "false");
        if (modo === "editar")
          document.getElementById("talentoModalNomeInput")?.focus();
        else document.getElementById("talentoModalFechar")?.focus();
      }

      function modalTalentoTemAlteracoes() {
        if (estadoModalTalento.modo !== "editar") return false;
        const original = estadoModalTalento.itemOriginal || {};
        const nomeAtual = String(
          document.getElementById("talentoModalNomeInput")?.value || "",
        ).trim();
        const descricaoAtual = String(
          document.getElementById("talentoModalDescricaoInput")?.value || "",
        ).trim();
        return (
          nomeAtual !== String(original.nome || "").trim() ||
          descricaoAtual !== String(original.descricao || "").trim()
        );
      }

      function fecharModalTalento() {
        const overlay = document.getElementById("talentoModalOverlay");
        if (!overlay) return;

        if (modalTalentoTemAlteracoes()) {
          const desejaSair = window.confirm(
            "Existem alterações não salvas. Deseja sair mesmo?",
          );
          if (!desejaSair) return;
        }

        const focoAtual = document.activeElement;
        if (focoAtual instanceof HTMLElement && overlay.contains(focoAtual)) {
          focoAtual.blur();
        }

        overlay.classList.remove("ativo");
        overlay.setAttribute("aria-hidden", "true");

        if (
          ultimoFocoModalTalento instanceof HTMLElement &&
          document.contains(ultimoFocoModalTalento)
        ) {
          ultimoFocoModalTalento.focus();
        }
        ultimoFocoModalTalento = null;
        estadoModalTalento.categoria = null;
        estadoModalTalento.indice = null;
        estadoModalTalento.modo = "visualizar";
        estadoModalTalento.itemOriginal = null;
        estadoModalTalento.novoItem = false;
      }

      function adicionarNovaCaracteristica(categoria) {
        const item = normalizarItemTalento(
          {
            nome: "",
            descricao: "",
            tipo: categoria === "outros" ? "Talento" : "Característica",
            origem: obterOrigemTalento(categoria),
          },
          categoria,
        );

        abrirModalTalento(item, categoria, null, "editar");
      }

      function salvarModalTalento() {
        const categoria = estadoModalTalento.categoria;
        if (!categoria) return;

        const campoNome = document.getElementById("talentoModalNomeInput");
        const campoDescricao = document.getElementById(
          "talentoModalDescricaoInput",
        );
        const nome = String(campoNome?.value || "").trim();
        const descricao = String(campoDescricao?.value || "").trim();
        if (!nome) {
          campoNome?.focus();
          return;
        }

        const item = normalizarItemTalento(
          {
            nome,
            descricao,
            tipo: categoria === "outros" ? "Talento" : "Característica",
            origem: obterOrigemTalento(categoria),
          },
          categoria,
        );

        talentosEstruturados[categoria] = talentosEstruturados[categoria] || [];
        if (
          Number.isInteger(estadoModalTalento.indice) &&
          talentosEstruturados[categoria][estadoModalTalento.indice]
        ) {
          talentosEstruturados[categoria][estadoModalTalento.indice] = item;
        } else {
          talentosEstruturados[categoria].push(item);
          estadoModalTalento.indice =
            talentosEstruturados[categoria].length - 1;
        }

        renderTalentos();
        estadoModalTalento.itemOriginal = item;
        estadoModalTalento.modo = "visualizar";
        fecharModalTalento();
      }

      function editarTalentoAtual() {
        const categoria = estadoModalTalento.categoria;
        const indice = estadoModalTalento.indice;
        if (!categoria) return;
        const item = Number.isInteger(indice)
          ? talentosEstruturados[categoria]?.[indice]
          : estadoModalTalento.itemOriginal;
        abrirModalTalento(
          item || estadoModalTalento.itemOriginal,
          categoria,
          indice,
          "editar",
        );
      }

      function excluirTalentoAtual() {
        const categoria = estadoModalTalento.categoria;
        const indice = estadoModalTalento.indice;
        if (!categoria || !Number.isInteger(indice)) return;
        const desejaExcluir = window.confirm("Deseja excluir este item?");
        if (!desejaExcluir) return;
        talentosEstruturados[categoria].splice(indice, 1);
        renderTalentos();
        fecharModalTalento();
      }

      function inicializarTalentos(dados = {}) {
        try {
          talentosEstruturados = montarTalentosEstruturados(dados);
          renderTalentos();
        } catch (erro) {
          console.error("Falha ao inicializar talentos:", erro);
        }
      }

      function criarValorSlotEscudo(indice) {
        return `${PREFIXO_SLOT_ESCUDO}${indice}`;
      }

      function extrairIndiceSlotEscudo(valor) {
        const texto = String(valor || "");
        if (!texto.startsWith(PREFIXO_SLOT_ESCUDO)) return null;
        const indice = parseInt(texto.slice(PREFIXO_SLOT_ESCUDO.length), 10);
        return Number.isInteger(indice) ? indice : null;
      }

      function criarMagiaPadrao(nivel) {
        return {
          id: gerarId(),
          nivel,
          preparada: false,
          nome: "",
          escola: "",
          tempo_conjuracao: "",
          alcance: "",
          duracao: "",
          propriedades: {
            dano: false,
            cura: false,
            concentracao: false,
          },
          componentes: {
            verbal: false,
            somatico: false,
            material: false,
          },
          resolucao: "",
          teste_resistencia: "",
          efeitos: [],
          descricao: "",
          proximos_niveis: "",
        };
      }

      function normalizarMagiaRegistro(registro, nivel) {
        const base = criarMagiaPadrao(nivel);
        const tags = Array.isArray(registro?.tags)
          ? registro.tags
          : String(registro?.tags || "")
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean);
        const propriedades = {
          dano: !!registro?.propriedades?.dano || tags.includes("dano"),
          cura: !!registro?.propriedades?.cura || tags.includes("cura"),
          concentracao:
            !!registro?.propriedades?.concentracao ||
            tags.includes("concentracao"),
        };
        const componentes = {
          verbal: !!registro?.componentes?.verbal || tags.includes("verbal"),
          somatico:
            !!registro?.componentes?.somatico || tags.includes("somatico"),
          material:
            !!registro?.componentes?.material || tags.includes("material"),
        };

        const efeitos = Array.isArray(registro?.efeitos)
          ? registro.efeitos
              .map((efeito) => ({
                tipo: efeito?.tipo || "",
                formula: efeito?.formula || "",
                dano_tipo: efeito?.dano_tipo || "",
                regra: efeito?.regra || "",
              }))
              .filter(
                (efeito) =>
                  efeito.tipo ||
                  efeito.formula ||
                  efeito.dano_tipo ||
                  efeito.regra,
              )
          : [];

        if (registro?.danoFormula || registro?.danoTipo) {
          efeitos.push({
            tipo: "dano",
            formula: registro.danoFormula || "",
            dano_tipo: registro.danoTipo || "",
            regra: "",
          });
        }

        if (registro?.curaRegra) {
          efeitos.push({
            tipo: "cura",
            formula: "",
            dano_tipo: "",
            regra: registro.curaRegra,
          });
        }

        return {
          ...base,
          ...registro,
          id: registro?.id || base.id,
          nivel,
          preparada: !!registro?.preparada,
          propriedades,
          componentes,
          resolucao: registro?.resolucao || "",
          teste_resistencia: registro?.teste_resistencia || "",
          efeitos,
        };
      }

      function obterCampoArmazenamentoMagia(nivel) {
        return document.getElementById(`magia${nivel}Texto`);
      }

      function lerMagiasNivel(nivel) {
        const campo = obterCampoArmazenamentoMagia(nivel);
        if (!campo) return [];

        const valorBruto = String(campo.value || "").trim();
        if (!valorBruto) return [];

        try {
          const dados = JSON.parse(valorBruto);
          if (Array.isArray(dados)) {
            return dados.map((registro) =>
              normalizarMagiaRegistro(registro, nivel),
            );
          }
        } catch (erro) {
          return valorBruto
            .split(/\r?\n/)
            .map((linha) => linha.trim())
            .filter(Boolean)
            .map((nome) => normalizarMagiaRegistro({ nome }, nivel));
        }

        return [];
      }

      function salvarMagiasNivel(nivel, magias) {
        const campo = obterCampoArmazenamentoMagia(nivel);
        if (!campo) return;

        campo.value = JSON.stringify(magias, null, 2);
      }

      function obterContainerListaMagias(nivel) {
        return document.getElementById(`magia${nivel}Lista`);
      }

      function obterModalMagiaOverlay() {
        return document.getElementById("magiaModalOverlay");
      }

      function obterRotuloNivelMagia(nivel) {
        return nivel === 0 ? "Truque" : `Nível ${nivel}`;
      }

      function escaparHtmlMagia(valor) {
        return String(valor || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function obterNomePersonagemHistoricoMagia() {
        return (
          String(
            document.getElementById("nomePersonagem")?.value || "Personagem",
          ).trim() || "Personagem"
        );
      }

      function obterEstadoEspacoMagia(nivel) {
        const campoTotal = document.getElementById(`magia${nivel}Total`);
        const campoUsado = document.getElementById(`magia${nivel}Usado`);
        const total = Math.max(0, parseInt(campoTotal?.value, 10) || 0);
        const usado = Math.max(0, parseInt(campoUsado?.value, 10) || 0);

        return {
          nivel,
          total,
          usado,
          restante: Math.max(0, total - usado),
          campoTotal,
          campoUsado,
        };
      }

      function obterEspacosDisponiveisParaMagia(nivelMagia) {
        const nivelMinimo = Math.max(1, parseInt(nivelMagia, 10) || 1);
        return NIVEIS_MAGIA.filter((nivel) => nivel >= nivelMinimo)
          .map(obterEstadoEspacoMagia)
          .filter(
            (espaco) =>
              espaco.campoTotal && espaco.campoUsado && espaco.restante > 0,
          );
      }

      function consumirEspacoMagia(nivelSlot) {
        const espaco = obterEstadoEspacoMagia(nivelSlot);
        if (!espaco.campoUsado || espaco.restante <= 0) return false;

        espaco.campoUsado.value = String(espaco.usado + 1);
        espaco.campoUsado.dispatchEvent(new Event("input", { bubbles: true }));
        espaco.campoUsado.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }

      function registrarHistoricoMagia(magia, nivelSlot = null) {
        const nomeMagiaOriginal = magia?.nome || "Magia";
        const nomeMagia = escaparHtmlMagia(nomeMagiaOriginal);

        const ehTruque = !Number.isInteger(nivelSlot);
        const tipoHistorico = ehTruque ? "Truque" : `Magia NV ${nivelSlot}`;

        // MVP (requisito):
        // - Truque: valor = apenas o nome da magia
        // - Magia: valor = nome completo da magia (inclui tags/título/\n mantém o padrão de exibição atual)
        const valorHistorico = nomeMagia;

        // (tipo usa o SLOT UTILIZADO via nivelSlot; truque não consome slot)
        adicionarRegistroHistoricoCombate(
          tipoHistorico,
          valorHistorico,
          "",
          "Ação",
          {
            timeline: {
              titulo: tipoHistorico,
              nome: nomeMagiaOriginal,
              iconeNome: "🪄",
              concentrando: magiaExigeConcentracao(magia),
            },
          },
        );
      }

      function abrirHistoricoCombateMagia() {
        const abaCombate = [...document.querySelectorAll(".tab")].find((tab) =>
          String(tab.textContent || "")
            .trim()
            .toLowerCase()
            .includes("combate"),
        );
        if (abaCombate instanceof HTMLElement) {
          trocarAba("combate", abaCombate);
        }

        const botaoHistorico = [
          ...document.querySelectorAll(".subaba-botao"),
        ].find((botao) =>
          String(botao.textContent || "")
            .trim()
            .toLowerCase()
            .includes("hist"),
        );
        if (botaoHistorico instanceof HTMLElement) {
          trocarSubAbaCombate("historico", botaoHistorico);
        }
      }

      function conjurarTruque(magia) {
        const origemCombate = estadoModalMagia.origemCombate;
        if (!(origemCombate && magiaPossuiDano(magia))) {
          registrarHistoricoMagia(magia);
        }
        iniciarConcentracaoMagia(magia);
        fecharModalMagia();
        estadoModalMagia.origemCombate = origemCombate;
        resolverCombateMagia(magia, null);
        estadoModalMagia.origemCombate = false;
      }

      function magiaPossuiDano(magia) {
        if (magia?.propriedades?.dano) return true;
        return (magia?.efeitos || []).some((efeito) => efeito?.tipo === "dano");
      }

      function obterEfeitoDanoMagia(magia) {
        return (
          (magia?.efeitos || []).find((efeito) => efeito?.tipo === "dano") ||
          null
        );
      }

      function obterChaveAtributoConjuracao() {
        const valor = String(
          document.getElementById("magiaAtributoConjuracao")?.value || "",
        ).trim();
        const chave = valor.slice(0, 3).toLowerCase();
        return ["for", "des", "con", "int", "sab", "car"].includes(chave)
          ? chave
          : "int";
      }

      function obterBonusAtaqueMagicoAtual() {
        const valor = String(
          document.getElementById("magiaAtaqueMagico")?.value || "",
        ).replace(/\+/g, "");
        const bonus = parseInt(valor, 10);
        return Number.isInteger(bonus) ? bonus : 0;
      }

      function parsearFormulaDanoMagia(formula) {
        const texto = String(formula || "").trim();
        const match = texto.match(
          /^(\d+)d(\d+)(?:\s*([+-])\s*(\d+|for|des|con|int|sab|car))?\s*$/i,
        );
        if (!match) return null;

        let bonus = 0;
        let rotuloBonus = "";
        const operador = match[3] === "-" ? -1 : 1;
        const termo = String(match[4] || "").toLowerCase();

        if (termo) {
          if (["for", "des", "con", "int", "sab", "car"].includes(termo)) {
            bonus = operador * (getModificadorBaseAtributo(termo) || 0);
            rotuloBonus = termo.toUpperCase();
          } else {
            bonus = operador * (parseInt(termo, 10) || 0);
            rotuloBonus = String(Math.abs(bonus));
          }
        }

        return {
          qtd: parseInt(match[1], 10),
          faces: parseInt(match[2], 10),
          formulaDado: `${parseInt(match[1], 10)}d${parseInt(match[2], 10)}`,
          bonus,
          rotuloBonus,
        };
      }

      function criarArmaVirtualMagia(magia) {
        const efeitoDano = obterEfeitoDanoMagia(magia);
        const infoDano = parsearFormulaDanoMagia(efeitoDano?.formula || "");
        const chaveAtributo = obterChaveAtributoConjuracao();
        const rotuloAtributo = chaveAtributo.toUpperCase();
        const bonusAtaque = obterBonusAtaqueMagicoAtual();
        const modBase = getModificadorBaseAtributo(chaveAtributo) || 0;

        return {
          nome: magia?.nome || "Magia",
          tipo: "magia",
          propriedade: magia?.resolucao || "",
          chaveAtributo,
          ataque: chaveAtributo,
          dano: infoDano?.formulaDado || efeitoDano?.formula || "",
          danoFormula: infoDano?.formulaDado || efeitoDano?.formula || "",
          danoTipo: efeitoDano?.dano_tipo || "",
          danoBonusMagia: infoDano?.bonus || 0,
          danoBonusRotuloMagia: infoDano?.rotuloBonus || "",
          magiaOriginal: { ...magia },
          proficiente: true,
          usaMunicao: false,
          calculoMagia: {
            rotuloAtributo,
            totalAtaque: bonusAtaque,
            textoResumo: formatarBonusAtaqueModal(bonusAtaque),
            modBase,
            bonusProf: bonusAtaque - modBase,
          },
        };
      }

      function resolverCombateMagia(magia, nivelSlot = null) {
        if (!estadoModalMagia.origemCombate || !magiaPossuiDano(magia)) {
          abrirHistoricoCombateMagia();
          return;
        }

        const resolucao = String(magia?.resolucao || "");
        if (resolucao === "Ataque") {
          abrirModalAtaqueMagia(magia, nivelSlot);
          return;
        }

        if (resolucao.toLowerCase().includes("teste")) {
          abrirModalDanoMagia(magia, { mostrarCD: true, nivelSlot });
          return;
        }

        abrirHistoricoCombateMagia();
      }

      function formatarTagsMagia(tags) {
        return (tags || [])
          .map((tag) => String(tag || "").trim())
          .filter(Boolean);
      }

      function renderizarCardDetalheMagia(magia) {
        const container = document.createElement("div");
        container.className = "magia-card-detalhe";

        const header = document.createElement("div");
        header.className = "magia-card-detalhe-header";

        const nome = document.createElement("div");
        nome.className = "magia-card-detalhe-nome";
        nome.textContent = magia.nome || "";

        header.appendChild(nome);

        const info = document.createElement("div");
        info.className = "magia-card-detalhe-info";
        info.innerHTML = `
                <div><strong>Tempo:</strong> ${magia.tempo_conjuracao || "-"}</div>
                <div><strong>Alcance:</strong> ${magia.alcance || "-"}</div>
                <div><strong>Duração:</strong> ${magia.duracao || "-"}</div>
                <div><strong>Escola:</strong> ${magia.escola || "-"}</div>
                <div><strong>Componentes:</strong> ${
                  [
                    magia?.componentes?.verbal ? "V" : "",
                    magia?.componentes?.somatico ? "S" : "",
                    magia?.componentes?.material ? "M" : "",
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"
                }</div>
            `;

        const propriedades = document.createElement("div");
        propriedades.className = "magia-card-detalhe-propriedades";
        [
          magia?.propriedades?.dano ? "dano" : "",
          magia?.propriedades?.cura ? "cura" : "",
          magia?.propriedades?.concentracao ? "concentração" : "",
          magia?.resolucao ? magia.resolucao.toLowerCase() : "",
        ]
          .filter(Boolean)
          .forEach((tag) => {
            const item = document.createElement("span");
            item.className = "magia-card-detalhe-tag";
            item.textContent = tag;
            propriedades.appendChild(item);
          });

        const efeitos = document.createElement("div");
        efeitos.className = "magia-card-detalhe-efeitos";

        if (magia.resolucao === "Ataque") {
          const ataqueMagico =
            document.getElementById("magiaAtaqueMagico")?.value || "-";
          const linhaAtaque = document.createElement("div");
          linhaAtaque.textContent = `Ataque Mágico: ${ataqueMagico}`;
          efeitos.appendChild(linhaAtaque);
        } else if (String(magia.resolucao || "").includes("Teste")) {
          const linhaTeste = document.createElement("div");
          linhaTeste.textContent = `Teste de Resistência: ${magia.teste_resistencia || "-"}`;
          efeitos.appendChild(linhaTeste);
        }

        if (Array.isArray(magia.efeitos) && magia.efeitos.length) {
          magia.efeitos.forEach((efeito) => {
            const linha = document.createElement("div");
            if (efeito.tipo === "dano") {
              linha.textContent = `Dano: ${efeito.formula || "-"}${efeito.dano_tipo ? ` (${efeito.dano_tipo})` : ""}`;
            } else if (efeito.tipo === "cura") {
              linha.textContent = `Cura: ${efeito.formula || efeito.regra || "-"}`;
            } else {
              linha.textContent = efeito.regra || efeito.formula || "";
            }
            efeitos.appendChild(linha);
          });
        } else {
          efeitos.textContent = "Sem efeitos cadastrados.";
        }

        const descricao = document.createElement("div");
        descricao.className = "magia-card-detalhe-descricao";
        descricao.textContent = [
          magia.descricao || "",
          magia.proximos_niveis
            ? `Próximos níveis: ${magia.proximos_niveis}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n");

        const botaoUso = document.createElement("button");
        botaoUso.type = "button";
        botaoUso.id = "magiaModalConjurarUsarBtn";
        const ehTruque = Number(magia?.nivel) === 0;
        botaoUso.className = ehTruque ? "btn-conjurar-magia" : "btn-usar-magia";
        botaoUso.textContent = ehTruque ? "Usar Truque" : "Usar Magia";

        botaoUso.addEventListener("click", () => {
          const ehTruque = Number(magia?.nivel) === 0;

          if (ehTruque) {
            conjurarTruque(magia);
            return;
          }

          abrirModalUsarMagia(magia, {
            origemCombate: estadoModalMagia.origemCombate,
          });
        });

        container.appendChild(header);
        container.appendChild(info);
        if (propriedades.childNodes.length) {
          container.appendChild(propriedades);
        }
        container.appendChild(efeitos);
        container.appendChild(descricao);

        const headerInfo = document.querySelector(
          "#magiaModalOverlay .magia-modal-topo-info",
        );
        const headerAcoes = document.querySelector(
          "#magiaModalOverlay .magia-modal-acoes",
        );
        document.getElementById("magiaModalConjurarUsarBtn")?.remove();

        if (headerInfo) {
          headerInfo.insertBefore(botaoUso, headerInfo.children[1] || null);
        } else if (headerAcoes) {
          headerAcoes.insertBefore(botaoUso, headerAcoes.firstChild);
        }

        return container;
      }

      function montarModalMagia() {
        if (obterModalMagiaOverlay()) return;

        const overlay = document.createElement("div");
        overlay.id = "magiaModalOverlay";
        overlay.className = "magia-modal-overlay modal-overlay-base oculto";
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = `
                <div class="magia-modal modal-base" role="dialog" aria-modal="true" aria-labelledby="magiaModalTitulo">
                    <div class="magia-modal-topo modal-header-base">
                        <div class="magia-modal-topo-info">
                            <div id="magiaModalTitulo" class="magia-modal-titulo">Magia</div>
                            <div class="magia-modal-meta">
                                <div id="magiaModalNivel" class="magia-modal-nivel">Truque</div>
                                <label class="magia-modal-preparada-topo" for="magiaModalPreparada">
                                    <input id="magiaModalPreparada" type="checkbox">
                                    <span>Magia Preparada</span>
                                </label>
                            </div>
                        </div>
                        <div class="magia-modal-acoes">
                            <button type="button" class="magia-modal-botao modal-close-base" id="magiaModalEditar">Editar</button>
                            <button type="button" class="magia-modal-botao modal-close-base perigo oculto" id="magiaModalExcluir">Excluir magia</button>
                            <button type="button" class="magia-modal-botao modal-close-base primario oculto" id="magiaModalSalvar">💾 Salvar</button>
                            <button type="button" class="magia-modal-botao modal-close-base" id="magiaModalFechar">Fechar</button>
                        </div>
                    </div>
                    <div id="magiaModalVisualizacao" style="display: block;"></div>
                    <form id="magiaModalFormulario" class="magia-formulario oculto" hidden style="display: none;">
                        <div class="magia-formulario-bloco">
                            <div class="magia-formulario-bloco-titulo">Dados básicos</div>
                        <div class="magia-formulario-grid">
                            <div class="magia-formulario-campo col-3">
                                <label for="magiaModalEscola">Escola</label>
                                <select id="magiaModalEscola"></select>
                            </div>
                            <div class="magia-formulario-campo col-9">
                                <label for="magiaModalNome">Nome da Magia</label>
                                <input id="magiaModalNome" type="text">
                            </div>
                            <div class="magia-formulario-campo col-3">
                                <label for="magiaModalTempo">Tempo de Conjuração</label>
                                <input id="magiaModalTempo" type="text">
                            </div>
                            <div class="magia-formulario-campo col-3">
                                <label for="magiaModalAlcance">Alcance</label>
                                <input id="magiaModalAlcance" type="text">
                            </div>
                            <div class="magia-formulario-campo col-3">
                                <label for="magiaModalDuracao">Duração</label>
                                <input id="magiaModalDuracao" type="text">
                            </div>
                            <div class="magia-formulario-campo concentracao-inline">
                                <label for="magiaModalPropConcentracao">
                                    <input id="magiaModalPropConcentracao" type="checkbox"> Concentração
                                </label>
                            </div>
                            <div class="magia-formulario-campo completo">
                                <label>Componentes</label>
                                <div class="magia-componentes-checks">
                                    <label><input id="magiaModalCompVerbal" type="checkbox"> Verbal</label>
                                    <label><input id="magiaModalCompSomatico" type="checkbox"> Somático</label>
                                    <label><input id="magiaModalCompMaterial" type="checkbox"> Material</label>
                                </div>
                            </div>
                        </div>
                        </div>
                        <div class="magia-formulario-bloco">
                            <div class="magia-formulario-bloco-titulo">Propriedades e efeitos</div>
                        <div class="magia-formulario-grid">
                            <div class="magia-formulario-campo completo">
                                <label>Propriedades</label>
                                <div class="magia-propriedades-checks">
                                    <label><input id="magiaModalPropDano" type="checkbox"> Dano</label>
                                    <label><input id="magiaModalPropCura" type="checkbox"> Cura</label>
                                </div>
                            </div>
                            <div class="magia-formulario-campo col-3 oculto" id="magiaModalCampoDanoFormula">
                                <label for="magiaModalDanoFormula">Fórmula de Dano</label>
                                <input id="magiaModalDanoFormula" type="text" placeholder="Ex: 3d6">
                            </div>
                            <div class="magia-formulario-campo col-3 oculto" id="magiaModalCampoDanoTipo">
                                <label for="magiaModalDanoTipo">Tipo de Dano</label>
                                <select id="magiaModalDanoTipo"></select>
                            </div>
                            <div class="magia-formulario-campo col-3 oculto" id="magiaModalCampoResolucao">
                                <label for="magiaModalResolucao">Resolução de dano</label>
                                <select id="magiaModalResolucao"></select>
                            </div>
                            <div class="magia-formulario-campo col-3 oculto" id="magiaModalCampoAtaqueMagico">
                                <label for="magiaModalAtaqueMagico">Ataque Mágico</label>
                                <input id="magiaModalAtaqueMagico" type="text" readonly>
                            </div>
                            <div class="magia-formulario-campo col-4 oculto" id="magiaModalCampoTesteResistencia">
                                <label for="magiaModalTesteResistencia">Teste de Resistência</label>
                                <select id="magiaModalTesteResistencia"></select>
                            </div>
                            <div class="magia-formulario-campo col-8 oculto" id="magiaModalCampoCuraRegra">
                                <label for="magiaModalCuraRegra">Cura</label>
                                <input id="magiaModalCuraRegra" type="text" placeholder="Ex: 2d4 +2">
                            </div>
                        </div>
                        </div>
                        <div class="magia-formulario-bloco">
                            <div class="magia-formulario-bloco-titulo">Descrição</div>
                        <div class="magia-formulario-grid">
                            <div class="magia-formulario-campo completo">
                                <label for="magiaModalDescricao">Descrição</label>
                                <textarea id="magiaModalDescricao"></textarea>
                            </div>
                            <div class="magia-formulario-campo completo">
                                <label for="magiaModalProximosNiveis">Próximos níveis</label>
                                <input id="magiaModalProximosNiveis" type="text" placeholder="Ex: +1d6 de dano por nível acima do 2">
                            </div>
                        </div>
                        </div>
                    </form>
                </div>
            `;

        document.body.appendChild(overlay);
      }

      function obterModalUsoMagiaOverlay() {
        return document.getElementById("magiaSlotModalOverlay");
      }

      function montarModalUsoMagia() {
        if (obterModalUsoMagiaOverlay()) return;

        const overlay = document.createElement("div");
        overlay.id = "magiaSlotModalOverlay";
        overlay.className = "magia-slot-modal-overlay oculto";
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = `
                <div class="magia-slot-modal" role="dialog" aria-modal="true" aria-labelledby="magiaSlotModalTitulo">
                    <div id="magiaSlotModalTitulo" class="magia-slot-modal-titulo">Usar magia</div>
                    <div class="magia-slot-modal-texto">Escolha o espaço utilizado:</div>
                    <div id="magiaSlotModalOpcoes" class="magia-slot-opcoes"></div>
                    <div class="magia-modal-acoes">
                        <button type="button" class="magia-modal-botao" id="magiaSlotModalCancelar">Cancelar</button>
                        <button type="button" class="magia-modal-botao primario" id="magiaSlotModalConfirmar">Confirmar</button>
                    </div>
                </div>
            `;

        document.body.appendChild(overlay);
      }

      function renderizarOpcoesSlotMagia(magia) {
        const container = document.getElementById("magiaSlotModalOpcoes");
        const botaoConfirmar = document.getElementById(
          "magiaSlotModalConfirmar",
        );
        if (!container) return;

        const espacos = obterEspacosDisponiveisParaMagia(magia?.nivel || 1);
        container.replaceChildren();

        if (!espacos.length) {
          const vazio = document.createElement("div");
          vazio.className = "magia-slot-modal-texto";
          vazio.textContent = "Nenhum espaço de magia disponível.";
          container.appendChild(vazio);
          if (botaoConfirmar) botaoConfirmar.disabled = true;
          return;
        }

        espacos.forEach((espaco, indice) => {
          const id = `magiaSlotOpcao${espaco.nivel}`;
          const label = document.createElement("label");
          label.className = "magia-slot-opcao";
          label.setAttribute("for", id);

          const input = document.createElement("input");
          input.type = "radio";
          input.name = "magiaSlotNivel";
          input.id = id;
          input.value = String(espaco.nivel);
          input.checked = indice === 0;

          const texto = document.createElement("span");
          texto.textContent = `Nível ${espaco.nivel} (${espaco.restante} restantes)`;

          label.appendChild(input);
          label.appendChild(texto);
          container.appendChild(label);
        });

        if (botaoConfirmar) botaoConfirmar.disabled = false;
      }

      function abrirModalUsarMagia(magia, opcoes = {}) {
        const overlay = obterModalUsoMagiaOverlay();
        if (!overlay || !magia) return;

        estadoModalUsoMagia.magia = { ...magia };
        estadoModalUsoMagia.origemCombate = !!opcoes.origemCombate;
        estadoModalUsoMagia.nivelMinimo = Math.max(
          1,
          parseInt(magia.nivel, 10) || 1,
        );
        estadoModalUsoMagia.ultimoFoco =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

        const titulo = document.getElementById("magiaSlotModalTitulo");
        if (titulo) titulo.textContent = `Usar "${magia.nome || "Magia"}"`;

        renderizarOpcoesSlotMagia(magia);

        overlay.classList.add("ativo");
        overlay.classList.remove("oculto");
        overlay.setAttribute("aria-hidden", "false");

        const primeiroSlot = overlay.querySelector(
          'input[name="magiaSlotNivel"]',
        );
        if (primeiroSlot instanceof HTMLElement) primeiroSlot.focus();
        else document.getElementById("magiaSlotModalCancelar")?.focus();
      }

      function fecharModalUsarMagia() {
        const overlay = obterModalUsoMagiaOverlay();
        if (!overlay) return;

        const focoAtual = document.activeElement;
        if (focoAtual instanceof HTMLElement && overlay.contains(focoAtual)) {
          focoAtual.blur();
        }

        overlay.classList.remove("ativo");
        overlay.classList.add("oculto");
        overlay.setAttribute("aria-hidden", "true");

        if (
          estadoModalUsoMagia.ultimoFoco instanceof HTMLElement &&
          document.contains(estadoModalUsoMagia.ultimoFoco)
        ) {
          estadoModalUsoMagia.ultimoFoco.focus();
        }

        estadoModalUsoMagia.magia = null;
        estadoModalUsoMagia.nivelMinimo = 1;
        estadoModalUsoMagia.ultimoFoco = null;
        estadoModalUsoMagia.origemCombate = false;
      }

      function obterSlotSelecionadoModalMagia() {
        const selecionado = document.querySelector(
          '#magiaSlotModalOpcoes input[name="magiaSlotNivel"]:checked',
        );
        const nivelSlot = parseInt(selecionado?.value, 10);
        return Number.isInteger(nivelSlot) ? nivelSlot : null;
      }

      function confirmarUsoMagia() {
        const magia = estadoModalUsoMagia.magia;
        const nivelSlot = obterSlotSelecionadoModalMagia();
        if (!magia || !Number.isInteger(nivelSlot)) return;
        if (nivelSlot < estadoModalUsoMagia.nivelMinimo) return;

        const consumiu = consumirEspacoMagia(nivelSlot);
        if (!consumiu) {
          renderizarOpcoesSlotMagia(magia);
          return;
        }

        const origemCombate = estadoModalUsoMagia.origemCombate;
        if (!(origemCombate && magiaPossuiDano(magia))) {
          registrarHistoricoMagia(magia, nivelSlot);
        }
        iniciarConcentracaoMagia(magia, nivelSlot);
        atualizarMagias();
        fecharModalUsarMagia();
        fecharModalMagia();
        if (origemCombate) {
          estadoModalMagia.origemCombate = true;
          resolverCombateMagia(magia, nivelSlot);
          estadoModalMagia.origemCombate = false;
        } else {
          abrirHistoricoCombateMagia();
        }
      }

      function prepararInterfaceNivelMagia(nivel) {
        const campo = obterCampoArmazenamentoMagia(nivel);
        if (!campo) return;

        campo.classList.add("magia-storage");
        if (document.getElementById(`magia${nivel}Lista`)) return;

        const lista = document.createElement("div");
        lista.id = `magia${nivel}Lista`;
        lista.className = "magia-lista";
        campo.parentNode.insertBefore(lista, campo);

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "magia-botao-add";
        botao.textContent = "Nova Magia";
        botao.addEventListener("click", () => adicionarNovaMagia(nivel));

        const cabecalho = campo
          .closest(".magia-card")
          ?.querySelector(
            nivel === 0 ? ".magia-cabecalho-truques" : ".magia-cabecalho",
          );
        cabecalho?.appendChild(botao);
      }

      function inicializarGerenciadorMagias() {
        montarModalMagia();
        montarModalUsoMagia();
        preencherSelectMagia("magiaModalEscola", OPCOES_ESCOLA_MAGIA);
        preencherSelectMagia("magiaModalDanoTipo", OPCOES_TIPO_DANO_MAGIA);
        preencherSelectMagia("magiaModalResolucao", OPCOES_RESOLUCAO_MAGIA);
        preencherSelectMagia(
          "magiaModalTesteResistencia",
          OPCOES_TESTE_RESISTENCIA_MAGIA,
        );
        NIVEIS_MAGIA.forEach(prepararInterfaceNivelMagia);
        renderizarTodasMagias();
      }

      function preencherSelectMagia(id, opcoes) {
        const select = document.getElementById(id);
        if (!select) return;

        select.innerHTML = "";

        const vazio = document.createElement("option");
        vazio.value = "";
        vazio.textContent = "-";
        select.appendChild(vazio);

        opcoes.forEach((opcao) => {
          const item = document.createElement("option");
          item.value = opcao;
          item.textContent = opcao;
          select.appendChild(item);
        });
      }

      function obterResumoStatusMagico() {
        return {
          atributo:
            String(
              document.getElementById("magiaAtributoConjuracao")?.value || "-",
            ).toUpperCase() || "-",
          cd:
            String(document.getElementById("magiaCD")?.value || "-").trim() ||
            "-",
          ataque:
            String(
              document.getElementById("magiaAtaqueMagico")?.value || "-",
            ).trim() || "-",
        };
      }

      function criarLinhaStatusMagico() {
        const status = obterResumoStatusMagico();
        const linha = document.createElement("div");
        linha.className = "magia-status-magico";

        [
          ["Conj.", status.atributo],
          ["CD", status.cd],
          ["Atq.", status.ataque],
        ].forEach(([rotulo, valor]) => {
          const item = document.createElement("span");
          item.className = "magia-status-magico-item";

          const label = document.createElement("span");
          label.className = "magia-status-magico-rotulo";
          label.textContent = rotulo;

          const texto = document.createElement("span");
          texto.textContent = valor;

          item.appendChild(label);
          item.appendChild(texto);
          linha.appendChild(item);
        });

        return linha;
      }

      function obterNomeConcentracao(magia = concentracaoAtiva?.magia) {
        return String(magia?.nome || "magia").trim() || "magia";
      }

      function obterChaveConcentracaoMagia(magia) {
        if (!magia) return "";
        return [
          Number(magia.nivel) || 0,
          String(magia.nome || "")
            .trim()
            .toLowerCase(),
        ].join("::");
      }

      function magiaExigeConcentracao(magia) {
        return !!magia?.propriedades?.concentracao;
      }

      function magiaEstaConcentrada(magia) {
        return (
          !!concentracaoAtiva &&
          obterChaveConcentracaoMagia(magia) === concentracaoAtiva.chave
        );
      }

      function registrarHistoricoConcentracao(acao, magia, icone) {
        const rotulos = {
          perdida: "Perdida",
          encerrada: "Encerrada",
          mantida: "Mantida",
        };
        const rotulo = rotulos[acao] || String(acao || "Atualizada");
        adicionarRegistroHistoricoCombate(
          "Concentração",
          `${rotulo}: ${obterNomeConcentracao(magia)}`,
          icone,
          "",
          {
            timeline: {
              simples: true,
              exibirBadge: false,
              texto: `${icone || "🌀"} Concentração ${rotulo}`,
            },
          },
        );
      }

      function iniciarConcentracaoMagia(magia, nivelSlot = null) {
        if (!magiaExigeConcentracao(magia)) return;

        concentracaoAtiva = {
          magia: { ...magia },
          iniciadaEm: new Date().toISOString(),
          nivelSlot,
          chave: obterChaveConcentracaoMagia(magia),
        };
        ultimoResultadoConcentracao = null;

        atualizarSubAbaMagiasCombate();
      }

      function encerrarConcentracao(motivo = "encerrada", opcoes = {}) {
        if (!concentracaoAtiva) return;

        const magia = concentracaoAtiva.magia;
        concentracaoAtiva = null;
        ultimoResultadoConcentracao = motivo === "perdida" ? "falha" : null;

        if (opcoes.registrarHistorico !== false) {
          registrarHistoricoConcentracao(motivo, magia, "❌");
        }

        atualizarSubAbaMagiasCombate();
      }

      function criarHudConcentracao() {
        if (!concentracaoAtiva) return null;

        const nome = obterNomeConcentracao();
        const hud = document.createElement("div");
        hud.className = "magia-concentracao-hud";

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "magia-concentracao-botao";
        if (ultimoResultadoConcentracao === "sucesso") {
          botao.classList.add("feedback-sucesso");
          ultimoResultadoConcentracao = null;
        } else if (ultimoResultadoConcentracao === "falha") {
          botao.classList.add("feedback-falha");
          ultimoResultadoConcentracao = null;
        }
        botao.textContent = `🌀 ${nome}`;
        botao.title = `Você está concentrando na magia ${nome}`;
        botao.addEventListener("click", abrirModalEncerrarConcentracao);

        hud.appendChild(botao);
        return hud;
      }

      function abrirModalEncerrarConcentracao() {
        if (!concentracaoAtiva) return;

        montarModalEncerrarConcentracao();
        const overlay = document.getElementById("concentracaoModalOverlay");
        const texto = document.getElementById("concentracaoModalTexto");
        if (!overlay || !texto) return;

        const nome = obterNomeConcentracao();
        texto.textContent = `Deseja encerrar a concentração em ${nome}?`;
        ultimoFocoModalConcentracao =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

        overlay.classList.remove("oculto");
        overlay.classList.add("ativo");
        overlay.setAttribute("aria-hidden", "false");
        document.getElementById("concentracaoModalCancelar")?.focus();
      }

      function fecharModalEncerrarConcentracao() {
        const overlay = document.getElementById("concentracaoModalOverlay");
        if (!overlay) return;

        overlay.classList.remove("ativo");
        overlay.classList.add("oculto");
        overlay.setAttribute("aria-hidden", "true");

        if (
          ultimoFocoModalConcentracao instanceof HTMLElement &&
          document.contains(ultimoFocoModalConcentracao)
        ) {
          ultimoFocoModalConcentracao.focus();
        }
        ultimoFocoModalConcentracao = null;
      }

      function montarModalEncerrarConcentracao() {
        if (document.getElementById("concentracaoModalOverlay")) return;

        const overlay = document.createElement("div");
        overlay.id = "concentracaoModalOverlay";
        overlay.className = "ataque-modal-overlay modal-overlay-base oculto";
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = `
          <div class="ataque-modal modal-base" role="dialog" aria-modal="true" aria-labelledby="concentracaoModalTitulo">
            <div class="ataque-modal-corpo">
              <div id="concentracaoModalTitulo" class="ataque-modal-titulo">Concentração</div>
              <div id="concentracaoModalTexto" class="magia-vazia"></div>
              <div class="ataque-modal-acoes">
                <button type="button" class="ataque-botao" id="concentracaoModalCancelar">Cancelar</button>
                <button type="button" class="ataque-botao" id="concentracaoModalEncerrar">Encerrar</button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);

        document
          .getElementById("concentracaoModalCancelar")
          ?.addEventListener("click", fecharModalEncerrarConcentracao);
        document
          .getElementById("concentracaoModalEncerrar")
          ?.addEventListener("click", () => {
            encerrarConcentracao("encerrada");
            fecharModalEncerrarConcentracao();
          });
        overlay.addEventListener("click", (evento) => {
          if (evento.target === overlay) fecharModalEncerrarConcentracao();
        });
      }

      function abrirTesteConcentracaoPorDano(dano) {
        if (!concentracaoAtiva || !(dano > 0)) return;

        const cd = Math.max(10, Math.floor(dano / 2));
        const nome = obterNomeConcentracao();
        abrirModalTesteResistencia({
          atributo: "con",
          titulo: `Teste para manter concentração em ${nome}`,
          contextoConcentracao: {
            cd,
            magia: concentracaoAtiva.magia,
            chave: concentracaoAtiva.chave,
          },
        });
      }

      function renderizarTodasMagias() {
        NIVEIS_MAGIA.forEach(renderizarListaMagiasNivel);
        atualizarSubAbaMagiasCombate();
      }

      function alternarGrupoMagia(grupo) {
        if (!grupo) return;
        const fechado = grupo.classList.toggle("fechado");
        grupo.classList.toggle("aberto", !fechado);

        const seta = grupo.querySelector(".magia-grupo-seta");
        if (seta) seta.textContent = fechado ? "▶" : "▼";

        const header = grupo.querySelector(".magia-grupo-header");
        if (header)
          header.setAttribute("aria-expanded", fechado ? "false" : "true");
      }

      function criarHeaderGrupoMagia(nivel, slotsTexto = "") {
        const header = document.createElement("div");
        header.className = "magia-grupo-header";
        header.setAttribute("role", "button");
        header.tabIndex = 0;

        const seta = document.createElement("span");
        seta.className = "magia-grupo-seta";
        seta.textContent = "▼";

        const titulo = document.createElement("span");
        titulo.className = "magia-grupo-titulo";
        titulo.textContent = nivel === 0 ? "Truques" : `Nível ${nivel}`;

        header.appendChild(seta);
        header.appendChild(titulo);

        if (slotsTexto) {
          const slots = document.createElement("span");
          slots.className = "magia-grupo-slots";
          slots.textContent = slotsTexto;
          header.appendChild(slots);
        }

        header.addEventListener("click", () =>
          alternarGrupoMagia(header.closest(".magia-grupo-nivel")),
        );
        header.addEventListener("keydown", (evento) => {
          if (evento.key !== "Enter" && evento.key !== " ") return;
          evento.preventDefault();
          alternarGrupoMagia(header.closest(".magia-grupo-nivel"));
        });

        return header;
      }

      function aplicarEstadoInicialGrupoMagia(grupo, aberto) {
        grupo.classList.toggle("aberto", aberto);
        grupo.classList.toggle("fechado", !aberto);

        const seta = grupo.querySelector(".magia-grupo-seta");
        if (seta) seta.textContent = aberto ? "▼" : "▶";

        const header = grupo.querySelector(".magia-grupo-header");
        if (header)
          header.setAttribute("aria-expanded", aberto ? "true" : "false");
      }

      function atualizarContadorMagiasPreparadas() {
        let totalPreparadas = 0;
        let totalDisponiveis = 0;

        for (let nivel = 1; nivel <= 9; nivel++) {
          const magias = lerMagiasNivel(nivel);
          magias.forEach((magia) => {
            const temNome = String(magia.nome || "").trim();
            if (temNome) {
              totalDisponiveis++;
              if (magia.preparada) totalPreparadas++;
            }
          });
        }

        const contador = document.getElementById("magiaContadorPreparadas");
        if (contador) {
          contador.textContent = totalPreparadas;
        }
      }

      function renderizarListaMagiasNivel(nivel) {
        const container = obterContainerListaMagias(nivel);
        if (!container) return;

        const magias = lerMagiasNivel(nivel);
        container.replaceChildren();

        if (!magias.length) {
          const vazio = document.createElement("div");
          vazio.className = "magia-vazia";
          vazio.textContent = "Nenhuma magia cadastrada.";
          container.appendChild(vazio);
          return;
        }

        magias.forEach((magia, indice) => {
          const item = document.createElement("div");
          item.className = "magia-item";

          const ehTruque = nivel === 0;
          if (!ehTruque) {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "magia-item-preparada";
            checkbox.checked = !!magia.preparada;
            checkbox.setAttribute(
              "aria-label",
              `Magia preparada: ${magia.nome || "sem nome"}`,
            );
            checkbox.addEventListener("change", () => {
              const registros = lerMagiasNivel(nivel);
              if (!registros[indice]) return;
              registros[indice].preparada = checkbox.checked;
              salvarMagiasNivel(nivel, registros);
              renderizarListaMagiasNivel(nivel);
              atualizarSubAbaMagiasCombate();
              atualizarContadorMagiasPreparadas();
            });
            item.appendChild(checkbox);
          }

          const nome = document.createElement("button");
          nome.type = "button";
          nome.className = "magia-item-nome";
          if (!magia.nome) {
            nome.classList.add("vazia");
            nome.innerHTML = "&nbsp;";
            nome.setAttribute(
              "aria-label",
              `Abrir magia vazia de ${obterRotuloNivelMagia(nivel)}`,
            );
          } else {
            nome.textContent = magia.nome;
          }
          nome.addEventListener("click", () =>
            abrirModalMagia(nivel, indice, "visualizar"),
          );

          const editar = document.createElement("button");
          editar.type = "button";
          editar.className = "magia-item-editar";
          editar.innerHTML = `<span class="magia-item-editar-icone">✏</span><span>Edição</span>`;
          editar.setAttribute(
            "aria-label",
            `Editar magia ${magia.nome || "sem nome"}`,
          );
          editar.addEventListener("click", () =>
            abrirModalMagia(nivel, indice, "editar"),
          );

          item.appendChild(nome);
          item.appendChild(editar);
          container.appendChild(item);
        });

        atualizarContadorMagiasPreparadas();
      }

      function obterMagiasPreparadasCombate() {
        return NIVEIS_MAGIA.flatMap((nivel) =>
          lerMagiasNivel(nivel)
            .map((magia, indice) => ({ ...magia, indiceLista: indice }))
            .filter((magia) => {
              const temNome = String(magia.nome || "").trim();
              if (!temNome) return false;
              const ehTruque = nivel === 0;
              return ehTruque || magia.preparada;
            }),
        ).sort((a, b) => {
          if ((a.nivel ?? 0) !== (b.nivel ?? 0))
            return (a.nivel ?? 0) - (b.nivel ?? 0);
          return String(a.nome || "").localeCompare(
            String(b.nome || ""),
            "pt-BR",
          );
        });
      }

      function atualizarSubAbaMagiasCombate() {
        const container = document.getElementById("subabaCombateMagia");
        if (!container) return;

        const magias = obterMagiasPreparadasCombate();
        container.replaceChildren();
        container.appendChild(criarLinhaStatusMagico());
        const hudConcentracao = criarHudConcentracao();
        if (hudConcentracao) container.appendChild(hudConcentracao);

        atualizarContadorMagiasPreparadas();

        if (!magias.length) {
          const vazio = document.createElement("div");
          vazio.className = "subaba-vazia";
          vazio.textContent = "Nenhuma magia preparada no momento.";
          container.appendChild(vazio);
          return;
        }

        const lista = document.createElement("div");
        lista.className = "magia-combate-lista";

        NIVEIS_MAGIA.forEach((nivelGrupo) => {
          const magiasNivel = magias.filter(
            (magia) => Number(magia.nivel) === nivelGrupo,
          );
          const espaco =
            nivelGrupo > 0 ? obterEstadoEspacoMagia(nivelGrupo) : null;
          const deveMostrarGrupo =
            magiasNivel.length ||
            nivelGrupo === 0 ||
            nivelGrupo === 1 ||
            (espaco && espaco.total > 0);
          if (!deveMostrarGrupo) return;

          const grupo = document.createElement("section");
          grupo.className = "magia-grupo-nivel";
          grupo.dataset.nivel = String(nivelGrupo);

          const header = criarHeaderGrupoMagia(
            nivelGrupo,
            espaco ? `${espaco.restante}/${espaco.total}` : "",
          );
          const corpo = document.createElement("div");
          corpo.className = "magia-grupo-corpo";

          if (!magiasNivel.length) {
            const vazio = document.createElement("div");
            vazio.className = "magia-vazia";
            vazio.textContent = "Nenhuma magia preparada.";
            corpo.appendChild(vazio);
          }

          magiasNivel.forEach((magia) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "magia-combate-item";
            const concentrando = magiaEstaConcentrada(magia);
            item.classList.toggle("concentrando", concentrando);
            item.addEventListener("click", () =>
              abrirModalMagia(magia.nivel, magia.indiceLista, "visualizar", {
                origemCombate: true,
              }),
            );

            const topo = document.createElement("div");
            topo.className = "magia-combate-topo";

            const nome = document.createElement("div");
            nome.className = "magia-combate-nome";
            nome.textContent = magia.nome;

            const nivel = document.createElement("span");
            nivel.className = "magia-card-detalhe-tag magia-combate-nivel";
            nivel.textContent = obterRotuloNivelMagia(magia.nivel);

            topo.appendChild(nome);
            if (concentrando) {
              const indicador = document.createElement("span");
              indicador.className = "magia-combate-concentracao";
              indicador.textContent = "🌀";
              indicador.title = `Você está concentrando na magia ${magia.nome}`;
              topo.appendChild(indicador);
            }
            topo.appendChild(nivel);

            item.appendChild(topo);
            corpo.appendChild(item);
          });

          grupo.appendChild(header);
          grupo.appendChild(corpo);
          lista.appendChild(grupo);
          aplicarEstadoInicialGrupoMagia(
            grupo,
            nivelGrupo === 0 || nivelGrupo === 1 || magiasNivel.length > 0,
          );
        });

        container.appendChild(lista);
      }

      function obterMagiaDoEstadoModal() {
        const magias = lerMagiasNivel(estadoModalMagia.nivel);
        return (
          magias[estadoModalMagia.indice] ||
          criarMagiaPadrao(estadoModalMagia.nivel)
        );
      }

      function preencherFormularioMagia(magia) {
        document.getElementById("magiaModalNome").value = magia.nome || "";
        document.getElementById("magiaModalPreparada").checked =
          !!magia.preparada;
        document.getElementById("magiaModalEscola").value = magia.escola || "";
        document.getElementById("magiaModalTempo").value =
          magia.tempo_conjuracao || "";
        document.getElementById("magiaModalAlcance").value =
          magia.alcance || "";
        document.getElementById("magiaModalDuracao").value =
          magia.duracao || "";
        document.getElementById("magiaModalDescricao").value =
          magia.descricao || "";
        document.getElementById("magiaModalProximosNiveis").value =
          magia.proximos_niveis || "";
        document.getElementById("magiaModalCompVerbal").checked =
          !!magia?.componentes?.verbal;
        document.getElementById("magiaModalCompSomatico").checked =
          !!magia?.componentes?.somatico;
        document.getElementById("magiaModalCompMaterial").checked =
          !!magia?.componentes?.material;
        document.getElementById("magiaModalPropDano").checked =
          !!magia?.propriedades?.dano;
        document.getElementById("magiaModalPropCura").checked =
          !!magia?.propriedades?.cura;
        document.getElementById("magiaModalPropConcentracao").checked =
          !!magia?.propriedades?.concentracao;
        document.getElementById("magiaModalResolucao").value =
          magia.resolucao || "";
        document.getElementById("magiaModalTesteResistencia").value =
          magia.teste_resistencia || "";

        const efeitoDano =
          (magia.efeitos || []).find((efeito) => efeito.tipo === "dano") || {};
        const efeitoCura =
          (magia.efeitos || []).find((efeito) => efeito.tipo === "cura") || {};

        document.getElementById("magiaModalDanoFormula").value =
          efeitoDano.formula || "";
        document.getElementById("magiaModalDanoTipo").value =
          efeitoDano.dano_tipo || "";
        document.getElementById("magiaModalCuraRegra").value =
          efeitoCura.regra || efeitoCura.formula || "";
        atualizarVisibilidadeFormularioMagia();
      }

      function lerFormularioMagia() {
        const danoFormula = document
          .getElementById("magiaModalDanoFormula")
          .value.trim();
        const danoTipo = document
          .getElementById("magiaModalDanoTipo")
          .value.trim();
        const curaRegra = document
          .getElementById("magiaModalCuraRegra")
          .value.trim();
        const resolucao = document.getElementById("magiaModalResolucao").value;
        const propriedades = {
          dano: document.getElementById("magiaModalPropDano").checked,
          cura: document.getElementById("magiaModalPropCura").checked,
          concentracao: document.getElementById("magiaModalPropConcentracao")
            .checked,
        };
        const componentes = {
          verbal: document.getElementById("magiaModalCompVerbal").checked,
          somatico: document.getElementById("magiaModalCompSomatico").checked,
          material: document.getElementById("magiaModalCompMaterial").checked,
        };
        const efeitos = [];

        if (propriedades.dano && (danoFormula || danoTipo || resolucao)) {
          efeitos.push({
            tipo: "dano",
            formula: danoFormula,
            dano_tipo: danoTipo,
            regra: "",
          });
        }

        if (propriedades.cura && curaRegra) {
          efeitos.push({
            tipo: "cura",
            formula: "",
            dano_tipo: "",
            regra: curaRegra,
          });
        }

        return normalizarMagiaRegistro(
          {
            ...obterMagiaDoEstadoModal(),
            nome: document.getElementById("magiaModalNome").value.trim(),
            preparada: document.getElementById("magiaModalPreparada").checked,
            escola: document.getElementById("magiaModalEscola").value.trim(),
            tempo_conjuracao: document
              .getElementById("magiaModalTempo")
              .value.trim(),
            alcance: document.getElementById("magiaModalAlcance").value.trim(),
            duracao: document.getElementById("magiaModalDuracao").value.trim(),
            propriedades,
            componentes,
            resolucao,
            teste_resistencia: document.getElementById(
              "magiaModalTesteResistencia",
            ).value,
            efeitos,
            descricao: document
              .getElementById("magiaModalDescricao")
              .value.trim(),
            proximos_niveis: document
              .getElementById("magiaModalProximosNiveis")
              .value.trim(),
          },
          estadoModalMagia.nivel,
        );
      }

      function atualizarAtaqueMagicoModalMagia() {
        const campo = document.getElementById("magiaModalAtaqueMagico");
        const campoOrigem = document.getElementById("magiaAtaqueMagico");
        if (!campo) return;

        campo.value = campoOrigem?.value || "";
      }

      function atualizarCabecalhoModalMagia(magia = obterMagiaDoEstadoModal()) {
        document.getElementById("magiaModalNivel").textContent =
          obterRotuloNivelMagia(magia?.nivel ?? estadoModalMagia.nivel);
        document.getElementById("magiaModalTitulo").textContent =
          magia?.nome || "Magia";
      }

      function alternarCampoModalMagia(id, exibir) {
        const container = document.getElementById(id);
        if (!container) return;

        container.classList.toggle("oculto", !exibir);
        container.hidden = !exibir;
        container.style.display = exibir ? "flex" : "none";
      }

      function ocultarCamposCondicionaisModalMagia() {
        [
          "magiaModalCampoDanoFormula",
          "magiaModalCampoDanoTipo",
          "magiaModalCampoResolucao",
          "magiaModalCampoCuraRegra",
          "magiaModalCampoAtaqueMagico",
          "magiaModalCampoTesteResistencia",
        ].forEach((id) => alternarCampoModalMagia(id, false));
      }

      function validarFormularioMagia() {
        const nome = document.getElementById("magiaModalNome")?.value.trim();
        const habilitaDano =
          document.getElementById("magiaModalPropDano")?.checked;
        const habilitaCura =
          document.getElementById("magiaModalPropCura")?.checked;
        const danoFormula = document
          .getElementById("magiaModalDanoFormula")
          ?.value.trim();
        const danoTipo = document
          .getElementById("magiaModalDanoTipo")
          ?.value.trim();
        const resolucao = document.getElementById("magiaModalResolucao")?.value;
        const testeResistencia = document.getElementById(
          "magiaModalTesteResistencia",
        )?.value;
        const curaRegra = document
          .getElementById("magiaModalCuraRegra")
          ?.value.trim();

        if (!nome) {
          alert("Informe o nome da magia antes de salvar.");
          document.getElementById("magiaModalNome")?.focus();
          return false;
        }

        if (habilitaDano) {
          if (!resolucao) {
            alert("Escolha como o dano da magia e resolvido.");
            document.getElementById("magiaModalResolucao")?.focus();
            return false;
          }

          if (!danoFormula) {
            alert("Magias com dano precisam de uma formula de dano.");
            document.getElementById("magiaModalDanoFormula")?.focus();
            return false;
          }

          if (!danoTipo) {
            alert("Selecione o tipo de dano da magia.");
            document.getElementById("magiaModalDanoTipo")?.focus();
            return false;
          }

          if (String(resolucao || "").includes("Teste") && !testeResistencia) {
            alert(
              "Selecione o teste de resistencia para magias com dano por salvaguarda.",
            );
            document.getElementById("magiaModalTesteResistencia")?.focus();
            return false;
          }
        }

        if (habilitaCura && !curaRegra) {
          alert("Magias com cura precisam de uma regra ou formula de cura.");
          document.getElementById("magiaModalCuraRegra")?.focus();
          return false;
        }

        return true;
      }

      function atualizarVisibilidadeFormularioMagia() {
        const habilitaDano =
          document.getElementById("magiaModalPropDano")?.checked;
        const habilitaCura =
          document.getElementById("magiaModalPropCura")?.checked;
        const resolucao = document.getElementById("magiaModalResolucao")?.value;
        const danoComResolucao =
          !!habilitaDano && !!String(resolucao || "").trim();

        document
          .getElementById("magiaModalCampoDanoFormula")
          ?.classList.toggle("oculto", !danoComResolucao);
        document
          .getElementById("magiaModalCampoDanoTipo")
          ?.classList.toggle("oculto", !danoComResolucao);
        document
          .getElementById("magiaModalCampoResolucao")
          ?.classList.toggle("oculto", !habilitaDano);
        document
          .getElementById("magiaModalCampoCuraRegra")
          ?.classList.toggle("oculto", !habilitaCura);
        document
          .getElementById("magiaModalCampoAtaqueMagico")
          ?.classList.toggle(
            "oculto",
            !(habilitaDano && resolucao === "Ataque"),
          );
        document
          .getElementById("magiaModalCampoTesteResistencia")
          ?.classList.toggle(
            "oculto",
            !(habilitaDano && resolucao === "Teste de Resistência"),
          );

        alternarCampoModalMagia("magiaModalCampoDanoFormula", danoComResolucao);
        alternarCampoModalMagia("magiaModalCampoDanoTipo", danoComResolucao);
        alternarCampoModalMagia("magiaModalCampoResolucao", !!habilitaDano);
        alternarCampoModalMagia("magiaModalCampoCuraRegra", !!habilitaCura);
        alternarCampoModalMagia(
          "magiaModalCampoAtaqueMagico",
          !!habilitaDano && resolucao === "Ataque",
        );
        alternarCampoModalMagia(
          "magiaModalCampoTesteResistencia",
          !!habilitaDano && String(resolucao || "").includes("Teste"),
        );
        atualizarAtaqueMagicoModalMagia();
      }

      function alternarModoModalMagia(modo) {
        const visualizacao = document.getElementById("magiaModalVisualizacao");
        const formulario = document.getElementById("magiaModalFormulario");
        const botaoEditar = document.getElementById("magiaModalEditar");
        const botaoExcluir = document.getElementById("magiaModalExcluir");
        const botaoSalvar = document.getElementById("magiaModalSalvar");
        const botaoUso = document.getElementById("magiaModalConjurarUsarBtn");

        estadoModalMagia.modo = modo;

        if (visualizacao) {
          visualizacao.hidden = modo !== "visualizar";
          visualizacao.classList.toggle("oculto", modo !== "visualizar");
          visualizacao.style.display = modo === "visualizar" ? "block" : "none";
        }

        if (formulario) {
          formulario.hidden = modo !== "editar";
          formulario.className =
            modo === "editar" ? "magia-formulario" : "magia-formulario oculto";
          formulario.style.display = modo === "editar" ? "flex" : "none";
        }

        botaoEditar?.classList.toggle("oculto", modo !== "visualizar");
        botaoExcluir?.classList.toggle("oculto", modo !== "editar");
        botaoSalvar?.classList.toggle("oculto", modo !== "editar");
        botaoUso?.classList.toggle("oculto", modo !== "visualizar");
      }

      function renderizarVisualizacaoModalMagia(magia) {
        const container = document.getElementById("magiaModalVisualizacao");
        if (!container) return;

        container.replaceChildren();
        container.appendChild(renderizarCardDetalheMagia(magia));
      }

      function abrirModalMagia(
        nivel,
        indice,
        modo = "visualizar",
        opcoes = {},
      ) {
        const overlay = obterModalMagiaOverlay();
        if (!overlay) return;

        ultimoFocoModalMagia =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        estadoModalMagia.nivel = nivel;
        estadoModalMagia.indice = indice;
        estadoModalMagia.origemCombate = !!opcoes.origemCombate;

        const magia = obterMagiaDoEstadoModal();
        atualizarCabecalhoModalMagia(magia);
        preencherFormularioMagia(magia);
        renderizarVisualizacaoModalMagia(magia);
        alternarModoModalMagia(modo);

        overlay.classList.add("ativo");
        overlay.classList.remove("oculto");
        overlay.setAttribute("aria-hidden", "false");
        const destinoFoco =
          modo === "editar"
            ? document.getElementById("magiaModalNome")
            : document.getElementById("magiaModalFechar");
        destinoFoco?.focus();
      }

      function fecharModalMagia() {
        const overlay = obterModalMagiaOverlay();
        if (!overlay) return;

        const focoAtual = document.activeElement;
        if (focoAtual instanceof HTMLElement && overlay.contains(focoAtual)) {
          focoAtual.blur();
        }

        overlay.classList.remove("ativo");
        overlay.classList.add("oculto");
        overlay.setAttribute("aria-hidden", "true");

        if (
          ultimoFocoModalMagia instanceof HTMLElement &&
          document.contains(ultimoFocoModalMagia)
        ) {
          ultimoFocoModalMagia.focus();
        }
        ultimoFocoModalMagia = null;
        estadoModalMagia.origemCombate = false;
      }

      function salvarModalMagia() {
        if (!validarFormularioMagia()) return;

        const magias = lerMagiasNivel(estadoModalMagia.nivel);
        const magia = lerFormularioMagia();

        magias[estadoModalMagia.indice] = magia;
        salvarMagiasNivel(estadoModalMagia.nivel, magias);
        renderizarListaMagiasNivel(estadoModalMagia.nivel);
        atualizarSubAbaMagiasCombate();
        atualizarCabecalhoModalMagia(magia);
        renderizarVisualizacaoModalMagia(magia);
        alternarModoModalMagia("visualizar");
      }

      function excluirMagiaAtual() {
        const magias = lerMagiasNivel(estadoModalMagia.nivel);
        if (
          estadoModalMagia.indice === null ||
          !magias[estadoModalMagia.indice]
        )
          return;

        const magia = magias[estadoModalMagia.indice];
        if (!confirm(`Excluir a magia "${magia?.nome || "sem nome"}"?`)) return;

        magias.splice(estadoModalMagia.indice, 1);
        salvarMagiasNivel(estadoModalMagia.nivel, magias);
        renderizarListaMagiasNivel(estadoModalMagia.nivel);
        atualizarSubAbaMagiasCombate();
        fecharModalMagia();
      }

      function adicionarNovaMagia(nivel) {
        const magias = lerMagiasNivel(nivel);
        magias.push(criarMagiaPadrao(nivel));
        salvarMagiasNivel(nivel, magias);
        renderizarListaMagiasNivel(nivel);
        atualizarSubAbaMagiasCombate();
        abrirModalMagia(nivel, magias.length - 1, "editar");
      }

      function atualizarMagias() {
        sincronizarCamposMagia();

        const campoAtributo = document.getElementById(
          "magiaAtributoConjuracao",
        );
        const campoCD = document.getElementById("magiaCD");
        const campoAtaque = document.getElementById("magiaAtaqueMagico");

        if (!campoAtributo || !campoCD || !campoAtaque) return;

        let chave = (campoAtributo.value || "").toLowerCase();

        // extrai 'for' ou 'des' mesmo se vier "FOR (+3)"
        if (chave.includes("des")) chave = "des";
        else if (chave.includes("for")) chave = "for";
        else chave = "for"; // fallback seguro

        const modificadorBase = getModificadorBaseAtributo(chave);
        if (modificadorBase === null) {
          campoCD.value = "";
          campoAtaque.value = "";
          return;
        }

        const bonusProf = getBonusProf();
        const cd = 8 + bonusProf + modificadorBase;
        const ataque = bonusProf + modificadorBase;

        campoCD.value = cd;
        campoAtaque.value = (ataque >= 0 ? "+" : "") + ataque;
        atualizarContadorMagiasPreparadas();
        renderizarTodasMagias();
      }

      function sincronizarClasseNivel(usarValorLegado = false) {
        const campoCompleto = document.getElementById("classeID");
        const campoNome = document.getElementById("classeNomeID");
        const campoNivel = document.getElementById("classeNivelID");

        if (!campoCompleto || !campoNome || !campoNivel) return;

        const nivelPadrao = campoNivel.defaultValue || "1";
        const podeMigrarLegado =
          !campoNome.value.trim() &&
          (!campoNivel.value.trim() || campoNivel.value.trim() === nivelPadrao);

        if (usarValorLegado && campoCompleto.value && podeMigrarLegado) {
          const match = campoCompleto.value.match(/^(.*?)(?:\s+NV\s+(\d+))?$/i);

          if (match) {
            campoNome.value = match[1].trim();
            campoNivel.value = match[2] || nivelPadrao;
          }
        }

        const nome = campoNome.value.trim();
        const nivel = campoNivel.value.trim();
        campoCompleto.value = [nome, nivel ? `NV ${nivel}` : ""]
          .filter(Boolean)
          .join(" ");
        atualizarSubclasse();
      }

      function sincronizarResumoCaracteristicas(forcar = false) {
        const mapeamentos = [
          { origem: "classeNomeID", destino: "talentoClasseResumo" },
          { origem: "racaID", destino: "talentoRacaResumo" },
          { origem: "antecedenteID", destino: "talentoAntecedenteResumo" },
        ];

        mapeamentos.forEach(({ origem, destino }) => {
          const campoOrigem = document.getElementById(origem);
          const campoDestino = document.getElementById(destino);

          if (!campoOrigem || !campoDestino) return;

          const valorBase = campoOrigem.value.trim();
          if (destino === "talentoClasseResumo") {
            const nivel = String(
              document.getElementById("classeNivelID")?.value || "",
            ).trim();
            campoDestino.textContent =
              valorBase && nivel ? `${valorBase} Nv${nivel}` : valorBase;
            return;
          }

          if (destino === "talentoRacaResumo") {
            campoDestino.textContent = obterResumoRacaCompleto();
            return;
          }

          campoDestino.textContent = valorBase;
        });

        const campoSubclasse = document.getElementById("subclasse");
        const campoSubclasseResumo = document.getElementById(
          "talentoArquetipoResumo",
        );
        const secaoSubclasse = document.getElementById("talentoSubclasseSecao");
        const containerSubclasse =
          document.getElementById("containerSubclasse");

        if (campoSubclasse && campoSubclasseResumo && secaoSubclasse) {
          const subclasseDisponivel =
            !!containerSubclasse &&
            !containerSubclasse.classList.contains("hidden");
          secaoSubclasse.classList.toggle("hidden", !subclasseDisponivel);

          if (subclasseDisponivel) {
            const valorResumo = campoSubclasse.value.trim();
            if ("value" in campoSubclasseResumo) {
              campoSubclasseResumo.value = valorResumo;
            } else {
              campoSubclasseResumo.textContent = valorResumo;
            }
          } else {
            if ("value" in campoSubclasseResumo) {
              campoSubclasseResumo.value = "";
            } else {
              campoSubclasseResumo.textContent = "";
            }
          }
        }
      }

      function sincronizarAtributosComSalvaguardas() {
        ["for", "des", "con", "int", "sab", "car"].forEach((atributo) => {
          const campoAtrib = document.getElementById("atrib_" + atributo);
          const atributoBase = document.getElementById(atributo);

          if (!campoAtrib || !atributoBase) return;

          let valor = parseInt(campoAtrib.value) || 0;

          if (valor > 20) valor = 20;
          if (valor < 0) valor = 0;

          campoAtrib.value = valor;
          atributoBase.value = valor;
        });
      }

      function sincronizarSalvaguardasComAtributosBase() {
        ["for", "des", "con", "int", "sab", "car"].forEach((atributo) => {
          const campoAtrib = document.getElementById("atrib_" + atributo);
          const atributoBase = document.getElementById(atributo);

          if (!campoAtrib || !atributoBase) return;

          let valor = parseInt(atributoBase.value, 10) || 0;

          if (valor > 20) valor = 20;
          if (valor < 0) valor = 0;

          atributoBase.value = valor;
          campoAtrib.value = valor;
        });
      }
      //atualiza as pericias com base nos atributos e proficiencia
      function atualizarPericias() {
        const bonusProf = getBonusProf();

        document.querySelectorAll(".pericia-linha").forEach((pericia) => {
          const atributo = pericia.dataset.atributo;
          const checkbox = pericia.querySelector('input[type="checkbox"]');
          const campoValor = pericia.querySelector(".pericia-valor");
          const valorBase =
            parseInt(document.getElementById("atrib_" + atributo)?.value) || 0;
          const modificadorBase = Math.floor((valorBase - 10) / 2);
          const total = modificadorBase + (checkbox?.checked ? bonusProf : 0);

          campoValor.value = (total >= 0 ? "+" : "") + total;
        });
      }

      function atualizarPassivas() {
        const bonusProf = getBonusProf();
        const sabValor =
          parseInt(document.getElementById("atrib_sab")?.value) || 0;
        const sabMod = Math.floor((sabValor - 10) / 2);
        const sabProf = document.getElementById("prof_salv_sab")?.checked
          ? bonusProf
          : 0;
        const percepcao =
          parseInt(document.getElementById("periciaPercepcaoValor")?.value) ||
          0;
        const intuicao =
          parseInt(document.getElementById("periciaIntuicaoValor")?.value) || 0;

        document.getElementById("sabPass").value = 10 + sabMod + sabProf;
        document.getElementById("perPass").value = 10 + percepcao;
        document.getElementById("intPass").value = 10 + intuicao;
      }
    
