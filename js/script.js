// -------------------- CADASTRO --------------------
const cadastroForm = document.getElementById("cadastroform");

if (cadastroForm) {
    cadastroForm.addEventListener("submit", function (e) {
        e.preventDefault();

        // PASSO 1: Obter os valores dos campos
        const user = document.getElementById("newUser").value;
        const email = document.getElementById("newEmail").value;
        const pass = document.getElementById("newPass").value;

        // PASSO 2: Validar que todos os campos estão preenchidos
        if (!user || !email || !pass) {
            alert("Por favor, preencha todos os campos!");
            return;
        }

        // PASSO 3: Validar formato básico do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Por favor, insira um email válido!");
            return;
        }

        // PASSO 4: Validar tamanho mínimo da senha (ex: 6 caracteres)
        if (pass.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres!");
            return;
        }

        // PASSO 5: Enviar dados para o servidor
        fetch("http://localhost:3000/register", {
            method: "POST",
            credentials: "include", // Inclui cookies para manter sessão
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

        // PASSO 1: Obter os valores dos campos
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        // PASSO 2: Validar que todos os campos estão preenchidos
        if (!email || !password) {
            alert("Por favor, preencha email e senha!");
            return;
        }

        // PASSO 3: Enviar dados para o servidor
        // O servidor vai comparar a senha com o hash armazenado usando bcrypt
        fetch("http://localhost:3000/login", {
            method: "POST",
            credentials: "include", // Importante: permite enviar/receber cookies da sessão
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

            // PASSO 4: Verificar se data.user existe antes de acessar propriedades
            if (data.user && data.user.username) {
                localStorage.setItem("loggedUser", data.user.username);
            } else {
                // Fallback: usar email se username não estiver disponível
                localStorage.setItem("loggedUser", email);
            }

            window.location.href = "../index.html";
        })
        .catch(error => {
            console.error("Erro no login:", error);
            alert("Email ou senha inválidos");
        });
    });
}
