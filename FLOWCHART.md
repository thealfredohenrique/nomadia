# Documentação de Fluxos de Usuário - Sistema de Aluguel de Acomodações

---

## F1 - CADASTRO E AUTENTICAÇÃO

### F1.1 - Registro de Novo Usuário

#### Descrição Detalhada

O fluxo de registro permite que novos usuários criem uma conta na plataforma, seja como hóspede ou anfitrião. O processo inclui validação de dados, verificação de email e criação de perfil.

**Etapas:**
1. Usuário acessa página de registro
2. Preenche formulário com dados pessoais (email, senha, nome, telefone, data de nascimento)
3. Seleciona papel inicial (guest ou host)
4. Sistema valida dados em tempo real (formato de email, força da senha)
5. Usuário submete formulário
6. Sistema verifica se email já existe
7. Sistema cria hash da senha (bcrypt)
8. Sistema cria conta com status "não verificado"
9. Sistema envia email de verificação
10. Sistema gera tokens JWT (access + refresh)
11. Sistema retorna dados do usuário e tokens
12. Frontend redireciona para dashboard

**Atores:**
- **Usuário** (novo visitante)
- **Frontend** (Web/Mobile App)
- **API Gateway**
- **Auth Service**
- **User Service**
- **Database** (PostgreSQL)
- **Email Service** (SendGrid/AWS SES)

#### Diagrama de Sequência

```mermaid
sequenceDiagram
    actor User as Novo Usuário
    participant FE as Frontend
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant USER as User Service
    participant DB as Database
    participant EMAIL as Email Service

    User->>FE: Acessa página de registro
    FE->>User: Exibe formulário

    User->>FE: Preenche dados<br/>(email, senha, nome, etc)
    
    Note over FE: Validação client-side:<br/>- Email válido<br/>- Senha >= 8 chars<br/>- Campos obrigatórios
    
    User->>FE: Submete formulário
    FE->>GW: POST /auth/register
    GW->>AUTH: Valida request
    
    AUTH->>USER: Verifica email existente
    USER->>DB: SELECT email FROM users<br/>WHERE email = ?
    
    alt Email já existe
        DB-->>USER: Email encontrado
        USER-->>AUTH: Erro: Email já cadastrado
        AUTH-->>GW: 409 Conflict
        GW-->>FE: Erro
        FE-->>User: Exibe mensagem de erro
    else Email disponível
        DB-->>USER: Email não existe
        USER->>AUTH: Email disponível
        
        AUTH->>AUTH: Hash senha (bcrypt, cost=12)
        AUTH->>USER: Criar usuário
        
        USER->>DB: INSERT INTO users<br/>(email, password_hash, ...)
        DB-->>USER: user_id gerado
        
        USER->>DB: INSERT INTO user_verifications<br/>(verification_code)
        
        USER->>EMAIL: Enviar email de verificação
        
        Note over EMAIL: Template:<br/>"Bem-vindo! Clique aqui<br/>para verificar seu email"
        
        EMAIL-->>USER: Email enviado
        
        AUTH->>AUTH: Gera JWT tokens<br/>(access: 15min, refresh: 7d)
        
        AUTH-->>GW: 201 Created<br/>{user, accessToken, refreshToken}
        GW-->>FE: Success response
        FE->>FE: Armazena tokens (localStorage)
        FE-->>User: Redireciona para dashboard
        FE->>User: Exibe banner: "Verifique seu email"
    end
```

#### Regras de Negócio - Registro

| ID | Regra | Tipo | Severidade |
|----|-------|------|------------|
| RN-REG-01 | Email deve ser único na plataforma | Validação | Crítica |
| RN-REG-02 | Senha mínima: 8 caracteres, 1 maiúscula, 1 número, 1 especial | Validação | Crítica |
| RN-REG-03 | Usuário deve ter no mínimo 18 anos (date_of_birth) | Validação | Crítica |
| RN-REG-04 | Email deve seguir formato RFC 5322 | Validação | Crítica |
| RN-REG-05 | Telefone deve incluir código do país (+55...) | Validação | Média |
| RN-REG-06 | Conta criada com status `active` mas `is_email_verified = false` | Negócio | Alta |
| RN-REG-07 | Email de verificação expira em 24 horas | Negócio | Alta |
| RN-REG-08 | Access token expira em 15 minutos | Segurança | Crítica |
| RN-REG-09 | Refresh token expira em 7 dias | Segurança | Crítica |
| RN-REG-10 | Hash de senha usa bcrypt com cost factor 12 | Segurança | Crítica |

---

### F1.2 - Login

#### Descrição Detalhada

Processo de autenticação de usuários existentes.

**Etapas:**
1. Usuário acessa página de login
2. Insere email e senha
3. Sistema valida credenciais
4. Sistema verifica status da conta (ativa, suspensa, banida)
5. Sistema gera novos tokens JWT
6. Sistema registra timestamp de último login
7. Sistema retorna dados do usuário e tokens

#### Diagrama de Sequência

```mermaid
sequenceDiagram
    actor User as Usuário
    participant FE as Frontend
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant DB as Database
    participant REDIS as Redis Cache

    User->>FE: Acessa página de login
    FE->>User: Exibe formulário

    User->>FE: Insere email e senha
    User->>FE: Clica "Entrar"
    
    FE->>GW: POST /auth/login<br/>{email, password}
    GW->>AUTH: Valida request
    
    AUTH->>DB: SELECT * FROM users<br/>WHERE email = ?
    
    alt Usuário não encontrado
        DB-->>AUTH: Nenhum registro
        AUTH-->>GW: 401 Unauthorized
        GW-->>FE: Credenciais inválidas
        FE-->>User: Exibe erro genérico
    else Usuário encontrado
        DB-->>AUTH: Retorna user data<br/>(inclui password_hash)
        
        AUTH->>AUTH: Compara senha<br/>bcrypt.compare(password, hash)
        
        alt Senha incorreta
            AUTH-->>GW: 401 Unauthorized
            GW-->>FE: Credenciais inválidas
            FE-->>User: Exibe erro genérico
        else Senha correta
            AUTH->>AUTH: Verifica account_status
            
            alt Conta suspensa ou banida
                AUTH-->>GW: 403 Forbidden<br/>{reason: "Conta suspensa"}
                GW-->>FE: Erro de acesso
                FE-->>User: "Sua conta foi suspensa.<br/>Contate o suporte."
            else Conta ativa
                AUTH->>REDIS: Verifica rate limiting<br/>(max 5 logins/min)
                REDIS-->>AUTH: Rate limit OK
                
                AUTH->>AUTH: Gera JWT tokens
                
                AUTH->>DB: UPDATE users<br/>SET last_login_at = NOW()
                DB-->>AUTH: Updated
                
                AUTH->>REDIS: Armazena refresh token<br/>(TTL 7 dias)
                
                AUTH-->>GW: 200 OK<br/>{user, accessToken, refreshToken}
                GW-->>FE: Success
                FE->>FE: Armazena tokens
                FE-->>User: Redireciona para dashboard
                
                opt Email não verificado
                    FE->>User: Exibe banner: "Verifique seu email"
                end
            end
        end
    end
```

#### Regras de Negócio - Login

| ID | Regra | Tipo | Severidade |
|----|-------|------|------------|
| RN-LOG-01 | Mensagem de erro genérica para email/senha inválidos (evitar enumeração) | Segurança | Crítica |
| RN-LOG-02 | Rate limiting: máximo 5 tentativas por minuto por IP | Segurança | Crítica |
| RN-LOG-03 | Bloqueio temporário após 5 tentativas falhas (lockout 15 min) | Segurança | Alta |
| RN-LOG-04 | Contas suspensas não podem fazer login | Negócio | Crítica |
| RN-LOG-05 | Contas banidas retornam erro específico | Negócio | Crítica |
| RN-LOG-06 | Last_login_at atualizado em cada login bem-sucedido | Auditoria | Média |
| RN-LOG-07 | Tokens antigos são invalidados no logout | Segurança | Alta |

