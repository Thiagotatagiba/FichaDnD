# Roadmap do Projeto Ficha D&D

## Objetivo

Acompanhar a evolução do sistema de ficha de personagem para manter a aplicação funcional, organizada e pronta para crescimento sem perder compatibilidade com o uso atual.

## Diretriz aprovada — regras de D&D 5e

A aplicação deve utilizar como padrão as regras oficiais de D&D 5e, tendo o Livro do Jogador disponibilizado no projeto como referência normativa. Não devem ser introduzidas adaptações próprias de regras sem aprovação explícita e registro da decisão arquitetural.

A única exceção aprovada é a capacidade de carga: o padrão é Força × 7,5 kg, com possibilidade futura de alteração do multiplicador nas configurações. A preferência deverá ser persistida e restaurada, e a capacidade recalculada quando a Força ou o multiplicador mudar. O limite para erguer, arrastar e puxar permanece Força × 15 kg e não é afetado por essa configuração. Alterar o multiplicador afeta exclusivamente a capacidade de carga, sem modificar outras regras do jogo.

## Fase 1 — Estabilização e documentação

### Objetivos da Fase 1

- Registrar arquitetura atual do sistema
- Documentar fluxos de carga, persistência e UI
- Definir padrões de contribuição e manutenção
- Separar documentação técnica da documentação funcional

### Entregáveis da Fase 1

- README principal
- Documentos de arquitetura e decisões técnicas
- Guia de contribuição
- Checklist de manutenção

## Fase 2 — Organização estrutural

### Objetivos da Fase 2

- Reduzir acoplamento com o DOM
- Separar regras de negócio da UI
- Reorganizar módulos por responsabilidade
- Normalizar nomes e convenções de estado

### Entregáveis da Fase 2

- Extração de módulos de atributos, combate e gerenciamento de ficha
- Padronização de inicialização de módulos
- Estrutura de serviços utilitários e modelos de dados

## Fase 3 — Qualidade e confiabilidade

### Objetivos da Fase 3

- Criar validações de consistência dos dados da ficha
- Cobrir cenários críticos como importação/exportação e alteração de classe
- Detectar regressões em regras de magia, vida e dano
- Revisar compatibilidade entre fichas antigas e novas

### Entregáveis da Fase 3

- Script de validação de JSON de personagem
- Testes de regressão para importação, persistência e cálculo
- Mecanismos de segurança e sanitização de dados

## Fase 4 — Expansão de funcionalidade

### Objetivos da Fase 4

- Melhorar suporte de regras específicas
- Expandir sistema de magia, equipamentos e talentos
- Melhorar experiência de edição de ficha e usabilidade
- Permitir melhor gestão de campanhas e personagens por perfil

### Em andamento — catálogo próprio de munições

- Separar munições da categoria Outros e posicionar a seção logo abaixo de Armas.
- Usar um catálogo JSON de munições comuns de D&D 5e 2014; quantidade representa projéteis individuais e pode ser alterada no card.
- Vincular lotes por ID estável a armas, seletores de combate, consumo por ataque e cálculo de peso proporcional ao pacote. Alterações manuais e consumo por ataque atualizam imediatamente os cards e seletores vinculados.
- Migrar arquivos antigos preservando IDs e gravar temporariamente um espelho em `outros` para compatibilidade.
- **Validação pendente:** revisar visualmente em celular e desktop; validar navegação por teclado e leitor de tela; importar/exportar Thrain; exercitar dois lotes compatíveis, remoção de lote vinculado e quantidade zero; confirmar na interface que editar quantidade e consumir munição em ataque atualizam imediatamente o card da arma e os seletores de combate.
- Não marcar a iniciativa como concluída até os cenários de responsividade, round-trip e acessibilidade passarem.

Os padrões visuais reutilizáveis para card, modal de exibição, cadastro/edição e seleção de catálogo estão registrados em `DECISOES_DE_ARQUITETURA.md`, seção 12. A hierarquia separada entre categorias e a regra de não fechar modal pelo fundo permanecem nas seções 10 e 11.

