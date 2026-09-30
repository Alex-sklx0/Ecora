# ecora — Especificación técnica (specs v4)


## 0. Insumos del proyecto

El agente implementador recibirá:

1. **Capturas de wireframes de Figma** (imágenes).
2. **Este documento `specs.md`** (con esquema de BD, endpoints y lógica de negocio).
3. **Diagrama relacional en PNG** (imagen con fondo blanco, entregado aparte de este documento). El PNG es la **fuente de verdad visual** para el modelo de datos; las tablas descritas aquí deben coincidir con él.
4. **Archivo `.env`** con credenciales reales (Supabase, Stripe, Better-Auth secret, etc.).

---

## 1. Convenciones generales


### 1.1 Envoltura de respuestas

| Contexto | Formato |
|---|---|
| Éxito (todo `/api/*`, excepto `/api/auth/*`) | `{ "ok": true, "mensaje": "string", ...payload }` |
| Error (todo `/api/*`, excepto `/api/auth/*`) | `{ "ok": false, "error": "string" }` |
| `GET /health` (fuera de `/api`) | `{ "service": "ecora-backend", "status": "ok" }` |

- Todos los cuerpos son `application/json`.
- Límite de cuerpo: `express.json({ limit: '10mb' })` (imágenes en base64).
- CORS con credenciales habilitadas (necesario para Better-Auth): `cors({ origin: 'http://localhost:5173', credentials: true })`.
- Sin paginación en listados (prototipo).

> **Excepción**: los endpoints bajo `/api/auth/*` son **propiedad de Better-Auth** y usan su propio formato de respuesta. No se envuelven con `{ ok, mensaje }`.

### 1.2 Autenticación — Better-Auth

**Better-Auth** gestiona el registro, login, sesión y logout. **No se usa `localStorage`** para la sesión; se usan **cookies httpOnly** emitidas por Better-Auth.

**Configuración base**:
- Adaptador: `drizzleAdapter` o `postgresAdapter` apuntando a Supabase (según lo que permita la versión de Better-Auth).
- Tablas de Better-Auth: `user`, `session`, `account`, `verification` (nombres por defecto).
  - La tabla `user` de Better-Auth **reemplaza** a la antigua `usuarios`. El resto del modelo (`empresas`, `personas`, `subproductos`, `intercambios`) usa `user.id` como FK.
- Estrategia: email + password (mínimo 8 caracteres).
- Cookies: `httpOnly`, `sameSite: 'lax'`, `secure` en producción.

**Endpoints gestionados por Better-Auth** (no los implementa el agente manualmente; los expone Better-Auth):

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `/api/auth/sign-up/email` | Registro |
| `POST` | `/api/auth/sign-in/email` | Login |
| `POST` | `/api/auth/sign-out` | Logout |
| `GET`  | `/api/auth/get-session` | Devuelve la sesión actual (o `null`) |

**Middleware propio del backend**:
- `requireAuth`: valida la sesión con `auth.api.getSession({ headers })`. Si no hay sesión ⇒ `401`.
- `optionalAuth`: igual pero no falla si no hay sesión.

**Reglas**:
- El backend **nunca** confía en un `id_usuario` enviado en el body. El `user.id` se obtiene **siempre** de la sesión.
- Los perfiles (`empresas`, `personas`) se asocian al usuario autenticado usando `session.user.id`.
- Un usuario autenticado **puede tener** perfil de empresa, de persona, o ninguno (si acaba de registrarse y aún no completa el perfil).

### 1.3 Manejo de errores

Middleware `errorHandler` traduce errores de Postgres/PostgREST y de Stripe a mensajes amigables.

| Código | Mensaje al usuario |
|---|---|
| `23505` (UNIQUE) | "Ya existe un registro con esa información. Verifica los datos e intenta de nuevo." |
| `23503` (FK) | "No se encontró un registro relacionado." |
| `23502` (NOT NULL) | "Falta un campo obligatorio." |
| `23514` (CHECK) | "Los datos no cumplen con las restricciones del sistema." |
| `PGRST116` | "El recurso solicitado no fue encontrado." |
| Stripe `card_declined` | "La tarjeta fue rechazada. Intenta con otro medio de pago." |
| Stripe `expired_card` | "La tarjeta está vencida." |
| Stripe genérico | "No se pudo procesar el pago. Intenta de nuevo." |

