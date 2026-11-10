# Projeto: catálogo e seção própria de munições

**Estado:** implementação em andamento; direção e regra de peso aprovadas pelo usuário.

## Objetivo

Criar uma seção **Munições** logo abaixo de **Armas**, seguindo a hierarquia visual existente — assim como escudos ficam abaixo de armaduras. Munição deixa de ser cadastrada como item de “Outros”, passa a ter catálogo e modelo próprios, mantém quantidade editável diretamente no card e continua ligada às armas e ao combate.

O primeiro catálogo terá somente munições comuns de D&D 5e 2014. O modelo deve permitir itens customizados e, futuramente, munições mágicas com efeitos estruturados, sem criar esses itens nem ativar bônus nesta etapa.

## Levantamento do estado atual

- A ficha compartilhada mostra **Armas** primeiro, seguida por **Armaduras**, **Escudos**, **Vestimentas e acessórios** e **Outros**. A nova caixa pode ocupar o lugar pedido imediatamente abaixo da caixa de armas.
- Virotes, flechas e outros tipos hoje são cards genéricos em `#listaOutros`, diferenciados por `outro_tipo = "Municao"`. Quantidade, nome e descrição usam os campos de “Outros”. A ficha de Waldo contém 20 Virotes neste formato; fichas de Thrain também contêm Flechas e Virotes.
- Cada arma guarda `arma_municao_id`, que aponta ao `dataset.id` de um card de munição. As opções são montadas em `atualizarOpcoesMunicao()` examinando `#listaOutros`; a sugestão inicial do catálogo de armas tenta inferir o tipo pela semelhança do nome em `encontrarMunicaoDoTipo()`.
- A munição escolhida aparece no card/modal da arma e nos seletores dos espaços de ataque. A sincronização de combate também compõe o nome/quantidade do lote selecionado.
- `consumirMunicao()` reduz um projétil e atualiza os seletores. O consumo é chamado por `registrarHistoricoAtaqueArma()` após a resolução do ataque; quando a quantidade já é zero, a rotina avisa, mas não consegue impedir o ataque que já foi resolvido. A validação da disponibilidade precisa ocorrer antes de lançar o ataque.
- `atualizarPesoAtualInventario()` soma peso de “Outros” multiplicado pela quantidade. Na ficha compartilhada, os Virotes do Waldo têm quantidade 20 e peso 0,75 kg, valor correspondente ao pacote do livro. A regra atual multiplica `0,75 × 20`, computando 15 kg para o lote. O novo contrato precisa representar tamanho e peso do pacote para calcular corretamente o peso de quantidades parciais.
- Persistência e importação salvam/restauram munição dentro de `outros`. A migração precisa preservar IDs de instância, vínculo da arma, nome, quantidade, descrição e flags já presentes; uma ficha antiga deve continuar importável.

## Referência do catálogo inicial

A tabela de equipamento do D&D 5e 2014 lista quatro munições. Os valores são do pacote indicado na tabela. Para o peso, o projeto já documenta a convenção métrica de 0,5 kg por libra usada nos catálogos; o preço conserva a moeda original.

| Munição | Compatibilidade | Quantidade por pacote | Preço do pacote | Peso do pacote (convenção da ficha) |
|---|---|---:|---:|---:|
| Flechas | Arcos | 20 | 1 po | 0,5 kg |
| Agulhas de zarabatana | Zarabatana | 50 | 1 po | 0,5 kg |
| Virotes | Bestas | 20 | 1 po | 0,75 kg |
| Balas de funda | Funda | 20 | 4 pc | 0,75 kg |

