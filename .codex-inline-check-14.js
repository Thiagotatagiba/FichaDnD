
        // ===== Integracao e inicializacao =====
        window.api?.receberPersonagem((data) => {
            const personagem = JSON.parse(data);
            carregarFicha(personagem);
        });
        window.addEventListener('DOMContentLoaded', () => {
            adicionarNovaArma();
            adicionarNovaArmadura();
            adicionarNovoEscudo();
            adicionarNovoOutro();
        });
        window.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.arma-card').forEach(card => {
                atualizarOpcoesMunicao(card);
            });
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('[data-campo="arma_tipo"]')) {
                const card = e.target.closest('.arma-card');
                if (card) {
                    atualizarProficienciaCard(card);
                }
            }
        });


        // ===== FunÃ§Ã£o: Gerar ID Ãºnico para cada item =====
        function gerarId() {
            return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        }

        // ===== LÃ³gica de MuniÃ§Ã£o DinÃ¢mica =====
        function atualizarTodasMunicoesArmas() {

            const armasItens = document.querySelectorAll('#listaArmas .arma-card');

            armasItens.forEach(card => {
                atualizarOpcoesMunicao(card);
            });
        }

        // atualizar muniÃ§Ã£o
        function atualizarOpcoesMunicao(card) {
            if (!card) return;

            const selectMunicao = card.querySelector('[data-campo="arma_municao_id"]');
            if (!selectMunicao) return;

            // ðŸ”¹ PASSO 1: guardar valor atual
            const valorAtual = selectMunicao.value;

            selectMunicao.innerHTML = '<option value="">Sem MuniÃ§Ã£o</option>';

            const outrosItens = document.querySelectorAll('#listaOutros .armadura-card');

            outrosItens.forEach(item => {
                const tipo = item.querySelector('[data-campo="outro_tipo"]')?.value;
                const nome = item.querySelector('[data-campo="outro_nome"]')?.value;
                const inputQuantidade = item.querySelector('[data-campo="outro_quantidade"]');
                const quantidade = inputQuantidade ? inputQuantidade.value : '';

                let id = item.dataset.id;

                if (!id) {
                    id = gerarId();
                    item.dataset.id = id;
                }

                if (tipo === 'Municao' && nome) {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = `${quantidade || '-'} ${nome}`;

                    selectMunicao.appendChild(option);
                }

            });

            // ðŸ”¹ PASSO 2: restaurar valor
            // ðŸ”¹ restaurar seleÃ§Ã£o corretamente
            let encontrou = false;

            for (let option of selectMunicao.options) {
                if (option.value === valorAtual) {
                    option.selected = true;
                    encontrou = true;
                } else {
                    option.selected = false;
                }
            }

            // ðŸ”¹ fallback
            if (!encontrou) {
                selectMunicao.selectedIndex = 0;
            }

        }

        //CONSUMIR MUNISSÃƒO AO ATACAR
        function consumirMunicao(quantidadeGasta = 1, arma = estadoAtaqueArma.arma) {
            if (!arma?.usaMunicao) {
                return;
            }

            const idMunicao = arma.arma_municao_id;

            const itens = document.querySelectorAll('#listaOutros .armadura-card');

            const item = [...itens].find(itemInventario => itemInventario.dataset.id === idMunicao);

            if (!item) {
                return;
            }

            const inputQtd = item.querySelector('[data-campo="outro_quantidade"]');

            let atual = parseInt(inputQtd.value) || 0;

            if (atual <= 0) {
                alert("Sem muniÃ§Ã£o!");
                return;
            }

            atual -= quantidadeGasta;
            if (atual < 0) atual = 0;

            inputQtd.value = atual;

            // ðŸ”¥ IMPORTANTE: dispara atualizaÃ§Ã£o
            inputQtd.dispatchEvent(new Event('change'));

            // ðŸ”¥ Atualiza selects
            document.querySelectorAll('.arma-card').forEach(card => {
                atualizarOpcoesMunicao(card);
            });
        }

        document.querySelectorAll('.arma-card').forEach(card => {
            atualizarOpcoesMunicao(card);
        });
        //Atualizar automaticamente quando mudar
        document.addEventListener('change', (e) => {
            if (e.target.matches('[data-campo="outro_tipo"], [data-campo="outro_nome"], [data-campo="outro_quantidade"]')) {

                document.querySelectorAll('.arma-card').forEach(card => {
                    atualizarOpcoesMunicao(card);
                });

            }
        });


        // ===== Arsenal cadastrado e inventario de armas =====
        function getTemProficienciaArma(tipo) {
            if (tipo === 'Simples') return !!document.getElementById('profArmaSimples')?.checked;
            if (tipo === 'Marcial') return !!document.getElementById('profArmaMarciais')?.checked;
            return false;
        }

        function getTemProficienciaArmadura(tipo) {
            if (tipo === 'Leve') return !!document.getElementById('profArmaduraLeves')?.checked;
            if (tipo === 'Media') return !!document.getElementById('profArmaduraMedias')?.checked;
            if (tipo === 'Pesada') return !!document.getElementById('profArmaduraPesadas')?.checked;
            return false;
        }

        function getTemProficienciaEscudo(tipo) {
            if (tipo === 'Escudo') return !!document.getElementById('profEscudos')?.checked;
            return true;
        }

        function getValorPesoItem(valor) {
            const texto = String(valor || "").trim().replace(",", ".");
            const numero = parseFloat(texto);
            return Number.isFinite(numero) ? numero : 0;
        }

        function atualizarPesoAtualInventario() {
            const campoPesoAtual = document.getElementById('pesoAtual');
            if (!campoPesoAtual) return;

            const totalArmas = coletarArmas().reduce((soma, arma) => soma + getValorPesoItem(arma.arma_peso), 0);
            const totalArmaduras = coletarArmaduras().reduce((soma, armadura) => soma + getValorPesoItem(armadura.armadura_peso), 0);
            const totalEscudos = coletarEscudos().reduce((soma, escudo) => soma + getValorPesoItem(escudo.escudo_peso), 0);
            const totalOutros = coletarOutros().reduce((soma, outro) => {
                const quantidade = Math.max(1, parseInt(outro.outro_quantidade, 10) || 1);
                return soma + (getValorPesoItem(outro.outro_peso) * quantidade);
            }, 0);
            const total = totalArmas + totalArmaduras + totalEscudos + totalOutros;

            campoPesoAtual.value = Number.isInteger(total) ? total : total.toFixed(2).replace(/\.?0+$/, '');
        }

        function atualizarListaArmasEquipamento() {

            renderizarArmasEquipamento(coletarArmas());
            renderizarArmadurasEquipamento(coletarArmaduras());
            renderizarEscudosEquipamento(coletarEscudos());
            renderizarOutrosEquipamento(coletarOutros());
            atualizarTodasMunicoesArmas();
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

            return arma.arma_dano?.trim() || [arma.dano_1, arma.dano_2].filter(Boolean).join("/");
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
            if (propriedades.duas_maos) listaPropriedades.push("Duas MÃ£os");
            if (propriedades.leve) listaPropriedades.push("Leve");
            if (propriedades.pesada) listaPropriedades.push("Pesada");
            if (propriedades.versatil) listaPropriedades.push("VersÃ¡til");
            if (propriedades.especial) listaPropriedades.push("Especial");


            const distCurta = arma.arma_dist_curto?.trim();
            const distLonga = arma.arma_dist_longo?.trim();
            if ((propriedades.arremesso || propriedades.municao) && (distCurta || distLonga)) {
                listaPropriedades.push(`DistÃ¢ncia (${distCurta || "-"}/${distLonga || "-"})`);
            }

            if (propriedades.municao) {

                let textoMunicao = "MuniÃ§Ã£o";
                const idMunicao = arma.arma_municao_id;


                if (idMunicao) {

                    const item = [...document.querySelectorAll('#listaOutros .armadura-card')]
                        .find(el => el.dataset.id === idMunicao);

                    const nome = item?.querySelector('[data-campo="outro_nome"]')?.value;
                    const qtd = item?.querySelector('[data-campo="outro_quantidade"]')?.value;

                    if (nome) {
                        textoMunicao += ` (${qtd || '-'} ${nome})`;
                    }
                }

                listaPropriedades.push(textoMunicao);
            }



            return listaPropriedades.join(", ");
        }

        function formatarArma(arma) {
            const nome = arma.arma_nome?.trim() || "Arma sem nome";
            const tipo = arma.arma_tipo_dano?.trim() || "-";
            const tipoArma = arma.arma_tipo?.trim() || "";

            const proficiente = typeof arma.proficiente === "boolean"
                ? arma.proficiente
                : getTemProficienciaArma(tipoArma);

            const dano = obterTextoDanoArma(arma) || "-";

            const emojiProf = proficiente
                ? `<span title="Proficiente">â­<br>ðŸ’¥</span>`
                : `<span title="NÃ£o proficiente">âŒ<br>ðŸ’¥</span>`;

            const linha1 = `${nome} ${emojiProf} ${dano} ${tipo}`;

            return {
                linha1,
                linha2: obterResumoPropriedadesArma(arma, true),
                proficiente
            };
        }

        function renderizarArmasEquipamento(listaArmas) {
            const container = document.getElementById("lista-armas-equipamento");
            if (!container) return;

            const selecionados = new Set(
                Array.from(container.querySelectorAll('input:checked')).map(input => input.dataset.index)
            );

            container.innerHTML = "";

            listaArmas.forEach((arma, index) => {
                if (!arma?.arma_nome?.trim()) return;

                const { linha1, linha2, proficiente } = formatarArma(arma);

                const div = document.createElement("div");
                div.classList.add("arma-equipamento");


                const label = document.createElement("label");
                if (!proficiente) label.classList.add("arma-equipamento-nao-proficiente");

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.dataset.index = String(index);
                checkbox.setAttribute("aria-label", "Selecionar arma para equipamento");
                checkbox.checked = selecionados.has(String(index));
                checkbox.addEventListener('change', () => {
                    const marcados = Array.from(container.querySelectorAll('input:checked'));
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

            if (selecionados.size) sincronizarEquipamentosCombate();
        }

        function formatarArmaduraEquipamento(armadura) {
            const nome = armadura.armadura_nome?.trim() || "Armadura sem nome";
            const ca = armadura.armadura_ca?.trim() || "0";
            const bonus = armadura.armadura_bonus?.trim() || "0";
            const furtividade = armadura.armadura_furtividade?.trim() || "Normal";
            const tipo = armadura.armadura_tipo?.trim() || "-";

            const proficiente = typeof armadura.proficiente === "boolean"
                ? armadura.proficiente
                : getTemProficienciaArmadura(tipo);

            const emojiProf = proficiente
                ? `<span title="Proficiente">â­<br></span>`
                : `<span title="NÃ£o proficiente">âŒ<br></span>`;

            return {
                linha1: `${nome} ${emojiProf} ðŸ›¡ï¸ ${ca}`,
                linha2: `Tipo: ${tipo} | BÃ´nus: ${bonus} | Furtividade: ${furtividade}`,
                proficiente
            };
        }

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
            if (propriedades.duas_maos) listaPropriedades.push("Duas MÃ£os");
            if (propriedades.leve) listaPropriedades.push("Leve");
            if (propriedades.pesada) listaPropriedades.push("Pesada");
            if (propriedades.versatil) listaPropriedades.push("VersÃ¡til");
            if (propriedades.especial) listaPropriedades.push("Especial");

            // DistÃ¢ncia
            if ((propriedades.arremesso || propriedades.municao) && (distCurta || distLonga)) {
                listaPropriedades.push(`DistÃ¢ncia (${distCurta || "-"}/${distLonga || "-"})`);
            }

            // ðŸ”¥ MUNIÃ‡ÃƒO DINÃ‚MICA (CORRETA)
            if (propriedades.municao) {

                let textoFinal = "MuniÃ§Ã£o";

                const idMunicao = arma.arma_municao_id;

                if (idMunicao) {

                    const item = [...document.querySelectorAll('#listaOutros .armadura-card')]
                        .find(el => el.dataset.id === idMunicao);

                    const nome = item?.querySelector('[data-campo="outro_nome"]')?.value;
                    const qtd = item?.querySelector('[data-campo="outro_quantidade"]')?.value;

                    if (nome) {
                        textoFinal = `MuniÃ§Ã£o (${qtd || '-'} ${nome})`;
                    }
                }

                listaPropriedades.push(textoFinal);
            }
            return listaPropriedades.join(", ");
        }

        function limparTextoCombate(texto) {
            return String(texto || "")
                .split(",")
                .map(parte => parte.trim())
                .filter(parte => parte && !parte.startsWith("PreÃ§o:") && !parte.startsWith("Peso:"))
                .join(", ");
        }

        function formatarEscudoEquipamento(escudo) {
            const nome = escudo.escudo_nome?.trim() || "Escudo sem nome";
            const ca = escudo.escudo_ca?.trim() || "+0";
            const tipo = escudo.escudo_tipo?.trim() || "-";
            const proficiente = typeof escudo.proficiente === "boolean"
                ? escudo.proficiente
                : getTemProficienciaEscudo(tipo);

            return {
                linha1: `${nome} ${proficiente ? "â­" : "âŒ"} ${ca}`,
                linha2: `Tipo: ${tipo}`,
                proficiente
            };
        }

        function formatarOutroEquipamento(outro) {
            const nome = outro.outro_nome?.trim() || "Item sem nome";
            const tipo = outro.outro_tipo?.trim() || "Outros";
            const quantidade = Math.max(1, parseInt(outro.outro_quantidade, 10) || 1);

            return {
                linha1: `${nome} x${quantidade}`,
                linha2: `Tipo: ${tipo}`
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
            maxSelecoes = null
        }) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const selecionados = Array.from(container.querySelectorAll('input:checked')).map(input => input.dataset.index);
            container.innerHTML = "";

            itens.forEach((item, index) => {
                if (filtroItem && !filtroItem(item)) return;

                const { linha1, linha2, proficiente } = formatarItem(item);

                const div = document.createElement("div");

                div.classList.add("arma-equipamento");

                const label = document.createElement("label");
                if (proficiente === false) label.classList.add("arma-equipamento-nao-proficiente");

                const input = document.createElement("input");
                input.type = inputType;
                if (inputName) input.name = inputName;
                input.dataset.index = String(index);
                input.setAttribute("aria-label", ariaLabel);
                input.checked = multiplo
                    ? selecionados.includes(String(index))
                    : selecionados[0] === String(index);
                input.addEventListener('change', () => {
                    if (input.checked && maxSelecoes) {
                        const marcados = Array.from(container.querySelectorAll('input:checked'));
                        if (marcados.length > maxSelecoes) {
                            input.checked = false;
                            sincronizarEquipamentosCombate();
                            return;
                        }
                    }

                    if (!multiplo && input.checked) {
                        container.querySelectorAll('input').forEach(outroInput => {
                            if (outroInput !== input) outroInput.checked = false;
                        });
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

            if (selecionados.length) sincronizarEquipamentosCombate();
        }

        function renderizarArmadurasEquipamento(listaArmaduras) {
            renderizarListaEquipamento({
                containerId: "lista-armaduras-equipamento",
                itens: listaArmaduras,
                formatarItem: formatarArmaduraEquipamento,
                inputType: "checkbox",
                inputName: "equipamento-armadura",
                ariaLabel: "Selecionar armadura para equipamento",
                filtroItem: armadura => !!armadura?.armadura_nome?.trim(),
                maxSelecoes: 1
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
                filtroItem: escudo => !!escudo?.escudo_nome?.trim(),
                maxSelecoes: 1
            });
        }

        function renderizarOutrosEquipamento(listaOutros) {
            renderizarListaEquipamento({
                containerId: "lista-outros-equipamento",
                itens: listaOutros,
                formatarItem: formatarOutroEquipamento,
                inputType: "checkbox",
                inputName: "equipamento-outro",
                ariaLabel: "Selecionar outro item para equipamento",
                multiplo: true,
                filtroItem: outro => !!outro?.outro_nome?.trim()
            });
        }

        function preencherCampo(id, valor) {
            const campo = document.getElementById(id);
            if (!campo) return;
            if ('value' in campo) campo.value = valor;
            else campo.textContent = valor;
        }

        function obterTextoCampoOuBloco(id) {
            const campo = document.getElementById(id);
            if (!campo) return "";
            if ('value' in campo) return campo.value?.trim() || "";
            return campo.textContent?.trim() || "";
        }

        function limparPrefixoPropriedade(texto) {
            return String(texto || "").replace(/^Propriedade:\s*/i, "").trim();
        }

        function resumirMunicaoNoTexto(texto) {
            return String(texto || "").replace(/Muni[^(,]*\([^)]*\)/i, "MuniÃ§Ã£o");
        }

        function obterStatusMunicaoArma(arma) {
            if (!arma?.usaMunicao) return "";

            const itemMunicao = [...document.querySelectorAll('#listaOutros .armadura-card')]
                .find(item => item.dataset.id === arma.arma_municao_id);

            const nomeMunicao = itemMunicao?.querySelector('[data-campo="outro_nome"]')?.value?.trim();
            const quantidadeMunicao = itemMunicao?.querySelector('[data-campo="outro_quantidade"]')?.value?.trim();

            if (!arma.arma_municao_id || !nomeMunicao) {
                return "SEM MUNIÃ‡ÃƒO";
            }

            return `MuniÃ§Ã£o: ${quantidadeMunicao || "0"} ${nomeMunicao}`;
        }

        function montarTextoPropriedadeArma(arma, textoBase) {
            const textoSemPrefixo = limparPrefixoPropriedade(textoBase);
            const partes = limparTextoCombate(textoSemPrefixo)
                .split(",")
                .map(parte => parte.trim())
                .filter(Boolean)
                .filter(parte => normalizarTextoComparacao(parte) !== "municao");

            const statusMunicao = obterStatusMunicaoArma(arma);
            if (statusMunicao) {
                partes.push(statusMunicao);
            }

            return partes.join(", ");
        }

        function capitalizarTexto(texto) {
            const valor = String(texto || "").trim();
            return valor ? valor.charAt(0).toUpperCase() + valor.slice(1) : "";
        }

        function preencherPropriedadeEquipada(id, valor) {
            const campo = document.getElementById(id);
            if (!campo) return;

            const texto = limparTextoCombate(limparPrefixoPropriedade(valor));
            campo.classList.toggle('vazia', !texto);
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

        function getResumoCalculoAtaque(arma, chaveAtributo = arma?.ataque) {
            const rotuloAtributo = formatarRotuloAtributo(chaveAtributo) || "-";
            const modificadorBase = getModificadorBaseAtributo(chaveAtributo);
            const proficiente = !!arma?.proficiente;
            const bonusProfAplicado = proficiente ? getBonusProf() : 0;
            const totalAtaque = modificadorBase === null ? null : modificadorBase + bonusProfAplicado;

            let textoResumo = rotuloAtributo;
            if (totalAtaque !== null) {
                textoResumo = proficiente && bonusProfAplicado > 0
                    ? `${formatarBonusCalculado(totalAtaque)} (${rotuloAtributo} + ${bonusProfAplicado})`
                    : `${formatarBonusCalculado(totalAtaque)} (${rotuloAtributo})`;
            }

            return {
                rotuloAtributo,
                modificadorBase,
                proficiente,
                bonusProfAplicado,
                totalAtaque,
                textoResumo
            };
        }

        function atualizarSelectAtaqueArma(indice, arma) {
            const select = document.getElementById(`arma${indice}Ataque`);
            if (!select) return;

            const valorAtual = select.value || 'for';
            const resumoFor = getResumoCalculoAtaque(arma, 'for');
            const resumoDes = getResumoCalculoAtaque(arma, 'des');

            select.innerHTML = '';

            const opcoes = [
                { value: 'for', label: `FOR (${resumoFor.totalAtaque === null ? '-' : formatarBonusCalculado(resumoFor.totalAtaque)})` },
                { value: 'des', label: `DES (${resumoDes.totalAtaque === null ? '-' : formatarBonusCalculado(resumoDes.totalAtaque)})` }
            ];

            opcoes.forEach(opcao => {
                const option = document.createElement('option');
                option.value = opcao.value;
                option.textContent = opcao.label;
                select.appendChild(option);
            });

            select.value = ['for', 'des'].includes(valorAtual) ? valorAtual : 'for';
        }

        function atualizarSeletoresAtaqueEquipados() {
            const armas = coletarArmas();
            const armasSelecionadas = Array.from(document.querySelectorAll('#lista-armas-equipamento input:checked'))
                .slice(0, 2)
                .map(input => armas[parseInt(input.dataset.index, 10)])
                .filter(Boolean);

            atualizarSelectAtaqueArma(1, armasSelecionadas[0] || null);
            atualizarSelectAtaqueArma(2, armasSelecionadas[1] || null);
        }

        function obterIndicesArmasMarcadas() {
            return Array.from(document.querySelectorAll('#lista-armas-equipamento input:checked'))
                .slice(0, 2)
                .map(input => parseInt(input.dataset.index, 10))
                .filter(indice => Number.isInteger(indice));
        }

        function atualizarSelectNomeArmaEquipada(indiceSlot, armas, indiceSelecionado) {
            const select = document.getElementById(`arma${indiceSlot}Nome`);
            if (!select) return;

            const placeholder = indiceSlot === 1 ? 'Arma Principal' : 'Arma SecundÃ¡ria';
            select.innerHTML = '';

            const opcaoVazia = document.createElement('option');
            opcaoVazia.value = '';
            opcaoVazia.textContent = placeholder;
            select.appendChild(opcaoVazia);

            armas.forEach((arma, indice) => {
                if (!arma?.arma_nome?.trim()) return;
                const option = document.createElement('option');
                option.value = String(indice);
                option.textContent = arma.arma_nome.trim();
                select.appendChild(option);
            });

            select.value = indiceSelecionado !== null && indiceSelecionado !== undefined ? String(indiceSelecionado) : '';
        }

        function sincronizarMarcacaoArmasPorSlots() {
            const slot1 = document.getElementById('arma1Nome')?.value || '';
            const slot2 = document.getElementById('arma2Nome')?.value || '';
            const desejados = new Set([slot1, slot2].filter(Boolean));

            document.querySelectorAll('#lista-armas-equipamento input').forEach(input => {
                input.checked = desejados.has(input.dataset.index);
            });
        }

        function lidarSelecaoArmaEquipada(indiceSlot) {
            const atual = document.getElementById(`arma${indiceSlot}Nome`);
            const outro = document.getElementById(`arma${indiceSlot === 1 ? 2 : 1}Nome`);
            if (!atual) return;

            if (atual.value && outro && atual.value === outro.value) {
                outro.value = '';
            }

            sincronizarMarcacaoArmasPorSlots();
            sincronizarEquipamentosCombate();
        }

        function desequiparArmaSlot(indiceSlot) {
            const select = document.getElementById(`arma${indiceSlot}Nome`);
            if (select) select.value = '';
            sincronizarMarcacaoArmasPorSlots();
            sincronizarEquipamentosCombate();
        }

        function obterSelecaoArmaEquipada(indiceSlot) {
            const select = document.getElementById(`arma${indiceSlot}Nome`);
            if (!select) return { indice: "", nome: "" };

            const indice = select.value || "";
            const nome = indice !== "" ? (select.options[select.selectedIndex]?.text || "") : "";
            return { indice, nome };
        }

        function resolverIndiceArmaSalva(dados, indiceSlot, armas) {
            const chaveIndice = `arma${indiceSlot}EquipadaIndice`;
            const chaveNome = `arma${indiceSlot}Nome`;
            const valorIndice = parseInt(dados[chaveIndice], 10);

            if (Number.isInteger(valorIndice) && armas[valorIndice]?.arma_nome?.trim()) {
                return valorIndice;
            }

            const nomeSalvo = String(dados[chaveNome] || "").trim();
            if (!nomeSalvo) return null;

            const indicePorNome = armas.findIndex(arma => arma?.arma_nome?.trim() === nomeSalvo);
            return indicePorNome >= 0 ? indicePorNome : null;
        }

        function obterArmasEquipadasAtivas() {
            const armas = coletarArmas();
            const indicesMarcados = obterIndicesArmasMarcadas();
            const indicesSlots = [1, 2].map(indiceSlot => {
                const valor = document.getElementById(`arma${indiceSlot}Nome`)?.value || "";
                const indice = parseInt(valor, 10);
                return Number.isInteger(indice) && indicesMarcados.includes(indice) ? indice : null;
            });
            const faltantes = indicesMarcados.filter(indice => !indicesSlots.includes(indice));
            const indicesEquipados = indicesSlots.map(indice => indice ?? (faltantes.shift() ?? null));

            return indicesEquipados
                .map((indiceArma, indiceSlot) => {
                    const arma = Number.isInteger(indiceArma) ? armas[indiceArma] : null;
                    if (!arma) return null;

                    return {
                        nome: arma.arma_nome?.trim() || "",
                        ataque: obterTextoCampoOuBloco(`arma${indiceSlot + 1}Ataque`) || "for",
                        dano: [obterTextoDanoArma(arma), arma.arma_tipo_dano?.trim() || ""].filter(Boolean).join(" "),
                        propriedade: montarTextoPropriedadeArma(arma, resumirMunicaoNoTexto(obterResumoPropriedadesArma(arma, false))),
                        proficiente: !!arma.proficiente,
                        usaMunicao: !!arma.propriedades?.municao,

                        // ðŸ”¥ NOVO PADRÃƒO
                        arma_municao_id: arma.arma_municao_id || null,

                        // ðŸ”½ dados derivados (somente visual)
                        nomeMunicao: (() => {
                            if (!arma.arma_municao_id) return "";

                            const item = [...document.querySelectorAll('#listaOutros .armadura-card')]
                                .find(el => el.dataset.id === arma.arma_municao_id);

                            return item?.querySelector('[data-campo="outro_nome"]')?.value || "";
                        })(),

                        qtdMunicao: (() => {
                            if (!arma.arma_municao_id) return "";

                            const item = [...document.querySelectorAll('#listaOutros .armadura-card')]
                                .find(el => el.dataset.id === arma.arma_municao_id);

                            return item?.querySelector('[data-campo="outro_quantidade"]')?.value || "";
                        })()
                    };
                })
                .filter(arma => arma && arma.nome);
        }

        function aplicarEstiloProficienciaCampos(ids, proficiente) {
            ids.forEach(id => {
                const campo = document.getElementById(id);
                if (!campo) return;
                campo.classList.toggle('equipados-nao-proficiente', proficiente === false && !!campo.value);
            });
        }

        function normalizarBonusCA(valor) {
            const numero = parseInt(String(valor || "").replace(/[^\d-]/g, ""), 10) || 0;
            return numero;
        }

        function sincronizarEquipamentosCombate() {
            const armas = coletarArmas();
            const armaduras = coletarArmaduras();
            const escudos = coletarEscudos();
            const outros = coletarOutros();


            const indicesMarcados = obterIndicesArmasMarcadas();
            const slot1Atual = document.getElementById('arma1Nome')?.value || '';
            const slot2Atual = document.getElementById('arma2Nome')?.value || '';
            const slotsValidos = [slot1Atual, slot2Atual].map(valor => {
                const indice = parseInt(valor, 10);
                return Number.isInteger(indice) && indicesMarcados.includes(indice) ? indice : null;
            });
            const faltantes = indicesMarcados.filter(indice => !slotsValidos.includes(indice));
            const indicesEquipados = slotsValidos.map(indice => indice ?? (faltantes.shift() ?? null));
            const armasSelecionadas = indicesEquipados.map(indice => Number.isInteger(indice) ? armas[indice] : null);

            atualizarSelectNomeArmaEquipada(1, armas, indicesEquipados[0]);
            atualizarSelectNomeArmaEquipada(2, armas, indicesEquipados[1]);

            [1, 2].forEach(indice => {
                const arma = armasSelecionadas[indice - 1];
                const textoPropriedade = arma ? montarTextoPropriedadeArma(arma, resumirMunicaoNoTexto(obterResumoPropriedadesArma(arma, false))) : "";
                preencherCampo(`arma${indice}Dano`, [obterTextoDanoArma(arma), arma?.arma_tipo_dano?.trim() || ""].filter(Boolean).join(" "));
                preencherPropriedadeEquipada(`arma${indice}Propriedade`, textoPropriedade);
                aplicarEstiloProficienciaCampos(
                    [`arma${indice}Nome`, `arma${indice}Ataque`, `arma${indice}Dano`, `arma${indice}Propriedade`],
                    arma ? formatarArma(arma).proficiente : null
                );
            });

            atualizarSeletoresAtaqueEquipados();

            const armaduraSelecionadaInput = document.querySelector('#lista-armaduras-equipamento input:checked');
            const armaduraSelecionada = armaduraSelecionadaInput
                ? armaduras[parseInt(armaduraSelecionadaInput.dataset.index, 10)]
                : null;

            preencherCampo('armaduraNome', armaduraSelecionada?.armadura_nome?.trim() || "");
            preencherCampo('armaduraCA', armaduraSelecionada?.armadura_ca?.trim() || "");
            preencherCampo('armaduraFurtividade', armaduraSelecionada?.armadura_furtividade?.trim() || "Normal");
            aplicarEstiloProficienciaCampos(
                ['armaduraNome', 'armaduraCA', 'armaduraFurtividade'],
                armaduraSelecionada ? formatarArmaduraEquipamento(armaduraSelecionada).proficiente : null
            );

            const escudoSelecionadoInput = document.querySelector('#lista-escudos-equipamento input:checked');
            const escudoSelecionado = escudoSelecionadoInput
                ? escudos[parseInt(escudoSelecionadoInput.dataset.index, 10)]
                : null;

            preencherCampo('escudoNome', escudoSelecionado?.escudo_nome?.trim() || "");
            preencherCampo('escudoCA', escudoSelecionado?.escudo_ca?.trim() || "");
            aplicarEstiloProficienciaCampos(
                ['escudoNome', 'escudoCA'],
                escudoSelecionado ? formatarEscudoEquipamento(escudoSelecionado).proficiente : null
            );

            const outrosSelecionados = Array.from(document.querySelectorAll('#lista-outros-equipamento input:checked'))
                .map(input => outros[parseInt(input.dataset.index, 10)])
                .filter(Boolean);

            const tiposOutros = outrosSelecionados.map(outro => {
                const nome = outro.outro_nome?.trim() || "Item";
                const quantidade = Math.max(1, parseInt(outro.outro_quantidade, 10) || 1);
                return quantidade > 1 ? `${nome} x${quantidade}` : nome;
            });
            const bonusOutros = outrosSelecionados.reduce((soma, outro) => soma + normalizarBonusCA(outro.outro_ca), 0);

            preencherCampo('outroEquipadoTipo', tiposOutros.join(", "));
            preencherCampo('outroEquipadoCA', bonusOutros ? `+${bonusOutros}` : "");

            ['armaduraCA', 'outroEquipadoCA', 'escudoCA'].forEach(aplicarFormatoCA);
            atualizarClasseArmaduraEquipada();
            atualizarSubAbaArmas();
        }


        // atualiza o "P" de proficiÃªncia quando o tipo de arma muda, verificando os checkboxes de proficiÃªncia
        function atualizarProficienciaCard(card) {
            const selectTipo = card.querySelector('[data-campo="arma_tipo"]');
            const divP = card.querySelector('.arma-proficiencia');

            if (!selectTipo || !divP) return;

            const tipo = selectTipo.value;
            const profSimples = document.getElementById('profArmaSimples')?.checked;
            const profMarcial = document.getElementById('profArmaMarciais')?.checked;

            let temProficiencia = false;

            if (tipo === 'Simples' && profSimples) temProficiencia = true;
            if (tipo === 'Marcial' && profMarcial) temProficiencia = true;

            divP.classList.toggle('ativo', temProficiencia);
            divP.classList.toggle('nao', !temProficiencia);
        }

        function inicializarEventosArma(card) {
            // ==========================================
            // 1. LÃ“GICA DE REMOVER A ARMA
            // ==========================================
            const btnRemover = card.querySelector('.btn-remover-arma');
            if (btnRemover) {
                btnRemover.addEventListener('click', function (e) {
                    e.stopPropagation(); // Impede que o card abra/feche ao clicar no X
                    if (confirm("Deseja remover esta arma?")) {
                        card.remove();
                        atualizarListaArmasEquipamento();
                    }
                });
            }

            // ==========================================
            // 2. LÃ“GICA DO "P" DE PROFICIÃŠNCIA
            // ==========================================
            const divP = card.querySelector('.arma-proficiencia');
            const selectTipo = card.querySelector('[data-campo="arma_tipo"]');

            function atualizarStatusP() {
                if (!divP || !selectTipo) return;

                const tipo = selectTipo.value; // Pega "Simples" ou "Marcial"
                const profSimples = document.getElementById('profArmaSimples')?.checked;
                const profMarciais = document.getElementById('profArmaMarciais')?.checked;

                let temProficiencia = false;
                if (tipo === "Simples" && profSimples) temProficiencia = true;
                if (tipo === "Marcial" && profMarciais) temProficiencia = true;

                // Se tem proficiÃªncia, removemos a classe "nao" (tira o X vermelho). SenÃ£o, colocamos.
                if (temProficiencia) {
                    divP.classList.remove('nao');
                    divP.classList.add('ativo');
                } else {
                    divP.classList.add('nao');
                    divP.classList.remove('ativo');
                }
            }

            // LÃ³gica Manual: Clicar direto no P para ativar/desativar
            if (divP) {
                divP.addEventListener('click', function (e) {
                    e.stopPropagation(); // Impede que o clique abra/feche a arma sem querer
                    const ficouNaoProficiente = this.classList.toggle('nao');
                    this.classList.toggle('ativo', !ficouNaoProficiente);

                    // Opcional: atualiza o resumo de combate
                    if (typeof atualizarSubAbaArmas === "function") atualizarSubAbaArmas();
                    atualizarListaArmasEquipamento();
                });
            }

            // LÃ³gica AutomÃ¡tica: Quando o select de tipo muda, checa a proficiÃªncia
            if (selectTipo) {
                selectTipo.addEventListener('change', atualizarStatusP);
            }

            atualizarStatusP();


            // ==========================================
            // 3. LÃ“GICA DAS PROPRIEDADES (DistÃ¢ncia, MuniÃ§Ã£o, Especial, VersÃ¡til)
            // ==========================================
            const checkboxes = card.querySelectorAll('.arma-propriedades input[type="checkbox"]');
            const distanciaContainer = card.querySelector('.container_distancia');
            const containerMunicao = card.querySelector('.container_municao');
            const containerDescricao = card.querySelector('.arma-container-descricao');
            const registrarListenersCamposArma = () => {
                card.querySelectorAll('[data-campo]').forEach(campo => {
                    if (campo.dataset.listenerResumoArma === 'true') return;
                    campo.addEventListener('input', () => {
                        atualizarPesoAtualInventario();
                        atualizarListaArmasEquipamento();
                        atualizarTodasMunicoesArmas(); // ðŸ”¥ ESSENCIAL
                    });

                    campo.addEventListener('change', () => {
                        atualizarPesoAtualInventario();
                        atualizarListaArmasEquipamento();
                        atualizarTodasMunicoesArmas(); // ðŸ”¥ ESSENCIAL
                    });
                    campo.dataset.listenerResumoArma = 'true';
                });
            };

            // Dano VersÃ¡til
            const checkboxVersatil = Array.from(checkboxes).find(el => el.dataset.propriedade === 'versatil');
            if (checkboxVersatil) {
                checkboxVersatil.addEventListener('change', function () {
                    const containerDano = card.querySelector('.container_dano');
                    if (!containerDano) return;

                    const campoDanoPadrao = containerDano.querySelector('[data-campo="arma_dano"]');
                    const campoDanoUmaMao = containerDano.querySelector('[data-campo="dano_1"]');
                    const campoDanoDuasMaos = containerDano.querySelector('[data-campo="dano_2"]');
                    const valorDanoPadrao = campoDanoPadrao?.value?.trim() || "";
                    const valorDanoUmaMao = campoDanoUmaMao?.value?.trim() || "";
                    const valorDanoDuasMaos = campoDanoDuasMaos?.value?.trim() || "";
                    if (this.checked) {
                        containerDano.innerHTML = `
                    <div style="display:flex; gap:5px;">
                        <input type="text" placeholder="1 mÃ£o" data-campo="dano_1">
                        /
                        <input type="text" placeholder="2 mÃ£os" data-campo="dano_2">
                    </div>
                `;
                        const novoDanoUmaMao = containerDano.querySelector('[data-campo="dano_1"]');
                        const novoDanoDuasMaos = containerDano.querySelector('[data-campo="dano_2"]');
                        if (novoDanoUmaMao) novoDanoUmaMao.value = valorDanoUmaMao || valorDanoPadrao;
                        if (novoDanoDuasMaos) novoDanoDuasMaos.value = valorDanoDuasMaos;
                    } else {
                        containerDano.innerHTML = `
                    <input type="text" data-campo="arma_dano" placeholder="ex: 1d8">
                `;
                        const novoDanoPadrao = containerDano.querySelector('[data-campo="arma_dano"]');
                        if (novoDanoPadrao) novoDanoPadrao.value = valorDanoUmaMao || valorDanoPadrao || valorDanoDuasMaos;
                    }
                    registrarListenersCamposArma();
                    atualizarListaArmasEquipamento();
                });
            }

            // Mostrar/Esconder Containers
            function atualizarCamposArma() {
                let temArremesso = false;
                let temMunicao = false;
                let temEspecial = false;

                checkboxes.forEach(cb => {
                    const propriedade = cb.dataset.propriedade;
                    if (cb.checked) {
                        if (propriedade === 'arremesso') temArremesso = true;
                        if (propriedade === 'municao') temMunicao = true;
                        if (propriedade === 'especial') temEspecial = true;
                    }
                });

                if (distanciaContainer) distanciaContainer.style.display = (temArremesso || temMunicao) ? 'block' : 'none';
                if (containerMunicao) containerMunicao.style.display = temMunicao ? 'block' : 'none';
                if (containerDescricao) containerDescricao.style.display = temEspecial ? 'block' : 'none';
            }

            checkboxes.forEach(cb => cb.addEventListener('change', atualizarCamposArma));
            registrarListenersCamposArma();
            checkboxes.forEach(cb => {
                cb.addEventListener('change', atualizarListaArmasEquipamento);
            });

            // ==========================================
            // 4. INICIALIZAÃ‡ÃƒO AUTOMÃTICA
            // Roda essas funÃ§Ãµes logo que a arma Ã© criada
            // ==========================================
            atualizarStatusP();
            atualizarCamposArma();
            atualizarListaArmasEquipamento();
        }

        // ===== Listeners finais e sincronizacoes automaticas =====
        ['profArmaSimples', 'profArmaMarciais'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    const tipoAlvo = (id === 'profArmaSimples') ? 'Simples' : 'Marcial';

                    document.querySelectorAll('.arma-card:not(#armaModelo)').forEach(card => {
                        const selectTipo = card.querySelector('[data-campo="arma_tipo"]');
                        const divP = card.querySelector('.arma-proficiencia');

                        if (selectTipo && divP && selectTipo.value === tipoAlvo) {
                            if (el.checked) {
                                divP.classList.remove('nao');
                                divP.classList.add('ativo');
                            } else {
                                divP.classList.add('nao');
                                divP.classList.remove('ativo');
                            }
                        }
                    });
                    atualizarListaArmasEquipamento();
                    sincronizarEquipamentosCombate();
                    atualizarSubAbaArmas();
                });
            }
        });

        ['profArmaduraLeves', 'profArmaduraMedias', 'profArmaduraPesadas'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    document.querySelectorAll('#listaArmaduras .armadura-card').forEach(card => {
                        atualizarProficienciaCardArmadura(card);
                    });
                    atualizarListaArmasEquipamento();
                });
            }
        });

        const campoProfEscudos = document.getElementById('profEscudos');
        if (campoProfEscudos) {
            campoProfEscudos.addEventListener('change', () => {
                document.querySelectorAll('#listaEscudos .armadura-card').forEach(card => {
                    atualizarProficienciaCardEscudo(card);
                });
                atualizarListaArmasEquipamento();
            });
        }

        // Adiciona um novo card de arma a partir do modelo oculto
        function adicionarNovaArma() {
            const modelo = document.getElementById('armaModelo');
            const container = document.getElementById('listaArmas');
            const novaArma = modelo.cloneNode(true);
            novaArma.removeAttribute('id');
            novaArma.style.display = 'block';

            container.appendChild(novaArma);


            inicializarEventosArma(novaArma);
            atualizarListaArmasEquipamento();



            return novaArma; // ðŸ”¥ ANTES ESTAVA 'novoCard', POR ISSO DAVA ERRO
        }


        function coletarArmas() {
            const armas = [];
            const lista = document.querySelectorAll('.arma-card:not(#armaModelo)');

            lista.forEach(card => {
                const arma = {};
                const indicadorProficiencia = card.querySelector('.arma-proficiencia');

                // 1. Campos normais
                card.querySelectorAll('[data-campo]').forEach(campo => {
                    arma[campo.dataset.campo] = campo.value;
                });

                // 2. Propriedades (checkbox)
                arma.propriedades = {};
                card.querySelectorAll('.propriedade-checkbox').forEach(checkbox => {
                    const nomePropriedade = checkbox.dataset.propriedade;
                    arma.propriedades[nomePropriedade] = checkbox.checked;
                });

                // ðŸ”¥ NOVO: FLAG DIRETA
                arma.usaMunicao = !!arma.propriedades.municao;

                // Proficiencia
                arma.proficiente = indicadorProficiencia
                    ? !indicadorProficiencia.classList.contains('nao')
                    : getTemProficienciaArma(arma.arma_tipo?.trim());

                armas.push(arma);
            });

            return armas;
        }

        function atualizarProficienciaCardArmadura(card) {
            const selectTipo = card.querySelector('[data-campo="armadura_tipo"]');
            const divP = card.querySelector('.arma-proficiencia');

            if (!selectTipo || !divP) return;

            const temProficiencia = getTemProficienciaArmadura(selectTipo.value);
            divP.classList.toggle('ativo', temProficiencia);
            divP.classList.toggle('nao', !temProficiencia);
        }

        function inicializarEventosArmadura(card) {
            const btnRemover = card.querySelector('.btn-remover-arma');
            if (btnRemover) {
                btnRemover.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (confirm("Deseja remover esta armadura?")) {
                        card.remove();
                        atualizarPesoAtualInventario();
                        atualizarListaArmasEquipamento();
                    }
                });
            }

            const divP = card.querySelector('.arma-proficiencia');
            const selectTipo = card.querySelector('[data-campo="armadura_tipo"]');

            if (divP) {
                divP.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const ficouNaoProficiente = this.classList.toggle('nao');
                    this.classList.toggle('ativo', !ficouNaoProficiente);
                    atualizarListaArmasEquipamento();
                });
            }

            if (selectTipo) {
                selectTipo.addEventListener('change', () => {
                    atualizarProficienciaCardArmadura(card);
                    atualizarListaArmasEquipamento();
                });
            }

            card.querySelectorAll('[data-campo]').forEach(campo => {
                campo.addEventListener('input', atualizarPesoAtualInventario);
                campo.addEventListener('change', atualizarPesoAtualInventario);
                campo.addEventListener('input', atualizarListaArmasEquipamento);
                campo.addEventListener('change', atualizarListaArmasEquipamento);
            });

            atualizarProficienciaCardArmadura(card);
            atualizarPesoAtualInventario();
            atualizarListaArmasEquipamento();
        }

        function adicionarNovaArmadura() {
            const modelo = document.getElementById('armaduraModelo');
            const container = document.getElementById('listaArmaduras');

            const novaArmadura = modelo.cloneNode(true);
            novaArmadura.removeAttribute('id');
            novaArmadura.style.display = 'block';

            container.appendChild(novaArmadura);
            inicializarEventosArmadura(novaArmadura);
            atualizarPesoAtualInventario();
            atualizarListaArmasEquipamento();

            return novaArmadura;
        }

        function coletarArmaduras() {
            const armaduras = [];
            const lista = document.querySelectorAll('#listaArmaduras .armadura-card');

            lista.forEach(card => {
                const armadura = {};
                const indicadorProficiencia = card.querySelector('.arma-proficiencia');

                card.querySelectorAll('[data-campo]').forEach(campo => {
                    armadura[campo.dataset.campo] = campo.value;
                });

                armadura.proficiente = indicadorProficiencia
                    ? !indicadorProficiencia.classList.contains('nao')
                    : getTemProficienciaArmadura(armadura.armadura_tipo?.trim());

                armaduras.push(armadura);
            });

            return armaduras;
        }

        function atualizarProficienciaCardEscudo(card) {
            const selectTipo = card.querySelector('[data-campo="escudo_tipo"]');
            const divP = card.querySelector('.arma-proficiencia');

            if (!selectTipo || !divP) return;

            const temProficiencia = getTemProficienciaEscudo(selectTipo.value);
            divP.classList.toggle('ativo', temProficiencia);
            divP.classList.toggle('nao', !temProficiencia);
        }

        function inicializarEventosEscudo(card) {
            const btnRemover = card.querySelector('.btn-remover-arma');
            if (btnRemover) {
                btnRemover.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (confirm("Deseja remover este escudo ou vestimento?")) {
                        card.remove();
                        atualizarPesoAtualInventario();
                        atualizarListaArmasEquipamento();
                    }
                });
            }

            const divP = card.querySelector('.arma-proficiencia');
            const selectTipo = card.querySelector('[data-campo="escudo_tipo"]');

            if (divP) {
                divP.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const ficouNaoProficiente = this.classList.toggle('nao');
                    this.classList.toggle('ativo', !ficouNaoProficiente);
                    atualizarListaArmasEquipamento();
                });
            }

            if (selectTipo) {
                selectTipo.addEventListener('change', () => {
                    atualizarProficienciaCardEscudo(card);
                    atualizarListaArmasEquipamento();
                });
            }

            card.querySelectorAll('[data-campo]').forEach(campo => {
                campo.addEventListener('input', atualizarPesoAtualInventario);
                campo.addEventListener('change', atualizarPesoAtualInventario);
                campo.addEventListener('input', atualizarListaArmasEquipamento);
                campo.addEventListener('change', atualizarListaArmasEquipamento);
            });

            atualizarProficienciaCardEscudo(card);
            atualizarPesoAtualInventario();
            atualizarListaArmasEquipamento();
        }

        function adicionarNovoEscudo() {
            const modelo = document.getElementById('escudoModelo');
            const container = document.getElementById('listaEscudos');

            const novoEscudo = modelo.cloneNode(true);
            novoEscudo.removeAttribute('id');
            novoEscudo.style.display = 'block';

            container.appendChild(novoEscudo);
            inicializarEventosEscudo(novoEscudo);
            atualizarListaArmasEquipamento();

            return novoEscudo;
        }

        function coletarEscudos() {
            const escudos = [];
            const lista = document.querySelectorAll('#listaEscudos .armadura-card');

            lista.forEach(card => {
                const escudo = {};
                const indicadorProficiencia = card.querySelector('.arma-proficiencia');

                card.querySelectorAll('[data-campo]').forEach(campo => {
                    escudo[campo.dataset.campo] = campo.value;
                });

                escudo.proficiente = indicadorProficiencia
                    ? !indicadorProficiencia.classList.contains('nao')
                    : getTemProficienciaEscudo(escudo.escudo_tipo?.trim());

                escudos.push(escudo);
            });

            return escudos;
        }

        // O card de "outros" Ã© mais simples, sem proficiÃªncia ou propriedades, entÃ£o a lÃ³gica Ã© mais direta
        function inicializarEventosOutro(card) {
            const btnRemover = card.querySelector('.btn-remover-arma');
            if (btnRemover) {
                btnRemover.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (confirm("Deseja remover este item?")) {
                        card.remove();
                        atualizarPesoAtualInventario();
                        atualizarListaArmasEquipamento();
                    }
                });
            }

            card.querySelectorAll('[data-campo]').forEach(campo => {
                campo.addEventListener('input', atualizarPesoAtualInventario);
                campo.addEventListener('change', atualizarPesoAtualInventario);
                campo.addEventListener('input', atualizarListaArmasEquipamento);
                campo.addEventListener('change', atualizarListaArmasEquipamento);
            });

            card.querySelectorAll('[data-campo]').forEach(campo => {
                campo.addEventListener('input', () => {
                    atualizarPesoAtualInventario();
                    atualizarListaArmasEquipamento();


                });

                campo.addEventListener('change', () => {
                    atualizarPesoAtualInventario();
                    atualizarListaArmasEquipamento();
                });
            });

            atualizarPesoAtualInventario();
            atualizarListaArmasEquipamento();
        }

        function adicionarNovoOutro() {
            const modelo = document.getElementById('outroModelo');
            const container = document.getElementById('listaOutros');

            const novoOutro = modelo.cloneNode(true);
            novoOutro.removeAttribute('id');
            novoOutro.style.display = 'block';

            container.appendChild(novoOutro);
            inicializarEventosOutro(novoOutro);
            atualizarListaArmasEquipamento();

            return novoOutro;
        }

        function coletarOutros() {
            const outros = [];
            const lista = document.querySelectorAll('#listaOutros .armadura-card');

            lista.forEach(card => {
                const outro = {};

                // ðŸ”¹ NOVO: pegar ID existente do card
                let id = card.dataset.id;

                // ðŸ”¹ Se nÃ£o tiver ID, cria um novo
                if (!id) {
                    id = gerarId();
                    card.dataset.id = id;
                }

                outro.id = id;

                // ðŸ”¹ resto dos campos
                card.querySelectorAll('[data-campo]').forEach(campo => {
                    outro[campo.dataset.campo] = campo.value;
                });

                outros.push(outro);
            });

            return outros;
        }

        function toggleArma(header, event) {
            // ðŸ”¥ evita clicar no input ativar o toggle
            if (event.target.tagName === 'INPUT') return;

            const card = header.closest('.arma-card');
            const icon = header.querySelector('.arma-toggle');

            card.classList.toggle('fechado');

            if (card.classList.contains('fechado')) {
                icon.textContent = 'ðŸ”½';
            } else {
                icon.textContent = 'ðŸ”¼';
            }
        }

        function toggleArmadura(header, event) {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;

            const card = header.closest('.armadura-card');
            const icon = header.querySelector('.arma-toggle');

            card.classList.toggle('fechado');

            if (card.classList.contains('fechado')) {
                icon.textContent = 'ðŸ”½';
            } else {
                icon.textContent = 'ðŸ”¼';
            }
        }

        function toggleEscudo(header, event) {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;

            const card = header.closest('.armadura-card');
            const icon = header.querySelector('.arma-toggle');

            card.classList.toggle('fechado');

            if (card.classList.contains('fechado')) {
                icon.textContent = 'ðŸ”½';
            } else {
                icon.textContent = 'ðŸ”¼';
            }
        }

        function toggleOutro(header, event) {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') return;

            const card = header.closest('.armadura-card');
            const icon = header.querySelector('.arma-toggle');

            card.classList.toggle('fechado');

            if (card.classList.contains('fechado')) {
                icon.textContent = 'ðŸ”½';
            } else {
                icon.textContent = 'ðŸ”¼';
            }
        }

        // ===== Persistencia da ficha =====
        function normalizarDadosImportacao(dadosOriginais) {
            if (!dadosOriginais || typeof dadosOriginais !== "object") return {}

            const dados = { ...dadosOriginais }
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
                carBase: "car"
            }

            Object.entries(aliases).forEach(([origem, destino]) => {
                if ((dados[destino] === undefined || dados[destino] === "") && dados[origem] !== undefined) {
                    dados[destino] = dados[origem]
                }
            });

            ['bonusProf', 'bonusProficiencia'].forEach(chave => {
                if (dados[chave] !== undefined && dados[chave] !== null && dados[chave] !== "") {
                    const valorNormalizado = parseInt(String(dados[chave]).replace(/[^\d-]/g, ""), 10);
                    if (!Number.isNaN(valorNormalizado)) {
                        dados[chave] = Math.abs(valorNormalizado);
                    }
                }
            });

            return dados
        }

        function adicionarAliasesLegacyAoSave(dados) {
            if (!dados || typeof dados !== "object") return dados

            dados.nomePlayer = dados.jogador ?? ""
            dados.classeNome = dados.classeNomeID ?? ""
            dados.classeNivel = dados.classeNivelID ?? ""
            dados.raca = dados.racaID ?? ""
            dados.antecedente = dados.antecedenteID ?? ""
            dados.alinhamento = dados.alinhamentoID ?? ""
            dados.bonusProficiencia = dados.bonusProf ?? ""
            dados.forBase = dados.for ?? ""
            dados.desBase = dados.des ?? ""
            dados.conBase = dados.con ?? ""
            dados.intBase = dados.int ?? ""
            dados.sabBase = dados.sab ?? ""
            dados.carBase = dados.car ?? ""

            return dados
        }

        function normalizarValorAlinhamento(valor) {
            const texto = String(valor || "").trim()
            if (!texto) return ""

            const mapa = {
                "Leal e Bom": "Leal e Bom (LB)",
                "Neutro e Bom": "Neutro e Bom (NB)",
                "CaÃ³tico e Bom": "CaÃƒÂ³tico e Bom (CB)",
                "Leal e Neutro": "Leal e Neutro (LN)",
                "Neutro": "Neutro (N)",
                "CaÃ³tico e Neutro": "CaÃƒÂ³tico e Neutro (CN)",
                "Leal e Mau": "Leal e Mau (LM)",
                "Neutro e Mau": "Neutro e Mau (NM)",
                "CaÃ³tico e Mau": "CaÃƒÂ³tico e Mau (CM)"
            }

            return mapa[texto] || texto
        }

        function aplicarDadosFicha(dados) {

            if (!dados || typeof dados !== "object") return

            dados = normalizarDadosImportacao(dados)

            for (let key in dados) {
                const campo = document.getElementById(key)
                if (!campo) continue
                if (['arma1Nome', 'arma2Nome', 'arma1Dano', 'arma2Dano'].includes(key)) continue

                if (key === "magiaAtributoConjuracao") campo.value = normalizarChaveAtributo(dados[key])
                else if (key === "alinhamentoID") campo.value = normalizarValorAlinhamento(dados[key])
                else if (key === "dadosVidaTipo") campo.value = normalizarTipoDadoVida(dados[key])
                else if (campo.type === "checkbox") campo.checked = dados[key]
                else if (campo.type === "number") {
                    const valorNumerico = parseInt(String(dados[key] ?? "").replace(/[^\d-]/g, ""), 10)
                    campo.value = Number.isNaN(valorNumerico) ? "" : Math.abs(valorNumerico)
                }
                else campo.value = dados[key]
            }

            // =========================
            // ðŸŸ¢ 1. CARREGAR MUNIÃ‡Ã•ES PRIMEIRO
            // =========================
            if (dados.outros && Array.isArray(dados.outros)) {
                const containerOutros = document.getElementById('listaOutros')

                if (containerOutros) {
                    const outrosAtuais = containerOutros.querySelectorAll('.armadura-card')
                    outrosAtuais.forEach(o => o.remove())

                    dados.outros.forEach(dadosOutro => {
                        const novoCard = adicionarNovoOutro()

                        if (!novoCard) return

                        novoCard.querySelectorAll('[data-campo]').forEach(campo => {
                            const valor = dadosOutro[campo.dataset.campo]
                            if (valor !== undefined) campo.value = valor
                        })

                        // â­ CORREÃ‡ÃƒO PRINCIPAL
                        if (dadosOutro.id) {
                            novoCard.dataset.id = dadosOutro.id
                        }
                        atualizarOpcoesMunicao(novoCard);
                    })
                }
            }

            // =========================
            // ðŸ”« 2. AGORA CARREGAR ARMAS
            // =========================
            if (dados.armas && Array.isArray(dados.armas)) {
                const containerArmas = document.getElementById('listaArmas')

                if (containerArmas) {
                    const armasAtuais = containerArmas.querySelectorAll('.arma-card:not(#armaModelo)')
                    armasAtuais.forEach(a => a.remove())

                    dados.armas.forEach(dadosArma => {
                        const novoCard = adicionarNovaArma()
                        if (!novoCard) return

                        // propriedades
                        if (dadosArma.propriedades) {
                            novoCard.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                                const prop = checkbox.dataset.propriedade
                                if (prop && dadosArma.propriedades[prop] !== undefined) {
                                    checkbox.checked = dadosArma.propriedades[prop]
                                    checkbox.dispatchEvent(new Event('change'))
                                }
                            })
                        }

                        // campos bÃ¡sicos
                        novoCard.querySelectorAll('[data-campo]').forEach(campo => {
                            const valor = dadosArma[campo.dataset.campo]
                            if (valor !== undefined) campo.value = valor
                        })

                        // â­ CORREÃ‡ÃƒO PRINCIPAL (muniÃ§Ã£o)
                        atualizarOpcoesMunicao(novoCard)

                        setTimeout(() => {
                            const selectMunicao = novoCard.querySelector('[data-campo="arma_municao_id"]')

                            if (selectMunicao && dadosArma.arma_municao_id) {
                                selectMunicao.value = String(dadosArma.arma_municao_id)
                                selectMunicao.dispatchEvent(new Event('change'))
                            }
                        }, 0)

                        // proficiÃªncia
                        if (typeof dadosArma.proficiente === "boolean") {
                            const indicadorProficiencia = novoCard.querySelector('.arma-proficiencia')
                            if (indicadorProficiencia) {
                                indicadorProficiencia.classList.toggle('nao', !dadosArma.proficiente)
                                indicadorProficiencia.classList.toggle('ativo', dadosArma.proficiente)
                            }
                        }
                    })
                }
            }

            // =========================
            // ðŸ›¡ï¸ 3. CARREGAR ARMADURAS
            // =========================
            if (dados.armaduras && Array.isArray(dados.armaduras)) {
                const containerArmaduras = document.getElementById('listaArmaduras')

                if (containerArmaduras) {
                    const armadurasAtuais = containerArmaduras.querySelectorAll('.armadura-card:not(#armaduraModelo)')
                    armadurasAtuais.forEach(a => a.remove())

                    dados.armaduras.forEach(dadosArmadura => {
                        const novoCard = adicionarNovaArmadura()
                        if (!novoCard) return

                        novoCard.querySelectorAll('[data-campo]').forEach(campo => {
                            const valor = dadosArmadura[campo.dataset.campo]

                            if (valor !== undefined) {
                                campo.value = valor

                                // ðŸ”¥ ESSENCIAL (mesmo padrÃ£o das armas)
                                campo.dispatchEvent(new Event('change'))
                            }
                        })

                        if (typeof dadosArmadura.proficiente === "boolean") {
                            const indicadorProficiencia = novoCard.querySelector('.arma-proficiencia')

                            if (indicadorProficiencia) {
                                indicadorProficiencia.classList.toggle('nao', !dadosArmadura.proficiente)
                                indicadorProficiencia.classList.toggle('ativo', dadosArmadura.proficiente)
                            }
                        }
                    })
                }
            }

            // =========================
            // RESTO DO SEU CÃ“DIGO (SEM MUDANÃ‡A)
            // =========================

            atualizarListaArmasEquipamento()

            const armasImportadas = coletarArmas()
            const indiceArma1 = resolverIndiceArmaSalva(dados, 1, armasImportadas)
            const indiceArma2Base = resolverIndiceArmaSalva(dados, 2, armasImportadas)
            const indiceArma2 = indiceArma2Base === indiceArma1 ? null : indiceArma2Base

            atualizarSelectNomeArmaEquipada(1, armasImportadas, indiceArma1)
            atualizarSelectNomeArmaEquipada(2, armasImportadas, indiceArma2)

            sincronizarMarcacaoArmasPorSlots()
            sincronizarEquipamentosCombate()

            sincronizarSalvaguardasComAtributosBase()
            atualizarAtributos()
            desenharRadar()
            atualizarModificadoresSalvaguarda()
            atualizarPericias()
            atualizarPassivas()
            atualizarClasseArmaduraEquipada()
            atualizarSubAbaArmas()
            sincronizarClasseNivel(true)
            sincronizarResumoCaracteristicas(true)
            sincronizarCamposMagia()
            atualizarMagias()
            normalizarPontosDeVida()
            normalizarDadosVida()
            atualizarPesoAtualInventario()
            marcarFichaComoSalva()
        }



        function carregarFicha(personagem) {
            aplicarDadosFicha(personagem)
        }

        function coletarDadosFicha() {

            const dados = {}

            document.querySelectorAll("input, select, textarea").forEach(campo => {
                if (!campo.id) return
                dados[campo.id] = campo.type === "checkbox" ? campo.checked : campo.value
            })

            const arma1Equipada = obterSelecaoArmaEquipada(1)
            const arma2Equipada = obterSelecaoArmaEquipada(2)
            dados.arma1Nome = arma1Equipada.nome
            dados.arma2Nome = arma2Equipada.nome
            dados.arma1EquipadaIndice = arma1Equipada.indice
            dados.arma2EquipadaIndice = arma2Equipada.indice

            return adicionarAliasesLegacyAoSave(dados)
        }

        let ultimoEstadoSalvo = JSON.stringify(coletarDadosFicha())

        function marcarFichaComoSalva() {
            ultimoEstadoSalvo = JSON.stringify(coletarDadosFicha())
        }

        function fichaFoiAlterada() {
            return JSON.stringify(coletarDadosFicha()) !== ultimoEstadoSalvo
        }

        /* SALVAR Ficha*/
        function salvarFicha() {

            const dados = coletarDadosFicha()
            dados.armas = coletarArmas();
            dados.armaduras = coletarArmaduras();
            dados.escudos = coletarEscudos();
            dados.outros = coletarOutros();

            const nome = document.getElementById("nomePersonagem").value || "Personagem"
            const jogador = document.getElementById("jogador").value || "Jogador"

            const hoje = new Date()
            const data = hoje.getFullYear().toString() +
                String(hoje.getMonth() + 1).padStart(2, '0') +
                String(hoje.getDate()).padStart(2, '0')

            const nomeArquivo = `${nome}_${jogador}_${data}.json`
                .replace(/\s+/g, "_")

            const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" })
            const a = document.createElement("a")
            a.href = URL.createObjectURL(blob)
            a.download = nomeArquivo
            a.click()


            marcarFichaComoSalva()
        }

        /* IMPORTAR Ficha*/





        function importarFicha(json) {
            // Se recebeu JSON diretamente, aplica imediatamente
            if (json !== undefined && json !== null) {
                try {
                    const dados = (typeof json === 'string') ? JSON.parse(json) : json;
                    if (typeof aplicarDadosFicha === 'function') {
                        aplicarDadosFicha(dados);
                    } else {
                        console.warn('aplicarDadosFicha nÃ£o encontrada; dados lidos:', dados);
                    }
                } catch (err) {
                    console.error('importarFicha: JSON invÃ¡lido', err);
                    alert('Erro: JSON invÃ¡lido.');
                }
                return;
            }

            // Sem argumento: abrir file picker
            let fileInput = document.getElementById('fileInput');

            // cria input se nÃ£o existir
            if (!fileInput) {
                fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json,application/json';
                fileInput.id = 'fileInput';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
            }

            // remove listeners antigos (clonar Ã© a forma mais simples)
            const newInput = fileInput.cloneNode(true);
            fileInput.parentNode.replaceChild(newInput, fileInput);
            fileInput = newInput;

            // adiciona listener de leitura
            fileInput.addEventListener('change', function (evt) {
                const file = evt.target.files && evt.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        const dados = JSON.parse(e.target.result);
                        if (typeof aplicarDadosFicha === 'function') {
                            aplicarDadosFicha(dados);
                        } else {
                            console.warn('aplicarDadosFicha nÃ£o definida; arquivo lido:', dados);
                        }
                    } catch (err) {
                        console.error('importarFicha: erro ao parsear JSON do arquivo', err);
                        alert('Erro ao importar: JSON invÃ¡lido.');
                    } finally {
                        try { fileInput.value = ''; } catch (ignore) { }
                    }
                };
                reader.onerror = function (e) {
                    console.error('importarFicha: FileReader error', e);
                    alert('Erro ao ler o arquivo.');
                    try { fileInput.value = ''; } catch (ignore) { }
                };
                reader.readAsText(file, 'utf-8');
            });

            // abre o diÃ¡logo
            try {
                fileInput.click();
            } catch (err) {
                console.error('importarFicha: falha ao abrir file picker', err);
                alert('NÃ£o foi possÃ­vel abrir o seletor de arquivos.');
            }

        }
        // ===== Atributos, radar e navegacao principal =====
        function atualizarAtributos() {

            const inputs = document.querySelectorAll(".atributo input")

            inputs.forEach(input => {

                let v = parseInt(input.value) || 0

                if (v > 20) v = 20
                if (v < 0) v = 0

                input.value = v

                const m = Math.floor((v - 10) / 2)

                input.parentElement.querySelector(".mod").innerText =
                    (m >= 0 ? "+" : "") + m
            })

            atualizarIniciativa()
            atualizarSeletoresAtaqueEquipados()
        }

        function atualizarIniciativa() {

            const campoIniciativa = document.getElementById("iniciativa")
            const valorDestreza = parseInt(document.getElementById("salv_des")?.value) || 0
            const modificadorDestreza = Math.floor((valorDestreza - 10) / 2)

            campoIniciativa.value = (modificadorDestreza >= 0 ? "+" : "") + modificadorDestreza
        }

        function desenharRadar() {

            const canvas = document.getElementById("radar")
            const ctx = canvas.getContext("2d")

            const cx = 130
            const cy = 130
            const raio = 95

            const inputs = document.querySelectorAll(".atributo input")

            let valores = []

            inputs.forEach(input => {
                valores.push(parseInt(input.value) || 0)
            })

            ctx.clearRect(0, 0, 260, 260)

            ctx.strokeStyle = "#c8b9a5"

            for (let i = 1; i <= 4; i++) {
                ctx.beginPath()
                ctx.arc(cx, cy, (raio / 4) * i, 0, Math.PI * 2)
                ctx.stroke()
            }

            for (let i = 0; i < 6; i++) {
                let ang = (Math.PI * 2 / 6) * i - Math.PI / 2
                let x = cx + Math.cos(ang) * raio
                let y = cy + Math.sin(ang) * raio

                ctx.beginPath()
                ctx.moveTo(cx, cy)
                ctx.lineTo(x, y)
                ctx.stroke()
            }

            ctx.beginPath()

            for (let i = 0; i < 6; i++) {
                let ang = (Math.PI * 2 / 6) * i - Math.PI / 2
                let r = raio * (valores[i] / 20)

                let x = cx + Math.cos(ang) * r
                let y = cy + Math.sin(ang) * r

                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }

            ctx.closePath()
            ctx.fillStyle = "rgba(150,80,50,0.4)"
            ctx.fill()

            ctx.strokeStyle = "#8b4513"
            ctx.lineWidth = 2
            ctx.stroke()
        }

        window.addEventListener("beforeunload", function (e) {
            if (!fichaFoiAlterada()) return
            e.preventDefault()
            e.returnValue = ''
        })

        function trocarAba(nome, el) {

            document.querySelectorAll(".aba").forEach(a => {
                a.classList.remove("ativa")
            })

            document.querySelectorAll(".tab").forEach(t => {
                t.classList.remove("active")
            })

            document.getElementById(nome).classList.add("ativa")
            el.classList.add("active")
        }


        function formatarBonusProf() {
            const input = document.getElementById("bonusProf");
            if (!input) return 0;

            let valor = parseInt(String(input.value).replace(/[^\d-]/g, ""), 10) || 0;
            if (valor < 0) valor = Math.abs(valor);

            input.value = String(valor);
            return valor;
        }

        function getBonusProf() {
            return formatarBonusProf();
        }

        function formatarPvTemporario() {
            const input = document.getElementById("pvTemporario");
            if (!input) return 0;

            let valor = parseInt(String(input.value).replace(/[^\d-]/g, "")) || 0;
            if (valor < 0) valor = 0;

            input.value = valor;
            return valor;
        }

        function normalizarPontosDeVida() {
            const campoAtual = document.getElementById("pvAtual");
            const campoTotal = document.getElementById("pvTotal");

            if (!campoAtual || !campoTotal) return;

            let pvAtual = parseInt(String(campoAtual.value).replace(/[^\d-]/g, "")) || 0;
            let pvTotal = parseInt(String(campoTotal.value).replace(/[^\d-]/g, "")) || 0;
            const pvTemporario = formatarPvTemporario();

            if (pvAtual < 0) pvAtual = 0;
            if (pvTotal < 0) pvTotal = 0;

            const limiteMaximo = pvTotal + pvTemporario;
            if (pvAtual > limiteMaximo) pvAtual = limiteMaximo;

            campoAtual.value = pvAtual;
            campoTotal.value = pvTotal;

            atualizarResumoAtaquesConjuracao();
            verificarStatusMorte();
        }

        function normalizarDadosVida() {
            const campoRestantes = document.getElementById("dadosVidaRestantes");
            const campoTotal = document.getElementById("dadosVidaTotal");

            if (!campoRestantes || !campoTotal) return;

            let restantes = parseInt(String(campoRestantes.value).replace(/[^\d-]/g, "")) || 0;
            let total = parseInt(String(campoTotal.value).replace(/[^\d-]/g, "")) || 0;

            if (restantes < 0) restantes = 0;
            if (total < 0) total = 0;
            if (restantes > total) restantes = total;

            campoRestantes.value = restantes;
            campoTotal.value = total;
        }

        function normalizarTipoDadoVida(valor) {
            const textoNormalizado = String(valor || "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "");

            const mapa = {
                "4": "d4",
                "d4": "d4",
                "6": "d6",
                "d6": "d6",
                "8": "d8",
                "d8": "d8",
                "10": "d10",
                "d10": "d10",
                "12": "d12",
                "d12": "d12"
            };

            return mapa[textoNormalizado] || "d8";
        }

        function normalizarTextoComparacao(valor) {
            return (valor || "")
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
        }

        function normalizarChaveAtributo(valor) {
            const textoNormalizado = normalizarTextoComparacao(valor);

            const mapa = {
                "for": "for",
                "forca": "for",
                "str": "for",
                "des": "des",
                "destreza": "des",
                "dex": "des",
                "con": "con",
                "constituicao": "con",
                "int": "int",
                "inteligencia": "int",
                "sab": "sab",
                "sabedoria": "sab",
                "wis": "sab",
                "car": "car",
                "carisma": "car",
                "cha": "car"
            };

            return mapa[textoNormalizado] || "";
        }

        // ===== Classe, caracteristicas e magia =====
        function inferirAtributoConjuracaoPorClasse(nomeClasse) {
            const nomeNormalizado = normalizarTextoComparacao(nomeClasse);

            const mapa = {
                "artifice": "int",
                "artificeiro": "int",
                "artificer": "int",
                "bardo": "car",
                "bard": "car",
                "bruxo": "car",
                "warlock": "car",
                "clerigo": "sab",
                "cleric": "sab",
                "druida": "sab",
                "druid": "sab",
                "feiticeiro": "car",
                "sorcerer": "car",
                "mago": "int",
                "wizard": "int",
                "paladino": "car",
                "paladin": "car",
                "patrulheiro": "sab",
                "ranger": "sab"
            };

            return mapa[nomeNormalizado] || "";
        }

        function sincronizarCamposMagia(forcarClasse = false, forcarAtributo = false) {
            const campoClasseBase = document.getElementById("classeNomeID");
            const campoClasseMagia = document.getElementById("magiaClasseConjuradora");
            const campoAtributoMagia = document.getElementById("magiaAtributoConjuracao");

            if (campoClasseBase && campoClasseMagia && (forcarClasse || !campoClasseMagia.value.trim())) {
                campoClasseMagia.value = campoClasseBase.value.trim();
            }

            const classeReferencia = campoClasseMagia?.value.trim() || campoClasseBase?.value.trim() || "";

            if (campoAtributoMagia && (forcarAtributo || !campoAtributoMagia.value)) {
                campoAtributoMagia.value = inferirAtributoConjuracaoPorClasse(classeReferencia);
            }
        }

        function getModificadorBaseAtributo(chaveAtributo) {
            const chaveNormalizada = normalizarChaveAtributo(chaveAtributo);
            if (!chaveNormalizada) return null;

            const campoAtributo = document.getElementById("salv_" + chaveNormalizada);
            const valorBase = parseInt(campoAtributo?.value);

            if (Number.isNaN(valorBase)) return null;

            return Math.floor((valorBase - 10) / 2);
        }

        function formatarRotuloAtributo(chaveAtributo) {
            const chaveNormalizada = normalizarChaveAtributo(chaveAtributo);

            const mapa = {
                for: "FOR",
                des: "DES",
                con: "CON",
                int: "INT",
                sab: "SAB",
                car: "CAR"
            };

            return mapa[chaveNormalizada] || "";
        }

        const NIVEIS_MAGIA = Array.from({ length: 10 }, (_, indice) => indice);
        const OPCOES_ESCOLA_MAGIA = ["AbjuraÃ§Ã£o", "AdivinhaÃ§Ã£o", "ConjuraÃ§Ã£o", "Encantamento", "EvocaÃ§Ã£o", "IlusÃ£o", "Necromancia", "TransmutaÃ§Ã£o"];
        const OPCOES_TIPO_DANO_MAGIA = ["Ãcido", "ConcussÃ£o", "Cortante", "ElÃ©trico", "Fogo", "ForÃ§a", "Frio", "NecrÃ³tico", "Perfurante", "PsÃ­quico", "Radiante", "Trovejante", "Veneno"];
        const OPCOES_RESOLUCAO_MAGIA = ["Ataque", "Teste de ResistÃªncia"];
        const OPCOES_TESTE_RESISTENCIA_MAGIA = ["FOR", "DES", "CON", "INT", "SAB", "CAR"];
        const estadoModalMagia = {
            nivel: 0,
            indice: null,
            modo: "visualizar"
        };

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
                    concentracao: false
                },
                resolucao: "",
                teste_resistencia: "",
                efeitos: [],
                descricao: ""
            };
        }

        function normalizarMagiaRegistro(registro, nivel) {
            const base = criarMagiaPadrao(nivel);
            const tags = Array.isArray(registro?.tags)
                ? registro.tags
                : String(registro?.tags || "")
                    .split(",")
                    .map(tag => tag.trim())
                    .filter(Boolean);
            const propriedades = {
                dano: !!registro?.propriedades?.dano || tags.includes("dano"),
                cura: !!registro?.propriedades?.cura || tags.includes("cura"),
                concentracao: !!registro?.propriedades?.concentracao || tags.includes("concentracao")
            };

            const efeitos = Array.isArray(registro?.efeitos)
                ? registro.efeitos
                    .map(efeito => ({
                        tipo: efeito?.tipo || "",
                        formula: efeito?.formula || "",
                        dano_tipo: efeito?.dano_tipo || "",
                        regra: efeito?.regra || ""
                    }))
                    .filter(efeito => efeito.tipo || efeito.formula || efeito.dano_tipo || efeito.regra)
                : [];

            if (registro?.danoFormula || registro?.danoTipo) {
                efeitos.push({
                    tipo: "dano",
                    formula: registro.danoFormula || "",
                    dano_tipo: registro.danoTipo || "",
                    regra: ""
                });
            }

            if (registro?.curaRegra) {
                efeitos.push({
                    tipo: "cura",
                    formula: "",
                    dano_tipo: "",
                    regra: registro.curaRegra
                });
            }

            return {
                ...base,
                ...registro,
                id: registro?.id || base.id,
                nivel,
                preparada: !!registro?.preparada,
                propriedades,
                resolucao: registro?.resolucao || "",
                teste_resistencia: registro?.teste_resistencia || "",
                efeitos
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
                    return dados.map(registro => normalizarMagiaRegistro(registro, nivel));
                }
            } catch (erro) {
                return valorBruto
                    .split(/\r?\n/)
                    .map(linha => linha.trim())
                    .filter(Boolean)
                    .map(nome => normalizarMagiaRegistro({ nome }, nivel));
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
            return nivel === 0 ? "Truque" : `NÃ­vel ${nivel}`;
        }

        function formatarTagsMagia(tags) {
            return (tags || [])
                .map(tag => String(tag || "").trim())
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

            const nivel = document.createElement("div");
            nivel.className = "magia-card-detalhe-nivel";
            nivel.textContent = obterRotuloNivelMagia(magia.nivel);

            header.appendChild(nome);
            header.appendChild(nivel);

            const info = document.createElement("div");
            info.className = "magia-card-detalhe-info";
            info.innerHTML = `
                <div><strong>Tempo:</strong> ${magia.tempo_conjuracao || "-"}</div>
                <div><strong>Alcance:</strong> ${magia.alcance || "-"}</div>
                <div><strong>DuraÃ§Ã£o:</strong> ${magia.duracao || "-"}</div>
                <div><strong>Escola:</strong> ${magia.escola || "-"}</div>
                <div><strong>ResoluÃ§Ã£o:</strong> ${magia.resolucao || "-"}</div>
                <div><strong>Teste:</strong> ${magia.teste_resistencia || "-"}</div>
            `;

            const propriedades = document.createElement("div");
            propriedades.className = "magia-card-detalhe-propriedades";
            [
                magia?.propriedades?.dano ? "dano" : "",
                magia?.propriedades?.cura ? "cura" : "",
                magia?.propriedades?.concentracao ? "concentraÃ§Ã£o" : ""
            ].filter(Boolean).forEach(tag => {
                const item = document.createElement("span");
                item.className = "magia-card-detalhe-tag";
                item.textContent = tag;
                propriedades.appendChild(item);
            });

            const efeitos = document.createElement("div");
            efeitos.className = "magia-card-detalhe-efeitos";

            if (Array.isArray(magia.efeitos) && magia.efeitos.length) {
                magia.efeitos.forEach(efeito => {
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
            descricao.textContent = magia.descricao || "";

            container.appendChild(header);
            container.appendChild(info);
            if (propriedades.childNodes.length) {
                container.appendChild(propriedades);
            }
            container.appendChild(efeitos);
            container.appendChild(descricao);

            return container;
        }

        function montarModalMagia() {
            if (obterModalMagiaOverlay()) return;

            const overlay = document.createElement("div");
            overlay.id = "magiaModalOverlay";
            overlay.className = "magia-modal-overlay oculto";
            overlay.setAttribute("aria-hidden", "true");
            overlay.innerHTML = `
                <div class="magia-modal" role="dialog" aria-modal="true" aria-labelledby="magiaModalTitulo">
                    <div class="magia-modal-topo">
                        <div>
                            <div id="magiaModalTitulo" class="magia-modal-titulo">Magia</div>
                            <div id="magiaModalSubtitulo" class="magia-modal-subtitulo">VisualizaÃ§Ã£o</div>
                        </div>
                        <div class="magia-modal-acoes">
                            <button type="button" class="magia-modal-botao" id="magiaModalEditar">Editar</button>
                            <button type="button" class="magia-modal-botao perigo oculto" id="magiaModalCancelarEdicao">Cancelar ediÃ§Ã£o</button>
                            <button type="button" class="magia-modal-botao primario oculto" id="magiaModalSalvar">Salvar magia</button>
                            <button type="button" class="magia-modal-botao" id="magiaModalFechar">Fechar</button>
                        </div>
                    </div>
                    <div id="magiaModalVisualizacao" style="display: block;"></div>
                    <form id="magiaModalFormulario" class="magia-formulario oculto" hidden style="display: none;">
                        <div class="magia-formulario-grid">
                            <div class="magia-formulario-campo">
                                <label for="magiaModalNome">Nome da Magia</label>
                                <input id="magiaModalNome" type="text">
                            </div>
                            <div class="magia-formulario-campo preparada">
                                <input id="magiaModalPreparada" type="checkbox">
                                <label for="magiaModalPreparada">Preparada</label>
                            </div>
                            <div class="magia-formulario-campo">
                                <label for="magiaModalEscola">Escola</label>
                                <select id="magiaModalEscola"></select>
                            </div>
                            <div class="magia-formulario-campo">
                                <label for="magiaModalTempo">Tempo de ConjuraÃ§Ã£o</label>
                                <input id="magiaModalTempo" type="text">
                            </div>
                            <div class="magia-formulario-campo">
                                <label for="magiaModalAlcance">Alcance</label>
                                <input id="magiaModalAlcance" type="text">
                            </div>
                            <div class="magia-formulario-campo">
                                <label for="magiaModalDuracao">DuraÃ§Ã£o</label>
                                <input id="magiaModalDuracao" type="text">
                            </div>
                            <div class="magia-formulario-campo completo">
                                <label>Propriedades</label>
                                <div class="magia-propriedades-checks">
                                    <label><input id="magiaModalPropDano" type="checkbox"> Dano</label>
                                    <label><input id="magiaModalPropCura" type="checkbox"> Cura</label>
                                    <label><input id="magiaModalPropConcentracao" type="checkbox"> ConcentraÃ§Ã£o</label>
                                </div>
                            </div>
                            <div class="magia-formulario-campo oculto" id="magiaModalCampoDanoFormula">
                                <label for="magiaModalDanoFormula">FÃ³rmula de Dano</label>
                                <input id="magiaModalDanoFormula" type="text" placeholder="Ex: 3d6">
                            </div>
                            <div class="magia-formulario-campo oculto" id="magiaModalCampoDanoTipo">
                                <label for="magiaModalDanoTipo">Tipo de Dano</label>
                                <select id="magiaModalDanoTipo"></select>
                            </div>
                            <div class="magia-formulario-campo oculto" id="magiaModalCampoResolucao">
                                <label for="magiaModalResolucao">ResoluÃ§Ã£o</label>
                                <select id="magiaModalResolucao"></select>
                            </div>
                            <div class="magia-formulario-campo oculto" id="magiaModalCampoAtaqueMagico">
                                <label for="magiaModalAtaqueMagico">Ataque MÃ¡gico</label>
                                <input id="magiaModalAtaqueMagico" type="text" readonly>
                            </div>
                            <div class="magia-formulario-campo oculto" id="magiaModalCampoTesteResistencia">
                                <label for="magiaModalTesteResistencia">Teste de ResistÃªncia</label>
                                <select id="magiaModalTesteResistencia"></select>
                            </div>
                            <div class="magia-formulario-campo completo oculto" id="magiaModalCampoCuraRegra">
                                <label for="magiaModalCuraRegra">Cura / Regra adicional</label>
                                <input id="magiaModalCuraRegra" type="text" placeholder="Ex: metade do dano causado">
                            </div>
                            <div class="magia-formulario-campo completo">
                                <label for="magiaModalDescricao">DescriÃ§Ã£o</label>
                                <textarea id="magiaModalDescricao"></textarea>
                            </div>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(overlay);
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

            const cabecalho = campo.closest(".magia-card")?.querySelector(nivel === 0 ? ".magia-cabecalho-truques" : ".magia-cabecalho");
            cabecalho?.appendChild(botao);
        }

        function inicializarGerenciadorMagias() {
            montarModalMagia();
            preencherSelectMagia("magiaModalEscola", OPCOES_ESCOLA_MAGIA);
            preencherSelectMagia("magiaModalDanoTipo", OPCOES_TIPO_DANO_MAGIA);
            preencherSelectMagia("magiaModalResolucao", OPCOES_RESOLUCAO_MAGIA);
            preencherSelectMagia("magiaModalTesteResistencia", OPCOES_TESTE_RESISTENCIA_MAGIA);
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

            opcoes.forEach(opcao => {
                const item = document.createElement("option");
                item.value = opcao;
                item.textContent = opcao;
                select.appendChild(item);
            });
        }

        function renderizarTodasMagias() {
            NIVEIS_MAGIA.forEach(renderizarListaMagiasNivel);
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

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "magia-item-preparada";
                checkbox.checked = !!magia.preparada;
                checkbox.setAttribute("aria-label", `Magia preparada: ${magia.nome || "sem nome"}`);
                checkbox.addEventListener("change", () => {
                    const registros = lerMagiasNivel(nivel);
                    if (!registros[indice]) return;
                    registros[indice].preparada = checkbox.checked;
                    salvarMagiasNivel(nivel, registros);
                    renderizarListaMagiasNivel(nivel);
                });

                const nome = document.createElement("button");
                nome.type = "button";
                nome.className = "magia-item-nome";
                if (!magia.nome) {
                    nome.classList.add("vazia");
                    nome.innerHTML = "&nbsp;";
                    nome.setAttribute("aria-label", `Abrir magia vazia de ${obterRotuloNivelMagia(nivel)}`);
                } else {
                    nome.textContent = magia.nome;
                }
                nome.addEventListener("click", () => abrirModalMagia(nivel, indice, "visualizar"));

                const editar = document.createElement("button");
                editar.type = "button";
                editar.className = "magia-item-editar";
                editar.innerHTML = `<span class="magia-item-editar-icone">âœ</span><span>EdiÃ§Ã£o</span>`;
                editar.setAttribute("aria-label", `Editar magia ${magia.nome || "sem nome"}`);
                editar.addEventListener("click", () => abrirModalMagia(nivel, indice, "editar"));

                item.appendChild(checkbox);
                item.appendChild(nome);
                item.appendChild(editar);
                container.appendChild(item);
            });
        }

        function obterMagiaDoEstadoModal() {
            const magias = lerMagiasNivel(estadoModalMagia.nivel);
            return magias[estadoModalMagia.indice] || criarMagiaPadrao(estadoModalMagia.nivel);
        }

        function preencherFormularioMagia(magia) {
            document.getElementById("magiaModalNome").value = magia.nome || "";
            document.getElementById("magiaModalPreparada").checked = !!magia.preparada;
            document.getElementById("magiaModalEscola").value = magia.escola || "";
            document.getElementById("magiaModalTempo").value = magia.tempo_conjuracao || "";
            document.getElementById("magiaModalAlcance").value = magia.alcance || "";
            document.getElementById("magiaModalDuracao").value = magia.duracao || "";
            document.getElementById("magiaModalDescricao").value = magia.descricao || "";
            document.getElementById("magiaModalPropDano").checked = !!magia?.propriedades?.dano;
            document.getElementById("magiaModalPropCura").checked = !!magia?.propriedades?.cura;
            document.getElementById("magiaModalPropConcentracao").checked = !!magia?.propriedades?.concentracao;
            document.getElementById("magiaModalResolucao").value = magia.resolucao || "";
            document.getElementById("magiaModalTesteResistencia").value = magia.teste_resistencia || "";

            const efeitoDano = (magia.efeitos || []).find(efeito => efeito.tipo === "dano") || {};
            const efeitoCura = (magia.efeitos || []).find(efeito => efeito.tipo === "cura") || {};

            document.getElementById("magiaModalDanoFormula").value = efeitoDano.formula || "";
            document.getElementById("magiaModalDanoTipo").value = efeitoDano.dano_tipo || "";
            document.getElementById("magiaModalCuraRegra").value = efeitoCura.regra || efeitoCura.formula || "";
            atualizarVisibilidadeFormularioMagia();
        }

        function lerFormularioMagia() {
            const danoFormula = document.getElementById("magiaModalDanoFormula").value.trim();
            const danoTipo = document.getElementById("magiaModalDanoTipo").value.trim();
            const curaRegra = document.getElementById("magiaModalCuraRegra").value.trim();
            const resolucao = document.getElementById("magiaModalResolucao").value;
            const propriedades = {
                dano: document.getElementById("magiaModalPropDano").checked,
                cura: document.getElementById("magiaModalPropCura").checked,
                concentracao: document.getElementById("magiaModalPropConcentracao").checked
            };
            const efeitos = [];

            if (propriedades.dano && (danoFormula || danoTipo || resolucao)) {
                efeitos.push({
                    tipo: "dano",
                    formula: danoFormula,
                    dano_tipo: danoTipo,
                    regra: ""
                });
            }

            if (propriedades.cura && curaRegra) {
                efeitos.push({
                    tipo: "cura",
                    formula: "",
                    dano_tipo: "",
                    regra: curaRegra
                });
            }

            return normalizarMagiaRegistro({
                ...obterMagiaDoEstadoModal(),
                nome: document.getElementById("magiaModalNome").value.trim(),
                preparada: document.getElementById("magiaModalPreparada").checked,
                escola: document.getElementById("magiaModalEscola").value.trim(),
                tempo_conjuracao: document.getElementById("magiaModalTempo").value.trim(),
                alcance: document.getElementById("magiaModalAlcance").value.trim(),
                duracao: document.getElementById("magiaModalDuracao").value.trim(),
                propriedades,
                resolucao,
                teste_resistencia: document.getElementById("magiaModalTesteResistencia").value,
                efeitos,
                descricao: document.getElementById("magiaModalDescricao").value.trim()
            }, estadoModalMagia.nivel);
        }

        function atualizarAtaqueMagicoModalMagia() {
            const campo = document.getElementById("magiaModalAtaqueMagico");
            const campoOrigem = document.getElementById("magiaAtaqueMagico");
            if (!campo) return;

            campo.value = campoOrigem?.value || "";
        }

        function atualizarVisibilidadeFormularioMagia() {
            const habilitaDano = document.getElementById("magiaModalPropDano")?.checked;
            const habilitaCura = document.getElementById("magiaModalPropCura")?.checked;
            const resolucao = document.getElementById("magiaModalResolucao")?.value;

            document.getElementById("magiaModalCampoDanoFormula")?.classList.toggle("oculto", !habilitaDano);
            document.getElementById("magiaModalCampoDanoTipo")?.classList.toggle("oculto", !habilitaDano);
            document.getElementById("magiaModalCampoResolucao")?.classList.toggle("oculto", !habilitaDano);
            document.getElementById("magiaModalCampoCuraRegra")?.classList.toggle("oculto", !habilitaCura);
            document.getElementById("magiaModalCampoAtaqueMagico")?.classList.toggle("oculto", !(habilitaDano && resolucao === "Ataque"));
            document.getElementById("magiaModalCampoTesteResistencia")?.classList.toggle("oculto", !(habilitaDano && resolucao === "Teste de ResistÃªncia"));

            atualizarAtaqueMagicoModalMagia();
        }

        function alternarModoModalMagia(modo) {
            const visualizacao = document.getElementById("magiaModalVisualizacao");
            const formulario = document.getElementById("magiaModalFormulario");
            const botaoEditar = document.getElementById("magiaModalEditar");
            const botaoCancelar = document.getElementById("magiaModalCancelarEdicao");
            const botaoSalvar = document.getElementById("magiaModalSalvar");
            const subtitulo = document.getElementById("magiaModalSubtitulo");

            estadoModalMagia.modo = modo;

            if (visualizacao) {
                visualizacao.hidden = modo !== "visualizar";
                visualizacao.classList.toggle("oculto", modo !== "visualizar");
                visualizacao.style.display = modo === "visualizar" ? "block" : "none";
            }

            if (formulario) {
                formulario.hidden = modo !== "editar";
                formulario.className = modo === "editar" ? "magia-formulario" : "magia-formulario oculto";
                formulario.style.display = modo === "editar" ? "flex" : "none";
            }

            botaoEditar?.classList.toggle("oculto", modo !== "visualizar");
            botaoCancelar?.classList.toggle("oculto", modo !== "editar");
            botaoSalvar?.classList.toggle("oculto", modo !== "editar");
            if (subtitulo) {
                subtitulo.textContent = modo === "editar" ? "EdiÃ§Ã£o da magia" : "VisualizaÃ§Ã£o da magia";
            }
        }

        function renderizarVisualizacaoModalMagia(magia) {
            const container = document.getElementById("magiaModalVisualizacao");
            if (!container) return;

            container.replaceChildren();
            container.appendChild(renderizarCardDetalheMagia(magia));
        }

        function abrirModalMagia(nivel, indice, modo = "visualizar") {
            const overlay = obterModalMagiaOverlay();
            if (!overlay) return;

            estadoModalMagia.nivel = nivel;
            estadoModalMagia.indice = indice;

            const magia = obterMagiaDoEstadoModal();
            document.getElementById("magiaModalTitulo").textContent = magia.nome || "Magia";
            preencherFormularioMagia(magia);
            renderizarVisualizacaoModalMagia(magia);
            alternarModoModalMagia(modo);

            overlay.classList.add("ativo");
            overlay.classList.remove("oculto");
            overlay.setAttribute("aria-hidden", "false");
        }

        function fecharModalMagia() {
            const overlay = obterModalMagiaOverlay();
            if (!overlay) return;

            overlay.classList.remove("ativo");
            overlay.classList.add("oculto");
            overlay.setAttribute("aria-hidden", "true");
        }

        function salvarModalMagia() {
            const magias = lerMagiasNivel(estadoModalMagia.nivel);
            const magia = lerFormularioMagia();

            magias[estadoModalMagia.indice] = magia;
            salvarMagiasNivel(estadoModalMagia.nivel, magias);
            renderizarListaMagiasNivel(estadoModalMagia.nivel);
            document.getElementById("magiaModalTitulo").textContent = magia.nome || "Magia";
            renderizarVisualizacaoModalMagia(magia);
            alternarModoModalMagia("visualizar");
        }

        function adicionarNovaMagia(nivel) {
            const magias = lerMagiasNivel(nivel);
            magias.push(criarMagiaPadrao(nivel));
            salvarMagiasNivel(nivel, magias);
            renderizarListaMagiasNivel(nivel);
            abrirModalMagia(nivel, magias.length - 1, "editar");
        }

        function atualizarMagias() {
            sincronizarCamposMagia();

            const campoAtributo = document.getElementById("magiaAtributoConjuracao");
            const campoCD = document.getElementById("magiaCD");
            const campoAtaque = document.getElementById("magiaAtaqueMagico");

            if (!campoAtributo || !campoCD || !campoAtaque) return;

            const modificadorBase = getModificadorBaseAtributo(campoAtributo.value);

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
            renderizarTodasMagias();
        }

        function sincronizarClasseNivel(usarValorLegado = false) {
            const campoCompleto = document.getElementById("classeID");
            const campoNome = document.getElementById("classeNomeID");
            const campoNivel = document.getElementById("classeNivelID");

            if (!campoCompleto || !campoNome || !campoNivel) return;

            const nivelPadrao = campoNivel.defaultValue || "1";
            const podeMigrarLegado = !campoNome.value.trim() && (!campoNivel.value.trim() || campoNivel.value.trim() === nivelPadrao);

            if (usarValorLegado && campoCompleto.value && podeMigrarLegado) {
                const match = campoCompleto.value.match(/^(.*?)(?:\s+NV\s+(\d+))?$/i);

                if (match) {
                    campoNome.value = match[1].trim();
                    campoNivel.value = match[2] || nivelPadrao;
                }
            }

            const nome = campoNome.value.trim();
            const nivel = campoNivel.value.trim();
            campoCompleto.value = [nome, nivel ? `NV ${nivel}` : ""].filter(Boolean).join(" ");
        }

        function sincronizarResumoCaracteristicas(forcar = false) {
            const mapeamentos = [
                { origem: "classeNomeID", destino: "talentoClasseResumo" },
                { origem: "racaID", destino: "talentoRacaResumo" },
                { origem: "antecedenteID", destino: "talentoAntecedenteResumo" }
            ];

            mapeamentos.forEach(({ origem, destino }) => {
                const campoOrigem = document.getElementById(origem);
                const campoDestino = document.getElementById(destino);

                if (!campoOrigem || !campoDestino) return;

                campoDestino.textContent = campoOrigem.value.trim();
            });
        }

        function sincronizarAtributosComSalvaguardas() {
            ["for", "des", "con", "int", "sab", "car"].forEach(atributo => {
                const campoSalvaguarda = document.getElementById("salv_" + atributo);
                const atributoBase = document.getElementById(atributo);

                if (!campoSalvaguarda || !atributoBase) return;

                let valor = parseInt(campoSalvaguarda.value) || 0;

                if (valor > 20) valor = 20;
                if (valor < 0) valor = 0;

                campoSalvaguarda.value = valor;
                atributoBase.value = valor;
            });
        }

        function sincronizarSalvaguardasComAtributosBase() {
            ["for", "des", "con", "int", "sab", "car"].forEach(atributo => {
                const campoSalvaguarda = document.getElementById("salv_" + atributo);
                const atributoBase = document.getElementById(atributo);

                if (!campoSalvaguarda || !atributoBase) return;

                let valor = parseInt(atributoBase.value, 10) || 0;

                if (valor > 20) valor = 20;
                if (valor < 0) valor = 0;

                atributoBase.value = valor;
                campoSalvaguarda.value = valor;
            });
        }
        //atualiza as pericias com base nos atributos e proficiencia
        function atualizarPericias() {
            const bonusProf = getBonusProf();

            document.querySelectorAll('.pericia-linha').forEach(pericia => {
                const atributo = pericia.dataset.atributo;
                const checkbox = pericia.querySelector('input[type="checkbox"]');
                const campoValor = pericia.querySelector('.pericia-valor');
                const valorBase = parseInt(document.getElementById('salv_' + atributo)?.value) || 0;
                const modificadorBase = Math.floor((valorBase - 10) / 2);
                const total = modificadorBase + (checkbox?.checked ? bonusProf : 0);

                campoValor.value = (total >= 0 ? "+" : "") + total;
            });
        }

        function atualizarPassivas() {
            const bonusProf = getBonusProf();
            const sabValor = parseInt(document.getElementById('salv_sab')?.value) || 0;
            const sabMod = Math.floor((sabValor - 10) / 2);
            const sabProf = document.getElementById('prof_sab')?.checked ? bonusProf : 0;
            const percepcao = parseInt(document.getElementById('periciaPercepcaoValor')?.value) || 0;
            const intuicao = parseInt(document.getElementById('periciaIntuicaoValor')?.value) || 0;

            document.getElementById('sabPass').value = 10 + sabMod + sabProf;
            document.getElementById('perPass').value = 10 + percepcao;
            document.getElementById('intPass').value = 10 + intuicao;
        }

        // ===== Classe de armadura e resumo de combate =====
        function atualizarClasseArmaduraEquipada() {
            const armaduraCA = parseInt(document.getElementById('armaduraCA')?.value) || 0;
            const outrosCA = parseInt(document.getElementById('outroEquipadoCA')?.value) || 0;
            const escudoCA = parseInt(document.getElementById('escudoCA')?.value) || 0;

            const campoCA = document.getElementById('ca_valor');
            const campoEscudo = document.getElementById('ca_escudo');

            if (campoCA) campoCA.value = armaduraCA + outrosCA;
            if (campoEscudo) campoEscudo.value = formatarCA(escudoCA);
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

            if (id === 'escudoCA') {
                campo.value = formatarCA(valor);
                return;
            }

            campo.value = valor;
        }

        function atualizarResumoAtaquesConjuracao() {
            const caBase = parseInt(document.getElementById('ca_valor')?.value) || 0;
            const caEscudo = parseInt(document.getElementById('ca_escudo')?.value) || 0;
            const pvAtual = parseInt(document.getElementById('pvAtual')?.value) || 0;

            const campoAtaqueCA = document.getElementById('ataqueCaTotal');
            const campoAtaqueEscudo = document.getElementById('ataqueCaEscudo');
            const campoAtaquePV = document.getElementById('ataquePvAtual');

            if (campoAtaqueCA) campoAtaqueCA.value = caBase;
            if (campoAtaqueEscudo) campoAtaqueEscudo.value = formatarCA(caEscudo);
            if (campoAtaquePV) campoAtaquePV.textContent = "PV " + pvAtual;
        }

        const estadoAtaqueArma = {
            arma: null,
            dado: null,
            totalAtaque: 0,
            rotuloAtributo: "",
            textoResumo: ""
        };

        function obterResumoBonusAtaqueArma(arma) {
            return getResumoCalculoAtaque(arma, arma?.ataque);
        }

        function obterSubtituloModalAtaque(arma) {
            return limparPrefixoPropriedade(arma?.propriedade || "") || "Sem propriedades";
        }

        function atualizarEstadoCriticoModalAtaque() {
            const campoDado = document.getElementById('modalAtaqueDado');
            const botaoSucesso = document.getElementById('modalAtaqueSucesso');
            const botaoFracasso = document.getElementById('modalAtaqueFracasso');
            if (!campoDado || !botaoSucesso || !botaoFracasso) return;

            const dado = parseInt(campoDado.value, 10);
            botaoSucesso.classList.toggle('ataque-botao-critico', dado === 20);
            botaoFracasso.classList.toggle('ataque-botao-fracasso-critico', dado === 1);
        }

        function alternarEtapaModalAtaque(exibirDano) {
            const etapaDado = document.getElementById('modalAtaqueEtapaDado');
            const etapaDano = document.getElementById('modalAtaqueEtapaDano');
            if (!etapaDado || !etapaDano) return;

            etapaDado.classList.toggle('oculto', exibirDano);
            etapaDano.classList.toggle('oculto', !exibirDano);
        }

        function fecharModalAtaqueArma() {
            const overlay = document.getElementById('modalAtaqueOverlay');
            const campoDado = document.getElementById('modalAtaqueDado');
            const campoDano = document.getElementById('modalAtaqueDano');
            const botaoSucesso = document.getElementById('modalAtaqueSucesso');
            const botaoFracasso = document.getElementById('modalAtaqueFracasso');

            estadoAtaqueArma.arma = null;
            estadoAtaqueArma.dado = null;
            estadoAtaqueArma.totalAtaque = 0;
            estadoAtaqueArma.rotuloAtributo = "";
            estadoAtaqueArma.textoResumo = "";

            if (campoDado) campoDado.value = '';
            if (campoDano) campoDano.value = '';
            if (botaoSucesso) botaoSucesso.classList.remove('ataque-botao-critico');
            if (botaoFracasso) botaoFracasso.classList.remove('ataque-botao-fracasso-critico');
            alternarEtapaModalAtaque(false);

            if (overlay) {
                overlay.classList.remove('ativo');
                overlay.classList.add('oculto');
                overlay.setAttribute('aria-hidden', 'true');
            }
        }

        function abrirModalAtaqueArma(arma) {
            const overlay = document.getElementById('modalAtaqueOverlay');
            const titulo = document.getElementById('modalAtaqueTitulo');
            const subtitulo = document.getElementById('modalAtaqueSubtitulo');
            const bonus = document.getElementById('modalAtaqueBonus');
            const resumo = document.getElementById('modalAtaqueResumo');
            const campoDado = document.getElementById('modalAtaqueDado');
            const campoDano = document.getElementById('modalAtaqueDano');

            if (!overlay || !titulo || !subtitulo || !bonus || !resumo || !campoDado || !campoDano) return;

            const { rotuloAtributo, totalAtaque, textoResumo } = obterResumoBonusAtaqueArma(arma);

            estadoAtaqueArma.arma = arma;
            estadoAtaqueArma.dado = null;
            estadoAtaqueArma.totalAtaque = totalAtaque;
            estadoAtaqueArma.rotuloAtributo = rotuloAtributo;
            estadoAtaqueArma.textoResumo = textoResumo;

            titulo.innerHTML = `Ataque com <span class="ataque-modal-titulo-arma">${arma?.nome || 'arma'}</span>`;
            subtitulo.textContent = obterSubtituloModalAtaque(arma);
            bonus.textContent = textoResumo;
            resumo.textContent = '';
            campoDado.value = '';
            campoDano.value = '';

            alternarEtapaModalAtaque(false);
            atualizarEstadoCriticoModalAtaque();
            overlay.classList.add('ativo');
            overlay.classList.remove('oculto');
            overlay.setAttribute('aria-hidden', 'false');

            setTimeout(() => campoDado.focus(), 0);
        }

        function obterDadoModalAtaque() {
            const campoDado = document.getElementById('modalAtaqueDado');
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
            const resumo = document.getElementById('modalAtaqueResumo');
            const subtitulo = document.getElementById('modalAtaqueSubtitulo');
            const campoDano = document.getElementById('modalAtaqueDano');
            if (dado === null || !resumo || !subtitulo || !campoDano) return;

            estadoAtaqueArma.dado = dado;
            subtitulo.textContent = obterSubtituloModalAtaque(estadoAtaqueArma.arma);
            resumo.innerHTML = [
                `Dado: <span class="ataque-modal-resumo-destaque${dado === 20 ? ' ataque-modal-resumo-dado-critico' : ''}">${dado}</span>`,
                `BÃ´nus: <span class="ataque-modal-resumo-destaque">${estadoAtaqueArma.textoResumoDano || estadoAtaqueArma.rotuloAtributo}</span>`
            ].join(' | ');
            alternarEtapaModalAtaque(true);
            setTimeout(() => campoDano.focus(), 0);
        }

        function atualizarSubAbaArmas() {
            const container = document.getElementById('subabaCombateArma');
            if (!container) return;

            const armas = obterArmasEquipadasAtivas();

            if (!armas.length) {
                container.innerHTML = '<div class="subaba-vazia">Nenhuma arma equipada no momento.</div>';
                return;
            }

            container.replaceChildren();

            const lista = document.createElement('div');
            lista.className = 'arma-resumo-lista';

            armas.forEach(arma => {
                const item = document.createElement('div');
                item.className = 'arma-resumo-item';
                if (!arma.proficiente) {
                    item.classList.add('nao-proficiente');
                }
                item.tabIndex = 0;
                item.setAttribute('role', 'button');
                item.setAttribute('aria-label', `Atacar com ${arma.nome}`);

                const topo = document.createElement('div');
                topo.className = 'arma-resumo-topo';

                const icone = arma.usaMunicao ? 'ðŸ¹' : 'âš”ï¸';
                let municaoTitulo = '';

                if (arma.usaMunicao) {

                    const idMunicao = arma.arma_municao_id;

                    if (idMunicao) {

                        const itemMunicao = [...document.querySelectorAll('#listaOutros .armadura-card')]
                            .find(el => el.dataset.id === idMunicao);

                        const nomeMunicao = itemMunicao
                            ?.querySelector('[data-campo="outro_nome"]')?.value;

                        const qtdAtual = itemMunicao
                            ?.querySelector('[data-campo="outro_quantidade"]')?.value;

                        if (nomeMunicao) {
                            municaoTitulo = `${qtdAtual || '-'} ${nomeMunicao}`;
                        }
                    }
                }
                topo.textContent = [arma.nome, icone, municaoTitulo].filter(Boolean).join('  ');

                const detalhes = document.createElement('div');
                detalhes.className = 'arma-resumo-detalhes';
                const { textoResumo: textoAtaque } = getResumoCalculoAtaque(arma, arma.ataque);
                detalhes.innerHTML = `<strong>Ataque: ${textoAtaque} | Dano: ${arma.dano || "-"}</strong><br>Propriedade: ${arma.propriedade || "-"}`;

                item.addEventListener('click', () => abrirModalAtaqueArma(arma));
                item.addEventListener('keydown', evento => {
                    if (evento.key === 'Enter' || evento.key === ' ') {
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
            const entrada = prompt('Quanto de dano o personagem tomou?');
            if (entrada === null) return;

            const dano = parseInt(entrada);
            if (isNaN(dano) || dano < 0) return;

            const campoPV = document.getElementById('pvAtual');
            const atual = parseInt(campoPV?.value) || 0;
            campoPV.value = Math.max(0, atual - dano);
            registrarHistoricoComandoCombate('Dano', dano);
            normalizarPontosDeVida();
        }

        function curarPV() {
            const entrada = prompt('Quanto o personagem recuperou?');
            if (entrada === null) return;

            const cura = parseInt(entrada);
            if (isNaN(cura) || cura < 0) return;

            const campoPV = document.getElementById('pvAtual');
            const atual = parseInt(campoPV?.value) || 0;
            campoPV.value = atual + cura;
            registrarHistoricoComandoCombate('Cura', cura);
            normalizarPontosDeVida();
        }

        function adicionarRegistroHistoricoCombate(tipo, valor, iconePersonalizado = '') {
            const campoRodada = document.getElementById('combateRodada');
            const rodada = parseInt(campoRodada?.value) || 1;
            const registrosContainer = document.getElementById('historicoRegistros');
            if (!registrosContainer) return;

            // ðŸ”¥ Mapa de emojis
            const icones = {
                'Cura': 'â¤ï¸',
                'Fracasso': 'ðŸ’€',
                'Dano': 'ðŸ’¥',
                'Sucesso': 'ðŸ€',
                'Ataque falhou!': 'âŒ',
                'Ataque!': 'âš”ï¸'
            };
            icones['Ataque'] = 'âš”ï¸';

            const icone = iconePersonalizado || icones[tipo] || '';

            const registro = document.createElement('div');
            registro.className = 'historico-registro';
            registro.innerHTML = `
        <div class="historico-col-rodada">${rodada}</div>
        <div class="historico-col-tipo">${icone} ${tipo}</div>
        <div class="historico-col-valor">
            ${tipo === 'Dano' ? `-${valor}` :
                    tipo === 'Cura' ? `+${valor}` :
                        `${valor}`
                }
        </div>
            `;

            registrosContainer.prepend(registro);
        }

        function registrarHistoricoAtaqueArma(sucesso, dano) {
            const arma = estadoAtaqueArma.arma;
            const dado = estadoAtaqueArma.dado;
            if (!arma || dado === null) return;

            consumirMunicao(1, arma);

            const valor = [
                arma.nome || 'Arma',
                `Dado: ${dado}`,
                sucesso ? 'Sucesso' : 'Fracasso',
                `Dano: ${dano}`
            ].join(' | ');

            adicionarRegistroHistoricoCombate('Ataque', valor, arma.usaMunicao ? 'ðŸ¹' : 'âš”ï¸');
        }

        function confirmarFracassoAtaque() {
            const dado = obterDadoModalAtaque();
            if (dado === null) return;

            estadoAtaqueArma.dado = dado;
            registrarHistoricoAtaqueArma(false, 0);
            fecharModalAtaqueArma();
        }

        function confirmarDanoAtaque() {
            const campoDano = document.getElementById('modalAtaqueDano');
            if (!campoDano) return;

            const dano = parseInt(campoDano.value, 10);
            if (!Number.isInteger(dano) || dano < 0) {
                campoDano.focus();
                return;
            }

            registrarHistoricoAtaqueArma(true, dano);
            fecharModalAtaqueArma();
        }

        function registrarHistoricoComandoCombate(tipo, valor) {
            adicionarRegistroHistoricoCombate(tipo, valor);
        }

        function limparHistorico() {
            const registrosContainer = document.getElementById('historicoRegistros');
            registrosContainer.innerHTML = '';
        }

        function descansoLongo() {
            if (!confirm('Deseja realmente fazer um descanso longo?')) {
                return;
            }

            const campoTotal = document.getElementById('dadosVidaTotal');
            const campoRestantes = document.getElementById('dadosVidaRestantes');
            const campoPV = document.getElementById('pvAtual');
            const campoPVTotal = document.getElementById('pvTotal');

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
            const campoPV = document.getElementById('pvAtual');
            const campoPVTotal = document.getElementById('pvTotal');
            const campoContraMorte = document.getElementById('ataqueContraMorte');
            const campoPVDisplay = document.getElementById('ataquePvAtual');

            if (!campoPV || !campoContraMorte || !campoPVDisplay || !campoPVTotal) return;

            const pvAtual = parseInt(campoPV.value) || 0;
            const pvTotal = parseInt(campoPVTotal.value) || 0;

            // Se PV total Ã© zero, a ficha nÃ£o foi montada, entÃ£o nÃ£o abre contra morte
            if (pvTotal === 0) {
                campoPVDisplay.style.display = 'flex';
                campoContraMorte.style.display = 'none';
                limparContraMorte();
                return;
            }

            if (pvAtual <= 0) {
                campoPVDisplay.style.display = 'none';
                campoContraMorte.style.display = 'flex';
            } else {
                campoPVDisplay.style.display = 'flex';
                campoContraMorte.style.display = 'none';
                limparContraMorte();
            }
        }

        function adicionarSucesso() {
            for (let i = 1; i <= 3; i++) {
                const dot = document.getElementById('sucesso' + i);

                if (dot && !dot.classList.contains('ativo')) {
                    dot.classList.add('ativo');
                    registrarHistoricoComandoCombate('Sucesso', `${i}Âº`);

                    verificarVitoriaDeathSave();
                    return;
                }
            }
        }

        function adicionarFracasso() {
            for (let i = 1; i <= 3; i++) {
                const dot = document.getElementById('fracasso' + i);

                if (dot && !dot.classList.contains('ativo')) {
                    dot.classList.add('ativo');

                    // ðŸ”¥ Registrar sÃ³ aqui (depois de confirmar)
                    registrarHistoricoComandoCombate('Fracasso', `${i}Âº`);

                    verificarDerrotaDeathSave();
                    return;
                }
            }
        }

        function verificarVitoriaDeathSave() {
            let sucessos = 0;

            for (let i = 1; i <= 3; i++) {
                if (document.getElementById('sucesso' + i)?.classList.contains('ativo')) {
                    sucessos++;
                }
            }

            if (sucessos >= 3) {

                const frases = [
                    "Contra todas as probabilidades, vocÃª se agarra Ã  vida.",
                    "Seu peito volta a respirar. A morte terÃ¡ que esperar.",
                    "A chama da sua alma se recusa a se apagar.",
                    "VocÃª resiste. Ainda nÃ£o Ã© o seu fim.",
                    "O destino te dÃ¡ mais uma chance.",
                    "Seu corpo responde â€” vocÃª estÃ¡ de volta.",
                    "A vida pulsa novamente em suas veias.",
                    "Nem hoje a morte te leva.",
                    "VocÃª abre os olhos mais uma vez.",
                    "Os deuses ainda nÃ£o terminaram com vocÃª.",
                    "A morte tentou te abraÃ§ar, mas seu espÃ­rito se provou mais forte.",
                    "O fio da sua vida se tencionou, mas nÃ£o rompeu. VocÃª estÃ¡ de volta.",
                    "A luz retorna aos seus olhos. O mundo ainda precisa de vocÃª.",
                    "VocÃª respira fundo enquanto o abismo recua. A luta continua!",
                    "A balanÃ§a se inclinou a seu favor. VocÃª estabilizou.",
                    "O Ceifador terÃ¡ que esperar. Hoje nÃ£o Ã© o seu dia.",
                    "Sua determinaÃ§Ã£o forÃ§ou o destino a te conceder uma segunda chance.",
                    "TrÃªs batidas firmes no coraÃ§Ã£o. O perigo imediato passou."
                ];

                const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];

                alert(fraseAleatoria + "\n\nVocÃª recupera 1 PV e estÃ¡ estÃ¡vel!");

                const campoPV = document.getElementById('pvAtual');
                if (campoPV) {
                    registrarHistoricoComandoCombate('Cura', 1);
                    campoPV.value = 1;
                    normalizarPontosDeVida();
                }
            }
        }

        function verificarDerrotaDeathSave() {
            let fracassos = 0;

            for (let i = 1; i <= 3; i++) {
                if (document.getElementById('fracasso' + i)?.classList.contains('ativo')) {
                    fracassos++;
                }
            }

            if (fracassos >= 3) {

                const frases = [
                    "Sua canÃ§Ã£o termina aqui, mas o eco de suas faÃ§anhas perdurarÃ¡ pelas eras.",
                    "A luz em seus olhos se apaga, cedendo lugar ao descanso eterno dos herÃ³is.",
                    "As estrelas brilham um pouco menos hoje. Sua alma agora pertence ao cosmos.",
                    "O frio do abismo finalmente te alcanÃ§ou.",
                    "Seu sangue mancha a terra; o silÃªncio Ã© sua Ãºnica companhia agora.",
                    "O destino foi cruel. Seu corpo tomba, desprovido de vida.",
                    "A escuridÃ£o te envolveu. NÃ£o hÃ¡ mais volta.",
                    "O Ãºltimo capÃ­tulo da sua histÃ³ria foi escrito.",
                    "Os dados pararam de rolar para vocÃª. Que sua prÃ³xima encarnaÃ§Ã£o seja mais afortunada.",
                    "Sua ficha repousa agora no panteÃ£o das lendas esquecidas.",
                    "O mestre das almas recolheu sua ficha. Fim de jogo."
                ];

                const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
                document.getElementById('nomePersonagem').value = "â˜ ï¸ " + document.getElementById('nomePersonagem').value;

                alert(fraseAleatoria + "\n\nGAME OVER!\n" + document.getElementById('nomePersonagem').value);
            }
        }

        function limparContraMorte() {
            for (let i = 1; i <= 3; i++) {
                document.getElementById('sucesso' + i)?.classList.remove('ativo');
                document.getElementById('fracasso' + i)?.classList.remove('ativo');
            }
        }

        function normalizarPosicaoAtaque() {
            const campo = document.getElementById('ataquePosicao');
            if (!campo) return;

            const numero = parseInt(campo.value) || 0;
            campo.value = numero;
        }

        function trocarSubAbaCombate(tipo, botao) {
            document.querySelectorAll('.subaba-botao').forEach(el => el.classList.remove('ativa'));
            document.querySelectorAll('.subaba-combate').forEach(el => el.classList.remove('ativa'));

            botao.classList.add('ativa');

            let alvo;
            if (tipo === 'magia') {
                alvo = document.getElementById('subabaCombateMagia');
            } else if (tipo === 'historico') {
                alvo = document.getElementById('subabaCombateHistorico');
            } else {
                alvo = document.getElementById('subabaCombateArma');
            }

            if (alvo) alvo.classList.add('ativa');
        }

        function atualizarModificadoresSalvaguarda() {
            const bonusProf = getBonusProf();

            document.querySelectorAll('.salvaguarda-caixa').forEach(caixa => {
                const atributo = caixa.querySelector('.prof-checkbox').dataset.atributo;
                let valor = parseInt(document.getElementById('salv_' + atributo).value) || 0;
                const prof = caixa.querySelector('.prof-checkbox').checked ? bonusProf : 0;
                let mod = Math.floor((valor - 10) / 2) + prof;

                caixa.querySelector('.modificador-orbe').innerText = (mod >= 0 ? "+" : "") + mod;

                // altera cor se proficiente
                if (caixa.querySelector('.prof-checkbox').checked) {
                    caixa.classList.add('proficiente');
                } else {
                    caixa.classList.remove('proficiente');
                }
            });
        }

        // Atualiza quando checkbox muda
        document.querySelectorAll('.prof-checkbox').forEach(el => {
            el.addEventListener('input', () => {
                atualizarModificadoresSalvaguarda();
                atualizarPassivas();
            });
            el.addEventListener('change', () => {
                atualizarModificadoresSalvaguarda();
                atualizarPassivas();
            });
        });

        document.querySelectorAll('.pericia-prof input').forEach(el => {
            el.addEventListener('input', () => {
                atualizarPericias();
                atualizarPassivas();
            });
            el.addEventListener('change', () => {
                atualizarPericias();
                atualizarPassivas();
            });
        });

        // Espelha as salvaguardas no radar
        document.querySelectorAll('.valor-atributo-input').forEach(input => {
            input.addEventListener('input', () => {
                sincronizarAtributosComSalvaguardas();
                atualizarAtributos();
                desenharRadar();
                atualizarModificadoresSalvaguarda();
                atualizarPericias();
                atualizarPassivas();
                atualizarMagias();
            });
            input.addEventListener('change', () => {
                sincronizarAtributosComSalvaguardas();
                atualizarAtributos();
                desenharRadar();
                atualizarModificadoresSalvaguarda();
                atualizarPericias();
                atualizarPassivas();
                atualizarMagias();
            });
        });

        // Atualiza automaticamente quando o Orbe do bÃ´nus de proficiÃªncia muda
        const bonusOrbeInput = document.getElementById("bonusProf");
        bonusOrbeInput.addEventListener('input', () => {
            formatarBonusProf();
            atualizarModificadoresSalvaguarda();
            atualizarPericias();
            atualizarPassivas();
            atualizarMagias();
            atualizarSeletoresAtaqueEquipados();
            atualizarSubAbaArmas();
        });
        bonusOrbeInput.addEventListener('change', () => {
            formatarBonusProf();
            atualizarModificadoresSalvaguarda();
            atualizarPericias();
            atualizarPassivas();
            atualizarMagias();
            atualizarSeletoresAtaqueEquipados();
            atualizarSubAbaArmas();
        });

        document.getElementById('classeNomeID').addEventListener('input', () => {
            sincronizarClasseNivel();
            sincronizarResumoCaracteristicas();
            sincronizarCamposMagia();
            atualizarMagias();
        });
        document.getElementById('classeNivelID').addEventListener('input', () => sincronizarClasseNivel());
        document.getElementById('classeNivelID').addEventListener('change', () => sincronizarClasseNivel());
        document.getElementById('racaID').addEventListener('input', () => sincronizarResumoCaracteristicas());
        document.getElementById('antecedenteID').addEventListener('input', () => sincronizarResumoCaracteristicas());
        const campoClasseConjuradora = document.getElementById('magiaClasseConjuradora');
        if (campoClasseConjuradora) {
            campoClasseConjuradora.addEventListener('input', () => {
                const campoAtributo = document.getElementById('magiaAtributoConjuracao');
                sincronizarCamposMagia(false, !campoAtributo?.value);
                atualizarMagias();
            });
            campoClasseConjuradora.addEventListener('change', () => {
                const campoAtributo = document.getElementById('magiaAtributoConjuracao');
                sincronizarCamposMagia(false, !campoAtributo?.value);
                atualizarMagias();
            });
        }
        const campoAtributoConjuracao = document.getElementById('magiaAtributoConjuracao');
        if (campoAtributoConjuracao) {
            campoAtributoConjuracao.addEventListener('input', atualizarMagias);
            campoAtributoConjuracao.addEventListener('change', atualizarMagias);
        }
        inicializarGerenciadorMagias();
        const overlayMagia = document.getElementById('magiaModalOverlay');
        if (overlayMagia) {
            overlayMagia.addEventListener('click', evento => {
                if (evento.target === overlayMagia) {
                    fecharModalMagia();
                }
            });
        }
        document.getElementById('magiaModalEditar')?.addEventListener('click', () => {
            preencherFormularioMagia(obterMagiaDoEstadoModal());
            alternarModoModalMagia('editar');
        });
        document.getElementById('magiaModalCancelarEdicao')?.addEventListener('click', () => {
            preencherFormularioMagia(obterMagiaDoEstadoModal());
            alternarModoModalMagia('visualizar');
        });
        document.getElementById('magiaModalSalvar')?.addEventListener('click', salvarModalMagia);
        document.getElementById('magiaModalFechar')?.addEventListener('click', fecharModalMagia);
        ['magiaModalPropDano', 'magiaModalPropCura', 'magiaModalPropConcentracao', 'magiaModalResolucao'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', atualizarVisibilidadeFormularioMagia);
        });
        ['armaduraCA', 'outroEquipadoCA', 'escudoCA'].forEach(id => {
            const campo = document.getElementById(id);
            if (!campo) return;
            campo.addEventListener('input', () => {
                aplicarFormatoCA(id);
                atualizarClasseArmaduraEquipada();
            });
            campo.addEventListener('change', () => {
                aplicarFormatoCA(id);
                atualizarClasseArmaduraEquipada();
            });
        });
        ['ca_valor', 'ca_escudo'].forEach(id => {
            const campo = document.getElementById(id);
            if (!campo) return;
            campo.addEventListener('input', atualizarResumoAtaquesConjuracao);
            campo.addEventListener('change', atualizarResumoAtaquesConjuracao);
        });
        ['pvAtual', 'pvTotal', 'pvTemporario'].forEach(id => {
            const campo = document.getElementById(id);
            if (!campo) return;
            campo.addEventListener('input', normalizarPontosDeVida);
            campo.addEventListener('change', normalizarPontosDeVida);
        });
        ['dadosVidaRestantes', 'dadosVidaTotal'].forEach(id => {
            const campo = document.getElementById(id);
            if (!campo) return;
            campo.addEventListener('input', normalizarDadosVida);
            campo.addEventListener('change', normalizarDadosVida);
        });
        ['arma1Ataque', 'arma1Dano', 'arma2Ataque', 'arma2Dano'].forEach(id => {
            const campo = document.getElementById(id);
            if (!campo) return;
            campo.addEventListener('input', atualizarSubAbaArmas);
            campo.addEventListener('change', atualizarSubAbaArmas);
        });
        ['arma1Nome', 'arma2Nome'].forEach((id, indice) => {
            const campo = document.getElementById(id);
            if (!campo) return;
            campo.addEventListener('change', () => {
                lidarSelecaoArmaEquipada(indice + 1);
                atualizarSubAbaArmas();
            });
        });
        ['arma1Desequipar', 'arma2Desequipar'].forEach((id, indice) => {
            const botao = document.getElementById(id);
            if (!botao) return;
            botao.addEventListener('click', () => {
                desequiparArmaSlot(indice + 1);
                atualizarSubAbaArmas();
            });
        });
        const overlayAtaque = document.getElementById('modalAtaqueOverlay');
        if (overlayAtaque) {
            overlayAtaque.addEventListener('click', evento => {
                if (evento.target === overlayAtaque) {
                    fecharModalAtaqueArma();
                }
            });
        }
        document.getElementById('modalAtaqueSucesso')?.addEventListener('click', abrirEtapaDanoAtaque);
        document.getElementById('modalAtaqueFracasso')?.addEventListener('click', confirmarFracassoAtaque);
        document.getElementById('modalAtaqueCancelar')?.addEventListener('click', fecharModalAtaqueArma);
        document.getElementById('modalAtaqueRegistrarDano')?.addEventListener('click', confirmarDanoAtaque);
        document.getElementById('modalAtaqueCancelarDano')?.addEventListener('click', fecharModalAtaqueArma);
        document.getElementById('modalAtaqueDado')?.addEventListener('keydown', evento => {
            if (evento.key === 'Enter') abrirEtapaDanoAtaque();
        });
        document.getElementById('modalAtaqueDado')?.addEventListener('input', () => {
            atualizarEstadoCriticoModalAtaque();
        });
        document.getElementById('modalAtaqueDado')?.addEventListener('change', () => {
            atualizarEstadoCriticoModalAtaque();
        });
        document.getElementById('modalAtaqueDano')?.addEventListener('keydown', evento => {
            if (evento.key === 'Enter') confirmarDanoAtaque();
        });
        document.addEventListener('keydown', evento => {
            if (evento.key === 'Escape') {
                const overlay = document.getElementById('modalAtaqueOverlay');
                if (overlay && !overlay.classList.contains('oculto')) {
                    fecharModalAtaqueArma();
                    return;
                }

                const overlayMagiaAtivo = document.getElementById('magiaModalOverlay');
                if (overlayMagiaAtivo && !overlayMagiaAtivo.classList.contains('oculto')) {
                    fecharModalMagia();
                }
            }
        });
        const campoPosicaoAtaque = document.getElementById('ataquePosicao');
        if (campoPosicaoAtaque) {
            campoPosicaoAtaque.addEventListener('input', normalizarPosicaoAtaque);
            campoPosicaoAtaque.addEventListener('change', normalizarPosicaoAtaque);
        }

        // Inicializa ao carregar
        formatarBonusProf();
        sincronizarClasseNivel(true);
        sincronizarResumoCaracteristicas(true);
        sincronizarAtributosComSalvaguardas();
        atualizarAtributos();
        desenharRadar();
        atualizarModificadoresSalvaguarda();
        atualizarPericias();
        atualizarPassivas();
        sincronizarCamposMagia(true, true);
        atualizarMagias();
        normalizarPontosDeVida();
        normalizarDadosVida();
        aplicarFormatoCA('armaduraCA');
        aplicarFormatoCA('outroEquipadoCA');
        aplicarFormatoCA('escudoCA');
        normalizarPosicaoAtaque();
        atualizarListaArmasEquipamento();
        sincronizarEquipamentosCombate();
        atualizarClasseArmaduraEquipada();
        atualizarResumoAtaquesConjuracao();
        atualizarSubAbaArmas();



    
