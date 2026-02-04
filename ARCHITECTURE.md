# Arquitetura de Sistema de Aluguel de Acomodações

## Diagrama de Arquitetura em Camadas

![01.png](01.png)

---

## Diagrama C4 - Nível de Contexto

![02.png](02.png)

---

## Diagrama C4 - Nível de Container

![03.png](03.png)

---

## Fluxo de Dados - Criação de Reserva (Sequence Diagram)

![04.png](04.png)

---

## Decisões Arquiteturais e Justificativas

### 1. **Arquitetura de Microserviços**

**Decisão:** Adotar microserviços em vez de monolito

**Justificativas:**
- ✅ **Escalabilidade independente**: Search e Booking podem escalar diferentemente
- ✅ **Desenvolvimento paralelo**: Times diferentes em serviços diferentes
- ✅ **Isolamento de falhas**: Falha no Payment não derruba Messaging
- ✅ **Tecnologias especializadas**: Elasticsearch para busca, Node.js para API
- ⚠️ **Complexidade operacional**: Requer DevOps maduro e monitoramento robusto

---

### 2. **API Gateway (Kong/AWS API Gateway)**

**Decisão:** Centralizar ponto de entrada via API Gateway

**Justificativas:**
- ✅ **Rate limiting**: Proteção contra abuso e DDoS
- ✅ **Autenticação centralizada**: JWT validation em um ponto
- ✅ **Roteamento inteligente**: Circuit breaker e retry logic
- ✅ **Versionamento de API**: Suporte a múltiplas versões simultaneamente
- ✅ **Observabilidade**: Métricas centralizadas de todas as requisições

---

### 3. **PostgreSQL para Dados Transacionais**

**Decisão:** PostgreSQL como banco principal, particionado por domínio

**Justificativas:**
- ✅ **ACID compliance**: Crítico para reservas e pagamentos
- ✅ **Relações complexas**: Users ↔ Properties ↔ Bookings
- ✅ **Suporte a JSON**: Flexibilidade para dados semi-estruturados
- ✅ **Maturidade**: Comunidade grande, ferramentas robustas
- 🔄 **Alternativa considerada**: MySQL (similar), MongoDB (rejeitado por falta de transações complexas)

**Estratégia de Particionamento:**
- Database por bounded context (Users DB, Bookings DB, Payments DB)
- Evita joins cross-service
- Cada serviço possui seu schema independente

---

### 4. **Elasticsearch para Busca**

**Decisão:** Elasticsearch dedicado para search e filtros

**Justificativas:**
- ✅ **Full-text search**: Busca por texto livre em descrições
- ✅ **Geolocation**: Busca por proximidade geográfica
- ✅ **Faceted search**: Filtros múltiplos simultâneos (preço, comodidades, avaliação)
- ✅ **Performance**: Queries complexas em < 100ms
- ✅ **Escalabilidade horizontal**: Sharding automático

**Sincronização:**
- Change Data Capture (CDC) via Debezium
- Ou event-driven: Property Service publica eventos → indexador consome

---

### 5. **Redis para Cache e Sessões**

**Decisão:** Redis como cache distribuído e session store

**Justificativas:**
- ✅ **Performance**: Sub-millisecond latency
- ✅ **Sessões JWT**: Blacklist de tokens revogados
- ✅ **Cache de queries**: Resultados de busca frequentes
- ✅ **Rate limiting**: Contador de requests por usuário
- ✅ **Pub/Sub**: Notificações em tempo real (alternativa ao WebSocket para alguns casos)

**Estratégia de Cache:**
- Cache-aside pattern para dados de leitura frequente
- TTL configurável por tipo de dado (sessões: 24h, busca: 15min)

---

### 6. **Message Queue (RabbitMQ/SQS)**

**Decisão:** Processamento assíncrono via filas

**Justificativas:**
- ✅ **Desacoplamento**: Booking não espera email ser enviado
- ✅ **Resiliência**: Retry automático em caso de falha
- ✅ **Picos de carga**: Absorve spikes sem sobrecarregar serviços downstream
- ✅ **Event-driven**: Arquitetura baseada em eventos (CQRS leve)

