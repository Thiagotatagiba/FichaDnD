
      function atualizarFicha() {
        // ===== 1. BASE (fonte de verdade) =====
        sincronizarClasseNivel(true); // define nível corretamente

        // ===== 2. DERIVADOS DIRETOS =====
        formatarBonusProf(); // depende do nível

        sincronizarResumoCaracteristicas(true);

        // ===== 3. ATRIBUTOS =====
        atualizarAtributos();
        sincronizarAtributosComSalvaguardas();

        // ===== 4. SALVAGUARDAS E PERÍCIAS =====
        atualizarModificadoresSalvaguarda();
        atualizarPericias();
        atualizarPassivas();

        // ===== 5. COMBATE =====
        atualizarListaArmasEquipamento();
        sincronizarEquipamentosCombate();
        atualizarClasseArmaduraEquipada();
        atualizarResumoAtaquesConjuracao();
        atualizarSubAbaArmas();

        // ===== 6. MAGIA =====
        sincronizarCamposMagia(true, true);
        atualizarMagias();

        // ===== 7. VIDA E DADOS =====
        atualizarVidaMaxNivelUm();
        normalizarPontosDeVida();
        normalizarDadosVida();

        // ===== 8. UI / VISUAL =====
        aplicarFormatoCA("armaduraCA");
        aplicarFormatoCA("outroEquipadoCA");
        aplicarFormatoCA("escudoCA");
        atualizarTodosEmojis();
        normalizarPosicaoAtaque();
        atualizarInterfaceCombate();
        desenharRadar();
        try {
          renderTalentos();
        } catch (erro) {
          console.error(
            "Falha ao renderizar talentos durante atualizarFicha:",
            erro,
          );
        }
      }

      // limpeza
      function normalizarTodasArmas() {
        const armas = coletarArmas?.() || [];

        armas.forEach((arma, index) => {
          if (!arma) return;

          // nome seguro
          let nome = arma.nome || arma.arma_nome || arma.arma || "";

          arma.nome = String(nome).trim() || `Arma ${index + 1}`;

          // limpa legado
          delete arma.arma_nome;
          delete arma.arma;

          const usaMunicao = !!(arma.usaMunicao || arma.propriedades?.municao);
          if (usaMunicao) {
            arma.atributo = "des";
          } else if (!["for", "des"].includes(arma.atributo)) {
            arma.atributo = "for";
          }

          arma.proficiente = !!arma.proficiente;
        });
      }
      atualizarFicha();
      atualizarSubclasse();
      normalizarPlaceholdersCamposBase();
      garantirOpcaoSelect(obterCampoRaca(), obterCampoRaca()?.value);
      atualizarSubracas();
      marcarFichaComoSalva();
    
