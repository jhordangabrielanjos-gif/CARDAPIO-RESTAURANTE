const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// SITE
// ===============================

const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));

app.get("/", (req, res) => {
    res.sendFile(
        path.join(publicPath, "index.html")
    );
});


// ===============================
// BANCO
// ===============================

const dbPath = path.join(
    __dirname,
    "banco.db"
);

const db = new sqlite3.Database(
    dbPath,
    (erro) => {

        if (erro) {
            console.error(
                "Erro no banco:",
                erro.message
            );
        } else {
            console.log(
                "Banco conectado!"
            );
        }

    }
);


// ===============================
// TABELA
// ===============================

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
            "Erro na tabela:",
            erro.message
        );
    } else {
        console.log(
            "Tabela de pratos pronta!"
        );
    }

});


// ===============================
// API TESTE
// ===============================

app.get("/api", (req, res) => {

    res.json({
        sucesso: true,
        mensagem:
            "API do restaurante funcionando!"
    });

});


// ===============================
// LISTAR PRATOS
// ===============================

app.get("/pratos", (req, res) => {

    db.all(
        "SELECT * FROM pratos ORDER BY id DESC",
        [],
        (erro, resultados) => {

            if (erro) {

                console.error(erro);

                return res.status(500).json({
                    sucesso: false,
                    erro: erro.message
                });

            }

            res.json(resultados);

        }
    );

});


// ===============================
// CADASTRAR
// ===============================

app.post("/pratos", (req, res) => {

    const {
        nome,
        descricao,
        preco,
        imagem,
        categoria
    } = req.body;


    if (
        !nome ||
        !preco ||
        !categoria
    ) {

        return res.status(400).json({
            sucesso: false,
            erro:
                "Preencha nome, preço e categoria."
        });

    }


    const precoNumero =
        Number(preco);


    if (
        isNaN(precoNumero) ||
        precoNumero <= 0
    ) {

        return res.status(400).json({
            sucesso: false,
            erro: "Preço inválido."
        });

    }


    db.run(
        `
        INSERT INTO pratos
        (
            nome,
            descricao,
            preco,
            imagem,
            categoria
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            nome.trim(),
            descricao || "",
            precoNumero,
            imagem || "",
            categoria.trim()
        ],
        function (erro) {

            if (erro) {

                console.error(erro);

                return res.status(500).json({
                    sucesso: false,
                    erro: erro.message
                });

            }


            res.status(201).json({

                sucesso: true,

                mensagem:
                    "Prato cadastrado com sucesso!",

                prato: {
                    id: this.lastID,
                    nome: nome.trim(),
                    descricao: descricao || "",
                    preco: precoNumero,
                    imagem: imagem || "",
                    categoria: categoria.trim()
                }

            });

        }
    );

});


// ===============================
// EDITAR
// ===============================

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


    if (
        !nome ||
        !preco ||
        !categoria
    ) {

        return res.status(400).json({
            sucesso: false,
            erro:
                "Preencha os campos obrigatórios."
        });

    }


    const precoNumero =
        Number(preco);


    if (isNaN(precoNumero)) {

        return res.status(400).json({
            sucesso: false,
            erro: "Preço inválido."
        });

    }


    db.run(
        `
        UPDATE pratos
        SET
            nome = ?,
            descricao = ?,
            preco = ?,
            imagem = ?,
            categoria = ?
        WHERE id = ?
        `,
        [
            nome.trim(),
            descricao || "",
            precoNumero,
            imagem || "",
            categoria.trim(),
            id
        ],
        function (erro) {

            if (erro) {

                console.error(erro);

                return res.status(500).json({
                    sucesso: false,
                    erro: erro.message
                });

            }


            if (this.changes === 0) {

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


// ===============================
// EXCLUIR
// ===============================

app.delete("/pratos/:id", (req, res) => {

    const id =
        Number(req.params.id);


    db.run(
        "DELETE FROM pratos WHERE id = ?",
        [id],
        function (erro) {

            if (erro) {

                console.error(erro);

                return res.status(500).json({
                    sucesso: false,
                    erro: erro.message
                });

            }


            if (this.changes === 0) {

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


// ===============================
// SERVIDOR
// ===============================

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