### 1.4 Resolución de catálogos por nombre o ID

Los catálogos (`familias_material`, `unidades_medida`, `municipios`) se pueden enviar como **ID numérico** o **nombre en texto**. El backend intenta resolver de las dos formas:

1. Vacío/null → no filtra.
2. Entero → busca por `id`.
3. Texto → busca con `ilike` por nombre (con fallback sin tildes y minúsculas).
4. No encuentra → `400`.

### 1.5 Almacenamiento de imágenes

Bucket: **`Imagenes`** (Supabase Storage).

| Paso | Comportamiento |
|---|---|
| 1 | El frontend lee el archivo con `FileReader.readAsDataURL()` → Data URI. |
| 2 | Si ya es `http(s)://`, se devuelve tal cual. |
| 3 | Si es Data URI, se decodifica a `Buffer` y se genera `subproductos/<uuid>.<ext>`. |
| 4 | Se guarda la URL pública en `subproductos.foto_url`. |
| 5 | Al reemplazar o eliminar, se borra el archivo anterior. |
| 6 | Límite: 5 MB por archivo (frontend), 10 MB de cuerpo (backend). |

---

## 2. Modelo de dominio

### 2.1 Entidades (esquema real de Supabase)

> El **diagrama relacional en PNG** (entregado aparte) es la fuente de verdad visual. Esta tabla debe coincidir con él.

| Entidad | Columnas | Tipos |
|---|---|---|
| **`user`** (Better-Auth) | `id`, `email`, `name`, `emailVerified`, `image`, `createdAt`, `updatedAt` | Según Better-Auth |
| **`session`** (Better-Auth) | `id`, `userId`, `expiresAt`, `token`, `ipAddress`, `userAgent` | Según Better-Auth |
| **`account`** (Better-Auth) | `id`, `userId`, `providerId`, `accountId`, `password` | Según Better-Auth |
| **`empresas`** | `id`, `id_usuario`, `nombre`, `nit`, `id_municipio`, `id_rol`, `medio_contacto`, `stripe_customer_id` | `BIGSERIAL PK`, `TEXT FK → user.id`, `VARCHAR(150)`, `VARCHAR(20) UNIQUE`, `BIGINT FK → municipios`, `BIGINT FK → roles`, `VARCHAR(150)`, `VARCHAR(100)` |
| **`personas`** | `id`, `id_usuario`, `nombre`, `cedula`, `id_municipio`, `id_rol` | `BIGSERIAL PK`, `TEXT FK → user.id`, `VARCHAR(150)`, `VARCHAR(20) UNIQUE`, `BIGINT FK → municipios`, `BIGINT FK → roles` |
| **`roles`** | `id`, `nombre` | `BIGSERIAL PK`, `VARCHAR(30) UNIQUE` |
| **`municipios`** | `id`, `nombre` | `BIGSERIAL PK`, `VARCHAR(100) UNIQUE` |
| **`familias_material`** | `id`, `nombre` | `BIGSERIAL PK`, `VARCHAR(100) UNIQUE` |
| **`unidades_medida`** | `id`, `nombre`, `abreviatura` | `BIGSERIAL PK`, `VARCHAR(50)`, `VARCHAR(10) UNIQUE` |
| **`subproductos`** | `id`, `id_empresa`, `nombre`, `id_familia_material`, `volumen_disponible`, `id_unidad_medida`, `descripcion`, `id_municipio`, `direccion`, `fecha_registro`, `precio_inicial`, `foto_url`, `disponible` | `BIGSERIAL PK`, `BIGINT FK → empresas`, `VARCHAR(150)`, `BIGINT FK → familias_material`, `NUMERIC(12,3) CHECK >= 0`, `BIGINT FK → unidades_medida`, `TEXT`, `BIGINT FK → municipios`, `VARCHAR(200)`, `TIMESTAMPTZ DEFAULT NOW()`, `NUMERIC(12,2) CHECK >= 0`, `VARCHAR(500)`, `BOOLEAN DEFAULT TRUE` |
| **`intercambios`** | `id`, `id_subproducto`, `id_usuario_comprador`, `id_usuario_vendedor`, `fecha_intercambio`, `precio_final`, `stripe_session_id`, `stripe_payment_intent_id`, `estado_pago` | `BIGSERIAL PK`, `BIGINT FK → subproductos`, `TEXT FK → user.id`, `TEXT FK → user.id`, `TIMESTAMPTZ`, `NUMERIC(12,2) CHECK >= 0`, `VARCHAR(255)`, `VARCHAR(255)`, `VARCHAR(30) CHECK IN ('pendiente','pagado','fallido','reembolsado')` |

