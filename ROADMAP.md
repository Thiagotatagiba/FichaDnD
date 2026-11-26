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

### Proficiências de idiomas — implementação realizada; validação final pendente (Fase 4)

- **Estado:** Em andamento. A interface e a compatibilidade foram implementadas; a execução da suíte automatizada e o round-trip de arquivo JSON ainda não foram validados.
- **Interface:** a seção Idiomas usa tags sem botão de remoção direta e um botão `+` que abre um modal com 19 checkboxes (18 idiomas catalogados e “Outros”). Desmarcar uma opção no modal remove o idioma; as escolhas atuais são marcadas ao reabrir.
- **Idiomas personalizados:** “Outros” é a última opção e revela um campo que aceita vários nomes separados por vírgula. Duplicatas são ignoradas sem diferenciar maiúsculas de minúsculas.
- **Compatibilidade:** `textarea#proficienciaIdiomas` permanece oculto, preservando o ID e a serialização CSV existentes. O importador atualiza as tags depois de preencher esse campo. Nenhum JSON de personagem foi alterado.
- **Validação:** no navegador integrado, seleção, reabertura, desmarcação, tags, idiomas personalizados e viewport de 320 px foram verificados. `git diff --check` passou. O teste `tests/idiomas-proficiencias.test.cjs` foi criado, mas não executado porque Node não está disponível no ambiente; round-trip de JSON permanece pendente.

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
- **Testes:** além dos cenários registrados de XP/Level Up e da correção de espaços de magia legados, a persistência dos quatro estados recebeu verificações estáticas e testes isolados; o usuário também reportou um round-trip manual da ficha de Waldo com os quatro estados preservados. Em 2026-11-23, E1.7 foi aprovada com ressalva sobre download manual; E1.8 obteve 327/327 na suíte, 166/166 nos testes focados e validou cópias isoladas de Waldo e Thrain no Chromium. O round-trip de Thrain revelou perda real do escudo equipado e mantém G1 bloqueado. A confirmação final do download e a aceitação do limite conservador do rollback também dependem de avaliação humana.
- **Fases do roadmap:** nenhuma fase ou entregável é declarado concluído por este acompanhamento. A tarefa atual está relacionada à Fase 3 — Qualidade e confiabilidade, sem implicar que a fase esteja concluída.
- **E1.7:** aprovada pelo responsável em 2026-11-23, com ressalva registrada sobre confirmação manual do download. E1.8 aguarda avaliação; G1 continua pendente.

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
- **Estado:** E1.4 está formalmente aprovada pelo responsável com ressalvas, sem declarar integridade universal. E1.5 e E1.5-F estão formalmente aprovadas com as ressalvas acima. A implementação separa alterações pendentes, último backup local e última exportação solicitada; não trata o clique de download como confirmação; usa mensagens sem promessa de gravação; exclui alterações transitórias de modal; limpa URLs temporárias de Blob e limpa o aviso somente após importação válida. E1.6 e E1.6-F estão concluídas e aprovadas com ressalvas na seção abaixo; E2 não foi iniciada.

### E1.6 — Backup local automático (aprovada com ressalvas pelo responsável)

- **Escopo do plano:** armazenamento local apropriado, observação somente de alterações persistentes, debounce de 10 segundos, cópia versionada com identidade/data, tratamento de quota/indisponibilidade/corrupção, detecção ao reabrir com confirmação e separação do JSON exportado.
- **Implementação:** `js/core/backup-local.js` usa IndexedDB para evitar conflito com `resetarFicha()` (que limpa localStorage). Registros versionados usam escrita atômica, payload com `fichaSchemaVersion`, data ISO, envelope e checksum para corrupção acidental. A identidade usa IDs existentes quando disponíveis e, no formato atual sem ID estável, uma chave derivada de nome/jogador/raça. O debounce é de 10 s; timers são suspensos durante importação; após sucesso agenda o estado final e após rollback só agenda se a restauração/reconciliação foi verificada. Um diálogo acessível lista registros válidos e exige confirmação explícita; a restauração passa pelo preparador e aplicador transacional existentes. Backup não limpa alterações pendentes nem substitui exportação manual.
- **Armazenamento e retenção:** cópias são append-only, com deduplicação apenas de payload idêntico para a mesma identidade. Como o plano não define retenção/descarte, nenhum backup é apagado automaticamente. Falha de quota preserva os existentes e informa que o novo não foi salvo. Isso é conservador contra perda, mas armazenamento pode crescer até quota; revisão/manual descarte futuro depende de política aprovada.
- **Falhas e limites:** IndexedDB indisponível/bloqueado, quota, payload inválido e checksum divergente são tratados sem apagar a ficha nem anunciar sucesso. O checksum não é assinatura criptográfica. `pagehide` tenta concluir um backup pendente em modo best-effort; fechamento abrupto pode ocorrer antes da transação. O fallback de identidade pode colidir para personagens com nome/jogador/raça iguais; os backups não são aplicados automaticamente e exigem escolha/confirmação, mas um identificador persistente estável exigiria decisão de contrato futura. O payload reutiliza o coletor atual de exportação e, portanto, só cobre dados que esse coletor representa; round-trip de propriedades não coletadas continua sujeito às limitações já documentadas em E1.2.
- **Integração:** `storage.js` expõe snapshot persistente compartilhado com exportação e metadado do último backup em memória, sem limpar o dirty state ou a última exportação solicitada. `importacao.js` suspende/retoma o agendador em torno da transação. HTML e CSS adicionam status e diálogo de recuperação.
- **Testes automatizados:** `tests/backup-local.test.cjs` cobre criação/versionamento, deduplicação/identidades separadas, debounce, suspensão em importação, quota preservando registros, armazenamento indisponível/falha ao abrir, corrupção, confirmação/recusa, restauração pelo aplicador e falha. Testes de rollback cobrem agendamento só depois do sucesso e política após rollback. Na validação E1.6-F, a execução focal foi 82/82 (15 testes de backup + 67 de importação/rollback) e a suíte completa `node --test tests/*.test.cjs` passou em 237/237. `node --check` nos JavaScript/CJS modificados e `git diff --check` passaram.
- **Navegador:** Chromium integrado ao VS Code em origem HTTP local temporária `127.0.0.1:18028`, IndexedDB isolado por origem e personagens sintéticos. Foram executados: criar backup de A e confirmar registro; recarregar e localizar A; alterar para B; abrir recuperação e cancelar mantendo B/dirty intactos; reabrir, confirmar A e conferir campos/status/dirty; injetar falha após aplicação parcial e observar B restaurado, diagnóstico `CHARACTER_SHEET_ROLLBACK_UNVERIFIED`, aviso explícito de estabilidade não comprovada e registros de A/B ainda íntegros. Aguardou-se mais de 10 s; o status de falha permaneceu distinto do status de backup automático. A lista de recuperação não aplicou backup automaticamente. Não foi Chrome autônomo. Quota real, fechamento abrupto e `pagehide` concluído não foram validados.
- **E1.6-F — correções durante validação:** foi adicionado botão para reabrir o diálogo de recuperação depois de dispensar a sugestão inicial; opções/confirmação agora distinguem cópias com nome igual por raça e sufixo de referência; falhas de recuperação têm status separado que não é sobrescrito pelo status do backup; falta de identidade suficiente é ignorada sem registrar backup nem emitir erro enganoso. Testes cobrem falha `UNVERIFIED`/`FAILED` sem substituir a cópia íntegra e colisões de nome.
- **Estado:** E1.6/E1.6-F concluídas e aprovadas pelo responsável com ressalvas, com 237/237 testes e cenários de recuperação executados no Chromium integrado. Permanecem as limitações de Chrome autônomo, quota real, fechamento abrupto e retenção. E1.7/E2 não iniciadas.

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

### E1.6 — Backup local automático (aprovada com ressalvas pelo responsável, 2026-11-13)

- **Estado:** concluída e aprovada com ressalvas. A implementação usa IndexedDB, debounce após inatividade, registros identificados e verificados por checksum, recuperação manual com confirmação explícita e integração transacional que evita backups de estados intermediários. Backup local, alterações pendentes e exportação JSON permanecem independentes.
- **Evidências registradas:** suíte completa 237/237; testes focados 82/82; sintaxe e diff aprovados; nenhum JSON protegido alterado. Cenários de recuperação foram observados em Chromium integrado ao VS Code, com personagens sintéticos.
- **Ressalvas:** rollback integral após falha injetada continua não comprovado; preservar `CHARACTER_SHEET_ROLLBACK_UNVERIFIED`. Quota real, fechamento abrupto e conclusão de `pagehide` não foram validados. O navegador foi Chromium integrado, não Chrome autônomo. Backup local não substitui exportação JSON.
- **Próximo gate:** E1.7 permanece pendente e não iniciada nesta execução. E2 não foi iniciada.

### E2 — Combate (execução autorizada; em andamento)

