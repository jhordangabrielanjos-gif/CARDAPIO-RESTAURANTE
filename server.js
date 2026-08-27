const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();

const PORT = process.env.PORT || 3000;

const JWT_SECRET =
    process.env.JWT_SECRET || "chave-temporaria-restaurante";

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

    console.error(
        "ERRO: DATABASE_URL não foi configurada."
    );

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

        console.log(
            "PostgreSQL conectado com sucesso!"
        );

        client.release();

    })
    .catch(error => {

        console.error(
            "ERRO AO CONECTAR AO POSTGRESQL:"
        );

        console.error(error);

    });

// ==========================================
// PREPARAR BANCO
// ==========================================

async function prepararBanco() {

    try {

        // ======================================
        // USUÁRIOS
        // ======================================

        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                senha VARCHAR(255) NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log(
            "Tabela usuarios pronta!"
        );


        // ======================================
        // ESTABELECIMENTOS
        // ======================================

        await pool.query(`
            CREATE TABLE IF NOT EXISTS estabelecimentos (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log(
            "Tabela estabelecimentos pronta!"
        );


        // ======================================
        // VINCULAR ESTABELECIMENTO AO USUÁRIO
        // ======================================

        await pool.query(`
            ALTER TABLE estabelecimentos
            ADD COLUMN IF NOT EXISTS usuario_id INTEGER
        `);

        console.log(
            "Coluna usuario_id pronta!"
        );


        // ======================================
        // PERSONALIZAÇÃO
        // ======================================

        await pool.query(`
            ALTER TABLE estabelecimentos
            ADD COLUMN IF NOT EXISTS descricao TEXT
        `);

        await pool.query(`
            ALTER TABLE estabelecimentos
            ADD COLUMN IF NOT EXISTS logo TEXT
        `);

        await pool.query(`
    ALTER TABLE estabelecimentos
    ADD COLUMN IF NOT EXISTS imagem_fundo TEXT
`);

        await pool.query(`
            ALTER TABLE estabelecimentos
            ADD COLUMN IF NOT EXISTS cor VARCHAR(20)
        `);

        await pool.query(`
            ALTER TABLE estabelecimentos
            ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30)
        `);

        await pool.query(`
            ALTER TABLE estabelecimentos
            ADD COLUMN IF NOT EXISTS pix VARCHAR(255)
       `);

        await pool.query(`
            ALTER TABLE estabelecimentos
            ADD COLUMN IF NOT EXISTS endereco TEXT
        `);

        await pool.query(`
            ALTER TABLE estabelecimentos
            ADD COLUMN IF NOT EXISTS horario TEXT
        `);

        console.log(
            "Colunas de personalização prontas!"
        );

await pool.query(`
    ALTER TABLE estabelecimentos
    ADD COLUMN IF NOT EXISTS pix VARCHAR(255)
`);

        // ======================================
        // PRATOS
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

        console.log(
            "Tabela pratos pronta!"
        );


        // ======================================
        // VINCULAR PRATOS AO ESTABELECIMENTO
        // ======================================

        await pool.query(`
            ALTER TABLE pratos
            ADD COLUMN IF NOT EXISTS estabelecimento_id INTEGER
        `);

        console.log(
            "Coluna estabelecimento_id pronta!"
        );


        // ======================================
        // RELACIONAMENTO PRATOS -> ESTABELECIMENTOS
        // ======================================

        const foreignKeyPratos =
            await pool.query(`
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_name = 'pratos'
                AND constraint_name = 'fk_pratos_estabelecimento'
            `);

        if (
            foreignKeyPratos.rows.length === 0
        ) {

            try {

                await pool.query(`
                    ALTER TABLE pratos
                    ADD CONSTRAINT fk_pratos_estabelecimento
                    FOREIGN KEY (estabelecimento_id)
                    REFERENCES estabelecimentos(id)
                    ON DELETE CASCADE
                `);

                console.log(
                    "FK de pratos criada!"
                );

            } catch (error) {

                console.log(
                    "FK de pratos não foi criada. "
                    + "Provavelmente existem dados antigos."
                );

            }

        }


        // ======================================
        // CRIAR ESTABELECIMENTO PADRÃO
        // SOMENTE SE NÃO EXISTIR NENHUM
        // ======================================

        const quantidade =
            await pool.query(`
                SELECT COUNT(*) AS total
                FROM estabelecimentos
            `);

        if (
            Number(quantidade.rows[0].total) === 0
        ) {

            await pool.query(`
                INSERT INTO estabelecimentos
                (
                    nome,
                    descricao,
                    cor
                )
                VALUES
                (
                    'Minha Lanchonete',
                    'Escolha seus pratos favoritos e monte seu pedido.',
                    '#222222'
                )
            `);

            console.log(
                "Estabelecimento padrão criado!"
            );

        }


        console.log(
            "======================================"
        );

        console.log(
            "BANCO PREPARADO COM SUCESSO!"
        );

        console.log(
            "======================================"
        );

    } catch (error) {

        console.error(
            "ERRO AO PREPARAR BANCO:"
        );

        console.error(error);

    }

}

prepararBanco();

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});

// ==========================================
// AUTENTICAÇÃO
// ==========================================

function autenticarUsuario(
    req,
    res,
    next
) {

    try {

        const autorizacao =
            req.headers.authorization;

        if (!autorizacao) {

            return res.status(401).json({
                sucesso: false,
                erro: "Usuário não autenticado."
            });

        }

        const partes =
            autorizacao.split(" ");

        if (
            partes.length !== 2 ||
            partes[0] !== "Bearer"
        ) {

            return res.status(401).json({
                sucesso: false,
                erro: "Token inválido."
            });

        }

        const token =
            partes[1];

        const usuario =
            jwt.verify(
                token,
                JWT_SECRET
            );

        req.usuario =
            usuario;

        next();

    } catch (error) {

        console.error(
            "ERRO NA AUTENTICAÇÃO:",
            error.message
        );

        return res.status(401).json({
            sucesso: false,
            erro: "Sessão inválida ou expirada."
        });

    }

}

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
// CADASTRAR USUÁRIO
// ==========================================

app.post(
    "/usuarios",
    async (req, res) => {

        try {

            const {
                nome,
                email,
                senha
            } = req.body;

            if (
                !nome ||
                !email ||
                !senha
            ) {

                return res.status(400).json({
                    sucesso: false,
                    erro:
                        "Nome, e-mail e senha são obrigatórios."
                });

            }

            if (
                senha.length < 6
            ) {

                return res.status(400).json({
                    sucesso: false,
                    erro:
                        "A senha deve ter pelo menos 6 caracteres."
                });

            }

            const emailLimpo =
                email
                    .trim()
                    .toLowerCase();

            // ==================================
            // VERIFICAR E-MAIL
            // ==================================

            const existente =
                await pool.query(
                    `
                    SELECT id
                    FROM usuarios
                    WHERE email = $1
                    `,
                    [
                        emailLimpo
                    ]
                );

            if (
                existente.rows.length > 0
            ) {

                return res.status(409).json({
                    sucesso: false,
                    erro:
                        "Este e-mail já está cadastrado."
                });

            }

            // ==================================
            // CRIAR USUÁRIO
            // ==================================

            const usuario =
                await pool.query(
                    `
                    INSERT INTO usuarios
                    (
                        nome,
                        email,
                        senha
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3
                    )
                    RETURNING
                        id,
                        nome,
                        email,
                        criado_em
                    `,
                    [
                        nome.trim(),
                        emailLimpo,
                        senha
                    ]
                );

            const usuarioCriado =
                usuario.rows[0];

            // ==================================
            // CRIAR ESTABELECIMENTO DO USUÁRIO
            // ==================================

            const estabelecimento =
                await pool.query(
                    `
                    INSERT INTO estabelecimentos
                    (
                        nome,
                        usuario_id,
                        descricao,
                        cor
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4
                    )
                    RETURNING *
                    `,
                    [
                        nome.trim(),
                        usuarioCriado.id,
                        "Escolha seus pratos favoritos e monte seu pedido.",
                        "#222222"
                    ]
                );

            res.status(201).json({

                sucesso: true,

                mensagem:
                    "Usuário cadastrado com sucesso!",

                usuario:
                    usuarioCriado,

                estabelecimento:
                    estabelecimento.rows[0]

            });

        } catch (error) {

            console.error(
                "ERRO AO CADASTRAR USUÁRIO:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao cadastrar usuário."

            });

        }

    }
);

// ==========================================
// LOGIN
// ==========================================

app.post(
    "/login",
    async (req, res) => {

        try {

            const {
                email,
                senha
            } = req.body;

            if (
                !email ||
                !senha
            ) {

                return res.status(400).json({

                    sucesso: false,

                    erro:
                        "E-mail e senha são obrigatórios."

                });

            }

            const emailLimpo =
                email
                    .trim()
                    .toLowerCase();

            const resultado =
                await pool.query(
                    `
                    SELECT
                        id,
                        nome,
                        email,
                        senha
                    FROM usuarios
                    WHERE email = $1
                    `,
                    [
                        emailLimpo
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(401).json({

                    sucesso: false,

                    erro:
                        "E-mail ou senha incorretos."

                });

            }

            const usuario =
                resultado.rows[0];

            if (
                usuario.senha !== senha
            ) {

                return res.status(401).json({

                    sucesso: false,

                    erro:
                        "E-mail ou senha incorretos."

                });

            }

            // ==================================
            // GARANTIR ESTABELECIMENTO
            // ==================================

            let estabelecimento =
                await pool.query(
                    `
                    SELECT *
                    FROM estabelecimentos
                    WHERE usuario_id = $1
                    ORDER BY id ASC
                    LIMIT 1
                    `,
                    [
                        usuario.id
                    ]
                );

            // ==================================
            // SE NÃO TIVER, CRIAR
            // ==================================

            if (
                estabelecimento.rows.length === 0
            ) {

                estabelecimento =
                    await pool.query(
                        `
                        INSERT INTO estabelecimentos
                        (
                            nome,
                            usuario_id,
                            descricao,
                            cor
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            $3,
                            $4
                        )
                        RETURNING *
                        `,
                        [
                            usuario.nome,
                            usuario.id,
                            "Escolha seus pratos favoritos e monte seu pedido.",
                            "#222222"
                        ]
                    );

            }

            const estabelecimentoAtual =
                estabelecimento.rows[0];

            // ==================================
            // TOKEN
            // ==================================

            const token =
                jwt.sign(
                    {
                        id: usuario.id,
                        nome: usuario.nome,
                        email: usuario.email
                    },
                    JWT_SECRET,
                    {
                        expiresIn: "7d"
                    }
                );

            res.json({

                sucesso: true,

                mensagem:
                    "Login realizado com sucesso!",

                token,

                usuario: {

                    id:
                        usuario.id,

                    nome:
                        usuario.nome,

                    email:
                        usuario.email

                },

                estabelecimento: {

                    id:
                        estabelecimentoAtual.id,

                    nome:
                        estabelecimentoAtual.nome

                }

            });

        } catch (error) {

            console.error(
                "ERRO AO FAZER LOGIN:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao fazer login."

            });

        }

    }
);

// ==========================================
// LISTAR ESTABELECIMENTOS DO USUÁRIO
// ==========================================

app.get(
    "/estabelecimentos",
    autenticarUsuario,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT
                        id,
                        nome,
                        descricao,
                        logo,
                        imagem_fundo,
                        cor,
                        whatsapp,
                        endereco,
                        horario,
                        criado_em
                    FROM estabelecimentos
                    WHERE usuario_id = $1
                    ORDER BY id ASC
                    `,
                    [
                        req.usuario.id
                    ]
                );

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error(
                "ERRO AO BUSCAR ESTABELECIMENTOS:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao buscar estabelecimentos."

            });

        }

    }
);

