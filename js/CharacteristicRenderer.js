/**
 * CharacteristicRenderer.js
 * Renderizador de características com cards modernos
 * 
 * Responsabilidades:
 * - Renderizar características em cards
 * - Diferenciar visualmente por origem
 * - Gerenciar interações e eventos
 * - Atualizar UI reactivamente
 */

class CharacteristicRenderer {
  constructor(containerId = "talentoClasseLista") {
    this.container = document.getElementById(containerId);
    this.expandedItems = new Set();
    this.editingItem = null;
    this.filterText = "";
    this.filterOrigin = null; // "classe", "subclasse", "manual"
  }

  /**
   * Renderiza lista de características como cards
   * @param {Array} characteristics - Array de características
   * @param {Object} options - Opções de renderização
   */
  render(characteristics, options = {}) {
    if (!this.container) {
      console.warn("[CharacteristicRenderer] Container não encontrado");
      return;
    }

    const {
      onEdit = null,
      onRemove = null,
      onAdd = null,
      editable = true,
      filteredOrigins = null
    } = options;

    // Filtra características
    let filtered = characteristics;

    if (this.filterText) {
      filtered = filtered.filter(c =>
        c.nome?.toLowerCase().includes(this.filterText.toLowerCase()) ||
        c.descricao?.toLowerCase().includes(this.filterText.toLowerCase())
      );
    }

    if (filteredOrigins && Array.isArray(filteredOrigins)) {
      filtered = filtered.filter(c => filteredOrigins.includes(c.origem));
    }

    // Limpa container
    this.container.innerHTML = "";

    if (filtered.length === 0) {
      this.container.innerHTML = '<div class="characteristics-empty">Nenhuma característica encontrada</div>';
      return;
    }

    // Renderiza cada característica
    filtered.forEach(char => {
      const card = this._createCard(char, { onEdit, onRemove, editable });
      this.container.appendChild(card);
    });
  }

  /**
   * Cria card de característica
   * @param {Object} characteristic - Dados da característica
   * @param {Object} handlers - Handlers de eventos
   * @returns {HTMLElement} Card renderizado
   */
  _createCard(characteristic, handlers = {}) {
    const card = document.createElement("div");
    card.className = "characteristic-card";
    card.setAttribute("data-char-id", characteristic.id);
    card.setAttribute("data-origin", characteristic.origem || "desconhecido");

    // Adiciona classe CSS específica por origem
    switch (characteristic.origem) {
      case "classe":
        card.classList.add("card-origem-classe");
        break;
      case "subclasse":
      case "arquetipo":
        card.classList.add("card-origem-subclasse");
        break;
      case "manual":
        card.classList.add("card-origem-manual");
        break;
    }

    // Header do card
    const header = document.createElement("div");
    header.className = "characteristic-card-header";

    const titleDiv = document.createElement("div");
    titleDiv.className = "characteristic-card-title";

    // Icon by origem
    const icon = this._getIconForOrigin(characteristic.origem);
    titleDiv.innerHTML = `${icon} <strong>${this._escapeHtml(characteristic.nome)}</strong>`;

    // Badge de origem e nível
    const badgeDiv = document.createElement("div");
    badgeDiv.className = "characteristic-card-badge";
    badgeDiv.innerHTML = this._createBadgeHTML(characteristic);

    header.appendChild(titleDiv);
    header.appendChild(badgeDiv);
    card.appendChild(header);

    // Descrição (expandível)
    const descDiv = document.createElement("div");
    descDiv.className = "characteristic-card-description";

    if (characteristic.descricao) {
      const desc = document.createElement("p");
      desc.className = "characteristic-desc-text";
      desc.textContent = characteristic.descricao;

      descDiv.appendChild(desc);

      // Button toggle descrição
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "characteristic-card-toggle";
      toggleBtn.innerHTML = "➖ Recolher";

      if (!this.expandedItems.has(characteristic.id)) {
        desc.style.display = "none";
        toggleBtn.innerHTML = "➕ Expandir";
      }

      toggleBtn.addEventListener("click", () => {
        if (desc.style.display === "none") {
          desc.style.display = "block";
          toggleBtn.innerHTML = "➖ Recolher";
          this.expandedItems.add(characteristic.id);
        } else {
          desc.style.display = "none";
          toggleBtn.innerHTML = "➕ Expandir";
          this.expandedItems.delete(characteristic.id);
        }
      });

      descDiv.appendChild(toggleBtn);
    }

    card.appendChild(descDiv);

    // Footer com ações
    if (handlers.onRemove || handlers.onEdit || handlers.editable) {
      const footer = document.createElement("div");
      footer.className = "characteristic-card-footer";

      // Menu de ações
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "characteristic-card-actions";

      // Botão editar (apenas para manuais)
      if (characteristic.origem === "manual" && handlers.onEdit) {
        const editBtn = document.createElement("button");
        editBtn.className = "characteristic-card-btn characteristic-card-btn-edit";
        editBtn.title = "Editar";
        editBtn.innerHTML = "✏️";
        editBtn.addEventListener("click", () => handlers.onEdit(characteristic));
        actionsDiv.appendChild(editBtn);
      }

      // Botão remover (apenas para manuais)
      if (characteristic.origem === "manual" && handlers.onRemove) {
        const removeBtn = document.createElement("button");
        removeBtn.className = "characteristic-card-btn characteristic-card-btn-remove";
        removeBtn.title = "Remover";
        removeBtn.innerHTML = "🗑️";
        removeBtn.addEventListener("click", () => {
          if (confirm(`Remover "${characteristic.nome}"?`)) {
            handlers.onRemove(characteristic.id);
          }
        });
        actionsDiv.appendChild(removeBtn);
      }

      footer.appendChild(actionsDiv);
      card.appendChild(footer);
    }

    return card;
  }

