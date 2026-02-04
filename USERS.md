# Matriz de Controle de Acesso - Sistema de Aluguel de Acomodações

## Arquitetura de Permissões e Autorização

---

## 1. HÓSPEDE (Guest)

### Descrição do Papel
Usuário que busca e reserva acomodações na plataforma. Principal consumidor do serviço, responsável por realizar reservas, efetuar pagamentos e avaliar experiências.

### Matriz de Permissões

| Módulo | Criar | Visualizar | Editar | Excluir | Ações Especiais |
|--------|-------|------------|--------|---------|-----------------|
| **Usuários** | ✅ Próprio cadastro | ✅ Próprio perfil<br>✅ Perfil público de anfitriões | ✅ Próprio perfil | ✅ Própria conta | • Verificar identidade<br>• Alterar senha |
| **Acomodações** | ❌ | ✅ Todas públicas<br>✅ Detalhes completos | ❌ | ❌ | • Favoritar/Salvar<br>• Compartilhar |
| **Reservas** | ✅ Próprias reservas | ✅ Próprias reservas<br>✅ Histórico completo | ✅ Modificar datas* | ✅ Cancelar próprias* | • Solicitar reserva<br>• Reserva instantânea |
| **Pagamentos** | ✅ Realizar pagamento | ✅ Próprios pagamentos<br>✅ Comprovantes | ❌ | ❌ | • Adicionar método de pagamento<br>• Aplicar cupom |
| **Avaliações** | ✅ Avaliar após estadia | ✅ Próprias avaliações<br>✅ Avaliações públicas | ✅ Editar (48h)* | ❌ | • Denunciar avaliação inadequada |
| **Mensagens** | ✅ Iniciar conversa | ✅ Próprias conversas | ✅ Próprias mensagens | ❌ | • Anexar fotos<br>• Bloquear usuário |
| **Relatórios** | ❌ | ❌ | ❌ | ❌ | • Exportar histórico de reservas |
| **Configurações** | ❌ | ✅ Preferências próprias | ✅ Preferências próprias | ❌ | • Gerenciar notificações<br>• Configurar privacidade |

### Regras de Negócio Específicas

**RN-G01:** Hóspede só pode criar reserva se tiver método de pagamento válido cadastrado  
**RN-G02:** Hóspede só pode avaliar propriedade após conclusão da estadia  
**RN-G03:** Hóspede pode editar avaliação apenas nas primeiras 48 horas após publicação  
**RN-G04:** Hóspede não pode fazer nova reserva se tiver pendências de pagamento  
**RN-G05:** Hóspede pode cancelar reserva conforme política de cancelamento da propriedade  
**RN-G06:** Hóspede não pode modificar reserva menos de 24h antes do check-in sem aprovação do anfitrião  
**RN-G07:** Hóspede pode visualizar apenas mensagens de conversas que participa  
**RN-G08:** Hóspede com conta suspensa não pode criar novas reservas  
**RN-G09:** Hóspede só pode ter uma solicitação de reserva pendente por propriedade  
**RN-G10:** Hóspede precisa verificar email para realizar primeira reserva  

---

## 2. ANFITRIÃO (Host)

### Descrição do Papel
Usuário que disponibiliza acomodações para aluguel. Responsável por gerenciar propriedades, aprovar reservas, comunicar-se com hóspedes e manter a qualidade do serviço oferecido.

### Matriz de Permissões

