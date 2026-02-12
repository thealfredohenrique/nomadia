# Relatório de Dívida Técnica — Nomadia

> **Data da análise:** 12/02/2026
> **Escopo:** Backend (NestJS 11) + Frontend (Next.js 16)
> **Foco:** Violações de princípios de design (SOLID), boas práticas de framework, segurança, qualidade de código

---

## Resumo Executivo

| Severidade | Backend | Frontend | Total |
|-----------|---------|----------|-------|
| 🔴 Crítica | 7 | 4 | **11** |
| 🟠 Alta | 6 | 7 | **13** |
| 🟡 Média | 5 | 5 | **10** |
| 🟢 Baixa | 2 | 3 | **5** |
| **Total** | **20** | **19** | **39** |

O projeto está em estágio MVP com boa estrutura modular, mas apresenta lacunas significativas em segurança, validação de entrada, separação de responsabilidades e aderência a princípios SOLID. O frontend sofre de componentes monolíticos e ausência de custom hooks para abstração de lógica.

---

## Metodologia e Classificação de Severidade

| Severidade | Significado | Critério |
|-----------|-------------|----------|
| 🔴 Crítica | Deve ser corrigido antes de produção | Vulnerabilidade de segurança, perda de dados, falha arquitetural |
| 🟠 Alta | Impacta manutenibilidade e escalabilidade | Violação de princípios de design, acoplamento forte, duplicação significativa |
| 🟡 Média | Afeta qualidade do código | Anti-patterns, inconsistências, falta de cobertura |
| 🟢 Baixa | Melhoria desejável | Otimizações, convenções, polimento |

---

## Backend

### 1. Violações de Princípios SOLID

#### 1.1 SRP — Single Responsibility Principle

##### 🟠 B-01: `AuthService` acumula múltiplas responsabilidades

**Arquivo:** `backend/src/auth/auth.service.ts`

O `AuthService` gerencia simultaneamente: registro de usuários, autenticação, armazenamento de refresh tokens, geração de tokens JWT e sanitização de dados sensíveis. São pelo menos 5 responsabilidades distintas em uma única classe.

```typescript
// Linha 13 — Gerenciamento de tokens (deveria ser um TokenService)
private refreshTokens: Map<string, string> = new Map();

// Linha 20-61 — Registro de usuário (cria entidade User inteira)
async register(dto: { ... }) {
  const user: User = {
    id: uuidv4(),
    // ... 18 campos construídos manualmente
  };
  this.usersService.create(user);
  // ...
}

// Linha 105-121 — Geração de tokens
private generateTokens(user: User) { ... }

// Linha 123-126 — Sanitização de dados
private sanitizeUser(user: User) { ... }
```

**Impacto:** Dificulta testes unitários, aumenta risco de efeitos colaterais, viola separação de responsabilidades.

**Sugestão:** Extrair `TokenService` (geração e gerenciamento de tokens), mover construção de `User` para uma factory ou para o `UsersService`, e extrair sanitização para um utilitário compartilhado.

---

##### 🟠 B-02: `PropertiesService.findAll()` é um método God Method

**Arquivo:** `backend/src/properties/properties.service.ts:10-116`

O método `findAll()` (107 linhas) acumula: filtragem por 9 critérios diferentes, ordenação com switch-case, paginação e transformação de dados. É o método mais complexo do backend.

```typescript
// Linhas 26-80 — 9 blocos if de filtragem encadeados
if (filters.city) { ... }
if (filters.state) { ... }
if (filters.propertyType) { ... }
if (filters.roomType) { ... }
if (filters.minPrice !== undefined) { ... }
if (filters.maxPrice !== undefined) { ... }
if (filters.guests) { ... }
if (filters.bedrooms) { ... }
if (filters.amenities && filters.amenities.length > 0) { ... }

// Linhas 83-100 — Ordenação com switch
switch (filters.sortBy) { ... }

// Linhas 102-115 — Paginação e transformação
const page = filters.page || 1;
```

**Impacto:** Cada novo filtro ou critério de ordenação exige modificação direta desse método (viola OCP). Testabilidade comprometida.

**Sugestão:** Extrair lógica de filtragem para um `PropertyFilterBuilder` (padrão Builder/Specification), ordenação para um `SortStrategy`, e paginação para um utilitário genérico.

---

##### 🟠 B-03: `BookingsService.create()` mistura validação, cálculo de preço e persistência

**Arquivo:** `backend/src/bookings/bookings.service.ts:17-82`

O método combina 3 responsabilidades distintas: validação de regras de negócio (guests, noites mínimas/máximas), cálculo de preço (subtotal, taxas) e criação/persistência da entidade.

```typescript
// Linhas 31-53 — Validações de negócio
if (dto.guests > property.maxGuests) { throw ... }
if (totalNights < property.minimumNights) { throw ... }
if (totalNights > property.maximumNights) { throw ... }

// Linhas 55-57 — Cálculo de preço
const subtotal = property.pricePerNight * totalNights;
const serviceFee = Math.round(subtotal * 0.1);
const totalPrice = subtotal + property.cleaningFee + serviceFee;

// Linhas 59-81 — Construção e persistência
const booking: Booking = { ... };
this.bookings.push(booking);
```

**Impacto:** Lógica de pricing não é reutilizável (duplicada no frontend). Validações não podem ser testadas isoladamente.

**Sugestão:** Extrair `PricingService` para cálculos de preço e `BookingValidator` para validações de regras de negócio.

---

#### 1.2 OCP — Open/Closed Principle

##### 🟠 B-04: Switch-case de ordenação exige modificação para novos critérios

**Arquivo:** `backend/src/properties/properties.service.ts:83-100`

```typescript
switch (filters.sortBy) {
  case 'price_asc':
    results.sort((a, b) => a.pricePerNight - b.pricePerNight);
    break;
  case 'price_desc':
    results.sort((a, b) => b.pricePerNight - a.pricePerNight);
    break;
  case 'rating':
    results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    break;
  case 'reviews':
    results.sort((a, b) => b.totalReviews - a.totalReviews);
    break;
  default:
    results.sort((a, b) => b.viewsCount - a.viewsCount);
}
```

**Impacto:** Adicionar ordenação por "data de criação" ou "distância" exige modificação direta do service.

**Sugestão:** Implementar padrão Strategy com um `Record<string, SortFunction>` ou classe `SortStrategy`:
```typescript
const sortStrategies: Record<string, (a: Property, b: Property) => number> = {
  price_asc: (a, b) => a.pricePerNight - b.pricePerNight,
  // ... extensível sem modificar o service
};
```

