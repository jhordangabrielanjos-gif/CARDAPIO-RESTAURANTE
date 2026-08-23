const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());


// ==========================================
// ARQUIVOS DO SITE
// ==========================================

app.use(express.static(__dirname));


// ==========================================
// BANCO DE DADOS
// ==========================================

const dbPath = path.join(__dirname, "banco.db");

const db = new sqlite3.Database(dbPath, (erro) => {

    if (erro) {
        console.error("Erro ao conectar ao banco:", erro.message);
    } else {
        console.log("Banco de dados conectado!");
    }

});


// ==========================================
// TABELA DE PRATOS
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
        console.log("Tabela pratos pronta!");
    }

});


// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


// ==========================================
// TESTE DA API
// ==========================================

app.get("/api", (req, res) => {

    res.json({
        sucesso: true,
        mensagem: "API do restaurante funcionando!"
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
                    erro.message
                );

                return res.status(500).json({
                    sucesso: false,
                    erro: "Erro ao buscar pratos"
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


    if (!nome || nome.trim() === "") {

        return res.status(400).json({
            sucesso: false,
            erro: "Informe o nome do prato."
        });

    }


    if (
        preco === undefined ||
        preco === null ||
        preco === ""
    ) {

        return res.status(400).json({
            sucesso: false,
            erro: "Informe o preço do prato."
        });

    }


    if (!categoria || categoria.trim() === "") {

        return res.status(400).json({
            sucesso: false,
            erro: "Informe a categoria."
        });

    }


    const precoNumerico =
        Number(preco);


    if (isNaN(precoNumerico)) {

        return res.status(400).json({
            sucesso: false,
            erro: "O preço precisa ser um número."
        });

    }


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
            imagem || "",
            categoria.trim()
        ],
        function (erro) {

            if (erro) {

                console.error(
                    "Erro ao cadastrar:",
                    erro.message
                );

                return res.status(500).json({
                    sucesso: false,
                    erro: "Erro ao cadastrar prato: " +
                          erro.message
                });

            }


            res.status(201).json({

                sucesso: true,

                mensagem:
                    "Prato cadastrado com sucesso!",

                prato: {

                    id: this.lastID,

                    nome: nome.trim(),

                    descricao:
                        descricao || "",

                    preco:
                        precoNumerico,

                    imagem:
                        imagem || "",

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
        req.params.id;

    const {
        nome,
        descricao,
        preco,
        imagem,
        categoria
    } = req.body;


    if (!nome || nome.trim() === "") {

        return res.status(400).json({
            sucesso: false,
            erro: "Informe o nome do prato."
        });

    }


    const precoNumerico =
        Number(preco);


    if (isNaN(precoNumerico)) {

        return res.status(400).json({
            sucesso: false,
            erro: "Preço inválido."
        });

    }


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
            imagem || "",
            categoria || "",
            id
        ],
        function (erro) {

            if (erro) {

                console.error(
                    "Erro ao editar:",
                    erro.message
                );

                return res.status(500).json({
                    sucesso: false,
                    erro: "Erro ao editar prato."
                });

            }


            if (this.changes === 0) {

                return res.status(404).json({
                    sucesso: false,
                    erro: "Prato não encontrado."
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
        req.params.id;


    db.run(
        "DELETE FROM pratos WHERE id = ?",
        [id],
        function (erro) {

            if (erro) {

                console.error(
                    "Erro ao excluir:",
                    erro.message
                );

                return res.status(500).json({
                    sucesso: false,
                    erro: "Erro ao excluir prato."
                });

            }


            if (this.changes === 0) {

                return res.status(404).json({
                    sucesso: false,
                    erro: "Prato não encontrado."
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
// SERVIDOR
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