| Módulo | Criar | Visualizar | Editar | Excluir | Ações Especiais |
|--------|-------|------------|--------|---------|-----------------|
| **Usuários** | ✅ Próprio cadastro | ✅ Próprio perfil<br>✅ Perfil público de hóspedes | ✅ Próprio perfil | ✅ Própria conta | • Verificar identidade<br>• Solicitar selo Superhost |
| **Acomodações** | ✅ Ilimitadas* | ✅ Próprias acomodações<br>✅ Estatísticas detalhadas | ✅ Próprias acomodações | ✅ Próprias acomodações* | • Ativar/Pausar anúncio<br>• Clonar anúncio<br>• Visualizar insights |
| **Reservas** | ❌ | ✅ Reservas de suas propriedades<br>✅ Calendário consolidado | ✅ Alterar status | ❌ | • Aprovar/Rejeitar solicitação<br>• Bloquear datas<br>• Cancelar (com penalidade)* |
| **Pagamentos** | ❌ | ✅ Próprios recebimentos<br>✅ Extratos financeiros | ✅ Dados bancários | ❌ | • Configurar conta bancária<br>• Solicitar antecipação |
| **Avaliações** | ✅ Avaliar hóspedes | ✅ Avaliações recebidas<br>✅ Próprias avaliações | ✅ Editar (48h)* | ❌ | • Responder avaliações<br>• Denunciar avaliação |
| **Mensagens** | ✅ Responder hóspedes | ✅ Conversas de suas propriedades | ✅ Próprias mensagens | ❌ | • Templates de resposta<br>• Bloquear hóspede |
| **Relatórios** | ❌ | ✅ Dashboard de desempenho<br>✅ Relatórios de ocupação | ❌ | ❌ | • Exportar relatórios<br>• Análise de concorrência |
| **Configurações** | ❌ | ✅ Preferências próprias | ✅ Preferências próprias | ❌ | • Configurar precificação automática<br>• Regras de reserva |

### Regras de Negócio Específicas

**RN-H01:** Anfitrião precisa ter identidade verificada para publicar primeira propriedade  
**RN-H02:** Anfitrião pode criar até 100 propriedades (limite pode ser aumentado via suporte)  
**RN-H03:** Anfitrião só pode editar/excluir acomodações sem reservas ativas futuras  
**RN-H04:** Anfitrião deve responder solicitações de reserva em até 24 horas  
**RN-H05:** Anfitrião pode rejeitar até 3 solicitações consecutivas antes de revisão da conta  
**RN-H06:** Anfitrião não pode alterar preço de reserva já confirmada  
**RN-H07:** Anfitrião só recebe pagamento 24h após check-in do hóspede  
**RN-H08:** Anfitrião deve avaliar hóspede em até 14 dias após check-out  
**RN-H09:** Anfitrião com taxa de cancelamento > 10% perde benefícios de Superhost  
**RN-H10:** Anfitrião só pode visualizar dados pessoais de hóspedes com reserva confirmada  
**RN-H11:** Anfitrião não pode cancelar reserva confirmada sem justificativa válida (penalidade aplicada)  
**RN-H12:** Anfitrião precisa manter taxa de resposta > 90% para manter visibilidade do anúncio  
**RN-H13:** Anfitrião pode pausar anúncio a qualquer momento, mas não pode apagar histórico de avaliações  
**RN-H14:** Anfitrião deve ter pelo menos 3 fotos de qualidade para publicar propriedade  

---

## 3. ADMINISTRADOR (Admin)

### Descrição do Papel
Usuário com permissões totais para gestão da plataforma. Responsável por moderação, suporte avançado, resolução de disputas, configurações globais e manutenção da integridade do sistema.

### Matriz de Permissões

