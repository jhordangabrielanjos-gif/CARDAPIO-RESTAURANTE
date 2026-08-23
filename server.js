const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();


// ==========================================
// CONFIGURAÇÕES
// ==========================================

app.use(cors());
app.use(express.json());


// ==========================================
// FRONTEND
// ==========================================

const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));


// ==========================================
// BANCO DE DADOS
// ==========================================

const dbPath = path.join(__dirname, "banco.db");

const db = new sqlite3.Database(dbPath, (err) => {

    if (err) {
        console.error("Erro ao abrir banco:", err.message);
    } else {
        console.log("Banco de dados conectado!");
    }

});


// ==========================================
// CRIAR TABELA
// ==========================================

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS pratos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
            preco REAL NOT NULL,
            imagem TEXT,
            categoria TEXT NOT NULL
        )
    `, (err) => {

        if (err) {
            console.error(
                "Erro ao criar tabela:",
                err.message
            );
        } else {
            console.log(
                "Tabela de pratos pronta!"
            );
        }

    });

});


// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            publicPath,
            "index.html"
        )
    );

});


// ==========================================
// TESTE
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
        (err, rows) => {

            if (err) {

                console.error(
                    "Erro ao buscar pratos:",
                    err.message
                );

                return res.status(500).json({
                    sucesso: false,
                    erro: "Erro ao buscar pratos."
                });

            }

            res.json(rows);

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


    if (
        !nome ||
        !preco ||
        !categoria
    ) {

        return res.status(400).json({
            sucesso: false,
            erro:
                "Nome, preço e categoria são obrigatórios."
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
            precoNumero,
            imagem || "",
            categoria.trim()
        ],
        function (err) {

            if (err) {

                console.error(
                    "Erro ao cadastrar:",
                    err.message
                );

                return res.status(500).json({
                    sucesso: false,
                    erro: err.message
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


    if (
        !nome ||
        !preco ||
        !categoria
    ) {

        return res.status(400).json({
            sucesso: false,
            erro:
                "Nome, preço e categoria são obrigatórios."
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
            precoNumero,
            imagem || "",
            categoria.trim(),
            id
        ],
        function (err) {

            if (err) {

                console.error(
                    "Erro ao editar:",
                    err.message
                );

                return res.status(500).json({
                    sucesso: false,
                    erro: err.message
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


// ==========================================
// EXCLUIR PRATO
// ==========================================

app.delete("/pratos/:id", (req, res) => {

    const id =
        Number(req.params.id);


    db.run(
        "DELETE FROM pratos WHERE id = ?",
        [id],
        function (err) {

            if (err) {

                console.error(
                    "Erro ao excluir:",
                    err.message
                );

                return res.status(500).json({
                    sucesso: false,
                    erro: err.message
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


// ==========================================
// PORTA
// ==========================================

const PORT =
    process.env.PORT || 3000;


// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Servidor rodando na porta ${PORT}`
        );

    }
);