### Catálogo “Outros” — implementado; revisão visual ampla pendente (Fase 4)

- **Resultado:** catálogos comuns separados por família em JSON e registrados centralmente; seletor com filtro, pesquisa, lista e prévia; painel único para tipos diversos; criação manual que solicita o tipo antes de abrir os campos específicos. Proficiência relacionada aparece apenas em ferramentas/kits e instrumentos, e o uso como foco arcano é uma propriedade de instrumento. Nenhuma regra de proficiência ou efeito mágico foi ativado.
- **Compatibilidade:** instâncias continuam em `outros[]`, preservando os campos antigos e propriedades desconhecidas. O script `scripts/migrar-itens-personagens.cjs` normaliza os arquivos de personagem versionados, separando munições e vestimentas e migrando metadados dos demais itens.
- **Validação:** testes automatizados cobrem o catálogo e seus fluxos. A conferência visual em várias larguras e o round-trip completo de fichas após a migração permanecem como validação manual pendente; veja [plano e resultado do catálogo](docs/propostas/PLANO_CATALOGO_OUTROS.md).

### Reordenação manual dos cards — implementada (Fase 4)

- **Resultado:** arraste para reordenar itens dentro de cada lista de Armas, Munições, Armaduras, Escudos, Vestimentas e acessórios e Outros. A ordem do DOM é coletada e persistida com a coleção; arrastar para outra categoria não é permitido.
- **Integridade:** posições dos itens equipados são recalculadas por referência à instância para que reordenar não troque a seleção de arma, escudo ou armadura. Controles de quantidade e outros campos editáveis não iniciam arraste.
- **Validação:** testes automatizados verificam as seis listas, o limite por categoria, a coleta na ordem visual e a preservação de equipamento. Arraste real e persistência após salvar/importar ainda precisam de validação manual no navegador.

### Possíveis evoluções

- Sistema de campanhas e múltiplos personagens
- Exportação em formatos mais robustos
- Histórico de aventuras e sessões
- Melhor suporte a regras opcionais e customizações do mestre

## Fase 5 — Modularização e arquitetura orientada a serviço

### Objetivos da Fase 5

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
- **Código e funcionalidades:** desde `b52a330`, a aplicação recebeu correções de cálculo/perícias e suporte ao catálogo de truques e à busca de magias (`b5d446a`). O acompanhamento desta atualização é pontual e não representa auditoria geral das funcionalidades ou das cinco fases.
- **Testes:** além dos cenários registrados de XP/Level Up e da correção de espaços de magia legados, a persistência dos quatro estados recebeu verificações estáticas e testes isolados; o usuário também reportou um round-trip manual da ficha de Waldo com os quatro estados preservados. Recálculos pela interface, round-trip consecutivo, JSON legado e importação parcial continuam pendentes. O round-trip controlado dos campos narrativos de Thrain e a validação ampla da timeline também permanecem pendentes; o download nativo tem validação manual registrada em 2026-10-23. Não foi executada uma suíte automatizada geral.
- **Fases do roadmap:** nenhuma fase ou entregável é declarado concluído por este acompanhamento. A tarefa atual está relacionada à Fase 3 — Qualidade e confiabilidade, sem implicar que a fase esteja concluída.

### E1.4 — Snapshot e rollback da importação (aprovada com ressalvas pelo responsável)

