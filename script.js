const API_URL = "";

const WHATSAPP = "5579981021378";

// ========================================
// VARIÁVEIS
// ========================================

let pratos = [];
let categoriaAtual = "Todos";
let pratoEditando = null;
let imagemAtual = "";

let carrinho = JSON.parse(
    localStorage.getItem("carrinhoRestaurante")
) || [];


// ========================================
// ELEMENTOS
// ========================================

const listaPratos = document.getElementById("listaPratos");
const contador = document.getElementById("contador");
const pesquisa = document.getElementById("pesquisa");
const categorias = document.getElementById("categorias");

// CARRINHO

const abrirCarrinhoBtn = document.getElementById("abrirCarrinho");
const fecharCarrinhoBtn = document.getElementById("fecharCarrinho");
const overlayCarrinho = document.getElementById("overlayCarrinho");
const carrinhoElemento = document.getElementById("carrinho");
const listaCarrinho = document.getElementById("listaCarrinho");
const contadorCarrinho = document.getElementById("contadorCarrinho");
const totalCarrinho = document.getElementById("totalCarrinho");
const finalizarPedido = document.getElementById("finalizarPedido");
const limparCarrinhoBtn = document.getElementById("limparCarrinho");

// MODAL

const modal = document.getElementById("modal");
const fecharModalBtn = document.getElementById("fecharModal");
const cancelarFormulario = document.getElementById("cancelarFormulario");
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
// VERIFICAR ELEMENTOS
// ========================================

console.log("JavaScript carregado!");

console.log("API:", API_URL);

console.log("Carrinho:", abrirCarrinhoBtn);

console.log("Novo prato:", document.getElementById("abrirFormulario"));


// ========================================
// FORMATAÇÃO
// ========================================