// ==========================================
// CRIAR ESTABELECIMENTO
// ==========================================

app.post(
    "/estabelecimentos",
    autenticarUsuario,
    async (req, res) => {

        try {

            const {
                nome
            } = req.body;

            if (
                !nome ||
                !nome.trim()
            ) {

                return res.status(400).json({

                    sucesso: false,

                    erro:
                        "Nome do estabelecimento é obrigatório."

                });

            }

            const resultado =
                await pool.query(
                    `
                    INSERT INTO estabelecimentos
                    (
                        nome,
                        usuario_id,
                        descricao,
                        cor
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4
                    )
                    RETURNING *
                    `,
                    [
                        nome.trim(),
                        req.usuario.id,
                        "Escolha seus pratos favoritos e monte seu pedido.",
                        "#222222"
                    ]
                );

            res.status(201).json({

                sucesso: true,

                mensagem:
                    "Estabelecimento criado com sucesso!",

                estabelecimento:
                    resultado.rows[0]

            });

        } catch (error) {

            console.error(
                "ERRO AO CRIAR ESTABELECIMENTO:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao criar estabelecimento."

            });

        }

    }
);

// ==========================================
// EDITAR ESTABELECIMENTO
// ==========================================

app.put(
    "/estabelecimentos/:id",
    autenticarUsuario,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const {
                nome
            } = req.body;

            if (
                !nome ||
                !nome.trim()
            ) {

                return res.status(400).json({

                    sucesso: false,

                    erro:
                        "Nome do estabelecimento é obrigatório."

                });

            }

            const resultado =
                await pool.query(
                    `
                    UPDATE estabelecimentos

                    SET nome = $1

                    WHERE id = $2
                    AND usuario_id = $3

                    RETURNING *
                    `,
                    [
                        nome.trim(),
                        id,
                        req.usuario.id
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    erro:
                        "Estabelecimento não encontrado ou não pertence ao usuário."

                });

            }

            res.json({

                sucesso: true,

                mensagem:
                    "Estabelecimento atualizado com sucesso!",

                estabelecimento:
                    resultado.rows[0]

            });

        } catch (error) {

            console.error(
                "ERRO AO EDITAR ESTABELECIMENTO:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao editar estabelecimento."

            });

        }

    }
);

