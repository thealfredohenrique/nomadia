# Stack Tecnológica - Sistema de Aluguel de Acomodações

## Recomendações Tecnológicas por Camada

---

## 1. FRONTEND WEB

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **Next.js 14+ (React)** | Framework React com SSR/SSG, excelente para SEO e performance. Renderização híbrida ideal para marketplace | ✅ SEO nativo (SSR/SSG)<br>✅ File-based routing<br>✅ API routes integradas<br>✅ Image optimization<br>✅ Grande ecossistema<br>✅ Vercel deployment | ❌ Curva de aprendizado média<br>❌ Bundle pode ficar grande<br>❌ Lock-in parcial com Vercel | **Recomendado** para SEO crítico, pages públicas, performance. Ideal quando precisa de renderização server-side para listagens de propriedades |
| **Nuxt 3 (Vue.js)** | Framework Vue com SSR, sintaxe mais simples que React, ótima DX (Developer Experience) | ✅ Sintaxe intuitiva<br>✅ SSR/SSG nativo<br>✅ Auto-imports<br>✅ TypeScript first<br>✅ Composition API | ❌ Ecossistema menor que React<br>❌ Menos jobs no mercado<br>❌ Menos bibliotecas de UI | Use se equipe prefere Vue, ou para projetos que valorizam simplicidade de código sobre tamanho do ecossistema |
| **SvelteKit** | Framework moderno, compila código para JS vanilla, zero runtime overhead | ✅ Performance excepcional<br>✅ Bundle size mínimo<br>✅ Sintaxe limpa<br>✅ Menos boilerplate | ❌ Ecossistema menor<br>❌ Menos desenvolvedores<br>❌ Menos componentes prontos | Considere para equipes pequenas que priorizam performance extrema e código limpo |

**Recomendação Principal:** **Next.js 14+**  
**Razão:** Melhor equilíbrio entre SEO (crítico para marketplace), performance, ecossistema maduro e disponibilidade de desenvolvedores.

---

## 2. FRONTEND MOBILE

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **React Native + Expo** | Cross-platform com 90% de código compartilhado, Hot Reload, OTA updates via Expo | ✅ Código compartilhado iOS/Android<br>✅ Reusa conhecimento React<br>✅ Expo simplifica build/deploy<br>✅ OTA updates<br>✅ Performance boa para maioria dos casos | ❌ Performance inferior a nativo<br>❌ Algumas APIs nativas precisam de bridges<br>❌ Debugging complexo | **Recomendado** quando time já sabe React, budget limitado, ou precisa lançar rápido em ambas plataformas |
| **Flutter** | Cross-platform do Google, compila para código nativo, UI consistente | ✅ Performance próxima ao nativo<br>✅ UI consistente entre plataformas<br>✅ Hot Reload excelente<br>✅ Widgets ricos<br>✅ Dart é type-safe | ❌ Dart não é JavaScript (curva de aprendizado)<br>❌ Comunidade menor que React Native<br>❌ Apps podem ser maiores | Use quando performance é crítica, equipe disposta a aprender Dart, ou quer UI pixel-perfect |
| **iOS nativo (Swift) + Android nativo (Kotlin)** | Máxima performance e acesso total a APIs da plataforma | ✅ Performance máxima<br>✅ Acesso completo a APIs<br>✅ UX nativa por padrão<br>✅ Melhor para features complexas | ❌ 2x desenvolvimento<br>❌ 2x manutenção<br>❌ Custo alto<br>❌ Times separados | Apenas se orçamento permite, app extremamente complexo, ou performance crítica (ex: video streaming, AR) |

**Recomendação Principal:** **React Native + Expo**  
**Razão:** Melhor custo-benefício, compartilha conhecimento com web (React), time-to-market rápido, ecossistema maduro.

---