---

#### 1.3 ISP — Interface Segregation Principle

##### 🟡 B-05: Interface `User` expõe `passwordHash` para todos os consumidores

**Arquivo:** `backend/src/common/types.ts:1-22`

A interface `User` inclui `passwordHash` (linha 4), mas a maioria dos consumidores nunca precisa desse campo. Isso resulta em sanitização manual repetida em múltiplos pontos do código.

```typescript
export interface User {
  id: string;
  email: string;
  passwordHash: string;  // Exposto a todos os consumidores
  // ...
}
```

**Evidência de impacto (sanitização repetida 4x):**
- `auth.service.ts:124` — `const { passwordHash, ...rest } = user;`
- `auth.controller.ts:61` — `const { passwordHash, ...rest } = user;`
- `users.controller.ts:23` — `const { passwordHash, ...rest } = user;`
- `users.controller.ts:33` — `const { passwordHash: _, ...rest } = user;`

**Sugestão:** Criar interfaces segregadas:
```typescript
export interface UserPublic { id: string; firstName: string; /* ... sem passwordHash */ }
export interface UserWithAuth extends UserPublic { passwordHash: string; }
```

---

##### 🟡 B-06: Interface `Property` inclui `reviews` mesmo quando não necessário

**Arquivo:** `backend/src/common/types.ts:24-54`

A interface `Property` sempre inclui o array `reviews` (linha 51), mas o endpoint de listagem explicitamente remove esse campo (linha 110 do service). Isso força o tipo `Omit<Property, 'reviews'>` na assinatura.

```typescript
// properties.service.ts:110 — Remoção manual de reviews
const data = paged.map(({ reviews, ...rest }) => rest);
```

**Sugestão:** Criar `PropertySummary` (sem reviews) e `PropertyDetail` (com reviews) como interfaces separadas.

---

##### 🟡 B-07: Interface `Booking` desnormaliza dados de `Property`

**Arquivo:** `backend/src/common/types.ts:86-105`

```typescript
export interface Booking {
  // ...
  propertyTitle: string;   // Linha 101 — Duplica Property.title
  propertyPhoto: string;   // Linha 102 — Duplica Property.photos[0].url
}
```

**Impacto:** Se o título ou foto da propriedade mudar, bookings existentes ficam desatualizados. Risco de inconsistência de dados.

**Sugestão:** Armazenar apenas `propertyId` e resolver título/foto via join ou lookup no momento da consulta.

---

#### 1.4 DIP — Dependency Inversion Principle

##### 🔴 B-08: Services dependem de implementações concretas, não de abstrações

**Arquivos:**
- `backend/src/bookings/bookings.service.ts:15`
- `backend/src/auth/auth.service.ts:17`
- `backend/src/auth/auth.controller.ts:18`

Nenhum service depende de interfaces/abstrações. Todos dependem diretamente de classes concretas:

```typescript
// bookings.service.ts:15
constructor(private readonly propertiesService: PropertiesService) {}

// auth.service.ts:17
constructor(
  private readonly jwtService: JwtService,
  private readonly usersService: UsersService,
) {}

// auth.controller.ts:18 — Controller depende de service concreto externo
private readonly usersService: UsersService,
```

**Impacto:** Impossível substituir implementações para testes ou para migração de in-memory para banco de dados sem modificar os consumers. Viola DIP fundamentalmente.

**Sugestão:** Definir interfaces (ex: `IUserRepository`, `IPropertyRepository`) e injetar via tokens do NestJS:
```typescript
constructor(@Inject('IUserRepository') private readonly users: IUserRepository) {}
```

---

##### 🔴 B-09: Sem camada de abstração para acesso a dados (Repository Pattern ausente)

**Arquivos:**
- `backend/src/users/users.service.ts:7`
- `backend/src/bookings/bookings.service.ts:13`
- `backend/src/properties/properties.service.ts:8`

Cada service gerencia diretamente seus dados in-memory, misturando lógica de negócio com acesso a dados:

```typescript
// users.service.ts:7
private users: User[] = [...MOCK_USERS];

// bookings.service.ts:13
private bookings: Booking[] = [...MOCK_BOOKINGS];

// properties.service.ts:8
private properties: Property[] = [...MOCK_PROPERTIES];
```

**Impacto:** Migrar para banco de dados exige reescrever toda a lógica dos services. Sem abstração, não há como trocar a fonte de dados.

**Sugestão:** Implementar Repository Pattern:
```typescript
// user.repository.interface.ts
export interface IUserRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  create(user: User): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | undefined>;
}
```

---

### 2. Segurança

##### 🔴 B-10: JWT secret hardcoded no código-fonte

**Arquivos:**
- `backend/src/auth/auth.module.ts:12`
- `backend/src/auth/jwt.strategy.ts:12`

```typescript
// auth.module.ts:12
secret: 'nomadia-mvp-secret-key-local-only',

// jwt.strategy.ts:12
secretOrKey: 'nomadia-mvp-secret-key-local-only',
```

**Impacto:** Qualquer pessoa com acesso ao repositório pode forjar tokens JWT válidos. Secret está duplicado em dois arquivos.

**Sugestão:** Usar `@nestjs/config` com `ConfigService`:
```typescript
secret: configService.get<string>('JWT_SECRET'),
```

---

##### 🔴 B-11: Hashing de senha mockado — zero segurança

**Arquivo:** `backend/src/auth/auth.service.ts:37,70`

```typescript
// Linha 37 — Registro: senha armazenada em texto quase plano
passwordHash: `$2b$12$mock.${dto.password}`,

// Linha 70 — Login: comparação em texto plano
if (user.passwordHash !== `$2b$12$mock.${password}`) {
```

**Impacto:** Senhas recuperáveis diretamente do "hash". Zero proteção mesmo em cenário de vazamento de dados.

**Sugestão:** Usar `bcryptjs`:
```typescript
import * as bcrypt from 'bcryptjs';
const hash = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, user.passwordHash);
```

---

##### 🔴 B-12: Autorização quebrada — endpoint `GET /bookings/:id` não verifica proprietário

**Arquivo:** `backend/src/bookings/bookings.controller.ts:49-56`

```typescript
@Get(':id')
findOne(@Param('id') id: string, @Request() req: any) {
  const booking = this.bookingsService.findById(id);
  if (!booking) {
    throw new NotFoundException('Reserva não encontrada');
  }
  return booking;  // Qualquer usuário autenticado pode ver qualquer reserva
}
```

