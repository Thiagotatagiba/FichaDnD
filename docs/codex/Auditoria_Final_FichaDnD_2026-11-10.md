# Relatório de Auditoria Técnica — Ficha D&D 5e (2014)

**Projeto:** Ficha de RPG — HTML<br>
**Repositório:** [Thiagotatagiba/FichaDnD](https://github.com/Thiagotatagiba/FichaDnD)<br>
**Data de encerramento:** 10/11/2026<br>
**Abrangência:** auditoria em 60 fases<br>
**Estado:** auditoria concluída; implementação não iniciada
**Natureza:** inspeção de código e documentação; sem alterações nos arquivos do projeto.

## 1. Resumo executivo

A aplicação possui uma base funcional aproveitável, com módulos por área, catálogos JSON, mecanismos de compatibilidade com fichas antigas, histórico de combate e testes automatizados para partes do sistema. **Recomenda-se evolução incremental, sem reescrita integral.**

O risco central é a fragmentação de regras e estados entre elementos do DOM, variáveis globais e funções de múltiplas responsabilidades. Antes da reformulação visual do combate, é necessário proteger os dados, corrigir regras mecânicas e centralizar o gerenciamento de recursos e efeitos.

**Princípios de aceite:** (1) preservar dados personalizados; (2) aplicar consistentemente D&D 5e (2014), sem regras próprias não aprovadas; (3) evitar duplicação de cálculos e estados; (4) validar regressões antes de cada entrega.

## 2. Escopo e método

A auditoria examinou os fluxos de persistência, importação e exportação, evolução de personagem, classes e subclasses, características, magias, combate, condições, concentração, dano, equipamentos, interface, modais e testes. As fases finais (56–60) consolidaram modais, persistência, testes, prioridades e plano de implementação.

**Limitações:** os achados derivam de inspeção de código e de registros de testes existentes. A fase 58 não executou nova suíte automatizada. Nem toda ausência de funcionalidade foi comprovada por busca exaustiva. Resultados históricos de testes não equivalem a aprovação da versão atual. A estrutura de munições está em evolução e o JSON exclusivo de poções ainda será definido.

## 3. Inventário consolidado dos achados

| ID | Área | Achado | Impacto | Prioridade |
|---|---|---|---|---|
| A-01 | Importação | `aplicarDadosFicha()` modifica DOM e estado global em etapas, sem rollback transacional. | Estado parcial após falha. | Crítica |
| A-02 | Características | `salvarModalTalento()` reconstrói o objeto e pode descartar metadados adicionais. | Perda de personalizações e futuros campos. | Crítica |
| A-03 | Exportação | `salvarFicha()` marca a ficha como salva após iniciar o download, sem confirmar a gravação efetiva. | Falsa percepção de segurança. | Alta |
| A-04 | PV | `aplicarDanoNoPV` subtrai PV regulares sem consumir primeiro PV temporários. | Dano aplicado incorretamente. | Crítica |
| A-05 | Cura | Limites de PV podem misturar PV regulares e temporários. | Cura acima do máximo regular. | Crítica |
| A-06 | Concentração | Fechar o modal de teste de resistência limpa o contexto, mesmo sem resolver o teste. | Efeito pode permanecer indevidamente. | Crítica |
| A-07 | Dano | Ausência de motor centralizado para tipo, resistência, vulnerabilidade e imunidade. | Resolução mecânica inconsistente. | Alta |
| A-08 | Vantagens | Fontes automáticas e manuais não possuem integração centralizada confirmada. | Rolagens e testes inconsistentes. | Alta |
| A-09 | Condições | Condições e concentração compartilham campo textual; efeitos mecânicos não estão centralizados. | Dificuldade de automação e persistência. | Alta |
| A-10 | Efeitos mágicos | Efeitos pendentes se concentram em dano posterior; a chave da magia pode sobrescrever instâncias. | Perda de efeitos recorrentes independentes. | Alta |
| A-11 | Histórico | Eventos possuem informações desiguais entre armas, magias, poções e outros recursos. | Rastreabilidade limitada. | Média |
| A-12 | Modais | Proteções de edição e comportamento de fechamento não estão uniformizados. | Descarte acidental ou fluxo interrompido. | Alta |
| A-13 | Level Up | Fluxos podem alterar parte do estado antes da confirmação final. | Evolução parcial em cancelamentos. | Alta |
| A-14 | Classes/subclasses | Divergência entre opções exibidas e dados JSON disponíveis; correspondências incompletas. | Características ausentes ou inconsistentes. | Alta |
| A-15 | Testes | Existem testes unitários específicos, mas cobertura insuficiente dos fluxos ponta a ponta. | Regressões não detectadas. | Alta |
| A-16 | Persistência de efeitos | Parte dos efeitos mágicos pendentes se perde ao recarregar. | Perda de estado de combate. | Alta |
| A-17 | Descansos | Recuperação de dados de vida em descanso longo requer adequação às regras de 2014. | Recursos restaurados incorretamente. | Média |
| A-18 | Equipamentos | Munições em reestruturação e poções aguardando catálogo próprio. | Risco de retrabalho se integrar antes do esquema final. | Dependência |

### 3.1. Evidências e referências principais

- `js/core/storage.js`: `normalizarDadosImportacao()`, `coletarDadosFicha()`, `fichaFoiAlterada()`, `salvarFicha()` e `importarFicha()`.
- `js/modules/importacao.js`: `aplicarDadosFicha()`; comentário no código reconhece ausência de rollback transacional.
- `js/modules/magias.js`: edição de talentos, concentração, efeitos mágicos pendentes e ações de magia.
- `js/modules/combate.js`: PV, iniciativa, posição, testes de resistência, condições, histórico e subtabs.
- `js/data/racas-subclasses.js`: evolução e modais de Level Up.
- `js/modules/equipamentos.js`: equipamentos, armaduras, munições e poções legadas.
- `tests/magias-efeitos.test.cjs` e `tests/armaduras-catalogo.test.cjs`: testes automatizados identificados.
- `docs/BUG_REPORT.md`: registros históricos de validação, incluindo round-trip JSON reprovado em 22/10/2026. A comparação posterior de campos narrativos não demonstrou por si só um round-trip controlado completo.
- `ROADMAP.md` e `DECISOES_DE_ARQUITETURA.md`: diretriz de modularização incremental e compatibilidade retroativa.

## 4. Resultados por domínio

### 4.1. Integridade, backup e migração

Há normalização de aliases de JSONs legados e validações de estados de perícias e espaços de magia. Porém, a importação ainda não garante reversão integral após erro. O marcador de ficha salva é atualizado ao iniciar o download. Recomenda-se versão explícita do esquema JSON, validação prévia, migrações testadas, importação transacional e backup local independente da exportação.

**Comportamento de backup proposto:** salvar cópia local após 10 segundos sem novas alterações persistentes; lembrar da exportação a cada 30 minutos quando houver alterações não exportadas; usar aviso de saída para dados pendentes; oferecer recuperação na reabertura mediante confirmação. Não considerar esses recursos implementados.

### 4.2. Características personalizadas

O editor de características compara nome e descrição para alertar sobre alterações não salvas, mas a gravação pode descartar outras propriedades do objeto. A correção deve anteceder novos campos de ativação, fórmulas, usos, recargas e efeitos. Texto personalizado é autoritativo e não deve ser substituído por catálogo, classe, subclasse, Level Up ou importação.

### 4.3. Combate e regras de 2014

Priorizar PV temporários, limite de cura, testes obrigatórios de concentração, dano tipado, resistências, vulnerabilidades, imunidades e vantagens/desvantagens. O cálculo de vantagem/desvantagem segue a regra de 2014: havendo qualquer fonte de cada tipo, a rolagem é normal; fontes não se acumulam. Suportar marcação manual por rolagem e fontes persistentes com origem e escopo.

### 4.4. Condições, efeitos e recursos

Separar condições de efeitos ativos, com instâncias identificáveis, origem, duração, concentração e consequência mecânica. Suportar efeitos de dano, cura, condição e outros modificadores, sem consumir novamente um recurso já gasto para ativá-los. Características ativas devem ser opcionais por padrão, inclusive quando adicionadas por catálogo ou Level Up.

### 4.5. Modais e acessibilidade

**Regra aprovada:** clicar no fundo do modal nunca o fecha. Fechamento explícito, X e Esc (quando permitido) devem respeitar alterações não salvas. Teste de concentração pendente deve ser resolvido ou abandonado expressamente, sem descarte silencioso. Padronizar foco inicial, contenção de Tab, restauração do foco, responsividade e prevenção de confirmação duplicada.

### 4.6. Level Up

A evolução deve ser transacional: selecionar nível, subclasse quando desbloqueada, características do nível exato e PV; aplicar somente após confirmação. Cancelar não altera o personagem. Para múltiplos níveis, processar sequencialmente. Oferecer características com descrição e seleção padrão, permitindo desmarcar opcionais. Preservar dados personalizados e evitar duplicações por ID estável.

### 4.7. Testes

A suíte Node identificada cobre cenários de magias/efeitos e catálogo de armaduras. É necessário acrescentar testes unitários das regras, integração de importação/exportação e testes de navegador para modais, Level Up, combate, responsividade e teclado. Não houve nova execução da suíte nesta auditoria.

## 5. Requisitos de interface definidos durante a auditoria

### 5.1. Iniciativa — estados aprovados

**Antes do combate:**

```text
Iniciativa
   +3
[Iniciar Combate]
```

`+3` é o bônus calculado pela ficha, não uma rolagem. O botão abre modal de `1d20 + bônus`, com definição da posição. Cancelar mantém o combate inativo.

**Durante o combate:**

```text
Posição
  4º
Iniciativa: 14
```

A posição fica em destaque e é editável; a iniciativa rolada aparece abaixo, pequena. Alterar posição não muda a iniciativa. O botão de início desaparece; encerrar combate restaura o estado anterior. Rodadas avançam manualmente. O número de participantes **não** integra o layout compacto aprovado.

### 5.2. Organização do painel

Priorizar PV, CA, condições, concentração e ações. Ações principais: **Arma, Magia, Poder e Testes**. Histórico em acesso separado. Equipamentos em área recolhível. Poções favoritas com acesso rápido e catálogo completo em modal; favorita com quantidade zero permanece marcada, mas indisponível para uso. Consumo de poção exige confirmação, aplicação de efeito e registro no histórico.

### 5.3. Vantagem/desvantagem manual

Oferecer seleção contextual para uma rolagem e registro persistente por ataque, perícia ou resistência, com motivo/fonte. Fontes automáticas e manuais devem ser exibidas, sem permitir que um ajuste manual apague silenciosamente um efeito automático.

## 6. Matriz de prioridades

| Prioridade | Objetivo | Entregas |
|---|---|---|
| P0 — Crítica | Integridade | Importação recuperável, preservação de metadados, testes de round-trip e backup |
| P1 — Crítica/Alta | Regras | PV, dano, cura, concentração, resistências e vantagens |
| P2 — Alta | Estado | Condições, efeitos, características ativas, usos e histórico |
| P3 — Alta | Interface | HUD de combate, iniciativa/posição, abas de ações e modais |
| P4 — Alta | Evolução | Level Up transacional, catálogos, descansos e testes integrados |

## 7. Plano de implementação derivado da auditoria

> Esta seção registra a **recomendação de execução** resultante da auditoria; não significa que a implementação tenha sido autorizada ou iniciada.

### Entrega 1 — Proteção de dados

**Escopo:** preservar propriedades adicionais em características; separar estados de backup/exportação; validar JSON antes da aplicação; preparar rollback; implementar migração versionada e testes de regressão.

**Arquivos prováveis:** `js/core/storage.js`, `js/modules/importacao.js`, `js/modules/magias.js`, `tests/`.

**Aceite:** round-trip de personagens reais sem perdas relevantes; erro de importação não altera parcialmente a ficha; descrições e metadados sobrevivem a edição e recarga.

### Entrega 2 — Motor de combate

**Escopo:** PV temporários, cura, dano tipado, concentração obrigatória, vantagem/desvantagem, testes e resistências.

**Arquivos prováveis:** `js/modules/combate.js`, `js/modules/magias.js` e módulos novos de regras.

**Aceite:** casos de dano/cura e concentração aprovados por testes; regras de vantagem 2014 reproduzidas; resultados registrados no histórico.

### Entrega 3 — Efeitos e recursos

**Escopo:** estados estruturados de condições, efeitos ativos, características ativas, usos, recargas, duração e fontes.

**Arquivos prováveis:** `js/modules/magias.js`, `js/modules/combate.js`, `js/core/storage.js` e módulos novos.

**Aceite:** instâncias independentes persistem; efeitos recorrentes não gastam novamente recurso; descrições personalizadas preservadas.

### Entrega 4 — Interface de combate

**Escopo:** painel compacto; iniciativa/posição conforme os dois estados aprovados; Arma/Magia/Poder/Testes; histórico separado; equipamentos recolhíveis; integração de poções quando o catálogo estiver definido.

**Arquivos prováveis:** `ficha/Ficha_DnD_-_Tatagiba_1.0.html`, `js/modules/combate.js`, `js/modules/magias.js`, CSS.

**Aceite:** estados da iniciativa corretos; posição editável; cancelamento do modal não inicia combate; acessibilidade e responsividade aprovadas.

### Entrega 5 — Level Up e integração

**Escopo:** evolução transacional, seleção de características e subclasses por nível, recuperação correta de recursos e preservação de personalizações.

**Arquivos prováveis:** `js/data/racas-subclasses.js`, `js/modules/classe.js`, `js/modules/card-classe.js`, `js/modules/importacao.js`.

**Aceite:** cancelar não altera nível/PV/recursos; confirmação aplica conjunto consistente; sem características duplicadas.

### Entrega 6 — Estabilização

**Escopo:** testes automatizados e de navegador, migrações legadas, modais, teclado, dispositivos móveis, temas, importação/exportação e regressões.

**Aceite:** matriz crítica aprovada; problemas remanescentes documentados e classificados; nenhuma regressão conhecida de integridade de dados.

## 8. Dependências e itens fora de escopo imediato

- **Munições:** reestruturação em andamento. Não fixar esquema nem alterar integração definitiva antes da estabilização. O roadmap prevê catálogo próprio, IDs estáveis e validações de quantidade, vínculo e peso.
- **Poções:** JSON exclusivo ainda não definido. Preservar o requisito de favoritas e consumo, sem assumir campos do esquema legado.
- **Catálogos de subclasses:** divergência de cobertura exige tratamento explícito; não inventar características faltantes.
- **Expiração:** comportamento intencional do projeto; não é achado de defeito nem objeto de correção.
- **Arquitetura:** evolução incremental, não reescrita completa; preservar operação como aplicação web estática.

## 9. Checklist de aceite global

- [ ] Importação/exportação preserva dados relevantes.
- [ ] Falha de importação não deixa estado parcial.
- [ ] Textos e metadados personalizados sobrevivem a edições e Level Up.
- [ ] Backup e recuperação funcionam com confirmação explícita.
- [ ] PV temporários, dano, cura e concentração seguem D&D 5e 2014.
- [ ] Vantagem/desvantagem manual e automática se conciliam corretamente.
- [ ] Efeitos e recursos não sofrem gasto duplicado nem sobrescrita entre instâncias.
- [ ] Iniciativa/posição seguem os dois estados de interface aprovados.
- [ ] Modais não fecham ao clicar no fundo.
- [ ] JSONs antigos são carregados sem perda silenciosa.
- [ ] Testes unitários, de integração e de navegador críticos são aprovados.
- [ ] Integrações de munições e poções respeitam os esquemas definitivos.

## 10. Conclusão e encaminhamento

A auditoria de 60 fases foi encerrada. O projeto pode evoluir com segurança por entregas incrementais, desde que a integridade dos dados e as regras de combate sejam tratadas antes da reformulação visual. A **primeira entrega recomendada** é a proteção de dados, especialmente a preservação de características personalizadas e a importação/exportação recuperável.

**Estado final:** auditoria concluída; plano recomendado documentado; nenhuma implementação autorizada ou executada nesta etapa; nenhum arquivo do projeto alterado.