## 3. BACKEND - FRAMEWORK E LINGUAGEM

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **Node.js + Express/NestJS** | JavaScript/TypeScript full-stack, assíncrono por padrão, ecossistema NPM gigante | ✅ Mesmo idioma do frontend<br>✅ Async/await nativo<br>✅ NPM ecosystem<br>✅ V8 engine rápido<br>✅ Microservices-friendly<br>✅ NestJS traz estrutura enterprise | ❌ Single-threaded (CPU-bound tasks)<br>❌ Callback hell (se mal escrito)<br>❌ TypeScript necessário para projetos grandes | **Recomendado** para I/O-bound operations (APIs REST, WebSockets), equipes full-stack JavaScript, startups ágeis |
| **Python + FastAPI/Django** | Excelente para prototipagem rápida, ML integrado, sintaxe clara | ✅ Sintaxe legível<br>✅ FastAPI moderno e rápido<br>✅ Django batteries-included<br>✅ Ideal para ML/AI (fraude, preços)<br>✅ Type hints (FastAPI) | ❌ Performance inferior a Go/Rust<br>❌ GIL limita paralelismo<br>❌ Deploy mais complexo | Use quando precisa ML/AI integrado, equipe Python, ou Django admin é vantagem |
| **Go** | Alta performance, compilado, ótimo para microservices e concorrência | ✅ Performance excelente<br>✅ Goroutines (concorrência fácil)<br>✅ Binary único (deploy simples)<br>✅ Baixo consumo memória<br>✅ Type-safe | ❌ Verboso (boilerplate)<br>❌ Menos libraries que Node/Python<br>❌ Curva de aprendizado média | Considere para serviços de alta throughput, gateways, workers pesados, ou quando performance é prioridade #1 |
| **Java + Spring Boot** | Enterprise-grade, ecossistema maduro, type-safe, JVM battle-tested | ✅ Ecossistema enterprise<br>✅ JVM otimizada<br>✅ Spring ecosystem completo<br>✅ Type safety forte<br>✅ Comunidade enorme | ❌ Verboso<br>❌ Startup lento (melhorou no Spring Boot 3)<br>❌ Consome mais memória<br>❌ Menos ágil para protótipos | Para empresas grandes, compliance rígido, equipes Java estabelecidas, ou integração com sistemas legados |

**Recomendação Principal:** **Node.js + NestJS (TypeScript)**  
**Razão:** Full-stack JavaScript, async nativo (ideal para I/O intensivo), NestJS traz estrutura enterprise, ótimo para microservices.

**Alternativa:** **Python + FastAPI** se ML/AI é importante (detecção de fraude, precificação dinâmica).

---

## 4. BANCO DE DADOS RELACIONAL

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **PostgreSQL 15+** | Banco ACID completo, suporte a JSON, geolocation nativa, extensível | ✅ ACID completo<br>✅ PostGIS (geo queries)<br>✅ JSONB (flexibilidade)<br>✅ Full-text search<br>✅ Particionamento avançado<br>✅ Open-source | ❌ Configuração inicial complexa<br>❌ Writes mais lentas que MySQL | **Recomendado** para dados transacionais críticos (reservas, pagamentos), queries geográficas, quando integridade é vital |
| **MySQL 8+** | Popular, rápido para reads, replicação simples, hosting abundante | ✅ Extremamente popular<br>✅ Reads muito rápidas<br>✅ Replicação fácil<br>✅ Hospedagem barata<br>✅ MariaDB como alternativa | ❌ Menos features avançadas<br>❌ JSON support inferior<br>❌ Geolocation básica | Use se equipe já conhece, orçamento limitado, ou reads dominam (90%+ do workload) |
| **CockroachDB** | Distributed SQL, Postgres-compatible, geo-distributed, auto-scaling | ✅ Geo-replicação nativa<br>✅ Auto-scaling horizontal<br>✅ Postgres wire protocol<br>✅ Multi-region nativo<br>✅ Resiliente | ❌ Complexo para setup<br>❌ Custo alto<br>❌ Overkill para apps pequenos | Apenas para apps globais, multi-region desde o início, orçamento permite custos premium |

