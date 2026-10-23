# Roadmap do Projeto Ficha D&D

## Objetivo

Acompanhar a evolução do sistema de ficha de personagem para manter a aplicação funcional, organizada e pronta para crescimento sem perder compatibilidade com o uso atual.

## Fase 1 — Estabilização e documentação

### Objetivos

- Registrar arquitetura atual do sistema
- Documentar fluxos de carga, persistência e UI
- Definir padrões de contribuição e manutenção
- Separar documentação técnica da documentação funcional

### Entregáveis

- README principal
- Documentos de arquitetura e decisões técnicas
- Guia de contribuição
- Checklist de manutenção

## Fase 2 — Organização estrutural

### Objetivos

- Reduzir acoplamento com o DOM
- Separar regras de negócio da UI
- Reorganizar módulos por responsabilidade
- Normalizar nomes e convenções de estado

### Entregáveis

- Extração de módulos de atributos, combate e gerenciamento de ficha
- Padronização de inicialização de módulos
- Estrutura de serviços utilitários e modelos de dados

## Fase 3 — Qualidade e confiabilidade

### Objetivos

- Criar validações de consistência dos dados da ficha
- Cobrir cenários críticos como importação/exportação e alteração de classe
- Detectar regressões em regras de magia, vida e dano
- Revisar compatibilidade entre fichas antigas e novas

### Entregáveis

- Script de validação de JSON de personagem
- Testes de regressão para importação, persistência e cálculo
- Mecanismos de segurança e sanitização de dados

## Fase 4 — Expansão de funcionalidade

### Objetivos

- Melhorar suporte de regras específicas
- Expandir sistema de magia, equipamentos e talentos
- Melhorar experiência de edição de ficha e usabilidade
- Permitir melhor gestão de campanhas e personagens por perfil

### Possíveis evoluções

- Sistema de campanhas e múltiplos personagens
- Exportação em formatos mais robustos
- Histórico de aventuras e sessões
- Melhor suporte a regras opcionais e customizações do mestre

## Fase 5 — Modularização e arquitetura orientada a serviço

### Objetivos

- Evoluir de monólito front-end para prática modular
- Introduzir domínios de negócio independentes
- Criar camada de dados e estado mais previsível

### Estrutura alvo

```text
js/
  app/
  core/
  domain/
  services/
  ui/
  data/
  integrations/
```

## Critérios de sucesso

- A ficha continua estável para uso diário
- O código torna-se mais legível e sustentável
- É possível evoluir sem quebrar objetos e regras existentes
- A importação/exportação continua funcionando com compatibilidade
- Novos recursos entram por módulos claros e bem testados

## Observações

Este roadmap considera o projeto como uma aplicação estática em evolução, com foco na clareza de arquitetura e na melhoria incremental. A refatoração deve priorizar compatibilidade e risco baixo antes de introduzir novos frameworks ou estruturas complexas.

## Acompanhamento operacional

Este acompanhamento complementa as fases de longo prazo acima; não substitui nem declara concluída nenhuma fase ou entregável. O `ROADMAP.md` é a única fonte oficial de tarefas aprovadas, em execução ou pendentes. `docs/TODO.md` é exclusivamente um banco de ideias ainda não aprovadas. Diagnósticos e validações de bugs ficam em `docs/BUG_REPORT.md`; regras de trabalho ficam em `docs/CONTRIBUICAO.md`.

### Estados

- **Pendente:** ainda não iniciado.
- **Em análise:** investigação em andamento ou evidências insuficientes.
- **Em andamento:** implementação iniciada, mas ainda não concluída e validada.
- **Concluído:** implementação e critérios de validação registrados como atendidos.
- **Bloqueado:** impedimento conhecido que exige resolução antes de continuar.

Diagnóstico, implementação e validação são etapas distintas. Um diagnóstico ou uma alteração de código, isoladamente, não conclui uma tarefa.

### Estado atual do projeto

