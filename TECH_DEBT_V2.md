# Relatório de Dívida Técnica V2 — Nomadia (Pós-Refatoração)

> **Data da análise:** 13/02/2026
> **Escopo:** Backend (NestJS 11) + Frontend (Next.js 16)
> **Foco:** Violações de princípios de design, boas práticas de framework, segurança, qualidade de código
> **Base de referência:** `TECH_DEBT.md` (V1, 39 itens) + `REFACTORING_REPORT.md`

---

## Resumo Executivo

| Severidade | Backend | Frontend | Total |
|-----------|---------|----------|-------|
| 🔴 Crítica | 1 | 2 | **3** |
| 🟠 Alta | 2 | 7 | **9** |
| 🟡 Média | 6 | 6 | **12** |
| 🟢 Baixa | 1 | 3 | **4** |
| **Total** | **10** | **18** | **28** |

### Comparativo V1 → V2

| Métrica | V1 | V2 | Δ |
|---------|------|------|---|
| Total de itens | 39 | 28 | **−28%** |
| Críticos | 11 | 3 | **−73%** |
| Alta | 13 | 9 | **−31%** |
| Média | 10 | 12 | +20% (itens granulares novos) |
| Baixa | 5 | 4 | −20% |

A refatoração eliminou a maioria dos problemas estruturais (repository pattern, DTOs, bcrypt, decomposição de componentes, custom hooks, utilitários de formatação). Os itens remanescentes concentram-se em **integração incompleta** (utilitários criados mas não adotados), **fluxo de autenticação frontend** e **lacunas de validação**.

---

## Metodologia e Classificação de Severidade

| Severidade | Significado | Critério |
|-----------|-------------|----------|
| 🔴 Crítica | Deve ser corrigido antes de produção | Vulnerabilidade de segurança, perda de dados, falha arquitetural |
| 🟠 Alta | Impacta manutenibilidade e escalabilidade | Violação de princípios de design, acoplamento forte, duplicação significativa |
| 🟡 Média | Afeta qualidade do código | Anti-patterns, inconsistências, falta de cobertura |
| 🟢 Baixa | Melhoria desejável | Otimizações, convenções, polimento |

---

## Progresso desde V1

A refatoração documentada em `REFACTORING_REPORT.md` resolveu com sucesso os seguintes problemas da V1:

| Categoria | Itens resolvidos | Implementação |
|-----------|-----------------|---------------|
| **Repository Pattern** | B-16..B-18 | Interfaces `IUserRepository`, `IPropertyRepository`, `IBookingRepository` com injeção via tokens |
| **DTOs + Validação** | B-19..B-21 | `RegisterDto`, `LoginDto`, `CreateBookingDto`, `RefreshDto` com `class-validator` |
| **Hashing de senhas** | B-11 | `bcryptjs` com custo configurável |
| **Variáveis de ambiente** | B-10, B-13 | `@nestjs/config` com `ConfigService` |
| **Exception Filter** | B-22..B-25 | `AllExceptionsFilter` global |
| **Rate Limiting** | Parcial | `ThrottlerModule` + `@Throttle` em login/register |
| **PropertyFilterBuilder** | B-04 | Builder pattern com encadeamento |
| **Decomposição de componentes** | F-01..F-03 | `PropertyPhotoGallery`, `PropertyAmenities`, `PropertyReviews`, `PropertyInfo` |
| **Custom Hooks** | F-08..F-09 | `useFetch` com AbortController, `useDebounce` |
| **Utilitários de formatação** | F-10..F-12 | `format.ts` com `formatCurrency`, `formatDate`, `formatDateLong`, `formatDateTime` |
| **Error/Loading boundaries** | F-17..F-18 | `error.tsx` e `loading.tsx` globais |

---

## Backend

### 1. Segurança

#### 🔴 B-01: JWT secret hardcoded como fallback

**Arquivos:** `auth/jwt.strategy.ts:13-16`, `auth/auth.module.ts:16-19`

