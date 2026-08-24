const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();


// ==========================================
// CONFIGURAÇÕES
// ==========================================

app.use(cors());


// Permite receber imagens Base64 maiores
app.use(express.json({
    limit: "10mb"
}));


// ==========================================
// ARQUIVOS DO SITE
// ==========================================

app.use(express.static(__dirname));


app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


// ==========================================
// BANCO DE DADOS
// ==========================================

const dbPath =
    path.join(__dirname, "banco.db");


const db =
    new sqlite3.Database(
        dbPath,
        (erro) => {

            if (erro) {

                console.error(
                    "Erro ao conectar ao banco:",
                    erro.message
                );

            } else {

                console.log(
                    "Banco de dados conectado!"
                );

            }

        }
    );


// ==========================================
// CRIAR TABELA
// ==========================================

db.run(`
    CREATE TABLE IF NOT EXISTS pratos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        preco REAL NOT NULL,
        imagem TEXT,
        categoria TEXT NOT NULL
    )
`, (erro) => {

    if (erro) {

        console.error(
            "Erro ao criar tabela:",
            erro.message
        );

    } else {

        console.log(
            "Tabela de pratos pronta!"
        );

    }

});


// ==========================================
// TESTE DA API
// ==========================================

app.get("/api", (req, res) => {

    res.json({

        sucesso: true,

        mensagem:
            "API do restaurante funcionando!"

    });

});


// ==========================================
// LISTAR PRATOS
// ==========================================

app.get("/pratos", (req, res) => {

    db.all(
        "SELECT * FROM pratos ORDER BY id DESC",
        [],
        (erro, resultados) => {

            if (erro) {

                console.error(
                    "Erro ao buscar pratos:",
                    erro
                );

                return res.status(500).json({

                    sucesso: false,

                    erro: erro.message

                });

            }


            res.json(resultados);

        }
    );

});


// ==========================================
// CADASTRAR PRATO
// ==========================================

app.post("/pratos", (req, res) => {

    const {
        nome,
        descricao,
        preco,
        imagem,
        categoria
    } = req.body;


    // -------------------------------
    // VALIDAR NOME
    // -------------------------------

    if (
        !nome ||
        !nome.trim()
    ) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "Informe o nome do prato."

        });

    }


    // -------------------------------
    // VALIDAR PREÇO
    // -------------------------------

    if (
        preco === undefined ||
        preco === ""
    ) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "Informe o preço."

        });

    }


    const precoNumerico =
        Number(preco);


    if (
        isNaN(precoNumerico)
    ) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "Preço inválido."

        });

    }


    // -------------------------------
    // VALIDAR CATEGORIA
    // -------------------------------

    if (
        !categoria ||
        !categoria.trim()
    ) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "Informe a categoria."

        });

    }


    // -------------------------------
    // VALIDAR IMAGEM
    // -------------------------------

    let imagemFinal =
        imagem || "";


    if (
        imagemFinal &&
        !imagemFinal.startsWith("data:image/")
    ) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "Imagem inválida."

        });

    }


    // -------------------------------
    // SQL
    // -------------------------------

    const sql = `
        INSERT INTO pratos
        (
            nome,
            descricao,
            preco,
            imagem,
            categoria
        )
        VALUES (?, ?, ?, ?, ?)
    `;


    db.run(
        sql,

        [
            nome.trim(),

            descricao || "",

            precoNumerico,

            imagemFinal,

            categoria.trim()
        ],

        function (erro) {

            if (erro) {

                console.error(
                    "Erro ao cadastrar:",
                    erro
                );

                return res.status(500).json({

                    sucesso: false,

                    erro:
                        erro.message

                });

            }


            res.status(201).json({

                sucesso: true,

                mensagem:
                    "Prato cadastrado com sucesso!",

                prato: {

                    id:
                        this.lastID,

                    nome:
                        nome.trim(),

                    descricao:
                        descricao || "",

                    preco:
                        precoNumerico,

                    imagem:
                        imagemFinal,

                    categoria:
                        categoria.trim()

                }

            });

        }
    );

});


// ==========================================
// EDITAR PRATO
// ==========================================

app.put("/pratos/:id", (req, res) => {

    const id =
        Number(req.params.id);


    const {
        nome,
        descricao,
        preco,
        imagem,
        categoria
    } = req.body;


    // -------------------------------
    // VALIDAR NOME
    // -------------------------------

    if (
        !nome ||
        !nome.trim()
    ) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "Informe o nome do prato."

        });

    }


    // -------------------------------
    // VALIDAR CATEGORIA
    // -------------------------------

    if (
        !categoria ||
        !categoria.trim()
    ) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "Informe a categoria."

        });

    }


    // -------------------------------
    // VALIDAR PREÇO
    // -------------------------------

    const precoNumerico =
        Number(preco);


    if (
        isNaN(precoNumerico)
    ) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "Preço inválido."

        });

    }


    // -------------------------------
    // IMAGEM
    // -------------------------------

    let imagemFinal =
        imagem || "";


    if (
        imagemFinal &&
        !imagemFinal.startsWith("data:image/")
    ) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "Imagem inválida."

        });

    }


    // -------------------------------
    // SQL
    // -------------------------------

    const sql = `
        UPDATE pratos
        SET
            nome = ?,
            descricao = ?,
            preco = ?,
            imagem = ?,
            categoria = ?
        WHERE id = ?
    `;


    db.run(
        sql,

        [
            nome.trim(),

            descricao || "",

            precoNumerico,

            imagemFinal,

            categoria.trim(),

            id
        ],

        function (erro) {

            if (erro) {

                console.error(
                    "Erro ao editar:",
                    erro
                );

                return res.status(500).json({

                    sucesso: false,

                    erro:
                        erro.message

                });

            }


            if (
                this.changes === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    erro:
                        "Prato não encontrado."

                });

            }


            res.json({

                sucesso: true,

                mensagem:
                    "Prato atualizado com sucesso!"

            });

        }
    );

});


// ==========================================
// EXCLUIR PRATO
// ==========================================

app.delete("/pratos/:id", (req, res) => {

    const id =
        Number(req.params.id);


    db.run(

        "DELETE FROM pratos WHERE id = ?",

        [id],

        function (erro) {

            if (erro) {

                console.error(
                    "Erro ao excluir:",
                    erro
                );

                return res.status(500).json({

                    sucesso: false,

                    erro:
                        erro.message

                });

            }


            if (
                this.changes === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    erro:
                        "Prato não encontrado."

                });

            }


            res.json({

                sucesso: true,

                mensagem:
                    "Prato excluído com sucesso!"

            });

        }
    );

});


// ==========================================
// ROTA 404 DA API
// ==========================================

app.use(
    "/pratos",
    (req, res) => {

        res.status(404).json({

            sucesso: false,

            erro:
                "Rota de pratos não encontrada."

        });

    }
);


// ==========================================
// ERRO DE JSON MUITO GRANDE
// ==========================================

app.use(
    (erro, req, res, next) => {

        if (
            erro.type ===
            "entity.too.large"
        ) {

            return res.status(413).json({

                sucesso: false,

                erro:
                    "A imagem é muito grande. Escolha uma imagem menor."

            });

        }


        console.error(erro);


        res.status(500).json({

            sucesso: false,

            erro:
                "Erro interno do servidor."

        });

    }
);


// ==========================================
// INICIAR SERVIDOR
// ==========================================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Servidor rodando na porta ${PORT}`
        );

    }
);
