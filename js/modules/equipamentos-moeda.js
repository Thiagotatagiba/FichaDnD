
      document.addEventListener("click", function (e) {
        const moedaIcon = e.target.closest(".item-emoji.moeda");
        if (!moedaIcon) return;

        e.stopPropagation();

        const bloco =
          moedaIcon.closest(".item-linha") || moedaIcon.closest("div");
        if (!bloco) return;

        const input = bloco.querySelector('[data-campo*="preco"]');
        const sufixo = bloco.querySelector(".sufixo");

        if (!input) return;

        trocarMoeda(input, sufixo);
      });

      function trocarMoeda(input, sufixo) {
        const TIPOS = ["PO", "PL", "PE", "PP", "PC"];

        let atual = input.dataset.moeda || "PO";
        let index = TIPOS.indexOf(atual);
        let proximo = TIPOS[(index + 1) % TIPOS.length];

        input.dataset.moeda = proximo;

        if (sufixo) {
          sufixo.textContent = proximo;
        }
      }

      function atualizarEmojiItem(select) {
        // pega o option selecionado
        const optionSelecionado = select.options[select.selectedIndex];

        // extrai o emoji (primeiro caractere do texto)
        const emoji = optionSelecionado.textContent.trim().split(" ")[0];

        // encontra o container do item (subindo no DOM)
        const itemContainer = select.closest(".arma-conteudo").parentElement;

        // encontra o div do emoji
        const emojiDiv = itemContainer.querySelector(".item-tipo-emoji");

        if (emojiDiv) {
          emojiDiv.textContent = emoji;
        }
      }
      document.addEventListener("change", function (e) {
        if (e.target.matches('select[data-campo="outro_tipo"]')) {
          atualizarEmojiItem(e.target);
        }
      });
      function atualizarTodosEmojis() {
        const selects = document.querySelectorAll(
          'select[data-campo="outro_tipo"]',
        );

        selects.forEach((select) => {
          atualizarEmojiItem(select);
        });
      }
    