---

### F1.3 - Recuperação de Senha

#### Descrição Detalhada

Permite que usuários redefinam senha esquecida via email.

**Etapas:**
1. Usuário clica "Esqueci minha senha"
2. Insere email
3. Sistema gera token único de reset
4. Sistema envia email com link de redefinição
5. Usuário clica no link
6. Insere nova senha
7. Sistema valida token e atualiza senha

#### Diagrama de Sequência

```mermaid
sequenceDiagram
    actor User as Usuário
    participant FE as Frontend
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant DB as Database
    participant EMAIL as Email Service

    Note over User,EMAIL: ETAPA 1: Solicitação de Reset

    User->>FE: Clica "Esqueci minha senha"
    FE->>User: Exibe formulário

    User->>FE: Insere email
    User->>FE: Clica "Enviar"
    
    FE->>GW: POST /auth/forgot-password<br/>{email}
    GW->>AUTH: Processa request
    
    AUTH->>DB: SELECT id FROM users<br/>WHERE email = ?
    
    alt Email não encontrado
        DB-->>AUTH: Nenhum registro
        Note over AUTH: Por segurança, retorna<br/>sucesso mesmo se email<br/>não existe (evita enumeração)
        AUTH-->>GW: 200 OK
        GW-->>FE: "Email enviado"
        FE-->>User: "Verifique sua caixa de entrada"
    else Email encontrado
        DB-->>AUTH: user_id
        
        AUTH->>AUTH: Gera reset token<br/>(UUID + timestamp)
        AUTH->>DB: INSERT INTO password_resets<br/>(user_id, token, expires_at)
        
        Note over DB: Token expira em 1 hora
        
        AUTH->>EMAIL: Envia email de reset
        
        Note over EMAIL: Template:<br/>"Clique aqui para redefinir<br/>sua senha (expira em 1h)"
        
        EMAIL-->>AUTH: Email enviado
        AUTH-->>GW: 200 OK
        GW-->>FE: Success
        FE-->>User: "Email enviado com instruções"
    end

    Note over User,EMAIL: ETAPA 2: Redefinição de Senha

    User->>User: Abre email
    User->>FE: Clica no link<br/>(com token na URL)
    FE->>User: Exibe formulário<br/>de nova senha

    User->>FE: Insere nova senha<br/>(2x para confirmação)
    User->>FE: Clica "Redefinir senha"
    
    FE->>GW: POST /auth/reset-password<br/>{token, newPassword}
    GW->>AUTH: Valida request
    
    AUTH->>DB: SELECT * FROM password_resets<br/>WHERE token = ?<br/>AND expires_at > NOW()
    
    alt Token inválido ou expirado
        DB-->>AUTH: Nenhum registro
        AUTH-->>GW: 400 Bad Request
        GW-->>FE: Token inválido
        FE-->>User: "Link expirado.<br/>Solicite um novo."
    else Token válido
        DB-->>AUTH: {user_id, created_at}
        
        AUTH->>AUTH: Hash nova senha<br/>(bcrypt, cost=12)
        
        AUTH->>DB: BEGIN TRANSACTION
        AUTH->>DB: UPDATE users<br/>SET password_hash = ?<br/>WHERE id = ?
        AUTH->>DB: DELETE FROM password_resets<br/>WHERE user_id = ?
        AUTH->>DB: COMMIT
        
        DB-->>AUTH: Updated
        
        AUTH->>EMAIL: Envia confirmação<br/>"Sua senha foi alterada"
        
        AUTH-->>GW: 200 OK
        GW-->>FE: Success
        FE-->>User: "Senha redefinida com sucesso"
        FE->>User: Redireciona para login
    end
```

#### Regras de Negócio - Recuperação de Senha

| ID | Regra | Tipo | Severidade |
|----|-------|------|------------|
| RN-REC-01 | Token de reset expira em 1 hora | Segurança | Crítica |
| RN-REC-02 | Token só pode ser usado uma vez | Segurança | Crítica |
| RN-REC-03 | Resposta sempre 200 OK, mesmo para emails inexistentes (evitar enumeração) | Segurança | Alta |
| RN-REC-04 | Rate limiting: máximo 3 solicitações por hora por IP | Segurança | Alta |
| RN-REC-05 | Nova senha não pode ser igual à anterior | Segurança | Média |
| RN-REC-06 | Email de confirmação enviado após reset bem-sucedido | Auditoria | Média |
| RN-REC-07 | Todos os tokens de reset anteriores são invalidados ao usar um | Segurança | Alta |

---

### F1.4 - Verificação de Email

#### Descrição Detalhada

Processo de validação do endereço de email do usuário.

#### Diagrama de Sequência

```mermaid
sequenceDiagram
    actor User as Usuário
    participant FE as Frontend
    participant GW as API Gateway
    participant USER as User Service
    participant DB as Database
    participant EMAIL as Email Service

    Note over User,EMAIL: Cenário: Usuário recém-registrado

    EMAIL->>User: Email de verificação<br/>(enviado no registro)
    
    User->>User: Abre email
    User->>FE: Clica no link de verificação<br/>(?token=xxx)
    
    FE->>GW: GET /auth/verify-email?token=xxx
    GW->>USER: Valida token
    
    USER->>DB: SELECT * FROM user_verifications<br/>WHERE token = ?<br/>AND expires_at > NOW()
    
    alt Token inválido ou expirado
        DB-->>USER: Nenhum registro
        USER-->>GW: 400 Bad Request
        GW-->>FE: Token inválido
        FE-->>User: "Link expirado.<br/>Solicite novo email."
        
        opt Usuário solicita novo email
            User->>FE: Clica "Reenviar email"
            FE->>GW: POST /auth/resend-verification
            GW->>USER: Gera novo token
            USER->>DB: UPDATE user_verifications
            USER->>EMAIL: Envia novo email
            EMAIL-->>User: Novo email enviado
        end
        
    else Token válido
        DB-->>USER: {user_id, verification_type}
        
        USER->>DB: BEGIN TRANSACTION
        USER->>DB: UPDATE users<br/>SET is_email_verified = true<br/>WHERE id = ?
        USER->>DB: DELETE FROM user_verifications<br/>WHERE token = ?
        USER->>DB: COMMIT
        
        DB-->>USER: Updated
        
        USER-->>GW: 200 OK<br/>{message: "Email verificado"}
        GW-->>FE: Success
        FE-->>User: "Email verificado!<br/>Você pode fazer sua primeira reserva."
        
        opt Usuário já logado
            FE->>FE: Atualiza estado do usuário
            FE->>User: Remove banner de verificação
        end
    end
```

#### Regras de Negócio - Verificação de Email

| ID | Regra | Tipo | Severidade |
|----|-------|------|------------|
| RN-VER-01 | Token de verificação expira em 24 horas | Negócio | Alta |
| RN-VER-02 | Usuário pode solicitar novo email de verificação (rate limit: 1 por hora) | Negócio | Média |
| RN-VER-03 | Email verificado é pré-requisito para primeira reserva | Negócio | Crítica |
| RN-VER-04 | Token de verificação é descartado após uso | Segurança | Alta |
| RN-VER-05 | Verificação atualiza `is_email_verified = true` | Negócio | Crítica |

---

## F2 - CADASTRO DE ACOMODAÇÃO (ANFITRIÃO)

### F2.1 - Criação de Nova Propriedade

#### Descrição Detalhada

Anfitrião cria listagem de propriedade passo a passo.

**Etapas:**
1. Anfitrião clica "Anunciar minha propriedade"
2. Wizard multi-etapas:
   - Tipo de propriedade e localização
   - Detalhes (quartos, camas, banheiros)
   - Comodidades
   - Fotos (mínimo 3)
   - Título e descrição
   - Preços e disponibilidade
   - Políticas (cancelamento, regras da casa)