// ==========================================
// EXCLUIR ESTABELECIMENTO
// ==========================================

app.delete(
    "/estabelecimentos/:id",
    autenticarUsuario,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const resultado =
                await pool.query(
                    `
                    DELETE FROM estabelecimentos

                    WHERE id = $1
                    AND usuario_id = $2

                    RETURNING *
                    `,
                    [
                        id,
                        req.usuario.id
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    erro:
                        "Estabelecimento não encontrado ou não pertence ao usuário."

                });

            }

            res.json({

                sucesso: true,

                mensagem:
                    "Estabelecimento excluído com sucesso!",

                estabelecimento:
                    resultado.rows[0]

            });

        } catch (error) {

            console.error(
                "ERRO AO EXCLUIR ESTABELECIMENTO:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao excluir estabelecimento."

            });

        }

    }
);

// ==========================================
// CONFIGURAÇÃO DO ESTABELECIMENTO
// ADMIN
// ==========================================

app.put(
    "/estabelecimentos/:id/configuracao",
    autenticarUsuario,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const {
                nome,
                descricao,
                logo,
                imagem_fundo,
                cor,
                whatsapp,
                pix,
                endereco,
                horario
            } = req.body;

            if (
                !nome ||
                !nome.trim()
            ) {

                return res.status(400).json({

                    sucesso: false,

                    erro:
                        "O nome do estabelecimento é obrigatório."

                });

            }

            const resultado =
    await pool.query(
        `
        UPDATE estabelecimentos

        SET
            nome = $1,
            descricao = $2,
            logo = $3,
            imagem_fundo = $4,
            cor = $5,
            whatsapp = $6,
            pix = $7,
            endereco = $8,
            horario = $9

        WHERE id = $10
        AND usuario_id = $11

        RETURNING
            id,
            nome,
            descricao,
            logo,
            imagem_fundo,
            cor,
            whatsapp,
            pix,
            endereco,
            horario
        `,
        [
            nome.trim(),
            descricao || "",
            logo || "",
            imagem_fundo || "",
            cor || "#222222",
            whatsapp || "",
            pix || "",
            endereco || "",
            horario || "",
            id,
            req.usuario.id
        ]
    );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    erro:
                        "Estabelecimento não encontrado ou não pertence ao usuário."

                });

            }

            res.json({

                sucesso: true,

                mensagem:
                    "Configuração salva com sucesso!",

                estabelecimento:
                    resultado.rows[0]

            });

        } catch (error) {

            console.error(
                "ERRO AO SALVAR CONFIGURAÇÃO:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    error.message

            });

        }

    }
);