**Restricciones clave**:
- `CHECK (id_usuario_comprador <> id_usuario_vendedor)` en `intercambios`.
- `UNIQUE (stripe_session_id)` en `intercambios`.

> **Nota**: `foto_url`, `disponible` y `medio_contacto` se agregaron al esquema base como `ALTER TABLE` (ver §2.5).

### 2.2 Catálogos fijos

**Roles**: `1 GENERADOR · 2 TRANSFORMADOR · 3 RECICLADOR`

**Municipios del Valle de Aburrá** (IDs 1–10): Medellín, Bello, Itagüí, Envigado, Sabaneta, Copacabana, Barbosa, Caldas, La Estrella, Girardota.

**Familias de material**: `1 Papel y cartón · 2 Plásticos · 3 Vidrio · 4 Metales · 5 Textiles · 6 Madera`

**Unidades de medida**: `1 kg · 2 t · 3 m3`

> En el prototipado textil, **la familia usada es `5` (Textiles)** y la unidad por defecto es **`kg`**. El resto queda como *coming soon*.

### 2.3 Reglas de negocio

| # | Regla |
|---|---|
| RB-01 | Email único y normalizado (Better-Auth lo gestiona). |
| RB-02 | Password mínimo 8 caracteres (Better-Auth). |
| RB-03 | Login sin filtración: mismo `401` para email inexistente y password incorrecta. |
| RB-04 | NIT normalizado y único ⇒ duplicado `409`. |
| RB-05 | Empresa: solo rol `1` o `2`. |
| RB-06 | Persona natural: solo rol `2` o `3`. Default `3`. |
| RB-07 | Municipio por defecto: `1` (Medellín). |
| RB-08 | **Solo empresas publican subproductos** (persona ⇒ `403`). |
| RB-09 | `volumen_disponible >= 0` al crear; `> 0` al editar. |
| RB-10 | `precio_inicial >= 0`. |
| RB-11 | Propiedad validada en PATCH/DELETE: el subproducto debe pertenecer a la empresa del usuario autenticado. |
| RB-12 | Lista blanca en PATCH. |
| RB-13 | Al eliminar subproducto se borra su foto de Storage. |
| RB-14 | Al eliminar cuenta, cascada manual + Better-Auth se encarga de `session`/`account`. |
| RB-15 | Catálogo ordenado por `fecha_registro` desc. |
| RB-16 | **El comprador no puede ser el vendedor**. |
| RB-17 | **El vendedor debe ser el dueño del subproducto**. |
| RB-18 | **Un intercambio nace en `estado_pago = 'pendiente'`**; solo pasa a `'pagado'` cuando el webhook de Stripe lo confirma. |
| RB-19 | **Al confirmar el pago, el subproducto se marca `disponible = false`** para evitar doble venta. |
| RB-20 | **Solo usuarios autenticados pueden comprar** (Stripe Checkout requiere `customer_email`). |
| RB-21 | Búsqueda del catálogo por nombre; sin debounce real (prototipo). |

### 2.4 Validación de formularios (frontend, Zod)

| Esquema | Reglas |
|---|---|
| `subproductoSchema` | `nombre ≥ 1` · `id_familia_material ≥ 1` · `volumen_disponible > 0` · `id_unidad_medida ≥ 1` · `id_municipio ≥ 1` · `precio_inicial ≥ 0` · `descripcion` opcional |
| `empresaRegistroSchema` | `razon_social` · `nit` · `email` válido · `password ≥ 8` · `aceptar_terminos === true` |
| `personaRegistroSchema` | `nombre_completo` · `email` válido · `password ≥ 8` · `aceptar_terminos === true` |
| `loginSchema` | `email` válido · `password ≥ 8` |
| `checkoutSchema` | `id_subproducto ≥ 1` · `precio_final ≥ 0` |

### 2.5 Migraciones adicionales sobre el esquema actual