- **Documentação e arquitetura:** ideias não aprovadas ficam em `docs/TODO.md`, tarefas aprovadas ficam apenas neste Roadmap, e `docs/BUG_REPORT.md` registra bugs com evidência. `docs/IMPLEMENTATION_PLAN.md` e os arquivos TODO antigos estão identificados como históricos, não como filas ativas. Outros documentos ainda não foram auditados em conjunto.
- **Código e funcionalidades:** a aplicação estática e seus módulos existentes permanecem como base do projeto. Não foi feita nesta atualização uma auditoria geral das funcionalidades nem das cinco fases.
- **Testes:** além dos cenários de XP/Level Up, o round-trip de Thrain e Waldo foi executado e a conversão de espaços legados foi corrigida e validada em 2026-10-23. Uma comparação posterior encontrou igualdade textual exata dos três campos narrativos de Thrain entre original, cópia temporária e export; como a origem do export não pôde ser confirmada como resultado da importação da cópia pela interface, o round-trip controlado desses campos segue pendente. O download nativo foi validado manualmente em 2026-10-23, com conclusão do download, gravação do arquivo JSON e conferência de seu conteúdo. Não foi executada uma suíte automatizada geral.
- **Fases do roadmap:** nenhuma fase ou entregável é declarado concluído por este acompanhamento. A tarefa atual está relacionada à Fase 3 — Qualidade e confiabilidade, sem implicar que a fase esteja concluída.

### Tarefa concluída — fluxo dos modais de XP e Level Up

**Estado geral:** Concluído para o escopo pontual abaixo. A Fase 3 continua em andamento como direção de longo prazo; esta tarefa não conclui a fase.

- **Objetivo:** corrigir o cancelamento da rolagem de PV e a semântica/estado de acessibilidade dos modais, preservando foco e animação existentes.
- **Investigado — Concluído:** identificados o caminho de animação de XP, a chamada de `processarLevelUp()`, o cancelamento por Escape e os mecanismos de foco. O diagnóstico detalhado está em `docs/BUG_REPORT.md`.
- **Implementado — Concluído:** Escape agora é representado por `null` e interrompe o processamento sem alterar PV; `xpAddModal` atualiza `aria-hidden` na abertura/fechamento; o diálogo de Level Up tem `role`, `aria-modal` e `aria-labelledby`. A mitigação global de `aria-hidden` foi preservada por ainda ser usada em outros componentes.
- **Arquivos de código alterados:** `js/data/racas-subclasses.js` e `ficha/Ficha_DnD_-_Tatagiba_1.0.html`. Os arquivos `css/xp-modal.css` e `css/base.css` foram pontos de partida, mas não precisaram de alteração.
- **Validado — Concluído para os cenários listados:** adição de 50 XP sem subir de nível; adição de 250 XP seguida de rolagem 4 (PV 8 → 12, modificador +0); adição de 600 XP seguida de Escape (PV permaneceu 12); estado ARIA, foco inicial/restaurado e contenção de Tab nos modais. Não houve erros JavaScript nem mensagens relacionadas a `aria-hidden` nos cenários observados.
- **Limite da validação:** os fluxos foram testados manualmente no navegador; não foi executada uma suíte automatizada geral. A ausência de aviso nos cenários testados não comprova sua ausência em todos os contextos.

#### Critérios de conclusão e validação

1. **Correção — Concluído:** Escape cancela sem aplicar modificador de Constituição ou alterar PV; rolagem numérica permanece normal. Verificado no navegador.
2. **Acessibilidade — Concluído para os cenários testados:** atributos e estado de `aria-hidden`, foco inicial/restaurado e contenção de Tab conferidos. Nenhum aviso `aria-hidden` observado durante esses testes.
3. **Regressão de XP — Concluído para os cenários testados:** ganho sem e com mudança de nível, animação da barra e atualização de XP/nível/PV conferidos.
4. **Registro — Concluído:** arquivos, verificações e limites da validação registrados aqui e em `docs/BUG_REPORT.md`.

#### Próximas tarefas priorizadas

