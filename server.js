const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
    process.env.JWT_SECRET || "chave-temporaria-restaurante";

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

// ======================================
// 7. TABELA DE USUÁRIOS
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

console.log("Tabela usuarios pronta!");

// ======================================
// 8. VINCULAR ESTABELECIMENTOS A USUÁRIOS
// ======================================

await pool.query(`
    ALTER TABLE estabelecimentos
    ADD COLUMN IF NOT EXISTS usuario_id INTEGER
`);

// ======================================
// 9. PERSONALIZAÇÃO DO CARDÁPIO
// ======================================

await pool.query(`
    ALTER TABLE estabelecimentos
    ADD COLUMN IF NOT EXISTS descricao TEXT,
    ADD COLUMN IF NOT EXISTS logo TEXT,
    ADD COLUMN IF NOT EXISTS cor VARCHAR(20),
    ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30),
    ADD COLUMN IF NOT EXISTS endereco TEXT,
    ADD COLUMN IF NOT EXISTS horario TEXT
`);

console.log("Colunas de personalização prontas!");

console.log("Coluna usuario_id pronta!");

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
// AUTENTICAÇÃO
// ==========================================

function autenticarUsuario(req, res, next) {

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

        const token = partes[1];

        const usuario =
            jwt.verify(token, JWT_SECRET);

        req.usuario = usuario;

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
        mensagem: "API do restaurante funcionando!",
        banco: "PostgreSQL"
    });
});

// ==========================================
// LISTAR ESTABELECIMENTOS DO USUÁRIO
// ==========================================

app.get(
    "/estabelecimentos",
    autenticarUsuario,
    async (req, res) => {

        try {

            const resultado = await pool.query(
                `
                SELECT
                    id,
                    nome,
                    criado_em
                FROM estabelecimentos
                WHERE usuario_id = $1
                ORDER BY id ASC
                `,
                [req.usuario.id]
            );

            res.json(resultado.rows);

        } catch (error) {

            console.error(
                "ERRO AO BUSCAR ESTABELECIMENTOS:"
            );

            console.error(error);

            res.status(500).json({
                sucesso: false,
                erro: "Erro ao buscar estabelecimentos"
            });

        }

    }
);

// ==========================================
// LISTAR PRATOS
// ==========================================

