## Parte 1 — Setup do Monorepo

*Sprint 0 · Commit sugerido: `chore: setup inicial do monorepo`*

> **Prompt para o Antigravity:**
> 

> O repositório `cloud-architect-ai` já existe no GitHub e está clonado localmente. Trabalhe dentro da raiz desse repositório — não crie uma pasta com o mesmo nome. Crie a estrutura inicial com duas pastas principais: `frontend/` e `backend/`. Configure o frontend com **Next.js + TypeScript + Tailwind CSS + App Router**. Configure o backend com **FastAPI + Python**. Crie também na raiz: `docker-compose.yml` orquestrando o backend e um banco **PostgreSQL**, `.gitignore` cobrindo Python/Node/Docker e arquivos `.env`, e um `.env.example` com as variáveis `GEMINI_API_KEY` e `DATABASE_URL`. O projeto deve rodar localmente com `docker compose up` (backend na porta 8000) e `npm run dev` (frontend na porta 3000).
> 

**O que validar antes do commit:**

- [ ]  `docker compose up` sobe FastAPI + Postgres sem erros
- [ ]  `npm run dev` abre o Next.js em [localhost:3000](http://localhost:3000)
- [ ]  FastAPI responde em `localhost:8000/docs`
- [ ]  `.env` não está no histórico do Git

---

## Parte 2 — Identidade Visual e Layout Base

*Sprint 0/1 · Commit sugerido: `feat: layout base e identidade visual`*

> **Prompt para o Antigravity:**
> 

> No projeto Next.js já criado, configure a identidade visual completa do app **Cloud Architect AI**. Paleta de cores: background principal `#F8F9FC`, background de cards `#EEF0F8`, cor primária `#7C8CFF`, hover primário `#6470E0`, texto principal `#1E1E2E`, texto secundário `#6B7280`, acento/sucesso `#6DD4B0`, borda `#E2E4F0`. Fonte: **Inter** (Google Fonts). Instale e configure o **shadcn/ui** com tema personalizado usando essa paleta. Crie o `layout.tsx` global com um **header fixo** contendo: logo/mascote à esquerda (use um emoji ☁️ como placeholder), nome "Cloud Architect AI" ao lado, e links de navegação "Gerar" e "Histórico" à direita. Conteúdo centralizado com `max-w-4xl`. Desktop-first, light mode apenas.
> 

**O que validar antes do commit:**

- [ ]  Header aparece fixo em todas as telas
- [ ]  Paleta aplicada (background lilás suave, botões azul-lilás)
- [ ]  Fonte Inter carregando
- [ ]  Layout centralizado funciona

---

## Parte 3 — Banco de Dados e Migrations

*Sprint 1 · Commit sugerido: `feat: models e migrations do banco`*

> **Prompt para o Antigravity:**
> 

> No backend FastAPI, configure o banco de dados **PostgreSQL** com **SQLAlchemy async** (usando `asyncpg` como driver) e **Alembic** para migrations. Crie dois models: `Project` (id UUID, name string, description string opcional, created_at datetime) e `Generation` (id UUID, project_id FK para Project, description string, provider string — AWS/GCP/Azure, architecture JSON, mermaid_code string, cost_estimate JSON, total_monthly_cost string, alternatives JSON, created_at datetime). Configure `database.py` com async engine lendo `DATABASE_URL` do `.env`. Inicialize o Alembic e crie a primeira migration com os dois models. O banco deve estar acessível via Docker Compose localmente.
> 

**O que validar antes do commit:**

- [ ]  `alembic upgrade head` roda sem erro
- [ ]  Tabelas `projects` e `generations` existem no banco
- [ ]  FK de `generations.project_id` para `projects.id` está criada

---

## Parte 4 — Integração com a Gemini API

*Sprint 1 · Commit sugerido: `feat: service layer Gemini API`*

> **Prompt para o Antigravity:**
> 

> No backend FastAPI, crie a **Service Layer** para integração com a **Gemini API** (usando o SDK `google-generativeai`). Implemente três classes: **PromptBuilder** — recebe `description: str`, `provider: str` (AWS/GCP/Azure) e `filters: dict` opcional, retorna o prompt formatado com system instruction; **GeminiService** — chama a API com structured output (response_schema) forçando retorno JSON com os campos: `architecture` (services com name, purpose, justification + description geral), `mermaid_code` (string com código Mermaid), `cost_estimate` (array com service, monthly_cost_usd, notes), `total_monthly_cost_usd`, `alternatives` (array com name e trade_off); **ResponseParser** — sanitiza o código Mermaid e valida o JSON retornado com Pydantic. A system instruction deve posicionar o modelo como arquiteto de soluções cloud. Leia `GEMINI_API_KEY` do `.env`.
> 

**O que validar antes do commit:**

- [ ]  Chamada manual ao `GeminiService` retorna JSON válido
- [ ]  Pydantic valida a resposta sem erros
- [ ]  Código Mermaid vem sanitizado no ResponseParser
- [ ]  Chave API lida do `.env`, não hardcoded

---

## Parte 5 — Endpoints da API REST

*Sprint 1 · Commit sugerido: `feat: endpoints REST e CORS`*

> **Prompt para o Antigravity:**
> 

> No backend FastAPI, crie os endpoints REST do projeto usando os models, schemas Pydantic e services já implementados. Endpoints necessários: `POST /generate` (recebe description, provider e filters opcionais, chama o GeminiService, salva no banco e retorna o resultado completo), `GET /generations` (lista gerações com filtro opcional por project_id), `GET /generations/{id}` (detalhe de uma geração), `POST /projects` (cria projeto), `GET /projects` (lista projetos). Configure **CORS** no `main.py` para aceitar requisições de `localhost:3000` e do domínio da Vercel (configurável via variável de ambiente `ALLOWED_ORIGINS`). Todos os endpoints devem ser async.
> 

**O que validar antes do commit:**

- [ ]  `POST /generate` retorna arquitetura completa via Swagger UI (`/docs`)
- [ ]  Geração é salva no banco após a chamada
- [ ]  CORS não bloqueia requisições do frontend
- [ ]  Todos os endpoints retornam status codes corretos (200, 201, 404)

---

## Parte 6 — Formulário de Input e Chamada ao Backend

*Sprint 1 · Commit sugerido: `feat: formulário de geração e integração com API`*

> **Prompt para o Antigravity:**
> 

> No frontend Next.js, crie a tela principal `/` com o formulário de geração de arquiteturas. Use **React Hook Form + Zod** para validação. O formulário deve ter: textarea obrigatório para descrição do caso de uso (placeholder: "Ex: Sistema de e-commerce com alto tráfego, carrinho de compras, pagamentos e notificações..."), selector de cloud provider com 3 opções (AWS, GCP, Azure) estilizado como segmented control, seção colapsável "Filtros avançados" com selects para: escala esperada (pequeno/médio/grande), disponibilidade (básico/alta disponibilidade/mission-critical), tipo de aplicação (web app/API/data pipeline/microserviços) e input numérico para orçamento máximo mensal (USD). Botão "Gerar Arquitetura" em destaque (`#7C8CFF`). Crie `lib/api.ts` com função `generateArchitecture()` chamando `POST /generate`. Mostre loading state (skeleton) enquanto aguarda. Use toasts **Sonner** para erros.
> 

**O que validar antes do commit:**

- [ ]  Formulário valida campos obrigatórios
- [ ]  Filtros avançados expandem/colapsam
- [ ]  Skeleton aparece durante loading
- [ ]  Toast de erro aparece quando API falha
- [ ]  JSON da resposta chega no componente

---

## Parte 7 — Renderização do Diagrama e Resultados

*Sprint 2 · Commit sugerido: `feat: renderização Mermaid e resultados completos`*

> **Prompt para o Antigravity:**
> 

> No frontend Next.js, crie os componentes de exibição dos resultados. **MermaidRenderer**: recebe `code: string` com código Mermaid, usa `mermaid.render()` para gerar SVG, exibe o diagrama renderizado com tema personalizado (cores `#7C8CFF` e `#EEF0F8`), tem `try/catch` com mensagem de fallback "Não foi possível renderizar o diagrama" caso o código seja inválido. **CostTable**: recebe array de serviços com custo, renderiza tabela com colunas Serviço | Custo/mês | Notas, linha de total destacada em `#6DD4B0`. **ResultView**: container principal que exibe (em ordem) — seção "Arquitetura Recomendada" com lista de serviços e justificativas, diagrama Mermaid via MermaidRenderer, estimativa de custo via CostTable, seção "Alternativas" com nome e trade-off de cada opção. Integre o ResultView na página principal, exibido após o retorno da API.
> 

**O que validar antes do commit:**

- [ ]  Diagrama Mermaid renderiza visualmente
- [ ]  Fallback aparece quando Mermaid é inválido
- [ ]  Tabela de custos exibe valores e total destacado
- [ ]  Alternativas listadas abaixo dos custos
- [ ]  Layout do resultado é limpo e escaneável

---

## Parte 8 — Histórico de Gerações

*Sprint 5 · Commit sugerido: `feat: histórico de gerações`*

> **Prompt para o Antigravity:**
> 

> No frontend Next.js, crie as telas de histórico. **`/history`**: lista todas as gerações salvas, agrupadas por projeto, exibidas como cards com nome do projeto, cloud provider, data e preview do diagrama Mermaid (miniatura). Crie os componentes `HistoryList.tsx` (lista de cards de gerações) e `ProjectGroup.tsx` (agrupa gerações por projeto com header colapsável). **`/history/[id]`**: exibe uma geração completa com todos os componentes do ResultView (diagrama, custos, justificativas, alternativas). Adicione `getGenerations()` e `getGeneration(id)` em `lib/api.ts`. Empty state com mascote (emoji ☁️) quando não houver gerações.
> 

**O que validar antes do commit:**

- [ ]  `/history` lista gerações salvas agrupadas por projeto
- [ ]  `/history/[id]` exibe geração completa
- [ ]  Empty state aparece quando não há gerações
- [ ]  Navegação entre telas funciona pelo header

---

## Parte 9 — Comparação Multi-cloud

*Sprint 4 · Commit sugerido: `feat: comparação multi-cloud`*

> **Prompt para o Antigravity:**
> 

> Adicione a funcionalidade de **comparação multi-cloud** ao projeto. No **backend**: crie o endpoint `POST /generate/compare` que recebe description e filters (sem provider), faz 3 chamadas paralelas ao GeminiService com `asyncio.gather` (uma para AWS, uma para GCP, uma para Azure) e retorna array com os 3 resultados. No **frontend**: adicione toggle "Comparar providers" no GenerateForm; quando ativo, chama `/generate/compare` em vez de `/generate`. Crie `CompareView.tsx` que exibe os 3 resultados em tabs (AWS / GCP / Azure), cada tab com diagrama, custos e serviços. Destaque visualmente o provider com menor custo total.
> 

**O que validar antes do commit:**

- [ ]  `POST /generate/compare` retorna 3 arquiteturas
- [ ]  Toggle no form alterna entre gerar simples e comparar
- [ ]  Tabs AWS/GCP/Azure navegam corretamente
- [ ]  Provider mais barato tem destaque visual

---

## Parte 10 — Export e Polimento Final

*Sprint 5 · Commit sugerido: `feat: export PDF/MD e polimento final`*

> **Prompt para o Antigravity:**
> 

> Adicione exportação de resultados e polimento geral ao frontend Next.js. **Export PDF**: use `html2canvas` para capturar o ResultView e `jspdf` para gerar o arquivo, com download automático. **Export Markdown**: monte string com seções fixas (Arquitetura, Serviços, Diagrama Mermaid, Estimativa de Custo, Alternativas) e faça download como `.md`. Crie `ExportButtons.tsx` com os dois botões e integre no ResultView e na página `/history/[id]`. Além do export, revise: loading states em todas as telas, empty states com mascote (☁️), tratamento de erro com toasts em todos os endpoints, responsividade básica (sem quebrar em telas menores que desktop).
> 

**O que validar antes do commit:**

- [ ]  Download de PDF funciona com conteúdo formatado
- [ ]  Download de Markdown tem todas as seções
- [ ]  Nenhuma tela quebra sem dados
- [ ]  Toasts aparecem em erros de API

---

## Parte 11 — Testes do Backend

*Sprint 5 · Commit sugerido: `test: cobertura 70% no backend`*

> **Prompt para o Antigravity:**
> 

> Crie a suíte de testes do backend FastAPI usando **pytest + pytest-asyncio**. Estrutura de pastas: `tests/conftest.py` com fixtures compartilhadas (banco de teste em memória, AsyncClient do httpx, mock do GeminiService), `tests/unit/test_prompt_builder.py` (testa montagem do prompt com diferentes combinações de inputs e filtros), `tests/unit/test_gemini_service.py` (com `unittest.mock` para simular resposta da API, valida parsing Pydantic), `tests/unit/test_response_parser.py` (testa sanitização de Mermaid e cálculo de totais), `tests/integration/test_generate.py` (POST /generate com mock do Gemini, valida resposta e persistência), `tests/integration/test_generations.py` (GET /generations e GET /generations/{id}), `tests/integration/test_projects.py` (POST /projects e GET /projects). Meta: cobertura ≥ 70% (`pytest --cov=app --cov-report=term-missing`).
> 

**O que validar antes do commit:**

- [ ]  `pytest` roda sem erros
- [ ]  Cobertura ≥ 70% no relatório
- [ ]  Nenhum teste chama a Gemini API real
- [ ]  Testes de integração usam banco de teste separado

---

## Parte 12 — Deploy em Produção

*Sprint 5 · Commit sugerido: `chore: configuração de produção`*

Essa parte é **manual** — sem código, só configuração em plataformas.

**Railway (Backend + Banco)**

- [ ]  Criar projeto no painel do Railway
- [ ]  Adicionar serviço PostgreSQL
- [ ]  Adicionar serviço do backend (conectar ao GitHub, branch `main`)
- [ ]  Configurar variáveis de ambiente: `GEMINI_API_KEY`, `DATABASE_URL` (string do Railway), `ALLOWED_ORIGINS` (URL da Vercel)
- [ ]  Rodar migration de produção via Railway CLI ou painel
- [ ]  Verificar que o backend responde na URL pública

**Vercel (Frontend)**

- [ ]  Importar repositório no painel da Vercel
- [ ]  Configurar root directory como `frontend/`
- [ ]  Adicionar variável de ambiente: `NEXT_PUBLIC_API_URL` (URL pública do Railway)
- [ ]  Verificar deploy automático no push
- [ ]  Testar fluxo completo em produção

**Validação final em produção:**

- [ ]  Gerar arquitetura → ver diagrama → ver custos ✅
- [ ]  Comparar multi-cloud ✅
- [ ]  Salvar e ver no histórico ✅
- [ ]  Exportar PDF e Markdown ✅