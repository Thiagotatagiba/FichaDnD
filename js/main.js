
      // ===== Integracao e inicializacao =====
      const fichasIntegracaoPendentes = [];
      let drenandoFichasIntegracao = false;
      const drenarFichasIntegracaoPendentes = () => {
        if (drenandoFichasIntegracao || typeof window.__aplicarFichaIntegracao !== "function") return;
        if (fichasIntegracaoPendentes.length === 0) return;
        const data = fichasIntegracaoPendentes.shift();
        drenandoFichasIntegracao = true;
        Promise.resolve()
          .then(() => window.__aplicarFichaIntegracao(data))
          .then((aplicado) => {
            if (aplicado !== true) throw new Error("A ficha recebida não foi aplicada.");
          })
          .catch((erro) => {
            console.error("Falha ao aplicar ficha recebida pela integração:", erro);
          })
          .finally(() => {
            drenandoFichasIntegracao = false;
            drenarFichasIntegracaoPendentes();
          });
      };
      window.__drenarFichasIntegracaoPendentes = drenarFichasIntegracaoPendentes;
      window.api?.receberPersonagem((data) => {
        fichasIntegracaoPendentes.push(data);
        drenarFichasIntegracaoPendentes();
      });
    
