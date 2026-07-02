
      // ===== Atributos, radar e navegacao principal =====
      function atualizarAtributos() {
        const inputs = document.querySelectorAll(".atributo input");

        inputs.forEach((input) => {
          let v = parseInt(input.value) || 0;

          if (v > 20) v = 20;
          if (v < 0) v = 0;

          input.value = v;

          const m = Math.floor((v - 10) / 2);

          input.parentElement.querySelector(".mod").innerText =
            (m >= 0 ? "+" : "") + m;
        });

        atualizarIniciativa();
        atualizarSeletoresAtaqueEquipados();
        atualizarCamposArmaduraSelecionada(armaduraSelecionadaAtual);
        if (typeof renderizarArmadurasEquipamento === "function")
          renderizarArmadurasEquipamento(coletarArmaduras());
      }

      function atualizarIniciativa() {
        const campoIniciativa = document.getElementById("iniciativa");
        const valorDestreza =
          parseInt(document.getElementById("atrib_des")?.value) || 0;
        const modificadorDestreza = Math.floor((valorDestreza - 10) / 2);

        campoIniciativa.value =
          (modificadorDestreza >= 0 ? "+" : "") + modificadorDestreza;
      }

      function atualizarProficienciaNoRadar() {
        ["for", "des", "con", "int", "sab", "car"].forEach((atributo) => {
          const blocoAtributo = document.querySelector(".atributo." + atributo);
          const checkboxProf = document.getElementById("prof_salv_" + atributo);

          if (!blocoAtributo || !checkboxProf) return;

          blocoAtributo.classList.toggle(
            "proficiente-radar",
            checkboxProf.checked,
          );
        });
      }

      function desenharRadar() {
        const canvas = document.getElementById("radar");
        const ctx = canvas.getContext("2d");

        const cx = 130;
        const cy = 130;
        const raio = 95;

        const inputs = document.querySelectorAll(".atributo input");

        let valores = [];

        inputs.forEach((input) => {
          valores.push(parseInt(input.value) || 0);
        });

        ctx.clearRect(0, 0, 260, 260);

        ctx.strokeStyle = "#c8b9a5";

        for (let i = 1; i <= 4; i++) {
          ctx.beginPath();
          ctx.arc(cx, cy, (raio / 4) * i, 0, Math.PI * 2);
          ctx.stroke();
        }

        for (let i = 0; i < 6; i++) {
          let ang = ((Math.PI * 2) / 6) * i - Math.PI / 2;
          let x = cx + Math.cos(ang) * raio;
          let y = cy + Math.sin(ang) * raio;

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        ctx.beginPath();

        for (let i = 0; i < 6; i++) {
          let ang = ((Math.PI * 2) / 6) * i - Math.PI / 2;
          let r = raio * (valores[i] / 20);

          let x = cx + Math.cos(ang) * r;
          let y = cy + Math.sin(ang) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fillStyle = "rgba(150,80,50,0.4)";
        ctx.fill();

        ctx.strokeStyle = "#8b4513";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      window.addEventListener("beforeunload", function (e) {
        if (!fichaFoiAlterada()) return;
        e.preventDefault();
        e.returnValue = "";
      });
    
