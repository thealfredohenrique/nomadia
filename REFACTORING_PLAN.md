# Plano de Refatoração — Nomadia

## Objetivo
Refatorar o projeto backend (NestJS) e frontend (Next.js) para resolver todos os 39 itens de dívida técnica documentados em `TECH_DEBT.md`, cobrindo as 5 fases do roadmap.

## Restrições
- **Testes existentes devem continuar passando:** Backend 90 testes (9 suites), Frontend 61 testes (12 suites)
- **Storage in-memory mantido** com Repository Pattern (abstrair para futura migração DB)
- **Converter componentes estáticos para Server Components** (PropertyCard, Footer, páginas onde possível)
- **Não adicionar banco de dados real** — apenas abstrair acesso a dados com interfaces

## Baseline Atual
| Métrica | Backend | Frontend |
|---------|---------|----------|
| Testes | ✅ 90/90 pass | ✅ 61/61 pass |
| Lint | ❌ 178 problemas (maioria em test files) | ❌ 10 problemas |

---

## Workplan

### Fase 1 — Segurança e Fundação (Backend)
> Itens: B-10, B-11, B-12, B-13, B-14, B-15, B-22, B-23, B-24, B-25, F-22, F-23

- [ ] **1.1 — Variáveis de ambiente com `@nestjs/config`**
  - Instalar `@nestjs/config`
  - Criar `backend/.env` com `JWT_SECRET`, `CORS_ORIGIN`, `PORT`
  - Criar `backend/.env.example` (sem valores sensíveis)
  - Adicionar `.env` ao `.gitignore`
  - Atualizar `app.module.ts` para importar `ConfigModule.forRoot({ isGlobal: true })`
  - Atualizar `auth.module.ts` — JWT secret via `ConfigService`
  - Atualizar `jwt.strategy.ts` — secretOrKey via `ConfigService`
  - Atualizar `main.ts` — CORS origin e PORT via env
  - **Resolve:** B-10, B-13

- [ ] **1.2 — Hashing real de senhas com `bcryptjs`**
  - Instalar `bcryptjs` e `@types/bcryptjs`
  - Atualizar `auth.service.ts` — `register()`: usar `bcrypt.hash(password, 12)`
  - Atualizar `auth.service.ts` — `login()`: usar `bcrypt.compare(password, hash)`
  - Atualizar mock-data.ts — gerar hashes reais para usuários mock (ou fazer lazy-hash no bootstrap)
  - Adaptar testes existentes que dependem do padrão `$2b$12$mock.`
  - **Resolve:** B-11

- [ ] **1.3 — Corrigir IDOR em `GET /bookings/:id`**
  - Atualizar `bookings.controller.ts` — `findOne()`: verificar ownership
  - Lançar `ForbiddenException` se não for owner
  - Adaptar testes existentes
  - **Resolve:** B-12

- [ ] **1.4 — ValidationPipe global + DTOs com `class-validator`**
  - Instalar `class-validator` e `class-transformer`
  - Habilitar `ValidationPipe` global em `main.ts`
  - Criar DTOs para todos os endpoints
  - Criar decorator `@CurrentUser()` para tipar `req.user`
  - Atualizar todos os controllers para usar DTOs e `@CurrentUser()`
  - **Resolve:** B-22, B-23

- [ ] **1.5 — Rate limiting com `@nestjs/throttler`**
  - Instalar e configurar `@nestjs/throttler`
  - Aplicar em endpoints de auth
  - **Resolve:** B-14

- [ ] **1.6 — Exception filter global**
  - Criar `common/filters/all-exceptions.filter.ts`
  - Corrigir `GET /me` retornando null → NotFoundException
  - **Resolve:** B-24, B-25

- [ ] **1.7 — TTL para refresh tokens**
  - Armazenar `{ userId, expiresAt }` no Map
  - Verificar expiração no `refresh()`
  - **Resolve:** B-15

- [ ] **1.8 — Variáveis de ambiente no frontend**
  - `api.ts` usar `NEXT_PUBLIC_API_URL`
  - Credenciais de teste via env
  - **Resolve:** F-22, F-23

- [ ] **1.9 — Validação: rodar testes backend + frontend**

### Fase 2 — Arquitetura e Patterns (Backend)
> Itens: B-01, B-02, B-03, B-04, B-08, B-09, B-17, B-18, B-19, B-20, B-21

