
      // ===== Integracao e inicializacao =====
      window.api?.receberPersonagem((data) => {
        Promise.resolve()
          .then(() => carregarFicha(JSON.parse(data)))
          .then((aplicado) => {
            if (aplicado !== true) {
              throw new Error("A ficha recebida não foi aplicada.");
            }
          })
          .catch((erro) => {
            console.error("Falha ao aplicar ficha recebida pela integração:", erro);
          });
      });
    
