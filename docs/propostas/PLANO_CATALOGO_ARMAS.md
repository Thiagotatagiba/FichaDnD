# Plano de catálogo e reformulação de armas

Estado: catálogo, seletor, card e modal implementados. Falta validar a experiência no navegador e fechar a regressão de importação/combate.

## Objetivo

Adicionar armas ao inventário em etapas, com catálogo JSON, pesquisa e prévia, cadastro manual, cards compactos e modal de detalhes/edição. O desenho deve seguir a experiência criada para armaduras e escudos sem quebrar fichas existentes, armas personalizadas, munição ou os espaços de ataque.

O escopo inicial considera **D&D 5e 2014**, em coerência com `sistema: "dnd5e-2014"` dos catálogos existentes. As armas de maestria e propriedades da revisão 2024 ficam fora deste primeiro catálogo.

## Plano por etapas

- [x] **1. Fechar o contrato de dados.** Contrato definido para D&D 5e 2014, preço com moeda original, peso em kg e alcance em metros.
- [x] **2. Criar e validar `assets/data/itens/armas.json`.** O arquivo inclui as 37 armas comuns das tabelas oficiais, nomes em português e inglês para busca, e metadados de origem/versão.
- [x] **3. Criar adaptador de catálogo.** Mapeia os dados canônicos aos campos legados e mantém a criação direta usada na importação de fichas.
- [x] **4. Implementar pesquisa e cadastro.** Busca sem acento, filtros de categoria/modo/proficiência, prévia e opção de cadastro manual.
- [x] **5. Reformular o card do inventário.** O card compacto resume nome, dano, categoria, propriedades, proficiência e equipamento; os detalhes ficam no modal.
- [x] **6. Implementar o modal de arma.** Inclui propriedades, dano versátil, alcance, munição, raridade, estado mágico, edição, equipamento e remoção.
- [ ] **7. Integrar combate e persistência.** Validar os dois espaços de ataque, atributo, dano por empunhadura, proficiência, munição e exportação/importação.
- [ ] **8. Fazer regressão com fichas reais.** Testar ficha em branco, Waldo e Thrain; conferir armas antigas e personalizadas antes de considerar a etapa pronta.

## Mapeamento inicial das fichas existentes

Exemplos inspecionados em `ficha/Personagens Ficha/Waldo_Malaphael_Tatagiba_20261105.json` e `ficha/Personagens Ficha/Thrain_Martelferro_Tatagiba_20261023 (3).json`.

| Campo atual | Uso observado | Campo canônico proposto / cuidado |
|---|---|---|
| `nome` (o template usa `data-campo="nome"`) | Nome exibido no inventário e nos espaços de ataque | `nome` e `nomeOriginal`; importar nome original e preservar nome personalizado depois |
| `arma_tipo` | `Simples` ou `Marcial`; determina proficiência | `categoriaProficiencia`; não reutilizar para corpo a corpo/à distância |
| `arma_dano`, `dano_1`, `dano_2` | Dano básico; `dano_1`/`dano_2` aparecem em espada longa versátil | `dano.base` e `dano.versatil`; adaptador deve ler as três formas legadas |
| `arma_tipo_dano` | Cortante, perfurante, concussão etc. | `dano.tipo` com vocabulário normalizado |
| `arma_dist_curto`, `arma_dist_longo` | Alcance atual; exemplos `24/96` na Besta Leve e `45/180` no Arco Longo | `alcance.normal/longo` em metros; os exemplos correspondem a 80/320 ft e 150/600 ft convertidos por 0,3 |
| `propriedades` | Objeto booleano: `acuidade`, `alcance`, `arremesso`, `carregamento`, `duas_maos`, `leve`, `municao`, `pesada`, `versatil`, `especial` | `propriedades` canônicas e estruturadas; mapear sem perder as flags existentes |
| `arma_municao_id` | ID de uma pilha de munição da ficha | Vínculo pertence à instância do personagem, não ao catálogo; catálogo informa o tipo de munição esperado |
| `arma_preco` | Valor numérico em PO no item atual | Catálogo guarda `custo.valor` e `custo.moeda` oficiais; adaptador converte para o campo legado sem confundir PO, PP e PC |
| `arma_peso` | Peso individual em kg | Catálogo usa `pesoKg`; cópias e peso total continuam sendo responsabilidade do inventário |
| `proficiente` | Estado por arma; há também proficiências simples/marciais na ficha | Não fixar proficiência no catálogo; derivar da ficha e permitir exceção individual |
| `arma_item_magico`, `arma_sintonizado` | Flags de instância | Não inferir que uma arma mundana do catálogo seja mágica; manter flags no item do personagem |
| `arma1EquipadaIndice`, `arma2EquipadaIndice`, `arma1Nome`, `arma2Nome` | Seleção das armas equipadas e usadas nos ataques | Não trocar a indexação no primeiro passo; testar remoção, reordenação e cópias |

