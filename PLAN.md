# Plano de Implementação - Nomadia MVP

## Problema
Implementar um MVP local do Nomadia (marketplace de aluguel de acomodações) com dados mockados, cobrindo o fluxo core: cadastro/login, listagem de propriedades, busca com filtros e criação de reservas.

## Decisões
- **Arquitetura:** Frontend Next.js + Backend NestJS separados (`/frontend` e `/backend`)
- **UI:** Tailwind CSS + shadcn/ui
- **Idioma:** Código em inglês, UI em português (pt-BR)
- **Dados:** Mockados em memória no backend (sem banco de dados)
- **Auth:** JWT simulado com dados em memória

---

## Workplan

### Fase 1 — Backend NestJS (API com dados mockados)

- [ ] **1.1** Inicializar projeto NestJS com TypeScript em `/backend`
- [ ] **1.2** Criar módulo Auth (`/auth`)
  - POST `/auth/register` — registro com dados mockados em memória
  - POST `/auth/login` — login retornando JWT mockado
  - POST `/auth/refresh` — refresh token
  - GET `/auth/me` — perfil do usuário autenticado
- [ ] **1.3** Criar módulo Users (`/users`)
  - GET `/users/:id` — perfil público
  - PATCH `/users/me` — atualizar perfil
- [ ] **1.4** Criar módulo Properties (`/properties`)
  - GET `/properties` — listar com filtros (localização, preço, tipo, datas, hóspedes)
  - GET `/properties/:id` — detalhes da propriedade
  - POST `/properties` — criar propriedade (host)
  - PATCH `/properties/:id` — editar propriedade (host)
- [ ] **1.5** Criar módulo Bookings (`/bookings`)
  - POST `/bookings` — criar reserva
  - GET `/bookings` — listar reservas do usuário
  - GET `/bookings/:id` — detalhes da reserva
  - PATCH `/bookings/:id/cancel` — cancelar reserva
- [ ] **1.6** Criar dados mockados ricos
  - 10-15 propriedades variadas (apartamentos, casas, quartos) em cidades brasileiras
  - 3-5 usuários mockados (hóspedes + anfitriões)
  - Fotos usando placeholder URLs (Unsplash)
  - Amenidades, avaliações e calendário de disponibilidade
- [ ] **1.7** Configurar CORS e porta 3001
- [ ] **1.8** Testar todos os endpoints com cURL/Thunder Client

### Fase 2 — Frontend Next.js (Interface do Usuário)

- [ ] **2.1** Inicializar projeto Next.js 14+ com App Router em `/frontend`
- [ ] **2.2** Instalar e configurar Tailwind CSS + shadcn/ui
- [ ] **2.3** Configurar estrutura de pastas
  ```
  /frontend
    /app
      /(auth)/login/page.tsx
      /(auth)/register/page.tsx
      /(main)/page.tsx              — Home com busca
      /(main)/properties/page.tsx   — Listagem/resultados
      /(main)/properties/[id]/page.tsx — Detalhes
      /(main)/bookings/page.tsx     — Minhas reservas
      /(main)/bookings/[id]/page.tsx — Detalhes da reserva
    /components
      /ui          — componentes shadcn
      /layout      — Header, Footer, Navbar
      /properties  — PropertyCard, PropertyGrid, PropertyFilters
      /booking     — BookingForm, BookingSummary
      /auth        — LoginForm, RegisterForm
    /lib
      /api.ts      — cliente HTTP (fetch/axios)
      /auth.ts     — contexto de autenticação
      /types.ts    — tipos TypeScript
    /hooks
      /useAuth.ts
      /useProperties.ts
      /useBookings.ts
  ```
- [ ] **2.4** Implementar layout base (Header com nav, Footer)
- [ ] **2.5** Implementar páginas de Auth
  - Página de Login com formulário
  - Página de Registro com formulário
  - Context de autenticação com JWT armazenado
- [ ] **2.6** Implementar página Home
  - Hero section com barra de busca (destino, datas, hóspedes)
  - Seção de propriedades em destaque
  - Cards de categorias (apartamento, casa, quarto)
- [ ] **2.7** Implementar página de Listagem de Propriedades
  - Grid de cards com foto, título, preço, avaliação, localização
  - Sidebar/barra de filtros (preço, tipo, quartos, comodidades)
  - Ordenação (preço, avaliação, relevância)
  - Paginação
- [ ] **2.8** Implementar página de Detalhes da Propriedade
  - Galeria de fotos
  - Informações completas (descrição, comodidades, regras)
  - Card lateral com cálculo de preço e botão de reserva
  - Seção de avaliações mockadas
  - Informações do anfitrião
- [ ] **2.9** Implementar fluxo de Reserva
  - Formulário de reserva (datas, hóspedes)
  - Resumo de preços (diárias, taxa de limpeza, taxa de serviço)
  - Confirmação de reserva
  - Página de sucesso
- [ ] **2.10** Implementar página de Minhas Reservas
  - Lista de reservas com status (confirmada, pendente, cancelada)
  - Detalhes da reserva com opção de cancelar

### Fase 3 — Integração e Polimento

- [ ] **3.1** Conectar frontend ao backend (fetch para localhost:3001)
- [ ] **3.2** Testar fluxo completo end-to-end
  - Registro → Login → Busca → Ver propriedade → Reservar → Ver reservas
- [ ] **3.3** Adicionar estados de loading e erro nas páginas
- [ ] **3.4** Responsividade mobile (Tailwind breakpoints)
- [ ] **3.5** Criar script de inicialização (rodar frontend + backend juntos)

---

## Notas Técnicas

### Dados Mockados
- Armazenados em arrays/maps no módulo de serviço do NestJS
- IDs gerados com UUID
- Senhas armazenadas como hash bcrypt simulado
- JWT gerado com secret fixo local (não seguro, apenas para MVP)

### Endpoints seguem a documentação API.md
- Base URL: `http://localhost:3001/v1`
- Paginação padrão com `page` e `limit`
- Respostas seguem o formato documentado

### Propriedades Mockadas incluem
- Tipos variados: apartment, house, villa, room, studio
- Cidades: São Paulo, Rio de Janeiro, Florianópolis, Salvador, Gramado
- Preços variados: R$80 a R$800/noite
- Comodidades: Wi-Fi, ar-condicionado, cozinha, piscina, estacionamento
- Avaliações: 3.5 a 5.0 estrelas
- Fotos: URLs do Unsplash (placeholders)

### Comandos para Executar
```bash
# Terminal 1 — Backend
cd backend && npm run start:dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### Portas
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
