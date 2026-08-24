/* ========================================
   CONFIGURAÇÃO
======================================== */

const API_URL =
    "https://cardapio-restaurante-2cun.onrender.com";


/* ========================================
   VARIÁVEIS
======================================== */

let pratos = [];

let categoriaAtual = "Todos";

let carrinho = [];


/* ========================================
   ELEMENTOS
======================================== */

const listaPratos =
    document.getElementById("listaPratos");

const contador =
    document.getElementById("contador");

const pesquisa =
    document.getElementById("pesquisa");

const categorias =
    document.getElementById("categorias");

const abrirCarrinho =
    document.getElementById("abrirCarrinho");

const fecharCarrinho =
    document.getElementById("fecharCarrinho");

const carrinhoElemento =
    document.getElementById("carrinho");

const overlayCarrinho =
    document.getElementById("overlayCarrinho");

const listaCarrinho =
    document.getElementById("listaCarrinho");

const contadorCarrinho =
    document.getElementById("contadorCarrinho");

const totalCarrinho =
    document.getElementById("totalCarrinho");

const finalizarPedido =
    document.getElementById("finalizarPedido");

const limparCarrinho =
    document.getElementById("limparCarrinho");

const continuarComprando =
    document.getElementById("continuarComprando");


/* ========================================
   INICIAR
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        carregarPratos();

        configurarCarrinho();

    }
);


/* ========================================
   CARREGAR PRATOS
======================================== */

async function carregarPratos() {

    try {

        contador.textContent =
            "Carregando pratos...";


        const resposta =
            await fetch(
                `${API_URL}/pratos`
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao carregar pratos"
            );

        }


        pratos =
            await resposta.json();


        console.log(
            "Pratos carregados:",
            pratos
        );


        criarCategorias();

        mostrarPratos();


    } catch (erro) {

        console.error(
            "Erro:",
            erro
        );


        contador.textContent =
            "Não foi possível carregar os pratos.";


        listaPratos.innerHTML = `

            <div class="sem-resultados">

                <h3>
                    ⚠️ Erro ao carregar o cardápio
                </h3>

                <p>
                    Verifique se a API está funcionando.
                </p>

            </div>

        `;

    }

}


/* ========================================
   CATEGORIAS
======================================== */

function criarCategorias() {

    const listaCategorias = [

        "Todos",

        ...new Set(
            pratos
                .map(prato =>
                    prato.categoria
                )
                .filter(Boolean)
        )

    ];


    categorias.innerHTML = "";


    listaCategorias.forEach(
        categoria => {

            const botao =
                document.createElement("button");


            botao.textContent =
                categoria;


            if (
                categoria ===
                categoriaAtual
            ) {

                botao.classList.add(
                    "ativo"
                );

            }


            botao.addEventListener(
                "click",
                () => {

                    categoriaAtual =
                        categoria;


                    document
                        .querySelectorAll(
                            "#categorias button"
                        )
                        .forEach(
                            b =>
                                b.classList
                                    .remove(
                                        "ativo"
                                    )
                        );


                    botao.classList.add(
                        "ativo"
                    );


                    mostrarPratos();

                }
            );


            categorias.appendChild(
                botao
            );

        }
    );

}


/* ========================================
   MOSTRAR PRATOS
======================================== */

function mostrarPratos() {

    const textoPesquisa =
        pesquisa.value
            .toLowerCase()
            .trim();


    let pratosFiltrados =
        [...pratos];


    if (
        categoriaAtual !==
        "Todos"
    ) {

        pratosFiltrados =
            pratosFiltrados.filter(
                prato =>
                    prato.categoria ===
                    categoriaAtual
            );

    }


    if (textoPesquisa) {

        pratosFiltrados =
            pratosFiltrados.filter(
                prato => {

                    const nome =
                        String(
                            prato.nome || ""
                        ).toLowerCase();


                    const descricao =
                        String(
                            prato.descricao || ""
                        ).toLowerCase();


                    return (
                        nome.includes(
                            textoPesquisa
                        ) ||

                        descricao.includes(
                            textoPesquisa
                        )
                    );

                }
            );

    }


    contador.textContent =
        `${pratosFiltrados.length} prato(s) encontrado(s)`;


    listaPratos.innerHTML = "";


    if (
        pratosFiltrados.length === 0
    ) {

        listaPratos.innerHTML = `

            <div class="sem-resultados">

                <h3>
                    🔎 Nenhum prato encontrado
                </h3>

                <p>
                    Tente pesquisar outro prato.
                </p>

            </div>

        `;

        return;

    }


    pratosFiltrados.forEach(
        prato => {

            listaPratos.appendChild(
                criarCardPrato(prato)
            );

        }
    );

}


