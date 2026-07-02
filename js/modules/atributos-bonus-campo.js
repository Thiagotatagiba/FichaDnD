
      const campo = document.getElementById("bonusProf");

      Object.defineProperty(campo, "value", {
        set(v) {
          this.setAttribute("value", v);
        },
        get() {
          return this.getAttribute("value");
        },
      });
    
