# Combate 2.0 — mapeamento visual e mecânico

## Referências e limites

- Referência visual preservada: [`FichaDnD-Combate-2.0.html`](../FichaDnD-Combate-2.0.html).
- Experimento separado: [`Combate 2.0 - referencia fiel.html`](../../ficha/Codigos%20testes/Combate%202.0%20-%20referencia%20fiel.html).
- A aba oficial continua em `#combate` no HTML da ficha. Este mapeamento não estabelece uma integração de produção, contrato JSON nem uma nova fonte de estado.
- O adaptador `window.FichaDnDCombate20` do experimento é apenas uma fronteira de apresentação transitória: recebe uma projeção calculada pela ficha e encaminha solicitações ao host. Não persiste dados, calcula regras ou atualiza estado por conta própria. O mapa `capacidades` da projeção controla quais ações o host aceita; sem capacidade explícita, o controle permanece desativado. Essa forma é específica do protótipo e não é um contrato de produção.

## Correspondência de componentes

| Elemento visual de origem | Fonte atual da ficha | Dados e eventos correspondentes | Adaptação / estado |
|---|---|---|---|
| Cabeçalho, personagem e navegação | `#nomePersonagem`, `#racaID`, `#classeNomeID`, `#classeNivelID` no HTML oficial | Nome, raça, classe e nível | Leitura direta possível; abas de contexto do protótipo continuam decorativas. |
| PV, corações e controles | `#pvAtual`, `#pvTotal`, `#pvTemporario`; `aplicarDanoNoPV()` e `curarPV()` em `js/modules/combate.js`; desenho oficial em `atualizarCoracoesVida()` de `js/core/events.js` | Valores efetivos, máximo e temporários; ações devem delegar aos controles/rotinas oficiais | O experimento representa o retrato recebido com os mesmos cinco corações de PV e coração temporário da ficha oficial. O preenchimento é somente visual; não calcula dano/cura, não modifica PV nem persiste estado. |
| Classe de Armadura e armadura | `#ca_valor`, `#ataqueCaTotal`, `#escudoCA`, `#armaduraNome`; `atualizarClasseArmaduraEquipada()` e sincronização em `js/modules/equipamentos.js` | CA total/descrição e opções filtradas de armadura já produzidas pela ficha | CA aparece centralizada em um escudo visual simplificado. O seletor de armadura permanece compacto, sem rótulos de estado redundantes, no cartão de defesa. A ficha oficial continua responsável pela seleção e cálculo. O valor de CA só atualiza quando a origem envia nova projeção calculada. |
| Iniciativa, posição, rodada | `#btnRolarIniciativa`, `#combateInicioControle`, `#combatePosicaoCaixa`, `#ataquePosicao`, `#combateRodada`, `#btnProximaRodada`, `#btnEncerrarCombate`; `estadoCombateIniciativa`, `abrirModalIniciativa()`, `confirmarIniciativa()`, `avancarRodadaCombate()`, `encerrarCombate()` em `js/modules/combate.js` | Bônus da ficha, resultado, posição e rodada | Estado e funções são internos ao script. O experimento não replica a rolagem: solicitação futura deve acionar o fluxo oficial/modal. |
| Condições e concentração | `#ataqueCondicao` e fluxos de concentração em `js/modules/combate.js` / `js/modules/magias.js` | A ficha atual fornece a condição legada e o estado de concentração | O protótipo reúne condição e concentração no mesmo cartão. O modal apresenta as 15 condições de D&D 5e e entrada “Outros” separada por vírgulas; pode encaminhar seleções ao host experimental, mas o contrato para múltiplas condições ainda não existe na ficha oficial. A lista ativa só deve refletir uma projeção do host, sem estado local persistente ou regras de condição duplicadas. Integração de múltiplas condições segue pendente. |
| Mão principal/secundária, armadura e escudo | `#arma1Nome`, `#arma2Nome`, `#armaduraNome`, `#escudoCA`; `ehEscudoEmpunhavel()`, `atualizarEstadoCombate()`, `atualizarUIEmpunhadura()` e `sincronizarEquipamentosCombate()` em `js/modules/equipamentos.js` | Opções e seleção, ocupação, tipo de empunhadura, escudo e CA | O adaptador visual deve receber opções já filtradas pelo módulo oficial. Escudos só são aceitos se `escudo_tipo === "Escudo"`; não repetir filtro nem inferir elegibilidade no protótipo. |
| Acessórios e itens em mãos | Coletores de equipamentos em `js/modules/equipamentos.js` | Acessórios que não ocupam as mãos e itens equipados | O experimento só apresenta os rótulos recebidos. Contratos de munições e poções permanecem protegidos. |
| Ataques | `#arma1Ataque`, `#arma1Dano`, `#arma2Ataque`, `#arma2Dano`, `#listaArmas`; `atualizarSubAbaArmas()` e `abrirModalAtaqueArma()` em `js/modules/combate.js` | Ataques, atributo, bônus, dano e propriedades produzidos pelos módulos atuais | Ações devem abrir o modal oficial. O protótipo não rola dados, não aplica dano e não reconstrói os bônus. `js/domain/regras-combate.js` contém regras puras parciais ainda não integradas a todos os fluxos. |
| Magias e ações | `atualizarSubAbaMagiasCombate()`, `abrirModalUsarMagia()` em `js/modules/magias.js`, além dos fluxos de `js/modules/combate.js` | Lista elegível, espaços e ação correspondente | A seleção, elegibilidade e consumo pertencem às funções existentes. Algumas ações e ações rápidas do desenho ainda não têm um contrato unificado de dados. |
| Recursos de combate | `#listaPocoesEquipadas`, `consumirPocaoEquipada()` e componentes de habilidades/efeitos | Nome, disponibilidade e ação oficial | O experimento não consome itens, recursos ou efeitos. Nenhum contrato de poção ou recurso é criado. |
| Concentração e histórico | Fluxos em `js/modules/combate.js` e `js/modules/magias.js`; `adicionarRegistroHistoricoCombate()` | Estado de concentração e registros existentes | A concentração é mostrada junto ao cartão de condições e segue como projeção de leitura. Salvaguarda obrigatória, fila e persistência permanecem nos fluxos oficiais. |

