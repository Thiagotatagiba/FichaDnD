/**
 * ClassManager.js
 * Gerenciador de dados de classe para D&D
 * 
 * Responsabilidades:
 * - Carregar dados de classe do JSON
 * - Filtrar características por nível
 * - Gerenciar hierarquia classe/subclasse
 */

class ClassManager {
  constructor() {
    this.classesCache = new Map();
    this.lastLoadTime = 0;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Carrega dados de uma classe do arquivo JSON
   * @param {String} className - Nome da classe (ex: "Clérigo")
   * @returns {Promise<Object>} Dados da classe
   */
  async loadClassData(className) {
    // Verifica cache
    const cached = this.classesCache.get(className);
    if (cached && (Date.now() - this.lastLoadTime) < this.CACHE_DURATION) {
      return cached;
    }

    try {
      const normalizado = className.toLowerCase().replace(/\s+/g, "_");
      const caminho = `./Classes/caracteristica_${normalizado}.json`;

      const response = await fetch(caminho);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this._validateClassData(data);
      this.classesCache.set(className, data);
      this.lastLoadTime = Date.now();

      return data;
    } catch (error) {
      console.error(`[ClassManager] Erro carregando ${className}:`, error);
      throw new Error(`Não foi possível carregar a classe ${className}`);
    }
  }

  /**
   * Obtém características de uma classe filtradas por nível
   * @param {Object} classData - Dados da classe
   * @param {Number} nivel - Nível do personagem
   * @returns {Array} Características até esse nível
   */
  getFeaturesByLevel(classData, nivel = 1) {
    if (!classData || !classData.features) return [];

    return classData.features
      .filter(f => (f.level || 1) <= nivel)
      .sort((a, b) => (a.level || 1) - (b.level || 1));
  }

  /**
   * Obtém características de subclasse/arquétipo
   * @param {Object} classData - Dados da classe
   * @param {String} subclasseName - Nome do arquétipo (ex: "totem")
   * @param {Number} nivel - Nível do personagem
   * @returns {Array} Características da subclasse
   */
  getSubclassFeatures(classData, subclasseName, nivel = 1) {
    if (!classData || !classData.subclasses || !subclasseName) return [];

    const chave = this._normalizarChaveSubclasse(subclasseName, classData);
    if (!chave || !classData.subclasses[chave]) return [];

    return classData.subclasses[chave]
      .filter(f => (f.level || 1) <= nivel)
      .sort((a, b) => (a.level || 1) - (b.level || 1));
  }

  /**
   * Obtém todas as características (classe + subclasse) para um nível
   * @param {Object} classData - Dados da classe
   * @param {Number} nivel - Nível
   * @param {String} subclasse - Subclasse (opcional)
   * @returns {Array} Todas as características
   */
  getAllFeaturesForLevel(classData, nivel = 1, subclasse = null) {
    const features = [];

    const classeFeatures = this.getFeaturesByLevel(classData, nivel);
    features.push(...classeFeatures.map(f => ({
      ...f,
      categoria: f.categoria || "classe"
    })));

    if (subclasse) {
      const subFeatures = this.getSubclassFeatures(classData, subclasse, nivel);
      features.push(...subFeatures.map(f => ({
        ...f,
        categoria: f.categoria || "arquetipo"
      })));
    }

    return features;
  }

  /**
   * Lista todas as subclasses disponíveis para uma classe
   * @param {Object} classData - Dados da classe
   * @returns {Array} Nomes dos arquétipos
   */
  getAvailableSubclasses(classData) {
    if (!classData || !classData.subclasses) return [];

    return Object.keys(classData.subclasses);
  }

  /**
   * Valida estrutura de dados de classe
   * @param {Object} classData - Dados a validar
   * @throws {Error} Se inválido
   */
  _validateClassData(classData) {
    if (!classData || typeof classData !== "object") {
      throw new Error("Dados de classe devem ser um objeto");
    }

    if (!classData.classe) {
      throw new Error("Dados de classe devem ter campo 'classe'");
    }

    if (!Array.isArray(classData.features)) {
      throw new Error("Dados de classe devem ter array 'features'");
    }

    // Valida cada feature
    classData.features.forEach((f, idx) => {
      if (!f.name) throw new Error(`Feature ${idx} sem 'name'`);
      if (!f.desc) throw new Error(`Feature ${idx} sem 'desc'`);
    });
  }

  /**
   * Normaliza chave de subclasse
   * @param {String} valor - Valor a normalizar
   * @param {Object} classData - Dados da classe para consultar chaves válidas
   * @returns {String} Chave normalizada ou null
   */
  _normalizarChaveSubclasse(valor, classData) {
    if (!valor || !classData?.subclasses) return null;

    const valNormalizado = valor.toLowerCase().replace(/\s+/g, "");

    // Busca correspondência exata
    const chave = Object.keys(classData.subclasses).find(
      k => k.toLowerCase().replace(/\s+/g, "") === valNormalizado
    );

    return chave || null;
  }

  /**
   * Limpa cache
   */
  clearCache() {
    this.classesCache.clear();
  }
}

/**
 * CharacteristicManager.js
 * Gerenciador de características (automáticas, manuais, mesclagem)
 */

class CharacteristicManager {
  constructor() {
    this.idCounter = 0;
  }

