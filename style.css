const API_URL = "https://cardapio-restaurante-2cun.onrender.com";

const WHATSAPP = "5579981021378";

let pratos = [];
let categoriaAtual = "Todos";
let pratoEditando = null;
let imagemAtual = "";

// ========================================
// CARRINHO
// ========================================

let carrinho = [];


// ========================================
// ELEMENTOS
// ========================================

const listaPratos = document.getElementById("listaPratos");
const contador = document.getElementById("contador");
const pesquisa = document.getElementById("pesquisa");

const modal = document.getElementById("modal");
const form = document.getElementById("formPrato");

const nome = document.getElementById("nome");
const descricao = document.getElementById("descricao");
const preco = document.getElementById("preco");
const imagem = document.getElementById("imagem");
const categoria = document.getElementById("categoria");

const preview = document.getElementById("preview");

const tituloFormulario =
    document.getElementById("tituloFormulario");

const textoBotao =
    document.getElementById("textoBotao");

const toast =
    document.getElementById("toast");


// ========================================
// CRIAR CARRINHO NA TELA
// ========================================

function criarInterfaceCarrinho() {

    if (document.getElementById("botaoCarrinho")) {
        return;
    }

    const botao = document.createElement("button");

    botao.id = "botaoCarrinho";
    botao.className = "botao-carrinho";

    botao.innerHTML = `
        <span class="icone-carrinho">🛒</span>

        <span>
            Meu pedido
        </span>

        <strong id="quantidadeCarrinho">
            0
        </strong>
    `;

    botao.onclick = abrirCarrinho;

    document.body.appendChild(botao);


    const modalCarrinho = document.createElement("div");

    modalCarrinho.id = "modalCarrinho";
    modalCarrinho.className = "modal-carrinho";

    modalCarrinho.innerHTML = `

        <div class="carrinho-conteudo">

            <button
                class="fechar-carrinho"
                onclick="fecharCarrinho()"
            >
                ×
            </button>

            <div class="carrinho-header">

                <div class="carrinho-titulo">

                    <span>
                        🛒
                    </span>

                    <div>

                        <h2>
                            Meu pedido
                        </h2>

                        <p>
                            Confira seus itens antes de enviar
                        </p>

                    </div>

                </div>

            </div>


            <div
                id="listaCarrinho"
                class="lista-carrinho"
            ></div>


            <div class="carrinho-footer">

                <div class="total-carrinho">

                    <span>
                        Total
                    </span>

                    <strong id="totalCarrinho">
                        R$ 0,00
                    </strong>

                </div>


                <button
                    class="btn-whatsapp"
                    onclick="enviarPedidoWhatsApp()"
                >
                    <span>
                        📱
                    </span>

                    Fazer pedido pelo WhatsApp
                </button>


                <button
                    class="btn-limpar-carrinho"
                    onclick="limparCarrinho()"
                >
                    🗑️ Limpar pedido
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modalCarrinho);


    modalCarrinho.addEventListener(
        "click",
        function (evento) {

            if (
                evento.target === modalCarrinho
            ) {

                fecharCarrinho();

            }

        }
    );
}


// ========================================
// ADICIONAR AO CARRINHO
// ========================================

function adicionarAoCarrinho(id) {

    const prato =
        pratos.find(
            item => Number(item.id) === Number(id)
        );

    if (!prato) {
        mostrarToast("Prato não encontrado.");
        return;
    }


    const itemExistente =
        carrinho.find(
            item =>
                Number(item.id) === Number(id)
        );


    if (itemExistente) {

        itemExistente.quantidade++;

    } else {

        carrinho.push({

            id: prato.id,

            nome: prato.nome,

            preco: Number(prato.preco),

            quantidade: 1

        });

    }


    atualizarCarrinho();

    mostrarToast(
        `${prato.nome} adicionado ao pedido!`
    );
}


// ========================================
// AUMENTAR QUANTIDADE
// ========================================

function aumentarQuantidade(id) {

    const item =
        carrinho.find(
            produto =>
                Number(produto.id) === Number(id)
        );

    if (!item) {
        return;
    }

    item.quantidade++;

    atualizarCarrinho();
}


// ========================================
// DIMINUIR QUANTIDADE
// ========================================

function diminuirQuantidade(id) {

    const item =
        carrinho.find(
            produto =>
                Number(produto.id) === Number(id)
        );

    if (!item) {
        return;
    }


    item.quantidade--;


    if (item.quantidade <= 0) {

        carrinho =
            carrinho.filter(
                produto =>
                    Number(produto.id) !== Number(id)
            );

    }


    atualizarCarrinho();
}


// ========================================
// ATUALIZAR CARRINHO
// ========================================

function atualizarCarrinho() {

    const quantidadeElemento =
        document.getElementById(
            "quantidadeCarrinho"
        );

    const lista =
        document.getElementById(
            "listaCarrinho"
        );

    const totalElemento =
        document.getElementById(
            "totalCarrinho"
        );


    const quantidadeTotal =
        carrinho.reduce(
            (total, item) =>
                total + item.quantidade,
            0
        );


    const valorTotal =
        carrinho.reduce(
            (total, item) =>
                total +
                item.preco *
                item.quantidade,
            0
        );


    if (quantidadeElemento) {

        quantidadeElemento.textContent =
            quantidadeTotal;

    }


    if (totalElemento) {

        totalElemento.textContent =
            formatarPreco(valorTotal);

    }


    if (!lista) {
        return;
    }


    if (carrinho.length === 0) {

        lista.innerHTML = `

            <div class="carrinho-vazio">

                <div>
                    🛒
                </div>

                <h3>
                    Seu pedido está vazio
                </h3>

                <p>
                    Adicione alguns pratos deliciosos
                    ao seu pedido.
                </p>

            </div>

        `;

        return;
    }


    lista.innerHTML =
        carrinho
            .map(item => {

                const subtotal =
                    item.preco *
                    item.quantidade;


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
                                    onclick="diminuirQuantidade(${item.id})"
                                >
                                    −
                                </button>

                                <strong>
                                    ${item.quantidade}
                                </strong>

                                <button
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


// ========================================
// ABRIR CARRINHO
// ========================================

function abrirCarrinho() {

    const modalCarrinho =
        document.getElementById(
            "modalCarrinho"
        );

    if (!modalCarrinho) {
        return;
    }

    modalCarrinho.classList.add(
        "aberto"
    );

    document.body.style.overflow =
        "hidden";

    atualizarCarrinho();
}


// ========================================
// FECHAR CARRINHO
// ========================================

function fecharCarrinho() {

    const modalCarrinho =
        document.getElementById(
            "modalCarrinho"
        );

    if (!modalCarrinho) {
        return;
    }

    modalCarrinho.classList.remove(
        "aberto"
    );

    document.body.style.overflow =
        "auto";
}


// ========================================
// LIMPAR CARRINHO
// ========================================

function limparCarrinho() {

    if (carrinho.length === 0) {
        return;
    }


    const confirmar =
        confirm(
            "Deseja realmente limpar o pedido?"
        );


    if (!confirmar) {
        return;
    }


    carrinho = [];

    atualizarCarrinho();

    mostrarToast(
        "Pedido limpo."
    );
}


// ========================================
// ENVIAR PARA WHATSAPP
// ========================================

function enviarPedidoWhatsApp() {

    if (carrinho.length === 0) {

        mostrarToast(
            "Adicione pelo menos um prato ao pedido."
        );

        return;
    }


    let mensagem =
        "🍽️ *NOVO PEDIDO*\n\n";


    mensagem +=
        "Olá! Gostaria de fazer este pedido:\n\n";


    carrinho.forEach(item => {

        const subtotal =
            item.preco *
            item.quantidade;


        mensagem +=
            `🍴 *${item.nome}*\n`;

        mensagem +=
            `Quantidade: ${item.quantidade}\n`;

        mensagem +=
            `Valor: ${formatarPreco(subtotal)}\n\n`;

    });


    const total =
        carrinho.reduce(
            (soma, item) =>
                soma +
                item.preco *
                item.quantidade,
            0
        );


    mensagem +=
        "━━━━━━━━━━━━━━━━━━\n";

    mensagem +=
        `💰 *TOTAL: ${formatarPreco(total)}*\n\n`;

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


// ========================================
// FORMATAR PREÇO
// ========================================

function formatarPreco(valor) {

    return Number(valor)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
}


// ========================================
// CARREGAR PRATOS
// ========================================

async function carregarPratos() {

    try {

        listaPratos.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Carregando cardápio...</p>
            </div>
        `;


        const resposta =
            await fetch(
                `${API_URL}/pratos`
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro HTTP ${resposta.status}`
            );

        }


        const tipo =
            resposta.headers.get(
                "content-type"
            ) || "";


        if (!tipo.includes("application/json")) {

            throw new Error(
                "A API não retornou JSON."
            );

        }


        pratos =
            await resposta.json();


        mostrarPratos();

    } catch (erro) {

        console.error(erro);


        listaPratos.innerHTML = `

            <div class="loading">

                <div style="font-size:50px;">
                    ⚠️
                </div>

                <p>
                    Erro ao carregar o cardápio.
                </p>

                <small>
                    ${escaparHTML(
                        erro.message
                    )}
                </small>

            </div>

        `;
    }
}


// ========================================
// MOSTRAR PRATOS
// ========================================

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
                (prato.nome || "")
                    .toLowerCase()
                    .includes(busca) ||

                (prato.descricao || "")
                    .toLowerCase()
                    .includes(busca);


            return categoriaOK &&
                buscaOK;
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

                <div style="font-size:50px;">
                    🍽️
                </div>

                <p>
                    Nenhum prato encontrado.
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


// ========================================
// CRIAR CARD
// ========================================

function criarCard(prato) {

    const precoFormatado =
        formatarPreco(
            prato.preco
        );


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
                        ${precoFormatado}
                    </span>

                </div>


                <p class="descricao">

                    ${escaparHTML(
                        prato.descricao ||
                        "Delicioso prato da casa."
                    )}

                </p>


                <!-- ADICIONAR PEDIDO -->

                <button
                    class="btn-adicionar-pedido"
                    onclick="adicionarAoCarrinho(${prato.id})"
                >

                    🛒 Adicionar ao pedido

                </button>


                <!-- ADMINISTRAÇÃO -->

                <div class="acoes">

                    <button
                        class="btn-editar"
                        onclick="editarPrato(${prato.id})"
                    >
                        ✏️ Editar
                    </button>


                    <button
                        class="btn-excluir"
                        onclick="excluirPrato(${prato.id})"
                    >
                        🗑️ Excluir
                    </button>

                </div>

            </div>

        </article>

    `;
}


// ========================================
// ABRIR FORMULÁRIO
// ========================================

function abrirFormulario() {

    limparFormulario();

    modal.classList.add(
        "aberto"
    );

    document.body.style.overflow =
        "hidden";


    setTimeout(() => {

        nome.focus();

    }, 100);
}


// ========================================
// FECHAR FORMULÁRIO
// ========================================

function fecharFormulario() {

    modal.classList.remove(
        "aberto"
    );

    document.body.style.overflow =
        "auto";

    limparFormulario();
}


// ========================================
// LIMPAR FORMULÁRIO
// ========================================

function limparFormulario() {

    form.reset();

    pratoEditando = null;

    imagemAtual = "";


    tituloFormulario.textContent =
        "Novo prato";


    textoBotao.textContent =
        "Cadastrar prato";


    preview.innerHTML = `

        <span>
            🖼️
        </span>

        <p>
            A imagem aparecerá aqui
        </p>

    `;
}


// ========================================
// ESCOLHER IMAGEM
// ========================================

imagem.addEventListener(
    "change",
    function () {

        const arquivo =
            imagem.files[0];


        if (!arquivo) {

            if (imagemAtual) {

                mostrarPreview(
                    imagemAtual
                );

            } else {

                preview.innerHTML = `

                    <span>
                        🖼️
                    </span>

                    <p>
                        A imagem aparecerá aqui
                    </p>

                `;

            }

            return;
        }


        if (
            arquivo.size >
            5 * 1024 * 1024
        ) {

            imagem.value = "";

            mostrarToast(
                "A imagem deve ter no máximo 5 MB."
            );

            return;
        }


        if (
            !arquivo.type.startsWith(
                "image/"
            )
        ) {

            imagem.value = "";

            mostrarToast(
                "Escolha um arquivo de imagem."
            );

            return;
        }


        const leitor =
            new FileReader();


        leitor.onload =
            function (evento) {

                imagemAtual =
                    evento.target.result;

                mostrarPreview(
                    imagemAtual
                );

            };


        leitor.onerror =
            function () {

                mostrarToast(
                    "Não foi possível carregar a imagem."
                );

            };


        leitor.readAsDataURL(
            arquivo
        );
    }
);


// ========================================
// PREVIEW
// ========================================

function mostrarPreview(src) {

    preview.innerHTML = `

        <img
            src="${escaparHTML(src)}"
            alt="Preview da imagem"
        >

    `;
}


// ========================================
// CADASTRAR / EDITAR
// ========================================

form.addEventListener(
    "submit",
    async function (evento) {

        evento.preventDefault();


        const dados = {

            nome:
                nome.value.trim(),

            descricao:
                descricao.value.trim(),

            preco:
                Number(preco.value),

            imagem:
                imagemAtual || "",

            categoria:
                categoria.value

        };


        if (
            !dados.nome ||
            !dados.preco ||
            !dados.categoria
        ) {

            mostrarToast(
                "Preencha os campos obrigatórios."
            );

            return;
        }


        try {

            textoBotao.textContent =
                "Salvando...";


            let resposta;


            if (pratoEditando) {

                resposta =
                    await fetch(
                        `${API_URL}/pratos/${pratoEditando}`,
                        {

                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    dados
                                )

                        }
                    );

            } else {

                resposta =
                    await fetch(
                        `${API_URL}/pratos`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    dados
                                )

                        }
                    );
            }


            const tipo =
                resposta.headers.get(
                    "content-type"
                ) || "";


            if (
                !tipo.includes(
                    "application/json"
                )
            ) {

                throw new Error(
                    "O servidor não retornou JSON."
                );

            }


            const resultado =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    resultado.erro ||
                    "Erro ao salvar prato."
                );

            }


            fecharFormulario();


            mostrarToast(
                resultado.mensagem
            );


            await carregarPratos();


        } catch (erro) {

            console.error(erro);


            textoBotao.textContent =
                pratoEditando
                    ? "Salvar alterações"
                    : "Cadastrar prato";


            mostrarToast(
                erro.message
            );

        }

    }
);


