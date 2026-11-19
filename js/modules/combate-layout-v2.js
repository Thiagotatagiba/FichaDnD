// Reorganiza os controles oficiais na composição Combate 2.0 sem clonar estado.
(() => {
  const combate = document.getElementById("combate");
  const gridOriginal = combate?.querySelector(":scope > .combate-grid");
  if (!combate || !gridOriginal || combate.dataset.combateV2Montado === "true") return;

  const criar = (tag, classe, texto) => {
    const node = document.createElement(tag);
    if (classe) node.className = classe;
    if (texto) node.textContent = texto;
    return node;
  };
  const painel = (classe, titulo, eyebrow) => {
    const section = criar("section", `combat-v2-panel ${classe}`);
    section.setAttribute("aria-label", titulo);
    const head = criar("div", "combat-v2-panel-head");
    if (eyebrow) head.append(criar("span", "combat-v2-step", eyebrow));
    head.append(criar("h2", "combat-v2-title", titulo));
    section.append(head);
    return section;
  };

  const firstLine = gridOriginal.querySelector(":scope > .combate-linha");
  const oldCards = [...(firstLine?.querySelectorAll(":scope > .combate-card") || [])];
  const equipment = oldCards[0]?.querySelector(".equipados-secoes");
  const attackCard = oldCards[1];
  const attackTop = attackCard?.querySelector(".ataque-topo");
  const tabs = attackCard?.querySelector(".subabas-combate");
  const inventory = gridOriginal.querySelector(":scope > .combate-linha:nth-child(2) .equipamento-colunas");
  const hands = equipment?.querySelector(".equipados-armas-bloco");
  const legacyHandFields = {
    attack1: hands?.querySelector("#arma1Ataque"), attack2: hands?.querySelector("#arma2Ataque"),
    damage1: hands?.querySelector("#arma1Dano"), damage2: hands?.querySelector("#arma2Dano"),
  };
  const gripMenu = equipment?.querySelector("#empunhaduraMenu");
  const armor = equipment?.querySelector("#armaduraNome")?.closest(".equipados-grid.armadura");
  const potions = equipment?.querySelector("#listaPocoesEquipadas")?.closest(".equipados-secao");
  const other = equipment?.querySelector("#outroEquipadoTipo")?.closest(".equipados-secao");
  const shieldAndCa = attackTop?.querySelector(".ataque-mini-escudo");
  const hp = attackTop?.querySelector(".ataque-pv-bloco");
  const hud = attackTop?.querySelector("#combateHud");
  const condition = hud?.querySelector(".combate-condicao-caixa");
  const quickActions = attackTop?.querySelector(".linha-acoes");
  if (!hands || !armor || !shieldAndCa || !hp || !hud || !condition || !quickActions || !tabs || !inventory) return;

  const shell = criar("div", "combat-v2-shell");
  const intro = criar("div", "combat-v2-intro");
  const introText = criar("div", "combat-v2-intro-copy");
  introText.append(criar("span", "combat-v2-eyebrow", "NO CALOR DA BATALHA"));
  introText.append(criar("p", "combat-v2-lede", "O essencial primeiro. Cada mão, uma escolha."));
  intro.append(introText);
  shell.append(intro);

  const summary = criar("div", "combat-v2-summary");
  const hpPanel = painel("combat-v2-hp", "Pontos de vida");
  const hpLine = criar("div", "combat-v2-hp-line");
  const hpValue = hp.querySelector(".ataque-pv-valor");
  const hpText = hpValue?.querySelector("span");
  const hpTemporary = criar("span", "combat-v2-hp-temporary");
  const hpTotal = criar("span", "combat-v2-hp-total");
  if (hpValue) hpValue.append(hpTemporary, hpTotal);
  hpLine.append(hpValue);
  const hpControls = criar("div", "combat-v2-hp-controls");
  const damage = quickActions.querySelector("button[onclick*=\"dano\"]");
  const heal = quickActions.querySelector("button[onclick*=\"cura\"]");
  if (damage) {
    damage.textContent = "− Dano";
    damage.setAttribute("aria-label", "Registrar dano");
    hpControls.append(damage);
  }
  if (heal) {
    heal.textContent = "+ Cura";
    heal.setAttribute("aria-label", "Registrar cura");
    hpControls.append(heal);
  }
  hpPanel.append(hpLine, hpControls, hp.querySelector(".ataque-contra-morte"));

  const defensePanel = painel("combat-v2-defense", "Classe de armadura");
  const defenseValue = criar("div", "combat-v2-defense-value");
  const shield = criar("div", "combat-v2-shield");
  shield.append(shieldAndCa);
  const armorSelect = armor.querySelector("#armaduraNome");
  const armorControls = criar("div", "combat-v2-armor-controls");
  if (armorSelect) armorControls.append(armorSelect);
  defenseValue.append(shield, armorControls);
  defensePanel.append(defenseValue);

  const turnPanel = painel("combat-v2-turn", "Iniciativa");
  const turnHead = turnPanel.querySelector(".combat-v2-panel-head");
  const initiativeBonus = criar("span", "combat-v2-initiative-bonus");
  const initiativeResult = criar("strong", "combat-v2-initiative-result");
  const initiativeSummary = criar("div", "combat-v2-initiative-summary");
  const initiativeResultBlock = criar("div", "combat-v2-initiative-result-block");
  initiativeResultBlock.append(initiativeResult);
  const initiativeHeaderValue = criar("div", "combat-v2-initiative-header-value");
  initiativeHeaderValue.append(initiativeResultBlock);
  initiativeSummary.append(initiativeBonus);
  turnHead?.append(initiativeHeaderValue);
  hud.classList.add("combat-v2-hud");
  const startControl = hud.querySelector("#combateInicioControle");
  const positionBox = hud.querySelector("#combatePosicaoCaixa");
  const roundBox = hud.querySelector("#combateRodadaCaixa");
  const endCombat = hud.querySelector("#btnEncerrarCombate");
  const positionLabel = positionBox?.querySelector("label");
  if (positionLabel) positionLabel.textContent = "Posição:";
  const roundLabel = roundBox?.querySelector("label");
  if (roundLabel) roundLabel.textContent = "Rodada";
  const startButton = startControl?.querySelector("#btnRolarIniciativa");
  if (startButton) {
    startButton.textContent = "Rolar iniciativa";
    startButton.setAttribute("aria-label", "Rolar iniciativa");
  }
  const nextRound = roundBox?.querySelector("#btnProximaRodada");
  if (nextRound) {
    nextRound.textContent = "Próximo turno";
    nextRound.setAttribute("aria-label", "Próximo turno");
    nextRound.setAttribute("title", "Próximo turno");
  }
  const roundInput = roundBox?.querySelector("#combateRodada");
  if (roundLabel && roundInput && nextRound) {
    const roundValue = criar("div", "combat-v2-round-value");
    const nextTurnRow = criar("div", "combat-v2-next-turn-row");
    roundValue.append(roundLabel, roundInput);
    nextTurnRow.append(nextRound);
    roundBox.replaceChildren(roundValue, nextTurnRow);
  }
  if (endCombat) endCombat.textContent = "Encerrar combate";
  const turnControlRow = criar("div", "combat-v2-turn-controls");
  [startControl, positionBox, roundBox].forEach(control => { if (control) turnControlRow.append(control); });
  const turnFooter = criar("div", "combat-v2-turn-footer");
  if (endCombat) turnFooter.append(endCombat);
  hud.replaceChildren(turnControlRow, turnFooter);
  condition.remove();
  turnPanel.append(initiativeSummary, hud);

  const conditionPanel = painel("combat-v2-conditions", "Condições");
  const conditionHead = conditionPanel.querySelector(".combat-v2-panel-head");
  const conditionAdd = criar("button", "combat-v2-add-condition", "＋ Adicionar");
  conditionAdd.type = "button";
  conditionAdd.setAttribute("aria-label", "Adicionar condição");
  conditionAdd.addEventListener("click", () => document.getElementById("ataqueCondicao")?.click());
  conditionHead.append(conditionAdd);
  const conditionChips = criar("div", "combat-v2-condition-chips");
  conditionChips.setAttribute("role", "list");
  conditionChips.setAttribute("aria-live", "polite");
  const concentration = criar("div", "combat-v2-concentration");
  concentration.append(criar("strong", "combat-v2-concentration-title", "Concentração"));
  const concentrationState = criar("span", "combat-v2-concentration-state");
  concentration.append(concentrationState);
  conditionPanel.append(conditionChips, concentration);

  summary.append(hpPanel, defensePanel, turnPanel, conditionPanel);
  shell.append(summary);

  const mainLayout = criar("div", "combat-v2-layout");
  const aside = criar("aside", "combat-v2-aside");
  const handsPanel = painel("combat-v2-hands-panel", "Armas em mãos", "01");
  const handItems = [...hands.querySelectorAll(":scope > .equipados-armas-item")];
  handsPanel.append(hands);
  handItems.forEach((item, index) => {
    const slot = index + 1;
    const slotControl = item.querySelector(".equipados-slot-com-emoji");
    const handButton = slotControl?.querySelector(".equipados-mao-emoji");
    const handSelect = slotControl?.querySelector(`#arma${slot}Nome`);
    if (!slotControl || !handButton || !handSelect) return;
    const normalizeHandPlaceholder = () => {
      if (slot !== 2) return;
      const emptyOption = [...handSelect.options].find(option => option.value === "");
      if (emptyOption && /mão secundária\s*\/\s*escudo/i.test(emptyOption.textContent)) {
        emptyOption.textContent = "Selecionar equipamento";
      }
    };
    normalizeHandPlaceholder();
    new MutationObserver(normalizeHandPlaceholder).observe(handSelect, { childList: true, subtree: true });
    if (slot === 2) {
      const emptyOption = [...handSelect.options].find(option => option.value === "");
      if (emptyOption && /mão secundária\s*\/\s*escudo/i.test(emptyOption.textContent)) {
        emptyOption.textContent = "Selecionar equipamento";
      }
    }
    const label = criar("span", "combat-v2-hand-label", slot === 1 ? "Mão Principal" : "Mão Secundária");
    const icon = criar("span", "combat-v2-hand-icon");
    if (slot === 2) icon.classList.add("combat-v2-hand-icon--secondary");
    icon.append(handButton);
    const selectedName = criar("strong", "combat-v2-hand-name");
    const state = criar("span", "combat-v2-hand-state");
    const updateHandName = () => {
      normalizeHandPlaceholder();
      const option = handSelect.selectedOptions[0];
      const name = option?.textContent?.trim() || "";
      const duasMaos = typeof estadoCombate !== "undefined" &&
        estadoCombate?.maoPrincipal?.modo === "duas_maos";
      if (!handSelect.value) {
        selectedName.textContent = slot === 2 && duasMaos ? "Duas mãos" : "Mão Livre";
        state.textContent = "";
        return;
      }
      selectedName.textContent = name.replace(/^\p{Extended_Pictographic}‍?\s*/u, "");
      state.textContent = slot === 1 && duasMaos ? "Duas mãos" : "";
    };
    handSelect.addEventListener("change", updateHandName);
    handSelect.addEventListener("combatv2render", updateHandName);
    updateHandName();
    slotControl.replaceChildren(label, icon, selectedName, state, handSelect);
  });

  const displacement = document.getElementById("deslocamento");
  const displacementDisplay = criar("div", "combat-v2-equipment-line");
  displacementDisplay.append(criar("span", "combat-v2-equipment-label", "Deslocamento"));
  const displacementValue = criar("strong", "combat-v2-equipment-value");
  displacementDisplay.append(displacementValue);
  handsPanel.append(displacementDisplay);
  const accessoriesDisplay = criar("div", "combat-v2-accessories");
  accessoriesDisplay.append(criar("span", "combat-v2-accessories-title", "Acessórios"));
  const accessoryValue = criar("span", "combat-v2-accessories-value");
  accessoriesDisplay.append(accessoryValue);
  handsPanel.append(accessoriesDisplay);
  if (gripMenu) handsPanel.append(gripMenu);

  const resourcesPanel = painel("combat-v2-resources", "Recursos de combate");
  if (potions) resourcesPanel.append(potions);
  if (other) resourcesPanel.append(other);
  aside.append(handsPanel, resourcesPanel);

  const main = criar("main", "combat-v2-main");
  const actionsPanel = painel("combat-v2-actions", "Ataques e ações", "02");
  const turnStatus = criar("div", "combat-v2-turn-status");
  turnStatus.append(criar("span", "combat-v2-eyebrow", "TURNO"), criar("span", "combat-v2-note", "Posição e rodada aparecem ao iniciar o combate."));
  actionsPanel.append(turnStatus, tabs);
  const actionTabList = tabs.querySelector(".subabas-botoes");
  const optionsTab = criar("button", "subaba-botao", "Outras ações");
  optionsTab.type = "button";
  optionsTab.setAttribute("onclick", "trocarSubAbaCombate('outras', this)");
  optionsTab.setAttribute("aria-controls", "subabaCombateOutras");
  actionTabList?.append(optionsTab);

  const optionsPanel = criar("div", "subaba-combate combat-v2-other-actions");
  optionsPanel.id = "subabaCombateOutras";
  optionsPanel.setAttribute("role", "tabpanel");
  optionsPanel.setAttribute("aria-label", "Outras ações de combate");
  optionsPanel.append(criar("p", "combat-v2-note", "Ações registradas no histórico; não aplicam efeitos automaticamente."));
  const optionsGrid = criar("div", "combat-v2-other-actions-grid");
  const registrarAcaoVisual = (label, icon) => {
    if (window.__fichaImportacaoTransacaoAtiva) return;
    if (typeof window.adicionarRegistroHistoricoCombate === "function") {
      window.adicionarRegistroHistoricoCombate("Ação", `${label} — registrada; sem resolução automática`, icon);
    }
  };
  [
    ["Esquivar", "Priorizar sua defesa"],
    ["Desengajar", "Mover sem provocar ataques"],
    ["Disparada", "Movimento adicional"],
    ["Ajudar", "Apoiar um aliado"],
    ["Esconder", "Buscar cobertura"],
    ["Preparar", "Definir um gatilho"],
  ].forEach(([label, description]) => {
    const actionButton = criar("button", "combat-v2-other-action");
    actionButton.type = "button";
    actionButton.setAttribute("aria-label", `${label}: ${description}`);
    actionButton.append(criar("strong", "combat-v2-other-action-title", label), criar("span", "combat-v2-other-action-description", description));
    actionButton.addEventListener("click", () => registrarAcaoVisual(label, "◇"));
    optionsGrid.append(actionButton);
  });
  optionsPanel.append(optionsGrid);
  tabs.append(optionsPanel);

  quickActions.classList.add("combat-v2-quick-actions");
  const resistance = quickActions.querySelector("#abrirTesteResistenciaBtn");
  if (resistance) {
    resistance.textContent = "Teste de resistência";
    resistance.setAttribute("aria-label", "Fazer teste de resistência");
    const quickTitle = criar("h3", "combat-v2-subtitle", "Ações rápidas");
    const quickWrap = criar("div", "combat-v2-quick-wrap");
    const quickButtons = criar("div", "combat-v2-quick-actions");
    [["Esquivar", "◇"], ["Desengajar", "↗"]].forEach(([label, icon]) => {
      const button = criar("button", "combat-v2-quick-action", `${icon} ${label}`);
      button.type = "button";
      button.addEventListener("click", () => registrarAcaoVisual(label, icon));
      quickButtons.append(button);
    });
    quickButtons.append(resistance);
    quickWrap.append(quickTitle, quickButtons);
    actionsPanel.append(quickWrap);
  }
  const logPanel = painel("combat-v2-log", "Registro do combate", "03");
  const history = tabs.querySelector("#subabaCombateHistorico");
  const historyButton = tabs.querySelector('.subaba-botao[onclick*="historico"]');
  const finalizeHistory = history?.querySelector('button[onclick*="finalizarCombateLimparHistorico"]');
  historyButton?.remove();
  if (finalizeHistory) {
    finalizeHistory.classList.add("combat-v2-finalize-history");
    finalizeHistory.textContent = "Limpar histórico";
    logPanel.querySelector(".combat-v2-panel-head")?.append(finalizeHistory);
  }
  if (history) {
    history.classList.remove("subaba-combate", "ativa");
    history.classList.add("combat-v2-history-content");
    logPanel.append(history);
  }
  main.append(actionsPanel, logPanel);
  mainLayout.append(aside, main);
  shell.append(mainLayout);

  const compat = criar("div", "combat-v2-compat");
  compat.setAttribute("aria-hidden", "true");
  const compatibilityFields = [
    armor.querySelector("#armaduraCA"), armor.querySelector("#armaduraFurtividade"),
    equipment.querySelector("#escudoNome"), equipment.querySelector("#escudoCA"),
    legacyHandFields.damage1, legacyHandFields.damage2,
    document.getElementById("ataqueCaEscudo"), condition.querySelector("#ataqueCondicao"),
  ].filter(Boolean);
  const attributes = {};
  [1, 2].forEach(slot => {
    const select = legacyHandFields[`attack${slot}`];
    if (select) {
      attributes[slot] = select;
      compat.append(select);
    }
  });
  compatibilityFields.forEach(field => {
    if (field === condition.querySelector("#ataqueCondicao")) {
      field.tabIndex = -1;
      field.setAttribute("aria-hidden", "true");
      field.removeAttribute("role");
    }
    compat.append(field);
  });
  shell.append(compat);

  window.FichaDnDCombateLayoutV2 = {
    atributosAtaque: attributes,
    atualizar: () => {
      const current = document.getElementById("pvAtual")?.value ?? "—";
      const maximum = document.getElementById("pvTotal")?.value ?? "—";
      const temporary = document.getElementById("pvTemporario")?.value ?? "0";
      if (hpText) hpText.textContent = `PV ${current}`;
      hpTotal.textContent = `/ ${maximum} PV`;
      const temporaryValue = Number(temporary) || 0;
      hpTemporary.textContent = temporaryValue > 0 ? `+${temporaryValue}` : "";
      const rawCondition = document.getElementById("ataqueCondicao")?.value || "";
      const conditions = (typeof removerRotuloConcentracaoCondicoes === "function" ? removerRotuloConcentracaoCondicoes(rawCondition) : rawCondition)
        .split(",").map(value => value.trim()).filter(Boolean);
      conditionChips.replaceChildren();
      if (!conditions.length) conditionChips.append(criar("span", "combat-v2-condition-empty", "Nenhuma condição ativa"));
      conditions.forEach(value => {
        const chip = criar("span", "combat-v2-condition-chip", value);
        chip.setAttribute("role", "listitem");
        conditionChips.append(chip);
      });
      concentrationState.textContent = typeof concentracaoAtiva !== "undefined" && concentracaoAtiva
        ? (typeof obterNomeConcentracao === "function" ? obterNomeConcentracao() : "Ativa")
        : "Nenhuma concentração ativa";
      const bonusRaw = document.getElementById("iniciativa")?.value?.trim() || "";
      const bonusNumber = Number(bonusRaw);
      initiativeBonus.textContent = `Bônus ${bonusRaw ? `${Number.isFinite(bonusNumber) && bonusNumber > 0 && !bonusRaw.startsWith("+") ? "+" : ""}${bonusRaw}` : "—"}`;
      const combatState = typeof estadoCombateIniciativa !== "undefined" ? estadoCombateIniciativa : null;
      const total = combatState?.iniciativa ?? null;
      const active = !!combatState?.ativo;
      initiativeResult.textContent = total == null ? "" : String(total);
      initiativeBonus.hidden = active;
      initiativeResultBlock.hidden = !active;
      initiativeSummary.hidden = active;
      turnPanel.classList.toggle("combat-v2-in-combat", active);
      displacementValue.textContent = displacement?.value || "—";
      const accessory = document.getElementById("outroEquipadoTipo")?.value?.trim();
      accessoryValue.textContent = accessory || "Nenhum acessório equipado";
      accessoriesDisplay.hidden = !accessory;
      handItems.forEach(item => item.querySelector(".equipados-slot-com-emoji select")?.dispatchEvent(new Event("combatv2render")));
      const historyEntries = history?.querySelector("#historicoRegistros");
      const hasHistory = !!historyEntries?.children.length;
      const isActive = typeof estadoCombateIniciativa !== "undefined" && !!estadoCombateIniciativa.ativo;
      logPanel.classList.toggle("combat-v2-log-empty", !hasHistory && !isActive);
      if (finalizeHistory) {
        finalizeHistory.hidden = !hasHistory && !isActive;
        finalizeHistory.textContent = isActive ? "Finalizar combate" : "Limpar histórico";
      }
    },
  };

  const columns = [...inventory.querySelectorAll(":scope > .equipamento-coluna")];
  const inventorySection = criar("details", "combat-v2-inventory");
  const inventoryHead = criar("summary", "combat-v2-inventory-head");
  inventoryHead.append(criar("span", "combat-v2-step", "04"), criar("h2", "combat-v2-title", "Inventário e equipamentos"));
  inventoryHead.append(criar("small", "combat-v2-inventory-hint", "Gerenciar, equipar e ordenar itens"));
  const inventoryGrid = criar("div", "combat-v2-inventory-grid");
  const addInventoryCard = (title, children) => {
    const card = painel("combat-v2-item-card", title);
    children.forEach(node => { if (node) card.append(node); });
    inventoryGrid.append(card);
  };
  const weaponColumn = columns[0];
  const armorColumn = columns[1];
  const otherColumn = columns[2];
  addInventoryCard("Armas", [weaponColumn?.querySelector("#lista-armas-equipamento")]);
  addInventoryCard("Armaduras", [armorColumn?.querySelector("#lista-armaduras-equipamento")]);
  addInventoryCard("Escudos", [armorColumn?.querySelector("#lista-escudos-equipamento")]);
  addInventoryCard("Acessórios", [otherColumn?.querySelector("#lista-outros-equipamento")]);
  inventorySection.append(inventoryHead, inventoryGrid);
  shell.append(inventorySection);

  tabs.querySelectorAll(".subaba-botao").forEach(button => {
    const label = button.textContent.trim().toLowerCase();
    if (label === "arma") button.textContent = "Ataques";
    else if (label === "magia") button.textContent = "Magias";
  });
  gridOriginal.replaceChildren(shell);
  combate.dataset.combateV2Montado = "true";
  const refresh = () => window.FichaDnDCombateLayoutV2?.atualizar();
  ["pvAtual", "pvTotal", "pvTemporario", "iniciativa", "deslocamento", "outroEquipadoTipo", "ataquePosicao", "combateRodada", "armaduraNome", "arma1Nome", "arma2Nome"]
    .map(id => document.getElementById(id)).filter(Boolean)
    .forEach(field => { field.addEventListener("input", refresh); field.addEventListener("change", refresh); });
  condition.querySelector("#ataqueCondicao")?.addEventListener("input", refresh);
  condition.querySelector("#ataqueCondicao")?.addEventListener("change", refresh);
  const records = document.getElementById("historicoRegistros");
  if (records) new MutationObserver(refresh).observe(records, { childList: true, subtree: true });
  refresh();
})();