**Recomendação Principal:** **PostgreSQL 15+**  
**Razão:** Melhor equilíbrio entre features (JSONB, PostGIS), integridade ACID, performance e open-source. Perfeito para marketplace.

---

## 5. BANCO NoSQL / CACHE

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **Redis** | In-memory cache, pub/sub, sessions, rate limiting, ultra-rápido | ✅ Sub-millisecond latency<br>✅ Pub/Sub nativo<br>✅ Sessions distribuídas<br>✅ Sorted sets (leaderboards)<br>✅ Lua scripting<br>✅ Cluster mode | ❌ In-memory (limitado por RAM)<br>❌ Persistência opcional (não é database) | **Essencial** para cache, sessions JWT, rate limiting, pub/sub (chat), filas leves |
| **MongoDB** | Document store, schema flexível, queries ricas, sharding nativo | ✅ Schema flexível<br>✅ JSON-like documents<br>✅ Queries poderosas<br>✅ Aggregation pipeline<br>✅ Sharding built-in | ❌ Menos ACID que SQL<br>❌ Joins complexos<br>❌ Schema inconsistency risk | Use para logs, mensagens (chat history), analytics events, ou dados semi-estruturados |
| **Elasticsearch** | Search engine, full-text search, analytics, geo queries | ✅ Full-text search excelente<br>✅ Faceted search<br>✅ Geo queries rápidas<br>✅ Real-time indexing<br>✅ Analytics | ❌ Complexo para manter<br>❌ Consome muita memória<br>❌ Não é source of truth | **Recomendado** para busca de propriedades (principal feature), autocomplete, facets, logs centralizados |

**Recomendação Principal:** **Redis + Elasticsearch**  
- **Redis:** Cache, sessions, rate limiting  
- **Elasticsearch:** Search engine para propriedades (filtros, geo, full-text)

**Opcional:** MongoDB se precisar armazenar mensagens/logs de forma persistente e flexível.

---

## 6. MESSAGE QUEUE / BROKER

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **RabbitMQ** | Message broker maduro, AMQP protocol, routing flexível, filas persistentes | ✅ Routing avançado (exchanges)<br>✅ Persistência confiável<br>✅ Management UI<br>✅ Plugins (shovel, federation)<br>✅ Multi-protocol | ❌ Throughput menor que Kafka<br>❌ Menos escalável para milhões msg/s<br>❌ Clustering complexo | **Recomendado** para tasks assíncronas (emails, notificações), eventos de negócio, quando garantia de entrega é crítica |
| **Apache Kafka** | Event streaming, alta throughput, log distribuído, ideal para event sourcing | ✅ Milhões msg/s<br>✅ Event sourcing nativo<br>✅ Replay de eventos<br>✅ Retenção longa<br>✅ Eco-sistema (Connect, Streams) | ❌ Complexo para configurar<br>❌ Overkill para apps pequenos<br>❌ Overhead operacional alto<br>❌ Latência maior que RabbitMQ | Use para event-driven architecture complexa, analytics em tempo real, ou volumes altíssimos (100k+ eventos/s) |
| **AWS SQS/SNS** | Managed queues, zero-ops, integração AWS nativa, pay-per-use | ✅ Zero manutenção<br>✅ Auto-scaling<br>✅ Integração AWS<br>✅ Custos previsíveis<br>✅ FIFO ou Standard | ❌ Vendor lock-in AWS<br>❌ Latência maior (cloud)<br>❌ Menos features que RabbitMQ<br>❌ Custos crescem com uso | **Ótima escolha** se já usa AWS, quer zero-ops, ou startup sem DevOps dedicado |

**Recomendação Principal:** **RabbitMQ** (self-hosted) ou **AWS SQS/SNS** (cloud)  
**Razão:**  
- RabbitMQ: Melhor para on-premise, controle total, features avançadas  
- SQS/SNS: Melhor para cloud-first, zero-ops, integração AWS

---