3. Sistema valida cada etapa
4. Anfitrião revisa e publica
5. Sistema cria propriedade com status "pending_approval"
6. Admin/Moderador aprova ou rejeita

#### Diagrama de Sequência

```mermaid
sequenceDiagram
    actor Host as Anfitrião
    participant FE as Frontend
    participant GW as API Gateway
    participant PROP as Property Service
    participant ADDR as Address Service
    participant UPLOAD as Upload Service
    participant S3 as S3 Storage
    participant DB as Database
    participant QUEUE as Message Queue
    participant NOTIF as Notification Service

    Host->>FE: Clica "Anunciar propriedade"
    FE->>Host: Wizard - Etapa 1: Tipo e Localização

    Note over Host,FE: ETAPA 1: Tipo e Localização
    
    Host->>FE: Seleciona tipo (apartment/house/etc)
    Host->>FE: Insere endereço
    
    FE->>ADDR: Geocode endereço<br/>(Google Maps API)
    ADDR-->>FE: {latitude, longitude, formatted_address}
    
    FE->>Host: Exibe mapa com pin
    Host->>FE: Confirma localização
    Host->>FE: Próxima etapa

    Note over Host,FE: ETAPA 2: Detalhes

    FE->>Host: Wizard - Etapa 2: Detalhes
    Host->>FE: Insere:<br/>- Quartos: 2<br/>- Camas: 3<br/>- Banheiros: 1.5<br/>- Max hóspedes: 4
    Host->>FE: Próxima etapa

    Note over Host,FE: ETAPA 3: Comodidades

    FE->>Host: Wizard - Etapa 3: Comodidades
    FE->>GW: GET /amenities
    GW->>PROP: Lista comodidades
    PROP->>DB: SELECT * FROM amenities<br/>ORDER BY category
    DB-->>PROP: Lista de amenities
    PROP-->>FE: Amenities agrupadas por categoria
    
    Host->>FE: Seleciona:<br/>☑ WiFi<br/>☑ Ar-condicionado<br/>☑ Cozinha<br/>☑ Piscina
    Host->>FE: Próxima etapa

    Note over Host,FE: ETAPA 4: Fotos

    FE->>Host: Wizard - Etapa 4: Fotos<br/>(mínimo 3, máximo 20)
    
    loop Para cada foto
        Host->>FE: Seleciona arquivo (drag & drop)
        FE->>FE: Valida:<br/>- Formato (jpg/png)<br/>- Tamanho (< 10MB)<br/>- Dimensões (min 1024x768)
        
        FE->>UPLOAD: POST /upload/property-photo<br/>(multipart/form-data)
        UPLOAD->>UPLOAD: Redimensiona imagem<br/>(Sharp library)
        UPLOAD->>S3: Upload para S3<br/>(/properties/{uuid}/photo-{n}.jpg)
        S3-->>UPLOAD: URL da imagem
        UPLOAD-->>FE: {photoId, url, thumbnail}
        FE->>Host: Exibe preview
    end
    
    Host->>FE: Define foto de capa<br/>(primeira por padrão)
    Host->>FE: Adiciona legendas (opcional)
    Host->>FE: Próxima etapa

    Note over Host,FE: ETAPA 5: Título e Descrição

    FE->>Host: Wizard - Etapa 5: Detalhes do anúncio
    Host->>FE: Insere título<br/>(max 100 chars)
    Host->>FE: Insere descrição<br/>(max 2000 chars)
    
    FE->>FE: Valida em tempo real:<br/>- Título não vazio<br/>- Descrição >= 50 chars
    
    Host->>FE: Próxima etapa

    Note over Host,FE: ETAPA 6: Preços

    FE->>Host: Wizard - Etapa 6: Preços
    Host->>FE: Preço por noite: R$ 250
    Host->>FE: Taxa de limpeza: R$ 50
    Host->>FE: Estadia mínima: 2 noites
    Host->>FE: Estadia máxima: 30 noites
    
    FE->>FE: Calcula exemplo de reserva<br/>(3 noites = R$ 800)
    
    Host->>FE: Próxima etapa

    Note over Host,FE: ETAPA 7: Políticas

    FE->>Host: Wizard - Etapa 7: Políticas
    Host->>FE: Política cancelamento: Moderada
    Host->>FE: Check-in: 15:00
    Host->>FE: Check-out: 11:00
    Host->>FE: Regras da casa:<br/>☑ Não fumar<br/>☐ Pets permitidos<br/>☐ Festas permitidas
    Host->>FE: Reserva instantânea: Sim
    Host->>FE: Próxima etapa

    Note over Host,FE: ETAPA 8: Revisão e Publicação

    FE->>Host: Wizard - Etapa 8: Revisão
    FE->>Host: Exibe preview completo do anúncio
    
    Host->>FE: Clica "Publicar anúncio"
    
    FE->>GW: POST /properties<br/>{...todos os dados...}
    GW->>PROP: Valida dados completos
    
    PROP->>PROP: Validações:<br/>- Mínimo 3 fotos ✓<br/>- Endereço geocodificado ✓<br/>- Preço > 0 ✓<br/>- Descrição >= 50 chars ✓
    
    PROP->>DB: BEGIN TRANSACTION
    PROP->>DB: INSERT INTO properties<br/>(host_id, status='pending_approval', ...)
    DB-->>PROP: property_id
    
    PROP->>DB: INSERT INTO addresses<br/>(property_id, ...)
    
    PROP->>DB: INSERT INTO property_photos<br/>(property_id, ...)
    
    PROP->>DB: INSERT INTO property_amenities<br/>(property_id, amenity_id)
    
    PROP->>DB: COMMIT
    
    PROP->>QUEUE: Publish event:<br/>PROPERTY_CREATED<br/>{propertyId, hostId}
    
    PROP-->>GW: 201 Created<br/>{property}
    GW-->>FE: Success
    
    FE->>Host: "Anúncio criado!<br/>Aguarde aprovação (até 24h)"
    
    Note over QUEUE,NOTIF: Processamento Assíncrono
    
    QUEUE->>NOTIF: Consume event
    NOTIF->>Host: Email: "Anúncio em análise"
    NOTIF->>Host: Push: "Seu anúncio está em análise"
```

#### Regras de Negócio - Criação de Propriedade

| ID | Regra | Tipo | Severidade |
|----|-------|------|------------|
| RN-PROP-01 | Mínimo 3 fotos obrigatórias para publicar | Validação | Crítica |
| RN-PROP-02 | Máximo 20 fotos por propriedade | Validação | Média |
| RN-PROP-03 | Fotos devem ter mínimo 1024x768 pixels | Validação | Alta |
| RN-PROP-04 | Tamanho máximo por foto: 10MB | Validação | Alta |
| RN-PROP-05 | Descrição deve ter no mínimo 50 caracteres | Validação | Alta |
| RN-PROP-06 | Título deve ter no mínimo 10 e máximo 100 caracteres | Validação | Média |
| RN-PROP-07 | Preço por noite deve ser maior que 0 | Validação | Crítica |
| RN-PROP-08 | Estadia mínima: 1-365 noites | Validação | Média |
| RN-PROP-09 | Estadia máxima >= estadia mínima | Validação | Alta |
| RN-PROP-10 | Endereço deve ser geocodificado (lat/lng válidos) | Validação | Crítica |
| RN-PROP-11 | Propriedade criada com status `pending_approval` | Negócio | Crítica |
| RN-PROP-12 | Anfitrião deve ter email verificado para criar primeira propriedade | Negócio | Alta |
| RN-PROP-13 | Max_guests deve ser >= 1 e <= 16 | Validação | Média |
| RN-PROP-14 | Check-in time deve ser antes de check-out time | Validação | Alta |

---

## F3 - BUSCA E RESERVA (HÓSPEDE)

