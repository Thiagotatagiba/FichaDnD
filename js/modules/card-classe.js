
      // ===== INTEGRAÇÃO Card Classes Vazio =====
      const CARD_CLASSE_HTML = `
        <div class="container">
          <div class="topo">
            <div>
              <h2 id="tituloClasse">Classe</h2>
              <div id="nivelClasseAtualCard" class="classe-nivel-atual">Nível 1</div>
            </div>
            <span id="nomeSubclasse" class="subclasse"></span>
          </div>

          <button class="ficha-btn" onclick="importarJSON()">📤 Importar JSON</button>
          <button class="ficha-btn ficha-btn-aplicar-na-ficha" onclick="aplicarNaFicha()">✅ Aplicar na Ficha</button>
          <input type="file" id="classeFileInput" hidden>

          <br>

          <div id="statusCargaClasse" style="margin: 10px 0; font-size: 12px; color: #5a3b1d;">Aguardando carregamento da classe...</div>

          <select id="selectSubclasse" onchange="aplicarSubclasse()"></select>

          <table>
            <thead>
              <tr>
                <th rowspan="2">Nível</th>
                <th rowspan="2">Prof.</th>
                <th rowspan="2">Características</th>
                <th rowspan="2">Truques</th>
                <th colspan="9">Espaços de Magia por Nível</th>
              </tr>
              <tr>
                <th>1°</th>
                <th>2°</th>
                <th>3°</th>
                <th>4°</th>
                <th>5°</th>
                <th>6°</th>
                <th>7°</th>
                <th>8°</th>
                <th>9°</th>
              </tr>
            </thead>
            <tbody id="tbodyClasse"></tbody>
          </table>
        </div>

        <!-- MODAL -->
        <div id="modal" class="modal" onclick="fecharModal()">
          <div class="modal-content" onclick="event.stopPropagation()">
            <h3 id="modalTitulo"></h3>
            <p id="modalTexto"></p>
          </div>
        </div>
      `;

      let dadosClasse = null;
      let subclasseAtual = "";

      function inicializarCardClasse() {
        const container = document.getElementById("cardClasseContainer");
        if (!container) return;
        container.innerHTML = CARD_CLASSE_HTML;
        configurarImportacaoManualCard();
      }

      function configurarImportacaoManualCard() {
        const fileInput = document.getElementById("classeFileInput");
        if (!fileInput || fileInput.dataset.listenerConfigurado === "true")
          return;

        fileInput.dataset.listenerConfigurado = "true";
        fileInput.addEventListener("change", (e) => {
          const arquivo = e.target.files?.[0];
          if (!arquivo) return;

          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const selectArquivo = document.getElementById(
                "caracteristicaClasseArquivo",
              );
              if (selectArquivo && arquivo.name) {
                if (
                  ![...selectArquivo.options].some(
                    (option) => option.value === arquivo.name,
                  )
                ) {
                  const option = document.createElement("option");
                  option.value = arquivo.name;
                  option.textContent = arquivo.name;
                  selectArquivo.appendChild(option);
                }
                selectArquivo.value = arquivo.name;
              }
              importarJSONNoCard(evt.target.result, arquivo.name);
            } catch (err) {
              atualizarStatusCargaClasse(
                "Erro ao importar o JSON manualmente.",
                "erro",
              );
              alert("Erro ao parsear JSON");
            } finally {
              fileInput.value = "";
            }
          };
          reader.readAsText(arquivo);
        });
      }

      function aplicarNaFicha() {
        if (!dadosClasse) {
          alert("Carregue uma classe primeiro!");
          return;
        }

        const classeAtual = document
          .getElementById("tituloClasse")
          .textContent.toLowerCase()
          .replace(" ", "");
        const subclasseAtual =
          document.getElementById("selectSubclasse").value || "";
        const nivelAtual = document.getElementById("classeNivelID")?.value || 1;

        if (typeof carregarCaracteristicasClasse === "function") {
          carregarCaracteristicasClasse(
            classeAtual,
            parseInt(nivelAtual) || 1,
            subclasseAtual,
          );
        }

        alert("✅ Características aplicadas na ficha!");
      }

      function atualizarStatusCargaClasse(mensagem, tipo = "info") {
        const status = document.getElementById("statusCargaClasse");
        if (!status) return;

        const cores = {
          info: "#5a3b1d",
          sucesso: "#1f6f3e",
          erro: "#a11d1d",
        };

        status.textContent = mensagem;
        status.style.color = cores[tipo] || cores.info;
        console.log("[CardClasse]", mensagem);
      }

      function atualizarAtalhoConsultaCaracteristicaClasse() {
        const botao = document.getElementById(
          "abrirConsultaCaracteristicaClasse",
        );
        if (!botao) return;

        const nomeClasse =
          dadosClasse?.nome ||
          document.getElementById("classeNomeID")?.selectedOptions?.[0]?.text ||
          document.getElementById("classeNomeID")?.value ||
          "";

        const temTabela = !!dadosClasse && !!document.querySelector(
          "#cardClasseContainer table",
        );

        botao.hidden = !temTabela;
        if (temTabela) {
          botao.title = `Característica da Classe ${nomeClasse}`;
          botao.setAttribute(
            "aria-label",
            `Abrir característica da classe ${nomeClasse}`,
          );
        }
      }

      function abrirConsultaCaracteristicaClasse() {
        if (!dadosClasse) return;
        montarTabela();

        const tabela = document.querySelector("#cardClasseContainer table");
        const conteudo = document.getElementById(
          "consultaCaracteristicaClasseConteudo",
        );
        const overlay = document.getElementById(
          "consultaCaracteristicaClasseOverlay",
        );
        if (!tabela || !conteudo || !overlay) return;

        conteudo.innerHTML = "";
        conteudo.appendChild(tabela.cloneNode(true));
        overlay.classList.add("ativo");
        overlay.setAttribute("aria-hidden", "false");
      }

      function fecharConsultaCaracteristicaClasse() {
        const overlay = document.getElementById(
          "consultaCaracteristicaClasseOverlay",
        );
        if (!overlay) return;
        overlay.classList.remove("ativo");
        overlay.setAttribute("aria-hidden", "true");
      }

      function nomeArquivoAtual() {
        return "Ficha_DnD_-_Tatagiba_1.0.html";
      }

      function carregarJSONClasse(caminho, classe = "") {
        const classeNormalizada =
          normalizarTextoClasse(classe) ||
          obterSlugArquivoCaracteristica(String(caminho || "").split("/").pop());
        const dadosEmbutidos = classeNormalizada
          ? window.CLASSES_EMBUTIDAS?.[classeNormalizada]
          : null;

        if (!caminho && dadosEmbutidos) {
          return Promise.resolve(dadosEmbutidos);
        }

        return fetch(caminho)
          .then((response) => {
            if (!response.ok) throw new Error("JSON not found");
            return response.json();
          })
          .catch((errorFetch) => {
            return new Promise((resolve, reject) => {
              const request = new XMLHttpRequest();
              request.open("GET", caminho, true);

              request.onload = function () {
                const statusValido =
                  request.status >= 200 && request.status < 300;
                const arquivoLocalValido =
                  request.status === 0 && request.responseText;

                if (!statusValido && !arquivoLocalValido) {
                  reject(errorFetch);
                  return;
                }

                try {
                  resolve(JSON.parse(request.responseText));
                } catch (errorParse) {
                  reject(errorParse);
                }
              };

              request.onerror = function () {
                if (dadosEmbutidos) {
                  resolve(dadosEmbutidos);
                  return;
                }
                reject(errorFetch);
              };

              request.send();
            });
          })
          .catch((error) => {
            if (dadosEmbutidos) return dadosEmbutidos;
            throw error;
          });
      }

      function importarJSONNoCard(conteudoJSON, origem = "JSON", classe = "") {
        const data =
          typeof conteudoJSON === "string"
            ? JSON.parse(conteudoJSON)
            : conteudoJSON;
        if (!data) throw new Error("JSON vazio");

        dadosClasse = data;
        document.getElementById("tituloClasse").textContent =
          data.nome || classe || "Classe";
        document.getElementById("nomeSubclasse").textContent = "";
        const selectSubclasse = document.getElementById("selectSubclasse");
        if (selectSubclasse) selectSubclasse.value = "";
        montarTabela();
        carregarSubclasses();

        const subclasseFicha = document.getElementById("subclasse")?.value || "";
        const subclasseSalva =
          document.getElementById("caracteristicaClasseSubclasse")?.value || "";
        const subclasseEncontrada =
          encontrarSubclasseCaracteristica(data, subclasseFicha) ||
          encontrarSubclasseCaracteristica(data, subclasseSalva);

        if (subclasseEncontrada) {
          definirSubclasseCaracteristica(subclasseEncontrada);
          aplicarSubclasse();
        } else {
          definirSubclasseCaracteristica("");
        }

        const totalNiveis = Array.isArray(data.niveis) ? data.niveis.length : 0;
        const detalheSubclasse = subclasseEncontrada
          ? ` Subclasse selecionada: ${subclasseEncontrada}.`
          : subclasseFicha || subclasseSalva
            ? ` Não encontrei subclasse correspondente. ${mensagemImportacaoManualCaracteristica()}`
            : "";
        atualizarStatusCargaClasse(
          `Arquivo importado no card via ${origem}: ${data.nome || classe || "Classe"} (${totalNiveis} níveis).${detalheSubclasse}`,
          subclasseFicha || subclasseSalva
            ? subclasseEncontrada
              ? "sucesso"
              : "erro"
            : "sucesso",
        );
        atualizarAtalhoConsultaCaracteristicaClasse();
      }

      function aplicarDadosClasseNoCard(data, classe = "") {
        if (!data) return;
        importarJSONNoCard(data, "carregamento automatico", classe);
      }

      window.addEventListener("message", function (event) {
        if (event.data?.action !== "loadClassCardData" || !event.data?.jsonData)
          return;
        atualizarStatusCargaClasse(
          `Dados recebidos via ficha principal para ${event.data.classe || event.data.jsonData?.nome || "classe"}.`,
          "info",
        );
        aplicarDadosClasseNoCard(event.data.jsonData, event.data.classe || "");
      });

      function importarJSON() {
        document.getElementById("classeFileInput")?.click();
      }

      document.addEventListener("DOMContentLoaded", function () {
        configurarImportacaoManualCard();
        document
          .getElementById("abrirConsultaCaracteristicaClasse")
          ?.addEventListener("click", abrirConsultaCaracteristicaClasse);
        document
          .getElementById("fecharConsultaCaracteristicaClasse")
          ?.addEventListener("click", fecharConsultaCaracteristicaClasse);
        document
          .getElementById("consultaCaracteristicaClasseOverlay")
          ?.addEventListener("click", (event) => {
            if (event.target.id === "consultaCaracteristicaClasseOverlay") {
              fecharConsultaCaracteristicaClasse();
            }
          });
      });

      function obterNivelAtualClasseCard() {
        const nivelDom = parseInt(
          document.getElementById("classeNivelID")?.value,
          10,
        );
        if (Number.isInteger(nivelDom) && nivelDom > 0) return nivelDom;

        const nivelPersonagem = obterNivelSalvoFicha(window.personagem || {});
        if (nivelPersonagem) return nivelPersonagem;

        const nivel = parseInt(document.getElementById("classeNivelID")?.value, 10);
        return Number.isNaN(nivel) || nivel < 1 ? 1 : nivel;
      }

      function atualizarNivelClasseCard() {
        const nivelCard = document.getElementById("nivelClasseAtualCard");
        if (nivelCard) {
          nivelCard.textContent = `Nível ${obterNivelAtualClasseCard()}`;
        }
      }

      function classeLinhaNivelCard(nivelLinha, nivelAtual) {
        const nivel = nivelCaracteristicaValor(nivelLinha);
        if (nivel < nivelAtual) return "linha-passada";
        if (nivel === nivelAtual) return "linha-atual";
        return "linha-futura";
      }

      function montarTabela() {
        const tbody = document.getElementById("tbodyClasse");
        if (!tbody || !dadosClasse) return;

        document.getElementById("tituloClasse").textContent = dadosClasse.nome;
        atualizarNivelClasseCard();
        tbody.innerHTML = "";

        const nivelAtual = obterNivelAtualClasseCard();
        dadosClasse.niveis.forEach((n) => {
          const tr = document.createElement("tr");
          tr.classList.add(classeLinhaNivelCard(n.nivel, nivelAtual));

          tr.innerHTML = `
            <td>${n.nivel}</td>
            <td>${n.proficiencia}</td>
            <td>${renderTags(n.caracteristicas)}</td>
            <td>${n.truques ?? "–"}</td>
            ${renderSlots(n.magias)}
          `;

          tbody.appendChild(tr);
        });
      }

      function renderTags(texto) {
        if (!texto) return "–";

        return texto
          .split(",")
          .map((t) => {
            t = t.trim();
            return `<span class="tag" onclick="abrirModal('${t}')">${t}</span>`;
          })
          .join("");
      }

      function renderSlots(magias) {
        let html = "";
        for (let i = 0; i < 9; i++) {
          let valor = magias?.[i];
          html += `<td>${valor ?? "–"}</td>`;
        }
        return html;
      }

      function carregarSubclasses() {
        const select = document.getElementById("selectSubclasse");
        if (!select || !dadosClasse) return;

        select.innerHTML = `<option value="">Subclasse</option>`;

        for (let nome in dadosClasse.subclasses || {}) {
          select.innerHTML += `<option value="${nome}">${nome}</option>`;
        }
      }

      function aplicarSubclasse() {
        const subclasse = document.getElementById("selectSubclasse").value;
        subclasseAtual = subclasse;
        const campoSubclasseCaracteristica = document.getElementById(
          "caracteristicaClasseSubclasse",
        );
        if (campoSubclasseCaracteristica) {
          campoSubclasseCaracteristica.value = subclasse;
        }

        document.getElementById("nomeSubclasse").textContent = subclasse;

        montarTabela();

        if (!subclasse) return;

        const linhas = document.querySelectorAll("#tbodyClasse tr");

        linhas.forEach((tr, i) => {
          const nivel = parseInt(dadosClasse.niveis[i].nivel);
          let texto = dadosClasse.niveis[i].caracteristicas || "";

          texto = texto.replace(dadosClasse.TP_Subclasse, subclasse);

          const regra = dadosClasse.subclasses[subclasse][nivel];

          if (regra) {
            if (regra.replace && texto.includes(regra.replace)) {
              texto = texto.replace(regra.replace, regra.value);
            }

            if (regra.add) {
              if (texto) {
                texto += ", " + regra.add.join(", ");
              } else {
                texto = regra.add.join(", ");
              }
            }
          }

          tr.children[2].innerHTML = renderTags(texto);
        });
      }

      function abrirModal(nome) {
        document.getElementById("modalTitulo").textContent = nome;

        const desc = dadosClasse.descricoes?.[nome] || "Sem descrição.";
        document.getElementById("modalTexto").textContent = desc;

        document.getElementById("modal").style.display = "flex";
      }

      function fecharModal() {
        document.getElementById("modal").style.display = "none";
      }

      document.addEventListener("DOMContentLoaded", function () {
        inicializarCardClasse();
        preencherSelectArquivosCaracteristica();

        const urlParams = new URLSearchParams(window.location.search);
        const classe = urlParams.get("classe");
        if (classe) {
          const arquivo = obterArquivoCaracteristicaPorClasse(classe);
          const caminhoJson =
            caminhoArquivoCaracteristica(arquivo) ||
            `Classes/caracteristica_${normalizarTextoClasse(classe)}.json`;
          atualizarStatusCargaClasse(`Classe solicitada: ${classe}`, "info");
          carregarJSONClasse(caminhoJson, classe)
            .then((data) => {
              aplicarDadosClasseNoCard(data, classe);
            })
            .catch((error) => {
              console.error("Erro ao carregar JSON:", error);
              atualizarStatusCargaClasse(
                `Falha ao carregar JSON: ${caminhoJson}`,
                "erro",
              );
              const titulo = document.getElementById("tituloClasse");
              if (titulo) titulo.textContent = "Classe: " + classe;
              const tbody = document.querySelector("#tbodyClasse");
              if (tbody)
                tbody.innerHTML =
                  '<tr><td colspan="13" style="text-align:center; color:#666;">JSON não encontrado: Classes/caracteristica_' +
                  classe +
                  ".json<br>Carregue manualmente ou adicione o arquivo.</td></tr>";
            });
        } else {
          atualizarStatusCargaClasse(`Aguardando seleção de classe...`, "info");
          const classeAtual = document.getElementById("classeNomeID")?.value;
          const arquivoAtual =
            document.getElementById("caracteristicaClasseArquivo")?.value ||
            obterArquivoCaracteristicaPorClasse(classeAtual);
          if (classeAtual || arquivoAtual) {
            sincronizarArquivoCaracteristicaComClasse(false);
            carregarCaracteristicasClasse(
              classeAtual || obterSlugArquivoCaracteristica(arquivoAtual),
              parseInt(document.getElementById("classeNivelID")?.value) || 1,
              document.getElementById("subclasse")?.value || "",
            );
          }
        }
      });
    