- [ ] **2.1 — Constantes compartilhadas** → B-18
- [ ] **2.2 — Utilitário de paginação** → B-20
- [ ] **2.3 — Utilitário de sanitização de User** → B-19
- [ ] **2.4 — Interfaces segregadas (ISP)** → B-05, B-06
- [ ] **2.5 — Repository Pattern com interfaces** → B-08, B-09
- [ ] **2.6 — Extrair `TokenService`** → B-01
- [ ] **2.7 — Extrair `PricingService` + endpoint** → B-03, F-04
- [ ] **2.8 — Extrair `BookingValidator`** → B-03
- [ ] **2.9 — Strategy Pattern para filtros e ordenação** → B-02, B-04
- [ ] **2.10 — Desacoplar `AuthController` do `UsersService`** → B-17, B-21
- [ ] **2.11 — Validação: rodar testes backend**

### Fase 3 — Frontend Quality (Manutenibilidade)
> Itens: F-01, F-03, F-05, F-06, F-07, F-08, F-09, F-10, F-11, F-12, F-13, F-14, F-20, F-21

- [ ] **3.1 — Tipar retornos do `api.ts`** → F-06
- [ ] **3.2 — Utilitários compartilhados** → F-07, F-08, F-09, F-10, F-11
- [ ] **3.3 — Custom hooks com AbortController** → F-01, F-03, F-12, F-14
- [ ] **3.4 — Componente `ProtectedRoute`** → F-05
- [ ] **3.5 — Padronizar tratamento de erros** → F-20, F-21
- [ ] **3.6 — Decompor `PropertyDetailPage`** → F-01, F-13
- [ ] **3.7 — Validação: rodar testes frontend**

### Fase 4 — Next.js Best Practices
> Itens: F-02, F-16, F-17, F-18, F-19, F-25

- [ ] **4.1 — Server Components (PropertyCard, Footer)** → F-02
- [ ] **4.2 — error.tsx e loading.tsx** → F-17, F-18
- [ ] **4.3 — generateMetadata()** → F-19
- [ ] **4.4 — Dialog de confirmação** → F-25
- [ ] **4.5 — Validação: rodar testes frontend**

### Fase 5 — Polimento
> Itens: B-26, F-15, F-24

- [ ] **5.1 — Logging estruturado no backend** → B-26
- [ ] **5.2 — Objetos estáticos para module scope** → F-15
- [ ] **5.3 — Footer com links de navegação** → F-24
- [ ] **5.4 — Validação final: rodar todos os testes**
- [ ] **5.5 — Rodar lint e verificar melhoria**

---

## Arquivos Novos Previstos

### Backend (~20 arquivos novos)
```
backend/
├── .env
├── .env.example
├── src/common/
│   ├── constants.ts
│   ├── sanitize.ts
│   ├── paginate.ts
│   ├── filters/all-exceptions.filter.ts
│   ├── decorators/current-user.decorator.ts
│   └── interfaces/
│       ├── user.repository.ts
│       ├── property.repository.ts
│       └── booking.repository.ts
├── src/auth/
│   ├── dto/register.dto.ts, login.dto.ts, refresh.dto.ts
│   └── token.service.ts
├── src/bookings/
│   ├── dto/create-booking.dto.ts
│   ├── pricing.service.ts
│   ├── booking.validator.ts
│   └── repositories/in-memory-booking.repository.ts
├── src/properties/
│   ├── dto/create-property.dto.ts, update-property.dto.ts
│   ├── filters/property-filter.builder.ts, property-sort.strategy.ts
│   └── repositories/in-memory-property.repository.ts
└── src/users/
    ├── dto/update-user.dto.ts
    └── repositories/in-memory-user.repository.ts
```

### Frontend (~20 arquivos novos)
```
frontend/
├── .env.local
├── src/hooks/
│   ├── use-fetch.ts, use-debounce.ts
│   ├── use-property.ts, use-bookings.ts, use-booking.ts
│   ├── use-featured-properties.ts, use-properties-search.ts
│   └── use-booking-form.ts
├── src/lib/
│   ├── format.ts, booking-utils.ts, property-utils.ts
├── src/components/
│   ├── auth/protected-route.tsx
│   ├── ui/form-error.tsx
│   ├── skeletons/property-card-skeleton.tsx, booking-card-skeleton.tsx
│   ├── properties/
│   │   ├── property-photo-gallery.tsx, property-amenities.tsx
│   │   ├── property-reviews.tsx, property-info.tsx
│   └── booking/booking-widget.tsx
└── src/app/
    ├── error.tsx
    ├── properties/loading.tsx, [id]/loading.tsx
    └── bookings/loading.tsx, [id]/loading.tsx
```

## Riscos
- **Testes frágeis:** Mocks de services precisam ser adaptados ao Repository Pattern
- **Server Components + hooks:** Apenas componentes sem hooks podem ser Server Components
- **bcryptjs no mock-data:** Hashes bcrypt são lentos; usar hashes pré-gerados
