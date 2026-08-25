const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();

// ==========================================
// CONFIGURAÇÕES
// ==========================================

app.use(cors());

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
// POSTGRESQL
// ==========================================

if (!process.env.DATABASE_URL) {

    console.error(
        "ERRO: DATABASE_URL não foi configurada."
    );

} else {

    console.log(
        "DATABASE_URL encontrada."
    );
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }
});


// ==========================================
// TESTAR CONEXÃO COM BANCO
// ==========================================

async function iniciarBanco() {

    try {

        const client = await pool.connect();

        console.log(
            "PostgreSQL conectado com sucesso!"
        );

        await client.query(`
            CREATE TABLE IF NOT EXISTS pratos (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                descricao TEXT,
                preco NUMERIC NOT NULL,
                imagem TEXT,
                categoria TEXT NOT NULL
            )
        `);

        console.log(
            "Tabela de pratos pronta!"
        );

        client.release();

    } catch (erro) {

        console.error(
            "Erro ao conectar ao PostgreSQL:",
            erro.message
        );

    }
}

iniciarBanco();


// ==========================================
// TESTE DA API
// ==========================================

app.get("/api", (req, res) => {

    res.json({

        sucesso: true,

        mensagem:
            "API do restaurante funcionando!",

        banco:
            "PostgreSQL"

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

    } catch (erro) {

        console.error(
            "Erro ao buscar pratos:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            erro:
                erro.message

        });

    }

});


// ==========================================
// CADASTRAR PRATO
// ==========================================

app.post("/pratos", async (req, res) => {

    const {
        nome,
        descricao,
        preco,
        imagem,
        categoria
    } = req.body;


    // ======================================
    // VALIDAR NOME
    // ======================================

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


    // ======================================
    // VALIDAR PREÇO
    // ======================================

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


    // ======================================
    // VALIDAR CATEGORIA
    // ======================================

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


    // ======================================
    // VALIDAR IMAGEM
    // ======================================

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


    // ======================================
    // INSERIR NO POSTGRESQL
    // ======================================

    try {

        const resultado = await pool.query(

            `
            INSERT INTO pratos
            (
                nome,
                descricao,
                preco,
                imagem,
                categoria
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,

            [
                nome.trim(),
                descricao || "",
                precoNumerico,
                imagemFinal,
                categoria.trim()
            ]

        );


        res.status(201).json({

            sucesso: true,

            mensagem:
                "Prato cadastrado com sucesso!",

            prato:
                resultado.rows[0]

        });

    } catch (erro) {

        console.error(
            "Erro ao cadastrar:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            erro:
                erro.message

        });

    }

});


// ==========================================
// EDITAR PRATO
// ==========================================

app.put("/pratos/:id", async (req, res) => {

    const id =
        Number(req.params.id);


    const {
        nome,
        descricao,
        preco,
        imagem,
        categoria
    } = req.body;


    // ======================================
    // VALIDAR ID
    // ======================================

    if (
        isNaN(id)
    ) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "ID inválido."

        });

    }


    // ======================================
    // VALIDAR NOME
    // ======================================

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


    // ======================================
    // VALIDAR CATEGORIA
    // ======================================

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


    // ======================================
    // VALIDAR PREÇO
    // ======================================

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


    // ======================================
    // IMAGEM
    // ======================================

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


    // ======================================
    // ATUALIZAR
    // ======================================

    try {

        const resultado = await pool.query(

            `
            UPDATE pratos

            SET
                nome = $1,
                descricao = $2,
                preco = $3,
                imagem = $4,
                categoria = $5

            WHERE id = $6

            RETURNING *
            `,

            [
                nome.trim(),
                descricao || "",
                precoNumerico,
                imagemFinal,
                categoria.trim(),
                id
            ]

        );


        if (
            resultado.rows.length === 0
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
                "Prato atualizado com sucesso!",

            prato:
                resultado.rows[0]

        });

    } catch (erro) {

        console.error(
            "Erro ao editar:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            erro:
                erro.message

        });

    }

});


// ==========================================
// EXCLUIR PRATO
// ==========================================

app.delete("/pratos/:id", async (req, res) => {

    const id =
        Number(req.params.id);


    if (
        isNaN(id)
    ) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "ID inválido."

        });

    }


    try {

        const resultado = await pool.query(

            `
            DELETE FROM pratos
            WHERE id = $1
            RETURNING *
            `,

            [id]

        );


        if (
            resultado.rows.length === 0
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

    } catch (erro) {

        console.error(
            "Erro ao excluir:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            erro:
                erro.message

        });

    }

});


// ==========================================
// ROTA 404
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