| Módulo | Criar | Visualizar | Editar | Excluir | Ações Especiais |
|--------|-------|------------|--------|---------|-----------------|
| **Usuários** | ✅ Todos os tipos | ✅ Todos os usuários<br>✅ Dados completos | ✅ Qualquer perfil | ✅ Qualquer conta* | • Suspender/Banir usuário<br>• Reativar conta<br>• Resetar senha<br>• Forçar verificação |
| **Acomodações** | ✅ Em nome de anfitrião | ✅ Todas as acomodações<br>✅ Incluindo inativas | ✅ Qualquer acomodação | ✅ Qualquer acomodação* | • Aprovar/Reprovar anúncio<br>• Destacar propriedade<br>• Marcar como fraudulenta |
| **Reservas** | ✅ Manual (casos especiais) | ✅ Todas as reservas<br>✅ Histórico completo | ✅ Qualquer reserva* | ✅ Qualquer reserva* | • Cancelar sem penalidade<br>• Alterar status manualmente<br>• Resolver disputas |
| **Pagamentos** | ✅ Ajustes manuais | ✅ Todas as transações<br>✅ Dados financeiros completos | ✅ Status de pagamento | ❌ | • Processar reembolso<br>• Estornar pagamento<br>• Ajustar comissão<br>• Liberar pagamento antecipado |
| **Avaliações** | ❌ | ✅ Todas as avaliações<br>✅ Denúncias | ✅ Qualquer avaliação* | ✅ Remover avaliações* | • Moderar conteúdo<br>• Ocultar avaliação<br>• Banir por violação |
| **Mensagens** | ✅ Suporte oficial | ✅ Todas as conversas | ❌ | ✅ Mensagens inadequadas | • Intervir em conversa<br>• Monitorar suspeitas<br>• Exportar histórico |
| **Relatórios** | ✅ Relatórios customizados | ✅ Todos os dashboards<br>✅ Métricas globais | ✅ Configurar KPIs | ❌ | • Acessar analytics completo<br>• Exportar dados bulk<br>• Criar visualizações |
| **Configurações** | ✅ Novas configurações | ✅ Todas as configurações | ✅ Configurações globais | ✅ Configurações obsoletas | • Alterar taxas da plataforma<br>• Configurar integrações<br>• Gerenciar feature flags |

### Regras de Negócio Específicas

**RN-A01:** Admin deve registrar motivo para ações críticas (exclusões, banimentos, reembolsos)  
**RN-A02:** Admin não pode processar pagamentos para própria conta  
**RN-A03:** Ações de alto impacto requerem autenticação dois fatores  
**RN-A04:** Admin deve seguir protocolo de resolução de disputas antes de intervenção  
**RN-A05:** Exclusão permanente de dados requer aprovação de dois administradores  
**RN-A06:** Admin deve documentar intervenções em conversas de usuários  
**RN-A07:** Alterações em configurações de pagamento requerem auditoria  
**RN-A08:** Admin tem acesso read-only a senhas (hashed) e dados sensíveis criptografados  
**RN-A09:** Admin deve respeitar LGPD/GDPR em todas as visualizações de dados  
**RN-A10:** Logs de todas as ações admin são permanentes e não podem ser deletados  

---

## 4. MODERADOR (Moderator)

### Descrição do Papel
Usuário com permissões intermediárias focadas em curadoria de conteúdo, suporte ao cliente e verificação de qualidade. Não possui acesso a dados financeiros sensíveis ou configurações críticas do sistema.

### Matriz de Permissões

| Módulo | Criar | Visualizar | Editar | Excluir | Ações Especiais |
|--------|-------|------------|--------|---------|-----------------|
| **Usuários** | ❌ | ✅ Perfis públicos<br>✅ Dados básicos | ⚠️ Dados de verificação | ❌ | • Aprovar verificação<br>• Sinalizar conta suspeita<br>• Suspensão temporária (24h) |
| **Acomodações** | ❌ | ✅ Todas as acomodações<br>⚠️ Dados básicos | ⚠️ Status de aprovação | ❌ | • Aprovar/Reprovar anúncio<br>• Solicitar correções<br>• Marcar para revisão admin |
| **Reservas** | ❌ | ✅ Reservas em disputa<br>⚠️ Dados limitados | ❌ | ❌ | • Mediar conflitos<br>• Escalar para admin<br>• Adicionar notas internas |
| **Pagamentos** | ❌ | ⚠️ Status geral (sem valores) | ❌ | ❌ | • Visualizar status de transação<br>• Escalar problemas |
| **Avaliações** | ❌ | ✅ Todas as avaliações<br>✅ Denúncias | ✅ Status de moderação | ⚠️ Ocultar temporariamente | • Aprovar/Reprovar avaliação<br>• Solicitar edição<br>• Sinalizar para admin |
| **Mensagens** | ✅ Resposta de suporte | ✅ Conversas denunciadas | ❌ | ⚠️ Mensagens violentas | • Responder como suporte<br>• Advertir usuário<br>• Encaminhar para admin |
| **Relatórios** | ❌ | ✅ Dashboard de moderação<br>✅ Métricas de qualidade | ❌ | ❌ | • Exportar relatórios de moderação |
| **Configurações** | ❌ | ✅ Regras de moderação | ❌ | ❌ | • Sugerir melhorias |

