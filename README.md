# 🧘 Define Pilates - Sistema de Gestão de Studio

![Status do Projeto](https://img.shields.io/badge/status-concluido-green)
![Python](https://img.shields.io/badge/Python-3.13-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.119-009688)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Database](https://img.shields.io/badge/PostgreSQL_%26_MongoDB-Hybrid-lightgrey)

O **Define Pilates** é uma plataforma completa para gerenciamento de estúdios de Pilates. O sistema oferece controle sobre agendamentos, planos, pagamentos e fichas técnicas de alunos, com interfaces dedicadas para Administradores, Instrutores e Alunos.

---

## 🚀 Funcionalidades Principais

O sistema é dividido em três níveis de acesso, cada um com funcionalidades específicas:

### 🎓 Área do Aluno

* **Dashboard:** Visão geral de próximas aulas e avisos.
* **Gestão de Planos:** Visualização e contratação de planos disponíveis.
* **Financeiro:** Acesso a faturas e histórico de pagamentos.
* **Aulas:** Consulta de horários e histórico de aulas realizadas.

### 🧘 Área do Instrutor

* **Dashboard:** Resumo da agenda do dia e alunos ativos.
* **Gestão de Presença:** Registro de presença em tempo real (check-in/check-out).
* **Ficha Técnica:** Acesso e edição de fichas de evolução e anamnese dos alunos.
* **Meus Estudantes:** Listagem e gerenciamento dos alunos vinculados.

### 💼 Área Administrativa (Gestão)

* **Visão Geral:** Dashboard com métricas financeiras e operacionais.
* **Agendamento:** Controle da grade de horários do estúdio (Agenda Estúdio).
* **Cadastros:** Gestão completa de Colaboradores, Instrutores e Alunos.
* **Financeiro:** Controle de entradas, saídas e inadimplência.
* **Planos:** Criação e edição de planos (Mensal, Trimestral, Personalizados).
* **Alertas:** Sistema de notificações internas.

---

## 🛠️ Tecnologias Utilizadas

### Backend (`/back`)

* **Linguagem:** Python 3.13
* **Framework:** FastAPI
* **Banco de Dados (Híbrido):**

  * **PostgreSQL (Neon):** Para dados relacionais (Usuários, Planos, Contratos).
  * **MongoDB:** Para dados flexíveis e logs.
* **ORM & Migrations:** SQLAlchemy e Alembic.
* **Autenticação:** JWT (JSON Web Tokens).
* **Outros:** Pydantic (Validação), Cloudinary (Gestão de Imagens).

### Frontend (`/front`)

* **Framework:** React (Vite)
* **Estilização:** Tailwind CSS & Shadcn/ui (Radix UI).
* **Roteamento:** React Router DOM.
* **Cliente HTTP:** Axios.
* **Gráficos:** Recharts.
* **Ícones:** Lucide React & React Icons.

---

## ⚙️ Pré-requisitos

Antes de executar, certifique-se de ter instalado:

* [Python 3.13+](https://www.python.org/)
* [Node.js 18+](https://nodejs.org/)
* Acesso aos bancos de dados (PostgreSQL e MongoDB).

---

## 🚀 Instalação e Execução Rápida

Este projeto foi configurado para uma inicialização simples em ambientes Windows utilizando um único script.

### 1. Clone o repositório

```bash
git clone [https://github.com/seu-usuario/define-pilates.git](https://github.com/seu-usuario/define-pilates.git)
cd define-pilates
```

### 2. Configuração de Ambiente (.env)

Antes de rodar o sistema, é necessário configurar as variáveis de ambiente.

**Backend:**
Crie os arquivos `.env` necessários (ex: `postGre.env`, `mongoDB.env`) dentro de:

`back/src/database/envConfig/`
ou na **raiz do backend**, contendo as credenciais:

* `DATABASE_URL / URL_NEON` (PostgreSQL)
* `MONGO_URI` (MongoDB)
* `SECRET_KEY` (JWT)
* `CLOUDINARY_URL` (Uploads)

**Frontend:**
Crie um arquivo `.env` na pasta `front/`:

```
VITE_API_URL=http://localhost:8000
```

### 3. Executando o Sistema

Para instalar todas as dependências (Backend e Frontend) e iniciar os servidores simultaneamente, basta executar o script na raiz do projeto:

```bash
.\iniciar.bat
```

O script irá automaticamente:

* Instalar as dependências do Python (`requirements.txt`).
* Instalar as dependências do Node (`package.json`).
* Executar as migrações do banco de dados (alembic).
* Iniciar o servidor Backend (Uvicorn).
* Iniciar o servidor Frontend (Vite).

**Frontend:** Acessível em [http://localhost:5173](http://localhost:5173)
**Backend (Docs):** Acessível em [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📂 Estrutura do Projeto

```
define-pilates/
├── back/                 # API em Python/FastAPI
│   ├── alembic/          # Migrações de Banco de Dados
│   ├── src/
│   │   ├── controllers/  # Lógica de controle das rotas
│   │   ├── database/     # Configurações de DB (Postgres/Mongo)
│   │   ├── model/        # Modelos de dados (SQLAlchemy)
│   │   ├── router/       # Definição de rotas da API
│   │   ├── schemas/      # Schemas Pydantic (Request/Response)
│   │   └── services/     # Regras de negócio (Auth, Email, etc)
│   ├── main.py           # Ponto de entrada da aplicação
│   └── requirements.txt  # Dependências Python
│
├── front/                # Aplicação React
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis (UI, Forms)
│   │   ├── context/      # Context API (Sidebar, Auth)
│   │   ├── pages/        # Páginas (Admin, Aluno, Auth, Instrutor)
│   │   ├── services/     # Chamadas à API (Axios)
│   │   └── routes.jsx    # Configuração de rotas
│   └── package.json      # Dependências JS
└── iniciar.bat           # Script de inicialização automática
```

---

## 🐳 Docker (Opcional)

Caso prefira rodar o backend isoladamente via Docker:

```bash
cd back
docker build -t define-pilates-back .
docker run -p 80:80 define-pilates-back
```

---

## 👥 Desenvolvedores

- Allan Martins Silva (https://github.com/allanmsilva23) — Desenvolvedor Front-end  
- Gabriel Marques da Silva (https://github.com/the-gabriel-marques) — Desenvolvedor Front-end
- Heitor Augusto de Carvalho Silva (https://github.com/HeitorAugustoC) — Desenvolvedor Back-end
- Jhon Deyvid Quispe Mamani (https://github.com/d-Jhon-b) - Desenvolvedor Back-end
- Pedro Henrique de Carvalho Silva (https://github.com/Bruxx092) - Desenvolvedor Front-end
- Roberto Tadashi Miura (https://github.com/RobertoFATEC24) - Desenvolvedor Back-end
- Vitor Luiz Soares da Silva (https://github.com/VitorVraal) - Desenvolvedor Front-end