- **Escopo entregue até E1.4-K:** E1.4-F corrigiu a reconciliação visual da XP e a invalidação de editores antigos de armadura/escudo; E1.4-G/H/I ampliaram a validação, as proteções assíncronas e a verificação pós-reconciliação; E1.4-J protegeu o modal de salvaguarda contra morte durante a transação. E1.4-G também integrou os ajustes recentes da barra/painel de XP e do campo Jogador, mantendo o design que o usuário identificou como aprovado. O código e as evidências detalhadas permanecem em `docs/codex/EXECUTION_STATE.md`.
- **E1.4-K — diagnóstico dos cards de classe:** em Chromium integrado ao VS Code 1.146, uma troca de classe seguida de falha injetada após o carregamento do card restaurou as 20 linhas originais, com a mesma identidade, conteúdo e ordem; uma interação em característica continuou funcionando. A ficha, XP, PV e Jogador comparados também voltaram aos valores anteriores e permaneceram estáveis por 1,1 s. A tentativa retornou `CHARACTER_SHEET_ROLLBACK_UNVERIFIED`, sem divergência pós-reconciliação.
- **Ressalva:** a divergência de identidade/ordem que havia produzido `CHARACTER_SHEET_ROLLBACK_FAILED` em E1.4-J não foi reproduzida nesta investigação, mas sua causa original não foi identificada de forma conclusiva. O verificador não foi enfraquecido e `rollbackComplete` não foi elevado.
- **Decisão humana (2026-11-13):** o responsável aprovou o fechamento da E1.4 com ressalvas, adotando o parecer B da E1.4-K. A última suíte registrada passou em 193/193. Nos cenários observados, os cards de classe, seus dados, ordem e interação foram restaurados; a divergência anterior da E1.4-J não foi reproduzida nem completamente explicada.
- **Ressalvas aceitas:** a validação ocorreu em Chromium integrado ao VS Code, não Chrome autônomo; a integração real com preload/processo principal Electron não foi verificada. `rollbackComplete: false` continua sendo um diagnóstico conservador quando não há prova suficiente e não foi alterado para representar a aprovação administrativa. Não há garantia universal contra writers externos arbitrários.
- **E1.5-F — aviso de exportação em troca de ficha:** uma importação transacional bem-sucedida agora limpa o aviso e a solicitação de exportação pertencentes à ficha substituída. Falhas com rollback mantêm ambos; os testes conferem o estado de persistência e o aviso. Em navegador isolado, a importação A→B limpou o status e a falha injetada restaurou A mantendo o aviso, com `CHARACTER_SHEET_ROLLBACK_UNVERIFIED` conservador.
- **Decisão humana (2026-11-13):** E1.5 e E1.5-F aprovadas pelo responsável com ressalvas, com base nos resultados registrados em `docs/codex/EXECUTION_STATE.md`: suíte histórica 210/210, testes de rollback/importação 65/65 e migração/exportação 18/18. A importação válida limpa o aviso de exportação da ficha substituída; falha com rollback preserva o estado e o aviso anteriores.
- **Ressalvas:** Chromium integrado não expôs evento de download capturável; o usuário confirmou manualmente o salvamento em teste anterior, mas a conclusão não foi comprovada automaticamente. A limpeza temporizada de URLs Blob não foi validada em todos os navegadores. Ausência de evento automatizado não prova que o arquivo não foi salvo.
- **Pendente de QA (não implementado):** teste automatizado de exportação JSON com Playwright em navegador isolado, usando downloads habilitados, personagem sintético, diretório temporário exclusivo, captura do evento de download, verificação de existência/integridade, parse com `JSON.parse`, conferência de campos representativos e limpeza segura dos temporários. Esta melhoria não bloqueia a aprovação registrada e não foi implementada nesta execução.
- **Estado:** E1.4 está formalmente aprovada pelo responsável com ressalvas, sem declarar integridade universal. E1.5 e E1.5-F estão formalmente aprovadas com as ressalvas acima. A implementação separa alterações pendentes, último backup local e última exportação solicitada; não trata o clique de download como confirmação; usa mensagens sem promessa de gravação; exclui alterações transitórias de modal; limpa URLs temporárias de Blob e limpa o aviso somente após importação válida. O backup local automático permanece em E1.6, que é a próxima etapa prevista e ainda não foi iniciada. E2 não foi iniciada.

### Catálogo de armaduras — implementado e validado nos cenários definidos (Fase 4)