## 7. ARMAZENAMENTO DE ARQUIVOS

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **AWS S3** | Object storage líder, 99.999999999% durability, integração CDN, lifecycle policies | ✅ Durabilidade extrema<br>✅ CDN integrado (CloudFront)<br>✅ Versioning<br>✅ Lifecycle policies<br>✅ Ubíquo (SDKs para tudo)<br>✅ Preços competitivos | ❌ Vendor lock-in AWS<br>❌ Custos podem crescer<br>❌ Egress data caro | **Recomendado** para produção, apps que já usam AWS, ou precisam CDN integrado |
| **Cloudflare R2** | S3-compatible, zero egress fees, global network | ✅ S3-compatible API<br>✅ Zero egress cost 🔥<br>✅ CDN integrado<br>✅ Preços mais baixos | ❌ Menos maduro que S3<br>❌ Menos features avançadas<br>❌ Ecosystem menor | **Excelente** para reduzir custos, especialmente se muito tráfego de downloads (fotos de propriedades) |
| **MinIO** | S3-compatible, self-hosted, open-source, Kubernetes-native | ✅ S3-compatible<br>✅ Self-hosted (controle total)<br>✅ Open-source<br>✅ Kubernetes nativo<br>✅ Zero custos cloud | ❌ Você gerencia infraestrutura<br>❌ Precisa garantir durabilidade<br>❌ Custos de infra/DevOps | Use se quer evitar cloud providers, on-premise, ou controle total sobre dados |

**Recomendação Principal:** **AWS S3** (produção) ou **Cloudflare R2** (otimização de custos)  
**Razão:** S3 é padrão da indústria, mas R2 economiza muito em egress (fotos baixadas frequentemente).

---

## 8. API GATEWAY

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **Kong Gateway** | Open-source, extensível via plugins, rate limiting, auth, analytics | ✅ Open-source (CE) e Enterprise<br>✅ Plugins ricos<br>✅ Rate limiting avançado<br>✅ Service mesh integration<br>✅ Kubernetes native | ❌ Curva de aprendizado<br>❌ Setup inicial complexo<br>❌ Precisa PostgreSQL/Cassandra | **Recomendado** para microservices, quando precisa extensibilidade, ou já usa Kubernetes |
| **AWS API Gateway** | Managed AWS, auto-scaling, integração Lambda, pay-per-request | ✅ Zero manutenção<br>✅ Auto-scaling<br>✅ Integração AWS nativa<br>✅ WebSocket support<br>✅ Custos baixos (início) | ❌ Vendor lock-in<br>❌ Custos crescem<br>❌ Menos flexível que Kong<br>❌ Cold start (Lambda) | **Ótimo** para serverless, integração AWS, ou startup sem DevOps |
| **Nginx + Rate Limiting** | Simples, leve, battle-tested, usa menos recursos | ✅ Extremamente leve<br>✅ Battle-tested<br>✅ Configuração via arquivo<br>✅ Grátis e open-source | ❌ Menos features built-in<br>❌ Configuração manual<br>❌ Sem UI de gerenciamento | Use para apps simples, monolitos, ou quando Kong é overkill |

**Recomendação Principal:** **Kong Gateway** (microservices) ou **AWS API Gateway** (serverless/AWS)  
**Razão:** Kong para controle total e microservices; AWS para zero-ops e cloud-native.

---

## 9. AUTENTICAÇÃO E AUTORIZAÇÃO

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **JWT (Access + Refresh Tokens)** | Stateless, self-contained, ideal para microservices, horizontal scaling | ✅ Stateless (escala fácil)<br>✅ Microservices-friendly<br>✅ Payload customizável<br>✅ Standard (RFC 7519) | ❌ Token revocation complexo<br>❌ Payload size (cada request)<br>❌ Segurança depende de secret | **Recomendado** para APIs REST stateless, microservices, mobile apps |
| **Auth0** | Auth-as-a-Service, OAuth/OIDC, social login, MFA built-in | ✅ Zero implementação auth<br>✅ Social login fácil<br>✅ MFA nativo<br>✅ Compliance (SOC2, GDPR)<br>✅ UI de gerenciamento | ❌ Vendor lock-in<br>❌ Custos mensais (MAU)<br>❌ Customização limitada | **Ótimo** para time pequeno, não quer lidar com auth, ou precisa compliance rápido |
| **Keycloak** | Open-source IAM, OAuth/OIDC, SSO, self-hosted | ✅ Open-source<br>✅ Feature-rich (SSO, LDAP)<br>✅ Self-hosted (controle)<br>✅ Multi-tenancy | ❌ Setup complexo<br>❌ UI desatualizada<br>❌ Precisa manter infra | Use se quer open-source, controle total, SSO enterprise, ou evitar SaaS |