O secret JWT possui um fallback hardcoded (`'nomadia-mvp-secret-key-local-only'`) que será usado se a variável de ambiente `JWT_SECRET` não estiver definida. Isso permite que a aplicação rode em produção com um secret previsível e público.

```typescript
// auth/jwt.strategy.ts:13-16
secretOrKey: configService.get<string>(
  'JWT_SECRET',
  'nomadia-mvp-secret-key-local-only', // ← fallback previsível
),

// auth/auth.module.ts:16-19
secret: config.get<string>(
  'JWT_SECRET',
  'nomadia-mvp-secret-key-local-only', // ← duplicado aqui
),
```

**Impacto:** Um atacante pode forjar tokens JWT válidos se o ambiente não definir `JWT_SECRET`. É a vulnerabilidade mais crítica do sistema.

**Sugestão:** Remover o fallback e lançar erro na inicialização se `JWT_SECRET` não estiver definida:
```typescript
const secret = configService.getOrThrow<string>('JWT_SECRET');
```

---

#### 🟠 B-02: Validação de senha insuficiente

**Arquivo:** `auth/dto/register.dto.ts:7-9`

O DTO de registro exige apenas `@MinLength(6)` para a senha, sem nenhum critério de complexidade.

```typescript
// auth/dto/register.dto.ts:7-9
@IsString()
@MinLength(6)
password: string;
```

**Impacto:** Senhas triviais como `123456` ou `aaaaaa` são aceitas, facilitando ataques de força bruta e dicionário.

**Sugestão:** Adicionar `@Matches()` com regex de complexidade:
```typescript
@IsString()
@MinLength(8)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
  message: 'Senha deve conter maiúscula, minúscula e número',
})
password: string;
```

---

#### 🟠 B-03: Endpoint `/auth/refresh` sem rate limiting

**Arquivo:** `auth/auth.controller.ts:37-41`

Os endpoints `register` e `login` possuem `@Throttle` + `@UseGuards(ThrottlerGuard)`, mas o endpoint `refresh` não tem nenhuma proteção:

```typescript
// auth/auth.controller.ts:37-41
@Post('refresh')
@HttpCode(200)
// ← Sem @UseGuards(ThrottlerGuard) / @Throttle
async refresh(@Body() body: RefreshDto) {
  return this.authService.refresh(body.refreshToken);
}
```

**Impacto:** Permite brute force de refresh tokens sem limitação de taxa.

**Sugestão:** Adicionar os mesmos decorators de throttle:
```typescript
@Post('refresh')
@HttpCode(200)
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60000 } })
async refresh(@Body() body: RefreshDto) { ... }
```

---

#### 🟢 B-10: BCRYPT_ROUNDS insuficiente para produção

**Configuração:** Variável de ambiente `BCRYPT_ROUNDS` com padrão `4`

O custo `4` é o mínimo aceito pelo bcrypt e insuficiente para produção. A OWASP recomenda um mínimo de `10` para resistir a ataques de GPU.

**Impacto:** Baixo em desenvolvimento, crítico se mantido em produção.

**Sugestão:** Alterar o padrão para `10` ou configurar via env em produção.

---

### 2. Validação

#### 🟡 B-04: `dateOfBirth` sem validação de formato de data

**Arquivo:** `auth/dto/register.dto.ts:22-24`

```typescript
// auth/dto/register.dto.ts:22-24
@IsOptional()
@IsString()
dateOfBirth?: string;
```

O campo aceita qualquer string (ex.: `"ontem"`, `"abc"`). Deveria usar `@IsDateString()` do `class-validator`.

**Impacto:** Dados inválidos no sistema; erros silenciosos ao processar datas.

**Sugestão:**
```typescript
@IsOptional()
@IsDateString()
dateOfBirth?: string;
```

---

#### 🟡 B-05: `phone` sem validação de formato

**Arquivo:** `auth/dto/register.dto.ts:17-19`

```typescript
// auth/dto/register.dto.ts:17-19
@IsOptional()
@IsString()
phone?: string;
```

Aceita qualquer string como telefone. Deveria usar `@Matches()` com regex de telefone brasileiro ou `@IsPhoneNumber('BR')` do `class-validator`.