- **Autorização:** usuário aprovou a execução da proposta em 2026-11-05.
- **Resultado:** catálogo estático com 12 armaduras em kg; busca e filtros no padrão das magias; criação manual, resumo, edição, equipar/desequipar e restauração do padrão. Os exemplares mantêm valores próprios e metadados opcionais, preservando o formato legado de ficha.
- **Validação:** 18 testes Node passaram; seleção, cópias independentes, exclusões, exportação/importação real por Blob, dados legados, navegação por teclado, viewport de 390 × 844 e recuperação de falha de fetch foram exercitados no navegador. Registro completo em [proposta e resultado](docs/propostas/CATALOGO_ITENS_ARMADURAS.md).
- **Limites:** Força/proficiência/tempos são informativos; conferência com livro físico em português, aparelho móvel físico, leitor de tela e novo download nativo não foram executados. A conclusão desta tarefa não conclui a Fase 4 nem altera as pendências da Fase 3.
- **Continuidade:** avaliar armas, escudos e demais itens em propostas próprias; não há expansão adicional aprovada nesta tarefa.
- **Revisão visual aprovada em 2026-11-05:** cartões compactos no estilo das magias abrem modal de visualização/edição; equipamento, restauração e exclusão ficam no modal. Catálogo com propriedades em grade, botão de adicionar junto ao título e 12 descrições resumidas das regras básicas oficiais de 2014. Novos exemplares persistem a descrição; personalizações são preservadas. Os 18 testes passaram novamente; capturas em desktop e largura de 390 px, salvar/cancelar, equipamento, criação manual, exclusão, teclado e round-trip foram verificados no navegador em área isolada.
- **Refinamento visual final — concluído em 2026-11-06 (`68faa8d`):** títulos de Armas, Armaduras, Escudos e Outros receberam um controle de quantidade em cápsula e ação de adicionar no brasão; cartões de armadura destacam CA, categoria, proficiência, furtividade, equipamento, preço e peso em kg. O modal organiza categoria no título, cálculo da CA como detalhe, peso/valor em caixas próprias, Vestir/Retirar como cartas verticais, descrição em pergaminho e aviso de uso sem proficiência expandido quando aplicável. A prévia do catálogo reutiliza a apresentação do modal, preservando o botão de adicionar ao inventário. JavaScript passou em `node --check` e `git diff --check`; não foi feita nova validação visual de navegador para este refinamento final.

### Catálogo de armas — implementação local; regressão integrada pendente (Fase 4)

- **Estado:** catálogo, pesquisa, cadastro manual, card e modal implementados; testes de unidade do catálogo aprovados. Validação integrada em navegador e com fichas reais continua pendente, portanto esta tarefa não está concluída.
- **Implementação:** JSON com 37 armas comuns de D&D 5e 2014, adaptador para os campos legados, pesquisa/filtros, criação, edição, equipamento, remoção, vínculo de munição e prévia/modal. O seletor de empunhadura distingue Uma mão, Versátil e Duas mãos; o dano adicional só é aplicável a armas versáteis.
- **Distâncias:** campos “Distância Normal (m)” e “Distância Longa (m)” ficam vinculados a Munição/Arremesso. “Alcance (m)” é um campo separado, habilitado pela propriedade Alcance. Glaive, Alabarda, Lança de Montaria, Pique e Chicote estão com 3 m, usando a conversão métrica do catálogo para o alcance total típico de 10 pés.
- **Ajustes do cadastro:** dano base e dano versátil usam a dica “Ex: 1d6”; valor e moeda compartilham uma coluna; Valor e Peso ficam abaixo da descrição; proficiência, estado mágico e sintonização ficam destacados no canto superior direito; botão Fechar é ocultado durante a edição, mantendo Cancelar e Salvar.
- **Validação executada em 2026-11-06:** 7 testes do catálogo passaram, incluindo o mapeamento separado do alcance das cinco armas; `node --check` passou para os módulos alterados e `git diff --check` não encontrou erros.
- **Próximos critérios:** validar no navegador a experiência de cadastro e os modais; testar combate, proficiência, dano/atributo, slots, munição e salvar/cancelar; fazer round-trip de fichas de teste e verificar armas legadas/personalizadas conforme [plano de catálogo de armas](docs/propostas/PLANO_CATALOGO_ARMAS.md). Não declarar concluída a integração até esses cenários passarem.

