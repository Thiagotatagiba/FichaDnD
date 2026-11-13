
# Banco de ideias — Ficha D&D

Este arquivo é um espaço de captura para ideias ainda não avaliadas. Uma anotação aqui não é tarefa planejada, compromisso de implementação, prioridade ou prazo. Revise o código e a documentação antes de avaliar uma ideia. Quando aprovada, retire-a daqui e registre-a no `../ROADMAP.md`; bugs confirmados pertencem ao `BUG_REPORT.md`. Remova ideias descartadas, salvo se houver motivo útil para preservar esse histórico.

## Ideias para avaliar

- **Vestimentas — integrar vantagens em perícias:** hoje os itens podem guardar a seleção de perícias, mas a ficha ainda não tem um sistema de vantagens aplicável aos testes. Quando esse sistema existir, avaliar como converter os dados do item em vantagem real, tratar múltiplas fontes e exibir a origem do benefício. Não implementar antes de definir a mecânica geral.
- **Vestimentas — ampliar cobertura de validação:** considerar testes automatizados para catálogo inválido/duplicado, normalização de peso para uma casa decimal, cancelar criação, edição e exclusão com atualização da carga; complementar a verificação visual em telas pequenas e com navegação por teclado/leitor de tela.

- **Munições — recuperação após combate:** avaliar ação manual para recuperar metade das peças gastas conforme as regras, com confirmação e registro no histórico. Não recuperar automaticamente nesta primeira versão.
- **Munições mágicas — regras futuras:** definir uma lista de efeitos estruturados e como bônus interagem com ataque/dano antes de ativar qualquer bônus; os campos extensíveis atuais são somente dados inertes.
- **Munições — retirar espelho legado:** após período de compatibilidade e validação de fichas antigas, decidir quando deixar de gravar a cópia dos lotes em `outros`.

- **Magias — busca e filtros na lista do personagem:** avaliar busca por nome e filtros por nível, escola e estado de preparo para listas extensas. O catálogo de adição já filtra por classe e nível; esta ideia se refere à lista de magias já cadastradas no personagem.

- **Magias — navegação para listas extensas:** avaliar apresentação compacta, paginação ou outra navegação quando um personagem tiver muitas magias. A UI atual já renderiza itens por nível e oferece visualização/edição em modal.

- **Magias — modal e telas menores:** avaliar responsividade do formulário/modal e possíveis conflitos de sobreposição com outros modais. A anotação antiga não foi reproduzida como falha atual.

- **Magias — visualização de espaços:** avaliar um indicador visual de espaços totais/restantes por nível sem mudar a semântica atual dos campos nem o formato persistido.

- **Magias — evolução do formato de dados:** avaliar se a serialização JSON atual nos campos `magiaNTexto` precisa de um esquema versionado próprio. Qualquer proposta deve preservar importação/exportação e dados legados; não há migração aprovada.

- **Magias — segurança de renderização:** revisar usos de HTML dinâmico para textos importados de magias e confirmar se o escaping existente cobre todos os caminhos. A anotação antiga sobre XSS não foi confirmada como bug.

- **Combate e magias — interação de arrastar e soltar:** avaliar se arrastar uma magia preparada para a subaba de combate melhoraria o fluxo. A integração atual já lista magias preparadas e tem uso com consumo de espaço; arrastar/soltar seria uma alternativa de interação.

## Ideias rascunhadas

As decisões de produto registradas abaixo foram aprovadas como orientação para desenhos futuros. Elas permanecem ideias rascunhadas: não autorizam implementação e só entram no Roadmap quando forem priorizadas.

### 1. Antecedentes

**Objetivo:** estruturar a seleção de antecedentes e automatizar a importação de suas características para a ficha.

#### 1.1. Seleção de antecedentes

- Substituir o campo de texto atual por um `select` com os antecedentes disponíveis.
- Incluir a opção **Outros**, que habilitará um campo de texto para informar um antecedente personalizado.
- Manter o antecedente selecionado sincronizado com os dados do personagem.

#### 1.2. Catálogo de antecedentes

- Criar um arquivo JSON contendo os antecedentes disponíveis e suas respectivas características.
- Organizar os dados para permitir futuras integrações com outras seções da ficha.
- Preservar a possibilidade de antecedentes personalizados.

#### 1.3. Importação de características

Ao selecionar um antecedente, apresentar a pergunta:

**“Deseja importar as características deste antecedente?”**

- Se o usuário confirmar, importar as características para a seção **Status**.
- Se já existirem características importadas de outro antecedente, **substituir apenas as características provenientes do antecedente anterior**.
- Preservar características adicionadas manualmente ou provenientes de classe, raça e outras fontes.
- Evitar duplicações durante importações repetidas.
- Se o usuário cancelar, não modificar as características existentes.