**Impacto:** Dados inconsistentes; impossibilidade de usar telefone para verificação/contato.

**Sugestão:**
```typescript
@IsOptional()
@Matches(/^\+?[\d\s()-]{10,15}$/, { message: 'Formato de telefone inválido' })
phone?: string;
```

---

#### 🟡 B-06: `role` no RegisterDto sem restrição de valores

**Arquivo:** `auth/dto/register.dto.ts:26-27`

```typescript
// auth/dto/register.dto.ts:26-27
@IsOptional()
@IsString()
role?: 'guest' | 'host';
```

O TypeScript restringe via tipo, mas em runtime o `class-validator` aceita qualquer string pois não há `@IsIn()`. Um usuário pode enviar `role: "admin"`.

**Impacto:** Possível escalação de privilégios se o backend não sanitizar o valor.

**Sugestão:**
```typescript
@IsOptional()
@IsIn(['guest', 'host'])
role?: 'guest' | 'host';
```

---

### 3. Arquitetura

#### 🟡 B-07: Nenhum interceptor implementado

**Diretório:** `common/` (ausente)

O backend não possui nenhum interceptor para logging de requisições, transformação de resposta ou métricas de performance. Toda observabilidade depende de `console.log` no exception filter.

**Impacto:** Em produção, não há visibilidade sobre latência de endpoints, payloads de requisições ou rastreamento de erros. Dificulta debugging e monitoramento.

**Sugestão:** Implementar pelo menos um `LoggingInterceptor`:
```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`${context.getHandler().name} ${Date.now() - now}ms`)),
    );
  }
}
```

---

### 4. Testes

#### 🟡 B-08: `PropertyFilterBuilder` sem testes dedicados

**Arquivo esperado:** `properties/filters/property-filter.builder.spec.ts` (ausente)

O `PropertyFilterBuilder` é uma classe com 9 métodos de filtragem (cidade, estado, tipo, preço, hóspedes, quartos, amenidades). Apesar de ser testado indiretamente via `PropertiesService`, não possui testes unitários dedicados para edge cases.

**Impacto:** Regressões em filtros individuais podem passar despercebidas. Filtros com null, arrays vazios ou valores extremos não são cobertos.

**Sugestão:** Criar `property-filter.builder.spec.ts` com testes para cada filtro isoladamente e em combinação.

---

#### 🟡 B-09: Zero testes E2E

**Diretório:** `test/` (sem arquivos `.e2e-spec.ts` válidos)

Não há testes E2E que validem o fluxo completo de requisições HTTP, incluindo serialização, validação, autenticação e formato de resposta.

**Impacto:** Problemas de integração entre camadas (controller → service → repository) não são detectados. Regressões em formato de resposta da API podem quebrar o frontend.

**Sugestão:** Implementar testes E2E com `supertest` para os fluxos principais: registro → login → criação de propriedade → busca → reserva → cancelamento.

---

## Frontend

### 1. Autenticação

#### 🔴 F-01: `logout()` não revoga refresh token no servidor

**Arquivo:** `lib/auth-context.tsx:69-73`

A função `logout()` apenas limpa `localStorage`, sem chamar o endpoint `POST /auth/logout` do backend. O refresh token permanece válido no servidor.

```typescript
// lib/auth-context.tsx:69-73
const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  setUser(null);
  // ← Não chama api.auth.logout() para revogar o refresh token
};
```

**Impacto:** Um atacante que obteve o refresh token (ex.: via XSS) pode continuar gerando access tokens mesmo após o usuário fazer logout.

**Sugestão:**
```typescript
const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) {
    await api.auth.logout(refreshToken).catch(() => {});
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  setUser(null);
};
```

Nota: requer adicionar `api.auth.logout()` ao API client (`api.ts`).

---

#### 🔴 F-02: Nenhuma lógica de token refresh implementada

**Arquivo:** `lib/auth-context.tsx` (funcionalidade ausente), `lib/api.ts` (sem interceptor de 401)