**Recomendação Principal:** **JWT (Access + Refresh)** implementado manualmente ou **Auth0** (SaaS)  
**Razão:**  
- JWT: Controle total, zero custos recorrentes, ideal para microservices  
- Auth0: Zero manutenção, compliance pronto, ideal para time focado em produto

---

## 10. GATEWAY DE PAGAMENTO

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **Stripe** | API moderna, documentação excelente, suporte global, compliance PCI-DSS | ✅ API/SDKs excelentes<br>✅ Documentação top-tier<br>✅ Checkout UI pronto<br>✅ Webhooks confiáveis<br>✅ Global (135+ países)<br>✅ 3D Secure nativo | ❌ Taxas ~3% (competitivo)<br>❌ KYC rigoroso<br>❌ Suporte BR via Stripe Connect | **Recomendado** para marketplace global, UX importante, ou API moderna essencial |
| **PayPal / Braintree** | Ubíquo globalmente, confiança do usuário, one-click checkout | ✅ Brand trust alto<br>✅ One-click (PayPal)<br>✅ Braintree para API<br>✅ Global | ❌ UX menos moderna<br>❌ API inferior ao Stripe<br>❌ Menos flexível | Use se usuários pedem PayPal, ou quer opção adicional junto com cartão |
| **Mercado Pago (Brasil)** | Líder Brasil/LATAM, PIX nativo, boleto, parcelamento sem juros | ✅ Domínio Brasil/LATAM<br>✅ PIX integrado<br>✅ Parcelamento sem juros<br>✅ Boleto bancário<br>✅ QR Code (Mercado Pago) | ❌ Apenas LATAM<br>❌ API menos polida<br>❌ Suporte inferior | **Essencial** se foco é Brasil/LATAM, PIX é crítico, ou parcelamento sem juros |

**Recomendação Principal:** **Stripe** (global) + **Mercado Pago** (Brasil/LATAM)  
**Razão:** Stripe para API moderna e global; Mercado Pago para PIX e parcelamento no Brasil.

---

## 11. CONTAINERIZAÇÃO

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **Docker** | Standard de facto, ecosystem maduro, Dockerfiles simples, multi-stage builds | ✅ Standard da indústria<br>✅ Ecosystem gigante<br>✅ CI/CD integrations<br>✅ Multi-stage builds<br>✅ Docker Compose (local dev) | ❌ Overhead vs bare metal<br>❌ Segurança (root by default)<br>❌ Imagens podem ser grandes | **Recomendado** sempre. É o padrão. |
| **Podman** | Daemonless, rootless, drop-in replacement Docker, mais seguro | ✅ Rootless (segurança)<br>✅ Daemonless<br>✅ Compatible com Docker CLI<br>✅ Podman Pods (Kubernetes-like) | ❌ Menos maduro<br>❌ Ecosystem menor<br>❌ Algumas incompatibilidades | Considere para ambientes enterprise com foco em segurança, ou evitar daemon |

**Recomendação Principal:** **Docker**  
**Razão:** Padrão da indústria, ecosystem incomparável, CI/CD universal.

---