  /**
   * Renderiza lista com filtros
   * @param {Array} characteristics - Array de características
   * @param {Object} options - Opções
   */
  renderWithFilters(characteristics, options = {}) {
    if (!this.container) return;

    const container = this.container.parentElement;
    if (!container) return;

    // Container para filtros
    let filterBar = container.querySelector(".characteristics-filter-bar");
    if (!filterBar) {
      filterBar = document.createElement("div");
      filterBar.className = "characteristics-filter-bar";
      container.insertBefore(filterBar, this.container);
    }

    // Input de busca
    let searchInput = filterBar.querySelector("input.characteristics-search");
    if (!searchInput) {
      searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.className = "characteristics-search";
      searchInput.placeholder = "🔍 Buscar característica...";
      searchInput.addEventListener("input", (e) => {
        this.filterText = e.target.value;
        this.render(characteristics, options);
      });
      filterBar.appendChild(searchInput);
    }

    // Botões de filtro por origem
    let filterBtns = filterBar.querySelector(".characteristics-filter-buttons");
    if (!filterBtns) {
      filterBtns = document.createElement("div");
      filterBtns.className = "characteristics-filter-buttons";

      const origins = ["classe", "subclasse", "manual"];
      origins.forEach(origin => {
        const btn = document.createElement("button");
        btn.className = "characteristics-filter-btn";
        btn.textContent = this._getOriginLabel(origin);
        btn.addEventListener("click", () => {
          this.filterOrigin = this.filterOrigin === origin ? null : origin;
          this._updateFilterButtons();
          this.render(characteristics, { ...options, filteredOrigins: this.filterOrigin ? [this.filterOrigin] : null });
        });
        filterBtns.appendChild(btn);
      });

      filterBar.appendChild(filterBtns);
    }

    // Renderiza lista
    this.render(characteristics, options);
  }

  /**
   * Renderiza modal de edição
   * @param {Object} characteristic - Característica a editar
   * @param {Function} onSave - Callback ao salvar
   * @returns {HTMLElement} Modal
   */
  createEditModal(characteristic, onSave) {
    const modal = document.createElement("div");
    modal.className = "characteristic-modal";
    modal.innerHTML = `
      <div class="characteristic-modal-content">
        <div class="characteristic-modal-header">
          <h3>${characteristic.id ? "Editar" : "Nova"} Característica</h3>
          <button class="characteristic-modal-close">&times;</button>
        </div>
        
        <div class="characteristic-modal-body">
          <div class="form-group">
            <label>Nome</label>
            <input type="text" class="modal-input-nome" value="${this._escapeHtml(characteristic.nome || '')}" placeholder="Nome da característica">
          </div>
          
          <div class="form-group">
            <label>Descrição</label>
            <textarea class="modal-input-descricao" placeholder="Descrição detalhada...">${this._escapeHtml(characteristic.descricao || '')}</textarea>
          </div>
        </div>
        
        <div class="characteristic-modal-footer">
          <button class="characteristic-modal-btn characteristic-modal-btn-cancel">Cancelar</button>
          <button class="characteristic-modal-btn characteristic-modal-btn-save">Salvar</button>
        </div>
      </div>
    `;

    // Event handlers
    const closeBtn = modal.querySelector(".characteristic-modal-close");
    const cancelBtn = modal.querySelector(".characteristic-modal-btn-cancel");
    const saveBtn = modal.querySelector(".characteristic-modal-btn-save");
    const nomeInput = modal.querySelector(".modal-input-nome");
    const descInput = modal.querySelector(".modal-input-descricao");

    const close = () => {
      modal.remove();
      this.editingItem = null;
    };

    closeBtn.addEventListener("click", close);
    cancelBtn.addEventListener("click", close);

    saveBtn.addEventListener("click", () => {
      const updated = {
        ...characteristic,
        nome: nomeInput.value.trim(),
        descricao: descInput.value.trim()
      };

      if (!updated.nome) {
        alert("Nome é obrigatório");
        return;
      }

      onSave(updated);
      close();
    });

    // Foco no nome
    nomeInput.focus();
    nomeInput.select();

    return modal;
  }

