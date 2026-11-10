# Plano: catálogo e seção de Outros

**Estado:** plano implementado; efeitos de poções, consumo em combate e automação de proficiência permanecem fora do escopo.

## Objetivo

Organizar os itens que não pertencem às seções próprias de Armas, Armaduras, Escudos, Munições ou Vestimentas e acessórios. A seção **Outros** continuará sendo um único painel no inventário, com itens de tipos diferentes juntos, sem subdivisões internas nem ordem obrigatória por tipo. Os catálogos padrão serão separados em arquivos JSON por tipo, pois cada família poderá ter dados e regras particulares.

O primeiro escopo deve cobrir cadastro, pesquisa, visualização, edição, quantidade, preço, peso, raridade, descrição e compatibilidade com fichas antigas. Mecânicas específicas de poções e efeitos mágicos ficam para projetos próprios.

## Decisões de produto

### Tipos de itens

Manter estas famílias como tipos distintos no catálogo e nos filtros:

| Tipo | Exemplos e propósito |
|---|---|
| Poções | Poção de cura e outras poções. Separadas para permitir uma mecânica própria futuramente. |
| Consumíveis | Itens consumidos ou gastos, exceto poções, cuja mecânica pode variar. |
| Ferramentas e kits | Kit de disfarce, kit de falsificação e outras ferramentas com proficiência individual. |
| Instrumentos musicais | Instrumentos com proficiência individual; podem ser usados como foco de conjuração por bardos. |
| Pacotes de equipamento | Pacote de sacerdote, pacote de explorador e outros conjuntos vendidos como pacote. Não concedem proficiência. |
| Focos de conjuração | Símbolos sagrados, focos arcanos e druidas, quando aplicáveis. |
| Componentes materiais | Componentes de magia e bolsas de componentes. |
| Equipamento geral | Corda, tocha, mochila e objetos úteis sem categoria própria. |
| Tesouros e valores | Gemas, objetos de valor e tesouros sem uso mecânico específico. |
| Outros | Reserva para itens que não se encaixem nas famílias anteriores. |

Pacotes e kits ficam separados porque kits representam ferramentas nas quais um personagem pode ter proficiência específica, enquanto pacotes representam conjuntos de equipamento. A proficiência pertence ao kit individual: possuir proficiência em Kit de Disfarce não implica proficiência em Kit de Falsificação. Instrumentos também ficam em seu próprio tipo, pois cada instrumento tem proficiência separada. Nenhum bônus de proficiência deve ser concedido apenas por possuir ou equipar o item.

Instrumentos musicais têm o campo opcional `podeSerFocoArcano` (booleano), apresentado futuramente como um select simples. O catálogo marca os instrumentos oficiais como utilizáveis como foco de conjuração por bardos. Isso é uma propriedade do instrumento; não o duplica no catálogo de focos arcanos. A ficha não ativa automação de magia nesta etapa.

O uso físico de instrumentos em combate fica para uma fase futura. O alaúde, por exemplo, deverá poder ser tratado como ocupando as duas mãos durante seu uso; este rascunho não adiciona custo de mão nem bloqueio de ações. A regra e o momento em que as mãos ficam ocupadas serão definidos junto à futura mecânica de combate.

### Apresentação no inventário

Todos os tipos continuam juntos no painel **Outros**, sem caixas ou grupos internos. Cada item usa um card compacto no padrão visual já documentado em [DECISOES_DE_ARQUITETURA.md](../../DECISOES_DE_ARQUITETURA.md), seção “Padrão visual do card de item do inventário”:

- Nome, com quantidade antes do nome quando aplicável.
- Tags de tipo e raridade.
- Preço e peso no rodapé, com os ícones e formatos já usados.
- Sem descrição, controles de combate ou propriedades extensas no card compacto.
- Uma única moldura para o card, sem borda ou sombra duplicada no botão interno.
- Cores, tipografia, espaçamento, indicador de abertura e comportamento responsivo alinhados aos cards existentes.