## 12. ORQUESTRAÇÃO DE CONTAINERS

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **Kubernetes (K8s)** | Orquestrador líder, auto-scaling, self-healing, declarativo, cloud-agnostic | ✅ Standard da indústria<br>✅ Auto-scaling (HPA/VPA)<br>✅ Self-healing<br>✅ Cloud-agnostic<br>✅ Ecosystem rico (Helm, Operators)<br>✅ Service mesh (Istio) | ❌ Complexidade alta<br>❌ Curva de aprendizado íngreme<br>❌ Overkill para apps pequenos<br>❌ Custos operacionais | **Recomendado** para produção escalável, múltiplos serviços (5+), ou cloud-agnostic importante |
| **AWS ECS/Fargate** | Managed containers AWS, serverless (Fargate), integração AWS nativa | ✅ Mais simples que K8s<br>✅ Fargate = serverless<br>✅ Integração AWS perfeita<br>✅ Custos previsíveis | ❌ Vendor lock-in AWS<br>❌ Menos features que K8s<br>❌ Não é standard | **Ótimo** se já usa AWS, quer simplicidade, ou Kubernetes é overkill |
| **Docker Swarm** | Orquestração leve, built-in Docker, setup simples | ✅ Simples (vs K8s)<br>✅ Built-in Docker<br>✅ Bom para começar | ❌ Ecosystem pequeno<br>❌ Menos features<br>❌ Docker foca em K8s | Use apenas para apps muito simples ou experimentação. **Não recomendado para produção** |

**Recomendação Principal:** **Kubernetes** (self-managed ou GKE/EKS/AKS) ou **AWS ECS Fargate** (simplicidade)  
**Razão:**  
- **K8s:** Padrão da indústria, cloud-agnostic, futuro-proof  
- **ECS Fargate:** Simplicidade, zero-ops, ideal se já usa AWS e quer começar rápido

---

## 13. CI/CD

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **GitHub Actions** | Integração GitHub nativa, YAML config, marketplace actions, free tier generoso | ✅ Integração GitHub perfeita<br>✅ YAML simples<br>✅ Marketplace (1000+ actions)<br>✅ Free (2000 min/mês)<br>✅ Self-hosted runners | ❌ Vendor lock-in GitHub<br>❌ Menos flexível que Jenkins<br>❌ Debug pode ser frustrante | **Recomendado** se código está no GitHub, quer simplicidade, ou startup/projeto open-source |
| **GitLab CI/CD** | Integração GitLab, Auto DevOps, review apps, security scanning | ✅ Integração GitLab<br>✅ Auto DevOps<br>✅ Security scanning built-in<br>✅ Review apps automáticas<br>✅ Self-hosted option | ❌ Vendor lock-in GitLab<br>❌ Runners podem ser lentos<br>❌ Menos marketplace que GH | Use se código está no GitLab, ou quer DevOps all-in-one (repo + CI/CD + registry) |
| **Jenkins** | Open-source, extremamente flexível, plugins infinitos, self-hosted | ✅ Open-source<br>✅ Plugins para tudo<br>✅ Self-hosted (controle)<br>✅ Pipelines complexos | ❌ UI desatualizada<br>❌ Setup/manutenção complexa<br>❌ Groovy (curva aprendizado)<br>❌ Requer servidor dedicado | Apenas se precisa customização extrema, já tem Jenkins, ou on-premise obrigatório |
| **CircleCI** | Cloud-native, config simples, Docker first-class, performance boa | ✅ Performance excelente<br>✅ Docker layer caching<br>✅ Config simples<br>✅ Orbs (reusable config) | ❌ Custos crescem rápido<br>❌ Vendor lock-in<br>❌ Free tier limitado | Considere se GitHub Actions não atende performance, ou projetos Docker-heavy |

**Recomendação Principal:** **GitHub Actions** (código no GitHub) ou **GitLab CI/CD** (código no GitLab)  
**Razão:** Integração nativa com repo, config simples, free tier generoso, zero manutenção.

---

## 14. MONITORAMENTO E OBSERVABILIDADE

