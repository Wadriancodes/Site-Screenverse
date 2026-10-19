# Screenverse

O Screenverse é um site de notícias sobre filmes, séries e animes, desenvolvido como projeto acadêmico de Programação Web. Visitantes podem navegar pelas notícias e filtrá-las por categoria; usuários autenticados podem publicar conteúdo conforme seu perfil.

## Funcionalidades

- Página inicial com as notícias mais recentes e páginas para filmes, séries e animes.
- Listagem de notícias filtrada por categoria e página de detalhes com imagem, autoria e conteúdo.
- Cadastro e login de usuários com sessão.
- Painel administrativo para listar e remover usuários e cadastrar redatores.
- Área de redator para publicar notícias com título, categoria, texto e imagem.
- Exclusão de notícias por administradores ou pelo redator que as publicou.
- Interface de sugestões de conteúdo. O formulário está presente visualmente, mas ainda não envia nem armazena sugestões.

### Perfis de acesso

- **Usuário:** pode criar uma conta e consultar o conteúdo publicado.
- **Redator:** pode publicar notícias e remover as próprias publicações.
- **Administrador:** pode gerenciar usuários e redatores, além de remover qualquer notícia.

O primeiro usuário cadastrado no banco recebe automaticamente o perfil de administrador. Os cadastros seguintes recebem o perfil de usuário; novos redatores são criados pelo painel administrativo.

## Tecnologias e conceitos

### Frontend

- HTML5 para a estrutura das páginas.
- CSS3 para layout e identidade visual, com tema escuro, variáveis CSS, Grid, Flexbox e ajustes responsivos.
- JavaScript sem framework para formulários, navegação, chamadas à API com `fetch` e renderização dinâmica das notícias.

### Backend

- Node.js e Express para servir os arquivos do site e disponibilizar a API HTTP.
- SQLite para persistir usuários e notícias no arquivo `backend/database.db`.
- `bcrypt` para gerar hashes de senhas.
- `crypto` para criptografar e-mails com AES-256-GCM e gerar índices HMAC-SHA-256 para pesquisa.
- `express-session` para autenticação baseada em sessão e cookies.
- `multer` para receber e armazenar imagens enviadas junto às notícias.
- `helmet` e `cors` para configurar cabeçalhos de segurança e origens permitidas.
- Consultas SQL parametrizadas, middlewares de autenticação e autorização por perfil.

## Estrutura do projeto

```text
.
├── backend/
│   ├── server.js          # Servidor Express, API e inicialização das tabelas
│   ├── database.db        # Banco de dados SQLite
│   └── uploads/           # Imagens enviadas para as notícias
└── frontend/
    ├── index.html         # Página inicial
    ├── script.js          # Integração do frontend com a API
    ├── css/style.css      # Estilos globais e responsivos
    ├── pages/             # Páginas de conteúdo, autenticação e administração
    └── uploads/           # Logos, ícones e imagens estáticas
```

## Como executar localmente

### Requisitos

- Node.js e npm instalados.
- As dependências do backend instaladas com `npm install`.
- Duas chaves secretas definidas no arquivo `backend/.env`.

O servidor exige `ENCRYPTION_KEY` com exatamente 64 caracteres hexadecimais (32 bytes) e `HASH_PEPPER` como segredo para o HMAC. Gere valores aleatórios no terminal com Node.js:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Execute o comando duas vezes e use os valores gerados como `ENCRYPTION_KEY` e `HASH_PEPPER`. Crie `backend/.env` com:

```dotenv
ENCRYPTION_KEY=COLE_AQUI_UMA_CHAVE_HEXADECIMAL_DE_64_CARACTERES
HASH_PEPPER=COLE_AQUI_OUTRO_SEGREDO_ALEATORIO
PORT=3000
# DB_PATH=database.db
# NODE_ENV=development
```

Não compartilhe nem versione esse arquivo ou as chaves reais. `DB_PATH` é opcional e, sem configuração, o banco usado é `backend/database.db`. `PORT` também é opcional e assume `3000`.

No terminal, a partir da pasta do projeto:

```sh
cd backend
npm install
node server.js
```

Abra [http://localhost:3000](http://localhost:3000). O Express serve o frontend e a API no mesmo endereço. Para começar a usar a área administrativa, crie a primeira conta pela página de cadastro; ela receberá o perfil de administrador.

## API disponível

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/register` | Público | Cadastra usuário; o primeiro recebe perfil de administrador. |
| `POST` | `/login` | Público | Autentica e inicia uma sessão. |
| `GET` | `/me` | Autenticado | Retorna os dados do usuário da sessão. |
| `POST` | `/logout` | Sessão | Encerra a sessão atual. |
| `POST` | `/admin/redator` | Administrador | Cria uma conta de redator. |
| `GET` | `/admin/users` | Administrador | Lista usuários e perfis. |
| `DELETE` | `/admin/user/:id` | Administrador | Remove usuário que não seja administrador. |
| `POST` | `/news` | Autenticado | Publica notícia com imagem. |
| `GET` | `/news` | Público | Lista notícias; aceita `?category=filme`, `serie` ou `anime`. |
| `GET` | `/news/:id` | Público | Retorna uma notícia pelo identificador. |
| `DELETE` | `/news/:id` | Administrador ou autor | Remove uma notícia. |

## Observações

- O backend carrega as configurações de `backend/.env` e encerra a inicialização se as chaves obrigatórias estiverem ausentes ou inválidas.
- As imagens de notícias são armazenadas em `backend/uploads/`.
- A configuração atual de CORS permite origens locais específicas. Se o frontend for executado em outra origem, será necessário ajustar a lista no backend.
- O projeto está configurado para desenvolvimento local; antes de publicá-lo em produção, revise principalmente a persistência das sessões, cookies, origens permitidas e proteção das rotas.

## Créditos

- Wadrian Macario — 04199656