Exemplo meramente visual, com valores fictícios:

```text
[ 2 ] Cordas
Equipamento · Comum
1 PO · 0,5 kg
```

Não usar esses valores como dados de catálogo. A quantidade aparece antes do nome quando for maior que 1. Para poções e consumíveis, a quantidade é editável diretamente no card, inclusive quando for 1. Para as demais famílias, quantidade maior que 1 aparece no título, mas sua alteração ocorre pelo modal de edição. Quantidade 1 fica omitida nos demais tipos.

### Catálogos separados por JSON

Cada tipo terá um arquivo de catálogo próprio, carregado por um registro central que associa tipo, rótulo, caminho e versão do esquema. Local sugerido:

```text
assets/data/itens/outros/
  pocoes.json
  consumiveis.json
  ferramentas-kits.json
  pacotes-equipamento.json
  focos-conjuracao.json
  componentes-materiais.json
  equipamento-geral.json
  tesouros-valores.json
  outros.json
```

Os arquivos contêm modelos de catálogo compartilhados, não o inventário de um personagem. O personagem continua salvando suas instâncias em sua ficha. Cada cópia deve conservar um ID próprio de instância e pode guardar um `catalogo_id` opcional para rastrear sua origem. Itens criados manualmente não precisam ser inseridos nos catálogos compartilhados.

Cada tipo poderá estender um núcleo comum, sem exigir que todas as famílias tenham os mesmos campos. O núcleo proposto é:

```json
{
  "versaoSchema": 1,
  "id": "corda",
  "tipo": "equipamento-geral",
  "nome": "Corda",
  "raridade": "comum",
  "descricao": "",
  "quantidadeInicial": 1,
  "quantidadeMaxima": null,
  "consumivel": false,
  "custo": { "valor": 1, "moeda": "po" },
  "pesoKg": 5
}
```

O exemplo é apenas estrutural e não define o valor ou peso oficial de nenhum item. Campos específicos, como proficiência aplicável, dados de uso/consumo ou informações futuras de poção, devem pertencer ao tipo que os utiliza. Dados de efeitos mágicos ficam inertes até existir uma regra explícita e aprovada para interpretá-los.

## Fluxos propostos

### Adicionar pelo catálogo

O botão **+ novo item** abre um seletor no padrão de pesquisa existente: filtro de tipo, pesquisa, lista de resultados e prévia do item em telas largas; em telas estreitas, lista e prévia empilham sem transbordamento. A prévia informa nome, tags, descrição, preço e peso. Escolher um item copia seus dados para uma nova instância no inventário e fecha o seletor ou permite continuar adicionando, de acordo com o comportamento compartilhado já usado pelos catálogos. Não abrir a edição automaticamente após escolher um resultado.

O catálogo inicial deve incluir apenas itens comuns, salvo se o usuário aprovar outro escopo. Itens mágicos não serão adicionados nesta fase.

### Visualizar e editar

O modal de visualização segue o padrão arquitetural documentado para equipamentos: cabeçalho com nome, ícone/tags e ações; detalhes e descrição no corpo; Editar com ícone de lápis e Fechar explícito; Remover com ícone de lixeira no canto inferior direito. O clique no fundo não fecha modal. A edição mostra apenas os campos pertinentes ao tipo e mantém Cancelar/Salvar no rodapé; exclusão pede confirmação.

Poções e consumíveis podem alterar a quantidade no card; o modal também permite editar essa quantidade. Nos demais tipos, quantidade só é editável pelo modal. Alterações de quantidade, preço ou peso atualizam imediatamente o peso carregado e os resumos do inventário.

## Regras e integrações

