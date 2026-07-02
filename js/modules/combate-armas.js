
      function obterMaiorAtributoAtaque() {
        const modFor = getModificadorBaseAtributo("for");
        const modDes = getModificadorBaseAtributo("des");
        return modDes > modFor ? "des" : "for";
      }

      function obterConfiguracaoAtributoAtaqueArma(arma = {}) {
        const propriedades = arma?.propriedades || {};
        const usaMunicao = !!(arma?.usaMunicao || propriedades.municao);
        const temAcuidade = !!propriedades.acuidade;

        if (usaMunicao) {
          return {
            valorPadrao: "des",
            podeEscolher: false,
          };
        }

        if (temAcuidade) {
          return {
            valorPadrao: obterMaiorAtributoAtaque(),
            podeEscolher: true,
          };
        }

        return {
          valorPadrao: "for",
          podeEscolher: false,
        };
      }

      function obterAtributoAtaqueSelecionado(slot, arma = null) {
        const config = obterConfiguracaoAtributoAtaqueArma(arma);
        const valorSelecionado = document.getElementById(
          `arma${slot}Ataque`,
        )?.value;
        if (config.podeEscolher && ["for", "des"].includes(valorSelecionado)) {
          return valorSelecionado;
        }
        return config.valorPadrao;
      }

      function normalizarArma(armaBruta = {}, slot = null) {
        if (!armaBruta) return null;

        const nome =
          (armaBruta.nome || armaBruta.arma_nome || "").trim() || "Arma";
        const tipo =
          (armaBruta.tipo || armaBruta.arma_tipo || "").trim() ||
          "Corpo a Corpo/Distância";
        const chaveAtributo = slot
          ? obterAtributoAtaqueSelecionado(slot, armaBruta)
          : obterConfiguracaoAtributoAtaqueArma(armaBruta).valorPadrao;

        const dano =
          [
            armaBruta.dano || armaBruta.arma_dano,
            armaBruta.tipo_dano || armaBruta.arma_tipo_dano,
          ]
            .filter(Boolean)
            .map((v) => v.trim())
            .join(" ") || "-";

        const propriedade =
          montarTextoPropriedadeArma(
            armaBruta,
            resumirMunicaoNoTexto(
              obterResumoPropriedadesArma(armaBruta, false),
            ),
          ) || "-";

        return {
          // 🔹 PADRÃO FINAL
          nome,
          tipo,
          dano,
          propriedade,
          chaveAtributo,
          proficiente: !!armaBruta.proficiente,

          // 🔹 extras
          slot,
          bruto: armaBruta,
        };
      }

      // ============================
      // 1️⃣ Calcula o modificador de ataque baseado no atributo
      // ============================
      function getModificadorBaseAtributo(chaveAtributo) {
        const camposPermitidos = {
          for: "atrib_for",
          des: "atrib_des",
          con: "atrib_con",
          int: "atrib_int",
          sab: "atrib_sab",
          car: "atrib_car",
        };

        const idCampo =
          camposPermitidos[chaveAtributo.toLowerCase()] || camposPermitidos.for;
        const campo = document.getElementById(idCampo);
        if (!campo) {
          console.warn("Campo de atributo não encontrado:", idCampo);
          return 0;
        }

        const valor = parseInt(campo.value.replace(/\+/g, ""), 10);
        if (isNaN(valor)) return 0;

        const mod = Math.floor((valor - 10) / 2);
        return mod;
      }

      // ============================
      // 3️⃣ Obtém todas as armas equipadas ativas
      // ============================
      function obterArmasEquipadasAtivas() {
        const armas = coletarArmas?.() || [];

        return [1, 2]
          .map((slot) => {
            const valorSlot =
              document.getElementById(`arma${slot}Nome`)?.value || "";
            if (!valorSlot || extrairIndiceSlotEscudo(valorSlot) !== null)
              return null;

            const index = parseInt(valorSlot, 10);
            if (!Number.isInteger(index)) return null;

            const arma = armas[index];
            if (!arma) return null;

            const nome = (arma.nome || arma.arma_nome || "").trim();
            if (!nome) return null;
            const atributo = obterAtributoAtaqueSelecionado(slot, arma);

            // 🔥 DANO
            const dano =
              [
                obterTextoDanoArmaPorEmpunhadura(arma, slot),
                arma.arma_tipo_dano,
              ]
                .filter(Boolean)
                .join(" ") || "-";

            // 🔥 PROPRIEDADE COMPLETA
            const propriedade = montarTextoPropriedadeArma
              ? montarTextoPropriedadeArma(
                  arma,
                  resumirMunicaoNoTexto(
                    obterResumoPropriedadesArma(arma, false),
                  ),
                )
              : "-";

            return {
              nome,
              chaveAtributo: atributo,
              ataque: atributo,
              dano,
              propriedade,
              proficiente: !!arma.proficiente,
              usaMunicao: !!arma.propriedades?.municao,
              arma_municao_id: arma.arma_municao_id || null,
              arma_tipo_dano: arma.arma_tipo_dano || "",
              slot,
            };
          })
          .filter(Boolean);
      }

      function atualizarSelectAtaqueArma(slot, arma = null) {
        const select = document.getElementById(`arma${slot}Ataque`);
        if (!select) return;

        if (!arma) {
          select.innerHTML = "";
          ["for", "des"].forEach((valor) => {
            const option = document.createElement("option");
            option.value = valor;
            option.textContent = valor.toUpperCase();
            select.appendChild(option);
          });
          select.value = "for";
          select.disabled = true;
          return;
        }

        const config = obterConfiguracaoAtributoAtaqueArma(arma);
        const valorAnterior = select.dataset.valorBaseCalculado || "";
        const valorAtual = select.value;
        const usuarioPersonalizou =
          config.podeEscolher &&
          ["for", "des"].includes(valorAtual) &&
          valorAtual !== valorAnterior;
        const valorSelecionado = usuarioPersonalizou
          ? valorAtual
          : config.valorPadrao;

        select.innerHTML = "";

        const opcoes = config.podeEscolher
          ? [
              {
                value: "for",
                label: `FOR (${formatarBonusCalculado(getResumoCalculoAtaque(arma, "for").totalAtaque)})`,
              },
              {
                value: "des",
                label: `DES (${formatarBonusCalculado(getResumoCalculoAtaque(arma, "des").totalAtaque)})`,
              },
            ]
          : [
              {
                value: config.valorPadrao,
                label: `${config.valorPadrao.toUpperCase()} (${formatarBonusCalculado(getResumoCalculoAtaque(arma, config.valorPadrao).totalAtaque)})`,
              },
            ];

        opcoes.forEach((op) => {
          const option = document.createElement("option");
          option.value = op.value;
          option.textContent = op.label;
          select.appendChild(option);
        });

        select.value = valorSelecionado;
        select.dataset.valorBaseCalculado = config.valorPadrao;
        select.disabled = !config.podeEscolher;
      }

      function getResumoCalculoAtaque(arma, chaveForcada = null) {
        if (!arma) {
          return { totalAtaque: 0, textoResumo: "-" };
        }

        const nome = arma.nome || "Arma";

        let chave = chaveForcada || arma.ataque || arma.chaveAtributo;
        const config = obterConfiguracaoAtributoAtaqueArma(arma);

        if (!config.podeEscolher || !["for", "des"].includes(chave)) {
          chave = config.valorPadrao;
        }

        const modBase = getModificadorBaseAtributo(chave) || 0;
        const bonusProf = arma.proficiente ? getBonusProf() : 0;

        const total = modBase + bonusProf;

        const formatado = total >= 0 ? `+${total}` : `${total}`;

        const textoResumo = `${chave.toUpperCase()} (${formatado})`;

        return {
          nome,
          chaveAtributo: chave,
          rotuloAtributo: chave.toUpperCase(),
          modBase,
          bonusProf,
          totalAtaque: total,
          textoResumo,
        };
      }

      // ==========================
      // FUNÇÃO: getResumoCalculoAtaque
      // ==========================
      function calcularResumoAtaque(arma = {}, personagem = {}) {
        // 🔹 garante objeto válido
        const armaValida = arma && typeof arma === "object" ? arma : {};

        // 🔹 nome padronizado (LEGADO + NOVO)
        const nomeArma =
          (armaValida.nome || armaValida.arma_nome || "").trim() || "Arma";

        // 🔹 tipo padronizado
        const tipoArma =
          (
            armaValida.tipo ||
            armaValida.propriedade ||
            armaValida.arma_tipo ||
            ""
          ).trim() || "Corpo a Corpo/Distância";

        // 🔹 chave de atributo (corrigida)
        let chaveAttr = armaValida.chaveAtributo || armaValida.ataque || "for";

        if (!["for", "des"].includes(chaveAttr)) {
          console.warn("Chave de atributo inválida, usando 'for'");
          chaveAttr = "for";
        }

        // 🔹 usa NOVO sistema (atrib_for / atrib_des)
        let modBase = 0;

        if (typeof getModificadorBaseAtributo === "function") {
          modBase = getModificadorBaseAtributo(chaveAttr) || 0;
        } else {
          console.warn("getModificadorBaseAtributo não encontrada");
        }

        // 🔹 proficiência
        const prof = !!armaValida.proficiente;
        const bonusProf = prof ? personagem?.bonusProf || 0 : 0;

        const totalAtk = modBase + bonusProf;

        // 🔹 texto formatado (evita undefined na UI)
        const textoResumo = (totalAtk >= 0 ? "+" : "") + totalAtk;

        const resumo = {
          nome: nomeArma,
          tipo: tipoArma,
          chaveAtributo: chaveAttr,
          modBase,
          proficiente: prof,
          bonusProf,
          totalAtaque: totalAtk,
          textoResumo,
        };

        return resumo;
      }

      function calcularBonusProf(nivel) {
        nivel = parseInt(nivel, 10) || 1;

        if (nivel >= 17) return 6;
        if (nivel >= 13) return 5;
        if (nivel >= 9) return 4;
        if (nivel >= 5) return 3;
        return 2;
      }

      function getBonusProf() {
        const nivel = document.getElementById("classeNivelID")?.value;
        return calcularBonusProf(nivel);
      }
    