O backend implementa `/auth/refresh` e o frontend armazena o `refreshToken`, mas nenhum código utiliza o refresh token para renovar access tokens expirados. Quando o access token expira (15min), o usuário é silenciosamente deslogado.

**Impacto:** Experiência de usuário degradada — sessões expiram a cada 15 minutos forçando re-login manual.

**Sugestão:** Implementar interceptor em `api.ts` que, ao receber 401, tente renovar o token:
```typescript
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // ... código existente ...
  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return request(endpoint, options); // retry
  }
  // ...
}
```

---

#### 🟡 F-10: Falha silenciosa ao validar sessão no mount

**Arquivo:** `lib/auth-context.tsx:39-42`

Quando `auth.me()` falha (ex.: token inválido, servidor offline), os tokens são removidos sem nenhum feedback ao usuário.

```typescript
// lib/auth-context.tsx:39-42
.catch(() => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // ← Sem feedback: o usuário não sabe por que foi deslogado
})
```

**Impacto:** Usuário perde sessão sem entender o motivo. Em caso de falha de rede temporária, tokens válidos são descartados desnecessariamente.

**Sugestão:** Distinguir erros de rede (manter tokens) de erros de autenticação (limpar tokens):
```typescript
.catch((err) => {
  if (err.message.includes('401') || err.message.includes('403')) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  // Erros de rede: manter tokens, tentar novamente depois
})
```

---

### 2. Camada API

#### 🟠 F-03: `api.ts` não aceita `AbortSignal` — desconexão com `useFetch`

**Arquivos:** `lib/api.ts:5-7` vs `hooks/use-fetch.ts:28`

O hook `useFetch` corretamente cria um `AbortController` e passa o `signal` para a função de fetch. Porém, a função `request()` em `api.ts` não aceita nem propaga o `AbortSignal`:

```typescript
// hooks/use-fetch.ts:28 — passa signal ✅
fetchFnRef.current(controller.signal)

// lib/api.ts:5-7 — ignora signal ❌
async function request<T>(
  endpoint: string,
  options: RequestInit = {},  // signal não é mencionado
): Promise<T> {
```

**Impacto:** Requisições canceladas pelo React (unmount) continuam rodando em background. Possíveis memory leaks e state updates em componentes desmontados.

**Sugestão:** Adicionar parâmetro `signal` ao `request()`:
```typescript
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, signal });
  // ...
}
```

E atualizar os métodos da API para aceitar e propagar o signal.

---

#### 🟡 F-14: Sem timeout em requisições HTTP

**Arquivo:** `lib/api.ts:21-24`

```typescript
// lib/api.ts:21-24
const res = await fetch(`${API_BASE}${endpoint}`, {
  ...options,
  headers,
});
// ← Sem AbortSignal com timeout
```

**Impacto:** Se o servidor não responder, a requisição fica pendente indefinidamente, travando a UI em estado de loading.

**Sugestão:** Usar `AbortSignal.timeout()` ou um wrapper com `setTimeout`:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
const res = await fetch(url, { ...options, signal: controller.signal });
clearTimeout(timeout);
```

---

### 3. Tratamento de Erros

#### 🟠 F-04: `.catch(() => {})` — erros de rede silenciados em 4 páginas

**Arquivos:**
- `app/properties/page.tsx:57` — Lista de propriedades
- `app/bookings/page.tsx:33` — Lista de reservas
- `app/bookings/[id]/page.tsx:56` — Detalhe da reserva
- `app/properties/[id]/page.tsx:36` — Detalhe da propriedade

```typescript
// Padrão repetido em todas as 4 páginas:
api.properties
  .get(id)
  .then((res) => setProperty(res))
  .catch(() => {})  // ← Erro completamente ignorado
  .finally(() => setLoading(false));
```

**Impacto:** Quando a API falha (rede offline, servidor 500), o usuário vê apenas o estado de "não encontrado" ou uma lista vazia sem nenhuma mensagem de erro. Impossível distinguir "recurso não existe" de "erro de rede".

**Sugestão:** Adicionar estado de erro e exibir mensagem:
```typescript
const [error, setError] = useState<string | null>(null);

