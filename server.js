const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ================================
// CONFIGURAÇÕES
// ================================

app.use(cors());
app.use(express.json());

// Servir os arquivos do site
app.use(express.static(path.join(__dirname)));

// ================================
// ROTA PRINCIPAL
// ================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ================================
// TESTE DA API
// ================================

app.get("/api", (req, res) => {
    res.json({
        sucesso: true,
        mensagem: "API do restaurante funcionando!"
    });
});

// ================================
// PORTA
// ================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
