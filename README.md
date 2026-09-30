# Ecora — Plataforma B2B de Intercambio de Subproductos Industriales

Plataforma web de economía circular B2B para la publicación, negociación e intercambio de subproductos industriales.

---

## 🛠️ Stack Técnico

- **Frontend**: React + TypeScript + Vite + React Router v6.
- **Backend**: Express + TypeScript + Zod.
- **Base de datos**: PostgreSQL hospedado en Supabase (`DATABASE_URL`).
- **Autenticación**: Better-Auth (sesiones con cookies httpOnly).
- **Almacenamiento de archivos**: Supabase Storage (bucket `Imagenes`).
- **Pasarela de Pagos**: Stripe Checkout + Webhook en tiempo real.
- **Orquestación local**: Docker Compose (services `frontend` y `backend`).

---

## 🚀 Guía de Arranque Local con Docker

### 1. Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto copiando la plantilla `.env.example`:

```bash
cp .env.example .env
```

Asegúrate de configurar las variables reales:

```env
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# Base de datos (Connection Pooling recomendado)
DATABASE_URL=postgresql://postgres.<proyecto>:<password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Better-Auth
BETTER_AUTH_SECRET=un_secreto_aleatorio_de_minimo_32_caracteres
BETTER_AUTH_URL=http://localhost:8000
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5173

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=cop

# Frontend (Vite)
VITE_API_BASE_URL=http://localhost:8000/api
```

---

### 2. Migración SQL en Supabase

Antes de iniciar la aplicación por primera vez, ejecuta el script SQL ubicado en `docs/migracion_fase3.sql` en el **SQL Editor** de la consola de Supabase.

Este script creará:
- Tabla `frecuencia_producto` (1: Una sola vez, 2: Diario, 3: Semanal, 4: Mensual).
- Columnas `foto_url`, `disponible`, `id_frecuencia` en `subproductos`.
- Columnas `stripe_customer_id` en `empresas`.
- Columnas `stripe_session_id`, `stripe_payment_intent_id`, `estado_pago` en `intercambios`.

---

### 3. Levantar los servicios con Docker Compose

En la raíz del proyecto ejecuta:

```bash
docker-compose up --build
```

Los servicios estarán disponibles en:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000/api](http://localhost:8000/api)
- **Healthcheck**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Flujo de Prueba End-to-End

1. **Registro de Empresa Vendedora**:
   - Ingresa a `http://localhost:5173/pre-register`.
   - Selecciona **Empresa**.
   - Completa el formulario de la empresa (Ej. *Fibretex*, NIT `900.123.456-1`, Tipo *Generador*, Email `vendedor@ecora.com`, Clave `Password123*`).
   - Al enviar, serás redirigido al catálogo.

2. **Publicar Subproducto**:
   - Haz clic en `+ Publicar` en el Navbar.
   - Completa el formulario (Ej. *Recortes de algodón*, Cantidad `250`, Frecuencia `Una sola vez`, Municipio `Medellín`, Precio `$1500`, sube una foto).
   - Haz clic en **Publicar**. Serás redirigido al catálogo y verás la tarjeta del producto.

3. **Cerrar Sesión y Registro de Empresa Compradora**:
   - Haz clic en **Salir** en el Navbar.
   - Ingresa a `/pre-register` → **Empresa** (Ej. *Riochevi*, NIT `900.654.321-2`, Tipo *Transformador*, Email `comprador@ecora.com`, Clave `Password123*`).

4. **Detalle y Chat de Negociación**:
   - En el catálogo, haz clic en **Ver detalle** en el subproducto publicado por Fibretex.
   - Verás el botón **Contactar empresa**. Haz clic para abrir la sala de negociación.
   - Interactúa en el chat y haz clic en **Confirmar intercambio** en la tarjeta de solicitud.

5. **Acuerdo de Logística y Pago con Stripe**:
   - Se abrirá el modal *Intercambio acordado*. Haz clic en **Acordar transporte**.
   - Selecciona **Ecora se encarga**, ingresa una dirección exacta (Ej. *Carrera 43A #1-50, Medellín*) y presiona **Continuar al pago**.
   - Serás redirigido a la pasarela hospeda por **Stripe Checkout**.
   - Usa una tarjeta de prueba de Stripe (Ej. `4242 4242 4242 4242`, fecha futura, CVC `123`).
   - Al completar el pago, Stripe te redirige a `/pago/exito`.

6. **Verificación de Reserva e Historial**:
   - Ingresa al catálogo: el subproducto ya **no aparecerá** (marcado `disponible = false`).
   - Ingresa a `/perfil`: verás el resumen de métricas e intercambios.

---

## 📡 Webhooks de Stripe en Desarrollo Local (Opcional)

Para recibir eventos de Stripe en local vía CLI de Stripe:

```bash
stripe listen --events checkout.session.completed,checkout.session.expired \
  --forward-to localhost:8000/api/stripe/webhook
```

Copia el `whsec_...` impreso en consola a la variable `STRIPE_WEBHOOK_SECRET` en tu `.env`.