api.properties.get(id)
  .then((res) => setProperty(res))
  .catch((err) => setError(err.message))
  .finally(() => setLoading(false));
```

Ou, preferencialmente, usar o hook `useFetch` que já gerencia erro automaticamente.

---

#### 🟠 F-07: `HomePage` usa `useEffect` raw em vez de `useFetch`

**Arquivo:** `app/page.tsx:24-32`

A `HomePage` é a única página que usa `useEffect` diretamente para fetch de dados, enquanto outras páginas utilizam o hook `useFetch` que oferece AbortController, estado de erro e refetch automático.

```typescript
// app/page.tsx:24-32
useEffect(() => {
  api.properties
    .list({ sortBy: 'rating', limit: '8' })
    .then((res) => {
      setFeatured(res.data);
    })
    .catch(console.error)  // ← Loga mas não expõe erro na UI
    .finally(() => setLoading(false));
}, []);
```

**Impacto:** Inconsistência de padrões entre páginas. A HomePage não tem AbortController (risk de memory leak), não expõe erro na UI e não suporta refetch.

**Sugestão:** Migrar para `useFetch`:
```typescript
const { data, loading, error } = useFetch(
  (signal) => api.properties.list({ sortBy: 'rating', limit: '8' }),
  [],
);
```

---

### 4. Violações DRY

#### 🟠 F-05: `formatCurrency()` criada mas nunca utilizada — 13+ instâncias inline

**Arquivo definido:** `lib/format.ts:1-3`
**Instâncias inline:**
- `components/booking/booking-widget.tsx:74, 146, 148, 152, 156, 161` (6×)
- `app/bookings/page.tsx:96` (1×)
- `app/bookings/[id]/page.tsx:185, 188, 193, 197, 202` (5×)
- `components/properties/property-card.tsx:55` (1×)

```typescript
// lib/format.ts:1-3 — definida mas NUNCA importada
export function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

// Padrão repetido 13+ vezes:
R$ {booking.totalPrice.toLocaleString('pt-BR')}  // bookings/[id]/page.tsx:202
R$ {property.pricePerNight}                       // booking-widget.tsx:74 (sem locale!)
R$ {price.subtotal}                               // booking-widget.tsx:148 (sem locale!)
```

**Impacto:** Inconsistência de formatação (alguns usam `toLocaleString('pt-BR')`, outros não). Código duplicado que aumenta risco de divergência. A função utilitária foi criada na refatoração mas nunca adotada.

**Sugestão:** Substituir todas as instâncias por `formatCurrency()`:
```typescript
import { formatCurrency } from '@/lib/format';
// ...
{formatCurrency(booking.totalPrice)}
```

---

#### 🟠 F-06: Funções de formatação de data criadas mas nunca utilizadas — 7+ instâncias inline

**Arquivo definido:** `lib/format.ts:5-30`
**Instâncias inline:**
- `app/bookings/page.tsx:89-90` (2×)
- `app/bookings/[id]/page.tsx:150, 162, 244` (3×)
- `components/properties/property-reviews.tsx:29` (1×)

```typescript
// lib/format.ts — 4 funções definidas, NENHUMA importada
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions)
export function formatDateShort(dateStr: string)
export function formatDateLong(dateStr: string)
export function formatDateTime(dateStr: string)

// Repetido inline em múltiplos arquivos:
{new Date(booking.checkIn).toLocaleDateString('pt-BR')}              // bookings/page.tsx:89
{new Date(booking.checkIn).toLocaleDateString('pt-BR', {             // bookings/[id]/page.tsx:150
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
})}
{new Date(booking.createdAt).toLocaleDateString('pt-BR', {           // bookings/[id]/page.tsx:244
  day: 'numeric', month: 'long', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})}