**Impacto:** IDOR (Insecure Direct Object Reference) — qualquer usuário autenticado pode acessar detalhes de reservas de outros usuários.

**Sugestão:** Verificar ownership:
```typescript
if (booking.guestId !== req.user.sub && booking.hostId !== req.user.sub) {
  throw new ForbiddenException('Sem permissão para ver esta reserva');
}
```

---

##### 🟠 B-13: CORS origin hardcoded

**Arquivo:** `backend/src/main.ts:6-9`

```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

**Impacto:** Impossível fazer deploy em ambientes diferentes sem alterar código-fonte.

**Sugestão:** Usar variável de ambiente:
```typescript
origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
```

---

##### 🟡 B-14: Sem rate limiting em endpoints de autenticação

**Arquivo:** `backend/src/auth/auth.controller.ts`

Os endpoints `POST /v1/auth/login` e `POST /v1/auth/register` não possuem rate limiting. Ataques de força bruta podem ser executados sem restrição.

**Sugestão:** Adicionar `@nestjs/throttler`:
```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
```

---

##### 🟡 B-15: Refresh tokens sem TTL — memory leak

**Arquivo:** `backend/src/auth/auth.service.ts:13`

```typescript
private refreshTokens: Map<string, string> = new Map();
```

O `Map` cresce indefinidamente. Tokens nunca expiram por time-out, apenas por logout explícito ou refresh.

**Impacto:** Memory leak em produção; DoS via criação massiva de sessões.

**Sugestão:** Implementar TTL com limpeza periódica ou migrar para Redis com `EX` (expiry).

---

### 3. Arquitetura e Padrões

##### 🔴 B-16: Zero persistência — todos os dados em memória

**Arquivos:**
- `backend/src/users/users.service.ts:7`
- `backend/src/bookings/bookings.service.ts:13`
- `backend/src/properties/properties.service.ts:8`
- `backend/src/auth/auth.service.ts:13`

Toda a base de dados é composta por arrays in-memory copiados de `mock-data.ts`. Qualquer restart do processo destrói todos os dados.

**Impacto:** Inviabiliza qualquer cenário de produção, testes de integração reais ou deploy multi-instância.

**Sugestão:** Implementar PostgreSQL com TypeORM ou Prisma, usando o Repository Pattern mencionado em B-09.

---

##### 🟠 B-17: Acoplamento forte entre módulos via imports diretos

**Arquivos:**
- `backend/src/bookings/bookings.module.ts` — importa `PropertiesModule`
- `backend/src/auth/auth.module.ts:10` — importa `UsersModule`
- `backend/src/auth/auth.controller.ts:12,18` — injeta `UsersService` diretamente

```typescript
// auth.controller.ts:12 — Controller importa service de outro módulo
import { UsersService } from '../users/users.service';

// auth.controller.ts:18 — Injeção direta de dependência cross-module
private readonly usersService: UsersService,
```

**Impacto:** Módulos não podem ser desenvolvidos, testados ou deployados independentemente. `AuthController` acessa diretamente o `UsersService` ao invés de delegar ao `AuthService`.

**Sugestão:** `AuthController` deve usar apenas `AuthService`. O acesso a dados de usuário no endpoint `GET /me` (auth.controller.ts:58-62) deveria ser responsabilidade do `AuthService`.

---

### 4. Qualidade de Código

##### 🟠 B-18: Magic numbers espalhados pelo código

| Arquivo | Linha | Valor | Significado |
|---------|-------|-------|-------------|
| `bookings/bookings.service.ts` | 40 | `1000 * 60 * 60 * 24` | Milissegundos em um dia |
| `bookings/bookings.service.ts` | 56 | `0.1` | Taxa de serviço (10%) |
| `bookings/bookings.service.ts` | 102 | `20` | Limite padrão de paginação |
| `properties/properties.service.ts` | 103 | `20` | Limite padrão de paginação |
| `auth/auth.service.ts` | 119 | `900` | Expiração do token em segundos |
| `auth/auth.module.ts` | 13 | `'15m'` | Expiração do JWT |
| `bookings/bookings.controller.ts` | 45 | `20` | Limite padrão de paginação |
| `properties/properties.controller.ts` | 47 | `20` | Limite padrão de paginação |

**Sugestão:** Centralizar constantes:
```typescript
// common/constants.ts
export const DEFAULT_PAGE_LIMIT = 20;
export const SERVICE_FEE_RATE = 0.1;
export const MS_PER_DAY = 86_400_000;
export const ACCESS_TOKEN_EXPIRY_SECONDS = 900;
```

---

##### 🟠 B-19: Duplicação de lógica de sanitização de senha (4 ocorrências)

**Arquivos:**
- `backend/src/auth/auth.service.ts:124` — `const { passwordHash, ...rest } = user;`
- `backend/src/auth/auth.controller.ts:61` — `const { passwordHash, ...rest } = user;`
- `backend/src/users/users.controller.ts:23` — `const { passwordHash, ...rest } = user;`
- `backend/src/users/users.controller.ts:30,33` — `const { passwordHash, email, role, id, ...allowed } = body;` + `const { passwordHash: _, ...rest } = user;`

**Sugestão:** Criar um utilitário ou interceptor:
```typescript
// common/sanitize.ts
export function toPublicUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash, ...rest } = user;
  return rest;
}
```

---

##### 🟠 B-20: Duplicação de lógica de paginação

**Arquivos:**
- `backend/src/bookings/bookings.service.ts:101-111`
- `backend/src/properties/properties.service.ts:102-115`

Padrão idêntico repetido em ambos os services:

```typescript
const page = filters.page || 1;
const limit = filters.limit || 20;
const total = results.length;
const totalPages = Math.ceil(total / limit);
const start = (page - 1) * limit;
const paged = results.slice(start, start + limit);
```

**Sugestão:** Extrair para utilitário genérico:
```typescript
// common/pagination.ts
export function paginate<T>(items: T[], page: number, limit: number): PaginatedResponse<T> { ... }
```

---

##### 🟡 B-21: Lógica de negócio em controllers

**Arquivos:**
- `backend/src/auth/auth.controller.ts:58-62`
- `backend/src/properties/properties.controller.ts:40-44`

```typescript
// auth.controller.ts:58-62 — Controller faz lookup e sanitização diretamente
@Get('me')
async me(@Request() req: any) {
  const user = this.usersService.findById(req.user.sub);
  if (!user) return null;               // Deveria ser 404
  const { passwordHash, ...rest } = user;
  return rest;
}