```sql
-- Campos extra que el modelo necesita
ALTER TABLE subproductos ADD COLUMN IF NOT EXISTS foto_url   VARCHAR(500);
ALTER TABLE subproductos ADD COLUMN IF NOT EXISTS disponible BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE empresas    ADD COLUMN IF NOT EXISTS medio_contacto    VARCHAR(150);
ALTER TABLE empresas    ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100);

-- Campos de pago en intercambios
ALTER TABLE intercambios ADD COLUMN IF NOT EXISTS stripe_session_id        VARCHAR(255);
ALTER TABLE intercambios ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE intercambios ADD COLUMN IF NOT EXISTS estado_pago              VARCHAR(30) NOT NULL DEFAULT 'pendiente';
ALTER TABLE intercambios ADD CONSTRAINT chk_estado_pago
    CHECK (estado_pago IN ('pendiente','pagado','fallido','reembolsado'));
ALTER TABLE intercambios ADD CONSTRAINT uq_stripe_session UNIQUE (stripe_session_id);
```

---

## 3. Flujos de negocio (end-to-end)

### 3.1 Registro como empresa

```
/pre-register  →  /company-registration
   1. POST /api/auth/sign-up/email   { email, password, name }   → 200 + cookie de sesión
   2. POST /api/empresas             { nombre, nit, id_municipio, id_rol }  → 201
        (el backend toma id_usuario de la sesión, no del body)
   3. Redirect → /catalogo
```

### 3.2 Registro como persona natural

```
/pre-register  →  /person-registration
   1. POST /api/auth/sign-up/email  { email, password, name }   → 200 + cookie
   2. POST /api/personas            { nombre, cedula, id_municipio, id_rol }  → 201
   3. Redirect → /catalogo
```

### 3.3 Inicio de sesión

```
/login
   POST /api/auth/sign-in/email { email, password }  → 200 + cookie
   GET  /api/usuarios/me                              → perfil + empresa/persona asociada
   Redirect → /catalogo
```

### 3.4 Publicar un subproducto (solo empresas)

```
/publicar   (requiere sesión + perfil de empresa)
   1. Validación Zod
   2. POST /api/subproductos { nombre, ..., precio_inicial, image_base64? }
        (el backend resuelve id_empresa desde la sesión)
   3. Redirect → /catalogo
```

### 3.5 Consultar catálogo

```
/catalogo
   GET /api/catalogo?q=&familia=&municipio=&precio_min=&precio_max=
```

### 3.6 Detalle de un subproducto

```
/catalogo/:id → GET /api/subproductos/:id
```

### 3.7 Mis publicaciones (empresas)

```
/perfil → GET /api/subproductos/mis-publicaciones
   (el backend resuelve id_empresa desde la sesión)
```

### 3.8 Editar / desactivar / eliminar subproducto

```
/subproductos/:id/editar
   GET   /api/subproductos/:id
   PATCH /api/subproductos/:id     (sin id_empresa en body; va en sesión)
   DELETE /api/subproductos/:id
```

### 3.9 **Comprar un subproducto (flujo Stripe)**

```
/catalogo/:id → "Comprar"
   1. Guard: usuario autenticado, no dueño, subproducto.disponible = true.
   2. POST /api/stripe/checkout
      { id_subproducto, precio_final }
      → 200 { ok: true, url: "https://checkout.stripe.com/..." }
   3. Redirect del navegador a esa URL.
   4. Usuario paga en Stripe.
   5. Stripe redirige a:
        - Éxito → /pago/exito?session_id={CHECKOUT_SESSION_ID}
        - Cancel → /pago/cancelado
   6. En paralelo, Stripe llama al webhook:
        POST /api/stripe/webhook
        → verifica firma → crea fila en `intercambios` con estado_pago='pagado'
        → marca subproducto.disponible = false
   7. La página /pago/exito consulta GET /api/intercambios/:id y muestra resumen.
```

**Nota**: la fila en `intercambios` se crea **al confirmar el pago** (desde el webhook), no al iniciar el checkout. Esto evita registros huérfanos si el usuario abandona el pago. Opcionalmente se puede crear en `pendiente` al iniciar el checkout y actualizarla en el webhook — se deja a criterio del implementador, pero debe documentarse.

### 3.10 Historial de compras y ventas

```
/perfil → pestaña "Compras" / "Ventas"
   GET /api/intercambios?rol=comprador
   GET /api/intercambios?rol=vendedor
```

### 3.11 Eliminar cuenta