/* ========================================
   CRIAR CARD
======================================== */

function criarCardPrato(prato) {

    const card =
        document.createElement("article");


    card.className =
        "prato";


    const imagem =
        prato.imagem ||
        "https://via.placeholder.com/500x350?text=Sem+imagem";


    const preco =
        Number(
            prato.preco ||
            prato.valor ||
            0
        );


    card.innerHTML = `

        <img
            class="prato-imagem"
            src="${imagem}"
            alt="${prato.nome || "Prato"}"
            onerror="
                this.src='https://via.placeholder.com/500x350?text=Sem+imagem'
            "
        >


        <div class="prato-conteudo">

            <h3>
                ${prato.nome || "Prato sem nome"}
            </h3>


            <p class="prato-descricao">

                ${
                    prato.descricao ||
                    "Delicioso prato do nosso restaurante."
                }

            </p>


            ${
                prato.categoria
                ?
                `
                    <span class="prato-categoria">
                        ${prato.categoria}
                    </span>
                `
                :
                ""
            }


            <div class="prato-rodape">

                <span class="preco">

                    ${formatarPreco(preco)}

                </span>


                <button
                    class="botao-adicionar"
                    data-id="${prato.id}"
                >

                    + Adicionar

                </button>

            </div>

        </div>

    `;


    const botao =
        card.querySelector(
            ".botao-adicionar"
        );


    botao.addEventListener(
        "click",
        () => {

            adicionarAoCarrinho(
                prato
            );

        }
    );


    return card;

}


/* ========================================
   PESQUISA
======================================== */

pesquisa.addEventListener(
    "input",
    mostrarPratos
);


/* ========================================
   CARRINHO
======================================== */

function configurarCarrinho() {

    abrirCarrinho.addEventListener(
        "click",
        abrirCarrinhoFunc
    );


    fecharCarrinho.addEventListener(
        "click",
        fecharCarrinhoFunc
    );


    overlayCarrinho.addEventListener(
        "click",
        fecharCarrinhoFunc
    );


    continuarComprando.addEventListener(
        "click",
        fecharCarrinhoFunc
    );


    limparCarrinho.addEventListener(
        "click",
        () => {

            if (
                carrinho.length === 0
            ) {

                return;

            }


            carrinho = [];


            atualizarCarrinho();

        }
    );


    finalizarPedido.addEventListener(
        "click",
        finalizarWhatsApp
    );


    atualizarCarrinho();

}


/* ========================================
   ABRIR CARRINHO
======================================== */

function abrirCarrinhoFunc() {

    carrinhoElemento.classList.add(
        "aberto"
    );


    overlayCarrinho.classList.add(
        "aberto"
    );


    document.body.style.overflow =
        "hidden";

}


/* ========================================
   FECHAR CARRINHO
======================================== */

function fecharCarrinhoFunc() {

    carrinhoElemento.classList.remove(
        "aberto"
    );


    overlayCarrinho.classList.remove(
        "aberto"
    );


    document.body.style.overflow =
        "";

}


/* ========================================
   ADICIONAR AO CARRINHO
======================================== */

function adicionarAoCarrinho(prato) {

    const id =
        Number(prato.id);


    const existente =
        carrinho.find(
            item =>
                Number(item.id) === id
        );


    if (existente) {

        existente.quantidade++;

    } else {

        carrinho.push({

            id: prato.id,

            nome: prato.nome,

            preco:
                Number(
                    prato.preco ||
                    prato.valor ||
                    0
                ),

            imagem:
                prato.imagem || "",

            quantidade: 1

        });

    }


    atualizarCarrinho();


    abrirCarrinhoFunc();

}


/* ========================================
   ATUALIZAR CARRINHO
======================================== */