### Regras de Negócio Específicas

**RN-M01:** Moderador deve analisar denúncias em até 48 horas  
**RN-M02:** Moderador não pode visualizar dados financeiros detalhados (valores, contas bancárias)  
**RN-M03:** Moderador pode suspender conta por até 24h, suspensões maiores requerem admin  
**RN-M04:** Moderador deve seguir guidelines de moderação definidos pela plataforma  
**RN-M05:** Decisões de moderador podem ser contestadas e revisadas por admin  
**RN-M06:** Moderador não pode moderar conteúdo de contas admin  
**RN-M07:** Moderador deve documentar razão para aprovação/reprovação de conteúdo  
**RN-M08:** Moderador tem acesso apenas a dados necessários para moderação (princípio do mínimo privilégio)  
**RN-M09:** Moderador não pode processar reembolsos ou alterar valores de transação  
**RN-M10:** Todas as ações de moderador são auditadas e revisadas periodicamente  

---

## 5. SUPORTE (Support) [Perfil Adicional]

### Descrição do Papel
Usuário focado exclusivamente em atendimento ao cliente, sem permissões de moderação ou alteração de dados. Atende tickets, esclarece dúvidas e encaminha problemas complexos.

### Matriz de Permissões

| Módulo | Criar | Visualizar | Editar | Excluir | Ações Especiais |
|--------|-------|------------|--------|---------|-----------------|
| **Usuários** | ❌ | ⚠️ Dados básicos públicos | ❌ | ❌ | • Visualizar tickets do usuário<br>• Adicionar notas de atendimento |
| **Acomodações** | ❌ | ✅ Informações públicas | ❌ | ❌ | • Consultar disponibilidade |
| **Reservas** | ❌ | ⚠️ Reservas relacionadas a tickets | ❌ | ❌ | • Consultar status<br>• Escalar problema |
| **Pagamentos** | ❌ | ⚠️ Status (sem valores sensíveis) | ❌ | ❌ | • Confirmar recebimento<br>• Escalar para financeiro |
| **Avaliações** | ❌ | ✅ Avaliações públicas | ❌ | ❌ | • Explicar políticas |
| **Mensagens** | ✅ Tickets de suporte | ✅ Conversas de suporte | ✅ Próprias respostas | ❌ | • Responder tickets<br>• Atribuir para outro agente<br>• Marcar como resolvido |
| **Relatórios** | ❌ | ✅ Dashboard de tickets | ❌ | ❌ | • Ver métricas de atendimento |
| **Configurações** | ❌ | ✅ FAQs e documentação | ❌ | ❌ | • Sugerir melhorias |

### Regras de Negócio Específicas

**RN-S01:** Suporte responde tickets em até 4 horas (horário comercial)  
**RN-S02:** Suporte não acessa dados financeiros sensíveis  
**RN-S03:** Suporte escala problemas técnicos para equipe apropriada  
**RN-S04:** Suporte não pode alterar nenhum dado de usuários ou reservas  
**RN-S05:** Todas as interações de suporte são registradas para auditoria  

---

## 6. SUPER ADMIN (Super Administrator)

### Descrição do Papel
Perfil técnico com acesso total irrestrito ao sistema. Geralmente limitado a CTO, desenvolvedores seniores e responsáveis pela infraestrutura. Possui permissões que ultrapassam regras de negócio.

### Matriz de Permissões