- **Autorização:** execução autônoma prolongada autorizada pelo responsável em 2026-11-13. A autorização permite avançar na E2, mas não elimina os gates nem libera E3, commit, push ou merge. E1.7 continua pendente; este trabalho de E2 ocorre por autorização expressa e não declara G1 aprovado.
- **Escopo do plano:** E2.1 operações puras; E2.2 PV temporários/cura; E2.3 dano tipado; E2.4 resolução obrigatória de concentração; E2.5 vantagem/desvantagem; E2.6 fluxo unificado de testes. G2 exige cobertura de regras e concentração por testes e cenários de navegador.
- **Progresso técnico:** criado `js/domain/regras-combate.js` com cálculos puros de total d20, vantagem/desvantagem, PV em reservatórios separados e dano tipado. Adaptadores de ataque, iniciativa e salvaguarda usam o total d20 comum. Em E2.4, o modal protege contexto pendente, permite retorno ou abandono explícito, enfileira fontes distintas e usa token transitório por ativação para rejeitar teste obsoleto mesmo após recast da mesma magia. A flag pública de resolução foi substituída por token simbólico nos fechamentos internos.
- **Validação:** testes focados E2 `15/15`; rollback + regras combate `82/82`; suíte completa `252/252`. `node --check` nos módulos e teste alterados passou. Diff restrito aos arquivos desta execução passou; diff global aponta somente whitespace na alteração independente `docs/BUG_REPORT.md:10-12`, preservada. Em Chromium integrado ao VS Code, origem HTTP temporária isolada `127.0.0.1:18030`: Escape/retorno mantiveram modal, abandono explícito fechou e duas fontes sintéticas geraram salvaguardas sequenciais. Não é Chrome autônomo; o click físico Playwright expirou e o handler foi acionado programaticamente. Recast, bloqueio da flag pública e preservação da próxima fonte válida após item obsoleto foram testados em VM, não no browser.
- **Limitações e bloqueios:** os cálculos puros de PV ainda não estão ligados ao estado persistido. O legado combina `pvAtual` como vida atual total efetiva e `pvTemporario` como limite/excedente de representação visual; separar o modelo sem tradução definida pode perder PV válido em fichas existentes. A resolução de dano tipado ainda não tem alvo com resistências estruturadas nem fluxo de aplicação; nenhuma defesa é inferida. Vantagem/desvantagem está disponível apenas como cálculo puro, sem fontes persistentes ou integração contextual abrangente. O fluxo unificado E2.6 não foi iniciado. E2.2/E2.3/E2.5/E2.6 permanecem parciais ou pendentes; nenhum gate E2 está aprovado.
- **Estado do Git:** HEAD atual `e0ee249528f50c6667f50c82ac0879bb65f2fba2` é posterior ao checkpoint esperado `4a46c1016af8e382c1ea5f40467f0c4f53d52336`; o commit posterior `icones` contém as mudanças visuais dos ícones do inventário e foi preservado. Durante esta execução surgiu também uma alteração independente em `docs/BUG_REPORT.md`, que foi preservada e não incorporada à E2. Nenhum JSON protegido foi alterado. Não houve commit, push ou merge.
- **Atualização da revisão independente:** arquitetura e QA/segurança identificaram inicialmente a colisão nível/nome em recast da mesma magia; foi corrigida com ID efêmero por instância, sem persistência. Revisores finais não identificaram bloqueador nessa correção; recomendam ampliar depois o teste integrado da fila/modal no browser. E2.2/E2.3/E2.5 continuam apenas com operações puras e não são consideradas entregues; E2.6 não iniciada.
- **Revisões finais:** arquitetura e QA/segurança confirmam que o token transitório resolve a colisão de recast, a flag pública antiga não contorna o guard e o descarte individual preserva próximas fontes válidas; não altera persistência. Ressalvas: binding lexical não é isolamento contra script co-residente e fechamento legítimo com token real ainda não tem teste integrado; os testes usam VM/mocks, sem cobrir a fila completa com DOM/listeners reais.
- **Próximo gate recomendado:** completar uma validação integrada de confirmação/falha, fila e recast em E2.4; manter E2.2 bloqueada para integração persistente até resolver a compatibilidade do PV legado. E2 permanece parcial, G2 não aprovado e E3 não iniciada.
- **Seletor Mão Secundária / Escudo e Combate 2.0 (2026-11-16):** causa e correção descritas no registro existente em `docs/BUG_REPORT.md`; vestimentas usam o mesmo wrapper/template estrutural de escudo, e o filtro agora exige tipo real `Escudo`, preservando o índice original e rejeitando valor legado inválido. Em Chromium integrado ao VS Code 1.146 (Chrome 150.0.7871.250/Electron 43.8.6), ficha oficial em origem HTTP temporária isolada e personagem sintético: Roupas Finas e Anel de Sinete não aparecem, escudos +2/+1 aparecem; arma de uma mão + escudo produz CA 12, remoção volta a 10, troca de escudo atualiza para 11/12; Malho de duas mãos limpa mão secundária e desabilita opções incompatíveis; índice antigo de vestimenta é descartado sem bônus de CA. Backup local IndexedDB sobreviveu ao reload e restaurou personagem/slots/CA, mantendo o filtro. O botão Salvar mostrou exportação solicitada, porém não houve evento de download capturado e nenhum arquivo manual é declarado como salvo. Testes RED→GREEN do seletor 2/2; suíte completa 254/254; sintaxe e `git diff --check` passaram. `docs/BUG_REPORT.md` e `docs/codex/EXECUTION_STATE.md` atualizados sem duplicar a ocorrência. O protótipo autônomo `ficha/Codigos testes/Tela de combate.html` medido em 320/768/1024/1440 px permanece sem overflow; tem estrutura estática, sem JavaScript nem handlers nos botões de PV, e não foi conectado à ficha oficial. A correção localizada e a revisão do protótipo não aprovam gate E2.

### Decisões e restrições de acompanhamento

- Preservar as cinco fases, seus objetivos, entregáveis, estrutura-alvo, critérios de sucesso e observações; não inferir conclusão sem evidência.
- Manter este arquivo como única fila oficial de tarefas aprovadas; `docs/TODO.md` pode conter apenas ideias não aprovadas e nunca deve duplicar tarefas ativas.
- Tratar os arquivos de código listados como pontos de partida, não como uma lista obrigatória de arquivos a modificar.
- Preservar regras de D&D, estruturas de dados, IDs, atributos HTML e compatibilidade com fichas existentes, salvo evidência que justifique uma mudança.
- Commits são manuais e ficam a cargo do responsável pelo projeto.

**Última atualização:** 2026-11-16 — E1.4 foi aprovada pelo responsável com ressalvas (parecer B), preservando o diagnóstico conservador e as limitações da E1.4-K. E1.5 e E1.5-F foram aprovadas pelo responsável com ressalvas; a captura automatizada do download e a limpeza de URLs Blob em todos os navegadores continuam limitadas. A melhoria de QA para exportação JSON com Playwright isolado permanece pendente. E1.6 e E1.6-F foram aprovadas pelo responsável com ressalvas: suíte completa 237/237, focados 82/82, recuperação observada em Chromium integrado; permanecem as limitações de rollback integral em falha injetada, quota real, fechamento abrupto e `pagehide`. E1.7 permanece pendente. E2 está em andamento por autorização expressa: cálculos puros e concentração avançaram, mas não há subetapa E2 aprovada nem gate G2 concluído. E2.2 permanece bloqueada para integração persistente por ambiguidade do modelo legado de PV; E2.3/E2.5 não estão integradas e E2.6 não iniciada. E3 não iniciada. Permanecem também validação integrada/responsiva de munições, regressão integrada de armas, validação manual do arraste/round-trip e pendências anteriores de perícias, importação parcial, timeline e round-trip narrativo de Thrain. A validação integrada do seletor Mão Secundária / Escudo e a revisão responsiva/estática do protótipo foram registradas acima; não aprovam gate E2. Nenhuma fase inteira foi concluída.

### Registro da revisão e pendências do Combate 2.0 — 2026-11-19

- **Progresso registrado:** a interface experimental fiel ao protótipo foi integrada localmente ao conteúdo de `#combate`, reutilizando controles oficiais de PV, CA, iniciativa, mãos, ataques, magias, condições, concentração e histórico. O seletor de armas é preenchido também em fichas inicialmente sem arma marcada; filtro de escudos, modo versátil, estado de duas mãos, ícones centralizados, histórico abaixo das ações e aba “Outras ações” com registro foram cobertos por código/testes ou registros anteriores. Isso não significa que todos os fluxos estejam validados no navegador nem que E2/G2 esteja aprovado.
- **Diagnóstico de PV temporários:** `8/8 PV + 3 temporários` permanece como dois valores distintos. Cura não excede o máximo normal; dano consome temporários antes dos PV normais. Isso segue o modelo D&D 5e e não é bug.
- **Bug de regra em aberto:** em ataque marcado como ação bônus, a função de dano remove o modificador de atributo por completo. No ataque adicional de duas armas, D&D 5e 2014 mantém o modificador negativo. A correção precisa distinguir esse caso de outros ataques de ação bônus. Registro em `docs/BUG_REPORT.md`; análise completa em `docs/propostas/REVISAO_PENDENCIAS_COMBATE_2026-11-19.md`.
- **Validação atual:** execução `node --test tests/*.test.cjs` em 2026-11-19 terminou com 203/210 aprovados e 7 falhas. Uma falha é uma expectativa textual rígida de CSS do card de iniciativa; seis falhas acontecem ao carregar o harness de rollback, que procura `coletarOutros()` e interrompe antes de executar esses casos. Não se declara gate de regressão aprovado até atualizar o harness/expectativas e repetir a suíte.
- **Pendências priorizadas:** (4) corrigir e testar o modificador negativo em ataque de duas armas; resolver a suíte vermelha. (3) validar ataque/fracasso/cancelamento e consumo de munição em navegador; conectar ataque desarmado; restaurar escolha explícita FOR/DES para armas com Acuidade; decidir como acompanhar economia de ações. (2) prévia e reformulação visual do modal; botão de desequipar; clareza visual da empunhadura versátil; (1) padronização final dos botões e polimento responsivo/teclado. Detalhes, limites e evidências estão no relatório vinculado acima.
- **TODO:** nenhuma ideia atualmente listada em `docs/TODO.md` foi concluída ou promovida por esta revisão. Os rascunhos foram preservados e receberam somente uma nota de status.
- **Estado:** E2 continua parcial; G2 não aprovado; E3 não iniciada. Nenhuma alteração funcional foi feita nesta revisão documental. Alterações preexistentes no workspace foram preservadas.

