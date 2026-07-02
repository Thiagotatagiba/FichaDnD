
      (function (global) {
        function rolarDado(quantidade, faces) {
          const qtd = parseInt(quantidade, 10);
          const lados = parseInt(faces, 10);

          if (
            !Number.isInteger(qtd) ||
            !Number.isInteger(lados) ||
            qtd < 1 ||
            lados < 2
          ) {
            return {
              quantidade: 0,
              faces: 0,
              resultados: [],
              soma: 0,
            };
          }

          const resultados = Array.from(
            { length: qtd },
            () => Math.floor(Math.random() * lados) + 1,
          );

          return {
            quantidade: qtd,
            faces: lados,
            resultados,
            soma: resultados.reduce((total, valor) => total + valor, 0),
          };
        }

        function animarRolagemNoCampo(
          campo,
          quantidade,
          faces,
          duracaoMs = 1000,
          intervaloMs = 60,
        ) {
          if (!campo) return Promise.resolve(null);

          return new Promise((resolve) => {
            const inicio = Date.now();
            const timer = setInterval(() => {
              const parcial = rolarDado(quantidade, faces);
              campo.value = parcial?.soma ?? "";
              campo.dispatchEvent(new Event("input"));
              if (Date.now() - inicio >= duracaoMs) {
                clearInterval(timer);
                const final = rolarDado(quantidade, faces);
                campo.value = final?.soma ?? "";
                campo.dispatchEvent(new Event("input"));
                campo.dispatchEvent(new Event("change"));
                resolve(final);
              }
            }, intervaloMs);
          });
        }

        function criarBotaoHistoricoDado(valor, sufixo = "", destaque = false) {
          const numero = parseInt(valor, 10);
          if (!Number.isInteger(numero)) return "";

          const texto = `${numero}${sufixo}`;
          const classeDestaque = destaque ? " destaque" : "";
          return `<button type="button" class="dado-modal-historico-rolagem${classeDestaque}" data-valor-rolagem="${numero}" title="Usar ${numero} no dado">${texto}</button>`;
        }

        global.rolarDado = rolarDado;
        global.animarRolagemNoCampo = animarRolagemNoCampo;
        global.criarBotaoHistoricoDado = criarBotaoHistoricoDado;
        global.DiceCore = {
          rolarDado,
          animarRolagemNoCampo,
          criarBotaoHistoricoDado,
        };
      })(window);
    
