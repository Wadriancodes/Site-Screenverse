const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./database.db");

db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    password TEXT
)
`);

app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    db.run(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, password],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Usuário cadastrado!" });
        }
    );
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.get(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        [email, password],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (user) {
                res.json({ message: "Login OK", user });
            } else {
                res.status(401).json({ message: "Credenciais inválidas" });
            }
        }
    );
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});

