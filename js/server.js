const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    credentials: true
}));
app.use(express.json());

app.use(session({
    secret:"porrq_de_chave_para_cripitografar_o_ID_da_sessao",
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        httpOnly: true,
        maxAge: 60 * 60 * 1000
     }
}));

const db = new sqlite3.Database("./database.db");

db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    password TEXT
)
`);

// -------------------- REGISTRO COM CRIPTOGRAFIA --------------------
app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    // PASSO 1: Gerar o salt (salt é uma string aleatória que adiciona segurança)
    // O número 15 é o "cost factor" - quanto maior, mais seguro mas mais lento
    bcrypt.genSalt(15, (err, salt) => {
        if (err) {
            return res.status(500).json({ error: "Erro ao gerar salt" });
        }

        // PASSO 2: Criptografar a senha usando o salt
        // bcrypt.hash(senha_original, salt, callback)
        bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
                return res.status(500).json({ error: "Erro ao criptografar senha" });
            }

            // PASSO 3: Salvar no banco de dados a senha CRIPTOGRAFADA (hash)
            // Nunca salve a senha original! Apenas o hash.
            db.run(
                "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                [username, email, hash], // Armazena o hash, não a senha original
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: "Usuário cadastrado!" });
                }
            );
        });
    });
});

// -------------------- LOGIN COM VERIFICAÇÃO DE SENHA --------------------
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    // PASSO 1: Buscar o usuário pelo email
    db.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!user) {
                return res.status(401).json({ message: "Credenciais inválidas" });
            }

            // PASSO 2: Comparar a senha fornecida com o hash armazenado
            // bcrypt.compare(senha_fornecida, hash_armazenado, callback)
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    return res.status(500).json({ error: "Erro ao verificar senha" });
                }

                if (isMatch) {
                    // PASSO 3: Senha correta - criar sessão
                    req.session.user = {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    };

                    req.session.save(err => {
                        if (err) {
                            return res.status(500).json({ error: "Erro ao salvar sessão" });
                        }
                        res.json({ message: "Login efetuado", user });
                    });
                } else {
                    // Senha incorreta
                    res.status(401).json({ message: "Senha inválida" });
                }
            });
        }
    );
});

app.get("/me", (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: "Não logado" });
    }
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});