### F3.1 - Busca por Localização e Datas

#### Descrição Detalhada

Hóspede busca propriedades disponíveis aplicando filtros diversos.

**Etapas:**
1. Hóspede acessa homepage
2. Insere localização (cidade ou coordenadas)
3. Seleciona datas de check-in e check-out
4. Informa número de hóspedes
5. (Opcional) Aplica filtros avançados (preço, comodidades, tipo)
6. Sistema busca propriedades no Elasticsearch
7. Retorna resultados paginados com mapas
8. Hóspede visualiza detalhes de propriedade específica

#### Diagrama de Sequência

```mermaid
sequenceDiagram
    actor Guest as Hóspede
    participant FE as Frontend
    participant GW as API Gateway
    participant SEARCH as Search Service
    participant ELASTIC as Elasticsearch
    participant MAPS as Google Maps API
    participant PROP as Property Service
    participant DB as Database

    Guest->>FE: Acessa homepage
    FE->>Guest: Exibe barra de busca

    Note over Guest,FE: ETAPA 1: Busca Básica

    Guest->>FE: Digita localização:<br/>"São Paulo, Brasil"
    
    FE->>MAPS: Autocomplete API<br/>(?input=São Paulo)
    MAPS-->>FE: Sugestões:<br/>- São Paulo, SP, Brazil<br/>- São Paulo, Argentina
    
    Guest->>FE: Seleciona "São Paulo, SP, Brazil"
    FE->>FE: Armazena {lat: -23.55, lng: -46.63}
    
    Guest->>FE: Seleciona datas:<br/>Check-in: 01/03/2024<br/>Check-out: 05/03/2024
    
    FE->>FE: Valida:<br/>- Check-out > Check-in ✓<br/>- Não é passado ✓<br/>- Noites = 4
    
    Guest->>FE: Número de hóspedes: 2
    Guest->>FE: Clica "Buscar"

    Note over Guest,FE: ETAPA 2: Query de Busca

    FE->>GW: GET /search?<br/>location=São Paulo, SP<br/>&checkIn=2024-03-01<br/>&checkOut=2024-03-05<br/>&guests=2<br/>&page=1&limit=20
    
    GW->>SEARCH: Processa query
    
    SEARCH->>ELASTIC: Query DSL:<br/>{<br/>  "geo_distance": {<br/>    "distance": "50km",<br/>    "location": {lat, lng}<br/>  },<br/>  "range": {<br/>    "max_guests": {"gte": 2}<br/>  },<br/>  "must": {<br/>    "status": "active"<br/>  }<br/>}
    
    Note over SEARCH,ELASTIC: Verifica disponibilidade<br/>cruzando com property_availability
    
    ELASTIC-->>SEARCH: 45 resultados<br/>(ordenados por relevância)
    
    SEARCH->>SEARCH: Calcula preço total<br/>para cada propriedade:<br/>4 noites × price_per_night<br/>+ cleaning_fee
    
    SEARCH-->>GW: {<br/>  data: [properties],<br/>  pagination: {total: 45, page: 1},<br/>  facets: {priceRanges, amenities}<br/>}
    
    GW-->>FE: Resultados
    
    FE->>Guest: Exibe grid de propriedades:<br/>- Foto de capa<br/>- Título<br/>- Preço: R$ 1.050 total<br/>- Avaliação: 4.8 ⭐ (32 reviews)<br/>- Superhost badge

    Note over Guest,FE: ETAPA 3: Aplicar Filtros

    Guest->>FE: Abre painel de filtros
    Guest->>FE: Aplica filtros:<br/>☑ Preço: R$ 200-400/noite<br/>☑ WiFi<br/>☑ Piscina<br/>☑ Apenas Superhosts<br/>☑ Reserva instantânea
    
    FE->>GW: GET /search?<br/>...<br/>&minPrice=200<br/>&maxPrice=400<br/>&amenities=wifi,pool<br/>&isSuperhost=true<br/>&instantBooking=true
    
    GW->>SEARCH: Atualiza query
    
    SEARCH->>ELASTIC: Query com filtros adicionais
    
    ELASTIC-->>SEARCH: 12 resultados
    SEARCH-->>FE: Resultados filtrados
    
    FE->>Guest: Atualiza grid:<br/>12 propriedades<br/>(+ facets atualizados)

    Note over Guest,FE: ETAPA 4: Visualizar Mapa

    Guest->>FE: Clica "Ver mapa"
    
    FE->>MAPS: Carrega Google Maps
    
    loop Para cada propriedade
        FE->>MAPS: Adiciona marker<br/>(lat, lng, priceLabel)
    end
    
    MAPS-->>Guest: Exibe mapa interativo<br/>com pins de preço
    
    Guest->>MAPS: Clica em pin
    FE->>Guest: Exibe card de preview<br/>da propriedade

    Note over Guest,FE: ETAPA 5: Ver Detalhes

    Guest->>FE: Clica em propriedade
    
    FE->>GW: GET /properties/{propertyId}
    GW->>PROP: Busca detalhes completos
    
    PROP->>DB: SELECT * FROM properties p<br/>JOIN addresses a ON ...<br/>JOIN users u ON ...<br/>WHERE p.id = ?
    
    DB-->>PROP: Dados completos
    
    PROP->>DB: SELECT * FROM property_photos<br/>WHERE property_id = ?<br/>ORDER BY display_order
    
    DB-->>PROP: Lista de fotos
    
    PROP->>DB: SELECT a.* FROM amenities a<br/>JOIN property_amenities pa ON ...<br/>WHERE pa.property_id = ?
    
    DB-->>PROP: Lista de amenities
    
    PROP->>DB: SELECT * FROM reviews<br/>WHERE property_id = ?<br/>AND is_visible = true<br/>ORDER BY created_at DESC<br/>LIMIT 10
    
    DB-->>PROP: Reviews recentes
    
    PROP-->>GW: Property completa
    GW-->>FE: Detalhes
    
    FE->>Guest: Exibe página de detalhes:<br/>- Galeria de fotos<br/>- Descrição completa<br/>- Amenities<br/>- Localização no mapa<br/>- Reviews<br/>- Perfil do anfitrião<br/>- Calendário de disponibilidade<br/>- Card de reserva (sidebar)
```

#### Regras de Negócio - Busca

| ID | Regra | Tipo | Severidade |
|----|-------|------|------------|
| RN-BUS-01 | Check-out deve ser posterior a check-in | Validação | Crítica |
| RN-BUS-02 | Não é possível buscar datas passadas | Validação | Crítica |
| RN-BUS-03 | Máximo 365 noites por reserva | Validação | Média |
| RN-BUS-04 | Apenas propriedades com status `active` aparecem | Negócio | Crítica |
| RN-BUS-05 | Propriedades sem disponibilidade nas datas são filtradas | Negócio | Crítica |
| RN-BUS-06 | Busca geográfica usa raio padrão de 50km (customizável) | Negócio | Média |
| RN-BUS-07 | Resultados ordenados por: relevância, preço, ou avaliação | Negócio | Média |
| RN-BUS-08 | Max_guests da propriedade deve ser >= número de hóspedes buscado | Validação | Alta |
| RN-BUS-09 | Facets (filtros) atualizados dinamicamente com resultados | UX | Média |

---

### F3.2 - Processo de Reserva e Pagamento

#### Descrição Detalhada

Hóspede cria reserva e efetua pagamento.

**Etapas:**
1. Hóspede seleciona datas no card de reserva
2. Sistema calcula preço total com breakdown
3. Hóspede clica "Reservar"
4. Sistema verifica disponibilidade em tempo real
5. Hóspede preenche informações de pagamento
6. Sistema cria payment intent no Stripe
7. Hóspede confirma pagamento (com 3D Secure se necessário)
8. Sistema processa pagamento
9. Sistema cria reserva com status `confirmed` (instant booking) ou `pending` (aprovação do host)
10. Sistema envia confirmações

