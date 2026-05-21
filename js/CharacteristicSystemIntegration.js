/**
 * CharacteristicSystemIntegration.js
 * Integração do novo sistema de características com a ficha
 * 
 * Responsabilidades:
 * - Inicializar todos os componentes
 * - Conectar eventos da ficha
 * - Sincronizar automaticamente
 * - Persistir dados
 */

class CharacteristicSystemIntegration {
  constructor() {
    // Inicializa componentes
    this.storage = new CharacteristicStorage();
    this.classManager = new ClassManager();
    this.characteristicManager = new CharacteristicManager();
    this.syncEngine = new SyncEngine(
      this.classManager,
      this.characteristicManager,
      this.storage
    );

    // Renderers para diferentes categorias
    this.renderers = new Map();

    // Estado interno
    this.currentData = [];
    this.isInitialized = false;
  }

  /**
   * Inicializa o sistema
   * @param {Object} options - Opções de inicialização
   */
  initialize(options = {}) {
    try {
      console.log("[CharacteristicSystem] Inicializando sistema...");

      // Injeta CSS
      this._injectCSS();

      // Cria renderers
      this._setupRenderers();

      // Conecta eventos
      this._setupEventListeners();

      // Sincroniza listeners
      this._setupSyncListeners();

      // Carrega dados iniciais
      const initialData = options.initialData || [];
      this.currentData = initialData;

      this.isInitialized = true;
      console.log("[CharacteristicSystem] Sistema inicializado com sucesso");
    } catch (error) {
      console.error("[CharacteristicSystem] Erro inicializando:", error);
    }
  }

  /**
   * Carrega dados de uma ficha
   * @param {Object} fichaData - Dados completos da ficha
   */
  loadFromFicha(fichaData) {
    try {
      console.log("[CharacteristicSystem] Carregando dados de ficha...");

      // Carrega com migração automática
      this.currentData = this.storage.loadFromJSON(fichaData);

      // Renderiza tudo
      this._renderAll();

      console.log("[CharacteristicSystem] Dados carregados:", this.currentData);
    } catch (error) {
      console.error("[CharacteristicSystem] Erro carregando ficha:", error);
    }
  }

  /**
   * Salva dados para ficha
   * @returns {Object} Dados formatados para salvar
   */
  saveToFicha() {
    try {
      const saveData = this.storage.saveToJSON(this.currentData);
      console.log("[CharacteristicSystem] Dados salvos:", saveData);
      return saveData;
    } catch (error) {
      console.error("[CharacteristicSystem] Erro salvando:", error);
      return {};
    }
  }

  /**
   * Sincroniza ao mudar classe
   * @param {String} className - Nome da classe
   * @param {Number} nivel - Nível
   * @param {String} subclasse - Subclasse
   */
  async syncClassChange(className, nivel = 1, subclasse = null) {
    try {
      console.log("[CharacteristicSystem] Sincronizando classe:", {
        className,
        nivel,
        subclasse
      });

      this.currentData = await this.syncEngine.syncOnClassChange({
        className,
        nivel,
        subclasse,
        currentData: this.currentData,
        storage: this.storage
      });

      this._renderAll();
    } catch (error) {
      console.error("[CharacteristicSystem] Erro sincronizando classe:", error);
    }
  }

  /**
   * Sincroniza ao mudar nível
   * @param {String} className - Nome da classe
   * @param {Number} novoNivel - Novo nível
   */
  async syncLevelChange(className, novoNivel) {
    try {
      console.log("[CharacteristicSystem] Sincronizando nível:", {
        className,
        novoNivel
      });

      this.currentData = await this.syncEngine.syncOnLevelChange({
        className,
        novoNivel,
        currentData: this.currentData
      });

      this._renderAll();
    } catch (error) {
      console.error("[CharacteristicSystem] Erro sincronizando nível:", error);
    }
  }

  /**
   * Sincroniza ao mudar subclasse
   * @param {String} className - Nome da classe
   * @param {String} novaSubclasse - Nova subclasse
   */
  async syncSubclassChange(className, novaSubclasse) {
    try {
      console.log("[CharacteristicSystem] Sincronizando subclasse:", {
        className,
        novaSubclasse
      });

      this.currentData = await this.syncEngine.syncOnSubclassChange({
        className,
        novaSubclasse,
        currentData: this.currentData
      });

      this._renderAll();
    } catch (error) {
      console.error("[CharacteristicSystem] Erro sincronizando subclasse:", error);
    }
  }

  /**
   * Adiciona característica manual
   * @param {String} className - Nome da classe
   * @param {Object} characteristic - Dados da característica
   */
  addManualCharacteristic(className, characteristic) {
    try {
      this.currentData = this.storage.addManualCharacteristic(
        this.currentData,
        className,
        characteristic
      );

      this._renderAll();
      console.log("[CharacteristicSystem] Característica manual adicionada");
    } catch (error) {
      console.error("[CharacteristicSystem] Erro adicionando característica:", error);
    }
  }

  /**
   * Remove característica manual
   * @param {String} className - Nome da classe
   * @param {String} characteristicId - ID da característica
   */
  removeManualCharacteristic(className, characteristicId) {
    try {
      this.currentData = this.storage.removeManualCharacteristic(
        this.currentData,
        className,
        characteristicId
      );

      this._renderAll();
      console.log("[CharacteristicSystem] Característica removida");
    } catch (error) {
      console.error("[CharacteristicSystem] Erro removendo característica:", error);
    }
  }

