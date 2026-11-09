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

**Última atualização:** 2026-11-07 — prévias de cadastro de armaduras, escudos e armas e formulários manuais conferidos em viewport móvel; ajustes responsivos registrados na tarefa e no [plano responsivo](docs/propostas/PLANO_RESPONSIVIDADE_MODAIS_INVENTARIO.md). A regressão integrada de armas e as pendências anteriores de perícias, importação parcial, timeline e round-trip narrativo de Thrain permanecem. Fase 3 continua em andamento e nenhuma fase inteira foi concluída.
