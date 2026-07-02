
      // Atualiza quando checkbox muda
      document.querySelectorAll(".prof-checkbox").forEach((el) => {
        el.addEventListener("input", () => {
          atualizarModificadoresSalvaguarda();
          atualizarAtributosTesteResistencia();
          atualizarPassivas();
        });
        el.addEventListener("change", () => {
          atualizarModificadoresSalvaguarda();
          atualizarAtributosTesteResistencia();
          atualizarPassivas();
        });
      });

      document.querySelectorAll(".pericia-prof input").forEach((el) => {
        el.addEventListener("input", () => {
          atualizarPericias();
          atualizarPassivas();
        });
        el.addEventListener("change", () => {
          atualizarPericias();
          atualizarPassivas();
        });
      });

      // Espelha as salvaguardas no radar
      document.querySelectorAll(".valor-atributo-input").forEach((input) => {
        input.addEventListener("input", () => {
          sincronizarAtributosComSalvaguardas();
          atualizarAtributos();
          atualizarVidaMaxNivelUm();
          normalizarPontosDeVida();
          desenharRadar();
          atualizarModificadoresSalvaguarda();
          atualizarAtributosTesteResistencia();
          atualizarPericias();
          atualizarPassivas();
          atualizarMagias();
        });
        input.addEventListener("change", () => {
          sincronizarAtributosComSalvaguardas();
          atualizarAtributos();
          atualizarVidaMaxNivelUm();
          normalizarPontosDeVida();
          desenharRadar();
          atualizarModificadoresSalvaguarda();
          atualizarAtributosTesteResistencia();
          atualizarPericias();
          atualizarPassivas();
          atualizarMagias();
        });
      });

      // Atualiza automaticamente quando o Orbe do bônus de proficiência muda
      const bonusOrbeInput = document.getElementById("bonusProf");
      function atualizarTudoDerivado() {
        atualizarBonusProficiencia();
        atualizarModificadoresSalvaguarda();
        atualizarAtributosTesteResistencia();
        atualizarPericias();
        atualizarPassivas();
        atualizarMagias();
        atualizarSeletoresAtaqueEquipados();
        atualizarSubAbaArmas();
      }

      document
        .getElementById("classeNivelID")
        .addEventListener("input", atualizarTudoDerivado);
      document.getElementById("classeNivelID").addEventListener("input", () => {
        atualizarVidaMaxNivelUm();
        normalizarPontosDeVida();
      });
      document
        .getElementById("classeNivelID")
        .addEventListener("change", () => {
          atualizarVidaMaxNivelUm();
          normalizarPontosDeVida();
        });

      document
        .getElementById("dadosVidaTipo")
        ?.addEventListener("input", () => {
          atualizarVidaMaxNivelUm();
          normalizarPontosDeVida();
        });
      document
        .getElementById("dadosVidaTipo")
        ?.addEventListener("change", () => {
          atualizarVidaMaxNivelUm();
          normalizarPontosDeVida();
        });

      garantirCampoSubclasseComoSelect();
      preencherFormularioConfigFicha();
      aplicarConfigCustomizacaoNaFicha(false);

      document.getElementById("classeNomeID").addEventListener("input", () => {
        sincronizarClasseNivel();
        sincronizarResumoCaracteristicas();
        sincronizarCamposMagia(true, true);
        atualizarMagias();
        atualizarDadoVida();
        atualizarVidaMaxNivelUm();
        normalizarPontosDeVida();
      });
      document.getElementById("classeNomeID").addEventListener("change", () => {
        sincronizarClasseNivel();
        sincronizarResumoCaracteristicas();
        sincronizarCamposMagia(true, true);
        atualizarMagias();
        atualizarDadoVida();
        atualizarVidaMaxNivelUm();
        normalizarPontosDeVida();
      });

      document
        .getElementById("classeNivelID")
        .addEventListener("input", () => sincronizarClasseNivel());
      document
        .getElementById("classeNivelID")
        .addEventListener("change", () => sincronizarClasseNivel());
      document.getElementById("racaID").addEventListener("input", () => {
        atualizarSubracas();
        sincronizarResumoCaracteristicas();
      });
      document.getElementById("racaID").addEventListener("change", () => {
        atualizarSubracas();
        sincronizarResumoCaracteristicas();
      });
      document
        .getElementById("antecedenteID")
        .addEventListener("input", () => sincronizarResumoCaracteristicas());
      document
        .getElementById("subclasse")
        ?.addEventListener("input", () =>
          sincronizarResumoCaracteristicas(true),
        );
      document
        .getElementById("subclasse")
        ?.addEventListener("change", () =>
          sincronizarResumoCaracteristicas(true),
        );
      document
        .getElementById("subraca")
        ?.addEventListener("input", () =>
          sincronizarResumoCaracteristicas(true),
        );
      document
        .getElementById("subraca")
        ?.addEventListener("change", () =>
          sincronizarResumoCaracteristicas(true),
        );
      document
        .getElementById("configBtn")
        ?.addEventListener("click", abrirConfigModal);
      document
        .getElementById("configFecharBtn")
        ?.addEventListener("click", fecharConfigModal);
      document
        .getElementById("salvarCustomizacao")
        ?.addEventListener("click", salvarCustomizacaoFicha);
      document.querySelectorAll(".config-tab").forEach((botao) => {
        botao.addEventListener("click", () =>
          ativarAbaConfig(botao.dataset.tab),
        );
      });
      const campoClasseConjuradora = document.getElementById(
        "magiaClasseConjuradora",
      );
      if (campoClasseConjuradora) {
        campoClasseConjuradora.addEventListener("input", () => {
          const campoAtributo = document.getElementById(
            "magiaAtributoConjuracao",
          );
          sincronizarCamposMagia(false, !campoAtributo?.value);
          atualizarMagias();
        });
        campoClasseConjuradora.addEventListener("change", () => {
          const campoAtributo = document.getElementById(
            "magiaAtributoConjuracao",
          );
          sincronizarCamposMagia(false, !campoAtributo?.value);
          atualizarMagias();
        });
      }
      const campoAtributoConjuracao = document.getElementById(
        "magiaAtributoConjuracao",
      );
      if (campoAtributoConjuracao) {
        campoAtributoConjuracao.addEventListener("input", atualizarMagias);
        campoAtributoConjuracao.addEventListener("change", atualizarMagias);
      }
      inicializarGerenciadorMagias();
      try {
        montarModalTalento();
        inicializarTalentos();
      } catch (erro) {
        console.error("Falha ao preparar interface de talentos:", erro);
      }
      const overlayMagia = document.getElementById("magiaModalOverlay");
      if (overlayMagia) {
        overlayMagia.addEventListener("click", (evento) => {
          if (evento.target === overlayMagia) {
            fecharModalMagia();
          }
        });
      }
      const overlayUsoMagia = document.getElementById("magiaSlotModalOverlay");
      if (overlayUsoMagia) {
        overlayUsoMagia.addEventListener("click", (evento) => {
          if (evento.target === overlayUsoMagia) {
            fecharModalUsarMagia();
          }
        });
      }
      const overlayTalento = document.getElementById("talentoModalOverlay");
      if (overlayTalento) {
        overlayTalento.addEventListener("click", (evento) => {
          if (evento.target === overlayTalento) {
            fecharModalTalento();
          }
        });
      }
      const overlayConfig = document.getElementById("configModalOverlay");
      if (overlayConfig) {
        overlayConfig.addEventListener("click", (evento) => {
          if (evento.target === overlayConfig) {
            fecharConfigModal();
          }
        });
      }
      document
        .getElementById("magiaModalEditar")
        ?.addEventListener("click", () => {
          preencherFormularioMagia(obterMagiaDoEstadoModal());
          alternarModoModalMagia("editar");
        });
      document
        .getElementById("magiaModalExcluir")
        ?.addEventListener("click", excluirMagiaAtual);
      document
        .getElementById("magiaModalSalvar")
        ?.addEventListener("click", salvarModalMagia);
      document
        .getElementById("magiaModalFechar")
        ?.addEventListener("click", fecharModalMagia);
      document
        .getElementById("magiaSlotModalConfirmar")
        ?.addEventListener("click", confirmarUsoMagia);
      document
        .getElementById("magiaSlotModalCancelar")
        ?.addEventListener("click", fecharModalUsarMagia);
      document
        .getElementById("talentoModalEditar")
        ?.addEventListener("click", editarTalentoAtual);
      document
        .getElementById("talentoModalExcluir")
        ?.addEventListener("click", excluirTalentoAtual);
      document
        .getElementById("talentoModalSalvar")
        ?.addEventListener("click", salvarModalTalento);
      document
        .getElementById("talentoModalFechar")
        ?.addEventListener("click", fecharModalTalento);
      [
        "magiaModalPropDano",
        "magiaModalPropCura",
        "magiaModalPropConcentracao",
        "magiaModalResolucao",
      ].forEach((id) => {
        document
          .getElementById(id)
          ?.addEventListener("change", atualizarVisibilidadeFormularioMagia);
      });
      ["armaduraCA", "outroEquipadoCA", "escudoCA"].forEach((id) => {
        const campo = document.getElementById(id);
        if (!campo) return;
        campo.addEventListener("input", () => {
          aplicarFormatoCA(id);
          atualizarClasseArmaduraEquipada();
        });
        campo.addEventListener("change", () => {
          aplicarFormatoCA(id);
          atualizarClasseArmaduraEquipada();
        });
      });
      ["ca_valor"].forEach((id) => {
        const campo = document.getElementById(id);
        if (!campo) return;
        campo.addEventListener("input", atualizarResumoAtaquesConjuracao);
        campo.addEventListener("change", atualizarResumoAtaquesConjuracao);
      });
      ["pvAtual", "pvTotal", "pvTemporario"].forEach((id) => {
        const campo = document.getElementById(id);
        if (!campo) return;
        campo.addEventListener("input", normalizarPontosDeVida);
        campo.addEventListener("change", normalizarPontosDeVida);
      });
      ["dadosVidaRestantes", "dadosVidaTotal"].forEach((id) => {
        const campo = document.getElementById(id);
        if (!campo) return;
        campo.addEventListener("input", normalizarDadosVida);
        campo.addEventListener("change", normalizarDadosVida);
      });
      ["arma1Ataque", "arma1Dano", "arma2Ataque", "arma2Dano"].forEach((id) => {
        const campo = document.getElementById(id);
        if (!campo) return;
        campo.addEventListener("input", atualizarSubAbaArmas);
        campo.addEventListener("change", atualizarSubAbaArmas);
      });
      ["arma1Nome", "arma2Nome"].forEach((id, indice) => {
        const campo = document.getElementById(id);
        if (!campo) return;
        campo.addEventListener("change", () => {
          fecharMenuEmpunhadura();
          lidarSelecaoArmaEquipada(indice + 1);
          atualizarSubAbaArmas();
        });
      });
      ["arma1Empunhadura", "arma2Empunhadura"].forEach((id, indice) => {
        const botao = document.getElementById(id);
        if (!botao) return;
        botao.addEventListener("click", (evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          botao.blur();
          abrirMenuEmpunhadura(indice + 1);
        });
      });
      ["arma1MunicaoSelect", "arma2MunicaoSelect"].forEach((id, indice) => {
        const campo = document.getElementById(id);
        if (!campo) return;
        campo.addEventListener("change", () => {
          const slot = indice + 1;
          const valorSlot =
            document.getElementById(`arma${slot}Nome`)?.value || "";
          if (!valorSlot || extrairIndiceSlotEscudo(valorSlot) !== null) return;

          const indiceArma = parseInt(valorSlot, 10);
          if (!Number.isInteger(indiceArma)) return;

          const cardArma = document.querySelectorAll(
            '#listaArmas .item-card[data-tipo="arma"]:not(#armaModelo)',
          )[indiceArma];
          const selectOriginal = cardArma?.querySelector(
            '[data-campo="arma_municao_id"]',
          );
          if (!selectOriginal) return;

          selectOriginal.value = campo.value || "";
          selectOriginal.dispatchEvent(new Event("change"));
          sincronizarEquipamentosCombate();
          atualizarSubAbaArmas();
        });
      });
      document.addEventListener("click", (evento) => {
        const menu = obterMenuEmpunhadura();
        if (!menu || menu.classList.contains("oculto")) return;

        if (menu.contains(evento.target)) return;
        if (evento.target.closest("#arma1Empunhadura, #arma2Empunhadura"))
          return;

        fecharMenuEmpunhadura();
      });
      document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
          fecharMenuEmpunhadura();
        }
      });
      window.addEventListener("resize", reposicionarMenuEmpunhadura);
      window.addEventListener("scroll", fecharMenuEmpunhadura, true);
      const overlayAtaque = document.getElementById("modalAtaqueOverlay");
      if (overlayAtaque) {
        overlayAtaque.addEventListener("click", (evento) => {
          if (evento.target === overlayAtaque) {
            fecharModalAtaqueArma();
          }
        });
      }

      const overlayTesteResistencia = document.getElementById(
        "modalTesteResistenciaOverlay",
      );
      if (overlayTesteResistencia) {
        overlayTesteResistencia.addEventListener("click", (evento) => {
          if (evento.target === overlayTesteResistencia) {
            fecharModalTesteResistencia();
          }
        });
      }

      const overlayIniciativa = document.getElementById(
        "modalIniciativaOverlay",
      );
      if (overlayIniciativa) {
        overlayIniciativa.addEventListener("click", (evento) => {
          if (evento.target === overlayIniciativa) {
            fecharModalIniciativa();
          }
        });
      }

      document
        .getElementById("abrirTesteResistenciaBtn")
        ?.addEventListener("click", abrirModalTesteResistencia);
      document
        .getElementById("btnRolarIniciativa")
        ?.addEventListener("click", abrirModalIniciativa);
      document
        .getElementById("btnProximaRodada")
        ?.addEventListener("click", avancarRodadaCombate);
      document
        .getElementById("btnEncerrarCombate")
        ?.addEventListener("click", confirmarEncerrarCombate);
      document
        .getElementById("modalIniciativaConfirmar")
        ?.addEventListener("click", confirmarIniciativa);
      document
        .getElementById("modalIniciativaCancelar")
        ?.addEventListener("click", fecharModalIniciativa);
      document
        .getElementById("modalIniciativaDado")
        ?.addEventListener("input", atualizarTotalModalIniciativa);
      document
        .getElementById("modalIniciativaDado")
        ?.addEventListener("change", atualizarTotalModalIniciativa);
      document
        .getElementById("modalIniciativaDado")
        ?.addEventListener("keydown", (evento) => {
          if (evento.key === "Enter") confirmarIniciativa();
        });
      document
        .getElementById("modalPosicaoIniciativa")
        ?.addEventListener("keydown", (evento) => {
          if (evento.key === "Enter") confirmarIniciativa();
        });
      document
        .getElementById("modalIniciativaRolarDado")
        ?.addEventListener("click", () => {
          const campoDado = document.getElementById("modalIniciativaDado");
          const botao = document.getElementById("modalIniciativaRolarDado");
          if (!campoDado || !botao) return;

          botao.classList.add("rolando");
          animarRolagemNoCampo(campoDado, 1, 20, 1000, 60).then((rolagem) => {
            botao.classList.remove("rolando");
            registrarRolagemModalIniciativa(rolagem);
            atualizarTotalModalIniciativa();
            if (rolagem?.resultados?.length) {
              botao.title = `1d20: ${rolagem.resultados.join(", ")}`;
              botao.setAttribute(
                "aria-label",
                `Rolar 1d20. Último resultado ${rolagem.resultados.join(", ")}`,
              );
            }
          });
        });
      document
        .getElementById("modalIniciativaHistoricoLista")
        ?.addEventListener("click", (evento) => {
          const botaoHistorico = evento.target.closest("[data-valor-rolagem]");
          if (!botaoHistorico) return;

          aplicarHistoricoDadoNoInput(
            "modalIniciativaDado",
            botaoHistorico.dataset.valorRolagem,
          );
        });
      document
        .getElementById("modalTesteResistenciaConfirmar")
        ?.addEventListener("click", confirmarTesteResistencia);
      document
        .getElementById("modalTesteResistenciaCancelar")
        ?.addEventListener("click", fecharModalTesteResistencia);
      document.querySelectorAll("[data-atributo-teste]").forEach((botao) => {
        botao.addEventListener("click", () =>
          selecionarAtributoTesteResistencia(botao.dataset.atributoTeste),
        );
      });
      document
        .getElementById("modalTesteResistenciaDadoContainer")
        ?.addEventListener("keydown", (evento) => {
          if (
            evento.key === "Enter" &&
            evento.target?.matches?.("[data-dice-value]")
          ) {
            confirmarTesteResistencia();
          }
        });

      document
        .getElementById("modalAtaqueSucesso")
        ?.addEventListener("click", abrirEtapaDanoAtaque);
      document
        .getElementById("modalAtaqueFracasso")
        ?.addEventListener("click", confirmarFracassoAtaque);
      document
        .getElementById("modalAtaqueCancelar")
        ?.addEventListener("click", fecharModalAtaqueArma);
      document
        .getElementById("modalAtaqueRegistrarDano")
        ?.addEventListener("click", confirmarDanoAtaque);
      document
        .getElementById("modalAtaqueCancelarDano")
        ?.addEventListener("click", fecharModalAtaqueArma);
      document
        .getElementById("modalAtaqueDado")
        ?.addEventListener("keydown", (evento) => {
          if (evento.key === "Enter") abrirEtapaDanoAtaque();
        });

      document
        .getElementById("modalAtaqueDado")
        ?.addEventListener("input", () => {
          atualizarEstadoCriticoModalAtaque();
        });

      document
        .getElementById("modalAtaqueDado")
        ?.addEventListener("change", () => {
          atualizarEstadoCriticoModalAtaque();
        });

      document
        .getElementById("modalAtaqueHistoricoLista")
        ?.addEventListener("click", (evento) => {
          const botaoHistorico = evento.target.closest("[data-valor-rolagem]");
          if (!botaoHistorico) return;

          aplicarHistoricoDadoNoInput(
            "modalAtaqueDado",
            botaoHistorico.dataset.valorRolagem,
          );
        });

      document
        .getElementById("modalAtaqueRolarDado")
        ?.addEventListener("click", () => {
          const campoDado = document.getElementById("modalAtaqueDado");
          const botao = document.getElementById("modalAtaqueRolarDado");
          if (!campoDado || !botao) return;

          botao.classList.add("rolando");

          animarRolagemNoCampo(campoDado, 1, 20, 1000, 60).then((rolagem) => {
            botao.classList.remove("rolando");
            registrarRolagemModalAtaque(rolagem);
            atualizarEstadoCriticoModalAtaque();
            if (rolagem?.resultados?.length) {
              botao.title = `1d20: ${rolagem.resultados.join(", ")}`;
              botao.setAttribute(
                "aria-label",
                `Rolar 1d20. Último resultado ${rolagem.resultados.join(", ")}`,
              );
            }
          });
        });

      document
        .getElementById("modalAtaqueDano")
        ?.addEventListener("keydown", (evento) => {
          if (evento.key === "Enter") confirmarDanoAtaque();
        });

      document
        .getElementById("modalAtaqueRolarDano")
        ?.addEventListener("click", () => {
          const campoDano = document.getElementById("modalAtaqueDano");
          const botao = document.getElementById("modalAtaqueRolarDano");
          if (!campoDano || !botao) return;

          botao.classList.add("rolando");
          const qtd = estadoAtaqueArma.danoQtd || 1;
          const faces = estadoAtaqueArma.danoFaces || 0;

          if (!faces) {
            botao.classList.remove("rolando");
            return;
          }

          animarRolagemNoCampo(campoDano, qtd, faces, 1000, 60).then(
            (rolagem) => {
              botao.classList.remove("rolando");
              registrarRolagemModalDano(rolagem);
              atualizarTotalModalDano();
            },
          );
        });

      document
        .getElementById("modalAtaqueDano")
        ?.addEventListener("input", () => {
          atualizarTotalModalDano();
        });

      document
        .getElementById("modalAtaqueDano")
        ?.addEventListener("change", () => {
          atualizarTotalModalDano();
        });

      document
        .getElementById("modalAtaqueHistoricoDano")
        ?.addEventListener("click", (evento) => {
          const botaoHistorico = evento.target.closest("[data-valor-rolagem]");
          if (!botaoHistorico) return;

          aplicarHistoricoDadoNoInput(
            "modalAtaqueDano",
            botaoHistorico.dataset.valorRolagem,
          );
        });

      document
        .querySelectorAll("#modalAtaqueEtapaDado input[data-tipo-acao]")
        .forEach((checkbox) => {
          checkbox.addEventListener("change", () => {
            if (!checkbox.checked) {
              checkbox.checked = true;
              return;
            }

            marcarTipoAcaoModalAtaque(checkbox.dataset.tipoAcao || "Ação");
          });
        });

      document
        .getElementById("combateRodada")
        ?.addEventListener("input", normalizarRodadaCombate);
      document
        .getElementById("combateRodada")
        ?.addEventListener("change", normalizarRodadaCombate);

      document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
          const overlayIniciativaAtivo = document.getElementById(
            "modalIniciativaOverlay",
          );
          if (
            overlayIniciativaAtivo &&
            !overlayIniciativaAtivo.classList.contains("oculto")
          ) {
            fecharModalIniciativa();
            return;
          }

          const overlayTeste = document.getElementById(
            "modalTesteResistenciaOverlay",
          );
          if (overlayTeste && !overlayTeste.classList.contains("oculto")) {
            fecharModalTesteResistencia();
            return;
          }

          const overlay = document.getElementById("modalAtaqueOverlay");
          if (overlay && !overlay.classList.contains("oculto")) {
            fecharModalAtaqueArma();
            return;
          }

          const overlayUsoMagiaAtivo = document.getElementById(
            "magiaSlotModalOverlay",
          );
          if (
            overlayUsoMagiaAtivo &&
            !overlayUsoMagiaAtivo.classList.contains("oculto")
          ) {
            fecharModalUsarMagia();
            return;
          }

          const overlayMagiaAtivo =
            document.getElementById("magiaModalOverlay");
          if (
            overlayMagiaAtivo &&
            !overlayMagiaAtivo.classList.contains("oculto")
          ) {
            fecharModalMagia();
            return;
          }

          const overlayTalentoAtivo = document.getElementById(
            "talentoModalOverlay",
          );
          if (
            overlayTalentoAtivo &&
            overlayTalentoAtivo.classList.contains("ativo")
          ) {
            fecharModalTalento();
          }
        }
      });

      const campoPosicaoAtaque = document.getElementById("ataquePosicao");
      if (campoPosicaoAtaque) {
        campoPosicaoAtaque.addEventListener("input", normalizarPosicaoAtaque);
        campoPosicaoAtaque.addEventListener("change", normalizarPosicaoAtaque);
      }
      atualizarInterfaceCombate();
    