| Componente | Tecnologia | Justificativa | Prós | Contras |
|------------|------------|---------------|------|---------|
| **Métricas** | **Prometheus + Grafana** | Standard open-source, queries poderosas (PromQL), alertas flexíveis | ✅ Open-source<br>✅ PromQL poderoso<br>✅ Grafana dashboards ricos<br>✅ Service discovery<br>✅ Alertmanager | ❌ Setup inicial complexo<br>❌ Retenção limitada (local)<br>❌ Cardinality limits |
| **Métricas (Cloud)** | **Datadog** | All-in-one SaaS, APM integrado, logs + metrics + traces, UI excelente | ✅ Zero setup<br>✅ APM built-in<br>✅ UI/UX excelente<br>✅ Alertas inteligentes<br>✅ Integrações infinitas | ❌ Custos altos (escala)<br>❌ Vendor lock-in<br>❌ $$$$ para produção |
| **Logs** | **ELK Stack** (Elasticsearch, Logstash, Kibana) | Standard para logs centralizados, queries ricas, visualizações | ✅ Queries poderosas<br>✅ Kibana visualizations<br>✅ Open-source<br>✅ Integra com tudo | ❌ Complexo para manter<br>❌ Consome muitos recursos<br>❌ Elasticsearch caro |
| **Logs (Cloud)** | **CloudWatch Logs** (AWS) | Managed AWS, integração nativa, pay-per-use, insights | ✅ Zero manutenção (AWS)<br>✅ Integração AWS<br>✅ Insights queries<br>✅ Custos previsíveis | ❌ Vendor lock-in<br>❌ UI inferior ELK<br>❌ Queries menos poderosas |
| **Tracing** | **Jaeger** | Distributed tracing open-source, OpenTelemetry compatible, debug latência | ✅ Open-source<br>✅ OpenTelemetry<br>✅ Debug microservices<br>✅ Dependency graphs | ❌ Setup não-trivial<br>❌ Storage separado<br>❌ Overhead performance |
| **APM (All-in-One)** | **New Relic** | APM completo, real user monitoring, errors tracking, mobile APM | ✅ APM completo<br>✅ RUM (frontend)<br>✅ Mobile APM<br>✅ Error tracking<br>✅ UI moderna | ❌ Custos altos<br>❌ Vendor lock-in<br>❌ Overkill para startups |

**Recomendação Principal:**  
**Startup/MVP:** **Datadog** (all-in-one, zero-ops) ou **CloudWatch** (se AWS)  
**Scale-up:** **Prometheus + Grafana** (métricas) + **ELK** (logs) + **Jaeger** (tracing)  
**Razão:** Datadog acelera time-to-market; stack open-source reduz custos em escala.

---

## 15. CDN (Content Delivery Network)

| Tecnologia | Justificativa | Prós | Contras | Quando Usar |
|------------|---------------|------|---------|-------------|
| **Cloudflare** | Global network, DDoS protection, free tier generoso, WAF incluído | ✅ Free tier excelente<br>✅ DDoS protection<br>✅ WAF grátis<br>✅ 200+ PoPs<br>✅ R2 storage integrado<br>✅ Workers (edge compute) | ❌ Cache purge demorado<br>❌ Menos controle que CloudFront<br>❌ Support free tier limitado | **Recomendado** para startups, free tier generoso, ou quer DDoS protection grátis |
| **AWS CloudFront** | Integração S3 perfeita, baixa latência, invalidação rápida | ✅ Integração AWS nativa<br>✅ Invalidação instantânea<br>✅ Edge locations globais<br>✅ Lambda@Edge | ❌ Custos podem crescer<br>❌ Configuração AWS complexa<br>❌ Vendor lock-in | **Ótimo** se já usa AWS, precisa invalidação rápida, ou Lambda@Edge útil |
| **Fastly** | Edge compute avançado, VCL customizável, purge instantâneo | ✅ Purge instantâneo<br>✅ VCL (customização)<br>✅ Edge compute robusto<br>✅ Real-time analytics | ❌ Custos mais altos<br>❌ Complexidade VCL<br>❌ Overkill para maioria | Use apenas se precisa edge compute complexo ou purge instantâneo crítico |