  /**
   * Renderiza card de "adicionar nova característica"
   * @param {Function} onClick - Callback ao clicar
   * @returns {HTMLElement} Card
   */
  createAddButton(onClick) {
    const card = document.createElement("div");
    card.className = "characteristic-card characteristic-card-add";

    card.innerHTML = `
      <div class="characteristic-card-header">
        <div class="characteristic-card-title">
          ➕ <strong>Nova Característica Manual</strong>
        </div>
      </div>
      <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
        Clique para adicionar uma característica personalizada
      </div>
    `;

    card.addEventListener("click", onClick);
    return card;
  }

  /**
   * Atualiza botões de filtro visualmente
   */
  _updateFilterButtons() {
    const btns = this.container.parentElement?.querySelectorAll(".characteristics-filter-btn");
    if (btns) {
      btns.forEach(btn => {
        btn.classList.toggle("active", btn.textContent === this._getOriginLabel(this.filterOrigin));
      });
    }
  }

  /**
   * Cria HTML de badge
   * @param {Object} characteristic - Característica
   * @returns {String} HTML
   */
  _createBadgeHTML(characteristic) {
    let badge = `<span class="characteristic-badge characteristic-badge-${characteristic.origem}">`;

    if (characteristic.origem === "manual") {
      badge += "✍ Manual";
    } else if (characteristic.origem === "subclasse" || characteristic.origem === "arquetipo") {
      badge += `📖 Nv${characteristic.nivel || 1}`;
    } else {
      badge += `📘 Nv${characteristic.nivel || 1}`;
    }

    badge += "</span>";
    return badge;
  }

  /**
   * Obtém icon por origem
   * @param {String} origem - Origem da característica
   * @returns {String} Emoji/ícone
   */
  _getIconForOrigin(origem) {
    switch (origem) {
      case "classe":
        return "📘";
      case "subclasse":
      case "arquetipo":
        return "📖";
      case "manual":
        return "✍";
      default:
        return "✨";
    }
  }

  /**
   * Obtém label de origem
   * @param {String} origem - Origem
   * @returns {String} Label
   */
  _getOriginLabel(origem) {
    switch (origem) {
      case "classe":
        return "📘 Classe";
      case "subclasse":
        return "📖 Subclasse";
      case "manual":
        return "✍ Manual";
      default:
        return "Todos";
    }
  }

  /**
   * Escapa HTML para segurança
   * @param {String} text - Texto
   * @returns {String} Escapado
   */
  _escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Define texto de filtro
   * @param {String} text - Texto a filtrar
   */
  setFilter(text) {
    this.filterText = text;
  }

  /**
   * Define filtro por origem
   * @param {String} origin - Origem a filtrar
   */
  setOriginFilter(origin) {
    this.filterOrigin = origin;
  }

  /**
   * Limpa filtros
   */
  clearFilters() {
    this.filterText = "";
    this.filterOrigin = null;
  }
}

