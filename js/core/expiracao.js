
      // ===== SISTEMA DE EXPIRAÇÃO =====
      const DATA_EXPIRACAO = new Date("2026-08-04T12:00:00");
      console.log(
        "[Debug] Data de expiração:",
        DATA_EXPIRACAO.toLocaleString("pt-BR"),
      );

      function bloquearFicha() {
        const overlay = document.getElementById("expiracaoOverlay");
        if (overlay) overlay.classList.remove("hidden");

        document
          .querySelectorAll("input, textarea, select, button")
          .forEach((el) => {
            if (el.id !== "expiracaoOkBtn") {
              el.disabled = true;
            }
          });
      }

      function resetarFicha() {
        localStorage.clear();
        location.reload();
      }

      document.addEventListener("DOMContentLoaded", function () {
        const agora = new Date();
        if (agora >= DATA_EXPIRACAO) {
          bloquearFicha();
        }

        const btnOk = document.getElementById("expiracaoOkBtn");
        if (btnOk) {
          btnOk.addEventListener("click", function () {
            resetarFicha();
          });
        }
      });
    