**Última atualização do Roadmap:** 2026-11-19. A atualização acima complementa os registros históricos sem reclassificar gates nem encerrar E2.

### Retomada contínua supervisionada — 2026-11-24

Esta atualização supersede estados anteriores que ainda apontavam a perda do escudo/armadura de Thrain como reproduzida após a conclusão da importação. O Chromium isolado confirmou que aquela leitura ocorreu antes de o fluxo terminar. Com a correção do coletor de armaduras, o round-trip concluído seleciona a Armadura de Couro no índice legado 0, mantém CA da armadura 13, CA total 15 e Escudo de Aço +2; exportação coletada e reimportação tiveram zero diferenças. O teste de regressão exclui apenas `#armaduraModelo` da coleção real.

**E1.8:** critérios técnicos demonstrados em Chromium e testes automatizados. Thrain e Waldo foram exercitados em cópias isoladas; Waldo manteve seu escudo vazio legado sem alteração, e ambos estabilizaram após a normalização/migração esperada. Suíte completa no estado estabilizado: 333/333; focados de caminhos/catálogos/rollback: 89/89; seletor 8/8; escudos 6/6; 81 verificações `node --check`; `git diff --check` aprovado. A gravação do download não pode ser comprovada pelo harness. `CHARACTER_SHEET_ROLLBACK_UNVERIFIED` segue conservador e sem divergência observada, mas sem prova de drenagem de todos os escritores externos.

**Manutenção de dados concluída:** os dez JSONs de magia estão em `assets/data/magias/`; a pasta de classes está em `assets/data/classes/`. Consumidores e referências internas foram atualizados. Os hashes dos 22 JSONs foram iguais antes/depois; Chromium carregou todos os dez níveis e dados de Clérigo pelo novo caminho. O teste estrutural evita regressão de pasta/caminho.

**Agentes e manutenção restante:** `.agents/skills/` e `.codex/` permaneceram nos caminhos de descoberta. A busca local encontrou referências aos perfis Markdown em `AGENTS.md`, `README_INSTALACAO.md` e `PROMPT_INICIAL.md`; como o uso externo do caminho legado não pode ser confirmado nesta sessão, a consolidação em `docs/agentes/` foi planejada, mas adiada, sem apagar nem mover os perfis. RAG foi considerado desnecessário para o conjunto pequeno de documentos versionados e pesquisáveis.

**Gates e pendências:** E1.8 aguarda formalização humana; G1 não foi aprovado. Recomendação técnica para avaliação do responsável: aprovar G1 com exceções documentadas para download manual e `CHARACTER_SHEET_ROLLBACK_UNVERIFIED`, caso aceite os limites. Nenhuma tarefa E2 foi iniciada nesta retomada; E2.1 segue parcial, G2 não aprovado. O overflow móvel do Combate 2.0 permanece tarefa independente e sem mudança visual nesta execução.

**Próxima fila:** (1) decisão humana sobre E1.8/G1; (2) confirmação de consumidores externos antes de consolidar os perfis Markdown; (3) após aprovação de G1, retomar a próxima unidade elegível de E2 conforme dependências e autorização do gate. Sem commit, push, merge ou deploy.

**Preservação de diffs locais:** alterações independentes em ícones de munição, revisão dos seletores de escudo/combate, sincronização de munição e testes associados foram observadas durante a retomada. Não foram descartadas nem incorporadas às alterações de E1.8/dados; a suíte final 333/333 foi executada com todo esse estado local presente.

**Última atualização do Roadmap:** 2026-11-24 — atualização documental e evidências em [docs/codex/EXECUTION_STATE.md](docs/codex/EXECUTION_STATE.md).

### Continuidade E2.1 — modificador de dano em ataque bônus (2026-11-19)

- **Correção local:** extraído para `RegrasCombate.calcularBonusDanoEfetivo()` o cálculo puro do modificador de dano, separado da leitura do estado do modal. A regra da luta com duas armas é aplicada pelo adaptador somente quando o ataque vem da mão secundária e há armas distintas selecionadas nas duas mãos: modificador positivo é omitido e negativo é conservado. Ataques bônus de outra origem preservam o comportamento anterior.
- **Cobertura:** novo teste em `tests/regras-combate.test.cjs` valida modificadores positivo/negativo, mão principal, mão vazia, escudo secundário e origem mágica. `node --test tests/regras-combate.test.cjs` — **19/19 aprovados**; `node --check` nos três arquivos JavaScript/CJS tocados e `git diff --check` restrito aos arquivos da unidade passaram.
- **Suíte atual:** `node --test tests/*.test.cjs` — **203/212 aprovados, 9 falhas**: três expectativas/ordenações de CSS da integração visual e seis casos de importação interrompidos pelo harness que não encontra `coletarOutros()`. Essas falhas não foram corrigidas nesta unidade e impedem considerar a regressão global verde.
- **Limites:** E2.1 permanece em andamento; a elegibilidade normativa completa (propriedade Leve/possíveis características que ampliem a regra) e o fluxo visual ponta a ponta não foram validados no navegador. E2.2 tem agora integração de PV temporários no código local e cobertura focada registrada na execução recente, mas o gate G2 continua não aprovado. E2.3 e E2.5 ainda não têm integração aos fluxos de dano/rolagem; E2.4 precisa validação integrada de modal/fila/recast; E2.6 não foi iniciada. Próximo passo seguro: completar validação de E2.1/E2.4 em browser sintético e escolher a próxima integração de regra que não dependa de um contrato persistente inexistente.

### E2.1 / E2.4 — validação complementar (2026-11-19)

