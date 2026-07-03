
      // ===== Persistencia da ficha =====
      function normalizarDadosImportacao(dadosOriginais) {
        if (!dadosOriginais || typeof dadosOriginais !== "object") return {};

        const dados = { ...dadosOriginais };
        const aliases = {
          nomePlayer: "jogador",
          classeNome: "classeNomeID",
          classeNivel: "classeNivelID",
          raca: "racaID",
          antecedente: "antecedenteID",
          alinhamento: "alinhamentoID",
          bonusProficiencia: "bonusProf",
          forBase: "for",
          desBase: "des",
          conBase: "con",
          intBase: "int",
          sabBase: "sab",
          carBase: "car",
          // compatibilidade: salv_* antigo → atrib_*
          salv_for: "atrib_for",
          salv_des: "atrib_des",
          salv_con: "atrib_con",
          salv_int: "atrib_int",
          salv_sab: "atrib_sab",
          salv_car: "atrib_car",
          // compatibilidade: prof_* antigo → prof_salv_*
          prof_for: "prof_salv_for",
          prof_des: "prof_salv_des",
          prof_con: "prof_salv_con",
          prof_int: "prof_salv_int",
          prof_sab: "prof_salv_sab",
          prof_car: "prof_salv_car",
        };

        Object.entries(aliases).forEach(([origem, destino]) => {
          if (
            (dados[destino] === undefined || dados[destino] === "") &&
            dados[origem] !== undefined
          ) {
            dados[destino] = dados[origem];
          }
        });

        ["bonusProf", "bonusProficiencia"].forEach((chave) => {
          if (
            dados[chave] !== undefined &&
            dados[chave] !== null &&
            dados[chave] !== ""
          ) {
            const valorNormalizado = parseInt(
              String(dados[chave]).replace(/[^\d-]/g, ""),
              10,
            );
            if (!Number.isNaN(valorNormalizado)) {
              dados[chave] = Math.abs(valorNormalizado);
            }
          }
        });

        if (
          !dados.talentosEstruturados ||
          typeof dados.talentosEstruturados !== "object"
        ) {
          dados.talentosEstruturados = montarTalentosEstruturados(dados);
        }

        dados.configFicha = normalizarConfigFicha(dados.configFicha);

        return dados;
      }

      function adicionarAliasesLegacyAoSave(dados) {
        if (!dados || typeof dados !== "object") return dados;

        dados.nomePlayer = dados.jogador ?? "";
        dados.classeNome = dados.classeNomeID ?? "";
        dados.classeNivel = dados.classeNivelID ?? "";
        dados.raca = dados.racaID ?? "";
        dados.antecedente = dados.antecedenteID ?? "";
        dados.alinhamento = dados.alinhamentoID ?? "";
        dados.bonusProficiencia = dados.bonusProf ?? "";
        dados.forBase = dados.for ?? "";
        dados.desBase = dados.des ?? "";
        dados.conBase = dados.con ?? "";
        dados.intBase = dados.int ?? "";
        dados.sabBase = dados.sab ?? "";
        dados.carBase = dados.car ?? "";
        // aliases legados para atrib_* e prof_salv_*
        dados.salv_for = dados.atrib_for ?? "";
        dados.salv_des = dados.atrib_des ?? "";
        dados.salv_con = dados.atrib_con ?? "";
        dados.salv_int = dados.atrib_int ?? "";
        dados.salv_sab = dados.atrib_sab ?? "";
        dados.salv_car = dados.atrib_car ?? "";
        dados.prof_for = dados.prof_salv_for ?? false;
        dados.prof_des = dados.prof_salv_des ?? false;
        dados.prof_con = dados.prof_salv_con ?? false;
        dados.prof_int = dados.prof_salv_int ?? false;
        dados.prof_sab = dados.prof_salv_sab ?? false;
        dados.prof_car = dados.prof_salv_car ?? false;
        dados.talentosEstruturados = JSON.parse(
          JSON.stringify(talentosEstruturados),
        );

        return dados;
      }

      function normalizarValorAlinhamento(valor) {
        const texto = String(valor || "").trim();
        if (!texto) return "";

        const mapa = {
          "Leal e Bom": "Leal e Bom (LB)",
          "Neutro e Bom": "Neutro e Bom (NB)",
          "Caótico e Bom": "Caótico e Bom (CB)",
          "Leal e Neutro": "Leal e Neutro (LN)",
          Neutro: "Neutro (N)",
          "Caótico e Neutro": "Caótico e Neutro (CN)",
          "Leal e Mau": "Leal e Mau (LM)",
          "Neutro e Mau": "Neutro e Mau (NM)",
          "Caótico e Mau": "Caótico e Mau (CM)",
        };

        return mapa[texto] || texto;
      }

      // Uso: obterArmaduraSeguro(0)
      function obterArmaduraSeguro(indice = 0) {
        const p = window.personagem;
        if (!p || !Array.isArray(p.armaduras)) return null;
        return p.armaduras[indice] || null;
      }
      window.obterArmaduraSeguro =
        window.obterArmaduraSeguro || obterArmaduraSeguro;

      function carregarFicha(personagem) {
        aplicarDadosFicha(personagem);
      }

      function obterNivelSalvoFicha(dados = {}) {
        const candidatos = [
          dados.classeNivelID,
          dados.classeNivel,
          String(dados.classeID || "").match(/NV\s*(\d+)/i)?.[1],
        ];

        for (const valor of candidatos) {
          const nivel = parseInt(
            String(valor ?? "").replace(/[^\d-]/g, ""),
            10,
          );
          if (Number.isInteger(nivel) && nivel > 0) return nivel;
        }

        return null;
      }

      function coletarDadosFicha() {
        const dados = {};

        document
          .querySelectorAll("input, select, textarea")
          .forEach((campo) => {
            if (!campo.id) return;
            if (campo.type === "file") return;
            if (campo.id === "importarFichaInput") return;
            if (
              ["modalIniciativaDado", "modalPosicaoIniciativa"].includes(
                campo.id,
              )
            )
              return;
            dados[campo.id] =
              campo.type === "checkbox" ? campo.checked : campo.value;
          });

        const arma1Equipada = obterSelecaoArmaEquipada(1);
        const arma2Equipada = obterSelecaoArmaEquipada(2);
        dados.arma1Nome = arma1Equipada.nome;
        dados.arma2Nome = arma2Equipada.nome;
        dados.arma1EquipadaIndice = arma1Equipada.indice;
        dados.arma2EquipadaIndice = arma2Equipada.indice;
        dados.armaduraEquipadaIndice = armaduraEquipadaIndice;
        dados.talentosEstruturados = JSON.parse(
          JSON.stringify(talentosEstruturados),
        );
        dados.configFicha = JSON.parse(JSON.stringify(configFicha));
        dados.tema =
          typeof obterTemaAtual === "function" ? obterTemaAtual() : "tema-padrao";
        if (typeof obterEstadoCombateParaSalvar === "function") {
          dados.estadoCombate = obterEstadoCombateParaSalvar();
        }
        dados.caracteristicaClasseArquivo =
          document.getElementById("caracteristicaClasseArquivo")?.value || "";
        dados.caracteristicaClasseSubclasse =
          document.getElementById("caracteristicaClasseSubclasse")?.value ||
          document.getElementById("selectSubclasse")?.value ||
          "";
        dados.caracteristicaClasseSubdominio =
          dados.caracteristicaClasseSubclasse;

        return adicionarAliasesLegacyAoSave(dados);
      }

      let ultimoEstadoSalvo = JSON.stringify(coletarDadosFicha());

      function marcarFichaComoSalva() {
        ultimoEstadoSalvo = JSON.stringify(coletarDadosFicha());
      }

      function fichaFoiAlterada() {
        return JSON.stringify(coletarDadosFicha()) !== ultimoEstadoSalvo;
      }

      /* SALVAR Ficha*/
      function salvarFicha() {
        // Salvar class/subclass data
        const classeData = document.getElementById("classeData").value;
        const subData = document.getElementById("subclasseData").value;

        const dados = coletarDadosFicha();
        dados.classeData = classeData;
        dados.subclasseData = subData;
        dados.caracteristicaClasseArquivo =
          document.getElementById("caracteristicaClasseArquivo")?.value || "";
        dados.caracteristicaClasseSubclasse =
          document.getElementById("caracteristicaClasseSubclasse")?.value ||
          document.getElementById("selectSubclasse")?.value ||
          "";
        dados.caracteristicaClasseSubdominio =
          dados.caracteristicaClasseSubclasse;
        dados.armas = coletarArmas();
        dados.armaduras = coletarArmaduras();
        dados.escudos = coletarEscudos();
        dados.outros = coletarOutros();
        dados.armaduraEquipadaIndice = armaduraEquipadaIndice;

        const nome =
          document.getElementById("nomePersonagem").value || "Personagem";
        const jogador = document.getElementById("jogador").value || "Jogador";

        const hoje = new Date();
        const data =
          hoje.getFullYear().toString() +
          String(hoje.getMonth() + 1).padStart(2, "0") +
          String(hoje.getDate()).padStart(2, "0");

        const nomeArquivo = `${nome}_${jogador}_${data}.json`.replace(
          /\s+/g,
          "_",
        );

        const blob = new Blob([JSON.stringify(dados, null, 2)], {
          type: "application/json",
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = nomeArquivo;
        a.click();

        marcarFichaComoSalva();
      }

      /* IMPORTAR Ficha*/

      function confirmarAlteracoesAntesDeImportar() {
        if (!fichaFoiAlterada()) return true;

        return confirm(
          "Existem alterações não salva. As alterações atuais serão perdidas ao importar. Deseja continuar sem salvar? ",
        );
      }

      function importarFicha(json) {
        window.importarFicha = importarFicha;

        if (!confirmarAlteracoesAntesDeImportar()) return;

        // Se recebeu JSON diretamente, aplica imediatamente
        if (json !== undefined && json !== null) {
          try {
            const dados = typeof json === "string" ? JSON.parse(json) : json;
            if (typeof aplicarDadosFicha === "function") {
              aplicarDadosFicha(dados);
            } else {
              console.warn(
                "aplicarDadosFicha não encontrada; dados lidos:",
                dados,
              );
            }
          } catch (err) {
            console.error("importarFicha: JSON inválido", err);
            alert("Erro: JSON inválido.");
          }
          return;
        }

        // Cria input e label ocultos se não existirem
        let fileInput = document.getElementById("importarFichaInput");
        if (!fileInput) {
          fileInput = document.createElement("input");
          fileInput.type = "file";
          fileInput.accept = ".json,application/json";
          fileInput.id = "importarFichaInput";
          fileInput.style.cssText =
            "position:fixed;top:-9999px;left:-9999px;opacity:0;width:1px;height:1px;";

          const label = document.createElement("label");
          label.htmlFor = "importarFichaInput";
          label.id = "importarFichaLabel";
          label.style.cssText =
            "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;";

          document.body.appendChild(fileInput);
          document.body.appendChild(label);

          fileInput.addEventListener("change", function (evt) {
            const file = evt.target.files && evt.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
              try {
                const dados = JSON.parse(e.target.result);
                if (typeof aplicarDadosFicha === "function") {
                  aplicarDadosFicha(dados);
                } else {
                  console.warn(
                    "aplicarDadosFicha não definida; arquivo lido:",
                    dados,
                  );
                }
              } catch (err) {
                console.error(
                  "importarFicha: erro ao parsear JSON do arquivo",
                  err,
                );
                alert(
                  "Erro ao importar: arquivo inválido. Selecione um arquivo .json exportado pela ficha.",
                );
              } finally {
                try {
                  fileInput.value = "";
                } catch (ignore) {}
              }
            };
            reader.onerror = function (e) {
              console.error("importarFicha: FileReader error", e);
              alert("Erro ao ler o arquivo.");
              try {
                fileInput.value = "";
              } catch (ignore) {}
            };
            reader.readAsText(file, "utf-8");
          });
        }

        // Dispara via label (compatível com file://)
        const label = document.getElementById("importarFichaLabel");
        if (label) {
          label.click();
        } else {
          fileInput.click();
        }
      }
      window.importarFicha = importarFicha;
    
