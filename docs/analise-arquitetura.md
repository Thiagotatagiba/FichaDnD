# 🧠 Análise de Arquitetura — Ficha DnD

## 📦 Visão Geral

Sistema monolítico em HTML único contendo:

* UI completa (abas, modais, grids)
* Lógica de negócio (combate, atributos, magias)
* Persistência (JSON)
* Integração com iframe (classe)
* Integração com Electron (window.carregarFicha)

---

## 🧩 Módulos Identificados

### 🔹 Core

* estado global (personagem, combate)
* utilitários (ID, normalização, cálculo base)

### 🔹 Combate

* cálculo de ataque/dano
* bônus de proficiência
* munição
* modal de ataque

### 🔹 Atributos

* cálculo de modificadores
* derivação de atributos

### 🔹 Classe / Level

* carregamento JSON de classe
* level up
* subclasse

### 🔹 Inventário

* armas
* equipamentos
* munição
* renderização de itens

### 🔹 UI

* tabs
* modais
* renderização dinâmica

### 🔹 Integração

* iframe (classe)
* Electron (carregarFicha override)

---

## 🔍 Funções Mapeadas (Resumo)

### Combate

* calcularResumoAtaque
* getResumoCalculoAtaque
* obterMaiorAtributoAtaque
* calcularBonusProf
* consumirMunicao
* atualizarOpcoesMunicao

### Atributos

* calcularModificadorAtributo
* getModificadorBaseAtributo
* calcularModCon

### Classe

* carregarCaracteristicasClasse
* handleClasseChange
* enviarClasseParaCard

### UI / Config

* abrirConfigModal
* fecharConfigModal
* ativarAbaConfig

### Utilitários

* gerarId
* obterMaxDadoVidaFromString

---

## 🔗 Dependências Críticas

* DOM (IDs fixos)
* TALENTOS_CONFIG
* estadoAtaqueArma
* window.carregarFicha (override)

---

## ⚠️ Problemas Identificados

* Alto acoplamento com DOM
* Uso de variáveis globais
* Scripts inline massivos
* Mistura de UI + lógica de negócio
* Override de funções globais
* Baixa separação de responsabilidades

---

## 🏗️ Arquitetura Alvo (Futura)

```plaintext
js/
  app.js
  core/
  combat/
  attributes/
  inventory/
  spells/
  ui/
  integration/
  utils/
```

---

## 📌 Estratégia de Refatoração

1. Extrair módulos independentes primeiro:

   * atributos
   * combate (core)
2. Depois:

   * inventário
   * classe
3. Por último:

   * UI
   * modais

---

## 🚧 Status

* [x] Mapeamento parcial concluído
* [ ] Mapeamento completo de funções
* [ ] Extração do módulo de combate
* [ ] Separação de atributos
* [ ] Refatoração UI

---

## 📝 Observações

* O sistema já possui organização implícita
* Refatoração pode ser incremental
* Não é necessário reescrever tudo
