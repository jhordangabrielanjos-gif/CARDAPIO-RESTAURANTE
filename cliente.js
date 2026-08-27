const API_URL = "https://cardapio-restaurante-za9s.onrender.com";

// ==========================================
// ESTABELECIMENTO ATUAL
// ==========================================

const parametros = new URLSearchParams(
    window.location.search
);

const estabelecimentoId =
    parametros.get("estabelecimento");

const ESTABELECIMENTO_ID =
    Number(estabelecimentoId) || 1;

console.log(
    "Estabelecimento atual:",
    ESTABELECIMENTO_ID
);


// ==========================================
// CONFIGURAÇÕES DO ESTABELECIMENTO
// ==========================================

let WHATSAPP = "5579981021378";

let CHAVE_PIX = "";


// ==========================================
// VARIÁVEIS
// ==========================================

let pratos = [];

let categoriaAtual = "Todos";


// ==========================================
// CARRINHO
// ==========================================

let CLIENTE_ID =
    localStorage.getItem("clienteId");

if (!CLIENTE_ID) {

    if (
        typeof crypto !== "undefined" &&
        crypto.randomUUID
    ) {

        CLIENTE_ID =
            crypto.randomUUID();

    } else {

        CLIENTE_ID =
            Date.now().toString() +
            Math.random().toString(36);

    }

    localStorage.setItem(
        "clienteId",
        CLIENTE_ID
    );

}


// ==========================================
// CHAVE DO CARRINHO
// ==========================================

const CHAVE_CARRINHO =
    `carrinhoRestaurante_${CLIENTE_ID}_${ESTABELECIMENTO_ID}`;


// ==========================================
// CARREGAR CARRINHO
// ==========================================

let carrinho =
    JSON.parse(
        localStorage.getItem(
            CHAVE_CARRINHO
        )
    ) || [];


// ==========================================
// ELEMENTOS PRINCIPAIS
// ==========================================

const listaPratos =
    document.getElementById(
        "listaPratos"
    );

const contador =
    document.getElementById(
        "contador"
    );

const pesquisa =
    document.getElementById(
        "pesquisa"
    );

const categorias =
    document.getElementById(
        "categorias"
    );


// ==========================================
// ELEMENTOS DO CARRINHO
// ==========================================

const abrirCarrinhoBtn =
    document.getElementById(
        "abrirCarrinho"
    );

const fecharCarrinhoBtn =
    document.getElementById(
        "fecharCarrinho"
    );

const overlayCarrinho =
    document.getElementById(
        "overlayCarrinho"
    );

const carrinhoElemento =
    document.getElementById(
        "carrinho"
    );

const listaCarrinho =
    document.getElementById(
        "listaCarrinho"
    );

const contadorCarrinho =
    document.getElementById(
        "contadorCarrinho"
    );

const totalCarrinho =
    document.getElementById(
        "totalCarrinho"
    );

const finalizarPedido =
    document.getElementById(
        "finalizarPedido"
    );

const limparCarrinhoBtn =
    document.getElementById(
        "limparCarrinho"
    );

const continuarComprando =
    document.getElementById(
        "continuarComprando"
    );

const toast =
    document.getElementById(
        "toast"
    );


// ==========================================
// VARIÁVEIS DO NOVO CARRINHO
// ==========================================

let enderecoCliente = null;
let numeroCliente = null;
let bairroCliente = null;
let complementoCliente = null;

let metodoPagamento = null;
let precisaTroco = null;
let trocoPara = null;
let levarMaquininha = null;


// ==========================================
// FORMATAÇÃO
// ==========================================