// properties.controller.ts:40-44 — Parsing de query params no controller
minPrice: minPrice ? Number(minPrice) : undefined,
maxPrice: maxPrice ? Number(maxPrice) : undefined,
guests: guests ? Number(guests) : undefined,
```

**Sugestão:** Mover lookup de usuário para `AuthService.getMe()`. Para parsing de queries, usar `class-transformer` com `@Type(() => Number)` em DTOs com `ValidationPipe`.

---

### 5. Validação de Entrada

##### 🔴 B-22: Sem validação de entrada em nenhum endpoint

**Arquivos:**
- `backend/src/auth/auth.controller.ts:23-32` — `@Body() body: { email: string; ... }` (tipo inline, sem decorators de validação)
- `backend/src/properties/properties.controller.ts:62` — `@Body() body: any`
- `backend/src/users/users.controller.ts:29` — `@Body() body: any`

Nenhum endpoint usa `class-validator`, `ValidationPipe`, ou DTOs formais. O tipo TypeScript é apagado em runtime — não há validação real.

```typescript
// properties.controller.ts:62 — Aceita QUALQUER payload
@Post()
@UseGuards(AuthGuard('jwt'))
create(@Request() req: any, @Body() body: any) {
  return this.propertiesService.create(req.user.sub, body);
}
```

**Impacto:** Injeção de campos arbitrários, dados malformados, crashes silenciosos.

**Sugestão:** Criar DTO classes com `class-validator` e habilitar `ValidationPipe` global:
```typescript
// Em main.ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

---

##### 🟡 B-23: `req.user` tipado como `any` em todos os controllers

**Arquivos:**
- `backend/src/auth/auth.controller.ts:58` — `@Request() req: any`
- `backend/src/bookings/bookings.controller.ts:23` — `@Request() req: any`
- `backend/src/properties/properties.controller.ts:62` — `@Request() req: any`
- `backend/src/users/users.controller.ts:20,29` — `@Request() req: any`

**Sugestão:** Criar um decorator `@CurrentUser()` tipado:
```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    return ctx.switchToHttp().getRequest().user;
  },
);
```

---

### 6. Tratamento de Erros

##### 🟠 B-24: Endpoint `GET /auth/me` retorna `null` em vez de 404

**Arquivo:** `backend/src/auth/auth.controller.ts:60`

```typescript
const user = this.usersService.findById(req.user.sub);
if (!user) return null;  // Deveria ser throw new NotFoundException()
```

**Impacto:** Frontend recebe status 200 com body `null`, dificultando tratamento de erro.

---

##### 🟡 B-25: Sem exception filter global

**Arquivo:** `backend/src/main.ts`

Não há `app.useGlobalFilters()`. Exceções não-HTTP (TypeError, etc.) retornam stack traces em produção.

**Sugestão:** Implementar um `AllExceptionsFilter`:
```typescript
app.useGlobalFilters(new AllExceptionsFilter());
```

---

##### 🟢 B-26: Sem logging estruturado

**Todos os services e controllers.**

Nenhum service usa `Logger` do NestJS. Sem logs, é impossível diagnosticar problemas em produção.

**Sugestão:** Injetar `private readonly logger = new Logger(AuthService.name);` em cada service.

---

### 7. Testes

##### 🟡 B-27: Testes existem mas não foram avaliados quanto a cobertura real

**Arquivos:**
- `backend/src/auth/auth.service.spec.ts` (6.3 KB)
- `backend/src/auth/auth.controller.spec.ts` (4.0 KB)
- `backend/src/bookings/bookings.service.spec.ts` (9.0 KB)
- `backend/src/properties/properties.service.spec.ts` (7.8 KB)
- `backend/test/auth.e2e-spec.ts` (5.7 KB)
- `backend/test/bookings.e2e-spec.ts` (6.6 KB)

Testes unitários e E2E existem com conteúdo substancial. Recomenda-se rodar `npm run test:cov` para avaliar cobertura real e identificar caminhos não testados (cenários de erro, edge cases de paginação, autorização).

---

##### 🟢 B-28: Sem testes para cenários de segurança

Não existem testes específicos para: tokens expirados, refresh tokens inválidos, acesso a recursos de outros usuários (IDOR), payloads malformados.

---

## Frontend

### 1. Design de Componentes

##### 🔴 F-01: Componentes de página são monolíticos — misturam data fetching, estado e renderização

**Arquivos:**
- `frontend/src/app/properties/[id]/page.tsx` — **401 linhas**, contém: fetch de dados, cálculo de preço, criação de booking, galeria de fotos, formulário, reviews
- `frontend/src/app/properties/page.tsx` — 227 linhas, contém: fetch, filtros, paginação, renderização
- `frontend/src/app/bookings/[id]/page.tsx` — 221 linhas, contém: fetch, cancelamento, detalhes

O componente `PropertyDetailPage` é o caso mais grave — é uma página monolítica com 12 variáveis de estado:

```typescript
// properties/[id]/page.tsx:34-44 — 12 useState em um único componente
const [property, setProperty] = useState<Property | null>(null);
const [loading, setLoading] = useState(true);
const [selectedPhoto, setSelectedPhoto] = useState(0);
const [checkIn, setCheckIn] = useState('');
const [checkOut, setCheckOut] = useState('');
const [guests, setGuests] = useState(1);
const [bookingLoading, setBookingLoading] = useState(false);
const [bookingError, setBookingError] = useState('');
const [bookingSuccess, setBookingSuccess] = useState(false);
const { user } = useAuth();
const router = useRouter();
```

**Sugestão:** Decompor em componentes menores: `PropertyPhotoGallery`, `BookingWidget`, `PropertyReviews`, `PropertyAmenities`. Extrair lógica para custom hooks: `useProperty(id)`, `useBookingForm()`.

---

##### 🟠 F-02: `PropertyCard` usa `'use client'` desnecessariamente

**Arquivo:** `frontend/src/components/properties/property-card.tsx:1`

```typescript
'use client';
```

O componente é puramente apresentacional — recebe props e renderiza HTML. Não usa hooks, state, ou efeitos. Poderia ser um Server Component, reduzindo o bundle JavaScript.

**Sugestão:** Remover `'use client'` e importar `Image` de `next/image` (já funciona em Server Components).

---

