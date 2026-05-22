# TODO - Refatoração incremental (sem quebrar funcionalidades)

## Plano desta etapa (prioridades)
1. **Estabilizar o editor/parse**
   - Reduzir strings CSS inline que hoje aparecem como `style="..."` e `spinner.style.cssText`.
   - Criar classes CSS reutilizáveis para as ocorrências mais óbvias.

2. **Acessibilidade básica (sem alterar comportamento visual)**
   - Corrigir `aria-hidden` inconsistentes (somente onde for seguro e não afetar interação).
   - Adicionar `aria-label` para elementos clicáveis sem label.

3. **Compatibilidade Safari**
   - Garantir que propriedades de seleção já existentes (`user-select`) tenham cobertura via `-webkit-user-select` onde aplicável.

## Escopo de mudanças permitido nesta etapa
- Não modularizar em múltiplos JS/CSS ainda.
- Não renomear IDs usados pelo JS.
- Não reescrever sistemas inteiros.
- Mudanças pequenas e seguras.

## Checklist de validação após mudanças
- [ ] Console sem novos erros
- [ ] Troca de classe/subclasse continua carregando JSON
- [ ] Modal de combate funciona (abrir/fechar, histórico e rolagens)
- [ ] Salvamento/importação continuam preservando dados
- [ ] Responsividade continua ok