#### Diagrama de Sequência

```mermaid
sequenceDiagram
    actor Guest as Hóspede
    participant FE as Frontend
    participant GW as API Gateway
    participant BOOK as Booking Service
    participant PAY as Payment Service
    participant STRIPE as Stripe API
    participant PROP as Property Service
    participant DB as Database
    participant QUEUE as Message Queue
    participant NOTIF as Notification Service

    Note over Guest,FE: Contexto: Hóspede na página de detalhes

    Guest->>FE: Seleciona datas no card:<br/>Check-in: 01/03<br/>Check-out: 05/03
    
    FE->>FE: Calcula:<br/>- 4 noites × R$ 250 = R$ 1.000<br/>- Taxa limpeza = R$ 50<br/>- Taxa serviço (10%) = R$ 105<br/>- Total = R$ 1.155

    FE->>Guest: Exibe breakdown de preços

    Guest->>FE: Adiciona pedidos especiais:<br/>"Check-in antecipado, se possível"
    
    Guest->>FE: Clica "Reservar"

    Note over Guest,FE: ETAPA 1: Verificar Disponibilidade

    FE->>GW: POST /bookings/check-availability
    GW->>BOOK: Verifica disponibilidade
    
    BOOK->>PROP: GET /properties/{id}/availability?<br/>checkIn=2024-03-01&checkOut=2024-03-05
    
    PROP->>DB: SELECT * FROM property_availability<br/>WHERE property_id = ?<br/>AND date BETWEEN ? AND ?<br/>AND is_available = false
    
    alt Datas indisponíveis
        DB-->>PROP: Registros de bloqueio encontrados
        PROP-->>BOOK: Não disponível
        BOOK-->>GW: 422 Unprocessable Entity
        GW-->>FE: Datas não disponíveis
        FE->>Guest: "Ops! Essas datas não estão<br/>mais disponíveis.<br/>Selecione outras datas."
    else Datas disponíveis
        DB-->>PROP: Nenhum bloqueio
        PROP-->>BOOK: Disponível
        
        BOOK->>BOOK: Valida:<br/>- Hóspede != Anfitrião ✓<br/>- Max guests ✓<br/>- Minimum nights ✓
        
        BOOK-->>GW: Disponível
        GW-->>FE: OK para prosseguir
        
        FE->>Guest: Redireciona para checkout

        Note over Guest,FE: ETAPA 2: Checkout e Pagamento

        FE->>Guest: Página de checkout:<br/>- Resumo da reserva<br/>- Breakdown de preços<br/>- Políticas de cancelamento<br/>- Formulário de pagamento

        Guest->>FE: Preenche dados do cartão:<br/>(Stripe Elements UI)
        
        Guest->>FE: Clica "Confirmar e pagar"
        
        FE->>GW: POST /bookings<br/>{<br/>  propertyId, checkIn, checkOut,<br/>  guests, specialRequests,<br/>  paymentMethodId<br/>}
        
        GW->>BOOK: Cria reserva
        
        BOOK->>DB: BEGIN TRANSACTION
        
        Note over BOOK,DB: Lock pessimista para evitar<br/>double booking
        
        BOOK->>DB: SELECT * FROM properties<br/>WHERE id = ? FOR UPDATE
        
        BOOK->>DB: INSERT INTO bookings<br/>(status='pending_payment', ...)
        
        DB-->>BOOK: booking_id
        
        BOOK->>PAY: Criar pagamento<br/>{bookingId, amount, paymentMethodId}
        
        PAY->>STRIPE: Create Payment Intent<br/>{<br/>  amount: 115500 (centavos),<br/>  currency: 'brl',<br/>  payment_method: pm_xxx,<br/>  confirm: true<br/>}
        
        alt 3D Secure Necessário
            STRIPE-->>PAY: {status: 'requires_action',<br/>client_secret: 'xxx'}
            PAY-->>BOOK: Aguardando autenticação
            BOOK-->>FE: {requiresAction: true, clientSecret}
            
            FE->>FE: Stripe.handleCardAction(clientSecret)
            FE->>Guest: Modal 3D Secure do banco
            Guest->>Guest: Confirma no app do banco
            
            Guest->>FE: Autenticação concluída
            FE->>STRIPE: Confirma payment intent
            STRIPE-->>FE: Payment succeeded
            
            FE->>GW: POST /payments/{id}/confirm
            GW->>PAY: Confirma pagamento
        end
        
        alt Pagamento Falhou
            STRIPE-->>PAY: {status: 'failed', error}
            PAY->>DB: INSERT INTO payments<br/>(status='failed', ...)
            PAY-->>BOOK: Pagamento falhou
            BOOK->>DB: UPDATE bookings<br/>SET status='cancelled'
            BOOK->>DB: ROLLBACK
            BOOK-->>FE: Erro de pagamento
            FE->>Guest: "Pagamento recusado.<br/>Verifique os dados do cartão."
        else Pagamento Sucesso
            STRIPE-->>PAY: {status: 'succeeded',<br/>charge_id: 'ch_xxx'}
            
            PAY->>DB: INSERT INTO payments<br/>(status='succeeded',<br/>stripe_payment_intent_id,<br/>amount, platform_fee,<br/>host_payout, ...)
            
            PAY-->>BOOK: Pagamento confirmado
            
            BOOK->>BOOK: Determina status final:<br/>- instant_booking = true → 'confirmed'<br/>- instant_booking = false → 'pending'
            
            BOOK->>DB: UPDATE bookings<br/>SET status='confirmed'<br/>(ou 'pending' se precisa aprovação)
            
            BOOK->>DB: INSERT INTO property_availability<br/>(datas bloqueadas,<br/>reason='booked')
            
            BOOK->>DB: COMMIT
            
            BOOK->>QUEUE: Publish:<br/>BOOKING_CREATED<br/>{bookingId, guestId, hostId}
            
            BOOK-->>GW: 201 Created {booking}
            GW-->>FE: Reserva criada
            
            FE->>Guest: Página de confirmação:<br/>"Reserva confirmada!"<br/>- Número da reserva: #12345<br/>- QR Code<br/>- Botão "Ver detalhes"
            
            Note over QUEUE,NOTIF: Notificações Assíncronas
            
            QUEUE->>NOTIF: Consume event
            NOTIF->>Guest: Email: Confirmação de reserva<br/>(com PDF anexo)
            NOTIF->>Guest: SMS: "Sua reserva foi confirmada"
            NOTIF->>Guest: Push notification
            
            alt Reserva confirmada instantaneamente
                NOTIF->>Guest: Email ao host:<br/>"Você tem uma nova reserva"
            else Reserva pendente de aprovação
                NOTIF->>Guest: Email ao host:<br/>"Nova solicitação de reserva"
                NOTIF->>Guest: Email ao hóspede:<br/>"Aguarde aprovação do anfitrião<br/>(até 24h)"
            end
        end
    end
```

#### Regras de Negócio - Reserva e Pagamento

| ID | Regra | Tipo | Severidade |
|----|-------|------|------------|
| RN-RES-01 | Hóspede não pode reservar própria propriedade | Validação | Crítica |
| RN-RES-02 | Double-booking prevenido via lock pessimista na transação | Segurança | Crítica |
| RN-RES-03 | Pagamento processado antes de criar reserva final | Negócio | Crítica |
| RN-RES-04 | Reserva com `instant_booking=true` confirma automaticamente | Negócio | Alta |
| RN-RES-05 | Reserva sem instant booking fica `pending` até aprovação do host | Negócio | Alta |
| RN-RES-06 | Host tem 24h para aprovar/rejeitar reserva pendente | Negócio | Alta |
| RN-RES-07 | Após 24h sem resposta, reserva é auto-cancelada e hóspede reembolsado | Negócio | Alta |
| RN-RES-08 | Taxa de serviço da plataforma: 10% do valor total | Negócio | Alta |
| RN-RES-09 | Pagamento ao host liberado 24h após check-in | Negócio | Crítica |
| RN-RES-10 | Datas da reserva são bloqueadas em `property_availability` | Negócio | Crítica |
| RN-RES-11 | 3D Secure obrigatório para pagamentos > R$ 500 (configurável) | Segurança | Alta |
| RN-RES-12 | Hóspede deve ter método de pagamento válido cadastrado | Validação | Crítica |

