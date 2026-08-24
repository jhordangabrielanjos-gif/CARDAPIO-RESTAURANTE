const API_URL = "https://cardapio-restaurante-2cun.onrender.com";

let pratos = [];
let categoriaAtual = "Todos";
let pratoEditando = null;
let imagemAtual = "";

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
            await fetch(`${API_URL}/pratos`);

        if (!resposta.ok) {
            throw new Error(
                `Erro HTTP ${resposta.status}`
            );
        }

        const tipo =
            resposta.headers.get("content-type") || "";

        if (!tipo.includes("application/json")) {
            throw new Error(
                "A API não retornou JSON."
            );
        }

        pratos = await resposta.json();

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
                    ${escaparHTML(erro.message)}
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
// CARD
// ========================================

function criarCard(prato) {

    const precoFormatado =
        Number(prato.preco)
            .toLocaleString(
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

    modal.classList.add("aberto");

    document.body.style.overflow =
        "hidden";

    setTimeout(() => {
        nome.focus();
    }, 100);
}


// ========================================
// FECHAR
// ========================================

function fecharFormulario() {

    modal.classList.remove("aberto");

    document.body.style.overflow =
        "auto";

    limparFormulario();
}


// ========================================
// LIMPAR
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
        <span>🖼️</span>
        <p>A imagem aparecerá aqui</p>
    `;
}


// ========================================
// ESCOLHER IMAGEM
// ========================================

imagem.addEventListener(
    "change",
    function () {

        const arquivo = imagem.files[0];

        if (!arquivo) {

            if (imagemAtual) {

                mostrarPreview(imagemAtual);

            } else {

                preview.innerHTML = `
                    <span>🖼️</span>
                    <p>A imagem aparecerá aqui</p>
                `;
            }

            return;
        }


        // Limite de 5 MB
        if (arquivo.size > 5 * 1024 * 1024) {

            imagem.value = "";

            mostrarToast(
                "A imagem deve ter no máximo 5 MB."
            );

            return;
        }


        if (!arquivo.type.startsWith("image/")) {

            imagem.value = "";

            mostrarToast(
                "Escolha um arquivo de imagem."
            );

            return;
        }


        const leitor = new FileReader();


        leitor.onload = function (evento) {

            imagemAtual =
                evento.target.result;

            mostrarPreview(imagemAtual);

        };


        leitor.onerror = function () {

            mostrarToast(
                "Não foi possível carregar a imagem."
            );

        };


        leitor.readAsDataURL(arquivo);
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


            // ==================================
            // EDITAR
            // ==================================

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

            }

            // ==================================
            // CADASTRAR
            // ==================================

            else {

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


            if (!tipo.includes("application/json")) {

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
            item => item.id === id
        );


    if (!prato) {
        return;
    }


    pratoEditando = id;

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


    // Não tentamos colocar uma imagem
    // diretamente no input file.
    imagem.value = "";


    tituloFormulario.textContent =
        "Editar prato";


    textoBotao.textContent =
        "Salvar alterações";


    if (imagemAtual) {

        mostrarPreview(imagemAtual);

    } else {

        preview.innerHTML = `
            <span>🖼️</span>
            <p>A imagem aparecerá aqui</p>
        `;
    }


    modal.classList.add("aberto");

    document.body.style.overflow =
        "hidden";
}


// ========================================
// EXCLUIR
// ========================================

async function excluirPrato(id) {

    const prato =
        pratos.find(
            item => item.id === id
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


        if (!tipo.includes("application/json")) {

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
// SEGURANÇA
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
