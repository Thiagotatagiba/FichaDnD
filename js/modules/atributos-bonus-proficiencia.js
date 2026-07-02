
      // ===== Lógica de Bônus de Proficiência =====
      const bonusInput = document.getElementById("bonusProf");
      // Retorna o modificador a partir do valor do atributo (ex: 18 -> 4)
      function calcularModificadorAtributo(valorAtributo) {
        const v = Number(valorAtributo);
        if (!Number.isFinite(v)) return 0;
        return Math.floor((v - 10) / 2);
      }

      // Utilitário único para obter o máximo do dado de vida a partir da string "d8", "d10", etc.
      function obterMaxDadoVidaFromString(dado) {
        if (!dado || typeof dado !== "string") return 8; // fallback seguro
        const numero = Number(
          dado.replace(/\s*/g, "").toLowerCase().replace(/^d/, ""),
        );
        if (!Number.isFinite(numero) || numero <= 0) return 8;
        return Math.floor(numero);
      }
    