function formatarPreco(valor) {

    return Number(valor).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


// ========================================
// SEGURANÇA HTML
// ========================================

function escaparHTML(texto) {

    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ========================================
// TOAST
// ========================================

function mostrarToast(mensagem) {

    if (!toast) return;

    toast.textContent = mensagem;

    toast.classList.add("mostrar");

    clearTimeout(mostrarToast.timer);

    mostrarToast.timer = setTimeout(() => {

        toast.classList.remove("mostrar");

    }, 3000);
}


// ========================================
// ================= CARRINHO =============
// ========================================

// SALVAR

function salvarCarrinho() {

    localStorage.setItem(
        "carrinhoRestaurante",
        JSON.stringify(carrinho)
    );
}


// CONTAGEM

function quantidadeTotalCarrinho() {

    return carrinho.reduce(
        (total, item) => {

            return total + Number(item.quantidade || 0);

        },
        0
    );
}


// TOTAL

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


// ========================================
// ADICIONAR AO CARRINHO
// ========================================

function adicionarAoCarrinho(id) {

    const prato = pratos.find(
        item => Number(item.id) === Number(id)
    );

    if (!prato) {

        mostrarToast("Prato não encontrado.");

        return;
    }


    const existente = carrinho.find(
        item => Number(item.id) === Number(id)
    );


    if (existente) {

        existente.quantidade++;

    } else {

        carrinho.push({

            id: prato.id,

            nome: prato.nome,

            preco: Number(prato.preco),

            quantidade: 1

        });
    }


    salvarCarrinho();

    atualizarCarrinho();

    mostrarToast(
        `${prato.nome} foi adicionado ao pedido!`
    );
}


// ========================================
// AUMENTAR QUANTIDADE
// ========================================

function aumentarQuantidade(id) {

    const item = carrinho.find(
        produto => Number(produto.id) === Number(id)
    );

    if (!item) return;

    item.quantidade++;

    salvarCarrinho();

    atualizarCarrinho();
}


// ========================================
// DIMINUIR QUANTIDADE
// ========================================

function diminuirQuantidade(id) {

    const item = carrinho.find(
        produto => Number(produto.id) === Number(id)
    );

    if (!item) return;

    item.quantidade--;


    if (item.quantidade <= 0) {

        carrinho = carrinho.filter(
            produto =>
                Number(produto.id) !== Number(id)
        );
    }


    salvarCarrinho();

    atualizarCarrinho();
}


// ========================================
// ATUALIZAR CARRINHO
// ========================================

function atualizarCarrinho() {

    const quantidade = quantidadeTotalCarrinho();

    const total = valorTotalCarrinho();


    contadorCarrinho.textContent = quantidade;

    totalCarrinho.textContent = formatarPreco(total);

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


    listaCarrinho.innerHTML = carrinho
        .map(item => {

            const subtotal =
                Number(item.preco) *
                Number(item.quantidade);


            return `

                <div class="item-carrinho">

                    <div class="item-info">

                        <h3>
                            ${escaparHTML(item.nome)}
                        </h3>

                        <p>
                            ${formatarPreco(item.preco)}
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
                            ${formatarPreco(subtotal)}
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

    carrinhoElemento.classList.add("aberto");

    overlayCarrinho.classList.add("aberto");

    document.body.classList.add("sem-scroll");

    atualizarCarrinho();
}


// ========================================
// FECHAR CARRINHO
// ========================================

function fecharCarrinho() {

    carrinhoElemento.classList.remove("aberto");

    overlayCarrinho.classList.remove("aberto");

    document.body.classList.remove("sem-scroll");
}


// ========================================
// LIMPAR CARRINHO
// ========================================

function limparCarrinho() {

    if (carrinho.length === 0) {

        mostrarToast("O carrinho já está vazio.");

        return;
    }


    const confirmar = confirm(
        "Deseja realmente limpar seu pedido?"
    );


    if (!confirmar) return;


    carrinho = [];

    salvarCarrinho();

    atualizarCarrinho();

    mostrarToast("Pedido limpo.");
}


// ========================================
// WHATSAPP
// ========================================

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
            `Valor: ${formatarPreco(subtotal)}\n\n`;

    });


    const total =
        valorTotalCarrinho();


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
// EVENTOS DO CARRINHO
// ========================================

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


// ========================================
// ================= PRATOS ===============
// ========================================


// ========================================
// CARREGAR PRATOS
// ========================================

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


        const resposta = await fetch(
            `${API_URL}/pratos`
        );


        if (!resposta.ok) {

            throw new Error(
                `Erro HTTP ${resposta.status}`
            );
        }


        pratos = await resposta.json();


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
                    ${escaparHTML(erro.message)}
                </small>

            </div>

        `;
    }
}


// ========================================
// CATEGORIAS
// ========================================

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
        nomes.map(nome => {

            return `

                <button
                    class="categoria ${
                        nome === categoriaAtual
                            ? "ativa"
                            : ""
                    }"
                    data-categoria="${escaparHTML(nome)}"
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
                String(prato.nome || "")
                    .toLowerCase()
                    .includes(busca) ||

                String(prato.descricao || "")
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


// ========================================
// CRIAR CARD
// ========================================

function criarCard(prato) {

    const imagemHTML =
        prato.imagem
            ? `

                <img
                    src="${escaparHTML(prato.imagem)}"
                    alt="${escaparHTML(prato.nome)}"
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


                <div class="acoes">

                    <button
                        class="btn-editar"
                        type="button"
                        onclick="editarPrato(${prato.id})"
                    >

                        ✏️ Editar

                    </button>


                    <button
                        class="btn-excluir"
                        type="button"
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
// ================= MODAL ================
// ========================================


// ========================================
// ABRIR FORMULÁRIO
// ========================================

function abrirFormulario() {

    limparFormulario();


    modal.classList.add("aberto");

    document.body.classList.add(
        "sem-scroll"
    );


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

    document.body.classList.remove(
        "sem-scroll"
    );

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
// EVENTO NOVO PRATO
// ========================================

const abrirFormularioBtn =
    document.getElementById(
        "abrirFormulario"
    );


abrirFormularioBtn.addEventListener(
    "click",
    abrirFormulario
);


fecharModalBtn.addEventListener(
    "click",
    fecharFormulario
);


cancelarFormulario.addEventListener(
    "click",
    fecharFormulario
);


// ========================================
// FECHAR MODAL CLICANDO FORA
// ========================================

modal.addEventListener(
    "click",
    evento => {

        if (
            evento.target === modal
        ) {

            fecharFormulario();

        }

    }
);


// ========================================
// IMAGEM
// ========================================

imagem.addEventListener(
    "change",
    evento => {

        const arquivo =
            evento.target.files[0];


        if (!arquivo) {

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
                "Escolha uma imagem válida."
            );

            return;
        }


        const leitor =
            new FileReader();


        leitor.onload =
            eventoLeitura => {

                imagemAtual =
                    eventoLeitura.target.result;


                mostrarPreview(
                    imagemAtual
                );

            };


        leitor.onerror =
            () => {

                mostrarToast(
                    "Erro ao carregar imagem."
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
    async evento => {

        evento.preventDefault();


        const precoNumerico =
            Number(preco.value);


        if (
            !nome.value.trim() ||
            !categoria.value.trim() ||
            !preco.value ||
            precoNumerico < 0
        ) {

            mostrarToast(
                "Preencha corretamente os campos obrigatórios."
            );

            return;
        }


        const dados = {

            nome:
                nome.value.trim(),

            descricao:
                descricao.value.trim(),

            preco:
                precoNumerico,

            imagem:
                imagemAtual || "",

            categoria:
                categoria.value.trim()

        };


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
                                JSON.stringify(dados)

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
                                JSON.stringify(dados)

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
                resultado.mensagem ||
                "Prato salvo com sucesso!"
            );


            await carregarPratos();


        } catch (erro) {

            console.error(
                "Erro ao salvar:",
                erro
            );


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
// EDITAR PRATO
// ========================================

function editarPrato(id) {

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


    pratoEditando =
        prato.id;


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


    document.body.classList.add(
        "sem-scroll"
    );
}


// ========================================
// EXCLUIR PRATO
// ========================================

async function excluirPrato(id) {

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


    const confirmar =
        confirm(
            `Deseja excluir "${prato.nome}"?`
        );


    if (!confirmar) {

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
                "Erro ao excluir prato."
            );
        }


        carrinho =
            carrinho.filter(
                item =>
                    Number(item.id) !==
                    Number(id)
            );


        salvarCarrinho();

        atualizarCarrinho();


        mostrarToast(
            resultado.mensagem ||
            "Prato excluído com sucesso!"
        );


        await carregarPratos();


    } catch (erro) {

        console.error(
            "Erro ao excluir:",
            erro
        );


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
// TECLA ESC
// ========================================

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


        if (
            modal.classList.contains(
                "aberto"
            )
        ) {

            fecharFormulario();

        }

    }
);


// ========================================
// INICIAR
// ========================================

atualizarCarrinho();

carregarPratos();