---

## F4 - GESTÃO DE RESERVA

### F4.1 - Aprovação pelo Anfitrião

#### Descrição Detalhada

Anfitrião aprova ou rejeita solicitação de reserva.

#### Diagrama de Sequência

```mermaid
sequenceDiagram
    actor Host as Anfitrião
    participant FE as Frontend
    participant GW as API Gateway
    participant BOOK as Booking Service
    participant PAY as Payment Service
    participant DB as Database
    participant QUEUE as Message Queue
    participant NOTIF as Notification Service

    Note over Host,FE: Contexto: Reserva pendente criada

    NOTIF->>Host: Email + Push:<br/>"Nova solicitação de reserva"
    
    Host->>FE: Abre app/email
    Host->>FE: Acessa "Reservas pendentes"
    
    FE->>GW: GET /bookings/my-reservations?<br/>status=pending
    GW->>BOOK: Lista reservas pendentes
    BOOK->>DB: SELECT * FROM bookings<br/>WHERE host_id = ?<br/>AND status = 'pending'<br/>ORDER BY created_at DESC
    DB-->>BOOK: Lista de reservas
    BOOK-->>FE: Reservas pendentes
    
    FE->>Host: Exibe lista:<br/>- #12345 | João Silva<br/>- 01-05/03 (4 noites)<br/>- R$ 1.155<br/>- "Solicitado há 2h"<br/>- [Aprovar] [Rejeitar]

    Host->>FE: Clica em reserva #12345
    
    FE->>GW: GET /bookings/{bookingId}
    GW->>BOOK: Detalhes da reserva
    BOOK->>DB: SELECT * FROM bookings<br/>JOIN users ON ...<br/>WHERE id = ?
    DB-->>BOOK: Dados completos
    BOOK-->>FE: Detalhes
    
    FE->>Host: Exibe detalhes:<br/>- Perfil do hóspede<br/>- Datas<br/>- Número de hóspedes<br/>- Pedidos especiais<br/>- Histórico de avaliações do hóspede<br/>- Método de pagamento confirmado ✓

    alt Host Aprova
        Host->>FE: Clica "Aprovar reserva"
        
        FE->>GW: POST /bookings/{bookingId}/approve
        GW->>BOOK: Aprova reserva
        
        BOOK->>DB: SELECT status FROM bookings<br/>WHERE id = ? FOR UPDATE
        
        alt Reserva não está mais pendente
            DB-->>BOOK: status = 'cancelled'
            BOOK-->>FE: 422 - Reserva já cancelada
            FE->>Host: "Esta reserva foi cancelada<br/>pelo hóspede."
        else Reserva ainda pendente
            DB-->>BOOK: status = 'pending'
            
            BOOK->>DB: UPDATE bookings<br/>SET status = 'confirmed',<br/>updated_at = NOW()
            
            BOOK->>QUEUE: Publish:<br/>BOOKING_CONFIRMED<br/>{bookingId, guestId, hostId}
            
            BOOK-->>FE: 200 OK
            FE->>Host: "Reserva aprovada!<br/>O hóspede foi notificado."
            
            QUEUE->>NOTIF: Consume event
            NOTIF->>Host: Email: "Você tem uma nova reserva confirmada"
            NOTIF->>Guest: Email: "Sua reserva foi aprovada!"
            NOTIF->>Guest: Push: "Reserva confirmada ✓"
        end
        
    else Host Rejeita
        Host->>FE: Clica "Rejeitar reserva"
        FE->>Host: Modal: "Por que rejeitar?"<br/>- Datas não disponíveis<br/>- Manutenção programada<br/>- Outro (campo de texto)
        
        Host->>FE: Seleciona motivo + escreve justificativa
        Host->>FE: Clica "Confirmar rejeição"
        
        FE->>GW: POST /bookings/{bookingId}/reject<br/>{reason: "Manutenção programada"}
        GW->>BOOK: Rejeita reserva
        
        BOOK->>DB: BEGIN TRANSACTION
        
        BOOK->>DB: UPDATE bookings<br/>SET status = 'cancelled',<br/>cancelled_by = 'host',<br/>cancellation_reason = ?
        
        BOOK->>DB: DELETE FROM property_availability<br/>WHERE property_id = ?<br/>AND date BETWEEN ? AND ?<br/>AND blocked_reason = 'booked'
        
        BOOK->>PAY: Reembolsar hóspede (100%)
        
        PAY->>DB: SELECT * FROM payments<br/>WHERE booking_id = ?
        DB-->>PAY: {stripe_payment_intent_id, amount}
        
        PAY->>STRIPE: Create Refund<br/>{payment_intent: pi_xxx,<br/>amount: 115500}
        STRIPE-->>PAY: Refund created
        
        PAY->>DB: UPDATE payments<br/>SET refund_amount = amount,<br/>refund_reason = 'host_rejected',<br/>refunded_at = NOW()
        
        BOOK->>DB: COMMIT
        
        BOOK->>QUEUE: Publish:<br/>BOOKING_REJECTED<br/>{bookingId, reason}
        
        BOOK-->>FE: 200 OK
        FE->>Host: "Reserva rejeitada.<br/>O hóspede foi reembolsado."
        
        QUEUE->>NOTIF: Consume event
        NOTIF->>Guest: Email: "Sua reserva foi rejeitada"<br/>(com motivo e reembolso confirmado)
        NOTIF->>Guest: Push: "Reserva rejeitada"
        
        Note over BOOK: Host com alta taxa de rejeição<br/>perde benefícios de Superhost
    end
```

#### Regras de Negócio - Aprovação

| ID | Regra | Tipo | Severidade |
|----|-------|------|------------|
| RN-APR-01 | Host tem 24h para aprovar/rejeitar (senão auto-cancela) | Negócio | Crítica |
| RN-APR-02 | Rejeição resulta em reembolso 100% ao hóspede | Negócio | Crítica |
| RN-APR-03 | Taxa de rejeição > 10% impacta status de Superhost | Negócio | Média |
| RN-APR-04 | Host deve fornecer motivo ao rejeitar | Validação | Alta |
| RN-APR-05 | Aprovação libera datas definitivamente (bloqueio permanece) | Negócio | Crítica |

---

### F4.2 - Cancelamento de Reserva

#### Descrição Detalhada

Hóspede ou anfitrião cancela reserva, reembolso calculado conforme política.

#### Diagrama de Sequência

