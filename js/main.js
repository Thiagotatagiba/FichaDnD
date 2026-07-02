
      // ===== Integracao e inicializacao =====
      window.api?.receberPersonagem((data) => {
        const personagem = JSON.parse(data);
        carregarFicha(personagem);
      });
    
