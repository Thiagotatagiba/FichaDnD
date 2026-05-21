/**
 * CharacteristicStorage.js
 * Camada de persistência para Características de Classe
 * 
 * Responsabilidades:
 * - Ler/escrever dados de características
 * - Validar estrutura e integridade
 * - Migrar dados do formato antigo para novo
 * - Gerenciar versionamento
 */

class CharacteristicStorage {
  static SCHEMA_VERSION = "2.0";
  static MIN_COMPATIBLE_VERSION = "1.0";

  /**
   * Inicializa um novo armazenamento de características
   */
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
    this.migrations = {
      "1.0": this._migrateFrom1_0.bind(this),
    };
  }

  /**
   * Carrega dados de características do JSON
   * @param {Object} jsonData - Dados completos da ficha
   * @returns {Object} Dados estruturados de características
   */
  loadFromJSON(jsonData) {
    if (!jsonData) {
      return this._createEmptyStructure();
    }

    // Verifica se está no novo formato
    if (jsonData.classes && Array.isArray(jsonData.classes)) {
      this._validateStructure(jsonData);
      return jsonData.classes;
    }

    // Se encontrar formato antigo, faz migração automática
    if (jsonData.classeData || jsonData.subclasseData || jsonData.classeNomeID) {
      console.log("[CharacteristicStorage] Detectado formato antigo, iniciando migração");
      return this._migrateFromLegacy(jsonData);
    }

    return this._createEmptyStructure();
  }

  /**
   * Salva características no formato JSON correto
   * @param {Array} classesData - Array de características por classe
   * @param {Object} existingData - Dados existentes para manter outros campos
   * @returns {Object} JSON completo para salvar
   */
  saveToJSON(classesData, existingData = {}) {
    if (!Array.isArray(classesData)) {
      console.warn("[CharacteristicStorage] classesData não é array");
      classesData = [];
    }

    // Valida cada classe antes de salvar
    classesData.forEach(cls => this._validateClass(cls));

    const estrutura = {
      classes: classesData,
      _metadata: {
        schemaVersion: CharacteristicStorage.SCHEMA_VERSION,
        lastSaved: new Date().toISOString(),
        dataChecksum: this._calculateChecksum(classesData)
      }
    };

    return estrutura;
  }

  /**
   * Obtém características de uma classe específica
   * @param {Array} classesData - Dados de classes
   * @param {String} classeName - Nome da classe
   * @returns {Object|null} Dados da classe ou null
   */
  getClassData(classesData, classeName) {
    if (!Array.isArray(classesData)) return null;

    return classesData.find(cls =>
      cls.nome?.toLowerCase() === classeName?.toLowerCase()
    ) || null;
  }

  /**
   * Cria ou atualiza dados de uma classe
   * @param {Array} classesData - Array de características
   * @param {String} className - Nome da classe
   * @param {Object} updates - Atualizações a aplicar
   * @returns {Array} Array atualizado
   */
  updateClassData(classesData, className, updates) {
    if (!Array.isArray(classesData)) classesData = [];

    let classData = this.getClassData(classesData, className);

    if (!classData) {
      classData = this._createNewClass(className);
      classesData.push(classData);
    }

    // Mescla atualizações
    Object.assign(classData, updates);
    classData.metadata.ultimaSincronizacao = new Date().toISOString();

    return classesData;
  }

  /**
   * Adiciona característica manual a uma classe
   * @param {Array} classesData - Array de características
   * @param {String} className - Nome da classe
   * @param {Object} characteristic - Característica a adicionar
   * @returns {Array} Array atualizado
   */
  addManualCharacteristic(classesData, className, characteristic) {
    let classData = this.getClassData(classesData, className);

    if (!classData) {
      classData = this._createNewClass(className);
      classesData.push(classData);
    }

    if (!Array.isArray(classData.caracteristicasManuais)) {
      classData.caracteristicasManuais = [];
    }

    // Gera ID único se não tiver
    if (!characteristic.id) {
      characteristic.id = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    characteristic.criadoEm = characteristic.criadoEm || new Date().toISOString();
    classData.caracteristicasManuais.push(characteristic);

    return classesData;
  }

  /**
   * Remove característica manual
   * @param {Array} classesData - Array de características
   * @param {String} className - Nome da classe
   * @param {String} characteristicId - ID da característica
   * @returns {Array} Array atualizado
   */
  removeManualCharacteristic(classesData, className, characteristicId) {
    const classData = this.getClassData(classesData, className);

    if (classData && Array.isArray(classData.caracteristicasManuais)) {
      classData.caracteristicasManuais = classData.caracteristicasManuais.filter(
        c => c.id !== characteristicId
      );
    }

    return classesData;
  }

  /**
   * Atualiza características automáticas (recalcula por classe/nível/subclasse)
   * @param {Array} classesData - Array de características
   * @param {String} className - Nome da classe
   * @param {Array} automaticCharacteristics - Novas características
   * @returns {Array} Array atualizado
   */
  updateAutomaticCharacteristics(classesData, className, automaticCharacteristics) {
    let classData = this.getClassData(classesData, className);

    if (!classData) {
      classData = this._createNewClass(className);
      classesData.push(classData);
    }

    // Calcula hash para detectar mudanças
    const novoHash = this._calculateChecksum(automaticCharacteristics);
    const hashAnterior = classData.metadata?.ultimoHashAutomaticas;

    classData.caracteristicasAutomaticas = automaticCharacteristics.map(c => ({
      ...c,
      syncHash: novoHash
    }));

    classData.metadata.ultimoHashAutomaticas = novoHash;
    classData.metadata.ultimaSincronizacao = new Date().toISOString();

    return classesData;
  }

  /**
   * Mescla características automáticas e manuais
   * @param {Object} classData - Dados da classe
   * @returns {Array} Array mesclado (automáticas + manuais)
   */
  mergeCharacteristics(classData) {
    if (!classData) return [];

    const automaticas = Array.isArray(classData.caracteristicasAutomaticas) 
      ? classData.caracteristicasAutomaticas 
      : [];
    const manuais = Array.isArray(classData.caracteristicasManuais) 
      ? classData.caracteristicasManuais 
      : [];

    return [...automaticas, ...manuais];
  }

  /**
   * Valida integridade dos dados
   * @param {Object} jsonData - Dados a validar
   * @throws {Error} Se há problemas na estrutura
   */
  _validateStructure(jsonData) {
    if (!jsonData.classes) {
      console.warn("[CharacteristicStorage] Estrutura sem 'classes'");
      return;
    }

    jsonData.classes.forEach((cls, idx) => {
      try {
        this._validateClass(cls);
      } catch (e) {
        console.warn(`[CharacteristicStorage] Classe ${idx} inválida:`, e.message);
      }
    });
  }

  /**
   * Valida dados de uma classe específica
   * @param {Object} cls - Dados da classe
   * @throws {Error} Se há problemas
   */
  _validateClass(cls) {
    if (!cls.nome) {
      throw new Error("Classe deve ter 'nome'");
    }

    if (cls.caracteristicasAutomaticas && !Array.isArray(cls.caracteristicasAutomaticas)) {
      throw new Error("caracteristicasAutomaticas deve ser array");
    }

    if (cls.caracteristicasManuais && !Array.isArray(cls.caracteristicasManuais)) {
      throw new Error("caracteristicasManuais deve ser array");
    }

    // Valida unicidade de IDs
    const ids = [
      ...(cls.caracteristicasAutomaticas || []).map(c => c.id),
      ...(cls.caracteristicasManuais || []).map(c => c.id)
    ];
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
      console.warn(`[CharacteristicStorage] Classe ${cls.nome} tem IDs duplicados`);
    }
  }

  /**
   * Migra dados do formato legado
   * @param {Object} jsonData - Dados no formato antigo
   * @returns {Array} Dados convertidos para novo formato
   */
  _migrateFromLegacy(jsonData) {
    try {
      const classes = [];

      // Identifica classe
      const className = jsonData.classeNomeID || jsonData.classeID || "Desconhecido";
      const nivel = parseInt(jsonData.classeNivelID) || 1;
      const subclasse = jsonData.subclasse || null;

      const classEntry = this._createNewClass(className);
      classEntry.nivel = nivel;
      if (subclasse) classEntry.subclasse = subclasse;

      // Converte dados antigos
      if (jsonData.classeData) {
        try {
          const oldData = typeof jsonData.classeData === "string"
            ? JSON.parse(jsonData.classeData)
            : jsonData.classeData;

          if (oldData.features) {
            classEntry.caracteristicasAutomaticas = oldData.features.map(f => ({
              id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              nome: f.name,
              descricao: f.desc,
              origem: f.categoria || "classe",
              nivel: f.level || 1
            }));
          }
        } catch (e) {
          console.warn("[CharacteristicStorage] Erro ao converter classeData:", e);
        }
      }

      // Se tinha características em campo de texto, preserva como manual
      if (jsonData.talentoClasse && jsonData.talentoClasse.trim()) {
        classEntry.caracteristicasManuais.push({
          id: `manual_legado_${Date.now()}`,
          nome: "Importado do Formato Anterior",
          descricao: jsonData.talentoClasse,
          criadoEm: new Date().toISOString()
        });
      }

      classes.push(classEntry);
      console.log("[CharacteristicStorage] Migração concluída:", classEntry);

      return classes;
    } catch (e) {
      console.error("[CharacteristicStorage] Erro em migração:", e);
      return [this._createNewClass("Migração Falhou")];
    }
  }

  /**
   * Migra dados de versão 1.0
   * @param {Object} jsonData - Dados em v1.0
   * @returns {Array} Dados convertidos
   */
  _migrateFrom1_0(jsonData) {
    return this._migrateFromLegacy(jsonData);
  }

  /**
   * Cria estrutura vazia
   * @returns {Array} Array vazio de classes
   */
  _createEmptyStructure() {
    return [];
  }

  /**
   * Cria entrada de classe nova
   * @param {String} className - Nome da classe
   * @returns {Object} Estrutura de classe
   */
  _createNewClass(className) {
    return {
      id: `${className.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
      nome: className,
      nivel: 1,
      subclasse: null,
      caracteristicasAutomaticas: [],
      caracteristicasManuais: [],
      metadata: {
        criadoEm: new Date().toISOString(),
        ultimaSincronizacao: new Date().toISOString(),
        versaoSchema: CharacteristicStorage.SCHEMA_VERSION,
        ultimoHashAutomaticas: null
      }
    };
  }

  /**
   * Calcula checksum de dados para detectar mudanças
   * @param {any} data - Dados a verificar
   * @returns {String} Checksum
   */
  _calculateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converte para 32bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Registra listener para mudanças
   * @param {String} event - Nome do evento
   * @param {Function} callback - Função a chamar
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
   * Dispara evento
   * @param {String} event - Nome do evento
   * @param {any} data - Dados do evento
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[CharacteristicStorage] Erro em listener de ${event}:`, e);
        }
      });
    }
  }
}

// Export para uso global
if (typeof window !== "undefined") {
  window.CharacteristicStorage = CharacteristicStorage;
}

// Export para Node.js/módulos
if (typeof module !== "undefined" && module.exports) {
  module.exports = CharacteristicStorage;
}