app.get("/pratos", autenticarUsuario, async (req, res) => {

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
            imagem,
            estabelecimento_id
        } = req.body;


        // ======================================
        // VALIDAR DADOS
        // ======================================

        if (!nome || preco === undefined || !estabelecimento_id) {

            return res.status(400).json({
                erro: "Nome, preço e estabelecimento são obrigatórios"
            });

        }


        // ======================================
        // VERIFICAR ESTABELECIMENTO
        // ======================================

        const estabelecimento = await pool.query(
            `
            SELECT id, nome
            FROM estabelecimentos
            WHERE id = $1
            `,
            [estabelecimento_id]
        );


        if (estabelecimento.rows.length === 0) {

            return res.status(404).json({
                erro: "Estabelecimento não encontrado"
            });

        }


        // ======================================
        // CADASTRAR PRATO
        // ======================================

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
                estabelecimento_id
            ]
        );


        res.status(201).json(resultado.rows[0]);


    } catch (error) {

        console.error("ERRO AO CADASTRAR PRATO:");
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
// SALVAR PERSONALIZAÇÃO DO ESTABELECIMENTO
// ==========================================

app.put(
    "/estabelecimentos/:id/configuracao",
    autenticarUsuario,
    async (req, res) => {

        try {

            const { id } = req.params;

            const {
                nome,
                descricao,
                logo,
                cor,
                whatsapp,
                endereco,
                horario
            } = req.body;


            // ======================================
            // VALIDAR NOME
            // ======================================

            if (!nome || !nome.trim()) {

                return res.status(400).json({
                    sucesso: false,
                    erro: "O nome do estabelecimento é obrigatório."
                });

            }


            // ======================================
            // ATUALIZAR
            // ======================================

            const resultado = await pool.query(
                `
                UPDATE estabelecimentos
                SET
                    nome = $1,
                    descricao = $2,
                    logo = $3,
                    cor = $4,
                    whatsapp = $5,
                    endereco = $6,
                    horario = $7
                WHERE id = $8
                AND usuario_id = $9
                RETURNING
                    id,
                    nome,
                    descricao,
                    logo,
                    cor,
                    whatsapp,
                    endereco,
                    horario
                `,
                [
                    nome.trim(),
                    descricao || "",
                    logo || "",
                    cor || "#222222",
                    whatsapp || "",
                    endereco || "",
                    horario || "",
                    id,
                    req.usuario.id
                ]
            );


            // ======================================
            // VERIFICAR ESTABELECIMENTO
            // ======================================

            if (resultado.rows.length === 0) {

                return res.status(404).json({
                    sucesso: false,
                    erro: "Estabelecimento não encontrado ou não pertence ao usuário."
                });

            }


            res.json({
                sucesso: true,
                mensagem: "Configuração salva com sucesso!",
                estabelecimento: resultado.rows[0]
            });


        } catch (error) {

            console.error(
                "ERRO AO SALVAR CONFIGURAÇÃO:"
            );

            console.error(error);


            res.status(500).json({
                sucesso: false,
                erro: "Erro ao salvar configuração"
            });

        }

    }
);

// ==========================================
// BUSCAR PERSONALIZAÇÃO DO ESTABELECIMENTO
// ==========================================

app.get(
    "/estabelecimentos/:id/configuracao",
    autenticarUsuario,
    async (req, res) => {

        try {

            const { id } = req.params;

            const resultado = await pool.query(
                `
                SELECT
                    id,
                    nome,
                    descricao,
                    logo,
                    cor,
                    whatsapp,
                    endereco,
                    horario
                FROM estabelecimentos
                WHERE id = $1
                AND usuario_id = $2
                `,
                [
                    id,
                    req.usuario.id
                ]
            );


            if (resultado.rows.length === 0) {

                return res.status(404).json({
                    sucesso: false,
                    erro: "Estabelecimento não encontrado ou não pertence ao usuário."
                });

            }


            res.json({
                sucesso: true,
                estabelecimento: resultado.rows[0]
            });


        } catch (error) {

            console.error(
                "ERRO AO BUSCAR CONFIGURAÇÃO:"
            );

            console.error(error);


            res.status(500).json({
                sucesso: false,
                erro: "Erro ao buscar configuração"
            });

        }

    }
);

// ==========================================
// INICIAR SERVIDOR
// ==========================================
// ==========================================
// CRIAR ESTABELECIMENTO
// ==========================================

app.post(
    "/estabelecimentos",
    autenticarUsuario,
    async (req, res) => {

        try {

            const { nome } = req.body;

            if (!nome || !nome.trim()) {

                return res.status(400).json({
                    sucesso: false,
                    erro: "Nome do estabelecimento é obrigatório"
                });

            }

            const resultado = await pool.query(
                `
                INSERT INTO estabelecimentos
                (
                    nome,
                    usuario_id
                )
                VALUES ($1, $2)
                RETURNING *
                `,
                [
                    nome.trim(),
                    req.usuario.id
                ]
            );

            res.status(201).json({
                sucesso: true,
                estabelecimento: resultado.rows[0]
            });

        } catch (error) {

            console.error(
                "ERRO AO CRIAR ESTABELECIMENTO:"
            );

            console.error(error);

            res.status(500).json({
                sucesso: false,
                erro: "Erro ao criar estabelecimento"
            });

        }

    }
);

// ==========================================
// EXCLUIR ESTABELECIMENTO
// ==========================================

app.delete("/estabelecimentos/:id", autenticarUsuario, async (req, res) => {

    try {

        const { id } = req.params;

        const resultado = await pool.query(
            "DELETE FROM estabelecimentos WHERE id = $1 RETURNING *",
            [id]
        );

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                erro: "Estabelecimento não encontrado"
            });

        }

        res.json({
            sucesso: true,
            mensagem: "Estabelecimento excluído com sucesso!",
            estabelecimento: resultado.rows[0]
        });

    } catch (error) {

        console.error("ERRO AO EXCLUIR ESTABELECIMENTO:");
        console.error(error);

        res.status(500).json({
            sucesso: false,
            erro: error.message || "Erro ao excluir estabelecimento"
        });

    }

});
// ==========================================
// EDITAR ESTABELECIMENTO
// ==========================================

app.put(
    "/estabelecimentos/:id",
    autenticarUsuario,
    async (req, res) => {

    try {

        const { id } = req.params;
        const { nome } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({
                sucesso: false,
                erro: "Nome do estabelecimento é obrigatório"
            });
        }

        const resultado = await pool.query(
            `
            UPDATE estabelecimentos
            SET nome = $1
            WHERE id = $2
            RETURNING *
            `,
            [nome.trim(), id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                erro: "Estabelecimento não encontrado"
            });
        }

        res.json({
            sucesso: true,
            mensagem: "Estabelecimento atualizado com sucesso!",
            estabelecimento: resultado.rows[0]
        });

    } catch (error) {

        console.error("ERRO AO EDITAR ESTABELECIMENTO:");
        console.error(error);

        res.status(500).json({
            sucesso: false,
            erro: error.message || "Erro ao editar estabelecimento"
        });

    }

});

// ==========================================
// CADASTRAR USUÁRIO
// ==========================================

