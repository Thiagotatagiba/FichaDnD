# Contrato de esquema JSON da ficha

## Versão 1

- `fichaSchemaVersion` é um inteiro positivo no nível raiz. A versão suportada
  atualmente é `1`.
- A ausência do campo representa a versão legada `v0`. Um marcador explícito `0`,
  fracionário, textual, nulo ou de outro tipo é inválido.
- A migração `v0 → v1` é pura, sequencial e idempotente. Ela acrescenta somente
  `fichaSchemaVersion: 1`; não interpreta nem reestrutura campos, aliases ou
  coleções.
- `schema_version`, `schema_notes`, aliases e demais propriedades, inclusive
  desconhecidas ou aninhadas, permanecem intactas na migração.
- Versões futuras e marcadores malformados são rejeitados antes de aplicar os
  dados à ficha. A validação não altera o estado da ficha.
- Fichas incompletas continuam sujeitas à tolerância e aos defaults do fluxo
  existente; esta etapa não adiciona requisitos novos de completude.
- A exportação marca como v1 o objeto recém-coletado da interface. Ela não roda
  migrações nem repõe valores canônicos a partir de aliases legados.

## Limitação de round-trip

A preservação de propriedades desconhecidas garantida por E1.2 cobre a migração
do objeto importado em memória. O exportador existente reconstrói o JSON a partir
dos coletores da interface. Esses coletores podem omitir propriedades
desconhecidas de nível raiz, e coletores de algumas coleções de inventário podem
reconstruir itens sem campos extras. Como E1.2 não altera os coletores nem define
novos contratos de munições ou poções, ainda não há garantia de round-trip
integral desses dados na exportação. Essa limitação requer uma entrega posterior
autorizada e validação ponta a ponta; não significa que a migração descarte esses
campos.

## Fora do escopo

Esta etapa não define ou migra contratos de munições e poções, não altera JSONs
originais e não muda a lógica intencional de expiração.
