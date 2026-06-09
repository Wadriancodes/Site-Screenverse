const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const path = require("path");
const dotenv = require("dotenv");
const multer = require("multer");
const hemelt = require("helmet");

dotenv.config({ path: path.join(__dirname, ".env") });

let SECRET_KEY = process.env.ENCRYPTION_KEY;
let HASH_PEPPER = process.env.HASH_PEPPER;
const DB_PATH = process.env.DB_PATH ? path.resolve(__dirname, process.env.DB_PATH) : path.join(__dirname, "database.db");
const PORT = parseInt(process.env.PORT, 10) || 3000;

function assertEnv() {
    if (!SECRET_KEY) {
        console.error("ENCRYPTION_KEY não definida. Defina em .env ou em variáveis de ambiente.");
        process.exit(1);
    }
    if (!HASH_PEPPER) {
        console.error("HASH_PEPPER não definida. Defina em .env ou em variáveis de ambiente.");
        process.exit(1);
    }
    let keyBuf;
    try {
        keyBuf = Buffer.from(SECRET_KEY, "hex");
    } catch (e) {
        console.error("ENCRYPTION_KEY deve ser uma string hex válida com 64 caracteres (32 bytes).", e.message);
        process.exit(1);
    }
    if (keyBuf.length !== 32) {
        console.error("ENCRYPTION_KEY deve ser uma string hex de 64 caracteres (32 bytes).");
        process.exit(1);
    }
}
assertEnv();


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

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "http://localhost:3000"],
            connectSrc: ["'self'", "http://localhost:3000"]
        }
    }
}));

const isProduction = process.env.NODE_ENV === "production";

app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.use(session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 60 * 60 * 1000
     }
}));

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email_encrypted TEXT,
    email_iv TEXT,
    email_auth_tag TEXT,
    email_hash TEXT UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
)
    `);

    db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
            console.error("Erro ao verificar colunas da tabela users:", err.message);
            return;
        }
        const hasRoleColumn = columns.some(column => column.name === "role");
        if (!hasRoleColumn) {
            db.run("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'", err => {
                if (err) {
                    console.error("Erro ao adicionar coluna role à tabela users:", err.message);
                }
            });
        }
    });
});

app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    bcrypt.genSalt(12, (err, salt) => {
        if (err) {
            return res.status(500).json({ error: "Erro ao gerar salt" });
        }

        bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
                return res.status(500).json({ error: "Erro ao criptografar senha" });
            }

            const encryptedParts = encrypt(email).split(":");
            const emailIv = encryptedParts[0];
            const emailEncrypted = encryptedParts[1];
            const emailAuthTag = encryptedParts[2];

            db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                const role = row.count === 0 ? "admin" : "user";

                db.run(
                    "INSERT INTO users (username, email_encrypted, email_iv, email_auth_tag, email_hash, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [username, emailEncrypted, emailIv, emailAuthTag, hashEmail(email), hash, role],
                    function (err) {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ message: `Usuário cadastrado como ${role}!` });
                    }
                );
            });
        });
    });
});

function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ message: "Usuário não autenticado" });
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === "admin") {
        return next();
    }
    res.status(403).json({ message: "Acesso negado" });
}

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
                        username: user.username,
                        role: user.role || "user",
                        userEmail: user.email,
                        userEmailIv: user.email_iv,
                        userEmailAuthTag: user.email_auth_tag,
                        userEmailHash: user.email_hash
                    };

                    req.session.save(err => {
                        if (err) {
                            return res.status(500).json({ error: "Erro ao salvar sessão" });
                        }
                        res.json({ message: "Login efetuado", user: { id: user.id, username: user.username, role: req.session.user.role } });
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

app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Erro ao destruir sessão" });
        }
        res.json({ message: "Logout efetuado" });
    });
});

app.post("/admin/redator", requireLogin, requireAdmin, (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    bcrypt.genSalt(12, (err, salt) => {
        if (err) {
            return res.status(500).json({ error: "Erro ao gerar salt" });
        }

        bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
                return res.status(500).json({ error: "Erro ao criptografar senha" });
            }

            const encryptedParts = encrypt(email).split(":");
            const emailIv = encryptedParts[0];
            const emailEncrypted = encryptedParts[1];
            const emailAuthTag = encryptedParts[2];

            db.run(
                "INSERT INTO users (username, email_encrypted, email_iv, email_auth_tag, email_hash, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [username, emailEncrypted, emailIv, emailAuthTag, hashEmail(email), hash, "redator"],
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: "Redator criado com sucesso!", userId: this.lastID });
                }
            );
        });
    });
});

app.get("/admin/users", requireLogin, requireAdmin, (req, res) => {
    db.all("SELECT id, username, role FROM users ORDER BY role DESC, username", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));

});

    db.run(
        `CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            image TEXT,
            author_id INTEGER NOT NULL,
            author_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    )

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    } ,
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post("/news", upload.single("image"), (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { title, content } = req.body;
    const category = req.body.category || req.body.type || "geral";
    const image = req.file ? req.file.filename : null;

    // Se não houver imagem, prevenir INSERT que viola o NOT NULL da coluna
    if (!image) {
        return res.status(400).json({ error: "Imagem é obrigatória" });
    }

    db.run(
        "INSERT INTO news (title, content, category, image, author_id, author_name) VALUES (?, ?, ?, ?, ?, ?)",
        [title, content, category, image, req.session.user.id, req.session.user.username],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Notícia criada!", newsId: this.lastID });
        }
    );
});

app.get("/news", (req, res) => {
    const category = req.query.category;
    let query = "SELECT * FROM news";
    let params = [];
    if (category) {
        query += " WHERE category = ?";
        params.push(category);
    }
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get("/news/:id", (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }

    db.get("SELECT * FROM news WHERE id = ?", [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Notícia não encontrada" });
        }
        res.json(row);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});