```mermaid
sequenceDiagram
    actor User as Hóspede/Anfitrião
    participant FE as Frontend
    participant GW as API Gateway
    participant BOOK as Booking Service
    participant PAY as Payment Service
    participant STRIPE as Stripe API
    participant DB as Database
    participant QUEUE as Message Queue
    participant NOTIF as Notification Service

    User->>FE: Acessa "Minhas reservas"
    FE->>GW: GET /bookings/my-trips<br/>(ou /my-reservations se host)
    GW->>BOOK: Lista reservas
    BOOK->>DB: SELECT * FROM bookings<br/>WHERE guest_id = ?<br/>AND status IN ('confirmed', 'pending')
    DB-->>BOOK: Lista de reservas
    BOOK-->>FE: Reservas
    FE->>User: Exibe lista de reservas

    User->>FE: Clica em reserva #12345
    FE->>User: Exibe detalhes da reserva
    User->>FE: Clica "Cancelar reserva"

    FE->>User: Modal de confirmação:<br/>"Tem certeza?"<br/>+ Calculadora de reembolso

    FE->>GW: GET /bookings/{bookingId}/cancellation-estimate
    GW->>BOOK: Calcula reembolso
    
    BOOK->>DB: SELECT cancellation_policy,<br/>check_in_date, total_price<br/>FROM bookings b<br/>JOIN properties p ON ...<br/>WHERE b.id = ?
    
    DB-->>BOOK: {policy: 'moderate',<br/>checkIn: '2024-03-01',<br/>total: 1155}
    
    BOOK->>BOOK: Aplica política de cancelamento:<br/><br/>FLEXIBLE:<br/>- > 24h antes: 100% reembolso<br/>- < 24h: sem reembolso<br/><br/>MODERATE:<br/>- > 5 dias antes: 100%<br/>- 2-5 dias: 50%<br/>- < 2 dias: sem reembolso<br/><br/>STRICT:<br/>- > 14 dias: 50%<br/>- < 14 dias: sem reembolso
    
    Note over BOOK: Exemplo: Hoje 20/02, check-in 01/03<br/>= 9 dias antes<br/>Policy: moderate → 100% reembolso
    
    BOOK-->>FE: {refundAmount: 1155,<br/>refundPercentage: 100,<br/>policy: 'moderate'}
    
    FE->>User: "Você receberá R$ 1.155 de volta<br/>(100% do valor pago)<br/>conforme política moderada"

    User->>FE: Insere motivo do cancelamento<br/>(opcional mas recomendado)
    User->>FE: Clica "Confirmar cancelamento"

    FE->>GW: POST /bookings/{bookingId}/cancel<br/>{reason: "Mudança de planos"}
    GW->>BOOK: Processa cancelamento
    
    BOOK->>DB: BEGIN TRANSACTION
    
    BOOK->>DB: SELECT status, check_in_date<br/>FROM bookings<br/>WHERE id = ? FOR UPDATE
    
    alt Check-in já passou
        DB-->>BOOK: check_in_date < NOW()
        BOOK-->>FE: 422 - Não pode cancelar<br/>após check-in
        FE->>User: "Não é possível cancelar<br/>após o check-in."
    else Antes do check-in
        DB-->>BOOK: Reserva válida para cancelamento
        
        BOOK->>DB: UPDATE bookings<br/>SET status = 'cancelled',<br/>cancelled_by = 'guest',<br/>cancellation_reason = ?,<br/>cancelled_at = NOW()
        
        BOOK->>DB: DELETE FROM property_availability<br/>WHERE property_id = ?<br/>AND date BETWEEN ? AND ?<br/>AND blocked_reason = 'booked'
        
        alt Reembolso aplicável (> 0%)
            BOOK->>PAY: Processar reembolso<br/>{bookingId, amount: 1155}
            
            PAY->>DB: SELECT stripe_payment_intent_id<br/>FROM payments<br/>WHERE booking_id = ?
            DB-->>PAY: pi_xxx
            
            PAY->>STRIPE: Create Refund<br/>{payment_intent: pi_xxx,<br/>amount: 115500}
            
            STRIPE-->>PAY: {id: re_xxx,<br/>status: 'succeeded'}
            
            PAY->>DB: UPDATE payments<br/>SET refund_amount = ?,<br/>refund_reason = 'guest_cancelled',<br/>refunded_at = NOW()
            
            PAY-->>BOOK: Reembolso processado
        else Sem reembolso (0%)
            BOOK->>PAY: Nenhum reembolso aplicável
            PAY->>DB: UPDATE payments<br/>SET refund_amount = 0
        end
        
        BOOK->>DB: COMMIT
        
        BOOK->>QUEUE: Publish:<br/>BOOKING_CANCELLED<br/>{bookingId, cancelledBy, refundAmount}
        
        BOOK-->>FE: 200 OK<br/>{message: "Reserva cancelada",<br/>refundAmount: 1155}
        
        FE->>User: "Reserva cancelada com sucesso.<br/>Reembolso de R$ 1.155<br/>em 5-10 dias úteis."
        
        QUEUE->>NOTIF: Consume event
        
        alt Cancelado por hóspede
            NOTIF->>User: Email ao hóspede:<br/>"Cancelamento confirmado"<br/>(com detalhes do reembolso)
            NOTIF->>User: Email ao host:<br/>"Reserva #12345 foi cancelada<br/>pelo hóspede"
        else Cancelado por host
            NOTIF->>User: Email ao hóspede:<br/>"O anfitrião cancelou sua reserva"<br/>(com reembolso 100%)
            NOTIF->>User: Email ao host:<br/>"Você cancelou reserva #12345"
            
            Note over BOOK: Penalidade para host:<br/>- Taxa de cancelamento aumenta<br/>- Pode perder Superhost<br/>- Propriedade pode ser pausada
        end
    end
```

#### Regras de Negócio - Cancelamento

| ID | Regra | Tipo | Severidade |
|----|-------|------|------------|
| RN-CAN-01 | Cancelamento após check-in não é permitido | Negócio | Crítica |
| RN-CAN-02 | Política de cancelamento definida pelo anfitrião (flexible, moderate, strict) | Negócio | Crítica |
| RN-CAN-03 | Reembolso calculado baseado em dias até check-in e política | Negócio | Crítica |
| RN-CAN-04 | Hóspede sempre pode cancelar, mas reembolso varia | Negócio | Alta |
| RN-CAN-05 | Host que cancela após aprovação é penalizado (taxa + possível suspensão) | Negócio | Crítica |
| RN-CAN-06 | Cancelamento por host resulta em reembolso 100% ao hóspede | Negócio | Crítica |
| RN-CAN-07 | Taxa de cancelamento de host > 10% pode resultar em pausa da propriedade | Negócio | Alta |
| RN-CAN-08 | Datas bloqueadas são liberadas após cancelamento | Negócio | Crítica |
| RN-CAN-09 | Reembolso processado em até 10 dias úteis | SLA | Média |

---

## F5 - AVALIAÇÃO

### F5.1 - Hóspede Avalia Acomodação

#### Descrição Detalhada

Após check-out, hóspede pode avaliar propriedade e anfitrião.

**Etapas:**
1. Sistema envia email/push 1 dia após check-out
2. Hóspede acessa formulário de avaliação
3. Hóspede avalia:
   - Nota geral (1-5 estrelas)
   - Categorias específicas (limpeza, precisão, comunicação, localização, custo-benefício)
   - Comentário escrito
4. Sistema valida (comentário mínimo)
5. Avaliação fica "pendente" até anfitrião também avaliar (ou 14 dias)
6. Publicação simultânea (bilateral)

#### Diagrama de Sequência