### Responsividade dos modais de escudos, armaduras e armas — em andamento (Fase 4)

- **Autorização:** usuário aprovou a execução em 2026-11-06.
- **Plano:** [verificação responsiva dos modais do inventário](docs/propostas/PLANO_RESPONSIVIDADE_MODAIS_INVENTARIO.md), com matriz de viewports, roteiros por categoria, critérios de aceite e registro de evidências.
- **Diagnóstico e ajustes iniciais:** em Chromium integrado, a 320 px, os detalhes de armaduras e escudos excediam a largura interna por causa das grades dos resumos e de dimensões mínimas. `css/armaduras.css` agora limita as colunas e largura dos painéis e empilha CA/bônus e tempos nos detalhes de armadura/escudo. Detalhes de armas receberam limites explícitos de largura.
- **Validação parcial até 2026-11-07:** listas e detalhes dos seletores foram conferidos em 320 × 844, 390 × 844 e 768 × 844; não excederam as larguras internas após os ajustes. Em 320 × 640, as prévias de cadastro de armadura e escudo cabiam no painel, com título à direita do símbolo. A prévia de arma tinha sobreposição do símbolo/título e overflow de categoria; CSS corrigido com grade e quebra de texto. Formulário de armadura ainda mantinha duas colunas em 320 px; agora os campos ficam em uma coluna. Linhas de arma e escudo também foram conferidas com coluna única; rótulos longos de propriedades de arma quebram linha. Os formulários rolam verticalmente e suas ações ficam alcançáveis. Em 640 × 320, os modais de arma, armadura e escudo ficaram dentro da viewport e os três CTAs foram alcançáveis pela rolagem dos detalhes.
- **Escudos — correções e validação integrada:** cards adicionados pelo catálogo agora têm o botão de detalhes funcional. Equipar/desequipar sincroniza o checkbox usando o índice real do item e atualiza a CA. Excluir um escudo equipado limpa o slot e recalcula a CA. Os fluxos foram conferidos em 390 × 844. Seletor desktop conferido em 1280 × 800, sem overflow geométrico.
- **Pendências:** concluir fluxos integrados de adicionar/remover para armadura e arma; validar teclado, foco, safe areas e aparelho físico. A tarefa permanece em andamento até registrar os critérios restantes no plano.

### Vestimentas e acessórios — estrutura e consistência do inventário (Fase 4)

- **Estado:** implementação do catálogo e dos ajustes de consistência concluída para o escopo solicitado; validação automatizada ampla e revisão manual completa de todos os fluxos continuam pendentes.
- **Implementado:** catálogo de itens comuns em JSON; cadastro, visualização e edição; categorias; tags de raridade, item mágico e sintonização; resumo com bônus de CA apenas quando diferente de zero; preço e peso; vantagem em perícias mantida como dado visual, sem aplicar mecânica ao personagem.
- **Integridade:** validação do catálogo e prevenção de rascunhos vazios ao cancelar; exclusão atualiza o peso carregado; todos os pesos desta categoria são arredondados e exibidos com uma casa decimal.
- **Interação e responsividade:** clique no fundo deixa de fechar os modais da ficha; fechamento permanece por controles explícitos e teclado onde disponível. Navegação por teclado/foco foi reforçada nos modais de vestimentas. Filtros do catálogo empilham em telas estreitas.
- **Validação executada em 2026-11-09:** `node --check` em todos os módulos JavaScript e `git diff --check`; página de teste no navegador confirmou filtro de categoria, pesos com uma casa decimal, fundo sem fechar o seletor e cancelamento de criação sem deixar item vazio.
- **Pendências:** validar editar/salvar/cancelar, exclusão e recálculo de carga com dados de teste; percorrer leitores de tela e viewports móveis; considerar testes automatizados de catálogo e persistência. Mecânica de vantagens fica adiada até a criação do sistema de vantagens da ficha.

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

