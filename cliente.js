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
// WHATSAPP
// ==========================================

let WHATSAPP = "5579981021378";


// ==========================================
// VARIÁVEIS
// ==========================================

let pratos = [];

let categoriaAtual = "Todos";


// ==========================================
// CARRINHO
// ==========================================

// Carrinho separado por estabelecimento

const CHAVE_CARRINHO =
    `carrinhoRestaurante_${ESTABELECIMENTO_ID}`;

let carrinho =
    JSON.parse(
        localStorage.getItem(CHAVE_CARRINHO)
    ) || [];


// ==========================================
// ELEMENTOS
// ==========================================

const listaPratos =
    document.getElementById("listaPratos");

const contador =
    document.getElementById("contador");

const pesquisa =
    document.getElementById("pesquisa");

const categorias =
    document.getElementById("categorias");


// ==========================================
// ELEMENTOS DO CARRINHO
// ==========================================

const abrirCarrinhoBtn =
    document.getElementById("abrirCarrinho");

const fecharCarrinhoBtn =
    document.getElementById("fecharCarrinho");

const overlayCarrinho =
    document.getElementById("overlayCarrinho");

const carrinhoElemento =
    document.getElementById("carrinho");

const listaCarrinho =
    document.getElementById("listaCarrinho");

const contadorCarrinho =
    document.getElementById("contadorCarrinho");

const totalCarrinho =
    document.getElementById("totalCarrinho");

const finalizarPedido =
    document.getElementById("finalizarPedido");

const limparCarrinhoBtn =
    document.getElementById("limparCarrinho");

const continuarComprando =
    document.getElementById("continuarComprando");

const toast =
    document.getElementById("toast");


// ==========================================
// FORMATAÇÃO DE PREÇO
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

    toast.textContent = mensagem;

    toast.classList.add("mostrar");

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

                logo.textContent = "🍽️";

            }

        }


        // ======================================
        // COR DO ESTABELECIMENTO
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


            informacoes.innerHTML = html;

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
        // TÍTULO
        // ======================================

        document.title =
            estabelecimento.nome ||
            "Cardápio";


        console.log(
            "Estabelecimento carregado:",
            estabelecimento
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar estabelecimento:",
            erro
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
// QUANTIDADE TOTAL
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
// ADICIONAR AO CARRINHO
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

        return;
    }


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
// LIMPAR CARRINHO
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
// WHATSAPP
// ==========================================

function enviarPedidoWhatsApp() {

    if (carrinho.length === 0) {

        mostrarToast(
            "Seu pedido está vazio."
        );

        return;
    }


    let mensagem =
        "🍽️ *NOVO PEDIDO*\n\n";


    mensagem +=
        "Olá! Gostaria de fazer este pedido:\n\n";


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


    const total =
        valorTotalCarrinho();


    mensagem +=
        "━━━━━━━━━━━━━━━━━━\n";

    mensagem +=
        `💰 *TOTAL: ${formatarPreco(
            total
        )}*\n\n`;

    mensagem +=
        "Aguardo a confirmação do pedido. 😊";


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
// EVENTOS DO CARRINHO
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

        "Cafés"

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

        "Cafés": "☕"

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
// CRIAR CARD DO CLIENTE
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


                <!-- SOMENTE O BOTÃO DO CLIENTE -->

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
// TECLA ESC
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
