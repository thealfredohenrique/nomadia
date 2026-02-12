# Plano de Implementação: Suíte de Testes - Nomadia

## Problema
A aplicação Nomadia (marketplace de aluguel de acomodações) possui apenas 2 testes triviais. É necessário implementar uma suíte completa cobrindo unit tests, integration tests e E2E tests, tanto no backend (NestJS) quanto no frontend (Next.js).

## Abordagem
Seguir a **pirâmide de testes**: muitos unit tests (rápidos/isolados), integration tests moderados (módulos integrados), e poucos E2E tests (fluxos críticos end-to-end). Usar **Jest** em ambos os lados + **React Testing Library** no frontend + **supertest** no backend E2E.

---

## Workplan

### Fase 1: Backend - Unit Tests

- [ ] **1.1 AuthService unit tests** (`src/auth/auth.service.spec.ts`)
  - register: sucesso, email duplicado, dados inválidos
  - login: sucesso, credenciais incorretas, conta suspensa
  - refresh: token válido, token inválido/expirado
  - logout: revogação de refresh token
  - generateTokens: gera access + refresh tokens

- [ ] **1.2 UsersService unit tests** (`src/users/users.service.spec.ts`)
  - findAll, findById, findByEmail
  - create: sucesso, email duplicado
  - update: sucesso, campos protegidos
  - getPublicProfile: retorna apenas campos públicos

- [ ] **1.3 PropertiesService unit tests** (`src/properties/properties.service.spec.ts`)
  - findAll: sem filtros, com filtros (cidade, tipo, preço, amenidades)
  - findAll: ordenação (preço, rating, reviews)
  - findAll: paginação
  - findById: existente, inexistente
  - create: sucesso, dados obrigatórios
  - update: sucesso, campos protegidos (id, hostId)

- [ ] **1.4 BookingsService unit tests** (`src/bookings/bookings.service.spec.ts`)
  - create: sucesso, propriedade inexistente, estadia < mínimo, guests > máximo
  - create: cálculo correto (totalNights, subtotal, serviceFee, totalPrice)
  - create: instant booking vs pending
  - findByUser: filtro por guestId/hostId, status, paginação
  - findById: existente, inexistente
  - cancel: sucesso, já cancelado, já completado

- [ ] **1.5 AuthController unit tests** (`src/auth/auth.controller.spec.ts`)
  - Cada endpoint roteado corretamente
  - Guards aplicados nos endpoints protegidos

- [ ] **1.6 UsersController unit tests** (`src/users/users.controller.spec.ts`)
  - Cada endpoint roteado corretamente
  - Guards aplicados nos endpoints protegidos

- [ ] **1.7 PropertiesController unit tests** (`src/properties/properties.controller.spec.ts`)
  - Cada endpoint roteado corretamente
  - Guards aplicados nos endpoints protegidos

- [ ] **1.8 BookingsController unit tests** (`src/bookings/bookings.controller.spec.ts`)
  - Cada endpoint roteado corretamente
  - Guards aplicados nos endpoints protegidos

### Fase 2: Backend - E2E / Integration Tests

- [ ] **2.1 Auth E2E tests** (`test/auth.e2e-spec.ts`)
  - POST /v1/auth/register - registro completo
  - POST /v1/auth/login - login/erro
  - POST /v1/auth/refresh - refresh token
  - POST /v1/auth/logout - logout
  - GET /v1/auth/me - perfil autenticado / 401

- [ ] **2.2 Users E2E tests** (`test/users.e2e-spec.ts`)
  - GET /v1/users/me - perfil autenticado
  - PATCH /v1/users/me - atualização
  - GET /v1/users/:id - perfil público

- [ ] **2.3 Properties E2E tests** (`test/properties.e2e-spec.ts`)
  - GET /v1/properties - listagem com filtros e paginação
  - GET /v1/properties/:id - detalhes
  - POST /v1/properties - criação (autenticado host)
  - PATCH /v1/properties/:id - atualização (autenticado host)
  - 401/403 em endpoints protegidos sem auth