### Correção de proficiência e Expertise nas perícias (Fase 3)

**Estado geral:** Investigado — Concluído; Implementado — Concluído no código local; Validado — Parcialmente. O usuário confirmou manualmente a preservação dos quatro estados na interface e em exportação/importação de Waldo; os testes complementares de cálculo, round-trip consecutivo, legado e importação parcial permanecem pendentes. A tarefa não está concluída.

- **Diagnóstico confirmado:** os quatro estados eram mantidos em `data-proficiencia`, enquanto `coletarDadosFicha()` serializa campos com ID. Em meia proficiência, os checkboxes de proficiência e Expertise ficam desmarcados, então esse estado não podia ser reconstruído por exportação/importação em uma página nova.
- **Implementação:** cada perícia agora recebe um campo oculto `pericia*Estado` com valor `0` a `3`. Esse campo é a representação persistida do estado e é sincronizado com `data-proficiencia` e os checkboxes existentes. Os campos booleanos antigos de proficiência e Expertise continuam no JSON para compatibilidade com versões anteriores.
- **Compatibilidade:** a normalização valida valores explícitos de estado e rejeita valores fora de `0` a `3` antes de aplicar os campos. Quando o estado não existe, a importação reconstrói proficiência/Expertise pelos checkboxes disponíveis; JSON legado completo sem Expertise limpa Expertise. Campos ausentes em importação parcial deixam o estado correspondente preservado.
- **Arquivos alterados:** `js/modules/magias.js`, `js/modules/habilidades.js`, `js/modules/importacao.js` e `js/core/storage.js`.
- **Verificações executadas:** `node --check` nos quatro arquivos e `git diff --check`; harness isolado verificou os quatro estados, os cálculos com bônus +2 e +4 e a alteração do atributo relacionado sem perder o estado. Também foram exercitadas a coleta dos campos, restauração do formato novo, compatibilidade legada e preservação de campos ausentes em importação parcial. A fixture `Waldo_Malaphael_Tatagiba_20261104.json` foi lida sem alteração e suas 18 perícias foram mapeadas pelo código de restauração.
- **Validação manual relatada pelo usuário:** exportação/importação da ficha de Waldo seguida de conferência visual e comparação com o JSON exportado preservou Enganação (estado 0, +1), Acrobacia (estado 1, +4), Arcanismo (estado 2, +1) e Atletismo (estado 3, +3). O usuário também confirmou os indicadores visuais de círculo vazio, preenchido, meio círculo e estrela. Este cenário principal está aprovado e não precisa ser repetido sem motivo; não foi observado independentemente nesta sessão.
- **Limites da validação:** os harnesses anteriores usam DOM simulado e não substituem teste de interface. Nesta sessão, a automação não conseguiu acessar as abas do navegador; não foram executados recálculos pela interface, importações consecutivas, compatibilidade legada ou importação parcial.
- **Próximos critérios:** com cópia de teste, verificar recálculo após mudança do atributo e do bônus de proficiência, inclusive arredondamento para baixo da meia proficiência com bônus ímpar; fazer duas exportações/importações em páginas novas e comparar estados, checkboxes e bônus; importar JSON legado sem `pericia*Estado`/Expertise; e testar importação parcial preservando os estados de campos ausentes. Não repetir o teste principal já aprovado nem declarar a tarefa concluída antes dos critérios complementares.

### Risco pendente — aplicação parcial durante importação

`aplicarDadosFicha()` ainda altera DOM e estado global em etapas e não tem rollback transacional. Uma exceção depois de mutações pode deixar a ficha parcialmente aplicada. A caracterização controlada desse comportamento ainda não foi executada; confirmar o estado antes/depois em ambiente isolado continua pendente.

### Histórico recente