```mermaid
sequenceDiagram
    actor Guest as Hóspede
    participant FE as Frontend
    participant GW as API Gateway
    participant REV as Review Service
    participant BOOK as Booking Service
    participant PROP as Property Service
    participant DB as Database
    participant QUEUE as Message Queue
    participant NOTIF as Notification Service

    Note over Guest,NOTIF: Contexto: 1 dia após check-out

    QUEUE->>NOTIF: Job agendado:<br/>REVIEW_REMINDER<br/>{bookingId, guestId}
    
    NOTIF->>Guest: Email: "Como foi sua estadia?"<br/>+ Push notification
    
    Guest->>FE: Clica no link do email
    FE->>GW: GET /bookings/{bookingId}/review-form
    GW->>REV: Verificar elegibilidade
    
    REV->>DB: SELECT * FROM bookings<br/>WHERE id = ?<br/>AND guest_id = ?<br/>AND status = 'completed'
    
    alt Reserva não elegível
        DB-->>REV: Nenhum registro ou status != completed
        REV-->>FE: 403 - Não elegível para avaliar
        FE->>Guest: "Você só pode avaliar<br/>após concluir a estadia."
    else Já avaliou
        REV->>DB: SELECT * FROM reviews<br/>WHERE booking_id = ?<br/>AND reviewer_id = ?<br/>AND review_type = 'property_review'
        DB-->>REV: Review já existe
        REV-->>FE: 409 - Já avaliou
        FE->>Guest: "Você já avaliou esta estadia."
    else Elegível
        DB-->>REV: Reserva válida, não avaliada
        REV-->>FE: Formulário de avaliação
        
        FE->>Guest: Exibe formulário:<br/><br/>📊 Avalie sua experiência<br/><br/>⭐ Nota geral: [1-5 estrelas]<br/><br/>Categorias:<br/>- Limpeza: [1-5]<br/>- Precisão: [1-5]<br/>- Comunicação: [1-5]<br/>- Localização: [1-5]<br/>- Custo-benefício: [1-5]<br/><br/>💬 Comentário:<br/>[textarea, min 10 chars]

        Guest->>FE: Preenche avaliação:<br/>- Geral: ⭐⭐⭐⭐⭐ (5)<br/>- Limpeza: 5<br/>- Precisão: 5<br/>- Comunicação: 5<br/>- Localização: 4<br/>- Valor: 5<br/>- Comentário: "Lugar incrível!<br/>Tudo impecável e o anfitrião<br/>foi super atencioso."

        Guest->>FE: Clica "Enviar avaliação"
        
        FE->>GW: POST /reviews<br/>{<br/>  bookingId: xxx,<br/>  reviewType: 'property_review',<br/>  rating: 5,<br/>  cleanlinessRating: 5,<br/>  accuracyRating: 5,<br/>  communicationRating: 5,<br/>  locationRating: 4,<br/>  valueRating: 5,<br/>  comment: "Lugar incrível!..."<br/>}
        
        GW->>REV: Cria avaliação
        
        REV->>REV: Valida:<br/>- Rating entre 1-5 ✓<br/>- Comentário >= 10 chars ✓<br/>- Booking existe ✓<br/>- Não avaliou antes ✓
        
        REV->>DB: BEGIN TRANSACTION
        
        REV->>DB: INSERT INTO reviews<br/>(booking_id, reviewer_id,<br/>reviewee_id, property_id,<br/>review_type, rating, ...,<br/>moderation_status='pending')
        
        DB-->>REV: review_id
        
        REV->>DB: SELECT * FROM reviews<br/>WHERE booking_id = ?<br/>AND review_type = 'guest_review'
        
        alt Anfitrião ainda não avaliou
            DB-->>REV: Nenhum review de hóspede
            
            Note over REV: Avaliação fica "pendente"<br/>até anfitrião avaliar também<br/>ou 14 dias passarem
            
            REV->>DB: COMMIT
            REV-->>FE: 201 Created<br/>{status: 'pending'}
            FE->>Guest: "Avaliação enviada!<br/>Será publicada quando o<br/>anfitrião também avaliar<br/>(ou em 14 dias)."
            
            REV->>QUEUE: Publish:<br/>REVIEW_SUBMITTED<br/>{reviewId, bookingId}
            
            QUEUE->>NOTIF: Consume event
            NOTIF->>Host: Email: "O hóspede avaliou<br/>a estadia. Avalie você também!"
            
        else Anfitrião já avaliou
            DB-->>REV: Guest review existe
            
            Note over REV: Publicação bilateral simultânea
            
            REV->>DB: UPDATE reviews<br/>SET moderation_status = 'approved'<br/>WHERE booking_id = ?<br/>AND review_type IN<br/>('property_review', 'guest_review')
            
            REV->>PROP: Atualizar média da propriedade
            
            PROP->>DB: SELECT AVG(rating),<br/>COUNT(*) FROM reviews<br/>WHERE property_id = ?<br/>AND review_type = 'property_review'<br/>AND is_visible = true
            
            DB-->>PROP: {avg: 4.8, count: 33}
            
            PROP->>DB: UPDATE properties<br/>SET average_rating = 4.8,<br/>total_reviews = 33<br/>WHERE id = ?
            
            REV->>DB: COMMIT
            REV-->>FE: 201 Created<br/>{status: 'published'}
            FE->>Guest: "Avaliação publicada!<br/>Obrigado pelo feedback."
            
            REV->>QUEUE: Publish:<br/>REVIEWS_PUBLISHED<br/>{bookingId, propertyId}
            
            QUEUE->>NOTIF: Consume event
            NOTIF->>Guest: Email: "Veja a avaliação<br/>que o anfitrião deixou"
            NOTIF->>Host: Email: "Veja a avaliação<br/>que o hóspede deixou"
        end
    end
```

#### Regras de Negócio - Avaliação

| ID | Regra | Tipo | Severidade |
|----|-------|------|------------|
| RN-AVA-01 | Hóspede só pode avaliar após check-out (status `completed`) | Negócio | Crítica |
| RN-AVA-02 | Prazo para avaliar: 14 dias após check-out | Negócio | Alta |
| RN-AVA-03 | Avaliações são publicadas de forma bilateral simultânea | Negócio | Crítica |
| RN-AVA-04 | Se uma parte não avaliar em 14 dias, avaliação da outra é publicada | Negócio | Alta |
| RN-AVA-05 | Comentário deve ter no mínimo 10 caracteres | Validação | Média |
| RN-AVA-06 | Ratings devem estar entre 1-5 estrelas | Validação | Crítica |
| RN-AVA-07 | Hóspede pode editar avaliação em até 48h após envio (antes de publicar) | Negócio | Média |
| RN-AVA-08 | Avaliações passam por moderação automática (filtro de palavrões, spam) | Segurança | Alta |
| RN-AVA-09 | Average_rating da propriedade atualizado automaticamente | Negócio | Crítica |
| RN-AVA-10 | Anfitrião pode responder avaliação publicamente | Negócio | Média |

---

## Resumo de Fluxos Documentados

| Fluxo | Subfluxos | Diagrams | Regras de Negócio |
|-------|-----------|----------|-------------------|
| **F1 - Autenticação** | 4 (Registro, Login, Recuperação, Verificação) | 4 diagramas | 27 regras |
| **F2 - Cadastro de Propriedade** | 1 (Wizard completo) | 1 diagrama | 14 regras |
| **F3 - Busca e Reserva** | 2 (Busca, Pagamento) | 2 diagramas | 21 regras |
| **F4 - Gestão de Reserva** | 2 (Aprovação, Cancelamento) | 2 diagramas | 14 regras |
| **F5 - Avaliação** | 1 (Hóspede avalia) | 1 diagrama | 10 regras |
| **TOTAL** | **10 subfluxos** | **10 diagramas** | **86 regras de negócio** |

---

## Pontos Críticos de Atenção

### 🔐 Segurança
- Todas as senhas hasheadas com bcrypt (cost 12)
- Tokens JWT com expiração curta (15min access, 7d refresh)
- 3D Secure obrigatório para pagamentos altos
- Rate limiting em endpoints sensíveis (login, reset password)
- Mensagens genéricas de erro (evitar enumeração de emails)

### 🔄 Concorrência
- Lock pessimista (`FOR UPDATE`) em reservas para evitar double-booking
- Transações ACID garantindo consistência
- Verificação de disponibilidade em tempo real antes de confirmar

### 💰 Financeiro
- Payment intent criado antes de reserva final
- Reembolsos automáticos conforme política
- Pagamento ao host liberado 24h após check-in
- Auditoria completa de todas as transações

### 📧 Notificações
- Processamento assíncrono via filas (não bloqueia resposta)
- Múltiplos canais (email, SMS, push)
- Templates transacionais profissionais
- Retry automático em caso de falha

### 📊 Observabilidade
- Logs estruturados em todas as etapas críticas
- Eventos publicados em message queue para auditoria
- Métricas de conversão em cada etapa do funil
- Alertas para anomalias (muitas rejeições, falhas de pagamento)

Esta documentação serve como blueprint completo para implementação, testes e onboarding de desenvolvedores.