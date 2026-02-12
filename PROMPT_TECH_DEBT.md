# Plano: Relatório de Dívida Técnica — Nomadia

## Objetivo
Gerar um arquivo `TECH_DEBT.md` na raiz do repositório, em português (pt-BR), documentando todas as violações de princípios de design e boas práticas encontradas no backend (NestJS) e frontend (Next.js). O relatório será completo, com exemplos de código, severidade e sugestões de correção.

## Escopo da Análise

A análise cobre 7 categorias principais:

### Backend (NestJS)
1. **Violações SOLID** — SRP, OCP, ISP, DIP (sem LSP detectado)
2. **Segurança** — Secrets hardcoded, hashing mock, sem rate limiting, autorização quebrada
3. **Arquitetura** — Sem repository pattern, sem camada de persistência, acoplamento forte
4. **Qualidade de código** — Magic numbers, duplicação, lógica de negócio em controllers
5. **Validação** — Sem DTOs, sem class-validator, sem validação de input
6. **Tratamento de erros** — Sem exception filters globais, erros inconsistentes
7. **Testes** — Todos os arquivos de teste estão vazios (0% cobertura)

### Frontend (Next.js/React)
1. **Design de componentes** — Componentes monolíticos misturando data fetching + UI
2. **Separação de responsabilidades** — Lógica de negócio nos componentes, sem custom hooks
3. **Violações DRY** — Duplicação de formatação de datas, labels de status, skeletons, error handling
4. **Anti-patterns React** — useEffect sem cleanup, deps instáveis, sem AbortController
5. **Boas práticas Next.js** — Excesso de 'use client', sem error.tsx/loading.tsx, sem metadata dinâmico
6. **Tratamento de erros** — Inconsistente (console.error vs alert vs try/catch)
7. **Acessibilidade e UX** — Alt text vazio, sem debounce, credenciais hardcoded

## Estrutura do Relatório

```
TECH_DEBT.md
├── Resumo Executivo (métricas consolidadas)
├── Metodologia e Classificação de Severidade
├── Backend
│   ├── 1. Violações de Princípios SOLID
│   │   ├── SRP — Single Responsibility Principle
│   │   ├── OCP — Open/Closed Principle
│   │   ├── ISP — Interface Segregation Principle
│   │   └── DIP — Dependency Inversion Principle
│   ├── 2. Segurança
│   ├── 3. Arquitetura e Padrões
│   ├── 4. Qualidade de Código
│   ├── 5. Validação de Entrada
│   ├── 6. Tratamento de Erros
│   └── 7. Testes
├── Frontend
│   ├── 1. Design de Componentes
│   ├── 2. Separação de Responsabilidades
│   ├── 3. Violações DRY
│   ├── 4. Anti-patterns React
│   ├── 5. Boas Práticas Next.js
│   ├── 6. Tratamento de Erros
│   └── 7. Acessibilidade e UX
├── Tabela Consolidada de Problemas
└── Roadmap de Correção (priorizado por impacto)
```

## Workplan

- [ ] Criar arquivo `TECH_DEBT.md` na raiz do repositório com toda a análise
  - [ ] Resumo executivo com contagens por severidade
  - [ ] Seção Backend: SOLID, segurança, arquitetura, qualidade, validação, erros, testes
  - [ ] Seção Frontend: componentes, SoC, DRY, React, Next.js, erros, a11y
  - [ ] Tabela consolidada de problemas
  - [ ] Roadmap de correção priorizado
- [ ] Verificar que o arquivo está bem formatado e referências de arquivo/linha estão corretas

## Notas
- O relatório é descritivo (não modifica código)
- Referências de arquivo usam caminhos relativos a partir de `backend/` ou `frontend/`
- Severidades: 🔴 Crítica, 🟠 Alta, 🟡 Média, 🟢 Baixa
- Cada item inclui: descrição, arquivo:linha, exemplo de código, impacto, sugestão de correção
