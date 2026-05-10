# Plano de Implementação — cortex-client

## Progresso atual

- [x] **Fase A** — Tenant context + roteamento (fundação)
- [x] **Fase B** — Home pública com conteúdo real
- [ ] **Fase C** — Auth flow + Google OAuth ← **estamos aqui**
- [ ] **Fase D** — Booking flow completo

---

## Fase A — Tenant context + roteamento ✅

### cortex-api

- `GET /public/establishments/:slug` — dados públicos do estabelecimento (nome, logo, descrição)
- `GET /public/establishments/:slug/services` — serviços ativos
- `GET /public/establishments/:slug/professionals` — profissionais com foto e serviços

Endpoints sob `/public/` sem autenticação. O `TenantId` é resolvido pelo slug, não pelo JWT.

### cortex-client

- Rotas reestruturadas: `/s/:slug` como rota pai com um `ResolveFn` que busca o tenant pelo slug e popula `TenantContextService`; erro 404 se slug inválido
- Rotas filhas: `/s/:slug/inicio`, `/s/:slug/agendar`, etc.
- `TenantContextService` (singleton scoped à rota) expõe `tenant()` signal com nome, logo e tenantId
- Shell usa `TenantContextService` para mostrar o nome do estabelecimento no lugar de "Cortex Studio"

---

## Fase B — Home pública com conteúdo real ✅

### cortex-client

- Home exibe profissionais e serviços reais vindos da API (substituindo os dados mock)
- Nenhuma autenticação necessária para navegar
- Página de agendamento mostra serviços reais do tenant; ao selecionar um serviço, avança para escolha de profissional com dados reais

---

## Fase C — Auth flow + Google OAuth ← próximo passo

### cortex-api

- `POST /auth/google` — recebe o `id_token` do Google, valida com a Google API, faz upsert em `users`, retorna JWT + refresh token da plataforma
- `POST /auth/refresh`, `POST /auth/logout` (já existentes ou a criar)
- Usuário cliente (`role = client`) é associado ao tenant via `tenant_users` no **primeiro agendamento** (não no cadastro)

### cortex-client

- Login aparece como **modal** (não navegação para outra página) quando o usuário tenta confirmar um agendamento sem estar autenticado — o contexto do agendamento é preservado
- Tela de login oferece: Google OAuth + email/senha
- Para Google: usar a SDK oficial `@types/google.accounts` com `google.accounts.id.initialize` — sem bibliotecas de terceiros, a própria GSI (Google Identity Services) é suficiente
- Após login bem-sucedido, o modal fecha e o agendamento prossegue automaticamente
- `AuthGuard` protege apenas a rota de confirmação final, não o browse

---

## Fase D — Booking flow completo

- **Passo 2 (profissional):** grid com foto, especialidade e disponibilidade
- **Passo 3 (data/hora):** calendário com slots disponíveis baseado em `professional_schedules` e `schedule_exceptions` do banco
- **Confirmação:** resumo + botão "Confirmar agendamento" → `POST /appointments`
- **Pós-agendamento:** página com detalhes e opção de adicionar ao calendário

---

## Ordem de execução

```
A (rotas + tenant context)          ✅
  ↓
B (conteúdo público real)           ✅
  ↓
C (auth + Google OAuth)             ← depende de A para ter o contexto
  ↓
D (booking completo)                ← depende de B e C
```

A e B podem avançar em paralelo com o backend. C bloqueia D.
