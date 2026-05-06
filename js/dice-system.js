(function (global) {
    function criarSistemaDado(container, options = {}) {
        const raiz = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!raiz) {
            throw new Error('criarSistemaDado requer um container valido.');
        }

        const config = {
            titulo: options.titulo || 'Rolagem',
            nota: options.nota || '',
            quantidade: options.quantidade || 1,
            faces: options.faces || 20,
            bonus: options.bonus || 0,
            rotuloDado: options.rotuloDado || 'Dado',
            rotuloBonus: options.rotuloBonus || 'Bonus',
            textoBotao: options.textoBotao || 'Rolar',
            duracaoMs: options.duracaoMs || 1000,
            intervaloMs: options.intervaloMs || 60,
            onChange: typeof options.onChange === 'function' ? options.onChange : null,
            onRoll: typeof options.onRoll === 'function' ? options.onRoll : null
        };

        const estado = {
            valor: null,
            bonus: parseInt(config.bonus, 10) || 0,
            historico: [],
            ultimaRolagem: null
        };

        raiz.innerHTML = `
            <div class="dado-modal" data-dice-system>
                <div class="dado-modal-cabecalho">
                    <span class="dado-modal-titulo">${config.titulo}</span>
                    <span class="dado-modal-nota">${config.nota || `${config.quantidade}d${config.faces}`}</span>
                </div>
                <div class="dado-modal-rolagem dado-modal-calculo">
                    <div class="dado-modal-coluna">
                        <div class="dado-modal-campo dado-modal-campo-com-dado dado-modal-grupo-dado">
                            <span class="dado-modal-campo-rotulo">${config.rotuloDado}</span>
                            <div class="dado-modal-botao-coluna">
                                <button type="button" class="botao-dado" data-dice-roll>${config.textoBotao}</button>
                                <div class="dado-modal-nota" data-dice-formula>${config.quantidade}d${config.faces}</div>
                            </div>
                            <input type="number" min="0" step="1" data-dice-value>
                        </div>
                    </div>
                    <div class="dado-modal-bonus-bloco">
                        <div class="dado-modal-bonus" data-dice-bonus>+0</div>
                        <div class="dado-modal-bonus-detalhe">${config.rotuloBonus}</div>
                    </div>
                    <div class="dado-modal-total" data-dice-total>Total: <strong>-</strong></div>
                </div>
                <div class="dado-modal-historico">
                    <span class="dado-modal-historico-rotulo">Historico:</span>
                    <span class="dado-modal-historico-lista" data-dice-history>-</span>
                </div>
            </div>
        `;

        const campoValor = raiz.querySelector('[data-dice-value]');
        const campoBonus = raiz.querySelector('[data-dice-bonus]');
        const campoTotal = raiz.querySelector('[data-dice-total]');
        const campoHistorico = raiz.querySelector('[data-dice-history]');
        const botaoRolar = raiz.querySelector('[data-dice-roll]');

        function normalizarValor(valor) {
            const numero = parseInt(valor, 10);
            return Number.isInteger(numero) ? numero : null;
        }

        function getValor() {
            return estado.valor;
        }

        function getTotal() {
            return Number.isInteger(estado.valor)
                ? estado.valor + estado.bonus
                : null;
        }

        function atualizarBonus() {
            const sinal = estado.bonus >= 0 ? '+' : '';
            campoBonus.textContent = `${sinal}${estado.bonus}`;
        }

        function atualizarTotal() {
            const total = getTotal();
            campoTotal.innerHTML = `Total: <strong>${Number.isInteger(total) ? total : '-'}</strong>`;
        }

        function atualizarHistorico() {
            if (!estado.historico.length) {
                campoHistorico.textContent = '-';
                return;
            }

            const maior = Math.max(...estado.historico);
            const menor = Math.min(...estado.historico);
            campoHistorico.innerHTML = [...estado.historico].reverse().map(valor => {
                const ehMaior = valor === maior;
                const ehMenor = valor === menor;
                const sufixo = ehMaior ? '⇧' : ehMenor ? '⇩' : '';
                return global.criarBotaoHistoricoDado(valor, sufixo, ehMaior || ehMenor);
            }).join(', ');
        }

        function notificarMudanca() {
            atualizarTotal();
            if (config.onChange) {
                config.onChange({
                    valor: getValor(),
                    bonus: estado.bonus,
                    total: getTotal(),
                    historico: [...estado.historico],
                    ultimaRolagem: estado.ultimaRolagem
                });
            }
        }

        function setValor(valor, registrarHistorico = false) {
            const numero = normalizarValor(valor);
            estado.valor = numero;
            campoValor.value = Number.isInteger(numero) ? numero : '';

            if (registrarHistorico && Number.isInteger(numero)) {
                estado.historico = [...estado.historico, numero];
                atualizarHistorico();
            }

            notificarMudanca();
        }

        function setBonus(valor) {
            const numero = parseInt(valor, 10);
            estado.bonus = Number.isInteger(numero) ? numero : 0;
            atualizarBonus();
            notificarMudanca();
        }

        function rolar() {
            botaoRolar.disabled = true;
            return global.animarRolagemNoCampo(
                campoValor,
                config.quantidade,
                config.faces,
                config.duracaoMs,
                config.intervaloMs
            ).then(rolagem => {
                estado.ultimaRolagem = rolagem;
                setValor(rolagem?.soma, true);
                if (config.onRoll) config.onRoll(rolagem, api);
                return rolagem;
            }).finally(() => {
                botaoRolar.disabled = false;
            });
        }

        campoValor.addEventListener('input', () => {
            estado.valor = normalizarValor(campoValor.value);
            notificarMudanca();
        });

        campoValor.addEventListener('change', () => {
            setValor(campoValor.value);
        });

        botaoRolar.addEventListener('click', rolar);

        campoHistorico.addEventListener('click', evento => {
            const botao = evento.target.closest('[data-valor-rolagem]');
            if (!botao) return;
            setValor(botao.dataset.valorRolagem);
        });

        const api = {
            element: raiz,
            setBonus,
            getValor,
            getTotal,
            setValor,
            rolar,
            getHistorico: () => [...estado.historico],
            getUltimaRolagem: () => estado.ultimaRolagem
        };

        setBonus(estado.bonus);
        return api;
    }

    global.criarSistemaDado = criarSistemaDado;
})(window);