- [ ] **2.4 Bookings E2E tests** (`test/bookings.e2e-spec.ts`)
  - POST /v1/bookings - criação de reserva
  - GET /v1/bookings - listagem com filtros
  - GET /v1/bookings/:id - detalhes
  - PATCH /v1/bookings/:id/cancel - cancelamento
  - 401 em endpoints sem auth

### Fase 3: Frontend - Setup & Unit Tests

- [ ] **3.1 Configurar Jest + RTL no frontend**
  - Instalar jest, @testing-library/react, @testing-library/jest-dom, jest-environment-jsdom
  - Configurar jest.config.ts, setup files, mocks para next/navigation, next/image
  - Adicionar scripts de test no package.json

- [ ] **3.2 Testes do hook useAuth** (`lib/__tests__/auth-context.test.tsx`)
  - Login: sucesso, erro
  - Register: sucesso, erro
  - Logout: limpa estado e tokens
  - Auto-restore: carrega user do token salvo

- [ ] **3.3 Testes da API client** (`lib/__tests__/api.test.ts`)
  - Chamadas corretas para cada endpoint
  - Headers de autenticação enviados
  - Tratamento de erros HTTP

- [ ] **3.4 Testes de componentes**
  - PropertyCard: renderiza dados, formata preço/rating
  - Header: links de navegação, menu autenticado/não-autenticado
  - Footer: renderiza corretamente

### Fase 4: Frontend - Page Tests (Integration)

- [ ] **4.1 Login page test** (`app/login/__tests__/page.test.tsx`)
  - Renderiza form, submissão com credenciais, tratamento de erro

- [ ] **4.2 Register page test** (`app/register/__tests__/page.test.tsx`)
  - Renderiza form, seleção de role, submissão

- [ ] **4.3 Properties listing page test** (`app/properties/__tests__/page.test.tsx`)
  - Carrega e renderiza propriedades, aplica filtros

- [ ] **4.4 Property detail page test** (`app/properties/[id]/__tests__/page.test.tsx`)
  - Renderiza detalhes, galeria de fotos, form de booking

- [ ] **4.5 Bookings listing page test** (`app/bookings/__tests__/page.test.tsx`)
  - Renderiza lista de reservas, status badges

- [ ] **4.6 Booking detail page test** (`app/bookings/[id]/__tests__/page.test.tsx`)
  - Renderiza detalhes, botão de cancelamento

- [ ] **4.7 Home page test** (`app/__tests__/page.test.tsx`)
  - Renderiza hero, busca, categorias, propriedades em destaque

### Fase 5: Validação Final

- [ ] **5.1 Rodar todos os testes do backend** (npm test + npm run test:e2e)
- [ ] **5.2 Rodar todos os testes do frontend** (npm test)
- [ ] **5.3 Verificar cobertura** (npm run test:cov no backend)
- [ ] **5.4 Garantir que o build não quebrou** (npm run build em ambos)

---

## Fluxos Críticos Cobertos

| Fluxo | Testes |
|-------|--------|
| **Registro + Login** | Auth unit, Auth E2E, Login/Register page |
| **Busca de Propriedades** | Properties unit, Properties E2E, Properties page |
| **Detalhes da Propriedade** | Properties unit, Properties E2E, Property detail page |
| **Criação de Reserva** | Bookings unit (cálculos), Bookings E2E, Property detail page |
| **Listagem de Reservas** | Bookings unit, Bookings E2E, Bookings page |
| **Cancelamento de Reserva** | Bookings unit, Bookings E2E, Booking detail page |
| **Perfil do Usuário** | Users unit, Users E2E, Header component |

## Ferramentas

| Ferramenta | Uso |
|-----------|-----|
| **Jest** | Test runner (backend + frontend) |
| **@nestjs/testing** | Test utilities NestJS |
| **supertest** | HTTP E2E tests (backend) |
| **React Testing Library** | Component/page tests (frontend) |
| **jest-dom** | DOM matchers (frontend) |

## Notas
- Backend usa dados in-memory (mock), então os testes E2E não precisam de banco de dados
- Frontend testes devem mockar as chamadas à API (`fetch`)
- Manter testes rápidos e independentes (sem dependência entre testes)
