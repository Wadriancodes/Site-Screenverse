const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const fs = require("fs");


const envContent = fs.readFileSync("./sla.env", "utf8");
const getEnvValue = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.+)`));
    return match ? match[1].trim() : null;
};

const SECRET_KEY = getEnvValue("ENCRYPTION_KEY");
const HASH_PEPPER = getEnvValue("HASH_PEPPER");


function encrypt(text) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(SECRET_KEY, "hex"), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}


function hashEmail(email) {
    return crypto.createHmac("sha256", HASH_PEPPER).update(email).digest("hex");
}

const app = express();
app.use(cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    credentials: true
}));
app.use(express.json());

app.use(session({
    secret: SECRET_KEY,
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
    username TEXT UNIQUE,
    email_encrypted TEXT,
    email_iv TEXT,
    email_auth_tag TEXT,
    email_hash TEXT UNIQUE,
    password TEXT
)
`);

app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    bcrypt.genSalt(12, (err, salt) => {
        if (err) {
            return res.status(500).json({ error: "Erro ao gerar salt" });
        }

        bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
                return res.status(500).json({ error: "Erro ao criptografar senha" });
            }

            db.run(
                "INSERT INTO users (username, email_encrypted, email_iv, email_auth_tag, email_hash, password) VALUES (?, ?, ?, ?, ?, ?)",
                [username, ...encrypt(email).split(":"), hash], 
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

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const emailHash = hashEmail(email);
    
    db.get(
        "SELECT * FROM users WHERE email_hash = ?",
        [emailHash],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!user) {
                return res.status(401).json({ message: "Credenciais inválidas" });
            }
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    return res.status(500).json({ error: "Erro ao verificar senha" });
                }

                if (isMatch) {
                    req.session.user = {
                        id: user.id,
                        username: user.username
                    };

                    req.session.save(err => {
                        if (err) {
                            return res.status(500).json({ error: "Erro ao salvar sessão" });
                        }
                        res.json({ message: "Login efetuado", user: { id: user.id, username: user.username } });
                    });
                } else {
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