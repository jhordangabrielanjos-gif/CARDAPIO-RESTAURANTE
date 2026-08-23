const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// CONFIGURAÇÕES
// ========================================

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ========================================
// BANCO DE DADOS
// ========================================

const dbPath = path.join(__dirname, "banco.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco:", err.message);
    } else {
        console.log("Banco de dados conectado!");
    }
});

// ========================================
// CRIAR TABELA
// ========================================

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

// ========================================
// PÁGINA PRINCIPAL
// ========================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

// ========================================
// TESTE DA API
// ========================================

app.get("/api", (req, res) => {
    res.json({
        mensagem: "API do restaurante funcionando!"
    });
});

// ========================================
// LISTAR PRATOS
// ========================================

app.get("/pratos", (req, res) => {

    db.all(
        "SELECT * FROM pratos ORDER BY id DESC",
        [],
        (err, rows) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    erro: "Erro ao buscar pratos."
                });
            }

            res.json(rows);
        }
    );
});

// ========================================
// CADASTRAR PRATO
// ========================================

app.post("/pratos", (req, res) => {

    const {
        nome,
        descricao,
        preco,
        imagem,
        categoria
    } = req.body;

    if (!nome || preco === undefined || !categoria) {

        return res.status(400).json({
            erro: "Preencha nome, preço e categoria."
        });
    }

    db.run(
        `
        INSERT INTO pratos
        (nome, descricao, preco, imagem, categoria)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            nome,
            descricao || "",
            Number(preco),
            imagem || "",
            categoria
        ],
        function (err) {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    erro: "Erro ao cadastrar prato."
                });
            }

            res.status(201).json({
                mensagem: "Prato cadastrado com sucesso!",
                prato: {
                    id: this.lastID,
                    nome,
                    descricao,
                    preco: Number(preco),
                    imagem,
                    categoria
                }
            });
        }
    );
});

// ========================================
// EDITAR PRATO
// ========================================

app.put("/pratos/:id", (req, res) => {

    const id = req.params.id;

    const {
        nome,
        descricao,
        preco,
        imagem,
        categoria
    } = req.body;

    if (!nome || preco === undefined || !categoria) {

        return res.status(400).json({
            erro: "Preencha nome, preço e categoria."
        });
    }

    db.run(
        `
        UPDATE pratos
        SET nome = ?,
            descricao = ?,
            preco = ?,
            imagem = ?,
            categoria = ?
        WHERE id = ?
        `,
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
                    erro: "Erro ao editar prato."
                });
            }

            if (this.changes === 0) {

                return res.status(404).json({
                    erro: "Prato não encontrado."
                });
            }

            res.json({
                mensagem: "Prato atualizado com sucesso!"
            });
        }
    );
});

// ========================================
// EXCLUIR PRATO
// ========================================

app.delete("/pratos/:id", (req, res) => {

    const id = req.params.id;

    db.run(
        "DELETE FROM pratos WHERE id = ?",
        [id],
        function (err) {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    erro: "Erro ao excluir prato."
                });
            }

            if (this.changes === 0) {

                return res.status(404).json({
                    erro: "Prato não encontrado."
                });
            }

            res.json({
                mensagem: "Prato excluído com sucesso!"
            });
        }
    );
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("=================================");
    console.log("🍔 RESTAURANTE ONLINE");
    console.log("=================================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log("=================================");
    console.log("");
});