**Regra importante:** as características importadas deverão possuir identificação de origem, permitindo distinguir os dados de antecedentes dos dados provenientes de outras fontes.

#### 1.4. Itens iniciais

A primeira característica cadastrada para cada antecedente será **Itens Iniciais**.

**Primeira versão:**
- Exibir os itens iniciais como texto descritivo.
- Não adicionar automaticamente equipamentos ao inventário.

**Evolução futura:**
- Permitir selecionar os itens iniciais diretamente no catálogo de equipamentos.
- Oferecer a possibilidade de adicioná-los ao inventário do personagem.

---

### 2. Status — Proficiências e características

**Objetivo:** substituir gradualmente campos de texto livre por sistemas estruturados de seleção, facilitando a organização, edição e futura automatização das proficiências.

Cada categoria terá um botão **+**, responsável por abrir um modal com as opções disponíveis.

#### 2.1. Idiomas — Primeira implementação

Na seção **Outras Proficiências — Idiomas**:

- Substituir o campo de texto atual por uma área de **tags editáveis**.
- Adicionar um botão **+** para abrir o modal de seleção de idiomas.
- Apresentar uma lista de idiomas disponíveis, permitindo selecionar vários.
- Incluir a opção **Outros**, com um campo para inserir idiomas personalizados.
- Permitir informar múltiplos idiomas personalizados separados por vírgula.
- Converter cada idioma selecionado ou digitado em uma tag individual.
- Permitir remover qualquer idioma clicando no controle de exclusão da respectiva tag.
- Impedir duplicações, inclusive quando houver diferenças de maiúsculas e minúsculas.

**Compatibilidade:** os idiomas já preenchidos nas fichas existentes deverão ser preservados e convertidos para a nova representação estruturada, sem perda de informações.

#### 2.2. Armas, armaduras e ferramentas — Evolução futura

Aplicar posteriormente o mesmo modelo de seleção por modal e exibição por tags às proficiências com:

- Armas.
- Armaduras.
- Ferramentas.

Essas categorias deverão considerar a futura integração com os catálogos de equipamentos e itens da ficha.

**Observação:** essa implementação ficará para uma etapa posterior, para evitar duplicação de dados e permitir sincronização entre proficiências e equipamentos.

---

### 3. Características de Classe — Cards por nível

**Objetivo:** substituir a tabela geral de características de classe por uma interface de cards navegáveis, organizada pelos níveis de 1 a 20.

#### 3.1. Visualização

- Exibir um card correspondente ao nível selecionado.
- Iniciar a visualização no nível atual do personagem.
- Disponibilizar controles para avançar ou retroceder entre os níveis.
- Permitir navegar por **todos os níveis de 1 a 20**, independentemente do nível atual do personagem.
- Destacar visualmente quando o usuário estiver consultando um nível diferente do nível real do personagem.

#### 3.2. Conteúdo dos cards

Cada card deverá apresentar as informações correspondentes ao nível consultado, incluindo:

- Características de classe.
- Características de subclasse, quando aplicáveis.
- Progressão dos espaços de magia, quando aplicável.
- Outras informações relevantes da progressão da classe.

As informações deverão respeitar a classe e a subclasse selecionadas.

#### 3.3. Navegação e progressão

**Exemplo:** um Clérigo de nível 3 abrirá inicialmente o card do nível 3, mas poderá navegar até o nível 20 para consultar suas futuras características.

- A navegação terá finalidade exclusivamente informativa.
- Consultar outro nível não alterará o nível real do personagem.
- Não serão concedidas automaticamente características, magias, recursos ou espaços de magia de níveis futuros.
- A evolução efetiva do personagem continuará vinculada ao sistema de **Level Up**.
- Ao mudar de classe ou subclasse, o conteúdo exibido deverá ser atualizado conforme a nova seleção.

---

### 4. Diretrizes gerais de implementação

- Preservar dados existentes durante a migração de campos de texto livre para formatos estruturados.
- Identificar a origem das características importadas, permitindo substituições seletivas sem apagar informações de outras fontes.
- Manter suporte a informações personalizadas por meio da opção **Outros**.
- Evitar características, proficiências e idiomas duplicados.
- Integrar os novos componentes aos mecanismos existentes de salvamento, importação, exportação e rollback.
- Implementar as funcionalidades incrementalmente, com testes de persistência, compatibilidade e regressão.
- Manter estas propostas como **ideias rascunhadas**, até que sejam formalmente priorizadas no Roadmap.