```
DELETE /api/usuarios/me
   → cascada: subproductos → empresas/personas → user (Better-Auth)
   → POST /api/auth/sign-out
   → Redirect /login
```

### 3.12 Cerrar sesión

```
POST /api/auth/sign-out → Redirect /login
```

---

## 4. Especificación de endpoints

Convenciones: `Body` = JSON. `?` = opcional. Todos bajo `/api` salvo `/health`. Los endpoints bajo `/api/auth/*` los sirve Better-Auth; los demás son propios.

### 4.0 `GET /health`

```json
{ "service": "ecora-backend", "status": "ok" }
```

### 4.1 Autenticación (Better-Auth)

Ver §1.2. Rutas: `/api/auth/sign-up/email`, `/api/auth/sign-in/email`, `/api/auth/sign-out`, `/api/auth/get-session`.

### 4.2 `GET /api/usuarios/me` — Perfil del usuario autenticado

**Auth**: `requireAuth`.

**Success `200`**:
```json
{
  "ok": true,
  "usuario": { "id": "usr_...", "email": "...", "name": "..." },
  "tipo_usuario": "empresa",
  "empresa": { "id": 5, "nombre": "Fibretex", "nit": "...", "medio_contacto": "..." },
  "persona": null
}
```

`tipo_usuario` ∈ `"empresa" | "persona" | "sin_perfil"`.

### 4.3 `DELETE /api/usuarios/me` — Eliminar cuenta

**Auth**: `requireAuth`. Cascada manual + Better-Auth. Sin verificación adicional (prototipo).

**Success `200`**: `{ ok: true, mensaje: "Cuenta eliminada" }`.

### 4.4 `POST /api/empresas` — Registrar empresa

**Auth**: `requireAuth` (`id_usuario` sale de la sesión).

**Request**:
```json
{ "nombre": "Fibretex S.A.S.", "nit": "900.123.456-1",
  "id_municipio": 1, "id_rol": 1, "medio_contacto": "https://wa.me/..." }
```

**Success `201`**: `{ ok, mensaje, empresa: { id, id_usuario, nombre, nit, id_municipio, id_rol, medio_contacto } }`.

**Errores**: `400` · `409` NIT duplicado · `500`.

### 4.5 `POST /api/personas` — Registrar persona natural

**Auth**: `requireAuth`.

**Request**: `{ nombre, cedula, id_municipio, id_rol }`.

**Success `201`**: `{ ok, mensaje, persona: { ... } }`.

### 4.6 `POST /api/subproductos` — Registrar subproducto

**Auth**: `requireAuth` + perfil de empresa.

**Request**:
```json
{
  "nombre": "Retazos de algodón",
  "descripcion": "Lote mensual, sin humedad.",
  "id_familia_material": 5,
  "volumen_disponible": 250,
  "id_unidad_medida": 1,
  "id_municipio": 1,
  "direccion": "Calle 10 #20-30",
  "precio_inicial": 1500,
  "image_base64": "data:image/jpeg;base64,..."
}
```

**Success `201`**: `{ ok, mensaje, subproducto: { ... } }`.

**Errores**: `400` · `401` sin sesión · `403` sin perfil de empresa · `404` catálogo no existe · `500`.

### 4.7 `POST /api/subproductos/upload` — Subir imagen aislada

**Auth**: `requireAuth`. Misma forma que v3.

### 4.8 `GET /api/subproductos/mis-publicaciones`

**Auth**: `requireAuth` + perfil de empresa (el `id_empresa` sale de la sesión).

### 4.9 `GET /api/subproductos/:id` — Detalle

**Auth**: opcional.

### 4.10 `PATCH /api/subproductos/:id` — Actualizar

**Auth**: `requireAuth` + propiedad (la del usuario autenticado).

### 4.11 `DELETE /api/subproductos/:id` — Eliminar

**Auth**: `requireAuth` + propiedad.

### 4.12 `GET /api/catalogo`

**Auth**: opcional. Filtros: `q`, `familia`, `municipio`, `precio_min`, `precio_max`. Orden `fecha_registro` desc.

### 4.13 **`POST /api/stripe/checkout` — Iniciar checkout (nuevo)**

**Auth**: `requireAuth`.

**Request**:
```json
{ "id_subproducto": 31, "precio_final": 1500 }
```

