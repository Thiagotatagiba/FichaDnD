# 🧠 Análise de Arquitetura — Ficha DnD

## 📦 Visão Geral

Sistema monolítico em HTML único contendo:

* UI completa (abas, modais, grids)
* Lógica de negócio (combate, atributos, magias)
* Persistência (JSON)
* Integração com iframe (classe)
* Integração com Electron (window.carregarFicha)
* Scripts inline organizados por responsabilidade
* Sistema de rolagem embutido no HTML (sem dependência externa de `dice-core.js` / `dice-system.js`)

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

## 🔗 Diagrama de Dependências entre Módulos

```plaintext
CORE
 ├─ expõe estado global
 ├─ expõe utilitários base
 └─ é dependência transversal dos demais módulos

DICE CORE
 └─ expõe rolarDado, animarRolagemNoCampo e criarBotaoHistoricoDado

DICE SYSTEM
 └─ depende de DICE CORE

ATRIBUTOS / PROFICIÊNCIAS
 ├─ depende de CORE
 └─ alimenta COMBATE, MAGIAS, VIDA e PERÍCIAS

INVENTÁRIO / EQUIPAMENTOS
 ├─ depende de CORE
 ├─ depende de UTILITÁRIOS
 └─ alimenta COMBATE

COMBATE
 ├─ depende de CORE
 ├─ depende de ATRIBUTOS / PROFICIÊNCIAS
 ├─ depende de INVENTÁRIO / EQUIPAMENTOS
 ├─ depende de DICE CORE
 └─ depende de UI / MODAIS / TABS

MAGIAS
 ├─ depende de CORE
 ├─ depende de ATRIBUTOS / PROFICIÊNCIAS
 ├─ depende de COMBATE
 └─ depende de UI / MODAIS / TABS

CLASSES / LEVEL UP
 ├─ depende de CORE
 ├─ depende de ATRIBUTOS / PROFICIÊNCIAS
 ├─ depende de DICE CORE
 ├─ depende de MAGIAS
 └─ integra com iframe de classe

UI / MODAIS / TABS
 ├─ depende de CORE
 ├─ aciona COMBATE
 ├─ aciona MAGIAS
 ├─ aciona CLASSES / LEVEL UP
 └─ centraliza eventos de tela e modais

IMPORTAÇÃO / EXPORTAÇÃO
 ├─ depende de CORE
 ├─ depende de ATRIBUTOS / PROFICIÊNCIAS
 ├─ depende de INVENTÁRIO / EQUIPAMENTOS
 ├─ depende de COMBATE
 ├─ depende de MAGIAS
 ├─ depende de CLASSES / LEVEL UP
 └─ depende de UI / MODAIS / TABS

INICIALIZAÇÃO APP
 ├─ depende de todos os módulos anteriores
 └─ executa sincronizações e listeners finais
```

---

## ⚠️ Problemas Identificados

* Alto acoplamento com DOM
* Uso de variáveis globais
* [x] Scripts inline massivos foram separados visualmente em blocos por responsabilidade
* Mistura de UI + lógica de negócio
* Override de funções globais
* [x] Baixa separação visual de responsabilidades parcialmente corrigida com múltiplos blocos `<script>`
* [x] Dependência externa de scripts de rolagem removida; conteúdo incorporado ao HTML único

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
* [x] Scripts externos `dice-core.js` e `dice-system.js` incorporados como blocos inline
* [x] Blocos `<script>` separados por responsabilidade no HTML principal
* [x] Ordem crítica de carregamento preservada (`DICE CORE` antes de `DICE SYSTEM`)
* [ ] Mapeamento completo de funções
* [ ] Extração do módulo de combate
* [ ] Separação de atributos
* [ ] Refatoração UI
* [ ] Redução real de acoplamento com DOM
* [ ] Substituição gradual de globais por contratos explícitos

---

## 📝 Observações

* O sistema já possui organização implícita
* Refatoração pode ser incremental
* Não é necessário reescrever tudo
* A ficha permanece intencionalmente como HTML único nesta etapa
* A reorganização atual é estrutural/visual; regras de negócio e nomes globais foram preservados
* Próxima etapa segura: extrair primeiro blocos mais estáveis (`UTILITÁRIOS`, `ATRIBUTOS / PROFICIÊNCIAS`) quando a modularização em `.js` for retomada