1. **Quantidade e consumo:** distinguir `quantidade` da instância de `quantidade_maxima` ou tamanho de embalagem. Para itens sem limite, o máximo é nulo. Não limitar quantidades de objetos comuns por presunção.
2. **Peso:** esclarecer por tipo se o peso informado é unitário, do conjunto ou do pacote. Persistir a semântica no esquema antes de implementar a fórmula; não aplicar automaticamente a regra de peso de munição a outros itens.
3. **Proficiência:** ferramenta/kit pode referenciar a proficiência correspondente, mas não altera testes automaticamente nesta entrega. Isso respeita as regras atuais da ficha sem presumir uma mecânica de proficiência por item ainda inexistente.
4. **Poções:** registrar campos que possam ser úteis à futura mecânica somente após definir o escopo dela. O primeiro catálogo não deve consumir ações, aplicar cura ou criar efeitos automaticamente.
5. **Efeitos mágicos:** manter raridade e dados extensíveis caso o modelo compartilhado precise deles, mas sem bônus de ataque, dano, CA, vantagem ou outros efeitos ativos.
6. **Inventário e exportação:** mapear `outro_nome`, `outro_tipo`, `outro_quantidade`, descrição, valor, peso e flags existentes. O novo código deve ler fichas antigas sem perda; a política de escrita/espelhamento legado deve ser decidida antes da migração e preservar campos desconhecidos.
7. **Itens duplicados:** manter instâncias separadas por padrão. Empilhamento automático pode mesclar objetos com descrição ou estado diferente e fica fora do primeiro escopo.
8. **Acessibilidade e responsividade:** busca e controles devem funcionar por teclado; cards devem preservar alvos clicáveis e não abrir o modal ao editar quantidade. Modais altos rolam internamente e mantêm ações alcançáveis em telas estreitas.

## Fases executadas

1. **Contrato e compatibilidade — concluído:** IDs de instância independentes, metadados por família e espelhamento dos campos antigos `outro_*`. O importador guarda propriedades desconhecidas e o coletor as preserva na exportação.
2. **Registro e catálogos — concluído:** 10 famílias registradas, incluindo JSON próprio para instrumentos; 141 itens e modelos comuns; poções sem itens no catálogo atual.
3. **Seletor e modais — concluído:** tipo, busca, lista, prévia, visualização, edição, remoção confirmada e saídas explícitas. A criação manual pergunta primeiro a família do item e só então apresenta o formulário compatível; proficiência relacionada só aparece para ferramentas/kits e instrumentos, e foco arcano só para instrumentos. O fundo não fecha nenhum modal.
4. **Card único de Outros — concluído:** categorias misturadas em um painel, um contorno por card, valores/raridade/tipo e quantidade com edição inline apenas para itens consumíveis.
5. **Integração — concluído:** quantidade/peso atualizam o inventário, peso informado multiplica pela quantidade, peso desconhecido permanece vazio e dados legados continuam em `outros[]`.
6. **Validação — primeira rodada concluída:** 36 testes automatizados passaram, cobrindo também a ordenação por categoria e o formulário condicionado ao tipo. No navegador foram verificados catálogo (141 entradas), adição sem abrir edição, modal de instrumento, salvamento, quantidade inline e recálculo de peso; seletor e modal cabem em 375 px. A página ainda apresenta uma faixa de rolagem horizontal de 8 px no rodapé global em janela estreita, fora dos novos modais. Repetir importação/exportação com uma ficha Waldo é recomendável antes de publicar a ficha para os outros computadores.
7. **Migração de fichas — concluída para os arquivos versionados:** `scripts/migrar-itens-personagens.cjs` converte itens legados e separa munições e vestimentas, mantendo IDs e dados adicionais sempre que disponíveis. Round-trip manual das fichas migradas continua pendente.

## Critérios de aceite da implementação

