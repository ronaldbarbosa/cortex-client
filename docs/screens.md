# Telas do cortex-client — Referência de Implementação

> Referência para o desenvolvimento das telas do app de agendamento do cliente final (PWA).

---

## Legenda

| Símbolo | Significado                                  |
| ------- | -------------------------------------------- |
| ✅      | Implementada                                 |
| 🚧      | Em progresso / parcialmente implementada     |
| ⬜      | Pendente                                     |
| ❌      | Bloqueada — endpoint ainda não existe na API |

---

## Bloco 0 — Fundação

| #   | Tela                           | Rota              | Status | Endpoints                                                                   | Notas                                                           |
| --- | ------------------------------ | ----------------- | ------ | --------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 0.1 | Shell / Layout                 | `/s/:slug`        | ✅     | `GET /public/establishments/:slug`                                          | Tenant context, nav tabs, user avatar desktop, tab Conta mobile |
| 0.2 | Login + Cadastro               | `/s/:slug/login`  | ✅     | `POST /auth/login`, `POST /auth/register/client`, `POST /auth/login/google` | Toggle login/registro; Google OAuth com re-render correto       |
| 0.3 | Modal de Login + Cadastro      | (modal global)    | ✅     | idem 0.2                                                                    | Mesmo toggle; abre via `AuthModalService`; reset ao abrir       |
| 0.4 | Estabelecimento não encontrado | `/nao-encontrado` | ✅     | —                                                                           | Redireciona quando slug inválido ou tenant inativo              |

---

## Bloco 1 — Navegação Pública

| #   | Tela                                  | Rota                         | Status | Endpoints                                                                                | Notas                                               |
| --- | ------------------------------------- | ---------------------------- | ------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1.1 | Início do Estabelecimento             | `/s/:slug/inicio`            | ✅     | `GET /public/establishments/:slug`, `GET /public/establishments/:slug/professionals`     | Profissionais e serviços reais                      |
| 1.2 | Agendamento — Escolha de Serviço      | `/s/:slug/agendar` (passo 1) | ✅     | `GET /public/establishments/:slug/services`                                              | Cards agrupados por categoria                       |
| 1.3 | Agendamento — Escolha de Profissional | `/s/:slug/agendar` (passo 2) | ✅     | `GET /public/establishments/:slug/professionals`                                         | Grid com iniciais                                   |
| 1.4 | Agendamento — Escolha de Data e Hora  | `/s/:slug/agendar` (passo 3) | ✅     | `GET /public/establishments/:slug/professionals/:id/availability?date=&durationMinutes=` | Strip 14 dias + slots; botão confirm fixo no mobile |

---

## Bloco 2 — Confirmação do Agendamento (Autenticado)

| #   | Tela                  | Rota                         | Status | Endpoints            | Notas                                                        |
| --- | --------------------- | ---------------------------- | ------ | -------------------- | ------------------------------------------------------------ |
| 2.1 | Confirmação + Sucesso | `/s/:slug/agendar` (passo 4) | ✅     | `POST /appointments` | Card com detalhes; navegação para histórico ou início        |
| 2.2 | Login solicitado      | (modal sobre passo 3)        | ✅     | —                    | Modal abre se não autenticado; retoma confirmação após login |

---

## Bloco 3 — Área do Cliente Autenticado

| #   | Tela                      | Rota                  | Status | Endpoints                                       | Notas                                                       |
| --- | ------------------------- | --------------------- | ------ | ----------------------------------------------- | ----------------------------------------------------------- |
| 3.1 | Histórico de Atendimentos | `/s/:slug/historico`  | ✅     | `GET /appointments?clientId=`                   | Badges de status, cancelamento e reagendamento inline       |
| 3.2 | Reagendar                 | (modal sobre 3.1)     | ✅     | `GET .../availability`, `PUT /appointments/:id` | Bottom-sheet com strip de datas e slots                     |
| 3.3 | Conta / Perfil            | `/s/:slug/conta`      | ✅     | `GET /auth/me`, `PATCH /auth/me`                | View + edição inline (nome, telefone); sair                 |
| 3.4 | Programa de Fidelidade    | `/s/:slug/fidelidade` | ❌     | —                                               | Placeholder; endpoint não existe ainda                      |
| 3.5 | Avaliação de Atendimento  | (modal sobre 3.1)     | ⬜     | —                                               | Botão "Avaliar" existe no histórico; fluxo não implementado |

---

## Dependências entre Blocos

```
Bloco 0 (Fundação — tenant context + auth)
  └── Bloco 1 (Navegação pública — sem login)
        └── Bloco 2 (Confirmação — requer login no checkout)
              └── Bloco 3 (Área do cliente — login persistente)
```

---

## Componentes Compartilhados

| Componente             | Status | Usado em                                         |
| ---------------------- | ------ | ------------------------------------------------ |
| `TenantContextService` | ✅     | Shell, todas as telas                            |
| `AuthService`          | ✅     | Login, modal, interceptor, histórico, conta      |
| `AuthModalService`     | ✅     | Modal de login, booking, conta                   |
| `AuthInterceptor`      | ✅     | Todas as requisições autenticadas                |
| `IconComponent`        | ✅     | Todas as telas                                   |
| Modal de Login         | ✅     | Confirmação de agendamento, conta                |
| Strip de datas + slots | ✅     | Agendamento (passo 3), reagendamento (histórico) |
| Toast / Notificação    | ⬜     | Feedback de ações — não implementado             |

---

## Totais

| Grupo                      | Qtd    | Status                   |
| -------------------------- | ------ | ------------------------ |
| Fundação                   | 4      | ✅ 4/4                   |
| Navegação Pública          | 4      | ✅ 4/4                   |
| Confirmação do Agendamento | 2      | ✅ 2/2                   |
| Área do Cliente            | 5      | ✅ 3/5 · ⬜ 1/5 · ❌ 1/5 |
| **Total**                  | **15** | **13 ✅ · 1 ⬜ · 1 ❌**  |
