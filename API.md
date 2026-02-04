# Documentação da API REST - Sistema de Aluguel de Acomodações

## Convenções Gerais

### Base URL
```
https://api.exemplo.com/v1
```

### Autenticação
- **Bearer Token (JWT)**: Header `Authorization: Bearer {token}`
- **Roles**: `guest`, `host`, `admin`, `moderator`, `support`

### Paginação Padrão
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Códigos de Status HTTP
- `200 OK` - Sucesso em operações de leitura
- `201 Created` - Recurso criado com sucesso
- `204 No Content` - Sucesso em operações de exclusão
- `400 Bad Request` - Dados inválidos ou malformados
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão para a ação
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: reserva sobreposta)
- `422 Unprocessable Entity` - Validação de negócio falhou
- `500 Internal Server Error` - Erro no servidor

---

## 1. AUTENTICAÇÃO E AUTORIZAÇÃO (`/auth`)

### 1.1 Registro de Usuário

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/auth/register` |
| **Descrição** | Registra um novo usuário na plataforma |
| **Autenticação** | Público |
| **Body** | ```json<br>{<br>  "email": "user@example.com",<br>  "password": "SecurePass123!",<br>  "firstName": "João",<br>  "lastName": "Silva",<br>  "phone": "+5511999999999",<br>  "dateOfBirth": "1990-05-15",<br>  "role": "guest"<br>}<br>``` |
| **Resposta 201** | ```json<br>{<br>  "user": {<br>    "id": "uuid",<br>    "email": "user@example.com",<br>    "firstName": "João",<br>    "role": "guest"<br>  },<br>  "accessToken": "jwt_token",<br>  "refreshToken": "refresh_token"<br>}<br>``` |
| **Erros** | `400` - Dados inválidos<br>`409` - Email já cadastrado |

---

### 1.2 Login

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/auth/login` |
| **Descrição** | Autentica usuário e retorna tokens JWT |
| **Autenticação** | Público |
| **Body** | ```json<br>{<br>  "email": "user@example.com",<br>  "password": "SecurePass123!"<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "user": {<br>    "id": "uuid",<br>    "email": "user@example.com",<br>    "firstName": "João",<br>    "role": "guest"<br>  },<br>  "accessToken": "jwt_token",<br>  "refreshToken": "refresh_token",<br>  "expiresIn": 900<br>}<br>``` |
| **Erros** | `400` - Dados inválidos<br>`401` - Credenciais incorretas<br>`403` - Conta suspensa/banida |

---

### 1.3 Refresh Token

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/auth/refresh` |
| **Descrição** | Renova o access token usando refresh token |
| **Autenticação** | Público |
| **Body** | ```json<br>{<br>  "refreshToken": "refresh_token"<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "accessToken": "new_jwt_token",<br>  "expiresIn": 900<br>}<br>``` |
| **Erros** | `401` - Refresh token inválido/expirado |

---

### 1.4 Logout

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/auth/logout` |
| **Descrição** | Invalida o refresh token atual |
| **Autenticação** | Autenticado |
| **Body** | ```json<br>{<br>  "refreshToken": "refresh_token"<br>}<br>``` |
| **Resposta 204** | Sem conteúdo |
| **Erros** | `401` - Não autenticado |

---

