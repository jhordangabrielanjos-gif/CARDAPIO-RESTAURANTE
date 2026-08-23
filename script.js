// ========================================
// VARIÁVEIS
// ========================================

let pratos = [];

let categoriaAtual = "Todos";

let pratoEditando = null;


// ========================================
// ELEMENTOS
// ========================================

const listaPratos =
    document.getElementById("listaPratos");

const contador =
    document.getElementById("contador");

const pesquisa =
    document.getElementById("pesquisa");

const modal =
    document.getElementById("modal");

const form =
    document.getElementById("formPrato");

const nome =
    document.getElementById("nome");

const descricao =
    document.getElementById("descricao");

const preco =
    document.getElementById("preco");

const imagem =
    document.getElementById("imagem");

const categoria =
    document.getElementById("categoria");

const preview =
    document.getElementById("preview");

const tituloFormulario =
    document.getElementById("tituloFormulario");

const textoBotao =
    document.getElementById("textoBotao");

const toast =
    document.getElementById("toast");


// ========================================
// CARREGAR PRATOS
// ========================================

async function carregarPratos() {

    listaPratos.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Carregando cardápio...</p>
        </div>
    `;

    try {

        const resposta =
            await fetch("/pratos");

        if (!resposta.ok) {

            throw new Error(
                "Erro HTTP: " + resposta.status
            );
        }

        pratos = await resposta.json();

        mostrarPratos();

    } catch (erro) {

        console.error(erro);

        listaPratos.innerHTML = `
            <div class="loading">
                <p>❌ Erro ao carregar o cardápio.</p>
            </div>
        `;
    }
}


// ========================================
// MOSTRAR PRATOS
// ========================================

function mostrarPratos() {

    const textoBusca =
        pesquisa.value
            .toLowerCase()
            .trim();


    const filtrados =
        pratos.filter(prato => {

            const correspondeCategoria =
                categoriaAtual === "Todos" ||
                prato.categoria === categoriaAtual;


            const correspondeBusca =
                prato.nome
                    .toLowerCase()
                    .includes(textoBusca) ||

                (prato.descricao || "")
                    .toLowerCase()
                    .includes(textoBusca);


            return (
                correspondeCategoria &&
                correspondeBusca
            );
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
        filtrados.map(criarCard).join("");
}


// ========================================
// CRIAR CARD
// ========================================

function criarCard(prato) {

    const precoFormatado =
        Number(prato.preco).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );


    const imagemHTML =
        prato.imagem
            ? `
                <img
                    src="${escaparHTML(prato.imagem)}"
                    alt="${escaparHTML(prato.nome)}"
                    onerror="this.parentElement.innerHTML='<div class=sem-imagem>🍽️</div>'"
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
                    ${escaparHTML(prato.categoria)}
                </span>

            </div>


            <div class="card-corpo">

                <div class="card-topo">

                    <h3>
                        ${escaparHTML(prato.nome)}
                    </h3>

                    <span class="preco">
                        ${precoFormatado}
                    </span>

                </div>


                <p class="descricao">
                    ${
                        escaparHTML(
                            prato.descricao ||
                            "Delicioso prato da casa."
                        )
                    }
                </p>


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

    modal.classList.add("aberto");

    document.body.style.overflow = "hidden";

    limparFormulario();

    setTimeout(() => {
        nome.focus();
    }, 100);
}


// ========================================
// FECHAR FORMULÁRIO
// ========================================

function fecharFormulario() {

    modal.classList.remove("aberto");

    document.body.style.overflow = "auto";

    limparFormulario();
}


// ========================================
// LIMPAR FORMULÁRIO
// ========================================

function limparFormulario() {

    form.reset();

    pratoEditando = null;

    tituloFormulario.textContent =
        "Novo prato";

    textoBotao.textContent =
        "Cadastrar prato";

    preview.innerHTML = `
        <span>🖼️</span>
        <p>A imagem aparecerá aqui</p>
    `;
}


// ========================================
// PREVIEW DA IMAGEM
// ========================================

imagem.addEventListener(
    "input",
    atualizarPreview
);


function atualizarPreview() {

    const url =
        imagem.value.trim();


    if (!url) {

        preview.innerHTML = `
            <span>🖼️</span>
            <p>A imagem aparecerá aqui</p>
        `;

        return;
    }


    preview.innerHTML = `
        <img
            src="${escaparHTML(url)}"
            onerror="imagemInvalida()"
            alt="Preview"
        >
    `;
}


function imagemInvalida() {

    preview.innerHTML = `
        <span>⚠️</span>
        <p>Não foi possível carregar a imagem.</p>
    `;
}


// ========================================
// CADASTRAR / EDITAR
// ========================================

form.addEventListener(
    "submit",
    async function(evento) {

        evento.preventDefault();


        const dados = {

            nome: nome.value.trim(),

            descricao:
                descricao.value.trim(),

            preco:
                Number(preco.value),

            imagem:
                imagem.value.trim(),

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

            let resposta;


            if (pratoEditando) {

                resposta =
                    await fetch(
                        `/pratos/${pratoEditando}`,
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
                        "/pratos",
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

            carregarPratos();

        } catch (erro) {

            console.error(erro);

            mostrarToast(
                erro.message
            );
        }
    }
);


// ========================================
// EDITAR PRATO
// ========================================

async function editarPrato(id) {

    const prato =
        pratos.find(
            item => item.id === id
        );


    if (!prato) {

        mostrarToast(
            "Prato não encontrado."
        );

        return;
    }


    pratoEditando = id;


    nome.value =
        prato.nome;

    descricao.value =
        prato.descricao || "";

    preco.value =
        prato.preco;

    imagem.value =
        prato.imagem || "";

    categoria.value =
        prato.categoria;


    tituloFormulario.textContent =
        "Editar prato";

    textoBotao.textContent =
        "Salvar alterações";


    atualizarPreview();


    modal.classList.add("aberto");

    document.body.style.overflow = "hidden";

    nome.focus();
}


// ========================================
// EXCLUIR PRATO
// ========================================

async function excluirPrato(id) {

    const prato =
        pratos.find(
            item => item.id === id
        );


    if (!prato) {
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
                `/pratos/${id}`,
                {
                    method: "DELETE"
                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.erro ||
                "Erro ao excluir prato."
            );
        }


        mostrarToast(
            resultado.mensagem
        );


        carregarPratos();

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
            function() {

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
// FECHAR MODAL CLICANDO FORA
// ========================================

modal.addEventListener(
    "click",
    function(evento) {

        if (
            evento.target === modal
        ) {

            fecharFormulario();
        }
    }
);


// ========================================
// ESC FECHA MODAL
// ========================================

document.addEventListener(
    "keydown",
    function(evento) {

        if (
            evento.key === "Escape" &&
            modal.classList.contains("aberto")
        ) {

            fecharFormulario();
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
// SEGURANÇA HTML
// ========================================

function escaparHTML(texto) {

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ========================================
// INICIAR
// ========================================

carregarPratos();
