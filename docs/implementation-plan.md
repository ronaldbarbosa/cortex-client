# Plano de Implementação — cortex-client

## Progresso atual

- [x] **Fase A** — Tenant context + roteamento
- [x] **Fase B** — Home pública com conteúdo real
- [x] **Fase C** — Auth flow (email/senha + Google OAuth + cadastro de cliente)
- [x] **Fase D** — Booking flow completo (seleção → confirmação → tela de sucesso)
- [x] **Fase E** — Área do cliente (histórico real, cancelamento, reagendamento, conta)

---

## Fase A — Tenant context + roteamento ✅

### cortex-api

- `GET /public/establishments/:slug` — dados públicos do estabelecimento
- `GET /public/establishments/:slug/services` — serviços ativos agrupados por categoria
- `GET /public/establishments/:slug/professionals` — profissionais ativos

### cortex-client

- Rotas sob `/s/:slug` com `ResolveFn` que popula `TenantContextService`
- `TenantContextService` expõe `slug()`, `tenantId()`, `name()` como signals
- Shell mostra nome do estabelecimento; 404 quando slug inválido

---

## Fase B — Home pública com conteúdo real ✅

### cortex-client

- Home exibe profissionais e serviços reais via API
- Agendamento (passos 1 e 2) conectado a dados reais do tenant

---

## Fase C — Auth flow ✅

### cortex-api

- `POST /auth/register/client` — cria User + TenantUser(Client) + Client em transação única
- `POST /auth/login` — inclui `client_id` no JWT para role Client
- `POST /auth/login/google` — cria entidade Client e inclui `client_id` no JWT
- `POST /auth/refresh` — propaga `client_id` para role Client
- `Client.UserId` — FK nullable ligando Identity user à entidade Client
- Migração `AddClientUserId` adicionada

### cortex-client

- Login/Registro como modal (sobre qualquer página) e como página standalone `/s/:slug/login`
- Toggle entre "Entrar" e "Criar conta" em ambas as superfícies
- Registro com firstName, lastName, email, phone, password
- Google OAuth via GSI (renderButton) — re-renderizado corretamente ao trocar de modo
- `AuthService.decodeUser()` lê `client_id` do JWT payload
- `AuthInterceptor` injeta Bearer token — bypass apenas para `/auth/login`, `/auth/register`, `/auth/refresh` e `/public/`

---

## Fase D — Booking flow completo ✅

### cortex-api

- `GET /public/establishments/:slug/professionals/:id/availability?date=&durationMinutes=` — slots disponíveis
- `POST /appointments` — auto-confirma quando criado por cliente (role Client)
- Validação de sobreposição de horários e agenda do profissional

### cortex-client

- Passo 1: seleção de serviço (cards por categoria)
- Passo 2: seleção de profissional (grid com iniciais)
- Passo 3: strip de 14 dias + slots de horário disponíveis; botão "Confirmar" fixo no mobile
- Passo 4: tela de sucesso com detalhes do agendamento; navegação para histórico ou início
- Erro de agendamento exibido inline no passo 3
- Modal de login abre automaticamente se não autenticado; após login retoma confirmação

---

## Fase E — Área do cliente ✅

### cortex-api

- `GET /appointments?clientId=` — filtrado automaticamente pelo próprio clientId (segurança server-side)
- `POST /appointments/:id/cancel` — cliente só cancela os próprios
- `PUT /appointments/:id` — cliente só reagenda os próprios
- `GET /auth/me` — perfil do cliente autenticado
- `PATCH /auth/me` — atualiza firstName, lastName, phone

### cortex-client

- **Histórico** (`/historico`) — lista real da API, skeleton loading, estado vazio
  - Badges de status coloridos (Confirmado, Concluído, Cancelado…)
  - "Reagendar" abre bottom-sheet com strip de datas + slots; submete `PUT /appointments/:id`
  - "Cancelar" inline com spinner; atualiza lista reativamente via `signal.update()`
  - Total gasto e visitas contam apenas atendimentos Concluídos
- **Conta** (`/conta`) — indicador de usuário logado
  - Não logado: botão "Entrar / Criar conta" abre modal; perfil carrega automaticamente via `effect()`
  - Logado: exibe nome + e-mail no hero; card com dados, botão "Editar" (inline), botão "Sair"
  - Edição de firstName, lastName, phone; e-mail é somente leitura
- **Shell** — avatar com iniciais no header desktop (dropdown com "Editar cadastro" + "Sair"); 5º tab "Conta" no mobile com miniatura de iniciais quando logado

---

## Próximos passos sugeridos

- [ ] Programa de fidelidade (`/fidelidade`) — endpoint ainda não existe na API
- [ ] Tela de avaliação de atendimento ("Avaliar" no histórico)
- [ ] "Repetir" agendamento (pré-preenche o booking flow)
- [ ] Push notifications / lembretes via PWA
- [ ] Histórico técnico do cliente (fórmulas, fotos, observações)