  /**
   * Atualiza característica manual
   * @param {String} className - Nome da classe
   * @param {Object} characteristic - Dados atualizados
   */
  updateManualCharacteristic(className, characteristic) {
    try {
      const classData = this.storage.getClassData(this.currentData, className);
      if (classData && classData.caracteristicasManuais) {
        const idx = classData.caracteristicasManuais.findIndex(
          c => c.id === characteristic.id
        );
        if (idx >= 0) {
          classData.caracteristicasManuais[idx] = characteristic;
        }
      }

      this._renderAll();
      console.log("[CharacteristicSystem] Característica atualizada");
    } catch (error) {
      console.error("[CharacteristicSystem] Erro atualizando característica:", error);
    }
  }

  /**
   * Configura renderers para cada categoria
   */
  _setupRenderers() {
    const categorias = [
      { id: "talentoClasseLista", name: "Classe" },
      { id: "talentoArquetipoLista", name: "Subclasse" },
      { id: "talentoRacaLista", name: "Raça" },
      { id: "talentoAntecedenteLista", name: "Antecedente" }
    ];

    categorias.forEach(cat => {
      const renderer = new CharacteristicRenderer(cat.id);
      this.renderers.set(cat.name.toLowerCase(), renderer);
    });
  }

  /**
   * Conecta event listeners da ficha
   */
  _setupEventListeners() {
    const classeInput = document.getElementById("classeNomeID");
    const nivelInput = document.getElementById("classeNivelID");
    const subclasseInput = document.getElementById("subclasse");

    if (classeInput) {
      classeInput.addEventListener("change", (e) => {
        this.syncClassChange(
          e.target.value,
          parseInt(nivelInput?.value) || 1,
          subclasseInput?.value
        );
      });
    }

    if (nivelInput) {
      nivelInput.addEventListener("input", (e) => {
        this.syncLevelChange(
          classeInput?.value,
          parseInt(e.target.value) || 1
        );
      });
    }

    if (subclasseInput) {
      subclasseInput.addEventListener("change", (e) => {
        this.syncSubclassChange(classeInput?.value, e.target.value);
      });
    }
  }

  /**
   * Configura listeners de sincronização
   */
  _setupSyncListeners() {
    this.syncEngine.on("classChanged", (data) => {
      console.log("[CharacteristicSystem] Classe mudou:", data);
    });

    this.syncEngine.on("levelChanged", (data) => {
      console.log("[CharacteristicSystem] Nível mudou:", data);
    });

    this.syncEngine.on("subclassChanged", (data) => {
      console.log("[CharacteristicSystem] Subclasse mudou:", data);
    });

    this.syncEngine.on("syncError", (data) => {
      console.error("[CharacteristicSystem] Erro de sincronização:", data);
    });
  }

  /**
   * Renderiza todas as características
   */
  _renderAll() {
    if (!this.isInitialized) return;

    // Para cada classe, renderiza suas características
    this.currentData.forEach(classData => {
      const characteristics = this.storage.mergeCharacteristics(classData);
      const renderer = this.renderers.get("classe");

      if (renderer) {
        renderer.render(characteristics, {
          onEdit: (char) => this._handleEditCharacteristic(classData.nome, char),
          onRemove: (charId) => this._handleRemoveCharacteristic(classData.nome, charId),
          editable: true
        });
      }
    });
  }

  /**
   * Manipulador para editar característica
   * @param {String} className - Nome da classe
   * @param {Object} characteristic - Característica
   */
  _handleEditCharacteristic(className, characteristic) {
    const renderer = this.renderers.get("classe");
    if (!renderer) return;

    const modal = renderer.createEditModal(characteristic, (updated) => {
      this.updateManualCharacteristic(className, updated);
    });

    document.body.appendChild(modal);
  }

  /**
   * Manipulador para remover característica
   * @param {String} className - Nome da classe
   * @param {String} characteristicId - ID da característica
   */
  _handleRemoveCharacteristic(className, characteristicId) {
    this.removeManualCharacteristic(className, characteristicId);
  }

  /**
   * Injeta CSS no documento
   */
  _injectCSS() {
    if (document.getElementById("characteristic-css")) return;

    const style = document.createElement("style");
    style.id = "characteristic-css";
    style.textContent = window.CHARACTERISTIC_CSS || "";
    document.head.appendChild(style);
  }
}

// Instância global
window.characteristicSystem = null;

/**
 * Inicializa o sistema após o DOM estar pronto
 */
function initializeCharacteristicSystem(options = {}) {
  if (window.characteristicSystem && window.characteristicSystem.isInitialized) {
    console.log("[CharacteristicSystem] Sistema já inicializado");
    return window.characteristicSystem;
  }

  window.characteristicSystem = new CharacteristicSystemIntegration();
  window.characteristicSystem.initialize(options);

  return window.characteristicSystem;
}

// Exporta
if (typeof window !== "undefined") {
  window.CharacteristicSystemIntegration = CharacteristicSystemIntegration;
  window.initializeCharacteristicSystem = initializeCharacteristicSystem;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CharacteristicSystemIntegration,
    initializeCharacteristicSystem
  };
}

// Auto-inicializa quando DOM está pronto
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initializeCharacteristicSystem();
    });
  } else {
    initializeCharacteristicSystem();
  }
}
