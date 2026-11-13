# Plano Geral e Detalhado de Implementação — Ficha D&D 5e (2014)

**Projeto:** Ficha de RPG — HTML<br>
**Repositório:** [Thiagotatagiba/FichaDnD](https://github.com/Thiagotatagiba/FichaDnD)<br>
**Data:** 10/11/2026<br>
**Documento-base:** `Auditoria_Final_FichaDnD_2026-11-10.md` (auditoria encerrada em 60 fases)<br>
**Situação:** plano proposto; **nenhuma implementação autorizada ou iniciada**
**Abordagem:** alterações incrementais, testáveis, reversíveis e compatíveis com fichas antigas.

---

## 1. Objetivo e resultado esperado

Transformar os achados da auditoria em um roteiro de execução **passo a passo**, indicando o que será feito, em que ordem, quais arquivos provavelmente serão afetados, quais testes executar e quais critérios determinam a aprovação de cada entrega.

Ao final, a aplicação deverá:

1. Proteger fichas existentes e textos personalizados contra perdas.
2. Importar e exportar JSON com migração e recuperação previsíveis.
3. Aplicar de modo consistente as regras de **D&D 5e (2014)** adotadas no projeto.
4. Compartilhar mecanismos de dano, cura, rolagem, condições, efeitos e recursos.
5. Oferecer o novo painel de combate aprovado sem duplicar regras.
6. Evoluir personagem e características de modo transacional.
7. Possuir testes suficientes para evitar regressões nas operações críticas.

**Não está previsto reescrever a aplicação nem introduzir backend.** A estrutura atual de aplicação estática será preservada.

### 1.1. O que é fato e o que é proposta

- **Achado confirmado:** o relatório-base documenta o comportamento observado no código ou nos registros históricos.
- **Requisito aprovado:** comportamento solicitado e definido durante a auditoria.
- **Proposta técnica:** forma sugerida de implementar o requisito. Nomes de novos módulos, objetos e funções neste documento são **sugestões**, não interfaces já existentes.
- **Dependência externa:** trabalho em andamento do usuário, especialmente munições e futuro catálogo JSON de poções.

Este documento **não certifica** a execução atual dos testes. Antes de cada alteração, confirmar o estado vigente do repositório, pois a base pode ter evoluído após a auditoria.

---

## 2. Regras de trabalho para todas as entregas

### 2.1. Procedimento obrigatório de cada tarefa

1. **Consultar o repositório atualizado** e comparar os trechos relevantes com a auditoria.
2. **Definir o escopo mínimo**: uma correção ou funcionalidade coesa por alteração.
3. **Criar ou atualizar testes que reproduzam o problema** antes de alterar a lógica, quando tecnicamente viável.
4. **Modificar apenas os arquivos necessários**, preservando IDs de HTML, formatos legados e APIs usadas por outros módulos, salvo migração planejada.
5. **Executar testes unitários e de integração relevantes**.
6. **Verificar no navegador** os fluxos afetados (desktop, celular, teclado e temas quando aplicável).
7. **Executar regressões de importação/exportação** sempre que houver alteração de estado persistente.
8. **Apresentar um resumo verificável**: arquivos alterados, comportamento anterior/novo, testes executados, resultados e limitações.
9. **Aguardar aprovação do usuário** para avançar à próxima entrega ou lote de alterações.
10. **Manter caminho de reversão** (commit/branch e cópias de JSON de teste).

**Regra de autorização:** este plano não autoriza mudanças no GitHub. A execução de cada entrega depende de autorização explícita.

### 2.2. Portões de qualidade (gates)

| Gate | Momento | Condição de aprovação |
|---|---|---|
| G0 — Preparação | Antes da primeira alteração | Estado atual verificado, backups dos JSONs de teste e suíte-base identificada |
| G1 — Integridade | Após Entrega 1 | Sem perda silenciosa, importação recuperável e round-trip validado |
| G2 — Regras | Após Entrega 2 | Cálculos e concentração aprovados por testes |
| G3 — Estado | Após Entrega 3 | Efeitos e recursos persistem e não duplicam consumo |
| G4 — Interface | Após Entrega 4 | HUD, iniciativa e modais aprovados no navegador |
| G5 — Evolução | Após Entrega 5 | Level Up atômico e catálogos tratados com segurança |
| G6 — Liberação | Após Entrega 6 | Matriz crítica aprovada; pendências conhecidas documentadas |

Se um gate falhar, **não avançar** para a etapa dependente sem corrigir ou aprovar expressamente a exceção.

### 2.3. Ordem geral

```text
G0 — Preparação e linha de base
  ↓
E1 — Integridade, persistência, importação e backup
  ↓ G1
E2 — Motor de regras de combate
  ↓ G2
E3 — Estados de condições, efeitos e características
  ↓ G3
E4 — Nova interface de combate e modais
  ↓ G4
E5 — Level Up, catálogos e descansos
  ↓ G5
E6 — Estabilização, regressões e liberação
  ↓ G6
```

**Trabalhos paralelos possíveis:** documentação, testes e desenho de interface podem avançar antes de seu módulo estar pronto, desde que não imponham esquemas ainda indefinidos para munições e poções.

---

## 3. Preparação — G0 (sem alterar comportamento)

### Passo P-01 — Confirmar a versão de trabalho
1. Consultar a branch padrão, o commit de referência e os arquivos atuais.
2. Verificar se `js/core/storage.js`, `js/modules/importacao.js`, `js/modules/magias.js`, `js/modules/combate.js` e `js/data/racas-subclasses.js` ainda correspondem aos achados.
3. Revisar `ROADMAP.md`, `DECISOES_DE_ARQUITETURA.md` e `docs/BUG_REPORT.md`.
4. Registrar diferenças recentes, principalmente no catálogo de munições.
5. Ajustar a ordem do plano **somente após apresentar as diferenças para aprovação**.

**Saída:** inventário da versão e lista de divergências em relação à auditoria.

### Passo P-02 — Estabelecer uma linha de base de testes
1. Identificar todos os arquivos existentes em `tests/` e os comandos de execução.
2. Executar os testes Node existentes, incluindo os de magias e armaduras.
3. Registrar falhas anteriores à implementação.
4. Realizar teste manual mínimo: abrir ficha, importar JSON, salvar JSON, iniciar e encerrar combate.
5. Não atribuir à nova implementação erros que já existiam na linha de base.

**Saída:** relatório de testes iniciais, com data e versão do código.

### Passo P-03 — Proteger dados de teste
1. Selecionar fichas reais representativas (por exemplo, Waldo e Thrain, se disponíveis e autorizadas).
2. Copiar os arquivos para uma área de teste; **não sobrescrever originais**.
3. Calcular hash e registrar tamanho dos arquivos.
4. Preparar versões de teste: JSON atual, JSON legado, JSON incompleto e JSON inválido.
5. Registrar campos críticos: PV, magias, espaços, talentos, descrições, equipamentos, estado de combate e dados narrativos.

**Saída:** conjunto de amostras imutáveis e critérios de comparação.

### Passo P-04 — Definir contratos mínimos
1. Identificar qual função é a fonte de verdade para cada dado.
2. Distinguir dados persistentes de estado visual/transitório.
3. Documentar contratos de leitura, escrita, migração e eventos.
4. Definir IDs estáveis para novos recursos sem alterar IDs legados desnecessariamente.
5. Registrar decisões técnicas antes de codificar estruturas novas.

**Saída:** mapa de estado e contratos mínimos aprovados.

---

## 4. Entrega 1 — Integridade dos dados e persistência (P0)

**Objetivo:** tornar as operações de edição, salvamento e importação seguras antes de acrescentar novos estados.

**Achados atendidos:** A-01, A-02, A-03, A-15 e base de A-16.

**Arquivos prováveis:** `js/core/storage.js`, `js/modules/importacao.js`, `js/modules/magias.js`, `js/modules/atributos.js`, `tests/`; novos módulos de persistência, se justificáveis.

### E1.1 — Corrigir salvamento de características sem perda de propriedades
1. Inspecionar `normalizarItemTalento()`, `renderizarFormularioTalento()`, `salvarModalTalento()` e os pontos que substituem objetos de características.
2. Criar um teste com característica que contenha nome, descrição **e metadados adicionais desconhecidos**.
3. Reproduzir o problema: editar somente nome ou descrição e observar perda de propriedades.
4. Alterar o salvamento para **mesclar os campos efetivamente editados ao objeto original**, sem reconstruir um objeto reduzido.
5. Garantir que o fluxo de criação continue criando valores padrão seguros.
6. Atualizar a detecção de alterações não salvas para comparar todos os campos editáveis, inclusive os que serão acrescentados.
7. Repetir o teste com descrições personalizadas, campos extras e objetos legados.
8. Validar salvar → exportar → importar → reabrir → editar → salvar.

**Aceite:** nenhum campo adicional desaparece por editar um campo não relacionado. Descrições personalizadas permanecem autoritativas.

### E1.2 — Introduzir versão explícita de esquema JSON
1. Levantar os formatos de JSON existentes e os aliases já suportados por `normalizarDadosImportacao()`.
2. Definir um campo de versão **novo e não conflitante**, documentado.
3. Definir a política para arquivos sem versão (legados).
4. Criar migrações sequenciais, idempotentes e testáveis; não eliminar aliases legados precipitadamente.
5. Garantir que campos desconhecidos compatíveis não sejam descartados sem justificativa.
6. Testar arquivos atuais, legados e futuras versões não suportadas (erro claro, sem alteração do personagem).

**Aceite:** o sistema identifica a versão, migra quando possível e rejeita com segurança formatos incompatíveis.

### E1.3 — Validar importação antes de alterar a ficha
1. Separar a leitura do arquivo, o parse JSON, a normalização e a validação da aplicação ao DOM.
2. Validar tipos, intervalos e relações essenciais: atributos, perícias, espaços de magia, coleções e IDs.
3. Garantir que dados inválidos gerem mensagem compreensível sem alterar o personagem atual.
4. Preparar uma representação normalizada em memória.
5. Validar dependências assíncronas necessárias antes do commit, quando possível.
6. Evitar disparar efeitos colaterais de eventos durante a fase de preparação.

**Aceite:** falha de leitura, parse ou validação deixa a ficha anterior intacta.

### E1.4 — Tornar a importação recuperável
1. Antes da aplicação, capturar um **snapshot completo e restaurável** do personagem atual.
2. Aplicar os dados validados em uma fase controlada.
3. Aguardar operações assíncronas obrigatórias.
4. Se houver falha, restaurar snapshot, estado de interface relevante e indicadores de alterações.
5. Se o rollback completo não puder ser garantido na arquitetura atual, usar um mecanismo de aplicação isolada ou recarregamento controlado a partir de backup; **não declarar transacionalidade antes de demonstrá-la**.
6. Registrar falha e informar ao usuário se houve recuperação.
7. Testar falhas injetadas no início, meio e fim do processo.

**Aceite:** importação malsucedida não deixa estado parcial ou, em caso excepcional, informa claramente o risco e oferece recuperação comprovada.

### E1.5 — Separar “backup”, “alterações pendentes” e “exportação”
1. Revisar `fichaFoiAlterada()`, `marcarFichaComoSalva()` e `salvarFicha()`.
2. Não considerar o clique em um link de download como prova de que o arquivo foi gravado no disco.
3. Manter estados distintos para: alterações persistentes, último backup local e última exportação solicitada.
4. Definir mensagens que não prometam confirmação de download que o navegador não fornece.
5. Impedir que alterações transitórias de modal marquem a ficha como modificada sem necessidade.
6. Testar exportação repetida, cancelamento e falha simulada na preparação do Blob.

**Aceite:** a interface não confunde cópia de recuperação com arquivo exportado.

### E1.6 — Implementar backup local automático
1. Escolher armazenamento local apropriado, avaliando limites e tratamento de erro (a escolha concreta deve ser validada na implementação).
2. Observar somente alterações **persistentes**.
3. Agendar atualização após **10 segundos sem novas edições**.
4. Guardar cópia consistente com versão, identificador do personagem e data.
5. Tratar quota excedida, armazenamento indisponível e dados corrompidos sem apagar o personagem.
6. Ao reabrir, detectar cópia recuperável e **pedir confirmação** antes de restaurar.
7. Evitar que backup de um personagem seja aplicado automaticamente a outro.
8. Manter o JSON exportado como mecanismo independente de segurança.

**Aceite:** recuperação confirmada restaura o estado correto; recusa mantém a ficha atual.

### E1.7 — Avisos de exportação e saída
1. Programar lembrete de exportação a cada **30 minutos**, somente quando houver alterações não exportadas.
2. Não repetir lembretes de modo invasivo.
3. Consolidar a proteção `beforeunload` existente, evitando listeners duplicados.
4. Respeitar limitações do navegador para mensagens de saída.
5. Testar fechar aba com e sem alterações persistentes.

**Aceite:** aviso coerente, sem falsos positivos persistentes nem duplicação de alertas.

### E1.8 — Testes de round-trip
1. Para cada ficha de referência, importar uma cópia.
2. Exportar o JSON produzido.
3. Reimportar o arquivo exportado.
4. Comparar campos essenciais **semanticamente**, aceitando apenas normalizações documentadas.
5. Conferir especificamente espaços de magia e campos narrativos, por causa dos registros históricos de divergência.
6. Verificar que personalizações e coleções não perderam entradas.
7. Registrar diferenças esperadas, inesperadas e bloqueadoras.

**Gate G1:** E1.1–E1.8 aprovados, ou exceções expressamente autorizadas.

---

## 5. Entrega 2 — Motor compartilhado de regras de combate (P1)

**Objetivo:** corrigir as regras antes de conectar a nova interface.

**Achados atendidos:** A-04 a A-08 e A-06; prepara A-09.

**Arquivos prováveis:** `js/modules/combate.js`, `js/modules/magias.js`, `js/modules/habilidades.js`, `js/core/storage.js` e módulos novos de domínio (nomes a definir).

### E2.1 — Definir operações puras e testáveis
1. Identificar cálculos atualmente embutidos em handlers do DOM.
2. Extrair funções que recebem dados e retornam resultados, sem manipular HTML diretamente.
3. Separar **cálculo** de **aplicação ao estado** e **registro no histórico**.
4. Preservar pontos de entrada atuais por adaptadores, para não quebrar chamadas existentes.
5. Testar cada função sem navegador.

**Aceite:** a mesma regra é reutilizada por ataques, magias, características e poções, quando aplicável.

### E2.2 — Corrigir PV temporários e cura
1. Definir o contrato de PV atuais, PV máximos e PV temporários.
2. Ao receber dano, reduzir primeiro PV temporários e aplicar o excedente aos PV atuais.
3. Cura aumenta somente PV atuais, até o máximo regular.
4. Não somar PV temporários ao teto de cura.
5. Preservar o tratamento das consequências de chegar a 0 PV conforme as regras aplicáveis.
6. Confirmar que dano absorvido por PV temporários ainda pode exigir teste de concentração.
7. Atualizar a interface e histórico a partir do resultado da operação.
8. Testar dano menor, igual e maior que os PV temporários; cura com PV temporários; PV 0 e valores-limite.

**Aceite:** nenhuma operação mistura os dois reservatórios de PV.

### E2.3 — Resolver dano tipado
1. Criar representação de evento de dano com quantidade, tipo e origem.
2. Ler resistências, vulnerabilidades e imunidades aplicáveis ao alvo.
3. Aplicar a regra oficial de 2014, incluindo arredondamentos e interação entre resistência/vulnerabilidade.
4. Permitir exceções manuais documentadas quando a ficha não possuir todos os dados do alvo.
5. Registrar valor bruto, ajustes e valor final.
6. Integrar primeiro com dano simples, depois armas, magias e efeitos.
7. Testar tipos distintos, imunidade, resistência, vulnerabilidade e interações.

**Aceite:** uma única lógica determina o dano final, com origem e justificativa rastreáveis.

### E2.4 — Tornar o teste de concentração obrigatório
1. Inspecionar `abrirTesteConcentracaoPorDano()` e `fecharModalTesteResistencia()`.
2. Manter o contexto pendente até resolução explícita.
3. Oferecer: confirmar teste, abandonar concentração voluntariamente ou voltar ao teste.
4. Bloquear descarte silencioso pelo X, Esc ou outras rotas de fechamento.
5. Usar CD `máximo(10, piso(dano/2))` para cada fonte de dano, conforme a regra auditada.
6. Registrar sucesso, falha ou abandono no histórico.
7. Testar dano com PV temporários, múltiplas fontes, troca de concentração e fechamento de modal.

**Aceite:** nenhuma saída deixa concentração indevidamente ativa por descarte de contexto.

### E2.5 — Centralizar vantagem/desvantagem
1. Definir fontes de vantagem/desvantagem com **escopo**, **origem**, **duração** e **tipo**.
2. Incluir fontes automáticas e fontes manuais persistentes.
3. Em cada rolagem, permitir escolha manual contextual e motivo.
4. Aplicar regra 2014: qualquer vantagem + qualquer desvantagem = rolagem normal; múltiplas fontes não acumulam.
5. Preservar e exibir as fontes automáticas mesmo quando houver ajuste manual.
6. Integrar ataques, perícias e testes de resistência.
7. Aplicar consequências para perícias passivas quando cabíveis, inclusive modificador ±5.
8. Testar normal, vantagem, desvantagem, cancelamento, fontes múltiplas e persistência.

**Aceite:** o jogador entende por que rolou um ou dois d20 e o resultado é consistente.

### E2.6 — Unificar o fluxo de testes
1. Definir interface comum para teste de perícia e resistência.
2. Receber atributo/perícia, proficiência, bônus situacional, fontes de vantagem e motivo.
3. Permitir rolagem contextual sem alterar permanentemente a ficha, salvo opção explícita.
4. Integrar testes obrigatórios de concentração sem permitir cancelamento indevido.
5. Registrar d20 utilizado, bônus e total no histórico.
6. Testar modificadores negativos, proficiência, expertise, bônus temporários e rolagens especiais.

**Gate G2:** regras de PV, dano, concentração e vantagem aprovadas por testes e cenários de navegador.

---

## 6. Entrega 3 — Condições, efeitos ativos e recursos (P2)

**Objetivo:** criar estados persistentes para efeitos e poderes sem misturar descrição com regra.

**Achados atendidos:** A-09, A-10, A-11, A-16 e dependências de A-02.

**Arquivos prováveis:** `js/modules/magias.js`, `js/modules/combate.js`, `js/core/storage.js`, `js/modules/importacao.js` e novos módulos de estado.

### E3.1 — Separar definição de efeito e instância ativa
1. Definir **modelo de catálogo** (o que uma magia/característica faz) separado de **instância ativa** (o que está acontecendo com o personagem).
2. Cada instância deve possuir ID próprio, origem, referência à definição, estado, duração e dados de aplicação.
3. Não usar apenas `magia.id` como chave de instância; conjurações independentes não devem se sobrescrever.
4. Definir vínculo opcional à concentração.
5. Persistir instâncias ativas e migrar dados legados de modo seguro.
6. Testar duas ativações da mesma magia e recuperação após recarga.

**Aceite:** instâncias independentes coexistem e sobrevivem a exportação/importação.

### E3.2 — Separar condições e efeitos
1. Migrar gradualmente o campo textual `#ataqueCondicao` para uma representação estruturada.
2. Manter compatibilidade de leitura/escrita com o campo legado durante a transição.
3. Distinguir condições oficiais, condição personalizada, concentração e outros efeitos.
4. Registrar origem, duração, nível de exaustão quando aplicável e encerramento.
5. Evitar aplicar automaticamente efeitos mecânicos que não tenham sido definidos ou confirmados.
6. Testar condições simultâneas, remoção individual e restauração.

**Aceite:** remover uma condição não elimina outra nem encerra concentração por engano.

### E3.3 — Efeitos recorrentes de dano, cura e outros
1. Expandir além do `momento_dano="posterior"` atual.
2. Identificar gatilhos de aplicação: imediata, manual posterior, por rodada/turno, ou condição definida.
3. Registrar o custo de ativação **uma única vez**.
4. Permitir reaplicar um efeito já ativo sem novo consumo do espaço/recurso.
5. Oferecer encerramento explícito e encerramento por perda de concentração.
6. Testar aplicação repetida, encerramento, restauração e efeitos simultâneos.

**Aceite:** aplicação recorrente não gera novo gasto de recurso.

### E3.4 — Características ativas configuráveis
1. Corrigir primeiro E1.1, garantindo preservação de metadados.
2. Acrescentar opção **“Característica ativa”**, desligada por padrão.
3. Permitir definir fórmula de dano/cura, efeitos, usos máximos e tipo de recarga, conforme aplicável.
4. Separar configuração permanente do estado atual de usos restantes.
5. Permitir editar descrição sem apagar os novos campos e vice-versa.
6. Integrar características ativas à futura aba **Poder**.
7. Testar características importadas, criadas manualmente, editadas e recebidas por Level Up.

**Aceite:** nenhuma característica se torna ativa automaticamente apenas por existir no catálogo.

### E3.5 — Histórico de combate estruturado
1. Inventariar formatos existentes de eventos de arma, magia, poção e concentração.
2. Definir envelope comum: ID, data/ordem, tipo, origem, alvo quando conhecido, rolagem, modificadores, efeito e consumo.
3. Preservar leitura dos registros antigos.
4. Atualizar os pontos de escrita gradualmente.
5. Distinguir evento de **ativação** e evento de **aplicação posterior**.
6. Testar ordenação, persistência e exibição sem dados opcionais.

**Aceite:** ações podem ser auditadas sem perder o histórico antigo.

### E3.6 — Recursos e descansos
1. Identificar recursos recuperados em descanso curto/longo.
2. Definir regras de recuperação por tipo de recurso, conforme D&D 2014 e catálogos disponíveis.
3. Corrigir recuperação de dados de vida em descanso longo conforme regra oficial, em vez de restaurar tudo indiscriminadamente.
4. Exibir antes da confirmação o que será recuperado.
5. Registrar recuperação no histórico e persistir o estado.
6. Testar limites, arredondamentos e recursos sem configuração de recarga.

**Gate G3:** efeitos persistem, recursos não são consumidos duas vezes e condições não se misturam.

---

## 7. Entrega 4 — Interface de combate, iniciativa e modais (P3)

**Objetivo:** apresentar os mecanismos existentes e novos de forma compacta, clara e acessível.

**Achados atendidos:** A-12 e requisitos de interface aprovados.

**Arquivos prováveis:** `ficha/Ficha_DnD_-_Tatagiba_1.0.html`, `js/modules/combate.js`, `js/modules/magias.js`, CSS de combate/modais e testes de navegador.

### E4.1 — Reorganizar o painel sem quebrar IDs
1. Mapear os IDs e listeners atuais da seção `#combate`.
2. Planejar estrutura visual com PV, CA, condições, concentração e controles prioritários.
3. Manter os elementos usados por funções existentes ou adaptar chamadas em uma alteração controlada.
4. Mover itens equipados e gestão de equipamentos para área recolhível.
5. Preservar acesso a informações essenciais em telas pequenas.
6. Testar temas claro/escuro e tamanhos de tela.

**Aceite:** nenhuma funcionalidade existente desaparece por mudança de layout.

### E4.2 — Implementar os dois estados de iniciativa exatamente como aprovados

**Antes do combate:**
```text
Iniciativa
   +3
[Iniciar Combate]
```

**Durante o combate:**
```text
Posição
  4º
Iniciativa: 14
```

**Procedimento:**
1. Exibir antes do combate o **bônus de iniciativa calculado da ficha**, nunca um resultado de rolagem.
2. Renomear a ação atual para **Iniciar Combate**.
3. Ao clicar, abrir modal para rolar `1d20 + bônus` e definir posição.
4. Validar o dado e a posição; confirmar ativa o combate com rodada inicial.
5. Cancelar deixa o combate inativo e não altera o estado persistido.
6. Durante o combate, substituir integralmente o painel inicial por **Posição** com valor ordinal em destaque.
7. Exibir abaixo apenas `Iniciativa: total`, em tamanho menor.
8. Permitir editar a posição **sem recalcular nem alterar a iniciativa rolada**.
9. Manter avanço manual de rodada.
10. Ao encerrar, retornar ao painel inicial com o bônus atual da ficha.
11. Não introduzir número de participantes no layout compacto, pois não faz parte do requisito final.
12. Testar início, cancelamento, edição de posição, recarga, importação e encerramento.

**Aceite:** os dois layouts e transições coincidem com o requisito, inclusive os textos.

### E4.3 — Organizar ações em Arma, Magia, Poder e Testes
1. Manter os fluxos de arma e magia existentes, integrando-os ao motor compartilhado.
2. Criar aba **Poder** para características ativas configuradas.
3. Criar aba **Testes** para perícias e resistências.
4. Separar **Histórico** em acesso próprio, sem perdê-lo.
5. Garantir que mudar de aba não descarte uma ação pendente sem confirmação.
6. Testar teclado, foco e estado após recarga.

**Aceite:** ações compartilham regras, mas mantêm interfaces adequadas ao tipo.

### E4.4 — Padronizar modais
1. Catalogar todos os modais e suas rotas de abertura/fechamento.
2. Aplicar regra **obrigatória: clicar no fundo nunca fecha modal**.
3. Centralizar comportamentos de fechar por X, Cancelar e Esc (quando permitido).
4. Detectar alterações não salvas em todos os campos relevantes.
5. Impedir encerramento silencioso de testes obrigatórios.
6. Conter navegação por Tab, definir foco inicial e restaurar foco anterior.
7. Prevenir duplo clique/dupla confirmação e envio repetido.
8. Bloquear rolagem de fundo quando adequado e garantir uso em celular.
9. Testar modais aninhados ou encadeados, inclusive retorno de foco.

**Aceite:** comportamento uniforme, acessível e sem descarte acidental.

### E4.5 — Equipamentos e acesso rápido
1. Colocar equipamentos em painel recolhível, preservando gerenciamento.
2. Exibir equipamentos relevantes à ação sem duplicar sua fonte de dados.
3. Preparar ponto de extensão para poções favoritas.
4. **Não fixar campos do JSON de poções** antes da definição do catálogo.
5. Integrar munições somente após estabilização do esquema e testes de vínculo/quantidade.
6. Testar ações com recurso insuficiente, sem gerar histórico ou consumo indevido.

**Gate G4:** interface aprovada em desktop/celular, teclado e temas; nenhuma perda funcional.

---

## 8. Entrega 5 — Level Up, classes, subclasses e catálogos (P4)

**Objetivo:** garantir evolução coerente e preservação de escolhas do jogador.

**Achados atendidos:** A-13, A-14, A-17 e integrações de A-02.

**Arquivos prováveis:** `js/data/racas-subclasses.js`, `js/modules/classe.js`, `js/modules/card-classe.js`, `js/modules/importacao.js`, `js/modules/magias.js`, JSONs de classes/subclasses quando autorizado.

### E5.1 — Separar prévia e confirmação de Level Up
1. Identificar todas as mutações feitas antes da confirmação.
2. Criar estado de **rascunho de evolução** separado do personagem.
3. Calcular mudanças propostas: nível, PV, escolhas e características.
4. Exibir resumo completo antes de confirmar.
5. Ao cancelar, descartar rascunho sem alterar nível, XP, PV ou características.
6. Na confirmação, aplicar tudo como uma única operação recuperável.
7. Testar cancelamento em cada etapa, inclusive rolagem de PV.

**Aceite:** cancelamento não deixa evolução parcial.

### E5.2 — Características por nível exato
1. Consultar catálogo de classe/subclasse correspondente ao nível adquirido.
2. Exibir nome e descrição das características daquele nível.
3. Deixar selecionadas por padrão as características propostas, permitindo desmarcar as opcionais.
4. Importar apenas itens confirmados.
5. Usar ID estável e deduplicação para evitar repetir características.
6. Não sobrescrever descrição já personalizada.
7. Tratar explicitamente ausência de dados no catálogo.

**Aceite:** características corretas, sem duplicações e sem perda de texto.

### E5.3 — Seleção de subclasse
1. Determinar o nível de desbloqueio conforme classe e dados disponíveis.
2. Solicitar escolha quando aplicável.
3. Verificar se a subclasse selecionada tem catálogo válido.
4. Se faltar conteúdo, informar a limitação; **não inventar características**.
5. Confirmar subclasse junto ao restante do Level Up.
6. Manter mudanças estruturais fora da evolução restritas ao fluxo de configuração, conforme requisito anterior.

**Aceite:** seleção ocorre no momento correto e não altera dados ao cancelar.

### E5.4 — Evolução de múltiplos níveis
1. Dividir a progressão em passos sequenciais por nível.
2. Mostrar escolhas e PV de cada nível.
3. Manter tudo em rascunho até a confirmação global, ou exigir confirmação claramente delimitada por nível conforme decisão aprovada antes de implementar.
4. Evitar saltos que omitam escolhas intermediárias.
5. Testar progressão de um e vários níveis, incluindo cancelamento.

**Aceite:** nenhuma característica intermediária é perdida.

### E5.5 — Revisar regras de recursos e descansos
1. Validar progressão de espaços de magia e recursos especiais conforme classes.
2. Diferenciar espaços comuns de magia e recursos como Pact Magic quando aplicável.
3. Revisar descanso curto e longo, incluindo dados de vida.
4. Testar casos de classes distintas e fichas legadas.

**Gate G5:** evolução completa e cancelamento seguro, sem regressões de importação.

---

## 9. Entrega 6 — Estabilização e liberação (P5)

**Objetivo:** demonstrar que a ficha está pronta para uso e que o plano foi cumprido.

### E6.1 — Ampliar testes unitários
1. Cobrir PV temporários, cura, dano tipado, concentração e vantagens.
2. Cobrir estados de condições, efeitos e recargas.
3. Cobrir migrações, características e deduplicação.
4. Registrar testes que reproduzam bugs corrigidos.

### E6.2 — Criar testes de integração
1. Executar importação/exportação/round-trip de fichas representativas.
2. Testar falha de importação em diferentes etapas.
3. Testar salvar/recarregar com combate ativo, efeitos, recursos e descrições personalizadas.
4. Testar Level Up confirmado e cancelado.

### E6.3 — Testar interface em navegador
1. Verificar desktop e celular em larguras representativas.
2. Verificar temas claro/escuro.
3. Verificar teclado: Tab, Shift+Tab, Enter e Esc conforme cada modal.
4. Verificar que fundo do modal nunca fecha a janela.
5. Testar ações de combate, iniciativa, edição de posição e histórico.
6. Verificar mensagens de erro, estados vazios e recursos insuficientes.

### E6.4 — Validar desempenho e manutenção
1. Confirmar que a inicialização e o carregamento de catálogos não geram requisições duplicadas desnecessárias.
2. Verificar listeners duplicados, vazamentos de estado e eventos disparados em cascata.
3. Revisar consistência de IDs HTML e referências JS.
4. Executar verificações estáticas e testes existentes.
5. Atualizar documentação de arquitetura e decisões aprovadas.

### E6.5 — Encerrar entrega
1. Consolidar lista de alterações por arquivo.
2. Publicar matriz de testes com aprovado/reprovado/não executado.
3. Registrar limitações e pendências externas.
4. Confirmar que os JSONs originais de teste não foram alterados.
5. Solicitar aprovação final antes de considerar a implementação concluída.

**Gate G6:** nenhum defeito crítico conhecido de integridade, testes essenciais aprovados e pendências documentadas.

---

## 10. Integrações dependentes: munições e poções

### 10.1. Munições — não interferir na reestruturação em andamento

**Estado:** catálogo e armazenamento estão em evolução, conforme `ROADMAP.md` e auditoria.

**Quando o usuário concluir o esquema:**
1. Ler a versão final do JSON e a forma de armazenamento na ficha.
2. Mapear IDs de lotes, vínculos com armas, quantidade e peso.
3. Definir adaptador para o motor de combate sem duplicar estoque.
4. Antes da rolagem, bloquear ataque que exija munição indisponível.
5. Consumir munição na ação conforme regra aprovada, inclusive em erro/acerto, sem consumir duas vezes.
6. Atualizar imediatamente cards, seletores e peso.
7. Testar dois lotes compatíveis, quantidade zero, remoção de lote vinculado e round-trip de JSON.
8. Validar desktop, celular e teclado.

**Não executar:** migração ou refatoração definitiva de munições enquanto o usuário estiver alterando o esquema.

### 10.2. Poções — aguardar JSON exclusivo

**Requisitos já aprovados:**
- Poções favoritas por personagem.
- Favorita com quantidade zero permanece favorita, mas não pode ser consumida.
- Acesso rápido às favoritas e modal com catálogo completo.
- Confirmação antes de consumir.
- Rolagem/aplicação do efeito e registro no histórico.
- Possibilidade de poções personalizadas e descrições preservadas.
- Alvo próprio ou outro alvo, quando aplicável.

**Depois que o JSON for definido:**
1. Ler e validar o catálogo e sua identificação de itens.
2. Definir ligação entre catálogo, estoque do personagem e favoritas.
3. Criar adaptador de consumo e aplicação de efeito.
4. Reutilizar motor de cura/dano/efeitos.
5. Impedir consumo com quantidade zero.
6. Garantir que cancelar não altere estoque ou histórico.
7. Testar persistência de favoritos, quantidades e descrições.
8. Integrar acesso rápido ao HUD.

**Não executar:** criar esquema definitivo com base no formato legado `outro_tipo:"pocao"`.

---

## 11. Matriz de rastreabilidade: achados → execução

| Achado | Problema resumido | Etapas principais |
|---|---|---|
| A-01 | Importação sem rollback | E1.3, E1.4, E1.8 |
| A-02 | Metadados de características descartados | E1.1, E3.4, E5.2 |
| A-03 | Download marcado como salvo | E1.5, E1.7 |
| A-04 | PV temporários ignorados | E2.2 |
| A-05 | Cura acima do máximo regular | E2.2 |
| A-06 | Concentração dispensável | E2.4, E4.4 |
| A-07 | Dano tipado não centralizado | E2.3 |
| A-08 | Vantagens/desvantagens não centralizadas | E2.5, E2.6 |
| A-09 | Condições misturadas com concentração | E3.2 |
| A-10 | Efeitos posteriores limitados/sobrescritos | E3.1, E3.3 |
| A-11 | Histórico heterogêneo | E3.5 |
| A-12 | Modais inconsistentes | E4.4 |
| A-13 | Level Up parcialmente mutável | E5.1, E5.4 |
| A-14 | Subclasses/catálogos incompletos | E5.2, E5.3 |
| A-15 | Testes insuficientes | P-02, E1.8, E6 |
| A-16 | Efeitos não persistidos | E3.1, E3.3 |
| A-17 | Descanso longo/dados de vida | E3.6, E5.5 |
| A-18 | Esquemas de itens em mudança | Seção 10 |

---

## 12. Matriz mínima de cenários de teste

| ID | Cenário | Resultado esperado | Prioridade |
|---|---|---|---|
| T-01 | Editar nome de característica com metadados extras | Extras preservados | Crítica |
| T-02 | Importar JSON inválido | Personagem atual intacto | Crítica |
| T-03 | Falha durante aplicação de importação | Rollback/recuperação demonstrados | Crítica |
| T-04 | Round-trip de Waldo e Thrain | Campos essenciais preservados; diferenças justificadas | Crítica |
| T-05 | Dano menor que PV temporários | PV regulares inalterados | Crítica |
| T-06 | Dano maior que PV temporários | Excedente descontado dos PV regulares | Crítica |
| T-07 | Cura com PV temporários | PV regulares limitados ao máximo | Crítica |
| T-08 | Dano durante concentração | Teste obrigatório ou abandono explícito | Crítica |
| T-09 | Vantagem e desvantagem simultâneas | Rolagem normal | Alta |
| T-10 | Duas instâncias da mesma magia | Ambas preservadas | Alta |
| T-11 | Aplicação recorrente | Sem novo consumo de espaço/recurso | Alta |
| T-12 | Remover condição | Demais condições e concentração preservadas | Alta |
| T-13 | Característica importada de catálogo | Não ativa por padrão | Alta |
| T-14 | Cancelar modal com alterações | Confirmar descarte; não fechar pelo fundo | Alta |
| T-15 | Cancelar início de combate | Combate continua inativo | Alta |
| T-16 | Iniciar combate | `1d20+bônus`, posição e total persistidos | Alta |
| T-17 | Alterar posição em combate | Iniciativa rolada não muda | Alta |
| T-18 | Encerrar combate | Retorno ao HUD de bônus | Alta |
| T-19 | Cancelar Level Up | Nível, PV e características intactos | Crítica |
| T-20 | Evoluir vários níveis | Escolhas intermediárias preservadas | Alta |
| T-21 | Restaurar backup local | Só após confirmação | Alta |
| T-22 | Recarregar com efeitos ativos | Efeitos e usos restaurados | Alta |
| T-23 | Poção favorita sem estoque | Favorita visível, uso bloqueado | Dependência |
| T-24 | Munição insuficiente | Ataque bloqueado antes de rolar | Dependência |
| T-25 | Navegação por teclado nos modais | Foco contido e restaurado | Alta |

Para cada teste, registrar **versão/commit, ambiente, resultado, evidência e responsável pela validação**. Não classificar como aprovado algo que não tenha sido executado.

---

## 13. Checklist operacional por entrega

### Antes de modificar
- [ ] Autorização explícita recebida.
- [ ] Branch/commit de referência identificado.
- [ ] Código atual conferido com auditoria.
- [ ] Arquivos JSON originais protegidos.
- [ ] Escopo, critérios de aceite e reversão definidos.
- [ ] Dependências de munições/poções verificadas.

### Durante a modificação
- [ ] Alterações pequenas e localizadas.
- [ ] Regras de 2014 conferidas com referência normativa do projeto.
- [ ] Sem sobrescrever personalizações.
- [ ] Sem alterar intencionalmente a lógica de expiração.
- [ ] Sem fechar modal ao clicar no fundo.
- [ ] Novos estados possuem persistência e migração.
- [ ] Testes atualizados junto da mudança.

### Antes de apresentar a entrega
- [ ] Testes relevantes executados.
- [ ] Cenários de falha exercitados.
- [ ] Round-trip executado se persistência mudou.
- [ ] Interface verificada se HTML/CSS mudou.
- [ ] Resultados e limitações documentados.
- [ ] Próximo passo anunciado e aguardando aprovação.

---

## 14. Modelo de relatório de execução de cada etapa

Preencher ao concluir cada lote:

```markdown
### Execução [E?.?] — [Título]
- **Versão/commit inicial:** ...
- **Objetivo:** ...
- **Arquivos alterados:** ...
- **O que foi feito (passo a passo):**
  1. ...
  2. ...
- **Testes executados:** ...
- **Resultados:** aprovado / reprovado / não executado
- **Regressões e riscos remanescentes:** ...
- **Compatibilidade JSON:** ...
- **Como reverter:** ...
- **Decisão pendente do usuário:** ...
- **Próxima etapa sugerida:** ...
```

Nenhuma etapa deve ser apresentada como concluída sem esse registro mínimo.

---

## 15. Riscos, contingências e decisões pendentes

| Risco | Estratégia de mitigação |
|---|---|
| Mudanças de código após a auditoria | Conferir estado atual antes de cada tarefa |
| Perda de JSON na importação | Snapshot, validação prévia, testes de falha e rollback |
| Dados desconhecidos descartados | Migração conservadora e testes de preservação |
| Regressão por alto acoplamento ao DOM | Adaptadores, alterações incrementais e testes de integração |
| Divergências de regras | Referência D&D 5e 2014 do projeto; sem regras caseiras não aprovadas |
| Ausência de conteúdo de subclasse | Informar lacuna; não gerar características fictícias |
| Esquema de munições ainda instável | Congelar integração definitiva até validação |
| JSON de poções ainda inexistente | Implementar interface somente após contrato de dados aprovado |
| Testes históricos desatualizados | Executar nova linha de base e não reutilizar aprovações antigas |
| Backup local indisponível | Mensagem clara e recomendação de exportar JSON |
| Mudança ampla demais | Dividir em lotes reversíveis com gate de aprovação |

**Decisões a tomar no momento adequado (não são pré-requisitos para iniciar E1):**
1. Escolha do armazenamento local de backup e sua política de retenção.
2. Formato exato do identificador de versão JSON.
3. Contrato final de munições e de poções.
4. Tratamento de conteúdo de subclasses ausente.
5. Semântica de confirmação de Level Up com múltiplos níveis.
6. Eventuais exceções às regras oficiais, somente mediante aprovação e registro.

---

## 16. Critérios de encerramento global

A implementação só estará concluída quando:

- [ ] Todos os achados críticos tiverem correção comprovada ou exceção expressamente aprovada.
- [ ] Importação/exportação de personagens reais preservarem os dados relevantes.
- [ ] Backup local e recuperação forem testados.
- [ ] Descrições personalizadas não forem sobrescritas.
- [ ] PV, cura, dano, concentração e vantagem/desvantagem estiverem corretos.
- [ ] Efeitos ativos e recursos persistirem sem duplicação de gastos.
- [ ] HUD de combate corresponder exatamente aos estados aprovados.
- [ ] Modais obedecerem à regra de não fechar pelo fundo.
- [ ] Level Up confirmado/cancelado funcionar sem estado parcial.
- [ ] Testes de navegador, integração e unidade críticos estiverem aprovados.
- [ ] Integrações dependentes respeitarem os contratos finais de munições e poções.
- [ ] Documentação e matriz de regressão estiverem atualizadas.
- [ ] O usuário tiver aprovado a entrega final.

---

## 17. Primeiro passo recomendado após autorização

**Iniciar por P-01 a P-04 (preparação) e E1.1 (preservação de metadados das características).**

Essa sequência tem escopo controlável, reduz risco imediato de perda de dados e estabelece testes reutilizáveis para as demais entregas. Somente depois avançar para a importação recuperável e o backup.

**Estado deste documento:** planejamento concluído; nenhuma alteração no repositório realizada para produzi-lo.
**Referência:** `Auditoria_Final_FichaDnD_2026-11-10.md`.