## Contrato experimental de apresentação

O protótipo pode receber uma projeção efêmera em `window.FichaDnDCombate20.atualizar(projection)` e um callback opcional via `conectar({ aoAcionar })`. A forma do objeto é somente um view model da página de teste, não formato persistido nem API estável. Cada total exibido (CA, bônus/dano, PV e estado de combate) deve ser previamente calculado pelo módulo oficial. Solicitações de ação são encaminhadas ao host; a interface não as aplica localmente. O mapa `capacidades` usa os tipos de ação solicitados como chaves e habilita apenas controles explicitamente suportados pelo host.

### Ícones individuais de armas

O bloco JSON `#combatIconManifest` do HTML experimental associa somente o ID de catálogo `espada-longa` ao SVG Two Handed Sword. O adaptador visual experimental deve fornecer esse ID em `catalogoId` para os itens de mão e os ataques correspondentes. O mesmo recurso é então exibido nas duas mãos e no card de ataque. Armas sem associação usam `mao-ocupada.svg`; se esse recurso também falhar, o protótipo conserva a adaga vetorial como último recurso. Mãos livres usam `mao-vazia.svg`; escudos mantêm seu símbolo próprio. Não há inferência por nome nem alteração da elegibilidade do equipamento. Crédito, licença CC BY 3.0 e modificações do SVG da Espada Longa constam em [`ATTRIBUTION.md`](../../assets/icons/ATTRIBUTION.md).

Sem host, os valores ficam vazios e os controles que poderiam alterar o personagem permanecem desativados. A navegação entre abas é apenas interação local de visualização. A remoção de qualquer handler que faça rolagens ou mutações demonstrativas impede que dados fictícios sejam confundidos com o estado real.

## Pendências para integração futura

1. Definir, em etapa autorizada, um adaptador dentro da ficha que construa a projeção a partir de funções e DOM oficiais sem duplicar cálculo.
2. Definir encaminhamento para os handlers oficiais sem expor ou substituir estado lexical interno, especialmente iniciativa, empunhadura, ataques, magias, PV, concentração e histórico.
3. Preservar a filtragem recente de escudos e as regras atuais de ocupação das mãos.
4. Resolver separadamente os bloqueios E2 conhecidos antes de ligar cálculos de PV/dano ao armazenamento.
5. Testar importação/rollback, acessibilidade, teclado e responsividade com dados sintéticos antes de qualquer substituição da aba oficial.

Nenhum item desta lista autoriza migrar o protótipo para produção. E2 permanece parcial e a aba Combate oficial não foi alterada nesta atividade.