// ==========================================
// BUSCAR CONFIGURAÇÃO
// ADMIN
// ==========================================

app.put(
    "/estabelecimentos/:id/configuracao",
    autenticarUsuario,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                nome,
                descricao,
                logo,
                imagemFundo,
                cor,
                whatsapp,
                pix,
                endereco,
                horario
            } = req.body;


            if (
                !nome ||
                !nome.trim()
            ) {

                return res.status(400).json({

                    sucesso: false,

                    erro:
                        "O nome do estabelecimento é obrigatório."

                });

            }


            const resultado =
                await pool.query(
                    `
                    UPDATE estabelecimentos

                    SET
                        nome = $1,
                        descricao = $2,
                        logo = $3,
                        imagem_fundo = $4,
                        cor = $5,
                        whatsapp = $6,
                        pix = $7,
                        endereco = $8,
                        horario = $9

                    WHERE id = $10
                    AND usuario_id = $11

                    RETURNING
                        id,
                        nome,
                        descricao,
                        logo,
                        imagem_fundo,
                        cor,
                        whatsapp,
                        pix,
                        endereco,
                        horario
                    `,
                    [
                        nome.trim(),
                        descricao || "",
                        logo || "",
                        imagemFundo || "",
                        cor || "#222222",
                        whatsapp || "",
                        pix || "",
                        endereco || "",
                        horario || "",
                        id,
                        req.usuario.id
                    ]
                );


            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    erro:
                        "Estabelecimento não encontrado ou não pertence ao usuário."

                });

            }


            res.json({

                sucesso: true,

                mensagem:
                    "Configuração salva com sucesso!",

                estabelecimento:
                    resultado.rows[0]

            });

        } catch (error) {

            console.error(
                "ERRO AO SALVAR CONFIGURAÇÃO:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    error.message

            });

        }

    }
);