1. **Pendente — Confirmar round-trip controlado dos campos narrativos de Thrain:** uma comparação com `Thrain_Martelferro_Tatagiba_20261023 (2).json` encontrou igualdade textual exata para `equipamentoArmas`, `equipamentoArmadura` e `equipamentoOutros` em relação ao original e à cópia `%TEMP%\Thrain_validacao.json`. A cópia tem o mesmo SHA-256 do original; ainda assim, nomes, horários e conteúdo dos arquivos não comprovam que esse export foi produzido pela importação dessa cópia na interface. Repetir ou confirmar o vínculo do fluxo controlado antes de encerrar a validação. A decisão semântica sobre manter dados narrativos legados permanece separada de qualquer correção de código.
2. **Concluído — Validar download nativo do navegador:** teste manual confirmou que o navegador concluiu o download, gravou o arquivo JSON e permitiu conferir seu conteúdo. A geração do Blob, isoladamente, não foi usada como evidência de conclusão.
3. **Em análise — Validar compatibilidade da timeline de combate:** conferir na interface ataques com arma, Cura e Dano, incluindo registros simples/legados e os campos estruturados de ataque. O defeito de transição entre as etapas do modal de ataque foi corrigido e o usuário confirmou no Chrome o funcionamento visual e a estrutura inicial do DOM. Permanecem pendentes os testes individuais de Fracasso, Cancelar ataque, Registrar dano e abertura de um segundo ataque, além dos demais cenários da matriz. Registrar os resultados por tipo de evento e só abrir novas correções se houver regressão comprovada.

### Tarefa de validação — round-trip de fichas (Fase 3)

**Estado:** Investigado — Concluído; Implementado — Não aplicável (validação apenas); Validado — Executado, com reprovações registradas. Nenhum arquivo de código ou ficha original foi alterado nesta tarefa.

- **Thrain:** campos centrais e coleções estruturadas passaram; três campos narrativos de equipamento presentes no original não apareceram no export. Preservação semântica desses textos precisa ser decidida.
- **Waldo:** campos centrais, magias serializadas e coleções passaram; a conversão do espaço de magia nível 1 falhou (`total=2`, `usado=0`, `restante exportado/reimportado=0`, esperado `2`).
- **Execução:** ambos os arquivos foram importados pelo fluxo da interface; o botão Salvar gerou o Blob e os exports temporários foram reimportados pela interface. Nenhum erro ou warning de aplicação foi observado nos fluxos finais.
- **Limitação:** o download nativo não foi validado; o harness salvou o Blob em `%TEMP%`. Cópias e exports ficaram fora do repositório; hashes confirmam originais inalterados.
- **Estado posterior:** a conversão de slots legados foi corrigida e validada na seção seguinte. Permanecem como pendências separadas a decisão sobre os campos narrativos de Thrain e o teste do download nativo. Detalhes em `docs/BUG_REPORT.md`.

### Correção de espaços de magia legados (Fase 3)

**Estado:** Investigado — Concluído; Implementado — Concluído; Validado — Concluído para os cenários descritos.

- **Diagnóstico:** o importador preenchia a ficha com `magiaNRest=0` do HTML e ignorava `magiaNUsado`, pois o campo legado não tinha ID na UI. O módulo de magias prioriza `Rest` quando esse campo existe, de modo que o fallback de cálculo legado não era utilizado.
- **Implementação:** `js/core/storage.js` converte níveis 1–9 somente quando `Rest` está ausente e o par legado `Total`/`Usado` contém inteiros decimais não negativos, seguros e consistentes. Espaços externos são aceitos; vazio, notação exponencial, frações e caracteres inesperados são inválidos. `Rest` atual tem precedência. Par parcial/inválido cancela a importação antes de alterar a ficha e apresenta erro; `js/modules/importacao.js` normaliza antes de ativar o bloqueio de Level Up.
- **Validação:** Waldo legado resultou em 2 restantes para 2 totais e 0 usados; usos 0/1/2 em todos os nove níveis produziram 2/1/0; formato atual `Rest` foi preservado; exportação/reimportação conservou 2; entradas inválidas e pares incompletos cancelaram sem alterar a ficha; Thrain permaneceu com zero nos níveis 1–9.
- **Arquivos alterados nesta correção:** `js/core/storage.js` e `js/modules/importacao.js`; os resultados detalhados estão em `docs/BUG_REPORT.md`.
- **Limitações/pendências:** testes manuais no navegador; nenhuma suíte automatizada geral. A entrega de download nativo não foi testada. A preservação dos campos narrativos de equipamento de Thrain segue fora do escopo.