```

**Impacto:** Mesmo problema de F-05 — as funções foram criadas na refatoração mas nunca adotadas. Opções de formatação duplicadas e levemente diferentes entre arquivos.

**Sugestão:** Mapear cada padrão inline para a função correspondente:
- `toLocaleDateString('pt-BR')` → `formatDateShort()`
- `toLocaleDateString('pt-BR', { weekday: 'short', ... })` → `formatDateLong()`
- `toLocaleDateString('pt-BR', { ..., hour, minute })` → `formatDateTime()`

---

#### 🟡 F-11: Breakdown de preço duplicado entre `BookingWidget` e `BookingDetailPage`

**Arquivos:** `components/booking/booking-widget.tsx:142-163` vs `app/bookings/[id]/page.tsx:180-204`

Ambos os componentes renderizam a mesma estrutura de breakdown de preço (subtotal, taxa de limpeza, taxa de serviço, total) com markup quase idêntico.

```typescript
// booking-widget.tsx:142-163 e bookings/[id]/page.tsx:180-204
// Estrutura idêntica:
<div className="flex justify-between">
  <span className="text-gray-500">R$ {price} x {nights} noites</span>
  <span>R$ {subtotal}</span>
</div>
<div className="flex justify-between">
  <span className="text-gray-500">Taxa de limpeza</span>
  <span>R$ {cleaningFee}</span>
</div>
// ... (taxa de serviço, separador, total)
```

**Impacto:** Mudanças no layout de preço precisam ser replicadas em 2 locais. Risco de divergência visual.

**Sugestão:** Extrair um componente `<PriceBreakdown>`:
```typescript
interface PriceBreakdownProps {
  pricePerNight: number;
  nights: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
}
export function PriceBreakdown(props: PriceBreakdownProps) { ... }
```

---

### 5. Testes

#### 🟠 F-08: Hooks `useFetch` e `useDebounce` sem nenhum teste

**Diretório esperado:** `hooks/__tests__/` (ausente)

Os dois custom hooks são a base do data fetching do frontend. `useFetch` tem lógica complexa (AbortController, ref, trigger, error handling) e `useDebounce` é usado em filtros de busca. Nenhum possui teste.

**Impacto:** Regressões no hook de fetch podem quebrar todas as páginas simultaneamente. Comportamento de cleanup, abort e error handling não são validados.

**Sugestão:** Criar testes com `@testing-library/react-hooks` ou `renderHook`:
```typescript
test('should abort on unmount', () => { ... });
test('should set error on fetch failure', () => { ... });
test('should refetch when deps change', () => { ... });
```

---

#### 🟠 F-09: `BookingWidget` sem testes

**Diretório esperado:** `components/booking/__tests__/` (ausente)

O `BookingWidget` (170 linhas) é o componente mais crítico de negócio — é onde o usuário efetua reservas. Contém cálculo de preço, validação de datas, integração com API e fluxo de autenticação. Não possui nenhum teste.

**Impacto:** Regressões no fluxo de reserva passam despercebidas. É o componente com maior impacto em receita.

**Sugestão:** Testar: renderização, cálculo de preço, validação de datas, estados de loading/error/success, redirecionamento para login.

---

#### 🟡 F-15: `PropertiesPage` com apenas 1 test case

**Arquivo:** `app/properties/__tests__/page.test.tsx`

A página de listagem de propriedades tem filtros, ordenação, debounce e paginação, mas apenas 1 test case.

**Impacto:** Cobertura insuficiente para a funcionalidade mais complexa do frontend.

**Sugestão:** Adicionar testes para: filtros individuais, combinação de filtros, debounce de busca, estado vazio, estado de erro.

---

### 6. Acessibilidade

#### 🟡 F-12: Alt text vazio em thumbnails de fotos

**Arquivo:** `components/properties/property-photo-gallery.tsx:37`

```typescript
// property-photo-gallery.tsx:37
alt={photo.caption || ''}  // ← Alt vazio quando caption é undefined
```

Enquanto a foto principal usa `alt={photos[selectedPhoto]?.caption || title}` (com fallback para título), os thumbnails ficam com alt vazio.

**Impacto:** Leitores de tela ignoram imagens sem alt, prejudicando navegação por teclado na galeria.

**Sugestão:**
```typescript
alt={photo.caption || `${title} - foto ${i + 1}`}
```

---

#### 🟢 F-16: Sem link "pular para conteúdo" (skip-to-content)

**Arquivo:** `app/layout.tsx` (funcionalidade ausente)

Não há link de atalho para pular a navegação e ir direto ao conteúdo principal. É uma prática recomendada de acessibilidade (WCAG 2.4.1).

**Impacto:** Usuários de teclado e leitores de tela precisam navegar pelo header inteiro antes de chegar ao conteúdo em cada página.

**Sugestão:** Adicionar link visualmente oculto no início do body:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute ...">
  Pular para o conteúdo
</a>
<main id="main-content">...</main>
```