- Valida que el subproducto exista, esté `disponible = true`, y que el usuario **no sea** el dueño.
- Valida que el usuario tenga perfil (`empresa` o `persona`) para asociar `customer_email`.

**Backend**:
- Crea (o reutiliza) un `stripe_customer_id` para el usuario.
- Llama a `stripe.checkout.sessions.create` con:
  - `mode: 'payment'`
  - `line_items: [{ price_data: { currency: 'cop', product_data: { name: <nombre subproducto> }, unit_amount: <precio_final * 100> }, quantity: 1 }]`
  - `success_url: ${FRONTEND_URL}/pago/exito?session_id={CHECKOUT_SESSION_ID}`
  - `cancel_url: ${FRONTEND_URL}/pago/cancelado`
  - `metadata: { id_subproducto, id_usuario_comprador, id_usuario_vendedor }`
  - `customer: <stripe_customer_id>`
  - `payment_intent_data: { metadata: { id_subproducto, ... } }`

**Success `200`**:
```json
{ "ok": true, "url": "https://checkout.stripe.com/c/pay/cs_test_..." }
```

**Errores**: `400` · `401` · `403` (es dueño o subproducto no disponible) · `404` · `500`.

### 4.14 **`POST /api/stripe/webhook` — Webhook de Stripe (nuevo)**

**Auth**: **ninguna** (Stripe firma con `Stripe-Signature`).

**Headers**: `Stripe-Signature`.

**Body**: raw (no JSON parseado antes de verificar).

**Backend**:
1. Verifica firma con `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`.
2. Si falla ⇒ `400`.
3. Si `event.type === 'checkout.session.completed'`:
   - Extrae `session.metadata` (`id_subproducto`, `id_usuario_comprador`, `id_usuario_vendedor`).
   - Extrae `session.id`, `session.payment_intent`, `session.amount_total / 100`.
   - Inserta fila en `intercambios` con `estado_pago = 'pagado'` (idempotente: si ya existe `stripe_session_id`, no duplica).
   - Marca `subproductos.disponible = false`.
4. Si `event.type === 'checkout.session.expired'` o `payment_intent.payment_failed`:
   - Marca `estado_pago = 'fallido'` si existe la fila.
5. Responde `200` siempre que la firma sea válida (aunque haya error de negocio).

**Success `200`**: `{ received: true }`.

### 4.15 `GET /api/intercambios` — Listar intercambios

**Auth**: `requireAuth`. El `id_usuario` sale de la sesión.

**Query**: `?rol=comprador|vendedor` (opcional).

**Success `200`**:
```json
{
  "ok": true,
  "intercambios": [
    {
      "id": 1,
      "id_subproducto": 31,
      "id_usuario_comprador": "usr_...",
      "id_usuario_vendedor": "usr_...",
      "fecha_intercambio": "2026-09-27T15:00:00.000Z",
      "precio_final": 1500,
      "estado_pago": "pagado",
      "stripe_session_id": "cs_test_...",
      "subproducto": { "id": 31, "nombre": "Retazos de algodón", "foto_url": "..." },
      "contraparte": { "id": "usr_...", "nombre": "Fibretex S.A.S." }
    }
  ]
}
```

### 4.16 `GET /api/intercambios/:id` — Detalle

**Auth**: `requireAuth` + el usuario debe ser comprador o vendedor.

### 4.17 Tabla resumen de endpoints

| Método | Ruta | Auth | Éxito |
|---|---|---|---|
| `GET` | `/health` | — | `200` |
| `POST` | `/api/auth/sign-up/email` | — | `200` |
| `POST` | `/api/auth/sign-in/email` | — | `200` |
| `POST` | `/api/auth/sign-out` | sesión | `200` |
| `GET`  | `/api/auth/get-session` | opcional | `200` |
| `GET`  | `/api/usuarios/me` | sesión | `200` |
| `DELETE` | `/api/usuarios/me` | sesión | `200` |
| `POST` | `/api/empresas` | sesión | `201` |
| `POST` | `/api/personas` | sesión | `201` |
| `POST` | `/api/subproductos` | sesión + empresa | `201` |
| `POST` | `/api/subproductos/upload` | sesión | `200` |
| `GET`  | `/api/subproductos/mis-publicaciones` | sesión + empresa | `200` |
| `GET`  | `/api/subproductos/:id` | opcional | `200` |
| `PATCH` | `/api/subproductos/:id` | sesión + propietario | `200` |
| `DELETE` | `/api/subproductos/:id` | sesión + propietario | `200` |
| `GET`  | `/api/catalogo` | opcional | `200` |
| **`POST`** | **`/api/stripe/checkout`** | **sesión** | **`200`** |
| **`POST`** | **`/api/stripe/webhook`** | **firma Stripe** | **`200`** |
| `GET`  | `/api/intercambios` | sesión | `200` |
| `GET`  | `/api/intercambios/:id` | sesión + participante | `200` |

