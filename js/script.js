// -------------------- CADASTRO --------------------
const cadastroForm = document.getElementById("cadastroform");

if (cadastroForm) {
    cadastroForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const user = document.getElementById("newUser").value;
        const email = document.getElementById("newEmail").value;
        const pass = document.getElementById("newPass").value;

        fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: user,
                email: email,
                password: pass
            })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message || "Cadastro realizado!");
            window.location.href = "login.html";
        })
        .catch(error => {
            console.error("Erro no cadastro:", error);
            alert("Erro ao cadastrar usuário");
        });
    });
}


// -------------------- LOGIN --------------------
const loginForm = document.getElementById("loginform");

if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Login inválido");
            }
            return response.json();
        })
        .then(data => {
            alert("Login realizado com sucesso!");

            // opcional: salvar usuário logado
            localStorage.setItem("loggedUser", data.user.username);

            window.location.href = "index.html";
        })
        .catch(error => {
            console.error("Erro no login:", error);
            alert("Email ou senha inválidos");
        });
    });
}
// -------------------- COOKIES --------------------
