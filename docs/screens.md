# Telas do cortex-client — Referência de Implementação

> Referência para o desenvolvimento das telas do app de agendamento do cliente final (PWA).
> Atualizar o status conforme cada tela for implementada.

---

## Legenda

| Símbolo | Significado                                  |
| ------- | -------------------------------------------- |
| ✅      | Implementada                                 |
| 🚧      | Em progresso                                 |
| ⬜      | Pendente                                     |
| ❌      | Bloqueada — endpoint ainda não existe na API |

---

## Bloco 0 — Fundação

> Pré-requisito para todos os outros blocos. Sem o tenant context nas rotas, nenhuma tela consegue carregar dados reais.

| #   | Tela                           | Rota                  | Status | Endpoints                               | Notas                                                                                  |
| --- | ------------------------------ | --------------------- | ------ | --------------------------------------- | -------------------------------------------------------------------------------------- |
| 0.1 | Shell / Layout                 | `/s/:slug`            | 🚧     | `GET /public/establishments/:slug`      | Shell implementado visualmente; falta `TenantContextService` e `ResolveFn`             |
| 0.2 | Login (email + Google)         | `/s/:slug/login`      | 🚧     | `POST /auth/login`, `POST /auth/google` | Formulário email/senha implementado; falta Google OAuth e redirecionamento pós-booking |
| 0.3 | Estabelecimento não encontrado | `/s/:slug` (fallback) | ⬜     | —                                       | Página 404 quando o slug é inválido ou o estabelecimento está inativo                  |

---

## Bloco 1 — Navegação Pública

> Todo o bloco é acessível sem login. A autenticação só é exigida na confirmação do agendamento (Bloco 2).

| #   | Tela                                  | Rota                         | Status | Endpoints                                                                            | Notas                                                                |
| --- | ------------------------------------- | ---------------------------- | ------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1.1 | Início do Estabelecimento             | `/s/:slug/inicio`            | 🚧     | `GET /public/establishments/:slug`, `GET /public/establishments/:slug/professionals` | Implementado com mock; falta conectar ao tenant real                 |
| 1.2 | Agendamento — Escolha de Serviço      | `/s/:slug/agendar` (passo 1) | 🚧     | `GET /public/establishments/:slug/services`                                          | Implementado com mock; falta dados reais e agrupamento por categoria |
| 1.3 | Agendamento — Escolha de Profissional | `/s/:slug/agendar` (passo 2) | ❌     | `GET /public/establishments/:slug/professionals?serviceId=`                          | Placeholder "em breve"; aguarda endpoint da API                      |
| 1.4 | Agendamento — Escolha de Data e Hora  | `/s/:slug/agendar` (passo 3) | ❌     | `GET /public/establishments/:slug/availability?professionalId=&serviceId=&date=`     | Placeholder "em breve"; aguarda endpoint da API                      |

---

## Bloco 2 — Confirmação do Agendamento (Autenticado)

> O login é solicitado via modal neste momento, preservando o estado do agendamento. Após autenticar, a confirmação prossegue automaticamente.

| #   | Tela                   | Rota                             | Status | Endpoints                               | Notas                                                             |
| --- | ---------------------- | -------------------------------- | ------ | --------------------------------------- | ----------------------------------------------------------------- |
| 2.1 | Modal de Login         | (modal sobre `/s/:slug/agendar`) | ⬜     | `POST /auth/login`, `POST /auth/google` | Disparado ao tentar confirmar agendamento sem estar autenticado   |
| 2.2 | Resumo e Confirmação   | `/s/:slug/agendar` (passo 4)     | ⬜     | `POST /appointments`                    | Exibe serviço, profissional, data/hora e valor antes de confirmar |
| 2.3 | Agendamento Confirmado | `/s/:slug/confirmado/:id`        | ⬜     | `GET /appointments/:id`                 | Tela de sucesso com detalhes e opção de adicionar ao calendário   |

---

## Bloco 3 — Área do Cliente Autenticado

> Acessível apenas com login. Contexto do tenant é mantido via JWT gerado com o `tenantSlug` do estabelecimento.

| #   | Tela                      | Rota                  | Status | Endpoints                                        | Notas                                                 |
| --- | ------------------------- | --------------------- | ------ | ------------------------------------------------ | ----------------------------------------------------- |
| 3.1 | Histórico de Atendimentos | `/s/:slug/historico`  | 🚧     | `GET /clients/me/appointments?tenantId=`         | Implementado com mock; falta conectar à API           |
| 3.2 | Programa de Fidelidade    | `/s/:slug/fidelidade` | ❌     | `GET /clients/me/loyalty?tenantId=`              | Bloqueado — endpoint não existe; tela com placeholder |
| 3.3 | Reagendar                 | modal sobre histórico | ⬜     | `POST /appointments`, `DELETE /appointments/:id` | A partir de um atendimento anterior                   |

---

## Dependências entre Blocos

```
Bloco 0 (Tenant context + Login)
  └── Bloco 1 (Navegação pública — sem login)
        └── Bloco 2 (Confirmação — requer login no momento do checkout)
              └── Bloco 3 (Área do cliente — requer login persistente)
```

---

## Componentes Compartilhados

Implementar antes ou junto com a primeira tela que os necessitar.

| Componente              | Usado em                                        |
| ----------------------- | ----------------------------------------------- |
| `TenantContextService`  | Shell, todas as telas (resolve dados do tenant) |
| Modal de Login          | Confirmação de agendamento (Bloco 2)            |
| Calendário de slots     | Escolha de data e hora (1.4)                    |
| Seletor de profissional | Escolha de profissional (1.3)                   |
| Toast / Notificação     | Feedback de agendamento confirmado, erros       |
| Auth interceptor (JWT)  | Requisições autenticadas (Blocos 2 e 3)         |

---

## Totais

| Grupo                      | Qtd    | Status                   |
| -------------------------- | ------ | ------------------------ |
| Fundação                   | 3      | 🚧 2/3 · ⬜ 1/3          |
| Navegação Pública          | 4      | 🚧 2/4 · ❌ 2/4          |
| Confirmação do Agendamento | 3      | ⬜ 3/3                   |
| Área do Cliente            | 3      | 🚧 1/3 · ❌ 1/3 · ⬜ 1/3 |
| **Total**                  | **13** | **5 🚧 · 4 ⬜ · 3 ❌**   |