- **2026-11-10 — Padrões visuais de inventário consolidados:** a seção 12 de `DECISOES_DE_ARQUITETURA.md` documenta card compacto, modal de exibição, cadastro/edição e seletor de catálogo, incluindo ações, tags, hierarquia de bordas, comportamento responsivo e atualização imediata dos vínculos de quantidade. Não conclui a validação integrada dos catálogos.
- **2026-11-05 — Armaduras com apresentação e modais no padrão de magias:** revisão visual implementada a pedido do usuário; descrições pesquisadas no D&D Beyond 2014, catálogo versão 2, ação de adicionar no cabeçalho, propriedades organizadas em grade e edição com descarte seguro. Validações e limites em [proposta e resultado](docs/propostas/CATALOGO_ITENS_ARMADURAS.md).
- **2026-11-06 — Acabamento dos títulos do inventário e modal de armaduras (`68faa8d`):** brasões com quantidade em cápsula, resumo compacto com avisos de proficiência/furtividade, modal reorganizado e prévia do catálogo no mesmo padrão visual. A documentação não declara validação visual adicional nesta etapa. Próxima continuidade aprovada pelo usuário: iniciar propostas próprias para os outros itens do inventário.
- **2026-11-06 — Catálogo e modal de armas (`1c1943a`) e refinamentos do cadastro:** catálogo das 37 armas comuns de 2014, pesquisa, cards e edição implementados; alcance corpo a corpo separado dos campos de distância, com 3 m para as cinco armas com propriedade Alcance. Proficiência/magia/sintonização foram destacados no topo do cadastro e o botão Fechar foi removido durante a edição. Sete testes automatizados e verificações estáticas passaram; cenários de navegador, combate e round-trip permanecem pendentes conforme a tarefa acima.

- **2026-11-05 — Catálogo de armaduras aprovado e implementado (Fase 4):** 12 armaduras em JSON com kg, seletor com busca/filtros/detalhes, criação manual, resumos editáveis e equipamento por cartão. Identidade/referência e tempos persistidos com compatibilidade legada; exclusão ajusta o índice equipado. Suíte de 18 testes passou e fluxos de seleção, cópias, remoção, teclado, falha de carregamento e salvar/importar foram exercitados no navegador. Detalhes e limites em `docs/propostas/CATALOGO_ITENS_ARMADURAS.md`. Não há automação nova de penalidades ou expansão dos demais itens; nenhuma fase inteira é declarada concluída.

- **2026-11-05 — Proposta de catálogo de armaduras preparada (Fase 4):** investigação do cadastro atual e do seletor de magias, proposta em `docs/propostas/CATALOGO_ITENS_ARMADURAS.md` e JSON de exemplo com 12 armaduras. Pesos em kg com convenção métrica explicitada; conferência com o livro em português e implementação pendentes. Registrada no banco de ideias; não constitui tarefa de implementação aprovada nem conclusão da fase.

