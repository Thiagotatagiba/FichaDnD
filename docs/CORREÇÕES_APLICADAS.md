# 🔧 Correções Aplicadas — Card de Classe

**Data do registro:** 21 de maio de 2026

> **Nota histórica:** este documento registra correções e testes documentados em maio de 2026. Os resultados refletem o estado registrado à época; os caminhos e procedimentos devem ser conferidos na estrutura atual antes de serem reutilizados.

---

## ✅ Bugs Corrigidos

### 1. CORS Error ao Carregar JSON

**Problema original**

```text
Access to fetch at 'file:///...' has been blocked by CORS policy
onerror acionado — XHR bloqueado pelo protocolo file://
```

**Solução implementada**

- Sistema de fallback com múltiplos métodos de carregamento:
  1. Tenta obter os dados de `CLASSES_EMBUTIDAS`.
  2. Tenta a API `Fetch`.
  3. Tenta `XMLHttpRequest` como alternativa.
  4. Exibe uma mensagem de erro com possíveis soluções quando os métodos falham.
- Tratamento de exceções.
- Registro detalhado das tentativas no console.

**Resultado registrado:** o sistema passou a priorizar os dados embutidos e a utilizar métodos alternativos de carregamento quando disponíveis.

### 2. Card Não Carrega ao Importar Ficha

**Problema original**

- As características da classe só eram carregadas ao selecionar uma classe no menu suspenso.
- A importação de uma ficha JSON não acionava o carregamento do card.

**Solução implementada**

- Aprimoramento do wrapper da função `carregarFicha`.
- Acionamento de `handleClasseChange()` após um intervalo de 150 ms da importação.
- Utilização da função `carregarJSONClasse()` com métodos alternativos de carregamento.
- Adição de logs para rastrear a execução.

**Resultado registrado:** o card passou a ter um fluxo de carregamento após a seleção manual da classe e após a importação da ficha.

### 3. Texto Descritivo Não Desaparecia

**Problema original**

A mensagem abaixo permanecia visível mesmo depois do carregamento da classe:

> Selecione sua classe na ficha principal para carregar automaticamente...

**Solução implementada**

- Adição de lógica em `enviarClasseParaCard()`.
- Ocultação do elemento com `display: none` quando a classe é carregada.
- Refinamento do seletor CSS para evitar correspondências indevidas.

**Resultado registrado:** o texto descritivo passou a ser ocultado após o carregamento da classe.

---

## 🔄 Sistema de Fallback Implementado

### Função `carregarJSONClasse(caminho, classe)`

O fluxo documentado segue esta ordem de tentativa:

1. **`CLASSES_EMBUTIDAS[classe]`**
   - Utiliza os dados embutidos, quando disponíveis, evitando uma requisição adicional.

2. **`fetch(caminho)`**
   - Tenta carregar o arquivo por meio da API Fetch.

3. **`XMLHttpRequest(caminho)`**
   - Tenta um método alternativo de carregamento.
   - O comportamento depende do navegador e do protocolo utilizado.

4. **Tratamento de erro**
   - Exibe informações sobre a falha.
   - Orienta a verificar o arquivo e considerar o uso de um servidor HTTP local ou de um ambiente compatível.

---

## 🔍 Melhorias de Diagnóstico

Foi documentada a inclusão de logs em diferentes pontos do fluxo.

### Logs de console

| Identificador | Finalidade registrada |
|---|---|
| `[CardLoad]` | Rastreamento do carregamento do card. |
| `[CardError]` | Registro de erros, incluindo informações de depuração. |
| `[Ficha]` | Rastreamento da comunicação entre a ficha e o card. |
| `[Tentando Fetch]` | Indicação de uma tentativa de carregamento por Fetch. |
| `[Fetch falhou]` | Registro de falha no Fetch antes de uma possível tentativa por XHR. |

### Mensagens de erro

As melhorias documentadas incluem:

- Identificação do arquivo que apresentou falha.
- Sugestões de possíveis soluções.
- Informações adicionais para facilitar a depuração.

---

## 📝 Commits Registrados

Os seguintes commits foram associados às correções documentadas:

```text
9cb85e7 — Fix CORS + XMLHttpRequest + Hide text
10ca8bc — Improve logging + error handling
eb5e27b — Add documentation + test file
2296f62 — Add robust multi-method fallback
```

Esses identificadores são mantidos como registro histórico; sua presença neste documento não confirma, por si só, que os commits estejam disponíveis no histórico Git atual.

---

## 🧪 Roteiros de Teste Registrados

Os procedimentos abaixo descrevem como as correções foram documentadas. Antes de utilizá-los, confirme se o comportamento esperado continua válido na versão atual da ficha.

### Teste 1 — Selecionar uma classe manualmente

