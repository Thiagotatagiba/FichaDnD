
      function trocarAba(nome, el) {
        document.querySelectorAll(".aba").forEach((a) => {
          a.classList.remove("ativa");
        });

        document.querySelectorAll(".tab").forEach((t) => {
          t.classList.remove("active");
        });

        document.getElementById(nome).classList.add("ativa");
        el.classList.add("active");
      }

      function formatarBonusProf() {
        const valor = getBonusProficiencia();
        setBonusProficiencia(valor);
      }

      function formatarPvTemporario() {
        const input = document.getElementById("pvTemporario");
        if (!input) return 0;

        let valor = parseInt(String(input.value).replace(/[^\d-]/g, "")) || 0;
        if (valor < 0) valor = 0;

        input.value = valor;
        return valor;
      }

      function atualizarCoracoesVida() {
        const campoAtual = document.getElementById("pvAtual");
        const campoTotal = document.getElementById("pvTotal");
        const campoTemporario = document.getElementById("pvTemporario");
        if (!campoAtual || !campoTotal || !campoTemporario) return;

        const vidaAtual = Math.max(parseFloat(campoAtual.value) || 0, 0);
        const vidaMax = Math.max(parseFloat(campoTotal.value) || 0, 0);
        const vidaTemp = Math.max(parseFloat(campoTemporario.value) || 0, 0);

        const vidaNormal = vidaMax > 0 ? Math.min(vidaAtual, vidaMax) : 0;
        const valorPorCoracao = vidaMax > 0 ? vidaMax / 5 : 0;

        document.querySelectorAll(".pv-heart-fill-red").forEach((fill, i) => {
          let preenchimento = 0;

          if (valorPorCoracao > 0) {
            const inicioCoracao = i * valorPorCoracao;
            preenchimento = (vidaNormal - inicioCoracao) / valorPorCoracao;
          }

          preenchimento = Math.max(0, Math.min(1, preenchimento));
          fill.style.clipPath = `inset(0 ${100 - preenchimento * 100}% 0 0)`;
        });

        const tempHeart = document.getElementById("pvTempHeart");
        const tempFill = tempHeart?.querySelector(".pv-heart-fill-blue");
        if (!tempHeart || !tempFill) return;

        if (vidaTemp > 0) {
          tempHeart.classList.remove("pv-heart-hidden");
          const excesso = Math.max(0, vidaAtual - vidaMax);
          const preenchimentoAzul = Math.max(
            0,
            Math.min(1, excesso / vidaTemp),
          );
          tempFill.style.clipPath = `inset(0 ${100 - preenchimentoAzul * 100}% 0 0)`;
        } else {
          tempHeart.classList.add("pv-heart-hidden");
          tempFill.style.clipPath = "inset(0 100% 0 0)";
        }
      }

      function normalizarPontosDeVida() {
        const campoAtual = document.getElementById("pvAtual");
        const campoTotal = document.getElementById("pvTotal");

        if (!campoAtual || !campoTotal) return;

        let pvAtual =
          parseInt(String(campoAtual.value).replace(/[^\d-]/g, "")) || 0;
        let pvTotal =
          parseInt(String(campoTotal.value).replace(/[^\d-]/g, "")) || 0;
        const pvTemporario = formatarPvTemporario();

        if (pvAtual < 0) pvAtual = 0;
        if (pvTotal < 0) pvTotal = 0;

        const limiteMaximo = pvTotal + pvTemporario;
        if (pvAtual > limiteMaximo) pvAtual = limiteMaximo;

        campoAtual.value = pvAtual;
        campoTotal.value = pvTotal;

        atualizarCoracoesVida();
        atualizarResumoAtaquesConjuracao();
        verificarStatusMorte();
      }

      function normalizarDadosVida() {
        const campoRestantes = document.getElementById("dadosVidaRestantes");
        const campoTotal = document.getElementById("dadosVidaTotal");

        if (!campoRestantes || !campoTotal) return;

        let restantes =
          parseInt(String(campoRestantes.value).replace(/[^\d-]/g, "")) || 0;
        let total =
          parseInt(String(campoTotal.value).replace(/[^\d-]/g, "")) || 0;

        if (restantes < 0) restantes = 0;
        if (total < 0) total = 0;
        if (restantes > total) restantes = total;

        campoRestantes.value = restantes;
        campoTotal.value = total;
      }

      function normalizarTipoDadoVida(valor) {
        const textoNormalizado = String(valor || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "");

        const mapa = {
          4: "d4",
          d4: "d4",
          6: "d6",
          d6: "d6",
          8: "d8",
          d8: "d8",
          10: "d10",
          d10: "d10",
          12: "d12",
          d12: "d12",
        };

        return mapa[textoNormalizado] || "d8";
      }

      function normalizarTextoComparacao(valor) {
        return (valor || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      }

      function normalizarChaveAtributo(valor) {
        const textoNormalizado = normalizarTextoComparacao(valor);

        const mapa = {
          for: "for",
          forca: "for",
          str: "for",
          des: "des",
          destreza: "des",
          dex: "des",
          con: "con",
          constituicao: "con",
          int: "int",
          inteligencia: "int",
          sab: "sab",
          sabedoria: "sab",
          wis: "sab",
          car: "car",
          carisma: "car",
          cha: "car",
        };

        return mapa[textoNormalizado] || "";
      }
    