Fontes normativas: [D&D Beyond — Basic Rules 2014, Weapon Properties e Ammunition](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/equipment) e [Wizards of the Coast — Basic Rules Player v3.4, tabela de Adventuring Gear](https://media.wizards.com/2015/downloads/dnd/BasicRules_Playerv3.4_PF.pdf). A propriedade Munição determina o consumo de uma peça por ataque e permite recuperar metade da munição gasta ao procurar o campo de batalha após o combate. O mesmo texto descreve carregar a munição como parte do ataque. Recipientes, como aljava, estojo de virotes e bolsa, são equipamentos separados, não munições.

## Modelo de dados proposto

Adicionar `assets/data/itens/municoes.json` como catálogo estático versionado, seguindo o padrão dos catálogos de armas, armaduras e escudos. Cada tipo deve ter ID estável — por exemplo `flechas`, `agulhas-zarabatana`, `virotes` e `balas-de-funda` — para as armas nunca dependerem de comparação parcial de nomes.

Campos do catálogo implementado:

```json
{
  "id": "virotes",
  "tipo": "municao",
  "raridade": "comum",
  "nome": "Virotes",
  "nomeOriginal": "Crossbow bolts",
  "compatibilidade": ["besta-leve", "besta-de-mao", "besta-pesada"],
  "quantidadePacote": 20,
  "custo": { "valor": 1, "moeda": "po" },
  "pesoPacoteKg": 0.75,
  "descricao": "Projéteis disparados por bestas."
}
```

Cada lote do personagem mantém um **ID de instância** próprio e a referência opcional `municao_catalogo_id`, além de nome, quantidade, descrição, tamanho/preço/peso do pacote e dados extensíveis. A quantidade representa peças individuais. O cálculo é `pesoTotal = quantidade / quantidadePacote × pesoPacoteKg`; assim um pacote completo mantém o peso do livro e a contagem continua editável peça a peça. Preço do pacote é informativo e não muda automaticamente ao alterar a quantidade.

O contrato pode reservar `raridade`, `magico` e uma lista `efeitos` com tipos permitidos/versionados para futuras extensões. No primeiro catálogo, todos os itens são comuns, `magico: false` e `efeitos: []`. Não executar código nem interpretar texto livre como efeito; bônus de ataque/dano só entram quando a ficha tiver regras aprovadas para aplicá-los.

## Experiência proposta

- Cabeçalho/cartão **Munições** imediatamente abaixo de **Armas**, com o mesmo brasão, contador e ação de adicionar usados nas outras categorias.
- Cards compactos no padrão do inventário. **Nome e quantidade** têm maior destaque; quantidade é um campo numérico acessível no próprio card e mudanças atualizam peso, combate e seletores imediatamente. A descrição fica na visualização/edição, para o card continuar limpo.
- Ação de adicionar abre um seletor com pesquisa, filtro por compatibilidade/categoria, lista e prévia de detalhes, seguindo o padrão de pesquisa e exibição de Armas, Armaduras e Escudos. Item comum adicionado começa com a quantidade de um pacote do catálogo; a pessoa pode ajustar essa quantidade no card.
- Modal de visualização/edição segue os modais existentes. Clique no fundo não fecha; os controles de saída são explícitos. Criação manual permite munição customizada, inicialmente comum, sem inventar regras mágicas.
- Diferentes lotes da mesma munição continuam separados. Não consolidar automaticamente, pois um lote customizado/mágico futuro pode ter efeitos próprios.
- Seletores de armas oferecem somente lotes compatíveis. Havendo mais de um lote do mesmo tipo, a pessoa escolhe qual gastar; a automação não deve trocar silenciosamente de lote.

## Integrações a mapear e validar

1. **Inventário:** renderização, contador, criação, edição, remoção, ordenação, resumo de carga e edição da quantidade inline.
2. **Armas e catálogo:** propriedade `municao`, mapeamento por tipo/ID, sugestão automática de lote compatível e seleção manual no card/modal.
3. **Espaços de combate:** armas principal e secundária, rótulo com nome/quantidade, atualização quando a contagem muda, quando um lote é removido ou quando a arma muda.
4. **Ataques:** reservar/verificar uma unidade antes do ataque; consumir uma por tentativa concluída, inclusive ataque que erra; nunca consumir se o ataque for cancelado ou for uma magia sem arma. Validar múltiplos ataques, dois espaços, arma sem munição e lote zerado. Recuperação de metade após combate fica fora da primeira entrega, embora seja uma regra disponível para fase futura.
5. **Peso e capacidade:** usar peso do pacote e tamanho do pacote para lotes completos ou parciais; atualizar imediatamente o peso atual ao digitar quantidade ou excluir o lote. Não multiplicar peso de pacote pelo número de projéteis.
6. **Salvar/importar:** introduzir `dados.municoes` no contrato de ficha; importar munição legada de `dados.outros` reconhecendo `outro_tipo` sem depender de acento/maiúsculas; manter o ID original para não invalidar `arma_municao_id`. Na importação, quando os mesmos IDs vierem nos campos novo e legado, preferir o novo sem duplicar.
7. **Compatibilidade entre versões:** escolher uma estratégia de escrita antes de implementar. Recomenda-se gravar o formato canônico `municoes` e, durante uma janela de compatibilidade, incluir espelho legado em `outros` ao exportar. A importação nova deduplica por ID; versões antigas continuam reconhecendo os lotes. Definir depois quando retirar o espelho.
8. **Dados antigos personalizados:** lotes reconhecidos pelo catálogo podem receber tamanho/peso de pacote canônicos, mantendo ID, nome, quantidade e descrição. Para munições customizadas ou não reconhecidas, preservar os dados e o peso total legado; nunca substituir uma ficha salva apenas por corresponder ao nome.

## Riscos e recomendações

| Risco | Tratamento recomendado |
|---|---|
| Referências de armas ficam órfãs após a mudança de seção | Preservar exatamente o ID de cada lote migrado; atualizar os dois espaços de combate e todos os cards ao editar/remover. |
| Fichas antigas duplicam ou perdem munição | Importador idempotente, deduplicação por ID, espelho legado temporário e round-trip com JSON real antes de aposentar `outros`. |
| Custo/peso do livro são por pacote, enquanto a ficha edita unidades | Persistir `quantidadePacote`, `custo` e `pesoPacoteKg`; calcular peso proporcional por peças atuais e manter conversão documentada. |
| Ataque ocorre sem munição | Validar quantidade antes de permitir a jogada; não basta exibir alerta depois da rolagem. |
| Múltiplos lotes compatíveis consomem do lote errado | Manter vínculo explícito por ID de instância; não trocar de lote automaticamente ao esgotar o escolhido. |
| Munição mágica futura concede bônus indevido ou mistura regras | Schema extensível, efeitos allowlistados e desativados no catálogo comum; reservar implementação de regras para projeto próprio. |
| UI fica apertada em celular ou a quantidade dispara a abertura do modal | Manter input de quantidade dentro da área interativa do card, não propagar o clique, usar `min=0`, rótulo acessível, rolagem/foco e layout responsivo. |

## Etapas sugeridas

- [x] Aprovar direção, regra de peso por pacote e política de compatibilidade com JSON antigo.
- [x] Criar catálogo JSON com as quatro munições comuns de 2014 e compatibilidade por tipo de arma.
- [x] Criar seção/cards e seletor com busca, filtro de compatibilidade e prévia; quantidade editável diretamente no card.
- [x] Migrar importação/exportação e dados legados sem perder identidade ou vínculo de arma; manter espelho legado.
- [x] Integrar seletores de armas e espaços de combate pelo ID e compatibilidade dos itens de catálogo.
- [x] Integrar consumo de uma peça por ataque concluído, bloqueio por quantidade zero e recálculo de peso/carga.
- [ ] Validar visualmente em telas pequenas, teclado/foco e realizar round-trip com a ficha de Thrain.
- [ ] Só após os testes, registrar conclusão no Roadmap e decidir a remoção futura do espelho legado.

## Critérios de aceite

- [ ] A seção Munições aparece logo abaixo de Armas; CSS responsivo foi adicionado, com revisão visual em telas menores ainda pendente.
- [ ] Nome e quantidade são visíveis; quantidade pode ser alterada no card sem abrir o modal e a descrição pode ser consultada/editada.
- [x] Os quatro tipos oficiais estão no JSON com quantidade de pacote, preço/moeda, peso e compatibilidade documentados.
- [x] Arcos, bestas, zarabatana e funda filtram munição compatível; armas arremessáveis sem propriedade Munição não ganham consumo indevido.
- [x] Cada ataque concluído consome exatamente uma peça; ataque sem munição é impedido antes da rolagem.
- [x] Peso do pacote completo/fracionado é correto e mudanças atualizam a carga imediatamente.
- [x] Importar ficha legada mantém campos, IDs e vínculos; Waldo foi importado, salvo em memória e reimportado sem duplicar ou perder lotes.
- [ ] Lotes mágicos/customizados podem ser representados no schema futuro sem bônus ativo no escopo inicial.

## Ideias adicionais para avaliar

- **Contêineres como itens separados:** aljava (até 20 flechas), estojo (até 20 virotes) e bolsa (20 balas de funda ou 50 agulhas) são equipamentos com capacidade descrita nas regras. Podem aparecer como acessórios, sem impor limite rígido de inventário inicialmente.
- **Recuperar munição após combate:** ação manual para recuperar metade das peças gastas, com confirmação e histórico; não implementar junto com o primeiro catálogo para evitar introduzir um fluxo de batalha novo.
- **Aviso de pouca munição:** indicador discreto no card e no espaço de ataque quando o lote está baixo ou vazio, respeitando a checagem impeditiva ao zerar.
- **Ações rápidas de lote:** botões pequenos `+ pacote` e `- peça` podem acelerar ajustes após compra/saque, sem substituir a edição direta da quantidade.
- **Municiamento especial futuro:** efeitos com duração/consumo e bônus limitados a tipos predefinidos (por exemplo, bônus de ataque ou dano) devem ser registrados por instância e aplicados pelo fluxo de combate, nunca por texto da descrição.