// ==========================================
// CONFIGURAÇÃO PÚBLICA
// NÃO PRECISA DE LOGIN
// ==========================================

app.get(
    "/publico/estabelecimentos/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const resultado =
                await pool.query(
                    `
                    SELECT
                        id,
                        nome,
                        descricao,
                        logo,
                        imagem_fundo,
                        cor,
                        whatsapp,
                        endereco,
                        horario,
                        pix

                    FROM estabelecimentos

                    WHERE id = $1
                    `,
                    [
                        id
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    erro:
                        "Estabelecimento não encontrado."

                });

            }

            res.json({

                sucesso: true,

                estabelecimento:
                    resultado.rows[0]

            });

        } catch (error) {

            console.error(
                "ERRO AO BUSCAR ESTABELECIMENTO PÚBLICO:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao carregar estabelecimento."

            });

        }

    }
);

// ==========================================
// PRATOS DO ESTABELECIMENTO
// PÚBLICO
// ==========================================

app.get(
    "/estabelecimentos/:id/pratos",
    async (req, res) => {

        try {

            const { id } = req.params;

            const resultado = await pool.query(
                `
                SELECT
                    id,
                    nome,
                    descricao,
                    preco,
                    categoria,
                    imagem,
                    estabelecimento_id

                FROM pratos

                WHERE estabelecimento_id = $1

                ORDER BY id DESC
                `,
                [id]
            );

            res.json(resultado.rows);

        } catch (error) {

            console.error(
                "ERRO AO BUSCAR PRATOS:"
            );

            console.error(error);

            res.status(500).json({
                sucesso: false,
                erro: error.message
            });

        }

    }
);

// ==========================================
// CADASTRAR PRATO
// ==========================================