---

### 7. Next.js e Performance

#### 🟡 F-13: Todas as páginas são Client Components — nenhum Server Component aproveitado

**Arquivos:** 14 arquivos com `'use client'` na primeira linha

Todas as páginas e componentes interativos estão marcados como Client Components. Páginas como detalhes de propriedade e listagem poderiam ter SSR parcial para SEO e performance.

**Impacto:** Nenhum conteúdo é renderizado no servidor. Páginas de propriedade não são indexáveis por motores de busca. Maior bundle JavaScript enviado ao cliente.

**Sugestão:** Para páginas de detalhe de propriedade (conteúdo público), considerar SSR com fetch no servidor e hidratação seletiva apenas para componentes interativos (BookingWidget, PhotoGallery).

---

#### 🟢 F-17: Sem metadata dinâmico em páginas de detalhe

**Arquivos:** `app/properties/[id]/page.tsx`, `app/bookings/[id]/page.tsx`

Nenhuma página de detalhe exporta `generateMetadata()` para título/descrição dinâmicos.

**Impacto:** Todas as páginas de detalhe compartilham o mesmo título genérico do layout raiz. Ruim para SEO e compartilhamento em redes sociais.

**Sugestão:**
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const property = await api.properties.get(params.id);
  return { title: property.title, description: property.description };
}
```

---

#### 🟢 F-18: Sem estratégia de cache para chamadas API

**Arquivo:** `lib/api.ts` / componentes consumidores

Toda navegação entre páginas causa um novo fetch da API. Não há cache, deduplicação ou stale-while-revalidate. Dados estáticos (lista de propriedades, detalhes) são buscados repetidamente.

**Impacto:** Navegação lenta, requisições desnecessárias ao servidor, sensação de "flicker" nos loading states.

**Sugestão:** Considerar adoção de `React Query` (`@tanstack/react-query`) ou `SWR` para cache automático, deduplicação e revalidação.

---

## Tabela Consolidada de Problemas

| ID | Sev. | Camada | Categoria | Descrição resumida |
|----|------|--------|-----------|-------------------|
| B-01 | 🔴 | Backend | Segurança | JWT secret hardcoded como fallback |
| B-02 | 🟠 | Backend | Segurança | Senha sem complexidade mínima |
| B-03 | 🟠 | Backend | Segurança | `/auth/refresh` sem rate limiting |
| B-04 | 🟡 | Backend | Validação | `dateOfBirth` sem `@IsDateString()` |
| B-05 | 🟡 | Backend | Validação | `phone` sem regex de formato |
| B-06 | 🟡 | Backend | Validação | `role` sem `@IsIn()` (escalação de privilégios) |
| B-07 | 🟡 | Backend | Arquitetura | Nenhum interceptor (logging, métricas) |
| B-08 | 🟡 | Backend | Testes | `PropertyFilterBuilder` sem testes |
| B-09 | 🟡 | Backend | Testes | Zero testes E2E |
| B-10 | 🟢 | Backend | Segurança | BCRYPT_ROUNDS=4 insuficiente para produção |
| F-01 | 🔴 | Frontend | Auth | `logout()` não revoga refresh token |
| F-02 | 🔴 | Frontend | Auth | Sem lógica de token refresh |
| F-03 | 🟠 | Frontend | API | `api.ts` ignora AbortSignal do `useFetch` |
| F-04 | 🟠 | Frontend | Erros | `.catch(() => {})` em 4 páginas |
| F-05 | 🟠 | Frontend | DRY | `formatCurrency()` nunca usada (13+ inline) |
| F-06 | 🟠 | Frontend | DRY | `formatDate*()` nunca usadas (7+ inline) |
| F-07 | 🟠 | Frontend | Consistência | HomePage usa useEffect raw vs useFetch |
| F-08 | 🟠 | Frontend | Testes | Hooks sem testes |
| F-09 | 🟠 | Frontend | Testes | BookingWidget sem testes |
| F-10 | 🟡 | Frontend | Auth | Falha silenciosa em auth.me() |
| F-11 | 🟡 | Frontend | DRY | Price breakdown duplicado |
| F-12 | 🟡 | Frontend | A11y | Alt text vazio em thumbnails |
| F-13 | 🟡 | Frontend | Next.js | Nenhum Server Component |
| F-14 | 🟡 | Frontend | API | Sem timeout em requisições |
| F-15 | 🟡 | Frontend | Testes | PropertiesPage com 1 test case |
| F-16 | 🟢 | Frontend | A11y | Sem skip-to-content |
| F-17 | 🟢 | Frontend | Next.js | Sem metadata dinâmico |
| F-18 | 🟢 | Frontend | Performance | Sem cache de API |

---

## Roadmap de Correção

### Fase 1 — Segurança (Críticos e Altos)
**Itens:** B-01, B-02, B-03, F-01, F-02

| Ação | Itens | Esforço |
|------|-------|---------|
| Remover fallback do JWT secret (usar `getOrThrow`) | B-01 | Baixo |
| Adicionar validação de complexidade de senha | B-02 | Baixo |
| Adicionar throttle no endpoint `/auth/refresh` | B-03 | Baixo |
| Implementar chamada a `/auth/logout` no frontend | F-01 | Baixo |
| Implementar interceptor de refresh token em `api.ts` | F-02 | Médio |

### Fase 2 — Qualidade e Consistência
**Itens:** F-03, F-04, F-05, F-06, F-07

| Ação | Itens | Esforço |
|------|-------|---------|
| Adicionar AbortSignal ao `api.ts` | F-03 | Baixo |
| Substituir `.catch(() => {})` por error handling com useFetch | F-04, F-07 | Médio |
| Adotar `formatCurrency()` em todos os componentes | F-05 | Baixo |
| Adotar `formatDate*()` em todos os componentes | F-06 | Baixo |

### Fase 3 — Validação Backend
**Itens:** B-04, B-05, B-06

| Ação | Itens | Esforço |
|------|-------|---------|
| Adicionar `@IsDateString()`, `@Matches()`, `@IsIn()` nos DTOs | B-04, B-05, B-06 | Baixo |

### Fase 4 — Testes
**Itens:** F-08, F-09, F-15, B-08, B-09

| Ação | Itens | Esforço |
|------|-------|---------|
| Criar testes para `useFetch` e `useDebounce` | F-08 | Médio |
| Criar testes para `BookingWidget` | F-09 | Médio |
| Expandir testes de `PropertiesPage` | F-15 | Baixo |
| Criar testes para `PropertyFilterBuilder` | B-08 | Médio |
| Implementar suite de testes E2E | B-09 | Alto |

### Fase 5 — Arquitetura e Polimento
**Itens:** B-07, B-10, F-10, F-11, F-12, F-13, F-14, F-16, F-17, F-18

| Ação | Itens | Esforço |
|------|-------|---------|
| Implementar `LoggingInterceptor` | B-07 | Baixo |
| Configurar BCRYPT_ROUNDS para produção | B-10 | Baixo |
| Melhorar tratamento de erro em auth.me() | F-10 | Baixo |
| Extrair componente `PriceBreakdown` | F-11 | Baixo |
| Corrigir alt text em thumbnails | F-12 | Baixo |
| Adicionar skip-to-content | F-16 | Baixo |
| Adicionar timeout em requisições | F-14 | Baixo |
| Avaliar SSR para páginas públicas | F-13 | Alto |
| Adicionar metadata dinâmico | F-17 | Médio |
| Avaliar adoção de React Query/SWR | F-18 | Alto |
