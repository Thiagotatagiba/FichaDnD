
      // ===== Classe de armadura e resumo de combate =====
      function atualizarClasseArmaduraEquipada() {
        const armaduraCA =
          parseInt(document.getElementById("armaduraCA")?.value) || 0;
        const outrosCA =
          parseInt(document.getElementById("outroEquipadoCA")?.value) || 0;
        const escudoCA =
          parseInt(document.getElementById("escudoCA")?.value) || 0;

        const campoCA = document.getElementById("ca_valor");
        const emojiEscudo = document.getElementById("ca_escudo_emoji");

        if (campoCA) campoCA.value = armaduraCA + outrosCA + escudoCA;
        if (emojiEscudo) emojiEscudo.classList.toggle("ativo", escudoCA > 0);
        atualizarResumoAtaquesConjuracao();
      }

      function formatarCA(valor) {
        const numero = parseInt(valor) || 0;
        return "+" + numero;
      }

      function aplicarFormatoCA(id) {
        const campo = document.getElementById(id);
        if (!campo) return;

        const valor = parseInt(campo.value) || 0;

        if (id === "escudoCA") {
          campo.value = formatarCA(valor);
          return;
        }

        campo.value = valor;
      }

      function atualizarResumoAtaquesConjuracao() {
        const caBase =
          parseInt(document.getElementById("ca_valor")?.value) || 0;
        const caEscudo =
          parseInt(document.getElementById("escudoCA")?.value) || 0;
        const pvAtual =
          parseInt(document.getElementById("pvAtual")?.value) || 0;

        const campoAtaqueCA = document.getElementById("ataqueCaTotal");
        const campoAtaqueEscudo = document.getElementById("ataqueCaEscudo");
        const emojiAtaqueEscudo = document.getElementById(
          "ataqueCaEscudoEmoji",
        );
        const campoAtaquePV = document.getElementById("ataquePvAtual");

        if (campoAtaqueCA) campoAtaqueCA.value = caBase;
        if (campoAtaqueEscudo) campoAtaqueEscudo.value = formatarCA(caEscudo);
        if (emojiAtaqueEscudo)
          emojiAtaqueEscudo.classList.toggle("ativo", caEscudo > 0);
        if (campoAtaquePV) campoAtaquePV.textContent = "PV " + pvAtual;
      }

      const estadoAtaqueArma = {
        arma: null,
        dado: null,
        totalAtaque: 0,
        modBase: 0,
        bonusProf: 0,
        rotuloAtributo: "",
        textoResumo: "",
        tipoAcao: "Ação",
        historicoRolagens: [],
        historicoRolagensDano: [],
        danoQtd: 1,
        danoFaces: 0,
        danoFormula: "",
        danoModBase: 0,
        ultimaRolagemDano: null,
        origem: "arma",
        magia: null,
        nivelSlot: null,
        danoTipo: "",
        infoCD: "",
      };

      const estadoCombateIniciativa = {
        ativo: false,
        rodada: 0,
        posicao: null,
        iniciativa: null,
      };

      const estadoModalIniciativa = {
        dado: null,
        bonus: 0,
        total: null,
        historicoRolagens: [],
      };

      function obterEstadoCombateParaSalvar() {
        return JSON.parse(JSON.stringify(estadoCombateIniciativa));
      }

      const ATRIBUTOS_TESTE_RESISTENCIA = [
        "for",
        "des",
        "con",
        "int",
        "sab",
        "car",
      ];
      const estadoTesteResistencia = {
        atributo: "for",
        dadoSistema: null,
        contextoConcentracao: null,
      };

      function obterBonusTesteResistencia(chaveAtributo) {
        const chave = String(chaveAtributo || "").toLowerCase();
        const campoSalvaguarda = document.getElementById("salv_" + chave);
        const bonusSalvaguarda = parseInt(
          String(campoSalvaguarda?.value || "").replace(/\+/g, ""),
          10,
        );
        if (Number.isInteger(bonusSalvaguarda)) return bonusSalvaguarda;

        return getModificadorBaseAtributo(chave) || 0;
      }

      function obterRotuloAtributoTesteResistencia(chaveAtributo) {
        return String(chaveAtributo || "").toUpperCase();
      }

      function garantirSistemaDadoTesteResistencia() {
        if (estadoTesteResistencia.dadoSistema)
          return estadoTesteResistencia.dadoSistema;

        const container = document.getElementById(
          "modalTesteResistenciaDadoContainer",
        );
        if (!container || typeof criarSistemaDado !== "function") return null;

        estadoTesteResistencia.dadoSistema = criarSistemaDado(container, {
          titulo: "Rolagem D20",
          nota: "1d20",
          quantidade: 1,
          faces: 20,
          bonus: 0,
          rotuloDado: "Dado",
          rotuloBonus: "(FOR)",
          textoBotao: "Rolar",
          onChange: atualizarBotaoConfirmarTesteResistencia,
        });

        const campoDado = container.querySelector("[data-dice-value]");
        if (campoDado) {
          campoDado.id = "modalTesteResistenciaDado";
          campoDado.min = "1";
          campoDado.max = "20";
          campoDado.inputMode = "numeric";
          campoDado.setAttribute(
            "aria-label",
            "Dado tirado no teste de resistência",
          );
        }

        return estadoTesteResistencia.dadoSistema;
      }

      function atualizarAtributosTesteResistencia() {
        ATRIBUTOS_TESTE_RESISTENCIA.forEach((chave) => {
          const bonus = obterBonusTesteResistencia(chave);
          const campoModificador = document.querySelector(
            `[data-modificador-teste="${chave}"]`,
          );
          if (campoModificador)
            campoModificador.textContent = `(${formatarBonusAtaqueModal(bonus)})`;
        });

        selecionarAtributoTesteResistencia(
          estadoTesteResistencia.atributo || "for",
        );
      }

      function selecionarAtributoTesteResistencia(chaveAtributo) {
        const chaveForcada = estadoTesteResistencia.contextoConcentracao
          ? "con"
          : chaveAtributo;
        const chave = ATRIBUTOS_TESTE_RESISTENCIA.includes(chaveForcada)
          ? chaveForcada
          : "for";
        estadoTesteResistencia.atributo = chave;

        document.querySelectorAll("[data-atributo-teste]").forEach((botao) => {
          const ativo = botao.dataset.atributoTeste === chave;
          botao.classList.toggle("ativo", ativo);
          botao.setAttribute("aria-pressed", ativo ? "true" : "false");
          botao.disabled =
            !!estadoTesteResistencia.contextoConcentracao &&
            botao.dataset.atributoTeste !== "con";
        });

        const bonus = obterBonusTesteResistencia(chave);
        const sistema = garantirSistemaDadoTesteResistencia();
        sistema?.setBonus(bonus);

        const detalheBonus = document.querySelector(
          "#modalTesteResistenciaDadoContainer .dado-modal-bonus-detalhe",
        );
        if (detalheBonus)
          detalheBonus.textContent = `(${obterRotuloAtributoTesteResistencia(chave)})`;

        atualizarBotaoConfirmarTesteResistencia();
      }

      function obterDadoTesteResistencia() {
        const sistema = estadoTesteResistencia.dadoSistema;
        const dado = sistema?.getValor();
        return Number.isInteger(dado) && dado >= 1 && dado <= 20 ? dado : null;
      }

      function obterTotalTesteResistencia() {
        const dado = obterDadoTesteResistencia();
        if (dado === null) return null;
        return (
          dado + obterBonusTesteResistencia(estadoTesteResistencia.atributo)
        );
      }

      function atualizarBotaoConfirmarTesteResistencia() {
        const botao = document.getElementById("modalTesteResistenciaConfirmar");
        if (!botao) return;

        const total = obterTotalTesteResistencia();
        botao.textContent = Number.isInteger(total)
          ? `Confirmar (${total})`
          : "Confirmar";

        const campoTotal = document.querySelector(
          "#modalTesteResistenciaDadoContainer [data-dice-total]",
        );
        if (campoTotal) {
          campoTotal.innerHTML = `Total: <strong>${Number.isInteger(total) ? total : "-"}</strong>`;
        }
      }

      function abrirModalTesteResistencia(opcoes = {}) {
        const overlay = document.getElementById("modalTesteResistenciaOverlay");
        const sistema = garantirSistemaDadoTesteResistencia();
        if (!overlay || !sistema) return;

        estadoTesteResistencia.contextoConcentracao =
          opcoes.contextoConcentracao || null;
        estadoTesteResistencia.atributo =
          opcoes.atributo || estadoTesteResistencia.atributo || "for";

        const titulo = document.getElementById("modalTesteResistenciaTitulo");
        if (titulo)
          titulo.textContent = opcoes.titulo || "Teste de Resistência";

        atualizarAtributosTesteResistencia();
        selecionarAtributoTesteResistencia(estadoTesteResistencia.atributo);
        sistema.setValor("");
        atualizarBotaoConfirmarTesteResistencia();

        overlay.classList.remove("oculto");
        overlay.classList.add("ativo");
        overlay.setAttribute("aria-hidden", "false");

        document.getElementById("modalTesteResistenciaDado")?.focus();
      }

      function fecharModalTesteResistencia() {
        const overlay = document.getElementById("modalTesteResistenciaOverlay");
        if (!overlay) return;

        overlay.classList.remove("ativo");
        overlay.classList.add("oculto");
        overlay.setAttribute("aria-hidden", "true");
        estadoTesteResistencia.contextoConcentracao = null;

        const titulo = document.getElementById("modalTesteResistenciaTitulo");
        if (titulo) titulo.textContent = "Teste de Resistência";
      }

      function confirmarTesteResistencia() {
        const dado = obterDadoTesteResistencia();
        const campoDado = document.getElementById("modalTesteResistenciaDado");
        if (dado === null) {
          campoDado?.focus();
          return;
        }

        const atributo = obterRotuloAtributoTesteResistencia(
          estadoTesteResistencia.atributo,
        );
        const bonus = obterBonusTesteResistencia(
          estadoTesteResistencia.atributo,
        );
        const total = dado + bonus;
        const sinal = bonus >= 0 ? "+" : "-";
        const valor = `${dado} ${sinal} ${Math.abs(bonus)} = ${total}`;
        const contextoConcentracao =
          estadoTesteResistencia.contextoConcentracao;

        if (contextoConcentracao) {
          const sucesso = total >= contextoConcentracao.cd;
          const magia = contextoConcentracao.magia;
          const nome = obterNomeConcentracao(magia);

          adicionarRegistroHistoricoCombate(
            "Concentração",
            `${sucesso ? "mantida" : "perdida"}: ${nome} (CD ${contextoConcentracao.cd}, ${valor})`,
            sucesso ? "✔" : "❌",
            "",
            {
              timeline: {
                simples: true,
                exibirBadge: false,
                texto: `${sucesso ? "✔" : "❌"} Concentração ${sucesso ? "Mantida" : "Perdida"}`,
              },
            },
          );

          if (sucesso) {
            ultimoResultadoConcentracao = "sucesso";
            atualizarSubAbaMagiasCombate();
          } else if (concentracaoAtiva?.chave === contextoConcentracao.chave) {
            encerrarConcentracao("perdida", { registrarHistorico: false });
          }

          fecharModalTesteResistencia();
          return;
        }

        adicionarRegistroHistoricoCombate(
          "Teste de Resistência",
          `(${atributo}): ${valor}`,
          obterIconeAtributoAtaque(atributo),
          "",
          {
            timeline: {
              simples: true,
              exibirBadge: false,
              texto: `${obterIconeAtributoAtaque(atributo)} Teste de Resistência ${atributo}: ${valor}`,
            },
          },
        );

        fecharModalTesteResistencia();
      }

      function abrirItemCard(card) {
        if (!card) return;
        card.classList.remove("fechado", "oculto");
        const icon = card.querySelector(".item-toggle");
        if (icon) icon.textContent = "🔼";
      }

      function fecharItemCard(card) {
        if (
          !card ||
          card.id === "armaModelo" ||
          card.id === "armaduraModelo" ||
          card.id === "escudoModelo" ||
          card.id === "outroModelo"
        )
          return;
        card.classList.add("fechado");
        const icon = card.querySelector(".item-toggle");
        if (icon) icon.textContent = "🔽";
      }

      function atualizarTitulosInventario() {
        const contarItensPreenchidos = (seletor, campoNome) =>
          Array.from(document.querySelectorAll(seletor)).filter((card) =>
            card.querySelector(campoNome)?.value?.trim(),
          ).length;

        const contagens = {
          inventarioTituloArmas: {
            emoji: "⚔️",
            nome: "Armas",
            total: contarItensPreenchidos(
              '#listaArmas .item-card[data-tipo="arma"]',
              '[data-campo="nome"]',
            ),
          },
          inventarioTituloArmaduras: {
            emoji: "👕",
            nome: "Armaduras",
            total: contarItensPreenchidos(
              '#listaArmaduras .item-card[data-tipo="armadura"]',
              '[data-campo="armadura_nome"]',
            ),
          },
          inventarioTituloEscudos: {
            emoji: "🛡️",
            nome: "Escudos e Vestimentos",
            total: contarItensPreenchidos(
              '#listaEscudos .item-card[data-tipo="escudo"]',
              '[data-campo="escudo_nome"]',
            ),
          },
          inventarioTituloOutros: {
            emoji: "📦",
            nome: "Outros",
            total: contarItensPreenchidos(
              '#listaOutros .item-card[data-tipo="outro"]',
              '[data-campo="outro_nome"]',
            ),
          },
        };

        Object.entries(contagens).forEach(([id, info]) => {
          const titulo = document.getElementById(id);
          if (titulo)
            titulo.textContent = `${info.emoji} ${info.nome} ${info.total}`;
        });
      }

      function atualizarCamposMagicosItem(card) {
        if (!card) return;

        const checkboxMagico = card.querySelector(".item-flag-magico");
        const containerSintonizado = card.querySelector(
          ".item-sintonizado-container",
        );
        const checkboxSintonizado = card.querySelector(
          ".item-flag-sintonizado",
        );

        if (!checkboxMagico || !containerSintonizado || !checkboxSintonizado)
          return;

        const exibirSintonizado = checkboxMagico.checked;
        card.classList.toggle("item-magico-ativo", exibirSintonizado);
        containerSintonizado.classList.toggle("oculto", !exibirSintonizado);
        if (!exibirSintonizado) checkboxSintonizado.checked = false;
      }

      function inicializarCamposCompartilhadosItem(card, prefixo) {
        if (!card) return;

        const checkboxMagico = card.querySelector(".item-flag-magico");
        const checkboxSintonizado = card.querySelector(
          ".item-flag-sintonizado",
        );

        if (
          checkboxMagico &&
          checkboxMagico.dataset.listenerItemMagico !== "true"
        ) {
          checkboxMagico.addEventListener("change", () => {
            atualizarCamposMagicosItem(card);
            atualizarListaArmasEquipamento();
          });
          checkboxMagico.dataset.listenerItemMagico = "true";
        }

        if (
          checkboxSintonizado &&
          checkboxSintonizado.dataset.listenerItemSintonizado !== "true"
        ) {
          checkboxSintonizado.addEventListener(
            "change",
            atualizarListaArmasEquipamento,
          );
          checkboxSintonizado.dataset.listenerItemSintonizado = "true";
        }

        atualizarCamposMagicosItem(card);
      }

      function coletarFlagsCompartilhadasItem(card, destino, prefixo) {
        destino[`${prefixo}_item_magico`] =
          !!card.querySelector(".item-flag-magico")?.checked;
        destino[`${prefixo}_sintonizado`] = !!card.querySelector(
          ".item-flag-sintonizado",
        )?.checked;
      }

      function aplicarFlagsCompartilhadasItem(card, dadosItem, prefixo) {
        if (!card || !dadosItem) return;
        const checkboxMagico = card.querySelector(".item-flag-magico");
        const checkboxSintonizado = card.querySelector(
          ".item-flag-sintonizado",
        );

        if (checkboxMagico)
          checkboxMagico.checked = !!dadosItem[`${prefixo}_item_magico`];
        if (checkboxSintonizado)
          checkboxSintonizado.checked = !!dadosItem[`${prefixo}_sintonizado`];
        atualizarCamposMagicosItem(card);
      }

      function obterResumoBonusAtaqueArma(arma) {
        if (arma?.tipo === "magia" && arma.calculoMagia) {
          return arma.calculoMagia;
        }
        return getResumoCalculoAtaque(arma, arma?.ataque);
      }

      function obterSubtituloModalAtaque(arma) {
        return (
          limparPrefixoPropriedade(arma?.propriedade || "") ||
          "Sem propriedades"
        );
      }

      function obterIconeAtributoAtaque(rotuloAtributo) {
        if (rotuloAtributo === "FOR") return "💪";
        if (rotuloAtributo === "DES") return "🏹";
        if (rotuloAtributo === "CON") return "❤️";
        if (rotuloAtributo === "INT") return "🧠";
        if (rotuloAtributo === "SAB") return "👁️";
        if (rotuloAtributo === "CAR") return "🗣️";
        return "✨";
      }

      function obterTooltipAtributoAtaque(rotuloAtributo) {
        const mapa = {
          FOR: "Modificador de Força",
          DES: "Modificador de Destreza",
          CON: "Modificador de Constituição",
          INT: "Modificador de Inteligência",
          SAB: "Modificador de Sabedoria",
          CAR: "Modificador de Carisma",
        };
        return mapa[rotuloAtributo] || "Modificador de atributo";
      }

      function formatarBonusAtaqueModal(valor) {
        const numero = parseInt(valor, 10) || 0;
        return (numero >= 0 ? "+" : "") + numero;
      }

      function atualizarDetalheDadoAtaqueModal() {
        const campoDetalhe = document.getElementById("modalAtaqueDadoDetalhe");
        if (!campoDetalhe) return;

        const historico = Array.isArray(estadoAtaqueArma.historicoRolagens)
          ? estadoAtaqueArma.historicoRolagens
          : [];
        const ultimo = historico[historico.length - 1];
        campoDetalhe.textContent = Number.isInteger(ultimo)
          ? `[${ultimo}]`
          : "1d20";
      }

      function atualizarDetalheBonusAtaqueModal() {
        const campoBonus = document.getElementById("modalAtaqueBonus");
        const campoDetalhe = document.getElementById("modalAtaqueBonusDetalhe");
        if (!campoBonus || !campoDetalhe) return;

        const modBase = estadoAtaqueArma.modBase || 0;
        const bonusProf = estadoAtaqueArma.bonusProf || 0;
        const iconeAtributo = obterIconeAtributoAtaque(
          estadoAtaqueArma.rotuloAtributo,
        );

        campoBonus.textContent = formatarBonusAtaqueModal(modBase + bonusProf);
        campoDetalhe.textContent = `(${modBase}${iconeAtributo} + ${bonusProf}🅿️)`;
      }

      function atualizarDetalheDadoDanoModal() {
        const campoDetalhe = document.getElementById(
          "modalAtaqueResultadosDano",
        );
        if (!campoDetalhe) return;

        const resultados = estadoAtaqueArma.ultimaRolagemDano;
        if (Array.isArray(resultados) && resultados.length) {
          campoDetalhe.textContent = "[" + resultados.join(", ") + "]";
          return;
        }

        campoDetalhe.textContent = estadoAtaqueArma.danoFormula || "dano";
      }

      function obterBonusDanoEfetivoModalAtaque() {
        if (estadoAtaqueArma.origem === "magia") {
          return estadoAtaqueArma.danoModBase || 0;
        }
        return estadoAtaqueArma.tipoAcao === "Ação bônus"
          ? 0
          : estadoAtaqueArma.danoModBase || 0;
      }

      function atualizarDetalheBonusDanoModal() {
        const campoBonus = document.getElementById("modalAtaqueBonusDano");
        const campoDetalhe = document.getElementById(
          "modalAtaqueBonusDanoDetalhe",
        );
        if (!campoBonus || !campoDetalhe) return;

        const modBase = obterBonusDanoEfetivoModalAtaque();
        const iconeAtributo = obterIconeAtributoAtaque(
          estadoAtaqueArma.rotuloAtributo,
        );

        campoBonus.textContent = formatarBonusAtaqueModal(modBase);
        campoDetalhe.textContent =
          estadoAtaqueArma.origem === "magia"
            ? `(${estadoAtaqueArma.arma?.danoBonusRotuloMagia || "magia"})`
            : estadoAtaqueArma.tipoAcao === "Ação bônus"
              ? "(sem MOD)"
              : `(${modBase}${iconeAtributo})`;
      }

      function parsearFormulaDano(formula) {
        if (!formula || typeof formula !== "string")
          return { qtd: 1, faces: 0 };
        const match = formula.trim().match(/(\d+)d(\d+)/i);
        if (!match) return { qtd: 1, faces: 0 };
        return { qtd: parseInt(match[1], 10), faces: parseInt(match[2], 10) };
      }

      function extrairFormulaDadoDano(formula) {
        if (!formula || typeof formula !== "string") return "";
        const match = formula.trim().match(/\d+d\d+/i);
        return match ? match[0] : formula.trim();
      }

      function obterFormulaDanoAtual(arma) {
        if (!arma) return "";
        const formula = arma.danoFormula || arma.dano || arma.arma_dano || "";
        if (typeof formula === "string") return extrairFormulaDadoDano(formula);
        return "";
      }

      function preencherCampoComRolagem(campo, quantidade, faces) {
        if (!campo) return null;
        const rolagem = rolarDado(quantidade, faces);
        if (!rolagem.resultados.length) return null;

        campo.value = rolagem.soma;
        campo.dispatchEvent(new Event("input"));
        campo.dispatchEvent(new Event("change"));
        return rolagem;
      }

      function atualizarTotalModalAtaque() {
        const campoTotal = document.getElementById("modalAtaqueTotal");
        const campoDado = document.getElementById("modalAtaqueDado");
        if (!campoTotal || !campoDado) return;

        const dado = parseInt(campoDado.value, 10);
        if (!Number.isInteger(dado) || dado < 1 || dado > 20) {
          campoTotal.innerHTML = "Total: <strong>-</strong>";
          return;
        }

        const total =
          dado +
          (estadoAtaqueArma.modBase || 0) +
          (estadoAtaqueArma.bonusProf || 0);
        campoTotal.innerHTML = `Total: <strong>${total}</strong>`;
      }

      function atualizarHistoricoRolagensModalAtaque() {
        const campoHistorico = document.getElementById(
          "modalAtaqueHistoricoLista",
        );
        if (!campoHistorico) return;

        const historicoOriginal = Array.isArray(
          estadoAtaqueArma.historicoRolagens,
        )
          ? estadoAtaqueArma.historicoRolagens
          : [];

        const historico = [...historicoOriginal].reverse();
        if (!historico.length) {
          campoHistorico.textContent = "-";
          return;
        }

        const maior = Math.max(...historicoOriginal);
        const menor = Math.min(...historicoOriginal);

        campoHistorico.innerHTML = historico
          .map((valor) => {
            const ehMaior = valor === maior;
            const ehMenor = valor === menor;
            const sufixo = ehMaior ? "⇧" : ehMenor ? "⇩" : "";
            return criarBotaoHistoricoDado(valor, sufixo, ehMaior || ehMenor);
          })
          .join(", ");
      }

      function atualizarTotalModalDano() {
        const campoTotal = document.getElementById("modalAtaqueTotalDano");
        const campoDano = document.getElementById("modalAtaqueDano");
        if (!campoTotal || !campoDano) return;

        const danoRolado = parseInt(campoDano.value, 10);
        if (!Number.isInteger(danoRolado) || danoRolado < 0) {
          campoTotal.innerHTML = "Total: <strong>-</strong>";
          return;
        }

        const total = danoRolado + obterBonusDanoEfetivoModalAtaque();
        campoTotal.innerHTML = "Total: <strong>" + total + "</strong>";
      }

      function atualizarHistoricoRolagensModalDano() {
        const campoHistorico = document.getElementById(
          "modalAtaqueHistoricoDano",
        );
        if (!campoHistorico) return;

        const historicoOriginal = Array.isArray(
          estadoAtaqueArma.historicoRolagensDano,
        )
          ? estadoAtaqueArma.historicoRolagensDano
          : [];

        const historico = [...historicoOriginal].reverse();
        if (!historico.length) {
          campoHistorico.textContent = "-";
          return;
        }

        const maior = Math.max(...historicoOriginal);
        const menor = Math.min(...historicoOriginal);

        campoHistorico.innerHTML = historico
          .map((valor) => {
            const ehMaior = valor === maior;
            const ehMenor = valor === menor;
            const sufixo = ehMaior ? "⇧" : ehMenor ? "⇩" : "";
            return criarBotaoHistoricoDado(valor, sufixo, ehMaior || ehMenor);
          })
          .join(", ");
      }

      function registrarRolagemModalDano(rolagem) {
        if (!rolagem?.resultados?.length) return;
        const valor = rolagem.soma;
        estadoAtaqueArma.historicoRolagensDano = Array.isArray(
          estadoAtaqueArma.historicoRolagensDano,
        )
          ? [...estadoAtaqueArma.historicoRolagensDano, valor]
          : [valor];
        estadoAtaqueArma.ultimaRolagemDano = rolagem.resultados;
        atualizarResultadosDano();
        atualizarHistoricoRolagensModalDano();
      }

      function atualizarResultadosDano() {
        const campoResultados = document.getElementById(
          "modalAtaqueResultadosDano",
        );
        if (!campoResultados) return;

        const resultados = estadoAtaqueArma.ultimaRolagemDano;
        if (!Array.isArray(resultados) || !resultados.length) {
          campoResultados.textContent = "";
          atualizarDetalheDadoDanoModal();
          return;
        }

        campoResultados.textContent = "[" + resultados.join(", ") + "]";
      }

      function registrarRolagemModalAtaque(rolagem) {
        if (!rolagem?.resultados?.length) return;
        const valor = rolagem.resultados[0];
        estadoAtaqueArma.historicoRolagens = Array.isArray(
          estadoAtaqueArma.historicoRolagens,
        )
          ? [...estadoAtaqueArma.historicoRolagens, valor]
          : [valor];
        atualizarDetalheDadoAtaqueModal();
        atualizarHistoricoRolagensModalAtaque();
      }

      function atualizarEstadoCriticoModalAtaque() {
        const campoDado = document.getElementById("modalAtaqueDado");
        const botaoSucesso = document.getElementById("modalAtaqueSucesso");
        const botaoFracasso = document.getElementById("modalAtaqueFracasso");
        if (!campoDado || !botaoSucesso || !botaoFracasso) return;

        const dado = parseInt(campoDado.value, 10);
        botaoSucesso.classList.toggle("ataque-botao-critico", dado === 20);
        botaoFracasso.classList.toggle(
          "ataque-botao-fracasso-critico",
          dado === 1,
        );
        atualizarTotalModalAtaque();
      }

      function obterBonusIniciativaAtual() {
        const valor = document.getElementById("iniciativa")?.value ?? "";
        const bonus = parseInt(String(valor).replace(/[^\d-]/g, ""), 10);
        return Number.isInteger(bonus) ? bonus : 0;
      }

      function atualizarTotalModalIniciativa() {
        const campoDado = document.getElementById("modalIniciativaDado");
        const campoBonus = document.getElementById("modalIniciativaBonus");
        const campoTotal = document.querySelector(
          "#modalIniciativaTotal strong",
        );
        const campoFormula = document.getElementById("modalIniciativaFormula");
        const campoSubtitulo = document.getElementById(
          "modalIniciativaSubtitulo",
        );
        const bonus = obterBonusIniciativaAtual();
        const dado = parseInt(campoDado?.value, 10);
        const total = Number.isInteger(dado) ? dado + bonus : null;
        const textoBonus = `${bonus >= 0 ? "+" : ""}${bonus}`;

        estadoModalIniciativa.dado = Number.isInteger(dado) ? dado : null;
        estadoModalIniciativa.bonus = bonus;
        estadoModalIniciativa.total = total;

        if (campoBonus) campoBonus.textContent = textoBonus;
        if (campoTotal) campoTotal.textContent = total === null ? "-" : total;
        if (campoFormula) campoFormula.textContent = `1d20 ${textoBonus}`;
        if (campoSubtitulo) {
          campoSubtitulo.textContent = `1d20 ${textoBonus}`;
        }
      }

      function atualizarHistoricoRolagensModalIniciativa() {
        const campoHistorico = document.getElementById(
          "modalIniciativaHistoricoLista",
        );
        if (!campoHistorico) return;

        const historico = Array.isArray(estadoModalIniciativa.historicoRolagens)
          ? [...estadoModalIniciativa.historicoRolagens]
          : [];

        if (!historico.length) {
          campoHistorico.textContent = "-";
          return;
        }

        const maior = Math.max(...historico);
        const menor = Math.min(...historico);
        campoHistorico.innerHTML = [...historico]
          .reverse()
          .map((valor) =>
            criarBotaoHistoricoDado(
              valor,
              "",
              historico.length > 1 && (valor === maior || valor === menor),
            ),
          )
          .join(" ");
      }

      function registrarRolagemModalIniciativa(rolagem) {
        const valor = rolagem?.soma;
        if (!Number.isInteger(valor)) return;

        estadoModalIniciativa.historicoRolagens = Array.isArray(
          estadoModalIniciativa.historicoRolagens,
        )
          ? [...estadoModalIniciativa.historicoRolagens, valor]
          : [valor];
        atualizarHistoricoRolagensModalIniciativa();
      }

      function atualizarInterfaceCombate() {
        const ativo = !!estadoCombateIniciativa.ativo;
        const rodada = ativo
          ? Math.max(1, parseInt(estadoCombateIniciativa.rodada, 10) || 1)
          : 0;
        const posicao = ativo
          ? parseInt(estadoCombateIniciativa.posicao, 10) || 1
          : 0;

        document
          .getElementById("combateInicioControle")
          ?.classList.toggle("oculto-combate", ativo);
        document
          .getElementById("combateHud")
          ?.classList.toggle("combate-ativo", ativo);
        document
          .getElementById("combatePosicaoCaixa")
          ?.classList.toggle("oculto-combate", !ativo);
        document
          .getElementById("combateRodadaCaixa")
          ?.classList.toggle("oculto-combate", !ativo);
        document
          .getElementById("btnEncerrarCombate")
          ?.classList.toggle("oculto-combate", !ativo);

        const campoRodada = document.getElementById("combateRodada");
        const campoPosicao = document.getElementById("ataquePosicao");

        if (campoRodada) campoRodada.value = ativo ? rodada : 0;
        if (campoPosicao) campoPosicao.value = ativo ? posicao : 0;

        atualizarRodadaModalAtaque();
      }

      function abrirModalIniciativa() {
        const overlay = document.getElementById("modalIniciativaOverlay");
        const campoDado = document.getElementById("modalIniciativaDado");
        const campoPosicao = document.getElementById("modalPosicaoIniciativa");
        if (!overlay || !campoDado || !campoPosicao) return;

        estadoModalIniciativa.dado = null;
        estadoModalIniciativa.total = null;
        estadoModalIniciativa.historicoRolagens = [];
        campoDado.value = "";
        campoPosicao.value = estadoCombateIniciativa.posicao || "";
        atualizarTotalModalIniciativa();
        atualizarHistoricoRolagensModalIniciativa();

        overlay.classList.remove("oculto");
        overlay.classList.add("ativo");
        overlay.removeAttribute("aria-hidden");
        campoDado.focus();
      }

      function fecharModalIniciativa() {
        const overlay = document.getElementById("modalIniciativaOverlay");
        if (!overlay) return;
        overlay.classList.remove("ativo");
        overlay.classList.add("oculto");
        overlay.setAttribute("aria-hidden", "true");
      }

      function confirmarIniciativa() {
        const campoDado = document.getElementById("modalIniciativaDado");
        const campoPosicao = document.getElementById("modalPosicaoIniciativa");
        const dado = parseInt(campoDado?.value, 10);
        const posicao = parseInt(campoPosicao?.value, 10);

        if (!Number.isInteger(dado) || dado < 1 || dado > 20) {
          campoDado?.focus();
          return;
        }

        if (!Number.isInteger(posicao) || posicao < 1) {
          campoPosicao?.focus();
          return;
        }

        const total = dado + obterBonusIniciativaAtual();
        estadoCombateIniciativa.ativo = true;
        estadoCombateIniciativa.rodada = 1;
        estadoCombateIniciativa.posicao = posicao;
        estadoCombateIniciativa.iniciativa = total;

        atualizarInterfaceCombate();
        adicionarRegistroHistoricoCombate("Iniciativa", total, "🎲");
        fecharModalIniciativa();
      }

      function avancarRodadaCombate() {
        if (!estadoCombateIniciativa.ativo) return;
        estadoCombateIniciativa.rodada =
          Math.max(1, parseInt(estadoCombateIniciativa.rodada, 10) || 1) + 1;
        atualizarInterfaceCombate();
      }

      function encerrarCombate(opcoes = {}) {
        estadoCombateIniciativa.ativo = false;
        estadoCombateIniciativa.rodada = 0;
        estadoCombateIniciativa.posicao = null;
        estadoCombateIniciativa.iniciativa = null;
        atualizarInterfaceCombate();

        if (opcoes.limparHistorico) {
          limparHistorico();
        }
      }

      function finalizarCombateLimparHistorico() {
        encerrarCombate({ limparHistorico: true });
      }

      function confirmarEncerrarCombate() {
        if (!confirm("Deseja realmente encerrar a batalha?")) return;
        encerrarCombate();
      }

      function obterRodadaAtualHistorico() {
        return estadoCombateIniciativa.ativo
          ? estadoCombateIniciativa.rodada
          : 0;
      }

      function obterRodadaCombateAtual() {
        return obterRodadaAtualHistorico();
      }

      function atualizarRodadaModalAtaque() {
        const campo = document.getElementById("modalAtaqueRodada");
        if (!campo) return;
        campo.innerHTML = `Rodada <strong>${obterRodadaCombateAtual()}</strong>`;
      }

      function marcarTipoAcaoModalAtaque(tipoSelecionado = "Ação") {
        const checkboxes = document.querySelectorAll(
          "#modalAtaqueEtapaDado input[data-tipo-acao]",
        );
        let encontrou = false;

        checkboxes.forEach((checkbox) => {
          const ativo = checkbox.dataset.tipoAcao === tipoSelecionado;
          checkbox.checked = ativo;
          if (ativo) encontrou = true;
        });

        if (!encontrou && checkboxes[0]) checkboxes[0].checked = true;
        estadoAtaqueArma.tipoAcao = obterTipoAcaoSelecionadoModalAtaque();
        atualizarDetalheBonusDanoModal();
        atualizarTotalModalDano();
      }

      function obterTipoAcaoSelecionadoModalAtaque() {
        const selecionado = document.querySelector(
          "#modalAtaqueEtapaDado input[data-tipo-acao]:checked",
        );
        return selecionado?.dataset.tipoAcao || "Ação";
      }

      function aplicarHistoricoDadoNoInput(inputId, valor) {
        const campo = document.getElementById(inputId);
        const numero = parseInt(valor, 10);
        if (!campo || !Number.isInteger(numero)) return;

        campo.value = numero;
        campo.dispatchEvent(new Event("input"));
        campo.dispatchEvent(new Event("change"));
        campo.focus();
        campo.select?.();
      }

      function alternarEtapaModalAtaque(exibirDano) {
        const etapaDado = document.getElementById("modalAtaqueEtapaDado");
        const etapaDano = document.getElementById("modalAtaqueEtapaDano");
        if (!etapaDado || !etapaDano) return;

        etapaDado.classList.toggle("oculto", exibirDano);
        etapaDano.classList.toggle("oculto", !exibirDano);
      }

      function fecharModalAtaqueArma() {
        const overlay = document.getElementById("modalAtaqueOverlay");
        const campoDado = document.getElementById("modalAtaqueDado");
        const campoDano = document.getElementById("modalAtaqueDano");
        const botaoSucesso = document.getElementById("modalAtaqueSucesso");
        const botaoFracasso = document.getElementById("modalAtaqueFracasso");
        const modalAtaqueResultadosDano = document.getElementById(
          "modalAtaqueResultadosDano",
        );

        estadoAtaqueArma.arma = null;
        estadoAtaqueArma.dado = null;
        estadoAtaqueArma.totalAtaque = 0;
        estadoAtaqueArma.modBase = 0;
        estadoAtaqueArma.bonusProf = 0;
        estadoAtaqueArma.rotuloAtributo = "";
        estadoAtaqueArma.textoResumo = "";
        estadoAtaqueArma.tipoAcao = "Ação";
        estadoAtaqueArma.historicoRolagens = [];
        estadoAtaqueArma.historicoRolagensDano = [];
        estadoAtaqueArma.danoQtd = 1;
        estadoAtaqueArma.danoFaces = 0;
        estadoAtaqueArma.danoFormula = "";
        estadoAtaqueArma.danoModBase = 0;
        estadoAtaqueArma.ultimaRolagemDano = null;
        estadoAtaqueArma.origem = "arma";
        estadoAtaqueArma.magia = null;
        estadoAtaqueArma.nivelSlot = null;
        estadoAtaqueArma.danoTipo = "";
        estadoAtaqueArma.infoCD = "";

        if (campoDado) campoDado.value = "";
        if (campoDano) campoDano.value = "";
        if (modalAtaqueResultadosDano) modalAtaqueResultadosDano.innerHTML = "";
        if (botaoSucesso) botaoSucesso.classList.remove("ataque-botao-critico");
        if (botaoFracasso)
          botaoFracasso.classList.remove("ataque-botao-fracasso-critico");
        alternarEtapaModalAtaque(false);
        marcarTipoAcaoModalAtaque("Ação");
        atualizarTotalModalAtaque();
        atualizarDetalheDadoAtaqueModal();
        atualizarDetalheBonusAtaqueModal();
        atualizarHistoricoRolagensModalAtaque();
        atualizarTotalModalDano();
        atualizarDetalheDadoDanoModal();
        atualizarDetalheBonusDanoModal();
        atualizarHistoricoRolagensModalDano();

        if (overlay) {
          overlay.classList.remove("ativo");
          overlay.classList.add("oculto");
          overlay.setAttribute("aria-hidden", "true");
        }
      }

      function abrirModalAtaqueArma(arma) {
        const overlay = document.getElementById("modalAtaqueOverlay");
        const titulo = document.getElementById("modalAtaqueTitulo");
        const subtitulo = document.getElementById("modalAtaqueSubtitulo");
        const bonus = document.getElementById("modalAtaqueBonus");
        const resumo = document.getElementById("modalAtaqueResumo");
        const campoDado = document.getElementById("modalAtaqueDado");
        const campoDano = document.getElementById("modalAtaqueDano");

        if (
          !overlay ||
          !titulo ||
          !subtitulo ||
          !bonus ||
          !resumo ||
          !campoDado ||
          !campoDano
        )
          return;

        const { rotuloAtributo, totalAtaque, textoResumo, modBase, bonusProf } =
          obterResumoBonusAtaqueArma(arma);

        estadoAtaqueArma.arma = arma;
        estadoAtaqueArma.origem = arma?.tipo === "magia" ? "magia" : "arma";
        estadoAtaqueArma.magia = arma?.magiaOriginal || null;
        estadoAtaqueArma.nivelSlot = Number.isInteger(arma?.nivelSlot)
          ? arma.nivelSlot
          : null;
        estadoAtaqueArma.danoTipo = arma?.arma_tipo_dano || "";
        estadoAtaqueArma.infoCD = "";
        estadoAtaqueArma.dado = null;
        estadoAtaqueArma.totalAtaque = totalAtaque;
        estadoAtaqueArma.modBase = modBase || 0;
        estadoAtaqueArma.bonusProf = bonusProf || 0;
        estadoAtaqueArma.rotuloAtributo = rotuloAtributo;
        estadoAtaqueArma.textoResumo = textoResumo;
        const formulaDano = obterFormulaDanoAtual(arma);
        const infoDano = parsearFormulaDano(formulaDano);
        estadoAtaqueArma.danoQtd = infoDano.qtd;
        estadoAtaqueArma.danoFaces = infoDano.faces;
        estadoAtaqueArma.danoFormula = formulaDano;
        estadoAtaqueArma.danoModBase =
          estadoAtaqueArma.origem === "magia"
            ? arma?.danoBonusMagia || 0
            : modBase || 0;
        estadoAtaqueArma.tipoAcao = "Ação";
        estadoAtaqueArma.historicoRolagens = [];
        estadoAtaqueArma.historicoRolagensDano = [];
        estadoAtaqueArma.ultimaRolagemDano = null;

        titulo.innerHTML =
          estadoAtaqueArma.origem === "magia"
            ? `Ataque mágico com <span class="ataque-modal-titulo-arma">${arma?.nome || "magia"}</span>`
            : `Ataque com <span class="ataque-modal-titulo-arma">${arma?.nome || "arma"}</span>`;
        subtitulo.textContent = obterSubtituloModalAtaque(arma);
        resumo.textContent = "";
        campoDado.value = "";
        campoDano.value = "";

        atualizarRodadaModalAtaque();
        marcarTipoAcaoModalAtaque("Ação");
        alternarEtapaModalAtaque(false);
        atualizarDetalheBonusAtaqueModal();
        atualizarDetalheDadoAtaqueModal();
        atualizarDetalheBonusDanoModal();
        atualizarDetalheDadoDanoModal();
        atualizarEstadoCriticoModalAtaque();
        atualizarTotalModalDano();
        atualizarHistoricoRolagensModalAtaque();
        atualizarHistoricoRolagensModalDano();
        overlay.classList.add("ativo");
        overlay.classList.remove("oculto");
        overlay.setAttribute("aria-hidden", "false");

        setTimeout(() => campoDado.focus(), 0);
      }

      function abrirModalAtaqueMagia(magia, nivelSlot = null) {
        const arma = criarArmaVirtualMagia(magia);
        arma.nivelSlot = Number.isInteger(nivelSlot) ? nivelSlot : null;
        abrirModalAtaqueArma(arma);
      }

      function obterDadoModalAtaque() {
        const campoDado = document.getElementById("modalAtaqueDado");
        if (!campoDado) return null;

        const dado = parseInt(campoDado.value, 10);
        if (!Number.isInteger(dado) || dado < 1 || dado > 20) {
          campoDado.focus();
          return null;
        }

        return dado;
      }

      function abrirEtapaDanoAtaque() {
        const dado = obterDadoModalAtaque();
        const resumo = document.getElementById("modalAtaqueResumo");
        const subtitulo = document.getElementById("modalAtaqueSubtitulo");
        const campoDano = document.getElementById("modalAtaqueDano");
        if (dado === null || !resumo || !subtitulo || !campoDano) return;

        estadoAtaqueArma.dado = dado;
        subtitulo.textContent = obterSubtituloModalAtaque(
          estadoAtaqueArma.arma,
        );
        const totalAtaque =
          dado +
          (estadoAtaqueArma.modBase || 0) +
          (estadoAtaqueArma.bonusProf || 0);
        const iconeAtributo = obterIconeAtributoAtaque(
          estadoAtaqueArma.rotuloAtributo,
        );
        const tooltipAtributo = obterTooltipAtributoAtaque(
          estadoAtaqueArma.rotuloAtributo,
        );
        const iconeDano = obterIconeAtributoAtaque(
          estadoAtaqueArma.rotuloAtributo,
        );
        const tooltipDano = obterTooltipAtributoAtaque(
          estadoAtaqueArma.rotuloAtributo,
        );
        const formulaDanoTexto = estadoAtaqueArma.danoFormula || "?";
        const bonusDanoEfetivo = obterBonusDanoEfetivoModalAtaque();
        const detalheDano =
          estadoAtaqueArma.origem === "magia"
            ? estadoAtaqueArma.arma?.danoBonusRotuloMagia || "bônus da magia"
            : estadoAtaqueArma.tipoAcao === "Ação bônus"
              ? "sem modificador em ação bônus"
              : tooltipDano;
        const rotuloDano =
          estadoAtaqueArma.origem === "magia"
            ? "Dano da magia"
            : "Dano da arma";
        resumo.innerHTML = `Ataque: <span class="ataque-modal-resumo-destaque">${totalAtaque}</span> (<span class="ataque-modal-resumo-destaque${dado === 20 ? " ataque-modal-resumo-dado-critico" : ""}"><span class="calc-item" title="Valor do dado"><span class="numero">${dado}</span><span class="emoji">🎲</span></span></span> + <span class="ataque-modal-resumo-destaque"><span class="calc-item" title="${tooltipAtributo}"><span class="numero">${estadoAtaqueArma.modBase || 0}</span><span class="emoji">${iconeAtributo}</span></span></span> + <span class="ataque-modal-resumo-destaque"><span class="calc-item" title="Bônus de ataque"><span class="numero">${estadoAtaqueArma.bonusProf || 0}</span><span class="emoji">🅿️</span></span></span>)<br>${rotuloDano}: <span class="ataque-modal-resumo-destaque">${formulaDanoTexto} + <span class="calc-item" title="${detalheDano}"><span class="numero">${bonusDanoEfetivo}</span><span class="emoji">${bonusDanoEfetivo === 0 && estadoAtaqueArma.tipoAcao === "Ação bônus" ? "" : iconeDano}</span></span></span>`;
        const botaoRolarDano = document.getElementById("modalAtaqueRolarDano");
        if (botaoRolarDano) {
          const formulaBtn =
            estadoAtaqueArma.danoFaces > 0
              ? estadoAtaqueArma.danoQtd + "d" + estadoAtaqueArma.danoFaces
              : "dano";
          const textoRolar = "Rolar " + formulaBtn;
          botaoRolarDano.setAttribute("aria-label", textoRolar);
          botaoRolarDano.setAttribute("title", textoRolar);
        }
        const campoResultadosDano = document.getElementById(
          "modalAtaqueResultadosDano",
        );
        if (campoResultadosDano && estadoAtaqueArma.danoFaces > 0) {
          campoResultadosDano.textContent =
            estadoAtaqueArma.danoQtd + "d" + estadoAtaqueArma.danoFaces;
        }
        atualizarDetalheBonusDanoModal();
        atualizarDetalheDadoDanoModal();
        atualizarTotalModalDano();

        atualizarHistoricoRolagensModalDano();
        alternarEtapaModalAtaque(true);
        setTimeout(() => campoDano.focus(), 0);
      }

      function configurarBotaoRolarDanoModal() {
        const botaoRolarDano = document.getElementById("modalAtaqueRolarDano");
        if (!botaoRolarDano) return;

        const formulaBtn =
          estadoAtaqueArma.danoFaces > 0
            ? estadoAtaqueArma.danoQtd + "d" + estadoAtaqueArma.danoFaces
            : "dano";
        const textoRolar = "Rolar " + formulaBtn;
        botaoRolarDano.setAttribute("aria-label", textoRolar);
        botaoRolarDano.setAttribute("title", textoRolar);
      }

      function abrirModalDanoMagia(magia, opcoes = {}) {
        const overlay = document.getElementById("modalAtaqueOverlay");
        const titulo = document.getElementById("modalAtaqueTitulo");
        const subtitulo = document.getElementById("modalAtaqueSubtitulo");
        const resumo = document.getElementById("modalAtaqueResumo");
        const campoDado = document.getElementById("modalAtaqueDado");
        const campoDano = document.getElementById("modalAtaqueDano");
        const arma = criarArmaVirtualMagia(magia);
        const infoDano = parsearFormulaDano(arma.danoFormula || "");
        if (!overlay || !titulo || !subtitulo || !resumo || !campoDano) return;

        estadoAtaqueArma.arma = arma;
        estadoAtaqueArma.origem = "magia";
        estadoAtaqueArma.magia = arma.magiaOriginal || null;
        estadoAtaqueArma.nivelSlot = Number.isInteger(opcoes.nivelSlot)
          ? opcoes.nivelSlot
          : null;
        estadoAtaqueArma.dado = null;
        estadoAtaqueArma.totalAtaque = 0;
        estadoAtaqueArma.modBase = arma.calculoMagia?.modBase || 0;
        estadoAtaqueArma.bonusProf = arma.calculoMagia?.bonusProf || 0;
        estadoAtaqueArma.rotuloAtributo =
          arma.calculoMagia?.rotuloAtributo || "";
        estadoAtaqueArma.textoResumo = "";
        estadoAtaqueArma.tipoAcao = "Ação";
        estadoAtaqueArma.historicoRolagens = [];
        estadoAtaqueArma.historicoRolagensDano = [];
        estadoAtaqueArma.danoQtd = infoDano.qtd;
        estadoAtaqueArma.danoFaces = infoDano.faces;
        estadoAtaqueArma.danoFormula = arma.danoFormula || "";
        estadoAtaqueArma.danoModBase = arma.danoBonusMagia || 0;
        estadoAtaqueArma.ultimaRolagemDano = null;
        estadoAtaqueArma.danoTipo = arma.danoTipo || arma?.arma_tipo_dano || "";
        estadoAtaqueArma.infoCD = opcoes.mostrarCD
          ? `CD para Evitar suas Magias: ${String(document.getElementById("magiaCD")?.value || "-").trim() || "-"}`
          : "";

        titulo.innerHTML = `Dano de <span class="ataque-modal-titulo-arma">${arma.nome}</span>`;
        subtitulo.textContent = magia?.teste_resistencia
          ? `Teste de Resistência: ${magia.teste_resistencia}`
          : "Teste de Resistência";
        if (campoDado) campoDado.value = "";
        campoDano.value = "";

        const linhaCD = estadoAtaqueArma.infoCD
          ? `<div>${estadoAtaqueArma.infoCD}</div>`
          : "";
        resumo.innerHTML = `${linhaCD}<div>Dano da magia: <span class="ataque-modal-resumo-destaque">${estadoAtaqueArma.danoFormula || "dano"} + ${formatarBonusAtaqueModal(estadoAtaqueArma.danoModBase || 0)}</span></div>`;

        atualizarRodadaModalAtaque();
        marcarTipoAcaoModalAtaque("Ação");
        configurarBotaoRolarDanoModal();
        atualizarDetalheBonusDanoModal();
        atualizarDetalheDadoDanoModal();
        atualizarTotalModalDano();
        atualizarHistoricoRolagensModalDano();
        alternarEtapaModalAtaque(true);
        overlay.classList.add("ativo");
        overlay.classList.remove("oculto");
        overlay.setAttribute("aria-hidden", "false");
        setTimeout(() => campoDano.focus(), 0);
      }

      function atualizarSubAbaArmas() {
        const container = document.getElementById("subabaCombateArma");
        if (!container) return;

        const armas = obterArmasEquipadasAtivas();

        if (!armas.length) {
          container.innerHTML =
            '<div class="subaba-vazia">Nenhuma arma equipada no momento.</div>';
          return;
        }

        container.replaceChildren();

        const lista = document.createElement("div");
        lista.className = "arma-resumo-lista";

        armas.forEach((arma) => {
          if (!arma?.nome) return;

          const item = document.createElement("div");
          item.className = "arma-resumo-item";

          if (!arma.proficiente) {
            item.classList.add("nao-proficiente");
          }

          item.tabIndex = 0;
          item.setAttribute("role", "button");
          item.setAttribute("aria-label", `Atacar com ${arma.nome}`);

          const topo = document.createElement("div");
          topo.className = "arma-resumo-topo";

          const nome = (arma.nome || "").trim();

          const icone = arma.propriedade?.toLowerCase().includes("munição")
            ? "🏹"
            : "⚔️";

          let municaoTitulo = "";

          if (icone === "🏹") {
            const idMunicao = arma.arma_municao_id;

            if (idMunicao) {
              const itemMunicao = [
                ...document.querySelectorAll(
                  '#listaOutros .item-card[data-tipo="outro"]',
                ),
              ].find((el) => el.dataset.id === idMunicao);

              const nomeMunicao = itemMunicao?.querySelector(
                '[data-campo="outro_nome"]',
              )?.value;

              const qtdAtual = itemMunicao?.querySelector(
                '[data-campo="outro_quantidade"]',
              )?.value;

              if (nomeMunicao) {
                municaoTitulo = `${qtdAtual || "-"} ${nomeMunicao}`;
              }
            }
          }

          topo.textContent = [nome, icone, municaoTitulo]
            .filter(Boolean)
            .join("  ");

          const detalhes = document.createElement("div");
          detalhes.className = "arma-resumo-detalhes";

          // 🔥 CORREÇÃO PRINCIPAL
          const resumo = getResumoCalculoAtaque(arma);
          const textoAtaque = resumo?.textoResumo || "-";

          detalhes.innerHTML =
            `<strong>Ataque: ${textoAtaque} | Dano: ${arma.dano || "-"}</strong>` +
            `<br>Propriedade: ${arma.propriedade || "-"}`;

          item.addEventListener("click", () => abrirModalAtaqueArma(arma));
          item.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter" || evento.key === " ") {
              evento.preventDefault();
              abrirModalAtaqueArma(arma);
            }
          });

          item.appendChild(topo);
          item.appendChild(detalhes);
          lista.appendChild(item);
        });

        container.appendChild(lista);
      }

      // ===== Combate, historico e contra a morte =====
      function aplicarDanoNoPV() {
        const entrada = prompt("Quanto de dano o personagem tomou?");
        if (entrada === null) return;

        const dano = parseInt(entrada);
        if (isNaN(dano) || dano < 0) return;

        const campoPV = document.getElementById("pvAtual");
        const atual = parseInt(campoPV?.value) || 0;
        campoPV.value = Math.max(0, atual - dano);
        registrarHistoricoComandoCombate("Dano", dano);
        normalizarPontosDeVida();
        abrirTesteConcentracaoPorDano(dano);
      }

      function curarPV() {
        const entrada = prompt("Quanto o personagem recuperou?");
        if (entrada === null) return;

        const cura = parseInt(entrada);
        if (isNaN(cura) || cura < 0) return;

        const campoPV = document.getElementById("pvAtual");
        const atual = parseInt(campoPV?.value) || 0;
        campoPV.value = atual + cura;
        registrarHistoricoComandoCombate("Cura", cura);
        normalizarPontosDeVida();
      }

      function escaparHtmlHistorico(valor) {
        return String(valor ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function normalizarTipoAcaoHistorico(tipoAcao = "Ação") {
        const texto = String(tipoAcao || "Ação").toLowerCase();
        if (texto.includes("reação") || texto.includes("reacao")) {
          return { texto: "REAÇÃO", classe: "reacao" };
        }
        if (texto.includes("bônus") || texto.includes("bonus")) {
          return { texto: "BÔNUS", classe: "bonus" };
        }
        return { texto: "AÇÃO", classe: "acao" };
      }

      function obterTituloMagiaHistorico(nivelSlot) {
        return Number.isInteger(nivelSlot) && nivelSlot > 0
          ? `Magia NV ${nivelSlot}`
          : "Truque";
      }

      function criarDivisorRodadaHistorico(rodada) {
        const divisor = document.createElement("div");
        divisor.className = "historico-rodada-divisor";
        divisor.dataset.rodadaDivisor = String(rodada);
        divisor.textContent = `Rodada ${rodada}`;
        return divisor;
      }

      function garantirDivisorRodadaHistorico(container, rodada) {
        if (!rodada) return;
        const primeiro = container.firstElementChild;
        if (primeiro?.dataset?.rodadaDivisor === String(rodada)) return;
        if (primeiro?.dataset?.rodada === String(rodada)) {
          const segundo = primeiro.nextElementSibling;
          if (segundo?.dataset?.rodadaDivisor === String(rodada)) {
            container.insertBefore(segundo, primeiro);
            return;
          }
          container.insertBefore(criarDivisorRodadaHistorico(rodada), primeiro);
          return;
        }
        container.prepend(criarDivisorRodadaHistorico(rodada));
      }

      function montarRegistroTimelineHistorico(dados) {
        const registro = document.createElement("div");
        registro.className = "historico-registro";
        if (dados.classe) registro.classList.add(dados.classe);
        if (dados.simples) registro.classList.add("simples");
        if (dados.dado === 20) registro.classList.add("critico");
        if (dados.dado === 1) registro.classList.add("falha-critica");

        const tipoAcao = normalizarTipoAcaoHistorico(dados.tipoAcao);
        const titulo = escaparHtmlHistorico(
          dados.titulo || dados.tipo || "Ação",
        );
        const nome = escaparHtmlHistorico(dados.nome || dados.valor || "");
        const iconeNome = dados.iconeNome || dados.icone || "";
        const danoTipo = escaparHtmlHistorico(dados.danoTipo || "");
        const partesResultado = [];

        if (dados.simples) {
          const textoSimples = escaparHtmlHistorico(
            dados.texto || nome || titulo,
          );
          registro.innerHTML = `<div class="historico-evento-simples">${textoSimples}</div>`;
          return registro;
        }

        if (Number.isInteger(dados.dado)) {
          const bonusAtaque = Number.isFinite(dados.bonusAtaque)
            ? dados.bonusAtaque
            : null;
          const totalAtaque = Number.isFinite(dados.totalAtaque)
            ? dados.totalAtaque
            : bonusAtaque === null
              ? dados.dado
              : dados.dado + bonusAtaque;
          const detalheAtaque =
            bonusAtaque === null
              ? ""
              : ` (${dados.dado}${bonusAtaque >= 0 ? "+" : ""}${bonusAtaque})`;
          if (dados.dado === 20) {
            partesResultado.push(
              `<span class="historico-evento-critico">🎲 ${totalAtaque}${detalheAtaque} ✦</span>`,
            );
          } else if (dados.dado === 1) {
            partesResultado.push(
              `<span class="historico-evento-falha">🎲 ${totalAtaque}${detalheAtaque} ✖ Falha Crítica</span>`,
            );
          } else if (dados.sucesso === false) {
            partesResultado.push(`🎲 ${totalAtaque}${detalheAtaque} ✖`);
          } else {
            partesResultado.push(`🎲 ${totalAtaque}${detalheAtaque} ✔`);
          }
        }

        if (Number.isFinite(dados.dano) && dados.dano > 0) {
          partesResultado.push(
            `💥${dados.dano}${danoTipo ? ` ${danoTipo}` : ""}`,
          );
        }

        if (Number.isFinite(dados.cura) && dados.cura > 0) {
          partesResultado.push(`💚 ${dados.cura} Cura`);
        }

        registro.innerHTML = `
          <div class="historico-evento-topo">
            ${dados.exibirBadge === false ? "" : `<span class="historico-acao-badge ${tipoAcao.classe}">${tipoAcao.texto}</span>`}
            <span class="historico-evento-tipo">${titulo}</span>
            ${dados.concentrando ? '<span class="historico-concentracao">🌀Concentração Iniciada</span>' : ""}
          </div>
          ${nome ? `<div class="historico-evento-nome">${iconeNome ? `${iconeNome} ` : ""}${nome}</div>` : ""}
          ${partesResultado.length ? `<div class="historico-evento-resultado">${partesResultado.join(" • ")}</div>` : ""}
        `;

        return registro;
      }

      function adicionarRegistroHistoricoCombate(
        tipo,
        valor,
        iconePersonalizado = "",
        detalheRodada = "",
        opcoes = {},
      ) {
        const rodada = obterRodadaAtualHistorico();
        const registrosContainer =
          document.getElementById("historicoRegistros");
        if (!registrosContainer) return;

        // 🔥 Mapa de emojis
        const icones = {
          Cura: "❤️",
          Fracasso: "💀",
          Dano: "💥",
          Sucesso: "🍀",
          "Ataque falhou!": "❌",
          "Ataque!": "⚔️",
          "Dano Mágico": "✨",
        };
        icones["Ataque"] = "⚔️";

        const icone = iconePersonalizado || icones[tipo] || "";

        if (tipo === "Iniciativa") {
          const registroIniciativa = document.createElement("div");
          registroIniciativa.className = "historico-registro iniciativa";
          const posicao = estadoCombateIniciativa.posicao || "-";
          registroIniciativa.innerHTML = `Batalha Iniciada: 🎲 Inic. ${escaparHtmlHistorico(valor)} | Pos: ${escaparHtmlHistorico(posicao)}º`;
          registrosContainer.prepend(registroIniciativa);
          return;
        }

        const dadosTimeline = opcoes.timeline
          ? {
              tipo,
              valor,
              icone,
              tipoAcao: detalheRodada || opcoes.tipoAcao || "Ação",
              ...opcoes.timeline,
            }
          : {
              tipo,
              valor:
                tipo === "Dano"
                  ? `${valor}`
                  : tipo === "Cura"
                    ? `${valor}`
                    : valor,
              icone,
              tipoAcao: detalheRodada || opcoes.tipoAcao || "Ação",
              titulo: tipo,
              nome:
                tipo === "Dano"
                  ? "Dano recebido"
                  : tipo === "Cura"
                    ? "Cura recebida"
                    : valor,
              dano: tipo === "Dano" ? Number(valor) : null,
              cura: tipo === "Cura" ? Number(valor) : null,
              iconeNome: tipo === "Cura" ? "💚" : icone,
              simples: true,
              exibirBadge: false,
              texto:
                tipo === "Dano"
                  ? `💥 Dano ${valor}`
                  : tipo === "Cura"
                    ? `💚 Cura ${valor}`
                    : `${icone ? `${icone} ` : ""}${tipo}${valor ? ` ${valor}` : ""}`,
            };

        const registro = montarRegistroTimelineHistorico(dadosTimeline);
        registro.dataset.rodada = String(rodada);

        registrosContainer.prepend(registro);
        garantirDivisorRodadaHistorico(registrosContainer, rodada);
      }

      function registrarHistoricoAtaqueArma(sucesso, dano) {
        const arma = estadoAtaqueArma.arma;
        const dado = estadoAtaqueArma.dado;
        if (!arma || (dado === null && estadoAtaqueArma.origem !== "magia"))
          return;

        if (estadoAtaqueArma.origem !== "magia") consumirMunicao(1, arma);

        const ehMagia = estadoAtaqueArma.origem === "magia";
        const nivelMagia = Number.isInteger(estadoAtaqueArma.nivelSlot)
          ? estadoAtaqueArma.nivelSlot
          : Number(estadoAtaqueArma.magia?.nivel) || 0;
        const tipoDano =
          estadoAtaqueArma.danoTipo ||
          arma?.arma_tipo_dano ||
          arma?.tipo_dano ||
          arma?.bruto?.arma_tipo_dano ||
          arma?.bruto?.tipo_dano ||
          "";
        const bonusAtaque =
          Number(estadoAtaqueArma.modBase || 0) +
          Number(estadoAtaqueArma.bonusProf || 0);
        const totalAtaque = Number.isInteger(dado) ? dado + bonusAtaque : null;
        const valor = ehMagia
          ? [
              arma.nome || "Magia",
              dado === null ? "" : `Dado: ${dado}`,
              sucesso ? "Sucesso" : "Fracasso",
              `Dano: ${dano}`,
              tipoDano,
              estadoAtaqueArma.infoCD || "",
            ]
              .filter(Boolean)
              .join(" | ")
          : [
              arma.nome || "Arma",
              `Dado: ${dado}`,
              sucesso ? "Sucesso" : "Fracasso",
              `Dano: ${dano}`,
            ].join(" | ");

        adicionarRegistroHistoricoCombate(
          ehMagia && dado === null ? "Dano Mágico" : "Ataque",
          valor,
          ehMagia ? "✨" : arma.usaMunicao ? "🏹" : "⚔️",
          obterTipoAcaoSelecionadoModalAtaque().toLowerCase(),
          {
            timeline: {
              titulo: ehMagia
                ? obterTituloMagiaHistorico(nivelMagia)
                : "Ataque com arma",
              nome: arma.nome || (ehMagia ? "Magia" : "Arma"),
              iconeNome: ehMagia ? "🪄" : "🗡️",
              dado,
              bonusAtaque,
              totalAtaque,
              sucesso,
              dano,
              danoTipo: tipoDano,
              concentrando:
                ehMagia && magiaExigeConcentracao(estadoAtaqueArma.magia),
            },
          },
        );
      }

      function abrirHistoricoAposFinalizar() {
        const botaoHistorico = document.querySelector(
          '.subaba-botao[onclick*="historico"]'
        );
        if (botaoHistorico) {
          trocarSubAbaCombate("historico", botaoHistorico);
        }
      }

      function confirmarFracassoAtaque() {
        const dado = obterDadoModalAtaque();
        if (dado === null) return;

        estadoAtaqueArma.dado = dado;
        registrarHistoricoAtaqueArma(false, 0);
        fecharModalAtaqueArma();
        abrirHistoricoAposFinalizar();
      }

      function confirmarDanoAtaque() {
        const campoDano = document.getElementById("modalAtaqueDano");
        if (!campoDano) return;

        const danoRolado = parseInt(campoDano.value, 10);
        if (!Number.isInteger(danoRolado) || danoRolado < 0) {
          campoDano.focus();
          return;
        }

        const danoTotal = danoRolado + obterBonusDanoEfetivoModalAtaque();
        registrarHistoricoAtaqueArma(true, danoTotal);
        fecharModalAtaqueArma();
        abrirHistoricoAposFinalizar();
      }

      function registrarHistoricoComandoCombate(tipo, valor) {
        adicionarRegistroHistoricoCombate(tipo, valor);
      }

      function limparHistorico() {
        const registrosContainer =
          document.getElementById("historicoRegistros");
        registrosContainer.innerHTML = "";
      }

      function descansoLongo() {
        if (!confirm("Deseja realmente fazer um descanso longo?")) {
          return;
        }

        const campoTotal = document.getElementById("dadosVidaTotal");
        const campoRestantes = document.getElementById("dadosVidaRestantes");
        const campoPV = document.getElementById("pvAtual");
        const campoPVTotal = document.getElementById("pvTotal");

        if (campoTotal && campoRestantes) {
          campoRestantes.value = campoTotal.value;
          normalizarDadosVida();
        }

        if (campoPV && campoPVTotal) {
          campoPV.value = campoPVTotal.value;
          normalizarPontosDeVida();
        }
      }

      function verificarStatusMorte() {
        const campoPV = document.getElementById("pvAtual");
        const campoPVTotal = document.getElementById("pvTotal");
        const campoContraMorte = document.getElementById("ataqueContraMorte");
        const campoPVDisplay = document.getElementById("ataquePvAtual");

        if (!campoPV || !campoContraMorte || !campoPVDisplay || !campoPVTotal)
          return;

        const pvAtual = parseInt(campoPV.value) || 0;
        const pvTotal = parseInt(campoPVTotal.value) || 0;

        // Se PV total é zero, a ficha não foi montada, então não abre contra morte
        if (pvTotal === 0) {
          campoPVDisplay.style.display = "flex";
          campoContraMorte.style.display = "none";
          limparContraMorte();
          return;
        }

        if (pvAtual <= 0) {
          campoPVDisplay.style.display = "none";
          campoContraMorte.style.display = "flex";
        } else {
          campoPVDisplay.style.display = "flex";
          campoContraMorte.style.display = "none";
          limparContraMorte();
        }
      }

      function adicionarSucesso() {
        for (let i = 1; i <= 3; i++) {
          const dot = document.getElementById("sucesso" + i);

          if (dot && !dot.classList.contains("ativo")) {
            dot.classList.add("ativo");
            registrarHistoricoComandoCombate("Sucesso", `${i}º`);

            verificarVitoriaDeathSave();
            return;
          }
        }
      }

      function adicionarFracasso() {
        for (let i = 1; i <= 3; i++) {
          const dot = document.getElementById("fracasso" + i);

          if (dot && !dot.classList.contains("ativo")) {
            dot.classList.add("ativo");

            // 🔥 Registrar só aqui (depois de confirmar)
            registrarHistoricoComandoCombate("Fracasso", `${i}º`);

            verificarDerrotaDeathSave();
            return;
          }
        }
      }

      function verificarVitoriaDeathSave() {
        let sucessos = 0;

        for (let i = 1; i <= 3; i++) {
          if (
            document.getElementById("sucesso" + i)?.classList.contains("ativo")
          ) {
            sucessos++;
          }
        }

        if (sucessos >= 3) {
          const frases = [
            "Contra todas as probabilidades, você se agarra à vida.",
            "Seu peito volta a respirar. A morte terá que esperar.",
            "A chama da sua alma se recusa a se apagar.",
            "Você resiste. Ainda não é o seu fim.",
            "O destino te dá mais uma chance.",
            "Seu corpo responde — você está de volta.",
            "A vida pulsa novamente em suas veias.",
            "Nem hoje a morte te leva.",
            "Você abre os olhos mais uma vez.",
            "Os deuses ainda não terminaram com você.",
            "A morte tentou te abraçar, mas seu espírito se provou mais forte.",
            "O fio da sua vida se tencionou, mas não rompeu. Você está de volta.",
            "A luz retorna aos seus olhos. O mundo ainda precisa de você.",
            "Você respira fundo enquanto o abismo recua. A luta continua!",
            "A balança se inclinou a seu favor. Você estabilizou.",
            "O Ceifador terá que esperar. Hoje não é o seu dia.",
            "Sua determinação forçou o destino a te conceder uma segunda chance.",
            "Três batidas firmes no coração. O perigo imediato passou.",
          ];

          const fraseAleatoria =
            frases[Math.floor(Math.random() * frases.length)];

          alert(fraseAleatoria + "\n\nVocê recupera 1 PV e está estável!");

          const campoPV = document.getElementById("pvAtual");
          if (campoPV) {
            registrarHistoricoComandoCombate("Cura", 1);
            campoPV.value = 1;
            normalizarPontosDeVida();
          }
        }
      }

      function verificarDerrotaDeathSave() {
        let fracassos = 0;

        for (let i = 1; i <= 3; i++) {
          if (
            document.getElementById("fracasso" + i)?.classList.contains("ativo")
          ) {
            fracassos++;
          }
        }

        if (fracassos >= 3) {
          const frases = [
            "Sua canção termina aqui, mas o eco de suas façanhas perdurará pelas eras.",
            "A luz em seus olhos se apaga, cedendo lugar ao descanso eterno dos heróis.",
            "As estrelas brilham um pouco menos hoje. Sua alma agora pertence ao cosmos.",
            "O frio do abismo finalmente te alcançou.",
            "Seu sangue mancha a terra; o silêncio é sua única companhia agora.",
            "O destino foi cruel. Seu corpo tomba, desprovido de vida.",
            "A escuridão te envolveu. Não há mais volta.",
            "O último capítulo da sua história foi escrito.",
            "Os dados pararam de rolar para você. Que sua próxima encarnação seja mais afortunada.",
            "Sua ficha repousa agora no panteão das lendas esquecidas.",
            "O mestre das almas recolheu sua ficha. Fim de jogo.",
          ];

          const fraseAleatoria =
            frases[Math.floor(Math.random() * frases.length)];
          document.getElementById("nomePersonagem").value =
            "☠️ " + document.getElementById("nomePersonagem").value;

          alert(
            fraseAleatoria +
              "\n\nGAME OVER!\n" +
              document.getElementById("nomePersonagem").value,
          );
        }
      }

      function limparContraMorte() {
        for (let i = 1; i <= 3; i++) {
          document.getElementById("sucesso" + i)?.classList.remove("ativo");
          document.getElementById("fracasso" + i)?.classList.remove("ativo");
        }
      }

      function normalizarPosicaoAtaque() {
        const campo = document.getElementById("ataquePosicao");
        if (!campo) return;

        const numero = parseInt(campo.value) || 0;
        campo.value = numero;
        if (estadoCombateIniciativa.ativo) {
          estadoCombateIniciativa.posicao = Math.max(1, numero);
        }
      }

      function normalizarRodadaCombate() {
        const campo = document.getElementById("combateRodada");
        if (!campo) return;

        const numero = Math.max(1, parseInt(campo.value, 10) || 1);
        campo.value = numero;
        if (estadoCombateIniciativa.ativo) {
          estadoCombateIniciativa.rodada = numero;
        }
        atualizarRodadaModalAtaque();
      }

      function trocarSubAbaCombate(tipo, botao) {
        document
          .querySelectorAll(".subaba-botao")
          .forEach((el) => el.classList.remove("ativa"));
        document
          .querySelectorAll(".subaba-combate")
          .forEach((el) => el.classList.remove("ativa"));

        botao.classList.add("ativa");

        let alvo;
        if (tipo === "magia") {
          alvo = document.getElementById("subabaCombateMagia");
        } else if (tipo === "historico") {
          alvo = document.getElementById("subabaCombateHistorico");
        } else {
          alvo = document.getElementById("subabaCombateArma");
        }

        if (alvo) alvo.classList.add("ativa");
      }

      function atualizarModificadoresSalvaguarda() {
        const bonusProf = getBonusProf();

        document.querySelectorAll(".salvaguarda-caixa").forEach((caixa) => {
          const atributo =
            caixa.querySelector(".prof-checkbox").dataset.atributo;
          const valor =
            parseInt(document.getElementById("atrib_" + atributo)?.value) || 0;
          const prof = caixa.querySelector(".prof-checkbox").checked
            ? bonusProf
            : 0;
          const mod = Math.floor((valor - 10) / 2);
          const salvMod = mod + prof;

          caixa.querySelector(".modificador-orbe").innerText =
            (mod >= 0 ? "+" : "") + mod;

          const campoSalv = document.getElementById("salv_" + atributo);
          if (campoSalv) campoSalv.value = formatarBonusCalculado(salvMod);

          if (caixa.querySelector(".prof-checkbox").checked) {
            caixa.classList.add("proficiente");
          } else {
            caixa.classList.remove("proficiente");
          }
        });

        atualizarProficienciaNoRadar();
      }
    