---

## 5. Forma del objeto `subproducto` enriquecido

Igual que v3 + `precio_inicial`, `foto_url`, `disponible`.

---

## 6. Forma del objeto `intercambio` enriquecido

| Campo | Tipo | Origen |
|---|---|---|
| `id` | number | `intercambios.id` |
| `id_subproducto` | number | columna |
| `id_usuario_comprador` | string | `user.id` |
| `id_usuario_vendedor` | string | `user.id` |
| `fecha_intercambio` | string ISO | columna |
| `precio_final` | number | columna |
| `estado_pago` | string | `pendiente` / `pagado` / `fallido` / `reembolsado` |
| `stripe_session_id` | string \| null | columna |
| `stripe_payment_intent_id` | string \| null | columna |
| `subproducto` | object | join |
| `comprador` | `{ id, nombre }` | join |
| `vendedor` | `{ id, nombre }` | join |
| `contraparte` | `{ id, nombre }` | según `rol` |

---

## 7. Rutas del frontend

| URL | Componente | Sesión | Tipo |
|---|---|---|---|
| `/` | Splash | no | — |
| `/splash`, `/splash1..3` | Onboarding | no | — |
| `/pre-register` | Elegir tipo | no | — |
| `/person-registration` | Registro persona | no | — |
| `/company-registration` | Registro empresa | no | — |
| `/login` | Login | no | — |
| `/catalogo` | Catálogo | no | ambos |
| `/catalogo/:id` | Detalle + botón Comprar | no | ambos |
| `/publicar` | Publicar | sí | empresa |
| `/subproductos/:id/editar` | Editar | sí | empresa |
| `/perfil` | Perfil + Compras + Ventas | sí | ambos |
| `/intercambios/:id` | Detalle intercambio | sí | ambos |
| **`/pago/exito`** | Confirmación de pago | sí | ambos |
| **`/pago/cancelado`** | Pago cancelado | sí | ambos |
| `*` | NotFound | — | — |

---

## 8. Configuración

| Variable | Dónde | Default | Notas |
|---|---|---|---|
| `PORT` | `backend/.env` | `8000` | — |
| `SUPABASE_URL` | `backend/.env` | — | Requerida |
| `SUPABASE_SERVICE_ROLE_KEY` | `backend/.env` | — | Requerida |
| `DATABASE_URL` | `backend/.env` | — | Cadena Postgres para Better-Auth |
| `BETTER_AUTH_SECRET` | `backend/.env` | — | Requerida |
| `BETTER_AUTH_URL` | `backend/.env` | `http://localhost:8000` | — |
| `STRIPE_SECRET_KEY` | `backend/.env` | — | Requerida |
| `STRIPE_WEBHOOK_SECRET` | `backend/.env` | — | Requerida |
| `FRONTEND_URL` | `backend/.env` | `http://localhost:5173` | Para `success_url` y CORS |
| `VITE_API_BASE_URL` | `frontend/.env` | `http://localhost:8000/api` | — |

`docker-compose.yml`: 2 servicios (`frontend:5173`, `backend:8000`).

---



## 10. Glosario

| Término | Significado |
|---|---|
| **Subproducto** | Material sólido con valor que hoy se descarta. |
| **Familia** | Categoría del material. |
| **Precio inicial** | Precio base publicado por el vendedor. |
| **Intercambio** | Transacción entre comprador y vendedor. |
| **Precio final** | Precio al que se cierra el intercambio. |
| **Stripe Checkout** | Sesión de pago hospedada por Stripe. |
| **Webhook** | Notificación de Stripe al backend cuando ocurre un evento. |
| **estado_pago** | `pendiente`, `pagado`, `fallido`, `reembolsado`. |
| **Better-Auth** | Librería de autenticación con cookies httpOnly. |