**Eventos Principais:**
- `BOOKING_CREATED`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`
- `PAYMENT_PROCESSED`, `PAYMENT_FAILED`
- `REVIEW_SUBMITTED`, `MESSAGE_SENT`

**Consumidores:**
- Notification Service (emails, SMS, push)
- Analytics Service (métricas em tempo real)
- Fraud Detection (análise assíncrona)

---

### 7. **WebSocket para Chat em Tempo Real**

**Decisão:** WebSocket server dedicado para mensagens

**Justificativas:**
- ✅ **Latência baixa**: Mensagens instantâneas
- ✅ **Bi-direcional**: Server pode push notificações
- ✅ **Indicadores de presença**: "usuário está digitando..."
- 🔄 **Alternativa**: Polling (ineficiente), Server-Sent Events (unidirecional)

**Implementação:**
- Socket.io para fallback automático (WebSocket → polling)
- Sticky sessions no load balancer
- Redis Pub/Sub para sincronizar múltiplas instâncias do WS server

---

### 8. **CDN (CloudFront/Cloudflare)**

**Decisão:** CDN global para assets estáticos e imagens

**Justificativas:**
- ✅ **Performance**: Edge locations próximas ao usuário (< 50ms)
- ✅ **Redução de banda**: Origin server economiza tráfego
- ✅ **Proteção DDoS**: CDN absorve ataques
- ✅ **Image optimization**: Resize automático, formato WebP/AVIF

**Estratégia de Cache:**
- Imagens de propriedades: 1 ano (com versioning)
- Assets estáticos (JS/CSS): Cache agressivo com hash no nome
- HTML: Cache curto ou sem cache (para SEO dinâmico)

---

### 9. **Monitoramento e Observabilidade**

**Decisão:** Stack completo de observabilidade (Metrics + Logs + Traces)

**Componentes:**
- **Prometheus + Grafana**: Métricas de sistema e aplicação
- **ELK Stack**: Logs centralizados e pesquisáveis
- **Jaeger**: Distributed tracing para debug de latência

**Justificativas:**
- ✅ **Debugging**: Rastrear requests cross-service
- ✅ **Alertas**: Notificação proativa de problemas
- ✅ **Capacity planning**: Métricas para decisões de escala
- ✅ **SLA monitoring**: Garantir uptime de 99.9%

**Métricas Chave:**
- Latência P50, P95, P99 por endpoint
- Taxa de erro (4xx, 5xx)
- Throughput (requests/segundo)
- Database connection pool utilization
- Queue depth

---

### 10. **Estratégia de Deploy e Escala**

**Decisão:** Containerização (Docker) + Orquestração (Kubernetes)

**Justificativas:**
- ✅ **Portabilidade**: Mesma imagem em dev, staging, prod
- ✅ **Auto-scaling**: HPA baseado em CPU/memória/custom metrics
- ✅ **Rolling updates**: Zero-downtime deploys
- ✅ **Self-healing**: Pods reiniciam automaticamente em falha

**Estratégia de Escala:**
```yaml
Search Service: 10-50 pods (alta variação de carga)
Booking Service: 5-20 pods (crítico, sempre disponível)
Auth Service: 3-10 pods (cache-heavy, escala moderada)
Notification Service: 2-10 pods (queue-based, escala conforme fila)
```

---

## Padrões de Comunicação

### Síncrono (REST)
```
Frontend → API Gateway → Microserviço → Database
Tempo real necessário (busca, login, criação de reserva)
```

### Assíncrono (Event-Driven)
```
Booking Service → Queue → Notification Service → Email Provider
Processamento pode ser diferido (emails, analytics, ML)
```

### Híbrido (WebSocket)
```
Frontend ←→ WebSocket Server ←→ Message Service ←→ Redis Pub/Sub
Baixa latência necessária (chat, notificações em tempo real)
```

---

## Considerações de Segurança

1. **Autenticação**: JWT com refresh tokens, expiração curta (15min)
2. **Autorização**: RBAC implementado no API Gateway + cada serviço
3. **Comunicação**: TLS 1.3 obrigatório, mTLS entre serviços internos (service mesh)
4. **Dados sensíveis**: Criptografia at-rest (PG, S3), PCI-DSS para dados de cartão
5. **Rate limiting**: Por IP, por usuário, por endpoint
6. **DDoS protection**: Cloudflare + WAF
7. **Secrets management**: Vault/AWS Secrets Manager (nunca em código)

---

## Estimativa de Capacidade (Exemplo)

**Cenário:** 100k usuários ativos mensais, 10k reservas/dia

| Componente | Especificação | Justificativa |
|------------|---------------|---------------|
| **API Gateway** | 4 instâncias (4 vCPU, 8GB RAM) | ~5000 req/s |
| **Booking Service** | 10 pods (2 vCPU, 4GB RAM) | Serviço crítico, alta disponibilidade |
| **PostgreSQL** | Primary + 2 réplicas leitura (16 vCPU, 64GB RAM) | 50k conexões simultâneas |
| **Redis** | Cluster 3 nós (8GB RAM cada) | 1M keys, 10k ops/s |
| **Elasticsearch** | 5 nós (8 vCPU, 32GB RAM) | 100M documentos, 1000 queries/s |
| **RabbitMQ** | 3 nós cluster (4 vCPU, 8GB RAM) | 10k msgs/s |

---

Esta arquitetura balanceia **escalabilidade**, **resiliência**, **manutenibilidade** e **custo**, sendo adequada para um marketplace de médio a grande porte com potencial de crescimento significativo.