  /**
   * Obtém características automáticas de uma classe
   * @param {Object} classData - Dados da classe do ClassManager
   * @param {Number} nivel - Nível do personagem
   * @param {String} subclasse - Nome da subclasse
   * @param {String} className - Nome da classe
   * @returns {Array} Características automáticas formatadas
   */
  getAutomaticCharacteristics(classData, nivel, subclasse, className) {
    const characteristics = [];

    if (!classData) return characteristics;

    // Características da classe
    const classFeatures = (classData.features || [])
      .filter(f => (f.level || 1) <= nivel);

    characteristics.push(...classFeatures.map(f => ({
      id: `auto_${className.toLowerCase()}_${f.name.toLowerCase().replace(/\s+/g, "_")}`,
      nome: f.name,
      descricao: f.desc,
      origem: "classe",
      nivel: f.level || 1,
      categoria: f.categoria || "classe"
    })));

    // Características da subclasse
    if (subclasse && classData.subclasses) {
      const chaveSub = Object.keys(classData.subclasses).find(
        k => k.toLowerCase() === subclasse.toLowerCase()
      );

      if (chaveSub) {
        const subFeatures = (classData.subclasses[chaveSub] || [])
          .filter(f => (f.level || 1) <= nivel);

        characteristics.push(...subFeatures.map(f => ({
          id: `auto_${className.toLowerCase()}_sub_${f.name.toLowerCase().replace(/\s+/g, "_")}`,
          nome: f.name,
          descricao: f.desc,
          origem: "subclasse",
          nivel: f.level || 1,
          categoria: f.categoria || "arquetipo"
        })));
      }
    }

    return characteristics;
  }

  /**
   * Obtém características manuais de um armazenamento
   * @param {Array} manuais - Array de características manuais
   * @returns {Array} Características manuais processadas
   */
  getManualCharacteristics(manuais) {
    if (!Array.isArray(manuais)) return [];

    return manuais.map(m => ({
      ...m,
      origem: "manual",
      id: m.id || `manual_${Date.now()}`
    }));
  }

  /**
   * Mescla características automáticas e manuais
   * Características manuais nunca são sobrescritas
   * @param {Array} automatic - Características automáticas
   * @param {Array} manual - Características manuais
   * @returns {Array} Array mesclado
   */
  mergeCharacteristics(automatic, manual) {
    const merged = [...(automatic || [])];

    // Adiciona manuais que não conflitam
    (manual || []).forEach(m => {
      // Manuais sempre são adicionados (nunca removidas automaticamente)
      merged.push(m);
    });

    return merged;
  }

  /**
   * Valida se não há duplicação de características
   * @param {Array} characteristics - Array de características
   * @returns {Object} {valid: boolean, duplicates: Array}
   */
  validateNoDuplicates(characteristics) {
    const ids = characteristics.map(c => c.id);
    const names = characteristics.map(c => c.nome);

    const duplicateIds = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    const duplicateNames = names.filter((n, idx) => names.indexOf(n) !== idx);

    return {
      valid: duplicateIds.length === 0 && duplicateNames.length === 0,
      duplicateIds,
      duplicateNames
    };
  }

  /**
   * Remove características automáticas antigas (on class change)
   * @param {Array} allCharacteristics - Todas as características
   * @param {String} oldClass - Classe anterior
   * @returns {Array} Características filtradas (manuais + de outras origens)
   */
  removeOldClassCharacteristics(allCharacteristics, oldClass) {
    return (allCharacteristics || []).filter(c => {
      // Remove apenas automáticas da classe antiga
      if (c.origem === "classe" && c.id?.includes(oldClass.toLowerCase())) {
        return false;
      }
      // Mantém manuais, de subclasses, raça, antecedente
      return true;
    });
  }

