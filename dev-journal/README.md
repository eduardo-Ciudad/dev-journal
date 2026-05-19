# 📓 Dev Journal

Diário pessoal online para registrar a evolução diária nos estudos de programação. Interface moderna em **dark mode**, dashboard com estatísticas e busca avançada.

## Funcionalidades

- **Dashboard** com estatísticas: dias registrados, horas estudadas, commits totais, streak e top tecnologias
- **Listar registros** com cards informativos (data, título, resumo, tecnologias, horas, commits, produtividade, humor)
- **Criar registro** com formulário completo e seleção visual de produtividade e humor
- **Editar registro** existente
- **Excluir registro** com modal de confirmação
- **Busca instantânea** por título, resumo e tecnologia
- **Filtros** por tecnologia, produtividade e humor (persistidos no localStorage)
- **Exportar** todos os registros em JSON
- **Toast notifications** e skeleton loading

## Campos por Registro

| Campo | Descrição |
|---|---|
| date | Data do estudo |
| title | Título do dia |
| summary | Resumo das atividades |
| technologies | Tecnologias utilizadas (separadas por vírgula) |
| challenges | Desafios enfrentados |
| learnings | Aprendizados do dia |
| study_hours | Horas estudadas |
| commits | Commits realizados |
| links | Links relevantes (separados por vírgula) |
| productivity | Nível 1–5 |
| mood | Humor do dia (emoji + texto) |

## Tecnologias

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Banco de dados:** SQLite (via sqlite3)
- **Dev:** nodemon

## Estrutura de Pastas

```
dev-journal/
├── backend/
│   ├── server.js        # Servidor Express + rotas /stats e /export
│   ├── database.js      # Setup do SQLite e seed de dados
│   ├── package.json
│   ├── routes/
│   │   └── entries.js   # CRUD completo + filtros
│   └── data/
│       └── journal.db   # Criado automaticamente
│
└── frontend/
    ├── index.html        # Dashboard
    ├── entry.html        # Visualização detalhada
    ├── new-entry.html    # Criar / Editar
    ├── css/
    │   └── style.css
    └── js/
        ├── api.js        # Camada de comunicação com a API
        ├── dashboard.js  # Lógica do dashboard
        ├── form.js       # Lógica do formulário
        └── entry.js      # Lógica da página de detalhe
```

## API REST

| Método | Endpoint | Descrição |
|---|---|---|
| GET | /api/entries | Listar (suporta ?search, ?technology, ?date, ?productivity, ?mood) |
| GET | /api/entries/:id | Buscar por ID |
| POST | /api/entries | Criar novo registro |
| PUT | /api/entries/:id | Atualizar registro |
| DELETE | /api/entries/:id | Excluir registro |
| GET | /api/stats | Estatísticas gerais |
| GET | /api/export | Exportar todos em JSON |

## Como Instalar e Executar

### 1. Instalar dependências

```bash
cd dev-journal/backend
npm install
```

### 2. Iniciar o servidor

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

O servidor sobe em `http://localhost:3000`.

### 3. Abrir o frontend

Abra o arquivo `frontend/index.html` diretamente no navegador.

> O banco de dados `data/journal.db` é criado automaticamente na primeira execução com 3 registros de exemplo.

## Paleta de Cores

| Variável | Valor | Uso |
|---|---|---|
| `--bg` | `#0f172a` | Fundo principal |
| `--card` | `#1e293b` | Cards e painéis |
| `--accent` | `#38bdf8` | Cor de destaque |
| `--text` | `#f8fafc` | Texto principal |
| `--text-secondary` | `#94a3b8` | Texto secundário |
| `--success` | `#22c55e` | Sucesso |
| `--warning` | `#f59e0b` | Alerta |