### Diferenças encontradas que precisam de tratamento

- **Besta Leve de Waldo:** dano `1d8`, alcance `24/96` e vínculo com a pilha `Virotes` estão coerentes; o tipo de dano salvo era **Concussão**, mas a tabela oficial define **Perfurante**. Corrigi o tipo na ficha de referência e registrei o tipo e a ligação de munição no novo fluxo.
- **Arco Longo de Thrain:** preço, dano e alcance `45/180` correspondem à tabela, mas o peso salvo é `2 kg`; a tabela traz `2 lb`, que pela convenção usada no catálogo de armaduras equivale a `1 kg`. Tratar o valor de cada ficha como dado pessoal; não sobrescrever itens existentes durante a importação ou migração.
- **Espada Longa de Thrain:** os dados antigos guardam `dano_1: 1d8` e `dano_2: 1d10`, enquanto o template atual tem `arma_dano`. É necessário validar como o cálculo de combate resolve a propriedade Versátil e garantir que o segundo dado não desapareça.
- **Preço em moedas menores:** o catálogo oficial contém preços em PC e PP além de PO; o campo legado numérico é exibido em PO. A conversão para PO decimal é possível (`1 PO = 10 PP = 100 PC`), mas a apresentação deve preservar a unidade original (por exemplo, `5 pc`) para evitar preços estranhos como `0,05 po`.
- **Distância e peso usam unidades diferentes:** manter alcance em metros conforme os dados já salvos; peso em kg. A conversão de peso proposta é a convenção de mesa do catálogo de armaduras (`1 lb = 0,5 kg`), portanto uma arma de `1/4 lb` resulta em `0,125 kg` antes de eventual arredondamento aprovado.

## Formato JSON proposto

Formato orientativo para discussão e implementação. `categoriaProficiencia` conserva a distinção existente simples/marcial; `modo` expressa corpo a corpo/à distância separadamente. O JSON do catálogo descreve o modelo, enquanto campos como proficiência, munição escolhida, nome personalizado, magia e equipamento pertencem a cada cópia no personagem.

```json
{
  "id": "espada-longa",
  "tipo": "arma",
  "raridade": "comum",
  "nome": "Espada Longa",
  "nomeOriginal": "Longsword",
  "categoriaProficiencia": "marcial",
  "modo": "corpo-a-corpo",
  "custo": { "valor": 15, "moeda": "po" },
  "pesoKg": 1.5,
  "dano": {
    "base": "1d8",
    "tipo": "cortante",
    "versatil": "1d10"
  },
  "alcance": null,
  "municao": null,
  "propriedades": ["versatil"],
  "descricao": ""
}
```

Regras do formato: `alcance` distingue alcance normal e longo; `municao` indica o tipo esperado (flechas, virotes, dardos ou pedras) mas nunca guarda o ID da pilha do personagem; `dano.base` pode ser um dado (`1d8`), valor fixo (`1`) ou vazio (Rede); `dano.versatil` é opcional; `descricaoEspecial` será necessária para regras como Lança e Rede. O catálogo manterá preço original e peso canônico, e o adaptador cuidará dos nomes/campos antigos.

## Conferência da lista oficial: armas comuns de 2014

A tabela oficial tem **37 entradas**: 10 simples corpo a corpo, 4 simples à distância, 18 marciais corpo a corpo e 5 marciais à distância. Abaixo estão as características mecânicas usadas para conferir completude; custos e pesos ficam nas unidades originais do livro. Na futura gravação do JSON, converter pesos para kg pela convenção já usada e manter o tipo de moeda original.