| Módulo | Criar | Visualizar | Editar | Excluir | Ações Especiais |
|--------|-------|------------|--------|---------|-----------------|
| **Todos** | ✅ Irrestrito | ✅ Irrestrito | ✅ Irrestrito | ✅ Irrestrito | • Acesso a banco de dados<br>• Executar scripts<br>• Modificar código em produção<br>• Bypass de todas as regras |

### Regras de Negócio Específicas

**RN-SA01:** Super Admin registrado e auditado para compliance  
**RN-SA02:** Ações em produção requerem justificativa e aprovação  
**RN-SA03:** Acesso limitado a 2-3 pessoas na organização  
**RN-SA04:** Toda ação é logada com timestamp, IP e justificativa  
**RN-SA05:** Uso apenas para emergências, manutenção e desenvolvimento  

---

## Matriz Consolidada de Permissões por Módulo

### Legenda
- ✅ Permitido completamente
- ⚠️ Permitido com restrições
- ❌ Negado
- 🔒 Apenas próprios dados
- 🔓 Dados de outros usuários

| Funcionalidade | Hóspede | Anfitrião | Moderador | Suporte | Admin | Super Admin |
|----------------|---------|-----------|-----------|---------|-------|-------------|
| **Criar conta** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Editar qualquer perfil** | 🔒 | 🔒 | ❌ | ❌ | 🔓 | 🔓 |
| **Banir usuário** | ❌ | ❌ | ⚠️ | ❌ | ✅ | ✅ |
| **Criar acomodação** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Editar qualquer acomodação** | ❌ | 🔒 | ❌ | ❌ | 🔓 | 🔓 |
| **Aprovar anúncio** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Criar reserva** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Aprovar reserva** | ❌ | 🔒 | ❌ | ❌ | 🔓 | 🔓 |
| **Cancelar qualquer reserva** | 🔒 | 🔒⚠️ | ❌ | ❌ | 🔓 | 🔓 |
| **Processar pagamento** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Ver transações financeiras** | 🔒 | 🔒 | ❌ | ⚠️ | 🔓 | 🔓 |
| **Processar reembolso** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Criar avaliação** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Moderar avaliação** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Deletar avaliação** | ❌ | ❌ | ⚠️ | ❌ | ✅ | ✅ |
| **Enviar mensagem** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ver todas as mensagens** | 🔒 | 🔒 | ⚠️ | ⚠️ | 🔓 | 🔓 |
| **Acessar relatórios** | 🔒 | 🔒 | ⚠️ | ⚠️ | 🔓 | 🔓 |
| **Alterar configurações sistema** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Acesso a banco de dados** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Implementação Técnica Recomendada

### 1. **RBAC (Role-Based Access Control)**
```
Usuário → Papel(is) → Permissões → Recursos
```

### 2. **Hierarquia de Papéis**
```
Super Admin (nível 100)
    ↓
Admin (nível 80)
    ↓
Moderador (nível 60)
    ↓
Suporte (nível 40)
    ↓
Anfitrião (nível 30)
    ↓
Hóspede (nível 10)
```

### 3. **Controle de Acesso a Nível de Recurso**
- **Ownership**: Usuário só acessa seus próprios recursos
- **Escopo**: Admin acessa todos, Moderador acessa subset
- **Contexto**: Permissões variam conforme estado (ex: editar reserva antes vs depois do check-in)

### 4. **Auditoria e Compliance**
- Log de todas as ações de Admin e Super Admin
- Registro de acessos a dados sensíveis (LGPD/GDPR)
- Revisão periódica de permissões
- Alertas para ações suspeitas

### 5. **Segurança Adicional**
- MFA obrigatório para Admin e Super Admin
- Rate limiting por papel
- IP whitelisting para Super Admin
- Sessões com timeout reduzido para perfis privilegiados

---

Este modelo de controle de acesso garante **segregação de funções**, **princípio do mínimo privilégio** e **auditabilidade completa**, elementos essenciais para um marketplace seguro e confiável.