app.post(
    "/pratos",
    autenticarUsuario,
    async (req, res) => {

        try {

            const {
                nome,
                descricao,
                preco,
                categoria,
                imagem,
                estabelecimento_id
            } = req.body;

            if (
                !nome ||
                preco === undefined ||
                !estabelecimento_id
            ) {

                return res.status(400).json({

                    sucesso: false,

                    erro:
                        "Nome, preço e estabelecimento são obrigatórios."

                });

            }

            // ==================================
            // VERIFICAR DONO
            // ==================================

            const estabelecimento =
                await pool.query(
                    `
                    SELECT id
                    FROM estabelecimentos

                    WHERE id = $1
                    AND usuario_id = $2
                    `,
                    [
                        estabelecimento_id,
                        req.usuario.id
                    ]
                );

            if (
                estabelecimento.rows.length === 0
            ) {

                return res.status(403).json({

                    sucesso: false,

                    erro:
                        "Você não pode cadastrar pratos neste estabelecimento."

                });

            }

            // ==================================
            // CADASTRAR
            // ==================================

            const resultado =
                await pool.query(
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

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6
                    )

                    RETURNING *
                    `,
                    [
                        nome.trim(),
                        descricao || "",
                        preco,
                        categoria || "Outros",
                        imagem || "",
                        estabelecimento_id
                    ]
                );

            res.status(201).json({

                sucesso: true,

                mensagem:
                    "Prato cadastrado com sucesso!",

                prato:
                    resultado.rows[0]

            });

        } catch (error) {

            console.error(
                "ERRO AO CADASTRAR PRATO:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao cadastrar prato."

            });

        }

    }
);

// ==========================================
// EDITAR PRATO
// ==========================================

app.put(
    "/pratos/:id",
    autenticarUsuario,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const {
                nome,
                descricao,
                preco,
                categoria,
                imagem
            } = req.body;

            // ==================================
            // VERIFICAR DONO DO PRATO
            // ==================================

            const dono =
                await pool.query(
                    `
                    SELECT p.id

                    FROM pratos p

                    INNER JOIN estabelecimentos e
                        ON e.id = p.estabelecimento_id

                    WHERE p.id = $1
                    AND e.usuario_id = $2
                    `,
                    [
                        id,
                        req.usuario.id
                    ]
                );

            if (
                dono.rows.length === 0
            ) {

                return res.status(403).json({

                    sucesso: false,

                    erro:
                        "Você não pode editar este prato."

                });

            }

            const resultado =
                await pool.query(
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

            res.json({

                sucesso: true,

                mensagem:
                    "Prato atualizado com sucesso!",

                prato:
                    resultado.rows[0]

            });

        } catch (error) {

            console.error(
                "ERRO AO EDITAR PRATO:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao editar prato."

            });

        }

    }
);

// ==========================================
// EXCLUIR PRATO
// ==========================================

app.delete(
    "/pratos/:id",
    autenticarUsuario,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const resultado =
                await pool.query(
                    `
                    DELETE FROM pratos p

                    USING estabelecimentos e

                    WHERE p.id = $1

                    AND p.estabelecimento_id = e.id

                    AND e.usuario_id = $2

                    RETURNING p.*
                    `,
                    [
                        id,
                        req.usuario.id
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    erro:
                        "Prato não encontrado ou não pertence ao usuário."

                });

            }

            res.json({

                sucesso: true,

                mensagem:
                    "Prato excluído com sucesso!"

            });

        } catch (error) {

            console.error(
                "ERRO AO EXCLUIR PRATO:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao excluir prato."

            });

        }

    }
);

// ==========================================
// BUSCAR UM PRATO
// ==========================================

app.get(
    "/pratos/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const resultado =
                await pool.query(
                    `
                    SELECT *
                    FROM pratos
                    WHERE id = $1
                    `,
                    [
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

            res.json(
                resultado.rows[0]
            );

        } catch (error) {

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao buscar prato."

            });

        }

    }
);

// ==========================================
// REDEFINIR SENHA
// ==========================================

app.post(
    "/redefinir-senha",
    async (req, res) => {

        try {

            const {
                email,
                novaSenha,
                codigo
            } = req.body;

            if (
                !email ||
                !novaSenha ||
                !codigo
            ) {

                return res.status(400).json({

                    sucesso: false,

                    erro:
                        "E-mail, nova senha e código são obrigatórios."

                });

            }

            if (
                codigo !==
                process.env.RESET_PASSWORD_CODE
            ) {

                return res.status(401).json({

                    sucesso: false,

                    erro:
                        "Código de recuperação inválido."

                });

            }

            if (
                novaSenha.length < 6
            ) {

                return res.status(400).json({

                    sucesso: false,

                    erro:
                        "A nova senha deve ter pelo menos 6 caracteres."

                });

            }

            const emailLimpo =
                email
                    .trim()
                    .toLowerCase();

            const usuario =
                await pool.query(
                    `
                    SELECT id
                    FROM usuarios
                    WHERE email = $1
                    `,
                    [
                        emailLimpo
                    ]
                );

            if (
                usuario.rows.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    erro:
                        "Usuário não encontrado."

                });

            }

            await pool.query(
                `
                UPDATE usuarios

                SET senha = $1

                WHERE email = $2
                `,
                [
                    novaSenha,
                    emailLimpo
                ]
            );

            res.json({

                sucesso: true,

                mensagem:
                    "Senha redefinida com sucesso!"

            });

        } catch (error) {

            console.error(
                "ERRO AO REDEFINIR SENHA:"
            );

            console.error(error);

            res.status(500).json({

                sucesso: false,

                erro:
                    "Erro ao redefinir senha."

            });

        }

    }
);

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            `Servidor rodando na porta ${PORT}`
        );

    }
);
