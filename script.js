// CADASTRO
const cadastroForm = document.getElementById('cadastro-form');

if (cadastroForm) {
    cadastroForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const user = document.getElementById("newUser").value;
        const email = document.getElementById("newEmail").value;
        const pass = document.getElementById("newPass").value;

        const userData = {
            username: user,
            email: email,
            password: pass
        };

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
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            window.location.href = "login.html";
        });

        alert("Cadastro realizado!");
        window.location.href = "login.html";
    });
}


// LOGIN
const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

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
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                alert("Login OK");
                window.location.href = "index.html";
            } else {
                alert("Erro no login");
            }
        });

        if (userData && email === userData.email && password === userData.password) {
            alert('Logado com sucesso!');
            window.location.href = "index.html";
        } else {
            alert('Email ou senha inválidos.');
        }
    });
}