1. Abra a [ficha principal](../ficha/Ficha_DnD_-_Tatagiba_1.0.html) em um servidor HTTP ou ambiente compatível.
2. Selecione uma classe no menu suspenso principal.
3. Verifique se o card carrega as características da classe.
4. Verifique se o texto descritivo desaparece após o carregamento.

**Observação:** o resultado precisa ser confirmado na versão atual do sistema.

### Teste 2 — Importar uma ficha salva

1. Abra a [ficha principal](../ficha/Ficha_DnD_-_Tatagiba_1.0.html).
2. Importe um arquivo JSON que contenha uma classe previamente selecionada.
3. Verifique se o card carrega automaticamente.
4. Verifique se o texto descritivo é ocultado.

O intervalo de 150 ms faz parte da implementação descrita no registro histórico; não deve ser considerado uma garantia de tempo de carregamento.

### Teste 3 — Diagnóstico técnico histórico

O roteiro original referenciava `teste_xhr.html`, mas esse arquivo não está presente na estrutura atual do repositório. Portanto, o teste abaixo é apenas um registro histórico, não um procedimento executável na versão atual.

1. Abrir `teste_xhr.html` como arquivo local ou por meio de um servidor.
2. Clicar em **Testar: Carregar Bardo**.
3. Observar o log `[Tentando Fetch]` e, caso ocorra uma falha, verificar se aparecem mensagens relacionadas à tentativa por XHR.

Para repetir esse teste, será necessário localizar uma versão histórica do arquivo ou recriar um teste equivalente.

### Teste 4 — Abrir em servidor HTTP

Na raiz do repositório, execute:

```bash
python -m http.server 8000
```

Em seguida, abra a ficha no navegador:

[http://localhost:8000/ficha/Ficha_DnD_-_Tatagiba_1.0.html](http://localhost:8000/ficha/Ficha_DnD_-_Tatagiba_1.0.html)

O servidor HTTP permite testar o carregamento dos arquivos por uma origem HTTP local. Ainda assim, o funcionamento de cada método deve ser verificado na versão atual.

---

## 🛠️ Detalhes Técnicos Registrados

### Dados embutidos

- **Arquivo:** `../ficha/Classes/classes-embutidas.js`, caminho relativo ao diretório `docs/`.
- **Variável global documentada:** `window.CLASSES_EMBUTIDAS`.
- **Formato descrito:** objeto com dados organizados por classe, por exemplo, `{ bardo: {...}, guerreiro: {...} }`.
- **Vantagem prevista:** acesso aos dados sem precisar buscar um arquivo JSON separado, desde que o script tenha sido carregado corretamente.

### Protocolo `file://`

O registro original menciona restrições dos navegadores ao realizar requisições por meio de `fetch` e `XMLHttpRequest` em arquivos locais.

A compatibilidade depende do navegador e da implementação. Para testes reproduzíveis, recomenda-se utilizar um servidor HTTP local.

### Electron

O registro original também menciona Electron como ambiente possível. A presença de um arquivo como `preload.js`, isoladamente, não comprova que o projeto esteja configurado para Electron nem que todas as operações de rede funcionem normalmente.

A compatibilidade deve ser verificada na configuração real da aplicação.

---

## 📊 Status Registrado

| Item | Status documentado | Solução associada |
|---|---|---|
| Erro de CORS | Corrigido no registro histórico | Fallback de carregamento |
| Ausência de acionamento na importação | Corrigido no registro histórico | Wrapper de `carregarFicha` e `handleClasseChange()` |
| Texto descritivo persistente | Corrigido no registro histórico | Ocultação do elemento |
| Restrições do protocolo `file://` | Tratadas parcialmente | Dados embutidos e métodos alternativos |
| Logging insuficiente | Melhorado no registro histórico | Logs de carregamento e de erro |

Os status acima representam o estado documentado em maio de 2026 e não substituem a validação do comportamento atual.

---

## 🎯 Procedimento de Diagnóstico

Se o problema voltar a ocorrer:

1. Abra as ferramentas de desenvolvedor do navegador (`F12`).
2. Acesse a aba **Console**.
3. Procure pelas mensagens de diagnóstico:
   - `[CardLoad]` — rastreamento do carregamento.
   - `[Tentando Fetch]` — tentativa de carregamento por Fetch.
   - `[Fetch falhou]` ou mensagens relacionadas a XHR — falhas nos métodos de carregamento.
4. Registre a mensagem completa do erro e o contexto em que ocorreu.
5. Repita o teste utilizando o servidor HTTP local, caso esteja trabalhando com arquivos locais.
6. Compare os resultados e registre as evidências em `BUG_REPORT.md` se houver um problema atual confirmado.

---

**Última atualização do registro original:** 21/05/2026 — Copilot (Multi-method Fallback)