### Histórico recente

- **2026-10-22 — Registro do diagnóstico inicial:** localizado o roadmap oficial e os registros existentes; naquele momento, a investigação não modificou código nem executou testes, e a implementação/validação permaneciam pendentes. O estado posterior está registrado na entrada seguinte.
- **2026-10-22 — Correção de XP/Level Up implementada e validada:** alterados `js/data/racas-subclasses.js` e `ficha/Ficha_DnD_-_Tatagiba_1.0.html`; cenários manuais no navegador passaram. Sem suíte automatizada geral. Detalhes e resultados em `docs/BUG_REPORT.md`.
- **2026-10-22 — Round-trip de importação/exportação executado (Fase 3):** Thrain preservou os campos centrais e coleções estruturadas, mas três campos narrativos de equipamento não foram exportados. Waldo preservou os campos centrais, magias e equipamentos, mas seu espaço de magia nível 1 exportado/reimportado ficou em 0 apesar de 2 espaços totais e 0 usados. Validação geral reprovada; nenhuma correção de código feita. Originais preservados por hash; detalhes em `docs/BUG_REPORT.md`.
- **2026-10-23 — Conversão de espaços legados corrigida e validada:** `js/core/storage.js` converte `magiaNUsado` em `magiaNRest` com validação e preserva formato atual. Casos de níveis 1–9, inválidos, Waldo round-trip e Thrain passaram conforme registrados em `docs/BUG_REPORT.md`.
- **2026-10-23 — Comparação posterior dos campos narrativos de Thrain:** os três campos foram comparados com igualdade textual ordinal entre original, cópia temporária e export informado. A origem do export pela importação da cópia não foi comprovada; comparação aprovada, round-trip controlado pendente. O diagnóstico anterior permanece preservado em `docs/BUG_REPORT.md`.
- **2026-10-23 — Modal de ataque, transição entre etapas:** corrigida a hierarquia HTML de `modalAtaqueEtapaDado` e `modalAtaqueEtapaDano`; o usuário confirmou a transição visual e a estrutura inicial do DOM no Chrome. Testes de regressão de botões, registro de dano e novo ataque seguem pendentes; detalhes em `docs/BUG_REPORT.md`.
- **2026-10-23 — Triagem das listas antigas:** propostas ainda não aprovadas da área de magias foram consolidadas em `docs/TODO.md`; a timeline de combate existente foi conferida, e a validação de compatibilidade restante foi registrada nas próximas tarefas. Os documentos antigos permanecem como resumos históricos, não filas ativas.

### Decisões e restrições de acompanhamento

- Preservar as cinco fases, seus objetivos, entregáveis, estrutura-alvo, critérios de sucesso e observações; não inferir conclusão sem evidência.
- Manter este arquivo como única fila oficial de tarefas aprovadas; `docs/TODO.md` pode conter apenas ideias não aprovadas e nunca deve duplicar tarefas ativas.
- Tratar os arquivos de código listados como pontos de partida, não como uma lista obrigatória de arquivos a modificar.
- Preservar regras de D&D, estruturas de dados, IDs, atributos HTML e compatibilidade com fichas existentes, salvo evidência que justifique uma mudança.
- Commits são manuais e ficam a cargo do responsável pelo projeto.

**Última atualização:** 2026-10-23 — correção estrutural do modal de ataque registrada com confirmação visual limitada; validação ampla da timeline e round-trip controlado dos campos narrativos de Thrain permanecem pendentes; Fase 3 permanece em andamento.
