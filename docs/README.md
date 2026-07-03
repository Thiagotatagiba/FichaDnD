# FichaDnD

Projeto de ficha de personagem para Dungeons & Dragons (estilo D&D 5e). Interface web (HTML/CSS/JS) para criar, visualizar e gerenciar personagens, rolar dados, registrar ataques e danos, gerenciar inventário e magias.

## Tecnologias

- HTML5, CSS (responsivo e módulos de estilo)
- JavaScript modular (módulos em `modules/` e scripts em `js/`)
- Dados em JSON/JS (arquivos em `data/` e personagens em `ficha/`)

## Como usar

- Uso rápido (sem servidor): abra `index.html` ou `ficha/Ficha_DnD_-_Tatagiba_1.0.html` num navegador moderno.
- Uso com servidor local (opcional):

```bash
python -m http.server 8000
# então abra http://localhost:8000/index.html
```

## Estrutura principal

- `index.html` — página inicial/landing.
- `ficha/Ficha_DnD_-_Tatagiba_1.0.html` — ficha principal com modais e UI de jogo.
- `js/` — inicialização e integração; `main.js` integra carregamento de personagem.
- `modules/` — lógica do jogo (combate, inventário, magias, import/export, etc.).
- `data/` — listas de classes, magias, raças e equipamentos.
- `ficha/Personagens Ficha/` — exemplos de personagens salvos em JSON.
- `css/` — estilos (base, layout, componentes, responsivo, modal, abas).

## Funcionalidades principais

- Rolagens de dados e botões para rolar automaticamente.
- Modal de ataque/dano com histórico e opções de ação/ação-bônus/reação.
- Importação/exportação e persistência de personagem (JSON).
- Gestão de inventário, magias e atributos com suporte a classes e raças carregadas dos arquivos de dados.
- Tema visual pergaminho/medieval e layout em abas/modais.

## Desenvolvimento

- Para inspecionar funcionalidade, abra a ficha no navegador e use o console devtools para logs.
- Arquivos de dados em `data/` e módulos em `modules/` são os melhores pontos para adicionar regras ou corrigir lógica.

## Contribuição

- Abra uma issue explicando a sugestão ou correção. Pull requests são bem-vindos.

## Autor

Thiago Tatagiba — projeto pessoal.