- **E2.1 — combate com duas armas:** cálculo do modificador de dano e elegibilidade foram ampliados para verificar armas distintas, corpo a corpo, uma mão e propriedade Leve. Ambidestro só é reconhecido quando a característica aparece explicitamente nos dados existentes; permite a exceção de armas de uma mão não leves. A característica de estilo de luta permite o modificador positivo de dano, mas não altera a elegibilidade da regra. Armas de duas mãos e à distância não qualificam. Não foi criada persistência nem formato JSON novo.
- **Evidência funcional em Chromium integrado:** ficha sintética vazia, sem JSON pessoal; equipadas Clava e Maça por meio dos controles oficiais. O ataque bônus secundário com modificador positivo mostrou dano sem somar o modificador (+0); com modificador negativo (−2), o resumo preservou −2. Maça ficou indisponível na mão secundária sem Ambidestro e disponível após registrar a característica sintética; estilo “Ataque Duas Armas” restaurou o modificador positivo. A característica foi usada apenas na cópia sintética.
- **Regras de elegibilidade:** testes puros verificam Leve, corpo a corpo, uso com uma mão, rejeição de arma à distância e de duas mãos, exceção explicitamente nomeada de Ambidestro e texto de requisito especial de duas mãos. O estado de montaria não existe nessa integração; um requisito especial que dependa de montaria não foi habilitado automaticamente.
- **Limite E2.1 encontrado por inspeção:** o adaptador identifica slot secundário, duas armas distintas, elegibilidade e tipo “Ação bônus”, mas o projeto não registra se a ação Ataque com uma arma elegível já foi realizada neste turno. Assim, a condição sequencial da regra 2014 ainda não é validada automaticamente. Integrar esse pré-requisito depende do estado/consumo de ações do turno (E2.6); manter E2.1 parcial até haver uma decisão e teste sem estado paralelo.
- **E2.4 — concentração:** no navegador, o fluxo oficial “Registrar dano” → “Aplicar dano” reduziu PV 8→7 e abriu a salvaguarda oficial de CON. Com PV temporários 3, o mesmo fluxo absorveu 1 ponto (temporários 3→2; PV regular permaneceu 7), abriu a salvaguarda e, após total 15, manteve a concentração. Completam a evidência os testes de CD por fonte, sucesso/falha/abandono, fechamento/Escape sem descarte, fila de fontes, recast e resposta obsoleta. Os critérios específicos da E2.4 no plano foram verificados; E2.4 concluída nesta rodada. Isso não aprova o gate G2 nem conclui E2.
- **Testes:** node --test tests/regras-combate.test.cjs tests/seletor-equipamentos.test.cjs — 26/26 aprovados. node --check nos módulos e testes tocados — aprovado. git diff --check — aprovado antes da atualização documental.
- **Suíte completa:** node --test tests/*.test.cjs — 203 aprovados / 14 falhos em 217. O checkpoint limpo usado como comparação tinha 195/204, com seis falhas do harness E1.4 e três falhas independentes (uma expectativa de ordem de manifest e duas do seletor). As duas falhas do seletor agora passam. No estado atual permanecem seis falhas do harness de rollback e oito expectativas de integração visual em tests/combate-2.0-integracao.test.cjs (escudo, espelhamento, cards de mãos, PV, iniciativa, isolamento CSS, campos compatíveis e ordem de manifest). A falha do manifest já aparecia na linha de base; as sete demais expectativas visuais não apareciam nela. Não se conclui que sejam regressões causadas por esta unidade E2.1: o código/estilos de Combate 2.0 são trabalho anterior, mas são divergências atuais que requerem revisão própria.
- **Estado:** E2.1 segue parcial até completar seus critérios do plano; E2.4 concluída com evidência automatizada e integrada descrita acima. E2 e G2 não concluídos/aprovados; E3 não iniciada.
- **Git:** branch main, HEAD observado eeb809abeb5f489f2331b77b5ffb720172c7e737. O HEAD avançou durante esta execução sem comando de commit emitido por mim. A alteração local pendente em tests/seletor-equipamentos.test.cjs foi preservada. Nenhum push, merge ou deploy foi realizado.

### E1.7 — Lembrete de exportação e proteção de saída (aprovada com ressalva)

O listener `beforeunload` foi centralizado em `js/core/storage.js`, condicionado a alterações persistentes e registrado uma única vez; a mensagem é deixada ao navegador. Um intervalo único de 30 minutos atualiza a região acessível `#exportacaoStatus` apenas quando o estado atual diverge do snapshot da última exportação solicitada. A interface não usa modal/alert e não afirma que o download foi salvo. Os testes focados passaram em 164/164, a suíte completa passou em 324/324 e, no Chromium integrado, a navegação limpa não apresentou diálogo, a edição persistente emitiu o diálogo nativo `beforeunload`, foi contado um listener, e o lembrete apareceu após edição posterior à solicitação com timer acelerado somente na aba de teste. A constante de produção permaneceu em 1.800.000 ms. O evento `download` não foi exposto pelo navegador integrado; o estado permaneceu como solicitação, sem confirmação. Duas cópias locais sintéticas `E1.7 QA` criadas pelo debounce foram removidas por IDs verificados e os demais IDs de backup permaneceram iguais. E1.7 foi aprovada pelo responsável em 2026-11-23 com ressalva sobre confirmação manual do download. Detalhes, comandos e ressalvas em `docs/codex/EXECUTION_STATE.md`. O overflow móvel do Combate 2.0 continua como pendência separada e não foi alterado.

**Última atualização:** 2026-11-23 — E1.7 aprovada pelo responsável com ressalva sobre confirmação manual do download. E1.8 validada tecnicamente e aguarda avaliação; G1 não foi aprovado.

### E1.8 — Validação integrada da E1 (2026-11-23; aguarda avaliação)

Na rodada final, cópias isoladas das fichas de referência Waldo (v1) e Thrain (v0) foram importadas/exportadas no Chromium. Os arquivos originais permaneceram intocados e seus SHA-256 conferem com os valores antes da execução. Waldo migrou e, após canonicalização da classe, repetiu round-trip sem diferenças nos 246 campos; PVs, nove níveis de espaços de magia, narrativas, personalizações e coleções foram conferidos. Thrain preservou PV 58/58/0, espaços, campos narrativos, metadados e coleções na comparação da exportação com a reimportação. Porém, a comparação origem→export detectou perda real do escudo equipado: `arma2Nome`/`escudoNome` ficaram vazios, `escudoCA` caiu de `+2` para `+0` e CA total de 15 para 13. A coleção de escudos permaneceu, mas o estado equipado não. O teste demonstrou estabilidade de uma exportação/reimportação já degradada; isso não satisfaz preservação semântica.

Dois defeitos comprovados já foram corrigidos dentro da E1.8: exportação perdia propriedades opacas de raiz, e os cálculos de nível 1 sobrescreviam PVs persistidos durante a importação. Foram adicionados testes de regressão. Esta rodada rastreou a perda do escudo secundário ao fluxo `resolverIndiceArmaSalva()` seguido por `sincronizarEquipamentosCombate()`: o importador resolve o índice legado `__escudo__0`, mas a sincronização limpa a seleção quando o registro não está marcado no painel. O defeito foi documentado, não corrigido nesta rodada, e bloqueia G1 até uma correção mínima com regressão e novo round-trip da cópia de Thrain.

Validação: testes focados **166/166**, suíte completa **327/327**, `node --check` em 80 arquivos JS/CJS e `git diff --check` aprovados. `CHARACTER_SHEET_ROLLBACK_UNVERIFIED` continua sendo limitação conservadora: a restauração e a verificação observada passaram, sem divergência constatada, mas não há prova de que todos os callbacks/escritores assíncronos estejam drenados; o diagnóstico não deve ser enfraquecido. O Blob e a solicitação de download foram observados; somente interação humana pode confirmar o diálogo nativo, o arquivo fisicamente salvo e seu conteúdo no destino escolhido. **G1 fica recomendado como bloqueado** pela perda do escudo equipado, além da decisão humana pendente sobre download e aceitação da ressalva de rollback. Overflow móvel do Combate 2.0 e alterações de favicon permanecem fora desta etapa.

**Última atualização:** 2026-11-23 — E1.8 aguarda avaliação do responsável. Não iniciar E1.9, E2 ou outra etapa automaticamente.

### Complemento E1.8 — preservação do escudo equipado de Thrain (2026-11-23)

Defeito corrigido: `coletarEscudos()` incluía o template oculto `#escudoModelo` na coleção e deslocava os índices legados; `__escudo__0` apontava para o template vazio. A sincronização também não reconciliava marcas antigas de escudo quando o slot secundário era alterado. A coleta exclui o template e `sincronizarMarcacaoArmasPorSlots()` agora marca o escudo efetivamente selecionado, limpando marcas residuais para arma ou slot vazio.

Regressões comprovadas com testes red/green. O Chromium isolado confirmou round-trip da cópia Thrain com `Escudo de Aço`, `escudoCA +2`, índice legado `__escudo__0` e CA 14 estável entre exportação e reimportação. Uma cópia variante preservou Adaga na mão secundária sem escudo marcado; outra preservou o slot vazio. Waldo manteve PV 11/11/0, espaços de magia, narrativas, talentos e coleções. Os hashes SHA-256 dos originais e cópias isoladas permaneceram iguais. Suíte focada **173/173**, completa **329/329**, `node --check` em 83 arquivos e `git diff --check` aprovados.

Limite descoberto e fora desta correção: Thrain tem armadura legada equipada no índice 0, mas sua seleção não é restaurada na importação; o primeiro CA é 14 em vez do valor de origem 15. Reaplicar armadura 0 restaura CA 15. O escudo e sua contribuição de +2 estão preservados, mas esta pendência de armadura requer avaliação separada para declarar round-trip integral da CA. O download físico segue dependente de confirmação humana, e `CHARACTER_SHEET_ROLLBACK_UNVERIFIED` permanece uma limitação conservadora sem divergência de restauração observada. Não aprovar G1 automaticamente nem iniciar E2.

### Revisão de segurança da integração e pendência de Waldo (2026-11-24)

A revisão independente confirmou a integridade dos 22 JSONs movidos e dos JSONs originais de Thrain/Waldo. Ela revelou que o importador filtrava o escudo vazio legado e convertia tipos desconhecidos em `Escudo`. Após confirmação de que os ajustes manuais haviam terminado, ambos foram corrigidos sem alterar o contrato: a entrada vazia permanece como card sem bônus e tipos desconhecidos recebem opção temporária preservada no campo. Teste de regressão reproduziu a falha anterior e agora cobre vazio, tipo customizado, metadados e alias legado. Chromium em origem isolada confirmou Waldo com quatro escudos em três ciclos, com zero diferenças semânticas no segundo→terceiro round-trip após a regeneração esperada dos caches de classe/subclasse; PV 11/11/0, nove níveis de espaços e o placeholder vazio permaneceram. Uma variante em memória com escudo customizado manteve cinco itens após reimportação. A Funda manteve sincronizados o seletor visível e o campo persistido após adicionar segunda pilha e trocar a seleção. Focados passaram 118/118, suíte completa 334/334 e `node --check` em 81 arquivos. `git diff --check` passa nos arquivos funcionais/documentais desta rodada; a verificação global registra uma linha em branco ao fim de `docs/TODO.md`, em edição local independente preservada. E1.8 satisfaz tecnicamente os critérios exercitados, mas G1 continua aguardando avaliação humana pelo download físico e pelo limite conservador de rollback. A cobertura automatizada end-to-end da armadura de Thrain permanece como risco, embora o round-trip no Chromium tenha passado; E2 continua condicionada ao gate.

### Decisão formal G1 e retomada de E2 (2026-11-24)

O responsável pelo projeto aprovou formalmente G1 em 24/11/2026, com ressalvas aceitas. A decisão considera as evidências de E1.8 registradas acima e nos relatórios da execução: testes automatizados, importação/exportação/rollback, round-trips em cópias isoladas de Thrain e Waldo e integridade dos JSONs originais. A aprovação não converte os itens ressalvados em testes aprovados.

Ressalvas mantidas: (1) confirmar manualmente que o download foi gravado e pode ser recuperado; (2) `CHARACTER_SHEET_ROLLBACK_UNVERIFIED` continua conservador, pois não há prova de encerramento de todos os writers assíncronos externos. Não afirmar atomicidade integral.

A autorização atual permite execução técnica contínua da E2 conforme dependências. E2.1–E2.6 serão reconciliadas com o código e avançadas em unidades verificáveis. O gate G2 permanece pendente de evidências e aprovação formal humana. Não avançar para E3 antes dessa decisão.

### Atualização de execução E2 — 2026-11-24

Esta atualização complementa o registro formal anterior, preservando os apontamentos históricos. G1 está aprovado formalmente com as ressalvas de download físico e rollback conservador; G2 permanece pendente de aprovação humana.

- **E2.2:** teste de integração adicional percorre importação, exportação e reimportação sintéticas e comprova PV atual, máximo, temporário e metadados. No Chromium isolado, os pools permaneceram íntegros; dano consome PV temporários primeiro e cura respeita o máximo regular.
- **E2.3:** dano tipado integrado ao modal, PV, histórico e concentração. Resistência, vulnerabilidade, imunidade e cancelamento são resolvidos pelo valor final. Nomes com/sem acento e alias `congelante` são normalizados para tipo canônico `frio`. Entradas do modal são transitórias e não persistem. A unidade segue parcial por ausência de modelo estruturado de defesas por alvo para outras fontes de dano.
- **E2.4:** Chromium confirmou salvaguarda de concentração obrigatória, abandono explícito, sucesso/falha e fila por fonte, incluindo troca de instância.
- **Qualidade:** testes focados **106/106**; suíte completa **337/337**; `node --check` nos arquivos JS/testes envolvidos e `git diff --check` concluídos. Git apresentou avisos de normalização LF/CRLF sem erro de whitespace.
- **Preservação:** 22/22 JSONs movidos de magia/classe permanecem byte a byte idênticos aos blobs de HEAD; nenhum JSON original de personagem foi alterado. Ajustes preexistentes de munições, escudos, ícones e caminhos foram preservados.

Detalhes e identificadores dos dois backups sintéticos de QA mantidos no IndexedDB, além dos limites por unidade e evidências técnicas, estão em [docs/codex/EXECUTION_STATE.md](docs/codex/EXECUTION_STATE.md). Próxima fila: completar a modelagem e integração E2.5, depois E2.6; E2.1 e E2.3 ainda têm pontos de integração pendentes. O overflow móvel do Combate 2.0 permanece separado.

**E2.5 — fatia inicial:** foi adicionado resolvedor puro contextual com filtro de escopo e fonte manual transitória. A regra 2014 é resolvida pela presença de vantagem/desvantagem, preservando fontes para explicação e sem acumular múltiplas fontes. A revisão independente encontrou e ajudou a corrigir comparação de caixa em escopos de perícia. Cobertura adicional de fonte global, inativa e inválida; foco **107/107**, suíte completa **338/338** e `git diff --check` aprovados. Isso não conclui E2.5: faltam integração real com ataques, salvaguardas, perícias e passivas, além de fontes persistentes/automáticas com round-trip e rollback seguros. Não foi criada uma estrutura paralela de condições/efeitos; fontes derivadas disso aguardam o modelo da E3.

### Continuidade E2 — checkpoint atualizado (2026-11-24)

G1 está aprovado formalmente com as ressalvas registradas em `EXECUTION_STATE.md`; G2 não está aprovado e E3 não foi iniciada. Este checkpoint complementa/supersede os status históricos acima, sem removê-los.

- **E2.5 — atendida tecnicamente para os modelos atuais:** fontes manuais persistentes e fontes automáticas derivadas de equipamento; escopos e aliases de perícia; motivo contextual; regra 2014 de cancelamento sem acumular fontes; ataques, salvaguardas, perícias, histórico e passivas ±5. O ID real `pericia:lidaranimais` converge para o escopo canônico de “Adestrar Animais”. Estado salvo aceita somente duração persistente e `ativo` booleano; fontes equipadas são derivadas e não serializadas. Mutadores bloqueiam durante importação. Mudanças de contexto limpam d20/resolução e descartam callback assíncrono obsoleto. QA independente confirmou correções e não encontrou defeito novo; não havia listener duplicado identificado.
- **E2.6 — atendida tecnicamente:** fluxo de perícia e salvaguarda compartilha modal/resolvedor; bônus de perícia inclui proficiência/expertise e ajuste transitório negativo sem gravar na ficha; concentração obrigatória permanece protegida; histórico registra rolagem e total. Chromium em `modo=branco` mostrou o modal real de Lidar com Animais e seus controles V/D e de bônus situacional.
- **E2.1 — parcial:** cálculos puros e regra de dano da mão secundária têm cobertura; falta validar que a ação Ataque elegível foi realizada antes da ação bônus. O estado de turno atual não contém esse dado. Não criar contador persistente paralelo sem modelo coerente.
- **E2.3 — parcial:** dano tipado está integrado a PV/histórico/concentração da ficha com defesas manuais transitórias; falta alvo estruturado com suas defesas para integração a dano de armas, magias e efeitos dirigidos a inimigos. Não inferir por descrição livre nem aplicar dano ao personagem errado.
- **E2.2/E2.4:** tecnicamente atendidas pelos registros e evidências anteriores.

**Verificações finais:** testes focados — **167/167**; `node --test tests/*.test.cjs` — **351/351** em Node v24.14.0; `node --check` — 81 arquivos JS/CJS, aprovado; `git diff --check` nos arquivos da unidade — aprovado (avisos somente de LF/CRLF). Revisão de regras D&D 5e 2014 não encontrou divergência concreta. Testes adicionais cobrem escopos de perícia real, duração/ativo, mutação durante importação, setter estrito, invalidação de fontes e mudança do seletor manual.

**Próximo ponto:** E2 não está tecnicamente concluída por E2.1 e E2.3; G2 continua pendente de evidências e aprovação humana. Reavaliar se os critérios restantes cabem na arquitetura existente sem criar estado de ação/turno paralelo nem alterar o contrato/modelo de alvo. Se não couber, documentar dependência técnica e manter o bloqueio localizado. O overflow móvel do Combate 2.0 segue em tarefa separada e não foi alterado. Sem commit, push, merge ou deploy.

### Continuidade E2.3 — ataques com defesas manuais de alvo (2026-11-24)

- O modal de dano de arma/magia aceita resistências, vulnerabilidades e imunidades manuais, sem armazenar dados de inimigos nem alterar o JSON da ficha. A mesma operação pura calcula o dano final; histórico mostra bruto, ajuste e final, inclusive imunidade com final zero.
- Revisão independente encontrou e corrigiu tipo de dano mágico camelCase ausente, dano negativo sob modificador, histórico sem ajuste visível, cancelamento não explicado e alias camelCase aninhado em efeitos de magia.
- Chromium em ficha sintética `modo=branco` confirmou Clava com dano 9 contra resistência a Concussão e registrou 4 finais, 9 bruto e ajuste aplicado; os PV do personagem sintético permaneceram inalterados.
- E2.3 está tecnicamente atendida para dano recebido, ataques de armas e magias/efeitos que usam o fluxo de dano já existente. Defesas de alvo são manuais porque o projeto não tem entidade estruturada de inimigo; nenhum efeito é inferido por texto. E2.1 continua parcial pela ausência de estado de turno que valide a ação Ataque antes da ação bônus de duas armas. Essa dependência não será contornada com estado paralelo.
- Testes focados `regras-combate` + `magias-efeitos`: 52/52. Resultados anteriores a esta última regressão: E2 focados 169/169 e suíte 353/353; a nova rodada completa final ainda está pendente. Verificações estáticas anteriores: 81 arquivos JS/CJS em `node --check`, `git diff --check` aprovado.
- G1 continua aprovado com ressalvas aceitas; G2 permanece aguardando critérios técnicos completos e decisão humana; E3 não iniciada. Sem commit, push, merge ou deploy.

### Resultado final — rodada E2.3 (2026-11-24)

- Foco ampliado `regras-combate`, `magias-efeitos`, `importacao-preparacao` e `importacao-rollback`: **183/183**; suíte completa `node --test tests/*.test.cjs`: **354/354**.
- `node --check` em 81 arquivos JS/CJS sem falhas; `git diff --check` aprovado, somente avisos Git LF/CRLF.
- QA e especialista D&D 5e 2014 revisaram o patch final e não encontraram defeito concreto restante. Chromium em ficha sintética confirmou o resultado visível de resistência em ataque de arma. Nenhum JSON original foi aberto ou modificado.
- E2.3 tecnicamente atendida para dano recebido, armas e magias/efeitos que usam o fluxo existente; exceções de defesa do alvo são informadas manualmente e não fazem parte do JSON.
- E2.1 continua parcialmente bloqueada pela ausência de estado confiável que comprove a ação Ataque antes da ação bônus. Persistir estado paralelo ou alterar o contrato de combate sem modelo não é seguro. E2.2, E2.4, E2.5 e E2.6 tecnicamente atendidas conforme evidências anteriores.
- Assim, E2 ainda não está tecnicamente concluída e G2 não deve ser levado à aprovação. E3 não iniciada. Ponto de retomada: definir modelo de sequência de ações do turno ou obter decisão explícita de aceitar essa limitação no aceite de E2.1. Overflow móvel permanece separado. Sem commit, push, merge ou deploy.

### E2.1 — concluída tecnicamente (2026-11-24)

O estado de combate agora registra e consome ação, ação bônus, reação e movimento em pés; reinicia recursos no novo turno/rodada e persiste/restaura `recursosTurno` por exportação, importação, recarga e rollback, mantendo compatibilidade com fichas antigas sem esse campo. A ação Ataque qualificadora é exigida antes do ataque bônus de duas armas. O estado retém todas as mãos usadas nos ataques qualificadores para suportar Ataque Extra 2014 com ambas as armas; os ataques bônus precisam usar uma mão oposta a algum ataque qualificante. `Ambidestro` permite o par não leve conforme o talento local, mas armas de duas mãos permanecem inelegíveis. Ataques adicionais são limitados à mesma ação Ataque e à progressão derivada da classe.

Tentativas de ataque que já receberam um d20 não podem ser descartadas gratuitamente: confirmação de acerto consome recursos antes da etapa de dano; falha é registrada como tentativa; cancelamento após informar um d20 consome ação/munição e deixa anotação no histórico. Regressões cobrem recursos, mãos qualificadoras, Extra Attack, round-trip, importação antiga, rollback e cancelamento. Não houve alteração do visual aprovado do Combate 2.0; o HUD existente recebeu apenas os controles funcionais autorizados.

Evidências: testes focados **175/175**; suíte completa **360/360** em Node v24.14.0; `node --check` nos seis módulos e três arquivos de teste envolvidos; `git diff --check` limpo. No Chromium isolado, ação/bônus/reação foram consumidas e desabilitadas, 10 ft reduziram o restante de 30 para 20 ft e o avanço para rodada 2 restaurou os recursos. Revisões independentes de QA e regras D&D 5e 2014 confirmaram o tratamento das mãos e o consumo no cancelamento, sem bloqueador concreto restante.

Limites para avaliação humana: o controle de reação/rodada acompanha uma única ficha, não a iniciativa completa do grupo; Ataque Extra é derivado dos dados locais estruturados/textuais e não é inferido de características sem progressão codificada; características/itens sem metadados de custo usam os controles manuais, sem inferência ou mudança de contrato de munições/poções. G1 segue formalmente aprovado com ressalvas; E2.1 está tecnicamente concluída; os registros E2.2–E2.6 permanecem conforme suas evidências e limites descritos no `EXECUTION_STATE.md`. O dossiê técnico de G2 foi preparado para avaliação do responsável, com estas limitações anexadas. **G2 não está aprovado; E3 não iniciada.** Overflow móvel continua pendência separada. Nenhum JSON original foi modificado e não houve commit, push, merge ou deploy.

### Decisão formal de G2 — 2026-11-24

**Gate:** G2 — **APROVADO FORMALMENTE COM RESSALVAS**, em 24/11/2026, por aprovação humana explícita do responsável pelo projeto. A decisão encerra E2 para fins de governança e aceita as ressalvas abaixo sem declarar sua resolução. Esta entrada supersede os checkpoints anteriores que registravam G2 pendente ou não aprovado; o histórico e suas evidências permanecem preservados.

**Evidências reportadas no dossiê técnico de E2, não reexecutadas nesta atualização documental:** suíte completa 360/360; testes focados 175/175; verificação de sintaxe em 9 arquivos; validação funcional no Chromium; regressões de persistência, restauração, importação e rollback; e revisão independente, com os problemas identificados em E2.1 corrigidos conforme registrado acima. Esses números são evidências consideradas pela decisão humana, não resultados de uma nova rodada de testes.

**Ressalvas aceitas e ainda abertas:** (1) a iniciativa acompanha uma única ficha, não o grupo inteiro; (2) recursos sem metadados estruturados dependem de classificação/controle manual; (3) a verificação de que o JSON exportado foi fisicamente gravado e pode ser recuperado continua pendente, conforme ressalva de G1; (4) `CHARACTER_SHEET_ROLLBACK_UNVERIFIED` continua sendo uma advertência conservadora, sem garantia de atomicidade integral enquanto não houver evidência de encerramento de todos os escritores assíncronos externos; (5) alterações locais preexistentes, inclusive os JSONs originais de personagens, devem ser preservadas. Permanecem também as demais limitações e riscos por unidade já documentados, incluindo defesas de alvo informadas manualmente, derivação limitada de Ataque Extra e overflow móvel do Combate 2.0 como pendência separada. Nenhuma ressalva foi convertida em teste aprovado ou declarada resolvida por esta decisão.

**Estado e próximo passo:** E2 encerrada para fins de governança. E3 é a próxima etapa do plano, mas está **NÃO INICIADA — bloqueada até autorização humana explícita específica**. A aprovação de G2 não autoriza implementação de E3 nem aprova automaticamente qualquer outro gate. Não houve alteração de critérios ou evidências retroativas.

### Autorização formal e retomada da E3 — 2026-11-24

O responsável autorizou formalmente iniciar e implementar E3 após a aprovação de G2, sem autorizar o G3 nem a E4. Esta entrada supersede o estado anterior “E3 não iniciada — aguardando autorização”, preservado como histórico. Escopo mantido exatamente no plano: E3.1 instâncias de efeitos persistentes; E3.2 condições/efeitos separados com projeção legada; E3.3 efeitos recorrentes sem custo duplicado; E3.4 características ativas opt-in; E3.5 histórico estruturado compatível; E3.6 recursos e descansos D&D 5e 2014. G3 exige persistência dos efeitos, ausência de consumo duplicado e separação de condições.

**Reconciliação inicial:** G2 está formalmente aprovado com ressalvas e E2 encerrada para governança conforme a decisão registrada acima e em `docs/codex/EXECUTION_STATE.md`. A árvore local já contém alterações de E2 e outras tarefas, preservadas. A suíte-base foi executada nesta retomada em Node v24.14.0: **360/360**. Revisões somente leitura de QA, persistência e regras 2014 localizaram efeitos pendentes/concentração voláteis e colisão por ID de magia, condições/concentração compartilhando `#ataqueCondicao`, formatos de histórico heterogêneos e descanso longo recuperando todos os Dados de Vida. Não houve mudança de dados originais.

**Sequência técnica:** primeiro modelo aditivo de instâncias persistentes e compatibilidade de importação/rollback (E3.1); em seguida condição estruturada e projeção do texto legado (E3.2); envelope de histórico leitor dos formatos antigos (E3.5); gatilhos/custo/encerramento explícitos para recorrência (E3.3); características opt-in após confirmar E1.1 (E3.4); e revisão/implementação dos descansos (E3.6), que pode ser validada isoladamente conforme dependências. Sem inferir efeitos ou recargas de texto livre. Nenhuma unidade E3 foi marcada concluída no início desta retomada.

**Ressalvas de governança preservadas:** G2 segue aprovado com ressalvas abertas; G3 continua pendente e reservado à decisão humana. E4 não iniciada. Sem commit, push, merge, deploy ou alteração dos JSONs originais de personagens.

### Checkpoint de execução contínua E3 — 2026-11-24

Este checkpoint atualiza o progresso técnico de E3 sem aprovar G3. Foram corrigidos dois defeitos encontrados por revisão independente: a concentração `Concentrado [nome]` agora é migrada antes de projetar/limpar o campo legado de condições; e a timeline estruturada é sempre reconciliada ao importar fichas sem `historicoEventos`, evitando mostrar entradas da ficha anterior. A edição de magia carrega e salva os gatilhos configurados. O descanso curto aplica Constituição a cada dado e limita cada rolagem a pelo menos 0 PV após o modificador, conforme errata D&D 2014; depois soma e limita a cura aos PV faltantes. Bruxo recupera somente espaços de Pacto do nível e quantidade correspondentes ao nível de classe. Descanso longo respeita o limite de recuperação de Dados de Vida, restaura espaços registrados e usos explicitamente configurados, exige pelo menos 1 PV no início e reduz exaustão somente após confirmação de comida e bebida.

**Estado por unidade:** E3.1 e E3.2 atendidas tecnicamente nos fluxos e testes automatizados de exportação/importação/rollback, sem validação dedicada de persistência por recarga real em perfil local. E3.3 parcialmente atendida: custo de ativação único e gatilhos manual/rodada/turno/condição persistidos e apresentados; a aplicação continua manual e os gatilhos/durações não têm scheduler nem expiração automática. E3.4 parcialmente atendida: configuração é opt-in, separada dos usos restantes e coberta por importação/exportação e validação Chromium sintética anterior; requer revisão final de registros órfãos após exclusão/desativação. E3.5 parcialmente atendida: envelopes novos são armazenados/renderizados e importação sem envelope limpa a timeline; não foi encontrado payload histórico legado serializado para migrar — o histórico antigo era DOM da sessão. E3.6 parcialmente atendida: descanso curto/longos cobrem Dados de Vida, cura, Pact Magic da classe Bruxo reconhecida, slots gerais, características estruturadas, PV e exaustão condicional; não há relógio de jogo/duração de descanso nem modelo de multiclasses, então estes limites permanecem manuais e slots de recuperação não classificados não são inferidos.

**Validação desta rodada:** os resultados 212/212 focados e 384/384 totais do checkpoint anterior foram supersedidos por correções normativas. Node v24.14.0; `node --test tests/regras-combate.test.cjs` passou **52/52**. A suíte completa e verificações finais serão atualizadas no encerramento. Chromium isolado confirmou descanso longo bloqueado a 0 PV e descanso curto sintético consumindo dois Dados de Vida; fórmula com CON negativa e níveis de Pact Magic estão cobertos nos testes focados. A página foi recarregada ao estado em branco. Nenhum JSON original de personagem foi alterado.

**Pendências e governança:** revisão independente final de QA solicitada; confirmar preservação de histórico por backup/reload real e validação ampliada de rollback no Chromium. G3 permanece **pendente de avaliação humana**; não aprovado. E4 não iniciada. E3 não deve ser declarada completa enquanto permanecerem as limitações automáticas citadas; retomar pela conclusão da revisão QA e pela decisão técnica/documental sobre scheduler/expiração, leitura histórica antiga, recursos órfãos e limites de descanso. Preservadas todas as alterações locais preexistentes. Sem commit, push, merge ou deploy.

### Atualização de validação E3 após revisão normativa — 2026-11-24

A revisão independente confirmou que a errata do PHB 2014 aplica mínimo de 0 PV **a cada dado** de vida depois do modificador de Constituição. O cálculo e a regressão foram ajustados: d4 `[1, 4]` com CON −2 recupera 2 PV. O descanso longo bloqueia benefícios se a ficha iniciar com 0 PV. Pact Magic agora recupera somente nível e quantidade de espaços da tabela de Bruxo 2014, sem preencher slots de outros níveis. Usos de características sem definição ativa correspondente são preservados como órfãos, mas não aparecem como recuperáveis nem são modificados pelo descanso; a prévia usa o mesmo cálculo.

**Validação funcional no Chromium isolado:** usando a origem local temporária `127.0.0.1:18892` e ficha sintética `QA E3 Isolado`, o IndexedDB gravou snapshot com efeito, condição, concentração e evento estruturado. Após recarregar a página, o registro válido foi recuperado pela API local e aplicado através do preparador e aplicador transacional: PV 7, um efeito, uma condição, concentração `qa-conc` e um evento restaurados. O primeiro snapshot sintético inválido foi corretamente recusado pela lista de recuperação; o cenário final usou estruturas conformes ao schema. Teste separado no Chromium confirmou descanso curto com d4 `[1,4]`, CON −2, Bruxo nível 3: PV +2, consumo de 2/3 Dados de Vida, slots de nível 1 inalterados e slots de Pact Magic nível 2 restaurados. Página voltou a `modo=branco`; servidor local foi encerrado.

**Testes finais desta atualização:** foco `node --test tests/condicoes-combate.test.cjs tests/caracteristicas-metadados.test.cjs tests/magias-efeitos.test.cjs tests/regras-combate.test.cjs tests/importacao-preparacao.test.cjs tests/importacao-rollback.test.cjs` — **218/218 aprovados**. Suíte `node --test --test-reporter=spec tests/*.test.cjs` — **386/386 aprovados**, Node v24.14.0. `node --check` passou nos nove arquivos JS/CJS da fatia; `git diff --check` passou (somente avisos Git preexistentes de normalização LF/CRLF).

**Estado atual:** E3.1 e E3.2 tecnicamente cobertas em import/export/rollback e recuperação real do backup sintético. E3.3 tecnicamente coberta com confirmação manual, reaplicação sem custo adicional e encerramentos explícitos; não há scheduler ou relógio de jogo, e a interface informa a confirmação manual. E3.4 cobre configuração opt-in e estado separado; registros órfãos ficam preservados e inativos. A integração visual à futura aba Poder está reservada a E4.3. E3.5 estrutura novos eventos; não existia histórico legado serializado a migrar. E3.6 foi corrigida e validada para cura por dado, recuperação de Dados de Vida, PV, recursos estruturados, Pact Magic e exaustão condicional. O app não controla duração/intervalo de descansos no tempo de jogo nem multiclasses, limitação apresentada para confirmação manual.

G2 continua formalmente aprovado com ressalvas; **G3 aguarda decisão humana** e não foi aprovado. E4 não iniciada. Nenhum JSON original de personagem foi alterado; sem commit, push, merge ou deploy.

### Correção normativa de cura de descanso curto — 2026-11-24

Revisão direta da errata oficial do *Player’s Handbook* 2014 (v3.0, p. 186) resolveu divergência entre pareceres independentes: após cada dado receber o modificador de Constituição, a personagem recupera PV iguais ao total combinado, com mínimo de 0 para o total — não um piso separado para cada dado. A evidência primária é a [errata oficial da Wizards of the Coast](https://media.wizards.com/2020/dnd/downloads/PH-Errata.pdf), confirmada pelo texto 2014 publicado pela D&D Beyond. Portanto, o registro anterior que calculava d4 `[1,4]` com CON −2 como 2 PV está supersedido; o resultado correto é 1 PV. A função pura agora soma os resultados com os modificadores e limita a soma final em zero. Regressão discriminante: `[1,6]`, CON −2 recupera 3 PV.

**Validação após correção:** foco `node --test tests/regras-combate.test.cjs tests/condicoes-combate.test.cjs tests/caracteristicas-metadados.test.cjs tests/magias-efeitos.test.cjs tests/importacao-preparacao.test.cjs tests/importacao-rollback.test.cjs` — **218/218 aprovados**; suíte `node --test --test-reporter=spec tests/*.test.cjs` — **386/386 aprovados**; `node --check` em nove arquivos da fatia e `git diff --check` aprovados (avisos somente de normalização LF/CRLF do worktree). A tentativa de abrir o Chromium isolado não retornou controle de página; não há Playwright/Puppeteer instalado no projeto, então a interação visual para a fórmula corrigida permanece sem nova validação. A validação Chromium registrada antes desta correção não comprova este resultado específico. G3 permanece aguardando avaliação humana; E4 segue não iniciada.

### Usabilidade de descanso e recursos do turno — 2026-11-24

A inspeção manual reportou que Descanso Curto parecia não responder. A causa foi o uso de `prompt()`/`confirm()` nativos: o Chromium de validação não suporta `prompt()` e lançava erro no clique. O fluxo agora usa diálogo acessível com PV, Dados de Vida e tipo de dado, quantidade limitada, rolagem, prévia e confirmação explícita. Cancelar não consome recursos; confirmar aplica a cura D&D 5e 2014 com Constituição, limite pelos PV máximos/faltantes e mínimo zero no total segundo a errata, registra o resultado e só altera recursos estruturados elegíveis. Descanso sem Dados de Vida permanece possível; não é possível gastar mais dados que os disponíveis. A rolagem permanece automática como no fluxo existente, e o descanso longo foi preservado.

Os dois botões passaram para um único grupo `Descanso [Curto] [Longo]`, sem ocupar o espaço dos campos de Dados de Vida. O painel de iniciativa agora apresenta ação, ação bônus e reação como controles compactos com estado Disponível/Usada, e mostra movimento gasto/restante junto ao registro manual. Regras do turno e design aprovado do Combate 2.0 permaneceram inalterados.

No Chromium isolado, o clique abriu o diálogo; cancelamento manteve PV 6 e 2 Dados de Vida. Confirmação sintética com 0/20 PV, 2d8, CON −2 e resultados 1 e 6 apresentou cura 3; ao confirmar, PV ficaram em 3/20 e dados em 0, com resultado no status e registro do combate. Layout conferido em 1366×900 e 390×844; os controles couberam nos respectivos grupos/painel. Persiste overflow geral móvel no conteúdo/rodapé, mantido como pendência separada e sem alteração nesta unidade.

Foco: **57/57**; suíte completa: **391/391** (Node v24.14.0). `node --check` nos três JS/CJS alterados: aprovado. `git diff --check`: exit code 0, com avisos de normalização LF/CRLF. Não foram alterados JSONs originais. G3 aguarda decisão humana; E4 não iniciada. Sem commit, push, merge ou deploy.

#### Combate — linha compacta dos recursos do turno (2026-11-24)

Ação, Ação bônus e Reação agora aparecem como saldos restantes `1/1` na faixa Turno, no lugar do texto de posição/rodada anterior. **Editar** abre um diálogo acessível para registrar manualmente o gasto; fluxos de ataque, magia e outras ações continuam no mesmo estado. Os limites seguem 1/1, sem alteração da lógica de combate ou da persistência.

A interface de movimento foi removida e adicionada ao TODO para implementação separada. Os campos de movimento já guardados no modelo persistente foram mantidos, evitando mudança incompatível. O item 1 está **parcial**: falta o modal de configuração de limites, ajustes temporários e ataques por ação, além dos critérios originais ainda não atendidos. Essa delimitação consta em `docs/TODO.md`.

Chromium local isolado: iniciar combate sintético (iniciativa 15, posição 1) exibiu os três valores em 1/1; **Editar** abriu o diálogo; gastar ação bônus mudou para 0/1, desabilitou repetição e fechou o diálogo. A largura do controle permaneceu dentro da faixa em viewport 390 px. Testes focados: **58/58 aprovados**. A suíte completa e verificações estáticas desta atualização serão registradas no fechamento. G3 segue pendente de decisão humana; E4 não iniciada.

### Configurar limites de Ação, Ação bônus e Reação — 2026-11-24

O botão **Editar** na faixa Turno agora configura limites padrão (Ação, Ação bônus, Reação e ataques por ação Atacar), todos iniciando em 1, e ajustes numéricos “Só neste turno”. Os limites afetam os saldos consumidos no combate; ajustes temporários terminam em **Próximo turno** e não apagam gastos anteriores. A configuração é parte aditiva de `estadoCombate`, preservada por import/export/reload, sem mudar a versão global do schema. Dados antigos sem configuração usam defaults 1. Ataque Extra estruturado por classe continua derivado e o limite configurado pode aumentá-lo. Movimento segue fora da faixa, como decidido no TODO.

Foco: **130/130**; suíte: **394/394**. `node --check` nos sete JS/CJS afetados passou; `git diff --check` limpo. Chromium confirmou os saldos iniciais e a abertura do modal com 1 nos limites e 0 nos ajustes. A automação perdeu o controle antes de aplicar a configuração, então aplicação e reinício do próximo turno ainda aguardam validação funcional real. Não foi salvo/exportado nenhum personagem nem houve backup de ficha sem identidade.

O item do TODO continua parcial até revisão completa da integração com ataques, magias e outras ações; não há incremento automático de limite disparado por metadados da magia — a variação permanece configurável manualmente no modal. G3 não aprovado; E4 não iniciada.

### Item 1 do TODO — seleção elegível, gatilhos de reação e Ataque Extra — 2026-11-24

A retomada desse item integrou a verificação de saldos de Ação/Ação bônus/Reação ao seletor de ataques. Ataque bônus de arma sem condição de duas armas não fica selecionável; esgotar Ação não transforma um ataque comum em Reação automaticamente. O custo de conjuração verifica o contador correspondente antes de consumir o espaço, e uma conjuração fora do combate não desconta contador. A Reação exige um gatilho nos fluxos de ataque e de magia com espaço, cujo texto acompanha o evento no histórico. O modal de ataque informa os ataques restantes da mesma ação quando há Ataque Extra. A importação round-tripa Reação gasta e a regressão de próximo turno verifica reposição dos saldos e remoção de ajustes temporários.

Testes focados: **157/157**; suíte completa após implementação: **403/403** (registro executado em 2026-11-24). `node --check` dos arquivos afetados e `git diff --check` passaram. O host Chromium não estava disponível nesta rodada (`openBrowserPage` falhou; inventário CUA retornou indisponibilidade; Playwright/Puppeteer não instalados), portanto a evidência estrutural automatizada não substitui a validação visual/funcional real.

O item 1 permanece **parcial**: ainda falta a validação integrada em Chromium, conferir cobertura restante de ações sem gasto e atividades fora de combate, e resolver o limite do modelo de iniciativa de personagem único para comprovar reação no turno alheio. Custos alternativos e metadados de características permanecem sem inferência automática. A interface de movimento continua adiada, preservando os campos de estado existentes. O checkpoint detalhado está em `docs/codex/EXECUTION_STATE.md`; G3 aguarda avaliação humana e E4 não iniciada.

**Ajuste pontual da linha de recursos do turno (2026-11-24):** botão de edição trocado por lápis discreto (20 × 20 px), preservando tooltip, rótulo acessível e editor; regressão de DOM/CSS passou 3/3 e suíte completa 403/403. Página modo=branco abriu no Chrome, mas o HUD não foi alcançado porque a automação mapeou o controle fora do viewport para coordenadas fora da janela; validação visual do ícone permanece pendente. Item 1 do TODO segue parcial; G3 aguarda avaliação humana, E4 não iniciada. Sem alteração de JSON original, commits, push, merge ou deploy.

**Revalidação após regressão de ação fora de combate (2026-11-24):** focados combate/magias/usabilidade 88/88; suíte completa 404/404; `node --check` nos arquivos da fatia e `git diff --check` aprovados. O TODO agora distingue evidências automatizadas já existentes de gatilho de magia de reação sem ataque e consumidor genérico fora de combate, mantendo integração item 1 parcial. A validação visual real do HUD e fluxos de reação no Chromium permanecem pendentes; G3 aguarda avaliação humana e E4 não iniciada.

**Validação Chromium desktop do HUD (2026-11-24):** em página sintética `modo=branco` (`127.0.0.1:18900`), iniciei combate e confirmei visualmente `Ação 1/1`, `Ação bônus 1/1`, `Reação 1/1` e o lápis discreto. O clique real abriu o editor com limites 1 e ajustes 0; **Cancelar** fechou sem aplicar alterações. Essa evidência substitui o relato anterior de que não foi possível alcançar o HUD. Os fluxos integrados de consumo e a reação no turno de outra criatura continuam pendentes; G3 não alterado.

### Evidência incremental do item 1 do TODO — ação rápida no Chromium (2026-11-24)

Em ficha sintética `modo=branco`, **Esquivar** consumiu Ação `1/1 → 0/1`, informou `Ação registrada.` e criou um único evento no histórico; segundo clique não duplicou nem consumiu novamente. Isso valida apenas uma ação rápida sem efeito automático. Ataques, magia, reações, recarga e fluxo de grupo continuam em aberto; item 1 segue parcial, G3 aguarda avaliação humana e E4 não iniciada. JSONs originais preservados; sem commit, push, merge ou deploy.

**Validação Chromium fora de combate (24/11/2026):** depois de encerrar o combate da ficha sintética, Esquivar foi registrado no histórico sem HUD/saldo de turno ativo. Isso confirma o fluxo de atividade sem gasto, sem alteração de ficha original. Ataques e magias no navegador e o modelo de iniciativa de grupo ainda aguardam validação.

### Regressão de Esquivar e saldo fora de combate — 24/11/2026

A regressão em `tests/regras-combate.test.cjs` comprova que Esquivar consome Ação sem abrir a ação Ataque nem qualificar ataque bônus de duas armas. No Chrome, em ficha sintética, Esquivar consumiu `1/1 → 0/1`, o segundo clique não duplicou histórico; fora de combate, o registro não tinha saldo de turno para gastar. Focados **89/89**, suíte **405/405**, sintaxe e diff check aprovados. Item 1 segue parcial: ataques/magias no Chromium, auditoria restante de usos/munição e atividade fora de combate pendem; iniciativa de grupo e custo alternativo estão bloqueados por ausência de modelo/metadados e não devem ser inventados. G3 aguarda avaliação humana; E4 não iniciada.

### Ajuste de modal do Descanso Curto — 2026-11-25

O diálogo nativo de Descanso Curto foi reorganizado para reaproveitar a camada visual compartilhada `.modal-base` e os controles/classe de dado existentes. Mostra PV atual/máximo, Dados de Vida disponíveis/tipo, recursos estruturados elegíveis, quantidade a gastar, resultados individuais, cura aplicada e PV após descanso. A rolagem automática permanece; também é possível inserir uma sequência de faces manuais validada para cada dado. Constituição continua aplicada separadamente a cada dado segundo o cálculo de D&D 5e 2014, e cura continua limitada aos PV faltantes. Confirmar sem gastar Dados de Vida é permitido; cancelar por botão, fechar ou Escape não altera PV/Dados. Não houve alteração de esquema JSON nem dos fluxos de descanso longo.

**Validação:** testes focados do descanso, usabilidade e regressão dos títulos de iniciativa/salvaguarda **12/12**. Chromium com ficha sintética `modo=branco`: em desktop (1280 × 900), diálogo centralizado, backdrop compartilhado, foco inicial no seletor e Escape fecha; em celular (320 × 640), o diálogo não excedeu a largura útil do viewport, rolou internamente até as ações, e Escape preservou PV/Dados. Foram exercitados cancelar após resultado manual e confirmar após rolagem automática (PV 4/8 → 8/8, 1 Dado gasto), sem personagem real.

**Suíte completa:** `node --test tests/*.test.cjs` — **405 aprovados de 406; 1 falha** em `tests/combate-2.0-integracao.test.cjs`, teste de fundo transparente para `assets/icons/armas/punch.svg`. Esse SVG é arquivo local não rastreado identificado durante esta execução e não alterado aqui; seu fundo preto sólido conflita com a expectativa do teste. Não foi corrigido por estar fora do escopo e ser alteração local do responsável. Sintaxe do módulo/testes e `git diff --check` da fatia passaram. O teste de importação/exportação/rollback não foi repetido especificamente nesta unidade; não houve mudança de persistência, e a suíte geral inclui regressões de importação existentes.

**Pendências:** o Descanso Longo ainda usa confirmações nativas sequenciais e não segue a aparência dos modais da ficha; sua adequação visual/seleção individual de benefícios permanece separada, conforme TODO, sem declaração de conclusão funcional. A seleção de nomes individuais de recursos elegíveis também depende de metadados configurados pela ficha e não foi inferida. E3 permanece sob avaliação técnica, G3 não foi aprovado e E4 não foi iniciado.

### Atualização do padrão de rolagem do Descanso Curto — 2026-11-25

Conforme a decisão do responsável registrada em `docs/TODO.md`, a barra superior agora reutiliza o cabeçalho dos modais de rolagem. Recursos elegíveis ficam ocultos quando nenhum recurso puder ser recuperado. A rolagem usa o padrão existente: animação, entrada manual de um resultado, histórico clicável e um resultado por Dado de Vida. **Usar dado** inclui o resultado e aumenta o gasto da prévia em uma unidade; a ficha só é alterada ao confirmar o descanso. Cada resultado apresenta Constituição na conta (`8 (5+3)`), além da cura acumulada e dos PV finais. É possível confirmar descanso sem dados. A recuperação continua sujeita ao limite de PV máximos; cancelar descarta todos os dados ainda não confirmados.

**Regressões:** `tests/regras-combate.test.cjs` verifica uso individual, limite disponível, cancelamento, descanso sem dados, resultado manual, rolagem animada, histórico selecionável e Constituição; `tests/usabilidade-descanso-iniciativa.test.cjs` verifica cabeçalho, estrutura compartilhada, ausência de seletor de quantidade, histórico e estilos. Testes focados: **63/63 aprovados**. Suíte completa: **405 aprovados, 1 falhou, de 406**; a falha conhecida é o teste de fundo transparente do SVG local não rastreado `assets/icons/armas/punch.svg`, fora do escopo. `node --check` dos arquivos JavaScript alterados e `git diff --check` aprovados.

**Validação de navegador:** tentativas de reusar a aba de QA e abrir uma página Chromium retornaram falha do host. Esta alteração não tem validação visual real concluída; não se apresenta cobertura DOM/CSS como substituta. Confirmar posteriormente barra superior, histórico clicável, recursos condicionais, rolagem/animação, fórmula por Constituição e layout móvel no Chromium. Sem alteração de contrato persistente, JSON original, mecânica de descanso longo ou estado dos gates; G3 não aprovado, E4 não iniciada.