  /**
   * Gera ID único para nova característica manual
   * @param {String} baseName - Nome base
   * @returns {String} ID único
   */
  generateUniqueId(baseName) {
    this.idCounter++;
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${baseName.toLowerCase().replace(/\s+/g, "_")}_${timestamp}_${random}`;
  }
}

/**
 * SyncEngine.js
 * Motor de sincronização automática
 */

class SyncEngine {
  constructor(classManager, characteristicManager, storage) {
    this.classManager = classManager;
    this.characteristicManager = characteristicManager;
    this.storage = storage;

    this.listeners = new Map();
    this.isSyncing = false;
    this.syncQueue = [];
  }

  /**
   * Sincroniza quando classe muda
   * @param {Object} params - {className, nivel, subclasse, currentData, storage}
   * @returns {Promise<Object>} Dados atualizados
   */
  async syncOnClassChange(params) {
    const {
      className,
      nivel = 1,
      subclasse = null,
      currentData = [],
      storage = this.storage
    } = params;

    if (this.isSyncing) {
      return this.syncQueue.push(() => this.syncOnClassChange(params));
    }

    this.isSyncing = true;

    try {
      console.log("[SyncEngine] Sincronizando classe:", { className, nivel, subclasse });

      // Carrega dados da classe
      const classData = await this.classManager.loadClassData(className);

      // Obtém características automáticas
      const automatic = this.characteristicManager.getAutomaticCharacteristics(
        classData,
        nivel,
        subclasse,
        className
      );

      // Obtém características manuais existentes
      const classEntry = storage.getClassData(currentData, className);
      const manuais = classEntry
        ? this.characteristicManager.getManualCharacteristics(classEntry.caracteristicasManuais)
        : [];

      // Atualiza armazenamento
      let updatedData = storage.updateClassData(currentData, className, {
        nivel,
        subclasse: subclasse || null
      });

      updatedData = storage.updateAutomaticCharacteristics(
        updatedData,
        className,
        automatic
      );

      // Valida mesclagem
      const merged = this.characteristicManager.mergeCharacteristics(automatic, manuais);
      const validation = this.characteristicManager.validateNoDuplicates(merged);

      if (!validation.valid) {
        console.warn("[SyncEngine] Duplicação detectada:", validation);
      }

      // Emite evento de sincronização
      this.emit("classChanged", {
        className,
        nivel,
        subclasse,
        automatic,
        manuais,
        merged
      });

      return updatedData;
    } catch (error) {
      console.error("[SyncEngine] Erro sincronizando classe:", error);
      this.emit("syncError", { error, context: "classChange" });
      throw error;
    } finally {
      this.isSyncing = false;
      this._processQueue();
    }
  }

  /**
   * Sincroniza quando nível muda
   * @param {Object} params - {className, novoNivel, currentData}
   * @returns {Promise<Object>} Dados atualizados
   */
  async syncOnLevelChange(params) {
    const { className, novoNivel, currentData = [] } = params;

    try {
      console.log("[SyncEngine] Nível alterado:", { className, novoNivel });

      const classEntry = this.storage.getClassData(currentData, className);
      if (!classEntry) {
        console.warn("[SyncEngine] Classe não encontrada para sincronização de nível");
        return currentData;
      }

      // Recarrega características automáticas com novo nível
      const classData = await this.classManager.loadClassData(className);
      const novasAutomaticas = this.characteristicManager.getAutomaticCharacteristics(
        classData,
        novoNivel,
        classEntry.subclasse,
        className
      );

      let updatedData = this.storage.updateClassData(currentData, className, {
        nivel: novoNivel
      });

      updatedData = this.storage.updateAutomaticCharacteristics(
        updatedData,
        className,
        novasAutomaticas
      );

      this.emit("levelChanged", {
        className,
        novoNivel,
        automatic: novasAutomaticas
      });

      return updatedData;
    } catch (error) {
      console.error("[SyncEngine] Erro sincronizando nível:", error);
      throw error;
    }
  }

  /**
   * Sincroniza quando subclasse muda
   * @param {Object} params - {className, novaSubclasse, currentData}
   * @returns {Promise<Object>} Dados atualizados
   */
  async syncOnSubclassChange(params) {
    const { className, novaSubclasse, currentData = [] } = params;

    try {
      console.log("[SyncEngine] Subclasse alterada:", { className, novaSubclasse });

      const classEntry = this.storage.getClassData(currentData, className);
      if (!classEntry) {
        console.warn("[SyncEngine] Classe não encontrada");
        return currentData;
      }

      // Recarrega com nova subclasse
      const classData = await this.classManager.loadClassData(className);
      const novasAutomaticas = this.characteristicManager.getAutomaticCharacteristics(
        classData,
        classEntry.nivel,
        novaSubclasse,
        className
      );

      let updatedData = this.storage.updateClassData(currentData, className, {
        subclasse: novaSubclasse || null
      });

      updatedData = this.storage.updateAutomaticCharacteristics(
        updatedData,
        className,
        novasAutomaticas
      );

      this.emit("subclassChanged", {
        className,
        novaSubclasse,
        automatic: novasAutomaticas
      });

      return updatedData;
    } catch (error) {
      console.error("[SyncEngine] Erro sincronizando subclasse:", error);
      throw error;
    }
  }

  /**
   * Registra listener para evento de sincronização
   * @param {String} event - Nome do evento
   * @param {Function} callback - Função callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove listener
   * @param {String} event - Nome do evento
   * @param {Function} callback - Função a remover
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const idx = callbacks.indexOf(callback);
      if (idx >= 0) callbacks.splice(idx, 1);
    }
  }

  /**
   * Emite evento
   * @param {String} event - Nome do evento
   * @param {any} data - Dados do evento
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[SyncEngine] Erro em listener de ${event}:`, e);
        }
      });
    }
  }

  /**
   * Processa fila de sincronização
   */
  _processQueue() {
    if (this.syncQueue.length > 0 && !this.isSyncing) {
      const next = this.syncQueue.shift();
      next();
    }
  }
}

// Exports
if (typeof window !== "undefined") {
  window.ClassManager = ClassManager;
  window.CharacteristicManager = CharacteristicManager;
  window.SyncEngine = SyncEngine;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ClassManager,
    CharacteristicManager,
    SyncEngine
  };
}