- [x] Há um JSON por tipo e um registro central; falha de catálogo mantém caminho para cadastro manual.
- [x] Todos os tipos coexistem em um único painel Outros, sem subseções internas.
- [x] O card contém quantidade aplicável, nome, tags de tipo/raridade e preço/peso.
- [x] Consumíveis têm quantidade editável inline; demais tipos mostram quantidade acima de 1 e editam pelo modal.
- [x] Digitação inline não abre a visualização e atualiza imediatamente peso e resumos.
- [x] Seleção de catálogo adiciona sem abrir edição.
- [x] Visualização, cadastro e edição usam os padrões documentados; o fundo não fecha modais.
- [x] Campos legados e propriedades desconhecidas são preservados pelo caminho de importação/exportação.
- [x] Proficiência, poções e efeitos mágicos não ativam regras ainda não implementadas.
- [x] Instrumentos registram proficiência individual e uso como foco; mãos em combate seguem fora do escopo.
- [x] Novos cards e modais não transbordam a viewport estreita na validação inicial; o pequeno excesso atual está no rodapé geral da ficha e foi anotado para correção futura.
- [ ] Repetir round-trip completo de importação/exportação com uma ficha Waldo e revisar os arquivos migrados com conteúdo real em diferentes larguras antes da validação visual final.

## Questões reservadas para etapas futuras

- Qual será a mecânica própria das poções, incluindo ações, efeitos, duração e recuperação?
- Consumíveis não mágicos terão consumo automático em combate ou continuarão com quantidade editada manualmente?
- A futura regra de mãos ocupadas por instrumentos será aplicada ao tocar, empunhar ou em ambos os casos? A quantidade de mãos será definida por instrumento?
- Como itens mágicos de “Outros” representarão e aplicarão efeitos quando o sistema de regras correspondente for aprovado?

## Fora do escopo desta proposta

- Implementar efeitos, ações ou recuperação de poções.
- Implementar consumo automático de consumíveis em combate.
- Criar itens mágicos ou ativar bônus mágicos.
- Criar um sistema de proficiência ou vantagem baseado em itens.
- Subdividir visualmente o painel Outros por tipo.
- Empilhar ou mesclar automaticamente itens iguais.
- Alterar regras oficiais de preço, peso, consumo ou proficiência.

## Implementação entregue

- Catálogos separados por família e registro central em `assets/data/itens/outros/`; os arquivos mantêm somente itens comuns. O catálogo de poções permanece reservado e vazio porque a poção de cura do livro é mágica.
- O seletor reúne os tipos em uma pesquisa e filtro únicos, com lista e prévia; adicionar um resultado cria uma instância no inventário e fecha o seletor sem abrir a edição.
- O inventário mantém um painel único para “Outros”. Cada item tem uma só moldura, tags de tipo/raridade, preço e peso no rodapé; quantidade aparece antes do nome quando aplicável. Poções/consumíveis permitem edição de quantidade no card; os demais tipos editam quantidade no modal.
- Visualização e edição usam ações explícitas. Clique no fundo não fecha os modais; Editar usa lápis, Remover usa lixeira e confirmação. Itens podem ser criados manualmente.
- Os valores continuam nos campos antigos `outro_*`; metadados novos identificam família, catálogo, raridade, moeda, consumo, proficiência, uso como foco e se preço/peso foram informados. Isso mantém a importação/exportação das fichas existentes compatível e preserva campos desconhecidos.
- Peso informado é tratado como unitário e multiplicado pela quantidade pelo cálculo de inventário existente. Peso/valor ausentes permanecem vazios e são apresentados como não informados; não se inventa peso para pacotes.
- Instrumentos têm proficiência individual e opção de foco arcano no cadastro/modal. Essas informações não concedem proficiência nem alteram conjuração. A ocupação das mãos continua reservada para etapa futura.
- O teste funcional foi feito no seletor, adição e visualização de item; a suíte `node --test tests/*.test.cjs` passou. A apresentação em tamanhos móveis ainda deve ser conferida com conteúdo real de fichas e diferentes larguras antes de considerar a revisão visual final.