##### 🟠 F-03: Diretório `hooks/` vazio — nenhum custom hook existe

**Arquivo:** `frontend/src/hooks/` — diretório sem arquivos

Toda a lógica de data fetching está diretamente nos componentes de página. O projeto não possui nenhum custom hook.

**Sugestão:** Criar hooks como:
- `useProperty(id)` — fetch + loading + error
- `useBookings()` — listagem com filtros
- `useBookingForm(propertyId)` — estado do formulário + submit
- `usePriceCalculation(property, checkIn, checkOut)` — cálculo de preço

---

### 2. Separação de Responsabilidades

##### 🔴 F-04: Lógica de cálculo de preço duplicada entre backend e frontend

**Arquivos:**
- `backend/src/bookings/bookings.service.ts:55-57`
- `frontend/src/app/properties/[id]/page.tsx:54-70`

```typescript
// Backend — bookings.service.ts:55-57
const subtotal = property.pricePerNight * totalNights;
const serviceFee = Math.round(subtotal * 0.1);
const totalPrice = subtotal + property.cleaningFee + serviceFee;

// Frontend — properties/[id]/page.tsx:61-68
const subtotal = property.pricePerNight * nights;
const serviceFee = Math.round(subtotal * 0.1);
// total: subtotal + property.cleaningFee + serviceFee
```

**Impacto:** Se a fórmula de preço mudar no backend, o frontend mostrará valores diferentes. Magic number `0.1` duplicado em ambos.

**Sugestão:** Criar endpoint `GET /properties/:id/pricing?checkIn=...&checkOut=...&guests=...` no backend para cálculo centralizado.

---

##### 🟠 F-05: Lógica de navegação condicional misturada com data fetching

**Arquivos:**
- `frontend/src/app/bookings/page.tsx:28-42`
- `frontend/src/app/bookings/[id]/page.tsx:35-45`

```typescript
// bookings/page.tsx:28-32 — Auth guard no useEffect
useEffect(() => {
  if (!user) {
    router.push('/login');
    return;
  }
  api.bookings.list()...
}, [user, router]);
```

**Impacto:** Lógica de autenticação repetida em cada página protegida. Inconsistente — algumas páginas checam, outras não.

**Sugestão:** Criar um componente `ProtectedRoute` ou middleware via `middleware.ts` do Next.js.

---

##### 🟠 F-06: `api.ts` não possui tipagem de retorno — casts manuais em todos os consumers

**Arquivo:** `frontend/src/lib/api.ts`

```typescript
// api.ts:53-55 — Retorna tipo genérico sem especificação
list: (params?: Record<string, string>) => {
  return request(`/properties${query}`);  // Retorna Promise<unknown>
},
```

Todos os consumers fazem cast manual:

```typescript
// page.tsx:22 — Cast manual
const data = res as PaginatedResponse<Property>;

// bookings/page.tsx:37 — Cast manual
const data = res as PaginatedResponse<Booking>;

// auth-context.tsx:38 — Cast manual
.then((u) => setUser(u as User))
```

**Impacto:** Sem segurança de tipos em runtime. Se a API mudar, TypeScript não detectará o erro.

**Sugestão:** Tipar retornos no `api.ts`:
```typescript
list: (params?: Record<string, string>): Promise<PaginatedResponse<Property>> =>
  request<PaginatedResponse<Property>>(`/properties${query}`),
```

---

### 3. Violações DRY

##### 🟠 F-07: Formatação de datas com `toLocaleDateString('pt-BR')` repetida 6+ vezes

**Arquivos:**
- `frontend/src/app/bookings/page.tsx:96-97`
- `frontend/src/app/bookings/[id]/page.tsx:135-140, 147-150, 209-215`
- `frontend/src/app/properties/[id]/page.tsx:279`

```typescript
// Padrão repetido sem utilitário
{new Date(booking.checkIn).toLocaleDateString('pt-BR')}
{new Date(booking.checkIn).toLocaleDateString('pt-BR', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
})}
```

**Sugestão:** Criar utilitário:
```typescript
// lib/format.ts
export const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleDateString('pt-BR', options);
```

---

##### 🟠 F-08: Mapeamento de status de booking duplicado em 2 arquivos

**Arquivos:**
- `frontend/src/app/bookings/page.tsx:15-20`
- `frontend/src/app/bookings/[id]/page.tsx:16-21`

```typescript
// bookings/page.tsx:15-20
const statusLabels: Record<string, { label: string; variant: ... }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  confirmed: { label: 'Confirmada', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  completed: { label: 'Concluída', variant: 'outline' },
};

// bookings/[id]/page.tsx:16-21 — Objeto quase idêntico com campo extra `icon`
const statusConfig: Record<string, { label: string; variant: ...; icon: ... }> = { ... };
```

**Sugestão:** Unificar em `lib/booking-utils.ts`:
```typescript
export const BOOKING_STATUS_CONFIG = { ... };
```

---

##### 🟡 F-09: Skeleton de loading com `animate-pulse` repetido em 4 páginas

**Arquivos:**
- `frontend/src/app/page.tsx:102-113`
- `frontend/src/app/properties/page.tsx:182-193`
- `frontend/src/app/properties/[id]/page.tsx:107-119`
- `frontend/src/app/bookings/page.tsx:51-55`

Mesmo padrão de divs com `animate-pulse` e `bg-gray-200` repetido sem componente reutilizável.

**Sugestão:** Criar componentes `<PropertyCardSkeleton />`, `<BookingCardSkeleton />`, `<PropertyDetailSkeleton />`.

---

##### 🟡 F-10: Markup de exibição de erro repetido em 4 formulários

**Arquivos:**
- `frontend/src/app/login/page.tsx:45-48`
- `frontend/src/app/register/page.tsx:52-55`
- `frontend/src/app/properties/[id]/page.tsx:353-354`

```typescript
// Padrão repetido
{error && (
  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
    {error}
  </div>
)}
```

**Sugestão:** Criar componente `<FormError message={error} />`.

---

##### 🟡 F-11: Objeto `typeLabels` para tipos de propriedade definido dentro do componente

**Arquivo:** `frontend/src/components/properties/property-card.tsx:14-20`

```typescript
export function PropertyCard({ property }: PropertyCardProps) {
  // Recriado a cada render
  const typeLabels: Record<string, string> = {
    apartment: 'Apartamento',
    house: 'Casa',
    villa: 'Villa',
    room: 'Quarto',
    studio: 'Studio',
  };
```

