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
// CRIAR / PREPARAR TABELAS
// ==========================================

async function prepararBanco() {
    try {

        // ======================================
        // 1. TABELA DE ESTABELECIMENTOS
        // ======================================

        await pool.query(`
            CREATE TABLE IF NOT EXISTS estabelecimentos (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Tabela estabelecimentos pronta!");

        // ======================================
        // 2. CRIAR ESTABELECIMENTO PADRÃO
        // ======================================

        let estabelecimento = await pool.query(`
            SELECT id
            FROM estabelecimentos
            ORDER BY id
            LIMIT 1
        `);

        if (estabelecimento.rows.length === 0) {

            estabelecimento = await pool.query(`
                INSERT INTO estabelecimentos (nome)
                VALUES ('Minha Lanchonete')
                RETURNING id
            `);

            console.log("Estabelecimento padrão criado!");

        } else {

            console.log("Estabelecimento já existente encontrado!");

        }

        const estabelecimentoId = estabelecimento.rows[0].id;

        // ======================================
        // 3. CRIAR TABELA PRATOS
        // ======================================

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

        // ======================================
        // 4. ADICIONAR ESTABELECIMENTO_ID
        // ======================================

        await pool.query(`
            ALTER TABLE pratos
            ADD COLUMN IF NOT EXISTS estabelecimento_id INTEGER
        `);

        console.log("Coluna estabelecimento_id pronta!");

        // ======================================
        // 5. COLOCAR PRATOS ANTIGOS NO
        //    ESTABELECIMENTO PADRÃO
        // ======================================

        await pool.query(`
            UPDATE pratos
            SET estabelecimento_id = $1
            WHERE estabelecimento_id IS NULL
        `, [estabelecimentoId]);

        console.log("Pratos antigos vinculados ao estabelecimento!");

        // ======================================
        // 6. CRIAR CHAVE ESTRANGEIRA
        // ======================================

        const foreignKey = await pool.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'pratos'
            AND constraint_name = 'fk_pratos_estabelecimento'
        `);

        if (foreignKey.rows.length === 0) {

            await pool.query(`
                ALTER TABLE pratos
                ADD CONSTRAINT fk_pratos_estabelecimento
                FOREIGN KEY (estabelecimento_id)
                REFERENCES estabelecimentos(id)
                ON DELETE CASCADE
            `);

            console.log("Relacionamento entre pratos e estabelecimentos criado!");

        }

        console.log("======================================");
        console.log("BANCO PREPARADO COM SUCESSO!");
        console.log("======================================");

    } catch (error) {

        console.error("ERRO AO PREPARAR BANCO:");
        console.error(error);

    }
}

prepararBanco();

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

        const resultado = await pool.query(`
            SELECT *
            FROM pratos
            ORDER BY id DESC
        `);

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

        console.error("ERRO AO BUSCAR PRATO:");
        console.error(error);

        res.status(500).json({
            erro: "Erro ao buscar prato"
        });

    }

});

// ==========================================
// LISTAR PRATOS DE UM ESTABELECIMENTO
// ==========================================

app.get("/estabelecimentos/:id/pratos", async (req, res) => {

    try {

        const { id } = req.params;

        // Verificar se o estabelecimento existe
        const estabelecimento = await pool.query(
            `
            SELECT *
            FROM estabelecimentos
            WHERE id = $1
            `,
            [id]
        );

        if (estabelecimento.rows.length === 0) {

            return res.status(404).json({
                erro: "Estabelecimento não encontrado"
            });

        }

        // Buscar somente os pratos desse estabelecimento
        const resultado = await pool.query(
            `
            SELECT *
            FROM pratos
            WHERE estabelecimento_id = $1
            ORDER BY id DESC
            `,
            [id]
        );

        res.json(resultado.rows);

    } catch (error) {

        console.error("ERRO AO BUSCAR PRATOS DO ESTABELECIMENTO:");
        console.error(error);

        res.status(500).json({
            erro: "Erro ao buscar pratos"
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

        // Pegar o primeiro estabelecimento
        const estabelecimento = await pool.query(`
            SELECT id
            FROM estabelecimentos
            ORDER BY id
            LIMIT 1
        `);

        if (estabelecimento.rows.length === 0) {

            return res.status(500).json({
                erro: "Nenhum estabelecimento encontrado"
            });

        }

        const estabelecimentoId = estabelecimento.rows[0].id;

        const resultado = await pool.query(
            `
            INSERT INTO pratos
            (
                nome,
                descricao,
                preco,
                categoria,
                imagem,
                estabelecimento_id
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [
                nome,
                descricao || "",
                preco,
                categoria || "Outros",
                imagem || "",
                estabelecimentoId
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
// ==========================================
// CRIAR ESTABELECIMENTO
// ==========================================

app.post("/estabelecimentos", async (req, res) => {

    try {

        const { nome } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({
                erro: "Nome do estabelecimento é obrigatório"
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO estabelecimentos (nome)
            VALUES ($1)
            RETURNING *
            `,
            [nome.trim()]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {

        console.error("ERRO AO CRIAR ESTABELECIMENTO:");
        console.error(error);

        res.status(500).json({
            erro: "Erro ao criar estabelecimento"
        });

    }

});
app.listen(PORT, () => {

    console.log(`Servidor rodando na porta ${PORT}`);

});