**Recomendação Principal:** **Cloudflare** (custo-benefício) ou **AWS CloudFront** (integração AWS)  
**Razão:** Cloudflare tem melhor free tier; CloudFront melhor para quem já usa AWS S3.

---

## Stack Tecnológica Recomendada - Resumo

### 🏆 Stack "Startup Ágil" (Time-to-Market)

| Camada | Tecnologia |
|--------|------------|
| **Frontend Web** | Next.js 14 (React + TypeScript) |
| **Frontend Mobile** | React Native + Expo |
| **Backend** | Node.js + NestJS (TypeScript) |
| **Banco Relacional** | PostgreSQL 15 |
| **Cache** | Redis |
| **Search** | Elasticsearch |
| **Message Queue** | AWS SQS/SNS (ou RabbitMQ se self-hosted) |
| **Storage** | AWS S3 ou Cloudflare R2 |
| **API Gateway** | AWS API Gateway (ou Kong se K8s) |
| **Auth** | JWT (Access + Refresh) |
| **Pagamento** | Stripe + Mercado Pago (Brasil) |
| **Containers** | Docker |
| **Orquestração** | AWS ECS Fargate (início) → Kubernetes (escala) |
| **CI/CD** | GitHub Actions |
| **Monitoramento** | Datadog (início) → Prometheus + Grafana (escala) |
| **CDN** | Cloudflare |

**Justificativa:** Balanceamento ideal entre velocidade de desenvolvimento, custos iniciais baixos, e capacidade de escalar.

---

### 🚀 Stack "Enterprise Scale" (Produção Robusta)

| Camada | Tecnologia |
|--------|------------|
| **Frontend Web** | Next.js 14 (SSR/SSG) |
| **Frontend Mobile** | React Native (ou Flutter se performance crítica) |
| **Backend** | Node.js + NestJS (ou Go para serviços críticos) |
| **Banco Relacional** | PostgreSQL 15 (multi-region replicas) |
| **Cache** | Redis Cluster |
| **Search** | Elasticsearch Cluster |
| **Message Queue** | RabbitMQ Cluster (ou Kafka se event-driven) |
| **Storage** | AWS S3 + CloudFront |
| **API Gateway** | Kong Gateway |
| **Auth** | Keycloak (self-hosted) ou Auth0 |
| **Pagamento** | Stripe + Mercado Pago |
| **Containers** | Docker |
| **Orquestração** | Kubernetes (GKE/EKS/AKS) |
| **CI/CD** | GitLab CI/CD ou GitHub Actions |
| **Monitoramento** | Prometheus + Grafana + ELK + Jaeger |
| **CDN** | CloudFront (ou Cloudflare) |

**Justificativa:** Controle total, open-source onde possível, cloud-agnostic, observabilidade completa.

---

## Critérios de Decisão por Contexto

### Escolha **Cloud-First (AWS/GCP/Azure)** se:
- ✅ Time pequeno sem DevOps dedicado
- ✅ Quer zero-ops em infra
- ✅ Budget permite custos cloud
- ✅ Time-to-market é prioridade #1

### Escolha **Self-Hosted/Open-Source** se:
- ✅ Tem equipe DevOps experiente
- ✅ Quer controle total e reduzir custos em escala
- ✅ Compliance/soberania de dados importa
- ✅ Multi-cloud ou on-premise necessário

### Escolha **Híbrido** se:
- ✅ Quer começar rápido (cloud) mas migrar depois (self-hosted)
- ✅ Alguns serviços cloud (S3, CDN) + core self-hosted (K8s, DBs)
- ✅ Balance entre controle e conveniência

---

Esta stack foi projetada para **escalar de 100 usuários a 10 milhões**, com caminhos claros de migração conforme o produto cresce. A chave é começar simples (cloud-managed) e migrar para self-hosted conforme a equipe e orçamento permitem.