**Sugestão:** Mover para fora do componente ou para `lib/property-utils.ts` como constante.

---

### 4. Anti-patterns React

##### 🔴 F-12: `useEffect` sem cleanup — requisições em andamento após unmount

**Arquivos:**
- `frontend/src/app/properties/[id]/page.tsx:46-52`
- `frontend/src/app/bookings/page.tsx:34-41`
- `frontend/src/app/bookings/[id]/page.tsx:40-44`
- `frontend/src/app/page.tsx:18-27`
- `frontend/src/app/properties/page.tsx:39-55`
- `frontend/src/lib/auth-context.tsx:33-47`

Nenhum `useEffect` com fetch implementa cleanup via `AbortController`:

```typescript
// properties/[id]/page.tsx:46-52 — Sem cleanup
useEffect(() => {
  api.properties
    .get(id)
    .then((res) => setProperty(res as Property))  // Pode executar após unmount
    .catch(console.error)
    .finally(() => setLoading(false));
}, [id]);
```

**Impacto:** Memory leaks, warnings "Can't perform a React state update on an unmounted component", race conditions.

**Sugestão:** Implementar `AbortController` ou usar custom hooks com cleanup:
```typescript
useEffect(() => {
  const controller = new AbortController();
  api.properties.get(id, { signal: controller.signal })
    .then(...)
    .catch((err) => { if (!controller.signal.aborted) console.error(err); });
  return () => controller.abort();
}, [id]);
```

---

##### 🟠 F-13: `router` como dependência de `useEffect` — referência instável

**Arquivos:**
- `frontend/src/app/bookings/page.tsx:42` — `[user, router]`
- `frontend/src/app/bookings/[id]/page.tsx:45` — `[id, user, router]`

```typescript
useEffect(() => {
  if (!user) { router.push('/login'); return; }
  api.bookings.list()...
}, [user, router]);  // `router` é instável no Next.js
```

**Impacto:** O efeito pode re-executar desnecessariamente quando `router` muda de referência.

**Sugestão:** Remover `router` do array de dependências (é estável na prática, mas o linter reclama). Ou mover a lógica de redirect para fora do `useEffect`.

---

##### 🟠 F-14: Filtros disparam API call a cada keystroke — sem debounce

**Arquivo:** `frontend/src/app/properties/page.tsx:39-55,84`

```typescript
// Linha 84 — onChange direto no input
onChange={(e) => updateFilter('city', e.target.value)}

// Linha 39-55 — useEffect dispara a cada mudança de filters
useEffect(() => {
  setLoading(true);
  api.properties.list(params)...
}, [filters]);  // Toda mudança de filtro = nova requisição
```

**Impacto:** Digitar "Rio de Janeiro" dispara 17 requisições HTTP. UX degradada e carga desnecessária no servidor.

**Sugestão:** Implementar debounce:
```typescript
const debouncedFilters = useDebounce(filters, 300);
useEffect(() => { ... }, [debouncedFilters]);
```

---

##### 🟡 F-15: Objetos recriados a cada render dentro de componentes

**Arquivos:**
- `frontend/src/app/properties/[id]/page.tsx:134-138` — `policyLabels` recriado a cada render
- `frontend/src/components/properties/property-card.tsx:14-20` — `typeLabels` recriado a cada render
- `frontend/src/app/page.tsx:36-40` — `categories` recriado a cada render

**Sugestão:** Mover objetos estáticos para fora do componente (module scope) ou usar `useMemo`.

---

### 5. Boas Práticas Next.js

##### 🔴 F-16: Excesso de `'use client'` — todas as páginas são Client Components

**Arquivos com `'use client'` (11 ocorrências):**
- `frontend/src/app/page.tsx:1`
- `frontend/src/app/login/page.tsx:1`
- `frontend/src/app/register/page.tsx:1`
- `frontend/src/app/properties/page.tsx:1`
- `frontend/src/app/properties/[id]/page.tsx:1`
- `frontend/src/app/bookings/page.tsx:1`
- `frontend/src/app/bookings/[id]/page.tsx:1`
- `frontend/src/app/providers.tsx:1`
- `frontend/src/lib/auth-context.tsx:1`
- `frontend/src/components/layout/header.tsx:1`
- `frontend/src/components/properties/property-card.tsx:1`

100% das páginas e a maioria dos componentes são Client Components. Nenhuma página usa Server Components ou `generateMetadata()`.

**Impacto:** Bundle JavaScript maior, sem streaming SSR, sem benefícios de cache do Next.js 16, SEO comprometido.

**Sugestão:** Reestruturar com padrão híbrido:
- Páginas como Server Components que fazem fetch
- Componentes interativos como Client Components filhos
- `PropertyCard` e `Footer` como Server Components puros

---

##### 🟠 F-17: Sem `error.tsx` em nenhuma rota

**Diretórios sem error boundary:**
- `frontend/src/app/error.tsx` — não existe
- `frontend/src/app/bookings/error.tsx` — não existe
- `frontend/src/app/properties/error.tsx` — não existe
- `frontend/src/app/login/error.tsx` — não existe

**Impacto:** Erros de runtime causam tela branca. Sem fallback amigável para o usuário.

**Sugestão:** Criar pelo menos `app/error.tsx` como error boundary global.

---

##### 🟠 F-18: Sem `loading.tsx` em rotas com data fetching

**Diretórios sem loading state:**
- `frontend/src/app/bookings/loading.tsx` — não existe
- `frontend/src/app/properties/loading.tsx` — não existe
- `frontend/src/app/properties/[id]/loading.tsx` — não existe

**Impacto:** Sem Suspense boundary nativo. Loading states são implementados manualmente e de forma inconsistente.

---

##### 🟡 F-19: Sem `generateMetadata()` em páginas dinâmicas

**Arquivos:**
- `frontend/src/app/properties/[id]/page.tsx` — sem metadata dinâmico
- `frontend/src/app/bookings/[id]/page.tsx` — sem metadata dinâmico

Apenas `layout.tsx` define metadata estático. Páginas de propriedade deveriam ter título dinâmico para SEO.

---

### 6. Tratamento de Erros

##### 🟠 F-20: Padrão inconsistente de tratamento de erros — 3 abordagens diferentes