app.post("/usuarios", async (req, res) => {

    try {

        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {

            return res.status(400).json({
                sucesso: false,
                erro: "Nome, e-mail e senha são obrigatórios"
            });

        }

        const usuarioExistente = await pool.query(
            `
            SELECT id
            FROM usuarios
            WHERE email = $1
            `,
            [email.trim().toLowerCase()]
        );

        if (usuarioExistente.rows.length > 0) {

            return res.status(409).json({
                sucesso: false,
                erro: "Este e-mail já está cadastrado"
            });

        }

        const resultado = await pool.query(
            `
            INSERT INTO usuarios
            (
                nome,
                email,
                senha
            )
            VALUES ($1, $2, $3)
            RETURNING id, nome, email, criado_em
            `,
            [
                nome.trim(),
                email.trim().toLowerCase(),
                senha
            ]
        );

        res.status(201).json({
            sucesso: true,
            mensagem: "Usuário cadastrado com sucesso!",
            usuario: resultado.rows[0]
        });

    } catch (error) {

        console.error("ERRO AO CADASTRAR USUÁRIO:");
        console.error(error);

        res.status(500).json({
            sucesso: false,
            erro: "Erro ao cadastrar usuário"
        });

    }

});

// ==========================================
// LOGIN DE USUÁRIO
// ==========================================

app.post("/login", async (req, res) => {

    try {

        const { email, senha } = req.body;

        if (!email || !senha) {

            return res.status(400).json({
                sucesso: false,
                erro: "E-mail e senha são obrigatórios"
            });

        }

        const resultado = await pool.query(
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
                email.trim().toLowerCase()
            ]
        );

        if (resultado.rows.length === 0) {

            return res.status(401).json({
                sucesso: false,
                erro: "E-mail ou senha incorretos"
            });

        }

        const usuarioBanco =
            resultado.rows[0];

        if (usuarioBanco.senha !== senha) {

            return res.status(401).json({
                sucesso: false,
                erro: "E-mail ou senha incorretos"
            });

        }

        const token =
            jwt.sign(
                {
                    id: usuarioBanco.id,
                    nome: usuarioBanco.nome,
                    email: usuarioBanco.email
                },
                JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );

        res.json({
            sucesso: true,
            mensagem: "Login realizado com sucesso!",
            token: token,
            usuario: {
                id: usuarioBanco.id,
                nome: usuarioBanco.nome,
                email: usuarioBanco.email
            }
        });

    } catch (error) {

        console.error(
            "ERRO AO FAZER LOGIN:",
            error
        );

        res.status(500).json({
            sucesso: false,
            erro: "Erro ao fazer login"
        });

    }

});

// ==========================================
// REDEFINIR SENHA
// ==========================================

app.post("/redefinir-senha", async (req, res) => {

    try {

        const {
            email,
            novaSenha,
            codigo
        } = req.body;


        // ======================================
        // VALIDAR DADOS
        // ======================================

        if (!email || !novaSenha || !codigo) {

            return res.status(400).json({
                sucesso: false,
                erro: "E-mail, nova senha e código são obrigatórios."
            });

        }


        // ======================================
        // VERIFICAR CÓDIGO DE RECUPERAÇÃO
        // ======================================

        if (
            codigo !==
            process.env.RESET_PASSWORD_CODE
        ) {

            return res.status(401).json({
                sucesso: false,
                erro: "Código de recuperação inválido."
            });

        }


        // ======================================
        // VALIDAR SENHA
        // ======================================

        if (novaSenha.length < 6) {

            return res.status(400).json({
                sucesso: false,
                erro: "A nova senha deve ter pelo menos 6 caracteres."
            });

        }


        // ======================================
        // PROCURAR USUÁRIO
        // ======================================

        const usuario =
            await pool.query(
                `
                SELECT id, nome, email
                FROM usuarios
                WHERE email = $1
                `,
                [
                    email.trim().toLowerCase()
                ]
            );


        if (usuario.rows.length === 0) {

            return res.status(404).json({
                sucesso: false,
                erro: "Usuário não encontrado."
            });

        }


        // ======================================
        // ALTERAR SENHA
        // ======================================

        await pool.query(
            `
            UPDATE usuarios
            SET senha = $1
            WHERE email = $2
            `,
            [
                novaSenha,
                email.trim().toLowerCase()
            ]
        );


        // ======================================
        // RESPOSTA
        // ======================================

        res.json({
            sucesso: true,
            mensagem: "Senha redefinida com sucesso!"
        });


    } catch (error) {

        console.error(
            "ERRO AO REDEFINIR SENHA:"
        );

        console.error(error);


        res.status(500).json({
            sucesso: false,
            erro: "Erro ao redefinir senha."
        });

    }

});

app.get("/corrigir-estabelecimento", async (req, res) => {

    try {

        const resultado = await pool.query(`
            UPDATE estabelecimentos
            SET usuario_id = 1
            WHERE id = 1
            RETURNING *
        `);

        res.json({
            sucesso: true,
            mensagem: "Estabelecimento vinculado ao usuário 1!",
            estabelecimento: resultado.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            sucesso: false,
            erro: error.message
        });

    }

});

app.listen(PORT, () => {

    console.log(`Servidor rodando na porta ${PORT}`);

});
