
const PORT = 3000;
const apiBase = `http://localhost:${PORT}`;
const roleLinks = [];

const protectedPages = [
    { file: 'redator.html', roles: ['admin', 'redator'] },
    { file: 'admin.html', roles: ['admin'] }
];

function getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1);
}

function getNewsCategoryFilter() {
    const page = getCurrentPage().replace('.html', '');
    if (page === 'filmes') return 'filme';
    if (page === 'series') return 'serie';
    if (page === 'animes') return 'anime';
    return null;
}

function redirectToLogin() {
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? 'login.html' : './pages/login.html';
}

function checkProtectedPage() {
    const currentPage = getCurrentPage();
    const rule = protectedPages.find(page => page.file === currentPage);
    if (!rule) {
        return;
    }

    fetch(`${apiBase}/me`, { credentials: 'include' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Não autenticado');
            }
            return response.json();
        })
        .then(user => {
            if (!rule.roles.includes(user.role)) {
                alert('Acesso restrito a esta área.');
                redirectToLogin();
            }
        })
        .catch(() => {
            alert('Faça login para acessar esta página.');
            redirectToLogin();
        });
}

checkProtectedPage();

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

        if (document.getElementById("confirmPass").value !== pass) {
            alert("As senhas não coincidem!");
            return;
        }

        fetch(`${apiBase}/register`, {
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
        const tentativeLoginCount = parseInt(localStorage.getItem('tentativeLoginCount') || '0', 10);
        if (tentativeLoginCount >= 5) {
            alert("Muitas tentativas de login. Tente novamente mais tarde.");
            return;
        }
        const rememberMe = document.getElementById("remember-me").checked;
        const sessionDuration = rememberMe ? 7 * 24 * 60 * 60 * 1000 : null; // 7 dias em milissegundos
        const sessionExpiry = sessionDuration ? new Date(Date.now() + sessionDuration).toISOString() : null;
        const sessionExpiryInput = document.getElementById("session-expiry");
        if (sessionExpiryInput) {
            sessionExpiryInput.value = sessionExpiry;
        }



        if (!email || !password) {
            alert("Por favor, preencha email e senha!");
            return;
        }

        fetch(`${apiBase}/login`, {
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
                localStorage.setItem('tentativeLoginCount', (tentativeLoginCount + 1).toString());
                throw new Error("Login inválido");
            }
            return response.json();
        })
        .then(data => {
            localStorage.removeItem('tentativeLoginCount');
            alert("Login realizado com sucesso!");

            const role = data.user?.role || 'user';
            const uid = data.user?.id || null;
            if (data.user && data.user.username) {
                localStorage.setItem("loggedUser", data.user.username);
                localStorage.setItem("loggedUserRole", role);
                if (uid) localStorage.setItem('loggedUserId', String(uid));
            } else {
                localStorage.setItem("loggedUser", email);
                localStorage.setItem("loggedUserRole", role);
                if (uid) localStorage.setItem('loggedUserId', String(uid));
            }

            const inPages = window.location.pathname.includes('/pages/');
            if (role === 'admin') {
                window.location.href = `${apiBase}/pages/admin.html`;
            } else if (role === 'redator') {
                window.location.href = `${apiBase}/pages/redator.html`;
            } else {
                window.location.href = `${apiBase}/index.html`;
            }
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
        fetch(`${apiBase}/me`, {
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
            return fetch(`${apiBase}/news`, {
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
        fetch(`${apiBase}/news/${id}`, {
            credentials: "include"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(news => {
                newsDetailContainer.innerHTML = "";

                const article = document.createElement("article");
                article.classList.add("news-detail-card");

                const image = document.createElement("img");
                image.src = `${apiBase}/uploads/${encodeURIComponent(news.image)}`;
                image.alt = news.title || "Imagem da noticia";

                const title = document.createElement("h1");
                title.textContent = news.title;

                const meta = document.createElement("div");
                meta.classList.add("news-meta");

                const category = document.createElement("span");
                category.classList.add("news-category");
                category.textContent = news.category;

                const author = document.createElement("span");
                author.classList.add("news-author");
                author.textContent = `por ${news.author_name}`;

                const content = document.createElement("p");
                content.classList.add("news-content");
                content.textContent = news.content;

                meta.append(category, author);
                article.append(image, title, meta, content);
                newsDetailContainer.appendChild(article);
            })
            .catch(error => {
                console.error("Erro ao carregar notícia:", error);
                newsDetailContainer.innerHTML = "<p>Erro ao carregar notícia. Tente novamente mais tarde.</p>";
            });
    }
} else if (newsContainer) {
    const categoryFilter = getNewsCategoryFilter();
    const url = categoryFilter ? `${apiBase}/news?category=${encodeURIComponent(categoryFilter)}` : `${apiBase}/news`;
    fetch(url, {
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
                const userRole = localStorage.getItem('loggedUserRole');
                const userId = Number(localStorage.getItem('loggedUserId')) || null;
                data.forEach(news => {
                    const card = document.createElement("div");
                    card.classList.add("card");
                    const newsHref = inPages ? `news.html?id=${news.id}` : `./pages/news.html?id=${news.id}`;

                    const image = document.createElement("img");
                    image.src = `${apiBase}/uploads/${encodeURIComponent(news.image)}`;
                    image.alt = news.title || "Imagem da noticia";

                    const link = document.createElement("a");
                    link.href = newsHref;

                    const title = document.createElement("h3");
                    title.textContent = news.title;

                    link.appendChild(title);

                    // botão de remover se admin ou autor da notícia
                    let removeBtn = null;
                    if (userRole === 'admin' || (userRole === 'redator' && userId === news.author_id)) {
                        removeBtn = document.createElement('button');
                        removeBtn.textContent = 'Remover';
                        removeBtn.classList.add('delete-news');
                        removeBtn.setAttribute('data-news-id', String(news.id));
                        removeBtn.addEventListener('click', () => {
                            if (!confirm('Remover esta notícia?')) return;
                            fetch(`${apiBase}/news/${news.id}`, { method: 'DELETE', credentials: 'include' })
                                .then(r => {
                                    if (!r.ok) return r.json().then(err => { throw new Error(err.error || err.message || 'Erro'); });
                                    return r.json();
                                })
                                .then(() => {
                                    card.remove();
                                })
                                .catch(err => alert('Erro: ' + (err.message || err)));
                        });
                    }

                    card.append(image, link);
                    if (removeBtn) card.appendChild(removeBtn);
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

const addRedatorForm = document.getElementById('add-redator-form');
const userListContainer = document.getElementById('user-list');

function loadUsersForAdmin() {
    if (!userListContainer) {
        return;
    }

    fetch(`${apiBase}/admin/users`, { credentials: 'include' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Não foi possível carregar os usuários.');
            }
            return response.json();
        })
        .then(users => {
            userListContainer.innerHTML = "";
            if (!Array.isArray(users) || users.length === 0) {
                userListContainer.innerHTML = '<p>Nenhum usuario cadastrado.</p>';
                return;
            }

            users.forEach(user => {
                const card = document.createElement("div");
                card.classList.add("user-card");

                const username = document.createElement("strong");
                username.textContent = user.username;

                const roleEl = document.createElement("span");
                roleEl.classList.add("user-role");
                roleEl.textContent = user.role;

                card.append(username, roleEl);

                // botão de remover (apenas para non-admins)
                if (user.role !== 'admin') {
                    const del = document.createElement('button');
                    del.textContent = 'Remover';
                    del.classList.add('delete-user');
                    del.setAttribute('data-user-id', String(user.id));
                    del.addEventListener('click', () => {
                        if (!confirm('Remover este usuário?')) return;
                        fetch(`${apiBase}/admin/user/${user.id}`, { method: 'DELETE', credentials: 'include' })
                            .then(r => {
                                if (!r.ok) return r.json().then(err => { throw new Error(err.error || err.message || 'Erro'); });
                                return r.json();
                            })
                            .then(() => loadUsersForAdmin())
                            .catch(err => alert('Erro: ' + (err.message || err)));
                    });
                    card.appendChild(del);
                }

                userListContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error(error);
            userListContainer.innerHTML = '<p>Erro ao carregar usuários.</p>';
        });
}

if (addRedatorForm) {
    addRedatorForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('redator-username').value.trim();
        const email = document.getElementById('redator-email').value.trim();
        const password = document.getElementById('redator-password').value.trim();

        if (!username || !email || !password) {
            alert('Preencha todos os campos para cadastrar um redator.');
            return;
        }

        fetch(`${apiBase}/admin/redator`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || err.message || 'Erro ao criar redator'); });
                }
                return response.json();
            })
            .then(data => {
                alert(data.message || 'Redator criado com sucesso!');
                addRedatorForm.reset();
                loadUsersForAdmin();
            })
            .catch(error => {
                console.error(error);
                alert(error.message || 'Erro ao criar redator.');
            });
    });
}

if (userListContainer) {
    loadUsersForAdmin();
}

const params = new URLSearchParams(window.location.search);

const newsid = params.get("newsid");

console.log("ID da notícia:", newsid);

function updateNavForLoggedUser() {
    let logged = localStorage.getItem("loggedUser");
    const navEls = document.querySelectorAll('.nav-login');
    // Se não houver estado local, tentar recuperar do servidor (útil quando a página
    // é servida pelo backend em outro origin como http://localhost:3000)
    if (!logged) {
        fetch(`${apiBase}/me`, { credentials: 'include' })
            .then(r => {
                if (!r.ok) throw new Error('no session');
                return r.json();
            })
            .then(user => {
                localStorage.setItem('loggedUser', user.username || ('user'+user.id));
                localStorage.setItem('loggedUserRole', user.role || 'user');
                if (user.id) localStorage.setItem('loggedUserId', String(user.id));
                // reexecutar para aplicar mudanças na UI
                updateNavForLoggedUser();
            })
            .catch(() => {
                // nada a fazer se não houver sessão
            });
        // continuar execução; UI será atualizada quando fetch completar
        logged = localStorage.getItem("loggedUser");
    }
    navEls.forEach(a => {
        const inPages = window.location.pathname.includes('/pages/');
        if (logged) {
            const href = inPages ? 'index.html' : '../index.html';
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

    let existingLogout = document.getElementById('logout-btn');
    if (existingLogout) existingLogout.remove();

    const existingRoleLink = document.getElementById('nav-role-link');
    if (existingRoleLink) existingRoleLink.remove();

    // Remove possível item de nav já existente
    const existingNavAdd = document.getElementById('nav-add-redator');
    if (existingNavAdd) existingNavAdd.remove();

    const role = localStorage.getItem('loggedUserRole');

    if (logged) {
        const inPages = window.location.pathname.includes('/pages/');
        const navContainer = document.querySelector('.nav-login') ? document.querySelector('.nav-login').parentElement : document.body;
        const btn = document.createElement('button');
        btn.id = 'logout-btn';
        btn.textContent = 'Sair';
        btn.addEventListener('click', () => {
            fetch(`${apiBase}/logout`, { method: 'POST', credentials: 'include' })
                .finally(() => {
                    localStorage.removeItem('loggedUser');
                    localStorage.removeItem('loggedUserRole');
                    localStorage.removeItem('loggedUserId');
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

        if (role === 'admin' || role === 'redator') {
            const ul = document.querySelector('.nav-links');
            if (ul && !document.getElementById('nav-role-link')) {
                const li = document.createElement('li');
                li.id = 'nav-role-link';
                const href = role === 'admin' ? (inPages ? '#' : '#') : (inPages ? 'redator.html' : './pages/redator.html');
                // Se admin, não mostrar link, apenas redatores
                if (role === 'redator') {
                    li.innerHTML = `<a href="${href}" class="role-link">Redator</a>`;
                    ul.appendChild(li);
                }
            }
        }

        // Se for admin, inserir um item dentro do <ul class="nav-links">
        if (role === 'admin') {
            const ul = document.querySelector('.nav-links');
            if (ul && !document.getElementById('nav-add-redator')) {
                const li = document.createElement('li');
                li.id = 'nav-add-redator';
                const href = `${apiBase}/pages/admin.html`;
                li.innerHTML = `<a href="${href}">Gerenciar Redatores</a>`;
                ul.appendChild(li);
            }
        }
    } else {
        // remover item do nav caso não esteja logado
        const navItem = document.getElementById('nav-add-redator');
        if (navItem) navItem.remove();
    }

}

document.addEventListener('DOMContentLoaded', updateNavForLoggedUser);
