
      function aplicarDadosFicha(dados) {
        bloqueandoLevelUp = true;
        if (!dados || typeof dados !== "object") return;

        dados = normalizarDadosImportacao(dados);
        if (typeof aplicarTema === "function") {
          aplicarTema(dados.tema || "tema-padrao");
        }
        configFicha = normalizarConfigFicha(dados.configFicha);
        personagem = dados;
        armaduraEquipadaIndice = normalizarIndiceEquipamento(
          dados.armaduraEquipadaIndice,
        );
        console.log("OUTROS COM ID:", dados.outros);
        // 🔥 CAMPOS ESPECIAIS
        const camposEspeciais = {
          xp: (valor) => setXP(valor ?? 0),
          magiaAtributoConjuracao: (valor, campo) =>
            (campo.value = normalizarChaveAtributo(valor)),
          alinhamentoID: (valor, campo) =>
            (campo.value = normalizarValorAlinhamento(valor)),
          dadosVidaTipo: (valor, campo) =>
            (campo.value = normalizarTipoDadoVida(valor)),
        };

        // 🔹 FUNÇÃO AUXILIAR
        function preencherCampo(campo, valor) {
          if (campo.type === "checkbox") {
            campo.checked = valor;
          } else if (campo.type === "number") {
            const num = parseInt(
              String(valor ?? "").replace(/[^\d-]/g, ""),
              10,
            );
            campo.value = Number.isNaN(num) ? "" : Math.abs(num);
          } else {
            campo.value = valor;
          }
        }

        // =========================
        // 🟢 1. CAMPOS SIMPLES + ESPECIAIS
        // =========================
        for (let key in dados) {
          const campo = document.getElementById(key);
          if (!campo) continue;

          // 🔥 CAMPOS ESPECIAIS
          if (camposEspeciais[key]) {
            camposEspeciais[key](dados[key], campo);
            continue;
          }

          // 🔹 IGNORAR CAMPOS ESPECÍFICOS
          if (
            [
              "arma1Nome",
              "arma2Nome",
              "arma1Dano",
              "arma2Dano",
              "armaduraNome",
            ].includes(key)
          ) {
            continue;
          }

          preencherCampo(campo, dados[key]);
        }

        const nivelSalvoFicha = obterNivelSalvoFicha(dados);
        if (nivelSalvoFicha) {
          const campoNivelImportado = document.getElementById("classeNivelID");
          if (campoNivelImportado) {
            campoNivelImportado.value = String(nivelSalvoFicha);
          }
        }

        if (dados.estadoCombate && typeof dados.estadoCombate === "object") {
          estadoCombateIniciativa.ativo = !!dados.estadoCombate.ativo;
          estadoCombateIniciativa.rodada = estadoCombateIniciativa.ativo
            ? Math.max(1, parseInt(dados.estadoCombate.rodada, 10) || 1)
            : 0;
          estadoCombateIniciativa.posicao = estadoCombateIniciativa.ativo
            ? Math.max(1, parseInt(dados.estadoCombate.posicao, 10) || 1)
            : null;
          estadoCombateIniciativa.iniciativa = estadoCombateIniciativa.ativo
            ? parseInt(dados.estadoCombate.iniciativa, 10) || 0
            : null;
        } else {
          estadoCombateIniciativa.ativo = false;
          estadoCombateIniciativa.rodada = 0;
          estadoCombateIniciativa.posicao = null;
          estadoCombateIniciativa.iniciativa = null;
        }
        atualizarInterfaceCombate();

        const campoSubclasse = garantirCampoSubclasseComoSelect();
        if (campoSubclasse) {
          campoSubclasse.dataset.pendingValue = String(dados.subclasse ?? "");
          atualizarSubclasses(dados.classeNomeID ?? dados.classeNome ?? "");
        }

        const campoRaca = obterCampoRaca();
        const valorRacaSalvo = String(dados.racaID ?? dados.raca ?? "").trim();
        if (campoRaca && valorRacaSalvo) {
          garantirOpcaoSelect(campoRaca, valorRacaSalvo);
          campoRaca.value = valorRacaSalvo;
        }

        const campoSubraca = obterCampoSubraca();
        if (campoSubraca) {
          campoSubraca.dataset.pendingValue = String(dados.subraca ?? "");
          atualizarSubracas(dados.racaID ?? dados.raca ?? "");
        }

        normalizarPlaceholdersCamposBase();
        preencherFormularioConfigFicha();
        aplicarConfigCustomizacaoNaFicha(false);

        inicializarTalentos(dados);

        // =========================
        // 🟢 2. CARREGAR MUNIÇÕES (OUTROS)
        // =========================
        if (dados.outros && Array.isArray(dados.outros)) {
          const containerOutros = document.getElementById("listaOutros");

          if (containerOutros) {
            const outrosAtuais = containerOutros.querySelectorAll(
              '.item-card[data-tipo="outro"]',
            );
            outrosAtuais.forEach((o) => o.remove());

            dados.outros.forEach((dadosOutro) => {
              const novoCard = adicionarNovoOutro();

              // 🔥 GARANTIR ID ANTES DE QUALQUER COISA
              const id = dadosOutro.id || gerarId();
              novoCard.dataset.id = id;
              dadosOutro.id = id; // 🔥 MUITO IMPORTANTE
              if (!novoCard) return;

              novoCard.querySelectorAll("[data-campo]").forEach((campo) => {
                const valor = dadosOutro[campo.dataset.campo];
                if (valor !== undefined) campo.value = valor;
              });
              aplicarFlagsCompartilhadasItem(novoCard, dadosOutro, "outro");

              if (dadosOutro.id) {
                novoCard.dataset.id = dadosOutro.id;
              }

              atualizarOpcoesMunicao(novoCard);
            });
          }
        }

        // =========================
        // 🔫 3. ARMAS
        // =========================
        if (dados.armas && Array.isArray(dados.armas)) {
          const containerArmas = document.getElementById("listaArmas");

          if (containerArmas) {
            const armasAtuais = containerArmas.querySelectorAll(
              '.item-card[data-tipo="arma"]:not(#armaModelo)',
            );
            armasAtuais.forEach((a) => a.remove());

            dados.armas.forEach((dadosArma) => {
              const novoCard = adicionarNovaArma();
              if (!novoCard) return;

              if (dadosArma.propriedades) {
                novoCard
                  .querySelectorAll('input[type="checkbox"]')
                  .forEach((checkbox) => {
                    const prop = checkbox.dataset.propriedade;
                    if (prop && dadosArma.propriedades[prop] !== undefined) {
                      checkbox.checked = dadosArma.propriedades[prop];
                      checkbox.dispatchEvent(new Event("change"));
                    }
                  });
              }

              novoCard.querySelectorAll("[data-campo]").forEach((campo) => {
                const valor = dadosArma[campo.dataset.campo];
                if (valor !== undefined) campo.value = valor;
              });
              aplicarFlagsCompartilhadasItem(novoCard, dadosArma, "arma");
              atualizarOpcoesMunicao(novoCard);

              setTimeout(() => {
                const selectMunicao = novoCard.querySelector(
                  '[data-campo="arma_municao_id"]',
                );

                if (selectMunicao && dadosArma.arma_municao_id) {
                  selectMunicao.value = String(dadosArma.arma_municao_id);
                  selectMunicao.dispatchEvent(new Event("change"));
                }
              }, 0);

              if (typeof dadosArma.proficiente === "boolean") {
                const indicador = novoCard.querySelector(".item-proficiencia");
                if (indicador) {
                  indicador.classList.toggle("nao", !dadosArma.proficiente);
                  indicador.classList.toggle("ativo", dadosArma.proficiente);
                }
              }
            });
          }
        }

        // =========================
        // 👕 4. ARMADURAS
        // =========================
        if (dados.armaduras && Array.isArray(dados.armaduras)) {
          const containerArmaduras = document.getElementById("listaArmaduras");

          if (containerArmaduras) {
            const atuais = containerArmaduras.querySelectorAll(
              '.item-card[data-tipo="armadura"]:not(#armaduraModelo)',
            );
            atuais.forEach((a) => a.remove());

            dados.armaduras.forEach((dadosArmadura) => {
              const novoCard = adicionarNovaArmadura();
              if (!novoCard) return;

              novoCard.querySelectorAll("[data-campo]").forEach((campo) => {
                const valor = dadosArmadura[campo.dataset.campo];

                if (valor !== undefined) {
                  campo.value = valor;
                  campo.dispatchEvent(new Event("change"));
                }
              });
              aplicarFlagsCompartilhadasItem(
                novoCard,
                dadosArmadura,
                "armadura",
              );

              if (typeof dadosArmadura.proficiente === "boolean") {
                const indicador = novoCard.querySelector(".item-proficiencia");
                if (indicador) {
                  indicador.classList.toggle("nao", !dadosArmadura.proficiente);
                  indicador.classList.toggle(
                    "ativo",
                    dadosArmadura.proficiente,
                  );
                }
              }
            });
          }
        }

        // =========================
        // 🛡️ 4.1 ESCUDOS
        // =========================
        if (dados.escudos && Array.isArray(dados.escudos)) {
          const containerEscudos = document.getElementById("listaEscudos");

          if (containerEscudos) {
            const atuais = containerEscudos.querySelectorAll(
              '.item-card[data-tipo="escudo"]:not(#escudoModelo)',
            );
            atuais.forEach((e) => e.remove());

            dados.escudos.forEach((dadosEscudo) => {
              const novoCard = adicionarNovoEscudo();
              if (!novoCard) return;

              novoCard.querySelectorAll("[data-campo]").forEach((campo) => {
                const valor = dadosEscudo[campo.dataset.campo];

                if (valor !== undefined) {
                  campo.value = valor;
                  campo.dispatchEvent(new Event("change"));
                }
              });
              aplicarFlagsCompartilhadasItem(novoCard, dadosEscudo, "escudo");

              if (typeof dadosEscudo.proficiente === "boolean") {
                const indicador = novoCard.querySelector(".item-proficiencia");
                if (indicador) {
                  indicador.classList.toggle("nao", !dadosEscudo.proficiente);
                  indicador.classList.toggle("ativo", dadosEscudo.proficiente);
                }
              }
            });
          }
        }

        // =========================
        // 🔄 5. PÓS-PROCESSAMENTO
        // =========================
        document
          .querySelectorAll(
            '#listaArmas .item-card[data-tipo="arma"], #listaArmaduras .item-card[data-tipo="armadura"], #listaEscudos .item-card[data-tipo="escudo"], #listaOutros .item-card[data-tipo="outro"]',
          )
          .forEach(fecharItemCard);
        atualizarListaArmasEquipamento();

        const armasImportadas = coletarArmas();
        const escudosImportados = coletarEscudos();
        const indiceArma1 = resolverIndiceArmaSalva(
          dados,
          1,
          armasImportadas,
          escudosImportados,
        );
        const indiceArma2Base = resolverIndiceArmaSalva(
          dados,
          2,
          armasImportadas,
          escudosImportados,
        );
        const indiceArma2 =
          indiceArma2Base === indiceArma1 ? null : indiceArma2Base;

        atualizarSelectNomeArmaEquipada(
          1,
          armasImportadas,
          indiceArma1,
          escudosImportados,
        );
        atualizarSelectNomeArmaEquipada(
          2,
          armasImportadas,
          indiceArma2,
          escudosImportados,
        );

        sincronizarMarcacaoArmasPorSlots();
        sincronizarEquipamentosCombate();

        sincronizarSalvaguardasComAtributosBase();
        atualizarAtributos();
        desenharRadar();
        atualizarModificadoresSalvaguarda();
        atualizarPericias();
        atualizarPassivas();
        atualizarClasseArmaduraEquipada();
        atualizarSubAbaArmas();
        sincronizarClasseNivel(true);
        if (nivelSalvoFicha) {
          const campoNivelImportado = document.getElementById("classeNivelID");
          if (campoNivelImportado) {
            campoNivelImportado.value = String(nivelSalvoFicha);
            sincronizarClasseNivel(false);
          }
        }
        sincronizarResumoCaracteristicas(true);
        if (typeof preencherSelectArquivosCaracteristica === "function") {
          preencherSelectArquivosCaracteristica();
        }
        if (typeof carregarCaracteristicasClasse === "function") {
          const arquivoSalvo = document.getElementById(
            "caracteristicaClasseArquivo",
          )?.value;
          const subclasseCaracteristicaSalva =
            dados.caracteristicaClasseSubclasse ||
            dados.caracteristicaClasseSubdominio ||
            dados.selectSubclasse ||
            "";
          if (!arquivoSalvo) {
            sincronizarArquivoCaracteristicaComClasse(false);
            avisarCaracteristicaClasse(
              "A ficha importada não tinha arquivo de característica salvo. Vou tentar importar pela classe e subclasse da ficha.",
              "info",
            );
          } else {
            avisarCaracteristicaClasse(
              `A ficha importada trouxe a característica salva: ${arquivoSalvo}. Vou tentar recarregar esse arquivo.`,
              "info",
            );
          }
          setTimeout(() => {
            carregarCaracteristicasClasse(
              document.getElementById("classeNomeID")?.value ||
                obterSlugArquivoCaracteristica(
                  document.getElementById("caracteristicaClasseArquivo")
                    ?.value,
                ),
              parseInt(document.getElementById("classeNivelID")?.value) || 1,
              document.getElementById("subclasse")?.value || "",
              { subclasseCaracteristicaSalva },
            );
          }, 0);
        }
        sincronizarCamposMagia();
        atualizarMagias();
        atualizarVidaMaxNivelUm();
        normalizarPontosDeVida();
        normalizarDadosVida();
        atualizarPesoAtualInventario();
        marcarFichaComoSalva();
        atualizarDadosVidaTotal();
        atualizarDadoVida();

        bloqueandoLevelUp = false;
        window.personagem = dados;

        atualizarSelectNomeArmaduraEquipada(
          dados.armaduras,
          armaduraEquipadaIndice,
        );

        equiparArmadura(armaduraEquipadaIndice, {
          armaduras: dados.armaduras,
        });

        atualizarFicha();
      }
    