// CSS para características (será injetado)
const CHARACTERISTIC_CSS = `
/* ===== CARDS DE CARACTERÍSTICAS ===== */
.characteristic-card {
  background: #f9f7f4;
  border: 1px solid #d4c5b0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.characteristic-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #8b4513;
  transform: translateY(-2px);
}

.characteristic-card.card-origem-classe {
  border-left: 4px solid #8b4513;
}

.characteristic-card.card-origem-subclasse {
  border-left: 4px solid #d4a574;
}

.characteristic-card.card-origem-manual {
  border-left: 4px solid #4a7c59;
  background: #f4faf6;
}

.characteristic-card.characteristic-card-add {
  border: 2px dashed #8b4513;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  color: #8b4513;
}

.characteristic-card.characteristic-card-add:hover {
  background: #fef8f3;
  border-color: #6b3410;
}

.characteristic-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}

.characteristic-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.characteristic-card-badge {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.characteristic-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  white-space: nowrap;
}

.characteristic-badge-classe {
  background: #e8d4b8;
  color: #5d3a1a;
}

.characteristic-badge-subclasse,
.characteristic-badge-arquetipo {
  background: #f0e0c0;
  color: #8b6b3d;
}

.characteristic-badge-manual {
  background: #d4e8d8;
  color: #2d5a3d;
}

.characteristic-card-description {
  margin: 8px 0;
}

.characteristic-desc-text {
  font-size: 12px;
  line-height: 1.5;
  color: #555;
  margin: 0 0 8px 0;
  padding: 8px;
  background: rgba(139, 69, 19, 0.04);
  border-radius: 4px;
  border-left: 2px solid #d4c5b0;
}

.characteristic-card-toggle {
  background: none;
  border: none;
  color: #8b4513;
  cursor: pointer;
  font-size: 11px;
  padding: 2px 4px;
  text-decoration: underline;
}

.characteristic-card-toggle:hover {
  opacity: 0.7;
}

.characteristic-card-footer {
  border-top: 1px solid #e0d0bf;
  padding-top: 8px;
  margin-top: 8px;
}

.characteristic-card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.characteristic-card-btn {
  background: none;
  border: 1px solid #d0bfaa;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.characteristic-card-btn:hover {
  border-color: #8b4513;
  background: rgba(139, 69, 19, 0.08);
}

.characteristic-card-btn-edit {
  color: #8b4513;
}

.characteristic-card-btn-remove {
  color: #d9534f;
}

.characteristic-card-btn-remove:hover {
  background: rgba(217, 83, 79, 0.1);
}

/* ===== FILTROS ===== */
.characteristics-filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  align-items: center;
  padding: 10px;
  background: rgba(139, 69, 19, 0.04);
  border-radius: 6px;
}

.characteristics-search {
  flex: 1;
  min-width: 200px;
  padding: 6px 10px;
  border: 1px solid #d4c5b0;
  border-radius: 4px;
  font-family: "MedievalSharp";
  font-size: 12px;
}

.characteristics-search:focus {
  outline: none;
  border-color: #8b4513;
  box-shadow: 0 0 4px rgba(139, 69, 19, 0.2);
}

.characteristics-filter-buttons {
  display: flex;
  gap: 6px;
}

.characteristics-filter-btn {
  padding: 4px 10px;
  background: white;
  border: 1px solid #d4c5b0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-family: "MedievalSharp";
  transition: all 0.2s ease;
}

.characteristics-filter-btn:hover {
  border-color: #8b4513;
  background: #fef8f3;
}

.characteristics-filter-btn.active {
  background: #8b4513;
  color: white;
  border-color: #6b3410;
}

.characteristics-empty {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}

/* ===== MODAL DE EDIÇÃO ===== */
.characteristic-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.characteristic-modal-content {
  background: #f6f2ea;
  border: 2px solid #8b4513;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.characteristic-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e0d0bf;
}

.characteristic-modal-header h3 {
  margin: 0;
  color: #333;
}

.characteristic-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.characteristic-modal-close:hover {
  color: #333;
}

.characteristic-modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

.modal-input-nome,
.modal-input-descricao {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d4c5b0;
  border-radius: 4px;
  font-family: "MedievalSharp";
  font-size: 12px;
  box-sizing: border-box;
}

.modal-input-nome:focus,
.modal-input-descricao:focus {
  outline: none;
  border-color: #8b4513;
  box-shadow: 0 0 4px rgba(139, 69, 19, 0.2);
}

.modal-input-descricao {
  resize: vertical;
  min-height: 100px;
}

.characteristic-modal-footer {
  padding: 15px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  border-top: 1px solid #e0d0bf;
}

.characteristic-modal-btn {
  padding: 6px 15px;
  border: 1px solid #8b4513;
  border-radius: 4px;
  cursor: pointer;
  font-family: "MedievalSharp";
  font-size: 12px;
  transition: all 0.2s ease;
}

.characteristic-modal-btn-cancel {
  background: white;
  color: #8b4513;
}

.characteristic-modal-btn-cancel:hover {
  background: #fef8f3;
}

.characteristic-modal-btn-save {
  background: #8b4513;
  color: white;
  border-color: #6b3410;
}

.characteristic-modal-btn-save:hover {
  background: #6b3410;
}

@media (max-width: 768px) {
  .characteristic-card {
    padding: 10px;
  }

  .characteristic-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .characteristic-card-badge {
    justify-content: flex-start;
  }

  .characteristics-filter-bar {
    flex-direction: column;
  }

  .characteristics-search {
    min-width: 100%;
  }
}
`;

// Export
if (typeof window !== "undefined") {
  window.CharacteristicRenderer = CharacteristicRenderer;
  window.CHARACTERISTIC_CSS = CHARACTERISTIC_CSS;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CharacteristicRenderer, CHARACTERISTIC_CSS };
}