- **2026-10-22 — Registro do diagnóstico inicial:** localizado o roadmap oficial e os registros existentes; naquele momento, a investigação não modificou código nem executou testes, e a implementação/validação permaneciam pendentes. O estado posterior está registrado na entrada seguinte.
- **2026-10-22 — Correção de XP/Level Up implementada e validada:** alterados `js/data/racas-subclasses.js` e `ficha/Ficha_DnD_-_Tatagiba_1.0.html`; cenários manuais no navegador passaram. Sem suíte automatizada geral. Detalhes e resultados em `docs/BUG_REPORT.md`.
- **2026-10-22 — Round-trip de importação/exportação executado (Fase 3):** Thrain preservou os campos centrais e coleções estruturadas, mas três campos narrativos de equipamento não foram exportados. Waldo preservou os campos centrais, magias e equipamentos, mas seu espaço de magia nível 1 exportado/reimportado ficou em 0 apesar de 2 espaços totais e 0 usados. Validação geral reprovada; nenhuma correção de código feita. Originais preservados por hash; detalhes em `docs/BUG_REPORT.md`.
- **2026-10-23 — Conversão de espaços legados corrigida e validada:** `js/core/storage.js` converte `magiaNUsado` em `magiaNRest` com validação e preserva formato atual. Casos de níveis 1–9, inválidos, Waldo round-trip e Thrain passaram conforme registrados em `docs/BUG_REPORT.md`.
- **2026-10-23 — Comparação posterior dos campos narrativos de Thrain:** os três campos foram comparados com igualdade textual ordinal entre original, cópia temporária e export informado. A origem do export pela importação da cópia não foi comprovada; comparação aprovada, round-trip controlado pendente. O diagnóstico anterior permanece preservado em `docs/BUG_REPORT.md`.
- **2026-10-23 — Modal de ataque, transição entre etapas:** corrigida a hierarquia HTML de `modalAtaqueEtapaDado` e `modalAtaqueEtapaDano`; o usuário confirmou a transição visual e a estrutura inicial do DOM no Chrome. Testes de regressão de botões, registro de dano e novo ataque seguem pendentes; detalhes em `docs/BUG_REPORT.md`.
- **2026-10-23 — Triagem das listas antigas:** propostas ainda não aprovadas da área de magias foram consolidadas em `docs/TODO.md`; a timeline de combate existente foi conferida, e a validação de compatibilidade restante foi registrada nas próximas tarefas. Os documentos antigos permanecem como resumos históricos, não filas ativas.
- **2026-11-04 — Regras de D&D 5e e capacidade de carga formalizadas:** diretriz registrada em `ROADMAP.md` e `DECISOES_DE_ARQUITETURA.md`; a personalização aprovada limita-se ao multiplicador de capacidade de carga.
- **2026-11-04 — Proficiência e Expertise em validação:** diagnóstico e implementação inicial registrados em `docs/BUG_REPORT.md`; testes de cálculo e verificações estáticas passaram conforme os registros, enquanto interação e round-trip continuaram pendentes.
- **2026-11-04 — Truques e busca no catálogo de magias (`b5d446a`):** catálogo de nível 0 e busca adicionados; validação funcional específica ainda não registrada.
- **2026-11-05 — Persistência dos quatro estados de proficiência:** adicionados campos `pericia*Estado` e restauração compatível; testes isolados passaram, mas a validação pela interface e o round-trip real permanecem pendentes.
- **2026-11-05 — Validação manual principal de Proficiência e Expertise reportada pelo usuário:** exportação/importação de Waldo, quatro estados, bônus e indicadores visuais conferidos pelo usuário. Recálculos após mudanças, round-trip consecutivo, JSON legado e importação parcial ainda pendentes.

### Decisões e restrições de acompanhamento

- Preservar as cinco fases, seus objetivos, entregáveis, estrutura-alvo, critérios de sucesso e observações; não inferir conclusão sem evidência.
- Manter este arquivo como única fila oficial de tarefas aprovadas; `docs/TODO.md` pode conter apenas ideias não aprovadas e nunca deve duplicar tarefas ativas.
- Tratar os arquivos de código listados como pontos de partida, não como uma lista obrigatória de arquivos a modificar.
- Preservar regras de D&D, estruturas de dados, IDs, atributos HTML e compatibilidade com fichas existentes, salvo evidência que justifique uma mudança.
- Commits são manuais e ficam a cargo do responsável pelo projeto.

**Última atualização:** 2026-11-13 — E1.4 foi aprovada pelo responsável com ressalvas (parecer B), preservando o diagnóstico conservador e as limitações da E1.4-K. E1.5 e E1.5-F foram aprovadas pelo responsável com ressalvas: aviso de exportação limpo na importação válida, preservado no rollback; download não comprovado automaticamente e limpeza de URL Blob não validada em todos os navegadores. Foi registrada como pendente a melhoria de QA para capturar e validar exportação JSON com Playwright isolado. E1.6 permanece a próxima etapa, ainda não iniciada, e é responsável pelo backup automático. Permanecem também validação integrada/responsiva de munições, regressão integrada de armas, validação manual do arraste/round-trip e pendências anteriores de perícias, importação parcial, timeline e round-trip narrativo de Thrain. Nenhuma fase inteira foi concluída.