| Padrão | Arquivos | Qualidade |
|--------|----------|-----------|
| `.catch(console.error)` (silencioso) | `page.tsx:25`, `properties/page.tsx:53`, `bookings/page.tsx:40`, `properties/[id]/page.tsx:50`, `bookings/[id]/page.tsx:43` | ❌ Ruim — usuário não vê nada |
| `try/catch` com `setError()` | `login/page.tsx:24-31`, `register/page.tsx:29-38`, `properties/[id]/page.tsx:84-99` | ✅ Bom |
| `alert()` nativo | `bookings/[id]/page.tsx:54` | ❌ Ruim — bloqueia UI |

```typescript
// bookings/[id]/page.tsx:53-54 — alert() nativo
} catch (err) {
  alert(err instanceof Error ? err.message : 'Erro ao cancelar');
}
```

**Sugestão:** Padronizar em `try/catch` com estado de erro + componente `<FormError />`. Substituir `console.error` silencioso por feedback visual.

---

##### 🟡 F-21: `auth-context.tsx` não propaga erros de inicialização

**Arquivo:** `frontend/src/lib/auth-context.tsx:39-42`

```typescript
.catch(() => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
})
```

Se o token existir mas estiver expirado, o usuário é silenciosamente deslogado sem feedback.

**Sugestão:** Adicionar estado de erro na inicialização ou tentar refresh antes de deslogar.

---

### 7. Acessibilidade e UX

##### 🟡 F-22: Credenciais de teste hardcoded nos campos de login

**Arquivo:** `frontend/src/app/login/page.tsx:13-14`

```typescript
const [email, setEmail] = useState('maria@example.com');
const [password, setPassword] = useState('mock.maria');
```

**Impacto:** Em produção, campos de login viriam preenchidos com credenciais de teste.

**Sugestão:** Usar variável de ambiente:
```typescript
const [email, setEmail] = useState(process.env.NEXT_PUBLIC_DEFAULT_EMAIL || '');
```

---

##### 🟢 F-23: URL da API hardcoded

**Arquivo:** `frontend/src/lib/api.ts:1`

```typescript
const API_BASE = 'http://localhost:3001/v1';
```

**Sugestão:** `const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';`

---

##### 🟢 F-24: `Footer` não usa links de navegação — itens são apenas texto

**Arquivo:** `frontend/src/components/layout/footer.tsx:20-34`

```typescript
<ul className="space-y-2 text-sm text-gray-500">
  <li>Apartamentos</li>  <!-- Deveria ser <Link> -->
  <li>Casas</li>
  <li>Chalés e Cabanas</li>
</ul>
```

---

##### 🟢 F-25: `confirm()` nativo para ação destrutiva

**Arquivo:** `frontend/src/app/bookings/[id]/page.tsx:48`

```typescript
if (!booking || !confirm('Tem certeza que deseja cancelar esta reserva?')) return;
```

**Sugestão:** Usar componente `<Dialog>` do shadcn/ui (já disponível no projeto) para confirmação visual consistente.

---

## Tabela Consolidada de Problemas

| # | Severidade | Área | Descrição | Arquivo Principal |
|---|-----------|------|-----------|-------------------|
| B-01 | 🟠 Alta | Backend/SRP | AuthService com 5+ responsabilidades | `auth/auth.service.ts` |
| B-02 | 🟠 Alta | Backend/SRP | `findAll()` God Method (107 linhas) | `properties/properties.service.ts` |
| B-03 | 🟠 Alta | Backend/SRP | `create()` mistura validação, pricing, persistência | `bookings/bookings.service.ts` |
| B-04 | 🟠 Alta | Backend/OCP | Switch-case de ordenação | `properties/properties.service.ts` |
| B-05 | 🟡 Média | Backend/ISP | `User` expõe passwordHash | `common/types.ts` |
| B-06 | 🟡 Média | Backend/ISP | `Property` inclui reviews desnecessariamente | `common/types.ts` |
| B-07 | 🟡 Média | Backend/ISP | `Booking` desnormaliza dados de Property | `common/types.ts` |
| B-08 | 🔴 Crítica | Backend/DIP | Services sem interfaces/abstrações | Múltiplos |
| B-09 | 🔴 Crítica | Backend/DIP | Repository Pattern ausente | Múltiplos |
| B-10 | 🔴 Crítica | Backend/Seg | JWT secret hardcoded | `auth/auth.module.ts` |
| B-11 | 🔴 Crítica | Backend/Seg | Hashing de senha mockado | `auth/auth.service.ts` |
| B-12 | 🔴 Crítica | Backend/Seg | IDOR em GET /bookings/:id | `bookings/bookings.controller.ts` |
| B-13 | 🟠 Alta | Backend/Seg | CORS origin hardcoded | `main.ts` |
| B-14 | 🟡 Média | Backend/Seg | Sem rate limiting | `auth/auth.controller.ts` |
| B-15 | 🟡 Média | Backend/Seg | Refresh tokens sem TTL | `auth/auth.service.ts` |
| B-16 | 🔴 Crítica | Backend/Arq | Zero persistência (in-memory) | Múltiplos |
| B-17 | 🟠 Alta | Backend/Arq | Acoplamento forte entre módulos | `auth/auth.controller.ts` |
| B-18 | 🟠 Alta | Backend/Qual | Magic numbers (8 ocorrências) | Múltiplos |
| B-19 | 🟠 Alta | Backend/Qual | Sanitização de senha duplicada 4x | Múltiplos |
| B-20 | 🟠 Alta | Backend/Qual | Paginação duplicada | Múltiplos |
| B-21 | 🟡 Média | Backend/Qual | Lógica de negócio em controllers | `auth/auth.controller.ts` |
| B-22 | 🔴 Crítica | Backend/Val | Sem validação de entrada | Múltiplos |
| B-23 | 🟡 Média | Backend/Val | `req.user` tipado como `any` | Múltiplos |
| B-24 | 🟠 Alta | Backend/Err | `GET /me` retorna null em vez de 404 | `auth/auth.controller.ts` |
| B-25 | 🟡 Média | Backend/Err | Sem exception filter global | `main.ts` |
| B-26 | 🟢 Baixa | Backend/Err | Sem logging estruturado | Múltiplos |
| B-27 | 🟡 Média | Backend/Test | Cobertura de testes não avaliada | Múltiplos |
| B-28 | 🟢 Baixa | Backend/Test | Sem testes de segurança | Múltiplos |
| F-01 | 🔴 Crítica | Frontend/Comp | Componentes monolíticos (401 linhas) | `properties/[id]/page.tsx` |
| F-02 | 🟠 Alta | Frontend/Comp | `'use client'` desnecessário em PropertyCard | `property-card.tsx` |
| F-03 | 🟠 Alta | Frontend/Comp | Nenhum custom hook existe | `hooks/` (vazio) |
| F-04 | 🔴 Crítica | Frontend/SoC | Cálculo de preço duplicado front/back | Múltiplos |
| F-05 | 🟠 Alta | Frontend/SoC | Auth guard repetido em cada página | Múltiplos |
| F-06 | 🟠 Alta | Frontend/SoC | API sem tipagem de retorno — casts manuais | `lib/api.ts` |
| F-07 | 🟠 Alta | Frontend/DRY | Formatação de datas repetida 6+ vezes | Múltiplos |
| F-08 | 🟠 Alta | Frontend/DRY | Status labels de booking duplicados | Múltiplos |
| F-09 | 🟡 Média | Frontend/DRY | Skeleton loading duplicado em 4 páginas | Múltiplos |
| F-10 | 🟡 Média | Frontend/DRY | Markup de erro repetido | Múltiplos |
| F-11 | 🟡 Média | Frontend/DRY | `typeLabels` definido dentro do componente | `property-card.tsx` |
| F-12 | 🔴 Crítica | Frontend/React | useEffect sem cleanup (6 ocorrências) | Múltiplos |
| F-13 | 🟠 Alta | Frontend/React | `router` como dep instável de useEffect | Múltiplos |
| F-14 | 🟠 Alta | Frontend/React | Filtros sem debounce — 17+ requests por busca | `properties/page.tsx` |
| F-15 | 🟡 Média | Frontend/React | Objetos recriados a cada render | Múltiplos |
| F-16 | 🔴 Crítica | Frontend/Next | 100% Client Components — sem SSR | Múltiplos |
| F-17 | 🟠 Alta | Frontend/Next | Sem error.tsx em nenhuma rota | Múltiplos |
| F-18 | 🟠 Alta | Frontend/Next | Sem loading.tsx em rotas com fetch | Múltiplos |
| F-19 | 🟡 Média | Frontend/Next | Sem generateMetadata() dinâmico | Múltiplos |
| F-20 | 🟠 Alta | Frontend/Err | 3 padrões inconsistentes de erro | Múltiplos |
| F-21 | 🟡 Média | Frontend/Err | Auth init não propaga erros | `auth-context.tsx` |
| F-22 | 🟡 Média | Frontend/UX | Credenciais de teste hardcoded no login | `login/page.tsx` |
| F-23 | 🟢 Baixa | Frontend/UX | URL da API hardcoded | `lib/api.ts` |
| F-24 | 🟢 Baixa | Frontend/UX | Footer sem links de navegação | `footer.tsx` |
| F-25 | 🟢 Baixa | Frontend/UX | `confirm()` nativo em ação destrutiva | `bookings/[id]/page.tsx` |