function atualizarCarrinho() {

    const quantidadeTotal =
        carrinho.reduce(
            (total, item) =>
                total +
                item.quantidade,
            0
        );


    contadorCarrinho.textContent =
        quantidadeTotal;


    const valorTotal =
        carrinho.reduce(
            (total, item) =>
                total +
                (
                    item.preco *
                    item.quantidade
                ),
            0
        );


    totalCarrinho.textContent =
        formatarPreco(
            valorTotal
        );


    finalizarPedido.disabled =
        carrinho.length === 0;


    renderizarCarrinho();

}


/* ========================================
   RENDERIZAR CARRINHO
======================================== */

function renderizarCarrinho() {

    if (
        carrinho.length === 0
    ) {

        listaCarrinho.innerHTML = `

            <div
                id="carrinhoVazio"
                class="carrinho-vazio"
            >

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
                    id="continuarComprando"
                    class="botao-continuar"
                >

                    Ver cardápio

                </button>

            </div>

        `;


        document
            .getElementById(
                "continuarComprando"
            )
            .addEventListener(
                "click",
                fecharCarrinhoFunc
            );


        return;

    }


    listaCarrinho.innerHTML = "";


    carrinho.forEach(
        item => {

            const elemento =
                document.createElement(
                    "div"
                );


            elemento.className =
                "item-carrinho";


            const imagem =
                item.imagem ||
                "https://via.placeholder.com/100?text=Prato";


            elemento.innerHTML = `

                <img
                    class="item-carrinho-imagem"
                    src="${imagem}"
                    alt="${item.nome}"
                >


                <div
                    class="item-carrinho-info"
                >

                    <h4>
                        ${item.nome}
                    </h4>


                    <div
                        class="item-carrinho-preco"
                    >

                        ${formatarPreco(item.preco)}

                    </div>


                    <div
                        class="quantidade"
                    >

                        <button
                            data-acao="diminuir"
                            data-id="${item.id}"
                        >
                            −
                        </button>


                        <span>
                            ${item.quantidade}
                        </span>


                        <button
                            data-acao="aumentar"
                            data-id="${item.id}"
                        >
                            +
                        </button>

                    </div>

                </div>

            `;


            elemento
                .querySelectorAll(
                    "button"
                )
                .forEach(
                    botao => {

                        botao.addEventListener(
                            "click",
                            () => {

                                alterarQuantidade(
                                    item.id,
                                    botao.dataset.acao
                                );

                            }
                        );

                    }
                );


            listaCarrinho.appendChild(
                elemento
            );

        }
    );

}


/* ========================================
   ALTERAR QUANTIDADE
======================================== */

function alterarQuantidade(
    id,
    acao
) {

    const item =
        carrinho.find(
            produto =>
                Number(produto.id) ===
                Number(id)
        );


    if (!item) {

        return;

    }


    if (
        acao ===
        "aumentar"
    ) {

        item.quantidade++;

    }


    if (
        acao ===
        "diminuir"
    ) {

        item.quantidade--;

    }


    if (
        item.quantidade <= 0
    ) {

        carrinho =
            carrinho.filter(
                produto =>
                    Number(produto.id) !==
                    Number(id)
            );

    }


    atualizarCarrinho();

}


/* ========================================
   FINALIZAR WHATSAPP
======================================== */

function finalizarWhatsApp() {

    if (
        carrinho.length === 0
    ) {

        return;

    }


    let mensagem =
        "🍽️ *NOVO PEDIDO*%0A%0A";


    carrinho.forEach(
        item => {

            mensagem +=
                `• ${item.nome} x${item.quantidade} - ${formatarPreco(item.preco * item.quantidade)}%0A`;

        }
    );


    const total =
        carrinho.reduce(
            (soma, item) =>
                soma +
                (
                    item.preco *
                    item.quantidade
                ),
            0
        );


    mensagem +=
        `%0A💰 *Total: ${formatarPreco(total)}*`;


    /*
       TROQUE PELO NÚMERO DO RESTAURANTE

       Exemplo:
       5579999999999

       55 = Brasil
       79 = Sergipe
    */

    const numeroWhatsApp =
        "5579981021378";


    const url =
        `https://wa.me/${numeroWhatsApp}?text=${mensagem}`;


    window.open(
        url,
        "_blank"
    );

}


/* ========================================
   FORMATAR PREÇO
======================================== */

function formatarPreco(valor) {

    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

}