function formatarPreco(valor) {

    return Number(valor).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


// ==========================================
// SEGURANÇA HTML
// ==========================================

function escaparHTML(texto) {

    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// TOAST
// ==========================================

function mostrarToast(mensagem) {

    if (!toast) return;

    toast.textContent =
        mensagem;

    toast.classList.add(
        "mostrar"
    );

    clearTimeout(
        mostrarToast.timer
    );

    mostrarToast.timer =
        setTimeout(() => {

            toast.classList.remove(
                "mostrar"
            );

        }, 3000);

}


// ==========================================
// CONFIGURAÇÃO DO ESTABELECIMENTO
// ==========================================

async function carregarConfiguracaoEstabelecimento() {

    if (!estabelecimentoId) {
        return;
    }

    try {

        const resposta =
            await fetch(
                `${API_URL}/publico/estabelecimentos/${estabelecimentoId}`
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        if (!dados.sucesso) {

            throw new Error(
                dados.erro ||
                "Erro ao carregar estabelecimento."
            );

        }


        const estabelecimento =
            dados.estabelecimento;


        // ======================================
        // NOME
        // ======================================

        const nome =
            document.getElementById(
                "nomeEstabelecimento"
            );

        if (nome) {

            nome.textContent =
                estabelecimento.nome ||
                "Meu Restaurante";

        }


        // ======================================
        // DESCRIÇÃO
        // ======================================

        const descricao =
            document.getElementById(
                "descricaoEstabelecimento"
            );

        if (descricao) {

            descricao.textContent =
                estabelecimento.descricao ||
                "Escolha seus pratos favoritos e monte seu pedido.";

        }


        // ======================================
        // LOGO
        // ======================================

        const logo =
            document.getElementById(
                "logoEstabelecimento"
            );

        if (logo) {

            if (estabelecimento.logo) {

                logo.innerHTML = `
                    <img
                        src="${escaparHTML(
                            estabelecimento.logo
                        )}"
                        alt="Logo"
                        style="
                            width:60px;
                            height:60px;
                            object-fit:cover;
                            border-radius:50%;
                        "
                    >
                `;

            } else {

                logo.textContent =
                    "🍽️";

            }

        }


        // ======================================
        // COR
        // ======================================

        if (estabelecimento.cor) {

            document.documentElement.style.setProperty(
                "--cor-estabelecimento",
                estabelecimento.cor
            );

        }


        // ======================================
        // INFORMAÇÕES
        // ======================================

        const informacoes =
            document.getElementById(
                "informacoesEstabelecimento"
            );

        if (informacoes) {

            let html = "";


            if (estabelecimento.endereco) {

                html += `
                    <div>
                        📍 ${escaparHTML(
                            estabelecimento.endereco
                        )}
                    </div>
                `;

            }


            if (estabelecimento.horario) {

                html += `
                    <div>
                        🕐 ${escaparHTML(
                            estabelecimento.horario
                        )}
                    </div>
                `;

            }


            informacoes.innerHTML =
                html;

        }


        // ======================================
        // WHATSAPP
        // ======================================

        if (estabelecimento.whatsapp) {

            WHATSAPP =
                estabelecimento.whatsapp
                    .replace(/\D/g, "");

        }


        // ======================================
        // PIX
        // ======================================

        if (estabelecimento.pix) {

            CHAVE_PIX =
                String(
                    estabelecimento.pix
                ).trim();

        } else {

            CHAVE_PIX = "";

        }


        // ======================================
        // TÍTULO
        // ======================================

        document.title =
            estabelecimento.nome ||
            "Cardápio";


        console.log(
            "Estabelecimento carregado:",
            estabelecimento
        );

        console.log(
            "Chave PIX:",
            CHAVE_PIX
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar estabelecimento:",
            erro
        );

    }

}


// ==========================================
// CRIAR FORMULÁRIO DO CARRINHO
// ==========================================

function criarFormularioPedido() {

    if (!listaCarrinho) return;


    const formularioExistente =
        document.getElementById(
            "dadosPedido"
        );


    if (formularioExistente) {

        formularioExistente.remove();

    }


    const formulario =
        document.createElement(
            "div"
        );

    formulario.id =
        "dadosPedido";


    formulario.style.cssText = `
        margin-top:20px;
        padding:16px;
        background:#f5f5f5;
        border-radius:12px;
    `;


    formulario.innerHTML = `

        <h3 style="margin-top:0;">
            📦 Dados do pedido
        </h3>


        <!-- TIPO DO PEDIDO -->

        <div style="margin-bottom:15px;">

            <strong>
                Como você vai receber?
            </strong>

            <div style="
                display:flex;
                gap:10px;
                margin-top:10px;
                flex-wrap:wrap;
            ">

                <label style="
                    padding:10px;
                    background:white;
                    border:1px solid #ddd;
                    border-radius:8px;
                    cursor:pointer;
                ">

                    <input
                        type="radio"
                        name="tipoPedido"
                        value="Delivery"
                    >

                    🚚 Delivery

                </label>


                <label style="
                    padding:10px;
                    background:white;
                    border:1px solid #ddd;
                    border-radius:8px;
                    cursor:pointer;
                ">

                    <input
                        type="radio"
                        name="tipoPedido"
                        value="Buscar"
                    >

                    🏪 Buscar no estabelecimento

                </label>

            </div>

        </div>


        <!-- ENDEREÇO -->

        <div
            id="areaEnderecoCliente"
            style="display:none;"
        >

            <strong>
                📍 Endereço de entrega
            </strong>


            <input
                type="text"
                id="enderecoCliente"
                placeholder="Rua / Avenida"
                style="
                    width:100%;
                    padding:11px;
                    margin-top:8px;
                    margin-bottom:8px;
                    border:1px solid #ccc;
                    border-radius:8px;
                "
            >


            <input
                type="text"
                id="numeroCliente"
                placeholder="Número"
                style="
                    width:100%;
                    padding:11px;
                    margin-bottom:8px;
                    border:1px solid #ccc;
                    border-radius:8px;
                "
            >


            <input
                type="text"
                id="bairroCliente"
                placeholder="Bairro"
                style="
                    width:100%;
                    padding:11px;
                    margin-bottom:8px;
                    border:1px solid #ccc;
                    border-radius:8px;
                "
            >


            <input
                type="text"
                id="complementoCliente"
                placeholder="Complemento (opcional)"
                style="
                    width:100%;
                    padding:11px;
                    margin-bottom:15px;
                    border:1px solid #ccc;
                    border-radius:8px;
                "
            >

        </div>


        <!-- PAGAMENTO -->

        <div style="margin-top:10px;">

            <strong>
                💰 Forma de pagamento
            </strong>


            <select
                id="metodoPagamento"
                style="
                    width:100%;
                    padding:11px;
                    margin-top:8px;
                    border:1px solid #ccc;
                    border-radius:8px;
                    background:white;
                "
            >

                <option value="">
                    Selecione
                </option>

                <option value="PIX">
                    📱 PIX
                </option>

                <option value="Cartão">
                    💳 Cartão
                </option>

                <option value="Dinheiro">
                    💵 Dinheiro
                </option>

            </select>

        </div>


        <!-- PIX -->

        <div
            id="pixPedido"
            style="
                display:none;
                margin-top:15px;
                padding:15px;
                background:white;
                border-radius:10px;
                border:1px solid #ddd;
            "
        >

            <strong>
                💰 Pagamento via PIX
            </strong>


            <p style="margin:8px 0;">
                Chave PIX:
            </p>


            <div style="
                display:flex;
                gap:8px;
            ">

                <input
                    type="text"
                    id="chavePix"
                    readonly
                    style="
                        flex:1;
                        padding:10px;
                        border:1px solid #ccc;
                        border-radius:8px;
                    "
                >


                <button
                    type="button"
                    onclick="copiarPix()"
                    style="
                        padding:10px 14px;
                        border:none;
                        border-radius:8px;
                        cursor:pointer;
                    "
                >
                    📋 Copiar
                </button>

            </div>


            <small
                id="pixAviso"
                style="
                    display:block;
                    margin-top:8px;
                    color:#777;
                "
            ></small>

        </div>


        <!-- DINHEIRO -->

        <div
            id="areaDinheiro"
            style="display:none; margin-top:15px;"
        >

            <label
                style="
                    display:block;
                    margin-bottom:8px;
                "
            >

                <input
                    type="checkbox"
                    id="precisaTroco"
                >

                Preciso de troco

            </label>


            <input
                type="number"
                id="trocoPara"
                placeholder="Troco para quanto?"
                min="0"
                step="0.01"
                style="
                    display:none;
                    width:100%;
                    padding:11px;
                    border:1px solid #ccc;
                    border-radius:8px;
                "
            >

        </div>


        <!-- CARTÃO -->

        <div
            id="areaCartao"
            style="display:none; margin-top:15px;"
        >

            <label>

                <input
                    type="checkbox"
                    id="levarMaquininha"
                >

                📱 Levar maquininha para a entrega

            </label>

        </div>

    `;


    // Coloca o formulário antes do footer

    const footer =
        document.querySelector(
            ".carrinho-footer"
        );


    if (footer) {

        carrinhoElemento.insertBefore(
            formulario,
            footer
        );

    } else {

        carrinhoElemento.appendChild(
            formulario
        );

    }


    // ======================================
    // PEGAR ELEMENTOS
    // ======================================

    enderecoCliente =
        document.getElementById(
            "enderecoCliente"
        );

    numeroCliente =
        document.getElementById(
            "numeroCliente"
        );

    bairroCliente =
        document.getElementById(
            "bairroCliente"
        );

    complementoCliente =
        document.getElementById(
            "complementoCliente"
        );

    metodoPagamento =
        document.getElementById(
            "metodoPagamento"
        );

    precisaTroco =
        document.getElementById(
            "precisaTroco"
        );

    trocoPara =
        document.getElementById(
            "trocoPara"
        );

    levarMaquininha =
        document.getElementById(
            "levarMaquininha"
        );


    // ======================================
    // TIPO DO PEDIDO
    // ======================================

    document
        .querySelectorAll(
            'input[name="tipoPedido"]'
        )
        .forEach(radio => {

            radio.addEventListener(
                "change",
                atualizarTipoPedido
            );

        });


    // ======================================
    // PAGAMENTO
    // ======================================

    metodoPagamento.addEventListener(
        "change",
        atualizarPagamento
    );


    // ======================================
    // TROCO
    // ======================================

    precisaTroco.addEventListener(
        "change",
        () => {

            trocoPara.style.display =
                precisaTroco.checked
                    ? "block"
                    : "none";

        }
    );

}


// ==========================================
// TIPO DO PEDIDO
// ==========================================

function atualizarTipoPedido() {

    const selecionado =
        document.querySelector(
            'input[name="tipoPedido"]:checked'
        );


    const areaEndereco =
        document.getElementById(
            "areaEnderecoCliente"
        );


    if (!areaEndereco) return;


    if (
        selecionado &&
        selecionado.value === "Delivery"
    ) {

        areaEndereco.style.display =
            "block";

    } else {

        areaEndereco.style.display =
            "none";

    }


    atualizarPagamento();

}


// ==========================================
// PAGAMENTO
// ==========================================

function atualizarPagamento() {

    if (!metodoPagamento) return;


    const pagamento =
        metodoPagamento.value;


    const pixPedido =
        document.getElementById(
            "pixPedido"
        );

    const areaDinheiro =
        document.getElementById(
            "areaDinheiro"
        );

    const areaCartao =
        document.getElementById(
            "areaCartao"
        );


    if (pixPedido) {

        pixPedido.style.display =
            pagamento === "PIX"
                ? "block"
                : "none";

    }


    if (areaDinheiro) {

        areaDinheiro.style.display =
            pagamento === "Dinheiro"
                ? "block"
                : "none";

    }


    if (areaCartao) {

        areaCartao.style.display =
            pagamento === "Cartão"
                ? "block"
                : "none";

    }


    // ======================================
    // PREENCHER PIX
    // ======================================

    if (pagamento === "PIX") {

        const chavePix =
            document.getElementById(
                "chavePix"
            );

        const pixAviso =
            document.getElementById(
                "pixAviso"
            );


        if (chavePix) {

            chavePix.value =
                CHAVE_PIX || "";

        }


        if (pixAviso) {

            if (CHAVE_PIX) {

                pixAviso.textContent =
                    "Use esta chave para realizar o pagamento.";

            } else {

                pixAviso.textContent =
                    "⚠️ O estabelecimento ainda não cadastrou uma chave PIX.";

            }

        }

    }


    // ======================================
    // MAQUININHA
    // ======================================

    if (
        areaCartao &&
        levarMaquininha
    ) {

        const tipo =
            document.querySelector(
                'input[name="tipoPedido"]:checked'
            );


        if (
            pagamento === "Cartão" &&
            tipo &&
            tipo.value === "Delivery"
        ) {

            areaCartao.style.display =
                "block";

        } else {

            areaCartao.style.display =
                "none";

            levarMaquininha.checked =
                false;

        }

    }

}


// ==========================================
// COPIAR PIX
// ==========================================

async function copiarPix() {

    if (!CHAVE_PIX) {

        mostrarToast(
            "O estabelecimento não cadastrou uma chave PIX."
        );

        return;

    }


    try {

        await navigator.clipboard.writeText(
            CHAVE_PIX
        );

        mostrarToast(
            "Chave PIX copiada!"
        );

    } catch (erro) {

        const campo =
            document.getElementById(
                "chavePix"
            );

        if (campo) {

            campo.select();

            document.execCommand(
                "copy"
            );

        }

        mostrarToast(
            "Chave PIX copiada!"
        );

    }

}


// ==========================================
// SALVAR CARRINHO
// ==========================================

function salvarCarrinho() {

    localStorage.setItem(
        CHAVE_CARRINHO,
        JSON.stringify(carrinho)
    );

}


// ==========================================
// QUANTIDADE
// ==========================================

function quantidadeTotalCarrinho() {

    return carrinho.reduce(
        (total, item) => {

            return total +
                Number(
                    item.quantidade || 0
                );

        },
        0
    );

}


// ==========================================
// VALOR TOTAL
// ==========================================

function valorTotalCarrinho() {

    return carrinho.reduce(
        (total, item) => {

            return total +
                Number(item.preco || 0) *
                Number(item.quantidade || 0);

        },
        0
    );

}


// ==========================================
// ADICIONAR
// ==========================================

function adicionarAoCarrinho(id) {

    const prato =
        pratos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!prato) {

        mostrarToast(
            "Prato não encontrado."
        );

        return;

    }


    const existente =
        carrinho.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (existente) {

        existente.quantidade++;

    } else {

        carrinho.push({

            id: prato.id,

            nome: prato.nome,

            preco: Number(
                prato.preco
            ),

            quantidade: 1

        });

    }


    salvarCarrinho();

    atualizarCarrinho();


    mostrarToast(
        `${prato.nome} foi adicionado ao pedido!`
    );

}


// ==========================================
// AUMENTAR
// ==========================================

function aumentarQuantidade(id) {

    const item =
        carrinho.find(
            produto =>
                Number(produto.id) ===
                Number(id)
        );


    if (!item) return;


    item.quantidade++;


    salvarCarrinho();

    atualizarCarrinho();

}


// ==========================================
// DIMINUIR
// ==========================================

function diminuirQuantidade(id) {

    const item =
        carrinho.find(
            produto =>
                Number(produto.id) ===
                Number(id)
        );


    if (!item) return;


    item.quantidade--;


    if (item.quantidade <= 0) {

        carrinho =
            carrinho.filter(
                produto =>
                    Number(produto.id) !==
                    Number(id)
            );

    }


    salvarCarrinho();

    atualizarCarrinho();

}


// ==========================================
// ATUALIZAR CARRINHO
// ==========================================

function atualizarCarrinho() {

    const quantidade =
        quantidadeTotalCarrinho();

    const total =
        valorTotalCarrinho();


    contadorCarrinho.textContent =
        quantidade;

    totalCarrinho.textContent =
        formatarPreco(total);


    finalizarPedido.disabled =
        carrinho.length === 0;


    // ======================================
    // FORMULÁRIO
    // ======================================

    if (
        carrinho.length > 0 &&
        !document.getElementById(
            "dadosPedido"
        )
    ) {

        criarFormularioPedido();

    }


    if (carrinho.length === 0) {

        listaCarrinho.innerHTML = `

            <div class="carrinho-vazio">

                <div class="icone-vazio">
                    🛒
                </div>

                <h3>
                    Seu carrinho está vazio
                </h3>

                <p>
                    Adicione pratos para começar seu pedido.
                </p>

                <button
                    class="botao-continuar"
                    type="button"
                    onclick="fecharCarrinho()"
                >
                    Ver cardápio
                </button>

            </div>

        `;


        const formulario =
            document.getElementById(
                "dadosPedido"
            );


        if (formulario) {

            formulario.remove();

        }


        return;

    }


    // ======================================
    // ITENS
    // ======================================

    listaCarrinho.innerHTML =
        carrinho
            .map(item => {

                const subtotal =
                    Number(item.preco) *
                    Number(item.quantidade);


                return `

                    <div class="item-carrinho">

                        <div class="item-info">

                            <h3>
                                ${escaparHTML(
                                    item.nome
                                )}
                            </h3>

                            <p>
                                ${formatarPreco(
                                    item.preco
                                )}
                                cada
                            </p>

                        </div>


                        <div class="item-direita">

                            <div class="controle-quantidade">

                                <button
                                    type="button"
                                    onclick="diminuirQuantidade(${item.id})"
                                >
                                    −
                                </button>

                                <strong>
                                    ${item.quantidade}
                                </strong>

                                <button
                                    type="button"
                                    onclick="aumentarQuantidade(${item.id})"
                                >
                                    +
                                </button>

                            </div>


                            <strong class="subtotal">
                                ${formatarPreco(
                                    subtotal
                                )}
                            </strong>

                        </div>

                    </div>

                `;

            })
            .join("");


    // ======================================
    // GARANTIR FORMULÁRIO
    // ======================================

    if (
        !document.getElementById(
            "dadosPedido"
        )
    ) {

        criarFormularioPedido();

    }

}


// ==========================================
// ABRIR CARRINHO
// ==========================================

function abrirCarrinho() {

    carrinhoElemento.classList.add(
        "aberto"
    );

    overlayCarrinho.classList.add(
        "aberto"
    );

    document.body.classList.add(
        "sem-scroll"
    );


    atualizarCarrinho();

}


// ==========================================
// FECHAR CARRINHO
// ==========================================

function fecharCarrinho() {

    carrinhoElemento.classList.remove(
        "aberto"
    );

    overlayCarrinho.classList.remove(
        "aberto"
    );

    document.body.classList.remove(
        "sem-scroll"
    );

}


// ==========================================
// LIMPAR
// ==========================================

function limparCarrinho() {

    if (carrinho.length === 0) {

        mostrarToast(
            "O carrinho já está vazio."
        );

        return;

    }


    const confirmar =
        confirm(
            "Deseja realmente limpar seu pedido?"
        );


    if (!confirmar) return;


    carrinho = [];


    salvarCarrinho();

    atualizarCarrinho();


    mostrarToast(
        "Pedido limpo."
    );

}


// ==========================================
// ENVIAR PEDIDO
// ==========================================

function enviarPedidoWhatsApp() {

    if (carrinho.length === 0) {

        mostrarToast(
            "Seu pedido está vazio."
        );

        return;

    }


    // ======================================
    // TIPO
    // ======================================

    const tipoSelecionado =
        document.querySelector(
            'input[name="tipoPedido"]:checked'
        );


    if (!tipoSelecionado) {

        mostrarToast(
            "Escolha Delivery ou Buscar no estabelecimento."
        );

        return;

    }


    const tipoPedido =
        tipoSelecionado.value;


    // ======================================
    // DELIVERY
    // ======================================

    if (
        tipoPedido === "Delivery"
    ) {

        if (
            !enderecoCliente ||
            !numeroCliente ||
            !bairroCliente
        ) {

            mostrarToast(
                "Preencha o endereço de entrega."
            );

            return;

        }


        if (
            !enderecoCliente.value.trim() ||
            !numeroCliente.value.trim() ||
            !bairroCliente.value.trim()
        ) {

            mostrarToast(
                "Preencha o endereço de entrega."
            );

            return;

        }

    }


    // ======================================
    // PAGAMENTO
    // ======================================

    if (!metodoPagamento) {

        mostrarToast(
            "Escolha a forma de pagamento."
        );

        return;

    }


    const pagamento =
        metodoPagamento.value;


    if (!pagamento) {

        mostrarToast(
            "Escolha a forma de pagamento."
        );

        return;

    }


    // ======================================
    // TROCO
    // ======================================

    if (
        pagamento === "Dinheiro" &&
        precisaTroco &&
        precisaTroco.checked
    ) {

        if (
            !trocoPara.value ||
            Number(trocoPara.value) <= 0
        ) {

            mostrarToast(
                "Informe para quanto precisa de troco."
            );

            return;

        }

    }


    // ======================================
    // MENSAGEM
    // ======================================

    let mensagem =
        "🍽️ *NOVO PEDIDO*\n\n";


    mensagem +=
        "Olá! Gostaria de fazer este pedido:\n\n";


    // ======================================
    // ITENS
    // ======================================

    carrinho.forEach(item => {

        const subtotal =
            Number(item.preco) *
            Number(item.quantidade);


        mensagem +=
            `🍴 *${item.nome}*\n`;

        mensagem +=
            `Quantidade: ${item.quantidade}\n`;

        mensagem +=
            `Valor: ${formatarPreco(
                subtotal
            )}\n\n`;

    });


    // ======================================
    // TOTAL
    // ======================================

    const total =
        valorTotalCarrinho();


    mensagem +=
        "━━━━━━━━━━━━━━━━━━\n";

    mensagem +=
        `💰 *TOTAL: ${formatarPreco(
            total
        )}*\n\n`;


    // ======================================
    // ENTREGA
    // ======================================

    mensagem +=
        "📦 *COMO VAI RECEBER*\n";


    if (
        tipoPedido === "Delivery"
    ) {

        mensagem +=
            "🚚 Delivery\n\n";


        mensagem +=
            "📍 *ENDEREÇO DE ENTREGA*\n";


        mensagem +=
            `Rua: ${enderecoCliente.value.trim()}\n`;


        mensagem +=
            `Número: ${numeroCliente.value.trim()}\n`;


        mensagem +=
            `Bairro: ${bairroCliente.value.trim()}\n`;


        if (
            complementoCliente &&
            complementoCliente.value.trim()
        ) {

            mensagem +=
                `Complemento: ${
                    complementoCliente.value.trim()
                }\n`;

        }


        mensagem += "\n";

    } else {

        mensagem +=
            "🏪 Buscar no estabelecimento\n\n";

    }


    // ======================================
    // PAGAMENTO
    // ======================================

    mensagem +=
        "💰 *FORMA DE PAGAMENTO*\n";


    // ======================================
    // PIX
    // ======================================

    if (
        pagamento === "PIX"
    ) {

        mensagem +=
            "📱 PIX\n";


        if (CHAVE_PIX) {

            mensagem +=
                `🔑 Chave PIX: ${CHAVE_PIX}\n`;

        }


        mensagem +=
            "Cliente escolheu pagar via PIX.\n\n";

    }


    // ======================================
    // CARTÃO
    // ======================================

    if (
        pagamento === "Cartão"
    ) {

        mensagem +=
            "💳 Cartão\n";


        if (
            tipoPedido === "Delivery" &&
            levarMaquininha &&
            levarMaquininha.checked
        ) {

            mensagem +=
                "📱 LEVAR MAQUININHA PARA A ENTREGA\n";

        }


        mensagem += "\n";

    }


    // ======================================
    // DINHEIRO
    // ======================================

    if (
        pagamento === "Dinheiro"
    ) {

        mensagem +=
            "💵 Dinheiro\n";


        if (
            precisaTroco &&
            precisaTroco.checked
        ) {

            const valorTroco =
                Number(
                    trocoPara.value
                );


            mensagem +=
                `💰 Troco para: ${
                    formatarPreco(
                        valorTroco
                    )
                }\n`;

        } else {

            mensagem +=
                "Não precisa de troco.\n";

        }


        mensagem += "\n";

    }


    // ======================================
    // FINAL
    // ======================================

    mensagem +=
        "Aguardo a confirmação do pedido. 😊";


    // ======================================
    // WHATSAPP
    // ======================================

    const url =
        `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
            mensagem
        )}`;


    window.open(
        url,
        "_blank"
    );

}


// ==========================================
// EVENTOS
// ==========================================

abrirCarrinhoBtn.addEventListener(
    "click",
    abrirCarrinho
);

fecharCarrinhoBtn.addEventListener(
    "click",
    fecharCarrinho
);

overlayCarrinho.addEventListener(
    "click",
    fecharCarrinho
);

limparCarrinhoBtn.addEventListener(
    "click",
    limparCarrinho
);

finalizarPedido.addEventListener(
    "click",
    enviarPedidoWhatsApp
);

continuarComprando.addEventListener(
    "click",
    fecharCarrinho
);


// ==========================================
// CARREGAR PRATOS
// ==========================================

async function carregarPratos() {

    try {

        listaPratos.innerHTML = `

            <div class="loading">

                <div class="spinner"></div>

                <p>
                    Carregando cardápio...
                </p>

            </div>

        `;


        const resposta =
            await fetch(
                `${API_URL}/estabelecimentos/${ESTABELECIMENTO_ID}/pratos`
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro HTTP ${resposta.status}`
            );

        }


        pratos =
            await resposta.json();


        if (!Array.isArray(pratos)) {

            throw new Error(
                "A API não retornou uma lista de pratos."
            );

        }


        criarCategorias();

        mostrarPratos();


    } catch (erro) {

        console.error(
            "Erro ao carregar pratos:",
            erro
        );


        listaPratos.innerHTML = `

            <div class="loading">

                <div class="erro-icone">
                    ⚠️
                </div>

                <h3>
                    Não foi possível carregar o cardápio.
                </h3>

                <small>
                    ${escaparHTML(
                        erro.message
                    )}
                </small>

            </div>

        `;

    }

}


// ==========================================
// CATEGORIAS
// ==========================================

function criarCategorias() {

    const nomes = [

        "Todos",
        "Hambúrgueres",
        "Pizzas",
        "Porções",
        "Cachorros-quentes",
        "Frangos",
        "Carnes",
        "Massas",
        "Saladas",
        "Pratos Executivos",
        "Lanches",
        "Sobremesas",
        "Bebidas",
        "Açaí",
        "Cafés",
        "Pastéis",
        "Geladinhos"

    ];


    const icones = {

        "Todos": "🍽️",

        "Hambúrgueres": "🍔",

        "Pizzas": "🍕",

        "Porções": "🍟",

        "Cachorros-quentes": "🌭",

        "Frangos": "🍗",

        "Carnes": "🥩",

        "Massas": "🍝",

        "Saladas": "🥗",

        "Pratos Executivos": "🍛",

        "Lanches": "🥪",

        "Sobremesas": "🍰",

        "Bebidas": "🥤",

        "Açaí": "🍨",

        "Cafés": "☕",

        "Pastéis": "🥟",

        "Geladinhos": "🍧"

    };


    categorias.innerHTML =
        nomes
            .map(nome => {

                return `

                    <button
                        class="categoria ${
                            nome === categoriaAtual
                                ? "ativa"
                                : ""
                        }"
                        data-categoria="${escaparHTML(
                            nome
                        )}"
                        type="button"
                    >

                        ${icones[nome] || "🍽️"}

                        ${escaparHTML(nome)}

                    </button>

                `;

            })
            .join("");


    categorias
        .querySelectorAll(".categoria")
        .forEach(botao => {

            botao.addEventListener(
                "click",
                () => {

                    categorias
                        .querySelectorAll(".categoria")
                        .forEach(item => {

                            item.classList.remove(
                                "ativa"
                            );

                        });


                    botao.classList.add(
                        "ativa"
                    );


                    categoriaAtual =
                        botao.dataset.categoria;


                    mostrarPratos();

                }
            );

        });

}


// ==========================================
// MOSTRAR PRATOS
// ==========================================

function mostrarPratos() {

    const busca =
        pesquisa.value
            .toLowerCase()
            .trim();


    const filtrados =
        pratos.filter(prato => {

            const categoriaOK =
                categoriaAtual === "Todos" ||
                prato.categoria === categoriaAtual;


            const buscaOK =
                String(
                    prato.nome || ""
                )
                    .toLowerCase()
                    .includes(busca)

                ||

                String(
                    prato.descricao || ""
                )
                    .toLowerCase()
                    .includes(busca);


            return categoriaOK && buscaOK;

        });


    contador.textContent =
        `${filtrados.length} ${
            filtrados.length === 1
                ? "prato encontrado"
                : "pratos encontrados"
        }`;


    if (filtrados.length === 0) {

        listaPratos.innerHTML = `

            <div class="loading">

                <div class="erro-icone">
                    🍽️
                </div>

                <h3>
                    Nenhum prato encontrado.
                </h3>

                <p>
                    Tente pesquisar outro prato.
                </p>

            </div>

        `;

        return;

    }


    listaPratos.innerHTML =
        filtrados
            .map(criarCard)
            .join("");

}


// ==========================================
// CARD
// ==========================================

function criarCard(prato) {

    const imagemHTML =
        prato.imagem

            ? `

                <img
                    src="${escaparHTML(
                        prato.imagem
                    )}"
                    alt="${escaparHTML(
                        prato.nome
                    )}"
                    loading="lazy"
                >

            `

            : `

                <div class="sem-imagem">
                    🍽️
                </div>

            `;


    return `

        <article class="card">

            <div class="card-imagem">

                ${imagemHTML}

                <span class="card-categoria">

                    ${escaparHTML(
                        prato.categoria
                    )}

                </span>

            </div>


            <div class="card-corpo">

                <div class="card-topo">

                    <h3>
                        ${escaparHTML(
                            prato.nome
                        )}
                    </h3>

                    <span class="preco">

                        ${formatarPreco(
                            prato.preco
                        )}

                    </span>

                </div>


                <p class="descricao">

                    ${escaparHTML(
                        prato.descricao ||
                        "Delicioso prato da casa."
                    )}

                </p>


                <button
                    class="btn-adicionar-pedido"
                    type="button"
                    onclick="adicionarAoCarrinho(${prato.id})"
                >

                    🛒 Adicionar ao pedido

                </button>

            </div>

        </article>

    `;

}


// ==========================================
// PESQUISA
// ==========================================

pesquisa.addEventListener(
    "input",
    mostrarPratos
);


// ==========================================
// ESC
// ==========================================

document.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key !== "Escape"
        ) {
            return;
        }


        if (
            carrinhoElemento.classList.contains(
                "aberto"
            )
        ) {

            fecharCarrinho();

        }

    }
);


// ==========================================
// INICIAR
// ==========================================

console.log(
    "Cliente carregado!"
);

console.log(
    "Estabelecimento:",
    ESTABELECIMENTO_ID
);

console.log(
    "Carrinho:",
    CHAVE_CARRINHO
);


atualizarCarrinho();

carregarPratos();

carregarConfiguracaoEstabelecimento();
