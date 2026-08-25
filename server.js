const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// CONFIGURAÇÕES
// ==========================================

app.use(cors());

app.use(express.json({
    limit: "10mb"
}));

app.use(express.static(__dirname));

// ==========================================
// POSTGRESQL
// ==========================================

if (!process.env.DATABASE_URL) {
    console.error("ERRO: DATABASE_URL não foi configurada.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
    .then(client => {
        console.log("PostgreSQL conectado com sucesso!");
        client.release();
    })
    .catch(err => {
        console.error("ERRO AO CONECTAR AO POSTGRESQL:");
        console.error(err);
    });

// ==========================================
// CRIAR TABELA
// ==========================================

async function criarTabela() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pratos (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                descricao TEXT,
                preco NUMERIC(10,2) NOT NULL,
                categoria VARCHAR(100),
                imagem TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Tabela pratos pronta!");
    } catch (error) {
        console.error("Erro ao criar tabela:", error);
    }
}

criarTabela();

// ==========================================
// ROTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ==========================================
// TESTE DA API
// ==========================================

app.get("/api", (req, res) => {
    res.json({
        mensagem: "API do restaurante funcionando!",
        banco: "PostgreSQL"
    });
});

// ==========================================
// LISTAR PRATOS
// ==========================================

app.get("/pratos", async (req, res) => {
    try {
        const resultado = await pool.query(
            "SELECT * FROM pratos ORDER BY id DESC"
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error("ERRO AO BUSCAR PRATOS:");
        console.error(error);

        res.status(500).json({
            erro: error.message || "Erro ao buscar pratos"
        });
    }
});

// ==========================================
// BUSCAR UM PRATO
// ==========================================

app.get("/pratos/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            "SELECT * FROM pratos WHERE id = $1",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Prato não encontrado"
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro ao buscar prato"
        });
    }
});

// ==========================================
// CADASTRAR PRATO
// ==========================================

app.post("/pratos", async (req, res) => {
    try {
        const {
            nome,
            descricao,
            preco,
            categoria,
            imagem
        } = req.body;

        if (!nome || preco === undefined) {
            return res.status(400).json({
                erro: "Nome e preço são obrigatórios"
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO pratos
            (nome, descricao, preco, categoria, imagem)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                nome,
                descricao || "",
                preco,
                categoria || "Outros",
                imagem || ""
            ]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro ao cadastrar prato"
        });
    }
});

// ==========================================
// EDITAR PRATO
// ==========================================

app.put("/pratos/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nome,
            descricao,
            preco,
            categoria,
            imagem
        } = req.body;

        const resultado = await pool.query(
            `
            UPDATE pratos
            SET
                nome = $1,
                descricao = $2,
                preco = $3,
                categoria = $4,
                imagem = $5
            WHERE id = $6
            RETURNING *
            `,
            [
                nome,
                descricao || "",
                preco,
                categoria || "Outros",
                imagem || "",
                id
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Prato não encontrado"
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro ao editar prato"
        });
    }
});

// ==========================================
// EXCLUIR PRATO
// ==========================================

app.delete("/pratos/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            "DELETE FROM pratos WHERE id = $1 RETURNING *",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Prato não encontrado"
            });
        }

        res.json({
            mensagem: "Prato excluído com sucesso!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro ao excluir prato"
        });
    }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
