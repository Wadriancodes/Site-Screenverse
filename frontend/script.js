
const PORT = 3000;

const cadastroForm = document.getElementById("cadastroform");

if (cadastroForm) {
    cadastroForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const user = document.getElementById("newUser").value;
        const email = document.getElementById("newEmail").value;
        const pass = document.getElementById("newPass").value;

        if (!user || !email || !pass) {
            alert("Por favor, preencha todos os campos!");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Por favor, insira um email válido!");
            return;
        }

        if (pass.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres!");
            return;
        }

        fetch(`http://localhost:${PORT}/register`, {
            method: "POST",
            credentials: "include",
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

const loginForm = document.getElementById("loginform");

if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        if (!email || !password) {
            alert("Por favor, preencha email e senha!");
            return;
        }

        fetch(`http://localhost:${PORT}/login`, {
            method: "POST",
            credentials: "include",
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

            if (data.user && data.user.username) {
                localStorage.setItem("loggedUser", data.user.username);
            } else {
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

const newsform = document.getElementById("news-form");

if (newsform) {

    newsform.addEventListener("submit", function (e) {

        e.preventDefault();

        const type = document.getElementById("news-type").value;
        const title = document.getElementById("news-title").value;
        const image = document.getElementById("news-image").files[0];
        const message = document.getElementById("news-content").value;

        const formData = new FormData();

        formData.append("category", type);
        formData.append("title", title);
        formData.append("image", image);
        formData.append("content", message);

        console.log("Enviando notícia:", { title, category: type, image });

        fetch(`http://localhost:${PORT}/news`, {
            method: "POST",
            credentials: "include",
            body: formData
        })
        .then(async response => {
            if (!response.ok) {
                try {
                    const err = await response.json();
                    const msg = err.error || err.message || `HTTP ${response.status}`;
                    throw new Error(msg);
                } catch {
                    throw new Error(`HTTP ${response.status}`);
                }
            }
            return response.json();
        })
        .then(data => {
            console.log("Resposta do servidor:", data);
            alert(data.message || "Notícia enviada com sucesso!");
            window.location.href = "../index.html";
        })
        .catch(error => {
            console.error("Erro ao enviar notícia:", error);
            alert("Erro ao enviar notícia: " + (error.message || error));
        });

    });

}

// Atualiza o botão de login para "Minha Conta" quando usuário estiver logado
function updateNavForLoggedUser() {
    const logged = localStorage.getItem("loggedUser");
    const navEls = document.querySelectorAll('.nav-login');
    navEls.forEach(a => {
        const inPages = window.location.pathname.includes('/pages/');
        if (logged) {
            const href = inPages ? 'redator.html' : './pages/redator.html';
            const imgSrc = inPages ? '../uploads/login_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg' : './uploads/login_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg';
            a.setAttribute('href', href);
            a.innerHTML = `Minha Conta <img src="${imgSrc}">`;
            a.classList.add('my-account');
        } else {
            const href = inPages ? 'login.html' : './pages/login.html';
            const imgSrc = inPages ? '../uploads/login_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg' : './uploads/login_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg';
            a.setAttribute('href', href);
            a.innerHTML = `Login <img src="${imgSrc}">`;
            a.classList.remove('my-account');
        }
    });

    // Adiciona botão de logout ao lado do link "Minha Conta"
    // Remove botão existente para evitar duplicação
    let existingLogout = document.getElementById('logout-btn');
    if (existingLogout) existingLogout.remove();

    if (logged) {
        const navContainer = document.querySelector('.nav-login') ? document.querySelector('.nav-login').parentElement : document.body;
        const btn = document.createElement('button');
        btn.id = 'logout-btn';
        btn.textContent = 'Sair';
        btn.style.marginLeft = '8px';
        btn.addEventListener('click', () => {
            // Chama API de logout no servidor e limpa localStorage
            fetch(`http://localhost:${PORT}/logout`, { method: 'POST', credentials: 'include' })
                .finally(() => {
                    localStorage.removeItem('loggedUser');
                    updateNavForLoggedUser();
                    window.location.href = inPages ? '../index.html' : './index.html';
                });
        });
        // Inserir após o último .nav-login na página
        const lastNav = navEls[navEls.length - 1];
        if (lastNav && lastNav.parentElement) {
            lastNav.parentElement.insertBefore(btn, lastNav.nextSibling);
        } else {
            document.body.appendChild(btn);
        }
    }

}

document.addEventListener('DOMContentLoaded', updateNavForLoggedUser);