// ========================================
// EDITAR
// ========================================

async function editarPrato(id) {

    const prato =
        pratos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!prato) {
        return;
    }


    pratoEditando =
        id;


    imagemAtual =
        prato.imagem || "";


    nome.value =
        prato.nome || "";


    descricao.value =
        prato.descricao || "";


    preco.value =
        prato.preco || "";


    categoria.value =
        prato.categoria || "";


    imagem.value = "";


    tituloFormulario.textContent =
        "Editar prato";


    textoBotao.textContent =
        "Salvar alterações";


    if (imagemAtual) {

        mostrarPreview(
            imagemAtual
        );

    } else {

        preview.innerHTML = `

            <span>
                🖼️
            </span>

            <p>
                A imagem aparecerá aqui
            </p>

        `;

    }


    modal.classList.add(
        "aberto"
    );


    document.body.style.overflow =
        "hidden";
}


// ========================================
// EXCLUIR
// ========================================

async function excluirPrato(id) {

    const prato =
        pratos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!prato) {
        return;
    }


    if (
        !confirm(
            `Deseja excluir "${prato.nome}"?`
        )
    ) {

        return;
    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/pratos/${id}`,
                {
                    method: "DELETE"
                }
            );


        const tipo =
            resposta.headers.get(
                "content-type"
            ) || "";


        if (
            !tipo.includes(
                "application/json"
            )
        ) {

            throw new Error(
                "O servidor não retornou JSON."
            );

        }


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.erro ||
                "Erro ao excluir."
            );

        }


        mostrarToast(
            resultado.mensagem
        );


        await carregarPratos();


    } catch (erro) {

        console.error(erro);


        mostrarToast(
            erro.message
        );

    }
}


// ========================================
// PESQUISA
// ========================================

pesquisa.addEventListener(
    "input",
    mostrarPratos
);


// ========================================
// CATEGORIAS
// ========================================

document
    .querySelectorAll(".categoria")
    .forEach(botao => {

        botao.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll(".categoria")
                    .forEach(item => {

                        item.classList.remove(
                            "ativa"
                        );

                    });


                this.classList.add(
                    "ativa"
                );


                categoriaAtual =
                    this.dataset.categoria;


                mostrarPratos();

            }
        );

    });


// ========================================
// FECHAR MODAL
// ========================================

modal.addEventListener(
    "click",
    function (evento) {

        if (
            evento.target === modal
        ) {

            fecharFormulario();

        }

    }
);


// ========================================
// ESC
// ========================================

document.addEventListener(
    "keydown",
    function (evento) {

        if (
            evento.key === "Escape"
        ) {

            if (
                modal.classList.contains(
                    "aberto"
                )
            ) {

                fecharFormulario();

            }


            const modalCarrinho =
                document.getElementById(
                    "modalCarrinho"
                );


            if (
                modalCarrinho &&
                modalCarrinho.classList.contains(
                    "aberto"
                )
            ) {

                fecharCarrinho();

            }

        }

    }
);


// ========================================
// TOAST
// ========================================

function mostrarToast(mensagem) {

    toast.textContent =
        mensagem;


    toast.classList.add(
        "mostrar"
    );


    setTimeout(() => {

        toast.classList.remove(
            "mostrar"
        );

    }, 3000);
}


// ========================================
// SEGURANÇA
// ========================================

function escaparHTML(texto) {

    return String(texto)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// ========================================
// INICIAR
// ========================================

criarInterfaceCarrinho();

atualizarCarrinho();

carregarPratos();
