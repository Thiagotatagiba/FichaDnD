# Contrato de esquema JSON da ficha

## Versão 2

- `fichaSchemaVersion` é um inteiro positivo no nível raiz. A versão suportada
  atualmente é `2`.
- A ausência do campo representa a versão legada `v0`. Um marcador explícito `0`,
  fracionário, textual, nulo ou de outro tipo é inválido.
- A migração `v0 → v1` acrescenta o marcador. A migração `v1 → v2` separa PV
  regulares e temporários da representação legada, preservando a vida efetiva:
  `pvAtual` fica limitado a `pvTotal` e o excedente válido vai para
  `pvTemporario`. Ambas são puras, sequenciais e idempotentes.
- `schema_version`, `schema_notes`, aliases e demais propriedades, inclusive
  desconhecidas ou aninhadas, permanecem intactas na migração.
- Versões futuras e marcadores malformados são rejeitados antes de aplicar os
  dados à ficha. A validação não altera o estado da ficha.
- Fichas incompletas continuam sujeitas à tolerância e aos defaults do fluxo
  existente; esta etapa não adiciona requisitos novos de completude.
- A exportação marca como v2 o objeto recém-coletado da interface. Ela não roda
  migrações nem repõe valores canônicos a partir de aliases legados.
- A importação preserva valores explícitos de PV total/atuais/temporários após
  as atualizações da interface que calculam defaults de nível 1. O cálculo de
  default continua aplicável quando `pvTotal` está ausente.

## Limitação de round-trip

A migração conserva aliases, metadados e propriedades desconhecidas. A coleta de
exportação agora repassa propriedades opacas de nível raiz que não são
representadas por controles, sem sobrepor os valores coletados da interface.
Propriedades extras dentro de itens reconstruídos por coletores específicos ainda
precisam de validação por coleção. Esquemas de munições e poções não são
reinterpretados nem reescritos por esta regra de repasse.

## Fora do escopo

Esta etapa não define ou migra contratos de munições e poções, não altera JSONs
originais e não muda a lógica intencional de expiração.