---

## Roadmap de Correção (priorizado por impacto)

### Fase 1 — Segurança e Fundação (Pré-produção)

| Item | Ação | Itens Relacionados |
|------|------|-------------------|
| 1 | Implementar variáveis de ambiente (`@nestjs/config` + `.env`) | B-10, B-13, F-23 |
| 2 | Hashing real de senhas com `bcryptjs` | B-11 |
| 3 | Corrigir IDOR — verificar ownership em `GET /bookings/:id` | B-12 |
| 4 | Adicionar `ValidationPipe` global + criar DTOs com `class-validator` | B-22, B-23 |
| 5 | Adicionar `@nestjs/throttler` para rate limiting em auth | B-14 |
| 6 | Implementar exception filter global | B-25 |
| 7 | Adicionar TTL para refresh tokens | B-15 |
| 8 | Mover credenciais de teste para variáveis de ambiente | F-22 |

### Fase 2 — Arquitetura e Patterns (Escalabilidade)

| Item | Ação | Itens Relacionados |
|------|------|-------------------|
| 9 | Implementar Repository Pattern com interfaces | B-08, B-09 |
| 10 | Integrar banco de dados (PostgreSQL + TypeORM/Prisma) | B-16 |
| 11 | Extrair `TokenService`, `PricingService`, `BookingValidator` | B-01, B-03 |
| 12 | Implementar Strategy Pattern para filtros e ordenação | B-02, B-04 |
| 13 | Criar utilitários compartilhados (paginação, sanitização, constantes) | B-18, B-19, B-20 |
| 14 | Desacoplar `AuthController` do `UsersService` | B-17 |

### Fase 3 — Frontend Quality (Manutenibilidade)

| Item | Ação | Itens Relacionados |
|------|------|-------------------|
| 15 | Criar custom hooks (`useProperty`, `useBookings`, `useBookingForm`) | F-01, F-03 |
| 16 | Decompor `PropertyDetailPage` em sub-componentes | F-01 |
| 17 | Tipar retornos do `api.ts` — eliminar casts manuais | F-06 |
| 18 | Implementar `AbortController` em todos os `useEffect` com fetch | F-12 |
| 19 | Adicionar debounce em filtros de busca | F-14 |
| 20 | Extrair utilitários compartilhados (formatDate, statusConfig, skeletons) | F-07, F-08, F-09, F-10, F-11 |
| 21 | Padronizar tratamento de erros (eliminar console.error e alert) | F-20, F-21 |
| 22 | Implementar `ProtectedRoute` para auth guards | F-05 |

### Fase 4 — Next.js Best Practices (Performance e SEO)

| Item | Ação | Itens Relacionados |
|------|------|-------------------|
| 23 | Converter páginas para Server Components onde possível | F-16 |
| 24 | Remover `'use client'` de `PropertyCard` e `Footer` | F-02 |
| 25 | Criar `error.tsx` e `loading.tsx` nas rotas principais | F-17, F-18 |
| 26 | Implementar `generateMetadata()` em páginas dinâmicas | F-19 |
| 27 | Centralizar cálculo de preço no backend via endpoint | F-04 |
| 28 | Criar endpoint de pricing no backend | F-04 |

### Fase 5 — Polimento

| Item | Ação | Itens Relacionados |
|------|------|-------------------|
| 29 | Adicionar logging estruturado com `Logger` do NestJS | B-26 |
| 30 | Avaliar e expandir cobertura de testes | B-27, B-28 |
| 31 | Mover lógica de negócio dos controllers para services | B-21 |
| 32 | Converter links do Footer para componentes `<Link>` | F-24 |
| 33 | Substituir `confirm()` por Dialog do shadcn/ui | F-25 |
| 34 | Mover objetos estáticos para module scope | F-15 |