Fonte: [D&D Beyond — Basic Rules 2014, Equipment, seção Weapons](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/equipment#Weapons). A tabela apresenta custo, dano, peso e propriedades; as regras abaixo dela detalham Munição, Acuidade, Pesada, Leve, Carregamento, Alcance, Especial, Arremesso, Duas Mãos e Versátil.

### Simples — corpo a corpo

| Arma | Custo | Dano | Peso | Propriedades |
|---|---:|---|---:|---|
| Clava (Club) | 1 pp | 1d4 concussão | 2 lb | Leve |
| Adaga (Dagger) | 2 po | 1d4 perfurante | 1 lb | Acuidade, leve, arremesso 20/60 ft |
| Porrete grande (Greatclub) | 2 pp | 1d8 concussão | 10 lb | Duas mãos |
| Machado de mão (Handaxe) | 5 po | 1d6 cortante | 2 lb | Leve, arremesso 20/60 ft |
| Azagaia (Javelin) | 5 pp | 1d6 perfurante | 2 lb | Arremesso 30/120 ft |
| Martelo leve (Light hammer) | 2 po | 1d4 concussão | 2 lb | Leve, arremesso 20/60 ft |
| Maça (Mace) | 5 po | 1d6 concussão | 4 lb | — |
| Bordão (Quarterstaff) | 2 pp | 1d6 concussão | 4 lb | Versátil (1d8) |
| Foice (Sickle) | 1 po | 1d4 cortante | 2 lb | Leve |
| Lança (Spear) | 1 po | 1d6 perfurante | 3 lb | Arremesso 20/60 ft, versátil (1d8) |

### Simples — à distância

| Arma | Custo | Dano | Peso | Propriedades |
|---|---:|---|---:|---|
| Besta leve (Light crossbow) | 25 po | 1d8 perfurante | 5 lb | Munição 80/320 ft, carregamento, duas mãos |
| Dardo (Dart) | 5 pc | 1d4 perfurante | 1/4 lb | Acuidade, arremesso 20/60 ft |
| Arco curto (Shortbow) | 25 po | 1d6 perfurante | 2 lb | Munição 80/320 ft, duas mãos |
| Funda (Sling) | 1 pp | 1d4 concussão | — | Munição 30/120 ft |

### Marciais — corpo a corpo

| Arma | Custo | Dano | Peso | Propriedades |
|---|---:|---|---:|---|
| Machado de batalha (Battleaxe) | 10 po | 1d8 cortante | 4 lb | Versátil (1d10) |
| Mangual (Flail) | 10 po | 1d8 concussão | 2 lb | — |
| Glaive (Glaive) | 20 po | 1d10 cortante | 6 lb | Pesada, alcance, duas mãos |
| Machado grande (Greataxe) | 30 po | 1d12 cortante | 7 lb | Pesada, duas mãos |
| Espada grande (Greatsword) | 50 po | 2d6 cortante | 6 lb | Pesada, duas mãos |
| Alabarda (Halberd) | 20 po | 1d10 cortante | 6 lb | Pesada, alcance, duas mãos |
| Lança de montaria (Lance) | 10 po | 1d12 perfurante | 6 lb | Alcance, especial |
| Espada longa (Longsword) | 15 po | 1d8 cortante | 3 lb | Versátil (1d10) |
| Malho (Maul) | 10 po | 2d6 concussão | 10 lb | Pesada, duas mãos |
| Maça estrela (Morningstar) | 15 po | 1d8 perfurante | 4 lb | — |
| Pique (Pike) | 5 po | 1d10 perfurante | 18 lb | Pesada, alcance, duas mãos |
| Florete (Rapier) | 25 po | 1d8 perfurante | 2 lb | Acuidade |
| Cimitarra (Scimitar) | 25 po | 1d6 cortante | 3 lb | Acuidade, leve |
| Espada curta (Shortsword) | 10 po | 1d6 perfurante | 2 lb | Acuidade, leve |
| Tridente (Trident) | 5 po | 1d6 perfurante | 4 lb | Arremesso 20/60 ft, versátil (1d8) |
| Picareta de guerra (War pick) | 5 po | 1d8 perfurante | 2 lb | — |
| Martelo de guerra (Warhammer) | 15 po | 1d8 concussão | 2 lb | Versátil (1d10) |
| Chicote (Whip) | 2 po | 1d4 cortante | 3 lb | Acuidade, alcance |

### Marciais — à distância

| Arma | Custo | Dano | Peso | Propriedades |
|---|---:|---|---:|---|
| Zarabatana (Blowgun) | 10 po | 1 perfurante | 1 lb | Munição 25/100 ft, carregamento |
| Besta de mão (Hand crossbow) | 75 po | 1d6 perfurante | 3 lb | Munição 30/120 ft, leve, carregamento |
| Besta pesada (Heavy crossbow) | 50 po | 1d10 perfurante | 18 lb | Munição 100/400 ft, pesada, carregamento, duas mãos |
| Arco longo (Longbow) | 50 po | 1d8 perfurante | 2 lb | Munição 150/600 ft, pesada, duas mãos |
| Rede (Net) | 1 po | — | 3 lb | Especial, arremesso 5/15 ft |

## Riscos e como reduzir

| Dificuldade | Risco concreto | Tratamento planejado |
|---|---|---|
| Dados existentes têm formas diferentes | `dano_1`/`dano_2` coexistem com `arma_dano`; alguns dados pessoais divergem do livro | Adaptar a leitura sem reescrever instâncias já salvas; cobrir formas antigas em teste |
| Propriedades têm efeitos de regra | Versátil muda o dano; Acuidade altera atributo; Munição e Carregamento influenciam ações; Especial depende de texto próprio | Guardar atributos estruturados; modal explica regra; validar os efeitos usados no combate antes de adicionar automações novas |
| Munição tem identidade própria | ID do catálogo não é o ID da pilha de flechas/virotes/dardos na ficha | O catálogo informa o tipo; a instância continua ligada ao ID de munição selecionado pelo usuário |
| Corpo a corpo não equivale a alcance vazio | Adaga, azagaia, machado de mão, lança e tridente têm alcance de arremesso | Separar `modo` de `alcance`; não inferir modo somente pela presença de alcance |
| Armas excepcionais | Zarabatana causa dano fixo; Rede não causa dano; Lança e Rede têm regra especial | Aceitar dano não-dado e descrição especial, sem obrigar todo item ao mesmo formato simplista |
| Peso e preço têm conversões | Livro usa lb, cp, pp e po; ficha usa kg e apresenta preço em PO | Documentar precisão e apresentação; não arredondar silenciosamente nem trocar unidades |
| Slots e índices de equipamento | Ataques referenciam índices e estado por posição; remoção pode deslocar índices | Manter a estratégia de índices na primeira etapa e testar adicionar, remover e reordenar |
| Inventário legado | Muitas fichas já contêm armas modificadas pelo jogador | Catálogo serve como origem para novos itens; nunca atualizar automaticamente cópias existentes pelo nome |

## Implementação atual e validação pendente

- A Besta Leve do catálogo e da ficha de referência de Waldo agora usam dano perfurante, conforme a tabela oficial. O vínculo existente de Waldo com a pilha `Virotes` foi conferido e mantido.
- As armas com propriedade Munição declaram o tipo esperado. O vínculo real permanece por instância, no campo `arma_municao_id`; ao criar do catálogo, só há sugestão automática quando existe exatamente uma pilha compatível. O jogador pode ajustar o vínculo no modal.
- Testes automatizados do catálogo cobrem as 37 entradas, categorias, campos legados, busca, proficiência e validação. A execução do runner `node --test` falhou por `spawn EPERM` no ambiente; a execução direta do arquivo de teste funciona.
- Ainda é necessário abrir a ficha no navegador, conferir as prévias/cards/modais e testar importação/equipamento com Waldo e Thrain antes de dar a etapa como concluída.

## Critérios de aceite por etapa

- [x] O JSON valida todas as 37 entradas, IDs únicos, categorias, dano, preço, peso e propriedades permitidas.
- A pesquisa encontra nome em português e original em inglês; adicionar uma arma não equipa automaticamente nem altera moedas.
- Cadastro manual, edição e importação antiga continuam criando armas com os campos esperados.
- Versátil continua oferecendo dano por empunhadura; Acuidade e proficiência continuam escolhendo o atributo/bonus certo.
- Armas com munição aceitam o vínculo com pilhas já existentes, e armas arremessáveis sem munição não ganham esse requisito por engano.
- Exportar e reimportar fichas de teste preserva propriedades, personalizações, munição e slots de ataque.
