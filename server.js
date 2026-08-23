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
// PASTA DO SITE
// ==========================================

const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));


// ==========================================
// BANCO DE DADOS
// ==========================================

const dbPath = path.join(__dirname, "banco.db");

const db = new sqlite3.Database(dbPath, (err) => {

    if (err) {
        console.error("Erro no banco:", err.message);
    } else {
        console.log("Banco conectado!");
    }

});


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
`, (err) => {

    if (err) {
        console.error("Erro ao criar tabela:", err.message);
    } else {
        console.log("Tabela pratos pronta!");
    }

});


// ==========================================
// SITE
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(publicPath, "index.html")
    );

});


// ==========================================
// TESTE DA API
// ==========================================

app.get("/api", (req, res) => {

    res.json({
        sucesso: true,
        mensagem: "API funcionando!"
    });

});


// ==========================================
// LISTAR PRATOS
// ==========================================

app.get("/pratos", (req, res) => {

    db.all(
        "SELECT * FROM pratos ORDER BY id DESC",
        [],
        (err, pratos) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    sucesso: false,
                    erro: "Erro ao buscar pratos."
                });

            }

            res.json(pratos);

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


    if (!nome || !preco || !categoria) {

        return res.status(400).json({
            sucesso: false,
            erro: "Preencha nome, preço e categoria."
        });

    }


    const precoNumero = Number(preco);


    if (isNaN(precoNumero)) {

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
            nome,
            descricao || "",
            precoNumero,
            imagem || "",
            categoria
        ],
        function (err) {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    sucesso: false,
                    erro: "Erro ao cadastrar prato."
                });

            }


            res.status(201).json({

                sucesso: true,

                mensagem: "Prato cadastrado com sucesso!",

                prato: {
                    id: this.lastID,
                    nome: nome,
                    descricao: descricao || "",
                    preco: precoNumero,
                    imagem: imagem || "",
                    categoria: categoria
                }

            });

        }
    );

});


// ==========================================
// EDITAR PRATO
// ==========================================

app.put("/pratos/:id", (req, res) => {

    const id = req.params.id;

    const {
        nome,
        descricao,
        preco,
        imagem,
        categoria
    } = req.body;


    if (!nome || !preco || !categoria) {

        return res.status(400).json({
            sucesso: false,
            erro: "Preencha os campos obrigatórios."
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
            nome,
            descricao || "",
            Number(preco),
            imagem || "",
            categoria,
            id
        ],
        function (err) {

            if (err) {

                console.error(err);

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
                mensagem: "Prato atualizado com sucesso!"
            });

        }
    );

});


// ==========================================
// EXCLUIR PRATO
// ==========================================

app.delete("/pratos/:id", (req, res) => {

    const id = req.params.id;


    db.run(
        "DELETE FROM pratos WHERE id = ?",
        [id],
        function (err) {

            if (err) {

                console.error(err);

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
                mensagem: "Prato excluído com sucesso!"
            });

        }
    );

});


// ==========================================
// PORTA
// ==========================================

const PORT = process.env.PORT || 3000;


// ==========================================
// INICIAR
// ==========================================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Servidor rodando na porta ${PORT}`
    );

});
