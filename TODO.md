# TODO - Refatoração do Histórico de Combate

## 🧩 Estrutura de Dados

- [ ] Alterar registro de ataque para usar objeto ao invés de string
- [ ] Garantir que `ataqueTotal` esteja disponível no estado do ataque
- [ ] Incluir `tipoDano` no objeto da arma (fallback: "Cortante")

---

## ⚙️ Função registrarHistoricoAtaqueArma

- [ ] Remover uso de `.join(' | ')`
- [ ] Criar objeto estruturado com:
  - [ ] arma
  - [ ] ataqueTotal
  - [ ] dano
  - [ ] tipoDano
- [ ] Enviar objeto para `adicionarRegistroHistoricoCombate`

---

## 🧠 Função adicionarRegistroHistoricoCombate

- [ ] Detectar quando `tipo === 'Ataque'` e `valor` é objeto
- [ ] Criar renderização específica para ataque
- [ ] Manter fallback para outros tipos (Cura, Dano, etc)
- [ ] Separar lógica em variáveis (`conteudoTipo`, `conteudoValor`)

---

## 🎨 Layout / HTML

- [ ] Ajustar coluna Tipo para suportar múltiplas linhas
- [ ] Inserir nome da arma como subtexto
- [ ] Mostrar `[ataqueTotal]` ao lado de "Ataque"
- [ ] Ajustar coluna Valor para mostrar apenas dano + tipo

---

## 🎯 CSS

- [ ] Criar classe `.sub`
- [ ] Aplicar:
  - [ ] font-size menor
  - [ ] opacidade reduzida
- [ ] Garantir alinhamento correto das colunas

---

## 🔁 Compatibilidade

- [ ] Testar registros antigos (string)
- [ ] Garantir que Cura e Dano continuam funcionando
- [ ] Validar fallback quando dados estiverem incompletos

---

## 🧪 Testes

- [ ] Testar ataque com dano
- [ ] Testar ataque sem dano (caso futuro)
- [ ] Testar múltiplos registros seguidos
- [ ] Validar ordem com `prepend`

---

## 🚀 Melhorias Futuras (não obrigatório agora)

- [ ] Destacar crítico (ex: [20] em cor diferente)
- [ ] Suporte a múltiplos tipos de dano
- [ ] Agrupar ataques por rodada
- [ ] Criar componente reutilizável para renderização