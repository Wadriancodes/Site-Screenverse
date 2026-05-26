
const PORT = 3000;

// Proteger página do redator
if (window.location.pathname.includes('redator.html')) {
    const loggedUser = localStorage.getItem("loggedUser");
    if (!loggedUser) {
        alert("Você deve estar logado para acessar a página do redator!");
        window.location.href = "./login.html";
    }
}

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

            const inPages = window.location.pathname.includes('/pages/');
            window.location.href = inPages ? '../index.html' : './index.html';
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

        // Verificar se está autenticado
        const loggedUser = localStorage.getItem("loggedUser");
        if (!loggedUser) {
            alert("Você deve estar logado para enviar notícias!");
            window.location.href = "./login.html";
            return;
        }

        const type = document.getElementById("news-type").value;
        const title = document.getElementById("news-title").value;
        const image = document.getElementById("news-image").files[0];
        const message = document.getElementById("news-content").value;

        // Validações
        if (!title || title.trim() === "") {
            alert("Por favor, preencha o título da notícia!");
            return;
        }

        if (!message || message.trim() === "") {
            alert("Por favor, preencha o conteúdo da notícia!");
            return;
        }

        if (!type || type.trim() === "") {
            alert("Por favor, selecione um tipo!");
            return;
        }

        if (!image) {
            alert("Por favor, selecione uma imagem!");
            return;
        }

        const formData = new FormData();

        formData.append("category", type);
        formData.append("title", title);
        formData.append("image", image);
        formData.append("content", message);

        console.log("Enviando notícia:", { title, category: type, hasImage: !!image, contentLength: message.length });

        // Verificar se a sessão está ativa no servidor
        fetch(`http://localhost:${PORT}/me`, {
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Sessão expirada. Faça login novamente.");
            }
            return response.json();
        })
        .then(() => {
            // Sessão ativa, enviar notícia
            return fetch(`http://localhost:${PORT}/news`, {
                method: "POST",
                credentials: "include",
                body: formData
            });
        })
        .then(async response => {
            console.log("Status da resposta:", response.status);
            if (!response.ok) {
                try {
                    const err = await response.json();
                    const msg = err.error || err.message || `HTTP ${response.status}`;
                    console.error("Erro do servidor:", err);
                    throw new Error(msg);
                } catch (e) {
                    console.error("Erro ao processar resposta:", e);
                    throw new Error(`HTTP ${response.status}`);
                }
            }
            return response.json();
        })
        .then(data => {
            console.log("Resposta do servidor:", data);
            alert(data.message || "Notícia enviada com sucesso!");
            const inPages = window.location.pathname.includes('/pages/');
            window.location.href = inPages ? '../index.html' : './index.html';
        })
        .catch(error => {
            console.error("Erro ao enviar notícia:", error);
            
            if (error.message.includes("Sessão expirada")) {
                alert("Sua sessão expirou. Por favor, faça login novamente.");
                window.location.href = "./login.html";
            } else {
                alert("Erro ao enviar notícia: " + (error.message || error));
            }
        });

    });

}

const newsDetailContainer = document.querySelector("#news-detail");
const newsContainer = document.querySelector("#news-container");

if (newsDetailContainer) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        newsDetailContainer.innerHTML = "<p>ID da notícia não informado.</p>";
    } else {
        fetch(`http://localhost:${PORT}/news/${id}`, {
            credentials: "include"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(news => {
                newsDetailContainer.innerHTML = `
                    <article class="news-detail-card">
                        <img src="http://localhost:${PORT}/uploads/${news.image}" alt="${news.title}">
                        <h1>${news.title}</h1>
                        <p class="news-category">${news.category}</p>
                        <p class="news-content">${news.content}</p>
                    </article>
                `;
            })
            .catch(error => {
                console.error("Erro ao carregar notícia:", error);
                newsDetailContainer.innerHTML = "<p>Erro ao carregar notícia. Tente novamente mais tarde.</p>";
            });
    }
} else if (newsContainer) {
    fetch(`http://localhost:${PORT}/news`, {
        credentials: "include"
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            newsContainer.innerHTML = "";
            const inPages = window.location.pathname.includes('/pages/');
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(news => {
                    const card = document.createElement("div");
                    card.classList.add("card");
                    const newsHref = inPages ? `news.html?id=${news.id}` : `./pages/news.html?id=${news.id}`;
                    card.innerHTML = `
                        <img src="http://localhost:${PORT}/uploads/${news.image}" alt="${news.title}">
                        <a href="${newsHref}"><h3>${news.title}</h3></a>
                        <p>${news.content}</p>
                    `;
                    newsContainer.appendChild(card);
                });
            } else {
                newsContainer.innerHTML = "<p>Nenhuma notícia disponível.</p>";
            }
        })
        .catch(error => {
            console.error("Erro ao carregar notícias:", error);
            newsContainer.innerHTML = "<p>Erro ao carregar notícias. Tente novamente mais tarde.</p>";
        });
}

function updateNavForLoggedUser() {
    const logged = localStorage.getItem("loggedUser");
    const navEls = document.querySelectorAll('.nav-login');
    navEls.forEach(a => {
        const inPages = window.location.pathname.includes('/pages/');
        if (logged) {
            const href = inPages ? 'index.html' : '../index.html';
            const imgSrc = inPages ? '../uploads/login_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg' : './uploads/login_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg';
            a.setAttribute('href', href);
            a.innerHTML = `Minha Conta <img src="${imgSrc}">`;
            a.classList.add('my-account');
        } else {
            const href = inPages ? 'login.html' : '../pages/login.html';
            const imgSrc = inPages ? '../uploads/login_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg' : './uploads/login_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg';
            a.setAttribute('href', href);
            a.innerHTML = `Login <img src="${imgSrc}">`;
            a.classList.remove('my-account');
        }
    });

    let existingLogout = document.getElementById('logout-btn');
    if (existingLogout) existingLogout.remove();

    if (logged) {
        const navContainer = document.querySelector('.nav-login') ? document.querySelector('.nav-login').parentElement : document.body;
        const btn = document.createElement('button');
        btn.id = 'logout-btn';
        btn.textContent = 'Sair';
        btn.addEventListener('click', () => {

            fetch(`http://localhost:${PORT}/logout`, { method: 'POST', credentials: 'include' })
                .finally(() => {
                    localStorage.removeItem('loggedUser');
                    updateNavForLoggedUser();
                    window.location.href = inPages ? '../index.html' : './index.html';
                });
        });

        const lastNav = navEls[navEls.length - 1];
        if (lastNav && lastNav.parentElement) {
            lastNav.parentElement.insertBefore(btn, lastNav.nextSibling);
        } else {
            document.body.appendChild(btn);
        }
    }

}

document.addEventListener('DOMContentLoaded', updateNavForLoggedUser);