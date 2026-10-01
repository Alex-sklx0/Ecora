# 🚀 Guía de Despliegue de Producción — Ecora

Esta guía detalla los pasos para desplegar la arquitectura completa de **Ecora**:
- **Backend**: Express + TypeScript en **Railway** (mediante Docker).
- **Frontend**: React + Vite en **Vercel**.
- **Base de datos & Auth & Realtime**: **Supabase** (PostgreSQL + Better-Auth + Realtime).
- **Pagos**: **Stripe** (Checkout Sessions & Webhooks).

---

## 1. Backend en Railway

1. Inicia sesión en [Railway.app](https://railway.app).
2. Haz clic en **New Project** > **Deploy from GitHub repo** y selecciona el repositorio `Ecora`.
3. Deja el **Root Directory** en la raíz del repositorio (`/`). Railway detectará automáticamente el archivo `railway.toml` y compilará usando `backend/Dockerfile`.
4. Ve a la pestaña **Variables** del servicio e ingresa las siguientes variables de entorno:

| Variable | Valor / Descripción |
| :--- | :--- |
| `PORT` | `8000` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | String de conexión a Supabase (Pooler puerto 6543 o Directo 5432) |
| `SUPABASE_URL` | `https://<PROJECT-REF>.supabase.co` |
| `SUPABASE_SECRET_KEY` | Service Role Secret Key de Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Anon / Publishable Key de Supabase |
| `BETTER_AUTH_SECRET` | Clave secreta aleatoria (mínimo 32 caracteres) |
| `BETTER_AUTH_URL` | URL pública de Railway (ej: `https://ecora-backend.up.railway.app`) |
| `BETTER_AUTH_TRUSTED_ORIGINS`| URL de Vercel (ej: `https://ecora.vercel.app,http://localhost:5173`) |
| `FRONTEND_URL` | URL de Vercel (ej: `https://ecora.vercel.app,http://localhost:5173`) |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe (`sk_live_...` o `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Firma del webhook de Stripe (`whsec_...`) |
| `STRIPE_CURRENCY` | `cop` |

5. Ve a **Settings** > **Networking** > **Generate Domain** para obtener la URL pública del backend (ej. `https://ecora-backend.up.railway.app`).

---

## 2. Frontend en Vercel

1. Inicia sesión en [Vercel.com](https://vercel.com).
2. Haz clic en **Add New...** > **Project** e importa el repositorio `Ecora`.
3. En la configuración del proyecto:
   - **Root Directory**: Haz clic en *Edit* y selecciona `frontend`.
   - **Framework Preset**: `Vite`.
   - **Build Command**: `npm run build` (o `tsc && vite build`).
   - **Output Directory**: `dist`.
4. En **Environment Variables**, agrega:

| Variable | Valor |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://ecora-backend.up.railway.app/api` (la URL generada por Railway + `/api`) |
| `VITE_SUPABASE_URL` | `https://<PROJECT-REF>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` (o `anon key` de Supabase) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` o `pk_live_...` |

5. Haz clic en **Deploy**. Gracias a `frontend/vercel.json`, todas las rutas de React Router SPA funcionarán correctamente sin errores 404 al recargar.

---

## 3. Configuración de Stripe Webhook

1. Entra al [Dashboard de Stripe](https://dashboard.stripe.com) en la sección **Developers** > **Webhooks**.
2. Haz clic en **Add endpoint**.
3. **Endpoint URL**: `https://ecora-backend.up.railway.app/api/stripe/webhook`
4. **Events to listen to**:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
5. Copia el **Signing secret** (`whsec_...`) y actualízalo en la variable `STRIPE_WEBHOOK_SECRET` de Railway.

---

## 4. Configuración de Supabase Storage

1. En el Dashboard de Supabase, ve a **Storage**.
2. Verifica que el bucket `storage` exista y esté configurado como **Public** para que las imágenes de subproductos se puedan visualizar en producción.
3. Asegúrate de que las políticas de Storage permitan `SELECT` público e `INSERT`/`UPDATE` para usuarios autenticados.

---

## 5. Checklist de Verificación Post-Despliegue

- [ ] Abrir la URL de Vercel y verificar que cargue el catálogo.
- [ ] Registrar una cuenta de prueba (Persona o Empresa) e iniciar sesión.
- [ ] Publicar un nuevo subproducto con imagen.
- [ ] Iniciar un chat entre dos usuarios y probar el envío de mensajes en tiempo real.
- [ ] Probar una solicitud de intercambio y completar el checkout de Stripe con tarjeta de prueba.