### 1.5 Esqueci Minha Senha

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/auth/forgot-password` |
| **Descrição** | Envia email com link para redefinir senha |
| **Autenticação** | Público |
| **Body** | ```json<br>{<br>  "email": "user@example.com"<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Email de recuperação enviado"<br>}<br>``` |
| **Erros** | `400` - Email inválido |

---

### 1.6 Redefinir Senha

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/auth/reset-password` |
| **Descrição** | Redefine a senha usando token do email |
| **Autenticação** | Público |
| **Body** | ```json<br>{<br>  "token": "reset_token",<br>  "newPassword": "NewSecurePass123!"<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Senha redefinida com sucesso"<br>}<br>``` |
| **Erros** | `400` - Token inválido/expirado<br>`422` - Senha não atende requisitos |

---

## 2. USUÁRIOS (`/users`)

### 2.1 Obter Perfil Atual

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/users/me` |
| **Descrição** | Retorna dados do usuário autenticado |
| **Autenticação** | Autenticado |
| **Resposta 200** | ```json<br>{<br>  "id": "uuid",<br>  "email": "user@example.com",<br>  "firstName": "João",<br>  "lastName": "Silva",<br>  "phone": "+5511999999999",<br>  "profilePhotoUrl": "https://cdn.example.com/photo.jpg",<br>  "bio": "Texto da bio",<br>  "language": "pt-BR",<br>  "currency": "BRL",<br>  "role": "guest",<br>  "isEmailVerified": true,<br>  "isPhoneVerified": true,<br>  "isIdentityVerified": false,<br>  "isSuperhost": false,<br>  "createdAt": "2024-01-15T10:30:00Z"<br>}<br>``` |
| **Erros** | `401` - Não autenticado |

---

### 2.2 Atualizar Perfil

| Atributo | Valor |
|----------|-------|
| **Método** | `PATCH` |
| **Rota** | `/users/me` |
| **Descrição** | Atualiza dados do perfil do usuário |
| **Autenticação** | Autenticado |
| **Body** | ```json<br>{<br>  "firstName": "João",<br>  "lastName": "Silva",<br>  "bio": "Nova bio",<br>  "language": "pt-BR",<br>  "currency": "BRL",<br>  "phone": "+5511999999999"<br>}<br>``` |
| **Resposta 200** | Objeto do usuário atualizado |
| **Erros** | `400` - Dados inválidos<br>`401` - Não autenticado |

---

### 2.3 Upload de Foto de Perfil

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/users/me/profile-photo` |
| **Descrição** | Faz upload da foto de perfil |
| **Autenticação** | Autenticado |
| **Body** | `multipart/form-data`<br>`photo: File (max 5MB, jpg/png)` |
| **Resposta 200** | ```json<br>{<br>  "profilePhotoUrl": "https://cdn.example.com/uuid.jpg"<br>}<br>``` |
| **Erros** | `400` - Arquivo inválido<br>`413` - Arquivo muito grande |

---

### 2.4 Obter Perfil Público de Usuário

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/users/{userId}` |
| **Descrição** | Retorna dados públicos de um usuário |
| **Autenticação** | Público |
| **Path Params** | `userId` - UUID do usuário |
| **Resposta 200** | ```json<br>{<br>  "id": "uuid",<br>  "firstName": "João",<br>  "profilePhotoUrl": "https://cdn.example.com/photo.jpg",<br>  "bio": "Texto da bio",<br>  "isSuperhost": true,<br>  "isIdentityVerified": true,<br>  "memberSince": "2024-01-15T10:30:00Z",<br>  "reviewsReceived": 45,<br>  "averageRating": 4.8<br>}<br>``` |
| **Erros** | `404` - Usuário não encontrado |

---

### 2.5 Verificar Email

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/users/me/verify-email` |
| **Descrição** | Verifica email usando código enviado |
| **Autenticação** | Autenticado |
| **Body** | ```json<br>{<br>  "code": "123456"<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Email verificado com sucesso",<br>  "isEmailVerified": true<br>}<br>``` |
| **Erros** | `400` - Código inválido/expirado |

---

### 2.6 Verificar Telefone

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/users/me/verify-phone` |
| **Descrição** | Verifica telefone usando código SMS |
| **Autenticação** | Autenticado |
| **Body** | ```json<br>{<br>  "code": "123456"<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Telefone verificado com sucesso",<br>  "isPhoneVerified": true<br>}<br>``` |
| **Erros** | `400` - Código inválido/expirado |

---

### 2.7 Submeter Verificação de Identidade

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/users/me/verify-identity` |
| **Descrição** | Envia documentos para verificação de identidade |
| **Autenticação** | Autenticado |
| **Body** | `multipart/form-data`<br>`documentType: enum (passport, drivers_license, national_id)`<br>`documentFront: File`<br>`documentBack: File` (opcional)<br>`selfie: File` |
| **Resposta 201** | ```json<br>{<br>  "verificationId": "uuid",<br>  "status": "pending",<br>  "message": "Documentos enviados para análise"<br>}<br>``` |
| **Erros** | `400` - Documentos inválidos<br>`409` - Verificação já em andamento |

---

### 2.8 Listar Usuários (Admin)

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/users` |
| **Descrição** | Lista todos os usuários (admin) |
| **Autenticação** | Admin/Moderator |
| **Query Params** | `page=1`<br>`limit=20`<br>`role=guest|host|admin`<br>`status=active|suspended|banned`<br>`search=nome ou email` |
| **Resposta 200** | ```json<br>{<br>  "data": [<br>    {<br>      "id": "uuid",<br>      "email": "user@example.com",<br>      "firstName": "João",<br>      "role": "guest",<br>      "accountStatus": "active",<br>      "createdAt": "2024-01-15T10:30:00Z"<br>    }<br>  ],<br>  "pagination": {...}<br>}<br>``` |
| **Erros** | `403` - Sem permissão |

---

### 2.9 Suspender Usuário (Admin)

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/users/{userId}/suspend` |
| **Descrição** | Suspende conta de usuário |
| **Autenticação** | Admin |
| **Path Params** | `userId` - UUID do usuário |
| **Body** | ```json<br>{<br>  "reason": "Violação dos termos de uso",<br>  "duration": 30<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Usuário suspenso com sucesso",<br>  "accountStatus": "suspended",<br>  "suspendedUntil": "2024-03-15T10:30:00Z"<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`404` - Usuário não encontrado |

---

## 3. PROPRIEDADES (`/properties`)

### 3.1 Listar Propriedades (Público)

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/properties` |
| **Descrição** | Lista propriedades ativas com filtros |
| **Autenticação** | Público |
| **Query Params** | `page=1`<br>`limit=20`<br>`city=São Paulo`<br>`country=Brazil`<br>`minPrice=100`<br>`maxPrice=500`<br>`guests=2`<br>`bedrooms=1`<br>`propertyType=apartment|house|villa`<br>`amenities=wifi,pool` (comma-separated)<br>`instantBooking=true`<br>`minRating=4.0`<br>`sortBy=price|rating|createdAt`<br>`order=asc|desc` |
| **Resposta 200** | ```json<br>{<br>  "data": [<br>    {<br>      "id": "uuid",<br>      "title": "Apartamento Aconchegante",<br>      "propertyType": "apartment",<br>      "pricePerNight": 250.00,<br>      "currency": "BRL",<br>      "maxGuests": 4,<br>      "bedrooms": 2,<br>      "bathrooms": 1,<br>      "averageRating": 4.8,<br>      "totalReviews": 32,<br>      "instantBooking": true,<br>      "coverPhoto": "https://cdn.example.com/photo1.jpg",<br>      "address": {<br>        "city": "São Paulo",<br>        "state": "SP",<br>        "country": "Brazil"<br>      },<br>      "host": {<br>        "id": "uuid",<br>        "firstName": "Maria",<br>        "isSuperhost": true<br>      }<br>    }<br>  ],<br>  "pagination": {...}<br>}<br>``` |
| **Erros** | `400` - Parâmetros inválidos |

---

### 3.2 Obter Detalhes da Propriedade

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/properties/{propertyId}` |
| **Descrição** | Retorna detalhes completos de uma propriedade |
| **Autenticação** | Público |
| **Path Params** | `propertyId` - UUID da propriedade |
| **Resposta 200** | ```json<br>{<br>  "id": "uuid",<br>  "title": "Apartamento Aconchegante",<br>  "description": "Descrição completa...",<br>  "propertyType": "apartment",<br>  "roomType": "entire_place",<br>  "maxGuests": 4,<br>  "bedrooms": 2,<br>  "beds": 3,<br>  "bathrooms": 1.5,<br>  "pricePerNight": 250.00,<br>  "cleaningFee": 50.00,<br>  "currency": "BRL",<br>  "minimumNights": 2,<br>  "maximumNights": 30,<br>  "checkInTime": "15:00",<br>  "checkOutTime": "11:00",<br>  "cancellationPolicy": "moderate",<br>  "instantBooking": true,<br>  "averageRating": 4.8,<br>  "totalReviews": 32,<br>  "amenities": [<br>    {"id": "uuid", "name": "WiFi", "category": "basic"},<br>    {"id": "uuid", "name": "Pool", "category": "outdoor"}<br>  ],<br>  "photos": [<br>    {<br>      "id": "uuid",<br>      "url": "https://cdn.example.com/photo1.jpg",<br>      "isCover": true<br>    }<br>  ],<br>  "address": {<br>    "streetAddress": "Rua Exemplo, 123",<br>    "city": "São Paulo",<br>    "state": "SP",<br>    "country": "Brazil",<br>    "latitude": -23.550520,<br>    "longitude": -46.633308<br>  },<br>  "host": {<br>    "id": "uuid",<br>    "firstName": "Maria",<br>    "profilePhotoUrl": "https://cdn.example.com/host.jpg",<br>    "bio": "Anfitriã experiente...",<br>    "isSuperhost": true,<br>    "memberSince": "2020-05-10T00:00:00Z"<br>  },<br>  "createdAt": "2024-01-15T10:30:00Z"<br>}<br>``` |
| **Erros** | `404` - Propriedade não encontrada |

---

### 3.3 Criar Propriedade

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/properties` |
| **Descrição** | Cria uma nova propriedade (anfitrião) |
| **Autenticação** | Host |
| **Body** | ```json<br>{<br>  "title": "Apartamento Aconchegante",<br>  "description": "Descrição completa...",<br>  "propertyType": "apartment",<br>  "roomType": "entire_place",<br>  "maxGuests": 4,<br>  "bedrooms": 2,<br>  "beds": 3,<br>  "bathrooms": 1.5,<br>  "pricePerNight": 250.00,<br>  "cleaningFee": 50.00,<br>  "currency": "BRL",<br>  "minimumNights": 2,<br>  "maximumNights": 30,<br>  "checkInTime": "15:00",<br>  "checkOutTime": "11:00",<br>  "cancellationPolicy": "moderate",<br>  "instantBooking": true,<br>  "amenityIds": ["uuid1", "uuid2"],<br>  "address": {<br>    "streetAddress": "Rua Exemplo, 123",<br>    "city": "São Paulo",<br>    "state": "SP",<br>    "country": "Brazil",<br>    "postalCode": "01310-100"<br>  }<br>}<br>``` |
| **Resposta 201** | Objeto da propriedade criada |
| **Erros** | `400` - Dados inválidos<br>`403` - Usuário não é host<br>`422` - Validação falhou |

---

### 3.4 Atualizar Propriedade

| Atributo | Valor |
|----------|-------|
| **Método** | `PATCH` |
| **Rota** | `/properties/{propertyId}` |
| **Descrição** | Atualiza dados de uma propriedade |
| **Autenticação** | Host (próprio) / Admin |
| **Path Params** | `propertyId` - UUID da propriedade |
| **Body** | Campos parciais permitindo atualização (mesma estrutura do POST) |
| **Resposta 200** | Objeto da propriedade atualizada |
| **Erros** | `400` - Dados inválidos<br>`403` - Sem permissão<br>`404` - Propriedade não encontrada<br>`409` - Propriedade tem reservas ativas |

---

### 3.5 Deletar Propriedade (Soft Delete)

| Atributo | Valor |
|----------|-------|
| **Método** | `DELETE` |
| **Rota** | `/properties/{propertyId}` |
| **Descrição** | Remove propriedade (soft delete) |
| **Autenticação** | Host (próprio) / Admin |
| **Path Params** | `propertyId` - UUID da propriedade |
| **Resposta 204** | Sem conteúdo |
| **Erros** | `403` - Sem permissão<br>`404` - Propriedade não encontrada<br>`409` - Propriedade tem reservas ativas futuras |

---

### 3.6 Upload de Fotos

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/properties/{propertyId}/photos` |
| **Descrição** | Adiciona fotos à propriedade |
| **Autenticação** | Host (próprio) / Admin |
| **Path Params** | `propertyId` - UUID da propriedade |
| **Body** | `multipart/form-data`<br>`photos: File[]` (max 20 fotos, 10MB cada)<br>`captions: string[]` (opcional) |
| **Resposta 201** | ```json<br>{<br>  "photos": [<br>    {<br>      "id": "uuid",<br>      "url": "https://cdn.example.com/photo1.jpg",<br>      "caption": "Sala de estar",<br>      "displayOrder": 1,<br>      "isCover": false<br>    }<br>  ]<br>}<br>``` |
| **Erros** | `400` - Arquivos inválidos<br>`403` - Sem permissão<br>`413` - Arquivo muito grande |

---

### 3.7 Definir Foto de Capa

| Atributo | Valor |
|----------|-------|
| **Método** | `PATCH` |
| **Rota** | `/properties/{propertyId}/photos/{photoId}/set-cover` |
| **Descrição** | Define uma foto como capa da propriedade |
| **Autenticação** | Host (próprio) / Admin |
| **Path Params** | `propertyId` - UUID da propriedade<br>`photoId` - UUID da foto |
| **Resposta 200** | ```json<br>{<br>  "message": "Foto de capa atualizada",<br>  "photoId": "uuid"<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`404` - Foto/Propriedade não encontrada |

---

### 3.8 Deletar Foto

| Atributo | Valor |
|----------|-------|
| **Método** | `DELETE` |
| **Rota** | `/properties/{propertyId}/photos/{photoId}` |
| **Descrição** | Remove uma foto da propriedade |
| **Autenticação** | Host (próprio) / Admin |
| **Path Params** | `propertyId` - UUID da propriedade<br>`photoId` - UUID da foto |
| **Resposta 204** | Sem conteúdo |
| **Erros** | `403` - Sem permissão<br>`404` - Foto não encontrada<br>`422` - Não pode deletar única foto |

---

### 3.9 Listar Minhas Propriedades

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/properties/me` |
| **Descrição** | Lista propriedades do anfitrião autenticado |
| **Autenticação** | Host |
| **Query Params** | `page=1`<br>`limit=20`<br>`status=draft|pending_approval|active|paused` |
| **Resposta 200** | Lista paginada de propriedades |
| **Erros** | `401` - Não autenticado |

---

### 3.10 Alterar Status da Propriedade

| Atributo | Valor |
|----------|-------|
| **Método** | `PATCH` |
| **Rota** | `/properties/{propertyId}/status` |
| **Descrição** | Altera status (ativar/pausar) |
| **Autenticação** | Host (próprio) / Admin |
| **Path Params** | `propertyId` - UUID da propriedade |
| **Body** | ```json<br>{<br>  "status": "active|paused"<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Status atualizado",<br>  "status": "paused"<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`422` - Transição de status inválida |

---

### 3.11 Verificar Disponibilidade

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/properties/{propertyId}/availability` |
| **Descrição** | Verifica disponibilidade em um período |
| **Autenticação** | Público |
| **Path Params** | `propertyId` - UUID da propriedade |
| **Query Params** | `checkIn=2024-03-01`<br>`checkOut=2024-03-05` |
| **Resposta 200** | ```json<br>{<br>  "available": true,<br>  "checkInDate": "2024-03-01",<br>  "checkOutDate": "2024-03-05",<br>  "numberOfNights": 4,<br>  "pricePerNight": 250.00,<br>  "totalPrice": 1050.00,<br>  "breakdown": {<br>    "accommodation": 1000.00,<br>    "cleaningFee": 50.00,<br>    "serviceFee": 105.00,<br>    "total": 1155.00<br>  }<br>}<br>``` |
| **Erros** | `400` - Datas inválidas<br>`404` - Propriedade não encontrada<br>`422` - Período indisponível |

---

### 3.12 Bloquear Datas (Host)

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/properties/{propertyId}/block-dates` |
| **Descrição** | Bloqueia datas no calendário |
| **Autenticação** | Host (próprio) |
| **Path Params** | `propertyId` - UUID da propriedade |
| **Body** | ```json<br>{<br>  "startDate": "2024-03-01",<br>  "endDate": "2024-03-05",<br>  "reason": "maintenance"<br>}<br>``` |
| **Resposta 201** | ```json<br>{<br>  "message": "Datas bloqueadas com sucesso",<br>  "blockedDates": ["2024-03-01", "2024-03-02", ...]<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`409` - Datas já têm reservas |

---

## 4. BUSCA E DESCOBERTA (`/search`)

### 4.1 Busca Avançada

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/search` |
| **Descrição** | Busca avançada com múltiplos filtros e Elasticsearch |
| **Autenticação** | Público |
| **Query Params** | `q=texto livre` (busca em título, descrição)<br>`location=São Paulo, Brazil`<br>`latitude=-23.550520`<br>`longitude=-46.633308`<br>`radius=5` (km)<br>`checkIn=2024-03-01`<br>`checkOut=2024-03-05`<br>`guests=2`<br>`minPrice=100`<br>`maxPrice=500`<br>`bedrooms=2`<br>`bathrooms=1`<br>`propertyType=apartment,house`<br>`amenities=wifi,pool,kitchen`<br>`instantBooking=true`<br>`minRating=4.0`<br>`isSuperhost=true`<br>`sortBy=price|rating|distance|popularity`<br>`order=asc|desc`<br>`page=1`<br>`limit=20` |
| **Resposta 200** | ```json<br>{<br>  "data": [<br>    {<br>      "id": "uuid",<br>      "title": "Apartamento Aconchegante",<br>      "pricePerNight": 250.00,<br>      "distance": 2.5,<br>      "averageRating": 4.8,<br>      "totalReviews": 32,<br>      "coverPhoto": "...",<br>      "address": {...},<br>      "host": {...}<br>    }<br>  ],<br>  "pagination": {...},<br>  "facets": {<br>    "propertyTypes": {<br>      "apartment": 45,<br>      "house": 23<br>    },<br>    "priceRanges": {<br>      "0-100": 12,<br>      "100-200": 34<br>    }<br>  }<br>}<br>``` |
| **Erros** | `400` - Parâmetros inválidos |

---

### 4.2 Autocomplete de Localização

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/search/autocomplete` |
| **Descrição** | Sugestões de localização para busca |
| **Autenticação** | Público |
| **Query Params** | `q=são pa` (mínimo 3 caracteres) |
| **Resposta 200** | ```json<br>{<br>  "suggestions": [<br>    {<br>      "placeId": "ChIJXxx",<br>      "description": "São Paulo, SP, Brazil",<br>      "type": "city",<br>      "latitude": -23.550520,<br>      "longitude": -46.633308<br>    }<br>  ]<br>}<br>``` |
| **Erros** | `400` - Query muito curta |

---

### 4.3 Sugestões Personalizadas

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/search/recommendations` |
| **Descrição** | Recomendações baseadas em histórico do usuário |
| **Autenticação** | Autenticado |
| **Query Params** | `limit=10` |
| **Resposta 200** | Lista de propriedades recomendadas |
| **Erros** | `401` - Não autenticado |

---

## 5. RESERVAS (`/bookings`)

### 5.1 Criar Reserva

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/bookings` |
| **Descrição** | Cria uma nova reserva (solicitação ou instantânea) |
| **Autenticação** | Guest |
| **Body** | ```json<br>{<br>  "propertyId": "uuid",<br>  "checkInDate": "2024-03-01",<br>  "checkOutDate": "2024-03-05",<br>  "numberOfGuests": 2,<br>  "specialRequests": "Check-in antecipado, por favor",<br>  "paymentMethodId": "pm_xxx"<br>}<br>``` |
| **Resposta 201** | ```json<br>{<br>  "id": "uuid",<br>  "propertyId": "uuid",<br>  "guestId": "uuid",<br>  "hostId": "uuid",<br>  "checkInDate": "2024-03-01",<br>  "checkOutDate": "2024-03-05",<br>  "numberOfGuests": 2,<br>  "numberOfNights": 4,<br>  "pricePerNight": 250.00,<br>  "cleaningFee": 50.00,<br>  "serviceFee": 105.00,<br>  "totalPrice": 1155.00,<br>  "currency": "BRL",<br>  "status": "pending",<br>  "specialRequests": "Check-in antecipado, por favor",<br>  "createdAt": "2024-02-01T10:00:00Z"<br>}<br>``` |
| **Erros** | `400` - Dados inválidos<br>`403` - Usuário não pode reservar própria propriedade<br>`409` - Datas não disponíveis<br>`422` - Validação de negócio falhou |

---

### 5.2 Listar Minhas Reservas (Como Hóspede)

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/bookings/my-trips` |
| **Descrição** | Lista reservas do usuário como hóspede |
| **Autenticação** | Guest |
| **Query Params** | `page=1`<br>`limit=20`<br>`status=pending|confirmed|cancelled|completed`<br>`upcoming=true` (somente futuras) |
| **Resposta 200** | ```json<br>{<br>  "data": [<br>    {<br>      "id": "uuid",<br>      "property": {<br>        "id": "uuid",<br>        "title": "Apartamento Aconchegante",<br>        "coverPhoto": "..."<br>      },<br>      "checkInDate": "2024-03-01",<br>      "checkOutDate": "2024-03-05",<br>      "status": "confirmed",<br>      "totalPrice": 1155.00,<br>      "currency": "BRL"<br>    }<br>  ],<br>  "pagination": {...}<br>}<br>``` |
| **Erros** | `401` - Não autenticado |

---

### 5.3 Listar Reservas das Minhas Propriedades (Como Anfitrião)

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/bookings/my-reservations` |
| **Descrição** | Lista reservas recebidas pelo anfitrião |
| **Autenticação** | Host |
| **Query Params** | `page=1`<br>`limit=20`<br>`status=pending|confirmed|cancelled|completed`<br>`propertyId=uuid` (filtrar por propriedade) |
| **Resposta 200** | Lista paginada de reservas |
| **Erros** | `401` - Não autenticado |

---

### 5.4 Obter Detalhes da Reserva

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/bookings/{bookingId}` |
| **Descrição** | Retorna detalhes completos de uma reserva |
| **Autenticação** | Guest (próprio) / Host (próprio) / Admin |
| **Path Params** | `bookingId` - UUID da reserva |
| **Resposta 200** | ```json<br>{<br>  "id": "uuid",<br>  "property": {...},<br>  "guest": {...},<br>  "host": {...},<br>  "checkInDate": "2024-03-01",<br>  "checkOutDate": "2024-03-05",<br>  "numberOfGuests": 2,<br>  "numberOfNights": 4,<br>  "pricePerNight": 250.00,<br>  "cleaningFee": 50.00,<br>  "serviceFee": 105.00,<br>  "totalPrice": 1155.00,<br>  "currency": "BRL",<br>  "status": "confirmed",<br>  "specialRequests": "...",<br>  "payment": {...},<br>  "createdAt": "2024-02-01T10:00:00Z",<br>  "updatedAt": "2024-02-01T12:00:00Z"<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`404` - Reserva não encontrada |

---

### 5.5 Aprovar Reserva (Host)

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/bookings/{bookingId}/approve` |
| **Descrição** | Aprova solicitação de reserva pendente |
| **Autenticação** | Host (próprio) |
| **Path Params** | `bookingId` - UUID da reserva |
| **Resposta 200** | ```json<br>{<br>  "message": "Reserva aprovada com sucesso",<br>  "status": "confirmed",<br>  "updatedAt": "2024-02-01T12:00:00Z"<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`404` - Reserva não encontrada<br>`422` - Reserva não está pendente |

---

### 5.6 Rejeitar Reserva (Host)

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/bookings/{bookingId}/reject` |
| **Descrição** | Rejeita solicitação de reserva pendente |
| **Autenticação** | Host (próprio) |
| **Path Params** | `bookingId` - UUID da reserva |
| **Body** | ```json<br>{<br>  "reason": "Datas não disponíveis devido a manutenção"<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Reserva rejeitada",<br>  "status": "cancelled",<br>  "cancellationReason": "..."<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`422` - Reserva não está pendente |

---

### 5.7 Cancelar Reserva

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/bookings/{bookingId}/cancel` |
| **Descrição** | Cancela reserva (guest ou host) |
| **Autenticação** | Guest (próprio) / Host (próprio) / Admin |
| **Path Params** | `bookingId` - UUID da reserva |
| **Body** | ```json<br>{<br>  "reason": "Mudança de planos"<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Reserva cancelada",<br>  "status": "cancelled",<br>  "refundAmount": 1000.00,<br>  "refundPolicy": "moderate",<br>  "cancelledBy": "guest",<br>  "cancelledAt": "2024-02-10T10:00:00Z"<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`422` - Cancelamento não permitido (check-in passou) |

---

### 5.8 Modificar Reserva

| Atributo | Valor |
|----------|-------|
| **Método** | `PATCH` |
| **Rota** | `/bookings/{bookingId}` |
| **Descrição** | Modifica datas ou número de hóspedes |
| **Autenticação** | Guest (próprio) |
| **Path Params** | `bookingId` - UUID da reserva |
| **Body** | ```json<br>{<br>  "checkInDate": "2024-03-02",<br>  "checkOutDate": "2024-03-06",<br>  "numberOfGuests": 3<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Modificação enviada para aprovação do anfitrião",<br>  "modificationRequest": {<br>    "newCheckInDate": "2024-03-02",<br>    "newCheckOutDate": "2024-03-06",<br>    "priceDifference": 50.00,<br>    "status": "pending_host_approval"<br>  }<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`422` - Modificação não permitida |

---

## 6. PAGAMENTOS (`/payments`)

### 6.1 Criar Intenção de Pagamento

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/payments/create-intent` |
| **Descrição** | Cria payment intent no Stripe |
| **Autenticação** | Guest |
| **Body** | ```json<br>{<br>  "bookingId": "uuid",<br>  "paymentMethodId": "pm_xxx"<br>}<br>``` |
| **Resposta 201** | ```json<br>{<br>  "clientSecret": "pi_xxx_secret_xxx",<br>  "paymentIntentId": "pi_xxx",<br>  "amount": 115500,<br>  "currency": "brl"<br>}<br>``` |
| **Erros** | `400` - Dados inválidos<br>`422` - Reserva já paga |

---

### 6.2 Confirmar Pagamento

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/payments/{paymentId}/confirm` |
| **Descrição** | Confirma pagamento após 3D Secure |
| **Autenticação** | Guest |
| **Path Params** | `paymentId` - UUID do pagamento |
| **Resposta 200** | ```json<br>{<br>  "message": "Pagamento confirmado",<br>  "status": "succeeded",<br>  "booking": {<br>    "id": "uuid",<br>    "status": "confirmed"<br>  }<br>}<br>``` |
| **Erros** | `400` - Pagamento já processado<br>`422` - Falha no pagamento |

---

### 6.3 Obter Detalhes do Pagamento

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/payments/{paymentId}` |
| **Descrição** | Retorna detalhes de um pagamento |
| **Autenticação** | Payer (próprio) / Recipient (próprio) / Admin |
| **Path Params** | `paymentId` - UUID do pagamento |
| **Resposta 200** | ```json<br>{<br>  "id": "uuid",<br>  "bookingId": "uuid",<br>  "amount": 1155.00,<br>  "currency": "BRL",<br>  "paymentMethod": "credit_card",<br>  "paymentStatus": "succeeded",<br>  "platformFee": 115.50,<br>  "hostPayout": 1039.50,<br>  "processedAt": "2024-02-01T12:00:00Z",<br>  "payoutDate": "2024-03-02"<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`404` - Pagamento não encontrado |

---

### 6.4 Solicitar Reembolso

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/payments/{paymentId}/refund` |
| **Descrição** | Processa reembolso conforme política de cancelamento |
| **Autenticação** | Admin (normalmente automático via cancelamento) |
| **Path Params** | `paymentId` - UUID do pagamento |
| **Body** | ```json<br>{<br>  "reason": "Cancelamento do hóspede",<br>  "amount": 1000.00<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Reembolso processado",<br>  "refundAmount": 1000.00,<br>  "refundedAt": "2024-02-10T15:00:00Z"<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`422` - Reembolso não permitido |

---

### 6.5 Listar Meus Pagamentos

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/payments/me` |
| **Descrição** | Lista pagamentos do usuário (como pagador ou recebedor) |
| **Autenticação** | Autenticado |
| **Query Params** | `page=1`<br>`limit=20`<br>`type=sent|received`<br>`status=succeeded|pending|failed` |
| **Resposta 200** | Lista paginada de pagamentos |
| **Erros** | `401` - Não autenticado |

---

## 7. AVALIAÇÕES (`/reviews`)

### 7.1 Criar Avaliação

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/reviews` |
| **Descrição** | Cria avaliação após estadia concluída |
| **Autenticação** | Guest (para propriedade) / Host (para hóspede) |
| **Body** | ```json<br>{<br>  "bookingId": "uuid",<br>  "reviewType": "property_review",<br>  "rating": 5,<br>  "cleanlinessRating": 5,<br>  "accuracyRating": 5,<br>  "communicationRating": 5,<br>  "locationRating": 4,<br>  "valueRating": 5,<br>  "comment": "Excelente estadia! Tudo impecável."<br>}<br>``` |
| **Resposta 201** | ```json<br>{<br>  "id": "uuid",<br>  "bookingId": "uuid",<br>  "reviewerId": "uuid",<br>  "revieweeId": "uuid",<br>  "propertyId": "uuid",<br>  "reviewType": "property_review",<br>  "rating": 5,<br>  "comment": "...",<br>  "moderationStatus": "pending",<br>  "createdAt": "2024-03-10T10:00:00Z"<br>}<br>``` |
| **Erros** | `400` - Dados inválidos<br>`403` - Não pode avaliar (estadia não concluída)<br>`409` - Avaliação já existe |

---

### 7.2 Listar Avaliações de Propriedade

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/properties/{propertyId}/reviews` |
| **Descrição** | Lista avaliações públicas de uma propriedade |
| **Autenticação** | Público |
| **Path Params** | `propertyId` - UUID da propriedade |
| **Query Params** | `page=1`<br>`limit=20`<br>`sortBy=createdAt|rating`<br>`order=desc|asc` |
| **Resposta 200** | ```json<br>{<br>  "data": [<br>    {<br>      "id": "uuid",<br>      "reviewer": {<br>        "firstName": "João",<br>        "profilePhotoUrl": "..."<br>      },<br>      "rating": 5,<br>      "comment": "Excelente estadia!",<br>      "response": "Obrigado pelo feedback!",<br>      "responseDate": "2024-03-11T10:00:00Z",<br>      "createdAt": "2024-03-10T10:00:00Z"<br>    }<br>  ],<br>  "pagination": {...},<br>  "summary": {<br>    "averageRating": 4.8,<br>    "totalReviews": 32,<br>    "ratingBreakdown": {<br>      "5": 25,<br>      "4": 5,<br>      "3": 2<br>    }<br>  }<br>}<br>``` |
| **Erros** | `404` - Propriedade não encontrada |

---

### 7.3 Listar Avaliações de Usuário

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/users/{userId}/reviews` |
| **Descrição** | Lista avaliações recebidas por um usuário |
| **Autenticação** | Público |
| **Path Params** | `userId` - UUID do usuário |
| **Query Params** | `page=1`<br>`limit=20`<br>`reviewType=property_review|guest_review` |
| **Resposta 200** | Lista paginada de avaliações |
| **Erros** | `404` - Usuário não encontrado |

---

### 7.4 Responder Avaliação (Host)

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/reviews/{reviewId}/respond` |
| **Descrição** | Anfitrião responde a uma avaliação da propriedade |
| **Autenticação** | Host (próprio) |
| **Path Params** | `reviewId` - UUID da avaliação |
| **Body** | ```json<br>{<br>  "response": "Obrigado pelo feedback! Foi um prazer recebê-lo."<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Resposta publicada",<br>  "response": "...",<br>  "responseDate": "2024-03-11T10:00:00Z"<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`404` - Avaliação não encontrada<br>`409` - Já respondeu |

---

### 7.5 Editar Avaliação

| Atributo | Valor |
|----------|-------|
| **Método** | `PATCH` |
| **Rota** | `/reviews/{reviewId}` |
| **Descrição** | Edita avaliação (até 48h após criação) |
| **Autenticação** | Reviewer (próprio) |
| **Path Params** | `reviewId` - UUID da avaliação |
| **Body** | ```json<br>{<br>  "rating": 4,<br>  "comment": "Comentário atualizado..."<br>}<br>``` |
| **Resposta 200** | Objeto da avaliação atualizada |
| **Erros** | `403` - Sem permissão<br>`422` - Prazo de edição expirado |

---

### 7.6 Denunciar Avaliação

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/reviews/{reviewId}/report` |
| **Descrição** | Denuncia avaliação inadequada |
| **Autenticação** | Autenticado |
| **Path Params** | `reviewId` - UUID da avaliação |
| **Body** | ```json<br>{<br>  "reason": "inappropriate_content",<br>  "details": "Linguagem ofensiva"<br>}<br>``` |
| **Resposta 201** | ```json<br>{<br>  "message": "Denúncia enviada para moderação",<br>  "reportId": "uuid"<br>}<br>``` |
| **Erros** | `409` - Já denunciou esta avaliação |

---

## 8. MENSAGENS (`/messages`)

### 8.1 Criar Conversa

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/conversations` |
| **Descrição** | Inicia conversa sobre uma propriedade |
| **Autenticação** | Guest |
| **Body** | ```json<br>{<br>  "propertyId": "uuid",<br>  "message": "Olá, gostaria de mais informações..."<br>}<br>``` |
| **Resposta 201** | ```json<br>{<br>  "conversationId": "uuid",<br>  "propertyId": "uuid",<br>  "guestId": "uuid",<br>  "hostId": "uuid",<br>  "lastMessage": {<br>    "id": "uuid",<br>    "content": "Olá, gostaria de mais informações...",<br>    "senderId": "uuid",<br>    "createdAt": "2024-02-01T10:00:00Z"<br>  }<br>}<br>``` |
| **Erros** | `400` - Dados inválidos<br>`409` - Conversa já existe |

---

### 8.2 Listar Minhas Conversas

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/conversations` |
| **Descrição** | Lista todas as conversas do usuário |
| **Autenticação** | Autenticado |
| **Query Params** | `page=1`<br>`limit=20`<br>`unreadOnly=true` |
| **Resposta 200** | ```json<br>{<br>  "data": [<br>    {<br>      "id": "uuid",<br>      "property": {<br>        "id": "uuid",<br>        "title": "...",<br>        "coverPhoto": "..."<br>      },<br>      "otherParty": {<br>        "id": "uuid",<br>        "firstName": "Maria",<br>        "profilePhotoUrl": "..."<br>      },<br>      "lastMessage": {<br>        "content": "Última mensagem...",<br>        "createdAt": "2024-02-01T15:00:00Z",<br>        "isRead": false<br>      },<br>      "unreadCount": 3<br>    }<br>  ],<br>  "pagination": {...}<br>}<br>``` |
| **Erros** | `401` - Não autenticado |

---

### 8.3 Obter Mensagens de Conversa

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/conversations/{conversationId}/messages` |
| **Descrição** | Lista mensagens de uma conversa |
| **Autenticação** | Participante da conversa |
| **Path Params** | `conversationId` - UUID da conversa |
| **Query Params** | `page=1`<br>`limit=50`<br>`before=message_uuid` (cursor pagination) |
| **Resposta 200** | ```json<br>{<br>  "data": [<br>    {<br>      "id": "uuid",<br>      "conversationId": "uuid",<br>      "senderId": "uuid",<br>      "content": "Olá!",<br>      "attachmentUrl": null,<br>      "isRead": true,<br>      "readAt": "2024-02-01T10:05:00Z",<br>      "createdAt": "2024-02-01T10:00:00Z"<br>    }<br>  ],<br>  "pagination": {...}<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`404` - Conversa não encontrada |

---

### 8.4 Enviar Mensagem

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/conversations/{conversationId}/messages` |
| **Descrição** | Envia mensagem em uma conversa |
| **Autenticação** | Participante da conversa |
| **Path Params** | `conversationId` - UUID da conversa |
| **Body** | ```json<br>{<br>  "content": "Texto da mensagem",<br>  "attachmentUrl": "https://cdn.example.com/image.jpg"<br>}<br>``` |
| **Resposta 201** | ```json<br>{<br>  "id": "uuid",<br>  "conversationId": "uuid",<br>  "senderId": "uuid",<br>  "content": "Texto da mensagem",<br>  "isRead": false,<br>  "createdAt": "2024-02-01T10:10:00Z"<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`422` - Conteúdo vazio |

---

### 8.5 Marcar Mensagens como Lidas

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/conversations/{conversationId}/mark-read` |
| **Descrição** | Marca todas as mensagens como lidas |
| **Autenticação** | Participante da conversa |
| **Path Params** | `conversationId` - UUID da conversa |
| **Resposta 200** | ```json<br>{<br>  "message": "Mensagens marcadas como lidas",<br>  "markedCount": 5<br>}<br>``` |
| **Erros** | `403` - Sem permissão |

---

## 9. ADMINISTRAÇÃO (`/admin`)

### 9.1 Dashboard de Métricas

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/admin/dashboard` |
| **Descrição** | Retorna métricas gerais da plataforma |
| **Autenticação** | Admin |
| **Query Params** | `period=7d|30d|90d|1y` |
| **Resposta 200** | ```json<br>{<br>  "users": {<br>    "total": 10543,<br>    "newThisMonth": 234,<br>    "active": 8321<br>  },<br>  "properties": {<br>    "total": 2456,<br>    "active": 2103,<br>    "pendingApproval": 45<br>  },<br>  "bookings": {<br>    "total": 15432,<br>    "thisMonth": 456,<br>    "revenue": 1234567.89<br>  },<br>  "reviews": {<br>    "total": 8765,<br>    "averageRating": 4.6,<br>    "pendingModeration": 12<br>  }<br>}<br>``` |
| **Erros** | `403` - Sem permissão |

---

### 9.2 Listar Propriedades Pendentes de Aprovação

| Atributo | Valor |
|----------|-------|
| **Método** | `GET` |
| **Rota** | `/admin/properties/pending` |
| **Descrição** | Lista propriedades aguardando aprovação |
| **Autenticação** | Admin / Moderator |
| **Query Params** | `page=1`<br>`limit=20` |
| **Resposta 200** | Lista paginada de propriedades |
| **Erros** | `403` - Sem permissão |

---

### 9.3 Aprovar Propriedade

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/admin/properties/{propertyId}/approve` |
| **Descrição** | Aprova propriedade para publicação |
| **Autenticação** | Admin / Moderator |
| **Path Params** | `propertyId` - UUID da propriedade |
| **Resposta 200** | ```json<br>{<br>  "message": "Propriedade aprovada",<br>  "status": "active"<br>}<br>``` |
| **Erros** | `403` - Sem permissão<br>`422` - Propriedade não está pendente |

---

### 9.4 Rejeitar Propriedade

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/admin/properties/{propertyId}/reject` |
| **Descrição** | Rejeita propriedade com motivo |
| **Autenticação** | Admin / Moderator |
| **Path Params** | `propertyId` - UUID da propriedade |
| **Body** | ```json<br>{<br>  "reason": "Fotos de baixa qualidade"<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Propriedade rejeitada",<br>  "status": "rejected"<br>}<br>``` |
| **Erros** | `403` - Sem permissão |

---

### 9.5 Moderar Avaliação

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/admin/reviews/{reviewId}/moderate` |
| **Descrição** | Aprova ou rejeita avaliação denunciada |
| **Autenticação** | Admin / Moderator |
| **Path Params** | `reviewId` - UUID da avaliação |
| **Body** | ```json<br>{<br>  "action": "approve|reject|hide",<br>  "reason": "Conteúdo inapropriado"<br>}<br>``` |
| **Resposta 200** | ```json<br>{<br>  "message": "Avaliação moderada",<br>  "moderationStatus": "rejected"<br>}<br>``` |
| **Errors** | `403` - Sem permissão |

---

## 10. WEBHOOKS

### 10.1 Webhook do Stripe

| Atributo | Valor |
|----------|-------|
| **Método** | `POST` |
| **Rota** | `/webhooks/stripe` |
| **Descrição** | Recebe eventos do Stripe (payment_intent.succeeded, etc) |
| **Autenticação** | Stripe Signature |
| **Headers** | `Stripe-Signature: signature` |
| **Body** | Stripe Event Object |
| **Resposta 200** | ```json<br>{<br>  "received": true<br>}<br>``` |

---

## Resumo de Endpoints por Recurso

| Recurso | Total de Endpoints |
|---------|-------------------|
| Autenticação | 6 |
| Usuários | 9 |
| Propriedades | 12 |
| Busca | 3 |
| Reservas | 8 |
| Pagamentos | 5 |
| Avaliações | 6 |
| Mensagens | 5 |
| Administração | 5 |
| **TOTAL** | **59 endpoints** |

---

## Boas Práticas Implementadas

✅ **Versionamento da API** (`/v1`)  
✅ **Autenticação JWT** com refresh tokens  
✅ **Paginação consistente** em todas as listagens  
✅ **Filtros e ordenação** padronizados  
✅ **Códigos HTTP semânticos**  
✅ **Soft delete** onde aplicável  
✅ **Rate limiting** (implementado no API Gateway)  
✅ **CORS** configurado adequadamente  
✅ **HATEOAS** (links para recursos relacionados nas respostas)  
✅ **Idempotência** em operações críticas (pagamentos)  
✅ **Webhooks** para integrações assíncronas  
✅ **Documentação OpenAPI/Swagger** (gerada automaticamente)  

Esta API REST foi projetada seguindo os princípios RESTful, com endpoints intuitivos, semântica clara e respostas consistentes para garantir uma excelente experiência de desenvolvimento.