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

        localStorage.setItem("userData", JSON.stringify(userData));

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

        const userData = JSON.parse(localStorage.getItem("userData"));

        if (userData && email === userData.email && password === userData.password) {
            alert('Logado com sucesso!');
            window.location.href = "index.html";
        } else {
            alert('Email ou senha inválidos.');
        }
    });
}