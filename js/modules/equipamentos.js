
      // ===== Lógica de Munição Dinâmica =====
      function atualizarTodasMunicoesArmas() {
        const armasItens = document.querySelectorAll(
          '#listaArmas .item-card[data-tipo="arma"]',
        );

        armasItens.forEach((card) => {
          atualizarOpcoesMunicao(card);
        });
      }

      // atualizar munição
      function atualizarOpcoesMunicao(card) {
        if (!card) return;

        const selectMunicao = card.querySelector(
          '[data-campo="arma_municao_id"]',
        );
        if (!selectMunicao) return;

        // 🔹 PASSO 1: guardar valor atual
        const valorAtual = selectMunicao.value;

        selectMunicao.innerHTML = '<option value="">Sem Munição</option>';

        const outrosItens = document.querySelectorAll(
          '#listaOutros .item-card[data-tipo="outro"]',
        );

        outrosItens.forEach((item) => {
          const tipo = item.querySelector('[data-campo="outro_tipo"]')?.value;
          const nome = item.querySelector('[data-campo="outro_nome"]')?.value;
          const inputQuantidade = item.querySelector(
            '[data-campo="outro_quantidade"]',
          );
          const quantidade = inputQuantidade ? inputQuantidade.value : "";

          let id = item.dataset.id;

          if (tipo?.toLowerCase() === "municao" && nome) {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = `${quantidade || "-"} ${nome}`;

            selectMunicao.appendChild(option);
          }
        });

        // 🔹 PASSO 2: restaurar valor
        // 🔹 restaurar seleção corretamente
        let encontrou = false;

        for (let option of selectMunicao.options) {
          if (option.value === valorAtual) {
            option.selected = true;
            encontrou = true;
          } else {
            option.selected = false;
          }
        }

        // 🔹 fallback
        if (!encontrou) {
          selectMunicao.selectedIndex = 0;
        }
      }

      //CONSUMIR MUNISSÃO AO ATACAR
      function consumirMunicao(
        quantidadeGasta = 1,
        arma = estadoAtaqueArma.arma,
      ) {
        if (!arma?.usaMunicao) {
          return;
        }

        const idMunicao = arma.arma_municao_id;

        const itens = document.querySelectorAll(
          '#listaOutros .item-card[data-tipo="outro"]',
        );

        const item = [...itens].find(
          (itemInventario) => itemInventario.dataset.id === idMunicao,
        );

        if (!item) {
          return;
        }

        const inputQtd = item.querySelector('[data-campo="outro_quantidade"]');

        let atual = parseInt(inputQtd.value) || 0;

        if (atual <= 0) {
          alert("Sem munição!");
          return;
        }

        atual -= quantidadeGasta;
        if (atual < 0) atual = 0;

        inputQtd.value = atual;

        // 🔥 IMPORTANTE: dispara atualização
        inputQtd.dispatchEvent(new Event("change"));

        // 🔥 Atualiza selects
        document
          .querySelectorAll('.item-card[data-tipo="arma"]')
          .forEach((card) => {
            atualizarOpcoesMunicao(card);
          });
      }

      document
        .querySelectorAll('.item-card[data-tipo="arma"]')
        .forEach((card) => {
          atualizarOpcoesMunicao(card);
        });
      //Atualizar automaticamente quando mudar
      document.addEventListener("change", (e) => {
        if (
          e.target.matches(
            '[data-campo="outro_tipo"], [data-campo="outro_nome"], [data-campo="outro_quantidade"]',
          )
        ) {
          document
            .querySelectorAll('.item-card[data-tipo="arma"]')
            .forEach((card) => {
              atualizarOpcoesMunicao(card);
            });
        }
      });

      // ===== Arsenal cadastrado e inventario de armas =====
      function getTemProficienciaArma(tipo) {
        if (tipo === "Simples")
          return !!document.getElementById("profArmaSimples")?.checked;
        if (tipo === "Marcial")
          return !!document.getElementById("profArmaMarciais")?.checked;
        return false;
      }

      function getTemProficienciaArmadura(tipo) {
        if (tipo === "Leve")
          return !!document.getElementById("profArmaduraLeves")?.checked;
        if (tipo === "Media")
          return !!document.getElementById("profArmaduraMedias")?.checked;
        if (tipo === "Pesada")
          return !!document.getElementById("profArmaduraPesadas")?.checked;
        return false;
      }

      function getTemProficienciaEscudo(tipo) {
        if (tipo === "Escudo")
          return !!document.getElementById("profEscudos")?.checked;
        return true;
      }

      function getValorPesoItem(valor) {
        const texto = String(valor || "")
          .trim()
          .replace(",", ".");
        const numero = parseFloat(texto);
        return Number.isFinite(numero) ? numero : 0;
      }

      function atualizarPesoAtualInventario() {
        const campoPesoAtual = document.getElementById("pesoAtual");
        if (!campoPesoAtual) return;

        const totalArmas = coletarArmas().reduce(
          (soma, arma) => soma + getValorPesoItem(arma.arma_peso),
          0,
        );
        const totalArmaduras = coletarArmaduras().reduce(
          (soma, armadura) => soma + getValorPesoItem(armadura.armadura_peso),
          0,
        );
        const totalEscudos = coletarEscudos().reduce(
          (soma, escudo) => soma + getValorPesoItem(escudo.escudo_peso),
          0,
        );
        const totalOutros = coletarOutros().reduce((soma, outro) => {
          const quantidade = Math.max(
            1,
            parseInt(outro.outro_quantidade, 10) || 1,
          );
          return soma + getValorPesoItem(outro.outro_peso) * quantidade;
        }, 0);
        const total = totalArmas + totalArmaduras + totalEscudos + totalOutros;

        campoPesoAtual.value = Number.isInteger(total)
          ? total
          : total.toFixed(2).replace(/\.?0+$/, "");
      }

      function atualizarListaArmasEquipamento() {
        renderizarArmasEquipamento(coletarArmas());
        renderizarArmadurasEquipamento(coletarArmaduras());
        renderizarEscudosEquipamento(coletarEscudos());
        renderizarOutrosEquipamento(coletarOutros());
        atualizarTodasMunicoesArmas();
        atualizarSelectNomeArmaduraEquipada(
          coletarArmaduras(),
          armaduraEquipadaIndice,
        );
        atualizarTitulosInventario();
      }

      function obterTextoDanoArma(arma) {
        if (!arma) return "";

        const danoUmaMao = arma.dano_1?.trim() || "";
        const danoDuasMaos = arma.dano_2?.trim() || "";
        const propriedades = arma.propriedades || {};

        if (danoUmaMao && danoDuasMaos) {
          return `${danoUmaMao}/${danoDuasMaos}`;
        }

        if (propriedades.versatil && (danoUmaMao || danoDuasMaos)) {
          return [danoUmaMao, danoDuasMaos].filter(Boolean).join("/");
        }

        if (danoUmaMao || danoDuasMaos) {
          return [danoUmaMao, danoDuasMaos].filter(Boolean).join("/");
        }

        if (propriedades.versatil && (arma.dano_1 || arma.dano_2)) {
          return [arma.dano_1, arma.dano_2].filter(Boolean).join("/");
        }

        return (
          arma.arma_dano?.trim() ||
          [arma.dano_1, arma.dano_2].filter(Boolean).join("/")
        );
      }

      function obterTextoDanoArmaPorEmpunhadura(arma, slot = 1) {
        if (!arma) return "";

        const danoUmaMao = arma.dano_1?.trim() || "";
        const danoDuasMaos = arma.dano_2?.trim() || "";
        const propriedades = arma.propriedades || {};

        if (!propriedades.versatil) {
          return obterTextoDanoArma(arma);
        }

        const usandoDuasMaos =
          slot === 1 && estadoCombate?.maoPrincipal?.modo === "duas_maos";
        if (usandoDuasMaos) {
          return danoDuasMaos || danoUmaMao || obterTextoDanoArma(arma);
        }

        return danoUmaMao || danoDuasMaos || obterTextoDanoArma(arma);
      }

      function obterResumoPropriedadesArma(arma, incluirDescricao = false) {
        const propriedades = arma.propriedades || {};
        const listaPropriedades = [];
        const tipoArma = arma.arma_tipo?.trim() || "";

        if (tipoArma) listaPropriedades.push(tipoArma);

        if (propriedades.acuidade) listaPropriedades.push("Acuidade");
        if (propriedades.alcance) listaPropriedades.push("Alcance");
        if (propriedades.arremesso) listaPropriedades.push("Arremesso");
        if (propriedades.carregamento) listaPropriedades.push("Carregamento");
        if (propriedades.duas_maos) listaPropriedades.push("Duas Mãos");
        if (propriedades.leve) listaPropriedades.push("Leve");
        if (propriedades.pesada) listaPropriedades.push("Pesada");
        if (propriedades.versatil) listaPropriedades.push("Versátil");
        if (propriedades.especial) listaPropriedades.push("Especial");

        const distCurta = arma.arma_dist_curto?.trim();
        const distLonga = arma.arma_dist_longo?.trim();
        if (
          (propriedades.arremesso || propriedades.municao) &&
          (distCurta || distLonga)
        ) {
          listaPropriedades.push(
            `Distância (${distCurta || "-"}/${distLonga || "-"})`,
          );
        }

        if (propriedades.municao) {
          let textoMunicao = "Munição";
          const idMunicao = arma.arma_municao_id;

          if (idMunicao) {
            const item = [
              ...document.querySelectorAll(
                '#listaOutros .item-card[data-tipo="outro"]',
              ),
            ].find((el) => el.dataset.id === idMunicao);

            const nome = item?.querySelector(
              '[data-campo="outro_nome"]',
            )?.value;
            const qtd = item?.querySelector(
              '[data-campo="outro_quantidade"]',
            )?.value;

            if (nome) {
              textoMunicao += ` (${qtd || "-"} ${nome})`;
            }
          }

          listaPropriedades.push(textoMunicao);
        }

        return listaPropriedades.join(", ");
      }

      function formatarArma(arma) {
        const nome = arma.nome?.trim() || "Arma sem nome";
        const tipo = arma.arma_tipo_dano?.trim() || "-";
        const tipoArma = arma.arma_tipo?.trim() || "";
        const danoUmaMao = arma.dano_1?.trim() || "";
        const danoDuasMaos = arma.dano_2?.trim() || "";
        const propriedades = arma.propriedades || {};

        const proficiente =
          typeof arma.proficiente === "boolean"
            ? arma.proficiente
            : getTemProficienciaArma(tipoArma);

        const dano = propriedades.versatil
          ? [danoUmaMao, danoDuasMaos].filter(Boolean).join("/") ||
            obterTextoDanoArma(arma) ||
            "-"
          : obterTextoDanoArma(arma) || "-";

        const emojiProf = proficiente
          ? `<span title="Proficiente">🅿️<br>💥</span>`
          : `<span title="Não proficiente">⛔<br>💥</span>`;

        const linha1 = `${nome} ${emojiProf} ${dano} ${tipo}`;

        return {
          linha1,
          linha2: obterResumoPropriedadesArma(arma, true),
          proficiente,
        };
      }

      function renderizarArmasEquipamento(listaArmas) {
        const container = document.getElementById("lista-armas-equipamento");
        if (!container) return;

        // mantém seleção atual
        const selecionados = new Set(
          Array.from(container.querySelectorAll("input:checked")).map(
            (input) => input.dataset.index,
          ),
        );

        container.innerHTML = "";

        listaArmas.forEach((arma, index) => {
          if (!arma) return;

          const nome = String(arma?.nome ?? arma?.arma_nome ?? "").trim();
          if (!nome) return;

          const { linha1, linha2, proficiente } = formatarArma({
            ...arma,
            nome,
            arma_nome: nome,
          });

          const div = document.createElement("div");
          div.classList.add("arma-equipamento");

          const label = document.createElement("label");
          if (!proficiente) {
            label.classList.add("arma-equipamento-nao-proficiente");
          }

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.dataset.index = String(index);
          checkbox.setAttribute(
            "aria-label",
            "Selecionar arma para equipamento",
          );
          checkbox.checked = selecionados.has(String(index));

          checkbox.addEventListener("change", () => {
            const marcados = Array.from(
              container.querySelectorAll("input:checked"),
            );

            if (marcados.length > 2) {
              checkbox.checked = false;
              sincronizarEquipamentosCombate();
              return;
            }

            sincronizarEquipamentosCombate();
          });

          const textoPrincipal = document.createElement("span");
          textoPrincipal.innerHTML = linha1;

          const quebra = document.createElement("br");

          const textoSecundario = document.createElement("small");
          textoSecundario.textContent = linha2;

          const separador = document.createElement("hr");

          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(" "));
          label.appendChild(textoPrincipal);
          label.appendChild(quebra);
          label.appendChild(textoSecundario);

          div.appendChild(label);
          div.appendChild(separador);

          container.appendChild(div);
        });

        // re-sincroniza seleção
        if (selecionados.size) {
          sincronizarEquipamentosCombate();
        }
      }
      /**
       * Calcula o CA total aplicando o tipo de bônus sobre o CA base.
       *
       * @param {number|string} caBase - CA base da armadura (ex: 14 ou "14").
       * @param {string} bonusTipo - "0", "DES" ou "DES Max 2".
       * @param {number} modDestreza - modificador de Destreza do personagem (ex: 0, 1, -1).
       * @returns {number} CA total (inteiro).
       */
      function calcularCATotal(caBase, bonusTipo, modDestreza) {
        // Normaliza e valida CA base
        const ca = Number(caBase);
        const baseValida = Number.isFinite(ca) ? Math.floor(ca) : 0;

        // Normaliza modificador de Destreza
        const modDex = Number.isFinite(Number(modDestreza))
          ? Math.trunc(Number(modDestreza))
          : 0;

        // Determina bônus conforme tipo
        let bonus = 0;
        const tipo = String(bonusTipo ?? "0").trim();

        if (tipo === "DES") {
          bonus = modDex;
        } else if (tipo === "DES Max 2" || tipo.toUpperCase() === "DES MAX 2") {
          // limita o bônus de Destreza a no máximo 2 (mas permite valores negativos)
          bonus = Math.min(modDex, 2);
        } else {
          // qualquer outro valor (incluindo "0") => sem bônus
          bonus = 0;
        }

        return baseValida + bonus;
      }

      function formatarArmaduraEquipamento(armadura, modDestreza = 0) {
        const nome = armadura?.armadura_nome?.trim() || "Armadura sem nome";
        const caRawStr = (armadura?.armadura_ca ?? "0").toString().trim();
        const bonusRaw = (armadura?.armadura_bonus ?? "0").toString().trim();
        const furtividade = armadura?.armadura_furtividade?.trim() || "Normal";
        const tipo = armadura?.armadura_tipo?.trim() || "-";

        const caBase = Number(caRawStr.replace(/[^\d\-+.]/g, ""));
        const caBaseValida = Number.isFinite(caBase) ? Math.trunc(caBase) : 0;
        const modDex = Number.isFinite(Number(modDestreza))
          ? Math.trunc(Number(modDestreza))
          : 0;

        const bonusTipo = String(bonusRaw).trim().toUpperCase();
        let bonusAplicado = 0;
        if (bonusTipo === "DES") bonusAplicado = modDex;
        else if (
          bonusTipo === "DES MAX 2" ||
          bonusTipo === "DESMAX2" ||
          bonusTipo === "DES MAX2"
        )
          bonusAplicado = Math.min(modDex, 2);
        else bonusAplicado = 0;

        const caTotal = caBaseValida + bonusAplicado;

        const proficiente =
          typeof armadura?.proficiente === "boolean"
            ? armadura.proficiente
            : typeof getTemProficienciaArmadura === "function"
              ? getTemProficienciaArmadura(tipo)
              : false;

        const emojiProf = proficiente
          ? `<span title="Proficiente">🅿️<br></span>`
          : `<span title="Não proficiente">⛔<br></span>`;

        return {
          nome,
          linha1: `${nome} ${emojiProf} 👕 ${caTotal} (${caBaseValida} + ${bonusAplicado})`,
          linha2: `Tipo: ${tipo} | CA base: ${caBaseValida} | Bônus: ${bonusRaw} | Furtividade: ${furtividade}`,
          proficiente,
          caBase: caBaseValida,
          caBonusTipo: bonusRaw,
          caBonusAplicado: bonusAplicado,
          caTotal,
          tipo,
        };
      }

      // utilitário para calcular modificador a partir do valor do atributo
      function calcularModificadorAtributo(valorAtributo) {
        const v = Number(valorAtributo);
        if (!Number.isFinite(v)) return 0;
        return Math.floor((v - 10) / 2);
      }

      // função que atualiza os campos da armadura selecionada
      function atualizarCamposArmaduraSelecionada(armaduraSelecionada) {
        try {
          armaduraSelecionadaAtual = armaduraSelecionada || null;

          const desValorRaw =
            document.getElementById("atrib_des")?.value ??
            document.getElementById("des")?.value ??
            null;
          const modDestreza =
            desValorRaw !== null && desValorRaw !== ""
              ? Math.floor((Number(desValorRaw) - 10) / 2)
              : 0;

          const info = armaduraSelecionada
            ? formatarArmaduraEquipamento(armaduraSelecionada, modDestreza)
            : null;
          const caSemArmadura = 10 + modDestreza;

          if (typeof aplicarEstiloProficienciaCampos === "function") {
            aplicarEstiloProficienciaCampos(
              ["armaduraCA", "armaduraFurtividade"],
              info ? info.proficiente : null,
            );
          }

          const elCA = document.getElementById("armaduraCA");
          const elFurt = document.getElementById("armaduraFurtividade");
          const elLinha2 = document.getElementById("armaduraLinha2");

          if (elCA) {
            if ("value" in elCA)
              elCA.value = info ? String(info.caTotal) : String(caSemArmadura);
            else
              elCA.textContent = info
                ? String(info.caTotal)
                : String(caSemArmadura);
          }
          if (elFurt) {
            if ("value" in elFurt)
              elFurt.value = info
                ? armaduraSelecionada.armadura_furtividade || "Normal"
                : "Normal";
            else
              elFurt.textContent = info
                ? armaduraSelecionada.armadura_furtividade || "Normal"
                : "Normal";
          }
          if (elLinha2)
            elLinha2.textContent = info
              ? `Tipo: ${info.tipo || "-"} | CA base: ${info.caBase} | Bônus: ${info.caBonusTipo}`
              : `Sem armadura | CA: 10 + ${modDestreza} (DES)`;

          if (typeof atualizarClasseArmaduraEquipada === "function")
            atualizarClasseArmaduraEquipada();
        } catch (err) {
          console.error("Erro em atualizarCamposArmaduraSelecionada", err);
        }
      }

      // quando mudar a armadura equipada pelo select
      document
        .getElementById("armaduraNome")
        ?.addEventListener("change", function () {
          const indice = this.value !== "" ? parseInt(this.value, 10) : null;
          equiparArmadura(indice);
        });

      function obterResumoCombateArma(arma) {
        if (!arma) return "";

        const propriedades = arma.propriedades || {};
        const listaPropriedades = [];
        const tipoArma = arma.arma_tipo?.trim();
        const distCurta = arma.arma_dist_curto?.trim();
        const distLonga = arma.arma_dist_longo?.trim();

        if (tipoArma) listaPropriedades.push(tipoArma);
        if (propriedades.acuidade) listaPropriedades.push("Acuidade");
        if (propriedades.alcance) listaPropriedades.push("Alcance");
        if (propriedades.arremesso) listaPropriedades.push("Arremesso");
        if (propriedades.carregamento) listaPropriedades.push("Carregamento");
        if (propriedades.duas_maos) listaPropriedades.push("Duas Mãos");
        if (propriedades.leve) listaPropriedades.push("Leve");
        if (propriedades.pesada) listaPropriedades.push("Pesada");
        if (propriedades.versatil) listaPropriedades.push("Versátil");
        if (propriedades.especial) listaPropriedades.push("Especial");

        // Distância
        if (
          (propriedades.arremesso || propriedades.municao) &&
          (distCurta || distLonga)
        ) {
          listaPropriedades.push(
            `Distância (${distCurta || "-"}/${distLonga || "-"})`,
          );
        }

        // 🔥 MUNIÇÃO DINÂMICA (CORRETA)
        if (propriedades.municao) {
          let textoFinal = "Munição";

          const idMunicao = arma.arma_municao_id;

          if (idMunicao) {
            const item = [
              ...document.querySelectorAll(
                '#listaOutros .item-card[data-tipo="outro"]',
              ),
            ].find((el) => el.dataset.id === idMunicao);

            const nome = item?.querySelector(
              '[data-campo="outro_nome"]',
            )?.value;
            const qtd = item?.querySelector(
              '[data-campo="outro_quantidade"]',
            )?.value;

            if (nome) {
              textoFinal = `Munição (${qtd || "-"} ${nome})`;
            }
          }

          listaPropriedades.push(textoFinal);
        }
        return listaPropriedades.join(", ");
      }

      function limparTextoCombate(texto) {
        return String(texto || "")
          .split(",")
          .map((parte) => parte.trim())
          .filter(
            (parte) =>
              parte &&
              !parte.startsWith("Preço:") &&
              !parte.startsWith("Peso:"),
          )
          .join(", ");
      }

      function formatarEscudoEquipamento(escudo) {
        const nome = escudo.escudo_nome?.trim() || "Escudo sem nome";
        const ca = escudo.escudo_ca?.trim() || "+0";
        const tipo = escudo.escudo_tipo?.trim() || "-";
        const proficiente =
          typeof escudo.proficiente === "boolean"
            ? escudo.proficiente
            : getTemProficienciaEscudo(tipo);

        return {
          linha1: `${nome} ${proficiente ? "🅿️" : "⛔"} ${ca}`,
          linha2: `Tipo: ${tipo}`,
          proficiente,
        };
      }

      function formatarOutroEquipamento(outro) {
        const nome = outro.outro_nome?.trim() || "Item sem nome";
        const tipo = outro.outro_tipo?.trim() || "Outros";
        const quantidade = Math.max(
          1,
          parseInt(outro.outro_quantidade, 10) || 1,
        );

        return {
          linha1: `${nome} x${quantidade}`,
          linha2: `Tipo: ${tipo}`,
        };
      }

      function renderizarListaEquipamento({
        containerId,
        itens,
        formatarItem,
        inputType,
        inputName,
        ariaLabel,
        multiplo = false,
        filtroItem = null,
        maxSelecoes = null,
        selecionadoPorPadrao = null,
        aoAlterarSelecao = null,
        preservarSelecaoAtual = true,
      }) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const selecionados = Array.from(
          container.querySelectorAll("input:checked"),
        ).map((input) => input.dataset.index);
        container.innerHTML = "";

        itens.forEach((item, index) => {
          if (filtroItem && !filtroItem(item)) return;

          const { linha1, linha2, proficiente } = formatarItem(item);

          const div = document.createElement("div");

          div.classList.add("arma-equipamento");

          const label = document.createElement("label");
          if (proficiente === false)
            label.classList.add("arma-equipamento-nao-proficiente");

          const input = document.createElement("input");
          input.type = inputType;
          if (inputName) input.name = inputName;
          input.dataset.index = String(index);
          input.setAttribute("aria-label", ariaLabel);
          const jaEstavaSelecionado =
            preservarSelecaoAtual &&
            (multiplo
              ? selecionados.includes(String(index))
              : selecionados[0] === String(index));
          const marcarPorPadrao =
            !jaEstavaSelecionado && typeof selecionadoPorPadrao === "function"
              ? !!selecionadoPorPadrao(item, index)
              : false;
          input.checked = jaEstavaSelecionado || marcarPorPadrao;
          input.addEventListener("change", () => {
            if (input.checked && maxSelecoes) {
              const marcados = Array.from(
                container.querySelectorAll("input:checked"),
              );
              if (marcados.length > maxSelecoes) {
                input.checked = false;
                sincronizarEquipamentosCombate();
                return;
              }
            }

            if (!multiplo && input.checked) {
              container.querySelectorAll("input").forEach((outroInput) => {
                if (outroInput !== input) outroInput.checked = false;
              });
            }

            if (containerId === "lista-escudos-equipamento") {
              const selectSecundario = document.getElementById("arma2Nome");
              if (selectSecundario) {
                if (input.checked) {
                  selectSecundario.value = criarValorSlotEscudo(index);
                } else if (
                  extrairIndiceSlotEscudo(selectSecundario.value) === index
                ) {
                  selectSecundario.value = "";
                }
              }
            }

            if (typeof aoAlterarSelecao === "function") {
              aoAlterarSelecao({ input, item, index, containerId });
            }

            sincronizarEquipamentosCombate();
          });

          const textoPrincipal = document.createElement("span");
          textoPrincipal.innerHTML = linha1;
          const quebra = document.createElement("br");
          const textoSecundario = document.createElement("small");
          textoSecundario.textContent = linha2;
          const separador = document.createElement("hr");

          label.appendChild(input);
          label.appendChild(document.createTextNode(" "));
          label.appendChild(textoPrincipal);
          label.appendChild(quebra);
          label.appendChild(textoSecundario);
          div.appendChild(label);
          div.appendChild(separador);

          container.appendChild(div);
        });

        if (container.querySelector("input:checked"))
          sincronizarEquipamentosCombate();
      }

      function renderizarArmadurasEquipamento(listaArmaduras) {
        const desValor =
          Number(
            document.getElementById("atrib_des")?.value ??
              document.getElementById("des")?.value,
          ) || 0;
        const modDexAtual = Math.floor((desValor - 10) / 2);
        renderizarListaEquipamento({
          containerId: "lista-armaduras-equipamento",
          itens: listaArmaduras,
          formatarItem: (armadura) =>
            formatarArmaduraEquipamento(armadura, modDexAtual),
          inputType: "checkbox",
          inputName: "equipamento-armadura",
          ariaLabel: "Selecionar armadura para equipamento",
          filtroItem: (armadura) => !!armadura?.armadura_nome?.trim(),
          maxSelecoes: 1,
          preservarSelecaoAtual: false,
          selecionadoPorPadrao: (_armadura, index) =>
            normalizarIndiceEquipamento(armaduraEquipadaIndice) === index,
          aoAlterarSelecao: ({ input, index }) => {
            equiparArmadura(input.checked ? index : null, {
              armaduras: listaArmaduras,
            });
          },
        });
      }

      function renderizarEscudosEquipamento(listaEscudos) {
        renderizarListaEquipamento({
          containerId: "lista-escudos-equipamento",
          itens: listaEscudos,
          formatarItem: formatarEscudoEquipamento,
          inputType: "checkbox",
          inputName: "equipamento-escudo",
          ariaLabel: "Selecionar escudo para equipamento",
          filtroItem: (escudo) => !!escudo?.escudo_nome?.trim(),
          maxSelecoes: 1,
        });
      }

      function renderizarOutrosEquipamento(listaOutros) {
        const idsPocoesAtuais = new Set(
          (listaOutros || [])
            .filter(
              (outro) =>
                String(outro?.outro_tipo || "")
                  .trim()
                  .toLowerCase() === "pocao",
            )
            .map((outro) => outro.id),
        );
        idsPocoesDesequipadasManualmente.forEach((id) => {
          if (!idsPocoesAtuais.has(id))
            idsPocoesDesequipadasManualmente.delete(id);
        });

        renderizarListaEquipamento({
          containerId: "lista-outros-equipamento",
          itens: listaOutros,
          formatarItem: formatarOutroEquipamento,
          inputType: "checkbox",
          inputName: "equipamento-outro",
          ariaLabel: "Selecionar outro item para equipamento",
          multiplo: true,
          filtroItem: (outro) => !!outro?.outro_nome?.trim(),
          selecionadoPorPadrao: (outro) => {
            const ehPocao =
              String(outro?.outro_tipo || "")
                .trim()
                .toLowerCase() === "pocao";
            return ehPocao && !idsPocoesDesequipadasManualmente.has(outro.id);
          },
          aoAlterarSelecao: ({ input, item }) => {
            const ehPocao =
              String(item?.outro_tipo || "")
                .trim()
                .toLowerCase() === "pocao";
            if (!ehPocao || !item?.id) return;

            if (input.checked) idsPocoesDesequipadasManualmente.delete(item.id);
            else idsPocoesDesequipadasManualmente.add(item.id);
          },
        });
      }

      function preencherCampo(id, valor) {
        const campo = document.getElementById(id);
        if (!campo) return;
        if ("value" in campo) campo.value = valor;
        else campo.textContent = valor;
      }

      function obterTextoCampoOuBloco(id) {
        const campo = document.getElementById(id);
        if (!campo) return "";
        if ("value" in campo) return campo.value?.trim() || "";
        return campo.textContent?.trim() || "";
      }

      function limparPrefixoPropriedade(texto) {
        return String(texto || "")
          .replace(/^Propriedade:\s*/i, "")
          .trim();
      }

      function resumirMunicaoNoTexto(texto) {
        return String(texto || "").replace(/Muni[^(,]*\([^)]*\)/i, "Munição");
      }

      function obterStatusMunicaoArma(arma) {
        if (!arma?.usaMunicao) return "";

        const itemMunicao = [
          ...document.querySelectorAll(
            '#listaOutros .item-card[data-tipo="outro"]',
          ),
        ].find((item) => item.dataset.id === arma.arma_municao_id);

        const nomeMunicao = itemMunicao
          ?.querySelector('[data-campo="outro_nome"]')
          ?.value?.trim();
        const quantidadeMunicao = itemMunicao
          ?.querySelector('[data-campo="outro_quantidade"]')
          ?.value?.trim();

        if (!arma.arma_municao_id || !nomeMunicao) {
          return "SEM MUNIÇÃO";
        }

        return `Munição: ${quantidadeMunicao || "0"} ${nomeMunicao}`;
      }

      function montarTextoPropriedadeArma(arma, textoBase) {
        const textoSemPrefixo = limparPrefixoPropriedade(textoBase);
        const partes = limparTextoCombate(textoSemPrefixo)
          .split(",")
          .map((parte) => parte.trim())
          .filter(Boolean)
          .filter((parte) => normalizarTextoComparacao(parte) !== "municao");

        return partes.join(", ");
      }

      function preencherMunicaoEquipada(slot, arma) {
        const linha = document.getElementById(`arma${slot}MunicaoLinha`);
        const select = document.getElementById(`arma${slot}MunicaoSelect`);
        if (!linha || !select) return;

        const usaMunicao = !!(arma?.usaMunicao || arma?.propriedades?.municao);
        if (!usaMunicao) {
          linha.classList.add("oculto");
          select.innerHTML = "";
          return;
        }

        linha.classList.remove("oculto");
        const valorAtual = arma?.arma_municao_id
          ? String(arma.arma_municao_id)
          : "";
        select.innerHTML = '<option value="">Sem Munição</option>';

        document
          .querySelectorAll('#listaOutros .item-card[data-tipo="outro"]')
          .forEach((item) => {
            const tipo = item.querySelector('[data-campo="outro_tipo"]')?.value;
            const nome = item
              .querySelector('[data-campo="outro_nome"]')
              ?.value?.trim();
            const quantidade = item
              .querySelector('[data-campo="outro_quantidade"]')
              ?.value?.trim();
            const id = item.dataset.id;

            if (String(tipo || "").toLowerCase() !== "municao" || !nome || !id)
              return;

            const option = document.createElement("option");
            option.value = id;
            option.textContent = `${quantidade || "-"} ${nome}`;
            select.appendChild(option);
          });

        select.value = Array.from(select.options).some(
          (option) => option.value === valorAtual,
        )
          ? valorAtual
          : "";
      }

      function capitalizarTexto(texto) {
        const valor = String(texto || "").trim();
        return valor ? valor.charAt(0).toUpperCase() + valor.slice(1) : "";
      }

      function preencherPropriedadeEquipada(id, valor) {
        const campo = document.getElementById(id);
        if (!campo) return;

        const texto = limparTextoCombate(limparPrefixoPropriedade(valor));
        campo.classList.toggle("vazia", !texto);
        campo.innerHTML = texto
          ? `<span class="equipados-propriedade-rotulo">Propriedade:</span> ${texto}`
          : "";
      }

      function formatarBonusCalculado(valor) {
        return valor >= 0 ? `+${valor}` : String(valor);
      }

      function getModificadorAtributoBase(chave) {
        const valor = parseInt(document.getElementById(chave)?.value, 10) || 0;
        return Math.floor((valor - 10) / 2);
      }

      function atualizarSeletoresAtaqueEquipados() {
        const armas = coletarArmas();
        const armasSelecionadas = [1, 2].map((slot) => {
          const valorSlot =
            document.getElementById(`arma${slot}Nome`)?.value || "";
          if (!valorSlot || extrairIndiceSlotEscudo(valorSlot) !== null)
            return null;

          const indiceArma = parseInt(valorSlot, 10);
          return Number.isInteger(indiceArma)
            ? armas[indiceArma] || null
            : null;
        });

        atualizarSelectAtaqueArma(1, armasSelecionadas[0] || null);
        atualizarSelectAtaqueArma(2, armasSelecionadas[1] || null);

        [1, 2].forEach((indice) => {
          const selectAtaque = document.getElementById(`arma${indice}Ataque`);
          const valorSlot =
            document.getElementById(`arma${indice}Nome`)?.value || "";
          if (!selectAtaque) return;
          if (extrairIndiceSlotEscudo(valorSlot) !== null || !valorSlot) {
            selectAtaque.disabled = true;
            return;
          }

          const indiceArma = parseInt(valorSlot, 10);
          const arma = Number.isInteger(indiceArma) ? armas[indiceArma] : null;
          if (!arma) {
            selectAtaque.disabled = true;
            return;
          }

          selectAtaque.disabled =
            !obterConfiguracaoAtributoAtaqueArma(arma).podeEscolher;
        });
      }

      function obterIndicesArmasMarcadas() {
        return Array.from(
          document.querySelectorAll("#lista-armas-equipamento input:checked"),
        )
          .slice(0, 2)
          .map((input) => parseInt(input.dataset.index, 10))
          .filter((indice) => Number.isInteger(indice));
      }

      function atualizarSelectNomeArmaEquipada(
        indiceSlot,
        armas = [],
        indiceSelecionado,
        escudos = [],
      ) {
        const select = document.getElementById(`arma${indiceSlot}Nome`);
        if (!select) return;

        // 🔥 limpa UMA vez só
        select.innerHTML = "";

        const placeholder =
          indiceSlot === 1 ? "Mão Principal" : "Mão Secundária / Escudo";

        // 🔹 opção vazia
        const opcaoVazia = document.createElement("option");
        opcaoVazia.value = "";
        opcaoVazia.textContent = placeholder;
        select.appendChild(opcaoVazia);

        // 🛡️ ESCUDOS (somente slot 2)
        if (indiceSlot === 2) {
          escudos.forEach((escudo, indiceEscudo) => {
            const nomeEscudo = (
              escudo?.nome ||
              escudo?.escudo_nome ||
              ""
            ).trim();
            if (!nomeEscudo) return;

            const option = document.createElement("option");
            option.value = criarValorSlotEscudo(indiceEscudo);
            option.dataset.nomeItem = nomeEscudo;

            const ca = (escudo?.ca || escudo?.escudo_ca || "+0").trim();

            option.textContent = `🛡️ ${nomeEscudo} ${ca}`;
            select.appendChild(option);
          });
        }

        // ⚔️ ARMAS
        armas.forEach((arma, indice) => {
          const nome = String(arma?.nome ?? arma?.arma_nome ?? "").trim();
          if (!nome) return;

          const option = document.createElement("option");
          option.value = String(indice);
          option.dataset.nomeItem = nome;

          const icone = arma?.propriedades?.municao ? "🏹" : "⚔️";
          option.textContent = `${icone} ${nome}`;

          select.appendChild(option);
        });

        // 🎯 seleção atual
        const valorSelecionado =
          indiceSelecionado !== null && indiceSelecionado !== undefined
            ? String(indiceSelecionado)
            : "";
        const existe = Array.from(select.options).some(
          (option) => option.value === valorSelecionado,
        );

        select.value = existe ? valorSelecionado : "";
      }

      function getNomeArmaSeguro(arma) {
        if (!arma) return "";

        // prioridade absoluta: padrão novo
        let nome = "";

        if (typeof arma.nome === "string") {
          nome = arma.nome.trim();
        }

        // fallback legado (UMA ÚNICA VEZ)
        if (!nome && typeof arma.arma_nome === "string") {
          nome = arma.arma_nome.trim();
        }

        // 🔥 padroniza permanentemente o objeto
        if (nome) {
          arma.nome = nome;
        }

        return nome;
      }

      function atualizarSelectNomeArmaduraEquipada(
        armaduras,
        indiceSelecionado,
      ) {
        const select = document.getElementById("armaduraNome");
        if (!select) return;

        const valorAtual = select.value;
        select.innerHTML = "";

        const opcaoVazia = document.createElement("option");
        opcaoVazia.value = "";
        opcaoVazia.textContent = "Sem Armadura";
        select.appendChild(opcaoVazia);

        (armaduras || []).forEach((armadura, indice) => {
          if (!armadura?.armadura_nome?.trim()) return;
          const option = document.createElement("option");
          option.value = String(indice);
          option.textContent = `👕 ${armadura.armadura_nome.trim()}`;
          select.appendChild(option);
        });

        const valorParaSetar =
          indiceSelecionado !== null && indiceSelecionado !== undefined
            ? String(indiceSelecionado)
            : Array.from(select.options).some((o) => o.value === valorAtual)
              ? valorAtual
              : "";
        select.value = Array.from(select.options).some(
          (o) => o.value === valorParaSetar,
        )
          ? valorParaSetar
          : "";
      }

      function sincronizarMarcacaoArmasPorSlots() {
        const slot1 = document.getElementById("arma1Nome")?.value || "";
        const slot2 = document.getElementById("arma2Nome")?.value || "";
        const desejados = new Set(
          [slot1, slot2].filter(
            (valor) => valor && extrairIndiceSlotEscudo(valor) === null,
          ),
        );

        document
          .querySelectorAll("#lista-armas-equipamento input")
          .forEach((input) => {
            input.checked = desejados.has(input.dataset.index);
          });
      }

      function atualizarBloqueioMaosEquipamento() {
        const armas = coletarArmas();
        const checkboxesArma = Array.from(
          document.querySelectorAll("#lista-armas-equipamento input"),
        );
        const checkboxesEscudo = Array.from(
          document.querySelectorAll("#lista-escudos-equipamento input"),
        );
        const principalValor =
          document.getElementById("arma1Nome")?.value || "";
        const principalIndice = parseInt(principalValor, 10);
        const itemPrincipal = estadoCombate.maoPrincipal.item;
        const permitidosSecundaria = podeEquiparNaSecundaria(
          itemPrincipal,
          estadoCombate.maoPrincipal.modo,
        );
        const maosOcupadas =
          estadoCombate.maoPrincipal.modo === "duas_maos"
            ? 2
            : (estadoCombate.maoPrincipal.item ? 1 : 0) +
              (estadoCombate.maoSecundaria.item ? 1 : 0);
        const bloquearNovasSelecoes = maosOcupadas >= 2;

        checkboxesArma.forEach((input) => {
          const indice = parseInt(input.dataset.index, 10);
          const itemArma = Number.isInteger(indice) ? armas[indice] : null;
          const tipoSecundario = obterTipoItemSecundarioArma(itemArma);
          const ePrincipal =
            Number.isInteger(principalIndice) && indice === principalIndice;
          const permitidoNaSecundaria =
            permitidosSecundaria.includes("qualquer") ||
            permitidosSecundaria.includes(tipoSecundario);
          const desabilitarPorRegra =
            !!itemPrincipal && !ePrincipal && !permitidoNaSecundaria;
          input.disabled =
            desabilitarPorRegra || (bloquearNovasSelecoes && !input.checked);
        });

        checkboxesEscudo.forEach((input) => {
          const permitidoNaSecundaria =
            permitidosSecundaria.includes("qualquer") ||
            permitidosSecundaria.includes("escudo");
          const desabilitarPorRegra = !!itemPrincipal && !permitidoNaSecundaria;
          input.disabled =
            desabilitarPorRegra || (bloquearNovasSelecoes && !input.checked);
        });
      }

      function obterTipoItemSecundarioArma(arma) {
        if (!arma) return null;

        const propriedades = arma.propriedades || {};
        if (propriedades.leve) return "leve";
        if (propriedades.duas_maos) return "duas_maos";
        if (propriedades.versatil) return "versatil";
        return "uma_mao";
      }

      function podeEquiparNaSecundaria(itemPrincipal, modo) {
        if (!itemPrincipal) return ["qualquer"];
        if (modo === "duas_maos") return [];
        if (itemPrincipal.tipo === "leve") return ["leve", "escudo"];
        if (itemPrincipal.tipo === "uma_mao") return ["escudo"];
        if (itemPrincipal.tipo === "versatil") return ["escudo"];
        return [];
      }

      function obterTipoItemSecundarioPorValor(valor, armas) {
        if (!valor) return null;
        const indiceEscudo = extrairIndiceSlotEscudo(valor);
        if (indiceEscudo !== null) return "escudo";

        const indiceArma = parseInt(valor, 10);
        const arma = Number.isInteger(indiceArma) ? armas[indiceArma] : null;
        return obterTipoItemSecundarioArma(arma);
      }

      function valorSecundarioEhValido(valor, itemPrincipal, modo, armas) {
        if (!valor) return true;
        const permitidos = podeEquiparNaSecundaria(itemPrincipal, modo);
        if (permitidos.includes("qualquer")) return true;
        return permitidos.includes(
          obterTipoItemSecundarioPorValor(valor, armas),
        );
      }

      function limparSelecaoSecundariaEquipamento(indicePrincipal = null) {
        document
          .querySelectorAll("#lista-escudos-equipamento input")
          .forEach((input) => {
            input.checked = false;
          });

        document
          .querySelectorAll("#lista-armas-equipamento input")
          .forEach((input) => {
            const indice = parseInt(input.dataset.index, 10);
            input.checked =
              Number.isInteger(indicePrincipal) && indice === indicePrincipal;
          });

        const selectSecundario = document.getElementById("arma2Nome");
        if (selectSecundario) selectSecundario.value = "";
      }

      function criarItemCombatePrincipal(arma, chaveItem) {
        if (!arma || !chaveItem) return null;

        const propriedades = arma.propriedades || {};
        let tipo = "uma_mao";
        if (propriedades.duas_maos) tipo = "duas_maos";
        else if (propriedades.versatil) tipo = "versatil";
        else if (propriedades.leve) tipo = "leve";

        let modo = "uma_mao";
        if (tipo === "duas_maos") {
          modo = "duas_maos";
        } else if (tipo === "versatil") {
          const manterModoAtual =
            estadoCombate.maoPrincipal?.item?.chaveItem === chaveItem;
          modo =
            manterModoAtual && estadoCombate.maoPrincipal?.modo === "duas_maos"
              ? "duas_maos"
              : "uma_mao";
        }

        return {
          chaveItem,
          nome: getNomeArmaSeguro(arma),
          tipo,
          versatil: tipo === "versatil",
          propriedades,
        };
      }

      function atualizarEstadoCombate(armas, escudos) {
        const valorPrincipal =
          document.getElementById("arma1Nome")?.value || "";
        const valorSecundario =
          document.getElementById("arma2Nome")?.value || "";
        const indicePrincipal = parseInt(valorPrincipal, 10);
        const indiceEscudoSecundario = extrairIndiceSlotEscudo(valorSecundario);
        const indiceArmaSecundaria = parseInt(valorSecundario, 10);
        const itemPrincipal = Number.isInteger(indicePrincipal)
          ? criarItemCombatePrincipal(
              armas[indicePrincipal] || null,
              valorPrincipal,
            )
          : null;

        let itemSecundario = null;
        if (
          itemPrincipal &&
          itemPrincipal.tipo !== "duas_maos" &&
          estadoCombate.maoPrincipal.modo !== "duas_maos"
        ) {
          if (indiceEscudoSecundario !== null) {
            itemSecundario = {
              tipo: "escudo",
              item: escudos[indiceEscudoSecundario] || null,
            };
          } else if (Number.isInteger(indiceArmaSecundaria)) {
            itemSecundario = {
              tipo: obterTipoItemSecundarioArma(
                armas[indiceArmaSecundaria] || null,
              ),
              item: armas[indiceArmaSecundaria] || null,
            };
          }
        }

        estadoCombate = {
          maoPrincipal: {
            item: itemPrincipal,
            modo: itemPrincipal
              ? itemPrincipal.tipo === "duas_maos"
                ? "duas_maos"
                : itemPrincipal.versatil
                  ? estadoCombate.maoPrincipal?.item?.chaveItem ===
                    valorPrincipal
                    ? estadoCombate.maoPrincipal.modo
                    : "uma_mao"
                  : "uma_mao"
              : "vazio",
          },
          maoSecundaria: {
            item: itemSecundario,
            ativa:
              !!itemPrincipal &&
              !(
                itemPrincipal.tipo === "duas_maos" ||
                (itemPrincipal.versatil &&
                  estadoCombate.maoPrincipal?.item?.chaveItem ===
                    valorPrincipal &&
                  estadoCombate.maoPrincipal.modo === "duas_maos")
              ),
          },
        };

        if (itemPrincipal?.tipo === "duas_maos") {
          estadoCombate.maoPrincipal.modo = "duas_maos";
          estadoCombate.maoSecundaria.item = null;
          estadoCombate.maoSecundaria.ativa = false;
        }

        if (
          itemPrincipal?.tipo === "versatil" &&
          estadoCombate.maoPrincipal.modo === "duas_maos"
        ) {
          estadoCombate.maoSecundaria.item = null;
          estadoCombate.maoSecundaria.ativa = false;
        }

        if (!itemPrincipal) {
          estadoCombate.maoSecundaria.ativa = true;
        }
      }

      function atualizarUIEmpunhadura(armas) {
        const botaoPrincipal = document.getElementById("arma1Empunhadura");
        const botaoSecundario = document.getElementById("arma2Empunhadura");
        const linhaSecundaria = document
          .getElementById("arma2Nome")
          ?.closest(".equipados-armas-item");
        const selectSecundario = document.getElementById("arma2Nome");
        const ataqueSecundario = document.getElementById("arma2Ataque");
        const principal = estadoCombate.maoPrincipal.item;
        const secundariaAtiva = estadoCombate.maoSecundaria.ativa;
        const secundariaItem = estadoCombate.maoSecundaria.item;

        if (botaoPrincipal) {
          const emojiPrincipal = !principal
            ? "🤚"
            : estadoCombate.maoPrincipal.modo === "duas_maos"
              ? "👏"
              : "✊";
          const indicadorVersatil = principal?.versatil
            ? estadoCombate.maoPrincipal.modo === "duas_maos"
              ? "✊"
              : "👏"
            : "";
          botaoPrincipal.textContent = emojiPrincipal;
          botaoPrincipal.dataset.indicador = indicadorVersatil;
          botaoPrincipal.classList.toggle("clicavel", !!principal);
          botaoPrincipal.disabled = false;
          botaoPrincipal.title = !principal
            ? "Mão principal livre"
            : principal?.versatil
              ? "Ações da empunhadura da arma versátil"
              : "Ações da mão principal";
        }

        if (botaoSecundario) {
          let emojiSecundario = "🤚";
          if (secundariaItem?.tipo === "escudo") emojiSecundario = "🛡️";
          else if (secundariaItem) emojiSecundario = "✊";
          botaoSecundario.textContent = emojiSecundario;
          botaoSecundario.classList.toggle("clicavel", !!secundariaItem);
          botaoSecundario.disabled = false;
          botaoSecundario.title = !secundariaItem
            ? !secundariaAtiva
              ? "Mão secundária livre por causa de empunhadura com duas mãos"
              : "Mão secundária livre"
            : "Ações da mão secundária";
        }

        if (linhaSecundaria) {
          linhaSecundaria.classList.toggle(
            "secundaria-bloqueada",
            !secundariaAtiva,
          );
        }

        if (selectSecundario) {
          selectSecundario.disabled = !secundariaAtiva;
          const permitidos = podeEquiparNaSecundaria(
            principal,
            estadoCombate.maoPrincipal.modo,
          );
          Array.from(selectSecundario.options).forEach((option) => {
            if (!option.value) {
              option.disabled = false;
              return;
            }
            const permitido =
              secundariaAtiva &&
              (permitidos.includes("qualquer") ||
                permitidos.includes(
                  obterTipoItemSecundarioPorValor(option.value, armas),
                ));
            option.disabled = !permitido;
          });
        }

        if (ataqueSecundario) {
          ataqueSecundario.disabled =
            ataqueSecundario.disabled || !secundariaAtiva;
        }

        reposicionarMenuEmpunhadura();
      }

      function obterMenuEmpunhadura() {
        return document.getElementById("empunhaduraMenu");
      }

      function fecharMenuEmpunhadura() {
        const menu = obterMenuEmpunhadura();
        if (!menu) return;

        menu.classList.add("oculto");
        menu.innerHTML = "";
        menu.setAttribute("aria-hidden", "true");
        menu.style.top = "";
        menu.style.left = "";
        estadoMenuEmpunhadura.slot = null;
        estadoMenuEmpunhadura.ancoraId = null;
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }

      function reposicionarMenuEmpunhadura() {
        const menu = obterMenuEmpunhadura();
        if (
          !menu ||
          menu.classList.contains("oculto") ||
          !estadoMenuEmpunhadura.ancoraId
        )
          return;

        const ancora = document.getElementById(estadoMenuEmpunhadura.ancoraId);
        if (!ancora) {
          fecharMenuEmpunhadura();
          return;
        }

        const rect = ancora.getBoundingClientRect();
        menu.style.top = `${Math.max(8, rect.top - 38)}px`;
        menu.style.left = `${rect.left - 2}px`;
      }

      function criarBotaoAcaoEmpunhadura(emoji, titulo, onClick) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "empunhadura-menu-botao";
        botao.textContent = emoji;
        botao.title = titulo;
        botao.setAttribute("aria-label", titulo);
        botao.addEventListener("click", (evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          botao.blur();
          onClick();
          fecharMenuEmpunhadura();
        });
        return botao;
      }

      function obterConfiguracaoEmpunhaduraSlot(indiceSlot, armas) {
        const valorSelecionado =
          document.getElementById(`arma${indiceSlot}Nome`)?.value || "";
        if (!valorSelecionado) return null;

        if (indiceSlot === 1) {
          const principal = estadoCombate.maoPrincipal.item;
          if (!principal) return null;

          return {
            indiceSlot,
            ocupado: true,
            versatil: !!principal.versatil,
            emDuasMaos: estadoCombate.maoPrincipal.modo === "duas_maos",
          };
        }

        if (!estadoCombate.maoSecundaria.item) return null;

        const indiceEscudo = extrairIndiceSlotEscudo(valorSelecionado);
        if (indiceEscudo !== null) {
          return {
            indiceSlot,
            ocupado: true,
            versatil: false,
            emDuasMaos: false,
          };
        }

        const indiceArma = parseInt(valorSelecionado, 10);
        const arma = Number.isInteger(indiceArma) ? armas[indiceArma] : null;
        return {
          indiceSlot,
          ocupado: !!arma,
          versatil: !!arma?.propriedades?.versatil,
          emDuasMaos: false,
        };
      }

      function abrirMenuEmpunhadura(indiceSlot) {
        const armas = coletarArmas();
        const configuracao = obterConfiguracaoEmpunhaduraSlot(
          indiceSlot,
          armas,
        );
        if (!configuracao?.ocupado) {
          fecharMenuEmpunhadura();
          return;
        }

        const menu = obterMenuEmpunhadura();
        const ancora = document.getElementById(`arma${indiceSlot}Empunhadura`);
        if (!menu || !ancora) return;

        if (
          !menu.classList.contains("oculto") &&
          estadoMenuEmpunhadura.slot === indiceSlot
        ) {
          fecharMenuEmpunhadura();
          return;
        }

        menu.innerHTML = "";
        menu.appendChild(
          criarBotaoAcaoEmpunhadura(
            "🚫",
            `Desequipar item da mão ${indiceSlot === 1 ? "principal" : "secundária"}`,
            () => {
              desequiparArmaSlot(indiceSlot);
              atualizarSubAbaArmas();
            },
          ),
        );

        if (configuracao.versatil && indiceSlot === 1) {
          menu.appendChild(
            criarBotaoAcaoEmpunhadura(
              configuracao.emDuasMaos ? "✊" : "👏",
              configuracao.emDuasMaos
                ? "Voltar a empunhar a arma com uma mão"
                : "Empunhar arma versátil com duas mãos",
              () => {
                alternarModoEmpunhaduraVersatil(
                  configuracao.emDuasMaos ? "uma_mao" : "duas_maos",
                );
                atualizarSubAbaArmas();
              },
            ),
          );
        }

        menu.classList.remove("oculto");
        menu.setAttribute("aria-hidden", "false");
        estadoMenuEmpunhadura.slot = indiceSlot;
        estadoMenuEmpunhadura.ancoraId = ancora.id;
        reposicionarMenuEmpunhadura();
      }

      function alternarModoEmpunhaduraVersatil(modo) {
        const principal = estadoCombate.maoPrincipal.item;
        if (!principal?.versatil) return;

        estadoCombate.maoPrincipal.modo =
          modo === "duas_maos" ? "duas_maos" : "uma_mao";
        if (estadoCombate.maoPrincipal.modo === "duas_maos") {
          limparSelecaoSecundariaEquipamento(
            parseInt(document.getElementById("arma1Nome")?.value || "", 10),
          );
        }
        sincronizarMarcacaoArmasPorSlots();
        sincronizarEquipamentosCombate();
      }

      function lidarSelecaoArmaEquipada(indiceSlot) {
        const atual = document.getElementById(`arma${indiceSlot}Nome`);
        const outro = document.getElementById(
          `arma${indiceSlot === 1 ? 2 : 1}Nome`,
        );
        if (!atual) return;

        const indiceEscudoAtual = extrairIndiceSlotEscudo(atual.value);

        if (
          atual.value &&
          indiceEscudoAtual === null &&
          outro &&
          atual.value === outro.value
        ) {
          outro.value = "";
        }

        const checkboxesEscudo = document.querySelectorAll(
          "#lista-escudos-equipamento input",
        );
        if (indiceSlot === 2) {
          const indiceEscudo = extrairIndiceSlotEscudo(atual.value);
          checkboxesEscudo.forEach((input, indice) => {
            input.checked = indiceEscudo !== null && indice === indiceEscudo;
          });
        }

        sincronizarMarcacaoArmasPorSlots();
        sincronizarEquipamentosCombate();
      }

      function desequiparArmaSlot(indiceSlot) {
        const select = document.getElementById(`arma${indiceSlot}Nome`);
        if (select) select.value = "";

        if (indiceSlot === 2) {
          document
            .querySelectorAll("#lista-escudos-equipamento input")
            .forEach((input) => {
              input.checked = false;
            });
        }

        sincronizarMarcacaoArmasPorSlots();
        sincronizarEquipamentosCombate();
      }

      function obterSelecaoArmaEquipada(indiceSlot) {
        const select = document.getElementById(`arma${indiceSlot}Nome`);
        if (!select) return { indice: "", nome: "" };

        const indice = select.value || "";
        const opcaoSelecionada =
          indice !== "" ? select.options[select.selectedIndex] : null;
        const nome =
          opcaoSelecionada?.dataset.nomeItem || opcaoSelecionada?.text || "";
        return { indice, nome };
      }

      function normalizarNomeEquipadoSalvo(valor) {
        return String(valor || "")
          .replace(/^[^\p{L}\p{N}]+/u, "")
          .trim()
          .replace(/\s+/g, " ");
      }

      function nomesEquipadosCoincidem(nomeSalvo, nomeItem) {
        const nomeSalvoNormalizado = normalizarNomeEquipadoSalvo(nomeSalvo);
        const nomeItemNormalizado = normalizarNomeEquipadoSalvo(nomeItem);
        if (!nomeSalvoNormalizado || !nomeItemNormalizado) return false;
        return (
          nomeSalvoNormalizado === nomeItemNormalizado ||
          nomeSalvoNormalizado.startsWith(`${nomeItemNormalizado} `)
        );
      }

      function resolverIndiceArmaSalva(dados, indiceSlot, armas, escudos = []) {
        const chaveIndice = `arma${indiceSlot}EquipadaIndice`;
        const chaveNome = `arma${indiceSlot}Nome`;
        const valorIndiceBruto = dados[chaveIndice];

        if (indiceSlot === 2) {
          const indiceEscudo = extrairIndiceSlotEscudo(valorIndiceBruto);
          if (indiceEscudo !== null && escudos[indiceEscudo]) {
            return criarValorSlotEscudo(indiceEscudo);
          }
        }

        const valorIndice = parseInt(valorIndiceBruto, 10);

        // 🔹 valida índice diretamente
        if (
          Number.isInteger(valorIndice) &&
          armas[valorIndice] &&
          getNomeArmaSeguro(armas[valorIndice])
        ) {
          return valorIndice;
        }

        // 🔹 fallback por nome
        const nomeSalvo = String(dados[chaveNome] ?? "").trim();
        if (!nomeSalvo) return null;

        if (indiceSlot === 2) {
          const indiceEscudoPorNome = escudos.findIndex((escudo) =>
            nomesEquipadosCoincidem(
              nomeSalvo,
              escudo?.escudo_nome || escudo?.nome || "",
            ),
          );

          if (indiceEscudoPorNome >= 0) {
            return criarValorSlotEscudo(indiceEscudoPorNome);
          }
        }

        const indicePorNome = armas.findIndex((arma) =>
          nomesEquipadosCoincidem(nomeSalvo, getNomeArmaSeguro(arma)),
        );

        return indicePorNome >= 0 ? indicePorNome : null;
      }

      function aplicarEstiloProficienciaCampos(ids, proficiente) {
        ids.forEach((id) => {
          const campo = document.getElementById(id);
          if (!campo) return;
          campo.classList.toggle(
            "equipados-nao-proficiente",
            proficiente === false && !!campo.value,
          );
        });
      }

      function normalizarBonusCA(valor) {
        const numero =
          parseInt(String(valor || "").replace(/[^\d-]/g, ""), 10) || 0;
        return numero;
      }

      function obterPocoesEquipadas(outrosSelecionados) {
        return (outrosSelecionados || [])
          .map((outro) => {
            const tipo = String(outro.outro_tipo || "")
              .trim()
              .toLowerCase();
            const nome = String(outro.outro_nome || "").trim();
            const quantidade = Math.max(
              0,
              parseInt(outro.outro_quantidade, 10) || 0,
            );
            if (tipo !== "pocao" || !nome || quantidade <= 0) return null;
            return {
              id: outro.id,
              nome,
              quantidade,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      }

      function consumirPocaoEquipada(idOutro) {
        const item = [
          ...document.querySelectorAll(
            '#listaOutros .item-card[data-tipo="outro"]',
          ),
        ].find((card) => card.dataset.id === idOutro);
        if (!item) return;

        const campoNome = item.querySelector('[data-campo="outro_nome"]');
        const campoQuantidade = item.querySelector(
          '[data-campo="outro_quantidade"]',
        );
        const campoDescricao = item.querySelector(
          '[data-campo="outro_descricao"]',
        );
        const nome = campoNome?.value?.trim() || "Poção";
        const quantidadeAtual = Math.max(
          0,
          parseInt(campoQuantidade?.value, 10) || 0,
        );
        const descricao = campoDescricao?.value?.trim() || "Sem descrição.";

        if (quantidadeAtual <= 0) return;
        const mensagem = [
          `${nome}`,
          `${quantidadeAtual}`,
          ` ${descricao}`,
          "",
          "Deseja consumir esta poção?",
        ].join("\n");
        if (!confirm(mensagem)) return;

        if (campoQuantidade) {
          campoQuantidade.value = String(Math.max(0, quantidadeAtual - 1));
        }

        adicionarRegistroHistoricoCombate("Poção", nome, "🧪");
        atualizarPesoAtualInventario();
        atualizarListaArmasEquipamento();
        sincronizarEquipamentosCombate();
      }

      function atualizarListaPocoesEquipadas(outrosSelecionados) {
        const container = document.getElementById("listaPocoesEquipadas");
        if (!container) return;

        const pocoes = obterPocoesEquipadas(outrosSelecionados);
        container.replaceChildren();

        if (!pocoes.length) {
          const vazio = document.createElement("div");
          vazio.className = "pocao-equipada-vazia";
          vazio.textContent = "Nenhuma poção equipada.";
          container.appendChild(vazio);
          return;
        }

        pocoes.forEach((pocao) => {
          const botao = document.createElement("button");
          botao.type = "button";
          botao.className = "pocao-equipada-item";
          botao.textContent = `${pocao.quantidade} x ${pocao.nome}`;
          botao.title = "Consumir poção";
          botao.setAttribute("aria-label", `Consumir poção ${pocao.nome}`);
          botao.addEventListener("click", () =>
            consumirPocaoEquipada(pocao.id),
          );
          container.appendChild(botao);
        });
      }
      // ========================= FIM EQUIPAMENTOS COMBATE =========================
      function sincronizarEquipamentosCombate() {
        normalizarTodasArmas();
        const armas = coletarArmas();
        const armaduras = coletarArmaduras();
        const escudos = coletarEscudos();
        const outros = coletarOutros();

        const indicesMarcados = obterIndicesArmasMarcadas();
        const slot1Atual = document.getElementById("arma1Nome")?.value || "";
        const slot2Atual = document.getElementById("arma2Nome")?.value || "";
        const indiceEscudoSlot2 = extrairIndiceSlotEscudo(slot2Atual);
        const escudoSelecionadoInput = document.querySelector(
          "#lista-escudos-equipamento input:checked",
        );
        const indiceEscudoCheckbox = escudoSelecionadoInput
          ? parseInt(escudoSelecionadoInput.dataset.index, 10)
          : null;
        const indiceEscudoAtivo = Number.isInteger(indiceEscudoSlot2)
          ? indiceEscudoSlot2
          : indiceEscudoCheckbox;

        if (Number.isInteger(indiceEscudoAtivo)) {
          document
            .querySelectorAll("#lista-escudos-equipamento input")
            .forEach((input, indice) => {
              input.checked = indice === indiceEscudoAtivo;
            });
        } else {
          document
            .querySelectorAll("#lista-escudos-equipamento input")
            .forEach((input) => {
              input.checked = false;
            });
        }

        const slotsValidos = [slot1Atual, slot2Atual].map((valor) => {
          const indiceEscudo = extrairIndiceSlotEscudo(valor);
          if (indiceEscudo !== null) return criarValorSlotEscudo(indiceEscudo);
          const indice = parseInt(valor, 10);
          return Number.isInteger(indice) && indicesMarcados.includes(indice)
            ? indice
            : null;
        });
        const faltantes = indicesMarcados.filter(
          (indice) => !slotsValidos.includes(indice),
        );
        const indicesEquipados = slotsValidos.map(
          (indice) => indice ?? faltantes.shift() ?? null,
        );
        const valorSlot1Selecionado = Number.isInteger(indicesEquipados[0])
          ? String(indicesEquipados[0])
          : "";
        const indicePrincipal = Number.isInteger(indicesEquipados[0])
          ? indicesEquipados[0]
          : null;
        const itemPrincipal = Number.isInteger(indicePrincipal)
          ? criarItemCombatePrincipal(
              armas[indicePrincipal] || null,
              valorSlot1Selecionado,
            )
          : null;
        const modoPrincipal =
          itemPrincipal?.tipo === "duas_maos"
            ? "duas_maos"
            : itemPrincipal?.versatil &&
                estadoCombate.maoPrincipal?.item?.chaveItem ===
                  valorSlot1Selecionado
              ? estadoCombate.maoPrincipal.modo
              : itemPrincipal
                ? "uma_mao"
                : "vazio";

        let valorSlot2Selecionado = Number.isInteger(indiceEscudoAtivo)
          ? criarValorSlotEscudo(indiceEscudoAtivo)
          : Number.isInteger(indicesEquipados[1])
            ? String(indicesEquipados[1])
            : "";

        if (
          !valorSecundarioEhValido(
            valorSlot2Selecionado,
            itemPrincipal,
            modoPrincipal,
            armas,
          )
        ) {
          valorSlot2Selecionado = "";
          limparSelecaoSecundariaEquipamento(indicePrincipal);
        }

        if (modoPrincipal === "duas_maos") {
          valorSlot2Selecionado = "";
          limparSelecaoSecundariaEquipamento(indicePrincipal);
        }

        atualizarSelectNomeArmaEquipada(1, armas, indicePrincipal, []);
        atualizarSelectNomeArmaEquipada(
          2,
          armas,
          valorSlot2Selecionado,
          escudos,
        );

        const armasSelecionadas = [
          Number.isInteger(indicePrincipal) ? armas[indicePrincipal] : null,
          Number.isInteger(parseInt(valorSlot2Selecionado, 10)) &&
          extrairIndiceSlotEscudo(valorSlot2Selecionado) === null
            ? armas[parseInt(valorSlot2Selecionado, 10)] || null
            : null,
        ];

        [1, 2].forEach((indice) => {
          const arma = armasSelecionadas[indice - 1];
          const valorSlot =
            document.getElementById(`arma${indice}Nome`)?.value || "";
          const indiceEscudoSelecionado = extrairIndiceSlotEscudo(valorSlot);
          const escudoSelecionado =
            indice === 2 && indiceEscudoSelecionado !== null
              ? escudos[indiceEscudoSelecionado]
              : null;
          const usandoEscudo = !!escudoSelecionado;
          const textoPropriedade = arma
            ? montarTextoPropriedadeArma(
                arma,
                resumirMunicaoNoTexto(obterResumoPropriedadesArma(arma, false)),
              )
            : "";
          preencherCampo(
            `arma${indice}Dano`,
            usandoEscudo
              ? ""
              : [obterTextoDanoArma(arma), arma?.arma_tipo_dano?.trim() || ""]
                  .filter(Boolean)
                  .join(" "),
          );
          preencherMunicaoEquipada(indice, usandoEscudo ? null : arma);
          aplicarEstiloProficienciaCampos(
            [`arma${indice}Nome`, `arma${indice}Ataque`, `arma${indice}Dano`],
            usandoEscudo
              ? formatarEscudoEquipamento(escudoSelecionado).proficiente
              : arma
                ? formatarArma(arma).proficiente
                : null,
          );
          const selectAtaque = document.getElementById(`arma${indice}Ataque`);
          if (selectAtaque && usandoEscudo) {
            selectAtaque.value = "for";
          }
          if (selectAtaque) {
            selectAtaque.disabled = usandoEscudo || !arma;
          }
        });

        atualizarSeletoresAtaqueEquipados();

        const armaduraSelecionadaInput = document.querySelector(
          "#lista-armaduras-equipamento input:checked",
        );
        const indiceCheckbox = armaduraSelecionadaInput
          ? normalizarIndiceEquipamento(armaduraSelecionadaInput.dataset.index)
          : null;
        const indice =
          indiceCheckbox ?? normalizarIndiceEquipamento(armaduraEquipadaIndice);

        equiparArmadura(indice, { armaduras });

        const valorSlot2Atual =
          document.getElementById("arma2Nome")?.value || "";
        const indiceEscudoPainel = extrairIndiceSlotEscudo(valorSlot2Atual);
        const escudoPainel = Number.isInteger(indiceEscudoPainel)
          ? escudos[indiceEscudoPainel]
          : null;
        preencherCampo("escudoNome", escudoPainel?.escudo_nome?.trim() || "");
        preencherCampo("escudoCA", escudoPainel?.escudo_ca?.trim() || "");
        aplicarEstiloProficienciaCampos(
          ["escudoNome", "escudoCA"],
          escudoPainel
            ? formatarEscudoEquipamento(escudoPainel).proficiente
            : null,
        );

        const outrosSelecionados = Array.from(
          document.querySelectorAll("#lista-outros-equipamento input:checked"),
        )
          .map((input) => outros[parseInt(input.dataset.index, 10)])
          .filter(Boolean);

        const tiposOutros = outrosSelecionados.map((outro) => {
          const nome = outro.outro_nome?.trim() || "Item";
          const quantidade = Math.max(
            1,
            parseInt(outro.outro_quantidade, 10) || 1,
          );
          return quantidade > 1 ? `${nome} x${quantidade}` : nome;
        });
        const bonusOutros = outrosSelecionados.reduce(
          (soma, outro) => soma + normalizarBonusCA(outro.outro_ca),
          0,
        );

        preencherCampo("outroEquipadoTipo", tiposOutros.join(", "));
        preencherCampo("outroEquipadoCA", bonusOutros ? `+${bonusOutros}` : "");
        atualizarListaPocoesEquipadas(outrosSelecionados);

        ["armaduraCA", "outroEquipadoCA", "escudoCA"].forEach(aplicarFormatoCA);
        atualizarClasseArmaduraEquipada();
        atualizarSubAbaArmas();
        atualizarEstadoCombate(armas, escudos);
        atualizarUIEmpunhadura(armas);
        atualizarBloqueioMaosEquipamento();
      }

      // atualiza o "P" de proficiência quando o tipo de arma muda, verificando os checkboxes de proficiência
      function atualizarProficienciaCard(card) {
        const selectTipo = card.querySelector('[data-campo="arma_tipo"]');
        const divP = card.querySelector(".item-proficiencia");

        if (!selectTipo || !divP) return;

        const tipo = selectTipo.value;
        const profSimples = document.getElementById("profArmaSimples")?.checked;
        const profMarcial =
          document.getElementById("profArmaMarciais")?.checked;

        let temProficiencia = false;

        if (tipo === "Simples" && profSimples) temProficiencia = true;
        if (tipo === "Marcial" && profMarcial) temProficiencia = true;

        divP.classList.toggle("ativo", temProficiencia);
        divP.classList.toggle("nao", !temProficiencia);
      }

      function inicializarEventosArma(card) {
        // ==========================================
        // 1. LÓGICA DE REMOVER A ARMA
        // ==========================================
        const btnRemover = card.querySelector(".btn-remover-item");
        if (btnRemover) {
          btnRemover.addEventListener("click", function (e) {
            e.stopPropagation(); // Impede que o card abra/feche ao clicar no X
            if (confirm("Deseja remover esta arma?")) {
              card.remove();
              atualizarListaArmasEquipamento();
            }
          });
        }

        // ==========================================
        // 2. LÓGICA DO "P" DE PROFICIÊNCIA
        // ==========================================
        const divP = card.querySelector(".item-proficiencia");
        const selectTipo = card.querySelector('[data-campo="arma_tipo"]');

        function atualizarStatusP() {
          if (!divP || !selectTipo) return;

          const tipo = selectTipo.value; // Pega "Simples" ou "Marcial"
          const profSimples =
            document.getElementById("profArmaSimples")?.checked;
          const profMarciais =
            document.getElementById("profArmaMarciais")?.checked;

          let temProficiencia = false;
          if (tipo === "Simples" && profSimples) temProficiencia = true;
          if (tipo === "Marcial" && profMarciais) temProficiencia = true;

          // Se tem proficiência, removemos a classe "nao" (tira o X vermelho). Senão, colocamos.
          if (temProficiencia) {
            divP.classList.remove("nao");
            divP.classList.add("ativo");
          } else {
            divP.classList.add("nao");
            divP.classList.remove("ativo");
          }
        }

        // Lógica Manual: Clicar direto no P para ativar/desativar
        if (divP) {
          divP.addEventListener("click", function (e) {
            e.stopPropagation(); // Impede que o clique abra/feche a arma sem querer
            const ficouNaoProficiente = this.classList.toggle("nao");
            this.classList.toggle("ativo", !ficouNaoProficiente);

            // Opcional: atualiza o resumo de combate
            if (typeof atualizarSubAbaArmas === "function")
              atualizarSubAbaArmas();
            atualizarListaArmasEquipamento();
          });
        }

        // Lógica Automática: Quando o select de tipo muda, checa a proficiência
        if (selectTipo) {
          selectTipo.addEventListener("change", atualizarStatusP);
        }

        atualizarStatusP();

        // ==========================================
        // 3. LÓGICA DAS PROPRIEDADES (Distância, Munição, Especial, Versátil)
        // ==========================================
        const checkboxes = card.querySelectorAll(
          '.arma-propriedades input[type="checkbox"]',
        );
        const distanciaContainer = card.querySelector(".container_distancia");
        const containerMunicao = card.querySelector(".container_municao");
        const containerDescricao = card.querySelector(
          ".arma-container-descricao",
        );
        inicializarCamposCompartilhadosItem(card, "arma");
        const registrarListenersCamposArma = () => {
          card.querySelectorAll("[data-campo]").forEach((campo) => {
            if (campo.dataset.listenerResumoArma === "true") return;
            campo.addEventListener("input", () => {
              atualizarPesoAtualInventario();
              atualizarListaArmasEquipamento();
              atualizarTodasMunicoesArmas(); // 🔥 ESSENCIAL
            });

            campo.addEventListener("change", () => {
              atualizarPesoAtualInventario();
              atualizarListaArmasEquipamento();
              atualizarTodasMunicoesArmas(); // 🔥 ESSENCIAL
            });
            campo.dataset.listenerResumoArma = "true";
          });
        };

        // Dano Versátil
        const checkboxVersatil = Array.from(checkboxes).find(
          (el) => el.dataset.propriedade === "versatil",
        );
        if (checkboxVersatil) {
          checkboxVersatil.addEventListener("change", function () {
            const containerDano = card.querySelector(".container_dano");
            if (!containerDano) return;

            const campoDanoPadrao = containerDano.querySelector(
              '[data-campo="arma_dano"]',
            );
            const campoDanoUmaMao = containerDano.querySelector(
              '[data-campo="dano_1"]',
            );
            const campoDanoDuasMaos = containerDano.querySelector(
              '[data-campo="dano_2"]',
            );
            const valorDanoPadrao = campoDanoPadrao?.value?.trim() || "";
            const valorDanoUmaMao = campoDanoUmaMao?.value?.trim() || "";
            const valorDanoDuasMaos = campoDanoDuasMaos?.value?.trim() || "";
            if (this.checked) {
              containerDano.innerHTML = `
                    <div style="display:flex; gap:5px;">
                        <input type="text" placeholder="1 mão" data-campo="dano_1">
                        /
                        <input type="text" placeholder="2 mãos" data-campo="dano_2">
                    </div>
                `;
              const novoDanoUmaMao = containerDano.querySelector(
                '[data-campo="dano_1"]',
              );
              const novoDanoDuasMaos = containerDano.querySelector(
                '[data-campo="dano_2"]',
              );
              if (novoDanoUmaMao)
                novoDanoUmaMao.value = valorDanoUmaMao || valorDanoPadrao;
              if (novoDanoDuasMaos) novoDanoDuasMaos.value = valorDanoDuasMaos;
            } else {
              containerDano.innerHTML = `
                    <input type="text" data-campo="arma_dano" placeholder="ex: 1d8">
                `;
              const novoDanoPadrao = containerDano.querySelector(
                '[data-campo="arma_dano"]',
              );
              if (novoDanoPadrao)
                novoDanoPadrao.value =
                  valorDanoUmaMao || valorDanoPadrao || valorDanoDuasMaos;
            }
            registrarListenersCamposArma();
            atualizarListaArmasEquipamento();
          });
        }

        // Mostrar/Esconder Containers
        function atualizarCamposArma() {
          let temArremesso = false;
          let temMunicao = false;
          checkboxes.forEach((cb) => {
            const propriedade = cb.dataset.propriedade;
            if (cb.checked) {
              if (propriedade === "arremesso") temArremesso = true;
              if (propriedade === "municao") temMunicao = true;
            }
          });

          if (distanciaContainer)
            distanciaContainer.style.display =
              temArremesso || temMunicao ? "block" : "none";
          if (containerMunicao)
            containerMunicao.style.display = temMunicao ? "block" : "none";
          if (containerDescricao) containerDescricao.style.display = "block";
          const emojiTipo = card.querySelector(".item-tipo-emoji");
          if (emojiTipo) {
            emojiTipo.textContent = temMunicao ? "🏹" : "⚔️";
          }
        }

        checkboxes.forEach((cb) =>
          cb.addEventListener("change", atualizarCamposArma),
        );
        registrarListenersCamposArma();
        checkboxes.forEach((cb) => {
          cb.addEventListener("change", atualizarListaArmasEquipamento);
        });

        // ==========================================
        // 4. INICIALIZAÇÃO AUTOMÁTICA
        // Roda essas funções logo que a arma é criada
        // ==========================================
        atualizarStatusP();
        atualizarCamposArma();
        atualizarListaArmasEquipamento();
      }

      // ===== Listeners finais e sincronizacoes automaticas =====
      ["profArmaSimples", "profArmaMarciais"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener("change", () => {
            const tipoAlvo = id === "profArmaSimples" ? "Simples" : "Marcial";

            document
              .querySelectorAll('.item-card[data-tipo="arma"]:not(#armaModelo)')
              .forEach((card) => {
                const selectTipo = card.querySelector(
                  '[data-campo="arma_tipo"]',
                );
                const divP = card.querySelector(".item-proficiencia");

                if (selectTipo && divP && selectTipo.value === tipoAlvo) {
                  if (el.checked) {
                    divP.classList.remove("nao");
                    divP.classList.add("ativo");
                  } else {
                    divP.classList.add("nao");
                    divP.classList.remove("ativo");
                  }
                }
              });
            atualizarListaArmasEquipamento();
            sincronizarEquipamentosCombate();
            atualizarSubAbaArmas();
          });
        }
      });

      [
        "profArmaduraLeves",
        "profArmaduraMedias",
        "profArmaduraPesadas",
      ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener("change", () => {
            document
              .querySelectorAll(
                '#listaArmaduras .item-card[data-tipo="armadura"]',
              )
              .forEach((card) => {
                atualizarProficienciaCardArmadura(card);
              });
            atualizarListaArmasEquipamento();
          });
        }
      });

      const campoProfEscudos = document.getElementById("profEscudos");
      if (campoProfEscudos) {
        campoProfEscudos.addEventListener("change", () => {
          document
            .querySelectorAll(
              '#listaEscudos .item-card[data-tipo="escudo"]:not(#escudoModelo)',
            )
            .forEach((card) => {
              atualizarProficienciaCardEscudo(card);
            });
          atualizarListaArmasEquipamento();
        });
      }

      // Adiciona um novo card de arma a partir do modelo oculto
      function adicionarNovaArma() {
        const modelo = document.getElementById("armaModelo");
        const container = document.getElementById("listaArmas");
        const novaArma = modelo.cloneNode(true);
        novaArma.removeAttribute("id");
        novaArma.style.display = "block";
        novaArma.classList.add("item-card");
        novaArma.classList.remove("fechado", "oculto");
        novaArma.dataset.tipo = "arma";

        container.appendChild(novaArma);

        inicializarEventosArma(novaArma);
        abrirItemCard(novaArma);
        atualizarListaArmasEquipamento();

        return novaArma; // 🔥 ANTES ESTAVA 'novoCard', POR ISSO DAVA ERRO
      }

      function coletarArmas() {
        const armas = [];
        const lista = document.querySelectorAll(
          '.item-card[data-tipo="arma"]:not(#armaModelo)',
        );

        lista.forEach((card) => {
          const arma = {};
          const indicadorProficiencia =
            card.querySelector(".item-proficiencia");

          // 1. Campos normais
          card.querySelectorAll("[data-campo]").forEach((campo) => {
            arma[campo.dataset.campo] = campo.value;
          });

          // 2. Propriedades (checkbox)
          arma.propriedades = {};
          card.querySelectorAll(".propriedade-checkbox").forEach((checkbox) => {
            const nomePropriedade = checkbox.dataset.propriedade;
            arma.propriedades[nomePropriedade] = checkbox.checked;
          });

          // 🔥 NOVO: FLAG DIRETA
          arma.usaMunicao = !!arma.propriedades.municao;
          coletarFlagsCompartilhadasItem(card, arma, "arma");

          // Proficiencia
          arma.proficiente = indicadorProficiencia
            ? !indicadorProficiencia.classList.contains("nao")
            : getTemProficienciaArma(arma.arma_tipo?.trim());

          armas.push(arma);
        });

        return armas;
      }

      function atualizarProficienciaCardArmadura(card) {
        const selectTipo = card.querySelector('[data-campo="armadura_tipo"]');
        const divP = card.querySelector(".item-proficiencia");

        if (!selectTipo || !divP) return;

        const temProficiencia = getTemProficienciaArmadura(selectTipo.value);
        divP.classList.toggle("ativo", temProficiencia);
        divP.classList.toggle("nao", !temProficiencia);
      }

      function inicializarEventosArmadura(card) {
        inicializarCamposCompartilhadosItem(card, "armadura");
        const btnRemover = card.querySelector(".btn-remover-item");
        if (btnRemover) {
          btnRemover.addEventListener("click", function (e) {
            e.stopPropagation();
            if (confirm("Deseja remover esta armadura?")) {
              card.remove();
              atualizarPesoAtualInventario();
              atualizarListaArmasEquipamento();
            }
          });
        }

        const divP = card.querySelector(".item-proficiencia");
        const selectTipo = card.querySelector('[data-campo="armadura_tipo"]');

        if (divP) {
          divP.addEventListener("click", function (e) {
            e.stopPropagation();
            const ficouNaoProficiente = this.classList.toggle("nao");
            this.classList.toggle("ativo", !ficouNaoProficiente);
            atualizarListaArmasEquipamento();
          });
        }

        if (selectTipo) {
          selectTipo.addEventListener("change", () => {
            atualizarProficienciaCardArmadura(card);
            atualizarListaArmasEquipamento();
          });
        }

        card.querySelectorAll("[data-campo]").forEach((campo) => {
          campo.addEventListener("input", atualizarPesoAtualInventario);
          campo.addEventListener("change", atualizarPesoAtualInventario);
          campo.addEventListener("input", atualizarListaArmasEquipamento);
          campo.addEventListener("change", atualizarListaArmasEquipamento);
        });

        atualizarProficienciaCardArmadura(card);
        atualizarPesoAtualInventario();
        atualizarListaArmasEquipamento();
      }

      function adicionarNovaArmadura() {
        const modelo = document.getElementById("armaduraModelo");
        const container = document.getElementById("listaArmaduras");

        const novaArmadura = modelo.cloneNode(true);
        novaArmadura.removeAttribute("id");
        novaArmadura.style.display = "block";
        novaArmadura.classList.add("item-card");
        novaArmadura.classList.remove("fechado", "oculto");
        novaArmadura.dataset.tipo = "armadura";

        container.appendChild(novaArmadura);
        inicializarEventosArmadura(novaArmadura);
        abrirItemCard(novaArmadura);
        atualizarPesoAtualInventario();
        atualizarListaArmasEquipamento();

        return novaArmadura;
      }

      function coletarArmaduras() {
        const armaduras = [];
        const lista = document.querySelectorAll(
          '#listaArmaduras .item-card[data-tipo="armadura"]',
        );

        lista.forEach((card) => {
          const armadura = {};
          const indicadorProficiencia =
            card.querySelector(".item-proficiencia");

          card.querySelectorAll("[data-campo]").forEach((campo) => {
            armadura[campo.dataset.campo] = campo.value;
          });
          coletarFlagsCompartilhadasItem(card, armadura, "armadura");

          armadura.proficiente = indicadorProficiencia
            ? !indicadorProficiencia.classList.contains("nao")
            : getTemProficienciaArmadura(armadura.armadura_tipo?.trim());

          armaduras.push(armadura);
        });

        return armaduras;
      }

      function atualizarProficienciaCardEscudo(card) {
        const selectTipo = card.querySelector('[data-campo="escudo_tipo"]');
        const divP = card.querySelector(".item-proficiencia");

        if (!selectTipo || !divP) return;

        const temProficiencia = getTemProficienciaEscudo(selectTipo.value);
        divP.classList.toggle("ativo", temProficiencia);
        divP.classList.toggle("nao", !temProficiencia);
      }

      function inicializarEventosEscudo(card) {
        inicializarCamposCompartilhadosItem(card, "escudo");
        const btnRemover = card.querySelector(".btn-remover-item");
        if (btnRemover) {
          btnRemover.addEventListener("click", function (e) {
            e.stopPropagation();
            if (confirm("Deseja remover este escudo ou vestimento?")) {
              card.remove();
              atualizarPesoAtualInventario();
              atualizarListaArmasEquipamento();
            }
          });
        }

        const divP = card.querySelector(".item-proficiencia");
        const selectTipo = card.querySelector('[data-campo="escudo_tipo"]');

        if (divP) {
          divP.addEventListener("click", function (e) {
            e.stopPropagation();
            const ficouNaoProficiente = this.classList.toggle("nao");
            this.classList.toggle("ativo", !ficouNaoProficiente);
            atualizarListaArmasEquipamento();
          });
        }

        if (selectTipo) {
          selectTipo.addEventListener("change", () => {
            atualizarProficienciaCardEscudo(card);
            atualizarListaArmasEquipamento();
          });
        }

        card.querySelectorAll("[data-campo]").forEach((campo) => {
          campo.addEventListener("input", atualizarPesoAtualInventario);
          campo.addEventListener("change", atualizarPesoAtualInventario);
          campo.addEventListener("input", atualizarListaArmasEquipamento);
          campo.addEventListener("change", atualizarListaArmasEquipamento);
        });

        atualizarProficienciaCardEscudo(card);
        atualizarPesoAtualInventario();
        atualizarListaArmasEquipamento();
      }

      function adicionarNovoEscudo() {
        const modelo = document.getElementById("escudoModelo");
        const container = document.getElementById("listaEscudos");

        const novoEscudo = modelo.cloneNode(true);
        novoEscudo.removeAttribute("id");
        novoEscudo.style.display = "block";
        novoEscudo.classList.add("item-card");
        novoEscudo.classList.remove("fechado", "oculto");
        novoEscudo.dataset.tipo = "escudo";

        container.appendChild(novoEscudo);
        inicializarEventosEscudo(novoEscudo);
        abrirItemCard(novoEscudo);
        atualizarListaArmasEquipamento();

        return novoEscudo;
      }

      function coletarEscudos() {
        const escudos = [];
        const lista = document.querySelectorAll(
          '#listaEscudos .item-card[data-tipo="escudo"]',
        );
        lista.forEach((card) => {
          const escudo = {};
          const indicadorProficiencia =
            card.querySelector(".item-proficiencia");

          card.querySelectorAll("[data-campo]").forEach((campo) => {
            escudo[campo.dataset.campo] = campo.value;
          });
          coletarFlagsCompartilhadasItem(card, escudo, "escudo");

          escudo.proficiente = indicadorProficiencia
            ? !indicadorProficiencia.classList.contains("nao")
            : getTemProficienciaEscudo(escudo.escudo_tipo?.trim());

          escudos.push(escudo);
        });

        return escudos;
      }

      // O card de "outros" é mais simples, sem proficiência ou propriedades, então a lógica é mais direta
      function inicializarEventosOutro(card) {
        inicializarCamposCompartilhadosItem(card, "outro");
        const btnRemover = card.querySelector(".btn-remover-item");
        if (btnRemover) {
          btnRemover.addEventListener("click", function (e) {
            e.stopPropagation();
            if (confirm("Deseja remover este item?")) {
              card.remove();
              atualizarPesoAtualInventario();
              atualizarListaArmasEquipamento();
            }
          });
        }

        card.querySelectorAll("[data-campo]").forEach((campo) => {
          campo.addEventListener("input", atualizarPesoAtualInventario);
          campo.addEventListener("change", atualizarPesoAtualInventario);
          campo.addEventListener("input", atualizarListaArmasEquipamento);
          campo.addEventListener("change", atualizarListaArmasEquipamento);
        });

        card.querySelectorAll("[data-campo]").forEach((campo) => {
          campo.addEventListener("input", () => {
            atualizarPesoAtualInventario();
            atualizarListaArmasEquipamento();
          });

          campo.addEventListener("change", () => {
            atualizarPesoAtualInventario();
            atualizarListaArmasEquipamento();
          });
        });

        atualizarPesoAtualInventario();
        atualizarListaArmasEquipamento();
      }

      function adicionarNovoOutro() {
        const modelo = document.getElementById("outroModelo");
        const container = document.getElementById("listaOutros");

        const novoOutro = modelo.cloneNode(true);
        novoOutro.removeAttribute("id");
        novoOutro.style.display = "block";
        novoOutro.classList.add("item-card");
        novoOutro.classList.remove("fechado", "oculto");
        novoOutro.dataset.tipo = "outro";

        novoOutro.dataset.id = gerarId();

        container.appendChild(novoOutro);
        inicializarEventosOutro(novoOutro);
        abrirItemCard(novoOutro);
        atualizarListaArmasEquipamento();

        return novoOutro;
      }

      function coletarOutros() {
        const outros = [];
        const lista = document.querySelectorAll(
          '#listaOutros .item-card[data-tipo="outro"]',
        );

        lista.forEach((card) => {
          const outro = {};

          // 🔹 NOVO: pegar ID existente do card
          let id = card.dataset.id;

          // 🔹 Se não tiver ID, cria um novo
          if (!id) {
            id = gerarId();
            card.dataset.id = id;
          }

          outro.id = id;

          // 🔹 resto dos campos
          card.querySelectorAll("[data-campo]").forEach((campo) => {
            outro[campo.dataset.campo] = campo.value;
          });
          coletarFlagsCompartilhadasItem(card, outro, "outro");

          outros.push(outro);
        });

        return outros;
      }

      function toggleArma(header, event) {
        // 🔥 evita clicar no input ativar o toggle
        if (
          ["INPUT", "SELECT", "TEXTAREA", "LABEL"].includes(
            event.target.tagName,
          )
        )
          return;

        const card = header.closest('.item-card[data-tipo="arma"]');
        if (card.classList.contains("fechado")) abrirItemCard(card);
        else fecharItemCard(card);
      }

      function toggleArmadura(header, event) {
        if (
          ["INPUT", "SELECT", "TEXTAREA", "LABEL"].includes(
            event.target.tagName,
          )
        )
          return;

        const card = header.closest('.item-card[data-tipo="armadura"]');
        if (card.classList.contains("fechado")) abrirItemCard(card);
        else fecharItemCard(card);
      }

      function toggleEscudo(header, event) {
        if (
          ["INPUT", "SELECT", "TEXTAREA", "LABEL"].includes(
            event.target.tagName,
          )
        )
          return;

        const card = header.closest('.item-card[data-tipo="escudo"]');
        if (card.classList.contains("fechado")) abrirItemCard(card);
        else fecharItemCard(card);
      }

      function toggleOutro(header, event) {
        if (
          ["INPUT", "SELECT", "TEXTAREA", "LABEL"].includes(
            event.target.tagName,
          )
        )
          return;

        const card = header.closest('.item-card[data-tipo="outro"]');
        if (card.classList.contains("fechado")) abrirItemCard(card);
        else fecharItemCard(card);
      }

      document.addEventListener("click", (event) => {
        const clicouEmCard = event.target.closest(".item-card");
        const clicouEmBotaoAdicionar = event.target.closest(
          ".inventario-botao-add",
        );
        if (clicouEmCard || clicouEmBotaoAdicionar) return;

        document
          .querySelectorAll(
            '.item-card[data-tipo="arma"], .item-card[data-tipo="armadura"], .item-card[data-tipo="escudo"], .item-card[data-tipo="outro"]',
          )
          .forEach(fecharItemCard);
      });

      let talentosEstruturados = {
        classe: [],
        arquetipo: [],
        raca: [],
        antecedente: [],
        outros: [],
      };
      let configFicha = {
        custom: {
          classe: "",
          subclasse: "",
          raca: "",
          subraca: "",
        },
      };
    
